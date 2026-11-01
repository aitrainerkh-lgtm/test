"""Render a branded 9:16 tip video for the AI For Business Facebook page.

Usage: python3 render.py <spec.json> <out.mp4>

Supports English and Khmer ("lang": "km"). Khmer text is drawn with Moul
(headings) and Battambang (body); Latin words inside Khmer lines (AI, Email,
ChatGPT ...) are drawn with Inter, so mixed lines render without missing glyphs.
"""
import json, math, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont

W, H, FPS = 1080, 1920, 30
NAVY, NAVY2 = (11, 27, 58), (20, 48, 98)
TEAL, ORANGE, WHITE, SOFT = (0, 194, 168), (255, 153, 51), (255, 255, 255), (190, 205, 230)
INTER = "/usr/share/fonts/opentype/inter/Inter-{}.otf"
KFONTS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts")
_cache = {}


def _load(path, size):
    key = (path, size)
    if key not in _cache:
        _cache[key] = ImageFont.truetype(path, size)
    return _cache[key]


class Style:
    """A text style: a Latin font plus an optional Khmer font of matching size."""

    def __init__(self, latin_weight, size, khmer=None, khmer_scale=1.0, gap=1.25):
        self.size = size
        self.latin = _load(INTER.format(latin_weight), size)
        self.khmer = _load(os.path.join(KFONTS, khmer), int(size * khmer_scale)) if khmer else None
        self.gap = gap


def is_khmer(ch):
    o = ord(ch)
    return 0x1780 <= o <= 0x17FF or 0x19E0 <= o <= 0x19FF or o in (0x200B, 0x200C, 0x200D)


def runs(text, st):
    """Split text into (substring, font) runs by script. Spaces stay with the current run."""
    out, cur, cur_k = [], "", None
    for ch in text:
        k = is_khmer(ch) if ch != " " else cur_k
        if cur and k != cur_k:
            out.append((cur, cur_k)); cur = ""
        cur += ch; cur_k = k
    if cur:
        out.append((cur, cur_k))
    return [(s, st.khmer if (k and st.khmer) else st.latin) for s, k in out]


def width(d, text, st):
    return sum(d.textlength(s, font=f) for s, f in runs(text, st))


def draw_line(d, x, baseline, text, st, fill):
    for s, f in runs(text, st):
        d.text((x, baseline), s, font=f, fill=fill, anchor="ls")
        x += d.textlength(s, font=f)


def wrap(d, text, st, maxw):
    """Wrap on spaces and '|' (forced break). Khmer phrases should be separated by spaces."""
    lines = []
    for para in text.split("|"):
        cur = ""
        for word in para.split(" "):
            test = (cur + " " + word).strip()
            if width(d, test, st) <= maxw or not cur:
                cur = test
            else:
                lines.append(cur); cur = word
        if cur:
            lines.append(cur)
    return lines


def ease(t):
    t = max(0.0, min(1.0, t))
    return 1 - (1 - t) ** 3


def mix(color, a):
    return tuple(int(color[i] * a + NAVY[i] * (1 - a)) for i in range(3))


def text_block(d, lines, st, y, color, alpha, dy, center=True, x=90):
    """Draw lines; y is the top of the block. Returns the y below the block."""
    step = int(st.size * st.gap)
    for ln in lines:
        lx = (W - width(d, ln, st)) / 2 if center else x
        draw_line(d, lx, y + dy + st.size, ln, st, mix(color, alpha))
        y += step
    return y


def background():
    img = Image.new("RGB", (W, H), NAVY)
    d = ImageDraw.Draw(img)
    for y in range(H):
        k = y / H
        d.line([(0, y), (W, y)], fill=tuple(int(NAVY[i] + (NAVY2[i] - NAVY[i]) * k) for i in range(3)))
    return img


def styles(lang):
    if lang == "km":
        return {
            "kicker": Style("SemiBold", 50, "Battambang-Bold.woff", 1.12, 1.6),
            "hook": Style("ExtraBold", 84, "Moul-Regular.woff", 0.95, 1.7),
            "sub": Style("Medium", 48, "Battambang-Regular.woff", 1.12, 1.8),
            "tip": Style("ExtraBold", 80, "Battambang-Bold.woff", 1.12, 1.6),
            "badge": Style("ExtraBold", 120, "Battambang-Bold.woff", 1.0),
            "label": Style("Bold", 42, "Battambang-Bold.woff", 1.12),
            "how": Style("Medium", 50, "Battambang-Regular.woff", 1.12, 1.8),
            "cta": Style("ExtraBold", 80, "Moul-Regular.woff", 0.95, 1.7),
            "tools": Style("SemiBold", 56, None, 1.0, 1.3),
            "button": Style("Bold", 50, "Battambang-Bold.woff", 1.12),
        }
    return {
        "kicker": Style("SemiBold", 52), "hook": Style("ExtraBold", 104, gap=1.15),
        "sub": Style("Medium", 50), "tip": Style("ExtraBold", 92, gap=1.15),
        "badge": Style("ExtraBold", 130), "label": Style("Bold", 36),
        "how": Style("Medium", 54, gap=1.3), "cta": Style("ExtraBold", 96, gap=1.15),
        "tools": Style("SemiBold", 56), "button": Style("Bold", 54),
    }


BG = background()


def frame(spec, S, t, total):
    img = BG.copy(); d = ImageDraw.Draw(img)
    brand = Style("Bold", 40)
    d.rounded_rectangle([60, 70, 520, 150], 40, fill=TEAL)
    draw_line(d, 95, 125, "AI For Business", brand, NAVY)
    d.rectangle([0, H - 14, int(W * t / total), H], fill=ORANGE)

    start = 0.0
    for sc in spec["scenes"]:
        if start <= t < start + sc["dur"]:
            lt = t - start; break
        start += sc["dur"]
    else:
        sc, lt = spec["scenes"][-1], spec["scenes"][-1]["dur"]

    out = min(1.0, max(0.0, (sc["dur"] - lt) / 0.35))
    a1, a2, a3 = (ease((lt - k) / 0.6) * out for k in (0.0, 0.4, 0.8))

    if sc["type"] == "hook":
        y = sc.get("y", 680)
        y = text_block(d, wrap(d, sc["kicker"], S["kicker"], 900), S["kicker"], y, TEAL, a1, (1 - a1) * 40)
        y += 30
        y = text_block(d, wrap(d, sc["title"], S["hook"], 920), S["hook"], y, WHITE, a2, (1 - a2) * 60)
        y += 40
        text_block(d, wrap(d, sc["sub"], S["sub"], 900), S["sub"], y, SOFT, a3, (1 - a3) * 40)

    elif sc["type"] == "tip":
        cx, cy, r = W // 2, 640, 120
        if a1 > 0.01:
            rr = int(r * (0.6 + 0.4 * a1))
            d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=mix(ORANGE, a1))
            n = str(sc["n"]); bs = S["badge"]
            draw_line(d, cx - width(d, n, bs) / 2, cy + bs.size * 0.36, n, bs, NAVY)
        y = 840
        y = text_block(d, wrap(d, sc["title"], S["tip"], 920), S["tip"], y, WHITE, a2, (1 - a2) * 50)
        y += 50
        hs = S["how"]
        lines = wrap(d, sc["how"], hs, 790)
        box_top = y
        box_h = len(lines) * int(hs.size * hs.gap) + 120
        off = (1 - a3) * 40
        if a3 > 0.01:
            col = tuple(min(255, int(NAVY2[i] * 1.3 * a3 + NAVY[i] * (1 - a3))) for i in range(3))
            d.rounded_rectangle([90, box_top + off, W - 90, box_top + box_h + off], 36, fill=col)
            draw_line(d, 130, box_top + 70 + off, spec.get("how_label", "HOW"), S["label"], mix(TEAL, a3))
        text_block(d, lines, hs, box_top + 95, WHITE, a3, off, center=False, x=130)

    elif sc["type"] == "cta":
        y = sc.get("y", 700)
        y = text_block(d, wrap(d, sc["title"], S["cta"], 920), S["cta"], y, WHITE, a1, (1 - a1) * 50)
        y += 40
        y = text_block(d, sc["tools"].split("|"), S["tools"], y, TEAL, a2, (1 - a2) * 40)
        y += 100
        if a3 > 0.01:
            pulse = 1 + 0.03 * math.sin(lt * 5)
            bw, bh = int(840 * pulse), int(150 * pulse)
            d.rounded_rectangle([(W - bw) // 2, y, (W + bw) // 2, y + bh], 75, fill=mix(ORANGE, a3))
            bs = S["button"]
            draw_line(d, (W - width(d, sc["button"], bs)) / 2, y + bh / 2 + bs.size * 0.36, sc["button"], bs, NAVY)
    return img


def main(spec_path, out_path):
    spec = json.load(open(spec_path, encoding="utf-8"))
    S = styles(spec.get("lang", "en"))
    total = sum(s["dur"] for s in spec["scenes"])
    p = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
        "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo", "-shortest",
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "medium", "-crf", "20",
        "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", out_path], stdin=subprocess.PIPE)
    for i in range(int(total * FPS)):
        p.stdin.write(frame(spec, S, i / FPS, total).tobytes())
    p.stdin.close(); p.wait()
    print("done", out_path, total, "s")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
