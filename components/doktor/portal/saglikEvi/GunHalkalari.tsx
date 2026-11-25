'use client'
/**
 * BUGUN-V2 — the three day rings (İlaç teal · Ölçüm sun · Hedef green), Activity-style concentric circles with a legend of
 * big numbers. Same ring language as the doctor's Ev verisi card. A ring is drawn only for what the patient has (see
 * gunHalkalari). The arcs draw in once on load and glide to the new value after a tap; a closed ring gets a small check
 * at its start. Presentational and wordless — every word arrives as a prop (gorunum-paritesi-ulke).
 */
import type { CSSProperties } from 'react'
import type { GunHalkasi } from '@/lib/saglikEvi/bugunGorunum'

const C = 100
const KALINLIK = 17
const ARA = 3

export interface HalkaEtiketi { ad: string; deger: string; pay?: string; alt: string; altVurgu?: 'uyari' | 'tamam' | null }

export function GunHalkalari({ halkalar, etiketler, aria }: { halkalar: GunHalkasi[]; etiketler: HalkaEtiketi[]; aria: string }) {
  const r0 = C - KALINLIK / 2 - 2
  return (
    <div className="sgb-halkalar" role="img" aria-label={aria}>
      <svg className="sgb-halka-svg" viewBox="0 0 200 200" aria-hidden>
        {halkalar.map((h, i) => {
          const r = r0 - i * (KALINLIK + ARA)
          const c = 2 * Math.PI * r
          const o = Math.max(0, Math.min(1, h.oran ?? 0))
          return (
            <g key={h.anahtar} transform={`rotate(-90 ${C} ${C})`}>
              <circle cx={C} cy={C} r={r} fill="none" stroke={h.renk} strokeOpacity={0.16} strokeWidth={KALINLIK} />
              {o > 0 ? (
                <circle
                  className={`sgb-yay${h.tamam ? ' sgb-yay--tamam' : ''}`}
                  cx={C} cy={C} r={r} fill="none" stroke={h.renk} strokeWidth={KALINLIK} strokeLinecap="round"
                  strokeDasharray={`${c} ${c}`} strokeDashoffset={c * (1 - Math.max(o, 0.015))}
                  style={{ ['--sgb-c' as string]: c, animationDelay: `${i * 90}ms` } as CSSProperties}
                />
              ) : null}
              {h.tamam ? (
                <path transform={`rotate(90 ${C + r} ${C})`} d={`M${C + r - 4} ${C + 0.5} l2.8 2.8 l5.2 -5.6`} fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="sgb-yay-tik" />
              ) : null}
            </g>
          )
        })}
      </svg>
      <dl className="sgb-lejant">
        {halkalar.map((h, i) => {
          const e = etiketler[i]
          return (
            <div key={h.anahtar} className="sgb-lejant-s">
              <dt><i style={{ background: h.renk }} />{e.ad}</dt>
              <dd className="sgb-lejant-d">{e.deger}{e.pay ? <small>/{e.pay}</small> : null}</dd>
              <dd className={`sgb-lejant-alt${e.altVurgu ? ` sgb-lejant-alt--${e.altVurgu}` : ''}`}>{e.alt}</dd>
            </div>
          )
        })}
      </dl>
    </div>
  )
}
