import sys, json, os, soundfile as sf, numpy as np
from kokoro_onnx import Kokoro
M='/tmp/claude-0/-home-user-test/aeb7e1f5-b6c7-55a7-9c46-045b797848f1/scratchpad/models/'
k = Kokoro(M+'kokoro-v1.0.onnx', M+'voices-v1.0.bin')
voice=sys.argv[1]; speed=float(sys.argv[2]); lines=json.load(open(sys.argv[3])); out=sys.argv[4]
os.makedirs(out, exist_ok=True)
for key,text in lines.items():
    if text.startswith('PH:'):
        a,sr=k.create(text[3:], voice=voice, speed=speed, is_phonemes=True)
    else:
        ph=k.tokenizer.phonemize(text,'en-us')
        a,sr=k.create(ph, voice=voice, speed=speed, is_phonemes=True)
    sf.write(f'{out}/{key}.wav', a, sr); print(key, round(len(a)/sr,2), flush=True)
