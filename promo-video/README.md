# AI For Business — Promo Video (Remotion)

Vertical promo video for the AI For Business live training.
**1080 × 1920 · 60 fps · 40 seconds · MP4 (H.264)**

## 1. Install (one time)

You need Node.js 18 or newer and FFmpeg.

```bash
cd promo-video
npm install
```

## 2. Add your files to `public/`

| File | Used for | If missing |
|---|---|---|
| `public/logo.png` | Logo in Title, Offer and Close scenes | Clean text logo "AI For Business" |
| `public/hook.jpg` | Top photo in the Hook scene | Illustrated shop scene |
| `public/qr.png` | QR code in the Close scene | QR code that opens the Telegram link in `config.ts` |
| `public/voiceover.mp3` | Khmer voiceover | Silent, scenes use the timings in `config.ts` |
| `public/music.mp3` | Background music (about -20 dB under the voice) | No music |
| `public/fonts/Khmer OS Muol Light.ttf` | Big Khmer headings | Moul (Google Fonts, already included) |
| `public/fonts/Khmer OS Battambang.ttf` | Khmer body text and captions | Battambang (Google Fonts, already included) |
| `public/icons/chatgpt.png`, `claude.png`, `gemini.png`, `copilot.png` | Official AI tool icons on the pedestals | Built-in brand-coloured icons |

File names for fonts are flexible: any `.ttf`/`.otf` in `public/fonts/` with "Muol" or "Battambang" in its name is used.

## 3. Sync to the voiceover

After you add `public/voiceover.mp3`:

```bash
npm run assets   # finds your files
npm run sync     # finds the 10 voice lines and sets scene timing + karaoke captions
```

`npm run sync` looks for the pauses between the 10 lines of the script. It prints a table of start/end times.
If the voice has few clear pauses, adjust detection:

```bash
npm run sync -- --noise=-30 --pause=0.2
```

You can also type exact times (seconds) into `src/generated/voice-timing.json`.
When synced, each scene starts just before its voice line, and the video length follows the voiceover.

## 4. Preview and render

```bash
npm run studio   # live preview in the browser
npm run render   # writes out/promo.mp4
```

Render command (same as `npm run render`):

```bash
npx remotion render PromoVideo out/promo.mp4
```

## 5. Change text, prices, dates

Everything you may want to edit is in **`src/config.ts`**:
course name, Telegram handle, date, time, venue, price, old price, bonus, all Khmer lines,
the mock-up data (shop name, items, prices), the voiceover script (karaoke captions) and the scene timings.

- `*word*` puts the lime highlight bar under a word.
- `\n` forces a new line in a big heading.
- `✓ ✦ →` are drawn as clean icons.
- In the voiceover lines, put `|` between Khmer words if the karaoke splits a word in the wrong place.

After editing, run `npm run render` again.

## Project structure

```
promo-video/
├── public/              your files + fonts
├── scripts/
│   ├── check-assets.mjs     finds your files (runs before studio/render)
│   └── sync-voiceover.mjs   voiceover → scene timing
└── src/
    ├── config.ts            ALL editable text and timing
    ├── Video.tsx            scene order, audio, captions
    ├── timeline.ts          scene timing (config or voiceover)
    ├── scenes/              Hook, Title, UseAI, Build (4 cards), MoreTools, Offer, Close
    └── components/          karaoke captions, icons, highlight text, UI parts
```

## Licence note

Remotion is free for individuals and companies with up to 3 employees.
Larger companies need a Remotion company licence: https://www.remotion.dev/license
