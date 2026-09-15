'use client'

import type { CSSProperties } from 'react'
import type { PatchCourse } from '../schema'
import { patchStatus } from '../engines/patch-calendar'

const box: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 12,
  padding: 16,
}

export function YamaTakvimi({ course, today }: { course: PatchCourse | null; today: string }) {
  const status = course ? patchStatus(course, today) : '—'
  return (
    <section style={box} data-tab="YamaTakvimi">
      <h2 style={{ margin: 0, fontSize: 16 }}>Yama takvimi</h2>
      <p style={{ fontSize: 13 }}>D2 / D4 · {String(status)}</p>
    </section>
  )
}

export default YamaTakvimi
