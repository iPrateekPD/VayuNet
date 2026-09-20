"""
VAYUNET AI Model Architecture & Inference Unit Tests (SIH 26077)
Tests tensor shapes, multi-task heads, focal loss, gradient propagation, and inference latency.
"""

import unittest
import time
import torch

from src.models.patch_embed import SpatiotemporalPatchEmbed
from src.models.cross_attention import MultiModalCrossAttentionFusion
from src.models.transformer_backbone import SpatiotemporalTransformerBackbone
from src.models.heads import ThunderstormHead, CloudburstHead, FlashFloodHead
from src.models.loss import VayunetMultiTaskLoss, BinaryFocalLoss
from src.models.vayunet_model import VayunetMTLModel
from src.inference.pipeline import VayunetInferencePipeline
from src.features.tensor_builder import build_spatiotemporal_tensor_from_precursors


class TestVayunetAIModel(unittest.TestCase):
    def setUp(self):
        self.B = 2
        self.T = 4
        self.C = 12
        self.H = 32
        self.W = 32
        self.embed_dim = 128
        self.dummy_input = torch.randn(self.B, self.T, self.C, self.H, self.W)

    def test_patch_embed_dimensions(self):
        """Verify patch embed produces correct token sequence with positional encodings."""
        patch_embed = SpatiotemporalPatchEmbed(
            img_size=self.H,
            patch_size=4,
            in_channels=self.C,
            num_frames=self.T,
            embed_dim=self.embed_dim
        )
        tokens, (h_out, w_out) = patch_embed(self.dummy_input)
        num_patches = (self.H // 4) * (self.W // 4)  # 8 * 8 = 64
        self.assertEqual(tokens.shape, (self.B, self.T, num_patches, self.embed_dim))
        self.assertEqual((h_out, w_out), (8, 8))

    def test_cross_attention_fusion(self):
        """Verify multi-modal cross-attention correctly combines satellite and context tokens."""
        cross_attn = MultiModalCrossAttentionFusion(embed_dim=self.embed_dim, num_heads=4)
        queries = torch.randn(self.B, 64, self.embed_dim)
        context = torch.randn(self.B, 192, self.embed_dim)
        fused = cross_attn(queries, context)
        self.assertEqual(fused.shape, queries.shape)

    def test_spatiotemporal_backbone(self):
        """Verify divided space-time transformer backbone operates cleanly across sequence."""
        backbone = SpatiotemporalTransformerBackbone(
            depth=2,
            embed_dim=self.embed_dim,
            num_heads=4
        )
        tokens = torch.randn(self.B, self.T, 64, self.embed_dim)
        out = backbone(tokens)
        self.assertEqual(out.shape, tokens.shape)

    def test_mtl_heads_output_shapes(self):
        """Verify all three MTL heads produce valid (B, 1, H, W) prediction grids."""
        latent = torch.randn(self.B, self.embed_dim, 8, 8)
        topo = torch.randn(self.B, 3, self.H, self.W)

        ts_head = ThunderstormHead(in_features=self.embed_dim, target_size=self.H)
        cb_head = CloudburstHead(in_features=self.embed_dim, target_size=self.H)
        ff_head = FlashFloodHead(in_features=self.embed_dim, topo_channels=3, target_size=self.H)

        ts_logits = ts_head(latent)
        cb_logits = cb_head(latent)
        ff_logits = ff_head(latent, cb_logits, topo)

        self.assertEqual(ts_logits.shape, (self.B, 1, self.H, self.W))
        self.assertEqual(cb_logits.shape, (self.B, 1, self.H, self.W))
        self.assertEqual(ff_logits.shape, (self.B, 1, self.H, self.W))

    def test_end_to_end_model_and_gradient_flow(self):
        """Verify full VayunetMTLModel forward pass and backward gradient propagation."""
        model = VayunetMTLModel(
            img_size=self.H,
            patch_size=4,
            in_channels=self.C,
            num_frames=self.T,
            embed_dim=self.embed_dim,
            depth=2,
            num_heads=4
        )
        outputs = model(self.dummy_input)

        self.assertIn("thunderstorm", outputs)
        self.assertIn("cloudburst", outputs)
        self.assertIn("flash_flood", outputs)
        self.assertEqual(outputs["thunderstorm"].shape, (self.B, 1, self.H, self.W))
        self.assertEqual(outputs["cloudburst"].shape, (self.B, 1, self.H, self.W))
        self.assertEqual(outputs["flash_flood"].shape, (self.B, 1, self.H, self.W))

        # Test Multi-Task Focal Loss and backward pass
        criterion = VayunetMultiTaskLoss()
        targets = {
            "thunderstorm": (torch.rand(self.B, 1, self.H, self.W) > 0.8).float(),
            "cloudburst": (torch.rand(self.B, 1, self.H, self.W) > 0.9).float(),
            "flash_flood": (torch.rand(self.B, 1, self.H, self.W) > 0.85).float()
        }
        loss, breakdown = criterion(outputs, targets, outputs["elevation"])
        self.assertTrue(torch.isfinite(loss))
        self.assertGreater(loss.item(), 0.0)

        loss.backward()
        # Ensure gradients propagated to initial convolutional patch projection
        self.assertIsNotNone(model.patch_embed.proj.weight.grad)
        self.assertTrue(torch.isfinite(model.patch_embed.proj.weight.grad).all())

    def test_inference_pipeline_and_latency_benchmark(self):
        """Verify inference latency is well within operational requirements (< 180 ms)."""
        pipeline = VayunetInferencePipeline(checkpoint_path=None, device="cpu")
        sample_tensor = torch.randn(1, self.T, self.C, self.H, self.W)

        # Warmup
        _ = pipeline.predict_tensor(sample_tensor)

        start = time.perf_counter()
        result = pipeline.predict_tensor(sample_tensor)
        duration_ms = (time.perf_counter() - start) * 1000

        self.assertIn("hazard_probabilities", result)
        self.assertIn("scientific_verdict", result)
        self.assertIn("xai_attribution", result)
        self.assertEqual(sum(result["xai_attribution"].values()), 100)
        # VAYUNET strict SLA constraint: Sub-180ms nowcast latency
        self.assertLess(duration_ms, 180.0)
        print(f"\n[Benchmark] Single-frame VAYUNET CPU inference latency: {duration_ms:.2f} ms (Target: < 180 ms)")


if __name__ == "__main__":
    unittest.main()
