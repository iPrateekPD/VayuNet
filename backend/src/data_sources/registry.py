from typing import Dict, Any, Type
import logging

class DataSourceRegistry:
    def __init__(self):
        self._sources: Dict[str, Any] = {}
        
    def register(self, name: str, source_instance: Any):
        """Register a data source instance (e.g., IMDAWSService)."""
        self._sources[name] = source_instance
        logging.info(f"Registered data source: {name}")
        
    def get(self, name: str) -> Any:
        """Retrieve a registered data source."""
        if name not in self._sources:
            logging.warning(f"Data source not found: {name}")
            return None
        return self._sources[name]

# Global registry instance
registry = DataSourceRegistry()

# Auto-register core services
from .imd import (
    IMDAWSService, IMDCurrentWeatherService, IMDRainfallService,
    IMDNowcastService, IMDWarningService, IMDRadarService,
    IMDLightningService, IMDBasinQPFService, IMDCycloneService
)
from .open_meteo import OpenMeteoService

registry.register("imd_aws", IMDAWSService())
registry.register("imd_current_weather", IMDCurrentWeatherService())
registry.register("imd_rainfall", IMDRainfallService())
registry.register("imd_nowcast", IMDNowcastService())
registry.register("imd_warnings", IMDWarningService())
registry.register("imd_radar", IMDRadarService())
registry.register("imd_lightning", IMDLightningService())
registry.register("imd_basin_qpf", IMDBasinQPFService())
registry.register("imd_cyclone", IMDCycloneService())
registry.register("open_meteo", OpenMeteoService())

