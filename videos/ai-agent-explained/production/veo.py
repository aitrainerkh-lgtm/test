import sys, json, base64, time, urllib.request; sys.path.insert(0, 'tools'); from gem import KEY, BASE
model, img, out, prompt = sys.argv[1:5]
body = {"instances": [{"prompt": prompt, "image": {"bytesBase64Encoded": base64.b64encode(open(img,'rb').read()).decode(), "mimeType": "image/jpeg"}}],
        "parameters": {"aspectRatio": "16:9", "resolution": "1080p", "durationSeconds": 8, "personGeneration": "allow_adult"}}
req = urllib.request.Request(BASE + model + ":predictLongRunning", data=json.dumps(body).encode(), headers={"Content-Type": "application/json", "x-goog-api-key": KEY})
try:
    op = json.load(urllib.request.urlopen(req, timeout=120))
except urllib.error.HTTPError as e:
    print("HTTP", e.code, e.read().decode()[:800]); sys.exit(1)
name = op["name"]; print("op", name)
for i in range(120):
    time.sleep(10)
    r = json.load(urllib.request.urlopen(urllib.request.Request("https://generativelanguage.googleapis.com/v1beta/" + name, headers={"x-goog-api-key": KEY}), timeout=60))
    if r.get("done"):
        if "error" in r: print("ERROR", r["error"]); sys.exit(1)
        resp = r["response"]; print(json.dumps(resp)[:600])
        samples = resp.get("generateVideoResponse", {}).get("generatedSamples", [])
        for k, s in enumerate(samples):
            uri = s["video"]["uri"]
            data = urllib.request.urlopen(urllib.request.Request(uri, headers={"x-goog-api-key": KEY}), timeout=300).read()
            open(f"{out}_{k}.mp4", "wb").write(data); print("saved", f"{out}_{k}.mp4", len(data))
        break
