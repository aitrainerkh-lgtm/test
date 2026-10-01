import json,base64,urllib.request,os,time
KEY=os.environ['GEMINI_API_KEY']
BASE="https://generativelanguage.googleapis.com/v1beta/models/"
def call(model,body,tries=4):
    for i in range(tries):
        r=urllib.request.Request(BASE+model+":generateContent",data=json.dumps(body).encode(),headers={"x-goog-api-key":KEY,"Content-Type":"application/json"})
        try: return json.load(urllib.request.urlopen(r,timeout=600))
        except urllib.error.HTTPError as e:
            d=json.loads(e.read())
            if e.code in (500,503) or (e.code==429 and 'per_day' not in d['error']['message']):
                if i<tries-1: print("retry",e.code,d['error']['message'][:120]); time.sleep(20*(i+1)); continue
            return d
def text(d): return "".join(p.get('text','') for p in d['candidates'][0]['content']['parts'] if not p.get('thought'))
def save_audio(d,path):
    p=d['candidates'][0]['content']['parts'][0]['inlineData']
    open(path+".pcm","wb").write(base64.b64decode(p['data']))
    os.system(f"ffmpeg -loglevel error -y -f s16le -ar 24000 -ac 1 -i {path}.pcm {path}.wav && rm {path}.pcm")
def save_image(d,path):
    for p in d['candidates'][0]['content']['parts']:
        if 'inlineData' in p: open(path,"wb").write(base64.b64decode(p['inlineData']['data'])); return True
    return False
