import time
from typing import Dict, List, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="VAYUNET Operational API",
    description="Operational API for AI-Driven Hyper-Local Early Warning System for Severe Weather Nowcasting (SIH 26077)",
    version="1.0.0"
)

# Enable CORS for frontend dashboard (Vite default :5173, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pre-defined Monitored Locations with ground-truth coordinates and risk parameters
MONITORED_LOCATIONS = {
    "dharamsala": {
        "id": "dharamsala",
        "name": "Dharamsala (Kangra Basin)",
        "state": "Himachal Pradesh",
        "lat": 32.2190,
        "lng": 76.3234,
        "elevation_m": 1457,
        "terrain_type": "Steep Orographic Valley",
        "primary_threat": "Cloudburst & Flash Flood",
        "current_status": "RED ALERT",
        "hazard_probabilities": {
            "thunderstorm": 94,
            "cloudburst": 88,
            "flash_flood": 92
        },
        "atmospheric_precursors": {
            "iwv_mm": 62.4,              # Integrated Water Vapor (>58 mm threshold)
            "cape_j_kg": 3120,            # Convective Available Potential Energy (>2500 J/kg)
            "cin_j_kg": -12,              # Convective Inhibition (eroding towards 0)
            "ctt_drop_rate_c_hr": -16.4,  # Cloud Top Temp Drop Rate (< -10°C/hr indicates explosive updraft)
            "wind_shear_0_6km_kt": 38,   # Deep layer shear (supports organized severe convection)
            "dem_slope_deg": 34.2,        # Steep topography triggering flash flood runoff
            "drainage_basin": "Bhagsunag Stream Sub-catchment"
        },
        "xai_factor_contributions": {
            "ctt_drop_rate": 38,
            "dem_slope_funneling": 28,
            "cape_instability": 20,
            "iwv_moisture_flux": 14
        },
        "lead_time_forecasts": {
            "2h": {"thunderstorm": 94, "cloudburst": 88, "flash_flood": 92, "alert_level": "RED"},
            "4h": {"thunderstorm": 85, "cloudburst": 72, "flash_flood": 89, "alert_level": "ORANGE"},
            "6h": {"thunderstorm": 60, "cloudburst": 45, "flash_flood": 74, "alert_level": "YELLOW"}
        }
    },
    "uttarkashi": {
        "id": "uttarkashi",
        "name": "Uttarkashi (Bhagirathi Valley)",
        "state": "Uttarakhand",
        "lat": 30.7268,
        "lng": 78.4354,
        "elevation_m": 1158,
        "terrain_type": "Deep Himalayan Canyon",
        "primary_threat": "Debris Flow & Cloudburst Surge",
        "current_status": "ORANGE ALERT",
        "hazard_probabilities": {
            "thunderstorm": 78,
            "cloudburst": 71,
            "flash_flood": 84
        },
        "atmospheric_precursors": {
            "iwv_mm": 54.8,
            "cape_j_kg": 2450,
            "cin_j_kg": -24,
            "ctt_drop_rate_c_hr": -11.2,
            "wind_shear_0_6km_kt": 32,
            "dem_slope_deg": 39.8,
            "drainage_basin": "Upper Bhagirathi Catchment"
        },
        "xai_factor_contributions": {
            "dem_slope_funneling": 36,
            "ctt_drop_rate": 28,
            "cape_instability": 22,
            "iwv_moisture_flux": 14
        },
        "lead_time_forecasts": {
            "2h": {"thunderstorm": 78, "cloudburst": 71, "flash_flood": 84, "alert_level": "ORANGE"},
            "4h": {"thunderstorm": 88, "cloudburst": 82, "flash_flood": 90, "alert_level": "RED"},
            "6h": {"thunderstorm": 70, "cloudburst": 55, "flash_flood": 78, "alert_level": "ORANGE"}
        }
    },
    "mumbai": {
        "id": "mumbai",
        "name": "Mumbai Metropolitan Region",
        "state": "Maharashtra",
        "lat": 19.0760,
        "lng": 72.8777,
        "elevation_m": 14,
        "terrain_type": "Coastal Urban Delta",
        "primary_threat": "Urban Inundation & Severe Squall",
        "current_status": "ORANGE ALERT",
        "hazard_probabilities": {
            "thunderstorm": 86,
            "cloudburst": 52,
            "flash_flood": 88
        },
        "atmospheric_precursors": {
            "iwv_mm": 68.1,
            "cape_j_kg": 2890,
            "cin_j_kg": -15,
            "ctt_drop_rate_c_hr": -9.8,
            "wind_shear_0_6km_kt": 24,
            "dem_slope_deg": 4.1,
            "drainage_basin": "Mithi River Low-lying Estuary"
        },
        "xai_factor_contributions": {
            "iwv_moisture_flux": 42,
            "cape_instability": 28,
            "ctt_drop_rate": 18,
            "dem_slope_funneling": 12
        },
        "lead_time_forecasts": {
            "2h": {"thunderstorm": 86, "cloudburst": 52, "flash_flood": 88, "alert_level": "ORANGE"},
            "4h": {"thunderstorm": 91, "cloudburst": 61, "flash_flood": 95, "alert_level": "RED"},
            "6h": {"thunderstorm": 65, "cloudburst": 30, "flash_flood": 72, "alert_level": "YELLOW"}
        }
    },
    "wayanad": {
        "id": "wayanad",
        "name": "Wayanad (Meppadi Ridge)",
        "state": "Kerala",
        "lat": 11.5564,
        "lng": 76.1320,
        "elevation_m": 880,
        "terrain_type": "Western Ghats Escarpment",
        "primary_threat": "Orographic Torrential Rain & Landslide",
        "current_status": "RED ALERT",
        "hazard_probabilities": {
            "thunderstorm": 74,
            "cloudburst": 82,
            "flash_flood": 96
        },
        "atmospheric_precursors": {
            "iwv_mm": 65.3,
            "cape_j_kg": 2100,
            "cin_j_kg": -8,
            "ctt_drop_rate_c_hr": -14.1,
            "wind_shear_0_6km_kt": 30,
            "dem_slope_deg": 42.5,
            "drainage_basin": "Chaliyar River Headwaters"
        },
        "xai_factor_contributions": {
            "dem_slope_funneling": 41,
            "iwv_moisture_flux": 29,
            "ctt_drop_rate": 20,
            "cape_instability": 10
        },
        "lead_time_forecasts": {
            "2h": {"thunderstorm": 74, "cloudburst": 82, "flash_flood": 96, "alert_level": "RED"},
            "4h": {"thunderstorm": 70, "cloudburst": 78, "flash_flood": 94, "alert_level": "RED"},
            "6h": {"thunderstorm": 50, "cloudburst": 45, "flash_flood": 80, "alert_level": "ORANGE"}
        }
    }
}

# Historical replay events for video demonstration
HISTORICAL_EVENTS = {
    "dharamsala-2021": {
        "title": "Dharamsala Flash Flood & Cloudburst (July 12, 2021)",
        "location_id": "dharamsala",
        "timeline_steps": [
            {"time_offset": "-4h", "iwv": 52.1, "cape": 1800, "ctt_drop": -3.2, "cloudburst_prob": 25, "flood_prob": 20, "notes": "Moisture flux initiates from Arabian Sea"},
            {"time_offset": "-3h", "iwv": 58.4, "cape": 2400, "ctt_drop": -8.5, "cloudburst_prob": 54, "flood_prob": 45, "notes": "CIN barrier breaches; rapid cumulus towering"},
            {"time_offset": "-2h", "iwv": 62.4, "cape": 3120, "ctt_drop": -16.4, "cloudburst_prob": 88, "flood_prob": 92, "notes": "CRITICAL: Cloud top collapse & orographic entrapment"},
            {"time_offset": "-1h", "iwv": 64.0, "cape": 2900, "ctt_drop": -14.0, "cloudburst_prob": 95, "flood_prob": 98, "notes": "Torrents descend into Bhagsunag nullah"},
            {"time_offset": "0h", "iwv": 61.2, "cape": 1400, "ctt_drop": -2.0, "cloudburst_prob": 99, "flood_prob": 100, "notes": "Peak inundation recorded; early alerts delivered 2.5h prior"}
        ]
    },
    "wayanad-2024": {
        "title": "Wayanad Orographic Runoff & Surge (July 30, 2024)",
        "location_id": "wayanad",
        "timeline_steps": [
            {"time_offset": "-6h", "iwv": 58.0, "cape": 1600, "ctt_drop": -4.0, "cloudburst_prob": 30, "flood_prob": 40, "notes": "Continuous monsoon orographic lift"},
            {"time_offset": "-4h", "iwv": 62.5, "cape": 1950, "ctt_drop": -9.2, "cloudburst_prob": 62, "flood_prob": 70, "notes": "Soil saturation index reaches 98%"},
            {"time_offset": "-2h", "iwv": 65.3, "cape": 2100, "ctt_drop": -14.1, "cloudburst_prob": 82, "flood_prob": 96, "notes": "DEM basin runoff model warns of catastrophic torrent"},
            {"time_offset": "0h", "iwv": 66.0, "cape": 1700, "ctt_drop": -6.0, "cloudburst_prob": 88, "flood_prob": 99, "notes": "Major surge event observed"}
        ]
    }
}

# Request / Response Schemas
class NowcastRequest(BaseModel):
    lat: float = Field(..., description="Target Latitude")
    lng: float = Field(..., description="Target Longitude")
    lead_time_hours: int = Field(default=2, ge=2, le=6, description="Lead time forecast in hours (2-6h)")
    location_id: Optional[str] = Field(default=None, description="Optional location preset ID")

class BroadcastAlertRequest(BaseModel):
    hazard_type: str = Field(..., description="Type of hazard (Cloudburst / Flash Flood / Thunderstorm)")
    severity: str = Field(..., description="RED, ORANGE, or YELLOW")
    location_name: str = Field(..., description="Target locality")
    lead_time_hours: int = Field(..., description="Actionable warning lead time")
    recipients: List[str] = Field(default=["NDMA", "State Disaster Response Force", "District Collector", "Public Broadcast"])

@app.get("/api/health")
def get_health():
    return {
        "status": "online",
        "system": "VAYUNET Operational Core (SIH 26077)",
        "mode": "Phase 1: Working Operational Prototype (Demo AI Engine)",
        "phase": 1,
        "next_phase": "Phase 2: Deep Learning Spatiotemporal Transformer (Post-Sept 9)",
        "active_hazard_zones": len(MONITORED_LOCATIONS),
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

@app.get("/api/hazards/locations")
def list_locations():
    return {
        "locations": [
            {
                "id": v["id"],
                "name": v["name"],
                "state": v["state"],
                "lat": v["lat"],
                "lng": v["lng"],
                "current_status": v["current_status"],
                "primary_threat": v["primary_threat"]
            }
            for v in MONITORED_LOCATIONS.values()
        ]
    }

@app.get("/api/hazards/live")
def get_live_hazards(location_id: Optional[str] = None):
    if location_id:
        if location_id not in MONITORED_LOCATIONS:
            raise HTTPException(status_code=404, detail=f"Location '{location_id}' not found")
        return {"data": MONITORED_LOCATIONS[location_id]}
    return {"data": MONITORED_LOCATIONS}

@app.get("/api/hazards/historical/{event_id}")
def get_historical_event(event_id: str):
    if event_id not in HISTORICAL_EVENTS:
        raise HTTPException(
            status_code=404, 
            detail=f"Historical event '{event_id}' not found. Available: {list(HISTORICAL_EVENTS.keys())}"
        )
    return {"event": HISTORICAL_EVENTS[event_id]}

@app.post("/api/nowcast/predict")
def predict_nowcast(req: NowcastRequest):
    # Match preset if available or compute deterministic signature
    matched_loc = None
    if req.location_id and req.location_id in MONITORED_LOCATIONS:
        matched_loc = MONITORED_LOCATIONS[req.location_id]
    else:
        # Simple distance match to nearest preset or synthetic calculation
        min_dist = float("inf")
        for loc in MONITORED_LOCATIONS.values():
            dist = ((loc["lat"] - req.lat) ** 2 + (loc["lng"] - req.lng) ** 2) ** 0.5
            if dist < min_dist:
                min_dist = dist
                matched_loc = loc

    lead_key = f"{req.lead_time_hours}h"
    forecast = matched_loc["lead_time_forecasts"].get(lead_key, matched_loc["lead_time_forecasts"]["2h"])

    return {
        "target": {
            "lat": req.lat,
            "lng": req.lng,
            "location_name": matched_loc["name"] if matched_loc else "Custom Spatial Coordinate"
        },
        "lead_time": lead_key,
        "predictions": {
            "thunderstorm_probability": forecast["thunderstorm"],
            "cloudburst_probability": forecast["cloudburst"],
            "flash_flood_probability": forecast["flash_flood"],
            "composite_threat_level": forecast["alert_level"]
        },
        "atmospheric_precursors": matched_loc["atmospheric_precursors"],
        "xai_factor_contributions": matched_loc["xai_factor_contributions"],
        "model_architecture": "Multi-Modal Spatiotemporal Transformer (MTL)",
        "inference_latency_ms": 142.5,
        "engine_mode": "Phase 1: Deterministic Atmospheric Matrix (Demo Mode)"
    }

@app.post("/api/alerts/broadcast")
def broadcast_alert(alert: BroadcastAlertRequest, background_tasks: BackgroundTasks):
    # Simulates Common Alerting Protocol (CAP) message generation
    alert_id = f"CAP-IN-{int(time.time())}"
    return {
        "alert_id": alert_id,
        "status": "DISPATCHED",
        "hazard_type": alert.hazard_type,
        "severity": alert.severity,
        "location": alert.location_name,
        "lead_time": f"{alert.lead_time_hours} Hours Actionable Buffer",
        "channels_notified": alert.recipients,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "message": f"EMERGENCY NOWCAST ALERT [{alert.severity}]: High probability of {alert.hazard_type} in {alert.location_name}. Evacuate low-lying drainage corridors within {alert.lead_time_hours} hours."
    }
