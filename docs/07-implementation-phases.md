# VAYUNET — Implementation Phases & Milestones Roadmap
### SIH26077 | Ministry of Earth Sciences (MoES) — NCMRWF
### AI-Driven Hyper-Local Early Warning System for Severe Weather Nowcasting

---

## 1. Dual-Phase Implementation Strategy

To secure maximum evaluation scoring during the initial video submission while guaranteeing scientific and operational depth for the final hackathon defense, VAYUNET is executed across two synchronized phases:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       VAYUNET IMPLEMENTATION ROADMAP                        │
└─────────────────────────────────────────────────────────────────────────────┘

 Phase 1: Prototype & Video Submission (Active)
 ├── Frontend: Complete Responsive React 19 + Leaflet GIS Dashboard
 ├── Backend: Working FastAPI Core (:8000) with Deterministic Simulated Physics
 ├── Replay Engine: Dharamsala 2021 & Wayanad 2024 Historical Disaster Scenarios
 └── Documentation & Slides: 14-Slide Comprehensive PPT & 6-Slide Official Deck
                       │
                       ▼
 Phase 2A: Data Ingestion & Preprocessing (Post-Submission)
 ├── MOSDAC Automated HDF5 Downloader (INSAT-3D/3DR WV & TIR)
 ├── IMDAA Reanalysis HuggingFace/NCMRWF Data Pipeline
 ├── CartoDEM 30m Slope & D8 Basin Drainage Matrix Extraction
 └── Unified 4 km Spatiotemporal Grid Resampler
                       │
                       ▼
 Phase 2B: Deep Learning Modeling & Training
 ├── Multi-Modal Spatiotemporal Transformer Backbone Implementation
 ├── Multi-Task Learning (MTL) 3-Head Decoders (Storm, Cloudburst, Flood)
 ├── Class-Imbalanced Focal Loss Training Loop
 └── Benchmark Validation (CSI, POD, FAR against NWP baselines)
                       │
                       ▼
 Phase 2C: Full Production Deployment & Final SIH Defense
 ├── Live Model Weight Wiring into FastAPI Runtime (<150 ms Inference)
 ├── Real-Time Captum Integrated Gradients XAI Attribution
 ├── Real ITU-T X.1303 CAP 1.2 Webhook Dispatcher
 └── Live On-Stage Evaluation Defense & Disaster Drill Simulation
```

---

## 2. Phase-by-Phase Task Breakdown

### Phase 1: The Working Prototype & Video Milestone (Completed / Active)
* **Goal:** Deliver an interactive, visually stunning web console and functional API for the official video walkthrough.
* **Deliverables:**
  * [x] Complete production-grade frontend dashboard with Leaflet GIS map.
  * [x] Working FastAPI server on port 8000.
  * [x] Multi-hazard probability meters for 2h–6h nowcasting.
  * [x] Interactive Explainable AI (XAI) precursor breakdown gauges.
  * [x] Emergency dispatch trigger broadcasting simulated CAP 1.2 alerts.
  * [x] Forensic event replay controllers for Dharamsala and Wayanad disasters.
  * [x] Verified presentation slides and evaluator Q&A defense document.

---

### Phase 2A: Geospatial Ingestion & Feature Engineering
* **Goal:** Establish automated pipelines for real-world satellite, reanalysis, and terrain data.
* **Tasks:**
  1. Build `src/ingestion/mosdac_client.py` for automated INSAT-3D/3DR HDF5 download.
  2. Implement `src/ingestion/imdaa_loader.py` for reading IMDAA NetCDF/GRIB soundings.
  3. Preprocess ISRO CartoDEM 30m elevation grids using `rasterio` and `pysheds` in `src/preprocessing/dem_processor.py`.
  4. Implement `src/features/thermo_calculators.py` to calculate CAPE, CIN, IWV, CTT drop rates, and moisture convergence.

---

### Phase 2B: Deep Learning Transformer Training
* **Goal:** Train the Spatiotemporal Transformer backbone and 3 MTL prediction heads.
* **Tasks:**
  1. Build PyTorch sliding-window Dataset & DataLoader in `src/training/dataset.py`.
  2. Implement `SpatiotemporalTransformer` model in `src/models/transformer_backbone.py`.
  3. Implement branched MTL heads for Severe Thunderstorms, Cloudbursts, and Flash Floods.
  4. Train models using PyTorch Lightning with Multi-Task Focal Loss on GPU.
  5. Validate against IMD QPE ground truth using CSI, POD, and FAR metrics.

---

### Phase 2C: Production Integration & Final SIH Defense
* **Goal:** Wire real model inference into the live API and demonstrate end-to-end operational execution.
* **Tasks:**
  1. Export trained model to TorchScript / ONNX and load in `api/main.py`.
  2. Compute real-time Captum Integrated Gradients for live XAI heatmaps.
  3. Connect live CAP 1.2 dispatcher to external test endpoints (Telegram / Webhook / NDMA testbed).
  4. Perform live drill on stage during final judging.
