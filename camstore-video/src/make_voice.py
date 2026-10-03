"""Generate the Khmer voiceover with Gemini TTS, one WAV per narration segment.

Usage:
    export GEMINI_API_KEY=...        # Google AI Studio API key
    python3 src/make_voice.py [--voice Kore] [--model gemini-2.5-flash-preview-tts]

Writes voice/<segment id>.wav (24 kHz mono). build.py picks these up automatically.
"""
import argparse
import base64
import json
import os
import sys
import time
import urllib.error
import urllib.request
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
API = "https://generativelanguage.googleapis.com/v1beta"
FALLBACK_MODELS = ["gemini-2.5-pro-preview-tts", "gemini-2.5-flash-preview-tts"]


def call(url, key, body=None):
    req = urllib.request.Request(url, headers={"x-goog-api-key": key, "Content-Type": "application/json"},
                                 data=json.dumps(body).encode() if body is not None else None)
    with urllib.request.urlopen(req, timeout=180) as r:
        return json.load(r)


def pick_model(key, wanted):
    if wanted:
        return wanted
    try:
        names = [m["name"].split("/")[-1] for m in call(f"{API}/models?pageSize=200", key).get("models", [])]
        tts = [n for n in names if "tts" in n]
        for pref in FALLBACK_MODELS:
            if pref in tts:
                return pref
        if tts:
            return tts[0]
    except urllib.error.URLError:
        pass
    return FALLBACK_MODELS[0]


def synth(key, model, voice, style, text):
    body = {
        "contents": [{"parts": [{"text": f"{style}\n\n{text}"}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}},
        },
    }
    res = None
    for attempt in range(5):
        try:
            res = call(f"{API}/models/{model}:generateContent", key, body)
            part = res["candidates"][0]["content"]["parts"][0]["inlineData"]
            return base64.b64decode(part["data"]), part.get("mimeType", "")
        except urllib.error.HTTPError as e:
            msg = e.read().decode(errors="replace")
            if e.code in (429, 500, 503) and attempt < 4:
                time.sleep(2 ** (attempt + 1))
                continue
            sys.exit(f"Gemini TTS error {e.code}: {msg[:600]}")
        except (KeyError, IndexError):
            # the preview TTS models occasionally return an empty candidate; retry
            time.sleep(2)
    sys.exit(f"Gemini returned no audio from {model}: {json.dumps(res)[:600]}")


def rate_from_mime(mime):
    for p in mime.split(";"):
        if p.strip().startswith("rate="):
            return int(p.split("=")[1])
    return 24000


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", default="Kore", help="Gemini prebuilt voice, e.g. Kore, Charon, Aoede, Puck")
    ap.add_argument("--model", default=None)
    ap.add_argument("--only", nargs="*", help="regenerate only these segment ids")
    a = ap.parse_args()
    key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not key:
        sys.exit("Set GEMINI_API_KEY first.")
    data = json.loads((ROOT / "narration_km.json").read_text(encoding="utf-8"))
    model = pick_model(key, a.model)
    out = ROOT / "voice"
    out.mkdir(exist_ok=True)
    print(f"model={model} voice={a.voice}")
    for seg in data["segments"]:
        if a.only and seg["id"] not in a.only:
            continue
        pcm, mime = synth(key, model, a.voice, data["voice_style"], seg["speech_km"])
        with wave.open(str(out / f"{seg['id']}.wav"), "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(rate_from_mime(mime))
            w.writeframes(pcm)
        print(f"  {seg['id']}: {len(pcm) / 2 / rate_from_mime(mime):.2f}s")


if __name__ == "__main__":
    main()
