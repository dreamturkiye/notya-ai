import type { Metadata } from 'next'
import { SAGLIGIM_DEMO } from '@/lib/portal/demoData'
import { DemoMarkaKabugu } from '../_components/DemoMarkaKabugu'
import { DemoOturumKapisi } from '@/components/demo/DemoOturumKapisi'

/** NOTYA-LANDING-2026-10: demo is internal — signed-in Notya users only, never indexed. */
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <DemoOturumKapisi>
      {/* HASTA-ALANI-MARKA: doctor-first header; ?marka=logo|foto|klinik and ?ekran=pin show the other brand states. */}
      <DemoMarkaKabugu basePath="/portal/demo" ekNav={SAGLIGIM_DEMO.portal?.nav || []} hastaAdi={SAGLIGIM_DEMO.hasta.adSoyad}>
        {children}
      </DemoMarkaKabugu>
    </DemoOturumKapisi>
  )
}
