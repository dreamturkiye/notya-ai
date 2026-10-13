/**
 * NOTYA-ULKE-MESAJ-01 — /api/ulke/portal/mesaj: the signed-in PATIENT's messages with their doctor.
 *
 *   GET                 200 { yazismalar: [{ id, olusturuldu, kapandi, mesajlar: [{ id, gonderen, metin, an, okundu }] }], yazabilir }
 *                       `yazabilir` false = no conversation is open: a patient cannot start one
 *   POST  { metin }     200 { id }            the patient answers in the conversation that is open
 *   PUT   { kadar }     200 { ok: true }      the patient has read what the doctor wrote, up to the moment `kadar`
 *                                             (the newest message the page showed): nothing unseen is marked
 *
 *   409 { code: 'KAPALI' }           no conversation is open (none yet, or the doctor closed it)
 *   400 { code: 'BOS' | 'UZUN' }     429 { code: 'LIMIT' }
 *   400 { code: 'GECERSIZ' }         not the portal's own request
 *   404 { code: 'NOT_FOUND' }        the feature is off
 *   401 { code: 'OTURUM_YOK' }       no portal session (a doctor's session is not one)
 *
 * TAKES NO DOCTOR, NO PATIENT AND NO CONVERSATION ID FROM THE REQUEST: all are the session's own
 * (lib/ulke/mesaj/mesaj.ts). Private, never stored by a cache, never indexed (lib/ulke/portal/rotaYardimcisi.ts).
 * Nothing is sent to anybody, and no model is called.
 */
import { NextRequest } from 'next/server'
import { govdeOku } from '@/lib/ulke/uygulama/cevap'
import { portalOturum } from '@/lib/ulke/portal/giris'
import { PORTAL_KOD, portalCevabi, portalIstegiMi, portalSinirinda } from '@/lib/ulke/portal/rotaYardimcisi'
import { hastaMesajlari, hastaMesajYaz, hastaOkudu, MESAJ_DURUMU, mesajAcik } from '@/lib/ulke/mesaj/mesaj'

export const dynamic = 'force-dynamic'

export const GET = portalSinirinda('portal mesaj GET', async (req: NextRequest) => {
  if (!mesajAcik()) return PORTAL_KOD.yok()
  const oturum = await portalOturum(req)
  if (!oturum) return PORTAL_KOD.oturumYok()
  const g = await hastaMesajlari(oturum.supabase, oturum)
  if (!g) return PORTAL_KOD.oturumYok()
  return portalCevabi(g)
})

export const POST = portalSinirinda('portal mesaj POST', async (req: NextRequest) => {
  if (!mesajAcik()) return PORTAL_KOD.yok()
  if (!portalIstegiMi(req)) return PORTAL_KOD.gecersiz()
  const oturum = await portalOturum(req)
  if (!oturum) return PORTAL_KOD.oturumYok()
  const g = await govdeOku(req)
  const r = await hastaMesajYaz(oturum.supabase, oturum, g.metin)
  if (!r.tamam) return r.kod === 'NOT_FOUND' ? PORTAL_KOD.oturumYok() : portalCevabi({ code: r.kod }, MESAJ_DURUMU[r.kod])
  return portalCevabi({ id: r.id })
})

export const PUT = portalSinirinda('portal mesaj PUT', async (req: NextRequest) => {
  if (!mesajAcik()) return PORTAL_KOD.yok()
  if (!portalIstegiMi(req)) return PORTAL_KOD.gecersiz()
  const oturum = await portalOturum(req)
  if (!oturum) return PORTAL_KOD.oturumYok()
  const g = await govdeOku(req)
  const r = await hastaOkudu(oturum.supabase, oturum, g.kadar)
  if (!r.tamam) return r.kod === 'NOT_FOUND' ? PORTAL_KOD.oturumYok() : portalCevabi({ code: r.kod }, MESAJ_DURUMU[r.kod])
  return portalCevabi({ ok: true })
})
