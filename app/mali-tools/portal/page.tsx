'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import MaliNav from '@/components/mali/MaliNav'
import { getAccessToken, musteriAdi, asArray } from '@/lib/portal/toolsUi'

type Musteri = Record<string, unknown> & { id: string }
type PortalToken = Record<string, unknown> & { id: string; musteri_id: string }

const PURPLE = '#4C1D95'
const GREEN = '#16A34A'
const RED = '#DC2626'

export default function MaliPortalAdminPage() {
  const router = useRouter()
  const [musteriler, setMusteriler] = useState<Musteri[]>([])
  const [tokens, setTokens] = useState<Record<string, PortalToken>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState<string | null>(null)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [links, setLinks] = useState<Record<string, string>>({})
  const [daysValid, setDaysValid] = useState(30)

  const load = useCallback(async () => {
    const token = getAccessToken()
    if (!token) { router.push('/giris/mali'); return }
    setLoading(true)
    setError('')
    try {
      const [musteriRes, tokenRes] = await Promise.all([
        fetch('/api/mali/musteriler', { headers: { Authorization: 'Bearer ' + token } })
          .then((r) => r.json())
          .catch(() => null),
        fetch('/api/mali/portal-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
          body: JSON.stringify({ action: 'list' }),
        })
          .then((r) => r.json())
          .catch(() => null),
      ])

      if (musteriRes?.success) {
        setMusteriler(asArray<Musteri>(musteriRes.data))
      } else {
        setMusteriler([])
        setError(musteriRes?.error || 'Müşteri listesi yüklenemedi.')
      }

      const map: Record<string, PortalToken> = {}
      for (const t of asArray<PortalToken>(tokenRes?.data)) {
        const active = t.is_active !== false && !t.revoked_at
        const notExpired = !t.expires_at || new Date(String(t.expires_at)) > new Date()
        if (active && notExpired && t.musteri_id) map[String(t.musteri_id)] = t
      }
      setTokens(map)
    } catch {
      setError('Bağlantı hatası. Lütfen sayfayı yenileyin.')
    }
    setLoading(false)
  }, [router])

  useEffect(() => { load() }, [load])

  async function generateLink(musteriId: string) {
    const token = getAccessToken()
    if (!token) { router.push('/giris/mali'); return }
    setGenerating(musteriId)
    setError('')
    try {
      const res = await fetch('/api/mali/portal-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ action: 'generate', musteriId, daysValid }),
      })
      const data = await res.json()
      if (data?.success) {
        const url = data.token
          ? window.location.origin + '/portal/mali/' + data.token
          : String(data.portalUrl || '')
        setLinks((prev) => ({ ...prev, [musteriId]: url }))
        try {
          await navigator.clipboard.writeText(url)
          setCopiedId(musteriId)
          setTimeout(() => setCopiedId(null), 3000)
        } catch {
          // Clipboard is blocked on non-secure origins; the link stays visible below the card.
        }
        await load()
      } else {
        setError(data?.error || 'Link oluşturulamadı.')
      }
    } catch {
      setError('Bağlantı hatası. Link oluşturulamadı.')
    }
    setGenerating(null)
  }

  async function revokeToken(tokenId: string, musteriId: string) {
    const token = getAccessToken()
    if (!token) { router.push('/giris/mali'); return }
    setRevoking(musteriId)
    setError('')
    try {
      const res = await fetch('/api/mali/portal-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ action: 'revoke', tokenId }),
      })
      const data = await res.json()
      if (!data?.success) setError(data?.error || 'Link iptal edilemedi.')
      setLinks((prev) => {
        const next = { ...prev }
        delete next[musteriId]
        return next
      })
      await load()
    } catch {
      setError('Bağlantı hatası. Link iptal edilemedi.')
    }
    setRevoking(null)
  }

  const daysLeft = (expiresAt: unknown) => {
    if (!expiresAt) return 0
    const diff = new Date(String(expiresAt)).getTime() - Date.now()
    if (Number.isNaN(diff)) return 0
    return Math.max(0, Math.floor(diff / 86400000))
  }

  const kullanim = (t: PortalToken) => Number(t.use_count ?? t.access_count ?? 0) || 0

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', fontFamily: 'system-ui,sans-serif', overflowX: 'hidden' }}>
      <MaliNav />

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '16px 12px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          <button
            onClick={() => router.push('/mali-tools')}
            style={{ background: '#fff', border: '1px solid #E2E8F0', color: '#475569', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}
          >
            ← Araçlar
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0A1628', margin: 0, flex: 1 }}>Müşteri Portalı Yönetimi</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#64748B', fontSize: 12 }}>Link süresi:</span>
            <select
              value={daysValid}
              onChange={(e) => setDaysValid(Number(e.target.value))}
              style={{ padding: '6px 8px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13, background: '#fff', color: '#1E293B' }}
            >
              <option value={7}>7 gün</option>
              <option value={30}>30 gün</option>
              <option value={90}>90 gün</option>
              <option value={365}>1 yıl</option>
            </select>
          </div>
        </div>

        <div style={{ background: 'linear-gradient(135deg,#4C1D95,#7C3AED)', borderRadius: 12, padding: 18, marginBottom: 16, color: '#fff' }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Güvenli Müşteri Portalı</div>
          <div style={{ fontSize: 13, opacity: 0.88, lineHeight: 1.65 }}>
            Her müşteri için HMAC-SHA256 imzalı, süreli bir link oluşturun. Müşteri bu link üzerinden beyan
            takvimini görebilir. Link istediğiniz an iptal edilebilir.
          </div>
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: 10, padding: '12px 14px', marginBottom: 14, fontSize: 13, lineHeight: 1.5 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#64748B' }}>Yükleniyor...</div>
        ) : musteriler.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 12, padding: 32, textAlign: 'center', color: '#64748B', border: '1px solid #E2E8F0' }}>
            <div style={{ fontWeight: 600, color: '#1E293B', marginBottom: 6 }}>Henüz müşteri eklemediniz</div>
            <div style={{ fontSize: 13, marginBottom: 16 }}>Portal linki oluşturmak için önce bir müşteri ekleyin.</div>
            <button
              onClick={() => router.push('/dashboard/mali/musteri-ekle')}
              style={{ background: PURPLE, border: 'none', color: '#fff', padding: '10px 18px', borderRadius: 9, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
            >
              + Müşteri Ekle
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {musteriler.map((m) => {
              const id = String(m.id)
              const t = tokens[id]
              const expiry = t ? daysLeft(t.expires_at) : 0
              const link = links[id]
              return (
                <div key={id} style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#0A1628' }}>{musteriAdi(m)}</div>
                      {!!m.vergi_no && <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>VN: {String(m.vergi_no)}</div>}
                      {t ? (
                        <div style={{ fontSize: 11, color: expiry <= 3 ? RED : GREEN, marginTop: 4 }}>
                          Aktif link — {expiry} gün kaldı | {kullanim(t)} kullanım
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>Aktif link yok</div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {t && (
                        <button
                          onClick={() => revokeToken(String(t.id), id)}
                          disabled={revoking === id}
                          style={{ padding: '7px 12px', background: '#FEE2E2', color: RED, border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: revoking === id ? 'not-allowed' : 'pointer' }}
                        >
                          {revoking === id ? '...' : 'İptal'}
                        </button>
                      )}
                      <button
                        onClick={() => generateLink(id)}
                        disabled={generating === id}
                        style={{ padding: '7px 14px', background: copiedId === id ? GREEN : PURPLE, color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: generating === id ? 'not-allowed' : 'pointer' }}
                      >
                        {generating === id ? 'Oluşturuluyor...' : copiedId === id ? 'Kopyalandı!' : t ? 'Yenile & Kopyala' : 'Link Oluştur'}
                      </button>
                    </div>
                  </div>

                  {link && (
                    <div style={{ marginTop: 12, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '9px 11px' }}>
                      <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>Portal linki (müşterinize gönderin)</div>
                      <div style={{ fontSize: 12, color: '#1E293B', wordBreak: 'break-all', fontFamily: 'ui-monospace,monospace' }}>{link}</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
