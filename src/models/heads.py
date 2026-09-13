"""
VAYUNET Multi-Task Learning (MTL) Prediction Heads
Branched decoders predicting the complete cascading hazard lifecycle:
1. Severe Thunderstorm & Convective Initiation Head
2. Cloudburst Extreme Precipitation (>100 mm/hr) Head
3. Flash Flood Orographic Runoff & Inundation Head (fusing CartoDEM flow accumulation)
"""

import torch
import torch.nn as nn
from typing import Dict, Tuple


class ConvUpsampleBlock(nn.Module):
    """
    Progressive convolutional upsampling block with GELU and LayerNorm / GroupNorm.
    """
    def __init__(self, in_channels: int, out_channels: int):
        super().__init__()
        self.block = nn.Sequential(
            nn.ConvTranspose2d(in_channels, out_channels, kernel_size=2, stride=2),
            nn.GroupNorm(num_groups=min(8, out_channels), num_channels=out_channels),
            nn.GELU(),
            nn.Conv2d(out_channels, out_channels, kernel_size=3, padding=1),
            nn.GroupNorm(num_groups=min(8, out_channels), num_channels=out_channels),
            nn.GELU()
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.block(x)


class ThunderstormHead(nn.Module):
    """
    Head 1: Predicts convective initiation and high-shear storm track probability map.
    """
    def __init__(self, in_features: int = 128, hidden_dim: int = 64, target_size: int = 32):
        super().__init__()
        self.target_size = target_size
        self.decoder = nn.Sequential(
            ConvUpsampleBlock(in_features, hidden_dim),
            ConvUpsampleBlock(hidden_dim, hidden_dim // 2),
            nn.Conv2d(hidden_dim // 2, 1, kernel_size=3, padding=1)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: Latent feature map of shape (B, in_features, H_patch, W_patch)
        Returns:
            logits: (B, 1, H, W)
        """
        logits = self.decoder(x)
        if logits.shape[-1] != self.target_size:
            logits = nn.functional.interpolate(logits, size=(self.target_size, self.target_size), mode="bilinear", align_corners=False)
        return logits


class CloudburstHead(nn.Module):
    """
    Head 2: Predicts extreme localized precipitation (>100 mm/hr) probability map.
    Features deeper non-linear capacity to model sharp, non-linear convective thresholding.
    """
    def __init__(self, in_features: int = 128, hidden_dim: int = 64, target_size: int = 32):
        super().__init__()
        self.target_size = target_size
        self.decoder = nn.Sequential(
            ConvUpsampleBlock(in_features, hidden_dim),
            nn.Conv2d(hidden_dim, hidden_dim, kernel_size=3, padding=1),
            nn.GroupNorm(num_groups=8, num_channels=hidden_dim),
            nn.GELU(),
            ConvUpsampleBlock(hidden_dim, hidden_dim // 2),
            nn.Conv2d(hidden_dim // 2, 1, kernel_size=3, padding=1)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        logits = self.decoder(x)
        if logits.shape[-1] != self.target_size:
            logits = nn.functional.interpolate(logits, size=(self.target_size, self.target_size), mode="bilinear", align_corners=False)
        return logits


class FlashFloodHead(nn.Module):
    """
    Head 3: Fuses predicted cloudburst precipitation with CartoDEM flow accumulation
    and slope angles to simulate downhill torrent runoff and valley inundation.
    """
    def __init__(self, in_features: int = 128, topo_channels: int = 3, hidden_dim: int = 64, target_size: int = 32):
        super().__init__()
        self.target_size = target_size
        
        # Spatial upsampler for backbone features
        self.feat_upsampler = nn.Sequential(
            ConvUpsampleBlock(in_features, hidden_dim),
            ConvUpsampleBlock(hidden_dim, hidden_dim // 2)
        )

        # Hydrological routing coupling layer (combining upsampled features + cloudburst logit + CartoDEM topography)
        # topo_channels: CartoDEM elevation, slope, and flow accumulation (3 channels)
        # cloudburst_channel: 1 channel
        in_hydro = (hidden_dim // 2) + 1 + topo_channels

        self.hydro_router = nn.Sequential(
            nn.Conv2d(in_hydro, hidden_dim, kernel_size=3, padding=1),
            nn.GroupNorm(num_groups=8, num_channels=hidden_dim),
            nn.GELU(),
            nn.Conv2d(hidden_dim, hidden_dim // 2, kernel_size=3, padding=1),
            nn.GroupNorm(num_groups=4, num_channels=hidden_dim // 2),
            nn.GELU(),
            nn.Conv2d(hidden_dim // 2, 1, kernel_size=3, padding=1)
        )

    def forward(
        self,
        latent_feat: torch.Tensor,
        cloudburst_logits: torch.Tensor,
        topography: torch.Tensor
    ) -> torch.Tensor:
        """
        Args:
            latent_feat: (B, in_features, H_patch, W_patch)
            cloudburst_logits: (B, 1, H, W)
            topography: (B, topo_channels, H, W) CartoDEM elevation, slope, flow accumulation
        Returns:
            flash_flood_logits: (B, 1, H, W)
        """
        feat = self.feat_upsampler(latent_feat)
        if feat.shape[-1] != self.target_size:
            feat = nn.functional.interpolate(feat, size=(self.target_size, self.target_size), mode="bilinear", align_corners=False)

        # Hydro coupling: Concatenate along channel dimension
        # (B, hidden_dim // 2 + 1 + 3, H, W)
        hydro_input = torch.cat([feat, torch.sigmoid(cloudburst_logits), topography], dim=1)
        flood_logits = self.hydro_router(hydro_input)
        return flood_logits
