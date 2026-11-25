import type { Metadata } from 'next'
import { DemoOturumKapisi } from '@/components/demo/DemoOturumKapisi'

/** HASTA-PORTALI-GUNLUK — internal demo of the doctor's Ev verisi card: signed-in Notya users only, never indexed. */
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function DemoHekimLayout({ children }: { children: React.ReactNode }) {
  return <DemoOturumKapisi>{children}</DemoOturumKapisi>
}
