
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

const SORGULAR = [
  { id: 'vergi_borcu', label: 'Vergi Borcu Sorgulama', desc: 'GIB uzerinden mukellef vergi borcu', color: '#1e3a5f' },
  { id: 'sgk_prim_borcu', label: 'SGK Prim Borcu', desc: 'SGK prim borc sorgulama', color: '#065F46' },
  { id: 'sicil_durumu', label: 'Vergi Sicil Durumu', desc: 'Mukellef aktif/pasif durumu', color: '#1B4332' },
  { id: 'kosgeb_belge', label: 'KOSGEB KOBi Belgesi', desc: 'KOBi durum belgesi sorgulama', color: '#4C1D95' },
  { id: 'nace_kodu', label: 'NACE Kodu Sorgulama', desc: 'Faaliyet kodu kontrolu', color: '#92400E' },
  { id: 'ticaret_sicil', label: 'Ticaret Sicil', desc: 'şirket tescil durumu', color: '#0F766E' },
]

export default function EDevletPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)
  const [vergiNo, setVergiNo] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function sorgula() {
    if (!selected) return
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/giris/mali'); return }
    const res = await fetch('/api/mali/edevlet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session.access_token },
      body: JSON.stringify({ sorguTipi: selected, vergiNo, useAI: true })
    })
    const data = await res.json()
    if (data.success) setResult(data)
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', fontFamily: 'system-ui,sans-serif' }}>
      <nav style={{ background: '#0A1628', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.push('/mali-tools')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20 }}>{'<'}</button>
        <span style={{ color: '#fff', fontWeight: 700 }}>e-Devlet Rehberi</span>
      </nav>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {SORGULAR.map(s => (
            <div key={s.id} onClick={() => { setSelected(s.id); setResult(null) }}
              style={{ background: selected === s.id ? s.color : '#fff', borderRadius: 10, padding: 16, cursor: 'pointer', border: `2px solid ${selected === s.id ? s.color : '#E5E7EB'}`, transition: 'all 0.15s' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: selected === s.id ? '#fff' : '#0A1628', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: selected === s.id ? 'rgba(255,255,255,0.7)' : '#6B7280' }}>{s.desc}</div>
            </div>
          ))}
        </div>
        {selected && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Vergi No (Opsiyonel)</label>
              <input value={vergiNo} onChange={e => setVergiNo(e.target.value)} placeholder='10 haneli vergi kimlik no'
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 15, boxSizing: 'border-box' }} />
            </div>
            <button onClick={sorgula} disabled={loading}
              style={{ width: '100%', padding: 14, background: '#1e40af', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              {loading ? 'Hazırlaniyor...' : 'Rehber ve Adimlar Goster'}
            </button>
          </div>
        )}
        {result && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            {result.deryaYaniti && (
              <div style={{ background: '#1e3a5f', borderRadius: 8, padding: 16, marginBottom: 16, color: '#fff', fontSize: 14, lineHeight: 1.6 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>DERYA YILMAZ</div>
                {result.deryaYaniti}
              </div>
            )}
            {result.data.linkler?.map((l: any, i: number) => (
              <a key={i} href={l.url} target='_blank' rel='noreferrer'
                style={{ display: 'block', padding: '12px 16px', background: '#EFF6FF', borderRadius: 8, marginBottom: 8, color: '#2563EB', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                {l.aciklama} →
              </a>
            ))}
            {result.data.yapilmasiGerekenler?.map((y: string, i: number) => (
              <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #F1F5F9', fontSize: 14, color: '#374151' }}>
                <span style={{ color: '#1B4332', fontWeight: 700 }}>{i + 1}.</span> {y}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
