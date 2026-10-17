/**
 * NOTYA-HASTA-ILETISIMI-01 — pluggable SMS sender registry, same shape as
 * lib/iletisim/otomatik.ts's OtomatikGonderici so a second adapter slots in the same way jobs B/C did.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { smsAyarGetir } from './ayar'
import { androidGatewayGonder } from './androidGateway'
import { netgsmGonder } from './netgsm'
import type { SmsAyar, SmsGonderimIstegi, SmsGonderimSonucu } from './tipler'

export interface SmsGonderici {
  saglayici: string
  gonder(ayar: SmsAyar, aliciE164: string, metin: string): Promise<SmsGonderimSonucu>
}

const KAYITLI_GONDERICILER: readonly SmsGonderici[] = [
  { saglayici: 'android_sms_gateway', gonder: (ayar, alici, metin) => ayar.saglayici === 'android_sms_gateway' ? androidGatewayGonder(ayar, alici, metin) : Promise.resolve({ ok: false, hata: 'SMS sağlayıcı ayarı uyuşmuyor.' }) },
  // NETGSM-01: the doctor's own NetGSM account — for iPhone doctors (an iPhone cannot be a gateway).
  { saglayici: 'netgsm', gonder: (ayar, alici, metin) => ayar.saglayici === 'netgsm' ? netgsmGonder(ayar, alici, metin) : Promise.resolve({ ok: false, hata: 'SMS sağlayıcı ayarı uyuşmuyor.' }) },
]

function gondericiBul(saglayici: string): SmsGonderici | null {
  return KAYITLI_GONDERICILER.find((g) => g.saglayici === saglayici) || null
}

/** null → the doctor has not connected a gateway (or it is off); callers fall back to the manual list. */
export async function hazirSmsGonderici(supabase: SupabaseClient, doktorId: string): Promise<{ ayar: SmsAyar; gonderici: SmsGonderici } | null> {
  const ayar = await smsAyarGetir(supabase, doktorId)
  if (!ayar || !ayar.aktif) return null
  const gonderici = gondericiBul(ayar.saglayici)
  if (!gonderici) return null
  return { ayar, gonderici }
}

/** Never throws — the caller logs { ok:false } exactly like any other recipient failure. */
export async function smsGonder(supabase: SupabaseClient, istek: SmsGonderimIstegi): Promise<SmsGonderimSonucu> {
  try {
    const hazir = await hazirSmsGonderici(supabase, istek.doktorId)
    if (!hazir) return { ok: false, hata: 'SMS gateway bağlı değil.' }
    // The opt-out footer in `metin` was written for one provider; never send it through another.
    if (istek.beklenenSaglayici && istek.beklenenSaglayici !== hazir.ayar.saglayici) {
      return { ok: false, hata: 'SMS sağlayıcısı gönderim sırasında değiştirildi; bu alıcıya mesaj gönderilmedi (başarısız sayıldı).' }
    }
    return await hazir.gonderici.gonder(hazir.ayar, istek.alici, istek.metin)
  } catch (e) {
    return { ok: false, hata: e instanceof Error ? e.message : 'bilinmeyen hata' }
  }
}
