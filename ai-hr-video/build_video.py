"""Build the ~1 minute Khmer video "AI Agents for HR".

Steps:
  1. Make one Khmer voice clip per scene (Microsoft neural voice via edge-tts).
  2. If the total length is far from the target, adjust the speaking rate once.
  3. Turn each slide into a short clip with a slow zoom, and add its voice clip.
  4. Join all clips into one MP4 and write Khmer subtitles (.srt).

Setup (once):  python3 -m pip install edge-tts imageio-ffmpeg
Run:           python3 build_video.py
Test without voice (silent timing only):  python3 build_video.py --no-voice
"""
import argparse
import asyncio
import json
import pathlib
import subprocess
import wave

import imageio_ffmpeg

HERE = pathlib.Path(__file__).parent
CLIPS = HERE / "clips"
BUILD = HERE / "build"
OUT_NAME = "AI_Agents_for_HR_Khmer"

FPS = 30
LEAD_IN = 0.3   # seconds of silence before each voice line
TAIL = 0.5      # seconds of silence after each voice line
FADE = 0.25
MAX_RATE = 20   # never speed up or slow down the voice by more than this percent

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


def run(args):
    subprocess.run([FFMPEG, "-hide_banner", "-loglevel", "error", "-y", *args], check=True)


def seconds(audio_path):
    """Exact audio length, by decoding to WAV."""
    wav = BUILD / "measure.wav"
    run(["-i", str(audio_path), "-ac", "1", "-ar", "24000", str(wav)])
    with wave.open(str(wav)) as w:
        return w.getnframes() / w.getframerate()


async def speak(text, voice, rate, path):
    import edge_tts
    await edge_tts.Communicate(text, voice, rate=rate).save(str(path))


def make_voice(scenes, voice, rate):
    CLIPS.mkdir(exist_ok=True)
    for s in scenes:
        path = CLIPS / f"{s['id']}_narrator.mp3"
        asyncio.run(speak(s["voice"], voice, rate, path))
        s["audio"] = path
        s["speech"] = seconds(path)
        print(f"  {s['id']}: {s['speech']:.1f}s")


def make_silence(scenes):
    """Stand-in audio for --no-voice, timed at roughly 11 Khmer characters per second."""
    CLIPS.mkdir(exist_ok=True)
    for s in scenes:
        s["speech"] = max(2.5, len(s["voice"]) / 11)
        path = CLIPS / f"{s['id']}_silent.m4a"
        run(["-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", f"{s['speech']:.2f}", str(path)])
        s["audio"] = path


def total_length(scenes):
    return sum(s["speech"] + LEAD_IN + TAIL for s in scenes)


def scene_clip(s, index):
    dur = s["speech"] + LEAD_IN + TAIL
    frames = round(dur * FPS)
    out = BUILD / f"{index:02d}_{s['id']}.mp4"
    image = HERE / "slides" / f"{s['id']}.png"
    video = (
        f"[0:v]scale=2160:3840,"
        f"zoompan=z='1+0.04*on/{frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
        f":d={frames}:s=1080x1920:fps={FPS},"
        f"fade=t=in:st=0:d={FADE},fade=t=out:st={dur - FADE:.3f}:d={FADE},format=yuv420p[v]"
    )
    delay = int(LEAD_IN * 1000)
    audio = f"[1:a]aresample=48000,adelay={delay}:all=1,apad,atrim=0:{dur:.3f}[a]"
    run(["-i", str(image), "-i", str(s["audio"]),
         "-filter_complex", f"{video};{audio}", "-map", "[v]", "-map", "[a]",
         "-t", f"{dur:.3f}", "-c:v", "libx264", "-preset", "medium", "-crf", "18",
         "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2", str(out)])
    return out, dur


def srt_time(t):
    ms = round(t * 1000)
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-voice", action="store_true", help="silent test build, no internet needed")
    args = ap.parse_args()

    data = json.loads((HERE / "scenes.json").read_text(encoding="utf-8"))
    scenes, voice, target = data["scenes"], data["voice"], data["target_seconds"]
    BUILD.mkdir(exist_ok=True)

    if args.no_voice:
        make_silence(scenes)
    else:
        print(f"Voice: {voice}, normal speed")
        make_voice(scenes, voice, "+0%")
        total = total_length(scenes)
        if abs(total - target) > 5:
            speech = sum(s["speech"] for s in scenes)
            pauses = total - speech
            change = round((speech / (target - pauses) - 1) * 100)
            change = max(-MAX_RATE, min(MAX_RATE, change))
            print(f"Total {total:.1f}s is far from {target}s; re-recording at {change:+d}% speed")
            make_voice(scenes, voice, f"{change:+d}%")

    parts, srt, t = [], [], 0.0
    for i, s in enumerate(scenes, 1):
        out, dur = scene_clip(s, i)
        parts.append(out)
        start = t + LEAD_IN
        srt.append(f"{i}\n{srt_time(start)} --> {srt_time(start + s['speech'])}\n{s['voice']}\n")
        t += dur
        print(f"  scene {i} ready ({dur:.1f}s)")

    listing = BUILD / "parts.txt"
    listing.write_text("".join(f"file '{p.name}'\n" for p in parts), encoding="utf-8")
    final = HERE / (OUT_NAME + ("_silent_test" if args.no_voice else "") + ".mp4")
    run(["-f", "concat", "-safe", "0", "-i", str(listing), "-c", "copy",
         "-movflags", "+faststart", str(final)])
    (HERE / f"{OUT_NAME}.srt").write_text("\n".join(srt), encoding="utf-8")

    print(f"\nDone: {final.name} ({t:.1f}s, 1080x1920)")
    print(f"Subtitles: {OUT_NAME}.srt")


if __name__ == "__main__":
    main()
