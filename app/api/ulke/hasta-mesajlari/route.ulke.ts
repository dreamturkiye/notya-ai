/**
 * NOTYA-ULKE-MESAJ-01 — /api/ulke/hasta-mesajlari: a DOCTOR's messages with their own patients.
 *
 *   GET    ?hasta=<hastaId>     200 { yazismalar: [{ id, olusturuldu, kapandi, mesajlar: [{ id, gonderen, metin, an, okundu }] }], erisim }
 *                               the conversations with that patient, newest first; `erisim` says whether the patient
 *                               has a link that works (without one they cannot read)
 *   GET                         200 { okunmamis: [{ hastaId, hastaAdi, adet, son }] }
 *                               the doctor's patients whose messages are unread, newest first. No text.
 *   POST   { hastaId, metin }   200 { id, yazismaId }    the doctor writes; a conversation is opened where none is open
 *   PATCH  { hastaId, islem: 'okundu', kadar }  200 { ok: true } the doctor has read what that patient wrote, up to the
 *                               moment `kadar` (the newest message the screen showed): nothing unseen is marked
 *   PATCH  { yazismaId, islem: 'kapat' }      200 { ok: true }   the doctor closes a conversation, once
 *
 *   404 { code: 'NOT_FOUND' }   no such patient or conversation FOR THIS DOCTOR (another doctor's: exactly the same),
 *                               a malformed id, or the country has no messages
 *   400 { code: 'BOS' | 'UZUN' | 'GECERSIZ' }   429 { code: 'LIMIT' }
 *   409 { code: 'DURUM' }       the conversation is already closed
 *   401 { code: 'OTURUM_YOK' }  500 { code: 'BASARISIZ' }
 *
 * A DOCTOR'S SESSION ONLY (the bearer token of the sign-in service); a patient's portal cookie is not read here.
 * PATIENT ISOLATION: every id from the request is matched against the authenticated doctor before anything is read
 * or written with it (lib/ulke/mesaj/mesaj.ts). NOTHING IS SENT TO ANYBODY from here, and no model is called.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { cevap, govdeOku, KOD, uuidMi } from '@/lib/ulke/uygulama/cevap'
import { hekimMesajlari, hekimMesajYaz, hekimOkudu, hekimOkunmamislari, MESAJ_DURUMU, mesajAcik, yazismaKapat } from '@/lib/ulke/mesaj/mesaj'

export const dynamic = 'force-dynamic'

export const GET = sinirda('hasta-mesajlari GET', async (req: NextRequest) => {
  if (!mesajAcik()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  if (!req.nextUrl.searchParams.has('hasta')) return cevap({ okunmamis: await hekimOkunmamislari(oturum.supabase, oturum.user.id) })
  const id = req.nextUrl.searchParams.get('hasta')
  if (!uuidMi(id)) return KOD.yok()
  const g = await hekimMesajlari(oturum.supabase, oturum.user.id, id)
  if (!g) return KOD.yok()
  return cevap(g)
})

export const POST = sinirda('hasta-mesajlari POST', async (req: NextRequest) => {
  if (!mesajAcik()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.hastaId)) return KOD.yok()
  const r = await hekimMesajYaz(oturum.supabase, oturum.user.id, g.hastaId, g.metin)
  if (!r.tamam) return r.kod === 'NOT_FOUND' ? KOD.yok() : cevap({ code: r.kod }, MESAJ_DURUMU[r.kod])
  return cevap({ id: r.id, yazismaId: r.yazismaId })
})

export const PATCH = sinirda('hasta-mesajlari PATCH', async (req: NextRequest) => {
  if (!mesajAcik()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (g.islem !== 'okundu' && g.islem !== 'kapat') return KOD.gecersiz('islem')
  if (g.islem === 'okundu' ? !uuidMi(g.hastaId) : !uuidMi(g.yazismaId)) return KOD.yok()
  const r = g.islem === 'okundu' ? await hekimOkudu(oturum.supabase, oturum.user.id, g.hastaId as string, g.kadar) : await yazismaKapat(oturum.supabase, oturum.user.id, g.yazismaId as string)
  if (!r.tamam) return r.kod === 'NOT_FOUND' ? KOD.yok() : cevap({ code: r.kod }, MESAJ_DURUMU[r.kod])
  return cevap({ ok: true })
})
