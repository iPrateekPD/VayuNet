"""
VAYUNET Map Layers Proxy
Serves as a secure backend proxy for fetching real-time weather tiles
from external providers (RainViewer, OpenWeatherMap) without exposing API keys.
"""

import httpx
import logging
import os
import time
from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import JSONResponse
from cachetools import TTLCache

router = APIRouter(tags=["Map Layers"])
logger = logging.getLogger(__name__)

# Cache timestamps for 2 minutes to prevent hammering RainViewer API
timestamps_cache = TTLCache(maxsize=1, ttl=120)

@router.get("/api/warnings/map/timestamps")
async def get_map_timestamps():
    """
    Fetches the latest available radar timestamps from RainViewer.
    Used by the frontend to construct the correct tile URLs.
    """
    if "latest" in timestamps_cache:
        return timestamps_cache["latest"]
        
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get("https://api.rainviewer.com/public/weather-maps.json")
            resp.raise_for_status()
            data = resp.json()
            
            # Rainviewer returns past, nowcast, and radar data.
            # We want the most recent 'past' radar frame
            radar_frames = data.get("radar", {}).get("past", [])
            latest_time = radar_frames[-1].get("time") if radar_frames else int(time.time())
            
            result = {
                "status": "success",
                "radar_timestamp": latest_time,
                "host": data.get("host", "https://tilecache.rainviewer.com")
            }
            timestamps_cache["latest"] = result
            return result
    except Exception as e:
        logger.error(f"Failed to fetch map timestamps: {e}")
        return JSONResponse(
            status_code=502,
            content={"status": "degraded", "error": "Unable to fetch timestamps"}
        )

@router.get("/api/warnings/map/tiles/{layer}/{z}/{x}/{y}")
async def get_map_tile(layer: str, z: int, x: int, y: int, time_param: str = "latest"):
    """
    Secure tile proxy.
    Supported layers: 
    - 'rainfall' (Proxies to RainViewer)
    - 'clouds' (Proxies to OpenWeatherMap)
    """
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            if layer == "rainfall":
                # RainViewer public API: host/v2/radar/{time}/256/{z}/{x}/{y}/2/1_1.png
                # Color scheme 2, smooth 1, snow 1
                host = "https://tilecache.rainviewer.com"
                if "latest" in timestamps_cache:
                    host = timestamps_cache["latest"].get("host", host)
                    
                timestamp = time_param
                if timestamp == "latest":
                    # Best effort latest
                    timestamp = str(int(time.time()) - (int(time.time()) % 600))
                    
                url = f"{host}/v2/radar/{timestamp}/256/{z}/{x}/{y}/2/1_1.png"
                resp = await client.get(url)
                
                if resp.status_code == 200:
                    return Response(
                        content=resp.content,
                        media_type="image/png",
                        headers={"Cache-Control": "public, max-age=300"}
                    )
            
            elif layer == "clouds":
                api_key = os.getenv("OPENWEATHER_API_KEY", "")
                if not api_key:
                    raise HTTPException(status_code=401, detail="OWM API Key not configured")
                    
                url = f"https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid={api_key}"
                resp = await client.get(url)
                if resp.status_code == 200:
                    return Response(
                        content=resp.content, 
                        media_type="image/png",
                        headers={"Cache-Control": "public, max-age=1800"}
                    )
            
            # Return transparent 1x1 PNG for unsupported/failed layers
            transparent_pixel = b'\\x89PNG\\r\\n\\x1a\\n\\x00\\x00\\x00\\rIHDR\\x00\\x00\\x00\\x01\\x00\\x00\\x00\\x01\\x08\\x06\\x00\\x00\\x00\\x1f\\x15\\xc4\\x89\\x00\\x00\\x00\\nIDATx\\x9cc\\x00\\x01\\x00\\x00\\x05\\x00\\x01\\r\\n-\\xb4\\x00\\x00\\x00\\x00IEND\\xaeB`\\x82'
            return Response(content=transparent_pixel, media_type="image/png")
            
    except Exception as e:
        logger.error(f"Tile proxy error for {layer}/{z}/{x}/{y}: {e}")
        # Fail silently for maps to prevent console spam
        transparent_pixel = b'\\x89PNG\\r\\n\\x1a\\n\\x00\\x00\\x00\\rIHDR\\x00\\x00\\x00\\x01\\x00\\x00\\x00\\x01\\x08\\x06\\x00\\x00\\x00\\x1f\\x15\\xc4\\x89\\x00\\x00\\x00\\nIDATx\\x9cc\\x00\\x01\\x00\\x00\\x05\\x00\\x01\\r\\n-\\xb4\\x00\\x00\\x00\\x00IEND\\xaeB`\\x82'
        return Response(content=transparent_pixel, media_type="image/png")
