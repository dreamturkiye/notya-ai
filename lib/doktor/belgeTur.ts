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
