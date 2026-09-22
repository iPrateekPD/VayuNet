import os
import httpx
import logging
from datetime import datetime, timezone
from typing import Dict, Any

class IMDRadarService:
    def __init__(self):
        self.api_key = os.getenv("IMD_API_KEY", "")
        self.base_url = "https://api.imd.gov.in/public/api"

    async def get_radar(self, region: str) -> Dict[str, Any]:
        url = f"{self.base_url}/radar"
        headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
        params = {"region": region}
        now = datetime.now(timezone.utc).isoformat()
        
        if not self.api_key:
            return {
                "source": "IMD_RADAR",
                "status": "DATA_UNAVAILABLE",
                "radar_station": "UNKNOWN",
                "timestamp": now
            }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, headers=headers, params=params)
                response.raise_for_status()
                data = response.json()
                return {
                    "source": "IMD_RADAR",
                    "status": "LIVE",
                    "radar_station": data.get("radar_station", "UNKNOWN"),
                    "image": data.get("image", ""),
                    "timestamp": data.get("timestamp", now),
                    "age_minutes": data.get("age_minutes", 0)
                }
        except Exception as e:
            logging.error(f"IMDRadarService Error: {e}")
            return {
                "source": "IMD_RADAR",
                "status": "DATA_UNAVAILABLE",
                "radar_station": "UNKNOWN",
                "timestamp": now
            }
