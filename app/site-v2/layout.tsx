import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { siteV2AcikMi } from '@/lib/site-v2/sandbox'

export const metadata: Metadata = {
  title: 'Notya site-v2 (sandbox)',
  robots: { index: false, follow: false },
}

export default function SiteV2Layout({ children }: { children: React.ReactNode }) {
  if (!siteV2AcikMi()) notFound()
  return children
}
