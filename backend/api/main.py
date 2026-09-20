import base64
import sys
import time
from pathlib import Path

from api import ai_dispatcher, bhashini_service
from fastapi import BackgroundTasks, FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure project root is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.config.locations import OPERATIONAL_LOCATIONS
from src.inference.live_weather import fetch_open_meteo_weather
from src.inference.feature_adapter import VayunetFeatureAdapter

# Initialize the feature adapter
adapter = VayunetFeatureAdapter()

# Load PyTorch Deep Learning Inference Engine
ai_engine = None
try:
    from src.features.tensor_builder import build_spatiotemporal_tensor_from_precursors
    from src.inference.pipeline import VayunetInferencePipeline
    ckpt_path = str(PROJECT_ROOT.parent / "checkpoints" / "vayunet_mtl_best.pt")
    ai_engine = VayunetInferencePipeline(checkpoint_path=ckpt_path)
    print("✅ [VAYUNET API] PyTorch Deep Learning Inference Engine loaded successfully.")
except Exception as e:
    print(f"ℹ️ [VAYUNET API] PyTorch model engine running in fallback mode: {e}")

app = FastAPI(
    title="VAYUNET Operational API",
    description="Operational API for AI-Driven Hyper-Local Early Warning System for Severe Weather Nowcasting (SIH 26077)",
    version="2.0.0"
)

# Enable CORS for frontend dashboard (Vite default :5173, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    location_id: str | None = Field(default=None, description="Optional location preset ID")

class BroadcastAlertRequest(BaseModel):
    hazard_type: str = Field(..., description="Type of hazard (Cloudburst / Flash Flood / Thunderstorm)")
    severity: str = Field(..., description="RED, ORANGE, or YELLOW")
    location_name: str = Field(..., description="Target locality")
    lead_time_hours: int = Field(..., description="Actionable warning lead time")
    recipients: list[str] = Field(default=["NDMA", "State Disaster Response Force", "District Collector", "Public Broadcast"])

@app.get("/api/health")
def get_health():
    return {
        "status": "online",
        "system": "VAYUNET Operational Core (SIH 26077)",
        "mode": "Phase 2: Deep Learning Spatiotemporal Transformer (Active)",
        "phase": 2,
        "ai_engine": {
            "loaded": ai_engine is not None,
            "trained_checkpoint": getattr(ai_engine, "is_trained", False) if ai_engine else False,
            "model_version": "VAYUNET-MTL-v2.0",
            "device": str(getattr(ai_engine, "device", "cpu")) if ai_engine else "none"
        },
        "active_hazard_zones": len(OPERATIONAL_LOCATIONS),
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
                "current_status": "NORMAL",
                "primary_threat": "None"
            }
            for v in OPERATIONAL_LOCATIONS.values()
        ]
    }

@app.get("/api/hazards/live")
def get_live_hazards(location_id: str | None = None):
    if location_id:
        if location_id not in OPERATIONAL_LOCATIONS:
            raise HTTPException(status_code=404, detail=f"Location '{location_id}' not found")
        return {"data": OPERATIONAL_LOCATIONS[location_id]}
    return {"data": OPERATIONAL_LOCATIONS}

@app.get("/api/hazards/historical/{event_id}")
def get_historical_event(event_id: str):
    if event_id not in HISTORICAL_EVENTS:
        raise HTTPException(
            status_code=404, 
            detail=f"Historical event '{event_id}' not found. Available: {list(HISTORICAL_EVENTS.keys())}"
        )
    return {"event": HISTORICAL_EVENTS[event_id]}

@app.post("/api/nowcast/predict")
async def predict_nowcast(req: NowcastRequest):
    # Match preset if available or compute distance match
    matched_loc = None
    if req.location_id and req.location_id in OPERATIONAL_LOCATIONS:
        matched_loc = OPERATIONAL_LOCATIONS[req.location_id]
    else:
        min_dist = float("inf")
        for loc in OPERATIONAL_LOCATIONS.values():
            dist = ((loc["lat"] - req.lat) ** 2 + (loc["lng"] - req.lng) ** 2) ** 0.5
            if dist < min_dist:
                min_dist = dist
                matched_loc = loc

    lead_key = f"{req.lead_time_hours}h"

    # Fetch live weather from Open-Meteo
    live_data = await fetch_open_meteo_weather(req.lat, req.lng)
    
    # Build genuine ML tensor
    try:
        tensor = adapter.build_inference_tensor(live_data)
        is_valid = True
        reason = ""
    except Exception as e:
        is_valid = False
        reason = str(e)
        tensor = None
    
    if not is_valid:
        # Strict fallback
        return {
            "prediction_status": "UNAVAILABLE",
            "reason": reason,
            "target": {
                "lat": req.lat,
                "lng": req.lng,
                "location_name": matched_loc["name"] if matched_loc else "Custom Spatial Coordinate"
            },
            "atmospheric_precursors": live_data.get("weather", {}),
            "live_data_status": live_data.get("status", "unknown")
        }

    # Execute real PyTorch Deep Learning Model inference if loaded
    if ai_engine is not None:
        try:
            ai_result = ai_engine.predict_tensor(tensor)
            
            # Scale probability according to lead time degradation
            lead_factor = 1.0 if req.lead_time_hours == 2 else (0.88 if req.lead_time_hours == 4 else 0.72)
            ts_p = round(ai_result["hazard_probabilities"]["thunderstorm"] * lead_factor)
            cb_p = round(ai_result["hazard_probabilities"]["cloudburst"] * lead_factor)
            ff_p = round(ai_result["hazard_probabilities"]["flash_flood"] * lead_factor)

            max_p = max(ts_p, cb_p, ff_p)
            threat_level = "RED" if max_p >= 80 else ("ORANGE" if max_p >= 60 else ("YELLOW" if max_p >= 35 else "GREEN"))

            return {
                "prediction_status": "SUCCESS",
                "target": {
                    "lat": req.lat,
                    "lng": req.lng,
                    "location_name": matched_loc["name"] if matched_loc else "Custom Spatial Coordinate"
                },
                "lead_time": lead_key,
                "predictions": {
                    "thunderstorm_probability": ts_p,
                    "cloudburst_probability": cb_p,
                    "flash_flood_probability": ff_p,
                    "composite_threat_level": threat_level
                },
                "atmospheric_precursors": live_data.get("weather", {}),
                "xai_factor_contributions": ai_result["xai_attribution"],
                "scientific_verdict": ai_result["scientific_verdict"],
                "model_architecture": "Multi-Modal Spatiotemporal Transformer (MTL)",
                "inference_latency_ms": ai_result["inference_latency_ms"],
                "engine_mode": "Phase 2: Live PyTorch Neural Network Inference (Active)"
            }
        except Exception as err:
            print(f"⚠️ Error running live PyTorch inference: {err}. Falling back.")
            return {
                "prediction_status": "ERROR",
                "reason": f"Model inference error: {str(err)}",
                "atmospheric_precursors": live_data.get("weather", {})
            }

    # Should only reach here if model couldn't load but data was somehow valid
    return {
        "prediction_status": "ERROR",
        "reason": "AI Engine is not loaded.",
        "atmospheric_precursors": live_data.get("weather", {})
    }

class AIDispatchRequest(BaseModel):
    hazard_type: str = Field(..., example="Cloudburst")
    severity: str = Field(..., example="Extreme")
    location_name: str = Field(..., example="Dharamsala, HP")
    lead_time_hours: str = Field(..., example="2")

@app.post("/api/alerts/ai-dispatch")
def ai_dispatch_alert(alert: AIDispatchRequest):
    # Generates a localized multilingual alert using AI/LLM
    result = ai_dispatcher.generate_multilingual_alert(
        hazard_type=alert.hazard_type,
        severity=alert.severity,
        location=alert.location_name,
        lead_time=alert.lead_time_hours
    )
    return {
        "status": "SUCCESS",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "generated_content": result
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

# =====================================================================
# BHASHINI (Digital India / MeitY) Multilingual & Voice Endpoints
# =====================================================================

class BhashiniTranslateRequest(BaseModel):
    text: str = Field(..., example="Severe thunderstorm warning in Dharamsala.")
    source_language: str = Field("en", example="en")
    target_language: str = Field("hi", example="hi")

class BhashiniTTSRequest(BaseModel):
    text: str = Field(..., example="धर्मशाला में भारी बारिश की संभावना है।")
    language: str = Field("hi", example="hi")
    gender: str = Field("female", example="female")

class BhashiniPipelineRequest(BaseModel):
    text: str = Field(..., example="Flash flood warning. Move to higher ground.")
    source_language: str = Field("en", example="en")
    target_language: str = Field("hi", example="hi")
    gender: str = Field("female", example="female")

@app.get("/api/bhashini/languages")
def bhashini_languages():
    """Returns the list of 22 supported scheduled Indian languages."""
    return {
        "status": "SUCCESS",
        "supported_languages": bhashini_service.SUPPORTED_BHASHINI_LANGUAGES
    }

@app.post("/api/bhashini/translate")
def bhashini_translate(req: BhashiniTranslateRequest):
    """Dynamic translation using Digital India Bhashini NMT."""
    res = bhashini_service.translate_text(
        text=req.text,
        source_lang=req.source_language,
        target_lang=req.target_language
    )
    return {"status": "SUCCESS", "data": res}

@app.post("/api/bhashini/tts")
def bhashini_tts(req: BhashiniTTSRequest):
    """Regional voice synthesis using Digital India Bhashini TTS."""
    res = bhashini_service.synthesize_speech(
        text=req.text,
        language=req.language,
        gender=req.gender
    )
    return {"status": "SUCCESS", "data": res}

@app.get("/api/bhashini/stream")
def bhashini_audio_stream(text: str, lang: str = "hi", gender: str = "female"):
    """
    Direct binary audio stream (audio/wav).
    Can be used directly in <audio src="/api/bhashini/stream?..." /> elements!
    """
    res = bhashini_service.synthesize_speech(text=text, language=lang, gender=gender)
    audio_b64 = res.get("audio_base64", "")
    if not audio_b64:
        raise HTTPException(status_code=400, detail=res.get("error", "Unable to synthesize audio"))
    audio_bytes = base64.b64decode(audio_b64)
    return Response(content=audio_bytes, media_type="audio/wav")

@app.post("/api/bhashini/pipeline")
def bhashini_pipeline(req: BhashiniPipelineRequest):
    """
    Chained Pipeline: Translates English text to Regional Language AND synthesizes voice audio in one shot.
    """
    res = bhashini_service.translate_and_synthesize(
        text=req.text,
        source_lang=req.source_language,
        target_lang=req.target_language,
        gender=req.gender
    )
    return {"status": "SUCCESS", "data": res}

