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

## 4. Key UI Components & Layout Structure

### 4.1 Top Live Weather Alert Marquee Ticker
* Continuously scrolls real-time active severe weather alerts across the top viewport border.
* High-visibility red/orange pulse pills with location, threat classification, and physical trigger summaries.

### 4.2 Sovereign Navigation Header
* Sovereign branding: MoES · NCMRWF insignia and Indian national tricolor badge.
* Dynamic navigation links with scroll-spy active section indicators (`Home`, `Hazards`, `Data Sources`, `How it Works`, `Impact`).
* Persistent "Public Warnings" and high-contrast "Enter Operations Portal" CTAs.

### 4.3 Spatial Nowcast Viewport (Leaflet GIS)
* Dark CartoDB Matter base tiles overlaid with India national and state boundaries.
* Dynamic layer controls for toggling **Precipitation Radar**, **Cloud Top Temperature (IR)**, **Lightning Flashes**, and **CartoDEM Contours**.
* Floating interactive time-scrubber slider (2h to 6h nowcasting horizon).

### 4.4 Hazard Cards & Interactive Micro-Charts
* Natural height responsive cards with high-resolution weather visuals.
* Embedded SVG/CSS micro-charts:
  * **Convective Instability Profile:** Bar chart displaying hourly instability progression ($t$ to $t+6\text{h}$).
  * **Rainfall Intensity Spectrum:** Histogram displaying peak precipitation curve ($142\text{ mm/hr Peak}$).
  * **Hydrological Routing Profile:** Smooth valley gradient showing ridge, gorge, nullah, and basin surge lag.

---

## 5. Responsive Breakpoint Rules

* **Desktop (≥ 1280px):** 3-column hazard cards, 4-column workflow pipeline with connecting chevrons, split hero map layout.
* **Laptop / Tablet (768px – 1279px):** 2-column or stacked hazard grids, 2x2 workflow grid, adaptive map height.
* **Mobile (< 768px):** Single-column stacked layout, horizontal scroll for telemetry cards, preserved padding (`16px-24px`), zero clipped or overlapping content.
