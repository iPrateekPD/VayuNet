"""
VAYUNET Factorized Spatiotemporal Transformer Encoder Backbone
Performs divided space-time self-attention to capture long-range convective teleconnections
and rapid storm cell evolution across high-resolution Indian geographical basins.
"""

import torch
import torch.nn as nn
from typing import Optional


class SpatialSelfAttention(nn.Module):
    """
    Multi-Head Self-Attention applied across spatial patch tokens at each time step.
    """
    def __init__(self, embed_dim: int = 128, num_heads: int = 8, dropout: float = 0.1):
        super().__init__()
        self.embed_dim = embed_dim
        self.num_heads = num_heads
        self.head_dim = embed_dim // num_heads
        assert embed_dim % num_heads == 0

        self.qkv = nn.Linear(embed_dim, embed_dim * 3)
        self.proj = nn.Linear(embed_dim, embed_dim)
        self.norm = nn.LayerNorm(embed_dim)
        self.dropout = nn.Dropout(dropout)
        self.scale = 1.0 / (self.head_dim ** 0.5)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: (B, T, N, D)
        Returns:
            out: (B, T, N, D)
        """
        B, T, N, D = x.shape
        x_norm = self.norm(x)

        # Merge batch and time: (B * T, N, D)
        x_flat = x_norm.view(B * T, N, D)
        qkv = self.qkv(x_flat).view(B * T, N, 3, self.num_heads, self.head_dim).permute(2, 0, 3, 1, 4)
        q, k, v = qkv[0], qkv[1], qkv[2]  # (B * T, num_heads, N, head_dim)

        attn = torch.matmul(q, k.transpose(-2, -1)) * self.scale
        attn = torch.softmax(attn, dim=-1)
        attn = self.dropout(attn)

        out = torch.matmul(attn, v).transpose(1, 2).reshape(B * T, N, D)
        out = self.proj(out)
        out = self.dropout(out).view(B, T, N, D)

        return x + out


class TemporalSelfAttention(nn.Module):
    """
    Multi-Head Self-Attention applied across the temporal frame dimension for each spatial patch.
    """
    def __init__(self, embed_dim: int = 128, num_heads: int = 8, dropout: float = 0.1):
        super().__init__()
        self.embed_dim = embed_dim
        self.num_heads = num_heads
        self.head_dim = embed_dim // num_heads
        assert embed_dim % num_heads == 0

        self.qkv = nn.Linear(embed_dim, embed_dim * 3)
        self.proj = nn.Linear(embed_dim, embed_dim)
        self.norm = nn.LayerNorm(embed_dim)
        self.dropout = nn.Dropout(dropout)
        self.scale = 1.0 / (self.head_dim ** 0.5)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: (B, T, N, D)
        Returns:
            out: (B, T, N, D)
        """
        B, T, N, D = x.shape
        x_norm = self.norm(x)

        # Permute to (B, N, T, D) then flatten batch & spatial
        # (B * N, T, D)
        x_flat = x_norm.permute(0, 2, 1, 3).reshape(B * N, T, D)
        qkv = self.qkv(x_flat).view(B * N, T, 3, self.num_heads, self.head_dim).permute(2, 0, 3, 1, 4)
        q, k, v = qkv[0], qkv[1], qkv[2]  # (B * N, num_heads, T, head_dim)

        attn = torch.matmul(q, k.transpose(-2, -1)) * self.scale
        attn = torch.softmax(attn, dim=-1)
        attn = self.dropout(attn)

        out = torch.matmul(attn, v).transpose(1, 2).reshape(B * N, T, D)
        out = self.proj(out)
        out = self.dropout(out).view(B, N, T, D).permute(0, 2, 1, 3)  # Back to (B, T, N, D)

        return x + out


class SpatiotemporalTransformerBlock(nn.Module):
    """
    A single factorized spatiotemporal transformer encoder block:
    Spatial-Attention -> Temporal-Attention -> Feed-Forward MLP
    """
    def __init__(
        self,
        embed_dim: int = 128,
        num_heads: int = 8,
        mlp_ratio: float = 2.0,
        dropout: float = 0.1
    ):
        super().__init__()
        self.spatial_attn = SpatialSelfAttention(embed_dim, num_heads, dropout)
        self.temporal_attn = TemporalSelfAttention(embed_dim, num_heads, dropout)

        self.norm_mlp = nn.LayerNorm(embed_dim)
        mlp_hidden_dim = int(embed_dim * mlp_ratio)
        self.mlp = nn.Sequential(
            nn.Linear(embed_dim, mlp_hidden_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(mlp_hidden_dim, embed_dim),
            nn.Dropout(dropout)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: (B, T, N, D)
        x = self.spatial_attn(x)
        x = self.temporal_attn(x)
        x = x + self.mlp(self.norm_mlp(x))
        return x


class SpatiotemporalTransformerBackbone(nn.Module):
    """
    Multi-layer Spatiotemporal Transformer Encoder stack.
    """
    def __init__(
        self,
        depth: int = 4,
        embed_dim: int = 128,
        num_heads: int = 8,
        mlp_ratio: float = 2.0,
        dropout: float = 0.1
    ):
        super().__init__()
        self.blocks = nn.ModuleList([
            SpatiotemporalTransformerBlock(
                embed_dim=embed_dim,
                num_heads=num_heads,
                mlp_ratio=mlp_ratio,
                dropout=dropout
            )
            for _ in range(depth)
        ])
        self.final_norm = nn.LayerNorm(embed_dim)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: (B, T, N, D)
        Returns:
            out: (B, T, N, D)
        """
        for block in self.blocks:
            x = block(x)
        return self.final_norm(x)
