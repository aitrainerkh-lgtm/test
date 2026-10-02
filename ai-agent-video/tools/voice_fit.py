#!/usr/bin/env python3
"""Fit the narration to the 60 s cut without rewriting it: if the voice runs
long, time-stretch every line by the same small factor (Rubber Band, pitch and
formants preserved, max 8%). Originals live in assets/audio/voice_src/."""
import glob
import os
import shutil
import subprocess
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
VOICE = os.path.join(ROOT, "assets/audio/voice")
SRC = os.path.join(ROOT, "assets/audio/voice_src")
TARGET = float(os.environ.get("VOICE_TARGET", 50.5))
MAX_SPEED = 1.08

os.makedirs(SRC, exist_ok=True)
if "--refresh" in sys.argv or not glob.glob(os.path.join(SRC, "*.wav")):
    for f in glob.glob(os.path.join(VOICE, "*.wav")):
        shutil.copy2(f, SRC)


def dur(f):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).decode())


srcs = sorted(glob.glob(os.path.join(SRC, "*.wav")))
total = sum(dur(f) for f in srcs)
speed = min(MAX_SPEED, max(1.0, total / TARGET))
for f in srcs:
    out = os.path.join(VOICE, os.path.basename(f))
    if speed == 1.0:
        shutil.copy2(f, out)
        continue
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", f, "-af",
                    f"rubberband=tempo={speed:.4f}:pitch=1:formant=preserved:transients=smooth:detector=soft:pitchq=quality:window=standard",
                    "-ar", "48000", "-c:a", "pcm_s24le", out], check=True)
new_total = sum(dur(os.path.join(VOICE, os.path.basename(f))) for f in srcs)
print(f"voice_fit: {total:.1f}s -> {new_total:.1f}s (speed x{speed:.3f})")
