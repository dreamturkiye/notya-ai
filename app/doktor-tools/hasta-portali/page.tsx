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
  const [customPin, setCustomPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [portalUrl, setPortalUrl] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<'link' | 'both' | null>(null)

  const createLink = async () => {
    if (!selectedHasta) {
      setError('Lütfen bir hasta seçin.')
      return
    }
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
        body: JSON.stringify({
          hastaId: selectedHasta,
          ...(trimmed ? { pin: trimmed } : {}),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(String((data as { hata?: string }).hata || 'Portal linki oluşturulamadı.'))
        return
      }
      if (!(data as { portalUrl?: string }).portalUrl || !(data as { pin?: string }).pin) {
        setError('Portal linki veya PIN alınamadı.')
        return
      }
      setPortalUrl(String((data as { portalUrl: string }).portalUrl))
      setPin(String((data as { pin: string }).pin))
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
      setCopied('link')
    } catch {
      setError('Kopyalama başarısız. Linki elle seçip kopyalayın.')
    }
  }

  const copyBoth = async () => {
    if (!portalUrl || !pin) return
    try {
      await navigator.clipboard.writeText(
        `Notya · Sağlığım\nLink: ${portalUrl}\nPIN: ${pin}\n(PIN’i başkalarıyla paylaşmayın.)`
      )
      setCopied('both')
    } catch {
      setError('Kopyalama başarısız.')
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
          30 gün geçerli Sağlığım linki + 6 haneli PIN oluşturun. PIN yalnızca bu ekranda bir kez
          gösterilir — hastaya link ile birlikte iletin.
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
              setPin('')
              setCopied(null)
            }}
          />

          <label style={{ ...toolsLabel, marginTop: 16 }} htmlFor="hasta-portali-pin">
            PIN (isteğe bağlı)
          </label>
          <input
            id="hasta-portali-pin"
            type="text"
            inputMode="numeric"
            maxLength={6}
            disabled={loading}
            placeholder="Boş bırakırsanız rastgele 6 hane üretilir"
            value={customPin}
            onChange={(e) => setCustomPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            style={{
              width: '100%',
              marginTop: 6,
              padding: '12px 14px',
              borderRadius: 10,
              border: '1px solid rgba(148,163,184,0.35)',
              background: 'rgba(15,23,42,0.45)',
              color: '#E2E8F0',
              fontSize: 15,
              letterSpacing: customPin ? 4 : 0,
              fontVariantNumeric: 'tabular-nums',
            }}
          />

          <button
            type="button"
            onClick={() => void createLink()}
            disabled={loading || !selectedHasta}
            style={{ ...toolsPrimaryBtn(loading || !selectedHasta), marginTop: 16 }}
          >
            {loading ? 'Oluşturuluyor...' : 'Portal Linki + PIN Oluştur'}
          </button>
        </div>

        {portalUrl && pin && (
          <div
            style={{
              marginTop: 16,
              padding: 16,
              borderRadius: 16,
              background: 'rgba(15,155,142,0.12)',
              border: '1px solid rgba(15,155,142,0.35)',
            }}
          >
            <div style={{ fontSize: 13, color: '#99F6E4', marginBottom: 8 }}>Portal hazır — PIN’i kaydedin</div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: 8,
                color: '#ECFDF5',
                fontVariantNumeric: 'tabular-nums',
                marginBottom: 12,
              }}
            >
              {pin}
            </div>
            <div style={{ fontSize: 12, color: '#E2E8F0', wordBreak: 'break-all', lineHeight: 1.5 }}>
              {portalUrl}
            </div>
            <p style={{ margin: '10px 0 0', fontSize: 12, color: '#94A3B8', lineHeight: 1.45 }}>
              PIN tekrar gösterilmez. Hastaya WhatsApp / yüz yüze iletin; linki PIN’siz paylaşmayın.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              <button
                type="button"
                onClick={() => void copyLink()}
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#0F9B8E',
                  color: '#041016',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {copied === 'link' ? 'Link kopyalandı' : 'Sadece linki kopyala'}
              </button>
              <button
                type="button"
                onClick={() => void copyBoth()}
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid rgba(15,155,142,0.5)',
                  background: 'transparent',
                  color: '#99F6E4',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {copied === 'both' ? 'Link + PIN kopyalandı' : 'Link + PIN kopyala'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
