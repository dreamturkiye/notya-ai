/**
 * NOTYA-UZ-MUAYENE-01 — POST /api/ulke/not/onayla { notId, dil, s, o, a, p }: the doctor approves one draft, with
 * the text as it stands on the screen. Only now does the note belong to the patient's file.
 *
 *   200 { ok: true, onayTarihi }
 *   409 { code: 'ONAYLI' }             already approved: NOTHING is changed (an approved note is never overwritten)
 *   400 { code: 'BOS' }                an empty note cannot be approved
 *   400 { code: 'GECERSIZ', alan }     no draft in that language
 *   404 { code: 'NOT_FOUND' }          no such note FOR THIS DOCTOR (another doctor's: the same), or feature off
 *   401 { code: 'OTURUM_YOK' }   500 { code: 'BASARISIZ' }
 *
 * PATIENT ISOLATION: the note id is read and written with the authenticated doctor's id, and the approving write
 * carries "not approved yet" in the same statement (lib/ulke/uygulama/notlar.ts). No model is called here.
 * AYSE-OGRENME-V3f: after a successful approval, the learning step (correction count + edit log) runs in the
 * background; it reads and writes with the same authenticated doctor's id and the id the approval just proved.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { ozellikAcik } from '@/lib/ulke/ulke'
import { cevap, govdeOku, KOD, uuidMi } from '@/lib/ulke/uygulama/cevap'
import { icerikAl, notOnayla } from '@/lib/ulke/uygulama/notlar'
import { NOT_DURUMU } from '@/lib/ulke/uygulama/notDurumu'
import { onayiArkaPlandaOgren } from '@/lib/ulke/ogrenme/kayit'

export const dynamic = 'force-dynamic'

export const POST = sinirda('not/onayla POST', async (req: NextRequest) => {
  if (!ozellikAcik('cekirdekMuayene')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.notId)) return KOD.yok()
  const icerik = icerikAl(g)
  const r = await notOnayla(oturum.supabase, oturum.user.id, g.notId, g.dil, icerik)
  if (!r.tamam) return cevap({ code: r.kod, ...(r.alan ? { alan: r.alan } : {}) }, NOT_DURUMU[r.kod])
  // AYSE-OGRENME-V3f: count what the doctor changed and keep the edit log — AFTER the answer (waitUntil): no latency
  // here, and nothing that fails in it can reach the doctor. Only for a note that has just been approved.
  onayiArkaPlandaOgren(oturum.supabase, oturum.user.id, g.notId, typeof g.dil === 'string' ? g.dil : '', icerik)
  return cevap({ ok: true, onayTarihi: r.onayTarihi })
})
