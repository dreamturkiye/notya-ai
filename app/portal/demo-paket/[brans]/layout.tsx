import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BRANS_PAKETLERI, type PaketBransi } from '@/lib/portal/bransPaketi'
import { tibbiDemoBundle } from '@/lib/portal/bransPaketiDemo'
import { PortalShell } from '../../_components/PortalShell'
import { markaCoz } from '@/lib/portal/marka'
import { DemoOturumKapisi } from '@/components/demo/DemoOturumKapisi'

/** Demo is internal — signed-in Notya users only, never indexed. */
export const metadata: Metadata = { robots: { index: false, follow: false } }

/**
 * BRANS-PAKETI Phase 2 — synthetic branş package portal for any branş with a package (fictional doctor and patient, no
 * PHI): /portal/demo-paket/pediatri, …/kadin-hastaliklari-dogum, …/dermatoloji, …/kardiyoloji, …/ortopedi, … Home =
 * the live Bugün (example mode) with the package card; /paket = the live package view. Same resolver + payload builder.
 */
export default function Layout({ children, params }: { children: React.ReactNode; params: { brans: string } }) {
  const brans = decodeURIComponent(params.brans) as PaketBransi
  if (!BRANS_PAKETLERI[brans]?.length) notFound()
  const d = tibbiDemoBundle(brans)
  return (
    <DemoOturumKapisi>
      <PortalShell marka={markaCoz({ hekimAdi: d.hekim.ad, brans: d.hekim.brans })} basePath={`/portal/demo-paket/${brans}`} ekNav={d.portal?.nav || []} hastaAdi={d.hasta.adSoyad} onSekizAlti={!!d.hasta.onSekizAlti}>{children}</PortalShell>
    </DemoOturumKapisi>
  )
}
