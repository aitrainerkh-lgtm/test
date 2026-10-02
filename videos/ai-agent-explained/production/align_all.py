import sys, json, subprocess, numpy as np; sys.path.insert(0, 'tools'); from gem import *
from concurrent.futures import ThreadPoolExecutor
SEL = {"S1":"S1_t2","S2":"S2_t14","S3":"S3_t10","S4":"S4_t0","S5":"S5_t2","S6":"S6_t10","S7":"S7_t12","S8":"S8_t10"}
PH = {
 "S1":"ចុះបើ AI | អាចធ្វើបានច្រើន | ជាងត្រឹមតែឆ្លើយសំណួររបស់អ្នក?",
 "S2":"អ្នកគ្រាន់តែប្រាប់ថា៖ | រៀបចំរបាយការណ៍ | អាជីវកម្មថ្ងៃនេះ។ | ហើយ AI Agent | ចាប់ផ្តើមធ្វើការភ្លាម។",
 "S3":"ដំបូង | វាស្វែងយល់ពីអ្វីដែលអ្នកត្រូវការ។ | បន្ទាប់មក | វារៀបចំផែនការ | ហើយអនុវត្ត | ម្តងមួយជំហានៗ។",
 "S4":"ខុសពី Chatbot ធម្មតា | AI Agent ចេះប្រើ Tools។ | វាបើក Browser | ស្វែងរកព័ត៌មាន | អានឯកសារ | ប្រើ Spreadsheet | និងពិនិត្យប្រតិទិន | ដូចបុគ្គលិកម្នាក់កំពុងធ្វើការលើកុំព្យូទ័រ។",
 "S5":"បន្ទាប់មក វាចាប់ផ្តើមអនុវត្ត៖ | ទិន្នន័យចូលទៅក្នុង Spreadsheet | បង្កើតជាក្រាហ្វ | រួចចេញជារបាយការណ៍ពេញលេញ។ | វាមិនត្រឹមតែនិយាយទេ | តែធ្វើការងារពិតៗ។",
 "S6":"សម្រាប់ការងារធំៗ | AI Agent អាចបែងចែកភារកិច្ច | ទៅក្រុម Agent ជំនាញ | ឱ្យធ្វើការព្រមគ្នា | រួចបូកសរុបលទ្ធផល | មកតែមួយ។",
 "S7":"ប៉ុន្តែ | មនុស្សនៅតែជាអ្នកសម្រេចចិត្ត។ | អ្នកគ្រប់គ្រងត្រួតពិនិត្យ | និងអនុម័ត | លទ្ធផលចុងក្រោយ។",
 "S8":"មនុស្សដឹកនាំ។ | AI Agent អនុវត្ត។ | ការងារសម្រេចបាន។"}
def energy(f):
    raw = subprocess.run(["ffmpeg","-v","error","-i",f,"-ac","1","-ar","16000","-f","s16le","-"],capture_output=True).stdout
    a = np.frombuffer(raw, np.int16).astype(float)/32768; hop=160
    return np.array([np.sqrt((a[i:i+640]**2).mean()) for i in range(0,len(a)-640,hop)])  # 10ms hop, 40ms win
def run(k):
    f = f"vo/{SEL[k]}.wav"
    P = ("Align this Khmer narration audio to its script. Script phrases separated by |: " + PH[k] + "\nGive start and end time in seconds (3 decimals) of each phrase as heard. Return only JSON list [{\"p\":\"...\",\"s\":0.0,\"e\":0.0}].")
    t = text("gemini-3.1-pro-preview", P, audio_parts(f), temperature=0.0)
    L = json.loads(t[t.index('['):t.rindex(']')+1])
    e = energy(f); db = 20*np.log10(e+1e-9); thr = db.max()-35
    voiced = np.where(db > thr)[0]; vs, ve = voiced[0]/100, voiced[-1]/100
    # refine internal boundaries to nearest energy minimum within +-0.3s
    for i in range(1, len(L)):
        b = (L[i-1]['e'] + L[i]['s'])/2; lo, hi = int(max(0,(b-0.3)*100)), int(min(len(e)-1,(b+0.3)*100))
        m = (lo + int(np.argmin(e[lo:hi])))/100; L[i]['s'] = m; L[i-1]['e'] = m
    L[0]['s'] = vs; L[-1]['e'] = ve
    return k, L
with ThreadPoolExecutor(4) as ex: R = dict(ex.map(run, SEL))
json.dump(R, open('align.json','w'), ensure_ascii=False, indent=1)
for k in SEL: print(k, " | ".join(f"{x['s']:.2f}-{x['e']:.2f} {x['p'][:14]}" for x in R[k]))
