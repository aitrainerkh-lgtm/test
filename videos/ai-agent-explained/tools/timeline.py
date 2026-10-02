"""Place narration lines on the master clock -> assets/audio/timeline.json"""
import json
from pathlib import Path
root = Path(__file__).resolve().parent.parent
meta = json.loads((root/"assets/audio/vo/vo_meta.json").read_text())
# start offset of first line, then gap BEFORE each following line
FIRST = 0.60
GAPS = {"02":0.40,"03":0.28,"04":0.62,"05":0.30,"06":0.50,"07":0.55,"08":0.40,
        "09":0.40,"10":0.40,"11":0.60,"12":0.25,"13":0.55,"14":0.30}
t = FIRST; out = []
for i, m in enumerate(meta):
    if i: t += GAPS[m["id"][:2]]
    out.append({**m, "start": round(t, 3), "end": round(t + m["duration"], 3),
                "words": [{**w, "t": round(t + w["start"], 3), "te": round(t + w["end"], 3)} for w in m["words"]]})
    t += m["duration"]
(root/"assets/audio/timeline.json").write_text(json.dumps(out, indent=1))
for o in out: print(f'{o["id"]:14s} {o["start"]:6.2f} -> {o["end"]:6.2f}')
