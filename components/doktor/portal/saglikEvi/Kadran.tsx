'use client'
/**
 * HASTA-PORTALI-GUNLUK — the Bugün day dial: a 24-hour clock ring with today's dose slots and readings placed at their
 * time, a "now" hand, and three inner progress rings (İlaç teal · Ölçüm sun · Hedef pine). Presentational, country-
 * neutral: every word arrives as a prop (gorunum-paritesi-ulke).
 */
import type { CSSProperties } from 'react'

export interface KadranIsareti { dakika: number; tur: 'doz' | 'olcum'; durum: 'tamam' | 'bekliyor' | 'kacti'; etiket: string }
export interface KadranHalkasi { oran: number | null; renk: string; etiket: string }

const C = 180
const aci = (dakika: number) => (dakika / 1440) * 2 * Math.PI - Math.PI / 2
const nokta = (dakika: number, r: number) => ({ x: C + r * Math.cos(aci(dakika)), y: C + r * Math.sin(aci(dakika)) })

/** Progress as a 270° gauge open at the bottom — a meter, so it never reads as a second clock hand. */
function Halka({ r, oran, renk, kalinlik = 11 }: { r: number; oran: number | null; renk: string; kalinlik?: number }) {
  const cevre = 2 * Math.PI * r
  const yay = cevre * 0.75
  const dolu = Math.max(0, Math.min(1, oran ?? 0))
  return (
    <g transform={`rotate(135 ${C} ${C})`}>
      <circle cx={C} cy={C} r={r} fill="none" stroke={renk} strokeOpacity={0.14} strokeWidth={kalinlik} strokeLinecap="round" strokeDasharray={`${yay} ${cevre}`} />
      {dolu > 0 ? (
        <circle
          className="sge-halka-yay" cx={C} cy={C} r={r} fill="none" stroke={renk} strokeWidth={kalinlik} strokeLinecap="round"
          strokeDasharray={`${yay * dolu} ${cevre}`}
          style={{ ['--sge-tam' as string]: `0 ${cevre}` } as CSSProperties}
        />
      ) : null}
    </g>
  )
}

export function Kadran({ isaretler, halkalar, simdiDakika, merkezSayi, merkezPay, merkezEtiket, aria, sessiz }: {
  isaretler: KadranIsareti[]
  halkalar: [KadranHalkasi, KadranHalkasi, KadranHalkasi]
  simdiDakika: number
  merkezSayi: string
  merkezPay?: string
  merkezEtiket: string
  aria: string
  /** Quiet-hours band, minutes [start, end) — drawn as night shading. */
  sessiz?: [number, number]
}) {
  const R = 162
  const el = nokta(simdiDakika, R + 2)
  const elIc = nokta(simdiDakika, R - 16)
  // Several medicines at one time = one marker with a count; its colour is the group's worst state.
  const dozGruplari = [...isaretler.filter((m) => m.tur === 'doz').reduce((acc, m) => {
    const g = acc.get(m.dakika) || { dakika: m.dakika, sayi: 0, etiketler: [] as string[], durum: 'tamam' as KadranIsareti['durum'] }
    g.sayi++; g.etiketler.push(m.etiket)
    if (m.durum === 'bekliyor' || (m.durum === 'kacti' && g.durum === 'tamam')) g.durum = m.durum
    return acc.set(m.dakika, g)
  }, new Map<number, { dakika: number; sayi: number; etiketler: string[]; durum: KadranIsareti['durum'] }>()).values()]
  const olcumGruplari = [...isaretler.filter((m) => m.tur === 'olcum').reduce((acc, m) => {
    const k = Math.round(m.dakika / 20) * 20
    const g = acc.get(k) || { dakika: k, etiketler: [] as string[] }
    g.etiketler.push(m.etiket)
    return acc.set(k, g)
  }, new Map<number, { dakika: number; etiketler: string[] }>()).values()]
  const gece = sessiz ? yay(sessiz[0], sessiz[1], R) : null
  return (
    <div className="sge-kadran sge-kadran-giris">
      <svg viewBox="0 0 360 360" role="img" aria-label={aria}>
        <circle cx={C} cy={C} r={R + 12} fill="#fffdf8" stroke="rgba(58,44,34,0.08)" />
        {gece ? <path d={gece} fill="none" stroke="#2f4334" strokeOpacity={0.09} strokeWidth={22} /> : null}
        {Array.from({ length: 24 }, (_, h) => {
          const ic = nokta(h * 60, h % 6 === 0 ? R - 12 : R - 6), dis = nokta(h * 60, R + 2)
          return <line key={h} x1={ic.x} y1={ic.y} x2={dis.x} y2={dis.y} stroke="rgba(58,44,34,0.28)" strokeWidth={h % 6 === 0 ? 2 : 1} />
        })}
        {[0, 6, 12, 18].map((h) => {
          const p = nokta(h * 60, R - 24)
          return <text key={h} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize="13" fill="rgba(58,44,34,0.55)" fontFamily="var(--sg-font-ui)">{String(h).padStart(2, '0')}</text>
        })}
        <Halka r={116} oran={halkalar[0].oran} renk={halkalar[0].renk} />
        <Halka r={99} oran={halkalar[1].oran} renk={halkalar[1].renk} />
        <Halka r={82} oran={halkalar[2].oran} renk={halkalar[2].renk} />
        {olcumGruplari.map((g) => {
          // readings sit on an inner track (diamonds), doses on the rim (circles), so the two never collide
          const p = nokta(g.dakika, R - 9)
          return <rect key={`o${g.dakika}`} x={p.x - 5} y={p.y - 5} width={10} height={10} rx={2} transform={`rotate(45 ${p.x} ${p.y})`} fill="#b4832f" stroke="#fffdf8" strokeWidth={1.5}><title>{g.etiketler.join(', ')}</title></rect>
        })}
        {dozGruplari.map((g) => {
          const p = nokta(g.dakika, R + 2)
          const renk = g.durum === 'tamam' ? '#0f9b8e' : g.durum === 'kacti' ? '#a45b3e' : '#fffdf8'
          return (
            <g key={`d${g.dakika}`}>
              <circle cx={p.x} cy={p.y} r={10} fill={renk} stroke={g.durum === 'bekliyor' ? '#0f9b8e' : '#fffdf8'} strokeWidth={g.durum === 'bekliyor' ? 2.5 : 2}><title>{g.etiketler.join(', ')}</title></circle>
              {g.durum === 'tamam' ? <path d={`M${p.x - 4.5} ${p.y} l3 3 l6 -6.5`} fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" /> : null}
              {g.sayi > 1 ? (
                <g>
                  <circle cx={p.x + 9} cy={p.y - 9} r={7} fill="#3b2e24" />
                  <text x={p.x + 9} y={p.y - 9} textAnchor="middle" dominantBaseline="central" fontSize="9" fontWeight="700" fill="#fff" fontFamily="var(--sg-font-ui)">{g.sayi}</text>
                </g>
              ) : null}
            </g>
          )
        })}
        <line x1={elIc.x} y1={elIc.y} x2={el.x} y2={el.y} stroke="#3b2e24" strokeWidth={3} strokeLinecap="round" />
        <circle cx={el.x} cy={el.y} r={5} fill="#3b2e24" />
      </svg>
      <div className="sge-kadran-merkez" aria-hidden>
        <div className="sge-kadran-sayi">{merkezSayi}{merkezPay ? <span>/{merkezPay}</span> : null}</div>
        <div className="sge-kadran-etiket">{merkezEtiket}</div>
      </div>
    </div>
  )
}

function yay(bas: number, bit: number, r: number): string {
  const son = bit <= bas ? bit + 1440 : bit
  const a = nokta(bas, r), b = nokta(son % 1440, r)
  const buyuk = son - bas > 720 ? 1 : 0
  return `M ${a.x} ${a.y} A ${r} ${r} 0 ${buyuk} 1 ${b.x} ${b.y}`
}
