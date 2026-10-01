# AI Agent working with the HR team (Khmer motion-graphics video)

A ~75-second 1920x1080 motion-graphics video in Khmer: on-screen Khmer text, a Khmer voice-over,
background music and transition sound effects. Everything generative is made with the Gemini API
(direct REST calls, no browser): the script, the voice, the illustrations and the music.

**Final video:** `ai_agent_hr_khmer.mp4`

## Scenes

1. Welcome: the HR team meets its new AI Agent
2. Recruitment: AI Agent screens CVs, HR makes the final decision
3. Interview scheduling and Email invitations
4. Onboarding checklist for new staff
5. Answering staff questions through Chat
6. Leave requests and attendance, sent to the department head for approval
7. HR Report and payroll data for HR to review
8. Training suggestions based on role and skills
9. Closing: AI Agent handles repetitive work, people stay in control

## Look and motion

- One Gemini illustration per scene (premium 3D style, same office, same glowing AI Agent orb)
- Slow camera moves (zoom and pan) on every scene
- Branded diagonal wipe (orange, green, navy) between scenes, with a whoosh sound
- Khmer title (Moul) and animated point labels (Battambang)
- Frosted-glass "AI Agent" card with a small animation for each task
- Khmer subtitles that highlight phrase by phrase in time with the voice
- Instrumental music that dips under the voice automatically

## How to rebuild

Requirements: Python 3, `ffmpeg`, `pip install pillow numpy`.

```bash
export GEMINI_API_KEY=your-key-here
python3 1_write_script.py    # Gemini writes the Khmer script        -> script.json
python3 2_make_voice.py      # Gemini TTS reads each scene            -> audio/00_intro.wav ...
python3 3_make_images.py     # Gemini draws one image per scene       -> images/*.jpg
python3 4_make_music.py      # Gemini (Lyria) makes background music  -> audio/music.mp3
python3 5_render_video.py    # animation + voice + music + effects    -> ai_agent_hr_khmer.mp4
```

- Edit `script.json` by hand to change any Khmer wording, then re-run steps 2 and 5.
- Re-make one item only: `python3 2_make_voice.py chat` or `python3 3_make_images.py chat`
- Preview frames without rendering the video: `python3 5_render_video.py --stills 5 20 40`
- Options: `TTS_VOICE` (default `Kore`), `TTS_MODEL` (default `gemini-3.1-flash-tts-preview`),
  `SCRIPT_MODEL` (default `gemini-3.1-pro-preview`), `IMAGE_MODEL` (default `gemini-3-pro-image`),
  `MUSIC_MODEL` (default `lyria-3-pro-preview`), `VOICE_TEMPO` (default `1.08`).

Fonts: Moul (headings) and Battambang (body), downloaded from Google Fonts on first run.
