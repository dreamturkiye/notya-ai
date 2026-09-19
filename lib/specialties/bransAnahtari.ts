/**
 * Ham branş değeri → kanonik SpecialtyKey. Uygulamadaki TEK branş çözücüsü; portalBransAnahtari, doktorAracBransi,
 * kadinDogumMi, specialtyProfile, seans açılışı ve intake buna delege eder (kapsam.ts aynı adla yeniden dışa açar).
 *
 * KD-ISIMLENDIRME-01 (Kaan 2026-09-18): 'kadin-dogum' (gerçek KD hekimlerinin users.specialty değeri),
 * 'kadin-hastaliklari-dogum' (kanonik anahtar), "Kadın Hastalıkları ve Doğum" ve eski serbest metin "Kadın Doğum"
 * aynı branştır ve hepsi 'kadin-hastaliklari-dogum'a çözülür. Kilit: kd-isim-esdegerligi.test.ts — eski değeri
 * buradan "temizlemek" canlı KD hesabını branşsız bırakır; veri göçü ayrı iştir (OPEN KD-ISIMLENDIRME-02).
 *
 * Ayrı modül: registry.ts de bunu kullanır; kapsam.ts registry'yi içe aktardığı için döngü olmasın.
 */
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'
import { findSpecialistForSpecialty } from '@/lib/asistan/specialistsCatalog'

/** Eski hesaplardaki serbest metin ("Kadın Doğum Uzmanı", "Göz Hastalıkları Uzmanı", "Jinekoloji ve Obstetrik"). Sıra önemli. */
const SERBEST_METIN: ReadonlyArray<[RegExp, SpecialtyKey]> = [
  [/göz|goz|oftalm/, 'goz-hastaliklari'],
  [/kadın|kadin|jinek|obstet/, 'kadin-hastaliklari-dogum'],
  [/derma|deri ve z/, 'dermatoloji'],
  [/dahiliye|iç hast|ic hast/, 'dahiliye'],
  [/pediatri|çocuk sağlığı|cocuk sagligi|çocuk hast|cocuk hast/, 'pediatri'],
  // PSIK-EXCEPTIONAL-01: "Psikiyatri Uzmanı", "Ruh Sağlığı ve Hastalıkları". Çocuk ve ergen psikiyatrisi
  // ayrı branştır — eşleşmez, branşsız kalır (yetişkin psikiyatri bölümünü açmaz).
  [/^(?!.*(çocuk|cocuk|ergen)).*(psikiyatr|ruh sağlığı|ruh sagligi)/, 'psikiyatri'],
  // KBB-EXCEPTIONAL-01: "KBB Uzmanı", "Kulak Burun Boğaz Hastalıkları ve Baş Boyun Cerrahisi", "Otolarengoloji".
  [/kulak burun|kulak-burun|\bkbb\b|otolaring|otolareng|otorinolaring|otorinolareng/, 'kulak-burun-bogaz'],
]

/** Ham değer ('kadin-dogum', 'Kadın Hastalıkları ve Doğum', 'genel-cerrahi') → kanonik anahtar; "genel"/boş/bilinmeyen → null. */
export function bransAnahtari(ham: string | null | undefined): SpecialtyKey | null {
  if (!ham || !String(ham).trim()) return null
  const tam = findSpecialistForSpecialty(String(ham))?.specialtyKey
  if (tam) return tam
  const b = String(ham).trim().toLocaleLowerCase('tr-TR')
  return SERBEST_METIN.find(([re]) => re.test(b))?.[1] ?? null
}
