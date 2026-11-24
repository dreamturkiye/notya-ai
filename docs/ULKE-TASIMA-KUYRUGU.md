# Country carry-over queue (ÜLKE TAŞIMA KUYRUĞU)

**Why this file exists — Kaan, 2026-11-24:** "We need to open a folder or md file and write it to the notya project for all these core changes that we are doing so that we can with one button carry them to all the other countries besides Türkiye. I do not want to bother with all of them at this time since it takes too much time."

**Rule (from 2026-11-24 until Kaan says otherwise):** core/shared Türkiye changes ship on `main` first and are NOT ported to the country builds in the same change set. Every such change is appended here instead. This temporarily replaces the "same change set" part of `.cursor/rules/ulke-paritesi-duzeltme.mdc` for these items; nothing else in that rule changes. Turkey-only mechanics (MBYS, SGK/SUT/Medula, e-Nabız, e-Reçete, NVI, e-Fatura/GİB, KVKK-specific) are never queued.

**The "one button":** when Kaan says "carry the country queue" (or "ülke kuyruğunu taşı"), Claude starts ONE Claude Code job with this file as the brief: port every `OPEN` item, country-adapted (language, the country's own guidelines/regulators, same look), to the countries listed as active, run each country's pack tests, push once per release branch, and mark each item `DONE <date> <commit per country>` here.

**Active country builds:** au, uz (live databases). us, gb, ca, nz: databases kept but frozen by Kaan (2026-11-23) — port only when he reactivates them.

## How to add an item
Append under "Queue" with: id, date, what it is (one line), main commits, migrations, country notes (what must be adapted, not copied), status `OPEN`.

## Queue

- **ESNEK-MUAYENE-A** — 2026-11-23 — El Notu: handwritten pages → muayene notu (on-device masking, reader, sources composer, Doğrula, secretary drafting + doctor-optional approval, time meter). Commits: 75a66924, bef7bf3e. Migration 202. Country notes: the country builds have their own visit/note pipeline (`ulke_*` tables) — port the reader/composer into it; form templates and seed lexicons per country language; e-Reçete/MBYS parts stay Türkiye-only. Status: OPEN.
- **ESNEK-MUAYENE-B** — 2026-11-23 — shadow mode, overnight learning, field autonomy ladder, fark notu, suggestion profile, "Notya sizi böyle tanıyor" card, time meter upgrade, batch approval page. Commit: 644dd058. Migration 203. Depends on A. Status: OPEN.
- **EL-NOTU-OKUYUCU-V2** — 2026-11-24 — whole-page reader ×3 with agreement, structure outline, Doğrula budget, server-side masking proof, Luna-Pro tuning (strips, drawing prompt, drug-name rule). Commits: 070a5755, c70750cd. Evaluation tooling 6cd4a084 and admin eval route + one-time eval pass 1ef26889 (migration 204) are founder tooling — port only if useful per country. Status: OPEN.
- **ESNEK-GELISIM** — 2026-11-24 — improvement loop: founder quality dashboard, branş lexicon growth (≥3 doctors), consented regression set + weekly run + replay guard, weekly handwriting learning line. Commit: cd273e7c. Migration 205. Country notes: consent wording per country privacy law. Status: OPEN.
- **GORUNTU-CABA-HIGH** — 2026-11-24 — higher reasoning effort for image reads (founder-locked file, Kaan GO 16:29 EST). Status: CLOSED — REVERTED 2026-11-24 (applied 6dfb188e, reverted fa2e359f: no accuracy gain beyond noise, image reads ~3× slower; main is back to default effort). Nothing to carry to any country.
- **TR-PROTOKOL-KUTUPHANESI** — 2026-11-24 — Turkish protocol library for all 30 branşlar + 10 Özel Branşlar: document registry with edition/year/official link/last check, source chips on Ayşe's opinions, monthly version check. Country notes: NOT a copy — each country needs its OWN library from its own regulators/societies (e.g. AU: national/college guidelines; UZ: Ministry of Health), researched per country. Status: OPEN (Türkiye build in progress).

## Done
- (none yet under this queue — earlier core changes were ported in their own change sets, e.g. the envelope message icon 2026-11-22 and the colleague personas 2026-11-24)
