'use client'

import { kutu, btn } from './clinic-styles'

export function SevkCta({ sevk, nedenler }: { sevk: boolean; nedenler: string[] }) {
  if (!sevk) return null
  const tr: Record<string, string> = {
    'monochorionic twins': 'Monokoryonik ikiz',
    'TTTS concern': 'TTTS şüphesi',
    'EFW <10th + abnormal Doppler': 'EFW <10. persentil + anormal Doppler',
    'PE with severe features': 'Ağır özellikli preeklampsi',
    'placenta previa/accreta': 'Plasenta previa / akreta',
    'insulin GDM poor control': 'İnsülinli GDM, kontrolsüz',
    'cervical length short': 'Kısa serviks',
    'fetal anomaly on 18–22w scan': '18–22. hafta fetal anomali',
    'stillbirth history': 'Ölü doğum öyküsü',
    'risk_class yuksek': 'Yüksek risk sınıfı',
  }
  return (
    <section style={{ ...kutu, borderColor: 'rgba(239,68,68,0.45)' }} data-kd="sevk-cta">
      <h2 style={{ margin: 0, fontSize: 16, color: '#FCA5A5' }}>Perinatoloji sevk önerisi</h2>
      <p style={{ fontSize: 12, color: '#8FA0B5' }}>Sipariş değildir. Risk formu / Riskli Gebelikler tetikledi.</p>
      <ul style={{ fontSize: 13, color: '#EDF1F7' }}>
        {nedenler.map((n) => <li key={n}>{tr[n] || n}</li>)}
      </ul>
      <div style={{ ...btn(true), display: 'inline-block' }}>Sevk önerisi aktif — sipariş değil</div>
    </section>
  )
}

export default SevkCta
