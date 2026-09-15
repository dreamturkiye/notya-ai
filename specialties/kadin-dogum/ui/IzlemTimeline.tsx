'use client'

import type { CSSProperties } from 'react'
import type { PlannedVisit } from '../engines/izlem-calendar'

const box: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 12,
  padding: 16,
}

export function IzlemTimeline({ visits }: { visits: PlannedVisit[] }) {
  const sb = visits.filter((v) => v.layer === 'sb')
  const priv = visits.filter((v) => v.layer === 'private')
  const lohusa = visits.filter((v) => v.layer === 'lohusa')
  return (
    <section style={box} data-tab="IzlemTimeline">
      <h2 style={{ margin: 0, fontSize: 16 }}>İzlem zaman çizelgesi</h2>
      <p style={{ fontSize: 12, color: '#8FA0B5' }}>İki katman: SB yasal asgari 4 izlem + özel klinik overlay. Lohusa ayrı.</p>
      <ol style={{ fontSize: 13, paddingLeft: 18 }}>
        {sb.map((v) => (
          <li key={`sb-${v.izlem_no}`}>
            İzlem {v.izlem_no} · {v.duration_min} dk{v.late_booking ? ' · geç başvuru (yine izlem 1)' : ''}
          </li>
        ))}
      </ol>
      <p style={{ fontSize: 12 }}>{priv.length} özel klinik vizit · {lohusa.length} lohusa vizit</p>
    </section>
  )
}

export default IzlemTimeline
