/**
 * NOTYA-ULKE-KLINIK-01 — /api/ulke/klinik: the caller's own clinic.
 *
 *   GET          200 { klinik: null, ayarlar }                                    the caller is in no clinic
 *                200 { klinik: { id, ad, konum, uyeler: [{ hesapId, ad, konum, rol }] }, ayarlar, davetler? }
 *                    `davetler` only for the owner and an administrator: [{ id, konum, durum, olusturuldu, sonGecerlilik }]
 *                    — never a code. `ayarlar`: what the country's pack allows { yetkiTurleri, sahipHekimAdinaVerebilir,
 *                    paylasimRolleri, vekaletAzamiGun }.
 *   POST { ad }  200 { klinikId }                    the caller creates a clinic and is its owner
 *                409 { code: 'UYE' }                 the caller is already a member of a clinic
 *                400 { code: 'GECERSIZ', alan: 'ad' }
 *
 *   404 { code: 'NOT_FOUND' }   the country has no clinic accounts
 *   401 { code: 'OTURUM_YOK' }  500 { code: 'BASARISIZ' }
 *
 * NO ID IS READ FROM THE REQUEST: the clinic is the authenticated account's own. NO PATIENT DATA: members are
 * accounts (name, position, role key). A clinic that is not the caller's cannot be named, listed or asked about.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { cevap, govdeOku, KOD } from '@/lib/ulke/uygulama/cevap'
import { davetleriListele, klinikAyarlari, klinikGetir, klinikKur } from '@/lib/ulke/klinikHesabi/klinik'

export const dynamic = 'force-dynamic'

export const GET = sinirda('klinik GET', async (req: NextRequest) => {
  const ayar = klinikAyarlari()
  if (!ayar) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const ayarlar = { yetkiTurleri: [...ayar.yetkiTurleri], sahipHekimAdinaVerebilir: ayar.sahipHekimAdinaVerebilir === true, paylasimRolleri: [...ayar.paylasimRolleri], vekaletAzamiGun: ayar.vekaletAzamiGun }
  const klinik = await klinikGetir(oturum.supabase, oturum.user.id)
  if (!klinik) return cevap({ klinik: null, ayarlar })
  const davetler = await davetleriListele(oturum.supabase, oturum.user.id)
  return cevap({ klinik, ayarlar, ...(davetler ? { davetler } : {}) })
})

export const POST = sinirda('klinik POST', async (req: NextRequest) => {
  if (!klinikAyarlari()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  const r = await klinikKur(oturum.supabase, oturum.user.id, g.ad)
  if (!r.tamam) return r.kod === 'GECERSIZ' ? KOD.gecersiz('ad') : r.kod === 'UYE' ? cevap({ code: 'UYE' }, 409) : KOD.basarisiz()
  return cevap({ klinikId: r.klinikId })
})
