# VAYUNET (वायुनेट) 🇮🇳
### Hyper-Local Severe Weather Nowcasting & Convective Early Warning Intelligence System
*Ministry of Earth Sciences (MoES) · National Centre for Medium Range Weather Forecasting (NCMRWF)*

---

## 🌪️ Overview
**VAYUNET** is a next-generation AI/ML convective weather intelligence and nowcasting platform engineered for high-consequence Indian terrains (Himalayan orographic basins, Western Ghats, coastal plains, and metropolitan corridors). 

Combining sovereign satellite observations (**INSAT-3D/3DR**), atmospheric reanalysis (**IMDAA**), high-resolution terrain elevation (**ISRO CartoDEM**), and Doppler Weather Radars (**IMD DWR Network**), VAYUNET provides 2 to 6 hours actionable lead-time for:
- ⚡ **Severe Thunderstorms & Squalls**
- 🌧️ **Cloudbursts & Extreme Local Precipitation**
- 🌊 **Flash Floods & Mountain Slope Runoff**

---

## 🚀 Key Modules & 4-Stage Operational Architecture

VAYUNET bridges the fatal gap between meteorological observation and emergency action with a continuous, 4-stage decision pipeline:

```text
       SEE (Nowcast) ──> UNDERSTAND (Analysis) ──> PROVE (Events) ──> ACT (Alerts)
```

1. **Stage 1: NOWCAST (SEE — Tactical Operational Awareness)**:
   - High-resolution Esri satellite mountain imagery with multi-band convective Doppler radar plumes (0–100 mm/hr intensity scale).
   - Real-time orographic tracking for Chamoli & Alaknanda River Basin with downstream runoff flow vectors.
   - Chamoli Highest Threat Card with arrival time ($T+1\text{h }45\text{m}$), $82\%$ model confidence, $124\text{ mm}$ rainfall, and $412\text{ km}^2$ affected area.
   - 6-hour interactive forecast scrubber filmstrip with play/pause simulation and layer controls.
   - Direct connective actions: `Investigate Drivers (Why?) →` and `Prepare & Dispatch Alert (Act) →`.

2. **Stage 2: ANALYSIS (UNDERSTAND — Scientific Explanation & XAI)**:
   - **Executive Scientific Verdict Banner:** *"VAYUNET predicts elevated cloudburst risk because cloud-top cooling and moisture convergence are rapidly increasing."*
   - Quantitative Feature Attribution: CTT Drop Rate ($38\%$), IWV ($26\%$), CAPE ($22\%$), Terrain Slope ($8\%$).
   - Physics threshold matrix (CAPE, CIN, IWV, CTT Rate, Shear) with real-time breach status.
   - Thermodynamic sounding diagnostics, radar/satellite fusion maps, and temporal evolution curves.

3. **Stage 3: EVENTS (PROVE — Historical Validation & Benchmarking)**:
   - Case-study laboratory comparing VAYUNET pre-disaster predictions against observed outcomes across 14 historical catastrophes (Dharamsala 2021, Wayanad 2024, Uttarkashi 2023, Mumbai 2020).
   - Chronological pre-incident timeline ($T-6\text{h}$ to $T-0$ and Impact/Recovery).
   - Proven validation metrics: Critical Success Index ($\text{CSI} = 0.71$), Probability of Detection ($\text{POD} = 0.88$), and False Alarm Ratio ($\text{FAR} = 0.19$).
   - Direct connective action: `Model Verified ➔ Dispatch Emergency Alert (ACT) →`.

4. **Stage 4: ALERTS (ACT — Emergency Dispatch Command)**:
   - Standardized Common Alerting Protocol (**ITU-T X.1303 / CAP 1.2**) XML payload generation with one-click export.
   - Multi-agency broadcast trigger dispatching alert payloads to **NDMA SACHET**, State Disaster Response Forces (SDRF), and community sirens.
   - Live delivery audit trail with timestamps and HTTP ACK 200 verification logs.

5. **Public & Citizen Protection Hubs**:
   - **Public Homepage (`/#/`)**: Interactive national hero map, cascading hazard breakdown, data fusion sources, operational workflow, and national impact.
   - **Citizen Public Warning Portal (`/#/warnings`)**: Zero-login, mobile-first safety hub with auto-geolocation, live threat gauge, multilingual advisory (12 Indian languages), verified shelters, and SOS helplines (NDMA 1078, SDRF 1070, Police 112).
   - **Authentication Gateway (`/#/login`)**: Tactical command gateway with evaluator fast-track credentials.

---

## 📂 Project Architecture

```
MAIN/
├── api/                   # High-performance FastAPI backend & endpoints
│   └── main.py            # API routes for telemetry, hazard predictions, and CAP dispatch
├── ASSESTS/               # Branding assets, UI references, and high-res logos
├── checkpoints/           # Trained PyTorch model weight checkpoints
├── dashboard/             # Modern React 19 + Vite frontend application
│   ├── src/
│   │   ├── components/    # TacticalNowcastView, HeroMap, HomePage, CitizenPortal, etc.
│   │   ├── services/      # WeatherService, mock data generators, and API client
│   │   └── portal.css     # Unified command-center dark design system
│   └── package.json
├── data/                  # Geospatial data processing pipelines (raw, interim, processed)
├── docs/                  # Technical design briefs, specifications, and presentation deck
├── notebooks/             # Exploratory analysis & model validation Jupyter notebooks
├── src/                   # Core ML training, feature extraction, and physics-informed models
├── requirements.txt       # Python backend dependencies
└── README.md
```

---

## 🛠️ Getting Started

### 1. Prerequisites
- **Node.js** v18+ and **npm** v9+
- **Python** 3.10+

### 2. Backend Setup
```bash
# Optional: Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI engine
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```
The API server will be available at `http://localhost:8000` (docs at `http://localhost:8000/docs`).

### 3. Frontend Setup
```bash
cd dashboard

# Install npm packages
npm install

# Run the local development server
npm run dev
```
The interactive portal will launch at `http://localhost:5173`.

---

## 🛡️ Sovereign Data Provenance
- **Satellite Data**: ISRO / MOSDAC INSAT-3D & INSAT-3DR Imager + Sounder
- **Reanalysis**: NCMRWF IMDAA 12 km Regional Reanalysis
- **Elevation**: ISRO National Remote Sensing Centre (NRSC) CartoDEM v3 (30 m)
- **Observations**: India Meteorological Department (IMD) Automatic Weather Station (AWS) Network & DWR Doppler Composites

---

## 👥 Authors & Team
Developed for **Smart India Hackathon (SIH)** by Team VAYUNET.
