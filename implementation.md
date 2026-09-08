# VAYUNET Implementation Roadmap
### SIH26077 — AI-Driven Hyper-Local Early Warning System for Severe Weather Nowcasting

> **Dual-Phase Blueprint & Context Masterfile:** This document is the definitive technical execution guide and operational status report for VAYUNET. It covers both **Phase 1 (The September 9th Demo Version)** for the project explanation video submission, and **Phase 2 (The Post-September 9th Final Polished AI Version)** featuring the complete deep learning predictive engine and live meteorological data ingestion pipelines.

---

## 1. Dual-Phase Architectural Strategy

To meet the immediate video submission milestone while laying the rock-solid foundation for the final SIH evaluation, the implementation is bifurcated into two synchronized phases:

| Feature Dimension | Phase 1: Pre-Sept 9 Demo Version (Current Active State) | Phase 2: Post-Sept 9 Final Polished AI Version |
|---|---|---|
| **Primary Goal** | Flawless video walkthrough demonstration, UI/UX validation, and functional API contract. | Scientific rigor, real multi-modal transformer inference, and live MoES/IMD data pipeline. |
| **Frontend Dashboard** | **100% Final Production-Grade** (React, Vite, Leaflet, Tailwind/Vanilla CSS, dynamic time-scrubbers, audio alerts). | Same polished frontend connected seamlessly to live model inference outputs. |
| **Backend API** | **Working FastAPI Engine** without heavy AI models loaded. Serves live telemetry, event replay, and GeoJSON risk polygons via REST & SSE. | **Production FastAPI + TorchServe/Triton** executing PyTorch multi-task transformer models in real-time (< 3 min latency). |
| **Data Ingestion** | Pre-computed meteorological scenarios & synthetic physics-based atmospheric telemetry generator. | Automated ingestion workers for MOSDAC INSAT-3D/3DR (WV/TIR), IMDAA Reanalysis, and ISRO CartoDEM. |
| **Prediction Engine** | Deterministic atmospheric signature simulator matching real-world cloudburst/storm physics. | Spatiotemporal Transformer Encoder + 3 MTL prediction heads (Severe Thunderstorms, Cloudbursts, Flash Floods). |
| **Explainable AI (XAI)** | Dynamic precursor contribution meters (IWV, CAPE, Shear, DEM) reflecting simulated feature weights. | Captum / SHAP integrated gradients computed on active tensor layers. |
| **Alerting System** | Interactive Common Alerting Protocol (CAP) trigger, audio sirens, and dispatch simulation. | Automated CAP-compliant webhook dispatcher broadcasting to NDMA / SDRF endpoints. |

---

## 2. Phase 1: September 9th Demo Version (Detailed Breakdown)

### 2.1 Scope & Objective
Deliver a fully working, visually stunning web application and functional backend API to record the project demonstration video. Every feature, button, visual gauge, spatial overlay, and alert mechanism is interactive and operates in real time.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PHASE 1 ARCHITECTURE (PRE-SEPT 9)                     │
└─────────────────────────────────────────────────────────────────────────────┘

       React + Vite Frontend (localhost:5173)
       ┌──────────────────────────────────────────────────────────────┐
       │ • Interactive Leaflet Map (Satellite / Radar / DEM overlays) │
       │ • Multi-Hazard Probability Gauges (2h - 6h nowcast horizon)   │
       │ • XAI Storm Ingredient Breakdown (CAPE, IWV, Shear, DEM)     │
       │ • Historical Replay Controller (Dharamsala, Wayanad, Mumbai)  │
       │ • Emergency Alert Dispatcher & Audio Siren Notification       │
       └───────────────────────────────┬──────────────────────────────┘
                                       │ HTTP / REST & SSE
                                       ▼
       Working FastAPI Backend Service (localhost:8000)
       ┌──────────────────────────────────────────────────────────────┐
       │ • /api/health                    (Backend system health)     │
       │ • /api/hazards/live              (Real-time telemetry stream)│
       │ • /api/hazards/historical/{id}   (Extreme event replay data) │
       │ • /api/nowcast/predict           (Contract-matching output)  │
       │ • /api/alerts/broadcast          (CAP emergency dispatcher)  │
       │                                                              │
       │ [Simulation Engine: Realistic Meteorological Physics Formulas]│
       └──────────────────────────────────────────────────────────────┘
```

### 2.2 Frontend Implementation (`dashboard/`)
* **Technology Stack:** React 19, Vite, Leaflet, Lucide Icons, Modern Responsive CSS.
* **Key Components Implemented:**
  1. **Spatial Nowcast Viewport:** Dynamic Leaflet map displaying heatmaps, cloudburst risk zones, and radar reflectivity envelopes.
  2. **Atmospheric Ingredient Telemetry (XAI Preview):** Real-time monitoring of the 4 storm ingredients:
     * *Fuel:* Integrated Water Vapor ($IWV > 58 \text{ mm}$).
     * *Energy:* Convective Available Potential Energy ($CAPE > 2500 \text{ J/kg}$) and eroding CIN.
     * *Trigger:* Vertical wind shear & low-level convergence vectors.
     * *Catalyst:* Digital Elevation Model (DEM) slope channeling.
  3. **Multi-Hazard Status Gauges:** Distinct probability bars for:
     * Severe Thunderstorm (0–100%)
     * Cloudburst (0–100%)
     * Flash Flood (0–100%)
  4. **Lead Time Scrubber:** 2-hour, 4-hour, and 6-hour interactive nowcasting selector.
  5. **Scenario Switcher:** Switch between active disaster zones:
     * *Dharamsala (Himachal Pradesh):* High-altitude cloudburst & flash flood.
     * *Uttarkashi (Uttarakhand):* Steep-valley terrain funneling disaster.
     * *Mumbai Coastal:* Severe urban thunderstorm and waterlogging.
     * *Wayanad (Kerala):* Western Ghats extreme orographic precipitation & runoff.
  6. **Emergency Alert Modal:** One-click simulation of NDMA broadcast alert with siren audio playback.

### 2.3 Functional Backend Implementation (`api/main.py`)
* **Technology Stack:** Python 3.12, FastAPI, Uvicorn, Pydantic.
* **Core Endpoints:**
  * `GET /api/health`: Health status, uptime, and active mode indicator (`demo_mode: true`).
  * `GET /api/hazards/live`: Returns the current atmospheric telemetry and hazard probabilities for all monitored zones.
  * `GET /api/hazards/historical/{event_id}`: Returns pre-compiled chronological time-series for benchmark events (e.g. `dharamsala-2021`, `wayanad-2024`).
  * `POST /api/nowcast/predict`: Accepts bounding box / coordinates and lead time ($t \in [2, 6]$ hours), returning multi-hazard probability distributions and XAI factor contributions.
  * `POST /api/alerts/broadcast`: Dispatches automated CAP-standard disaster alert payloads to simulated emergency services.
  * `GET /api/stream/telemetry`: Server-Sent Events (SSE) streaming live minute-by-minute atmospheric fluctuations.

---

## 3. Phase 2: Post-Sept 9 Final Polished AI Version (Detailed Breakdown)

### 3.1 Scope & Objective
Replace the backend simulation engine with the fully trained, end-to-end deep learning pipeline. The system ingests live satellite and reanalysis grids, feeds them through a multi-modal spatiotemporal transformer, and performs multi-task nowcasting with actionable 2–6 hour lead times.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PHASE 2 ARCHITECTURE (POST-SEPT 9 FINAL)                 │
└─────────────────────────────────────────────────────────────────────────────┘

       MOSDAC (INSAT-3D/3DR)         IndiaWeatherBench (IMDAA)      ISRO CartoDEM
       (WV, TIR, CTT Drop Rate)      (CAPE, CIN, Wind Shear, Temp)  (Slope, Aspect, Basins)
                 │                                │                          │
                 └────────────────┬───────────────┘                          │
                                  ▼                                          │
                   Data Alignment & Resampling Worker                        │
                   (Uniform 4 km x 4 km spatial grid)                        │
                                  │                                          │
                                  ▼                                          │
              Spatiotemporal Transformer Encoder Backbone                    │
              (Cross-Attention Multi-Modal Fusion)                           │
                                  │                                          │
            ┌─────────────────────┼──────────────────────┐                   │
            ▼                     ▼                      ▼                   │
       Thunderstorm          Cloudburst             Flash Flood              │
       Output Head           Output Head            Output Head ◄────────────┘
      (Prob Map 2-6h)       (Prob Map 2-6h)        (Runoff & Inundation Map)
            │                     │                      │
            └─────────────────────┬──────────────────────┘
                                  ▼
                     SHAP / Captum XAI Module
                     (Gradient-based Feature Importance)
                                  │
                                  ▼
                   Production Inference API Server
                     (FastAPI + TorchServe / ONNX)
                                  │
                                  ▼
              Interactive Spatial Dashboard & CAP Dispatcher
```

### 3.2 Dataset Master List & Pipeline
| Dataset / Source | Role in Matrix | Specific Parameters | Ingestion Frequency |
|---|---|---|---|
| **INSAT-3D/3DR via MOSDAC** | Satellite Observational Signatures & Moisture | Water Vapor (WV) 6.7 µm (IWV fluctuations), Thermal IR (TIR1/TIR2) 10.8 µm (Cloud Top Temperature Drop Rate). | Every 15–30 minutes (Live HDF5 / GeoTIFF). |
| **IMDAA Reanalysis (NCMRWF)** | Thermodynamic Instability & Kinematics Baseline | Multi-level Temperature ($T$), Specific Humidity ($q$), Geopotential Height ($Z$), Horizontal Winds ($U, V$). | 1-hour updates / historical training archive. |
| **IMD QPE (Radar / Satellite)** | Ground Truth Verification & Target Labels | High-resolution precipitation estimates ($> 100 \text{ mm/hr}$ cloudburst threshold). | Hourly. |
| **ISRO CartoDEM / SRTM (30m)** | Topographic Runoff & Funneling | Surface elevation, flow accumulation, drainage network, slope angle. | Static layer pre-processed via `pysheds` / `richdem`. |

### 3.3 Deep Learning Model Architecture
1. **Spatiotemporal Transformer Backbone:**
   * Ingests consecutive time-lagged frames: $X_{t-3}, X_{t-2}, X_{t-1}, X_t$ (30-min intervals).
   * Cross-attention layers align satellite channel dynamics with reanalysis thermodynamic fields.
   * Spatial patch embeddings extract regional mesoscale features without pooling degradation.
2. **Multi-Task Learning (MTL) Heads:**
   * **Head 1 (Severe Thunderstorm):** Predicts convective initiation and high-shear storm tracks.
   * **Head 2 (Cloudburst):** Predicts extreme localized rainfall ($>100 \text{ mm/hr}$ over a few square kilometers) 2–6 hours in advance.
   * **Head 3 (Flash Flood):** Fuses cloudburst probabilities with the DEM flow accumulation matrix to forecast flash flood inundation and torrent surge paths.
3. **Loss Function:**
   $$\mathcal{L}_{total} = \lambda_1 \mathcal{L}_{focal}(\hat{y}_{ts}, y_{ts}) + \lambda_2 \mathcal{L}_{focal}(\hat{y}_{cb}, y_{cb}) + \lambda_3 \mathcal{L}_{flood}(\hat{y}_{ff}, y_{ff}) + \lambda_{reg} \|\Theta\|_2$$
   *Focal loss is utilized to combat the extreme class imbalance inherent in rare meteorological events.*

### 3.4 Explainable AI (XAI) Engine
* Integrated using **Captum** / **SHAP**:
* Calculates feature attribution gradients for every output pixel.
* Generates human-readable meteorological trigger diagnoses:
  > *"Cloudburst probability is 88% primarily driven by a sharp CTT drop rate of -16.4°C/hr (contribution: 44%) and low-level moisture convergence spike (contribution: 32%)."*

---

## 4. Work Schedule & Transition Milestones

```text
Sept 7 - Sept 9                     Sept 10 - Sept 25                  Oct 1 - Oct 25
┌──────────────────────────────┐    ┌──────────────────────────────┐   ┌──────────────────────────────┐
│  PHASE 1: DEMO MILESTONE     │ ──►│  PHASE 2A: DATA & TRAINING   │──►│  PHASE 2B: FINAL EVALUATION  │
│ • Production Frontend (Done) │    │ • MOSDAC & IMDAA data pipes  │   │ • Full MTL model deployment  │
│ • Working FastAPI Backend    │    │ • CartoDEM flow accumulation │   │ • Live satellite stream loop │
│ • Demo video walkthrough     │    │ • Transformer training on GPU│   │ • Captum XAI real heatmaps   │
│ • Complete SIH PPT slides    │    │ • Multi-task loss validation │   │ • On-stage SIH demo readiness│
└──────────────────────────────┘    └──────────────────────────────┘   └──────────────────────────────┘
```

* **Milestone 1 (Target: Sept 9, 2026):**
  * Finalized React frontend dashboard with responsive controls, Leaflet map, XAI gauges, and alert sirens.
  * Working FastAPI backend serving dynamic endpoints and historical event replays.
  * Screen recording and video walkthrough submitted.
* **Milestone 2 (Target: Sept 10–25, 2026):**
  * Automated downloader for MOSDAC INSAT-3D/3DR and IMDAA reanalysis subsets.
  * PyTorch Dataset & DataLoader implementation for unified grid tensors.
  * DEM hydrological processing with `pysheds`.
* **Milestone 3 (Target: Sept 26–Oct 15, 2026):**
  * Implement and train the Spatiotemporal Multi-Modal Transformer.
  * Benchmark against persistence, ConvLSTM, and standard NWP baselines (Critical Success Index, False Alarm Ratio).
* **Milestone 4 (Target: Oct 16–Finale):**
  * Wire trained model weights (`.pt`) directly into `api/main.py`.
  * Compute real-time Captum gradients for live XAI explanations.
  * Conduct simulated disaster drill with disaster management user groups.

---

## 5. Current Codebase Snapshot & Status Tracker (For AI & Developers)

### 5.1 Directory Layout
```text
MAIN/
├── api/
│   └── main.py                     # [ACTIVE] FastAPI service on :8000 (endpoints, simulation physics, CAP alerts)
├── dashboard/                      # [ACTIVE] React 19 + Vite frontend application on :5173
│   ├── src/
│   │   ├── components/
│   │   │   ├── AlertPanel.jsx      # Active alert list & live CAP dispatch trigger button
│   │   │   ├── IngestionPanel.jsx  # Multi-modal sensor sync log (INSAT, IMDAA, CartoDEM)
│   │   │   ├── MapView.jsx         # Leaflet GIS map with toggleable hazard overlays & contours
│   │   │   ├── PredictionPanel.jsx # 3 MTL hazard meters (Thunderstorm, Cloudburst, Flash Flood)
│   │   │   ├── TimeSlider.jsx      # 2h to 6h interactive timeline nowcasting scrubber
│   │   │   └── XAIPanel.jsx        # Explainable AI precursor breakdown bars (IWV, CAPE, etc.)
│   │   ├── App.jsx                 # Main layout, live backend health check, and orchestration
│   │   ├── index.css               # Modern dark-mode styling and glassmorphism design system
│   │   └── mockData.js             # Realistic meteorological time-series for 4 hazard regions
│   ├── package.json
│   └── vite.config.js
├── src/                            # [SCAFFOLDED] Python backend modules for Phase 2 deep learning
│   ├── ingestion/                  # MOSDAC INSAT & IMDAA downloaders
│   ├── preprocessing/              # Grid alignment, normalization, CartoDEM slope extraction
│   ├── features/                   # Physics calculators: CAPE, CIN, IWV, CTT drop rate
│   ├── models/                     # PyTorch Spatiotemporal Transformer & MTL 3-head architecture
│   ├── training/                   # PyTorch Lightning training loops, focal loss, checkpoints
│   ├── evaluation/                 # CSI, POD, FAR validation scripts
│   └── inference/                  # Low-latency inference runtime & ONNX/TorchServe exports
├── slide.md                        # Complete 14-slide PPT presentation content & speaker notes
├── implementation.md               # [THIS FILE] Dual-phase master technical specification
└── requirements.txt                # Full Python dependencies (PyTorch, FastAPI, xarray, captum)
```

### 5.2 Current Progress Checklist

- [x] **SIH Problem Statement & Architecture Alignment** (SIH26077, MoES / NCMRWF).
- [x] **Complete 14-Slide Presentation Content (`slide.md`)** with speaker notes, metrics, and visual diagrams.
- [x] **Production Frontend Web Application (`dashboard/`)**:
  - [x] Interactive Leaflet GIS map with toggleable risk layers.
  - [x] Multi-hazard probability meters for 2h–6h nowcasting.
  - [x] Explainable AI (XAI) "Storm Ingredients" contribution bars.
  - [x] Multi-zone scenario selector (Dharamsala, Uttarkashi, Mumbai, Wayanad).
  - [x] Interactive emergency alert modal with Common Alerting Protocol (CAP) formatting.
- [x] **Working FastAPI Backend Service (`api/main.py`)**:
  - [x] Health check endpoint (`GET /api/health`).
  - [x] Live atmospheric precursor stream (`GET /api/hazards/live`).
  - [x] Historical event replays (`GET /api/hazards/historical/{id}`).
  - [x] Coordinate-based nowcast inference endpoint (`POST /api/nowcast/predict`).
  - [x] Emergency dispatch endpoint (`POST /api/alerts/broadcast`).
- [x] **Frontend-to-Backend Live Integration**:
  - [x] Dashboard detects FastAPI connection status live (`FastAPI Core Online :8000`).
  - [x] "Dispatch Alerts to DMA" button sends live CAP requests to port 8000.
- [ ] **Phase 2 Post-Sept 9 AI Pipeline** *(To begin after Sept 9 video submission)*:
  - [ ] MOSDAC automated live HDF5 satellite ingestion daemon.
  - [ ] IndiaWeatherBench IMDAA reanalysis tensor processing.
  - [ ] Spatiotemporal Transformer model training on GPU.
  - [ ] Captum / SHAP integrated gradients on live PyTorch tensors.

### 5.3 How to Run the Project
1. **Start the FastAPI Backend Service:**
   ```bash
   ./venv/bin/python3 -m uvicorn api.main:app --port 8000 --host 0.0.0.0
   ```
2. **Start the React + Vite Frontend:**
   ```bash
   cd dashboard && npm run dev -- --port 5173
   ```
3. **Access the Application:**
   * Dashboard: `http://localhost:5173`
   * Backend API Documentation: `http://localhost:8000/docs`
   * Health Endpoint: `http://localhost:8000/api/health`
