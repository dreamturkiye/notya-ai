/**
 * NOTYA-AKTIF-HASTA-01 (Kaan / Dr. Gökhan, 2026-09-25; restored by Kaan's decision 2026-09-29 over
 * NOTYA-SES-DOSYA-ISTE-01): with a patient open — opened by name in this session OR the page the doctor is on
 * (NOTYA-SAYFA-HASTA-01) — a question that does not name another patient is about THAT patient
 * ("En son ne zaman geldi?", "Aşıları tam mı?"), not an all-patients search ("0 hasta, Filtre: …").
 * Only explicit many-patient questions and calendar questions stay a search; a name that matches several
 * patients still asks which one.
 */
import { trAramaNormalize } from '@/lib/utils/turkceArama'
import { takvimSorusuMu } from '@/lib/randevu/takvimSorusu'
import { soruTuruBul } from '@/lib/asistan/dosyaSorgu/soruTuru'

const KOHORT = /hasta var mi|hasta geldi mi|hastam var mi|\bhastalar|\bhastalarim|kac hasta|kac kisi|kac cocuk|kac vaka|hangi hasta|\bkimler\b|tum hasta|butun hasta|en cok|en sik|\btoplam\b|istatistik/

export function kohortSorusuMu(mesaj: string): boolean {
  return KOHORT.test(' ' + trAramaNormalize(String(mesaj || '')) + ' ')
}

/**
 * NOTYA-SES-AKTIF-HASTA-01 (Kaan, 2026-09-29): "hastamız / bu hasta / kendisi / dosyadaki hasta / o" point at
 * the session's active patient. Kept as a classifier (tests, future narrowing); under the restored
 * NOTYA-AKTIF-HASTA-01 rule every unnamed non-cohort, non-calendar question already reaches the open patient.
 */
const ATIF = /\b(hastamiz\w*|hastam\b|hastamin|hastama|hastami|bu hasta\w*|su hasta\w*|o hasta\w*|bu cocuk\w*|cocugumuz\w*|kendisi\w*|dosyadaki\w*|bu dosya\w*|acik dosya\w*|onun|ona|onu|o kac|o ne zaman|o kimdir|o kim)\b/

export function hastaAtifiMu(mesaj: string): boolean {
  const m = ' ' + trAramaNormalize(String(mesaj || '')) + ' '
  if (kohortSorusuMu(mesaj)) return false
  // NOTYA-LUNA-ARAMA-01 (2026-09-29): the İlk 10 dossier questions ("Aşıları tam mı?", "Büyümesi nasıl gidiyor?",
  // "İlaçları neler?") carry a 3rd-person possessive — they ARE a reference to the patient opened by name.
  // Without this, the follow-up after "X dosyasını aç" reached the model with no chart and Ayşe invented one.
  return ATIF.test(m) || soruTuruBul(mesaj) !== null
}

/** "X'in dosyasını açar mısın / kartını getir / kaydına bakalım" — a chart-open request. */
const DOSYA_AC = /\b(dosya\w*|kart\w*|kayd\w*|kaydi)\b[^.?!]{0,40}\b(ac\w*|getir\w*|goster\w*|bak\w*)\b/
export function dosyaAcmaIstegiMi(mesaj: string): boolean {
  return DOSYA_AC.test(' ' + trAramaNormalize(String(mesaj || '')) + ' ')
}

/**
 * NOTYA-AKTIF-HASTA-01: with a patient open, an unnamed question goes to that patient.
 * A patient found BY NAME wins; a single hit of an all-patients search (has a count sentence) does not
 * (NOTYA-SES-DOLGU-01). Calendar questions and explicit many-patient questions never bind the chart.
 */
export function aktifHastaKullanilsinMi(g: {
  aktifHastaVar: boolean
  cozumTur: 'tek' | 'coklu' | 'yok'
  /** true when the search result is an all-patients filter search (has a count sentence) */
  aramaSonucu: boolean
  mesaj: string
}): boolean {
  if (!g.aktifHastaVar) return false
  if (g.cozumTur === 'tek' && !g.aramaSonucu) return false
  if (g.cozumTur === 'coklu' && !g.aramaSonucu) return false
  if (takvimSorusuMu(g.mesaj)) return false
  return !kohortSorusuMu(g.mesaj)
}
