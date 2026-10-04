import json,base64,urllib.request
K=open('.key').read().strip()
body={"contents":[{"parts":[{"text":"Instrumental background music for a 2-minute corporate motivational career-growth explainer video about a construction company. Uplifting, optimistic, modern corporate: light piano, soft plucked synths, warm pads, gentle steady drums, building energy toward the end. 100 BPM. No vocals. Calm enough to sit under voice-over."}]}]}
req=urllib.request.Request("https://generativelanguage.googleapis.com/v1beta/models/lyria-3-pro-preview:generateContent",data=json.dumps(body).encode(),headers={"x-goog-api-key":K,"Content-Type":"application/json"})
try:
  r=json.load(urllib.request.urlopen(req,timeout=600))
  for p in r["candidates"][0]["content"]["parts"]:
    if "inlineData" in p:
      print(p["inlineData"]["mimeType"]); ext=p["inlineData"]["mimeType"].split('/')[-1].replace('mpeg','mp3')
      open("music_raw."+ext,"wb").write(base64.b64decode(p["inlineData"]["data"]))
    else: print(str(p)[:300])
except urllib.error.HTTPError as e: print(e.code,e.read().decode()[:500])
