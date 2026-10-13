/**
 * NOTYA-UZ-MUAYENE-01 — POST /api/ulke/not/yeniden-yaz { notId }: one click — the note rewritten in the country's
 * other language (Uzbek ↔ Russian), stored as a SECOND draft beside the note. The note itself is not touched.
 *
 *   200 { dil }                              the language of the second draft (the existing one, if there is one already)
 *   409 { code: 'ONAYLI' }                   the note is approved: nothing is rewritten
 *   400 { code: 'BOS' }                      there is nothing to rewrite
 *   502 { code: 'YENIDEN_YAZILAMADI' }       the rewrite could not be made; the note is unchanged
 *   404 { code: 'NOT_FOUND' }                no such note FOR THIS DOCTOR (another doctor's: the same), or feature off
 *   401 { code: 'OTURUM_YOK' }   503 { code: 'HAZIR_DEGIL' }   500 { code: 'BASARISIZ' }
 *
 * PATIENT ISOLATION: the note id is read with the authenticated doctor's id (lib/ulke/uygulama/notlar.ts). The target
 * language is not taken from the request: it is the pack's "other language" for this note and this account.
 */
import { NextRequest } from 'next/server'
import { rotaButcesiMs } from '@/lib/ai/cagir'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { ozellikAcik } from '@/lib/ulke/ulke'
import { cevap, govdeOku, KOD, uuidMi } from '@/lib/ulke/uygulama/cevap'
import { notYenidenYaz } from '@/lib/ulke/uygulama/notlar'
import { NOT_DURUMU } from '@/lib/ulke/uygulama/notDurumu'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export const POST = sinirda('not/yeniden-yaz POST', async (req: NextRequest) => {
  if (!ozellikAcik('cekirdekMuayene')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.notId)) return KOD.yok()
  const r = await notYenidenYaz(oturum.supabase, oturum.user.id, g.notId, rotaButcesiMs(maxDuration))
  if (!r.tamam) return cevap({ code: r.kod }, NOT_DURUMU[r.kod])
  return cevap({ dil: r.dil })
})
