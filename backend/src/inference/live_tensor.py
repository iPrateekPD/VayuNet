"""
VAYUNET Live Tensor Builder
Attempts to construct the 12-channel model tensor from live data.
Implements strict anti-fabrication validation.
"""
from typing import Dict, Any, Tuple
import torch

def build_live_tensor(live_data: Dict[str, Any]) -> Tuple[bool, str, Any]:
    """
    Attempts to build the [B, 4, 12, 32, 32] tensor required by the model.
    Checks for the presence of required physical channels.
    
    Returns:
        (is_valid: bool, reason: str, tensor: torch.Tensor or None)
    """
    if live_data.get("status") != "success":
        return False, f"Live data fetch failed: {live_data.get('error', {}).get('message', 'Unknown error')}", None
        
    # The VAYUNET model contract requires 12 specific channels:
    # 0: WV, 1: TIR, 2: CTT Drop Rate
    # 3: CAPE, 4: CIN, 5: LCL, 6: Shear, 7: IWV, 8: Moisture Flux
    # 9: Elevation, 10: Slope, 11: Flow Accumulation
    
    # Check for satellite variables which Open-Meteo cannot provide natively
    missing_vars = []
    
    # We don't have these in Open-Meteo
    satellite_channels = ["Water Vapor (WV)", "Thermal IR (TIR)", "CTT Drop Rate"]
    missing_vars.extend(satellite_channels)
    
    # While we could fake them with zeros, the user's strict rules forbid fabricating
    # ML inputs that don't match the semantics of the training distribution.
    if missing_vars:
        reason = "Insufficient live observations for model-compatible input. Missing satellite telemetry."
        return False, reason, None
        
    # In a fully operational system with INSAT-3D/3DR integration, we would construct
    # the tensor here using spatial interpolation and the normalization.json statistics.
    
    return True, "Valid", None
