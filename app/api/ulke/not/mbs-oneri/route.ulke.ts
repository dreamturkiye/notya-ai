/**
 * AU-GAP-CLOSE-01 — /api/ulke/not/mbs-oneri: MBS item SUGGESTIONS from ONE approved note of THIS doctor.
 *
 *   POST { notId }   200 { oneriler: [{ item, aciklama, gerekce, lodgeEdilmez: true }] }
 *
 * Suggest only. Never lodges. PATIENT ISOLATION via notGetir(doctorId, notId).
 */
import { NextRequest } from 'next/server'
import { rotaButcesiMs } from '@/lib/ai/cagir'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { cevap, govdeOku, KOD, uuidMi } from '@/lib/ulke/uygulama/cevap'
import { MEKTUP_DURUMU, mbsOneriUret, type MektupRetKodu } from '@/lib/ulke/mektup/mektup'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const ret = (kod: MektupRetKodu) => cevap({ code: kod }, MEKTUP_DURUMU[kod])

export const POST = sinirda('not/mbs-oneri POST', async (req: NextRequest) => {
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.notId)) return KOD.yok()
  const r = await mbsOneriUret(oturum.supabase, oturum.user.id, g.notId, rotaButcesiMs(maxDuration))
  if (!r.tamam) return ret(r.kod)
  return cevap({ oneriler: r.oneriler })
})
