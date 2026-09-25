/**
 * NOTYA-ILETISIM-03 — Embedded Signup tamamlama (WhatsApp Business uygulaması kullanıcıları, "coexistence").
 *
 * Tarayıcı tek kullanımlık `code` (30 sn yaşar) ile oturum bilgisini (waba_id; varsa phone_number_id,
 * business_id) yollar. Hepsi istek girdisidir: kod sunucuda app id + secret ile işletme anahtarına
 * çevrilir, sonra numara bu anahtarın gördüğü WABA'dan Meta'ya sorularak seçilir/doğrulanır —
 * doğrulanmayan kimlik kaydedilmez. Coexistence FINISH olayı çoğu zaman yalnız waba_id taşır.
 *
 * Coexistence farkları (https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/onboarding-business-app-users):
 *  - Numara zaten WhatsApp Business uygulamasında kayıtlı: `/register` ÇAĞRILMAZ ("skip registration").
 *  - Meta, kişi ve sohbet geçmişi eşitlemesinin 24 saat içinde başlatılmasını şart koşar (yoksa hesap
 *    ayrılır). İki `smb_app_data` çağrısı yapılır; gelen `smb_app_state_sync` / `history` /
 *    `smb_message_echoes` webhook'ları okunmadan atılır — Notya sohbet içeriği SAKLAMAZ.
 * Adımlar ve kaynaklar: docs/iletisim-kurulum-whatsapp.md.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { graph, type FetchFn } from './graph'
import { baglantiKaydet, baglantiOku, baglantiSil, TABLO } from './depo'
import { sablonlariHazirla } from './sablonlar'
import type { WhatsAppAyar } from './ayar'

export interface KurulumGirdisi {
  code: string
  wabaId: string
  phoneNumberId: string | null
  businessId: string | null
}

const KIMLIK = /^\d{5,25}$/

export function kurulumGirdisiDogrula(g: unknown): KurulumGirdisi | null {
  const o = (g && typeof g === 'object' ? g : {}) as Record<string, unknown>
  const code = typeof o.code === 'string' ? o.code.trim() : ''
  const bosMu = (v: unknown) => v == null || v === ''
  const wabaId = String(o.wabaId ?? '').trim()
  const phoneNumberId = bosMu(o.phoneNumberId) ? null : String(o.phoneNumberId).trim()
  const businessId = bosMu(o.businessId) ? null : String(o.businessId).trim()
  if (!code || code.length > 2000 || !KIMLIK.test(wabaId)) return null
  if ((phoneNumberId && !KIMLIK.test(phoneNumberId)) || (businessId && !KIMLIK.test(businessId))) return null
  return { code, wabaId, phoneNumberId, businessId }
}

export type KurulumSonucu = { ok: true; numara: string | null } | { ok: false; durum: number; hata: string }

type Numara = { id?: string; display_phone_number?: string; verified_name?: string; is_on_biz_app?: boolean; platform_type?: string }

/** Oturumda numara geldiyse o (WABA'da olmalı); gelmediyse WABA'daki tek uygulama numarası. Belirsizse null. */
export function numaraSec(numaralar: Numara[], istenen: string | null): Numara | null {
  if (istenen) return numaralar.find((n) => String(n.id) === istenen) || null
  const uygulamada = numaralar.filter((n) => n.is_on_biz_app === true)
  if (uygulamada.length === 1) return uygulamada[0]
  return numaralar.length === 1 ? numaralar[0] : null
}

const TEKRAR = 'WhatsApp bağlantısı tamamlanamadı. Lütfen yeniden deneyin.'

export async function kurulumuTamamla(
  sb: SupabaseClient,
  doktorId: string,
  g: KurulumGirdisi,
  ayar: WhatsAppAyar,
  f: FetchFn = fetch
): Promise<KurulumSonucu> {
  // 1) Kod → işletme anahtarı (yalnız sunucuda; app secret tarayıcıya hiç çıkmaz). Varsayılan: süresiz.
  let token = ''
  try {
    const r = await graph<{ access_token?: string }>('oauth/access_token', {
      query: { client_id: ayar.appId, client_secret: ayar.appSecret, code: g.code },
    }, f)
    token = String(r.access_token || '')
  } catch { /* aşağıda */ }
  if (!token) return { ok: false, durum: 400, hata: TEKRAR }

  // 2) Numara bu anahtarın WABA'sında mı? (tarayıcıdan gelen kimliğe güvenme)
  let n: Numara | null = null
  try {
    const r = await graph<{ data?: Numara[] }>(
      `${g.wabaId}/phone_numbers`,
      { token, query: { fields: 'id,display_phone_number,verified_name,is_on_biz_app,platform_type' } },
      f
    )
    n = numaraSec(r.data || [], g.phoneNumberId)
  } catch {
    return { ok: false, durum: 400, hata: 'WhatsApp hesabı doğrulanamadı. Lütfen yeniden deneyin.' }
  }
  if (!n?.id) return { ok: false, durum: 400, hata: 'WhatsApp numaranız bulunamadı. Lütfen yeniden deneyin.' }
  const phoneNumberId = String(n.id)

  // 3) Aynı numara başka bir Notya hesabına bağlıysa sessizce devralma.
  const { data: baska } = await sb.from(TABLO).select('doctor_id').eq('phone_number_id', phoneNumberId).neq('doctor_id', doktorId).maybeSingle()
  if (baska) return { ok: false, durum: 409, hata: 'Bu numara başka bir Notya hesabına bağlı.' }

  // 4) Notya'yı WABA'ya abone et (teslim durumu, şablon onayı ve bağlantı kopması webhook'ları için).
  try {
    await graph(`${g.wabaId}/subscribed_apps`, { method: 'POST', token }, f)
  } catch {
    return { ok: false, durum: 502, hata: TEKRAR }
  }

  // 5) Coexistence: Meta'nın 24 saat şartı — kişi ve geçmiş eşitlemesini başlat (içerik webhook'ta atılır).
  //    Doktor akışta geçmişi paylaşmamayı seçtiyse Meta hata döner; bağlanmayı durdurmaz.
  if (n.is_on_biz_app !== false) {
    for (const sync_type of ['smb_app_state_sync', 'history']) {
      await graph(`${phoneNumberId}/smb_app_data`, { method: 'POST', token, body: { messaging_product: 'whatsapp', sync_type } }, f).catch(() => {})
    }
  }

  // 6) Şablonlar: eksikse oluştur, varsa durumunu oku. Hata bağlanmayı durdurmaz (durum sonra tazelenir).
  const sablonlar = await sablonlariHazirla(g.wabaId, token, f).catch(() => ({}))

  const numara = n.display_phone_number ? String(n.display_phone_number) : null
  const k = await baglantiKaydet(sb, {
    doktorId, businessId: g.businessId, wabaId: g.wabaId, phoneNumberId,
    gorunenNumara: numara, gorunenAd: n.verified_name ? String(n.verified_name) : null, token, sablonlar,
  })
  if (!k.ok) return { ok: false, durum: 500, hata: 'Bağlantı kaydedilemedi. Lütfen yeniden deneyin.' }
  return { ok: true, numara }
}

/** Notya'nın aboneliğini WABA'dan kaldırır (en iyi çaba) ve satırı siler. Numara uygulamada kalır. */
export async function baglantiKaldir(sb: SupabaseClient, doktorId: string, f: FetchFn = fetch): Promise<void> {
  const b = await baglantiOku(sb, doktorId).catch(() => null)
  // Meta'ya ulaşılamasa da doktorun isteği geçerli: anahtar bizde kalmaz.
  if (b) await graph(`${b.wabaId}/subscribed_apps`, { method: 'DELETE', token: b.token }, f).catch(() => {})
  await baglantiSil(sb, doktorId)
}
