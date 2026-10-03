# CamStore 365 — FY2025 motion-graphic video

90-second 1080p video built from the 10 original FY2025 slides, with a Khmer voiceover from Gemini TTS,
Khmer captions, synthesized background music and sound effects.

- `output/CamStore365_FY2025.mp4` — final video (1920x1080, 30 fps, −16 LUFS)
- `output/captions_km.srt` — Khmer captions as a separate file
- `narration_km.json` — Khmer script: on-screen caption text and the spoken text (numbers written as Khmer words)
- `voice/` — the Gemini voice clips used in the video

## Rebuild

```bash
pip install pillow numpy scipy
export GEMINI_API_KEY=...                 # only needed to regenerate the voice
python3 src/make_voice.py                 # gemini-2.5-pro-preview-tts, voice "Kore"
python3 src/build.py                      # renders output/CamStore365_FY2025.mp4
```

To change a line: edit `narration_km.json`, run `python3 src/make_voice.py --only s05`, then `python3 src/build.py`.
Slide timing adapts to the voice length and the total stays at 90 seconds.

Fonts: Battambang, Moul and Playfair Display (SIL Open Font License, see `fonts/`).
