/**
 * NOTYA-ULKE-KLINIK-01 — GET /api/ulke/klinik/takvim: THE CLINIC'S SCHEDULE, for its owner and an administrator.
 *
 *   GET ?gun=<gun>&gorunum=gun|hafta
 *       200 { gunler, bugun, hekimler: [{ hekimId, ad }], dilimler: [{ hekimId, baslangic, bitis, gun, saat, sureDk, durum }] }
 *
 *   404 { code: 'NOT_FOUND' }   the country has no clinic accounts or no appointments; the caller is in no clinic,
 *                               or is not its owner or an administrator
 *   400 { code: 'GECERSIZ', alan: 'gun' }   401 { code: 'OTURUM_YOK' }   500 { code: 'BASARISIZ' }
 *
 * BY POSITION, THEREFORE WITHOUT ANY PATIENT. A slot says whose it is, when, and its status — NOT who the patient
 * is, not the patient's id, not the reason. No id is read from the request: the clinic is the caller's own, and the
 * members are that clinic's. Nothing here is a way to a patient (lib/ulke/klinikHesabi/onBuro.ts → klinikTakvimi
 * builds each slot from four columns; the test asserts on the keys).
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { ozellikAcik, ulkePaketi } from '@/lib/ulke/ulke'
import { cevap, KOD } from '@/lib/ulke/uygulama/cevap'
import { ulkeGunu } from '@/lib/ulke/uygulama/gun'
import { hesapSaatDilimi } from '@/lib/ulke/uygulama/saatDilimi'
import { gunCoz, gunEkle, haftaninIlkGunu } from '@/lib/ulke/uygulama/zaman'
import { klinikAyarlari } from '@/lib/ulke/klinikHesabi/klinik'
import { klinikTakvimi } from '@/lib/ulke/klinikHesabi/onBuro'

export const dynamic = 'force-dynamic'

export const GET = sinirda('klinik/takvim GET', async (req: NextRequest) => {
  if (!klinikAyarlari() || !ozellikAcik('randevu')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const p = req.nextUrl.searchParams
  const paket = ulkePaketi()
  const bugun = ulkeGunu(new Date(), await hesapSaatDilimi(oturum.supabase, oturum.user.id))
  const gunHam = p.get('gun')
  const gun = gunHam === null || gunHam === '' ? bugun : gunCoz(gunHam, paket.bicim.tarihDeseni)
  if (!gun) return KOD.gecersiz('gun')
  const hafta = p.get('gorunum') === 'hafta'
  const ilkGun = hafta ? haftaninIlkGunu(gun, paket.bicim.haftaBasi) : gun
  const gunSayisi = hafta ? 7 : 1
  const t = await klinikTakvimi(oturum.supabase, oturum.user.id, ilkGun, gunSayisi)
  if (!t) return KOD.yok()
  return cevap({ gunler: Array.from({ length: gunSayisi }, (_, i) => gunEkle(ilkGun, i)), bugun, hekimler: t.hekimler, dilimler: t.dilimler })
})
