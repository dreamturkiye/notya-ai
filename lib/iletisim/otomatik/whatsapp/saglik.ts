/**
 * WHATSAPP-API-01 — number health: quality rating, messaging tier, expired token.
 *
 * `GET /{phone_number_id}?fields=quality_rating,messaging_limit_tier` is read at most once an hour per doctor (status
 * route and maintenance cron). The tier feeds the send limit (kota.ts); a revoked/expired token (Meta error 190) marks
 * the connection "hata" — the card asks the doctor to reconnect — and sends ONE Telegram alert per 12 hours.
 * Neither the token nor the response body is logged.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { telegramGonder } from '@/lib/uyari/telegram'
import { baglantiHatasiYaz, saglikYaz, uyariHakkiAl, type Baglanti } from './depo'
import { graph, GraphHatasi, type FetchFn } from './graph'
import { gunlukYaz } from './gunluk'

export const SAGLIK_ARALIK_MS = 60 * 60 * 1000

export type SaglikSonucu = { durum: 'guncel'; tier: string | null; kalite: string | null } | { durum: 'taze' } | { durum: 'token_gecersiz' } | { durum: 'hata' }

export async function adminUyar(sb: SupabaseClient, doktorId: string, metin: string): Promise<void> {
  try {
    if (await uyariHakkiAl(sb, doktorId)) await telegramGonder(`[Notya WhatsApp] ${metin}`)
  } catch { /* an alert must never break the flow it reports on */ }
}

export async function saglikTazele(sb: SupabaseClient, b: Baglanti, f: FetchFn = fetch, simdi: Date = new Date(), zorla = false): Promise<SaglikSonucu> {
  if (!zorla && b.saglikGuncellendi && simdi.getTime() - Date.parse(b.saglikGuncellendi) < SAGLIK_ARALIK_MS) return { durum: 'taze' }
  try {
    const r = await graph<{ quality_rating?: string; messaging_limit_tier?: string }>(b.phoneNumberId, {
      token: b.token,
      query: { fields: 'quality_rating,messaging_limit_tier' },
    }, f)
    const tier = r.messaging_limit_tier ? String(r.messaging_limit_tier).toUpperCase() : null
    const kalite = r.quality_rating ? String(r.quality_rating).toUpperCase() : null
    await saglikYaz(sb, b.doktorId, { tier, kalite })
    if (kalite === 'RED') await adminUyar(sb, b.doktorId, `Kalite puanı KIRMIZI (doktor ${b.doktorId}). Hasta şikâyetleri numarayı kısıtlayabilir.`)
    return { durum: 'guncel', tier, kalite }
  } catch (e) {
    if (e instanceof GraphHatasi && (e.kod === 190 || e.durum === 401)) {
      await tokenGecersiz(sb, b.doktorId)
      return { durum: 'token_gecersiz' }
    }
    return { durum: 'hata' }
  }
}

/** Meta no longer accepts the token. Idempotent; alerts once per 12h. */
export async function tokenGecersiz(sb: SupabaseClient, doktorId: string): Promise<void> {
  await baglantiHatasiYaz(sb, doktorId, 'WhatsApp bağlantısının süresi dolmuş. Lütfen yeniden bağlayın.')
  await gunlukYaz(sb, { doktorId, yon: 'olay', tur: 'token_hatasi', durum: 'olay' }).catch(() => undefined)
  await adminUyar(sb, doktorId, `Erişim anahtarı geçersiz/süresi dolmuş (doktor ${doktorId}). Hekimden yeniden bağlaması istendi.`)
}
