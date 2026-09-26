'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { HedefBoyAracPaneli } from '@/components/hedefBoy/HedefBoyAracPaneli'
import { usePediatriHedefBoy } from '@/components/hedefBoy/usePediatriHedefBoy'
import { toolsShell } from '@/lib/doktor/toolsUi'
import { useChromeGizle } from '@/components/doktor/DoktorChrome'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

export const dynamic = 'force-dynamic'

export default function HedefBoyAracPage() {
  const router = useRouter()
  const [aile, setAile] = useState(false)
  const pediatriAraci = usePediatriHedefBoy()
  // Aile modu: veliye gösterilen gömülü görünüm -- hekim chrome'u (header+dock) hiç görünmez.
  useChromeGizle(aile)

  useEffect(() => {
    if (pediatriAraci === false) router.replace('/doktor-tools')
  }, [pediatriAraci, router])

  if (!pediatriAraci) {
    return (
      <div style={toolsShell}>
      </div>
    )
  }

  return (
    <div className="hedef-boy-sayfa" style={toolsShell}>
      <div className="hedef-boy-icerik" style={{ maxWidth: 1180, margin: '0 auto', padding: aile ? 0 : '24px 16px 48px' }}>
        <Suspense fallback={<div style={{ padding: 40, color: CHROME_RENK.muted }}>Yükleniyor…</div>}>
          <HedefBoyAracPaneli onAileModu={setAile} />
        </Suspense>
      </div>
    </div>
  )
}
