/**
 * Hasta Hakları m.26 — iki nüsha. Biri dosyada kalır, biri hastaya verilir.
 * Baytlar belge kasasına gider. E-imza iddia edilmez.
 * Pediatri ve kardiyoloji bu kaydı almaz.
 */

export const NUSHA_ROLLERI = [
  { id: 'dosya', ad: 'Dosya nüshası', aciklama: 'Hasta dosyasında kalır' },
  { id: 'hasta', ad: 'Hasta nüshası', aciklama: 'Hastaya verilir' },
] as const

export type NushaRol = (typeof NUSHA_ROLLERI)[number]['id']

export function nushaRolMu(s: string): s is NushaRol {
  return s === 'dosya' || s === 'hasta'
}

export function nushaNotu(rol: NushaRol, iso: string, seansId: string): string {
  return `iki-nusha|${rol}|${iso}|${seansId}`
}

export function nushaNotCoz(notes: string | null | undefined): { rol: NushaRol; iso: string; seansId: string } | null {
  if (!notes) return null
  const p = notes.split('|')
  if (p.length !== 4 || p[0] !== 'iki-nusha' || !nushaRolMu(p[1]) || !/^\d{4}-\d{2}-\d{2}$/.test(p[2]) || !p[3]) return null
  return { rol: p[1], iso: p[2], seansId: p[3] }
}

function pdfKacis(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

/** İki ayrı PDF. Metin Latin-1 Helvetica ile açılır. E-imza alanı yoktur. */
export function nushaPdf(rol: NushaRol, iso: string): Buffer {
  const baslik = rol === 'dosya'
    ? 'Nusha: dosya. Bu kopya hasta dosyasinda kalir.'
    : 'Nusha: hasta. Bu kopya hastaya verilir.'
  const lines = [
    'Hasta Haklari Yonetmeligi m.26',
    baslik,
    `Tarih: ${iso}`,
    'E-imza iddia edilmez.',
  ]
  const commands = ['BT', '/F1 14 Tf', '72 720 Td']
  lines.forEach((line, i) => {
    if (i > 0) commands.push('0 -22 Td')
    commands.push(`(${pdfKacis(line)}) Tj`)
  })
  commands.push('ET')
  const stream = commands.join('\n')
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n',
    `4 0 obj << /Length ${Buffer.byteLength(stream)} >> stream\n${stream}\nendstream\nendobj\n`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n',
  ]
  let body = '%PDF-1.4\n'
  const offsets = [0]
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(body))
    body += obj
  }
  const xrefAt = Buffer.byteLength(body)
  let xref = 'xref\n0 6\n0000000000 65535 f \n'
  for (let i = 1; i <= 5; i += 1) xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  return Buffer.from(`${body}${xref}trailer << /Size 6 /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF`)
}
