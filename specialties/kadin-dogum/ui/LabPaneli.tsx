'use client'

import type { LabPanel, LabSonuc } from '../engines/clinic-fit'
import { kutu, btn, giris, etiketS } from './clinic-styles'
import { TrTarihAlan } from './TrTarihAlan'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

const KALEMLER: Array<{ id: keyof LabPanel; etiket: string; pencere: string; onamli?: boolean }> = [
  { id: 'hemogram', etiket: 'Hemogram', pencere: 'İlk vizit' },
  { id: 'idrar', etiket: 'İdrar', pencere: 'İlk vizit / her izlem' },
  { id: 'idrar_kultur', etiket: 'İdrar kültürü', pencere: 'İlk vizit' },
  { id: 'hbsag', etiket: 'HBsAg', pencere: 'İlk vizit' },
  { id: 'kan_grubu', etiket: 'Kan grubu / Rh', pencere: 'İlk vizit' },
  { id: 'idc', etiket: 'İndirekt Coombs', pencere: 'İlk vizit / 28. hafta Rh(−)' },
  { id: 'tsh', etiket: 'TSH', pencere: 'İlk vizit' },
  { id: 'ogtt', etiket: 'OGTT', pencere: '24–28. hafta' },
  { id: 'rubella', etiket: 'Rubella IgG', pencere: 'İlk vizit' },
  { id: 'sifiliz', etiket: 'Sifiliz (VDRL/RPR)', pencere: 'İlk vizit' },
  { id: 'hiv', etiket: 'HIV', pencere: 'İlk vizit (onamlı)', onamli: true },
]

export function LabPaneli({
  state,
  onChange,
  onKaydet,
}: {
  state: LabPanel
  onChange: (next: LabPanel) => void
  onKaydet: () => void
}) {
  const set = (id: keyof LabPanel, patch: Partial<LabSonuc>) => {
    onChange({ ...state, [id]: { ...(state[id] || {}), ...patch } })
  }
  return (
    <section style={kutu} data-kd="lab-paneli">
      <h2 style={{ margin: 0, fontSize: 16 }}>Laboratuvar paneli</h2>
      <p style={{ fontSize: 12, color: CHROME_RENK.muted }}>
        Sonuç kaydı — anöploidi riski hesaplanmaz. Dolu kalemler ilgili tarama penceresini Yapıldı yapar.
      </p>
      <div style={{ display: 'grid', gap: 10 }}>
        {KALEMLER.map((k) => {
          const row = state[k.id] || {}
          return (
            <div key={k.id} style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 13, color: CHROME_RENK.ink, fontWeight: 600 }}>{k.etiket}</div>
              <div style={{ fontSize: 11.5, color: CHROME_RENK.muted }}>{k.pencere}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginTop: 8 }}>
                <TrTarihAlan label="Tarih" value={row.tarih || ''} onChange={(iso) => set(k.id, { tarih: iso })} />
                <label>
                  <span style={etiketS}>Sonuç / değer</span>
                  <input value={row.sonuc || row.deger || ''} onChange={(e) => set(k.id, { sonuc: e.target.value, deger: e.target.value })} style={giris} />
                </label>
                {k.onamli && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18, fontSize: 13, color: CHROME_RENK.muted }}>
                    <input type="checkbox" checked={row.onam === true} onChange={(e) => set(k.id, { onam: e.target.checked })} />
                    Onam alındı
                  </label>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ marginTop: 12 }}>
        <button type="button" style={btn(true)} onClick={onKaydet}>Laboratuvarı kaydet</button>
      </div>
    </section>
  )
}

export default LabPaneli
