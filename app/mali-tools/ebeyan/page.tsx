
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function EBeyanPage() {
  const router = useRouter()
  const [hesaplanan, setHesaplanan] = useState('')
  const [indirilecek, setIndirilecek] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function hesapla() {
    if (!hesaplanan || !indirilecek) return
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/giris/mali'); return }
    const res = await fetch('/api/mali/ebeyan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session.access_token },
      body: JSON.stringify({ action: 'hesapla', hesaplanan: Number(hesaplanan), indirilecek: Number(indirilecek) })
    })
    const data = await res.json()
    if (data.success) setResult(data.data)
    setLoading(false)
  }

  const fmt = (n: number) => n.toLocaleString('tr-TR', { minimumFractionDigits: 2 })

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', fontFamily: 'system-ui,sans-serif' }}>
      <nav style={{ background: '#0A1628', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.push('/mali-tools')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20 }}>{'<'}</button>
        <span style={{ color: '#fff', fontWeight: 700 }}>GIB e-Beyan / KDV Hesabi</span>
      </nav>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: 20 }}>
        <div style={{ background: '#065F46', borderRadius: 12, padding: 16, marginBottom: 20, color: '#fff', fontSize: 13 }}>
          <strong>GIB e-Beyan Entegrasyonu:</strong> KDV hesaplayin. Gerçek GIB API entegrasyonu icin müşavirinizin GIB API token bilgisini girmesi gerekir.
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 18, color: '#0A1628' }}>KDV Hesaplama</h2>
          {[{ label: 'Hesaplanan KDV (TL)', val: hesaplanan, set: setHesaplanan },
            { label: 'Indirilecek KDV (TL)', val: indirilecek, set: setIndirilecek }].map(f => (
            <div key={f.label} style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{f.label}</label>
              <input type='number' value={f.val} onChange={e => f.set(e.target.value)} placeholder='0.00'
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 15, boxSizing: 'border-box' }} />
            </div>
          ))}
          <button onClick={hesapla} disabled={loading}
            style={{ width: '100%', padding: 14, background: '#065F46', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            {loading ? 'Hesaplanıyor...' : 'KDV Hesapla'}
          </button>
        </div>
        {result && (
          <div style={{ background: result.iadeMi ? '#EFF6FF' : '#FEF2F2', border: `1px solid ${result.iadeMi ? '#2563EB' : '#DC2626'}`, borderRadius: 12, padding: 24 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: result.iadeMi ? '#2563EB' : '#DC2626', marginBottom: 8 }}>
              {fmt(Math.abs(result.net))} TL
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#0A1628' }}>{result.mesaj}</div>
            <div style={{ marginTop: 12, fontSize: 13, color: '#6B7280' }}>KDV Kanunu Md.29 - Indirim hakki</div>
          </div>
        )}
      </div>
    </div>
  )
}
