import json,base64,urllib.request,sys,os,concurrent.futures as cf
K=open('.key').read().strip()
S=json.load(open('script.json'))
os.makedirs('vo',exist_ok=True)
STYLE="Read the following Khmer text aloud as a warm, confident, energetic narrator of a professional business training video. Natural, slightly brisk pace. English words (job titles, AI, Budget, BOQ, tool names) are pronounced in English. Read only the text:\n\n"
def gen(s):
    if len(sys.argv)>1 and s['id'] not in sys.argv[1:]: return s['id'],'skip'
    body={"contents":[{"parts":[{"text":STYLE+s['say']}]}],"generationConfig":{"responseModalities":["AUDIO"],"speechConfig":{"voiceConfig":{"prebuiltVoiceConfig":{"voiceName":"Charon"}}}}}
    for a in range(3):
        try:
            req=urllib.request.Request("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash-tts:generateContent",data=json.dumps(body).encode(),headers={"x-goog-api-key":K,"Content-Type":"application/json"})
            r=json.load(urllib.request.urlopen(req,timeout=180))
            p=r["candidates"][0]["content"]["parts"][0]["inlineData"]
            open(f"vo/{s['id']}.wav","wb").write(base64.b64decode(p["data"])); return s['id'],p['mimeType']
        except urllib.error.HTTPError as e: err=f"{e.code} {e.read().decode()[:300]}"
        except Exception as e: err=repr(e)
    return s['id'],'FAIL '+err
with cf.ThreadPoolExecutor(5) as ex:
    for r in ex.map(gen,S): print(*r)
