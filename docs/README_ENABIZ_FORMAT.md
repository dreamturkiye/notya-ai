# e-Nabız — yapıştırma masası + format paketleri

**Ürün (2026-09-27):** hekim veya sekreter `enabiz.gov.tr`’ye kendi girer. Notya alanı
kopyalar. Masa: `/doktor-tools/enabiz` (30 branş), `/klinik-tools/enabiz` (10 dal).
Bakanlık HTTP yok.

**Kural (CEO 2026-09-16):** doğrudan bağlantı yok; reçete, rapor, epikriz, USG,
gebe/e-Doğum çıktıları doğru formatta üretilir (teknik paket, masada ikinci planda).

| Artefakt | Kanal | Kod |
|---|---|---|
| Onaylı muayene notu | FHIR R4 Bundle | `lib/entegrasyon/fhirMapper.ts` |
| e-Reçete | Medula `erecete.s1.xsd` XML | `lib/medula/receteHazirla.ts` + `lib/enabiz/paket.ts` |
| Epikriz | FHIR Composition LOINC 18842-5 | `enabizEpikriz` |
| SGK e-Rapor / e-İstirahat | Medula e-rapor alan JSON | **Kanoni UI:** `/doktor-tools/sgk-rapor` (pediatri, Dr. Gökhan revizyonları). Paket: `enabizSgkRapor` yalnızca o taslağın Medula alan zarfı — ayrı rapor motoru yok. |
| USG raporu | FHIR DiagnosticReport LOINC 18748-4 | `enabizUsgRapor` |
| Gebe / lohusa / e-Doğum | USS form JSON | `legal-forms.ts` + `enabizUssForm` |

Hepsi `schema: notya.enabiz.v1`, **`live_write: false`**. UI’da “kopyala / JSON indir”; canlı HTTP yazım P4 (USS üretici kaydı).

Detay: `lib/enabiz/paket.ts`, `docs/USS-P4-YOLHARITASI.md`, `docs/ENTEGRASYON-KILAVUZU.md` §5.
