'use client'

import type { DestekAsiPanel, DestekAsiDurum } from '../engines/clinic-fit'
import { DESTEK_ASI_KALEMLERI } from '../engines/clinic-fit'
import { kutu, btn, giris, etiketS } from './clinic-styles'
import { TrTarihAlan } from './TrTarihAlan'

const DURUM_TR: Record<DestekAsiDurum, string> = {
  yapildi: 'Yapıldı',
  atlanmadi: 'Atlandı',
  bekliyor: 'Bekliyor',
}

export function DestekAsiPaneli({
  state,
  onChange,
  onKaydet,
}: {
  state: DestekAsiPanel
  onChange: (next: DestekAsiPanel) => void
  onKaydet: () => void
}) {
  return (
    <section style={kutu} data-kd="destek-asi">
      <h2 style={{ margin: 0, fontSize: 16 }}>Destek ve aşı</h2>
      <p style={{ fontSize: 12, color: '#8FA0B5' }}>
        DÖBYR akış şeması pencereleri. ACOG Tdap ~27–36. hafta. D vitamini IU’su uydurulmaz — DÖBYR şemasına bakınız.
      </p>
      <div style={{ display: 'grid', gap: 10 }}>
        {DESTEK_ASI_KALEMLERI.map((k) => {
          const row = state[k.id] || { durum: 'bekliyor' as const }
          return (
            <div key={k.id} style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 13, color: '#EDF1F7', fontWeight: 600 }}>{k.etiket}</div>
              <div style={{ fontSize: 11.5, color: '#8FA0B5' }}>{k.pencere} · {k.not}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginTop: 8 }}>
                <label>
                  <span style={etiketS}>Durum</span>
                  <select
                    value={row.durum}
                    onChange={(e) => onChange({ ...state, [k.id]: { ...row, durum: e.target.value as DestekAsiDurum } })}
                    style={giris}
                  >
                    {Object.entries(DURUM_TR).map(([v, et]) => <option key={v} value={v}>{et}</option>)}
                  </select>
                </label>
                <TrTarihAlan
                  label="Tarih"
                  value={row.tarih || ''}
                  onChange={(iso) => onChange({ ...state, [k.id]: { ...row, tarih: iso } })}
                />
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ marginTop: 12 }}>
        <button type="button" style={btn(true)} onClick={onKaydet}>Destek ve aşıyı kaydet</button>
      </div>
    </section>
  )
}

export default DestekAsiPaneli
