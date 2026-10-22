/**
 * AU-BETA-01 — invoice arithmetic. Pure, integer cents only. Client-safe.
 *
 * The amount typed on a line is the amount BEFORE tax. A line the doctor marks tax-free adds none; every other line
 * adds `oranYuzde` per cent of the taxable subtotal, rounded once on the subtotal (half up), not per line. The rate
 * and the default of the tax-free box are the PACK's (a rule of the country). This file gives no tax advice: whether a
 * service is tax-free is the practitioner's decision (and their adviser's).
 */
export type FaturaKalemi = { aciklama: string; kalemNo: string; tutarKurus: number; muaf: boolean }
export type FaturaToplami = { altToplamKurus: number; vergiKurus: number; toplamKurus: number }

export const KALEM_AZAMI = 20
export const TUTAR_AZAMI_KURUS = 100_000_000

export function faturaToplami(kalemler: readonly Pick<FaturaKalemi, 'tutarKurus' | 'muaf'>[], oranYuzde: number): FaturaToplami {
  let alt = 0
  let vergiye = 0
  for (const k of kalemler) {
    alt += k.tutarKurus
    if (!k.muaf) vergiye += k.tutarKurus
  }
  const vergi = Math.floor((vergiye * oranYuzde + 50) / 100)
  return { altToplamKurus: alt, vergiKurus: vergi, toplamKurus: alt + vergi }
}

/** "12.50" / "12" / "1,200.5" → cents, or null. Two decimals at most; positive; below the ceiling. */
export function tutarKurusa(ham: unknown): number | null {
  const s = String(ham ?? '').trim().replace(/,/g, '')
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(s)) return null
  const [a, b = ''] = s.split('.')
  const k = Number(a) * 100 + Number((b + '00').slice(0, 2))
  return k > 0 && k <= TUTAR_AZAMI_KURUS ? k : null
}

export const kurusYaz = (kurus: number, kod = 'AUD'): string => `${kod} ${(kurus / 100).toFixed(2)}`

/** Validates the lines a client sent. null = refuse. */
export function kalemleriTemizle(ham: unknown): FaturaKalemi[] | null {
  if (!Array.isArray(ham) || ham.length === 0 || ham.length > KALEM_AZAMI) return null
  const cikti: FaturaKalemi[] = []
  for (const x of ham) {
    if (!x || typeof x !== 'object') return null
    const o = x as Record<string, unknown>
    const aciklama = typeof o.aciklama === 'string' ? o.aciklama.trim() : ''
    const kalemNo = typeof o.kalemNo === 'string' ? o.kalemNo.trim() : ''
    const tutar = typeof o.tutarKurus === 'number' && Number.isInteger(o.tutarKurus) && o.tutarKurus > 0 && o.tutarKurus <= TUTAR_AZAMI_KURUS ? o.tutarKurus : null
    if (!aciklama || aciklama.length > 200 || kalemNo.length > 40 || tutar === null || typeof o.muaf !== 'boolean') return null
    cikti.push({ aciklama, kalemNo, tutarKurus: tutar, muaf: o.muaf })
  }
  return cikti
}
