/**
 * NOTYA-ILETISIM-03 — WhatsApp otomatik göndericisi (doktorun kendi WhatsApp Business numarası).
 *
 * Sözleşme (NOTYA-ILETISIM-01 kayıt defteri): `gonderici.kanal`, `hazirMi(doktorId)`, `gonder(g)`.
 * `gonder` yalnız onaylı bir şablonla gönderir; `sablonKodu` + `degiskenler` zorunludur, `metin`/`konu`
 * WhatsApp'ta kullanılmaz (serbest metin şablon dışına klinik ayrıntı taşıyabilirdi).
 *   randevu_hatirlatma  → degiskenler: [hasta adı, tarih, saat, doktor adı]
 *   saglikim_yeni_mesaj → degiskenler: [hasta adı, doktor adı, https://www.notya.io/portal/hasta/<token>]
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { whatsappAyar, YAKINDA_MESAJI } from './ayar'
import { baglantiOku, sablonlariGuncelle } from './depo'
import { sablonGonder, type GonderSonucu } from './gonder'
import { SABLON_KODLARI, sablonDurumlariniOku, type SablonKodu } from './sablonlar'
import type { FetchFn } from './graph'

export interface GonderGirdisi {
  doktorId: string
  alici: string
  konu?: string
  metin: string
  sablonKodu?: string
  degiskenler?: string[]
}

export interface OtomatikGonderici {
  kanal: 'eposta' | 'whatsapp'
  hazirMi(doktorId: string): Promise<boolean>
  gonder(g: GonderGirdisi): Promise<GonderSonucu>
}

/** Test ve rota tarafından bağımlılık verilerek kurulabilir; varsayılan `gonderici` gerçek olanlardır. */
export function whatsappGondericisi(deps: { sb?: () => SupabaseClient; fetch?: FetchFn; env?: NodeJS.ProcessEnv } = {}): OtomatikGonderici {
  const sb = deps.sb || servisSupabase
  const f = deps.fetch || fetch
  return {
    kanal: 'whatsapp',
    async hazirMi(doktorId) {
      if (!whatsappAyar(deps.env) || !doktorId) return false
      try {
        const b = await baglantiOku(sb(), doktorId)
        return b?.sablonlar.randevu_hatirlatma?.durum === 'APPROVED'
      } catch {
        return false
      }
    },
    async gonder(g) {
      if (!whatsappAyar(deps.env)) return { ok: false, hata: YAKINDA_MESAJI }
      const kod = g.sablonKodu as SablonKodu
      if (!kod || !SABLON_KODLARI.includes(kod)) return { ok: false, hata: 'WhatsApp yalnız onaylı şablonla gönderir.' }
      const istemci = sb()
      const b = await baglantiOku(istemci, g.doktorId).catch(() => null)
      if (!b) return { ok: false, hata: 'WhatsApp bağlı değil.' }
      let durum = b.sablonlar[kod]?.durum
      if (durum !== 'APPROVED') {
        // Onay webhook'u kaçmış olabilir: bir kez Meta'dan tazele.
        const guncel = await sablonDurumlariniOku(b.wabaId, b.token, f).catch(() => null)
        if (guncel) {
          await sablonlariGuncelle(istemci, g.doktorId, { ...b.sablonlar, ...guncel }).catch(() => {})
          durum = guncel[kod]?.durum
        }
      }
      if (durum !== 'APPROVED') return { ok: false, hata: 'Mesaj şablonu henüz onaylanmadı.' }
      return sablonGonder(b, kod, g.alici, g.degiskenler || [], f)
    },
  }
}

export const gonderici: OtomatikGonderici = whatsappGondericisi()
