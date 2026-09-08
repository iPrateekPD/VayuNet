# VAYUNET — Testing & Validation Strategy
### SIH26077 | Ministry of Earth Sciences (MoES) — NCMRWF
### AI-Driven Hyper-Local Early Warning System for Severe Weather Nowcasting

---

## 1. Testing Philosophy

In an emergency nowcasting system, an unhandled exception or silent model failure during an extreme convective event has life-or-death consequences. VAYUNET implements a multi-tier testing strategy encompassing **unit tests**, **API contract verification**, **geospatial precision audits**, **meteorological benchmark validation**, and **graceful sensor degradation testing**.

---

## 2. Testing Levels & Tooling

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       VAYUNET TESTING ARCHITECTURE                          │
└─────────────────────────────────────────────────────────────────────────────┘

 [Tier 1: Unit & Physics Tests]      Pytest • Hypothesis (Physics bounds checks)
                                          │
                                          ▼
 [Tier 2: API Contract Tests]        FastAPI TestClient • Schemathesis (CAP 1.2 XML)
                                          │
                                          ▼
 [Tier 3: Geospatial & Ingest]       Rasterio / Geopandas boundary & projection audits
                                          │
                                          ▼
 [Tier 4: ML Meteorological Score]   Critical Success Index (CSI) • POD • False Alarm Rate
                                          │
                                          ▼
 [Tier 5: Frontend E2E & Load]       Vitest • Playwright • Browser Subagent Inspection
```

---

## 3. Detailed Test Suites

### 3.1 Tier 1: Unit & Thermodynamic Physics Tests (`tests/test_physics.py`)
* **Objective:** Verify that calculated meteorological indices stay within physical atmospheric bounds.
* **Checks:**
  * $\text{CAPE} \ge 0\text{ J/kg}$, $\text{CIN} \le 0\text{ J/kg}$.
  * Integrated Water Vapor (IWV) within realistic tropical bounds ($10\text{ mm} \le \text{IWV} \le 90\text{ mm}$).
  * Cloud Top Temperature (CTT) drop rates do not produce $\text{NaN}$ or infinity on missing satellite pixels.

### 3.2 Tier 2: API Contract & CAP Alert Tests (`tests/test_api.py`)
* **Objective:** Ensure all REST endpoints return valid schemas and sub-second response times.
* **Checks:**
  * `GET /api/health` returns `status: "online"` and status code 200.
  * `GET /api/hazards/live` correctly validates against `MONITORED_LOCATIONS` schema.
  * `POST /api/nowcast/predict` accepts arbitrary WGS84 coordinates and returns multi-hazard probability distributions within 200 ms.
  * `POST /api/alerts/broadcast` produces syntactically valid ITU-T X.1303 / CAP 1.2 payloads.

### 3.3 Tier 3: Geospatial Precision & Grid Alignment Tests
* **Objective:** Prevent spatial misalignment between INSAT satellite pixels, IMDAA reanalysis soundings, and CartoDEM terrain.
* **Checks:**
  * Unified 4 km grid matches exact WGS84 bounding box $[68^\circ\text{E} - 98^\circ\text{E}, 6^\circ\text{N} - 38^\circ\text{N}]$.
  * DEM flow accumulation correctly identifies valley drainage corridors without disconnected sink anomalies.

### 3.4 Tier 4: Meteorological Benchmark Scoring
Standard ML accuracy (overall accuracy %) is meaningless for rare convective storms where 99.9% of cells are non-events. VAYUNET evaluates models using standard meteorological contingency metrics:

| Metric | Formula | Target Threshold |
| :--- | :--- | :--- |
| **Probability of Detection (POD)** | $\frac{\text{Hits}}{\text{Hits} + \text{Misses}}$ | **$> 0.82$** for 2h lead time |
| **False Alarm Ratio (FAR)** | $\frac{\text{False Alarms}}{\text{Hits} + \text{False Alarms}}$ | **$< 0.22$** to prevent alert fatigue |
| **Critical Success Index (CSI)** | $\frac{\text{Hits}}{\text{Hits} + \text{Misses} + \text{False Alarms}}$ | **$> 0.65$** (Superior to NWP baselines) |

### 3.5 Tier 5: Fault Tolerance & Graceful Degradation Testing
* **Simulated Sensor Outage:** Ingest pipeline drops INSAT thermal IR channel for 2 consecutive cycles. Verify that the transformer model gracefully utilizes IMDAA thermodynamic soundings and flags uncertainty without crashing.
* **Network Latency Stress:** Simulate high latency (venue Wi-Fi simulation) on frontend map tiles; verify that local in-memory states prevent UI lockup.
