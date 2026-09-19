"""
Events Route
Serves verified historical disaster events to prove model validity.
Marked explicitly with data_mode: HISTORICAL.
"""

from fastapi import APIRouter, HTTPException
from src.data.historical import list_historical_events, get_historical_event_by_id, get_events_for_location
from src.config.locations import get_location

router = APIRouter(tags=["Events"])


@router.get("/api/events")
def get_all_events():
    """Returns all verified historical benchmark disaster cases."""
    events = list_historical_events()
    return {
        "status": "success",
        "data_mode": "HISTORICAL",
        "count": len(events),
        "events": events
    }


@router.get("/api/locations/{location_id}/events")
def get_events_for_loc(location_id: str):
    """Returns historical benchmark events associated with a specific location."""
    loc = get_location(location_id)
    if not loc:
        raise HTTPException(status_code=404, detail=f"Location '{location_id}' not found.")

    events = get_events_for_location(location_id)
    return {
        "status": "success",
        "data_mode": "HISTORICAL",
        "location_id": location_id,
        "count": len(events),
        "events": events
    }


@router.get("/api/events/{event_id}")
@router.get("/api/hazards/historical/{event_id}", include_in_schema=False)
def get_historical_event_by_id_endpoint(event_id: str):
    """Retrieves detailed verified data for a specific historical disaster event."""
    evt = get_historical_event_by_id(event_id)
    if not evt:
        raise HTTPException(status_code=404, detail=f"Historical event '{event_id}' not found.")
    return {"status": "success", "data_mode": "HISTORICAL", "event": evt}
