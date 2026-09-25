/**
 * NOTYA-GELEN-BELGELER — turn an incoming file into (a) what gets stored and (b) what Notya reads. Server-only.
 *
 *   PDF          → stored as-is; the model reads the PDF.
 *   JPEG/PNG/WebP→ stored as-is (EXIF orientation keeps phone photos upright); the model gets a copy with the JPEG
 *                  metadata segments (EXIF/GPS, XMP, comments) removed — de-identification of what leaves us.
 *   HEIC/HEIF    → converted to JPEG on the server (heic-convert, libheif) — stored and read as JPEG.
 *   Sound        → kept as it came (WhatsApp .opus/.ogg, .m4a, .mp3, .wav, in-app recording .webm/.mp4) and written
 *                  out in Turkish with ElevenLabs Scribe — the SAME provider and model the muayene recording upload
 *                  uses (app/api/sessions/ses-yukle). No new vendor. The transcript is read like a text.
 *   Word .docx   → text taken from word/document.xml (SheetJS' zip reader — no new dependency). Old .doc: stored only.
 *   Excel / CSV  → every sheet as CSV text.
 *   Text         → as pasted (a lab table copied from an email body).
 *
 * Every converter is injectable (Donusturuculer) so tests route formats without libheif or the network.
 */
import * as XLSX from 'xlsx'
import { bicimBelirle } from './bicim'
import type { Bicim } from './tipler'
import type { OkumaGirdisi } from './okuma'

export type GelenDosya = { ad: string; mime: string | null; bytes: Buffer }

export type Donusturuculer = {
  heicJpeg: (bytes: Buffer) => Promise<Buffer>
  yaziyaDok: (bytes: Buffer, mime: string, ad: string) => Promise<string | null>
}

export type Hazirlik = {
  bicim: Bicim
  /** Stored file name / MIME / bytes (HEIC becomes .jpg). */
  ad: string
  mime: string
  bytes: Buffer
  okuma: OkumaGirdisi | null
  /** Transcript or document text, kept with the item. */
  metin: string | null
}

export class BicimHatasi extends Error {}

async function heicJpegVarsayilan(bytes: Buffer): Promise<Buffer> {
  const convert = (await import('heic-convert')).default
  const cikti = await convert({ buffer: bytes, format: 'JPEG', quality: 0.88 })
  return Buffer.from(cikti as ArrayBuffer)
}

/** ElevenLabs Scribe, Turkish — mirrors app/api/sessions/ses-yukle. null when it could not be transcribed. */
export async function sesiYaziyaDok(bytes: Buffer, mime: string, ad: string, fetchFn: typeof fetch = fetch): Promise<string | null> {
  if (!process.env.ELEVENLABS_API_KEY) return null
  const fd = new FormData()
  fd.append('model_id', 'scribe_v1')
  fd.append('language_code', 'tr')
  fd.append('file', new Blob([new Uint8Array(bytes)], { type: mime }), ad || 'sesli-mesaj')
  try {
    const r = await fetchFn('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY },
      body: fd,
    })
    const veri = (await r.json().catch(() => ({}))) as { text?: unknown }
    if (!r.ok) { console.error('[gelen-belgeler] ses', r.status); return null }
    const metin = String(veri.text || '').trim()
    return metin || null
  } catch (e) {
    console.error('[gelen-belgeler] ses', e instanceof Error ? e.message.slice(0, 120) : e)
    return null
  }
}

export const VARSAYILAN_DONUSTURUCULER: Donusturuculer = { heicJpeg: heicJpegVarsayilan, yaziyaDok: (b, m, a) => sesiYaziyaDok(b, m, a) }

/**
 * Drops APP1 (EXIF/XMP), APP13 (IPTC) and COM segments from a JPEG. Pixels untouched. Anything that does not look
 * like a well-formed JPEG header comes back unchanged.
 */
export function jpegMetaTemizle(b: Buffer): Buffer {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return b
  const parcalar: Buffer[] = [b.subarray(0, 2)]
  let i = 2
  while (i + 4 <= b.length) {
    if (b[i] !== 0xff) return b
    const isaret = b[i + 1]
    // SOS: the entropy-coded image follows — copy the rest verbatim.
    if (isaret === 0xda) { parcalar.push(b.subarray(i)); return Buffer.concat(parcalar) }
    // Standalone markers (no length)
    if (isaret === 0xd8 || isaret === 0x01 || (isaret >= 0xd0 && isaret <= 0xd7)) { parcalar.push(b.subarray(i, i + 2)); i += 2; continue }
    const uzunluk = b.readUInt16BE(i + 2)
    if (uzunluk < 2 || i + 2 + uzunluk > b.length) return b
    const at = isaret === 0xe1 || isaret === 0xed || isaret === 0xfe
    if (!at) parcalar.push(b.subarray(i, i + 2 + uzunluk))
    i += 2 + uzunluk
  }
  return b
}

const METIN_SINIRI = 20000

function xmlMetni(xml: string): string {
  return xml
    .replace(/<w:tab\/>/g, '\t')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<w:br\/>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function docxMetni(bytes: Buffer): string | null {
  try {
    const cfb = XLSX.CFB.read(bytes, { type: 'buffer' })
    const giris = XLSX.CFB.find(cfb, 'word/document.xml') || XLSX.CFB.find(cfb, '/word/document.xml')
    if (!giris?.content) return null
    const xml = Buffer.from(giris.content as Uint8Array).toString('utf8')
    return xmlMetni(xml).slice(0, METIN_SINIRI) || null
  } catch {
    return null
  }
}

export function tabloMetni(bytes: Buffer, mime: string): string | null {
  try {
    if (mime === 'text/csv') return bytes.toString('utf8').replace(/^﻿/, '').slice(0, METIN_SINIRI).trim() || null
    const wb = XLSX.read(bytes, { type: 'buffer' })
    const parca = wb.SheetNames.slice(0, 5).map((ad) => `# ${ad}\n${XLSX.utils.sheet_to_csv(wb.Sheets[ad], { blankrows: false })}`)
    return parca.join('\n\n').slice(0, METIN_SINIRI).trim() || null
  } catch {
    return null
  }
}

export async function hazirla(dosya: GelenDosya, d: Donusturuculer = VARSAYILAN_DONUSTURUCULER): Promise<Hazirlik> {
  const b = bicimBelirle(dosya.ad, dosya.mime)
  if (!b) throw new BicimHatasi('Bu dosya türü eklenemiyor. PDF, Word, Excel, fotoğraf ya da ses dosyası gönderin.')
  const ad = dosya.ad || 'belge'
  switch (b.bicim) {
    case 'pdf':
      return { bicim: 'pdf', ad, mime: b.mime, bytes: dosya.bytes, okuma: { tip: 'pdf', base64: dosya.bytes.toString('base64') }, metin: null }
    case 'gorsel': {
      const okunacak = b.mime === 'image/jpeg' ? jpegMetaTemizle(dosya.bytes) : dosya.bytes
      return { bicim: 'gorsel', ad, mime: b.mime, bytes: dosya.bytes, okuma: { tip: 'gorsel', mime: b.mime, base64: okunacak.toString('base64') }, metin: null }
    }
    case 'heic': {
      let jpeg: Buffer
      try { jpeg = await d.heicJpeg(dosya.bytes) } catch { throw new BicimHatasi('Bu iPhone fotoğrafı açılamadı. Lütfen JPEG olarak paylaşın.') }
      const yeniAd = ad.replace(/\.(heic|heif)$/i, '') + '.jpg'
      return { bicim: 'gorsel', ad: yeniAd, mime: 'image/jpeg', bytes: jpeg, okuma: { tip: 'gorsel', mime: 'image/jpeg', base64: jpeg.toString('base64') }, metin: null }
    }
    case 'ses': {
      const metin = await d.yaziyaDok(dosya.bytes, b.mime, ad)
      return { bicim: 'ses', ad, mime: b.mime, bytes: dosya.bytes, okuma: metin ? { tip: 'metin', metin, sesMi: true } : null, metin }
    }
    case 'word': {
      const metin = b.mime === 'application/msword' ? null : docxMetni(dosya.bytes)
      return { bicim: 'word', ad, mime: b.mime, bytes: dosya.bytes, okuma: metin ? { tip: 'metin', metin } : null, metin }
    }
    case 'excel': {
      const metin = tabloMetni(dosya.bytes, b.mime)
      return { bicim: 'excel', ad, mime: b.mime, bytes: dosya.bytes, okuma: metin ? { tip: 'metin', metin } : null, metin }
    }
    default: {
      const metin = dosya.bytes.toString('utf8').replace(/^﻿/, '').slice(0, METIN_SINIRI).trim()
      return { bicim: 'metin', ad, mime: 'text/plain', bytes: dosya.bytes, okuma: metin ? { tip: 'metin', metin } : null, metin: metin || null }
    }
  }
}
