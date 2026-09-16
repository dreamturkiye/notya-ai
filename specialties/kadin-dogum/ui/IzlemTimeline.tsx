'use client'

import type { CSSProperties } from 'react'
import type { PlannedVisit } from '../engines/izlem-calendar'
import { UI_HINT_YASAL_VS_KLINIK } from '../protocols/sources'

const box: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 12,
  padding: 16,
}

const col: CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10,
  padding: 12,
}

function badge(label: string, tone: 'yasal' | 'klinik'): CSSProperties {
  return {
    display: 'inline-block',
    fontSize: 11,
    fontWeight: 700,
    borderRadius: 999,
    padding: '2px 8px',
    background: tone === 'yasal' ? 'rgba(245,158,11,0.18)' : 'rgba(56,189,248,0.18)',
    color: tone === 'yasal' ? '#FBBF24' : '#38BDF8',
  }
}

function rowLabel(v: PlannedVisit) {
  const when = v.layer === 'lohusa' ? `PP ${v.ga_or_pp_day}g` : `${v.ga_or_pp_day} hf`
  const izlem = v.izlem_no ? `İzlem ${v.izlem_no} · ` : ''
  return `${izlem}${when} · ${v.duration_min} dk${v.late_booking ? ' · geç başvuru' : ''}`
}

export function IzlemTimeline({ visits }: { visits: PlannedVisit[] }) {
  const yasal = visits.filter((v) => v.sb_required)
  const klinik = visits.filter((v) => v.acog_recommended)
  return (
    <section style={box} data-tab="IzlemTimeline" data-calendar="dual">
      <h2 style={{ margin: 0, fontSize: 16 }}>İzlem zaman çizelgesi</h2>
      <p style={{ fontSize: 12, color: '#8FA0B5' }}>{UI_HINT_YASAL_VS_KLINIK} — sütunlar birleştirilmez.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={col} data-column="yasal">
          <span style={badge('Yasal (DÖBYR)', 'yasal')} data-badge="yasal">Yasal (DÖBYR)</span>
          <p style={{ fontSize: 11, color: '#8FA0B5' }}>Yasal asgari (DÖBYR)</p>
          <ol style={{ fontSize: 13, paddingLeft: 18 }}>
            {yasal.map((v, i) => (
              <li key={`sb-${v.kind}-${v.ga_or_pp_day}-${i}`} style={{ color: v.done ? '#86EFAC' : undefined }}>
                {rowLabel(v)}
                {v.acog_recommended ? ' · her iki sütun' : ''}
                {v.done ? ' · Yapıldı' : ''}
              </li>
            ))}
          </ol>
        </div>
        <div style={col} data-column="klinik">
          <span style={badge('Klinik (ACOG)', 'klinik')} data-badge="klinik">Klinik (ACOG)</span>
          <p style={{ fontSize: 11, color: '#8FA0B5' }}>Klinik öneri (ACOG)</p>
          <ol style={{ fontSize: 13, paddingLeft: 18 }}>
            {klinik.map((v, i) => (
              <li key={`acog-${v.kind}-${v.ga_or_pp_day}-${i}`} style={{ color: v.done ? '#86EFAC' : undefined }}>
                {rowLabel(v)}
                {v.sb_required ? '' : ' · klinik ek izlem'}
                {v.done ? ' · Yapıldı' : ''}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

export default IzlemTimeline
