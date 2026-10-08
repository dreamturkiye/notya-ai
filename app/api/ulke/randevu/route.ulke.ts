/**
 * NOTYA-UZ-RANDEVU-01 — /api/ulke/randevu: one appointment of the caller.
 *
 *   POST  { hastaId, gun, saat, sureDk, neden?, yineDe? }      books an appointment
 *         `gun` is a day as typed — the country's own pattern (DD.MM.YYYY) or YYYY-MM-DD; `saat` is 'HH:MM'.
 *         Both are the COUNTRY's wall clock (the pack's time zone), whatever the server's or the browser's zone is.
 *         200 { randevu }
 *         409 { code: 'DOLU' }                 the doctor already has an appointment in that time. NEVER overridable.
 *         422 { code: 'MESAI_DISI' }           outside the working hours: nothing was written. The same request with
 *                                              `yineDe: true` books it ("book anyway").
 *         400 { code: 'GECERSIZ', alan }       gun | saat | sure
 *   GET   ?id=<randevuId>
 *         200 { randevu: { id, hastaId, hastaAdi, hastaDili, baslangic, bitis, gun, saat, sureDk, neden, durum, mesaiDisi, seansId } }
 *   PATCH { id, durum }                                        arrived, done, did not come, cancelled, back to planned
 *         { id, gun, saat, sureDk, yineDe? }                   moves it (same answers as POST)
 *         200 { randevu }
 *         409 { code: 'GECIS_YOK' }            that change is not possible from the appointment's present status
 *
 *   404 { code: 'NOT_FOUND' }   no such appointment / patient FOR THIS DOCTOR (another doctor's: exactly the same),
 *                               a malformed id, or the feature is off
 *   401 { code: 'OTURUM_YOK' }  503 { code: 'HAZIR_DEGIL' }  500 { code: 'BASARISIZ' }
 *
 * PATIENT ISOLATION: the patient id and the appointment id come from the request; each is matched against the
 * authenticated doctor in the same query that reads or writes the row (lib/ulke/uygulama/randevular.ts).
 * Codes only — never a sentence: the screen shows its own pack's wording in the doctor's language.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { ozellikAcik, ulkePaketi } from '@/lib/ulke/ulke'
import { cevap, govdeOku, KOD, metinAlani, uuidMi } from '@/lib/ulke/uygulama/cevap'
import { NEDEN_AZAMI, randevuDurumDegistir, randevuDurumuMu, randevuGetir, randevuOlustur, randevuTasi, type RandevuRetKodu, type ZamanGirdisi } from '@/lib/ulke/uygulama/randevular'
import { RANDEVU_DURUMU } from '@/lib/ulke/uygulama/randevuDurumu'
import { gunCoz, saatCoz } from '@/lib/ulke/uygulama/zaman'

export const dynamic = 'force-dynamic'

const acik = () => ozellikAcik('cekirdekMuayene') && ozellikAcik('randevu')
const ret = (r: { kod: RandevuRetKodu; alan?: string }) => cevap({ code: r.kod, ...(r.alan ? { alan: r.alan } : {}) }, RANDEVU_DURUMU[r.kod])

/** The requested time from a body. A day that cannot be read becomes '' — refused further in as { alan: 'gun' }. */
function zamanAl(g: Record<string, unknown>): ZamanGirdisi {
  return { gun: gunCoz(g.gun, ulkePaketi().bicim.tarihDeseni) ?? '', saatDk: saatCoz(g.saat), sureDk: Number(g.sureDk), yineDe: g.yineDe === true }
}

export const POST = sinirda('randevu POST', async (req: NextRequest) => {
  if (!acik()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.hastaId)) return KOD.yok()
  const r = await randevuOlustur(oturum.supabase, oturum.user.id, { ...zamanAl(g), hastaId: g.hastaId, neden: metinAlani(g.neden, NEDEN_AZAMI) })
  if (!r.tamam) return ret(r)
  return cevap({ randevu: r.randevu })
})

export const GET = sinirda('randevu GET', async (req: NextRequest) => {
  if (!acik()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const id = req.nextUrl.searchParams.get('id')
  if (!uuidMi(id)) return KOD.yok()
  const randevu = await randevuGetir(oturum.supabase, oturum.user.id, id)
  if (!randevu) return KOD.yok()
  return cevap({ randevu })
})

export const PATCH = sinirda('randevu PATCH', async (req: NextRequest) => {
  if (!acik()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.id)) return KOD.yok()
  if (g.durum !== undefined) {
    if (!randevuDurumuMu(g.durum)) return KOD.gecersiz('durum')
    const r = await randevuDurumDegistir(oturum.supabase, oturum.user.id, g.id, g.durum)
    if (!r.tamam) return ret(r)
    return cevap({ randevu: r.randevu })
  }
  const r = await randevuTasi(oturum.supabase, oturum.user.id, g.id, zamanAl(g))
  if (!r.tamam) return ret(r)
  return cevap({ randevu: r.randevu })
})
