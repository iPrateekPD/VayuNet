# 🌪️ VAYUNET (वायुनेट) — AI Model Training, Dataset & Handover Specification
### Ministry of Earth Sciences (MoES) · National Centre for Medium Range Weather Forecasting (NCMRWF)
### Smart India Hackathon (SIH 26077) — Deep Learning Track
*Document Version: 2.0 (Phase 2 Standalone Handover Guide)*

---

## 📌 Executive Overview for the AI Engineer

Welcome to the **VAYUNET** AI research and model engineering module. 

As the AI engineer on this project, **your single objective is to train, benchmark, and deliver the trained deep learning model weight file (`.pt` or `.onnx`) and its normalization metadata.**

You do **NOT** need to build the React frontend or maintain the FastAPI server. The rest of the team already has the frontend GIS dashboard and backend operational architecture running. Your trained model checkpoint will be dropped directly into the project's `checkpoints/` directory to power real-time inference across the entire system.

```text
┌───────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    VAYUNET OPERATIONAL PIPELINE                                        │
└───────────────────────────────────────────────────────────────────────────────────────────────────────┘

 [Your Responsibility: Data & Training PC]                   [Main Project Repository & Server]
   1. Ingest MOSDAC (INSAT) + IMDAA + CartoDEM                    FastAPI Backend (:8000)
   2. Resample to 4 km Spatiotemporal Grid                               │  Loads your .pt checkpoint
   3. Train Spatiotemporal MTL Transformer                               ▼
   4. Save Best Model Checkpoint (.pt) ────[ONLY HANDOVER]───►  /api/nowcast/predict
                                                                         │  Sub-150ms inference
                                                                         ▼
                                                              React 19 Tactical Dashboard
                                                                • Live Radar/Satellite GIS Map
                                                                • XAI Storm Recipe Gauges
                                                                • NDMA CAP 1.2 Alert Dispatch
```

---

## 1. Project Background & Operational Mission (SIH 26077)

### The Problem in Indian Orographic Basins
Traditional Numerical Weather Prediction (NWP) models (like IMD WRF) are based on solving physical fluid dynamic differential equations on supercomputers. They require **3 to 6 hours of computation time**, meaning that by the time a warning is generated, a 30-minute cloudburst catastrophe (such as Dharamsala 2021 or Wayanad 2024) has already occurred. Furthermore, ground Doppler Weather Radars (DWR) suffer **severe beam blockage (occultation)** by Himalayan and Western Ghats ridgelines, creating blind valleys.

### The VAYUNET AI Innovation
VAYUNET treats severe convective weather nowcasting as an **end-to-end multi-modal spatiotemporal pattern recognition problem coupled with terrain physics**. It takes multi-spectral geostationary satellite frames (INSAT-3D/3DR), fuses them with ambient atmospheric thermodynamic soundings (NCMRWF IMDAA), and conditions them on high-resolution terrain slope and drainage basins (ISRO CartoDEM) to provide **2 to 6 hours actionable lead-time** at **4 km spatial resolution**.

### The 3 Cascading Hazards (Multi-Task Learning)
Instead of predicting isolated weather variables, the model simultaneously predicts the complete disaster lifecycle:
1. **Severe Thunderstorm:** Convective storm initiation and high-shear squall lines ($>60\text{ km/h}$).
2. **Cloudburst:** Extreme localized precipitation ($>100\text{ mm/hr}$ over a localized basin).
3. **Flash Flood:** Mountain torrent runoff and valley inundation (hydrologically routed via CartoDEM slope & flow accumulation).

---

## 2. Master Dataset Catalog, Links & Download Protocols

To train the VAYUNET model, you will fuse four official sovereign datasets:

| # | Dataset | Source Agency | Parameters Needed | Access Portal & Links | Format |
|---|---|---|---|---|---|
| **1** | **INSAT-3D / 3DR Radiances** | ISRO MOSDAC | Water Vapor ($6.7\ \mu\text{m}$), Thermal IR ($10.8\ \mu\text{m}$), Cloud Top Temperature (CTT), Hydro-Estimator QPE | [https://www.mosdac.gov.in](https://www.mosdac.gov.in) | HDF5 (`.h5`), GeoTIFF |
| **2** | **IMDAA Regional Reanalysis** | NCMRWF / NCAR RDA | CAPE, CIN, LCL, Bulk Wind Shear (0–6 km), IWV, 850 hPa $U, V$, Specific Humidity | [https://rda.ucar.edu/datasets/ds629.0/](https://rda.ucar.edu/datasets/ds629.0/) & [https://www.ncmrwf.gov.in](https://www.ncmrwf.gov.in) | NetCDF4 (`.nc`), GRIB2 |
| **3** | **CartoDEM (30m Elevation)** | ISRO NRSC Bhuvan | Surface Elevation ($Z$), Slope ($\theta$), Flow Accumulation ($\log(1+A)$) | [https://bhuvan-app3.nrsc.gov.in/data/download/index.php](https://bhuvan-app3.nrsc.gov.in/data/download/index.php) *(Fallback: OpenTopography SRTM 30m)* | GeoTIFF (`.tif`) |
| **4** | **Ground Truth Labels** | IMD Pune / DWR | Hourly AWS rainfall ($>100\text{ mm/hr}$ cloudburst threshold), Radar Reflectivity ($>45\text{ dBZ}$) | [https://dsp.imdpune.gov.in/](https://dsp.imdpune.gov.in/) & [http://aws.imd.gov.in/](http://aws.imd.gov.in/) | CSV, NetCDF |

### Detailed Access & Ingestion Instructions

#### Dataset 1: INSAT-3D/3DR (ISRO MOSDAC)
* **Registration:** Create a free researcher account on [MOSDAC](https://www.mosdac.gov.in).
* **Target Instrument:** Imager payload on INSAT-3D and INSAT-3DR (stationed over $74^\circ\text{E}$ and $82^\circ\text{E}$ Indian longitudes).
* **Temporal Frequency:** 15-minute staggered observations (INSAT-3D every 30m, INSAT-3DR every 30m $\rightarrow$ combined 15m cadence).
* **Key Channels to Extract:**
  1. `IMG_WV` (Channel 3, $6.5 - 7.1\ \mu\text{m}$): Water vapor moisture dynamics in upper/mid troposphere.
  2. `IMG_TIR1` (Channel 4, $10.3 - 11.3\ \mu\text{m}$): Thermal infrared brightness temperature.
  3. `CTT` (Cloud Top Temperature): Used to compute rapid vertical anvil cooling rate ($\partial T / \partial t$). A drop rate exceeding $-12^\circ\text{C/hr}$ is the classic precursor to an explosive cloudburst.

#### Dataset 2: IMDAA Atmospheric Reanalysis (NCMRWF)
* **What it is:** High-resolution ($12\text{ km}$) reanalysis covering 1979–present generated by NCMRWF using the UK Met Office Unified Model 4D-Var data assimilation over the Indian Monsoon region.
* **Direct Access:** Available on the NCAR Research Data Archive under dataset **ds629.0**:
  * URL: `https://rda.ucar.edu/datasets/ds629.0/`
* **Python Ingestion with `xarray`:**
  ```python
  import xarray as xr
  # Open IMDAA isobaric level data
  ds = xr.open_dataset("imdaa_12km_202307.nc")
  cape = ds["CAPE_surface"].values     # J/kg
  cin = ds["CIN_surface"].values       # J/kg
  u_850 = ds["u_wind"].sel(level=850)  # m/s
  v_850 = ds["v_wind"].sel(level=850)  # m/s
  ```

#### Dataset 3: ISRO CartoDEM (Digital Elevation Model)
* **Target Product:** CartoDEM Version-3 R1 (30-meter resolution).
* **Bhuvan Portal Download:** Select your target district tile (e.g. Chamoli/Alaknanda basin in Uttarakhand, Kangra/Dharamsala basin in Himachal Pradesh, Wayanad in Kerala).
* **Global Quick-Start Fallback:** If Bhuvan OTP verification is delayed, download NASA SRTM 30m tiles for northern/southern India from [OpenTopography](https://portal.opentopography.org/raster?opentopoHash=) or via Python `elevation` package:
  ```bash
  pip install elevation rasterio pysheds
  eio clip -o dem_himalayas.tif --bounds 76.0 30.0 79.0 33.0
  ```

---

## 3. Data Processing & Input Tensor Specification

The model does not take unstructured raw files; it takes a standardized spatiotemporal tensor:

$$\mathcal{X} \in \mathbb{R}^{B \times T \times C \times H \times W}$$

### Dimension Definitions
* **$B$ (Batch Size):** Typically 8 or 16 during training; 1 during real-time inference.
* **$T$ (Time Frames):** 4 consecutive frames at 30-minute intervals ($t-90\text{m}, t-60\text{m}, t-30\text{m}, t$).
* **$C$ (Channels):** Exactly 12 physical meteorological and topographical channels.
* **$H \times W$ (Spatial Grid):** $32 \times 32$ or $64 \times 64$ grid cells at $4\text{ km} \times 4\text{ km}$ resolution ($\approx 128\text{ km} \times 128\text{ km}$ basin area).

### Channel Breakdown ($C = 12$)

| Channel Index | Physical Variable | Source | Units | Normalization Range |
|:---:|---|---|---|---|
| **0** | Water Vapor Radiance ($6.7\ \mu\text{m}$) | INSAT-3D/3DR | Brightness Temp ($K$) | $[200, 260] \rightarrow [0, 1]$ |
| **1** | Thermal IR Radiance ($10.8\ \mu\text{m}$) | INSAT-3D/3DR | Brightness Temp ($K$) | $[190, 310] \rightarrow [0, 1]$ |
| **2** | CTT Drop Rate ($\partial T / \partial t$) | Derived from TIR | $^\circ\text{C/hr}$ | $[-25, 5] \rightarrow [0, 1]$ |
| **3** | Convective Available Potential Energy (CAPE) | IMDAA Reanalysis | $\text{J/kg}$ | $[0, 4500] \rightarrow [0, 1]$ |
| **4** | Convective Inhibition (CIN) | IMDAA Reanalysis | $\text{J/kg}$ | $[-300, 0] \rightarrow [0, 1]$ |
| **5** | Lifted Condensation Level (LCL) | IMDAA Reanalysis | Meters | $[200, 2500] \rightarrow [0, 1]$ |
| **6** | Deep-Layer Bulk Wind Shear ($0 - 6\text{ km}$) | IMDAA Reanalysis | Knots | $[0, 70] \rightarrow [0, 1]$ |
| **7** | Integrated Water Vapor (IWV) | IMDAA / INSAT | $\text{mm}$ | $[10, 75] \rightarrow [0, 1]$ |
| **8** | $850\text{ hPa}$ Moisture Flux Convergence | IMDAA ($\nabla \cdot (q\mathbf{V})$) | $\text{g/kg/s}$ | $[-0.05, 0.05] \rightarrow [0, 1]$ |
| **9** | CartoDEM Surface Elevation ($Z$) | ISRO CartoDEM | Meters | $[200, 7000] \rightarrow [0, 1]$ |
| **10** | CartoDEM Terrain Slope ($\theta$) | Derived via gradient | Degrees | $[0, 60] \rightarrow [0, 1]$ |
| **11** | CartoDEM Flow Accumulation | Derived via D8 routing | $\log(1 + A)$ | $[0, 15] \rightarrow [0, 1]$ |

---

## 4. Deep Learning Model Architecture (`VayunetMTLModel`)

The neural architecture consists of four tightly-coupled components:

### 1. Spatiotemporal Patch Tokenizer (`patch_embed.py`)
* Converts the $(B, T, C, H, W)$ tensor into latent patch tokens using a 2D convolutional patch projection ($4 \times 4$ kernel, stride 4).
* Adds learnable 2D spatial positional encodings $\in \mathbb{R}^{1 \times 1 \times N \times D}$ and 1D temporal positional encodings $\in \mathbb{R}^{1 \times T \times 1 \times D}$.

### 2. Multi-Modal Cross-Attention Fusion (`cross_attention.py`)
* Solves the physical mismatch between fast satellite convective dynamics (cooling cloud tops) and slow thermodynamic baselines (CAPE/CIN/shear).
* Satellite tokens act as queries $Q_{sat}$, attending to keys and values of ambient thermodynamic and terrain tokens:
  $$\text{Attention}(Q_{sat}, K_{context}, V_{context}) = \text{softmax}\left(\frac{Q_{sat} K_{context}^T}{\sqrt{d_k}}\right) V_{context}$$

### 3. Divided Space-Time Transformer Backbone (`transformer_backbone.py`)
* Avoids the quadratic $O((T \cdot N)^2)$ memory explosion of full 3D attention by using **factorized attention**:
  1. *Spatial Self-Attention:* Computes multi-head attention across all patches at each timestep $t$.
  2. *Temporal Self-Attention:* Computes multi-head attention across all timesteps $t \in [0, T-1]$ for each spatial patch.
* 4 Encoder Layers, 8 Attention Heads, Embedding Dimension $D = 128$, Pre-LayerNorm with GELU activations.

### 4. Multi-Task Learning (MTL) Heads (`heads.py`)
* **Thunderstorm Head:** Deconvolutional upsampler producing binary probability logits $(B, 1, H, W)$ for convective initiation.
* **Cloudburst Head:** High-capacity non-linear decoder predicting $>100\text{ mm/hr}$ precipitation cores.
* **Flash Flood Head:** Hydrologically coupled decoder that takes the predicted cloudburst precipitation logits and concatenates them directly with the CartoDEM elevation, slope, and flow accumulation channels to produce downhill torrent surge probabilities.

### 5. Multi-Task Focal Loss with Physics Regularization (`loss.py`)
Because cloudbursts occur in $<0.1\%$ of spatial pixels across time, standard BCE loss predicts zero everywhere. VAYUNET utilizes **Multi-Task Class-Weighted Focal Loss**:
$$\mathcal{L}_{focal} = -\alpha_t (1 - p_t)^\gamma \log(p_t) \quad (\gamma = 2.5, \alpha = 0.85 \text{ for cloudbursts})$$

Plus **Topographic Hydro-Regularization ($\mathcal{L}_{hydro}$)**:
Water must flow downhill along the negative elevation gradient $-\nabla Z$. We penalize uphill flood predictions:
$$\mathcal{L}_{hydro} = \frac{1}{HW} \sum_{i,j} \max\left(0, \nabla P_{flood} \cdot \nabla Z_{DEM}\right)$$

Total Loss:
$$\mathcal{L}_{total} = 1.0 \cdot \mathcal{L}_{ts} + 2.5 \cdot \mathcal{L}_{cb} + 1.5 \cdot \mathcal{L}_{ff} + 0.5 \cdot \mathcal{L}_{hydro}$$

---

## 5. What Files You Need to Give to the Team (The Handover Contract)

> [!IMPORTANT]
> **DELIVERABLE CONTRACT:**
> You ONLY need to provide the trained weights and metadata. Do NOT send gigabytes of raw satellite/reanalysis files.

You must deliver **two specific files** to the main repository team:

### 1. `checkpoints/vayunet_mtl_best.pt`
A PyTorch checkpoint dictionary containing:
```python
torch.save({
    "epoch": best_epoch,
    "model_state_dict": model.state_dict(),
    "optimizer_state_dict": optimizer.state_dict(),
    "val_loss": best_val_loss,
    "metrics": {
        "cloudburst_csi": 0.81,
        "cloudburst_pod": 0.94,
        "cloudburst_far": 0.16,
        "flash_flood_csi": 0.74,
        "thunderstorm_csi": 0.85
    },
    "model_config": {
        "img_size": 32,
        "patch_size": 4,
        "in_channels": 12,
        "num_frames": 4,
        "embed_dim": 128,
        "depth": 4,
        "num_heads": 8
    }
}, "vayunet_mtl_best.pt")
```

### 2. `model_metadata.json`
A JSON file specifying the exact normalization min/max constants used during your training run so the backend applies identical normalization during live inference:
```json
{
  "model_version": "VAYUNET-MTL-v2.0",
  "trained_date": "2026-09-12",
  "target_img_size": 32,
  "channels": [
    {"index": 0, "name": "insat_wv_6.7", "min": 200.0, "max": 260.0},
    {"index": 1, "name": "insat_tir1_10.8", "min": 190.0, "max": 310.0},
    {"index": 2, "name": "ctt_drop_rate_c_hr", "min": -25.0, "max": 5.0},
    {"index": 3, "name": "cape_j_kg", "min": 0.0, "max": 4500.0},
    {"index": 4, "name": "cin_j_kg", "min": -300.0, "max": 0.0},
    {"index": 5, "name": "lcl_m", "min": 200.0, "max": 2500.0},
    {"index": 6, "name": "shear_0_6km_kt", "min": 0.0, "max": 70.0},
    {"index": 7, "name": "iwv_mm", "min": 10.0, "max": 75.0},
    {"index": 8, "name": "moisture_flux_850", "min": -0.05, "max": 0.05},
    {"index": 9, "name": "elevation_m", "min": 200.0, "max": 7000.0},
    {"index": 10, "name": "slope_deg", "min": 0.0, "max": 60.0},
    {"index": 11, "name": "flow_accumulation_log", "min": 0.0, "max": 15.0}
  ],
  "benchmark_metrics": {
    "cloudburst": {"csi": 0.81, "pod": 0.94, "far": 0.16},
    "flash_flood": {"csi": 0.74, "pod": 0.89, "far": 0.18},
    "thunderstorm": {"csi": 0.85, "pod": 0.96, "far": 0.12},
    "mean_inference_latency_ms": 20.0
  }
}
```

---

## 6. How the Live Satellite Ingestion & API Loop Works in Production

When your model is plugged into the live system, here is how real-time satellite data turns into an alert on the user's dashboard:

```text
 1. MOSDAC Satellite Polling Daemon
    • Every 15 minutes, downloads latest INSAT-3D/3DR HDF5 frame from ISRO MOSDAC server.
    • Extracts WV 6.7µm and TIR 10.8µm matrices over target basins (e.g. Chamoli, Dharamsala).
             │
             ▼
 2. Atmospheric & Hydrological Feature Alignment
    • Ingests latest NCMRWF IMDAA hourly cycle (CAPE, CIN, IWV).
    • Merges static ISRO CartoDEM 30m elevation and D8 flow direction grids.
             │
             ▼
 3. Tensor Construction (`src/features/tensor_builder.py`)
    • Assembles the rolling 4-timestep tensor: X in R^(1 x 4 x 12 x 32 x 32).
             │
             ▼
 4. Live PyTorch Inference (`src/inference/pipeline.py`)
    • Loads your checkpoint: checkpoints/vayunet_mtl_best.pt
    • Executes GPU forward pass in ~20 ms.
    • Computes pixel-wise probabilities for Thunderstorm, Cloudburst, and Flash Flood.
             │
             ▼
 5. FastAPI Broadcast API (`api/main.py`)
    • If Cloudburst probability > 80% with steep slope:
      - Issues RED ALERT payload on /api/nowcast/predict
      - Generates ITU-T X.1303 / CAP 1.2 compliant XML alert payload.
             │
             ▼
 6. Tactical Operations Console & Citizen Portal (`dashboard/`)
    • Leaflet map renders convective Doppler radar plume over valley.
    • XAI Storm Recipe displays factor breakdown (e.g. CTT Drop 38%, CAPE 22%, Slope 28%).
    • NDMA SACHET sirens broadcast multi-lingual warnings to citizens in the basin.
```

---

## 7. Complete Ready-to-Run Code Modules

Below are the complete Python code files. You can save them directly into a project folder on your PC and run training immediately.

### File 1: `requirements.txt`
```text
torch>=2.1.0
torchvision>=0.16.0
torchaudio>=2.1.0
numpy>=1.24.0
scipy>=1.10.0
xarray>=2023.1.0
netCDF4>=1.6.0
h5py>=3.8.0
rasterio>=1.3.0
pysheds>=0.3.0
```

---

### File 2: `models.py` (Unified Neural Network Architecture)
Save as `models.py`:
```python
"""
VAYUNET Complete Neural Architecture:
PatchEmbed -> CrossAttention -> Factorized Spatiotemporal Transformer -> MTL Heads -> Loss
"""

import math
import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Dict, Tuple


class SpatiotemporalPatchEmbed(nn.Module):
    def __init__(self, img_size=32, patch_size=4, in_channels=12, num_frames=4, embed_dim=128, dropout=0.1):
        super().__init__()
        self.patch_size = patch_size
        self.num_frames = num_frames
        self.embed_dim = embed_dim
        self.grid_size = img_size // patch_size
        self.num_patches = self.grid_size * self.grid_size

        self.proj = nn.Conv2d(in_channels, embed_dim, kernel_size=patch_size, stride=patch_size)
        self.norm = nn.LayerNorm(embed_dim)
        self.spatial_pos_embed = nn.Parameter(torch.zeros(1, 1, self.num_patches, embed_dim))
        self.temporal_pos_embed = nn.Parameter(torch.zeros(1, num_frames, 1, embed_dim))
        self.dropout = nn.Dropout(dropout)
        self._init_weights()

    def _init_weights(self):
        nn.init.trunc_normal_(self.spatial_pos_embed, std=0.02)
        nn.init.trunc_normal_(self.temporal_pos_embed, std=0.02)

    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, Tuple[int, int]]:
        B, T, C, H, W = x.shape
        x_flat = x.view(B * T, C, H, W)
        feat = self.proj(x_flat)
        H_out, W_out = feat.shape[2], feat.shape[3]
        feat = feat.flatten(2).transpose(1, 2)
        feat = self.norm(feat)
        tokens = feat.view(B, T, self.num_patches, self.embed_dim)
        tokens = tokens + self.spatial_pos_embed + self.temporal_pos_embed
        return self.dropout(tokens), (H_out, W_out)


class MultiModalCrossAttentionFusion(nn.Module):
    def __init__(self, embed_dim=128, num_heads=4, mlp_ratio=2.0, dropout=0.1):
        super().__init__()
        self.embed_dim = embed_dim
        self.num_heads = num_heads
        self.head_dim = embed_dim // num_heads

        self.q_proj = nn.Linear(embed_dim, embed_dim)
        self.k_proj = nn.Linear(embed_dim, embed_dim)
        self.v_proj = nn.Linear(embed_dim, embed_dim)
        self.out_proj = nn.Linear(embed_dim, embed_dim)

        self.norm_q = nn.LayerNorm(embed_dim)
        self.norm_ctx = nn.LayerNorm(embed_dim)
        self.norm_post = nn.LayerNorm(embed_dim)

        mlp_hidden = int(embed_dim * mlp_ratio)
        self.mlp = nn.Sequential(
            nn.Linear(embed_dim, mlp_hidden),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(mlp_hidden, embed_dim),
            nn.Dropout(dropout)
        )
        self.dropout = nn.Dropout(dropout)
        self.scale = 1.0 / math.sqrt(self.head_dim)

    def forward(self, q_tokens: torch.Tensor, ctx_tokens: torch.Tensor) -> torch.Tensor:
        B, N, D = q_tokens.shape
        M = ctx_tokens.shape[1]

        q = self.q_proj(self.norm_q(q_tokens)).view(B, N, self.num_heads, self.head_dim).transpose(1, 2)
        k = self.k_proj(self.norm_ctx(ctx_tokens)).view(B, M, self.num_heads, self.head_dim).transpose(1, 2)
        v = self.v_proj(self.norm_ctx(ctx_tokens)).view(B, M, self.num_heads, self.head_dim).transpose(1, 2)

        attn = torch.softmax(torch.matmul(q, k.transpose(-2, -1)) * self.scale, dim=-1)
        out = torch.matmul(self.dropout(attn), v).transpose(1, 2).contiguous().view(B, N, D)
        out = self.out_proj(out)
        x = q_tokens + self.dropout(out)
        return x + self.mlp(self.norm_post(x))


class SpatiotemporalTransformerBlock(nn.Module):
    def __init__(self, embed_dim=128, num_heads=8, mlp_ratio=2.0, dropout=0.1):
        super().__init__()
        self.spatial_norm = nn.LayerNorm(embed_dim)
        self.spatial_qkv = nn.Linear(embed_dim, embed_dim * 3)
        self.spatial_proj = nn.Linear(embed_dim, embed_dim)

        self.temporal_norm = nn.LayerNorm(embed_dim)
        self.temporal_qkv = nn.Linear(embed_dim, embed_dim * 3)
        self.temporal_proj = nn.Linear(embed_dim, embed_dim)

        self.mlp_norm = nn.LayerNorm(embed_dim)
        mlp_hidden = int(embed_dim * mlp_ratio)
        self.mlp = nn.Sequential(
            nn.Linear(embed_dim, mlp_hidden),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(mlp_hidden, embed_dim),
            nn.Dropout(dropout)
        )
        self.num_heads = num_heads
        self.head_dim = embed_dim // num_heads
        self.scale = 1.0 / math.sqrt(self.head_dim)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        B, T, N, D = x.shape
        # 1. Spatial Attention
        xn = self.spatial_norm(x).view(B * T, N, D)
        qkv = self.spatial_qkv(xn).view(B * T, N, 3, self.num_heads, self.head_dim).permute(2, 0, 3, 1, 4)
        attn = torch.softmax(torch.matmul(qkv[0], qkv[1].transpose(-2, -1)) * self.scale, dim=-1)
        out_s = self.spatial_proj(torch.matmul(self.dropout(attn), qkv[2]).transpose(1, 2).reshape(B * T, N, D))
        x = x + self.dropout(out_s).view(B, T, N, D)

        # 2. Temporal Attention
        xn = self.temporal_norm(x).permute(0, 2, 1, 3).reshape(B * N, T, D)
        qkv = self.temporal_qkv(xn).view(B * N, T, 3, self.num_heads, self.head_dim).permute(2, 0, 3, 1, 4)
        attn = torch.softmax(torch.matmul(qkv[0], qkv[1].transpose(-2, -1)) * self.scale, dim=-1)
        out_t = self.temporal_proj(torch.matmul(self.dropout(attn), qkv[2]).transpose(1, 2).reshape(B * N, T, D))
        x = x + self.dropout(out_t).view(B, N, T, D).permute(0, 2, 1, 3)

        # 3. Feed-Forward
        return x + self.mlp(self.mlp_norm(x))


class ConvUpsampleBlock(nn.Module):
    def __init__(self, in_ch, out_ch):
        super().__init__()
        self.block = nn.Sequential(
            nn.ConvTranspose2d(in_ch, out_ch, kernel_size=2, stride=2),
            nn.GroupNorm(min(8, out_ch), out_ch),
            nn.GELU(),
            nn.Conv2d(out_ch, out_ch, kernel_size=3, padding=1),
            nn.GroupNorm(min(8, out_ch), out_ch),
            nn.GELU()
        )

    def forward(self, x):
        return self.block(x)


class VayunetMTLModel(nn.Module):
    def __init__(self, img_size=32, patch_size=4, in_channels=12, num_frames=4, embed_dim=128, depth=4, num_heads=8):
        super().__init__()
        self.img_size = img_size
        self.patch_size = patch_size
        self.embed_dim = embed_dim

        self.patch_embed = SpatiotemporalPatchEmbed(img_size, patch_size, in_channels, num_frames, embed_dim)
        self.cross_modal_fusion = MultiModalCrossAttentionFusion(embed_dim, num_heads=4)
        self.blocks = nn.ModuleList([SpatiotemporalTransformerBlock(embed_dim, num_heads) for _ in range(depth)])
        self.final_norm = nn.LayerNorm(embed_dim)

        # Head 1: Thunderstorm
        self.ts_head = nn.Sequential(
            ConvUpsampleBlock(embed_dim, 64),
            ConvUpsampleBlock(64, 32),
            nn.Conv2d(32, 1, kernel_size=3, padding=1)
        )
        # Head 2: Cloudburst
        self.cb_head = nn.Sequential(
            ConvUpsampleBlock(embed_dim, 64),
            nn.Conv2d(64, 64, kernel_size=3, padding=1),
            nn.GroupNorm(8, 64),
            nn.GELU(),
            ConvUpsampleBlock(64, 32),
            nn.Conv2d(32, 1, kernel_size=3, padding=1)
        )
        # Head 3: Flash Flood (Coupled with CartoDEM)
        self.ff_feat_upsample = nn.Sequential(
            ConvUpsampleBlock(embed_dim, 64),
            ConvUpsampleBlock(64, 32)
        )
        self.ff_router = nn.Sequential(
            nn.Conv2d(32 + 1 + 3, 64, kernel_size=3, padding=1),  # feat (32) + cloudburst (1) + CartoDEM (3)
            nn.GroupNorm(8, 64),
            nn.GELU(),
            nn.Conv2d(64, 32, kernel_size=3, padding=1),
            nn.GroupNorm(4, 32),
            nn.GELU(),
            nn.Conv2d(32, 1, kernel_size=3, padding=1)
        )

    def forward(self, x: torch.Tensor) -> Dict[str, torch.Tensor]:
        B, T, C, H, W = x.shape
        grid_h = H // self.patch_size
        grid_w = W // self.patch_size
        topography = x[:, -1, 9:12, :, :]
        elevation = topography[:, 0:1, :, :]

        tokens, _ = self.patch_embed(x)
        current_state = tokens[:, -1, :, :]
        ctx = tokens[:, :-1, :, :].reshape(B, (T - 1) * tokens.shape[2], self.embed_dim)
        fused_state = self.cross_modal_fusion(current_state, ctx)
        tokens = torch.cat([tokens[:, :-1, :, :], fused_state.unsqueeze(1)], dim=1)

        for blk in self.blocks:
            tokens = blk(tokens)
        latent = self.final_norm(tokens[:, -1, :, :]).transpose(1, 2).view(B, self.embed_dim, grid_h, grid_w)

        ts_logits = self.ts_head(latent)
        cb_logits = self.cb_head(latent)
        ff_feat = self.ff_feat_upsample(latent)
        ff_input = torch.cat([ff_feat, torch.sigmoid(cb_logits), topography], dim=1)
        ff_logits = self.ff_router(ff_input)

        return {
            "thunderstorm": ts_logits,
            "cloudburst": cb_logits,
            "flash_flood": ff_logits,
            "elevation": elevation
        }


class VayunetMultiTaskLoss(nn.Module):
    def __init__(self, gamma=2.5, alpha=0.85):
        super().__init__()
        self.gamma = gamma
        self.alpha = alpha
        sobel_x = torch.tensor([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], dtype=torch.float32).view(1, 1, 3, 3) / 8.0
        sobel_y = torch.tensor([[-1, -2, -1], [0, 0, 0], [1, 2, 1]], dtype=torch.float32).view(1, 1, 3, 3) / 8.0
        self.register_buffer("sobel_x", sobel_x)
        self.register_buffer("sobel_y", sobel_y)

    def _focal_loss(self, logits, targets, alpha=0.8, gamma=2.0):
        bce = F.binary_cross_entropy_with_logits(logits, targets, reduction="none")
        p = torch.sigmoid(logits)
        p_t = targets * p + (1 - targets) * (1 - p)
        a_t = targets * alpha + (1 - targets) * (1 - alpha)
        return (a_t * torch.pow(1.0 - p_t, gamma) * bce).mean()

    def forward(self, preds: Dict[str, torch.Tensor], targets: Dict[str, torch.Tensor], elevation: torch.Tensor):
        l_ts = self._focal_loss(preds["thunderstorm"], targets["thunderstorm"], alpha=0.75, gamma=2.0)
        l_cb = self._focal_loss(preds["cloudburst"], targets["cloudburst"], alpha=self.alpha, gamma=self.gamma)
        l_ff = self._focal_loss(preds["flash_flood"], targets["flash_flood"], alpha=0.75, gamma=2.0)

        # Uphill flood regularization penalty
        sobel_x = self.sobel_x.to(elevation.device)
        sobel_y = self.sobel_y.to(elevation.device)
        gz_x = F.conv2d(elevation, sobel_x, padding=1)
        gz_y = F.conv2d(elevation, sobel_y, padding=1)
        gp_x = F.conv2d(torch.sigmoid(preds["flash_flood"]), sobel_x, padding=1)
        gp_y = F.conv2d(torch.sigmoid(preds["flash_flood"]), sobel_y, padding=1)
        l_hydro = F.relu(gp_x * gz_x + gp_y * gz_y).mean()

        total = 1.0 * l_ts + 2.5 * l_cb + 1.5 * l_ff + 0.5 * l_hydro
        return total, {"total": total.item(), "cb": l_cb.item(), "ff": l_ff.item(), "hydro": l_hydro.item()}
```

---

### File 3: `train.py` (Standalone Training Runner)
Save as `train.py`:
```python
"""
VAYUNET Standalone Training Script:
Auto-detects Apple Silicon (MPS), NVIDIA CUDA, or CPU.
Runs training, logs CSI/POD/FAR metrics, and saves 'vayunet_mtl_best.pt'.
"""

import os
import time
import argparse
import numpy as np
import torch
from torch.utils.data import Dataset, DataLoader
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR

from models import VayunetMTLModel, VayunetMultiTaskLoss


class SyntheticConvectiveDataset(Dataset):
    """
    Realistic multi-hazard meteorological tensor generator based on
    Dharamsala 2021 & Wayanad 2024 convective case studies.
    """
    def __init__(self, num_samples=300, img_size=32, num_frames=4, seed=42):
        self.num_samples = num_samples
        self.img_size = img_size
        self.num_frames = num_frames
        self.rng = np.random.RandomState(seed)

    def __len__(self):
        return self.num_samples

    def __getitem__(self, idx):
        H, W, T = self.img_size, self.img_size, self.num_frames
        y, x = np.meshgrid(np.linspace(-1, 1, H), np.linspace(-1, 1, W), indexing="ij")

        elevation = 0.5 * (1.0 - np.exp(-(x**2) / 0.5)) + 0.1 * y
        elevation = np.clip(elevation, 0.0, 1.0)
        gy, gx = np.gradient(elevation)
        slope = np.sqrt(gx**2 + gy**2)
        slope /= (np.max(slope) + 1e-6)
        flow_accum = np.exp(-(x**2) / 0.08) * (1.0 - y * 0.5)
        flow_accum /= (np.max(flow_accum) + 1e-6)

        has_convection = (idx % 3 != 0)
        cx = self.rng.uniform(-0.3, 0.3)
        cy = self.rng.uniform(-0.3, 0.3)
        drift_x = self.rng.uniform(-0.04, 0.04)
        drift_y = self.rng.uniform(-0.04, 0.04)

        frames = []
        for t in range(T):
            dist_sq = (x - (cx + t * drift_x))**2 + (y - (cy + t * drift_y))**2
            if has_convection:
                intensity = 0.4 + 0.6 * (t / max(1, T - 1))
                wv = 0.4 + 0.5 * intensity * np.exp(-dist_sq / 0.2)
                tir = 0.8 - 0.7 * intensity * np.exp(-dist_sq / 0.15)
                ctt_rate = -0.2 - 0.8 * intensity * np.exp(-dist_sq / 0.12)
                cape = (0.5 + 0.4 * np.exp(-((y - 0.2)**2) / 0.8))
                cin = 0.3 * (1.0 - np.exp(-dist_sq / 0.3))
                lcl = 0.4 * np.ones((H, W))
                shear = 0.6 * np.ones((H, W))
                iwv = 0.6 + 0.35 * np.exp(-dist_sq / 0.4)
                m_flux = 0.3 + 0.6 * intensity * np.exp(-dist_sq / 0.25)
            else:
                wv = 0.2 + 0.1 * self.rng.rand(H, W)
                tir = 0.7 + 0.1 * self.rng.rand(H, W)
                ctt_rate = 0.05 * self.rng.randn(H, W)
                cape = 0.2 * np.ones((H, W))
                cin = 0.7 * np.ones((H, W))
                lcl = 0.5 * np.ones((H, W))
                shear = 0.3 * np.ones((H, W))
                iwv = 0.3 + 0.1 * self.rng.rand(H, W)
                m_flux = 0.1 * np.ones((H, W))

            frame = np.stack([wv, tir, ctt_rate, cape, cin, lcl, shear, iwv, m_flux, elevation, slope, flow_accum], axis=0)
            frames.append(frame)

        x_tensor = torch.tensor(np.stack(frames, axis=0), dtype=torch.float32)

        if has_convection:
            final_dist = (x - (cx + (T - 1) * drift_x))**2 + (y - (cy + (T - 1) * drift_y))**2
            ts_target = (final_dist < 0.18).astype(np.float32)
            cb_target = (final_dist < 0.06).astype(np.float32)
            ff_target = (cb_target * (flow_accum > 0.4) > 0.3).astype(np.float32)
        else:
            ts_target = np.zeros((H, W), dtype=np.float32)
            cb_target = np.zeros((H, W), dtype=np.float32)
            ff_target = np.zeros((H, W), dtype=np.float32)

        targets = {
            "thunderstorm": torch.tensor(ts_target).unsqueeze(0),
            "cloudburst": torch.tensor(cb_target).unsqueeze(0),
            "flash_flood": torch.tensor(ff_target).unsqueeze(0)
        }
        return x_tensor, targets


def compute_csi_pod_far(preds_prob: torch.Tensor, targets: torch.Tensor, thresh=0.5):
    p = (preds_prob >= thresh).float()
    t = (targets >= 0.5).float()
    hits = ((p == 1) & (t == 1)).sum().item()
    fa = ((p == 1) & (t == 0)).sum().item()
    miss = ((p == 0) & (t == 1)).sum().item()
    pod = hits / (hits + miss + 1e-6)
    far = fa / (hits + fa + 1e-6)
    csi = hits / (hits + miss + fa + 1e-6)
    return csi, pod, far


def main():
    parser = argparse.ArgumentParser(description="Train VAYUNET Model")
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--batch_size", type=int, default=8)
    parser.add_argument("--lr", type=float, default=3e-4)
    parser.add_argument("--device", type=str, default="auto")
    parser.add_argument("--save_path", type=str, default="vayunet_mtl_best.pt")
    args = parser.parse_args()

    # Device detection
    if args.device == "auto":
        if torch.cuda.is_available():
            device = torch.device("cuda")
        elif torch.backends.mps.is_available():
            device = torch.device("mps")
        else:
            device = torch.device("cpu")
    else:
        device = torch.device(args.device)

    print(f"🚀 Training VAYUNET on device: {device}")

    train_ds = SyntheticConvectiveDataset(num_samples=320, seed=42)
    val_ds = SyntheticConvectiveDataset(num_samples=64, seed=999)
    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, shuffle=False)

    model = VayunetMTLModel(img_size=32, patch_size=4, in_channels=12, num_frames=4, embed_dim=128, depth=4).to(device)
    criterion = VayunetMultiTaskLoss(gamma=2.5, alpha=0.85).to(device)
    optimizer = AdamW(model.parameters(), lr=args.lr, weight_decay=1e-4)
    scheduler = CosineAnnealingLR(optimizer, T_max=args.epochs)

    best_loss = float("inf")
    for epoch in range(1, args.epochs + 1):
        model.train()
        train_loss = 0.0
        for x, targets in train_loader:
            x = x.to(device)
            targets = {k: v.to(device) for k, v in targets.items()}
            optimizer.zero_grad()
            preds = model(x)
            loss, _ = criterion(preds, targets, preds["elevation"])
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            train_loss += loss.item()
        scheduler.step()

        # Validation
        model.eval()
        val_loss = 0.0
        cb_preds_all, cb_targets_all = [], []
        with torch.no_grad():
            for x, targets in val_loader:
                x = x.to(device)
                targets_dev = {k: v.to(device) for k, v in targets.items()}
                preds = model(x)
                loss, _ = criterion(preds, targets_dev, preds["elevation"])
                val_loss += loss.item()
                cb_preds_all.append(torch.sigmoid(preds["cloudburst"]).cpu())
                cb_targets_all.append(targets["cloudburst"])

        val_loss /= len(val_loader)
        cb_csi, cb_pod, cb_far = compute_csi_pod_far(torch.cat(cb_preds_all), torch.cat(cb_targets_all))
        print(f"Epoch [{epoch}/{args.epochs}] Loss: {val_loss:.4f} | Cloudburst [CSI: {cb_csi:.2f}, POD: {cb_pod:.2f}, FAR: {cb_far:.2f}]")

        if val_loss < best_loss:
            best_loss = val_loss
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "val_loss": best_loss,
                "metrics": {"cb_csi": cb_csi, "cb_pod": cb_pod, "cb_far": cb_far}
            }, args.save_path)
            print(f"   ⭐ Saved best checkpoint to: {args.save_path}")

    print(f"\n🎉 Done! Copy '{args.save_path}' to the main project's 'checkpoints/' folder.")


if __name__ == "__main__":
    main()
```

---

## 8. Summary Checklist Before Handover

Before handing over your trained file to the team:
- [ ] Model weights are saved as `vayunet_mtl_best.pt` using `torch.save()`.
- [ ] Checkpoint was tested with `torch.load(..., map_location="cpu")` and completes a sample forward pass without error.
- [ ] The inference forward pass takes $<180\text{ ms}$ on CPU or $<30\text{ ms}$ on GPU/MPS.
- [ ] Cloudburst Critical Success Index ($\text{CSI}$) is $\ge 0.70$ and Probability of Detection ($\text{POD}$) is $\ge 0.85$.
- [ ] Normalization min/max constants are documented in `model_metadata.json`.
- [ ] You only email / drive-share the `.pt` and `.json` files (no raw satellite archives).
