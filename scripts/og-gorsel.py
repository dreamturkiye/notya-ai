#!/usr/bin/env python3
"""AU-SEO-02 (2026-11-03) - renders the static 1200x630 link-preview image of a country site (public/og/<cc>-1200x630.png).

A static file on purpose: a dynamic app/opengraph-image route broke Next 14.2 country builds. Same look as the landing
(components/ulke/acilis): paper #f3f6f5, ink #102428, pine #0e6b66, Fraunces (display, italic word mark) and Outfit.

  python3 scripts/og-gorsel.py <font-dir> [out.png]
<font-dir> holds fraunces-latin-{400,500}-{normal,italic}.woff2 and outfit-latin-{300,400}-normal.woff2
(npm pack @fontsource/fraunces @fontsource/outfit). Needs Python Playwright with Chromium. Words: no claim, no price.
"""
import base64, pathlib, sys
from playwright.sync_api import sync_playwright

fonts = pathlib.Path(sys.argv[1])
out = pathlib.Path(sys.argv[2] if len(sys.argv) > 2 else 'public/og/au-1200x630.png')

def face(family, file, weight, style):
    data = base64.b64encode((fonts / file).read_bytes()).decode()
    return f"@font-face{{font-family:'{family}';src:url(data:font/woff2;base64,{data}) format('woff2');font-weight:{weight};font-style:{style}}}"

css = ''.join([
    face('Fraunces', 'fraunces-latin-500-normal.woff2', 500, 'normal'),
    face('Fraunces', 'fraunces-latin-400-italic.woff2', 400, 'italic'),
    face('Outfit', 'outfit-latin-300-normal.woff2', 300, 'normal'),
    face('Outfit', 'outfit-latin-400-normal.woff2', 400, 'normal'),
])

html = f"""<!doctype html><html><head><meta charset="utf-8"><style>{css}
*{{margin:0;box-sizing:border-box}}
body{{width:1200px;height:630px;background:#f3f6f5;color:#102428;font-family:Outfit,sans-serif;position:relative;overflow:hidden}}
.band{{position:absolute;right:0;top:0;bottom:0;width:330px;background:#0e6b66}}
.band .card{{position:absolute;left:-90px;top:150px;width:360px;background:#fff;border-radius:16px;padding:28px 30px;box-shadow:0 0 0 1px #1024281a,0 18px 40px #10242822}}
.card .lbl{{font-size:14px;letter-spacing:.22em;text-transform:uppercase;color:#5a7176}}
.row{{display:flex;justify-content:space-between;align-items:center;border-top:1px solid #1024281a;padding:13px 0;font-size:19px;color:#1d3c42}}
.row:first-of-type{{border-top:0}}
.mark{{font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#0e6b66;border:1px solid #0e6b6655;border-radius:999px;padding:4px 10px}}
.wrap{{position:absolute;left:84px;top:70px;width:640px}}
.brand{{display:flex;align-items:baseline;gap:14px;font-family:Fraunces,serif;font-style:italic;font-size:46px;letter-spacing:-.02em}}
.brand span{{font-family:Outfit,sans-serif;font-style:normal;font-size:15px;letter-spacing:.3em;text-transform:uppercase;color:#0e6b66}}
.eyebrow{{margin-top:58px;display:flex;align-items:center;gap:12px;font-size:15px;letter-spacing:.28em;text-transform:uppercase;color:#5a7176}}
.eyebrow i{{display:inline-block;width:7px;height:7px;background:#0e6b66}}
h1{{margin-top:20px;font-family:Fraunces,serif;font-weight:500;font-size:66px;line-height:1.05;letter-spacing:-.035em}}
h1 em{{display:block;font-style:italic;font-weight:400;color:#0e6b66}}
p.sub{{margin-top:26px;font-weight:300;font-size:24px;line-height:1.5;color:#1d3c42;width:600px}}
.url{{position:absolute;left:84px;bottom:52px;font-size:17px;letter-spacing:.14em;text-transform:uppercase;color:#5a7176}}
</style></head><body>
<div class="band"><div class="card"><div class="lbl">The visit note</div>
<div class="row" style="margin-top:12px">Recording, with consent<span class="mark">01</span></div>
<div class="row">Transcript<span class="mark">02</span></div>
<div class="row">Draft note<span class="mark">03</span></div>
<div class="row">Your approval<span class="mark">04</span></div></div></div>
<div class="wrap">
<div class="brand">Notya<span>Australia</span></div>
<div class="eyebrow"><i></i>For doctors in Australia</div>
<h1>Your visit notes,<em>drafted for you to approve.</em></h1>
<p class="sub">Records the visit with consent and drafts the note. You read, correct and approve it.</p>
</div>
<div class="url">au.notya.io</div>
</body></html>"""

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1200, 'height': 630}, device_scale_factor=1)
    pg.set_content(html, wait_until='load')
    pg.evaluate('document.fonts.ready')
    out.parent.mkdir(parents=True, exist_ok=True)
    pg.screenshot(path=str(out), clip={'x': 0, 'y': 0, 'width': 1200, 'height': 630})
    b.close()
print(out)
