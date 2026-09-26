'use client'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import HastaTypeahead from '@/components/doktor/HastaTypeahead'
import { klinikPortalNav, klinikPortalModulu } from '@/lib/klinik/klinikPortal'

type PortalPaylasim = {
  onayliZiyaret: number
  onaysizNot: number
  aktifIlac: number
  bekleyenRecete: number
  labSonuc: number
  goruntuleme: number
  portalBos: boolean
  uyari: string | null
}

function token(): string {
  try {
    const raw = localStorage.getItem('auth-token')
    return raw ? (JSON.parse(raw).access_token || '') : ''
  } catch { return '' }
}

function Ic() {
  const sp = useSearchParams()
  const onceden = sp?.get('patientId') || ''
  const [selectedHasta, setSelectedHasta] = useState(onceden)
  const [customPin, setCustomPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [portalUrl, setPortalUrl] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<'link' | 'both' | null>(null)
  const [paylasim, setPaylasim] = useState<PortalPaylasim | null>(null)
  const [modulEtiket, setModulEtiket] = useState('Bakımım')

  useEffect(() => {
    if (onceden) setSelectedHasta(onceden)
  }, [onceden])

  useEffect(() => {
    ;(async () => {
      const t = token()
      if (!t) return
      const r = await fetch('/api/users/me', { headers: { Authorization: `Bearer ${t}` } })
      const j = r.ok ? await r.json() : null
      const nav = klinikPortalNav(klinikPortalModulu(j?.data?.specialty) || 'sacim')
      if (nav) setModulEtiket(nav.label)
    })()
  }, [])

  async function createLink() {
    if (!selectedHasta) { setError('Lütfen bir hasta seçin.'); return }
    const trimmed = customPin.trim()
    if (trimmed && !/^\d{6}$/.test(trimmed)) {
      setError('PIN boş bırakılabilir veya tam 6 haneli rakam olmalıdır.')
      return
    }
    setLoading(true)
    setError('')
    setPortalUrl('')
    setPin('')
    setCopied(null)
    setPaylasim(null)
    try {
      const t = token()
      if (!t) { setError('Oturum bulunamadı. Lütfen tekrar giriş yapın.'); return }
      const res = await fetch('/api/doktor/araclar/hasta-portali', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ hastaId: selectedHasta, ...(trimmed ? { pin: trimmed } : {}) }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(String(data.hata || 'Portal linki oluşturulamadı.')); return }
      if (!data.portalUrl || !data.pin) { setError('Portal linki veya PIN alınamadı.'); return }
      setPortalUrl(String(data.portalUrl))
      setPin(String(data.pin))
      if (data.paylasim) setPaylasim(data.paylasim)
    } catch {
      setError('Bağlantı hatası. Tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ fontSize: 14, color: '#0A1628' }}>
      <p style={{ color: 'rgba(10,22,40,0.55)', marginTop: 0, lineHeight: 1.5 }}>
        Aynı Sağlığım kabuğu (PIN, mesajlar, ziyaretler, sonuçlar, ilaçlar, öykü) + bu dalın
        {' '}<b>{modulEtiket}</b> bölümü. Tanı ve doz yok. 30 gün geçerli link + 6 haneli PIN.
      </p>
      {error && <p style={{ color: '#DC2626', fontSize: 13 }}>{error}</p>}
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Hasta</label>
      <HastaTypeahead
        id="klinik-hasta-portali-picker"
        value={selectedHasta}
        disabled={loading}
        placeholder="Hasta adı veya soyadı yazın / seçin…"
        onLoadError={(msg) => setError(msg)}
        onChange={(id) => {
          setSelectedHasta(id)
          setError('')
          setPortalUrl('')
          setPin('')
          setCopied(null)
          setPaylasim(null)
        }}
      />
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, margin: '16px 0 6px' }}>PIN (isteğe bağlı)</label>
      <input
        type="text"
        inputMode="numeric"
        maxLength={6}
        disabled={loading}
        placeholder="Boş bırakırsanız rastgele 6 hane"
        value={customPin}
        onChange={(e) => setCustomPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
        style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(10,22,40,0.12)', fontSize: 15, boxSizing: 'border-box' }}
      />
      <button
        type="button"
        onClick={() => void createLink()}
        disabled={loading || !selectedHasta}
        style={{ marginTop: 16, padding: '10px 16px', borderRadius: 8, border: 'none', background: selectedHasta && !loading ? '#2563EB' : '#94A3B8', color: '#fff', fontWeight: 700, cursor: selectedHasta && !loading ? 'pointer' : 'not-allowed' }}
      >
        {loading ? 'Oluşturuluyor…' : 'Portal linki + PIN oluştur'}
      </button>
      {paylasim?.uyari && (
        <p style={{ marginTop: 14, fontSize: 13, color: paylasim.portalBos ? '#B91C1C' : '#B45309' }}>{paylasim.uyari}</p>
      )}
      {portalUrl && pin && (
        <div style={{ marginTop: 18, padding: 16, borderRadius: 12, background: '#ECFDF5', border: '1px solid #6EE7B7' }}>
          <div style={{ fontSize: 12, color: '#065F46', marginBottom: 6 }}>Portal hazır — PIN yalnızca bir kez gösterilir</div>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 8, fontVariantNumeric: 'tabular-nums' }}>{pin}</div>
          <div style={{ fontSize: 12, wordBreak: 'break-all', marginTop: 8 }}>{portalUrl}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => void navigator.clipboard.writeText(portalUrl).then(() => setCopied('link'))} style={kopya}>
              {copied === 'link' ? 'Link kopyalandı' : 'Linki kopyala'}
            </button>
            <button type="button" onClick={() => void navigator.clipboard.writeText(`Notya · Sağlığım\nLink: ${portalUrl}\nPIN: ${pin}\n(PIN’i başkalarıyla paylaşmayın.)`).then(() => setCopied('both'))} style={{ ...kopya, background: '#fff', color: '#065F46', border: '1px solid #059669' }}>
              {copied === 'both' ? 'Link + PIN kopyalandı' : 'Link + PIN kopyala'}
            </button>
          </div>
        </div>
      )}
      <p style={{ fontSize: 12, color: 'rgba(10,22,40,0.45)', marginTop: 16 }}>
        Klinik ve Doktor aynı Sağlığım ürünüdür. TUS Derim / Yaram / FTR bölümleri bu bağlantıda açılmaz. Bağlantı, hasta izolasyonu gereği yalnızca sizin kaydınıza bağlıdır.
      </p>
    </div>
  )
}

const kopya: React.CSSProperties = { padding: '8px 12px', borderRadius: 8, border: 'none', background: '#059669', color: '#fff', fontWeight: 700, cursor: 'pointer' }

export default function KlinikHastaPortaliPaneli() {
  return <Suspense fallback={<p>Yükleniyor…</p>}><Ic /></Suspense>
}
