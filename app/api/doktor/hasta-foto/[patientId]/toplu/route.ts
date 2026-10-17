/**
 * FOTO-ARSIV-01 — batch actions on up to 100 photos of one patient (tag, remove tag, favourite, key photo, stars, region, hide).
 *   POST /api/doktor/hasta-foto/[patientId]/toplu   { islem, belgeIds[], etiket? | deger? }
 * Every belgeId is proved against the patient and the doctor (fotoBaglami); ids that fail are reported in `atlanan` and
 * never touched — the response does not say whether they exist elsewhere.
 */
import { NextRequest } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { fotoArsiviAcikMi } from '@/lib/doktor/fotoArsiv/bayrak'
import { topluYaz } from '@/lib/doktor/fotoArsiv/sunucu'
import { topluIstekDogrula } from '@/lib/doktor/fotoArsiv/meta'
import { bulunamadi, gecersiz, hataYaniti, idlerGecerli, jsonGovde, kapaliYaniti, yanit } from '@/lib/doktor/fotoArsiv/rota'
import { logFotoOlayi } from '@/lib/security/auditLogger'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Ctx = { params: { patientId: string } | Promise<{ patientId: string }> }

export async function POST(req: NextRequest, ctx: Ctx) {
  if (!fotoArsiviAcikMi()) return kapaliYaniti()
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { patientId } = await ctx.params
  if (!idlerGecerli(patientId)) return bulunamadi()
  const govde = await jsonGovde(req)
  const d = topluIstekDogrula(govde)
  if (!d.istek) return gecersiz(d.hata || 'Geçersiz istek.')
  try {
    const sonuc = await topluYaz(oturum.supabase, oturum.doktorId, patientId, d.istek)
    if (!sonuc) return bulunamadi()
    try { await logFotoOlayi(oturum.user.id, 'duzenle', patientId, { patientId, adet: sonuc.guncellenen.length }, req) } catch { /* never blocks */ }
    return yanit(sonuc)
  } catch (e) { return hataYaniti(e) }
}
