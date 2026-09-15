'use client'

/**
 * Live dermatology chapter on the hasta dosyası.
 * Photos from core görüntüleme (coreImageId only). Dual-sign drafts are not diagnoses.
 */
import { useCallback, useEffect, useState } from 'react'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { payloadFromGoruntuleme, type LiveGoruntuRow } from '@/lib/specialties/dermatoloji-live'
import LezyonKarti from '@/specialties/dermatoloji/ui/LezyonKarti'
import VucutHaritasi from '@/specialties/dermatoloji/ui/VucutHaritasi'
import FotoDermoskopiGaleri from '@/specialties/dermatoloji/ui/FotoDermoskopiGaleri'
import BeforeAfterCompare from '@/specialties/dermatoloji/ui/BeforeAfterCompare'
import AsistanGorselPanel from '@/specialties/dermatoloji/ui/AsistanGorselPanel'
import SkorPaneli from '@/specialties/dermatoloji/ui/SkorPaneli'
import YamaTakvimi from '@/specialties/dermatoloji/ui/YamaTakvimi'
import FototerapiDefteri from '@/specialties/dermatoloji/ui/FototerapiDefteri'

const panel: React.CSSProperties = {
  background: '#0D1C33',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  padding: 16,
}

export default function HastaDermatoloji({ patientId }: { patientId: string }) {
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

  const payload = payloadFromGoruntuleme(patientId, rows || [])
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div style={{ display: 'grid', gap: 12 }} data-chapter="dermatoloji">
      <div style={{ ...panel, padding: '12px 16px' }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>Deri & Lezyon</div>
        <p style={{ margin: '6px 0 0', fontSize: 12, color: '#8FA0B5' }}>
          coreImageId only — ikinci store yok. Asistan taslak tanı değildir; uzman onay gerekir.
        </p>
      </div>
      {hata && <div style={{ color: '#FCA5A5', fontSize: 13 }}>{hata}</div>}
      {rows === null && <div style={{ color: '#8FA0B5', fontSize: 13 }}>Yükleniyor…</div>}
      {rows !== null && (
        <>
          <LezyonKarti lesions={payload.lesions} />
          <VucutHaritasi map={payload.total_body_map} />
          <FotoDermoskopiGaleri photos={payload.photos} />
          <BeforeAfterCompare pairs={payload.before_after} />
          <AsistanGorselPanel reads={payload.vision_reads} />
          <SkorPaneli />
          <YamaTakvimi course={payload.patch_courses[0] ?? null} today={today} />
          <FototerapiDefteri sessions={[]} />
        </>
      )}
    </div>
  )
}
