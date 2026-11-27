import type { Metadata } from 'next'
import { SAGLIGIM_DEMO_ESTETIK_CERRAHI } from '@/lib/portal/bransPaketiDemo'
import { PortalShell } from '../_components/PortalShell'
import { markaCoz } from '@/lib/portal/marka'
import { DemoOturumKapisi } from '@/components/demo/DemoOturumKapisi'

/** Demo is internal — signed-in Notya users only, never indexed. */
export const metadata: Metadata = { robots: { index: false, follow: false } }

/** BRANS-PAKETI — synthetic estetik & plastik cerrahi portal demo (fictional professional and patient, no PHI). */
export default function Layout({ children }: { children: React.ReactNode }) {
  const d = SAGLIGIM_DEMO_ESTETIK_CERRAHI
  return (
    <DemoOturumKapisi>
      <PortalShell marka={markaCoz({ hekimAdi: d.hekim.ad, brans: d.hekim.brans, klinikAdi: d.hekim.klinik })} basePath="/portal/demo-estetik-cerrahi" ekNav={d.portal?.nav || []} hastaAdi={d.hasta.adSoyad}>{children}</PortalShell>
    </DemoOturumKapisi>
  )
}
