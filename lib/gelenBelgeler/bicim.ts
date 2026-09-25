/**
 * NOTYA-GELEN-BELGELER — which kind of file is this, and which MIME type does the patient file store it under.
 * Pure and client-safe (the browser uses it to refuse an unsupported file before sending it).
 *
 * Browsers and WhatsApp exports often send `application/octet-stream` or nothing at all, so the file name decides
 * when the type is missing or generic. WhatsApp voice notes are Opus in an Ogg container → stored as audio/ogg.
 * DICOM never reaches the server: the browser turns a .dcm into a plain image first (core/belgeler/dicom.ts — the
 * patient tags never leave the device), so there is no DICOM branch here.
 */
import type { Bicim } from './tipler'

export type BicimSonucu = { bicim: Bicim; mime: string } | null

const UZANTI: Record<string, { bicim: Bicim; mime: string }> = {
  pdf: { bicim: 'pdf', mime: 'application/pdf' },
  jpg: { bicim: 'gorsel', mime: 'image/jpeg' },
  jpeg: { bicim: 'gorsel', mime: 'image/jpeg' },
  png: { bicim: 'gorsel', mime: 'image/png' },
  webp: { bicim: 'gorsel', mime: 'image/webp' },
  heic: { bicim: 'heic', mime: 'image/heic' },
  heif: { bicim: 'heic', mime: 'image/heif' },
  opus: { bicim: 'ses', mime: 'audio/ogg' },
  ogg: { bicim: 'ses', mime: 'audio/ogg' },
  oga: { bicim: 'ses', mime: 'audio/ogg' },
  m4a: { bicim: 'ses', mime: 'audio/mp4' },
  mp4a: { bicim: 'ses', mime: 'audio/mp4' },
  aac: { bicim: 'ses', mime: 'audio/aac' },
  mp3: { bicim: 'ses', mime: 'audio/mpeg' },
  wav: { bicim: 'ses', mime: 'audio/wav' },
  webm: { bicim: 'ses', mime: 'audio/webm' },
  docx: { bicim: 'word', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  doc: { bicim: 'word', mime: 'application/msword' },
  xlsx: { bicim: 'excel', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  xls: { bicim: 'excel', mime: 'application/vnd.ms-excel' },
  csv: { bicim: 'excel', mime: 'text/csv' },
  txt: { bicim: 'metin', mime: 'text/plain' },
}

const MIME: Record<string, { bicim: Bicim; mime: string }> = {
  'application/pdf': UZANTI.pdf,
  'image/jpeg': UZANTI.jpg,
  'image/jpg': UZANTI.jpg,
  'image/png': UZANTI.png,
  'image/webp': UZANTI.webp,
  'image/heic': UZANTI.heic,
  'image/heif': UZANTI.heif,
  'image/heic-sequence': UZANTI.heic,
  'image/heif-sequence': UZANTI.heif,
  'audio/ogg': UZANTI.ogg,
  'audio/opus': UZANTI.ogg,
  'audio/x-opus+ogg': UZANTI.ogg,
  'audio/mp4': UZANTI.m4a,
  'audio/x-m4a': UZANTI.m4a,
  'audio/m4a': UZANTI.m4a,
  'audio/aac': UZANTI.aac,
  'audio/mpeg': UZANTI.mp3,
  'audio/mp3': UZANTI.mp3,
  'audio/wav': UZANTI.wav,
  'audio/x-wav': UZANTI.wav,
  'audio/wave': UZANTI.wav,
  'audio/webm': UZANTI.webm,
  // MediaRecorder on iOS Safari labels its recording video/mp4 even when it is audio only
  'video/mp4': UZANTI.m4a,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': UZANTI.docx,
  'application/msword': UZANTI.doc,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': UZANTI.xlsx,
  'application/vnd.ms-excel': UZANTI.xls,
  'text/csv': UZANTI.csv,
  'text/plain': UZANTI.txt,
}

export function uzanti(ad: string): string {
  const m = String(ad || '').toLowerCase().match(/\.([a-z0-9]{1,5})$/)
  return m ? m[1] : ''
}

/** null = not something the inbox takes (video, zip, executable …). */
export function bicimBelirle(ad: string, hamMime: string | null | undefined): BicimSonucu {
  const mime = String(hamMime || '').toLowerCase().split(';')[0].trim()
  const u = uzanti(ad)
  // A specific MIME wins, except the generic ones browsers use when they do not know.
  if (mime && mime !== 'application/octet-stream' && MIME[mime]) {
    // "video/mp4" from a file literally named .mp4 is a video — not taken. From MediaRecorder it has no extension.
    if (mime === 'video/mp4' && u === 'mp4') return null
    return MIME[mime]
  }
  return UZANTI[u] || null
}

/** File name extension to use in storage for the stored MIME type. */
export function mimeUzantisi(mime: string): string {
  const bul = Object.entries(UZANTI).find(([, v]) => v.mime === mime)
  return bul ? bul[0] : 'bin'
}

/** Pasted text worth keeping as a document: a few words at least, not a stray word or a link. */
export function yapistirmaMetniUygunMu(metin: string): boolean {
  const t = String(metin || '').trim()
  if (t.length < 20) return false
  if (/^https?:\/\/\S+$/.test(t)) return false
  return t.split(/\s+/).length >= 4
}

/** The accept= attribute of the upload input: documents, images and sound. */
export const KABUL_EDILEN = [
  '.pdf', '.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.dcm',
  '.opus', '.ogg', '.oga', '.m4a', '.aac', '.mp3', '.wav', '.webm',
  '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt',
  'application/pdf', 'image/*', 'audio/*', 'application/dicom',
].join(',')
