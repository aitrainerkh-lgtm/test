# AI Agents for HR: 1-Minute Khmer Video

Vertical video (1080x1920) for Facebook Reels, TikTok and Telegram. Khmer voice-over, 8 scenes, AI For Business branding.

## What is in this folder

| File | Purpose |
|---|---|
| `scenes.json` | Khmer voice script and on-screen text for each scene |
| `slides/` | The 8 finished slides |
| `build_video.py` | Makes the Khmer voice and builds the final MP4 |
| `render_slides.py` | Re-draws the slides if the on-screen text changes |
| `fonts/` | Moul and Battambang (Khmer), Poppins (English) |

## Build the video on the Mac

```
cd ~/Documents/AI_HR_Video
python3 -m pip install edge-tts imageio-ffmpeg
python3 build_video.py
```

Output:
- `AI_Agents_for_HR_Khmer.mp4`: the final video
- `AI_Agents_for_HR_Khmer.srt`: Khmer subtitles to upload with the video
- `clips/`: one Khmer voice clip per scene

The voice is Microsoft `km-KH-SreymomNeural` (female). If the first recording is more than 5 seconds away from 60 seconds, the script re-records once at a faster or slower speed.

## Change the script

Edit the `voice` lines in `scenes.json`, then run `build_video.py` again. If you change `title` or `points`, run `render_slides.py` first. In a title, `|` marks a line break.
