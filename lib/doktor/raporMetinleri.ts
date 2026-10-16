/**
 * NOTYA-HASTA-RAPORLARI-UNIFIED-01 — centralized doctor-facing / patient-facing strings
 * for the unified Hasta Raporları visual system (shared chrome + the 4 new Çocuk Hasta
 * Raporları). Mirrors the pattern already used for every other localizable surface in
 * this repo — named string constants / label functions in one file, never inline
 * literals scattered through JSX (`lib/doktor/bransAdlari.ts` resmiUzmanlikAdi/bransEtiketi,
 * `lib/specialties/hitap.ts`, `lib/sgk/raporTipleri.ts` labels).
 *
 * There is no key→JSON i18n layer anywhere in this codebase (checked: no `i18n/`,
 * `locales/`, or message-catalog directory exists). The actual, established
 * localization convention here is per cross-specialty-parity's "six-country
 * propagation": a country pack forks the branch/file and re-sources its OWN text in
 * its OWN language — it does not swap a key in a shared catalog. Centralizing every
 * string in this one module is what makes that fork mechanical for a future country
 * pack (one file to re-translate, not JSX spread across the template), which is the
 * actual intent behind "use translation keys, not hardcoded strings" in this repo.
 */

export const RAPOR_BASLIK_BOLUM = {
  hastaBilgileri: 'HASTA BİLGİLERİ',
  veliBilgisi: 'VELİ / YASAL TEMSİLCİ',
  klinikDegerlendirme: 'KLİNİK DEĞERLENDİRME',
  karar: 'KARAR',
  rapor: 'RAPOR BİLGİLERİ',
  duzenleyenHekim: 'DÜZENLEYEN HEKİM',
  imzaKase: 'İMZA / KAŞE',
} as const

export const RAPOR_ETIKET = {
  adSoyad: 'Ad Soyad',
  tcKimlik: 'T.C. Kimlik No',
  dogumTarihi: 'Doğum Tarihi',
  cinsiyet: 'Cinsiyet',
  yas: 'Yaş',
  anneAdi: 'Anne Adı',
  babaAdi: 'Baba Adı',
  raporTarihi: 'Rapor Tarihi',
  raporNo: 'Rapor No',
  unvanAdSoyad: 'Unvan + Ad Soyad',
  diplomaTescilNo: 'Diploma Tescil Numarası',
  uzmanlikAlani: 'Uzmanlık Alanı',
  klinikAdresi: 'Ofis / Klinik Adresi',
  telefon: 'Telefon',
  eposta: 'E-posta',
} as const

/** Notya hiçbir hastanın T.C. kimlik numarasını ham olarak saklamaz (yalnız arama hash'i) — her raporda aynı not. */
export const TC_KIMLIK_NOTU = 'Notya T.C. kimlik numarasını saklamaz — gerekiyorsa elle tamamlanır.'

export function belgeNoEtiketi(belgeNo: string): string {
  return `Belge No: ${belgeNo}`
}

export function raporTarihiEtiketi(tarih: string): string {
  return `Rapor Tarihi: ${tarih}`
}
