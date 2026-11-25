/**
 * HASTA-PORTALI-GUNLUK — install Sağlığım to the home screen (PWA). The start URL is the patient's own link, so the
 * installed icon opens straight to Bugün (the PIN gate still applies). iOS delivers web push only to an installed web
 * app, so this is what makes reminders work on iPhone. No patient data here — only the link the patient already has.
 *
 * HASTA-ALANI-MARKA (Kaan, 2026-11-25): the installed app carries the DOCTOR's identity — name "Dr. Arıoğlu · Sağlığım",
 * short name "Dr. Arıoğlu" (or the clinic / display name), and an icon drawn from his logo → photo → monogram
 * (/marka/ikon). The Notya icon is not used for a patient's portal.
 */
import { NextResponse } from 'next/server'
import { portalMarkasiTokenla } from '@/lib/portal/markaSunucu'
import { markaKisaEtiket, markaSekmeBasligi } from '@/lib/portal/marka'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const yol = `/portal/hasta/${encodeURIComponent(params.token)}`
  const ikon = `/api/portal/hasta/${encodeURIComponent(params.token)}/marka/ikon`
  const marka = await portalMarkasiTokenla(params.token)
  return NextResponse.json({
    name: markaSekmeBasligi(marka), short_name: markaKisaEtiket(marka), description: `${marka.ad} — ilaçlarınız, ölçümleriniz, mesajlarınız ve randevularınız.`,
    id: yol, start_url: yol, scope: yol, display: 'standalone', orientation: 'portrait', lang: 'tr',
    background_color: '#f4eee3', theme_color: '#f4eee3',
    icons: [
      { src: `${ikon}?b=192`, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: `${ikon}?b=512`, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: `${ikon}?b=512`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }, { headers: { 'content-type': 'application/manifest+json; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } })
}
