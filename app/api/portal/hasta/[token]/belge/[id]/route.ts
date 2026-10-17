/**
 * Sağlığım — hasta belge kasasındaki kendi dosyasını görüntüler / indirir.
 * Token'ın hasta + doktoruna kilitli; PIN unlock gerekir.
 */
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { resolvePortalToken } from '@/lib/portal/messages'
import { requirePortalUnlock } from '@/lib/portal/requireUnlock'
import { downloadDocument } from '@/lib/vault/service'
import { contentDispositionAd } from '@/lib/vault/validation'
import { konsultasyonBelgeIdleri, konsultasyonBelgesiMi } from '@/lib/portal/konsultasyonBelgeleri'

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
    .from('medical_documents')
    .select('id, file_name, file_type, category, deleted_at')
    .eq('id', params.id)
    .eq('patient_id', tok.patient_id)
    .eq('doctor_id', tok.doctor_id)
    .is('deleted_at', null)
    .maybeSingle()
  if (!row) return NextResponse.json({ error: 'Belge bulunamadı.' }, { status: 404 })
  // KONSULTASYON-01: a consultation report is not a patient document — same answer as a document that does not
  // exist, and the same rule the Sağlığım list applies (lib/portal/konsultasyonBelgeleri.ts). Fail closed.
  const konsultasyonBelgeleri = await konsultasyonBelgeIdleri(client, tok.doctor_id, tok.patient_id)
  if (!konsultasyonBelgeleri || konsultasyonBelgeleri.has(String(row.id)) || konsultasyonBelgesiMi(row.category)) {
    return NextResponse.json({ error: 'Belge bulunamadı.' }, { status: 404 })
  }

  try {
    const { meta, bytes } = await downloadDocument({ supabase: client }, tok.doctor_id, row.id)
    const indir = req.nextUrl.searchParams.get('indir') === '1'
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        'Content-Type': meta.fileType || String(row.file_type) || 'application/octet-stream',
        'Cache-Control': 'private, max-age=900',
        'Content-Disposition': `${indir ? 'attachment' : 'inline'}; ${contentDispositionAd(meta.fileName || String(row.file_name) || 'belge')}`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Belge bulunamadı.' }, { status: 404 })
  }
}
