/**
 * HASTA-ALANI-MARKA — logo upload gate (lib/portal/markaGorsel.ts): type by magic bytes (no SVG / GIF / declared-type
 * tricks), 2 MB, 1024 px, metadata stripped from PNG / JPEG / WebP while the image data is kept byte for byte.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { deflateSync } from 'node:zlib'
import { MARKA_MAX_BAYT, MarkaGorselHatasi, gorselBoyutu, gorselTuruKoklayarak, markaGorseliHazirla, metaVeriTemizle } from './markaGorsel'

function crc32(b: Buffer): number {
  let c = ~0
  for (const x of b) { c ^= x; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)) }
  return ~c >>> 0
}
function pngParca(tur: string, veri: Buffer): Buffer {
  const uz = Buffer.alloc(4); uz.writeUInt32BE(veri.length)
  const tv = Buffer.concat([Buffer.from(tur, 'latin1'), veri])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(tv))
  return Buffer.concat([uz, tv, crc])
}
function png(en: number, boy: number, ekler: Buffer[] = []): Buffer {
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(en, 0); ihdr.writeUInt32BE(boy, 4); ihdr[8] = 8; ihdr[9] = 6
  const satir = Buffer.alloc(1 + en * 4)
  const ham = Buffer.concat(Array.from({ length: Math.min(boy, 4) }, () => satir))
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), pngParca('IHDR', ihdr), ...ekler, pngParca('IDAT', deflateSync(ham)), pngParca('IEND', Buffer.alloc(0))])
}
function seg(m: number, veri: Buffer): Buffer {
  const b = Buffer.alloc(4); b[0] = 0xff; b[1] = m; b.writeUInt16BE(veri.length + 2, 2)
  return Buffer.concat([b, veri])
}
function jpeg(en: number, boy: number): Buffer {
  const sof = Buffer.alloc(15); sof[0] = 8; sof.writeUInt16BE(boy, 1); sof.writeUInt16BE(en, 3); sof[5] = 3
  return Buffer.concat([
    Buffer.from([0xff, 0xd8]),
    seg(0xe0, Buffer.from('JFIF\0\x01\x01\0\0\x01\0\x01\0\0', 'latin1')),
    seg(0xe1, Buffer.from('Exif\0\0GPS-41.0082-28.9784-iPhone', 'latin1')),
    seg(0xe1, Buffer.from('http://ns.adobe.com/xap/1.0/\0<x:xmpmeta>author</x:xmpmeta>', 'latin1')),
    seg(0xfe, Buffer.from('comment: Dr. private', 'latin1')),
    seg(0xdb, Buffer.alloc(65, 1)),
    seg(0xc0, sof),
    seg(0xda, Buffer.from([3, 1, 0, 2, 0x11, 3, 0x11, 0, 0x3f, 0])),
    Buffer.from([0x12, 0x34, 0x56, 0xff, 0x00, 0x78]),
    Buffer.from([0xff, 0xd9]),
  ])
}
function riffParca(tur: string, veri: Buffer): Buffer {
  const b = Buffer.alloc(8); b.write(tur, 0, 'latin1'); b.writeUInt32LE(veri.length, 4)
  return Buffer.concat([b, veri, veri.length & 1 ? Buffer.alloc(1) : Buffer.alloc(0)])
}
function webp(en: number, boy: number): Buffer {
  const x = Buffer.alloc(10); x[0] = 0x08 | 0x04 | 0x10; x.writeUIntLE(en - 1, 4, 3); x.writeUIntLE(boy - 1, 7, 3)
  const govde = Buffer.concat([riffParca('VP8X', x), riffParca('VP8L', Buffer.from([0x2f, 0, 0, 0, 0, 0xaa, 0xbb])), riffParca('EXIF', Buffer.from('Exif GPS 41.0', 'latin1')), riffParca('XMP ', Buffer.from('<x:xmpmeta/>', 'latin1'))])
  const bas = Buffer.alloc(12); bas.write('RIFF', 0, 'latin1'); bas.writeUInt32LE(govde.length + 4, 4); bas.write('WEBP', 8, 'latin1')
  return Buffer.concat([bas, govde])
}

const hata = (f: () => unknown, re: RegExp) => assert.throws(f, (e: unknown) => e instanceof MarkaGorselHatasi && re.test((e as Error).message))

describe('type is decided by magic bytes', () => {
  it('PNG, JPEG, WebP are recognised', () => {
    assert.equal(gorselTuruKoklayarak(png(4, 4)), 'image/png')
    assert.equal(gorselTuruKoklayarak(jpeg(4, 4)), 'image/jpeg')
    assert.equal(gorselTuruKoklayarak(webp(4, 4)), 'image/webp')
  })
  it('SVG is rejected — plain, with an XML prolog, or renamed to .png', () => {
    hata(() => markaGorseliHazirla(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')), /SVG kabul edilmez/)
    hata(() => markaGorseliHazirla(Buffer.from('<?xml version="1.0"?><svg/>')), /SVG kabul edilmez/)
    hata(() => markaGorseliHazirla(Buffer.from('﻿<svg onload="x"/>')), /SVG kabul edilmez/)
  })
  it('GIF, HTML, PDF, empty are rejected', () => {
    hata(() => markaGorseliHazirla(Buffer.from('GIF89a\x01\0\x01\0', 'latin1')), /PNG, JPG veya WebP/)
    hata(() => markaGorseliHazirla(Buffer.from('<html><img src=x onerror=alert(1)>')), /PNG, JPG veya WebP/)
    hata(() => markaGorseliHazirla(Buffer.from('%PDF-1.7')), /PNG, JPG veya WebP/)
    hata(() => markaGorseliHazirla(Buffer.alloc(0)), /boş/)
  })
})

describe('size limits', () => {
  it('more than 2 MB is rejected before anything else', () => {
    const buyuk = Buffer.concat([png(4, 4), Buffer.alloc(MARKA_MAX_BAYT)])
    hata(() => markaGorseliHazirla(buyuk), /2 MB/)
  })
  it('more than 1024 px on a side is rejected (the settings page resizes to 512 first)', () => {
    hata(() => markaGorseliHazirla(png(1500, 10)), /1024 piksel/)
    hata(() => markaGorseliHazirla(jpeg(10, 2000)), /1024 piksel/)
    hata(() => markaGorseliHazirla(webp(1025, 1025)), /1024 piksel/)
  })
  it('reads the pixel size of each type', () => {
    assert.deepEqual(gorselBoyutu(png(512, 256), 'image/png'), { en: 512, boy: 256 })
    assert.deepEqual(gorselBoyutu(jpeg(300, 200), 'image/jpeg'), { en: 300, boy: 200 })
    assert.deepEqual(gorselBoyutu(webp(512, 512), 'image/webp'), { en: 512, boy: 512 })
  })
})

describe('metadata is stripped, pixels kept', () => {
  it('PNG: text / EXIF / time / ICC chunks go, IHDR / tRNS / IDAT / IEND stay', () => {
    const giris = png(8, 8, [pngParca('tEXt', Buffer.from('Author\0Dr. X, Kadıköy', 'utf8')), pngParca('eXIf', Buffer.from('GPS')), pngParca('tIME', Buffer.alloc(7)), pngParca('iCCP', Buffer.from('p\0\0x')), pngParca('tRNS', Buffer.from([0]))])
    const { bayt, mime } = markaGorseliHazirla(giris)
    assert.equal(mime, 'image/png')
    const s = bayt.toString('latin1')
    for (const t of ['tEXt', 'eXIf', 'tIME', 'iCCP', 'Kad']) assert.ok(!s.includes(t), t)
    for (const t of ['IHDR', 'tRNS', 'IDAT', 'IEND']) assert.ok(s.includes(t), t)
    const idat = (b: Buffer) => b.subarray(b.indexOf('IDAT') - 4)
    assert.deepEqual(idat(bayt), idat(giris))
  })
  it('JPEG: EXIF (GPS), XMP and comments go; JFIF, tables, frame and scan data stay', () => {
    const giris = jpeg(16, 16)
    const { bayt } = markaGorseliHazirla(giris)
    const s = bayt.toString('latin1')
    for (const t of ['Exif', 'GPS', 'xmpmeta', 'comment']) assert.ok(!s.includes(t), t)
    assert.ok(s.includes('JFIF'))
    assert.deepEqual(bayt.subarray(bayt.length - 18), giris.subarray(giris.length - 18))
    assert.deepEqual(gorselBoyutu(bayt, 'image/jpeg'), { en: 16, boy: 16 })
  })
  it('WebP: EXIF / XMP chunks go, their VP8X flags are cleared, RIFF size is rewritten', () => {
    const { bayt } = markaGorseliHazirla(webp(64, 64))
    const s = bayt.toString('latin1')
    assert.ok(!s.includes('EXIF') && !s.includes('XMP ') && !s.includes('GPS'))
    assert.equal(bayt[20] & 0x0c, 0)
    assert.equal(bayt[20] & 0x10, 0x10, 'alpha flag kept')
    assert.equal(bayt.readUInt32LE(4), bayt.length - 8)
    assert.ok(s.includes('VP8L'))
  })
  it('a truncated file is refused, not stored', () => {
    const k = jpeg(16, 16)
    assert.throws(() => metaVeriTemizle(k.subarray(0, 30), 'image/jpeg'), MarkaGorselHatasi)
  })
})
