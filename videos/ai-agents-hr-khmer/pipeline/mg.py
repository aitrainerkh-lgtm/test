"""Motion-graphics layer rendered by libass: vector icons, cards, charts, transitions.

Everything is emitted as ASS events so ffmpeg draws it in the same pass as the Khmer text.
Drawings use \\an7 with origin-based coordinates: every piece of a group shares one \\pos
and is drawn in group-local coordinates, so groups slide and scale as one unit.
"""
import math, random

W, H = 1920, 1080

# ---------- colours ----------
def C(rgb):
    rgb = rgb.lstrip("#")
    return f"&H{rgb[4:6]}{rgb[2:4]}{rgb[0:2]}&"

BRAND, BRAND2 = "#1B7A3D", "#E8731A"
AGENT = {"RECRUIT": "#2D8CFF", "PAYROLL": "#1FAA59", "ONBOARD": "#F28C28"}
WHITE, INK, GREY, TRACK, RED = "#FFFFFF", "#1E2A32", "#8A97A0", "#E3E8EC", "#E5484D"
PEOPLE = "#7B5CD6"

# ---------- geometry (polygons; fill = clockwise on screen, hole = reversed) ----------
def area(p):
    return sum(p[i][0] * p[(i + 1) % len(p)][1] - p[(i + 1) % len(p)][0] * p[i][1] for i in range(len(p)))

def fill(p):
    return p if area(p) > 0 else p[::-1]

def hole(p):
    return p[::-1] if area(p) > 0 else p

def circle(cx, cy, r, n=44):
    return [(cx + r * math.cos(2 * math.pi * i / n), cy + r * math.sin(2 * math.pi * i / n)) for i in range(n)]

def rrect(x, y, w, h, r, n=7):
    r = min(r, w / 2, h / 2)
    pts = []
    for cx, cy, a0 in ((x + w - r, y + r, -90), (x + w - r, y + h - r, 0), (x + r, y + h - r, 90), (x + r, y + r, 180)):
        for i in range(n + 1):
            a = math.radians(a0 + 90 * i / n)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts

def rect(x, y, w, h):
    return [(x, y), (x + w, y), (x + w, y + h), (x, y + h)]

def seg(x1, y1, x2, y2, t):
    dx, dy = x2 - x1, y2 - y1; L = math.hypot(dx, dy) or 1
    nx, ny = -dy / L * t / 2, dx / L * t / 2
    return [(x1 + nx, y1 + ny), (x2 + nx, y2 + ny), (x2 - nx, y2 - ny), (x1 - nx, y1 - ny)]

def path(*polys, holes=()):
    out = []
    for p in polys:
        p = fill(p); out.append("m " + f"{p[0][0]:.0f} {p[0][1]:.0f} l " + " ".join(f"{x:.0f} {y:.0f}" for x, y in p[1:]))
    for p in holes:
        p = hole(p); out.append("m " + f"{p[0][0]:.0f} {p[0][1]:.0f} l " + " ".join(f"{x:.0f} {y:.0f}" for x, y in p[1:]))
    return " ".join(out)

# ---------- icons (centred on 0,0; size s) ----------
def ic_robot(s):
    h = s * 0.62
    return path(rrect(-s / 2, -h / 2 + s * 0.08, s, h, s * 0.2), rect(-s * 0.04, -h / 2 - s * 0.12, s * 0.08, s * 0.2),
                circle(0, -h / 2 - s * 0.14, s * 0.08),
                holes=(circle(-s * 0.2, s * 0.06, s * 0.09), circle(s * 0.2, s * 0.06, s * 0.09)))

def ic_person(s):
    return path(circle(0, -s * 0.24, s * 0.2), rrect(-s * 0.36, s * 0.04, s * 0.72, s * 0.44, s * 0.2))

def ic_doc(s):
    w, h = s * 0.74, s
    page = [(-w / 2, -h / 2), (w / 2 - s * 0.2, -h / 2), (w / 2, -h / 2 + s * 0.2), (w / 2, h / 2), (-w / 2, h / 2)]
    lines = [rect(-w / 2 + s * 0.12, -h / 2 + s * (0.42 + 0.14 * i), w - s * 0.24, s * 0.06) for i in range(3)]
    return path(page, holes=[circle(-w / 2 + s * 0.22, -h / 2 + s * 0.2, s * 0.1)] + lines)

def ic_mail(s):
    w, h = s, s * 0.7
    flap = [(-w / 2 + s * 0.06, -h / 2 + s * 0.06), (0, s * 0.06), (w / 2 - s * 0.06, -h / 2 + s * 0.06)]
    v = seg(*flap[0], *flap[1], s * 0.07), seg(*flap[1], *flap[2], s * 0.07)
    return path(rect(-w / 2, -h / 2, w, h), holes=v)

def ic_check(s):
    return path(seg(-s * 0.38, 0, -s * 0.1, s * 0.28, s * 0.16), seg(-s * 0.16, s * 0.3, s * 0.4, -s * 0.3, s * 0.16))

def ic_flag(s):
    return path(rect(-s * 0.36, -s * 0.5, s * 0.09, s), [(-s * 0.27, -s * 0.48), (s * 0.4, -s * 0.36), (-s * 0.27, s * 0.02)])

def ic_arrow(w, t):
    return path(rect(-w / 2, -t / 2, w - t * 1.6, t), [(w / 2 - t * 2, -t * 1.4), (w / 2, 0), (w / 2 - t * 2, t * 1.4)])

def ic_chart(s):
    return path(*[rect(-s / 2 + i * s * 0.36, s / 2 - s * k, s * 0.24, s * k) for i, k in enumerate((0.45, 0.75, 1.0))])

# ---------- event helpers ----------
EV = []

def ts(t):
    t = max(t, 0); h, r = divmod(t, 3600); m, s = divmod(r, 60)
    return f"{int(h)}:{int(m):02d}:{s:05.2f}"

def ev(layer, t0, t1, tags, body, style="MG"):
    if t1 > t0:
        an = "" if "\\an" in tags else "\\an7"
        base = "" if style != "MG" else "\\bord0\\shad0"
        EV.append(f"Dialogue: {layer},{ts(t0)},{ts(t1)},{style},,0,0,0,,{{{an}{base}{tags}}}{body}")

def D(colour, alpha="00", extra=""):
    return f"\\1c{C(colour)}\\1a&H{alpha}&{extra}\\p1"

def T(size=28, colour=INK, bold=0, extra=""):
    return f"\\fnBattambang\\fs{size}\\b{bold}\\1c{C(colour)}{extra}"

def slide(x, y, dx=0, dy=26, fin=320, fout=260):
    return f"\\move({x + dx},{y + dy},{x},{y},0,{fin})\\fad({fin},{fout})"

def pop(x, y, delay=0, peak=114, fout=220):
    d = int(delay * 1000)
    return (f"\\pos({x},{y})\\fscx0\\fscy0\\t({d},{d + 170},\\fscx{peak}\\fscy{peak})"
            f"\\t({d + 170},{d + 300},\\fscx100\\fscy100)\\fad(0,{fout})")

def group(t0, t1, x, y, pieces, dx=0, dy=26, layer=10):
    """pieces: ('d', colour, alpha, path, extra) drawn at (x,y) | ('t', ox, oy, Ttags, text)."""
    for k, p in enumerate(pieces):
        if p[0] == "d":
            _, col, a, pth, extra = p
            ev(layer + k, t0, t1, slide(x, y, dx, dy) + D(col, a, extra), pth)
        else:
            _, ox, oy, tt, text = p
            ev(layer + k, t0, t1, slide(x + ox, y + oy, dx, dy) + tt, text)

def card(t0, t1, x, y, w, h, accent, title, dx=0, dy=26, layer=10, extra=()):
    shadow = "\\shad5\\4c&H000000&\\4a&HB0&"
    pieces = [("d", WHITE, "12", path(rrect(0, 0, w, h, 20)), shadow),
              ("d", accent, "00", path(rrect(0, 0, w, 66, 20), rect(0, 34, w, 32)), ""),
              ("t", 22, 7, T(33, WHITE, 1), title)] + list(extra)
    group(t0, t1, x, y, pieces, dx, dy, layer)

def badge(t0, t1, x, y, r, colour, icon, delay=0, layer=30, icol=WHITE, ring=True):
    shadow = "\\shad3\\4c&H000000&\\4a&HC0&"
    ev(layer, t0, t1, pop(x, y, delay) + D(colour, "00", shadow), path(circle(0, 0, r)))
    if ring:
        ev(layer + 1, t0, t1, pop(x, y, delay) + D(WHITE, "00"), path(circle(0, 0, r), holes=[circle(0, 0, r - 4)]))
    ev(layer + 2, t0, t1, pop(x, y, delay + 0.06) + D(icol), icon)

def pulse_ring(t0, t1, x, y, r, colour, period=1.3, layer=5):
    t = t0
    while t < t1 - 0.3:
        e = min(t + period, t1)
        ms = int((e - t) * 1000)
        ev(layer, t, e, f"\\pos({x},{y})\\fscx100\\fscy100\\t(0,{ms},\\fscx190\\fscy190\\1a&HFF&)" + D(colour, "40"),
           path(circle(0, 0, r), holes=[circle(0, 0, r - 5)]))
        t += period

def counter(t0, t1, t_end, x, y, tt, fmt, n0, n1, steps):
    for i in range(steps + 1):
        a = t0 + (t1 - t0) * i / steps
        b = t0 + (t1 - t0) * (i + 1) / steps if i < steps else t_end
        fade = "\\fad(0,260)" if i == steps else ""
        ev(40, a, b, f"\\pos({x},{y}){fade}" + tt, fmt.format(round(n0 + (n1 - n0) * i / steps)))

def speak_bars(colour, dur):
    """Inline equaliser bars for the speaker label: three bars that flicker while the line plays."""
    out = ""
    rnd = random.Random(int(dur * 1000))
    for b in range(3):
        tags, t = "", 0
        while t < dur * 1000:
            step = rnd.randint(110, 200)
            tags += f"\\t({t},{t + step},\\1a&H{rnd.choice(['00', '30', 'A0', 'D0'])}&)"
            t += step
        out += f"{{\\p1\\1c{C(WHITE)}\\1a&H00&{tags}}}m 0 4 l 6 4 6 {28 if b == 1 else 20} 0 {28 if b == 1 else 20}{{\\p0}}" + "{\\1a&H00&} "
    return out


# ---------- scenes ----------
def wipe(T0):
    """Brand-colour diagonal wipe that fully covers the cut at time T0."""
    panel = path([(0, 0), (2300, 0), (2000, H), (-300, H)])
    stripe = path([(0, 0), (140, 0), (-160, H), (-300, H)])
    d = 0.34
    ev(90, T0 - d, T0, f"\\move(-2500,0,0,0)" + D(BRAND), panel)
    ev(91, T0 - d, T0, f"\\move(-2500,0,0,0)" + D(BRAND2), path([(2300, 0), (2440, 0), (2140, H), (2000, H)]))
    ev(90, T0, T0 + d, f"\\move(0,0,2500,0)" + D(BRAND), panel)
    ev(91, T0, T0 + d, f"\\move(0,0,2500,0)" + D(BRAND2), stripe)
    ev(92, T0 - 0.06, T0 + 0.1, f"\\an5\\pos(960,540)\\fad(40,60)" + T(54, WHITE, 1), "AI For Business")


def tracker(sc_start, sc_end, active, first, last):
    """Top-centre workflow tracker: Recruit → Payroll → Onboard."""
    names = ["RECRUIT", "PAYROLL", "ONBOARD"]
    labels = ["Recruit", "Payroll", "Onboard"]
    xs = [840, 1060, 1280]; y = 74
    fin = 400 if first else 0
    fo = 400 if last else 0
    t0, t1 = sc_start + 0.35, sc_end
    base = f"\\fad({fin},{fo})"
    ev(20, t0, t1, f"\\pos(0,0){base}" + D(INK, "60"), path(rrect(xs[0] - 60, y - 34, xs[2] - xs[0] + 120, 92, 30)))
    ev(21, t0, t1, f"\\pos(0,0){base}" + D(WHITE, "90"), path(rect(xs[0], y - 3, xs[2] - xs[0], 6)))
    fill_to = xs[active]
    prev = xs[max(active - 1, 0)] if not first else xs[0]
    ev(22, t0, t1, f"\\pos(0,0){base}\\clip({xs[0]},0,{prev},200)\\t(300,1200,\\clip({xs[0]},0,{fill_to},200))" + D(BRAND2), path(rect(xs[0], y - 3, xs[2] - xs[0], 6)))
    for i, (nm, lb, x) in enumerate(zip(names, labels, xs)):
        done, act = i < active, i == active
        col = AGENT[nm] if (done or act) else GREY
        ev(23, t0, t1, f"\\pos({x},{y}){base}" + D(col, "00", "\\shad2\\4a&HA0&"), path(circle(0, 0, 20)))
        icon = ic_check(22) if done else ic_robot(24)
        ev(24, t0, t1, f"\\pos({x},{y}){base}" + D(WHITE), icon)
        ev(24, t0, t1, f"\\an8\\pos({x},{y + 22}){base}" + T(22, WHITE, 1, "\\shad1\\4a&H60&"), lb)
        if act:
            pulse_ring(t0 + 0.3, t1, x, y, 22, col, layer=19)


def scene_mg(i, sc, L):
    s0, s1, ln = sc["start"], sc["end"], sc["lines"]
    out = s1 - 0.25
    if i == 1:  # morning: agents come online
        for k, nm in enumerate(["RECRUIT", "PAYROLL", "ONBOARD"]):
            a = ln[0]["start"] + 0.4 + k * 0.35
            y = 130 + k * 90
            group(a, out, 1440, y, [
                ("d", WHITE, "10", path(rrect(0, 0, 450, 78, 39)), "\\shad4\\4a&HB0&"),
                ("d", AGENT[nm], "00", path(circle(40, 39, 29)), ""),
                ("d", WHITE, "00", _shift(ic_robot(32), 40, 40), ""),
                ("t", 82, 16, T(30, INK, 1), nm.title() + " Agent"),
                ("d", "#22C55E", "00", path(circle(316, 39, 8)), ""),
                ("t", 332, 16, T(27, "#15803D", 1), L["ready"]),
            ], dx=70, dy=0, layer=10 + k * 8)
            pulse_ring(a + 0.5, out, 1440 + 316, y + 39, 9, "#22C55E", period=1.0, layer=9)
    elif i == 2:  # CV screening + shortlist
        a, b = ln[0]["start"], ln[0]["end"]
        x, y = 50, 175
        card(a, out, x, y, 440, 320, AGENT["RECRUIT"], L["screening"], dx=-60, dy=0, extra=[
            ("d", TRACK, "00", path(rrect(30, 268, 300, 18, 9)), ""),
        ])
        # scanning document
        ev(30, a + 0.3, out, slide(x + 220, y + 160, -60, 0) + D("#D6E6FB"), path(rrect(-62, -82, 124, 150, 12)))
        ev(31, a + 0.3, out, slide(x + 220, y + 160, -60, 0) + D(AGENT["RECRUIT"]), ic_doc(110))
        for k in range(4):
            t = a + 0.6 + k * 1.2
            if t + 1.0 < out:
                ev(32, t, t + 1.0, f"\\move({x + 150},{y + 85},{x + 150},{y + 225})\\fad(150,150)" + D("#38BDF8", "30", "\\blur3"), path(rect(0, 0, 140, 6)))
        # flying CVs into the card
        for k in range(6):
            t = a + 0.2 + k * 0.45
            ev(33, t, t + 0.9, f"\\move({-80},{y + 60 + (k % 3) * 70},{x + 200},{y + 160},0,800)\\fad(80,250)\\frz{(-20 + k * 9)}" + D(WHITE, "00", "\\shad2\\4a&HA0&"), ic_doc(46))
        # progress bar
        pa, pb = a + 0.6, max(b - 0.3, a + 2.5)
        ev(34, pa, out, f"\\pos({x},{y})\\clip({x + 30},0,{x + 30},1080)\\t({0},{int((pb - pa) * 1000)},\\clip({x + 30},0,{x + 330},1080))\\fad(0,260)" + D(AGENT["RECRUIT"]),
           path(rrect(30, 268, 300, 18, 9)))
        counter(pa, pb, out, x + 345, y + 256, T(28, INK, 1), "{}%", 0, 100, 20)
        # shortlist card
        a2 = ln[1]["start"]
        x2, y2 = 1270, 545
        rows = []
        for k, nm in enumerate("ABC"):
            ry = 82 + k * 68
            rows += [("d", "#EEF4FF", "00", path(rrect(20, ry, 560, 58, 14)), ""),
                     ("d", AGENT["RECRUIT"], "00", path(circle(54, ry + 29, 21)), ""),
                     ("d", WHITE, "00", _shift(ic_person(28), 54, ry + 30), ""),
                     ("t", 88, ry + 8, T(29, INK, 1), f"{L['candidate']} {nm}"),
                     ("d", TRACK, "00", path(rrect(290, ry + 24, 180 - k * 40, 10, 5)), "")]
        card(a2, out, x2, y2, 600, 300, AGENT["RECRUIT"], L["shortlist"], dx=70, dy=0, extra=rows)
        for k in range(3):
            badge(a2, out, x2 + 540, y2 + 111 + k * 68, 21, "#22C55E", ic_check(24), delay=0.7 + k * 0.45, layer=60, ring=False)
    elif i == 3:  # interview schedule + invitations
        a, b2 = ln[0]["start"], ln[1]["start"]
        x, y, w = 1470, 125, 410
        cells = []
        for r in range(3):
            for c in range(4):
                cells.append(("d", TRACK, "00", path(rrect(22 + c * 94, 82 + r * 56, 82, 46, 10)), ""))
        card(a, out, x, y, w, 345, AGENT["RECRUIT"], L["schedule"], dx=70, dy=0, extra=cells)
        for k, (r, c) in enumerate([(0, 1), (1, 3), (2, 0), (1, 2)]):
            cx, cy = x + 22 + c * 94 + 41, y + 82 + r * 56 + 23
            ev(40, a + 0.8 + k * 0.5, out, pop(cx, cy, 0) + D(AGENT["RECRUIT"]), path(rrect(-41, -23, 82, 46, 10)))
            ev(41, a + 0.8 + k * 0.5, out, pop(cx, cy, 0.05) + D(WHITE), ic_person(28))
        for k in range(6):
            t = b2 + 0.3 + k * 0.35
            ev(45, t, t + 1.1, f"\\move(1330,430,{2000 + k * 20},{-60 + k * 40},0,1100)\\fad(100,200)\\t(0,1100,\\frz{-25 + k * 6})" + D(WHITE, "00", "\\shad2\\4a&H90&"), ic_mail(44))
        # sent status chip at card footer
        t = b2 + 0.8
        badge(t, out, x + 38, y + 310, 16, "#22C55E", ic_check(18), layer=60, ring=False)
        ev(50, t, out, slide(x + 64, y + 290, 0, 14) + T(28, "#15803D", 1), L["emails_sent"])
    elif i == 4:  # payroll report + flag
        a, b2 = ln[0]["start"], ln[1]["start"]
        x, y = 40, 465
        card(a, out, x, y, 460, 345, AGENT["PAYROLL"], L["payroll_report"], dx=-60, dy=0, extra=[
            ("d", TRACK, "00", path(rect(30, 286, 400, 3)), ""),
            ("d", AGENT["PAYROLL"], "00", path(circle(40, 318, 8)), ""),
            ("t", 56, 298, T(26, GREY, 1), L["attendance"]),
        ])
        hs = [120, 170, 140, 200, 160, 185]
        for k, hh in enumerate(hs):
            bx = x + 40 + k * 62
            top = y + 286 - hh
            col = "#F59E0B" if k == 3 else AGENT["PAYROLL"]
            ev(40, a + 0.5 + k * 0.18, out, f"\\pos(0,0)\\clip(0,{y + 286},1920,{y + 286})\\t(0,600,\\clip(0,{top},1920,{y + 286}))\\fad(0,260)" + D(col),
               path(rrect(bx, top, 40, hh + 8, 8)))
        # flag
        t = b2 + 0.6
        ev(55, t, out, slide(1460, 118, 60, 0) + D(WHITE, "10", "\\shad4\\4a&HB0&"), path(rrect(0, 0, 420, 80, 40)))
        badge(t + 0.2, out, 1500, 158, 30, "#F59E0B", ic_flag(34), layer=60, ring=False)
        pulse_ring(t + 0.6, out, 1500, 158, 32, "#F59E0B", period=1.0, layer=54)
        ev(57, t, out, slide(1546, 134, 60, 0) + T(30, "#B45309", 1), L["needs_review"])
    elif i == 5:  # AI prepares → human decides, approved stamp
        a = ln[0]["start"]
        x, y = 1080, 120
        group(a + 0.2, out, x, y, [
            ("d", WHITE, "12", path(rrect(0, 0, 780, 170, 24)), "\\shad5\\4a&HB0&"),
            ("t", 124, 58, T(32, INK, 1), L["ai_prepares"]),
            ("t", 562, 58, T(32, INK, 1), L["human_decides"]),
        ], dx=70, dy=0)
        badge(a + 0.5, out, x + 70, y + 85, 42, AGENT["PAYROLL"], ic_robot(46))
        badge(a + 1.4, out, x + 505, y + 85, 42, PEOPLE, ic_person(50))
        ev(40, a + 0.9, out, f"\\pos({x + 330},{y + 85})\\clip({x + 270},0,{x + 270},1080)\\t(0,500,\\clip({x + 270},0,{x + 400},1080))\\fad(0,260)" + D(BRAND2), ic_arrow(120, 14))
        t = ln[-1]["start"] + 0.2
        cx, cy = 1700, 520
        ev(70, t, out, pop(cx, cy, 0, 125) + D("#16A34A", "00", "\\shad4\\4a&HA0&"), path(circle(0, 0, 92)))
        ev(71, t, out, pop(cx, cy, 0.05, 125) + D(WHITE), path(circle(0, 0, 80), holes=[circle(0, 0, 74)]))
        ev(72, t, out, pop(cx, cy, 0.12, 125) + D(WHITE), ic_check(100))
        for k in range(2):
            ev(69, t + 0.15 + k * 0.25, t + 1.2 + k * 0.25, f"\\pos({cx},{cy})\\fscx100\\fscy100\\t(0,900,\\fscx200\\fscy200\\1a&HFF&)" + D("#22C55E", "20"),
               path(circle(0, 0, 92), holes=[circle(0, 0, 84)]))
        ev(73, t + 0.4, out, slide(cx, cy + 135, 0, 20) + D("#16A34A", "00", "\\shad3\\4a&HA0&"), path(rrect(-160, -32, 320, 64, 32)))
        ev(74, t + 0.4, out, "\\an5" + slide(cx, cy + 135, 0, 20) + T(31, WHITE, 1), L["approved"])
    elif i == 6:  # onboarding checklist + welcome confetti
        a, b2, b3 = ln[0]["start"], ln[1]["start"], ln[2]["start"]
        x, y = 50, 140
        items = [L["docs"], L["first_week"], L["team_intro"]]
        rows = []
        for k, it in enumerate(items):
            ry = 86 + k * 72
            rows += [("d", "#FFF4EA", "00", path(rrect(20, ry, 460, 60, 14)), ""),
                     ("d", WHITE, "00", path(rrect(34, ry + 12, 36, 36, 8), holes=[rrect(38, ry + 16, 28, 28, 6)]), "\\1c" + C("#F2B27A")),
                     ("t", 86, ry + 9, T(29, INK, 1), it)]
        card(a, out, x, y, 500, 325, AGENT["ONBOARD"], "Onboarding", dx=-60, dy=0, extra=rows)
        for k in range(3):
            badge(b2 + 0.6 + k * 0.6, out, x + 52, y + 116 + k * 72, 19, AGENT["ONBOARD"], ic_check(22), layer=60, ring=False)
        t = b3 + 0.1
        ev(70, t, out, pop(1100, 190, 0, 112) + D(AGENT["ONBOARD"], "00", "\\shad4\\4a&HA0&"), path(rrect(-190, -42, 380, 84, 42)))
        ev(71, t, out, "\\an5" + pop(1100, 190, 0.08, 112) + T(38, WHITE, 1), L["welcome"])
        rnd = random.Random(6)
        cols = [AGENT["RECRUIT"], AGENT["PAYROLL"], AGENT["ONBOARD"], "#FACC15", "#EC4899", WHITE]
        for k in range(36):
            ang = rnd.uniform(0, 2 * math.pi); dist = rnd.uniform(160, 420)
            ex, ey = 1100 + math.cos(ang) * dist, 190 + math.sin(ang) * dist * 0.8 + 120
            d0 = t + rnd.uniform(0, 0.25); dur = rnd.uniform(1.1, 1.7)
            shp = path(rect(-6, -10, 12, 20)) if k % 2 else path(circle(0, 0, 7, 16))
            ev(68, d0, d0 + dur, f"\\move(1100,190,{ex:.0f},{ey:.0f},0,{int(dur * 1000)})\\frz{rnd.randint(0, 360)}\\t(0,{int(dur * 1000)},\\frz{rnd.randint(200, 720)})\\fad(0,400)" + D(rnd.choice(cols)), shp)
    elif i == 7:  # policy Q&A chat
        a, b2, b3 = ln[0]["start"], ln[1]["start"], ln[2]["start"]
        bub = "\\fnBattambang\\fs31\\b1\\bord14\\shad0"
        ev(60, a + 0.4, out, slide(600, 192, 0, 20) + D(PEOPLE), path(circle(0, 0, 24)))
        ev(61, a + 0.4, out, slide(600, 194, 0, 20) + D(WHITE), ic_person(30))
        ev(62, a + 0.5, out, slide(650, 168, 0, 20) + bub + f"\\1c{C(INK)}\\3c{C(WHITE)}\\3a&H10&", L["question"], style="MGBox")
        ev(60, b2, b2 + 1.1, f"\\pos(600,302)" + D(AGENT["ONBOARD"]), path(circle(0, 0, 24)))
        ev(63, b2, b2 + 1.1, f"\\pos(650,280)" + D("#FFE7D1", "00"), path(rrect(0, 0, 110, 44, 22)))
        for k in range(3):
            tags = "".join(f"\\t({p},{p + 150},\\1a&H00&)\\t({p + 150},{p + 300},\\1a&HB0&)" for p in range(k * 120, 1100, 450))
            ev(64, b2, b2 + 1.1, f"\\pos({677 + k * 28},302)\\1a&HB0&{tags}" + D(AGENT["ONBOARD"], "B0"), path(circle(0, 0, 7, 16)))
        t = b2 + 1.1
        ev(60, t, out, pop(600, 302) + D(AGENT["ONBOARD"]), path(circle(0, 0, 24)))
        ev(61, t, out, pop(600, 304, 0.05) + D(WHITE), ic_robot(28))
        ev(62, t, out, slide(650, 276, 0, 14) + bub + f"\\1c{C(INK)}\\3c{C('#FFE7D1')}", L["answer"], style="MGBox")
        ev(65, b3 + 0.3, out, slide(650, 382, 0, 16) + bub + f"\\1c{C(WHITE)}\\3c{C(PEOPLE)}", L["complex_case"], style="MGBox")
    elif i == 8:  # summary: agents take repetitive work, people focus on people
        a = ln[0]["start"]
        x, y = 640, 92
        group(a + 0.1, out, x, y, [
            ("d", WHITE, "12", path(rrect(0, 0, 1200, 215, 28)), "\\shad5\\4a&HB0&"),
            ("d", TRACK, "00", path(rect(598, 26, 4, 165)), ""),
        ], dy=30)
        for k, nm in enumerate(["RECRUIT", "PAYROLL", "ONBOARD"]):
            badge(a + 0.4 + k * 0.25, out, x + 110 + k * 120, y + 78, 44, AGENT[nm], ic_robot(48), layer=40 + k * 3)
        ev(55, a + 1.2, out, "\\an8" + slide(x + 230, y + 132, 0, 16) + T(36, INK, 1), L["repetitive"])
        for k in range(2):
            badge(a + 1.6 + k * 0.25, out, x + 840 + k * 120, y + 78, 44, PEOPLE if k == 0 else BRAND, ic_person(52), layer=60 + k * 3)
        ev(70, a + 2.1, out, "\\an8" + slide(x + 900, y + 132, 0, 16) + T(36, INK, 1), L["people_focus"])


def _shift(pth, dx, dy):
    """Shift a drawing path string by dx,dy."""
    toks, out, num = pth.split(), [], []
    for t in toks:
        if t in ("m", "l", "b"):
            out.append(t)
        else:
            num.append(float(t))
            if len(num) == 2:
                out += [f"{num[0] + dx:.0f}", f"{num[1] + dy:.0f}"]; num = []
    return " ".join(out)


def title_card(t0, t1, text_y=540):
    for k, nm in enumerate(["RECRUIT", "PAYROLL", "ONBOARD"]):
        badge(t0 + 0.3 + k * 0.18, t1, 840 + k * 120, 400, 38, AGENT[nm], ic_robot(42), layer=40 + k * 3)
    ev(30, t0 + 0.9, t1, f"\\pos(0,0)\\clip(960,0,960,1080)\\t(0,700,\\clip(560,0,1360,1080))\\fad(0,300)" + D(BRAND2), path(rrect(560, 618, 800, 8, 4)))


def outro_card(t0, t1):
    badge(t0 + 0.2, t1, 900, 400, 40, PEOPLE, ic_person(46), layer=40)
    badge(t0 + 0.35, t1, 1020, 400, 40, AGENT["RECRUIT"], ic_robot(44), layer=44)
    ev(30, t0 + 0.9, t1, f"\\pos(0,0)\\clip(960,0,960,1080)\\t(0,700,\\clip(560,0,1360,1080))\\fad(0,300)" + D(BRAND2), path(rrect(560, 618, 800, 8, 4)))


def build(tl, L):
    EV.clear()
    title_card(*tl["intro"])
    outro_card(*tl["outro"])
    scenes = tl["scenes"]
    for i, sc in enumerate(scenes, 1):
        scene_mg(i, sc, L)
        if 2 <= i <= 7:
            tracker(sc["start"], sc["end"], (i - 2) // 2, i == 2, i == 7)
    for b in [sc["start"] for sc in scenes] + [tl["outro"][0]]:
        wipe(b)
    return EV
