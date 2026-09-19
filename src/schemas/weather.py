"""
Pydantic Schemas for VAYUNET Weather Endpoints
"""

from typing import Optional
from pydantic import BaseModel, Field


class WeatherData(BaseModel):
    temperature_2m_c: Optional[float] = Field(None, description="Air temperature at 2m (°C)")
    relative_humidity_pct: Optional[int] = Field(None, description="Relative humidity (%)")
    surface_pressure_hpa: Optional[float] = Field(None, description="Atmospheric pressure at surface (hPa)")
    precipitation_mm: Optional[float] = Field(None, description="Precipitation rate (mm)")
    rain_mm: Optional[float] = Field(None, description="Liquid rain accumulation (mm)")
    wind_speed_kmh: Optional[float] = Field(None, description="Surface wind speed at 10m (km/h)")
    wind_direction_deg: Optional[int] = Field(None, description="Wind direction (degrees)")
    wind_gusts_kmh: Optional[float] = Field(None, description="Maximum wind gusts (km/h)")
    cape_j_kg: Optional[int] = Field(None, description="Convective Available Potential Energy (J/kg)")
    cin_j_kg: Optional[int] = Field(None, description="Convective Inhibition (J/kg)")
    iwv_kg_m2: Optional[float] = Field(None, description="Integrated Water Vapor column (kg/m² or mm)")
    total_column_water_vapour_kg_m2: Optional[float] = Field(None, description="Alias for IWV")


class WeatherLocation(BaseModel):
    id: str
    name: str
    state: str
    lat: float
    lng: float


class WeatherSource(BaseModel):
    provider: str = "Open-Meteo"
    data_type: str = "model-derived-current"


class WeatherTimestamps(BaseModel):
    provider_time: str
    retrieved_at: str


class WeatherFreshness(BaseModel):
    cached: bool
    age_seconds: int
    ttl_seconds: int = 300


class WeatherResponse(BaseModel):
    status: str = "success"
    data_mode: str = "LIVE"
    location: WeatherLocation
    source: WeatherSource
    weather: WeatherData
    timestamps: WeatherTimestamps
    freshness: WeatherFreshness
