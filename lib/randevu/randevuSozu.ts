/**
 * NOTYA-AYSE-GERI-03 — how a doctor SAYS an appointment request: intent, day, time, the person named.
 *
 * Pure (no DB, no model). Ported from the unmerged branch fix/ayse-randevu-capability (db856260,
 * lib/asistan/randevuAkisi.ts), where these parsers fed a model-free appointment dialogue. The dialogue itself was
 * not ported: an appointment request now reaches Luna and its tools (lib/asistan/komutNiyeti.ts decides that), and
 * these parsers serve two server-side jobs around the tool call:
 *   - command detection — "randevu" + an action verb is a command, a calendar question is not;
 *   - date / time resolution — the day and time the doctor said, read in the doctor's timezone, override what the
 *     model wrote on the card (NOTYA-AYSE-GERI-04).
 */
import { trAramaNormalize } from '@/lib/utils/turkceArama'
import { TARIH_IFADESI, bugunTz, goreliTarihCoz, saatDilimiSec } from '@/lib/randevu/tarihCozumle'

export type RandevuNiyeti = 'olustur' | 'tasi' | 'iptal'

export function duz(mesaj: string | null | undefined): string {
  return ` ${trAramaNormalize(String(mesaj || '')).replace(/[?!.,;:’'"]+/g, ' ').replace(/\s+/g, ' ').trim()} `
}

/* ───────────────────────────── intent ───────────────────────────── */

/**
 * Request / intention forms of a verb stem (normalized ASCII): imperative, optative, aorist, infinitive, ability,
 * future, first-person present and "-mam lazım". Past, evidential, participle and passive forms are NOT here —
 * "randevu aldı / verilen randevu / iptal edilen" are questions about the record, not requests.
 */
export const ISTEK_EKI = '(?:y?[ae]l[iu]m|y?[ae]y[iu]m|[aeiu]r|r|y?[iu]n(?:[iu]z)?|m[ae]k|m[ae]m(?:[iu]z)?|m[ae]y[iu]|y?[ae]bil\\w*|y?[ae]c[ae]\\w*|s[ae]n[ae]|y?[iu]ver\\w*|s[iu]n|[iu]yorum|[iu]yoruz)?'
export const istekFiili = (kokler: string[]) => new RegExp(`^(?:${kokler.join('|')})${ISTEK_EKI}$`)
const OLUSTUR_FIIL = istekFiili(['olustur', 'yap', 'ver', 'al', 'ac', 'ayarla', 'koy', 'ekle', 'yaz', 'planla', 'kaydet', 'kayded', 'gir'])
const TASI_FIIL = istekFiili(['ertele', 'tasi', 'kaydir', 'degistir', 'guncelle', 'cek'])
const AL_FIIL = istekFiili(['al', 'at', 'cek'])
const ET_FIIL = istekFiili(['et', 'ed'])
const SIL_FIIL = istekFiili(['sil', 'kaldir'])
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

/** "randevu" + an action verb in a request form. A question about the calendar has no such verb and returns null. */
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

/* ───────────────────────────── day and time ───────────────────────────── */

const TAM_TARIH = /\b(\d{1,2})[./](\d{1,2})[./](20\d{2})\b/
const AYLAR = 'ocak|subat|mart|nisan|mayis|haziran|temmuz|agustos|eylul|ekim|kasim|aralik'
const GUNLER = 'pazartesi|cumartesi|carsamba|persembe|sali|cuma|pazar'

/** "cumaya", "yarına", "yarınki", "pazartesiye", "ekimde" → the bare day word the date resolver understands. */
function tarihKokle(n: string): string {
  return n
    .replace(new RegExp(`(?<= )(${GUNLER}|yarin|bugun|dun)(?:y?[ae]|d[ae]|k[iu]|y?[iu]|s[iu]|den|dan)(?= )`, 'g'), '$1')
    .replace(/(?<= )(obur gun|ertesi gun)(?:[aeu]|de)(?= )/g, '$1')
    .replace(new RegExp(`(?<= )(${AYLAR})(?:t[ae]|d[ae]|y?[ae]|[iu]n)(?= )`, 'g'), '$1')
}

/** How many different days the sentence names ("pazartesi randevusunu cumaya al" = 2, "dün yapıldı" = 1). */
export function gunSozuSayisi(mesaj: string): number {
  // The full date is counted from the raw text: duz() turns its dots into spaces.
  const tam = String(mesaj || '').match(new RegExp(TAM_TARIH.source, 'g')) || []
  const n = tarihKokle(duz(String(mesaj || '').replace(new RegExp(TAM_TARIH.source, 'g'), ' ')))
  const soz = n.match(new RegExp(`(?<= )(${GUNLER}|yarin|bugun|dun|obur gun|ertesi gun|\\d{1,2} (?:${AYLAR}))(?= )`, 'g')) || []
  return new Set([...tam, ...soz]).size
}

/** Ways of saying "today" for something that has just been done. */
const BUGUN_SOZU = / (az once|biraz once|az evvel|demin|simdi|su an|su anda|bu sabah|bu aksam|bu ogle\w*|bugunku) /

/**
 * A day named in the message, in the doctor's timezone. Null when the message names none.
 * `ileri`: the day is for something that has not happened yet (an appointment) — "5 Ocak" said in October is next
 * January. Without it a day and month without a year stays in the current year (a vaccine given "3 Eylül'de").
 */
export function soylenenTarih(mesaj: string, tz: string, simdi: Date = new Date(), secenek: { ileri?: boolean } = {}): string | null {
  const m = String(mesaj || '').match(TAM_TARIH)
  if (m && Number(m[1]) >= 1 && Number(m[1]) <= 31 && Number(m[2]) >= 1 && Number(m[2]) <= 12) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  const dilim = saatDilimiSec(tz)
  const n = tarihKokle(duz(mesaj))
  // NOTYA-AYSE-GERI-04: "az önce / demin / şimdi / bu sabah yapıldı" is today — in the doctor's timezone.
  const tarih = goreliTarihCoz(n, dilim, simdi) ?? (!secenek.ileri && BUGUN_SOZU.test(n) ? bugunTz(dilim, simdi) : null)
  if (secenek.ileri && tarih && tarih < bugunTz(dilim, simdi) && new RegExp(` \\d{1,2} (?:${AYLAR}) `).test(n) && !/ 20\d{2}[ -]/.test(n)) {
    return `${Number(tarih.slice(0, 4)) + 1}${tarih.slice(4)}`
  }
  return tarih
}

/** The day an appointment sentence names (never in the past for a day-and-month without a year). */
export function randevuTarihiBul(mesaj: string, tz: string, simdi: Date = new Date()): string | null {
  return soylenenTarih(mesaj, tz, simdi, { ileri: true })
}

/** The message without the given names — "Beste Aydın" must not be read as "beşte". */
export function adsiz(mesaj: string, adlar: (string | null | undefined)[]): string {
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

/* ───────────────────────────── the person named ───────────────────────────── */

/** Capitalised words that are not a person's name in a clinic sentence. */
const AD_DEGIL = new Set(['randevu', 'hocam', 'saat', 'bugun', 'yarin', 'dun', 'pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi', 'pazar', 'ocak', 'subat', 'mart', 'nisan', 'mayis', 'haziran', 'temmuz', 'agustos', 'eylul', 'ekim', 'kasim', 'aralik', 'bir', 'bu', 'haftaya', 'lutfen', 'peki', 'tamam', 'kontrol', 'muayene', 'asi', 'ilac', 'alerji', 'not', 'dosya', 'hasta', 'hastam', 'hastamiz', 'doktor', 'hanim', 'bey'])
/** Stems of clinic words that may be capitalised in a sentence ("Suçiçeği Aşısı", "Kontrol Randevusu") but name no person. */
const KLINIK_GOVDE = /^(randevu|asi|ilac|alerji|kontrol|muayene|hepatit|sucicegi|kizamik|dosya|kilo|boy|ates|tani|tahlil|recete|doz|kronik|antibiyoti|surup|tablet)/
const buyukBasli = (w: string) => w.length >= 2 && w[0] !== w[0].toLocaleLowerCase('tr-TR') && !AD_DEGIL.has(trAramaNormalize(w)) && !KLINIK_GOVDE.test(trAramaNormalize(w))

/** The longest run of at least two capitalised words that are not clinic vocabulary — used only to word "bulamadım". */
export function soylenenAd(mesaj: string): string | null {
  const kelimeler = String(mesaj || '').split(/\s+/).filter(Boolean).map((w) => w.replace(/[’'].*$/, '').replace(/[^\p{L}]/gu, ''))
  let enIyi: string[] = []
  let seri: string[] = []
  for (const w of [...kelimeler, '']) {
    if (buyukBasli(w)) { seri.push(w); continue }
    if (seri.length > enIyi.length) enIyi = seri
    seri = []
  }
  return enIyi.length >= 2 ? enIyi.join(' ') : null
}

/**
 * A person the sentence names AS the one the request is for: a capitalised full name followed by "için", carrying a
 * case ending after an apostrophe ("Ali Yılmaz'a", "Zeynep Kara'nın") or introduced as a patient ("hastam Ali
 * Yılmaz", "Ali Yılmaz adlı"). Stricter than soylenenAd on purpose: "Augmentin BID 400 mg ekle" names no person.
 * Used to refuse binding the OPEN chart when the doctor asked for somebody else who could not be found.
 */
export function anilanKisi(mesaj: string): string | null {
  const ham = String(mesaj || '').split(/\s+/).filter(Boolean)
  const temiz = (w: string) => w.replace(/[’'].*$/, '').replace(/[^\p{L}]/gu, '')
  for (let i = 0; i + 1 < ham.length; i++) {
    if (!buyukBasli(temiz(ham[i]))) continue
    let j = i
    while (j + 1 < ham.length && buyukBasli(temiz(ham[j + 1])) && !/[’']/.test(ham[j])) j++
    if (j === i) continue
    const son = ham[j]
    const sonra = trAramaNormalize(ham[j + 1] || '').replace(/[^a-z]/g, '')
    const once = trAramaNormalize(ham[i - 1] || '').replace(/[^a-z]/g, '')
    const ekli = /[’'](?:n?[ıiuü]n|[ny]?[ıiuüae]|[dt][ae]n?|y?l[ae])\b/i.test(son)
    if (ekli || sonra === 'icin' || /^(adli|adinda|adindaki|isimli|ismindeki)$/.test(sonra) || /^(hastam|hastamiz|hasta)$/.test(once)) {
      return ham.slice(i, j + 1).map(temiz).join(' ')
    }
    i = j
  }
  return null
}
