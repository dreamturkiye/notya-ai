/**
 * NOTYA-ILETISIM-03 — Cloud API şablon mesajı, doktorun kendi phone_number_id'sinden.
 *
 * Yalnız onaylı şablonla gönderilir (serbest metin YOK): hasta 24 saattir yazmamışsa Meta zaten
 * serbest metni reddeder, ve şablon metni klinik ayrıntı taşımadığı için KVKK sınırı da burada kalır.
 */
import { normalizeTrPhoneE164 } from '@/lib/doktor/twilioNotify'
import { graph, GraphHatasi, type FetchFn } from './graph'
import { SABLONLAR, SAGLIKIM_KOK, type SablonKodu } from './sablonlar'

export type GonderSonucu = { ok: true; disId?: string } | { ok: false; hata: string }

export function sablonMesajiKur(sablonKodu: SablonKodu, alici: string, degiskenler: string[]): { govde: Record<string, unknown> } | { hata: string } {
  const t = SABLONLAR[sablonKodu]
  if (!t) return { hata: 'Bilinmeyen WhatsApp şablonu.' }
  if (degiskenler.length !== t.degiskenler.length || degiskenler.some((d) => !String(d || '').trim())) {
    return { hata: `Şablon ${t.degiskenler.length} bilgi bekliyor: ${t.degiskenler.join(', ')}.` }
  }
  // WhatsApp değişkenlerinde satır sonu/sekme ve 4+ ardışık boşluk kabul edilmez.
  const temiz = degiskenler.map((d) => String(d).replace(/[\r\n\t]+/g, ' ').replace(/ {4,}/g, ' ').trim())
  const components: Record<string, unknown>[] = []
  let govdeDegiskenleri = temiz
  if (t.dugme) {
    const link = temiz[temiz.length - 1]
    if (!link.startsWith(SAGLIKIM_KOK) || link.length <= SAGLIKIM_KOK.length) return { hata: 'Sağlığım bağlantısı geçersiz.' }
    govdeDegiskenleri = temiz.slice(0, -1)
    components.push({ type: 'body', parameters: govdeDegiskenleri.map((text) => ({ type: 'text', text })) })
    components.push({ type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: link.slice(SAGLIKIM_KOK.length) }] })
  } else {
    components.push({ type: 'body', parameters: govdeDegiskenleri.map((text) => ({ type: 'text', text })) })
  }
  const to = normalizeTrPhoneE164(alici)
  if (!to) return { hata: 'Telefon numarası geçersiz.' }
  return {
    govde: {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to.slice(1),
      type: 'template',
      template: { name: t.kod, language: { code: 'tr' }, components },
    },
  }
}

export async function sablonGonder(
  b: { phoneNumberId: string; token: string },
  sablonKodu: SablonKodu,
  alici: string,
  degiskenler: string[],
  f: FetchFn = fetch
): Promise<GonderSonucu> {
  const m = sablonMesajiKur(sablonKodu, alici, degiskenler)
  if ('hata' in m) return { ok: false, hata: m.hata }
  try {
    const r = await graph<{ messages?: { id?: string }[] }>(`${b.phoneNumberId}/messages`, { method: 'POST', token: b.token, body: m.govde }, f)
    const disId = r.messages?.[0]?.id
    return disId ? { ok: true, disId: String(disId) } : { ok: true }
  } catch (e) {
    if (e instanceof GraphHatasi) return { ok: false, hata: hataMetni(e) }
    return { ok: false, hata: 'WhatsApp şu an ulaşılamıyor.' }
  }
}

/** Meta hata kodlarını doktorun anlayacağı Türkçeye çevirir (kod listesi: Cloud API error codes). */
export function hataMetni(e: GraphHatasi): string {
  switch (e.kod) {
    case 190: return 'WhatsApp bağlantısının süresi dolmuş. Lütfen yeniden bağlayın.'
    case 131026: return 'Bu numara WhatsApp kullanmıyor olabilir.'
    case 132001: return 'Mesaj şablonu henüz onaylanmadı.'
    case 132015: case 132016: return 'Mesaj şablonu Meta tarafından durduruldu.'
    case 131047: return 'Hasta 24 saattir yazmadığı için yalnız onaylı şablon gönderilebilir.'
    case 130429: case 131056: return 'Çok hızlı gönderim; birazdan yeniden denenecek.'
    case 131042: return 'WhatsApp ödeme yöntemi eksik. İşletme hesabınızı kontrol edin.'
    default: return `WhatsApp mesajı gönderilemedi (${e.kod ?? e.durum}).`
  }
}
