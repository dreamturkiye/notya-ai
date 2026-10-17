/**
 * FOTO-ARSIV-01 — encrypted server-stored thumbnail of a photo (small, EXIF-free, made on the device).
 *   GET /api/doktor/hasta-foto/[patientId]/[belgeId]/kucuk
 *   PUT /api/doktor/hasta-foto/[patientId]/[belgeId]/kucuk?w=<px>&h=<px>   body: the JPEG/WebP bytes (<= 150 KB)
 * Why: a grid of hundreds of photos must not decrypt and ship hundreds of full originals. 404 when the thumbnail does not
 * exist yet (the client then makes one from the original and PUTs it). Ownership is proved before any read or write.
 */
import { NextRequest } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { fotoArsiviAcikMi } from '@/lib/doktor/fotoArsiv/bayrak'
import { fotoBaglami, KUCUK_AZAMI_BAYT, kucukOku, kucukYaz } from '@/lib/doktor/fotoArsiv/sunucu'
import { bulunamadi, gecersiz, hataYaniti, idlerGecerli, kapaliYaniti, yanit } from '@/lib/doktor/fotoArsiv/rota'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Ctx = { params: { patientId: string; belgeId: string } | Promise<{ patientId: string; belgeId: string }> }

export async function GET(req: NextRequest, ctx: Ctx) {
  if (!fotoArsiviAcikMi()) return kapaliYaniti()
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { patientId, belgeId } = await ctx.params
  if (!idlerGecerli(patientId, belgeId)) return bulunamadi()
  if (!(await fotoBaglami(oturum.supabase, oturum.doktorId, patientId, belgeId))) return bulunamadi()
  const k = await kucukOku(oturum.supabase, oturum.doktorId, patientId, belgeId)
  if (!k) return bulunamadi()
  return new Response(new Uint8Array(k.bytes), {
    status: 200,
    headers: { 'Content-Type': k.mime, 'Content-Length': String(k.bytes.length), 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' },
  })
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  if (!fotoArsiviAcikMi()) return kapaliYaniti()
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { patientId, belgeId } = await ctx.params
  if (!idlerGecerli(patientId, belgeId)) return bulunamadi()
  if (Number(req.headers.get('content-length') || 0) > KUCUK_AZAMI_BAYT) return gecersiz('Küçük resim çok büyük.')
  if (!(await fotoBaglami(oturum.supabase, oturum.doktorId, patientId, belgeId))) return bulunamadi()
  const w = Number(req.nextUrl.searchParams.get('w')), h = Number(req.nextUrl.searchParams.get('h'))
  try {
    const bytes = Buffer.from(await req.arrayBuffer())
    const s = await kucukYaz(oturum.supabase, oturum.doktorId, patientId, belgeId, bytes, w, h)
    if (s === 'gecersiz') return gecersiz('Geçersiz küçük resim.')
    return yanit({ ok: true })
  } catch (e) { return hataYaniti(e) }
}
