"""
VAYUNET Master Pipeline Orchestrator (SIH 26077)
Coordinates raw ingestion, preprocessing, multi-hazard training, scientific evaluation,
and live FastAPI model serving.
"""

import os
import sys
import json
import time
import logging
from pathlib import Path
from typing import Dict, Any, Optional

import torch
from torch.utils.data import TensorDataset, DataLoader

from .config import PipelineConfig
from .tensor_builder import SpatiotemporalTensorBuilder
from src.models.vayunet_model import VayunetMTLModel
from src.models.loss import VayunetMultiTaskLoss
from src.evaluation.metrics import calculate_nowcast_metrics

logger = logging.getLogger(__name__)


class VayunetPipelineOrchestrator:
    """
    Master end-to-end execution pipeline for the entire VAYUNET project.
    """
    def __init__(self, config: Optional[PipelineConfig] = None):
        self.config = config or PipelineConfig()
        self.tensor_builder = SpatiotemporalTensorBuilder(self.config)

    def run_stage(self, stage: str, **kwargs) -> Any:
        """
        Executes an individual pipeline stage or full end-to-end workflow.
        Stages: 'preprocess', 'train', 'evaluate', 'serve', 'all'
        """
        stage = stage.lower().strip()
        logger.info("==================================================================")
        logger.info("   VAYUNET AI PIPELINE — Executing Stage: [%s]", stage.upper())
        logger.info("==================================================================")

        if stage == "preprocess":
            return self.run_preprocess(**kwargs)
        elif stage == "train":
            return self.run_train(**kwargs)
        elif stage == "evaluate":
            return self.run_evaluate(**kwargs)
        elif stage == "serve":
            return self.run_serve(**kwargs)
        elif stage == "all":
            self.run_preprocess(**kwargs)
            self.run_train(**kwargs)
            eval_metrics = self.run_evaluate(**kwargs)
            logger.info("Pipeline completed successfully! Starting API server...")
            self.run_serve(**kwargs)
            return eval_metrics
        else:
            raise ValueError(f"Unknown pipeline stage: '{stage}'. Choose from ['preprocess', 'train', 'evaluate', 'serve', 'all']")

    def run_preprocess(self, max_samples: Optional[int] = None, **kwargs) -> Dict[str, Path]:
        """
        Ingests raw satellite, CartoDEM, reanalysis, and rainfall datasets,
        extracts physical features, and builds 12-channel normalized tensors.
        """
        start = time.time()
        logger.info("[Step 1/5] Building spatiotemporal tensors across chronological splits...")
        split_paths = self.tensor_builder.build_all_splits(max_samples_per_split=max_samples)
        elapsed = time.time() - start
        logger.info("Pre-processing stage completed in %.2f seconds.", elapsed)
        return split_paths

    def run_train(
        self,
        epochs: int = 15,
        batch_size: int = 4,
        lr: float = 1e-4,
        device: str = "auto",
        **kwargs
    ) -> Path:
        """
        Executes multi-task spatiotemporal transformer training using class-weighted
        focal loss and topographic hydro-regularization.
        """
        processed_dir = self.config.get_full_path(self.config.processed_dir)
        train_path = processed_dir / "vayunet_tensors_train.pt"
        val_path = processed_dir / "vayunet_tensors_val.pt"

        if not train_path.exists() or not val_path.exists():
            logger.info("Processed tensors not found. Running pre-processing first...")
            self.run_preprocess()

        # Determine optimal compute accelerator
        if device == "auto":
            if torch.cuda.is_available():
                dev = torch.device("cuda")
            elif torch.backends.mps.is_available():
                dev = torch.device("mps")
            else:
                dev = torch.device("cpu")
        else:
            dev = torch.device(device)

        logger.info("Loading training and validation datasets into memory...")
        train_data = torch.load(train_path, map_location="cpu", weights_only=False)
        val_data = torch.load(val_path, map_location="cpu", weights_only=False)

        train_dataset = TensorDataset(
            train_data["x"],
            train_data["y"]["thunderstorm"],
            train_data["y"]["cloudburst"],
            train_data["y"]["flash_flood"]
        )
        val_dataset = TensorDataset(
            val_data["x"],
            val_data["y"]["thunderstorm"],
            val_data["y"]["cloudburst"],
            val_data["y"]["flash_flood"]
        )

        train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
        val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)

        logger.info("Instantiating VayunetMTLModel on %s...", dev)
        model = VayunetMTLModel(
            img_size=self.config.grid_size,
            patch_size=4,
            in_channels=self.config.in_channels,
            num_frames=self.config.num_frames,
            embed_dim=128,
            depth=4,
            num_heads=8
        ).to(dev)

        criterion = VayunetMultiTaskLoss(
            weight_thunderstorm=1.0,
            weight_cloudburst=2.5,
            weight_flash_flood=1.5,
            weight_hydro_reg=0.5
        )
        optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-2)
        scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)

        best_val_loss = float("inf")
        checkpoints_dir = self.config.get_full_path(self.config.checkpoints_dir)
        checkpoints_dir.mkdir(parents=True, exist_ok=True)
        best_ckpt_path = checkpoints_dir / "vayunet_mtl_best.pt"

        logger.info("Starting Multi-Task Training (%d Epochs, Batch Size %d)...", epochs, batch_size)
        for epoch in range(1, epochs + 1):
            model.train()
            train_loss = 0.0

            for bx, b_ts, b_cb, b_ff in train_loader:
                bx = bx.to(dev)
                targets = {
                    "thunderstorm": b_ts.to(dev),
                    "cloudburst": b_cb.to(dev),
                    "flash_flood": b_ff.to(dev)
                }
                optimizer.zero_grad()
                outputs = model(bx)
                loss, _ = criterion(outputs, targets, outputs["elevation"])
                loss.backward()
                torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
                optimizer.step()
                train_loss += loss.item()

            train_loss /= max(1, len(train_loader))
            scheduler.step()

            # Validation pass
            model.eval()
            val_loss = 0.0
            with torch.no_grad():
                for bx, b_ts, b_cb, b_ff in val_loader:
                    bx = bx.to(dev)
                    targets = {
                        "thunderstorm": b_ts.to(dev),
                        "cloudburst": b_cb.to(dev),
                        "flash_flood": b_ff.to(dev)
                    }
                    outputs = model(bx)
                    loss, _ = criterion(outputs, targets, outputs["elevation"])
                    val_loss += loss.item()

            val_loss /= max(1, len(val_loader))
            logger.info("Epoch [%02d/%02d] -> Train Loss: %.4f | Val Loss: %.4f", epoch, epochs, train_loss, val_loss)

            if val_loss < best_val_loss:
                best_val_loss = val_loss
                torch.save({
                    "epoch": epoch,
                    "model_state_dict": model.state_dict(),
                    "optimizer_state_dict": optimizer.state_dict(),
                    "val_loss": best_val_loss,
                    "model_config": {
                        "img_size": self.config.grid_size,
                        "patch_size": 4,
                        "in_channels": self.config.in_channels,
                        "num_frames": self.config.num_frames,
                        "embed_dim": 128,
                        "depth": 4,
                        "num_heads": 8
                    }
                }, best_ckpt_path)
                logger.info("  --> Saved new best checkpoint: %s (Val Loss: %.4f)", best_ckpt_path.name, val_loss)

        logger.info("Training complete. Best model saved to: %s", best_ckpt_path)
        return best_ckpt_path

    def run_evaluate(self, device: str = "auto", **kwargs) -> Dict[str, Any]:
        """
        Evaluates best model on the unseen Test split (Aug 17 - Aug 25, 2018),
        calculating CSI (Critical Success Index), POD, FAR, and inference latency.
        Exports checkpoints/model_metadata.json for the backend and dashboard.
        """
        checkpoints_dir = self.config.get_full_path(self.config.checkpoints_dir)
        best_ckpt_path = checkpoints_dir / "vayunet_mtl_best.pt"
        processed_dir = self.config.get_full_path(self.config.processed_dir)
        test_path = processed_dir / "vayunet_tensors_test.pt"
        norm_path = processed_dir / "normalization.json"

        if not best_ckpt_path.exists():
            raise FileNotFoundError(f"No checkpoint found at {best_ckpt_path}. Run training first.")
        if not test_path.exists():
            raise FileNotFoundError(f"Test tensors not found at {test_path}. Run preprocessing first.")

        dev = torch.device("cuda" if torch.cuda.is_available() and device == "auto" else "cpu")
        ckpt = torch.load(best_ckpt_path, map_location=dev, weights_only=False)

        model = VayunetMTLModel(**ckpt["model_config"]).to(dev)
        model.load_state_dict(ckpt["model_state_dict"])
        model.eval()

        test_data = torch.load(test_path, map_location="cpu", weights_only=False)
        test_x = test_data["x"].to(dev)
        test_y = test_data["y"]

        start_bench = time.perf_counter()
        with torch.no_grad():
            preds = model(test_x)
        total_latency_ms = (time.perf_counter() - start_bench) * 1000.0
        mean_latency_ms = round(total_latency_ms / max(1, test_x.shape[0]), 2)

        # Compute scientific benchmark metrics
        metrics = {}
        for hazard in ["thunderstorm", "cloudburst", "flash_flood"]:
            pred_probs = torch.sigmoid(preds[hazard]).squeeze(1).cpu().numpy()
            target_mask = test_y[hazard].squeeze(1).cpu().numpy()
            hazard_metrics = calculate_nowcast_metrics(pred_probs, target_mask, threshold=0.5)
            metrics[hazard] = hazard_metrics
            logger.info("[%s] CSI: %.3f | POD: %.3f | FAR: %.3f | F1: %.3f",
                        hazard.upper(), hazard_metrics["csi"], hazard_metrics["pod"],
                        hazard_metrics["far"], hazard_metrics["f1"])

        logger.info("Mean single-sample inference latency: %.2f ms (Target: < 150 ms)", mean_latency_ms)

        # Export model_metadata.json
        norm_channels = self.config.channel_metadata
        if norm_path.exists():
            with open(norm_path, "r", encoding="utf-8") as f:
                norm_channels = json.load(f)

        metadata = {
            "model_version": "VAYUNET-MTL-v2.0",
            "benchmark_period": "August 2018 Wayanad / Kerala Convective Deluge",
            "target_img_size": self.config.grid_size,
            "spatial_resolution_km": self.config.target_resolution_km,
            "channels": norm_channels,
            "benchmark_metrics": {
                "thunderstorm": metrics["thunderstorm"],
                "cloudburst": metrics["cloudburst"],
                "flash_flood": metrics["flash_flood"],
                "mean_inference_latency_ms": mean_latency_ms
            }
        }

        meta_out_path = checkpoints_dir / "model_metadata.json"
        with open(meta_out_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2)

        logger.info("Saved complete scientific benchmark metadata to: %s", meta_out_path)
        return metadata

    def run_serve(self, host: str = "0.0.0.0", port: int = 8000, **kwargs):
        """Launches the production FastAPI server connected to the trained checkpoint."""
        import uvicorn
        logger.info("Launching VAYUNET Operational API at http://%s:%d...", host, port)
        uvicorn.run("api.main:app", host=host, port=port, reload=False)
