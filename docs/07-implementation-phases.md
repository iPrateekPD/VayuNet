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

### Phase 1: The Working Prototype & Video Milestone (100% Completed — Ready for Demo Video)
* **Goal:** Deliver an interactive, visually stunning web console and functional API for the official September 9th video walkthrough.
* **Deliverables:**
  * [x] **National Sovereign Homepage (`HomePage.jsx` — `/#/`)**: Hero radar map, active alert ticker, cascade hazard cards with micro-charts, data sources architecture, sovereign credentials.
  * [x] **Citizen Public Warning Portal (`CitizenPortal.jsx` — `/#/warnings`)**: Hyper-local GPS/manual selector, threat gauge, 12-language translation engine, safety checklists, emergency shelters, 1-touch SOS.
  * [x] **Evaluator Secure Login Gateway (`LoginPage.jsx` — `/#/login`)**: MoES / NCMRWF security portal with 1-Click Fast-Track evaluator bypass.
  * [x] **Stage 1: NOWCAST (SEE) (`TacticalNowcastView.jsx`)**: GIS radar map, Chamoli convective plume, 4 layer toggles, 6-hour interactive filmstrip scrubber ($t_0$ to $t+6\text{h}$).
  * [x] **Stage 2: ANALYSIS (UNDERSTAND) (`AnalysisView.jsx`)**: Executive scientific verdict banner, quantitative XAI precursor breakdown (CTT 38%, IWV 26%, CAPE 22%, DEM 14%), thermodynamic soundings.
  * [x] **Stage 3: EVENTS (PROVE) (`EventsView.jsx`)**: 14 historical catastrophe validation laboratory, 3.5-hour pre-incident timeline, validation verdict (CSI 0.71 vs NWP 0.28).
  * [x] **Stage 4: ALERTS (ACT) (`AlertsView.jsx`)**: Incident queue, real-time ITU-T X.1303 / CAP 1.2 XML generator, multi-agency broadcast matrix, live dispatch with audio sirens, delivery audit log.
  * [x] **Slide-Out Telemetry Drawer (`TelemetryDrawer.jsx`)**: Instant multi-sensor telemetry diagnostics.
  * [x] **Working FastAPI Backend Service (`api/main.py`)**: Endpoints on `:8000` (`/api/health`, `/api/hazards/live`, `/api/hazards/historical/{id}`, `/api/nowcast/predict`, `/api/alerts/broadcast`).
  * [x] **Verified Presentation Deck & Evaluator Q&A**: 14-slide PPT narrative (`slide.md`) and exhaustive judge defense masterfile (`VAYUNET_MASTER_QA.md`).

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
