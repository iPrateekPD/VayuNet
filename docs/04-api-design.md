# VAYUNET — REST API & Event Stream Specification
### SIH26077 | Ministry of Earth Sciences (MoES) — NCMRWF
### AI-Driven Hyper-Local Early Warning System for Severe Weather Nowcasting

---

## 1. API Architecture Overview

The VAYUNET API is implemented using **FastAPI** on port `8000`. It exposes clean RESTful endpoints for GIS map queries, historical replays, on-demand AI inference, and ITU-T X.1303 / CAP 1.2 emergency dispatch broadcasts, accompanied by Server-Sent Events (SSE) for live telemetry streaming.

* **Base URL:** `http://localhost:8000/api`
* **Content-Type:** `application/json` (REST) | `text/event-stream` (SSE) | `application/xml` (CAP 1.2)
* **OpenAPI Interactive Documentation:** `http://localhost:8000/docs`

---

## 2. Comprehensive Endpoint Matrix

| Method | Endpoint | Description | Auth / Scope |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | System health check, active pipeline status & telemetry count | Public |
| `GET` | `/api/hazards/locations` | List all monitored river valleys, urban centers & stations | Public |
| `GET` | `/api/hazards/live` | Real-time atmospheric precursors & hazard probabilities | Public |
| `GET` | `/api/hazards/historical/{id}` | Forensic chronological time-series for benchmark events | Public |
| `POST` | `/api/nowcast/predict` | On-demand hyper-local nowcast inference (2h–6h) | Operator / System |
| `POST` | `/api/alerts/broadcast` | Dispatches Common Alerting Protocol (CAP 1.2) emergency warnings | Authorized Dispatcher |
| `GET` | `/api/stream/telemetry` | Real-time SSE stream of atmospheric precursor variations | Public / Dashboard |

---

## 3. Detailed Request & Response Contracts

### 3.1 Health Status — `GET /api/health`
**Response (200 OK):**
```json
{
  "status": "online",
  "system": "VAYUNET Operational Core (SIH 26077)",
  "mode": "Phase 1: Working Operational Prototype (Demo AI Engine)",
  "phase": 1,
  "next_phase": "Phase 2: Deep Learning Spatiotemporal Transformer (Post-Sept 9)",
  "active_hazard_zones": 4,
  "timestamp": "2026-09-08T14:12:00Z"
}
```

---

### 3.2 On-Demand AI Nowcast — `POST /api/nowcast/predict`
Calculates spatiotemporal nowcasts for arbitrary coordinates or registered basin presets across 2–6 hour lead times.

**Request Body (`application/json`):**
```json
{
  "lat": 32.2190,
  "lng": 76.3234,
  "lead_time_hours": 3,
  "location_id": "dharamsala"
}
```

**Response (200 OK):**
```json
{
  "target": {
    "lat": 32.219,
    "lng": 76.3234,
    "location_name": "Dharamsala (Kangra Basin)"
  },
  "lead_time": "3h",
  "predictions": {
    "thunderstorm_probability": 89.5,
    "cloudburst_probability": 84.0,
    "flash_flood_probability": 91.2,
    "composite_threat_level": "RED"
  },
  "atmospheric_precursors": {
    "iwv_mm": 62.4,
    "cape_j_kg": 3120.0,
    "cin_j_kg": -12.0,
    "ctt_drop_rate_c_hr": -16.4,
    "wind_shear_0_6km_kt": 38.0,
    "dem_slope_deg": 34.2,
    "drainage_basin": "Bhagsunag Stream Sub-catchment"
  },
  "xai_factor_contributions": {
    "ctt_drop_rate": 38.0,
    "dem_slope_funneling": 28.0,
    "cape_instability": 20.0,
    "iwv_moisture_flux": 14.0
  },
  "model_architecture": "Multi-Modal Spatiotemporal Transformer (MTL)",
  "inference_latency_ms": 138.4,
  "engine_mode": "Production Inference"
}
```

---

### 3.3 Emergency Alert Broadcast — `POST /api/alerts/broadcast`
Generates and broadcasts standard Common Alerting Protocol (CAP) messages to disaster management agencies.

**Request Body (`application/json`):**
```json
{
  "hazard_type": "Cloudburst & Flash Flood",
  "severity": "RED",
  "location_name": "Dharamsala (Kangra Basin)",
  "lead_time_hours": 2,
  "recipients": [
    "NDMA SACHET",
    "Himachal Pradesh SDMA",
    "Kangra DEOC",
    "NDRF 14th Battalion"
  ]
}
```

**Response (200 OK):**
```json
{
  "alert_id": "CAP-IN-1788875900",
  "status": "DISPATCHED",
  "hazard_type": "Cloudburst & Flash Flood",
  "severity": "RED",
  "location": "Dharamsala (Kangra Basin)",
  "lead_time": "2 Hours Actionable Buffer",
  "channels_notified": [
    "NDMA SACHET",
    "Himachal Pradesh SDMA",
    "Kangra DEOC",
    "NDRF 14th Battalion"
  ],
  "timestamp": "2026-09-08T14:15:00Z",
  "message": "EMERGENCY NOWCAST ALERT [RED]: High probability of Cloudburst & Flash Flood in Dharamsala (Kangra Basin). Evacuate low-lying drainage corridors within 2 hours."
}
```

---

### 3.4 Forensic Historical Replay — `GET /api/hazards/historical/{event_id}`
Returns step-by-step chronological sensor progressions for benchmark disaster events.

* **Supported Event IDs:** `dharamsala-2021`, `wayanad-2024`
* **Response:** Contains timeline step arrays with `time_offset`, `iwv`, `cape`, `ctt_drop`, `cloudburst_prob`, and meteorological field notes.
