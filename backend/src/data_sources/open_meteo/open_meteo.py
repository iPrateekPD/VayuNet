import httpx
import logging
from datetime import datetime, timezone
from typing import Optional
from src.schemas.unified_schemas import UnifiedObservation

class OpenMeteoService:
    def __init__(self):
        self.base_url = "https://api.open-meteo.com/v1/forecast"

    async def get_weather(self, lat: float, lon: float, region: Optional[str] = None) -> UnifiedObservation:
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": "temperature_2m,relative_humidity_2m,pressure_msl,precipitation,rain,wind_speed_10m,wind_direction_10m,weather_code"
        }
        now = datetime.now(timezone.utc).isoformat()
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(self.base_url, params=params)
                response.raise_for_status()
                data = response.json()
                current = data.get("current", {})
                
                # Open-Meteo returns wind_speed_10m in km/h; convert to m/s for schema
                wind_kmh = current.get("wind_speed_10m") or 0.0
                wind_ms = round(wind_kmh / 3.6, 1)
                
                # Prefer 'rain' (liquid only) over 'precipitation' (includes snow/ice)
                rain_mm = current.get("rain") if current.get("rain") is not None else current.get("precipitation")
                
                return UnifiedObservation(
                    source="OPEN_METEO",
                    source_label="Open-Meteo",
                    source_type="observation",
                    is_live=True,
                    region=region,
                    latitude=lat,
                    longitude=lon,
                    observed_at=current.get("time", now),
                    temperature_c=current.get("temperature_2m"),
                    humidity_pct=current.get("relative_humidity_2m"),
                    pressure_hpa=current.get("pressure_msl"),
                    rainfall_mm=rain_mm,
                    wind_speed_ms=wind_ms,
                    wind_direction_deg=current.get("wind_direction_10m"),
                    weather_code=current.get("weather_code"),
                    condition=None,
                    quality="GOOD",
                    status="LIVE"
                )
        except Exception as e:
            logging.error(f"OpenMeteoService Error: {e}")
            return UnifiedObservation(
                source="OPEN_METEO",
                source_type="observation",
                region=region,
                latitude=lat,
                longitude=lon,
                observed_at=now,
                quality="UNKNOWN",
                status="DATA_UNAVAILABLE"
            )
