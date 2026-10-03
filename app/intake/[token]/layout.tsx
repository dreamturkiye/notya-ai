import type { Metadata } from 'next'
import { intakeDoktorOg, intakeOgAciklama, intakeOgBaslik } from '@/lib/intake/doktorOg'

export const dynamic = 'force-dynamic'

type Props = { params: { token: string }; children: React.ReactNode }

export async function generateMetadata({ params }: { params: { token: string } }): Promise<Metadata> {
  const d = await intakeDoktorOg(params.token).catch(() => null)
  const title = d ? intakeOgBaslik(d) : 'Hasta Bilgi Formu'
  const description = d
    ? intakeOgAciklama(d)
    : 'Randevu öncesi hasta bilgi formu.'
  const base = String(process.env.NEXT_PUBLIC_APP_URL || 'https://www.notya.io').replace(/\/$/, '')
  return {
    metadataBase: new URL(base),
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'tr_TR',
      siteName: title,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default function IntakeTokenLayout({ children }: Props) {
  return children
}
