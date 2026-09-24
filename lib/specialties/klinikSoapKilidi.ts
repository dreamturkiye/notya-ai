/**
 * KLINIK-AYNA-01 — SOAP kilitleri. Müttefik tanı koyamaz; hekim klinik doz/greft uydurmaz.
 */
import { hekimKlinikMi, muttefikMeslekMi, KLINIK_HEKIM_KILIT, MUTTEFIK_TANI_KILIT } from './klinikDikey'

export function klinikSoapKilidi(...branslar: (string | null | undefined)[]): string {
  if (branslar.some((b) => muttefikMeslekMi(b))) {
    return `\nKLINIK MÜTTEFIK KİLİDİ (29.03.2025 md.16–18 + KVKK m.6):\n${MUTTEFIK_TANI_KILIT}\n` +
      'degerlendirme alanına kendi tanını YAZMA. Hekim tanısı varsa "Hekim tanısı (referans): …" diye belgele.\n' +
      'plan: bu seansta yapılan uygulama + hekimin söylediği devam. Reçete / mg / ICD / tetkik isteği YOK.\n' +
      'rıza: yazılı rıza alınmadıysa seans kaydı eksiktir. Kayıt silinmez; hasta m.16 suret isteyebilir.\n'
  }
  if (branslar.some((b) => hekimKlinikMi(b))) {
    return `\nKLINIK HEKİM KİLİDİ (Ayakta Teşhis md.24 + Hasta Hakları m.26 + KVKK m.6):\n${KLINIK_HEKIM_KILIT}\n` +
      'Greft, ünite, mL yalnız hekim söylediyse yaz. Foto rızasız arşive gitmez.\n' +
      'Vasküler oklüzyon / IV reaksiyon / donor nekroz → 112.\n'
  }
  return ''
}
