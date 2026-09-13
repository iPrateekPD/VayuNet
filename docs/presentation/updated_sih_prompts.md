# Updated VAYUNET SIH IDEA Presentation Prompts

Paste each prompt below into any AI writing tool to generate the exact content for your 6-slide presentation. These prompts have been **updated** to reflect the ambitious Spatiotemporal Transformer and Multi-Task Learning architecture from your official problem statement.

---

## Slide 1: Title Page

**PROMPT — Slide 1: Title Page**
```text
You are helping finalize the title slide of an SIH IDEA presentation.
Fill in this title slide exactly in this format, with no extra commentary:

Problem Statement ID – SIH26077
Problem Statement Title – AI-Driven Hyper-Local Early Warning System for Severe Weather Nowcasting
Theme – Disaster Management
PS Category – Software
Team ID – [YOUR TEAM ID]
Team Name – [YOUR TEAM NAME]
```

*(Note: The Theme and Title have been updated to match the exact wording in your SIH details).*

---

## Slide 2: Idea Title / Proposed Solution

**PROMPT — Slide 2: Idea Title / Proposed Solution**
```text
You are a technical writer helping a Smart India Hackathon team fill in the "Proposed Solution" slide of their official IDEA presentation (SIH26077, VayuNet).

Write exactly three sections, in bullet points only (no paragraphs, 3-5 bullets each):
1. "Detailed explanation of the proposed solution"
2. "How it addresses the problem"
3. "Innovation and uniqueness of the solution"

Ground every claim in these real facts about VayuNet — do not invent new features or numbers:
- VayuNet predicts heavy-rainfall, cloudbursts, and flash floods simultaneously 2-6 hours ahead using a Spatiotemporal Transformer network with Multi-Task Learning (MTL).
- Inputs: Live INSAT-3D/3DR satellite channels (WV, TIR) for moisture and CTT drop rate, and IMDAA thermodynamic baselines for instability (CAPE/CIN) and lift.
- The atmospheric predictions are overlaid onto a high-resolution Digital Elevation Model (DEM) to map natural drainage and terrain channeling for flash flood warnings.
- An Explainable AI (XAI) module transparently displays meteorological triggers (e.g., "moisture rising, atmospheric instability increasing") to non-expert officials.
- Existing systems it improves on: DGMR (radar-only), and global NWP models (computationally heavy, high latency). VayuNet is the first to use multi-task transformer architecture specifically on India-specific satellite+reanalysis data for hyperlocal 0-6hr nowcasting.

Keep total text short enough to fit one slide alongside a diagram — aim for under 90 words per section.
```

---

## Slide 3: Technical Approach

**PROMPT — Slide 3: Technical Approach**
```text
You are a technical writer helping a Smart India Hackathon team fill in the "Technical Approach" slide of their official IDEA presentation (SIH26077, VayuNet).

Write exactly two sections in bullet points only:
1. "Technologies to be used"
2. "Methodology and process for implementation"

For section 1, list technologies grouped by category, based on VayuNet's real stack:
- ML/DL: PyTorch, Spatiotemporal Transformers, Multi-Task Learning, Captum/SHAP for XAI
- Geospatial: xarray, rasterio, geopandas (DEM handling)
- Backend & Alerting: FastAPI for automated API alerts
- Frontend: React + Leaflet/Mapbox GL JS (Spatial Dashboard)
- Data sources: MOSDAC (INSAT-3D/3DR), IndiaWeatherBench/IMDAA reanalysis, CartoDEM/SRTM

For section 2, write a phase-based methodology (condense to 4-5 bullets):
- Phase 1 – Data Fusion & Alignment: Ingesting and mapping live INSAT data and IMDAA baselines onto a unified spatiotemporal grid.
- Phase 2 – Feature Engineering: Calculating CAPE, CIN, IWV, CTT drop rates, and DEM flow accumulation.
- Phase 3 – Transformer & MTL Modeling: Training the cross-attention transformer backbone and branching into distinct output heads for simultaneous predictions.
- Phase 4 – XAI & Dashboard Integration: Applying SHAP/Captum and building the web-based spatial dashboard.
- Phase 5 – Live Pipeline & Automated Alerting: Deploying the inference engine and lightweight API for real-time categorized alerts.

After the text, describe (in words) a simple left-to-right architecture diagram: 
Data Sources (Live Satellite + Reanalysis) -> Cross-Attention Transformer Backbone -> MTL Heads (Thunderstorm, Cloudburst, Flash Flood) -> FastAPI Alerting -> XAI Dashboard. 

Keep it bullet-point only, no paragraphs, and make sure the whole slide's text is scannable in under 10 minutes of judge review time.
```

---

## Slide 4: Feasibility and Viability

**PROMPT — Slide 4: Feasibility and Viability**
```text
You are a technical writer helping a Smart India Hackathon team fill in the "Feasibility and Viability" slide of their official IDEA presentation (SIH26077, VayuNet).

Write exactly three sections in bullet points only:
1. "Analysis of the feasibility of the idea"
2. "Potential challenges and risks"
3. "Strategies for overcoming these challenges"

Base this on VayuNet's real, verified constraints — do not soften or hide real limitations:

Real feasibility facts:
- MOSDAC and IndiaWeatherBench (Hugging Face) provide reliable, open access to the necessary INSAT and IMDAA data.
- The use of AI (Transformers) entirely bypasses the massive computational latency typical of traditional physics-based NWP models, making 2-6 hour lead times feasible.

Real challenges:
- Real-time ingestion of massive satellite grids over venue Wi-Fi during the demo may introduce latency or network failure.
- Severe weather events (cloudbursts, flash floods) are rare, causing class imbalance in training data.
- Radar data, which would improve short-term accuracy, lacks an open public API.

Strategies:
- Demo Readiness: Build a robust live pipeline but cache a historical extreme weather event to ensure a flawless live demonstration of the risk maps.
- Use focal loss and temporal oversampling of event windows to address class imbalance during model training.
- Rely on satellite-derived Quantitative Precipitation Estimation (QPE) as an openly accessible alternative to ground-based radar.

Keep language direct and specific.
```

---

## Slide 5: Impact and Benefits

**PROMPT — Slide 5: Impact and Benefits**
```text
You are a technical writer helping a Smart India Hackathon team fill in the "Impact and Benefits" slide of their official IDEA presentation (SIH26077, VayuNet).

Write exactly two sections in bullet points only:
1. "Potential impact on the target audience"
2. "Benefits of the solution (social, economic, environmental, etc.)"

Ground this in VayuNet's real target audience and real mechanism — do not invent statistics:

Target audience: State Disaster Management Authorities, district administrations, IMD/MoES, communities in flood-prone hilly/riverine regions.

Real mechanism of impact:
- Shifts the paradigm from coarse regional forecasting to hyper-local, actionable nowcasting (2-6 hours ahead).
- Explainable AI (XAI) transparently displays meteorological triggers, ensuring non-meteorologist disaster officials can trust and act on the alerts.
- Automated lightweight APIs push categorized warnings instantly when signature thresholds are breached.

For benefits, use these categories honestly:
- Social: Provides life-saving lead time for vulnerable communities facing rapid-onset events like cloudbursts and flash floods.
- Economic: Optimizes the pre-positioning of emergency rescue resources and reduces disaster-response costs by narrowing down at-risk valleys.
- Government relevance: Built entirely on open MoES/ISRO data, creating a direct, scalable pipeline for national deployment by NCMRWF or State DMAs.
```

---

## Slide 6: Research and References

**PROMPT — Slide 6: Research and References**
```text
You are formatting the "Research and References" slide of an SIH IDEA presentation (SIH26077, VayuNet). This slide should contain only a clean list of real, working links — no invented sources.

Format the following verified sources as a clean bullet list, grouped under short subheadings (Data Sources / Reference Systems), one link per line, no extra commentary:

Data Sources:
- https://www.mosdac.gov.in (INSAT-3D/3DR/3DS satellite data, ISRO/MOSDAC)
- https://huggingface.co/datasets/tungnd/IndiaWeatherBench (ML-ready IMDAA reanalysis subset)
- https://bhuvan.nrsc.gov.in (CartoDEM terrain data, ISRO/NRSC)

Reference Systems & Architectures:
- https://github.com/openclimatefix/skillful_nowcasting (DGMR reference for radar nowcasting)
- https://github.com/google-deepmind/graphcast (GraphCast reference for global forecasting)
```
