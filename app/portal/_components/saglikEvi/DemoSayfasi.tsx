'use client'
/**
 * HASTA-PORTALI-GUNLUK — internal demo (/portal/demo, signed-in Notya users only): the live daily-health-home pages on
 * synthetic data. Nothing is sent anywhere (example mode).
 */
import { useEffect, useState, type ReactNode } from 'react'
import { SAGLIGIM_DEMO } from '@/lib/portal/demoData'
import { PortalOnizlemeProvider } from '../PortalLiveProvider'

/** HASTA-MODULLERI: ?durum=ht is a hypertension-only patient — the shared demo record's visit reason says so too. */
const HT_DEMO = { ...SAGLIGIM_DEMO, visits: SAGLIGIM_DEMO.visits.map((v) => (v.basvuruNedeni === 'Tansiyon ve şeker kontrolü' ? { ...v, basvuruNedeni: 'Tansiyon kontrolü' } : v)) }

export function DemoSaglikEvi({ children }: { children: ReactNode }) {
  // Read after mount (no server / client URL mismatch); the daily home itself reads ?durum in GunlukProvider.
  const [ht, setHt] = useState(false)
  useEffect(() => { setHt(new URLSearchParams(window.location.search).get('durum') === 'ht') }, [])
  return <PortalOnizlemeProvider key={ht ? 'ht' : 'dm-ht'} data={ht ? HT_DEMO : SAGLIGIM_DEMO} basePath="/portal/demo">{children}</PortalOnizlemeProvider>
}
