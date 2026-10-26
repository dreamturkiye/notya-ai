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

// NOTYA-AYSE-100-LUNA (#89, 2026-09-29): "… vakası kimdi / hangi çocuk kimdi / dün gelen vaka" is a who-question over
// the practice, never about the open chart — with R.D. open, "bu hafta pnömoni vakası kimdi" was answered from R.D.
// NOTYA-KORPUS-KALAN-01 (Y-083): "kaç tane hasta kaydım var toplam" — "kaç TANE hasta" and "hasta kaydım" are the
// panel count too. With a chart open the question went to the model with that chart instead of the count.
// NOTYA-AYSE-SAYI-SIRA-01: "hasta sayımız kaç", "kaç kayıtlı hastam var" are the panel count as well.
const KOHORT = /hasta var mi|hasta geldi mi|hastam var mi|\bhastalar|\bhastalarim|kac (tane |adet )?(kayitli |aktif )?hasta|\bhasta sayi(si|sini|miz|mizi|m|mi|niz|nizi)?\b|kac kisi|kac cocuk|kac vaka|\bhasta (kaydim|kaydimiz|kayitlarim)\b|hangi hasta|\bkimler\b|\bkimdi\b|\bkimlerdi\b|\bvaka(lari|lar)\w*|tum hasta|butun hasta|istatistik/
/**
 * NOTYA-AYSE-GERI-01 (audit §4.3, PR 9): "toplam / en çok / en sık / vaka" alone are not a practice-wide question.
 * With a chart open, "Toplam kaç aşısı var" and "En çok hangi şikayetle geldi" are about THAT patient and were
 * answered "Kayıtlarda 0 hasta." They count as cohort words only next to a sign that the doctor means the
 * practice: a plural patient word, a first-person / passive practice verb ("yazdığım", "görülen", "gelen") or the
 * practice itself.
 */
const KOHORT_ZAYIF = /\ben cok\b|\ben sik\b|\btoplam\b|\bvaka(si|m)?\b/
const PRATIK_ISARETI = /\bhastalar\w*|\bcocuklar\w*|\bbebekler\w*|\b(yazdig|gordug|koydug|verdig|baktig|yaptig|istedig)\w*|\b(yazdim|gordum|koydum|verdim|baktim|yaptim|yazdik|gorduk|koyduk|baktik)\b|\b(gorulen|konulan|yazilan|gelen)\b|\bpratig\w*|\bmuayenehane\w*|\bklinig\w*|\bgenel(de)?\b/

function kohortSorusuTemel(mesaj: string): boolean {
  const n = ' ' + trAramaNormalize(String(mesaj || '')) + ' '
  return KOHORT.test(n) || (KOHORT_ZAYIF.test(n) && PRATIK_ISARETI.test(n))
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
  return !acikDosyaDisiSoruMu(g.mesaj)
}

// NOTYA-AYSE-KOHORT-01 (Kaan, 2026-10-02): a question about what the doctor wrote, saw or diagnosed, ranked or counted
// ('Son bir ay icinde hangi antibiyotigi en fazla yazdim?'), is about the practice even with a chart open. The 09-21 fix
// (4534e28f, 77962a9e) ranks the practice, but the 09-25 single-brain classifier above only knew en cok / en sik, so with a
// chart open the question was answered from the open chart (or by the quick card) and the ranking never ran. A first-person
// past verb of the doctor plus a ranking or counting word is a practice question, unless the sentence points at this
// patient or asks about a dose.
function sadeTrPratik(m: string): string {
  const k = String(m || '').toLocaleLowerCase('tr').replace(/\u00e7/g, 'c').replace(/\u011f/g, 'g').replace(/\u0131/g, 'i').replace(/\u00f6/g, 'o').replace(/\u015f/g, 's').replace(/\u00fc/g, 'u')
  return ' ' + k.replace(/[^a-z0-9 ]/g, ' ').replace(/ +/g, ' ').trim() + ' '
}
const PRATIK_SIRALAMA_KALIBI = / en (fazla|cok|sik|az|yuksek) | hangi .* en | kac (kez|defa|tane|recete|hasta) | toplam /
const DOKTOR_GECMIS_FIILI = / (yazdim|yazmisim|yazdigim|recete ettim|recete ettigim|recete yazdim|kullandim|kullandigim|verdim|verdigim|gordum|gorduklerim|baktim|baktigim|tani koydum|koydum|koydugum|yaptim|istedim|istedigim) /
const BU_HASTAYA_GONDERME = / (bu|su) (hasta|cocuk|bebek)[a-z]* | onun | ona | hastanin | hastaya ozel /
const DOZ_SORUSU = / (mg|ml|kg|doz|dozu|dozunu|gunde) /
// NOTYA-AYSE-ARAC-PARITE (2026-10-02): 'Son bir ayda kac asi yaptik?' with a chart open was answered from the open chart
// ('... dosyada asi: KKK 28 Eylul'). The rule above knows 'kac recete / kac hasta' and first person singular; it missed
// the count of vaccines and the plural ('yaptik', 'uyguladik'). A count of what the practice DID inside a stated time
// window is a practice question. Without a window ('Kac asi yaptik?') it stays with the open chart, as before.
const PRATIK_SAYIM_KALIBI = / kac (tane )?(asi|recete|muayene|kontrol)[a-z]* /
const PRATIK_SAYIM_FIILI = / (yaptik|yaptim|uyguladik|uyguladim|vurduk|vurdum|yazdik|yazdim|gorduk|baktik) /
const ZAMAN_PENCERESI = / (bugun|dun|bu (hafta|ay|yil)|gecen (hafta|ay|yil)|son (bir|iki|uc|dort|bes|alti|[0-9]+) (gun|hafta|ay|yil)[a-z]*) /
// NOTYA-KORPUS-KALAN-01 (Y-091): "dün gelen ateşli çocuk" with a chart open was answered by the open chart's quick
// card ("… son ölçüm: kayıt yok"). A patient described BY A VISIT inside a stated time window ("dün gelen …",
// "bu hafta gördüğüm …", "geçen hafta muayene ettiğim …") is somebody the doctor is looking for in the practice —
// the open chart cannot be "the child who came yesterday" unless the search finds it. Without a window ("ateşi olan
// çocuk için ne önerirsin") the sentence stays with the open chart, as before.
// It is NOT a count / list question (kohortSorusuMu): when the search finds nobody the turn still goes to the model,
// never to a "Dün 0 hasta" sentence (NOTYA-AYSE-GERI-01).
const ZIYARETLE_TARIF = / (gelen|gelmis olan|gordugum|gordugumuz|baktigim|baktigimiz|muayene ettigim|muayene ettigimiz)( [a-z0-9]+){0,3} (hasta|hastam|hastamiz|hastayi|cocuk|cocugu|bebek|bebegi|vaka|vakasi|kiz|oglan) /
export function ziyaretleTarifMi(mesaj: string): boolean {
  const n = sadeTrPratik(mesaj)
  return ZIYARETLE_TARIF.test(n) && ZAMAN_PENCERESI.test(n) && !BU_HASTAYA_GONDERME.test(n)
}
/** With a chart open: is the question about the practice (a count, a list, a patient described by a visit) rather than that chart? */
export function acikDosyaDisiSoruMu(mesaj: string): boolean {
  return kohortSorusuMu(mesaj) || ziyaretleTarifMi(mesaj)
}
export function kohortSorusuMu(...a: Parameters<typeof kohortSorusuTemel>): boolean {
  if (kohortSorusuTemel(...a)) return true
  const n = sadeTrPratik(String(a[0] ?? ''))
  // 'son 30 gunde' is a time window, not the dose word 'gunde' ('gunde 3 kez').
  const dozIcin = n.replace(/ son (bir|iki|uc|dort|bes|alti|[0-9]+) gunde /g, ' ')
  if (BU_HASTAYA_GONDERME.test(n) || DOZ_SORUSU.test(dozIcin)) return false
  if (PRATIK_SIRALAMA_KALIBI.test(n) && DOKTOR_GECMIS_FIILI.test(n)) return true
  return PRATIK_SAYIM_KALIBI.test(n) && PRATIK_SAYIM_FIILI.test(n) && ZAMAN_PENCERESI.test(n)
}
