#!/usr/bin/env python3
"""Clean one TTS line: trim edge silence, gentle de-click fades, resample to
48 kHz and level-match every line to the same loudness (-18 LUFS)."""
import sys
import numpy as np
import soundfile as sf
import pyloudnorm as pyln
from scipy.signal import resample_poly

src, dst = sys.argv[1], sys.argv[2]
x, sr = sf.read(src, dtype="float64", always_2d=True)
x = x.mean(axis=1)
if sr != 48000:
    from math import gcd
    g = gcd(48000, sr)
    x = resample_poly(x, 48000 // g, sr // g)
    sr = 48000

# Trim leading/trailing silence using a short-window RMS gate.
win = int(0.01 * sr)
rms = np.sqrt(np.convolve(x ** 2, np.ones(win) / win, mode="same"))
thr = max(10 ** (-48 / 20), rms.max() * 10 ** (-40 / 20))
idx = np.where(rms > thr)[0]
if len(idx):
    a = max(0, idx[0] - int(0.04 * sr))
    b = min(len(x), idx[-1] + int(0.12 * sr))
    x = x[a:b]

fade = int(0.012 * sr)
x[:fade] *= np.linspace(0, 1, fade)
x[-fade:] *= np.linspace(1, 0, fade)

meter = pyln.Meter(sr)
lufs = meter.integrated_loudness(x) if len(x) > sr * 0.4 else -18.0
if np.isfinite(lufs):
    x = x * 10 ** ((-18.0 - lufs) / 20)
peak = np.abs(x).max()
if peak > 0.89:
    x = x * (0.89 / peak)
sf.write(dst, x.astype(np.float32), sr, subtype="PCM_24")
