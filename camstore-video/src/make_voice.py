"""Generate the Khmer voiceover with Gemini TTS, one WAV per narration segment.

Usage:
    export GEMINI_API_KEY=...        # Google AI Studio API key
    python3 src/make_voice.py [--only s01 s02] [--voice Kore] [--model gemini-3.8-flash-tts] [--no-verify]

Each take is transcribed back with a Gemini text model and checked: the spoken numbers must
match the script, otherwise the take is retried. The prompt asks for ប្រាំ (five) to be spoken
"bram"; confirm that by listening, since the model's own b/p judgement is not reliable.
Writes voice/<segment id>.wav (24 kHz mono). build.py picks these up automatically.
"""
import argparse
import base64
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
API = "https://generativelanguage.googleapis.com/v1beta"
TTS_MODEL = "gemini-3.8-flash-tts"
CHECK_MODEL = "gemini-3.1-pro-preview"
FIVE = "ប្រាំ"

# Khmer number vocabulary, longest first, for comparing spoken numbers with the script
NUM_WORDS = sorted(["មួយ", "ពីរ", "បី", "បួន", FIVE, "ដប់", "ម្ភៃ", "សាមសិប", "សែសិប", "ហាសិប", "ហុកសិប",
                    "ចិតសិប", "ប៉ែតសិប", "កៅសិប", "រយ", "ពាន់", "ម៉ឺន", "សែន", "ក្បៀស"], key=len, reverse=True)


class QuotaExceeded(Exception):
    pass


def call(model, key, body):
    req = urllib.request.Request(f"{API}/models/{model}:generateContent", data=json.dumps(body).encode(),
                                 headers={"x-goog-api-key": key, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=300) as r:
        return json.load(r)


def request(model, key, body):
    res = None
    for attempt in range(5):
        try:
            res = call(model, key, body)
            return res["candidates"][0]["content"]["parts"][0]
        except urllib.error.HTTPError as e:
            msg = e.read().decode(errors="replace")
            if e.code == 429 and "per_day" in msg:
                raise QuotaExceeded(f"{model}: daily quota used up. {msg[:300]}")
            if e.code in (429, 500, 503) and attempt < 4:
                time.sleep(2 ** (attempt + 2))
                continue
            sys.exit(f"Gemini error {e.code} from {model}: {msg[:600]}")
        except (KeyError, IndexError):
            time.sleep(2)  # preview models occasionally return an empty candidate
    sys.exit(f"Gemini returned nothing from {model}: {json.dumps(res)[:600]}")


def synth(key, model, voice, data, text):
    prompt = ("Read the transcript below aloud in Khmer, exactly as written and nothing else.\n"
              f"{data['voice_style']}\nPronunciation: {data['pronunciation']}\n\nTRANSCRIPT:\n{text}")
    body = {"contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseModalities": ["AUDIO"],
                                 "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}}}}
    part = request(model, key, body)["inlineData"]
    rate = next((int(p.split("=")[1]) for p in part.get("mimeType", "").split(";") if p.strip().startswith("rate=")), 24000)
    return base64.b64decode(part["data"]), rate


def numbers(text):
    s = re.sub(r"[\s។,.]", "", text)
    out, i = [], 0
    while i < len(s):
        w = next((w for w in NUM_WORDS if s.startswith(w, i)), None)
        if w:
            out.append(w)
            i += len(w)
        else:
            i += 1
    return out


def check(key, wav_path, text):
    """Transcribe a take; return (ok, report)."""
    n = text.count(FIVE)
    mp3 = subprocess.run(["ffmpeg", "-v", "error", "-i", str(wav_path), "-f", "mp3", "-b:a", "96k", "-"],
                         capture_output=True, check=True).stdout
    q = ("Transcribe this Khmer audio in Khmer script, writing numbers as Khmer words exactly as spoken. "
         f"The word {FIVE} (five) is expected {n} times, also inside compounds such as ម្ភៃប្រាំ, ប្រាំមួយ, ប្រាំបី, ប្រាំរយ. "
         "For each occurrence in order, report the initial consonant you actually hear: 'bram' (voiced b) or 'pram' (unvoiced p). "
         'Answer only JSON: {"transcript":"...","fives":["bram|pram",...]}')
    body = {"contents": [{"parts": [{"inlineData": {"mimeType": "audio/mp3", "data": base64.b64encode(mp3).decode()}},
                                    {"text": q}]}],
            "generationConfig": {"responseMimeType": "application/json"}}
    j = json.loads(request(CHECK_MODEL, key, body)["text"])
    heard_nums, want_nums = numbers(j["transcript"]), numbers(text)
    brams = sum(1 for f in j["fives"] if f.lower().startswith("b"))
    # The model's b/p judgement is not stable between runs, so only the numbers gate a take;
    # the bram count is reported for information and the final check is a human listen.
    ok = heard_nums == want_nums
    return ok, f"bram {brams}/{n} (info), numbers {'match' if ok else 'DIFFER'} | heard: {j['transcript']}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", default="Kore", help="Gemini prebuilt voice, e.g. Kore, Charon, Aoede, Puck")
    ap.add_argument("--model", default=TTS_MODEL)
    ap.add_argument("--only", nargs="*", help="regenerate only these segment ids")
    ap.add_argument("--tries", type=int, default=3)
    ap.add_argument("--no-verify", action="store_true")
    a = ap.parse_args()
    key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not key:
        sys.exit("Set GEMINI_API_KEY first.")
    data = json.loads((ROOT / "narration_km.json").read_text(encoding="utf-8"))
    out = ROOT / "voice"
    out.mkdir(exist_ok=True)
    print(f"model={a.model} voice={a.voice}")
    failed = []
    try:
        for seg in data["segments"]:
            if a.only and seg["id"] not in a.only:
                continue
            final = out / f"{seg['id']}.wav"
            for t in range(a.tries):
                pcm, rate = synth(key, a.model, a.voice, data, seg["speech_km"])
                take = out / f".{seg['id']}.take.wav"
                with wave.open(str(take), "wb") as w:
                    w.setnchannels(1)
                    w.setsampwidth(2)
                    w.setframerate(rate)
                    w.writeframes(pcm)
                ok, report = (True, "not verified") if a.no_verify else check(key, take, seg["speech_km"])
                print(f"  {seg['id']} take {t + 1}: {len(pcm) / 2 / rate:.2f}s  {report}", flush=True)
                if ok:
                    take.replace(final)
                    break
            else:
                take.unlink(missing_ok=True)
                failed.append(seg["id"])
    except QuotaExceeded as e:
        sys.exit(f"STOPPED: {e}")
    if failed:
        sys.exit(f"No take passed the check for: {' '.join(failed)} (existing files left unchanged)")


if __name__ == "__main__":
    main()
