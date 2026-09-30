/**
 * NOTYA-SES-TAKVIM-01 — clinic-day calendar is a lookup, not a model turn.
 *
 * Live (Kaan, 2026-09-29): "bugün randevu var mı" waited 10s+ (full patient dossier on
 * every voice turn), the answer appeared as text only, then ElevenLabs dropped the
 * Custom LLM ("Bağlantı kurulamadı"). Voice never spoke the day list because
 * tek-beyin has no randevu_takvim client tool — the question went through ayseCevapla
 * like a chart query. Detect here; answer from randevular (doktor_id) without the LLM.
 *
 * Live (Kaan, 2026-09-29, 10:09): after a true "takvimde randevu yok", Fish/EL sent "..."
 * twice. The model treated the ellipsis as a challenge and recanted ("doğrulamadan
 * belirtmemeliydim", send the doctor to Ana Sayfa). ASR noise is not a question;
 * "emin misin" re-reads the same lookup.
 *
 * NOTYA-TAKVIM-TZ-01 (Kaan, 2026-09-29, 19:35 US Eastern): "bugün" answered for 30 Eylül — the
 * date was TRT. Dates now resolve in the doctor's timezone (lib/randevu/tarihCozumle.ts). And the
 * follow-up "Peki yarın var mı hocam?" carried no "randevu" noun, so it fell through to the model,
 * which told the doctor to check the menu. A bare date question ("yarın var mı", "yarın kaç hastam
 * var", "yarın kimler geliyor") is a calendar question on its own, and after a calendar answer any
 * message that is only a date expression (+ "peki / var mı / hocam") continues the calendar lookup.
 */
import { kayitNiyetiMi } from '@/core/eylemler/oneri'
import { trAramaNormalize } from '@/lib/utils/turkceArama'
import { sesGurultusuMu } from '@/lib/asistan/sesGurultu'
import { TARIH_IFADESI, bugunTz, cevaptakiTarih, goreliTarihCoz, haftaAraligiCoz, saatDilimiSec } from '@/lib/randevu/tarihCozumle'

export { sesGurultusuMu }

export type TakvimSorusu = {
  tarih: string
  saat: string | null
  /** NOTYA-AYSE-100 T1: "bu hafta / haftaya" without a weekday — Monday..Sunday, read day by day. */
  aralik?: { bas: string; bit: string }
}

/** Doctor's IANA timezone (client `saatDilimi` → cookie → TRT) and the instant "now" (tests). */
export type TakvimSecenek = { saatDilimi?: string | null; simdi?: Date }

const SAAT = /\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/
/** NOTYA-AYSE-100 T2: spoken slot — "saat 3", "3'te", "üçte"; "öğleden sonra / akşam" moves 1–7 to the afternoon. */
const SAAT_SOZ = /\b(?:saat\s+)?([01]?\d|2[0-3])\s*(?:['’]?\s*(?:te|de|ta|da)\b|\s*(?:gibi|civari|sularinda)\b)/
const SAAT_YAZI: Record<string, number> = { bir: 1, iki: 2, uc: 3, dort: 4, bes: 5, alti: 6, yedi: 7, sekiz: 8, dokuz: 9, on: 10, onbir: 11, oniki: 12 }
function sozSaati(ham: string, n: string): string | null {
  const sm = ham.match(SAAT)
  if (sm) return `${String(sm[1]).padStart(2, '0')}:${sm[2]}`
  let saat: number | null = null
  const m1 = n.match(SAAT_SOZ)
  if (m1) saat = Number(m1[1])
  else {
    const m2 = n.match(/\b(?:saat\s+)?(bir|iki|uc|dort|bes|alti|yedi|sekiz|dokuz|on|onbir|oniki)(?:de|da|te|ta)\b/)
    if (m2) saat = SAAT_YAZI[m2[1]]
  }
  if (saat == null) return null
  if (saat >= 1 && saat <= 7 && /\b(ogleden sonra|aksam|aksamustu|ikindi)\b/.test(n)) saat += 12
  return `${String(saat).padStart(2, '0')}:00`
}

/** Words that add nothing to a calendar question ("peki", "hocam", "acaba"…). */
const DOLGU = new Set(['peki', 'hocam', 'acaba', 'ya', 'bir', 'de', 'da', 'e', 'ee', 'o', 'zaman', 'icin', 'bakalim', 'bakar', 'misin', 'misiniz', 'soyle', 'soyler', 've', 'ile', 'tamam', 'iyi', 'simdi', 'hic', 'hicbir', 'benim', 'bizim', 'ki', 'da', 'sonra', 'gun', 'gune', 'gunu', 'gunun'])
/** Calendar question words allowed in the bare form ("yarın var mı", "yarın kaç hastam var", "yarın kimler geliyor"). */
const TAKVIM_SORU = new Set(['bosluk', 'boslugum', 'yer', 'yerim', 'musait', 'musaitim', 'uygun', 'sabah', 'sabahi', 'ogle', 'ogleden', 'sonra', 'once', 'aksam', 'aksamustu', 'ikindi', 'saat', 'saatte', 'saatim', 'te', 'de', 'ta', 'da', 'geldi', 'geldiler', 'gelmis', 'gelmisti', 'gelen', 'gelenler', 'gordum', 'baktim', 'gorunuyor', 'gozukuyor', 'bakiyor', 'yogunluk', 'gunumde', 'var', 'mi', 'mu', 'yok', 'doluyum', 'dolu', 'muyum', 'muyuz', 'bos', 'bosum', 'bosuz', 'kac', 'hasta', 'hastam', 'hastamiz', 'hastalar', 'kimler', 'kim', 'geliyor', 'gelecek', 'gelir', 'ne', 'neler', 'program', 'programim', 'programimiz', 'durum', 'nasil', 'gunum', 'gunumuz', 'randevu', 'randevum', 'randevumuz', 'randevular', 'randevularim', 'randevularimiz', 'takvim', 'takvimim', 'takvimimiz', 'liste', 'listele', 'oku', 'goster', 'doluluk', 'yogun', 'yogunum', 'hastalarim', 'hastalarimiz'])

function normalize(mesaj: string | null | undefined): string {
  return ` ${trAramaNormalize(String(mesaj || '')).replace(/[?!.,;:’'"]+/g, ' ').replace(/\s+/g, ' ').trim()} `
}

/** Tokens left once every date expression is removed from the normalized text. */
function tarihsizKelimeler(n: string): { kelimeler: string[]; tarihVar: boolean } {
  let tarihVar = false
  const kalan = n.replace(new RegExp(TARIH_IFADESI.source, 'g'), () => { tarihVar = true; return ' ' })
  return { kelimeler: kalan.split(/\s+/).filter(Boolean), tarihVar }
}

/**
 * Bare calendar question: a date expression plus only calendar-question words and filler.
 * `soruGerekli` = at least one question word must be present (first turn); a follow-up needs only the date.
 */
function ciplakTakvimSorusuMu(n: string, soruGerekli: boolean): boolean {
  const { kelimeler, tarihVar } = tarihsizKelimeler(n)
  if (!tarihVar) return false
  let soru = false
  for (const k of kelimeler) {
    if (TAKVIM_SORU.has(k)) { soru = true; continue }
    if (DOLGU.has(k) || /^\d{1,2}$/.test(k)) continue
    return false
  }
  return soruGerekli ? soru : true
}

export function takvimSorusuMu(mesaj: string | null | undefined): boolean {
  return takvimSorusuCoz(mesaj) != null
}

/** Clinic calendar lookup (today / tomorrow / a weekday / a date / a slot) in the doctor's timezone. Null = not this question. */
export function takvimSorusuCoz(mesaj: string | null | undefined, secenek: TakvimSecenek = {}): TakvimSorusu | null {
  const ham = String(mesaj || '').trim()
  if (!ham || kayitNiyetiMi(ham)) return null
  const n = normalize(ham)
  if (n.length < 6) return null

  const randevu = /\b(randevu\w*|takvim\w*|appointment\w*)\b/.test(n)
  const gun = TARIH_IFADESI.test(n) || /\bo gun\b/.test(n)
  const soru = /\b(var mi|neler|ne var|kimler|bos mu|cakisma|any|have we|do we|have any)\b/.test(n)
    || /\b(listele|oku|goster)\b/.test(n)
  const bosSaat = /\b(o saat|saat)\b/.test(n) && /\b(bos|cakis|musait|uygun)\b/.test(n)
  const saatBos = SAAT.test(ham) && /\b(bos|cakis|musait|uygun)\b/.test(n)
  const ciplak = !randevu && ciplakTakvimSorusuMu(n, true)
  if (!randevu && !bosSaat && !saatBos && !ciplak) return null
  if (randevu && !gun && !soru && !bosSaat && !saatBos) return null
  if (/\b(olustur|hazirla)\b/.test(n) && !soru && !gun) return null

  const tz = saatDilimiSec(secenek.saatDilimi)
  const tarih = goreliTarihCoz(n, tz, secenek.simdi) || bugunTz(tz, secenek.simdi)

  const saat = sozSaati(ham, n)
  const aralik = saat ? null : haftaAraligiCoz(n, tz, secenek.simdi)
  return aralik ? { tarih: aralik.bas, saat, aralik } : { tarih, saat }
}

/** "Emin misin / bir daha bak" after a calendar answer — re-read, do not send to the model. */
export function takvimTakibiMi(mesaj: string | null | undefined): boolean {
  const n = normalize(mesaj)
  if (n.trim().length < 3) return false
  return /\b(emin misin|emin misiniz|dogru mu|gercekten|bir daha bak|tekrar (soyle|oku|bak)|yok mu|hic mi yok|kesin mi|yanlis mi|dogrula)\b/.test(n)
}

export function sonTakvimCevabiMi(metin: string | null | undefined): boolean {
  return /takvim(?:inizde|inde)\s+.{0,20}randevu|haftas\w*\s+takvim/i.test(String(metin || ''))
}

/** Model recanting a system calendar fact (live: "doğrulamadan belirtmemeliydim" + Ana Sayfa). */
export function takvimRecantMi(metin: string | null | undefined): boolean {
  const n = trAramaNormalize(String(metin || ''))
  return /(dogrulamadan|kesinmis gibi|bilgiye guvenmeyin|kesin soyleyemem|randevu listesi gorunmedi|takvimini dogrulama|ana sayfa.{0,60}randevu|randevu.{0,60}ana sayfa|bu konusmada randevu|bu konusmada.{0,40}gorunm|menu\w*.{0,40}(randevu|takvim)|(randevu|takvim).{0,40}menu)/.test(n)
}

/**
 * Calendar context carries across turns. If the last assistant line was a calendar lookup:
 *  - "emin misin / bir daha bak" re-reads the SAME day that answer named;
 *  - a message that is only a date expression (+ "peki / var mı / hocam"…) reads that day
 *    ("Peki yarın var mı hocam?", "öbür gün?", "haftaya cuma").
 */
export function takvimTakipCoz(
  mesaj: string | null | undefined,
  sonAsistan: string | null | undefined,
  secenek: TakvimSecenek = {},
): TakvimSorusu | null {
  if (!sonTakvimCevabiMi(sonAsistan)) return null
  if (sesGurultusuMu(mesaj)) return null
  const tz = saatDilimiSec(secenek.saatDilimi)
  const n = normalize(mesaj)
  if (takvimTakibiMi(mesaj)) {
    return { tarih: cevaptakiTarih(trAramaNormalize(String(sonAsistan || ''))) || bugunTz(tz, secenek.simdi), saat: null }
  }
  if (!ciplakTakvimSorusuMu(n, false)) return null
  const tarih = goreliTarihCoz(n, tz, secenek.simdi)
  if (!tarih) return null
  const saat = sozSaati(String(mesaj || ''), n)
  const aralik = saat ? null : haftaAraligiCoz(n, tz, secenek.simdi)
  return aralik ? { tarih: aralik.bas, saat, aralik } : { tarih, saat }
}
