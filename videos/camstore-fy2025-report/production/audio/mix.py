import json, subprocess, numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy import signal
SR = 48000
S = '/tmp/claude-0/-home-user-test/aeb7e1f5-b6c7-55a7-9c46-045b797848f1/scratchpad'
L = 60 * SR
meter = pyln.Meter(SR)

# ---------- VO track
plan = json.load(open(f'{S}/vo/plan.json'))
vo = np.zeros(L)
for sc in plan:
    for k, s, e in sc['phrases']:
        a, sr = sf.read(f'{S}/vo/v2/{k}_t.wav')
        a = signal.resample_poly(a, 2, 1)
        i = int(round(s * SR))
        vo[i:i + len(a)] += a[: L - i]
sf.write(f'{S}/music/vo_raw.wav', vo.astype(np.float32), SR, subtype='FLOAT')
chain = ('highpass=f=75,equalizer=f=250:t=q:w=1.0:g=-1.5,equalizer=f=3200:t=q:w=1.1:g=2.5,'
         'equalizer=f=7500:t=q:w=1.0:g=1.5,acompressor=threshold=-22dB:ratio=3:attack=4:release=90:makeup=3,'
         'deesser=i=0.35:m=0.5:f=0.5')
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', f'{S}/music/vo_raw.wav', '-af', chain, '-c:a', 'pcm_f32le', f'{S}/music/vo_proc.wav'], check=True)
vo, _ = sf.read(f'{S}/music/vo_proc.wav')
vo = vo[:L]
vo *= 10 ** ((-16.5 - meter.integrated_loudness(vo)) / 20)   # VO at -16.5 LUFS
# subtle room so the voice sits in the same space as the score
t = np.arange(int(0.9 * SR)) / SR
rng = np.random.default_rng(3)
ir = rng.standard_normal((len(t), 2)) * (10 ** (-3 * t / 0.7))[:, None]
ir[: int(0.01 * SR)] = 0
ir /= np.sqrt((ir ** 2).sum())
room = np.stack([signal.fftconvolve(vo, ir[:, c])[:L] for c in range(2)], 1)
sos = signal.butter(2, [300, 6000], 'band', fs=SR, output='sos')
room = signal.sosfilt(sos, room, axis=0)
vo2 = np.stack([vo, vo], 1) + room * 0.085

# ---------- music
music = sum(sf.read(f'{S}/music/stems/{k}.wav')[0][:L] for k in ['piano', 'pad', 'bass', 'arp', 'drums', 'fx'])
def peq(x, f0, g, q):
    A = 10 ** (g / 40); w0 = 2 * np.pi * f0 / SR; al = np.sin(w0) / (2 * q)
    b = np.array([1 + al * A, -2 * np.cos(w0), 1 - al * A]); a = np.array([1 + al / A, -2 * np.cos(w0), 1 - al / A])
    return signal.lfilter(b / a[0], a / a[0], x, axis=0)
music = peq(music, 300, -2.0, 0.9)
music = peq(music, 2800, -2.5, 0.8)
music *= 10 ** ((-19.0 - meter.integrated_loudness(music)) / 20)   # bed level before ducking

# ducking envelope from VO
env = np.abs(vo)
att, rel = np.exp(-1 / (0.035 * SR)), np.exp(-1 / (0.45 * SR))
g = np.zeros(L); cur = 0.0
thr = 10 ** (-40 / 20)
active = (signal.lfilter([1 - np.exp(-1 / (0.02 * SR))], [1, -np.exp(-1 / (0.02 * SR))], env) > thr * 0.6).astype(float)
for i in range(0, L, 64):   # block-wise smoothing for speed
    tgt = active[i]
    coef = att if tgt > cur else rel
    cur = tgt + (cur - tgt) * coef ** 64
    g[i:i + 64] = cur
depth_db = 9.0
duck = 10 ** (-depth_db * g / 20)
music_d = music * duck[:, None]

# ---------- SFX
def sfx(name):
    a, _ = sf.read(f'{S}/music/sfx/{name}.wav'); return a
sfxbus = np.zeros((L, 2))
def place(name, t, gain_db, pan=0.0):
    a = sfx(name) * 10 ** (gain_db / 20)
    l, r = np.cos((pan + 1) * np.pi / 4) * np.sqrt(2), np.sin((pan + 1) * np.pi / 4) * np.sqrt(2)
    a = a * np.array([l, r])
    i = int(round(t * SR)); n = min(len(a), L - i)
    if i < 0: a, n, i = a[-i:], min(len(a) + i, L), 0
    sfxbus[i:i + n] += a[:n]
cuts = [5.0, 11.25, 23.75, 30.625, 36.25, 46.875, 55.0]
for j, c in enumerate(cuts):
    place('whoosh-short', c - 0.16 - 0.05, -17 if c not in (46.875, 55.0) else -14, pan=(-0.3 if j % 2 else 0.3))
place('whoosh-cinematic', 55.0 - 2.55, -20)
for t_ in (14.75, 41.2, 45.6):
    place('pop', t_ - 0.05, -26)
for t_ in (25.7, 27.1, 29.0):
    place('click-soft', t_, -22, pan=0.2)
for t_ in (30.85, 33.15, 34.85):
    place('click-soft', t_, -24, pan=-0.2)
for t_ in (48.75, 50.35, 51.8):
    place('click-soft', t_ + 0.05, -21)
place('ping', 21.65 - 0.33 + 0.1, -27)
place('sparkle', 57.9, -30)

mix = vo2 + music_d + sfxbus
mix[-int(0.6 * SR):] *= np.linspace(1, 0, int(0.6 * SR))[:, None] ** 2
sf.write(f'{S}/music/premaster.wav', mix.astype(np.float32), SR, subtype='FLOAT')

# report
for a, b in [(0, 5), (5, 11.25), (11.25, 23.75), (23.75, 30.6), (30.6, 36.25), (36.25, 46.9), (46.9, 55), (55, 60)]:
    sl = slice(int(a * SR), int(b * SR))
    print(f'{a:5.2f}-{b:5.2f} vo {meter.integrated_loudness(vo2[sl]):6.1f}  music(ducked) {meter.integrated_loudness(music_d[sl]):6.1f}  total {meter.integrated_loudness(mix[sl]):6.1f}')
print('premaster LUFS', round(meter.integrated_loudness(mix), 2), 'peak dB', round(20 * np.log10(np.abs(mix).max()), 2))
