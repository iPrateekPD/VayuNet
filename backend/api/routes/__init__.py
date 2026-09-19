from .system import router as system_router
from .locations import router as locations_router
from .weather import router as weather_router
from .nowcast import router as nowcast_router
from .alerts import router as alerts_router
from .events import router as events_router

__all__ = [
    "system_router",
    "locations_router",
    "weather_router",
    "nowcast_router",
    "alerts_router",
    "events_router"
]
