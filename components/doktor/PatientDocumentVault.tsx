'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import DocumentViewer from '@/components/doktor/DocumentViewer'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'

type VaultDoc = {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  category: string | null
  createdAt: string
}

export default function PatientDocumentVault({ patientId }: { patientId: string }) {
  const [docs, setDocs] = useState<VaultDoc[]>([])
  const [viewer, setViewer] = useState<VaultDoc | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const token = await getAccessTokenAsync()
      if (!token) throw new Error('Oturum bulunamadı.')
      const res = await fetch(`/api/doktor/documents?patientId=${encodeURIComponent(patientId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Belgeler yüklenemedi')
      const data = await res.json()
      setDocs(
        (data.documents || []).map((d: VaultDoc & { fileName: string }) => ({
          id: d.id,
          fileName: d.fileName,
          fileType: d.fileType,
          fileSize: d.fileSize,
          category: d.category,
          createdAt: d.createdAt,
        }))
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Belgeler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div style={{ background: '#0D1C33', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#E2E8F0' }}>Belge kasası</div>
          <div style={{ fontSize: 12, color: '#8FA0B5', marginTop: 2 }}>Şifreli PDF / görüntü arşivi</div>
        </div>
        <Link
          href="/dashboard/doktor/belgeler"
          style={{ background: '#0F9B8E', border: 'none', color: 'white', borderRadius: 999, padding: '9px 18px', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}
        >
          Belge yükle ›
        </Link>
      </div>

      {loading && <div style={{ fontSize: 13, color: '#8FA0B5' }}>Yükleniyor…</div>}
      {error && <div style={{ fontSize: 13, color: '#F87171' }}>{error}</div>}
      {!loading && !error && !docs.length && (
        <div style={{ fontSize: 13, color: '#8FA0B5' }}>Bu hasta için kasa boş. Belge merkezinden yükleyin.</div>
      )}
      {!loading && !error && docs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {docs.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setViewer(d)}
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'center',
                padding: '10px 12px',
                background: viewer?.id === d.id ? 'rgba(15,155,142,0.15)' : 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                cursor: 'pointer',
                color: '#E2E8F0',
                textAlign: 'left',
              }}
            >
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{d.fileName}</span>
              <span style={{ fontSize: 11, color: '#8FA0B5' }}>{d.category || d.fileType}</span>
            </button>
          ))}
        </div>
      )}

      {viewer && (
        <div style={{ marginTop: 14 }}>
          <DocumentViewer
            documentId={viewer.id}
            fileName={viewer.fileName}
            fileType={viewer.fileType}
            onClose={() => setViewer(null)}
          />
        </div>
      )}
    </div>
  )
}
