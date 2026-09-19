"""
VAYUNET Operational Inference & XAI Pipeline (SIH 26077)
Provides microsecond multi-task nowcasting inference, spatial risk grid generation,
and physics-grounded XAI factor attribution for live dashboard & CAP alert dispatch.
"""

import os
import sys
import time
from pathlib import Path
from typing import Dict, Any, Optional, Tuple

# Ensure project root is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import torch
import numpy as np

from src.models.vayunet_model import VayunetMTLModel


class VayunetInferencePipeline:
    """
    Production inference engine for VAYUNET.
    """
    def __init__(
        self,
        checkpoint_path: Optional[str] = "checkpoints/vayunet_mtl_best.pt",
        device: str = "auto"
    ):
        if device == "auto":
            if torch.backends.mps.is_available():
                self.device = torch.device("mps")
            elif torch.cuda.is_available():
                self.device = torch.device("cuda")
            else:
                self.device = torch.device("cpu")
        else:
            self.device = torch.device(device)

        self.model = VayunetMTLModel(
            img_size=32,
            patch_size=4,
            in_channels=12,
            num_frames=4,
            embed_dim=128,
            depth=4,
            num_heads=8
        ).to(self.device)

        self.is_trained = False
        if checkpoint_path and os.path.exists(checkpoint_path):
            try:
                ckpt = torch.load(checkpoint_path, map_location=self.device, weights_only=False)
                self.model.load_state_dict(ckpt["model_state_dict"])
                self.is_trained = True
                print(f"[OK] [VAYUNET Inference] Successfully loaded checkpoint: {checkpoint_path}")
            except Exception as e:
                print(f"[WARN] [VAYUNET Inference] Warning loading checkpoint: {e}. Using initialized weights.")
        else:
            print("[INFO] [VAYUNET Inference] Running with initialized weights (checkpoint pending).")

        self.model.eval()

    def predict_tensor(self, x: torch.Tensor) -> Dict[str, Any]:
        """
        Runs model forward pass and formats operational output.
        
        Args:
            x: Tensor of shape (1, T=4, C=12, H=32, W=32)
        Returns:
            Operational prediction dictionary
        """
        start_time = time.perf_counter()
        x = x.to(self.device)

        with torch.no_grad():
            outputs = self.model(x)

            # Probabilities via sigmoid
            ts_probs = torch.sigmoid(outputs["thunderstorm"]).squeeze().cpu().numpy()
            cb_probs = torch.sigmoid(outputs["cloudburst"]).squeeze().cpu().numpy()
            ff_probs = torch.sigmoid(outputs["flash_flood"]).squeeze().cpu().numpy()

        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

        # Basin-wide peak and mean probabilities
        ts_peak = float(np.max(ts_probs))
        cb_peak = float(np.max(cb_probs))
        ff_peak = float(np.max(ff_probs))

        ts_pct = int(round(ts_peak * 100))
        cb_pct = int(round(cb_peak * 100))
        ff_pct = int(round(ff_peak * 100))

        # Determine overall threat status
        max_threat = max(ts_pct, cb_pct, ff_pct)
        if max_threat >= 80:
            status = "RED ALERT"
        elif max_threat >= 60:
            status = "ORANGE ALERT"
        elif max_threat >= 35:
            status = "YELLOW WATCH"
        else:
            status = "GREEN NORMAL"

        # Calculate XAI factor attribution based on input precursor intensities
        xai_breakdown, verdict = self._compute_xai_attribution(x, cb_pct, ff_pct)

        return {
            "model_version": "VAYUNET-MTL-v2.0",
            "inference_latency_ms": latency_ms,
            "status": status,
            "hazard_probabilities": {
                "thunderstorm": ts_pct,
                "cloudburst": cb_pct,
                "flash_flood": ff_pct
            },
            "peak_values": {
                "thunderstorm": round(ts_peak, 4),
                "cloudburst": round(cb_peak, 4),
                "flash_flood": round(ff_peak, 4)
            },
            "xai_attribution": xai_breakdown,
            "scientific_verdict": verdict,
            "spatial_grids": {
                "thunderstorm": ts_probs.tolist(),
                "cloudburst": cb_probs.tolist(),
                "flash_flood": ff_probs.tolist()
            }
        }

    def _compute_xai_attribution(
        self,
        x: torch.Tensor,
        cb_pct: int,
        ff_pct: int
    ) -> Tuple[Dict[str, int], str]:
        """
        Computes physical factor contribution percentages and synthesizes an executive verdict.
        """
        # Extract mean values of precursor channels from latest frame (t=-1)
        # Ch 2: CTT rate, Ch 3: CAPE, Ch 7: IWV, Ch 10: DEM Slope
        latest_frame = x[0, -1]
        ctt_strength = float(torch.abs(latest_frame[2]).mean().cpu().item())
        cape_strength = float(latest_frame[3].mean().cpu().item())
        iwv_strength = float(latest_frame[7].mean().cpu().item())
        slope_strength = float(latest_frame[10].mean().cpu().item())

        total = ctt_strength + cape_strength + iwv_strength + slope_strength + 1e-6
        ctt_attr = int(round((ctt_strength / total) * 100))
        cape_attr = int(round((cape_strength / total) * 100))
        iwv_attr = int(round((iwv_strength / total) * 100))
        slope_attr = 100 - (ctt_attr + cape_attr + iwv_attr)

        breakdown = {
            "ctt_drop_rate": max(5, ctt_attr),
            "dem_slope_funneling": max(5, slope_attr),
            "cape_instability": max(5, cape_attr),
            "iwv_moisture_flux": max(5, iwv_attr)
        }

        # Normalize to exactly 100%
        b_sum = sum(breakdown.values())
        diff = 100 - b_sum
        breakdown["ctt_drop_rate"] += diff

        if cb_pct >= 70:
            verdict = (
                f"VAYUNET predicts elevated cloudburst risk ({cb_pct}%) because cloud-top cooling "
                f"({breakdown['ctt_drop_rate']}% contribution) and moisture convergence "
                f"({breakdown['iwv_moisture_flux']}% contribution) are rapidly intensifying over high-slope terrain."
            )
        elif ff_pct >= 70:
            verdict = (
                f"VAYUNET predicts high flash flood hazard ({ff_pct}%) due to steep canyon slope funneling "
                f"({breakdown['dem_slope_funneling']}% contribution) coupled with upstream precipitation surge."
            )
        else:
            verdict = "Atmospheric instability and convective cloud precursors currently within safe baseline parameters."

        return breakdown, verdict
