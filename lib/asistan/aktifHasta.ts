/**
 * NOTYA-SES-DOSYA-ISTE-01 (Kaan, 2026-09-29): a patient's chart is opened only when THIS
 * message uniquely names them. Page focus / previous-turn "aktif hasta" never preloads a
 * dossier — that cache made every voice turn wait on the chart and then speak late.
 * "Kaan Arioglu kaç yaşında?" → resolve Kaan → read age. "Nasılsınız?" → no file.
 */
import { trAramaNormalize } from '@/lib/utils/turkceArama'

const KOHORT = /hasta var mi|hasta geldi mi|hastam var mi|\bhastalar|\bhastalarim|kac hasta|kac kisi|kac cocuk|kac vaka|hangi hasta|\bkimler\b|tum hasta|butun hasta|en cok|en sik|\btoplam\b|istatistik/

export function kohortSorusuMu(mesaj: string): boolean {
  return KOHORT.test(' ' + trAramaNormalize(String(mesaj || '')) + ' ')
}

/** Always false: focus is not a chart. Kept so callers do not fork a second rule. */
export function aktifHastaKullanilsinMi(_g: {
  aktifHastaVar: boolean
  cozumTur: 'tek' | 'coklu' | 'yok'
  aramaSonucu: boolean
  mesaj: string
}): boolean {
  return false
}
