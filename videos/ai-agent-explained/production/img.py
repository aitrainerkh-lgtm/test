import sys, json, base64; sys.path.insert(0, 'tools'); from gem import *
model, out, prompt = sys.argv[1], sys.argv[2], sys.argv[3]
cfg = {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": "16:9", "imageSize": "2K"}}
parts = [{"text": prompt}]
for ref in sys.argv[4:]:
    parts.append({"inlineData": {"mimeType": "image/png" if ref.endswith('png') else "image/jpeg", "data": base64.b64encode(open(ref,'rb').read()).decode()}})
d = call(model, {"contents": [{"role": "user", "parts": parts}], "generationConfig": cfg}, timeout=400)
for p in d["candidates"][0]["content"]["parts"]:
    if "inlineData" in p:
        ext = 'png' if 'png' in p["inlineData"]["mimeType"] else 'jpg'
        open(f"{out}.{ext}", "wb").write(base64.b64decode(p["inlineData"]["data"])); print("saved", f"{out}.{ext}")
    elif "text" in p: print("TEXT", p["text"][:300])
