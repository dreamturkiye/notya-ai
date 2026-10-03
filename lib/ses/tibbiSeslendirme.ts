/**
 * NOTYA-SES-NORMAL-01 — Turkish medical speech normalization (Dr. Gökhan's specification; technical team's instruction).
 *
 * When Ayşe answers by voice she does not read the written medical text as it is. This layer rewrites the text that
 * goes to the speech engine into natural Turkish medical speech, as a doctor talks to another health professional:
 * abbreviations get their clinical reading, units and numbers are said as words. The screen keeps the written form
 * ("DaBT-İPA-Hib" is fine to read) — only the spoken text differs.
 *
 * PURE and DETERMINISTIC: no model call, no network, no clock. IDEMPOTENT: running it on its own output changes
 * nothing. The dictionary is data (tibbiSeslendirmeSozluk.ts) and grows without touching this file.
 *
 * Called from the speech choke points only:
 *   - fishMetni (lib/asistan/fishSes.ts) → Fish TTS
 *   - elevenMetni (lib/asistan/elevenMetni.ts) → ElevenLabs Custom LLM SSE (NOTYA-SES-ELEVEN-NORMAL-01)
 * Never call it on the screen text, the stored transcript, a model prompt or the recogniser's output.
 *
 * Left as written, by design: identity and contact values (telephone, e-mail, national id, any number after
 * "no / protokol / barkod …"), bare numbers of five or more digits, a digit glued to letters ("A12"), and every word
 * that is not in the dictionary — drug names and patient names are never touched.
 */
import {
  AYLAR, BIRIM_SOZLUGU, KIMLIK_ONCULU, KISALTMA_SOZLUGU, PAYDA_SOZLUGU, SAYILAN_SOZLER, SAYI_SOZLERI,
  type KisaltmaGirdisi, type Okunus,
} from './tibbiSeslendirmeSozluk'

export interface SeslendirmeSecenegi {
  /** Full forms instead of the short natural ones: the second stage of a tiered answer, or an explicit request for detail. */
  detay?: boolean
  /** Strings to keep exactly as written (a name the caller knows). */
  koru?: readonly string[]
}

/* ───────────────────────────── numbers ───────────────────────────── */

const BIRLER = ['sıfır', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'] as const
const ONLAR = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan'] as const
export const SAYI_UST_SINIRI = 999_999_999_999

function ucHane(n: number): string {
  const y = Math.floor(n / 100)
  const o = Math.floor((n % 100) / 10)
  const b = n % 10
  return [y === 0 ? '' : y === 1 ? 'yüz' : `${BIRLER[y]} yüz`, ONLAR[o], b ? BIRLER[b] : ''].filter(Boolean).join(' ')
}

/** A whole number in Turkish words, 0 to 999 999 999 999. Anything else comes back as digits. */
export function sayiOku(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > SAYI_UST_SINIRI) return String(n)
  if (n === 0) return BIRLER[0]
  const milyar = Math.floor(n / 1e9)
  const milyon = Math.floor((n % 1e9) / 1e6)
  const bin = Math.floor((n % 1e6) / 1e3)
  const kalan = n % 1e3
  return [
    milyar ? `${ucHane(milyar)} milyar` : '',
    milyon ? `${ucHane(milyon)} milyon` : '',
    bin ? (bin === 1 ? 'bin' : `${ucHane(bin)} bin`) : '',
    kalan ? ucHane(kalan) : '',
  ].filter(Boolean).join(' ')
}

const SIRA: Readonly<Record<string, string>> = {
  sıfır: 'sıfırıncı', bir: 'birinci', iki: 'ikinci', üç: 'üçüncü', dört: 'dördüncü', beş: 'beşinci', altı: 'altıncı', yedi: 'yedinci',
  sekiz: 'sekizinci', dokuz: 'dokuzuncu', on: 'onuncu', yirmi: 'yirminci', otuz: 'otuzuncu', kırk: 'kırkıncı', elli: 'ellinci',
  altmış: 'altmışıncı', yetmiş: 'yetmişinci', seksen: 'sekseninci', doksan: 'doksanıncı', yüz: 'yüzüncü', bin: 'bininci',
  milyon: 'milyonuncu', milyar: 'milyarıncı',
}

/** "2." → "ikinci". */
export function siraOku(n: number): string {
  const k = sayiOku(n).split(' ')
  k[k.length - 1] = SIRA[k[k.length - 1]] ?? k[k.length - 1]
  return k.join(' ')
}

/** Digits after the decimal comma: leading zeros one by one, the rest as a number ("05" → "sıfır beş"). */
function kesirOku(rakamlar: string): string {
  const sifir = /^0*/.exec(rakamlar)![0].length
  const kalan = rakamlar.slice(sifir)
  return [...Array<string>(sifir).fill(BIRLER[0]), kalan ? sayiOku(Number(kalan)) : ''].filter(Boolean).join(' ')
}

/**
 * A number as it is written in a Turkish text: "13,3" and "13.3" are decimals, "12.500" is twelve thousand five hundred.
 * Null when it cannot be read (more than twelve digits).
 */
export function sayiMetniOku(ham: string): string | null {
  const s = ham.trim()
  let tam = s
  let kesir = ''
  const binlik = /^([1-9]\d{0,2}(?:\.\d{3})+)(?:,(\d+))?$/.exec(s)
  const ondalik = /^(\d+)[.,](\d+)$/.exec(s)
  if (binlik) { tam = binlik[1].replace(/\./g, ''); kesir = binlik[2] || '' }
  else if (ondalik) { tam = ondalik[1]; kesir = ondalik[2] }
  else if (!/^\d+$/.test(s)) return null
  if (tam.length > 12) return null
  const t = sayiOku(Number(tam))
  return kesir ? `${t} ${SAYI_SOZLERI.ondalik} ${kesirOku(kesir)}` : t
}

/** dd.mm.yyyy → "iki Ekim iki bin yirmi altı". Null for a day or month that does not exist. */
export function tarihOku(gun: number, ay: number, yil: number): string | null {
  if (!(gun >= 1 && gun <= 31 && ay >= 1 && ay <= 12 && yil >= 1000 && yil <= 9999)) return null
  return `${sayiOku(gun)} ${AYLAR[ay - 1]} ${sayiOku(yil)}`
}

/* ───────────────────────────── Turkish case endings ───────────────────────────── */

const UNLULER = 'aeıioöuü'
const SERT = 'fstkçşhp'
const kucuk = (s: string) => s.toLocaleLowerCase('tr-TR')

function ekUret(soz: string, ek: string, iyelik: boolean): string | null {
  const k = kucuk(soz)
  let unlu = ''
  for (let i = k.length - 1; i >= 0 && !unlu; i--) if (UNLULER.includes(k[i])) unlu = k[i]
  if (!unlu) return null
  const son = k[k.length - 1]
  const unluIleBiter = UNLULER.includes(son)
  const A = 'aıou'.includes(unlu) ? 'a' : 'e'
  const I = 'aı'.includes(unlu) ? 'ı' : 'ei'.includes(unlu) ? 'i' : 'ou'.includes(unlu) ? 'u' : 'ü'
  const D = SERT.includes(son) ? 't' : 'd'
  const e = kucuk(ek)
  let m: RegExpExecArray | null
  if (/^n?[ıiuü]n$/.test(e)) return `${iyelik || unluIleBiter ? 'n' : ''}${I}n`
  if (/^[yn]?[ıiuü]$/.test(e)) return `${iyelik ? 'n' : unluIleBiter ? 'y' : ''}${I}`
  if (/^[yn]?[ae]$/.test(e)) return `${iyelik ? 'n' : unluIleBiter ? 'y' : ''}${A}`
  if ((m = /^n?[dt][ae](n|ki)?$/.exec(e))) return `${iyelik ? 'nd' : D}${A}${m[1] || ''}`
  if (/^y?l[ae]$/.test(e)) return `${unluIleBiter ? 'y' : ''}l${A}`
  if (/^l[ıiuü]k$/.test(e)) return `l${I}k`
  if (/^[dt][ıiuü]r$/.test(e)) return `${D}${I}r`
  // Third-person possessive ("Hb'si"): a reading that already ends in one does not take a second.
  if ((m = /^s[ıiuü](.*)$/.exec(e))) {
    const sahip = iyelik ? '' : `${unluIleBiter ? 's' : ''}${I}`
    if (!m[1]) return sahip
    const devam = ekUret(soz + sahip, m[1], true)
    return devam === null ? null : sahip + devam
  }
  if ((m = /^l[ae]r(.*)$/.exec(e))) {
    const cogul = `l${A}r`
    if (!m[1]) return cogul
    const devam = ekUret(soz + cogul, m[1], false)
    return devam === null ? null : cogul + devam
  }
  return null
}

/**
 * The ending written after the apostrophe was chosen for the abbreviation's letters ("KPA'nın"). The reading ends in
 * another word, so the same case is built again for it: "konjuge pnömokok aşısının". An ending this function does
 * not know is kept as written, after an apostrophe.
 */
export function ekUyarla(soz: string, ek: string, o: Pick<Okunus, 'iyelik' | 'ozel'> = {}): string {
  const u = ekUret(soz, ek, Boolean(o.iyelik))
  if (u === null) return `${soz}'${ek}`
  return o.ozel ? `${soz}'${u}` : soz + u
}

/* ───────────────────────────── patterns ───────────────────────────── */

const ON = String.raw`(?<![\p{L}\p{N}])`
const SON = String.raw`(?![\p{L}\p{N}])`
const EK = String.raw`(?:['’](\p{L}+))?`
const SAYI = String.raw`[1-9]\d{0,2}(?:\.\d{3})+(?:,\d+)?|\d+(?:[.,]\d+)?`
const TIRE = String.raw`[-‐‑–]`
const kacis = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
const uzundanKisaya = (a: string, b: string) => b.length - a.length

/* ── abbreviations ── */

const kisaltmaAnahtari = (s: string) => s.replace(/İ/g, 'I').replace(/[‐‑–]/g, '-').replace(/\s+/g, ' ')

function yazimBicimleri(g: KisaltmaGirdisi): string[] {
  const out = new Set<string>()
  for (const y of g.yazim) {
    out.add(y)
    out.add(y.toLocaleUpperCase('tr-TR'))
    if (g.kelime) {
      for (const k of [y.toLowerCase(), y.toLocaleLowerCase('tr-TR')]) {
        out.add(k)
        out.add(k.charAt(0).toLocaleUpperCase('tr-TR') + k.slice(1))
      }
    }
  }
  return [...out]
}

const KISALTMA_HARITASI = new Map<string, KisaltmaGirdisi>()
for (const g of KISALTMA_SOZLUGU) for (const y of yazimBicimleri(g)) if (!KISALTMA_HARITASI.has(kisaltmaAnahtari(y))) KISALTMA_HARITASI.set(kisaltmaAnahtari(y), g)

const KISALTMA_DESENI = new RegExp(
  `${ON}(${[...KISALTMA_HARITASI.keys()].sort(uzundanKisaya)
    .map((y) => kacis(y).replace(/I/g, '[Iİ]').replace(/-/g, TIRE).replace(/ /g, String.raw`\s`)).join('|')})${EK}${SON}`,
  'gu',
)

const okunusSec = (g: KisaltmaGirdisi, detay: boolean | undefined): Okunus => (detay && g.detay) || g.kisa
const tamOkunus = (o: Okunus) => (o.ad ? `${o.soz} ${o.ad}` : o.soz)
const duzHarf = (s: string) => s.toLowerCase().replace(/̇/g, '').replace(/ı/g, 'i')

function kisaltmalariOku(metin: string, detay: boolean | undefined): string {
  return metin.replace(KISALTMA_DESENI, (hepsi: string, yazi: string, ek: string | undefined, konum: number) => {
    const g = KISALTMA_HARITASI.get(kisaltmaAnahtari(yazi))
    if (!g) return hepsi
    const o = okunusSec(g, detay)
    if (ek) return ekUyarla(tamOkunus(o), ek, o)
    // The head noun is not said twice: "KKK aşısı", "KPA ve KKK aşıları".
    const devam = metin.slice(konum + hepsi.length)
    const adVar = o.ad ? new RegExp(String.raw`^\s+${kacis(kucuk(o.ad).slice(0, 3))}`, 'u').test(kucuk(devam)) : false
    return adVar ? o.soz : tamOkunus(o)
  })
}

/* ── units ── */

const birimAnahtari = (s: string) => s.toLowerCase().replace(/̇/g, '').replace(/\s+/g, '').replace(/μ/g, 'µ').replace(/℃/g, '°c')
const BIRIM_HARITASI = new Map<string, string>()
for (const b of BIRIM_SOZLUGU) for (const y of b.yazim) BIRIM_HARITASI.set(birimAnahtari(y), b.soz)
const PAYDA_HARITASI = new Map<string, string>()
for (const p of PAYDA_SOZLUGU) for (const y of p.yazim) PAYDA_HARITASI.set(birimAnahtari(y), p.soz)

const birimSecenekleri = (yazimlar: string[]) => [...new Set(yazimlar)].sort(uzundanKisaya).map((y) => kacis(y).replace(/ /g, String.raw`\s?`)).join('|')
const BIRIM_YAZIMLARI = BIRIM_SOZLUGU.flatMap((b) => [...b.yazim])
const BIRIM = birimSecenekleri(BIRIM_YAZIMLARI)
const BOLEN = birimSecenekleri([...PAYDA_SOZLUGU.flatMap((p) => [...p.yazim]), ...BIRIM_YAZIMLARI])
const BOLENLER = String.raw`(?:\s?\/\s?(?:${BOLEN}))+`
const SAYILAN = SAYILAN_SOZLER.join('|')

/** "mg" + "/kg/gün" → what is said before the number and what is said after it. */
function birimSozleri(birim: string | undefined, bolenler: string | undefined): { once: string[]; sonra: string[] } | null {
  const once: string[] = []
  const sonra: string[] = []
  if (birim) {
    const b = BIRIM_HARITASI.get(birimAnahtari(birim))
    if (!b) return null
    sonra.push(b)
  }
  for (const ham of (bolenler || '').split('/').map((s) => s.trim()).filter(Boolean)) {
    const k = birimAnahtari(ham)
    const p = PAYDA_HARITASI.get(k)
    if (p) { once.unshift(p); continue }
    const b = BIRIM_HARITASI.get(k)
    if (!b) return null
    sonra.push(b)
  }
  return once.length || sonra.length ? { once, sonra } : null
}

const isaretSozu = (i: string | undefined) => (!i ? '' : i === '+' ? SAYI_SOZLERI.arti : SAYI_SOZLERI.eksi)
const birlestir = (...p: (string | undefined)[]) => p.filter(Boolean).join(' ')

/** "250 mg/5 mL" → "beş mililitrede iki yüz elli miligram". */
const OLCULU_DESEN = new RegExp(`${ON}(${SAYI})\\s?(${BIRIM})\\s?\\/\\s?(${SAYI})\\s?(${BIRIM})${EK}${SON}`, 'giu')
/** number [– number] [counted word] [unit] [/denominator …] ['suffix] */
const BIRIMLI_DESEN = new RegExp(
  `${ON}([+\\u2212])?(${SAYI})(?:\\s?${TIRE}\\s?(${SAYI}))?\\s?(?:(${SAYILAN})\\s?(?=\\/))?(${BIRIM})?(${BOLENLER})?${EK}${SON}`,
  'giu',
)
/** A unit that stands alone: "mg/kg olarak", "kg cinsinden". Only spellings that cannot be a word. */
const YALIN_BIRIMLER = [
  'kg', 'mg', 'mcg', 'µg', 'μg', 'ng', 'pg', 'mL', 'ml', 'dL', 'dl', 'cm', 'mm',
  'mmHg', 'cmH2O', 'cmH₂O', 'kcal', 'IU', 'İÜ', 'mEq', 'meq', 'mmol', 'µmol', 'μmol',
  'nmol', 'pmol', 'kPa', 'fL', 'fl', 'µL', 'μL', '°C',
]
const YALIN_DESEN = new RegExp(`${ON}(${birimSecenekleri(YALIN_BIRIMLER)})(${BOLENLER})?${EK}${SON}`, 'gu')

function birimleriOku(metin: string): string {
  return metin
    .replace(OLCULU_DESEN, (hepsi: string, n1: string, b1: string, n2: string, b2: string, ek: string | undefined) => {
      const s1 = sayiMetniOku(n1)
      const s2 = sayiMetniOku(n2)
      const u1 = BIRIM_HARITASI.get(birimAnahtari(b1))
      const u2 = BIRIM_HARITASI.get(birimAnahtari(b2))
      if (!s1 || !s2 || !u1 || !u2) return hepsi
      const soz = `${s2} ${ekUyarla(u2, 'de')} ${s1} ${u1}`
      return ek ? ekUyarla(soz, ek) : soz
    })
    .replace(BIRIMLI_DESEN, (hepsi: string, isaret: string | undefined, n1: string, n2: string | undefined, sayilan: string | undefined, birim: string | undefined, bolenler: string | undefined, ek: string | undefined) => {
      const b = birimSozleri(birim, bolenler)
      if (!b) return hepsi
      const s1 = sayiMetniOku(n1)
      const s2 = n2 ? sayiMetniOku(n2) : ''
      if (!s1 || s2 === null) return hepsi
      const soz = birlestir(...b.once, isaretSozu(isaret), s1, s2 ? `${SAYI_SOZLERI.aralik} ${s2}` : '', sayilan, ...b.sonra)
      return ek ? ekUyarla(soz, ek) : soz
    })
    .replace(YALIN_DESEN, (hepsi: string, birim: string, bolenler: string | undefined, ek: string | undefined) => {
      const b = birimSozleri(birim, bolenler)
      if (!b) return hepsi
      const soz = birlestir(...b.once, ...b.sonra)
      return ek ? ekUyarla(soz, ek) : soz
    })
}

/* ── identity values: kept as written ── */

const KORUMA_DESENLERI: readonly RegExp[] = [
  /https?:\/\/\S+/giu,
  /[\w.+-]+@[\w-]+\.[\w.]+/gu,
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/giu,
  /(?<!\d)(?:\+?90[\s-]?)?\(?0?5\d{2}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}(?!\d)|(?<!\d)0\d{3}[\s-]\d{3}[\s-]\d{2}[\s-]\d{2}(?!\d)/gu,
  /(?<!\d)[1-9]\d{10}(?!\d)/gu,
  new RegExp(String.raw`(?<![\p{L}\p{N}])(?:${[...KIMLIK_ONCULU].sort(uzundanKisaya).map(kacis).join('|')})\s*[:.#]?\s*#?\s*[A-Za-z]{0,3}\d[\w-]*(?:\.\w+)*`, 'giu'),
]
const KORUMA_BAS = ''
const KORUMA_SON = ''
const KORUMA_GERI = /([-])/gu

/* ── number forms ── */

const TARIH = String.raw`(\d{1,2})[./](\d{1,2})[./](\d{4})`
const TARIH_ARALIGI = new RegExp(String.raw`(?<![\d./])(${TARIH})\s?[–—-]\s?(${TARIH})(?!\d|[./]\d)`, 'gu')
const TARIH_DESENI = new RegExp(String.raw`(?<![\d./])${TARIH}${EK}(?!\d|[./]\d)`, 'gu')
const ISO_TARIH = new RegExp(String.raw`(?<![\d-])(\d{4})-(\d{2})-(\d{2})${EK}(?![\d-])`, 'gu')
const SAAT = new RegExp(String.raw`(?<![\p{L}\p{N}.,:])(\d{1,2}):(\d{2})${EK}(?![\p{L}\p{N}:])`, 'gu')
const Z_SKORU = new RegExp(String.raw`${ON}[Zz](?:[\s-]?(?:skoru|skor|score|puanı)\s*[:=]?|\s*[:=])\s*\(?\s*([+\-−–])?\s*(${SAYI})${EK}${SON}`, 'gu')
const SD_EKSI = new RegExp(String.raw`(?<=^|[\s(:=])-(?=(?:${SAYI})\s?SDS?${SON})`, 'gu')
const YUZDELIK_ARALIGI = new RegExp(String.raw`${ON}[pP]\s?(\d{1,2}(?:[.,]\d)?)\s?${TIRE}\s?[pP]\s?(\d{1,2}(?:[.,]\d)?)${EK}${SON}`, 'gu')
const YUZDELIK = new RegExp(String.raw`${ON}[pP](\d{1,2}(?:[.,]\d)?)${EK}${SON}`, 'gu')
const YUZDE_ONDE = /(?<!\d\s?)%\s?(?=\d)/gu
const YUZDE_SONDA = new RegExp(String.raw`${ON}((?:${SAYI})(?:\s?${TIRE}\s?(?:${SAYI}))?)\s?%${SON}`, 'gu')
const TANSIYON_BIRIMLI = new RegExp(String.raw`${ON}(\d{2,3})\s?\/\s?(\d{2,3})\s?mm\s?Hg${EK}${SON}`, 'giu')
const TANSIYON_SOZLU = new RegExp(String.raw`((?:tansiyon|kan basınc)\p{L}*\s*[:=]?\s*)(\d{2,3})\s?\/\s?(\d{2,3})(?![\d/])`, 'giu')
const KERE = new RegExp(String.raw`${ON}(\d{1,2})\s?[x×]\s?(?=\d)`, 'gu')
const ARALIK = new RegExp(String.raw`${ON}(${SAYI})\s?–\s?(?=\d)`, 'gu')
const SIRA_DESENI = /(?<![\p{L}\p{N}.,/])(\d{1,3})\.(?=\s+\p{Ll})/gu
const ISARET = /(?<![\p{L}\p{N})])([+−])\s?(?=\d)/gu
const SAYI_DESENI = new RegExp(`${ON}(${SAYI})${EK}${SON}`, 'gu')

/** A bare number. "14.30" keeps the clock reading it always had; five or more digits in a row are an id and stay. */
function yalinSayiOku(ham: string): string | null {
  if (/^\d{5,}$/.test(ham)) return null
  const saat = /^(\d{1,2})\.(\d{2})$/.exec(ham)
  if (saat && Number(saat[1]) < 24 && Number(saat[2]) < 60) return saatOku(saat[1], saat[2])
  return sayiMetniOku(ham)
}
function saatOku(s: string, dk: string): string {
  return dk === '00' ? sayiOku(Number(s)) : `${sayiOku(Number(s))} ${sayiOku(Number(dk))}`
}
const ekli = (soz: string, ek: string | undefined) => (ek ? soz + ek : soz)

function sayilariOku(metin: string): string {
  const tarih = (hepsi: string, g: string, a: string, y: string, ek?: string) => {
    const t = tarihOku(Number(g), Number(a), Number(y))
    return t ? ekli(t, ek) : hepsi
  }
  let s = metin
    .replace(TARIH_ARALIGI, (hepsi: string, t1: string, g1: string, a1: string, y1: string, t2: string, g2: string, a2: string, y2: string) => {
      const a = tarihOku(Number(g1), Number(a1), Number(y1))
      const b = tarihOku(Number(g2), Number(a2), Number(y2))
      return a && b ? `${a} ${SAYI_SOZLERI.aralik} ${b}` : hepsi
    })
    .replace(TARIH_DESENI, tarih)
    .replace(ISO_TARIH, (hepsi: string, y: string, a: string, g: string, ek?: string) => tarih(hepsi, g, a, y, ek))
    .replace(SAAT, (_h: string, sa: string, dk: string, ek?: string) => ekli(saatOku(sa, dk), ek))
    .replace(Z_SKORU, (hepsi: string, isaret: string | undefined, n: string, ek?: string) => {
      const soz = sayiMetniOku(n)
      return soz ? ekli(birlestir(SAYI_SOZLERI.zSkoru, isaretSozu(isaret), soz), ek) : hepsi
    })
    .replace(SD_EKSI, '−')
    .replace(YUZDELIK_ARALIGI, (hepsi: string, a: string, b: string, ek?: string) => {
      const x = sayiMetniOku(a)
      const y = sayiMetniOku(b)
      return x && y ? ekli(`${SAYI_SOZLERI.yuzdelik} ${x} ${SAYI_SOZLERI.aralik} ${SAYI_SOZLERI.yuzdelik} ${y}`, ek) : hepsi
    })
    .replace(YUZDELIK, (hepsi: string, n: string, ek?: string) => {
      const soz = sayiMetniOku(n)
      return soz ? ekli(`${SAYI_SOZLERI.yuzdelik} ${soz}`, ek) : hepsi
    })
    .replace(YUZDE_ONDE, `${SAYI_SOZLERI.yuzde} `)
    .replace(YUZDE_SONDA, (_h: string, n: string) => `${SAYI_SOZLERI.yuzde} ${n.replace(new RegExp(String.raw`\s?${TIRE}\s?`, 'u'), '–')}`)
    .replace(TANSIYON_BIRIMLI, (_h: string, a: string, b: string, ek?: string) => {
      const soz = `${sayiOku(Number(a))} ${SAYI_SOZLERI.bolu} ${sayiOku(Number(b))} ${BIRIM_HARITASI.get('mmhg')}`
      return ek ? ekUyarla(soz, ek) : soz
    })
    .replace(TANSIYON_SOZLU, (_h: string, on: string, a: string, b: string) => `${on}${sayiOku(Number(a))} ${SAYI_SOZLERI.bolu} ${sayiOku(Number(b))}`)
    .replace(KERE, (_h: string, a: string) => `${sayiOku(Number(a))} ${SAYI_SOZLERI.kere} `)
  s = birimleriOku(s)
  return s
    .replace(ARALIK, (hepsi: string, n: string) => {
      const soz = yalinSayiOku(n)
      return soz ? `${soz} ${SAYI_SOZLERI.aralik} ` : hepsi
    })
    .replace(SIRA_DESENI, (_h: string, n: string) => siraOku(Number(n)))
    .replace(ISARET, (_h: string, i: string) => `${isaretSozu(i)} `)
    .replace(SAYI_DESENI, (hepsi: string, n: string, ek?: string) => {
      const soz = yalinSayiOku(n)
      return soz ? ekli(soz, ek) : hepsi
    })
}

/* ───────────────────────────── the layer ───────────────────────────── */

/**
 * The spoken text, rewritten for the speech engine. `metin` is the text about to be spoken — never the screen text.
 */
export function tibbiSeslendir(metin: string, secenek: SeslendirmeSecenegi = {}): string {
  let s = String(metin ?? '')
  if (!s.trim()) return s
  const korunan: string[] = []
  const koru = (deger: string) => {
    if (korunan.length >= 0xF8FF - 0xE100) return deger
    korunan.push(deger)
    return `${KORUMA_BAS}${String.fromCharCode(0xE100 + korunan.length - 1)}${KORUMA_SON}`
  }
  for (const k of [...(secenek.koru || [])].filter((x) => x.trim()).sort(uzundanKisaya)) s = s.split(k).join(koru(k))
  for (const d of KORUMA_DESENLERI) s = s.replace(d, (m) => koru(m))
  s = sayilariOku(kisaltmalariOku(s, secenek.detay))
  return s.replace(KORUMA_GERI, (_h: string, i: string) => korunan[i.charCodeAt(0) - 0xE100] ?? '')
}

/**
 * The doctor asks for the long form in so many words ("ayrıntılı anlat", "açık adıyla söyle"). The second stage of a
 * tiered answer ("devam et") is detail too — the caller knows that from the turn, not from this sentence.
 */
const DETAY_ISTEGI = /ayrıntı(?:lı|sıyla|larıyla|ya)|detay(?:lı|ıyla|larıyla|a)|açık ad(?:ıyla|larıyla)|tam ad(?:ıyla|larıyla)|açılım|kısaltma(?:sız|dan|ları açarak)|uzun hal(?:iyle|ini)/u
export function detayIstegiMi(mesaj: string): boolean {
  return DETAY_ISTEGI.test(kucuk(String(mesaj || '')))
}

/* ───────────────────────────── what is left unread (quality check, dev tool) ───────────────────────────── */

const BIRIM_SIMGESI = /[°µμ%℃]/u
const KALAN_BIRIM = new RegExp(`${ON}(?:${birimSecenekleri(YALIN_BIRIMLER)})${SON}|\\d\\s?(?:${BIRIM})${SON}`, 'iu')

/**
 * What the layer should have rewritten and is still in a spoken text: a dictionary abbreviation that is not read as
 * written, a unit symbol or a unit abbreviation. Empty for any output of tibbiSeslendir.
 */
export function seslendirilmemisler(okunus: string): string[] {
  const metin = String(okunus || '')
  const out: string[] = []
  for (const m of metin.matchAll(KISALTMA_DESENI)) {
    const g = KISALTMA_HARITASI.get(kisaltmaAnahtari(m[1]))
    if (!g) continue
    const kendisi = [g.kisa, g.detay].some((o) => o && (g.kelime ? duzHarf(o.soz) === duzHarf(m[1]) : kisaltmaAnahtari(o.soz) === kisaltmaAnahtari(m[1])))
    if (!kendisi) out.push(m[1])
  }
  const simge = BIRIM_SIMGESI.exec(metin)
  if (simge) out.push(simge[0])
  const birim = KALAN_BIRIM.exec(metin)
  if (birim) out.push(birim[0].trim())
  return [...new Set(out)]
}

/** True when the token is a written form of the dictionary (dev tool: an all-capital token that is NOT known). */
export function sozlukteVarMi(yazi: string): boolean {
  return KISALTMA_HARITASI.has(kisaltmaAnahtari(yazi)) || BIRIM_HARITASI.has(birimAnahtari(yazi))
}
