# Original demo images for the landing captures: a stylised selfie illustration and a meal photo.
from pathlib import Path
from playwright.sync_api import sync_playwright
HERE = Path(__file__).resolve().parent
SELFIE = """<html><body style="margin:0"><div style="width:720px;height:960px;background:linear-gradient(180deg,#f3e7dc,#e9d6c6);display:flex;align-items:center;justify-content:center">
<svg viewBox="0 0 400 520" width="600" height="780">
 <ellipse cx="200" cy="300" rx="190" ry="230" fill="#5a3b2e"/>
 <rect x="150" y="380" width="100" height="110" rx="40" fill="#e9b796"/>
 <path d="M60 520 Q200 410 340 520Z" fill="#9ad46b"/>
 <ellipse cx="200" cy="250" rx="118" ry="150" fill="#f2c4a2"/>
 <path d="M82 220 Q100 90 200 92 Q300 90 318 220 Q300 150 230 140 Q170 170 82 220Z" fill="#4a2f24"/>
 <ellipse cx="155" cy="250" rx="13" ry="9" fill="#3b2a24"/><ellipse cx="245" cy="250" rx="13" ry="9" fill="#3b2a24"/>
 <path d="M135 228 Q155 218 175 228" stroke="#4a2f24" stroke-width="6" fill="none" stroke-linecap="round"/>
 <path d="M225 228 Q245 218 265 228" stroke="#4a2f24" stroke-width="6" fill="none" stroke-linecap="round"/>
 <path d="M200 260 Q192 300 204 306" stroke="#d99a7a" stroke-width="5" fill="none" stroke-linecap="round"/>
 <path d="M172 336 Q200 354 228 336" stroke="#c4645a" stroke-width="7" fill="none" stroke-linecap="round"/>
 <circle cx="138" cy="300" r="20" fill="#f0a493" opacity=".45"/><circle cx="262" cy="300" r="20" fill="#f0a493" opacity=".45"/>
 <circle cx="182" cy="372" r="4" fill="#d98472" opacity=".7"/><circle cx="226" cy="190" r="3.5" fill="#d98472" opacity=".6"/>
</svg></div></body></html>"""
MEAL = """<html><body style="margin:0"><div style="width:900px;height:900px;background:radial-gradient(circle at 50% 45%,#c9a27c,#7a5638);display:flex;align-items:center;justify-content:center">
<div style="width:680px;height:680px;border-radius:50%;background:radial-gradient(circle,#fff 62%,#e9e4dc 63%,#f7f4ef 70%);display:flex;align-items:center;justify-content:center;box-shadow:0 30px 60px rgba(0,0,0,.35)">
<span style="font-size:380px;line-height:1">🍛</span></div>
<span style="position:absolute;left:640px;top:90px;font-size:220px">🧋</span></div></body></html>"""
with sync_playwright() as p:
    b = p.chromium.launch()
    for name, html, size in [("selfie", SELFIE, (720, 960)), ("meal", MEAL, (900, 900))]:
        pg = b.new_page(viewport={"width": size[0], "height": size[1]})
        pg.set_content(html)
        pg.wait_for_timeout(300)
        pg.screenshot(path=str(HERE / f"{name}.png"))
    b.close()
print("ok")
