'use client'

import { useState } from 'react'
import type { CSSProperties } from 'react'
import type { PhotoSession, PhotoDevice } from '../engines/phototherapy-log'
import { cumulativeJ, SOLARIUM_FORBIDDEN, PHOTO_DEVICES } from '../engines/phototherapy-log'
import { btn, giris, etiketS } from './clinic-styles'
import { DERM_PHOTO_DEVICE, dermLabel } from './labels'

const box: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 12,
  padding: 16,
}

export function FototerapiDefteri({
  sessions,
  onEkle,
}: {
  sessions: PhotoSession[]
  onEkle?: (s: PhotoSession) => void
}) {
  const [f, setF] = useState({ date: '', device: 'nb-uvb-311', j: '', med: false, burn: false })
  return (
    <section style={box} data-tab="FototerapiDefteri">
      <h2 style={{ margin: 0, fontSize: 16 }}>Fototerapi defteri</h2>
      <p style={{ fontSize: 13 }}>
        Kümülatif {cumulativeJ(sessions)} J/cm²
        {SOLARIUM_FORBIDDEN ? ' · solaryum yok' : ''}
      </p>
      <p style={{ fontSize: 12, color: '#8FA0B5' }}>SUT: endikasyon raporu + MED + J/cm² defteri. Solaryum 2018 yasağı — cihaz listesinde yok.</p>
      {sessions.length === 0 && <p style={{ fontSize: 13, color: '#8FA0B5' }}>Seans kaydı yok.</p>}
      <ul style={{ fontSize: 13, paddingLeft: 18 }}>
        {sessions.map((s) => (
          <li key={`${s.date}-${s.device}-${s.j_cm2}`}>{s.date} · {dermLabel(DERM_PHOTO_DEVICE, s.device)} · {s.j_cm2} J/cm²{s.burn ? ' · yanık' : ''}{s.med_test ? ' · MED' : ''}</li>
        ))}
      </ul>
      {onEkle && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onEkle({
              date: f.date,
              device: f.device as PhotoDevice,
              j_cm2: Number(f.j) || 0,
              med_test: f.med,
              burn: f.burn,
            })
            setF((p) => ({ ...p, j: '', burn: false, med: false }))
          }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginTop: 10 }}
        >
          <label><span style={etiketS}>Tarih</span><input type="date" style={giris} value={f.date} onChange={(e) => setF((p) => ({ ...p, date: e.target.value }))} required /></label>
          <label>
            <span style={etiketS}>Cihaz</span>
            <select style={giris} value={f.device} onChange={(e) => setF((p) => ({ ...p, device: e.target.value }))}>
              {PHOTO_DEVICES.map((d) => <option key={d} value={d}>{dermLabel(DERM_PHOTO_DEVICE, d)}</option>)}
            </select>
          </label>
          <label><span style={etiketS}>J/cm²</span><input style={giris} value={f.j} onChange={(e) => setF((p) => ({ ...p, j: e.target.value }))} /></label>
          <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 }}><input type="checkbox" checked={f.med} onChange={(e) => setF((p) => ({ ...p, med: e.target.checked }))} /> MED testi</label>
          <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 }}><input type="checkbox" checked={f.burn} onChange={(e) => setF((p) => ({ ...p, burn: e.target.checked }))} /> Yanık</label>
          <div style={{ alignSelf: 'end' }}><button type="submit" style={btn(true)}>Seans ekle</button></div>
        </form>
      )}
    </section>
  )
}

export default FototerapiDefteri
