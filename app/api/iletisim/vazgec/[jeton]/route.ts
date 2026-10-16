/**
 * NOTYA-HASTA-ILETISIMI-01 — public one-click unsubscribe link, embedded in every bulk e-mail
 * footer. No auth beyond the signed token itself (lib/iletisim/vazgecJetonu.ts); GET so mail
 * clients' own link-preview prefetch is tolerated (this just needs to be idempotent, which it is).
 */
import { NextRequest, NextResponse } from 'next/server'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { vazgecJetonuCoz } from '@/lib/iletisim/vazgecJetonu'
import { vazgecUygula } from '@/lib/iletisim/vazgecUygula'
import { KANAL_ETIKETI } from '@/lib/iletisim/tipler'

export const dynamic = 'force-dynamic'

function sayfa(baslik: string, govde: string): NextResponse {
  const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${baslik}</title><style>body{font-family:-apple-system,system-ui,sans-serif;max-width:480px;margin:72px auto;padding:0 20px;color:#2A2420;text-align:center}
  h1{font-size:19px}p{color:#6B6058;font-size:14px;line-height:1.5}</style></head>
  <body><h1>${baslik}</h1><p>${govde}</p></body></html>`
  return new NextResponse(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ jeton: string }> }) {
  const { jeton } = await params
  const icerik = vazgecJetonuCoz(decodeURIComponent(jeton))
  if (!icerik) return sayfa('Bağlantı geçersiz', 'Bu bağlantı artık geçerli değil.')

  const supabase = servisSupabase()
  const tamam = await vazgecUygula(supabase, icerik.doktorId, icerik.patientId, icerik.kanal)
  if (!tamam) return sayfa('İşlem tamamlanamadı', 'Lütfen daha sonra tekrar deneyin.')

  return sayfa('Aboneliğiniz durduruldu', `${KANAL_ETIKETI[icerik.kanal]} ile bilgilendirme mesajı almayacaksınız. Bu, randevu ve dosya bilgileriniz değil, yalnızca bu kanaldan toplu bilgilendirme mesajlarıyla ilgilidir.`)
}
