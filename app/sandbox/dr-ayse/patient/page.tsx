'use client'

import { Suspense } from 'react'
import PatientPageInner from './PatientPageInner'

export default function DrAysePatientPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24, color: '#fff', background: '#080F1A', minHeight: '100dvh' }}>Yükleniyor...</div>}>
      <PatientPageInner />
    </Suspense>
  )
}
