# Country look-and-feel audit — 2026-10-23 (owner: Claude)

Rule (Kaan, 2026-10-23): Türkiye (`main`) is the gold standard. Content may differ per country (words, data, references,
laws, persona names). The page set, page templates, layout, icons, colours, buttons, spacing and typography may NOT.
Test applied to every item: chrome/template/visual = must equal Türkiye; content = may vary.

Method: static, code-level comparison of `origin/main` against `origin/release/{us,gb,ca,au,nz,uz}` (components, CSS
tokens, tool catalogues, route sets). No rendered screenshots were possible in this environment, so pixel-level
differences inside forked pages are NOT proven absent; that is logged as LOOK-PARITY-02.

## Structural finding (root cause of the whole class of defects)

The signed-in chrome (sidebar, top bar, bottom tabs, greeting, plant) is SHARED: `components/doktor/KabukGorunumu.tsx`
is used by `components/ulke/uygulama/Kabuk.tsx` and the colour/font tokens come from `lib/doktor/chromeRenk.ts`. The
page BODIES are not shared. Türkiye pages are inline-styled Turkish components under `app/dashboard/doktor/*`,
`app/doktor-tools/*`; each country renders its own hand-written copy in `components/ulke/uygulama/*.tsx` (about 7,900
lines per country, 8,870 in AU) styled by `uygulama.css` (`uza-*` / `yg-*` classes) which re-states the Türkiye look by
hand. Every such copy is a drift risk and is, by Kaan's rule, a defect until it renders the Türkiye component with
injected words/data. Only the Assistant page already does this (`AsistanSayfaGorunumu`).

## Differences found

| # | Area | Difference vs Türkiye | Severity | Status |
|---|------|----------------------|----------|--------|
| 1 | Tools grid, tile icon | Country tile showed an empty dark filled circle and a dark stripe (`.uza-arac-daire` had no code, `--uza-cam` colour) where Türkiye shows a coloured badge with a 2-letter code and a matching coloured stripe | High (Kaan-reported) | FIXED in all six: `lib/ulke/araclar/gorunum.ts` gives every kit tool the badge of the Türkiye tile that does the same job (colour and code), a stable derived badge for tools Türkiye has no tile for; Turkish letters transliterated (leak scan); test pins the table to `lib/doktor/doktorAraclari.ts` |
| 2 | Tools grid, tile hover | Arrow did not turn pine on hover, no transition | Low | FIXED in all six (CSS) |
| 3 | Tools: tools that exist only in a country or only in Özel Branşlar | No Türkiye tile exists, so the badge is derived (colour from a Türkiye palette, code from the key) | Low | Open: LOOK-PARITY-01 (add Türkiye tiles or a documented family colour) |
| 4 | Every inner page body (Today, Calendar, Patients, patient file, visit/note, Messages, Reports, billing, Clinic, Invoices, Privacy, Settings, tip bubbles, empty states) | Forked component + hand-copied CSS instead of the Türkiye component with injected words | High (structural) | Open: LOOK-PARITY-01 |
| 5 | Page set | AU ships 31 country page routes, US/GB/CA/NZ 28, UZ 27. AU-only: assistant page, vaccination schedule, growth chart, invoices, privacy requests, reference card; UZ lacks some of these; Türkiye has all | Medium | Open: LOOK-PARITY-03 |
| 6 | Settings: duplicate registration card | "AHPRA registration number" card (field `meslekKaydi`) duplicates the validated AHPRA field in "Practice details" | Medium | Finding below; NOT changed; LOOK-PARITY-04 |
| 7 | Portraits | `/portreler/` allow-listed in `lib/ulke/rotaKapisi.ts` (fixed earlier); no new public asset added by this change | none | OK |
| 8 | Voice names | Charlie/Clara not displayed; voice picker removed in AU (b9a3133ff). Not re-checked in the other five Settings pages beyond grep | Low | Open inside LOOK-PARITY-02 |
| 9 | Fonts and colours | Tokens come from the shared `chromeRenk.ts`; the forked CSS restates headline sizes (32px / 40px on Tools) matching Türkiye | none found | Verify visually in LOOK-PARITY-02 |

## AHPRA duplicate (question from Kaan)

Two stores, both in auth `user_metadata`: top-level `meslekKaydi` (Settings card `MeslekKaydiGorunumu`, route
`/api/ulke/meslek-kaydi`, accepts free text through `meslekKaydiGecerli`) and `muayenehane.ahpra` (Practice details, route
`/api/ulke/muayenehane`, validated as three letters plus ten digits). `lib/ulke/fatura/fatura.ts` reads the practice
particulars from `user_metadata.muayenehane`, so invoices use the Practice details number. `meslekKaydi` is read only
to refill its own Settings card (`/api/ulke/hesap`) and is written at sign-up. No invoice or letter reads it. So Practice
details IS the store that invoices read; the Settings card is a redundant, weaker duplicate. Not removed (instructed); the
recommended change is to drop the card and the sign-up free-text field, or migrate its value into `muayenehane.ahpra`
with the same validation. Waits on Kaan's yes (LOOK-PARITY-04).

## Per-country status

- us: tile icons APPLIED; inner pages OPEN (LOOK-PARITY-01/02)
- gb: tile icons APPLIED; inner pages OPEN
- ca: tile icons APPLIED; inner pages OPEN
- au: tile icons APPLIED; inner pages OPEN (strictest; first in the LOOK-PARITY-01 order); AHPRA card OPEN
- nz: tile icons APPLIED; inner pages OPEN
- uz: tile icons APPLIED; inner pages OPEN; page set smallest (LOOK-PARITY-03)
