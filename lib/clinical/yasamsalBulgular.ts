/**
 * Turkish clinical labels + formatting for vital signs (yaşamsal / vital bulgular).
 * Used on Sağlığım visit summaries, tracking, and doctor print/review.
 */

export type VitalBag = {
  tansiyon?: string | number | null
  nabiz?: string | number | null
  spo2?: string | number | null
  kilo?: string | number | null
  boy?: string | number | null
  ates?: string | number | null
}

export type VitalLine = {
  key: string
  label: string
  value: string
}

const ORDER = ['tansiyon', 'nabiz', 'spo2', 'kilo', 'boy', 'ates'] as const

function trNumber(n: number, maxFrac = 1): string {
  return n.toLocaleString('tr-TR', {
    maximumFractionDigits: maxFrac,
    minimumFractionDigits: Number.isInteger(n) ? 0 : Math.min(1, maxFrac),
  })
}

function formatTansiyon(raw: string | number): string {
  const s = String(raw).trim()
  if (!s) return s
  if (/mm\s*hg/i.test(s)) return s.replace(/\s+/g, ' ')
  return `${s} mmHg`
}

function formatOne(key: string, raw: string | number): VitalLine | null {
  switch (key) {
    case 'tansiyon':
      return { key, label: 'Tansiyon', value: formatTansiyon(raw) }
    case 'nabiz':
      return {
        key,
        label: 'Nabız',
        value: typeof raw === 'number' ? `${trNumber(raw, 0)}/dk` : /\/\s*dk/i.test(String(raw)) ? String(raw) : `${raw}/dk`,
      }
    case 'spo2':
      return {
        key,
        label: 'SpO₂',
        value: typeof raw === 'number' ? `%${trNumber(raw, 0)}` : String(raw).startsWith('%') ? String(raw) : `%${raw}`,
      }
    case 'kilo':
      return {
        key,
        label: 'Kilo',
        value: typeof raw === 'number' ? `${trNumber(raw, 1)} kg` : /kg/i.test(String(raw)) ? String(raw) : `${raw} kg`,
      }
    case 'boy':
      return {
        key,
        label: 'Boy',
        value: typeof raw === 'number' ? `${trNumber(raw, 0)} cm` : /cm/i.test(String(raw)) ? String(raw) : `${raw} cm`,
      }
    case 'ates':
      return {
        key,
        label: 'Ateş',
        value: typeof raw === 'number' ? `${trNumber(raw, 1)} °C` : /°\s*c/i.test(String(raw)) ? String(raw) : `${raw} °C`,
      }
    default:
      return { key, label: key, value: String(raw) }
  }
}

/** Ordered, labeled vital lines for UI chips / report rows. */
export function yasamsalBulguSatirlari(vitaller: VitalBag | null | undefined): VitalLine[] {
  if (!vitaller) return []
  const bag = vitaller as Record<string, string | number | null | undefined>
  const seen = new Set<string>()
  const out: VitalLine[] = []

  for (const key of ORDER) {
    const raw = bag[key]
    if (raw == null || raw === '') continue
    const line = formatOne(key, raw)
    if (line) {
      out.push(line)
      seen.add(key)
    }
  }

  for (const [key, raw] of Object.entries(bag)) {
    if (seen.has(key) || raw == null || raw === '') continue
    const line = formatOne(key, raw)
    if (line) out.push(line)
  }

  return out
}

export function hasYasamsalBulgular(vitaller: VitalBag | null | undefined): boolean {
  return yasamsalBulguSatirlari(vitaller).length > 0
}

/** One-line summary: "Tansiyon: 128/78 mmHg · Nabız: 72/dk · …" */
export function yasamsalBulguOzeti(vitaller: VitalBag | null | undefined): string {
  return yasamsalBulguSatirlari(vitaller)
    .map((l) => `${l.label}: ${l.value}`)
    .join(' · ')
}

export const YASAMSAL_BULGULAR_BASLIK = 'Yaşamsal Bulgular'
