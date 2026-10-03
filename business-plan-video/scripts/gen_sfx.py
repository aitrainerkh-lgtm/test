"""Synthesize the background music and sound effects (no external samples).

Usage: python3 scripts/gen_sfx.py  ->  public/sfx/*.wav and public/audio/music.wav
"""
import os
import wave

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 44100
rng = np.random.default_rng(7)


def save(name, x, folder="sfx"):
    x = np.asarray(x, dtype=np.float64)
    peak = np.max(np.abs(x)) or 1.0
    x = x / peak * 0.89
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    data = (x * 32767).astype("<i2")
    path = os.path.join(ROOT, "public", folder, name)
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())
    print("wrote", path, f"{len(x) / SR:.2f}s")


def t(dur):
    return np.arange(int(dur * SR)) / SR


def sweep(f0, f1, dur, curve="exp"):
    tt = t(dur)
    if curve == "exp":
        f = f0 * (f1 / f0) ** (tt / dur)
    else:
        f = f0 + (f1 - f0) * tt / dur
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def smooth(x, n):
    """Moving-average low-pass (n samples)."""
    if n <= 1:
        return x
    k = np.ones(n) / n
    return np.convolve(x, k, mode="same")


def band_sweep_noise(dur, c0, c1, q=0.6):
    """Noise whose band centre sweeps c0 -> c1 (chunked FFT filter, overlap-add)."""
    n = int(dur * SR)
    noise = rng.standard_normal(n + 4096)
    out = np.zeros(n + 4096)
    hop, size = 512, 2048
    win = np.hanning(size)
    freqs = np.fft.rfftfreq(size, 1 / SR)
    for i, start in enumerate(range(0, n, hop)):
        frac = min(start / n, 1)
        c = c0 * (c1 / c0) ** frac
        bw = c * q
        mask = np.exp(-0.5 * ((freqs - c) / bw) ** 2)
        seg = noise[start:start + size] * win
        out[start:start + size] += np.fft.irfft(np.fft.rfft(seg) * mask, size) * win
    return out[:n]


def env_ad(n, attack, decay_pow=1.0):
    a = int(attack * SR)
    e = np.ones(n)
    e[:a] = np.linspace(0, 1, a)
    rest = n - a
    e[a:] = (1 - np.arange(rest) / rest) ** decay_pow
    return e


# ---------------------------------------------------------------- SFX
def whoosh():
    d = 0.55
    x = band_sweep_noise(d, 400, 5000, 0.5)
    e = np.sin(np.pi * np.linspace(0, 1, len(x))) ** 1.5
    return x * e


def whoosh_down():
    d = 0.5
    x = band_sweep_noise(d, 4000, 300, 0.5)
    e = np.sin(np.pi * np.linspace(0, 1, len(x))) ** 1.3
    return x * e


def pop():
    d = 0.12
    x = sweep(500, 1400, d) * env_ad(int(d * SR), 0.003, 3)
    return x


def click():
    d = 0.04
    x = rng.standard_normal(int(d * SR)) * env_ad(int(d * SR), 0.001, 6)
    x = x - smooth(x, 12)
    return x * 0.6 + sweep(2200, 1800, d) * env_ad(int(d * SR), 0.001, 8) * 0.5


def ding():
    d = 1.6
    tt = t(d)
    x = np.zeros_like(tt)
    for mult, amp, dec in [(1, 1, 2.5), (2.76, 0.45, 4), (5.4, 0.25, 6), (8.9, 0.12, 9)]:
        x += amp * np.sin(2 * np.pi * 1046.5 * mult * tt) * np.exp(-dec * tt)
    x[: int(0.002 * SR)] *= np.linspace(0, 1, int(0.002 * SR))
    return x


def chime():
    """Quick rising C-major arpeggio for positive moments."""
    notes = [523.25, 659.25, 783.99, 1046.5]
    total = np.zeros(int(1.4 * SR))
    for i, f in enumerate(notes):
        start = int(i * 0.07 * SR)
        tt = t(1.4 - i * 0.07)
        tone = (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(4 * np.pi * f * tt)) * np.exp(-4 * tt)
        tone[:80] *= np.linspace(0, 1, 80)
        seg = total[start:start + len(tone)]
        seg += tone[: len(seg)]
    return total


def buzz():
    """Soft 'wrong' double-buzz for the no-plan side."""
    out = np.zeros(int(0.5 * SR))
    for k in range(2):
        tt = t(0.16)
        sq = np.sign(np.sin(2 * np.pi * 140 * tt)) * 0.5 + np.sin(2 * np.pi * 70 * tt)
        sq = smooth(sq, 20) * env_ad(len(tt), 0.005, 1.5)
        s = int(k * 0.22 * SR)
        out[s:s + len(tt)] += sq
    return out


def riser():
    d = 2.2
    tt = t(d)
    x = band_sweep_noise(d, 300, 8000, 0.35) * (tt / d) ** 2
    tone = sweep(150, 1200, d) * (tt / d) ** 2.5 * 0.25
    return x + tone


def impact():
    d = 1.6
    tt = t(d)
    boom = sweep(90, 32, d) * np.exp(-3.2 * tt)
    hit = rng.standard_normal(len(tt)) * np.exp(-25 * tt)
    hit = smooth(hit, 6)
    return boom * 1.0 + hit * 0.5


def type_tick():
    d = 0.03
    x = rng.standard_normal(int(d * SR)) * env_ad(int(d * SR), 0.0005, 10)
    return x - smooth(x, 6)


# ---------------------------------------------------------------- MUSIC
BPM = 124
BEAT = 60 / BPM


def midi(n):
    return 440 * 2 ** ((n - 69) / 12)


def music(duration=126.0):
    n = int(duration * SR)
    mix_drums = np.zeros(n)
    mix_bass = np.zeros(n)
    mix_keys = np.zeros(n)
    mix_pad = np.zeros(n)
    side = np.ones(n)

    def add(buf, sig, start):
        s = int(start * SR)
        if s >= n:
            return
        e = min(n, s + len(sig))
        buf[s:e] += sig[: e - s]

    kick_len = int(0.32 * SR)
    kt = np.arange(kick_len) / SR
    kick = np.sin(2 * np.pi * np.cumsum(45 + 110 * np.exp(-kt * 28)) / SR) * np.exp(-kt * 9)
    kick[:40] *= np.linspace(0, 1, 40)

    clap_len = int(0.22 * SR)
    clap = rng.standard_normal(clap_len)
    clap = (clap - smooth(clap, 30)) * np.exp(-np.arange(clap_len) / SR * 22)

    hat_len = int(0.06 * SR)
    hat = rng.standard_normal(hat_len)
    hat = (hat - smooth(hat, 4)) * np.exp(-np.arange(hat_len) / SR * 70)

    duck_len = int(BEAT * SR)
    duck = 1 - 0.65 * np.exp(-np.arange(duck_len) / SR * 9)

    # C - G - Am - F (one bar each), roots and triads in MIDI
    prog = [(48, [60, 64, 67]), (43, [59, 62, 67]), (45, [60, 64, 69]), (41, [60, 65, 69])]
    bars = int(duration / (4 * BEAT)) + 1

    def saw(freq, dur, bright=1.0):
        tt = t(dur)
        x = np.zeros_like(tt)
        for h in range(1, 9):
            x += np.sin(2 * np.pi * freq * h * tt) / h * (bright ** (h - 1))
        return x

    for bar in range(bars):
        root, chord = prog[bar % 4]
        b0 = bar * 4 * BEAT
        intro = bar < 2  # first two bars: lighter groove under the hook
        for beat in range(4):
            tb = b0 + beat * BEAT
            if not intro:
                add(mix_drums, kick, tb)
                s = int(tb * SR)
                e = min(n, s + duck_len)
                if s < n:
                    side[s:e] = np.minimum(side[s:e], duck[: e - s])
            if beat in (1, 3):
                add(mix_drums, clap * (0.5 if intro else 0.8), tb)
            add(mix_drums, hat * 0.35, tb + BEAT / 2)
            if not intro:
                add(mix_drums, hat * 0.18, tb + BEAT / 4)
                add(mix_drums, hat * 0.18, tb + 3 * BEAT / 4)
            # offbeat bass (8ths)
            for k, off in enumerate((0, BEAT / 2)):
                note = root + (12 if k == 1 else 0)
                d = BEAT / 2 * 0.9
                bs = saw(midi(note), d, 0.55) * env_ad(int(d * SR), 0.004, 1.2)
                add(mix_bass, smooth(bs, 8), tb + off)
        # 16th-note pluck arpeggio
        arp = chord + [chord[0] + 12]
        for step in range(16):
            ts = b0 + step * BEAT / 4
            f = midi(arp[(step * 3) % 4] + 12)
            d = BEAT / 4 * 1.6
            pl = saw(f, d, 0.45) * np.exp(-t(d) * 18)
            pl[:30] *= np.linspace(0, 1, 30)
            add(mix_keys, pl * (0.55 if step % 4 == 0 else 0.35), ts)
        # soft pad
        d = 4 * BEAT
        pad = sum(np.sin(2 * np.pi * midi(c) * t(d)) + 0.5 * np.sin(2 * np.pi * midi(c) * 1.003 * t(d)) for c in chord)
        a = np.minimum(1, t(d) / 0.3) * np.minimum(1, (d - t(d)) / 0.3)
        add(mix_pad, pad * a, b0)

    mix = (mix_drums / (np.max(np.abs(mix_drums)) or 1) * 0.9
           + mix_bass / (np.max(np.abs(mix_bass)) or 1) * 0.55 * side
           + mix_keys / (np.max(np.abs(mix_keys)) or 1) * 0.35 * side
           + mix_pad / (np.max(np.abs(mix_pad)) or 1) * 0.22 * side)
    # gentle stereo: keys slightly widened
    left = mix + 0.06 * np.roll(mix_keys / (np.max(np.abs(mix_keys)) or 1), 300)
    right = mix + 0.06 * np.roll(mix_keys / (np.max(np.abs(mix_keys)) or 1), -300)
    fade = np.ones(n)
    fo = int(3 * SR)
    fade[-fo:] = np.linspace(1, 0, fo)
    fi = int(0.5 * SR)
    fade[:fi] = np.linspace(0, 1, fi)
    st = np.stack([left * fade, right * fade], axis=1)
    return np.tanh(st * 1.2)


if __name__ == "__main__":
    for name, fn in [("whoosh", whoosh), ("whoosh_down", whoosh_down), ("pop", pop), ("click", click),
                     ("ding", ding), ("chime", chime), ("buzz", buzz), ("riser", riser), ("impact", impact),
                     ("tick", type_tick)]:
        save(f"{name}.wav", fn())
    save("music.wav", music(), folder="audio")
