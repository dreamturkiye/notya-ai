/**
 * KLINIK-AYNA-01 — SOAP kilitleri. Müttefik tanı koyamaz; hekim klinik doz/greft uydurmaz.
 */
import { hekimKlinikMi, muttefikMeslekMi, KLINIK_HEKIM_KILIT, MUTTEFIK_TANI_KILIT } from './klinikDikey'

export function klinikSoapKilidi(...branslar: (string | null | undefined)[]): string {
  if (branslar.some((b) => muttefikMeslekMi(b))) {
    return `\nKLINIK MÜTTEFIK KİLİDİ (29.03.2025):\n${MUTTEFIK_TANI_KILIT}\n` +
      'degerlendirme alanına kendi tanını YAZMA. Hekim tanısı varsa "Hekim tanısı (referans): …" diye belgele.\n' +
      'plan: bu seansta yapılan uygulama + hekimin söylediği devam. Reçete / mg / ICD kilidi YOK.\n'
  }
  if (branslar.some((b) => hekimKlinikMi(b))) {
    return `\nKLINIK HEKİM KİLİDİ:\n${KLINIK_HEKIM_KILIT}\n` +
      'Greft, ünite, mL yalnız hekim söylediyse yaz. Vasküler oklüzyon / IV reaksiyon / donor nekroz → 112.\n'
  }
  return ''
}
