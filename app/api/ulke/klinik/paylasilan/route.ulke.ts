/**
 * NOTYA-ULKE-KLINIK-01 — GET /api/ulke/klinik/paylasilan: what was SHARED WITH the caller (an allied professional:
 * one named patient) and what the caller COVERS (another doctor's patients, for a stated period). READ-ONLY.
 *
 *   GET                               200 { paylasilanlar: [{ yetkiId, tur, hekimId, hekimAdi, hastaId, bitis }] }
 *   GET ?hekim=<id>&hasta=<id>&kart=1 200 { hasta: HASTA }                    who the patient is
 *   GET ?hekim=<id>&hasta=<id>        200 { hasta: HASTA, notlar: [NOT] }     the patient's APPROVED notes, newest first
 *   GET ?hekim=<id>&q=<text>          200 { hastalar: [HASTA] }               COVER only; at least 2 characters
 *                                     400 { code: 'ARAMA_KISA' }
 *   GET ?hekim=<id>&gun=<gun>&gorunum= 200 { gunler, bugun, randevular: [RANDEVU] }   COVER only
 *
 *   HASTA   = { id, ad, otaIsmi, dogumTarihi }
 *   NOT     = { notId, muayeneTarihi, onayTarihi, dil, sablon, icerik: { s, o, a, p, alanlar? }, alanAnahtarlari }
 *   RANDEVU = { id, hastaId, hastaAdi, baslangic, bitis, gun, saat, sureDk, neden, durum }
 *
 *   404 { code: 'NOT_FOUND' }   the country has no clinic accounts; the caller holds NO share of that patient and no
 *                               cover of that doctor NOW — never given, withdrawn, the period not begun or over, the
 *                               caller or the doctor removed, another clinic, another country, a role that may not
 *                               hold it; the patient is not THAT DOCTOR's; a malformed id. One answer for all.
 *   401 { code: 'OTURUM_YOK' }  500 { code: 'BASARISIZ' }
 *
 * THERE IS NO POST, PATCH OR DELETE: nothing is written to a patient through a share or cover. A covering doctor
 * records a visit only for their own patients, on their own routes.
 * PATIENT ISOLATION: the doctor is accepted only through THE CHECK for the authenticated account, on every request;
 * the patient and each note are then proven to be THAT DOCTOR's by the doctor's own library. NEVER ANSWERED: a note
 * that is not approved, a second-language draft, a transcript, a recording, an intake form, a tool record, a summary
 * for the patient, a phone number or an identity number. Every read is written to the doctor's record first.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { ozellikAcik, ulkePaketi } from '@/lib/ulke/ulke'
import { cevap, KOD, uuidMi } from '@/lib/ulke/uygulama/cevap'
import { ulkeGunu } from '@/lib/ulke/uygulama/gun'
import { hesapSaatDilimi } from '@/lib/ulke/uygulama/saatDilimi'
import { gunCoz, gunEkle, haftaninIlkGunu } from '@/lib/ulke/uygulama/zaman'
import { klinikAyarlari } from '@/lib/ulke/klinikHesabi/klinik'
import { paylasilanHasta, paylasilanlar, paylasilanNotlar, vekaletHastaAra, vekaletRandevulari } from '@/lib/ulke/klinikHesabi/paylasim'

export const dynamic = 'force-dynamic'

export const GET = sinirda('klinik/paylasilan GET', async (req: NextRequest) => {
  if (!klinikAyarlari()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const p = req.nextUrl.searchParams
  const ben = oturum.user.id
  if (!p.has('hekim')) return cevap({ paylasilanlar: await paylasilanlar(oturum.supabase, ben) })
  const hekim = p.get('hekim')
  if (!uuidMi(hekim)) return KOD.yok()
  if (p.has('hasta')) {
    const hastaId = p.get('hasta')
    if (!uuidMi(hastaId)) return KOD.yok()
    if (p.get('kart') === '1') {
      const hasta = await paylasilanHasta(oturum.supabase, ben, hekim, hastaId)
      return hasta ? cevap({ hasta }) : KOD.yok()
    }
    const r = await paylasilanNotlar(oturum.supabase, ben, hekim, hastaId)
    return r ? cevap({ hasta: r.hasta, notlar: r.notlar }) : KOD.yok()
  }
  if (p.has('q')) {
    const r = await vekaletHastaAra(oturum.supabase, ben, hekim, String(p.get('q') ?? '').slice(0, 120))
    if (!r.tamam) return r.kod === 'NOT_FOUND' ? KOD.yok() : r.kod === 'ARAMA_KISA' ? cevap({ code: 'ARAMA_KISA' }, 400) : KOD.basarisiz()
    return cevap({ hastalar: r.hastalar })
  }
  if (!ozellikAcik('randevu')) return KOD.yok()
  const paket = ulkePaketi()
  const bugun = ulkeGunu(new Date(), await hesapSaatDilimi(oturum.supabase, ben))
  const gunHam = p.get('gun')
  const gun = gunHam === null || gunHam === '' ? bugun : gunCoz(gunHam, paket.bicim.tarihDeseni)
  if (!gun) return KOD.gecersiz('gun')
  const hafta = p.get('gorunum') === 'hafta'
  const ilkGun = hafta ? haftaninIlkGunu(gun, paket.bicim.haftaBasi) : gun
  const gunSayisi = hafta ? 7 : 1
  const randevular = await vekaletRandevulari(oturum.supabase, ben, hekim, ilkGun, gunSayisi)
  if (!randevular) return KOD.yok()
  return cevap({ gunler: Array.from({ length: gunSayisi }, (_, i) => gunEkle(ilkGun, i)), bugun, randevular })
})
