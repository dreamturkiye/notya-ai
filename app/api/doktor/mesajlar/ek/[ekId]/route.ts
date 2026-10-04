/**
 * GET  — mesaj ekini indir / gözlemle
 * POST — { action: 'belgeye-kaydet', category? } → medical_documents
 * DELETE — ek satırını sil (mesaj kalır); genelde mesaj silince CASCADE
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { mesajEkBelgeyeKaydet, mesajEkOku, VaultValidationError } from '@/lib/portal/mesajEk'
import { contentDispositionAd } from '@/lib/vault/validation'
import { belgeTurleriIcinBrans } from '@/lib/doktor/belgeTurleri'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: { ekId: string } }
) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum

  const ek = await mesajEkOku(supabase, params.ekId, doktorId)
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

export async function POST(
  req: NextRequest,
  { params }: { params: { ekId: string } }
) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, user } = oturum

  let body: { action?: string; category?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
  }
  if (body.action !== 'belgeye-kaydet') {
    return NextResponse.json({ error: 'action=belgeye-kaydet gerekli' }, { status: 400 })
  }

  const { data: hekim } = await supabase.from('users').select('specialty').eq('id', doktorId).maybeSingle()
  const izinli = belgeTurleriIcinBrans(hekim?.specialty || null)
  const category = String(body.category || 'Diğer').trim()
  if (category && !izinli.includes(category)) {
    return NextResponse.json({ error: 'Geçersiz belge türü' }, { status: 400 })
  }

  try {
    const { belgeId } = await mesajEkBelgeyeKaydet(supabase, {
      ekId: params.ekId,
      doctorId: doktorId,
      uploadedBy: user.id,
      category: category || 'Diğer',
    })
    return NextResponse.json({ ok: true, belgeId })
  } catch (e) {
    if (e instanceof VaultValidationError) return NextResponse.json({ error: e.message }, { status: 400 })
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Kaydedilemedi' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { ekId: string } }
) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum

  const { data, error } = await supabase
    .from('hasta_mesaj_ekleri')
    .delete()
    .eq('id', params.ekId)
    .eq('doctor_id', doktorId)
    .select('id')
    .maybeSingle()
  if (error || !data) return NextResponse.json({ error: 'Ek bulunamadı' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
