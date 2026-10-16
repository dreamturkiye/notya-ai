/**
 * WHATSAPP-API-01 — free-text reply INSIDE the patient's 24-hour session window.
 *
 * Meta allows a non-template message only within 24 hours of the patient's last message. Used for (a) the fixed
 * confirmation sentences of the automatic actions and (b) the doctor's "Yanıtla" on an inbox card. Outside the window the
 * caller falls back to the generic template (genel_bildirim) — see eylem.ts. Every message is audit-logged first
 * ("deneniyor"), idempotent per key, and its body is stored encrypted only. Replies inside the window are service
 * conversations: they do not use the business-initiated tier quota (kota.ts).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { graph, GraphHatasi, type FetchFn } from '@/lib/iletisim/otomatik/whatsapp/graph'
import { denemeVarMi, gunlukYaz, karsiTarafIzi, GUNLUK } from '@/lib/iletisim/otomatik/whatsapp/gunluk'
import { tokenGecersiz } from '@/lib/iletisim/otomatik/whatsapp/saglik'


export const OTURUM_PENCERESI_MS = 24 * 3600_000

/** Sabit, klinik içermeyen cümleler (otomatik eylemler). */
export const SABIT = {
  onay: 'Teşekkürler, randevunuz onaylandı. Görüşmek üzere.',
  iptal: 'Randevunuz iptal edildi. Yeni randevu için bizimle iletişime geçebilirsiniz.',
  vazgec: 'Anlaşıldı. Bundan sonra size otomatik WhatsApp mesajı göndermeyeceğiz.',
  secimAlindi: 'Seçiminiz iletildi. Hekimimiz onayladığında size bildirilecektir.',
} as const

/** Has this number written to the doctor's line within the last 24 hours? */
export async function pencereAcikMi(sb: SupabaseClient, doktorId: string, numara: string, simdi: Date = new Date()): Promise<boolean> {
  const { data, error } = await sb.from(GUNLUK).select('created_at')
    .eq('doctor_id', doktorId).eq('yon', 'gelen').eq('karsi_taraf_hash', karsiTarafIzi(numara))
    .gte('created_at', new Date(simdi.getTime() - OTURUM_PENCERESI_MS).toISOString()).limit(1)
  return !error && (data || []).length > 0
}

export type OturumGonderSonucu = { ok: true; wamid: string | null } | { ok: false; hata: string; belirsiz?: boolean; pencereKapali?: boolean }

export async function oturumMetniGonder(
  sb: SupabaseClient,
  b: { doktorId: string; phoneNumberId: string; token: string },
  g: { to: string; metin: string; tur: string; idemAnahtar: string; hastaId?: string | null; kaynakWamid?: string | null },
  f: FetchFn = fetch,
  simdi: Date = new Date(),
): Promise<OturumGonderSonucu> {
  const metin = String(g.metin || '').trim().slice(0, 1000)
  const to = String(g.to || '').replace(/\D/g, '')
  if (!metin || !to) return { ok: false, hata: 'Mesaj ya da numara boş.' }
  if (!(await pencereAcikMi(sb, b.doktorId, to, simdi))) return { ok: false, hata: 'Hasta 24 saattir yazmadığı için serbest mesaj gönderilemez.', pencereKapali: true }
  if (await denemeVarMi(sb, b.doktorId, g.idemAnahtar)) return { ok: false, hata: 'Bu mesaj zaten gönderildi ya da gönderiliyor.' }
  const iz = { doktorId: b.doktorId, patientId: g.hastaId ?? null, yon: 'giden' as const, tur: g.tur, karsiTaraf: to, kaynakWamid: g.kaynakWamid ?? null, idemAnahtar: g.idemAnahtar }
  const deneme = await gunlukYaz(sb, { ...iz, durum: 'deneniyor' })
  if (!deneme.ok) return { ok: false, hata: deneme.tekrar ? 'Bu mesaj zaten gönderildi ya da gönderiliyor.' : 'WhatsApp kaydı şu an hazır değil; mesaj gönderilmedi.' }
  try {
    const r = await graph<{ messages?: { id?: string }[] }>(`${b.phoneNumberId}/messages`, {
      method: 'POST', token: b.token,
      body: { messaging_product: 'whatsapp', recipient_type: 'individual', to, type: 'text', text: { body: metin } },
    }, f)
    const wamid = r.messages?.[0]?.id ? String(r.messages[0].id) : null
    await gunlukYaz(sb, { ...iz, durum: 'gonderildi', wamid, govde: metin })
    return { ok: true, wamid }
  } catch (e) {
    if (e instanceof GraphHatasi) {
      const belirsiz = e.durum >= 500 && e.kod == null
      await gunlukYaz(sb, { ...iz, durum: belirsiz ? 'belirsiz' : 'basarisiz', govde: metin, hataKodu: String(e.kod ?? e.durum) })
      if (e.kod === 190) await tokenGecersiz(sb, b.doktorId)
      if (e.kod === 131047) return { ok: false, hata: 'Hasta 24 saattir yazmadığı için serbest mesaj gönderilemez.', pencereKapali: true }
      return { ok: false, hata: e.kod === 190 ? 'WhatsApp bağlantısının süresi dolmuş. Lütfen yeniden bağlayın.' : `WhatsApp mesajı gönderilemedi (${e.kod ?? e.durum}).`, belirsiz }
    }
    await gunlukYaz(sb, { ...iz, durum: 'belirsiz', govde: metin })
    return { ok: false, hata: 'WhatsApp şu an ulaşılamıyor.', belirsiz: true }
  }
}
