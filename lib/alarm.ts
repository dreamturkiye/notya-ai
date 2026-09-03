/**
 * NOTYA-ALARM-01 — Kritik hata → Kaan'ın WhatsApp'ına (ALERT_WHATSAPP).
 * 5 doktorlu betada bir 500'ü doktordan önce operatörün duyması gerekir.
 * Aynı başlık 10 dakika içinde bir kez gider (süreç-içi tekilleştirme — sunucusuzda
 * mükemmel değil ama fırtınayı keser; Twilio maliyeti ve bildirim yorgunluğu kontrol altında).
 * Asla throw etmez — alarm altyapısı asıl akışı düşüremez.
 */
import { sendTwilioMessage } from '@/lib/doktor/twilioNotify'

const sonGonderim = new Map<string, number>()

export async function kritikAlarm(baslik: string, detay: string): Promise<void> {
  try {
    const hedef = process.env.ALERT_WHATSAPP
    if (!hedef) return
    const simdi = Date.now()
    const once = sonGonderim.get(baslik) || 0
    if (simdi - once < 10 * 60 * 1000) return
    sonGonderim.set(baslik, simdi)
    const govde = `🚨 Notya ALARM — ${baslik}\n${detay.slice(0, 500)}\n${new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })} TRT`
    await sendTwilioMessage({ toPhone: hedef, body: govde, channel: 'whatsapp' })
  } catch (e) {
    console.error('[alarm] gonderilemedi', e)
  }
}
