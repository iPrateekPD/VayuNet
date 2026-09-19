"""
VAYUNET Operational Locations Configuration
Single source of truth for the seven supported geographical sectors.
"""

from typing import Dict, Any, List, Optional


OPERATIONAL_LOCATIONS: Dict[str, Dict[str, Any]] = {
    "wayanad": {
        "id": "wayanad",
        "name": "Wayanad",
        "state": "Kerala",
        "lat": 11.5564,
        "lng": 76.1320,
        "elevation_m": 880,
        "terrain_type": "Western Ghats Escarpment",
        "drainage_basin": "Chaliyar River Basin",
        "dem_available": True,
        "spatial_calibrated": True,
        "historical_benchmark": "Wayanad 2024 Meppadi Debris Flow",
        "zoom": 11,
    },
    "chamoli": {
        "id": "chamoli",
        "name": "Chamoli",
        "state": "Uttarakhand",
        "lat": 30.4100,
        "lng": 79.3200,
        "elevation_m": 1550,
        "terrain_type": "Alaknanda Deep Gorge",
        "drainage_basin": "Alaknanda River Catchment",
        "dem_available": True,
        "spatial_calibrated": True,
        "historical_benchmark": "Chamoli 2021 Alaknanda Surge",
        "zoom": 10,
    },
    "kangra": {
        "id": "kangra",
        "name": "Kangra",
        "state": "Himachal Pradesh",
        "lat": 32.2190,
        "lng": 76.3234,
        "elevation_m": 1457,
        "terrain_type": "Dhauladhar Mountain Front",
        "drainage_basin": "Beas / Manjhi Khad Basin",
        "dem_available": True,
        "spatial_calibrated": True,
        "historical_benchmark": "Dharamsala 2021 Cloudburst",
        "zoom": 10,
    },
    "mumbai": {
        "id": "mumbai",
        "name": "Mumbai",
        "state": "Maharashtra",
        "lat": 19.0760,
        "lng": 72.8777,
        "elevation_m": 14,
        "terrain_type": "Konkan Coastal Plain",
        "drainage_basin": "Mithi River / Coastal Lowland",
        "dem_available": True,
        "spatial_calibrated": True,
        "historical_benchmark": "Mumbai 2020 Coastal Squall",
        "zoom": 10,
    },
    "rudraprayag": {
        "id": "rudraprayag",
        "name": "Rudraprayag",
        "state": "Uttarakhand",
        "lat": 30.2844,
        "lng": 78.9811,
        "elevation_m": 895,
        "terrain_type": "Mandakini-Alaknanda River Confluence",
        "drainage_basin": "Mandakini Sub-catchment",
        "dem_available": True,
        "spatial_calibrated": True,
        "historical_benchmark": "Mandakini Confluence Flash Flood 2022",
        "zoom": 10,
    },
    "pithoragarh": {
        "id": "pithoragarh",
        "name": "Pithoragarh",
        "state": "Uttarakhand",
        "lat": 29.5829,
        "lng": 80.2182,
        "elevation_m": 1627,
        "terrain_type": "Sojur Valley High Ridge",
        "drainage_basin": "Kali River Headwaters",
        "dem_available": True,
        "spatial_calibrated": True,
        "historical_benchmark": "Pithoragarh 2021 Ridge Cloudburst",
        "zoom": 10,
    },
    "uttarkashi": {
        "id": "uttarkashi",
        "name": "Uttarkashi",
        "state": "Uttarakhand",
        "lat": 30.7268,
        "lng": 78.4354,
        "elevation_m": 1158,
        "terrain_type": "Bhagirathi Gorge Corridor",
        "drainage_basin": "Upper Bhagirathi Catchment",
        "dem_available": True,
        "spatial_calibrated": True,
        "historical_benchmark": "Uttarkashi 2023 Bhagirathi Torrent",
        "zoom": 10,
    },
}


def get_location(location_id: str) -> Optional[Dict[str, Any]]:
    """Returns location metadata dictionary by ID (case-insensitive) or None."""
    if not location_id:
        return None
    return OPERATIONAL_LOCATIONS.get(location_id.strip().lower())


def list_locations() -> List[Dict[str, Any]]:
    """Returns list of all configured operational locations."""
    return list(OPERATIONAL_LOCATIONS.values())


def find_closest_location(lat: float, lng: float, threshold_deg: float = 0.5) -> Optional[Dict[str, Any]]:
    """Finds matching operational location within threshold distance."""
    closest = None
    min_dist = float("inf")
    for loc in OPERATIONAL_LOCATIONS.values():
        dist = ((loc["lat"] - lat) ** 2 + (loc["lng"] - lng) ** 2) ** 0.5
        if dist < min_dist and dist <= threshold_deg:
            min_dist = dist
            closest = loc
    return closest
