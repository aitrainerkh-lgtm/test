import sys,json,os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from gem import call,save_audio
from concurrent.futures import ThreadPoolExecutor
MODEL=os.environ.get("TTS_MODEL","gemini-3.8-flash-lite-tts")
s=json.load(open("script.json"))
VOICE={"NARRATOR":("Charon","calm, warm documentary narrator"),"SOPHEA":("Sulafat","warm, confident female manager"),
 "DARA":("Puck","energetic, cheerful young man"),"RECRUIT":("Leda","bright, friendly, slightly playful assistant"),
 "PAYROLL":("Orus","precise, friendly, steady assistant"),"ONBOARD":("Zephyr","cheerful, welcoming assistant")}
jobs=[(si,li,l) for si,sc in enumerate(s['scenes']) for li,l in enumerate(sc['lines'])]
def go(j):
    si,li,l=j; out=f"audio/s{si+1}_{li+1}"
    if os.path.exists(out+".wav"): return
    v,style=VOICE[l['speaker']]
    d=call(MODEL,{"contents":[{"parts":[{"text":l["khmer"]}]}],
      "generationConfig":{"responseModalities":["AUDIO"],"speechConfig":{"voiceConfig":{"prebuiltVoiceConfig":{"voiceName":v}}}}},tries=6)
    if 'error' in d: print(out,"ERR",d['error']['message'][:200],flush=True); return
    save_audio(d,out); print(out,"ok",flush=True)
list(ThreadPoolExecutor(4).map(go,jobs))
