import os
import httpx
import logging
from datetime import datetime, timezone
from typing import Dict, Any

class IMDCycloneService:
    def __init__(self):
        self.api_key = os.getenv("IMD_API_KEY", "")
        self.base_url = "https://api.imd.gov.in/public/api"

    async def get_track(self) -> Dict[str, Any]:
        url = f"{self.base_url}/cyclone/track"
        headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
        now = datetime.now(timezone.utc).isoformat()
        
        if not self.api_key:
            return {
                "source": "IMD_CYCLONE",
                "status": "DATA_UNAVAILABLE"
            }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, headers=headers)
                response.raise_for_status()
                data = response.json()
                return {
                    "source": "IMD_CYCLONE",
                    "status": "LIVE",
                    "cyclone_id": data.get("cyclone_id"),
                    "name": data.get("name"),
                    "observed_track": data.get("observed_track", []),
                    "forecast_track": data.get("forecast_track", [])
                }
        except Exception as e:
            logging.error(f"IMDCycloneService Error: {e}")
            return {
                "source": "IMD_CYCLONE",
                "status": "DATA_UNAVAILABLE"
            }
