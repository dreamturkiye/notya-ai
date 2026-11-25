/**
 * HASTA-ALANI-MARKA — upload gate for the doctor's portal logo (and the Notya Klinik clinic logo).
 *
 * Rules (enforced on the server whatever the browser sent):
 *   • PNG, JPEG or WebP only, decided by the file's MAGIC BYTES — the declared type / extension is ignored. SVG (script
 *     surface), GIF, HEIC, PDF, anything else → rejected.
 *   • 2 MB at most, and at most 1024 px on either side (the settings page resizes to 512 px in the browser before upload;
 *     a raw API call that skips that is refused instead of stored).
 *   • Metadata stripped before the bytes are stored: PNG ancillary text / EXIF / time chunks, JPEG APP1–APP15 (EXIF, XMP,
 *     ICC, Photoshop IRB…) and COM segments, WebP EXIF / XMP chunks (+ their VP8X flags). Pixels are not touched.
 * Pure (Buffer only) — no image library needed, unit-tested in markaGorsel.test.ts.
 */

export const MARKA_MAX_BAYT = 2 * 1024 * 1024
export const MARKA_MAX_PIKSEL = 1024
/** What the settings page resizes to before upload (defined in the client-safe marka.ts). */
export { MARKA_HEDEF_PIKSEL } from './marka'

export type MarkaMime = 'image/png' | 'image/jpeg' | 'image/webp'
export const MARKA_UZANTI: Record<MarkaMime, 'png' | 'jpg' | 'webp'> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }

export class MarkaGorselHatasi extends Error {
  constructor(message: string) { super(message); this.name = 'MarkaGorselHatasi' }
}

const PNG_IMZA = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

/** The real type from the first bytes, or null. */
export function gorselTuruKoklayarak(b: Buffer): MarkaMime | null {
  if (b.length >= 8 && b.subarray(0, 8).equals(PNG_IMZA)) return 'image/png'
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (b.length >= 12 && b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') return 'image/webp'
  return null
}

/** Width × height from the header, or null when it cannot be read (→ rejected). */
export function gorselBoyutu(b: Buffer, mime: MarkaMime): { en: number; boy: number } | null {
  try {
    if (mime === 'image/png') {
      if (b.toString('latin1', 12, 16) !== 'IHDR') return null
      return { en: b.readUInt32BE(16), boy: b.readUInt32BE(20) }
    }
    if (mime === 'image/jpeg') {
      let i = 2
      while (i + 9 < b.length) {
        if (b[i] !== 0xff) { i++; continue }
        const m = b[i + 1]
        if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue }
        const uz = b.readUInt16BE(i + 2)
        // SOF0..SOF15 except DHT (C4), JPG (C8), DAC (CC)
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { boy: b.readUInt16BE(i + 5), en: b.readUInt16BE(i + 7) }
        if (m === 0xda) return null
        i += 2 + uz
      }
      return null
    }
    // WebP: first chunk after the 12-byte RIFF header
    const tur = b.toString('latin1', 12, 16)
    if (tur === 'VP8X') return { en: 1 + b.readUIntLE(24, 3), boy: 1 + b.readUIntLE(27, 3) }
    if (tur === 'VP8 ') return { en: b.readUInt16LE(26) & 0x3fff, boy: b.readUInt16LE(28) & 0x3fff }
    if (tur === 'VP8L') {
      const v = b.readUInt32LE(21)
      return { en: (v & 0x3fff) + 1, boy: ((v >> 14) & 0x3fff) + 1 }
    }
    return null
  } catch {
    return null
  }
}

/** PNG: keep critical chunks and the few ancillary ones that change how pixels look; drop text / EXIF / time / iCCP. */
const PNG_KORU = new Set(['IHDR', 'PLTE', 'IDAT', 'IEND', 'tRNS', 'gAMA', 'cHRM', 'sRGB', 'pHYs', 'sBIT', 'bKGD'])

function pngTemizle(b: Buffer): Buffer {
  const parcalar: Buffer[] = [PNG_IMZA]
  let i = 8
  while (i + 12 <= b.length) {
    const uz = b.readUInt32BE(i)
    const tur = b.toString('latin1', i + 4, i + 8)
    const son = i + 12 + uz
    if (son > b.length) throw new MarkaGorselHatasi('Görsel dosyası bozuk görünüyor.')
    if (PNG_KORU.has(tur)) parcalar.push(b.subarray(i, son))
    i = son
    if (tur === 'IEND') break
  }
  return Buffer.concat(parcalar)
}

/** JPEG: drop APP1..APP15 (EXIF, XMP, ICC, IPTC, Adobe IRB, MPF…) and COM; keep APP0 (JFIF) and APP14 "Adobe" (colour transform). */
function jpegTemizle(b: Buffer): Buffer {
  const parcalar: Buffer[] = [b.subarray(0, 2)]
  let i = 2
  while (i + 4 <= b.length) {
    if (b[i] !== 0xff) throw new MarkaGorselHatasi('Görsel dosyası bozuk görünüyor.')
    const m = b[i + 1]
    if (m === 0xda) { parcalar.push(b.subarray(i)); return Buffer.concat(parcalar) } // start of scan → rest is image data
    if (m === 0xd9) { parcalar.push(b.subarray(i, i + 2)); return Buffer.concat(parcalar) }
    const uz = b.readUInt16BE(i + 2)
    const son = i + 2 + uz
    if (son > b.length) throw new MarkaGorselHatasi('Görsel dosyası bozuk görünüyor.')
    const app14Adobe = m === 0xee && b.toString('latin1', i + 4, i + 9) === 'Adobe'
    const at = (m >= 0xe1 && m <= 0xef && !app14Adobe) || m === 0xfe
    if (!at) parcalar.push(b.subarray(i, son))
    i = son
  }
  throw new MarkaGorselHatasi('Görsel dosyası bozuk görünüyor.')
}

/** WebP: drop EXIF / XMP chunks and clear their flags in VP8X. */
function webpTemizle(b: Buffer): Buffer {
  const parcalar: Buffer[] = []
  let i = 12
  while (i + 8 <= b.length) {
    const tur = b.toString('latin1', i, i + 4)
    const uz = b.readUInt32LE(i + 4)
    const son = i + 8 + uz + (uz & 1)
    if (i + 8 + uz > b.length) throw new MarkaGorselHatasi('Görsel dosyası bozuk görünüyor.')
    if (tur !== 'EXIF' && tur !== 'XMP ') {
      const p = Buffer.from(b.subarray(i, Math.min(son, b.length)))
      if (tur === 'VP8X') p[8] = p[8] & ~0x0c // clear EXIF (0x08) + XMP (0x04) flags
      parcalar.push(p)
    }
    i = son
  }
  const govde = Buffer.concat(parcalar)
  const bas = Buffer.alloc(12)
  bas.write('RIFF', 0, 'latin1'); bas.writeUInt32LE(govde.length + 4, 4); bas.write('WEBP', 8, 'latin1')
  return Buffer.concat([bas, govde])
}

export function metaVeriTemizle(b: Buffer, mime: MarkaMime): Buffer {
  if (mime === 'image/png') return pngTemizle(b)
  if (mime === 'image/jpeg') return jpegTemizle(b)
  return webpTemizle(b)
}

/**
 * The whole gate: type by magic bytes, size, pixel size, metadata strip. Returns the bytes to store + their real type,
 * or throws MarkaGorselHatasi with a Turkish message the doctor sees.
 */
export function markaGorseliHazirla(ham: Buffer): { bayt: Buffer; mime: MarkaMime; en: number; boy: number } {
  if (!ham.length) throw new MarkaGorselHatasi('Dosya boş.')
  if (ham.length > MARKA_MAX_BAYT) throw new MarkaGorselHatasi('Logo en fazla 2 MB olabilir.')
  const mime = gorselTuruKoklayarak(ham)
  if (!mime) throw new MarkaGorselHatasi('Yalnızca PNG, JPG veya WebP yükleyebilirsiniz (SVG kabul edilmez).')
  const boyut = gorselBoyutu(ham, mime)
  if (!boyut || boyut.en < 1 || boyut.boy < 1) throw new MarkaGorselHatasi('Görsel dosyası okunamadı.')
  if (boyut.en > MARKA_MAX_PIKSEL || boyut.boy > MARKA_MAX_PIKSEL) throw new MarkaGorselHatasi(`Görsel en fazla ${MARKA_MAX_PIKSEL} piksel olabilir; Ayarlar sayfasından yükleyin, sizin için küçültülür.`)
  const bayt = metaVeriTemizle(ham, mime)
  return { bayt, mime, ...boyut }
}
