/**
 * NOTYA-ULKE-KLINIK-01 — /api/ulke/klinik/uye: a member of the caller's own clinic.
 *
 *   PATCH  { hesapId, konum }   200 { ok: true }      the member's position is changed; EVERY GRANT given by or to
 *                                                     that member ends in the same step
 *   DELETE { hesapId }          200 { ok: true }      the member is removed — or leaves, where hesapId is the caller.
 *                                                     The membership and EVERY GRANT given by or to that member are
 *                                                     gone when this answers.
 *
 *   403 { code: 'YETKI_YOK' }   the caller may not do that to that member
 *   409 { code: 'SAHIP' }       the owner is not removed, and the owner's position is not changed and not given
 *   409 { code: 'AYNI' }        the member already holds that position
 *   400 { code: 'GECERSIZ', alan: 'konum' }
 *   404 { code: 'NOT_FOUND' }   the country has no clinic accounts; the caller is in no clinic; no such member IN THE
 *                               CALLER'S CLINIC (a member of another clinic: exactly the same); a malformed id
 *   401 { code: 'OTURUM_YOK' }  500 { code: 'BASARISIZ' }
 *
 * The one who asks is the authenticated account and the clinic is that account's own; who may act on whom is decided
 * inside the database function that acts (ulke_klinik_uye_cikar, ulke_klinik_konum_degistir).
 * NO PATIENT DATA is read or written here; a doctor who is removed keeps every one of their patients.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { cevap, govdeOku, KOD, uuidMi } from '@/lib/ulke/uygulama/cevap'
import { klinikAyarlari, konumDegistir, uyeCikar, type KlinikRetKodu } from '@/lib/ulke/klinikHesabi/klinik'

export const dynamic = 'force-dynamic'

const ret = (kod: KlinikRetKodu) => (kod === 'NOT_FOUND' ? KOD.yok() : kod === 'GECERSIZ' ? KOD.gecersiz('konum') : cevap({ code: kod }, kod === 'YETKI_YOK' ? 403 : kod === 'SAHIP' || kod === 'AYNI' ? 409 : 500))

export const PATCH = sinirda('klinik/uye PATCH', async (req: NextRequest) => {
  if (!klinikAyarlari()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.hesapId)) return KOD.yok()
  const r = await konumDegistir(oturum.supabase, oturum.user.id, g.hesapId, g.konum)
  return r.tamam ? cevap({ ok: true }) : ret(r.kod)
})

export const DELETE = sinirda('klinik/uye DELETE', async (req: NextRequest) => {
  if (!klinikAyarlari()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.hesapId)) return KOD.yok()
  const r = await uyeCikar(oturum.supabase, oturum.user.id, g.hesapId)
  return r.tamam ? cevap({ ok: true }) : ret(r.kod)
})
