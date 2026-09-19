"""
VAYUNET Multi-Modal Cross-Attention Fusion Layer
Enables dynamic geostationary satellite signatures (cloud-top cooling) to query
ambient thermodynamic instability (CAPE/CIN/shear) conditioned on terrain elevation & slope.
"""

import torch
import torch.nn as nn


class MultiModalCrossAttentionFusion(nn.Module):
    """
    Cross-Attention layer fusing satellite convective tokens with
    thermodynamic reanalysis and topographic priors.
    """
    def __init__(
        self,
        embed_dim: int = 128,
        num_heads: int = 4,
        mlp_ratio: float = 2.0,
        dropout: float = 0.1
    ):
        super().__init__()
        self.embed_dim = embed_dim
        self.num_heads = num_heads
        self.head_dim = embed_dim // num_heads
        assert embed_dim % num_heads == 0, "embed_dim must be divisible by num_heads"

        # Separate projections for Satellite Query and Context Key/Value
        self.q_proj = nn.Linear(embed_dim, embed_dim)
        self.k_proj = nn.Linear(embed_dim, embed_dim)
        self.v_proj = nn.Linear(embed_dim, embed_dim)
        self.out_proj = nn.Linear(embed_dim, embed_dim)

        self.norm_q = nn.LayerNorm(embed_dim)
        self.norm_context = nn.LayerNorm(embed_dim)
        self.norm_post = nn.LayerNorm(embed_dim)

        # Feed-Forward Network
        mlp_hidden_dim = int(embed_dim * mlp_ratio)
        self.mlp = nn.Sequential(
            nn.Linear(embed_dim, mlp_hidden_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(mlp_hidden_dim, embed_dim),
            nn.Dropout(dropout)
        )

        self.dropout = nn.Dropout(dropout)
        self.scale = 1.0 / (self.head_dim ** 0.5)

    def forward(self, query_tokens: torch.Tensor, context_tokens: torch.Tensor) -> torch.Tensor:
        """
        Args:
            query_tokens: Dynamic satellite tokens of shape (B, N, D)
            context_tokens: Thermodynamic & topographic tokens of shape (B, M, D)
        Returns:
            fused_tokens: Fused representation of shape (B, N, D)
        """
        B, N, D = query_tokens.shape
        M = context_tokens.shape[1]

        # Pre-LayerNorm
        q = self.norm_q(query_tokens)
        ctx = self.norm_context(context_tokens)

        # Multi-Head Projections: (B, num_heads, SeqLen, head_dim)
        Q = self.q_proj(q).view(B, N, self.num_heads, self.head_dim).transpose(1, 2)
        K = self.k_proj(ctx).view(B, M, self.num_heads, self.head_dim).transpose(1, 2)
        V = self.v_proj(ctx).view(B, M, self.num_heads, self.head_dim).transpose(1, 2)

        # Scaled Dot-Product Cross-Attention
        # (B, num_heads, N, M)
        attn_weights = torch.matmul(Q, K.transpose(-2, -1)) * self.scale
        attn_weights = torch.softmax(attn_weights, dim=-1)
        attn_weights = self.dropout(attn_weights)

        # Aggregate context values: (B, num_heads, N, head_dim)
        attn_out = torch.matmul(attn_weights, V)
        # Reshape to (B, N, D)
        attn_out = attn_out.transpose(1, 2).contiguous().view(B, N, D)
        attn_out = self.out_proj(attn_out)

        # Residual connection + Post Norm + MLP
        x = query_tokens + self.dropout(attn_out)
        x = x + self.mlp(self.norm_post(x))

        return x
