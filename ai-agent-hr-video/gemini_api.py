"""Small helper for calling the Gemini REST API (no browser, no SDK).

The API key is read from the GEMINI_API_KEY environment variable.
"""
import base64
import json
import os
import time
import urllib.error
import urllib.request

API_ROOT = "https://generativelanguage.googleapis.com/v1beta/models"


def _key():
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        raise SystemExit("Set GEMINI_API_KEY before running.")
    return key


def generate(model, body, retries=4):
    url = f"{API_ROOT}/{model}:generateContent"
    data = json.dumps(body).encode("utf-8")
    for attempt in range(retries):
        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json", "x-goog-api-key": _key()},
        )
        try:
            with urllib.request.urlopen(req, timeout=300) as resp:
                return json.load(resp)
        except urllib.error.HTTPError as err:
            detail = err.read().decode("utf-8", "replace")
            if err.code in (429, 500, 503) and attempt < retries - 1:
                time.sleep(2 ** (attempt + 2))
                continue
            raise RuntimeError(f"{model} HTTP {err.code}: {detail}") from None


def generate_text(model, prompt, json_output=False):
    config = {"temperature": 0.7}
    if json_output:
        config["responseMimeType"] = "application/json"
    result = generate(model, {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": config,
    })
    parts = result["candidates"][0]["content"]["parts"]
    return "".join(p.get("text", "") for p in parts if not p.get("thought"))


def generate_speech(model, text, voice):
    """Return (audio bytes, mime type) for the given text. Retries empty replies."""
    for attempt in range(4):
        audio = _speech_once(model, text, voice)
        if audio:
            return audio
        time.sleep(3 * (attempt + 1))
    raise RuntimeError(f"{model} returned no audio after several tries")


def _speech_once(model, text, voice):
    result = generate(model, {
        "contents": [{"role": "user", "parts": [{"text": text}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {
                "voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}
            },
        },
    })
    for cand in result.get("candidates", []):
        for part in cand.get("content", {}).get("parts", []):
            if "inlineData" in part:
                return base64.b64decode(part["inlineData"]["data"]), part["inlineData"].get("mimeType")
    return None
