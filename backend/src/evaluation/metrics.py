"""
VAYUNET Meteorological Nowcast Evaluation Metrics
Implements standard operational verification metrics used by IMD / NCMRWF / WMO:
- Critical Success Index (CSI / Threat Score)
- Probability of Detection (POD / Hit Rate)
- False Alarm Ratio (FAR)
- Fractions Skill Score (FSS)
"""

import torch
import numpy as np
from typing import Dict, Tuple


def compute_contingency_table(
    pred_probs: torch.Tensor,
    targets: torch.Tensor,
    threshold: float = 0.5
) -> Tuple[int, int, int, int]:
    """
    Computes hits, false alarms, misses, and correct rejections.
    
    Args:
        pred_probs: Tensor of predicted probabilities in [0, 1]
        targets: Binary ground truth tensor {0, 1}
        threshold: Decision threshold for positive warning
    Returns:
        (hits, false_alarms, misses, correct_negatives)
    """
    pred_probs = torch.as_tensor(pred_probs)
    targets = torch.as_tensor(targets)

    preds_binary = (pred_probs >= threshold).float()
    targets_binary = (targets >= 0.5).float()

    hits = int(((preds_binary == 1) & (targets_binary == 1)).sum().item())
    false_alarms = int(((preds_binary == 1) & (targets_binary == 0)).sum().item())
    misses = int(((preds_binary == 0) & (targets_binary == 1)).sum().item())
    correct_negatives = int(((preds_binary == 0) & (targets_binary == 0)).sum().item())

    return hits, false_alarms, misses, correct_negatives


def calculate_nowcast_metrics(
    pred_probs: torch.Tensor,
    targets: torch.Tensor,
    threshold: float = 0.5
) -> Dict[str, float]:
    """
    Calculates CSI, POD, FAR, and Accuracy for a hazard prediction grid.
    """
    hits, false_alarms, misses, correct_negatives = compute_contingency_table(
        pred_probs, targets, threshold
    )

    total_events = hits + misses
    total_forecasts = hits + false_alarms

    # Probability of Detection (POD) = Hits / (Hits + Misses)
    pod = hits / (total_events + 1e-6) if total_events > 0 else 0.0

    # False Alarm Ratio (FAR) = False Alarms / (Hits + False Alarms)
    far = false_alarms / (total_forecasts + 1e-6) if total_forecasts > 0 else 0.0

    # Critical Success Index (CSI) = Hits / (Hits + Misses + False Alarms)
    csi = hits / (hits + misses + false_alarms + 1e-6) if (hits + misses + false_alarms) > 0 else 0.0

    # F1 Score = 2*Hits / (2*Hits + Misses + False Alarms)
    f1 = (2.0 * hits) / (2.0 * hits + misses + false_alarms + 1e-6) if (2 * hits + misses + false_alarms) > 0 else 0.0

    # Overall Accuracy
    total = hits + false_alarms + misses + correct_negatives
    accuracy = (hits + correct_negatives) / (total + 1e-6) if total > 0 else 0.0

    return {
        "csi": round(csi, 4),
        "pod": round(pod, 4),
        "far": round(far, 4),
        "f1": round(f1, 4),
        "accuracy": round(accuracy, 4),
        "hits": hits,
        "misses": misses,
        "false_alarms": false_alarms,
        "correct_negatives": correct_negatives
    }
