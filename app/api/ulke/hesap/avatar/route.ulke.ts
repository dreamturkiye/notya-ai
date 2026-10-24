/**
 * /api/ulke/hesap/avatar — the caller's own profile photo.
 *   GET     200 { avatar: <data URL> | null }
 *   POST    multipart `file` (jpeg, png or webp, up to 4 MB)   200 { avatar }   400 { code: 'GECERSIZ', alan: 'dosya' | 'tur' | 'boyut' }
 *   DELETE  200 { ok: true, avatar: null }
 *   401 { code: 'OTURUM_YOK' }   404 { code: 'NOT_FOUND' } the feature is off   500 { code: 'BASARISIZ' }
 * The id is the authenticated account's; nothing is read from the request but the file.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { ozellikAcik } from '@/lib/ulke/ulke'
import { cevap, KOD } from '@/lib/ulke/uygulama/cevap'
import { avatarOku, avatarSil, avatarYaz } from '@/lib/ulke/uygulama/avatar'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export const GET = sinirda('hesap avatar GET', async (req: NextRequest) => {
  if (!ozellikAcik('cekirdekMuayene')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  return cevap({ avatar: await avatarOku(oturum.supabase, oturum.user.id) })
})

export const POST = sinirda('hesap avatar POST', async (req: NextRequest) => {
  if (!ozellikAcik('cekirdekMuayene')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  let dosya: unknown
  try { dosya = (await req.formData()).get('file') } catch { return KOD.gecersiz('dosya') }
  if (!(dosya instanceof File)) return KOD.gecersiz('dosya')
  const bayt = Buffer.from(await dosya.arrayBuffer())
  const s = await avatarYaz(oturum.supabase, oturum.user.id, dosya.type, bayt)
  if (!s.tamam) return s.kod === 'TUR' ? KOD.gecersiz('tur') : s.kod === 'BOYUT' ? KOD.gecersiz('boyut') : KOD.basarisiz()
  return cevap({ avatar: await avatarOku(oturum.supabase, oturum.user.id) })
})

export const DELETE = sinirda('hesap avatar DELETE', async (req: NextRequest) => {
  if (!ozellikAcik('cekirdekMuayene')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  if (!(await avatarSil(oturum.supabase, oturum.user.id))) return KOD.basarisiz()
  return cevap({ ok: true, avatar: null })
})
