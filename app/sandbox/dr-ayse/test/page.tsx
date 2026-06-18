'use client'

import { Suspense } from 'react'
import TestPageInner from './TestPageInner'

export default function DrAyseTestPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24, color: '#fff', background: '#080F1A', minHeight: '100dvh' }}>Yükleniyor...</div>}>
      <TestPageInner />
    </Suspense>
  )
}
