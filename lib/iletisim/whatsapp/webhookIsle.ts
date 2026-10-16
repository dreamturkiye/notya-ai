/**
 * WHATSAPP-API-01 — the Meta webhook, one implementation behind two URLs:
 *   /api/whatsapp/webhook             (the URL this feature registers in the Meta app)
 *   /api/iletisim/whatsapp/webhook    (NOTYA-ILETISIM-03's original URL — keeps working, same code)
 *
 * GET  hub.mode=subscribe + hub.verify_token (constant-time) → hub.challenge.
 * POST X-Hub-Signature-256 = HMAC-SHA256(WHATSAPP_APP_SECRET, raw body), constant-time compare. Missing or wrong signature
 *      → 401 and NOTHING is read from the body. Not configured → 503 (fail closed).
 *      Then: delivery receipts + template status + disconnects (depo.ts) → failed deliveries fall back to e-posta
 *      (yedek.ts) → inbound patient messages become structured events and automatic actions (yanit.ts) → the Kalkan
 *      ledger (NOTYA-KALKAN-01) with its fixed-sentence auto-reply silenced for messages this pipeline answered itself.
 * A failure that a retry can fix answers 500 so Meta re-delivers (everything downstream is idempotent); a missing table
 * (migration not applied) is not a failure. Admin alerts go to Telegram, at most one per 10 minutes, with no content.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { telegramGonder } from '@/lib/uyari/telegram'
import { whatsappAyar, YAKINDA_MESAJI } from '@/lib/iletisim/otomatik/whatsapp/ayar'
import { dogrulamaYaniti, imzaGecerliMi, kalkanAyikla, olaylariAyikla } from '@/lib/iletisim/otomatik/whatsapp/webhook'
import { TABLO, webhookOlaylariniIsle } from '@/lib/iletisim/otomatik/whatsapp/depo'
import type { FetchFn } from '@/lib/iletisim/otomatik/whatsapp/graph'
import { basarisizTeslimYedegi } from './yedek'
import { yanitIsle } from './yanit'
import type { SiniflandirmaFn } from './niyet'

export interface WebhookDeps {
  sb?: () => SupabaseClient
  env?: NodeJS.ProcessEnv
  llm?: SiniflandirmaFn
  fetch?: FetchFn
  alarm?: (metin: string) => Promise<unknown>
  simdi?: Date
}

export type WebhookYaniti = { status: number; json?: Record<string, unknown>; text?: string }

let sonAlarm = 0
const ALARM_ARALIGI_MS = 10 * 60 * 1000
async function alarmVer(deps: WebhookDeps, metin: string): Promise<void> {
  const simdi = (deps.simdi ?? new Date()).getTime()
  if (simdi - sonAlarm < ALARM_ARALIGI_MS) return
  sonAlarm = simdi
  try { await (deps.alarm ?? telegramGonder)(`[Notya WhatsApp] ${metin}`) } catch { /* the alert is best effort */ }
}
/** Test seam: forget the alert throttle. */
export function alarmSayaciniSifirla(): void { sonAlarm = 0 }

export function webhookDogrula(params: URLSearchParams, deps: Pick<WebhookDeps, 'env'> = {}): WebhookYaniti {
  const ayar = whatsappAyar(deps.env)
  if (!ayar) return { status: 503, json: { error: YAKINDA_MESAJI } }
  const challenge = dogrulamaYaniti(params, ayar.verifyToken)
  if (challenge === null) return { status: 403, json: { error: 'Doğrulama başarısız.' } }
  return { status: 200, text: challenge }
}

export async function webhookIsle(ham: string, imza: string | null, deps: WebhookDeps = {}): Promise<WebhookYaniti> {
  const ayar = whatsappAyar(deps.env)
  if (!ayar) return { status: 503, json: { error: YAKINDA_MESAJI } }
  if (!imzaGecerliMi(ham, imza, ayar.appSecret)) {
    // A wrong secret after a key rotation rejects EVERY real Meta call: tell the admin (throttled, no content).
    await alarmVer(deps, 'Webhook imzası doğrulanamadı. WHATSAPP_APP_SECRET Meta uygulamasındakiyle aynı mı?')
    return { status: 401, json: { error: 'İmza geçersiz.' } }
  }
  let govde: unknown
  try { govde = JSON.parse(ham) } catch { return { status: 200, json: { ok: true } } }

  const sb = (deps.sb ?? servisSupabase)()
  let tekrarGerekli = false
  try {
    const olaylar = olaylariAyikla(govde)
    await webhookOlaylariniIsle(sb, olaylar)
    await basarisizTeslimler(sb, olaylar.teslim, deps)
  } catch (e) {
    console.error('[whatsapp-webhook] teslim/şablon işlenemedi:', e instanceof Error ? e.message : 'bilinmeyen')
    await alarmVer(deps, 'Webhook olayları işlenemedi (teslim/şablon). Vercel loglarına bakın.')
  }
  let yanitlananlar = new Set<string>()
  try {
    const ham2 = kalkanAyikla(govde)
    const ozet = await yanitIsle(sb, ham2, { llm: deps.llm, fetch: deps.fetch, simdi: deps.simdi })
    yanitlananlar = ozet.yanitlananlar
    if (ozet.tekrarGerekli) tekrarGerekli = true
    const { kalkanIsle } = await import('@/lib/iletisim/kalkan/isle')
    await kalkanIsle(sb, ham2, { otomatikYanitAtla: yanitlananlar, simdi: deps.simdi })
  } catch (e) {
    console.error('[whatsapp-webhook] gelen mesaj işlenemedi:', e instanceof Error ? e.message : 'bilinmeyen')
    tekrarGerekli = true
  }
  if (tekrarGerekli) {
    await alarmVer(deps, 'Gelen hasta yanıtı işlenemedi; Meta yeniden deneyecek. Vercel loglarına bakın.')
    return { status: 500, json: { error: 'Geçici hata.' } }
  }
  return { status: 200, json: { ok: true } }
}

async function basarisizTeslimler(sb: SupabaseClient, teslim: ReturnType<typeof olaylariAyikla>['teslim'], deps: WebhookDeps): Promise<void> {
  const gorulen = new Set<string>()
  for (const t of teslim) {
    if (t.durum !== 'failed' || gorulen.has(t.mesajId)) continue
    gorulen.add(t.mesajId)
    const { data } = await sb.from(TABLO).select('doctor_id').eq('phone_number_id', t.phoneNumberId).maybeSingle()
    const doktorId = (data as { doctor_id?: string } | null)?.doctor_id
    if (!doktorId) continue
    await basarisizTeslimYedegi(sb, { doktorId, mesajId: t.mesajId }, { simdi: deps.simdi }).catch(() => undefined)
  }
}
