'use client'

import React, { useEffect, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme'

type Props = {
  ekId: string
  fileName: string
  fileType: string
  onClose: () => void
}

/**
 * In-page viewer for message attachments: image zoom, PDF iframe, audio/video, download for others.
 */
export default function MesajEkViewer({ ekId, fileName, fileType, onClose }: Props) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    let revoked: string | null = null
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const token = await getAccessTokenAsync()
        if (!token) throw new Error('Oturum bulunamadı.')
        const res = await fetch(`/api/doktor/mesajlar/ek/${encodeURIComponent(ekId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          const d = await res.json().catch(() => ({}))
          throw new Error(d.error || 'Dosya açılamadı')
        }
        const blob = await res.blob()
        if (cancelled) return
        const url = URL.createObjectURL(blob)
        revoked = url
        setObjectUrl(url)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Görüntüleyici açılamadı')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
      if (revoked) URL.revokeObjectURL(revoked)
    }
  }, [ekId])

  const isImage = fileType.startsWith('image/')
  const isPdf = fileType === 'application/pdf'
  const isAudio = fileType.startsWith('audio/')
  const isVideo = fileType.startsWith('video/')

  return (
    <div
      role="dialog"
      aria-label={fileName}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        background: 'rgba(20, 16, 12, 0.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 'min(960px, 100%)',
          maxHeight: '92vh',
          background: '#1a1612',
          borderRadius: 16,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid rgba(255,255,255,0.12)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ flex: 1, color: '#F6F0E4', fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</div>
          {isImage ? (
            <>
              <button type="button" style={btn} onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}>−</button>
              <span style={{ color: '#cfc5b8', fontSize: 12 }}>{Math.round(zoom * 100)}%</span>
              <button type="button" style={btn} onClick={() => setZoom((z) => Math.min(4, z + 0.25))}>+</button>
            </>
          ) : null}
          {objectUrl ? (
            <a href={objectUrl} download={fileName} style={{ ...btn, textDecoration: 'none' }}>İndir</a>
          ) : null}
          <button type="button" style={btn} onClick={onClose}>Kapat</button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 12, minHeight: 240, background: '#0f0d0b' }}>
          {loading ? <p style={{ color: '#cfc5b8' }}>Yükleniyor…</p> : null}
          {error ? <p style={{ color: CHROME_RENK.warn }}>{error}</p> : null}
          {objectUrl && isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={objectUrl}
              alt={fileName}
              style={{
                display: 'block',
                margin: '0 auto',
                maxWidth: '100%',
                transform: `scale(${zoom})`,
                transformOrigin: 'top center',
                transition: 'transform 120ms ease',
              }}
            />
          ) : null}
          {objectUrl && isPdf ? (
            <iframe title={fileName} src={objectUrl} style={{ width: '100%', height: '70vh', border: 'none', background: '#fff' }} />
          ) : null}
          {objectUrl && isAudio ? <audio controls src={objectUrl} style={{ width: '100%' }} /> : null}
          {objectUrl && isVideo ? <video controls src={objectUrl} style={{ width: '100%', maxHeight: '70vh' }} /> : null}
          {objectUrl && !isImage && !isPdf && !isAudio && !isVideo ? (
            <p style={{ color: '#cfc5b8' }}>Bu dosya türü burada önizlenemiyor. İndirerek açabilirsiniz.</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

const btn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.08)',
  color: '#F6F0E4',
  border: '1px solid rgba(255,255,255,0.16)',
  borderRadius: 8,
  padding: '6px 10px',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
}
