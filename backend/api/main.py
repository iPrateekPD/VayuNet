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

from api.routes import alerts, events, locations, nowcast, system, weather, risk_routes, map_layers

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
    ckpt_path = str(PROJECT_ROOT / "checkpoints" / "vayunet_mtl_best.pt")
    if not Path(ckpt_path).exists():
        ckpt_path = str(PROJECT_ROOT.parent / "checkpoints" / "vayunet_mtl_best.pt")
    ai_engine = VayunetInferencePipeline(checkpoint_path=ckpt_path)
    print(f"[VAYUNET API] PyTorch Deep Learning Inference Engine loaded successfully (trained={ai_engine.is_trained}).")
except Exception as e:
    print(f"[VAYUNET API] PyTorch model engine running in fallback mode: {e}")

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

# Include modular routers
app.include_router(locations.router)
app.include_router(weather.router)
app.include_router(nowcast.router)
app.include_router(alerts.router)
app.include_router(events.router)
app.include_router(system.router)
app.include_router(risk_routes.router)
app.include_router(map_layers.router)

# =====================================================================
# Root endpoint
# =====================================================================

@app.get("/")
def root():
    return {
        "status": "online", 
        "message": "VayuNet API is running. Visit /docs for documentation.",
        "documentation_url": "/docs"
    }

# =====================================================================
# BHASHINI (Digital India / MeitY) Multilingual & Voice Endpoints
# =====================================================================

class BhashiniTranslateRequest(BaseModel):
    # pyrefly: ignore [unexpected-keyword]
    text: str = Field(..., example="Severe thunderstorm warning in Dharamsala.")
    # pyrefly: ignore [unexpected-keyword]
    source_language: str = Field("en", example="en")
    # pyrefly: ignore [unexpected-keyword]
    target_language: str = Field("hi", example="hi")

class BhashiniTTSRequest(BaseModel):
    # pyrefly: ignore [unexpected-keyword]
    text: str = Field(..., example="धर्मशाला में भारी बारिश की संभावना है।")
    # pyrefly: ignore [unexpected-keyword]
    language: str = Field("hi", example="hi")
    # pyrefly: ignore [unexpected-keyword]
    gender: str = Field("female", example="female")

class BhashiniPipelineRequest(BaseModel):
    # pyrefly: ignore [unexpected-keyword]
    text: str = Field(..., example="Flash flood warning. Move to higher ground.")
    # pyrefly: ignore [unexpected-keyword]
    source_language: str = Field("en", example="en")
    # pyrefly: ignore [unexpected-keyword]
    target_language: str = Field("hi", example="hi")
    # pyrefly: ignore [unexpected-keyword]
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

