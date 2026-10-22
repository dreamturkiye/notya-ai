/**
 * NOTYA-ULKE-EKLER-01 — evaluates ONE already-masked document image of one of THIS doctor's visits.
 *
 * PATIENT ISOLATION (.cursor/skills/hasta-izolasyon/SKILL.md). Service-role client, so this file is the isolation:
 * the visit id from the request is read WITH the doctor's id in the same query (muayeneGetir) before anything else;
 * the patient comes from that visit row, never from the request, and is read with the doctor's id again. A foreign
 * visit id is "not found". What leaves for the model: the masked image, and age + sex. No name, no number, no id.
 *
 * NOTHING IS STORED here: no file, no result, no row. The browser keeps the document; the result goes back to it and
 * is written into the note only by the note's own routes (lib/ulke/uygulama/notlar.ts).
 *
 * The image must be the browser's masked copy; the server cannot see whether it was masked, only that it is a small
 * JPEG/PNG/WebP (checked by its first bytes, not by the declared type alone).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { AKTIF_KLINIK } from '@/countries/active/klinik'
import { uygulamaDiliMi } from '../ulke'
import { modeldenBelge } from '../uygulama/notModeli'
import { hastaGetir } from '../uygulama/hastalar'
import { muayeneGetir } from '../uygulama/muayeneKaydi'
import { ulkeTablosu } from '../uygulama/tablolar'
import { EK_GORSEL_AZAMI_B64, EK_TURU_SECIMLERI, type EkSonucu, type EkTuruSecimi } from './ekler'
import { belgeBaglami, belgeSonucunuOku, belgeTalimati } from './belgeTalimati'

export type BelgeRetKodu = 'NOT_FOUND' | 'GECERSIZ' | 'HAZIR_DEGIL' | 'DEGERLENDIRILEMEDI' | 'DUSUK_KALITE'
export const BELGE_DURUMU: Record<BelgeRetKodu, number> = { NOT_FOUND: 404, GECERSIZ: 400, HAZIR_DEGIL: 503, DEGERLENDIRILEMEDI: 502, DUSUK_KALITE: 422 }

type Mime = 'image/jpeg' | 'image/png' | 'image/webp'

/** The type of an image by its first bytes: JPEG, PNG or WebP — or null. */
export function gorselTuru(base64: string): Mime | null {
  const bas = Buffer.from(base64.slice(0, 24), 'base64')
  if (bas.length >= 3 && bas[0] === 0xff && bas[1] === 0xd8 && bas[2] === 0xff) return 'image/jpeg'
  if (bas.length >= 8 && bas.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png'
  if (bas.length >= 12 && bas.subarray(0, 4).toString('latin1') === 'RIFF' && bas.subarray(8, 12).toString('latin1') === 'WEBP') return 'image/webp'
  return null
}

/** Age in whole years and in months from 'YYYY-MM-DD'. null when it is not a date. Pure. */
export function yasHesapla(dogum: string, simdi: Date = new Date()): { yil: number; ay: number } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dogum)) return null
  const d = new Date(`${dogum}T00:00:00Z`)
  if (Number.isNaN(d.getTime()) || d.getTime() > simdi.getTime()) return null
  const ay = (simdi.getUTCFullYear() - d.getUTCFullYear()) * 12 + (simdi.getUTCMonth() - d.getUTCMonth()) - (simdi.getUTCDate() < d.getUTCDate() ? 1 : 0)
  return { yil: Math.floor(ay / 12), ay }
}

export async function belgeDegerlendir(
  supabase: SupabaseClient, doktorId: string,
  g: { seansId: string; tur: unknown; base64: unknown },
  butceMs?: number,
): Promise<{ tamam: true; sonuc: EkSonucu } | { tamam: false; kod: BelgeRetKodu }> {
  if (!AKTIF_KLINIK) return { tamam: false, kod: 'HAZIR_DEGIL' }
  const tur = (EK_TURU_SECIMLERI as readonly unknown[]).includes(g.tur) ? (g.tur as EkTuruSecimi) : null
  const b64 = typeof g.base64 === 'string' ? g.base64 : ''
  if (!tur || !b64 || b64.length > EK_GORSEL_AZAMI_B64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(b64)) return { tamam: false, kod: 'GECERSIZ' }
  const mime = gorselTuru(b64)
  if (!mime) return { tamam: false, kod: 'GECERSIZ' }

  // ISOLATION: the visit and its patient are each read with the doctor's id; a foreign id is "not found".
  const muayene = await muayeneGetir(supabase, doktorId, g.seansId)
  if (!muayene || !muayene.hasta) return { tamam: false, kod: 'NOT_FOUND' }
  const hasta = await hastaGetir(supabase, doktorId, muayene.hasta.id)
  if (!hasta) return { tamam: false, kod: 'NOT_FOUND' }
  const { data: kayit } = await ulkeTablosu(supabase, 'muayene_dil_kaydi').select('not_dili').eq('session_id', g.seansId).eq('doctor_id', doktorId).maybeSingle()
  const notDili = (kayit as { not_dili?: unknown } | null)?.not_dili
  if (!uygulamaDiliMi(notDili)) return { tamam: false, kod: 'DEGERLENDIRILEMEDI' }

  const yas = yasHesapla(hasta.dogumTarihi)
  const yanit = await modeldenBelge({
    talimat: belgeTalimati(notDili, tur),
    baglam: belgeBaglami(yas?.yil ?? null, yas?.ay ?? null, hasta.cinsiyet),
    mime, base64: b64, doktorId, butceMs,
  })
  const sonuc = yanit === null ? null : belgeSonucunuOku(yanit)
  if (!sonuc) return { tamam: false, kod: 'DEGERLENDIRILEMEDI' }
  if (sonuc.kalite === 'dusuk') return { tamam: false, kod: 'DUSUK_KALITE' }
  // The doctor's own choice of type wins over the reader's guess.
  return { tamam: true, sonuc: tur === 'auto' ? sonuc : { ...sonuc, tur } }
}
