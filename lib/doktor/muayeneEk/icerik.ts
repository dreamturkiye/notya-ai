/**
 * NOTYA-BELGE-DEID-03 (2026-11-20) — what a model may see of a patient document (pure; unit-tested in
 * core/belgeler/maskesizGonderim.test.ts). belge-otomatik-akis: "never send unmasked".
 *
 * An IMAGE or a PDF is only ever sent as the browser's masked copy (`deid`): one masked picture, or for a PDF the masked pictures
 * of its pages (`base64` = page 1, `ekSayfalar` = pages 2..N; drawn and masked on the device, core/belgeler/pdfMaske.ts). The vault
 * original is never turned into a model block — there is deliberately no function here that takes the vault bytes.
 * No masked copy -> null, and the caller skips ("Kimlik gizlenemedi, otomatik değerlendirilmedi").
 */
export interface DeidSayfa { mime: string; base64: string }
export interface DeidGorsel extends DeidSayfa { hash?: string; ekSayfalar?: DeidSayfa[] }

export const DEID_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
/** A PDF of more pages than this is not de-identified on the device (pdfMaske PDF_AZAMI_SAYFA). */
export const DEID_AZAMI_SAYFA = 20
/** All masked pictures together (base64 characters); the request body cap is 4.5 MB. */
export const DEID_AZAMI_KARAKTER = 4_200_000

/** An image document in the vault (its ORIGINAL pixels may carry burned-in identity). */
export const gorselBelgeMi = (meta: { fileType: string }) => String(meta.fileType || '').startsWith('image/')
export const pdfBelgeMi = (meta: { fileType: string }) => meta.fileType === 'application/pdf'
/** Documents that may only reach a model as their masked copy. */
export const maskeliBelgeMi = (meta: { fileType: string }) => gorselBelgeMi(meta) || pdfBelgeMi(meta)

export function deidMime(deid: DeidSayfa): 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' {
  return (DEID_MIME.includes(deid.mime) ? deid.mime : 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
}

/** Request body -> masked copy, or null (anything malformed / oversized is treated as "no masked copy"). */
export function deidCoz(x: unknown): DeidGorsel | null {
  if (!x || typeof x !== 'object') return null
  const d = x as { mime?: unknown; base64?: unknown; hash?: unknown; ekSayfalar?: unknown }
  if (typeof d.base64 !== 'string' || !d.base64) return null
  const ek: DeidSayfa[] = []
  if (d.ekSayfalar !== undefined) {
    if (!Array.isArray(d.ekSayfalar) || d.ekSayfalar.length > DEID_AZAMI_SAYFA - 1) return null
    for (const s of d.ekSayfalar as { mime?: unknown; base64?: unknown }[]) {
      if (!s || typeof s.base64 !== 'string' || !s.base64) return null
      ek.push({ mime: String(s.mime || 'image/jpeg'), base64: s.base64 })
    }
  }
  if (d.base64.length + ek.reduce((t, s) => t + s.base64.length, 0) > DEID_AZAMI_KARAKTER) return null
  return { mime: String(d.mime || 'image/jpeg'), base64: d.base64, ...(typeof d.hash === 'string' ? { hash: d.hash } : {}), ...(ek.length ? { ekSayfalar: ek } : {}) }
}

/** The masked pictures as model image blocks (page order). */
export function deidBloklari(deid: DeidGorsel): unknown[] {
  return [deid, ...(deid.ekSayfalar || [])].map((s) => ({ type: 'image', source: { type: 'base64', media_type: deidMime(s), data: s.base64 } }))
}

/** Content blocks for an image / PDF document: its masked copy only, or null (not sent). Other types have no blocks here. */
export function icerikBloklari(meta: { fileType: string }, deid?: DeidGorsel | null): unknown[] | null {
  if (!maskeliBelgeMi(meta) || !deid?.base64) return null
  return deidBloklari(deid)
}
