from fastapi import APIRouter, HTTPException, Query
from src.data_sources.registry import registry
from datetime import datetime, timezone
import asyncio

router = APIRouter(tags=["Alerts"])

@router.get("/api/alerts/active")
async def get_active_alerts(region: str = Query(None, description="Filter by region (optional)")):
    """
    Returns active alerts for all operational regions, aggregating IMD warnings, nowcasts, and VAYUNET high-probability predictions.
    """
    now = datetime.now(timezone.utc).isoformat()
    active_alerts = []
    
    # We will fetch IMD warnings and nowcasts for the requested region (or all default regions if None)
    regions = [region] if region else ["Wayanad", "Dharamsala", "Uttarkashi", "Mumbai"]
    
    warn_srv = registry.get("imd_warnings")
    nowcast_srv = registry.get("imd_nowcast")
    
    tasks = []
    for r in regions:
        if warn_srv: tasks.append(warn_srv.get_warnings(district=r))
        if nowcast_srv: tasks.append(nowcast_srv.get_nowcast(district=r))
        
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    for res in results:
        if not isinstance(res, Exception):
            active_alerts.extend([a.dict() for a in res])
            
    # Mock VAYUNET alerts based on unified logic (to be replaced by actual ML thresholding later)
    # Vayunet would output things like:
    if "Wayanad" in regions:
        active_alerts.append({
            "alert_id": f"VAYUNET-ML-WAYANAD-{now}",
            "hazard": "FLASH_FLOOD",
            "severity": "HIGH",
            "region": "Wayanad",
            "district": "Wayanad",
            "issued_at": now,
            "source": "VAYUNET",
            "source_type": "MODEL_ASSESSMENT",
            "probability": 0.82,
            "model_version": "V4.0",
            "data_sources": ["IMD_AWS", "IMD_RADAR", "HIMAWARI"]
        })

    return {
        "status": "success",
        "timestamp": now,
        "count": len(active_alerts),
        "alerts": active_alerts
    }
