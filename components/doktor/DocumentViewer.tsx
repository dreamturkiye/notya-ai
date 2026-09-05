'use client'

import React, { useEffect, useRef, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'

type Props = {
  documentId: string
  fileName: string
  fileType: string
  onClose?: () => void
}

/**
 * In-browser vault viewer: images via <img>, PDFs via PDF.js (CDN).
 * Bytes are fetched through the authenticated download route (no public URLs).
 */
export default function DocumentViewer({ documentId, fileName, fileType, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [pdfPage, setPdfPage] = useState(1)
  const [pdfPages, setPdfPages] = useState(0)
  const pdfDocRef = useRef<{ numPages: number; getPage: (n: number) => Promise<unknown> } | null>(null)

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

        if (fileType === 'application/pdf') {
          await renderPdf(url, 1)
        }
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
      pdfDocRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, fileType])

  async function ensurePdfJs(): Promise<{
    getDocument: (opts: { url: string }) => { promise: Promise<{ numPages: number; getPage: (n: number) => Promise<unknown> }> }
    GlobalWorkerOptions: { workerSrc: string }
  }> {
    const w = window as unknown as { pdfjsLib?: unknown }
    if (w.pdfjsLib) return w.pdfjsLib as never
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js'
      s.onload = () => resolve()
      s.onerror = () => reject(new Error('PDF.js yüklenemedi'))
      document.head.appendChild(s)
    })
    const pdfjsLib = (window as unknown as { pdfjsLib: {
      getDocument: (opts: { url: string }) => { promise: Promise<{ numPages: number; getPage: (n: number) => Promise<unknown> }> }
      GlobalWorkerOptions: { workerSrc: string }
    } }).pdfjsLib
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js'
    return pdfjsLib
  }

  async function renderPdf(url: string, pageNum: number) {
    const pdfjs = await ensurePdfJs()
    if (!pdfDocRef.current) {
      const doc = await pdfjs.getDocument({ url }).promise
      pdfDocRef.current = doc
      setPdfPages(doc.numPages)
    }
    const doc = pdfDocRef.current
    const page = (await doc.getPage(pageNum)) as {
      getViewport: (o: { scale: number }) => { width: number; height: number }
      render: (o: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }) => { promise: Promise<void> }
    }
    const viewport = page.getViewport({ scale: 1.25 })
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.height = viewport.height
    canvas.width = viewport.width
    await page.render({ canvasContext: ctx, viewport }).promise
    setPdfPage(pageNum)
  }

  const isImage = fileType.startsWith('image/')
  const isPdf = fileType === 'application/pdf'

  return (
    <div style={{ background: '#020812', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#E2E8F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {fileName}
        </div>
        {isPdf && pdfPages > 0 && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              disabled={pdfPage <= 1}
              onClick={() => objectUrl && renderPdf(objectUrl, pdfPage - 1)}
              style={navBtn}
            >
              ‹
            </button>
            <span style={{ fontSize: 12, color: '#94A3B8' }}>
              {pdfPage}/{pdfPages}
            </span>
            <button
              type="button"
              disabled={pdfPage >= pdfPages}
              onClick={() => objectUrl && renderPdf(objectUrl, pdfPage + 1)}
              style={navBtn}
            >
              ›
            </button>
          </div>
        )}
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
        {!loading && !error && isPdf && (
          <canvas ref={canvasRef} style={{ maxWidth: '100%', height: 'auto' }} />
        )}
        {!loading && !error && !isImage && !isPdf && (
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
