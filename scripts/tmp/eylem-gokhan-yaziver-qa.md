# NOTYA-EYLEM — Gökhan neonate yazıver QA (prod gate)

Until this passes on **production** with a live Claude turn that emits `tool_use`, do not call the feature done.

## Synthetic neonate

1. Pediatri hasta, DOB = today − 0–7 days (or known DOB with “doğumda Hep B” in an epikriz belge).
2. Epikriz / yenidoğan taburculuk metninde: “Doğumda Hepatit B yapıldı” (no calendar date OK).
3. Aşılar sekmesi empty for this patient.

## Script (Danış)

| Step | Doctor | Expect |
|------|--------|--------|
| 1 | Chip or type: özet / belgedeki aşıları anlat | Ayşe summarises Hep B from dossier; may offer gap nudge |
| 2 | **“sen yazıver”** (or “kayda geç” / “dosyaya gir”) | Network: Anthropic request has `tool_choice: { type: "any" }`. Response contains `tool_use` name `asi_kaydi_ekle`. UI: teal onay kartı with hasta adı + DOB header |
| 3 | If uygulama tarihi empty | Chip **“Doğum tarihinde uygulandı”** → fills DOB |
| 4 | Tap Kaydet | Row in `asilar`: `asi_adi` = `Hepatit B` (normalized), `hekim_onay_at` set, `belge_id` if kaynak had it, badge ≈ karne |
| 5 | Tap **Geri al** | Row gone; audit shows hazırlayan Ayşe / onaylayan hekim |

## Deterministic unit coverage (no live model)

`core/eylemler/tests/eylem.test.ts`:

- kaynaksız alan → belirsiz, value kept
- past `sonraki_doz_tarihi` → warning, commit OK
- Hep B → Hepatit B + `belge_id` / `hekim_onay_at`
- `kayitNiyetiMi('sen yazıver')`

## Fail if

- Model narrates “veri girişi yapamam” with no card after “yazıver”
- Empty yellow card with Hep B wiped (missing `alan_kaynaklari`)
- Commit 400 solely because next-dose is in the past
- Saved dose looks like parent beyan (no `hekim_onay_at`) when hekim just tapped
