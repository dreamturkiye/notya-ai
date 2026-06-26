'use client'
import { useState } from 'react'

interface PabauConnectProps {
  pabauConnected: boolean
  lastSynced?: string | null
  authToken: string
}

export default function PabauConnect({ pabauConnected, lastSynced, authToken }: PabauConnectProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleConnect() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/pabau/connect', {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      const data = await res.json()
      if (data.authUrl) {
        window.location.href = data.authUrl
      } else {
        setError('Baglanti baslatõlamadõ. Lutfen tekrar deneyin.')
        setLoading(false)
      }
    } catch {
      setError('Bir hata olustu.')
      setLoading(false)
    }
  }

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    border: '1px solid rgba(10,22,40,0.08)',
    borderRadius: '16px',
    padding: '32px',
    marginBottom: '24px',
    fontFamily: 'system-ui, sans-serif'
  }

  if (pabauConnected) {
    return (
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%',
            background: '#00A89D', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#fff', fontSize: '20px', flexShrink: 0
          }}>
            ?
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#0A1628', fontFamily: 'Georgia, serif' }}>
              Pabau Baglandi
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(10,22,40,0.4)', marginTop: '2px' }}>
              Son senkronizasyon: {lastSynced ? new Date(lastSynced).toLocaleString('tr-TR') : 'Henuz senkronize edilmedi'}
            </div>
          </div>
          <button
            onClick={() => console.log('disconnect todo')}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'rgba(10,22,40,0.3)', textDecoration: 'underline' }}
          >
            Baglantõyõ Kes
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '50%', background: '#2563EB',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: '18px', fontWeight: 700, flexShrink: 0
        }}>
          P
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#0A1628', fontFamily: 'Georgia, serif', marginBottom: '6px' }}>
            Pabau Kliniginizi Baglayin
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(10,22,40,0.5)', marginBottom: '16px', lineHeight: '1.5' }}>
            Hasta kayitlariniz, randevulariniz ve ilac bilgileri otomatik senkronize edilir.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            {['Randevu oncesi hasta ozeti', 'Ilac etkilesim kontrolu', 'Otomatik SOAP notu'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'rgba(10,22,40,0.6)' }}>
                <span style={{ color: '#00A89D', fontWeight: 600 }}>?</span>
                {item}
              </div>
            ))}
          </div>
          {error && (
            <div style={{ fontSize: '13px', color: '#DC2626', marginBottom: '12px' }}>{error}</div>
          )}
          <button
            onClick={handleConnect}
            disabled={loading}
            style={{
              width: '100%', padding: '12px', background: loading ? 'rgba(37,99,235,0.7)' : '#2563EB',
              border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px',
              fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
              cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'system-ui'
            }}
          >
            {loading ? 'Yonlendiriliyor...' : 'Pabau ile Baglan'}
          </button>
        </div>
      </div>
    </div>
  )
}