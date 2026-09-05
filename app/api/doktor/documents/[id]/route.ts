import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { VaultAccessError, getDocumentMeta, softDeleteDocument } from '@/lib/vault/service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Ctx = { params: { id: string } }

export async function GET(req: NextRequest, { params }: Ctx) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  try {
    const document = await getDocumentMeta({ supabase: oturum.supabase }, oturum.user.id, params.id)
    return NextResponse.json({ document })
  } catch (e) {
    if (e instanceof VaultAccessError) {
      return NextResponse.json({ error: e.message }, { status: 403 })
    }
    return NextResponse.json({ error: 'Belge bulunamadı' }, { status: 404 })
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  try {
    await softDeleteDocument({ supabase: oturum.supabase }, oturum.user.id, params.id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof VaultAccessError) {
      return NextResponse.json({ error: e.message }, { status: 403 })
    }
    return NextResponse.json({ error: 'Belge silinemedi' }, { status: 500 })
  }
}
