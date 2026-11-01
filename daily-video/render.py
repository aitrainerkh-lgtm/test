"""Render a branded 9:16 tip video for the AI For Business Facebook page."""
import json, subprocess, sys, math
from PIL import Image, ImageDraw, ImageFont

W, H, FPS = 1080, 1920, 30
NAVY, NAVY2 = (11, 27, 58), (20, 48, 98)
TEAL, ORANGE, WHITE, SOFT = (0, 194, 168), (255, 153, 51), (255, 255, 255), (190, 205, 230)
F = "/usr/share/fonts/opentype/inter/"
def font(w, s): return ImageFont.truetype(F + f"Inter-{w}.otf", s)

def ease(t): t = max(0.0, min(1.0, t)); return 1 - (1 - t) ** 3

def wrap(d, text, fnt, maxw):
    lines, cur = [], ""
    for word in text.split():
        test = (cur + " " + word).strip()
        if d.textlength(test, font=fnt) <= maxw: cur = test
        else: lines.append(cur); cur = word
    if cur: lines.append(cur)
    return lines

def background():
    img = Image.new("RGB", (W, H), NAVY)
    d = ImageDraw.Draw(img)
    for y in range(H):
        k = y / H
        d.line([(0, y), (W, y)], fill=tuple(int(NAVY[i] + (NAVY2[i] - NAVY[i]) * k) for i in range(3)))
    return img

BG = background()

def text_block(d, lines, fnt, y, color, alpha, dy, center=True, x=90, gap=1.25):
    c = tuple(int(color[i] * alpha + NAVY[i] * (1 - alpha)) for i in range(3))
    for ln in lines:
        tw = d.textlength(ln, font=fnt)
        d.text(((W - tw) / 2 if center else x, y + dy), ln, font=fnt, fill=c)
        y += int(fnt.size * gap)
    return y

def frame(spec, t, total):
    img = BG.copy(); d = ImageDraw.Draw(img)
    # header brand bar
    d.rounded_rectangle([60, 70, 520, 150], 40, fill=TEAL)
    d.text((95, 88), "AI For Business", font=font("Bold", 40), fill=NAVY)
    # progress bar
    d.rectangle([0, H - 14, int(W * t / total), H], fill=ORANGE)

    start = 0.0
    for sc in spec["scenes"]:
        if start <= t < start + sc["dur"]:
            lt = t - start; break
        start += sc["dur"]
    else:
        sc, lt = spec["scenes"][-1], spec["scenes"][-1]["dur"]

    a1, a2, a3 = ease(lt / 0.6), ease((lt - 0.4) / 0.6), ease((lt - 0.8) / 0.6)
    out = min(1.0, max(0.0, (sc["dur"] - lt) / 0.35))
    a1, a2, a3 = a1 * out, a2 * out, a3 * out

    if sc["type"] == "hook":
        y = 720
        y = text_block(d, wrap(d, sc["kicker"], font("SemiBold", 52), 900), font("SemiBold", 52), y, TEAL, a1, (1 - a1) * 40)
        y += 30
        y = text_block(d, wrap(d, sc["title"], font("ExtraBold", 104), 920), font("ExtraBold", 104), y, WHITE, a2, (1 - a2) * 60, gap=1.15)
        y += 50
        text_block(d, wrap(d, sc["sub"], font("Medium", 50), 880), font("Medium", 50), y, SOFT, a3, (1 - a3) * 40)
    elif sc["type"] == "tip":
        cx, cy, r = W // 2, 680, 120
        rr = int(r * (0.6 + 0.4 * a1))
        if a1 > 0.01:
            d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=tuple(int(ORANGE[i] * a1 + NAVY[i] * (1 - a1)) for i in range(3)))
            nf = font("ExtraBold", 130); n = str(sc["n"]); tw = d.textlength(n, font=nf)
            d.text((cx - tw / 2, cy - 80), n, font=nf, fill=tuple(int(NAVY[i]) for i in range(3)))
        y = 900
        y = text_block(d, wrap(d, sc["title"], font("ExtraBold", 92), 920), font("ExtraBold", 92), y, WHITE, a2, (1 - a2) * 50, gap=1.15)
        y += 60
        box_top = y - 30
        lines = wrap(d, sc["how"], font("Medium", 54), 790)
        box_h = int(len(lines) * 54 * 1.3) + 110
        if a3 > 0.01:
            col = tuple(int(NAVY2[i] * 1.3 * a3 + NAVY[i] * (1 - a3)) for i in range(3))
            col = tuple(min(255, c) for c in col)
            d.rounded_rectangle([90, box_top + (1 - a3) * 40, W - 90, box_top + box_h + (1 - a3) * 40], 36, fill=col)
            d.text((130, box_top + 25 + (1 - a3) * 40), "HOW", font=font("Bold", 36), fill=TEAL)
        text_block(d, lines, font("Medium", 54), box_top + 80, WHITE, a3, (1 - a3) * 40, center=False, x=130, gap=1.3)
    elif sc["type"] == "cta":
        y = 720
        y = text_block(d, wrap(d, sc["title"], font("ExtraBold", 96), 920), font("ExtraBold", 96), y, WHITE, a1, (1 - a1) * 50, gap=1.15)
        y += 50
        y = text_block(d, sc["tools"].split("|"), font("SemiBold", 56), y, TEAL, a2, (1 - a2) * 40)
        y += 120
        if a3 > 0.01:
            pulse = 1 + 0.03 * math.sin(lt * 5)
            bw, bh = int(820 * pulse), int(150 * pulse)
            col = tuple(int(ORANGE[i] * a3 + NAVY[i] * (1 - a3)) for i in range(3))
            d.rounded_rectangle([(W - bw) // 2, y, (W + bw) // 2, y + bh], 75, fill=col)
            ff = font("Bold", 54); tw = d.textlength(sc["button"], font=ff)
            d.text(((W - tw) / 2, y + bh / 2 - 34), sc["button"], font=ff, fill=NAVY)
    return img

def main(spec_path, out_path):
    spec = json.load(open(spec_path))
    total = sum(s["dur"] for s in spec["scenes"])
    n = int(total * FPS)
    p = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
        "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo", "-shortest",
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "medium", "-crf", "20",
        "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", out_path], stdin=subprocess.PIPE)
    for i in range(n):
        p.stdin.write(frame(spec, i / FPS, total).tobytes())
    p.stdin.close(); p.wait()
    print("done", out_path, total, "s")

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
