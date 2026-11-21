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
  // DEID-03 (2026-11-20): lab sheet / vaccine card column and sample words. A sample date or the result table must stay readable
  // when it shares a line with the patient block ("Adı Soyadı: X  Numune Tarihi: 12.11.2026"). Sex is clinical (reference ranges).
  'numune', 'sonuc', 'birim', 'referans', 'tetkik', 'parametre', 'cinsiyet', 'sex', 'gender', 'result', 'unit', 'reference', 'range',
  'specimen', 'sample', 'collected', 'doz', 'dose',
])

/** "Adı" after one of these names a test / vaccine / institution column, not a person ("Tetkik Adı", "Aşı Adı", "Hastane Adı"). */
const ADI_KURUM_ONEKI = new Set([
  'tetkik', 'test', 'asi', 'ilac', 'parametre', 'islem', 'lab', 'laboratuvar', 'kurum', 'hastane', 'firma', 'urun', 'birim', 'bolum',
  'klinik', 'merkez', 'tahlil', 'analiz', 'kurulus', 'tesis', 'okul', 'vaccine',
])
/** Document modalities (lab sheet, vaccine card, PDF report page): identity is EXPECTED somewhere, but no whole-band blackout
 *  (the result table / vaccine rows often start right under the patient block and must stay readable). */
export const BELGE_MODALITELERI = ['belge', 'lab', 'asi']

/** Long, distinctive labels that tolerate one OCR slip ("Hasla", "Protokoi", "Doktar"). Short labels stay exact. */
const BULANIK_ETIKETLER = ['hasta', 'protokol', 'doktor', 'patient', 'dogum', 'hekim', 'accession', 'birth']
function editMesafe1(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false
  let i = 0, j = 0, fark = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue }
    if (++fark > 1) return false
    if (a.length > b.length) i++; else if (a.length < b.length) j++; else { i++; j++ }
  }
  return fark + (a.length - i) + (b.length - j) <= 1
}
function bulanikEtiketMi(w: string): boolean {
  return w.length >= 5 && BULANIK_ETIKETLER.some((e) => e !== w && editMesafe1(w, e))
}

function etiketMi(kelimeAscii: string, sonrakiAscii: string): 0 | 1 | 2 {
  if (sonrakiAscii && KIMLIK_CIFT.has(`${kelimeAscii} ${sonrakiAscii}`)) return 2
  if (KIMLIK_TEK.has(kelimeAscii)) return 1
  if (bulanikEtiketMi(kelimeAscii)) return 1 // OCR slip in a distinctive label ("Hasla", "Protokoi")
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
  // DEID-03: a reference range ("150000-450000", "3.5-5.0") is two numbers, not one identifier
  const aralik = s.split(/\s*[-–]\s*/)
  if (aralik.length === 2 && aralik.every((p) => /^[<>≤≥]?\d[\d.,]*$/.test(p) && p.replace(/\D/g, '').length <= 7)) return false
  const digits = s.replace(/\D/g, '')
  return digits.length >= 9 && RAKAM_UZUN.test(s)
}


/**
 * Unlabelled patient name: scanners often print the name alone in the top-left of the header ("Ece Yıldırım", no "Name:").
 * Returns the leading run of 2-4 name-like words of the topmost line in the header band (letters only, no label / clinical token).
 */
function adSatiriBul(satirlar: OcrSatir[], yukseklik?: number): OcrKelime[] | null {
  let enUst: { y: number; ks: OcrKelime[] } | null = null
  for (const satir of satirlar) {
    const ks = [...satir.kelimeler].filter((w) => w.text.trim()).sort((a, b) => a.x0 - b.x0)
    if (!ks.length) continue
    const y = Math.min(...ks.map((w) => w.y0))
    if (yukseklik && y > yukseklik * UST_BOLGE_ORANI) continue
    if (!enUst || y < enUst.y) enUst = { y, ks }
  }
  if (!enUst) return null
  const ad: OcrKelime[] = []
  for (const w of enUst.ks) {
    const t = w.text.replace(/[.,;:]+$/g, '')
    const a = asciiNorm(t)
    if (!/^\p{Lu}\p{Ll}[\p{L}'’.-]*$/u.test(t) || t.length < 2 || etiketMi(a, '') > 0 || durMu(a) || ['ob', 'gen', 'abd', 'cardiac', 'obstetric'].includes(a)) break
    ad.push(w)
  }
  return ad.length >= 2 && ad.length <= 4 ? ad : null
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
    let sonEtiket: OcrKelime | null = null
    for (let i = 0; i < ks.length; i++) {
      const w = ks[i]
      const a = asciiNorm(w.text)
      const sonraki = ks[i + 1] ? asciiNorm(ks[i + 1].text) : ''
      // "Name:" style tokens may arrive glued with their value ("Hasta:AYSE") — split on the first colon
      const iki = w.text.indexOf(':')
      const onEk = iki > 0 ? asciiNorm(w.text.slice(0, iki)) : ''
      const gommaDeger = iki > 0 && iki < w.text.length - 1 && etiketMi(onEk, '') > 0
      const onceki = i > 0 ? asciiNorm(ks[i - 1].text) : ''
      const kurumAdi = a === 'adi' && ADI_KURUM_ONEKI.has(onceki)
      const e = kurumAdi ? 0 : gommaDeger ? 1 : etiketMi(a, sonraki)
      if (e > 0) {
        kimlikEtiketiVar = true
        maskeAcik = true
        sonEtiketBos = true
        const ustte = w.y0 < o.yukseklik * UST_BOLGE_ORANI
        if (ustte) { ustEtiket = true; ustEtiketAlt = Math.max(ustEtiketAlt, w.y1) }
        if (gommaDeger) { kutular.push({ x0: w.x0 + (w.x1 - w.x0) * (iki / w.text.length), y0: w.y0 - pad, x1: w.x1 + pad, y1: w.y1 + pad }); sonEtiketBos = false }
        sonEtiket = e === 2 && ks[i + 1] ? ks[i + 1] : w
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
    // DEID-03: ...or it is there but unreadable (handwritten name on a vaccine card, stamp): black out the rest of the line too.
    if (sonEtiketBos && maskeAcik && sonEtiket) {
      const h = sonEtiket.y1 - sonEtiket.y0
      kutular.push({ x0: sonEtiket.x1, y0: sonEtiket.y0 - h * 0.6, x1: o.genislik, y1: sonEtiket.y1 + h * 0.6 })
    }
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
    // DEID-03: only bare digit groups join ("123 456 789 01", "0532 123 45 67"); a dose number next to a date, a value next to
    // its reference range ("1 01.02.2024", "250 150-450") are separate clinical numbers and must stay readable.
    for (const w of ks) { if (/^\d+$/.test(w.text)) tampon.push(w); else bosalt() }
    bosalt()
  }

  const adKelimeleri = o.modalite && BASLIK_MODALITELERI.includes(o.modalite) ? adSatiriBul(satirlar, o.yukseklik) : null
  if (adKelimeleri) {
    kimlikEtiketiVar = true
    ustEtiket = true
    ustEtiketAlt = Math.max(ustEtiketAlt, ...adKelimeleri.map((w) => w.y1))
    kutular.push(kutuBirlestir(adKelimeleri, 3))
  }

  let ustBantUygulandi = false
  if (ustEtiket && o.modalite && BASLIK_MODALITELERI.includes(o.modalite)) {
    const alt = Math.min(o.yukseklik * 0.3, Math.max(o.yukseklik * UST_BANT_ORANI, ustEtiketAlt + 4))
    kutular.push({ x0: 0, y0: 0, x1: o.genislik, y1: alt })
    ustBantUygulandi = true
  }

  // Confidence is judged on the header text only: speckle inside the scan produces junk "words" that drag the whole-image
  // average down even when every label and value in the header was read correctly (that sent clean headers to the checkbox).
  const baslikKelimeleri = tum.filter((w) => w.y0 < o.yukseklik * UST_BOLGE_ORANI)
  const guvenler = (baslikKelimeleri.length >= 3 ? baslikKelimeleri : tum).map((w) => w.conf).filter((c) => Number.isFinite(c))
  const ort = guvenler.length ? guvenler.reduce((a, b) => a + b, 0) / guvenler.length : 0
  const baslikBeklenir = !!o.modalite && BASLIK_MODALITELERI.includes(o.modalite)
  const belgeMi = !!o.modalite && BELGE_MODALITELERI.includes(o.modalite)
  let durum: MaskeSonuc['durum'] = 'ok'
  if (belgeMi) durum = belgeDurumu([{ kimlikEtiketiVar, ortalamaGuven: ort, kelimeSayisi: tum.length }])
  else if (!tum.length) durum = baslikBeklenir ? 'ocr_yok' : 'ok'
  else if (ort < MIN_GUVEN && !(kimlikEtiketiVar && ustBantUygulandi && ort >= 40)) durum = 'dusuk_guven' // whole header band is blacked out: safe
  else if (baslikBeklenir && !kimlikEtiketiVar && tum.some((w) => w.y0 < o.yukseklik * UST_BOLGE_ORANI)) {
    // header text exists but no identity label was recognised: we cannot be sure it is clinical-only text
    durum = 'dusuk_guven'
  }

  const kirp = kutular.map((k) => ({ x0: Math.max(0, Math.floor(k.x0)), y0: Math.max(0, Math.floor(k.y0)), x1: Math.min(o.genislik, Math.ceil(k.x1)), y1: Math.min(o.yukseklik, Math.ceil(k.y1)) })).filter((k) => k.x1 > k.x0 && k.y1 > k.y0)
  return { kutular: kirp, kimlikEtiketiVar, ustBantUygulandi, durum, ortalamaGuven: Math.round(ort), kelimeSayisi: tum.length }
}


// ─── What was found (chips, wrong-patient guard) ──────────────────────────────────
export type KimlikBulgulari = { ad?: string; dogum?: string; muayeneTarihi?: string; protokol?: string; doktor?: string }

const TARIH_RE = /(\d{1,2})\s*[./\-]\s*(\d{1,2})\s*[./\-]\s*(\d{2,4})/
const AD_ETIKET = new Set(['hasta', 'hastaadi', 'adi', 'adsoyad', 'isim', 'name', 'patient', 'pname', 'pt', 'bemor', 'ismi', 'fio', 'пациент', 'фио', 'имя'])
const AD_CIFT = new Set(['hasta adi', 'ad soyad', 'adi soyadi', 'patient name', 'bemor ismi', 'ф и о'])
const DOGUM_ETIKET = new Set(['dob', 'dogum', 'birth', 'born', 'birthdate', 'dogumtarihi', 'tugilgan'])
const MUAYENE_ETIKET = new Set(['tarih', 'date', 'exam', 'muayene', 'sana', 'study', 'incelenme'])
const PROTOKOL_ETIKET = new Set(['protokol', 'prot', 'mrn', 'accession', 'acc', 'pid', 'patientid', 'id', 'dosya', 'file'])
const DOKTOR_ETIKET = new Set(['doktor', 'dr', 'hekim', 'physician', 'referring', 'sonographer', 'operator', 'врач'])

/** Reads the VALUES behind identity labels from OCR lines (local only; never sent anywhere). Tolerates label noise. */
export function kimlikBulgulari(satirlar: OcrSatir[]): KimlikBulgulari {
  const out: KimlikBulgulari = {}
  for (const satir of satirlar) {
    const ks = [...satir.kelimeler].filter((w) => w.text.trim()).sort((a, b) => a.x0 - b.x0)
    for (let i = 0; i < ks.length; i++) {
      const raw = ks[i].text
      const iki = raw.indexOf(':')
      const bas = asciiNorm(iki > 0 ? raw.slice(0, iki) : raw)
      const sonraki = ks[i + 1] ? asciiNorm(ks[i + 1].text) : ''
      const glued = iki > 0 && iki < raw.length - 1 ? raw.slice(iki + 1) : ''
      const sonrasi = (bas1: number): string[] => [glued, ...ks.slice(i + bas1).map((w) => w.text)].filter(Boolean)
      const degerAl = (liste: string[]): string[] => {
        const v: string[] = []
        for (const t of liste) {
          const a = asciiNorm(t)
          if (v.length && (durMu(a) || etiketMi(a, '') > 0)) break
          if (!v.length && (durMu(a) && !TARIH_RE.test(t))) break
          v.push(t)
        }
        return v
      }
      const cift = sonraki && AD_CIFT.has(`${bas} ${sonraki}`)
      const bulanik = bulanikEtiketMi(bas) ? (['hasta', 'protokol', 'doktor'].find((e) => editMesafe1(bas, e)) ?? '') : ''
      const b = bulanik || bas
      if (!out.ad && (cift || AD_ETIKET.has(b))) {
        const ad = degerAl(sonrasi(cift ? 2 : 1)).join(' ').replace(/[^\p{L}\s'.-]/gu, ' ').replace(/\s+/g, ' ').trim()
        if (ad.length >= 3) out.ad = ad
      } else if (!out.dogum && (DOGUM_ETIKET.has(b) || (b === 'dogum' && sonraki.startsWith('tar')))) {
        const m = sonrasi(1).join(' ').match(TARIH_RE); if (m) out.dogum = `${m[1].padStart(2, '0')}.${m[2].padStart(2, '0')}.${m[3]}`
      } else if (!out.muayeneTarihi && MUAYENE_ETIKET.has(b)) {
        const m = sonrasi(1).join(' ').match(TARIH_RE); if (m) out.muayeneTarihi = `${m[1].padStart(2, '0')}.${m[2].padStart(2, '0')}.${m[3]}`
      } else if (!out.protokol && PROTOKOL_ETIKET.has(b)) {
        const v = degerAl(sonrasi(sonraki === 'no' || sonraki === 'numarasi' ? 2 : 1)).join('').replace(/[^\w-]/g, '')
        if (v.length >= 3) out.protokol = v
      } else if (!out.doktor && DOKTOR_ETIKET.has(b)) {
        const v = degerAl(sonrasi(1)).join(' ').replace(/\s+/g, ' ').trim()
        if (v.length >= 3) out.doktor = v
      }
    }
  }
  if (!out.ad) {
    const ad = adSatiriBul(satirlar)
    if (ad) out.ad = ad.map((w) => w.text.replace(/[.,;:]+$/g, '')).join(' ')
  }
  return out
}

/** Merges OCR line sets from several passes (full image + 2x header band) into one list in the same pixel space. */
export function satirlariBirlestir(...kumeler: (OcrSatir[] | null | undefined)[]): OcrSatir[] | null {
  const hepsi = kumeler.filter((k): k is OcrSatir[] => Array.isArray(k))
  if (!hepsi.length) return null
  const out: OcrSatir[] = []
  const ayni = (a: OcrKelime, b: OcrKelime) => asciiNorm(a.text) === asciiNorm(b.text) && Math.abs(a.x0 - b.x0) < 12 && Math.abs(a.y0 - b.y0) < 12
  for (const k of hepsi) for (const s of k) {
    const yeni = s.kelimeler.filter((w) => !out.some((o) => o.kelimeler.some((x) => ayni(x, w))))
    if (yeni.length) out.push({ kelimeler: yeni })
  }
  return out
}

const sadelestir = (s: string) => s.toLocaleLowerCase('tr').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ç/g, 'c').replace(/ö/g, 'o').replace(/ü/g, 'u')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9а-яё\s]/g, ' ').replace(/\s+/g, ' ').trim()

/** Wrong-patient guard. Non-blocking: 'eslesmiyor' only when both sides have a name and no token overlaps (fuzzy, diacritic-insensitive). */
export function adKarsilastir(bulunan: string | undefined, hastaAdi: string | undefined | null): 'eslesir' | 'eslesmiyor' | 'belirsiz' {
  if (!bulunan || !hastaAdi) return 'belirsiz'
  const a = sadelestir(bulunan).split(' ').filter((t) => t.length >= 2)
  const h = sadelestir(hastaAdi).split(' ').filter((t) => t.length >= 2)
  if (!a.length || !h.length) return 'belirsiz'
  const esle = (x: string, y: string) => x === y || (x.length >= 4 && y.length >= 4 && editMesafe1(x, y))
  const ortak = a.filter((t) => h.some((u) => esle(t, u))).length
  return ortak > 0 ? 'eslesir' : 'eslesmiyor'
}


// ─── DEID-03 (2026-11-20): documents (lab sheet, vaccine card, multi-page PDF) ────────────────────────────
/**
 * Whole-document verdict for document modalities. 'ok' only when an identity label / ID-like number was found on at least one page
 * (a lab report or vaccine card always prints whose it is — if nothing was recognised we cannot know the name was hidden) and every
 * page that has text was read confidently. Pages without any text (blank page, ECG tracing) do not block.
 */
export function belgeDurumu(sayfalar: Pick<MaskeSonuc, 'kimlikEtiketiVar' | 'ortalamaGuven' | 'kelimeSayisi'>[]): MaskeSonuc['durum'] {
  const yazili = sayfalar.filter((s) => s.kelimeSayisi > 0)
  if (!yazili.length) return 'ocr_yok'
  if (yazili.some((s) => s.ortalamaGuven < MIN_GUVEN)) return 'dusuk_guven'
  if (!sayfalar.some((s) => s.kimlikEtiketiVar)) return 'dusuk_guven'
  return 'ok'
}

/** A structurally parsed table row (PDF text layer / CSV / Excel) that is really an identity line ("TC Kimlik No | 12345678901"). */
export function kimlikSatiriMi(ad: string, deger: string | null | undefined): boolean {
  const ks = String(ad || '').split(/\s+/).filter(Boolean)
  for (let i = 0; i < ks.length; i++) {
    const a = asciiNorm(ks[i]).replace(/\s/g, '')
    const onceki = i > 0 ? asciiNorm(ks[i - 1]) : ''
    if (a === 'adi' && ADI_KURUM_ONEKI.has(onceki)) continue
    if (etiketMi(a, ks[i + 1] ? asciiNorm(ks[i + 1]) : '') > 0) return true
  }
  // a bare 10+ digit value (TC, phone, protocol / barcode no) is never a lab result; "250.000" style counts keep their separators
  const kimlikNo = (t: string) => /^[\d\s-]{10,}$/.test(t.trim()) && t.replace(/\D/g, '').length >= 10
  return kimlikNo(String(deger ?? '')) || kimlikNo(String(ad || '')) || SSN.test(String(deger ?? '').trim())
}

/**
 * Plain text (pasted / .txt / .csv) with the same rules: words that the image masker would black out become "[gizlendi]".
 * Lines are laid out on a synthetic grid so label -> value, "label alone, value on the next line" and long digit runs behave
 * exactly as on an image.
 */
export function metniKimliksizlestir(metin: string): { metin: string; gizlenen: number } {
  const satirlarHam = String(metin || '').split(/\r?\n/)
  const satirlar: OcrSatir[] = satirlarHam.map((l, y) => {
    let x = 0
    return { kelimeler: l.split(/(\s+)/).filter((t) => t && !/^\s+$/.test(t)).map((t) => { const k = { text: t, x0: x, y0: y * 20, x1: x + t.length * 10, y1: y * 20 + 14, conf: 100 }; x += t.length * 10 + 10; return k }) }
  })
  const genislik = Math.max(10, ...satirlar.flatMap((s) => s.kelimeler.map((k) => k.x1))) + 10
  const r = kimlikKutulari(satirlar, { genislik, yukseklik: Math.max(20, satirlarHam.length * 20) })
  let gizlenen = 0
  const icinde = (k: OcrKelime) => r.kutular.some((b) => { const cx = (k.x0 + k.x1) / 2, cy = (k.y0 + k.y1) / 2; return cx >= b.x0 && cx <= b.x1 && cy >= b.y0 && cy <= b.y1 })
  const cikti = satirlarHam.map((l, y) => {
    const ks = satirlar[y].kelimeler
    if (!ks.some(icinde)) return l
    return ks.map((k) => { if (icinde(k)) { gizlenen++; return '[gizlendi]' } return k.text }).join(' ')
  })
  return { metin: cikti.join('\n'), gizlenen }
}
