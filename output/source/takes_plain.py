import json,base64,urllib.request,sys,os,re,difflib,concurrent.futures as cf
K=open('.key').read().strip()
S={s['id']:s for s in json.load(open('script.json'))}
ids=sys.argv[2:]; N=int(sys.argv[1])
os.makedirs('takes4',exist_ok=True)
H={"x-goog-api-key":K,"Content-Type":"application/json"}
import time
def post(model,body):
    for a in range(8):
        try:
            req=urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",data=json.dumps(body).encode(),headers=H)
            return json.load(urllib.request.urlopen(req,timeout=180))
        except urllib.error.HTTPError as e:
            if e.code in (429,500,503): time.sleep(15*(a+1)); continue
            raise
KD=str.maketrans("០១២៣៤៥៦៧៨៩","0123456789")
def norm(t): return re.sub(r"[\s\.,។៖?!:]","",t.translate(KD).lower()).replace("ឲ្យ","ឱ្យ").replace("ផ្ដ","ផ្ត")
def job(a):
    i,k=a; fn=f"takes4/{i}_{k}.wav"
    body={"contents":[{"parts":[{"text":S[i]["say"]}]}],"generationConfig":{"responseModalities":["AUDIO"],"speechConfig":{"voiceConfig":{"prebuiltVoiceConfig":{"voiceName":"Charon"}}}}}
    try:
        p=post("gemini-3.8-flash-tts",body)["candidates"][0]["content"]["parts"][0]["inlineData"]
        open(fn,"wb").write(base64.b64decode(p["data"]))
        b=base64.b64encode(open(fn,'rb').read()).decode()
        r=post("gemini-3.5-transcribe",{"contents":[{"parts":[{"inlineData":{"mimeType":"audio/wav","data":b}},{"text":"Transcribe exactly."}]}]})
        pt=r["candidates"][0]["content"]["parts"][0]; t=pt.get("audioTranscription",{}).get("text") or pt.get("text","")
        sc=difflib.SequenceMatcher(None,norm(S[i]['say']),norm(t)).ratio()
        return i,k,sc,t
    except Exception as e: return i,k,0,repr(e)
jobs=[(i,k) for i in ids for k in range(N)]
res={}
with cf.ThreadPoolExecutor(2) as ex:
    for i,k,sc,t in ex.map(job,jobs):
        print(f"{i}_{k} {sc:.3f} {t}"); res.setdefault(i,[]).append((sc,k))
json.dump(res,open('takes4/scores_'+'_'.join(ids)+'.json','w'))
for i,v in res.items(): print("BEST",i,max(v))
