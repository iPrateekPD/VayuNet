"""
VAYUNET Master Multi-Task Spatiotemporal Transformer Model
Unifies patch embedding, cross-attention multi-modal fusion, spatiotemporal backbone,
and multi-task decoders for severe thunderstorms, cloudbursts, and flash floods.
"""

import torch
import torch.nn as nn
from typing import Dict, Tuple, Optional

from .patch_embed import SpatiotemporalPatchEmbed
from .cross_attention import MultiModalCrossAttentionFusion
from .transformer_backbone import SpatiotemporalTransformerBackbone
from .heads import ThunderstormHead, CloudburstHead, FlashFloodHead


class VayunetMTLModel(nn.Module):
    """
    VAYUNET Master End-to-End Deep Learning Architecture (SIH 26077).
    
    Inputs:
        x: Spatiotemporal raster tensor of shape (B, T=4, C=12, H=32, W=32)
           - Ch 0-2: INSAT-3D/3DR (WV, TIR, CTT Drop Rate)
           - Ch 3-6: Thermodynamic Instability (CAPE, CIN, LCL, Wind Shear)
           - Ch 7-8: Moisture Convergence (IWV, Moisture Flux)
           - Ch 9-11: ISRO CartoDEM (Elevation, Slope, Flow Accumulation)
    Outputs:
        dict containing:
           - 'thunderstorm': Logits (B, 1, H, W) for convective initiation & storm track
           - 'cloudburst': Logits (B, 1, H, W) for extreme precipitation (>100 mm/hr)
           - 'flash_flood': Logits (B, 1, H, W) for downhill torrent runoff & inundation
           - 'latent_embedding': Global latent vector (B, embed_dim) for downstream XAI
    """
    def __init__(
        self,
        img_size: int = 32,
        patch_size: int = 4,
        in_channels: int = 12,
        num_frames: int = 4,
        embed_dim: int = 128,
        depth: int = 4,
        num_heads: int = 8,
        mlp_ratio: float = 2.0,
        dropout: float = 0.1
    ):
        super().__init__()
        self.img_size = img_size
        self.patch_size = patch_size
        self.in_channels = in_channels
        self.num_frames = num_frames
        self.embed_dim = embed_dim

        # 1. Spatiotemporal Patch Tokenizer
        self.patch_embed = SpatiotemporalPatchEmbed(
            img_size=img_size,
            patch_size=patch_size,
            in_channels=in_channels,
            num_frames=num_frames,
            embed_dim=embed_dim,
            dropout=dropout
        )

        # 2. Multi-Modal Cross-Attention Alignment
        self.cross_modal_fusion = MultiModalCrossAttentionFusion(
            embed_dim=embed_dim,
            num_heads=4,
            mlp_ratio=mlp_ratio,
            dropout=dropout
        )

        # 3. Spatiotemporal Transformer Backbone
        self.backbone = SpatiotemporalTransformerBackbone(
            depth=depth,
            embed_dim=embed_dim,
            num_heads=num_heads,
            mlp_ratio=mlp_ratio,
            dropout=dropout
        )

        # 4. Multi-Task Learning Output Heads
        self.thunderstorm_head = ThunderstormHead(
            in_features=embed_dim,
            hidden_dim=64,
            target_size=img_size
        )
        self.cloudburst_head = CloudburstHead(
            in_features=embed_dim,
            hidden_dim=64,
            target_size=img_size
        )
        self.flash_flood_head = FlashFloodHead(
            in_features=embed_dim,
            topo_channels=3,
            hidden_dim=64,
            target_size=img_size
        )

    def forward(self, x: torch.Tensor) -> Dict[str, torch.Tensor]:
        """
        Forward pass of VAYUNET.
        
        Args:
            x: Tensor of shape (B, T, C, H, W)
        Returns:
            Dict containing hazard predictions and latent representations.
        """
        B, T, C, H, W = x.shape
        grid_h = H // self.patch_size
        grid_w = W // self.patch_size

        # Extract static topography from latest frame t: Ch 9 (elev), 10 (slope), 11 (flow accum)
        topography = x[:, -1, 9:12, :, :]  # (B, 3, H, W)
        elevation = topography[:, 0:1, :, :]  # (B, 1, H, W)

        # Step 1: Patch Embedding -> (B, T, num_patches, embed_dim)
        tokens, (H_out, W_out) = self.patch_embed(x)

        # Step 2: Cross-modal attention across temporal sequence
        # We fuse earlier temporal context (frames 0 to T-2) with current convective state (frame T-1)
        current_state = tokens[:, -1, :, :]  # (B, num_patches, embed_dim)
        temporal_context = tokens[:, :-1, :, :].reshape(B, (T - 1) * tokens.shape[2], self.embed_dim)
        fused_state = self.cross_modal_fusion(current_state, temporal_context)
        tokens = torch.cat([tokens[:, :-1, :, :], fused_state.unsqueeze(1)], dim=1)

        # Step 3: Spatiotemporal Transformer Processing
        # (B, T, num_patches, embed_dim)
        latent_tokens = self.backbone(tokens)

        # Extract latest frame latent spatial feature map: (B, embed_dim, grid_h, grid_w)
        latest_features = latent_tokens[:, -1, :, :]  # (B, num_patches, embed_dim)
        latent_map = latest_features.transpose(1, 2).view(B, self.embed_dim, grid_h, grid_w)

        # Step 4: Multi-Task Decoders
        ts_logits = self.thunderstorm_head(latent_map)
        cb_logits = self.cloudburst_head(latent_map)
        ff_logits = self.flash_flood_head(latent_map, cb_logits, topography)

        # Compute global latent representation for XAI / attribution
        global_latent = latest_features.mean(dim=1)  # (B, embed_dim)

        return {
            "thunderstorm": ts_logits,
            "cloudburst": cb_logits,
            "flash_flood": ff_logits,
            "elevation": elevation,
            "latent_map": latent_map,
            "global_latent": global_latent
        }
