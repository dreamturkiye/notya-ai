/**
 * PREMATUR-ULKE-01 — /api/ulke/prematur: a PAEDIATRIC doctor's record of a preterm baby, and their own list of such babies.
 *
 *   GET    ?hasta=<id>   200 { hasta, profil, durumlar, bugun, depo }   the baby's history and the doctor's marks
 *   GET                  200 { bugun, satirlar: [{ hastaId, ad, dogumTarihi, profil, durumlar }], depo }   the doctor's own babies
 *   PUT    { hastaId, profil }                              200 as the first GET     the doctor enters the history
 *   POST   { hastaId, ogeId, durum, tarih?, not? }          200 as the first GET     the doctor's mark on one plan item;
 *                                                           `durum` null takes the mark off
 *
 *   404 { code: 'NOT_FOUND' }   no such patient FOR THIS DOCTOR (another doctor's: exactly the same), a malformed id, a role
 *                               that has no such record, or a country that states no prematurity table
 *   400 { code: 'GECERSIZ' }    the mark is not an item of the table, or not a state / a day that can be kept
 *   503 { code: 'DEPO_YOK' }    the tables are not on this database yet (a read answers `depo: false` instead)
 *   401 { code: 'OTURUM_YOK' }  500 { code: 'BASARISIZ' }
 *
 * A DOCTOR'S SESSION ONLY. Nothing is worked out here and nothing is sent to anybody: the plan is the screen's own calculation
 * on what this route returns (lib/ulke/prematur/plan.ts), with the pack's table.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { cevap, govdeOku, KOD, uuidMi } from '@/lib/ulke/uygulama/cevap'
import { aktifPrematurPaketi, bebekKohortu, bebekOgeIsaretle, bebekOku, bebekProfiliKaydet } from '@/lib/ulke/prematur/kayit'
import { izinliOgeKimlikleri } from '@/lib/ulke/prematur/plan'

export const dynamic = 'force-dynamic'

const DURUM: Record<string, number> = { GECERSIZ: 400, DEPO_YOK: 503, BASARISIZ: 500 }

export const GET = sinirda('prematur GET', async (req: NextRequest) => {
  if (!aktifPrematurPaketi()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  if (!req.nextUrl.searchParams.has('hasta')) {
    const k = await bebekKohortu(oturum.supabase, oturum.user.id)
    return k ? cevap({ ...k }) : KOD.yok()
  }
  const id = req.nextUrl.searchParams.get('hasta')
  if (!uuidMi(id)) return KOD.yok()
  const y = await bebekOku(oturum.supabase, oturum.user.id, id)
  return y ? cevap({ ...y }) : KOD.yok()
})

export const PUT = sinirda('prematur PUT', async (req: NextRequest) => {
  if (!aktifPrematurPaketi()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.hastaId)) return KOD.yok()
  const r = await bebekProfiliKaydet(oturum.supabase, oturum.user.id, g.hastaId, g.profil)
  if (!r.tamam) return r.kod === 'NOT_FOUND' ? KOD.yok() : cevap({ code: r.kod }, DURUM[r.kod] ?? 500)
  return cevap({ ...r.yuk })
})

export const POST = sinirda('prematur POST', async (req: NextRequest) => {
  const paket = aktifPrematurPaketi()
  if (!paket) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.hastaId)) return KOD.yok()
  const r = await bebekOgeIsaretle(oturum.supabase, oturum.user.id, { hastaId: g.hastaId, ogeId: g.ogeId, durum: g.durum ?? null, tarih: g.tarih, not: g.not }, izinliOgeKimlikleri(paket.protokol))
  if (!r.tamam) return r.kod === 'NOT_FOUND' ? KOD.yok() : cevap({ code: r.kod }, DURUM[r.kod] ?? 500)
  return cevap({ ...r.yuk })
})
