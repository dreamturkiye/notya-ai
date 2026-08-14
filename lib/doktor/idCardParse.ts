/**
 * Parse Turkish national ID card OCR text (eski + yeni kimlik).
 * Never auto-saves — returns structured fields + confidence for human review.
 */

export type IdCardFields = {
  tcKimlikNo?: string
  ad?: string
  soyad?: string
  adSoyad?: string
  dogumTarihi?: string
  cinsiyet?: string
}

export type IdCardParseResult = {
  fields: IdCardFields
  confidence: number
  rawHints: string[]
}

function validateTC(tc: string): boolean {
  if (!/^[1-9][0-9]{10}$/.test(tc)) return false
  const d = tc.split('').map(Number)
  const odd = d[0] + d[2] + d[4] + d[6] + d[8]
  const even = d[1] + d[3] + d[5] + d[7]
  if ((odd * 7 - even) % 10 !== d[9]) return false
  if ((d.slice(0, 10).reduce((a, b) => a + b, 0)) % 10 !== d[10]) return false
  return true
}

function normalizeDate(raw: string): string | undefined {
  const s = raw.trim().replace(/\s+/g, '')
  // DD.MM.YYYY or DD/MM/YYYY
  let m = s.match(/^(\d{2})[./-](\d{2})[./-](\d{4})$/)
  if (m) return `${m[3]}-${m[2]}-${m[1]}`
  // YYYY-MM-DD
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) return s
  // DDMMYYYY
  m = s.match(/^(\d{2})(\d{2})(\d{4})$/)
  if (m) return `${m[3]}-${m[2]}-${m[1]}`
  return undefined
}

function normalizeGender(raw: string): string | undefined {
  const v = raw.toLowerCase().replace(/\s+/g, '')
  if (
    v.includes('erkek') ||
    v === 'e' ||
    v === 'm' ||
    v === 'male' ||
    v.includes('/e') ||
    v === 'e/m'
  ) {
    return 'Erkek'
  }
  if (
    v.includes('kadın') ||
    v.includes('kadin') ||
    v === 'k' ||
    v === 'f' ||
    v === 'female' ||
    v.includes('/k') ||
    v === 'k/f'
  ) {
    return 'Kadın'
  }
  return undefined
}

function cleanName(s: string): string {
  return s
    .replace(/[^A-Za-zÇĞİÖŞÜçğıöşüÂâÎîÛû\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleUpperCase('tr-TR')
}

/** Extract structured fields from OCR / MRZ-ish text. */
export function parseTurkishIdCardText(ocrText: string): IdCardParseResult {
  const text = ocrText.replace(/\r/g, '\n')
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  const joined = lines.join('\n')
  const hints: string[] = []
  const fields: IdCardFields = {}
  let score = 0

  // TC: labeled or bare 11-digit valid
  const tcLabeled = joined.match(
    /(?:T\.?\s*C\.?\s*(?:Kimlik|KIMLIK)?\s*No[:.\s]*|Identity\s*No[:.\s]*)([1-9]\d{10})/i
  )
  const tcBare = joined.match(/\b([1-9]\d{10})\b/)
  const tc = (tcLabeled?.[1] || tcBare?.[1] || '').replace(/\D/g, '')
  if (tc && validateTC(tc)) {
    fields.tcKimlikNo = tc
    score += 0.35
    hints.push('tc')
  }

  // Soyad / Surname
  const soyadM = joined.match(
    /(?:Soyad[ıi]?|Surname|Family\s*Name)\s*[:.\s]*([A-Za-zÇĞİÖŞÜçğıöşüÂâ\s'-]{2,40})/i
  )
  if (soyadM) {
    fields.soyad = cleanName(soyadM[1])
    score += 0.15
    hints.push('soyad')
  }

  // Ad / Given name
  const adM = joined.match(
    /(?:\bAd[ıi]?\b|Given\s*Name[s]?|First\s*Name)\s*[:.\s]*([A-Za-zÇĞİÖŞÜçğıöşüÂâ\s'-]{2,40})/i
  )
  if (adM) {
    fields.ad = cleanName(adM[1])
    score += 0.15
    hints.push('ad')
  }

  if (fields.ad || fields.soyad) {
    fields.adSoyad = [fields.ad, fields.soyad].filter(Boolean).join(' ')
  }

  // Doğum tarihi
  const dogumM = joined.match(
    /(?:Do[gğ]um\s*Tarihi|Date\s*of\s*Birth|Birth\s*Date)\s*[:.\s]*([0-9./-]{8,12})/i
  )
  if (dogumM) {
    const d = normalizeDate(dogumM[1])
    if (d) {
      fields.dogumTarihi = d
      score += 0.2
      hints.push('dogum')
    }
  } else {
    const anyDate = joined.match(/\b(\d{2}[./-]\d{2}[./-]\d{4})\b/)
    if (anyDate) {
      const d = normalizeDate(anyDate[1])
      if (d) {
        fields.dogumTarihi = d
        score += 0.1
        hints.push('dogum_guess')
      }
    }
  }

  // Cinsiyet
  const cinsM = joined.match(
    /(?:Cinsiyet|Gender|Sex)\s*[:.\s]*([A-Za-zÇĞİÖŞÜçğıöşü/]{1,20})/i
  )
  if (cinsM) {
    const g = normalizeGender(cinsM[1])
    if (g) {
      fields.cinsiyet = g
      score += 0.15
      hints.push('cinsiyet')
    }
  } else if (/\bE\/M\b|\bERKEK\b/i.test(joined)) {
    fields.cinsiyet = 'Erkek'
    score += 0.08
    hints.push('cinsiyet_guess')
  } else if (/\bK\/F\b|\bKADIN\b|\bKADİN\b/i.test(joined)) {
    fields.cinsiyet = 'Kadın'
    score += 0.08
    hints.push('cinsiyet_guess')
  }

  // MRZ-like: IDTUR...<<... or similar
  const mrz = joined.match(/IDTUR([A-Z0-9<]{9})<<([A-Z0-9<]+)/i)
  if (mrz && !fields.adSoyad) {
    const names = mrz[2].replace(/</g, ' ').trim().split(/\s+/)
    if (names.length >= 2) {
      fields.soyad = cleanName(names[0])
      fields.ad = cleanName(names.slice(1).join(' '))
      fields.adSoyad = [fields.ad, fields.soyad].filter(Boolean).join(' ')
      score += 0.1
      hints.push('mrz')
    }
  }

  return {
    fields,
    confidence: Math.min(1, Math.round(score * 100) / 100),
    rawHints: hints,
  }
}
