'use client'

/**
 * Live dermatology chapter on the hasta dosyası.
 * Photos from core görüntüleme (coreImageId only). Dual-sign drafts are not diagnoses.
 */
import { useCallback, useEffect, useState } from 'react'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { cinsiyetGop } from '@/lib/utils/cinsiyet'
import {
  displayUrlsFromGoruntuleme,
  payloadFromGoruntuleme,
  type LiveGoruntuRow,
} from '@/lib/specialties/dermatoloji-live'
import LezyonKarti from '@/specialties/dermatoloji/ui/LezyonKarti'
import VucutHaritasi from '@/specialties/dermatoloji/ui/VucutHaritasi'
import FotoDermoskopiGaleri from '@/specialties/dermatoloji/ui/FotoDermoskopiGaleri'
import BeforeAfterCompare from '@/specialties/dermatoloji/ui/BeforeAfterCompare'
import AsistanGorselPanel from '@/specialties/dermatoloji/ui/AsistanGorselPanel'
import SkorPaneli from '@/specialties/dermatoloji/ui/SkorPaneli'
import GopBlok from '@/specialties/dermatoloji/ui/GopBlok'
import YamaTakvimi from '@/specialties/dermatoloji/ui/YamaTakvimi'
import FototerapiDefteri from '@/specialties/dermatoloji/ui/FototerapiDefteri'

const panel: React.CSSProperties = {
  background: '#0D1C33',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  padding: 16,
}

const cta: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  background: '#0F9B8E',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '8px 14px',
  fontSize: 13,
  fontWeight: 700,
  textDecoration: 'none',
  cursor: 'pointer',
}

const ctaGhost: React.CSSProperties = {
  ...cta,
  background: 'rgba(255,255,255,0.08)',
  color: '#EDF1F7',
}

export default function HastaDermatoloji({
  patientId,
  cinsiyet = null,
}: {
  patientId: string
  cinsiyet?: string | null
}) {
  const [rows, setRows] = useState<LiveGoruntuRow[] | null>(null)
  const [hata, setHata] = useState('')

  const yukle = useCallback(async () => {
    setHata('')
    try {
      const t = await ensureDoctorAccessToken()
      const r = await fetch(`/api/doktor/goruntuleme?hastaId=${patientId}`, {
        headers: { Authorization: `Bearer ${t}` },
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Görüntüleme yüklenemedi')
      setRows(Array.isArray(d) ? d : d.goruntulemeler || [])
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Yüklenemedi')
      setRows([])
    }
  }, [patientId])

  useEffect(() => { yukle() }, [yukle])

  const today = new Date().toISOString().slice(0, 10)
  const payload = payloadFromGoruntuleme(patientId, rows || [], today)
  const urls = displayUrlsFromGoruntuleme(rows || [])
  const sex = cinsiyetGop(cinsiyet)
  const goruntulemeHref = `/dashboard/doktor/goruntuleme?hastaId=${encodeURIComponent(patientId)}`
  const muayeneHref = `/session/new?patientId=${encodeURIComponent(patientId)}`
  const empty = rows !== null && rows.length === 0
  const nextActions = (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
      <a href={goruntulemeHref} style={cta}>Görüntüleme ekle</a>
      <a href={muayeneHref} style={ctaGhost}>Muayene notuna skor işle</a>
    </div>
  )

  return (
    <div style={{ display: 'grid', gap: 12 }} data-chapter="dermatoloji">
      <div style={{ ...panel, padding: '12px 16px' }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>Deri & Lezyon</div>
        <p style={{ margin: '6px 0 0', fontSize: 12, color: '#8FA0B5' }}>
          Lezyonlar mevcut görüntüleme kayıtlarından türetilir; ayrı bir fotoğraf deposu yoktur.
          Asistan taslağı tanı değildir; uzman onayı gerekir.
        </p>
        {empty && nextActions}
      </div>
      {hata && <div style={{ color: '#FCA5A5', fontSize: 13 }}>{hata}</div>}
      {rows === null && <div style={{ color: '#8FA0B5', fontSize: 13 }}>Yükleniyor…</div>}
      {rows !== null && (
        <>
          <LezyonKarti lesions={payload.lesions} emptyAction={empty ? nextActions : undefined} />
          <VucutHaritasi map={payload.total_body_map} emptyAction={empty ? nextActions : undefined} />
          <FotoDermoskopiGaleri photos={payload.photos} urls={urls} />
          <BeforeAfterCompare pairs={payload.before_after} photos={payload.photos} urls={urls} />
          <AsistanGorselPanel reads={payload.vision_reads} photos={payload.photos} />
          <SkorPaneli emptyAction={nextActions} />
          <GopBlok pack={payload.gop ?? null} today={today} sex={sex} />
          <YamaTakvimi course={payload.patch_courses[0] ?? null} today={today} />
          <FototerapiDefteri sessions={[]} />
        </>
      )}
    </div>
  )
}
