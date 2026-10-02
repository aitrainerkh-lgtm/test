# AI For Business – Promo Video (Remotion)

Vertical promo video: 1080 x 1920, 60 fps, 40 seconds, MP4.

## Edit the content

All text, prices, dates, timing and file names are in one file:

```
src/config.ts
```

You do not need to touch the animation code.

- `[word]` puts the lime-green highlight bar under a word.
- Voiceover/karaoke lines use `|` to split Khmer words without a space.
  Remove the `|` marks and you get the exact voiceover script.
- Scene lengths: `durationSec` on each scene.

## Add your files

Put these in the `public/` folder (same names):

| File | Used in |
| --- | --- |
| `logo.png` | Title, Offer and Close scenes (already added) |
| `hook.jpg` | Scene 1 photo (top half) |
| `qr.png` | Scene 7 QR code |
| `voiceover.mp3` | Khmer voiceover |
| `music.mp3` | Background music (plays at -20 dB, loops, fades in/out) |

If a file is missing, the video still renders: the photo and QR show a
placeholder and the audio track is skipped.

Optional: to use the official Khmer OS fonts instead of the Google fallbacks
(Moul / Battambang), add `public/fonts/KhmerOSMuolLight.ttf` and
`public/fonts/KhmerOSBattambang.ttf`. If they are installed on your computer
they are also picked up automatically.

## Sync captions to the voiceover

1. Add `voiceover.mp3`, then run `npm run studio` and play the video.
2. If a scene's voice is longer or shorter than the scene, change its
   `durationSec`.
3. For each scene, set `voiceStart` / `voiceEnd` (seconds from the start of
   that scene). Caption words are spread across that window.
4. For exact word-by-word timing, add `wordTimes: [0.2, 0.5, ...]`
   (one start time per caption word, seconds from the scene start).

## Commands

```bash
npm install          # first time only
npm run studio       # preview and edit in the browser
npm run render       # renders out/ai-for-business-promo.mp4
```

Render command in full:

```bash
npx remotion render PromoVideo out/ai-for-business-promo.mp4 --codec=h264 --crf=18 --audio-codec=aac
```

## Project layout

```
src/config.ts          all editable content
src/theme.ts           colours, fonts, layout
src/Main.tsx           scene order, transitions, audio
src/scenes/            one file per scene (build/ = the four tool cards)
src/components/        captions, highlight bar, icons, cards
src/lib/timeline.ts    scene timing and karaoke word timing
public/                logo, photos, audio, fonts
```

Fonts: Plus Jakarta Sans, Moul and Battambang (SIL Open Font License,
licence files in `public/fonts`).
