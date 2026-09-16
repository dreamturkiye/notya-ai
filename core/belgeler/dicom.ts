/**
 * NOTYA-BELGE-04 — DICOM single-slice import in the browser.
 * Hospital exports (CR/DX/CT/MR/US) arrive as .dcm. We parse in the doctor's browser with dicom-parser,
 * take ONLY pixel data + the few technical tags needed to render (rows, cols, bits, photometric, rescale,
 * window), apply window/level, and hand a plain grayscale canvas to the de-id path. Patient tags are never
 * read into memory beyond the parse and never leave the device. Compressed transfer syntaxes (JPEG/J2K/RLE)
 * are refused with a clear message — the doctor exports as JPEG from the viewer instead.
 */
export type DicomSonuc = { canvas: HTMLCanvasElement; modaliteTahmini: string | null; genislik: number; yukseklik: number; not: string }

const UNCOMPRESSED = new Set(['1.2.840.10008.1.2', '1.2.840.10008.1.2.1', '1.2.840.10008.1.2.2'])

export function dicomMi(dosya: Blob, ad: string): boolean {
  return /\.dcm$/i.test(ad) || dosya.type === 'application/dicom'
}

export async function dicomCoz(dosya: Blob): Promise<DicomSonuc> {
  const dp = await import('dicom-parser')
  const bytes = new Uint8Array(await dosya.arrayBuffer())
  const ds = dp.parseDicom(bytes)
  const ts = ds.string('x00020010') || '1.2.840.10008.1.2.1'
  if (!UNCOMPRESSED.has(ts)) throw new Error('Sıkıştırılmış DICOM (JPEG/JPEG2000/RLE) tarayıcıda açılamıyor — görüntüyü PACS/viewer\'dan JPEG olarak dışa aktarın.')
  const rows = ds.uint16('x00280010') || 0, cols = ds.uint16('x00280011') || 0
  const bits = ds.uint16('x00280100') || 16, signed = (ds.uint16('x00280103') || 0) === 1
  const photometric = (ds.string('x00280004') || 'MONOCHROME2').trim()
  const samples = ds.uint16('x00280002') || 1
  const slope = parseFloat(ds.string('x00281053') || '1') || 1, intercept = parseFloat(ds.string('x00281052') || '0') || 0
  const wc0 = parseFloat((ds.string('x00281050') || '').split('\\')[0]), ww0 = parseFloat((ds.string('x00281051') || '').split('\\')[0])
  const modalite = (ds.string('x00080060') || '').trim() || null
  const frames = parseInt(ds.string('x00280008') || '1', 10) || 1
  const pde = ds.elements.x7fe00010
  if (!rows || !cols || !pde) throw new Error('DICOM piksel verisi bulunamadı.')
  const n = rows * cols
  const canvas = document.createElement('canvas'); canvas.width = cols; canvas.height = rows
  const ctx = canvas.getContext('2d')!; const img = ctx.createImageData(cols, rows)
  if (samples === 3) {
    // RGB (US, some derm captures): copy first frame as-is
    const off = pde.dataOffset
    for (let i = 0; i < n; i++) { img.data[i * 4] = bytes[off + i * 3]; img.data[i * 4 + 1] = bytes[off + i * 3 + 1]; img.data[i * 4 + 2] = bytes[off + i * 3 + 2]; img.data[i * 4 + 3] = 255 }
    ctx.putImageData(img, 0, 0)
    return { canvas, modaliteTahmini: modalite, genislik: cols, yukseklik: rows, not: `DICOM RGB${frames > 1 ? `, ${frames} kare — ilk kare` : ''}` }
  }
  const px = new Float32Array(n)
  const off = pde.dataOffset
  if (bits <= 8) { for (let i = 0; i < n; i++) px[i] = (signed ? (bytes[off + i] << 24) >> 24 : bytes[off + i]) * slope + intercept }
  else { const v = new DataView(bytes.buffer, bytes.byteOffset + off, n * 2); for (let i = 0; i < n; i++) px[i] = (signed ? v.getInt16(i * 2, true) : v.getUint16(i * 2, true)) * slope + intercept }
  let wc = wc0, ww = ww0
  if (!isFinite(wc) || !isFinite(ww) || ww <= 0) {
    // percentile window when tags are missing
    const sorted = Float32Array.from(px).sort()
    const lo = sorted[Math.floor(n * 0.005)], hi = sorted[Math.floor(n * 0.995)]
    wc = (lo + hi) / 2; ww = Math.max(1, hi - lo)
  }
  const invert = photometric === 'MONOCHROME1'
  const lo = wc - ww / 2
  for (let i = 0; i < n; i++) {
    let g = Math.round(((px[i] - lo) / ww) * 255); g = g < 0 ? 0 : g > 255 ? 255 : g; if (invert) g = 255 - g
    img.data[i * 4] = g; img.data[i * 4 + 1] = g; img.data[i * 4 + 2] = g; img.data[i * 4 + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  return { canvas, modaliteTahmini: modalite, genislik: cols, yukseklik: rows, not: `DICOM ${modalite || ''} ${bits}-bit, pencere ${Math.round(wc)}/${Math.round(ww)}${frames > 1 ? `, ${frames} kare — ilk kare` : ''}` }
}

/** DICOM Modality tag → Notya modality key guess */
export function dicomModaliteTahmini(mod: string | null, brans: string): string {
  const m = (mod || '').toUpperCase()
  if (m === 'CR' || m === 'DX') return brans === 'ortopedi' || brans === 'ftr' || brans === 'romatoloji' ? 'xr_kemik' : 'cxr'
  if (m === 'CT') return 'ct'; if (m === 'MR') return 'mr'; if (m === 'US') return 'us'; if (m === 'MG') return 'mamografi'
  if (m === 'ECG') return 'ekg'; if (m === 'OP' || m === 'OPT') return 'fundus'; if (m === 'PT') return 'pet'
  return 'serbest'
}
