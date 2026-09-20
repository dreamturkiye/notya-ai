/**
 * Belge routing helpers — lab PDFs use NOTYA-LAB-01 (/lab);
 * röntgen / imaging use NOTYA-BELGE-01 (Asistana raporla + CXR engine).
 */
import { YENIDOGAN_TABURCULUK_EPIKRIZI } from '@/lib/doktor/belgeTurleri'

export function belgeYenidoganTaburcuEpikriziMi(doc: {
  fileName?: string | null
  category?: string | null
}): boolean {
  const cat = String(doc.category || '').toLocaleLowerCase('tr-TR')
  const ad = String(doc.fileName || '').toLocaleLowerCase('tr-TR')
  if (cat === YENIDOGAN_TABURCULUK_EPIKRIZI.toLocaleLowerCase('tr-TR')) return true
  if (/yenido[ğg]an.*taburcu|taburcu.*yenido[ğg]an|yenido[ğg]an.*epikriz/.test(cat)) return true
  // Eski genel "Epikriz" yüklemeleri: dosya adında yenidoğan taburculuk izi
  if (/yenido[ğg]an.*taburcu|taburculuk_?epikriz|yenidogan_taburcu/.test(ad)) return true
  return false
}

export function belgeLabMi(doc: { fileName?: string | null; category?: string | null; fileType?: string | null }): boolean {
  if (belgeYenidoganTaburcuEpikriziMi(doc)) return false
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

/** Epikriz / reçete / konsültasyon PDF’lerine lab paneli CTA’sı sızmasın. */
function belgeIkincilLabCtaUygunMu(doc: { fileName?: string | null; category?: string | null }): boolean {
  if (belgeYenidoganTaburcuEpikriziMi(doc) || belgeRontgenMi(doc)) return false
  const cat = String(doc.category || '').toLocaleLowerCase('tr-TR')
  if (/epikriz|konsültasyon|konsultasyon|reçete|recete|\bsevk\b/.test(cat)) return false
  return true
}

/**
 * Lab / röntgen / asistan yolları. Etiket nötr “Değerlendir” — her yükleme laboratuvar değil
 * (Boss / Gökhan 2026-09-20). Epikriz vb. PDF’lerde ikincil lab CTA yok.
 */
export function belgeDegerlendirmeCtalari(doc: {
  fileName?: string | null
  category?: string | null
  fileType?: string | null
}): BelgeDegerlendirmeCta[] {
  if (belgeYenidoganTaburcuEpikriziMi(doc)) {
    return [{ tur: 'asistan', label: 'Asistana raporla', yol: 'analiz' }]
  }
  if (belgeLabMi(doc)) {
    return [{ tur: 'lab', label: 'Değerlendir', yol: 'lab' }]
  }
  if (belgeRontgenMi(doc)) {
    return [{ tur: 'rontgen', label: 'Değerlendir', yol: 'analiz' }]
  }
  const ctas: BelgeDegerlendirmeCta[] = [{ tur: 'asistan', label: 'Asistana raporla', yol: 'analiz' }]
  const ft = String(doc.fileType || '')
  if (belgeIkincilLabCtaUygunMu(doc) && (ft === 'application/pdf' || /csv|excel|spreadsheet/.test(ft))) {
    ctas.push({ tur: 'lab', label: 'Değerlendir', yol: 'lab' })
  }
  return ctas
}

/** Vault / list display: prefer Turkish “Röntgen” over raw “X-Ray”. */
export function belgeKategoriEtiket(doc: { fileName?: string | null; category?: string | null; fileType?: string | null }): string {
  if (belgeYenidoganTaburcuEpikriziMi(doc)) return YENIDOGAN_TABURCULUK_EPIKRIZI
  if (belgeRontgenMi(doc)) return 'Röntgen'
  if (belgeLabMi(doc)) return doc.category || 'Lab Sonucu'
  return doc.category || doc.fileType || 'Belge'
}
