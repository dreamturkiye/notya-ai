/**
 * NOTYA-ULKE-EN-01 — THE ENGLISH LANGUAGE SET: the TOOLS AREA's own words — the grid and its search, what every tool
 * screen shares, keeping a result on a patient, the follow-up list. The words of each TOOL sit with the tool
 * (./araclar/).
 *
 * MACHINE-WRITTEN. No native editor and no clinician of any of the five countries has read this text.
 * Written fresh from the kit's keys (lib/ulke/arayuz/metinTipleri.ts → AraclarMetni).
 *
 * Written in en-GB spelling; `enAraclarMetni(country)` gives the catalogue in the country's form.
 * Placeholders %, %1, %2 stay in the text.
 */
import type { AraclarMetni } from '@/lib/ulke/arayuz/metinTipleri'
import type { EnUlkeSozleri } from './ulke'
import { enCevir } from './varyant'

export const EN_ARACLAR_METNI_TEMEL: AraclarMetni = {
  kabuk: { araclar: 'Tools' },
  izgara: {
    baslik: 'Tools',
    aciklama: 'Calculators, scales and checklists. A result supports a decision; diagnosis and treatment are the doctor\'s.',
    ara: 'Find a tool',
    araOrnek: 'Name or description',
    temel: 'Tools for everyone',
    rol: 'Tools for your specialty: %',
    bos: 'There are no tools yet.',
    sonucYok: 'Nothing found.',
    ac: 'Open tools',
  },
  arac: {
    geri: 'Back to tools',
    girdiler: 'What you enter',
    sonuc: 'Result',
    eksik: 'Fill in the fields that are needed to see a result. A value outside the accepted range is not counted.',
    madde: 'Item %',
    aralik: 'Accepted range: %1 to %2',
    oran: '%1 / %2',
    kopyala: 'Copy the summary',
    kopyalandi: 'Copied.',
    kopyalanamadi: 'Could not copy.',
    temizle: 'Clear',
    kaynak: 'Source: %',
    saklanmaz: 'What you enter here is not stored: it is gone when you leave the page.',
    yok: 'Your account does not have this tool.',
  },
  portal: {
    nasil: 'Find the patient and open their file: the link and the PIN are created under "Patient\'s page", and that is also where you choose what to share.',
  },
  kayit: {
    hastaIcin: 'Patient: %',
    hastaBulunamadi: 'No such patient was found in your account. To keep a result, open the tools from the patient file.',
    hastasiz: 'To keep a result in a patient\'s file, open the tools from the patient file.',
    baslik: 'Keep in the patient\'s file',
    aciklama: 'Nothing is kept until you press "Keep". What you entered and the result are kept. Nothing is sent to anybody.',
    takipTarihi: 'Follow-up date (optional)',
    takipIpucu: 'You enter the date yourself: the system proposes none. The date you enter appears on your follow-up list.',
    kaydet: 'Keep',
    kaydedildi: 'Kept in the patient\'s file.',
    dosyayaGit: 'Open the patient file',
    eksik: 'To keep it, fill in the tool first: a result must be shown.',
    takipGecersiz: 'The follow-up date must be today or later.',
    yapilamadi: 'Could not keep it. Please try again.',
    dosyaBaslik: 'Tool results',
    dosyaAciklama: 'Calculations, scales and checklists kept for this patient. A result supports a decision; diagnosis and treatment are the doctor\'s.',
    dosyaBos: 'No results kept yet.',
    araclariAc: 'Open the tools for this patient',
    takipGunu: 'Follow-up: %',
    takipKapandi: 'Follow-up (%) done',
    okunamadi: 'This entry cannot be shown.',
    aracYok: 'A tool the system no longer has',
  },
  takip: {
    aciklama: 'Results kept in patients\' files with a follow-up date, the earliest first. You entered the dates yourself; the system sends nothing to anybody.',
    bos: 'No follow-up is open.',
    gecikti: 'Overdue',
    bugun: 'Today',
    kapat: 'Done',
    kapatildi: 'The follow-up has been marked as done.',
    yapilamadi: 'Could not mark it. Please try again.',
    okunamadi: 'The list could not be read. Reload the page.',
  },
}

/** The tools area's catalogue in a country's form of English. */
export function enAraclarMetni(u: EnUlkeSozleri): AraclarMetni {
  return enCevir(EN_ARACLAR_METNI_TEMEL, u.bicim)
}
