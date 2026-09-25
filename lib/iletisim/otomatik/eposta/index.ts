/**
 * NOTYA-ILETISIM-02 — e-posta kanalı for the OtomatikGonderici registry (NOTYA-ILETISIM-01).
 * Sends from the doctor's own Gmail/Outlook after a one-time connect; setup steps live in
 * docs/iletisim-kurulum-eposta.md. Off (hazirMi → false) until the env vars exist.
 */
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { hazirSaglayicilar } from './ayar'
import { epostaGonder, hazirMi, HATA, type GonderGirdisi, type GonderSonucu } from './gonderim'

export const gonderici = {
  kanal: 'eposta' as const,
  async hazirMi(doktorId: string): Promise<boolean> {
    if (hazirSaglayicilar().length === 0) return false
    return hazirMi(servisSupabase(), doktorId)
  },
  async gonder(g: GonderGirdisi): Promise<GonderSonucu> {
    if (hazirSaglayicilar().length === 0) return { ok: false, hata: HATA.kapali }
    return epostaGonder(servisSupabase(), g)
  },
}
