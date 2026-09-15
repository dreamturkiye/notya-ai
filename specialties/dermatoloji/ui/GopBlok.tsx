'use client'

import type { CSSProperties } from 'react'
import { gopIsotretinoin, type GopInput, type GopSex } from '../engines/gop-isotretinoin'

const box: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(248,113,113,0.35)',
  borderRadius: 12,
  padding: 16,
}

export function GopBlok({
  pack,
  today,
  sex = 'unknown',
}: {
  pack: Omit<GopInput, 'today_iso' | 'sex'> | null
  today: string
  sex?: GopSex
}) {
  const input: GopInput = pack
    ? { ...pack, today_iso: today, sex }
    : {
        two_contraception: false,
        hcg_iso: null,
        hcg_negative: false,
        cycle_day: null,
        rx_days: 30,
        start_iso: today,
        today_iso: today,
        sex,
      }
  const result = gopIsotretinoin(input)
  const maleNa = sex === 'male'
  const boxStyle: CSSProperties = {
    ...box,
    border: maleNa || result.allowed ? '1px solid rgba(255,255,255,0.09)' : box.border,
  }
  return (
    <section style={boxStyle} data-tab="GopBlok" data-gop={result.allowed ? 'ok' : 'blocked'} data-sex={sex}>
      <h2 style={{ margin: 0, fontSize: 16 }}>GÖP izotretinoin</h2>
      {maleNa && (
        <p style={{ fontSize: 13, color: '#8FA0B5' }}>
          Gebelik önleme maddeleri (çift kontrasepsiyon, negatif β-hCG, siklus 2–3. gün) erkek hasta için geçerli değildir.
        </p>
      )}
      {result.allowed ? (
        <p style={{ fontSize: 13, color: '#22C55E' }}>
          {maleNa ? 'Gebelik GÖP kapısı bu hasta için uygulanmaz. Reçete süresi kuralı ayrıca izlenir.' : 'Paket tam — yine de uzman kararı gerekir.'}
        </p>
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
