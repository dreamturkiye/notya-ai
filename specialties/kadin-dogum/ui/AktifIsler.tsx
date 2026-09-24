'use client'

import { kutu, DURUM_RENK, DURUM_ETIKET } from './clinic-styles'
import { KD_WINDOW_STATUS, kdLabel } from './labels'
import type { EvaluatedWindow } from '../engines/test-windows'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

export function AktifIsler({
  gecikmisIzlem,
  acikPencereler,
  eksikLab,
}: {
  gecikmisIzlem: Array<{ etiket: string; durum: string; haftaBas?: number; haftaSon?: number }>
  acikPencereler: EvaluatedWindow[]
  eksikLab: string[]
}) {
  const bos = gecikmisIzlem.length === 0 && acikPencereler.length === 0 && eksikLab.length === 0
  return (
    <details open style={{ ...kutu, padding: '10px 14px' }} data-kd="aktif-isler">
      <summary style={{ cursor: 'pointer', fontWeight: 700, color: CHROME_RENK.ink, fontSize: 14 }}>
        Aktif işler
        {!bos && (
          <span style={{ marginLeft: 8, fontSize: 12, color: '#F59E0B', fontWeight: 600 }}>
            {gecikmisIzlem.length + acikPencereler.length + eksikLab.length}
          </span>
        )}
      </summary>
      {bos ? (
        <p style={{ fontSize: 13, color: CHROME_RENK.muted, margin: '8px 0 0' }}>Gecikmiş izlem, açık tarama penceresi veya eksik laboratuvar yok.</p>
      ) : (
        <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
          {gecikmisIzlem.map((g) => (
            <div key={g.etiket} style={{ fontSize: 13, color: CHROME_RENK.ink, borderLeft: `3px solid ${DURUM_RENK.gecikmis}`, padding: '4px 10px' }}>
              Gecikmiş izlem · {g.etiket}
              {g.haftaBas != null ? ` (${g.haftaBas}–${g.haftaSon}. hafta)` : ''} · {DURUM_ETIKET.gecikmis}
            </div>
          ))}
          {acikPencereler.map((w) => (
            <div key={w.id} style={{ fontSize: 13, color: '#FBBF24', borderLeft: '3px solid #F59E0B', padding: '4px 10px' }}>
              Açık pencere · {w.label} · {kdLabel(KD_WINDOW_STATUS, w.status)}
            </div>
          ))}
          {eksikLab.map((k) => (
            <div key={k} style={{ fontSize: 13, color: CHROME_RENK.muted, borderLeft: '3px solid #38BDF8', padding: '4px 10px' }}>
              Eksik lab · {k}
            </div>
          ))}
        </div>
      )}
    </details>
  )
}

export default AktifIsler
