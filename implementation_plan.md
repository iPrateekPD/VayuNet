# Master End-to-End AI Pipeline for VAYUNET (Total Project)

Build a unified, end-to-end multi-modal and multi-hazard deep learning pipeline for **VAYUNET** (Smart India Hackathon SIH 26077). 

Instead of isolating a single hazard (like landslides), this pipeline operationalizes the complete VAYUNET mission: fusing satellite observations (Himawari-8/INSAT-3D), atmospheric reanalysis (NCMRWF IMDAA), and high-resolution terrain (ISRO CartoDEM) into a 12-channel spatiotemporal tensor $(B, T=4, C=12, H=32, W=32)$ to simultaneously predict **all 3 cascading hazards**:
1. **Severe Thunderstorm** (Convective storm initiation & high-shear squall lines $>60\text{ km/h}$)
2. **Cloudburst** (Extreme localized precipitation $>100\text{ mm/hr}$)
3. **Flash Flood / Mountain Slope Runoff** (Topographically routed valley inundation & debris surge)

---

## User Review Required

> [!IMPORTANT]
> **Key Architecture Decisions:**
> 1. **Unified Multi-Hazard Output**: The pipeline trains the core `VayunetMTLModel` (Divided Space-Time Transformer + Multi-Modal Cross Attention + 3 MTL Decoders) rather than an isolated single-task ConvLSTM.
> 2. **Multi-Tier Pipeline Stages**: A single orchestrator script `run_pipeline.py` with modular stages (`ingest`, `preprocess`, `build-tensors`, `train`, `evaluate`, `serve`).
> 3. **Dual Data Handling**: Supports real extracted datasets from `data/raw/` and maintains synthetic convective physics generation as a seamless fallback if raw NetCDF/HSD decoders are missing optional geospatial C-libraries on Windows.

---

## Proposed Pipeline Architecture

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              VAYUNET UNIFIED MASTER PIPELINE                            │
└────────────────────────────────────────────────────────────────────────────────────────┘

 [1. Raw Data Ingestion] (data/raw/)
    ├── satellite/himawari_2018-08/   ──► Band 8 (WV 6.2µm) & Band 13 (TIR 10.4µm)
    ├── dem/P5_PAN_CD_.../            ──► CartoDEM 30m Elevation GeoTIFF
    ├── reanalysis/hourly & pressure  ──► IMDAA Soundings (CAPE, CIN, Shear, IWV, Moisture Flux)
    └── ground_truth/rainfall & land  ──► IMD Gridded Rainfall (nc) & Landslide/Flood Points (shp)
             │
             ▼
 [2. Geospatial Alignment & Feature Extraction] (src/pipeline/preprocess.py)
    • Resample & crop all domains to 4 km study basin (32 x 32 grid cells)
    • Derive CTT anvil cooling rate: ∂T/∂t = (TIR_t - TIR_{t-1}) / Δt
    • Derive terrain slope (Sobel gradient) & D8 flow accumulation
    • Build 3 Ground Truth Binary Target Grids: Thunderstorm, Cloudburst, Flash Flood
             │
             ▼
 [3. 12-Channel Spatiotemporal Tensor Construction] (src/pipeline/builder.py)
    • Assembles rolling 4-timestep tensor: X ∈ R^(B x 4 x 12 x 32 x 32)
    • Standardizes channels with min-max normalization metadata
    • Exports ready-to-train tensors to data/processed/vayunet_tensors_train.pt & val.pt
             │
             ▼
 [4. Multi-Task Model Training] (src/training/train.py)
    • Trains VayunetMTLModel using Spatiotemporal Patch Tokenizer + Space-Time Transformer
    • Computes VayunetMultiTaskLoss (Class-Weighted Focal Loss + Topographic Hydro-Regularization)
    • Saves best model checkpoint to checkpoints/vayunet_mtl_best.pt
             │
             ▼
 [5. Scientific Evaluation & Benchmarking] (src/evaluation/evaluate.py)
    • Computes CSI, POD, FAR, and F1 across all 3 hazards
    • Exports checkpoints/model_metadata.json with normalization constants & metrics
             │
             ▼
 [6. Live Serving & Dashboard Feed] (api/main.py & dashboard/)
    • FastAPI loads checkpoints/vayunet_mtl_best.pt (< 25 ms GPU/CPU inference)
    • Real-time predictions feed Leaflet GIS nowcast map, XAI gauges, and NDMA CAP alerts
```

---

## Proposed Changes

### 1. Unified Pipeline Orchestration Module (`src/pipeline/`)

#### [NEW] [orchestrator.py](file:///d:/PROJECTS/VayuNet-main/src/pipeline/orchestrator.py)
Master pipeline manager defining the execution stages:
- Stage 1: `verify_and_unpack_raw()` — Verifies raw datasets in [data/raw/](file:///d:/PROJECTS/VayuNet-main/data/raw/) and unpacks relevant August 2018 NetCDF slices from `dataset_3` / `ds1`.
- Stage 2: `extract_features()` — Extracts satellite, CartoDEM, and reanalysis grids.
- Stage 3: `build_tensors()` — Packages 12-channel tensors $(B, 4, 12, 32, 32)$ and multi-hazard targets $(B, 3, 32, 32)$ into `data/processed/`.
- Stage 4: `train_model()` — Trains `VayunetMTLModel` and exports checkpoints.
- Stage 5: `evaluate_model()` — Evaluates CSI, POD, FAR and exports `model_metadata.json`.

#### [NEW] [raw_processors.py](file:///d:/PROJECTS/VayuNet-main/src/pipeline/raw_processors.py)
Robust, self-contained extractors for each data source in `data/raw/`:
- `SatelliteProcessor`: Reads Himawari/INSAT frames (handles HSD/bzip2 and converts to brightness temperature).
- `TerrainProcessor`: Reads CartoDEM GeoTIFF with fallback raster reader, extracts elevation, slope, and flow accumulation.
- `ReanalysisProcessor`: Ingests IMDAA pressure and surface variables, extracting CAPE, CIN, wind shear, and moisture flux.
- `GroundTruthProcessor`: Creates ground-truth binary masks for thunderstorms (convective clouds), cloudbursts (extreme rainfall $>100\text{ mm/hr}$), and flash floods (torrent runoff & landslide points).

---

### 2. Multi-Hazard Dataset Integration (`src/training/`)

#### [MODIFY] [dataset.py](file:///d:/PROJECTS/VayuNet-main/src/training/dataset.py)
- Update `VayunetDataset` to check for pre-built tensors in `data/processed/` (`vayunet_tensors_train.pt`, `vayunet_tensors_val.pt`).
- Seamlessly load real multi-hazard samples if available, while maintaining the physical synthetic convective generator if real tensors have not yet been built.

#### [MODIFY] [train.py](file:///d:/PROJECTS/VayuNet-main/src/training/train.py)
- Ensure safe Windows console logging (avoid cp1252 emoji crashes).
- Automatically export both `checkpoints/vayunet_mtl_best.pt` and `checkpoints/model_metadata.json` upon completion.

---

### 3. Unified Root CLI (`run_pipeline.py`)

#### [NEW] [run_pipeline.py](file:///d:/PROJECTS/VayuNet-main/run_pipeline.py)
Root CLI allowing single-command pipeline execution:
```bash
# Run complete end-to-end pipeline
python run_pipeline.py --stage all

# Or run individual stages
python run_pipeline.py --stage preprocess
python run_pipeline.py --stage train --epochs 50 --batch-size 8
python run_pipeline.py --stage evaluate
python run_pipeline.py --stage serve
```

---

## Verification Plan

### Automated Tests
1. **Architecture & Unit Tests**:
   ```bash
   python -X utf8 -m unittest tests/test_model.py
   ```
2. **Pipeline Ingestion & Tensor Shape Test**:
   ```bash
   python run_pipeline.py --stage test-pipeline
   ```
   Verify tensor shape: $(B, 4, 12, 32, 32)$ and targets: `thunderstorm`, `cloudburst`, `flash_flood` $(B, 1, 32, 32)$.
3. **Training & Checkpoint Verification**:
   Train for 3 epochs to verify gradient convergence, loss reduction, and checkpoint export:
   ```bash
   python run_pipeline.py --stage train --epochs 3 --batch-size 4
   ```
   Verify `checkpoints/vayunet_mtl_best.pt` and `checkpoints/model_metadata.json` are created and valid.
4. **API Integration Verification**:
   Verify `src/inference/pipeline.py` and `api/main.py` load the trained checkpoint and produce real-time multi-hazard predictions with sub-50ms latency.
