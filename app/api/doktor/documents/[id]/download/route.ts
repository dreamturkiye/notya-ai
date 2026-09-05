import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { VaultAccessError, downloadDocument } from '@/lib/vault/service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Ctx = { params: { id: string } }

/** Authenticated download — never expose public Storage URLs. */
export async function GET(req: NextRequest, { params }: Ctx) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata

  try {
    const { meta, bytes } = await downloadDocument(
      { supabase: oturum.supabase },
      oturum.user.id,
      params.id
    )
    const disposition = req.nextUrl.searchParams.get('download') === '1' ? 'attachment' : 'inline'
    const safeName = meta.fileName.replace(/"/g, '')

    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        'Content-Type': meta.fileType,
        'Content-Length': String(bytes.length),
        'Content-Disposition': `${disposition}; filename="${safeName}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (e) {
    if (e instanceof VaultAccessError) {
      return NextResponse.json({ error: e.message }, { status: 403 })
    }
    return NextResponse.json({ error: 'Dosya indirilemedi' }, { status: 404 })
  }
}
