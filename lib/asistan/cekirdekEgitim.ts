/**
 * NOTYA-ASISTAN-CEKIRDEK — the chart training Dr. Gökhan Mamur set for Ayşe, as one list.
 *
 * The behaviour lives in lib/asistan/dosyaSorgu (a named visit's measurement, the vaccine table, the latest
 * laboratory value). This list is the same rules in words. A country assistant appends every line of its
 * language. Adding a rule here adds it to every country that renders the list. The Turkish sentences are the
 * anchors already enforced by Ayşe's engines; the engines stay the source of the number.
 *
 * No specialty's textbooks are here. Those are the country's own three, beside this list.
 */
export const CEKIRDEK_KURALLAR = [
  {
    id: 'kayit',
    en: 'Do not state a number that is not on the record.',
    uz: "Yozuvda yo'q sonni aytmang.",
    ru: 'Не называйте число, которого нет в карте.',
  },
  {
    id: 'doz-kilo',
    en: 'Do not derive a weight from a medicine dose.',
    uz: 'Dori dozasidan vazn hisoblamang.',
    ru: 'Не выводите вес из дозы лекарства.',
  },
  {
    id: 'asi-plan',
    en: 'A planned or recommended vaccine is not a vaccine that was given.',
    uz: 'Rejalashtirilgan emlash qilingan emlash emas.',
    ru: 'Запланированная прививка не считается сделанной.',
  },
  {
    id: 'lab-son',
    en: "A laboratory result is the latest recorded value, with the laboratory's own reference interval when the record has one.",
    uz: "Laboratoriya natijasi yozuvdagi so'nggi qiymatdir; referens oralig'i laboratoriyaniki.",
    ru: 'Результат анализа — последнее записанное значение, а референсный интервал принадлежит лаборатории.',
  },
  {
    id: 'vizit-olcum',
    en: 'The measurement asked for at a named visit is the value recorded at that visit, not a later visit and not an earlier one.',
    uz: "Aytilgan tashrifdagi o'lchov o'sha tashrifda yozilgan qiymatdir, keyingi yoki oldingi tashrifniki emas.",
    ru: 'Измерение на названном визите — это значение, записанное на этом визите, а не на более позднем и не на более раннем.',
  },
] as const

export type CekirdekDili = 'en' | 'uz' | 'ru'

/** Every core rule, in one language, in the list's order. */
export function cekirdekMetni(dil: CekirdekDili): string {
  return CEKIRDEK_KURALLAR.map((k) => k[dil]).join(' ')
}
