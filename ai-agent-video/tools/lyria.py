#!/usr/bin/env python3
"""Generate the score with Google Lyria RealTime (Gemini API key).

The stream is steered through three sections so the music follows the film:
a sparse intro, a fuller body under the explanation, and a bright lift for
the close. Output: 48 kHz stereo WAV."""
import argparse
import asyncio
import os
import sys
import wave

SR, CH, SW = 48000, 2, 2
BASE = ("Modern cinematic technology underscore for a premium explainer video, warm analog synth pads, "
        "soft pulsing arpeggiated synths, gentle felt piano motif, deep clean sub bass, subtle electronic percussion, "
        "optimistic, inspiring, polished, instrumental, no vocals")
SECTIONS = [  # (start fraction, extra prompt, density, brightness)
    (0.00, "steady confident light groove with a gentle build, soft drums, forward arpeggio, airy pads, hopeful", 0.45, 0.62),
]
# One continuous section: mid-stream prompt changes made Lyria drop out for ~2 s.


async def run(out, duration, bpm):
    from google import genai
    from google.genai import types

    key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    client = genai.Client(api_key=key, http_options={"api_version": "v1alpha"})
    target = int(duration * SR * CH * SW)
    buf = bytearray()

    async with client.aio.live.music.connect(model="models/lyria-realtime-exp") as session:
        async def steer(idx):
            _, extra, density, bright = SECTIONS[idx]
            await session.set_weighted_prompts(prompts=[
                types.WeightedPrompt(text=BASE, weight=1.0),
                types.WeightedPrompt(text=extra, weight=0.7),
                types.WeightedPrompt(text="vocals, singing, harsh distortion, heavy metal, dubstep drops", weight=-0.8),
            ])
            await session.set_music_generation_config(config=types.LiveMusicGenerationConfig(
                bpm=bpm, density=density, brightness=bright, temperature=1.0,
                scale=types.Scale.D_MAJOR_B_MINOR))

        await steer(0)
        await session.play()
        section = 0

        async def collect():
            nonlocal section
            while len(buf) < target:
                async for msg in session.receive():
                    sc = msg.server_content
                    if sc and sc.audio_chunks:
                        for c in sc.audio_chunks:
                            buf.extend(c.data)
                        frac = len(buf) / target
                        if section + 1 < len(SECTIONS) and frac >= SECTIONS[section + 1][0]:
                            section += 1
                            await steer(section)
                        if len(buf) >= target:
                            return
                await asyncio.sleep(1e-6)

        try:
            await asyncio.wait_for(collect(), timeout=duration * 2 + 30)
        except (TimeoutError, asyncio.TimeoutError):
            print(f"lyria: timeout, got {len(buf) / (SR * CH * SW):.1f}s", file=sys.stderr)

    if len(buf) < SR * CH * SW * duration * 0.9:
        raise RuntimeError(f"Lyria returned only {len(buf) / (SR * CH * SW):.1f}s")
    with wave.open(out, "wb") as w:
        w.setnchannels(CH); w.setsampwidth(SW); w.setframerate(SR)
        w.writeframes(bytes(buf[:target]))
    print(f"lyria: wrote {out} ({min(len(buf), target) / (SR * CH * SW):.1f}s)")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--output", required=True)
    p.add_argument("--duration", type=float, required=True)
    p.add_argument("--bpm", type=int, default=100)
    a = p.parse_args()
    try:
        asyncio.run(run(a.output, a.duration, a.bpm))
    except Exception as e:  # noqa: BLE001
        print(f"lyria failed: {e}", file=sys.stderr)
        sys.exit(1)
