#!/usr/bin/env python3
"""
VAYUNET Master AI Pipeline CLI Runner (SIH 26077)
Hyper-Local Severe Weather Nowcasting & Multi-Hazard Early Warning System
Ministry of Earth Sciences (MoES) / NCMRWF

Usage:
    python run_pipeline.py --stage all
    python run_pipeline.py --stage preprocess
    python run_pipeline.py --stage train --epochs 10 --batch_size 4
    python run_pipeline.py --stage evaluate
    python run_pipeline.py --stage serve --port 8000
"""

import sys
import argparse
import logging
from pathlib import Path

# Ensure project root is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.pipeline.config import PipelineConfig
from src.pipeline.orchestrator import VayunetPipelineOrchestrator


def setup_logging(verbose: bool = False):
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%H:%M:%S"
    )


def main():
    parser = argparse.ArgumentParser(
        description="VAYUNET Master End-to-End AI Pipeline (SIH 26077)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Stages:
  preprocess  : Ingest raw satellite, CartoDEM, and reanalysis data to assemble 12-channel tensors
  train       : Train Spatiotemporal Divided Space-Time Transformer on multi-hazard focal loss
  evaluate    : Calculate CSI, POD, FAR on unseen test set and export model_metadata.json
  serve       : Launch FastAPI operational nowcast server on port 8000
  all         : Run end-to-end pipeline (preprocess -> train -> evaluate -> serve)
        """
    )
    parser.add_argument(
        "--stage",
        type=str,
        default="all",
        choices=["preprocess", "train", "evaluate", "serve", "all"],
        help="Pipeline execution stage (default: all)"
    )
    parser.add_argument("--epochs", type=int, default=15, help="Number of training epochs (default: 15)")
    parser.add_argument("--batch_size", type=int, default=4, help="Batch size for training (default: 4)")
    parser.add_argument("--lr", type=float, default=1e-4, help="Learning rate (default: 1e-4)")
    parser.add_argument("--device", type=str, default="auto", help="Compute device: auto, cuda, mps, cpu")
    parser.add_argument("--max_samples", type=int, default=None, help="Limit samples per split for fast dev run")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="API host (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=8000, help="API port (default: 8000)")
    parser.add_argument("--verbose", action="store_true", help="Enable verbose debug logging")

    args = parser.parse_args()
    setup_logging(args.verbose)

    config = PipelineConfig(project_root=PROJECT_ROOT)
    orchestrator = VayunetPipelineOrchestrator(config)

    try:
        orchestrator.run_stage(
            stage=args.stage,
            epochs=args.epochs,
            batch_size=args.batch_size,
            lr=args.lr,
            device=args.device,
            max_samples=args.max_samples,
            host=args.host,
            port=args.port
        )
    except Exception as e:
        logging.error("Pipeline execution failed: %s", e, exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
