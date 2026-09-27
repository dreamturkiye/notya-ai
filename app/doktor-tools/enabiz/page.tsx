'use client'
import { Suspense } from 'react'
import EnabizMasa from '@/components/doktor/EnabizMasa'
import { toolsShell } from '@/lib/doktor/toolsUi'

export const dynamic = 'force-dynamic'

export default function ENabizMasaSayfa() {
  return (
    <div style={toolsShell}>
      <Suspense fallback={null}>
        <EnabizMasa />
      </Suspense>
    </div>
  )
}
