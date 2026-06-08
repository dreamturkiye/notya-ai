'use client'

import { Suspense } from 'react'
import DoctorPageInner from './DoctorPageInner'

export default function DrAyseDoctorPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24, color: '#fff', background: '#080F1A', minHeight: '100dvh' }}>Yükleniyor...</div>}>
      <DoctorPageInner />
    </Suspense>
  )
}
