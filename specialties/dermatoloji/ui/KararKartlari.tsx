'use client'

import type { DermKararKart } from '../protocols/karar-kartlari'
import { kutu } from './clinic-styles'

const TRIAGE: Record<string, string> = {
  routine: 'Rutin',
  urgent: 'İvedi',
  emergency: 'Acil',
}

export function KararKartlari({ kartlar }: { kartlar: DermKararKart[] }) {
  if (!kartlar.length) return null
  return (
    <section style={{ display: 'grid', gap: 10 }} data-derm="karar-kartlari">
      {kartlar.map((k) => (
        <article key={k.id} style={kutu} data-kart={k.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 15 }}>{k.baslik}</h2>
            <span style={{ fontSize: 11, color: '#8FA0B5' }}>{TRIAGE[k.triage] || k.triage}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#38BDF8' }}>{k.solBaslik}</div>
              <ul style={{ margin: '4px 0 0', paddingLeft: 16, fontSize: 12.5, color: '#C9D4E3' }}>
                {k.sol.map((s) => <li key={s}>{s}</li>)}
              </ul>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#FBBF24' }}>{k.sagBaslik}</div>
              <ul style={{ margin: '4px 0 0', paddingLeft: 16, fontSize: 12.5, color: '#C9D4E3' }}>
                {k.sag.map((s) => <li key={s}>{s}</li>)}
              </ul>
            </div>
          </div>
          {k.conflict && (
            <p style={{ fontSize: 11.5, color: '#F59E0B', margin: '8px 0 0' }}>
              İki kaynak yan yana — birleştirilmez
            </p>
          )}
          <p style={{ fontSize: 11, color: '#64748B', margin: '8px 0 0' }} title={k.goldIpucu}>
            {k.goldIpucu}
          </p>
        </article>
      ))}
    </section>
  )
}

export default KararKartlari
