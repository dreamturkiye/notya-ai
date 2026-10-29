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
  // NOTYA-MESLEKTAS-V2-FAZ3-KALDIRILDI (2026-10-01): onbellek tablosuna artik yazilmiyor, no-op.
  void sb; void doctorId; void patientId
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
  // NOTYA-MESLEKTAS-V2-FAZ3-KALDIRILDI (Kaan karari, 2026-10-01): onbellek okuma/yazma kaldirildi -
  // olculen veride onbellekli=true turlar daha yavasti (sohbet gorevi, 7 gunluk pencere: p95 24.6s vs 12.1s).
  // Her tur artik dogrudan canli derleniyor.
  const [paket, sorgu] = await Promise.all([
    hastaDosyaPaketiniDerle(sb, doctorId, patientId),
    dosyaSorguVerisiDerle(sb, doctorId, patientId),
  ])
  if (!paket) return null
  const olaylar = sorgu?.olaylar || []
  const hash = surumHash(paket.metin, olaylar)
  const yazilacak = { metin: paket.metin, kart: paket.kart, ad: paket.ad, olaylar, sorguHasta: sorgu?.hasta, surumHash: hash }
  return { ...yazilacak, onbellekten: false }
}

/**
 * SES-OMURGA-V2 (E, Kaan 2026-10-29) — compiled chart cache, back with a version stamp.
 *
 * The 2026-10-01 removal was right for the OLD cache (a DB table, slower than compiling, invalidated by a `kirli` flag
 * nobody set reliably). The cost it left: every voice turn recompiled the chart — ~24 queries + decryption, 0 of 111
 * turns cached. This cache is different:
 *   - in-process LRU (no DB round trip to read it), keyed by (doctor, patient) — a package compiled with one doctor's
 *     doctor-scoped queries can never be served to another doctor or for another patient;
 *   - valid only while the patient's version stamp is unchanged. `hasta_dosya_surum` is bumped by a trigger on every
 *     table the package reads (migration 183), so any write — note, vaccine, medication, lab, appointment, form,
 *     archive — invalidates it on every instance;
 *   - and at most TTL old and never across a TRT day boundary (age and "next appointment" are day-relative).
 * The version comes free with the voice route's turn RPC (`surumler`); other callers read it with one small query.
 */
export const DOSYA_ONBELLEK_TTL_MS = 10 * 60 * 1000
const DOSYA_ONBELLEK_AZAMI = 60
type DosyaOnbellekKaydi = { surum: number; zaman: number; gun: string; paket: OnbellekPaket }
const dosyaOnbellegi = new Map<string, DosyaOnbellekKaydi>()

function trtGunu(simdi: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(simdi)
}

/** Test helper. */
export function dosyaOnbelleginiSil(): void {
  dosyaOnbellegi.clear()
}

/** The patient's chart version (0 when never bumped). null = unknown (table missing / error) — do not cache. */
export async function dosyaSurumuOku(sb: SupabaseClient, patientId: string): Promise<number | null> {
  try {
    const { data, error } = await sb.from('hasta_dosya_surum').select('surum').eq('patient_id', patientId).maybeSingle()
    if (error) return null
    return Number((data as { surum?: number } | null)?.surum ?? 0)
  } catch {
    return null
  }
}

export async function dosyaPaketOnbellekli(
  sb: SupabaseClient,
  doctorId: string,
  patientId: string,
  surumler?: Record<string, number> | null,
): Promise<OnbellekPaket | null> {
  if (!doctorId || !patientId) return null
  const anahtar = `${doctorId}:${patientId}`
  const surum = surumler && Object.prototype.hasOwnProperty.call(surumler, patientId)
    ? Number(surumler[patientId])
    : await dosyaSurumuOku(sb, patientId)
  const simdi = new Date()
  if (surum !== null) {
    const k = dosyaOnbellegi.get(anahtar)
    if (k && k.surum === surum && simdi.getTime() - k.zaman < DOSYA_ONBELLEK_TTL_MS && k.gun === trtGunu(simdi)
      && !sonrakiRandevuGecmisMi((k.paket.kart as { randevu?: unknown } | null)?.randevu, simdi)) {
      dosyaOnbellegi.delete(anahtar)
      dosyaOnbellegi.set(anahtar, k)
      return { ...k.paket, onbellekten: true }
    }
  }
  const paket = await tekUcus(ucuslar, anahtar, () => dosyaPaketDerle(sb, doctorId, patientId))
  if (paket && surum !== null) {
    dosyaOnbellegi.delete(anahtar)
    dosyaOnbellegi.set(anahtar, { surum, zaman: simdi.getTime(), gun: trtGunu(simdi), paket: { ...paket, onbellekten: false } })
    while (dosyaOnbellegi.size > DOSYA_ONBELLEK_AZAMI) {
      const ilk = dosyaOnbellegi.keys().next().value
      if (ilk === undefined) break
      dosyaOnbellegi.delete(ilk)
    }
  }
  return paket
}

/** İlk notun günü cache_read vursun diye sabit SOAP önekini ısıtır. İstek yolunda yok. */
export async function soapOnekIsin(doctorId: string, brans: string): Promise<void> {
  const { aiCagir } = await import('@/lib/ai/cagir')
  const { soapSistemBloklari } = await import('@/lib/doktor/soapUret')
  const bloklar = soapSistemBloklari({ transcript: '.', specialty: brans || 'dahiliye' })
  await aiCagir({
    // SES-OMURGA-V2 (H): not a learning call — kept out of the `cikarim` truncation stats (an 8-token warm-up is always cut).
    gorev: 'kisa-yanit',
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
  // NOTYA-MESLEKTAS-V2-FAZ3-KALDIRILDI (2026-10-01): isitilacak onbellek yok, no-op.
  void sb; void doctorId; void patientId
  return 'yok'
}
