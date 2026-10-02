import sys, glob, json, re, time; sys.path.insert(0, 'tools'); from gem import *
from concurrent.futures import ThreadPoolExecutor
S = json.load(open('script_final.json'))
def P(ref): return ("You are a native Cambodian Khmer speaker and strict professional voice-over director. Listen to the audio.\n"
     "Intended script: " + ref + "\n"
     "1) Transcribe exactly what is said (Khmer script; English words in Latin). 2) exact_match: true only if the audio says the script with no missing, extra or changed words. "
     "3) Rate 1-10: pron (native Khmer pronunciation accuracy), natural (natural Cambodian prosody, not robotic), clarity, tone (professional, confident, friendly). "
     "4) issues: list mispronounced/unclear words or odd pauses.\nReturn only JSON: {\"transcript\":\"\",\"exact_match\":true,\"pron\":0,\"natural\":0,\"clarity\":0,\"tone\":0,\"issues\":[]}")
files = sorted(glob.glob('vo/S*_t*.wav'))
def run(f):
    k = f.split('/')[-1].split('_')[0]
    for i in range(3):
        try:
            t = text("gemini-3.1-pro-preview", P(S[k]['text']), audio_parts(f), temperature=0.0)
            j = json.loads(t[t.index('{'):t.rindex('}')+1]); j['file'] = f; return j
        except Exception as e: time.sleep(10)
    return {'file': f, 'error': True}
with ThreadPoolExecutor(3) as ex: res = list(ex.map(run, files))
json.dump(res, open('judge_results.json', 'w'), ensure_ascii=False, indent=1)
for r in res:
    if r.get('error'): print(r['file'], 'ERROR'); continue
    sc = r['pron'] + r['natural'] + r['clarity'] + r['tone']
    print(f"{r['file']:18} match={r['exact_match']!s:5} score={sc:2} p{r['pron']} n{r['natural']} c{r['clarity']} t{r['tone']} {r['issues']}")
