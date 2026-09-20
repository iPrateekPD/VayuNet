#!/usr/bin/env python3
"""
VAYUNET Backtesting Engine (SIH 26077)
Evaluates model lead-time performance using Open-Meteo Historical Forecast Archive.
Simulates what VAYUNET would have predicted at T-48h, T-24h, T-12h, T-6h, and T-0h before a disaster.
"""

import sys
import argparse
import asyncio
import httpx
from datetime import datetime, timedelta, timezone
from pathlib import Path
from rich.console import Console
from rich.table import Table

# Ensure project root is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.inference.feature_adapter import VayunetFeatureAdapter
from src.inference.predictor import VayunetPredictor
from src.risk.alert_engine import determine_primary_hazard

console = Console()
IST_OFFSET = timezone(timedelta(hours=5, minutes=30))


async def fetch_archived_forecast(lat: float, lng: float, target_time: datetime, lead_time_hours: int) -> dict:
    """Fetches a historical forecast that was issued `lead_time_hours` before `target_time`."""
    simulated_now = target_time - timedelta(hours=lead_time_hours)
    
    url = "https://archive-api.open-meteo.com/v1/archive"
    params = {
        "latitude": round(lat, 4),
        "longitude": round(lng, 4),
        "start_date": (simulated_now - timedelta(days=3)).strftime("%Y-%m-%d"),
        "end_date": simulated_now.strftime("%Y-%m-%d"),
        "hourly": (
            "temperature_2m,relative_humidity_2m,surface_pressure,"
            "precipitation,wind_speed_10m,wind_direction_10m,wind_gusts_10m"
        ),
        "timezone": "UTC"
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()
        
    hourly = data.get("hourly", {})
    times = hourly.get("time", [])
    
    simulated_now_str = simulated_now.strftime("%Y-%m-%dT%H:00")
    try:
        idx = times.index(simulated_now_str)
    except ValueError:
        idx = len(times) - 1
        
    start_idx = max(0, idx - 72)
    
    temps = hourly.get("temperature_2m", [])[start_idx:idx+1]
    rhs = hourly.get("relative_humidity_2m", [])[start_idx:idx+1]
    pressures = hourly.get("surface_pressure", [])[start_idx:idx+1]
    precips = hourly.get("precipitation", [])[start_idx:idx+1]
    winds = hourly.get("wind_speed_10m", [])[start_idx:idx+1]
    wind_dirs = hourly.get("wind_direction_10m", [])[start_idx:idx+1]
    gusts = hourly.get("wind_gusts_10m", [])[start_idx:idx+1]

    cape_list = []
    cin_list = []
    iwv_list = []
    
    for t, rh, p in zip(temps, rhs, pressures):
        if t is None or rh is None or p is None:
            cape_list.append(0)
            cin_list.append(0)
            iwv_list.append(30.0)
            continue
            
        cape = max(0, (t - 20) * 100 * (rh / 80)) 
        cape_list.append(cape)
        cin_list.append(-10 if cape > 500 else -50)
        
        e_sat_hpa = 6.112 * (2.71828 ** ((17.67 * t) / (t + 243.5)))
        e_act_hpa = e_sat_hpa * (rh / 100.0)
        iwv_list.append(round(max(5.0, min(85.0, (e_act_hpa * 1.85) + 8.5)), 1))
        
    antecedent_rain = sum(filter(None, precips))
    p_tendency = (pressures[-1] - pressures[-25]) if len(pressures) >= 25 and pressures[-1] and pressures[-25] else 0.0
    cape_persist = sum(1 for c in reversed(cape_list) if c > 1000)
    
    current = {
        "temperature_2m_c": temps[-1] if temps else 25.0,
        "relative_humidity_pct": rhs[-1] if rhs else 80.0,
        "surface_pressure_hpa": pressures[-1] if pressures else 1010.0,
        "precipitation_mm": precips[-1] if precips else 0.0,
        "rain_mm": precips[-1] if precips else 0.0,
        "wind_speed_kmh": winds[-1] if winds else 10.0,
        "wind_direction_deg": wind_dirs[-1] if wind_dirs else 0.0,
        "wind_gusts_kmh": gusts[-1] if gusts else 15.0,
        "cape_j_kg": cape_list[-1],
        "cin_j_kg": cin_list[-1],
        "iwv_kg_m2": iwv_list[-1],
        "antecedent_rainfall_72h": antecedent_rain,
        "pressure_tendency_24h": p_tendency,
        "cape_persistence_hours": cape_persist
    }
    
    history = {
        "temperature_2m": temps[-6:], 
        "relative_humidity_2m": rhs[-6:],
        "surface_pressure": pressures[-6:],
        "cape": cape_list[-6:],
        "cin": cin_list[-6:],
        "iwv": iwv_list[-6:],
        "wind_speed_10m": winds[-6:]
    }

    return {
        "location": {"lat": lat, "lng": lng, "id": "wayanad"},
        "weather": current,
        "_temporal_history": history
    }


async def run_backtest(lat: float, lng: float, event_date_str: str, location_id: str):
    console.print(f"[bold cyan]Starting VAYUNET Backtest[/bold cyan]")
    console.print(f"Location: {location_id} ({lat}, {lng})")
    console.print(f"Event Time: {event_date_str} UTC")
    
    target_time = datetime.strptime(event_date_str, "%Y-%m-%dT%H:%M").replace(tzinfo=timezone.utc)
    lead_times_hours = [48, 24, 12, 6, 2, 0]
    
    adapter = VayunetFeatureAdapter()
    predictor = VayunetPredictor()
    
    table = Table(title=f"VAYUNET Backtest: {location_id.upper()} ({event_date_str})")
    table.add_column("Lead Time", justify="right", style="cyan")
    table.add_column("Simulated Time", style="magenta")
    table.add_column("72h Rain (API)", justify="right", style="green")
    table.add_column("CAPE", justify="right", style="yellow")
    table.add_column("Thunderstorm", justify="right")
    table.add_column("Cloudburst", justify="right")
    table.add_column("Flash Flood", justify="right", style="bold red")
    table.add_column("Alert Level", style="bold")
    
    for lead_time in lead_times_hours:
        sim_time = target_time - timedelta(hours=lead_time)
        
        try:
            live_payload = await fetch_archived_forecast(lat, lng, target_time, lead_time)
            
            tensor = adapter.build_inference_tensor(live_payload)
            result = predictor.predict(tensor, location_id=location_id, live_weather=live_payload)
            
            preds = result["predictions"]
            prim_hazard, max_score, alert_lvl = determine_primary_hazard(preds)
            
            w = live_payload["weather"]
            
            table.add_row(
                f"T-{lead_time}h",
                sim_time.strftime("%Y-%m-%d %H:%M UTC"),
                f"{w['antecedent_rainfall_72h']:.1f} mm",
                f"{w['cape_j_kg']:.0f} J/kg",
                f"{preds['thunderstorm']:.3f}",
                f"{preds['cloudburst']:.3f}",
                f"{preds['flash_flood']:.3f}",
                f"[{alert_lvl.lower()}]{alert_lvl}[/]"
            )
        except Exception as e:
            import traceback
            console.print(f"[red]Error at T-{lead_time}h: {e}[/red]")
            console.print(traceback.format_exc())
            
    console.print(table)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="VAYUNET Backtesting via Open-Meteo Archive")
    parser.add_argument("--lat", type=float, default=11.5564, help="Latitude (default Wayanad)")
    parser.add_argument("--lng", type=float, default=76.1320, help="Longitude (default Wayanad)")
    parser.add_argument("--date", type=str, default="2024-07-30T00:00", help="Event date UTC (YYYY-MM-DDTHH:MM)")
    parser.add_argument("--loc", type=str, default="wayanad", help="Location ID")
    
    args = parser.parse_args()
    
    asyncio.run(run_backtest(args.lat, args.lng, args.date, args.loc))
