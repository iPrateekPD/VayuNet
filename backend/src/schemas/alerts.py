"""
Pydantic Schemas for VAYUNET Alert Endpoints
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class AlertItem(BaseModel):
    hazard: str = Field(..., description="Hazard identifier (thunderstorm, cloudburst, flash_flood)")
    hazard_name: str = Field(..., description="Human-readable hazard name")
    risk_score: float = Field(..., description="Continuous model risk score [0.0 - 1.0]")
    alert_level: str = Field(..., description="GREEN, YELLOW, ORANGE, or RED")
    recommended_action: str = Field(..., description="Recommended emergency response action")
    generated_at: str = Field(..., description="IST timestamp of alert generation")


class LocationAlertsResponse(BaseModel):
    status: str = "success"
    data_mode: str = "LIVE"
    location_id: str
    location_name: str
    active_alerts_count: int
    alerts: List[AlertItem]
    disclaimer: str = "AI-generated risk assessment - not an official warning."


class BroadcastAlertRequest(BaseModel):
    alertId: Optional[str] = Field(None, description="Optional alert reference ID")
    headline: Optional[str] = Field(None, description="Alert headline summary")
    severity: Optional[str] = Field("HIGH RISK", description="Severity (RED/HIGH, ORANGE/MODERATE, YELLOW/WATCH)")
    area: Optional[str] = Field("Monitored Operational Sector", description="Target geographic catchment area")
    hazard_type: Optional[str] = Field(None, description="Hazard type")
    event: Optional[str] = Field(None, description="Event descriptor")
    protocol: str = Field(default="CAP-1.2", description="Alerting protocol specification")


class BroadcastAlertResponse(BaseModel):
    status: str = "DISPATCHED"
    alert_id: str
    protocol: str = "CAP-1.2"
    timestamp: str
    destinations: List[str]
