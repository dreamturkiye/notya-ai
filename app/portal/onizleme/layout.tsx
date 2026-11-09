import type { Metadata } from 'next'

/** TR-PARITE-01 — the doctor's own preview of the patient page: signed-in doctors only, never indexed. */
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function PortalOnizlemeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
