/**
 * NOTYA-ULKE-PORTAL-01 — THE PATIENT'S SIDE of portal access: the link's token and the PIN become a session.
 *
 * THE TOKEN ALONE SHOWS NOTHING. With a token and no right PIN, the only things this file answers are: "no such
 * link" (the same for a token that never existed, a link that was withdrawn, one that has ended, and a link of
 * another country), "locked", "too fast", and "wrong PIN". Nothing about a patient or a doctor is read, let alone
 * returned, before the PIN is right.
 *
 * WRONG PINS. A try is TAKEN from the link in the database before the PIN is looked at (`ulke_portal_deneme_al`),
 * so a request that is cut off still cost a try and two requests at the same moment cannot share one. Tries closer
 * together than PIN_DENEME_ARALIGI_SN seconds are not looked at. After PIN_DENEME_AZAMI tries without a right PIN
 * the link is LOCKED for good and its sessions are closed; the doctor sees the lock and gives a new link.
 *
 * THE SESSION is a random key in an HttpOnly cookie that is sent to the portal's own routes only. The database
 * holds the key's hash. A session hangs from its link: it ends when the link is withdrawn, locked or ended, at the
 * latest after PORTAL_OTURUM_DK minutes — checked on EVERY request, in the database, not from the cookie.
 *
 * NO OTHER KIND OF SESSION COUNTS HERE. `portalOturum` reads the portal cookie and nothing else: a doctor's bearer
 * token in the Authorization header is not looked at, so it can never stand in for a patient's session. The reverse
 * holds in lib/ulke/sunucuOturum.ts: a doctor's routes read the Authorization header only and hand it to the sign-in
 * service, to which a portal key or a portal token means nothing.
 *
 * ISOLATION. The country, the doctor and the patient of a session come from the session's own row and from nowhere
 * else — never from a request. Every statement is bound to this build's country (lib/ulke/uygulama/tablolar.ts).
 */
import type { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ulkeServisSupabase } from '../sunucuOturum'
import { ozellikAcik } from '../ulke'
import { ulkeIslevi, ulkeTablosu } from '../uygulama/tablolar'
import { ulkeYolOnEki } from '../yol'
import { anahtarHash, anahtarMi, anahtarUret, pinDogrula } from './pin'
import { BAGLANTI_OZETI_BICIMI, PIN_DENEME_ARALIGI_SN, PIN_DENEME_AZAMI, pinBicimiGecerli, PORTAL_API, PORTAL_BAGLANTI_BASLIGI, PORTAL_CEREZI, PORTAL_OTURUM_DK } from './sabitler'

/** true = the patient portal exists in this country. */
export const portalAcik = (): boolean => ozellikAcik('cekirdekMuayene') && ozellikAcik('hastaPortali')

export type PortalGirisRetKodu = 'NOT_FOUND' | 'KILITLI' | 'YAVAS' | 'PIN_YANLIS' | 'GECERSIZ' | 'BASARISIZ'
export type PortalGirisSonucu =
  | { tamam: true; oturumAnahtari: string; bitis: string }
  | { tamam: false; kod: PortalGirisRetKodu; /** tries left, with 'PIN_YANLIS' */ kalan?: number }

export async function portalGiris(supabase: SupabaseClient, token: unknown, pin: unknown, simdi = Date.now()): Promise<PortalGirisSonucu> {
  // Shape first, the same answer whatever the token is: a malformed PIN can never be used to ask "does this link exist?".
  if (!pinBicimiGecerli(pin)) return { tamam: false, kod: 'GECERSIZ' }
  if (!anahtarMi(token)) return { tamam: false, kod: 'NOT_FOUND' }
  const an = new Date(simdi).toISOString()
  const { data: alinan, error } = await ulkeIslevi(supabase, 'ulke_portal_deneme_al', { p_token_hash: anahtarHash(token), p_azami: PIN_DENEME_AZAMI, p_aralik_sn: PIN_DENEME_ARALIGI_SN, p_simdi: an })
  if (error || !alinan) return { tamam: false, kod: 'BASARISIZ' }
  const a = alinan as { durum?: string; erisim_id?: string; pin_hash?: string }
  if (a.durum === 'YOK') return { tamam: false, kod: 'NOT_FOUND' }
  if (a.durum === 'KILITLI') return { tamam: false, kod: 'KILITLI' }
  if (a.durum === 'YAVAS') return { tamam: false, kod: 'YAVAS' }
  if (a.durum !== 'DENE' || !a.erisim_id) return { tamam: false, kod: 'BASARISIZ' }

  const dogru = await pinDogrula(pin, a.pin_hash)
  const oturumAnahtari = anahtarUret()
  const bitis = new Date(simdi + PORTAL_OTURUM_DK * 60_000).toISOString()
  const { data: sonuc, error: sonucHatasi } = await ulkeIslevi(supabase, 'ulke_portal_deneme_sonucu', {
    p_erisim_id: a.erisim_id, p_dogru: dogru, p_azami: PIN_DENEME_AZAMI,
    // A session key is sent only for a right PIN: a wrong try never leaves a hash behind.
    p_oturum_hash: dogru ? anahtarHash(oturumAnahtari) : null, p_oturum_bitis: bitis, p_simdi: an,
  })
  if (sonucHatasi || !sonuc) return { tamam: false, kod: 'BASARISIZ' }
  const s = sonuc as { durum?: string; kalan?: number }
  if (s.durum === 'TAMAM' && dogru) return { tamam: true, oturumAnahtari, bitis }
  if (s.durum === 'YANLIS') return { tamam: false, kod: 'PIN_YANLIS', kalan: Number(s.kalan) || 0 }
  if (s.durum === 'KILITLI') return { tamam: false, kod: 'KILITLI' }
  if (s.durum === 'YOK') return { tamam: false, kod: 'NOT_FOUND' }
  return { tamam: false, kod: 'BASARISIZ' }
}

/** Who a portal session is: taken from the session's own row. */
export type PortalKimligi = { doktorId: string; hastaId: string; erisimId: string; oturumId: string; bitis: string }
export type PortalOturumu = PortalKimligi & { supabase: SupabaseClient }

/**
 * The session a key belongs to, or null. Checked against the database every time: the session is open and not over,
 * AND its link is still this patient's, not withdrawn, not locked and not ended.
 */
export async function portalOturumuCoz(supabase: SupabaseClient, anahtar: unknown, simdi = Date.now(), baglantiOzeti?: unknown): Promise<PortalKimligi | null> {
  if (!anahtarMi(anahtar)) return null
  const { data: o, error } = await ulkeTablosu(supabase, 'ulke_portal_oturumlari')
    .select('id, doctor_id, patient_id, erisim_id, son_gecerlilik, kapandi_at')
    .eq('oturum_hash', anahtarHash(anahtar))
    .maybeSingle()
  const s = o as { id: string; doctor_id: string; patient_id: string; erisim_id: string; son_gecerlilik: string; kapandi_at: string | null } | null
  if (error || !s || s.kapandi_at || !(new Date(s.son_gecerlilik).getTime() > simdi)) return null
  // The link, read by its id AND the session's doctor AND patient: a session cannot borrow another patient's link.
  const { data: e, error: erisimHatasi } = await ulkeTablosu(supabase, 'ulke_portal_erisimleri')
    .select('id, token_hash, iptal_at, kilitlendi_at, son_gecerlilik')
    .eq('id', s.erisim_id)
    .eq('doctor_id', s.doctor_id)
    .eq('patient_id', s.patient_id)
    .maybeSingle()
  const l = e as { token_hash: string; iptal_at: string | null; kilitlendi_at: string | null; son_gecerlilik: string } | null
  if (erisimHatasi || !l || l.iptal_at || l.kilitlendi_at || !(new Date(l.son_gecerlilik).getTime() > simdi)) return null
  // The page says which link it is open for. A session of another link (a second patient on the same phone) does not answer it.
  if (baglantiOzeti !== undefined && (typeof baglantiOzeti !== 'string' || !BAGLANTI_OZETI_BICIMI.test(baglantiOzeti) || baglantiOzeti !== l.token_hash)) return null
  return { doktorId: s.doctor_id, hastaId: s.patient_id, erisimId: s.erisim_id, oturumId: s.id, bitis: s.son_gecerlilik }
}

/** The portal session of a request: from the portal cookie ONLY. The Authorization header is never read here. */
export async function portalOturum(req: NextRequest, simdi = Date.now()): Promise<PortalOturumu | null> {
  const anahtar = req.cookies.get(PORTAL_CEREZI)?.value
  if (!anahtarMi(anahtar)) return null
  const supabase = ulkeServisSupabase()
  // ALWAYS asked of a request: a missing header is a wrong header.
  const k = await portalOturumuCoz(supabase, anahtar, simdi, req.headers.get(PORTAL_BAGLANTI_BASLIGI) ?? '')
  return k ? { ...k, supabase } : null
}

/** Ends the session of a key. Nothing happens for a key that is not a session. */
export async function portalCikis(supabase: SupabaseClient, anahtar: unknown, simdi = Date.now()): Promise<void> {
  if (!anahtarMi(anahtar)) return
  await ulkeTablosu(supabase, 'ulke_portal_oturumlari').update({ kapandi_at: new Date(simdi).toISOString() }).eq('oturum_hash', anahtarHash(anahtar)).is('kapandi_at', null)
}

// ───────────────────────── the cookie ─────────────────────────

/** The path the session cookie is sent to: the portal's own routes under this country's prefix, and nothing else. */
export const portalCerezYolu = (): string => `${ulkeYolOnEki()}${PORTAL_API}`

/** A walk-through on this machine is plain http; everywhere else the cookie is sent over https only. */
const yerelMi = (req: NextRequest): boolean => /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(req.headers.get('host') ?? '')

export function portalCereziniYaz(req: NextRequest, res: NextResponse, anahtar: string, bitis: string): void {
  res.cookies.set(PORTAL_CEREZI, anahtar, { httpOnly: true, secure: !yerelMi(req), sameSite: 'strict', path: portalCerezYolu(), expires: new Date(bitis) })
}

export function portalCereziniSil(req: NextRequest, res: NextResponse): void {
  res.cookies.set(PORTAL_CEREZI, '', { httpOnly: true, secure: !yerelMi(req), sameSite: 'strict', path: portalCerezYolu(), maxAge: 0 })
}
