'use client'
/**
 * HASTA-PORTALI-GUNLUK — sparkline of daily averages with the target band (and a second series for diastolic BP).
 * Presentational, no words. Gaps (days without a reading) break the line instead of inventing values.
 */
export function Kivilcim({ seri, seri2, hedefMin, hedefMax, renk = '#b4832f', yukseklik = 56, aria }: {
  seri: Array<number | null>
  seri2?: Array<number | null>
  hedefMin?: number | null
  hedefMax?: number | null
  renk?: string
  yukseklik?: number
  aria: string
}) {
  const W = 240, H = yukseklik, P = 4
  const hepsi = [...seri, ...(seri2 || [])].filter((x): x is number => x != null)
  if (hepsi.length < 2) return <div style={{ height: H, display: 'grid', placeItems: 'center', fontSize: 12, color: 'var(--sg-muted)' }} aria-label={aria}>—</div>
  let min = Math.min(...hepsi, ...(hedefMin != null ? [hedefMin] : [])), max = Math.max(...hepsi, ...(hedefMax != null ? [hedefMax] : []))
  const pay = (max - min || 1) * 0.12; min -= pay; max += pay
  const x = (i: number, n: number) => P + (i / Math.max(1, n - 1)) * (W - 2 * P)
  const y = (v: number) => P + (1 - (v - min) / (max - min || 1)) * (H - 2 * P)
  const yol = (s: Array<number | null>) => {
    let d = '', ac = false
    s.forEach((v, i) => { if (v == null) { ac = false; return } d += `${ac ? 'L' : 'M'}${x(i, s.length).toFixed(1)} ${y(v).toFixed(1)} `; ac = true })
    return d
  }
  const son = [...seri].reverse().find((v) => v != null)
  const sonI = seri.lastIndexOf(son ?? null)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={aria} style={{ display: "block", height: "auto" }}>
      {hedefMin != null || hedefMax != null ? (
        <rect x={0} width={W} y={y(hedefMax ?? max)} height={Math.max(0, y(hedefMin ?? min) - y(hedefMax ?? max))} fill="#2f4334" opacity={0.07} />
      ) : null}
      {seri2 ? <path d={yol(seri2)} fill="none" stroke={renk} strokeOpacity={0.45} strokeWidth={1.6} strokeLinejoin="round" vectorEffect="non-scaling-stroke" /> : null}
      <path d={yol(seri)} fill="none" stroke={renk} strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      {son != null && sonI >= 0 ? <circle cx={x(sonI, seri.length)} cy={y(son)} r={3.5} fill={renk} /> : null}
    </svg>
  )
}
