import os
import httpx
import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from src.schemas.unified_schemas import UnifiedObservation

class IMDCurrentWeatherService:
    def __init__(self):
        self.api_key = os.getenv("IMD_API_KEY", "")
        self.base_url = "https://api.imd.gov.in/public/api"

    async def get_weather(self, region: str) -> UnifiedObservation:
        url = f"{self.base_url}/current_weather"
        headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
        params = {"region": region}
        now = datetime.now(timezone.utc).isoformat()
        
        if not self.api_key:
            return UnifiedObservation(
                source="IMD_CURRENT_WEATHER",
                source_type="observation",
                region=region,
                observed_at=now,
                quality="UNKNOWN",
                status="DATA_UNAVAILABLE"
            )

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, headers=headers, params=params)
                response.raise_for_status()
                data = response.json()
                return UnifiedObservation(
                    source="IMD_CURRENT_WEATHER",
                    source_type="observation",
                    region=region,
                    observed_at=data.get("timestamp", now),
                    temperature_c=data.get("temperature"),
                    status="LIVE"
                )
        except Exception as e:
            logging.error(f"IMDCurrentWeatherService Error: {e}")
            return UnifiedObservation(
                source="IMD_CURRENT_WEATHER",
                source_type="observation",
                region=region,
                observed_at=now,
                quality="UNKNOWN",
                status="DATA_UNAVAILABLE"
            )
