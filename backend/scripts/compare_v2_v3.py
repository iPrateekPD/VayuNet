"""
VAYUNET V2 vs V3 Comparison Report Generator
Phase 10: Compares V2 baseline metrics against V3 evaluation metrics.

Usage:
    python scripts/compare_v2_v3.py

Produces:
    reports/v2_vs_v3.json
"""

import json
import logging
from pathlib import Path
from datetime import datetime

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("compare")

PROJECT_ROOT = Path(__file__).resolve().parent.parent
REPORTS_DIR = PROJECT_ROOT / "reports"


def load_report(path: Path) -> dict:
    if not path.exists():
        logger.error("Report not found: %s", path)
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def main():
    logger.info("=== VAYUNET V2 vs V3 Comparison ===")
    
    v2_path = REPORTS_DIR / "v2_baseline.json"
    v3_path = REPORTS_DIR / "v3_evaluation.json"

    v2_report = load_report(v2_path)
    v3_report = load_report(v3_path)

    if not v2_report or not v3_report:
        logger.error("Cannot compare: missing reports.")
        return

    v2_metrics = v2_report.get("metrics", {})
    v3_metrics = v3_report.get("metrics", {})

    comparison = {
        "generated_at": datetime.now().isoformat(),
        "hazards": {}
    }

    print("\n" + "="*60)
    print(f"{'Hazard':<15} | {'Metric':<10} | {'V2':<12} | {'V3':<12} | {'Change':<10}")
    print("-" * 60)

    for hazard in ["thunderstorm", "cloudburst", "flash_flood"]:
        m2 = v2_metrics.get(hazard, {})
        m3 = v3_metrics.get(hazard, {})
        
        comp_h = {}
        for metric in ["csi", "pod", "far", "f1"]:
            val2 = m2.get(metric, "N/A")
            val3 = m3.get(metric, "N/A")
            
            change = "N/A"
            if isinstance(val2, (int, float)) and isinstance(val3, (int, float)):
                diff = val3 - val2
                change = f"{diff:+.4f}"
            
            comp_h[metric] = {
                "v2": val2,
                "v3": val3,
                "change": change
            }
            
            print(f"{hazard:<15} | {metric:<10} | {str(val2):<12} | {str(val3):<12} | {change:<10}")
            
        comparison["hazards"][hazard] = comp_h
        print("-" * 60)

    out_path = REPORTS_DIR / "v2_vs_v3.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(comparison, f, indent=2)
    logger.info("Comparison report saved: %s", out_path)


if __name__ == "__main__":
    main()
