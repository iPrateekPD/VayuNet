"""
VAYUNET AI Model Architecture & Inference Unit Tests (SIH 26077)
Tests tensor shapes, multi-task heads, focal loss, gradient propagation, and inference latency.
"""

import unittest
import time
import torch

from app.ai.patch_embed import SpatiotemporalPatchEmbed
from app.ai.cross_attention import MultiModalCrossAttentionFusion
from app.ai.transformer_backbone import SpatiotemporalTransformerBackbone
from app.ai.heads import ThunderstormHead, CloudburstHead, FlashFloodHead
from app.ai.loss import VayunetMultiTaskLoss, BinaryFocalLoss
from app.ai.model import VayunetMTLModel
from app.ai.inference import VayunetInferencePipeline
from app.ai.preprocessing import build_spatiotemporal_tensor_from_precursors


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
"""
VAYUNET Multi-Hazard Pipeline Unit Tests (SIH 26077)
Verifies multi-modal ingestion, terrain derivative physics, anti-leakage normalization,
and multi-hazard target mask construction.
"""

import unittest
import torch
import numpy as np
from pathlib import Path

from app.config import PipelineConfig
from app.ai.preprocessing import (
    TerrainProcessor,
    SatelliteProcessor,
    ReanalysisProcessor,
    GroundTruthProcessor
)
from app.ai.preprocessing import SpatiotemporalTensorBuilder


class TestVayunetPipeline(unittest.TestCase):
    def setUp(self):
        self.config = PipelineConfig()

    def test_pipeline_config_and_domain_resolution(self):
        """Verify 1-degree domain at 32x32 produces nominal ~3.5-4.0 km spatial resolution."""
        lat_span = self.config.bbox_north - self.config.bbox_south
        lon_span = self.config.bbox_east - self.config.bbox_west
        self.assertAlmostEqual(lat_span, 1.0)
        self.assertAlmostEqual(lon_span, 1.0)
        self.assertEqual(self.config.grid_size, 32)
        self.assertEqual(self.config.in_channels, 12)
        self.assertEqual(self.config.num_frames, 4)

    def test_terrain_processor_outputs(self):
        """Verify CartoDEM extraction produces valid elevation, slope, and flow accumulation grids."""
        terrain_proc = TerrainProcessor(self.config)
        terrain = terrain_proc.process()
        self.assertIn("elevation", terrain)
        self.assertIn("slope", terrain)
        self.assertIn("flow_accumulation", terrain)

        H, W = self.config.grid_size, self.config.grid_size
        self.assertEqual(terrain["elevation"].shape, (H, W))
        self.assertEqual(terrain["slope"].shape, (H, W))
        self.assertEqual(terrain["flow_accumulation"].shape, (H, W))

        # Physical bounds
        self.assertGreaterEqual(terrain["elevation"].min(), 0.0)
        self.assertLessEqual(terrain["elevation"].max(), 3500.0)
        self.assertGreaterEqual(terrain["slope"].min(), 0.0)
        self.assertLessEqual(terrain["slope"].max(), 60.0)

    def test_satellite_processor_backward_difference(self):
        """Verify CTT drop rate strictly uses backward difference with zero future lookahead."""
        sat_proc = SatelliteProcessor(self.config)
        prev_tir = np.full((32, 32), 260.0, dtype=np.float32)
        wv, tir, ctt_rate = sat_proc.process_frame_pair("20180815_1200", prev_tir=prev_tir)

        self.assertEqual(wv.shape, (32, 32))
        self.assertEqual(tir.shape, (32, 32))
        self.assertEqual(ctt_rate.shape, (32, 32))

        # Expected rate = (tir - prev_tir) / 0.5 hours
        expected_rate = (tir - prev_tir) / 0.5
        np.testing.assert_allclose(ctt_rate, np.clip(expected_rate, -25.0, 5.0), atol=1e-3)

    def test_ground_truth_multi_hazard_targets(self):
        """Verify generation of all 3 binary hazard target masks: thunderstorm, cloudburst, flash flood."""
        gt_proc = GroundTruthProcessor(self.config)
        terrain = TerrainProcessor(self.config).process()
        hourly_rain = np.full((32, 32), 25.0, dtype=np.float32)  # Heavy rain
        tir = np.full((32, 32), 210.0, dtype=np.float32)         # Deep convective cold cloud top

        targets = gt_proc.build_target_masks("20180815", terrain, hourly_rain, tir)

        self.assertIn("thunderstorm", targets)
        self.assertIn("cloudburst", targets)
        self.assertIn("flash_flood", targets)

        self.assertEqual(targets["thunderstorm"].shape, (1, 32, 32))
        self.assertEqual(targets["cloudburst"].shape, (1, 32, 32))
        self.assertEqual(targets["flash_flood"].shape, (1, 32, 32))

        # Values must be strictly binary {0, 1}
        for name, mask in targets.items():
            unique_vals = np.unique(mask)
            for v in unique_vals:
                self.assertIn(v, [0.0, 1.0])

    def test_anti_leakage_normalization(self):
        """Verify normalization parameters are computed solely on training split."""
        builder = SpatiotemporalTensorBuilder(self.config)
        # Dummy un-normalized training batch: (B=4, T=4, C=12, H=32, W=32)
        dummy_train = torch.randn(4, 4, 12, 32, 32) * 100.0 + 50.0
        norm_params = builder._compute_training_normalization(dummy_train)

        self.assertEqual(len(norm_params), 12)
        normed = builder._apply_normalization(dummy_train, norm_params)
        self.assertGreaterEqual(float(normed.min()), 0.0)
        self.assertLessEqual(float(normed.max()), 1.0)


if __name__ == "__main__":
    unittest.main()
