/**
 * NOTYA-ULKE-KLINIK-01 — POST /api/ulke/klinik/katil: the caller joins a clinic with an invitation code.
 *
 *   POST { kod }   200 { klinikId, konum }
 *                  400 { code: 'KOD' }    ONE answer for a code that does not exist, was used, was withdrawn, has
 *                                         ended, or belongs to another country
 *                  409 { code: 'UYE' }    the caller is already a member of a clinic (the code is NOT used up)
 *
 *   404 { code: 'NOT_FOUND' }   the country has no clinic accounts
 *   401 { code: 'OTURUM_YOK' }  500 { code: 'BASARISIZ' }
 *
 * The code is the only thing read from the request; it is looked up by its hash and used up in the same database
 * step that makes the membership (ulke_klinik_katil). There is no way to list clinics or to ask whether one exists.
 * NO PATIENT DATA: joining gives a position, and a position opens no patient.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { cevap, govdeOku, KOD } from '@/lib/ulke/uygulama/cevap'
import { klinigeKatil, klinikAyarlari } from '@/lib/ulke/klinikHesabi/klinik'

export const dynamic = 'force-dynamic'

export const POST = sinirda('klinik/katil POST', async (req: NextRequest) => {
  if (!klinikAyarlari()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  const r = await klinigeKatil(oturum.supabase, oturum.user.id, g.kod)
  if (!r.tamam) return r.kod === 'KOD' ? cevap({ code: 'KOD' }, 400) : r.kod === 'UYE' ? cevap({ code: 'UYE' }, 409) : KOD.basarisiz()
  return cevap({ klinikId: r.klinikId, konum: r.konum })
})
