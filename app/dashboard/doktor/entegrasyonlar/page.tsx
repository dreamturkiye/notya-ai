'use client'

import React, { useCallback, useEffect, useState } from 'react'
import DoktorNav from '@/components/doktor/DoktorNav'
import { getDoctorAccessToken } from '@/lib/doktor/clientAuth'

type Provider = 'medula' | 'nvi_kps'

type IntegrationStatus = {
  provider: Provider
  connected: boolean
  meta: Record<string, unknown>
  lastVerified: string | null
  lastError: string | null
}

const TEAL = '#14B8A6'
const AMBER = '#F59E0B'
const GREEN = '#10B981'
const BG = '#060C18'
const CARD = 'rgba(255,255,255,0.04)'
const BORDER = 'rgba(255,255,255,0.1)'

const LABELS: Record<Provider, { title: string; subtitle: string }> = {
  medula: {
    title: 'SGK Medula',
    subtitle: 'E-reçete ve provizyon için hekim TC + kurumsal şifre',
  },
  nvi_kps: {
    title: 'NVI / KPS',
    subtitle: 'TC ile ad soyad / doğum / cinsiyet için NVI hesabı',
  },
}

export default function EntegrasyonlarPage() {
  const [items, setItems] = useState<IntegrationStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState<Provider | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)

  const [medulaForm, setMedulaForm] = useState({
    hekimTc: '',
    sifre: '',
    tesisKodu: '',
    sicilNo: '',
  })
  const [nviForm, setNviForm] = useState({ username: '', password: '' })

  const load = useCallback(async () => {
    const token = getDoctorAccessToken()
    if (!token) {
      window.location.href = '/giris/doktor'
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/doktor/integrations', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(String((data as { error?: string }).error || 'Yüklenemedi'))
        return
      }
      setItems((data as { integrations?: IntegrationStatus[] }).integrations || [])
      setError('')
    } catch {
      setError('Bağlantı hatası')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const statusOf = (p: Provider) => items.find((i) => i.provider === p)

  const openSheet = (p: Provider) => {
    setError('')
    setShowPw(false)
    setActive(p)
    if (p === 'medula') {
      setMedulaForm({ hekimTc: '', sifre: '', tesisKodu: '', sicilNo: '' })
    } else {
      setNviForm({ username: '', password: '' })
    }
  }

  const save = async () => {
    if (!active) return
    const token = getDoctorAccessToken()
    if (!token) return
    setSaving(true)
    setError('')
    try {
      const body =
        active === 'medula'
          ? {
              hekimTc: medulaForm.hekimTc,
              sifre: medulaForm.sifre,
              tesisKodu: medulaForm.tesisKodu || undefined,
              sicilNo: medulaForm.sicilNo || undefined,
            }
          : { username: nviForm.username, password: nviForm.password }

      const res = await fetch(`/api/doktor/integrations/${active}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(String((data as { error?: string }).error || 'Kaydedilemedi'))
        return
      }
      setActive(null)
      await load()
    } catch {
      setError('Kaydetme başarısız')
    } finally {
      setSaving(false)
    }
  }

  const disconnect = async (p: Provider) => {
    const token = getDoctorAccessToken()
    if (!token) return
    setSaving(true)
    try {
      await fetch(`/api/doktor/integrations/${p}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setActive(null)
      await load()
    } finally {
      setSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: '#0F172A',
    border: `1px solid ${BORDER}`,
    borderRadius: 10,
    padding: '12px 14px',
    color: '#fff',
    fontSize: 15,
    boxSizing: 'border-box',
  }

  return (
    <div style={{ backgroundColor: BG, minHeight: '100vh', color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <DoktorNav />
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 20px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 650, margin: '0 0 8px' }}>Entegrasyonlar</h1>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, margin: '0 0 28px', lineHeight: 1.5 }}>
          Şifreniz şifreli saklanır; sorgular sizin yetkinizle yapılır.
        </p>

        {loading ? (
          <div style={{ color: 'rgba(255,255,255,0.5)' }}>Yükleniyor…</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(['medula', 'nvi_kps'] as Provider[]).map((p) => {
              const st = statusOf(p)
              const connected = Boolean(st?.connected)
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => openSheet(p)}
                  style={{
                    textAlign: 'left',
                    background: CARD,
                    border: `1px solid ${BORDER}`,
                    borderRadius: 16,
                    padding: '18px 20px',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 600 }}>{LABELS[p].title}</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>
                        {LABELS[p].subtitle}
                      </div>
                      {connected && st?.meta?.hekimTcMasked ? (
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
                          TC: {String(st.meta.hekimTcMasked)}
                        </div>
                      ) : null}
                      {connected && st?.meta?.usernameMasked ? (
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
                          Kullanıcı: {String(st.meta.usernameMasked)}
                        </div>
                      ) : null}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: connected ? GREEN : AMBER,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {connected ? 'Bağlı' : 'Bağlı değil'}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {error && !active ? (
          <div style={{ marginTop: 16, color: '#FBBF24', fontSize: 14 }}>{error}</div>
        ) : null}
      </div>

      {active && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
          onClick={() => setActive(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 520,
              background: '#0B1220',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              border: `1px solid ${BORDER}`,
              padding: '24px 20px calc(24px + env(safe-area-inset-bottom))',
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 650, marginBottom: 6 }}>{LABELS[active].title}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 20, lineHeight: 1.45 }}>
              Şifreniz şifreli saklanır; sorgular sizin yetkinizle yapılır. Kaydettikten sonra şifre tarayıcıya geri dönmez.
            </div>

            {active === 'medula' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Hekim TC</label>
                  <input
                    value={medulaForm.hekimTc}
                    maxLength={11}
                    onChange={(e) =>
                      setMedulaForm((f) => ({ ...f, hekimTc: e.target.value.replace(/\D/g, '') }))
                    }
                    style={inputStyle}
                    placeholder="11 hane"
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Kurumsal şifre</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={medulaForm.sifre}
                      onChange={(e) => setMedulaForm((f) => ({ ...f, sifre: e.target.value }))}
                      style={{ ...inputStyle, paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      style={{
                        position: 'absolute',
                        right: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94A3B8',
                        cursor: 'pointer',
                      }}
                    >
                      {showPw ? 'Gizle' : 'Göster'}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Tesis kodu (opsiyonel)</label>
                  <input
                    value={medulaForm.tesisKodu}
                    onChange={(e) => setMedulaForm((f) => ({ ...f, tesisKodu: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Sicil no (opsiyonel)</label>
                  <input
                    value={medulaForm.sicilNo}
                    onChange={(e) => setMedulaForm((f) => ({ ...f, sicilNo: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Kullanıcı adı</label>
                  <input
                    value={nviForm.username}
                    onChange={(e) => setNviForm((f) => ({ ...f, username: e.target.value }))}
                    style={inputStyle}
                    autoComplete="username"
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Şifre</label>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={nviForm.password}
                    onChange={(e) => setNviForm((f) => ({ ...f, password: e.target.value }))}
                    style={inputStyle}
                    autoComplete="current-password"
                  />
                </div>
              </div>
            )}

            {error ? <div style={{ color: '#F87171', fontSize: 13, marginTop: 12 }}>{error}</div> : null}

            <button
              type="button"
              disabled={saving}
              onClick={() => void save()}
              style={{
                width: '100%',
                marginTop: 20,
                height: 48,
                border: 'none',
                borderRadius: 12,
                background: TEAL,
                color: '#041016',
                fontWeight: 650,
                fontSize: 16,
                cursor: saving ? 'wait' : 'pointer',
              }}
            >
              {saving ? 'Kaydediliyor…' : 'Kaydet'}
            </button>

            {statusOf(active)?.connected ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => void disconnect(active)}
                style={{
                  width: '100%',
                  marginTop: 10,
                  height: 44,
                  borderRadius: 12,
                  border: `1px solid ${BORDER}`,
                  background: 'transparent',
                  color: '#F87171',
                  fontSize: 15,
                  cursor: 'pointer',
                }}
              >
                Bağlantıyı Kes
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => setActive(null)}
              style={{
                width: '100%',
                marginTop: 8,
                height: 40,
                border: 'none',
                background: 'transparent',
                color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
              }}
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
