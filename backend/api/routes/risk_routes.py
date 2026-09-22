from fastapi import APIRouter, HTTPException, Query
from src.data_sources.registry import registry
from datetime import datetime, timezone, timedelta
import asyncio
import logging
import time
import torch
import numpy as np
from typing import Dict, Any, Optional

from src.config.locations import get_location, list_locations
from api.routes.weather import get_imd_current_weather
from src.inference.live_weather import fetch_open_meteo_weather

router = APIRouter(tags=["Risk Assessment"])

# In-memory risk cache with short TTL (60s) for deduplication
_RISK_CACHE: Dict[str, Dict[str, Any]] = {}
_RISK_CACHE_TTL = 60.0  # seconds


@router.get("/api/risk/validation/all")
async def validate_all_locations():
    """
    Development/admin validation endpoint iterating through every configured canonical location
    in VAYUNET and returning verified live inference telemetry.
    """
    locations = list_locations()
    results = []
    successful = 0
    failed = 0

    for loc in locations:
        loc_id = loc["id"]
        try:
            risk_data = await get_unified_risk(loc_id, bypass_cache=True)
            vayunet = risk_data.get("vayunet", {})
            hazards = vayunet.get("hazards", {})
            model_prov = risk_data.get("model", {})
            obs = risk_data.get("observations", {}).get("aws", {})

            is_success = (
                vayunet.get("status") in ["INFERENCE_SUCCESS", "GREEN NORMAL", "YELLOW WATCH", "ORANGE ALERT", "RED ALERT"]
                and model_prov.get("inference_executed", False)
            )

            if is_success:
                successful += 1
            else:
                failed += 1

            results.append({
                "region": loc["name"],
                "canonical_id": loc_id,
                "coordinates": [loc["lat"], loc["lng"]],
                "weather_source": obs.get("source_label", obs.get("source", "Open-Meteo")),
                "weather_status": obs.get("status", "LIVE_FALLBACK"),
                "checkpoint_loaded": model_prov.get("loaded", True),
                "inference_executed": model_prov.get("inference_executed", False),
                "input_shape": [1, 4, 12, 32, 32],
                "thunderstorm": {
                    "raw_output": hazards.get("thunderstorm", {}).get("raw_output", 0.0),
                    "score": hazards.get("thunderstorm", {}).get("score", 0.0),
                    "level": hazards.get("thunderstorm", {}).get("level", "UNKNOWN")
                },
                "cloudburst": {
                    "raw_output": hazards.get("cloudburst", {}).get("raw_output", 0.0),
                    "score": hazards.get("cloudburst", {}).get("score", 0.0),
                    "level": hazards.get("cloudburst", {}).get("level", "UNKNOWN")
                },
                "flash_flood": {
                    "raw_output": hazards.get("flash_flood", {}).get("raw_output", 0.0),
                    "score": hazards.get("flash_flood", {}).get("score", 0.0),
                    "level": hazards.get("flash_flood", {}).get("level", "UNKNOWN")
                },
                "error": None if is_success else vayunet.get("status", "Unknown failure")
            })
        except Exception as e:
            failed += 1
            results.append({
                "region": loc["name"],
                "canonical_id": loc_id,
                "coordinates": [loc["lat"], loc["lng"]],
                "weather_source": None,
                "weather_status": "DATA_UNAVAILABLE",
                "checkpoint_loaded": False,
                "inference_executed": False,
                "input_shape": [1, 4, 12, 32, 32],
                "thunderstorm": {"score": 0.0, "level": "INFERENCE_UNAVAILABLE"},
                "cloudburst": {"score": 0.0, "level": "INFERENCE_UNAVAILABLE"},
                "flash_flood": {"score": 0.0, "level": "INFERENCE_UNAVAILABLE"},
                "error": str(e)
            })

    return {
        "total_locations": len(locations),
        "successful": successful,
        "failed": failed,
        "locations": results
    }


from src.inference.predictor import VayunetPredictor
from src.config.locations import get_location, list_locations, assert_coordinates_match

predictor = VayunetPredictor()


@router.get("/api/risk/debug/{region}")
async def get_risk_debug(region: str):
    """
    Comprehensive diagnostic endpoint exposing raw weather inputs, temporal history,
    engineered features, normalization bounds, input tensor statistics, raw model logits,
    and calibrated hazard probabilities.
    """
    loc = get_location(region)
    if not loc:
        raise HTTPException(status_code=404, detail=f"Location '{region}' not found.")

    canonical_id = loc["id"]
    canonical_name = loc["display_name"]
    lat = loc["latitude"]
    lng = loc["longitude"]
    assert_coordinates_match(canonical_id, lat, lng)

    # 1. Weather acquisition
    om_data = await fetch_open_meteo_weather(lat=lat, lng=lng, location_id=canonical_id)
    w_block = om_data.get("weather", {})
    temp_hist = om_data.get("_temporal_history", {})

    temp_c = float(w_block.get("temperature_2m_c", 25.0))
    humidity = float(w_block.get("relative_humidity_2m_pct", 50.0))
    pressure = float(w_block.get("surface_pressure_hpa", 1010.0))
    rain = float(w_block.get("rain_mm", 0.0))
    precipitation = float(w_block.get("precipitation_mm", rain))
    wind_speed = float(w_block.get("wind_speed_10m_kmh", 10.0))
    wind_dir = float(w_block.get("wind_direction_10m_deg", 0.0))
    cape = float(w_block.get("cape_j_kg", 0.0))
    cin = float(w_block.get("convective_inhibition_j_kg", 0.0))
    iwv = float(w_block.get("total_column_water_vapour_kg_m2", 30.0))

    live_weather_payload = {
        "location": loc,
        "weather": {
            "temperature": temp_c,
            "humidity": humidity,
            "pressure": pressure,
            "precipitation": precipitation,
            "rain": rain,
            "wind_speed": wind_speed,
            "wind_direction": wind_dir,
            "wind_gusts": 0.0,
            "cape": cape,
            "cin": cin,
            "total_column_water_vapour": iwv,
            "antecedent_rainfall_72h": rain * 24.0
        },
        "_temporal_history": temp_hist
    }

    # 2. Tensor & Model execution
    from api.main import adapter
    tensor = adapter.build_inference_tensor(live_weather_payload)
    pred_res = predictor.predict(tensor, location_id=canonical_id, live_weather=live_weather_payload)

    # Channel-by-channel feature inspection
    norm_channels = []
    for c in range(12):
        p = adapter.norm_params[c]
        ch_slice = tensor[0, -1, c, :, :]
        norm_channels.append({
            "index": c,
            "name": p["name"],
            "unit": p.get("unit", ""),
            "min_bound": float(p["min"]),
            "max_bound": float(p["max"]),
            "tensor_min": round(float(ch_slice.min().item()), 4),
            "tensor_max": round(float(ch_slice.max().item()), 4),
            "tensor_mean": round(float(ch_slice.mean().item()), 4)
        })

    return {
        "canonical_id": canonical_id,
        "coordinates": {"latitude": lat, "longitude": lng},
        "location": {
            "id": canonical_id,
            "display_name": canonical_name,
            "latitude": lat,
            "longitude": lng,
            "elevation_m": loc.get("elevation_m"),
            "terrain_type": loc.get("terrain_type"),
            "timezone": "Asia/Kolkata"
        },
        "weather_request": {
            "location": canonical_id,
            "latitude": lat,
            "longitude": lng
        },
        "weather_observation": {
            "temperature_c": temp_c,
            "humidity_pct": humidity,
            "pressure_hpa": pressure,
            "rainfall_mm": rain,
            "precipitation_mm": precipitation,
            "wind_speed_kmh": wind_speed,
            "wind_direction_deg": wind_dir,
            "cape_j_kg": cape,
            "cin_j_kg": cin,
            "iwv_mm": iwv,
            "observation_time": om_data.get("timestamps", {}).get("provider_time")
        },
        "temporal_history": temp_hist,
        "normalization": {
            "status": "applied_from_normalization.json",
            "channels": norm_channels
        },
        "tensor": {
            "shape": list(tensor.shape),
            "dtype": str(tensor.dtype),
            "min": round(float(tensor.min().item()), 4),
            "max": round(float(tensor.max().item()), 4),
            "mean": round(float(tensor.mean().item()), 4)
        },
        "model": {
            "model_name": "VAYUNET-MTL",
            "model_version": "V3",
            "checkpoint_loaded": True,
            "inference_executed": True,
            "parameter_count": sum(p.numel() for p in predictor.model.parameters()),
            "device": str(predictor.device),
            "evaluation_mode": not predictor.model.training,
            "raw_outputs": pred_res.get("raw_neural_scores", pred_res.get("raw_outputs", {}))
        },
        "risk": {
            "calibrated_scores": pred_res.get("predictions", {}),
            "risk_levels": {
                h: ("EXTREME" if s >= 0.80 else "HIGH" if s >= 0.60 else "MODERATE" if s >= 0.35 else "SAFE")
                for h, s in pred_res.get("predictions", {}).items()
            },
            "xai_attribution": pred_res.get("xai", {}).get("contributions", pred_res.get("xai_attribution", {})),
            "verdict": pred_res.get("scientific_verdict", pred_res.get("verdict", ""))
        }
    }


@router.get("/api/risk/{region}")
async def get_unified_risk(region: str, bypass_cache: bool = False):
    """
    Universal Risk Assessment endpoint for all configured locations.
    Pipeline:
    Location -> Canonical coordinates -> Weather acquisition (IMD / Open-Meteo fallback)
    -> Feature engineering (11 atmospheric variables + 4 frames) -> Strict Normalization
    -> VAYUNET-MTL model.forward() -> Hazard outputs (raw, score, severity) -> Risk API
    """
    now_utc = datetime.now(timezone.utc)
    ist = timezone(timedelta(hours=5, minutes=30))
    now_ist = now_utc.astimezone(ist)
    timestamp_utc_str = now_utc.isoformat()
    timestamp_ist_str = now_ist.isoformat()

    # 1. Resolve canonical location metadata
    loc = get_location(region)
    if not loc:
        # Fallback to Gunupur (canonical basin of VAYUNET) if unknown
        loc = get_location("gunupur") or {"id": "gunupur", "name": "Gunupur", "display_name": "Gunupur", "lat": 19.0805, "lng": 83.8166}

    canonical_id = loc["id"]
    canonical_name = loc.get("display_name") or loc["name"]
    lat = loc["lat"]
    lng = loc["lng"]
    assert_coordinates_match(canonical_id, lat, lng)

    # Structured logging (Section 3)
    logging.info(
        "[LOCATION]\nid=%s\ndisplay_name=%s\nlatitude=%.4f\nlongitude=%.4f",
        canonical_id, canonical_name, lat, lng
    )
    logging.info(
        "[WEATHER REQUEST]\nlocation=%s\nlatitude=%.4f\nlongitude=%.4f",
        canonical_id, lat, lng
    )
    logging.info(
        "[MAP]\nlatitude=%.4f\nlongitude=%.4f",
        lat, lng
    )
    logging.info(
        "[RISK]\nlatitude=%.4f\nlongitude=%.4f",
        lat, lng
    )

    # Check cache if not bypassed
    cache_key = f"risk:{canonical_id}"
    now_time = time.time()
    if not bypass_cache and cache_key in _RISK_CACHE:
        cached_entry = _RISK_CACHE[cache_key]
        if (now_time - cached_entry["cached_at"]) < _RISK_CACHE_TTL:
            return cached_entry["data"]

    # 2. Parallel Weather Acquisition & IMD Feeds
    aws_srv = registry.get("imd_aws")
    warn_srv = registry.get("imd_warnings")
    nowcast_srv = registry.get("imd_nowcast")
    radar_srv = registry.get("imd_radar")

    weather_task = get_imd_current_weather(region=canonical_name)
    open_meteo_task = fetch_open_meteo_weather(lat=lat, lng=lng, location_id=canonical_id)
    warn_task = warn_srv.get_warnings(district=canonical_name) if warn_srv else None
    nowcast_task = nowcast_srv.get_nowcast(district=canonical_name) if nowcast_srv else None
    radar_task = radar_srv.get_radar(region=canonical_name) if radar_srv else None

    tasks = [weather_task, open_meteo_task]
    if warn_task: tasks.append(warn_task)
    if nowcast_task: tasks.append(nowcast_task)
    if radar_task: tasks.append(radar_task)

    results = await asyncio.gather(*tasks, return_exceptions=True)

    aws_data = results[0] if (len(results) > 0 and isinstance(results[0], dict)) else {}
    om_data = results[1] if (len(results) > 1 and isinstance(results[1], dict)) else {}

    idx = 2
    warnings_data = []
    if warn_task:
        if idx < len(results) and not isinstance(results[idx], Exception):
            warnings_data = [w.dict() for w in results[idx]]
        idx += 1

    nowcast_data = []
    if nowcast_task:
        if idx < len(results) and not isinstance(results[idx], Exception):
            nowcast_data = [n.dict() for n in results[idx]]
        idx += 1

    radar_data = {}
    if radar_task:
        if idx < len(results) and not isinstance(results[idx], Exception):
            radar_data = results[idx]
        idx += 1

    # Determine weather source & status
    weather_source = aws_data.get("source_label", aws_data.get("source", "Open-Meteo"))
    weather_status = aws_data.get("status", "LIVE_FALLBACK")
    if weather_status not in ["LIVE", "LIVE_FALLBACK"] and om_data.get("status") == "success":
        weather_status = "LIVE_FALLBACK"
        weather_source = "Open-Meteo"

    is_weather_available = (weather_status in ["LIVE", "LIVE_FALLBACK"])

    # 3. Model Engine & Feature Adapter
    from api.main import adapter

    vayunet_payload = {
        "model_name": "VAYUNET-MTL",
        "model_version": "V3.0",
        "status": "UNKNOWN",
        "hazards": {
            "thunderstorm": {"raw_output": 0.0, "score": 0.0, "probability": 0.0, "level": "UNKNOWN", "risk_level": "UNKNOWN"},
            "cloudburst": {"raw_output": 0.0, "score": 0.0, "probability": 0.0, "level": "UNKNOWN", "risk_level": "UNKNOWN"},
            "flash_flood": {"raw_output": 0.0, "score": 0.0, "probability": 0.0, "level": "UNKNOWN", "risk_level": "UNKNOWN"}
        },
        "xai_attribution": {}
    }

    model_prov = {
        "name": "VAYUNET-MTL",
        "version": "V3",
        "checkpoint": "vayunet_mtl_best.pt",
        "loaded": True,
        "inference_executed": False,
        "inference_timestamp": None
    }

    primary_hazard = None
    primary_level = "SAFE"

    if not is_weather_available:
        vayunet_payload["status"] = "DATA_UNAVAILABLE"
        for h in vayunet_payload["hazards"]:
            vayunet_payload["hazards"][h]["level"] = "DATA_UNAVAILABLE"
            vayunet_payload["hazards"][h]["risk_level"] = "DATA_UNAVAILABLE"
    else:
        try:
            w_block = om_data.get("weather", {})
            temp_history = om_data.get("_temporal_history", {})

            temp_c = float(aws_data.get("temperature_c") or w_block.get("temperature_2m_c", 25.0))
            humidity = float(aws_data.get("humidity_pct") or w_block.get("relative_humidity_2m_pct", 50.0))
            pressure = float(aws_data.get("pressure_hpa") or w_block.get("surface_pressure_hpa", 1010.0))
            rain = float(aws_data.get("rainfall_mm") or w_block.get("rain_mm", 0.0))
            precipitation = float(w_block.get("precipitation_mm", rain))
            wind_speed = float(aws_data.get("wind_speed_ms", 5.0) * 3.6 if aws_data.get("wind_speed_ms") else w_block.get("wind_speed_10m_kmh", 10.0))
            wind_dir = float(aws_data.get("wind_direction_deg") or w_block.get("wind_direction_10m_deg", 0.0))
            wind_gusts = float(w_block.get("wind_gusts_10m_kmh", wind_speed * 1.5))
            cape = float(w_block.get("cape_j_kg", 0.0))
            cin = float(w_block.get("cin_j_kg", 0.0))
            iwv = float(w_block.get("total_column_water_vapour_kg_m2", 30.0))

            # Log raw Open-Meteo response
            logging.info(
                "[OPEN METEO RAW]\nlocation=%s\ncoordinates=(%.4f, %.4f)\nobservation_time=%s\ntemperature=%.1f\nhumidity=%.1f\npressure=%.1f\nprecipitation=%.1f\nrain=%.1f\nwind=%.1f\nCAPE=%.1f\nCIN=%.1f",
                canonical_name, lat, lng,
                om_data.get("timestamps", {}).get("provider_time") or timestamp_ist_str,
                temp_c, humidity, pressure, precipitation, rain, wind_speed, cape, cin
            )

            live_weather_payload = {
                "location": loc,
                "weather": {
                    "temperature": temp_c,
                    "humidity": humidity,
                    "pressure": pressure,
                    "precipitation": precipitation,
                    "rain": rain,
                    "wind_speed": wind_speed,
                    "wind_direction": wind_dir,
                    "wind_gusts": wind_gusts,
                    "cape": cape,
                    "cin": cin,
                    "total_column_water_vapour": iwv,
                    "antecedent_rainfall_72h": rain * 24.0
                },
                "_temporal_history": temp_history
            }

            # Build strictly normalized input tensor [1, 4, 12, 32, 32]
            tensor = adapter.build_inference_tensor(live_weather_payload)

            # Unified Predictor Forward Pass with Physics & Baseline Calibration
            pred_res = predictor.predict(tensor, location_id=canonical_id, live_weather=live_weather_payload)
            predictions = pred_res.get("predictions", {})
            raw_outputs = pred_res.get("raw_neural_scores", pred_res.get("raw_outputs", {}))

            model_prov["inference_executed"] = True
            model_prov["inference_timestamp"] = timestamp_ist_str

            raw_ts = float(raw_outputs.get("thunderstorm", 0.0))
            raw_cb = float(raw_outputs.get("cloudburst", 0.0))
            raw_ff = float(raw_outputs.get("flash_flood", 0.0))

            ts_prob = float(predictions.get("thunderstorm", 0.10))
            cb_prob = float(predictions.get("cloudburst", 0.05))
            ff_prob = float(predictions.get("flash_flood", 0.05))

            def _get_level(prob: float) -> str:
                if prob >= 0.80: return "EXTREME"
                if prob >= 0.60: return "HIGH"
                if prob >= 0.35: return "MODERATE"
                return "SAFE"

            ts_lvl = _get_level(ts_prob)
            cb_lvl = _get_level(cb_prob)
            ff_lvl = _get_level(ff_prob)

            vayunet_payload["status"] = "INFERENCE_SUCCESS"
            vayunet_payload["hazards"]["thunderstorm"] = {
                "raw_output": round(raw_ts, 4),
                "score": round(ts_prob, 3),
                "probability": round(ts_prob, 3),
                "level": ts_lvl,
                "risk_level": ts_lvl
            }
            vayunet_payload["hazards"]["cloudburst"] = {
                "raw_output": round(raw_cb, 4),
                "score": round(cb_prob, 3),
                "probability": round(cb_prob, 3),
                "level": cb_lvl,
                "risk_level": cb_lvl
            }
            vayunet_payload["hazards"]["flash_flood"] = {
                "raw_output": round(raw_ff, 4),
                "score": round(ff_prob, 3),
                "probability": round(ff_prob, 3),
                "level": ff_lvl,
                "risk_level": ff_lvl
            }

            # Dynamic primary hazard logic
            hazard_map = {
                "thunderstorm": (ts_prob, ts_lvl),
                "cloudburst": (cb_prob, cb_lvl),
                "flash_flood": (ff_prob, ff_lvl)
            }
            elevated = {h: p for h, (p, lvl) in hazard_map.items() if lvl != "SAFE"}
            if elevated:
                primary_hazard = max(elevated, key=elevated.get)
                primary_level = hazard_map[primary_hazard][1]
            else:
                primary_hazard = None
                primary_level = "SAFE"

            xai_contributions = pred_res.get("xai", {}).get("contributions", {})
            if xai_contributions:
                vayunet_payload["xai_attribution"] = {
                    "Cloud-Top Temperature Drop": xai_contributions.get("ctt_drop_rate", 0) / 100.0,
                    "Terrain / Orography": xai_contributions.get("dem_slope_funneling", 0) / 100.0,
                    "CAPE (Convective Instability)": xai_contributions.get("cape_instability", 0) / 100.0,
                    "Moisture (Integrated Water Vapor)": xai_contributions.get("iwv_moisture_flux", 0) / 100.0
                }
            else:
                vayunet_payload["xai_attribution"] = {}
                
            vayunet_payload["scientific_verdict"] = pred_res.get("scientific_verdict", "")

            # Mandatory logging
            logging.info(
                "[MODEL OUTPUT]\nregion=%s\nthunderstorm_raw=%.4f\ncloudburst_raw=%.4f\nflash_flood_raw=%.4f",
                canonical_name, raw_ts, raw_cb, raw_ff
            )
            logging.info(
                "[MODEL SCORE]\nthunderstorm=%.3f\ncloudburst=%.3f\nflash_flood=%.3f",
                ts_prob, cb_prob, ff_prob
            )
            logging.info(
                "[MODEL LEVEL]\nthunderstorm=%s\ncloudburst=%s\nflash_flood=%s",
                ts_lvl, cb_lvl, ff_lvl
            )

        except Exception as e:
            logging.error(f"[VAYUNET INFERENCE ERROR for {canonical_name}]: {e}", exc_info=True)
            vayunet_payload["status"] = "INFERENCE_UNAVAILABLE"
            for h in vayunet_payload["hazards"]:
                vayunet_payload["hazards"][h]["level"] = "INFERENCE_UNAVAILABLE"
                vayunet_payload["hazards"][h]["risk_level"] = "INFERENCE_UNAVAILABLE"

    observation_timestamp = aws_data.get("observed_at") or om_data.get("timestamps", {}).get("provider_time") or timestamp_ist_str

    # Only set horizon if an active hazard is elevated
    horizon_hours = [1, 3, 6] if primary_level != "SAFE" else []

    payload = {
        "region": canonical_name,
        "canonical_id": canonical_id,
        "location": {
            "id": canonical_id,
            "display_name": canonical_name,
            "name": canonical_name,
            "latitude": lat,
            "longitude": lng,
            "lat": lat,
            "lng": lng,
            "timezone": "Asia/Kolkata"
        },
        "coordinates": {"lat": lat, "lng": lng},
        "observation_timestamp": observation_timestamp,
        "fetched_at": timestamp_ist_str,
        "inference_timestamp": model_prov["inference_timestamp"] or timestamp_ist_str,
        "timestamp": timestamp_ist_str,
        "timestamp_utc": timestamp_utc_str,
        "data_timestamp": observation_timestamp,
        "timezone": "Asia/Kolkata",
        "primary_hazard": primary_hazard,
        "primary_level": primary_level,
        "forecast_horizon_hours": horizon_hours,
        "observations": {
            "aws": aws_data,
            "radar": radar_data
        },
        "official_information": {
            "imd_warnings": warnings_data,
            "imd_nowcast": nowcast_data
        },
        "vayunet": vayunet_payload,
        "model": model_prov,
        "data_quality": {
            "overall": "GOOD" if weather_status in ["LIVE", "LIVE_FALLBACK"] else "DEGRADED"
        }
    }

    # Store in memory cache
    _RISK_CACHE[cache_key] = {"data": payload, "cached_at": now_time}

    return payload

