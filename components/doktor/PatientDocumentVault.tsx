'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import DocumentViewer from '@/components/doktor/DocumentViewer'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { belgeDegerlendirmeCtalari, belgeKategoriEtiket, belgeYenidoganTaburcuEpikriziMi } from '@/lib/doktor/belgeTur'
import MuayeneEkleri from '@/components/doktor/MuayeneEkleri'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

type VaultDoc = {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  category: string | null
  createdAt: string
  visitId: string | null
}

export default function PatientDocumentVault({
  patientId,
  specialtyGeri,
}: {
  patientId: string
  /** When opened from a specialty deep-link, evaluate Geri returns to that chapter. */
  specialtyGeri?: 'deri' | 'goz' | 'gebelik' | 'dahiliye' | null
}) {
  const [docs, setDocs] = useState<VaultDoc[]>([])
  const [viewer, setViewer] = useState<VaultDoc | null>(null)
  // NOTYA-LAB-03: lab summaries per document + Lab filter
  const [labOzet, setLabOzet] = useState<Record<string, { toplam: number; yuksek: number; dusuk: number; kritik: number; onemli: string[]; durum: string; panel_type?: string; sample_no?: string | null }>>({})
  const [filtre, setFiltre] = useState<'hepsi' | 'lab' | 'yenidogan' | 'muayene'>('hepsi')
  const [seanslar, setSeanslar] = useState<{ id: string; etiket: string }[]>([])
  const [visitId, setVisitId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [silinen, setSilinen] = useState<string | null>(null)

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
      fetch(`/api/doktor/belgeler/lab?patientId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }).then((r) => (r.ok ? r.json() : { ozet: {} })).then((j) => setLabOzet(j.ozet || {})).catch(() => {})
      setDocs(
        (data.documents || []).map((d: VaultDoc) => ({
          id: d.id,
          fileName: d.fileName,
          fileType: d.fileType,
          fileSize: d.fileSize,
          category: d.category,
          createdAt: d.createdAt,
          visitId: d.visitId || null,
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

  useEffect(() => {
    let iptal = false
    ;(async () => {
      const token = await getAccessTokenAsync()
      if (!token) return
      const r = await fetch(`/api/doktor/hastalar/${encodeURIComponent(patientId)}/sessions`, { headers: { Authorization: `Bearer ${token}` } })
      if (!r.ok) return
      const j = await r.json()
      const liste = (j.sessions || []).map((s: { id: string; created_at?: string; notes?: { basvuru_yakinmasi?: string | null }[] }) => ({
        id: s.id,
        etiket: [s.created_at ? new Date(s.created_at).toLocaleDateString('tr-TR') : '', s.notes?.[0]?.basvuru_yakinmasi || ''].filter(Boolean).join(' · ') || 'Muayene',
      }))
      if (!iptal) setSeanslar(liste)
    })()
    return () => { iptal = true }
  }, [patientId])

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
        throw new Error((j as { error?: string }).error || 'Belge silinemedi')
      }
      setDocs((prev) => prev.filter((x) => x.id !== d.id))
      if (viewer?.id === d.id) setViewer(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Belge silinemedi')
    } finally {
      setSilinen(null)
    }
  }
  return (
    <div style={{ background: '#FFFFFF', border: `1px solid ${CHROME_RENK.border}`, borderRadius: 16, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: CHROME_RENK.ink }}>Belge kasası</div>
          <div style={{ fontSize: 12, color: CHROME_RENK.muted, marginTop: 2 }}>Şifreli PDF / görüntü / ses — muayeneye bağlanabilir</div>
        </div>
        <Link
          href={patientId ? `/dashboard/doktor/belgeler?hastaId=${encodeURIComponent(patientId)}` : '/dashboard/doktor/belgeler'}
          style={{ background: '#0F9B8E', border: 'none', color: 'white', borderRadius: 999, padding: '9px 18px', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}
        >
          Belge yükle ›
        </Link>
      </div>

      <div style={{ marginBottom: 12 }}>
        <select
          value={visitId}
          onChange={(e) => setVisitId(e.target.value)}
          style={{ background: '#F6F0E4', border: `1px solid ${CHROME_RENK.border}`, borderRadius: 8, color: CHROME_RENK.ink, fontSize: 12, padding: '6px 8px', width: '100%', maxWidth: 420 }}
        >
          <option value="" style={{ color: '#000' }}>Hasta dosyası — muayene seçin (görüntü/ses bağlamak için)</option>
          {seanslar.map((s) => (
            <option key={s.id} value={s.id} style={{ color: '#000' }}>{s.etiket}</option>
          ))}
        </select>
        <MuayeneEkleri hastaId={patientId} visitId={visitId || null} onYuklendi={() => void load()} />
      </div>
      {loading && <div style={{ fontSize: 13, color: CHROME_RENK.muted }}>Yükleniyor…</div>}
      {error && <div style={{ fontSize: 13, color: CHROME_RENK.warn }}>{error}</div>}
      {!loading && !error && !docs.length && (
        <div style={{ fontSize: 13, color: CHROME_RENK.muted }}>Bu hasta için kasa boş. Belge merkezinden yükleyin.</div>
      )}
      {!loading && !error && docs.length > 0 && (() => {
        const yenidoganSayisi = docs.filter((d) => belgeYenidoganTaburcuEpikriziMi(d)).length
        const chip = (aktif: boolean) => ({
          background: aktif ? 'rgba(15,155,142,0.15)' : 'transparent',
          border: `1px solid ${CHROME_RENK.border}`,
          color: aktif ? '#0F9B8E' : CHROME_RENK.muted,
          borderRadius: 999,
          padding: '3px 10px',
          fontSize: 11,
          fontWeight: 700,
          cursor: 'pointer' as const,
        })
        return (
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setFiltre('hepsi')} style={chip(filtre === 'hepsi')}>Tümü</button>
          <button type="button" onClick={() => setFiltre('lab')} style={chip(filtre === 'lab')}>Lab ({Object.keys(labOzet).length})</button>
          <button type="button" onClick={() => setFiltre('muayene')} style={chip(filtre === 'muayene')}>Bu muayeneye bağlı ({docs.filter((d) => d.visitId).length})</button>
          {yenidoganSayisi > 0 && (
            <button type="button" onClick={() => setFiltre('yenidogan')} style={chip(filtre === 'yenidogan')}>Yenidoğan epikriz ({yenidoganSayisi})</button>
          )}
        </div>
        )
      })()}
      {!loading && !error && docs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {docs.filter((d) => {
            if (filtre === 'lab') return !!labOzet[d.id]
            if (filtre === 'yenidogan') return belgeYenidoganTaburcuEpikriziMi(d)
            if (filtre === 'muayene') return Boolean(d.visitId && (!visitId || d.visitId === visitId))
            return true
          }).map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setViewer(d)}
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'center',
                padding: '10px 12px',
                background: viewer?.id === d.id ? 'rgba(15,155,142,0.1)' : '#FFFFFF',
                border: `1px solid ${CHROME_RENK.border}`,
                borderRadius: 12,
                cursor: 'pointer',
                color: CHROME_RENK.ink,
                textAlign: 'left',
              }}
            >
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{d.fileName}{labOzet[d.id]?.panel_type === 'yenidogan_tarama' && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 800, color: '#7A5B1E', border: '1px solid rgba(251,191,36,0.5)', borderRadius: 999, padding: '1px 7px' }}>NTP-{labOzet[d.id].sample_no || '?'}</span>}{labOzet[d.id] && <span style={{ display: 'block', fontSize: 11, fontWeight: 500, color: CHROME_RENK.muted, marginTop: 2 }}>{labOzet[d.id].toplam} parametre · {labOzet[d.id].yuksek} yüksek · {labOzet[d.id].dusuk} düşük{labOzet[d.id].kritik ? ` · ${labOzet[d.id].kritik} kritik` : ''} {labOzet[d.id].onemli.map((o) => <span key={o} style={{ marginLeft: 6, border: `1px solid ${o.endsWith('↓') ? 'rgba(74,92,138,0.5)' : 'rgba(164,91,62,0.5)'}`, borderRadius: 999, padding: '1px 7px', color: o.endsWith('↓') ? '#4A5C8A' : CHROME_RENK.warn, fontWeight: 700 }}>{o}</span>)}</span>}</span>
              <span style={{ fontSize: 11, color: CHROME_RENK.muted }}>{belgeKategoriEtiket(d)}{d.visitId ? ' · muayene' : ''}</span>
              {belgeDegerlendirmeCtalari(d).map((cta) => {
                const base =
                  cta.yol === 'lab'
                    ? `/dashboard/doktor/hastalar/${patientId}/belgeler/${d.id}/lab`
                    : `/dashboard/doktor/hastalar/${patientId}/belgeler/${d.id}`
                const href = specialtyGeri ? `${base}?geriTab=${specialtyGeri}` : base
                const color = cta.tur === 'lab' ? '#7A5B1E' : '#0F9B8E'
                const border = cta.tur === 'lab' ? 'rgba(251,191,36,0.4)' : 'rgba(15,155,142,0.4)'
                return (
                  <a
                    key={cta.tur}
                    href={href}
                    onClick={(e) => e.stopPropagation()}
                    style={{ fontSize: 11, fontWeight: 700, color, border: `1px solid ${border}`, borderRadius: 999, padding: '3px 9px', textDecoration: 'none', whiteSpace: 'nowrap' }}
                  >
                    {cta.label}
                  </a>
                )
              })}
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); void belgeSil(d) }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); void belgeSil(d) } }}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: CHROME_RENK.warn,
                  border: `1px solid ${CHROME_RENK.warn}70`,
                  borderRadius: 999,
                  padding: '3px 9px',
                  whiteSpace: 'nowrap',
                  cursor: silinen === d.id ? 'default' : 'pointer',
                  opacity: silinen === d.id ? 0.5 : 1,
                }}
              >
                {silinen === d.id ? 'Siliniyor…' : 'Sil'}
              </span>
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
