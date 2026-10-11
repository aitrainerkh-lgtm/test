# The 80/20 Rule at Work (Khmer explainer, 120 s)

A two-minute motion-graphics explainer for Cambodian business audiences, built with HyperFrames.
Gemini writes the Khmer script and voices it with **Kore** on **Gemini 3.8 Flash TTS**.
The visuals are animated shapes, icons, text, charts and transitions only. There is no generated video and no stock footage.

## What you need

- `GEMINI_API_KEY` set in the environment (in a cloud session, add it in the environment settings, then start a new session).
- Node 22+, FFmpeg, and the HyperFrames render browser: `npx hyperframes browser ensure`.

## Make the video

```bash
npm install
npm run make      # Gemini script -> Kore narration -> fit to timing -> build -> check
npm run dev       # optional: preview in HyperFrames Studio
npm run render    # renders/80-20-rule-at-work-km.mp4
```

`npm run make` runs three steps you can also run one at a time:

1. `npm run script` (`gemini/generate-script.mjs`)
   - Measures the real speaking rate of Kore in Khmer: Gemini writes a short Khmer sample, Kore reads it, and the audio is timed. No English word-count estimate is used.
   - Gives Gemini a character budget per narration segment from that measured rate, then asks for the full script as JSON (`gemini/script-prompt.md` holds every content rule from the brief).
   - Checks the result (`gemini/schema.mjs`) and sends any problems back to Gemini to fix, up to 3 times.
2. `npm run narrate` (`gemini/narrate.mjs`)
   - Voices every segment with Kore and measures it.
   - Any scene more than 5% (minimum 0.5 s) off its target is rewritten by Gemini to the measured length, then voiced again (up to 3 rounds).
   - Writes `assets/narration.wav`, `script/timing.json` and a readable `SCRIPT.md` with timecodes.
3. `npm run build` (`build/build-composition.mjs`)
   - Builds `index.html`. Each visual beat is placed on the measured start time of its narration segment. Subtitles are timed inside each segment.

## Models

| Use | Model | Override |
|---|---|---|
| Narration | Gemini 3.8 Flash TTS, voice Kore | `GEMINI_TTS_MODEL`, `GEMINI_VOICE` |
| Script | Newest Gemini Pro model on the key | `GEMINI_TEXT_MODEL` |

If Gemini 3.8 Flash TTS is not available on the key, the run stops and lists the TTS models that are. It never switches model on its own.

## Content checks (run on every Gemini answer)

- Every on-screen string is Khmer-led, within its length limit, with no emoji.
- No AI tool is named (the video is not an AI tool advertisement).
- Share charts add up to exactly 100. Each highlighted group is a minority of items.
- Every number in the narration or on screen exists in that example's chart data, or is the sum or share of its highlighted items.
- Example 2 never mentions profit (it is about sales).
- At most one example may be exactly 80/20.
- Each chart shows the Khmer "illustrative example" label.

## Scenes

| Scene | Target | Visual |
|---|---|---|
| Hook | 8 s | Task cards pile up around a racing clock, then the question |
| Problem | 12 s | "Busy" bar fills, "progress" bar barely moves; 10 blocks, 2 gold, feed an 80% result bar; ≈ badge with 70/30, 80/20, 90/10 |
| Example 1: tasks | 19 s | Bars of each activity's share of one clear result; top items turn gold |
| Example 2: customers or products | 19 s | Pareto chart of sales share with a cumulative line |
| Example 3: repetitive work | 19 s | Most common questions link to an approved Template card |
| Example 4: workspace | 19 s | Tools sort into "within reach" and "stored away"; distraction bars shrink |
| Summary | 14 s | Four action cards, one per narration line |
| Closing | 10 s | Two "1 thing today" cards, then the AI For Business end card |

Each example shows its four steps (situation, what to measure, action, benefit) on the left, lighting up as the narration reaches each one.

## Layout test

`npm run test:layout` builds the composition from filler Khmer text at the maximum allowed lengths with silent audio, then runs `hyperframes check`. It overwrites `index.html`, so run `npm run build` afterwards. `test/mock-gemini.mjs` is a local stand-in for the Gemini API, used to dry-run the pipeline without a key.

Typography follows the house Khmer standard: Moul for H1/H2 titles only, Battambang for everything else. Fonts and GSAP are bundled locally, so the render needs no network.
