/**
 * HASTA-PORTALI-GUNLUK — install Sağlığım to the home screen (PWA). The start URL is the patient's own link, so the
 * installed icon opens straight to Bugün (the PIN gate still applies). iOS delivers web push only to an installed web
 * app, so this is what makes reminders work on iPhone. No patient data here — only the link the patient already has.
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export function GET(_req: Request, { params }: { params: { token: string } }) {
  const yol = `/portal/hasta/${encodeURIComponent(params.token)}`
  return NextResponse.json({
    name: 'Sağlığım · Notya', short_name: 'Sağlığım', description: 'Günlük sağlık eviniz: ilaçlar, ölçümler ve doktorunuz.',
    id: yol, start_url: yol, scope: yol, display: 'standalone', orientation: 'portrait', lang: 'tr',
    background_color: '#f4eee3', theme_color: '#f4eee3',
    icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }],
  }, { headers: { 'content-type': 'application/manifest+json; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } })
}
