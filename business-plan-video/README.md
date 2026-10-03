# Why Business Owners Need a Business Plan: Khmer motion graphics video

A 2-minute (1920×1080, 30 fps) explainer video built with [Remotion](https://www.remotion.dev/).
The narration is in Khmer and voiced with Gemini TTS (voice "Kore"). Music and sound effects are synthesized in code.

**Final video:** `out/business-plan-khmer.mp4`

## Scenes

| # | Scene | Content |
|---|-------|---------|
| 1 | Hook | Running a business without a map? Title reveal |
| 2 | What is a business plan | What / Who / How / Profit. A management tool, not just a loan document |
| 3 | Main sections | 8 sections, from Executive Summary to Risk Analysis |
| 4 | Why owners need it | Direction, decisions, cash control, measuring results |
| 5 | Stage 1: Startup | Test the idea, know customers, calculate capital, avoid costly mistakes |
| 6 | Stage 2: Operating | Workflow, roles, cash flow, monthly KPI |
| 7 | Stage 3: Growth | New branch/products, new markets, risk, budget, funding |
| 8 | Who needs it | Founders, investors, bankers/MFIs, partners, management & staff, donors/NGOs |
| 9 | Without vs with a plan | Side-by-side comparison |
| 10 | Use AI | ChatGPT, Claude, Gemini, Copilot for research, financial tables, drafts |
| 11 | Pro tip | Review the plan at least once a year |
| 12 | Outro | AI For Business end card |

## Edit and re-render

The narration text lives in `scripts/narration.json`. The on-screen visuals are in `src/scenes1.tsx` and `src/scenes2.tsx`.

```bash
npm install
export GEMINI_API_KEY=your-key            # never commit the key
rm raw/<scene>.wav                        # delete only the scenes you changed
python3 scripts/gen_tts.py                # regenerate missing narration clips
python3 scripts/gen_sfx.py                # music (not committed, 22 MB) + sound effects
python3 scripts/process_audio.py          # tighten pauses, fit to 2:00, write src/timing.json
npx remotion studio                       # preview in the browser
npx remotion render BusinessPlanVideo out/business-plan-khmer.mp4
```

`process_audio.py` speeds the voice up (pitch preserved) so the video lands exactly on `TARGET_SEC` (120 s).
It finds the pause after every narration line, so each on-screen item appears when the narrator says it.

The free Gemini tier allows about 10 TTS requests per model per day. Generate one scene per request; `gen_tts.py` caches finished clips in `raw/`.
