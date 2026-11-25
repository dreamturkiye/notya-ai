/**
 * ESNEK-READER-2 — El Notu Okuyucu: the reading orchestration (pure; the model is injected).
 *
 * Reader v2 reads the WHOLE masked page holistically, the way a colleague reads a scrawl: with the sentence, the clinical
 * context and the doctor's usual outline (Phase A/B v1 cut the page into single-line crops and lost exactly that context —
 * measured 2026-11-23: 11 % of clinical facts auto-accepted, 41 questions per page). Per page (only MASKED pixels ever reach
 * this module — the device masked them, see gizlilik.ts / sayfaPaketi.ts; the server re-checks the mask, maskeKaniti.ts):
 *  1. N (default 3) independent page reads, varied in what they see and in prompt order (whole page then tiles / tiles
 *     then whole page with the outline after the images / whole page alone). Each read gets the specialty vocabulary, the
 *     doctor's lexicon, his confirmed crops (Phase A memory) and the STRUCTURE PRIOR (anahat.ts). Output per line: words
 *     with a 0..1 confidence and alternatives, the line's vertical extent, the outline field.
 *  2. Page-level self-consistency: the lines of the reads are aligned (text + position), then the words (uzlastir.ts
 *     cokluUzlastir). Agreement → confidence; disagreement → candidates.
 *  3. Protected classes (korumali.ts): side, Ø/negation, numbers, doses, drugs, allergies are accepted only when EVERY read
 *     gives exactly the same reading at high confidence — otherwise always asked (never budgeted away).
 *  4. Doğrula budget (DOGRULA_BUTCESI, 5 per page): after the protected questions, only words whose disagreement changes
 *     clinical meaning are asked (critical outline field, lexicon / clinical word among the candidates); a line with several
 *     open words is ONE question (the reads' line texts are the candidates). Non-clinical noise the reads disagree on
 *     becomes "[okunamadı]" without a question; clinical words beyond the budget stay visible with "(?)".
 *  5. Drawings (cizim.ts): marked regions only; side from the template. Clinical normalisation with the lexicon, guarded
 *     so it can never add a fact (uydurmaDenetimi). Every question carries its crop box: the model's line extent snapped to
 *     the device's own line boxes.
 *
 * Prompts are English (country-neutral); the handwriting language, branş, outline and lexicon are parameters.
 */
import type { CizimBolgesi, CizimBulgusu, DogrulaSorusu, HafizaOrnegi, HamKelime, KaliteKarari, KaynakOkuma, Kutu, OkunanKelime, SatirOkuma, SayfaOkuma } from './tipler'
import { benzerlik, cokluUzlastir, kelimeAnahtari, satirBenzerligi, type OyluKelime } from './uzlastir'
import { benzerOrnekler } from './hafiza'
import { satirKorumali, KORUMALI_ESIK, KELIME_ESIK, type IlacEslesmesi } from './korumali'
import { bilinmeyenKisaltmaMi, genislet, sozlukBlogu, yasCinsiyet, type Sozluk } from './sozluk'
import { bulgulariDogrula, isaretliMi, type BolgeDurumu } from './cizim'
import { alanBul, anahatBlogu, KRITIK_TURLER, type Anahat, type AnahatAlani } from './anahat'

export type GorselBlok = { mime: string; base64: string }
export type IstemParcasi = { tur: 'metin'; metin: string } | { tur: 'gorsel'; gorsel: GorselBlok }

/** The model path, injected (server: lib/ai/cagir.ts via lib/elNotu/model.ts; harness: the same or a recorded replay). */
export type ModelKapisi = {
  gorselJson(o: { sistem: string; parcalar: IstemParcasi[]; azamiToken: number; etiket: string }): Promise<unknown>
  metinJson(o: { sistem: string; mesaj: string; azamiToken: number; etiket: string }): Promise<unknown>
}

/** A handwriting line the device found (box + word boxes + shape descriptors). No picture: only the page and tiles travel. */
export type SatirPaketi = {
  no: number
  kutu: Kutu
  kelimeler: Kutu[]
  tanimlar: ({ v: number[]; enBoy: number } | null)[]
  bolgeId?: string | null
}

export type BolgePaketi = CizimBolgesi & { murekkep: number; gorsel?: GorselBlok | null }

/** A higher-resolution horizontal band of the masked page (y0..y1 = its extent on the page, 0..1). */
export type SayfaParcasi = { gorsel: GorselBlok; y0: number; y1: number }

export type SayfaPaketi = {
  sayfa: number
  sablonId: string | null
  kalite: KaliteKarari
  satirlar: SatirPaketi[]
  bolgeler: BolgePaketi[]
  /** Tiles of the masked page (only when the whole-page picture is too small for the handwriting). */
  parcalar?: SayfaParcasi[]
  /** The identity boxes the device painted black (normalised) — the server verifies them on every picture (maskeKaniti.ts). */
  gizlilikKutulari?: Kutu[]
  /** The doctor's standing "my plain sheets carry no identity" declaration applied to this page (no boxes needed). */
  serbest?: boolean
}

export type OkuyucuDili = {
  /** Language of the handwriting, in English ("Turkish"). */
  dilAdi: string
  /** Heading for drawing findings in the source text ("Çizim bulguları"). */
  cizimBasligi: string
  taraf: { sag: string; sol: string; iki: string }
  /** Words the normaliser may add that carry no clinical fact (conjunctions, "yok" for Ø …), folded. */
  bagSozcukleri: string[]
  /** Marker for non-clinical noise the reads disagree on ("[okunamadı]"). */
  okunamadi?: string
  /**
   * Suffixes written after a number ("2017'de" = "2017 de"): a number followed by one of them is one token, so reads that
   * split it and reads that do not still agree (empty / absent = no merging, e.g. English).
   */
  sayiEkleri?: string[]
}

export type OkuyucuBaglami = {
  bransAdi: string
  dil: OkuyucuDili
  sozluk: Sozluk
  hafiza: HafizaOrnegi[]
  dagarcik: Map<string, number>
  ilac?: IlacEslesmesi
  /** Abbreviations already asked (open) or answered for this doctor — asked once, never again. */
  sorulmusKisaltmalar: Set<string>
  /** The doctor's own frequent written words (his approved notes, most frequent first) — a recognition aid. */
  hekimSozcukleri?: string[]
  /** Is this a common word of the language (not an abbreviation)? */
  sozcukMu: (t: string) => boolean
  /** The whole MASKED page (the same picture the vault keeps). */
  sayfaGorseli?: GorselBlok | null
  /** Structure prior: the doctor's learned outline, or the build's default for the branş. */
  anahat?: Anahat | null
  /** Independent page reads (1–3, default 3). */
  okumaSayisi?: number
  /** Doğrula questions per page beyond the protected ones (default DOGRULA_BUTCESI). */
  dogrulaButcesi?: number
}

const CIZIM_KURALLARI = (dilAdi: string, brans: string) => `You look at regions of a printed ${brans} examination form on which a physician marked findings with a pen (${dilAdi}).
For each region image (labelled with its id and anatomy) describe ONLY the physician's pen marks: a letter "N" (normal), a circle, hatching, an arrow, a line, a dot, and any handwritten words in or pointing into the region.
Rules:
- "bulgu" = the CLINICAL finding the mark records, in ${dilAdi}, short (a few words), as the physician would write it in the note: e.g. an "N" → the word for "normal"; a hatched or circled area → the finding (lesion, perforation, retraction, hypertrophy …) if written or unmistakable, else only the word for "marked". Do not repeat the region's name or the word "region": the form adds the anatomy and the side. Handwritten words in or pointing into the region → those words, as written.
- NEVER describe the pen gesture in "bulgu" (no "letter", "circle", "arrow", "line", "dot", "drawn", "pointing to"): the gesture goes ONLY in "isaret".
- Never invent a finding that is not drawn or written. Printed drawing lines are not findings.
- Do not state the side (right/left): the form decides it.
- If a region has no pen mark, return nothing for it.
- Return ONLY JSON: {"bulgular":[{"bolgeId":"<id>","bulgu":"<short finding>","isaret":"yazi|ok|daire|tarama|cizgi|normal_isareti|nokta","g":0.0}]}`

const NORMAL_KURALLARI = (dilAdi: string, brans: string) => `You normalise a physician's literal handwritten clinical lines (${dilAdi}, ${brans}) into clean clinical ${dilAdi}.
Rules:
- Expand abbreviations ONLY with the lexicon given (the doctor's own entries win). If an abbreviation is not in the lexicon, keep it as written.
- Fix spelling of words that are obviously the same word; keep the meaning exactly. Do not add, infer or remove any fact: no diagnosis, finding, number, dose, side or negation that is not in the line.
- Tokens like ⟦s1-l3-w2|word?⟧ are unconfirmed readings: copy them EXACTLY as they are, in place.
- Keep every "(?)" flag right after the word it follows and every "[okunamadı]" mark exactly where it is.
- One output line per input line, same "no".
- Return ONLY JSON: {"satirlar":[{"no":<n>,"normal":"<text>"}]}`

const OKUMA_KURALLARI = (dilAdi: string, brans: string) => `You transcribe ONE page of a physician's HANDWRITTEN clinical note (${dilAdi}; specialty: ${brans}). Identity areas are blacked out: never guess what was under them.
Read it the way an experienced colleague of this physician reads his handwriting: use the whole sentence, the clinical context and the usual structure of his notes to recognise each word — but write ONLY what is actually written.
The notes are a clinical history / examination: age and sex, complaint and its timeline, systemic illnesses, regular medication, drug allergy, allergic causes, smoking, fluid intake, past history and operations, examination findings, tests and measurements, diagnosis and plan.
Rules:
- Every handwritten line, top to bottom, in writing order. Literal: keep the doctor's abbreviations, symbols (Ø ∅ + - ↑ ↓ → ? = / x), numbers, units and punctuation as written. Do NOT expand, translate, correct or complete anything. A heading that is written is transcribed as written; a heading that is not written is never added.
- Every word: "g" = probability 0..1 that your reading is exactly right (be honest: scrawl you are not sure of gets g < 0.7); "alt" = up to 3 other plausible readings whenever g < 0.85.
- An unreadable word → "?" with g <= 0.2. Never guess a drug name, a number, a dose, a side (right/left) or a negation: give your best reading with an honest low g and alternatives.
- Crossed-out words: omit. PRINTED text (form labels, letterhead, stamps, legal footers) and printed drawings are not handwriting: never transcribe them. Pen marks INSIDE drawings are read separately: skip them, but DO transcribe handwritten words anywhere else on the page, including short ones next to a drawing or at the end of an arrow.
- Per line: "y0","y1" = its vertical extent on the WHOLE page in thousandths (0 = top edge, 1000 = bottom edge); "alan" = the outline field the line belongs to (one of the outline names given) or null.
- Return ONLY JSON: {"satirlar":[{"y0":0,"y1":0,"alan":null,"kelimeler":[{"m":"<word>","g":0.0,"alt":["..."]}]}]}`

/** Vocabulary as a recognition aid (all reads: the reads stay independent by what they see and in what order). */
const SOZCUK_YARDIMI = (sozcukler: string[]) => sozcukler.length
  ? `Vocabulary this physician and specialty use (abbreviation (meaning) or word) — it only helps you RECOGNISE a word that is really written; never write a vocabulary word that is not on the page:\n${sozcukler.join('; ')}`
  : ''

/**
 * Vocabulary list from the lexicon (doctor first, then branş, then general), capped — then the doctor's own frequent
 * written words (ESNEK-KBB2: his approved notes, hafiza.ts sikSozcukler), capped apart so they never crowd out the lexicon.
 */
export function okumaSozcukleri(s: Sozluk, azami = 260, hekimSozcukleri: string[] = [], hekimAzami = 150): string[] {
  const gorulen = new Set<string>()
  const out: string[] = []
  for (const g of s.girdiler) {
    if (g.baglam === 'sembol') continue
    const k = kelimeAnahtari(g.kisaltma)
    if (!k || gorulen.has(k)) continue
    gorulen.add(k)
    out.push(kelimeAnahtari(g.anlam) === k ? g.anlam : `${g.kisaltma} (${g.anlam})`)
    if (out.length >= azami) break
  }
  let ek = 0
  for (const w of hekimSozcukleri) {
    const k = kelimeAnahtari(w)
    if (!k || gorulen.has(k) || ek >= hekimAzami) continue
    gorulen.add(k); out.push(w); ek++
  }
  return out
}

/** Output budget of one page read (a dense narrative page: ~30 lines × words × alternatives + reasoning room). */
export const OKUMA_TOKEN = 12000
/** Doğrula questions per page beyond the protected ones (product target: ≤ 5 answers per page). */
export const DOGRULA_BUTCESI = 5
/** Page reads for self-consistency. */
export const OKUMA_SAYISI = 3

type HamSayfaSatiri = { y0: number; y1: number; alan: string | null; kelimeler: HamKelime[] }

/** "2017 de" / "2017'de" / "2017’de" → one token "2017'de" (the language's number suffixes only). */
export function sayiEkiBirlestir(kelimeler: HamKelime[], ekler: string[] | undefined): HamKelime[] {
  if (!ekler?.length) return kelimeler
  const ek = new Set(ekler.map((e) => e.toLocaleLowerCase('tr')))
  const out: HamKelime[] = []
  for (const k of kelimeler) {
    const m = /^(.*\d)[’`´]([\p{L}]+)$/u.exec(k.m)
    if (m && ek.has(m[2].toLocaleLowerCase('tr'))) { out.push({ ...k, m: `${m[1]}'${m[2]}` }); continue }
    const o = out[out.length - 1]
    const yalin = k.m.replace(/^['’`´]/, '')
    if (o && /\d$/.test(o.m) && ek.has(yalin.toLocaleLowerCase('tr'))) { out[out.length - 1] = { ...o, m: `${o.m}'${yalin}`, g: Math.min(o.g, k.g), alt: [] }; continue }
    out.push(k)
  }
  return out
}

function sayfaSatirlariAyikla(ham: unknown, sayiEkleri?: string[]): HamSayfaSatiri[] {
  const liste = Array.isArray((ham as { satirlar?: unknown })?.satirlar) ? (ham as { satirlar: unknown[] }).satirlar : Array.isArray(ham) ? (ham as unknown[]) : []
  const out: HamSayfaSatiri[] = []
  for (const [i, s] of (liste as Record<string, unknown>[]).entries()) {
    if (!s || typeof s !== 'object') continue
    const kelimeler: HamKelime[] = (Array.isArray(s.kelimeler) ? s.kelimeler : [])
      .map((k: Record<string, unknown>) => ({ m: String(k?.m ?? '').trim(), g: Number(k?.g ?? 0), alt: Array.isArray(k?.alt) ? (k.alt as unknown[]).map(String).filter(Boolean).slice(0, 3) : [] }))
      .filter((k: HamKelime) => k.m)
    if (!kelimeler.length) continue
    kelimeler.splice(0, kelimeler.length, ...sayiEkiBirlestir(kelimeler, sayiEkleri))
    let y0 = Number(s.y0), y1 = Number(s.y1)
    if (!Number.isFinite(y0) || !Number.isFinite(y1)) { y0 = NaN; y1 = NaN } else { y0 = Math.max(0, Math.min(1000, y0)); y1 = Math.max(y0, Math.min(1000, y1)) }
    out.push({ y0, y1, alan: typeof s.alan === 'string' && s.alan.trim() ? s.alan.trim().slice(0, 60) : null, kelimeler })
    void i
  }
  // a read without positions gets evenly spread positions (order is still the writing order)
  if (out.length && out.every((l) => !Number.isFinite(l.y0))) out.forEach((l, i) => { l.y0 = (i / out.length) * 1000; l.y1 = ((i + 1) / out.length) * 1000 })
  else for (const [i, l] of out.entries()) if (!Number.isFinite(l.y0)) { const o = out[i - 1]; l.y0 = o ? o.y1 : 0; l.y1 = l.y0 + 20 }
  return out
}

/** One read's plan: which pictures it sees and in which order (independence comes from different views + orders). */
/**
 * `sayfaYok` = tiles only, no whole-page picture (ESNEK-A-EVAL 2026-11-24: on the production model a whole-page-only read
 * sees a phone photo shrunk to a 768 px short side and was the weakest voter; a page without tiles keeps the page).
 */
type OkumaPlani = { etiket: string; parcalarOnce: boolean; parcaKullan: boolean; anahatSonda: boolean; sayfaYok?: boolean; tersSira?: boolean }
const OKUMA_PLANLARI: OkumaPlani[] = [
  { etiket: 'el-notu-sayfa-1', parcalarOnce: false, parcaKullan: true, anahatSonda: false },
  { etiket: 'el-notu-sayfa-2', parcalarOnce: true, parcaKullan: true, anahatSonda: true },
  { etiket: 'el-notu-sayfa-3', parcalarOnce: true, parcaKullan: true, anahatSonda: false, sayfaYok: true },
  // reads 4–5 (okumaSayisi > 3): the tiles in reverse order — more independent votes and candidates
  { etiket: 'el-notu-sayfa-4', parcalarOnce: true, parcaKullan: true, anahatSonda: true, sayfaYok: true, tersSira: true },
  { etiket: 'el-notu-sayfa-5', parcalarOnce: true, parcaKullan: true, anahatSonda: false, tersSira: true },
]

function formBilgisi(p: SayfaPaketi): string {
  if (!p.sablonId || !p.bolgeler.length) return ''
  const adlar = [...new Set(p.bolgeler.map((b) => b.etiket))].join(', ')
  return `This page is a PRINTED examination form with printed drawings (${adlar}). Its printed labels are not handwriting. Transcribe the physician's handwriting everywhere on it — the complaint written on the form's rows, notes in the margins and words written beside the drawings.`
}

function okumaParcalari(p: SayfaPaketi, plan: OkumaPlani, sayfaGorseli: GorselBlok | null | undefined, ornekler: HafizaOrnegi[], sonBlok: string): IstemParcasi[] {
  const out: IstemParcasi[] = []
  const gorselli = ornekler.filter((o) => o.gorsel).slice(0, 6)
  if (gorselli.length) {
    out.push({ tur: 'metin', metin: "Confirmed examples of THIS physician's handwriting (image → correct text). Use them to learn his letter shapes and habits:" })
    for (const o of gorselli) { out.push({ tur: 'gorsel', gorsel: o.gorsel! }); out.push({ tur: 'metin', metin: `= "${o.metin}"` }) }
  }
  const parcaVar = plan.parcaKullan && (p.parcalar || []).length > 0
  const tam: IstemParcasi[] = sayfaGorseli && !(plan.sayfaYok && parcaVar) ? [{ tur: 'metin', metin: 'The whole page:' }, { tur: 'gorsel', gorsel: sayfaGorseli }] : []
  const parcaListesi = plan.tersSira ? [...(p.parcalar || [])].map((t, i) => ({ t, i })).reverse() : (p.parcalar || []).map((t, i) => ({ t, i }))
  const parcalar: IstemParcasi[] = plan.parcaKullan ? parcaListesi.flatMap(({ t, i }) => [
    { tur: 'metin' as const, metin: `Higher-resolution tile ${i + 1}: page height ${Math.round(t.y0 * 1000)}–${Math.round(t.y1 * 1000)} (of 1000). Tiles overlap: transcribe a line that appears in two tiles ONCE.` },
    { tur: 'gorsel' as const, gorsel: t.gorsel },
  ]) : []
  out.push(...(plan.parcalarOnce ? [...parcalar, ...tam] : [...tam, ...parcalar]))
  out.push({ tur: 'metin', metin: `${sonBlok ? `${sonBlok}\n\n` : ''}Transcribe every handwritten line of this page now (y0/y1 always on the WHOLE page).` })
  return out
}

/**
 * Lines of N reads → groups of the same written line. Matching is by TEXT first (reads of a two-column page order the
 * columns differently, so an order-preserving alignment would split one line into two), position only as a tie-break:
 * the most similar pairs are matched first, one to one. Unmatched lines join a group of another read when they are the
 * same line, else stay their own group, placed after the line their read wrote before them.
 */
type SatirGrubu = { uyeler: (HamSayfaSatiri | null)[]; sira: number }
export function satirGrupla(okumalar: HamSayfaSatiri[][]): SatirGrubu[] {
  const N = okumalar.length
  if (!N) return []
  let pivot = 0
  okumalar.forEach((o, i) => { if (o.length > okumalar[pivot].length) pivot = i })
  const P = okumalar[pivot]
  const gruplar: SatirGrubu[] = P.map((l, i) => { const u = new Array<HamSayfaSatiri | null>(N).fill(null); u[pivot] = l; return { uyeler: u, sira: i } })
  const yakinlik = (a: HamSayfaSatiri, b: HamSayfaSatiri) => {
    const s = satirBenzerligi(a.kelimeler.map((k) => k.m), b.kelimeler.map((k) => k.m))
    const fark = Math.abs((a.y0 + a.y1) / 2 - (b.y0 + b.y1) / 2) / 1000
    // the same outline field nearby is strong evidence of the same line, even when the reads disagree on its words
    const alan = a.alan && b.alan && kelimeAnahtari(a.alan) === kelimeAnahtari(b.alan) && fark < 0.15 ? 0.25 : 0
    return s + alan - (fark > 0.2 ? 0.25 : fark * 0.3)
  }
  okumalar.forEach((o, j) => {
    if (j === pivot || !o.length) return
    const ciftler: { x: number; g: number; v: number }[] = []
    for (let x = 0; x < o.length; x++) for (let gi = 0; gi < gruplar.length; gi++) {
      const uyeler = gruplar[gi].uyeler.filter((u, k) => u && k !== j) as HamSayfaSatiri[]
      if (!uyeler.length) continue
      const v = Math.max(...uyeler.map((u) => yakinlik(u, o[x])))
      if (v >= 0.3) ciftler.push({ x, g: gi, v })
    }
    ciftler.sort((a, b) => b.v - a.v)
    const xKullanildi = new Set<number>(), gKullanildi = new Set<number>()
    const eslesme = new Map<number, number>()
    for (const c of ciftler) {
      if (xKullanildi.has(c.x) || gKullanildi.has(c.g) || gruplar[c.g].uyeler[j]) continue
      xKullanildi.add(c.x); gKullanildi.add(c.g); eslesme.set(c.x, c.g)
    }
    let onceki = -1
    for (let x = 0; x < o.length; x++) {
      const e = eslesme.get(x)
      if (e !== undefined) { gruplar[e].uyeler[j] = o[x]; onceki = gruplar[e].sira; continue }
      const u = new Array<HamSayfaSatiri | null>(N).fill(null); u[j] = o[x]
      onceki += 0.01
      gruplar.push({ uyeler: u, sira: onceki })
    }
  })
  return gruplar.sort((a, b) => a.sira - b.sira)
}

const medyan = (x: number[]) => { const s = x.filter(Number.isFinite).sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : NaN }

/** The model's line extent snapped to the device's own line boxes (a precise crop for Doğrula). */
export function kutuYerlestir(y0: number, y1: number, cihaz: SatirPaketi[]): { kutu: Kutu; satir: SatirPaketi | null; tek: boolean } {
  const a = y0 / 1000, b = y1 / 1000
  const ortak = cihaz.filter((s) => { const c = (s.kutu.y0 + s.kutu.y1) / 2; return c >= a - 0.012 && c <= b + 0.012 })
  if (!ortak.length) {
    const yakin = cihaz.map((s) => ({ s, d: Math.abs((s.kutu.y0 + s.kutu.y1) / 2 - (a + b) / 2) })).sort((x, y) => x.d - y.d)[0]
    if (yakin && yakin.d <= 0.02) return { kutu: yakin.s.kutu, satir: yakin.s, tek: true }
    return { kutu: { x0: 0.03, y0: Math.max(0, a - 0.005), x1: 0.97, y1: Math.min(1, b + 0.005) }, satir: null, tek: false }
  }
  const kutu = { x0: Math.min(...ortak.map((s) => s.kutu.x0)), y0: Math.min(...ortak.map((s) => s.kutu.y0)), x1: Math.max(...ortak.map((s) => s.kutu.x1)), y1: Math.max(...ortak.map((s) => s.kutu.y1)) }
  return { kutu, satir: ortak[0], tek: ortak.length === 1 }
}

const TIBBI_EK = /(itis|it|oma|ektomi|tomi|stomi|skopi|skopik|grafi|plasti|pati|ozis|emi|algi|uri|lit|liti|iyazis|yazis|ür|plazi|trofi|fiks|sinüs|sinüzit|polip|kist|nodül|nodul|tümör|tumor|lezyon|apse|ödem|odem|kanama|ağrı|agri|ateş|ates)$/i
/** Is this token clinically meaningful for this doctor (lexicon, his vocabulary or a clinical word form)? */
function klinikMi(t: string, b: OkuyucuBaglami, anlamlar: Set<string>): boolean {
  const k = kelimeAnahtari(t).replace(/[^\p{L}\p{N}/]/gu, '')
  if (!k || k === '?') return false
  if (/\d/.test(k)) return true
  if (b.sozluk.harita.has(k) || b.sozluk.harita.has(t.trim().toLocaleLowerCase('tr'))) return true
  if (k.length >= 4 && anlamlar.has(k)) return true
  if ((b.dagarcik.get(k) || 0) >= 2) return true
  return k.length >= 5 && TIBBI_EK.test(k)
}

type AcikKelime = { i: number; oncelik: 1 | 2 | 3; kor: OkunanKelime['korumali']; agirlik: number }
type SoruBirimi = { satirIdx: number; acik: AcikKelime[]; oncelik: number; agirlik: number; guven: number }

export type SayfaSonucu = SayfaOkuma & { okumaSayisi: number; hafizaOrnegi: number; butceDisi: number; okunamadi: number }

export async function sayfayiOku(p: SayfaPaketi, b: OkuyucuBaglami, model: ModelKapisi): Promise<SayfaSonucu> {
  const tumTanimlar = p.satirlar.flatMap((s) => s.tanimlar.filter(Boolean) as { v: number[]; enBoy: number }[])
  const ornekler = benzerOrnekler(tumTanimlar, b.hafiza, 12)
  const anahat = b.anahat && b.anahat.alanlar.length ? b.anahat : null
  const anahatMetni = anahat ? anahatBlogu(anahat) : ''
  const sozcukMetni = SOZCUK_YARDIMI(okumaSozcukleri(b.sozluk, 260, b.hekimSozcukleri))
  const form = formBilgisi(p)
  const N = Math.max(1, Math.min(OKUMA_PLANLARI.length, b.okumaSayisi ?? OKUMA_SAYISI))
  const planlar = OKUMA_PLANLARI.slice(0, N)
  let okumaSayisi = 0

  const oku = async (plan: OkumaPlani): Promise<HamSayfaSatiri[] | null> => {
    const ek = [form, plan.anahatSonda ? '' : anahatMetni, sozcukMetni].filter(Boolean).join('\n\n')
    const sistem = `${OKUMA_KURALLARI(b.dil.dilAdi, b.bransAdi)}${ek ? `\n\n${ek}` : ''}`
    const parcalar = okumaParcalari(p, plan, b.sayfaGorseli, ornekler, plan.anahatSonda ? anahatMetni : '')
    // one retry with twice the output room when the answer is not usable JSON (a lost read weakens the consensus)
    for (let deneme = 0; deneme < 2; deneme++) {
      okumaSayisi++
      try {
        const l = sayfaSatirlariAyikla(await model.gorselJson({ sistem, parcalar, azamiToken: deneme === 0 ? OKUMA_TOKEN : OKUMA_TOKEN * 2, etiket: plan.etiket }), b.dil.sayiEkleri)
        if (l.length || deneme === 1) return l
      } catch { /* retry once */ }
    }
    return null
  }

  // drawings: only regions with pen ink or a device line linked to them — read in parallel with the page reads
  const durumlar: BolgeDurumu[] = p.bolgeler.map((r) => ({ ...r, bagliSatirlar: p.satirlar.filter((s) => s.bolgeId === r.id).map((s) => s.no) }))
  const isaretli = durumlar.filter(isaretliMi)
  const cizimOku = async (): Promise<CizimBulgusu[]> => {
    if (!isaretli.length) return []
    const parcalar: IstemParcasi[] = []
    for (const r of isaretli) {
      // a drawing printed for both sides (two region ids on one picture): only the marks of THIS side's half belong here
      const yan = r.taraf === 'sag' || r.taraf === 'sol' ? `, ${r.taraf === 'sag' ? 'RIGHT' : 'LEFT'} side only — marks in, or arrows / lines ending in, the part of the drawing printed for that side (the form prints the side names under the drawings)` : ''
      parcalar.push({ tur: 'metin', metin: `Region ${r.id} (${r.etiket}${yan}):` })
      const g = p.bolgeler.find((x) => x.id === r.id)?.gorsel
      if (g) parcalar.push({ tur: 'gorsel', gorsel: g })
    }
    okumaSayisi++
    try { return bulgulariDogrula(await model.gorselJson({ sistem: CIZIM_KURALLARI(b.dil.dilAdi, b.bransAdi), parcalar, azamiToken: 3000, etiket: 'el-notu-cizim' }), durumlar) } catch { return [] }
  }

  const [okumalarHam, cizimler] = await Promise.all([Promise.all(planlar.map(oku)), cizimOku()])
  // a read that failed twice does not vote (the agreement rules count only the reads that answered)
  const okumalar = okumalarHam.filter((o): o is HamSayfaSatiri[] => o !== null)
  const R = okumalar.length
  // a drawing finding is ONE call: handwritten words it reports (isaret 'yazi') are accepted without a question only when
  // a page read also saw them (the page reads transcribe the words written beside the drawings) — a single read's guess
  // at a scrawl next to a drawing ("kısal." for "temiz.") is asked or flagged, never shown as confirmed (ESNEK-KBB2)
  const hamSozcukler = okumalar.flatMap((o) => o.flatMap((l) => l.kelimeler.flatMap((k) => [k.m, ...(k.alt || [])]))).map(kelimeAnahtari).filter((w) => w.length >= 3)
  for (const c of cizimler) {
    if (!c.kabul || c.isaret !== 'yazi') continue
    const icerik = c.bulgu.split(/[^\p{L}\p{N}]+/u).map(kelimeAnahtari).filter((w) => w.length >= 3 && /\p{L}/u.test(w))
    if (icerik.some((w) => !hamSozcukler.some((h) => h === w || benzerlik(h, w) >= 0.8))) c.kabul = false
  }
  const gruplar = satirGrupla(okumalar)
  const anlamlar = new Set(b.sozluk.girdiler.flatMap((x) => x.anlam.split(/\s+/)).map(kelimeAnahtari).filter((x) => x.length >= 4))
  const okunamadiIsareti = b.dil.okunamadi || '[okunamadı]'

  type IcSatir = { satir: SatirOkuma; acik: AcikKelime[]; satirAdaylari: string[]; alan: AnahatAlani | null; tekCihaz: boolean; oylar: number[]; etiket: string | null }
  const ic: IcSatir[] = []
  for (const g of gruplar) {
    const uyeler = g.uyeler.filter((u): u is HamSayfaSatiri => !!u)
    const oylu: OyluKelime[] = cokluUzlastir(g.uyeler.map((u) => u?.kelimeler ?? null), R)
    if (!oylu.length) continue
    const no = ic.length + 1
    const y0 = medyan(uyeler.map((u) => u.y0)), y1 = medyan(uyeler.map((u) => u.y1))
    const yer = kutuYerlestir(y0, y1, p.satirlar)
    const alanAdlari = uyeler.map((u) => u.alan).filter((x): x is string => !!x)
    const alanAdi = alanAdlari.sort((a, c) => alanAdlari.filter((x) => x === c).length - alanAdlari.filter((x) => x === a).length)[0]
    const alan = anahat && alanAdi ? alanBul(alanAdi, anahat.alanlar) : null
    // printed form: a short handwritten entry ("N", "kuru") sits next to a PRINTED row label the reads do not transcribe;
    // when at least two reads put the line in the same outline field, the field name is carried as the line's label
    // ("Boyun: N") — the form's own context, never a finding. Narrative pages write their headings themselves.
    const alanOyu = alan ? alanAdlari.filter((x) => alanBul(x, anahat!.alanlar) === alan).length : 0
    const korumali = satirKorumali(oylu.map((k) => k.metin), b.ilac)
    // structure prior: every word of an allergy field after its heading is allergy-protected, also on the field's
    // continuation lines (a drug written under "İlaç alerjisi =" on the next line)
    // a near drug-name match tags only a word in a drug / allergy field or a capitalised word (a brand) — an ordinary
    // word one or two letters from some drug name ("olmamış") is not a drug
    korumali.forEach((kor, i) => {
      if (!kor.includes('ilac') || !b.ilac) return
      const e = b.ilac(oylu[i].metin)
      // a capitalised word counts as a possible brand only from 5 letters on ("Anti", "Ana" are not drug names)
      if (e?.durum === 'yakin' && !(alan && (alan.tur === 'ilac' || alan.tur === 'alerji')) && !(/^\p{Lu}/u.test(oylu[i].metin) && kelimeAnahtari(oylu[i].metin).length >= 5)) korumali[i] = kor.filter((x) => x !== 'ilac')
    })
    if (alan?.korumali === 'alerji') {
      const basEki = oylu.findIndex((k) => /[:=]$/.test(k.metin) || k.metin === '=' || k.metin === ':')
      oylu.forEach((k, i) => { if (i > basEki && !/^[:=\-]$/.test(k.metin) && !korumali[i].includes('alerji')) korumali[i] = [...korumali[i], 'alerji'] })
    }
    const acik: AcikKelime[] = []
    const kelimeler: OkunanKelime[] = oylu.map((k, i) => {
      const okunamaz = /^\?+$/.test(k.metin)
      const kor = korumali[i]
      const ilac = kor.includes('ilac') && b.ilac ? b.ilac(k.metin) : null
      let kabul: boolean
      if (okunamaz) kabul = false
      // protected: EVERY answering read gives exactly the same reading. With three independent reads (different views and
      // orders) unanimity is the high confidence; no read may call it a guess. Two reads also need a high combined score.
      else if (kor.length) kabul = R >= 2 && k.tamOy === R && (R >= 3 ? k.enDusuk >= 0.35 : k.enDusuk >= 0.6 && k.guven >= KORUMALI_ESIK) && (!kor.includes('ilac') || (ilac?.durum === 'tam' && kelimeAnahtari(ilac.ad) === kelimeAnahtari(k.metin)))
      else kabul = R >= 2 ? (k.oy === R || (k.oy >= 2 && k.guven >= 0.5)) : k.guven >= KELIME_ESIK
      const adaylar = ilac && ilac.durum === 'yakin' ? [...new Set([k.metin, ilac.ad, ...k.adaylar])] : k.adaylar
      if (!kabul) {
        // 3 = protected (always asked) · 2 = changes clinical meaning: a clinical word among the candidates, or any word of
        // an outline field (critical fields — drugs, allergy, diagnosis, plan, tests, systemic — first) · 1 = noise: the
        // reads give only "?" / fragments, or the line belongs to no outline field and no candidate is clinical
        const adaylarHepsi = [k.metin, ...adaylar].filter((a) => a && !/^\?+$/.test(a))
        const klinik = adaylarHepsi.some((a) => klinikMi(a, b, anlamlar))
        const kritik = !!alan && KRITIK_TURLER.has(alan.tur)
        const parca = adaylarHepsi.every((a) => kelimeAnahtari(a).replace(/[^\p{L}\p{N}]/gu, '').length <= 1)
        // a protected word only ONE read wrote here (the others wrote nothing at this place) is not a disagreement to
        // settle but a possible guess: never accepted, asked only within the budget like any clinical word
        const oncelik: 1 | 2 | 3 = kor.length && k.kapsam >= 2 ? 3 : kor.length ? 2 : !parca && (klinik || !!alan) ? 2 : 1
        acik.push({ i, oncelik, kor, agirlik: (kritik ? 1 : 0) + (klinik ? 0.5 : 0) })
      }
      const kutu = yer.tek && yer.satir && yer.satir.kelimeler.length === oylu.length ? yer.satir.kelimeler[i] : yer.kutu
      return { metin: k.metin, guven: Math.round(k.guven * 100) / 100, adaylar: adaylar.filter((a) => a && a !== '?'), uyum: k.oy === R && R >= 2, korumali: kor, kabul, kutu }
    })
    const ham = kelimeler.map((k) => k.metin).join(' ')
    const satirAdaylari = [...new Set(uyeler.map((u) => u.kelimeler.map((k) => k.m).join(' ')))].slice(0, 4)
    const etiketVar = alan && [alan.ad, ...(alan.esler || [])].some((e) => kelimeAnahtari(ham).includes(kelimeAnahtari(e)))
    const etiket = p.sablonId && alan && alanOyu >= 2 && oylu.length <= 4 && !etiketVar ? alan.ad : null
    ic.push({ satir: { no, kutu: yer.kutu, kelimeler, ham, normal: ham, bolgeId: yer.satir?.bolgeId ?? null }, acik, satirAdaylari, alan, tekCihaz: yer.tek, oylar: oylu.map((k) => k.oy), etiket })
  }

  // ---- Doğrula budget: protected always; then clinical-meaning words, most doubtful first; one question per line ----
  const birimler: SoruBirimi[] = []
  ic.forEach((x, satirIdx) => {
    const soru = x.acik.filter((a) => a.oncelik >= 2)
    if (soru.length) birimler.push({ satirIdx, acik: soru, oncelik: Math.max(...soru.map((a) => a.oncelik)), agirlik: Math.max(...soru.map((a) => a.agirlik)), guven: Math.min(...soru.map((a) => x.satir.kelimeler[a.i].guven)) })
  })
  birimler.sort((a, c) => c.oncelik - a.oncelik || c.agirlik - a.agirlik || a.guven - c.guven)
  const butce = Math.max(0, b.dogrulaButcesi ?? DOGRULA_BUTCESI)
  const cizimAcik = cizimler.filter((c) => !c.kabul)
  const sorulan = new Set<SoruBirimi>()
  let kalan = butce
  // protected questions count against the budget but are never dropped by it
  for (const u of birimler) if (u.oncelik >= 3) { sorulan.add(u); kalan-- }
  // on a printed form the drawings ARE the examination (most of its findings): uncertain drawing findings come before
  // the non-protected words; on a narrative page they compete for what is left. Beyond the budget: shown with "(?)"
  const cizimOnce = !!p.sablonId
  const cizimSorulan = new Set<CizimBulgusu>()
  if (cizimOnce) for (const c of cizimAcik) if (kalan > 0) { cizimSorulan.add(c); kalan-- }
  for (const u of birimler) if (u.oncelik < 3 && kalan > 0) { sorulan.add(u); kalan-- }
  if (!cizimOnce) for (const c of cizimAcik) if (kalan > 0) { cizimSorulan.add(c); kalan-- }
  let butceDisi = 0
  for (const c of cizimAcik) if (!cizimSorulan.has(c)) { c.belirsiz = true; butceDisi++ }

  const dogrula: DogrulaSorusu[] = []
  const girdiSatirlari: { no: number; metin: string }[] = []
  let okunamadi = 0
  ic.forEach((x, satirIdx) => {
    const s = x.satir
    const birim = birimler.find((u) => u.satirIdx === satirIdx)
    const soruldu = birim && sorulan.has(birim)
    if (soruldu && birim!.acik.length >= 2) {
      // several doubtful words on one line → ONE question about the line (the reads' line texts are the candidates)
      const anah = ANAHTAR(p.sayfa, s.no)
      const korumaliTur = birim!.acik.find((a) => a.kor.length)?.kor[0]
      dogrula.push({ anahtar: anah, sinif: korumaliTur ? 'korumali' : 'kelime', ...(korumaliTur ? { korumaliTur } : {}), okunan: s.ham, adaylar: x.satirAdaylari.filter((a) => a !== s.ham).length ? x.satirAdaylari : [], sayfa: p.sayfa, kutu: s.kutu, satirNo: s.no, baglam: s.ham })
      girdiSatirlari.push({ no: s.no, metin: `⟦${anah}|${s.ham.replace(/[⟦⟧|]/g, '')}?⟧` })
      return
    }
    const parcalar: string[] = []
    s.kelimeler.forEach((k, i) => {
      const a = x.acik.find((y) => y.i === i)
      if (!a) { parcalar.push(k.metin); return }
      if (a.oncelik === 1) {
        // non-clinical noise the reads disagree on: marked, not asked (consecutive marks collapse)
        okunamadi++
        if (parcalar[parcalar.length - 1] !== okunamadiIsareti) parcalar.push(okunamadiIsareti)
        return
      }
      if (soruldu) {
        const anah = ANAHTAR(p.sayfa, s.no, i)
        const koruma = a.kor[0]
        dogrula.push({ anahtar: anah, sinif: koruma ? 'korumali' : 'kelime', ...(koruma ? { korumaliTur: koruma } : {}), okunan: k.metin, adaylar: k.adaylar, sayfa: p.sayfa, kutu: k.kutu || s.kutu, satirNo: s.no, kelimeNo: i, baglam: s.ham })
        parcalar.push(`⟦${anah}|${k.metin.replace(/[⟦⟧|]/g, '')}?⟧`)
        return
      }
      // a clinical word beyond the budget: shown flagged when at least two reads give it; a reading only one read gave is
      // not shown at all (it may be the model's guess) — marked, its candidates stay in the data
      butceDisi++
      if (x.oylar[i] >= 2) parcalar.push(`${k.metin}(?)`)
      else if (parcalar[parcalar.length - 1] !== okunamadiIsareti) parcalar.push(okunamadiIsareti)
    })
    girdiSatirlari.push({ no: s.no, metin: `${x.etiket ? `${x.etiket}: ` : ''}${parcalar.join(' ')}` })
  })
  for (const c of cizimSorulan) {
    const r = durumlar.find((d) => d.id === c.bolgeId)!
    dogrula.push({ anahtar: `s${p.sayfa}-b${c.bolgeId}`, sinif: 'cizim', okunan: c.bulgu, adaylar: [c.bulgu], sayfa: p.sayfa, kutu: r.kutu, bolgeId: c.bolgeId, baglam: r.etiket })
  }

  const satirlar = ic.map((x) => x.satir)
  const bag = new Set([...b.dil.bagSozcukleri.map(kelimeAnahtari), kelimeAnahtari(okunamadiIsareti)])
  let normaller = new Map<number, string>()
  if (girdiSatirlari.length) {
    const mesaj = `LEXICON (abbreviation = meaning):\n${sozlukBlogu(b.sozluk)}\n\nLINES:\n${girdiSatirlari.map((s) => `${s.no}: ${s.metin}`).join('\n')}`
    for (let deneme = 0; deneme < 2; deneme++) {
      okumaSayisi++
      try {
        const ham = await model.metinJson({ sistem: NORMAL_KURALLARI(b.dil.dilAdi, b.bransAdi), mesaj, azamiToken: deneme === 0 ? 4000 : 8000, etiket: 'el-notu-normal' })
        const liste = Array.isArray((ham as { satirlar?: unknown })?.satirlar) ? (ham as { satirlar: { no: unknown; normal: unknown }[] }).satirlar : []
        normaller = new Map(liste.map((x) => [Number(x.no), String(x.normal ?? '')]))
        break
      } catch { normaller = new Map() }
    }
  }
  for (const s of satirlar) {
    const girdi = girdiSatirlari.find((g) => g.no === s.no)!.metin
    const model_ = normaller.get(s.no)
    const denetli = model_ ? uydurmaDenetimi(girdi, model_, b.sozluk, bag) : null
    // the "(?)" flags and "[okunamadı]" marks must survive normalisation
    const isaretler = (girdi.match(/\(\?\)/g) || []).length + (girdi.split(okunamadiIsareti).length - 1)
    const korunan = denetli && (denetli.match(/\(\?\)/g) || []).length + (denetli.split(okunamadiIsareti).length - 1) >= isaretler ? denetli : null
    s.normal = korunan ?? deterministikNormal(girdi, b.sozluk)
  }

  // unknown abbreviations → asked once per doctor, only while the page's budget allows
  for (const s of satirlar) for (const [i, k] of s.kelimeler.entries()) {
    if (kalan <= 0) break
    if (!k.kabul) continue
    const t = k.metin.replace(/[,;:]+$/, '')
    if (yasCinsiyet(b.sozluk, t)) continue
    if (!bilinmeyenKisaltmaMi(b.sozluk, t, b.sozcukMu)) continue
    const anah = `kis-${kelimeAnahtari(t).slice(0, 40)}`
    if (b.sorulmusKisaltmalar.has(anah) || dogrula.some((d) => d.anahtar === anah)) continue
    dogrula.push({ anahtar: anah, sinif: 'kisaltma', okunan: t, adaylar: [], sayfa: p.sayfa, kutu: k.kutu || s.kutu, satirNo: s.no, kelimeNo: i, baglam: s.ham })
    kalan--
  }
  return { sayfa: p.sayfa, sablonId: p.sablonId, satirlar, cizimler, dogrula, okumaSayisi, hafizaOrnegi: ornekler.length, butceDisi, okunamadi }
}

const ANAHTAR = (sayfa: number, satir: number, kelime?: number) => (kelime === undefined ? `s${sayfa}-l${satir}` : `s${sayfa}-l${satir}-w${kelime}`)
export const YER_TUTUCU = /⟦([a-z0-9-]+)(?:\|[^⟧]*)?⟧/g

/**
 * Normalisation guard: every word of `normal` must come from the literal line, from a lexicon expansion of one of its
 * tokens, or be a fact-free connective of the language; every number must be in the literal line; every ⟦key⟧ token of
 * the input must be kept. Returns the normalised text when it passes, else null (the caller uses the deterministic expansion).
 */
export function uydurmaDenetimi(girdi: string, normal: string, sozluk: Sozluk, bag: Set<string>): string | null {
  const tokenlar = [...girdi.matchAll(YER_TUTUCU)].map((m) => m[1])
  for (const t of tokenlar) if (!normal.includes(`⟦${t}`)) return null
  const govde = (s: string) => s.replace(YER_TUTUCU, ' ')
  const kaynak = govde(girdi)
  const acilim = genislet(sozluk, kaynak)
  const izinli = new Set<string>()
  for (const w of `${kaynak} ${acilim.metin}`.split(/[^\p{L}\p{N}]+/u)) { const k = kelimeAnahtari(w); if (k) izinli.add(k) }
  const sayilar = new Set((kaynak.match(/\d+([.,]\d+)?/g) || []).map((x) => x.replace(',', '.')))
  for (const n of govde(normal).match(/\d+([.,]\d+)?/g) || []) if (!sayilar.has(n.replace(',', '.'))) return null
  for (const w of govde(normal).split(/[^\p{L}\p{N}]+/u)) {
    const k = kelimeAnahtari(w)
    if (!k || /^\d/.test(k) || izinli.has(k) || bag.has(k)) continue
    // an inflected form of a source / expansion word (Turkish suffixes, English plurals): shared stem ≥ 4 and similar
    let ok = false
    for (const z of izinli) { if (z.length >= 4 && k.length >= 4 && (k.startsWith(z.slice(0, Math.max(4, z.length - 2))) || z.startsWith(k.slice(0, Math.max(4, k.length - 2)))) ) { ok = true; break } if (benzerlik(k, z) >= 0.75) { ok = true; break } }
    if (!ok) return null
  }
  return normal.replace(/\s+/g, ' ').trim()
}

/** Lexicon expansion outside the placeholders (the guard's fallback; adds nothing the line does not carry). */
export function deterministikNormal(girdi: string, sozluk: Sozluk): string {
  const parcalar = girdi.split(/(⟦[^⟧]*⟧)/g)
  return parcalar.map((x) => {
    if (x.startsWith('⟦')) return x
    const bas = /^\s/.test(x) ? ' ' : '', son = /\s$/.test(x) ? ' ' : ''
    const g = genislet(sozluk, x).metin
    return g ? bas + g + son : x
  }).join('').replace(/\s+/g, ' ').trim()
}

/** Source text of a whole reading: lines in order, then the drawing findings per region with the template side. */
export function kaynakMetni(sayfalar: Pick<SayfaOkuma, 'sayfa' | 'satirlar' | 'cizimler' | 'dogrula'>[], dil: OkuyucuDili, bolgeEtiketi: (id: string) => string): string {
  const taraf = (t: CizimBulgusu['taraf']) => (t === 'sag' ? dil.taraf.sag : t === 'sol' ? dil.taraf.sol : t === 'iki' ? dil.taraf.iki : '')
  const out: string[] = []
  for (const s of sayfalar) {
    for (const l of s.satirlar) if (l.normal.trim()) out.push(l.normal.trim())
    const bulgular = s.cizimler.map((c) => {
      const t = taraf(c.taraf)
      const metin = c.kabul ? c.bulgu : c.belirsiz ? `${c.bulgu} (?)` : `⟦s${s.sayfa}-b${c.bolgeId}|${c.bulgu.replace(/[⟦⟧|]/g, '')}?⟧`
      return `- ${[t, bolgeEtiketi(c.bolgeId)].filter(Boolean).join(' ')}: ${metin}`
    })
    if (bulgular.length) out.push(`${dil.cizimBasligi}:`, ...bulgular)
  }
  return out.join('\n')
}

export function okumaIstatistigi(sayfalar: SayfaSonucu[]): KaynakOkuma['istatistik'] {
  const kel = sayfalar.flatMap((s) => s.satirlar.flatMap((l) => l.kelimeler))
  return {
    kelime: kel.length,
    kabul: kel.filter((k) => k.kabul).length,
    dogrula: sayfalar.reduce((t, s) => t + s.dogrula.length, 0),
    korumaliAcik: sayfalar.reduce((t, s) => t + s.dogrula.filter((d) => d.sinif === 'korumali').length, 0),
    hafizaOrnegi: sayfalar.reduce((t, s) => t + s.hafizaOrnegi, 0),
    okumaSayisi: sayfalar.reduce((t, s) => t + s.okumaSayisi, 0),
  }
}

/** Replace answered placeholders in a text (source text or a draft note section). Unanswered ones stay. */
export function yerTutuculariDoldur(metin: string, cevaplar: Map<string, string>): string {
  return metin.replace(YER_TUTUCU, (tam, anah: string) => (cevaplar.has(anah) ? cevaplar.get(anah)! : tam))
}

/** Keys of the placeholders still open in a text. */
export function acikYerTutucular(metin: string | null | undefined): string[] {
  return [...String(metin || '').matchAll(YER_TUTUCU)].map((m) => m[1])
}

/** Where each line of `kaynakMetni` came from (same order): page + box, for "tap a sentence → its crop". */
export function metinSatirKonumlari(sayfalar: Pick<SayfaOkuma, 'sayfa' | 'satirlar' | 'cizimler' | 'maskeliBelgeId'>[]): ({ sayfa: number; kutu: Kutu; maskeliBelgeId?: string } | null)[] {
  const out: ({ sayfa: number; kutu: Kutu; maskeliBelgeId?: string } | null)[] = []
  for (const s of sayfalar) {
    for (const l of s.satirlar) if (l.normal.trim()) out.push({ sayfa: s.sayfa, kutu: l.kutu, maskeliBelgeId: s.maskeliBelgeId })
    if (s.cizimler.length) {
      out.push(null)
      for (const c of s.cizimler) out.push(c.kutu ? { sayfa: s.sayfa, kutu: c.kutu, maskeliBelgeId: s.maskeliBelgeId } : null)
    }
  }
  return out
}
