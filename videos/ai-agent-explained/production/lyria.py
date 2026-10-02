import sys, json, base64, os; sys.path.insert(0, 'tools'); from gem import *
model = sys.argv[1]; out = sys.argv[2]; prompt = sys.argv[3]
body = {"contents": [{"role": "user", "parts": [{"text": prompt}]}]}
if len(sys.argv) > 4: body["generationConfig"] = json.loads(sys.argv[4])
d = call(model, body, timeout=600)
for c in d.get("candidates", []):
    for p in c["content"]["parts"]:
        if "inlineData" in p:
            mt = p["inlineData"]["mimeType"]; ext = {"audio/mpeg":"mp3","audio/wav":"wav","audio/mp3":"mp3"}.get(mt.split(';')[0], "bin")
            open(out + "." + ext, "wb").write(base64.b64decode(p["inlineData"]["data"])); print("saved", out + "." + ext, mt)
        elif "text" in p: print("TEXT:", p["text"][:800])
print({k: v for k, v in d.items() if k != "candidates"})
