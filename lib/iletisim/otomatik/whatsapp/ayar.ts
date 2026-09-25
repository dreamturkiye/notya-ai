/**
 * NOTYA-ILETISIM-03 — WhatsApp (Meta Cloud API, doktorun kendi numarası) ortam ayarları.
 *
 * Özellik, ortam değişkenleri tanımlanana kadar görünmez ve zararsızdır: `whatsappAyar()` null
 * döner, rotalar 503 + Türkçe mesaj, bileşen sakin bir "Yakında" satırı çizer.
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

export function whatsappAyar(env: NodeJS.ProcessEnv = process.env): WhatsAppAyar | null {
  const appId = temiz(env.META_APP_ID)
  const appSecret = temiz(env.META_APP_SECRET)
  const configId = temiz(env.META_ES_CONFIG_ID)
  const verifyToken = temiz(env.WHATSAPP_WEBHOOK_VERIFY_TOKEN)
  // Şifreleme anahtarı yoksa anahtar saklanamaz — bağlamayı hiç açma.
  if (!appId || !appSecret || !configId || !verifyToken || !temiz(env.ENCRYPTION_MASTER_KEY)) return null
  return { appId, appSecret, configId, verifyToken }
}

export const YAKINDA_MESAJI = 'WhatsApp ile otomatik gönderim yakında açılacak.'
