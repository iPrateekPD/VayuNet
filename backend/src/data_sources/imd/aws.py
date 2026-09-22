import os
import httpx
import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from src.schemas.unified_schemas import UnifiedObservation

class IMDAWSService:
    def __init__(self):
        self.api_key = os.getenv("IMD_API_KEY", "")
        self._has_logged_missing_key = False
        self.base_url = "https://api.imd.gov.in/public/api"
        # Optional mapping of region -> station ID
        self.station_mapping = {
            "Wayanad": "STA_WAYANAD_01",
            "Dharamsala": "STA_DHARAM_02",
            "Uttarkashi": "STA_UTTAR_03",
            "Mumbai": "STA_MUMBAI_04"
        }

    async def get_observation(self, region: str, lat: Optional[float] = None, lon: Optional[float] = None) -> UnifiedObservation:
        """Fetch AWS observation for a specific region or lat/lon."""
        # Using station mapping if available, otherwise would use lat/lon
        station_id = self.station_mapping.get(region, "UNKNOWN_STATION")
        
        url = f"{self.base_url}/aws/current"
        headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
        params = {"station_id": station_id}
        
        now = datetime.now(timezone.utc).isoformat()
        
        if not self.api_key:
            # BLOCKED: No API key provided, degrade gracefully according to instructions
            if not self._has_logged_missing_key:
                logging.info("[DATA SOURCE] IMD unavailable — using Open-Meteo fallback")
                self._has_logged_missing_key = True
            return UnifiedObservation(
                source="IMD_AWS",
                source_type="observation",
                region=region,
                station_id=station_id,
                observed_at=now,
                quality="UNKNOWN",
                status="DATA_UNAVAILABLE"
            )

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, headers=headers, params=params)
                response.raise_for_status()
                data = response.json()
                
                # Mocking parsing for demonstration; adapt based on real IMD schema
                return UnifiedObservation(
                    source="IMD_AWS",
                    source_type="observation",
                    region=region,
                    station_id=station_id,
                    observed_at=data.get("timestamp", now),
                    temperature_c=data.get("temperature"),
                    humidity_pct=data.get("humidity"),
                    pressure_hpa=data.get("pressure"),
                    wind_speed_ms=data.get("wind_speed"),
                    wind_direction_deg=data.get("wind_dir"),
                    rainfall_mm=data.get("rainfall"),
                    quality="GOOD",
                    status="LIVE",
                    age_minutes=0
                )
        except Exception as e:
            logging.error(f"IMDAWSService Error: {e}")
            return UnifiedObservation(
                source="IMD_AWS",
                source_type="observation",
                region=region,
                station_id=station_id,
                observed_at=now,
                quality="UNKNOWN",
                status="DATA_UNAVAILABLE"
            )
