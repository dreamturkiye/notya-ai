# Notya Studio

Work on the new doktor website HERE.
Do not merge this folder into `dev` or `main` until a dedicated UI PR.

## What this is
Clickable fake-data GUI for Doktor side only. Cream + pine clinic look.
Canonical pages also live in https://github.com/dreamturkiye/notya (static host).

## Pages
- index.html — Ana sayfa
- araclar.html — Araçlar
- randevular.html, hastalar.html, hasta.html
- raporlar.html, ayarlar.html, asistan.html
- arac-asi.html, arac-hedef-boy.html

## How we work
1. Edit files in `studio/` on branch `design` only.
2. Preview via dreamturkiye/notya Vercel project (notya-studio) when linked — never the live notya-ai production project.
3. When pages are approved, port CSS/layout into the Next app in a separate PR to `dev`.

Mali and Avukat sides are out of scope.
