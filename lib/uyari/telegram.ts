/**
 * Operasyon uyarıları. Bot anahtarı ve sohbet kimliği yalnız ortam değişkeninden okunur
 * (TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_CHAT_ID). Tanımlı değilse gönderim yapılmaz
 * ve başarı dönülmez.
 */
const UST_SINIR = 3500

export async function telegramGonder(text: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  const mesaj = text.trim()
  if (!botToken || !chatId || !mesaj) return false
  try {
    const yanit = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: mesaj.slice(0, UST_SINIR),
      }),
    })
    return yanit.ok
  } catch {
    return false
  }
}
