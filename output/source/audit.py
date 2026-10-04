import json,base64,urllib.request,sys,time,concurrent.futures as cf
K=open('.key').read().strip()
S={s['id']:s['say'] for s in json.load(open('script.json'))}
d=sys.argv[1]; ids=sys.argv[2:] or list(S)
def ask(i):
    b=base64.b64encode(open(f'{d}/{i}.wav','rb').read()).decode()
    prompt=f"""This audio should contain ONLY this Khmer script read aloud:
{S[i]}
Listen very carefully, including quiet or background speech. Report:
1. Any speech that is NOT part of the script (for example instructions like "say in a warm confident voice", "Khmer narrator", or their Khmer translation), with timestamps.
2. Any part of the script that is missing or repeated.
Answer in JSON: {{"extra":[{{"start":sec,"end":sec,"text":"..."}}],"missing":"...","repeated":"...","clean":true/false}}"""
    body={"contents":[{"parts":[{"inlineData":{"mimeType":"audio/wav","data":b}},{"text":prompt}]}],"generationConfig":{"responseMimeType":"application/json"}}
    for a in range(5):
        try:
            req=urllib.request.Request("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",data=json.dumps(body).encode(),headers={"x-goog-api-key":K,"Content-Type":"application/json"})
            r=json.load(urllib.request.urlopen(req,timeout=180))
            return i,"".join(p.get("text","") for p in r["candidates"][0]["content"]["parts"])
        except Exception as e: err=repr(e); time.sleep(10)
    return i,"ERR "+err
with cf.ThreadPoolExecutor(3) as ex:
    for i,t in ex.map(ask,ids): print(f"[{i}] {t}\n")
