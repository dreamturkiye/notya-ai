'use client'

import type { ChecklistState } from '../engines/clinic-fit'
import { etiketS, giris } from './clinic-styles'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

export function IzlemChecklist({
  izlemNo,
  maddeler,
  state,
  onChange,
}: {
  izlemNo: 1 | 2 | 3 | 4
  maddeler: string[]
  state: ChecklistState
  onChange: (next: ChecklistState) => void
}) {
  const setDurum = (madde: string, durum: 'yapildi' | 'reddedildi' | 'bekliyor') => {
    onChange({
      ...state,
      [madde]: { durum, neden: durum === 'reddedildi' ? state[madde]?.neden || '' : undefined },
    })
  }
  return (
    <div data-kd="izlem-checklist" style={{ marginTop: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: CHROME_RENK.muted, marginBottom: 6 }}>
        DÖBYR {izlemNo}. izlem kontrol listesi
      </div>
      <div style={{ display: 'grid', gap: 6 }}>
        {maddeler.map((m) => {
          const row = state[m] || { durum: 'bekliyor' as const }
          return (
            <div key={m} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' }}>
              <label style={{ fontSize: 12.5, color: CHROME_RENK.ink, display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={row.durum === 'yapildi'}
                  onChange={(e) => setDurum(m, e.target.checked ? 'yapildi' : 'bekliyor')}
                />
                {m}
              </label>
              <button
                type="button"
                onClick={() => setDurum(m, row.durum === 'reddedildi' ? 'bekliyor' : 'reddedildi')}
                style={{
                  background: row.durum === 'reddedildi' ? 'rgba(239,68,68,0.2)' : 'transparent',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: row.durum === 'reddedildi' ? CHROME_RENK.warn : CHROME_RENK.muted,
                  borderRadius: 6,
                  fontSize: 11,
                  padding: '4px 8px',
                  cursor: 'pointer',
                }}
              >
                Reddedildi
              </button>
              {row.durum === 'reddedildi' && (
                <label style={{ gridColumn: '1 / -1' }}>
                  <span style={etiketS}>Red nedeni</span>
                  <input
                    value={row.neden || ''}
                    onChange={(e) => onChange({ ...state, [m]: { durum: 'reddedildi', neden: e.target.value } })}
                    style={giris}
                    placeholder="Hasta reddi / kontrendikasyon / ertelendi"
                  />
                </label>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default IzlemChecklist
