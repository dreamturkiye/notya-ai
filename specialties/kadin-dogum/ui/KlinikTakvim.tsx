'use client'

import type { CSSProperties } from 'react'
import type { PlannedVisit } from '../engines/izlem-calendar'
import { kutu } from './clinic-styles'

const col: CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10,
  padding: 12,
}

export function KlinikTakvim({
  visits,
  sbYapildi,
  sbToplam = 4,
}: {
  visits: PlannedVisit[]
  sbYapildi: number
  sbToplam?: number
}) {
  const clinic = visits.filter((v) => v.layer === 'acog' || v.kind === 'acog_overlay')
  return (
    <section style={kutu} data-kd="klinik-takvim">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>Klinik izlem (ACOG)</h2>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#86EFAC' }} data-kd="dobyr-badge">
          DÖBYR uyum {sbYapildi}/{sbToplam}
        </span>
      </div>
      <p style={{ fontSize: 12, color: '#8FA0B5', margin: '6px 0 10px' }}>
        Özel pratik varsayılanı ACOG kadansı. DÖBYR 4 izlem yasal asgari — birleştirilmez.
      </p>
      <ol style={{ fontSize: 13, paddingLeft: 18, color: '#C9D4E3', margin: 0 }}>
        {clinic.map((v, i) => (
          <li key={`acog-${v.ga_or_pp_day}-${i}`} style={{ color: v.done ? '#86EFAC' : undefined }}>
            {v.ga_or_pp_day} hf · {v.duration_min} dk
            {v.done ? ' · Yapıldı' : ''}
          </li>
        ))}
      </ol>
    </section>
  )
}

export function DualTakvimAccordion({ visits }: { visits: PlannedVisit[] }) {
  const yasal = visits.filter((v) => v.sb_required)
  const klinik = visits.filter((v) => v.acog_recommended)
  return (
    <details style={{ ...kutu, padding: '10px 14px' }} data-kd="dual-takvim">
      <summary style={{ cursor: 'pointer', fontWeight: 700, color: '#EDF1F7', fontSize: 14 }}>
        Yasal asgari vs klinik öneri
      </summary>
      <p style={{ fontSize: 12, color: '#8FA0B5' }}>Sütunlar birleştirilmez. Kayıtlı izlem haftaları Yapıldı işaretler.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={col} data-column="yasal">
          <div style={{ fontSize: 12, fontWeight: 700, color: '#FBBF24', marginBottom: 6 }}>Yasal (DÖBYR)</div>
          <ol style={{ fontSize: 13, paddingLeft: 18 }}>
            {yasal.map((v, i) => (
              <li key={`sb-${v.izlem_no}-${i}`} style={{ color: v.done ? '#86EFAC' : '#C9D4E3' }}>
                {v.izlem_no ? `İzlem ${v.izlem_no} · ` : ''}{v.ga_or_pp_day} hf
                {v.done ? ' · Yapıldı' : ''}
              </li>
            ))}
          </ol>
        </div>
        <div style={col} data-column="klinik">
          <div style={{ fontSize: 12, fontWeight: 700, color: '#38BDF8', marginBottom: 6 }}>Klinik (ACOG)</div>
          <ol style={{ fontSize: 13, paddingLeft: 18 }}>
            {klinik.map((v, i) => (
              <li key={`k-${v.ga_or_pp_day}-${i}`} style={{ color: v.done ? '#86EFAC' : '#C9D4E3' }}>
                {v.ga_or_pp_day} hf{v.sb_required ? '' : ' · klinik ek izlem'}
                {v.done ? ' · Yapıldı' : ''}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </details>
  )
}

export default KlinikTakvim
