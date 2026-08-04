// AI For Management - Corporate AI Training Program
// Split-Panel Rich-Text deck generator (AI For Business brand style).

const pptxgen = require("pptxgenjs");
const { TITLE, SLIDES } = require("./content");

const pres = new pptxgen();
pres.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
pres.layout = "WIDE";
pres.author = "AI For Business";
pres.company = "AI For Business";
pres.title = TITLE.en;

const C = {
  green: "009B4A",
  orange: "F26522",
  greenDark: "00683A",
  greenLight: "5BC489",
  orangeLight: "F8A878",
  panelVisual: "E9F6EF",
  panelText: "EDF3EF",
  cardFill: "F9FCFA",
  heading: "12382A",
  body: "2F5547",
  label: "4F6F60",
  white: "FFFFFF",
  grid: "D7E6DD",
};

const FONT = "Plus Jakarta Sans";
const KFONT = "Noto Sans Khmer";
const HALF = 13.333 / 2;

/* ---------------------------------------------------------------- helpers */

function lerpHex(a, b, t) {
  const pa = [0, 2, 4].map((i) => parseInt(a.substr(i, 2), 16));
  const pb = [0, 2, 4].map((i) => parseInt(b.substr(i, 2), 16));
  return pa
    .map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

function addBrandGradientBg(slide) {
  const N = 44;
  const W = 13.333 / N;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const color =
      t < 0.5
        ? lerpHex("E4F4EC", "FFFFFF", t * 2)
        : lerpHex("FFFFFF", "FDEDE2", (t - 0.5) * 2);
    slide.addShape(pres.ShapeType.rect, {
      x: i * W,
      y: 0,
      w: W + 0.03,
      h: 7.5,
      fill: { color },
      line: { type: "none" },
    });
  }
}

function addFooter(slide, num) {
  slide.addText(
    [
      { text: "AI For Business", options: { color: C.green, bold: true } },
      { text: "   |   " + num + " / 20", options: { color: C.label } },
    ],
    {
      x: 0.7,
      y: 7.02,
      w: 5.6,
      h: 0.3,
      fontFace: FONT,
      fontSize: 9,
      margin: 0,
      valign: "middle",
    }
  );
}

/* ------------------------------------------------------- visual renderers */

// Vertical process flow of rounded boxes with connecting arrows.
function drawFlow(slide, box, items) {
  const n = items.length;
  const gap = n <= 3 ? 0.5 : 0.34;
  const h = Math.min(1.15, (box.h - gap * (n - 1)) / n);
  const w = box.w - 0.3;
  const totalH = n * h + (n - 1) * gap;
  let y = box.y + (box.h - totalH) / 2;
  items.forEach((s, i) => {
    slide.addShape(pres.ShapeType.roundRect, {
      x: box.x + 0.15,
      y,
      w,
      h,
      rectRadius: 0.09,
      fill: { color: i % 2 ? C.orange : C.green },
      line: { type: "none" },
      shadow: { type: "outer", color: "9BB8AA", blur: 8, offset: 2, angle: 90, opacity: 0.25 },
    });
    slide.addText(s, {
      x: box.x + 0.28,
      y,
      w: w - 0.26,
      h,
      fontFace: KFONT,
      fontSize: 13,
      bold: true,
      color: C.white,
      align: "center",
      valign: "middle",
      lineSpacingMultiple: 1.25,
      margin: 0,
    });
    if (i < n - 1) {
      slide.addShape(pres.ShapeType.downArrow, {
        x: box.x + box.w / 2 - 0.13,
        y: y + h + 0.05,
        w: 0.26,
        h: gap - 0.1,
        fill: { color: C.label },
        line: { type: "none" },
      });
    }
    y += h + gap;
  });
}

// Numbered rows: circular badge + label on a soft card.
function drawNumbered(slide, box, items, start, compact) {
  const n = items.length;
  const gap = compact ? 0.08 : 0.18;
  const maxH = compact ? 0.44 : n <= 4 ? 0.95 : 0.62;
  const h = Math.min(maxH, (box.h - gap * (n - 1)) / n);
  const totalH = n * h + (n - 1) * gap;
  let y = box.y + (box.h - totalH) / 2;
  const first = start || 1;
  const kh = "០១២៣៤៥៦៧៨៩";
  const toKh = (v) => String(v).split("").map((d) => kh[+d]).join("");
  items.forEach((s, i) => {
    slide.addShape(pres.ShapeType.roundRect, {
      x: box.x,
      y,
      w: box.w,
      h,
      rectRadius: 0.07,
      fill: { color: C.cardFill },
      line: { type: "none" },
    });
    const badge = Math.min(h - 0.14, compact ? 0.36 : 0.42);
    slide.addShape(pres.ShapeType.ellipse, {
      x: box.x + 0.13,
      y: y + (h - badge) / 2,
      w: badge,
      h: badge,
      fill: { color: i % 2 ? C.orange : C.green },
      line: { type: "none" },
    });
    slide.addText(toKh(first + i), {
      x: box.x + 0.13,
      y: y + (h - badge) / 2,
      w: badge,
      h: badge,
      fontFace: KFONT,
      fontSize: compact ? 10 : 12,
      bold: true,
      color: C.white,
      align: "center",
      valign: "middle",
      margin: 0,
    });
    slide.addText(s, {
      x: box.x + 0.13 + badge + 0.15,
      y,
      w: box.w - (0.13 + badge + 0.3),
      h,
      fontFace: KFONT,
      fontSize: compact ? 11 : 13,
      color: C.heading,
      valign: "middle",
      margin: 0,
    });
    y += h + gap;
  });
}

// Two or three stacked feature cards: bold title + Khmer description.
function drawCards(slide, box, items) {
  const n = items.length;
  const gap = 0.34;
  const h = Math.min(1.8, (box.h - gap * (n - 1)) / n);
  let y = box.y + (box.h - (n * h + gap * (n - 1))) / 2;
  items.forEach((it, i) => {
    slide.addShape(pres.ShapeType.roundRect, {
      x: box.x,
      y,
      w: box.w,
      h,
      rectRadius: 0.08,
      fill: { color: C.cardFill },
      line: { type: "none" },
      shadow: { type: "outer", color: "9BB8AA", blur: 10, offset: 2, angle: 90, opacity: 0.22 },
    });
    slide.addShape(pres.ShapeType.ellipse, {
      x: box.x + 0.3,
      y: y + 0.28,
      w: 0.34,
      h: 0.34,
      fill: { color: i % 2 ? C.orange : C.green },
      line: { type: "none" },
    });
    slide.addText(it.title, {
      x: box.x + 0.78,
      y: y + 0.22,
      w: box.w - 1.05,
      h: 0.46,
      fontFace: KFONT,
      fontSize: 14,
      bold: true,
      color: C.heading,
      valign: "middle",
      margin: 0,
    });
    slide.addText(it.kh, {
      x: box.x + 0.32,
      y: y + 0.76,
      w: box.w - 0.64,
      h: h - 0.94,
      fontFace: KFONT,
      fontSize: 12,
      color: C.body,
      lineSpacingMultiple: 1.35,
      valign: "top",
      margin: 0,
    });
    y += h + gap;
  });
}

// Tool rows: brand-tinted chip with the tool name plus a Khmer use case.
function drawTools(slide, box, items) {
  const n = items.length;
  const gap = 0.2;
  const h = (box.h - gap * (n - 1)) / n;
  let y = box.y;
  items.forEach((it, i) => {
    slide.addShape(pres.ShapeType.roundRect, {
      x: box.x,
      y,
      w: box.w,
      h,
      rectRadius: 0.08,
      fill: { color: C.cardFill },
      line: { type: "none" },
    });
    slide.addShape(pres.ShapeType.roundRect, {
      x: box.x + 0.16,
      y: y + (h - 0.5) / 2,
      w: 1.75,
      h: 0.5,
      rectRadius: 0.12,
      fill: { color: i % 2 ? C.orange : C.green },
      line: { type: "none" },
    });
    slide.addText(it.name, {
      x: box.x + 0.16,
      y: y + (h - 0.5) / 2,
      w: 1.75,
      h: 0.5,
      fontFace: FONT,
      fontSize: 13,
      bold: true,
      color: C.white,
      align: "center",
      valign: "middle",
      margin: 0,
    });
    slide.addText(it.kh, {
      x: box.x + 2.05,
      y,
      w: box.w - 2.25,
      h,
      fontFace: KFONT,
      fontSize: 11.5,
      color: C.body,
      valign: "middle",
      lineSpacingMultiple: 1.3,
      margin: 0,
    });
    y += h + gap;
  });
}

// 2x2 framework grid (used for CTFR).
function drawQuad(slide, box, items) {
  const gap = 0.28;
  const w = (box.w - gap) / 2;
  const h = (box.h - gap) / 2;
  items.forEach((it, i) => {
    const x = box.x + (i % 2) * (w + gap);
    const y = box.y + Math.floor(i / 2) * (h + gap);
    slide.addShape(pres.ShapeType.roundRect, {
      x,
      y,
      w,
      h,
      rectRadius: 0.08,
      fill: { color: i % 2 ? C.orange : C.green },
      line: { type: "none" },
      shadow: { type: "outer", color: "9BB8AA", blur: 10, offset: 2, angle: 90, opacity: 0.25 },
    });
    slide.addText(it.code, {
      x: x + 0.2,
      y: y + 0.2,
      w: 0.7,
      h: 0.7,
      fontFace: FONT,
      fontSize: 30,
      bold: true,
      color: C.white,
      transparency: 25,
      align: "left",
      valign: "middle",
      margin: 0,
    });
    slide.addText(
      [
        { text: it.name, options: { fontFace: FONT, fontSize: 18, bold: true, breakLine: true } },
        { text: it.kh, options: { fontFace: KFONT, fontSize: 14 } },
      ],
      {
        x: x + 0.2,
        y: y + h - 1.25,
        w: w - 0.4,
        h: 1.05,
        color: C.white,
        align: "left",
        valign: "bottom",
        lineSpacingMultiple: 1.3,
        margin: 0,
      }
    );
  });
}

// Horizontal timeline with a spine, markers, and alternating labels.
function drawTimeline(slide, box, items) {
  const n = items.length;
  const spineY = box.y + box.h / 2;
  slide.addShape(pres.ShapeType.roundRect, {
    x: box.x + 0.1,
    y: spineY - 0.045,
    w: box.w - 0.2,
    h: 0.09,
    rectRadius: 0.04,
    fill: { color: C.grid },
    line: { type: "none" },
  });
  const step = (box.w - 0.2) / n;
  items.forEach((it, i) => {
    const cx = box.x + 0.1 + step * (i + 0.5);
    const color = i % 2 ? C.orange : C.green;
    slide.addShape(pres.ShapeType.ellipse, {
      x: cx - 0.22,
      y: spineY - 0.22,
      w: 0.44,
      h: 0.44,
      fill: { color },
      line: { color: C.white, width: 2.5 },
    });
    const above = i % 2 === 0;
    slide.addText(it.time, {
      x: cx - step / 2,
      y: above ? spineY - 1.5 : spineY + 0.42,
      w: step,
      h: 0.42,
      fontFace: KFONT,
      fontSize: 14,
      bold: true,
      color,
      align: "center",
      valign: above ? "bottom" : "top",
      margin: 0,
    });
    slide.addText(it.kh, {
      x: cx - step / 2,
      y: above ? spineY - 1.05 : spineY + 0.86,
      w: step,
      h: 0.7,
      fontFace: KFONT,
      fontSize: 12.5,
      color: C.body,
      align: "center",
      valign: above ? "bottom" : "top",
      lineSpacingMultiple: 1.3,
      margin: 0,
    });
  });
}

// Brand table with green header row.
function drawTable(slide, box, header, rows) {
  const tRows = [
    header.map((t) => ({
      text: t,
      options: {
        fill: { color: C.green },
        color: C.white,
        bold: true,
        fontSize: 12.5,
        fontFace: KFONT,
        align: "center",
        valign: "middle",
      },
    })),
    ...rows.map((r, i) =>
      r.map((t, j) => ({
        text: String(t),
        options: {
          fill: { color: i % 2 ? C.cardFill : C.white },
          color: j === 0 ? C.heading : C.body,
          bold: j === 0,
          fontSize: 12,
          fontFace: KFONT,
          valign: "middle",
          align: j === 0 ? "center" : "left",
        },
      }))
    ),
  ];
  const rowH = Math.min(0.75, box.h / tRows.length);
  slide.addTable(tRows, {
    x: box.x,
    y: box.y + (box.h - rowH * tRows.length) / 2,
    w: box.w,
    colW: [1.85, box.w - 1.85],
    rowH,
    border: { type: "solid", color: C.grid, pt: 0.75 },
    autoPage: false,
  });
}

function drawVisual(slide, box, v) {
  switch (v.kind) {
    case "flow":
      return drawFlow(slide, box, v.items);
    case "numbered":
      return drawNumbered(slide, box, v.items, v.start, v.compact);
    case "cards":
      return drawCards(slide, box, v.items);
    case "tools":
      return drawTools(slide, box, v.items);
    case "quad":
      return drawQuad(slide, box, v.items);
    case "timeline":
      return drawTimeline(slide, box, v.items);
    case "table":
      return drawTable(slide, box, v.header, v.rows);
    default:
      throw new Error("unknown visual kind: " + v.kind);
  }
}

/* --------------------------------------------------------- slide builders */

function makeTitleSlide() {
  const slide = pres.addSlide();
  slide.background = { color: C.white };
  addBrandGradientBg(slide);

  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.9,
    y: 0.85,
    w: 2.55,
    h: 0.44,
    rectRadius: 0.14,
    fill: { color: C.green },
    line: { type: "none" },
  });
  slide.addText("AI FOR BUSINESS", {
    x: 0.9,
    y: 0.85,
    w: 2.55,
    h: 0.44,
    fontFace: FONT,
    fontSize: 11,
    bold: true,
    color: C.white,
    charSpacing: 1.2,
    align: "center",
    valign: "middle",
    margin: 0,
  });

  slide.addText(TITLE.en, {
    x: 0.9,
    y: 1.6,
    w: 7.3,
    h: 1.55,
    fontFace: FONT,
    fontSize: 34,
    bold: true,
    color: C.heading,
    lineSpacingMultiple: 1.1,
    valign: "middle",
    margin: 0,
  });
  slide.addText(TITLE.kh, {
    x: 0.9,
    y: 3.25,
    w: 7.3,
    h: 0.75,
    fontFace: KFONT,
    fontSize: 23,
    bold: true,
    color: C.green,
    valign: "middle",
    margin: 0,
  });

  slide.addText(
    TITLE.bullets.map((b, i) => ({
      text: b,
      options: {
        bullet: { code: "2022", indent: 18 },
        breakLine: i < TITLE.bullets.length - 1,
      },
    })),
    {
      x: 0.9,
      y: 4.15,
      w: 7.3,
      h: 2.3,
      fontFace: KFONT,
      fontSize: 13,
      color: C.body,
      lineSpacingMultiple: 1.4,
      paraSpaceAfter: 10,
      valign: "top",
      margin: 0,
    }
  );

  // Right-hand highlight cards give the title slide its visual element.
  let cy = 1.75;
  TITLE.cards.forEach((c, i) => {
    slide.addShape(pres.ShapeType.roundRect, {
      x: 8.85,
      y: cy,
      w: 3.6,
      h: 1.32,
      rectRadius: 0.1,
      fill: { color: C.white },
      line: { type: "none" },
      shadow: { type: "outer", color: "9BB8AA", blur: 12, offset: 3, angle: 90, opacity: 0.25 },
    });
    slide.addText(c.big, {
      x: 9.1,
      y: cy + 0.16,
      w: 3.1,
      h: 0.62,
      fontFace: KFONT,
      fontSize: 26,
      bold: true,
      color: i % 2 ? C.orange : C.green,
      valign: "middle",
      margin: 0,
    });
    slide.addText(c.small, {
      x: 9.1,
      y: cy + 0.76,
      w: 3.1,
      h: 0.42,
      fontFace: KFONT,
      fontSize: 11.5,
      color: C.label,
      valign: "middle",
      margin: 0,
    });
    cy += 1.62;
  });

  slide.addText(
    [
      { text: "AI For Business", options: { fontFace: FONT, bold: true, color: C.green } },
      { text: "   |   ", options: { fontFace: FONT, color: C.label } },
      { text: "ស្ថាបនាឆ្នាំ ២០២៣", options: { fontFace: KFONT, color: C.label } },
    ],
    { x: 0.9, y: 6.72, w: 7.3, h: 0.42, fontSize: 12, valign: "middle", margin: 0 }
  );
  return slide;
}

function makeSplitSlide(cfg, index) {
  const slide = pres.addSlide();
  const visualLeft = cfg.visualSide === "left";
  const visX = visualLeft ? 0 : HALF;
  const txtX = visualLeft ? HALF : 0;

  slide.addShape(pres.ShapeType.rect, {
    x: visX,
    y: 0,
    w: HALF,
    h: 7.5,
    fill: { color: C.panelVisual },
    line: { type: "none" },
  });
  slide.addShape(pres.ShapeType.rect, {
    x: txtX,
    y: 0,
    w: HALF,
    h: 7.5,
    fill: { color: C.panelText },
    line: { type: "none" },
  });

  // --- visual panel
  slide.addText(cfg.visualTitle, {
    x: visX + 0.62,
    y: 0.62,
    w: HALF - 1.24,
    h: 0.75,
    fontFace: KFONT,
    fontSize: 14,
    bold: true,
    color: C.heading,
    align: "center",
    valign: "middle",
    lineSpacingMultiple: 1.3,
    margin: 0,
  });
  drawVisual(slide, { x: visX + 0.62, y: 1.55, w: HALF - 1.24, h: 5.05 }, cfg.visual);

  // --- text panel
  const tx = txtX + 0.7;
  const tw = HALF - 1.4;
  slide.addText(cfg.en, {
    x: tx,
    y: 0.52,
    w: tw,
    h: 0.9,
    fontFace: FONT,
    fontSize: 23,
    bold: true,
    color: C.heading,
    lineSpacingMultiple: 1.08,
    valign: "middle",
    margin: 0,
  });
  slide.addText(cfg.kh, {
    x: tx,
    y: 1.5,
    w: tw,
    h: 0.86,
    fontFace: KFONT,
    fontSize: 15,
    bold: true,
    color: C.green,
    lineSpacingMultiple: 1.3,
    valign: "top",
    margin: 0,
  });

  let y = 2.44;

  if (cfg.stats && cfg.stats.length) {
    const n = cfg.stats.length;
    const gap = 0.22;
    const cw = (tw - gap * (n - 1)) / n;
    cfg.stats.forEach((s, i) => {
      const cx = tx + i * (cw + gap);
      slide.addShape(pres.ShapeType.roundRect, {
        x: cx,
        y,
        w: cw,
        h: 1.15,
        rectRadius: 0.09,
        fill: { color: C.cardFill },
        line: { type: "none" },
      });
      slide.addText(s.value, {
        x: cx,
        y: y + 0.12,
        w: cw,
        h: 0.58,
        fontFace: KFONT,
        fontSize: 24,
        bold: true,
        color: i % 2 ? C.orange : C.green,
        align: "center",
        valign: "middle",
        margin: 0,
      });
      slide.addText(s.label, {
        x: cx + 0.06,
        y: y + 0.68,
        w: cw - 0.12,
        h: 0.38,
        fontFace: KFONT,
        fontSize: 10.5,
        color: C.label,
        align: "center",
        valign: "middle",
        margin: 0,
      });
    });
    y += 1.45;
  }

  slide.addText(
    cfg.bullets.map((b, i) => ({
      text: b,
      options: {
        bullet: { code: "2022", indent: 18 },
        breakLine: i < cfg.bullets.length - 1,
      },
    })),
    {
      x: tx,
      y,
      w: tw,
      h: (cfg.contact ? 5.28 : 6.9) - y,
      fontFace: KFONT,
      fontSize: 13,
      color: C.body,
      lineSpacingMultiple: 1.4,
      paraSpaceAfter: 12,
      valign: "top",
      margin: 0,
    }
  );

  if (cfg.contact) {
    slide.addShape(pres.ShapeType.roundRect, {
      x: tx,
      y: 5.42,
      w: tw,
      h: 1.28,
      rectRadius: 0.09,
      fill: { color: C.orange },
      line: { type: "none" },
      shadow: { type: "outer", color: "9BB8AA", blur: 10, offset: 3, angle: 90, opacity: 0.25 },
    });
    slide.addText(cfg.contact.title, {
      x: tx + 0.3,
      y: 5.58,
      w: tw - 0.6,
      h: 0.42,
      fontFace: KFONT,
      fontSize: 14,
      bold: true,
      color: C.white,
      valign: "middle",
      margin: 0,
    });
    slide.addText(cfg.contact.body, {
      x: tx + 0.3,
      y: 6.0,
      w: tw - 0.6,
      h: 0.58,
      fontFace: KFONT,
      fontSize: 12,
      color: C.white,
      lineSpacingMultiple: 1.3,
      valign: "top",
      margin: 0,
    });
  }

  addFooter(slide, index);
  return slide;
}

/* ------------------------------------------------------------------ build */

makeTitleSlide();
SLIDES.forEach((cfg, i) => {
  makeSplitSlide({ ...cfg, visualSide: i % 2 === 0 ? "left" : "right" }, i + 2);
});

const out = process.argv[2] || "AI-For-Management-Training-Program.pptx";
pres.writeFile({ fileName: out }).then(() => console.log("wrote " + out));
