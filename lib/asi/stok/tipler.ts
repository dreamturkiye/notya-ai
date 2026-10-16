/**
 * NOTYA-ASI-STOK-BARKOD-01 — ortak tipler. Para birimi Notya'nın geri kalanıyla aynı kural:
 * tam sayı kuruş (Money, lib/accounting/types.ts ile aynı birim — 1 TL = 100 kuruş).
 */

export type AsiStokLotu = {
  id: string
  doktorId: string
  asiAdi: string
  barkod: string
  lotNo: string | null
  miktar: number
  sonKullanmaTarihi: string | null // YYYY-MM-DD
  birimFiyatKurus: number | null
  varsayilanUygulamaBolgesi: string | null
  notlar: string | null
  aktif: boolean
  createdAt: string
  updatedAt: string
}

export type SktDurumu = 'gecerli' | 'yaklasiyor' | 'gecti'

/** 60 günden az kalan lot "yaklaşıyor" sayılır — klinik stok rutini için pratik bir eşik. */
export const SKT_YAKLASIYOR_GUN = 60

export function sktDurumu(sktIso: string | null, bugunIso: string): SktDurumu {
  if (!sktIso) return 'gecerli'
  if (sktIso < bugunIso) return 'gecti'
  const fark = (new Date(sktIso + 'T00:00:00Z').getTime() - new Date(bugunIso + 'T00:00:00Z').getTime()) / 86400000
  return fark <= SKT_YAKLASIYOR_GUN ? 'yaklasiyor' : 'gecerli'
}

export const DUSUK_STOK_ESIGI = 5

export type AsiTaramaSonucu =
  | { bulundu: false; barkod: string }
  | {
      bulundu: true
      lot: AsiStokLotu
      sktDurumu: SktDurumu
      stokVarMi: boolean
      /** true = sunucu tarafında engellenir (varsayılan). false asla dönmez bugün — ileride "çok güçlü uyarı, hekim onayı ile geç" seçeneği eklenirse burada kullanılacak. */
      engellenir: boolean
    }

export type AsiUygulamaGirdisi = {
  barkod?: string
  lotId?: string
  patientId: string
  sessionId?: string | null
  uygulamaBolgesi?: string | null
  faturayaEkle?: boolean
}

export type AsiUygulamaSonucu = {
  asilarId: string
  lot: AsiStokLotu
  kalanMiktar: number
  eNabizHazir: true
  fatura: { eklendi: boolean; faturaId?: string; sebep?: string }
}
