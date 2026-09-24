'use client'

import { DOBYR_VTE_MADDELERI, vteHint } from '../protocols/vte-formu'
import { kutu, btn } from './clinic-styles'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

const TRIAGE_TR: Record<string, string> = {
  routine: 'Rutin',
  urgent: 'Acil değerlendirme',
  emergency: 'Acil',
}

export function VtePaneli({
  maddeler,
  onChange,
  onKaydet,
}: {
  maddeler: string[]
  onChange: (next: string[]) => void
  onKaydet: () => void
}) {
  const hint = vteHint(maddeler)
  const toggle = (id: string) => {
    onChange(maddeler.includes(id) ? maddeler.filter((x) => x !== id) : [...maddeler, id])
  }
  return (
    <section style={kutu} data-kd="vte-formu">
      <h2 style={{ margin: 0, fontSize: 16 }}>VTE risk skoru (DÖBYR)</h2>
      <p style={{ fontSize: 12, color: CHROME_RENK.muted }}>
        Puan <b style={{ color: CHROME_RENK.ink }}>{hint.puan}</b> · {TRIAGE_TR[hint.triage] || hint.triage}
        {hint.puan >= 3 ? ' · Tromboprofilaksi notu: gebelikte enoksaparin değerlendirmesi (doz uydurulmaz).' : ' · Mobilizasyon / hidrasyon'}
      </p>
      <div style={{ display: 'grid', gap: 6 }}>
        {DOBYR_VTE_MADDELERI.map((m) => (
          <label key={m.id} style={{ fontSize: 13, color: CHROME_RENK.muted, display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={maddeler.includes(m.id)} onChange={() => toggle(m.id)} />
            {m.etiket}
            <span style={{ fontSize: 11, color: CHROME_RENK.muted }}>+{m.puan}</span>
          </label>
        ))}
      </div>
      <div style={{ marginTop: 12 }}>
        <button type="button" style={btn(true)} onClick={onKaydet}>VTE formunu kaydet</button>
      </div>
    </section>
  )
}

export default VtePaneli
