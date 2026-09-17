import os
import json
import time

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None

# We can accept an API key from the environment. 
# If not present, we will seamlessly fall back to mock generation.
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

def generate_multilingual_alert(hazard_type: str, severity: str, location: str, lead_time: str) -> dict:
    """
    Generates a localized, multilingual alert (CAP format) using Gemini.
    Falls back to a robust mock if the API key is not configured or an error occurs.
    """
    
    prompt = f"""
You are the AI Dispatcher for VAYUNET, a hyper-local severe weather nowcasting system in India.
Generate an emergency broadcast message for a {severity} {hazard_type} warning in {location} with a lead time of {lead_time}.

The alert needs to be output as a JSON object with two fields: 'english_alert' and 'regional_alert'.
The regional alert should be in the prominent regional language of the area (e.g. Hindi, Malayalam, Marathi).

- Keep it extremely concise (SMS format).
- Include the hazard, location, urgency, and one immediate actionable instruction (e.g. 'Evacuate low-lying areas', 'Move to higher ground').
- Do not use markdown blocks for the JSON. Just return the raw JSON object.

Example output:
{{
    "english_alert": "🔴 VAYUNET EXTREME ALERT: Flash Flood expected in Dharamsala in 2 hrs. Evacuate river banks immediately. NDMA: 1078",
    "regional_alert": "🔴 वायुनेट चरम चेतावनी: धर्मशाला में 2 घंटे में अचानक बाढ़ की आशंका। तुरंत नदी किनारे खाली करें। NDMA: 1078"
}}
"""

    # If we have an API key and the library is installed, use Gemini
    if genai and GEMINI_API_KEY:
        try:
            client = genai.Client(api_key=GEMINI_API_KEY)
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                ),
            )
            data = json.loads(response.text)
            return {
                "source": "Gemini 2.5 AI",
                "english": data.get("english_alert", "VAYUNET ALERT: " + hazard_type),
                "regional": data.get("regional_alert", "VAYUNET चेतावनी: " + hazard_type)
            }
        except Exception as e:
            print(f"⚠️ [AI Dispatcher] Gemini API error: {e}. Falling back to mock.")
            # Fall through to mock
    
    # Mock Fallback Generator
    time.sleep(1.5)  # Simulate network/LLM latency for the UI
    
    # Simple hardcoded routing for a few regions to demonstrate multilingual capabilites
    loc_lower = location.lower()
    
    if "kerala" in loc_lower or "wayanad" in loc_lower:
        regional = f"🔴 VAYUNET चरम മുന്നറിയിപ്പ്: {lead_time} മണിക്കൂറിനുള്ളിൽ {location}-ൽ {hazard_type} പ്രതീക്ഷിക്കുന്നു. സുരക്ഷിത സ്ഥാനത്തേക്ക് മാറുക."
    elif "uttarakhand" in loc_lower or "himachal" in loc_lower or "dharamsala" in loc_lower:
        regional = f"🔴 वायुनेट चरम चेतावनी: {location} में {lead_time} के भीतर {hazard_type} की आशंका। सुरक्षित स्थान पर जाएँ।"
    else:
        regional = f"🔴 वायुनेट चरम चेतावनी: {location} में {hazard_type} की आशंका। सुरक्षित स्थान पर जाएँ।"
        
    english = f"🔴 VAYUNET {severity.upper()} ALERT: {hazard_type} expected in {location} within {lead_time}. Move to safety immediately."
    
    return {
        "source": "VayuNet Local AI (Mock)",
        "english": english,
        "regional": regional
    }
