'use client'

import type { CSSProperties } from 'react'
import { gopIsotretinoin, type GopInput } from '../engines/gop-isotretinoin'

const box: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(248,113,113,0.35)',
  borderRadius: 12,
  padding: 16,
}

export function GopBlok({
  pack,
  today,
}: {
  pack: Omit<GopInput, 'today_iso'> | null
  today: string
}) {
  const input: GopInput = pack
    ? { ...pack, today_iso: today }
    : {
        two_contraception: false,
        hcg_iso: null,
        hcg_negative: false,
        cycle_day: null,
        rx_days: 30,
        start_iso: today,
        today_iso: today,
      }
  const result = gopIsotretinoin(input)
  return (
    <section style={box} data-tab="GopBlok" data-gop={result.allowed ? 'ok' : 'blocked'}>
      <h2 style={{ margin: 0, fontSize: 16 }}>GÖP isotretinoin</h2>
      {result.allowed ? (
        <p style={{ fontSize: 13, color: '#22C55E' }}>Paket tam — yine de uzman kararı gerekir.</p>
      ) : (
        <div>
          <p style={{ fontSize: 13, color: '#FCA5A5', marginBottom: 6 }}>Paket eksik — reçete bloke.</p>
          <ul style={{ fontSize: 13, paddingLeft: 18, color: '#FCA5A5' }}>
            {result.blocks.map((b) => <li key={b}>{b}</li>)}
          </ul>
        </div>
      )}
    </section>
  )
}

export default GopBlok
