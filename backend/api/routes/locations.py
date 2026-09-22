"""
Locations Route
Serves metadata for the seven fixed operational locations.
"""

from fastapi import APIRouter, HTTPException
from src.config.locations import list_locations, get_location
from src.inference.safe_router import evaluate_safest_shelter

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


@router.get("/api/locations/{location_id}/safe-shelter")
async def get_safe_shelter(location_id: str, lat: float, lng: float):
    """
    Evaluates real-time weather conditions for multiple nearby shelters
    and returns the safest one for the user to evacuate to.
    """
    # Note: Using location_id helps us fetch predefined static shelters
    # lat and lng are the user's current coordinates to calculate distance
    try:
        result = await evaluate_safest_shelter(location_id, lat, lng)
        return {
            "status": "success",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to evaluate safe shelters: {e}")
