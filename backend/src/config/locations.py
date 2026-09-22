"""
VAYUNET Operational Locations Configuration
Single canonical source of truth for all operational geographical sectors.
Supports universal lookup by canonical ID, alias, or display name.
"""

import re
from typing import Dict, Any, List, Optional


OPERATIONAL_LOCATIONS: Dict[str, Dict[str, Any]] = {
    "gunupur": {
        "id": "gunupur",
        "name": "Gunupur",
        "state": "Odisha",
        "district": "Rayagada District, Odisha",
        "pincode": "765022",
        "lat": 19.0805,
        "lng": 83.8166,
        "elevation_m": 85,
        "terrain_type": "Vamsadhara River Valley Plain",
        "drainage_basin": "Vamsadhara River Catchment",
        "dem_available": True,
        "spatial_calibrated": True,
        "historical_benchmark": "Gunupur 2020 Vamsadhara Inundation",
        "zoom": 11,
        "aliases": ["gunupur", "rayagada", "gunupur_odisha"]
    },
    "dharamsala": {
        "id": "dharamsala",
        "name": "Dharamsala",
        "state": "Himachal Pradesh",
        "district": "Kangra District, Himachal Pradesh",
        "pincode": "176215",
        "lat": 32.2190,
        "lng": 76.3234,
        "elevation_m": 1457,
        "terrain_type": "Dhauladhar Mountain Front",
        "drainage_basin": "Beas / Manjhi Khad Basin",
        "dem_available": True,
        "spatial_calibrated": True,
        "historical_benchmark": "Dharamsala 2021 Cloudburst",
        "zoom": 10,
        "aliases": ["dharamsala", "dharamsala_hp", "dharamsala_valley"]
    },
    "mcleodganj": {
        "id": "mcleodganj",
        "name": "McLeodganj",
        "state": "Himachal Pradesh",
        "district": "Kangra District, Himachal Pradesh",
        "pincode": "176219",
        "lat": 32.2426,
        "lng": 76.3213,
        "elevation_m": 2082,
        "terrain_type": "Dhauladhar High Ridge",
        "drainage_basin": "Upper Kangra Torrent Basin",
        "dem_available": True,
        "spatial_calibrated": True,
        "historical_benchmark": "McLeodganj 2021 Ridge Torrent",
        "zoom": 11,
        "aliases": ["mcleodganj", "mcleod_ganj", "mcleodganj_hp"]
    },
    "wayanad_meppadi": {
        "id": "wayanad_meppadi",
        "name": "Wayanad (Meppadi)",
        "state": "Kerala",
        "district": "Wayanad District, Kerala",
        "pincode": "673577",
        "lat": 11.5564,
        "lng": 76.1320,
        "elevation_m": 880,
        "terrain_type": "Western Ghats Escarpment",
        "drainage_basin": "Chaliyar River Basin",
        "dem_available": True,
        "spatial_calibrated": True,
        "historical_benchmark": "Wayanad 2024 Meppadi Debris Flow",
        "zoom": 11,
        "aliases": ["wayanad_meppadi", "wayanad", "meppadi", "wayanad_kerala", "chooralmala"]
    },
    "mumbai_coastal_delta": {
        "id": "mumbai_coastal_delta",
        "name": "Mumbai Coastal Delta",
        "state": "Maharashtra",
        "district": "Mumbai Suburban, Maharashtra",
        "pincode": "400001",
        "lat": 19.0760,
        "lng": 72.8777,
        "elevation_m": 14,
        "terrain_type": "Konkan Coastal Plain",
        "drainage_basin": "Mithi River / Coastal Lowland",
        "dem_available": True,
        "spatial_calibrated": True,
        "historical_benchmark": "Mumbai 2020 Coastal Squall",
        "zoom": 10,
        "aliases": ["mumbai_coastal_delta", "mumbai", "mumbai_mmr", "bombay"]
    },
    "new_delhi": {
        "id": "new_delhi",
        "name": "New Delhi",
        "state": "Delhi",
        "district": "National Capital Territory of Delhi",
        "pincode": "110001",
        "lat": 28.6139,
        "lng": 77.2090,
        "elevation_m": 216,
        "terrain_type": "Indo-Gangetic Alluvial Plain",
        "drainage_basin": "Yamuna River Basin",
        "dem_available": True,
        "spatial_calibrated": True,
        "historical_benchmark": "Delhi 2023 Yamuna Peak Flood",
        "zoom": 10,
        "aliases": ["new_delhi", "delhi", "ncr", "newdelhi", "connaught_place"]
    },
    "bengaluru_urban": {
        "id": "bengaluru_urban",
        "name": "Bengaluru Urban",
        "state": "Karnataka",
        "district": "Bengaluru Urban, Karnataka",
        "pincode": "560001",
        "lat": 12.9716,
        "lng": 77.5946,
        "elevation_m": 920,
        "terrain_type": "Deccan Plateau Ridge",
        "drainage_basin": "Vrishabhavathi / Arkavathi Basin",
        "dem_available": True,
        "spatial_calibrated": True,
        "historical_benchmark": "Bengaluru 2022 Urban Inundation",
        "zoom": 11,
        "aliases": ["bengaluru_urban", "bengaluru", "bangalore"]
    },
    "chandigarh_tricity": {
        "id": "chandigarh_tricity",
        "name": "Chandigarh Tri-City",
        "state": "Chandigarh",
        "district": "Union Territory of Chandigarh",
        "pincode": "160017",
        "lat": 30.7333,
        "lng": 76.7794,
        "elevation_m": 321,
        "terrain_type": "Shivalik Foothill Plain",
        "drainage_basin": "Ghaggar River Catchment",
        "dem_available": True,
        "spatial_calibrated": True,
        "historical_benchmark": "Chandigarh 2023 Sukhna Sluice Surge",
        "zoom": 11,
        "aliases": ["chandigarh_tricity", "chandigarh", "mohali", "panchkula"]
    },
    "chamoli_joshimath": {
        "id": "chamoli_joshimath",
        "name": "Chamoli / Joshimath",
        "state": "Uttarakhand",
        "district": "Chamoli District, Uttarakhand",
        "pincode": "246443",
        "lat": 30.4124,
        "lng": 79.3243,
        "elevation_m": 1550,
        "terrain_type": "Alaknanda Deep Gorge",
        "drainage_basin": "Alaknanda River Catchment",
        "dem_available": True,
        "spatial_calibrated": True,
        "historical_benchmark": "Chamoli 2021 Alaknanda Surge",
        "zoom": 10,
        "aliases": ["chamoli_joshimath", "chamoli", "joshimath", "chamoli_uttarakhand", "gopeshwar"]
    },
    "kangra": {
        "id": "kangra",
        "name": "Kangra",
        "state": "Himachal Pradesh",
        "district": "Kangra District, Himachal Pradesh",
        "pincode": "176001",
        "lat": 32.0998,
        "lng": 76.2691,
        "elevation_m": 733,
        "terrain_type": "Kangra Valley Lowland",
        "drainage_basin": "Beas River Basin",
        "dem_available": True,
        "spatial_calibrated": True,
        "historical_benchmark": "Kangra Valley Flash Surge 2021",
        "zoom": 10,
        "aliases": ["kangra", "kangra_valley", "kangra_himachal"]
    },
    "rudraprayag": {
        "id": "rudraprayag",
        "name": "Rudraprayag",
        "state": "Uttarakhand",
        "district": "Rudraprayag District, Uttarakhand",
        "pincode": "246171",
        "lat": 30.2844,
        "lng": 78.9811,
        "elevation_m": 895,
        "terrain_type": "Mandakini-Alaknanda River Confluence",
        "drainage_basin": "Mandakini Sub-catchment",
        "dem_available": True,
        "spatial_calibrated": True,
        "historical_benchmark": "Mandakini Confluence Flash Flood 2022",
        "zoom": 10,
        "aliases": ["rudraprayag", "rudraprayag_uttarakhand"]
    },
    "pithoragarh": {
        "id": "pithoragarh",
        "name": "Pithoragarh",
        "state": "Uttarakhand",
        "district": "Pithoragarh District, Uttarakhand",
        "pincode": "262501",
        "lat": 29.5829,
        "lng": 80.2182,
        "elevation_m": 1627,
        "terrain_type": "Sojur Valley High Ridge",
        "drainage_basin": "Kali River Headwaters",
        "dem_available": True,
        "spatial_calibrated": True,
        "historical_benchmark": "Pithoragarh 2021 Ridge Cloudburst",
        "zoom": 10,
        "aliases": ["pithoragarh", "pithoragarh_uttarakhand"]
    },
    "uttarkashi": {
        "id": "uttarkashi",
        "name": "Uttarkashi",
        "state": "Uttarakhand",
        "district": "Uttarkashi District, Uttarakhand",
        "pincode": "249193",
        "lat": 30.7268,
        "lng": 78.4354,
        "elevation_m": 1158,
        "terrain_type": "Bhagirathi Gorge Corridor",
        "drainage_basin": "Upper Bhagirathi Catchment",
        "dem_available": True,
        "spatial_calibrated": True,
        "historical_benchmark": "Uttarkashi 2023 Bhagirathi Torrent",
        "zoom": 10,
        "aliases": ["uttarkashi", "uttarkashi_uttarakhand"]
    },
}

# Ensure all canonical operational locations have explicit display_name, latitude, longitude, and timezone
for _loc in OPERATIONAL_LOCATIONS.values():
    _loc["display_name"] = _loc.get("display_name") or _loc["name"]
    _loc["latitude"] = _loc["lat"]
    _loc["longitude"] = _loc["lng"]
    _loc["timezone"] = "Asia/Kolkata"


def normalize_location_key(raw_key: str) -> str:
    """Normalizes any location identifier, stripping special symbols, slashes, and spaces."""
    if not raw_key:
        return ""
    # Convert slashes and hyphens to underscore
    cleaned = re.sub(r"[\/\-\s]+", "_", raw_key.strip().lower())
    # Remove all other non-alphanumeric/non-underscore characters
    cleaned = re.sub(r"[^\w_]", "", cleaned)
    # Collapse multiple underscores
    cleaned = re.sub(r"_+", "_", cleaned).strip("_")
    return cleaned


def get_location(location_id: str) -> Optional[Dict[str, Any]]:
    """
    Returns canonical location metadata dictionary by ID, alias, or display name.
    Performs normalized matching so e.g. 'chamoli_joshimath', 'Chamoli / Joshimath',
    'chamoli', or 'Joshimath' all resolve seamlessly.
    """
    if not location_id:
        return None

    raw_lower = location_id.strip().lower()
    norm_key = normalize_location_key(location_id)

    # 1. Exact canonical ID match
    if norm_key in OPERATIONAL_LOCATIONS:
        return OPERATIONAL_LOCATIONS[norm_key]
    if raw_lower in OPERATIONAL_LOCATIONS:
        return OPERATIONAL_LOCATIONS[raw_lower]

    # 2. Check aliases across all locations
    for loc in OPERATIONAL_LOCATIONS.values():
        if norm_key in loc.get("aliases", []):
            return loc
        if raw_lower in loc.get("aliases", []):
            return loc

    # 3. Match against location name, district, or state
    for loc in OPERATIONAL_LOCATIONS.values():
        loc_name_norm = normalize_location_key(loc["name"])
        if norm_key == loc_name_norm or raw_lower == loc["name"].lower():
            return loc
        if norm_key in loc_name_norm or loc_name_norm in norm_key:
            return loc
        if raw_lower in loc["district"].lower() or raw_lower in loc["state"].lower():
            return loc

    # 4. Partial substring matching against aliases
    for loc in OPERATIONAL_LOCATIONS.values():
        for alias in loc.get("aliases", []):
            if alias in norm_key or norm_key in alias:
                return loc

    return None


def list_locations() -> List[Dict[str, Any]]:
    """Returns list of all configured canonical operational locations."""
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


def assert_coordinates_match(location_id: str, test_lat: float, test_lng: float, tolerance: float = 0.001) -> bool:
    """
    Validates that test coordinates strictly match canonical location coordinates.
    Raises ValueError if deviation exceeds tolerance.
    """
    loc = get_location(location_id)
    if not loc:
        raise ValueError(f"Unknown location '{location_id}'.")
    lat_diff = abs(loc["latitude"] - test_lat)
    lng_diff = abs(loc["longitude"] - test_lng)
    if lat_diff > tolerance or lng_diff > tolerance:
        raise ValueError(
            f"[COORDINATE MISMATCH] Location '{location_id}' canonical is "
            f"({loc['latitude']}, {loc['longitude']}) but received ({test_lat}, {test_lng})"
        )
    return True

