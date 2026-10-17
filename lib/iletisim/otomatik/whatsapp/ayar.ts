/**
 * NOTYA-ILETISIM-03 — WhatsApp (Meta Cloud API, doktorun kendi numarası) ortam ayarları.
 *
 * Özellik, ortam değişkenleri tanımlanana kadar kapalı ve zararsızdır (fail closed): `whatsappAyar()` null
 * döner, rotalar 503 + Türkçe mesaj, bileşen "kurulum bekleniyor" durumunu çizer.
 * Kurulum: docs/iletisim-kurulum-whatsapp.md.
 */

/**
 * Graph API sürümü — Embedded Signup ve coexistence belgelerinin önerdiği sürüm (v25.0, 29.07.2028'e dek
 * destekli; en yenisi v26.0). Yükseltmek tek satır. https://developers.facebook.com/docs/graph-api/changelog
 */
export const GRAPH_SURUM = 'v25.0'
export const GRAPH_KOK = `https://graph.facebook.com/${GRAPH_SURUM}`

export interface WhatsAppAyar {
  appId: string
  appSecret: string
  configId: string
  verifyToken: string
}

function temiz(v: string | undefined): string {
  return String(v || '').trim().replace(/^["']|["']$/g, '').trim()
}

/**
 * WHATSAPP-API-01: the canonical names are WHATSAPP_APP_ID / WHATSAPP_APP_SECRET / WHATSAPP_ES_CONFIG_ID /
 * WHATSAPP_VERIFY_TOKEN (.env.example). The older META_* / WHATSAPP_WEBHOOK_VERIFY_TOKEN names from
 * NOTYA-ILETISIM-03 keep working so a deployment that already set them does not break.
 */
export function whatsappAyar(env: NodeJS.ProcessEnv = process.env): WhatsAppAyar | null {
  const appId = temiz(env.WHATSAPP_APP_ID) || temiz(env.META_APP_ID)
  const appSecret = temiz(env.WHATSAPP_APP_SECRET) || temiz(env.META_APP_SECRET)
  const configId = temiz(env.WHATSAPP_ES_CONFIG_ID) || temiz(env.META_ES_CONFIG_ID)
  const verifyToken = temiz(env.WHATSAPP_VERIFY_TOKEN) || temiz(env.WHATSAPP_WEBHOOK_VERIFY_TOKEN)
  // Şifreleme anahtarı yoksa anahtar saklanamaz — bağlamayı hiç açma.
  if (!appId || !appSecret || !configId || !verifyToken || !temiz(env.ENCRYPTION_MASTER_KEY)) return null
  return { appId, appSecret, configId, verifyToken }
}

/** 503 body while the Meta app is not configured. The card shows the "kurulum bekleniyor" state, never a fake "connected". */
export const YAKINDA_MESAJI = 'WhatsApp otomatik gönderimi için kurulum bekleniyor.'

/** Which required variables are missing (names only, never values) — for the maintenance cron's admin alert. */
export function eksikAyarlar(env: NodeJS.ProcessEnv = process.env): string[] {
  const eksik: string[] = []
  if (!temiz(env.WHATSAPP_APP_ID) && !temiz(env.META_APP_ID)) eksik.push('WHATSAPP_APP_ID')
  if (!temiz(env.WHATSAPP_APP_SECRET) && !temiz(env.META_APP_SECRET)) eksik.push('WHATSAPP_APP_SECRET')
  if (!temiz(env.WHATSAPP_ES_CONFIG_ID) && !temiz(env.META_ES_CONFIG_ID)) eksik.push('WHATSAPP_ES_CONFIG_ID')
  if (!temiz(env.WHATSAPP_VERIFY_TOKEN) && !temiz(env.WHATSAPP_WEBHOOK_VERIFY_TOKEN)) eksik.push('WHATSAPP_VERIFY_TOKEN')
  if (!temiz(env.ENCRYPTION_MASTER_KEY)) eksik.push('ENCRYPTION_MASTER_KEY')
  return eksik
}
