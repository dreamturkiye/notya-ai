/**
 * Test-only synthetic images and model answers for the photo archive / photo AI. NO real photo, NO patient data: gradients,
 * checkerboards and a few marker bytes. Used by unit tests, the cross-doctor isolation suite and the Playwright screenshot script.
 * Pure Node (zlib); no image library.
 */
import { deflateSync } from 'node:zlib'
import { GENEL_BAYRAKLAR, PEDIATRIK_BAYRAKLAR } from '@/lib/doktor/muayeneEk/foto/sema'

const CRC_TABLO = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0 }
  return t
})()
const crc32 = (b: Uint8Array): number => { let c = 0xffffffff; for (const x of b) c = CRC_TABLO[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }

function parca(tur: string, veri: Uint8Array): Buffer {
  const uz = Buffer.alloc(4); uz.writeUInt32BE(veri.length)
  const govde = Buffer.concat([Buffer.from(tur, 'ascii'), Buffer.from(veri)])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(govde))
  return Buffer.concat([uz, govde, crc])
}

export type PikselFonksiyonu = (x: number, y: number, w: number, h: number) => [number, number, number]

/** Warm skin-tone-ish gradient with a darker "lesion" disc and a light ruler strip: enough structure for visual checks. */
export const SENTETIK_DESEN: PikselFonksiyonu = (x, y, w, h) => {
  const r = 205 - Math.round((y / h) * 30), g = 160 - Math.round((y / h) * 25), b = 135 - Math.round((x / w) * 15)
  const dx = x - w * 0.55, dy = y - h * 0.5
  if (dx * dx + dy * dy < (Math.min(w, h) * 0.12) ** 2) return [120, 55, 50]
  if (y > h * 0.88 && y < h * 0.93 && x > w * 0.1 && x < w * 0.5) return (Math.floor((x - w * 0.1) / (w * 0.04)) % 2 ? [250, 250, 250] : [30, 30, 30])
  return [r, g, b]
}

/** A valid PNG (RGB, 8-bit). */
export function sentetikPng(w = 64, h = 48, f: PikselFonksiyonu = SENTETIK_DESEN, ekParcalar: Buffer[] = []): Buffer {
  const ham = Buffer.alloc((w * 3 + 1) * h)
  for (let y = 0; y < h; y++) {
    ham[y * (w * 3 + 1)] = 0
    for (let x = 0; x < w; x++) { const [r, g, b] = f(x, y, w, h); const o = y * (w * 3 + 1) + 1 + x * 3; ham[o] = r; ham[o + 1] = g; ham[o + 2] = b }
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), parca('IHDR', ihdr), ...ekParcalar, parca('IDAT', deflateSync(ham)), parca('IEND', Buffer.alloc(0))])
}

/** A PNG with an eXIf and a tEXt chunk (metadata that must be stripped). */
export function metaliPng(gizli: string): Buffer {
  return sentetikPng(32, 24, SENTETIK_DESEN, [parca('eXIf', Buffer.from(`Exif GPS ${gizli}`)), parca('tEXt', Buffer.from(`Comment\0${gizli}`))])
}

/**
 * Structurally valid JPEG chain (SOI, JFIF, EXIF with GPS text, COM, SOS + scan bytes, EOI) — NOT decodable by an image
 * decoder (the scan holds `icerik` as filler), which is exactly what the byte-level tests need. `icerik` survives stripping.
 */
export function sentetikJpeg(icerik: string, exifGizli = 'GPS 41.0082N 28.9784E Samsung SM-G991B'): Buffer {
  const seg = (isaret: number, veri: Buffer) => { const uz = Buffer.alloc(2); uz.writeUInt16BE(veri.length + 2); return Buffer.concat([Buffer.from([0xff, isaret]), uz, veri]) }
  const jfif = seg(0xe0, Buffer.from('JFIF\0\x01\x01\x00\x00\x01\x00\x01\x00\x00', 'binary'))
  const exif = seg(0xe1, Buffer.from(`Exif\0\0${exifGizli}`))
  const com = seg(0xfe, Buffer.from(`kamera ${exifGizli}`))
  const sos = seg(0xda, Buffer.from([0x01, 0x01, 0x00, 0x00, 0x3f, 0x00]))
  return Buffer.concat([Buffer.from([0xff, 0xd8]), jfif, exif, com, sos, Buffer.from(icerik), Buffer.from([0xff, 0xd9])])
}

export const dataUrl = (b: Buffer, mime: 'image/png' | 'image/jpeg' = 'image/png'): string => `data:${mime};base64,${b.toString('base64')}`

/** A raw model answer that passes the strict schema (pediatric codes only when mod === 'pediatrik'). `izlek` is placed in the morphology text. */
export function sahteFotoAiYaniti(izlek = 'sentetik', mod: 'genel' | 'pediatrik' = 'genel'): string {
  return JSON.stringify({
    kalite: { genel: 'iyi', bulaniklik: 'yok', isik: 'yeterli', kadraj: 'uygun', olcekReferansi: true, bolgeBelirlenebilir: true, yenidenCekim: null },
    degerlendirilebilir: true,
    bolge: { id: 'kol-sag', guven: 'orta' },
    morfoloji: { renk: `eritemli ${izlek}`, boyut: null, sinir: 'düzgün', yuzey: 'düz', dagilim: 'tek odak', sayi: 'tek' },
    gozlemler: [{ metin: `Sınırlı eritem alanı görülüyor (${izlek}).`, guven: 'orta' }],
    kirmiziBayraklar: (mod === 'pediatrik' ? [...GENEL_BAYRAKLAR, ...PEDIATRIK_BAYRAKLAR] : GENEL_BAYRAKLAR).map((kod) => ({ kod, durum: 'yok', kriter: 'Görüntüde bu ölçüt izlenmiyor.', not: '' })),
    ayiricilar: [{ ad: 'Kontakt dermatit', guven: 'dusuk', ayirtEdici: 'Maruziyet öyküsü ve dağılım ayırt eder.' }],
    oneri: null,
    sinirlar: ['Tek bir görüntüden değerlendirildi.'],
  })
}

/** The quality-gate answer. */
export function sahteKaliteYaniti(kotu = false): string {
  return JSON.stringify({
    kalite: kotu
      ? { genel: 'yetersiz', bulaniklik: 'belirgin', isik: 'az', kadraj: 'uygun-degil', olcekReferansi: false, bolgeBelirlenebilir: false, yenidenCekim: 'Daha aydınlık bir yerde yeniden çekin.' }
      : { genel: 'iyi', bulaniklik: 'yok', isik: 'yeterli', kadraj: 'uygun', olcekReferansi: true, bolgeBelirlenebilir: true, yenidenCekim: null },
    bolge: { id: kotu ? null : 'kol-sag', guven: kotu ? 'dusuk' : 'orta' },
  })
}

export function sahteKarsilastirmaYaniti(izlek = 'sentetik'): string {
  return JSON.stringify({
    karsilastirilabilir: true, neden: null,
    degisimler: [{ etiket: 'kuculme', metin: `Eritemli alan küçülmüş görünüyor (${izlek}).`, guven: 'orta' }],
    ozet: `İki fotoğraf arasında belirgin küçülme izleniyor (${izlek}).`, genelGuven: 'orta', oneri: null, sinirlar: [],
  })
}
