/**
 * NOTYA-ILETISIM-02 — which mailbox providers are switched on, and the fixed addresses they use.
 *
 * The whole feature stays invisible until its environment exists: no client id/secret (or no
 * ENCRYPTION_MASTER_KEY to store the credential with) means the card says Yakında, every route
 * answers 503 and the sender reports "not ready". Nothing throws.
 */

export type Saglayici = 'google' | 'microsoft'
export const SAGLAYICILAR: readonly Saglayici[] = ['google', 'microsoft']

export function saglayiciMi(s: unknown): s is Saglayici {
  return s === 'google' || s === 'microsoft'
}

export const SAGLAYICI_ADI: Record<Saglayici, string> = { google: 'Gmail', microsoft: 'Outlook' }

/** Client credentials for one provider, or null when that provider is not configured. */
export function saglayiciAyari(s: Saglayici): { istemciId: string; istemciSirri: string } | null {
  const id = s === 'google' ? process.env.GOOGLE_OAUTH_CLIENT_ID : process.env.MS_OAUTH_CLIENT_ID
  const sir = s === 'google' ? process.env.GOOGLE_OAUTH_CLIENT_SECRET : process.env.MS_OAUTH_CLIENT_SECRET
  if (!id?.trim() || !sir?.trim() || !process.env.ENCRYPTION_MASTER_KEY) return null
  return { istemciId: id.trim(), istemciSirri: sir.trim() }
}

export function saglayiciHazirMi(s: Saglayici): boolean {
  return saglayiciAyari(s) !== null
}

/** Providers the doctor can pick right now (empty = feature off). */
export function hazirSaglayicilar(): Saglayici[] {
  return SAGLAYICILAR.filter(saglayiciHazirMi)
}

export function siteAdresi(): string {
  return String(process.env.NEXT_PUBLIC_APP_URL || 'https://www.notya.io').replace(/\/$/, '')
}

/** Must be registered verbatim at Google and Microsoft (docs/iletisim-kurulum-eposta.md). */
export function donusAdresi(s: Saglayici): string {
  return `${siteAdresi()}/api/iletisim/eposta/${s}/donus`
}

/** Where the doctor lands after connecting: Ayarlar › İletişim, whose card reads `?eposta=<sonuc>`. */
export const AYARLAR_YOLU = '/dashboard/doktor/ayarlar/iletisim'

export type BaglantiSonucu = 'baglandi' | 'vazgecildi' | 'izin-eksik' | 'hata' | 'kapali'

export function ayarlaraDonus(sonuc: BaglantiSonucu): string {
  return `${siteAdresi()}${AYARLAR_YOLU}?eposta=${sonuc}`
}

export const KAPALI_MESAJI = 'E-postaların kendiliğinden gitmesi yakında açılacak.'
