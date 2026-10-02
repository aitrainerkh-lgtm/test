import numpy as np, soundfile as sf, subprocess, json, os
from scipy import signal
SR = 48000; DUR = 61.5; N = int(SR * DUR)
rng = np.random.default_rng(20261002)
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'audio', 'soundtrack.wav')

def load(path):
    a, sr = sf.read(path, always_2d=True)
    if sr != SR:
        a = signal.resample_poly(a, SR, sr, axis=0)
    return a
def lufs_norm(path, target, out, eq=''):
    # two-pass loudnorm (linear) for clean, consistent levels
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', path, '-af', f'loudnorm=I={target}:TP=-2:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
    j = json.loads(r[r.rindex('{'):r.rindex('}') + 1])
    af = (f"highpass=f=75,{eq}loudnorm=I={target}:TP=-2:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:"
          f"measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', path, '-af', af, '-ar', str(SR), out], check=True)

# ---------------- VO ----------------
SEL = {"S1": ("S1_t2", 0.53), "S2": ("S2_t14", 4.75), "S3": ("S3_t10", 11.85), "S4": ("S4_t0", 18.83),
       "S5": ("S5_t2", 30.06), "S6": ("S6_t10", 39.51), "S7": ("S7_t12", 48.77), "S8": ("S8_t10", 55.31)}
vo = np.zeros((N, 2))
def trim_tts(src, dst):
    # Gemini TTS clips carry a click at the head and a loud noise burst in the last ~0.15 s: keep only the speech
    a, sr = sf.read(src); a = a if a.ndim == 1 else a.mean(1)
    w = int(0.02 * sr); r = np.array([np.sqrt((a[i:i + w] ** 2).mean()) for i in range(0, len(a) - w, w)])
    db_ = 20 * np.log10(r + 1e-12); lo, hi = int(0.08 / 0.02), len(db_) - int(0.32 / 0.02)
    voiced = [i for i in range(lo, hi) if db_[i] > -42]
    st = max(0, voiced[0] * w - int(0.06 * sr)); en = min(len(a), (voiced[-1] + 1) * w + int(0.14 * sr))
    seg = a[st:en].copy(); fi, fo = int(0.012 * sr), int(0.06 * sr)
    seg[:fi] *= np.linspace(0, 1, fi); seg[-fo:] *= np.linspace(1, 0, fo)
    sf.write(dst, seg, sr); return st / sr
for k, (f, t) in SEL.items():
    off = trim_tts(f'vo/{f}.wav', f'mix/{k}_trim.wav')
    t = t + off
    lufs_norm(f'mix/{k}_trim.wav', -16, f'mix/{k}.wav', 'equalizer=f=300:t=q:w=1.2:g=-2,highshelf=f=8000:g=1.5,')
    a = load(f'mix/{k}.wav').mean(1)
    # gentle presence: light compression via soft knee on peaks
    i0 = int(t * SR); n = min(len(a), N - i0)
    vo[i0:i0 + n, 0] += a[:n]; vo[i0:i0 + n, 1] += a[:n]

# VO activity envelope for ducking
env = np.abs(vo[:, 0])
win = int(0.03 * SR)
env = np.convolve(env, np.ones(win) / win, mode='same')
act = (env > 10 ** (-38 / 20)).astype(float)
# bridge gaps between words (< 0.45 s) so the music does not swell mid-sentence
gap = int(0.8 * SR); idx = np.flatnonzero(act)
if len(idx):
    d_ = np.diff(idx); for_fill = np.flatnonzero((d_ > 1) & (d_ < gap))
    for k in for_fill: act[idx[k]:idx[k + 1]] = 1.0
# attack 60ms / release 450ms smoothing
def smooth(x, a_ms, r_ms):
    a = np.exp(-1 / (SR * a_ms / 1000)); r = np.exp(-1 / (SR * r_ms / 1000))
    y = np.zeros_like(x); s = 0.0
    # vectorised in blocks for speed
    step = 48
    for i in range(0, len(x), step):
        v = x[i:i + step].max()
        c = a if v > s else r
        s = c ** step * s + (1 - c ** step) * v
        y[i:i + step] = s
    return y
duck = smooth(act, 160, 900)

# ---------------- MUSIC ----------------
lufs_norm('music/bed2.wav', -19, 'mix/bed_n.wav')
mu = load('mix/bed_n.wav')[:N]
if len(mu) < N: mu = np.vstack([mu, np.zeros((N - len(mu), 2))])
gain_db = -3.5 * duck - 1.0                      # duck under narration
t = np.arange(N) / SR
fade = np.clip((t - 0.0) / 0.4, 0, 1) * np.cos(0.5 * np.pi * np.clip((t - 59.0) / 2.5, 0, 1)) ** 1.2
mu *= (10 ** (gain_db / 20) * fade)[:, None]

# ---------------- SFX synthesis ----------------
sfx = np.zeros((N, 2))
def place(sig, at, gain_db=0, pan=0.0):
    if sig.ndim == 1: sig = np.stack([sig * np.sqrt((1 - pan) / 2) * 1.414, sig * np.sqrt((1 + pan) / 2) * 1.414], 1)
    i0 = int(at * SR); n = min(len(sig), N - i0)
    if n <= 0 or i0 < 0: return
    sfx[i0:i0 + n] += sig[:n] * 10 ** (gain_db / 20)
def expenv(n, tau): return np.exp(-np.arange(n) / (tau * SR))
def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], btype='band', fs=SR, output='sos'); return signal.sosfilt(sos, x)
def lp(x, f, order=2):
    sos = signal.butter(order, f, btype='low', fs=SR, output='sos'); return signal.sosfilt(sos, x)
def hp(x, f, order=2):
    sos = signal.butter(order, f, btype='high', fs=SR, output='sos'); return signal.sosfilt(sos, x)
IR = rng.standard_normal(int(1.1 * SR)) * expenv(int(1.1 * SR), 0.28); IR = lp(IR, 6000); IR /= np.abs(IR).sum() ** 0.5 * 6
def verb(x, mix=0.25):
    w = signal.fftconvolve(x, IR)[:len(x) + len(IR) - 1]
    y = np.zeros(len(w)); y[:len(x)] += x * (1 - mix); return y + w * mix
def norm(x, peak=0.9): return x / (np.abs(x).max() + 1e-9) * peak

def tick(f=2200, d=0.035):
    n = int(d * SR); tt = np.arange(n) / SR
    return norm(np.sin(2 * np.pi * f * tt) * expenv(n, d / 4) + 0.3 * hp(rng.standard_normal(n), 3000) * expenv(n, 0.003), 0.5)
def click():
    n = int(0.03 * SR)
    x = hp(rng.standard_normal(n), 2500) * expenv(n, 0.0025) + 0.6 * np.sin(2 * np.pi * 1800 * np.arange(n) / SR) * expenv(n, 0.004)
    return norm(lp(x, 5500), 0.7)
def pop(f=900):
    n = int(0.14 * SR); tt = np.arange(n) / SR
    ph = 2 * np.pi * np.cumsum(f * (1 + 0.6 * np.exp(-tt / 0.012))) / SR
    return norm(verb(np.sin(ph) * expenv(n, 0.035) * (1 - np.exp(-tt / 0.002)), 0.15), 0.55)
def ping(f=1318, f2=1760):
    n = int(0.9 * SR); tt = np.arange(n) / SR
    a = sum(np.sin(2 * np.pi * ff * tt) * expenv(n, dd) * g for ff, dd, g in [(f, .35, 1), (f * 2.76, .12, .25), (f * 5.4, .05, .1)])
    b = np.zeros(n); k = int(0.09 * SR)
    b[k:] = sum(np.sin(2 * np.pi * ff * tt[:n - k]) * expenv(n - k, dd) * g for ff, dd, g in [(f2, .4, 1), (f2 * 2.76, .12, .25)])
    return norm(lp(verb(a + b, 0.3), 4200), 0.5)
def whoosh(d=0.6, f0=400, f1=4000, peak=0.65, up=True):
    # smooth spectral sweep (STFT mask) — no per-block filter switching, so no crackle
    n = int(d * SR); x = rng.standard_normal(n + 4096)
    f, tt_, Z = signal.stft(x, fs=SR, nperseg=1024, noverlap=896)
    lf = np.log(np.maximum(f, 20.0))
    for j in range(Z.shape[1]):
        p = min(1.0, max(0.0, tt_[j] / d)); fc = f0 * (f1 / f0) ** (p if up else 1 - p)
        Z[:, j] *= np.exp(-0.5 * ((lf - np.log(fc)) / 0.5) ** 2)
    y = signal.istft(Z, fs=SR, nperseg=1024, noverlap=896)[1][:n]
    tt = np.arange(n) / n
    e = np.where(tt < peak, np.sin(0.5 * np.pi * tt / peak) ** 2, np.cos(0.5 * np.pi * (tt - peak) / (1 - peak)) ** 1.6)
    y = verb(y * e, 0.18)
    L = y * np.linspace(1.15, 0.7, len(y)); R = y * np.linspace(0.7, 1.15, len(y))
    return np.stack([norm(L, 0.5), norm(R, 0.5)], 1)
def impact(big=1.0):
    n = int(1.6 * SR); tt = np.arange(n) / SR
    sub = np.sin(2 * np.pi * np.cumsum(38 + 50 * np.exp(-tt / 0.08)) / SR) * expenv(n, 0.35)
    nz = lp(rng.standard_normal(n), 1800) * expenv(n, 0.06)
    tr = hp(rng.standard_normal(n), 3000) * expenv(n, 0.004)
    x = sub * 1.0 + nz * 0.5 * big + tr * 0.35
    return norm(verb(hp(x, 55), 0.35), 0.85)
def shimmer(d=0.8, lo=2500, hi=7000, dens=60):
    n = int(d * SR); y = np.zeros(n)
    for _ in range(int(dens * d)):
        st = int(rng.uniform(0, 0.85) * n); f = rng.uniform(lo, hi); m = int(0.08 * SR)
        m = min(m, n - st); tt = np.arange(m) / SR
        y[st:st + m] += np.sin(2 * np.pi * f * tt) * expenv(m, 0.02) * rng.uniform(0.3, 1)
    y *= np.sin(np.linspace(0, np.pi, n)) ** 0.8
    return norm(verb(y, 0.4), 0.45)
def chime(base=1046.5, notes=(0, 4, 7, 12), gap=0.07):
    n = int(1.4 * SR); y = np.zeros(n)
    for k, st in enumerate(notes):
        f = base * 2 ** (st / 12); i0 = int(k * gap * SR); m = n - i0; tt = np.arange(m) / SR
        y[i0:] += (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * 2 * f * tt)) * expenv(m, 0.3) * (1 - np.exp(-tt / 0.003))
    return norm(lp(verb(y, 0.35), 5000), 0.5)
def typing(d, rate=14, gain=1.0):
    n = int(d * SR); y = np.zeros(n); t0 = 0.0
    while t0 < d - 0.05:
        i = int(t0 * SR); m = int(0.03 * SR)
        k = bp(rng.standard_normal(m), 1500, 6000) * expenv(m, 0.006) * rng.uniform(0.5, 1)
        k += 0.5 * np.sin(2 * np.pi * rng.uniform(140, 220) * np.arange(m) / SR) * expenv(m, 0.01)
        y[i:i + m] += k[:max(0, min(m, n - i))]
        t0 += rng.uniform(0.6, 1.4) / rate
    return norm(y, 0.5 * gain)
def riser(d=0.9):
    n = int(d * SR); tt = np.arange(n) / SR
    s = np.sin(2 * np.pi * np.cumsum(200 * (8 ** (tt / d))) / SR) * 0.25
    w = whoosh(d, 300, 6000, 0.97)[:, 0]
    return norm((s + w[:n]) * (tt / d) ** 1.5, 0.6)
def scratch(d=0.4):
    return whoosh(d, 2000, 7000, 0.3, True)
def thump():
    n = int(0.5 * SR); tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * np.cumsum(70 + 90 * np.exp(-tt / 0.02)) / SR) * expenv(n, 0.09) + 0.3 * lp(rng.standard_normal(n), 900) * expenv(n, 0.02)
    return norm(verb(x, 0.2), 0.7)

S = {}
# ---- S1 hook
place(typing(3.2, 13), 0.25, -19, 0.1)
for i, tm in enumerate([0.05, 0.12, 0.22, 0.42, 0.62, 0.85, 1.05, 1.25, 1.5]): place(pop(700 + 90 * (i % 5)), tm, -21, [-.6, .5, .3, -.2, .6, -.5, .4, .7, .1][i])
for i, tm in enumerate([0.55, 1.05, 1.5, 1.95, 2.4]): place(ping(1318 + 60 * i, 1760 + 60 * i), tm, -21, 0.6)
for tm in [2.55, 2.75, 2.95]: place(thump(), tm, -19)
place(riser(0.95), 3.5, -15); place(whoosh(0.7, 300, 5000, 0.8), 3.75, -14)
# ---- S2 agent
place(shimmer(0.7), 4.45, -22)
place(typing(1.9, 17, 1.0), 6.40, -18)
place(click(), 8.40, -14); place(whoosh(0.35, 800, 5000, 0.4), 8.42, -21)
place(shimmer(0.9, 3000, 9000, 120), 8.50, -17)
place(impact(0.7), 9.17, -13); place(shimmer(1.0, 2000, 6000, 70), 9.17, -20)
place(whoosh(0.45, 500, 3500, 0.5), 9.33, -22)
for i in range(6): place(tick(1568 * 2 ** (i * 2 / 12), 0.06), 10.0 + i * 0.07, -25, -0.5 + i * 0.2)
place(whoosh(0.5, 3000, 600, 0.6, False), 10.95, -18)
# ---- S3 understand
place(pop(820), 11.58, -21)
for tm in [12.22, 14.38, 16.08]: place(whoosh(0.7, 500, 3000, 0.55), tm, -21)
place(whoosh(0.85, 1500, 6000, 0.5), 12.8, -25)
for tm in [13.1, 13.5]: place(tick(1975), tm, -21)
for i in range(5): place(pop(900 + 110 * i), 13.6 + i * 0.1, -22)
for i in range(5): place(tick(1318 + 80 * i), 15.0 + i * 0.12, -22)
for tm in [17.10, 17.60, 18.10]: place(chime(1568, (0, 7), 0.05), tm, -23)
place(whoosh(0.7, 2500, 400, 0.6, False), 17.72, -20); place(whoosh(0.6, 400, 4000, 0.6), 18.5, -18)
# ---- S4 tools
place(pop(760), 19.39, -21); place(tick(1200), 19.69, -24); place(pop(880), 20.07, -21)
place(whoosh(0.5, 600, 4500, 0.45), 20.62, -19)
for i in range(6): place(pop(1000 + 120 * i), 20.84 + i * 0.07, -21, 0.2 + i * 0.1)
place(whoosh(0.55, 3000, 500, 0.6, False), 22.27, -21)
for tm in [22.47, 24.04, 24.71, 25.84]: place(whoosh(0.4, 700, 4000, 0.4), tm, -21)
for tm in [22.94, 23.75, 25.51, 26.24, 27.91, 28.51]: place(click(), tm, -15)
place(typing(0.45, 22), 22.99, -18)
place(whoosh(0.55, 1500, 6000, 0.5), 24.14, -25)
place(typing(0.6, 30, 0.6), 24.89, -24)
for i, tm in enumerate([23.84, 24.59, 25.64, 26.59]): place(chime(1318 + 120 * i, (0, 7), 0.06), tm + 0.35, -24); place(whoosh(0.4, 900, 3500, 0.5), tm, -24)
place(whoosh(0.8, 3000, 400, 0.6, False), 26.99, -20)
place(riser(0.6), 29.15, -18); place(whoosh(0.9, 400, 5000, 0.7), 29.0, -16)
# ---- S5 take action
place(impact(1.0), 29.78, -11)
place(whoosh(0.6, 2500, 500, 0.5, False), 31.76, -21)
place(whoosh(0.45, 600, 4000, 0.8), 32.06, -20); place(shimmer(0.5), 32.51, -22)
place(typing(0.9, 26, 0.6), 32.55, -24)
place(whoosh(0.7, 300, 3500, 0.5), 33.68, -18)
for i in range(5): place(tick(523 * 2 ** ((0, 2, 4, 7, 9)[i] / 12) * 2, 0.08), 33.95 + i * 0.05, -27)
place(shimmer(0.6, 3000, 8000, 80), 34.36, -27)
place(whoosh(0.7, 400, 3000, 0.5), 34.76, -19)
for tm in [35.11, 35.21, 35.31]: place(pop(1100), tm, -22)
for tm in [35.96, 36.06]: place(whoosh(0.25, 2000, 6000, 0.3), tm, -23)
place(whoosh(0.7, 500, 3000, 0.5), 36.51, -21)
place(whoosh(0.4, 900, 4000, 0.6), 36.95, -21)
place(scratch(0.45), 37.71, -18)
place(impact(0.9), 38.11, -12)
place(thump(), 38.26, -15)
place(pop(980), 38.51, -20)
place(whoosh(0.45, 500, 5000, 0.85), 39.0, -17)
# ---- S6 team
place(riser(0.7), 38.85, -24); place(whoosh(0.4, 4000, 800, 0.2, False), 39.54, -20)
place(whoosh(0.5, 600, 4000, 0.45), 39.77, -21)
place(impact(0.4), 40.44, -17)
place(whoosh(0.8, 500, 4000, 0.5), 40.99, -18)
for i in range(4): place(pop(800 + 150 * i), 41.69 + i * 0.08, -20, [-.6, .6, -.6, .6][i])
for i in range(4): place(whoosh(0.5, 1000, 6000, 0.6), 42.14 + i * 0.1, -25, [-.6, .6, -.6, .6][i])
place(shimmer(1.4, 2500, 7000, 40), 42.84, -24)
place(typing(2.4, 10, 0.5), 43.9, -26)
for i, tm in enumerate([45.89, 46.09, 46.39, 46.49]): place(chime(1318 + 100 * i, (0, 7, 12), 0.05), tm, -22, [-.6, .6, -.6, .6][(2, 0, 1, 3)[i]])
place(whoosh(1.0, 6000, 800, 0.8, False), 46.74, -22)
for tm in [47.49, 47.69]: place(thump(), tm, -18)
place(shimmer(0.8), 47.59, -20)
place(whoosh(0.4, 3000, 500, 0.8, False), 48.42, -18)
# ---- S7 review
place(pop(700), 48.86, -21)
place(whoosh(0.5, 600, 3500, 0.45), 49.25, -22)
for i, tm in enumerate([51.47, 51.87, 52.27]): place(tick(1568 + 200 * i, 0.07), tm, -20)
place(click(), 53.12, -17); place(chime(1046.5, (0, 4, 7, 12), 0.08), 53.2, -23); place(thump(), 53.5, -19)
# ---- S8 finale
place(whoosh(1.2, 5000, 300, 0.25, False), 55.3, -17)
place(impact(0.6), 55.58, -19)
place(impact(0.7), 56.82, -18)
place(impact(1.0), 58.78, -16.5); place(shimmer(1.6, 2000, 8000, 60), 58.8, -21)
place(whoosh(0.5, 1500, 6000, 0.6), 59.25, -24)
place(chime(784, (0, 4, 7, 12, 16), 0.09), 60.05, -21)

# ---------------- MASTER ----------------
sfx *= (10 ** (-3.0 * duck / 20))[:, None]   # effects step back while the narrator speaks
mix = vo * 1.0 + mu * 1.0 + sfx * 1.3
sf.write('mix/premaster.wav', mix, SR, subtype='FLOAT')
sf.write('mix/vo_only.wav', vo, SR, subtype='FLOAT'); sf.write('mix/mu_only.wav', mu, SR, subtype='FLOAT'); sf.write('mix/sfx_only.wav', sfx, SR, subtype='FLOAT')
r = subprocess.run(['ffmpeg', '-hide_banner', '-i', 'mix/premaster.wav', '-af', 'loudnorm=I=-14:TP=-1.2:LRA=9:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
j = json.loads(r[r.rindex('{'):r.rindex('}') + 1])
af = (f"alimiter=limit=0.89:attack=3:release=60:level=disabled,loudnorm=I=-14:TP=-1.2:LRA=9:measured_I={j['input_i']}:measured_TP={j['input_tp']}:"
      f"measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'mix/premaster.wav', '-af', af, '-ar', str(SR), '-c:a', 'pcm_s24le', OUT], check=True)
print('premaster', j['input_i'], j['input_tp'])
