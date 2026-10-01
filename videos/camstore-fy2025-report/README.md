# CamStore 365 — FY2025 Financial Report (60s motion graphic)

A 60-second narrated motion-graphics briefing built with [HyperFrames](https://hyperframes.heygen.com).
Source: *FY Management Briefing* (CamStore 365, FY2025, Khmer).

- **Output:** `renders/camstore-fy2025-report.mp4` (1920×1080, 60 fps, H.264 + AAC, 60.0 s)
- **Audio master:** -14.3 LUFS integrated, -1.6 dBTP (web/social standard)

## Narration script

| Time | Scene | Voiceover |
| --- | --- | --- |
| 0:00 | Title | CamStore 365. Twenty twenty-five, in numbers. |
| 0:05 | 01 Revenue | Revenue reached $420,000, up 34.6% on last year. |
| 0:11 | 02 Profit & loss | Gross profit: $168,000. A 40% margin. After costs and tax, net profit came to $33,600. Eight cents on every dollar. |
| 0:24 | 03 Monthly revenue | Sales follow the seasons. A quiet February. A Khmer New Year lift in April. And a peak in December. |
| 0:31 | 04 Revenue by channel | Retail brings in half of our revenue. Wholesale, 40%. Online, 10. |
| 0:36 | 05 Costs & margin | But costs are climbing faster than sales. Salaries, rent and marketing take nearly 70% of spending, and net margin slipped from 8.7 to 8%. |
| 0:47 | 06 Next steps | Our three priorities. Tighten stock control. Protect our margin. And confirm our tax status with the GDT. |
| 0:55 | Close | Strong growth. Now, smarter growth. |

## Figures used (all from the briefing)

Revenue $420,000 · Gross profit $168,000 (40%) · Operating costs $126,000 · Profit before tax $42,000 ·
Tax (20%, estimate) $8,400 · Net profit $33,600 (8.0%) · FY2023 $228,000 / FY2024 $312,000 (+34.6%) ·
Feb $29,400 · Apr $40,320 · Dec $46,200 · Retail 50% / Wholesale 40% / Online 10% ·
Salaries $52,000 · Rent $24,000 · Marketing $11,000 · Net margin 8.7% → 8.0% · Inventory +45%, losses $8,000.

Derived on screen: cost of sales $252,000 (420 − 168), monthly average $35,000 (420 ÷ 12),
top-3 costs = 69% of operating costs (87 ÷ 126), all other costs $39,000.
Unlabelled monthly bars follow the briefing's chart shape and sum to the annual total.

## Production

- **Composition:** `index.html` — one GSAP timeline, 8 scenes, cuts on a 96 BPM beat grid.
- **Design:** warm ink background, terracotta / olive / gold palette from the briefing deck,
  Fraunces (display) + Inter (text) + JetBrains Mono (labels), film grain, light sweeps, odometer counters.
- **Voice:** Kokoro-82M (`af_heart`), generated phrase by phrase (`production/audio/tts.py`), timeline in `vo_timeline.json`.
- **Music:** original score (`production/audio/compose.py`) — sampled grand piano and harp, synth pads, bass, drums.
- **Mix:** `production/audio/mix.py` — voice EQ/compression, music ducking under speech, SFX on cuts, -14 LUFS master.

Re-render:

```bash
npx hyperframes@0.8.105 check
npx hyperframes@0.8.105 render --quality high --fps 60 --crf 19 --output renders/camstore-fy2025-report.mp4
```

## Credits

- Salamander Grand Piano V3 — Alexander Holm, CC BY 3.0 (via Tone.js audio)
- Harp samples — tonejs-instruments (N. Brosowsky), CC BY 3.0
- Sound effects — Pixabay Content License (bundled with HyperFrames)
- Fonts — Fraunces, Inter, JetBrains Mono (SIL Open Font License)
- Voice — Kokoro-82M (Apache 2.0)
