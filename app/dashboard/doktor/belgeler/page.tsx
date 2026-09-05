'use client'

export const dynamic = 'force-dynamic'

/**
 * Medical document vault UI (beta): multipart upload into encrypted DB blobs,
 * list by patient, in-browser viewer (PDF.js / image).
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import DoktorNav from '@/components/doktor/DoktorNav'
import DocumentViewer from '@/components/doktor/DocumentViewer'
import {
  getAccessTokenAsync,
  normalizeHastalar,
  toolsShell,
  toolsCard,
  toolsInput,
  toolsLabel,
  toolsPrimaryBtn,
  toolsErrorBox,
  type HastaOption,
} from '@/lib/doktor/toolsUi'
import { VAULT_MAX_BYTES } from '@/lib/vault/types'

const BELGE_TURLERI = [
  'Lab Sonucu',
  'Görüntüleme Raporu',
  'EKG',
  'X-Ray',
  'Epikriz',
  'Reçete',
  'Sevk',
  'Diğer',
]

type VaultDoc = {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  category: string | null
  notes: string | null
  createdAt: string
}

export default function BelgelerPage() {
  const [file, setFile] = useState<File | null>(null)
  const [hastaId, setHastaId] = useState('')
  const [hastaAra, setHastaAra] = useState('')
  const [listeAcik, setListeAcik] = useState(false)
  const [belgeType, setBelgeType] = useState(BELGE_TURLERI[0])
  const [notes, setNotes] = useState('')
  const [hastalar, setHastalar] = useState<HastaOption[]>([])
  const [docs, setDocs] = useState<VaultDoc[]>([])
  const [viewer, setViewer] = useState<VaultDoc | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const kutuRef = useRef<HTMLDivElement>(null)

  const loadDocs = useCallback(async (patientId: string) => {
    if (!patientId) {
      setDocs([])
      return
    }
    const token = await getAccessTokenAsync()
    if (!token) return
    const res = await fetch(`/api/doktor/documents?patientId=${encodeURIComponent(patientId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return
    const data = await res.json()
    setDocs(
      (data.documents || []).map((d: {
        id: string
        fileName: string
        fileType: string
        fileSize: number
        category: string | null
        notes: string | null
        createdAt: string
      }) => ({
        id: d.id,
        fileName: d.fileName,
        fileType: d.fileType,
        fileSize: d.fileSize,
        category: d.category,
        notes: d.notes,
        createdAt: d.createdAt,
      }))
    )
  }, [])

  useEffect(() => {
    let cancelled = false
    const loadHastalar = async () => {
      try {
        const token = await getAccessTokenAsync()
        if (!token) {
          if (!cancelled) setError('Oturum bulunamadı. Lütfen tekrar giriş yapın.')
          return
        }
        const res = await fetch('/api/doktor/hastalar', { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) {
          if (!cancelled) setError('Hasta listesi alınamadı.')
          return
        }
        const data = await res.json()
        if (!cancelled) setHastalar(normalizeHastalar(data))
      } catch {
        if (!cancelled) setError('Hasta listesi alınamadı. Bağlantınızı kontrol edin.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadHastalar()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (hastaId) loadDocs(hastaId)
    else setDocs([])
  }, [hastaId, loadDocs])

  useEffect(() => {
    const kapat = (e: MouseEvent) => {
      if (kutuRef.current && !kutuRef.current.contains(e.target as Node)) setListeAcik(false)
    }
    document.addEventListener('mousedown', kapat)
    return () => document.removeEventListener('mousedown', kapat)
  }, [])

  const secili = hastalar.find((h) => h.id === hastaId) || null
  const aramaMetni = hastaAra.trim().toLocaleLowerCase('tr')
  const suzulen = aramaMetni
    ? hastalar.filter((h) => h.label.toLocaleLowerCase('tr').includes(aramaMetni))
    : hastalar

  const hastaSec = (h: HastaOption) => {
    setHastaId(h.id)
    setHastaAra(h.label)
    setListeAcik(false)
    setViewer(null)
  }

  const dosyaSecildi = (f: File | null) => {
    setError('')
    if (f && f.size > VAULT_MAX_BYTES) {
      setError('Dosya 4 MB sınırını aşıyor. Lütfen daha küçük bir PDF/JPG seçin.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    setFile(f)
  }

  const dosyayiKaldir = () => {
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleUpload = async () => {
    setError('')
    setInfo('')
    if (!hastaId) {
      setError('Lütfen bir hasta seçin.')
      return
    }
    if (!file) {
      setError('Lütfen yüklenecek bir dosya seçin.')
      return
    }

    setUploading(true)
    try {
      const token = await getAccessTokenAsync()
      if (!token) throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yapın.')
      const form = new FormData()
      form.append('file', file)
      form.append('patientId', hastaId)
      form.append('category', belgeType)
      if (notes.trim()) form.append('notes', notes.trim())

      const res = await fetch('/api/doktor/documents', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.error || 'Belge yüklenemedi. Lütfen tekrar deneyin.')
      setInfo(`"${file.name}" kasaya eklendi${secili ? ` · ${secili.label}` : ''}.`)
      dosyayiKaldir()
      setNotes('')
      await loadDocs(hastaId)
      if (d.document) {
        setViewer({
          id: d.document.id,
          fileName: d.document.fileName,
          fileType: d.document.fileType,
          fileSize: d.document.fileSize,
          category: d.document.category,
          notes: d.document.notes,
          createdAt: d.document.createdAt,
        })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Belge yüklenemedi.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={toolsShell}>
      <DoktorNav />
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '24px 16px 56px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Belge Kasası</h1>
        <p style={{ color: '#94A3B8', fontSize: 14, margin: '6px 0 20px' }}>
          PDF, JPEG, PNG — hastaya bağlı, şifreli saklama (beta)
        </p>

        <div style={toolsCard}>
          <div style={{ marginBottom: 16, position: 'relative' }} ref={kutuRef}>
            <label style={toolsLabel} htmlFor="belge-hasta">
              Hasta
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="belge-hasta"
                value={hastaAra}
                disabled={loading}
                placeholder={loading ? 'Yükleniyor…' : 'Hasta adını yazın ya da listeden seçin'}
                onChange={(e) => {
                  setHastaAra(e.target.value)
                  setListeAcik(true)
                  if (hastaId && e.target.value !== (secili?.label || '')) setHastaId('')
                }}
                onFocus={() => setListeAcik(true)}
                autoComplete="off"
                style={{ ...toolsInput, width: '100%', boxSizing: 'border-box', paddingRight: 34 }}
              />
              {(hastaAra || hastaId) && (
                <button
                  type="button"
                  aria-label="Seçimi temizle"
                  onClick={() => {
                    setHastaId('')
                    setHastaAra('')
                    setListeAcik(false)
                    setViewer(null)
                  }}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    fontSize: 15,
                    cursor: 'pointer',
                    padding: 4,
                  }}
                >
                  ✕
                </button>
              )}
            </div>
            {listeAcik && !loading && (
              <div
                style={{
                  position: 'absolute',
                  zIndex: 30,
                  left: 0,
                  right: 0,
                  marginTop: 4,
                  background: '#0D1C33',
                  border: '1px solid rgba(255,255,255,0.14)',
                  borderRadius: 12,
                  maxHeight: 240,
                  overflowY: 'auto',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.45)',
                }}
              >
                {suzulen.length === 0 && (
                  <div style={{ padding: '11px 14px', fontSize: 13, color: '#94A3B8' }}>Eşleşen hasta yok</div>
                )}
                {suzulen.map((h) => (
                  <div
                    key={h.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => hastaSec(h)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') hastaSec(h)
                    }}
                    style={{
                      padding: '10px 14px',
                      fontSize: 13.5,
                      color: h.id === hastaId ? '#2DD4BF' : '#E2E8F0',
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    {h.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={toolsLabel} htmlFor="belge-turu">
              Belge Türü
            </label>
            <select id="belge-turu" value={belgeType} onChange={(e) => setBelgeType(e.target.value)} style={toolsInput}>
              {BELGE_TURLERI.map((t) => (
                <option key={t} value={t} style={{ background: '#0A1628', color: '#fff' }}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={toolsLabel} htmlFor="belge-not">
              Not (isteğe bağlı)
            </label>
            <input
              id="belge-not"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Örn. 12 derivasyon istirahat EKG"
              style={{ ...toolsInput, width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={toolsLabel} htmlFor="belge-dosya">
              Dosya
            </label>
            <input
              id="belge-dosya"
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
              onChange={(e) => dosyaSecildi(e.target.files?.[0] || null)}
              style={{ display: 'none' }}
            />
            {!file ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  ...toolsInput,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  fontSize: 13,
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    color: '#F8FAFC',
                    fontWeight: 600,
                  }}
                >
                  Dosya Seç
                </span>
                <span style={{ color: '#94A3B8' }}>PDF, JPG, PNG, WebP (≤4 MB)</span>
              </button>
            ) : (
              <div
                style={{
                  ...toolsInput,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#E2E8F0', fontSize: 13 }}>
                  {file.name} <span style={{ color: '#64748B' }}>({Math.max(1, Math.round(file.size / 1024))} KB)</span>
                </span>
                <button
                  type="button"
                  aria-label="Dosyayı kaldır"
                  onClick={dosyayiKaldir}
                  style={{
                    flexShrink: 0,
                    background: 'rgba(239,68,68,0.15)',
                    border: '1px solid rgba(239,68,68,0.4)',
                    color: '#FCA5A5',
                    borderRadius: 8,
                    padding: '5px 10px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ✕ Kaldır
                </button>
              </div>
            )}
          </div>

          <button onClick={handleUpload} disabled={uploading || !hastaId || !file} style={toolsPrimaryBtn(uploading || !hastaId || !file)}>
            {uploading ? 'Kasaya yükleniyor…' : 'Kasaya yükle'}
          </button>

          {error && <div style={toolsErrorBox}>{error}</div>}
          {info && !error && (
            <div
              style={{
                marginTop: 12,
                padding: '12px 14px',
                borderRadius: 12,
                background: 'rgba(15,155,142,0.14)',
                border: '1px solid rgba(94,234,212,0.32)',
                color: '#99F6E4',
                fontSize: 13,
                lineHeight: 1.45,
              }}
            >
              {info}
            </div>
          )}
        </div>

        {hastaId && (
          <div style={{ ...toolsCard, marginTop: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#E2E8F0', marginBottom: 12 }}>
              Kasa ({docs.length})
            </div>
            {!docs.length ? (
              <div style={{ fontSize: 13, color: '#94A3B8' }}>Bu hasta için henüz belge yok.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {docs.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setViewer(d)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 12px',
                      background: viewer?.id === d.id ? 'rgba(45,212,191,0.1)' : 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 12,
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: '#E2E8F0',
                    }}
                  >
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.fileName}
                    </span>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>{d.category || d.fileType}</span>
                    <span style={{ fontSize: 11, color: '#64748B' }}>{Math.max(1, Math.round(d.fileSize / 1024))} KB</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {viewer && (
          <div style={{ marginTop: 16 }}>
            <DocumentViewer
              documentId={viewer.id}
              fileName={viewer.fileName}
              fileType={viewer.fileType}
              onClose={() => setViewer(null)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
