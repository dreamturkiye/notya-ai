import type { Metadata } from 'next'
import { HastaShell } from './HastaShell'

/** HASTA-PORTALI-GUNLUK: "Ana Ekrana Ekle" opens the patient's own link (needed for web push on iPhone). */
export function generateMetadata({ params }: { params: { token: string } }): Metadata {
  return { manifest: `/api/portal/hasta/${encodeURIComponent(params.token)}/manifest`, robots: { index: false, follow: false }, appleWebApp: { capable: true, title: 'Sağlığım', statusBarStyle: 'default' } }
}

export default function HastaLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { token: string }
}) {
  return <HastaShell token={params.token}>{children}</HastaShell>
}
