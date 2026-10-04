/**
 * Hasta kendi mesaj ekini görüntüler / indirir (PIN + token kapsamı).
 */
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { resolvePortalToken } from '@/lib/portal/messages'
import { mesajEkOku } from '@/lib/portal/mesajEk'
import { requirePortalUnlock } from '@/lib/portal/requireUnlock'
import { contentDispositionAd } from '@/lib/vault/validation'

export const dynamic = 'force-dynamic'

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) }, auth: { persistSession: false } })
}

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string; ekId: string } }
) {
  const client = sb()
  if (!client) return NextResponse.json({ error: 'Portal yapılandırılmamış.' }, { status: 500 })
  const tok = await resolvePortalToken(client, params.token)
  if (!tok) return NextResponse.json({ error: 'Token bulunamadı veya süresi dolmuş' }, { status: 404 })
  const locked = requirePortalUnlock(req, params.token, tok)
  if (locked) return locked

  const ek = await mesajEkOku(client, params.ekId, tok.doctor_id, tok.patient_id)
  if (!ek) return NextResponse.json({ error: 'Ek bulunamadı' }, { status: 404 })

  return new NextResponse(new Uint8Array(ek.bytes), {
    status: 200,
    headers: {
      'Content-Type': ek.meta.fileType || 'application/octet-stream',
      'Content-Disposition': `inline; ${contentDispositionAd(ek.meta.fileName)}`,
      'Cache-Control': 'private, no-store',
      'Content-Length': String(ek.bytes.length),
    },
  })
}
