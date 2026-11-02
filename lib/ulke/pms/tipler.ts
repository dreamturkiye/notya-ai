/**
 * AU-GAP-CLOSE-02 — PMS write-back scaffold types. Never includes a "synced" connection state.
 */
export const PMS_SAGLAYICILAR = ['best-practice', 'genie', 'gentu'] as const
export type PmsSaglayici = (typeof PMS_SAGLAYICILAR)[number]

export type PmsBaglantiDurum = 'kimlik-kayitli' | 'partner-bekleniyor' | 'dogrulanamadi'
export type PmsKuyrukDurum = 'bekliyor' | 'hazirlandi' | 'gonderildi' | 'hata' | 'iptal'

export type PmsBaglantiOzet = {
  saglayici: PmsSaglayici
  baglantiDurum: PmsBaglantiDurum
  /** Last 4 chars of the saved credential label — never the secret. */
  sonDort: string | null
}

export type PmsKuyrukOzet = {
  id: string
  noteId: string
  hedef: PmsSaglayici
  durum: PmsKuyrukDurum
  paketSurum: string
  createdAt: string
}

export type PmsRetKodu =
  | 'GECERSIZ'
  | 'NOT_FOUND'
  | 'ONAYSIZ'
  | 'PARTNER_YOK'
  | 'BAGLANTI_YOK'
  | 'BASARISIZ'

export const pmsSaglayiciMi = (h: unknown): h is PmsSaglayici =>
  typeof h === 'string' && (PMS_SAGLAYICILAR as readonly string[]).includes(h)
