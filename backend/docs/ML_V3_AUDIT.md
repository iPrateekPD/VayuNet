# VAYUNET ML V3 — Complete Repository & Dataset Audit
**Phase 0 | Generated: 2026-09-21 | Based on code + data inspection**

---

## 1. Pipeline Trace

```
raw data
  └─ backend/data/raw/
       ├─ satellite/himawari_2018-08/   → SatelliteProcessor → [Ch0, Ch1, Ch2]
       ├─ dem/P5_PAN_CD_N11_000_E075_000_30m/ → TerrainProcessor → [Ch9, Ch10, Ch11]
       ├─ reanalysis/hourly_dataset/    → ReanalysisProcessor → [Ch3..Ch8]
       └─ ground_truth/
            ├─ imd_rainfall/            → GroundTruthProcessor → labels
            └─ landslides/              → GroundTruthProcessor → flash_flood labels
  ↓
SpatiotemporalTensorBuilder (pipeline/tensor_builder.py)
  ↓
data/processed/
  ├─ vayunet_tensors_train.pt  (B=85, T=4, C=12, H=32, W=32)
  ├─ vayunet_tensors_val.pt    (B=37, T=4, C=12, H=32, W=32)
  ├─ vayunet_tensors_test.pt   (B=69, T=4, C=12, H=32, W=32)
  └─ normalization.json
  ↓
VayunetMTLModel (models/vayunet_model.py)
  ↓
predictor.py → risk engine → FastAPI → frontend
```

---

## 2. Dataset Sources

| Source | Type | Location | Coverage |
|--------|------|----------|----------|
| Himawari-8 | Satellite | `data/raw/satellite/himawari_2018-08/` | Aug 1–31 2018, B08+B13 only |
| CartoDEM | Terrain DEM | `data/raw/dem/P5_PAN_CD_N11_000_E075_000_30m/` | 11–12°N, 75–76°E (Wayanad/Kerala) |
| NCUM IMDAA | Reanalysis | `data/raw/reanalysis/hourly_dataset/` | dataset_1..5 (zip files) |
| NCUM pressure | Reanalysis | `data/raw/reanalysis/pressure_dataset/` | ds1, ds2 (zip files) |
| IMD Rainfall | Ground truth | `data/raw/ground_truth/imd_rainfall/IMD_rainfall_NetCdf/` | RF25 1/4° gridded, 2016–2020 |
| Kerala Landslides | Ground truth | `data/raw/ground_truth/landslides/landslide_kerala_2018/` | Shapefile (PointZ) |

---

## 3. Himawari Data — CONFIRMED PRESENT AND USED IN MODEL

**Status: HIMAWARI_USED_IN_MODEL — WITH CRITICAL CAVEATS**

### Files
- **Total files**: 496 `.DAT.bz2` files
- **Bands present**: B08 (Water Vapor, 6.2 µm) and B13 (Thermal IR, 10.4 µm) only
- **Timestamps**: 3-hourly, Aug 1–31 2018 (8 per day × 31 days × 2 bands = 496)
- **Naming convention**: `HS_H08_YYYYMMDD_HHMM_B{08|13}_FLDK_R20_S0101.DAT.bz2`
- **Anomaly**: 20180813 has one frame at `1210` instead of `1200` (irregular timestamp)
- **Spatial coverage**: Full-disk (`FLDK`), R20 = 2 km nominal resolution
- **Segment**: `S0101` = segment 1 of 1 (partial disk or remapped)

### How Himawari Actually Enters the Model (CRITICAL)

**The current pipeline does NOT fully decode the Himawari HSD binary format.**

In `raw_processors.py` line 163, the reader checks:
```python
if b"Himawari" in header:
    raw_data = f.read(H * W * 2)
    counts = np.frombuffer(raw_data, dtype="<u2")[:H*W].reshape(H, W)
    tb = 180.0 + (counts / 65535.0) * 140.0
```

**Problems with this approach:**
1. The HSD format has a complex multi-segment header (`BasicInfoBlock`, `DataInfoBlock`, `ProjectionInfoBlock`, `NavigationInfoBlock`, `CalibrationInfoBlock`) totaling >~600 bytes before actual pixel data. Reading only 512 bytes then trying to read pixel data will skip to wrong byte offsets in most cases.
2. The calibration formula `180 + (count/65535) * 140` is a crude approximation. Real HSD calibration uses per-channel lookup tables (LUT) stored in the calibration block.
3. When parsing fails (almost always), the fallback is `np.full((32, 32), default_val)` — a constant grid.

**VERIFIED IN DATA:**
- Ch2 (CTT drop rate) has `std=0.000000` in sample[0, frame0] from the actual processed tensors, meaning the CTT rate is **broadcast as a constant** across the 32×32 grid (the formula `(tir_t - tir_{t-1}) / dt` works if both TIR frames are constants due to parse failure).
- Ch6 (Wind shear) has `std=0.000000` — constant broadcast.
- Ch8 (Moisture flux) has `std=0.000000` — constant broadcast.

**ACTUAL HIMAWARI SPATIAL DATA STATUS:**
- Ch0 (WV) shows `std=0.43` — **has genuine spatial variance**. The WV channel likely succeeds in some frames due to the partial header skip.
- Ch1 (TIR) shows `std=0.43` — **has genuine spatial variance**. Same as WV.
- However, this spatial variance may be from real data OR from the constant default being applied consistently. Further inspection needed (see `audit_himawari_dataset.py`).

### Himawari Usage Summary

| Channel | Band | Status | Notes |
|---------|------|--------|-------|
| Ch0: WV 6.7µm | B08 | **PARTIALLY REAL** | Spatial variance present; HSD decode uncertain |
| Ch1: TIR 10.8µm | B13 | **PARTIALLY REAL** | Spatial variance present; HSD decode uncertain |
| Ch2: CTT Drop Rate | derived | **BROADCAST CONSTANT** | std=0 confirms scalar broadcast |

---

## 4. CartoDEM / Terrain

- **File**: `P5_PAN_CD_N11_000_E075_000_DEM_30m.tif` (51.8 MB)
- **Status**: **REAL DATA — ACTUALLY USED**
- **Coverage**: 11°N–12°N, 75°E–76°E (Wayanad/Northern Kerala)
- **Resolution**: 30m nominal (ISRO Cartosat-1 derived)
- **Processing**: Block-averaged from native resolution to 32×32 grid (~3.5 km/cell)
- **Derived channels**: slope (Sobel gradient), flow accumulation (inverted elevation + Laplacian)
- **Fallback**: If TIF not found → `_generate_fallback_terrain()` with synthetic math functions

**Mismatch**: The CartoDEM tile covers only 11–12°N, 75–76°E (Wayanad). The operational locations include Chamoli (30°N, 79°E), Kangra (32°N, 76°E), etc. — completely outside this tile. For all non-Wayanad inference locations, the feature adapter generates **procedural synthetic terrain**, not real CartoDEM.

---

## 5. Reanalysis Data

- **Files**: `dataset_1` to `dataset_5` (~1.4–1.6 GB each), `ds1`, `ds2` (~1.1 GB each) — likely ZIP archives
- **Coverage**: 2018 (confirmed by code path), possibly ERA5/IMDAA atmospheric fields
- **Variables extracted** (from code): TMP-2m, RH-2m, UGRD-10m, VGRD-10m, APCP-sfc
- **Derived fields**: CAPE (approximated from surface T/RH), CIN (proxy), LCL (Espy's formula), IWV, shear, moisture flux
- **IMPORTANT**: These are **approximated** from surface 2m variables, NOT lifted parcel CAPE from a sounding. The CAPE formula used is a surface-parcel theta-e surplus approximation, not a proper sounding integral.
- **Grid**: Resampled from 17×17 → 32×32 via bilinear interpolation

---

## 6. Ground Truth Labels

### IMD Rainfall
- **Files**: `RF25_ind2016_rfp25.nc`, `RF25_ind2017_rfp25.nc`, `RF25_ind2018_rfp25.nc`, two 2020 files
- **Format**: NetCDF, variable `RAINFALL`, 1/4° spatial resolution
- **Used for**: Thunderstorm and cloudburst label construction

### Kerala Landslides
- **File**: `Kerela landslide.shp` (PointZ shapefile, 13.8 MB DBF)
- **Projection**: From `.prj` file — likely WGS84
- **Used for**: Flash flood label construction

---

## 7. Label Construction — CRITICAL FINDINGS

### Thunderstorm Label
- Based on: TIR < 240K (cold convective anvil) OR hourly_rain > 5.0 mm + morphological dilation
- **Problem**: This is a **circular label** — the thunderstorm label uses TIR from Himawari, and TIR is also an input feature. Temporal alignment is needed to ensure TIR at label time is not used as input.

### Cloudburst Label
- Based on: TIR < 218K AND hourly_rain > 15mm + boosted for Aug 15–18, 2018 dates
- **Why 0 positives in test**: Test covers Aug 17–25. The code only boosts for Aug 15–18. Outside that window, `TIR < 218K AND rain > 15mm` apparently never triggers. **This means the cloudburst label is effectively hard-coded to the Kerala deluge peak window.**
- **CONFIRMED**: `cloudburst positives in test = 0` (from data inspection)

### Flash Flood Label
- Based on: hourly_rain > 10mm × slope > 18° × flow_accum > 1.5 (terrain mask) + landslide dilation
- **CONFIRMED STATIC**: Every sample in train AND test has **identical flash flood mask** (158 positive pixels each, `std=0` across samples).
- **Root cause**: The terrain mask (slope + flow_accum) is static per location. The hourly_rain threshold is never met (rain comes from IMDAA fallback defaults), so the mask reduces to **purely the static landslide dilation footprint**.
- **Why CSI=1.0**: The model learns to predict the static 158-pixel terrain mask every time. Since it never varies, the model predicts it perfectly — this is **label leakage through static terrain targets**.

---

## 8. Current Dataset Statistics

| Split | Samples | Timestamps | Thunderstorm+ | Cloudburst+ | Flash Flood+ |
|-------|---------|-----------|---------------|-------------|--------------|
| Train | 85 | Aug 1–11 | 78.32% | 0.02% | **STATIC 15.43%** |
| Val | 37 | Aug 12–16 | 79.95% | 0.30% | **STATIC 15.43%** |
| Test | 69 | Aug 17–25 | 77.92% | **0.00%** | **STATIC 15.43%** |

**Total samples**: 191 (85 train + 37 val + 69 test)

---

## 9. Tensor Shapes

| Tensor | Shape | Notes |
|--------|-------|-------|
| Input X | (B, T=4, C=12, H=32, W=32) | 4 temporal frames, 12 channels |
| Label thunderstorm | (B, 1, H=32, W=32) | Binary pixel mask |
| Label cloudburst | (B, 1, H=32, W=32) | Binary pixel mask |
| Label flash_flood | (B, 1, H=32, W=32) | Binary pixel mask |

---

## 10. Model Architecture (V2)

```
VayunetMTLModel
├─ SpatiotemporalPatchEmbed    (img_size=32, patch_size=4, C=12, T=4, embed_dim=128)
├─ MultiModalCrossAttentionFusion (embed_dim=128, num_heads=4)
├─ SpatiotemporalTransformerBackbone (depth=4, embed_dim=128, num_heads=8)
└─ Multi-Task Heads
   ├─ ThunderstormHead (embed_dim→64→32×32 logits)
   ├─ CloudburstHead   (embed_dim→64→32×32 logits)
   └─ FlashFloodHead   (embed_dim + topo(3ch) → 64 → 32×32 logits)
```

- **Parameters**: ~15MB checkpoint (moderate size)
- **Input**: (B, T=4, C=12, H=32, W=32)
- **Outputs**: {thunderstorm, cloudburst, flash_flood}: (B, 1, H=32, W=32) logits

---

## 11. Channel Spatial Variance (from actual tensors)

| Ch | Name | Spatial Std | Status |
|----|------|-------------|--------|
| 0 | WV 6.7µm | 0.4346 | Has genuine spatial variation |
| 1 | TIR 10.8µm | 0.4332 | Has genuine spatial variation |
| 2 | CTT drop rate | **0.0000** | **BROADCAST CONSTANT** |
| 3 | CAPE | 0.3020 | Has genuine spatial variation |
| 4 | CIN | 0.0811 | Has spatial variation |
| 5 | LCL | 0.0832 | Has spatial variation |
| 6 | Wind shear | **0.0000** | **BROADCAST CONSTANT** |
| 7 | IWV | 0.2175 | Has spatial variation |
| 8 | Moisture flux | **0.0000** | **BROADCAST CONSTANT** |
| 9 | Elevation | 0.1726 | Real CartoDEM spatial data |
| 10 | Slope | 0.1667 | Derived from real CartoDEM |
| 11 | Flow accum | 0.1258 | Derived from real CartoDEM |

---

## 12. Known Problems Summary

| # | Issue | Severity | Impact |
|---|-------|----------|--------|
| 1 | Cloudburst test set: 0 positive samples | CRITICAL | CSI/POD meaningless |
| 2 | Flash flood mask: STATIC per split | CRITICAL | CSI=1.0 is label leakage |
| 3 | Ch2/6/8: broadcast constants | HIGH | No spatial information |
| 4 | Himawari HSD decode: partial/uncertain | HIGH | Ch0/1 spatial data authenticity unknown |
| 5 | CAPE/CIN derived from 2m T/RH | MEDIUM | Approximation, not real sounding |
| 6 | CartoDEM only covers Wayanad bbox | HIGH | All other locations use synthetic terrain |
| 7 | Temporal split is chronological (good) | OK | No temporal leakage between splits |
| 8 | Thunderstorm label uses TIR input | MEDIUM | Potential circular dependency |
| 9 | 191 total samples (very small) | HIGH | Overfitting risk |
| 10 | Cloudburst label only fires Aug 15–18 | CRITICAL | Test period (Aug 17–25) has no positives |

---

## 13. XAI Labeling

- **Current**: `attribution_method: "physics_grounded_factor_contribution"`
- **Actual method**: Tensor channel magnitude (mean absolute activation) — a heuristic
- **Must NOT be labeled as**: Neural XAI, Captum, SHAP, Integrated Gradients
- **Correct label for SIH**: "Heuristic Channel Magnitude Attribution"

---

## 14. Leakage Analysis

| Type | Status | Notes |
|------|--------|-------|
| Temporal leakage | **LOW RISK** | Chronological split by date |
| CTT lookahead | **SAFE** | Backward finite difference used |
| Static terrain label | **LEAKAGE** | FF mask identical across all samples |
| Cloudburst date filter | **CONCERN** | Label depends on hardcoded dates |
| Normalization leakage | **SAFE** | Computed on train split only |

---

## 15. V3 Requirements Summary

Based on this audit, V3 must:

1. **Fix Himawari HSD decode** — use `satpy` or `pyhdf` for proper calibration
2. **Fix cloudburst labels** — needs real rain-rate data (IMD hourly or QPE) beyond the Aug 15–18 window
3. **Fix flash flood labels** — must vary by time, not be a static terrain mask
4. **Fix Ch2/6/8** — derive spatial CTT rate from properly decoded Himawari frames
5. **Increase dataset size** — 191 samples is insufficient; need multi-year or synthetic augmentation
6. **Fix CAPE** — use ERA5/IMDAA pressure levels if available; current formula is surface-only proxy
7. **Add CartoDEM for all locations** — or explicitly label as "synthetic terrain"
8. **Proper multi-horizon labels** — V2 has single target, V3 should have +1h/+3h/+6h targets
9. **Ablation study** — prove whether Himawari channels actually help vs. baseline
