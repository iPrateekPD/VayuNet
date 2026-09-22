"""
VAYUNET V3 Pipeline Orchestrator
Runs all stages of the V3 ML pipeline in the correct order.

Usage:
    python scripts/run_v3_pipeline.py --stage <stage>

Stages (run in this exact order):
    audit       - Phase 0: Full repository + dataset audit
    himawari    - Phase 1: Himawari-8 dataset audit
    leakage     - Phase 3: Data leakage + class balance check
    baseline    - Phase 4: V2 baseline evaluation
    prepare     - Phase 5: Build V3 dataset tensors
    train       - Phase 6+7: Train V3 model
    evaluate    - Phase 8: Evaluate V3 model
    compare     - Phase 10: V2 vs V3 comparison
    report      - Phase 17: Final report generation
    all         - Run all stages in sequence (may take hours)
"""

import argparse
import subprocess
import sys
import json
import logging
from pathlib import Path
from datetime import datetime

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("pipeline")

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SCRIPTS_DIR = PROJECT_ROOT / "scripts"
REPORTS_DIR = PROJECT_ROOT / "reports"
REPORTS_DIR.mkdir(parents=True, exist_ok=True)


def run_stage(script: str, extra_args: list = None) -> bool:
    """Run a stage script and return True on success."""
    cmd = [sys.executable, str(SCRIPTS_DIR / script)] + (extra_args or [])
    logger.info("Running: %s", " ".join(cmd))
    result = subprocess.run(cmd, cwd=str(PROJECT_ROOT))
    if result.returncode != 0:
        logger.error("Stage FAILED: %s (exit code %d)", script, result.returncode)
        return False
    logger.info("Stage PASSED: %s", script)
    return True


STAGES = {
    "audit": {
        "description": "Phase 0+1: Repository audit and Himawari dataset audit",
        "scripts": [
            ("audit_himawari_dataset.py", []),
        ],
        "produces": ["reports/himawari_dataset_report.json", "reports/himawari_dataset_report.md"],
    },
    "himawari": {
        "description": "Phase 1: Himawari-8 dataset audit only",
        "scripts": [("audit_himawari_dataset.py", [])],
        "produces": ["reports/himawari_dataset_report.json"],
    },
    "leakage": {
        "description": "Phase 3: Data leakage + class balance check",
        "scripts": [("check_data_leakage.py", [])],
        "produces": ["reports/data_leakage_report.json"],
        "note": "Expected to FAIL on V2 data (cloudburst 0 positives, static FF mask). This is intentional.",
    },
    "baseline": {
        "description": "Phase 4: V2 baseline model evaluation",
        "scripts": [("evaluate_model.py", ["--split", "test"])],
        "produces": ["reports/v2_baseline.json"],
        "requires": ["checkpoints/vayunet_mtl_best.pt", "data/processed/vayunet_tensors_test.pt"],
    },
    "prepare": {
        "description": "Phase 5: Build V3 dataset tensors (fixes audit findings)",
        "scripts": [("prepare_v3_dataset.py", [])],
        "produces": [
            "data/processed/v3/train.pt",
            "data/processed/v3/val.pt",
            "data/processed/v3/test.pt",
            "data/processed/v3/normalization.json",
            "data/processed/v3/dataset_metadata.json",
        ],
        "note": "Requires Himawari HSD files and IMDAA reanalysis ZIPs.",
    },
    "train": {
        "description": "Phase 6+7: Train V3 model",
        "scripts": [("train_v3.py", [])],
        "produces": ["checkpoints/vayunet_mtl_v3_best.pt", "checkpoints/v3_model_metadata.json"],
        "note": "Requires V3 dataset (run 'prepare' stage first). May take hours on CPU.",
    },
    "evaluate": {
        "description": "Phase 8: Evaluate V3 model",
        "scripts": [("evaluate_model.py", ["--split", "test", "--checkpoint", "checkpoints/vayunet_mtl_v3_best.pt"])],
        "produces": ["reports/v3_evaluation.json"],
        "requires": ["checkpoints/vayunet_mtl_v3_best.pt", "data/processed/v3/test.pt"],
    },
    "compare": {
        "description": "Phase 10: V2 vs V3 comparison report",
        "scripts": [("compare_v2_v3.py", [])],
        "produces": ["reports/v2_vs_v3.json"],
        "requires": ["reports/v2_baseline.json", "reports/v3_evaluation.json"],
    },
    "report": {
        "description": "Phase 17: Final report generation",
        "scripts": [("generate_final_report.py", [])],
        "produces": ["reports/VAYUNET_V3_FINAL_REPORT.md"],
    },
}


def list_stages():
    print("\nAvailable stages:")
    for name, info in STAGES.items():
        note = f" -- {info['note']}" if "note" in info else ""
        print(f"  {name:<12} {info['description']}{note}")
    print()


def check_requirements(stage_name: str) -> bool:
    """Check that required files exist before running a stage."""
    stage = STAGES.get(stage_name, {})
    reqs = stage.get("requires", [])
    missing = []
    for req in reqs:
        if not (PROJECT_ROOT / req).exists():
            missing.append(req)
    if missing:
        logger.error("Missing required files for stage '%s':", stage_name)
        for m in missing:
            logger.error("  MISSING: %s", m)
        return False
    return True


def run_single_stage(stage_name: str) -> bool:
    if stage_name not in STAGES:
        logger.error("Unknown stage: %s", stage_name)
        list_stages()
        return False

    stage = STAGES[stage_name]
    logger.info("=== STAGE: %s ===", stage_name.upper())
    logger.info("Description: %s", stage["description"])

    if not check_requirements(stage_name):
        return False

    all_ok = True
    for script, args in stage["scripts"]:
        ok = run_stage(script, args)
        if not ok:
            all_ok = False
            if stage_name not in ("leakage",):  # leakage expected to fail on V2 data
                logger.error("Stopping due to failure in stage: %s", stage_name)
                break

    produces = stage.get("produces", [])
    existing = [p for p in produces if (PROJECT_ROOT / p).exists()]
    logger.info("Produced %d/%d expected outputs", len(existing), len(produces))

    return all_ok


def run_all():
    """Run all stages in order, stopping on unrecoverable failure."""
    ORDER = ["audit", "leakage", "baseline", "prepare", "train", "evaluate", "compare", "report"]
    results = {}
    for stage in ORDER:
        ok = run_single_stage(stage)
        results[stage] = "PASS" if ok else "FAIL"
        if not ok and stage not in ("leakage", "baseline"):
            logger.error("Stopping pipeline after critical failure in stage: %s", stage)
            break

    print("\n=== PIPELINE SUMMARY ===")
    for stage, status in results.items():
        print(f"  {stage:<12} {status}")


def main():
    parser = argparse.ArgumentParser(description="VAYUNET V3 Pipeline Runner")
    parser.add_argument("--stage", required=True, help="Stage to run (or 'all')")
    parser.add_argument("--list", action="store_true", help="List available stages")
    args = parser.parse_args()

    if args.list:
        list_stages()
        return

    if args.stage == "all":
        run_all()
    else:
        ok = run_single_stage(args.stage)
        sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
