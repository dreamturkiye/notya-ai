'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import DocumentViewer from '@/components/doktor/DocumentViewer'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { belgeDegerlendirmeCtalari, belgeKategoriEtiket } from '@/lib/doktor/belgeTur'

type VaultDoc = {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  category: string | null
  createdAt: string
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
  const [filtre, setFiltre] = useState<'hepsi' | 'lab'>('hepsi')
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
      fetch(`/api/doktor/belgeler/lab?patientId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }).then((r) => (r.ok ? r.json() : { ozet: {} })).then((j) => setLabOzet(j.ozet || {})).catch(() => {})
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
          href={patientId ? `/dashboard/doktor/belgeler?hastaId=${encodeURIComponent(patientId)}` : '/dashboard/doktor/belgeler'}
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
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          {(['hepsi', 'lab'] as const).map((f) => <button key={f} type="button" onClick={() => setFiltre(f)} style={{ background: filtre === f ? 'rgba(15,155,142,0.2)' : 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: filtre === f ? '#2DD4BF' : '#8FA0B5', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>{f === 'hepsi' ? 'Tümü' : `Lab (${Object.keys(labOzet).length})`}</button>)}
        </div>
      )}
      {!loading && !error && docs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {docs.filter((d) => filtre === 'hepsi' || labOzet[d.id]).map((d) => (
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
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{d.fileName}{labOzet[d.id]?.panel_type === 'yenidogan_tarama' && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 800, color: '#FBBF24', border: '1px solid rgba(251,191,36,0.5)', borderRadius: 999, padding: '1px 7px' }}>NTP-{labOzet[d.id].sample_no || '?'}</span>}{labOzet[d.id] && <span style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#8FA0B5', marginTop: 2 }}>{labOzet[d.id].toplam} parametre · {labOzet[d.id].yuksek} yüksek · {labOzet[d.id].dusuk} düşük{labOzet[d.id].kritik ? ` · ${labOzet[d.id].kritik} kritik` : ''} {labOzet[d.id].onemli.map((o) => <span key={o} style={{ marginLeft: 6, border: `1px solid ${o.endsWith('↓') ? 'rgba(96,165,250,0.5)' : 'rgba(248,113,113,0.5)'}`, borderRadius: 999, padding: '1px 7px', color: o.endsWith('↓') ? '#60A5FA' : '#F87171', fontWeight: 700 }}>{o}</span>)}</span>}</span>
              <span style={{ fontSize: 11, color: '#8FA0B5' }}>{belgeKategoriEtiket(d)}</span>
              {belgeDegerlendirmeCtalari(d).map((cta) => {
                const base =
                  cta.yol === 'lab'
                    ? `/dashboard/doktor/hastalar/${patientId}/belgeler/${d.id}/lab`
                    : `/dashboard/doktor/hastalar/${patientId}/belgeler/${d.id}`
                const href = specialtyGeri ? `${base}?geriTab=${specialtyGeri}` : base
                const color = cta.tur === 'lab' ? '#FBBF24' : '#2DD4BF'
                const border = cta.tur === 'lab' ? 'rgba(251,191,36,0.4)' : 'rgba(45,212,191,0.4)'
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
