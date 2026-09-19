import urllib.request
import json

locations = ['kangra', 'chamoli', 'mumbai', 'wayanad', 'rudraprayag', 'pithoragarh', 'uttarkashi']
for loc in locations:
    url = f"http://127.0.0.1:8000/api/locations/{loc}/nowcast"
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read().decode())
            w = data.get("weather", {})
            p = data.get("predictions", {})
            h = data.get("historical_baseline", {})
            m = data.get("model", {})
            prim = data.get("primary_hazard", {})
            print(f"[{loc.upper()}] status={data.get('status')} infer_avail={data.get('model_inference_available')} lat={m.get('inference_latency_ms')}ms")
            print(f"   Weather: temp={w.get('temperature_2m_c')}C, rh={w.get('relative_humidity_pct')}%, rain={w.get('rain_mm')}mm, cape={w.get('cape_j_kg')}, iwv={w.get('iwv_kg_m2')}")
            print(f"   Disaster: top={prim.get('hazard')} ({prim.get('regional_disaster_type')}) score={prim.get('risk_score')} alert={prim.get('alert_level')}")
            print(f"   Historical: benchmark={h.get('benchmark_event')} match={h.get('precursor_match_pct')}% status={h.get('threat_status')}")
            print(f"   Verdict: {data.get('scientific_verdict')[:120]}...")
            print("-" * 75)
    except Exception as e:
        print(f"[{loc.upper()}] FAILED: {e}")
