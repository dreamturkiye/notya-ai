/**
 * NOTYA-ASISTAN-SABLON — Uzbekistan: the assistant's instruction for every role of the pack.
 *
 * MACHINE-WRITTEN. A native-speaking clinician has not read it. The screen name stays the owner's list
 * (../klinik/asistanAdlari.ts). This file does not invent a personal name, and it does not put a textbook into
 * the visit-note instruction.
 *
 * The chart rules are the shared list (lib/asistan/cekirdekEgitim.ts). The two international titles are the
 * shared list (lib/ulke/asistan/kitaplar.ts). The national line is the Ministry of Health's clinical protocols
 * for the specialty the nomenclature already names (../klinik/rolListesi.ts). No protocol number is claimed.
 */
import { cekirdekMetni } from '@/lib/asistan/cekirdekEgitim'
import { ikiUluslararasi } from '@/lib/ulke/asistan/kitaplar'
import { asistanTalimatiKur, ucKaynak, type AsistanCumleleri } from '@/lib/ulke/asistan/sablon'
import type { DilKodu } from '@/lib/ulke/tipler'
import { UZ_ROL_ADLARI, uzAdDili, type UzAdDili } from '../klinik/rolAdlari'
import { UZ_ROL_SATIRLARI } from '../klinik/rolListesi'

const UZ: AsistanCumleleri = {
  profesor: "Siz %s professori siz. Klinik amaliyotingiz %c yigirma yildan ortiq.",
  kidemli: "Siz %c yigirma yildan ortiq amaliyotga ega katta %s siz. Siz shifokor emassiz. Tibbiy tashxis qo'ymang va dori yozmang.",
  kaynak: "Sizning uchta manbangiz, boshqasi emas: (1) %1 (2) %2 (3) %3. Bu mamlakatning klinik shifokori bu nomlarni o'qimagan. Faqat shularni ayting. Manba va yozuv zid bo'lsa, bo'lgan ish yozuvdadir.",
}

const UZ_KIRIL: AsistanCumleleri = {
  profesor: 'Сиз %s профессорисиз. Клиник амалиётингиз %c йигирма йилдан ортиқ.',
  kidemli: 'Сиз %c йигирма йилдан ортиқ амалиётга эга катта %s сиз. Сиз шифокор эмассиз. Тиббий ташхис қўйманг ва дори ёзманг.',
  kaynak: 'Сизнинг учта манбангиз, бошқаси эмас: (1) %1 (2) %2 (3) %3. Бу мамлакатнинг клиник шифокори бу номларни ўқимаган. Фақат шуларни айтинг. Манба ва ёзув зид бўлса, бўлган иш ёзувдадир.',
}

const RU: AsistanCumleleri = {
  profesor: 'Вы профессор по специальности «%s» и более двадцати лет ведёте клиническую практику в %c.',
  kidemli: 'Вы старший специалист (%s) с более чем двадцатилетней практикой в %c. Вы не врач. Не ставьте медицинский диагноз и не назначайте лекарства.',
  kaynak: 'Ваши три источника, и никаких других: (1) %1 (2) %2 (3) %3. Клиницист этой страны эти названия не читал. Называйте только их. Если источник и карта расходятся, произошло то, что записано в карте.',
}

const YER: Record<UzAdDili, { ulke: string; cumle: AsistanCumleleri; dil: 'uz' | 'ru' }> = {
  'uz-Latn': { ulke: "O'zbekistonda", cumle: UZ, dil: 'uz' },
  'uz-Cyrl': { ulke: 'Ўзбекистонда', cumle: UZ_KIRIL, dil: 'uz' },
  ru: { ulke: 'Узбекистане', cumle: RU, dil: 'ru' },
}

/** Ministry protocols for this specialty, in the form asked for. The specialty's own name, not another role's. */
function ulusal(rol: string, d: UzAdDili, resmiAd: string | null): string {
  const ad = UZ_ROL_ADLARI[rol]?.[d] ?? resmiAd ?? rol
  if (d === 'ru') return `Клинические протоколы Министерства здравоохранения Республики Узбекистан — ${ad}`
  if (d === 'uz-Cyrl') return `Ўзбекистон Республикаси Соғлиқни сақлаш вазирлиги клиник протоколлари — ${ad}`
  return `O'zbekiston Respublikasi Sog'liqni saqlash vazirligi klinik protokollari — ${resmiAd ?? ad}`
}

export function uzAsistanTalimati(dil: DilKodu, rol: string): string | null {
  if (dil !== 'uz-Latn' && dil !== 'uz-Cyrl' && dil !== 'ru') return null
  const d = uzAdDili(dil)
  const satir = UZ_ROL_SATIRLARI.find((r) => r.anahtar === rol)
  if (!satir || !UZ_ROL_ADLARI[rol]) return null
  const yer = YER[d]
  const [a, b] = ikiUluslararasi(rol, satir.gibi)
  const kaynaklar = ucKaynak([ulusal(rol, d, satir.resmiAd), a, b])
  const metin = asistanTalimatiKur(yer.ulke, { uzmanlik: UZ_ROL_ADLARI[rol][d], taraf: satir.taraf, kaynaklar }, yer.dil, yer.cumle)
  // The Cyrillic form uses the Cyrillic sentences. The shared chart rules are selected by yer.dil, so a Cyrillic
  // screen still receives the Latin Uzbek rules unless we swap them. Swap: the Latin core is replaced by nothing
  // here — cekirdekMetni('uz') is Latin. For Cyrillic, append a one-line pointer that the rules above are the
  // same rules, already in the professor sentence's language when dil is ru, and for uz-Cyrl state them in Cyrillic.
  if (d !== 'uz-Cyrl') return metin
  const lotin = cekirdekMetni('uz')
  return metin.replace(lotin, 'Ёзувда йўқ сонни айтманг. Дори дозасидан вазн ҳисобламанг. Режалаштирилган эмлаш қилинган эмлаш эмас. Лаборатория натижаси ёзувдаги сўнгги қийматдир; референс оралиғи лабораторияники. Айтилган ташрифдаги ўлчов ўша ташрифда ёзилган қийматдир.')
}
