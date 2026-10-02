# AI For Business – Promo Video (Remotion)

Vertical promo video for the AI For Business live training.
1080 x 1920 · 60 fps · about 40 seconds · MP4 (H.264).

## 1. Set up (one time)

You need Node.js 18 or newer.

```bash
cd promo-video
npm install
```

## 2. Add your files

Put these files in the `public/` folder. All are optional, and the video renders without them:

| File | Used in | If missing |
|---|---|---|
| `logo.png` | Title, Offer, Close | Built-in "AI For Business" wordmark |
| `hook.jpg` | Scene 1 (top half) | Illustrated shop shelf |
| `qr.png` | Scene 7 | A working QR code to the Telegram link in `src/config.ts` |
| `voiceover.mp3` | Khmer voice | Scenes use the default 40s timing |
| `music.mp3` | Background music | No music |
| `icons/chatgpt.png`, `icons/claude.png`, `icons/gemini.png`, `icons/copilot.png` | Scene 3 | Built-in stand-in icons |

## 3. Edit the text

**All text, prices, dates, the Telegram handle and every Khmer line are in `src/config.ts`.**
You do not need to touch the animation code.

- `*word*` puts the lime highlight bar under a word.
- `\n` forces a line break.
- Totals are calculated for you (receipt total = qty x price; chat total = price x quantity).

## 4. Preview and render

```bash
npm run dev       # opens Remotion Studio in the browser for preview
npm run render    # renders out/ai-for-business-promo.mp4
```

`npm run render` first checks the `public/` folder, so after you add or change a file, render again.

## Voiceover sync

When `voiceover.mp3` is present, the render step finds the 9 pauses between the 10 spoken lines
(one line per scene, same order as `voiceover.lines` in the config). Each scene then starts with its
line, and the karaoke captions follow the voice. The video length follows the voiceover, plus 1.2s at the end.

For automatic sync to work, record the voiceover with a short pause (about half a second) between
scene lines and fewer pauses inside each line. If the detection does not match, type the start and end
second of each line in `voiceover.segments` in `src/config.ts`.

Music plays at -20 dB under the voice (`music.volumeDb`), with a fade in and fade out.

## Fonts

Plus Jakarta Sans, Moul and Battambang are bundled in `public/fonts/`.
If **Khmer OS Muol Light** and **Khmer OS Battambang** are installed on the computer that renders,
they are used first. Otherwise Moul and Battambang are used.

## Project layout

```
src/config.ts          all editable text and settings
src/scenes/            Hook, Title, UseAI, Build (4 cards), Ending (More tools, Offer, Close)
src/components/        caption, logo, labels, tool icons
src/lib/               timing, animation and Khmer text helpers
scripts/prepare.mjs    checks public/ and measures the voiceover
```
