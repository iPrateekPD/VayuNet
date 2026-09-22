"""
VAYUNET Shelter Config
Defines static candidate shelters for operational locations.
"""

from typing import List, Dict, Any
from src.config.locations import get_location

# Dictionary mapping operational location ID to a list of candidate shelters
SHELTERS_BY_LOCATION: Dict[str, List[Dict[str, Any]]] = {
    "gunupur": [
        {
            "id": "sh_gnp_01",
            "name": "Gunupur Sub-Divisional Hospital",
            "address": "Main Road, Gunupur",
            "coords": [19.0850, 83.8200],
            "elevation": "85 m (Safe Zone)",
            "capacity": "500 Persons",
            "facilities": "Emergency Medical, Drinking Water, Backup Power",
            "contact": "Emergency: 108"
        },
        {
            "id": "sh_gnp_02",
            "name": "Gunupur Govt High School",
            "address": "Station Road, Gunupur",
            "coords": [19.0810, 83.8120],
            "elevation": "90 m",
            "capacity": "800 Persons",
            "facilities": "Large Halls, Food Supply, SDRF Base",
            "contact": "Local Admin: 1077"
        },
        {
            "id": "sh_gnp_03",
            "name": "Vamsadhara Cyclone Relief Center",
            "address": "Near River Bridge, Gunupur",
            "coords": [19.0780, 83.8300],
            "elevation": "95 m",
            "capacity": "1000 Persons",
            "facilities": "Helipad, Emergency Generators, Medical Camp",
            "contact": "Relief Cmd: 1070"
        },
        {
            "id": "sh_gnp_04",
            "name": "Gunupur Community Hall",
            "address": "Market Square, Gunupur",
            "coords": [19.0900, 83.8150],
            "elevation": "88 m",
            "capacity": "300 Persons",
            "facilities": "Shelter, Basic Med Kits",
            "contact": "Municipal: 1077"
        }
    ],
    "mcleodganj": [
        {
            "id": "sh_mcl_01",
            "name": "Zonal Hospital Dharamsala",
            "address": "Civil Lines, Dharamsala",
            "coords": [32.2150, 76.3210],
            "elevation": "1450 m (Secure)",
            "capacity": "600 Persons",
            "facilities": "Trauma Center, Backup Power, Helipad",
            "contact": "Emergency: 108"
        },
        {
            "id": "sh_mcl_02",
            "name": "McLeodganj Community Center",
            "address": "Temple Road, McLeodganj",
            "coords": [32.2350, 76.3250],
            "elevation": "2050 m",
            "capacity": "400 Persons",
            "facilities": "Food, Blankets, Heating",
            "contact": "Admin: 1077"
        },
        {
            "id": "sh_mcl_03",
            "name": "Dalai Lama Temple Complex (Safe Zone)",
            "address": "Temple Rd, McLeodganj",
            "coords": [32.2325, 76.3255],
            "elevation": "2080 m",
            "capacity": "1500 Persons",
            "facilities": "Mass Shelter, Medical Camp, Food",
            "contact": "Temple Office"
        },
        {
            "id": "sh_mcl_04",
            "name": "TCV School Auditorium",
            "address": "Upper Dharamsala",
            "coords": [32.2450, 76.3150],
            "elevation": "2100 m",
            "capacity": "800 Persons",
            "facilities": "Solid Structure, Beds, Communication",
            "contact": "SDRF: 1070"
        }
    ],
    "dharamsala": [
        {
            "id": "sh_dha_01",
            "name": "Dharamsala Indoor Sports Complex",
            "address": "Civil Lines, Lower Dharamsala",
            "coords": [32.2150, 76.3200],
            "elevation": "1457 m (Reinforced Relief Camp)",
            "capacity": "1,200 Persons",
            "facilities": "First Aid Dispensary, Satellite Phone, Clean Water",
            "contact": "Kangra Police: 112 / 01892-222244"
        },
        {
            "id": "sh_dha_02",
            "name": "Zonal Hospital Dharamsala",
            "address": "Civil Lines, Dharamsala",
            "coords": [32.2180, 76.3220],
            "elevation": "1460 m",
            "capacity": "600 Persons",
            "facilities": "Trauma Center, Medical Supplies",
            "contact": "Hospital: 108"
        }
    ],
    "wayanad_meppadi": [
        {
            "id": "sh_wyn_01",
            "name": "Meppadi Relief Camp",
            "address": "Meppadi, Wayanad",
            "coords": [11.5500, 76.1300],
            "elevation": "870 m",
            "capacity": "600 Persons",
            "facilities": "SDRF Base, Medical, Food",
            "contact": "Emergency: 1070"
        },
        {
            "id": "sh_wyn_02",
            "name": "Wayanad Institute of Medical Sciences",
            "address": "Meppadi, Wayanad",
            "coords": [11.5650, 76.1200],
            "elevation": "890 m",
            "capacity": "1000 Persons",
            "facilities": "Hospital, Intensive Care, Power",
            "contact": "Hospital: 108"
        },
        {
            "id": "sh_wyn_03",
            "name": "Govt Higher Secondary School Meppadi",
            "address": "Main Road, Meppadi",
            "coords": [11.5580, 76.1350],
            "elevation": "885 m",
            "capacity": "800 Persons",
            "facilities": "Shelter, Water, Basic Kits",
            "contact": "Admin: 1077"
        },
        {
            "id": "sh_wyn_04",
            "name": "Kalpetta Civil Station Shelter",
            "address": "Kalpetta",
            "coords": [11.6050, 76.0830],
            "elevation": "780 m",
            "capacity": "2000 Persons",
            "facilities": "Command Center, Army Deployment, Helipad",
            "contact": "District Admin: 1077"
        }
    ],
    "new_delhi": [
        {
            "id": "sh_del_01",
            "name": "Safdarjung Hospital",
            "address": "Ansari Nagar, New Delhi",
            "coords": [28.5680, 77.2050],
            "elevation": "210 m",
            "capacity": "2000 Persons",
            "facilities": "Level 1 Trauma, Full Med, Backup Power",
            "contact": "Emergency: 108"
        },
        {
            "id": "sh_del_02",
            "name": "NDMC Community Center",
            "address": "Connaught Place",
            "coords": [28.6320, 77.2180],
            "elevation": "215 m",
            "capacity": "1500 Persons",
            "facilities": "Food, Shelter, Admin Control",
            "contact": "NDMC: 1077"
        },
        {
            "id": "sh_del_03",
            "name": "AIIMS Emergency Block",
            "address": "Sri Aurobindo Marg",
            "coords": [28.5670, 77.2100],
            "elevation": "212 m",
            "capacity": "1000 Persons",
            "facilities": "Medical Emergency, Intensive Care",
            "contact": "AIIMS: 108"
        },
        {
            "id": "sh_del_04",
            "name": "Talkatora Indoor Stadium",
            "address": "Talkatora Garden",
            "coords": [28.6250, 77.1950],
            "elevation": "218 m",
            "capacity": "5000 Persons",
            "facilities": "Mass Shelter, NDRF Staging",
            "contact": "NDRF: 1070"
        }
    ],
    "mumbai_coastal_delta": [
        {
            "id": "sh_mum_01",
            "name": "Dadar Central Municipal Relief Pavilion",
            "address": "Dr. B. Ambedkar Road, Dadar",
            "coords": [19.0178, 72.8478],
            "elevation": "28 m (Elevated Complex)",
            "capacity": "2500 Persons",
            "facilities": "Emergency Generator, BMC Food Supplies, Medical Unit",
            "contact": "BMC Disaster Management: 1916"
        },
        {
            "id": "sh_mum_02",
            "name": "KEM Hospital Emergency Complex",
            "address": "Parel, Mumbai",
            "coords": [19.0020, 72.8420],
            "elevation": "22 m",
            "capacity": "1800 Persons",
            "facilities": "Trauma Care, Emergency Power",
            "contact": "Emergency: 108"
        }
    ],
    "bengaluru_urban": [
        {
            "id": "sh_blr_01",
            "name": "BBMP Central Relief Center",
            "address": "Hudson Circle, Bengaluru",
            "coords": [12.9650, 77.5850],
            "elevation": "920 m (Safe Plateau Ground)",
            "capacity": "1200 Persons",
            "facilities": "Civil Defense Reserve, SDRF Liaison",
            "contact": "BBMP Control Room: 080-22221188"
        }
    ],
    "chandigarh_tricity": [
        {
            "id": "sh_chd_01",
            "name": "Sector 17 Civil Defense Facility",
            "address": "Bridge Market, Chandigarh",
            "coords": [30.7400, 76.7850],
            "elevation": "321 m (Safe Urban Plain)",
            "capacity": "1500 Persons",
            "facilities": "Relief Supplies, Communication Hub",
            "contact": "Chandigarh Emergency: 112"
        }
    ],
    "chamoli_joshimath": [
        {
            "id": "sh_chm_01",
            "name": "Gopeshwar District Sports Pavilion",
            "address": "Main Bazar High Ground, Gopeshwar",
            "coords": [30.4050, 79.3300],
            "elevation": "1550 m (Above River Flood Line)",
            "capacity": "1500 Persons",
            "facilities": "NDRF Base, Emergency Medical Tents, Rations",
            "contact": "Uttarakhand SEOC: 1070 / 0135-2710334"
        },
        {
            "id": "sh_chm_02",
            "name": "Joshimath Military Cantonment Shelter",
            "address": "Upper Joshimath",
            "coords": [30.5600, 79.5700],
            "elevation": "1920 m",
            "capacity": "1000 Persons",
            "facilities": "High Altitude Rescue Base, Medical Post",
            "contact": "Army Station HQ: 01389-222100"
        }
    ]
}


def get_shelters_for_location(location_id: str, lat: float = 0.0, lng: float = 0.0) -> List[Dict[str, Any]]:
    """Returns candidate shelters for a location, or dynamically offset ones if not found."""
    if not location_id:
        location_id = "unknown"

    # Resolve through canonical location registry first
    loc = get_location(location_id)
    canonical_id = loc["id"] if loc else location_id.strip().lower()

    if canonical_id in SHELTERS_BY_LOCATION:
        return SHELTERS_BY_LOCATION[canonical_id]

    # Check for direct key match
    if location_id.strip().lower() in SHELTERS_BY_LOCATION:
        return SHELTERS_BY_LOCATION[location_id.strip().lower()]

    # Use coordinates from location if provided
    ref_lat = loc["lat"] if loc else (lat or 20.0)
    ref_lng = loc["lng"] if loc else (lng or 78.0)
    loc_display = loc["name"] if loc else location_id

    # Dynamic fallback generation based on the query coordinates
    return [
        {
            "id": f"sh_{canonical_id}_01",
            "name": f"{loc_display} District General Hospital",
            "address": "City Center High Ground",
            "coords": [ref_lat + 0.01, ref_lng + 0.01], 
            "elevation": "Safe Zone",
            "capacity": "500 Persons",
            "facilities": "Emergency Medical, Drinking Water, Power",
            "contact": "Emergency: 108"
        },
        {
            "id": f"sh_{canonical_id}_02",
            "name": f"{loc_display} Govt High School Relief Base",
            "address": "Main Road Elevated Block",
            "coords": [ref_lat - 0.01, ref_lng - 0.01],
            "elevation": "Safe Zone",
            "capacity": "800 Persons",
            "facilities": "Large Halls, Food Supply, First Aid",
            "contact": "Local Admin: 1077"
        },
        {
            "id": f"sh_{canonical_id}_03",
            "name": f"{loc_display} SDRF Multi-Purpose Shelter",
            "address": "State Highway Junction",
            "coords": [ref_lat + 0.02, ref_lng - 0.01],
            "elevation": "Safe Zone",
            "capacity": "1000 Persons",
            "facilities": "Helipad, Emergency Generators, Satellite Link",
            "contact": "Relief Cmd: 1070"
        }
    ]
