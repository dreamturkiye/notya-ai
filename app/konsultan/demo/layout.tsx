import type { Metadata } from 'next'
import { DemoOturumKapisi } from '@/components/demo/DemoOturumKapisi'

/** NOTYA-LANDING-2026-10: konsültan demo is internal — signed-in Notya users only, never indexed. */
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function KonsultanDemoLayout({ children }: { children: React.ReactNode }) {
  return <DemoOturumKapisi>{children}</DemoOturumKapisi>
}
