# e-Nabız format hazırlığı (canlı bağlantı yok)

**Kural (CEO 2026-09-16):** e-Nabız’a doğrudan bağlantı yok; ama reçete, rapor, epikriz, USG,
gebe/e-Doğum ve ileride USS’ye gidecek her çıktı **şimdiden doğru formatta** üretilir.

| Artefakt | Kanal | Kod |
|---|---|---|
| Onaylı muayene notu | FHIR R4 Bundle | `lib/entegrasyon/fhirMapper.ts` |
| e-Reçete | Medula `erecete.s1.xsd` XML | `lib/medula/receteHazirla.ts` + `lib/enabiz/paket.ts` |
| Epikriz | FHIR Composition LOINC 18842-5 | `enabizEpikriz` |
| SGK e-Rapor / e-İstirahat | Medula e-rapor alan JSON | `enabizSgkRapor` |
| USG raporu | FHIR DiagnosticReport LOINC 18748-4 | `enabizUsgRapor` |
| Gebe / lohusa / e-Doğum | USS form JSON | `legal-forms.ts` + `enabizUssForm` |

Hepsi `schema: notya.enabiz.v1`, **`live_write: false`**. UI’da “kopyala / JSON indir”; canlı HTTP yazım P4 (USS üretici kaydı).

Detay: `lib/enabiz/paket.ts`, `docs/USS-P4-YOLHARITASI.md`, `docs/ENTEGRASYON-KILAVUZU.md` §5.
