"""
VAYUNET Multi-Task Focal Loss & Topographic Hydro-Regularization
Formulated specifically for extreme class-imbalanced convective cloudbursts
and physically grounded terrain runoff dynamics.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Dict, Tuple


class BinaryFocalLoss(nn.Module):
    """
    Focal Loss for binary spatial segmentation / nowcast grids:
    FL(p_t) = -alpha_t * (1 - p_t)^gamma * log(p_t)
    Down-weights easy well-classified non-convective pixels and concentrates gradients
    on rare, hard cloudburst and convective storm cells.
    """
    def __init__(self, alpha: float = 0.8, gamma: float = 2.0, reduction: str = "mean"):
        super().__init__()
        self.alpha = alpha
        self.gamma = gamma
        self.reduction = reduction

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        """
        Args:
            logits: (B, 1, H, W) raw un-normalized model logits
            targets: (B, 1, H, W) binary ground truth labels {0, 1}
        """
        # Numerically stable focal loss via binary cross entropy with logits
        bce_loss = F.binary_cross_entropy_with_logits(logits, targets, reduction="none")
        probs = torch.sigmoid(logits)
        
        # p_t is the probability of the true class
        p_t = targets * probs + (1 - targets) * (1 - probs)
        alpha_t = targets * self.alpha + (1 - targets) * (1 - self.alpha)
        
        focal_weight = alpha_t * torch.pow(1.0 - p_t, self.gamma)
        loss = focal_weight * bce_loss

        if self.reduction == "mean":
            return loss.mean()
        elif self.reduction == "sum":
            return loss.sum()
        return loss


class TopographicHydroRegularizationLoss(nn.Module):
    """
    Penalizes physically implausible flash flood surge patterns that violate
    gravitational downhill flow according to CartoDEM elevation gradients.
    """
    def __init__(self):
        super().__init__()
        # Sobel kernel for computing elevation gradient in X and Y
        sobel_x = torch.tensor([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], dtype=torch.float32).view(1, 1, 3, 3) / 8.0
        sobel_y = torch.tensor([[-1, -2, -1], [0, 0, 0], [1, 2, 1]], dtype=torch.float32).view(1, 1, 3, 3) / 8.0
        self.register_buffer("sobel_x", sobel_x)
        self.register_buffer("sobel_y", sobel_y)

    def forward(self, flood_probs: torch.Tensor, elevation: torch.Tensor) -> torch.Tensor:
        """
        Args:
            flood_probs: (B, 1, H, W) in [0, 1]
            elevation: (B, 1, H, W) normalized CartoDEM elevation
        """
        # Ensure kernels are on same device and dtype as inputs
        sobel_x = self.sobel_x.to(dtype=elevation.dtype, device=elevation.device)
        sobel_y = self.sobel_y.to(dtype=elevation.dtype, device=elevation.device)

        # Elevation gradients
        grad_z_x = F.conv2d(elevation, sobel_x, padding=1)
        grad_z_y = F.conv2d(elevation, sobel_y, padding=1)

        # Flood probability gradients
        grad_p_x = F.conv2d(flood_probs, sobel_x, padding=1)
        grad_p_y = F.conv2d(flood_probs, sobel_y, padding=1)

        # Water flows in the direction of negative elevation gradient (-grad_z).
        # Inner product grad_p . grad_z should be negative (flood probability concentrates in valleys / low elevation).
        # Positive inner product indicates flood probability surging uphill without slope support.
        uphill_penalty = F.relu(grad_p_x * grad_z_x + grad_p_y * grad_z_y)
        return uphill_penalty.mean()


class VayunetMultiTaskLoss(nn.Module):
    """
    Unified Multi-Task Loss combining Focal Losses for Thunderstorms & Cloudbursts,
    BCE for Flash Floods, and Topographic Regularization.
    """
    def __init__(
        self,
        weight_thunderstorm: float = 1.0,
        weight_cloudburst: float = 2.5,
        weight_flash_flood: float = 1.5,
        weight_hydro_reg: float = 0.5,
        gamma_cb: float = 2.5,
        alpha_cb: float = 0.85
    ):
        super().__init__()
        self.w_ts = weight_thunderstorm
        self.w_cb = weight_cloudburst
        self.w_ff = weight_flash_flood
        self.w_hydro = weight_hydro_reg

        self.focal_ts = BinaryFocalLoss(alpha=0.75, gamma=2.0)
        self.focal_cb = BinaryFocalLoss(alpha=alpha_cb, gamma=gamma_cb)
        self.focal_ff = BinaryFocalLoss(alpha=0.75, gamma=2.0)
        self.hydro_reg = TopographicHydroRegularizationLoss()

    def forward(
        self,
        predictions: Dict[str, torch.Tensor],
        targets: Dict[str, torch.Tensor],
        elevation: torch.Tensor
    ) -> Tuple[torch.Tensor, Dict[str, float]]:
        """
        Args:
            predictions: dict with 'thunderstorm', 'cloudburst', 'flash_flood' logits (B, 1, H, W)
            targets: dict with 'thunderstorm', 'cloudburst', 'flash_flood' labels (B, 1, H, W)
            elevation: (B, 1, H, W) CartoDEM elevation
        Returns:
            total_loss: scalar tensor
            loss_breakdown: dictionary of individual loss values for logging
        """
        l_ts = self.focal_ts(predictions["thunderstorm"], targets["thunderstorm"])
        l_cb = self.focal_cb(predictions["cloudburst"], targets["cloudburst"])
        l_ff = self.focal_ff(predictions["flash_flood"], targets["flash_flood"])

        flood_probs = torch.sigmoid(predictions["flash_flood"])
        l_hydro = self.hydro_reg(flood_probs, elevation)

        total_loss = (
            self.w_ts * l_ts +
            self.w_cb * l_cb +
            self.w_ff * l_ff +
            self.w_hydro * l_hydro
        )

        loss_breakdown = {
            "loss_total": total_loss.item(),
            "loss_thunderstorm": l_ts.item(),
            "loss_cloudburst": l_cb.item(),
            "loss_flash_flood": l_ff.item(),
            "loss_hydro_reg": l_hydro.item()
        }

        return total_loss, loss_breakdown
