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
  const priv = visits.filter((v) => v.layer === 'acog' || v.layer === 'private')
  const lohusa = visits.filter((v) => v.layer === 'lohusa')
  return (
    <section style={box} data-tab="IzlemTimeline">
      <h2 style={{ margin: 0, fontSize: 16 }}>İzlem zaman çizelgesi</h2>
      <p style={{ fontSize: 12, color: '#8FA0B5' }}>İki sütun: SB yasal asgari 4 izlem (`sb_required`) + ACOG overlay q4w/q2w/weekly (`acog_recommended`). Çakışınca birleştirilmez — uiHint: yasal asgari vs klinik öneri.</p>
      <ol style={{ fontSize: 13, paddingLeft: 18 }}>
        {sb.map((v) => (
          <li key={`sb-${v.izlem_no}`}>
            İzlem {v.izlem_no} · {v.duration_min} dk{v.late_booking ? ' · geç başvuru (yine izlem 1)' : ''} · source {v.source}
          </li>
        ))}
      </ol>
      <p style={{ fontSize: 12 }}>{priv.length} ACOG overlay vizit · {lohusa.length} lohusa vizit</p>
    </section>
  )
}

export default IzlemTimeline
