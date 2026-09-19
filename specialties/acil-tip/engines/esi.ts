/**
 * ACIL-TIP-EXCEPTIONAL-01 — ESI triyaj seviyesi. SAF fonksiyon.
 * Seviye 1–5 karar desteği. Tanı / doz YOK. Bed board HIS YOK.
 */
import { dozIceriyorMu, type Dipnot } from './acilTip'

export type EsiSeviye = 1 | 2 | 3 | 4 | 5

export type EsiKaynak =
  | 'resus_hemen'
  | 'yuksek_risk'
  | 'siddetli_agri_distress'
  | 'coklu_kaynak'
  | 'tek_kaynak'
  | 'kaynak_yok'

export const ESI_KAYNAKLAR: Array<{ kod: EsiKaynak; ad: string }> = [
  { kod: 'resus_hemen', ad: 'Hemen yaşam kurtarıcı müdahale gerekli' },
  { kod: 'yuksek_risk', ad: 'Yüksek risk öykü / vital tehdit şüphesi' },
  { kod: 'siddetli_agri_distress', ad: 'Şiddetli ağrı / distres' },
  { kod: 'coklu_kaynak', ad: 'Birden fazla kaynak (tetkik/işlem) bekleniyor' },
  { kod: 'tek_kaynak', ad: 'Tek kaynak bekleniyor' },
  { kod: 'kaynak_yok', ad: 'Kaynak gerekmiyor (hızlı vizit)' },
]

export const ESI_ETIKET: Record<EsiSeviye, string> = {
  1: 'ESI 1 — Resus',
  2: 'ESI 2 — Acil',
  3: 'ESI 3 — Acil (kaynaklı)',
  4: 'ESI 4 — Daha az acil',
  5: 'ESI 5 — Acil değil',
}

export interface EsiSonuc {
  tamamMi: boolean
  seviye: EsiSeviye | null
  kaynaklar: EsiKaynak[]
  ozet: string
  gorevOnerileri: Array<{ kod: string; ad: string }>
  dipnot: Dipnot
}

/** Hekim seçtiği seviye + kaynaklar. Otomatik tanı kilidi YOK. */
export function esiSkorla(girdi: { seviye?: unknown; kaynaklar?: unknown; not?: string | null }): EsiSonuc {
  const dipnot: Dipnot = { ref: 'ESI', not: 'ESI karar desteğidir; tanı ve doz hekimin' }
  if (girdi.not && dozIceriyorMu(girdi.not)) {
    return { tamamMi: false, seviye: null, kaynaklar: [], ozet: 'ESI notunda mg / ilaç dozu yazılamaz.', gorevOnerileri: [], dipnot }
  }
  const seviyeHam = Number(girdi.seviye)
  if (![1, 2, 3, 4, 5].includes(seviyeHam)) {
    return { tamamMi: false, seviye: null, kaynaklar: [], ozet: 'ESI seviyesi 1–5 seçilmelidir.', gorevOnerileri: [], dipnot }
  }
  const seviye = seviyeHam as EsiSeviye
  const izinli = new Set(ESI_KAYNAKLAR.map((k) => k.kod))
  const kaynaklar = (Array.isArray(girdi.kaynaklar) ? girdi.kaynaklar.map(String) : []).filter((k): k is EsiKaynak => izinli.has(k as EsiKaynak))

  if (seviye === 1 && !kaynaklar.includes('resus_hemen')) {
    return { tamamMi: false, seviye, kaynaklar, ozet: 'ESI 1 için "Hemen yaşam kurtarıcı müdahale" kaynağı işaretlenmelidir.', gorevOnerileri: [], dipnot }
  }

  const gorevOnerileri: Array<{ kod: string; ad: string }> = []
  if (seviye <= 2) {
    gorevOnerileri.push({ kod: 'esi_yeniden_degerlendirme', ad: 'ESI yeniden değerlendirme / vital izlem' })
  }
  if (seviye === 1) {
    gorevOnerileri.push({ kod: 'resus_takip', ad: 'Resus / kritik bakım izlem görevi' })
  }

  return {
    tamamMi: true,
    seviye,
    kaynaklar,
    ozet: `${ESI_ETIKET[seviye]}${kaynaklar.length ? ` · kaynak: ${kaynaklar.map((k) => ESI_KAYNAKLAR.find((x) => x.kod === k)?.ad || k).join('; ')}` : ''}. Karar desteğidir; tanı/doz hekimin. Bed board HIS yok.`,
    gorevOnerileri,
    dipnot,
  }
}
