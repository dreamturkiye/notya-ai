import type { Metadata } from 'next'
import { HastaShell } from './HastaShell'
import { portalMarkasiTokenla } from '@/lib/portal/markaSunucu'
import { BOLUM_ADI, markaKisaEtiket, markaSekmeBasligi } from '@/lib/portal/marka'

export const dynamic = 'force-dynamic'

/**
 * HASTA-PORTALI-GUNLUK: "Ana Ekrana Ekle" opens the patient's own link (needed for web push on iPhone).
 * HASTA-ALANI-MARKA (Kaan, 2026-11-25): tab title, home-screen name / icon and the link preview carry the DOCTOR's
 * identity ("Dr. Arıoğlu · Sağlığım"); the brand is read once on the server (lib/portal/markaSunucu.ts, React cache) and
 * rendered into the page, so the PIN screen and every page header show the doctor with no extra request from the phone.
 */
export async function generateMetadata({ params }: { params: { token: string } }): Promise<Metadata> {
  const t = encodeURIComponent(params.token)
  const marka = await portalMarkasiTokenla(params.token)
  const baslik = markaSekmeBasligi(marka)
  const aciklama = marka.kisaAd === BOLUM_ADI ? 'Doktorunuzun sizin için açtığı kişisel sağlık alanı.' : `${marka.ad} sizi kişisel sağlık alanınıza davet ediyor: ilaçlarınız, sonuçlarınız, mesajlarınız ve randevunuz.`
  const base = String(process.env.NEXT_PUBLIC_APP_URL || 'https://www.notya.io').replace(/\/$/, '')
  return {
    metadataBase: new URL(base),
    title: baslik,
    description: aciklama,
    manifest: `/api/portal/hasta/${t}/manifest`,
    robots: { index: false, follow: false },
    appleWebApp: { capable: true, title: markaKisaEtiket(marka), statusBarStyle: 'default' },
    icons: { icon: [{ url: `/api/portal/hasta/${t}/marka/ikon?b=192`, type: 'image/png' }], apple: [{ url: `/api/portal/hasta/${t}/marka/ikon?b=180`, sizes: '180x180' }] },
    openGraph: { title: baslik, description: aciklama, type: 'website', locale: 'tr_TR', siteName: marka.kisaAd },
    twitter: { card: 'summary_large_image', title: baslik, description: aciklama },
  }
}

export default async function HastaLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { token: string }
}) {
  const marka = await portalMarkasiTokenla(params.token)
  return <HastaShell token={params.token} marka={marka}>{children}</HastaShell>
}
