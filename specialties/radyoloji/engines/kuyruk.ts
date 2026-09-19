/**
 * RADYOLOJI-EXCEPTIONAL-01 — Tetkik kuyruğu / öncelik. SAF fonksiyon.
 * Modalite + öncelik + durum. PACS/RIS/HIS YOK. Tanı YOK.
 */
import { uydurmaBulguIceriyorMu, type Dipnot } from './radyoloji'

export type RadyoModalite = 'xray' | 'us' | 'bt' | 'mri' | 'mamografi' | 'pet' | 'diger'
export type RadyoOncelik = 'acil' | 'ayni_gun' | 'rutin' | 'kontrol'
export type RadyoDurum = 'bekliyor' | 'cekildi' | 'rapor_hazir' | 'arsiv'

export const RADYO_MODALITELER: Array<{ kod: RadyoModalite; ad: string }> = [
  { kod: 'xray', ad: 'Direkt grafi (X-ray)' },
  { kod: 'us', ad: 'Ultrasonografi' },
  { kod: 'bt', ad: 'Bilgisayarlı tomografi (BT)' },
  { kod: 'mri', ad: 'Manyetik rezonans (MR)' },
  { kod: 'mamografi', ad: 'Mamografi' },
  { kod: 'pet', ad: 'PET / PET-BT' },
  { kod: 'diger', ad: 'Diğer / belirtilecek' },
]

export const RADYO_ONCELIKLER: Array<{ kod: RadyoOncelik; ad: string }> = [
  { kod: 'acil', ad: 'Acil' },
  { kod: 'ayni_gun', ad: 'Aynı gün' },
  { kod: 'rutin', ad: 'Rutin' },
  { kod: 'kontrol', ad: 'Kontrol' },
]

export const RADYO_DURUMLAR: Array<{ kod: RadyoDurum; ad: string }> = [
  { kod: 'bekliyor', ad: 'Bekliyor' },
  { kod: 'cekildi', ad: 'Çekildi' },
  { kod: 'rapor_hazir', ad: 'Rapor hazır' },
  { kod: 'arsiv', ad: 'Arşiv' },
]

export interface KuyrukKart {
  modalite: RadyoModalite
  oncelik: RadyoOncelik
  durum: RadyoDurum
  tarih: string
  not: string | null
}

export interface KuyrukSonuc {
  tamamMi: boolean
  kart: KuyrukKart
  ozet: string
  gorevOnerileri: Array<{ kod: string; ad: string; due?: string | null }>
  dipnot: Dipnot
}

export function kuyrukSkorla(girdi: unknown): KuyrukSonuc {
  const dipnot: Dipnot = { ref: 'TRD', not: 'Kuyruk / öncelik karar desteğidir; PACS yok, tanı hekimin' }
  const g = (girdi && typeof girdi === 'object' ? girdi : {}) as Record<string, unknown>
  const modalite = String(g.modalite || '') as RadyoModalite
  const oncelik = String(g.oncelik || 'rutin') as RadyoOncelik
  const durum = String(g.durum || 'bekliyor') as RadyoDurum
  const tarih = String(g.tarih || '')
  const not = g.not ? String(g.not).slice(0, 500) : null

  if (!RADYO_MODALITELER.some((m) => m.kod === modalite)) {
    return { tamamMi: false, kart: { modalite: 'diger', oncelik: 'rutin', durum: 'bekliyor', tarih: '', not }, ozet: 'Modalite seçin.', gorevOnerileri: [], dipnot }
  }
  if (!RADYO_ONCELIKLER.some((o) => o.kod === oncelik)) {
    return { tamamMi: false, kart: { modalite, oncelik: 'rutin', durum, tarih, not }, ozet: 'Öncelik geçersiz.', gorevOnerileri: [], dipnot }
  }
  if (!RADYO_DURUMLAR.some((d) => d.kod === durum)) {
    return { tamamMi: false, kart: { modalite, oncelik, durum: 'bekliyor', tarih, not }, ozet: 'Durum geçersiz.', gorevOnerileri: [], dipnot }
  }
  if (not && uydurmaBulguIceriyorMu(not)) {
    return { tamamMi: false, kart: { modalite, oncelik, durum, tarih, not }, ozet: 'Kuyruk notunda AI / otomatik tanı dili yazılamaz.', gorevOnerileri: [], dipnot }
  }

  const modAd = RADYO_MODALITELER.find((m) => m.kod === modalite)!.ad
  const oncAd = RADYO_ONCELIKLER.find((o) => o.kod === oncelik)!.ad
  const durAd = RADYO_DURUMLAR.find((d) => d.kod === durum)!.ad
  const gorevOnerileri: KuyrukSonuc['gorevOnerileri'] = []
  if (durum === 'bekliyor') gorevOnerileri.push({ kod: `kuyruk_${modalite}`, ad: `${modAd} tetkik (kuyruk)`, due: tarih || null })
  if (durum === 'cekildi') gorevOnerileri.push({ kod: 'rapor_bekliyor', ad: 'Rapor yazımı bekliyor', due: tarih || null })
  if (durum === 'rapor_hazir') gorevOnerileri.push({ kod: 'rapor_klinisyen', ad: 'Rapor klinisyene iletildi / kontrol', due: tarih || null })

  return {
    tamamMi: true,
    kart: { modalite, oncelik, durum, tarih, not },
    ozet: `Tetkik kuyruğu: ${modAd} · öncelik ${oncAd} · durum ${durAd}. Karar desteğidir; PACS/RIS yok, tanı hekimin.`,
    gorevOnerileri,
    dipnot,
  }
}

export function oncelikSirasi(oncelik: RadyoOncelik): number {
  return { acil: 0, ayni_gun: 1, rutin: 2, kontrol: 3 }[oncelik]
}
