"""
VAYUNET Spatiotemporal Tensor Builder
Assembles multi-modal input tensors (1, T=4, C=12, H=32, W=32) from raw atmospheric
precursors and CartoDEM parameters for real-time model inference.
"""

import numpy as np
import torch
from typing import Dict, Any


def build_spatiotemporal_tensor_from_precursors(
    precursors: Dict[str, Any],
    grid_size: int = 32,
    num_frames: int = 4
) -> torch.Tensor:
    """
    Constructs a calibrated (1, T, C, H, W) tensor from precursor telemetry:
    - precursors: dict containing 'iwv_mm', 'cape_j_kg', 'cin_j_kg', 'ctt_drop_rate_c_hr',
      'wind_shear_0_6km_kt', 'dem_slope_deg', etc.
    """
    H = grid_size
    W = grid_size
    T = num_frames

    # Extract & normalize inputs
    iwv = float(precursors.get("iwv_mm", 45.0)) / 70.0               # Nominally 0-70 mm
    cape = float(precursors.get("cape_j_kg", 2000.0)) / 4000.0       # Nominally 0-4000 J/kg
    cin = abs(float(precursors.get("cin_j_kg", -20.0))) / 100.0      # Inverted erosion
    ctt_rate = abs(float(precursors.get("ctt_drop_rate_c_hr", -10.0))) / 25.0
    shear = float(precursors.get("wind_shear_0_6km_kt", 30.0)) / 60.0
    slope_deg = float(precursors.get("dem_slope_deg", 25.0)) / 50.0

    y, x = np.meshgrid(np.linspace(-1, 1, H), np.linspace(-1, 1, W), indexing="ij")
    r_sq = x**2 + y**2

    # Elevation & slope field
    elev_grid = 0.5 * (1.0 - np.exp(-x**2 / 0.6)) + 0.1 * y
    slope_grid = slope_deg * np.exp(-r_sq / 0.8)
    flow_accum = np.exp(-x**2 / 0.1) * (1.0 - y * 0.4)

    frames = []
    for t in range(T):
        # Convective temporal evolution factor: t=0 (incipient) to t=3 (culmination)
        t_factor = 0.5 + 0.5 * (t / max(1, T - 1))

        # Channel 0: Water Vapor (6.7 um)
        wv_grid = iwv * 0.8 + 0.2 * t_factor * np.exp(-r_sq / 0.3)
        # Channel 1: Thermal IR (10.8 um) - cold anvil expands
        tir_grid = 0.9 - 0.7 * ctt_rate * t_factor * np.exp(-r_sq / 0.25)
        # Channel 2: CTT Drop Rate
        ctt_grid = -ctt_rate * t_factor * np.exp(-r_sq / 0.2)
        # Channel 3: CAPE
        cape_grid = np.clip(cape * (1.1 - 0.2 * t_factor), 0.0, 1.0) * np.ones((H, W))
        # Channel 4: CIN
        cin_grid = np.clip(cin * (1.0 - 0.7 * t_factor), 0.0, 1.0) * np.ones((H, W))
        # Channel 5: LCL
        lcl_grid = 0.35 * np.ones((H, W))
        # Channel 6: Wind shear
        shear_grid = shear * np.ones((H, W))
        # Channel 7: IWV
        iwv_grid = iwv * (0.9 + 0.2 * t_factor * np.exp(-r_sq / 0.5))
        # Channel 8: Moisture Flux Convergence
        m_flux_grid = (iwv * shear) * t_factor * np.exp(-r_sq / 0.3)

        frame = np.stack([
            wv_grid, tir_grid, ctt_grid, cape_grid, cin_grid, lcl_grid, shear_grid,
            iwv_grid, m_flux_grid, elev_grid, slope_grid, flow_accum
        ], axis=0)  # (12, H, W)
        frames.append(frame)

    tensor_data = np.stack(frames, axis=0)  # (T, 12, H, W)
    tensor = torch.tensor(tensor_data, dtype=torch.float32).unsqueeze(0)  # (1, T, 12, H, W)
    return tensor
