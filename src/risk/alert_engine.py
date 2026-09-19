"""
VAYUNET Risk Assessment & Alert Engine
Centralizes operational thresholds and dynamic primary hazard determination.
"""

from typing import Dict, Any, List, Tuple
from datetime import datetime, timezone, timedelta

IST_OFFSET = timezone(timedelta(hours=5, minutes=30))

ALERT_THRESHOLDS = {
    "GREEN": 0.0,
    "YELLOW": 0.35,
    "ORANGE": 0.60,
    "RED": 0.80
}

HAZARD_DISPLAY_NAMES = {
    "thunderstorm": "Severe Thunderstorm & Squall",
    "cloudburst": "Localized Convective Cloudburst",
    "flash_flood": "Orographic Flash Flood & Debris Runoff"
}

RECOMMENDED_ACTIONS = {
    "RED": "Immediate evacuation of low-lying floodplains and gorge corridors. Halt transit across vulnerable bridges.",
    "ORANGE": "Pre-position SDRF dewatering units and civil defense. Issue active commuter advisories and monitor discharge gauges.",
    "YELLOW": "Maintain heightened meteorological watch. Verify backup power and wireless emergency communications.",
    "GREEN": "Standard routine monitoring. Atmospheric stability parameters remain within nominal seasonal envelopes."
}


def classify_alert_level(risk_score: float) -> str:
    """Classifies risk score into operational alert tier."""
    if risk_score >= ALERT_THRESHOLDS["RED"]:
        return "RED"
    if risk_score >= ALERT_THRESHOLDS["ORANGE"]:
        return "ORANGE"
    if risk_score >= ALERT_THRESHOLDS["YELLOW"]:
        return "YELLOW"
    return "GREEN"


def determine_primary_hazard(predictions: Dict[str, float]) -> Tuple[str, float, str]:
    """
    Dynamically identifies the highest risk hazard among multi-task predictions.
    
    Args:
        predictions: Dict mapping hazard name to normalized risk_score [0.0, 1.0]
    Returns:
        Tuple of (hazard_name, max_score, alert_level)
    """
    if not predictions:
        return "nominal", 0.0, "GREEN"

    primary_name = max(predictions.keys(), key=lambda k: predictions[k])
    max_score = float(predictions[primary_name])
    alert_lvl = classify_alert_level(max_score)

    return primary_name, max_score, alert_lvl


def generate_location_alerts(location_id: str, predictions: Dict[str, float]) -> List[Dict[str, Any]]:
    """
    Builds alert records for any hazards crossing the YELLOW (>=0.50) operational threshold.
    """
    now_ist = datetime.now(timezone.utc).astimezone(IST_OFFSET).strftime("%Y-%m-%dT%H:%M:%S+05:30")
    alerts = []

    for hazard, score in predictions.items():
        score_f = float(score)
        lvl = classify_alert_level(score_f)
        if lvl in ["YELLOW", "ORANGE", "RED"]:
            alerts.append({
                "hazard": hazard,
                "hazard_name": HAZARD_DISPLAY_NAMES.get(hazard, hazard.replace("_", " ").title()),
                "risk_score": round(score_f, 3),
                "alert_level": lvl,
                "recommended_action": RECOMMENDED_ACTIONS.get(lvl, ""),
                "generated_at": now_ist
            })

    # Sort descending by risk score
    alerts.sort(key=lambda a: a["risk_score"], reverse=True)
    return alerts
