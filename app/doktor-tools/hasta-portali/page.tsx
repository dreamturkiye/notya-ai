'use client'

import DoktorNav from '@/components/doktor/DoktorNav'
import React, { useEffect, useState } from 'react'
import { getDoctorAccessToken } from '@/lib/doktor/clientAuth';

interface Hasta {
  id: string
  label: string
}

function normalizeHastalar(payload: unknown): Hasta[] {
  const raw = Array.isArray(payload)
    ? payload
    : (payload && typeof payload === 'object' && Array.isArray((payload as { patients?: unknown }).patients)
        ? (payload as { patients: unknown[] }).patients
        : [])

  return raw.map((item, idx) => {
    const p = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
    const id = String(p.id || idx)
    const masked = String(p.masked_name || '')
    const ad = String(p.ad || p.first_name || (masked ? masked.split(' ')[0] : '') || 'Hasta')
    const soyad = String(p.soyad || p.last_name || (masked.includes(' ') ? masked.split(' ').slice(1).join(' ') : '') || '')
    const label = masked || `${ad} ${soyad}`.trim() || `Hasta ${idx + 1}`
    return { id, label }
  })
}

function getAccessToken(): string {
  return getDoctorAccessToken() // NOTYA-AUTH-01: one session reader
}

export default function HastaPortaliPage() {
  const [hastalar, setHastalar] = useState<Hasta[]>([])
  const [selectedHasta, setSelectedHasta] = useState('')
  const [loading, setLoading] = useState(false)
  const [portalUrl, setPortalUrl] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const load = async () => {
      const token = getAccessToken()
      if (!token) return
      try {
        const res = await fetch('/api/doktor/hastalar', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const data = await res.json()
        setHastalar(normalizeHastalar(data))
      } catch {
        setError('Hasta listesi alınamadı.')
      }
    }
    void load()
  }, [])

  const createLink = async () => {
    if (!selectedHasta) {
      setError('Lütfen bir hasta seçin.')
      return
    }
    setLoading(true)
    setError('')
    setPortalUrl('')
    setCopied(false)
    try {
      const token = getAccessToken()
      if (!token) {
        setError('Oturum bulunamadı. Lütfen tekrar giriş yapın.')
        return
      }
      const res = await fetch('/api/doktor/araclar/hasta-portali', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hastaId: selectedHasta }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(String(data?.hata || 'Portal linki oluşturulamadı.'))
        return
      }
      if (!data?.portalUrl) {
        setError('Portal linki alınamadı.')
        return
      }
      setPortalUrl(String(data.portalUrl))
    } catch {
      setError('Bağlantı hatası. Tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  const copyLink = async () => {
    if (!portalUrl) return
    try {
      await navigator.clipboard.writeText(portalUrl)
      setCopied(true)
    } catch {
      setError('Kopyalama başarısız. Linki elle seçip kopyalayın.')
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#060C18', color: '#F8FAFC', fontFamily: 'system-ui, sans-serif' }}>
      <DoktorNav />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px 48px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#14B8A6', letterSpacing: 1.2, marginBottom: 8 }}>ARAÇLAR</div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>Hasta Portalı</h1>
        <p style={{ marginTop: 8, color: '#94A3B8', fontSize: 14, lineHeight: 1.5 }}>
          Seçilen hasta için güvenli, 30 gün geçerli bir portal linki oluşturun.
        </p>

        {error && (
          <div style={{
            marginTop: 16, padding: '12px 14px', borderRadius: 12,
            background: '#7F1D1D', border: '1px solid #FCA5A5', color: '#FEE2E2', fontSize: 13,
          }}>
            {error}
          </div>
        )}

        <div style={{
          marginTop: 20, padding: 18, borderRadius: 16,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <label style={{ display: 'block', fontSize: 13, color: '#CBD5E1', marginBottom: 8 }}>Hasta</label>
          <select
            value={selectedHasta}
            onChange={(e) => setSelectedHasta(e.target.value)}
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.14)',
              background: '#0A1628', color: '#fff', fontSize: 14,
            }}
          >
            <option value="">Hasta seçin</option>
            {hastalar.map((h) => (
              <option key={h.id} value={h.id}>{h.label}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => void createLink()}
            disabled={loading}
            style={{
              marginTop: 16, width: '100%', padding: '13px 16px', borderRadius: 12, border: 'none',
              background: loading ? '#334155' : '#0F9B8E', color: '#041016', fontWeight: 700, fontSize: 14,
              cursor: loading ? 'wait' : 'pointer',
            }}
          >
            {loading ? 'Oluşturuluyor...' : 'Portal Linki Oluştur'}
          </button>
        </div>

        {portalUrl && (
          <div style={{
            marginTop: 16, padding: 16, borderRadius: 16,
            background: 'rgba(15,155,142,0.12)', border: '1px solid rgba(15,155,142,0.35)',
          }}>
            <div style={{ fontSize: 13, color: '#99F6E4', marginBottom: 8 }}>Portal linki hazır</div>
            <div style={{ fontSize: 12, color: '#E2E8F0', wordBreak: 'break-all', lineHeight: 1.5 }}>{portalUrl}</div>
            <button
              type="button"
              onClick={() => void copyLink()}
              style={{
                marginTop: 12, padding: '10px 14px', borderRadius: 10, border: 'none',
                background: '#0F9B8E', color: '#041016', fontWeight: 700, cursor: 'pointer',
              }}
            >
              {copied ? 'Kopyalandı' : 'Linki Kopyala'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
