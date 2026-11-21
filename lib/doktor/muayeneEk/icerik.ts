/**
 * NOTYA-BELGE-DEID-03 (2026-11-20) — what a model may see of a muayene document (pure; unit-tested in
 * core/belgeler/maskesizGonderim.test.ts). belge-otomatik-akis: "never send unmasked".
 *
 * An IMAGE is only ever sent as the browser's masked copy (`deid`); the vault original is never turned into a model image block.
 * No masked copy -> null, and the caller skips ("Kimlik gizlenemedi, otomatik değerlendirilmedi"). PDFs keep their existing path.
 */
export interface DeidGorsel { mime: string; base64: string; hash?: string }

export const DEID_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

/** An image document in the vault (its ORIGINAL pixels may carry burned-in identity). */
export const gorselBelgeMi = (meta: { fileType: string }) => String(meta.fileType || '').startsWith('image/')

export function deidMime(deid: DeidGorsel): string { return DEID_MIME.includes(deid.mime) ? deid.mime : 'image/jpeg' }

export function icerikBlogu(meta: { fileType: string }, bytes: Buffer, deid?: DeidGorsel | null): unknown | null {
  if (meta.fileType === 'application/pdf') return { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: bytes.toString('base64') } }
  if (gorselBelgeMi(meta)) {
    if (!deid?.base64) return null
    return { type: 'image', source: { type: 'base64', media_type: deidMime(deid), data: deid.base64 } }
  }
  return null
}
