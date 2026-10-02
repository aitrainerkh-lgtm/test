"""Narration: Kokoro-82M (af_heart) with word-level timings.

The stock kokoro-v1.0.onnx has no duration output. tools/README notes how the
timed variant exposes /encoder/Clip_output_0 (frames of 600 samples) as
`duration`, which kokoro-onnx turns into per-phoneme timings. Phonemes are
grouped on spaces to recover word start/end times.
"""

import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

MODEL_DIR = Path(sys.argv[1] if len(sys.argv) > 1 else "models")
OUT = Path(__file__).resolve().parent.parent / "assets" / "audio" / "vo"
OUT.mkdir(parents=True, exist_ok=True)

VOICE = "af_heart"
SPEED = 1.0

LINES = json.loads((Path(__file__).parent / "script.json").read_text())

k = Kokoro(str(MODEL_DIR / "kokoro-v1.0-timed.onnx"), str(MODEL_DIR / "voices-v1.0.bin"))
assert k.has_timings

meta = []
for line in LINES:
    text = line["text"]
    speed = line.get("speed", SPEED)
    audio, sr, timings = k.create_timed(
        text, VOICE, speed=speed, lang="en-us", sentence_pause=0.32, clause_pause=0.12
    )
    # group phoneme timings into words: a space phoneme separates words,
    # punctuation phonemes are dropped
    words, cur = [], []
    for t in timings:
        if t.phoneme == " ":
            if cur:
                words.append(cur)
            cur = []
        elif t.phoneme in ",.?!;:—…\"'()":
            continue
        else:
            cur.append(t)
    if cur:
        words.append(cur)
    text_words = text.replace("—", " ").split()
    if len(words) != len(text_words):
        print(f"WARN {line['id']}: {len(words)} phoneme words vs {len(text_words)} text words")
    wl = []
    for i, w in enumerate(words):
        label = text_words[i] if i < len(text_words) and len(words) == len(text_words) else "".join(p.phoneme for p in w)
        wl.append({"text": label, "start": round(w[0].start, 3), "end": round(w[-1].end, 3)})
    path = OUT / f"{line['id']}.wav"
    sf.write(path, audio, sr, subtype="PCM_16")
    dur = len(audio) / sr
    meta.append({"id": line["id"], "text": text, "duration": round(dur, 3), "words": wl})
    print(f"{line['id']}: {dur:.2f}s  {len(text.split())} words  {len(text.split())/dur*60:.0f} wpm")

(OUT / "vo_meta.json").write_text(json.dumps(meta, indent=1))
print("total speech", round(sum(m["duration"] for m in meta), 2))
