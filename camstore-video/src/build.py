"""Render the CamStore 365 FY2025 motion-graphic video (1920x1080, 30 fps, 90 s).

    python3 src/build.py            # uses voice/*.wav if present, otherwise renders without voice
    python3 src/build.py --no-voice

Output: output/CamStore365_FY2025.mp4 (or ..._no_voice.mp4) and output/captions_km.srt
"""
import argparse
import json
import math
import subprocess
import sys
import wave
from functools import lru_cache
from multiprocessing import Pool
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

sys.path.insert(0, str(Path(__file__).parent))
import audio  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
W, H, FPS = 1920, 1080, 30
TOTAL = 90.0
T_INTRO, T_OUTRO = 3.0, 2.0
SLIDES_TOTAL = TOTAL - T_INTRO - T_OUTRO
TD = 0.7  # transition length
SW, SH = 1672, 941  # source slide size
CW, CH = 1651, 929  # card (slide window) size on screen
CX0, CY0 = (W - CW) // 2, 18
UP = 2  # source upscale factor for sharper zooms

TERRA = (185, 101, 76)
OLIVE = (122, 132, 92)
GOLD = (201, 158, 66)
INK = (38, 31, 27)
CREAM = (246, 238, 230)

# ------------------------------------------------------------------ per-slide focus plan
# Each focus: (camera rect, [highlight rects shown one after another]) in source-pixel coords.
FOCUS = {
    1: [((45, 425, 1220, 760), [(55, 437, 338, 750), (362, 437, 642, 750), (667, 437, 950, 750), (976, 437, 1210, 750)])],
    2: [((45, 340, 1265, 725), [(50, 345, 337, 720), (359, 345, 642, 720), (666, 345, 952, 720), (976, 345, 1260, 720)]),
        ((45, 742, 1265, 897), [(50, 750, 1260, 893)])],
    3: [((40, 262, 562, 838), [(45, 268, 555, 832)]),
        ((568, 262, 1638, 838), [(573, 268, 1115, 832), (1133, 268, 1632, 645), (1133, 662, 1632, 832)])],
    4: [((42, 255, 1632, 638), [(48, 262, 1628, 632)]),
        ((40, 646, 1634, 842), [(45, 652, 565, 836), (583, 652, 1090, 836), (1108, 652, 1628, 836)])],
    5: [((55, 275, 1150, 805), [(60, 280, 433, 800), (455, 280, 1145, 800)]),
        ((1160, 275, 1625, 835), [(1166, 280, 1618, 560)])],
    6: [((40, 366, 952, 832), [(45, 372, 948, 540), (45, 557, 948, 713), (45, 730, 948, 830)]),
        ((972, 186, 1638, 760), [(975, 190, 1633, 755)])],
    7: [((44, 296, 1034, 840), [(48, 300, 1028, 835)]),
        ((1048, 296, 1632, 840), [(1052, 300, 1628, 676), (1052, 695, 1628, 835)])],
    8: [((50, 284, 1018, 836), [(55, 290, 1013, 502), (55, 520, 1013, 730), (55, 748, 1013, 830)]),
        ((1040, 272, 1625, 815), [(1045, 278, 1620, 810)])],
    9: [((36, 276, 1224, 830), [(40, 280, 1220, 825)]),
        ((1232, 276, 1638, 830), [(1237, 280, 1634, 825)])],
    10: [((36, 226, 580, 870), [(40, 232, 575, 865)]),
         ((584, 226, 1096, 870), [(588, 232, 1090, 865)]),
         ((1100, 226, 1638, 870), [(1105, 232, 1632, 865)])],
}
TRANSITIONS = ["push", "zoom", "wipe", "up", "push", "zoom", "wipe", "up", "push"]


def ease(x):
    x = min(max(x, 0.0), 1.0)
    return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2


def ease_out_back(x):
    x = min(max(x, 0.0), 1.0)
    c1, c3 = 1.4, 2.4
    return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2


def ramp(t, a, b):
    return min(max((t - a) / (b - a), 0.0), 1.0)


# ------------------------------------------------------------------ timeline
def wav_len(p):
    with wave.open(str(p)) as w:
        return w.getnframes() / w.getframerate()


def build_timeline(voice_lens):
    """Return slide windows [(start, end)] and voice tempo factor."""
    if not voice_lens:
        d = SLIDES_TOTAL / 10
        return [(T_INTRO + i * d, T_INTRO + (i + 1) * d) for i in range(10)], 1.0
    lens = [voice_lens[f"s{i:02d}"] for i in range(1, 11)]
    pad, min_win = 0.9, 5.5
    tempo = 1.0
    need = [max(l + pad, min_win) for l in lens]
    if sum(need) > SLIDES_TOTAL:
        tempo = min(1.25, sum(lens) / (SLIDES_TOTAL - 10 * pad))
        need = [max(l / tempo + pad, min_win) for l in lens]
    scale = SLIDES_TOTAL / sum(need)
    if scale < 1:
        print(f"WARNING: voice is long even at tempo {tempo:.2f}; squeezing windows by {scale:.2f}")
    extra = (SLIDES_TOTAL - sum(need)) / 10 if scale >= 1 else 0
    need = [n + extra if scale >= 1 else n * scale for n in need]
    wins, t = [], T_INTRO
    for n in need:
        wins.append((t, t + n))
        t += n
    return wins, tempo


# ------------------------------------------------------------------ assets
@lru_cache(None)
def font(name, size):
    return ImageFont.truetype(str(ROOT / "fonts" / name), size, layout_engine=ImageFont.Layout.RAQM)


def text_img(text, fnt, fill, tracking=0):
    if tracking:
        widths = [fnt.getlength(c) + tracking for c in text]
        asc, desc = fnt.getmetrics()
        im = Image.new("RGBA", (int(sum(widths)) + 4, asc + desc + 8), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        x = 2
        for c, w in zip(text, widths):
            d.text((x, 4), c, font=fnt, fill=fill)
            x += w
        return im
    l, t, r, b = ImageDraw.Draw(Image.new("L", (1, 1))).textbbox((0, 0), text, font=fnt)
    pad = 12
    im = Image.new("RGBA", (r - l + 2 * pad, b - t + 2 * pad), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((pad - l, pad - t), text, font=fnt, fill=fill)
    return im


def wrap(text, fnt, maxw):
    lines, cur = [], ""
    for word in text.split(" "):
        trial = (cur + " " + word).strip()
        if fnt.getlength(trial) <= maxw or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = word
    lines.append(cur)
    return lines


def rounded_mask(w, h, r, ss=4):
    m = Image.new("L", (w * ss, h * ss), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, w * ss - 1, h * ss - 1), r * ss, fill=255)
    return m.resize((w, h), Image.LANCZOS)


def make_background():
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    d = np.sqrt(((x - W * 0.5) / W) ** 2 + ((y - H * 0.42) / H) ** 2)
    top = np.array([248, 241, 233], np.float32)
    edge = np.array([231, 216, 200], np.float32)
    k = np.clip(d * 1.5, 0, 1)[..., None]
    img = top * (1 - k) + edge * k
    return Image.fromarray(img.astype(np.uint8)).convert("RGBA")


def make_bokeh():
    rs = np.random.default_rng(3)
    sprites = []
    cols = [TERRA, OLIVE, GOLD, (255, 255, 255), GOLD]
    for i in range(16):
        r = int(rs.uniform(26, 120))
        a = int(rs.uniform(18, 42))
        c = cols[i % len(cols)]
        blur = r * 0.18 + 3
        pad = int(blur * 3) + 4
        s = Image.new("RGBA", (r * 2 + 2 * pad, r * 2 + 2 * pad), c + (0,))
        ImageDraw.Draw(s).ellipse((pad, pad, pad + 2 * r, pad + 2 * r), fill=c + (a,))
        s = s.filter(ImageFilter.GaussianBlur(blur))
        sprites.append(dict(img=s, x=rs.uniform(0, W), y=rs.uniform(0, H), vx=rs.uniform(-14, 14),
                            vy=rs.uniform(-22, -6), ph=rs.uniform(0, 6.28), amp=rs.uniform(10, 40)))
    return sprites


def make_shadow():
    pad = 90
    s = Image.new("RGBA", (CW + 2 * pad, CH + 2 * pad), (0, 0, 0, 0))
    ImageDraw.Draw(s).rounded_rectangle((pad, pad + 16, pad + CW, pad + CH + 16), 26, fill=(70, 45, 30, 70))
    return s.filter(ImageFilter.GaussianBlur(28)), pad


def make_bar3d(w, h, color):
    """Extruded 3D bar (front, top, side faces) like the slide artwork."""
    dpt = int(w * 0.28)
    im = Image.new("RGBA", (w + dpt + 4, h + dpt + 4), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    c = np.array(color)
    light = tuple(int(v) for v in np.clip(c * 1.18 + 12, 0, 255))
    dark = tuple(int(v) for v in np.clip(c * 0.78, 0, 255))
    d.polygon([(0, dpt), (dpt, 0), (dpt + w, 0), (w, dpt)], fill=light)
    d.polygon([(w, dpt), (w + dpt, 0), (w + dpt, h), (w, h + dpt)], fill=dark)
    d.rounded_rectangle((0, dpt, w, h + dpt), 6, fill=tuple(color))
    return im


class Assets:
    def __init__(self, segs, wins):
        self.slides = []
        for i in range(1, 11):
            im = Image.open(ROOT / "slides" / f"slide{i:02d}.webp").convert("RGB")
            im = im.resize((SW * UP, SH * UP), Image.LANCZOS).filter(ImageFilter.UnsharpMask(1.6, 60, 2))
            self.slides.append(im)
        self.bg = make_background()
        self.bokeh = make_bokeh()
        self.mask = rounded_mask(CW, CH, 24)
        self.shadow, self.spad = make_shadow()
        self.wins = wins
        self.segs = segs
        # captions: chip + wrapped text, one image per slide
        self.chips, self.caps = [], []
        for i, seg in enumerate(segs[:10]):
            num = text_img(f"{i + 1:02d}", font("PlayfairDisplay-700.ttf", 30), (255, 255, 255))
            lab = text_img(seg["label_km"], font("Battambang-700.ttf", 24), (255, 255, 255))
            cw = num.width + lab.width + 18
            chip = Image.new("RGBA", (cw, 58), (0, 0, 0, 0))
            ImageDraw.Draw(chip).rounded_rectangle((0, 0, cw - 1, 57), 29, fill=TERRA + (255,))
            ImageDraw.Draw(chip).line((num.width + 2, 14, num.width + 2, 44), fill=(255, 255, 255, 140), width=2)
            chip.alpha_composite(num, (6, (58 - num.height) // 2))
            chip.alpha_composite(lab, (num.width + 6, (58 - lab.height) // 2 + 1))
            self.chips.append(chip)
            maxw = CW - chip.width - 40
            f = font("Battambang-400.ttf", 30)
            lines = wrap(seg["caption_km"], f, maxw)
            imgs = [text_img(l, f, INK) for l in lines]
            lh = 50
            cap = Image.new("RGBA", (max(i.width for i in imgs), lh * len(imgs) + 24), (0, 0, 0, 0))
            for k, li in enumerate(imgs):
                cap.alpha_composite(li, (0, k * lh))
            self.caps.append(cap)
        # intro / outro typography
        self.t_brand = text_img("CamStore 365", font("PlayfairDisplay-700.ttf", 128), INK)
        self.t_km = text_img("របាយការណ៍ហិរញ្ញវត្ថុ ឆ្នាំ 2025", font("Moul-400.ttf", 52), TERRA)
        self.t_sub = text_img("លទ្ធផលហិរញ្ញវត្ថុ និងសុខភាពប្រតិបត្តិការ", font("Battambang-400.ttf", 36), (90, 78, 68))
        self.t_tag = text_img("PEOPLE  ·  PRODUCTS  ·  POSSIBILITIES", font("PlayfairDisplay-700.ttf", 24), (110, 96, 84), tracking=5)
        self.t_thanks = text_img("សូមអរគុណ", font("Moul-400.ttf", 96), TERRA)
        self.t_brand_s = text_img("CamStore 365", font("PlayfairDisplay-700.ttf", 64), INK)
        self.t_motto = text_img("Capturing a brighter tomorrow", font("PlayfairDisplay-700.ttf", 30), (120, 104, 90))
        self.bars = [make_bar3d(64, h, c) for h, c in ((90, TERRA), (140, OLIVE), (200, GOLD))]
        # sheen band profile
        yy, xx = np.mgrid[0:CH, 0:CW].astype(np.float32)
        self.diag = xx + 0.45 * yy


A = None


def init_worker(segs, wins):
    global A
    A = Assets(segs, wins)


# ------------------------------------------------------------------ camera
def fit(rect, margin=0.07):
    x0, y0, x1, y1 = rect
    rw, rh = (x1 - x0) * (1 + 2 * margin), (y1 - y0) * (1 + 2 * margin)
    z = min(SW / rw, SH / rh, 1.6)
    z = max(z, 1.0)
    return (z, (x0 + x1) / 2, (y0 + y1) / 2)


FULL = (1.0, SW / 2, SH / 2)


def schedule(n):
    """Camera keyframes (u, focus index or -1 for full view) and hold windows per focus."""
    t0, t1 = (0.16, 0.84) if n == 1 else (0.12, 0.88)
    L = (t1 - t0) / n
    mv = 0.17 if n == 1 else 0.11
    keys = [(0.0, -1), (t0, -1)]
    holds = []
    for k in range(n):
        a = t0 + k * L
        keys += [(a + mv, k), (a + L, k)]
        holds.append((a + mv, a + L))
    keys.append((1.0, -1))
    return keys, holds


def camera(slide, u):
    foci = FOCUS[slide]
    keys, _ = schedule(len(foci))
    cams = [FULL if k < 0 else fit(foci[k][0]) for _, k in keys]
    for (ua, _), (ub, _), ca, cb in zip(keys, keys[1:], cams, cams[1:]):
        if u <= ub:
            p = ease((u - ua) / (ub - ua)) if ub > ua else 1
            z = math.exp(math.log(ca[0]) * (1 - p) + math.log(cb[0]) * p)
            return z, ca[1] * (1 - p) + cb[1] * p, ca[2] * (1 - p) + cb[2] * p
    return cams[-1]


def view(z, cx, cy):
    w = SW / z
    h = w * CH / CW
    x0 = min(max(cx - w / 2, 0), SW - w)
    y0 = min(max(cy - h / 2, 0), SH - h)
    return x0, y0, w, h


def highlight_spans(slide, dur):
    """(t_start, t_end, rect) in seconds within the window."""
    out = []
    _, holds = schedule(len(FOCUS[slide]))
    for (a, b), (_, rects) in zip(holds, FOCUS[slide]):
        step = (b - a) / len(rects)
        for k, r in enumerate(rects):
            out.append((dur * (a + k * step), dur * (a + (k + 1) * step), r))
    return out


def rr_points(x0, y0, x1, y1, r, n=240):
    """Perimeter points of a rounded rectangle, starting top-left going clockwise."""
    pts = []
    segs = [((x0 + r, y0), (x1 - r, y0)), None, ((x1, y0 + r), (x1, y1 - r)), None,
            ((x1 - r, y1), (x0 + r, y1)), None, ((x0, y1 - r), (x0, y0 + r)), None]
    corners = [(x1 - r, y0 + r, -90), (x1 - r, y1 - r, 0), (x0 + r, y1 - r, 90), (x0 + r, y0 + r, 180)]
    for i in range(4):
        (ax, ay), (bx, by) = segs[i * 2]
        for k in range(20):
            pts.append((ax + (bx - ax) * k / 20, ay + (by - ay) * k / 20))
        cx, cy, a0 = corners[i]
        for k in range(10):
            ang = math.radians(a0 + 90 * k / 10)
            pts.append((cx + r * math.cos(ang), cy + r * math.sin(ang)))
    pts.append(pts[0])
    return pts


# ------------------------------------------------------------------ card rendering
def render_card(slide, t_local, dur):
    u = min(max(t_local / dur, 0), 1)
    z, cx, cy = camera(slide, u)
    x0, y0, w, h = view(z, cx, cy)
    src = A.slides[slide - 1]
    card = src.transform((CW, CH), Image.AFFINE, (UP * w / CW, 0, UP * x0, 0, UP * h / CH, UP * y0), Image.BICUBIC)
    sx, sy = CW / w, CH / h
    # highlights
    for ta, tb, r in highlight_spans(slide, dur):
        if not (ta - 0.05 <= t_local <= tb + 0.3):
            continue
        fade = ramp(t_local, ta, ta + 0.3) * (1 - ramp(t_local, tb - 0.05, tb + 0.25))
        if fade <= 0:
            continue
        rx0, ry0 = (r[0] - x0) * sx, (r[1] - y0) * sy
        rx1, ry1 = (r[2] - x0) * sx, (r[3] - y0) * sy
        ov = Image.new("RGBA", (CW, CH), (40, 25, 15, int(70 * fade)))
        hole = Image.new("L", (CW, CH), 0)
        ImageDraw.Draw(hole).rounded_rectangle((rx0, ry0, rx1, ry1), 22, fill=255)
        ov.putalpha(Image.fromarray((np.array(ov.getchannel("A"), np.float32) * (1 - np.array(hole) / 255)).astype(np.uint8)))
        card = card.convert("RGBA")
        card.alpha_composite(ov)
        prog = ease(ramp(t_local, ta + 0.05, ta + 0.6))
        pts = rr_points(rx0 - 4, ry0 - 4, rx1 + 4, ry1 + 4, 24)
        pts = pts[: max(2, int(len(pts) * prog))]
        d = ImageDraw.Draw(card)
        d.line(pts, fill=GOLD + (int(70 * fade),), width=14, joint="curve")
        d.line(pts, fill=GOLD + (int(255 * fade),), width=5, joint="curve")
        if prog < 1:
            hx, hy = pts[-1]
            d.ellipse((hx - 9, hy - 9, hx + 9, hy + 9), fill=(255, 236, 190, int(255 * fade)))
    card = card.convert("RGB")
    # light sheen just after the slide arrives
    sp = ramp(t_local, 0.45, 1.35)
    if 0 < sp < 1:
        pos = -400 + sp * (CW + 0.45 * CH + 800)
        a = np.exp(-((A.diag - pos) / 110) ** 2)[..., None] * 0.28
        arr = np.asarray(card, np.float32)
        card = Image.fromarray((arr + (255 - arr) * a).astype(np.uint8))
    return card


def place(frame, card, dx=0.0, dy=0.0, scale=1.0, alpha=1.0):
    if alpha <= 0.01:
        return
    mask, shadow = A.mask, A.shadow
    if abs(scale - 1) > 1e-3:
        size = (max(2, int(CW * scale)), max(2, int(CH * scale)))
        card = card.resize(size, Image.BILINEAR)
        mask = mask.resize(size, Image.BILINEAR)
        shadow = shadow.resize((int(shadow.width * scale), int(shadow.height * scale)), Image.BILINEAR)
    cw, ch = card.size
    x = int(W / 2 - cw / 2 + dx)
    y = int(CY0 + CH / 2 - ch / 2 + dy)
    sp = int(A.spad * scale)
    if alpha < 1:
        shadow = shadow.copy()
        shadow.putalpha(shadow.getchannel("A").point(lambda v: int(v * alpha)))
        mask = mask.point(lambda v: int(v * alpha))
    frame.alpha_composite(shadow, (x - sp, y - sp))
    frame.paste(card, (x, y), mask)


def background(t):
    f = A.bg.copy()
    for s in A.bokeh:
        x = (s["x"] + s["vx"] * t + s["amp"] * math.sin(t * 0.4 + s["ph"])) % (W + 300) - 150
        y = (s["y"] + s["vy"] * t) % (H + 300) - 150
        _paste_clip(f, s["img"], x, y)
    return f


def _paste_clip(f, img, x, y):
    x0, y0 = int(x - img.width / 2), int(y - img.height / 2)
    l, t = max(0, -x0), max(0, -y0)
    if l >= img.width or t >= img.height:
        return
    f.alpha_composite(img.crop((l, t, img.width, img.height)), (max(0, x0), max(0, y0)))


def with_alpha(img, a):
    if a >= 0.999:
        return img
    im = img.copy()
    im.putalpha(im.getchannel("A").point(lambda v: int(v * a)))
    return im


def draw_captions(frame, i, t):
    s, e = A.wins[i]
    a_in = ease(ramp(t, s + 0.25, s + 0.7))
    a_out = 1 - ramp(t, e - 0.35, e - 0.05)
    a = a_in * a_out
    if a <= 0:
        return
    chip, cap = A.chips[i], A.caps[i]
    area_y0, area_y1 = CY0 + CH + 14, H - 10
    block_h = max(chip.height, cap.height - 24)
    yc = (area_y0 + area_y1) / 2
    cx = CX0 + int(-30 * (1 - a_in))
    frame.alpha_composite(with_alpha(chip, a), (cx, int(yc - chip.height / 2)))
    ty = int(yc - (cap.height - 24) / 2 - 10 + 14 * (1 - a_in))
    frame.alpha_composite(with_alpha(cap, a), (CX0 + chip.width + 26, ty))


def draw_progress(frame, t):
    s0, e0 = A.wins[0][0], A.wins[-1][1]
    p = ramp(t, s0, e0)
    a = ramp(t, s0 - 0.3, s0 + 0.3) * (1 - ramp(t, e0 - 0.2, e0 + 0.3))
    if a <= 0:
        return
    d = ImageDraw.Draw(frame)
    y = H - 6
    d.rectangle((CX0, y, CX0 + CW, y + 3), fill=(222, 205, 188, int(255 * a)))
    d.rectangle((CX0, y, CX0 + int(CW * p), y + 3), fill=TERRA + (int(255 * a),))
    for k in range(1, 10):
        x = CX0 + int(CW * (A.wins[k][0] - s0) / (e0 - s0))
        d.ellipse((x - 4, y - 3, x + 4, y + 5), fill=(GOLD if p * (e0 - s0) + s0 >= A.wins[k][0] else (210, 192, 172)) + (int(255 * a),))


def draw_bars(frame, t, t0, cx, base_y, scale=1.0, alpha=1.0):
    x = cx - 120 * scale
    for k, bar in enumerate(A.bars):
        p = ease_out_back(ramp(t, t0 + k * 0.15, t0 + k * 0.15 + 0.6))
        if p <= 0:
            x += 84 * scale
            continue
        hb = max(2, int(bar.height * p * scale))
        b = bar.resize((max(2, int(bar.width * scale)), hb), Image.BILINEAR)
        frame.alpha_composite(with_alpha(b, alpha), (int(x), int(base_y - hb)))
        x += 84 * scale


def intro(frame, t):
    out = ramp(t, 2.05, 2.5)
    a = 1 - out
    if a <= 0:
        return
    dy = -40 * ease(out)
    p1 = ease(ramp(t, 0.55, 1.15))
    br = with_alpha(A.t_brand, p1 * a)
    frame.alpha_composite(br, (int(W / 2 - br.width / 2), int(300 + 30 * (1 - p1) + dy)))
    lw = ease(ramp(t, 0.95, 1.6)) * 520
    if lw > 2:
        ImageDraw.Draw(frame).rectangle((W / 2 - lw / 2, 470 + dy, W / 2 + lw / 2, 474 + dy), fill=GOLD + (int(255 * a),))
    p2 = ease(ramp(t, 1.05, 1.6))
    km = with_alpha(A.t_km, p2 * a)
    frame.alpha_composite(km, (int(W / 2 - km.width / 2), int(505 + 24 * (1 - p2) + dy)))
    p3 = ease(ramp(t, 1.3, 1.85))
    sb = with_alpha(A.t_sub, p3 * a)
    frame.alpha_composite(sb, (int(W / 2 - sb.width / 2), int(625 + 20 * (1 - p3) + dy)))
    draw_bars(frame, t, 0.15, W / 2, 900 + dy, 1.0, a)
    # rising gold arrow
    ap = ease(ramp(t, 0.7, 1.5))
    if ap > 0:
        x0, y0, x1, y1 = W / 2 - 260, 880, W / 2 + 230, 690
        xe, ye = x0 + (x1 - x0) * ap, y0 + (y1 - y0) * ap - 40 * math.sin(math.pi * ap) * 0.4
        d = ImageDraw.Draw(frame)
        pts = [(x0 + (xe - x0) * k / 30, y0 + (ye - y0) * k / 30 - 30 * math.sin(math.pi * k / 30) * ap) for k in range(31)]
        pts = [(px, py + dy) for px, py in pts]
        d.line(pts, fill=GOLD + (int(255 * a),), width=6, joint="curve")
        if ap > 0.95:
            ex, ey = pts[-1]
            d.polygon([(ex + 18, ey - 12), (ex - 14, ey - 10), (ex + 4, ey + 20)], fill=GOLD + (int(255 * a),))


def outro(frame, t, t0):
    p = ramp(t, t0, t0 + 0.6)
    if p <= 0:
        return
    end_fade = 1 - ramp(t, TOTAL - 0.45, TOTAL)
    p1 = ease(ramp(t, t0 + 0.1, t0 + 0.65))
    th = with_alpha(A.t_thanks, p1 * end_fade)
    frame.alpha_composite(th, (int(W / 2 - th.width / 2), int(300 + 30 * (1 - p1))))
    p2 = ease(ramp(t, t0 + 0.35, t0 + 0.9))
    b = with_alpha(A.t_brand_s, p2 * end_fade)
    frame.alpha_composite(b, (int(W / 2 - b.width / 2), int(500 + 20 * (1 - p2))))
    lw = ease(ramp(t, t0 + 0.5, t0 + 1.0)) * 360
    if lw > 2:
        ImageDraw.Draw(frame).rectangle((W / 2 - lw / 2, 610, W / 2 + lw / 2, 613), fill=GOLD + (int(255 * end_fade),))
    p3 = ease(ramp(t, t0 + 0.6, t0 + 1.1))
    m = with_alpha(A.t_motto, p3 * end_fade)
    frame.alpha_composite(m, (int(W / 2 - m.width / 2), 640))
    tg = with_alpha(A.t_tag, p3 * end_fade)
    frame.alpha_composite(tg, (int(W / 2 - tg.width / 2), 700))
    draw_bars(frame, t, t0 + 0.2, W / 2, 940, 0.7, end_fade)


def wipe(card_a, card_b, p):
    a = np.asarray(card_a, np.float32)
    b = np.asarray(card_b, np.float32)
    pos = -150 + p * (CW + 0.45 * CH + 300)
    m = np.clip((pos - A.diag) / 60, 0, 1)[..., None]
    glow = np.exp(-((A.diag - pos) / 28) ** 2)[..., None]
    out = a * (1 - m) + b * m
    out = out + (np.array([255, 226, 160], np.float32) - out) * glow * 0.85
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))


def render_frame(fi):
    t = fi / FPS
    frame = background(t)
    wins = A.wins
    last_end = wins[-1][1]
    if t < wins[0][0] + TD / 2:
        intro(frame, t)
        # slide 1 card rises in
        p = ease(ramp(t, 2.3, 3.2))
        if p > 0:
            card = render_card(1, t - wins[0][0], wins[0][1] - wins[0][0])
            place(frame, card, dy=(1 - p) * 700, scale=0.86 + 0.14 * p, alpha=min(1, p * 1.6))
    elif t > last_end - TD / 2:
        p = ease(ramp(t, last_end - 0.35, last_end + 0.45))
        if p < 1:
            card = render_card(10, t - wins[-1][0], wins[-1][1] - wins[-1][0])
            place(frame, card, scale=1 - 0.18 * p, alpha=1 - p, dy=-60 * p)
        outro(frame, t, last_end - 0.1)
    else:
        i = max(k for k in range(10) if wins[k][0] - TD / 2 <= t)
        s, e = wins[i]
        if i < 9 and t > e - TD / 2:
            # transition from slide i+1 to i+2 (0-based i -> i+1)
            p = ease((t - (e - TD / 2)) / TD)
            ca = render_card(i + 1, t - s, e - s)
            ns, ne = wins[i + 1]
            cb = render_card(i + 2, t - ns, ne - ns)
            kind = TRANSITIONS[i]
            dip = 1 - 0.07 * math.sin(math.pi * p)
            if kind == "push":
                place(frame, ca, dx=-p * W * 1.02, scale=dip)
                place(frame, cb, dx=(1 - p) * W * 1.02, scale=dip)
            elif kind == "up":
                place(frame, ca, dy=-p * H * 1.05, scale=dip)
                place(frame, cb, dy=(1 - p) * H * 1.05, scale=dip)
            elif kind == "zoom":
                place(frame, ca, scale=1 + 0.1 * p, alpha=1 - p)
                place(frame, cb, scale=0.9 + 0.1 * p, alpha=p)
            else:
                place(frame, wipe(ca, cb, p))
        else:
            place(frame, render_card(i + 1, t - s, e - s))
        for k in (i - 1, i, i + 1):
            if 0 <= k < 10:
                draw_captions(frame, k, t)
    draw_progress(frame, t)
    return frame.convert("RGB").tobytes()


# ------------------------------------------------------------------ audio + captions
def load_voice(path, tempo):
    """Decode a wav to mono float @48k, applying tempo with ffmpeg atempo."""
    filt = f"atempo={tempo:.4f}," if abs(tempo - 1) > 1e-3 else ""
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-af",
                          f"{filt}silenceremove=start_periods=1:start_threshold=-45dB,areverse,"
                          "silenceremove=start_periods=1:start_threshold=-45dB,areverse,"
                          "highpass=f=70,acompressor=threshold=-18dB:ratio=3:attack=5:release=120",
                          "-ac", "1", "-ar", str(audio.SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.float32).astype(np.float64)
    return x / (np.abs(x).max() + 1e-9) * 0.8


def srt_time(s):
    ms = int(round(s * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-voice", action="store_true")
    ap.add_argument("--frames", type=int, default=None, help="render only the first N frames (testing)")
    ap.add_argument("--stills", nargs="*", type=float, help="write PNG stills at these times and exit")
    ap.add_argument("--workers", type=int, default=4)
    args = ap.parse_args()

    segs = json.loads((ROOT / "narration_km.json").read_text(encoding="utf-8"))["segments"]
    vdir = ROOT / "voice"
    use_voice = not args.no_voice and all((vdir / f"{s['id']}.wav").exists() for s in segs)
    voice_lens = {s["id"]: len(load_voice(vdir / f"{s['id']}.wav", 1.0)) / audio.SR for s in segs} if use_voice else {}
    wins, tempo = build_timeline(voice_lens)
    print("voice:", "yes" if use_voice else "no", f"tempo={tempo:.3f}")
    for k, (s, e) in enumerate(wins):
        print(f"  slide {k + 1:2d}: {s:6.2f} - {e:6.2f}  ({e - s:.2f}s)")

    out_dir = ROOT / "output"
    out_dir.mkdir(exist_ok=True)
    if args.stills:
        init_worker(segs, wins)
        for ts in args.stills:
            Image.frombytes("RGB", (W, H), render_frame(int(ts * FPS))).save(out_dir / f"still_{ts:05.2f}.png")
        return

    # ---- audio
    events = [("riser", 0.0, 0.0), ("impact", 0.95, 0.0), ("sparkle", 1.1, 0.2), ("whoosh", 2.5, 0.0)]
    for k in range(9):
        events.append(("whoosh", wins[k][1] - 0.4, -0.6 if TRANSITIONS[k] == "push" else 0.0))
    for k in range(10):
        s, e = wins[k]
        for ta, _, _ in highlight_spans(k + 1, e - s):
            events.append(("tick", s + ta + 0.05, 0.0))
    events += [("whoosh", wins[-1][1] - 0.3, 0.0), ("sparkle", wins[-1][1] + 0.05, 0.0), ("bell", wins[-1][1] + 0.1, 0.0)]
    voice_clips = []
    if use_voice:
        for k, seg in enumerate(segs):
            at = wins[k][0] + 0.5 if k < 10 else wins[-1][1] + 0.35
            voice_clips.append((at, load_voice(vdir / f"{seg['id']}.wav", tempo)))
    print("synthesizing audio ...")
    mus = audio.music(TOTAL, T_INTRO - 0.2, wins[-1][1])
    sfx = audio.sfx_track(TOTAL, events)
    mixed = audio.mix(TOTAL, mus, sfx, voice_clips)
    wav_path = out_dir / "soundtrack.wav"
    with wave.open(str(wav_path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(audio.SR)
        w.writeframes((mixed * 32767).astype(np.int16).tobytes())

    # ---- captions (.srt)
    lines = []
    for k, seg in enumerate(segs):
        if k < 10:
            s, e = wins[k][0] + 0.3, wins[k][1] - 0.1
        else:
            s, e = wins[-1][1] + 0.2, TOTAL - 0.2
        lines += [str(k + 1), f"{srt_time(s)} --> {srt_time(e)}", seg["caption_km"], ""]
    (out_dir / "captions_km.srt").write_text("\n".join(lines), encoding="utf-8")

    # ---- video
    n = args.frames or int(TOTAL * FPS)
    name = "CamStore365_FY2025" + ("" if use_voice else "_no_voice") + ".mp4"
    cmd = ["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
           "-i", "-", "-i", str(wav_path), "-map", "0:v", "-map", "1:a",
           "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
           "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
           "-shortest", "-movflags", "+faststart", str(out_dir / name)]
    enc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    with Pool(args.workers, initializer=init_worker, initargs=(segs, wins)) as pool:
        for k, buf in enumerate(pool.imap(render_frame, range(n), chunksize=6)):
            enc.stdin.write(buf)
            if k % 150 == 0:
                print(f"  frame {k}/{n}", flush=True)
    enc.stdin.close()
    enc.wait()
    print("wrote", out_dir / name)


if __name__ == "__main__":
    main()
