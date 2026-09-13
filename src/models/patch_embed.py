"""
VAYUNET Spatiotemporal Patch Embedding Layer
Converts multi-channel geospatial raster grids over consecutive time frames
into latent token sequences with spatial and temporal positional encodings.
"""

import math
import torch
import torch.nn as nn
from typing import Tuple


class SpatiotemporalPatchEmbed(nn.Module):
    """
    Splits an input spatiotemporal raster tensor of shape (B, T, C, H, W)
    into spatial patches and projects them to dimension `embed_dim`,
    adding learnable 2D spatial and 1D temporal positional embeddings.
    """
    def __init__(
        self,
        img_size: int = 32,
        patch_size: int = 4,
        in_channels: int = 12,
        num_frames: int = 4,
        embed_dim: int = 128,
        dropout: float = 0.1
    ):
        super().__init__()
        self.img_size = img_size
        self.patch_size = patch_size
        self.in_channels = in_channels
        self.num_frames = num_frames
        self.embed_dim = embed_dim

        assert img_size % patch_size == 0, f"img_size ({img_size}) must be divisible by patch_size ({patch_size})"
        self.grid_size = img_size // patch_size
        self.num_patches = self.grid_size * self.grid_size

        # Convolutional patch projection (applied across time dimension)
        self.proj = nn.Conv2d(
            in_channels=in_channels,
            out_channels=embed_dim,
            kernel_size=patch_size,
            stride=patch_size
        )
        self.norm = nn.LayerNorm(embed_dim)

        # Learnable spatial and temporal positional encodings
        self.spatial_pos_embed = nn.Parameter(torch.zeros(1, 1, self.num_patches, embed_dim))
        self.temporal_pos_embed = nn.Parameter(torch.zeros(1, num_frames, 1, embed_dim))
        self.dropout = nn.Dropout(p=dropout)

        self._init_weights()

    def _init_weights(self):
        nn.init.trunc_normal_(self.spatial_pos_embed, std=0.02)
        nn.init.trunc_normal_(self.temporal_pos_embed, std=0.02)
        if isinstance(self.proj, nn.Conv2d):
            nn.init.kaiming_normal_(self.proj.weight, mode="fan_out")
            if self.proj.bias is not None:
                nn.init.zeros_(self.proj.bias)

    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, Tuple[int, int]]:
        """
        Args:
            x: Tensor of shape (B, T, C, H, W)
        Returns:
            tokens: (B, T, num_patches, embed_dim)
            spatial_shape: (H_out, W_out)
        """
        B, T, C, H, W = x.shape
        assert C == self.in_channels, f"Expected {self.in_channels} channels, got {C}"
        assert T == self.num_frames, f"Expected {self.num_frames} frames, got {T}"

        # Reshape to combine batch and temporal dimensions for 2D convolution
        # (B * T, C, H, W)
        x_flat = x.view(B * T, C, H, W)
        
        # Patch projection: (B * T, embed_dim, H', W')
        feat = self.proj(x_flat)
        H_out, W_out = feat.shape[2], feat.shape[3]

        # Flatten spatial dimensions: (B * T, embed_dim, num_patches) -> (B * T, num_patches, embed_dim)
        feat = feat.flatten(2).transpose(1, 2)
        feat = self.norm(feat)

        # Reshape back to (B, T, num_patches, embed_dim)
        tokens = feat.view(B, T, self.num_patches, self.embed_dim)

        # Add spatial and temporal positional embeddings
        tokens = tokens + self.spatial_pos_embed + self.temporal_pos_embed
        tokens = self.dropout(tokens)

        return tokens, (H_out, W_out)
