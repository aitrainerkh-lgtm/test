# AI Agent working with the HR team (Khmer motion-graphics video)

A ~73-second 1920x1080 motion-graphics video in Khmer: on-screen Khmer text and a Khmer voice-over.
The script and the voice are both made with the Gemini API (direct REST calls, no browser).

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

## How to rebuild

Requirements: Python 3, `ffmpeg`, `pip install pillow numpy`.

```bash
export GEMINI_API_KEY=your-key-here
python3 1_write_script.py   # Gemini writes the Khmer script -> script.json
python3 2_make_voice.py     # Gemini TTS reads each scene -> audio/*.wav
python3 3_render_video.py   # draws the animation + adds the voice -> ai_agent_hr_khmer.mp4
```

- Edit `script.json` by hand to change any Khmer wording, then re-run steps 2 and 3.
- Re-voice one scene only: `python3 2_make_voice.py chat`
- Preview frames without rendering the video: `python3 3_render_video.py --stills 5 20 40`
- Options: `TTS_VOICE` (default `Kore`), `TTS_MODEL` (default `gemini-3.1-flash-tts-preview`),
  `SCRIPT_MODEL` (default `gemini-3.1-pro-preview`), `VOICE_TEMPO` (default `1.08`).

Fonts: Moul (headings) and Battambang (body), downloaded from Google Fonts on first run.
