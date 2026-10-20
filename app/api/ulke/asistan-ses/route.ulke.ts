/**
 * POST /api/ulke/asistan-ses { cinsiyet: 'erkek' | 'kadin' }
 *
 * Speaks the signed-in account's own specialty line in that voice. The words are the pack's, not the request's.
 * Nothing but the voice choice is read from the body, and the role is the caller's own row.
 *
 *   200 { ok: true, mime: 'audio/mpeg', ses, cinsiyet }
 *   400 { code: 'GECERSIZ', alan: 'cinsiyet' }
 *   401 { code: 'OTURUM_YOK' }
 *   404 { code: 'NOT_FOUND' }     no role, no assistant, or this pack does not speak
 *   503 { code: 'HAZIR_DEGIL' }   the speaker has no key
 *   500 { code: 'BASARISIZ' }
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { ozellikAcik } from '@/lib/ulke/ulke'
import { govdeOku, KOD } from '@/lib/ulke/uygulama/cevap'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { hekimRolunuOku } from '@/lib/ulke/uygulama/rol'
import { asistanSesCevabi } from '@/lib/ulke/uygulama/asistanSes'

export const dynamic = 'force-dynamic'

export const POST = sinirda('asistan-ses POST', async (req: NextRequest) => {
  if (!ozellikAcik('cekirdekMuayene')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  const rol = await hekimRolunuOku(oturum.supabase, oturum.user.id)
  return asistanSesCevabi(rol, g.cinsiyet)
})
