#!/usr/bin/env python3
"""Original synthesized underscore (fallback when Lyria is unavailable).

100 BPM, B minor / D major, vi-IV-I-V. Layers enter with the film's scenes:
pads + piano (hook), hats + bass (anatomy), kick (compare), full groove with
snare and bright arp (loop, example), lifted resolution (close), final chord
ring-out under the end card. Usage: score.py <timing.json> <out.wav>"""
import json
import sys
import numpy as np
import soundfile as sf
from pedalboard import Pedalboard, Reverb, Delay, LowpassFilter, HighpassFilter, Compressor, Chorus, Gain

SR = 48000
BPM = 100.0
BEAT = 60.0 / BPM
rng = np.random.default_rng(42)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def env_adsr(n, a, d, s, r, sr=SR):
    a, d, r = int(a * sr), int(d * sr), int(r * sr)
    sus = max(0, n - a - d - r)
    e = np.concatenate([np.linspace(0, 1, max(a, 1)), np.linspace(1, s, max(d, 1)), np.full(sus, s), np.linspace(s, 0, max(r, 1))])
    return e[:n] if len(e) >= n else np.pad(e, (0, n - len(e)))


def saw(freq, n, harmonics=None):
    t = np.arange(n) / SR
    out = np.zeros(n)
    hmax = harmonics or max(1, int(9000 / freq))
    for k in range(1, hmax + 1):
        out += ((-1) ** (k + 1)) * np.sin(2 * np.pi * k * freq * t) / k
    return out * 0.6


def place(buf, sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= buf.shape[1]:
        return
    n = min(len(sig), buf.shape[1] - i)
    l = np.cos((pan + 1) * np.pi / 4)
    r = np.sin((pan + 1) * np.pi / 4)
    buf[0, i:i + n] += sig[:n] * gain * l
    buf[1, i:i + n] += sig[:n] * gain * r


# Chords (MIDI): Bm, G, D, A  -- pad voicings and bass roots.
CHORDS = [
    {"pad": [59, 62, 66, 71], "bass": 35, "arp": [71, 74, 78, 83]},
    {"pad": [55, 59, 62, 67], "bass": 31, "arp": [67, 71, 74, 79]},
    {"pad": [57, 62, 66, 69], "bass": 38, "arp": [69, 74, 78, 81]},
    {"pad": [57, 61, 64, 69], "bass": 33, "arp": [69, 73, 76, 81]},
]
BAR = 4 * BEAT
CHORD_LEN = 2 * BAR  # 4.8 s


def main(timing_path, out_path):
    T = json.load(open(timing_path))
    total = T["total"]
    sc = T["scenes"]
    end = T["endcard"]
    n = int((total + 3) * SR)
    pad = np.zeros((2, n)); bass = np.zeros((2, n)); arp = np.zeros((2, n)); keys = np.zeros((2, n))
    drums = np.zeros((2, n))

    t_hats = sc["anatomy"]["start"]
    t_kick = sc["compare"]["start"]
    t_full = sc["loop"]["start"]
    t_close = sc["close"]["start"]

    nch = int(np.ceil(end / CHORD_LEN)) + 1
    for c in range(nch):
        t0 = c * CHORD_LEN
        ch = CHORDS[c % 4]
        last = t0 + CHORD_LEN >= end
        dur = (total + 2.5 - t0) if last else CHORD_LEN + 0.6
        ns = int(dur * SR)
        # Pad: detuned saws, slow attack.
        for k, m in enumerate(ch["pad"]):
            f = midi(m)
            sig = sum(saw(f * d, ns, harmonics=24) for d in (0.996, 1.0, 1.004)) / 3
            sig *= env_adsr(ns, 0.9, 0.5, 0.85, 1.4 if not last else 2.6)
            place(pad, sig, t0, 0.16, pan=(-0.5 + k * 0.33))
        # Bass: sine + octave, eighth-note pulse once the groove is in.
        f = midi(ch["bass"])
        if t0 + CHORD_LEN > t_hats and not last:
            for b in range(16):
                tb = t0 + b * BEAT / 2
                if tb < t_hats or tb >= end:
                    continue
                nb = int(BEAT / 2 * SR * 0.95)
                tt = np.arange(nb) / SR
                s = np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(2 * np.pi * 2 * f * tt)
                s = np.tanh(1.6 * s) * env_adsr(nb, 0.005, 0.12, 0.55, 0.06)
                place(bass, s, tb, 0.19 if tb >= t_kick else 0.13)
        elif last or t0 < t_hats:
            s = np.sin(2 * np.pi * f * np.arange(ns) / SR) * env_adsr(ns, 1.2, 0.5, 0.8, 2.0)
            place(bass, s, t0, 0.11 if last else 0.06)
        # Arp: 16ths over chord tones from the anatomy scene on.
        pattern = [0, 1, 2, 3, 2, 1, 2, 3, 0, 2, 1, 3, 2, 1, 3, 2]
        for b in range(32):
            tb = t0 + b * BEAT / 4
            if tb < t_hats - BAR or tb >= end - 0.2:
                continue
            m = ch["arp"][pattern[b % 16]] + (12 if (tb >= t_full and b % 8 == 7) else 0)
            na = int(0.28 * SR)
            tt = np.arange(na) / SR
            fa = midi(m)
            s = (np.sin(2 * np.pi * fa * tt) * 0.6 + saw(fa, na, harmonics=6) * 0.4) * np.exp(-tt * 16)
            g = 0.06 if tb < t_full else 0.085
            place(arp, s, tb, g, pan=0.35 if b % 2 else -0.35)
    # Felt-piano-like motif in the hook and the close.
    motif = [(0, 78), (1.5, 76), (2, 74), (3, 71), (4, 73), (6, 74)]
    for base in (0.6, t_close + 0.4):
        for beat, m in motif:
            tb = base + beat * BEAT
            if tb > total:
                continue
            nk = int(2.4 * SR)
            tt = np.arange(nk) / SR
            f = midi(m)
            s = (np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(2 * np.pi * 2 * f * tt) * np.exp(-tt * 3) + 0.15 * np.sin(2 * np.pi * 3 * f * tt) * np.exp(-tt * 6))
            s *= np.exp(-tt * 1.6) * np.minimum(1, tt / 0.004)
            place(keys, s, tb, 0.12, pan=0.1)

    # Drums.
    def kick():
        nk = int(0.45 * SR); tt = np.arange(nk) / SR
        f = 48 + 90 * np.exp(-tt * 28)
        ph = 2 * np.pi * np.cumsum(f) / SR
        return np.sin(ph) * np.exp(-tt * 7.5) + 0.12 * rng.standard_normal(nk) * np.exp(-tt * 90)

    def hat(open_=False):
        nh = int((0.18 if open_ else 0.06) * SR)
        s = rng.standard_normal(nh)
        s = np.diff(np.concatenate([[0], s]))  # brighten
        return s * np.exp(-np.arange(nh) / SR * (18 if open_ else 70))

    def snare():
        ns = int(0.3 * SR); tt = np.arange(ns) / SR
        return 0.5 * np.sin(2 * np.pi * 190 * tt) * np.exp(-tt * 20) + 0.7 * rng.standard_normal(ns) * np.exp(-tt * 16)

    nbeats = int(end / BEAT) + 1
    for b in range(nbeats):
        tb = b * BEAT
        if tb >= end - 0.15:
            break
        if tb >= t_kick:
            place(drums, kick(), tb, 0.55 if tb >= t_full else 0.4)
        if tb >= t_full and b % 2 == 1:
            place(drums, snare(), tb, 0.16, pan=0.05)
        if tb >= t_hats:
            place(drums, hat(), tb + BEAT / 2, 0.07, pan=0.3)
            if tb >= t_full:
                place(drums, hat(), tb, 0.04, pan=-0.3)
    # Final soft kick on the end card.
    place(drums, kick(), end + 0.3, 0.5)

    # Sidechain pump on pads/bass/arp from the kick grid.
    pump = np.ones(n)
    for b in range(nbeats):
        tb = b * BEAT
        if tb < t_kick or tb >= end - 0.15:
            continue
        i = int(tb * SR); m = int(BEAT * SR)
        seg = 1 - 0.38 * np.exp(-np.arange(min(m, n - i)) / SR * 9)
        pump[i:i + len(seg)] = np.minimum(pump[i:i + len(seg)], seg)

    fx_pad = Pedalboard([HighpassFilter(140), LowpassFilter(2400), Chorus(rate_hz=0.3, depth=0.25, mix=0.35), Reverb(room_size=0.85, wet_level=0.32, dry_level=0.7, width=1.0)])
    fx_arp = Pedalboard([HighpassFilter(300), LowpassFilter(6000), Delay(delay_seconds=BEAT * 0.75, feedback=0.32, mix=0.28), Reverb(room_size=0.6, wet_level=0.22, dry_level=0.8)])
    fx_keys = Pedalboard([Reverb(room_size=0.9, wet_level=0.38, dry_level=0.65, width=1.0)])
    fx_bass = Pedalboard([LowpassFilter(900), Compressor(threshold_db=-18, ratio=3)])
    fx_drums = Pedalboard([HighpassFilter(30), Compressor(threshold_db=-16, ratio=3, attack_ms=8, release_ms=120), Reverb(room_size=0.3, wet_level=0.08, dry_level=0.95)])

    mix = (fx_pad(pad.astype(np.float32), SR) * pump + fx_bass(bass.astype(np.float32), SR) * pump
           + fx_arp(arp.astype(np.float32), SR) * pump + fx_keys(keys.astype(np.float32), SR) + fx_drums(drums.astype(np.float32), SR))
    master = Pedalboard([HighpassFilter(28), Compressor(threshold_db=-14, ratio=2, attack_ms=20, release_ms=200), Gain(0)])
    mix = master(mix.astype(np.float32), SR)
    mix = mix[:, : int(total * SR)]
    mix /= max(1e-6, np.abs(mix).max()) / 0.8
    sf.write(out_path, mix.T, SR, subtype="PCM_24")
    print(f"score: wrote {out_path} ({mix.shape[1] / SR:.1f}s)")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
