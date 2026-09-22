# VAYUNET V3 Architecture Documentation

## Model Overview

**Version**: VAYUNET-MTL-v3.0  
**Type**: Multi-Modal Spatiotemporal Transformer — Multi-Task Learning  
**Input**: `(B, T=4, C=12, H=32, W=32)`  
**Output**: Per-hazard 32×32 probability grids + global latent for attribution

---

## Architecture Diagram

```
INPUT: (B, T=4, C=12, H=32, W=32)
  │
  │  ┌─ Ch 0-2: Himawari-8 WV/TIR/CTT (satellite)
  │  ├─ Ch 3-8: IMDAA Atmospheric (CAPE, CIN, LCL, Shear, IWV, MFC)
  │  └─ Ch 9-11: CartoDEM Terrain (Elevation, Slope, Flow)
  │
  ▼
SpatiotemporalPatchEmbed
  ├─ Patch size: 4×4 → 8×8 = 64 patches per frame
  ├─ Temporal positional encoding
  └─ Output: (B, T=4, 64, embed_dim=128)
  │
  ▼
MultiModalCrossAttentionFusion
  ├─ Query: current frame (t=T-1), (B, 64, 128)
  ├─ Key/Value: prior frames (t=0..T-2), (B, 192, 128)
  └─ Output: fused current state (B, 64, 128)
  │
  ▼
SpatiotemporalTransformerBackbone
  ├─ 4 transformer layers
  ├─ 8 attention heads
  ├─ MLP ratio: 2.0
  └─ Output: (B, T=4, 64, 128)
  │
  ▼ [extract latest frame]
  │
  ├─── ThunderstormHead ──► (B, 1, 32, 32) logits
  │     └─ ConvTranspose2d upsampling 8→32
  │
  ├─── CloudburstHead ────► (B, 1, 32, 32) logits
  │     └─ ConvTranspose2d upsampling 8→32
  │
  └─── FlashFloodHead ────► (B, 1, 32, 32) logits
        ├─ ConvTranspose2d upsampling 8→32
        ├─ Fused with cloudburst logits
        └─ Conditioned on topography (Ch 9-11)
```

---

## Parameter Count

| Component | Parameters |
|-----------|-----------|
| PatchEmbed | ~50K |
| CrossAttentionFusion | ~200K |
| TransformerBackbone (4 layers) | ~800K |
| ThunderstormHead | ~80K |
| CloudburstHead | ~80K |
| FlashFloodHead | ~90K |
| **Total** | **~1.3M** |

---

## Input Channels

| Ch | Name | Source | Status in V2 | Status in V3 |
|----|------|--------|-------------|-------------|
| 0 | WV 6.7µm | Himawari B08 | PARTIALLY_REAL | PARTIALLY_REAL |
| 1 | TIR 10.8µm | Himawari B13 | PARTIALLY_REAL | PARTIALLY_REAL |
| 2 | CTT drop rate | Derived B13 | **BROADCAST_CONSTANT** | **Computed from frames** |
| 3 | CAPE | IMDAA proxy | APPROXIMATE | APPROXIMATE |
| 4 | CIN | IMDAA proxy | APPROXIMATE | APPROXIMATE |
| 5 | LCL | IMDAA proxy | APPROXIMATE | APPROXIMATE |
| 6 | Wind shear | IMDAA proxy | **BROADCAST_CONSTANT** | IMPROVED (spatial) |
| 7 | IWV | IMDAA proxy | APPROXIMATE | APPROXIMATE |
| 8 | Moisture flux | IMDAA proxy | **BROADCAST_CONSTANT** | IMPROVED (spatial) |
| 9 | Elevation | CartoDEM (Wayanad) | REAL | REAL |
| 10 | Slope | Derived CartoDEM | REAL_DERIVED | REAL_DERIVED |
| 11 | Flow accumulation | Derived CartoDEM | REAL_DERIVED | REAL_DERIVED |

---

## Loss Function (V3)

**Focal Loss** per hazard:

```
FL(p, y) = -α * (1 - p_t)^γ * log(p_t)

where p_t = p if y=1, else (1-p)
      α = 0.75 (positive class weight)
      γ = 2.0 (focusing parameter)
```

**Multi-task combination**:
```
L_total = 1.0 × L_thunderstorm
        + 10.0 × L_cloudburst      ← high weight for rare class
        + 3.0 × L_flash_flood
```

**V2 used**: Standard BCE, equal weights (1:1:1)

---

## Multi-Horizon Forecasting

V3 outputs are **instantaneous** (for the lead time embedded in the input design):
- Input: T=4 frames at 3h cadence → 12h lookback
- Current prediction: approximates +1h ahead
- Multi-horizon (T+3h, T+6h) would require additional prediction heads or autoregressive rollout — **not yet implemented**

> [!IMPORTANT]
> True multi-horizon (+1h, +3h, +6h) prediction heads are planned for V3.1. The current V3 produces a single probability grid. API response documents this as `lead_time_forecasts.1h` with `3h` and `6h` marked as `PLANNED`.

---

## Calibration

Raw sigmoid outputs are not calibrated probabilities. After training:

1. Compute reliability diagram on validation set
2. Apply temperature scaling: `p_cal = sigmoid(logit / T)`
3. Optimize T on validation set
4. Save to `checkpoints/v3_calibration.json`

**Status**: Not yet implemented. Will be added after V3 training completes.

---

## XAI (Explainability)

**Current method**: Heuristic channel magnitude attribution
- Computes mean absolute activation per input channel
- Normalizes to percentage contributions
- **NOT**: Captum Integrated Gradients, SHAP, or any gradient-based method

**Label**: Must be presented as "Heuristic Channel Attribution" in all UI elements

**V3.1 planned**: Implement Captum Integrated Gradients for proper neural XAI

---

## Spatial Output

The 32×32 probability grids should be labeled in the UI as:

> **"AI Hazard Probability Grid (VAYUNET-MTL-v3)"**

NOT "Doppler Radar" or "Satellite Observation". These are model outputs.

---

## V3 vs V2 Summary

| Aspect | V2 | V3 |
|--------|----|----|
| Dataset | Aug 2018 Wayanad (real) | Aug 2018 Wayanad (corrected labels) |
| Cloudburst labels | Hard-coded Aug 15-18 filter | Continuous threshold |
| Flash flood labels | Static 158-pixel mask | Time-varying rain × terrain |
| CTT rate (Ch2) | Broadcast constant | Computed from frames |
| Loss | BCE (equal weights) | Focal (class-weighted) |
| Architecture | VayunetMTL | Same (V3 in data/training) |
| Checkpoint | `vayunet_mtl_best.pt` | `vayunet_mtl_v3_best.pt` |
