# AU Muayene engines vs Turkish golden reference (2026-10-30)

**Classification:** core shared visit depth — country-adapted (Option A / `.ulke`-native).  
**Not** a mount of TR `specialties/*/engines/*` (SGK, e-Nabız, Turkish copy).

## What TR has

- ~321 specialty engine files under `specialties/<branş>/engines/` (growth, dose, vaccine plan, chapter-specific calculators, portal slices).
- Mounted inside the shared doctor dashboard tree (`app/dashboard/doktor/**`).

## What AU ships in this change

| Layer | AU approach |
|---|---|
| Visit screen | Still one `.ulke` `Muayene.tsx`, plus pack-driven `muayeneMotorlari[rol]` panel (44 roles) |
| Note shape | Per-role SOAP/ADIME locks (`klinik/soapKilitleri.ts`) + EN note fields |
| Clinical arithmetic | Existing AU Araçlar (PBS, MHR, growth %, K10, dietetics suite, flags, review studios) + **new** per-role care-plan / between-visit-log / care-goals |
| Patient portal | Dietetics keeps meal coaching; **43 other roles** get the same coaching card shape with role-specific labels |

## Material AU ≠ TR differences (cater to Australian doctors)

| Topic | Australia | Türkiye (golden) |
|---|---|---|
| Emergency number | Triple Zero (**000**) | **112** |
| Identity / payer | Medicare card, PBS, MBS (link-outs / particulars tools) | TC Kimlik, SGK / Medula / SUT |
| Record exchange | My Health Record upload **conditions** (ticks; nothing uploaded) | e-Nabız |
| Prescribing frame | PBS prescription particulars — not e-Reçete | e-Reçete |
| Privacy | Privacy Act / APPs | KVKK-specific flows |
| Regulator | Ahpra / Medical Board specialty list (44 AU roles) | Tıpta Uzmanlık + Özel Branşlar (40) |
| Dietetics note | **ADIME** headings | SOAP spine for most; diyetisyen chapter |
| Energy units | **kJ** (NEMO-style starting estimates) | Often kcal framing in TR tools |
| Dysphagia texture | **IDDSI** (dietetics + speech pathology) | TR chapter tools |
| Growth charts | WHO tool on; CDC/ANZSPED 2–18 still open | Neyzi / TR pediatri engines |
| Cosmetic surgery | Medical Board cooling-off / consent studios | Estetik chapter engines |
| Hair transplant | Under **aesthetic-medicine** (not a Board specialty) | `sac-ekimi` Özel Branş |
| Cardio-thoracic / vascular | Board **split** roles | Separate TR cerrahi chapters |
| Allied portals | Physio, psychology, OT, audiology, podiatry, speech | Özel Branşlar + muttefik chapters |

## Open (not invented)

- Named AU clinician sign-off per role for thresholds (tracked under AU-DEPTH-PARITY-02 / onaysiz list).
- Full TR engine arithmetic ports remain out of scope for Option A; deepen via cited AU Araçlar instead.
- us / gb / ca / nz / uz: same coaching + visit-panel pattern = **OPEN GAP** until those packs absorb (owner Claude).

## Files

- `countries/au/klinik/muayeneMotorlari.ts`
- `countries/au/portalBransModulleri.ts`
- `countries/au/araclar/bransKocluk.ts`
- `lib/ulke/portal/koclukAyari.ts`
- `components/ulke/uygulama/MuayeneMotorPaneli.tsx`
