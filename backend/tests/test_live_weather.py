"""
VAYUNET Live Weather & Feature Adapter Unit Tests
Tests coordinate validation, in-memory TTL caching, degraded provider handling,
training-compatible tensor schema, normalization consistency, and FastAPI endpoints.
"""

import unittest
import asyncio
import torch
from fastapi.testclient import TestClient

from api.main import app
from src.inference.live_weather import (
    validate_coordinates,
    get_cache_key,
    clear_weather_cache,
    fetch_open_meteo_weather,
    CACHE_TTL_SECONDS
)
from src.inference.feature_adapter import (
    VayunetFeatureAdapter,
    ALERT_THRESHOLDS
)


class TestLiveWeatherService(unittest.TestCase):
    def setUp(self):
        clear_weather_cache()

    def test_coordinate_validation_valid(self):
        """Valid coordinates must not raise exceptions."""
        validate_coordinates(11.5564, 76.1320)
        validate_coordinates(-90.0, -180.0)
        validate_coordinates(90.0, 180.0)
        validate_coordinates(0.0, 0.0)

    def test_coordinate_validation_invalid(self):
        """Out of bound coordinates must raise ValueError."""
        with self.assertRaises(ValueError):
            validate_coordinates(91.0, 72.0)
        with self.assertRaises(ValueError):
            validate_coordinates(-90.5, 72.0)
        with self.assertRaises(ValueError):
            validate_coordinates(11.0, 181.0)
        with self.assertRaises(ValueError):
            validate_coordinates(11.0, -180.5)
        with self.assertRaises(ValueError):
            validate_coordinates("invalid", 72.0)

    def test_cache_key_generation(self):
        """Coordinates must round to 4 decimal places for consistent cache grouping."""
        k1 = get_cache_key(11.55641, 76.13204)
        k2 = get_cache_key(11.55644, 76.13201)
        self.assertEqual(k1, "weather:11.5564:76.1320")
        self.assertEqual(k1, k2)

    def test_open_meteo_fetch_and_cache(self):
        """Tests live weather retrieval and verified 5-minute in-memory caching."""
        async def run_fetch():
            res1 = await fetch_open_meteo_weather(11.5564, 76.1320)
            self.assertIn(res1["status"], ["success", "degraded"])
            if res1["status"] == "success":
                self.assertFalse(res1["freshness"]["cached"])
                self.assertEqual(res1["freshness"]["cache_ttl_seconds"], CACHE_TTL_SECONDS)
                self.assertIn("weather", res1)
                self.assertIn("temperature_2m_c", res1["weather"])
                self.assertIn("relative_humidity_2m_pct", res1["weather"])
                self.assertIn("surface_pressure_hpa", res1["weather"])
                self.assertIn("cape_j_kg", res1["weather"])
                self.assertIn("cin_j_kg", res1["weather"])
                self.assertIn("total_column_water_vapour_kg_m2", res1["weather"])

                # Second immediate query must be a cache hit
                res2 = await fetch_open_meteo_weather(11.5564, 76.1320)
                self.assertTrue(res2["freshness"]["cached"])
                self.assertGreaterEqual(res2["freshness"]["age_seconds"], 0.0)

        asyncio.run(run_fetch())


class TestFeatureAdapterAndModelContract(unittest.TestCase):
    def setUp(self):
        self.adapter = VayunetFeatureAdapter()

    def test_adapter_tensor_dimensions_and_schema(self):
        """
        The critical model assertion: live inference tensor MUST match
        the training tensor shape (1, T=4, C=12, H=32, W=32) and be strictly normalized.
        """
        async def run_adapter_test():
            weather_data = await fetch_open_meteo_weather(11.5564, 76.1320)
            can_build, reason = self.adapter.can_build_tensor(weather_data)
            self.assertTrue(can_build, f"Feature adapter reported cannot build tensor: {reason}")

            tensor = self.adapter.build_inference_tensor(weather_data)
            self.assertEqual(tensor.shape, (1, 4, 12, 32, 32))
            self.assertEqual(tensor.dtype, torch.float32)

            # Strict normalization bounds assertion: [0.0, 1.0]
            self.assertGreaterEqual(tensor.min().item(), 0.0)
            self.assertLessEqual(tensor.max().item(), 1.0)

        asyncio.run(run_adapter_test())

    def test_outside_domain_context_guard(self):
        """Single coordinates outside spatial terrain grid must NOT manufacture fake tensors."""
        mock_remote_weather = {
            "location": {"lat": 28.6139, "lng": 77.2090},  # Delhi
            "_temporal_history": {"available_frames": 4}
        }
        can_build, reason = self.adapter.can_build_tensor(mock_remote_weather)
        self.assertFalse(can_build)
        self.assertIn("outside the CartoDEM spatial grid domain", reason)

    def test_risk_classification_thresholds(self):
        """Verifies centralized alert threshold mapping."""
        self.assertEqual(self.adapter.classify_risk(0.90), "RED")
        self.assertEqual(self.adapter.classify_risk(0.80), "RED")
        self.assertEqual(self.adapter.classify_risk(0.65), "ORANGE")
        self.assertEqual(self.adapter.classify_risk(0.60), "ORANGE")
        self.assertEqual(self.adapter.classify_risk(0.40), "YELLOW")
        self.assertEqual(self.adapter.classify_risk(0.35), "YELLOW")
        self.assertEqual(self.adapter.classify_risk(0.10), "GREEN")


class TestFastAPILiveEndpoints(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_realtime_weather_success(self):
        """GET /api/weather/realtime returns HTTP 200 with complete weather schema."""
        resp = self.client.get("/api/weather/realtime?lat=11.5564&lng=76.1320")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn(data["status"], ["success", "degraded"])
        self.assertEqual(data["source"]["provider"], "Open-Meteo")
        self.assertIn("weather", data)
        self.assertIn("timestamps", data)
        self.assertIn("freshness", data)

    def test_realtime_weather_invalid_coordinates(self):
        """GET /api/weather/realtime with invalid coordinates returns HTTP 400 Bad Request."""
        resp = self.client.get("/api/weather/realtime?lat=999.0&lng=76.1320")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("Latitude 999.0 is out of valid range", resp.json()["detail"])

    def test_nowcast_predict_inside_basin(self):
        """POST /api/nowcast/predict returns valid model nowcast predictions for Wayanad basin."""
        payload = {
            "lat": 11.5564,
            "lng": 76.1320,
            "lead_time_hours": 2
        }
        resp = self.client.post("/api/nowcast/predict", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn(data["status"], ["success", "partial"])
        if data["status"] == "success":
            self.assertEqual(data["model"]["version"], "VAYUNET-MTL-v2.0")
            self.assertIn("predictions", data)
            self.assertIn("thunderstorm", data["predictions"])
            self.assertIn("flash_flood", data["predictions"])
            self.assertIn("cloudburst", data["predictions"])
            self.assertIn("lead_time", data)
            self.assertIn("active_threat_level", data)
            self.assertIn("disclaimer", data)

    def test_nowcast_predict_outside_basin(self):
        """POST /api/nowcast/predict outside spatial basin context cleanly reports partial status."""
        payload = {
            "lat": 28.6139,
            "lng": 77.2090
        }
        resp = self.client.post("/api/nowcast/predict", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertFalse(data["model_inference_available"])
        self.assertEqual(data["status"], "partial")
        self.assertIn("reason", data)
        self.assertIn("weather", data)


if __name__ == "__main__":
    unittest.main()
