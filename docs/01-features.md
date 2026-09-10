# VAYUNET — Features Specification
### SIH26077 | Ministry of Earth Sciences (MoES) — NCMRWF
### AI-Driven Hyper-Local Early Warning System for Severe Weather Nowcasting

---

## 1. Executive Summary & Core Philosophy

VAYUNET is an operational, AI-driven hyper-local early warning system engineered specifically for Indian meteorological realities. Unlike conventional systems that perform simple radar extrapolation (which fails in mountainous terrain) or run heavy numerical models (which incur multi-hour latency), VAYUNET couples multi-spectral geostationary satellite radiances, thermodynamic reanalysis soundings, and high-resolution digital elevation models (DEM) to provide **2 to 6 hours of actionable lead time** for severe convective storms, cloudbursts, and cascading flash floods.

---

## 2. Comprehensive Feature Matrix

### 2.1 Live Multi-Source Spatiotemporal Ingestion Engine
* **INSAT-3D / 3DR Geostationary Ingestion:**
  * Rapid assimilation of Water Vapor (WV 6.7 µm) for upper/mid-tropospheric moisture pooling.
  * Thermal Infrared (TIR1 10.8 µm, TIR2 12.0 µm) for tracking Cloud Top Temperature (CTT) drop rates ($\Delta \text{CTT} / \Delta t$).
  * Automated calibration against geostationary parallax distortion over the Himalayas.
* **IMDAA Regional Reanalysis Thermodynamics:**
  * High-resolution atmospheric sounding extraction: Convective Available Potential Energy (CAPE), Convective Inhibition (CIN), Lifted Condensation Level (LCL), and 0–6 km bulk vertical wind shear.
* **ISRO CartoDEM 30m Terrain Layer:**
  * Topographic elevation, slope steepness, aspect angle, and hydrologic flow accumulation matrices (D8 flow routing).
* **Sensor Degradation Fallback (Graceful Degradation Mode):**
  * Dynamic channel dropout compensation: if high-resolution radar is occulted or an INSAT channel is missing, the cross-attention transformer dynamically substitutes IMDAA thermodynamic proxies without breaking system availability.

---

### 2.2 Cascading Multi-Hazard Prediction Engine
VAYUNET simultaneously produces 3 coupled, high-resolution risk grids at a **4 km × 4 km WGS84 resolution**:

| Hazard Module | Target Signature | Physics Mechanism Modeled | Actionable Lead Time |
| :--- | :--- | :--- | :--- |
| **Severe Thunderstorms** | Convective initiation, severe squalls (> 60 km/h), lightning density, hail | High CAPE ($> 2,000 \text{ J/kg}$), eroding CIN ($< 25 \text{ J/kg}$), and strong deep-layer shear ($> 30\text{ kts}$) | **2 to 6 Hours** |
| **Cloudbursts** | Extreme localized precipitation ($> 100 \text{ mm/hr}$ over $\le 20 \text{ km}^2$) | Explosive CTT collapse ($< -14^\circ\text{C/hr}$), high IWV ($> 55\text{ mm}$), and orographic moisture trapping | **1 to 3 Hours** |
| **Flash Floods** | Rapid valley inundation, mountain nullah surges, urban waterlogging | Cloudburst grid coupled to CartoDEM slope steepness and kinematic wave overland routing | **2 to 4 Hours** |

---

### 2.3 Physics-Grounded Explainable AI (XAI) Module
* **Gradient-Based Feature Attribution:**
  * Built on PyTorch Captum (Integrated Gradients) to compute verifiable physical contributions per grid cell.
* **Plain-Language Diagnostic Decomp:**
  * Translates abstract deep learning weights into immediate operational terms for district collectors:
    > *"Red Alert Cloudburst Risk (88%) at Dharamsala Catchment triggered by rapid Cloud Top Temperature drop (-16.4°C/hr, 38% contribution) and orographic terrain funneling (28% contribution)."*
* **Scientific Verification Visualizer:**
  * Dynamic precursor breakdown meters displaying Integrated Water Vapor (IWV), CAPE instability, CTT collapse rate, and DEM slope channeling.

---

### 2.4 ITU-T X.1303 / CAP 1.2 Automated Emergency Dispatcher
* **Standardized Common Alerting Protocol (CAP 1.2):**
  * Auto-generates syntactically validated XML/JSON payloads with target geometry, urgency, severity, and certainty attributes.
* **Direct Integration Targets:**
  * NDMA SACHET platform, State Emergency Operations Centers (SEOCs), District Emergency Operations Centers (DEOCs), and NDRF/SDRF battlegroups.
* **Multi-Channel Warning Distribution:**
  * Webhook broadcasts, emergency sirens audio triggering, automated SMS/Telegram dispatch routines, and geofenced polygon broadcasts.

---

### 2.5 Operational Architecture & 4-Stage Decision Workflow

The VAYUNET operations portal organizes tactical decision-making into a continuous, 4-stage pipeline that transitions operators seamlessly from initial detection to multi-agency broadcast:

```text
 ┌─────────────────────────────────────────────────────────────┐
 │                VAYUNET OPERATIONAL WORKFLOW                 │
 └─────────────────────────────────────────────────────────────┘
      │                     │                     │
      ▼                     ▼                     ▼
  [ 1. SEE ]       ➔  [ 2. UNDERSTAND ]  ➔  [ 3. PROVE ]
   NOWCAST                 ANALYSIS               EVENTS
"What's happening?"         "Why?"          "Can I trust it?"
      │                     │                     │
      └─────────────────────┼─────────────────────┘
                            ▼
                       [ 4. ACT ]
                         ALERTS
                    "What do we do?"
```

1. **Stage 1: NOWCAST (SEE — Tactical Awareness)**:
   - Live Esri satellite imagery coupled with multi-band Doppler radar reflectivity simulation (0–100 mm/hr scale).
   - Orographic corridor tracking (Chamoli / Alaknanda Basin) with river drainage overlay and downstream flow vectors.
   - Highest Threat Alert Card with lead time arrival ($T+1\text{h }45\text{m}$), confidence ($82\%$), estimated rainfall ($124\text{ mm}$), and affected footprint ($412\text{ km}^2$).
   - Interactive 6-hour simulation scrubber filmstrip with play/pause and timestep pills.
   - Connected actions: `Investigate Drivers (Why?) →` and `Prepare & Dispatch Alert (Act) →`.

2. **Stage 2: ANALYSIS (UNDERSTAND — Scientific Explanation)**:
   - **Executive Scientific Verdict Banner:** Provides an immediate single-sentence answer:
     > *“VAYUNET predicts elevated cloudburst risk because cloud-top cooling and moisture convergence are rapidly increasing.”*
   - Quantitative feature attribution (% weights): CTT Drop Rate (38%), IWV Saturation (26%), CAPE Energy (22%), Terrain Slope (8%).
   - Atmospheric evidence threshold table (CAPE, CIN, IWV, CTT rate, Wind Shear) with nominal/breached status.
   - Thermodynamic sounding diagnostics, radar/satellite fusion maps, and temporal evolution curves.
   - Connected workflow buttons: `← 1. Live Nowcast`, `3. Historical Validation (PROVE) →`, and `4. Create / Dispatch Alert (ACT) →`.

3. **Stage 3: EVENTS (PROVE — Historical Validation & Benchmarking)**:
   - Case-study laboratory comparing VAYUNET pre-disaster predictions against observed outcomes across 14 historical disasters (Dharamsala 2021, Wayanad 2024, Uttarkashi 2023, Mumbai 2020).
   - Chronological pre-incident timeline ($T-6\text{h}$, $T-4\text{h}$, $T-2\text{h}$, $T-0$, Impact, Recovery).
   - Quantitative verification metrics: Critical Success Index ($\text{CSI} = 0.71$), Probability of Detection ($\text{POD} = 0.88$), and False Alarm Ratio ($\text{FAR} = 0.19$), consistently outperforming IMD baselines.
   - Connected workflow button: `Model Verified ➔ Dispatch Emergency Alert (ACT) →`.

4. **Stage 4: ALERTS (ACT — Emergency Action & Dispatch)**:
   - Active incident management queue with severity indicators and last-updated telemetry.
   - Real-time ITU-T X.1303 / CAP 1.2 XML payload generator with one-click copy and export.
   - Multi-agency broadcast trigger dispatching alert payloads to NDMA SACHET, SDRF battalions, and community sirens.
   - Delivery audit log tracking transmission time, destination, and HTTP ACK 200 verification.
   - Review back-links to re-examine physical drivers (Analysis) or return to live detection (Nowcast).

---

### 2.6 Public & Authentication Layers

1. **Public Homepage (`/#/`)**:
   - Sovereign Indian Header with MoES · NCMRWF insignia and Indian national tricolor badge.
   - Live marquee weather alert ticker streaming real-time severe weather warnings.
   - Interactive National Hero Map with 3D terrain/satellite, live IMD Doppler Radar layer, storm cells, synoptic pressure indicators, time-scrubber, and layer controls.
   - Section 1: Three Cascading Hazards with convective instability micro-charts and intensity spectrum.
   - Section 2: Multi-Source National Data Fusion (INSAT-3D/3DR, IMDAA, ISRO CartoDEM, DWR radar network, AWS telemetry).
   - Section 3: Operational Workflow (Ingest, Predict, Explain, Dispatch).
   - Section 4: National Impact & Provenance footer.

2. **Login Gateway (`/#/login`)**:
   - Dedicated authentication portal for Incident Commanders and DEOC personnel.
   - Fast-track evaluator credentials allowing one-click instant access into the operational console.

3. **Citizen Public Warning Portal (`/#/warnings`)**:
   - Zero-login, mobile-optimized public safety hub.
   - Geolocation auto-detection with safety index indicator.
   - Active localized emergency alerts and advisory instructions.
   - Verified emergency shelters and direct SOS helplines (NDMA 1078, SDRF 1070, Police 112).
   - Multi-language translation support across 12 Indian languages.

