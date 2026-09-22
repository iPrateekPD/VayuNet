from fastapi import APIRouter, HTTPException, Query
from src.data_sources.registry import registry
from typing import Dict, Any, Optional
from src.schemas.unified_schemas import UnifiedObservation

def get_condition_from_code(code: Optional[int], rainfall_mm: Optional[float] = 0.0) -> str:
    if code is None:
        return "Unknown"
    rain = rainfall_mm or 0.0
    if code in (95, 96, 99):
        return "Severe Thunderstorm" if rain > 20 else "Thunderstorm"
    if 80 <= code <= 82:
        return "Heavy Showers" if rain > 15 else "Moderate Showers"
    if 60 <= code <= 65:
        if rain > 35: return "Extreme Deluge"
        if rain > 15: return "Very Heavy Rain"
        if rain > 5: return "Moderate Rain"
        return "Light rain"
    if 51 <= code <= 55: return "Drizzle"
    if 71 <= code <= 77: return "Snow"
    if code in (45, 48): return "Fog"
    if code == 3: return "Overcast"
    if code == 2: return "Partly cloudy"
    if code == 1: return "Mainly clear"
    if code == 0: return "Clear sky"
    return "Unknown"

router = APIRouter(tags=["Weather"])

from src.config.locations import get_location

@router.get("/api/weather/imd/current")
async def get_imd_current_weather(
    region: str = Query(..., description="Region name or ID to fetch weather for")
):
    """Fetch current observations prioritizing IMD AWS, falling back to IMD Current, then Open-Meteo."""
    aws_service = registry.get("imd_aws")
    curr_service = registry.get("imd_current_weather")
    om_service = registry.get("open_meteo")
    
    # Resolve coordinates and canonical name from central registry
    loc = get_location(region)
    if loc:
        lat, lon = loc["lat"], loc["lng"]
        canonical_name = loc["name"]
    else:
        # Fallback to Gunupur (canonical basin of VAYUNET) if unknown, never 20.5937, 78.9629!
        default_loc = get_location("gunupur") or {"name": "Gunupur", "lat": 19.0805, "lng": 83.8166}
        lat, lon = default_loc["lat"], default_loc["lng"]
        canonical_name = default_loc["name"]

    # 1. Try IMD AWS first
    if aws_service:
        try:
            obs = await aws_service.get_observation(region=canonical_name)
            if obs and obs.status == "LIVE":
                obs_dict = obs.dict()
                obs_dict["source_label"] = "IMD"
                obs_dict["source"] = "IMD"
                obs_dict["status"] = "LIVE"
                obs_dict["is_live"] = True
                return obs_dict
        except Exception:
            pass
            
    # 2. Fallback to IMD Current
    if curr_service:
        try:
            obs = await curr_service.get_weather(region=canonical_name)
            if obs and obs.status == "LIVE":
                obs_dict = obs.dict()
                obs_dict["source_label"] = "IMD"
                obs_dict["source"] = "IMD"
                obs_dict["status"] = "LIVE"
                obs_dict["is_live"] = True
                return obs_dict
        except Exception:
            pass
            
    # 3. Fallback to Open-Meteo using canonical coordinates
    if om_service:
        try:
            obs = await om_service.get_weather(lat=lat, lon=lon, region=canonical_name)
            if obs and obs.status != "DATA_UNAVAILABLE":
                obs_dict = obs.dict()
                obs_dict["condition"] = get_condition_from_code(obs.weather_code, obs.rainfall_mm)
                obs_dict["source_label"] = "Open-Meteo"
                obs_dict["source"] = "Open-Meteo"
                obs_dict["status"] = "LIVE_FALLBACK"
                obs_dict["is_live"] = True
                obs_dict["latitude"] = lat
                obs_dict["longitude"] = lon
                return obs_dict
        except Exception:
            pass
        
    # 4. If all sources fail, return DATA_UNAVAILABLE explicitly
    return {
        "source": None,
        "source_label": None,
        "status": "DATA_UNAVAILABLE",
        "is_live": False,
        "region": canonical_name,
        "latitude": lat,
        "longitude": lon,
        "temperature_c": None,
        "humidity_pct": None,
        "pressure_hpa": None,
        "rainfall_mm": None,
        "wind_speed_ms": None,
        "wind_direction_deg": None,
        "condition": "Data Unavailable",
        "error": "All weather data sources unavailable."
    }

@router.get("/api/debug/weather/{region}")
async def debug_weather(region: str):
    """Debug endpoint to verify frontend values match backend values exactly."""
    try:
        # Re-use the existing logic
        weather = await get_imd_current_weather(region)
        return {
            "status": "success",
            "provider": weather.get("source_label", weather.get("source", "Unknown")),
            "observation_time": weather.get("observed_at"),
            "temperature": weather.get("temperature_c"),
            "humidity": weather.get("humidity_pct"),
            "pressure": weather.get("pressure_hpa"),
            "rainfall": weather.get("rainfall_mm"),
            "wind_speed": weather.get("wind_speed_ms"),
            "wind_direction": weather.get("wind_direction_deg"),
            "weather_code": weather.get("weather_code"),
            "condition": weather.get("condition"),
            "is_live": weather.get("is_live", False)
        }
    except HTTPException:
        return {"status": "error", "message": "Weather temporarily unavailable"}

@router.get("/api/radar/imd")
async def get_imd_radar(
    region: str = Query(..., description="Region to fetch radar for")
):
    """Fetch official IMD radar image."""
    radar_service = registry.get("imd_radar")
    if not radar_service:
        raise HTTPException(status_code=500, detail="Radar service not configured.")
        
    data = await radar_service.get_radar(region=region)
    return data

@router.get("/api/lightning/imd")
async def get_imd_lightning(
    region: str = Query(..., description="Region to fetch lightning for")
):
    """Fetch official IMD lightning strikes."""
    lightning_service = registry.get("imd_lightning")
    if not lightning_service:
        raise HTTPException(status_code=500, detail="Lightning service not configured.")
        
    data = await lightning_service.get_lightning(region=region)
    return data

@router.get("/api/observations/rainfall")
async def get_imd_rainfall(
    district: str = Query(..., description="District to fetch rainfall for")
):
    """Fetch official IMD rainfall data."""
    rainfall_service = registry.get("imd_rainfall")
    if not rainfall_service:
        raise HTTPException(status_code=500, detail="Rainfall service not configured.")
        
    obs = await rainfall_service.get_rainfall(district=district)
    return obs.dict()

from pydantic import BaseModel

class ScriptRequest(BaseModel):
    location: str = ""
    district: str = ""
    risk_level: str = "Nominal"
    hazard: str = ""
    description: str = ""
    temperature: float = 0.0
    rain_mm: float = 0.0
    wind_speed: float = 0.0
    shelter_name: str = ""
    shelter_distance: str = ""

@router.post("/api/weather/broadcast-script")
async def generate_broadcast_script(req: ScriptRequest):
    """Generate a realistic natural-language explanation based on live weather data without announcement flair."""
    hazard_lower = req.hazard.lower() if req.hazard else ""
    risk_lower = req.risk_level.lower() if req.risk_level else "nominal"
    
    # 0. NORMAL / NO RISK SCRIPT
    if risk_lower in ["advisory", "none", "nominal", "low", "normal", "clear", "safe", ""]:
        script = f"In {req.location}, {req.district}, conditions are currently stable. "
        if req.temperature > 0 or req.rain_mm > 0 or req.wind_speed > 0:
            cond = []
            if req.temperature > 0:
                cond.append(f"the temperature is {req.temperature} degrees")
            if req.rain_mm > 0:
                cond.append(f"there is {req.rain_mm} millimeters of rain")
            if req.wind_speed > 0:
                cond.append(f"winds are at {req.wind_speed} kilometers per hour")
            script += "Currently, " + " and ".join(cond) + ". "
        return {"script": script}
        
    # 1. FLOOD OR FLASH FLOOD SCRIPT
    if "flood" in hazard_lower or "rain" in hazard_lower:
        script = f"{req.location} is experiencing a {req.risk_level.lower()} level {req.hazard}. {req.description}. "
        if req.rain_mm > 0:
            script += f"Current rainfall is recorded at {req.rain_mm} millimeters. "
        if req.shelter_name:
            script += f"The nearest safe location is {req.shelter_name}, which is {req.shelter_distance}. "
        return {"script": script}
        
    # 2. CYCLONE OR HIGH WIND SCRIPT
    elif "cyclone" in hazard_lower or "wind" in hazard_lower or "storm" in hazard_lower:
        script = f"{req.location} is under a {req.risk_level.lower()} level {req.hazard}. {req.description}. "
        if req.wind_speed > 0:
            script += f"Winds are currently at {req.wind_speed} kilometers per hour. "
        if req.rain_mm > 0:
            script += f"Rainfall is at {req.rain_mm} millimeters. "
        if req.shelter_name:
            script += f"The nearest safe location is {req.shelter_name}, {req.shelter_distance}. "
        return {"script": script}
        
    # 3. HEATWAVE SCRIPT
    elif "heat" in hazard_lower or "sun" in hazard_lower:
        script = f"{req.location} is facing a {req.risk_level.lower()} level {req.hazard}. {req.description}. "
        if req.temperature > 0:
            script += f"The current temperature is {req.temperature} degrees Celsius. "
        if req.shelter_name:
            script += f"The nearest cooling center is {req.shelter_name}, {req.shelter_distance}. "
        return {"script": script}
            
    # 4. DEFAULT/GENERIC SCRIPT
    else:
        script = f"{req.location} is under a {req.risk_level.lower()} level {req.hazard}. {req.description}. "
        if req.rain_mm > 0 or req.wind_speed > 0:
            cond = []
            if req.rain_mm > 0:
                cond.append(f"{req.rain_mm} millimeters of rain")
            if req.wind_speed > 0:
                cond.append(f"winds at {req.wind_speed} kilometers per hour")
            script += "Current weather includes " + " and ".join(cond) + ". "
            
        if req.shelter_name:
            script += f"The nearest safe location is {req.shelter_name}, {req.shelter_distance}. "
            
        return {"script": script}
