/**
 * ESNEK-MUAYENE-A — privacy gate for a handwritten page (pure). belge-otomatik-akis: never send unmasked.
 *
 * A handwritten identity header is NOT found by the document OCR mask (core/belgeler/kimlikMaske.ts masks recognised
 * words; a pen-written name or T.C. number is not recognised, so it would stay visible). This gate therefore works on
 * REGIONS, not words:
 *   1. known form template matched → its header band(s) are blacked out by position (after de-warping);
 *   2. the user marked the header once on an unknown form → that region (it becomes the template);
 *   3. printed identity labels found by on-device OCR (T.C. KİMLİK NO, ADI-SOYADI, GSM, Passport Number, Address…) →
 *      every label row is blacked out from the label to the page edge, and the block spanning all label rows is blacked
 *      out full width (the handwritten values sit there, unreadable to OCR);
 *   4. printed identity on a FOREIGN sheet intruding at a margin (another hospital's form, often rotated) → found by the
 *      rotated margin OCR, blacked out from the label cluster to that page edge;
 *   5. long digit runs, phone numbers and e-mail addresses anywhere → blacked out;
 *   6. a page with none of the above is sent only when the doctor declared once that his plain sheets carry no identity
 *      (a 'serbest' template) AND the page is not a printed document; otherwise the user is asked to mark the header.
 * OCR failure with no template / no marked region = not sent ("Kimlik gizlenemedi").
 */
import type { OcrSatir, OcrKelime } from '@/core/belgeler/kimlikMaske'
import type { Kutu, Sablon } from './tipler'

export type KenarOcr = { kenar: 'sol' | 'sag' | 'ust' | 'alt'; satirlar: OcrSatir[] }

export type GizlilikGirdisi = {
  w: number
  h: number
  /** OCR of the upright page (pixel coordinates of the page); null = OCR failed. */
  ocr: OcrSatir[] | null
  /** OCR of the four margin strips read at 90° and 270°, mapped back to page coordinates. */
  kenarOcr?: KenarOcr[] | null
  sablon: Sablon | null
  /** 0..1 fingerprint correlation of the page with `sablon` (formlu templates only). */
  sablonEslesmesi: number
  /** Regions the user marked on this page (normalised). */
  kullaniciBolgeleri?: Kutu[]
  /** The doctor declared once that his plain sheets carry no identity. */
  serbestBeyan: boolean
}

export type GizlilikKarari = {
  durum: 'maskelendi' | 'baslik_gerekli' | 'ocr_basarisiz'
  neden: 'sablon' | 'kullanici' | 'etiket' | 'serbest' | null
  /** Normalised boxes to black out on the outbound copy (and on every crop cut from it). */
  kutular: Kutu[]
  etiketSayisi: number
  basiliMetin: number
}

/** Template match needed to trust a template's header position. */
export const SABLON_ESIK = 0.62

const katla = (s: string) => s.toLocaleLowerCase('tr').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ç/g, 'c').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/[^a-z0-9а-яёўқғҳ@]/gi, '')

/** Identity label words of patient registration forms (Turkish forms, English forms, Uzbek / Russian forms). Folded. */
const ETIKET = new Set([
  'tc', 'kimlik', 'kimlikno', 'tckimlik', 'adi', 'soyadi', 'adisoyadi', 'adsoyad', 'isim', 'meslegi', 'meslek', 'tavsiye', 'eden',
  'guvencesi', 'guvence', 'adresi', 'adres', 'evadresi', 'gsm', 'tel', 'telefon', 'eposta', 'email', 'mail', 'dogum', 'dogumtarihi',
  'protokol', 'dosyano', 'hastano', 'hasta', 'cep', 'pasaport',
  'passport', 'name', 'surname', 'namesurname', 'job', 'profession', 'proffession', 'jobprofession', 'referred', 'insurance', 'address',
  'mobile', 'phone', 'birth', 'dateofbirth', 'dob', 'nhs', 'nhi', 'medicare', 'mrn', 'ssn', 'patient',
  'fio', 'ismi', 'familiyasi', 'manzil', 'manzili', 'pasport', 'jshshir', 'pinfl', 'telefoni', 'tugilgan',
  'фио', 'имя', 'фамилия', 'адрес', 'телефон', 'паспорт', 'рождения', 'пинфл',
])
/** Words that END the identity block on a registration form (the complaint / exam part begins). */
const BLOK_SONU = new Set(['sikayeti', 'sikayet', 'complaints', 'complaint', 'shikoyat', 'жалобы', 'anamnez', 'oyku'])

function etiketMi(k: OcrKelime, ustBolgede = false): boolean {
  if (k.conf < 45) return false
  const t = katla(k.text)
  if (!t || t.length > 24) return false
  // "No :" in the header area of a registration form is the clinic's file / protocol number (an identifier)
  if (ustBolgede && t === 'no' && k.conf >= 60) return true
  return ETIKET.has(t)
}

/** "ŞİKAYETİ", "Complaints" — also when the photo cut the word ("KAYETİ", "plaints"). */
function blokSonuMu(k: OcrKelime): boolean {
  if (k.conf < 45) return false
  const t = katla(k.text)
  return BLOK_SONU.has(t) || (t.length >= 5 && ['sikayeti', 'complaints', 'shikoyati'].some((b) => b.endsWith(t)))
}

const UZUN_RAKAM = /\d[\d\s.\-/]{7,}\d/
const EPOSTA = /\S+@\S+/
const TELEFON = /(\+?\d[\d\s()-]{8,}\d)/

function satirKutusu(s: OcrSatir): Kutu | null {
  if (!s.kelimeler.length) return null
  return {
    x0: Math.min(...s.kelimeler.map((k) => k.x0)), y0: Math.min(...s.kelimeler.map((k) => k.y0)),
    x1: Math.max(...s.kelimeler.map((k) => k.x1)), y1: Math.max(...s.kelimeler.map((k) => k.y1)),
  }
}

const normal = (k: Kutu, w: number, h: number): Kutu => ({ x0: Math.max(0, k.x0 / w), y0: Math.max(0, k.y0 / h), x1: Math.min(1, k.x1 / w), y1: Math.min(1, k.y1 / h) })
const genislet = (k: Kutu, px: number, py: number): Kutu => ({ x0: Math.max(0, k.x0 - px), y0: Math.max(0, k.y0 - py), x1: Math.min(1, k.x1 + px), y1: Math.min(1, k.y1 + py) })

export function gizlilikKarari(g: GizlilikGirdisi): GizlilikKarari {
  const kutular: Kutu[] = []
  let neden: GizlilikKarari['neden'] = null
  const formlu = g.sablon && g.sablon.tur === 'formlu' && g.sablonEslesmesi >= SABLON_ESIK
  if (formlu) {
    for (const k of g.sablon!.baslikBolgeleri) kutular.push(genislet(k, 0.015, 0.012))
    neden = 'sablon'
  }
  if (g.kullaniciBolgeleri?.length) {
    for (const k of g.kullaniciBolgeleri) kutular.push(genislet(k, 0.01, 0.01))
    neden = neden ?? 'kullanici'
  }

  let etiketSayisi = 0, basiliMetin = 0
  if (g.ocr) {
    const etiketSatirlari: Kutu[] = []
    let blokSonuY = Infinity
    for (const s of g.ocr) {
      for (const k of s.kelimeler) if (k.conf >= 80 && k.text.trim().length >= 3) basiliMetin++
      const sk = satirKutusu(s)
      if (!sk) continue
      const ustBolgede = sk.y1 < g.h * 0.3
      const etiketler = s.kelimeler.filter((k) => etiketMi(k, ustBolgede))
      if (s.kelimeler.some(blokSonuMu)) blokSonuY = Math.min(blokSonuY, sk.y0)
      if (etiketler.length) {
        etiketSayisi += etiketler.length
        const sol = Math.min(...etiketler.map((k) => k.x0))
        const yuk = sk.y1 - sk.y0
        // label → right page edge, taller than the printed row (handwritten values are bigger and drift)
        etiketSatirlari.push({ x0: sol, y0: sk.y0 - yuk * 0.7, x1: g.w, y1: sk.y1 + yuk * 0.9 })
      }
      // printed or recognised identifiers anywhere
      const metin = s.kelimeler.map((k) => k.text).join(' ')
      if (UZUN_RAKAM.test(metin) || EPOSTA.test(metin) || TELEFON.test(metin)) {
        for (const k of s.kelimeler) {
          if (/\d{3,}/.test(k.text) || k.text.includes('@')) kutular.push(genislet(normal(k, g.w, g.h), 0.01, 0.006))
        }
      }
    }
    for (const k of etiketSatirlari) kutular.push(normal(k, g.w, g.h))
    // with a matched template the template's header band defines the block; label rows are only added on top (a form
    // printed slightly differently still gets its label rows covered), never the spanning block (it would cover the complaint)
    if (etiketSatirlari.length >= 2 && !formlu) {
      // the whole identity block, full width, from the first label row to the last (never past "ŞİKAYETİ" / "Complaints")
      const y0 = Math.min(...etiketSatirlari.map((k) => k.y0))
      let y1 = Math.max(...etiketSatirlari.map((k) => k.y1))
      // an address runs on for one or two lines under its label: extend to just above "ŞİKAYETİ" when it follows the
      // block closely, else by a quarter of the block height
      if (blokSonuY !== Infinity && blokSonuY > y1 && blokSonuY - y1 < (y1 - y0) * 0.8) y1 = blokSonuY - 2
      else if (blokSonuY !== Infinity && blokSonuY > y0 && blokSonuY <= y1) y1 = blokSonuY - 2
      else y1 = y1 + (y1 - y0) * 0.25
      kutular.push(normal({ x0: 0, y0, x1: g.w, y1 }, g.w, g.h))
      neden = neden ?? 'etiket'
    } else if (etiketSatirlari.length === 1) neden = neden ?? 'etiket'
  }
  for (const k of g.kenarOcr || []) {
    const etiketler = k.satirlar.flatMap((s) => s.kelimeler.filter((w) => etiketMi(w)))
    const rakam = k.satirlar.flatMap((s) => s.kelimeler.filter((w) => /\d{5,}/.test(w.text)))
    const hepsi = [...etiketler, ...rakam]
    if (!hepsi.length) continue
    etiketSayisi += etiketler.length
    const x0 = Math.min(...hepsi.map((w) => w.x0)), x1 = Math.max(...hepsi.map((w) => w.x1))
    const y0 = Math.min(...hepsi.map((w) => w.y0)), y1 = Math.max(...hepsi.map((w) => w.y1))
    const pay = 0.04
    const n = normal({ x0, y0, x1, y1 }, g.w, g.h)
    // from the label cluster to that page edge (the foreign sheet continues to the border)
    const kutu = k.kenar === 'sag' ? { x0: n.x0 - pay, y0: n.y0 - pay, x1: 1, y1: n.y1 + pay }
      : k.kenar === 'sol' ? { x0: 0, y0: n.y0 - pay, x1: n.x1 + pay, y1: n.y1 + pay }
        : k.kenar === 'ust' ? { x0: n.x0 - pay, y0: 0, x1: n.x1 + pay, y1: n.y1 + pay }
          : { x0: n.x0 - pay, y0: n.y0 - pay, x1: n.x1 + pay, y1: 1 }
    kutular.push(genislet(kutu, 0, 0))
  }

  if (formlu || g.kullaniciBolgeleri?.length) return { durum: 'maskelendi', neden, kutular, etiketSayisi, basiliMetin }
  if (!g.ocr) return { durum: 'ocr_basarisiz', neden: null, kutular, etiketSayisi, basiliMetin }
  if (etiketSayisi > 0) return { durum: 'maskelendi', neden: neden ?? 'etiket', kutular, etiketSayisi, basiliMetin }
  // no form, no label: a plain handwritten sheet is sent only on the doctor's standing declaration and only when the page is
  // not a printed document (a printout with no recognised label is not "a plain sheet").
  if (g.serbestBeyan && basiliMetin < 25) return { durum: 'maskelendi', neden: 'serbest', kutular, etiketSayisi, basiliMetin }
  return { durum: 'baslik_gerekli', neden: null, kutular, etiketSayisi, basiliMetin }
}

/** Paint boxes black on an RGBA raster (in place). Used on the device before encoding and before cutting any crop. */
export function maskeyiBoya(r: { w: number; h: number; d: Uint8ClampedArray }, kutular: Kutu[]): void {
  for (const k of kutular) {
    const x0 = Math.max(0, Math.floor(k.x0 * r.w)), x1 = Math.min(r.w, Math.ceil(k.x1 * r.w))
    const y0 = Math.max(0, Math.floor(k.y0 * r.h)), y1 = Math.min(r.h, Math.ceil(k.y1 * r.h))
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const i = (y * r.w + x) * 4; r.d[i] = 0; r.d[i + 1] = 0; r.d[i + 2] = 0; r.d[i + 3] = 255 }
  }
}

/** True when `k` lies (mostly) inside a blacked-out box — such a line/crop is never cut or sent. */
export function maskeliMi(k: Kutu, kutular: Kutu[], oran = 0.5): boolean {
  const alan = Math.max(1e-9, (k.x1 - k.x0) * (k.y1 - k.y0))
  let kesisen = 0
  for (const m of kutular) {
    const w = Math.max(0, Math.min(k.x1, m.x1) - Math.max(k.x0, m.x0)), h = Math.max(0, Math.min(k.y1, m.y1) - Math.max(k.y0, m.y0))
    kesisen += w * h
  }
  return kesisen / alan >= oran
}
