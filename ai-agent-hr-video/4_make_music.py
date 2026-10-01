"""Step 4: Gemini (Lyria) creates instrumental background music -> audio/music.mp3"""
import base64
import os

from gemini_api import generate

MODEL = os.environ.get("MUSIC_MODEL", "lyria-3-pro-preview")
HERE = os.path.dirname(os.path.abspath(__file__))

PROMPT = (
    "Instrumental corporate technology background music for a 75-second company video about AI and "
    "teamwork. Modern, warm and optimistic: light piano, soft synth pads, gentle plucks and a calm, "
    "steady beat at about 100 BPM. Clean and uncluttered so a voice-over stays clear. Builds gently, "
    "ends with a soft resolved outro. No vocals, no lyrics."
)


def main():
    result = generate(MODEL, {"contents": [{"role": "user", "parts": [{"text": PROMPT}]}]})
    for part in result["candidates"][0]["content"]["parts"]:
        if "inlineData" in part:
            path = os.path.join(HERE, "audio", "music.mp3")
            with open(path, "wb") as f:
                f.write(base64.b64decode(part["inlineData"]["data"]))
            print("saved", path)
            return
    raise SystemExit("No music returned")


if __name__ == "__main__":
    main()
