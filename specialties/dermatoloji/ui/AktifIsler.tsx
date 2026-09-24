'use client'

import { kutu, DURUM_RENK, DURUM_ETIKET } from './clinic-styles'
import type { DermAktifIs } from '../engines/clinic-fit'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

export function AktifIsler({ isler }: { isler: DermAktifIs[] }) {
  const bos = isler.length === 0
  return (
    <details open style={{ ...kutu, padding: '10px 14px' }} data-derm="aktif-isler">
      <summary style={{ cursor: 'pointer', fontWeight: 700, color: CHROME_RENK.ink, fontSize: 14 }}>
        Aktif işler
        {!bos && (
          <span style={{ marginLeft: 8, fontSize: 12, color: '#F59E0B', fontWeight: 600 }}>{isler.length}</span>
        )}
      </summary>
      {bos ? (
        <p style={{ fontSize: 13, color: CHROME_RENK.muted, margin: '8px 0 0' }}>Gecikmiş yama, TBSE, eksik skor veya onam yok.</p>
      ) : (
        <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
          {isler.map((g) => (
            <div
              key={g.id}
              style={{
                fontSize: 13,
                color: CHROME_RENK.ink,
                borderLeft: `3px solid ${g.durum === 'gecikmis' ? DURUM_RENK.gecikmis : g.durum === 'zamani' ? DURUM_RENK.zamani : '#38BDF8'}`,
                padding: '4px 10px',
              }}
            >
              {g.etiket} · {g.durum === 'gecikmis' ? DURUM_ETIKET.gecikmis : g.durum === 'zamani' ? DURUM_ETIKET.zamani : 'Eksik'}
            </div>
          ))}
        </div>
      )}
    </details>
  )
}

export default AktifIsler
