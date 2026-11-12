/**
 * WHATSAPP-ONBURO-01 — server side of the settings: read / save the doctor's own row, the working-hours default of the
 * sheet, and the limits every automatic reply respects.
 *
 * Fail-soft until migration 195 is applied: a missing table reads as the OFF default and cannot be saved, so nothing of
 * the front desk runs. Every read and write carries the doctor id (the row is the doctor's own; no patient data in it).
 *
 * LIMITS (counted from the append-only WhatsApp audit log, so they survive restarts and need no extra table):
 *   • per number: at most NUMARA_SAATLIK automatic front-desk replies an hour — also the loop guard: a number that keeps
 *     triggering replies (a bot, an auto-responder) is handed to the desk instead of being answered for ever;
 *   • per doctor: at most DOKTOR_SAATLIK an hour;
 *   • per doctor: at most MODEL_GUNLUK model calls a day (the rules keep answering after that; the model is not asked).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { tabloYokMu } from '@/lib/iletisim/sunucu'
import { GUNLUK, gunlukYaz } from '@/lib/iletisim/otomatik/whatsapp/gunluk'
import { calismaSaatleriGetir } from '@/lib/randevu/v2/sunucu'
import { TABLO_AYAR, VARSAYILAN_ON_BURO, onBuroNormalize, onBuroSatiri, type OnBuroAyari } from './ayar'
import type { OnBuroDili } from './dil/tipler'

type Sb = SupabaseClient

/** audit-log `tur` of every message the front desk sends by itself. */
export const TUR_ON_BURO = 'on_buro'
/** audit-log `tur` of one model call (an event row, no content). */
export const TUR_MODEL = 'on_buro_model'

export const NUMARA_SAATLIK = 8
export const DOKTOR_SAATLIK = 200
export const MODEL_GUNLUK = 100
/** How many times new times are proposed in one conversation before the desk takes over. */
export const ONERI_SINIRI = 4
/**
 * Proposed times start this many minutes after the doctor's minimum notice: a time offered at the very edge of the notice
 * window would stop being bookable while the patient is still typing "1".
 */
export const ONERI_PAYI_DK = 30

export async function onBuroAyarGetir(sb: Sb, doktorId: string): Promise<{ ayar: OnBuroAyari; hazir: boolean }> {
  const { data, error } = await sb.from(TABLO_AYAR).select('randevu_modu, yanit_acik, bilgi').eq('doctor_id', doktorId).maybeSingle()
  if (error) return { ayar: VARSAYILAN_ON_BURO, hazir: !tabloYokMu(error) }
  return { ayar: data ? onBuroNormalize(data) : VARSAYILAN_ON_BURO, hazir: true }
}

export async function onBuroAyarKaydet(sb: Sb, doktorId: string, ayar: OnBuroAyari): Promise<{ ok: true } | { ok: false; hazirDegil: boolean }> {
  const { error } = await sb.from(TABLO_AYAR).upsert(onBuroSatiri(doktorId, ayar), { onConflict: 'doctor_id' })
  if (error) return { ok: false, hazirDegil: tabloYokMu(error) }
  return { ok: true }
}

/** The working plan of the appointment settings as one line — the default of the sheet's "working hours". */
export async function turetilmisSaatler(sb: Sb, doktorId: string, dil: OnBuroDili): Promise<string> {
  try {
    const { gunler } = await calismaSaatleriGetir(sb, doktorId)
    return dil.calismaSaatiMetni(gunler as Record<string, { acik: boolean; baslangic: string; bitis: string }>)
  } catch { return '' }
}

export interface SinirDurumu { numara: boolean; doktor: boolean }

/** true = the limit is reached (no further automatic reply). A read error counts as reached: silence beats a loop. */
export async function yanitSiniri(sb: Sb, doktorId: string, karsiTarafHash: string, simdi: Date): Promise<SinirDurumu> {
  const sinir = new Date(simdi.getTime() - 3600_000).toISOString()
  // One 'deneniyor' row per send attempt (the result is a second, separate row of the append-only log).
  const say = (q: PromiseLike<{ count: number | null; error: unknown }>) => q
  const [n, d] = await Promise.all([
    say(sb.from(GUNLUK).select('id', { count: 'exact', head: true }).eq('doctor_id', doktorId).eq('yon', 'giden').eq('tur', TUR_ON_BURO).eq('durum', 'deneniyor').eq('karsi_taraf_hash', karsiTarafHash).gte('created_at', sinir)),
    say(sb.from(GUNLUK).select('id', { count: 'exact', head: true }).eq('doctor_id', doktorId).eq('yon', 'giden').eq('tur', TUR_ON_BURO).eq('durum', 'deneniyor').gte('created_at', sinir)),
  ])
  return {
    numara: !!n.error || (n.count ?? 0) >= NUMARA_SAATLIK,
    doktor: !!d.error || (d.count ?? 0) >= DOKTOR_SAATLIK,
  }
}

/** May the model be asked once more today for this doctor? Records the call when it may (an event row without content). */
export async function modelHakkiAl(sb: Sb, doktorId: string, simdi: Date): Promise<boolean> {
  const gunBasi = new Date(simdi.getTime() - 24 * 3600_000).toISOString()
  const { count, error } = await sb.from(GUNLUK).select('id', { count: 'exact', head: true }).eq('doctor_id', doktorId).eq('yon', 'olay').eq('tur', TUR_MODEL).gte('created_at', gunBasi)
  if (error || (count ?? 0) >= MODEL_GUNLUK) return false
  const y = await gunlukYaz(sb, { doktorId, yon: 'olay', tur: TUR_MODEL, durum: 'olay' })
  return y.ok
}
