"""
System Status Route
Exposes operational health and loaded ML model diagnostics.
"""

import time
from fastapi import APIRouter
from src.inference.model_loader import get_model_manager
from src.config.locations import list_locations

router = APIRouter(prefix="/api/system", tags=["System"])


@router.get("/status")
def get_system_status():
    """
    Returns system status, active model version, compute device, and operational locations count.
    """
    mgr = get_model_manager()
    status_dict = mgr.get_status()
    locations = list_locations()

    return {
        "status": "online",
        "system": "VAYUNET Operational Core",
        "mode": "Phase 2: Deep Learning Spatiotemporal Transformer",
        "phase": 2,
        "ai_engine": {
            "loaded": status_dict["loaded"],
            "trained_checkpoint": status_dict["trained_checkpoint"],
            "model_version": status_dict["model_version"],
            "device": status_dict["device"]
        },
        "operational_locations": len(locations),
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }


@router.get("/health", include_in_schema=False)
def get_system_health():
    """Legacy health alias."""
    return get_system_status()
