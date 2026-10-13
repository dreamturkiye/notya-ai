/**
 * NOTYA-ULKE-KLINIK-01 — /api/ulke/klinik/davet: invitations to the caller's own clinic.
 *
 *   POST   { konum }     200 { davetId, kod, konum, sonGecerlilik }   THE CODE IS ANSWERED THIS ONCE; only its hash is kept
 *                        403 { code: 'YETKI_YOK' }                    the caller may not issue that invitation
 *                        400 { code: 'GECERSIZ', alan: 'konum' }      not a position an invitation can give (the owner's never)
 *   DELETE { davetId }   200 { ok: true }                             withdraws an invitation that was not used
 *
 *   404 { code: 'NOT_FOUND' }   the country has no clinic accounts; the caller is in no clinic; no such invitation
 *                               IN THE CALLER'S CLINIC (another clinic's: exactly the same); or not theirs to withdraw
 *   401 { code: 'OTURUM_YOK' }  503 { code: 'HAZIR_DEGIL' }  500 { code: 'BASARISIZ' }
 *
 * Who may issue what is the database's rule (the trigger of ulke_klinik_davetleri): the owner any position but the
 * owner's; an administrator a doctor's, an allied professional's or the front desk's; nobody else anything.
 * NO CLINIC ID IS READ FROM THE REQUEST. NO PATIENT DATA.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { cevap, govdeOku, KOD, uuidMi } from '@/lib/ulke/uygulama/cevap'
import { davetIptal, davetVer, klinikAyarlari } from '@/lib/ulke/klinikHesabi/klinik'

export const dynamic = 'force-dynamic'

export const POST = sinirda('klinik/davet POST', async (req: NextRequest) => {
  if (!klinikAyarlari()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  const r = await davetVer(oturum.supabase, oturum.user.id, g.konum)
  if (!r.tamam) {
    if (r.kod === 'NOT_FOUND') return KOD.yok()
    if (r.kod === 'GECERSIZ') return KOD.gecersiz('konum')
    return cevap({ code: r.kod }, r.kod === 'YETKI_YOK' ? 403 : r.kod === 'HAZIR_DEGIL' ? 503 : 500)
  }
  return cevap({ davetId: r.davetId, kod: r.kod, konum: r.konum, sonGecerlilik: r.sonGecerlilik })
})

export const DELETE = sinirda('klinik/davet DELETE', async (req: NextRequest) => {
  if (!klinikAyarlari()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.davetId)) return KOD.yok()
  const r = await davetIptal(oturum.supabase, oturum.user.id, g.davetId)
  if (!r.tamam) return r.kod === 'NOT_FOUND' ? KOD.yok() : KOD.basarisiz()
  return cevap({ ok: true })
})
