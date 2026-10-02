import sys, json, os, time, re, glob; sys.path.insert(0, 'tools'); from gem import *
S = json.load(open('script_final.json'))
want = int(os.environ.get('TAKES', 3))
def expected(t):
    eng = re.findall(r'[A-Za-z]+', t)
    kh = len(re.sub(r'[A-Za-z\s\?។៖,]', '', t))
    return kh / 10.5 + len(eng) * 0.42 + t.count('។') * 0.35
def ok(path, t):
    import wave
    w = wave.open(path); d = w.getnframes() / w.getframerate()
    e = expected(t); return 0.65 * e <= d <= 1.45 * e, d, e
for k in (sys.argv[1:] or list(S)):
    t = S[k]['text']
    have = [f for f in glob.glob(f'vo/{k}_t*.wav') if ok(f, t)[0]]
    n = 10; tries = 0
    while len(have) < want and tries < 8:
        tries += 1
        out = f'vo/{k}_t{n}.wav'; n += 1
        while os.path.exists(out): out = f'vo/{k}_t{n}.wav'; n += 1
        p = ("Read the following in natural Cambodian Khmer (Phnom Penh accent), as a professional, confident and friendly technology explainer narrator. "
             + S[k]['dir'] + " Moderate pace, clear, warm, not robotic, not dramatic. Say the English words in English.\n\n" + t)
        try:
            tts("gemini-3.8-flash-tts", p, "Charon", out)
        except Exception as ex:
            print(k, 'ERR', str(ex)[:80]); time.sleep(20); continue
        good, d, e = ok(out, t)
        print(k, out, f'{d:.2f}s exp {e:.2f}s', 'OK' if good else 'REJECT')
        if good: have.append(out)
        else: os.rename(out, out.replace('vo/', 'vo_bad/'))
        time.sleep(6.5)
    print(k, 'valid takes:', sorted(have))
