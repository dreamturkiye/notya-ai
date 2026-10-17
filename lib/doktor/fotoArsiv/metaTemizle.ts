/**
 * FOTO-ARSIV-01 / FOTO-AI-01 — lossless metadata stripping (EXIF incl. GPS, XMP, IPTC, comments) for JPEG and PNG.
 *
 * Used on the server before ANY image is handed to a model: the browser already re-encodes through a canvas (which
 * drops metadata), this is the second, independent line of defence — the server never trusts the client's claim.
 * It never decodes pixels, so it cannot change the picture. The vault original is never touched by this file.
 * Pure (Buffer in, Buffer out); no dependencies.
 */

export function jpegMi(b: Uint8Array): boolean {
  return b.length > 4 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff
}

export function pngMi(b: Uint8Array): boolean {
  return b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
}

const ascii = (b: Uint8Array, bas: number, s: string): boolean => {
  for (let i = 0; i < s.length; i++) if (b[bas + i] !== s.charCodeAt(i)) return false
  return true
}

/** Which APPn / COM segments are kept: JFIF (APP0), ICC colour profile (APP2 "ICC_PROFILE"), Adobe colour transform (APP14). */
function jpegSegmentiKalsin(isaret: number, b: Uint8Array, veriBas: number): boolean {
  if (isaret === 0xe0) return true
  if (isaret === 0xe2) return ascii(b, veriBas, 'ICC_PROFILE')
  if (isaret === 0xee) return ascii(b, veriBas, 'Adobe')
  if (isaret >= 0xe1 && isaret <= 0xef) return false // EXIF/XMP (APP1), APP3..APP13, APP15
  if (isaret === 0xfe) return false // COM
  return true
}

/** Returns a copy without metadata segments, or null when the input is not a well-formed JPEG header chain. */
export function jpegMetaTemizle(giris: Uint8Array): Buffer | null {
  if (!jpegMi(giris)) return null
  const parcalar: Uint8Array[] = [giris.subarray(0, 2)]
  let i = 2
  while (i < giris.length) {
    if (giris[i] !== 0xff) return null
    let isaret = giris[i + 1]
    while (isaret === 0xff && i + 2 < giris.length) { i++; isaret = giris[i + 1] } // fill bytes
    if (isaret === undefined) return null
    // standalone markers without a length
    if (isaret === 0xd9) { parcalar.push(giris.subarray(i, i + 2)); return Buffer.concat(parcalar) }
    if (isaret === 0x01 || (isaret >= 0xd0 && isaret <= 0xd7)) { parcalar.push(giris.subarray(i, i + 2)); i += 2; continue }
    if (i + 4 > giris.length) return null
    const uzunluk = (giris[i + 2] << 8) | giris[i + 3]
    if (uzunluk < 2 || i + 2 + uzunluk > giris.length) return null
    if (isaret === 0xda) {
      // start of scan: the entropy-coded data runs to the end of the file; copy it verbatim
      parcalar.push(giris.subarray(i))
      return Buffer.concat(parcalar)
    }
    if (jpegSegmentiKalsin(isaret, giris, i + 4)) parcalar.push(giris.subarray(i, i + 2 + uzunluk))
    i += 2 + uzunluk
  }
  return null
}

const PNG_KALAN = new Set(['IHDR', 'PLTE', 'IDAT', 'IEND', 'tRNS', 'gAMA', 'cHRM', 'sRGB', 'iCCP', 'sBIT', 'pHYs', 'bKGD', 'acTL', 'fcTL', 'fdAT'])

/** Drops eXIf / tEXt / iTXt / zTXt / tIME and every unknown ancillary chunk. Null when the chunk chain is malformed. */
export function pngMetaTemizle(giris: Uint8Array): Buffer | null {
  if (!pngMi(giris)) return null
  const parcalar: Uint8Array[] = [giris.subarray(0, 8)]
  let i = 8
  while (i + 8 <= giris.length) {
    const uzunluk = ((giris[i] << 24) | (giris[i + 1] << 16) | (giris[i + 2] << 8) | giris[i + 3]) >>> 0
    const tur = String.fromCharCode(giris[i + 4], giris[i + 5], giris[i + 6], giris[i + 7])
    const toplam = 12 + uzunluk
    if (i + toplam > giris.length) return null
    if (PNG_KALAN.has(tur)) parcalar.push(giris.subarray(i, i + toplam))
    i += toplam
    if (tur === 'IEND') return Buffer.concat(parcalar)
  }
  return null
}

/** true when the JPEG still carries an EXIF/XMP/IPTC/comment segment (used by tests and by the server guard). */
export function jpegMetaVarMi(giris: Uint8Array): boolean {
  if (!jpegMi(giris)) return false
  let i = 2
  while (i + 4 <= giris.length) {
    if (giris[i] !== 0xff) return false
    const isaret = giris[i + 1]
    if (isaret === 0xda || isaret === 0xd9) return false
    if (isaret === 0xff) { i++; continue }
    if (isaret === 0x01 || (isaret >= 0xd0 && isaret <= 0xd7)) { i += 2; continue }
    const uzunluk = (giris[i + 2] << 8) | giris[i + 3]
    if (uzunluk < 2) return false
    if (!jpegSegmentiKalsin(isaret, giris, i + 4)) return true
    i += 2 + uzunluk
  }
  return false
}

/** One entry point: strips what it can strip, null for any other format (the caller then refuses to send it to a model). */
export function gorselMetaTemizle(giris: Uint8Array): { bytes: Buffer; mime: 'image/jpeg' | 'image/png' } | null {
  const j = jpegMetaTemizle(giris)
  if (j) return { bytes: j, mime: 'image/jpeg' }
  const p = pngMetaTemizle(giris)
  if (p) return { bytes: p, mime: 'image/png' }
  return null
}
