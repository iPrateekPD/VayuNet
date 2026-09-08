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

## 🚀 Key Modules & Capabilities

1. **Tactical Nowcast (Command Center)**:
   - High-resolution Esri satellite mountain imagery with multi-band convective Doppler radar plumes (0–100 mm/hr intensity scale).
   - Sector tracking for critical valleys (e.g., Chamoli & Alaknanda River Basin) with downstream trajectory flow vectors.
   - 7 toggleable hazard intelligence layers (Observed Precipitation, Predicted Hazards, Satellite Cloud Tops, DEM, Rivers, District Boundaries, Major Roads).
   - 6-hour interactive forecast scrubber filmstrip with play/pause simulation.

2. **Public Citizen Warning Portal**:
   - Zero-login, mobile-optimized public safety hub with live emergency alert ticker, interactive hazard maps, NDMA 1078 helpline, and multi-language support (12 Indian languages).

3. **Multi-Hazard Alert Gateway (CAP 1.2)**:
   - Standardized Common Alerting Protocol (CAP) payload generation for **NDMA SACHET**, State Disaster Response Forces (SDRF), and District Emergency Operations Centres (DEOCs).

4. **Diagnostics & Explainable AI (XAI)**:
   - Deep physical attribution using convective parameters: Convective Available Potential Energy (CAPE), Convective Inhibition (CIN), Integrated Water Vapor (IWV), Cloud Top Temperature (CTT drop rate), and vertical wind shear.

5. **Forensics Replay & Historical Calibration**:
   - Time-series replay of historical extreme weather events for post-disaster analysis, model auditing, and contingency planning.

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
