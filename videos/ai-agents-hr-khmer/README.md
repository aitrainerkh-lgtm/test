# AI Agents x HR Team — Khmer Video

A 3-minute explainer video (1920x1080, MP4) about AI Agents working with an HR team in a Phnom Penh office.

- **Humans:** Studio Ghibli-inspired hand-painted style (Sophea, HR Manager; Dara, HR Officer; a new employee)
- **AI Agents:** glossy 3D robots: Recruit Agent (blue), Payroll Agent (green), Onboard Agent (orange)
- **Language:** Khmer voice and Khmer on-screen text (Moul for headlines, Battambang for subtitles)

File: `ai-agents-hr-khmer.mp4` (2:59, 1920x1080, H.264 + AAC, -14 LUFS), with a motion graphics layer.
The first version (camera motion only) is in git history.

## Motion graphics layer

Animated vector graphics drawn over the scenes, with Khmer labels written by Gemini (`mg_labels.json`):

- Workflow tracker (Recruit → Payroll → Onboard) showing which AI Agent is active
- Agent status chips that come online (scene 1)
- CV screening card with scanning document, flying CVs and progress counter; shortlist with animated ticks (scene 2)
- Interview calendar filling up and invitation emails flying out (scene 3)
- Payroll bar chart growing, with a pulsing "needs review" flag (scene 4)
- "AI prepares → human decides" flow and an Approved stamp with burst (scene 5)
- Onboarding checklist ticking off and a welcome banner with confetti (scene 6)
- Staff question and AI answer chat bubbles with typing dots; complex case routed to HR (scene 7)
- Summary card: AI Agents take repetitive work, people focus on people (scene 8)
- Speaking indicator next to each speaker's name, brand-colour wipe transitions, kinetic title and closing cards

## Story (8 scenes)

1. Morning: the team greets the AI Agents
2. Recruit Agent screens CVs and presents a shortlist
3. Recruit Agent schedules interviews and sends invitations
4. Payroll Agent prepares payroll and flags items to check
5. Sophea reviews and approves: people make the final decision
6. Onboard Agent prepares the new employee's first week
7. Onboard Agent answers HR policy questions; complex cases go to HR
8. The whole team together

The full Khmer script is in `script.json`.

## How it was made (Gemini API only)

| Step | Gemini model | Script |
|---|---|---|
| Write Khmer script | `gemini-3.8-flash` | `pipeline/gen_script.py` |
| Character reference sheets | `gemini-3-pro-image` | `pipeline/gen_refs.py` |
| Scene images (using the reference sheets) | `gemini-3-pro-image` | `pipeline/gen_scenes.py` |
| Khmer voice, one clip per line | `gemini-3.8-flash-lite-tts` | `pipeline/gen_tts.py` |
| Check voice against script | `gemini-3.8-flash` | run inline |
| Background music | `lyria-3-pro-preview` | run inline |
| Motion graphics labels (Khmer) | `gemini-3.8-flash` | run inline |
| Assemble video, subtitles, audio mix | ffmpeg (libass) | `pipeline/build.py` |
| Assemble motion graphics version | ffmpeg (libass) | `pipeline/build_mg.py` + `pipeline/mg.py` |

## Run it again

```bash
export GEMINI_API_KEY=your-key        # never commit the key
mkdir -p work && cd work
mkdir -p img audio fonts              # put Moul-Regular.ttf and Battambang-*.ttf in fonts/
python3 ../pipeline/gen_script.py
python3 ../pipeline/gen_refs.py
python3 ../pipeline/gen_scenes.py
python3 ../pipeline/gen_tts.py        # set TTS_MODEL=gemini-3.8-flash-tts to use the full model
# place background music at audio/music.mp3, and title/closing narration at audio/title.wav, audio/closing.wav
python3 ../pipeline/build.py out/video.mp4             # camera-motion version
cp ../mg_labels.json . && python3 ../pipeline/build_mg.py out/video-mg.mp4   # motion graphics version
```
