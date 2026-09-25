/**
 * NOTYA-GELEN-BELGELER — which of THIS doctor's patients is the document about. Pure: the caller decrypts the
 * doctor's own roster on the server (sunucu.ts) and passes it in; nothing here ever sees another doctor's patients,
 * and the roster is never sent to the model — the model only reads the document, the comparison happens here.
 *
 * Signals (points):
 *   • full TC Kimlik No in the document whose hash equals the patient's tc_kimlik_hash → 100 (decisive)
 *   • name: every name word matches → 50; first + last word → 40; surname only → 15 (Turkish letters folded,
 *     one typo per long word tolerated — "Cigdem" finds "Çiğdem", OCR's "Yilmez" finds "Yılmaz")
 *   • birth date equal → 35; both known and different → −40 (a same-named different person)
 *   • sender phone / email equal to the patient's (channels in phases 2–3) → 40 each
 * Only the stored patient TC HASH exists (never the number), so "last digits" printed on a masked report cannot be
 * compared; a masked TC adds nothing.
 *
 * Certainty for the doctor, in plain words: "Eminim" only when the best score is ≥ 85 AND clearly ahead of the
 * runner-up (≥ 25 points); everything else is "Kontrol edin". Up to three suggestions, weakest dropped below 25.
 */
import type { Gonderen, KayitliOneri, Okuma } from './tipler'

export type Aday = {
  id: string
  ad: string
  dogum: string | null
  tcHash: string | null
  telefon: string | null
  eposta: string | null
}

const TR: Record<string, string> = { ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g', ı: 'i', I: 'i', İ: 'i', ö: 'o', Ö: 'o', ş: 's', Ş: 's', ü: 'u', Ü: 'u' }

export function duzle(s: string): string {
  return String(s || '')
    .replace(/[çÇğĞıIİöÖşŞüÜ]/g, (c) => TR[c] || c)
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Titles and noise that appear next to names on reports. */
const GURULTU = new Set(['bay', 'bayan', 'sayin', 'hasta', 'adi', 'soyadi', 'ad', 'soyad', 'dr', 'uzm', 'prof', 'doc', 'bebek', 'bebegi'])

function kelimeler(ad: string): string[] {
  return duzle(ad).split(' ').filter((k) => k.length > 1 && !GURULTU.has(k))
}

/** Levenshtein distance ≤ 1 (one substitution, insertion or deletion). */
function birHataIcinde(a: string, b: string): boolean {
  if (a === b) return true
  if (Math.abs(a.length - b.length) > 1) return false
  let i = 0, j = 0, fark = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue }
    if (++fark > 1) return false
    if (a.length > b.length) i++
    else if (b.length > a.length) j++
    else { i++; j++ }
  }
  return fark + (a.length - i) + (b.length - j) <= 1
}

function kelimeEsit(a: string, b: string): boolean {
  if (a === b) return true
  return a.length >= 5 && b.length >= 5 && birHataIcinde(a, b)
}

export function adPuani(belgedeki: string | null, kayitli: string): { puan: number; neden: string | null } {
  if (!belgedeki) return { puan: 0, neden: null }
  const b = kelimeler(belgedeki), k = kelimeler(kayitli)
  if (!b.length || !k.length) return { puan: 0, neden: null }
  const eslesen = k.filter((kk) => b.some((bb) => kelimeEsit(bb, kk)))
  if (eslesen.length === k.length && k.length >= 2) return { puan: 50, neden: 'ad soyad' }
  const ilk = b.some((bb) => kelimeEsit(bb, k[0])), son = b.some((bb) => kelimeEsit(bb, k[k.length - 1]))
  if (ilk && son && k.length >= 2) return { puan: 40, neden: 'ad soyad' }
  if (k.length === 1 && eslesen.length === 1 && b.length === 1) return { puan: 40, neden: 'ad' }
  if (son && k.length >= 2) return { puan: 15, neden: 'soyadı' }
  return { puan: 0, neden: null }
}

/** YYYY-MM-DD from ISO or Turkish dd.mm.yyyy; null when not a real date. */
export function tarihNormalle(s: string | null | undefined): string | null {
  const t = String(s || '').trim()
  let m = t.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  m = t.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  return null
}

export function telefonNormalle(s: string | null | undefined): string | null {
  const d = String(s || '').replace(/\D/g, '')
  return d.length >= 10 ? d.slice(-10) : null
}

export function tcGecerliMi(tc: string | null | undefined): boolean {
  const t = String(tc || '')
  if (!/^[1-9]\d{10}$/.test(t)) return false
  const n = t.split('').map(Number)
  const d10 = ((n[0] + n[2] + n[4] + n[6] + n[8]) * 7 - (n[1] + n[3] + n[5] + n[7])) % 10
  const d11 = n.slice(0, 10).reduce((a, b) => a + b, 0) % 10
  return ((d10 + 10) % 10) === n[9] && d11 === n[10]
}

export type EslesmeGirdisi = {
  kimlik: Okuma['kimlik']
  gonderen?: Gonderen | null
  adaylar: Aday[]
  /** Every hash form a stored tc_kimlik_hash may have been written with (plain / peppered sha256). */
  tcHashleri?: (tc: string) => string[]
}

export function hastaOner(g: EslesmeGirdisi): KayitliOneri[] {
  const tc = tcGecerliMi(g.kimlik.tc) ? String(g.kimlik.tc) : null
  const tcH = tc && g.tcHashleri ? new Set(g.tcHashleri(tc)) : null
  const dogum = tarihNormalle(g.kimlik.dogum)
  const gTel = telefonNormalle(g.gonderen?.telefon)
  const gEposta = String(g.gonderen?.eposta || '').trim().toLowerCase() || null

  const puanli = g.adaylar.map((a) => {
    let puan = 0
    const nedenler: string[] = []
    if (tcH && a.tcHash && tcH.has(a.tcHash)) { puan += 100; nedenler.push('TC kimlik') }
    const ad = adPuani(g.kimlik.ad, a.ad)
    if (ad.puan) { puan += ad.puan; nedenler.push(ad.neden!) }
    const aDogum = tarihNormalle(a.dogum)
    if (dogum && aDogum) {
      if (dogum === aDogum) { puan += 35; nedenler.push('doğum tarihi') } else puan -= 40
    }
    if (gTel && telefonNormalle(a.telefon) === gTel) { puan += 40; nedenler.push('telefon') }
    if (gEposta && String(a.eposta || '').trim().toLowerCase() === gEposta) { puan += 40; nedenler.push('e-posta') }
    return { a, puan, nedenler }
  })
    .filter((x) => x.puan >= 25)
    .sort((x, y) => y.puan - x.puan)
    .slice(0, 3)

  return puanli.map((x, i) => {
    const sonraki = puanli[i + 1]?.puan ?? 0
    const onceki = i > 0 ? puanli[i - 1].puan : null
    const eminim = i === 0 && x.puan >= 85 && x.puan - sonraki >= 25 && onceki === null
    return { patient_id: x.a.id, guven: Math.max(0, Math.min(100, x.puan)), kesinlik: eminim ? 'eminim' : 'kontrol', nedenler: x.nedenler }
  })
}
