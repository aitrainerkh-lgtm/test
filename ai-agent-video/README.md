# What is an AI Agent? (60-second motion graphic)

A 60-second explainer built with [HyperFrames](https://www.npmjs.com/package/hyperframes)
(HTML + GSAP rendered to MP4). Everything is original: script, design, animation,
music score and sound design.

**Final video:** `renders/what-is-an-ai-agent.mp4` (1920×1080, 30 fps, AAC stereo, −14 LUFS)

## Story (6 scenes)

| # | Scene | Narration |
|---|-------|-----------|
| 1 | Hook | Ask a chatbot a question, and you get an answer. But what if AI could actually do the work for you? That's an AI agent. |
| 2 | Definition | An AI agent uses a large language model as its brain, to plan, decide, and take action toward a goal, on its own. |
| 3 | Goal | It starts with a goal. Say: find three suppliers, compare prices, and email me a summary. |
| 4 | The loop | First, the agent thinks, breaking the goal into steps. Then it acts, using tools: web search, files, email. It observes the result, and decides what to do next. Think. Act. Observe. Repeat, until the job is done. |
| 5 | Anatomy | Every agent combines four parts: a model to reason, memory for context, tools to act, and instructions to stay on track. |
| 6 | Close | Chatbots answer. Agents get work done, with you in control. → "AI For Business" end card |

## How it is built

One timing model drives both picture and sound, so re-voicing never needs hand-retiming.

```
script.json ──► tools/voice.mjs ──► vo/*.wav + vo/manifest.json   (Gemini TTS)
     │                                        │
     └──────────► tools/build.mjs ◄───────────┘
                     │  timing.json (every line, cue, caption, scene window)
                     ▼
        src/template.html ──► index.html  (HyperFrames composition)
                     │
        tools/events.mjs  ──► audio/events.json  (sound events the animation emits)
                     │
        tools/audio.py    ──► audio/mix.wav  (score + SFX + narration, mastered)
                     │
        npx hyperframes render ──► renders/*.mp4
```

- `script.json` — narration lines with inline cue markers like `[plan]`; visuals key off these cues.
- `src/template.html` — the composition: a persistent "agent core" orb travels through all scenes.
- `tools/audio.py` — original score in D minor at 100 BPM (pads, pluck arpeggio, bass, drums) with the
  downbeat landing on the title reveal; synthesised SFX; music ducked under the voice; mastered to −14 LUFS / −1 dBTP.

## Rebuild

```bash
npm install
python3 -m venv .venv && .venv/bin/pip install numpy scipy soundfile pedalboard pyloudnorm

export GEMINI_API_KEY=...            # narration (Gemini TTS, voice "Charon")
node tools/voice.mjs                  # writes vo/*.wav + vo/manifest.json
node tools/build.mjs                  # retimes everything to the real voice
node tools/events.mjs                 # exports sound events from the composition
.venv/bin/python tools/audio.py       # music + SFX + VO mix → audio/mix.wav
npx hyperframes lint
npx hyperframes render --quality high --output renders/what-is-an-ai-agent.mp4
```
