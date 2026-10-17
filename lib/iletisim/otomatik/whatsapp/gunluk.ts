/**
 * WHATSAPP-API-01 — KVKK audit log of every WhatsApp message and connection event (whatsapp_mesaj_gunlugu).
 *
 * Append-only (migration 169 trigger): a row is never edited. An outbound message is logged twice — "deneniyor"
 * BEFORE the network call (so a crash mid-send still leaves a trace and the idempotency key is claimed) and its outcome
 * ("gonderildi" / "basarisiz" / "belirsiz") after. Delivery receipts (sent/delivered/read/failed) stay in
 * whatsapp_teslim_durumlari, joined by wamid.
 *
 * Bodies are encrypted (encryptPII). The counterpart is only a keyed hash (karsiTarafIzi): history by phone number can
 * be found without a plaintext number in this table. `ayrinti` carries ids and labels, never names, numbers or text.
 * Nothing here ever logs a token or a plaintext body.
 */
import { createHmac } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { encryptPII } from '@/lib/security/encryption'
import { whatsappNumarasi } from '@/lib/iletisim/baglantilar'

export const GUNLUK = 'whatsapp_mesaj_gunlugu'

export type GunlukYon = 'gelen' | 'giden' | 'olay'
export type GunlukDurum = 'deneniyor' | 'gonderildi' | 'basarisiz' | 'belirsiz' | 'alindi' | 'olay'

export interface GunlukGirdisi {
  doktorId: string
  patientId?: string | null
  yon: GunlukYon
  tur: string
  durum: GunlukDurum
  wamid?: string | null
  kaynakWamid?: string | null
  idemAnahtar?: string | null
  /** E.164 digits of the other side — hashed here, never stored. */
  karsiTaraf?: string | null
  sablonKodu?: string | null
  /** Plain body; encrypted here. */
  govde?: string | null
  hataKodu?: string | null
  ayrinti?: Record<string, string | number | boolean | null>
}

/** Keyed hash of a phone number (digits only). Deterministic per deployment, not reversible without the key. */
export function karsiTarafIzi(numara: string): string {
  // One spelling per number: "0532 …", "+90 532 …" and "90532…" must hash the same (the 24h-window check compares them).
  const rakam = whatsappNumarasi(numara) || String(numara || '').replace(/\D/g, '')
  const anahtar = process.env.ENCRYPTION_MASTER_KEY || ''
  return createHmac('sha256', anahtar).update(`wa-karsi-taraf:${rakam}`).digest('hex')
}

/** Returns true when the row is written. A unique-key clash (duplicate idempotency key / inbound wamid) returns false. */
export async function gunlukYaz(sb: SupabaseClient, g: GunlukGirdisi): Promise<{ ok: true } | { ok: false; tekrar: boolean }> {
  const { error } = await sb.from(GUNLUK).insert({
    doctor_id: g.doktorId,
    patient_id: g.patientId ?? null,
    yon: g.yon,
    tur: g.tur.slice(0, 40),
    durum: g.durum,
    wamid: g.wamid ?? null,
    kaynak_wamid: g.kaynakWamid ?? null,
    idem_anahtar: g.idemAnahtar ?? null,
    karsi_taraf_hash: g.karsiTaraf ? karsiTarafIzi(g.karsiTaraf) : null,
    sablon_kodu: g.sablonKodu ?? null,
    govde_encrypted: g.govde ? encryptPII(g.govde) : null,
    hata_kodu: g.hataKodu ?? null,
    ayrinti: g.ayrinti ?? {},
  })
  if (!error) return { ok: true }
  return { ok: false, tekrar: String((error as { code?: string }).code) === '23505' || /duplicate|unique/i.test(String((error as { message?: string }).message || '')) }
}

/** Has an attempt with this idempotency key been logged already? (belt and braces next to the unique index) */
export async function denemeVarMi(sb: SupabaseClient, doktorId: string, idemAnahtar: string): Promise<boolean> {
  const { data, error } = await sb.from(GUNLUK).select('id').eq('doctor_id', doktorId).eq('yon', 'giden').eq('durum', 'deneniyor').eq('idem_anahtar', idemAnahtar).limit(1)
  if (error) return true // cannot tell → treat as "already tried": at most once beats twice
  return (data || []).length > 0
}
