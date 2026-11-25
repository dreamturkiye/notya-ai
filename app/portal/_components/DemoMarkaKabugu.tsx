'use client'
/**
 * HASTA-ALANI-MARKA — the internal demo's shell with the doctor-first header. ?marka=monogram|logo|foto|klinik picks a
 * fictional brand (lib/portal/demoMarka.ts, remembered for the demo session); ?ekran=pin shows the PIN screen a patient
 * sees first (inert — nothing is sent). Read after mount, so server and client markup agree.
 */
import { useEffect, useState, type ReactNode } from 'react'
import { PortalShell } from './PortalShell'
import { PIN_SOZLERI } from './PinGate'
import { PortalPinGorunumu } from '@/components/doktor/portal/PortalPinGorunumu'
import { MarkaKarsilama, NotyaAltyapi } from '@/components/doktor/portal/HekimMarkasi'
import { demoMarka, demoMarkaSecimiOku, type DemoMarkaTuru } from '@/lib/portal/demoMarka'
import type { PortalNavOge } from '@/lib/portal/types'

export function DemoMarkaKabugu({ basePath, ekNav, hastaAdi, children }: { basePath: string; ekNav: PortalNavOge[]; hastaAdi: string | null; children: ReactNode }) {
  const [tur, setTur] = useState<DemoMarkaTuru>('monogram')
  const [pinEkrani, setPinEkrani] = useState(false)
  const [pin, setPin] = useState('')
  useEffect(() => {
    setTur(demoMarkaSecimiOku())
    setPinEkrani(new URLSearchParams(window.location.search).get('ekran') === 'pin')
  }, [])
  const marka = demoMarka(tur)
  if (pinEkrani) {
    return (
      <PortalPinGorunumu
        s={PIN_SOZLERI}
        pin={pin}
        onPin={setPin}
        onGonder={() => undefined}
        mesgul={false}
        hata={null}
        eskiLink={false}
        ust={<MarkaKarsilama marka={marka} />}
        alt={<NotyaAltyapi />}
      />
    )
  }
  return <PortalShell basePath={basePath} ekNav={ekNav} hastaAdi={hastaAdi} marka={marka}>{children}</PortalShell>
}
