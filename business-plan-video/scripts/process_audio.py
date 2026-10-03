"""Tighten pauses, speed up the narration to fit the target length, and write timing.json.

Each raw scene clip (raw/<id>.wav) is split at its pauses so every line of
narration.json gets an exact start time. Long pauses are shortened, then the
whole narration is time-stretched (pitch kept) so the video lands on TARGET_SEC.

Usage: python3 scripts/process_audio.py
"""
import json
import os
import subprocess
import wave

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS = 30
TARGET_SEC = 120.0
SR = 24000
FRAME = 240  # 10 ms
LINE_GAP = 0.16  # pause kept between two lines (s)
INNER_GAP = 0.09  # pause kept inside a line (s)
HEAD = {"intro": 0.9}  # silence before the voice starts in a scene (s)
TAIL = {"outro": 3.2}  # silence after the voice ends in a scene (s)
DEFAULT_HEAD = 0.35
DEFAULT_TAIL = 0.3
MIN_SPEED, MAX_SPEED = 1.08, 1.45

cfg = json.load(open(os.path.join(ROOT, "scripts", "narration.json"), encoding="utf-8"))


def read(path):
    with wave.open(path) as w:
        assert w.getframerate() == SR and w.getnchannels() == 1
        return np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").astype(np.float64) / 32768


def write(path, x, sr=SR):
    data = (np.clip(x, -1, 1) * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(data.tobytes())


def analyse(x, n_lines, texts):
    frames = len(x) // FRAME
    rms = np.sqrt(np.mean(x[: frames * FRAME].reshape(frames, FRAME) ** 2, axis=1) + 1e-12)
    db = 20 * np.log10(rms)
    thr = max(-45.0, db.max() - 32)
    voiced = db > thr
    idx = np.flatnonzero(voiced)
    first, last = idx[0], idx[-1]
    runs = []  # (start_frame, end_frame) of internal silences
    i = first
    while i <= last:
        if not voiced[i]:
            j = i
            while j <= last and not voiced[j]:
                j += 1
            if j - i >= 8:
                runs.append((i, j))
            i = j
        else:
            i += 1
    need = n_lines - 1
    by_len = sorted(runs, key=lambda r: r[1] - r[0], reverse=True)
    boundaries = sorted(by_len[:need])
    ok = len(boundaries) == need
    if not ok:  # fall back: place missing boundaries by text length
        print(f"  ! found {len(boundaries)} of {need} line pauses, using text-length estimate")
        total = sum(len(s) for s in texts)
        cum = np.cumsum([len(s) for s in texts])[:-1] / total
        span = last - first
        boundaries = [(int(first + c * span), int(first + c * span) + 1) for c in cum]
    return first, last, runs, boundaries, ok


def tighten(x, first, last, runs, boundaries):
    """Rebuild the clip with short pauses; return audio and line start times (s)."""
    bset = set(boundaries)
    cuts = sorted(set(runs) | bset)
    pieces, starts = [], [0.0]
    pos = first
    out_len = 0
    for (s, e) in cuts:
        if s < pos:
            continue
        chunk = x[pos * FRAME: s * FRAME]
        pieces.append(chunk)
        out_len += len(chunk)
        keep = LINE_GAP if (s, e) in bset else INNER_GAP
        keep_n = min(int(keep * SR), (e - s) * FRAME)
        pieces.append(np.zeros(keep_n))
        out_len += keep_n
        if (s, e) in bset:
            starts.append(out_len / SR)
        pos = e
    tail = x[pos * FRAME: (last + 3) * FRAME]
    pieces.append(tail)
    y = np.concatenate(pieces)
    fade = min(len(y), 240)
    y[-fade:] *= np.linspace(1, 0, fade)
    return y, starts


tmp = os.path.join(ROOT, "raw", "tight")
os.makedirs(tmp, exist_ok=True)
scenes = []
for sc in cfg["scenes"]:
    x = read(os.path.join(ROOT, "raw", f"{sc['id']}.wav"))
    first, last, runs, boundaries, ok = analyse(x, len(sc["segments"]), sc["segments"])
    y, starts = tighten(x, first, last, runs, boundaries)
    path = os.path.join(tmp, f"{sc['id']}.wav")
    write(path, y)
    scenes.append({"id": sc["id"], "texts": sc["segments"], "dur": len(y) / SR, "starts": starts, "exact": ok})
    print(f"{sc['id']:10s} raw {len(x) / SR:6.2f}s -> tight {len(y) / SR:6.2f}s  lines {len(starts)}")

pads = sum(HEAD.get(s["id"], DEFAULT_HEAD) + TAIL.get(s["id"], DEFAULT_TAIL) for s in scenes)
speech = sum(s["dur"] for s in scenes)
speed = speech / (TARGET_SEC - pads)
print(f"speech {speech:.2f}s, pads {pads:.2f}s, needed speed x{speed:.3f}")
extra = 0.0
if speed < MIN_SPEED:
    speed = MIN_SPEED
    extra = (TARGET_SEC - pads - speech / speed) / len(scenes)
elif speed > MAX_SPEED:
    raise SystemExit(f"Narration too long: needs x{speed:.2f}. Shorten narration.json.")

timeline = []
cursor = 0
total_frames = int(round(TARGET_SEC * FPS))
for i, s in enumerate(scenes):
    out = os.path.join(ROOT, "public", "audio", f"vo_{s['id']}.wav")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", os.path.join(tmp, f"{s['id']}.wav"),
                    "-af", f"atempo={speed:.4f},highpass=f=70,acompressor=threshold=-18dB:ratio=3:attack=5:release=80,volume=1.6",
                    "-ar", "44100", "-ac", "1", out], check=True)
    with wave.open(out) as w:
        vo_sec = w.getnframes() / w.getframerate()
    head = HEAD.get(s["id"], DEFAULT_HEAD)
    tail = TAIL.get(s["id"], DEFAULT_TAIL) + extra
    dur_frames = int(round((head + vo_sec + tail) * FPS))
    if i == len(scenes) - 1:
        dur_frames = total_frames - cursor  # land exactly on the target length
    timeline.append({
        "id": s["id"],
        "from": cursor,
        "duration": dur_frames,
        "voiceAt": int(round(head * FPS)),
        "voiceFrames": int(round(vo_sec * FPS)),
        "lines": [{"text": t, "at": int(round((head + st / speed) * FPS))} for t, st in zip(s["texts"], s["starts"])],
    })
    cursor += dur_frames

json.dump({"fps": FPS, "totalFrames": total_frames, "speed": round(speed, 3), "scenes": timeline},
          open(os.path.join(ROOT, "src", "timing.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"speed x{speed:.3f}; total {total_frames} frames ({total_frames / FPS:.1f}s); last scene {timeline[-1]['duration']} frames")
