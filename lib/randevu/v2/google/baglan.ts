/** NOTYA-RANDEVU-V2 PR2 — constants of the Google Takvim connect round trip (shared by baslat and donus). */
import { siteAdresi } from '@/lib/iletisim/otomatik/eposta/ayar'

export const TAKVIM_CEREZI = 'notya_takvim_baglan'
export const TAKVIM_CEREZ_YOLU = '/api/google-takvim'
/** Distinguishes this signed state from the e-mail connect state (same signer, lib/iletisim/otomatik/eposta/durum.ts). */
export const TAKVIM_DURUM_TURU = 'google_takvim'

export type TakvimSonucu = 'baglandi' | 'vazgecildi' | 'izin-eksik' | 'hata' | 'kapali'

export function entegrasyonlaraDonus(sonuc: TakvimSonucu): string {
  return `${siteAdresi()}/dashboard/doktor/entegrasyonlar?google=${sonuc}`
}
