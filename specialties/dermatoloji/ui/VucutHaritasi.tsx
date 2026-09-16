'use client'

import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type { TotalBodyMap } from '../schema'
import { DERM_TBM_DEVICE, dermLabel } from './labels'
import { euromelanomaMonth, KETEM_IS_NOT_SKIN_CANCER } from '../engines/screening-reminders'
import { btn, giris, etiketS } from './clinic-styles'

const box: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 12,
  padding: 16,
}

export function VucutHaritasi({
  map,
  emptyAction,
  lastTbseIso,
  todayIso,
  onKaydet,
}: {
  map: TotalBodyMap | null
  emptyAction?: ReactNode
  lastTbseIso?: string | null
  todayIso?: string
  onKaydet?: (m: { deviceHint: TotalBodyMap['deviceHint']; followUpMonths: number; last_tbse_iso: string; nodeIds: string[] }) => void
}) {
  const month = todayIso ? Number(todayIso.slice(5, 7)) : (new Date().getUTCMonth() + 1)
  const [f, setF] = useState({
    deviceHint: (map?.deviceHint || 'manual') as TotalBodyMap['deviceHint'],
    followUpMonths: String(map?.followUpMonths || 6),
    last: lastTbseIso || '',
  })
  return (
    <section style={box} data-tab="VucutHaritasi">
      <h2 style={{ margin: 0, fontSize: 16 }}>TBSE / vücut haritası</h2>
      {month === euromelanomaMonth() && (
        <p style={{ fontSize: 12, color: '#FDE68A' }}>Euromelanoma Mayıs ayı — deri tarama vurgusu. KETEM deri kanseri programı değildir.</p>
      )}
      {KETEM_IS_NOT_SKIN_CANCER && (
        <p style={{ fontSize: 11, color: '#8FA0B5' }}>KETEM ipuçları yalnız meme / serviks / kolon — deri kanseri değil.</p>
      )}
      {!map && (
        <div>
          <p style={{ fontSize: 13, color: '#8FA0B5' }}>Harita yok — işaretler lezyon kayıtlarıyla gelir.</p>
          {emptyAction}
        </div>
      )}
      {map && (
        <>
          <p style={{ fontSize: 13, color: '#8FA0B5' }}>
            {dermLabel(DERM_TBM_DEVICE, map.deviceHint)} · takip {map.followUpMonths} ay
            {lastTbseIso ? ` · son TBSE ${lastTbseIso}` : ' · TBSE henüz yok'}
          </p>
          <ul style={{ fontSize: 13, paddingLeft: 18 }}>
            {map.nodeIds.map((id) => <li key={id}>{id}</li>)}
          </ul>
        </>
      )}
      {onKaydet && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onKaydet({
              deviceHint: f.deviceHint,
              followUpMonths: Math.min(12, Math.max(1, Number(f.followUpMonths) || 6)),
              last_tbse_iso: f.last,
              nodeIds: map?.nodeIds || [],
            })
          }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginTop: 10 }}
        >
          <label>
            <span style={etiketS}>Cihaz ipucu</span>
            <select style={giris} value={f.deviceHint} onChange={(e) => setF((p) => ({ ...p, deviceHint: e.target.value as TotalBodyMap['deviceHint'] }))}>
              <option value="manual">Elle işaretli</option>
              <option value="molemax">MoleMax</option>
              <option value="fotofinder">FotoFinder</option>
            </select>
          </label>
          <label><span style={etiketS}>Takip (ay)</span><input style={giris} value={f.followUpMonths} onChange={(e) => setF((p) => ({ ...p, followUpMonths: e.target.value }))} /></label>
          <label><span style={etiketS}>Son TBSE</span><input type="date" style={giris} value={f.last} onChange={(e) => setF((p) => ({ ...p, last: e.target.value }))} /></label>
          <div style={{ alignSelf: 'end' }}><button type="submit" style={btn(true)}>Harita kaydet</button></div>
        </form>
      )}
    </section>
  )
}

export default VucutHaritasi
