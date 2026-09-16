# README_LAB — Notya Belgeler LAB + TREND (state machine, as built 2026-09-16 overnight)

Kaan's spec, improved for dependable output. Locked rules kept: **Asistana raporla** (never "oku"); EXTRACT then INTERPRET; AI never locks resmi tanı, never writes a prescription; doctor edits table/özet/tanılar then **Onayla ve son muayeneye ekle**; Plan edited on the muayene → **Muayeneyi onayla** with revision; strip always; never invent a value; compare only to THIS patient's prior APPROVED labs; identity on the report ≠ current patient → hard warn until the doctor confirms.

## What was improved over the spec (why the output is dependable)

| Spec said | Built |
|---|---|
| "extract table" | **Two independent passes, reconciled cell by cell**: structural (CSV/XLSX rows; digital-PDF text via pdfjs + a lab-row grammar) and vision (Claude reads the PDF/photo with a faithful-extraction prompt). Any cell that differs → `dogrulanacak`, highlighted for the doctor, listed in `sinirlar`. Single-source rows are marked "tek çıkarım kaynağı". Page provenance per row. |
| "Map raw_name via loinc_tr" | `core/lab/kanonik.ts`: 80+ canonical keys, Turkish + English aliases, LOINC, **canonical units with unambiguous conversions only** (mmol/L↔mg/dL, g/L↔g/dL, µmol/L↔mg/dL, 10⁹/L↔10³/µL …). Not convertible → `unit_mismatch`, no Δ. Per-doctor "bunu ALT say" aliases (`lab_takma_adlar`). |
| "flag H/L" | Flag from the **printed** reference range or printed flag only; no printed ref → `unknown`. The code never supplies a range (pediatric or adult). |
| "trend rising/falling…" | **Arithmetic in code** (`core/lab/trend.ts`): Δ, Δ%, `stable` within ±5 %, `new_abn`/`new_normal` from prior flag, `no_prior`, `unit_mismatch`. The required Turkish trend sentence is **templated from the numbers**, so it cannot drift. 10 tests. |
| "critical banner" | **Criticals by rule before the model runs** (K ≤2.5/≥6.5, Na ≤120/≥160, Glu ≤50/≥400, Hb ≤7, Plt ≤20, INR ≥4, troponin printed positive, WBC ≤1, Neu ≤0.5, laktat ≥4, Li ≥1.5, Ca ≤6/≥14). The writer's `kritik[]` is **replaced** by the rule list; `acil_bayrak` may be added by the model, never removed. Banner: "Hekim şimdi baksın" — no auto-112. |
| "interpret prompt rules" | Validator enforces: ≤3 tanılar; cap 70 without priors / 85 with priors; bands yüksek≥80/orta≥55; `recete_ipucu` containing a dose (mg, mcg, mL, IU, tablet, x2…) is deleted; "ilk kayıtlı panel" note; disagreement note. |
| separate lab tables + API | Reuses the Belgeler system: interpret result stored in `belge_analizleri` (modality `lab`), doctor edits/approval via the existing `/analiz` PATCH and `/analiz/onayla` (lab-aware Objective block), revisions in `belge_revizyonlar` + `muayene_revizyonlar`, personas from the 30-branş router, Ayşe's dossier block shows approved lab reports automatically. |

## State machine

```
belge (vault: pdf/jpg/png/webp/csv/xlsx)
  → [Tabloyu çıkar]  POST /api/doktor/belgeler/lab {adim:'cikar'}      → lab_paneller (durum cikarildi) + lab_satirlar (onayli=false)
      identity guard: printed name/DOB vs this patient → kimlik_uyari.eslesme=false blocks 'raporla' until {adim:'kimlik_onayla'}
  → doctor edits cells  {adim:'satir'}  (row recomputed: flag/Δ/trend/critical; doctor_corrected=true, dogrulanacak cleared)
    doctor maps unknown  {adim:'takma_ad'} → lab_takma_adlar (remembered for this doctor)
  → [Tabloyu onayla]   {adim:'tablo_onayla'}                                  → durum tablo_onayli
  → [Asistana raporla] {adim:'raporla'}   (Ayşe / Mehmet / Elif raporluyor…)  → belge_analizleri (modality 'lab', durum taslak); durum raporlandi
  → doctor edits özet / locks resmi tanı   PATCH /api/doktor/belgeler/analiz
  → [Onayla ve son muayeneye ekle] POST /api/doktor/belgeler/analiz/onayla {adim:'onayla'}
        → appends the locked block to the LAST note's content_objektif (+ not_duzenlemeleri + muayene_revizyonlar)
        → lab_satirlar.onayli = true  ⇒ this panel becomes a PRIOR for the patient's future trends
  → [Plan düzenle] → [Muayeneyi onayla] {adim:'muayene_onayla'}              → content_plan revision; analysis + panel locked
```
No note for the patient yet → the approve endpoint refuses with "önce bir muayene notu oluşturun" (the spec's "create Lab değerlendirme muayene" is NOTYA-LAB-02).

Objective block (locked format):
```
[Lab] {lab_adi} — numune {date} — onay {ts}
Özet (hekim): …
Resmi tanı: …
Anormal: …
AI taslağı arşivde. Yapay zekâ taslak rapor üretir. Tanı ve tedavi kararı hekime aittir.
```

## Files
`core/lab/kanonik.ts` (keys, aliases, units, criticals) · `core/lab/trend.ts` (+ `trend.test.ts`) · `core/lab/cikarim.ts` (CSV/XLSX, pdfjs text grammar, Claude vision extraction) · `core/lab/yorum.ts` (30-branş emphasis router, persona writer, validator) · `app/api/doktor/belgeler/lab/route.ts` · page `app/dashboard/doktor/hastalar/[id]/belgeler/[belgeId]/lab/page.tsx` · migration `028_lab_paneller.sql` (lab_paneller, lab_satirlar, lab_takma_adlar) · vault MIME +csv/xlsx · "Lab" chip in `PatientDocumentVault.tsx` · smoke test `scripts/belgeler/lab_smoke.ts`.

## Out of scope V1 (unchanged)
e-Nabız live login, HL7/FHIR DiagnosticReport in, auto-reçete, reference-range invention, psychiatry-from-labs, cross-clinic patient match.
