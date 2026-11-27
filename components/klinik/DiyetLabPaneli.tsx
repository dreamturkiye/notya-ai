'use client'
/**
 * BRANS-PAKETI (diyetisyen) — lab follow-up panel: physician-ordered glucose / HbA1c / insulin / TSH / lipids as curves
 * across visits for the patient in ?patientId (opened from the patient file). Numbers only; HOMA-IR deliberately not
 * computed (TEMD Obezite 2024 § 5.6). Data: /api/ozel-brans/diyet-lab.
 */
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import HastaTypeahead from '@/components/doktor/HastaTypeahead'
import { doktorFetch } from '@/lib/doktor/oturumFetch'

type Seri = { anahtar: string; ad: string; birim: string | null; noktalar: Array<{ tarih: string; deger: number }> }
type Veri = { seriler: Seri[]; notlar: string[]; ilacBesin: Array<{ baslik: string; maddeler: string[]; kaynak: string }> }

function Egri({ s }: { s: Seri }) {
  const d = s.noktalar.map((n) => n.deger)
  const min = Math.min(...d), max = Math.max(...d)
  const x = (i: number) => (s.noktalar.length === 1 ? 150 : 20 + (i / (s.noktalar.length - 1)) * 260)
  const y = (v: number) => (max === min ? 50 : 85 - ((v - min) / (max - min)) * 70)
  return (
    <div style={{ border: '1px solid rgba(58,44,34,0.12)', borderRadius: 12, padding: 12, background: '#fffdf8' }}>
      <b style={{ fontSize: 14 }}>{s.ad}</b>{s.birim ? <span style={{ fontSize: 12, color: '#8b7d70' }}> · {s.birim}</span> : null}
      <svg viewBox="0 0 300 100" width="100%" height="110" role="img" aria-label={`${s.ad} değerleri`}>
        <path d={s.noktalar.map((n, i) => `${i ? 'L' : 'M'}${x(i)},${y(n.deger)}`).join(' ')} fill="none" stroke="#2f4334" strokeWidth="2" />
        {s.noktalar.map((n, i) => (
          <g key={n.tarih}>
            <circle cx={x(i)} cy={y(n.deger)} r="3.5" fill="#2f4334" />
            <text x={x(i)} y={y(n.deger) - 7} fontSize="10" textAnchor="middle" fill="#3b2e24">{String(n.deger).replace('.', ',')}</text>
            <text x={x(i)} y="98" fontSize="9" textAnchor="middle" fill="#8b7d70">{n.tarih.slice(2).split('-').reverse().join('.')}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}

function Ic() {
  const [hasta, setHasta] = useState(useSearchParams()?.get('patientId') || '')
  const [veri, setVeri] = useState<Veri | null>(null)
  const [hata, setHata] = useState('')
  useEffect(() => {
    if (!hasta) return
    ;(async () => {
      const r = await doktorFetch(`/api/ozel-brans/diyet-lab?patientId=${encodeURIComponent(hasta)}`, {})
      const j = await r.json().catch(() => ({}))
      if (r.ok) { setVeri(j); setHata('') } else setHata(String(j.error || 'Okunamadı.'))
    })()
  }, [hasta])
  return (
    <div style={{ display: 'grid', gap: 12, color: '#3b2e24' }}>
      <HastaTypeahead id="diyet-lab-hasta" value={hasta} placeholder="Hasta seçin…" onLoadError={setHata} onChange={setHasta} />
      {hata && <p style={{ color: '#a45b3e', margin: 0 }}>{hata}</p>}
      {veri && (
        <>
          {veri.seriler.length ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>{veri.seriler.map((s) => <Egri key={s.anahtar} s={s} />)}</div>
            : <p style={{ margin: 0, fontSize: 13, color: '#8b7d70' }}>Bu hasta için onaylı glukoz, HbA1c, insülin, TSH veya lipid sonucu yok.</p>}
          {veri.notlar.map((n) => <p key={n} style={{ margin: 0, fontSize: 12, color: '#8b7d70' }}>{n}</p>)}
          {veri.ilacBesin.map((n) => (
            <div key={n.baslik} style={{ fontSize: 13, border: '1px solid rgba(58,44,34,0.12)', borderRadius: 12, padding: 12 }}>
              <b>{n.baslik}</b>
              <ul style={{ margin: '4px 0', paddingLeft: 18 }}>{n.maddeler.map((x) => <li key={x}>{x}</li>)}</ul>
              <span style={{ fontSize: 12, color: '#8b7d70' }}>{n.kaynak}</span>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

export default function DiyetLabPaneli() {
  return <Suspense fallback={null}><Ic /></Suspense>
}
