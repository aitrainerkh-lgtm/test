"""Generate one Khmer narration clip per scene with Gemini TTS.

Usage: GEMINI_API_KEY=... python3 scripts/gen_tts.py
Clips are cached in raw/<scene>.wav; delete a file to regenerate it.
"""
import base64, json, os, re, subprocess, sys, time, urllib.error, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEY = os.environ["GEMINI_API_KEY"]
cfg = json.load(open(os.path.join(ROOT, "scripts", "narration.json"), encoding="utf-8"))
model = os.environ.get("TTS_MODEL", cfg["model"])


def tts(text, out):
    body = {
        "contents": [{"parts": [{"text": f"{cfg['style']}:\n\n{text}"}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": cfg["voice"]}}},
        },
    }
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={KEY}"
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, json.dumps(body).encode(), {"Content-Type": "application/json"})
            d = json.load(urllib.request.urlopen(req, timeout=300))
            pcm = base64.b64decode(d["candidates"][0]["content"]["parts"][0]["inlineData"]["data"])
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "s16le", "-ar", "24000", "-ac", "1",
                            "-i", "pipe:0", out], input=pcm, check=True)
            return len(pcm) / 48000
        except urllib.error.HTTPError as e:
            msg = e.read().decode(errors="ignore")
            print(f"  HTTP {e.code}: {msg[:300]}", file=sys.stderr)
            if e.code == 429:
                m = re.search(r'"retryDelay": "(\d+)s"', msg)
                wait = int(m.group(1)) if m else 60
                if wait > 300:
                    sys.exit("Daily TTS quota reached. Try later or set TTS_MODEL to another TTS model.")
                time.sleep(wait + 2)
            else:
                time.sleep(10)
        except Exception as e:  # network hiccup
            print(f"  error: {e}", file=sys.stderr)
            time.sleep(10)
    sys.exit(f"failed: {out}")


for scene in cfg["scenes"]:
    out = os.path.join(ROOT, "raw", f"{scene['id']}.wav")
    if os.path.exists(out):
        continue
    dur = tts("\n".join(scene["segments"]), out)
    print(f"{scene['id']}: {dur:.2f}s", flush=True)
    time.sleep(20)  # stay under the free-tier requests-per-minute limit
