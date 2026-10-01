"""Step 3: Gemini generates one illustration per scene -> images/*.jpg

The first image sets the look; later scenes receive it as a style reference so the
whole video keeps the same art style, palette and AI Agent design.
Each image is checked by Gemini for unwanted text and regenerated if needed.
"""
import base64
import io
import os
import sys

from PIL import Image

from gemini_api import generate

MODEL = os.environ.get("IMAGE_MODEL", "gemini-3-pro-image")
CHECK_MODEL = os.environ.get("CHECK_MODEL", "gemini-3.5-flash")
HERE = os.path.dirname(os.path.abspath(__file__))
IMG_DIR = os.path.join(HERE, "images")

STYLE = (
    "Premium 3D animated-film style illustration for a corporate video, soft cinematic lighting, "
    "gentle depth of field, warm natural daylight, a clean modern office in Phnom Penh with plants "
    "and large windows. Colour palette: deep navy accents with fresh green (#3CB54A) and warm "
    "orange (#E8731A) highlights. Cambodian office staff in smart business attire, friendly "
    "expressions. The AI Agent is always shown the same way: a friendly glowing green holographic "
    "orb with a soft orange light accent (a smooth sphere - no face, no eyes, no robot features), "
    "floating at head height, sending thin light lines to "
    "floating holographic panels. Composition 16:9: the main subjects stand in the right half of the "
    "frame; the left side shows calm, open office space that continues the same scene naturally "
    "(one continuous image - no split screen, panels, borders or frames). "
    "Absolutely no text, letters, numbers, words or logos anywhere - screens, papers and holograms "
    "show only abstract shapes, icons and lines."
)

SCENES = {
    "intro": "Wide establishing shot: a friendly HR team of four colleagues in a bright modern office "
             "smile and greet the AI Agent orb that has just appeared above their shared desk. Morning light.",
    "recruit": "Medium shot: an HR officer at a desk reviews a floating holographic stack of candidate "
               "profile cards (portrait silhouettes and abstract lines) projected by the AI Agent orb; "
               "a few cards glow green as shortlisted. The officer looks thoughtful and in control.",
    "schedule": "Medium shot: the AI Agent orb arranges a large floating holographic weekly calendar with "
                "coloured time blocks while small glowing envelope icons fly out of it; an HR staff "
                "member holding a coffee cup watches, pleased.",
    "onboard": "Medium shot: a smiling new employee on the first day receives a welcome folder and a laptop "
               "from an HR officer; the AI Agent orb floats beside them showing a holographic checklist "
               "with green check marks.",
    "chat": "Medium shot: an employee at a desk chats on a smartphone; holographic chat bubbles float "
            "between the employee and the AI Agent orb; evening city lights in the window show it is "
            "after office hours.",
    "leave": "Medium shot: a department manager approves a request on a tablet; the AI Agent orb floats "
             "nearby showing a holographic calendar with one day highlighted in orange and a green check "
             "mark; an employee waits happily in the background.",
    "report": "Medium shot: two HR staff review a large holographic dashboard with bar charts and a donut "
              "chart (no numbers) created by the AI Agent orb; one points at the chart, collaborative mood.",
    "training": "Medium shot: an HR officer and an employee look at holographic learning-path cards with "
                "book and graduation-cap icons and progress bars suggested by the AI Agent orb; a feeling "
                "of growth and learning.",
    "outro": "Wide shot: the whole HR team stands together smiling confidently in the modern office, the "
             "AI Agent orb glowing gently above them, warm golden-hour light, teamwork and trust.",
}


def image_part(img_bytes, mime="image/jpeg"):
    return {"inlineData": {"mimeType": mime, "data": base64.b64encode(img_bytes).decode()}}


def make_image(prompt, reference=None):
    parts = []
    if reference:
        parts.append(image_part(reference))
        parts.append({"text": "Use the reference image ONLY for its art style, lighting, colour palette and "
                              "the design of the AI Agent orb. Create a completely new scene:\n"})
    parts.append({"text": f"{prompt}\n\n{STYLE}"})
    result = generate(MODEL, {
        "contents": [{"role": "user", "parts": parts}],
        "generationConfig": {"responseModalities": ["IMAGE"],
                             "imageConfig": {"aspectRatio": "16:9", "imageSize": "2K"}},
    })
    for cand in result.get("candidates", []):
        for part in cand.get("content", {}).get("parts", []):
            if "inlineData" in part:
                return base64.b64decode(part["inlineData"]["data"])
    return None


def has_text(img_bytes):
    result = generate(CHECK_MODEL, {"contents": [{"role": "user", "parts": [
        image_part(img_bytes),
        {"text": "Does this image contain any readable text, letters, words or numbers (ignore abstract "
                 "lines and icons)? Answer only YES or NO."}]}]})
    answer = "".join(p.get("text", "") for p in result["candidates"][0]["content"]["parts"])
    return "YES" in answer.upper()


def main():
    only = set(sys.argv[1:])
    os.makedirs(IMG_DIR, exist_ok=True)
    ref_path = os.path.join(IMG_DIR, "00_intro.jpg")
    for i, (key, prompt) in enumerate(SCENES.items()):
        path = os.path.join(IMG_DIR, f"{i:02d}_{key}.jpg")
        if (only and key not in only) or (not only and os.path.exists(path)):
            continue
        reference = None
        if key != "intro" and os.path.exists(ref_path):
            with open(ref_path, "rb") as f:
                reference = f.read()
        for attempt in range(3):
            data = make_image(prompt, reference)
            if data and not has_text(data):
                break
            print(f"  {key}: retry (attempt {attempt + 1})")
        if not data:
            raise SystemExit(f"No image returned for {key}")
        Image.open(io.BytesIO(data)).convert("RGB").save(path, quality=93)
        print("saved", path)


if __name__ == "__main__":
    main()
