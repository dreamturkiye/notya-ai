/**
 * DAH-LAB-BELGELER — synthetic lab report fixture (NOT a real patient document).
 * Builds a one-page digital PDF with a real text layer (Helvetica, ASCII only) so the structural pass
 * (pdfjs → satirCoz) and the vision pass see the same printed rows. Used by core/lab/cikarim.test.ts and by
 * scripts/dahiliye-smoke.mts (real upload → cikar → raporla → onayla path).
 */
export type SentetikSatir = { ad: string; deger: string; birim: string; ref: string; bayrak?: string; beklenenKey: string }

export const SENTETIK_SATIRLAR: SentetikSatir[] = [
  { ad: 'HbA1c', deger: '7.9', birim: '%', ref: '4 - 6', bayrak: 'H', beklenenKey: 'HbA1c' },
  { ad: 'Glukoz', deger: '131', birim: 'mg/dL', ref: '70 - 100', bayrak: 'H', beklenenKey: 'Glu' },
  { ad: 'Kreatinin', deger: '88', birim: 'umol/L', ref: '62 - 106', beklenenKey: 'Kre' },
  { ad: 'LDL kolesterol', deger: '3.1', birim: 'mmol/L', ref: '0 - 3.4', beklenenKey: 'LDL' },
  { ad: 'Potasyum', deger: '4.6', birim: 'mmol/L', ref: '3.5 - 5.1', beklenenKey: 'K' },
  { ad: 'ALT (SGPT)', deger: '22', birim: 'U/L', ref: '0 - 41', beklenenKey: 'ALT' },
]

const trTarih = (iso: string) => { const [y, m, d] = iso.split('-'); return `${d}.${m}.${y}` }

/** Printed lines, top to bottom. `numune` / `rapor` are ISO dates. */
export function sentetikLabSatirlari(numune: string, rapor: string, hastaAd = 'TEST Sentetik Hasta'): string[] {
  return [
    'NOTYA QA SENTETIK LABORATUVAR (gercek kisi degildir)',
    `Hasta: ${hastaAd}`,
    `Numune tarihi: ${trTarih(numune)}`,
    `Rapor tarihi: ${trTarih(rapor)}`,
    'Test  Sonuc  Birim  Referans',
    ...SENTETIK_SATIRLAR.map((s) => [s.ad, s.deger, s.birim, s.ref, s.bayrak].filter(Boolean).join('  ')),
  ]
}

const pdfMetin = (s: string) => s.replace(/[\\()]/g, (c) => `\\${c}`)

/** Minimal valid PDF 1.4 (catalog, pages, page, Helvetica, content stream) with a correct xref table. */
export function sentetikLabPdf(numune: string, rapor: string, hastaAd?: string): Buffer {
  return pdfYap(sentetikLabSatirlari(numune, rapor, hastaAd))
}

/** DAH-WOW-NEXT C5 — synthetic e-Nabiz "Tahlillerim" history printout: same tests on two different dates, one date per row. */
export const SENTETIK_ENABIZ = [
  { ad: 'HbA1c', eski: '8.1', yeni: '7.4', birim: '%', ref: '4 - 6' },
  { ad: 'LDL kolesterol', eski: '142', yeni: '118', birim: 'mg/dL', ref: '0 - 130' },
  { ad: 'Vitamin B12', eski: '185', yeni: '172', birim: 'pg/mL', ref: '197 - 771' },
] as const
export function sentetikEnabizSatirlari(eski: string, yeni: string, hastaAd = 'TEST Sentetik Hasta'): string[] {
  return [
    'e-Nabiz - Tahlillerim (NOTYA QA SENTETIK CIKTI, gercek kisi degildir)',
    `Ad Soyad: ${hastaAd}`,
    'Tarih  Tahlil  Sonuc  Birim  Referans',
    ...SENTETIK_ENABIZ.map((s) => [trTarih(yeni), s.ad, s.yeni, s.birim, s.ref].join('  ')),
    ...SENTETIK_ENABIZ.map((s) => [trTarih(eski), s.ad, s.eski, s.birim, s.ref].join('  ')),
  ]
}
export function sentetikEnabizPdf(eski: string, yeni: string, hastaAd?: string): Buffer {
  return pdfYap(sentetikEnabizSatirlari(eski, yeni, hastaAd))
}

function pdfYap(satirlar: string[]): Buffer {
  if (satirlar.some((l) => /[^\x20-\x7e]/.test(l))) throw new Error('sentetik PDF yalnız ASCII metin taşır')
  const icerik = ['BT', '/F1 11 Tf', ...satirlar.map((l, i) => `1 0 0 1 50 ${780 - i * 22} Tm (${pdfMetin(l)}) Tj`), 'ET'].join('\n')
  const nesneler = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    `<< /Length ${Buffer.byteLength(icerik, 'latin1')} >>\nstream\n${icerik}\nendstream`,
  ]
  let out = '%PDF-1.4\n'
  const ofsetler: number[] = []
  nesneler.forEach((n, i) => { ofsetler.push(Buffer.byteLength(out, 'latin1')); out += `${i + 1} 0 obj\n${n}\nendobj\n` })
  const xref = Buffer.byteLength(out, 'latin1')
  out += `xref\n0 ${nesneler.length + 1}\n0000000000 65535 f \n${ofsetler.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`
  out += `trailer\n<< /Size ${nesneler.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return Buffer.from(out, 'latin1')
}
