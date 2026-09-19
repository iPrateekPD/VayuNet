"""
Pydantic Schemas for VAYUNET Nowcast Endpoints
"""

from typing import Dict, Any, Optional
from pydantic import BaseModel, Field, ConfigDict


class HazardPrediction(BaseModel):
    risk_score: float = Field(..., description="Continuous risk score [0.0 - 1.0]")
    alert_level: str = Field(..., description="GREEN, YELLOW, ORANGE, or RED")


class PrimaryHazardInfo(BaseModel):
    hazard: str
    hazard_name: str
    risk_score: float
    alert_level: str
    recommended_action: str


class ModelMeta(BaseModel):
    version: str = "VAYUNET-MTL-v2.0"
    device: str = "cpu"
    inference_latency_ms: Optional[float] = None


class NowcastTimestamps(BaseModel):
    weather_time: str
    retrieved_at: str
    prediction_time: str


class NowcastResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    status: str = "success"
    data_mode: str = "LIVE"
    model_inference_available: bool = True
    spatial_context_available: bool = True
    reason: Optional[str] = None
    location: Dict[str, Any]
    model: ModelMeta
    weather: Dict[str, Any]
    prediction: Optional[Dict[str, HazardPrediction]] = None
    primary_hazard: Optional[PrimaryHazardInfo] = None
    lead_times: Optional[Dict[str, Any]] = None
    atmospheric_precursors: Optional[Dict[str, Any]] = None
    xai: Optional[Dict[str, Any]] = None
    scientific_verdict: Optional[str] = None
    timestamps: NowcastTimestamps
    disclaimer: str = "AI-generated risk assessment - not an official warning."
