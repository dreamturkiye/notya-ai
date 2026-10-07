// MBYS-YARDIMCI-02 — packs extensions/mbys-yardimci into a zip with no dependency (node:zlib only).
// Shared by the build step (scripts/mbys-yardimci-paketle.mjs) and the download route (fallback when the built
// file is missing, e.g. local dev). Deterministic: sorted entries, fixed timestamp → same input, same bytes.
import { deflateRawSync } from 'node:zlib'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const TABLO = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

/** @param {Uint8Array} buf */
export function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = TABLO[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

// 2026-01-01 00:00 in DOS time/date
const DOS_SAAT = 0
const DOS_TARIH = ((2026 - 1980) << 9) | (1 << 5) | 1

/**
 * @param {{ ad: string, veri: Buffer }[]} dosyalar  paths use '/' and never start with '/'
 * @returns {Buffer}
 */
export function zipOlustur(dosyalar) {
  const yerel = []
  const merkez = []
  let ofset = 0
  for (const d of dosyalar) {
    const ad = Buffer.from(d.ad, 'utf8')
    const sikisik = deflateRawSync(d.veri, { level: 9 })
    const crc = crc32(d.veri)
    const b = Buffer.alloc(30)
    b.writeUInt32LE(0x04034b50, 0); b.writeUInt16LE(20, 4); b.writeUInt16LE(0x0800, 6); b.writeUInt16LE(8, 8)
    b.writeUInt16LE(DOS_SAAT, 10); b.writeUInt16LE(DOS_TARIH, 12); b.writeUInt32LE(crc, 14)
    b.writeUInt32LE(sikisik.length, 18); b.writeUInt32LE(d.veri.length, 22); b.writeUInt16LE(ad.length, 26); b.writeUInt16LE(0, 28)
    yerel.push(b, ad, sikisik)
    const m = Buffer.alloc(46)
    m.writeUInt32LE(0x02014b50, 0); m.writeUInt16LE(20, 4); m.writeUInt16LE(20, 6); m.writeUInt16LE(0x0800, 8); m.writeUInt16LE(8, 10)
    m.writeUInt16LE(DOS_SAAT, 12); m.writeUInt16LE(DOS_TARIH, 14); m.writeUInt32LE(crc, 16)
    m.writeUInt32LE(sikisik.length, 20); m.writeUInt32LE(d.veri.length, 24); m.writeUInt16LE(ad.length, 28)
    m.writeUInt32LE(ofset, 42)
    merkez.push(m, ad)
    ofset += 30 + ad.length + sikisik.length
  }
  const merkezBuf = Buffer.concat(merkez)
  const son = Buffer.alloc(22)
  son.writeUInt32LE(0x06054b50, 0); son.writeUInt16LE(dosyalar.length, 8); son.writeUInt16LE(dosyalar.length, 10)
  son.writeUInt32LE(merkezBuf.length, 12); son.writeUInt32LE(ofset, 16)
  return Buffer.concat([...yerel, merkezBuf, son])
}

/** Files of the extension folder, sorted, inside a top folder (unzip → one folder to "Paketlenmemiş öğe yükle"). */
export function klasorDosyalari(dizin, kokAd = 'mbys-yardimci') {
  const out = []
  const gez = (alt) => {
    for (const ad of readdirSync(join(dizin, alt)).sort()) {
      if (ad.startsWith('.')) continue
      const yol = alt ? `${alt}/${ad}` : ad
      if (statSync(join(dizin, yol)).isDirectory()) gez(yol)
      else out.push({ ad: `${kokAd}/${yol}`, veri: readFileSync(join(dizin, yol)) })
    }
  }
  gez('')
  return out
}

export function klasoruPaketle(dizin, kokAd = 'mbys-yardimci') {
  return zipOlustur(klasorDosyalari(dizin, kokAd))
}

/** Where the build step writes the zip and where the download route reads it (relative to the repo root). */
export const PAKET_YOLU = '.mbys-paket/mbys-yardimci.zip'
export const UZANTI_DIZINI = 'extensions/mbys-yardimci'
