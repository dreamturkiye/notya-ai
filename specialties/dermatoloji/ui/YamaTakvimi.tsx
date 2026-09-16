'use client'

import { useState } from 'react'
import type { CSSProperties } from 'react'
import type { PatchCourse } from '../schema'
import { patchStatus, plannedReads } from '../engines/patch-calendar'
import { DERM_PATCH_STATUS, dermLabel } from './labels'
import { btn, giris, etiketS } from './clinic-styles'
import { goruntulemeCaptureHref } from '../engines/clinic-fit'

const box: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 12,
  padding: 16,
}

export function YamaTakvimi({
  course,
  today,
  patientId,
  onKaydet,
}: {
  course: PatchCourse | null
  today: string
  patientId?: string
  onKaydet?: (c: { id?: string; appliedAt: string; readD2: string | null; readD4: string | null; positives: string }) => void
}) {
  const status = course ? patchStatus(course, today) : null
  const plan = course ? plannedReads(course.appliedAt) : null
  const [f, setF] = useState({
    appliedAt: course?.appliedAt || today,
    readD2: course?.readD2 || '',
    readD4: course?.readD4 || '',
    positives: course?.positives.join(', ') || '',
  })
  return (
    <section style={box} data-tab="YamaTakvimi">
      <h2 style={{ margin: 0, fontSize: 16 }}>Yama takvimi</h2>
      {!course && <p style={{ fontSize: 13, color: '#8FA0B5' }}>Aktif yama serisi yok.</p>}
      {course && (
        <>
          <p style={{ fontSize: 13 }}>Durum: {status ? dermLabel(DERM_PATCH_STATUS, status) : '—'}</p>
          <p style={{ fontSize: 12, color: '#8FA0B5' }}>
            Uygulama {course.appliedAt} · D2 {plan?.d2} · D4 {plan?.d4}
          </p>
          <p style={{ fontSize: 12 }}>
            Okunan D2 {course.readD2 ?? '—'} · D4 {course.readD4 ?? '—'} · pozitif {course.positives.join(', ') || 'yok'}
          </p>
        </>
      )}
      {patientId && (
        <a href={goruntulemeCaptureHref(patientId, 'derm')} style={{ fontSize: 12, color: '#2DD4BF' }}>D0 / D2 / D4 fotoğraf ekle</a>
      )}
      {onKaydet && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onKaydet({
              id: course && 'id' in course ? String((course as { id?: string }).id || '') : undefined,
              appliedAt: f.appliedAt,
              readD2: f.readD2 || null,
              readD4: f.readD4 || null,
              positives: f.positives,
            })
          }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginTop: 10 }}
        >
          <label><span style={etiketS}>D0 uygulama</span><input type="date" style={giris} value={f.appliedAt} onChange={(e) => setF((p) => ({ ...p, appliedAt: e.target.value }))} /></label>
          <label><span style={etiketS}>D2 okuma</span><input type="date" style={giris} value={f.readD2} onChange={(e) => setF((p) => ({ ...p, readD2: e.target.value }))} /></label>
          <label><span style={etiketS}>D4 okuma</span><input type="date" style={giris} value={f.readD4} onChange={(e) => setF((p) => ({ ...p, readD4: e.target.value }))} /></label>
          <label style={{ gridColumn: '1 / -1' }}><span style={etiketS}>Pozitif alerjenler</span><input style={giris} value={f.positives} onChange={(e) => setF((p) => ({ ...p, positives: e.target.value }))} /></label>
          <button type="submit" style={btn(true)}>{course ? 'Yama güncelle' : 'Yama başlat'}</button>
        </form>
      )}
    </section>
  )
}

export default YamaTakvimi
