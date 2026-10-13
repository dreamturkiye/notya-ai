/**
 * NOTYA-ULKE-DEMO-01 — Uzbekistan: the words of the "Book a demo" page (/demo) and of its button on the landing page,
 * in every form the landing page is written in (Uzbek in Latin and Cyrillic script, Russian). Machine-written: a
 * native reader of each form must check it before the booking link is set. No claim about compliance, certification,
 * integrations, prices or results.
 *
 * The landing copy's banned-phrase list (./acilis/yasakliIfadeler.ts, "no public demo") guards the landing copy, not
 * this page: Kaan decided on 2026-10-13 that every Notya site gets a page to book a demo call with Dr. Gokhan Mamur.
 * The name is written "Gokhan" in Latin script, without the Turkish letter ö, as text in other languages often does
 * (and as scripts/ulke-turkce-tavan.mjs requires outside countries/tr).
 */
import type { UlkeDemosu } from '@/lib/ulke/demo/tipler'

export const UZ_DEMO: UlkeDemosu = {
  'uz-Latn': {
    meta: { baslik: 'Demo uchrashuvga yozilish — Notya', aciklama: 'Dr. Gokhan Mamur bilan 60 daqiqalik video qoʻngʻiroqqa yoziling.' },
    dugme: 'Demo uchrashuvga yozilish',
    baslik: 'Demo uchrashuvga yozilish',
    giris: 'Dr. Gokhan Mamur bilan 60 daqiqalik video qoʻngʻiroq. Vaqtlar oʻz vaqt mintaqangizda koʻrsatiladi.',
    yakinda: 'Demo uchrashuvga yozilish tez orada ochiladi.',
    yakindaGovde: 'Taqvim tayyor boʻlgach, shu sahifaning oʻzida vaqt band qilishingiz mumkin boʻladi.',
    saglayici: 'Vaqt band qilish Cal.com orqali amalga oshiriladi.',
    takvimEtiketi: 'Demo uchrashuv taqvimi',
    bolum: {
      ustBaslik: 'Demo uchrashuv',
      baslik: 'Notyani',
      baslikVurgu: 'jonli koʻring',
      govde: 'Dr. Gokhan Mamur video qoʻngʻiroqda haqiqiy qabulni koʻrsatib beradi — 60 daqiqa, sizga mos vaqtda.',
      kartEtiketi: 'Qoʻngʻiroqda',
      satirlar: [
        { k: 'Jonli koʻrsatma', v: 'Haqiqiy qabul, boshidan oxirigacha' },
        { k: '60 daqiqa', v: 'Vaqtlar oʻz vaqt mintaqangizda' },
        { k: 'Savollaringiz', v: 'Ular uchun ham vaqt ajratiladi' },
      ],
    },
  },
  'uz-Cyrl': {
    meta: { baslik: 'Демо учрашувга ёзилиш — Notya', aciklama: 'Др. Гёкхан Мамур билан 60 дақиқалик видео қўнғироққа ёзилинг.' },
    dugme: 'Демо учрашувга ёзилиш',
    baslik: 'Демо учрашувга ёзилиш',
    giris: 'Др. Гёкхан Мамур билан 60 дақиқалик видео қўнғироқ. Вақтлар ўз вақт минтақангизда кўрсатилади.',
    yakinda: 'Демо учрашувга ёзилиш тез орада очилади.',
    yakindaGovde: 'Тақвим тайёр бўлгач, шу саҳифанинг ўзида вақт банд қилишингиз мумкин бўлади.',
    saglayici: 'Вақт банд қилиш Cal.com орқали амалга оширилади.',
    takvimEtiketi: 'Демо учрашув тақвими',
    bolum: {
      ustBaslik: 'Демо учрашув',
      baslik: 'Notyani',
      baslikVurgu: 'жонли кўринг',
      govde: 'Др. Гёкхан Мамур видео қўнғироқда ҳақиқий қабулни кўрсатиб беради — 60 дақиқа, сизга мос вақтда.',
      kartEtiketi: 'Қўнғироқда',
      satirlar: [
        { k: 'Жонли кўрсатма', v: 'Ҳақиқий қабул, бошидан охиригача' },
        { k: '60 дақиқа', v: 'Вақтлар ўз вақт минтақангизда' },
        { k: 'Саволларингиз', v: 'Улар учун ҳам вақт ажратилади' },
      ],
    },
  },
  ru: {
    meta: { baslik: 'Записаться на демо — Notya', aciklama: 'Запишитесь на 60-минутный видеозвонок с доктором Гёкханом Мамуром.' },
    dugme: 'Записаться на демо',
    baslik: 'Записаться на демо',
    giris: '60-минутный видеозвонок с доктором Гёкханом Мамуром. Время показано в вашем часовом поясе.',
    yakinda: 'Запись на демо скоро откроется.',
    yakindaGovde: 'Когда календарь будет готов, записаться можно будет прямо на этой странице.',
    saglayici: 'Запись проводится через Cal.com.',
    takvimEtiketi: 'Календарь записи на демо',
    bolum: {
      ustBaslik: 'Демо-звонок',
      baslik: 'Посмотрите Notya',
      baslikVurgu: 'в живом звонке',
      govde: 'Доктор Гёкхан Мамур покажет настоящий приём на видеозвонке — 60 минут, в удобное для вас время.',
      kartEtiketi: 'На звонке',
      satirlar: [
        { k: 'Живой показ', v: 'Настоящий приём от начала до конца' },
        { k: '60 минут', v: 'Время показано в вашем часовом поясе' },
        { k: 'Ваши вопросы', v: 'Для них отведено время' },
      ],
    },
  },
}
