import os
import httpx
import logging
from datetime import datetime, timezone
from src.schemas.unified_schemas import BasinForecast

class IMDBasinQPFService:
    def __init__(self):
        self.api_key = os.getenv("IMD_API_KEY", "")
        self.base_url = "https://api.imd.gov.in/public/api"

    async def get_forecast(self, basin: str) -> BasinForecast:
        url = f"{self.base_url}/basin_qpf"
        headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
        params = {"basin": basin}
        now = datetime.now(timezone.utc).isoformat()
        
        if not self.api_key:
            return BasinForecast(
                basin=basin,
                source="IMD",
                issued_at=now,
                forecast=[]
            )

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, headers=headers, params=params)
                response.raise_for_status()
                data = response.json()
                return BasinForecast(
                    basin=basin,
                    sub_basin=data.get("sub_basin"),
                    forecast=data.get("forecast", []),
                    source="IMD",
                    issued_at=data.get("issued_at", now)
                )
        except Exception as e:
            logging.error(f"IMDBasinQPFService Error: {e}")
            return BasinForecast(
                basin=basin,
                source="IMD",
                issued_at=now,
                forecast=[]
            )
