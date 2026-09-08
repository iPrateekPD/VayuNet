# VAYUNET Documentation Suite
### SIH26077 | Ministry of Earth Sciences (MoES) — NCMRWF
### AI-Driven Hyper-Local Early Warning System for Severe Weather Nowcasting

Welcome to the comprehensive technical documentation for **VAYUNET**, the sovereign, AI-driven hyper-local early warning system for severe weather nowcasting across India.

---

## 📚 Documentation Index

| File | Description | Focus Areas |
| :--- | :--- | :--- |
| **[01-features.md](file:///Users/prateekpd/Projects/SIH/MAIN/docs/01-features.md)** | Full System Features & Capability Matrix | Multi-hazard nowcasting, CartoDEM routing, XAI attribution, CAP 1.2 dispatch |
| **[02-tech-stack.md](file:///Users/prateekpd/Projects/SIH/MAIN/docs/02-tech-stack.md)** | Technical Architecture & Dependency Stack | React 19, Vite, Leaflet, FastAPI, PyTorch Lightning, Captum, Xarray, Pysheds |
| **[03-database-schema.md](file:///Users/prateekpd/Projects/SIH/MAIN/docs/03-database-schema.md)** | Data Models, PostGIS DDL & Schemas | Monitored locations, atmospheric telemetry, predictions, CAP alerts, XAI tables |
| **[04-api-design.md](file:///Users/prateekpd/Projects/SIH/MAIN/docs/04-api-design.md)** | REST API & Event Stream Specifications | Endpoint contracts, request/response models, SSE telemetry, CAP XML dispatch |
| **[05-ai-integrations.md](file:///Users/prateekpd/Projects/SIH/MAIN/docs/05-ai-integrations.md)** | Deep Learning Architecture & XAI Engine | Spatiotemporal Transformer, Cross-Attention, Multi-Task Loss, Captum Gradients |
| **[06-ui-design.md](file:///Users/prateekpd/Projects/SIH/MAIN/docs/06-ui-design.md)** | UI/UX Design System & Layout Tokens | Dark-mode glassmorphism, typography scale, Leaflet GIS styling, breakpoints |
| **[07-implementation-phases.md](file:///Users/prateekpd/Projects/SIH/MAIN/docs/07-implementation-phases.md)** | Project Roadmap & Milestones | Dual-phase strategy: Phase 1 Prototype Demo vs. Phase 2 Full AI Engine |
| **[08-testing-strategy.md](file:///Users/prateekpd/Projects/SIH/MAIN/docs/08-testing-strategy.md)** | Testing, Quality Assurance & Benchmarks | Physics bounds tests, API contracts, CSI/POD/FAR metrics, sensor degradation |
| **[09-deep-gap-analysis-and-innovation-thesis.md](file:///Users/prateekpd/Projects/SIH/MAIN/docs/09-deep-gap-analysis-and-innovation-thesis.md)** | Gap Analysis, Failure Modes & Innovation Thesis | Failure points of existing systems, Indian constraints, 500-team differentiator |
| **[implementation.md](file:///Users/prateekpd/Projects/SIH/MAIN/docs/implementation.md)** | Master Dual-Phase Implementation Blueprint | Complete technical masterfile and operational status tracker |

---

## ⚡ Quickstart Guide

### 1. Start the FastAPI Backend Service
```bash
./venv/bin/python3 -m uvicorn api.main:app --port 8000 --host 0.0.0.0
```
* **API Documentation:** `http://localhost:8000/docs`
* **Health Check:** `http://localhost:8000/api/health`

### 2. Start the React Frontend Dashboard
```bash
cd dashboard && npm run dev -- --port 5173
```
* **Dashboard Console:** `http://localhost:5173`

---

## 🏛️ Sovereign Attribution & Alignment
* **Problem Statement:** SIH26077 (Smart India Hackathon 2026)
* **Institutional Authority:** Ministry of Earth Sciences (MoES) / National Centre for Medium Range Weather Forecasting (NCMRWF)
* **Core Mission:** Provide 2–6 hours of high-confidence, actionable warning buffer for severe thunderstorms, cloudbursts, and flash floods across vulnerable mountain catchments and urban deltas in India.
