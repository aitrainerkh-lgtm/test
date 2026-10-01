"""Octave-band balance and loudness per section of an audio file (mix QA)."""
import json, sys, numpy as np, soundfile as sf, pyloudnorm as pyln
x, sr = sf.read(sys.argv[1]); x = x.mean(axis=1) if x.ndim > 1 else x
T = json.load(open("timing.json"))
bands = [(20, 60), (60, 120), (120, 250), (250, 500), (500, 1000), (1000, 2000), (2000, 4000), (4000, 8000), (8000, 16000)]
def bal(seg):
    F = np.abs(np.fft.rfft(seg * np.hanning(len(seg)))) ** 2; f = np.fft.rfftfreq(len(seg), 1 / sr)
    e = [10 * np.log10(F[(f >= a) & (f < b)].sum() + 1e-12) for a, b in bands]
    m = max(e); return " ".join(f"{v - m:6.1f}" for v in e)
print("section      " + " ".join(f"{a:>6}" for a, b in bands))
for k, v in T["scenes"].items():
    seg = x[int(v["start"] * sr):int(v["end"] * sr)]
    print(f"{k:4s} {pyln.Meter(sr).integrated_loudness(seg) if len(seg) > sr else 0:6.1f}LU " + bal(seg))
