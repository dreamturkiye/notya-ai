/**
 * POST /api/ulke/hesap/sifre — the caller changes the password of their OWN sign-in.
 *   GET   200 { eposta }   the sign-in email of the caller
 *   POST { yeniSifre }
 *     200 { ok: true }
 *     400 { code: 'GECERSIZ', alan: 'yeniSifre' }   shorter than 8 or longer than 72 characters
 *   401 { code: 'OTURUM_YOK' }   no session, or an account of another country
 *   404 { code: 'NOT_FOUND' }    the feature is off in this country
 *   500 { code: 'BASARISIZ' }
 *
 * The id is the authenticated user's, never a value from the request. The password is not stored, logged or echoed.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { ozellikAcik } from '@/lib/ulke/ulke'
import { cevap, govdeOku, KOD } from '@/lib/ulke/uygulama/cevap'

export const dynamic = 'force-dynamic'

export const GET = sinirda('hesap sifre GET', async (req: NextRequest) => {
  if (!ozellikAcik('cekirdekMuayene')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  return cevap({ eposta: oturum.user.email ?? '' })
})

export const POST = sinirda('hesap sifre POST', async (req: NextRequest) => {
  if (!ozellikAcik('cekirdekMuayene')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  const yeni = typeof g.yeniSifre === 'string' ? g.yeniSifre : ''
  if (yeni.length < 8 || yeni.length > 72) return KOD.gecersiz('yeniSifre')
  const { error } = await oturum.supabase.auth.admin.updateUserById(oturum.user.id, { password: yeni })
  if (error) return KOD.basarisiz()
  return cevap({ ok: true })
})
