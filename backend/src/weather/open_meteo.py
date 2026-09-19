"""
VAYUNET Open-Meteo Meteorological Service
Fetches model-derived current weather and past temporal soundings with unit normalization and TTL caching.
"""

import time
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone, timedelta
import httpx

from src.weather.cache import weather_cache
from src.config.locations import get_location

logger = logging.getLogger(__name__)

CACHE_TTL_SECONDS = 300  # 5 minutes
HTTP_TIMEOUT_SECONDS = 10.0
IST_OFFSET = timezone(timedelta(hours=5, minutes=30))


def format_ist_timestamp(dt: Optional[datetime] = None) -> str:
    """Formats datetime in ISO 8601 with Indian Standard Time (+05:30) offset."""
    if dt is None:
        dt = datetime.now(timezone.utc)
    dt_ist = dt.astimezone(IST_OFFSET)
    return dt_ist.strftime("%Y-%m-%dT%H:%M:%S+05:30")


async def get_weather_for_location(location_id: str) -> Dict[str, Any]:
    """
    Retrieves model-derived current weather for a configured location ID.
    Uses 5-minute in-memory caching keyed by location_id.
    """
    loc_meta = get_location(location_id)
    if not loc_meta:
        raise ValueError(f"Unknown operational location ID: '{location_id}'")

    cache_key = f"loc:{loc_meta['id']}"
    cached_entry = weather_cache.get(cache_key)

    if cached_entry:
        cached_data, age_seconds = cached_entry
        response = dict(cached_data)
        response["freshness"] = {
            "cached": True,
            "age_seconds": age_seconds,
            "ttl_seconds": CACHE_TTL_SECONDS
        }
        return response

    # Fetch from Open-Meteo
    weather_data = await _fetch_from_api(
        lat=loc_meta["lat"],
        lng=loc_meta["lng"],
        location_meta=loc_meta
    )

    # Cache response
    weather_cache.set(cache_key, weather_data, ttl_seconds=CACHE_TTL_SECONDS)

    weather_data["freshness"] = {
        "cached": False,
        "age_seconds": 0,
        "ttl_seconds": CACHE_TTL_SECONDS
    }
    return weather_data


async def _fetch_from_api(lat: float, lng: float, location_meta: Dict[str, Any]) -> Dict[str, Any]:
    """Internal fetcher to Open-Meteo with schema normalization and error handling."""
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": round(lat, 4),
        "longitude": round(lng, 4),
        "current": (
            "temperature_2m,relative_humidity_2m,surface_pressure,"
            "precipitation,rain,wind_speed_10m,wind_direction_10m,wind_gusts_10m"
        ),
        "hourly": (
            "temperature_2m,relative_humidity_2m,surface_pressure,"
            "precipitation,wind_speed_10m,wind_direction_10m,cape,"
            "convective_inhibition,total_column_integrated_water_vapour"
        ),
        "past_hours": 6,
        "forecast_hours": 1,
        "timezone": "Asia/Kolkata"
    }

    start_fetch = time.perf_counter()

    try:
        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT_SECONDS) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
    except httpx.TimeoutException:
        logger.error("[WEATHER] Open-Meteo timeout for location=%s", location_meta.get("id"))
        raise RuntimeError(f"Open-Meteo request timed out ({HTTP_TIMEOUT_SECONDS}s) for {location_meta.get('name')}.")
    except httpx.HTTPStatusError as e:
        logger.error("[WEATHER] Open-Meteo HTTP error %s for location=%s", e.response.status_code, location_meta.get("id"))
        raise RuntimeError(f"Open-Meteo returned status {e.response.status_code}: {e.response.text}")
    except Exception as e:
        logger.error("[WEATHER] Network error querying Open-Meteo: %s", e)
        raise RuntimeError(f"Failed to retrieve real-time weather from Open-Meteo: {e}")

    fetch_ms = round((time.perf_counter() - start_fetch) * 1000, 1)
    logger.info("[WEATHER] location=%s source=open-meteo cached=false latency=%sms", location_meta.get("id"), fetch_ms)

    curr = data.get("current", {})
    hourly = data.get("hourly", {})

    # Extract latest hourly soundings
    cape_list = hourly.get("cape", [])
    cin_list = hourly.get("convective_inhibition", [])
    iwv_list = hourly.get("total_column_integrated_water_vapour", [])

    cape_val = float(cape_list[-1]) if cape_list and cape_list[-1] is not None else 0.0
    cin_val = float(cin_list[-1]) if cin_list and cin_list[-1] is not None else 0.0
    iwv_val = float(iwv_list[-1]) if iwv_list and iwv_list[-1] is not None else None

    # Bolton physical formulation fallback for column water vapour if missing from API
    temp_c = curr.get("temperature_2m", 25.0)
    rh_pct = curr.get("relative_humidity_2m", 70.0)
    if iwv_val is None:
        e_sat_hpa = 6.112 * (2.71828 ** ((17.67 * temp_c) / (temp_c + 243.5)))
        e_act_hpa = e_sat_hpa * (rh_pct / 100.0)
        # Bolton empirical formulation for precipitable water
        iwv_val = round(max(5.0, min(85.0, (e_act_hpa * 1.85) + 8.5)), 1)
    else:
        iwv_val = round(float(iwv_val), 1)

    normalized_weather = {
        "temperature_2m_c": round(float(temp_c), 1) if temp_c is not None else None,
        "relative_humidity_pct": int(round(float(rh_pct))) if rh_pct is not None else None,
        "surface_pressure_hpa": round(float(curr.get("surface_pressure", 1013.25)), 1),
        "precipitation_mm": round(float(curr.get("precipitation", 0.0)), 2),
        "rain_mm": round(float(curr.get("rain", 0.0)), 2),
        "wind_speed_kmh": round(float(curr.get("wind_speed_10m", 0.0)), 1),
        "wind_direction_deg": int(round(float(curr.get("wind_direction_10m", 0)))),
        "wind_gusts_kmh": round(float(curr.get("wind_gusts_10m", 0.0)), 1),
        "cape_j_kg": int(round(cape_val)),
        "cin_j_kg": int(round(cin_val)),
        "iwv_kg_m2": iwv_val,
        # Backward compatibility alias
        "total_column_water_vapour_kg_m2": iwv_val,
    }

    # Extract temporal sequences for genuine feature adapter reconstruction
    available_frames = min(
        len(hourly.get("temperature_2m", [])),
        len(hourly.get("relative_humidity_2m", [])),
        len(hourly.get("surface_pressure", []))
    )

    temporal_history = {
        "available_frames": available_frames,
        "temperature_2m": hourly.get("temperature_2m", []),
        "relative_humidity_2m": hourly.get("relative_humidity_2m", []),
        "surface_pressure": hourly.get("surface_pressure", []),
        "cape": hourly.get("cape", []),
        "cin": hourly.get("convective_inhibition", []),
        "iwv": hourly.get("total_column_integrated_water_vapour", []),
        "wind_speed_10m": hourly.get("wind_speed_10m", []),
    }

    now_ist = format_ist_timestamp()
    provider_time = curr.get("time", now_ist)

    return {
        "status": "success",
        "data_mode": "LIVE",
        "location": {
            "id": location_meta["id"],
            "name": location_meta["name"],
            "state": location_meta["state"],
            "lat": location_meta["lat"],
            "lng": location_meta["lng"]
        },
        "source": {
            "provider": "Open-Meteo",
            "data_type": "model-derived-current"
        },
        "weather": normalized_weather,
        "timestamps": {
            "provider_time": provider_time,
            "retrieved_at": now_ist
        },
        "_temporal_history": temporal_history
    }
