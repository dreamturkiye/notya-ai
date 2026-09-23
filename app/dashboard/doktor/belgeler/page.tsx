'use client'

export const dynamic = 'force-dynamic'

/**
 * Medical document vault UI (beta): multipart upload into encrypted DB blobs,
 * list by patient, in-browser viewer (PDF.js / image).
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import DocumentViewer from '@/components/doktor/DocumentViewer'
import { trIcerir } from '@/lib/utils/turkceArama'
import { CHROME_FONT } from '@/lib/doktor/chromeTheme'
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
import { belgeDegerlendirmeCtalari, belgeKategoriEtiket } from '@/lib/doktor/belgeTur'
import { belgeTurleriIcinBrans, ORTAK_BELGE_TURLERI } from '@/lib/doktor/belgeTurleri'
import GeriLink from '@/components/navigasyon/GeriLink'
import { DOKTOR_ANA, hastaBelgelerHref } from '@/lib/doktor/geriNavigasyon'
import KasaKonsultasyonBaglantisi, { BOS_KONSULTASYON_SECIMI, konsultasyonaBagla, type KasaKonsultasyonSecimi } from '@/components/doktor/KasaKonsultasyonBaglantisi'

type VaultDoc = {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  category: string | null
  notes: string | null
  createdAt: string
  visitId: string | null
}

type SeansSecim = { id: string; etiket: string }

export default function BelgelerPage() {
  const [file, setFile] = useState<File | null>(null)
  const [hastaId, setHastaId] = useState('')
  const [seanslar, setSeanslar] = useState<SeansSecim[]>([])
  const [visitId, setVisitId] = useState('')
  const [hastaAra, setHastaAra] = useState('')
  const [listeAcik, setListeAcik] = useState(false)
  const [belgeTurleri, setBelgeTurleri] = useState<string[]>([...ORTAK_BELGE_TURLERI])
  const [belgeType, setBelgeType] = useState<string>(ORTAK_BELGE_TURLERI[0])
  const [notes, setNotes] = useState('')
  const [kons, setKons] = useState<KasaKonsultasyonSecimi>(BOS_KONSULTASYON_SECIMI)
  const [hastalar, setHastalar] = useState<HastaOption[]>([])
  const [docs, setDocs] = useState<VaultDoc[]>([])
  const [viewer, setViewer] = useState<VaultDoc | null>(null)
  const [silinen, setSilinen] = useState<string | null>(null)
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
        (data.documents || []).map((d: VaultDoc) => ({
          id: d.id,
          fileName: d.fileName,
          fileType: d.fileType,
          fileSize: d.fileSize,
          category: d.category,
          notes: d.notes,
          createdAt: d.createdAt,
          visitId: d.visitId || null,
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
        const [res, meRes] = await Promise.all([
          fetch('/api/doktor/hastalar', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/users/me', { headers: { Authorization: `Bearer ${token}` } }),
        ])
        if (!res.ok) {
          if (!cancelled) setError('Hasta listesi alınamadı.')
          return
        }
        const data = await res.json()
        if (!cancelled) setHastalar(normalizeHastalar(data))
        if (meRes.ok) {
          const me = await meRes.json()
          const turler = belgeTurleriIcinBrans(me?.data?.specialty)
          if (!cancelled) {
            setBelgeTurleri(turler)
            setBelgeType((onceki) => (turler.includes(onceki) ? onceki : turler[0]))
          }
        }
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
    if (!hastaId) { setSeanslar([]); setVisitId(''); return }
    let iptal = false
    ;(async () => {
      const token = await getAccessTokenAsync()
      if (!token) return
      const r = await fetch(`/api/doktor/hastalar/${encodeURIComponent(hastaId)}/sessions`, { headers: { Authorization: `Bearer ${token}` } })
      if (!r.ok) return
      const j = await r.json()
      const liste: SeansSecim[] = (j.sessions || []).map((s: { id: string; created_at?: string; notes?: { basvuru_yakinmasi?: string | null }[] }) => {
        const tarih = s.created_at ? new Date(s.created_at).toLocaleDateString('tr-TR') : ''
        const yakinma = s.notes?.[0]?.basvuru_yakinmasi || ''
        return { id: s.id, etiket: [tarih, yakinma].filter(Boolean).join(' · ') || 'Muayene' }
      })
      if (!iptal) setSeanslar(liste)
    })()
    return () => { iptal = true }
  }, [hastaId])

  // Prefill from Belge kasası “Belge yükle ›” deep-link (?hastaId=)
  useEffect(() => {
    if (hastaId || !hastalar.length) return
    try {
      const q = new URLSearchParams(window.location.search).get('hastaId')
      if (!q) return
      const h = hastalar.find((x) => x.id === q)
      if (h) {
        setHastaId(h.id)
        setHastaAra(h.label)
      }
    } catch { /* ignore */ }
  }, [hastalar, hastaId])

  useEffect(() => {
    const kapat = (e: MouseEvent) => {
      if (kutuRef.current && !kutuRef.current.contains(e.target as Node)) setListeAcik(false)
    }
    document.addEventListener('mousedown', kapat)
    return () => document.removeEventListener('mousedown', kapat)
  }, [])

  const secili = hastalar.find((h) => h.id === hastaId) || null
  // NOTYA-ARAMA-TR-01: ortak Türkçe katlama (I/ı/İ/i tek kovada) — bkz. lib/utils/turkceArama.ts
  const aramaMetni = hastaAra.trim()
  const suzulen = aramaMetni ? hastalar.filter((h) => trIcerir(h.label, aramaMetni)) : hastalar

  const hastaSec = (h: HastaOption) => {
    setHastaId(h.id)
    setHastaAra(h.label)
    setListeAcik(false)
    setViewer(null)
    setKons(BOS_KONSULTASYON_SECIMI)
    setVisitId('')
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

  const belgeSil = async (d: VaultDoc) => {
    if (!window.confirm(`“${d.fileName}” belgesini kasadan silmek istediğinize emin misiniz?`)) return
    setSilinen(d.id)
    setError('')
    try {
      const token = await getAccessTokenAsync()
      if (!token) throw new Error('Oturum bulunamadı.')
      const res = await fetch(`/api/doktor/documents/${d.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Belge silinemedi')
      }
      setDocs((prev) => prev.filter((x) => x.id !== d.id))
      if (viewer?.id === d.id) setViewer(null)
      setInfo(`“${d.fileName}” silindi.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Belge silinemedi')
    } finally {
      setSilinen(null)
    }
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
      if (visitId) form.append('visitId', visitId)
      if (notes.trim()) form.append('notes', notes.trim())

      const res = await fetch('/api/doktor/documents', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.error || 'Belge yüklenemedi. Lütfen tekrar deneyin.')
      // KONSULTASYON-01: isteğe bağlı — yüklenen raporu seçili konsültasyona bağla (KANIT).
      const bag = kons.acik && kons.id && d.document?.id ? await konsultasyonaBagla(kons, d.document.id) : null
      if (bag?.hata) setError(`Belge kasaya eklendi ama konsültasyona bağlanamadı: ${bag.hata}`)
      setInfo(`"${file.name}" kasaya eklendi${secili ? ` · ${secili.label}` : ''}${bag && !bag.hata ? (bag.yanitlandi ? ' · konsültasyon yanıtlandı' : ' · konsültasyona bağlandı — yanıt özetinizi hasta dosyasından yazın') : ''}.`)
      if (bag && !bag.hata) setKons(BOS_KONSULTASYON_SECIMI)
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
          visitId: d.document.visitId || visitId || null,
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
      <div style={{ maxWidth: 880 }}>
        <GeriLink
          href={hastaId ? hastaBelgelerHref(hastaId) : DOKTOR_ANA}
          style={{ display: 'inline-block', marginBottom: 10 }}
        >
          {hastaId ? '← Hasta Belgeler' : '← Doktor'}
        </GeriLink>
        <h1 style={{ fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 30, margin: 0, color: '#2e251d', letterSpacing: '-0.02em' }}>Belge Kasası</h1>
        <p style={{ color: '#8b7d70', fontSize: 14, margin: '6px 0 20px' }}>
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
                    color: '#8b7d70',
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
                  background: '#FFFFFF',
                  border: '1px solid rgba(58,44,34,0.14)',
                  borderRadius: 12,
                  maxHeight: 240,
                  overflowY: 'auto',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
                }}
              >
                {suzulen.length === 0 && (
                  <div style={{ padding: '11px 14px', fontSize: 13, color: '#8b7d70' }}>Eşleşen hasta yok</div>
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
                      color: h.id === hastaId ? '#2f4334' : '#3b2e24',
                      cursor: 'pointer',
                      borderBottom: '1px solid #FFFFFF',
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
              {belgeTurleri.map((t) => (
                <option key={t} value={t} style={{ background: '#FFFFFF', color: '#3b2e24' }}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={toolsLabel} htmlFor="belge-muayene">
              Muayene (görüntü / ses bu vizite bağlanır)
            </label>
            <select id="belge-muayene" value={visitId} onChange={(e) => setVisitId(e.target.value)} disabled={!hastaId} style={toolsInput}>
              <option value="" style={{ background: '#FFFFFF', color: '#3b2e24' }}>Hasta dosyası — muayene dışı</option>
              {seanslar.map((s) => (
                <option key={s.id} value={s.id} style={{ background: '#FFFFFF', color: '#3b2e24' }}>{s.etiket}</option>
              ))}
            </select>
          </div>

          <KasaKonsultasyonBaglantisi hastaId={hastaId} secim={kons} setSecim={(k) => { setKons(k); if (k.acik && !kons.acik) setBelgeType('Konsültasyon raporu') }} />

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
              accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,.mp3,.m4a,.wav,application/pdf,image/*,audio/*"
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
                    background: 'rgba(58,44,34,0.1)',
                    border: '1px solid rgba(58,44,34,0.18)',
                    color: '#3b2e24',
                    fontWeight: 600,
                  }}
                >
                  Dosya Seç
                </span>
                <span style={{ color: '#8b7d70' }}>PDF, görüntü, ses (≤4 MB)</span>
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
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#3b2e24', fontSize: 13 }}>
                  {file.name} <span style={{ color: '#8b7d70' }}>({Math.max(1, Math.round(file.size / 1024))} KB)</span>
                </span>
                <button
                  type="button"
                  aria-label="Dosyayı kaldır"
                  onClick={dosyayiKaldir}
                  style={{
                    flexShrink: 0,
                    background: '#FBEAE3',
                    border: '1px solid rgba(164,91,62,0.4)',
                    color: '#7A3D28',
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
                background: '#E4F3F1',
                border: '1px solid rgba(47,67,52,0.4)',
                color: '#2f4334',
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
            <div style={{ fontSize: 14, fontWeight: 700, color: '#3b2e24', marginBottom: 4 }}>
              Kasa ({docs.length})
            </div>
            <div style={{ fontSize: 12, color: '#8b7d70', marginBottom: 12, lineHeight: 1.45 }}>
              Belge adına tıklayın: önizleme açılır. “Değerlendir” lab tablosu veya görüntü taslağı üretir;
              “Asistana raporla” epikriz / genel belge taslağı yazar. Resmi tanı onayıyla Objektif’e eklenir.
            </div>
            {!docs.length ? (
              <div style={{ fontSize: 13, color: '#8b7d70' }}>Bu hasta için henüz belge yok.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {docs.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      // MOBILE-REVIEW: "Asistana raporla" + "Lab" eklenince satır 360px'te kendi
                      // kutusunu 29px aşıyordu; sarmalayınca ad üstte, eylemler altta kalıyor.
                      flexWrap: 'wrap',
                      gap: 8,
                      padding: '10px 12px',
                      background: viewer?.id === d.id ? '#E4F3F1' : '#FFFFFF',
                      border: '1px solid rgba(58,44,34,0.08)',
                      borderRadius: 12,
                      color: '#3b2e24',
                    }}
                  >
                    <span
                      onClick={() => setViewer(d)}
                      style={{ flex: '1 1 140px', minWidth: 0, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}
                    >
                      {d.fileName}
                    </span>
                    <span style={{ fontSize: 11, color: '#8b7d70' }}>{belgeKategoriEtiket(d)}{d.visitId ? ' · bu muayene' : ''}</span>
                    <span style={{ fontSize: 11, color: '#8b7d70' }}>{Math.max(1, Math.round(d.fileSize / 1024))} KB</span>
                    {/* KASA-BELGE-01: lab → /lab; röntgen → analiz; asla röntgende lab CTA */}
                    {belgeDegerlendirmeCtalari(d).map((cta) => {
                      const href =
                        cta.yol === 'lab'
                          ? `/dashboard/doktor/hastalar/${hastaId}/belgeler/${d.id}/lab`
                          : `/dashboard/doktor/hastalar/${hastaId}/belgeler/${d.id}`
                      const color = cta.tur === 'lab' ? '#B4832F' : '#2f4334'
                      const border = cta.tur === 'lab' ? 'rgba(180,131,47,0.4)' : 'rgba(47,67,52,0.4)'
                      return (
                        <a
                          key={cta.tur}
                          href={href}
                          title={cta.tur === 'lab' ? 'Tabloyu çıkar, düzelt ve asistan raporunu üret' : cta.tur === 'rontgen' ? 'Görüntüyü değerlendir; hekim onayıyla Objektif’e eklenir' : 'Asistan taslak rapor yazsın; hekim onayıyla Objektif’e eklenir'}
                          style={{ fontSize: 11, fontWeight: 700, color, border: `1px solid ${border}`, borderRadius: 999, padding: '4px 10px', textDecoration: 'none', whiteSpace: 'nowrap' }}
                        >
                          {cta.label}
                        </a>
                      )
                    })}
                    <button
                      type="button"
                      onClick={() => belgeSil(d)}
                      disabled={silinen === d.id}
                      title="Belgeyi sil"
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(164,91,62,0.4)',
                        color: '#a45b3e',
                        borderRadius: 8,
                        padding: '4px 10px',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: silinen === d.id ? 'default' : 'pointer',
                        opacity: silinen === d.id ? 0.5 : 1,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {silinen === d.id ? 'Siliniyor…' : 'Sil'}
                    </button>
                  </div>
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
