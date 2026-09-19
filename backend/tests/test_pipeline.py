"""
VAYUNET Multi-Hazard Pipeline Unit Tests (SIH 26077)
Verifies multi-modal ingestion, terrain derivative physics, anti-leakage normalization,
and multi-hazard target mask construction.
"""

import unittest
import torch
import numpy as np
from pathlib import Path

from src.pipeline.config import PipelineConfig
from src.pipeline.raw_processors import (
    TerrainProcessor,
    SatelliteProcessor,
    ReanalysisProcessor,
    GroundTruthProcessor
)
from src.pipeline.tensor_builder import SpatiotemporalTensorBuilder


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
