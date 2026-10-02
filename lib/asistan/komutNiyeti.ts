/**
 * NOTYA-AYSE-GERI-03 (audit §4.4, PR 4) — ONE shared check: is this sentence a COMMAND, and which tool does it name?
 *
 * A command is a request to DO something to a record — "alerjisini ekle", "randevusunu perşembeye al", "Ventolini
 * kes", "dozunu değiştir", "not al". It must reach Luna and its tools. Until now only the narrow verb list of
 * kayitNiyetiMi ("kaydet", "yazıver", "dosyaya gir" …) did; every other wording was answered by a model-free router
 * first — the quick card ("Dosyada alerji: kayıt yok."), the calendar reader (a day's schedule for "yarın 14:00
 * randevu oluştur") or the count template.
 *
 * What a command changes in ayseCevapla:
 *   - the calendar reader, the identity answer, the quick card, the search sentence and the deterministic
 *     chart-open are skipped;
 *   - with a patient resolved the tool call is FORCED: the named tool when the wording names one, any tool otherwise;
 *   - with no patient resolved the tools are still offered, with a `hasta_adi` field the server resolves inside the
 *     doctor's own patients (core/eylemler/araclar.ts).
 * Nothing is written by a tool call: it prepares a card; the doctor's tap or spoken "Evet" commits.
 *
 * Request forms only. A question or a statement is not a command: "ne zaman kestik", "alerjisi eklendi mi",
 * "randevu aldı mı", "kilosu kaç", "bu ilaç ağrıyı keser", "yazın alerjisi artıyor".
 */
import { kayitNiyetiMi } from '@/core/eylemler/oneri'
import { duz, randevuNiyetiBul, randevuSaatiBul, soylenenTarih, type RandevuNiyeti } from '@/lib/randevu/randevuSozu'

export interface KomutNiyeti {
  /** The tool the wording names (core/eylemler anahtar), or null when it is a command without a single clear tool. */
  arac: string | null
  /**
   * Force the tool call when a patient is resolved. False only when forcing would produce an empty card where one
   * short question is the right answer (an appointment request that names neither a day nor a time).
   */
  zorla: boolean
  randevu?: RandevuNiyeti
}

/** Request endings WITHOUT the aorist: imperative, optative, infinitive, ability, future, "-iver", first-person present. */
const ISTEK = '(?:y?[ae]l[iu]m|y?[ae]y[iu]m|y?[iu]n(?:[iu]z)?|m[ae]k|m[ae]m(?:[iu]z)?|m[ae]y[iu]|y?[ae]bil\\w*|y?[ae]c[ae]g[iu]m|y?[ae]c[ae]g[iu]z|s[ae]n[ae]|y?[iu]ver\\w*|s[iu]n|[iu]yorum|[iu]yoruz)?'
/** The aorist is a request only as a question to the assistant: "ekler misin", "keser misiniz". Alone it states a fact. */
const SANA_SORU = /^(misin|misiniz|musun|musunuz)$/
/** Imperative look-alikes that are ordinary words: "kesin" (certain), "yazın" (in summer), "girin". */
const FIIL_DEGIL = new Set(['kesin', 'kesinlikle', 'yazin', 'alin', 'alim', 'yapin'])

/** Index of the first token that is a request form of one of the stems, or -1. */
function fiilBul(k: string[], kokler: string[]): number {
  const istek = new RegExp(`^(?:${kokler.join('|')})${ISTEK}$`)
  const genis = new RegExp(`^(?:${kokler.join('|')})(?:[aeiu]r|r)$`)
  for (let i = 0; i < k.length; i++) {
    if (FIIL_DEGIL.has(k[i])) continue
    if (istek.test(k[i])) return i
    if (genis.test(k[i]) && SANA_SORU.test(k[i + 1] || '')) return i
  }
  return -1
}

const EKLE = ['ekle', 'kaydet', 'kayded', 'isle']
/** "yaz" / "gir" record only what is not a drug: writing a drug is prescribing, and prescribing is never a tool. */
const YAZ = ['yaz', 'gir']
const KES = ['kes', 'sonlandir', 'birak', 'durdur']
const DEGISTIR = ['degistir', 'guncelle', 'duzelt', 'yap', 'artir', 'azalt', 'dusur', 'cikar', 'indir', 'yukselt', 'cek']
const KALDIR = ['kaldir', 'sil', 'cikar']
const BASLA = ['basla', 'baslat']
const DUZELT = ['duzelt', 'degistir', 'guncelle']
/** A yes/no question particle after the verb ("ekledik mi", "kesti mi") — "ekleyelim mi" is still a request. */
const SORU_EKI = new Set(['mi', 'mu', 'miydi', 'muydu', 'miymis', 'muymus'])
/** "sesi kes", "sözü kes", "kısa kes": the object is not a drug. */
const KES_DISI = new Set(['sesi', 'sesini', 'sozu', 'sozunu', 'konusmayi', 'muzigi', 'kisa', 'lafi', 'hemen', 'artik', 'tamam', 'peki', 'yeter', 'sunu', 'bunu'])
const DOZ_BICIMI = /\b\d+(?:[.,]\d+)?\s?(?:mg|mcg|ml|gr|g|iu|unite|damla|tablet|olcek|puf)\b|\b\d\s?x\s?\d\b/
/** National-schedule vaccine names as doctors say them (normalized ASCII). */
const ASI_ADI = / (kkk|hepatit a|hepatit b|bcg|dabt\w*|ipa|hib|kpa|opa|sucicegi|su cicegi|meningokok\w*|menengokok\w*|rotavirus|rota|hpv|karma) /
/** A text for somebody ("WhatsApp mesajı yaz", "rapor yaz", "mektup hazırla") is a draft, never a chart record. */
const METIN_ISTEGI = / (mesaj\w*|whatsapp|eposta|e posta|mail\w*|sms|mektup\w*|rapor\w*|yazi\w*|metin\w*|epikriz\w*|ozet\w*) /

export const RANDEVU_ARACI: Record<RandevuNiyeti, string> = { olustur: 'kontrol_randevusu_olustur', tasi: 'randevu_tasi', iptal: 'randevu_iptal' }

/**
 * Is there enough to prepare the card? A booking needs a day AND a time; a move needs a new day OR a new time (the
 * other one is kept); a cancel needs neither. Short of that the right answer is one question, not a card with
 * yellow blanks — and the missing piece arrives in the doctor's next sentence (BekleyenKomut).
 */
export function randevuTamMi(tur: RandevuNiyeti, tarih: string | null | undefined, saat: string | null | undefined): boolean {
  if (tur === 'iptal') return true
  if (tur === 'tasi') return Boolean(tarih || saat)
  return Boolean(tarih && saat)
}

/**
 * NOTYA-AYSE-GERI-03 — a command that could not be finished in one sentence (asistan_sessions.active_context
 * .bekleyenKomut). "Bir randevu yapmak istiyorum" → "Hangi hasta için?" → "Umutcan Türkoğlu" → "Hangi gün?" →
 * "Yarın" → "Saat kaçta?" → "14:30": the last sentence carries no verb at all, yet it completes the booking. The
 * server keeps what was already said (tool, day, time) and, once the request is complete, forces the tool call —
 * so finishing it does not depend on the model remembering three turns back. Written by the server for this
 * doctor's session only; dropped after BEKLEYEN_KOMUT_OMRU_MS, by a new command, a card, or a change of subject.
 */
export interface BekleyenKomut {
  arac: string | null
  randevu?: RandevuNiyeti
  /** The command was asked with no patient resolved — the next sentence may be the patient's name. */
  hastasiz: boolean
  tarih?: string | null
  saat?: string | null
  /** Sentences taken as an answer so far; the state is dropped instead of lingering over small talk. */
  deneme: number
  zaman: string
}
export const BEKLEYEN_KOMUT_OMRU_MS = 10 * 60 * 1000
export const BEKLEYEN_KOMUT_AZAMI_DENEME = 4

export function bekleyenKomutOku(ham: unknown, simdi: Date = new Date()): BekleyenKomut | null {
  if (!ham || typeof ham !== 'object') return null
  const v = ham as Partial<BekleyenKomut>
  const t = new Date(String(v.zaman || '')).getTime()
  if (!Number.isFinite(t) || simdi.getTime() - t > BEKLEYEN_KOMUT_OMRU_MS) return null
  const deneme = Number.isFinite(Number(v.deneme)) ? Number(v.deneme) : 0
  if (deneme >= BEKLEYEN_KOMUT_AZAMI_DENEME) return null
  const randevu = v.randevu === 'olustur' || v.randevu === 'tasi' || v.randevu === 'iptal' ? v.randevu : undefined
  return {
    arac: typeof v.arac === 'string' && v.arac ? v.arac : null,
    randevu,
    hastasiz: v.hastasiz === true,
    tarih: typeof v.tarih === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.tarih) ? v.tarih : null,
    saat: typeof v.saat === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v.saat) ? v.saat : null,
    deneme,
    zaman: String(v.zaman),
  }
}

const VAZGEC = / (vazgec\w*|bosver|bos ver|gerek yok|gerek kalmadi|istemiyorum|kalsin|iptal|hayir) /
const SORU = / (mi|mu|miyim|muyum|miyiz|muyuz|misin|musun|misiniz|musunuz|miydi|muydu|kac|kim|kimler|kimin|ne|nedir|neydi|nasil|neden|niye|neler|hangi|hangisi) /

/**
 * Is this sentence an ANSWER to the question a pending command asked (a name, a day, a time), rather than a new
 * subject? Short, not a question, not a withdrawal.
 */
export function komutCevabiMi(mesaj: string | null | undefined): boolean {
  const ham = String(mesaj || '').trim()
  if (!ham || /\?/.test(ham)) return false
  const n = duz(ham)
  if (n.trim().split(' ').length > 8) return false
  return !VAZGEC.test(n) && !SORU.test(n)
}

/** Null = not a command. */
export function komutNiyetiBul(mesaj: string | null | undefined, secenek: { saatDilimi?: string | null; simdi?: Date } = {}): KomutNiyeti | null {
  const ham = String(mesaj || '').trim()
  if (!ham) return null
  const n = duz(ham)
  const k = n.trim().split(' ').filter(Boolean)
  const var_ = (kokler: string[]) => fiilBul(k, kokler) >= 0

  // Appointments: "randevu" + a request verb. The calendar reader must never capture these (audit §4.4).
  const randevu = randevuNiyetiBul(ham)
  if (randevu) {
    const tarih = soylenenTarih(ham, secenek.saatDilimi || '', secenek.simdi, { ileri: true })
    const saat = randevuSaatiBul(ham)
    return { arac: RANDEVU_ARACI[randevu], zorla: randevuTamMi(randevu, tarih, saat), randevu }
  }

  const eski = kayitNiyetiMi(ham)
  // A yes/no question about what was done is not a request ("alerjisi eklendi mi", "ilacı kesti mi").
  const soruEki = k.some((t, i) => SORU_EKI.has(t) && !/(l[iu]m|y[iu]m)$/.test(k[i - 1] || ''))
  if (soruEki) return eski ? { arac: null, zorla: true } : null
  if (METIN_ISTEGI.test(n) && !/ dosya\w* /.test(n)) return eski ? { arac: null, zorla: true } : null

  const ekle = var_(EKLE) || eski
  const yaz = ekle || var_(YAZ)
  const adaylar: string[] = []
  if (/ alerji\w* /.test(n)) {
    if (var_(KALDIR)) adaylar.push('alerji_kaldir')
    else if (yaz) adaylar.push('alerji_ekle')
  }
  if (/ kronik\w* /.test(n) && yaz) adaylar.push('kronik_hastalik_ekle')
  if (/ bas cevre\w* /.test(n) && yaz) adaylar.push('bas_cevresi_ekle')
  else if (/ (kilo\w*|agirlig\w*|boy|boyu\w*|ates\w*|nabiz\w*|nabz\w*|tansiyon\w*|spo2|saturasyon\w*|olcum\w*) /.test(n) && yaz) adaylar.push('olcum_ekle')
  // A vaccine named without the word "aşı" ("Hepatit B dün yapıldı, kaydet") is still a vaccine record.
  if ((/ asi\w* /.test(n) || ASI_ADI.test(n)) && yaz && !adaylar.includes('alerji_ekle')) adaylar.push('asi_kaydi_ekle')
  if (/ doz\w* /.test(n) && var_(DEGISTIR)) adaylar.push('ilac_doz_degistir')
  else if ((/ (ilac\w*|tedavi\w*) /.test(n) || DOZ_BICIMI.test(n)) && (ekle || var_(BASLA)) && !adaylar.length) adaylar.push('ilac_ekle')
  // "Ventolini kes", "ilacı sonlandır": a stop verb with an object that is not the conversation itself.
  const kesIdx = fiilBul(k, KES)
  if (kesIdx > 0 && !KES_DISI.has(k[kesIdx - 1]) && !/ doz\w* /.test(n)) adaylar.push('ilac_sonlandir')
  // "not al", "dosyasına not düş / ekle"
  if (/ not(u|unu)? (al|alalim|alir|alsana|dus|duselim|duser|ekle\w*|yaz|yazalim|yazar|birak) /.test(n)) adaylar.push('dosya_notu_ekle')
  if (/ (dogum tarih\w*|telefon\w*) /.test(n) && var_(DUZELT)) adaylar.push('hasta_bilgisi_duzelt')

  const benzersiz = [...new Set(adaylar)]
  if (benzersiz.length) return { arac: benzersiz.length === 1 ? benzersiz[0] : null, zorla: true }
  // A record verb with no single clear tool ("bunu dosyaya işle", "epikrizdekileri kaydet"): any tool.
  if (eski) return { arac: null, zorla: true }
  if (var_(['ekle', 'isle']) && k.length <= 12) return { arac: null, zorla: true }
  return null
}

export function komutMu(mesaj: string | null | undefined): boolean {
  return komutNiyetiBul(mesaj) !== null
}
