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
import { CHROME_RENK } from '@/lib/doktor/chromeTheme'

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
  const [files, setFiles] = useState<File[]>([])
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

  // Kaan 2026-10-21: bir anda çok sayıda belge yüklenebilmeli (üst sınır 30; her dosya ≤ 4 MB).
  const DOSYA_UST_SINIR = 30
  const dosyalarSecildi = (liste: File[]) => {
    setError('')
    const buyuk = liste.filter((f) => f.size > VAULT_MAX_BYTES)
    const uygun = liste.filter((f) => f.size <= VAULT_MAX_BYTES)
    if (buyuk.length) setError(`${buyuk.length} dosya 4 MB sınırını aşıyor ve listeye alınmadı: ${buyuk.slice(0, 3).map((f) => f.name).join(', ')}${buyuk.length > 3 ? '…' : ''}`)
    else if (uygun.length > DOSYA_UST_SINIR) setError(`Bir seferde en çok ${DOSYA_UST_SINIR} dosya yüklenebilir; ilk ${DOSYA_UST_SINIR} tanesi alındı.`)
    setFiles((onceki) => {
      const hepsi = [...onceki, ...uygun]
      const gorulen = new Set<string>()
      return hepsi.filter((f) => { const k = `${f.name}|${f.size}|${f.lastModified}`; if (gorulen.has(k)) return false; gorulen.add(k); return true }).slice(0, DOSYA_UST_SINIR)
    })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const dosyayiKaldir = (i?: number) => {
    setFiles((l) => (i == null ? [] : l.filter((_, j) => j !== i)))
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
    if (!files.length) {
      setError('Lütfen yüklenecek en az bir dosya seçin.')
      return
    }

    setUploading(true)
    try {
      const token = await getAccessTokenAsync()
      if (!token) throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yapın.')
      const basarili: { id: string; ad: string; doc: VaultDoc | null }[] = []
      const hatali: { ad: string; neden: string }[] = []
      let kalan = [...files]
      const isci = async () => {
        for (;;) {
          const f = kalan.shift()
          if (!f) return
          try {
            const form = new FormData()
            form.append('file', f)
            form.append('patientId', hastaId)
            form.append('category', belgeType)
            if (visitId) form.append('visitId', visitId)
            if (notes.trim()) form.append('notes', notes.trim())
            const res = await fetch('/api/doktor/documents', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form })
            const d = await res.json().catch(() => ({}))
            if (!res.ok) { hatali.push({ ad: f.name, neden: d.error || 'yüklenemedi' }); continue }
            basarili.push({
              id: d.document?.id, ad: f.name,
              doc: d.document ? { id: d.document.id, fileName: d.document.fileName, fileType: d.document.fileType, fileSize: d.document.fileSize, category: d.document.category, notes: d.document.notes, createdAt: d.document.createdAt, visitId: d.document.visitId || visitId || null } : null,
            })
          } catch { hatali.push({ ad: f.name, neden: 'bağlantı hatası' }) }
        }
      }
      await Promise.all([isci(), isci(), isci()])
      // KONSULTASYON-01: yalnız tek dosyada, isteğe bağlı konsültasyona bağla (KANIT).
      let bag: Awaited<ReturnType<typeof konsultasyonaBagla>> | null = null
      if (basarili.length === 1 && kons.acik && kons.id && basarili[0].id) bag = await konsultasyonaBagla(kons, basarili[0].id)
      if (bag?.hata) setError(`Belge kasaya eklendi ama konsültasyona bağlanamadı: ${bag.hata}`)
      if (hatali.length) setError(`${hatali.length} dosya yüklenemedi: ${hatali.slice(0, 3).map((h) => `${h.ad} (${h.neden})`).join('; ')}${hatali.length > 3 ? '…' : ''}`)
      if (basarili.length) {
        setInfo(basarili.length === 1
          ? `"${basarili[0].ad}" kasaya eklendi${secili ? ` · ${secili.label}` : ''}${bag && !bag.hata ? (bag.yanitlandi ? ' · konsültasyon yanıtlandı' : ' · konsültasyona bağlandı — yanıt özetinizi hasta dosyasından yazın') : ''}.`
          : `${basarili.length} belge kasaya eklendi${secili ? ` · ${secili.label}` : ''}${belgeType === 'Ultrasonografi' ? ' · Belgeler sayfasından değerlendirebilir ya da muayene sonunda otomatik değerlendirtebilirsiniz' : ''}.`)
        if (bag && !bag.hata) setKons(BOS_KONSULTASYON_SECIMI)
      }
      // yalnız yüklenenler listeden çıkar; hatalılar seçili kalır (yeniden denenebilir)
      const hataAdlari = new Set(hatali.map((h) => h.ad))
      setFiles((l) => l.filter((f) => hataAdlari.has(f.name)))
      if (fileInputRef.current) fileInputRef.current.value = ''
      setNotes('')
      await loadDocs(hastaId)
      const sonDoc = [...basarili].reverse().find((x) => x.doc)?.doc
      if (sonDoc && basarili.length === 1) setViewer(sonDoc)
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
        <p style={{ color: CHROME_RENK.muted, fontSize: 14, margin: '6px 0 20px' }}>
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
                    color: CHROME_RENK.muted,
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
                  <div style={{ padding: '11px 14px', fontSize: 13, color: CHROME_RENK.muted }}>Eşleşen hasta yok</div>
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
                      color: h.id === hastaId ? CHROME_RENK.pine : CHROME_RENK.ink,
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
                <option key={t} value={t} style={{ background: '#FFFFFF', color: CHROME_RENK.ink }}>
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
              <option value="" style={{ background: '#FFFFFF', color: CHROME_RENK.ink }}>Hasta dosyası — muayene dışı</option>
              {seanslar.map((s) => (
                <option key={s.id} value={s.id} style={{ background: '#FFFFFF', color: CHROME_RENK.ink }}>{s.etiket}</option>
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
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,.mp3,.m4a,.wav,application/pdf,image/*,audio/*"
              onChange={(e) => dosyalarSecildi(Array.from(e.target.files || []))}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{ ...toolsInput, display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', fontSize: 13, cursor: 'pointer', textAlign: 'left', width: '100%', boxSizing: 'border-box' }}
            >
              <span style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 8, background: 'rgba(58,44,34,0.1)', border: '1px solid rgba(58,44,34,0.18)', color: CHROME_RENK.ink, fontWeight: 600 }}>
                {files.length ? 'Dosya Ekle' : 'Dosya Seç'}
              </span>
              <span style={{ color: CHROME_RENK.muted }}>PDF, görüntü, ses — birden fazla seçebilirsiniz (her biri ≤4 MB)</span>
            </button>
            {files.length > 0 && (
              <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
                <div style={{ fontSize: 12, color: CHROME_RENK.muted }}>{files.length} dosya seçili</div>
                {files.map((f, i) => (
                  <div key={`${f.name}|${f.size}|${f.lastModified}`} style={{ ...toolsInput, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', width: '100%', boxSizing: 'border-box' }}>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: CHROME_RENK.ink, fontSize: 13 }}>
                      {f.name} <span style={{ color: CHROME_RENK.muted }}>({Math.max(1, Math.round(f.size / 1024))} KB)</span>
                    </span>
                    <button type="button" aria-label={`${f.name} dosyasını kaldır`} onClick={() => dosyayiKaldir(i)} style={{ flexShrink: 0, background: '#FBEAE3', border: '1px solid rgba(164,91,62,0.4)', color: '#7A3D28', borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      ✕ Kaldır
                    </button>
                  </div>
                ))}
                {files.length > 1 && (
                  <button type="button" onClick={() => dosyayiKaldir()} style={{ justifySelf: 'start', background: 'transparent', border: 'none', color: '#7A3D28', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: 0 }}>Tümünü kaldır</button>
                )}
              </div>
            )}
          </div>

          <button onClick={handleUpload} disabled={uploading || !hastaId || !files.length} style={toolsPrimaryBtn(uploading || !hastaId || !files.length)}>
            {uploading ? 'Kasaya yükleniyor…' : files.length > 1 ? `${files.length} belgeyi kasaya yükle` : 'Kasaya yükle'}
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
                color: CHROME_RENK.pine,
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
            <div style={{ fontSize: 14, fontWeight: 700, color: CHROME_RENK.ink, marginBottom: 4 }}>
              Kasa ({docs.length})
            </div>
            <div style={{ fontSize: 12, color: CHROME_RENK.muted, marginBottom: 12, lineHeight: 1.45 }}>
              Belge adına tıklayın: önizleme açılır. “Değerlendir” lab tablosu veya görüntü taslağı üretir;
              “Asistana raporla” epikriz / genel belge taslağı yazar. Resmi tanı onayıyla Objektif’e eklenir.
            </div>
            {!docs.length ? (
              <div style={{ fontSize: 13, color: CHROME_RENK.muted }}>Bu hasta için henüz belge yok.</div>
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
                      color: CHROME_RENK.ink,
                    }}
                  >
                    <span
                      onClick={() => setViewer(d)}
                      style={{ flex: '1 1 140px', minWidth: 0, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}
                    >
                      {d.fileName}
                    </span>
                    <span style={{ fontSize: 11, color: CHROME_RENK.muted }}>{belgeKategoriEtiket(d)}{d.visitId ? ' · bu muayene' : ''}</span>
                    <span style={{ fontSize: 11, color: CHROME_RENK.muted }}>{Math.max(1, Math.round(d.fileSize / 1024))} KB</span>
                    {/* KASA-BELGE-01: lab → /lab; röntgen → analiz; asla röntgende lab CTA */}
                    {belgeDegerlendirmeCtalari(d).map((cta) => {
                      const href =
                        cta.yol === 'lab'
                          ? `/dashboard/doktor/hastalar/${hastaId}/belgeler/${d.id}/lab`
                          : `/dashboard/doktor/hastalar/${hastaId}/belgeler/${d.id}`
                      const color = cta.tur === 'lab' ? '#B4832F' : CHROME_RENK.pine
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
