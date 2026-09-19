"""
Weather Route
Fetches model-derived current weather from Open-Meteo with 5-minute caching keyed by location_id.
"""

from fastapi import APIRouter, HTTPException, Query
from src.weather.open_meteo import get_weather_for_location, _fetch_from_api
from src.config.locations import get_location, find_closest_location

router = APIRouter(tags=["Weather"])


@router.get("/api/locations/{location_id}/weather")
async def get_location_weather(location_id: str):
    """
    Retrieves real-time model-derived meteorological data for a designated location.
    Caches responses for 5 minutes per location.
    """
    loc = get_location(location_id)
    if not loc:
        raise HTTPException(
            status_code=404,
            detail=f"Location '{location_id}' not found."
        )

    try:
        data = await get_weather_for_location(location_id)
        # Strip internal keys from public output
        return {k: v for k, v in data.items() if not k.startswith("_")}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Weather service failure: {e}")


@router.get("/api/weather/realtime")
async def get_realtime_weather_by_coords(
    lat: float = Query(..., description="Latitude in decimal degrees"),
    lng: float = Query(..., description="Longitude in decimal degrees")
):
    """
    Coordinates-based weather lookup (backward-compatible).
    Maps to closest known operational location if within 0.5 degrees.
    """
    if lat < -90.0 or lat > 90.0:
        raise HTTPException(status_code=400, detail=f"Latitude {lat} is out of valid range [-90.0, 90.0].")
    if lng < -180.0 or lng > 180.0:
        raise HTTPException(status_code=400, detail=f"Longitude {lng} is out of valid range [-180.0, 180.0].")

    closest = find_closest_location(lat, lng, threshold_deg=0.5)
    if closest:
        return await get_location_weather(closest["id"])

    # Fallback to direct coordinates fetch
    try:
        data = await _fetch_from_api(lat, lng, location_meta={"id": "custom", "name": f"Coord ({lat:.2f}, {lng:.2f})", "state": "India", "lat": lat, "lng": lng})
        return {k: v for k, v in data.items() if not k.startswith("_")}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to retrieve weather for coordinates: {e}")
