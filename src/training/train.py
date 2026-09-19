"""
VAYUNET Model Training Pipeline (SIH 26077)
Executes end-to-end training of the Multi-Modal Spatiotemporal Transformer
with Multi-Task Focal Loss and Topographic Regularization on Apple Silicon (MPS), CUDA, or CPU.
"""

import os
import sys
import time
import argparse
from pathlib import Path

# Ensure project root is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import torch
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR

from src.models.vayunet_model import VayunetMTLModel
from src.models.loss import VayunetMultiTaskLoss
from src.training.dataset import create_dataloaders
from src.evaluation.metrics import calculate_nowcast_metrics


def select_optimal_device(requested_device: str = "auto") -> torch.device:
    """
    Selects the best available hardware accelerator:
    1. Apple Silicon MPS (Metal Performance Shaders)
    2. NVIDIA CUDA
    3. CPU fallback
    """
    if requested_device != "auto":
        return torch.device(requested_device)
    
    if torch.backends.mps.is_available():
        return torch.device("mps")
    elif torch.cuda.is_available():
        return torch.device("cuda")
    else:
        return torch.device("cpu")


def train_epoch(
    model: torch.nn.Module,
    loader: torch.utils.data.DataLoader,
    criterion: VayunetMultiTaskLoss,
    optimizer: torch.optim.Optimizer,
    device: torch.device
) -> float:
    """
    Runs one complete training epoch.
    """
    model.train()
    total_epoch_loss = 0.0

    for batch_idx, (x, targets) in enumerate(loader):
        x = x.to(device)
        targets = {k: v.to(device) for k, v in targets.items()}
        elevation = x[:, -1, 9:10, :, :]  # CartoDEM elevation channel

        optimizer.zero_grad()
        predictions = model(x)
        
        loss, loss_breakdown = criterion(predictions, targets, elevation)
        loss.backward()

        # Gradient clipping to prevent exploding gradients during deep temporal attention
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        optimizer.step()

        total_epoch_loss += loss.item()

    return total_epoch_loss / max(1, len(loader))


def evaluate_epoch(
    model: torch.nn.Module,
    loader: torch.utils.data.DataLoader,
    criterion: VayunetMultiTaskLoss,
    device: torch.device
) -> dict:
    """
    Evaluates model across validation set and computes CSI, POD, FAR metrics.
    """
    model.eval()
    total_val_loss = 0.0
    all_preds = {"thunderstorm": [], "cloudburst": [], "flash_flood": []}
    all_targets = {"thunderstorm": [], "cloudburst": [], "flash_flood": []}

    with torch.no_grad():
        for x, targets in loader:
            x = x.to(device)
            targets_gpu = {k: v.to(device) for k, v in targets.items()}
            elevation = x[:, -1, 9:10, :, :]

            predictions = model(x)
            loss, _ = criterion(predictions, targets_gpu, elevation)
            total_val_loss += loss.item()

            for k in all_preds.keys():
                probs = torch.sigmoid(predictions[k]).cpu()
                all_preds[k].append(probs)
                all_targets[k].append(targets[k])

    avg_val_loss = total_val_loss / max(1, len(loader))

    # Aggregate and compute metrics
    metrics = {"val_loss": avg_val_loss}
    for hazard in all_preds.keys():
        cat_preds = torch.cat(all_preds[hazard], dim=0)
        cat_targets = torch.cat(all_targets[hazard], dim=0)
        h_metrics = calculate_nowcast_metrics(cat_preds, cat_targets, threshold=0.5)
        for m_name, m_val in h_metrics.items():
            metrics[f"{hazard}_{m_name}"] = m_val

    return metrics


def run_training(
    epochs: int = 5,
    batch_size: int = 8,
    lr: float = 3e-4,
    device_name: str = "auto",
    save_dir: str = "checkpoints",
    fast_dev_run: bool = False
):
    device = select_optimal_device(device_name)
    print(f"🚀 [VAYUNET] Initializing AI Model Training on device: {device}")

    # Set sample counts based on dev run flag
    train_samples = 40 if fast_dev_run else 240
    val_samples = 12 if fast_dev_run else 48
    num_epochs = 2 if fast_dev_run else epochs

    train_loader, val_loader = create_dataloaders(
        batch_size=batch_size,
        train_samples=train_samples,
        val_samples=val_samples
    )

    print(f"📦 [Data] Train Batches: {len(train_loader)} ({train_samples} samples) | Val Batches: {len(val_loader)} ({val_samples} samples)")

    # Model instantiation
    model = VayunetMTLModel(
        img_size=32,
        patch_size=4,
        in_channels=12,
        num_frames=4,
        embed_dim=128,
        depth=4,
        num_heads=8,
        mlp_ratio=2.0,
        dropout=0.1
    ).to(device)

    total_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"[Model] VAYUNET Spatiotemporal MTL Transformer initialized. Trainable Parameters: {total_params:,}")

    criterion = VayunetMultiTaskLoss(
        weight_thunderstorm=1.0,
        weight_cloudburst=2.5,
        weight_flash_flood=1.5,
        weight_hydro_reg=0.5
    ).to(device)

    optimizer = AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = CosineAnnealingLR(optimizer, T_max=num_epochs, eta_min=1e-6)

    os.makedirs(save_dir, exist_ok=True)
    best_val_loss = float("inf")
    best_checkpoint_path = os.path.join(save_dir, "vayunet_mtl_best.pt")
    metadata_path = os.path.join(save_dir, "model_metadata.json")

    start_time = time.time()
    for epoch in range(1, num_epochs + 1):
        ep_start = time.time()
        train_loss = train_epoch(model, train_loader, criterion, optimizer, device)
        val_metrics = evaluate_epoch(model, val_loader, criterion, device)
        scheduler.step()

        val_loss = val_metrics["val_loss"]
        cb_csi = val_metrics.get("cloudburst_csi", 0.0)
        cb_pod = val_metrics.get("cloudburst_pod", 0.0)
        ff_csi = val_metrics.get("flash_flood_csi", 0.0)

        ep_duration = time.time() - ep_start
        print(
            f"Epoch [{epoch:02d}/{num_epochs:02d}] ({ep_duration:.1f}s) - "
            f"Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f} | "
            f"Cloudburst [CSI: {cb_csi:.2f}, POD: {cb_pod:.2f}] | Flood [CSI: {ff_csi:.2f}]"
        )

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "val_loss": best_val_loss,
                "metrics": val_metrics,
                "model_config": {
                    "img_size": 32,
                    "patch_size": 4,
                    "in_channels": 12,
                    "num_frames": 4,
                    "embed_dim": 128,
                    "depth": 4,
                    "num_heads": 8
                }
            }, best_checkpoint_path)
            print(f"   [OK] Saved new best checkpoint to: {best_checkpoint_path}")

            # Export model metadata
            import json
            metadata = {
                "model_version": "VAYUNET-MTL-v2.0",
                "trained_epoch": epoch,
                "target_img_size": 32,
                "val_loss": best_val_loss,
                "metrics": val_metrics
            }
            with open(metadata_path, "w", encoding="utf-8") as f:
                json.dump(metadata, f, indent=2)

    total_time = time.time() - start_time
    print(f"\n[OK] [VAYUNET] Training completed in {total_time:.1f}s. Best Val Loss: {best_val_loss:.4f}")
    return best_checkpoint_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train VAYUNET AI Model")
    parser.add_argument("--epochs", type=int, default=5, help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=8, help="Batch size")
    parser.add_argument("--lr", type=float, default=3e-4, help="Learning rate")
    parser.add_argument("--device", type=str, default="auto", help="Device (mps, cuda, cpu, auto)")
    parser.add_argument("--save_dir", type=str, default="checkpoints", help="Directory to save checkpoints")
    parser.add_argument("--fast_dev_run", action="store_true", help="Quick run for pipeline verification")
    args = parser.parse_args()

    run_training(
        epochs=args.epochs,
        batch_size=args.batch_size,
        lr=args.lr,
        device_name=args.device,
        save_dir=args.save_dir,
        fast_dev_run=args.fast_dev_run
    )
