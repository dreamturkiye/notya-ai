/**
 * NOTYA-BELGE-DEID-02 — pure masking logic for burned-in identity text (no DOM, no OCR engine: testable).
 *
 * Input: OCR words with pixel boxes. Output: boxes to black out before the image leaves the device.
 * Rules (label -> value pairs, all languages of the six country versions + Turkish at once, because a scanner
 * overlay language is not tied to the UI language):
 *  - an identity LABEL (patient / name / DOB / protocol / MRN / accession / ID / doctor ...) masks the words that follow
 *    it on the same line (or the next line when the label stands alone), until a STOP label (clinical measurement
 *    or exam date) starts;
 *  - long digit runs (>= 9 digits, any separators: TC 11, NHS/Medicare/OHIP 10, JSHSHIR 14), SSN-like
 *    ddd-dd-dddd and NZ NHI-like AAA1234 are masked wherever they appear;
 *  - clinical measurements (GA, LMP, EDD, YS, FHR, CRL, BPD, FL, HC, AC, device settings) are never masked;
 *  - exam date alone is NOT identifying; a date is masked only when it follows a DOB label.
 *  - safety net: for header-overlay modalities, if an identity label was found in the top part of the image,
 *    the whole top band is masked.
 */

export type OcrKelime = { text: string; x0: number; y0: number; x1: number; y1: number; conf: number }
export type OcrSatir = { kelimeler: OcrKelime[] }
export type Kutu = { x0: number; y0: number; x1: number; y1: number }
export type MaskeSonuc = {
  kutular: Kutu[]
  kimlikEtiketiVar: boolean
  ustBantUygulandi: boolean
  /** 'ok' = safe to send masked copy without asking the doctor; otherwise the checkbox fallback applies. */
  durum: 'ok' | 'ocr_yok' | 'dusuk_guven'
  ortalamaGuven: number
  kelimeSayisi: number
}

/** Modalities whose scanner/PACS overlay normally carries a patient header band. */
export const BASLIK_MODALITELERI = ['us', 'eko', 'mamografi', 'ct', 'mr', 'pet']
export const UST_BANT_ORANI = 0.2
const UST_BOLGE_ORANI = 0.3
const MIN_GUVEN = 55

const norm = (s: string) => s.toLocaleLowerCase('tr').replace(/[.:;,_()|\[\]]/g, ' ').replace(/\s+/g, ' ').trim()
const asciiNorm = (s: string) => norm(s).replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ç/g, 'c').replace(/ö/g, 'o').replace(/ü/g, 'u')

/** Single-word identity labels (ASCII-folded). Multi-word labels are matched on word pairs below. */
const KIMLIK_TEK = new Set([
  'hasta', 'hastaadi', 'adi', 'adsoyad', 'isim', 'name', 'patient', 'pt', 'pat', 'pname', 'surname', 'lastname', 'firstname',
  'dob', 'dt', 'birth', 'born', 'birthdate', 'dogum', 'dogumtarihi', 'yas', 'age',
  'protokol', 'prot', 'protokolno', 'mrn', 'accession', 'acc', 'accno', 'id', 'pid', 'patientid', 'tc', 'tckn', 'tcno', 'kimlik',
  'nhs', 'nhi', 'medicare', 'ohip', 'sin', 'ssn', 'jshshir', 'pinfl', 'passport', 'pasaport', 'dosya', 'dosyano', 'file', 'case',
  'doktor', 'dr', 'hekim', 'physician', 'referring', 'referrer', 'sonographer', 'operator', 'op', 'radiologist', 'ref', 'perf',
  // Uzbek / Russian overlays
  'bemor', 'ismi', 'fio', 'tugilgan', 'шифо', 'пациент', 'фио', 'имя', 'фамилия', 'дата', 'рождения', 'врач', 'мрн', 'пинфл', 'жшшир', 'шифр', 'шифoкор', 'shifokor', 'vrach',
])
const KIMLIK_CIFT = new Set([
  'hasta adi', 'hasta no', 'hasta adı', 'ad soyad', 'adi soyadi', 'dogum tarihi', 'dogum tar', 'dogum t', 'date of', 'birth date', 'patient name', 'patient id', 'patient no',
  'medical record', 'record no', 'accession no', 'protokol no', 'tc kimlik', 'referring physician', 'referring dr', 'ref physician', 'performing physician',
  'tugilgan sana', 'bemor ismi', 'дата рождения', 'ф и о', 'ф и',
])
/** Labels that END a masked value: clinical measurements, device settings and the (non-identifying) exam date. */
const DUR_ETIKET = new Set([
  'ga', 'lmp', 'edd', 'ys', 'fhr', 'crl', 'bpd', 'fl', 'hc', 'ac', 'ofd', 'efw', 'afi', 'nt', 'gs', 'cm', 'mm', 'mhz', 'db', 'mi', 'tis', 'gain', 'depth', 'freq', 'fr', 'hz', 'bpm',
  'tarih', 'date', 'exam', 'muayene', 'time', 'saat', 'sana', 'vaqt', 'время', 'weeks', 'hafta', 'days', 'gun', 'wk', 'gw',
])

function etiketMi(kelimeAscii: string, sonrakiAscii: string): 0 | 1 | 2 {
  if (sonrakiAscii && KIMLIK_CIFT.has(`${kelimeAscii} ${sonrakiAscii}`)) return 2
  if (KIMLIK_TEK.has(kelimeAscii)) return 1
  return 0
}
function durMu(kelimeAscii: string): boolean { return DUR_ETIKET.has(kelimeAscii) }

const RAKAM_UZUN = /(?:\d[\s.\-/]?){9,}/
const SSN = /^\d{3}-\d{2}-\d{4}$/
const NHI = /^[A-Za-z]{3}\d{4}$/

function kimlikBenzeriMi(t: string): boolean {
  const s = t.trim()
  if (!s) return false
  if (SSN.test(s) || NHI.test(s)) return true
  const digits = s.replace(/\D/g, '')
  return digits.length >= 9 && RAKAM_UZUN.test(s)
}

function kutuBirlestir(k: OcrKelime[], pad: number): Kutu {
  return {
    x0: Math.min(...k.map((w) => w.x0)) - pad, y0: Math.min(...k.map((w) => w.y0)) - pad,
    x1: Math.max(...k.map((w) => w.x1)) + pad, y1: Math.max(...k.map((w) => w.y1)) + pad,
  }
}

export function kimlikKutulari(
  satirlar: OcrSatir[],
  o: { genislik: number; yukseklik: number; modalite?: string },
): MaskeSonuc {
  const kutular: Kutu[] = []
  let kimlikEtiketiVar = false
  let ustEtiket = false
  let ustEtiketAlt = 0
  const tum = satirlar.flatMap((s) => s.kelimeler).filter((w) => w.text.trim())
  const sirali = [...satirlar].sort((a, b) => Math.min(...a.kelimeler.map((w) => w.y0), 1e9) - Math.min(...b.kelimeler.map((w) => w.y0), 1e9))
  let sonrakiSatiriMaskele = false

  for (const satir of sirali) {
    const ks = [...satir.kelimeler].filter((w) => w.text.trim()).sort((a, b) => a.x0 - b.x0)
    if (!ks.length) continue
    const pad = Math.max(2, Math.round((ks[0].y1 - ks[0].y0) * 0.25))
    let maskeAcik = sonrakiSatiriMaskele
    sonrakiSatiriMaskele = false
    let sonEtiketBos = false
    for (let i = 0; i < ks.length; i++) {
      const w = ks[i]
      const a = asciiNorm(w.text)
      const sonraki = ks[i + 1] ? asciiNorm(ks[i + 1].text) : ''
      // "Name:" style tokens may arrive glued with their value ("Hasta:AYSE") — split on the first colon
      const iki = w.text.indexOf(':')
      const onEk = iki > 0 ? asciiNorm(w.text.slice(0, iki)) : ''
      const gommaDeger = iki > 0 && iki < w.text.length - 1 && etiketMi(onEk, '') > 0
      const e = gommaDeger ? 1 : etiketMi(a, sonraki)
      if (e > 0) {
        kimlikEtiketiVar = true
        maskeAcik = true
        sonEtiketBos = true
        const ustte = w.y0 < o.yukseklik * UST_BOLGE_ORANI
        if (ustte) { ustEtiket = true; ustEtiketAlt = Math.max(ustEtiketAlt, w.y1) }
        if (gommaDeger) { kutular.push({ x0: w.x0 + (w.x1 - w.x0) * (iki / w.text.length), y0: w.y0 - pad, x1: w.x1 + pad, y1: w.y1 + pad }); sonEtiketBos = false }
        if (e === 2) i++ // consume the second word of the label
        continue
      }
      if (maskeAcik && durMu(a) && !kimlikBenzeriMi(w.text)) { maskeAcik = false; continue }
      if (maskeAcik) {
        kutular.push({ x0: w.x0 - pad, y0: w.y0 - pad, x1: w.x1 + pad, y1: w.y1 + pad })
        sonEtiketBos = false
        if (w.y0 < o.yukseklik * UST_BOLGE_ORANI) { ustEtiket = true; ustEtiketAlt = Math.max(ustEtiketAlt, w.y1) }
        continue
      }
      if (kimlikBenzeriMi(w.text)) {
        kimlikEtiketiVar = true
        kutular.push({ x0: w.x0 - pad, y0: w.y0 - pad, x1: w.x1 + pad, y1: w.y1 + pad })
        if (w.y0 < o.yukseklik * UST_BOLGE_ORANI) { ustEtiket = true; ustEtiketAlt = Math.max(ustEtiketAlt, w.y1) }
      }
    }
    // a label that stood alone at the end of its line: its value is on the next line
    if (sonEtiketBos && maskeAcik) sonrakiSatiriMaskele = true
  }

  // Digit runs split across several OCR words ("123 456 789 01") on one line
  for (const satir of sirali) {
    const ks = [...satir.kelimeler].filter((w) => w.text.trim()).sort((a, b) => a.x0 - b.x0)
    let tampon: OcrKelime[] = []
    const bosalt = () => {
      if (tampon.length > 1 && tampon.map((w) => w.text).join('').replace(/\D/g, '').length >= 9) {
        kimlikEtiketiVar = true
        const pad = 3
        kutular.push(kutuBirlestir(tampon, pad))
      }
      tampon = []
    }
    for (const w of ks) { if (/^[\d.\-/]+$/.test(w.text)) tampon.push(w); else bosalt() }
    bosalt()
  }

  let ustBantUygulandi = false
  if (ustEtiket && o.modalite && BASLIK_MODALITELERI.includes(o.modalite)) {
    const alt = Math.min(o.yukseklik * 0.3, Math.max(o.yukseklik * UST_BANT_ORANI, ustEtiketAlt + 4))
    kutular.push({ x0: 0, y0: 0, x1: o.genislik, y1: alt })
    ustBantUygulandi = true
  }

  const guvenler = tum.map((w) => w.conf).filter((c) => Number.isFinite(c))
  const ort = guvenler.length ? guvenler.reduce((a, b) => a + b, 0) / guvenler.length : 0
  const baslikBeklenir = !!o.modalite && BASLIK_MODALITELERI.includes(o.modalite)
  let durum: MaskeSonuc['durum'] = 'ok'
  if (!tum.length) durum = baslikBeklenir ? 'ocr_yok' : 'ok'
  else if (ort < MIN_GUVEN) durum = 'dusuk_guven'
  else if (baslikBeklenir && !kimlikEtiketiVar && tum.some((w) => w.y0 < o.yukseklik * UST_BOLGE_ORANI)) {
    // header text exists but no identity label was recognised: we cannot be sure it is clinical-only text
    durum = 'dusuk_guven'
  }

  const kirp = kutular.map((k) => ({ x0: Math.max(0, Math.floor(k.x0)), y0: Math.max(0, Math.floor(k.y0)), x1: Math.min(o.genislik, Math.ceil(k.x1)), y1: Math.min(o.yukseklik, Math.ceil(k.y1)) })).filter((k) => k.x1 > k.x0 && k.y1 > k.y0)
  return { kutular: kirp, kimlikEtiketiVar, ustBantUygulandi, durum, ortalamaGuven: Math.round(ort), kelimeSayisi: tum.length }
}
