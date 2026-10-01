"""Assemble the final video from script.json, img/scene*.jpg and audio/*.wav."""
import json, os, subprocess, sys, wave
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mg

W, H, FPS = 1920, 1080, 30
FONTS = os.path.abspath(os.environ.get("FONTS_DIR", "fonts"))
OUT = sys.argv[1] if len(sys.argv) > 1 else "out/ai_agents_hr_khmer.mp4"
PREVIEW = os.environ.get("PREVIEW")  # render only a few stills to check the layout

LEAD, GAP, TAIL = 0.7, 0.45, 1.0
SPEAKERS = {  # label, ASS colour (&HBBGGRR)
    "SOPHEA": ("សុភា · HR Manager", "&H7050D9&"),
    "DARA": ("ដារ៉ា · HR Officer", "&HD65C7B&"),
    "RECRUIT": ("Recruit Agent", "&HFF8C2D&"),
    "PAYROLL": ("Payroll Agent", "&H59AA1F&"),
    "ONBOARD": ("Onboard Agent", "&H288CF2&"),
}

def dur(f):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]))

def ts(t):
    h, r = divmod(max(t, 0), 3600); m, s = divmod(r, 60)
    return f"{int(h)}:{int(m):02d}:{s:05.2f}"

s = json.load(open("script.json"))

# ---------- timeline ----------
segments, events, clips = [], [], []   # segments: (image, start, length, kind)
tl = {"scenes": []}
t = 0.0
td = dur("audio/title.wav")
intro = 0.8 + td + 1.4
segments.append(("img/scene1.jpg", t, intro, "card"))
clips.append(("audio/title.wav", 0.8))
events.append(("Title", 0.4, intro - 0.3, s["title"]))
events.append(("Brand", 0.4, intro - 0.3, "AI For Business"))
tl["intro"] = (0.0, intro)
t += intro

for si, sc in enumerate(s["scenes"], 1):
    start = t
    t += LEAD
    sc_lines = []
    for li, line in enumerate(sc["lines"], 1):
        f = f"audio/s{si}_{li}.wav"; d = dur(f)
        clips.append((f, t))
        sp = line["speaker"]
        sc_lines.append({"speaker": sp, "start": t, "end": t + d})
        if sp == "NARRATOR":
            txt = "{\\rNarr}" + line["khmer"]
        else:
            name, col = SPEAKERS[sp]
            txt = "{\\rName\\3c" + col + "\\4c" + col + "}" + name + "  " + mg.speak_bars("#FFFFFF", d) + "\\N{\\rSub}" + line["khmer"]
        events.append(("Sub", t - 0.05, t + d + 0.3, txt))
        t += d + GAP
    t += TAIL - GAP
    events.append(("Cap", start + 0.3, t - 0.3, sc["caption"]))
    segments.append((f"img/scene{si}.jpg", start, t - start, "scene"))
    tl["scenes"].append({"start": start, "end": t, "lines": sc_lines})

cd = dur("audio/closing.wav")
outro = 0.8 + cd + 2.6
segments.append(("img/scene8.jpg", t, outro, "card"))
clips.append(("audio/closing.wav", t + 0.8))
events.append(("Title", t + 0.4, t + outro - 0.2, s["closing"]))
events.append(("Brand", t + 0.4, t + outro - 0.2, "AI For Business"))
tl["outro"] = (t, t + outro)
t += outro
TOTAL = t
print(f"total {TOTAL:.1f}s, {len(segments)} segments, {len(clips)} voice clips")

# ---------- subtitles (ASS) ----------
ass = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sub,Battambang,50,&H00FFFFFF,&H00FFFFFF,&H50201A14,&H50201A14,0,0,0,0,100,100,0,0,3,16,0,2,170,170,56,1
Style: Narr,Battambang,50,&H00A8F0FF,&H00A8F0FF,&H50201A14,&H50201A14,0,0,0,0,100,100,0,0,3,16,0,2,170,170,56,1
Style: Name,Battambang,34,&H00FFFFFF,&H00FFFFFF,&H00888888,&H00888888,1,0,0,0,100,100,0,0,3,10,0,2,170,170,56,1
Style: Cap,Moul,40,&H00FFFFFF,&H00FFFFFF,&H30306E1B,&H30306E1B,0,0,0,0,100,100,0,0,3,16,0,7,60,60,48,1
Style: Brand,Battambang,40,&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,1,0,0,0,100,100,2,0,1,2,2,2,60,60,300,1
Style: Title,Moul,76,&H00FFFFFF,&H00FFFFFF,&H00303030,&H90000000,0,0,0,0,100,100,0,0,1,4,4,5,160,160,0,1
Style: MG,Battambang,28,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1
Style: MGBox,Battambang,26,&H00FFFFFF,&H00FFFFFF,&H00FFFFFF,&H00FFFFFF,1,0,0,0,100,100,0,0,3,14,0,7,0,0,0,1
Style: Mark,Battambang,28,&H60FFFFFF,&H60FFFFFF,&H90000000,&H90000000,1,0,0,0,100,100,1,0,1,1,1,9,50,50,50,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
for style, a, b, txt in events:
    fade = {"Title": "{\\an5\\move(960,590,960,540,0,600)\\fad(500,300)}",
            "Brand": "{\\fad(700,300)}",
            "Cap": "{\\clip(0,0,0,200)\\t(0,650,\\clip(0,0,1400,200))\\fad(0,300)}"}.get(style, "{\\fad(120,120)}")
    if style == "Brand": a += 1.2
    ass += f"Dialogue: 1,{ts(a)},{ts(b)},{style},,0,0,0,,{fade}{txt}\n"
first_scene = segments[1][1]; last_end = segments[-1][1]
ass += f"Dialogue: 0,{ts(first_scene)},{ts(last_end)},Mark,,0,0,0,,{{\\fad(500,500)}}AI For Business\n"
ass += "\n".join(mg.build(tl, json.load(open("mg_labels.json")))) + "\n"
os.makedirs("build", exist_ok=True); os.makedirs(os.path.dirname(OUT) or ".", exist_ok=True)
open("build/subs.ass", "w").write(ass)

# ---------- voice track ----------
RATE = 24000
buf = bytearray(int(TOTAL * RATE) * 2)
for f, at in clips:
    with wave.open(f) as w:
        assert w.getframerate() == RATE and w.getnchannels() == 1 and w.getsampwidth() == 2, f
        data = w.readframes(w.getnframes())
    o = int(at * RATE) * 2
    buf[o:o + len(data)] = data
with wave.open("build/voice.wav", "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE); w.writeframes(bytes(buf))

def run(cmd):
    subprocess.run(cmd, check=True)

# ---------- preview stills ----------
if PREVIEW:
    if PREVIEW == "auto":
        times = [2.6]
        for sc in tl["scenes"]:
            ln = sc["lines"]
            times += [ln[0]["start"] + 3.0, ln[1]["start"] + 2.6, ln[-1]["start"] + 2.2]
        times += [tl["outro"][0] + 3.5, tl["scenes"][3]["start"] - 0.05]
    else:
        times = list(map(float, PREVIEW.split(",")))
    for i, at in enumerate(times):
        seg = max((sg for sg in segments if sg[1] <= at), key=lambda sg: sg[1])
        vf = "scale=1920:1080"
        if seg[3] == "card":
            vf += ",boxblur=12:2,eq=brightness=-0.12:saturation=1.1"
        vf += f",setpts=PTS+{at}/TB,subtitles=build/subs.ass:fontsdir={FONTS}"
        run(["ffmpeg", "-loglevel", "error", "-y", "-i", seg[0], "-vf", vf, "-frames:v", "1", f"build/preview_{i}.jpg"])
    sys.exit()

# ---------- video segments with slow camera motion ----------
parts = []
for n, (img, start, length, kind) in enumerate(segments):
    frames = int(round(length * FPS))
    out = f"build/seg{n:02d}.mp4"
    if kind == "card":
        vf = (f"scale=3840:-2,zoompan=z='1.04+0.04*on/{frames}':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d={frames}:s={W}x{H}:fps={FPS},"
              "boxblur=12:2,eq=brightness=-0.12:saturation=1.1")
    elif n % 2:
        vf = f"scale=3840:-2,zoompan=z='1+0.10*on/{frames}':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d={frames}:s={W}x{H}:fps={FPS}"
    else:
        vf = (f"scale=3840:-2,zoompan=z='1.10':x='(iw-iw/zoom)*on/{frames}':y='ih/2-ih/zoom/2':d={frames}:s={W}x{H}:fps={FPS}")
    if n == 0: vf += ",fade=t=in:st=0:d=0.5"
    if n == len(segments) - 1: vf += f",fade=t=out:st={length - 0.6:.3f}:d=0.6"
    vf += ",format=yuv420p"
    run(["ffmpeg", "-loglevel", "error", "-y", "-i", img, "-vf", vf, "-frames:v", str(frames),
         "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-r", str(FPS), out])
    parts.append(out); print("segment", n, f"{length:.1f}s", flush=True)
open("build/list.txt", "w").write("".join(f"file '{os.path.basename(p)}'\n" for p in parts))
run(["ffmpeg", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", "build/list.txt", "-c", "copy", "build/video.mp4"])

# ---------- final: subtitles + voice + music ----------
md = dur("audio/music.mp3")
music = "[2:a]volume=0.13[m0]" if md >= TOTAL else "[2:a]asplit[ma][mb];[ma][mb]acrossfade=d=4,volume=0.13[m0]"
af = (f"{music};[m0]atrim=0:{TOTAL:.2f},afade=t=in:d=1.5,afade=t=out:st={TOTAL - 3:.2f}:d=3[m];"
      "[1:a]aresample=48000,volume=1.6[v];[v][m]amix=inputs=2:duration=first:normalize=0,"
      "loudnorm=I=-14:TP=-2.5:LRA=11,aresample=192000,alimiter=limit=0.75:level=false,aresample=48000[a]")
inputs = ["-i", "build/video.mp4", "-i", "build/voice.wav", "-i", "audio/music.mp3"]
run(["ffmpeg", "-loglevel", "error", "-y", *inputs,
     "-filter_complex", f"[0:v]subtitles=build/subs.ass:fontsdir={FONTS}[vo];{af}",
     "-map", "[vo]", "-map", "[a]", "-c:v", "libx264", "-preset", "slow", "-crf", "24", "-tune", "animation", "-pix_fmt", "yuv420p",
     "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-t", f"{TOTAL:.2f}", OUT])
print("done", OUT)
