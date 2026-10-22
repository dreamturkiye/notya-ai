/**
 * NOTYA-BELGE-OTO-01 — pure note-insertion logic for automatically evaluated documents.
 *
 * Standard workflow (all 40 specialties, all country versions, no per-document approval):
 *   belgeleri ekle -> on-device mask of the OUTBOUND copy -> evaluate -> ONE write of all blocks into the muayene note.
 *
 * Guarantees implemented here (and unit-tested in notaBlok.test.ts):
 *  - the UI banner sentence ("Yapay zekâ taslak rapor üretir...") is never part of the note body;
 *  - findings are joined without double punctuation ("izleniyor.; Yolk" -> "izleniyor; Yolk");
 *  - ICD codes stay on one line ("Z3A.\n08" -> "Z3A.08");
 *  - existing note values are never overwritten: the block is appended and a short discrepancy line is added;
 *  - idempotent per document id: re-evaluation replaces that document's own block (invisible key in the heading);
 *  - a batch is applied in ONE pass (stable order: exam time when every item has one, else upload order).
 */

export type NotaBolumu = 'objektif'

export type BlokDili = 'tr' | 'en' | 'ru'

export interface BlokGirdi {
  belgeId: string
  /** Modality label as shown to the doctor, e.g. "Ultrason". */
  etiket: string
  /** Display date (dd.mm.yyyy or locale equivalent). */
  tarih: string
  /** ISO exam date/time when readable from the image, else null. */
  sinavZamani?: string | null
  /** Position in the upload order (0-based). */
  yuklemeSirasi: number
  ozet?: string | null
  bulgular?: string[]
  /** Doctor-confirmed diagnoses only (manual path). The automatic path never passes AI diagnoses. */
  hekimTanisi?: string[]
  acil?: boolean
}

const METIN: Record<BlokDili, { baslik: (etiket: string, tarih: string) => string; bulgular: string; tani: string; acil: string; celiski: (e: string, m: string, b: string) => string }> = {
  tr: {
    baslik: (e, t) => `— Belge değerlendirmesi (${e}, ${t}) —`,
    bulgular: 'Bulgular: ', tani: 'Hekim tanısı: ',
    acil: '⚠ Acil bayrak: değerlendirmede kırmızı bayrak bulgu işaretlendi.',
    celiski: (e, m, b) => `Not: ${e} için mevcut notta ${m}, belgede ${b}; ikisi de korundu.`,
  },
  en: {
    baslik: (e, t) => `— Document review (${e}, ${t}) —`,
    bulgular: 'Findings: ', tani: 'Clinician diagnosis: ',
    acil: '⚠ Urgent flag: a red-flag finding was marked in the review.',
    celiski: (e, m, b) => `Note: for ${e} the existing note says ${m}, the document says ${b}; both kept.`,
  },
  ru: {
    baslik: (e, t) => `— Оценка документа (${e}, ${t}) —`,
    bulgular: 'Находки: ', tani: 'Диагноз врача: ',
    acil: '⚠ Срочный флаг: в оценке отмечена тревожная находка.',
    celiski: (e, m, b) => `Примечание: по ${e} в заметке ${m}, в документе ${b}; сохранены оба значения.`,
  },
}

// ─── Cleaning ────────────────────────────────────────────────────────────────────
const AFIS_KALIPLARI: RegExp[] = [
  /Yapay zek[âaÂA] taslak rapor üretir\.?\s*Tan[ıi] ve tedavi karar[ıi] hekime aittir\.?/gi,
  /AI taslağı arşivde\.?/gi,
  /AI[- ]generated draft[^.\n]*\.?\s*(?:Diagnosis and treatment decisions rest with the clinician\.?)?/gi,
  /ИИ[^.\n]*черновик[^.\n]*\.?/gi,
]

/** Removes the UI banner sentence (and its variants) from any text destined for the note body. */
export function afisTemizle(s: string): string {
  let o = s
  for (const k of AFIS_KALIPLARI) o = o.replace(k, ' ')
  return o.replace(/[ \t]{2,}/g, ' ').trim()
}

const BASLIK_RE = /^\s*[—–-]\s*(Belge değerlendirmesi|Document assessment|Document evaluation|Оценка документа)\b.*[—–-]\s*$/i

/**
 * NOTYA-BELGE-OTO-02: the model mimics old-format "Belge değerlendirmesi" blocks from the style-learning data and writes an
 * empty heading + the UI banner. Only blocks carrying the invisible key are ours; keyless headings and banner sentences
 * written by the model are removed (the real blocks are appended afterwards by notaBloklariUygula).
 */
export function llmBelgeBlokTemizle(metin: string): string {
  if (!metin) return metin
  const cikti: string[] = []
  for (const satir of metin.split('\n')) {
    if (BASLIK_RE.test(satir) && !satir.includes(ZW_BAS)) continue
    const t = afisTemizle(satir)
    if (t === '' && satir.trim() !== '') continue // line was only the banner
    cikti.push(t === satir.trim() ? satir : t)
  }
  return cikti.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

/** Keeps ICD-10 style codes on one line and strips stray whitespace inside parentheses. */
export function icdKoru(s: string): string {
  return s
    .replace(/\b([A-Z]\d{1,2}[A-Z]?)\.\s+(\d{1,4}[A-Z]?)\b/g, '$1.$2')
    .replace(/\(\s*([A-Z]\d{1,2}[A-Z]?(?:\.\d{1,4}[A-Z]?)?)\s*\)/g, '($1)')
}

/** One finding -> a single clean line (no embedded newlines, no trailing punctuation). */
export function bulguTemizle(s: string): string {
  const t = icdKoru(afisTemizle(String(s ?? '')).replace(/\s*[\r\n]+\s*/g, ' ').replace(/\s{2,}/g, ' ').trim())
  return t.replace(/[\s.;,:]+$/g, '')
}

/** Joins findings with "; " and exactly one final period. */
export function temizBirlestir(parcalar: (string | null | undefined)[]): string {
  const l = parcalar.map((p) => bulguTemizle(p ?? '')).filter(Boolean)
  return l.length ? `${l.join('; ')}.` : ''
}

// ─── Invisible per-document key ──────────────────────────────────────────────────
const ZW0 = '​', ZW1 = '‌', ZW_BAS = '⁠'
const ANAHTAR_RE = new RegExp(`${ZW_BAS}([${ZW0}${ZW1}]{64})`)

function fnv(s: string, tohum: number): number {
  let h = tohum >>> 0
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0 }
  return h >>> 0
}
/** Deterministic 64-bit key encoded as invisible characters; never visible in the note, survives editing of the body. */
export function belgeAnahtari(belgeId: string): string {
  const a = fnv(belgeId, 2166136261), b = fnv(belgeId, 0x9e3779b1)
  const bit = (n: number) => Array.from({ length: 32 }, (_, i) => ((n >>> (31 - i)) & 1 ? ZW1 : ZW0)).join('')
  return ZW_BAS + bit(a) + bit(b)
}

// ─── Block parsing ───────────────────────────────────────────────────────────────
interface BlokAralik { anahtar: string; bas: number; son: number }

function bloklariBul(metin: string): BlokAralik[] {
  const out: BlokAralik[] = []
  const satirlar = metin.split('\n')
  let ofs = 0
  for (let i = 0; i < satirlar.length; i++) {
    const m = satirlar[i].match(ANAHTAR_RE)
    if (m) {
      let son = ofs + satirlar[i].length
      for (let j = i + 1; j < satirlar.length && satirlar[j].trim() !== ''; j++) son += 1 + satirlar[j].length
      out.push({ anahtar: m[1], bas: ofs, son })
    }
    ofs += satirlar[i].length + 1
  }
  return out
}

/** Note text with every automatic block removed (used for the discrepancy check against doctor-authored text). */
export function blokSizMetin(metin: string): string {
  const b = bloklariBul(metin)
  let o = '', i = 0
  for (const x of b) { o += metin.slice(i, x.bas); i = x.son }
  return o + metin.slice(i)
}

// ─── Discrepancy ─────────────────────────────────────────────────────────────────
const OLCUM = '(FHR|KCA|CRL|BPD|FL|HC|AC|EFW|AFI|NT|EF|LVEF)'
const OLCUM_RE = new RegExp(`\\b${OLCUM}\\b[^\\d\\n]{0,12}(\\d+(?:[.,]\\d+)?)\\s*(/\\s*dk|bpm|mm|cm|%|g)?`, 'gi')

function olcumler(metin: string): Map<string, { sayi: string; birim: string }> {
  const m = new Map<string, { sayi: string; birim: string }>()
  for (const x of metin.matchAll(OLCUM_RE)) {
    const k = x[1].toUpperCase()
    if (!m.has(k)) m.set(k, { sayi: x[2].replace(',', '.'), birim: (x[3] || '').replace(/\s+/g, '') })
  }
  return m
}

const bd = (x: { sayi: string; birim: string }) => `${x.sayi}${x.birim ? (/^[/%]/.test(x.birim) ? '' : ' ') + x.birim : ''}`

/** Differences between values already in the note (outside automatic blocks) and the new block text. */
export function celiskiler(mevcutNot: string, blokMetni: string): { etiket: string; mevcut: string; belge: string }[] {
  const eski = olcumler(blokSizMetin(mevcutNot)), yeni = olcumler(blokMetni)
  const out: { etiket: string; mevcut: string; belge: string }[] = []
  for (const [k, v] of yeni) {
    const e = eski.get(k)
    if (e && Number(e.sayi) !== Number(v.sayi)) out.push({ etiket: k, mevcut: bd(e), belge: bd(v) })
  }
  return out
}

// ─── Block building / batch apply ────────────────────────────────────────────────
function blokGovdesi(g: BlokGirdi, baslik: string, dil: BlokDili, mevcutNot: string): string {
  const T = METIN[dil]
  const satirlar: string[] = [baslik + belgeAnahtari(g.belgeId)]
  const ozet = temizBirlestir([g.ozet])
  const bulgu = temizBirlestir(g.bulgular ?? [])
  if (ozet) satirlar.push(ozet)
  if (bulgu) satirlar.push(T.bulgular + bulgu)
  const tani = temizBirlestir(g.hekimTanisi ?? [])
  if (tani) satirlar.push(T.tani + tani)
  if (g.acil) satirlar.push(T.acil)
  const cel = celiskiler(mevcutNot, satirlar.join('\n'))
  if (cel.length) satirlar.push(cel.map((c) => T.celiski(c.etiket, c.mevcut, c.belge)).join(' '))
  return satirlar.join('\n')
}

export function girdileriSirala(girdiler: BlokGirdi[]): BlokGirdi[] {
  const kopya = [...girdiler]
  const hepsiZamanli = kopya.length > 0 && kopya.every((g) => g.sinavZamani && !Number.isNaN(Date.parse(g.sinavZamani)))
  return kopya.sort((a, b) => (hepsiZamanli ? Date.parse(a.sinavZamani as string) - Date.parse(b.sinavZamani as string) : 0) || a.yuklemeSirasi - b.yuklemeSirasi)
}

export interface UygulaSonuc {
  metin: string
  islemler: { belgeId: string; islem: 'eklendi' | 'degisti' | 'ayni' }[]
  degisti: boolean
}

/**
 * Applies a whole batch to the note text in one pass. Existing blocks of the same document are replaced in place,
 * new ones are appended (blank-line separated) in stable order. Text the doctor wrote is never touched.
 */
export function notaBloklariUygula(onceki: string, girdiler: BlokGirdi[], dil: BlokDili = 'tr'): UygulaSonuc {
  const sirali = girdileriSirala(girdiler)
  // "Ultrason 2/4" style numbering within the same label of this batch
  const toplam = new Map<string, number>(), sayac = new Map<string, number>()
  for (const g of sirali) toplam.set(g.etiket, (toplam.get(g.etiket) ?? 0) + 1)
  let metin = onceki || ''
  const islemler: UygulaSonuc['islemler'] = []
  for (const g of sirali) {
    const n = (sayac.get(g.etiket) ?? 0) + 1
    sayac.set(g.etiket, n)
    const etiket = (toplam.get(g.etiket) ?? 1) > 1 ? `${g.etiket} ${n}/${toplam.get(g.etiket)}` : g.etiket
    const baslik = METIN[dil].baslik(etiket, g.tarih)
    const blok = blokGovdesi(g, baslik, dil, metin)
    const anahtar = belgeAnahtari(g.belgeId).slice(1)
    const var_ = bloklariBul(metin).find((b) => b.anahtar === anahtar)
    if (var_) {
      const eski = metin.slice(var_.bas, var_.son)
      if (eski === blok) { islemler.push({ belgeId: g.belgeId, islem: 'ayni' }); continue }
      metin = metin.slice(0, var_.bas) + blok + metin.slice(var_.son)
      islemler.push({ belgeId: g.belgeId, islem: 'degisti' })
    } else {
      metin = metin.trimEnd() ? `${metin.trimEnd()}\n\n${blok}` : blok
      islemler.push({ belgeId: g.belgeId, islem: 'eklendi' })
    }
  }
  return { metin, islemler, degisti: islemler.some((i) => i.islem !== 'ayni') }
}
