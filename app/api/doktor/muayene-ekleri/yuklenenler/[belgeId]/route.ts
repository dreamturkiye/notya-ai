/**
 * MUAYENE-EKLERI-07 — streams ONE file of a visit (authenticated, decrypted per request, no public URL).
 *   GET ?sessionId=<visit>[&indir=1]
 * Only images and PDFs are ever sent inline; every other type is forced to "attachment" whatever the query says.
 * The viewer fetches this with the bearer token and shows the bytes from a blob: URL, so no token or signed link
 * ever sits in a URL, the history or a referrer. 404 for anything the doctor's practice does not own.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { muayeneEkleriAcikMi } from '@/lib/doktor/muayeneEk/bayrak'
import { gorunumTuru, seansDosyasiniAc } from '@/lib/doktor/muayeneEk/yuklenenDosyalar'
import { contentDispositionAd } from '@/lib/vault/validation'
import { logAccess } from '@/lib/security/auditLogger'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Ctx = { params: { belgeId: string } | Promise<{ belgeId: string }> }

export async function GET(req: NextRequest, ctx: Ctx) {
  if (!muayeneEkleriAcikMi()) return NextResponse.json({ error: 'Kapalı.' }, { status: 404 })
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { belgeId } = await ctx.params
  const sessionId = req.nextUrl.searchParams.get('sessionId') || ''
  if (!sessionId || !belgeId) return NextResponse.json({ error: 'sessionId zorunludur.' }, { status: 400 })

  const dosya = await seansDosyasiniAc(oturum.supabase, oturum.doktorId, sessionId, belgeId)
  if (!dosya) return NextResponse.json({ error: 'Dosya bulunamadı.' }, { status: 404 })

  // KVKK audit trail (who opened which file); best effort — a logging failure must not hide the file from the doctor.
  try { await logAccess(oturum.user.id, 'muayene_ek_dosya', dosya.meta.id, req) } catch { /* never blocks */ }

  const satirIci = gorunumTuru(dosya.meta.fileType) !== 'diger' && req.nextUrl.searchParams.get('indir') !== '1'
  return new NextResponse(new Uint8Array(dosya.bytes), {
    status: 200,
    headers: {
      'Content-Type': dosya.meta.fileType,
      'Content-Length': String(dosya.bytes.length),
      'Content-Disposition': `${satirIci ? 'inline' : 'attachment'}; ${contentDispositionAd(dosya.meta.fileName)}`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
