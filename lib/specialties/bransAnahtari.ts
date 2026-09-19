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
  // COCUK-CERRAHISI-EXCEPTIONAL-01: "Çocuk Cerrahisi" — pediatri "çocuk sağlığı/hastalıkları"ndan ÖNCE.
  [/çocuk cerrah|cocuk cerrah|cocuk-cerrahisi/, 'cocuk-cerrahisi'],
  [/pediatri|çocuk sağlığı|cocuk sagligi|çocuk hast|cocuk hast/, 'pediatri'],
  // PSIK-EXCEPTIONAL-01: "Psikiyatri Uzmanı", "Ruh Sağlığı ve Hastalıkları". Çocuk ve ergen psikiyatrisi
  // ayrı branştır — eşleşmez, branşsız kalır (yetişkin psikiyatri bölümünü açmaz).
  [/^(?!.*(çocuk|cocuk|ergen)).*(psikiyatr|ruh sağlığı|ruh sagligi)/, 'psikiyatri'],
  // KBB-EXCEPTIONAL-01: "KBB Uzmanı", "Kulak Burun Boğaz Hastalıkları ve Baş Boyun Cerrahisi", "Otolarengoloji".
  [/kulak burun|kulak-burun|\bkbb\b|otolaring|otolareng|otorinolaring|otorinolareng/, 'kulak-burun-bogaz'],
  // GOGUS-CERRAHISI-EXCEPTIONAL-01: "Göğüs Cerrahisi" — hastalıkları eşleşmesinden ÖNCE (ayrı branş).
  [/göğüs cerrah|gogus cerrah|gogus-cerrah/, 'gogus-cerrahisi'],
  // GOGUS-EXCEPTIONAL-01: "Göğüs Hastalıkları" — cerrahi ("Göğüs Cerrahisi") eşleşmez (ayrı branş).
  [/göğüs hastal|gogus-hastalik|gogus hastal/, 'gogus-hastaliklari'],
  // KARDIO-EXCEPTIONAL-01: "Kardiyoloji Uzmanı". Kalp-damar cerrahisi ayrı branş — eşleşmez.
  [/^(?!.*(cerrah|damar)).*(kardiyoloji|\bkardiyo\b)/, 'kardiyoloji'],
  // BEYIN-CERRAHISI-EXCEPTIONAL-01: "Beyin Cerrahisi", "Nöroşirürji" — noroloji'den ÖNCE.
  [/beyin.?cerrah|n[öo]ro[şs]ir[üu]rj|neurosurg/, 'beyin-cerrahisi'],
  // NOROLOJI-EXCEPTIONAL-01: "Nöroloji Uzmanı", "Noroloji".
  [/n[öo]roloji|noroloji/, 'noroloji'],
  // UROLOJI-EXCEPTIONAL-01: "Üroloji Uzmanı", "Uroloji", "Urology".
  [/[üu]roloji|urology/, 'uroloji'],
  // ORTOPEDI-EXCEPTIONAL-01: "Ortopedi Uzmanı", "Ortopedi ve Travmatoloji".
  [/ortopedi|travmatoloji|orthop/, 'ortopedi'],
  // FIZIK-TEDAVI-EXCEPTIONAL-01: "Fizik Tedavi", "FTR", "Fiziksel Tıp ve Rehabilitasyon".
  [/fizik.?tedavi|fiziksel.?t[ıi]p|fiziksel tip|\bftr\b|rehabilitasyon/, 'fizik-tedavi'],
  // SPOR-HEKIMLIGI-EXCEPTIONAL-01: "Spor Hekimliği Uzmanı", "Spor hekimliği".
  [/spor hekim|spor-hekim|sports medicine/, 'spor-hekimligi'],
  // ENDOKRINOLOJI-EXCEPTIONAL-01: "Endokrinoloji Uzmanı", "Endokrinoloji ve Metabolizma".
  [/endokrin/, 'endokrinoloji'],
  // GASTROENTEROLOJI-EXCEPTIONAL-01: "Gastroenteroloji Uzmanı".
  [/gastro/, 'gastroenteroloji'],
  // NEFROLOJI-EXCEPTIONAL-01: "Nefroloji Uzmanı", "Böbrek Hastalıkları".
  [/nefroloji|b[öo]brek hastal/, 'nefroloji'],
  // ENFEKSIYON-EXCEPTIONAL-01: "Enfeksiyon Hastalıkları", "Klinik Mikrobiyoloji".
  [/enfeksiyon|infeksiyon|klinik mikrobiyoloji/, 'enfeksiyon-hastaliklari'],
  // ONKOLOJI-EXCEPTIONAL-01: "Onkoloji Uzmanı", "Tıbbi Onkoloji" (radyasyon onkolojisi ayrı — eşleşmez).
  [/^(?!.*(radyasyon|radyo)).*(onkolo|tibbi onkolo|tıbbi onkolo)/, 'onkoloji'],
  // GENEL-CERRAHI-EXCEPTIONAL-01: "Genel Cerrahi" — çocuk/göğüs/beyin/plastik/kalp-damar cerrahisi eşleşmez.
  [/^(?!.*(çocuk|cocuk|göğüs|gogus|beyin|plastik|kalp|damar|kardiyovask|toraks)).*(genel.?cerrah|general.?surg)/, 'genel-cerrahi'],
  // PLASTIK-CERRAHI-EXCEPTIONAL-01: "Plastik Cerrahi", "Plastik Rekonstrüktif ve Estetik Cerrahi".
  [/plastik|rekonstr[üu]ktif|estetik cerrah/, 'plastik-cerrahi'],
]

/** Ham değer ('kadin-dogum', 'Kadın Hastalıkları ve Doğum', 'genel-cerrahi') → kanonik anahtar; "genel"/boş/bilinmeyen → null. */
export function bransAnahtari(ham: string | null | undefined): SpecialtyKey | null {
  if (!ham || !String(ham).trim()) return null
  const tam = findSpecialistForSpecialty(String(ham))?.specialtyKey
  if (tam) return tam
  const b = String(ham).trim().toLocaleLowerCase('tr-TR')
  return SERBEST_METIN.find(([re]) => re.test(b))?.[1] ?? null
}
