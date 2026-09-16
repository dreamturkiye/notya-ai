// NOTYA-LAB-01 — offline smoke test of the structural extraction grammar on a synthetic Turkish lab PDF.
// Usage: npx tsx scripts/belgeler/lab_smoke.ts   (makes /tmp/lab-smoke.pdf with pdf-lib-free minimal generator via pdfkit? -> uses jsPDF-like manual PDF)
import { pdfMetinCoz } from '../../core/lab/cikarim'
import { satirKur, uzlastir } from '../../core/lab/trend'
import fs from 'fs'

function miniPdf(lines: string[]): Buffer {
  // minimal single-page PDF with Helvetica text lines (WinAnsi; Turkish chars replaced for the smoke test)
  const ascii = (s: string) => s.replace(/[çÇ]/g, 'c').replace(/[ğĞ]/g, 'g').replace(/[ıİ]/g, 'i').replace(/[öÖ]/g, 'o').replace(/[şŞ]/g, 's').replace(/[üÜ]/g, 'u').replace(/[()\\]/g, ' ')
  const content = ['BT', '/F1 11 Tf', '14 TL', '40 780 Td', ...lines.map((l) => `(${ascii(l)}) Tj T*`), 'ET'].join('\n')
  const objs = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>', `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>']
  let out = '%PDF-1.4\n'; const offs: number[] = []
  objs.forEach((o, i) => { offs.push(Buffer.byteLength(out)); out += `${i + 1} 0 obj\n${o}\nendobj\n` })
  const xref = Buffer.byteLength(out)
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join('') + `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return Buffer.from(out, 'binary')
}

;(async () => {
  const pdf = miniPdf([
    'ACIBADEM LABORATUVAR   Numune Tarihi: 12.09.2026   Rapor Tarihi: 13.09.2026',
    'Hasta: Deneme Hasta   Dogum: 01.01.2019',
    'Test                 Sonuc     Birim     Referans',
    'Hemoglobin           10,8      g/dL      11,5 - 15,5   L',
    'Lokosit (WBC)        14,2      10^3/uL   5,0 - 14,5',
    'Trombosit            412       10^3/uL   150 - 450',
    'CRP                  48        mg/L      0 - 5         H',
    'Glukoz (Aclik)       92        mg/dL     70 - 100',
    'ALT (SGPT)           78        U/L       0 - 41        H',
    'Potasyum             6,8       mmol/L    3,5 - 5,1     H',
    'Ferritin             8         ng/mL     15 - 150      L',
  ])
  fs.writeFileSync('/tmp/lab-smoke.pdf', pdf)
  const r = await pdfMetinCoz(pdf)
  console.log('not:', r.not, '| numune:', r.numune_tarihi, '| rows:', r.satirlar.length)
  for (const s of r.satirlar) console.log(' ', JSON.stringify(s))
  const rows = r.satirlar.map((h) => satirKur(h, [{ canonical_key: 'ALT', kanonik_deger: 35, flag: 'normal', numune_tarihi: '2026-06-01' }, { canonical_key: 'Hb', kanonik_deger: 12.1, flag: 'normal', numune_tarihi: '2026-06-01' }]))
  for (const s of rows) console.log(' →', s.raw_name, '|', s.canonical_key, '|', s.value_num, s.unit, '| flag', s.flag, '| kritik', s.kritik, '| trend', s.trend, s.delta_pct ?? '')
  const u = uzlastir(r.satirlar, r.satirlar.map((s) => s.raw_name === 'CRP' ? { ...s, value: '4,8' } : s))
  console.log('uyusmazlik:', JSON.stringify(u.uyusmazlik))
})().catch((e) => { console.error('SMOKE FAIL', e); process.exit(1) })
