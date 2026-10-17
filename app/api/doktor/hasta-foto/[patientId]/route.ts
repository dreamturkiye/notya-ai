/**
 * FOTO-ARSIV-01 — the patient's clinical photo archive: every photo across visits with its archive metadata (no bytes).
 *   GET /api/doktor/hasta-foto/[patientId]
 * Doctor and asistan (read). The secretary and the liaison are refused by personelYetki.ts. Scope is always the practice's
 * doktorId; a patient that is not that doctor's answers 404, like a missing one.
 */
import { NextRequest } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { fotoArsiviAcikMi } from '@/lib/doktor/fotoArsiv/bayrak'
import { arsivListesi } from '@/lib/doktor/fotoArsiv/sunucu'
import { bulunamadi, hataYaniti, idlerGecerli, kapaliYaniti, yanit } from '@/lib/doktor/fotoArsiv/rota'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Ctx = { params: { patientId: string } | Promise<{ patientId: string }> }

export async function GET(req: NextRequest, ctx: Ctx) {
  if (!fotoArsiviAcikMi()) return kapaliYaniti()
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { patientId } = await ctx.params
  if (!idlerGecerli(patientId)) return bulunamadi()
  try {
    const liste = await arsivListesi(oturum.supabase, oturum.doktorId, patientId)
    if (!liste) return bulunamadi()
    return yanit({ ...liste, rol: oturum.rol })
  } catch (e) { return hataYaniti(e) }
}
