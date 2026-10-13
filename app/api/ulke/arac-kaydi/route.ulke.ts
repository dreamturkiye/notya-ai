/**
 * NOTYA-ULKE-ARACLAR-01 — /api/ulke/arac-kaydi: a DOCTOR keeps a tool's result on a patient, reads a patient's kept
 * results, and reads and closes their own follow-ups.
 *
 *   GET    ?hasta=<hastaId>     200 { kayitlar: [{ id, arac, olusturuldu, gun, takipTarihi, kapandi, girdiler, sonuc }] }
 *                               the kept results of that patient, newest first
 *   GET                         200 { bugun, takipler: [{ id, hastaId, hastaAdi, arac, takipTarihi, gecikti }] }
 *                               the doctor's open follow-ups, earliest first
 *   POST   { hastaId, arac, ham, takipTarihi? }
 *                               200 { id }
 *                               `ham` is the tool's form as it was typed. THE SERVER WORKS THE RESULT OUT AGAIN and
 *                               keeps its own; a result in the body is not read. `takipTarihi` is the day the doctor
 *                               entered ('YYYY-MM-DD'), or absent.
 *   PATCH  { kayitId, islem: 'kapat' }
 *                               200 { ok: true }     the follow-up is marked done, once
 *
 *   404 { code: 'NOT_FOUND' }   no such patient or record FOR THIS DOCTOR (another doctor's: exactly the same), a
 *                               malformed id, or the country has no tools area
 *   404 { code: 'ARAC_YOK' }    not a tool this account may open (another role's, a tool the pack does not list)
 *   422 { code: 'EKSIK' }       the form does not give a result
 *   422 { code: 'TAKIP' }       the follow-up day is not a day from today on
 *   409 { code: 'DURUM' }       the record has no follow-up, or it is already closed
 *   401 { code: 'OTURUM_YOK' }  500 { code: 'BASARISIZ' }
 *
 * A DOCTOR'S SESSION ONLY (the bearer token of the sign-in service). PATIENT ISOLATION: every id from the request is
 * matched against the authenticated doctor before anything is read or written with it (lib/ulke/araclar/kayit.ts).
 * NOTHING IS SENT TO ANYBODY from here.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { cevap, govdeOku, KOD, uuidMi } from '@/lib/ulke/uygulama/cevap'
import { aktifAracIcerigi, aracKaydet, hastaninAracKayitlari, takipKapat, takipListesi } from '@/lib/ulke/araclar/kayit'

export const dynamic = 'force-dynamic'

const DURUM: Record<string, number> = { ARAC_YOK: 404, EKSIK: 422, TAKIP: 422, DURUM: 409, BASARISIZ: 500 }

export const GET = sinirda('arac-kaydi GET', async (req: NextRequest) => {
  if (!aktifAracIcerigi()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  if (!req.nextUrl.searchParams.has('hasta')) return cevap(await takipListesi(oturum.supabase, oturum.user.id))
  const id = req.nextUrl.searchParams.get('hasta')
  if (!uuidMi(id)) return KOD.yok()
  const kayitlar = await hastaninAracKayitlari(oturum.supabase, oturum.user.id, id)
  if (!kayitlar) return KOD.yok()
  return cevap({ kayitlar })
})

export const POST = sinirda('arac-kaydi POST', async (req: NextRequest) => {
  const icerik = aktifAracIcerigi()
  if (!icerik) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.hastaId)) return KOD.yok()
  const r = await aracKaydet(oturum.supabase, oturum.user.id, { hastaId: g.hastaId, arac: g.arac, ham: g.ham, takipTarihi: g.takipTarihi }, icerik)
  if (!r.tamam) return r.kod === 'NOT_FOUND' ? KOD.yok() : cevap({ code: r.kod }, DURUM[r.kod] ?? 500)
  return cevap({ id: r.id })
})

export const PATCH = sinirda('arac-kaydi PATCH', async (req: NextRequest) => {
  if (!aktifAracIcerigi()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.kayitId)) return KOD.yok()
  if (g.islem !== 'kapat') return KOD.gecersiz('islem')
  const r = await takipKapat(oturum.supabase, oturum.user.id, g.kayitId)
  if (!r.tamam) return r.kod === 'NOT_FOUND' ? KOD.yok() : cevap({ code: r.kod }, DURUM[r.kod] ?? 500)
  return cevap({ ok: true })
})
