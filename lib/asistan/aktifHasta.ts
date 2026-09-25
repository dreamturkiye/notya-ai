/**
 * NOTYA-AKTIF-HASTA-01 (Kaan / Dr. Gökhan, 2026-09-25): with a patient open, a question that does not name
 * another patient is about THAT patient — "En son ne zaman geldi?", "Tansiyon takibini nasıl planlarsın?" —
 * not an all-patients search ("0 hasta, Filtre: …"). Only explicit many-patient questions stay a search,
 * and a name that matches several patients still asks which one.
 */
import { trAramaNormalize } from '@/lib/utils/turkceArama'

const KOHORT = /hasta var mi|hasta geldi mi|hastam var mi|\bhastalar|\bhastalarim|kac hasta|kac kisi|kac cocuk|kac vaka|hangi hasta|\bkimler\b|tum hasta|butun hasta|en cok|en sik|\btoplam\b|istatistik/

export function kohortSorusuMu(mesaj: string): boolean {
  return KOHORT.test(' ' + trAramaNormalize(String(mesaj || '')) + ' ')
}

export function aktifHastaKullanilsinMi(g: {
  aktifHastaVar: boolean
  cozumTur: 'tek' | 'coklu' | 'yok'
  /** true when the search result is an all-patients filter search (has a count sentence) */
  aramaSonucu: boolean
  mesaj: string
}): boolean {
  if (!g.aktifHastaVar) return false
  // A patient found BY NAME wins; a single hit of an all-patients search (has a count sentence) does not.
  if (g.cozumTur === 'tek' && !g.aramaSonucu) return false
  if (g.cozumTur === 'coklu' && !g.aramaSonucu) return false
  return !kohortSorusuMu(g.mesaj)
}
