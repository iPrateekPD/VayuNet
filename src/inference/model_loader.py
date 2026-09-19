"""
VAYUNET Model Loader (Singleton)
Loads and keeps the trained PyTorch checkpoint in memory across API requests.
"""

import os
import logging
from pathlib import Path
from typing import Optional, Dict, Any
import torch

from src.models.vayunet_model import VayunetMTLModel

logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DEFAULT_CHECKPOINT = PROJECT_ROOT / "checkpoints" / "vayunet_mtl_best.pt"
DEFAULT_NORM_PATH = PROJECT_ROOT / "data" / "processed" / "normalization.json"


class ModelManager:
    """
    Thread-safe singleton managing the trained VayunetMTLModel.
    """
    _instance: Optional["ModelManager"] = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(ModelManager, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, checkpoint_path: Optional[Path] = None, device: str = "auto"):
        if getattr(self, "_initialized", False):
            return

        self.checkpoint_path = Path(checkpoint_path or DEFAULT_CHECKPOINT)
        self.norm_path = DEFAULT_NORM_PATH

        if device == "auto":
            if torch.cuda.is_available():
                self.device = torch.device("cuda")
            elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
                self.device = torch.device("mps")
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

        self.is_loaded = False
        self.is_trained = False
        self.model_version = "VAYUNET-MTL-v2.0"

        self._load_checkpoint()
        self._initialized = True

    def _load_checkpoint(self) -> None:
        """Loads state dict from trained checkpoint."""
        if self.checkpoint_path.exists():
            try:
                ckpt = torch.load(self.checkpoint_path, map_location=self.device, weights_only=False)
                if "model_state_dict" in ckpt:
                    self.model.load_state_dict(ckpt["model_state_dict"])
                else:
                    self.model.load_state_dict(ckpt)
                self.model.eval()
                self.is_loaded = True
                self.is_trained = True
                logger.info("[MODEL] Successfully loaded trained checkpoint from %s onto %s", self.checkpoint_path, self.device)
            except Exception as e:
                logger.error("[MODEL] Error loading checkpoint %s: %s", self.checkpoint_path, e)
                self.model.eval()
                self.is_loaded = True
                self.is_trained = False
        else:
            logger.warning("[MODEL] Checkpoint not found at %s. Model running in untrained mode.", self.checkpoint_path)
            self.model.eval()
            self.is_loaded = True
            self.is_trained = False

    def get_status(self) -> Dict[str, Any]:
        """Returns metadata for system status endpoint."""
        return {
            "loaded": self.is_loaded,
            "trained_checkpoint": self.is_trained,
            "model_version": self.model_version,
            "device": str(self.device),
            "checkpoint_path": str(self.checkpoint_path) if self.checkpoint_path.exists() else None,
            "normalization_ready": self.norm_path.exists()
        }


def get_model_manager(checkpoint_path: Optional[Path] = None, device: str = "auto") -> ModelManager:
    """Returns singleton ModelManager instance."""
    return ModelManager(checkpoint_path=checkpoint_path, device=device)
