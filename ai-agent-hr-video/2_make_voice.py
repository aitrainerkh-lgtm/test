"""Step 2: turn each scene's Khmer narration into speech with Gemini TTS -> audio/*.wav"""
import json
import os
import sys
import wave

from gemini_api import generate_speech

MODEL = os.environ.get("TTS_MODEL", "gemini-3.1-flash-tts-preview")
VOICE = os.environ.get("TTS_VOICE", "Kore")
HERE = os.path.dirname(os.path.abspath(__file__))
AUDIO_DIR = os.path.join(HERE, "audio")

STYLE = ("Read the following Khmer text aloud in Khmer, as a warm, clear and "
         "professional corporate video narrator, at a natural, steady pace:\n\n")


def save_wav(path, pcm, rate=24000):
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(pcm)


def main():
    only = set(sys.argv[1:])
    os.makedirs(AUDIO_DIR, exist_ok=True)
    with open(os.path.join(HERE, "script.json"), encoding="utf-8") as f:
        script = json.load(f)
    for i, scene in enumerate(script["scenes"]):
        if only and scene["key"] not in only:
            continue
        path = os.path.join(AUDIO_DIR, f"{i:02d}_{scene['key']}.wav")
        if os.path.exists(path) and not only:
            continue
        pcm, mime = generate_speech(MODEL, STYLE + scene["narration"], VOICE)
        rate = 24000
        if pcm[:4] == b"RIFF":  # some models return a full WAV file
            import io
            with wave.open(io.BytesIO(pcm)) as w:
                rate, pcm = w.getframerate(), w.readframes(w.getnframes())
        elif mime and "rate=" in mime:
            rate = int(mime.split("rate=")[1].split(";")[0])
        save_wav(path, pcm, rate)
        print(f"{path}  {len(pcm) / 2 / rate:.1f}s  ({mime})")


if __name__ == "__main__":
    main()
