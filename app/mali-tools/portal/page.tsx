
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'


export default function PortalPage() {
  const router = useRouter()
  const [müşteriler, setMüşteriler] = useState<any[]>([])
  const [tokens, setTokens] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState<string | null>(null)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [daysValid, setDaysValid] = useState(30)

  useEffect(() => {
    init()
  }, [])

  async function init() {
    const rawToken = typeof window !== 'undefined' ? localStorage.getItem(Object.keys(localStorage).find(k => k.includes('auth-token')) || '') : null
    const session = rawToken ? { access_token: JSON.parse(rawToken).access_token } : null
    if (!session) { router.push('/giris/mali'); return }
    // Load müşteriler
    const { data: m } = await supabase
      .from('mali_musteriler')
      .select('*')
      .eq('musavir_id', session.user.id)
      .order('şirket_adi')
    setMüşteriler(m || [])
    // Load existing tokens
    const res = await fetch('/api/mali/portal-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session.access_token },
      body: JSON.stringify({ action: 'list' })
    })
    const data = await res.json()
    if (data.success) {
      const tokenMap: Record<string, any> = {}
      for (const t of data.data || []) {
        if (t.is_active) tokenMap[t.musteri_id] = t
      }
      setTokens(tokenMap)
    }
    setLoading(false)
  }

  async function generateLink(musteriId: string) {
    setGenerating(musteriId)
    const { data: { session } } = await (async () => { const raw = localStorage.getItem(Object.keys(localStorage).find(k => k.includes('auth-token')) || ''); return raw ? { data: { session: { access_token: JSON.parse(raw).access_token } } } : { data: { session: null } } })()
    if (!session) return
    const res = await fetch('/api/mali/portal-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session.access_token },
      body: JSON.stringify({ action: 'generate', musteriId, daysValid })
    })
    const data = await res.json()
    if (data.success) {
      await navigator.clipboard.writeText(data.portalUrl)
      setCopiedId(musteriId)
      setTimeout(() => setCopiedId(null), 3000)
      // Refresh tokens
      await init()
    }
    setGenerating(null)
  }

  async function revokeToken(tokenId: string, musteriId: string) {
    setRevoking(musteriId)
    const { data: { session } } = await (async () => { const raw = localStorage.getItem(Object.keys(localStorage).find(k => k.includes('auth-token')) || ''); return raw ? { data: { session: { access_token: JSON.parse(raw).access_token } } } : { data: { session: null } } })()
    if (!session) return
    await fetch('/api/mali/portal-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session.access_token },
      body: JSON.stringify({ action: 'revoke', tokenId })
    })
    await init()
    setRevoking(null)
  }

  async function copyExistingLink(musteriId: string) {
    const t = tokens[musteriId]
    if (!t) return
    const baseUrl = window.location.origin
    const url = baseUrl + '/portal/' + t.token_hash
    // We don't store the plain token - regenerate
    await generateLink(musteriId)
  }

  const daysLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now()
    return Math.max(0, Math.floor(diff / 86400000))
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', fontFamily: 'system-ui,sans-serif' }}>
      <nav style={{ background: '#0A1628', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.push('/mali-tools')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20 }}>{'<'}</button>
        <span style={{ color: '#fff', fontWeight: 700 }}>Müşteri Portalı Yönetimi</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#94a3b8', fontSize: 13 }}>Link suresi:</span>
          <select value={daysValid} onChange={e => setDaysValid(Number(e.target.value))}
            style={{ padding: '4px 8px', borderRadius: 6, border: 'none', fontSize: 13, background: '#1e3a5f', color: '#fff' }}>
            <option value={7}>7 gun</option>
            <option value={30}>30 gun</option>
            <option value={90}>90 gun</option>
            <option value={365}>1 yil</option>
          </select>
        </div>
      </nav>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
        <div style={{ background: 'linear-gradient(135deg, #4C1D95, #7C3AED)', borderRadius: 12, padding: 20, marginBottom: 20, color: '#fff' }}>
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Güvenli Müşteri Portalı</div>
          <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.7 }}>
            Her müşteri icin HMAC-SHA256 imzali, süreli link oluşturun. Müşteri bu link uzerinden Derya Yılmaz ile 7/24 soru sorabilir. Link herhangi bir anda iptal edilebilir.
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 16, fontSize: 12, opacity: 0.75 }}>
            <span>HMAC-SHA256 imzali</span>
            <span>Rate limited</span>
            <span>DB'de kayıtlı</span>
            <span>İptal edilebilir</span>
          </div>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6B7280' }}>Yükleniyor...</div>
        ) : müşteriler.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 12, padding: 32, textAlign: 'center', color: '#6B7280' }}>
            Henüz müşteri eklemediniz. Ana Sayfa'dan müşteri ekleyin.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {müşteriler.map((m: any) => {
              const token = tokens[m.id]
              const hasActiveToken = token && token.is_active
              const expiry = hasActiveToken ? daysLeft(token.expires_at) : 0
              return (
                <div key={m.id} style={{ background: '#fff', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: hasActiveToken ? 12 : 0 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#0A1628' }}>{m.sirket_adi}</div>
                      {m.vergi_no && <div style={{ fontSize: 12, color: '#6B7280' }}>VN: {m.vergi_no}</div>}
                      {hasActiveToken && (
                        <div style={{ fontSize: 11, color: expiry <= 3 ? '#DC2626' : '#16A34A', marginTop: 2 }}>
                          Aktif link — {expiry} gün kaldı | {token.use_count || 0} kullanim
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {hasActiveToken && (
                        <button
                          onClick={() => revokeToken(token.id, m.id)}
                          disabled={revoking === m.id}
                          style={{ padding: '6px 12px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          {revoking === m.id ? '...' : 'İptal'}
                        </button>
                      )}
                      <button
                        onClick={() => generateLink(m.id)}
                        disabled={generating === m.id}
                        style={{ padding: '6px 14px', background: copiedId === m.id ? '#16A34A' : '#4C1D95', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        {generating === m.id ? 'Oluşturuluyor...' : copiedId === m.id ? 'Kopyalandı!' : hasActiveToken ? 'Yenile & Kopyala' : 'Link Oluştur'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
