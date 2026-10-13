/**
 * NOTYA-ULKE-MESAJ-01 — /api/ulke/konsultasyon: consultation between doctors of the same country database.
 *
 *   GET    ?gorunum=giden[&hasta=<hastaId>]   200 { konsultasyonlar: [GidenKonsultasyon] }
 *                                             what THIS doctor asked — all of it, or about one of their patients
 *   GET    ?gorunum=gelen                     200 { konsultasyonlar: [GelenKonsultasyon] }
 *                                             what THIS doctor was asked and may still read. NO PATIENT in the answer.
 *   GET    ?gorunum=kod                       200 { kod: string | null }     this account's own consultation code
 *   GET    ?gorunum=notlar&hasta=<hastaId>    200 { notlar: [{ notId, gun, ozetVar }] }
 *                                             the approved notes of that patient that can be shared (ids and days)
 *   POST   { islem: 'kod' }                   200 { kod }                    a new code; the old one finds nobody
 *   POST   { islem: 'bul', kod }              200 { meslektas: { ad, rol } } the colleague an EXACT code names
 *   POST   { islem: 'iste', hastaId, kod, soru, paylasimTuru: 'yok' | 'not' | 'ozet', notId?, riza: true }
 *                                             200 { id }
 *   PATCH  { id, islem: 'okundu' }            200 { ok: true }   the CONSULTED doctor opened it (recorded once)
 *   PATCH  { id, islem: 'cevap', cevap }      200 { ok: true }   the CONSULTED doctor answers, once, while it is open
 *   PATCH  { id, islem: 'kapat' }             200 { ok: true }   the ASKING doctor closes it, once
 *
 *   404 { code: 'NOT_FOUND' }       no such patient or consultation FOR THIS DOCTOR IN THIS PART — another doctor's,
 *                                   a consultation whose period is over (for the consulted doctor), the asking
 *                                   doctor's id on the consulted doctor's actions and the reverse: all exactly the
 *                                   same; a malformed id; or the country has no consultation
 *   404 { code: 'MESLEKTAS_YOK' }   the code names nobody (malformed, unknown, replaced, or the caller's own)
 *   400 { code: 'RIZA_GEREKLI' | 'SORU_GEREKLI' | 'CEVAP_GEREKLI' | 'UZUN' | 'PAYLASIM' | 'GECERSIZ' }
 *   409 { code: 'NOT_UYGUN' }       the note is not an approved note of that patient
 *   409 { code: 'OZET_YOK' }        that note has no summary for the patient
 *   409 { code: 'DURUM' }           already answered, or already closed
 *   429 { code: 'LIMIT' }           401 { code: 'OTURUM_YOK' }     500 { code: 'BASARISIZ' }
 *
 * A DOCTOR'S SESSION ONLY. THERE IS NO DIRECTORY: no method lists accounts or codes, and none searches by name.
 * PATIENT ISOLATION: a patient id is matched against the authenticated doctor before anything is read or written
 * with it; the consulted doctor is given the consultation's own copy and nothing of the patient
 * (lib/ulke/konsultasyon/konsultasyon.ts). Nothing is sent to anybody, and no model is called.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { cevap, govdeOku, KOD, uuidMi } from '@/lib/ulke/uygulama/cevap'
import { gelenKonsultasyonlar, gidenKonsultasyonlar, kodumuOku, kodUret, KONSULTASYON_DURUMU, konsultasyonAcik, konsultasyonCevapla, konsultasyonIste, konsultasyonKapat, konsultasyonOkundu, meslektasBul, paylasilabilirNotlar, type KonsultasyonRetKodu } from '@/lib/ulke/konsultasyon/konsultasyon'

export const dynamic = 'force-dynamic'

const ret = (kod: KonsultasyonRetKodu) => (kod === 'NOT_FOUND' ? KOD.yok() : cevap({ code: kod }, KONSULTASYON_DURUMU[kod]))

export const GET = sinirda('konsultasyon GET', async (req: NextRequest) => {
  if (!konsultasyonAcik()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const s = req.nextUrl.searchParams
  const gorunum = s.get('gorunum')
  if (gorunum === 'kod') return cevap({ kod: await kodumuOku(oturum.supabase, oturum.user.id) })
  if (gorunum === 'gelen') return cevap({ konsultasyonlar: await gelenKonsultasyonlar(oturum.supabase, oturum.user.id) })
  if (gorunum === 'giden') {
    const hasta = s.get('hasta')
    if (hasta !== null && !uuidMi(hasta)) return KOD.yok()
    const liste = await gidenKonsultasyonlar(oturum.supabase, oturum.user.id, hasta ?? undefined)
    return liste ? cevap({ konsultasyonlar: liste }) : KOD.yok()
  }
  if (gorunum === 'notlar') {
    const hasta = s.get('hasta')
    if (!uuidMi(hasta)) return KOD.yok()
    const notlar = await paylasilabilirNotlar(oturum.supabase, oturum.user.id, hasta)
    return notlar ? cevap({ notlar }) : KOD.yok()
  }
  return KOD.gecersiz('gorunum')
})

export const POST = sinirda('konsultasyon POST', async (req: NextRequest) => {
  if (!konsultasyonAcik()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (g.islem === 'kod') {
    const r = await kodUret(oturum.supabase, oturum.user.id)
    return r.tamam ? cevap({ kod: r.kod }) : ret(r.kod)
  }
  if (g.islem === 'bul') {
    const meslektas = await meslektasBul(oturum.supabase, oturum.user.id, g.kod)
    return meslektas ? cevap({ meslektas }) : ret('MESLEKTAS_YOK')
  }
  if (g.islem === 'iste') {
    if (!uuidMi(g.hastaId)) return KOD.yok()
    if (g.notId !== undefined && g.notId !== null && !uuidMi(g.notId)) return ret('NOT_UYGUN')
    const r = await konsultasyonIste(oturum.supabase, oturum.user.id, { hastaId: g.hastaId, kod: g.kod, soru: g.soru, paylasimTuru: g.paylasimTuru, notId: g.notId ?? null, riza: g.riza })
    return r.tamam ? cevap({ id: r.id }) : ret(r.kod)
  }
  return KOD.gecersiz('islem')
})

export const PATCH = sinirda('konsultasyon PATCH', async (req: NextRequest) => {
  if (!konsultasyonAcik()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (g.islem !== 'okundu' && g.islem !== 'cevap' && g.islem !== 'kapat') return KOD.gecersiz('islem')
  if (!uuidMi(g.id)) return KOD.yok()
  const r = g.islem === 'okundu' ? await konsultasyonOkundu(oturum.supabase, oturum.user.id, g.id) : g.islem === 'cevap' ? await konsultasyonCevapla(oturum.supabase, oturum.user.id, g.id, g.cevap) : await konsultasyonKapat(oturum.supabase, oturum.user.id, g.id)
  return r.tamam ? cevap({ ok: true }) : ret(r.kod)
})
