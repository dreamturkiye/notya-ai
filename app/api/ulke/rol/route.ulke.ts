/**
 * NOTYA-UZ-BRANSLAR-01 — /api/ulke/rol: the role the caller works as (doctor specialty, clinic doctor role or
 * clinic allied profession). Asked once at first login, after the language question; changeable in settings.
 *
 *   GET
 *        200 { rol }                      a role key of this country's pack, or null when none is chosen yet
 *   POST { rol }
 *        200 { ok: true, rol }
 *        400 { code: 'GECERSIZ', alan: 'rol' }   not a role of this country
 *
 *   401 { code: 'OTURUM_YOK' }   no session, or an account of another country
 *   404 { code: 'NOT_FOUND' }    the feature is off in this country
 *   500 { code: 'BASARISIZ' }
 *
 * Reads and writes only the caller's own row (id = the authenticated account). No id is read from the request, and
 * no patient data is touched. Codes only: the role's NAME is the pack's text and is chosen on the screen.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { ozellikAcik } from '@/lib/ulke/ulke'
import { cevap, govdeOku, KOD } from '@/lib/ulke/uygulama/cevap'
import { hekimRolunuOku, hekimRolunuYaz, uygulamaRoluMu } from '@/lib/ulke/uygulama/rol'

export const dynamic = 'force-dynamic'

export const GET = sinirda('rol GET', async (req: NextRequest) => {
  if (!ozellikAcik('cekirdekMuayene')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  return cevap({ rol: await hekimRolunuOku(oturum.supabase, oturum.user.id) })
})

export const POST = sinirda('rol POST', async (req: NextRequest) => {
  if (!ozellikAcik('cekirdekMuayene')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uygulamaRoluMu(g.rol)) return KOD.gecersiz('rol')
  if (!(await hekimRolunuYaz(oturum.supabase, oturum.user.id, g.rol))) return KOD.basarisiz()
  return cevap({ ok: true, rol: g.rol })
})
