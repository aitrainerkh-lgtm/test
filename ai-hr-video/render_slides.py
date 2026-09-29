"""Render one 1080x1920 PNG slide per scene in scenes.json.

Needs: pip install playwright, and a Chromium browser for Playwright
(set CHROMIUM_PATH to use an already installed Chromium).
The slides are already rendered in ./slides, so this only needs to run
again if the on-screen text in scenes.json changes.
"""
import base64
import html
import json
import os
import pathlib

from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
W, H = 1080, 1920

CSS = """
:root {
  --green: #1B7A3D; --green-dark: #0F4F27; --orange: #E8731A;
  --cream: #FBF8F2; --ink: #1E2A22; --muted: #5B6B60;
  --heading: 'Moul', 'Khmer OS Muol Light', serif;
  --body: 'Poppins', 'Battambang', 'Khmer OS Battambang', sans-serif;
  --latin: 'Poppins', sans-serif;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 1080px; height: 1920px; overflow: hidden; }
body {
  background: var(--cream); color: var(--ink); font-family: var(--body);
  position: relative;
}
.bg-top {
  position: absolute; inset: 0 0 auto 0; height: 760px;
  background: linear-gradient(160deg, var(--green) 0%, var(--green-dark) 100%);
  border-bottom-right-radius: 220px;
}
.ring { position: absolute; border-radius: 50%; border: 3px solid rgba(255,255,255,.12); }
.ring.r1 { width: 520px; height: 520px; right: -160px; top: -140px; }
.ring.r2 { width: 300px; height: 300px; right: 60px; top: 330px; border-color: rgba(232,115,26,.45); }
.dotgrid {
  position: absolute; left: 70px; top: 520px; width: 220px; height: 130px;
  background-image: radial-gradient(rgba(255,255,255,.28) 3px, transparent 3px);
  background-size: 28px 28px;
}
.brand-top {
  position: absolute; top: 90px; left: 80px; display: flex; align-items: center; gap: 18px;
  font-family: var(--latin); font-weight: 700; font-size: 34px; color: #fff; letter-spacing: .5px;
}
.brand-top .mark {
  width: 58px; height: 58px; border-radius: 16px; background: var(--orange);
  display: grid; place-items: center; font-size: 26px; font-weight: 800;
}
.tag {
  position: absolute; top: 250px; left: 80px;
  font-family: var(--latin); font-weight: 600; font-size: 38px; color: #fff;
  background: rgba(255,255,255,.14); border: 2px solid rgba(255,255,255,.3);
  padding: 14px 34px; border-radius: 999px;
}
.card {
  position: absolute; left: 70px; right: 70px; top: 520px;
  background: #fff; border-radius: 48px; padding: 90px 70px 80px;
  box-shadow: 0 30px 80px rgba(15,79,39,.18);
}
.card .bar { width: 120px; height: 12px; border-radius: 6px; background: var(--orange); margin-bottom: 50px; }
h1 {
  font-family: var(--heading); font-weight: 400; font-size: 76px; line-height: 1.6;
  color: var(--green-dark);
}
h1 span { display: block; white-space: nowrap; }
ul { list-style: none; margin-top: 60px; display: flex; flex-direction: column; gap: 30px; }
li {
  display: flex; align-items: center; gap: 30px;
  font-size: 50px; line-height: 1.7; font-weight: 700; color: var(--ink);
  background: var(--cream); border-radius: 28px; padding: 22px 36px;
}
li .n {
  flex: none; width: 76px; height: 76px; border-radius: 50%;
  background: var(--green); color: #fff; display: grid; place-items: center;
  font-family: var(--latin); font-size: 34px; font-weight: 700;
}
.hero {
  margin-top: 60px; display: flex; flex-direction: column; align-items: center; gap: 36px;
}
.hero .big {
  font-family: var(--latin); font-weight: 800; font-size: 120px; line-height: 1.05;
  color: var(--green); text-align: center;
}
.hero .big span { color: var(--orange); }
.hero .sub { font-size: 48px; font-weight: 700; color: var(--muted); text-align: center; line-height: 1.7; }
.cta-box {
  margin-top: 60px; border-radius: 36px; padding: 50px 40px; text-align: center;
  background: linear-gradient(135deg, var(--orange), #F29A4A); color: #fff;
}
.cta-box .course { font-family: var(--latin); font-weight: 800; font-size: 70px; line-height: 1.15; white-space: nowrap; }
.cta-box .kh { font-size: 44px; font-weight: 700; margin-top: 18px; line-height: 1.7; }
.footer {
  position: absolute; left: 0; right: 0; bottom: 110px; text-align: center;
  font-family: var(--latin); font-weight: 700; font-size: 40px; color: var(--green-dark);
}
.footer span { color: var(--orange); }
.progress { position: absolute; bottom: 70px; left: 0; right: 0; display: flex; justify-content: center; gap: 14px; }
.progress i { width: 44px; height: 10px; border-radius: 5px; background: #D9E3DC; }
.progress i.on { background: var(--orange); }
"""

FONT_FILES = [
    ("Moul", 400, "Moul-Regular.ttf"),
    ("Battambang", 400, "Battambang-Regular.ttf"),
    ("Battambang", 700, "Battambang-Bold.ttf"),
    ("Poppins", 600, "Poppins-SemiBold.ttf"),
    ("Poppins", 700, "Poppins-Bold.ttf"),
    ("Poppins", 800, "Poppins-ExtraBold.ttf"),
]


def font_faces():
    """Embed the fonts in ./fonts so Khmer renders without any network access."""
    faces = []
    for family, weight, name in FONT_FILES:
        data = base64.b64encode((HERE / "fonts" / name).read_bytes()).decode()
        faces.append(f"@font-face {{ font-family: '{family}'; font-weight: {weight}; "
                     f"src: url(data:font/ttf;base64,{data}) format('truetype'); }}")
    return "\n".join(faces)


def slide_html(scene, index, total, faces):
    e = html.escape
    body = ""
    if scene.get("cta"):
        body = (f'<div class="cta-box"><div class="course">{e(scene["points"][0])}</div>'
                f'<div class="kh">វគ្គបណ្តុះបណ្តាល</div></div>'
                f'<div class="hero"><div class="sub">ពី AI For Business</div></div>')
    elif scene["points"]:
        items = "".join(f'<li><span class="n">{i + 1}</span><span>{e(p)}</span></li>'
                        for i, p in enumerate(scene["points"]))
        body = f"<ul>{items}</ul>"
    else:
        body = ('<div class="hero"><div class="big">AI <span>Agent</span></div>'
                '<div class="sub">ធ្វើការជាមួយក្រុម HR របស់អ្នក</div></div>')
    # "|" in a title marks a line break; Khmer has no spaces, so the browser
    # would otherwise break lines in the middle of a word.
    title = "".join(f"<span>{e(line)}</span>" for line in scene["title"].split("|"))
    dots = "".join(f'<i class="{"on" if i == index else ""}"></i>' for i in range(total))
    return f"""<!doctype html><html lang="km"><head><meta charset="utf-8">
<style>{faces}{CSS}</style></head><body>
<div class="bg-top"></div><div class="ring r1"></div><div class="ring r2"></div><div class="dotgrid"></div>
<div class="brand-top"><div class="mark">AI</div>AI For Business</div>
<div class="tag">{e(scene["tag"])}</div>
<div class="card"><div class="bar"></div><h1>{title}</h1>{body}</div>
<div class="footer">AI Agents for <span>HR</span></div>
<div class="progress">{dots}</div>
</body></html>"""


def main():
    faces = font_faces()
    data = json.loads((HERE / "scenes.json").read_text(encoding="utf-8"))
    scenes = data["scenes"]
    out = HERE / "slides"
    out.mkdir(exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=os.environ.get("CHROMIUM_PATH") or None)
        page = browser.new_page(viewport={"width": W, "height": H})
        for i, scene in enumerate(scenes):
            page.set_content(slide_html(scene, i, len(scenes), faces), wait_until="networkidle")
            page.evaluate("document.fonts.ready")
            page.wait_for_timeout(300)
            page.screenshot(path=str(out / f"{scene['id']}.png"))
            print("rendered", scene["id"])
        browser.close()


if __name__ == "__main__":
    main()
