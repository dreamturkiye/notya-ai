/**
 * NOTYA-ULKE-PORTAL-01 — THE DOCTOR'S SIDE of portal access: give a patient a link and a PIN, withdraw it, see what
 * happened with it.
 *
 * ACCESS WITHOUT AN ACCOUNT. The doctor opens a patient's file and creates access: a LINK that carries an
 * unguessable token, and a PIN. Both are shown to the doctor ONCE, in the answer to that request; the database keeps
 * only their hashes (lib/ulke/portal/pin.ts), so neither can be shown again — the doctor gives a new link instead,
 * which withdraws the one before it in the same step. How the link and the PIN reach the patient is the doctor's own
 * act: nothing is sent to anybody from here.
 *
 * PATIENT ISOLATION (.cursor/skills/hasta-izolasyon/SKILL.md). Service-role client, so this file is the isolation:
 * the patient id comes from the request and is proven to be THIS doctor's (hastaGetir: id and doctor in one query)
 * before anything is read or written for it; every statement afterwards carries the doctor's id and the patient's.
 * Another doctor's patient answers exactly like one that does not exist. Every statement is bound to this build's
 * country (lib/ulke/uygulama/tablolar.ts), and so is every function called.
 *
 * A link belongs to one patient of one doctor in one country — by its key (migration 137).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { hastaIcinBicim } from '../arayuz/dilSecimi'
import { ulkePaketi } from '../ulke'
import { hastaGetir } from '../uygulama/hastalar'
import { hekimDilleri } from '../uygulama/muayeneKaydi'
import { ulkeIslevi, ulkeTablosu } from '../uygulama/tablolar'
import { anahtarHash, anahtarUret, pinHashle, pinUret } from './pin'
import { PIN_DENEME_AZAMI, PORTAL_SAYFASI } from './sabitler'

const GUN_MS = 86_400_000

/** Days a link stays valid in this country, or null where the pack has no portal. */
export function baglantiGecerlilikGun(): number | null {
  const g = ulkePaketi().uygulama?.portal?.baglantiGecerlilikGun
  return typeof g === 'number' && Number.isInteger(g) && g >= 1 && g <= 365 ? g : null
}

import type { PortalErisimi, PortalKaydi, PortalOlayi } from './tipler'
export type { PortalErisimi, PortalKaydi, PortalOlayi } from './tipler'
export type ErisimRetKodu = 'NOT_FOUND' | 'HAZIR_DEGIL' | 'BASARISIZ'

const OLAYLAR: readonly string[] = ['erisim', 'iptal', 'giris', 'kilit', 'paylasim', 'geri-alma']

/**
 * A new link and PIN for one of THIS doctor's patients. The link before it stops working at once.
 * `yol` is a route of this build with the token in its fragment; the screen turns it into an address.
 */
export async function portalErisimVer(supabase: SupabaseClient, doktorId: string, hastaId: string, simdi = Date.now()): Promise<{ tamam: true; yol: string; pin: string; sonGecerlilik: string } | { tamam: false; kod: ErisimRetKodu }> {
  const gun = baglantiGecerlilikGun()
  if (gun === null) return { tamam: false, kod: 'HAZIR_DEGIL' }
  // ISOLATION: the patient must be this doctor's before anything is written for them.
  const hasta = await hastaGetir(supabase, doktorId, hastaId)
  if (!hasta) return { tamam: false, kod: 'NOT_FOUND' }
  const token = anahtarUret()
  const pin = pinUret()
  const sonGecerlilik = new Date(simdi + gun * GUN_MS).toISOString()
  const { data, error } = await ulkeIslevi(supabase, 'ulke_portal_erisim_ver', {
    p_doctor_id: doktorId, p_patient_id: hasta.id, p_token_hash: anahtarHash(token), p_pin_hash: await pinHashle(pin),
    p_son_gecerlilik: sonGecerlilik, p_simdi: new Date(simdi).toISOString(),
  })
  if (error) return { tamam: false, kod: 'BASARISIZ' }
  if (!data) return { tamam: false, kod: 'NOT_FOUND' }
  // The page opens in the PATIENT's language form (the patient's language; where it has several scripts, the
  // doctor's). Only a hint for the page before sign-in: after it the server decides again from the record.
  const h = await hekimDilleri(supabase, doktorId)
  const dil = hastaIcinBicim(ulkePaketi().uygulama?.dilGruplari ?? [], hasta.dil, { dil: h.arayuzDili, notDili: h.notDili })
  return { tamam: true, yol: `${PORTAL_SAYFASI}?dil=${encodeURIComponent(dil)}#${token}`, pin, sonGecerlilik }
}

/** Withdraws the patient's link. 'YOK' = the patient had none. */
export async function portalErisimIptal(supabase: SupabaseClient, doktorId: string, hastaId: string, simdi = Date.now()): Promise<'TAMAM' | 'YOK' | 'NOT_FOUND' | 'BASARISIZ'> {
  const hasta = await hastaGetir(supabase, doktorId, hastaId)
  if (!hasta) return 'NOT_FOUND'
  const { data, error } = await ulkeIslevi(supabase, 'ulke_portal_erisim_iptal', { p_doctor_id: doktorId, p_patient_id: hasta.id, p_simdi: new Date(simdi).toISOString() })
  if (error) return 'BASARISIZ'
  return data === true ? 'TAMAM' : 'YOK'
}

/**
 * What the doctor may know about a patient's access: whether there is a link, and its dates. NEVER the token or the
 * PIN — the database does not hold them, and their hashes are not selected here. null = not this doctor's patient.
 */
export async function portalErisimDurumu(supabase: SupabaseClient, doktorId: string, hastaId: string, simdi = Date.now()): Promise<{ erisim: PortalErisimi; kayitlar: PortalKaydi[] } | null> {
  const hasta = await hastaGetir(supabase, doktorId, hastaId)
  if (!hasta) return null
  const { data } = await ulkeTablosu(supabase, 'ulke_portal_erisimleri')
    .select('id, kilitlendi_at, son_gecerlilik, son_giris_at, created_at')
    .eq('doctor_id', doktorId)
    .eq('patient_id', hasta.id)
    .is('iptal_at', null)
    .maybeSingle()
  const e = data as { kilitlendi_at: string | null; son_gecerlilik: string; son_giris_at: string | null; created_at: string } | null
  const erisim: PortalErisimi = !e
    ? { durum: 'yok', olusturuldu: null, sonGecerlilik: null, sonGiris: null }
    : { durum: e.kilitlendi_at ? 'kilitli' : new Date(e.son_gecerlilik).getTime() <= simdi ? 'suresi-doldu' : 'acik', olusturuldu: e.created_at, sonGecerlilik: e.son_gecerlilik, sonGiris: e.son_giris_at ?? null }
  const { data: k } = await ulkeTablosu(supabase, 'ulke_portal_kayitlari')
    .select('olay, ozet_id, created_at')
    .eq('doctor_id', doktorId)
    .eq('patient_id', hasta.id)
    .order('created_at', { ascending: false })
    .limit(100)
  const kayitlar = ((k as { olay: string; ozet_id: string | null; created_at: string }[] | null) ?? [])
    .filter((x) => OLAYLAR.includes(x.olay))
    .map((x) => ({ olay: x.olay as PortalOlayi, an: x.created_at, ozetId: x.ozet_id ?? null }))
  return { erisim, kayitlar }
}

export { PIN_DENEME_AZAMI }
