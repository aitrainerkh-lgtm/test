import json,re
S=json.load(open('script.json'))
D={l.split()[0]:float(l.split()[1]) for l in open('durs.txt')}
CUES={
 "intro":{"title":"ថ្ងៃនេះ","sub":"ជាមួយ","co":"ក្រុមហ៊ុន"},
 "rule":{"who":"មនុស្ស","next":"ព្រោះគេបាន","no":"មិនមែន"},
 "overview":{"se":"Site Engineer","pm":"Project Manager","steps":"ក្នុង ៥","years":"ពីឆ្នាំ"},
 "s1":{"theme":"ពង្រឹង","b1":"អានប្លង់","b2":"គោរព","b3":"និងធ្វើរបាយការណ៍"},
 "s2":{"theme":"ក្លាយជាអ្នកជំនាញ","b1":"ដោះស្រាយ","b2":"បង្វឹក","b3":"និងប្រើ"},
 "s3":{"theme":"រៀនដឹកនាំ","b1":"គ្រប់គ្រង","b2":"រៀបចំ","b3":"ហើយបញ្ចប់"},
 "s4":{"theme":"ចាប់ផ្តើម","b1":"រៀបចំ","b2":"និងប្រជុំ","b3":"រហូតដល់"},
 "s5":{"theme":"ទទួលខុសត្រូវ","b1":"ទទួលខុសត្រូវ","b2":"រៀបចំអ្នក","b3":"ហើយសរសេរ"},
 "summary":{"tools":"ChatGPT","review":"ហើយពិនិត្យ"},
 "cta":{"c1":"សរសេរ","c2":"និងគោលដៅ","end":"៥ ឆ្នាំទៀត"}}
def w(c):
    if c in " ": return 0
    if c in "៖។?": return 4
    if c==",": return 2
    if re.match(r"[A-Za-z]",c): return 0.55
    if c in "០១២៣៤៥៦៧៨៩": return 2.2
    if 'ា'<=c<='៝': return 0.5   # vowel signs / diacritics
    if c=='្': return 0.2               # coeng
    return 1
def frac(text,pos):
    tot=sum(w(c) for c in text); return sum(w(c) for c in text[:pos])/tot
def chunks(text):
    parts=[p.strip() for p in re.split(r"(?<=[៖។?])\s*",text) if p.strip()]
    out=[]
    for p in parts:
        while len(p)>62:
            # split at space nearest middle
            sp=[m.start() for m in re.finditer(" ",p)]
            if not sp: break
            mid=min(sp,key=lambda i:abs(i-len(p)/2)); out.append(p[:mid]); p=p[mid+1:]
        out.append(p)
    return out
LEAD0,GAP,TAIL=0.6,0.2,1.4
t=0; scenes=[]
for i,s in enumerate(S):
    d=D[s['id']]; start=t; vo=start+(LEAD0 if i==0 else GAP*0.5+0.15)
    end=vo+d+(TAIL if i==len(S)-1 else GAP*0.5+0.1)
    text=s['say']; cues={}
    for k,ph in CUES[s['id']].items():
        p=text.find(ph); assert p>=0,(s['id'],ph)
        cues[k]=round(vo+frac(text,p)*d,3)
    subs=[]; pos=0
    for c in chunks(text):
        p=text.find(c,pos); q=p+len(c); pos=q
        subs.append({"t0":round(vo+frac(text,p)*d,3),"t1":round(vo+frac(text,q)*d,3),"text":c.rstrip("។")})
    for a,b in zip(subs,subs[1:]): a["t1"]=b["t0"]
    subs[-1]["t1"]=round(vo+d+0.3,3)
    scenes.append({"id":s['id'],"start":round(start,3),"end":round(end,3),"vo":round(vo,3),"voDur":d,"cues":cues,"subs":subs})
    t=end
json.dump({"scenes":scenes,"total":round(t,3)},open('timing.json','w'),ensure_ascii=False,indent=1)
print("total",round(t,2))
for s in scenes: print(s['id'],s['start'],s['end'],[x['text'] for x in s['subs']])
