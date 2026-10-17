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
import { sablonGonder, sablonMetni, type GonderSonucu } from './gonder'
import { denemeVarMi, gunlukYaz } from './gunluk'
import { kotaAl, kotaIade, tierLimiti } from './kota'
import { tokenGecersiz } from './saglik'
import { SABLON_KODLARI, sablonDurumlariniOku, type SablonKodu } from './sablonlar'
import type { FetchFn } from './graph'

export interface GonderGirdisi {
  doktorId: string
  alici: string
  konu?: string
  metin: string
  sablonKodu?: string
  degiskenler?: string[]
  /**
   * WHATSAPP-API-01: idempotency key (e.g. "kuyruk:<id>"). The same key is sent at most once; a second call answers
   * "zaten gönderildi" without touching Meta or the quota. Without a key the call is not de-duplicated here (the
   * dispatcher's own queue claim still guarantees one attempt per item).
   */
  idemAnahtar?: string
  /** Patient the message is about (already ownership-checked by the caller) and the message type — audit log only. */
  hastaId?: string | null
  tur?: string
}

const TEKRAR_MESAJI = 'Bu mesaj zaten gönderildi ya da gönderiliyor.'
const LIMIT_MESAJI = 'WhatsApp günlük gönderim sınırına ulaşıldı.'
const KAYIT_MESAJI = 'WhatsApp kaydı şu an hazır değil; mesaj gönderilmedi.'

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

      // 1) Idempotency: one attempt per key.
      const tur = g.tur || kod
      if (g.idemAnahtar && await denemeVarMi(istemci, g.doktorId, g.idemAnahtar)) return { ok: false, hata: TEKRAR_MESAJI }
      // 2) Meta tier: never above the limit last read from Meta (250/24h until Meta says otherwise). Fail closed.
      const kota = await kotaAl(istemci, g.doktorId, tierLimiti(b.tier))
      if (!kota.ok) return { ok: false, hata: kota.neden === 'limit' ? LIMIT_MESAJI : KAYIT_MESAJI }
      // 3) Audit "deneniyor" BEFORE the network call. No audit trail → no send.
      const metin = sablonMetni(kod, g.degiskenler || [])
      const iz = { doktorId: g.doktorId, patientId: g.hastaId ?? null, yon: 'giden' as const, tur, sablonKodu: kod, karsiTaraf: g.alici, idemAnahtar: g.idemAnahtar ?? null }
      const deneme = await gunlukYaz(istemci, { ...iz, durum: 'deneniyor' })
      if (!deneme.ok) {
        await kotaIade(istemci, g.doktorId)
        return { ok: false, hata: deneme.tekrar ? TEKRAR_MESAJI : KAYIT_MESAJI }
      }
      // 4) The send itself.
      const s = await sablonGonder(b, kod, g.alici, g.degiskenler || [], f)
      if (s.ok) {
        await gunlukYaz(istemci, { ...iz, durum: 'gonderildi', wamid: s.disId ?? null, govde: metin })
        return s
      }
      if (s.belirsiz) {
        // No answer from Meta: the message may have left — keep the reservation, never resend automatically.
        await gunlukYaz(istemci, { ...iz, durum: 'belirsiz', govde: metin, hataKodu: s.kod != null ? String(s.kod) : null })
      } else {
        await kotaIade(istemci, g.doktorId)
        await gunlukYaz(istemci, { ...iz, durum: 'basarisiz', govde: metin, hataKodu: s.kod != null ? String(s.kod) : null })
        if (s.kod === 190) await tokenGecersiz(istemci, g.doktorId)
      }
      return s
    },
  }
}

export const gonderici: OtomatikGonderici = whatsappGondericisi()
