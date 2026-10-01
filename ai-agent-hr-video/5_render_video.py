"""Step 5: render the final motion-graphics video.

Gemini illustrations (with slow camera moves) + animated Khmer text + glass UI cards
+ branded scene wipes, mixed with the Gemini Khmer voice, Lyria music and whoosh effects.

Usage:
  python3 5_render_video.py                 -> ai_agent_hr_khmer.mp4
  python3 5_render_video.py --stills 3 12   -> preview PNGs at those seconds
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
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
W, H, FPS, SS = 1920, 1080, 30, 2          # SS = supersampling factor for overlays
SR, MIX_SR = 24000, 48000
TEMPO = float(os.environ.get("VOICE_TEMPO", "1.08"))
LEAD, TAIL, END_CARD = 0.55, 0.45, 3.4
WIPE = 0.75                                 # duration of one wipe bar
KB_OVERSIZE = 1.15                          # source image size vs frame for camera moves
OUTPUT = os.path.join(HERE, "ai_agent_hr_khmer.mp4")

FONT_DIR = os.path.join(HERE, "fonts")
FONT_URLS = {
    "moul": "https://raw.githubusercontent.com/google/fonts/main/ofl/moul/Moul-Regular.ttf",
    "body": "https://raw.githubusercontent.com/google/fonts/main/ofl/battambang/Battambang-Regular.ttf",
    "bold": "https://raw.githubusercontent.com/google/fonts/main/ofl/battambang/Battambang-Bold.ttf",
}

GREEN = (60, 181, 74)
GREEN_L = (150, 236, 160)
ORANGE = (232, 115, 26)
BLUE = (86, 152, 255)
PURPLE = (150, 110, 250)
PINK = (244, 114, 182)
WHITE = (255, 255, 255)
MUTED = (196, 208, 228)
NAVY = (8, 17, 40)
INK = (12, 22, 48)
SKIN = [(241, 196, 160), (224, 172, 130), (198, 140, 100)]
HAIR = (38, 30, 28)

# Camera move per scene: (zoom start, zoom end, pan x start, pan x end, pan y)
CAMERA = [
    (1.00, 1.10, 0.3, 0.0, 0.0), (1.10, 1.02, -0.2, 0.3, 0.1), (1.02, 1.12, 0.4, 0.2, -0.1),
    (1.12, 1.03, 0.0, 0.4, 0.0), (1.00, 1.10, 0.5, 0.2, 0.1), (1.10, 1.01, 0.1, 0.5, -0.1),
    (1.02, 1.11, 0.4, 0.1, 0.0), (1.11, 1.02, 0.0, 0.4, 0.1), (1.00, 1.12, 0.2, 0.2, -0.2),
]
# Glass UI card per scene: (x, y, width, height) in 1920x1080 units
CARD = {key: (575, 452, 380, 318) for key in
        ("intro", "recruit", "schedule", "leave", "report", "training")}
CARD["onboard"] = (540, 452, 340, 318)
CARD["chat"] = (575, 440, 380, 360)


# ---------------------------------------------------------------- basics
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
    key = (kind, round(size, 1))
    if key not in _font_cache:
        _font_cache[key] = ImageFont.truetype(
            FONTS[kind], int(size * SS), layout_engine=ImageFont.Layout.RAQM)
    return _font_cache[key]


def text_w(s, kind, size):
    return font(kind, size).getlength(s) / SS


def clamp(v, lo=0.0, hi=1.0):
    return max(lo, min(hi, v))


def lerp(a, b, u):
    return a + (b - a) * u


def out_cubic(x):
    return 1 - (1 - x) ** 3


def out_back(x):
    return 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2


def in_out(x):
    return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2


def prog(t, t0, d=0.5, ease=out_cubic):
    if t <= t0:
        return 0.0
    if t >= t0 + d:
        return 1.0
    return ease((t - t0) / d)


def pop(t, t0, d=0.5):
    """Scale (with overshoot) and opacity for a pop-in animation."""
    e = prog(t, t0, d, out_back)
    return e, clamp(e * 1.6)


def rgba(c, a):
    return (c[0], c[1], c[2], int(round(255 * clamp(a))))


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
    """Alpha-blended drawing in 1920x1080 units onto a supersampled RGB frame."""

    def __init__(self, img):
        self.img = img
        self.d = ImageDraw.Draw(img, "RGBA")

    def rrect(self, x0, y0, x1, y1, r, fill=None, a=1.0, outline=None, w=0, oa=None):
        if a <= 0.004 or x1 - x0 < 1 or y1 - y0 < 1:
            return
        r = max(0, min(r, (x1 - x0) / 2, (y1 - y0) / 2))
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
        if a > 0.004:
            self.d.chord([(cx - r) * SS, (cy - r) * SS, (cx + r) * SS, (cy + r) * SS],
                         start, end, fill=rgba(color, a))

    def poly(self, pts, color, a):
        if a > 0.004:
            self.d.polygon([(x * SS, y * SS) for x, y in pts], fill=rgba(color, a))

    def text(self, x, y, s, kind, size, color, a, anchor="lm", shadow=0.0):
        if a <= 0.004 or not s:
            return
        if shadow:
            self.d.text(((x + 2) * SS, (y + 3) * SS), s, font=font(kind, size),
                        fill=rgba((0, 0, 0), a * shadow), anchor=anchor)
        self.d.text((x * SS, y * SS), s, font=font(kind, size), fill=rgba(color, a), anchor=anchor)


# ---------------------------------------------------------------- small drawings
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


def check_badge(c, cx, cy, r, a, p=1.0, color=GREEN):
    if a <= 0.004 or r <= 1:
        return
    c.circle(cx, cy, r * 1.35, color, a * 0.25)
    c.circle(cx, cy, r, color, a)
    pts = [(cx - 0.45 * r, cy + 0.02 * r), (cx - 0.12 * r, cy + 0.34 * r), (cx + 0.48 * r, cy - 0.32 * r)]
    partial_line(c, pts, p, WHITE, a, max(2.5, r * 0.2))


def orb(c, cx, cy, r, a, t, rings=True):
    """Mini AI Agent orb, matching the glowing orb in the illustrations."""
    if a <= 0.004 or r <= 1:
        return
    if rings:
        for k in range(2):
            u = (t * 0.7 + k * 0.5) % 1
            c.circle(cx, cy, r * (1.1 + 0.9 * u), outline=GREEN_L, a=a * (1 - u) * 0.6, w=2)
    c.circle(cx, cy, r * 1.35, GREEN, a * 0.18)
    c.circle(cx, cy, r, GREEN, a)
    c.circle(cx - r * 0.25, cy - r * 0.3, r * 0.45, GREEN_L, a * 0.55)
    c.circle(cx + r * 0.55, cy + r * 0.45, r * 0.18, ORANGE, a)


def mini_person(c, cx, cy, s, shirt, a, skin=0):
    c.rrect(cx - 17 * s, cy + 13 * s, cx + 17 * s, cy + 44 * s, 13 * s, shirt, a)
    c.circle(cx, cy, 12 * s, SKIN[skin % 3], a)
    c.chord(cx, cy - 1.5 * s, 12.5 * s, 180, 360, HAIR, a)


def lines(c, x, y, widths, a, gap=14, h=6, color=WHITE, ca=0.35):
    for i, w in enumerate(widths):
        c.rrect(x, y + i * gap, x + w, y + i * gap + h, h / 2, color, a * ca)


def envelope(c, cx, cy, s, a):
    c.rrect(cx - 16 * s, cy - 11 * s, cx + 16 * s, cy + 11 * s, 3 * s, WHITE, a)
    c.line([(cx - 15 * s, cy - 9 * s), (cx, cy + 2 * s), (cx + 15 * s, cy - 9 * s)], ORANGE, a, 2 * s)


def heart(c, cx, cy, s, color, a):
    c.circle(cx - s * 0.5, cy - s * 0.2, s * 0.55, color, a)
    c.circle(cx + s * 0.5, cy - s * 0.2, s * 0.55, color, a)
    c.poly([(cx - s * 1.02, cy - s * 0.02), (cx + s * 1.02, cy - s * 0.02), (cx, cy + s * 1.05)], color, a)


def dashed(c, p0, p1, p, color, a, w, t, dash=8, gap=6):
    total = math.dist(p0, p1)
    length = total * clamp(p)
    if length < 1:
        return
    ux, uy = (p1[0] - p0[0]) / total, (p1[1] - p0[1]) / total
    s = -((t * 30) % (dash + gap))
    while s < length:
        a0, a1 = max(0, s), min(length, s + dash)
        if a1 > a0:
            c.line([(p0[0] + ux * a0, p0[1] + uy * a0), (p0[0] + ux * a1, p0[1] + uy * a1)], color, a, w)
        s += dash + gap


# ---------------------------------------------------------------- card bodies
# Each draws inside the card body box (x, y, w, h). t = scene time, k(f) = time at fraction f of voice.

def body_intro(c, x, y, w, h, t, a, k):
    ox, oy = x + w / 2, y + 40
    people = [(x + w * 0.18, ORANGE, 0), (x + w * 0.5, BLUE, 1), (x + w * 0.82, PURPLE, 2)]
    for i, (px, col, sk) in enumerate(people):
        py = y + h - 62
        lp = prog(t, k(0.15 + 0.12 * i), 0.5)
        dashed(c, (ox, oy + 26), (px, py - 18), lp, WHITE, a * 0.5, 2, t)
        if lp >= 1:
            u = ((t - k(0.3)) * 0.6 + i * 0.33) % 1
            c.circle(lerp(ox, px, u), lerp(oy + 26, py - 18, u), 4, ORANGE, a)
        e, pa = pop(t, k(0.1 + 0.12 * i))
        mini_person(c, px, py, 1.05 * max(0.2, e), col, a * pa, skin=sk)
        if t > k(0.55 + 0.1 * i):
            check_badge(c, px + 20, py - 12, 9 * prog(t, k(0.55 + 0.1 * i), 0.4, out_back), a)
    e, oa = pop(t, 0.9, 0.6)
    orb(c, ox, oy, 24 * max(0.2, e), a * oa, t)


def body_recruit(c, x, y, w, h, t, a, k):
    rows = [(0.92, True), (0.5, False), (0.86, True), (0.38, False)]
    rh = h / 4
    for i, (target, good) in enumerate(rows):
        ry = y + rh * i + rh / 2
        e, ra = pop(t, k(0.03 + 0.07 * i), 0.45)
        ra *= a
        judged = prog(t, k(0.55), 0.5)
        if not good:
            ra *= 1 - 0.55 * judged
        dx = (1 - e) * 30
        c.circle(x + 22 + dx, ry, 15, (191, 219, 254), ra)
        c.circle(x + 22 + dx, ry - 4, 6, (96, 165, 250), ra)
        c.rrect(x + 13 + dx, ry + 3, x + 31 + dx, ry + 10, 4, (96, 165, 250), ra)
        lines(c, x + 50 + dx, ry - 9, [w * 0.3, w * 0.18], ra, gap=12, h=6)
        bx0, bx1 = x + w * 0.5, x + w - 40
        c.rrect(bx0, ry - 5, bx1, ry + 5, 5, WHITE, ra * 0.15)
        fill = target * prog(t, k(0.12 + 0.08 * i), 0.9, in_out)
        c.rrect(bx0, ry - 5, bx0 + (bx1 - bx0) * fill, ry + 5, 5, GREEN if good else ORANGE, ra)
        if good and judged > 0:
            check_badge(c, x + w - 18, ry, 12 * prog(t, k(0.55), 0.4, out_back), a, p=judged)


def body_schedule(c, x, y, w, h, t, a, k):
    cols, rows = 5, 3
    cw, rh = w / cols, (h - 28) / rows
    for i in range(cols):
        c.rrect(x + i * cw + 8, y + 2, x + (i + 1) * cw - 8, y + 12, 5, WHITE, a * 0.22)
    for r in range(rows + 1):
        c.line([(x, y + 26 + r * rh), (x + w, y + 26 + r * rh)], WHITE, a * 0.1, 1)
    slots = [(0, 1, GREEN), (1, 0, BLUE), (2, 2, GREEN), (3, 1, PURPLE), (4, 0, ORANGE)]
    for i, (col, row, color) in enumerate(slots):
        te = k(0.06 + 0.15 * i)
        e, pa = pop(t, te, 0.45)
        bx, by = x + col * cw + 5, y + 26 + row * rh + 5
        bw, bh = cw - 10, rh - 10
        cx, cy = bx + bw / 2, by + bh / 2
        if e > 0:
            c.rrect(cx - bw / 2 * e, cy - bh / 2 * e, cx + bw / 2 * e, cy + bh / 2 * e, 8, color, a * pa)
            c.circle(bx + 14, cy, 6 * e, WHITE, a * pa * 0.9)
            c.rrect(bx + 25, cy - 3, bx + 25 + (bw - 34) * e, cy + 3, 3, WHITE, a * pa * 0.7)
        u = prog(t, te + 0.3, 0.9, in_out)
        if 0 < u < 1:
            envelope(c, lerp(cx, x + w + 40, u), lerp(cy, y - 60, u) - math.sin(u * math.pi) * 40, 1.0,
                     a * (1 - u ** 3))


def body_onboard(c, x, y, w, h, t, a, k):
    rh = h / 4
    for i in range(4):
        ry = y + rh * i + rh / 2
        tp = prog(t, k(0.06 + 0.17 * i), 0.45)
        e, ra = pop(t, k(0.02 + 0.05 * i), 0.4)
        ra *= a
        c.rrect(x + 4, ry - 15, x + 34, ry + 15, 8, GREEN if tp > 0 else None, ra,
                outline=GREEN if tp > 0 else WHITE, w=2, oa=ra * (1 if tp > 0 else 0.5))
        if tp > 0:
            partial_line(c, [(x + 11, ry), (x + 17, ry + 7), (x + 28, ry - 7)], tp, WHITE, ra, 3.5)
        lines(c, x + 52, ry - 9, [w - 110 - 40 * (i % 2), (w - 110) * 0.55], ra, gap=13, h=6,
              ca=0.55 if tp > 0 else 0.3)


def body_chat(c, x, y, w, h, t, a, k):
    msgs = [("R", 0.02, 0.6, BLUE), ("L", 0.3, 0.72, GREEN), ("R", 0.52, 0.5, BLUE), ("L", 0.76, 0.68, GREEN)]
    bh = 50
    for i, (side, f, frac, col) in enumerate(msgs):
        by = y + i * (bh + 18)
        bw = w * frac
        te = k(f)
        if side == "L" and te - 0.9 < t < te:
            c.rrect(x, by + 6, x + 74, by + 42, 18, WHITE, a * 0.2)
            for j in range(3):
                c.circle(x + 20 + j * 17, by + 24 + math.sin(t * 8 - j * 0.8) * 3, 5, WHITE, a * 0.85)
        e, ba = pop(t, te, 0.4)
        if e <= 0:
            continue
        bx = x if side == "L" else x + w - bw
        dx = (1 - e) * (-24 if side == "L" else 24)
        c.rrect(bx + dx, by, bx + bw + dx, by + bh, 18, col, a * ba)
        lines(c, bx + 16 + dx, by + 15, [bw - 32, (bw - 32) * 0.6], a * ba, gap=13, h=6, ca=0.85)


def body_leave(c, x, y, w, h, t, a, k):
    ny = y + 50
    emp, mid, mgr = (x + 40, ny), (x + w / 2, ny), (x + w - 40, ny)
    dashed(c, (emp[0] + 28, ny + 10), (mid[0] - 34, ny + 10), prog(t, 0.9, 0.5), WHITE, a * 0.45, 2, t)
    dashed(c, (mid[0] + 34, ny + 10), (mgr[0] - 28, ny + 10), prog(t, 1.2, 0.5), WHITE, a * 0.45, 2, t)
    mini_person(c, emp[0], ny - 6, 1.1, BLUE, a * pop(t, 0.8)[1], skin=0)
    orb(c, mid[0], ny + 8, 20 * max(0.2, pop(t, 0.95)[0]), a * pop(t, 0.95)[1], t)
    mini_person(c, mgr[0], ny - 6, 1.1, (71, 85, 105), a * pop(t, 1.1)[1], skin=2)
    m1 = prog(t, k(0.15), k(0.35) - k(0.15), in_out)
    m2 = prog(t, k(0.45), k(0.62) - k(0.45), in_out)
    dxp = lerp(emp[0], mid[0], m1) if m2 <= 0 else lerp(mid[0], mgr[0], m2)
    hop = (math.sin(m1 * math.pi) + math.sin(m2 * math.pi)) * 26
    if t > k(0.05):
        da = a * prog(t, k(0.05), 0.3)
        c.rrect(dxp - 14, ny - 58 - hop, dxp + 14, ny - 24 - hop, 4, WHITE, da)
        c.rrect(dxp - 14, ny - 58 - hop, dxp + 14, ny - 48 - hop, 4, ORANGE, da)
        lines(c, dxp - 9, ny - 42 - hop, [18, 12], da, gap=8, h=3, color=INK, ca=0.4)
    e = prog(t, k(0.68), 0.45, out_back)
    check_badge(c, mgr[0] + 22, ny - 22, 12 * e, a, p=e)
    for i in range(7):
        cx, cy = x + 28 + i * (w - 56) / 6, y + h - 34
        fp = prog(t, k(0.1 + 0.1 * i), 0.35, out_back)
        c.circle(cx, cy, 16, None, a * 0.6, outline=WHITE, w=2)
        if fp > 0:
            c.circle(cx, cy, 16 * fp, ORANGE if i == 4 else GREEN, a)
            if i != 4:
                partial_line(c, [(cx - 7, cy), (cx - 2, cy + 5), (cx + 8, cy - 6)], fp, WHITE, a, 2.5)


def body_report(c, x, y, w, h, t, a, k):
    base = y + h - 14
    heights = [0.42, 0.62, 0.5, 0.8, 0.66, 0.94]
    for i, hg in enumerate(heights):
        g = prog(t, k(0.04 + 0.06 * i), 0.6, out_back)
        bx = x + 4 + i * 27
        c.rrect(bx, base - (h - 40) * hg * g, bx + 18, base, 5, GREEN if i % 2 == 0 else BLUE, a)
    c.line([(x, base + 2), (x + 166, base + 2)], WHITE, a * 0.3, 1.5)
    dcx, dcy, dr = x + w - 72, y + h / 2 - 6, 60
    sweep = prog(t, k(0.12), 1.3, in_out) * 360
    c.circle(dcx, dcy, dr, None, a * 0.18, outline=WHITE, w=20)
    for s0, s1, col in [(0, 0.55, GREEN), (0.55, 0.8, ORANGE), (0.8, 1.0, BLUE)]:
        if sweep > s0 * 360:
            c.arc(dcx, dcy, dr, -90 + s0 * 360, -90 + min(s1 * 360, sweep), col, a, 20)
    e = prog(t, k(0.85), 0.45, out_back)
    check_badge(c, dcx, dcy, 22 * e, a, p=e)


def body_training(c, x, y, w, h, t, a, k):
    rows = [(ORANGE, 0.9), (GREEN, 0.7), (PURPLE, 0.55)]
    rh = h / 3
    for i, (col, target) in enumerate(rows):
        ry = y + rh * i + rh / 2
        e, ra = pop(t, k(0.1 + 0.14 * i), 0.45)
        ra *= a
        dx = (1 - e) * 30
        c.rrect(x + dx, ry - 24, x + 44 + dx, ry + 24, 8, col, ra)
        c.line([(x + 22 + dx, ry - 17), (x + 22 + dx, ry + 17)], WHITE, ra * 0.8, 2)
        lines(c, x + 62 + dx, ry - 18, [170, 110], ra, gap=13, h=6)
        c.rrect(x + 62 + dx, ry + 10, x + w - 10, ry + 18, 4, WHITE, ra * 0.15)
        fill = target * prog(t, k(0.45 + 0.08 * i), 1.0, in_out)
        c.rrect(x + 62 + dx, ry + 10, x + 62 + dx + (w - 72 - dx) * fill, ry + 18, 4, col, ra)


def body_outro(c, x, y, w, h, t, a, k):
    ox, oy = x + w / 2, y + 44
    people = [(x + w * 0.18, ORANGE, 0), (x + w * 0.5, BLUE, 1), (x + w * 0.82, PURPLE, 2)]
    for i, (px, col, sk) in enumerate(people):
        py = y + h - 60
        lp = prog(t, 1.0 + 0.15 * i, 0.5)
        c.line([(ox, oy), (lerp(ox, px, lp), lerp(oy, py - 18, lp))], GREEN_L, a * 0.55 * lp, 2.5)
        mini_person(c, px, py, 1.05, col, a * pop(t, 0.8 + 0.12 * i)[1], skin=sk)
        for j in range(3):
            tt = t - (1.6 + i * 0.6 + j * 1.9)
            if 0 < tt < 1.8:
                heart(c, px + 18 + math.sin(tt * 3 + j) * 6, py - 30 - tt * 40, 8, PINK, a * (1 - tt / 1.8))
    e, oa = pop(t, 0.7, 0.6)
    orb(c, ox, oy, 26 * max(0.2, e), a * oa, t)


BODIES = {
    "intro": body_intro, "recruit": body_recruit, "schedule": body_schedule, "onboard": body_onboard,
    "chat": body_chat, "leave": body_leave, "report": body_report, "training": body_training,
    "outro": body_outro,
}


# ---------------------------------------------------------------- video
class Video:
    def __init__(self, script, durations):
        self.script = script
        self.timeline = []
        t = 0.0
        for i, (scene, ad) in enumerate(zip(script["scenes"], durations)):
            dur = LEAD + ad + TAIL
            item = {"scene": scene, "index": i, "start": t, "dur": dur, "audio": ad}
            item["title_lines"], item["title_size"] = fit(scene["title"], "moul", 58, 820, 2, 40)
            item["sub_lines"], item["sub_size"] = fit(scene["narration"], "body", 34, 1560, 2, 26)
            self.timeline.append(item)
            t += dur
        self.end_start = t
        self.total = t + END_CARD
        self.cuts = [it["start"] for it in self.timeline[1:]] + [self.end_start]
        self._load_images()
        self._build_grade()
        self._mask_cache = {}
        rnd = random.Random(3)
        self.dust = [(rnd.uniform(0, W), rnd.uniform(0, H), rnd.uniform(12, 38), rnd.uniform(1.2, 3.2),
                           rnd.uniform(0, 6.3), rnd.uniform(0.12, 0.4)) for _ in range(46)]

    # ---- background
    def _load_images(self):
        self.sources = []
        for i, it in enumerate(self.timeline):
            path = os.path.join(HERE, "images", f"{i:02d}_{it['scene']['key']}.jpg")
            img = Image.open(path).convert("RGB")
            iw, ih = img.size
            cw = min(iw, ih * 16 / 9)
            ch = cw * 9 / 16
            img = img.crop(((iw - cw) / 2, (ih - ch) / 2, (iw + cw) / 2, (ih + ch) / 2))
            self.sources.append(img.resize((int(W * KB_OVERSIZE), int(H * KB_OVERSIZE)), Image.LANCZOS))
        end = self.sources[-1].resize((W, H), Image.LANCZOS).filter(ImageFilter.GaussianBlur(22))
        arr = np.asarray(end, np.float32) * 0.32 + np.array(NAVY, np.float32) * 0.68
        self.end_bg = arr

    def _build_grade(self):
        x = np.linspace(0, 1, W, dtype=np.float32)[None, :]
        y = np.linspace(0, 1, H, dtype=np.float32)[:, None]

        def smooth(e0, e1, v):
            u = np.clip((v - e0) / (e1 - e0), 0, 1)
            return u * u * (3 - 2 * u)

        left = 0.86 * (1 - smooth(0.24, 0.62, x))
        bottom = 0.9 * smooth(0.70, 1.0, y)
        top = 0.55 * (1 - smooth(0.0, 0.16, y))
        a = 1 - (1 - left) * (1 - bottom) * (1 - top)
        vig = 1 - 0.28 * (((x - 0.55) / 0.75) ** 2 + ((y - 0.5) / 0.9) ** 2)
        self.g_mul = ((1 - a) * vig)[..., None].astype(np.float32)
        self.g_add = (a[..., None] * np.array(NAVY, np.float32)).astype(np.float32)

    def scene_background(self, i, t_local, dur):
        src = self.sources[i]
        sw, sh = src.size
        z0, z1, px0, px1, py = CAMERA[i % len(CAMERA)]
        u = clamp((t_local + WIPE) / (dur + 2 * WIPE))
        u = u * u * (3 - 2 * u) * 0.6 + u * 0.4
        z = lerp(z0, z1, u)
        cw, ch = sw / z, sh / z
        cx = sw / 2 + lerp(px0, px1, u) * (sw - cw) / 2
        cy = sh / 2 + py * (sh - ch) / 2
        img = src.transform((W, H), Image.AFFINE, (cw / W, 0, cx - cw / 2, 0, ch / H, cy - ch / 2),
                            resample=Image.BICUBIC)
        arr = np.asarray(img, np.float32) * self.g_mul + self.g_add
        return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB")

    # ---- glass card with blurred backdrop and soft shadow
    def _round_mask(self, w, h, r):
        key = (w, h, r)
        if key not in self._mask_cache:
            m = Image.new("L", (w * SS, h * SS), 0)
            ImageDraw.Draw(m).rounded_rectangle([0, 0, w * SS - 1, h * SS - 1], radius=r * SS, fill=255)
            pad = 40
            sh = Image.new("L", ((w + 2 * pad) * SS, (h + 2 * pad) * SS), 0)
            ImageDraw.Draw(sh).rounded_rectangle([pad * SS, pad * SS, (pad + w) * SS, (pad + h) * SS],
                                                 radius=r * SS, fill=150)
            sh = sh.resize((sh.width // 4, sh.height // 4)).filter(ImageFilter.GaussianBlur(7))
            sh = sh.resize(((w + 2 * pad) * SS, (h + 2 * pad) * SS), Image.BILINEAR)
            self._mask_cache[key] = (m, sh, pad)
        return self._mask_cache[key]

    def glass(self, frame, bg, box, r, a):
        x0, y0, w, h = [int(round(v)) for v in box]
        if a <= 0.01:
            return
        mask, shadow, pad = self._round_mask(w, h, r)
        sx, sy = (x0 - pad + 6) * SS, (y0 - pad + 14) * SS
        frame.paste((0, 0, 0), (sx, sy), shadow.point(lambda v: int(v * a)))
        region = bg.crop((x0, y0, x0 + w, y0 + h))
        blur = region.resize((max(1, w // 6), max(1, h // 6)), Image.BILINEAR).filter(ImageFilter.GaussianBlur(2))
        blur = blur.resize((w * SS, h * SS), Image.BILINEAR)
        blur = Image.blend(blur, Image.new("RGB", blur.size, (14, 26, 56)), 0.55)
        frame.paste(blur, (x0 * SS, y0 * SS), mask.point(lambda v: int(v * a)))

    # ---- overlays
    def particles(self, c, t, a=1.0):
        for (x0, y0, speed, r, ph, al) in self.dust:
            y = (y0 - t * speed) % (H + 40) - 20
            x = x0 + math.sin(t * 0.4 + ph) * 18
            tw = 0.6 + 0.4 * math.sin(t * 1.7 + ph * 3)
            c.circle(x, y, r * 2.6, (255, 236, 200), a * al * tw * 0.18)
            c.circle(x, y, r, (255, 244, 225), a * al * tw)

    def header(self, c, a):
        c.rrect(60, 36, 104, 80, 12, GREEN, a)
        c.text(82, 58, "AI", "bold", 21, WHITE, a, anchor="mm")
        c.text(120, 58, "AI For Business", "bold", 25, WHITE, a, shadow=0.4)

    def left_panel(self, c, item, t, a):
        n = len(self.timeline)
        e, pa = pop(t, 0.2, 0.5)
        c.rrect(110, 216, 110 + 74 * e, 220, 2, ORANGE, a * pa)
        c.text(110 + 86, 218, f"{kh_num(item['index'] + 1)}  /  {kh_num(n)}", "bold", 20, ORANGE, a * pa)
        size = item["title_size"]
        lh = size * 1.72
        y = 300
        for j, line in enumerate(item["title_lines"]):
            et = prog(t, 0.3 + 0.12 * j, 0.7)
            c.text(110, y + j * lh + (1 - et) * 34, line, "moul", size, WHITE, a * et, shadow=0.55)
        y_end = y + (len(item["title_lines"]) - 1) * lh + size * 0.95
        ul = prog(t, 0.6, 0.7)
        c.rrect(110, y_end + 8, 110 + 120 * ul, y_end + 15, 4, GREEN, a)
        c.rrect(110 + 130 * ul, y_end + 8, 110 + 130 * ul + 36 * ul, y_end + 15, 4, ORANGE, a)
        py = y_end + 92
        points = item["scene"]["points"]
        for j, ptxt in enumerate(points):
            tp = LEAD + item["audio"] * (0.06 + 0.6 * j / max(1, len(points)))
            ep, pa = pop(t, tp, 0.55)
            if ep <= 0:
                continue
            pa *= a
            x = 110 - (1 - ep) * 50
            w = text_w(ptxt, "bold", 30) + 112
            c.rrect(x, py - 35, x + w, py + 35, 35, WHITE, pa * 0.1)
            c.rrect(x, py - 35, x + w, py + 35, 35, None, pa, outline=WHITE, w=1.5, oa=pa * 0.25)
            check_badge(c, x + 38, py, 18, pa, p=prog(t, tp + 0.15, 0.4))
            c.text(x + 72, py, ptxt, "bold", 30, WHITE, pa, shadow=0.3)
            py += 92

    def card(self, frame, bg, c, item, t, a, k):
        key = item["scene"]["key"]
        if key not in CARD:
            return
        x, y, w, h = CARD[key]
        e = prog(t, 0.7, 0.7)
        ca = a * e
        y += (1 - e) * 40
        self.glass(frame, bg, (x, y, w, h), 22, ca)
        c.rrect(x, y, x + w, y + h, 22, None, ca, outline=WHITE, w=1.5, oa=ca * 0.28)
        c.rrect(x + 22, y + 1, x + w - 22, y + 3, 1, WHITE, ca * 0.25)
        orb(c, x + 32, y + 30, 10, ca, t, rings=False)
        c.text(x + 52, y + 30, "AI Agent", "bold", 19, WHITE, ca)
        pulse = 0.5 + 0.5 * math.sin(t * 4)
        c.circle(x + w - 30, y + 30, 6 + 4 * pulse, GREEN, ca * 0.3)
        c.circle(x + w - 30, y + 30, 6, GREEN, ca)
        c.line([(x + 18, y + 58), (x + w - 18, y + 58)], WHITE, ca * 0.12, 1)
        BODIES[key](c, x + 26, y + 76, w - 52, h - 98, t, ca, k)

    def subtitle(self, c, item, t, a):
        es = prog(t, LEAD - 0.15, 0.4)
        if es <= 0:
            return
        size = item["sub_size"]
        sub = item["sub_lines"]
        lh = size * 1.7
        total = sum(len(l) for l in sub)
        p = clamp((t - LEAD) / max(0.1, item["audio"] * 0.97))
        spoken = p * total
        done = 0
        base_y = H - 62 - (len(sub) - 1) * lh
        for j, line in enumerate(sub):
            ly = base_y + j * lh + (1 - es) * 14
            lw = text_w(line, "body", size)
            x = W / 2 - lw / 2
            words = line.split(" ")
            for wi, word in enumerate(words):
                prefix = " ".join(words[:wi]) + (" " if wi else "")
                wx = x + text_w(prefix, "body", size)
                w_start, w_end = done + len(prefix), done + len(prefix) + len(word)
                if spoken >= w_end:
                    col, wa = WHITE, 1.0
                elif spoken > w_start:
                    col, wa = GREEN_L, 1.0
                else:
                    col, wa = WHITE, 0.5
                c.text(wx, ly, word, "body", size, col, a * es * wa, anchor="lm", shadow=0.6)
            done += len(line)

    def wipe(self, c, t):
        """Branded diagonal wipe that fully covers the frame at each cut."""
        skew = 360
        bw = W + skew + 60
        for cut in self.cuts:
            for k_, (col, delay) in enumerate([(ORANGE, -0.1), (GREEN, -0.05), (NAVY, 0.0)]):
                t0 = cut - WIPE / 2 + delay
                if not (t0 <= t <= t0 + WIPE):
                    continue
                u = in_out((t - t0) / WIPE)
                xpos = lerp(-(bw + skew), W, u)
                c.poly([(xpos, H), (xpos + skew, 0), (xpos + skew + bw, 0), (xpos + bw, H)], col, 1.0)

    def end_card(self, frame, c, t):
        e, pa = pop(t, 0.35, 0.8)
        cx, cy = 960, 400
        s = 74 * max(0.2, e)
        c.circle(cx, cy, s * 1.9, GREEN, pa * 0.12)
        c.rrect(cx - s, cy - s, cx + s, cy + s, 32 * max(0.2, e), GREEN, pa)
        c.text(cx, cy, "AI", "bold", 66 * max(0.2, e), WHITE, pa, anchor="mm")
        e2 = prog(t, 0.65, 0.8)
        c.text(cx, 565 + (1 - e2) * 24, "AI For Business", "bold", 64, WHITE, e2, anchor="mm", shadow=0.4)
        e3 = prog(t, 0.95, 0.8)
        lines_, size = fit(self.script["video_title"], "moul", 36, 1500, 1, 26)
        c.text(cx, 668 + (1 - e3) * 20, lines_[0], "moul", size, MUTED, e3, anchor="mm")
        ul = prog(t, 1.2, 0.8)
        c.rrect(cx - 110 * ul, 740, cx - 2, 747, 4, GREEN, 1)
        c.rrect(cx + 2, 740, cx + 110 * ul, 747, 4, ORANGE, 1)

    def frame(self, t):
        if t >= self.end_start:
            te = t - self.end_start
            z = 1.0 + 0.03 * te / END_CARD
            bg = Image.fromarray(np.clip(self.end_bg, 0, 255).astype(np.uint8), "RGB")
            if z > 1.0:
                bg = bg.resize((int(W * z), int(H * z)), Image.BILINEAR).crop(
                    (int(W * (z - 1) / 2), int(H * (z - 1) / 2), int(W * (z - 1) / 2) + W, int(H * (z - 1) / 2) + H))
            frame = bg.resize((W * SS, H * SS), Image.NEAREST)
            c = Canvas(frame)
            self.particles(c, t)
            self.end_card(frame, c, te)
            self.wipe(c, t)
            fade = prog(t, self.total - 0.7, 0.7)
            if fade > 0:
                c.rrect(0, 0, W, H, 0, (0, 0, 0), fade)
            return frame.reduce(SS)

        item = next(it for it in self.timeline if it["start"] <= t < it["start"] + it["dur"])
        lt = t - item["start"]
        bg = self.scene_background(item["index"], lt, item["dur"])
        frame = bg.resize((W * SS, H * SS), Image.NEAREST)
        c = Canvas(frame)
        A = 1 - prog(lt, item["dur"] - 0.25, 0.25)

        def k(f, item=item):
            return LEAD + item["audio"] * f

        self.particles(c, t, 0.8)
        self.card(frame, bg, c, item, lt, A, k)
        self.left_panel(c, item, lt, A)
        self.subtitle(c, item, lt, A)
        self.header(c, 1.0)
        c.rrect(0, H - 5, W, H, 0, WHITE, 0.12)
        c.rrect(0, H - 5, W * t / self.total, H, 0, GREEN, 0.95)
        self.wipe(c, t)
        if t < 0.8:
            c.rrect(0, 0, W, H, 0, (0, 0, 0), 1 - prog(t, 0, 0.8, in_out))
        return frame.reduce(SS)


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


def write_wav(path, samples, rate):
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(samples.astype(np.int16).tobytes())


def whoosh(dur=0.9):
    n = int(dur * MIX_SR)
    t = np.arange(n) / MIX_SR
    noise = np.random.default_rng(5).standard_normal(n)
    cutoff = 250 + 3200 * np.sin(np.pi * t / dur) ** 1.6
    alpha = 1 - np.exp(-2 * np.pi * cutoff / MIX_SR)
    out = np.empty(n)
    y1 = y2 = 0.0
    for i in range(n):
        y1 += alpha[i] * (noise[i] - y1)
        y2 += alpha[i] * (y1 - y2)
        out[i] = y2
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2
    out *= env
    return out / np.abs(out).max()


def build_audio(video, clips):
    voice = np.zeros(int(math.ceil(video.total * SR)), np.int16)
    for item, clip in zip(video.timeline, clips):
        s = int((item["start"] + LEAD) * SR)
        voice[s:s + len(clip)] = clip[:len(voice) - s]
    voice_path = os.path.join(HERE, "audio", "narration_full.wav")
    write_wav(voice_path, voice, SR)

    sfx = np.zeros(int(math.ceil(video.total * MIX_SR)))
    w = whoosh()
    for cut in video.cuts:
        s = int((cut - 0.5) * MIX_SR)
        e = min(len(sfx), s + len(w))
        sfx[s:e] += w[:e - s] * 0.16 * 32767
    sfx_path = os.path.join(HERE, "audio", "sfx_full.wav")
    write_wav(sfx_path, np.clip(sfx, -32767, 32767), MIX_SR)
    return voice_path, sfx_path


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

    voice_path, sfx_path = build_audio(video, clips)
    music_path = os.path.join(HERE, "audio", "music.mp3")
    total = video.total
    audio_filter = (
        f"[1:a]aresample={MIX_SR},asplit=2[v1][v2];"
        f"[2:a]aresample={MIX_SR},volume=0.22,afade=t=in:st=0:d=1.5,"
        f"afade=t=out:st={total - 3:.2f}:d=3,atrim=0:{total:.2f}[m];"
        f"[m][v2]sidechaincompress=threshold=0.015:ratio=5:attack=20:release=450[md];"
        f"[3:a]aresample={MIX_SR}[s];"
        f"[v1][md][s]amix=inputs=3:normalize=0:duration=first,alimiter=limit=0.95[aout]"
    )
    n_frames = int(total * FPS)
    ff = subprocess.Popen([
        "ffmpeg", "-y", "-loglevel", "error",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
        "-i", voice_path, "-i", music_path, "-i", sfx_path,
        "-filter_complex", audio_filter, "-map", "0:v", "-map", "[aout]",
        "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-ac", "2",
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
