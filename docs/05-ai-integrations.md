# VAYUNET — AI & Deep Learning Architecture
### SIH26077 | Ministry of Earth Sciences (MoES) — NCMRWF
### AI-Driven Hyper-Local Early Warning System for Severe Weather Nowcasting

---

## 1. Deep Learning Design Philosophy

Standard meteorological deep learning models (such as ConvLSTMs or radar-extrapolation networks) suffer from three fatal flaws when deployed in India:
1. **Radar Dependency:** Ground Doppler Weather Radars (DWR) suffer severe beam occultation in the Himalayas and Western Ghats.
2. **Single-Hazard Siloing:** Rain, convective wind, and river runoff are modeled independently without joint thermodynamic coupling.
3. **Black-Box Skepticism:** District emergency collectors refuse to issue preemptive evacuations without understanding the physical trigger.

VAYUNET solves this via a **Multi-Modal Spatiotemporal Transformer** with **Multi-Task Learning (MTL)** and integrated **Physics-Grounded Explainable AI (XAI)**.

---

## 2. End-to-End Model Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                 VAYUNET MULTI-MODAL TRANSFORMER ARCHITECTURE                │
└─────────────────────────────────────────────────────────────────────────────┘

 [Input Streams]
  • INSAT-3D/3DR (WV 6.7µm, TIR 10.8µm) ───► [Temporal Patch Embedder] ──┐
  • IMDAA Reanalysis (CAPE, CIN, Shear) ───► [Thermodynamic Encoder]   ──┼──► [Cross-Attention Fusion]
  • ISRO CartoDEM (Slope, D8 Flow)      ───► [Topographic Pos Embed]   ──┘           │
                                                                                     ▼
                                                                        [Spatiotemporal Transformer]
                                                                        (4 Layers, 8 Attention Heads)
                                                                                     │
                                    ┌────────────────────────────────────────────────┴──────────────────┐
                                    ▼                                   ▼                               ▼
                           [Head 1: Thunderstorm]             [Head 2: Cloudburst]            [Head 3: Flash Flood]
                           Convective Initiation              >100 mm/hr Extreme Precip       Kinematic Wave Runoff
                           Probability Grid (2-6h)            Probability Grid (2-6h)         Valley Inundation Map
                                    │                                   │                               │
                                    └───────────────────────────────────┼───────────────────────────────┘
                                                                        ▼
                                                          [Captum Integrated Gradients]
                                                          Physical Feature Attribution
```

---

## 3. Detailed Component Specifications

### 3.1 Input Tensor Formulation
The input tensor $\mathcal{X} \in \mathbb{R}^{B \times T \times C \times H \times W}$ is formed across 4 lagged time steps ($T = 4$, 30-min intervals spanning $t-90\text{m}$ to $t$):
* **Channel 0–2 (Satellite Multi-spectral):** Water Vapor ($6.7\ \mu\text{m}$), Thermal IR ($10.8\ \mu\text{m}$), CTT Temporal Derivative ($\partial T / \partial t$).
* **Channel 3–6 (Atmospheric Stability & Kinematics):** Surface CAPE, CIN, Lifted Condensation Level (LCL), 0–6 km Bulk Wind Shear.
* **Channel 7–8 (Moisture Dynamics):** Integrated Water Vapor (IWV), 850 hPa Moisture Flux Convergence.
* **Channel 9–11 (Topographic Priors):** CartoDEM Normalized Elevation ($Z$), Slope Steepness ($\theta$), Flow Accumulation log-matrix ($\log(1 + A)$).

### 3.2 Cross-Attention Multi-Modal Fusion
Spatial tokens from high-frequency geostationary satellite frames query low-frequency thermodynamic soundings:
$$\text{Attention}(Q_{sat}, K_{thermo}, V_{thermo}) = \text{softmax}\left(\frac{Q_{sat} K_{thermo}^T}{\sqrt{d_k}}\right) V_{thermo}$$
This allows explosive localized satellite signatures (like rapid cloud-top cooling) to be interpreted in the context of prevailing ambient atmospheric instability.

### 3.3 Multi-Task Learning (MTL) Prediction Heads
1. **Severe Thunderstorm Head:** Deconvolutional feature pyramid producing binary segmentation logits for convective wind gusts ($>60\text{ km/h}$) and lightning onset.
2. **Cloudburst Head:** High-resolution spatial probability grid predicting rainfall rate $>100\text{ mm/hr}$ over a $4\text{ km} \times 4\text{ km}$ footprint.
3. **Flash Flood Routing Head:** Fuses cloudburst rainfall probability directly with CartoDEM flow accumulation matrices to compute surface runoff velocity and downstream canyon surge risk.

---

## 4. Multi-Task Loss Formulation

Severe convective storms and cloudbursts are rare events exhibiting extreme class imbalance ($\sim 1:1000$). Standard Binary Cross-Entropy (BCE) causes models to predict zero hazard. VAYUNET employs **Multi-Task Focal Loss with Topographic Regularization**:

$$\mathcal{L}_{total} = \lambda_1 \mathcal{L}_{focal}(\hat{y}_{ts}, y_{ts}; \gamma=2, \alpha=0.75) + \lambda_2 \mathcal{L}_{focal}(\hat{y}_{cb}, y_{cb}; \gamma=2.5, \alpha=0.85) + \lambda_3 \mathcal{L}_{hydro}(\hat{y}_{ff}, y_{ff}) + \lambda_{reg} \|\Theta\|_2^2$$

Where $\mathcal{L}_{focal}$ focuses gradient updates on hard negative and rare positive convective examples.

---

## 5. Explainable AI (XAI) with Captum

To guarantee operational trust for government disaster managers, VAYUNET calculates pixel-level feature attribution using **Integrated Gradients**:
$$\text{Attribution}_i(x) = (x_i - x_i') \times \int_{0}^{1} \frac{\partial F(x' + \alpha (x - x'))}{\partial x_i} d\alpha$$
* **Baseline $x'$:** Zero convective instability (neutral atmosphere with climatological mean moisture).
* **Operational Output:** Provides exact percentages of whether an alert was triggered by thermodynamic instability, moisture convergence, rapid cloud-top collapse, or topographic slope funneling.
