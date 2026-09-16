'use client'

import type { CSSProperties } from 'react'
import { CERVIX_SCREENING, CONTRACEPTION, cycleNote } from '../protocols/jinekoloji'

const box: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 12,
  padding: 16,
}

export function JinekolojiKart({
  lmp,
  today,
  sonServiks,
  sonServiksSonuc,
  kontrasepsiyon,
}: {
  lmp: string | null
  today: string
  sonServiks?: string | null
  sonServiksSonuc?: string | null
  kontrasepsiyon?: string | null
}) {
  const cycle = cycleNote(lmp, today)
  return (
    <section style={box} data-tab="JinekolojiKart" data-kd="jine-kart">
      <h2 style={{ margin: 0, fontSize: 16 }}>Jinekoloji kartı</h2>
      <p style={{ fontSize: 13 }}>Jinekoloji SAT {lmp ?? '—'} · {cycle.label}</p>
      <p style={{ fontSize: 12, color: '#8FA0B5' }}>{CERVIX_SCREENING.map((c) => `${c.label} (${c.interval})`).join(' · ')}</p>
      <p style={{ fontSize: 12 }}>
        HPV/Pap: {sonServiks ? new Date(sonServiks).toLocaleDateString('tr-TR') : 'kayıt yok'}
        {sonServiksSonuc ? ` · ${sonServiksSonuc}` : ''}
      </p>
      <p style={{ fontSize: 12 }}>Kontrasepsiyon: {kontrasepsiyon || CONTRACEPTION.join(', ')}</p>
      <p style={{ fontSize: 11, color: '#64748B' }}>Temel KD dilinde siklus günü yalnız jinekoloji SAT’sinden hesaplanır; gebelik SAT kullanılmaz.</p>
    </section>
  )
}

export default JinekolojiKart
