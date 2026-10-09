/**
 * NOTYA-ULKE-INTAKE-01 — THE RULES of the intake form, for every country. Pure and client-safe: the pack's questions
 * (`HastaFormuIcerigi`) come in as an argument, so the same rule answers the patient's page (which questions are
 * drawn), the server (which answers are kept) and the doctor's screens (which answers are shown).
 *
 * LEAK RULE (.cursor/skills/brans-alan-sizmasi/SKILL.md). `formBolumleri` is THE decision point. A form carries the
 * core sections and the ONE section of the role it was asked with — never a question of another role. An unknown
 * role, or no role, gives the core sections only: a default never carries a role's content. Answers are filtered by
 * the same list (`cevaplariSuz`): a key that is not a question of THIS form is dropped, whatever a browser sends and
 * whatever an older version of the form stored.
 *
 * GUARDIAN FORM. `veli` true = the patient is below the country's guardian age: sections and questions marked
 * 'cocuk' are in, those marked 'yetiskin' are out, and a question is put in its guardian wording where it has one.
 * Whether a patient is below that age is decided once, when the form is asked for (lib/ulke/intake/form.ts), by the
 * kit's existing age rule (lib/ulke/arayuz/notSablonu.ts → veliYasindaMi).
 *
 * UNITS. A number that is a measure (height, weight, temperature) is asked in the PACK's unit for that measure
 * (`uygulama.birimler`), and the stored answer carries the unit code it was typed in. The ranges below are sanity
 * limits against a slip of the finger, not clinical limits: they refuse 1750 cm, not a tall patient.
 */
import type { BicimliMetin } from '../arayuz/tipler'
import type { Birimler } from '../tipler'
import type { BirimKodu, Cevap, Cevaplar, FormBolumGorunumu, FormSorusu, HastaFormuIcerigi, Olcu, Secenek, Soru } from './tipler'
import { OLCULER, SORU_TURLERI } from './tipler'

export const KISA_METIN_AZAMI = 200
export const UZUN_METIN_AZAMI = 2000
export const AYRINTI_AZAMI = 500
/** The largest stored answer set, as text, before encryption. A form of sixty questions stays far below it. */
export const CEVAPLAR_AZAMI = 60_000

/** Sanity range of each unit: what a person can be measured at. Not a clinical range. */
export const BIRIM_ARALIGI: Readonly<Record<BirimKodu, { enAz: number; enCok: number; ondalik: boolean }>> = {
  cm: { enAz: 20, enCok: 260, ondalik: true },
  in: { enAz: 8, enCok: 102, ondalik: true },
  kg: { enAz: 0.3, enCok: 400, ondalik: true },
  lb: { enAz: 0.6, enCok: 880, ondalik: true },
  C: { enAz: 30, enCok: 45, ondalik: true },
  F: { enAz: 86, enCok: 113, ondalik: true },
}

/** The unit the pack reads and writes a measure in. */
export function olcuBirimi(olcu: Olcu, birimler: Birimler): BirimKodu {
  return olcu === 'boy' ? birimler.boy : olcu === 'agirlik' ? birimler.agirlik : birimler.sicaklik
}

const sahip = (o: object, k: string): boolean => Object.prototype.hasOwnProperty.call(o, k)
const yaz = (m: BicimliMetin | undefined, dil: string): string => (m && sahip(m, dil) ? m[dil] : '')

/** Who a form is for: the role it was asked with, whether it is the guardian form, and the patient's recorded sex. */
export type FormBaglami = { rol: string | null; veli: boolean; cinsiyet: 'female' | 'male' | '' }

const kimeUygun = (kime: 'yetiskin' | 'cocuk' | undefined, veli: boolean): boolean => !kime || (kime === 'cocuk') === veli
/** A question for one sex is asked of that sex, and of a patient whose sex is not recorded (who can leave it empty). */
const cinsiyeteUygun = (c: 'female' | 'male' | undefined, hasta: FormBaglami['cinsiyet']): boolean => !c || !hasta || c === hasta

export type HamBolum = { anahtar: string; baslik: BicimliMetin; sorular: readonly Soru[] }
/** The key of the role's section inside a form. A core section may not use it (the pack check says so). */
export const ROL_BOLUMU = 'rol'

/**
 * THE DECISION POINT. The sections of a form and the questions in each, in order: the core sections first, then the
 * section of `rol` — and of no other role. Sections that end up empty are left out.
 */
export function formBolumleri(icerik: HastaFormuIcerigi, k: FormBaglami): HamBolum[] {
  const sorular = (hepsi: readonly Soru[]) => hepsi.filter((s) => kimeUygun(s.kime, k.veli) && cinsiyeteUygun(s.cinsiyet, k.cinsiyet))
  const bolumler: HamBolum[] = icerik.cekirdek.bolumler
    .filter((b) => kimeUygun(b.kime, k.veli))
    .map((b) => ({ anahtar: b.anahtar, baslik: k.veli && b.veliBasligi ? b.veliBasligi : b.baslik, sorular: sorular(b.sorular) }))
  const r = k.rol && sahip(icerik.roller, k.rol) ? icerik.roller[k.rol] : null
  if (r) bolumler.push({ anahtar: ROL_BOLUMU, baslik: k.veli && r.veliBasligi ? r.veliBasligi : r.baslik, sorular: sorular(r.sorular) })
  return bolumler.filter((b) => b.sorular.length > 0)
}

/** Every question of a form, flat, in order. */
export const formSorulari = (icerik: HastaFormuIcerigi, k: FormBaglami): Soru[] => formBolumleri(icerik, k).flatMap((b) => [...b.sorular])

/** The unit and range of a number question, in one language form. `birimAdlari`: unit code → its name (the pack's catalogue). */
export function sayiBirimi(s: Extract<Soru, { tur: 'sayi' }>, dil: string, birimler: Birimler, birimAdlari: Readonly<Record<string, string>>): NonNullable<FormSorusu['birim']> {
  if (s.olcu) {
    const kod = olcuBirimi(s.olcu, birimler)
    return { kod, ad: sahip(birimAdlari, kod) ? birimAdlari[kod] : '', ...BIRIM_ARALIGI[kod] }
  }
  return { kod: '', ad: yaz(s.birim, dil), enAz: s.enAz, enCok: s.enCok, ondalik: s.ondalik === true }
}

/** A form as a screen draws it: in ONE language form, in the wording for its reader. */
export function formGorunumu(icerik: HastaFormuIcerigi, k: FormBaglami, dil: string, birimler: Birimler, birimAdlari: Readonly<Record<string, string>>): FormBolumGorunumu[] {
  return formBolumleri(icerik, k).map((b) => ({
    anahtar: b.anahtar,
    baslik: yaz(b.baslik, dil),
    sorular: b.sorular.map((s): FormSorusu => ({
      anahtar: s.anahtar,
      tur: s.tur,
      metin: (k.veli && yaz(s.veliMetni, dil)) || yaz(s.metin, dil),
      yardim: yaz(s.yardim, dil) || null,
      zorunlu: s.zorunlu === true,
      secenekler: s.tur === 'tek-secim' || s.tur === 'cok-secim' ? s.secenekler.map((o) => ({ anahtar: o.anahtar, ad: yaz(o.ad, dil), tek: o.tek === true })) : null,
      ayrinti: s.tur === 'evet-hayir' ? yaz(s.ayrinti, dil) || null : null,
      birim: s.tur === 'sayi' ? sayiBirimi(s, dil, birimler, birimAdlari) : null,
    })),
  }))
}

// ───────────────────────── answers ─────────────────────────

const TARIH = /^\d{4}-\d{2}-\d{2}$/
function tarihGecerli(ham: string): boolean {
  if (!TARIH.test(ham)) return false
  const t = new Date(`${ham}T00:00:00Z`)
  return !Number.isNaN(t.getTime()) && t.toISOString().slice(0, 10) === ham && t.getUTCFullYear() >= 1900 && t.getUTCFullYear() <= 2100
}
const metin = (ham: unknown, azami: number): string => (typeof ham === 'string' ? ham.replace(/\u0000/g, '').trim().slice(0, azami) : '')

/** One answer in its stored shape, or undefined: not an answer to THIS question (wrong shape, unknown option, out of range, empty). */
export function cevabiSuz(s: Soru, ham: unknown, birimler: Birimler): Cevap | undefined {
  if (ham === null || ham === undefined) return undefined
  if (s.tur === 'tek-secim') return typeof ham === 'string' && s.secenekler.some((o) => o.anahtar === ham) ? ham : undefined
  if (s.tur === 'cok-secim') {
    if (!Array.isArray(ham)) return undefined
    // In the pack's order, each once. An option that stands alone ("none of these") wins over the others.
    const secilen = s.secenekler.filter((o) => ham.includes(o.anahtar))
    const tek = secilen.find((o) => o.tek)
    const anahtarlar = (tek ? [tek] : secilen).map((o) => o.anahtar)
    return anahtarlar.length ? anahtarlar : undefined
  }
  if (s.tur === 'kisa-metin' || s.tur === 'uzun-metin') return metin(ham, s.tur === 'kisa-metin' ? KISA_METIN_AZAMI : UZUN_METIN_AZAMI) || undefined
  if (s.tur === 'evet-hayir') {
    if (typeof ham !== 'object' || Array.isArray(ham)) return undefined
    const h = ham as { e?: unknown; a?: unknown }
    if (typeof h.e !== 'boolean') return undefined
    // The detail belongs to "yes", and only where the question asks for one.
    const a = h.e && s.ayrinti ? metin(h.a, AYRINTI_AZAMI) : ''
    return a ? { e: h.e, a } : { e: h.e }
  }
  if (s.tur === 'tarih') return typeof ham === 'string' && tarihGecerli(ham) ? ham : undefined
  if (s.tur !== 'sayi') return undefined
  if (typeof ham !== 'object' || Array.isArray(ham)) return undefined
  const h = ham as { n?: unknown; b?: unknown }
  if (typeof h.n !== 'number' || !Number.isFinite(h.n)) return undefined
  const kod = s.olcu ? olcuBirimi(s.olcu, birimler) : ''
  // The unit is the one the form asked in: a number typed under another unit is not an answer to this question.
  if ((typeof h.b === 'string' ? h.b : '') !== kod) return undefined
  const aralik = s.olcu ? BIRIM_ARALIGI[olcuBirimi(s.olcu, birimler)] : { enAz: s.enAz, enCok: s.enCok, ondalik: s.ondalik === true }
  const n = aralik.ondalik ? Math.round(h.n * 100) / 100 : Math.round(h.n)
  return n >= aralik.enAz && n <= aralik.enCok ? { n, b: kod } : undefined
}

/** The answers of ONE form: only keys that are questions of this form, each in its stored shape. Everything else is dropped. */
export function cevaplariSuz(sorular: readonly Soru[], ham: unknown, birimler: Birimler): Cevaplar {
  const cikti: Cevaplar = {}
  if (!ham || typeof ham !== 'object' || Array.isArray(ham)) return cikti
  const g = ham as Record<string, unknown>
  for (const s of sorular) {
    if (!sahip(g, s.anahtar)) continue
    const c = cevabiSuz(s, g[s.anahtar], birimler)
    if (c !== undefined) cikti[s.anahtar] = c
  }
  return cikti
}

/** Keys of the required questions that have no answer: a form with any of them is not submitted. */
export function eksikZorunlular(sorular: readonly Soru[], cevaplar: Cevaplar): string[] {
  return sorular.filter((s) => s.zorunlu === true && !sahip(cevaplar, s.anahtar)).map((s) => s.anahtar)
}

/** What the few words of an answer that are not the patient's own are called, in the reader's form (the pack's catalogue). */
export type CevapSozleri = { evet: string; hayir: string; birim: Readonly<Record<string, string>> }

/**
 * An answer as one line of text for the DOCTOR: option names and the unit in the doctor's own form, what the patient
 * typed exactly as typed. '' = no answer.
 */
export function cevapMetni(s: Soru, c: Cevap | undefined, dil: string, soz: CevapSozleri, sayiYaz: (n: number) => string = String): string {
  if (c === undefined) return ''
  if (s.tur === 'tek-secim') return typeof c === 'string' ? yaz(s.secenekler.find((o) => o.anahtar === c)?.ad, dil) : ''
  if (s.tur === 'cok-secim') return Array.isArray(c) ? s.secenekler.filter((o) => c.includes(o.anahtar)).map((o) => yaz(o.ad, dil)).filter(Boolean).join('; ') : ''
  if (s.tur === 'kisa-metin' || s.tur === 'uzun-metin' || s.tur === 'tarih') return typeof c === 'string' ? c : ''
  if (s.tur === 'evet-hayir') {
    if (typeof c !== 'object' || Array.isArray(c) || !('e' in c)) return ''
    return c.e ? (c.a ? `${soz.evet}: ${c.a}` : soz.evet) : soz.hayir
  }
  if (s.tur !== 'sayi' || typeof c !== 'object' || Array.isArray(c) || !('n' in c)) return ''
  const birim = s.olcu ? (sahip(soz.birim, c.b) ? soz.birim[c.b] : c.b) : yaz(s.birim, dil)
  return `${sayiYaz(c.n)} ${birim}`.trim()
}

// ───────────────────────── the pack check's half: is the content well-formed? ─────────────────────────

export type IcerikSorunu = { yer: string; sorun: string }
const ANAHTAR = /^[a-z][a-z0-9_]{0,59}$/

/**
 * Everything about a pack's questions that a machine can check: keys, types, options, a text in EVERY language form,
 * roles that exist. What it cannot check — whether a question is the right one to ask — is a clinician's, and is
 * recorded per set (`inceleme`).
 */
export function formIcerigiSorunlari(icerik: HastaFormuIcerigi, rolAnahtarlari: readonly string[], diller: readonly string[], eksikMi: (m: string) => boolean = () => false): IcerikSorunu[] {
  const s: IcerikSorunu[] = []
  const ekle = (yer: string, sorun: string) => s.push({ yer, sorun })
  const metinVar = (m: BicimliMetin | undefined, yer: string, zorunlu = true) => {
    if (!m) { if (zorunlu) ekle(yer, 'no text'); return }
    for (const d of diller) {
      const t = sahip(m, d) ? m[d] : undefined
      if (typeof t !== 'string' || !t.trim()) ekle(`${yer}.${d}`, 'no text in this language form')
      else if (eksikMi(t)) ekle(`${yer}.${d}`, 'to be supplied')
    }
  }
  if (typeof icerik.surum !== 'string' || !/^[A-Za-z0-9._-]{1,80}$/.test(icerik.surum)) ekle('hastaFormu.surum', 'the question set needs a version stamp (letters, digits, dots, hyphens)')
  if (!icerik.riza || typeof icerik.riza.surum !== 'string' || !/^[A-Za-z0-9._-]{1,80}$/.test(icerik.riza.surum)) ekle('hastaFormu.riza.surum', 'the consent sentence needs a version stamp')
  if (typeof icerik.riza?.hukukcuInceledi !== 'boolean') ekle('hastaFormu.riza.hukukcuInceledi', 'must be true or false')
  metinVar(icerik.riza?.metin, 'hastaFormu.riza.metin')
  metinVar(icerik.riza?.veliMetni, 'hastaFormu.riza.veliMetni')

  const gorulen = new Map<string, string>()
  const inceleme = (i: unknown, yer: string) => {
    const x = i as { makineYazimi?: unknown; klinisyen?: unknown } | null
    if (!x || typeof x.makineYazimi !== 'boolean' || !(x.klinisyen === null || (typeof x.klinisyen === 'string' && x.klinisyen.trim()))) ekle(yer, 'must say who wrote the set (makineYazimi) and which clinician read it (klinisyen: a name, or null)')
  }
  const sorular = (hepsi: readonly Soru[], yer: string) => {
    if (!Array.isArray(hepsi) || !hepsi.length) { ekle(yer, 'a section without a question'); return }
    for (const q of hepsi) {
      const y = `${yer}.${q.anahtar}`
      if (!ANAHTAR.test(String(q.anahtar))) ekle(y, 'a question key is lower-case letters, digits and underscores')
      // ONE key, ONE question, in the whole pack: an answer can never be read as the answer to another role's question.
      if (gorulen.has(q.anahtar)) ekle(y, `the key is also used at ${gorulen.get(q.anahtar)}: a question belongs to one set`)
      else gorulen.set(q.anahtar, yer)
      if (!(SORU_TURLERI as readonly string[]).includes(q.tur)) { ekle(y, `"${String(q.tur)}" is not a question type of the kit`); continue }
      metinVar(q.metin, `${y}.metin`)
      metinVar(q.veliMetni, `${y}.veliMetni`, false)
      metinVar(q.yardim, `${y}.yardim`, false)
      if (q.kime !== undefined && q.kime !== 'yetiskin' && q.kime !== 'cocuk') ekle(`${y}.kime`, 'must be yetiskin or cocuk')
      if (q.cinsiyet !== undefined && q.cinsiyet !== 'female' && q.cinsiyet !== 'male') ekle(`${y}.cinsiyet`, 'must be female or male')
      if (q.tur === 'tek-secim' || q.tur === 'cok-secim') {
        const o: readonly Secenek[] = Array.isArray(q.secenekler) ? q.secenekler : []
        if (o.length < 2) ekle(`${y}.secenekler`, 'a choice needs at least two options')
        if (new Set(o.map((x) => x.anahtar)).size !== o.length) ekle(`${y}.secenekler`, 'an option key is used twice')
        for (const x of o) { if (!ANAHTAR.test(String(x.anahtar))) ekle(`${y}.secenekler.${x.anahtar}`, 'an option key is lower-case letters, digits and underscores'); metinVar(x.ad, `${y}.secenekler.${x.anahtar}.ad`) }
      }
      if (q.tur === 'evet-hayir') metinVar(q.ayrinti, `${y}.ayrinti`, false)
      if (q.tur === 'sayi') {
        if (q.olcu !== undefined) { if (!(OLCULER as readonly string[]).includes(q.olcu)) ekle(`${y}.olcu`, 'must be boy, agirlik or sicaklik') }
        else {
          metinVar(q.birim, `${y}.birim`)
          if (!(typeof q.enAz === 'number' && typeof q.enCok === 'number' && Number.isFinite(q.enAz) && Number.isFinite(q.enCok) && q.enAz < q.enCok)) ekle(`${y}.enAz/enCok`, 'a number with its own unit needs a range (enAz below enCok)')
        }
      }
    }
  }
  const bolumler = Array.isArray(icerik.cekirdek?.bolumler) ? icerik.cekirdek.bolumler : []
  if (!bolumler.length) ekle('hastaFormu.cekirdek.bolumler', 'no core question')
  inceleme(icerik.cekirdek?.inceleme, 'hastaFormu.cekirdek.inceleme')
  const bolumAnahtarlari = bolumler.map((b) => b.anahtar)
  if (new Set(bolumAnahtarlari).size !== bolumAnahtarlari.length) ekle('hastaFormu.cekirdek.bolumler', 'a section key is used twice')
  for (const b of bolumler) {
    const y = `hastaFormu.cekirdek.${b.anahtar}`
    if (!ANAHTAR.test(String(b.anahtar)) || b.anahtar === ROL_BOLUMU) ekle(y, `a section key is lower-case letters, digits and underscores, and never "${ROL_BOLUMU}"`)
    if (b.kime !== undefined && b.kime !== 'yetiskin' && b.kime !== 'cocuk') ekle(`${y}.kime`, 'must be yetiskin or cocuk')
    metinVar(b.baslik, `${y}.baslik`)
    metinVar(b.veliBasligi, `${y}.veliBasligi`, false)
    sorular(b.sorular, y)
  }
  for (const [rol, r] of Object.entries(icerik.roller ?? {})) {
    const y = `hastaFormu.roller.${rol}`
    if (!rolAnahtarlari.includes(rol)) ekle(y, 'questions for a role the pack does not have')
    metinVar(r.baslik, `${y}.baslik`)
    metinVar(r.veliBasligi, `${y}.veliBasligi`, false)
    inceleme(r.inceleme, `${y}.inceleme`)
    sorular(r.sorular, y)
  }
  // Every role of the pack has a set of its own: a role without one would silently get a shorter form.
  for (const rol of rolAnahtarlari) if (!sahip(icerik.roller ?? {}, rol)) ekle(`hastaFormu.roller.${rol}`, 'the role has no questions of its own (an empty form section is not a decision: list the role with at least one question)')
  return s
}
