'use client'

export const dynamic = 'force-dynamic'

/**
 * NOTYA-PABAU-01 — /dashboard/klinik/pabau: the Pabau connection page.
 *
 * The KlinikNav has linked here since the nav shipped; the page never existed (404), and the
 * landing page's "Pabau ile çalışır" claim had no surface behind it. This is that surface:
 * the clinic pastes the API key from Pabau → Setup → Developer Hub, we validate it with a live
 * call before storing it encrypted, then show the clinic's upcoming Pabau appointments as proof
 * the pipe works. Marketplace auto-login (Pabau passes ?api_key= to the app's configuration
 * page) prefills the field — it is never auto-submitted: the clinic sees and confirms what is
 * being connected.
 */
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import KlinikNav from '@/components/klinik/KlinikNav'
import { ensureDoctorAccessToken, DOKTOR_GIRIS } from '@/lib/doktor/clientAuth'

interface Status { connected: boolean; keyHint: string | null; lastSyncedAt: string | null }
interface Randevu { id?: string; customer_name?: string; service?: string; staff_name?: string; start_date?: string; start_time?: string; appointment_status?: string }

export default function KlinikPabauPage() {
  // useSearchParams needs a Suspense boundary to prerender; `export const dynamic` does nothing
  // in a "use client" file (this exact omission failed the first Vercel build).
  return (
    <Suspense fallback={null}>
      <KlinikPabauInner />
    </Suspense>
  )
}

function KlinikPabauInner() {
  const router = useRouter()
  const search = useSearchParams()
  const [token, setToken] = useState<string | null>(null)
  const [status, setStatus] = useState<Status | null>(null)
  const [apiKey, setApiKey] = useState(search.get('api_key') || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [randevular, setRandevular] = useState<Randevu[] | null>(null)

  useEffect(() => {
    void (async () => {
      const t = await ensureDoctorAccessToken()
      if (!t) { router.push(DOKTOR_GIRIS); return }
      setToken(t)
      await refresh(t)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function refresh(t: string) {
    const r = await fetch('/api/pabau/connect-key', { headers: { Authorization: 'Bearer ' + t } })
    if (r.ok) {
      const b = await r.json()
      setStatus(b.data)
      if (b.data?.connected) void loadRandevular(t)
    }
  }

  async function loadRandevular(t: string) {
    const r = await fetch('/api/pabau/appointments', { headers: { Authorization: 'Bearer ' + t } })
    if (!r.ok) { setRandevular([]); return }
    const b = await r.json()
    const raw = b.data?.appointments ?? b.data ?? []
    setRandevular((Array.isArray(raw) ? raw : [raw]).slice(0, 8))
  }

  async function baglan() {
    if (!token || !apiKey.trim()) return
    setBusy(true); setError('')
    try {
      const r = await fetch('/api/pabau/connect-key', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      })
      const b = await r.json().catch(() => ({}))
      if (!r.ok) { setError(b.error || 'Bağlantı kurulamadı.'); return }
      setApiKey('')
      await refresh(token)
    } finally { setBusy(false) }
  }

  async function kes() {
    if (!token) return
    if (!confirm('Pabau bağlantısını kaldırmak istiyor musunuz? Kayıtlı anahtar silinir.')) return
    setBusy(true)
    try {
      await fetch('/api/pabau/connect-key', { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } })
      setRandevular(null)
      await refresh(token)
    } finally { setBusy(false) }
  }

  const card: React.CSSProperties = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24 }

  return (
    <>
      <KlinikNav />
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px 64px', fontFamily: 'system-ui, sans-serif', color: '#0F172A' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '8px 0 4px' }}>Pabau bağlantısı</h1>
        <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 24px', lineHeight: 1.6 }}>
          Kliniğiniz randevu ve hasta yönetimi için Pabau kullanıyorsa hesabınızı bağlayın: hastalarınız ve
          randevularınız Notya&apos;ya akar. Notya, Pabau&apos;nun yerine geçmez — üstüne Türkçe klinik zekâsı ekler.
        </p>

        {status === null ? (
          <div style={card}>Yükleniyor…</div>
        ) : status.connected ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                  Bağlı — anahtar {status.keyHint}
                </div>
                {status.lastSyncedAt && (
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                    Son erişim: {new Date(status.lastSyncedAt).toLocaleString('tr-TR')}
                  </div>
                )}
              </div>
              <button onClick={() => void kes()} disabled={busy} style={{ border: '1px solid #FCA5A5', color: '#B91C1C', background: '#FEF2F2', borderRadius: 8, padding: '9px 16px', fontSize: 13, cursor: 'pointer' }}>
                Bağlantıyı kaldır
              </button>
            </div>

            <div style={card}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Pabau&apos;dan gelen yaklaşan randevular</div>
              {randevular === null ? (
                <div style={{ fontSize: 13, color: '#64748B' }}>Randevular yükleniyor…</div>
              ) : randevular.length === 0 ? (
                <div style={{ fontSize: 13, color: '#64748B' }}>Yaklaşan randevu bulunamadı. Bağlantı çalışıyor; Pabau takviminizde gelecek tarihli randevu yok.</div>
              ) : (
                <div>
                  {randevular.map((r, i) => (
                    <div key={r.id || i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderTop: i === 0 ? 'none' : '1px solid #F1F5F9', fontSize: 13 }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{r.customer_name || 'Hasta'}</div>
                        <div style={{ color: '#64748B' }}>{[r.service, r.staff_name].filter(Boolean).join(' · ')}</div>
                      </div>
                      <div style={{ textAlign: 'right', color: '#334155' }}>
                        <div>{r.start_date || ''}</div>
                        <div style={{ color: '#64748B' }}>{(r.start_time || '').slice(0, 5)} {r.appointment_status ? `· ${r.appointment_status}` : ''}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={card}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Pabau API anahtarınız</div>
            <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 14px', lineHeight: 1.6 }}>
              Anahtarı Pabau&apos;da <strong>Setup → Developer Hub</strong> bölümünden oluşturun ve buraya yapıştırın.
              Kaydetmeden önce Pabau&apos;ya canlı bir çağrıyla doğrularız; anahtar şifrelenerek saklanır, ekranda yalnızca
              son 4 hanesi görünür.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Pabau API anahtarı"
                autoComplete="off"
                spellCheck={false}
                style={{ flex: '1 1 260px', border: '1px solid #CBD5E1', borderRadius: 8, padding: '11px 12px', fontSize: 14, fontFamily: 'ui-monospace, monospace' }}
              />
              <button onClick={() => void baglan()} disabled={busy || !apiKey.trim()} style={{ background: '#0E6B66', color: '#fff', border: 0, borderRadius: 8, padding: '11px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: busy || !apiKey.trim() ? 0.6 : 1 }}>
                {busy ? 'Doğrulanıyor…' : 'Bağlan'}
              </button>
            </div>
            {error && <div style={{ marginTop: 12, fontSize: 13, color: '#B91C1C', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 12px', lineHeight: 1.5 }}>{error}</div>}
          </div>
        )}

        <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 24, lineHeight: 1.6 }}>
          Pabau, sahibinin ticari markasıdır. Notya bağımsız bir üründür; entegrasyon resmî bir ortaklık anlamına gelmez.
        </p>
      </div>
    </>
  )
}
