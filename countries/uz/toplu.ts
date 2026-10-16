/**
 * TOPLU-ULKE-01 — Uzbekistan (Latin script): the batch confirm card (EylemToplu).
 *
 * MACHINE-WRITTEN. A native speaker must read every line before the country goes public (same standing as
 * countries/uz/metinler.ts, checklist E11). Uses U+02BB (ʻ) in oʻ / gʻ as the rest of the pack does.
 * Covers the pack's default language (uz-Latn) only; an account that picks Russian or Cyrillic still sees this card in
 * Uzbek Latin until the card takes the account's language (logged in docs/OPEN-COMMITMENTS.md).
 * Keys are the BASE medication action's (core/eylemler/temelEylemler.ts), the same on every release branch.
 */
import type { TopluMetin } from '@/components/core/topluMetin'

export const UZ_TOPLU: TopluMetin = {
  kayitHazirlandi: (n) => `${n} ta yozuv tayyorlandi`,
  uyariGordum: 'Ogohlantirishni koʻrdim, saqlash mumkin',
  eksikAciklama: 'Majburiy maydon toʻldirilmagan — quyida oʻzingiz kiriting; toʻldirilmaguncha bu yozuv qoʻshilmaydi. Yordamchi bu maydonlarni taxmin qilmadi.',
  seciniz: 'Tanlang…',
  seciliEksik: (alanlar) => `Tanlangan — ${alanlar.join(', ')} kiritilgach qoʻshiladi.`,
  kaydediliyor: 'Saqlanmoqda…',
  kaydedildi: 'Saqlandi',
  kaynak: 'Manba',
  dugme: (s) => {
    const parca = [`${s.hazir} ta tayyor`]
    if (s.eksikli) parca.push(`${s.eksikli} ta yozuvda maydon yetishmaydi`)
    if (s.uyariBekleyen) parca.push(`${s.uyariBekleyen} ta yozuvda ogohlantirishni tasdiqlash kutilmoqda`)
    return `Tanlanganlarni saqlash (${parca.join(', ')})`
  },
  zaman: {
    azOnce: 'hozirgina',
    dakika: (n) => `${n} daqiqa oldin`,
    saat: (n) => `${n} soat oldin`,
    dun: 'kecha',
    gun: (n) => `${n} kun oldin`,
  },
  tarihYerel: 'uz-Latn',
  eylemEtiketleri: { ilac_ekle: 'Dori qoʻshish' },
  alanEtiketleri: {
    ilac_adi: 'Dori',
    etken_madde: 'Faol modda',
    doz: 'Doza',
    kullanim_sikli: 'Qabul qilish chastotasi',
    baslangic_tarihi: 'Boshlanish sanasi',
    bitis_tarihi: 'Tugash sanasi',
    notlar: 'Izoh',
  },
}
