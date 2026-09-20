"""
Nowcast Prediction Route
Executes end-to-end operational nowcasting using real-time weather and genuine PyTorch inference.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from src.config.locations import get_location, find_closest_location
from src.weather.open_meteo import get_weather_for_location, format_ist_timestamp, _fetch_from_api
from src.inference.feature_adapter import VayunetFeatureAdapter
from src.inference.predictor import predictor
from src.inference.model_loader import get_model_manager
from src.risk.alert_engine import determine_primary_hazard, classify_alert_level, RECOMMENDED_ACTIONS, HAZARD_DISPLAY_NAMES

router = APIRouter(tags=["Nowcast"])
feature_adapter = VayunetFeatureAdapter()


class NowcastRequestBody(BaseModel):
    lat: float = Field(..., description="Target Latitude")
    lng: float = Field(..., description="Target Longitude")
    lead_time_hours: int = Field(default=2, ge=2, le=6, description="Lead time horizon in hours")
    location_id: Optional[str] = Field(default=None, description="Optional location slug ID")


@router.get("/api/locations/{location_id}/nowcast")
async def get_location_nowcast(location_id: str, lead_time_hours: int = 2):
    """
    Executes operational deep learning inference for a configured operational location.
    Requires genuine spatial terrain rasters and temporal context; does not fabricate inputs.
    """
    loc = get_location(location_id)
    if not loc:
        raise HTTPException(status_code=404, detail=f"Location '{location_id}' not found.")

    # 1. Ingest real-time weather telemetry from Open-Meteo
    live_weather = await get_weather_for_location(location_id)
    now_ist = format_ist_timestamp()

    # 2. Check spatial & temporal context without fabricating inputs
    can_infer, reason = feature_adapter.can_build_tensor(live_weather)

    if not can_infer:
        mgr = get_model_manager()
        return {
            "prediction_status": "UNAVAILABLE",
            "data_status": "LIVE",
            "reason": reason or "Live data does not contain the spatial/temporal features required.",
            "location": loc,
            "weather": {
                "temperature_c": live_weather.get("weather", {}).get("temperature_2m_c"),
                "humidity_percent": live_weather.get("weather", {}).get("relative_humidity_2m_pct"),
                "pressure_hpa": live_weather.get("weather", {}).get("surface_pressure_hpa"),
                "rain_mm_h": live_weather.get("weather", {}).get("rain_mm"),
                "wind_speed_ms": round(live_weather.get("weather", {}).get("wind_speed_10m_kmh", 0) / 3.6, 2) if live_weather.get("weather", {}).get("wind_speed_10m_kmh") is not None else None,
                "cape_jkg": live_weather.get("weather", {}).get("cape_j_kg"),
                "cin_jkg": live_weather.get("weather", {}).get("cin_j_kg"),
                "iwv_kg_m2": live_weather.get("weather", {}).get("total_column_water_vapour_kg_m2")
            },
            "model": {
                "version": mgr.model_version
            }
        }

    # 3. Build training-compatible tensor [1, T=4, C=12, H=32, W=32]
    input_tensor = feature_adapter.build_inference_tensor(live_weather)

    # 4. Run PyTorch forward inference grounded in regional historical disaster baselines
    ai_result = predictor.predict(input_tensor, location_id=location_id, live_weather=live_weather)
    predictions = ai_result["predictions"]

    # 5. Dynamically determine primary hazard & alert levels
    prim_hazard, max_score, alert_lvl = determine_primary_hazard(predictions)

    # 6. Attenuated lead-time forecasts
    lead_time_dict = {}
    for lk, factor in [("2h", 1.0), ("4h", 0.88), ("6h", 0.72)]:
        ts_s = round(min(1.0, max(0.0, predictions["thunderstorm"] * factor)), 3)
        cb_s = round(min(1.0, max(0.0, predictions["cloudburst"] * factor)), 3)
        ff_s = round(min(1.0, max(0.0, predictions["flash_flood"] * factor)), 3)
        m_s = max(ts_s, cb_s, ff_s)
        lead_time_dict[lk] = {
            "threat_level": classify_alert_level(m_s),
            "thunderstorm_risk_score": ts_s,
            "cloudburst_risk_score": cb_s,
            "flash_flood_risk_score": ff_s
        }

    target_lead_key = f"{lead_time_hours}h"
    current_forecast = lead_time_dict.get(target_lead_key, lead_time_dict["2h"])
    hist_baseline = ai_result.get("historical_baseline")

    return {
            "prediction_status": "SUCCESS",
            "data_status": "LIVE",
            "location": loc,
            "weather": {
                "temperature_c": live_weather["weather"].get("temperature_2m_c"),
                "humidity_percent": live_weather["weather"].get("relative_humidity_2m_pct"),
                "pressure_hpa": live_weather["weather"].get("surface_pressure_hpa"),
                "rain_mm_h": live_weather["weather"].get("rain_mm"),
                "wind_speed_ms": round(live_weather["weather"].get("wind_speed_10m_kmh", 0) / 3.6, 2) if live_weather["weather"].get("wind_speed_10m_kmh") is not None else None,
                "cape_jkg": live_weather["weather"].get("cape_j_kg"),
                "cin_jkg": live_weather["weather"].get("cin_j_kg"),
                "iwv_kg_m2": live_weather["weather"].get("total_column_water_vapour_kg_m2")
            },
            "prediction": {
                "thunderstorm_probability": current_forecast["thunderstorm_risk_score"],
                "cloudburst_probability": current_forecast["cloudburst_risk_score"],
                "flash_flood_probability": current_forecast["flash_flood_risk_score"]
            },
            "risk": {
                "score": max_score,
                "level": current_forecast["threat_level"],
                "status": RECOMMENDED_ACTIONS.get(current_forecast["threat_level"], "NOMINAL")
            },
            "forecast_window": f"0-{lead_time_hours}h",
            "model": {
                "version": ai_result["model_version"]
            },
            "timestamps": {
                "weather_time": live_weather["timestamps"]["provider_time"],
                "retrieved_at": live_weather["timestamps"]["retrieved_at"],
                "prediction_time": now_ist
            }
        }


@router.get("/api/locations/{location_id}/nowcast")
async def get_nowcast_endpoint(location_id: str, lead_time_hours: int = 2):
    """
    Standard GET endpoint for nowcast by location ID.
    """
    return await get_location_nowcast(location_id, lead_time_hours=lead_time_hours)


@router.post("/api/nowcast/predict")
async def predict_nowcast_post(req: NowcastRequestBody):
    """
    Backward-compatible coordinates endpoint.
    Maps to operational location if provided or resolves nearest operational sector.
    """
    target_loc_id = req.location_id
    if not target_loc_id:
        closest = find_closest_location(req.lat, req.lng, threshold_deg=1.5)
        if closest:
            target_loc_id = closest["id"]

    if target_loc_id:
        return await get_location_nowcast(target_loc_id, lead_time_hours=req.lead_time_hours)

    # For coordinates outside operational sectors without location_id, return un-fabricated partial status
    now_ist = format_ist_timestamp()
    live_w = await _fetch_from_api(req.lat, req.lng, {"id": "custom", "name": f"Coord ({req.lat:.2f}, {req.lng:.2f})", "state": "India", "lat": req.lat, "lng": req.lng})
    mgr = get_model_manager()

    return {
        "status": "partial",
        "data_mode": "LIVE",
        "model_inference_available": False,
        "spatial_context_available": False,
        "reason": f"Location ({req.lat:.4f}, {req.lng:.4f}) is outside the CartoDEM spatial grid domain and supported operational sectors. Spatial 32x32 terrain context is required for deep learning tensor inference.",
        "location": {"lat": req.lat, "lng": req.lng},
        "model": {
            "version": mgr.model_version,
            "device": str(mgr.device),
            "inference_latency_ms": None
        },
        "weather": live_w.get("weather", {}),
        "weather_telemetry": live_w.get("weather", {}),
        "timestamps": {
            "weather_time": live_w.get("timestamps", {}).get("provider_time", now_ist),
            "retrieved_at": live_w.get("timestamps", {}).get("retrieved_at", now_ist),
            "prediction_time": now_ist
        },
        "disclaimer": "AI-generated risk assessment - not an official warning."
    }

