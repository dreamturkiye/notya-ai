/**
 * PREMATUR-ULKE-01 — /api/ulke/erken-dogum: an OBSTETRICS AND GYNAECOLOGY doctor's early-birth record of a pregnancy, and their
 * own list of such pregnancies.
 *
 *   GET    ?hasta=<id>   200 { hasta, e, bugun, depo }    e = { sat, tdt, cogulTipi, durum, kayit } as the doctor entered it
 *   GET                  200 { bugun, satirlar: [{ hastaId, ad, e }], depo }   the doctor's own pregnancies
 *   PUT    { hastaId, e } 200 as the first GET           the doctor enters the record (cleaned here with the screen's own function)
 *
 *   404 { code: 'NOT_FOUND' }   no such patient FOR THIS DOCTOR (another doctor's: exactly the same), a malformed id, a role
 *                               that has no such record, or a country that states no prematurity table
 *   400 { code: 'GECERSIZ', alan }   a value that cannot be kept (`alan` = the kind of problem; the screen words it)
 *   503 { code: 'DEPO_YOK' }    the tables are not on this database yet (a read answers `depo: false` instead)
 *   401 { code: 'OTURUM_YOK' }  500 { code: 'BASARISIZ' }
 *
 * A DOCTOR'S SESSION ONLY. No dose is accepted or kept; nothing is ordered or sent. The evaluation is the screen's own
 * calculation on what this route returns (lib/ulke/prematur/erkenDogum.ts), with the pack's thresholds.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { cevap, govdeOku, KOD, uuidMi } from '@/lib/ulke/uygulama/cevap'
import { aktifPrematurPaketi, gebelikKaydet, gebelikKohortu, gebelikOku } from '@/lib/ulke/prematur/kayit'

export const dynamic = 'force-dynamic'

const DURUM: Record<string, number> = { GECERSIZ: 400, DEPO_YOK: 503, BASARISIZ: 500 }

export const GET = sinirda('erken-dogum GET', async (req: NextRequest) => {
  if (!aktifPrematurPaketi()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  if (!req.nextUrl.searchParams.has('hasta')) {
    const k = await gebelikKohortu(oturum.supabase, oturum.user.id)
    return k ? cevap({ ...k }) : KOD.yok()
  }
  const id = req.nextUrl.searchParams.get('hasta')
  if (!uuidMi(id)) return KOD.yok()
  const y = await gebelikOku(oturum.supabase, oturum.user.id, id)
  return y ? cevap({ ...y }) : KOD.yok()
})

export const PUT = sinirda('erken-dogum PUT', async (req: NextRequest) => {
  if (!aktifPrematurPaketi()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.hastaId)) return KOD.yok()
  const r = await gebelikKaydet(oturum.supabase, oturum.user.id, g.hastaId, g.e)
  if (!r.tamam) return r.kod === 'NOT_FOUND' ? KOD.yok() : cevap({ code: r.kod, ...(r.alan ? { alan: r.alan } : {}) }, DURUM[r.kod] ?? 500)
  return cevap({ ...r.yuk })
})
