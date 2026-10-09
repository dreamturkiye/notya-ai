/**
 * NOTYA-ULKE-KLINIK-01 — /api/ulke/klinik/on-buro: THE FRONT-DESK WORKSPACE. What a front-desk member of a clinic
 * does for the doctors who gave them a grant, and nothing else.
 *
 *   GET                                  200 { hekimler: [{ hekimId, ad, yetkiler: [tur] }] }     who gave the caller what
 *   GET ?hekim=<id>&gun=<gun>&gorunum=   200 { gunler, bugun, randevular: [RANDEVU] }             needs on-buro-randevu
 *   GET ?hekim=<id>&q=<text>             200 { hastalar: [KART] }                                 needs on-buro-randevu
 *                                        400 { code: 'ARAMA_KISA' }      fewer than 2 characters: there is no "all patients"
 *   GET ?hekim=<id>&hasta=<id>           200 { hasta: KART }                                      needs on-buro-randevu
 *   POST { hekimId, islem: 'hasta', ad, otaIsmi?, dogumTarihi?, cinsiyet?, telefon?, dil }
 *                                        200 { hasta: KART }                                      needs on-buro-hasta
 *   POST { hekimId, islem: 'randevu', hastaId, gun, saat, sureDk, yineDe? }
 *                                        200 { randevu: RANDEVU }  409 DOLU · 422 MESAI_DISI · 400 GECERSIZ
 *                                                                                                 needs on-buro-randevu
 *   POST { hekimId, islem: 'portal', hastaId }
 *                                        200 { yol, pin, sonGecerlilik }   shown this once        needs on-buro-portal
 *   POST { hekimId, islem: 'form', hastaId, randevuId? }
 *                                        200 { yeniForm, erisim, davetDili, yol?, pin? }          needs on-buro-portal
 *   PATCH { hekimId, randevuId, durum }  or  { hekimId, randevuId, gun, saat, sureDk, yineDe? }
 *                                        200 { randevu: RANDEVU }  409 GECIS_YOK / DOLU           needs on-buro-randevu
 *
 *   KART    = { id, ad, otaIsmi, dogumTarihi, telefon }                                     AND NOTHING ELSE
 *   RANDEVU = { id, hastaId, hastaAdi, baslangic, bitis, gun, saat, sureDk, durum, mesaiDisi }   AND NOTHING ELSE
 *
 *   404 { code: 'NOT_FOUND' }   the country has no clinic accounts (or no appointments / portal / intake form for
 *                               that part); the caller holds NO GRANT of that capability from that doctor NOW —
 *                               never given, withdrawn, the caller or the doctor removed from the clinic, another
 *                               clinic, another country; the patient or the appointment is not THAT DOCTOR's; a
 *                               malformed id. One answer for all of them.
 *   401 { code: 'OTURUM_YOK' }  503 { code: 'HAZIR_DEGIL' }  500 { code: 'BASARISIZ' }
 *
 * PATIENT ISOLATION. `hekim` / `hekimId`, `hasta` / `hastaId` and `randevuId` come from the request. The doctor is
 * accepted only through THE CHECK (lib/ulke/klinikHesabi/yetki.ts → yetkiBul) for the authenticated account, on
 * every request; the patient and the appointment are then proven to be THAT DOCTOR's by the doctor's own library
 * (id and doctor in one query). EVERY read and write here is written to the doctor's record before it happens.
 * NEVER ANSWERED: a note, a transcript, a visit, an intake answer, a tool record, a summary, an appointment's
 * reason, a patient's sex, language or identity number (lib/ulke/klinikHesabi/onBuro.ts builds every answer field
 * by field; the test asserts on the keys).
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { ozellikAcik, ulkePaketi } from '@/lib/ulke/ulke'
import { cevap, govdeOku, KOD, metinAlani, uuidMi } from '@/lib/ulke/uygulama/cevap'
import { ulkeGunu } from '@/lib/ulke/uygulama/gun'
import { aktifFormIcerigi } from '@/lib/ulke/intake/icerik'
import { portalAcik } from '@/lib/ulke/portal/giris'
import { randevuDurumuMu, type ZamanGirdisi } from '@/lib/ulke/uygulama/randevular'
import { RANDEVU_DURUMU } from '@/lib/ulke/uygulama/randevuDurumu'
import { hesapSaatDilimi } from '@/lib/ulke/uygulama/saatDilimi'
import { gunCoz, gunEkle, haftaninIlkGunu, saatCoz } from '@/lib/ulke/uygulama/zaman'
import { klinikAyarlari } from '@/lib/ulke/klinikHesabi/klinik'
import { onBuroFormIste, onBuroHastaAra, onBuroHastaKarti, onBuroHastaOlustur, onBuroHekimleri, onBuroPortalVer, onBuroRandevuDegistir, onBuroRandevulari, onBuroRandevuOlustur, type OnBuroRetKodu } from '@/lib/ulke/klinikHesabi/onBuro'

export const dynamic = 'force-dynamic'

const randevuAcik = () => ozellikAcik('randevu')
const ret = (r: { kod: OnBuroRetKodu; alan?: string }) => (r.kod === 'NOT_FOUND' ? KOD.yok() : r.kod === 'ARAMA_KISA' ? cevap({ code: 'ARAMA_KISA' }, 400) : cevap({ code: r.kod, ...(r.alan ? { alan: r.alan } : {}) }, RANDEVU_DURUMU[r.kod]))
const zamanAl = (g: Record<string, unknown>): ZamanGirdisi => ({ gun: gunCoz(g.gun, ulkePaketi().bicim.tarihDeseni) ?? '', saatDk: saatCoz(g.saat), sureDk: Number(g.sureDk), yineDe: g.yineDe === true })

export const GET = sinirda('klinik/on-buro GET', async (req: NextRequest) => {
  if (!klinikAyarlari()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const p = req.nextUrl.searchParams
  const ben = oturum.user.id
  if (!p.has('hekim')) return cevap({ hekimler: await onBuroHekimleri(oturum.supabase, ben) })
  const hekim = p.get('hekim')
  if (!uuidMi(hekim)) return KOD.yok()
  if (p.has('hasta')) {
    const hastaId = p.get('hasta')
    if (!uuidMi(hastaId)) return KOD.yok()
    const hasta = await onBuroHastaKarti(oturum.supabase, ben, hekim, hastaId)
    return hasta ? cevap({ hasta }) : KOD.yok()
  }
  if (p.has('q')) {
    const r = await onBuroHastaAra(oturum.supabase, ben, hekim, String(p.get('q') ?? '').slice(0, 120))
    return r.tamam ? cevap({ hastalar: r.hastalar }) : ret(r)
  }
  if (!randevuAcik()) return KOD.yok()
  const paket = ulkePaketi()
  // "Today" and the week are the VIEWER's: the front-desk member's own time zone.
  const bugun = ulkeGunu(new Date(), await hesapSaatDilimi(oturum.supabase, ben))
  const gunHam = p.get('gun')
  const gun = gunHam === null || gunHam === '' ? bugun : gunCoz(gunHam, paket.bicim.tarihDeseni)
  if (!gun) return KOD.gecersiz('gun')
  const hafta = p.get('gorunum') === 'hafta'
  const ilkGun = hafta ? haftaninIlkGunu(gun, paket.bicim.haftaBasi) : gun
  const gunSayisi = hafta ? 7 : 1
  const randevular = await onBuroRandevulari(oturum.supabase, ben, hekim, ilkGun, gunSayisi)
  if (!randevular) return KOD.yok()
  return cevap({ gunler: Array.from({ length: gunSayisi }, (_, i) => gunEkle(ilkGun, i)), bugun, randevular })
})

export const POST = sinirda('klinik/on-buro POST', async (req: NextRequest) => {
  if (!klinikAyarlari()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  const ben = oturum.user.id
  if (!uuidMi(g.hekimId)) return KOD.yok()
  if (g.islem === 'hasta') {
    const cinsiyet = metinAlani(g.cinsiyet, 10)
    const r = await onBuroHastaOlustur(oturum.supabase, ben, g.hekimId, {
      ad: metinAlani(g.ad, 160).replace(/\s+/g, ' '), otaIsmi: metinAlani(g.otaIsmi, 120).replace(/\s+/g, ' '), dogumTarihi: metinAlani(g.dogumTarihi, 10),
      cinsiyet: cinsiyet as 'male' | 'female' | '', telefon: metinAlani(g.telefon, 40), dil: metinAlani(g.dil, 3),
    })
    return r.tamam ? cevap({ hasta: r.hasta }) : ret(r)
  }
  if (!uuidMi(g.hastaId)) return KOD.yok()
  if (g.islem === 'randevu') {
    if (!randevuAcik()) return KOD.yok()
    const r = await onBuroRandevuOlustur(oturum.supabase, ben, g.hekimId, { ...zamanAl(g), hastaId: g.hastaId })
    return r.tamam ? cevap({ randevu: r.randevu }) : ret(r)
  }
  if (g.islem === 'portal') {
    if (!portalAcik()) return KOD.yok()
    const r = await onBuroPortalVer(oturum.supabase, ben, g.hekimId, g.hastaId)
    if (!r.tamam) return r.kod === 'NOT_FOUND' ? KOD.yok() : cevap({ code: r.kod }, r.kod === 'HAZIR_DEGIL' ? 503 : 500)
    return cevap({ yol: r.yol, pin: r.pin, sonGecerlilik: r.sonGecerlilik })
  }
  if (g.islem === 'form') {
    const icerik = aktifFormIcerigi()
    if (!icerik) return KOD.yok()
    const r = await onBuroFormIste(oturum.supabase, ben, g.hekimId, { hastaId: g.hastaId, randevuId: uuidMi(g.randevuId) ? g.randevuId : null }, icerik)
    if (!r.tamam) return r.kod === 'NOT_FOUND' ? KOD.yok() : cevap({ code: r.kod }, r.kod === 'HAZIR_DEGIL' ? 503 : r.kod === 'BASARISIZ' ? 500 : 409)
    return cevap({ yeniForm: r.yeniForm, erisim: r.erisim, davetDili: r.davetDili, ...(r.yol && r.pin ? { yol: r.yol, pin: r.pin } : {}) })
  }
  return KOD.gecersiz('islem')
})

export const PATCH = sinirda('klinik/on-buro PATCH', async (req: NextRequest) => {
  if (!klinikAyarlari() || !randevuAcik()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.hekimId) || !uuidMi(g.randevuId)) return KOD.yok()
  if (g.durum !== undefined && !randevuDurumuMu(g.durum)) return KOD.gecersiz('durum')
  const r = await onBuroRandevuDegistir(oturum.supabase, oturum.user.id, g.hekimId, g.randevuId, g.durum !== undefined ? { durum: g.durum } : { zaman: zamanAl(g) })
  return r.tamam ? cevap({ randevu: r.randevu }) : ret(r)
})
