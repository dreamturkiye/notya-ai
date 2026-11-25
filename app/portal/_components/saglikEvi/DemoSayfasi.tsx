'use client'
/**
 * HASTA-PORTALI-GUNLUK — internal demo (/portal/demo, signed-in Notya users only): the live daily-health-home pages on
 * synthetic data. Nothing is sent anywhere (example mode).
 */
import { useEffect, useState, type ReactNode } from 'react'
import { SAGLIGIM_DEMO } from '@/lib/portal/demoData'
import { PortalOnizlemeProvider } from '../PortalLiveProvider'
import { demoHekim, demoMarkaSecimiOku, type DemoMarkaTuru } from '@/lib/portal/demoMarka'

/** HASTA-MODULLERI: ?durum=ht is a hypertension-only patient — the shared demo record's visit reason says so too. */
const HT_DEMO = { ...SAGLIGIM_DEMO, visits: SAGLIGIM_DEMO.visits.map((v) => (v.basvuruNedeni === 'Tansiyon ve şeker kontrolü' ? { ...v, basvuruNedeni: 'Tansiyon kontrolü' } : v)) }

export function DemoSaglikEvi({ children }: { children: ReactNode }) {
  // Read after mount (no server / client URL mismatch); the daily home itself reads ?durum in GunlukProvider.
  const [ht, setHt] = useState(false)
  // HASTA-ALANI-MARKA: the doctor card follows the demo brand variant (?marka=…), so header and card agree.
  const [marka, setMarka] = useState<DemoMarkaTuru>('monogram')
  useEffect(() => { setHt(new URLSearchParams(window.location.search).get('durum') === 'ht'); setMarka(demoMarkaSecimiOku()) }, [])
  const temel = ht ? HT_DEMO : SAGLIGIM_DEMO
  const data = marka === 'monogram' ? temel : { ...temel, hekim: demoHekim(marka) }
  return <PortalOnizlemeProvider key={`${ht ? 'ht' : 'dm-ht'}-${marka}`} data={data} basePath="/portal/demo">{children}</PortalOnizlemeProvider>
}
