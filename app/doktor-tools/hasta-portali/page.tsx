'use client'

import DoktorNav from '@/components/doktor/DoktorNav'
import HastaTypeahead from '@/components/doktor/HastaTypeahead'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import {
  toolsCard,
  toolsErrorBox,
  toolsLabel,
  toolsPrimaryBtn,
  toolsShell,
} from '@/lib/doktor/toolsUi'
import React, { useState } from 'react'

export default function HastaPortaliPage() {
  const [selectedHasta, setSelectedHasta] = useState('')
  const [loading, setLoading] = useState(false)
  const [portalUrl, setPortalUrl] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

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
      const token = await ensureDoctorAccessToken()
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
        setError(String((data as { hata?: string }).hata || 'Portal linki oluşturulamadı.'))
        return
      }
      if (!(data as { portalUrl?: string }).portalUrl) {
        setError('Portal linki alınamadı.')
        return
      }
      setPortalUrl(String((data as { portalUrl: string }).portalUrl))
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
    <div style={toolsShell}>
      <DoktorNav />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px 48px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#14B8A6', letterSpacing: 1.2, marginBottom: 8 }}>
          ARAÇLAR
        </div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>Hasta Portalı</h1>
        <p style={{ marginTop: 8, color: '#94A3B8', fontSize: 14, lineHeight: 1.5 }}>
          Seçilen hasta için güvenli, 30 gün geçerli bir portal linki oluşturun.
        </p>

        {error && <div style={toolsErrorBox}>{error}</div>}

        <div style={{ ...toolsCard, marginTop: 20 }}>
          <label style={toolsLabel} htmlFor="hasta-portali-picker">
            Hasta
          </label>
          <HastaTypeahead
            id="hasta-portali-picker"
            value={selectedHasta}
            disabled={loading}
            placeholder="Hasta adı veya soyadı yazın / seçin…"
            onLoadError={(msg) => setError(msg)}
            onChange={(id) => {
              setSelectedHasta(id)
              setError('')
              setPortalUrl('')
              setCopied(false)
            }}
          />

          <button
            type="button"
            onClick={() => void createLink()}
            disabled={loading || !selectedHasta}
            style={{ ...toolsPrimaryBtn(loading || !selectedHasta), marginTop: 16 }}
          >
            {loading ? 'Oluşturuluyor...' : 'Portal Linki Oluştur'}
          </button>
        </div>

        {portalUrl && (
          <div
            style={{
              marginTop: 16,
              padding: 16,
              borderRadius: 16,
              background: 'rgba(15,155,142,0.12)',
              border: '1px solid rgba(15,155,142,0.35)',
            }}
          >
            <div style={{ fontSize: 13, color: '#99F6E4', marginBottom: 8 }}>Portal linki hazır</div>
            <div style={{ fontSize: 12, color: '#E2E8F0', wordBreak: 'break-all', lineHeight: 1.5 }}>
              {portalUrl}
            </div>
            <button
              type="button"
              onClick={() => void copyLink()}
              style={{
                marginTop: 12,
                padding: '10px 14px',
                borderRadius: 10,
                border: 'none',
                background: '#0F9B8E',
                color: '#041016',
                fontWeight: 700,
                cursor: 'pointer',
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
