/**
 * ARACLAR-CILA-01 Faz 2 — Doktor Araçları çıktısının bugünkü muayene notuna eklenen düz metin bloğu.
 *
 * Sorun: her araç "TASLAK — nota otomatik yazılmaz" ile bitiyordu ve hekim sonucu ELLE tekrar yazıyordu.
 * Çözüm mevcut ve çalışan yol: lib/doktor/gununNotunaEkle.ts (M-CHAT-R/F, gelişim taraması ve
 * /api/doktor/pediatri/tarama aynı yoldan yazar) + lib/doktor/muayeneFormuYolu.ts ile forma dönüş.
 *
 * Buradaki tek iş, bloğun METNİNİ kurmak ve güvenli tutmak — saf fonksiyon, sunucuda ve testte aynı:
 *   • hekim düzenleyebilsin diye düz metin (başlık + tire işaretli satırlar), markdown/JSON yok;
 *   • tanı / doz / evre İDDİASI eklenmez — satırlar aracın zaten ekranda gösterdiği metindir ve
 *     blok "araç çıktısı — hekim ekledi" diye etiketlenir (hekim kilidi görünür kalır);
 *   • T.C. kimlik numarasına benzeyen 11 haneli dizi bloğa girmez (nota PHI kopyalamayız);
 *   • satır ve uzunluk tavanı: bir araç yanlışlıkla notu doldurmasın.
 *
 * HİÇBİR ŞEY OTOMATİK YAZILMAZ: bu blok yalnız hekim "Bugünkü muayene formuna ekle"ye bastığında
 * /api/doktor/araclar/nota-ekle üzerinden yazılır.
 */

/** gununNotunaEkle'nin yazabildiği not alanları — araç çıktısı varsayılan olarak Değerlendirme'ye gider. */
export const ARAC_NOT_ALANLARI = ['content_degerlendirme', 'content_subjektif', 'content_objektif'] as const
export type AracNotAlani = (typeof ARAC_NOT_ALANLARI)[number]

export const ARAC_NOT_ETIKETI = 'araç çıktısı — hekim ekledi'

const EN_COK_SATIR = 24
const SATIR_TAVANI = 300
const ARAC_ADI_TAVANI = 80

/** 11 haneli T.C. kimlik no benzeri diziyi maskeler (nota kimlik numarası kopyalanmaz). */
export function tcMaskele(s: string): string {
  return s.replace(/(?<!\d)\d{11}(?!\d)/g, '***********')
}

const temizle = (s: unknown, tavan: number) =>
  tcMaskele(String(s ?? '').replace(/\s+/g, ' ').trim()).slice(0, tavan)

/**
 * Bugünkü nota eklenecek blok. Geçerli satır yoksa null döner (boş blok yazılmaz).
 *
 * Örnek:
 *   [2026-09-19] VA / logMAR (araç çıktısı — hekim ekledi)
 *   - OD (sağ): önceki 0,5 · bugün 0,8 · ETDRS farkı +8 harf
 *   - OS (sol): önceki 0,6 · bugün 0,6 · ETDRS farkı 0 harf
 */
export function aracNotBlogu(arac: unknown, satirlar: unknown, bugunIso: string): string | null {
  const ad = temizle(arac, ARAC_ADI_TAVANI)
  const ham = Array.isArray(satirlar) ? satirlar : typeof satirlar === 'string' ? String(satirlar).split('\n') : []
  const temiz = ham.map((x) => temizle(x, SATIR_TAVANI)).filter(Boolean).slice(0, EN_COK_SATIR)
  if (!ad || !temiz.length) return null
  const gun = /^\d{4}-\d{2}-\d{2}$/.test(bugunIso) ? bugunIso : ''
  const baslik = `${gun ? `[${gun}] ` : ''}${ad} (${ARAC_NOT_ETIKETI})`
  return [baslik, ...temiz.map((x) => `- ${x}`)].join('\n')
}

/** İstanbul saatiyle bugün (UTC+3) — gununNotunaEkle ile aynı gün tanımı. */
export function aracNotuBugun(simdi: number = Date.now()): string {
  return new Date(simdi + 3 * 3600e3).toISOString().slice(0, 10)
}
