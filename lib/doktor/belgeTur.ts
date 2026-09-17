/**
 * Belge routing helpers — lab PDFs use NOTYA-LAB-01 (/lab);
 * röntgen / imaging use NOTYA-BELGE-01 (Asistana raporla + CXR engine).
 */

export function belgeLabMi(doc: { fileName?: string | null; category?: string | null; fileType?: string | null }): boolean {
  const cat = String(doc.category || '').toLocaleLowerCase('tr-TR')
  const ad = String(doc.fileName || '').toLocaleLowerCase('tr-TR')
  if (/lab\s*sonucu|laboratuvar|biyokimya|hemogram|idrar|idrar\s*tahlil|cbc|urine|urinalysis/.test(cat)) return true
  if (/lab|laboratuvar|biyokimya|hemogram|idrar|cbc|urine|urinalysis|mock_lab/.test(ad)) return true
  if (/csv|excel|spreadsheet/.test(String(doc.fileType || ''))) return true
  return false
}

export function belgeRontgenMi(doc: { fileName?: string | null; category?: string | null }): boolean {
  const cat = String(doc.category || '').toLocaleLowerCase('tr-TR')
  const ad = String(doc.fileName || '').toLocaleLowerCase('tr-TR')
  return /röntgen|rontgen|x-?ray|grafi|cxr|akciğer|akciger|chest/.test(`${cat} ${ad}`)
}

export type BelgeDegerlendirmeCta = {
  tur: 'lab' | 'rontgen' | 'asistan'
  label: string
  yol: 'lab' | 'analiz'
}

/**
 * Exactly one primary CTA for lab and röntgen. Ambiguous PDF/CSV may offer lab as secondary.
 * Never show “Laboratuvarı değerlendir” on röntgen / X-ray images.
 */
export function belgeDegerlendirmeCtalari(doc: {
  fileName?: string | null
  category?: string | null
  fileType?: string | null
}): BelgeDegerlendirmeCta[] {
  if (belgeLabMi(doc)) {
    return [{ tur: 'lab', label: 'Laboratuvarı değerlendir', yol: 'lab' }]
  }
  if (belgeRontgenMi(doc)) {
    return [{ tur: 'rontgen', label: 'Röntgeni değerlendir', yol: 'analiz' }]
  }
  const ctas: BelgeDegerlendirmeCta[] = [{ tur: 'asistan', label: 'Asistana raporla', yol: 'analiz' }]
  const ft = String(doc.fileType || '')
  if (ft === 'application/pdf' || /csv|excel|spreadsheet/.test(ft)) {
    ctas.push({ tur: 'lab', label: 'Laboratuvarı değerlendir', yol: 'lab' })
  }
  return ctas
}

/** Vault / list display: prefer Turkish “Röntgen” over raw “X-Ray”. */
export function belgeKategoriEtiket(doc: { fileName?: string | null; category?: string | null; fileType?: string | null }): string {
  if (belgeRontgenMi(doc)) return 'Röntgen'
  if (belgeLabMi(doc)) return doc.category || 'Lab Sonucu'
  return doc.category || doc.fileType || 'Belge'
}
