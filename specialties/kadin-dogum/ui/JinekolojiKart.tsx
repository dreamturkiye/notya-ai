'use client'

import type { CSSProperties } from 'react'
import { CERVIX_SCREENING, CONTRACEPTION, cycleNote } from '../protocols/jinekoloji'

const box: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 12,
  padding: 16,
}

export function JinekolojiKart({ lmp, today }: { lmp: string | null; today: string }) {
  const cycle = cycleNote(lmp, today)
  return (
    <section style={box} data-tab="JinekolojiKart">
      <h2 style={{ margin: 0, fontSize: 16 }}>Jinekoloji kartı</h2>
      <p style={{ fontSize: 13 }}>LMP {lmp ?? '—'} · {cycle.label}</p>
      <p style={{ fontSize: 12, color: '#8FA0B5' }}>{CERVIX_SCREENING.map((c) => c.label).join(' · ')}</p>
      <p style={{ fontSize: 12 }}>Kontrasepsiyon: {CONTRACEPTION.join(', ')}</p>
    </section>
  )
}

export default JinekolojiKart
