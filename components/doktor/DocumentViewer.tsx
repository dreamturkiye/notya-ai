'use client'

import React, { useEffect, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'

type Props = {
  documentId: string
  fileName: string
  fileType: string
  onClose?: () => void
}

/**
 * In-browser vault viewer: images via <img>, PDFs in a blob: iframe (tarayıcının kendi
 * görüntüleyicisi; CSP'de frame-src blob: açık), ses için <audio>.
 * Bytes are fetched through the authenticated download route (no public URLs).
 */
export default function DocumentViewer({ documentId, fileName, fileType, onClose }: Props) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let revoked: string | null = null
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const token = await getAccessTokenAsync()
        if (!token) throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yapın.')
        const res = await fetch(`/api/doktor/documents/${documentId}/download`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          const d = await res.json().catch(() => ({}))
          throw new Error(d.error || 'Dosya yüklenemedi')
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
    }

    load()
    return () => {
      cancelled = true
      if (revoked) URL.revokeObjectURL(revoked)
    }
  }, [documentId])

  const isImage = fileType.startsWith('image/')
  const isPdf = fileType === 'application/pdf'
  const isAudio = fileType.startsWith('audio/') // NOTYA-BLE-02: steteskop kaydı

  return (
    <div style={{ background: '#020812', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#E2E8F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {fileName}
        </div>
        <a
          href={objectUrl || '#'}
          download={fileName}
          style={{ ...navBtn, textDecoration: 'none' }}
          onClick={(e) => {
            if (!objectUrl) e.preventDefault()
          }}
        >
          İndir
        </a>
        {onClose && (
          <button type="button" onClick={onClose} style={navBtn}>
            Kapat
          </button>
        )}
      </div>

      <div style={{ minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0f14', padding: 12 }}>
        {loading && <span style={{ color: '#94A3B8', fontSize: 13 }}>Yükleniyor…</span>}
        {!loading && error && <span style={{ color: '#F87171', fontSize: 13 }}>{error}</span>}
        {!loading && !error && isImage && objectUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={objectUrl} alt={fileName} style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }} />
        )}
        {!loading && !error && isPdf && objectUrl && (
          <iframe
            src={objectUrl}
            title={fileName}
            style={{ width: '100%', height: '75vh', border: 'none', background: '#fff', borderRadius: 8 }}
          />
        )}
        {!loading && !error && isAudio && objectUrl && (
          <audio controls src={objectUrl} style={{ width: '100%' }} />
        )}
        {!loading && !error && !isImage && !isPdf && !isAudio && (
          <span style={{ color: '#94A3B8', fontSize: 13 }}>Bu dosya türü tarayıcıda önizlenemez. İndirin.</span>
        )}
      </div>
    </div>
  )
}

const navBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: '#E2E8F0',
  borderRadius: 999,
  padding: '6px 12px',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
}
