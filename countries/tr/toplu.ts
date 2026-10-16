/**
 * TOPLU-ULKE-01 — Türkiye's copy of the batch confirm card (EylemToplu). This IS the original Turkish text, moved here
 * unchanged so core carries none (scripts/ulke-turkce-tavan.mjs counts Turkish text outside countries/tr).
 * Labels are not overridden: Turkey uses the server's own (Turkish) field and action labels.
 */
import type { TopluMetin } from '@/components/core/topluMetin'

export const TOPLU_METIN_TR: TopluMetin = {
  kayitHazirlandi: (n) => `${n} kayıt hazırlandı`,
  uyariGordum: 'Uyarıyı gördüm, kaydedilebilir',
  eksikAciklama: 'Eksik alan var — aşağıya siz girin; doldurulmadan bu kayıt eklenmez. Ayşe bu alanları tahmin etmedi.',
  seciniz: 'Seçin…',
  seciliEksik: (alanlar) => `Seçili — ${alanlar.join(', ')} girilince eklenecek.`,
  kaydediliyor: 'Kaydediliyor…',
  kaydedildi: 'Kaydedildi',
  kaynak: 'Kaynak',
  dugme: (s) => {
    const parca = [`${s.hazir} hazır`]
    if (s.eksikli) parca.push(`${s.eksikli} kayıtta eksik alan var`)
    if (s.uyariBekleyen) parca.push(`${s.uyariBekleyen} kayıtta uyarı onayı bekliyor`)
    return `Seçilenleri kaydet (${parca.join(', ')})`
  },
  zaman: {
    azOnce: 'az önce',
    dakika: (n) => `${n} dakika önce`,
    saat: (n) => `${n} saat önce`,
    dun: 'dün',
    gun: (n) => `${n} gün önce`,
  },
  tarihYerel: 'tr-TR',
  eylemEtiketleri: {},
  alanEtiketleri: {},
}
