/**
 * NOTYA-MESLEKTAS-V2 Faz 3 — hasta dosya önbelleği.
 * Anahtar her zaman (doctor_id, patient_id). Arşiv derlemede zaten dışarıda.
 * Okuma: taze satır varsa derive yok. Yazma: kirli=true.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { createHash } from 'node:crypto'
import { hastaDosyaPaketiniDerle } from '@/lib/doktor/hastaDosyaDerleyici'
import { dosyaSorguVerisiDerle } from '@/lib/doktor/dosyaOlaylari'
import type { HastaDosyaKart } from '@/lib/doktor/hastaDosyaKart'
import type { DosyaOlayi } from '@/lib/doktor/dosyaOlaylari'

export interface OnbellekPaket {
  metin: string
  kart: HastaDosyaKart | Record<string, unknown>
  ad: string
  olaylar: DosyaOlayi[] | unknown[]
  sorguHasta?: unknown
  surumHash: string
  onbellekten: boolean
}

export function surumHash(metin: string, olaylar: unknown): string {
  return createHash('sha256').update(JSON.stringify({ metin, olaylar })).digest('hex').slice(0, 24)
}

export function onbellekAnahtari(doctorId: string, patientId: string): { doctor_id: string; patient_id: string } {
  return { doctor_id: doctorId, patient_id: patientId }
}

export function tazeMi(satir: { kirli?: boolean; paket_metin?: string; kart_json?: unknown } | null, simdi: Date = new Date()): boolean {
  if (!satir || satir.kirli !== false || !satir.paket_metin) return false
  return !sonrakiRandevuGecmisMi((satir.kart_json as { randevu?: unknown } | null)?.randevu, simdi)
}

const TR_AY: Record<string, number> = { ocak: 1, şubat: 2, mart: 3, nisan: 4, mayıs: 5, haziran: 6, temmuz: 7, ağustos: 8, eylül: 9, ekim: 10, kasım: 11, aralık: 12 }
/**
 * NOTYA-AYSE-100 D2: the packet is invalidated by data changes (kirli), never by time passing — a chart compiled the
 * day before an appointment kept "Sonraki randevu: 27 Eylül" as the NEXT appointment days later (live: O.B.,
 * 2026-09-29). A card whose next appointment is before today is stale; recompile.
 */
export function sonrakiRandevuGecmisMi(randevu: unknown, simdi: Date = new Date()): boolean {
  const m = String(randevu || '').match(/^(\d{1,2}) (\p{L}+) (20\d{2})/u)
  if (!m) return false
  const ay = TR_AY[m[2].toLocaleLowerCase('tr-TR')]
  if (!ay) return false
  const iso = `${m[3]}-${String(ay).padStart(2, '0')}-${m[1].padStart(2, '0')}`
  const bugunTrt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(simdi)
  return iso < bugunTrt
}

export async function onbellekKirlet(sb: SupabaseClient, doctorId: string, patientId: string): Promise<void> {
  if (!doctorId || !patientId) return
  await sb.from('hasta_dosya_onbellek').upsert({
    doctor_id: doctorId,
    patient_id: patientId,
    kirli: true,
    guncelleme: new Date().toISOString(),
  }, { onConflict: 'doctor_id,patient_id' })
}

export async function onbellekOku(
  sb: SupabaseClient,
  doctorId: string,
  patientId: string,
): Promise<OnbellekPaket | null> {
  const { data } = await sb
    .from('hasta_dosya_onbellek')
    .select('paket_metin, hasta_ad, kart_json, olaylar_json, surum_hash, kirli')
    .eq('doctor_id', doctorId)
    .eq('patient_id', patientId)
    .maybeSingle()
  if (!tazeMi(data)) return null
  return {
    metin: String(data!.paket_metin || ''),
    kart: (data!.kart_json || {}) as HastaDosyaKart,
    ad: String((data as { hasta_ad?: string }).hasta_ad || ''),
    olaylar: Array.isArray((data!.olaylar_json as { olaylar?: unknown })?.olaylar)
      ? (data!.olaylar_json as { olaylar: unknown[] }).olaylar
      : Array.isArray(data!.olaylar_json) ? data!.olaylar_json : [],
    sorguHasta: (data!.olaylar_json as { hasta?: unknown } | null)?.hasta,
    surumHash: String(data!.surum_hash || ''),
    onbellekten: true,
  }
}

export async function onbellekYaz(
  sb: SupabaseClient,
  doctorId: string,
  patientId: string,
  paket: Omit<OnbellekPaket, 'onbellekten'>,
): Promise<void> {
  await sb.from('hasta_dosya_onbellek').upsert({
    doctor_id: doctorId,
    patient_id: patientId,
    surum_hash: paket.surumHash,
    paket_metin: paket.metin,
    hasta_ad: paket.ad.slice(0, 80),
    kart_json: paket.kart,
    olaylar_json: { olaylar: paket.olaylar, hasta: paket.sorguHasta || null },
    kirli: false,
    guncelleme: new Date().toISOString(),
  }, { onConflict: 'doctor_id,patient_id' })
}

/** Aynı (doktor, hasta) için eşzamanlı derlemeyi tek uçuşta birleştirir. */
export function tekUcus<T>(harita: Map<string, Promise<T>>, anahtar: string, uret: () => Promise<T>): Promise<T> {
  const varOlan = harita.get(anahtar)
  if (varOlan) return varOlan
  const p = uret().finally(() => {
    if (harita.get(anahtar) === p) harita.delete(anahtar)
  })
  harita.set(anahtar, p)
  return p
}

const ucuslar = new Map<string, Promise<OnbellekPaket | null>>()

async function dosyaPaketDerle(
  sb: SupabaseClient,
  doctorId: string,
  patientId: string,
): Promise<OnbellekPaket | null> {
  const hazir = await onbellekOku(sb, doctorId, patientId)
  if (hazir) return hazir
  const [paket, sorgu] = await Promise.all([
    hastaDosyaPaketiniDerle(sb, doctorId, patientId),
    dosyaSorguVerisiDerle(sb, doctorId, patientId),
  ])
  if (!paket) return null
  const olaylar = sorgu?.olaylar || []
  const hash = surumHash(paket.metin, olaylar)
  const yazilacak = { metin: paket.metin, kart: paket.kart, ad: paket.ad, olaylar, sorguHasta: sorgu?.hasta, surumHash: hash }
  void onbellekYaz(sb, doctorId, patientId, yazilacak).catch(() => { /* yazım kritik değil */ })
  return { ...yazilacak, onbellekten: false }
}

export async function dosyaPaketOnbellekli(
  sb: SupabaseClient,
  doctorId: string,
  patientId: string,
): Promise<OnbellekPaket | null> {
  if (!doctorId || !patientId) return null
  return tekUcus(ucuslar, `${doctorId}:${patientId}`, () => dosyaPaketDerle(sb, doctorId, patientId))
}

/** İlk notun günü cache_read vursun diye sabit SOAP önekini ısıtır. İstek yolunda yok. */
export async function soapOnekIsin(doctorId: string, brans: string): Promise<void> {
  const { aiCagir } = await import('@/lib/ai/cagir')
  const { soapSistemBloklari } = await import('@/lib/doktor/soapUret')
  const bloklar = soapSistemBloklari({ transcript: '.', specialty: brans || 'dahiliye' })
  await aiCagir({
    gorev: 'cikarim',
    doctorId,
    system: bloklar,
    messages: [{ role: 'user', content: '.' }],
    maxTokens: 8,
  })
}

export async function onbellekIsin(
  sb: SupabaseClient,
  doctorId: string,
  patientId: string,
): Promise<'vurdu' | 'yazdi' | 'yok'> {
  const hazir = await onbellekOku(sb, doctorId, patientId)
  if (hazir) return 'vurdu'
  const paket = await dosyaPaketOnbellekli(sb, doctorId, patientId)
  if (!paket) return 'yok'
  return 'yazdi'
}
