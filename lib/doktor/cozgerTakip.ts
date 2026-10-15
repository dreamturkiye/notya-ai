/**
 * NOTYA-OKUL-RAPOR-01 — ÇÖZGER takip ve katkı modülü.
 *
 * DİKKAT (task brief, Kaan): Notya resmi ÇÖZGER raporu ÜRETEMEZ. Bu rapor yalnızca Çocuk Sağlık Kurulu
 * (≥4 branş: çocuk psikiyatristi, çocuk hekimi, göz/KBB gibi) tarafından, MHRS/Alo 182 üzerinden alınan
 * randevu ile düzenlenir — bu süreç Notya'nın dışındadır.
 *
 * Notya'nın rolü:
 *   (a) her kurul üyesi doktorun KENDİ muayene bulgusunu bu hasta için yapılandırılmış şekilde kaydetmesi
 *       (branşına özel alanlarla, ama ortak bir başvuru kaydına bağlı) — cozger_kurul_katkilari,
 *   (b) başvuru durumu takibi — elle güncellenen durum, dış sistem entegrasyonu yok.
 *
 * Çıktı ASLA resmi ÇÖZGER formu gibi sunulmamalı — ekranda ve basılı çıktıda COZGER_UYARI_METNI sabit
 * olmalı. "%" oranı değil, ÖKGV benzeri metinsel düzey alanı kullanılır (serbest metin + katalogdan seçim).
 */

export type CozgerDurum =
  | 'basvuruldu'
  | 'randevu_alindi'
  | 'heyet_tarihi_belli'
  | 'sonuc_bekleniyor'
  | 'okgv_sonucu_geldi'

export const COZGER_DURUMLARI: ReadonlyArray<{ id: CozgerDurum; etiket: string }> = [
  { id: 'basvuruldu', etiket: 'Başvuruldu' },
  { id: 'randevu_alindi', etiket: 'Randevu alındı' },
  { id: 'heyet_tarihi_belli', etiket: 'Heyet tarihi belli' },
  { id: 'sonuc_bekleniyor', etiket: 'Sonuç bekleniyor' },
  { id: 'okgv_sonucu_geldi', etiket: 'ÖKGV sonucu geldi' },
]

export function cozgerDurumGecerliMi(v: string): v is CozgerDurum {
  return COZGER_DURUMLARI.some((d) => d.id === v)
}

/** ÖKGV benzeri metinsel düzey katalog — "%" oranı yazılmaz; resmi tanı kataloğu pattern'i gibi katalogdan seçim + serbest metin. */
export const OKGV_BENZERI_DUZEYLER: readonly string[] = ['Hafif düzey', 'Orta düzey', 'Ağır düzey', 'Çok ağır düzey']

/** Ekranda ve basılı çıktıda sabit kalması gereken uyarı — asla resmi ÇÖZGER formu gibi sunulmaz. */
export const COZGER_UYARI_METNI =
  'Bu, resmi ÇÖZGER raporu değildir; resmi rapor, MHRS/Alo 182 üzerinden alınan randevuyla Çocuk Sağlık Kurulu tarafından düzenlenir.'
