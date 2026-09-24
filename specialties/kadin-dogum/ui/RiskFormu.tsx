'use client'

import { DOBYR_RISK_MADDELERI, riskClassFromForm } from '../protocols/risk-formu'
import { KD_RISK_CLASS, kdLabel } from './labels'
import { kutu, btn } from './clinic-styles'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

export function RiskFormu({
  maddeler,
  onChange,
  onKaydet,
}: {
  maddeler: string[]
  onChange: (next: string[]) => void
  onKaydet: () => void
}) {
  const sinif = riskClassFromForm(maddeler)
  const toggle = (id: string) => {
    onChange(maddeler.includes(id) ? maddeler.filter((x) => x !== id) : [...maddeler, id])
  }
  return (
    <section style={kutu} data-kd="risk-formu">
      <h2 style={{ margin: 0, fontSize: 16 }}>Gebelikte risk değerlendirme (DÖBYR)</h2>
      <p style={{ fontSize: 12, color: CHROME_RENK.muted }}>
        Yasal taban: DÖBYR 2026 / Riskli Gebelikler. Sınıf: <b style={{ color: CHROME_RENK.ink }}>{kdLabel(KD_RISK_CLASS, sinif)}</b>
      </p>
      <div style={{ display: 'grid', gap: 6 }}>
        {DOBYR_RISK_MADDELERI.map((m) => (
          <label key={m.id} style={{ fontSize: 13, color: CHROME_RENK.muted, display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={maddeler.includes(m.id)} onChange={() => toggle(m.id)} />
            {m.etiket}
            <span style={{ fontSize: 11, color: m.sinif === 'yuksek' ? '#F87171' : '#FBBF24' }}>
              {m.sinif === 'yuksek' ? 'Yüksek' : 'Orta'}
            </span>
          </label>
        ))}
      </div>
      <div style={{ marginTop: 12 }}>
        <button type="button" style={btn(true)} onClick={onKaydet}>Risk formunu kaydet</button>
      </div>
    </section>
  )
}

export default RiskFormu
