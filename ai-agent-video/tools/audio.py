"""Score, sound design and final mix for the film.

Reads timing.json (scene + narration timing) and audio/events.json (sound
events exported from the composition), synthesises an original music bed and
every sound effect, places the narration (vo/*.wav when present), mixes,
ducks the music under the voice, and masters to -14 LUFS / -1 dBTP.

    venv/bin/python tools/audio.py
"""
import json
import math
import os

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from pedalboard import (Chorus, Compressor, Delay, HighpassFilter, HighShelfFilter, LadderFilter, Limiter,
                        LowpassFilter, LowShelfFilter, Pedalboard, PeakFilter, Reverb)
from scipy.signal import butter, sosfilt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
T = json.load(open(os.path.join(ROOT, "timing.json")))
EV = json.load(open(os.path.join(ROOT, "audio", "events.json")))
TOTAL = T["total"]
N = int(math.ceil((TOTAL + 0.05) * SR))
rng = np.random.default_rng(7)


def S(t):
    return int(round(t * SR))


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def stereo(x, pan=0.0):
    """Equal-power pan of a mono signal, pan in [-1, 1]."""
    a = (pan + 1) * math.pi / 4
    return np.stack([x * math.cos(a), x * math.sin(a)])


def add(bus, sig, t):
    """Add a (2, n) signal into a (2, N) bus at time t (seconds)."""
    i = S(t)
    if i >= bus.shape[1]:
        return
    if i < 0:
        sig = sig[:, -i:]
        i = 0
    n = min(sig.shape[1], bus.shape[1] - i)
    bus[:, i:i + n] += sig[:, :n]


def env_adsr(n, a, d, s, r, sus_len):
    """ADSR with sustain held for sus_len seconds then release r."""
    A, D, R = S(a), S(d), S(r)
    H = max(0, S(sus_len) - A - D)
    e = np.concatenate([
        np.linspace(0, 1, max(A, 1), endpoint=False) ** 1.5,
        np.linspace(1, s, max(D, 1), endpoint=False),
        np.full(H, s),
        s * np.linspace(1, 0, max(R, 1)) ** 2,
    ])
    if len(e) < n:
        e = np.concatenate([e, np.zeros(n - len(e))])
    return e[:n]


def saw_blep(freq, n, phase0=0.0):
    dt = freq / SR
    ph = (phase0 + dt * np.arange(n)) % 1.0
    y = 2 * ph - 1
    m1 = ph < dt
    x = ph[m1] / dt
    y[m1] -= x + x - x * x - 1
    m2 = ph > 1 - dt
    x = (ph[m2] - 1) / dt
    y[m2] -= x * x + x + x + 1
    return y


def sine(freq, n, phase0=0.0):
    return np.sin(2 * np.pi * (phase0 + freq * np.arange(n) / SR))


def sweep_sine(f0, f1, n, curve=2.0):
    k = np.linspace(0, 1, n) ** curve
    f = f0 + (f1 - f0) * k
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def noise(n):
    return rng.standard_normal(n)


def filt(x, kind, f, order=2):
    f = np.clip(np.atleast_1d(np.asarray(f, dtype=float)), 20, SR / 2 - 200)
    wn = list(f) if kind == "band" else float(f[0])
    sos = butter(order, wn, btype={"lp": "low", "hp": "high", "band": "band"}[kind], fs=SR, output="sos")
    return sosfilt(sos, x)


def tv_filter(x, kind, cut, block=256, order=2):
    """Time-varying Butterworth filter: cut is an array (per-sample cutoff)."""
    out = np.zeros_like(x)
    zi = None
    for i in range(0, len(x), block):
        c = float(np.clip(cut[min(i + block // 2, len(cut) - 1)], 30, SR / 2 - 500))
        if kind == "band":
            sos = butter(order, [c / 1.6, c * 1.6], btype="band", fs=SR, output="sos")
        else:
            sos = butter(order, c, btype="low" if kind == "lp" else "high", fs=SR, output="sos")
        if zi is None or zi.shape[0] != sos.shape[0]:
            zi = np.zeros((sos.shape[0], 2))
        out[i:i + block], zi = sosfilt(sos, x[i:i + block], zi=zi)
    return out


def pb(chain, x):
    """Run a (2, n) or (n,) signal through a pedalboard chain."""
    return Pedalboard(chain)(x.astype(np.float32), SR).astype(np.float64)


# ============================================================ timing ====
C = T["cues"]
SC = T["scenes"]
ta = C["l3.agent"]
te = C["end.card"]
BPM = 100.0
BEAT = 60.0 / BPM
BAR = 4 * BEAT
n_pre = math.ceil(ta / BAR)
g0 = ta - n_pre * BAR  # grid origin: a downbeat lands exactly on the title reveal

tR, tD = C["l10.r"], C["l10.done"]
s2, s3, s4, s5, s6 = (SC[k]["start"] for k in ("s2", "s3", "s4", "s5", "s6"))


def section(t):
    if t < ta:
        return "intro"
    if t < s3:
        return "def"
    if t < s4 + 0.4:
        return "goal"
    if t < s5:
        return "loop"
    if t < s6:
        return "anat"
    if t < te + 0.3:
        return "close"
    return "end"


# chord progression (i - VI - III - VII in D minor), two bars per chord
PROG = [
    {"name": "Dm9", "bass": 38, "pad": [53, 57, 60, 64], "arp": [62, 65, 69, 72, 76]},
    {"name": "Bbmaj7", "bass": 34, "pad": [53, 57, 58, 62], "arp": [58, 62, 65, 69, 70]},
    {"name": "Fmaj9", "bass": 41, "pad": [57, 60, 64, 67], "arp": [60, 65, 67, 69, 72]},
    {"name": "Cadd9", "bass": 36, "pad": [55, 60, 62, 64], "arp": [60, 62, 64, 67, 72]},
]
FINAL = {"name": "Dm(add9)", "bass": 38, "pad": [50, 57, 62, 64, 65, 69], "arp": [62, 64, 65, 69, 74]}


def chord_at_bar(b):
    return PROG[((b - n_pre) // 2) % 4]


bars = []
b = 0
while g0 + b * BAR < TOTAL + BAR:
    bars.append((b, g0 + b * BAR))
    b += 1

music = np.zeros((2, N))
pad_bus = np.zeros((2, N))
arp_bus = np.zeros((2, N))
bass_bus = np.zeros((2, N))
drum_bus = np.zeros((2, N))
kick_times = []

# ============================================================ pads ======
def supersaw(freq, n, voices=7, detune=0.16):
    out = np.zeros(n)
    for k in range(voices):
        cents = (k - (voices - 1) / 2) / ((voices - 1) / 2) * detune * 100
        out += saw_blep(freq * 2 ** (cents / 1200), n, phase0=rng.random())
    return out / voices


def pad_chord(ch, t0, length, gain=1.0):
    n = S(length + 2.4)
    L = np.zeros(n)
    R = np.zeros(n)
    for j, m in enumerate(ch["pad"]):
        f = mtof(m)
        e = env_adsr(n, 0.9, 0.6, 0.85, 2.2, length)
        sl = supersaw(f, n) * e
        sr = supersaw(f, n) * e
        warm = sine(f / 2, n) * e * 0.35
        L += sl + warm
        R += sr + warm
    add(pad_bus, np.stack([L, R]) * 0.16 * gain, t0)


chord_segments = []
for (bi, t0) in bars:
    if (bi - n_pre) % 2 != 0 and t0 > 0:
        continue
    seg_t0 = max(0.0, t0)
    if seg_t0 >= te + 0.3:
        break
    seg_len = min(2 * BAR, te + 0.3 - seg_t0) if (bi - n_pre) % 2 == 0 else (t0 + BAR - seg_t0)
    ch = chord_at_bar(bi)
    chord_segments.append((seg_t0, seg_len, ch))
    pad_chord(ch, seg_t0, seg_len)
# the end card resolves on a wide D minor (add9)
pad_chord(FINAL, te + 0.38, TOTAL - te + 0.5, gain=1.25)

# filter automation for the pad bus (dark intro, opens on the title, breathes per scene)
auto_pts = [
    (0.0, 380), (ta - 1.5, 900), (ta, 2600), (s3 - 0.5, 2200), (s3 + 0.6, 1100), (s4, 1400),
    (s4 + 1.5, 3200), (tD, 4200), (s5, 2800), (s6, 2000), (te, 1300), (te + 0.4, 5200), (TOTAL, 2500),
]
tt = np.arange(N) / SR
cut = np.interp(tt, [p[0] for p in auto_pts], [p[1] for p in auto_pts])
lad = LadderFilter(mode=LadderFilter.Mode.LPF24, cutoff_hz=400, resonance=0.18, drive=1.2)
board = Pedalboard([lad])
pad_f = np.zeros_like(pad_bus)
blk = 512
for i in range(0, N, blk):
    lad.cutoff_hz = float(cut[min(i + blk // 2, N - 1)])
    pad_f[:, i:i + blk] = board.process(pad_bus[:, i:i + blk].astype(np.float32), SR, reset=False)
pad_f = pb([HighpassFilter(110), Chorus(rate_hz=0.25, depth=0.35, mix=0.35), Reverb(room_size=0.88, damping=0.45, wet_level=0.42, dry_level=0.75, width=1.0)], pad_f)

# ============================================================ arp =======
def pluck(freq, length=0.9, bright=1.0):
    n = S(length)
    t = np.arange(n) / SR
    y = np.zeros(n)
    kmax = int(min(28, (SR / 2.2) / freq))
    for k in range(1, kmax + 1):
        y += (1.0 / k ** 1.15) * np.sin(2 * np.pi * k * freq * t + 0.3 * k) * np.exp(-t * (5.0 + (k - 1) * 2.6 / bright))
    a = np.minimum(1, t / 0.003)
    return y * a * 0.5


ARP_PAT = [0, 2, 1, 3, 2, 4, 3, 1, 0, 2, 4, 3, 1, 2, 3, 4]
for (bi, t0) in bars:
    for k in range(16):
        t = t0 + k * BEAT / 4
        if t < 0 or t >= te + 0.25:
            continue
        sec = section(t)
        if sec in ("intro",):
            if t < ta - 2 * BAR or k % 2:  # sparse, distant hint in the intro
                continue
            g = 0.25
        elif sec == "goal":
            g = 0.55 if k % 2 == 0 else 0.3
        elif sec == "close":
            g = 0.5
        elif sec == "def" and t < s2 - 0.2:
            continue  # the title moment breathes: arp enters with the definition
        else:
            g = 0.85 if k % 4 == 0 else 0.62
        ch = chord_at_bar(bi)
        note = ch["arp"][ARP_PAT[k] % len(ch["arp"])] + 12
        vel = g * (1.0 if k % 4 == 0 else 0.8)
        y = pluck(mtof(note), 0.8, bright=1.2 if sec == "loop" else 0.9) * vel
        add(arp_bus, stereo(y, 0.25 * math.sin(k * 0.9)), t)
arp_f = pb([HighpassFilter(220), LowpassFilter(11000),
            Delay(delay_seconds=BEAT * 0.75, feedback=0.32, mix=0.28),
            Reverb(room_size=0.7, damping=0.5, wet_level=0.3, dry_level=0.8, width=1.0)], arp_bus)

# ============================================================ bass ======
def bass_note(freq, length, pluck_env=True):
    n = S(length + 0.15)
    t = np.arange(n) / SR
    y = np.sin(2 * np.pi * freq * t) + 0.45 * np.sin(2 * np.pi * 2 * freq * t) + 0.2 * np.sin(2 * np.pi * 3 * freq * t) + 0.08 * np.sin(2 * np.pi * 4 * freq * t)
    if pluck_env:
        e = np.exp(-t * 3.2) * 0.75 + 0.25
        e *= np.minimum(1, t / 0.006)
        e *= np.clip((length + 0.12 - t) / 0.12, 0, 1)
    else:
        e = env_adsr(n, 0.25, 0.3, 0.9, 0.6, length)
    return np.tanh(1.6 * y * e) * 0.6


for (bi, t0) in bars:
    ch = chord_at_bar(bi)
    f = mtof(ch["bass"])
    if t0 < ta - 0.01 or t0 >= te + 0.2:
        continue
    sec = section(t0 + 0.01)
    if sec in ("def", "goal", "close"):
        if (bi - n_pre) % 2 == 0:
            add(bass_bus, stereo(bass_note(f, min(2 * BAR, te + 0.3 - t0) - 0.1, pluck_env=False) * 0.85), t0)
    else:  # driving eighths in the loop and anatomy scenes
        for k in range(8):
            t = t0 + k * BEAT / 2
            if t >= te:
                break
            add(bass_bus, stereo(bass_note(f, BEAT / 2 - 0.04) * (1.0 if k % 2 == 0 else 0.7)), t)
add(bass_bus, stereo(bass_note(mtof(FINAL["bass"]), TOTAL - te - 0.6, pluck_env=False) * 1.1), te + 0.38)
bass_f = pb([LowpassFilter(900), Compressor(threshold_db=-18, ratio=3, attack_ms=10, release_ms=120)], bass_bus)

# ============================================================ drums =====
def kick():
    n = S(0.45)
    t = np.arange(n) / SR
    f = 52 + 120 * np.exp(-t * 30)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7.5)
    click = filt(noise(n), "hp", 2500) * np.exp(-t * 260) * 0.35
    return np.tanh(1.8 * (y + click)) * 0.9


def hat(open_=False):
    n = S(0.3 if open_ else 0.08)
    t = np.arange(n) / SR
    y = filt(noise(n), "hp", 7500, order=4) * np.exp(-t * (14 if open_ else 70))
    return y * 0.35


def clap():
    n = S(0.4)
    t = np.arange(n) / SR
    env = np.zeros(n)
    for d in (0.0, 0.011, 0.022, 0.034):
        env += np.where(t >= d, np.exp(-(t - d) * 90), 0)
    env += np.exp(-t * 14) * 0.35
    y = filt(noise(n), "band", [900, 2600]) * env
    return y * 0.55


K, H, HO, CL = kick(), hat() * 1.6, hat(True) * 1.5, clap()
for (bi, t0) in bars:
    for k in range(16):
        t = t0 + k * BEAT / 4
        if t < ta or t >= te:
            continue
        sec = section(t)
        beat16 = k
        if sec == "loop":
            if beat16 % 4 == 0:
                add(drum_bus, stereo(K), t)
                kick_times.append(t)
            if beat16 in (4, 12):
                add(drum_bus, stereo(CL * 0.8, 0.05), t)
            if beat16 % 2 == 0:
                add(drum_bus, stereo(H * (0.9 if beat16 % 4 == 2 else 0.45), 0.3), t)
            if beat16 == 14:
                add(drum_bus, stereo(HO * 0.5, 0.3), t)
        elif sec == "anat":
            if beat16 in (0, 8):
                add(drum_bus, stereo(K * 0.85), t)
                kick_times.append(t)
            if beat16 == 12:
                add(drum_bus, stereo(CL * 0.6, 0.05), t)
            if beat16 % 4 == 2:
                add(drum_bus, stereo(H * 0.8, 0.3), t)
        elif sec == "def" and t >= s2:
            if beat16 % 4 == 2:
                add(drum_bus, stereo(H * 0.55, 0.3), t)
            if beat16 == 0 and (bi - n_pre) % 2 == 0:
                add(drum_bus, stereo(K * 0.6), t)
                kick_times.append(t)
drum_f = pb([Reverb(room_size=0.35, wet_level=0.12, dry_level=0.95), Compressor(threshold_db=-14, ratio=3, attack_ms=5, release_ms=80)], drum_bus)

# ============================================================ texture ===
air = filt(noise(N), "band", [3000, 9000]) * 0.012
air = np.stack([air, np.roll(air, 977)])
air *= np.clip(tt / 2.0, 0, 1)

# sidechain pump from the kick on the pads/arp/bass
pump = np.ones(N)
for kt in kick_times:
    i = S(kt)
    L = S(0.32)
    seg = 1 - 0.45 * np.exp(-np.arange(L) / SR * 11)
    pump[i:i + L] = np.minimum(pump[i:i + L], seg[: max(0, min(L, N - i))])

music = (pad_f * 1.0 + arp_f * 0.62) * pump + bass_f * (0.5 + 0.5 * pump) * 0.55 + drum_f * 0.62 + air * 1.6
music = pb([HighpassFilter(32), LowShelfFilter(cutoff_frequency_hz=90, gain_db=-3.0), PeakFilter(cutoff_frequency_hz=380, gain_db=-1.5, q=0.9),
            HighShelfFilter(cutoff_frequency_hz=4500, gain_db=4.5)], music)

# ============================================================ SFX =======
sfx_bus = np.zeros((2, N))


def bell(freq, length=1.4, bright=1.0):
    n = S(length)
    t = np.arange(n) / SR
    parts = [(1, 1.0, 2.2), (2.0, 0.45, 3.5), (2.76, 0.28, 5.0), (4.07, 0.16, 7.0), (5.4, 0.08, 9.0)]
    y = sum(a * np.sin(2 * np.pi * freq * r * t) * np.exp(-t * d / bright) for r, a, d in parts)
    return y * np.minimum(1, t / 0.002) * 0.35


def padd(*xs):
    n = max(len(x) for x in xs)
    return sum(np.pad(x, (0, n - len(x))) for x in xs)


def sfx_pop(o):
    n = S(0.09)
    t = np.arange(n) / SR
    p = o.get("pitch", 1.0)
    y = sweep_sine(1100 * p, 560 * p, n, 0.6) * np.exp(-t * 45)
    y += filt(noise(n), "band", [1500, 5000]) * np.exp(-t * 300) * 0.25
    return stereo(y * 0.5)


def sfx_whoosh(o, soft=False):
    L = 1.0 if not soft else 0.8
    n = S(L)
    t = np.linspace(0, 1, n)
    shape = np.sin(np.pi * np.clip(t / 0.75, 0, 1)) ** 2 * np.exp(-np.maximum(0, t - 0.55) * 4)
    cut = 350 + (3800 if not soft else 1800) * np.sin(np.pi * np.clip(t / 0.7, 0, 1)) ** 1.5
    y = tv_filter(noise(n), "band", cut, order=1) * shape
    y += tv_filter(noise(n), "lp", cut * 0.5, order=2) * shape * 0.4
    y *= 0.32 if not soft else 0.2
    pan = np.linspace(-0.7, 0.7, n)
    a = (pan + 1) * np.pi / 4
    return np.stack([y * np.cos(a), y * np.sin(a)])


def sfx_thump(o):
    n = S(0.5)
    t = np.arange(n) / SR
    y = sweep_sine(110, 48, n, 0.4) * np.exp(-t * 9)
    return stereo(np.tanh(y * 1.5) * 0.55)


def sfx_riser(o):
    L = o.get("len", 2.0)
    n = S(L)
    t = np.linspace(0, 1, n)
    cut = 400 * (12000 / 400) ** (t ** 1.6)
    y = tv_filter(noise(n), "band", cut, order=1) * t ** 2.2 * 0.5
    tone = sweep_sine(mtof(50), mtof(74), n, 2.0) * (t ** 3) * 0.12
    y = y + tone
    y *= np.clip((1 - t) / 0.015, 0, 1)  # hard stop into the hit
    st = np.stack([y, np.roll(y, 240)])
    return st, -L  # placed so it ends exactly on t


def sfx_impact(o):
    soft = o.get("soft", False)
    n = S(2.6)
    t = np.arange(n) / SR
    boom = sweep_sine(72, 34, n, 0.35) * np.exp(-t * (2.2 if not soft else 3.5))
    crack = filt(noise(n), "lp", 5000) * np.exp(-t * 22) * 0.5
    y = np.tanh(1.4 * (boom + crack)) * (0.8 if not soft else 0.5)
    st = stereo(y)
    st = pb([Reverb(room_size=0.92, damping=0.4, wet_level=0.35, dry_level=0.9, width=1.0)], st)
    return st


def sfx_shimmer(o):
    n = S(3.2)
    y = np.zeros((2, n))
    for j, m in enumerate([86, 89, 93, 98, 101]):
        b = bell(mtof(m), 3.2, bright=1.6) * (0.5 - j * 0.06)
        d = S(0.03 * j)
        b = padd(np.concatenate([np.zeros(d), b]), np.zeros(n))[:n]
        y += stereo(b, -0.6 + j * 0.3)
    return pb([Reverb(room_size=0.95, wet_level=0.5, dry_level=0.6, width=1.0)], y * 0.5)


def sfx_blip(o):
    m = o.get("note", 74)
    y = padd(bell(mtof(m), 1.0, bright=0.8), 0.3 * bell(mtof(m + 12), 0.6, bright=0.5))
    return stereo(y * 0.7, 0.2 if not o.get("wide") else 0.0)


def sfx_lock(o):
    a = bell(mtof(69), 1.2) * 0.8
    b = bell(mtof(74), 1.6) * 0.9
    n = S(1.8)
    y = np.zeros(n)
    y[: len(a)] += a
    d = S(0.11)
    y[d:d + len(b)] += b[: n - d]
    y += np.pad(sfx_thump({})[0][: S(0.5)], (0, n - S(0.5))) * 0.6
    return stereo(y * 0.8)


def sfx_click(o, sharp=1.0):
    n = S(0.05)
    t = np.arange(n) / SR
    y = filt(noise(n), "band", [1800, 6000]) * np.exp(-t * 260 * sharp)
    y += np.sin(2 * np.pi * 180 * t) * np.exp(-t * 90) * 0.6
    return stereo(y * 0.45)


def sfx_toggle(o):
    a = sfx_click(o)[0]
    n = S(0.2)
    y = np.zeros(n)
    y[: len(a)] += a
    d = S(0.09)
    y[d:d + len(a)] += a * 0.7
    tone = bell(mtof(81), 0.6) * 0.5
    y[d:d + len(tone)] += tone[: n - d]
    return stereo(y)


def sfx_key(o):
    i = o.get("i", 0)
    r = np.random.default_rng(1000 + i)
    n = S(0.06)
    t = np.arange(n) / SR
    c = 2600 + r.random() * 1800
    y = filt(r.standard_normal(n), "band", [c / 1.5, c * 1.5]) * np.exp(-t * (320 + r.random() * 120))
    y += np.sin(2 * np.pi * (140 + r.random() * 60) * t) * np.exp(-t * 120) * 0.5
    return stereo(y * 0.42, (r.random() - 0.5) * 0.4)


def sfx_zip(o):
    n = S(0.45)
    t = np.linspace(0, 1, n)
    y = sweep_sine(500, 2600, n, 1.8) * np.sin(np.pi * t) ** 1.5 * 0.25
    y += tv_filter(noise(n), "band", 800 + 6000 * t ** 1.5, order=1) * np.sin(np.pi * t) * 0.18
    return stereo(y)


def sfx_bloom(o):
    n = S(2.2)
    t = np.arange(n) / SR
    y = np.zeros(n)
    for m in (62, 69, 74, 77):
        y += np.sin(2 * np.pi * mtof(m) * t) * 0.18
    e = np.minimum(1, t / 0.08) * np.exp(-t * 1.6)
    y = y * e + bell(mtof(86), 2.2, 1.4) * 0.35
    return pb([Reverb(room_size=0.9, wet_level=0.45, dry_level=0.7)], stereo(y))


def sfx_sweep(o):
    L = o.get("len", 1.3)
    n = S(L + 0.5)
    t = np.linspace(0, 1, n)
    y = tv_filter(noise(n), "band", 600 + 5000 * t, order=1) * np.sin(np.pi * t) * 0.16
    a = (np.sin(2 * np.pi * t) * 0.8 + 1) * np.pi / 4
    return np.stack([y * np.cos(a), y * np.sin(a)])


def sfx_tone(o):
    m = o.get("note", 74)
    y = bell(mtof(m), 1.4, 1.0) * 0.8 + 0.25 * np.sin(2 * np.pi * mtof(m - 12) * np.arange(S(1.4)) / SR) * np.exp(-np.arange(S(1.4)) / SR * 4)
    return stereo(y * 0.8)


def sfx_tick(o):
    n = S(0.04)
    t = np.arange(n) / SR
    y = np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 160) * 0.35
    return stereo(y, 0.15)


def sfx_check(o):
    m = [86, 89, 93][o.get("i", 0) % 3]
    return stereo(bell(mtof(m), 0.7, 0.7) * 0.6, 0.25)


def sfx_spin(o):
    L = o.get("len", 1.2)
    n = S(L + 0.4)
    t = np.linspace(0, 1, n)
    rate = 3 + 14 * t ** 1.4
    ph = np.cumsum(rate) / SR * (L + 0.4) * SR / n
    am = 0.55 + 0.45 * np.sin(2 * np.pi * ph * n / SR)
    y = tv_filter(noise(n), "band", 700 + 3000 * t ** 1.2, order=1) * am * np.sin(np.pi * np.clip(t / 0.95, 0, 1)) * 0.3
    pan = np.sin(2 * np.pi * ph * n / SR) * 0.8
    a = (pan + 1) * np.pi / 4
    return np.stack([y * np.cos(a), y * np.sin(a)])


def sfx_success(o):
    notes = [65, 69, 72, 77] if not o.get("short") else [69, 74]
    n = S(2.0)
    y = np.zeros((2, n))
    for j, m in enumerate(notes):
        b = bell(mtof(m + 12), 1.6, 1.2) * 0.6
        d = S(0.07 * j)
        y += stereo(padd(np.concatenate([np.zeros(d), b]), np.zeros(n))[:n], -0.3 + 0.2 * j)
    return pb([Reverb(room_size=0.8, wet_level=0.35, dry_level=0.8)], y)


def sfx_hit(o):
    k = kick()
    n = S(1.4)
    t = np.arange(n) / SR
    stab = np.zeros(n)
    for m in (62, 65, 69, 74):
        stab += saw_blep(mtof(m), n) * 0.12
    stab = filt(stab, "lp", 3200) * np.exp(-t * 3.0) * np.minimum(1, t / 0.004)
    y = np.pad(k, (0, n - len(k))) * 0.8 + stab
    return pb([Reverb(room_size=0.85, wet_level=0.35, dry_level=0.85)], stereo(y * 0.8))


GEN = {
    "pop": sfx_pop, "whoosh": sfx_whoosh, "whoosh_soft": lambda o: sfx_whoosh(o, True), "thump": sfx_thump,
    "riser": sfx_riser, "impact": sfx_impact, "shimmer": sfx_shimmer, "blip": sfx_blip, "lock": sfx_lock,
    "toggle": sfx_toggle, "key": sfx_key, "click": lambda o: sfx_click(o, 0.7), "zip": sfx_zip, "bloom": sfx_bloom,
    "sweep": sfx_sweep, "tone": sfx_tone, "tick": sfx_tick, "check": sfx_check, "spin": sfx_spin,
    "success": sfx_success, "hit": sfx_hit,
}
for e in EV:
    out = GEN[e["name"]](e)
    off = 0.0
    if isinstance(out, tuple):
        out, off = out
    add(sfx_bus, out * e.get("gain", 1.0), e["t"] + off)
sfx_bus = pb([HighpassFilter(40), Reverb(room_size=0.5, wet_level=0.12, dry_level=0.95)], sfx_bus)

# ============================================================ narration =
vo = np.zeros((2, N))
man_path = os.path.join(ROOT, "vo", "manifest.json")
has_vo = os.path.exists(man_path)
if has_vo:
    man = json.load(open(man_path))
    for lid, ln in T["lines"].items():
        p = os.path.join(ROOT, "vo", man["lines"][lid]["file"])
        x, sr = sf.read(p, always_2d=True)
        x = x.mean(axis=1)
        if sr != SR:
            from scipy.signal import resample_poly
            g = math.gcd(sr, SR)
            x = resample_poly(x, SR // g, sr // g)
        add(vo, stereo(x), ln["start"])
    vo = pb([HighpassFilter(75), LowShelfFilter(cutoff_frequency_hz=180, gain_db=-1.5), PeakFilter(cutoff_frequency_hz=3200, gain_db=2.0, q=0.8),
             HighShelfFilter(cutoff_frequency_hz=9000, gain_db=1.5), Compressor(threshold_db=-20, ratio=2.5, attack_ms=8, release_ms=90)], vo)
    meter = pyln.Meter(SR)
    vl = meter.integrated_loudness(vo.T)
    vo *= 10 ** ((-16.0 - vl) / 20)

# duck envelope from the narration windows (works before and after the real VO exists)
duck = np.ones(N)
for lid, ln in (T["lines"].items() if has_vo else []):
    a, b = S(ln["start"] - 0.12), S(ln["end"] + 0.05)
    duck[max(0, a):min(N, b)] = 10 ** (-7.5 / 20)
k = S(0.25)
kern = np.hanning(2 * k)
kern /= kern.sum()
duck = np.convolve(duck, kern, mode="same")

# ============================================================ mix =======
fade_out = np.clip((TOTAL - tt) / 0.9, 0, 1) ** 1.5
fade_in = np.clip(tt / 0.6, 0, 1)
mus = music * duck * fade_in
meter = pyln.Meter(SR)
ml = meter.integrated_loudness(mus.T)
mus *= 10 ** ((-25.5 - ml) / 20)  # music sits well under the voice
sfx_bus *= 10 ** ((-28.0 - meter.integrated_loudness(sfx_bus.T)) / 20)

mix = (mus + sfx_bus * 1.0 + vo) * fade_out
mix = pb([Compressor(threshold_db=-16, ratio=2.0, attack_ms=20, release_ms=200)], mix)
# Master to -14 LUFS with a -1 dBFS ceiling. JUCE's limiter normalises its
# output to 0 dBFS, so drive it and trim afterwards, iterating on loudness.
pre = mix.copy()
gain_db = -14.0 - meter.integrated_loudness(pre.T)
for _ in range(4):
    drive = pre * 10 ** ((gain_db + 4.0) / 20)
    out = pb([Limiter(threshold_db=-4.0, release_ms=150)], drive) * 10 ** (-1.0 / 20)
    out = np.clip(out, -0.891, 0.891)
    err = -14.0 - meter.integrated_loudness(out.T)
    if abs(err) < 0.1:
        break
    gain_db += err
mix = out * fade_out

sf.write(os.path.join(ROOT, "audio", "mix.wav"), mix.T.astype(np.float32), SR, subtype="PCM_24")
sf.write(os.path.join(ROOT, "audio", "music_only.wav"), (mus * fade_out).T.astype(np.float32), SR, subtype="PCM_24")
print(f"mix: {TOTAL:.2f}s | narration {'ON' if has_vo else 'OFF (not generated yet)'} | integrated {meter.integrated_loudness(mix.T):.1f} LUFS | peak {20*np.log10(np.abs(mix).max()):.1f} dBFS")
