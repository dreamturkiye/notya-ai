/**
 * AU-DIETETICS-MEAL-01 — /api/ulke/portal/beslenme: the signed-in PATIENT keeps a short food-diary entry.
 *
 *   POST { gun, ogun, aciklama }
 *        200 { id }
 *        Forces kim=hasta. Uses the pack's portal.beslenme.gunlukAraci. Session supplies doctor + patient ids.
 *
 * Isolation: no doctor/patient id from the request body. aracKaydet matches the patient to the session's doctor.
 */
import { NextRequest } from 'next/server'
import { govdeOku } from '@/lib/ulke/uygulama/cevap'
import { portalOturum } from '@/lib/ulke/portal/giris'
import { PORTAL_KOD, portalCevabi, portalIstegiMi, portalSinirinda } from '@/lib/ulke/portal/rotaYardimcisi'
import { aktifAracIcerigi, aracKaydet } from '@/lib/ulke/araclar/kayit'
import { portalKoclukAyari } from '@/lib/ulke/portal/koclukAyari'
import { hekimRolunuOku } from '@/lib/ulke/uygulama/rol'
import { ozellikAcik, ulkePaketi } from '@/lib/ulke/ulke'

export const dynamic = 'force-dynamic'

const OGUNLER = new Set(['kahvalti', 'ogle', 'aksam', 'atistirmalik', 'diger'])

export const POST = portalSinirinda('portal beslenme POST', async (req: NextRequest) => {
  if (!ozellikAcik('hastaPortali') || !ozellikAcik('araclar')) return PORTAL_KOD.yok()
  if (!portalIstegiMi(req)) return PORTAL_KOD.gecersiz()
  const oturum = await portalOturum(req)
  if (!oturum) return PORTAL_KOD.oturumYok()
  const icerik = aktifAracIcerigi()
  if (!icerik) return PORTAL_KOD.yok()
  const rol = await hekimRolunuOku(oturum.supabase, oturum.doktorId)
  const ayar = portalKoclukAyari(ulkePaketi(), rol, icerik)
  if (!ayar) return PORTAL_KOD.yok()
  const g = await govdeOku(req)
  const gun = typeof g.gun === 'string' ? g.gun : ''
  const ogun = typeof g.ogun === 'string' ? g.ogun : ''
  const aciklama = typeof g.aciklama === 'string' ? g.aciklama.trim() : ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(gun) || !OGUNLER.has(ogun) || !aciklama) {
    return portalCevabi({ code: 'GECERSIZ' }, 400)
  }
  const r = await aracKaydet(
    oturum.supabase,
    oturum.doktorId,
    {
      hastaId: oturum.hastaId,
      arac: ayar.gunlukAraci,
      ham: { gun, ogun, aciklama, kim: 'hasta' },
    },
    icerik,
  )
  if (!r.tamam) {
    if (r.kod === 'NOT_FOUND' || r.kod === 'ARAC_YOK') return PORTAL_KOD.yok()
    return portalCevabi({ code: r.kod }, r.kod === 'EKSIK' ? 422 : 500)
  }
  return portalCevabi({ id: r.id })
})
