'use client'
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
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeTheme'

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

export default function HastaPortaliPage() {
  const [selectedHasta, setSelectedHasta] = useState('')
  const [customPin, setCustomPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [portalUrl, setPortalUrl] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<'link' | 'both' | null>(null)
  const [paylasim, setPaylasim] = useState<PortalPaylasim | null>(null)

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
    setPaylasim(null)
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
      const p = (data as { paylasim?: PortalPaylasim }).paylasim
      if (p) setPaylasim(p)
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
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px 48px' }}>
        <div style={{ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 15, color: '#6d6055', marginBottom: 4 }}>
          Araçlar
        </div>
        <h1 style={{ margin: 0, fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 32, color: '#2e251d', letterSpacing: '-0.02em' }}>Hasta Portalı</h1>
        <p style={{ marginTop: 8, color: CHROME_RENK.muted, fontSize: 14, lineHeight: 1.5 }}>
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
              setPaylasim(null)
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
              border: `1px solid ${CHROME_RENK.border}`,
              background: '#FFFFFF',
              color: CHROME_RENK.ink,
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

        {paylasim?.uyari && (
          <div
            style={{
              marginTop: 16,
              padding: 16,
              borderRadius: 16,
              background: paylasim.portalBos ? '#FBEAE3' : '#FBF3DE',
              border: `1px solid ${paylasim.portalBos ? CHROME_RENK.warn + '70' : '#E4C989'}`,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: paylasim.portalBos ? '#7A3D28' : '#7A5B1E',
                marginBottom: 6,
              }}
            >
              {paylasim.portalBos ? 'Hasta boş portal görecek' : 'Onaylanmamış notlar var'}
            </div>
            <p style={{ margin: 0, fontSize: 13, color: CHROME_RENK.ink, lineHeight: 1.5 }}>{paylasim.uyari}</p>
            <div style={{ marginTop: 10, fontSize: 12, color: CHROME_RENK.muted, lineHeight: 1.6 }}>
              Hastanın göreceği: {paylasim.onayliZiyaret} ziyaret · {paylasim.aktifIlac} aktif ilaç ·{' '}
              {paylasim.labSonuc} lab · {paylasim.goruntuleme} görüntüleme
              {paylasim.bekleyenRecete > 0 ? (
                <>
                  <br />
                  Kararınızı bekleyen: {paylasim.bekleyenRecete} reçete (hastaya görünmüyor)
                </>
              ) : null}
            </div>
          </div>
        )}

        {portalUrl && pin && (
          <div
            style={{
              marginTop: 16,
              padding: 16,
              borderRadius: 16,
              background: '#E4F3F1',
              border: `1px solid ${CHROME_RENK.pine}55`,
            }}
          >
            <div style={{ fontSize: 13, color: CHROME_RENK.pine, marginBottom: 8 }}>Portal hazır — PIN’i kaydedin</div>
            <div
              style={{
                fontFamily: CHROME_FONT.serif,
                fontSize: 28,
                fontWeight: 600,
                letterSpacing: 8,
                color: '#1F4A3D',
                fontVariantNumeric: 'tabular-nums',
                marginBottom: 12,
              }}
            >
              {pin}
            </div>
            <div style={{ fontSize: 12, color: CHROME_RENK.ink, wordBreak: 'break-all', lineHeight: 1.5 }}>
              {portalUrl}
            </div>
            <p style={{ margin: '10px 0 0', fontSize: 12, color: CHROME_RENK.muted, lineHeight: 1.45 }}>
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
                  background: CHROME_RENK.pine,
                  color: '#FAF8F4',
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
                  border: `1px solid ${CHROME_RENK.pine}`,
                  background: 'transparent',
                  color: CHROME_RENK.pine,
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
