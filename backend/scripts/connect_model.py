import re

filepath = r"d:\PROJECTS\VayuNet-main\backend\api\routes\risk_routes.py"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

old_logic = """    # Determine mock VAYUNET risks based on some real data (dummy logic for safety)
    # The actual V3 model inference would go here.
    
    payload = {
        "region": region,
        "timestamp": now,
        "observations": {
            "aws": aws_data,
            "radar": radar_data
        },
        "official_information": {
            "imd_warnings": warnings_data,
            "imd_nowcast": nowcast_data
        },
        "vayunet": {
            "model_version": "V4.0",
            "hazards": {
                "thunderstorm": {
                    "probability": 0.0 if aws_data.get("status") == "DATA_UNAVAILABLE" else 0.0,
                    "risk_level": "UNKNOWN" if aws_data.get("status") == "DATA_UNAVAILABLE" else "MODERATE",
                    "trend": "STABLE"
                }
            }
        },
        "data_quality": {
            "overall": "GOOD" if aws_data.get("status") == "LIVE" else "DEGRADED"
        }
    }"""

new_logic = """    # Live VAYUNET ML V3 Inference
    from api.main import ai_engine, adapter
    
    vayunet_payload = {
        "model_version": "VAYUNET-MTL-V3.0",
        "status": "UNKNOWN",
        "hazards": {
            "thunderstorm": {"probability": 0.0, "risk_level": "UNKNOWN", "trend": "STABLE"},
            "cloudburst": {"probability": 0.0, "risk_level": "UNKNOWN", "trend": "STABLE"},
            "flash_flood": {"probability": 0.0, "risk_level": "UNKNOWN", "trend": "STABLE"}
        },
        "xai_attribution": {}
    }
    
    if ai_engine and adapter and aws_data.get("status") != "DATA_UNAVAILABLE":
        try:
            # Build adapter payload
            live_weather_payload = {
                "location": {"id": region, "lat": aws_data.get("latitude_deg", 20.0), "lng": aws_data.get("longitude_deg", 80.0)},
                "weather": {"antecedent_rainfall_72h": 0.0},
                "_temporal_history": {
                    "temperature_2m": [aws_data.get("temperature_c", 25.0)] * 4,
                    "relative_humidity_2m": [aws_data.get("humidity_pct", 80.0)] * 4,
                    "surface_pressure": [aws_data.get("pressure_hpa", 1010.0)] * 4,
                    "wind_speed_10m": [aws_data.get("wind_speed_ms", 5.0) * 3.6] * 4,
                }
            }
            # Generate 4-frame (12-channel) input tensor
            tensor = adapter.build_inference_tensor(live_weather_payload)
            # Run deep learning model forward pass
            pred = ai_engine.predict_tensor(tensor)
            
            # Map predictions to output
            vayunet_payload["status"] = pred["status"]
            vayunet_payload["xai_attribution"] = pred.get("xai_attribution", {})
            for haz in ["thunderstorm", "cloudburst", "flash_flood"]:
                prob = pred["hazard_probabilities"].get(haz, 0) / 100.0
                rl = "SAFE"
                if prob > 0.35: rl = "MODERATE"
                if prob > 0.60: rl = "HIGH"
                if prob > 0.80: rl = "EXTREME"
                vayunet_payload["hazards"][haz] = {
                    "probability": round(prob, 2),
                    "risk_level": rl,
                    "trend": "STABLE"
                }
        except Exception as e:
            print(f"[VAYUNET INFERENCE ERROR]: {e}")

    payload = {
        "region": region,
        "timestamp": now,
        "observations": {
            "aws": aws_data,
            "radar": radar_data
        },
        "official_information": {
            "imd_warnings": warnings_data,
            "imd_nowcast": nowcast_data
        },
        "vayunet": vayunet_payload,
        "data_quality": {
            "overall": "GOOD" if aws_data.get("status") == "LIVE" else "DEGRADED"
        }
    }"""

content = content.replace(old_logic, new_logic)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Wired V3 model into API!")
