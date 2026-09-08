# VAYUNET — Technology Stack Architecture
### SIH26077 | Ministry of Earth Sciences (MoES) — NCMRWF
### AI-Driven Hyper-Local Early Warning System for Severe Weather Nowcasting

---

## 1. Architecture Stack Overview

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          VAYUNET TECHNOLOGY STACK                           │
└─────────────────────────────────────────────────────────────────────────────┘

 [Client Layer]          React 19 • Vite • Leaflet • Tailwind CSS / CSS3
                              │  ▲
                              │  │ JSON REST / Server-Sent Events (SSE)
                              ▼  │
 [API Gateway / Logic]   Python 3.12 • FastAPI • Uvicorn • Pydantic v2
                              │  ▲
                              │  │ In-memory / Asynchronous Workers
                              ▼  │
 [AI / ML Core]          PyTorch 2.4 • PyTorch Lightning • Captum (XAI)
                              │  ▲
                              │  │ Multi-dimensional Tensors (12 Channels)
                              ▼  │
 [Geospatial & Ingest]   Xarray • NetCDF4 • Rasterio • Geopandas • Pysheds
                              │  ▲
                              │  │ HDF5 / GRIB2 / GeoTIFF Streams
                              ▼  │
 [Data Infrastructure]   MOSDAC (INSAT) • NCMRWF (IMDAA) • ISRO (CartoDEM)
```

---

## 2. Layer-by-Layer Technology Breakdown

### 2.1 Frontend & User Interface (`dashboard/`)
* **Framework:** React 19 (Functional Components, Hooks, Context API)
* **Build Tooling & Bundler:** Vite 6 (Hot Module Replacement, optimized tree-shaking)
* **GIS & Spatial Mapping:** Leaflet 1.9 + React-Leaflet + CartoDB Dark Matter / Esri Satellite base tiles
* **Styling & Design System:** Modern Dark-Mode Glassmorphism, CSS Custom Properties (Tokens), Responsive Flexbox & CSS Grid, Lucide-React icon suite
* **State Management & Communication:** Native React State + Fetch API / Server-Sent Events (`EventSource`) for real-time telemetry streaming

---

### 2.2 Backend & API Service (`api/`)
* **Framework:** FastAPI (High-performance, async-native ASGI web framework)
* **Application Server:** Uvicorn (Lightning-fast ASGI server powered by uvloop and httptools)
* **Data Validation & Schemas:** Pydantic v2 (Strict type checking, high-speed serialization)
* **Emergency Serialization:** ITU-T X.1303 / CAP 1.2 XML & JSON Serializer
* **CORS & Middleware:** FastAPI CORSMiddleware with permissive multi-origin handling for local and cloud deployment

---

### 2.3 AI / Deep Learning Pipeline (`src/models/`, `src/training/`)
* **Core Framework:** PyTorch 2.4+ (CUDA / MPS / CPU accelerated tensors)
* **Training Abstraction:** PyTorch Lightning (Modular training loops, mixed precision FP16/BF16, reproducible checkpoints)
* **Model Architecture:**
  * **Spatiotemporal Transformer Backbone:** Multi-head cross-attention mechanism aligning satellite spectral temporal tokens with atmospheric thermodynamic profiles.
  * **Multi-Task Learning (MTL) Heads:** Branched convolution-transformer decoders with specialized loss functions (Focal Loss for extreme class imbalance).
* **Explainable AI (XAI):** Captum (`captum.attr.IntegratedGradients`) for computing pixel-level feature attribution maps without black-box approximations.

---

### 2.4 Geospatial Data Processing & Feature Engineering (`src/preprocessing/`, `src/features/`)
* **Raster & Array Analysis:**
  * `xarray`: Multi-dimensional labeled array processing for netCDF/HDF5 weather data.
  * `netCDF4` & `h5py`: Direct low-level binary readers for IMDAA and INSAT-3D/3DR payloads.
  * `rasterio`: Geospatial raster manipulation and CartoDEM reprojection.
* **Vector & Hydrology:**
  * `geopandas` & `shapely`: Administrative boundary masking and hazard polygon vectorization.
  * `pysheds`: Digital elevation model drainage network extraction, D8 flow routing, and basin accumulation.
* **Coordinate Systems:** WGS84 (EPSG:4326) unified 4 km spatiotemporal grid with reprojection support from UTM (EPSG:32643 / 32644).

---

### 2.5 Storage, Serialization & Caching
* **Local Caching:** HDF5 / Zarr stores for rapid slice retrieval of historical benchmark events.
* **Database (Planned / Optional):** PostgreSQL 16 + PostGIS extension for spatial query storage of historical alert polygons and telemetry logs.
* **In-Memory Buffer:** Redis / Python in-memory RingBuffer for live sliding-window nowcast states.

---

### 2.6 Development, Deployment & Infrastructure
* **Package Management:** `pip` / `virtualenv` (`requirements.txt`) & Node.js `npm`
* **Containerization (Production):** Docker multi-stage builds (`Dockerfile.api`, `Dockerfile.frontend`)
* **Orchestration:** Docker Compose for single-command full-stack initialization
* **Target Platforms:** Linux (Ubuntu 22.04 LTS / Debian 12), macOS (Apple Silicon MPS support), and cloud GPU runtimes (AWS EC2 g4dn / Google Cloud Compute).
