/**
 * AU-BETA-01 — /api/ulke/portal/gizlilik: the signed-in PATIENT's privacy card (pack extension `uzanti.gizlilik`).
 *   GET                                   200 { riza: record|null, talepler }
 *   POST { eylem:'riza', kabul:true }     200 records the consent of the ACTIVE notice version (an explicit `kabul: true` is required)
 *   POST { eylem:'geri' }                 200 withdraws it
 *   POST { eylem:'talep', tur, ayrinti }  200 { talep }  an access or correction request, due in 30 days
 * Doctor and patient are the session's own; nothing is taken from the request.
 */
import { NextRequest } from 'next/server'
import { govdeOku } from '@/lib/ulke/uygulama/cevap'
import { portalOturum } from '@/lib/ulke/portal/giris'
import { PORTAL_KOD, portalCevabi, portalIstegiMi, portalSinirinda } from '@/lib/ulke/portal/rotaYardimcisi'
import { ulkePaketi } from '@/lib/ulke/ulke'
import { gecerliRiza, rizaEkle, rizaGeriCek } from '@/lib/ulke/gizlilik/riza'
import { hastaninTalepleri, talepOlustur } from '@/lib/ulke/gizlilik/talep'

export const dynamic = 'force-dynamic'

export const GET = portalSinirinda('portal gizlilik GET', async (req: NextRequest) => {
  if (!ulkePaketi().uzanti?.gizlilik) return PORTAL_KOD.yok()
  const oturum = await portalOturum(req)
  if (!oturum) return PORTAL_KOD.oturumYok()
  const [riza, talepler] = await Promise.all([gecerliRiza(oturum.supabase, oturum.doktorId, oturum.hastaId), hastaninTalepleri(oturum.supabase, oturum.doktorId, oturum.hastaId)])
  return portalCevabi({ riza, talepler })
})

export const POST = portalSinirinda('portal gizlilik POST', async (req: NextRequest) => {
  if (!ulkePaketi().uzanti?.gizlilik) return PORTAL_KOD.yok()
  if (!portalIstegiMi(req)) return PORTAL_KOD.gecersiz()
  const oturum = await portalOturum(req)
  if (!oturum) return PORTAL_KOD.oturumYok()
  const g = await govdeOku(req)
  if (g.eylem === 'riza') {
    if (g.kabul !== true) return portalCevabi({ code: 'RIZA_GEREKLI' }, 400)
    const k = await rizaEkle(oturum.supabase, oturum.doktorId, oturum.hastaId, 'portal')
    return k ? portalCevabi({ riza: k }) : PORTAL_KOD.basarisiz()
  }
  if (g.eylem === 'geri') return (await rizaGeriCek(oturum.supabase, oturum.doktorId, oturum.hastaId)) ? portalCevabi({ riza: null }) : PORTAL_KOD.basarisiz()
  if (g.eylem === 'talep') {
    const r = await talepOlustur(oturum.supabase, oturum.doktorId, oturum.hastaId, { tur: g.tur, ayrinti: g.ayrinti })
    if (r.tamam) return portalCevabi({ talep: r.talep })
    return portalCevabi({ code: r.kod }, r.kod === 'BASARISIZ' ? 500 : r.kod === 'BEKLEYEN_VAR' ? 409 : 400)
  }
  return PORTAL_KOD.gecersiz('eylem')
})
