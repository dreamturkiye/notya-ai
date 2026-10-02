/**
 * NOTYA-AYSE-ARAC-PARITE — the acceptance questions of the read tools and their scene, shared by the acceptance test
 * (lib/asistan/aracPariteKabul.test.ts) and the latency runner (lib/asistan/tests/okumaGecikme.kos.ts).
 *
 * Importing this module installs the scene mocks (via ./ayseSahne), so it must come before any product import.
 * Synthetic QA data only.
 */
import { ortam, sahneKur, oturumAc, encrypt, type Sahne, type SahteArac } from './ayseSahne'
import { pratikEkle, yabanciPratikEkle, PRATIK } from './pratikSahne'
import { olcumDosyasi, olcumHastasiEkle, OLCUM_COCUK_ADI, KILO_12AY, TARIH_12AY } from './olcumHastasi'
import { bugunTz } from '../../randevu/tarihCozumle'

export const OKUMA_TZ = 'Europe/Istanbul'

export type OkumaSahnesi = { s: Sahne; elif: string; bebek: string; yabanci: string; bugun: string }

/** One doctor's practice, the measurement patient, and another doctor with louder data of every kind. */
export function okumaSahnesiKur(): OkumaSahnesi {
  const s = sahneKur()
  const bugun = bugunTz(OKUMA_TZ)
  const { kimlikHastasi: elif } = pratikEkle(ortam.db, encrypt, s.doktor.id, bugun)
  const yabanci = yabanciPratikEkle(ortam.db, encrypt, s.diger.id, bugun)
  const bebek = olcumHastasiEkle(ortam.db, encrypt, s.doktor.id, olcumDosyasi('a'))
  return { s, elif, bebek, yabanci, bugun }
}

export type OkumaSorusu = {
  ad: string
  /** The sentence with the chart open / with no chart (names the patient when the question is about one). */
  acik: string
  yok: string
  /** Which patient is open in the "chart open" state. */
  acikHasta: 'elif' | 'bebek'
  /** The tool call a model makes for this sentence. */
  arac: (soz: string, k: OkumaSahnesi) => SahteArac
  /** Facts the answer must carry. */
  dogru: RegExp[]
  kimlik?: boolean
  /** Voice says a list is on screen instead of reading every item: the spoken answer is checked for these instead. */
  sozde?: RegExp[]
  /** What the model-free router says for the same sentence, when its wording differs from the tool result. */
  yonlendirici?: RegExp[]
}

/** The prompt rule: the doctor's whole sentence goes to hasta_bul. */
export const butunCumle = (soz: string): SahteArac => ({ name: 'hasta_bul', input: { isim: soz } })

const SIRALAMA = [/Son 1 ay en çok yazdığın antibiyotik Augmentin \(3 reçete\)/, /Sıra: Augmentin 3, Klacid 1/]
// Free ranges depend on the clock; in the last minutes of the day there are none left.
const BOSLUK = /takviminde 1 randevu var; (boş saatler \(çalışma saatleri 00:00–23:59\): |boş saat kalmadı)/

export const OKUMA_SORULARI: OkumaSorusu[] = [
  { ad: 'antibiyotik sıralaması — "en fazla"', acik: 'Son bir ay içinde hangi antibiyotiği en fazla yazdım?', yok: 'Son bir ay içinde hangi antibiyotiği en fazla yazdım?', acikHasta: 'elif', arac: butunCumle, dogru: SIRALAMA },
  { ad: 'antibiyotik sıralaması — "en çok"', acik: 'Son bir ayda en çok hangi antibiyotiği yazdım?', yok: 'Son bir ayda en çok hangi antibiyotiği yazdım?', acikHasta: 'elif', arac: butunCumle, dogru: SIRALAMA },
  { ad: 'antibiyotik sıralaması — "en sık"', acik: 'Son bir ay içinde en sık yazdığım antibiyotik hangisi?', yok: 'Son bir ay içinde en sık yazdığım antibiyotik hangisi?', acikHasta: 'elif', arac: butunCumle, dogru: SIRALAMA },
  { ad: 'anne ve baba adı', acik: 'Annesinin ve babasının adı ne?', yok: `${PRATIK.kimlikHastasi} annesinin ve babasının adı ne?`, acikHasta: 'elif', arac: butunCumle, dogru: [new RegExp(`Anne adı: ${PRATIK.annesi}`), new RegExp(`Baba adı: ${PRATIK.babasi}`)], kimlik: true },
  { ad: '12 aylık muayenenin kilosu', acik: 'Bu hasta 12 aylık muayenesine geldiğinde kaç kiloydu?', yok: `${OLCUM_COCUK_ADI} 12 aylık muayenesine geldiğinde kaç kiloydu?`, acikHasta: 'bebek', arac: butunCumle, dogru: [new RegExp(`12 aylık muayene \\(${TARIH_12AY.replace(/\./g, '\\.')}\\): kilo ${KILO_12AY}`), /Kaynak: muayene notunun yaşamsal bulgu alanı/], sozde: [/12 aylık muayene/, /9,8/] },
  {
    ad: 'bugün ne zaman boş vaktim var', acik: 'Bugün ne zaman boş vaktim var?', yok: 'Bugün ne zaman boş vaktim var?', acikHasta: 'elif',
    arac: (_soz, k) => ({ name: 'randevu_takvim', input: { tarih: k.bugun } }),
    dogru: [new RegExp(`takviminde 1 randevu: 15:00–15:20 ${PRATIK.randevuHastasi} \\(kontrol\\)`), /boş saatler \(çalışma saatleri 00:00–23:59\): |boş saat kalmadı/],
    sozde: [/takviminde 1 randevu/], yonlendirici: [BOSLUK],
  },
  { ad: 'bugün ne zaman boş vaktim var — cümle hasta_bul’a giderse', acik: 'Bugün ne zaman boş vaktim var?', yok: 'Bugün ne zaman boş vaktim var?', acikHasta: 'elif', arac: butunCumle, dogru: [BOSLUK], sozde: [/takviminde 1 randevu/] },
  { ad: 'son bir ayda kaç aşı yaptık', acik: 'Son bir ayda kaç aşı yaptık?', yok: 'Son bir ayda kaç aşı yaptık?', acikHasta: 'elif', arac: butunCumle, dogru: [new RegExp(`Son 1 ay ${PRATIK.asiSayisi} aşı kaydı var \\(3 hasta\\)`)] },
]

/** A new assistant session in the given chart state for a question. */
export function okumaOturumu(k: OkumaSahnesi, soru: OkumaSorusu, durum: 'acik' | 'yok'): string {
  if (durum === 'yok') return oturumAc(k.s)
  return oturumAc(k.s, { id: k[soru.acikHasta], ad: soru.acikHasta === 'elif' ? PRATIK.kimlikHastasi : OLCUM_COCUK_ADI })
}
