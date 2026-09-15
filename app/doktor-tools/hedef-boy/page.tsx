'use client'

import { Suspense, useState } from 'react'
import DoktorNav from '@/components/doktor/DoktorNav'
import { HedefBoyAracPaneli } from '@/components/hedefBoy/HedefBoyAracPaneli'
import { toolsShell } from '@/lib/doktor/toolsUi'

export const dynamic = 'force-dynamic'

export default function HedefBoyAracPage() {
  const [aile, setAile] = useState(false)
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
