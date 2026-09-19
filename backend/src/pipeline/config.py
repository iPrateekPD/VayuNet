"""
VAYUNET Pipeline Configuration & Safeguards Specification
Single source of truth for spatiotemporal grid, chronological splits, and multi-modal channels.
"""

from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Any


@dataclass
class PipelineConfig:
    # 1. Geographic Domain (Wayanad / Calicut / Malappuram Convective Basin)
    # Exactly matches ISRO CartoDEM tile P5_PAN_CD_N11_000_E075_000 (11.0°N - 12.0°N, 75.0°E - 76.0°E)
    # Extent ~111 km x ~109 km -> at 32x32 grid cells, cell resolution is ~3.45 km (~4 km nominal).
    bbox_north: float = 12.0
    bbox_south: float = 11.0
    bbox_east: float = 76.0
    bbox_west: float = 75.0
    grid_size: int = 32
    target_resolution_km: float = 3.5

    # 2. Spatiotemporal Dimensions (Input Tensor: B x T=4 x C=12 x H=32 x W=32)
    num_frames: int = 4
    frame_cadence_minutes: int = 30
    in_channels: int = 12

    # 3. Non-Overlapping Chronological Splits (Anti-Leakage Safeguard)
    # Split strictly by timeline to prevent consecutive storm frames leaking across train/val/test:
    split_train_start: str = "2018-08-01"
    split_train_end: str = "2018-08-11"
    split_val_start: str = "2018-08-12"
    split_val_end: str = "2018-08-16"
    split_test_start: str = "2018-08-17"
    split_test_end: str = "2018-08-25"

    # 4. Multi-Hazard Target Definitions
    targets: List[str] = field(default_factory=lambda: ["thunderstorm", "cloudburst", "flash_flood"])

    # 5. Project Directory Paths (Relative to Project Root)
    project_root: Path = field(default_factory=lambda: Path(__file__).resolve().parent.parent.parent)
    raw_satellite_dir: Path = field(default_factory=lambda: Path("data/raw/satellite/himawari_2018-08"))
    raw_dem_dir: Path = field(default_factory=lambda: Path("data/raw/dem/P5_PAN_CD_N11_000_E075_000_30m"))
    raw_hourly_dir: Path = field(default_factory=lambda: Path("data/raw/reanalysis/hourly_dataset"))
    raw_pressure_dir: Path = field(default_factory=lambda: Path("data/raw/reanalysis/pressure_dataset"))
    raw_rainfall_dir: Path = field(default_factory=lambda: Path("data/raw/ground_truth/imd_rainfall/IMD_rainfall_NetCdf"))
    raw_landslides_dir: Path = field(default_factory=lambda: Path("data/raw/ground_truth/landslides/landslide_kerala_2018"))
    interim_dir: Path = field(default_factory=lambda: Path("data/interim"))
    processed_dir: Path = field(default_factory=lambda: Path("data/processed"))
    checkpoints_dir: Path = field(default_factory=lambda: Path("checkpoints"))

    # 6. Physical Channel Specification (Ordered 0 to 11)
    channel_metadata: List[Dict[str, Any]] = field(default_factory=lambda: [
        {"index": 0, "name": "insat_wv_6.7", "unit": "K", "min": 200.0, "max": 260.0},
        {"index": 1, "name": "insat_tir1_10.8", "unit": "K", "min": 190.0, "max": 310.0},
        {"index": 2, "name": "ctt_drop_rate_c_hr", "unit": "degC/hr", "min": -25.0, "max": 5.0},
        {"index": 3, "name": "cape_j_kg", "unit": "J/kg", "min": 0.0, "max": 4500.0},
        {"index": 4, "name": "cin_j_kg", "unit": "J/kg", "min": -300.0, "max": 0.0},
        {"index": 5, "name": "lcl_m", "unit": "m", "min": 200.0, "max": 2500.0},
        {"index": 6, "name": "shear_0_6km_kt", "unit": "kt", "min": 0.0, "max": 70.0},
        {"index": 7, "name": "iwv_mm", "unit": "mm", "min": 10.0, "max": 75.0},
        {"index": 8, "name": "moisture_flux_850", "unit": "g/kg/s", "min": -0.05, "max": 0.05},
        {"index": 9, "name": "elevation_m", "unit": "m", "min": 0.0, "max": 2500.0},
        {"index": 10, "name": "slope_deg", "unit": "deg", "min": 0.0, "max": 60.0},
        {"index": 11, "name": "flow_accumulation_log", "unit": "log(1+A)", "min": 0.0, "max": 15.0},
    ])

    def get_full_path(self, rel_path: Path) -> Path:
        """Resolves path relative to project root."""
        if rel_path.is_absolute():
            return rel_path
        return (self.project_root / rel_path).resolve()
