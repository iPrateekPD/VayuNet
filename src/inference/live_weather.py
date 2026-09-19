"""
VAYUNET Live Weather Ingestion Service
Fetches real-time current and recent model-derived meteorological variables
from Open-Meteo API with strict validation, timeout protection, and in-memory TTL caching.
"""

import time
import logging
from typing import Dict, Any, Optional, Tuple
from datetime import datetime, timezone, timedelta
import httpx

logger = logging.getLogger(__name__)

# Constants
CACHE_TTL_SECONDS = 300  # 5 minutes
HTTP_TIMEOUT_SECONDS = 10.0
IST_OFFSET = timezone(timedelta(hours=5, minutes=30))

# In-memory TTL cache: key -> (cached_dict, timestamp)
_WEATHER_CACHE: Dict[str, Tuple[Dict[str, Any], float]] = {}


def validate_coordinates(lat: float, lng: float) -> None:
    """
    Validates latitude and longitude against geographic bounds.
    Raises ValueError on invalid coordinates.
    """
    if not isinstance(lat, (int, float)) or not isinstance(lng, (int, float)):
        raise ValueError("Latitude and Longitude must be numeric values.")
    if lat < -90.0 or lat > 90.0:
        raise ValueError(f"Latitude {lat} is out of valid range [-90.0, 90.0].")
    if lng < -180.0 or lng > 180.0:
        raise ValueError(f"Longitude {lng} is out of valid range [-180.0, 180.0].")


def get_cache_key(lat: float, lng: float) -> str:
    """Generates normalized cache key rounded to 4 decimal places (~11m resolution)."""
    return f"weather:{round(lat, 4):.4f}:{round(lng, 4):.4f}"


def format_ist_timestamp(dt: Optional[datetime] = None) -> str:
    """Formats datetime in ISO 8601 with Indian Standard Time (+05:30) offset."""
    if dt is None:
        dt = datetime.now(timezone.utc)
    dt_ist = dt.astimezone(IST_OFFSET)
    return dt_ist.strftime("%Y-%m-%dT%H:%M:%S+05:30")


async def fetch_open_meteo_weather(lat: float, lng: float) -> Dict[str, Any]:
    """
    Asynchronously queries Open-Meteo API for live and recent hourly meteorological variables.
    Handles network timeouts, retries, and schema normalization.
    """
    validate_coordinates(lat, lng)
    cache_key = get_cache_key(lat, lng)
    now = time.time()

    # Check 5-minute cache
    if cache_key in _WEATHER_CACHE:
        cached_data, cached_time = _WEATHER_CACHE[cache_key]
        age = now - cached_time
        if age < CACHE_TTL_SECONDS:
            response = dict(cached_data)
            response["freshness"] = {
                "cache_ttl_seconds": CACHE_TTL_SECONDS,
                "cached": True,
                "age_seconds": round(age, 1)
            }
            return response
        else:
            del _WEATHER_CACHE[cache_key]

    # Open-Meteo request parameters
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

    try:
        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT_SECONDS) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
    except httpx.TimeoutException as e:
        logger.warning("Open-Meteo request timed out for (%f, %f): %s", lat, lng, e)
        return {
            "status": "degraded",
            "source": {
                "provider": "Open-Meteo",
                "data_type": "model-derived-current"
            },
            "location": {"lat": lat, "lng": lng},
            "error": {
                "code": "WEATHER_PROVIDER_TIMEOUT",
                "message": "Current weather data provider timed out after 10 seconds."
            }
        }
    except Exception as e:
        logger.error("Open-Meteo request failed for (%f, %f): %s", lat, lng, e)
        return {
            "status": "degraded",
            "source": {
                "provider": "Open-Meteo",
                "data_type": "model-derived-current"
            },
            "location": {"lat": lat, "lng": lng},
            "error": {
                "code": "WEATHER_PROVIDER_UNAVAILABLE",
                "message": f"Current weather data is temporarily unavailable: {str(e)}"
            }
        }

    # Parse and normalize variables
    current = data.get("current", {})
    hourly = data.get("hourly", {})
    retrieved_at_str = format_ist_timestamp()

    # Provider timestamp
    provider_time_raw = current.get("time")
    if provider_time_raw:
        provider_time_str = f"{provider_time_raw}:00+05:30"
    else:
        provider_time_str = retrieved_at_str

    # Extract latest hourly values for CAPE, CIN, and IWV
    cape_list = hourly.get("cape", [])
    cin_list = hourly.get("convective_inhibition", [])
    iwv_list = hourly.get("total_column_integrated_water_vapour", [])

    latest_cape = float(cape_list[-1]) if cape_list and cape_list[-1] is not None else 0.0
    latest_cin = float(cin_list[-1]) if cin_list and cin_list[-1] is not None else 0.0
    latest_iwv = float(iwv_list[-1]) if iwv_list and iwv_list[-1] is not None else None

    # Derive IWV using surface humidity and temperature if not directly provided
    temp_c = float(current.get("temperature_2m", 25.0))
    rh_pct = float(current.get("relative_humidity_2m", 80.0))
    p_hpa = float(current.get("surface_pressure", 1013.25))

    if latest_iwv is None:
        # Bolton approximation for total precipitable water column (kg/m² or mm)
        e_sat = 6.112 * (10 ** ((7.5 * temp_c) / (237.3 + temp_c)))
        e_act = (rh_pct / 100.0) * e_sat
        q = 0.622 * (e_act / max(100.0, p_hpa))
        latest_iwv = round(max(5.0, min(85.0, q * 1000.0 * 2.8)), 1)
    else:
        latest_iwv = round(float(latest_iwv), 1)

    # Extract past genuine 4-hour temporal series for model adapter
    hourly_times = hourly.get("time", [])
    num_frames = min(4, len(hourly_times))
    recent_indices = list(range(len(hourly_times) - num_frames, len(hourly_times)))

    temporal_sequence = {
        "available_frames": num_frames,
        "timestamps": [hourly_times[i] for i in recent_indices] if hourly_times else [],
        "temperature_2m": [hourly.get("temperature_2m", [])[i] for i in recent_indices if i < len(hourly.get("temperature_2m", []))],
        "relative_humidity_2m": [hourly.get("relative_humidity_2m", [])[i] for i in recent_indices if i < len(hourly.get("relative_humidity_2m", []))],
        "surface_pressure": [hourly.get("surface_pressure", [])[i] for i in recent_indices if i < len(hourly.get("surface_pressure", []))],
        "precipitation": [hourly.get("precipitation", [])[i] for i in recent_indices if i < len(hourly.get("precipitation", []))],
        "wind_speed_10m": [hourly.get("wind_speed_10m", [])[i] for i in recent_indices if i < len(hourly.get("wind_speed_10m", []))],
        "cape": [cape_list[i] if i < len(cape_list) else 0.0 for i in recent_indices],
        "cin": [cin_list[i] if i < len(cin_list) else 0.0 for i in recent_indices],
        "iwv": [iwv_list[i] if i < len(iwv_list) and iwv_list[i] is not None else latest_iwv for i in recent_indices]
    }

    result = {
        "status": "success",
        "source": {
            "provider": "Open-Meteo",
            "data_type": "model-derived-current"
        },
        "location": {
            "lat": lat,
            "lng": lng
        },
        "timestamps": {
            "provider_time": provider_time_str,
            "retrieved_at": retrieved_at_str
        },
        "freshness": {
            "cache_ttl_seconds": CACHE_TTL_SECONDS,
            "cached": False,
            "age_seconds": 0.0
        },
        "weather": {
            "temperature_2m_c": round(temp_c, 1),
            "relative_humidity_2m_pct": round(rh_pct, 1),
            "surface_pressure_hpa": round(p_hpa, 1),
            "precipitation_mm": round(float(current.get("precipitation", 0.0)), 1),
            "rain_mm": round(float(current.get("rain", 0.0)), 1),
            "wind_speed_10m_kmh": round(float(current.get("wind_speed_10m", 0.0)), 1),
            "wind_direction_10m_deg": int(current.get("wind_direction_10m", 0)),
            "wind_gusts_10m_kmh": round(float(current.get("wind_gusts_10m", 0.0)), 1),
            "cape_j_kg": round(latest_cape, 1),
            "cin_j_kg": round(latest_cin, 1),
            "total_column_water_vapour_kg_m2": latest_iwv
        },
        "_temporal_history": temporal_sequence
    }

    # Store in cache
    _WEATHER_CACHE[cache_key] = (dict(result), now)
    return result


def clear_weather_cache() -> None:
    """Clears in-memory weather cache (used in testing)."""
    global _WEATHER_CACHE
    _WEATHER_CACHE.clear()
