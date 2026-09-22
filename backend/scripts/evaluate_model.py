"""
VAYUNET V2 Baseline Evaluator
Phase 4: Runs V2 model on the corrected test protocol.
Reports all metrics with explicit handling of invalid cases (zero positives).

Usage:
    python scripts/evaluate_model.py [--split test] [--threshold 0.5]

Produces:
    reports/v2_baseline.json
"""

import json
import sys
import time
import logging
import argparse
from pathlib import Path
from datetime import datetime

import numpy as np
import torch
import torch.nn.functional as F

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("v2_evaluator")

REPORTS_DIR = PROJECT_ROOT / "reports"
REPORTS_DIR.mkdir(parents=True, exist_ok=True)


NOT_MEANINGFUL = "NOT_MEANINGFUL"


def compute_binary_metrics(
    preds_binary: np.ndarray,
    targets: np.ndarray,
    probs: np.ndarray,
    hazard_name: str
) -> dict:
    """
    Computes pixel-level binary classification metrics.
    Returns NOT_MEANINGFUL for any metric where the test set has 0 positives.
    """
    total = targets.size
    pos_pixels = int((targets > 0.5).sum())
    neg_pixels = total - pos_pixels

    if pos_pixels == 0:
        logger.warning(
            "[%s] TEST SET HAS 0 POSITIVE PIXELS. "
            "CSI, POD, F1, Precision, Recall, ROC-AUC are NOT_MEANINGFUL.",
            hazard_name
        )
        return {
            "hazard": hazard_name,
            "total_pixels": total,
            "positive_pixels": 0,
            "negative_pixels": neg_pixels,
            "evaluation_valid": False,
            "note": "Zero positive samples in test set. All metrics marked NOT_MEANINGFUL.",
            "csi": NOT_MEANINGFUL,
            "pod": NOT_MEANINGFUL,
            "far": NOT_MEANINGFUL,
            "f1": NOT_MEANINGFUL,
            "precision": NOT_MEANINGFUL,
            "recall": NOT_MEANINGFUL,
            "accuracy": float((preds_binary == (targets > 0.5)).mean()),
            "false_alarms": int(((preds_binary == 1) & (targets < 0.5)).sum()),
            "missed_events": NOT_MEANINGFUL,
            "hits": 0,
            "brier_score": float(np.mean((probs - targets) ** 2)),
            "roc_auc": NOT_MEANINGFUL,
            "pr_auc": NOT_MEANINGFUL,
        }

    if neg_pixels == 0:
        logger.warning(
            "[%s] TEST SET HAS 0 NEGATIVE PIXELS. FAR, Precision are NOT_MEANINGFUL.",
            hazard_name
        )

    # Confusion matrix
    hits = int(((preds_binary == 1) & (targets > 0.5)).sum())
    misses = int(((preds_binary == 0) & (targets > 0.5)).sum())
    false_alarms = int(((preds_binary == 1) & (targets < 0.5)).sum())
    correct_neg = int(((preds_binary == 0) & (targets < 0.5)).sum())

    # CSI (Critical Success Index)
    csi_denom = hits + misses + false_alarms
    csi = hits / csi_denom if csi_denom > 0 else 0.0

    # POD (Probability of Detection = Recall)
    pod = hits / (hits + misses) if (hits + misses) > 0 else 0.0

    # FAR (False Alarm Ratio)
    far = false_alarms / (hits + false_alarms) if (hits + false_alarms) > 0 else 0.0

    # Precision
    precision = hits / (hits + false_alarms) if (hits + false_alarms) > 0 else 0.0

    # F1
    f1 = 2 * precision * pod / (precision + pod) if (precision + pod) > 0 else 0.0

    # Accuracy
    accuracy = (hits + correct_neg) / total

    # Brier score
    brier = float(np.mean((probs - targets) ** 2))

    # ROC-AUC (requires sklearn if available)
    roc_auc = NOT_MEANINGFUL
    pr_auc = NOT_MEANINGFUL
    try:
        from sklearn.metrics import roc_auc_score, average_precision_score
        if pos_pixels > 0 and neg_pixels > 0:
            flat_targets = targets.flatten()
            flat_probs = probs.flatten()
            roc_auc = float(roc_auc_score(flat_targets, flat_probs))
            pr_auc = float(average_precision_score(flat_targets, flat_probs))
    except ImportError:
        roc_auc = "sklearn_not_available"
        pr_auc = "sklearn_not_available"
    except Exception as e:
        roc_auc = f"error: {e}"

    return {
        "hazard": hazard_name,
        "total_pixels": total,
        "positive_pixels": pos_pixels,
        "negative_pixels": neg_pixels,
        "evaluation_valid": True,
        "hits": hits,
        "misses": misses,
        "false_alarms": false_alarms,
        "correct_negatives": correct_neg,
        "csi": round(float(csi), 4),
        "pod": round(float(pod), 4),
        "far": round(float(far), 4),
        "precision": round(float(precision), 4),
        "recall": round(float(pod), 4),
        "f1": round(float(f1), 4),
        "accuracy": round(float(accuracy), 4),
        "brier_score": round(float(brier), 6),
        "roc_auc": round(roc_auc, 4) if isinstance(roc_auc, float) else roc_auc,
        "pr_auc": round(pr_auc, 4) if isinstance(pr_auc, float) else pr_auc,
    }


def load_model(checkpoint_path: Path, device: torch.device):
    """Load V2 model from checkpoint."""
    from src.models.vayunet_model import VayunetMTLModel
    model = VayunetMTLModel(
        img_size=32, patch_size=4, in_channels=12,
        num_frames=4, embed_dim=128, depth=4, num_heads=8
    )
    checkpoint = torch.load(checkpoint_path, map_location=device, weights_only=False)
    if "model_state_dict" in checkpoint:
        model.load_state_dict(checkpoint["model_state_dict"])
    else:
        model.load_state_dict(checkpoint)
    model.to(device)
    model.eval()
    logger.info("Model loaded from: %s", checkpoint_path)
    return model


def run_inference(model, x_tensor: torch.Tensor, device: torch.device, batch_size: int = 16):
    """Run model inference in batches, return probabilities."""
    all_probs = {"thunderstorm": [], "cloudburst": [], "flash_flood": []}
    n = x_tensor.shape[0]

    with torch.no_grad():
        for i in range(0, n, batch_size):
            batch = x_tensor[i:i + batch_size].to(device)
            out = model(batch)
            for hazard in ["thunderstorm", "cloudburst", "flash_flood"]:
                prob = torch.sigmoid(out[hazard]).cpu()
                all_probs[hazard].append(prob)

    return {h: torch.cat(v, dim=0).numpy() for h, v in all_probs.items()}


def measure_inference_latency(model, device: torch.device, n_runs: int = 50) -> float:
    """Measure mean inference latency in milliseconds."""
    dummy = torch.randn(1, 4, 12, 32, 32).to(device)
    latencies = []
    with torch.no_grad():
        for _ in range(n_runs):
            t0 = time.perf_counter()
            _ = model(dummy)
            t1 = time.perf_counter()
            latencies.append((t1 - t0) * 1000)  # ms
    return float(np.mean(latencies[5:]))  # Drop warmup


def main():
    parser = argparse.ArgumentParser(description="VAYUNET V2 Baseline Evaluator")
    parser.add_argument("--split", default="test", choices=["train", "val", "test"])
    parser.add_argument("--threshold", type=float, default=0.5)
    parser.add_argument("--checkpoint", default="checkpoints/vayunet_mtl_best.pt")
    parser.add_argument("--processed-dir", default="data/processed", help="Path to processed dataset dir")
    parser.add_argument("--report-out", default="reports/v2_baseline.json", help="Path to save report JSON")
    args = parser.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info("Device: %s", device)

    # Load data
    processed_dir = PROJECT_ROOT / args.processed_dir
    # Support both V2 naming (vayunet_tensors_test.pt) and V3 naming (test.pt)
    pt_path_v2 = processed_dir / f"vayunet_tensors_{args.split}.pt"
    pt_path_v3 = processed_dir / f"{args.split}.pt"
    
    if pt_path_v3.exists():
        pt_path = pt_path_v3
    elif pt_path_v2.exists():
        pt_path = pt_path_v2
    else:
        logger.error("Dataset not found at %s or %s", pt_path_v3, pt_path_v2)
        sys.exit(1)
        
    logger.info("Loading %s split from: %s", args.split, pt_path)
    data = torch.load(pt_path, map_location="cpu", weights_only=False)
    x = data["x"]  # (B, T, C, H, W)
    y = data["y"]  # {hazard: (B, 1, H, W)}
    logger.info("Split shape: x=%s", x.shape)

    # Class balance audit
    class_balance = {}
    for hazard in ["thunderstorm", "cloudburst", "flash_flood"]:
        label = y[hazard]
        pos = int((label > 0.5).sum().item())
        neg = label.numel() - pos
        class_balance[hazard] = {
            "positive_pixels": pos,
            "negative_pixels": neg,
            "positive_pct": round(pos / max(1, label.numel()) * 100, 3),
        }
        logger.info("[%s] positives=%d (%.2f%%)", hazard, pos, class_balance[hazard]["positive_pct"])

    # Load model
    ckpt = PROJECT_ROOT / args.checkpoint
    if not ckpt.exists():
        logger.error("Checkpoint not found: %s", ckpt)
        sys.exit(1)

    model = load_model(ckpt, device)

    # Count parameters
    n_params = sum(p.numel() for p in model.parameters())
    logger.info("Model parameters: %d (%.2f M)", n_params, n_params / 1e6)

    # Inference latency
    logger.info("Measuring inference latency...")
    latency_ms = measure_inference_latency(model, device)
    logger.info("Mean inference latency: %.2f ms", latency_ms)

    # Run predictions
    logger.info("Running inference on %d samples...", x.shape[0])
    t0 = time.perf_counter()
    probs = run_inference(model, x, device)
    elapsed = time.perf_counter() - t0
    logger.info("Inference complete in %.2f s", elapsed)

    # Compute metrics per hazard
    results = {}
    for hazard in ["thunderstorm", "cloudburst", "flash_flood"]:
        preds_prob = probs[hazard]  # (B, 1, H, W)
        preds_binary = (preds_prob >= args.threshold).astype(np.float32)
        targets = y[hazard].numpy()  # (B, 1, H, W)

        metrics = compute_binary_metrics(
            preds_binary.squeeze(1).flatten(),
            targets.squeeze(1).flatten(),
            preds_prob.squeeze(1).flatten(),
            hazard
        )
        results[hazard] = metrics
        logger.info("[%s] CSI=%s POD=%s FAR=%s F1=%s", hazard, metrics["csi"], metrics["pod"], metrics["far"], metrics["f1"])

    # Compile full report
    report = {
        "model_version": "VAYUNET-MTL-v2.0",
        "evaluated_at": datetime.now().isoformat(),
        "split": args.split,
        "threshold": args.threshold,
        "checkpoint": str(ckpt),
        "device": str(device),
        "n_samples": x.shape[0],
        "n_parameters": n_params,
        "n_parameters_M": round(n_params / 1e6, 3),
        "mean_inference_latency_ms": round(latency_ms, 2),
        "class_balance": class_balance,
        "metrics": results,
        "known_issues": {
            "cloudburst": "Zero positive pixels in test set. All cloudburst metrics are NOT_MEANINGFUL.",
            "flash_flood": "Flash flood mask is STATIC across all test samples (158 px per sample identical). CSI=1.0 is artifact of static label, not genuine detection capability.",
            "thunderstorm": "Metric may be inflated — thunderstorm label uses TIR input as label criterion (potential circularity).",
        },
        "data_integrity_failures": [
            "cloudburst: 0 positive pixels in test set",
            "flash_flood: identical label mask across all 69 test samples (static terrain label)",
            "Ch2 (CTT rate), Ch6 (shear), Ch8 (moisture flux): broadcast constants in input tensor",
        ],
    }

    # Save
    out_path = args.report_out
    print(f"Report: {args.report_out}")

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, default=str)
    logger.info("V2 baseline report saved: %s", out_path)

    # Print summary
    print("\n" + "="*60)
    print("V2 BASELINE EVALUATION SUMMARY")
    print("="*60)
    print(f"Split: {args.split} | Samples: {x.shape[0]}")
    print(f"Latency: {latency_ms:.2f} ms/sample")
    print(f"\n{'Hazard':<15} {'CSI':>8} {'POD':>8} {'FAR':>8} {'F1':>8} {'Valid':>8}")
    print("-" * 60)
    for hazard, m in results.items():
        csi = m.get("csi", "N/A")
        pod = m.get("pod", "N/A")
        far = m.get("far", "N/A")
        f1  = m.get("f1", "N/A")
        valid = "YES" if m.get("evaluation_valid") else "NO - 0 pos"
        print(f"{hazard:<15} {str(csi):>8} {str(pod):>8} {str(far):>8} {str(f1):>8} {valid:>8}")
    print()
    print("WARNING: See known_issues in report for metric validity caveats.")
    print(f"Report: {out_path}")


if __name__ == "__main__":
    main()
