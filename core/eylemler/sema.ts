/**
 * NOTYA-EYLEM — `alanlar` → zod-shaped schema, and `alanlar` → Anthropic tool input_schema.
 *
 * One field list, two consumers, so the validator the server re-runs on commit and the schema the
 * model was offered can never describe different shapes.
 *
 * Every field is optional at the schema level ON PURPOSE: a `tahmin` value is dropped before the
 * card is ever shown (core/eylemler/oneri.ts), so a required-field schema would reject the very
 * proposal the doctor is supposed to complete by hand. "Required" is enforced at commit time from
 * `zorunlu` (core/eylemler/onayla.ts) against the values the DOCTOR confirmed — which is the only
 * moment a missing field actually matters.
 */
import { z, type ZodType } from './z'
import type { AlanTanimi } from './types'

const ISO_TARIH = /^\d{4}-\d{2}-\d{2}$/

/** Turkish `gg.aa.yyyy` (what a doctor types) → ISO. Anything else is returned untouched. */
export function tarihNormalize(ham: unknown): unknown {
  if (typeof ham !== 'string') return ham
  const t = ham.trim()
  const m = /^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/.exec(t)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  return t
}

function alanSemasi(a: AlanTanimi): ZodType<unknown> {
  switch (a.tip) {
    case 'sayi': {
      let s = z.number()
      if (a.enAz != null) s = s.min(a.enAz)
      if (a.enCok != null) s = s.max(a.enCok)
      return s.optional() as ZodType<unknown>
    }
    case 'mantik':
      return z.boolean().optional() as ZodType<unknown>
    case 'secim':
      return z.enum((a.secenekler || []).map((s) => s.deger)).optional() as ZodType<unknown>
    case 'tarih':
    case 'metin':
    case 'uzunMetin':
    default:
      return z.string().optional() as ZodType<unknown>
  }
}

export function semaYap<V = Record<string, unknown>>(alanlar: readonly AlanTanimi[]): ZodType<V> {
  const shape: Record<string, ZodType<unknown>> = {}
  for (const a of alanlar) shape[a.anahtar] = alanSemasi(a)
  return z.object(shape) as unknown as ZodType<V>
}

/** Dates arrive as `gg.aa.yyyy` from the card and sometimes from the model — normalise before parse. */
export function veriNormalize(alanlar: readonly AlanTanimi[], veri: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const a of alanlar) {
    const ham = veri[a.anahtar]
    if (ham === undefined || ham === null || ham === '') continue
    if (a.tip === 'tarih') out[a.anahtar] = tarihNormalize(ham)
    else if (a.tip === 'sayi') out[a.anahtar] = typeof ham === 'string' ? Number(String(ham).replace(',', '.')) : ham
    else if (a.tip === 'mantik') out[a.anahtar] = typeof ham === 'string' ? ham === 'true' || ham === 'evet' : Boolean(ham)
    else out[a.anahtar] = typeof ham === 'string' ? ham.trim() : ham
  }
  return out
}

/** A date field that is present must be a real ISO calendar date — the schema only knows "string". */
export function tarihAlanlariGecerliMi(alanlar: readonly AlanTanimi[], veri: Record<string, unknown>): string | null {
  for (const a of alanlar) {
    if (a.tip !== 'tarih') continue
    const v = veri[a.anahtar]
    if (v === undefined || v === null || v === '') continue
    const s = String(v)
    if (!ISO_TARIH.test(s) || Number.isNaN(new Date(`${s}T00:00:00Z`).getTime()) || !s.startsWith(new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10))) {
      return `${a.etiket} geçerli bir tarih değil (gg.aa.yyyy).`
    }
  }
  return null
}

/** JSON Schema for the Anthropic tool definition. Nothing is `required`: a missing field is the point. */
export function aracSemasi(alanlar: readonly AlanTanimi[]): Record<string, unknown> {
  const properties: Record<string, unknown> = {}
  for (const a of alanlar) {
    const p: Record<string, unknown> = { description: a.aciklama || a.etiket }
    switch (a.tip) {
      case 'sayi':
        p.type = 'number'
        if (a.enAz != null) p.minimum = a.enAz
        if (a.enCok != null) p.maximum = a.enCok
        break
      case 'mantik':
        p.type = 'boolean'
        break
      case 'secim':
        p.type = 'string'
        p.enum = (a.secenekler || []).map((s) => s.deger)
        break
      case 'tarih':
        p.type = 'string'
        p.description = `${p.description as string} (yyyy-mm-dd)`
        break
      default:
        p.type = 'string'
    }
    properties[a.anahtar] = p
  }
  return { type: 'object', properties, required: [] }
}
