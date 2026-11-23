/**
 * ESNEK-MUAYENE-A — El Notu Okuyucu: the reading orchestration (pure; the model is injected).
 *
 * Per page (only MASKED pixels ever reach this module — the device masked them, see gizlilik.ts):
 *  1. two independent literal reads of every line (read A: high-resolution contrast-normalised crops + the doctor's own
 *     confirmed crops as in-context examples; read B: different crops with more context, other preprocessing, reverse
 *     order, no examples) — words with a 0..1 confidence and alternatives;
 *  2. self-consistency (uzlastir.ts) + re-ranking with the doctor's memory and vocabulary (hafiza.ts);
 *  3. protected classes (korumali.ts): right/left, negation, numbers, doses, drugs, allergies need a reading confirmation
 *     unless both reads agree at high confidence;
 *  4. drawings (cizim.ts): marked regions only; side from the template;
 *  5. clinical normalisation with the doctor's lexicon + branş seed + general seed; checked against a deterministic
 *     expansion so that it can never add a fact the page does not carry (uydurmaDenetimi) — else the line falls back;
 *  6. everything not accepted becomes a Doğrula question carrying its crop box; the text keeps a ⟦key⟧ placeholder.
 *
 * Prompts are English (country-neutral); the handwriting language and branş are parameters.
 */
import type { CizimBolgesi, CizimBulgusu, DogrulaSorusu, HafizaOrnegi, HamKelime, HamSatir, KaliteKarari, KaynakOkuma, Kutu, OkunanKelime, SatirOkuma, SayfaOkuma } from './tipler'
import { uzlastir, benzerlik, kelimeAnahtari } from './uzlastir'
import { benzerOrnekler, yenidenSirala } from './hafiza'
import { satirKorumali, kabulEdilirMi, type IlacEslesmesi } from './korumali'
import { bilinmeyenKisaltmaMi, genislet, sozlukBlogu, yasCinsiyet, type Sozluk } from './sozluk'
import { bulgulariDogrula, isaretliMi, type BolgeDurumu } from './cizim'

export type GorselBlok = { mime: string; base64: string }
export type IstemParcasi = { tur: 'metin'; metin: string } | { tur: 'gorsel'; gorsel: GorselBlok }

/** The model path, injected (server: lib/ai/cagir.ts via lib/elNotu/model.ts; harness: the same or a recorded replay). */
export type ModelKapisi = {
  gorselJson(o: { sistem: string; parcalar: IstemParcasi[]; azamiToken: number; etiket: string }): Promise<unknown>
  metinJson(o: { sistem: string; mesaj: string; azamiToken: number; etiket: string }): Promise<unknown>
}

export type SatirPaketi = {
  no: number
  kutu: Kutu
  kelimeler: Kutu[]
  tanimlar: ({ v: number[]; enBoy: number } | null)[]
  gorselA: GorselBlok
  gorselB: GorselBlok
  bolgeId?: string | null
}

export type BolgePaketi = CizimBolgesi & { murekkep: number; gorsel?: GorselBlok | null }

export type SayfaPaketi = {
  sayfa: number
  sablonId: string | null
  kalite: KaliteKarari
  satirlar: SatirPaketi[]
  bolgeler: BolgePaketi[]
}

export type OkuyucuDili = {
  /** Language of the handwriting, in English ("Turkish"). */
  dilAdi: string
  /** Heading for drawing findings in the source text ("Çizim bulguları"). */
  cizimBasligi: string
  taraf: { sag: string; sol: string; iki: string }
  /** Words the normaliser may add that carry no clinical fact (conjunctions, "yok" for Ø …), folded. */
  bagSozcukleri: string[]
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
  /** Is this a common word of the language (not an abbreviation)? */
  sozcukMu: (t: string) => boolean
}

const OKUMA_KURALLARI = (dilAdi: string, brans: string) => `You transcribe a physician's HANDWRITTEN clinical notes, ${dilAdi}, specialty: ${brans}.
You see one image per line, labelled L<n>. Each image is a horizontal strip; transcribe ONLY the central line of handwriting in it.
Rules:
- Literal transcription: write exactly what is written, letter by letter, in the order written. Keep the doctor's abbreviations, symbols (Ø, ∅, +, -, ↑, ↓, →, ?, =, /), numbers and punctuation as written. Do NOT expand, correct, translate or complete anything.
- Every word gets "g": your confidence 0..1 that you read it correctly, and "alt": up to 3 alternative readings when unsure.
- If a word or part is unreadable write "?" for it with g <= 0.2. Never guess a drug name, a number, a dose or a side (right/left) — if unsure, give low g and alternatives.
- Crossed-out words: omit them.
- Return ONLY JSON: {"satirlar":[{"no":<n>,"kelimeler":[{"m":"<word>","g":0.0,"alt":["..."]}],"okunamadi":false}]}`

const CIZIM_KURALLARI = (dilAdi: string, brans: string) => `You look at regions of a printed ${brans} examination form on which a physician marked findings with a pen (${dilAdi}).
For each region image (labelled with its id and anatomy) describe ONLY the physician's pen marks: a letter "N" (normal), a circle, hatching, an arrow, a line, a dot, and any handwritten words in or pointing into the region.
Rules:
- Describe what is marked, in ${dilAdi}, in clinical words, short. Never invent a finding that is not drawn or written. Printed drawing lines are not findings.
- Do not state the side (right/left): the form decides it.
- If a region has no pen mark, return nothing for it.
- Return ONLY JSON: {"bulgular":[{"bolgeId":"<id>","bulgu":"<short finding>","isaret":"yazi|ok|daire|tarama|cizgi|normal_isareti|nokta","g":0.0}]}`

const NORMAL_KURALLARI = (dilAdi: string, brans: string) => `You normalise a physician's literal handwritten clinical lines (${dilAdi}, ${brans}) into clean clinical ${dilAdi}.
Rules:
- Expand abbreviations ONLY with the lexicon given (the doctor's own entries win). If an abbreviation is not in the lexicon, keep it as written.
- Fix spelling of words that are obviously the same word; keep the meaning exactly. Do not add, infer or remove any fact: no diagnosis, finding, number, dose, side or negation that is not in the line.
- Tokens like ⟦s1-l3-w2|word?⟧ are unconfirmed readings: copy them EXACTLY as they are, in place.
- One output line per input line, same "no".
- Return ONLY JSON: {"satirlar":[{"no":<n>,"normal":"<text>"}]}`

function satirlariAyikla(ham: unknown): HamSatir[] {
  const liste = Array.isArray((ham as { satirlar?: unknown })?.satirlar) ? (ham as { satirlar: unknown[] }).satirlar : Array.isArray(ham) ? (ham as unknown[]) : []
  const out: HamSatir[] = []
  for (const s of liste as Record<string, unknown>[]) {
    const no = Number(s?.no)
    if (!Number.isFinite(no)) continue
    const kelimeler: HamKelime[] = (Array.isArray(s.kelimeler) ? s.kelimeler : [])
      .map((k: Record<string, unknown>) => ({ m: String(k?.m ?? '').trim(), g: Number(k?.g ?? 0), alt: Array.isArray(k?.alt) ? (k.alt as unknown[]).map(String).filter(Boolean).slice(0, 3) : [] }))
      .filter((k: HamKelime) => k.m)
    out.push({ no, kelimeler, okunamadi: Boolean(s.okunamadi) })
  }
  return out
}

function okumaParcalari(satirlar: SatirPaketi[], hangi: 'A' | 'B', ornekler: HafizaOrnegi[]): IstemParcasi[] {
  const p: IstemParcasi[] = []
  const gorselli = ornekler.filter((o) => o.gorsel)
  if (hangi === 'A' && gorselli.length) {
    p.push({ tur: 'metin', metin: 'Examples of THIS physician\'s handwriting, already confirmed (image → correct text). Use them to recognise his letter shapes and habits:' })
    for (const o of gorselli) { p.push({ tur: 'gorsel', gorsel: o.gorsel! }); p.push({ tur: 'metin', metin: `= "${o.metin}"` }) }
    p.push({ tur: 'metin', metin: 'Now transcribe these lines:' })
  }
  const sira = hangi === 'A' ? satirlar : [...satirlar].reverse()
  for (const s of sira) { p.push({ tur: 'metin', metin: `L${s.no}:` }); p.push({ tur: 'gorsel', gorsel: hangi === 'A' ? s.gorselA : s.gorselB }) }
  return p
}

/** Lines per model call (keeps one call well inside the output budget and the request size). */
export const PARTI_SATIR = 16

async function partilerHalinde<T>(satirlar: SatirPaketi[], f: (parti: SatirPaketi[]) => Promise<T[]>): Promise<T[]> {
  const partiler: SatirPaketi[][] = []
  for (let i = 0; i < satirlar.length; i += PARTI_SATIR) partiler.push(satirlar.slice(i, i + PARTI_SATIR))
  const sonuclar = await Promise.all(partiler.map(f))
  return sonuclar.flat()
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

export type SayfaSonucu = SayfaOkuma & { okumaSayisi: number; hafizaOrnegi: number }

export async function sayfayiOku(p: SayfaPaketi, b: OkuyucuBaglami, model: ModelKapisi): Promise<SayfaSonucu> {
  const tumTanimlar = p.satirlar.flatMap((s) => s.tanimlar.filter(Boolean) as { v: number[]; enBoy: number }[])
  const ornekler = benzerOrnekler(tumTanimlar, b.hafiza, 12)
  const sistemOku = OKUMA_KURALLARI(b.dil.dilAdi, b.bransAdi)
  let okumaSayisi = 0
  const oku = (hangi: 'A' | 'B') => partilerHalinde(p.satirlar, async (parti) => {
    okumaSayisi++
    try {
      return satirlariAyikla(await model.gorselJson({ sistem: sistemOku, parcalar: okumaParcalari(parti, hangi, ornekler), azamiToken: 6000, etiket: `el-notu-okuma-${hangi}` }))
    } catch { return [] }
  })
  const [okA, okB] = await Promise.all([oku('A'), oku('B')])
  const harita = (l: HamSatir[]) => new Map(l.map((s) => [s.no, s]))
  const hA = harita(okA), hB = harita(okB)

  const dogrula: DogrulaSorusu[] = []
  const satirlar: SatirOkuma[] = []
  for (const s of p.satirlar) {
    const birlesik = uzlastir(hA.get(s.no) || null, hB.get(s.no) || null)
    const korumali = satirKorumali(birlesik.map((k) => k.metin), b.ilac)
    const kelimeler: OkunanKelime[] = birlesik.map((k, i) => {
      const tanim = s.tanimlar.length === birlesik.length ? s.tanimlar[i] : null
      const r = yenidenSirala({ metin: k.metin, guven: k.guven, adaylar: k.adaylar, tanim }, b.dagarcik, b.hafiza)
      const ilac = korumali[i].includes('ilac') && b.ilac ? b.ilac(r.metin) : null
      const kutu = s.kelimeler.length === birlesik.length ? s.kelimeler[i] : s.kutu
      const okunamaz = r.metin === '?' || /^\?+$/.test(r.metin)
      const kabul = !okunamaz && kabulEdilirMi({ guven: r.guven, uyum: k.uyum || r.hafizadan, korumali: korumali[i], bilinenIlac: ilac?.durum === 'tam' && kelimeAnahtari(ilac.ad) === kelimeAnahtari(r.metin) })
      const adaylar = ilac && ilac.durum === 'yakin' ? [...new Set([r.metin, ilac.ad, ...r.adaylar])] : r.adaylar
      return { metin: r.metin, guven: r.guven, adaylar, uyum: k.uyum, korumali: korumali[i], kabul, kutu, hafizadan: r.hafizadan }
    })
    const ham = kelimeler.map((k) => k.metin).join(' ')
    const acik = kelimeler.map((k, i) => ({ k, i })).filter((x) => !x.k.kabul)
    // a line that is mostly unreadable is asked as one line, not word by word
    if (kelimeler.length === 0 || (acik.length > 6 && acik.length > kelimeler.length * 0.6)) {
      dogrula.push({ anahtar: ANAHTAR(p.sayfa, s.no), sinif: 'kelime', okunan: ham, adaylar: [], sayfa: p.sayfa, kutu: s.kutu, satirNo: s.no, baglam: ham })
    } else for (const { k, i } of acik) {
      const koruma = k.korumali[0]
      dogrula.push({
        anahtar: ANAHTAR(p.sayfa, s.no, i), sinif: koruma ? 'korumali' : 'kelime', ...(koruma ? { korumaliTur: koruma } : {}),
        okunan: k.metin, adaylar: k.adaylar.filter((a) => a && a !== '?'), sayfa: p.sayfa, kutu: k.kutu || s.kutu, satirNo: s.no, kelimeNo: i, baglam: ham,
      })
    }
    satirlar.push({ no: s.no, kutu: s.kutu, kelimeler, ham, normal: ham, bolgeId: s.bolgeId ?? null })
  }

  // drawings: only regions with pen ink or a linked annotation
  let cizimler: CizimBulgusu[] = []
  const durumlar: BolgeDurumu[] = p.bolgeler.map((r) => ({ ...r, bagliSatirlar: satirlar.filter((s) => s.bolgeId === r.id).map((s) => s.no) }))
  const isaretli = durumlar.filter(isaretliMi)
  if (isaretli.length) {
    const parcalar: IstemParcasi[] = []
    for (const r of isaretli) {
      const notlar = satirlar.filter((s) => s.bolgeId === r.id).map((s) => s.ham).join(' / ')
      parcalar.push({ tur: 'metin', metin: `Region ${r.id} (${r.etiket})${notlar ? ` — annotation read near it: "${notlar}"` : ''}:` })
      if (p.bolgeler.find((x) => x.id === r.id)?.gorsel) parcalar.push({ tur: 'gorsel', gorsel: p.bolgeler.find((x) => x.id === r.id)!.gorsel! })
    }
    okumaSayisi++
    try { cizimler = bulgulariDogrula(await model.gorselJson({ sistem: CIZIM_KURALLARI(b.dil.dilAdi, b.bransAdi), parcalar, azamiToken: 3000, etiket: 'el-notu-cizim' }), durumlar) } catch { cizimler = [] }
    for (const c of cizimler) if (!c.kabul) {
      const r = durumlar.find((d) => d.id === c.bolgeId)!
      dogrula.push({ anahtar: `s${p.sayfa}-b${c.bolgeId}`, sinif: 'cizim', okunan: c.bulgu, adaylar: [c.bulgu], sayfa: p.sayfa, kutu: r.kutu, bolgeId: c.bolgeId, baglam: r.etiket })
    }
  }

  // normalisation (lexicon), with the ⟦key|reading?⟧ placeholders for every open word
  const acikAnahtarlar = new Set(dogrula.map((d) => d.anahtar))
  const girdiSatirlari = satirlar.map((s) => {
    if (acikAnahtarlar.has(ANAHTAR(p.sayfa, s.no))) return { no: s.no, metin: `⟦${ANAHTAR(p.sayfa, s.no)}|${s.ham.replace(/[⟦⟧|]/g, '')}?⟧` }
    return { no: s.no, metin: s.kelimeler.map((k, i) => (k.kabul ? k.metin : `⟦${ANAHTAR(p.sayfa, s.no, i)}|${k.metin.replace(/[⟦⟧|]/g, '')}?⟧`)).join(' ') }
  })
  const bag = new Set(b.dil.bagSozcukleri.map(kelimeAnahtari))
  let normaller = new Map<number, string>()
  if (girdiSatirlari.length) {
    okumaSayisi++
    try {
      const ham = await model.metinJson({
        sistem: NORMAL_KURALLARI(b.dil.dilAdi, b.bransAdi),
        mesaj: `LEXICON (abbreviation = meaning):\n${sozlukBlogu(b.sozluk)}\n\nLINES:\n${girdiSatirlari.map((s) => `${s.no}: ${s.metin}`).join('\n')}`,
        azamiToken: 4000, etiket: 'el-notu-normal',
      })
      const liste = Array.isArray((ham as { satirlar?: unknown })?.satirlar) ? (ham as { satirlar: { no: unknown; normal: unknown }[] }).satirlar : []
      normaller = new Map(liste.map((x) => [Number(x.no), String(x.normal ?? '')]))
    } catch { normaller = new Map() }
  }
  for (const s of satirlar) {
    const girdi = girdiSatirlari.find((g) => g.no === s.no)!.metin
    const model_ = normaller.get(s.no)
    const denetli = model_ ? uydurmaDenetimi(girdi, model_, b.sozluk, bag) : null
    s.normal = denetli ?? deterministikNormal(girdi, b.sozluk)
  }

  // unknown abbreviations → asked once per doctor
  for (const s of satirlar) for (const [i, k] of s.kelimeler.entries()) {
    if (!k.kabul) continue
    const t = k.metin.replace(/[,;:]+$/, '')
    if (yasCinsiyet(b.sozluk, t)) continue
    if (!bilinmeyenKisaltmaMi(b.sozluk, t, b.sozcukMu)) continue
    const anah = `kis-${kelimeAnahtari(t).slice(0, 40)}`
    if (b.sorulmusKisaltmalar.has(anah) || dogrula.some((d) => d.anahtar === anah)) continue
    dogrula.push({ anahtar: anah, sinif: 'kisaltma', okunan: t, adaylar: [], sayfa: p.sayfa, kutu: k.kutu || s.kutu, satirNo: s.no, kelimeNo: i, baglam: s.ham })
  }
  return { sayfa: p.sayfa, sablonId: p.sablonId, satirlar, cizimler, dogrula, okumaSayisi, hafizaOrnegi: ornekler.length }
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
      const metin = c.kabul ? c.bulgu : `⟦s${s.sayfa}-b${c.bolgeId}|${c.bulgu.replace(/[⟦⟧|]/g, '')}?⟧`
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
