"""Step 3: render the motion-graphics video (Khmer text on screen + Gemini voice-over).

Usage:
  python3 3_render_video.py                 -> ai_agent_hr_khmer.mp4
  python3 3_render_video.py --stills 3 12   -> preview PNGs at those seconds
"""
import json
import math
import os
import random
import subprocess
import sys
import urllib.request
import wave

import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
W, H, FPS, SS = 1920, 1080, 30, 2          # SS = supersampling factor
SR = 24000
TEMPO = float(os.environ.get("VOICE_TEMPO", "1.08"))
LEAD, TAIL, END_CARD = 0.4, 0.4, 2.8
OUTPUT = os.path.join(HERE, "ai_agent_hr_khmer.mp4")

FONT_DIR = os.path.join(HERE, "fonts")
FONT_URLS = {
    "moul": "https://raw.githubusercontent.com/google/fonts/main/ofl/moul/Moul-Regular.ttf",
    "body": "https://raw.githubusercontent.com/google/fonts/main/ofl/battambang/Battambang-Regular.ttf",
    "bold": "https://raw.githubusercontent.com/google/fonts/main/ofl/battambang/Battambang-Bold.ttf",
}

# Palette
NAVY_TOP = np.array([10, 20, 46], float)
NAVY_BOT = np.array([14, 44, 74], float)
GREEN = (60, 181, 74)
GREEN_D = (27, 122, 61)
ORANGE = (232, 115, 26)
BLUE = (76, 141, 246)
PURPLE = (139, 92, 246)
TEAL = (20, 184, 166)
PINK = (244, 114, 182)
WHITE = (255, 255, 255)
MUTED = (176, 190, 214)
INK = (30, 41, 59)
LINE = (203, 213, 225)
PAPER = (248, 250, 252)
SKIN = [(241, 196, 160), (224, 172, 130), (198, 140, 100)]
HAIR = (38, 30, 28)
NAVY = (12, 24, 52)


# ---------------------------------------------------------------- helpers
def ensure_fonts():
    os.makedirs(FONT_DIR, exist_ok=True)
    paths = {}
    for key, url in FONT_URLS.items():
        path = os.path.join(FONT_DIR, url.rsplit("/", 1)[1])
        if not os.path.exists(path):
            urllib.request.urlretrieve(url, path)
        paths[key] = path
    return paths


FONTS = ensure_fonts()
_font_cache = {}


def font(kind, size):
    key = (kind, size)
    if key not in _font_cache:
        _font_cache[key] = ImageFont.truetype(
            FONTS[kind], int(size * SS), layout_engine=ImageFont.Layout.RAQM)
    return _font_cache[key]


def text_w(s, kind, size):
    return font(kind, size).getlength(s) / SS


def clamp(v, lo=0.0, hi=1.0):
    return max(lo, min(hi, v))


def out_cubic(x):
    return 1 - (1 - x) ** 3


def out_back(x):
    c1, c3 = 1.70158, 2.70158
    return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2


def in_out(x):
    return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2


def prog(t, t0, d=0.5, ease=out_cubic):
    """Eased 0..1 progress of an animation that starts at t0 and lasts d."""
    if t <= t0:
        return 0.0
    if t >= t0 + d:
        return 1.0
    return ease((t - t0) / d)


def rgba(c, a):
    return (c[0], c[1], c[2], int(round(255 * clamp(a))))


def lerp(a, b, u):
    return a + (b - a) * u


def kh_num(n):
    return "".join("០១២៣៤៥៦៧៨៩"[int(ch)] for ch in f"{n:02d}")


def wrap(s, kind, size, maxw):
    lines, cur = [], ""
    for word in s.split(" "):
        trial = (cur + " " + word).strip()
        if cur and text_w(trial, kind, size) > maxw:
            lines.append(cur)
            cur = word
        else:
            cur = trial
    lines.append(cur)
    return lines


def fit(s, kind, size, maxw, max_lines, min_size):
    while size > min_size:
        lines = wrap(s, kind, size, maxw)
        if len(lines) <= max_lines and all(text_w(l, kind, size) <= maxw for l in lines):
            return lines, size
        size -= 2
    return wrap(s, kind, min_size, maxw), min_size


class Canvas:
    """Draws in 1920x1080 design units onto a supersampled RGB frame (alpha-blended)."""

    def __init__(self, img):
        self.d = ImageDraw.Draw(img, "RGBA")

    def rrect(self, x0, y0, x1, y1, r, fill=None, a=1.0, outline=None, w=0, oa=None):
        if a <= 0.004 or x1 - x0 < 1 or y1 - y0 < 1:
            return
        r = min(r, (x1 - x0) / 2, (y1 - y0) / 2)
        self.d.rounded_rectangle(
            [x0 * SS, y0 * SS, x1 * SS, y1 * SS], radius=r * SS,
            fill=rgba(fill, a) if fill else None,
            outline=rgba(outline, a if oa is None else oa) if outline else None,
            width=max(1, int(w * SS)) if outline else 0)

    def circle(self, cx, cy, r, fill=None, a=1.0, outline=None, w=0):
        if a <= 0.004 or r <= 0.5:
            return
        self.d.ellipse([(cx - r) * SS, (cy - r) * SS, (cx + r) * SS, (cy + r) * SS],
                       fill=rgba(fill, a) if fill else None,
                       outline=rgba(outline, a) if outline else None,
                       width=max(1, int(w * SS)) if outline else 0)

    def line(self, pts, color, a, w):
        if a <= 0.004 or len(pts) < 2:
            return
        self.d.line([(x * SS, y * SS) for x, y in pts], fill=rgba(color, a),
                    width=max(1, int(w * SS)), joint="curve")

    def arc(self, cx, cy, r, start, end, color, a, w):
        if a <= 0.004 or end - start < 0.5:
            return
        self.d.arc([(cx - r) * SS, (cy - r) * SS, (cx + r) * SS, (cy + r) * SS],
                   start, end, fill=rgba(color, a), width=max(1, int(w * SS)))

    def chord(self, cx, cy, r, start, end, color, a):
        if a <= 0.004:
            return
        self.d.chord([(cx - r) * SS, (cy - r) * SS, (cx + r) * SS, (cy + r) * SS],
                     start, end, fill=rgba(color, a))

    def poly(self, pts, color, a):
        if a <= 0.004:
            return
        self.d.polygon([(x * SS, y * SS) for x, y in pts], fill=rgba(color, a))

    def text(self, x, y, s, kind, size, color, a, anchor="lm"):
        if a <= 0.004 or not s:
            return
        self.d.text((x * SS, y * SS), s, font=font(kind, size), fill=rgba(color, a), anchor=anchor)


# ---------------------------------------------------------------- shared drawings
def shadow_card(c, x0, y0, x1, y1, r, a, fill=PAPER):
    c.rrect(x0 + 6, y0 + 10, x1 + 6, y1 + 10, r, (0, 0, 0), a * 0.28)
    c.rrect(x0, y0, x1, y1, r, fill, a)


def pill(c, cx, cy, s, bg, fg, size, a, kind="bold", pad=18):
    w = text_w(s, kind, size) + pad * 2
    h = size * 1.9
    c.rrect(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2, h / 2, bg, a)
    c.text(cx, cy, s, kind, size, fg, a, anchor="mm")


def person(c, cx, cy, s, shirt, a, skin=0, label=None, label_bg=None):
    """Flat person avatar; (cx, cy) is the centre of the head."""
    if a <= 0.004 or s <= 0.02:
        return
    c.rrect(cx - 44 * s, cy + 34 * s, cx + 44 * s, cy + 112 * s, 34 * s, shirt, a)
    c.poly([(cx - 10 * s, cy + 34 * s), (cx + 10 * s, cy + 34 * s), (cx, cy + 50 * s)], WHITE, a * 0.9)
    c.circle(cx, cy, 30 * s, SKIN[skin % 3], a)
    c.chord(cx, cy - 3 * s, 31 * s, 180, 360, HAIR, a)
    c.circle(cx - 10 * s, cy + 4 * s, 3 * s, HAIR, a)
    c.circle(cx + 10 * s, cy + 4 * s, 3 * s, HAIR, a)
    c.arc(cx, cy + 8 * s, 10 * s, 30, 150, HAIR, a, 2.5 * s)
    if label:
        pill(c, cx, cy + 138 * s, label, label_bg or shirt, WHITE, 19 * s, a)


def agent(c, cx, cy, r, a, t, label=True):
    """The AI Agent avatar: a glowing orb with a visor face."""
    if a <= 0.004 or r <= 1:
        return
    for k in range(2):
        u = (t * 0.6 + k * 0.5) % 1
        c.circle(cx, cy, r * (1.1 + 0.7 * u), outline=GREEN, a=a * (1 - u) * 0.55, w=3)
    c.circle(cx, cy, r * 1.14, GREEN, a * 0.22)
    c.circle(cx, cy, r, GREEN, a)
    c.chord(cx, cy, r, 200, 340, (120, 214, 130), a * 0.55)
    c.rrect(cx - 0.66 * r, cy - 0.36 * r, cx + 0.66 * r, cy + 0.34 * r, 0.32 * r, NAVY, a)
    blink = 0.15 if (t % 3.1) < 0.12 else 1.0
    eh = 0.15 * r * blink
    for ex in (-0.3, 0.3):
        c.rrect(cx + ex * r - 0.075 * r, cy - 0.04 * r - eh, cx + ex * r + 0.075 * r,
                cy - 0.04 * r + eh, 0.07 * r, (120, 240, 200), a)
    c.circle(cx + 0.72 * r, cy - 0.72 * r, 0.13 * r, ORANGE, a)
    if label:
        pill(c, cx, cy + r + 34, "AI Agent", ORANGE, WHITE, 20, a)


def check_badge(c, cx, cy, r, a, p=1.0, color=GREEN):
    if a <= 0.004 or r <= 1:
        return
    c.circle(cx, cy, r, color, a)
    pts = [(cx - 0.45 * r, cy + 0.02 * r), (cx - 0.12 * r, cy + 0.34 * r), (cx + 0.48 * r, cy - 0.32 * r)]
    partial_line(c, pts, p, WHITE, a, max(3, r * 0.2))


def partial_line(c, pts, p, color, a, w):
    segs = [math.dist(pts[i], pts[i + 1]) for i in range(len(pts) - 1)]
    left = sum(segs) * clamp(p)
    out = [pts[0]]
    for i, sl in enumerate(segs):
        if left <= 0:
            break
        u = min(1, left / sl)
        out.append((lerp(pts[i][0], pts[i + 1][0], u), lerp(pts[i][1], pts[i + 1][1], u)))
        left -= sl
    c.line(out, color, a, w)


def dashed(c, p0, p1, p, color, a, w, t, dash=14, gap=10):
    """Dashed line from p0 towards p1, drawn up to fraction p, with marching dashes."""
    length = math.dist(p0, p1) * clamp(p)
    if length < 1:
        return
    ux, uy = (p1[0] - p0[0]) / math.dist(p0, p1), (p1[1] - p0[1]) / math.dist(p0, p1)
    s = -((t * 40) % (dash + gap))
    while s < length:
        a0, a1 = max(0, s), min(length, s + dash)
        if a1 > a0:
            c.line([(p0[0] + ux * a0, p0[1] + uy * a0), (p0[0] + ux * a1, p0[1] + uy * a1)], color, a, w)
        s += dash + gap


def envelope(c, cx, cy, s, a):
    c.rrect(cx - 30 * s, cy - 20 * s, cx + 30 * s, cy + 20 * s, 5 * s, WHITE, a)
    c.line([(cx - 28 * s, cy - 17 * s), (cx, cy + 4 * s), (cx + 28 * s, cy - 17 * s)], ORANGE, a, 3 * s)


def heart(c, cx, cy, s, color, a):
    c.circle(cx - s * 0.5, cy - s * 0.2, s * 0.55, color, a)
    c.circle(cx + s * 0.5, cy - s * 0.2, s * 0.55, color, a)
    c.poly([(cx - s * 1.02, cy - s * 0.02), (cx + s * 1.02, cy - s * 0.02), (cx, cy + s * 1.05)], color, a)


def grey_lines(c, x, y, widths, a, gap=20, h=8, color=LINE):
    for i, w in enumerate(widths):
        c.rrect(x, y + i * gap, x + w, y + i * gap + h, h / 2, color, a)


# ---------------------------------------------------------------- scenes
# Each scene draws its illustration in the right half of the screen.
# t = seconds since scene start, A = scene opacity, k(f) = time at fraction f of the voice-over.

def sc_intro(c, t, A, k):
    ppl = [(1130, 560, ORANGE, 0), (1390, 610, BLUE, 1), (1650, 560, PURPLE, 2)]
    ag = (1390, 300)
    e_ag = prog(t, 0.8, 0.7, out_back)
    for i, (x, y, col, sk) in enumerate(ppl):
        el = prog(t, 1.4 + 0.25 * i, 0.6)
        dashed(c, (ag[0], ag[1] + 60), (x, y - 40), el, MUTED, A * 0.8, 3, t)
        if el >= 1:
            u = ((t - 2.0) * 0.55 + i * 0.33) % 1
            c.circle(lerp(ag[0], x, u), lerp(ag[1] + 60, y - 40, u), 7, ORANGE, A)
    for i, (x, y, col, sk) in enumerate(ppl):
        e = prog(t, 0.15 + 0.15 * i, 0.6, out_back)
        if e <= 0:
            continue
        aa = A * clamp(e * 1.5)
        yy = y + (1 - e) * 50
        person(c, x, yy, 1.0, col, aa, skin=sk)
        c.rrect(x - 105, yy + 80, x + 105, yy + 100, 8, (226, 232, 240), aa)
        c.rrect(x - 42, yy + 48, x + 42, yy + 82, 5, (148, 163, 184), aa)
        c.circle(x, yy + 64, 5, WHITE, aa)
        pill(c, x, yy + 132, "HR", col, WHITE, 19, aa)
    agent(c, ag[0], ag[1], 72 * e_ag, A * clamp(e_ag * 1.5), t)


def cv_card(c, cx, cy, a, s=1.0, border=None):
    w, h = 76 * s, 96 * s
    shadow_card(c, cx - w, cy - h, cx + w, cy + h, 14 * s, a)
    if border:
        c.rrect(cx - w, cy - h, cx + w, cy + h, 14 * s, None, a, outline=border, w=5)
    c.text(cx - w + 16 * s, cy - h + 24 * s, "CV", "bold", 18 * s, INK, a)
    c.circle(cx, cy - 32 * s, 24 * s, (191, 219, 254), a)
    c.circle(cx, cy - 38 * s, 9 * s, (96, 165, 250), a)
    c.rrect(cx - 15 * s, cy - 26 * s, cx + 15 * s, cy - 12 * s, 7 * s, (96, 165, 250), a)
    grey_lines(c, cx - w + 18 * s, cy + 12 * s, [120 * s, 96 * s, 108 * s, 70 * s], a, gap=18 * s, h=7 * s)


def sc_recruit(c, t, A, k):
    xs, ys = [1090, 1280, 1470], [370, 610]
    good = {0, 4, 5}
    t_scan0, t_scan1 = k(0.12), k(0.55)
    beam_x = lerp(980, 1580, prog(t, t_scan0, t_scan1 - t_scan0, in_out))
    for idx in range(6):
        cx, cy = xs[idx % 3], ys[idx // 3]
        e = prog(t, 0.1 + 0.08 * idx, 0.5, out_back)
        aa = A * clamp(e * 1.5)
        passed = beam_x > cx and t > t_scan0
        u = prog(t, t_scan0 + (cx - 980) / 600 * (t_scan1 - t_scan0), 0.4)
        if passed and idx not in good:
            aa *= 1 - 0.6 * u
        cv_card(c, cx, cy + (1 - e) * 40, aa, border=GREEN if passed and idx in good else None)
        if passed and idx in good:
            eb = prog(t, t_scan0 + (cx - 980) / 600 * (t_scan1 - t_scan0), 0.45, out_back)
            check_badge(c, cx + 70, cy - 90, 22 * eb, A, p=eb)
    if t_scan0 < t < t_scan1 + 0.3:
        ba = A * (1 - prog(t, t_scan1, 0.3))
        c.rrect(beam_x - 22, 240, beam_x + 22, 740, 10, GREEN, ba * 0.18)
        c.rrect(beam_x - 3, 240, beam_x + 3, 740, 3, (120, 240, 170), ba)
    e_ag = prog(t, 0.3, 0.6, out_back)
    agent(c, 1000, 205, 42 * e_ag, A * clamp(e_ag * 1.5), t, label=False)
    e_hr = prog(t, k(0.62), 0.6, out_back)
    person(c, 1730, 470 + (1 - e_hr) * 40, 1.0, ORANGE, A * clamp(e_hr * 1.5), skin=1, label="HR")
    e_ok = prog(t, k(0.78), 0.5, out_back)
    check_badge(c, 1730, 340, 38 * e_ok, A, p=e_ok, color=ORANGE)


def sc_schedule(c, t, A, k):
    x0, y0, x1, y1 = 1000, 220, 1640, 720
    e = prog(t, 0.1, 0.6, out_back)
    aa = A * clamp(e * 1.5)
    dy = (1 - e) * 40
    shadow_card(c, x0, y0 + dy, x1, y1 + dy, 22, aa)
    c.rrect(x0, y0 + dy, x1, y0 + 64 + dy, 22, ORANGE, aa)
    c.rrect(x0, y0 + 40 + dy, x1, y0 + 64 + dy, 0, ORANGE, aa)
    for i in range(3):
        c.circle(x0 + 34 + i * 26, y0 + 32 + dy, 7, WHITE, aa * 0.85)
    days = ["ច័ន្ទ", "អង្គារ", "ពុធ", "ព្រហស្បតិ៍", "សុក្រ"]
    cw = (x1 - x0 - 40) / 5
    for i, d in enumerate(days):
        c.text(x0 + 20 + cw * (i + 0.5), y0 + 100 + dy, d, "bold", 19, INK, aa, anchor="mm")
    gy0, rh = y0 + 135, 140 / 1.0 * 0.6
    for r in range(5):
        c.line([(x0 + 20, gy0 + r * rh + dy), (x1 - 20, gy0 + r * rh + dy)], LINE, aa, 2)
    slots = [(0, 1, GREEN), (1, 0, BLUE), (2, 2, GREEN), (3, 1, PURPLE), (4, 3, BLUE)]
    for i, (col, row, color) in enumerate(slots):
        te = k(0.08 + 0.15 * i)
        es = prog(t, te, 0.45, out_back)
        if es > 0:
            bx = x0 + 20 + cw * col + 8
            by = gy0 + row * rh + 6 + dy
            bw, bh = cw - 16, rh - 12
            cx, cy = bx + bw / 2, by + bh / 2
            c.rrect(cx - bw / 2 * es, cy - bh / 2 * es, cx + bw / 2 * es, cy + bh / 2 * es, 10, color, A)
            c.circle(bx + 22, cy, 11 * es, WHITE, A * 0.9)
            c.rrect(bx + 40, cy - 4, bx + 40 + (bw - 56) * es, cy + 4, 4, WHITE, A * 0.7)
        u = prog(t, te + 0.35, 1.0, in_out)
        if 0 < u < 1:
            sx = x0 + 20 + cw * col + cw / 2
            sy = gy0 + row * rh + rh / 2 + dy
            envelope(c, lerp(sx, 1820, u), lerp(sy, 260, u) - math.sin(u * math.pi) * 80, 1.0, A * (1 - u ** 3))
    e_ag = prog(t, 0.4, 0.6, out_back)
    agent(c, 1735, 640, 46 * e_ag, A * clamp(e_ag * 1.5), t)


def sc_onboard(c, t, A, k):
    x0, y0, x1, y1 = 1030, 210, 1500, 740
    e = prog(t, 0.1, 0.6, out_back)
    aa = A * clamp(e * 1.5)
    dy = (1 - e) * 40
    shadow_card(c, x0, y0 + dy, x1, y1 + dy, 22, aa)
    c.rrect(x0 + 40, y0 + 46 + dy, x0 + 250, y0 + 62 + dy, 8, GREEN_D, aa)
    c.rrect(x0 + 40, y0 + 78 + dy, x0 + 180, y0 + 90 + dy, 6, LINE, aa)
    for i in range(4):
        ry = y0 + 165 + i * 105 + dy
        tp = prog(t, k(0.08 + 0.17 * i), 0.5)
        c.rrect(x0 + 40, ry - 22, x0 + 84, ry + 22, 10, GREEN if tp > 0 else None, aa if tp > 0 else 0,
                outline=GREEN if tp > 0 else (148, 163, 184), w=3, oa=aa)
        if tp > 0:
            partial_line(c, [(x0 + 50, ry), (x0 + 59, ry + 10), (x0 + 75, ry - 11)], tp, WHITE, aa, 5)
        grey_lines(c, x0 + 110, ry - 14, [260 - 30 * (i % 2), 180], aa, gap=22, h=9,
                   color=(148, 163, 184) if tp > 0 else LINE)
    e_ag = prog(t, 0.35, 0.6, out_back)
    agent(c, x0 + 6, y0 + 6, 40 * e_ag, A * clamp(e_ag * 1.5), t, label=False)
    e_p = prog(t, 0.5, 0.6, out_back)
    px, py = 1700, 450
    person(c, px, py + (1 - e_p) * 40, 1.15, TEAL, A * clamp(e_p * 1.5), skin=2)
    e_w = prog(t, k(0.72), 0.5, out_back)
    if e_w > 0:
        pill(c, px, py - 95 - (1 - e_w) * 20, "ស្វាគមន៍", ORANGE, WHITE, 24 * max(0.3, e_w), A * clamp(e_w * 1.5))
    tb = t - k(0.75)
    if 0 < tb < 2.2:
        rnd = random.Random(7)
        for i in range(22):
            ang = rnd.uniform(-math.pi, 0)
            sp = rnd.uniform(160, 330)
            x = px + math.cos(ang) * sp * tb
            y = py - 40 + math.sin(ang) * sp * tb + 260 * tb * tb
            col = [GREEN, ORANGE, BLUE, PINK, (250, 204, 21)][i % 5]
            sz = rnd.uniform(5, 9)
            c.rrect(x - sz, y - sz / 2, x + sz, y + sz / 2, 2, col, A * (1 - tb / 2.2))


def bubble(c, side, y, w, a, color, e):
    x_in = 1252 if side == "L" else 1528 - w
    dx = (1 - e) * (-30 if side == "L" else 30)
    c.rrect(x_in + dx, y, x_in + w + dx, y + 70, 22, color, a * clamp(e * 1.5))
    grey_lines(c, x_in + 20 + dx, y + 22, [w - 40, (w - 40) * 0.6], a * clamp(e * 1.5), gap=18, h=8,
               color=(255, 255, 255))


def sc_chat(c, t, A, k):
    x0, y0, x1, y1 = 1220, 170, 1560, 800
    e = prog(t, 0.1, 0.6, out_back)
    aa = A * clamp(e * 1.5)
    dy = (1 - e) * 40
    c.rrect(x0 + 6, y0 + 12 + dy, x1 + 6, y1 + 12 + dy, 44, (0, 0, 0), aa * 0.3)
    c.rrect(x0, y0 + dy, x1, y1 + dy, 44, (28, 38, 66), aa)
    c.rrect(x0 + 14, y0 + 14 + dy, x1 - 14, y1 - 14 + dy, 32, (241, 245, 249), aa)
    c.rrect(x0 + 14, y0 + 14 + dy, x1 - 14, y0 + 84 + dy, 32, WHITE, aa)
    c.rrect(x0 + 14, y0 + 60 + dy, x1 - 14, y0 + 84 + dy, 0, WHITE, aa)
    c.circle(x0 + 58, y0 + 52 + dy, 18, GREEN, aa)
    c.text(x0 + 88, y0 + 52 + dy, "AI Agent", "bold", 20, INK, aa)
    c.circle(x1 - 50, y0 + 52 + dy, 6, GREEN, aa)
    msgs = [("R", 0.02, 200, BLUE), ("L", 0.32, 250, GREEN), ("R", 0.52, 170, BLUE), ("L", 0.78, 240, GREEN)]
    for i, (side, f, w, col) in enumerate(msgs):
        y = y0 + 120 + i * 100 + dy
        te = k(f)
        if side == "L":
            typing0 = te - 0.9
            if typing0 < t < te:
                c.rrect(1252, y, 1342, y + 50, 22, (203, 213, 225), A)
                for j in range(3):
                    bob = math.sin((t * 8) - j * 0.8) * 4
                    c.circle(1275 + j * 22, y + 25 + bob, 6, (100, 116, 139), A)
        eb = prog(t, te, 0.45, out_back)
        if eb > 0:
            bubble(c, side, y, w, A, col, eb)
    e_ag = prog(t, 0.3, 0.6, out_back)
    agent(c, 1085, 420, 52 * e_ag, A * clamp(e_ag * 1.5), t)
    e_p = prog(t, 0.45, 0.6, out_back)
    person(c, 1700, 520 + (1 - e_p) * 40, 1.0, BLUE, A * clamp(e_p * 1.5), skin=0)
    e_c = prog(t, k(0.4), 0.5, out_back)
    if e_c > 0:
        cx, cy, r = 1700, 300, 50 * e_c
        ca = A * clamp(e_c * 1.5)
        c.circle(cx, cy, r, WHITE, ca)
        c.circle(cx, cy, r, None, ca, outline=ORANGE, w=6)
        ang = t * 2.4
        c.line([(cx, cy), (cx + math.cos(ang) * r * 0.65, cy + math.sin(ang) * r * 0.65)], INK, ca, 5)
        ang2 = t * 0.3
        c.line([(cx, cy), (cx + math.cos(ang2) * r * 0.42, cy + math.sin(ang2) * r * 0.42)], INK, ca, 6)
        c.circle(cx, cy, 6 * e_c, ORANGE, ca)


def leave_card(c, cx, cy, a, s=1.0, filled=0.0):
    shadow_card(c, cx - 42 * s, cy - 52 * s, cx + 42 * s, cy + 52 * s, 10 * s, a)
    c.rrect(cx - 42 * s, cy - 52 * s, cx + 42 * s, cy - 26 * s, 10 * s, ORANGE, a)
    c.rrect(cx - 42 * s, cy - 36 * s, cx + 42 * s, cy - 26 * s, 0, ORANGE, a)
    for r in range(3):
        for col in range(4):
            on = (r * 4 + col) in (5, 6)
            c.rrect(cx - 30 * s + col * 16 * s, cy - 14 * s + r * 18 * s, cx - 20 * s + col * 16 * s,
                    cy - 4 * s + r * 18 * s, 2 * s, ORANGE if on else LINE, a)
    if filled > 0:
        check_badge(c, cx + 36 * s, cy + 44 * s, 16 * s * filled, a, p=filled)


def sc_leave(c, t, A, k):
    emp, ag, mgr = (1080, 400), (1390, 430), (1700, 400)
    for i, (p0, p1) in enumerate([((emp[0] + 60, 450), (ag[0] - 75, 450)), ((ag[0] + 75, 450), (mgr[0] - 60, 450))]):
        dashed(c, p0, p1, prog(t, 0.6 + 0.3 * i, 0.6), MUTED, A * 0.8, 3, t)
    e1 = prog(t, 0.15, 0.6, out_back)
    person(c, emp[0], emp[1] + (1 - e1) * 40, 1.0, BLUE, A * clamp(e1 * 1.5), skin=0,
           label="បុគ្គលិក")
    e2 = prog(t, 0.3, 0.6, out_back)
    agent(c, ag[0], ag[1], 62 * e2, A * clamp(e2 * 1.5), t)
    e3 = prog(t, 0.45, 0.6, out_back)
    person(c, mgr[0], mgr[1] + (1 - e3) * 40, 1.0, (51, 65, 85), A * clamp(e3 * 1.5), skin=2,
           label="ប្រធានផ្នែក", label_bg=PURPLE)
    tc0 = k(0.05)
    if t > tc0:
        m1 = prog(t, k(0.18), k(0.38) - k(0.18), in_out)
        m2 = prog(t, k(0.5), k(0.68) - k(0.5), in_out)
        if m2 <= 0:
            x = lerp(emp[0] + 20, ag[0], m1)
        else:
            x = lerp(ag[0], mgr[0] - 20, m2)
        hop = math.sin(m1 * math.pi) * 70 + math.sin(m2 * math.pi) * 70
        ec = prog(t, tc0, 0.4, out_back)
        leave_card(c, x, 270 - hop, A * clamp(ec * 1.5), s=max(0.2, ec), filled=prog(t, k(0.4), 0.4, out_back))
    e_ok = prog(t, k(0.72), 0.5, out_back)
    check_badge(c, mgr[0] + 62, mgr[1] + 70, 30 * e_ok, A, p=e_ok)
    for i in range(7):
        cx, cy = 1150 + i * 80, 720
        fp = prog(t, k(0.1 + 0.11 * i), 0.35, out_back)
        c.circle(cx, cy, 24, None, A * 0.9, outline=MUTED, w=3)
        if fp > 0:
            col = ORANGE if i == 4 else GREEN
            c.circle(cx, cy, 24 * fp, col, A)
            if i != 4:
                partial_line(c, [(cx - 10, cy), (cx - 3, cy + 8), (cx + 11, cy - 8)], fp, WHITE, A, 4)


def sc_report(c, t, A, k):
    x0, y0, x1, y1 = 990, 200, 1660, 720
    e = prog(t, 0.1, 0.6, out_back)
    aa = A * clamp(e * 1.5)
    dy = (1 - e) * 40
    shadow_card(c, x0, y0 + dy, x1, y1 + dy, 22, aa)
    c.text(x0 + 36, y0 + 50 + dy, "HR Report", "bold", 24, INK, aa)
    for i in range(3):
        c.circle(x1 - 40 - i * 22, y0 + 50 + dy, 6, [GREEN, ORANGE, BLUE][i], aa)
    c.line([(x0 + 30, y0 + 86 + dy), (x1 - 30, y0 + 86 + dy)], LINE, aa, 2)
    base = y0 + 470 + dy
    heights = [0.45, 0.62, 0.52, 0.8, 0.68, 0.92]
    for i, hgt in enumerate(heights):
        g = prog(t, k(0.05 + 0.07 * i), 0.6, out_back)
        bx = x0 + 50 + i * 56
        c.rrect(bx, base - 300 * hgt * g, bx + 36, base, 8, GREEN if i % 2 == 0 else BLUE, aa)
    c.line([(x0 + 40, base + 2), (x0 + 390, base + 2)], (148, 163, 184), aa, 2)
    dcx, dcy, dr = x1 - 150, y0 + 230 + dy, 92
    sweep = prog(t, k(0.15), 1.2, in_out) * 360
    segs = [(0, 0.55, GREEN), (0.55, 0.8, ORANGE), (0.8, 1.0, BLUE)]
    c.circle(dcx, dcy, dr, None, aa, outline=(226, 232, 240), w=30)
    for s0, s1, col in segs:
        a0, a1 = -90 + s0 * 360, -90 + min(s1 * 360, sweep)
        if sweep > s0 * 360:
            c.arc(dcx, dcy, dr, a0, a1, col, aa, 30)
    for i, col in enumerate([GREEN, ORANGE, BLUE]):
        ly = y0 + 380 + i * 34 + dy
        c.rrect(dcx - 90, ly - 7, dcx - 76, ly + 7, 4, col, aa)
        c.rrect(dcx - 62, ly - 5, dcx - 62 + [120, 90, 70][i], ly + 5, 5, LINE, aa)
    e_p = prog(t, k(0.5), 0.6, out_back)
    person(c, 1770, 540 + (1 - e_p) * 40, 1.0, ORANGE, A * clamp(e_p * 1.5), skin=1, label="HR")
    m = prog(t, k(0.58), k(0.95) - k(0.58), in_out)
    if m > 0:
        mx = lerp(x0 + 80, x0 + 360, m)
        my = y0 + 300 + math.sin(m * math.pi * 2) * 40 + dy
        ma = A * prog(t, k(0.58), 0.3)
        c.line([(mx + 38, my + 38), (mx + 72, my + 72)], (51, 65, 85), ma, 14)
        c.circle(mx, my, 50, (255, 255, 255), ma * 0.25)
        c.circle(mx, my, 50, None, ma, outline=(51, 65, 85), w=10)
    e_ok = prog(t, k(0.9), 0.5, out_back)
    check_badge(c, 1770, 400, 32 * e_ok, A, p=e_ok)


def course_card(c, y, color, fill, a, dx):
    x0, x1 = 1440 + dx, 1800 + dx
    shadow_card(c, x0, y - 62, x1, y + 62, 18, a)
    c.rrect(x0 + 22, y - 38, x0 + 82, y + 38, 8, color, a)
    c.line([(x0 + 52, y - 30), (x0 + 52, y + 30)], WHITE, a * 0.8, 3)
    grey_lines(c, x0 + 104, y - 30, [200, 140], a, gap=22, h=10)
    c.rrect(x0 + 104, y + 22, x1 - 24, y + 34, 6, (226, 232, 240), a)
    if fill > 0:
        c.rrect(x0 + 104, y + 22, x0 + 104 + (x1 - x0 - 128) * fill, y + 34, 6, color, a)


def sc_training(c, t, A, k):
    st = (1080, 470)
    ag = (1270, 290)
    e_s = prog(t, 0.15, 0.6, out_back)
    person(c, st[0], st[1] + (1 - e_s) * 40, 1.15, BLUE, A * clamp(e_s * 1.5), skin=0, label="បុគ្គលិក")
    rows = [(290, ORANGE, 0.9), (470, GREEN, 0.7), (650, PURPLE, 0.55)]
    dashed(c, (st[0] + 40, st[1] - 30), (ag[0] - 40, ag[1] + 30), prog(t, 0.6, 0.5), MUTED, A * 0.8, 3, t)
    for i, (y, col, target) in enumerate(rows):
        el = prog(t, k(0.1 + 0.14 * i), 0.6)
        dashed(c, (ag[0] + 50, ag[1] + 10), (1430, y), el, MUTED, A * 0.8, 3, t)
    for i, (y, col, target) in enumerate(rows):
        ec = prog(t, k(0.15 + 0.14 * i), 0.5, out_back)
        fill = target * prog(t, k(0.55 + 0.08 * i), 1.0, in_out)
        course_card(c, y, col, fill, A * clamp(ec * 1.5), (1 - ec) * 60)
    e_ag = prog(t, 0.4, 0.6, out_back)
    agent(c, ag[0], ag[1], 46 * e_ag, A * clamp(e_ag * 1.5), t, label=False)
    e_up = prog(t, k(0.7), 0.6, out_back)
    if e_up > 0:
        bob = math.sin(t * 4) * 6
        ux, uy = st[0] - 100, st[1] - 60 + bob - 30 * e_up
        ua = A * clamp(e_up * 1.5)
        c.poly([(ux, uy - 40), (ux - 26, uy - 8), (ux + 26, uy - 8)], GREEN, ua)
        c.rrect(ux - 10, uy - 10, ux + 10, uy + 34, 4, GREEN, ua)


def sc_outro(c, t, A, k):
    ag = (1390, 330)
    ppl = [(1120, 560, ORANGE, 0), (1390, 610, BLUE, 1), (1660, 560, PURPLE, 2)]
    e_ag = prog(t, 0.2, 0.7, out_back)
    for i, (x, y, col, sk) in enumerate(ppl):
        el = prog(t, 0.8 + 0.2 * i, 0.5)
        c.line([(ag[0], ag[1]), (lerp(ag[0], x, el), lerp(ag[1], y - 30, el))], GREEN, A * 0.5 * el, 4)
    for i, (x, y, col, sk) in enumerate(ppl):
        e = prog(t, 0.3 + 0.15 * i, 0.6, out_back)
        aa = A * clamp(e * 1.5)
        person(c, x, y + (1 - e) * 50, 1.0, col, aa, skin=sk, label="HR")
        for j in range(3):
            tt = t - (1.5 + i * 0.7 + j * 2.2)
            if 0 < tt < 2.0:
                heart(c, x + 40 + math.sin(tt * 3 + j) * 12, y - 60 - tt * 70, 14, PINK, A * (1 - tt / 2.0))
    agent(c, ag[0], ag[1], 84 * e_ag, A * clamp(e_ag * 1.5), t)


SCENE_DRAW = {
    "intro": sc_intro, "recruit": sc_recruit, "schedule": sc_schedule, "onboard": sc_onboard,
    "chat": sc_chat, "leave": sc_leave, "report": sc_report, "training": sc_training, "outro": sc_outro,
}


# ---------------------------------------------------------------- layout
class Video:
    def __init__(self, script, durations):
        self.script = script
        self.timeline = []
        t = 0.0
        for i, (scene, ad) in enumerate(zip(script["scenes"], durations)):
            dur = LEAD + ad + TAIL
            self.timeline.append({"scene": scene, "index": i, "start": t, "dur": dur, "audio": ad})
            t += dur
        self.end_start = t
        self.total = t + END_CARD
        # Precompute text layout for each scene.
        for item in self.timeline:
            s = item["scene"]
            item["title_lines"], item["title_size"] = fit(s["title"], "moul", 54, 760, 2, 38)
            item["sub_lines"], item["sub_size"] = fit(s["narration"], "body", 32, 1500, 2, 24)
        self.bw, self.bh = 192, 108
        gy, gx = np.mgrid[0:self.bh, 0:self.bw]
        self.gx, self.gy = gx / self.bw, gy / self.bh
        g = (0.65 * self.gy + 0.35 * self.gx)[..., None]
        self.base = NAVY_TOP * (1 - g) + NAVY_BOT * g

    def background(self, t):
        img = self.base.copy()
        blobs = [
            ((60, 181, 74), 0.18 + 0.06 * math.sin(t * 0.21), 0.30 + 0.08 * math.cos(t * 0.17), 0.30, 0.22),
            ((232, 115, 26), 0.82 + 0.05 * math.cos(t * 0.19), 0.72 + 0.07 * math.sin(t * 0.23), 0.32, 0.16),
            ((76, 141, 246), 0.62 + 0.08 * math.sin(t * 0.13), 0.18 + 0.05 * math.cos(t * 0.29), 0.26, 0.12),
        ]
        for col, bx, by, r, s in blobs:
            d2 = ((self.gx - bx) * 1.78) ** 2 + (self.gy - by) ** 2
            img += np.array(col, float) * s * np.exp(-d2 / (r * r))[..., None]
        small = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), "RGB")
        frame = small.resize((W * SS, H * SS), Image.BILINEAR)
        c = Canvas(frame)
        for yy in range(150, 860, 46):
            for xx in range(40, 1900, 46):
                c.circle(xx, yy, 1.6, WHITE, 0.07)
        return frame, c

    def header(self, c, A):
        c.rrect(60, 34, 108, 82, 12, GREEN, A)
        c.text(84, 58, "AI", "bold", 22, WHITE, A, anchor="mm")
        c.text(124, 58, "AI For Business", "bold", 26, WHITE, A)
        title = self.script["video_title"]
        c.text(1860, 58, title, "body", 22, MUTED, A, anchor="rm")
        c.line([(60, 110), (1860, 110)], WHITE, A * 0.08, 2)

    def left_panel(self, c, item, t, A):
        n = len(self.timeline)
        e = prog(t, 0.05, 0.5, out_back)
        pill(c, 160, 228, f"{kh_num(item['index'] + 1)} / {kh_num(n)}", ORANGE, WHITE, 20, A * clamp(e * 1.5))
        size = item["title_size"]
        lh = size * 1.75
        y = 320
        for j, line in enumerate(item["title_lines"]):
            et = prog(t, 0.15 + 0.1 * j, 0.6)
            c.text(110 - (1 - et) * 40, y + j * lh, line, "moul", size, WHITE, A * et)
        y_end = y + (len(item["title_lines"]) - 1) * lh + size * 1.0
        ul = prog(t, 0.45, 0.6)
        c.rrect(110, y_end + 6, 110 + 140 * ul, y_end + 14, 4, GREEN, A)
        c.rrect(110 + 150 * ul, y_end + 6, 110 + 150 * ul + 40 * ul, y_end + 14, 4, ORANGE, A)
        py = y_end + 90
        points = item["scene"]["points"]
        for j, ptxt in enumerate(points):
            tp = LEAD + item["audio"] * (0.08 + 0.62 * j / max(1, len(points)))
            ep = prog(t, tp, 0.5, out_back)
            if ep <= 0:
                continue
            pa = A * clamp(ep * 1.5)
            x = 110 - (1 - ep) * 60
            w = text_w(ptxt, "bold", 30) + 120
            c.rrect(x, py - 36, x + w, py + 36, 36, WHITE, pa * 0.09)
            c.rrect(x, py - 36, x + w, py + 36, 36, None, pa, outline=WHITE, w=2, oa=pa * 0.14)
            check_badge(c, x + 40, py, 20, pa)
            c.text(x + 78, py, ptxt, "bold", 30, WHITE, pa)
            py += 96

    def subtitle(self, c, item, t, A):
        es = prog(t, LEAD - 0.1, 0.4)
        if es <= 0:
            return
        sa = A * es
        size = item["sub_size"]
        lines = item["sub_lines"]
        lh = size * 1.75
        bw = max(text_w(l, "body", size) for l in lines) + 90
        bh = len(lines) * lh + 34
        y1 = 1028
        y0 = y1 - bh
        c.rrect(960 - bw / 2, y0 + (1 - es) * 12, 960 + bw / 2, y1 + (1 - es) * 12, 22, (6, 12, 30), sa * 0.78)
        c.rrect(960 - bw / 2, y0 + (1 - es) * 12, 960 - bw / 2 + 8, y1 + (1 - es) * 12, 4, GREEN, sa)
        for j, line in enumerate(lines):
            c.text(960, y0 + 17 + lh * (j + 0.5) + (1 - es) * 12, line, "body", size, WHITE, sa, anchor="mm")

    def end_card(self, c, t):
        e = prog(t, 0.0, 0.8, out_back)
        a = clamp(e * 1.5)
        cx, cy = 960, 430
        c.rrect(cx - 70, cy - 70 - (1 - e) * 30, cx + 70, cy + 70 - (1 - e) * 30, 30, GREEN, a)
        c.text(cx, cy - (1 - e) * 30, "AI", "bold", 64, WHITE, a, anchor="mm")
        e2 = prog(t, 0.3, 0.7)
        c.text(cx, 590, "AI For Business", "bold", 60, WHITE, e2, anchor="mm")
        e3 = prog(t, 0.6, 0.7)
        lines, size = fit(self.script["video_title"], "moul", 36, 1500, 1, 26)
        c.text(cx, 690, lines[0], "moul", size, MUTED, e3, anchor="mm")
        ul = prog(t, 0.8, 0.7)
        c.rrect(cx - 120 * ul, 760, cx + 120 * ul, 768, 4, ORANGE, 1)

    def frame(self, t):
        img, c = self.background(t)
        if t >= self.end_start:
            te = t - self.end_start
            fade_out = 1 - prog(t, self.total - 0.6, 0.6)
            self.end_card(c, te)
            if fade_out < 1:
                c.rrect(0, 0, W, H, 0, (0, 0, 0), 1 - fade_out)
            return img.reduce(SS)
        item = next(it for it in self.timeline if it["start"] <= t < it["start"] + it["dur"])
        lt = t - item["start"]
        A = prog(lt, 0, 0.35) * (1 - prog(lt, item["dur"] - 0.3, 0.3))
        if item["index"] == 0:
            A = prog(lt, 0, 0.6)
        self.header(c, 1.0 if item["index"] else prog(t, 0, 0.8))

        def k(f, item=item):
            return LEAD + item["audio"] * f

        SCENE_DRAW[item["scene"]["key"]](c, lt, A, k)
        self.left_panel(c, item, lt, A)
        self.subtitle(c, item, lt, A)
        c.rrect(0, H - 6, W, H, 0, WHITE, 0.1)
        c.rrect(0, H - 6, W * t / self.total, H, 0, GREEN, 0.9)
        return img.reduce(SS)


# ---------------------------------------------------------------- audio
def load_voice(scenes):
    clips = []
    tmp = os.path.join(HERE, "audio", "_tempo.wav")
    for i, s in enumerate(scenes):
        src = os.path.join(HERE, "audio", f"{i:02d}_{s['key']}.wav")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-af",
                        f"atempo={TEMPO},silenceremove=start_periods=1:start_threshold=-45dB",
                        "-ar", str(SR), "-ac", "1", tmp], check=True)
        with wave.open(tmp) as w:
            clips.append(np.frombuffer(w.readframes(w.getnframes()), np.int16))
    os.remove(tmp)
    return clips


def build_track(video, clips, path):
    track = np.zeros(int(math.ceil(video.total * SR)) + SR, np.int16)
    for item, clip in zip(video.timeline, clips):
        s = int((item["start"] + LEAD) * SR)
        track[s:s + len(clip)] = clip
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(track[:int(video.total * SR)].tobytes())


def main():
    with open(os.path.join(HERE, "script.json"), encoding="utf-8") as f:
        script = json.load(f)
    clips = load_voice(script["scenes"])
    video = Video(script, [len(cl) / SR for cl in clips])
    print(f"Total length: {video.total:.1f}s")

    if "--stills" in sys.argv:
        os.makedirs(os.path.join(HERE, "preview"), exist_ok=True)
        for v in sys.argv[sys.argv.index("--stills") + 1:]:
            video.frame(float(v)).save(os.path.join(HERE, "preview", f"still_{float(v):05.1f}.png"))
        for it in video.timeline:
            print(f"  {it['scene']['key']:9s} {it['start']:5.1f}s  +{it['dur']:.1f}s")
        return

    narration = os.path.join(HERE, "audio", "narration_full.wav")
    build_track(video, clips, narration)
    n_frames = int(video.total * FPS)
    ff = subprocess.Popen([
        "ffmpeg", "-y", "-loglevel", "error",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
        "-i", narration,
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
        "-movflags", "+faststart", OUTPUT], stdin=subprocess.PIPE)
    for n in range(n_frames):
        ff.stdin.write(video.frame(n / FPS).tobytes())
        if n % (FPS * 5) == 0:
            print(f"  frame {n}/{n_frames}", flush=True)
    ff.stdin.close()
    if ff.wait() != 0:
        raise SystemExit("ffmpeg failed")
    print("Saved", OUTPUT)


if __name__ == "__main__":
    main()
