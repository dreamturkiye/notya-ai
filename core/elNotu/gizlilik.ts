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
  const sablonKutulari: Kutu[] = []
  if (formlu) {
    for (const k of g.sablon!.baslikBolgeleri) sablonKutulari.push(genislet(k, 0.015, 0.012))
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
    // the clinic's file number: on a registration form the "No :" row sits right above the printed "Tarih :" row at the
    // top right; a two-letter "No" is often missed by the OCR, the date label is not. The visit date itself is kept.
    if (etiketSatirlari.length >= 2) {
      for (const s of g.ocr) for (const k of s.kelimeler) {
        if (k.conf < 60 || katla(k.text) !== 'tarih' || k.y1 > g.h * 0.35) continue
        const yuk = k.y1 - k.y0
        kutular.push(normal({ x0: k.x0 - yuk * 1.5, y0: k.y0 - yuk * 3.2, x1: g.w, y1: k.y0 - yuk * 0.1 }, g.w, g.h))
      }
    }
    // the identity block ends at "ŞİKAYETİ" / "Complaints" when at least two identity label rows were read above it: the
    // complaint is written on that row. A template band (drawn on one print of the form) or a label row's downward margin
    // that reaches past it is cut there — another print of the same form places the complaint row higher (seen on the
    // KBB form: the band of print 1 blacked out the complaint line of print 2). Everything above stays masked.
    const kesimY = blokSonuY !== Infinity && etiketSatirlari.filter((k) => k.y0 < blokSonuY).length >= 2 ? blokSonuY / g.h - 0.003 : null
    const kes = (k: Kutu): Kutu => (kesimY !== null && k.y0 < kesimY && k.y1 > kesimY ? { ...k, y1: kesimY } : k)
    for (let i = 0; i < sablonKutulari.length; i++) sablonKutulari[i] = kes(sablonKutulari[i])
    for (const k of etiketSatirlari) kutular.push(kes(normal(k, g.w, g.h)))
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
  kutular.unshift(...sablonKutulari)
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

/** A handwriting line the device found on the UNMASKED page (normalised box + word boxes), as core/elNotu/satir.ts gives it. */
export type ElSatiri = { kutu: Kutu; kelimeler: Kutu[] }

/**
 * Plain sheet (no form, no printed label): the PATIENT'S NAME written as a heading (2026-11-25, KBB batch 2 — 8 of 15 plain
 * sheets carried it). Handwriting is not readable on the device, so the heading is found by its place: a short word group
 * in the first two written rows, away from the left margin (where age / sex "67E" sits) and from the right edge (where
 * the date sits), roughly centred. Such a group is blacked out: a lost heading word costs little, a name sent costs much.
 * The date and the age / sex token are not matched (they sit at the margins); a body line is wider than a heading.
 */
export function serbestBaslikKutulari(satirlar: ElSatiri[]): Kutu[] {
  // lines touching the photo's side edges are the table / another sheet, not this page's writing
  const sayfada = satirlar.filter((s) => s.kutu.x1 < 0.97 && s.kutu.x0 > 0.03 && s.kutu.y1 - s.kutu.y0 < 0.08)
  const orta = (k: Kutu) => (k.y0 + k.y1) / 2
  // margin items: age / sex or a date at the left margin, a date at the right edge
  const kenar = (k: { x0: number; x1: number }) => k.x1 < 0.36 || k.x0 > 0.74
  // the first BODY line (a wide written line) — the heading sits above it
  const govde = sayfada.filter((s) => s.kutu.x1 - s.kutu.x0 >= 0.4).sort((a, c) => orta(a.kutu) - orta(c.kutu))[0]
  const sinir = govde ? govde.kutu.y0 : 0.3
  const yukler = sayfada.map((x) => x.kutu.y1 - x.kutu.y0).sort((a, c) => a - c)
  const medH = yukler.length ? yukler[Math.floor(yukler.length / 2)] : 0.03
  const adaylar: Kutu[] = []
  for (const s of sayfada) {
    if (orta(s.kutu) >= Math.min(0.3, sinir) || s === govde) continue
    // word groups: a gap wider than ~4 % of the page separates a date from a name written on the same line
    const kel = [...(s.kelimeler.length ? s.kelimeler : [s.kutu])].sort((x, y) => x.x0 - y.x0)
    const gruplar: Kutu[][] = []
    for (const k of kel) { const g = gruplar[gruplar.length - 1]; if (g && k.x0 - g[g.length - 1].x1 < 0.04) g.push(k); else gruplar.push([k]) }
    const kutular = gruplar.map((g) => ({ x0: Math.min(...g.map((k) => k.x0)), x1: Math.max(...g.map((k) => k.x1)), y0: s.kutu.y0, y1: s.kutu.y1, n: g.length }))
    const ic = kutular.filter((k) => !kenar(k))
    // the heading is the only body group of its line …
    if (ic.length !== 1) continue
    const k = ic[0], om = (k.x0 + k.x1) / 2
    if (k.x0 < 0.25 || om < 0.33 || om > 0.7 || k.x1 > 0.8 || k.x1 - k.x0 > 0.36 || k.x1 - k.x0 < 0.03 || k.n > 4) continue
    // … and of its height on the page (slanted photos: another line whose middle lies at this height = a body line)
    const yan = sayfada.some((d) => d !== s && orta(d.kutu) > k.y0 && orta(d.kutu) < k.y1 && !kenar(d.kutu) && Math.min(d.kutu.x1, 0.74) - Math.max(d.kutu.x0, 0.36) > 0)
    if (yan) continue
    // the heading is the first writing of the page: no body line above it (specks / a strip of another sheet do not count)
    if (sayfada.some((d) => d !== s && !kenar(d.kutu) && d.kutu.x0 > 0.1 && d.kutu.y1 - d.kutu.y0 >= medH * 0.6 && orta(d.kutu) < k.y0)) continue
    // a word written just above the next line (an insertion "doymadı" over "rahat değil") is not a heading: a heading
    // keeps at least ~a third of its height free below it
    const ham = (b: Kutu) => { const h = (b.y1 - b.y0) / 1.44; return { y0: b.y0 + h * 0.22, y1: b.y1 - h * 0.22, h } }
    const kh = ham(k)
    const alti = sayfada.filter((d) => d !== s && orta(d.kutu) > orta(k) && Math.min(d.kutu.x1, k.x1) - Math.max(d.kutu.x0, k.x0) > (k.x1 - k.x0) * 0.3)
    if (alti.some((d) => ham(d.kutu).y0 - kh.y1 < kh.h * 0.3)) continue
    adaylar.push(k)
  }
  if (!adaylar.length) return []
  // only the first written heading row (an insertion written above a later line is not a heading)
  adaylar.sort((x, y) => orta(x) - orta(y))
  const ilk = adaylar[0]
  return adaylar.filter((k) => orta(k) <= ilk.y1).map((k) => {
    // the device's line box already carries ~22 % of the ink height above and below: a little more, not the next line
    const yuk = k.y1 - k.y0
    return { x0: Math.max(0, k.x0 - 0.025), y0: Math.max(0, k.y0 - yuk * 0.12), x1: Math.min(1, k.x1 + 0.025), y1: Math.min(1, k.y1 + yuk * 0.08) }
  })
}

/**
 * Identity written past its box (2026-11-25, KBB batch 2: an address line continued under the last label row, a district
 * written slanting down onto the next printed row). A handwriting line whose INK starts inside a blacked-out identity box
 * (or touches its lower edge) and continues below it is the same entry running on: the whole line is blacked out. A line
 * written clearly below the box stays visible; a complaint written so high that it touches the box is lost too — on purpose (privacy first: a lost complaint line is asked for, a leaked address cannot be taken back).
 */
export function tasmaKutulari(satirlar: ElSatiri[], kimlik: Kutu[]): Kutu[] {
  const out: Kutu[] = []
  for (const s of satirlar) {
    const k = s.kutu, yuk = Math.max(1e-6, k.y1 - k.y0)
    // handwriting lines only: a printed drawing next to the block is not an entry
    if (yuk > 0.05 || k.x1 - k.x0 > 0.7) continue
    // already (almost) entirely inside ONE box: nothing new (boxes overlap, so their areas are not summed here)
    if (kimlik.some((m) => maskeliMi(k, [m], 0.9))) continue
    // the line's own ink (the device pads a line box by 22 % of the ink height above and below)
    const murekkepUst = k.y0 + (yuk / 1.44) * 0.22
    const tasiyor = kimlik.some((m) => {
      const yatay = Math.min(k.x1, m.x1) - Math.max(k.x0, m.x0)
      if (yatay < Math.min(0.03, (k.x1 - k.x0) * 0.3)) return false
      // its ink starts inside the box — or touches its lower edge (within a third of its ink height: a value written a
      // little lower than its row, the box edge drawn at the printed row) — and it continues below it
      return murekkepUst < m.y1 + (yuk / 1.44) * 0.35 && m.y0 < murekkepUst && m.y1 < k.y1
    })
    if (tasiyor) out.push({ x0: Math.max(0, k.x0 - 0.01), y0: k.y0, x1: Math.min(1, k.x1 + 0.01), y1: Math.min(1, k.y1 + yuk * 0.15) })
  }
  return out
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
