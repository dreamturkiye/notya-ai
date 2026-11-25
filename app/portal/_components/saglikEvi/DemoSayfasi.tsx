'use client'
/**
 * HASTA-PORTALI-GUNLUK — internal demo (/portal/demo, signed-in Notya users only): the live daily-health-home pages on
 * synthetic data. Nothing is sent anywhere (example mode).
 */
import type { ReactNode } from 'react'
import { SAGLIGIM_DEMO } from '@/lib/portal/demoData'
import { PortalOnizlemeProvider } from '../PortalLiveProvider'

export function DemoSaglikEvi({ children }: { children: ReactNode }) {
  return <PortalOnizlemeProvider data={SAGLIGIM_DEMO} basePath="/portal/demo">{children}</PortalOnizlemeProvider>
}
