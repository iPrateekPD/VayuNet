"""
Locations Route
Serves metadata for the seven fixed operational locations.
"""

from fastapi import APIRouter, HTTPException
from src.config.locations import list_locations, get_location

router = APIRouter(tags=["Locations"])


@router.get("/api/locations")
def get_all_locations():
    """
    Returns the list of the seven supported operational locations.
    """
    locs = list_locations()
    return {
        "status": "success",
        "operational_locations": len(locs),
        "locations": locs
    }


@router.get("/api/locations/{location_id}")
def get_single_location(location_id: str):
    """
    Returns details for a specific operational location by ID.
    """
    loc = get_location(location_id)
    if not loc:
        raise HTTPException(
            status_code=404,
            detail=f"Location '{location_id}' not found. Supported: {[l['id'] for l in list_locations()]}"
        )
    return {
        "status": "success",
        "location": loc
    }


# Backward compatibility route for legacy frontend calls
@router.get("/api/hazards/locations", include_in_schema=False)
def get_hazards_locations_legacy():
    return {"locations": list_locations()}
