# VAYUNET — UI/UX Design System & Layout Architecture
### SIH26077 | Ministry of Earth Sciences (MoES) — NCMRWF
### AI-Driven Hyper-Local Early Warning System for Severe Weather Nowcasting

---

## 1. Design System Philosophy

The VAYUNET user interface is built to evoke **national sovereign authority**, **scientific rigor**, and **instant high-stress operational clarity**. It avoids toy-like or purely decorative interfaces, providing emergency managers and meteorologists with an information-dense, dark-mode glassmorphic console.

---

## 2. Color Palette & Visual Tokens

| Token Name | Hex Code | Purpose & Semantic Meaning |
| :--- | :--- | :--- |
| `--bg-canvas` | `#060b13` | Deep space atmospheric background |
| `--bg-surface` | `rgba(11, 20, 38, 0.72)` | Translucent glassmorphic container cards |
| `--border-subtle` | `rgba(56, 189, 248, 0.14)` | Sleek cyber/radar border glow |
| `--accent-cyan` | `#38bdf8` | Primary active accent, telemetry markers, active toggles |
| `--accent-sky` | `#0284c7` | Secondary buttons, chart baselines, subtle badges |
| `--status-red` | `#ef4444` | High Risk / Severe Alert / Cloudburst Warning |
| `--status-orange` | `#f97316` | Moderate Risk / Squall Watch / Evacuation Standby |
| `--status-green` | `#10b981` | Safe baseline / Sensor Nominal / System Operational |
| `--text-primary` | `#f8fafc` | Maximum contrast headings and crucial metrics |
| `--text-secondary`| `#94a3b8` | Supporting labels, descriptions, and timestamps |

---

## 3. Typography Hierarchy

* **Primary Typeface:** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
* **Monospace / Telemetry Typeface:** `'JetBrains Mono', 'SF Mono', Consolas, monospace`

| Element | Size | Weight | Line Height | Letter Spacing |
| :--- | :--- | :--- | :--- | :--- |
| **Hero Title** | `52px` (clamp `34px-52px`) | 800 (Extrabold) | 1.12 | `-0.03em` |
| **Section Headings** | `38px–44px` | 700 (Bold) | 1.20 | `-0.02em` |
| **Card Titles** | `20px–22px` | 600 (Semibold) | 1.30 | `-0.01em` |
| **Body Text** | `14px–15px` | 400 (Regular) | 1.60 | `0` |
| **Pills & Status Badges** | `11px–12px` | 600 (Semibold) | 1.00 | `+0.05em` (Caps) |
| **Telemetry Values** | `13px–16px` | 500 (Medium) | 1.20 | Mono tabular |

---

## 4. Application Architecture & Views

VAYUNET is divided into two operational surfaces:
1. **Public Sovereign Surface**: National landing page (`/#/`), public citizen warning portal (`/#/warnings`), and evaluator login portal (`/#/login`).
2. **Operations & Command Console (`/#/app`)**: The 4-Stage Operational Decision Pipeline.

---

## 5. The 4-Stage Operational Decision Pipeline

The command portal implements a streamlined decision pipeline designed for operational clarity: **SEE ➔ UNDERSTAND ➔ PROVE ➔ ACT**.

```text
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                      4-STAGE OPERATIONAL DECISION PIPELINE                              │
└─────────────────────────────────────────────────────────────────────────────────────────┘

   [Stage 1: NOWCAST]       [Stage 2: ANALYSIS]       [Stage 3: EVENTS]       [Stage 4: ALERTS]
      "SEE"                   "UNDERSTAND"                 "PROVE"                 "ACT"
   Where & how bad?       Why does AI think so?       Has this worked before?   Broadcast warning
   ────────────────       ─────────────────────       ───────────────────────   ─────────────────
   • Leaflet Radar GIS    • Scientific Verdict Banner • 14 Catastrophe Lab      • CAP 1.2 XML Gen
   • 4 Overlay Toggles    • XAI Attribution Bars      • 3.5h Pre-Event Timeline • Multi-Agency Routing
   • 6h Filmstrip Scrubber• Thermodynamic Soundings   • CSI 0.71 vs NWP 0.28    • Audio Siren Trigger
```

### 5.1 Stage 1: NOWCAST (SEE) — `TacticalNowcastView.jsx`
* **Target User:** Incident Commander / Lead Forecaster.
* **Core Function:** Answers *"What is happening right now and over the next 2 to 6 hours?"*
* **Key Elements:**
  * Dark-mode Leaflet GIS map with tactical grid coordinates.
  * Active Chamoli convective plume boundary with radar reflectivity contouring.
  * 4 layer toggles: Precipitation Radar, Cloud-Top IR (TIR), Lightning strikes, CartoDEM terrain slope.
  * 6-Hour interactive filmstrip scrubber ($t_0$ to $t+6\text{h}$) showing temporal storm growth.
  * Context-aware routing: `Investigate Drivers →` (jumps to Stage 2) and `Prepare & Dispatch Alert →` (jumps to Stage 4).

### 5.2 Stage 2: ANALYSIS (UNDERSTAND) — `AnalysisView.jsx`
* **Target User:** Meteorologist / Technical Evaluator.
* **Core Function:** Answers *"Why does VAYUNET predict this disaster?"*
* **Key Elements:**
  * High-visibility **Executive Scientific Verdict Banner**: Translates deep learning weights into clear meteorological explanations.
  * Quantitative **Explainable AI (XAI) Precursor Breakdown**:
    * Cloud Top Temperature (CTT) drop rate (-4.8°C/15m): **38% contribution**
    * Integrated Water Vapor (IWV 58 mm): **26% contribution**
    * Convective Available Potential Energy (CAPE 3,150 J/kg): **22% contribution**
    * CartoDEM Slope Elevation gradient: **14% contribution**
  * Atmospheric sounding parameters (CIN erosion, vertical wind shear vectors).
  * Direct handoff buttons: `Review Historical Proof →` (Stage 3) and `Proceed to Alert Dispatch →` (Stage 4).

### 5.3 Stage 3: EVENTS (PROVE) — `EventsView.jsx`
* **Target User:** Evaluator / Researcher / Drill Trainer.
* **Core Function:** Answers *"Has VAYUNET proven its accuracy on actual past catastrophes?"*
* **Key Elements:**
  * Benchmark laboratory catalog across **14 major Indian disasters** (Dharamsala 2021, Wayanad 2024, Amarnath 2022, Chamoli 2021, Mumbai 2005, etc.).
  * Pre-incident timeline demonstrating **3.5 hours of advance warning** before flash flood / cloudburst impact.
  * Scientific validation verdict banner: **Critical Success Index (CSI) 0.71 vs NWP 0.28; False Alarm Ratio (FAR) 0.18 vs NWP 0.62**.

### 5.4 Stage 4: ALERTS (ACT) — `AlertsView.jsx`
* **Target User:** Emergency Operator / District Emergency Operations Centre (DEOC).
* **Core Function:** Answers *"What warning should we dispatch, to whom, and across which channels?"*
* **Key Elements:**
  * Active incident queue with priority categorization (Extreme, Severe, Moderate).
  * Real-time ITU-T X.1303 / Common Alerting Protocol (CAP 1.2) XML payload generator.
  * Multi-agency broadcast matrix: NDMA SACHET, SDRF, Community Sirens, SMS Cell Broadcast.
  * 1-Click alert dispatch with acoustic audio siren broadcast and live HTTP 200 delivery audit log.

---

## 6. Public Gateway Views

### 6.1 National Sovereign Homepage (`HomePage.jsx` — `/#/`)
* Hero radar map with live storm trajectories across India.
* Scrolling alert marquee ticker with real-time incident updates.
* Cascading hazard cards (Thunderstorms, Cloudbursts, Flash Floods) with interactive micro-charts.
* Multi-sensor data fusion architecture (MOSDAC INSAT-3D/3DR, CartoDEM, IMDAA, DWR).
* Sovereign MoES / NCMRWF branding and national impact statistics.

### 6.2 Citizen Public Warning Hub (`CitizenPortal.jsx` — `/#/warnings`)
* Hyper-local GPS & manual district search (Chamoli, Dharamsala, Uttarkashi, Wayanad, etc.).
* Visual threat level gauge (Extreme Cloudburst Warning, High Thunderstorm Watch, Low).
* Multi-lingual advisory engine supporting **12 Indian languages** (Hindi, English, Malayalam, Bengali, etc.).
* Step-by-step citizen emergency action checklist.
* Verified emergency shelter locator with real-time distance and capacity indicators.
* 1-Touch emergency SOS dialer (NDRF 1078, SDRF 1070, Police 112).

### 6.3 Evaluator Login Gateway (`LoginPage.jsx` — `/#/login`)
* Sovereign security login form with password masking.
* **"Instant Demo Access" 1-Click Fast-Track Button** for seamless evaluator demonstrations.

---

## 7. Responsive Breakpoint Rules

* **Desktop (≥ 1280px):** 3-column hazard cards, 4-column workflow pipeline with connecting chevrons, split hero map layout.
* **Laptop / Tablet (768px – 1279px):** 2-column or stacked hazard grids, 2x2 workflow grid, adaptive map height.
* **Mobile (< 768px):** Single-column stacked layout, horizontal scroll for telemetry cards, preserved padding (`16px-24px`), zero clipped or overlapping content.

