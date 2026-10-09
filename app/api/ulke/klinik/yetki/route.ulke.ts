/**
 * NOTYA-ULKE-KLINIK-01 — /api/ulke/klinik/yetki: GRANTS — "who can help with my patients".
 *
 *   GET      200 { verilen: [{ id, tur, hekimId, alanId, alanAdi, hastaId, hastaAdi, baslangic, bitis, kaydedenId, olusturuldu, iptal, gecerli }],
 *                  alinan:  [{ id, tur, hekimId, hekimAdi, alanId, hastaId, baslangic, bitis, kaydedenId, olusturuldu, iptal, gecerli }] }
 *            `verilen`: every grant about THE CALLER's patients, standing or ended. `alinan`: the grants the caller
 *            holds that open something now — with NOTHING of a patient but the id a share itself names.
 *   POST   { alanId, tur, hastaId?, baslangicGun?, bitisGun?, hekimId? }
 *            200 { yetkiId, yeni }          `yeni` false = the same grant already stood
 *            `hekimId` (the doctor whose patients it is about) is the caller unless the country's pack lets the
 *            clinic's OWNER enter a grant for a doctor — otherwise 403 { code: 'YETKI_YOK' }
 *            409 { code: 'KONUM' }          the capability is not given to a member in that position
 *            409 { code: 'ROL' }            the member does not work in a role that may hold it
 *            409 { code: 'TUR_KAPALI' }     the country has not switched that capability on
 *            400 { code: 'GECERSIZ', alan } tur | hastaId | baslangicGun | bitisGun
 *   DELETE { yetkiId }
 *            200 { ok: true }               withdrawn: it opens nothing from the next request on
 *            409 { code: 'AYNI' }           it was already withdrawn
 *
 *   404 { code: 'NOT_FOUND' }   the country has no clinic accounts; the caller is in no clinic; the member is not in
 *                               THE CALLER'S clinic; the patient is not THE DOCTOR's; no such grant FOR THE CALLER
 *                               (somebody else's: exactly the same); a malformed id
 *   401 { code: 'OTURUM_YOK' }  500 { code: 'BASARISIZ' }
 *
 * PATIENT ISOLATION: a share names a patient id from the request; it is proven to be the granting doctor's
 * (hastaGetir: id and doctor in one query) before anything is written, and again by the grant's own key. A grant id
 * from the request is matched against the caller inside the function that withdraws it. The lists are read by the
 * caller's own id; a shared patient's name is read by doctor AND patient id.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { cevap, govdeOku, KOD, uuidMi } from '@/lib/ulke/uygulama/cevap'
import { klinikAyarlari } from '@/lib/ulke/klinikHesabi/klinik'
import { alinanYetkiler, verilenYetkiler, yetkiGeriAl, yetkiVer } from '@/lib/ulke/klinikHesabi/yetki'

export const dynamic = 'force-dynamic'

export const GET = sinirda('klinik/yetki GET', async (req: NextRequest) => {
  if (!klinikAyarlari()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const [verilen, alinan] = await Promise.all([verilenYetkiler(oturum.supabase, oturum.user.id), alinanYetkiler(oturum.supabase, oturum.user.id)])
  return cevap({ verilen, alinan })
})

export const POST = sinirda('klinik/yetki POST', async (req: NextRequest) => {
  if (!klinikAyarlari()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.alanId)) return KOD.yok()
  if (g.hekimId !== undefined && g.hekimId !== null && !uuidMi(g.hekimId)) return KOD.yok()
  if (g.hastaId !== undefined && g.hastaId !== null && !uuidMi(g.hastaId)) return KOD.yok()
  const r = await yetkiVer(oturum.supabase, oturum.user.id, { hekimId: (g.hekimId as string | null | undefined) ?? null, alanId: g.alanId, tur: g.tur, hastaId: (g.hastaId as string | null | undefined) ?? null, baslangicGun: g.baslangicGun, bitisGun: g.bitisGun })
  if (!r.tamam) {
    if (r.kod === 'NOT_FOUND') return KOD.yok()
    if (r.kod === 'GECERSIZ') return KOD.gecersiz(r.alan)
    return cevap({ code: r.kod }, r.kod === 'YETKI_YOK' ? 403 : r.kod === 'BASARISIZ' ? 500 : 409)
  }
  return cevap({ yetkiId: r.yetkiId, yeni: r.yeni })
})

export const DELETE = sinirda('klinik/yetki DELETE', async (req: NextRequest) => {
  if (!klinikAyarlari()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.yetkiId)) return KOD.yok()
  const r = await yetkiGeriAl(oturum.supabase, oturum.user.id, g.yetkiId)
  if (!r.tamam) return r.kod === 'NOT_FOUND' ? KOD.yok() : r.kod === 'AYNI' ? cevap({ code: 'AYNI' }, 409) : KOD.basarisiz()
  return cevap({ ok: true })
})
