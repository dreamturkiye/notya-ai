/**
 * DIKTE-TIBBI-01 (KBB feedback, 2026-11-21) — deterministic medical post-correction of a dictated transcript.
 *
 * A browser / Scribe transcript of a KBB exam came back as "tem panik membran intak … Araf Fenk … Wirthon ofisleri …
 * ortaya atışlardan … Mopar ilerliyor … orta conta". This module repairs such a transcript BEFORE the note is
 * generated, with no model call and no network: it runs in a few milliseconds, on the server (session end, audio
 * upload) and in the browser (each dictated chunk).
 *
 * Three passes, most trusted first:
 *   1. the doctor's own pairs (learned from his corrections, or typed by him) — exact phrase match;
 *   2. the branş's curated known-error rules — exact phrase match, optionally only next to context words;
 *   3. fuzzy single-term repair against the branş lexicon (and, only next to a dose / form word, the SGK drug list):
 *      a token or a run of 2–3 tokens that is NOT a real word is replaced by the one lexicon term within a small,
 *      length-scaled edit distance — never when two terms tie, never a real word, never a protected word
 *      (laterality, negation, numbers, units: `KORUNAN`), never a token with a digit.
 *
 * Conservative by design: it repairs how a term was HEARD; it never adds, removes or changes a finding. The caller
 * keeps the untouched transcript (sessions.transcript_raw) and the list of changes.
 *
 * NOT used by Ayşe's voice / assistant path (founder lock, .cursor/rules/ses-omurga-kilidi.mdc).
 */
import { EKLER, ILAC_BAGLAMI, KORUNAN, YAYGIN } from './yaygin'

// ── folding ─────────────────────────────────────────────────────────────────────────────────────────────────────

const HARF: Record<string, string> = {
  'İ': 'i', 'I': 'i', 'ı': 'i', 'Ş': 's', 'ş': 's', 'Ğ': 'g', 'ğ': 'g', 'Ç': 'c', 'ç': 'c', 'Ö': 'o', 'ö': 'o', 'Ü': 'u', 'ü': 'u',
  'Â': 'a', 'â': 'a', 'Î': 'i', 'î': 'i', 'Û': 'u', 'û': 'u', '’': "'",
}

/** Character-for-character fold (same length as the input): lower case, Turkish letters to ASCII. */
export function katla(s: string): string {
  let o = ''
  for (const ch of s) o += HARF[ch] ?? ch.toLowerCase()
  return o
}

/** Comparison key: folded, apostrophes/hyphens dropped, w→v, x→ks, q→k (how an ASR engine spells Turkish sounds). */
export function anahtar(s: string): string {
  return katla(s).replace(/['\-]/g, '').replace(/w/g, 'v').replace(/x/g, 'ks').replace(/q/g, 'k').replace(/\s+/g, ' ').trim()
}

/** Levenshtein with an early exit above `limit`. */
export function mesafe(a: string, b: string, limit = 3): number {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > limit) return limit + 1
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    let best = i
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      if (cur[j] < best) best = cur[j]
    }
    if (best > limit) return limit + 1
    prev = cur
  }
  return prev[b.length]
}

// ── types ───────────────────────────────────────────────────────────────────────────────────────────────────────

/** A curated "heard → meant" rule. `duyulan` entries are phrases (space-separated, any spelling; folded on load). */
export interface BilinenHata {
  duyulan: string[]
  dogru: string
  /** The last heard word may carry a suffix ("atışlardan" for "atış"); it is carried over onto the correct term. */
  ekli?: boolean
  /** Apply only when a word starting with one of these stems is within 8 words (folded stems). */
  baglam?: string[]
}

export interface Sozluk {
  /** Correct spellings: single words or phrases ("timpanik membran", "Wharton"). */
  terimler: string[]
  hatalar: BilinenHata[]
}

export interface KisiselCift { duyulan: string; dogru: string }

/** A compiled single-word target index (lexicon or drugs). */
export interface HedefIndeksi {
  /** first-letter class → targets */
  harf: Map<string, { k: string; g: string }[]>
  /** every known word key (correct already) */
  bilinen: Set<string>
}

export interface DuzeltmeSecenek {
  sozluk: Sozluk
  kisisel?: KisiselCift[]
  ilaclar?: HedefIndeksi | null
}

export interface Degisiklik { once: string; sonra: string; tur: 'kisisel' | 'bilinen' | 'terim' | 'ilac' }
export interface DuzeltmeSonucu { metin: string; degisiklikler: Degisiklik[] }

// ── tokens ──────────────────────────────────────────────────────────────────────────────────────────────────────

interface Parca { t: string; kelime: boolean }
const KELIME_RE = /[\p{L}\p{M}\p{N}]+(?:['’][\p{L}\p{M}]+)*/gu

function parcala(metin: string): Parca[] {
  const out: Parca[] = []
  let son = 0
  for (const m of metin.matchAll(KELIME_RE)) {
    const i = m.index ?? 0
    if (i > son) out.push({ t: metin.slice(son, i), kelime: false })
    out.push({ t: m[0], kelime: true })
    son = i + m[0].length
  }
  if (son < metin.length) out.push({ t: metin.slice(son), kelime: false })
  return out
}

const harfSinifi = (k: string) => {
  const c = k[0] || ''
  return c === 'k' || c === 'c' || c === 'q' ? 'k' : c
}
const rakamli = (s: string) => /\d/.test(s)

/** Sentence start: the previous non-space separator ends a sentence (or there is none). */
function cumleBasi(parcalar: Parca[], i: number): boolean {
  for (let j = i - 1; j >= 0; j--) {
    if (parcalar[j].kelime) return false
    if (/[.!?:\n]/.test(parcalar[j].t)) return true
  }
  return true
}

function buyukBasla(s: string): string { return s ? s[0].toLocaleUpperCase('tr-TR') + s.slice(1) : s }

function bicimle(dogru: string, ilkOrijinal: string, basta: boolean): string {
  const ilk = ilkOrijinal[0] || ''
  return basta && ilk && ilk === ilk.toLocaleUpperCase('tr-TR') && ilk !== ilk.toLocaleLowerCase('tr-TR') ? buyukBasla(dogru) : dogru
}

// ── compile ─────────────────────────────────────────────────────────────────────────────────────────────────────

interface DerlenmisKural { duyulan: string[]; dogru: string; ekli: boolean; baglam: string[]; tur: 'kisisel' | 'bilinen' }

function kuralDerle(duyulan: string, dogru: string, ekli: boolean, baglam: string[], tur: DerlenmisKural['tur']): DerlenmisKural | null {
  const k = anahtar(duyulan).split(' ').filter(Boolean)
  if (!k.length || !dogru.trim()) return null
  return { duyulan: k, dogru: dogru.trim(), ekli, baglam: baglam.map(anahtar), tur }
}

/** Single-word target index from terms (phrases contribute each word of 5+ letters). */
export function hedefIndeksiKur(terimler: Iterable<string>): HedefIndeksi {
  const harf = new Map<string, { k: string; g: string }[]>()
  const bilinen = new Set<string>()
  const ekle = (g: string) => {
    const k = anahtar(g)
    if (!k || k.includes(' ')) return
    bilinen.add(k)
    if (k.length < 5) return
    const s = harfSinifi(k)
    const liste = harf.get(s) || []
    if (!liste.some((x) => x.k === k)) liste.push({ k, g })
    harf.set(s, liste)
  }
  for (const t of terimler) {
    const temiz = String(t || '').trim()
    if (!temiz) continue
    const kelimeler = temiz.split(/\s+/)
    if (kelimeler.length === 1) ekle(temiz)
    else for (const w of kelimeler) { bilinen.add(anahtar(w)); if (anahtar(w).length >= 6) ekle(w) }
  }
  return { harf, bilinen }
}

const sozlukOnbellek = new WeakMap<Sozluk, { kurallar: DerlenmisKural[]; hedef: HedefIndeksi }>()
function sozlukDerle(s: Sozluk) {
  const var_ = sozlukOnbellek.get(s)
  if (var_) return var_
  const kurallar: DerlenmisKural[] = []
  for (const h of s.hatalar) for (const d of h.duyulan) {
    const k = kuralDerle(d, h.dogru, Boolean(h.ekli), h.baglam || [], 'bilinen')
    if (k) kurallar.push(k)
  }
  // curated rules run in the order they are written (a file puts "Wirthon" → "Wharton" before "Wharton ofis" → …)
  const sonuc = { kurallar, hedef: hedefIndeksiKur(s.terimler) }
  sozlukOnbellek.set(s, sonuc)
  return sonuc
}

// ── pass 1 + 2: phrase rules ────────────────────────────────────────────────────────────────────────────────────

interface Durum { parcalar: Parca[]; kelimeIdx: number[]; anahtarlar: string[] }
function durumKur(metin: string): Durum {
  const parcalar = parcala(metin)
  const kelimeIdx: number[] = []
  parcalar.forEach((p, i) => { if (p.kelime) kelimeIdx.push(i) })
  return { parcalar, kelimeIdx, anahtarlar: kelimeIdx.map((i) => anahtar(parcalar[i].t)) }
}
const metne = (d: Durum) => d.parcalar.map((p) => p.t).join('')

/** Replace words w..w+L-1 (and the separators between them) with `sonra`, without re-reading the whole text. */
function degistir(d: Durum, w: number, L: number, sonra: string): Durum {
  const ilkP = d.kelimeIdx[w]
  const sonP = d.kelimeIdx[w + L - 1]
  const yeni = parcala(sonra)
  const parcalar = [...d.parcalar.slice(0, ilkP), ...yeni, ...d.parcalar.slice(sonP + 1)]
  const kelimeIdx: number[] = []
  for (let i = 0; i < parcalar.length; i++) if (parcalar[i].kelime) kelimeIdx.push(i)
  const anahtarlar = [...d.anahtarlar.slice(0, w), ...yeni.filter((p) => p.kelime).map((p) => anahtar(p.t)), ...d.anahtarlar.slice(w + L)]
  return { parcalar, kelimeIdx, anahtarlar }
}

function kurallariUygula(metin: string, kurallar: DerlenmisKural[], degisiklikler: Degisiklik[], kilitli: Set<string>): string {
  let d = durumKur(metin)
  for (const kural of kurallar) {
    const L = kural.duyulan.length
    const r0 = kural.duyulan[0]
    const rSon = kural.duyulan[L - 1]
    let w = 0
    while (w + L <= d.kelimeIdx.length) {
      const { parcalar, kelimeIdx, anahtarlar } = d
      let tamam = anahtarlar[w] === r0 || (L === 1 && kural.ekli && anahtarlar[w].startsWith(r0) && anahtarlar[w].length - r0.length <= 7)
      for (let j = 1; tamam && j < L; j++) {
        const a = anahtarlar[w + j]
        const r = kural.duyulan[j]
        if (a === r) continue
        if (j === L - 1 && kural.ekli && a.startsWith(r) && a.length - r.length <= 7) continue
        tamam = false
      }
      const ilkP = kelimeIdx[w]
      const sonP = kelimeIdx[w + L - 1]
      // words of a phrase must be separated by whitespace only (not a sentence break)
      if (tamam && parcalar.slice(ilkP, sonP + 1).some((p) => !p.kelime && !/^\s+$/.test(p.t))) tamam = false
      if (tamam && kural.baglam.length) {
        const pencere = anahtarlar.slice(Math.max(0, w - 8), w + L + 8)
        if (!pencere.some((a) => kural.baglam.some((b) => a.startsWith(b)))) tamam = false
      }
      // an ekli rule whose heard stem is a prefix of the correct term must not re-fire on corrected text
      if (tamam && anahtarlar.slice(w, w + L).join(' ').startsWith(anahtar(kural.dogru))) tamam = false
      if (!tamam) { w += 1; continue }
      const sonAnahtar = anahtarlar[w + L - 1]
      const ek = kural.ekli && sonAnahtar.length > rSon.length ? suffixFrom(parcalar[sonP].t.replace(/['’]/g, ''), sonAnahtar, rSon) : ''
      const once = parcalar.slice(ilkP, sonP + 1).map((p) => p.t).join('')
      const sonra = bicimle(kural.dogru, parcalar[ilkP].t, cumleBasi(parcalar, ilkP)) + ek
      if (anahtar(once) !== anahtar(sonra)) degisiklikler.push({ once, sonra, tur: kural.tur })
      for (const k of sonra.split(/\s+/)) kilitli.add(anahtar(k))
      d = degistir(d, w, L, sonra)
      w += sonra.split(/\s+/).length
    }
  }
  return metne(d)
}

/** The original spelling of the suffix: `anahtar` drops apostrophes/hyphens, so walk the original by folded length. */
function suffixFrom(orijinal: string, ak: string, kok: string): string {
  // anahtar() can change length only through x→ks (rare in Turkish); fall back to the folded suffix then.
  const katli = katla(orijinal).replace(/['\-]/g, '')
  if (katli.length === ak.length) return orijinal.replace(/['’\-]/g, '').slice(kok.length)
  return ak.slice(kok.length)
}

// ── pass 3: fuzzy single-term repair ────────────────────────────────────────────────────────────────────────────

function tolerans(uzunluk: number, n: number): number {
  if (n > 1) return uzunluk >= 10 ? 2 : 1
  if (uzunluk <= 7) return 1
  if (uzunluk <= 11) return 2
  return 3
}

function enYakin(kaynak: string, hedef: HedefIndeksi, n: number): { g: string; d: number; ek: string } | null {
  const adaylar = hedef.harf.get(harfSinifi(kaynak))
  if (!adaylar) return null
  // the source as said, then with one suffix taken off (the suffix goes back on afterwards)
  const bicimler: { kok: string; ek: string }[] = [{ kok: kaynak, ek: '' }]
  for (const e of EKLER) if (kaynak.length - e.length >= 5 && kaynak.endsWith(e)) bicimler.push({ kok: kaynak.slice(0, -e.length), ek: e })
  let en: { g: string; d: number; ek: string } | null = null
  let ikinci = Infinity
  for (const { kok, ek } of bicimler) {
    for (const a of adaylar) {
      const tol = tolerans(a.k.length, n)
      if (Math.abs(a.k.length - kok.length) > tol) continue
      const d = mesafe(kok, a.k, tol)
      if (d > tol) continue
      if (!en || d < en.d) { if (en && en.g !== a.g) ikinci = Math.min(ikinci, en.d); en = { g: a.g, d, ek } }
      else if (a.g !== en.g) ikinci = Math.min(ikinci, d)
    }
  }
  if (!en || ikinci <= en.d) return null // a tie between two different terms: leave it to the doctor
  return en
}

function gercekKelime(k: string, bilinenler: Set<string>[]): boolean {
  if (YAYGIN.has(k) || KORUNAN.has(k)) return true
  for (const b of bilinenler) if (b.has(k)) return true
  // a known word with a suffix ("membranlar", "kulakta")
  for (const e of EKLER) {
    if (k.length - e.length < 3 || !k.endsWith(e)) continue
    const kok = k.slice(0, -e.length)
    if (YAYGIN.has(kok) || KORUNAN.has(kok)) return true
    for (const b of bilinenler) if (b.has(kok)) return true
  }
  return false
}

function bulanikUygula(metin: string, hedef: HedefIndeksi, ilac: HedefIndeksi | null | undefined, degisiklikler: Degisiklik[], kilitli: Set<string>): string {
  let d = durumKur(metin)
  const bilinenler = [hedef.bilinen, ...(ilac ? [ilac.bilinen] : []), kilitli]
  const gercek = new Map<string, boolean>()
  const gercekMi = (k: string) => { let v = gercek.get(k); if (v === undefined) { v = gercekKelime(k, bilinenler); gercek.set(k, v) } return v }
  for (let w = 0; w < d.kelimeIdx.length; w++) {
    for (let n = 3; n >= 1; n--) {
      const { parcalar, kelimeIdx, anahtarlar } = d
      if (w + n > kelimeIdx.length) continue
      const ilkP = kelimeIdx[w]
      const sonP = kelimeIdx[w + n - 1]
      const parcaAnahtar = anahtarlar.slice(w, w + n)
      if (kelimeIdx.slice(w, w + n).some((i) => rakamli(parcalar[i].t))) continue
      if (parcaAnahtar.some((k) => KORUNAN.has(k) || kilitli.has(k))) continue
      if (n > 1 && parcalar.slice(ilkP, sonP + 1).some((p) => !p.kelime && !/^[ \t]+$/.test(p.t))) continue
      const kaynak = parcaAnahtar.join('')
      if (n === 1) {
        if (kaynak.length < 5 || gercekMi(kaynak)) continue
      } else if (!parcaAnahtar.some((k) => (k.length <= 3 && !YAYGIN.has(k)) || !gercekMi(k))) {
        // joining only repairs a term split into fragments ("tem panik", "hiper amik")
        continue
      }
      let sonuc = enYakin(kaynak, hedef, n)
      let tur: Degisiklik['tur'] = 'terim'
      if (!sonuc && ilac && n <= 2) {
        // drug names: only next to a dose / form / prescribing word or a number
        const pencere = kelimeIdx.slice(Math.max(0, w - 3), w + n + 3).map((i) => parcalar[i].t)
        if (pencere.some((t) => rakamli(t) || ILAC_BAGLAMI.has(anahtar(t)))) {
          sonuc = enYakin(kaynak, ilac, n)
          tur = 'ilac'
        }
      }
      if (!sonuc) continue
      const once = parcalar.slice(ilkP, sonP + 1).map((p) => p.t).join('')
      const sonra = bicimle(sonuc.g, parcalar[ilkP].t, cumleBasi(parcalar, ilkP)) + sonuc.ek
      if (anahtar(once) === anahtar(sonra)) continue
      degisiklikler.push({ once, sonra, tur })
      kilitli.add(anahtar(sonra))
      d = degistir(d, w, n, sonra)
      break
    }
  }
  return metne(d)
}

// ── entry point ─────────────────────────────────────────────────────────────────────────────────────────────────

const ESIK_KARAKTER = 200_000

/** Repair a dictated transcript. Pure; the input is never mutated. */
export function tibbiDuzelt(metin: string, s: DuzeltmeSecenek): DuzeltmeSonucu {
  const degisiklikler: Degisiklik[] = []
  if (!metin || !metin.trim() || metin.length > ESIK_KARAKTER) return { metin, degisiklikler }
  const { kurallar, hedef } = sozlukDerle(s.sozluk)
  const kilitli = new Set<string>()
  let cur = metin
  const kisisel = (s.kisisel || [])
    .map((c) => kuralDerle(c.duyulan, c.dogru, anahtar(c.duyulan).split(' ').pop()!.length >= 5, [], 'kisisel'))
    .filter((k): k is DerlenmisKural => Boolean(k))
    .sort((a, b) => b.duyulan.length - a.duyulan.length)
  if (kisisel.length) cur = kurallariUygula(cur, kisisel, degisiklikler, kilitli)
  cur = kurallariUygula(cur, kurallar, degisiklikler, kilitli)
  // the doctor's own correct terms are lexicon terms too
  const hedefTam = (s.kisisel || []).length ? birlesikHedef(hedef, s.kisisel!.map((c) => c.dogru)) : hedef
  cur = bulanikUygula(cur, hedefTam, s.ilaclar, degisiklikler, kilitli)
  return { metin: cur, degisiklikler }
}

function birlesikHedef(h: HedefIndeksi, ek: string[]): HedefIndeksi {
  const e = hedefIndeksiKur(ek)
  const harf = new Map(h.harf)
  for (const [k, v] of e.harf) harf.set(k, [...(harf.get(k) || []), ...v.filter((x) => !(harf.get(k) || []).some((y) => y.k === x.k))])
  return { harf, bilinen: new Set([...h.bilinen, ...e.bilinen]) }
}

/** Two lexicons as one (core + branş). */
export function sozlukBirlestir(...s: Sozluk[]): Sozluk {
  return { terimler: s.flatMap((x) => x.terimler), hatalar: s.flatMap((x) => x.hatalar) }
}
