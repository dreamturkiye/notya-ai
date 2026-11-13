/**
 * AYSE-OGRENME-V3f — /api/ulke/hafiza/klinik-uslup: the doctor's consent to share style rules with the clinic, the
 * country's version of Türkiye's /api/doktor/hafiza/klinik-uslup (membership from ulke_klinik_uyeleri, the role split
 * from hekim_rolu).
 *
 *   GET                  200 { uye, aktif, gelen, hazir }   `hazir: false` = nothing can be shared yet (see lib/ulke/ogrenme/klinikUslup.ts)
 *   POST { ac: boolean } 200 the same answer        ac: true  = consent;  ac: false = leave: consent off, the account's rules leave the pool
 *   400 { code: 'GECERSIZ', alan: 'ac' }
 *   403 { code: 'UYE_DEGIL' }     not a member of a clinic that shares (or the front desk)
 *   409 { code: 'HAZIR_DEGIL' }   consent cannot be given yet     409 { code: 'ROL_YOK' }   no role chosen yet
 *   404 { code: 'NOT_FOUND' }  401 { code: 'OTURUM_YOK' }  500 { code: 'BASARISIZ' }
 *
 * PATIENT ISOLATION: no patient and no note; takes NO id from the request. Every statement carries the authenticated
 * account's own id and the build's country. The pool's source doctor is never answered.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { ozellikAcik } from '@/lib/ulke/ulke'
import { cevap, govdeOku, KOD } from '@/lib/ulke/uygulama/cevap'
import { klinikUslupAc, klinikUslupDurumu, klinikUslupKapat } from '@/lib/ulke/ogrenme/klinikUslup'

export const dynamic = 'force-dynamic'

export const GET = sinirda('hafiza/klinik-uslup GET', async (req: NextRequest) => {
  if (!ozellikAcik('cekirdekMuayene')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  return cevap({ ...(await klinikUslupDurumu(oturum.supabase, oturum.user.id)) })
})

export const POST = sinirda('hafiza/klinik-uslup POST', async (req: NextRequest) => {
  if (!ozellikAcik('cekirdekMuayene')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (typeof g.ac !== 'boolean') return KOD.gecersiz('ac')
  const id = oturum.user.id
  if (g.ac) {
    const r = await klinikUslupAc(oturum.supabase, id)
    if (!r.tamam) return cevap({ code: r.kod }, r.kod === 'UYE_DEGIL' ? 403 : r.kod === 'BASARISIZ' ? 500 : 409)
  } else {
    await klinikUslupKapat(oturum.supabase, id)
  }
  return cevap({ ...(await klinikUslupDurumu(oturum.supabase, id)) })
})
