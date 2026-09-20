"""
VAYUNET Spatiotemporal Tensor Builder & Anti-Leakage Normalizer
Assembles 12-channel rolling tensors (B, T=4, C=12, H=32, W=32) and multi-task target grids,
enforcing strict chronological train/val/test splits and train-only normalization.
"""

import json
import logging
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional

import numpy as np
import torch

from .config import PipelineConfig
from .raw_processors import TerrainProcessor, SatelliteProcessor, ReanalysisProcessor, GroundTruthProcessor

logger = logging.getLogger(__name__)


class SpatiotemporalTensorBuilder:
    """
    Builds, normalizes, and packages multi-hazard spatiotemporal datasets.
    """
    def __init__(self, config: PipelineConfig):
        self.config = config
        self.terrain_proc = TerrainProcessor(config)
        self.satellite_proc = SatelliteProcessor(config)
        self.reanalysis_proc = ReanalysisProcessor(config)
        self.ground_truth_proc = GroundTruthProcessor(config)

    def build_all_splits(self, max_samples_per_split: Optional[int] = None) -> Dict[str, Path]:
        """
        Executes end-to-end tensor assembly across chronological splits:
        - train: Aug 01 - Aug 11, 2018
        - val:   Aug 12 - Aug 16, 2018
        - test:  Aug 17 - Aug 25, 2018
        """
        logger.info("Initializing terrain base rasters...")
        terrain = self.terrain_proc.process()
        elev = terrain["elevation"]
        slope = terrain["slope"]
        flow = terrain["flow_accumulation"]

        logger.info("Gathering available satellite observation cycles...")
        timestamps = self.satellite_proc.list_available_timestamps()
        logger.info("Discovered %d satellite observation timestamps.", len(timestamps))

        # Bucket timestamps chronologically
        train_ts, val_ts, test_ts = self._partition_timestamps(timestamps)
        logger.info("Split allocation: %d Train | %d Val | %d Test", len(train_ts), len(val_ts), len(test_ts))

        if max_samples_per_split:
            train_ts = train_ts[:max_samples_per_split]
            val_ts = val_ts[:max_samples_per_split]
            test_ts = test_ts[:max_samples_per_split]

        # 1. Build raw un-normalized sequences
        logger.info("Building raw temporal frames for Training split...")
        train_x_raw, train_y = self._build_split_sequences(train_ts, terrain)
        logger.info("Building raw temporal frames for Validation split...")
        val_x_raw, val_y = self._build_split_sequences(val_ts, terrain)
        logger.info("Building raw temporal frames for Test split...")
        test_x_raw, test_y = self._build_split_sequences(test_ts, terrain)

        # 2. Anti-Leakage Safeguard: Compute normalization constants SOLELY on Train split
        logger.info("Computing channel normalization statistics EXCLUSIVELY on training split...")
        norm_params = self._compute_training_normalization(train_x_raw)

        # 3. Apply identical training normalization to all splits
        train_x_norm = self._apply_normalization(train_x_raw, norm_params)
        val_x_norm = self._apply_normalization(val_x_raw, norm_params)
        test_x_norm = self._apply_normalization(test_x_raw, norm_params)

        # 4. Save ready-to-train datasets
        processed_dir = self.config.get_full_path(self.config.processed_dir)
        processed_dir.mkdir(parents=True, exist_ok=True)

        train_path = processed_dir / "vayunet_tensors_train.pt"
        val_path = processed_dir / "vayunet_tensors_val.pt"
        test_path = processed_dir / "vayunet_tensors_test.pt"
        norm_path = processed_dir / "normalization.json"

        torch.save({"x": train_x_norm, "y": train_y}, train_path)
        torch.save({"x": val_x_norm, "y": val_y}, val_path)
        torch.save({"x": test_x_norm, "y": test_y}, test_path)

        with open(norm_path, "w", encoding="utf-8") as f:
            json.dump(norm_params, f, indent=2)

        logger.info("Exported train tensors (%s): %s", train_x_norm.shape, train_path)
        logger.info("Exported val tensors   (%s): %s", val_x_norm.shape, val_path)
        logger.info("Exported test tensors  (%s): %s", test_x_norm.shape, test_path)
        logger.info("Saved normalization parameters to: %s", norm_path)

        return {
            "train": train_path,
            "val": val_path,
            "test": test_path,
            "normalization": norm_path
        }

    def _partition_timestamps(self, timestamps: List[str]) -> Tuple[List[str], List[str], List[str]]:
        train_ts, val_ts, test_ts = [], [], []
        t_start = self.config.split_train_start.replace("-", "")
        t_end = self.config.split_train_end.replace("-", "")
        v_start = self.config.split_val_start.replace("-", "")
        v_end = self.config.split_val_end.replace("-", "")
        te_start = self.config.split_test_start.replace("-", "")
        te_end = self.config.split_test_end.replace("-", "")

        for ts in timestamps:
            date_token = ts.split("_")[0]
            if t_start <= date_token <= t_end:
                train_ts.append(ts)
            elif v_start <= date_token <= v_end:
                val_ts.append(ts)
            elif te_start <= date_token <= te_end:
                test_ts.append(ts)

        # Fallback if specific dates are outside range: chronological 60/20/20 partition
        if not train_ts:
            n = len(timestamps)
            n_tr = int(n * 0.6)
            n_va = int(n * 0.2)
            train_ts = timestamps[:n_tr]
            val_ts = timestamps[n_tr:n_tr + n_va]
            test_ts = timestamps[n_tr + n_va:]

        return train_ts, val_ts, test_ts

    def _build_split_sequences(
        self,
        timestamps: List[str],
        terrain: Dict[str, np.ndarray]
    ) -> Tuple[torch.Tensor, Dict[str, torch.Tensor]]:
        H, W = self.config.grid_size, self.config.grid_size
        T = self.config.num_frames
        C = self.config.in_channels

        elev = terrain["elevation"]
        slope = terrain["slope"]
        flow = terrain["flow_accumulation"]

        # If timestamps are fewer than T, pad with synthetic physical frames
        if len(timestamps) < T:
            return self._build_synthetic_split(max(10, len(timestamps) * 2), terrain)

        # Precompute individual timestamp 12-channel frames
        single_frames = []
        single_targets = []
        prev_tir = None

        for ts in timestamps:
            parts = ts.split("_")
            date_str = parts[0] if len(parts) >= 1 else "20180815"
            hour_str = parts[1][:2] if len(parts) >= 2 else "12"

            # Satellite channels
            wv, tir, ctt_rate = self.satellite_proc.process_frame_pair(ts, prev_tir)
            prev_tir = tir

            # Reanalysis channels
            soundings = self.reanalysis_proc.extract_sounding_fields(date_str, hour_str)
            cape = soundings["cape"]
            cin = soundings["cin"]
            lcl = soundings["lcl"]
            shear = soundings["shear"]
            iwv = soundings["iwv"]
            m_flux = soundings["moisture_flux"]
            h_rain = soundings["hourly_rain"]

            # Stack 12 physical channels
            # Ch 0: WV | Ch 1: TIR | Ch 2: CTT Rate | Ch 3: CAPE | Ch 4: CIN | Ch 5: LCL
            # Ch 6: Shear | Ch 7: IWV | Ch 8: Moisture Flux | Ch 9: Elevation | Ch 10: Slope | Ch 11: Flow Accum
            frame_12c = np.stack([
                wv, tir, ctt_rate, cape, cin, lcl, shear, iwv, m_flux,
                elev, slope, flow
            ], axis=0)  # (12, H, W)
            single_frames.append(frame_12c)

            # Ground truth targets for this frame
            targets = self.ground_truth_proc.build_target_masks(date_str, terrain, h_rain, tir)
            single_targets.append(targets)

        # Build rolling sliding windows of length T=4
        num_sequences = len(single_frames) - T + 1
        x_list = []
        ts_targets = []
        cb_targets = []
        ff_targets = []

        for i in range(num_sequences):
            # Window of T consecutive frames: (T=4, C=12, H=32, W=32)
            seq = np.stack(single_frames[i:i + T], axis=0)
            x_list.append(seq)

            # Target is evaluated at culmination time (frame i + T - 1)
            target_obj = single_targets[i + T - 1]
            ts_targets.append(target_obj["thunderstorm"])
            cb_targets.append(target_obj["cloudburst"])
            ff_targets.append(target_obj["flash_flood"])

        x_tensor = torch.tensor(np.stack(x_list, axis=0), dtype=torch.float32)  # (B, T, C, H, W)
        y_dict = {
            "thunderstorm": torch.tensor(np.stack(ts_targets, axis=0), dtype=torch.float32),  # (B, 1, H, W)
            "cloudburst": torch.tensor(np.stack(cb_targets, axis=0), dtype=torch.float32),    # (B, 1, H, W)
            "flash_flood": torch.tensor(np.stack(ff_targets, axis=0), dtype=torch.float32)     # (B, 1, H, W)
        }

        return x_tensor, y_dict

    def _build_synthetic_split(
        self,
        n_samples: int,
        terrain: Dict[str, np.ndarray]
    ) -> Tuple[torch.Tensor, Dict[str, torch.Tensor]]:
        """Physical convective simulator fallback."""
        from src.training.dataset import VayunetDataset
        ds = VayunetDataset(num_samples=n_samples, img_size=self.config.grid_size, num_frames=self.config.num_frames)
        x_items = []
        ts_items, cb_items, ff_items = [], [], []
        for i in range(len(ds)):
            x, y = ds[i]
            x_items.append(x)
            ts_items.append(y["thunderstorm"])
            cb_items.append(y["cloudburst"])
            ff_items.append(y["flash_flood"])

        x_tensor = torch.stack(x_items, dim=0)
        y_dict = {
            "thunderstorm": torch.stack(ts_items, dim=0),
            "cloudburst": torch.stack(cb_items, dim=0),
            "flash_flood": torch.stack(ff_items, dim=0)
        }
        return x_tensor, y_dict

    def _compute_training_normalization(self, x_train: torch.Tensor) -> List[Dict[str, Any]]:
        """Computes min and max per channel across (B, T, H, W) of training split only."""
        C = self.config.in_channels
        norm_params = []
        for c in range(C):
            ch_data = x_train[:, :, c, :, :]
            c_min = float(ch_data.min().item())
            c_max = float(ch_data.max().item())
            # Safeguard zero-variance channels
            if abs(c_max - c_min) < 1e-5:
                c_max = c_min + 1.0

            meta = self.config.channel_metadata[c]
            norm_params.append({
                "index": c,
                "name": meta["name"],
                "unit": meta["unit"],
                "min": c_min,
                "max": c_max
            })
        return norm_params

    def _apply_normalization(self, x: torch.Tensor, norm_params: List[Dict[str, Any]]) -> torch.Tensor:
        """Scales each channel to [0, 1] using provided parameters."""
        x_norm = x.clone()
        for param in norm_params:
            c = param["index"]
            c_min = param["min"]
            c_max = param["max"]
            x_norm[:, :, c, :, :] = torch.clamp((x[:, :, c, :, :] - c_min) / (c_max - c_min), 0.0, 1.0)
        return x_norm
