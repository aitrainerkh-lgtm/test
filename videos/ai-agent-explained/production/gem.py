import json, os, sys, base64, urllib.request, wave, time
KEY = os.environ['GEMINI_API_KEY']  # set in your environment; never commit keys
BASE = "https://generativelanguage.googleapis.com/v1beta/models/"

def call(model, body, timeout=300, retries=4):
    req_body = json.dumps(body).encode()
    for i in range(retries):
        try:
            req = urllib.request.Request(BASE + model + ":generateContent", data=req_body,
                headers={"Content-Type": "application/json", "x-goog-api-key": KEY})
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            msg = e.read().decode()[:600]
            print("HTTP", e.code, msg, file=sys.stderr)
            if e.code in (429, 500, 503, 504): time.sleep(4 * (i + 1)); continue
            raise
        except Exception as e:
            print("ERR", e, file=sys.stderr); time.sleep(4 * (i + 1))
    raise RuntimeError("failed")

def text(model, prompt, parts_extra=None, temperature=0.4):
    parts = [{"text": prompt}] + (parts_extra or [])
    d = call(model, {"contents": [{"role": "user", "parts": parts}], "generationConfig": {"temperature": temperature}})
    return "".join(p.get("text", "") for p in d["candidates"][0]["content"]["parts"])

def tts(model, prompt, voice, out_wav, temperature=None):
    cfg = {"responseModalities": ["AUDIO"], "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}}}
    if temperature is not None: cfg["temperature"] = temperature
    d = call(model, {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": cfg})
    part = d["candidates"][0]["content"]["parts"][0]["inlineData"]
    pcm = base64.b64decode(part["data"])
    rate = 24000
    mt = part.get("mimeType", "")
    if "rate=" in mt: rate = int(mt.split("rate=")[1].split(";")[0])
    with wave.open(out_wav, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate); w.writeframes(pcm)
    return len(pcm) / 2 / rate

def audio_parts(path, mime="audio/wav"):
    return [{"inlineData": {"mimeType": mime, "data": base64.b64encode(open(path, "rb").read()).decode()}}]
