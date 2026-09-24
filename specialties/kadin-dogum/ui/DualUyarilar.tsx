'use client'

import type { DualUyari } from '../engines/clinic-fit'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

const RENK = { kritik: '#EF4444', dikkat: '#F59E0B', bilgi: '#38BDF8' } as const

export function DualUyarilar({ uyarilar }: { uyarilar: DualUyari[] }) {
  if (uyarilar.length === 0) return null
  return (
    <div style={{ display: 'grid', gap: 8 }} data-kd="dual-uyarilar">
      {uyarilar.map((u, i) => (
        <div
          key={i}
          style={{
            borderLeft: `3px solid ${RENK[u.seviye]}`,
            background: RENK[u.seviye] + '12',
            padding: '8px 12px',
            borderRadius: 8,
            fontSize: 13,
            color: CHROME_RENK.ink,
          }}
        >
          {u.dual ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>{u.dual.sb}</div>
              <div>{u.dual.acog}</div>
              <div style={{ gridColumn: '1 / -1', fontSize: 11, color: CHROME_RENK.muted }}>{u.dual.hint}</div>
            </div>
          ) : u.metin}
        </div>
      ))}
    </div>
  )
}

export default DualUyarilar
