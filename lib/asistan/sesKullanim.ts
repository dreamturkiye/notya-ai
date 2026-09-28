/**
 * NOTYA-SES-FISH-UCTAN-UCA-01 / SADECE-01 — Ayşe Kaya'nın Fish yolunun kullanım ve gecikme sayaçları
 * (ses_kullanim, migration 110). YALNIZ SAYI: metin, hasta, ses yazılmaz. Kayıt hatası sesi asla düşürmez.
 *
 *   fish      utf8_bayt, karakter      — fish-ses (TTS; sunucu yazar)
 *   fish_asr  ses_saniye               — fish-dinle (ASR; Fish'in döndürdüğü süre, istek başına yukarı yuvarlanmış saniye)
 *   oturum    oturum_saniye            — tarayıcı (görüşmenin duvar saati; dakika başı maliyetin böleni)
 *   gecikme   asr_ms, ilk_soz_ms       — sunucu ölçer (fish-dinle Fish round trip; fish-tur istek → ilk cümle)
 *             soz_sonu_ms, dinle_ms, ilk_ses_ms, toplam_ms — tarayıcı ölçer (FishOturumu TurGecikmesi)
 *
 * HASTA-IZOLASYON-01: satır yalnız oturum id + doctor_id eşleşirse yazılır — başka doktorun oturumuna sayaç açılmaz.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export type SesKaynak = 'fish' | 'fish_asr' | 'oturum' | 'gecikme'
export type GecikmeOlcu = 'asr_ms' | 'ilk_soz_ms' | 'soz_sonu_ms' | 'dinle_ms' | 'ilk_ses_ms' | 'toplam_ms'
export type SesOlcu = 'ses_saniye' | 'oturum_saniye' | 'utf8_bayt' | 'karakter' | GecikmeOlcu
export type SesKullanimSatiri = { kaynak: SesKaynak; olcu: SesOlcu; miktar: number; model?: string | null }

const OLCULER: Record<SesOlcu, SesKaynak[]> = {
  utf8_bayt: ['fish'], karakter: ['fish'],
  ses_saniye: ['fish_asr'],
  oturum_saniye: ['oturum'],
  asr_ms: ['gecikme'], ilk_soz_ms: ['gecikme'], soz_sonu_ms: ['gecikme'], dinle_ms: ['gecikme'], ilk_ses_ms: ['gecikme'], toplam_ms: ['gecikme'],
}
/** Tarayıcının yollayabildiği ölçüler — geri kalanı (Fish bayt/saniye, sunucu gecikmeleri) yalnız sunucu yazar. */
export const ISTEMCI_OLCULERI: ReadonlySet<SesOlcu> = new Set<SesOlcu>(['oturum_saniye', 'soz_sonu_ms', 'dinle_ms', 'ilk_ses_ms', 'toplam_ms'])
/** Tek raporda makul üst sınır (2 saatlik görüşme tavanı + pay); saçma sayı tabloya girmez. */
const UST_SANIYE = 3 * 60 * 60
/** Tek bir tur aşaması için makul üst sınır (ms). */
const UST_MS = 120_000

/** Saf: istemciden gelen sayıları süzer (bilinmeyen ölçü, negatif / sonsuz / tavan üstü sayı atılır). */
export function kullanimSuz(satirlar: unknown): SesKullanimSatiri[] {
  if (!Array.isArray(satirlar)) return []
  const out: SesKullanimSatiri[] = []
  for (const s of satirlar.slice(0, 10)) {
    const r = s as Partial<SesKullanimSatiri>
    const olcu = r?.olcu as SesOlcu
    const kaynak = r?.kaynak as SesKaynak
    const miktar = Number(r?.miktar)
    if (!OLCULER[olcu]?.includes(kaynak)) continue
    if (!Number.isFinite(miktar) || miktar < 0 || (miktar === 0 && kaynak !== 'gecikme')) continue
    if (olcu.endsWith('saniye') && miktar > UST_SANIYE) continue
    if (olcu.endsWith('_ms') && miktar > UST_MS) continue
    out.push({ kaynak, olcu, miktar: Math.round(miktar * 1000) / 1000, model: r.model ? String(r.model).slice(0, 60) : null })
  }
  return out
}

export type SesKullanimSonucu = 'tamam' | 'oturum_yok' | 'hata'

export async function sesKullanimYaz(supabase: SupabaseClient, doktorId: string, oturumId: string, satirlar: SesKullanimSatiri[]): Promise<SesKullanimSonucu> {
  if (!oturumId) return 'oturum_yok'
  try {
    const { data } = await supabase.from('asistan_sessions').select('id').eq('id', oturumId).eq('doctor_id', doktorId).maybeSingle()
    if (!data) return 'oturum_yok'
    if (!satirlar.length) return 'tamam'
    const { error } = await supabase.from('ses_kullanim').insert(satirlar.map((s) => ({
      doctor_id: doktorId, asistan_session_id: oturumId, kaynak: s.kaynak, olcu: s.olcu, miktar: s.miktar, model: s.model ?? null,
    })))
    if (error) console.error('[ses-kullanim] yazılamadı', error.code, error.message)
    return error ? 'hata' : 'tamam'
  } catch {
    return 'hata'
  }
}

/**
 * NOTYA-SES-FISH-SADECE-01: bir tur aşamasının gecikmesi — Vercel günlüğüne tek satır (metin/hasta yok) + ses_kullanim.
 * Günlük satırı tablo yazılamasa da (migration uygulanmadıysa) ölçümü görünür kılar.
 */
export function sesGecikmesiYaz(supabase: SupabaseClient, doktorId: string, oturumId: string, olculer: Partial<Record<GecikmeOlcu, number>>, model?: string | null): Promise<SesKullanimSonucu> {
  const satirlar = kullanimSuz(Object.entries(olculer).map(([olcu, miktar]) => ({ kaynak: 'gecikme', olcu, miktar, model })))
  if (satirlar.length) console.info(`[ses-gecikme] ${satirlar.map((s) => `${s.olcu}=${Math.round(s.miktar)}`).join(' ')}`)
  return sesKullanimYaz(supabase, doktorId, oturumId, satirlar)
}

/** Sayaç yanıttan sonra yazılır (ses yolunu bekletmez); Vercel işlevi dondurmasın diye waitUntil (sesTuru.ts ile aynı desen). */
export function arkadaYaz(p: Promise<unknown>): void {
  try {
    const mod = require('@vercel/functions') as { waitUntil?: (x: Promise<unknown>) => void }
    if (mod.waitUntil) mod.waitUntil(p)
    else void p
  } catch { void p /* yerel çalışma: söz zaten sürer */ }
}
