'use client'

import type { KararKart } from '../protocols/karar-kartlari'
import { kutu } from './clinic-styles'

const TRIAGE: Record<string, string> = {
  routine: 'Rutin',
  urgent: 'İvedi',
  emergency: 'Acil',
}

export function KararKartlari({ kartlar }: { kartlar: KararKart[] }) {
  return (
    <section style={{ display: 'grid', gap: 10 }} data-kd="karar-kartlari">
      <h2 style={{ margin: 0, fontSize: 16 }}>Karar kartları — GDM / PE / Rh / GBS</h2>
      {kartlar.length === 0 && (
        <p style={{ fontSize: 13, color: '#8FA0B5', margin: 0 }}>
          Gebelik kaydı açılınca GDM, preeklampsi, Rh/Anti-D ve GBS kartları burada durur.
        </p>
      )}
      {kartlar.map((k) => (
        <article key={k.id} style={kutu} data-kart={k.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 15 }}>{k.baslik}</h2>
            <span style={{ fontSize: 11, color: '#8FA0B5' }}>{TRIAGE[k.triage] || k.triage}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#38BDF8' }}>ACOG — ne yap</div>
              <ul style={{ margin: '4px 0 0', paddingLeft: 16, fontSize: 12.5, color: '#C9D4E3' }}>
                {k.acog.map((s) => <li key={s}>{s}</li>)}
              </ul>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#FBBF24' }}>DÖBYR — zorunlu mu</div>
              <ul style={{ margin: '4px 0 0', paddingLeft: 16, fontSize: 12.5, color: '#C9D4E3' }}>
                {k.dobyr.map((s) => <li key={s}>{s}</li>)}
              </ul>
            </div>
          </div>
          {k.conflict && (
            <p style={{ fontSize: 11.5, color: '#F59E0B', margin: '8px 0 0' }}>yasal asgari vs klinik öneri — birleştirilmez</p>
          )}
          <p style={{ fontSize: 11, color: '#64748B', margin: '8px 0 0' }} title={k.williams}>
            Williams: derinlik (ders kitabı rolü — metin kopyalanmaz)
          </p>
        </article>
      ))}
    </section>
  )
}

export default KararKartlari
