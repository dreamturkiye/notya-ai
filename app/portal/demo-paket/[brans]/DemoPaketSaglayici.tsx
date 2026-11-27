'use client'
/** BRANS-PAKETI Phase 2 demo — the synthetic bundle + package fixture for one branş (example mode: nothing is sent). */
import { useParams } from 'next/navigation'
import { PortalOnizlemeProvider } from '../../_components/PortalLiveProvider'
import { PaketDemoSaglayici } from '@/components/doktor/portal/bransPaketi/BransPaketiBugunKarti'
import { tibbiDemoBundle, tibbiPaketDemosu } from '@/lib/portal/bransPaketiDemo'
import type { PaketBransi } from '@/lib/portal/bransPaketi'
import type { HastaPaketi } from '@/lib/portal/bransPaketiSunucu'

export function useDemoBrans(): PaketBransi {
  const p = useParams() as { brans?: string }
  return decodeURIComponent(String(p?.brans || '')) as PaketBransi
}

export function DemoPaketSaglayici({ children }: { children: (paket: HastaPaketi, basePath: string) => React.ReactNode }) {
  const brans = useDemoBrans()
  const paket = tibbiPaketDemosu(brans)
  if (!paket) return null
  const basePath = `/portal/demo-paket/${brans}`
  return (
    <PortalOnizlemeProvider data={tibbiDemoBundle(brans)} basePath={basePath}>
      <PaketDemoSaglayici ozet={paket.ozet ?? null}>{children(paket, basePath)}</PaketDemoSaglayici>
    </PortalOnizlemeProvider>
  )
}
