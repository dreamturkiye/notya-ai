/**
 * NOTYA-SES-DOSYA-ISTE-01 (Kaan, 2026-09-29): a patient's chart is opened only when THIS
 * message uniquely names them. Page focus / previous-turn "aktif hasta" never preloads a
 * dossier — that cache made every voice turn wait on the chart and then speak late.
 * "Kaan Arioglu kaç yaşında?" → resolve Kaan → read age. "Nasılsınız?" → no file.
 */
import { trAramaNormalize } from '@/lib/utils/turkceArama'
import { soruTuruBul } from '@/lib/asistan/dosyaSorgu/soruTuru'

const KOHORT = /hasta var mi|hasta geldi mi|hastam var mi|\bhastalar|\bhastalarim|kac hasta|kac kisi|kac cocuk|kac vaka|hangi hasta|\bkimler\b|tum hasta|butun hasta|en cok|en sik|\btoplam\b|istatistik/

export function kohortSorusuMu(mesaj: string): boolean {
  return KOHORT.test(' ' + trAramaNormalize(String(mesaj || '')) + ' ')
}

/**
 * NOTYA-SES-AKTIF-HASTA-01 (Kaan, 2026-09-29): "hastamız / bu hasta / kendisi / dosyadaki hasta / o" point at
 * the session's active patient (the one last opened by name). Only such a reference reaches the chart —
 * an unreferenced question ("Nasılsınız?", "En son ne zaman geldi?") still opens nothing (DOSYA-ISTE-01).
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

/** True only for a referenced active patient when this message names nobody and no search matched. */
export function aktifHastaKullanilsinMi(g: {
  aktifHastaVar: boolean
  cozumTur: 'tek' | 'coklu' | 'yok'
  aramaSonucu: boolean
  mesaj: string
}): boolean {
  if (!g.aktifHastaVar || g.cozumTur !== 'yok' || g.aramaSonucu) return false
  return hastaAtifiMu(g.mesaj)
}
