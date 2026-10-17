/**
 * FOTO-ARSIV-01 — one photo's archive document.
 *   GET   /api/doktor/hasta-foto/[patientId]/[belgeId]   metadata + annotations + adjustments (never bytes)
 *   PATCH /api/doktor/hasta-foto/[patientId]/[belgeId]   region, favourite, stars, key photo, shot date, tags, note, adjustments, annotations
 * The original image is NEVER modified: adjustments and annotations are parameters in the encrypted metadata row.
 */
import { NextRequest } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { fotoArsiviAcikMi } from '@/lib/doktor/fotoArsiv/bayrak'
import { fotoDetayi, metaYaz } from '@/lib/doktor/fotoArsiv/sunucu'
import { fotoBaglami } from '@/lib/doktor/fotoArsiv/sunucu'
import { metaYamasiDogrula } from '@/lib/doktor/fotoArsiv/meta'
import { bulunamadi, gecersiz, hataYaniti, idlerGecerli, jsonGovde, kapaliYaniti, yanit } from '@/lib/doktor/fotoArsiv/rota'
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
  try {
    const d = await fotoDetayi(oturum.supabase, oturum.doktorId, patientId, belgeId)
    if (!d) return bulunamadi()
    return yanit({ meta: d.meta, belge: { id: d.belge.id, ad: d.belge.fileName, tur: d.belge.fileType, olusturuldu: d.belge.createdAt, muayeneId: d.belge.visitId } })
  } catch (e) { return hataYaniti(e) }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  if (!fotoArsiviAcikMi()) return kapaliYaniti()
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { patientId, belgeId } = await ctx.params
  if (!idlerGecerli(patientId, belgeId)) return bulunamadi()
  const d = metaYamasiDogrula(await jsonGovde(req))
  if (!d.yama) return gecersiz(d.hata || 'Geçersiz istek.')
  try {
    // ownership BEFORE any write
    if (!(await fotoBaglami(oturum.supabase, oturum.doktorId, patientId, belgeId))) return bulunamadi()
    const meta = await metaYaz(oturum.supabase, oturum.doktorId, patientId, belgeId, d.yama)
    const duzenleme = 'ayarlar' in d.yama || 'notasyonlar' in d.yama
    if (duzenleme) { try { await logFotoOlayi(oturum.user.id, 'duzenle', belgeId, { patientId }, req) } catch { /* never blocks */ } }
    return yanit({ meta })
  } catch (e) { return hataYaniti(e) }
}
