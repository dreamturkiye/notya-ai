/**
 * YENI-DOKTOR-UX-2026-10 — İpucu görünürlük durumu (v1: localStorage).
 *
 * Tasarım kararı (Kaan, 2026-10-17): v1'de kalıcılık localStorage'tadır — ek tablo/kolon ve
 * migration gerektirmez. Bedeli bilinçli kabul edildi: görüldü/gizlendi bilgisi cihaz başınadır
 * (doktor başka tarayıcıda ipuçlarını bir kez daha görür) ve tarayıcı verisi silinirse sıfırlanır.
 * Bu zararsızdır çünkü her balon kapatılabilir ve hiçbir akışı engellemez. Sunucu tarafına taşıma
 * (users tablosuna tek jsonb kolonu) kullanım-temelli sezgisel kapatma geldiğinde yapılacak.
 *
 * Her okuma/yazma try/catch içindedir: gizli pencere, kapalı site verisi ya da SSR'da sessizce
 * "varsayılan" davranışa düşer (ipuçları açık, hiçbir bölüm görülmedi).
 */

import type { IpucuBolumu } from './ipuclari'

/** localStorage'a benzeyen her şey — testler sahte depo geçirir. */
export type IpucuDeposu = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

/** Global anahtar: Ayarlar › "İpuçlarını göster". '0' = kapalı; yoksa ya da başka değer = açık. */
export const IPUCU_ACIK_ANAHTAR = 'notya_ipuclari_acik'

/** Ayarlar'daki anahtar değişince açık sayfadaki balonların haberi olsun diye pencere olayı. */
export const IPUCU_AYAR_OLAYI = 'notya-ipucu-ayar'

const GORULDU_ONEK = 'notya_ipucu_goruldu_'

function depoyuAl(depo?: IpucuDeposu | null): IpucuDeposu | null {
  if (depo) return depo
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage
  } catch {
    /* gizli pencere / kapalı depolama */
  }
  return null
}

/** Varsayılan AÇIK: anahtar hiç yazılmamışsa herkes ipuçlarını görür (Kaan'ın kararı). */
export function ipuclariAcikMi(depo?: IpucuDeposu | null): boolean {
  const d = depoyuAl(depo)
  if (!d) return true
  try {
    return d.getItem(IPUCU_ACIK_ANAHTAR) !== '0'
  } catch {
    return true
  }
}

export function ipuclariAyarla(acik: boolean, depo?: IpucuDeposu | null): void {
  const d = depoyuAl(depo)
  if (!d) return
  try {
    d.setItem(IPUCU_ACIK_ANAHTAR, acik ? '1' : '0')
  } catch {
    /* yazılamadı — bir sonraki okunuşta varsayılan geçerli */
  }
}

export function gorulduMu(bolum: IpucuBolumu, depo?: IpucuDeposu | null): boolean {
  const d = depoyuAl(depo)
  if (!d) return false
  try {
    return d.getItem(GORULDU_ONEK + bolum) === '1'
  } catch {
    return false
  }
}

export function gorulduIsaretle(bolum: IpucuBolumu, depo?: IpucuDeposu | null): void {
  const d = depoyuAl(depo)
  if (!d) return
  try {
    d.setItem(GORULDU_ONEK + bolum, '1')
  } catch {
    /* işaretlenemedi — en kötü ihtimalle balon bir kez daha otomatik açılır */
  }
}

/**
 * Bölüm ilk kez mi görülüyor? — otomatik gösterim kapısı.
 * Kural: ipuçları açık VE bu bölüm daha önce otomatik gösterilmemiş.
 * (Otomatik gösterim en fazla bir kez: gösteren taraf hemen gorulduIsaretle çağırır.)
 */
export function otomatikGosterilsinMi(bolum: IpucuBolumu, depo?: IpucuDeposu | null): boolean {
  return ipuclariAcikMi(depo) && !gorulduMu(bolum, depo)
}
