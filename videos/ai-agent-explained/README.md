# What Is an AI Agent? — 60-second motion graphic explainer

A narrated, fully animated 60-second explainer built with [HyperFrames](https://github.com/heygen-com/hyperframes) (HTML → video).

**Final video:** `renders/what-is-an-ai-agent.mp4` (1920×1080, 60 fps, H.264 + AAC)
**Subtitles:** `renders/what-is-an-ai-agent.srt`

## Story

| Time | Chapter | What happens |
| --- | --- | --- |
| 0:00 | 01 · The question | A chat window: you ask, it answers. "But what if AI could do more than answer?" The words collapse into a spark. |
| 0:10 | 02 · Definition | The spark ignites into the **agent core**. "AI agent" — understands your goal, makes a plan, takes action on its own. |
| 0:18 | 03 · How it works | The agent loop: **Perceive → Reason → Act → Learn**, with a comet tracing the ring and a live panel for each step. The loop spins until the job is done. |
| 0:46 | 04 · In practice | "Prepare our weekly sales report" → collect data, build charts, write summary, email the team. |
| 0:54 | Close | "A chatbot talks. An AI agent works." — AI For Business. |

## Production

- **Narration:** Kokoro-82M (voice `af_heart`), generated sentence by sentence. The ONNX model's internal duration-predictor output is exposed as an extra graph output, which gives exact per-word timings. Every animation beat is keyed to those word times (`assets/vo-timing.js`).
- **Music:** an original score in D minor at 108 BPM (Dm9 – B♭maj7 – Fadd9 – Csus2), synthesized in `tools/audio_mix.py`: supersaw pads with filter automation, additive plucked arpeggio, sub bass, drums, bell lead and a FluidSynth piano. The drop lands on the agent's ignition and the drums stop on "A chatbot talks."
- **Sound design:** typing, UI clicks, pops, whooshes, risers, impacts and chimes, each placed on the same narration clock as the visuals.
- **Mix:** voice is de-essed and EQ'd. Music is ducked about 7 dB under speech. The master uses a look-ahead peak limiter and is set to −14 LUFS integrated, −1.5 dBFS peak.
- **Visuals:** one HyperFrames composition (`index.html`) with a single GSAP timeline, a canvas particle network, film grain, and local fonts (Inter Tight, Instrument Serif, JetBrains Mono).

## Rebuild

```bash
# 1. narration (needs kokoro-onnx + the timed model; see tools/tts.py)
python3 tools/tts.py <models-dir>
python3 tools/timeline.py && python3 tools/timing_js.py
# 2. score, sound design and mix → assets/audio/mix.wav
python3 tools/audio_mix.py
# 3. validate and render
npx hyperframes lint && npx hyperframes check
npx hyperframes render --fps 60 --quality high --workers 4 --output master.mp4
# delivery encode (film grain makes CRF files very large; two-pass keeps it under 90 MB)
ffmpeg -i master.mp4 -c:v libx264 -preset slow -tune film -b:v 11500k -pass 1 -an -f mp4 /dev/null
ffmpeg -i master.mp4 -c:v libx264 -preset slow -tune film -b:v 11500k -pass 2 -movflags +faststart -c:a copy renders/what-is-an-ai-agent.mp4
```

`<models-dir>` must contain `kokoro-v1.0-timed.onnx` and `voices-v1.0.bin`. Build the timed model from the release `kokoro-v1.0.onnx` ([kokoro-onnx releases](https://github.com/thewh1teagle/kokoro-onnx/releases)) by adding an `Identity` node that exposes `/encoder/Clip_output_0` as a graph output named `duration`.
