/**
 * DENEME-BILDIRIM-01 — the Turkish words of the internal "Yeni deneme kaydı" e-mail (Türkiye build only; the shared
 * module lib/kurucu/denemeBildirimi.ts carries the English words, so no Turkish text reaches a country build).
 */
import type { BildirimSozlugu } from './denemeBildirimi'

export const TR_SOZLUK: BildirimSozlugu = {
  yerel: 'tr-TR',
  saatEki: 'Türkiye saati',
  konu: (ulke, brans) => `Yeni deneme kaydı — ${ulke} — ${brans}`,
  yok: 'verilmedi',
  plan: { paid: 'Ücretli', paidPending: 'Ücretli plan seçildi', trial: 'Ücretsiz deneme', bekleyenEki: ' — ödeme henüz tamamlanmadı' },
  etiket: { ad: 'Ad Soyad', eposta: 'E-posta', telefon: 'Telefon', brans: 'Branş', ulke: 'Ülke', plan: 'Plan', zaman: 'Kayıt zamanı', toplam: (u) => `Toplam doktor kaydı (${u}, bu dahil)` },
  altBilgi: 'Notya iç bildirimi — hasta verisi içermez.',
}
