/**
 * ESNEK-GELISIM (Kaan, 2026-11-24) — the consented regression set's ground truth (pure). From the doctor's APPROVED note
 * and the confirmed reading of each page (every Doğrula answered), derive the clinical facts of each page in the format the
 * El Notu scoring core reads (core/elNotu/degerlendirme.ts `DegerlendirmeGercegi`). No identity: a fact carrying an
 * identity-shaped string (national id, phone, e-mail, identity labels), a name part of the patient, or a full date is
 * dropped; dates never become keys. Country-neutral: the expander, the patient's name parts and the side / negation words
 * are injected or language data.
 *
 * Which facts belong to which page:
 *  - one hand-note source of one page and no other source of the note (`tekSayfa`): every fact of the note's four sections;
 *  - otherwise: a note fact belongs to the page whose confirmed reading carries the same finding (content overlap ≥ 0.5);
 *    a fact found on no page (it came from the transcript or the doctor typed it) is not a page fact.
 */
import type { DegerlendirmeGercegi } from './degerlendirme'
import { olgulariCikar, kavramBenzerligi, type Genisletici, type Olgu } from '@/core/esnek/olgu'
import { dolguMu, gunAnahtari, katla, kelimeler } from '@/core/esnek/metinAraclari'

export const AZAMI_GERCEK = 40
/** A page with fewer facts than this teaches the regression set nothing (and is not kept). */
export const ASGARI_GERCEK = 3

const TC = /\b\d{11}\b/
const UZUN_SAYI = /\d[\d\s.\-/]{8,}\d/
const EPOSTA = /[^\s@]+@[^\s@]+\.[^\s@]+/
const KIMLIK_SOZ = /\b(tc|t\.c\.|kimlik|protokol\s*no|dosya\s*no|hasta\s*adı|adı\s*soyadı|doğum\s*tarihi|telefon|adres|nhs|medicare|ssn|pinfl)\b/i
/** Full or partial calendar dates (12.12, 12.12.2026, 12/12/26, 2026-12-12). */
const TARIH = /\b(\d{1,2}[./]\d{1,2}(?:[./]\d{2,4})?|\d{4}-\d{2}-\d{2})\b/g

export function kimlikTasiyorMu(metin: string, adlar: string[] = []): boolean {
  const t = String(metin || '')
  if (TC.test(t) || UZUN_SAYI.test(t) || EPOSTA.test(t) || KIMLIK_SOZ.test(t)) return true
  if (adlar.length) {
    const ad = new Set(adlar.map((a) => katla(a).trim()).filter((a) => a.length >= 2))
    if (kelimeler(t).some((w) => ad.has(katla(w)))) return true
  }
  return false
}

const SAG = ['sağ', 'sag', 'sağda', 'sağa']
const SOL = ['sol', 'solda', 'sola']
const IKI = ['bilateral', 'bilat', 'iki taraf']
const OLUMSUZ = ['yok', 'Ø', 'negatif', 'saptanmadı', 'izlenmedi']
const SAG_K = new Set(['sag', 'sagda', 'saga', 'sagdan', 'sagi'])
const SOL_K = new Set(['sol', 'solda', 'sola', 'soldan', 'solu'])
const IKI_K = new Set(['bilateral', 'bilat', 'iki', 'ikitarafli'])
const OLUMSUZ_K = new Set(['yok', 'yoktur', 'negatif', 'saptanmadi', 'izlenmedi', 'degil', 'olmayan'])
const tarihsiz = (t: string) => t.replace(TARIH, ' ')

/**
 * Key groups of one fact: abbreviations (with their expansion as an alternative), up to 3 distinctive content words, its
 * numbers (never a date), its side, its negation.
 */
export function gercekAnahtarlari(o: Olgu, genislet: Genisletici = (x) => x): { anahtarlar: string[][]; korumali: boolean } {
  const metin = tarihsiz(o.metin)
  const sayilar = [...new Set((metin.match(/\d+(?:[.,]\d+)?(?:-\d+(?:[.,]\d+)?)?/g) || []).filter((s) => s.replace(/\D/g, '').length <= 4))].slice(0, 2)
  const sozcukler = kelimeler(metin)
  const kat = sozcukler.map(katla)
  let taraf = o.taraf
  if (!taraf) { if (kat.some((k) => IKI_K.has(k))) taraf = 'bilateral'; else if (kat.some((k) => SAG_K.has(k))) taraf = kat.some((k) => SOL_K.has(k)) ? 'bilateral' : 'sag'; else if (kat.some((k) => SOL_K.has(k))) taraf = 'sol' }
  const olumsuz = o.olumsuz || kat.some((k) => OLUMSUZ_K.has(k))
  const kisaltmalar = [...new Set(sozcukler.filter((w) => w.length >= 2 && w.length <= 6 && !/\d/.test(w) && (w.match(/[A-ZÇĞİÖŞÜ]/g) || []).length >= 2))]
  const icerik = [...new Set(sozcukler.filter((w, i) => {
    const k = kat[i]
    return k.length >= 3 && !/\d/.test(k) && !dolguMu(k) && !SAG_K.has(k) && !SOL_K.has(k) && !IKI_K.has(k) && !OLUMSUZ_K.has(k) && !kisaltmalar.includes(w)
  }))].sort((a, b) => b.length - a.length || a.localeCompare(b, 'tr')).slice(0, Math.max(1, 3 - kisaltmalar.length))
  const anahtarlar: string[][] = []
  for (const k of kisaltmalar.slice(0, 2)) { const a = genislet(k).trim(); anahtarlar.push(a && a !== k ? [k, a] : [k]) }
  for (const w of icerik) anahtarlar.push([w])
  for (const s of sayilar) anahtarlar.push([s])
  if (taraf === 'sag') anahtarlar.push(SAG)
  else if (taraf === 'sol') anahtarlar.push(SOL)
  else if (taraf === 'bilateral') anahtarlar.push(IKI)
  if (olumsuz) anahtarlar.push(OLUMSUZ)
  return { anahtarlar, korumali: sayilar.length > 0 || taraf !== null || olumsuz }
}

export type NotAlanlari = { subjektif?: string | null; objektif?: string | null; degerlendirme?: string | null; plan?: string | null }

export function sayfaGercekleri(g: {
  not: NotAlanlari
  /** The confirmed reading of each page of the note's hand-note sources, in page order. */
  sayfaMetinleri: string[]
  genislet: Genisletici
  adlar: string[]
  tekSayfa: boolean
}): DegerlendirmeGercegi[][] {
  const sonuc: DegerlendirmeGercegi[][] = g.sayfaMetinleri.map(() => [])
  if (!g.sayfaMetinleri.length) return sonuc
  const metin = [g.not.subjektif, g.not.objektif, g.not.degerlendirme, g.not.plan].filter((x) => typeof x === 'string' && x.trim()).join('\n')
  const notOlgulari = olgulariCikar(metin, g.genislet).filter((o) => !o.belirsiz && !kimlikTasiyorMu(tarihsiz(o.metin), g.adlar))
  const sayfaOlgulari = g.sayfaMetinleri.map((m) => olgulariCikar(m, g.genislet))
  const gorulen = new Set<string>()
  for (const o of notOlgulari) {
    let hedef = -1
    if (g.tekSayfa && g.sayfaMetinleri.length === 1) hedef = 0
    else {
      let en = 0
      sayfaOlgulari.forEach((liste, i) => { for (const p of liste) { const b = kavramBenzerligi(o.kavram, p.kavram); if (b > en) { en = b; hedef = i } } })
      if (en < 0.5) hedef = -1
    }
    if (hedef < 0) continue
    const { anahtarlar, korumali } = gercekAnahtarlari(o, g.genislet)
    if (!anahtarlar.some((grup) => grup.some((x) => !/\d/.test(x)) && grup !== SAG && grup !== SOL && grup !== IKI && grup !== OLUMSUZ)) continue
    const imza = `${hedef}:${anahtarlar.map((x) => x.join('|')).join('/')}`
    if (gorulen.has(imza)) continue
    gorulen.add(imza)
    const liste = sonuc[hedef]
    if (liste.length >= AZAMI_GERCEK) continue
    liste.push({ id: `g${liste.length + 1}`, metin: o.metin.replace(TARIH, '…').slice(0, 200), anahtarlar, korumali })
  }
  return sonuc
}

/** Monday (Europe/Istanbul) of the week a moment falls in, YYYY-MM-DD — the week key of the dashboard and the weekly run. */
export function haftaBasi(t: Date, saatDilimi = 'Europe/Istanbul'): string {
  const gun = gunAnahtari(t, saatDilimi)
  const d = new Date(`${gun}T00:00:00Z`)
  const fark = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - fark)
  return d.toISOString().slice(0, 10)
}

/** The last `n` week keys, oldest first. */
export function sonHaftalar(n: number, simdi = new Date()): string[] {
  const bas = new Date(`${haftaBasi(simdi)}T00:00:00Z`)
  return Array.from({ length: n }, (_, i) => { const d = new Date(bas); d.setUTCDate(d.getUTCDate() - (n - 1 - i) * 7); return d.toISOString().slice(0, 10) })
}
