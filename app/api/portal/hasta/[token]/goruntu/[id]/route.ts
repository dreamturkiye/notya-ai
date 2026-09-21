/**
 * Sağlığım — paylaşılmış film karesi. Taslak / ham AI / OCT AI gitmez.
 * Token'ın hasta + doktoruna kilitli.
 */
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { resolvePortalToken } from '@/lib/portal/messages'
import { requirePortalUnlock } from '@/lib/portal/requireUnlock'
import { downloadDocument } from '@/lib/vault/service'
import { portaldaGorunurMu } from '@/lib/doktor/goruntuCalisma'

export const dynamic = 'force-dynamic'

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) }, auth: { persistSession: false } })
}

export async function GET(req: NextRequest, { params }: { params: { token: string; id: string } }) {
  const client = sb()
  if (!client) return NextResponse.json({ error: 'Portal yapılandırılmamış.' }, { status: 500 })
  const tok = await resolvePortalToken(client, params.token)
  if (!tok) return NextResponse.json({ error: 'Token bulunamadı veya süresi dolmuş' }, { status: 404 })
  const locked = requirePortalUnlock(req, params.token, tok)
  if (locked) return locked

  const { data: row } = await client
    .from('goruntu_calisma')
    .select('id, belge_id, tip, modalite, onay_durum, hekim_yorum')
    .eq('id', params.id)
    .eq('patient_id', tok.patient_id)
    .eq('doctor_id', tok.doctor_id)
    .maybeSingle()
  if (!row || !row.belge_id || !portaldaGorunurMu(row)) {
    return NextResponse.json({ error: 'Görüntü bulunamadı.' }, { status: 404 })
  }
  try {
    const { meta, bytes } = await downloadDocument({ supabase: client }, tok.doctor_id, row.belge_id)
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        'Content-Type': meta.fileType || 'application/octet-stream',
        'Cache-Control': 'private, max-age=900',
        'Content-Disposition': 'inline',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Görüntü bulunamadı.' }, { status: 404 })
  }
}
