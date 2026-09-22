import os
import httpx
import logging
from datetime import datetime, timezone
from src.schemas.unified_schemas import RainfallObservation

class IMDRainfallService:
    def __init__(self):
        self.api_key = os.getenv("IMD_API_KEY", "")
        self.base_url = "https://api.imd.gov.in/public/api"

    async def get_rainfall(self, district: str) -> RainfallObservation:
        url = f"{self.base_url}/rainfall/district"
        headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
        params = {"district": district}
        now = datetime.now(timezone.utc).isoformat()
        
        if not self.api_key:
            return RainfallObservation(
                district=district,
                observed_at=now,
                source="IMD",
                status="DATA_UNAVAILABLE"
            )

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, headers=headers, params=params)
                response.raise_for_status()
                data = response.json()
                return RainfallObservation(
                    district=district,
                    state=data.get("state"),
                    rainfall_mm=data.get("rainfall_mm"),
                    normal_mm=data.get("normal_mm"),
                    departure_pct=data.get("departure_pct"),
                    observed_at=data.get("timestamp", now),
                    source="IMD",
                    status="LIVE"
                )
        except Exception as e:
            logging.error(f"IMDRainfallService Error: {e}")
            return RainfallObservation(
                district=district,
                observed_at=now,
                source="IMD",
                status="DATA_UNAVAILABLE"
            )
