# AI Agent ជាអ្វី? — Khmer motion-graphics explainer (60 s)

A 1920×1080, 30 fps explainer on "What is an AI Agent and how does it work?", narrated in Khmer.
Built with [HyperFrames](https://github.com/heygen-com/hyperframes): the video is an HTML/GSAP
composition rendered frame by frame to MP4.

## Story (6 scenes)

| # | Scene | What the viewer sees |
|---|-------|----------------------|
| 1 | Hook | A chatbot only answers; an AI Agent core lights up four tools and gets the work done. Title: **AI Agent** |
| 2 | Anatomy | Goal → Agent → Achieved, then the three parts: brain (AI Model), memory, tools |
| 3 | Chatbot vs AI Agent | One question, one answer vs. a goal worked through step by step to a result |
| 4 | The loop | The 4-step loop: perceive → think & plan → act (tools) → check, repeating until the goal is met |
| 5 | Example | "Set up a meeting with the client": calendar checked, free slot found, invitation sent, done |
| 6 | Close | "Your digital staff, working 24/7", then the AI For Business end card |

## Pipeline

```
tools/gemini.mjs   Gemini writes the Khmer script + on-screen labels (draft, then editor review),
                   Gemini TTS voices every line (transcribed back by Gemini to verify the read),
                   long reads are tightened automatically, Lyria RealTime composes the score
tools/timing.mjs   real voice-line durations -> scene and cue timing (targets 60 s)
tools/mix.py       voice chain + ducked music + procedural sound design, mastered to -14 LUFS
tools/build.mjs    script + timing + src/ templates -> index.html (the HyperFrames composition)
```

Fallback: if Lyria is unavailable, `tools/score.py` renders an original synthesized score.

## Commands

```bash
npm run gemini     # needs GEMINI_API_KEY: script, voice, fit, music
npm run assemble   # timing -> mix -> index.html
npm run check      # HyperFrames lint/runtime/layout checks
npm run render     # renders/ai-agent-khmer.mp4
```

Python packages: `numpy scipy soundfile pyloudnorm pedalboard google-genai`.

## Design

- Palette: deep ink navy, emerald green `#3AE6A0`, amber `#FFA53D`, blue `#5C9DFF`
- Khmer type: Moul for major titles, Battambang for body text and labels; Space Grotesk for English display words
- All fonts and GSAP are bundled locally in `assets/` so renders are deterministic and offline
