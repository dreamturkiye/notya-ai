'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DoktorNav from '@/components/doktor/DoktorNav'
import { HedefBoyAracPaneli } from '@/components/hedefBoy/HedefBoyAracPaneli'
import { usePediatriHedefBoy } from '@/components/hedefBoy/usePediatriHedefBoy'
import { toolsShell } from '@/lib/doktor/toolsUi'

export const dynamic = 'force-dynamic'

export default function HedefBoyAracPage() {
  const router = useRouter()
  const [aile, setAile] = useState(false)
  const pediatriAraci = usePediatriHedefBoy()

  useEffect(() => {
    if (pediatriAraci === false) router.replace('/doktor-tools')
  }, [pediatriAraci, router])

  if (!pediatriAraci) {
    return (
      <div style={toolsShell}>
        <DoktorNav />
      </div>
    )
  }

  return (
    <div style={toolsShell}>
      {!aile && <DoktorNav />}
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: aile ? 0 : '24px 16px 48px' }}>
        <Suspense fallback={<div style={{ padding: 40, color: '#8FA0B5' }}>Yükleniyor…</div>}>
          <HedefBoyAracPaneli onAileModu={setAile} />
        </Suspense>
      </div>
    </div>
  )
}
