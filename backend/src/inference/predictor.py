"""
VAYUNET Inference Predictor
Executes forward passes using the loaded model under torch.inference_mode()
and measures pure neural latency without network overhead.
"""

import time
import logging
from typing import Dict, Any, Tuple, Optional
import torch
import numpy as np

from src.inference.model_loader import get_model_manager
from src.data.historical import evaluate_historical_disaster_proximity, get_disaster_baseline
from src.config.locations import get_location

logger = logging.getLogger(__name__)


class VayunetPredictor:
    """
    Executes deep learning inference and synthesizes predictions with regional historical
    disaster benchmarks and real-time weather soundings.
    """
    def __init__(self):
        self.mgr = get_model_manager()
        self.model = self.mgr.model
        self.device = self.mgr.device

    def predict(
        self,
        tensor: torch.Tensor,
        location_id: Optional[str] = None,
        live_weather: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Runs model inference on input tensor and grounds output in regional historical disaster baselines.
        
        Args:
            tensor: Validated input tensor [1, T=4, C=12, H=32, W=32]
            location_id: Optional operational sector ID (e.g. 'kangra', 'wayanad', 'chamoli')
            live_weather: Optional live weather payload from Open-Meteo
        Returns:
            Dict containing predictions, latency, xai, historical evaluation, and verdict.
        """
        assert tensor.ndim == 5, f"Expected 5D tensor, got shape {tensor.shape}"
        assert tensor.shape[1] == 4, f"Expected 4 temporal frames, got {tensor.shape[1]}"
        assert tensor.shape[2] == 12, f"Expected 12 physical channels, got {tensor.shape[2]}"
        assert tensor.shape[3] == 32 and tensor.shape[4] == 32, f"Expected 32x32 spatial grid, got {tensor.shape[3]}x{tensor.shape[4]}"

        start_time = time.perf_counter()
        inp = tensor.to(self.device)

        with torch.inference_mode():
            outputs = self.model(inp)
            # Apply sigmoid to raw multi-task logits
            ts_probs = torch.sigmoid(outputs["thunderstorm"]).squeeze().cpu().numpy()
            cb_probs = torch.sigmoid(outputs["cloudburst"]).squeeze().cpu().numpy()
            ff_probs = torch.sigmoid(outputs["flash_flood"]).squeeze().cpu().numpy()

        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

        # Basin-wide neural peak risk scores [0.0 - 1.0]
        raw_ts = float(np.max(ts_probs))
        raw_cb = float(np.max(cb_probs))
        raw_ff = float(np.max(ff_probs))

        # Evaluate regional historical disaster proximity if context is provided
        hist_eval = None
        if location_id and live_weather:
            hist_eval = evaluate_historical_disaster_proximity(location_id, live_weather)

        # Dynamically calibrate predictions using neural output + historical disaster precursors
        calibrated_preds = self._calibrate_predictions(
            raw_ts=raw_ts,
            raw_cb=raw_cb,
            raw_ff=raw_ff,
            hist_eval=hist_eval,
            live_weather=live_weather
        )

        ts_final = calibrated_preds["thunderstorm"]
        cb_final = calibrated_preds["cloudburst"]
        ff_final = calibrated_preds["flash_flood"]

        logger.info(
            "[MODEL] model=%s device=%s latency=%sms loc=%s outputs: ts=%.3f cb=%.3f ff=%.3f",
            self.mgr.model_version,
            self.device,
            latency_ms,
            location_id or "generic",
            ts_final,
            cb_final,
            ff_final
        )

        xai_breakdown, verdict = self._compute_xai_attribution(
            inp=inp,
            cb_score=cb_final,
            ff_score=ff_final,
            ts_score=ts_final,
            location_id=location_id,
            hist_eval=hist_eval,
            live_weather=live_weather
        )

        return {
            "model_version": self.mgr.model_version,
            "device": str(self.device),
            "inference_latency_ms": latency_ms,
            "trained_checkpoint": self.mgr.is_trained,
            "predictions": {
                "thunderstorm": round(ts_final, 3),
                "cloudburst": round(cb_final, 3),
                "flash_flood": round(ff_final, 3)
            },
            "raw_neural_scores": {
                "thunderstorm": round(raw_ts, 3),
                "cloudburst": round(raw_cb, 3),
                "flash_flood": round(raw_ff, 3)
            },
            "spatial_grids": {
                "thunderstorm": ts_probs.tolist(),
                "cloudburst": cb_probs.tolist(),
                "flash_flood": ff_probs.tolist()
            },
            "historical_baseline": hist_eval,
            "xai": {
                "attribution_method": "physics_grounded_factor_contribution",
                "contributions": xai_breakdown
            },
            "scientific_verdict": verdict
        }

    def _calibrate_predictions(
        self,
        raw_ts: float,
        raw_cb: float,
        raw_ff: float,
        hist_eval: Optional[Dict[str, Any]],
        live_weather: Optional[Dict[str, Any]]
    ) -> Dict[str, float]:
        """
        Synthesizes the raw neural model outputs with real-time weather soundings and
        regional historical disaster trigger proximity.
        """
        if not hist_eval or not live_weather:
            return {
                "thunderstorm": raw_ts,
                "cloudburst": raw_cb,
                "flash_flood": raw_ff
            }

        w = live_weather.get("weather", {})
        cur_rain = float(w.get("rain_mm", 0.0) or w.get("precipitation_mm", 0.0) or 0.0)
        cur_cape = float(w.get("cape_j_kg", 0.0) or 0.0)
        cur_iwv = float(w.get("iwv_kg_m2", 0.0) or w.get("total_column_water_vapour_kg_m2", 0.0) or 30.0)

        match_pct = float(hist_eval.get("precursor_match_pct", 15.0))
        match_ratio = match_pct / 100.0
        prim_hazard = hist_eval.get("primary_hazard", "cloudburst")

        # Determine baseline weather severity
        is_calm = (cur_rain < 0.2) and (cur_cape < 900) and (cur_iwv < 42.0)

        if is_calm:
            # Baseline quiet conditions: scale to safe nominal levels (0.05 to 0.16)
            base_scale = 0.12 * (0.6 + 0.4 * match_ratio)
            ts = min(0.18, max(0.04, raw_ts * 0.15 + base_scale * 0.5))
            cb = min(0.18, max(0.04, raw_cb * 0.15 + base_scale * 0.5))
            ff = min(0.18, max(0.04, raw_ff * 0.15 + base_scale * 0.5))
        else:
            # Dynamic active weather: weight neural response with historical precursor correlation
            weight_nn = 0.55
            weight_hist = 0.45
            ts = np.clip(weight_nn * raw_ts + weight_hist * match_ratio, 0.08, 0.98)
            cb = np.clip(weight_nn * raw_cb + weight_hist * match_ratio, 0.08, 0.98)
            ff = np.clip(weight_nn * raw_ff + weight_hist * match_ratio, 0.08, 0.98)

            # Boost the region's historically proven primary hazard if precursors match
            if prim_hazard == "cloudburst":
                cb = min(0.98, cb * 1.15)
            elif prim_hazard == "flash_flood":
                ff = min(0.98, ff * 1.15)
            elif prim_hazard == "thunderstorm":
                ts = min(0.98, ts * 1.15)

        return {
            "thunderstorm": float(ts),
            "cloudburst": float(cb),
            "flash_flood": float(ff)
        }

    def _compute_xai_attribution(
        self,
        inp: torch.Tensor,
        cb_score: float,
        ff_score: float,
        ts_score: float,
        location_id: Optional[str] = None,
        hist_eval: Optional[Dict[str, Any]] = None,
        live_weather: Optional[Dict[str, Any]] = None
    ) -> Tuple[Dict[str, int], str]:
        """
        Derives factor contributions from the input atmospheric & terrain channels,
        and generates a physics-grounded scientific verdict referencing historical benchmarks.
        """
        latest_frame = inp[0, -1]
        ctt_strength = float(torch.abs(latest_frame[2]).mean().cpu().item())
        cape_strength = float(torch.abs(latest_frame[3]).mean().cpu().item())
        iwv_strength = float(torch.abs(latest_frame[7]).mean().cpu().item())
        slope_strength = float(torch.abs(latest_frame[10]).mean().cpu().item())

        total = ctt_strength + cape_strength + iwv_strength + slope_strength + 1e-6
        ctt_attr = int(round((ctt_strength / total) * 100))
        cape_attr = int(round((cape_strength / total) * 100))
        iwv_attr = int(round((iwv_strength / total) * 100))
        slope_attr = 100 - (ctt_attr + cape_attr + iwv_attr)

        breakdown = {
            "ctt_drop_rate": max(5, ctt_attr),
            "dem_slope_funneling": max(5, slope_attr),
            "cape_instability": max(5, cape_attr),
            "iwv_moisture_flux": max(5, iwv_attr)
        }
        diff = 100 - sum(breakdown.values())
        breakdown["ctt_drop_rate"] += diff

        # Generate scientific verdict
        loc_meta = get_location(location_id) if location_id else None
        loc_name = loc_meta["name"] if loc_meta else "Sector"

        cb_pct = int(round(cb_score * 100))
        ff_pct = int(round(ff_score * 100))
        ts_pct = int(round(ts_score * 100))
        max_pct = max(cb_pct, ff_pct, ts_pct)

        w = live_weather.get("weather", {}) if live_weather else {}
        cur_temp = w.get("temperature_2m_c", "--")
        cur_rain = w.get("rain_mm", w.get("precipitation_mm", 0.0))
        cur_cape = w.get("cape_j_kg", "--")
        cur_iwv = w.get("iwv_kg_m2", w.get("total_column_water_vapour_kg_m2", "--"))

        if hist_eval:
            b_event = hist_eval.get("benchmark_event", "historical events")
            app_disaster = hist_eval.get("applicable_disaster", "severe weather")
            match_pct = hist_eval.get("precursor_match_pct", 0)
            triggers = hist_eval.get("historical_triggers", {})
            t_iwv = triggers.get("iwv_mm", 55.0)
            t_cape = triggers.get("cape_j_kg", 2000)

            if max_pct >= 70:
                verdict = (
                    f"CRITICAL WARNING: Live weather in {loc_name} (rain {cur_rain} mm/h, CAPE {cur_cape} J/kg, IWV {cur_iwv} mm) "
                    f"matches {match_pct}% of the precursor signature observed during {b_event}. "
                    f"Elevated probability of {app_disaster} driven by atmospheric instability ({breakdown['cape_instability']}%) "
                    f"and orographic funneling ({breakdown['dem_slope_funneling']}%)."
                )
            elif max_pct >= 35:
                verdict = (
                    f"WATCH: Elevated convective precursors detected in {loc_name} ({match_pct}% proximity to {b_event} thresholds). "
                    f"Regional disaster susceptibility: {app_disaster}. Monitoring upstream drainage corridors."
                )
            else:
                verdict = (
                    f"Current weather in {loc_name} is nominal ({cur_temp}°C, rain {cur_rain} mm/h). "
                    f"Atmospheric precursors (CAPE: {cur_cape} J/kg, IWV: {cur_iwv} mm) are at {match_pct}% of the disaster trigger threshold "
                    f"established by {b_event} (disaster trigger: IWV > {t_iwv} mm, CAPE > {t_cape} J/kg). "
                    f"Disaster risk is currently NOMINAL."
                )
        else:
            if cb_pct >= 70:
                verdict = f"VAYUNET predicts elevated cloudburst risk ({cb_pct}%) driven by rapid cloud-top cooling and high moisture convergence."
            elif ff_pct >= 70:
                verdict = f"VAYUNET predicts high flash flood hazard ({ff_pct}%) due to steep terrain slope funneling."
            else:
                verdict = "Atmospheric instability and convective precursors currently within safe baseline parameters."

        return breakdown, verdict


# Singleton predictor instance
predictor = VayunetPredictor()

