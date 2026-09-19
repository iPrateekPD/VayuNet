"""
Pydantic Schemas for VAYUNET Locations
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class LocationItem(BaseModel):
    id: str = Field(..., description="Unique location identifier")
    name: str = Field(..., description="Human-readable sector name")
    state: str = Field(..., description="Indian state")
    lat: float = Field(..., description="Latitude in decimal degrees")
    lng: float = Field(..., description="Longitude in decimal degrees")
    elevation_m: Optional[int] = Field(default=None, description="Average terrain elevation in meters")
    terrain_type: Optional[str] = Field(default=None, description="Morphological terrain categorization")
    drainage_basin: Optional[str] = Field(default=None, description="Hydrological catchment name")
    dem_available: bool = Field(default=False, description="Whether CartoDEM spatial raster is available")
    zoom: Optional[int] = Field(default=10, description="Recommended map zoom level")


class LocationsResponse(BaseModel):
    status: str = "success"
    operational_locations: int
    locations: List[LocationItem]
