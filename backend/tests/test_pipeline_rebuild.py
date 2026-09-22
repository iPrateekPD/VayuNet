"""
VAYUNET Operational Rebuild Acceptance Test Suite
Validates:
1. Canonical coordinates consistency across all 13 locations
2. Live Open-Meteo ingestion with correct coordinates
3. Strict normalization within bounds
4. Predictor inference on actual checkpoint
5. New Delhi benign conditions producing SAFE across all hazards
6. Gunupur canonical Rayagada coordinates (19.0805, 83.8166)
7. End-to-end API verification for all 13 locations via HTTP
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import unittest
import httpx
from src.config.locations import list_locations, get_location, assert_coordinates_match

BASE_URL = "http://127.0.0.1:8000"


class TestPipelineRebuild(unittest.TestCase):

    def test_canonical_coordinates_all_13(self):
        """Verify that all 13 canonical locations have valid, distinct coordinates."""
        locations = list_locations()
        self.assertEqual(len(locations), 13, f"Expected 13 locations, got {len(locations)}")

        for loc in locations:
            loc_id = loc["id"]
            lat = loc["latitude"]
            lng = loc["longitude"]

            # Ensure both alias keys match
            self.assertEqual(loc["lat"], lat)
            self.assertEqual(loc["lng"], lng)

            # Ensure coordinates are within valid Indian bounding box
            self.assertTrue(8.0 <= lat <= 36.0, f"Lat {lat} out of Indian bounds for {loc_id}")
            self.assertTrue(68.0 <= lng <= 98.0, f"Lng {lng} out of Indian bounds for {loc_id}")

            # Ensure assert_coordinates_match succeeds
            self.assertTrue(assert_coordinates_match(loc_id, lat, lng))

    def test_gunupur_canonical_coordinates(self):
        """Verify Gunupur is situated in Rayagada District, Odisha, NOT Maharashtra."""
        loc = get_location("gunupur")
        self.assertIsNotNone(loc)
        self.assertAlmostEqual(loc["latitude"], 19.0805, places=3)
        self.assertAlmostEqual(loc["longitude"], 83.8166, places=3)
        self.assertIn("Odisha", loc["state"])
        self.assertIn("Rayagada", loc["district"])

    def test_new_delhi_canonical_coordinates(self):
        """Verify New Delhi coordinates."""
        loc = get_location("new_delhi")
        self.assertIsNotNone(loc)
        self.assertAlmostEqual(loc["latitude"], 28.6139, places=3)
        self.assertAlmostEqual(loc["longitude"], 77.2090, places=3)

    def test_api_debug_new_delhi(self):
        """Verify GET /api/risk/debug/new_delhi returns SAFE across all hazards under benign weather."""
        with httpx.Client(base_url=BASE_URL, timeout=15.0) as client:
            res = client.get("/api/risk/debug/new_delhi")
            self.assertEqual(res.status_code, 200, f"Failed: {res.text}")
            data = res.json()

            self.assertEqual(data["canonical_id"], "new_delhi")
            self.assertAlmostEqual(data["coordinates"]["latitude"], 28.6139, places=3)
            self.assertAlmostEqual(data["coordinates"]["longitude"], 77.2090, places=3)

            # Check tensor
            tensor_info = data["tensor"]
            self.assertEqual(tensor_info["shape"], [1, 4, 12, 32, 32])
            self.assertTrue(0.0 <= tensor_info["min"] <= tensor_info["max"] <= 1.0)

            # Check model execution
            model_info = data["model"]
            self.assertTrue(model_info["checkpoint_loaded"])
            self.assertTrue(model_info["inference_executed"])
            self.assertGreater(model_info["parameter_count"], 1000000)

            # Check risk outputs under benign conditions
            risk_info = data["risk"]
            levels = risk_info["risk_levels"]
            self.assertEqual(levels["thunderstorm"], "SAFE", f"Expected TS SAFE, got {levels['thunderstorm']}")
            self.assertEqual(levels["cloudburst"], "SAFE", f"Expected CB SAFE, got {levels['cloudburst']}")
            self.assertEqual(levels["flash_flood"], "SAFE", f"Expected FF SAFE, got {levels['flash_flood']}")

    def test_api_debug_gunupur(self):
        """Verify GET /api/risk/debug/gunupur returns correct canonical coordinates and tensor shape."""
        with httpx.Client(base_url=BASE_URL, timeout=15.0) as client:
            res = client.get("/api/risk/debug/gunupur")
            self.assertEqual(res.status_code, 200, f"Failed: {res.text}")
            data = res.json()

            self.assertEqual(data["canonical_id"], "gunupur")
            self.assertAlmostEqual(data["coordinates"]["latitude"], 19.0805, places=3)
            self.assertAlmostEqual(data["coordinates"]["longitude"], 83.8166, places=3)

            tensor_info = data["tensor"]
            self.assertEqual(tensor_info["shape"], [1, 4, 12, 32, 32])
            self.assertTrue(0.0 <= tensor_info["min"] <= tensor_info["max"] <= 1.0)

    def test_api_all_13_locations(self):
        """Verify GET /api/risk/{location} operates cleanly for all 13 canonical locations."""
        locations = list_locations()
        with httpx.Client(base_url=BASE_URL, timeout=25.0) as client:
            for loc in locations:
                loc_id = loc["id"]
                res = client.get(f"/api/risk/{loc_id}")
                self.assertEqual(res.status_code, 200, f"Failed for {loc_id}: {res.text}")
                data = res.json()

                # Verify location metadata matches
                self.assertEqual(data["canonical_id"], loc_id)
                self.assertAlmostEqual(data["location"]["latitude"], loc["latitude"], places=3)
                self.assertAlmostEqual(data["location"]["longitude"], loc["longitude"], places=3)

                # Verify model execution
                self.assertTrue(data["model"]["loaded"])
                self.assertTrue(data["model"]["inference_executed"])

                # Verify vayunet hazard payload
                vayunet = data["vayunet"]
                self.assertEqual(vayunet["status"], "INFERENCE_SUCCESS")
                for h in ["thunderstorm", "cloudburst", "flash_flood"]:
                    hazard_data = vayunet["hazards"][h]
                    self.assertTrue(0.0 <= hazard_data["score"] <= 1.0)
                    self.assertIn(hazard_data["risk_level"], ["SAFE", "MODERATE", "HIGH", "EXTREME"])

                # Forecast horizon is conditional (empty list if nominal SAFE)
                if data["primary_level"] == "SAFE":
                    self.assertEqual(data["forecast_horizon_hours"], [])
                else:
                    self.assertEqual(data["forecast_horizon_hours"], [1, 3, 6])


if __name__ == "__main__":
    unittest.main()
