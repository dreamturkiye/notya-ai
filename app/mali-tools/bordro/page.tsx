
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'


export default function BordroPage() {
  const router = useRouter()
  const [brutMaas, setBrutMaas] = useState('')
  const [kidemYili, setKidemYili] = useState('')
  const [engellilik, setEngellilik] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function hesapla() {
    if (!brutMaas || isNaN(Number(brutMaas))) { setError('Geçerli bir brüt maş girin'); return }
    setLoading(true); setError('')
    const rawToken = typeof window !== 'undefined' ? localStorage.getItem(Object.keys(localStorage).find(k => k.includes('auth-token')) || '') : null
    const token = rawToken ? JSON.parse(rawToken).access_token : null
    if (!token) { router.push('/giris/mali'); setLoading(false); return }
    const res = await fetch('/api/mali/bordro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ brutMaas: Number(brutMaas), kidemYili: Number(kidemYili) || 0, engellilikDerecesi: engellilik ? Number(engellilik) : null })
    })
    const data = await res.json()
    if (data.success) setResult(data)
    else setError(data.error || 'Hata oluştu')
    setLoading(false)
  }

  const fmt = (n: number) => n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', fontFamily: 'system-ui,sans-serif' }}>
      <nav style={{ background: '#0A1628', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.push('/mali-tools')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20 }}>{'<'}</button>
        <span style={{ color: '#fff', fontWeight: 700 }}>Bordro Hesaplayıcı 2026</span>
      </nav>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: 20 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ margin: '0 0 20px', color: '#0A1628', fontSize: 18 }}>Calisan Bilgileri</h2>
          {[{ label: 'Brut Maas (TL)', val: brutMaas, set: setBrutMaas, placeholder: 'ornek: 45000', type: 'number' },
            { label: 'Kidem Yili', val: kidemYili, set: setKidemYili, placeholder: 'ornek: 5', type: 'number' }].map(f => (
            <div key={f.label} style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{f.label}</label>
              <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 15, boxSizing: 'border-box' }} />
            </div>
          ))}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Engellilik Derecesi</label>
            <select value={engellilik} onChange={e => setEngellilik(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 15, boxSizing: 'border-box' }}>
              <option value=''>Yok</option>
              <option value='1'>1. Derece (6.900 TL indirim)</option>
              <option value='2'>2. Derece (4.000 TL indirim)</option>
              <option value='3'>3. Derece (3.000 TL indirim)</option>
            </select>
          </div>
          {error && <div style={{ color: '#DC2626', fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <button onClick={hesapla} disabled={loading}
            style={{ width: '100%', padding: 14, background: '#1B4332', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            {loading ? 'Hesaplanıyor...' : 'Bordroyu Hesapla'}
          </button>
        </div>
        {result && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ background: '#1B4332', borderRadius: 8, padding: 16, marginBottom: 20, textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Net Maas</div>
              <div style={{ color: '#fff', fontSize: 32, fontWeight: 700 }}>{fmt(result.data.netMaas)} TL</div>
            </div>
            {[['Brut Maas', result.data.brutMaas], ['SGK Isci Payi', result.data.sgkIsciBrut], ['SGK Isveren Payi', result.data.sgkIsveren], ['Issizlik Isci', result.data.issizlikIsci], ['Issizlik Isveren', result.data.issizlikIsveren], ['Gelir Vergisi', result.data.gelirVergisi], ['Damga Vergisi', result.data.damgaVergisi], ['Isveren Toplam Maliyeti', result.data.isverenToplamMaliyet], ['Kidem Tazminati Tavan', result.data.kidemTazminatiTavan]].map(([k, v]) => (
              <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9', fontSize: 14 }}>
                <span style={{ color: '#374151' }}>{k as string}</span>
                <span style={{ fontWeight: 600, color: '#0A1628' }}>{fmt(v as number)} TL</span>
              </div>
            ))}
            {result.data.yıllıkKidemHakki > 0 && (
              <div style={{ marginTop: 16, background: '#FEF3C7', borderRadius: 8, padding: 12, fontSize: 13, color: '#92400E' }}>
                Yıllık Kidem Hakki: {fmt(result.data.yıllıkKidemHakki)} TL ({kidemYili} yil)
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
