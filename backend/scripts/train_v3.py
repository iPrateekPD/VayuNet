"""
VAYUNET V3 Model Training Script
Phase 7: Train VayunetMTLModel on V3 dataset with corrected labels.

V3 training improvements vs V2:
- Uses V3 processed dataset (corrected labels)
- Focal loss for class imbalance
- Per-task loss weights configurable
- Mixed precision support (CUDA)
- Early stopping
- Full metric logging per epoch
- Explicit class balance check before training

Usage:
    python scripts/train_v3.py [--epochs 60] [--batch-size 8] [--lr 0.0003]

Produces:
    checkpoints/vayunet_mtl_v3_best.pt
    checkpoints/v3_model_metadata.json
"""

import json
import sys
import time
import logging
import argparse
from pathlib import Path
from datetime import datetime

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR
from torch.utils.data import DataLoader, TensorDataset

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("train_v3")


# ─── Focal Loss ──────────────────────────────────────────────────────────────

class FocalLoss(nn.Module):
    """
    Focal Loss for binary classification with class imbalance.
    FL(p) = -alpha * (1 - p)^gamma * log(p)
    """
    def __init__(self, gamma: float = 2.0, alpha: float = 0.75, reduction: str = "mean"):
        super().__init__()
        self.gamma = gamma
        self.alpha = alpha
        self.reduction = reduction

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        probs = torch.sigmoid(logits)
        bce = F.binary_cross_entropy_with_logits(logits, targets, reduction="none")
        p_t = probs * targets + (1 - probs) * (1 - targets)
        alpha_t = self.alpha * targets + (1 - self.alpha) * (1 - targets)
        focal_weight = alpha_t * (1 - p_t) ** self.gamma
        loss = focal_weight * bce
        if self.reduction == "mean":
            return loss.mean()
        elif self.reduction == "sum":
            return loss.sum()
        return loss


class V3MultiTaskLoss(nn.Module):
    """
    Multi-task focal loss with per-hazard weights.
    Weights should reflect class rarity: cloudburst > flash_flood > thunderstorm.
    """
    def __init__(self, weights: dict = None, gamma: float = 2.0, alpha: float = 0.75):
        super().__init__()
        self.weights = weights or {"thunderstorm": 1.0, "cloudburst": 10.0, "flash_flood": 3.0}
        self.focal = FocalLoss(gamma=gamma, alpha=alpha)

    def forward(self, predictions: dict, targets: dict) -> tuple:
        losses = {}
        total = 0.0
        for hazard, weight in self.weights.items():
            if hazard in predictions and hazard in targets:
                losses[hazard] = self.focal(predictions[hazard], targets[hazard])
                total = total + weight * losses[hazard]
        return total, losses


# ─── Metrics ─────────────────────────────────────────────────────────────────

def compute_csi(probs: torch.Tensor, targets: torch.Tensor, threshold: float = 0.5) -> dict:
    """Compute CSI, POD, FAR for a single hazard."""
    preds = (probs >= threshold).float()
    hits = ((preds == 1) & (targets > 0.5)).sum().item()
    misses = ((preds == 0) & (targets > 0.5)).sum().item()
    false_alarms = ((preds == 1) & (targets < 0.5)).sum().item()
    positives = int((targets > 0.5).sum())

    if positives == 0:
        return {"csi": "N/A", "pod": "N/A", "far": "N/A", "positives": 0}

    csi = hits / max(1, hits + misses + false_alarms)
    pod = hits / max(1, hits + misses)
    far = false_alarms / max(1, hits + false_alarms)
    return {"csi": round(csi, 4), "pod": round(pod, 4), "far": round(far, 4), "positives": positives}


# ─── Dataset Loading ─────────────────────────────────────────────────────────

def load_v3_dataset(processed_dir: Path, split: str):
    """Load V3 dataset from processed/v3/ directory."""
    pt = processed_dir / f"{split}.pt"
    if not pt.exists():
        logger.warning("V3 %s split not found at %s", split, pt)
        return None, None

    data = torch.load(pt, map_location="cpu", weights_only=False)
    x, y = data["x"], data["y"]

    for hazard in ["thunderstorm", "cloudburst", "flash_flood"]:
        pos = int((y[hazard] > 0.5).sum())
        total = y[hazard].numel()
        logger.info("  [%s/%s] positives=%d (%.2f%%)", split, hazard, pos, pos/max(1,total)*100)

    return x, y


def make_loader(x: torch.Tensor, y: dict, batch_size: int, shuffle: bool = True):
    """Create DataLoader from tensors."""
    dataset = TensorDataset(
        x,
        y["thunderstorm"],
        y["cloudburst"],
        y["flash_flood"],
    )
    return DataLoader(dataset, batch_size=batch_size, shuffle=shuffle, num_workers=0, pin_memory=False)


# ─── Training ────────────────────────────────────────────────────────────────

def train_one_epoch(model, loader, criterion, optimizer, device, use_amp=False):
    model.train()
    scaler = torch.cuda.amp.GradScaler(enabled=use_amp)
    total_loss = 0.0

    for batch in loader:
        x_b, ts_b, cb_b, ff_b = [t.to(device) for t in batch]
        targets = {"thunderstorm": ts_b, "cloudburst": cb_b, "flash_flood": ff_b}

        optimizer.zero_grad()
        with torch.cuda.amp.autocast(enabled=use_amp):
            preds = model(x_b)
            loss, breakdown = criterion(preds, targets)

        scaler.scale(loss).backward()
        scaler.unscale_(optimizer)
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        scaler.step(optimizer)
        scaler.update()
        total_loss += loss.item()

    return total_loss / max(1, len(loader))


@torch.no_grad()
def evaluate(model, loader, criterion, device, use_amp=False):
    model.eval()
    total_loss = 0.0
    all_probs = {"thunderstorm": [], "cloudburst": [], "flash_flood": []}
    all_targets = {"thunderstorm": [], "cloudburst": [], "flash_flood": []}

    for batch in loader:
        x_b, ts_b, cb_b, ff_b = [t.to(device) for t in batch]
        targets = {"thunderstorm": ts_b, "cloudburst": cb_b, "flash_flood": ff_b}

        with torch.cuda.amp.autocast(enabled=use_amp):
            preds = model(x_b)
            loss, _ = criterion(preds, targets)

        total_loss += loss.item()
        for h in all_probs:
            all_probs[h].append(torch.sigmoid(preds[h]).cpu())
            all_targets[h].append(targets[h].cpu())

    metrics = {}
    for h in all_probs:
        probs_cat = torch.cat(all_probs[h])
        targs_cat = torch.cat(all_targets[h])
        metrics[h] = compute_csi(probs_cat, targs_cat)

    return total_loss / max(1, len(loader)), metrics


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=int, default=60)
    parser.add_argument("--batch-size", type=int, default=8)
    parser.add_argument("--lr", type=float, default=3e-4)
    parser.add_argument("--weight-decay", type=float, default=0.01)
    parser.add_argument("--patience", type=int, default=15)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--processed-dir", default="data/processed/v3")
    parser.add_argument("--checkpoint-out", default="checkpoints/vayunet_mtl_v3_best.pt")
    args = parser.parse_args()

    # Reproducibility
    torch.manual_seed(args.seed)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    use_amp = device.type == "cuda"
    logger.info("Device: %s | AMP: %s", device, use_amp)

    # Load datasets
    processed_dir = PROJECT_ROOT / args.processed_dir
    logger.info("Loading V3 datasets from: %s", processed_dir)

    x_tr, y_tr = load_v3_dataset(processed_dir, "train")
    x_va, y_va = load_v3_dataset(processed_dir, "val")

    if x_tr is None:
        logger.error("V3 train split not found. Run 'prepare' stage first.")
        sys.exit(1)

    # Check class balance — warn but do not abort (training is still possible)
    for hazard in ["thunderstorm", "cloudburst", "flash_flood"]:
        pos = int((y_tr[hazard] > 0.5).sum())
        if pos == 0:
            logger.warning("[%s] Zero positive pixels in training set. Loss will not converge.", hazard)

    # Build data loaders
    train_loader = make_loader(x_tr, y_tr, args.batch_size, shuffle=True)
    val_loader = make_loader(x_va, y_va, args.batch_size, shuffle=False) if x_va is not None else None

    # Model (same architecture as V2 — V3 flag is in metadata)
    from src.models.vayunet_model import VayunetMTLModel
    model = VayunetMTLModel(
        img_size=32, patch_size=4, in_channels=12,
        num_frames=4, embed_dim=128, depth=4, num_heads=8
    ).to(device)
    n_params = sum(p.numel() for p in model.parameters())
    logger.info("Model: %d params (%.2fM)", n_params, n_params / 1e6)

    criterion = V3MultiTaskLoss(
        weights={"thunderstorm": 1.0, "cloudburst": 10.0, "flash_flood": 3.0},
        gamma=2.0,
        alpha=0.75
    )
    optimizer = AdamW(model.parameters(), lr=args.lr, weight_decay=args.weight_decay)
    scheduler = CosineAnnealingLR(optimizer, T_max=args.epochs)

    # Training loop
    best_val_loss = float("inf")
    patience_counter = 0
    train_log = []
    best_epoch = 0

    ckpt_path = PROJECT_ROOT / args.checkpoint_out

    logger.info("Starting V3 training for %d epochs...", args.epochs)
    for epoch in range(1, args.epochs + 1):
        t0 = time.perf_counter()
        train_loss = train_one_epoch(model, train_loader, criterion, optimizer, device, use_amp)
        elapsed = time.perf_counter() - t0

        val_loss = None
        val_metrics = {}
        if val_loader is not None:
            val_loss, val_metrics = evaluate(model, val_loader, criterion, device, use_amp)

        scheduler.step()
        log = {
            "epoch": epoch,
            "train_loss": round(train_loss, 6),
            "val_loss": round(val_loss, 6) if val_loss else None,
            "val_metrics": val_metrics,
            "elapsed_s": round(elapsed, 2),
        }
        train_log.append(log)

        # Progress
        metrics_str = " | ".join(
            f"{h[:2]}:CSI={m.get('csi','N/A')}" for h, m in val_metrics.items()
        ) if val_metrics else ""
        logger.info(
            "Ep %3d/%d | Train=%.4f | Val=%.4f | %s | %.1fs",
            epoch, args.epochs, train_loss,
            val_loss or 0.0, metrics_str, elapsed
        )

        # Best model checkpoint
        cmp_loss = val_loss if val_loss is not None else train_loss
        if cmp_loss < best_val_loss:
            best_val_loss = cmp_loss
            best_epoch = epoch
            patience_counter = 0
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "val_loss": cmp_loss,
                "val_metrics": val_metrics,
                "train_log": train_log,
            }, ckpt_path)
            logger.info("  -> Best checkpoint saved (val_loss=%.4f)", cmp_loss)
        else:
            patience_counter += 1
            if patience_counter >= args.patience:
                logger.info("Early stopping at epoch %d (no improvement for %d epochs)", epoch, args.patience)
                break

    logger.info("Training complete. Best epoch: %d | Best val_loss: %.4f", best_epoch, best_val_loss)

    # Save model metadata
    meta = {
        "model_version": "VAYUNET-MTL-v3.0",
        "trained_at": datetime.now().isoformat(),
        "dataset_version": "v3",
        "training_config": {
            "epochs_requested": args.epochs,
            "epochs_trained": len(train_log),
            "best_epoch": best_epoch,
            "batch_size": args.batch_size,
            "lr": args.lr,
            "weight_decay": args.weight_decay,
            "optimizer": "AdamW",
            "scheduler": "CosineAnnealingLR",
            "loss": "FocalLoss(gamma=2.0, alpha=0.75)",
            "loss_weights": {"thunderstorm": 1.0, "cloudburst": 10.0, "flash_flood": 3.0},
            "seed": args.seed,
        },
        "model_config": {
            "img_size": 32,
            "patch_size": 4,
            "in_channels": 12,
            "num_frames": 4,
            "embed_dim": 128,
            "depth": 4,
            "num_heads": 8,
            "n_parameters": n_params,
        },
        "best_val_metrics": train_log[best_epoch - 1]["val_metrics"] if train_log else {},
        "best_val_loss": best_val_loss,
        "train_log": train_log,
        "v3_fixes_vs_v2": [
            "Cloudburst labels: date filter removed",
            "Flash flood labels: time-varying rain component",
            "Loss: focal loss with class weights (was BCE in V2)",
            "Optimizer: same AdamW",
        ],
        "v3_limitations": [
            "Himawari HSD decode: satpy not available; partial manual decode",
            "Cloudburst positives may still be sparse",
            "Dataset size: ~191 samples (same as V2 due to same Himawari timestamps)",
        ],
        "checkpoint_path": str(ckpt_path),
    }

    meta_path = PROJECT_ROOT / "checkpoints" / "v3_model_metadata.json"
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2, default=str)
    logger.info("Metadata saved: %s", meta_path)


if __name__ == "__main__":
    main()
