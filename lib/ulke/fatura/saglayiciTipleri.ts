/**
 * AU-BETA-02 — types shared by the REAL payment adapters (Stripe, Tyro) and the reconciliation. No provider code here.
 * Money is integer minor units (cents) everywhere.
 */
export type SaglayiciKaydi = {
  /** The provider's id of the payment (Stripe PaymentIntent, Tyro Pay Request). */
  ref: string
  /** The Notya invoice id the payment carries in its metadata / origin; null when the payment names none. */
  faturaId: string | null
  tutarKurus: number
  iadeKurus: number
  /** ISO 4217, upper case. */
  paraKodu: string
  /** true = the money was taken (Stripe status `succeeded`). A failed or open attempt is not a payment. */
  basarili: boolean
  /** Epoch milliseconds. */
  olusturuldu: number
}

export type OdemeBaslatma = { faturaId: string; no: number; tutarKurus: number; paraKodu: string; basariUrl: string; iptalUrl: string }
export type OdemeBaslatildi = { ref: string; url?: string; paySecret?: string }
export type IadeIstegi = { faturaId: string; odemeRef: string; kurus: number; oncekiIadeKurus: number }
export type IadeYapildi = { tamam: boolean; ref: string; iadeKurus: number; bekliyor: boolean }
export type DogrulamaSonucu = { tamam: true } | { tamam: false; hata: 'anahtar' | 'izin' | 'ag' | 'bilinmeyen' }

/** What the app asks of a real provider. The demo adapter (./odemeSaglayici.ts) has its own, synchronous shape. */
export interface GercekSaglayici {
  readonly ad: 'stripe' | 'tyro'
  dogrula(): Promise<DogrulamaSonucu>
  baslat(i: OdemeBaslatma): Promise<OdemeBaslatildi>
  iade(i: IadeIstegi): Promise<IadeYapildi>
  /** Payments created in [gte, lte] (epoch seconds). Tyro cannot list: see ./tyro.ts. */
  kayitlar(gte: number, lte: number): Promise<SaglayiciKaydi[]>
}
