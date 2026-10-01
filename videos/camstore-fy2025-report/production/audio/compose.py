"""Original score for the CamStore 365 FY2025 report film.

96 BPM, 4/4, 24 bars = 60.0 s exactly. Key: D major (B minor for the cost-pressure section).
Renders stems (piano, pad, bass, arp, drums, fx) to 48 kHz stereo WAVs.
"""
import numpy as np, soundfile as sf, os, json
from scipy import signal

SR = 48000
BPM = 96
B = 60 / BPM          # beat = 0.625 s
BAR = 4 * B           # bar  = 2.5 s
DUR = 60.0
N = int(DUR * SR) + SR * 4  # tail room
HERE = os.path.dirname(os.path.abspath(__file__))
rng = np.random.default_rng(2025)

def T(bar, beat=0.0):
    return (bar - 1) * BAR + beat * B

def buf():
    return np.zeros((N, 2))

def add(dst, x, t, gain=1.0, pan=0.0):
    """Mix mono or stereo x into dst at time t with constant-power pan."""
    i = int(round(t * SR))
    if i >= N:
        return
    if x.ndim == 1:
        l = np.cos((pan + 1) * np.pi / 4)
        r = np.sin((pan + 1) * np.pi / 4)
        x = np.stack([x * l, x * r], 1) * np.sqrt(2)
    n = min(len(x), N - i)
    dst[i:i + n] += x[:n] * gain

def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)

def lp(x, fc, order=2):
    sos = signal.butter(order, fc, 'low', fs=SR, output='sos')
    return signal.sosfilt(sos, x, axis=0)

def hp(x, fc, order=2):
    sos = signal.butter(order, fc, 'high', fs=SR, output='sos')
    return signal.sosfilt(sos, x, axis=0)

def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], 'band', fs=SR, output='sos')
    return signal.sosfilt(sos, x, axis=0)

def peq(x, f0, gain_db, q=1.0):
    A = 10 ** (gain_db / 40)
    w0 = 2 * np.pi * f0 / SR
    alpha = np.sin(w0) / (2 * q)
    b = [1 + alpha * A, -2 * np.cos(w0), 1 - alpha * A]
    a = [1 + alpha / A, -2 * np.cos(w0), 1 - alpha / A]
    return signal.lfilter(np.array(b) / a[0], np.array(a) / a[0], x, axis=0)

# ---------------------------------------------------------------- piano (Salamander samples)
NAMES = {'C': 0, 'Cs': 1, 'D': 2, 'Ds': 3, 'E': 4, 'F': 5, 'Fs': 6, 'G': 7, 'Gs': 8, 'A': 9, 'As': 10, 'B': 11}

def load_bank(folder):
    bank = {}
    for f in os.listdir(os.path.join(HERE, folder)):
        if f.endswith('.wav'):
            nm, octv = f[:-5], int(f[-5])
            a, _ = sf.read(os.path.join(HERE, folder, f))
            bank[12 * (octv + 1) + NAMES[nm]] = a
    return bank, np.array(sorted(bank))

PIANO, PKEYS = load_bank('piano')
HARP, HKEYS = load_bank('harp')

def harp_note(m, vel=0.6, dur=1.2):
    k = HKEYS[np.argmin(np.abs(HKEYS - m))]
    src = HARP[k]
    ratio = 2 ** ((m - k) / 12)
    L = int(min(len(src) / ratio, (dur + 0.6) * SR))
    idx = np.arange(L) * ratio
    i0 = idx.astype(int)
    fr = (idx - i0)[:, None]
    x = src[i0] * (1 - fr) + src[np.minimum(i0 + 1, len(src) - 1)] * fr
    rel = int(dur * SR)
    if rel < L:
        x[rel:] *= np.exp(-np.arange(L - rel) / (0.15 * SR))[:, None]
    return x * vel

def piano_note(m, dur, vel=0.7):
    k = PKEYS[np.argmin(np.abs(PKEYS - m))]
    src = PIANO[k]
    ratio = 2 ** ((m - k) / 12)
    L = int(min(len(src) / ratio, (dur + 1.6) * SR))
    idx = np.arange(L) * ratio
    i0 = idx.astype(int)
    fr = (idx - i0)[:, None]
    i1 = np.minimum(i0 + 1, len(src) - 1)
    x = src[i0] * (1 - fr) + src[i1] * fr
    # damper release
    rel_i = int(dur * SR)
    if rel_i < L:
        rl = L - rel_i
        x[rel_i:] *= np.exp(-np.arange(rl) / (0.28 * SR))[:, None]
    # softer notes are darker
    fc = 1800 + 9000 * vel ** 2
    x = lp(x, fc, 1)
    return x * (vel ** 1.6)

# ---------------------------------------------------------------- band-limited wavetable saw
TAB = 4096
_ph = np.arange(TAB) / TAB
SAW = np.zeros(TAB)
for k in range(1, 48):
    SAW += np.sin(2 * np.pi * k * _ph) / k * (1 if k < 40 else (48 - k) / 8)
SAW /= np.abs(SAW).max()

def osc(table, f, n, phase0=0.0, vib=0.0, vib_rate=5.0):
    t = np.arange(n) / SR
    inst = f * (1 + vib * np.sin(2 * np.pi * vib_rate * t))
    ph = (phase0 + np.cumsum(inst) / SR) % 1.0
    return table[(ph * TAB).astype(int)]

def adsr(n, a, d, s, r, sustain_len=None):
    a_n, d_n, r_n = int(a * SR), int(d * SR), int(r * SR)
    sus_n = max(0, (sustain_len if sustain_len is not None else n - a_n - d_n - r_n))
    env = np.concatenate([
        np.linspace(0, 1, max(a_n, 1)) ** 1.6,
        np.linspace(1, s, max(d_n, 1)),
        np.full(sus_n, s),
        np.linspace(s, 0, max(r_n, 1)) ** 1.3,
    ])
    if len(env) < n:
        env = np.concatenate([env, np.zeros(n - len(env))])
    return env[:n]

def pad_chord(notes, dur, fc=1400, amp=0.12, attack=0.9, release=1.6):
    n = int((dur + release) * SR)
    out = np.zeros((n, 2))
    for j, m in enumerate(notes):
        f = mtof(m)
        for d, pan in ((-7, -0.7), (0, 0.0), (7, 0.7)):  # cents detune spread
            fd = f * 2 ** (d / 1200)
            x = osc(SAW, fd, n, phase0=rng.random(), vib=0.0015, vib_rate=0.25 + 0.1 * j)
            l = np.cos((pan + 1) * np.pi / 4)
            r = np.sin((pan + 1) * np.pi / 4)
            out[:, 0] += x * l
            out[:, 1] += x * r
    env = adsr(n, attack, 0.6, 0.85, release, sustain_len=int((dur - attack - 0.6) * SR))
    out *= env[:, None]
    out = lp(out, fc, 2)
    return out * amp / np.sqrt(len(notes))

def pluck(m, vel=0.6, decay=0.9):
    f = mtof(m)
    n = int(decay * 2.2 * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for k in range(1, 18):
        if f * k > 15000:
            break
        x += np.sin(2 * np.pi * f * k * t + k) / k ** 1.15 * np.exp(-t * (3.2 / decay + 0.9 * k))
    att = np.minimum(1, t / 0.003)
    return x * att * vel * 0.32

def bass_note(m, dur, vel=0.8, glide_from=None):
    f = mtof(m)
    n = int((dur + 0.12) * SR)
    t = np.arange(n) / SR
    ph = np.cumsum(np.full(n, f)) / SR
    x = np.sin(2 * np.pi * ph) + 0.22 * np.sin(4 * np.pi * ph) + 0.08 * np.sin(6 * np.pi * ph)
    x = np.tanh(1.6 * x) / np.tanh(1.6)
    env = adsr(n, 0.006, 0.18, 0.7, 0.1, sustain_len=int(max(0, dur - 0.19) * SR))
    return lp(x * env, 900, 2) * vel * 0.5

# ---------------------------------------------------------------- drums
def kick(vel=1.0):
    n = int(0.55 * SR)
    t = np.arange(n) / SR
    f = 46 + 110 * np.exp(-t * 38)
    ph = np.cumsum(f) / SR
    body = np.sin(2 * np.pi * ph) * np.exp(-t * 6.5)
    click = hp(rng.standard_normal(n), 2500) * np.exp(-t * 400) * 0.25
    return np.tanh(1.4 * (body + click)) * vel * 0.9

def clap(vel=1.0):
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    nz = rng.standard_normal(n)
    env = np.zeros(n)
    for o in (0, 0.009, 0.019):
        tt = np.clip(t - o, 0, None)
        env += (t >= o) * np.exp(-tt * 140) * 0.7
    env += (t >= 0.028) * np.exp(-np.clip(t - 0.028, 0, None) * 16)
    return bp(nz * env, 900, 6000) * vel * 0.45

def hat(vel=1.0, open_=False):
    n = int((0.35 if open_ else 0.09) * SR)
    t = np.arange(n) / SR
    nz = rng.standard_normal(n)
    env = np.exp(-t * (9 if open_ else 55))
    return hp(nz * env, 7500, 2) * vel * 0.22

def shaker(vel=1.0):
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    env = np.minimum(1, t / 0.012) * np.exp(-t * 38)
    return bp(rng.standard_normal(n) * env, 5000, 11000) * vel * 0.12

def cymbal_swell(length=1.6):
    n = int(length * SR)
    t = np.arange(n) / SR
    x = hp(rng.standard_normal(n), 4500, 2) * np.exp(-t * 2.2)
    x = x[::-1]  # reversed
    return np.stack([x, np.roll(x, 37)], 1) * 0.25

def impact(vel=1.0):
    n = int(3.0 * SR)
    t = np.arange(n) / SR
    f = 32 + 60 * np.exp(-t * 9)
    ph = np.cumsum(f) / SR
    sub = np.sin(2 * np.pi * ph) * np.exp(-t * 1.6)
    nz = lp(rng.standard_normal(n), 900, 2) * np.exp(-t * 7) * 0.5
    return np.tanh(1.3 * (sub + nz)) * vel * 0.85

def riser(length):
    n = int(length * SR)
    t = np.arange(n) / SR
    x = rng.standard_normal(n)
    out = np.zeros(n)
    seg = int(0.05 * SR)
    for s in range(0, n, seg):
        frac = s / n
        fc = 400 + 7000 * frac ** 2
        chunk = x[s:s + seg + 512]
        y = bp(chunk, fc * 0.7, min(fc * 1.4, 20000))
        out[s:s + seg] = y[:len(out[s:s + seg])]
    env = (t / length) ** 2.2
    tone = np.sin(2 * np.pi * np.cumsum(220 + 660 * (t / length) ** 2) / SR) * 0.15
    y = (out * 0.6 + tone) * env
    return np.stack([y, np.roll(y, 53)], 1) * 0.5

# ---------------------------------------------------------------- reverb / delay
def make_ir(length=2.6, rt=2.2, bright=6000):
    n = int(length * SR)
    t = np.arange(n) / SR
    decay = 10 ** (-3 * t / rt)
    irl = rng.standard_normal(n) * decay
    irr = rng.standard_normal(n) * decay
    irl, irr = lp(irl, bright, 1), lp(irr, bright, 1)
    irl[: int(0.012 * SR)] = 0
    irr[: int(0.017 * SR)] = 0
    ir = np.stack([irl, irr], 1)
    return ir / np.sqrt((ir ** 2).sum())

IR = make_ir()

def reverb(x, wet=0.3):
    y = np.stack([signal.fftconvolve(x[:, c], IR[:, c])[: len(x)] for c in range(2)], 1)
    y = hp(y, 180)
    return y * wet

def pingpong(x, delay, fb=0.35, wet=0.25, repeats=6):
    y = np.zeros_like(x)
    d = int(delay * SR)
    src = lp(x.mean(1), 4500)
    for k in range(1, repeats + 1):
        g = wet * fb ** (k - 1)
        ch = k % 2
        if d * k < len(x):
            y[d * k:, ch] += src[: len(x) - d * k] * g
    return y

# ================================================================= ARRANGEMENT
# Voicings (MIDI)
V = {
    'D':    dict(root=38, pad=[57, 62, 64, 66, 69], arp=[62, 66, 69, 74, 76, 74, 69, 66]),
    'Bm':   dict(root=35, pad=[54, 57, 62, 64, 66], arp=[59, 62, 66, 71, 74, 71, 66, 62]),
    'G':    dict(root=31, pad=[55, 59, 62, 66, 69], arp=[59, 62, 66, 71, 74, 71, 66, 62]),
    'A':    dict(root=33, pad=[57, 61, 64, 69, 71], arp=[61, 64, 69, 73, 76, 73, 69, 64]),
    'Asus': dict(root=33, pad=[57, 62, 64, 69, 71], arp=[62, 64, 69, 74, 76, 74, 69, 64]),
    'Em':   dict(root=28, pad=[55, 59, 62, 64, 67], arp=[59, 62, 67, 71, 74, 71, 67, 62]),
    'F#s':  dict(root=30, pad=[54, 59, 61, 66, 68], arp=[61, 66, 71, 73, 78, 73, 71, 66]),
    'F#':   dict(root=30, pad=[54, 58, 61, 66, 70], arp=[61, 66, 70, 73, 78, 73, 70, 66]),
}
# (start_bar, start_beat, length_beats, chord)
CHORDS = [
    (1, 0, 4, 'D'), (2, 0, 4, 'Bm'), (3, 0, 4, 'G'), (4, 0, 2, 'Asus'), (4, 2, 2, 'A'),
    (5, 0, 4, 'D'), (6, 0, 4, 'Bm'), (7, 0, 4, 'G'), (8, 0, 4, 'A'),
    (9, 0, 4, 'D'), (10, 0, 4, 'Bm'), (11, 0, 4, 'G'), (12, 0, 4, 'A'),
    (13, 0, 4, 'D'), (14, 0, 4, 'Bm'), (15, 0, 2, 'G'),
    # cost pressure (36.25 s) — minor, darker
    (15, 2, 2, 'Em'), (16, 0, 4, 'Bm'), (17, 0, 4, 'G'), (18, 0, 4, 'Em'), (19, 0, 1.5, 'F#s'), (19, 1.5, 1.5, 'F#'),
    # lift (46.875 s) — anticipates bar 20
    (19, 3, 5, 'G'), (21, 0, 4, 'A'), (22, 0, 2, 'G'), (22, 2, 2, 'Asus'),
    # resolve (55.0 s)
    (23, 0, 8, 'D'),
]

stems = {k: buf() for k in ['piano', 'pad', 'bass', 'arp', 'drums', 'fx']}

# ---- pads: present all film, darker in the cost section, bigger at the resolve
for bar, beat, ln, ch in CHORDS:
    t0 = T(bar, beat)
    dur = ln * B
    fc = 1500
    amp = 0.11
    if 36.0 <= t0 < 46.8:
        fc, amp = 900, 0.12
    if t0 < 5:
        fc, amp = 1100, 0.10
    if t0 >= 55:
        fc, amp = 2200, 0.14
    add(stems['pad'], pad_chord(V[ch]['pad'], dur + 0.15, fc=fc, amp=amp, attack=0.5 if t0 > 0 else 1.6), t0)

# ---- bass
def bass_pattern(bar, beat, ln, ch, style):
    root = V[ch]['root']
    t0 = T(bar, beat)
    if style == 'long':
        add(stems['bass'], bass_note(root, ln * B - 0.05, 0.75), t0)
    elif style == 'pulse':  # eighths with octave lift on the 'and' of 4
        for k in range(int(ln * 2)):
            m = root + (12 if (k % 8 == 7) else 0)
            add(stems['bass'], bass_note(m, B / 2 - 0.04, 0.62 if k % 2 else 0.78), t0 + k * B / 2)
    elif style == 'drive':  # dotted rhythm
        for off, d, v in ((0, 0.75, 0.85), (0.75, 0.75, 0.7), (1.5, 0.5, 0.75), (2, 0.75, 0.82), (2.75, 0.75, 0.68), (3.5, 0.5, 0.72)):
            if off < ln:
                add(stems['bass'], bass_note(root, d * B - 0.05, v), t0 + off * B)

for bar, beat, ln, ch in CHORDS:
    t0 = T(bar, beat)
    if t0 < 5.0:
        continue
    if t0 < 11.0:
        style = 'long'
    elif t0 < 36.0:
        style = 'drive'
    elif t0 < 46.8:
        style = 'pulse'
    elif t0 < 55:
        style = 'drive'
    else:
        style = 'long'
    bass_pattern(bar, beat, ln, ch, style)

# ---- arp (pluck 8ths/16ths), ping-pong delayed
def chord_at(t):
    cur = None
    for bar, beat, ln, ch in CHORDS:
        if T(bar, beat) <= t + 1e-6:
            cur = ch
    return cur

def arp_run(t_start, t_end, step, vel=0.5, octave=0):
    k = 0
    t = t_start
    while t < t_end - 1e-6:
        ch = chord_at(t)
        notes = V[ch]['arp']
        m = notes[k % len(notes)] + octave
        accent = 1.0 if k % 4 == 0 else 0.75
        h = harp_note(m, vel * accent * 1.6, dur=0.9)
        add(stems['arp'], h.mean(1), t, pan=(-0.35 if k % 2 else 0.35))
        k += 1
        t += step

arp_run(5.0, 11.25, B / 2, 0.42)          # revenue: 8ths
arp_run(11.25, 36.25, B / 4, 0.36)        # main body: 16ths
arp_run(36.25, 46.875, B / 2, 0.30, -12)  # pressure: low 8ths
arp_run(46.875, 55.0, B / 4, 0.40)        # priorities: 16ths

# ---- piano
def pn(t, m, d, v):
    add(stems['piano'], piano_note(m, d, v), t, pan=np.clip((m - 64) / 40, -0.5, 0.5))

# intro motif (bars 1-2) with low root
pn(T(1, 0), 50, 4.8, 0.45); pn(T(1, 0), 62, 4.8, 0.40)
for beat, m, d, v in ((0.5, 78, 1.2, 0.55), (2.0, 81, 0.6, 0.5), (2.5, 76, 1.6, 0.52),
                      (4.0, 74, 1.2, 0.5), (5.5, 78, 0.6, 0.46), (6.0, 71, 2.0, 0.5)):
    pn(T(1, beat), m, d * B, v)
pn(T(2, 0), 47, 4.6, 0.42)
# revenue (bars 3-4): rising answer
for beat, m, d, v in ((0, 74, 1, 0.5), (1, 76, 0.5, 0.45), (1.5, 78, 1.5, 0.52), (3, 81, 1, 0.5),
                      (4, 76, 2, 0.48), (6, 73, 2, 0.46)):
    pn(T(3, beat), m, d * B, v)
# main body: soft syncopated chord stabs + sparse top line
for bar in range(5, 15):
    ch = chord_at(T(bar, 0))
    top = sorted(V[ch]['pad'])[-3:]
    for beat in (0, 1.5, 3.0):
        for m in top:
            pn(T(bar, beat), m + 12, 0.5 * B, 0.28 if beat else 0.33)
for bar, beat, m in ((6, 2, 78), (8, 2, 81), (10, 2, 78), (12, 2, 81), (14, 0, 78)):
    pn(T(bar, beat), m, 1.5 * B, 0.42)
# pressure section: sparse high, unresolved
for t, m, v in ((T(15, 2), 71, 0.4), (T(16, 0), 78, 0.36), (T(16, 2.5), 74, 0.32), (T(17, 0), 79, 0.36),
                (T(17, 2.5), 74, 0.32), (T(18, 0), 76, 0.36), (T(18, 2.5), 71, 0.32), (T(19, 0), 73, 0.38), (T(19, 1.5), 70, 0.36)):
    pn(t, m, 1.6 * B, v)
# priorities: motif returns, brighter
for bar in (20, 21, 22):
    ch = chord_at(T(bar, 0))
    top = sorted(V[ch]['pad'])[-3:]
    for beat in (0, 1.5, 3.0):
        for m in top:
            pn(T(bar, beat), m + 12, 0.5 * B, 0.3)
for beat, m, d, v in ((0, 74, 1, 0.48), (1, 76, 0.5, 0.44), (1.5, 78, 1.5, 0.5), (3, 81, 1, 0.5),
                      (4, 83, 2, 0.5), (6, 81, 1, 0.46), (7, 76, 1, 0.44)):
    pn(T(20, beat), m, d * B, v)
pn(T(19, 3), 43, 2.0, 0.4)
# resolve (bar 23): full chord + melody, final ring on bar 24
for m in (38, 50, 57, 62, 66, 69):
    pn(T(23, 0), m, 4.8, 0.5)
for beat, m, d, v in ((0, 81, 1.5, 0.55), (1.5, 78, 0.5, 0.48), (2, 76, 1, 0.48), (3, 74, 1, 0.5)):
    pn(T(23, beat), m, d * B, v)
for m in (62, 66, 69, 74, 78):
    pn(T(24, 0), m, 2.4, 0.42)

# ---- drums
def drum_bar(bar, kind):
    t0 = T(bar, 0)
    if kind == 'light':
        add(stems['drums'], kick(0.75), t0)
        add(stems['drums'], kick(0.62), T(bar, 2))
        for e in range(8):
            add(stems['drums'], hat(0.45 if e % 2 else 0.25), t0 + e * B / 2, pan=0.25)
    elif kind == 'full':
        for b_ in (0, 2):
            add(stems['drums'], kick(0.9), T(bar, b_))
        add(stems['drums'], kick(0.55), T(bar, 2.75))
        for b_ in (1, 3):
            add(stems['drums'], clap(0.7), T(bar, b_), pan=-0.05)
        for s in range(16):
            v = (0.55, 0.22, 0.38, 0.22)[s % 4]
            add(stems['drums'], hat(v), t0 + s * B / 4, pan=0.3)
        for s in range(8):
            add(stems['drums'], shaker(0.8 if s % 2 else 0.5), t0 + s * B / 2 + B / 4, pan=-0.4)
    elif kind == 'tick':
        for e in range(8):
            add(stems['drums'], hat(0.32 if e % 2 else 0.18), t0 + e * B / 2, pan=0.2)

for bar in (3, 4):
    drum_bar(bar, 'light')
# bar 5 first half light, groove from the cut at 11.25 (bar 5 beat 2)
add(stems['drums'], kick(0.8), T(5, 0))
for e in range(4):
    add(stems['drums'], hat(0.4 if e % 2 else 0.22), T(5, 0) + e * B / 2, pan=0.25)
add(stems['drums'], kick(0.95), T(5, 2)); add(stems['drums'], clap(0.7), T(5, 3))
for s in range(8, 16):
    add(stems['drums'], hat((0.55, 0.22, 0.38, 0.22)[s % 4]), T(5, 0) + s * B / 4, pan=0.3)
for bar in range(6, 15):
    drum_bar(bar, 'full')
# bar 15: groove until the 36.25 break, then ticking clock
add(stems['drums'], kick(0.9), T(15, 0)); add(stems['drums'], clap(0.7), T(15, 1))
for s in range(8):
    add(stems['drums'], hat((0.55, 0.22, 0.38, 0.22)[s % 4]), T(15, 0) + s * B / 4, pan=0.3)
for e in range(4, 8):
    add(stems['drums'], hat(0.3 if e % 2 else 0.16), T(15, 0) + e * B / 2, pan=0.2)
for bar in range(16, 19):
    drum_bar(bar, 'tick')
# bar 18-19: heartbeat kicks building pressure
for bar in (18, 19):
    for b_ in (0, 2):
        if T(bar, b_) < 46.8:
            add(stems['drums'], kick(0.45 + 0.1 * (bar - 18)), T(bar, b_))
for e in range(6):
    add(stems['drums'], hat(0.3 if e % 2 else 0.18), T(19, 0) + e * B / 2, pan=0.2)
# priorities groove (bars 20-22), with a fill into the resolve
for bar in (20, 21, 22):
    drum_bar(bar, 'full')
for s in range(4):
    add(stems['drums'], clap(0.35 + 0.12 * s), T(22, 3) + s * B / 4, pan=0.1)
# resolve hit
add(stems['drums'], kick(1.0), T(23, 0))
add(stems['drums'], hat(0.6, open_=True), T(23, 0), pan=0.2)

# ---- fx: swells, risers, impacts aligned with cuts
CUTS = [5.0, 11.25, 23.75, 30.625, 36.25, 46.875, 55.0]
for c in CUTS:
    sw = cymbal_swell(1.2 if c not in (46.875, 55.0) else 2.2)
    add(stems['fx'], sw * (0.55 if c not in (46.875, 55.0) else 0.9), c - len(sw) / SR)
add(stems['fx'], riser(3.6), 46.875 - 3.6, gain=0.7)
add(stems['fx'], riser(2.5), 55.0 - 2.5, gain=0.6)
add(stems["fx"], impact(0.6), 0.62)        # title lands
add(stems['fx'], impact(0.55), 36.25)      # cost-pressure drop
add(stems['fx'], impact(0.7), 46.875)      # lift
add(stems['fx'], impact(1.0), 55.0)        # resolve

# ================================================================= MIX BUSES
def env_follow(x, attack=0.002, release=0.12):
    a = np.abs(x).max(1) if x.ndim == 2 else np.abs(x)
    a = signal.lfilter([1 - np.exp(-1 / (release * SR))], [1, -np.exp(-1 / (release * SR))], a)
    return a / (a.max() + 1e-9)

# sidechain pump from kick
kick_env = np.zeros(N)
for st in [stems['drums']]:
    pass
kick_only = buf()
for bar in range(3, 24):
    for b_ in (0, 2):
        t = T(bar, b_)
        if (11.25 <= t < 36.25) or (47.5 <= t < 55.0):
            add(kick_only, kick(1.0), t)
ke = env_follow(kick_only, release=0.18)
duck = (1 - 0.32 * ke)[:, None]
stems['pad'] *= duck
stems['arp'] *= (1 - 0.25 * ke)[:, None]
stems['bass'] *= (1 - 0.35 * ke)[:, None]

# effects
stems['arp'] = stems['arp'] + pingpong(stems['arp'], 0.75 * B, fb=0.4, wet=0.32) + reverb(stems['arp'], 0.25)
stems['piano'] = stems['piano'] + reverb(stems['piano'], 0.32)
stems['pad'] = hp(stems['pad'], 140, 2)
stems['pad'] = stems['pad'] + reverb(stems['pad'], 0.28)
stems['drums'] = stems['drums'] + reverb(hp(stems['drums'], 400), 0.12)
stems['fx'] = stems['fx'] + reverb(stems['fx'], 0.3)

GAINS = dict(piano=1.9, pad=0.9, bass=0.42, arp=0.3, drums=0.47, fx=0.55)
os.makedirs(os.path.join(HERE, 'stems'), exist_ok=True)
L = int(62.0 * SR)
for k, v in stems.items():
    sf.write(os.path.join(HERE, 'stems', f'{k}.wav'), (v[:L] * GAINS[k]).astype(np.float32), SR, subtype='FLOAT')
    print(k, 'peak', round(float(np.abs(v[:L] * GAINS[k]).max()), 3))
