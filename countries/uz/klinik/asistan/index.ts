/**
 * NOTYA-ULKE-ASISTAN-01 — Uzbekistan: what the pack brings for THE ASSISTANT (lib/ulke/asistan/tipler.ts →
 * AsistanIcerigi). Server half; reached only through countries/active/klinik.
 *
 *   who the assistant is, per role     the owner's 40 names (../asistanAdlari.ts), titles by the pack's convention
 *   the sentences of the instruction   ./talimat.ts — MACHINE-WRITTEN, read by no clinician and no native reader
 *   authorities and reference works    ./kaynaklar.ts — one unconfirmed entry for every role, and an empty list per role
 *   voice                              ./ses.ts — speaking the question is on; hearing the answer is OFF
 *
 * NOTHING HERE HAS BEEN REVIEWED LOCALLY. `inceleme.klinisyen` stays null until the clinical lead has read every
 * persona and the lists of authorities and signed them, with a date, in docs/COUNTRY-PACK-UZBEKISTAN.md.
 */
import type { AsistanHastaVerisi, AsistanIcerigi } from '@/lib/ulke/asistan/tipler'
import { NOT_ALANLARI_ANAHTARI, type DilKodu } from '@/lib/ulke/tipler'
import { u } from '../../uygulama/araclar/yardimci'
import { uzYasMetni } from '../talimatlar'
import { UZ_ORTAK_KAYNAKLAR, UZ_ROL_KAYNAKLARI } from './kaynaklar'
import { UZ_ASISTAN_SES_CIKISI, UZ_ASISTAN_SES_GIRISI } from './ses'
import { uzAsistanParcalari } from './talimat'

type UzDil = 'uz-Latn' | 'uz-Cyrl' | 'ru'
const uzDil = (d: DilKodu): UzDil => (d === 'uz-Cyrl' || d === 'ru' ? d : 'uz-Latn')

// The labels of the message that carries one patient's data. MACHINE-WRITTEN; the Cyrillic form is derived by rule.
export const UZ_ASISTAN_HASTA_ETIKETLERI = {
  yas: u('Yoshi', 'Ёши', 'Возраст'),
  jins: u('Jinsi', 'Жинси', 'Пол'),
  ayol: u('ayol', 'аёл', 'женский'),
  erkak: u('erkak', 'эркак', 'мужской'),
  yoq: u('koʻrsatilmagan', 'кўрсатилмаган', 'не указан'),
  qayd: u('TASDIQLANGAN QAYD', 'ТАСДИҚЛАНГАН ҚАЙД', 'УТВЕРЖДЁННАЯ ЗАПИСЬ'),
  qaydYoq: u('Bu bemorning tasdiqlangan qaydi yoʻq.', 'Бу беморнинг тасдиқланган қайди йўқ.', 'У этого пациента нет утверждённых записей.'),
} as const

/**
 * What the model is given about ONE patient: age and sex, then each approved note with the day of its visit.
 * Never a name, a phone number, an identity number or an id — `veri` holds none.
 */
export function uzAsistanHastaGirdisi(dil: DilKodu, veri: AsistanHastaVerisi): string {
  const d = uzDil(dil)
  const e = UZ_ASISTAN_HASTA_ETIKETLERI
  const yas = uzYasMetni(d, veri.dogumTarihi, veri.bugun) || e.yoq[d]
  const jins = veri.cinsiyet === 'female' ? e.ayol[d] : veri.cinsiyet === 'male' ? e.erkak[d] : e.yoq[d]
  const notlar = veri.notlar.map((n) => {
    const alanlar = n.icerik.alanlar && Object.keys(n.icerik.alanlar).length ? { [NOT_ALANLARI_ANAHTARI]: n.icerik.alanlar } : {}
    return `${e.qayd[d]} (${n.tarih}):\n${JSON.stringify({ s: n.icerik.s, o: n.icerik.o, a: n.icerik.a, p: n.icerik.p, ...alanlar })}`
  })
  return [`${e.yas[d]}: ${yas}; ${e.jins[d]}: ${jins}.`, ...(notlar.length ? notlar : [e.qaydYoq[d]])].join('\n\n')
}

export const UZ_ASISTAN: AsistanIcerigi = {
  inceleme: { makineYazimi: true, klinisyen: null },
  // The owner, 2026-10-08: "20+years of uzbek medical pactice".
  kidemYili: 20,
  // STARTING VALUES, the owner's to confirm: questions per account and day, and the longest question.
  gunlukSoruLimiti: 100,
  soruAzamiKarakter: 4_000,
  parcalar: uzAsistanParcalari,
  kaynaklar: { ortak: UZ_ORTAK_KAYNAKLAR, roller: UZ_ROL_KAYNAKLARI },
  // "About this patient": the patient's age and sex and their three latest APPROVED notes. STARTING VALUES.
  // What leaves for the model provider is said to the doctor on the screen (../../uygulama/asistanMetinleri.ts).
  hastaModu: { acik: true, notSayisi: 3, notAzamiKarakter: 6_000 },
  hastaGirdisi: uzAsistanHastaGirdisi,
  ses: { giris: UZ_ASISTAN_SES_GIRISI, cikis: UZ_ASISTAN_SES_CIKISI },
}
