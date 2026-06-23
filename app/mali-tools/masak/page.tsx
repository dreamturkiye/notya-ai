
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function MasakPage() {
  const router = useRouter()
  const [müşteriAdi, setMüşteriAdi] = useState('')
  const [tutar, setTutar] = useState('')
  const [islemTipi, setIslemTipi] = useState('nakit_tahsilat')
  const [aciklama, setAciklama] = useState('')
  const [tarih, setTarih] = useState(new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/İstanbul' }))
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function analiz() {
    if (!tutar || !müşteriAdi) return
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/giriş/mali'); return }
    const res = await fetch('/api/mali/masak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session.access_token },
      body: JSON.stringify({ islem: { müşteriId: 'manual', müşteriAdi, islemTipi, tutar: Number(tutar), tarih, aciklama }, sendAlert: false })
    })
    const data = await res.json()
    if (data.success) setResult(data.data[0])
    setLoading(false)
  }

  const riskColors: Record<string, string> = { yok: '#16A34A', dusuk: '#65A30D', orta: '#D97706', yuksek: '#EA580C', kritik: '#DC2626' }

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', fontFamily: 'system-ui,sans-serif' }}>
      <nav style={{ background: '#0A1628', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.push('/mali-tools')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20 }}>{'<'}</button>
        <span style={{ color: '#fff', fontWeight: 700 }}>MASAK Uyumluluk Analizi</span>
      </nav>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: 20 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          {[{ label: 'Müşteri Adi', val: müşteriAdi, set: setMüşteriAdi, ph: 'şirket adi girin' },
            { label: 'Tutar (TL)', val: tutar, set: setTutar, ph: 'ornek: 35000' }].map(f => (
            <div key={f.label} style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{f.label}</label>
              <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 15, boxSizing: 'border-box' }} />
            </div>
          ))}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Islem Tipi</label>
            <select value={islemTipi} onChange={e => setIslemTipi(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 15, boxSizing: 'border-box' }}>
              {['nakit_tahsilat','nakit_odeme','eft','havale','diğer'].map(t => <option key={t} value={t}>{t.replace('_', ' ').toUpperCase()}</option>)}
            </select>
          </div>
          {islemTipi === 'eft' && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>EFT Aciklamasi</label>
              <input value={aciklama} onChange={e => setAciklama(e.target.value)} placeholder='En az 20 karakter olunmali'
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${aciklama.length > 0 && aciklama.length < 20 ? '#DC2626' : '#E5E7EB'}`, fontSize: 15, boxSizing: 'border-box' }} />
              {aciklama.length > 0 && aciklama.length < 20 && <div style={{ color: '#DC2626', fontSize: 12, marginTop: 4 }}>{aciklama.length}/20 - MASAK ihlali riski</div>}
            </div>
          )}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Islem Tarihi</label>
            <input type='date' value={tarih} onChange={e => setTarih(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 15, boxSizing: 'border-box' }} />
          </div>
          <button onClick={analiz} disabled={loading}
            style={{ width: '100%', padding: 14, background: '#7C2D12', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            {loading ? 'Analiz ediliyor...' : 'MASAK Riski Analiz Et'}
          </button>
        </div>
        {result && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: riskColors[result.riskSeviyesi], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12 }}>{result.riskSeviyesi.toUpperCase()}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Risk: {result.riskSeviyesi.toUpperCase()}</div>
                <div style={{ fontSize: 13, color: result.bildirimGerekiyor ? '#DC2626' : '#16A34A' }}>{result.bildirimGerekiyor ? 'MASAK BILDIRIMI GEREKIYOR' : 'Bildirim gerekmiyor'}</div>
              </div>
            </div>
            {result.nedenler.length > 0 && <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Nedenler:</div>
              {result.nedenler.map((n: string, i: number) => <div key={i} style={{ fontSize: 13, color: '#DC2626', padding: '4px 0' }}>• {n}</div>)}
            </div>}
            {result.yapilmasiGerekenler.length > 0 && <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Yapilmasi Gerekenler:</div>
              {result.yapilmasiGerekenler.map((y: string, i: number) => <div key={i} style={{ fontSize: 13, color: '#1B4332', padding: '4px 0' }}>✓ {y}</div>)}
            </div>}
          </div>
        )}
      </div>
    </div>
  )
}
