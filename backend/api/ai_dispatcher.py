import os
import json
import time

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None

try:
    import api.bhashini_service as bhashini_service
except ImportError:
    import bhashini_service

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")


def detect_regional_language(location: str) -> tuple[str, str]:
    """
    Infers the predominant state language from location name for hyper-local citizen alerts.
    Returns (lang_code, language_name).
    """
    loc_lower = (location or "").lower()
    if any(k in loc_lower for k in ["kerala", "wayanad", "idukki", "kochi", "trivandrum"]):
        return ("ml", "Malayalam")
    elif any(k in loc_lower for k in ["tamil", "chennai", "nilgiri", "ooty", "coimbatore", "madurai"]):
        return ("ta", "Tamil")
    elif any(k in loc_lower for k in ["andhra", "telangana", "hyderabad", "visakhapatnam", "vijayawada"]):
        return ("te", "Telugu")
    elif any(k in loc_lower for k in ["maharashtra", "mumbai", "pune", "nagpur", "konkan"]):
        return ("mr", "Marathi")
    elif any(k in loc_lower for k in ["bengal", "kolkata", "darjeeling", "siliguri", "sundarbans"]):
        return ("bn", "Bengali")
    elif any(k in loc_lower for k in ["gujarat", "ahmedabad", "surat", "kutch"]):
        return ("gu", "Gujarati")
    elif any(k in loc_lower for k in ["karnataka", "bengaluru", "bangalore", "coorg", "udupi"]):
        return ("kn", "Kannada")
    elif any(k in loc_lower for k in ["punjab", "amritsar", "ludhiana", "jalandhar"]):
        return ("pa", "Punjabi")
    elif any(k in loc_lower for k in ["odisha", "orissa", "puri", "bhubaneswar", "cuttack"]):
        return ("or", "Odia")
    elif any(k in loc_lower for k in ["assam", "guwahati", "kaziranga", "brahmaputra"]):
        return ("as", "Assamese")
    else:
        # Default prominent language for Northern/Central or generic locations (Himachal, Uttarakhand, etc.)
        return ("hi", "Hindi")


def generate_multilingual_alert(
    hazard_type: str,
    severity: str,
    location: str,
    lead_time: str,
    target_language: str = None
) -> dict:
    """
    Generates a localized, multilingual alert (CAP format) and synthesizes regional audio.
    Combines Gemini (or template) with Digital India Bhashini NMT and TTS.
    """
    # Detect target regional language
    detected_code, detected_name = detect_regional_language(location)
    lang_code = target_language if target_language else detected_code

    english_alert = ""
    source_engine = "Digital India Bhashini"

    # Step 1: Generate crisp English alert via Gemini (if configured) or standard CAP template
    if genai and GEMINI_API_KEY:
        try:
            client = genai.Client(api_key=GEMINI_API_KEY)
            prompt = f"""
You are the AI Dispatcher for VAYUNET, a hyper-local severe weather nowcasting system in India.
Generate an emergency broadcast message for a {severity} {hazard_type} warning in {location} with a lead time of {lead_time} hours.
Keep it extremely concise (SMS/CAP format under 150 chars).
Format: 🔴 VAYUNET ALERT: [Hazard] in [Location] within [Lead Time]. [Action instruction]. NDMA: 1078.
"""
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt
            )
            english_alert = response.text.strip().replace("\n", " ")
            source_engine = "Gemini AI + Digital India Bhashini"
        except Exception as e:
            print(f"⚠️ [AI Dispatcher] Gemini API error: {e}. Using deterministic template.")

    if not english_alert:
        english_alert = (
            f"🔴 VAYUNET {severity.upper()} ALERT: Severe {hazard_type} expected in {location} "
            f"within {lead_time} hrs. Evacuate drainage corridors immediately. NDMA Helpline: 1078"
        )

    # Step 2: Use Digital India Bhashini for authentic Neural Translation + TTS Audio
    try:
        pipeline_res = bhashini_service.translate_and_synthesize(
            text=english_alert,
            source_lang="en",
            target_lang=lang_code,
            gender="female"
        )
        regional_alert = pipeline_res.get("translated_text") or english_alert
        audio_base64 = pipeline_res.get("audio_base64", "")
        audio_format = pipeline_res.get("audio_format", "wav")
    except Exception as e:
        print(f"⚠️ [AI Dispatcher] Bhashini pipeline fallback: {e}")
        regional_alert = english_alert
        audio_base64 = ""
        audio_format = "wav"

    return {
        "source": source_engine,
        "english": english_alert,
        "regional": regional_alert,
        "language_code": lang_code,
        "language_name": detected_name,
        "audio_base64": audio_base64,
        "audio_format": audio_format,
        "bhashini_verified": bool(audio_base64)
    }
