from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class UnifiedObservation(BaseModel):
    """Common response structure for observational data."""
    source: str
    source_label: str = Field(default="Unknown", description="Human readable source name")
    is_live: bool = Field(default=False, description="Whether this represents a live connection")
    source_type: str = Field(..., description="e.g., 'observation', 'official_warning'")
    region: Optional[str] = None
    station_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    observed_at: str
    temperature_c: Optional[float] = None
    humidity_pct: Optional[int] = None
    pressure_hpa: Optional[float] = None
    wind_speed_ms: Optional[float] = None
    wind_direction_deg: Optional[int] = None
    rainfall_mm: Optional[float] = None
    weather_code: Optional[int] = None
    condition: Optional[str] = None
    quality: str = Field(default="UNKNOWN", description="e.g., 'GOOD', 'STALE', 'POOR'")
    status: str = Field(default="DATA_UNAVAILABLE", description="e.g., 'LIVE', 'DEGRADED', 'DATA_UNAVAILABLE'")
    age_minutes: Optional[int] = None

class RainfallObservation(BaseModel):
    """District-wise rainfall metrics."""
    district: str
    state: Optional[str] = None
    rainfall_mm: Optional[float] = None
    normal_mm: Optional[float] = None
    departure_pct: Optional[float] = None
    observed_at: str
    source: str = "IMD"
    status: str = "LIVE"

class BasinForecastDay(BaseModel):
    day: int
    rainfall_mm: float

class BasinForecast(BaseModel):
    """River Basin QPF API response."""
    basin: str
    sub_basin: Optional[str] = None
    forecast: List[BasinForecastDay] = []
    source: str = "IMD"
    issued_at: str

class UnifiedAlert(BaseModel):
    alert_id: str
    hazard: str
    severity: str
    region: Optional[str] = None
    district: Optional[str] = None
    issued_at: str
    valid_until: Optional[str] = None
    source: str
    source_type: str
    probability: Optional[float] = None
    official_warning: Optional[str] = None
    model_version: Optional[str] = None
    data_sources: List[str] = []

class HazardAssessment(BaseModel):
    probability: float
    risk_level: str
    trend: Optional[str] = None
    model_version: Optional[str] = None

class ModelProvenance(BaseModel):
    name: str = "VAYUNET-MTL"
    version: str = "V3.0"
    checkpoint: str = "vayunet_mtl_best.pt"
    loaded: bool = False
    inference_executed: bool = False
    inference_timestamp: Optional[str] = None

class RiskAssessment(BaseModel):
    region: str
    timestamp: str
    timestamp_utc: str
    data_timestamp: Optional[str] = None
    timezone: str = "Asia/Kolkata"
    primary_hazard: Optional[str] = None
    primary_level: Optional[str] = None
    hazards: Dict[str, HazardAssessment]
    official_information: Dict[str, Any] = {}
    observations: Dict[str, Any] = {}
    model: ModelProvenance = ModelProvenance()
    data_quality: Dict[str, Any] = {
        "overall": "UNKNOWN",
        "stale_sources": [],
        "missing_sources": []
    }
