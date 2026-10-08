/**
 * NOTYA-UZ-RANDEVU-01 — GET /api/ulke/randevular: the caller's own appointments, for the calendar and a patient's file.
 *
 *   ?gun=<YYYY-MM-DD>[&gorunum=hafta]   the appointments that start on that day of the COUNTRY — or, with
 *                                       gorunum=hafta, in the week that day lies in (the week starts on the pack's
 *                                       first weekday). No `gun` = the country's today.
 *        200 { gunler: ['YYYY-MM-DD', …], bugun, randevular: [{ id, hastaId, hastaAdi, baslangic, bitis, gun, saat, sureDk, neden, durum, mesaiDisi, seansId }] }
 *        400 { code: 'GECERSIZ', alan: 'gun' }
 *   ?hasta=<hastaId>                    that patient's appointments from today on
 *        200 { randevular: [...] }
 *        404 { code: 'NOT_FOUND' }      no such patient FOR THIS DOCTOR (another doctor's patient: exactly the same)
 *
 *   401 { code: 'OTURUM_YOK' }   404 { code: 'NOT_FOUND' } (feature off)   500 { code: 'BASARISIZ' }
 *
 * PATIENT ISOLATION: the list is read by the authenticated doctor's id; a patient id from the address is matched
 * against that doctor (hastaGetir) BEFORE anything is read with it (lib/ulke/uygulama/randevular.ts).
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { ozellikAcik, ulkePaketi } from '@/lib/ulke/ulke'
import { cevap, KOD, uuidMi } from '@/lib/ulke/uygulama/cevap'
import { ulkeGunu } from '@/lib/ulke/uygulama/gun'
import { hastaGetir } from '@/lib/ulke/uygulama/hastalar'
import { hastaninRandevulari, randevulariListele } from '@/lib/ulke/uygulama/randevular'
import { gunCoz, gunEkle, haftaninIlkGunu } from '@/lib/ulke/uygulama/zaman'

export const dynamic = 'force-dynamic'

export const GET = sinirda('randevular GET', async (req: NextRequest) => {
  if (!ozellikAcik('cekirdekMuayene') || !ozellikAcik('randevu')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const p = req.nextUrl.searchParams
  const hastaHam = p.get('hasta')
  if (hastaHam !== null) {
    if (!uuidMi(hastaHam)) return KOD.yok()
    const hasta = await hastaGetir(oturum.supabase, oturum.user.id, hastaHam)
    if (!hasta) return KOD.yok()
    const randevular = await hastaninRandevulari(oturum.supabase, oturum.user.id, hasta.id)
    if (!randevular) return KOD.basarisiz()
    return cevap({ randevular })
  }
  const paket = ulkePaketi()
  const bugun = ulkeGunu()
  const gunHam = p.get('gun')
  const gun = gunHam === null || gunHam === '' ? bugun : gunCoz(gunHam, paket.bicim.tarihDeseni)
  if (!gun) return KOD.gecersiz('gun')
  const hafta = p.get('gorunum') === 'hafta'
  const ilkGun = hafta ? haftaninIlkGunu(gun, paket.bicim.haftaBasi) : gun
  const gunSayisi = hafta ? 7 : 1
  const randevular = await randevulariListele(oturum.supabase, oturum.user.id, ilkGun, gunSayisi)
  if (!randevular) return KOD.basarisiz()
  return cevap({ gunler: Array.from({ length: gunSayisi }, (_, i) => gunEkle(ilkGun, i)), bugun, randevular })
})
