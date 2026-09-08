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

### 2.5 Operational GIS Portal & Forensic Replay
* **Interactive Leaflet/Mapbox GIS Viewport:**
  * Real-time layer switching: Radar Reflectivity, Cloud Top Temperature (IR), Lightning Flashes, Precipitation Rates, and CartoDEM Slope contours.
* **Temporal Scrubber (Nowcast Horizon):**
  * Seamless timeline navigation from $t+0\text{h}$ (current state) through $t+1\text{h}, t+2\text{h}, \dots, t+6\text{h}$.
* **Historical Benchmark Replay:**
  * Instant forensic playback of past extreme events (e.g. Dharamsala 2021 cloudburst, Wayanad 2024 orographic deluge) to benchmark early warning lead times against actual ground devastation.
