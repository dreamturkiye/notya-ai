/**
 * FOTO-ARSIV-01 — streams the photo itself (authenticated, decrypted per request, no signed URL, no public link).
 *   GET /api/doktor/hasta-foto/[patientId]/[belgeId]/dosya
 * What is shown is the image with EXIF/XMP/comment segments removed (lossless: pixels untouched). The vault original keeps
 * its bytes; this route never writes. Each open is audit-logged (KVKK). The viewer fetches with the bearer token and shows a blob: URL.
 */
import { NextRequest } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { fotoArsiviAcikMi } from '@/lib/doktor/fotoArsiv/bayrak'
import { fotoBaytlari } from '@/lib/doktor/fotoArsiv/sunucu'
import { gorselMetaTemizle } from '@/lib/doktor/fotoArsiv/metaTemizle'
import { bulunamadi, idlerGecerli, kapaliYaniti } from '@/lib/doktor/fotoArsiv/rota'
import { logFotoOlayi } from '@/lib/security/auditLogger'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Ctx = { params: { patientId: string; belgeId: string } | Promise<{ patientId: string; belgeId: string }> }

export async function GET(req: NextRequest, ctx: Ctx) {
  if (!fotoArsiviAcikMi()) return kapaliYaniti()
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { patientId, belgeId } = await ctx.params
  if (!idlerGecerli(patientId, belgeId)) return bulunamadi()
  const f = await fotoBaytlari(oturum.supabase, oturum.doktorId, patientId, belgeId)
  if (!f) return bulunamadi()
  try { await logFotoOlayi(oturum.user.id, 'ac', belgeId, { patientId }, req) } catch { /* never blocks */ }
  const temiz = gorselMetaTemizle(f.bytes)
  const bytes = temiz ? temiz.bytes : f.bytes
  const mime = temiz ? temiz.mime : f.meta.fileType
  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: {
      'Content-Type': mime,
      'Content-Length': String(bytes.length),
      'Content-Disposition': 'inline',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'X-Foto-Meta': temiz ? 'temizlendi' : 'degistirilmedi',
    },
  })
}
