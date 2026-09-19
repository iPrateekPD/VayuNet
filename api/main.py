"""
VAYUNET Operational API Application (SIH 26077)
Single source of truth for the seven operational sectors, real-time meteorological ingestion,
and deep learning spatiotemporal nowcasting inference.
"""

import sys
import logging
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, Response
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware

# Ensure project root is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.inference.model_loader import get_model_manager
from src.config.locations import list_locations
from api.routes import (
    system_router,
    locations_router,
    weather_router,
    nowcast_router,
    alerts_router,
    events_router
)

logger = logging.getLogger("vayunet.api")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Validates model checkpoint, normalization, and operational locations at startup.
    Loads PyTorch model into memory once.
    """
    logger.info("=== Starting VAYUNET Operational Core ===")
    mgr = get_model_manager()
    status = mgr.get_status()

    if status["trained_checkpoint"]:
        logger.info(
            "[STARTUP] Trained PyTorch checkpoint loaded successfully: %s on %s",
            status["checkpoint_path"],
            status["device"]
        )
    else:
        logger.warning("[STARTUP] Running without trained checkpoint! Status: %s", status)

    if not status["normalization_ready"]:
        logger.warning("[STARTUP] normalization.json missing from data/processed/")
    else:
        logger.info("[STARTUP] normalization.json verified ready for anti-leakage scaling.")

    locs = list_locations()
    logger.info("[STARTUP] Registered %d operational locations: %s", len(locs), [l["id"] for l in locs])
    yield
    logger.info("=== Shutting down VAYUNET Operational Core ===")


app = FastAPI(
    title="VAYUNET Operational Core API",
    description="MoES / NCMRWF Hyper-Local Severe Weather Nowcasting & Multi-Hazard Early Warning System (SIH 26077)",
    version="2.0.0",
    lifespan=lifespan
)

# Configure CORS for local development and dashboard communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount modular routers
app.include_router(system_router)
app.include_router(locations_router)
app.include_router(weather_router)
app.include_router(nowcast_router)
app.include_router(alerts_router)
app.include_router(events_router)


@app.get("/", include_in_schema=False)
def root():
    """Redirects to interactive OpenAPI docs."""
    return RedirectResponse(url="/docs")


@app.get("/api/health", include_in_schema=False)
def api_health():
    """Health check alias for frontend."""
    mgr = get_model_manager()
    status_dict = mgr.get_status()
    return {"status": "ok", "system": "VAYUNET Operational Core", "ai_engine": status_dict["loaded"]}


@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    """Suppresses browser favicon 404 noise."""
    return Response(status_code=204)
