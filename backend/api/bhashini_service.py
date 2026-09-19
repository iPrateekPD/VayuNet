"""
VAYUNET - BHASHINI Language & Speech Service
Digital India Bhashini (MeitY National Language Translation Mission) Integration.

Provides:
- NMT: Real-time dynamic neural translation into 22 Indian languages
- TTS: High-fidelity natural regional voice synthesis (male/female WAV streams)
- ASR: Automatic speech recognition for citizen voice SOS queries
- Chained Pipeline: One-shot Translate + Synthesize for instant emergency audio bulletins
"""

import os
import json
import time
import urllib.request
import urllib.error
from pathlib import Path
from typing import Dict, Any, Optional

# Automatically resolve .env from project root if not already in environment
ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
if ENV_PATH.exists():
    with open(ENV_PATH, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                k = k.strip()
                v = v.strip().strip("\"'")
                if k not in os.environ:
                    os.environ[k] = v

BHASHINI_UDYAT_KEY = os.environ.get("BHASHINI_UDYAT_KEY", "4306dbf5ef-73bf-4ab8-b0f6-2558e01b9df7")
BHASHINI_INFERENCE_KEY = os.environ.get("BHASHINI_INFERENCE_KEY", "pEc0QVSURz917U5SPxeIOamW5z2UMG6_sfenM8cRStAHptLsBOadNYMt3W3JPhXW")
BHASHINI_INFERENCE_URL = os.environ.get(
    "BHASHINI_INFERENCE_URL",
    "https://dhruva-api.bhashini.gov.in/services/inference/pipeline"
)

# Supported 22 Scheduled Indian Languages + English
SUPPORTED_BHASHINI_LANGUAGES = {
    "hi": {"name": "Hindi", "script": "Devanagari"},
    "en": {"name": "English", "script": "Latin"},
    "bn": {"name": "Bengali", "script": "Bengali"},
    "ta": {"name": "Tamil", "script": "Tamil"},
    "te": {"name": "Telugu", "script": "Telugu"},
    "mr": {"name": "Marathi", "script": "Devanagari"},
    "gu": {"name": "Gujarati", "script": "Gujarati"},
    "kn": {"name": "Kannada", "script": "Kannada"},
    "ml": {"name": "Malayalam", "script": "Malayalam"},
    "pa": {"name": "Punjabi", "script": "Gurmukhi"},
    "or": {"name": "Odia", "script": "Odia"},
    "as": {"name": "Assamese", "script": "Bengali"},
    "ur": {"name": "Urdu", "script": "Perso-Arabic"},
    "ne": {"name": "Nepali", "script": "Devanagari"},
    "sa": {"name": "Sanskrit", "script": "Devanagari"},
    "sd": {"name": "Sindhi", "script": "Devanagari"},
    "ks": {"name": "Kashmiri", "script": "Perso-Arabic"},
    "doi": {"name": "Dogri", "script": "Devanagari"},
    "kok": {"name": "Konkani", "script": "Devanagari"},
    "mai": {"name": "Maithili", "script": "Devanagari"},
    "mni": {"name": "Manipuri (Meitei)", "script": "Bengali"},
    "sat": {"name": "Santali", "script": "Ol Chiki"},
    "brx": {"name": "Bodo", "script": "Devanagari"}
}

# In-memory LRU audio and translation cache to save quota and provide sub-millisecond response
_TRANSLATION_CACHE: Dict[str, str] = {}
_TTS_CACHE: Dict[str, Dict[str, Any]] = {}
CACHE_MAX_ITEMS = 500


def normalize_lang_code(code: str) -> str:
    """Normalizes arbitrary language strings ('HI', 'hindi', 'en-IN') to Bhashini standard code."""
    if not code:
        return "hi"
    c = code.strip().lower().split("-")[0].split("_")[0]
    if c in ("hindi", "hin"): return "hi"
    if c in ("english", "eng"): return "en"
    if c in ("bengali", "bangla"): return "bn"
    if c in ("tamil", "tam"): return "ta"
    if c in ("telugu", "tel"): return "te"
    if c in ("marathi", "mar"): return "mr"
    if c in ("gujarati", "guj"): return "gu"
    if c in ("kannada", "kan"): return "kn"
    if c in ("malayalam", "mal"): return "ml"
    if c in ("punjabi", "pan"): return "pa"
    if c in ("odia", "oriya", "od"): return "or"
    if c in ("assamese", "asm"): return "as"
    if c in ("urdu", "urd"): return "ur"
    return c if c in SUPPORTED_BHASHINI_LANGUAGES else "hi"


def _call_dhruva_pipeline(payload: dict, timeout: int = 15) -> dict:
    """Invokes Bhashini Dhruva inference pipeline with authorization."""
    if not BHASHINI_INFERENCE_KEY:
        raise ValueError("BHASHINI_INFERENCE_KEY is not configured.")

    headers = {
        "Content-Type": "application/json",
        "Authorization": BHASHINI_INFERENCE_KEY
    }

    req = urllib.request.Request(
        BHASHINI_INFERENCE_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST"
    )

    with urllib.request.urlopen(req, timeout=timeout) as resp:
        if resp.status != 200:
            raise RuntimeError(f"Bhashini API returned status code {resp.status}")
        return json.loads(resp.read().decode("utf-8"))


def translate_text(text: str, source_lang: str = "en", target_lang: str = "hi") -> dict:
    """
    Translates text from source_lang to target_lang using Bhashini NMT.
    """
    text = (text or "").strip()
    if not text:
        return {"translated_text": "", "source_lang": source_lang, "target_lang": target_lang, "cached": False}

    s_lang = normalize_lang_code(source_lang)
    t_lang = normalize_lang_code(target_lang)

    # If source and target are the same, return as is
    if s_lang == t_lang:
        return {
            "translated_text": text,
            "source_lang": s_lang,
            "target_lang": t_lang,
            "source": "Identity",
            "cached": True
        }

    cache_key = f"{s_lang}->{t_lang}:{text}"
    if cache_key in _TRANSLATION_CACHE:
        return {
            "translated_text": _TRANSLATION_CACHE[cache_key],
            "source_lang": s_lang,
            "target_lang": t_lang,
            "source": "Bhashini NMT (Cached)",
            "cached": True
        }

    payload = {
        "pipelineTasks": [
            {
                "taskType": "translation",
                "config": {
                    "language": {
                        "sourceLanguage": s_lang,
                        "targetLanguage": t_lang
                    }
                }
            }
        ],
        "inputData": {
            "input": [{"source": text}]
        }
    }

    try:
        data = _call_dhruva_pipeline(payload)
        translated = data["pipelineResponse"][0]["output"][0]["target"]

        if len(_TRANSLATION_CACHE) > CACHE_MAX_ITEMS:
            _TRANSLATION_CACHE.clear()
        _TRANSLATION_CACHE[cache_key] = translated

        return {
            "translated_text": translated,
            "source_lang": s_lang,
            "target_lang": t_lang,
            "source": "Digital India Bhashini (MeitY)",
            "cached": False
        }
    except Exception as e:
        print(f"⚠️ [Bhashini NMT Error] {e}. Using fallback.")
        return {
            "translated_text": text,
            "source_lang": s_lang,
            "target_lang": t_lang,
            "source": "Fallback (Original Text)",
            "error": str(e),
            "cached": False
        }


def synthesize_speech(text: str, language: str = "hi", gender: str = "female") -> dict:
    """
    Synthesizes speech audio for given text in target Indian language using Bhashini TTS.
    Returns base64 encoded WAV audio.
    """
    text = (text or "").strip()
    if not text:
        return {"audio_base64": "", "audio_format": "wav", "error": "Empty text"}

    lang = normalize_lang_code(language)
    gender = gender if gender in ("male", "female") else "female"

    cache_key = f"tts:{lang}:{gender}:{text}"
    if cache_key in _TTS_CACHE:
        cached = _TTS_CACHE[cache_key].copy()
        cached["cached"] = True
        return cached

    payload = {
        "pipelineTasks": [
            {
                "taskType": "tts",
                "config": {
                    "language": {
                        "sourceLanguage": lang
                    },
                    "gender": gender
                }
            }
        ],
        "inputData": {
            "input": [{"source": text}]
        }
    }

    try:
        data = _call_dhruva_pipeline(payload, timeout=20)
        task_resp = data["pipelineResponse"][0]
        audio_content = task_resp["audio"][0]["audioContent"]
        config = task_resp.get("config", {})

        result = {
            "audio_base64": audio_content,
            "audio_format": config.get("audioFormat", "wav"),
            "sampling_rate": config.get("samplingRate", 22050),
            "language": lang,
            "gender": gender,
            "source": "Digital India Bhashini TTS",
            "cached": False
        }

        if len(_TTS_CACHE) > CACHE_MAX_ITEMS:
            _TTS_CACHE.clear()
        _TTS_CACHE[cache_key] = result

        return result
    except Exception as e:
        print(f"⚠️ [Bhashini TTS Error] {e}.")
        return {
            "audio_base64": "",
            "audio_format": "wav",
            "language": lang,
            "gender": gender,
            "source": "Unavailable",
            "error": str(e),
            "cached": False
        }


def translate_and_synthesize(
    text: str,
    source_lang: str = "en",
    target_lang: str = "hi",
    gender: str = "female"
) -> dict:
    """
    Chained pipeline: Translates text and generates regional speech audio in a single call.
    Ideal for instant loudspeaker broadcast and siren announcements.
    """
    text = (text or "").strip()
    if not text:
        return {"error": "Empty text provided"}

    s_lang = normalize_lang_code(source_lang)
    t_lang = normalize_lang_code(target_lang)
    gender = gender if gender in ("male", "female") else "female"

    cache_key = f"chain:{s_lang}->{t_lang}:{gender}:{text}"
    if cache_key in _TTS_CACHE:
        cached = _TTS_CACHE[cache_key].copy()
        cached["cached"] = True
        return cached

    payload = {
        "pipelineTasks": [
            {
                "taskType": "translation",
                "config": {
                    "language": {
                        "sourceLanguage": s_lang,
                        "targetLanguage": t_lang
                    }
                }
            },
            {
                "taskType": "tts",
                "config": {
                    "language": {
                        "sourceLanguage": t_lang
                    },
                    "gender": gender
                }
            }
        ],
        "inputData": {
            "input": [{"source": text}]
        }
    }

    try:
        data = _call_dhruva_pipeline(payload, timeout=25)
        pipeline_resp = data.get("pipelineResponse", [])
        
        translated_text = ""
        audio_content = ""
        audio_format = "wav"
        sampling_rate = 22050

        for task in pipeline_resp:
            if task.get("taskType") == "translation" and task.get("output"):
                translated_text = task["output"][0].get("target", "")
            elif task.get("taskType") == "tts" and task.get("audio"):
                audio_content = task["audio"][0].get("audioContent", "")
                if task.get("config"):
                    audio_format = task["config"].get("audioFormat", "wav")
                    sampling_rate = task["config"].get("samplingRate", 22050)

        result = {
            "source_text": text,
            "translated_text": translated_text or text,
            "source_lang": s_lang,
            "target_lang": t_lang,
            "audio_base64": audio_content,
            "audio_format": audio_format,
            "sampling_rate": sampling_rate,
            "gender": gender,
            "source": "Digital India Bhashini (Translate + TTS)",
            "cached": False
        }

        if len(_TTS_CACHE) > CACHE_MAX_ITEMS:
            _TTS_CACHE.clear()
        _TTS_CACHE[cache_key] = result

        return result
    except Exception as e:
        print(f"⚠️ [Bhashini Chained Error] {e}. Falling back to sequential or partial.")
        # Fallback: translate first, then synthesize separately if possible
        tr_res = translate_text(text, s_lang, t_lang)
        tts_res = synthesize_speech(tr_res.get("translated_text", text), t_lang, gender)
        return {
            "source_text": text,
            "translated_text": tr_res.get("translated_text", text),
            "source_lang": s_lang,
            "target_lang": t_lang,
            "audio_base64": tts_res.get("audio_base64", ""),
            "audio_format": "wav",
            "sampling_rate": 22050,
            "gender": gender,
            "source": "Bhashini Sequential Fallback",
            "error": str(e),
            "cached": False
        }


def transcribe_speech(audio_base64: str, language: str = "hi") -> dict:
    """
    Transcribes audio into text using Bhashini ASR.
    Useful for citizen voice emergency SOS queries.
    """
    if not audio_base64:
        return {"transcript": "", "error": "Empty audio data"}

    lang = normalize_lang_code(language)
    payload = {
        "pipelineTasks": [
            {
                "taskType": "asr",
                "config": {
                    "language": {
                        "sourceLanguage": lang
                    }
                }
            }
        ],
        "inputData": {
            "audio": [{"audioContent": audio_base64}]
        }
    }

    try:
        data = _call_dhruva_pipeline(payload, timeout=20)
        transcript = data["pipelineResponse"][0]["output"][0]["source"]
        return {
            "transcript": transcript,
            "language": lang,
            "source": "Digital India Bhashini ASR"
        }
    except Exception as e:
        print(f"⚠️ [Bhashini ASR Error] {e}")
        return {
            "transcript": "",
            "language": lang,
            "error": str(e),
            "source": "Bhashini ASR Error"
        }
