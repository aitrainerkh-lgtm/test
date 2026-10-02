#!/usr/bin/env python3
"""Final soundtrack: voice + music + sound design, mastered to -14 LUFS.

Reads content/timing.json and content/sfx.json; voice lines from
assets/audio/voice/<id>.wav; music from assets/audio/music_lyria.wav when
present, otherwise renders the built-in score. Writes assets/audio/mix.wav."""
import json
import os
import subprocess
import sys
import numpy as np
import soundfile as sf
import pyloudnorm as pyln
from pedalboard import (Pedalboard, Compressor, HighpassFilter, LowpassFilter, PeakFilter, HighShelfFilter, LowShelfFilter,
                        Reverb, Limiter, Gain, Delay)

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SR = 48000
rng = np.random.default_rng(7)
P = lambda *a: os.path.join(ROOT, *a)


def load(path):
    x, sr = sf.read(path, dtype="float32", always_2d=True)
    if sr != SR:
        from scipy.signal import resample_poly
        from math import gcd
        g = gcd(SR, sr)
        x = resample_poly(x, SR // g, sr // g, axis=0).astype(np.float32)
    if x.shape[1] == 1:
        x = np.repeat(x, 2, axis=1)
    return x.T[:2]


def place(buf, sig, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if sig.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        sig = np.vstack([sig * l * 1.414, sig * r * 1.414])
    if i < 0:
        sig, i = sig[:, -i:], 0
    n = min(sig.shape[1], buf.shape[1] - i)
    if n > 0:
        buf[:, i:i + n] += sig[:, :n] * gain


# ---------------- sound design (procedural) ----------------
def tt(d):
    return np.arange(int(d * SR)) / SR


def noise(d):
    return rng.standard_normal(int(d * SR))


def onepole_lp(x, fc):
    a = np.exp(-2 * np.pi * fc / SR)
    from scipy.signal import lfilter
    return lfilter([1 - a], [1, -a], x)


def sweep_filter(x, f0, f1):
    """Time-varying lowpass via short blocks (cheap and smooth enough)."""
    out = np.zeros_like(x)
    blk = 512
    nb = int(np.ceil(len(x) / blk))
    state = 0.0
    for b in range(nb):
        f = f0 * (f1 / f0) ** (b / max(1, nb - 1))
        a = np.exp(-2 * np.pi * f / SR)
        seg = x[b * blk:(b + 1) * blk]
        y = np.empty_like(seg)
        for i, v in enumerate(seg):
            state = (1 - a) * v + a * state
            y[i] = state
        out[b * blk:(b + 1) * blk] = y
    return out


def sfx_whoosh():
    t = tt(0.9)
    e = np.sin(np.pi * np.clip(t / 0.9, 0, 1)) ** 2.2
    lo = sweep_filter(noise(0.9), 300, 5000)
    s = (lo - onepole_lp(lo, 200)) * e
    return np.vstack([s * np.linspace(1.2, 0.5, len(s)), s * np.linspace(0.5, 1.2, len(s))]) * 0.9


def sfx_pop():
    t = tt(0.16)
    f = 520 + 900 * np.exp(-t * 60)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 32)
    return s * 0.55


def sfx_blip():
    t = tt(0.22)
    s = (np.sin(2 * np.pi * 1320 * t) + 0.5 * np.sin(2 * np.pi * 1980 * t)) * np.exp(-t * 22)
    s2 = np.sin(2 * np.pi * 1760 * t) * np.exp(-np.maximum(0, t - 0.06) * 22) * (t > 0.06)
    return (s + 0.7 * s2) * 0.28


def sfx_tick():
    t = tt(0.09)
    s = np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 70) + 0.3 * noise(0.09) * np.exp(-t * 150)
    return s * 0.35


def sfx_bloom():
    t = tt(1.6)
    s = sum(np.sin(2 * np.pi * f * t + p) for f, p in ((220, 0), (330, 1), (440, 2), (660, 0.5))) / 4
    s *= np.minimum(1, t / 0.25) * np.exp(-t * 2.2)
    air = sweep_filter(noise(1.6), 2000, 600) * np.exp(-t * 3) * 0.3
    return (s + air) * 0.5


def sfx_riser():
    d = 1.4
    t = tt(d)
    f = 200 * (8 ** (t / d))
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25
    ns = sweep_filter(noise(d), 400, 9000) * 0.6
    e = (t / d) ** 2.4
    s = (tone + ns) * e
    s[-int(0.03 * SR):] *= np.linspace(1, 0, int(0.03 * SR))
    return np.vstack([s * 0.9, s]) * 0.6


def sfx_impact():
    t = tt(2.2)
    f = 42 + 70 * np.exp(-t * 14)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.4)
    crack = noise(2.2) * np.exp(-t * 18) * 0.5
    crack = crack - onepole_lp(crack, 500)
    body = sweep_filter(noise(2.2), 3000, 150) * np.exp(-t * 3) * 0.35
    return (sub * 0.9 + crack + body) * 0.8


def sfx_zip():
    t = tt(0.32)
    f = 600 + 2600 * (t / 0.32) ** 1.5
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / 0.32) ** 2
    return s * 0.18


def bell(freqs, d=1.6, decay=3.0):
    t = tt(d)
    s = np.zeros_like(t)
    for i, f in enumerate(freqs):
        s += np.sin(2 * np.pi * f * t) * np.exp(-t * decay * (1 + i * 0.4)) * (0.8 ** i)
        s += 0.25 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * decay * 3)
    return s * np.minimum(1, t / 0.003)


def sfx_chime():
    a = bell([1174.7], 1.2, 4)
    b = bell([1568.0], 1.2, 4)
    out = np.zeros(int(1.4 * SR))
    out[:len(a)] += a
    out[int(0.09 * SR):int(0.09 * SR) + len(b)] += b[: len(out) - int(0.09 * SR)]
    return out * 0.22


def sfx_success():
    notes = [880.0, 1108.7, 1318.5, 1760.0]
    out = np.zeros(int(2.0 * SR))
    for i, f in enumerate(notes):
        b = bell([f], 1.6, 3)
        o = int(i * 0.075 * SR)
        out[o:o + len(b)] += b[: len(out) - o] * (0.9 if i < 3 else 1.0)
    sparkle = sweep_filter(noise(2.0), 9000, 3000) * np.exp(-tt(2.0) * 4) * 0.08
    return (out * 0.24 + sparkle)


def sfx_shimmer():
    t = tt(2.4)
    s = sum(np.sin(2 * np.pi * f * t) * (0.5 + 0.5 * np.sin(2 * np.pi * (3 + i) * t)) for i, f in enumerate((1760, 2217, 2637, 3520))) / 4
    return s * np.minimum(1, t / 0.4) * np.exp(-t * 1.6) * 0.16


def sfx_swell():
    d = 1.6
    t = tt(d)
    s = sum(np.sin(2 * np.pi * f * t) for f in (146.8, 220.0, 293.7)) / 3
    s *= np.sin(np.pi * t / d) ** 1.5
    air = sweep_filter(noise(d), 500, 4000) * np.sin(np.pi * t / d) ** 2 * 0.25
    return (s * 0.5 + air) * 0.6


def sfx_type():
    """Soft keyboard clatter for the typing beat."""
    d = 2.2
    out = np.zeros(int(d * SR))
    k = 0.0
    while k < d - 0.08:
        c = noise(0.03) * np.exp(-tt(0.03) * 220)
        c = c - onepole_lp(c, 1500)
        i = int(k * SR)
        out[i:i + len(c)] += c * (0.5 + 0.5 * rng.random())
        k += 0.07 + 0.06 * rng.random()
    return out * 0.35


def brickwall(x, ceiling_db=-1.5, look=0.004):
    """Look-ahead brickwall limiter: min-filtered gain, smoothed inside its hold window."""
    from scipy.ndimage import minimum_filter1d, uniform_filter1d
    c = 10 ** (ceiling_db / 20)
    from scipy.signal import resample_poly
    up = np.max(np.abs(resample_poly(x, 4, 1, axis=1)), axis=0)  # true-peak (4x) detection
    amp = up[: (len(up) // 4) * 4].reshape(-1, 4).max(axis=1)
    amp = np.pad(amp, (0, x.shape[1] - len(amp)), mode="edge")
    g = np.minimum(1.0, c / np.maximum(amp, 1e-9))
    w = int(look * SR)
    g = minimum_filter1d(g, size=2 * w + 1)
    g = uniform_filter1d(g, size=w + 1)
    rel = uniform_filter1d(minimum_filter1d(g, size=int(0.06 * SR)), size=int(0.06 * SR))
    g = np.minimum(g, np.maximum(rel, g * 0))  # gentle release tail
    return (x * g).astype(np.float32)


SFX = {"whoosh": sfx_whoosh, "pop": sfx_pop, "blip": sfx_blip, "tick": sfx_tick, "bloom": sfx_bloom, "riser": sfx_riser,
       "impact": sfx_impact, "zip": sfx_zip, "chime": sfx_chime, "success": sfx_success, "shimmer": sfx_shimmer,
       "swell": sfx_swell, "type": sfx_type}


def main():
    T = json.load(open(P("content/timing.json")))
    events = json.load(open(P("content/sfx.json")))
    total = T["total"]
    n = int(total * SR)
    voice = np.zeros((2, n), np.float32)
    sfx = np.zeros((2, n), np.float32)

    # ---- voice ----
    vchain = Pedalboard([HighpassFilter(75), PeakFilter(250, -2.0, 1.0), PeakFilter(3200, 2.2, 0.9), HighShelfFilter(9000, 1.5),
                         Compressor(threshold_db=-22, ratio=3.2, attack_ms=6, release_ms=90)])
    have_voice = False
    for lid, lt in T["lines"].items():
        f = P("assets/audio/voice", f"{lid}.wav")
        if not os.path.exists(f):
            continue
        have_voice = True
        x = vchain(load(f), SR)
        place(voice, x, lt["start"])
    voice_room = Pedalboard([Reverb(room_size=0.18, wet_level=0.05, dry_level=1.0, width=0.6)])
    voice = voice_room(voice, SR)

    # ---- music ----
    lyria = P("assets/audio/music_lyria.wav")
    score = P("assets/audio/music_score.wav")
    if os.path.exists(lyria):
        music = load(lyria)
        src = "lyria"
    else:
        subprocess.run([sys.executable, P("tools/score.py"), P("content/timing.json"), score], check=True)
        music = load(score)
        src = "score"
    m = np.zeros((2, n), np.float32)
    k = min(n, music.shape[1])
    m[:, :k] = music[:, :k]
    music = m
    # Lyria and the score are levelled to the same reference before mixing.
    meter = pyln.Meter(SR)
    ml = meter.integrated_loudness(music.T)
    music *= 10 ** ((-20.0 - ml) / 20)
    # Tame Lyria's heavy low end so the narration stays clear on small speakers.
    music = Pedalboard([HighpassFilter(38), LowShelfFilter(140, -4.5, 0.7), PeakFilter(320, -1.5, 1.0)])(music, SR)

    # Envelope: fade in, duck under the voice, fade out under the end card.
    t = np.arange(n) / SR
    env = np.minimum(1, t / 1.2)
    duck = np.zeros(n)
    for lid, lt in T["lines"].items():
        a, b = lt["start"] - 0.25, lt["start"] + lt["dur"] + 0.35
        duck[(t >= a) & (t <= b)] = 1.0
    # Smooth the duck curve (attack ~150 ms, release ~450 ms).
    from scipy.ndimage import uniform_filter1d
    duck = uniform_filter1d(duck, int(0.35 * SR))
    duck_db = -10.5 * duck if have_voice else 0 * duck
    env = env * 10 ** (duck_db / 20)
    fade_out = np.clip((total - t) / 2.6, 0, 1) ** 1.5
    env = env * fade_out
    # Small lift for the end card where there is no narration.
    lift = 1 + 0.25 * np.clip((t - T["endcard"]) / 0.8, 0, 1)
    music *= (env * lift).astype(np.float32)

    # Carve a little room for the voice in the music (2-4 kHz) while it speaks.
    carve = Pedalboard([PeakFilter(2800, -3.5, 0.8)])(music, SR)
    dmix = duck.astype(np.float32)
    music = music * (1 - dmix) + carve * dmix

    # ---- sound design ----
    for ev in events:
        fn = SFX.get(ev["type"])
        if not fn or ev["t"] >= total:
            continue
        s = fn()
        pan = 0.0 if s.ndim == 2 else float(rng.uniform(-0.3, 0.3))
        place(sfx, s.astype(np.float32), ev["t"], ev["gain"], pan)
    sfx = Pedalboard([HighpassFilter(40), Reverb(room_size=0.45, wet_level=0.14, dry_level=0.9, width=1.0)])(sfx, SR)

    # ---- balance + master ----
    sfx_gain = 10 ** (-7.5 / 20)
    mix = voice + music * 1.0 + sfx * sfx_gain
    master = Pedalboard([Compressor(threshold_db=-16, ratio=1.8, attack_ms=25, release_ms=250)])
    mix = master(mix.astype(np.float32), SR)
    for _ in range(3):  # loudness to -14 LUFS, peaks held under -1.5 dBFS
        lufs = meter.integrated_loudness(mix.T)
        mix = brickwall(mix * 10 ** ((-14.0 - lufs) / 20))
    out = P("assets/audio/mix.wav")
    sf.write(out, mix.T, SR, subtype="PCM_24")
    final = meter.integrated_loudness(mix.T)
    print(f"mix: {out} ({total:.1f}s, music={src}, voice={'yes' if have_voice else 'no'}, {final:.1f} LUFS, peak {20 * np.log10(np.abs(mix).max()):.1f} dBFS)")


if __name__ == "__main__":
    main()
