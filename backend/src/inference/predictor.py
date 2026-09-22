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
        cur_rain = float(w.get("rain_mm") if w.get("rain_mm") is not None else w.get("rain") if w.get("rain") is not None else w.get("precipitation_mm") if w.get("precipitation_mm") is not None else w.get("precipitation", 0.0) or 0.0)
        cur_cape = float(w.get("cape_j_kg") if w.get("cape_j_kg") is not None else w.get("cape", 0.0) or 0.0)
        cur_iwv = float(w.get("iwv_kg_m2") if w.get("iwv_kg_m2") is not None else w.get("total_column_water_vapour_kg_m2") if w.get("total_column_water_vapour_kg_m2") is not None else w.get("total_column_water_vapour", 30.0) or 30.0)

        match_pct = float(hist_eval.get("precursor_match_pct", 15.0))
        match_ratio = match_pct / 100.0
        prim_hazard = hist_eval.get("primary_hazard", "cloudburst")

        # Calibrate raw focal-loss-biased outputs to true [0, 1] probability
        # Neural quiescent baseline: ts ~ 0.70, cb ~ 0.35, ff ~ 0.74
        neural_ts_signal = float(np.clip((raw_ts - 0.70) / 0.27, 0.0, 1.0))
        neural_cb_signal = float(np.clip((raw_cb - 0.35) / 0.55, 0.0, 1.0))
        neural_ff_signal = float(np.clip((raw_ff - 0.74) / 0.24, 0.0, 1.0))

        # Quiet / benign condition check: no rain and low instability
        is_dry_calm = (cur_rain < 0.2) and (cur_cape < 800)

        if is_dry_calm:
            # Baseline quiet conditions: nominal safe levels (0.05 to 0.25)
            base_scale = 0.10 * (0.6 + 0.4 * match_ratio)
            ts = np.clip(neural_ts_signal * 0.15 + base_scale, 0.05, 0.25)
            cb = np.clip(neural_cb_signal * 0.10 + base_scale * 0.5, 0.03, 0.20)
            ff = np.clip(neural_ff_signal * 0.12 + base_scale * 0.6, 0.04, 0.22)
        else:
            # Dynamic active weather: weight calibrated neural response with historical precursor correlation
            # If the neural model is untrained, rely heavily on meteorological heuristics
            is_trained = getattr(self.mgr, 'is_trained', False)
            weight_nn = 0.60 if is_trained else 0.10
            weight_hist = 0.40 if is_trained else 0.90
            
            ts_dyn = weight_nn * neural_ts_signal + weight_hist * match_ratio
            cb_dyn = weight_nn * neural_cb_signal + weight_hist * match_ratio
            ff_dyn = weight_nn * neural_ff_signal + weight_hist * match_ratio

            # Physical meteorological gating:
            # 1. Cloudburst requires significant rainfall intensity or extreme atmospheric sounding
            if cur_rain < 1.0 and cur_cape < 1500:
                cb_dyn = min(cb_dyn, 0.28)
            elif cur_rain < 5.0 and cur_cape < 2000:
                cb_dyn = min(cb_dyn, 0.55)
            elif cur_rain >= 30.0 or (cur_rain >= 15.0 and cur_cape >= 2000):
                cb_dyn = max(cb_dyn, 0.75)

            # 2. Flash flood requires substantial rain or antecedent accumulation
            if cur_rain < 1.0:
                ff_dyn = min(ff_dyn, 0.30)
            elif cur_rain < 5.0:
                ff_dyn = min(ff_dyn, 0.55)
            elif cur_rain >= 25.0:
                ff_dyn = max(ff_dyn, 0.75)

            # 3. Thunderstorm requires moderate CAPE or active rain
            # We must not clamp too aggressively if rain is 0, because we need to FORECAST incoming storms
            if cur_cape < 1000 and cur_rain < 0.5:
                ts_dyn = min(ts_dyn, 0.30)
            elif cur_cape >= 2000 and cur_rain >= 5.0:
                ts_dyn = max(ts_dyn, 0.70)

            ts = np.clip(ts_dyn, 0.05, 0.98)
            cb = np.clip(cb_dyn, 0.03, 0.98)
            ff = np.clip(ff_dyn, 0.04, 0.98)

        # Boost the region's historically proven primary hazard if conditions are active
        if not is_dry_calm and (ts >= 0.35 or cb >= 0.35 or ff >= 0.35):
            if prim_hazard == "cloudburst" and cur_rain >= 2.0:
                cb = min(0.98, cb * 1.15)
            elif prim_hazard == "flash_flood" and cur_rain >= 2.0:
                ff = min(0.98, ff * 1.15)
            elif prim_hazard == "thunderstorm" and cur_cape >= 1000:
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
        cur_temp = w.get("temperature_2m_c") if w.get("temperature_2m_c") is not None else w.get("temperature", "--")
        cur_rain = w.get("rain_mm") if w.get("rain_mm") is not None else w.get("rain") if w.get("rain") is not None else w.get("precipitation_mm") if w.get("precipitation_mm") is not None else w.get("precipitation", 0.0) or 0.0
        cur_cape = w.get("cape_j_kg") if w.get("cape_j_kg") is not None else w.get("cape", "--")
        cur_iwv = w.get("iwv_kg_m2") if w.get("iwv_kg_m2") is not None else w.get("total_column_water_vapour_kg_m2") if w.get("total_column_water_vapour_kg_m2") is not None else w.get("total_column_water_vapour", "--")

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

