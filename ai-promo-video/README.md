# AI For Business — Vertical Promo Video (Remotion)

1080 × 1920 · 60 fps · 40 seconds · MP4 (H.264)

## Quick start

```bash
cd ai-promo-video
npm install
npm run dev        # opens Remotion Studio to preview
npm run render     # renders out/promo.mp4
```

Render command (same as `npm run render`):

```bash
npx remotion render PromoVideo out/promo.mp4
```

## Change text, price, dates, contact

Edit **`src/config.ts` only**. Everything on screen comes from that file:

| What | Where in config.ts |
|---|---|
| Hook headline (Khmer) | `hook.headlineKh` |
| Course title, pills | `title` |
| AI tools + learning chips | `useAI.tools` |
| 4 mockups (shop name, numbers, chat text) | `build` |
| 12 tool tiles | `moreTools.tiles` |
| Duration, dates, time, delivery, price, bonus, CTA | `offer` |
| Scan line, Telegram handle | `close` |
| Karaoke captions + timing | `captions.lines` |
| Scene timings | `scenes` |

Text rules:
- `[[word]]` adds the lime highlight bar under that word.
- In captions, `|` is an invisible word break (for Khmer). A normal space shows as a space.
- Caption tokens `{price}`, `{durationKh}`, `{telegram}` are filled from `offer` and `close`.
- `offer.bonus`: set a text like `'FREE Prompt Pack'` to show the round lime badge, or `null` to hide it.

## Add your files

Put these in the `public/` folder. Names must match `config.assets`.

| File | Used for | If missing |
|---|---|---|
| `logo.png` | Logo in title, offer and close scenes | Built-in "AI For Business" wordmark |
| `hook.jpg` | Top half of scene 1 | Built-in illustration |
| `qr.png` | Close scene QR | QR generated from `close.qrFallbackUrl` |
| `voiceover.mp3` | Khmer voiceover | Silent |
| `music.mp3` | Background music (loops, fades in/out) | Silent |
| `fonts/KhmerOSMuolLight.ttf` | Khmer headings | Google Font **Moul** (included) |
| `fonts/KhmerOSBattambang.ttf` | Khmer body + captions | Google Font **Battambang** (included) |
| `icons/chatgpt.png`, `claude.png`, `gemini.png`, `copilot.png` | Scene 3 tool icons | Built-in 3D-style icons |

No code change is needed. The video picks up the files automatically on the next preview or render.

## Sync to your voiceover

1. Add `public/voiceover.mp3`.
2. Open `npm run dev` and play with sound.
3. Change `scenes` start/end times so each scene matches the voice.
4. Change each caption line's `start` / `end` to match.
5. For exact word-by-word karaoke, add `wordStarts` (one time in seconds per word) to a caption line, for example:

```ts
{start: 0.2, end: 3.9, text: 'ចង់|ប្រើ AI ហើយ|បង្កើត Tools', wordStarts: [0.2, 0.5, 0.8, 1.2, 1.6, 2.0]}
```

Without `wordStarts`, words are spread evenly across the line.

## Project structure

```
src/
  config.ts          <- all editable content
  Promo.tsx          main timeline (scenes, captions, audio)
  scenes/            Hook, Title, UseAI, Build (+ build/ mockups), MoreTools, Offer, Close
  components/        highlight bar, pills, captions, icons, QR, logo, scene transition
public/fonts/        bundled Plus Jakarta Sans, Moul, Battambang (offline rendering)
```
