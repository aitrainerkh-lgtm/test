# What Is an AI Agent and How Does It Work? (60-second Khmer explainer)

Premium motion-graphic explainer built with [HyperFrames](https://hyperframes.heygen.com) (HTML + GSAP rendered to MP4).

- **Final video:** `renders/video.mp4` (1920×1080, 30 fps, 61.5 s, Khmer narration, music and sound design)
- **Script (Khmer + English meaning):** `SCRIPT.md`
- **Storyboard and shot design:** `STORYBOARD.md`
- **Brief:** `BRIEF.md`

## Project layout

| Path | What it is |
|---|---|
| `index.html` | Root timeline: shared animated background, 8 scene slots, soundtrack |
| `compositions/s1…s8-*.html` | One sub-composition per scene |
| `assets/af.js`, `assets/af.css` | Shared design system: AI Agent core, icons, cursor, glass panels, review card |
| `assets/media/` | Veo clips (employee, manager) |
| `assets/recap/` | Recap tiles for the final mosaic |
| `assets/audio/soundtrack.wav` | Final mixed soundtrack (-14 LUFS) |
| `production/` | Generation scripts and source material (see below) |

## Re-render

```bash
npx hyperframes check
npx hyperframes render --quality high --fps 30 --output renders/video.mp4
```

## Production tools (Gemini API)

The `production/` scripts read the key from the `GEMINI_API_KEY` environment variable. Never commit keys.

| Script | Purpose |
|---|---|
| `vo_gen2.py` | Khmer TTS takes (`gemini-3.8-flash-tts`, voice Charon), with length validation |
| `judge2.py` | Transcribes each take back and scores pronunciation and naturalness |
| `align_all.py` | Phrase-level timing, used to sync the animation to the narration |
| `lyria.py` | Music generation (Lyria) |
| `img.py`, `veo.py` | Still images and image-to-video for the two live-action shots |
| `mix.py` | Sound effects synthesis and the final mix (voice-led ducking, loudness mastering) |
| `audio_review.py` | AI listening review of the mix |

`selected_takes/` holds the 8 voice takes used in the film. `music_lyria_original.mp3` is the untouched music before time-stretching.
