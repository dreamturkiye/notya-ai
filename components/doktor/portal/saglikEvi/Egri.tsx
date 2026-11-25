'use client'
/**
 * BUGUN-V2 — the patient's trend curve: daily means over the last 14 days as a smooth monotone path (never overshoots a
 * reading), the target band shaded, the latest point emphasised; the wide version shades "this week". Diastolic BP is
 * a lighter second line. Days without a reading are skipped, never invented; fewer than 3 days → dots only.
 * Same drawing language as the doctor's Ev verisi curves. Pure SVG, wordless except the passed labels.
 * EV-ACIL-SEKER: a day with a glucometer HI / LO gets an off-scale marker (triangle on the top / bottom edge, acil red),
 * never a point on the curve.
 */
import { useId } from 'react'
import type { Egilim } from '@/lib/saglikEvi/ozet'
import { egriNoktalari } from '@/lib/saglikEvi/bugunGorunum'
import { puruzsuzYol } from '@/lib/saglikEvi/evVerisiGorunum'

export function Egri({ e, renk, genis = false, aria, buHafta }: { e: Egilim; renk: string; genis?: boolean; aria: string; buHafta?: string }) {
  const id = useId().replace(/:/g, '')
  const kb = e.anahtar === 'kb'
  const p1 = egriNoktalari(e)
  const p2 = kb ? egriNoktalari(e, true) : []
  const n0 = e.gunluk.length
  const isaretler = e.gunluk.map((g, i) => (g.isaret ? { x: n0 > 1 ? i / (n0 - 1) : 1, isaret: g.isaret } : null)).filter((v): v is { x: number; isaret: 'hi' | 'lo' } => !!v)
  if (!p1.length && !isaretler.length) return null
  if (!p1.length) {
    return (
      <span className={`sgb-egri${genis ? ' sgb-egri--genis' : ''}`} style={{ height: genis ? 60 : 40 }} role="img" aria-label={aria}>
        {isaretler.map((m, i) => <span key={i} className={`sge-egri-isaret sge-egri-isaret--${m.isaret}`} data-isaret={m.isaret} style={{ left: `${m.x * 100}%` }} aria-hidden />)}
      </span>
    )
  }
  const W = genis ? 600 : 300, H = genis ? 132 : 70, PT = genis ? 14 : 6, PB = genis ? 8 : 5, PR = 8, PL = 4
  const hedef = [e.hedefMin, e.hedefMax].filter((x): x is number => x != null)
  const tum = [...p1.map((p) => p.y), ...p2.map((p) => p.y)]
  let min = Math.min(...tum, ...hedef), max = Math.max(...tum, ...hedef)
  const pay = (max - min || Math.abs(max) * 0.1 || 1) * 0.18; min -= pay; max += pay
  const x = (t: number) => PL + t * (W - PL - PR)
  const y = (v: number) => PT + (1 - (v - min) / (max - min || 1)) * (H - PT - PB)
  const n1 = p1.map((p) => [x(p.x), y(p.y)] as [number, number])
  const n2 = p2.map((p) => [x(p.x), y(p.y)] as [number, number])
  const az = n1.length < 3
  const yol = az ? '' : puruzsuzYol(n1)
  const son = n1[n1.length - 1]
  // A band that fills most of the plot says nothing: then only the upper target line is drawn.
  const bantGenis = e.hedefMin != null && e.hedefMax != null && y(e.hedefMin) - y(e.hedefMax) > (H - PT - PB) * 0.7
  const bant = !kb && e.hedefMin != null && e.hedefMax != null && !bantGenis
  const n = e.gunluk.length
  const haftaX = n > 7 ? x((n - 7.5) / (n - 1)) : null
  return (
    <span className={`sgb-egri${genis ? ' sgb-egri--genis' : ''}`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={renk} stopOpacity={0.2} />
            <stop offset="100%" stopColor={renk} stopOpacity={0} />
          </linearGradient>
        </defs>
        {genis && haftaX != null ? <rect x={haftaX} y={0} width={W - PR - haftaX + 4} height={H} rx={12} fill="#3b2e24" opacity={0.035} /> : null}
        {bant ? <rect x={0} width={W} y={y(e.hedefMax!)} height={Math.max(0, y(e.hedefMin!) - y(e.hedefMax!))} rx={5} fill={genis ? '#fffdf9' : renk} opacity={genis ? 0.6 : 0.075} /> : null}
        {!bant && e.hedefMax != null ? <line x1={0} x2={W} y1={y(e.hedefMax)} y2={y(e.hedefMax)} stroke={renk} strokeOpacity={0.35} strokeDasharray="3 4" strokeWidth={1} vectorEffect="non-scaling-stroke" /> : null}
        {!az ? (
          <>
            {!kb && !bant ? <path className="sgb-dolgu" d={`${yol} L${son[0].toFixed(1)} ${H} L${n1[0][0].toFixed(1)} ${H} Z`} fill={`url(#g${id})`} /> : null}
            {n2.length > 2 ? <path d={puruzsuzYol(n2)} fill="none" stroke={renk} strokeOpacity={0.42} strokeWidth={genis ? 2 : 1.7} strokeLinecap="round" vectorEffect="non-scaling-stroke" /> : null}
            <path d={yol} fill="none" stroke={renk} strokeWidth={genis ? 2.8 : 2.3} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          </>
        ) : n1.map(([a, b], i) => <circle key={i} cx={a} cy={b} r={3.2} fill={renk} opacity={0.5} />)}
      </svg>
      {/* the latest point in HTML so it stays round when the SVG stretches */}
      <span className="sgb-egri-son" style={{ left: `${(son[0] / W) * 100}%`, top: `${(son[1] / H) * 100}%`, background: renk }} aria-hidden />
      {genis && haftaX != null && buHafta ? <span className="sgb-egri-hafta" style={{ left: `${(haftaX / W) * 100}%` }}>{buHafta}</span> : null}
      {isaretler.map((m, i) => <span key={i} className={`sge-egri-isaret sge-egri-isaret--${m.isaret}`} data-isaret={m.isaret} style={{ left: `${(x(m.x) / W) * 100}%` }} aria-hidden />)}
    </span>
  )
}
