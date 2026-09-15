'use client'

import type { CSSProperties } from 'react'
import type { PatchCourse } from '../schema'
import { patchStatus, plannedReads } from '../engines/patch-calendar'

const box: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 12,
  padding: 16,
}

export function YamaTakvimi({ course, today }: { course: PatchCourse | null; today: string }) {
  const status = course ? patchStatus(course, today) : '—'
  const plan = course ? plannedReads(course.appliedAt) : null
  return (
    <section style={box} data-tab="YamaTakvimi">
      <h2 style={{ margin: 0, fontSize: 16 }}>Yama takvimi</h2>
      {!course && <p style={{ fontSize: 13, color: '#8FA0B5' }}>Aktif yama serisi yok.</p>}
      {course && (
        <>
          <p style={{ fontSize: 13 }}>Durum: {String(status)}</p>
          <p style={{ fontSize: 12, color: '#8FA0B5' }}>
            Uygulama {course.appliedAt} · D2 {plan?.d2} · D4 {plan?.d4}
          </p>
          <p style={{ fontSize: 12 }}>
            Okunan D2 {course.readD2 ?? '—'} · D4 {course.readD4 ?? '—'} · pozitif {course.positives.join(', ') || 'yok'}
          </p>
        </>
      )}
    </section>
  )
}

export default YamaTakvimi
