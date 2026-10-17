'use client'

/**
 * FOTO-ARSIV-01 — body-region picker: a front/back body map for the regions that have a hit area, and a chip list for the rest
 * (so every region is reachable by tap, with or without the map). The vocabulary is lib/doktor/fotoArsiv/bolgeler.ts.
 */
import { useState } from 'react'
import { BOLGELER, BOLGE_GRUPLARI, BOLGE_GRUP_ETIKETI } from '@/lib/doktor/fotoArsiv/bolgeler'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme'

interface Props {
  deger: string | null
  onSec: (id: string | null) => void
  sayilar?: Record<string, number>
  /** Region suggested by Ayşe (highlighted with a dashed outline until the doctor chooses). */
  oneri?: string | null
}

export default function VucutHaritasi({ deger, onSec, sayilar, oneri }: Props) {
  const [yuz, setYuz] = useState<'on' | 'arka'>('on')
  const haritali = BOLGELER.filter((b) => b.harita && b.harita.yuz === yuz)
  const dogru = (id: string) => (sayilar?.[id] ?? 0) > 0
  return (
    <div data-testid="vucut-haritasi">
      <div role="tablist" aria-label="Vücut yüzü" style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {(['on', 'arka'] as const).map((y) => (
          <button key={y} role="tab" aria-selected={yuz === y} onClick={() => setYuz(y)}
            style={{ flex: 1, minHeight: 40, borderRadius: 8, border: `1px solid ${CHROME_RENK.border}`, background: yuz === y ? CHROME_RENK.pine : '#fff', color: yuz === y ? '#fff' : CHROME_RENK.ink, fontSize: 13, cursor: 'pointer' }}>
            {y === 'on' ? 'Ön' : 'Arka'}
          </button>
        ))}
      </div>
      <svg viewBox="0 0 100 200" role="group" aria-label="Vücut haritası" style={{ width: '100%', maxWidth: 220, margin: '0 auto', display: 'block', touchAction: 'manipulation' }}>
        <g fill="#efe7d8" stroke="#cfc3ad" strokeWidth="0.8">
          <ellipse cx="50" cy="17" rx="10" ry="12" />
          <rect x="43" y="28" width="14" height="8" rx="3" />
          <rect x="31" y="36" width="38" height="66" rx="10" />
          <rect x="12" y="36" width="19" height="48" rx="8" />
          <rect x="69" y="36" width="19" height="48" rx="8" />
          <rect x="7" y="84" width="19" height="19" rx="7" />
          <rect x="74" y="84" width="19" height="19" rx="7" />
          <rect x="33" y="100" width="17" height="78" rx="7" />
          <rect x="50" y="100" width="17" height="78" rx="7" />
          <rect x="31" y="178" width="19" height="19" rx="6" />
          <rect x="50" y="178" width="19" height="19" rx="6" />
        </g>
        {haritali.map((b) => {
          const h = b.harita!
          const secili = deger === b.id
          const onerilen = !secili && oneri === b.id
          return (
            <g key={b.id}>
              <rect
                x={h.x} y={h.y} width={h.w} height={h.h} rx={3}
                fill={secili ? CHROME_RENK.pine : dogru(b.id) ? 'rgba(47,67,52,0.22)' : 'rgba(47,67,52,0.06)'}
                stroke={secili ? CHROME_RENK.ink : onerilen ? CHROME_RENK.warn : 'rgba(47,67,52,0.35)'}
                strokeWidth={secili || onerilen ? 1.4 : 0.6} strokeDasharray={onerilen ? '2 1.5' : undefined}
                role="button" tabIndex={0} aria-label={b.etiket} aria-pressed={secili}
                style={{ cursor: 'pointer' }}
                onClick={() => onSec(secili ? null : b.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSec(secili ? null : b.id) } }}
              />
            </g>
          )
        })}
      </svg>
      {BOLGE_GRUPLARI.map((g) => {
        const liste = BOLGELER.filter((b) => b.grup === g)
        if (!liste.length) return null
        return (
          <div key={g} style={{ marginTop: 10 }}>
            <div style={{ fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase', color: CHROME_RENK.muted, marginBottom: 4 }}>{BOLGE_GRUP_ETIKETI[g]}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {liste.map((b) => {
                const secili = deger === b.id
                return (
                  <button key={b.id} onClick={() => onSec(secili ? null : b.id)} aria-pressed={secili}
                    style={{ minHeight: 36, padding: '4px 10px', borderRadius: 999, fontSize: 12.5, cursor: 'pointer', border: `1px ${oneri === b.id && !secili ? 'dashed' : 'solid'} ${secili ? CHROME_RENK.pine : CHROME_RENK.border}`, background: secili ? CHROME_RENK.pine : '#fff', color: secili ? '#fff' : CHROME_RENK.ink }}>
                    {b.etiket}{sayilar?.[b.id] ? ` · ${sayilar[b.id]}` : ''}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
