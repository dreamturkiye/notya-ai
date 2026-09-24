'use client'

import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type { Lesion } from '../schema'
import { DERM_MORPHOLOGY, bolgeEtiketi, dermLabel } from './labels'
import { btn, giris, etiketS } from './clinic-styles'
import { belgeAnalizHref, belgelerTabHref, goruntulemeCaptureHref } from '../engines/clinic-fit'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

const box: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 12,
  padding: 16,
}

export function LezyonKarti({
  lesions,
  emptyAction,
  patientId,
  fitzpatrick,
  onKaydet,
}: {
  lesions: Lesion[]
  emptyAction?: ReactNode
  patientId?: string
  fitzpatrick?: string
  onKaydet?: (l: { region: string; morphology: string; body_map_node?: string }) => void
}) {
  const [f, setF] = useState({ region: '', morphology: 'plaque', node: '' })
  return (
    <section style={box} data-tab="LezyonKarti">
      <h2 style={{ margin: 0, fontSize: 16 }}>Lezyon kartı</h2>
      {lesions.length === 0 && (
        <div>
          <p style={{ fontSize: 13, color: CHROME_RENK.muted }}>
            Henüz lezyon yok — lezyonlar mevcut görüntüleme kayıtlarından türetilir veya buradan eklenir.
          </p>
          {emptyAction}
        </div>
      )}
      <ul style={{ fontSize: 13, paddingLeft: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
        {lesions.map((l) => (
          <li key={l.id} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 8 }}>
            {bolgeEtiketi(l.region)} · {dermLabel(DERM_MORPHOLOGY, l.morphology)}
            {l.body_map_node ? ` · işaret ${l.body_map_node}` : ''}
            {patientId && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                <a href={goruntulemeCaptureHref(patientId, 'dermatoskopi')} style={{ fontSize: 12, color: '#2DD4BF' }}>Dermoskopi ekle</a>
                <a
                  href={l.documentId
                    ? belgeAnalizHref(patientId, l.documentId, 'dermatoskopi', fitzpatrick)
                    : belgelerTabHref(patientId, 'dermatoskopi')}
                  style={{ fontSize: 12, color: '#2DD4BF' }}
                >
                  Belgelerde analiz et
                </a>
              </div>
            )}
          </li>
        ))}
      </ul>
      {onKaydet && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!f.region.trim()) return
            onKaydet({ region: f.region.trim(), morphology: f.morphology, body_map_node: f.node || undefined })
            setF({ region: '', morphology: 'plaque', node: '' })
          }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginTop: 10 }}
        >
          <label><span style={etiketS}>Bölge</span><input style={giris} value={f.region} onChange={(e) => setF((p) => ({ ...p, region: e.target.value }))} /></label>
          <label>
            <span style={etiketS}>Morfoloji</span>
            <select style={giris} value={f.morphology} onChange={(e) => setF((p) => ({ ...p, morphology: e.target.value }))}>
              {Object.entries(DERM_MORPHOLOGY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label><span style={etiketS}>Harita işareti</span><input style={giris} value={f.node} onChange={(e) => setF((p) => ({ ...p, node: e.target.value }))} /></label>
          <div style={{ alignSelf: 'end' }}><button type="submit" style={btn(true)}>Lezyon ekle</button></div>
        </form>
      )}
    </section>
  )
}

export default LezyonKarti
