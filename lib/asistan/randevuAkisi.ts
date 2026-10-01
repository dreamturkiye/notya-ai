/**
 * NOTYA-RANDEVU-AYSE-01 (Kaan, 2026-10-01) — Ayşe books, moves and cancels appointments for the doctor.
 *
 * Live (Dr. Gökhan): "Bir randevu yapmak istiyorum bir hasta için yardımcı olur musun?" was answered with
 * "Son 90 gün 0 hasta. Filtre: son 90 gün · Randevu." — the word "randevu" is a chart field for the patient
 * search, so the sentence never reached a tool (docs/ayse-randevu-forensics.md). An appointment request is not a
 * search and not a model turn: this module is a small deterministic dialogue that runs right after the scope
 * gate, before the calendar reader and the patient search.
 *
 *   1. Intent: "randevu" + an action verb (oluştur / ver / al / yap … · ertele / taşı / değiştir … · iptal et).
 *      A question about the calendar ("yarın randevum var mı") has no action verb and stays with takvimSorusu.
 *   2. Slots, ONE short question at a time: patient → day → time. Day and time are read in the doctor's timezone.
 *   3. Patient by name through hastaninSozunuCoz (this doctor's patients only). Several matches → "hangisi?";
 *      no match → says so. Nothing is ever resolved from another doctor's rows (HASTA-IZOLASYON-01).
 *   4. Writes are never done here. The flow prepares a taslak (eylem_onerileri) and reads back patient, day and
 *      time in one sentence. The commit is the doctor's: spoken "Evet" (lib/asistan/sesliOnay.ts, outside the
 *      brain) or the tap on the card — the same spine as every other Ayşe record (core/eylemler/onayla.ts).
 *
 * State lives in asistan_sessions.active_context.randevuAkisi and expires after 10 minutes of silence. Ids in it
 * were written by this server for this doctor's session and are still re-read doctor-scoped before use.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { trAramaNormalize } from '@/lib/utils/turkceArama'
import { hastaninSozunuCoz, hitapsiz, type HastaCozumu } from '@/lib/doktor/hastaCozumleyici'
import { dosyaAcmaIstegiMi } from '@/lib/asistan/aktifHasta'
import { takvimSorusuCoz, sesGurultusuMu } from '@/lib/randevu/takvimSorusu'
import { TARIH_IFADESI, bugunTz, goreliTarihCoz, isoSaatTz, saatDilimiSec, yerelAnI } from '@/lib/randevu/tarihCozumle'
import { kisaTarihEtiketi } from '@/lib/randevu/gunlukOzet'
import { randevuCakismasiVarMi } from '@/lib/randevu/cakisma'
import { hastaOzetiGetir } from '@/core/eylemler/hasta'
import { oneriHazirla, type HazirOneri } from '@/core/eylemler/oneri'
import { eylemKapali } from '@/core/eylemler/araclar'
import { sesOnayMetniGecerliMi, sesVazgecMetniMi } from '@/core/eylemler/sesKapilari'
import { bugunTRT, type HastaOzeti } from '@/core/eylemler/types'
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'

export type RandevuNiyeti = 'olustur' | 'tasi' | 'iptal'
type Bekleyen = 'hasta' | 'hangi-hasta' | 'hangi-randevu' | 'tarih' | 'saat' | 'onay'

interface RandevuAdayi { id: string; baslangic: string; bitis: string }

export interface RandevuAkisDurumu {
  tur: RandevuNiyeti
  hastaId: string | null
  hastaAd: string | null
  /** Several patients matched the name — the doctor is choosing. */
  adaylar?: { id: string; ad: string }[]
  /** tasi / iptal: the appointment being changed, and the choices when the patient has several. */
  randevu?: RandevuAdayi | null
  randevuAdaylari?: RandevuAdayi[]
  /** New slot in the doctor's timezone. */
  tarih: string | null
  saat: string | null
  bekleyen: Bekleyen
  oneriId?: string | null
  /** Failed answers to the pending question; the flow gives up instead of looping. */
  deneme: number
  zaman: string
}

export interface RandevuAkisSonucu {
  ekran: string
  konusma: string
  /** null = the dialogue is over (done, withdrawn or given up). */
  durum: RandevuAkisDurumu | null
  kart: HazirOneri | null
  kartHasta: HastaOzeti | null
}

/** A pending question is dropped after this much silence — same window as the conversation context. */
export const RANDEVU_AKISI_OMRU_MS = 10 * 60 * 1000
const TRT = 'Europe/Istanbul'
const VARSAYILAN_SURE_DK = 20

function duz(mesaj: string | null | undefined): string {
  return ` ${trAramaNormalize(String(mesaj || '')).replace(/[?!.,;:’'"]+/g, ' ').replace(/\s+/g, ' ').trim()} `
}

/* ───────────────────────────── intent ───────────────────────────── */

/**
 * Request / intention forms of a verb stem (normalized ASCII): imperative, optative, aorist, infinitive, ability,
 * future, first-person present and "-mam lazım". Past, evidential, participle and passive forms are NOT here —
 * "randevu aldı / verilen randevu / iptal edilen" are questions about the calendar, not requests.
 */
const EK = '(?:y?[ae]l[iu]m|y?[ae]y[iu]m|[aeiu]r|r|y?[iu]n(?:[iu]z)?|m[ae]k|m[ae]m(?:[iu]z)?|m[ae]y[iu]|y?[ae]bil\\w*|y?[ae]c[ae]\\w*|s[ae]n[ae]|y?[iu]ver\\w*|s[iu]n|[iu]yorum|[iu]yoruz)?'
const fiil = (kokler: string[]) => new RegExp(`^(?:${kokler.join('|')})${EK}$`)
const OLUSTUR_FIIL = fiil(['olustur', 'yap', 'ver', 'al', 'ac', 'ayarla', 'koy', 'ekle', 'yaz', 'planla', 'kaydet', 'kayded', 'gir'])
const TASI_FIIL = fiil(['ertele', 'tasi', 'kaydir', 'degistir', 'guncelle', 'cek'])
const AL_FIIL = fiil(['al', 'at', 'cek'])
const ET_FIIL = fiil(['et', 'ed'])
const SIL_FIIL = fiil(['sil', 'kaldir'])
/** "randevusunu / randevuyu / randevumuzu" — an existing appointment as the object: "… cumaya al" moves it. */
const RANDEVU_NESNE = /^randevu(?:su|m|muz)?(?:nu|yu|u|mu|muzu)$/
/**
 * "randevu" as the thing being booked / moved / cancelled: bare, possessive, accusative, genitive. Not "randevudan
 * önce", "randevusuna geldi", "randevuda" — there the appointment is only the setting of another sentence.
 */
const RANDEVU_SOZU = /^randevu(?:su|m|muz)?(?:nu|yu|u|mu|muzu|nun|un)?$/
const RANDEVU_ARDI = new Set(['icin', 'olan', 'oncesi', 'oncesinde', 'sonrasi', 'sonrasinda', 'saatleri', 'saatlerini', 'saatlerimi'])
const ISTEK = new Set(['istiyorum', 'istiyoruz', 'isterim', 'lazim', 'gerek', 'gerekiyor', 'olsun'])
/** "randevu bilgisi ver / listesini al" is a read. */
const OKUMA = new Set(['bilgi', 'bilgisi', 'bilgisini', 'liste', 'listesi', 'listesini', 'ozet', 'ozeti', 'ozetini', 'durum', 'durumu', 'durumunu', 'kac', 'kimler', 'olan'])
/** "randevu ekranını aç", "randevusuna not ekle", "randevu mesajı yaz", "… için ilaç yaz" — the verb acts on something else. */
const BASKA_NESNE = /^(ekran|sayfa|menu|not$|notu|notlar|aciklama|mesaj|hatirlat|sms|whatsapp|eposta|mail|rapor|recete|ilac|tahlil|dosya|takvim(?:i|ini|imi|imizi)$)/
/** A yes/no question about someone else or the past ("alabiliyor mu", "alacak mıydı") — "verelim mi" is still a request. */
const SORU_EKI = new Set(['mi', 'mu', 'miydi', 'muydu', 'miymis', 'muymus'])

export function randevuNiyetiBul(mesaj: string | null | undefined): RandevuNiyeti | null {
  const k = duz(mesaj).trim().split(' ').filter(Boolean)
  if (!k.some((t, i) => RANDEVU_SOZU.test(t) && !RANDEVU_ARDI.has(k[i + 1] || ''))) return null
  // One appointment at a time: "randevuları iptal et / listele" is never a single booking action.
  if (k.some((t) => t.startsWith('randevular'))) return null
  if (k.some((t) => OKUMA.has(t) || BASKA_NESNE.test(t))) return null
  if (k.some((t, i) => SORU_EKI.has(t) && !/(l[iu]m|y[iu]m)$/.test(k[i - 1] || ''))) return null
  const iptalIdx = k.findIndex((t) => t === 'iptal' || t === 'iptali' || t === 'iptalini')
  if (iptalIdx >= 0) {
    const sonra = k[iptalIdx + 1]
    if (!sonra || ET_FIIL.test(sonra) || ISTEK.has(sonra) || sonra === 'lutfen' || sonra === 'hocam') return 'iptal'
    if (k[iptalIdx] !== 'iptal' && k.some((t) => ISTEK.has(t) || OLUSTUR_FIIL.test(t))) return 'iptal'
    return null
  }
  if (k.some((t) => SIL_FIIL.test(t))) return 'iptal'
  if (k.some((t) => TASI_FIIL.test(t))) return 'tasi'
  if (k.some((t) => RANDEVU_NESNE.test(t)) && k.some((t) => AL_FIIL.test(t))) return 'tasi'
  if (k.some((t) => t === 'one' || t === 'ileri' || t === 'sonraya' || t === 'erkene') && k.some((t) => AL_FIIL.test(t))) return 'tasi'
  if (k.some((t) => OLUSTUR_FIIL.test(t) || ISTEK.has(t))) return 'olustur'
  return null
}

/* ───────────────────────────── slots ───────────────────────────── */

const TAM_TARIH = /\b(\d{1,2})[./](\d{1,2})[./](20\d{2})\b/

const AYLAR = 'ocak|subat|mart|nisan|mayis|haziran|temmuz|agustos|eylul|ekim|kasim|aralik'
const GUNLER = 'pazartesi|cumartesi|carsamba|persembe|sali|cuma|pazar'

/** "cumaya", "yarına", "yarınki", "pazartesiye", "ekimde" → the bare day word the date resolver understands. */
function tarihKokle(n: string): string {
  return n
    .replace(new RegExp(`(?<= )(${GUNLER}|yarin|bugun)(?:y?[ae]|d[ae]|k[iu]|y?[iu]|s[iu])(?= )`, 'g'), '$1')
    .replace(/(?<= )(obur gun|ertesi gun)(?:[aeu]|de)(?= )/g, '$1')
    .replace(new RegExp(`(?<= )(${AYLAR})(?:t[ae]|d[ae]|y?[ae]|[iu]n)(?= )`, 'g'), '$1')
}

/** How many different days the sentence names ("pazartesi randevusunu cumaya al" = 2). */
function gunSozuSayisi(mesaj: string): number {
  const n = tarihKokle(duz(mesaj))
  return new Set(n.match(new RegExp(`(?<= )(${GUNLER}|yarin|bugun|obur gun|\\d{1,2} (?:${AYLAR})|\\d{1,2}[./]\\d{1,2}[./]20\\d{2})(?= )`, 'g')) || []).size
}

/** A day named in the message, in the doctor's timezone. Null when the message names none. */
export function randevuTarihiBul(mesaj: string, tz: string, simdi: Date = new Date()): string | null {
  const m = String(mesaj || '').match(TAM_TARIH)
  if (m && Number(m[1]) >= 1 && Number(m[1]) <= 31 && Number(m[2]) >= 1 && Number(m[2]) <= 12) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  const dilim = saatDilimiSec(tz)
  const n = tarihKokle(duz(mesaj))
  const tarih = goreliTarihCoz(n, dilim, simdi)
  // "5 Ocak" said in October is next January — a day and month without a year is never in the past.
  if (tarih && tarih < bugunTz(dilim, simdi) && new RegExp(` \\d{1,2} (?:${AYLAR}) `).test(n) && !/ 20\d{2}[ -]/.test(n)) {
    return `${Number(tarih.slice(0, 4)) + 1}${tarih.slice(4)}`
  }
  return tarih
}

/** The message without the given names — "Beste Aydın" must not be read as "beşte". */
function adsiz(mesaj: string, adlar: (string | null | undefined)[]): string {
  const parcalar = new Set(adlar.flatMap((a) => duz(a).trim().split(' ')).filter((p) => p.length >= 2))
  if (!parcalar.size) return mesaj
  return String(mesaj || '').split(/\s+/).filter((w) => !parcalar.has(duz(w.replace(/[’'].*$/, '')).trim())).join(' ')
}

/** Spoken hours 1–23: "üç", "on bir", "on dört", "yirmi" (normalized ASCII; "onbir" as one word too). */
const SAYI: Record<string, number> = (() => {
  const birler = ['bir', 'iki', 'uc', 'dort', 'bes', 'alti', 'yedi', 'sekiz', 'dokuz']
  // "dörde / on dörde": the t softens before a vowel.
  const m: Record<string, number> = { on: 10, yirmi: 20, dord: 4, 'on dord': 14 }
  birler.forEach((b, i) => {
    m[b] = i + 1
    m[`on ${b}`] = m[`on${b}`] = 11 + i
    if (i < 3) m[`yirmi ${b}`] = m[`yirmi${b}`] = 21 + i
  })
  return m
})()
const SAYI_ALT = Object.keys(SAYI).sort((a, b) => b.length - a.length).join('|')
const sayiCoz = (s: string): number | null => (/^\d{1,2}$/.test(s) ? Number(s) : SAYI[s] ?? null)
/** Answers to "Saat kaçta?" that are only the number: "üç", "15", "saat 3 buçuk olsun". */
const SAAT_DOLGU = new Set(['saat', 'saati', 'hocam', 'olsun', 'olur', 'lutfen', 'tamam', 'peki', 'gibi', 'civari', 'sularinda', 'sabah', 'ogleden', 'sonra', 'aksam', 'ogle', 'gece', 'te', 'de', 'ta', 'da', 'e', 'a', 'ye', 'ya'])

/**
 * A clock time in the message → "HH:MM". Spoken clinic hours: 1–7 without "sabah / gece" is the afternoon
 * (same rule as the calendar reader). `ciplak` = the message is the answer to "Saat kaçta?", so a bare number counts.
 */
export function randevuSaatiBul(mesaj: string, ciplak = false): string | null {
  const ham = String(mesaj || '').replace(TAM_TARIH, ' ')
  const n = tarihKokle(duz(ham)).replace(new RegExp(TARIH_IFADESI.source, 'g'), ' ').replace(/\s+/g, ' ')
  // "üçe çeyrek var / beşe on kala" is not read here — a wrong slot is worse than asking again.
  if (/ (ceyrek|kala) /.test(n)) return null
  const ogleSonrasi = (saat: number): number => {
    if (/ sabah\w* /.test(n)) return saat
    if (/ gece /.test(n)) return saat >= 8 && saat <= 11 ? saat + 12 : saat
    if (saat >= 1 && saat <= 7) return saat + 12
    if (saat >= 8 && saat <= 11 && / (aksam|aksamustu) /.test(n)) return saat + 12
    return saat
  }
  const bicim = (saat: number, dakika: number) => (saat > 23 || dakika > 59 ? null : `${String(saat).padStart(2, '0')}:${String(dakika).padStart(2, '0')}`)

  const rakam = ham.match(/(?<![\d.:/])(\d{1,2})[:.]([0-5]\d)(?![\d./])/)
  if (rakam) return bicim(rakam[1].length === 2 ? Number(rakam[1]) : ogleSonrasi(Number(rakam[1])), Number(rakam[2]))

  const SAYI_RE = `(\\d{1,2}|${SAYI_ALT})`
  const dene = (re: RegExp, saatli: boolean): string | null => {
    const m = n.match(re)
    if (!m) return null
    const saat = sayiCoz(m[1])
    if (saat == null) return null
    // "ona / onda / bire / birde" are everyday words ("ona randevu ver") — a time only after "saat".
    if (!saatli && (m[1] === 'on' || m[1] === 'bir')) return null
    return bicim(ogleSonrasi(saat), / bucuk/.test(m[0]) ? 30 : 0)
  }
  const ikili = n.match(/ saat (\d{1,2}) ([0-5]\d) /)
  if (ikili) return bicim(ikili[1].length === 2 ? Number(ikili[1]) : ogleSonrasi(Number(ikili[1])), Number(ikili[2]))
  // "saat on dört otuzda"
  const DAKIKA: Record<string, number> = { otuz: 30, 'on bes': 15, 'kirk bes': 45, yirmi: 20, kirk: 40, elli: 50 }
  const sozlu = n.match(new RegExp(` saat ${SAYI_RE} (${Object.keys(DAKIKA).join('|')})(?:t[ae]|d[ae])? `))
  if (sozlu && sayiCoz(sozlu[1]) != null) return bicim(ogleSonrasi(sayiCoz(sozlu[1]) as number), DAKIKA[sozlu[2]])
  return (
    dene(new RegExp(` saat ${SAYI_RE}(?: bucuk\\w*)?(?: ?(?:te|de|ta|da|e|a|ye|ya))? `), true)
    ?? dene(new RegExp(` ${SAYI_RE} bucuk\\w* `), false)
    ?? dene(new RegExp(` ${SAYI_RE} ?(?:te|de|ta|da|e|a|ye|ya) `), false)
    ?? dene(new RegExp(` ${SAYI_RE} (?:gibi|civari|sularinda) `), false)
    ?? (ciplak ? ciplakSaat(n, ogleSonrasi, bicim) : null)
  )
}

function ciplakSaat(n: string, ogleSonrasi: (s: number) => number, bicim: (s: number, d: number) => string | null): string | null {
  const kalan = n.trim().split(' ').filter((t) => t && !SAAT_DOLGU.has(t))
  const bucuk = kalan[kalan.length - 1]?.startsWith('bucuk')
  const govde = (bucuk ? kalan.slice(0, -1) : kalan).join(' ')
  const saat = sayiCoz(govde)
  return saat == null ? null : bicim(ogleSonrasi(saat), bucuk ? 30 : 0)
}

const SIRA: [string, number][] = [['birinci', 0], ['ilk', 0], ['ikinci', 1], ['ucuncu', 2], ['dorduncu', 3], ['besinci', 4]]
/** "ikincisi", "ilk hasta", "2" → 0-based index. Whole words only: "İlknur" is a name, not "ilk". */
function siraBul(mesaj: string): number | null {
  const k = duz(mesaj).trim().split(' ')
  for (const t of k) for (const [govde, i] of SIRA) if (new RegExp(`^${govde}(?:si|sini|sine|yi|ye|i|ini|ine)?$`).test(t)) return i
  return k.length === 1 && /^[1-5]$/.test(k[0]) ? Number(k[0]) - 1 : null
}

/** Capitalised words that are not appointment vocabulary — a name the doctor said, used only to word "bulamadım". */
const AD_DEGIL = new Set(['randevu', 'hocam', 'saat', 'bugun', 'yarin', 'pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi', 'pazar', 'ocak', 'subat', 'mart', 'nisan', 'mayis', 'haziran', 'temmuz', 'agustos', 'eylul', 'ekim', 'kasim', 'aralik', 'bir', 'bu', 'haftaya', 'lutfen', 'peki', 'tamam'])
export function soylenenAd(mesaj: string): string | null {
  const kelimeler = hitapsiz(String(mesaj || '')).split(/\s+/).filter(Boolean).map((w) => w.replace(/[’'].*$/, '').replace(/[^\p{L}]/gu, ''))
  let enIyi: string[] = []
  let seri: string[] = []
  for (const w of [...kelimeler, '']) {
    const buyuk = w.length >= 2 && w[0] !== w[0].toLocaleLowerCase('tr-TR') && !AD_DEGIL.has(trAramaNormalize(w)) && !trAramaNormalize(w).startsWith('randevu')
    if (buyuk) { seri.push(w); continue }
    if (seri.length > enIyi.length) enIyi = seri
    seri = []
  }
  return enIyi.length >= 2 ? enIyi.join(' ') : null
}

/* ───────────────────────────── wording ───────────────────────────── */

const SOR = {
  hasta: 'Hangi hasta için Hocam?',
  tarih: 'Hangi gün Hocam?',
  saat: 'Saat kaçta Hocam?',
  yeniZaman: 'Hangi güne ve saate alalım Hocam?',
  bulunamadi: 'Bu isimde bir hasta bulamadım Hocam; adını ve soyadını tam söyler misiniz?',
  gecmis: 'Bu tarih geçmişte kalıyor Hocam; hangi güne alalım?',
  vazgec: 'Tamam Hocam, vazgeçtim.',
} as const

/** "bu hastaya / ona / kendisine" — the doctor points at the open patient. "bir hasta için" does not. */
const ACIK_HASTA_ATFI = / (bu hasta\w*|bu cocu\w*|hastamiz\w*|kendisi\w*|onun|onu) |(?<! saat) ona /

const gunSaat = (iso: string, tz: string) => ({ tarih: bugunTz(tz, new Date(iso)), saat: isoSaatTz(iso, tz) })
const randevuEtiketi = (r: RandevuAdayi, tz: string) => { const g = gunSaat(r.baslangic, tz); return `${kisaTarihEtiketi(g.tarih)} ${g.saat}` }

/* ───────────────────────────── dialogue ───────────────────────────── */

export interface RandevuAkisGirdisi {
  supabase: SupabaseClient
  doktorId: string
  /** The doctor's words (ASR-repaired, NOT the follow-up rewrite). */
  mesaj: string
  onceki: RandevuAkisDurumu | null
  kanal: 'yazi' | 'ses'
  saatDilimi?: string | null
  brans: SpecialtyKey | null
  /** The session's open patient — used only when the doctor points at it ("bu hastaya", "ona"). */
  aktifHasta?: { id: string; ad: string } | null
  simdi?: Date
}

export function randevuAkisiGecerliMi(d: unknown, simdi: Date = new Date()): d is RandevuAkisDurumu {
  if (!d || typeof d !== 'object') return false
  const v = d as Partial<RandevuAkisDurumu>
  if (v.tur !== 'olustur' && v.tur !== 'tasi' && v.tur !== 'iptal') return false
  const t = new Date(String(v.zaman || '')).getTime()
  return Number.isFinite(t) && simdi.getTime() - t <= RANDEVU_AKISI_OMRU_MS
}

/** Null = not an appointment turn; the caller runs its normal pipeline (and any stale flow state is dropped). */
export async function randevuAkisiCalistir(g: RandevuAkisGirdisi): Promise<RandevuAkisSonucu | null> {
  const simdi = g.simdi ?? new Date()
  const tz = saatDilimiSec(g.saatDilimi)
  const mesaj = String(g.mesaj || '')
  let eski = randevuAkisiGecerliMi(g.onceki, simdi) ? g.onceki : null
  const niyet = randevuNiyetiBul(mesaj)
  // ASR pause ("...") is not an answer to the pending question; the caller keeps the state.
  if ((!niyet && !eski) || sesGurultusuMu(mesaj)) return null
  // A card that was tapped (or withdrawn) on screen ended the dialogue — its state must not catch later sentences.
  if (eski?.bekleyen === 'onay') {
    const { data } = eski.oneriId
      ? await g.supabase.from('eylem_onerileri').select('durum').eq('id', eski.oneriId).eq('doctor_id', g.doktorId).maybeSingle()
      : { data: null }
    if ((data as { durum?: string } | null)?.durum !== 'taslak') eski = null
  }
  if (!niyet && (!eski || dosyaAcmaIstegiMi(mesaj))) return null

  const yanit = (ekran: string, durum: RandevuAkisDurumu | null, ek: Partial<RandevuAkisSonucu> = {}): RandevuAkisSonucu =>
    ({ ekran, konusma: ek.konusma ?? ekran, durum: durum ? { ...durum, zaman: simdi.toISOString() } : null, kart: ek.kart ?? null, kartHasta: ek.kartHasta ?? null })

  if (eylemKapali()) return niyet ? yanit('Randevu hazırlama şu an kapalı Hocam; Randevular ekranından girebilirsiniz.', null) : null

  let yeniAkis = Boolean(niyet) && (!eski || niyet !== eski.tur || eski.bekleyen === 'onay')
  // The same kind of request said again, now naming ANOTHER patient ("Yok, Rüzgar Kara için …") starts over —
  // the patient asked about so far must not stay on the card.
  let onCozum: HastaCozumu | null = null
  if (niyet && eski && !yeniAkis && eski.hastaId) {
    onCozum = await hastaninSozunuCoz(g.supabase, g.doktorId, mesaj, { yalnizAd: true, tz })
    if (onCozum.tur === 'coklu' || (onCozum.tur === 'tek' && onCozum.patientId !== eski.hastaId)) yeniAkis = true
  }
  let d: RandevuAkisDurumu = yeniAkis || !eski
    ? { tur: niyet as RandevuNiyeti, hastaId: null, hastaAd: null, tarih: null, saat: null, bekleyen: 'hasta', deneme: 0, zaman: simdi.toISOString() }
    : { ...eski }

  // Names are taken out before the clock is read ("Beste Aydın" is not "beşte") — except in the answer to
  // "Saat kaçta?", where "Beşte" is the time.
  const ciplak = !yeniAkis && d.bekleyen === 'saat'
  const adlar = ciplak ? [] : [soylenenAd(mesaj), d.hastaAd, ...(d.adaylar || []).map((a) => a.ad)]
  const tarihi = randevuTarihiBul(mesaj, tz, simdi)
  let saati = randevuSaatiBul(adsiz(mesaj, adlar), ciplak)

  if (!yeniAkis && !niyet) {
    if (d.bekleyen === 'onay') {
      // The card is on screen. A correction ("saat 15:00 olsun", "cuma olsun") re-prepares it; a question or anything
      // else is not this dialogue's turn. Spoken Evet / Hayır never arrives here — sesliOnay takes it before the brain.
      if (sesOnayMetniGecerliMi(mesaj)) {
        return g.kanal === 'yazi' ? yanit('Onay için karttaki Kaydet’e dokunun Hocam; onaylanmadan hiçbir şey yazılmaz.', d) : null
      }
      if (sesVazgecMetniMi(mesaj)) return yanit('Tamam Hocam; karttaki Vazgeç’e dokunabilirsiniz, onaylanmadan hiçbir şey yazılmaz.', null)
      if (d.tur === 'iptal' || (!tarihi && !saati) || soruMu(mesaj)) return null
      d = { ...d, tarih: tarihi ?? d.tarih, saat: saati ?? d.saat, oneriId: null, bekleyen: 'saat' }
    } else if (vazgecMi(mesaj)) {
      return yanit(SOR.vazgec, null)
    } else if (SORU_SOZU.test(duz(mesaj))) {
      // "Yarın randevum var mı?" while "Hangi gün?" is pending is a question, not the answer "yarın".
      return null
    }
  }

  // ── patient ──
  if (!d.hastaId) {
    if (d.bekleyen === 'hangi-hasta' && d.adaylar?.length) {
      const secilen = adaySec(mesaj, d.adaylar)
      if (!secilen) return tekrar(d, yanit, adaySorusu(d.adaylar), mesaj)
      d = { ...d, hastaId: secilen.id, hastaAd: secilen.ad, adaylar: undefined, deneme: 0 }
    } else {
      const cozum = onCozum ?? await hastaninSozunuCoz(g.supabase, g.doktorId, mesaj, { yalnizAd: true, tz })
      if (cozum.tur === 'tek') {
        d = { ...d, hastaId: cozum.patientId, hastaAd: cozum.ad, deneme: 0 }
      } else if (cozum.tur === 'coklu') {
        const adaylar = cozum.adaylar.map((a) => ({ id: a.id, ad: a.ad }))
        saati = randevuSaatiBul(adsiz(mesaj, [...adlar, ...adaylar.map((a) => a.ad)]), ciplak)
        const ekran = `Bu isimle ${adaylar.length} hasta var Hocam: ${cozum.adaylar.map((a, i) => `${i + 1}. ${a.ad}${a.dobMetin ? ` (d.t. ${a.dobMetin})` : ''}`).join(', ')}. Hangisi?`
        return yanit(ekran, { ...d, adaylar, bekleyen: 'hangi-hasta', tarih: d.tarih ?? tarihi, saat: d.saat ?? saati, deneme: 0 }, { konusma: adaySorusu(adaylar) })
      } else if (yeniAkis && g.aktifHasta?.id && ACIK_HASTA_ATFI.test(duz(mesaj))) {
        d = { ...d, hastaId: g.aktifHasta.id, hastaAd: g.aktifHasta.ad }
      } else if (niyet) {
        // A new request — or the same request said again while "Hangi hasta için?" is pending.
        const ad = soylenenAd(mesaj)
        const soru = ad ? `“${ad}” adında bir hasta kayıtlarınızda bulamadım Hocam; adını ve soyadını tam söyler misiniz?` : SOR.hasta
        return yanit(soru, { ...d, bekleyen: 'hasta', tarih: tarihi ?? d.tarih, saat: saati ?? d.saat, deneme: ad ? 1 : 0 })
      } else {
        // Answer to "Hangi hasta için?" that named nobody we know.
        if (baskaSoruMu(mesaj, tz)) return null
        if (d.deneme >= 1) return yanit('Bu isimde bir hasta yine bulamadım Hocam. Hasta kayıtlıysa adını Hastalar ekranından kontrol edip tekrar söyleyebilirsiniz.', null)
        return yanit(SOR.bulunamadi, { ...d, bekleyen: 'hasta', deneme: d.deneme + 1 })
      }
    }
  }

  // HASTA-IZOLASYON-01: the id (resolver output or session state) must be this doctor's patient before any read with it.
  const hasta = await hastaOzetiGetir(g.supabase, g.doktorId, d.hastaId)
  if (!hasta) return yanit(SOR.bulunamadi, { ...d, hastaId: null, hastaAd: null, bekleyen: 'hasta', deneme: d.deneme + 1 })
  d = { ...d, hastaAd: hasta.ad }
  if (!ciplak) saati = randevuSaatiBul(adsiz(mesaj, [...adlar, hasta.ad]), ciplak)

  // ── which appointment (move / cancel) ──
  let ilkTek = false
  if (d.tur !== 'olustur' && !d.randevu) {
    if (d.bekleyen === 'hangi-randevu' && d.randevuAdaylari?.length) {
      const secilen = randevuSec(mesaj, d.randevuAdaylari, tz, tarihi, saati)
      if (!secilen) return tekrar(d, yanit, randevuSorusu(d.randevuAdaylari, tz), mesaj)
      // The day named so far picked the appointment; the new slot is asked for on its own.
      d = { ...d, randevu: secilen, randevuAdaylari: undefined, tarih: null, saat: null, deneme: 0 }
      if (d.tur === 'tasi') return yanit(SOR.yeniZaman, { ...d, bekleyen: 'tarih' })
    } else {
      const liste = await gelecekRandevular(g.supabase, g.doktorId, hasta.id, simdi)
      if (!liste.length) return yanit(`${hasta.ad} için ileri tarihli bir randevu bulamadım Hocam.`, null)
      const gunun = tarihi ? liste.filter((r) => gunSaat(r.baslangic, tz).tarih === tarihi) : []
      // "yarınki randevusunu iptal et" when the only appointment is next week: never cancel a day that was not named.
      if (d.tur === 'iptal' && tarihi && !gunun.length) {
        return yanit(`${hasta.ad} için ${kisaTarihEtiketi(tarihi)} günü randevu bulamadım Hocam. ${randevuSorusu(liste, tz)}`, { ...d, randevuAdaylari: liste, bekleyen: 'hangi-randevu', deneme: 0 })
      }
      if (liste.length === 1) { d = { ...d, randevu: liste[0] }; ilkTek = true }
      else if (d.tur === 'iptal' && gunun.length === 1) d = { ...d, randevu: gunun[0] }
      else return yanit(randevuSorusu(liste, tz), { ...d, randevuAdaylari: liste, bekleyen: 'hangi-randevu', deneme: 0 })
    }
  }

  // ── cancel: nothing else to ask ──
  if (d.tur === 'iptal' && d.randevu) {
    const m = gunSaat(d.randevu.baslangic, tz)
    const trt = gunSaat(d.randevu.baslangic, TRT)
    return kartHazirla(g, hasta, d, yanit, 'randevu_iptal',
      { randevu_id: d.randevu.id, mevcut: `${kisaTarihEtiketi(trt.tarih)} ${trt.saat}` },
      `${hasta.ad} için ${kisaTarihEtiketi(m.tarih)} saat ${m.saat} randevusunu iptal ediyorum, onaylıyor musunuz?`)
  }

  // ── day and time ──
  // "pazartesi randevusunu cumaya al" names two days — which one is the new slot is asked, not guessed.
  const ikiGun = d.tur === 'tasi' && gunSozuSayisi(mesaj) >= 2
  if (!ikiGun && (d.tur === 'olustur' || ilkTek || d.bekleyen === 'tarih' || d.bekleyen === 'saat')) {
    d = { ...d, tarih: tarihi ?? d.tarih, saat: saati ?? d.saat }
  }
  if (d.tur === 'tasi' && d.randevu) {
    if (!d.tarih && !d.saat) {
      if (d.bekleyen === 'tarih' && baskaSoruMu(mesaj, tz)) return null
      return d.bekleyen === 'tarih' ? tekrar(d, yanit, SOR.yeniZaman, mesaj) : yanit(SOR.yeniZaman, { ...d, bekleyen: 'tarih' })
    }
    const m = gunSaat(d.randevu.baslangic, tz)
    d = { ...d, tarih: d.tarih ?? m.tarih, saat: d.saat ?? m.saat }
    if (d.tarih === m.tarih && d.saat === m.saat) return yanit(`Randevu zaten ${kisaTarihEtiketi(m.tarih)} ${m.saat}’te Hocam. ${SOR.yeniZaman}`, { ...d, tarih: null, saat: null, bekleyen: 'tarih' })
  }
  if (!d.tarih) return d.bekleyen === 'tarih' && !yeniAkis ? tekrar(d, yanit, SOR.tarih, mesaj, tz) : yanit(SOR.tarih, { ...d, bekleyen: 'tarih', deneme: 0 })
  if (d.tarih < bugunTz(tz, simdi)) return yanit(SOR.gecmis, { ...d, tarih: null, bekleyen: 'tarih' })
  if (!d.saat) return d.bekleyen === 'saat' && !yeniAkis ? tekrar(d, yanit, SOR.saat, mesaj, tz) : yanit(SOR.saat, { ...d, bekleyen: 'saat', deneme: 0 })

  // ── slot free? (read only — the commit re-checks) ──
  const bas = yerelAnI(d.tarih, d.saat, tz)
  if (new Date(bas).getTime() <= simdi.getTime()) return yanit('Bu saat geçmişte kalıyor Hocam; saat kaçta olsun?', { ...d, saat: null, bekleyen: 'saat' })
  const sureMs = d.randevu ? Math.max(5 * 60000, new Date(d.randevu.bitis).getTime() - new Date(d.randevu.baslangic).getTime()) : VARSAYILAN_SURE_DK * 60000
  const cakisma = await randevuCakismasiVarMi(g.supabase, g.doktorId, bas, new Date(new Date(bas).getTime() + sureMs).toISOString(), d.randevu?.id ?? null)
  if (cakisma.hata) return yanit('Takvimi şu an kontrol edemedim Hocam; birazdan tekrar dener misiniz?', d)
  if (cakisma.cakisiyor) return yanit(`${kisaTarihEtiketi(d.tarih)} saat ${d.saat} dolu Hocam; başka bir saat söyler misiniz?`, { ...d, saat: null, bekleyen: 'saat', deneme: 0 })

  // The card (and the calendar page) show Turkish time; the sentence the doctor hears is in his own timezone.
  const trt = gunSaat(bas, TRT)
  const trtNotu = trt.tarih === d.tarih && trt.saat === d.saat ? '' : ` (Türkiye saatiyle ${trt.saat})`
  if (d.tur === 'tasi' && d.randevu) {
    const m = gunSaat(d.randevu.baslangic, tz)
    const eskiTrt = gunSaat(d.randevu.baslangic, TRT)
    return kartHazirla(g, hasta, d, yanit, 'randevu_tasi',
      { randevu_id: d.randevu.id, mevcut: `${kisaTarihEtiketi(eskiTrt.tarih)} ${eskiTrt.saat}`, tarih: trt.tarih, saat: trt.saat },
      `${hasta.ad} randevusunu ${kisaTarihEtiketi(m.tarih)} ${m.saat} yerine ${kisaTarihEtiketi(d.tarih)} saat ${d.saat}${trtNotu} yapıyorum, onaylıyor musunuz?`)
  }
  return kartHazirla(g, hasta, d, yanit, 'kontrol_randevusu_olustur',
    { tarih: trt.tarih, saat: trt.saat, ...(/ muayene/.test(duz(mesaj)) ? { tur: 'muayene' } : {}) },
    `${hasta.ad} için ${kisaTarihEtiketi(d.tarih)} saat ${d.saat}${trtNotu} randevusu oluşturuyorum, onaylıyor musunuz?`)
}

type Yanit = (ekran: string, durum: RandevuAkisDurumu | null, ek?: Partial<RandevuAkisSonucu>) => RandevuAkisSonucu

/** The pending question was not answered: another question leaves the dialogue, a second miss ends it. */
function tekrar(d: RandevuAkisDurumu, yanit: Yanit, soru: string, mesaj: string, tz?: string): RandevuAkisSonucu | null {
  // A whole sentence that carries no answer ("şu tahlili de kaydedelim sonra bakarız") is another topic.
  if (baskaSoruMu(mesaj, tz) || duz(mesaj).trim().split(' ').length > 4) return null
  if (d.deneme >= 1) return yanit('Anlayamadım Hocam; randevuyu Randevular ekranından da girebilirsiniz.', null)
  return yanit(soru, { ...d, deneme: d.deneme + 1 })
}

function vazgecMi(mesaj: string): boolean {
  return sesVazgecMetniMi(mesaj) || / (vazgec\w*|bosver|bos ver|gerek yok|gerek kalmadi|istemiyorum|kalsin) /.test(duz(mesaj))
}

/** Question words: the doctor is asking something, not answering the pending question. */
const SORU_SOZU = / (kac|kim|kimler|kimin|nedir|neydi|nasil|neler|ne zaman|var mi|yok mu|bos mu|dolu mu|hangi|goster|listele|ozetle|anlat) /

/** Any question form — with a card pending, "Yarın kaç hastam var?" / "Cuma boş muyum?" is not a correction of the slot. */
function soruMu(mesaj: string): boolean {
  const n = duz(mesaj)
  return /\?/.test(mesaj) || SORU_SOZU.test(n) || / (mi|mu|miyim|muyum|miyiz|muyuz|misin|musun|misiniz|musunuz|miydi|muydu) /.test(n)
}

/** The doctor moved on to something else while a question was pending (checked once the answer could not be read). */
function baskaSoruMu(mesaj: string, tz?: string): boolean {
  if (/\?/.test(mesaj)) return true
  if (takvimSorusuCoz(mesaj, { saatDilimi: tz })) return true
  return SORU_SOZU.test(duz(mesaj))
}

function adaySorusu(adaylar: { ad: string }[]): string {
  return `Bu isimle ${adaylar.length} hasta var Hocam: ${adaylar.map((a) => a.ad).join(', ')}. Hangisi?`
}

function adaySec(mesaj: string, adaylar: { id: string; ad: string }[]): { id: string; ad: string } | null {
  // The name first: "İlknur Demir" is a name, and only then may an ordinal ("ikincisi") decide.
  const k = new Set(duz(hitapsiz(mesaj)).trim().split(' ').filter((t) => t.length >= 3))
  const puan = adaylar.map((a) => duz(a.ad).trim().split(' ').filter((p) => p.length >= 3 && [...k].some((t) => t === p || t.startsWith(p))).length)
  const enCok = Math.max(...puan)
  if (enCok > 0 && puan.filter((p) => p === enCok).length === 1) return adaylar[puan.indexOf(enCok)]
  const sira = siraBul(mesaj)
  return sira != null && adaylar[sira] ? adaylar[sira] : null
}

function randevuSorusu(liste: RandevuAdayi[], tz: string): string {
  return `Hangisi Hocam: ${liste.map((r, i) => `${i + 1}. ${randevuEtiketi(r, tz)}`).join(', ')}?`
}

function randevuSec(mesaj: string, liste: RandevuAdayi[], tz: string, tarih: string | null, saat: string | null): RandevuAdayi | null {
  const sira = siraBul(mesaj)
  if (sira != null && liste[sira]) return liste[sira]
  if (liste.length === 1 && sesOnayMetniGecerliMi(mesaj)) return liste[0]
  const uyan = liste.filter((r) => {
    const g = gunSaat(r.baslangic, tz)
    return (tarih || saat) && (!tarih || g.tarih === tarih) && (!saat || g.saat === saat)
  })
  return uyan.length === 1 ? uyan[0] : null
}

/** This doctor's, this patient's, not cancelled, from now on. */
async function gelecekRandevular(supabase: SupabaseClient, doktorId: string, hastaId: string, simdi: Date): Promise<RandevuAdayi[]> {
  const { data } = await supabase
    .from('randevular')
    .select('id, baslangic, bitis, durum')
    .eq('doktor_id', doktorId)
    .eq('patient_id', hastaId)
    .neq('durum', 'iptal')
    .gte('baslangic', simdi.toISOString())
    .order('baslangic', { ascending: true })
    .limit(5)
  return ((data || []) as { id: string; baslangic: string; bitis: string }[]).map((r) => ({ id: String(r.id), baslangic: String(r.baslangic), bitis: String(r.bitis) }))
}

/** Every slot is filled: prepare the taslak and read it back. Nothing is written to the calendar here. */
async function kartHazirla(
  g: RandevuAkisGirdisi,
  hasta: HastaOzeti,
  d: RandevuAkisDurumu,
  yanit: Yanit,
  anahtar: string,
  alanlar: Record<string, unknown>,
  okuma: string,
): Promise<RandevuAkisSonucu> {
  const kaynak = (k: string) => ({ kaynak: k === 'randevu_id' || k === 'mevcut' ? 'dosyadan' : 'doktor_soyledi' })
  const kart = await oneriHazirla({
    ctx: { supabase: g.supabase, doktorId: g.doktorId, hasta, brans: g.brans, oneriId: '', bugunTRT: bugunTRT(g.simdi) },
    anahtar,
    girdi: { ...alanlar, alan_kaynaklari: Object.fromEntries(Object.keys(alanlar).map((k) => [k, kaynak(k)])) },
    yuzey: g.kanal === 'ses' ? 'ses' : 'sohbet',
    suzgec: { brans: g.brans, hasta },
  })
  if (!kart) return yanit('Randevu kartını hazırlayamadım Hocam; Randevular ekranından deneyebilirsiniz.', null)
  const ekran = g.kanal === 'yazi' ? `${okuma} Onay için karttaki Kaydet’e dokunun.` : okuma
  return yanit(ekran, { ...d, bekleyen: 'onay', oneriId: kart.id, adaylar: undefined, randevuAdaylari: undefined, deneme: 0 }, { konusma: okuma, kart, kartHasta: hasta })
}
