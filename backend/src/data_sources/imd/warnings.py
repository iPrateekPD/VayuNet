import os
import httpx
import logging
from datetime import datetime, timezone
from typing import List
from src.schemas.unified_schemas import UnifiedAlert

class IMDWarningService:
    def __init__(self):
        self.api_key = os.getenv("IMD_API_KEY", "")
        self.base_url = "https://api.imd.gov.in/public/api"

    async def get_warnings(self, district: str) -> List[UnifiedAlert]:
        url = f"{self.base_url}/warnings/district"
        headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
        params = {"district": district}
        now = datetime.now(timezone.utc).isoformat()
        
        if not self.api_key:
            return []

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, headers=headers, params=params)
                response.raise_for_status()
                data = response.json()
                
                alerts = []
                for item in data.get("warnings", []):
                    alerts.append(UnifiedAlert(
                        alert_id=f"IMD-WARN-{district}-{now}",
                        hazard=item.get("hazard", "UNKNOWN"),
                        severity=item.get("severity", "LOW"),
                        district=district,
                        issued_at=data.get("issued_at", now),
                        valid_until=item.get("valid_until"),
                        source="IMD",
                        source_type="official_warning",
                        official_warning=item.get("hazard", "UNKNOWN")
                    ))
                return alerts
        except Exception as e:
            logging.error(f"IMDWarningService Error: {e}")
            return []
