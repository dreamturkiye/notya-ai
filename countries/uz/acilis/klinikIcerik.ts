/**
 * NOTYA-ULKE-KLINIK-ACILIS — Uzbekistan: the clinic landing's copy, in the three forms of the doctor page.
 *
 * MACHINE-WRITTEN. A native speaker of Uzbek and of Russian must read every line before the page is shown
 * outside the team. The section inventory is the Turkish clinic page's (hero, patient page, disciplines,
 * trust line, price, close). The claims are the ones the doctor page already makes for this pack: a protected
 * patient page, messages the doctor approves, no app, no trial, no named law. Discipline names are this pack's
 * clinic-side roles (../klinik/rolAdlari.ts), not a copied Turkish list.
 */
import type { KlinikAcilisIcerigi } from '@/lib/ulke/arayuz/acilisTipleri'
import { UZ_ROL_TANIMLARI } from '../klinik/rolAdlari'
import type { AcilisDili } from './icerik'
import { UZ_YASAL_CYRL, UZ_YASAL_LATN, UZ_YASAL_RU } from './yasalBaglantilar'

const C = { portal: 'klinikaportal', dallar: 'dallar', fiyat: 'klinikafiyat' } as const

function dallar(dil: AcilisDili): string[] {
  return UZ_ROL_TANIMLARI.filter((r) => r.taraf === 'klinik-hekim' || r.taraf === 'klinik-muttefik').map((r) => r.ad[dil] ?? '')
}

const LATN: KlinikAcilisIcerigi = {
  meta: {
    baslik: 'Notya Klinika — klinikangiz va bemoringiz bir sahifada',
    aciklama: 'Notya klinikangiz yoʻnalishiga qarab tuziladi va har bir bemoringizga ilova oʻrnatmasdan ochiladigan himoyalangan sahifa beradi.',
  },
  markaEk: 'klinika',
  nav: {
    bolumler: 'Boʻlimlar',
    mobil: 'Mobil menyu',
    dil: 'Til',
    havolalar: [
      { capa: C.portal, etiket: 'Bemor portali', no: '01' },
      { capa: C.dallar, etiket: 'Yoʻnalishlar', no: '02' },
      { capa: C.fiyat, etiket: 'Narx', no: '03' },
    ],
    giris: 'Kirish',
    girisUzun: 'Hisobga kirish',
    sorov: 'Narxni soʻrash',
    menyuAc: 'Menyuni ochish',
    menyuYop: 'Menyuni yopish',
  },
  kahraman: {
    ustBaslik: 'Klinikalar uchun',
    baslik: 'Klinikangiz va bemoringiz',
    baslikVurgu: 'bir sahifada.',
    giris: 'Notya klinikangiz yoʻnalishiga qarab tuziladi va har bir bemoringizga ilova oʻrnatmasdan ochiladigan himoyalangan sahifa beradi.',
    birinciDugme: 'Narxni soʻrash',
    ikinciDugme: 'Yoʻnalishingizni toping',
    gorselAlt: 'Kunduzgi yorugʻlikdagi klinik yoʻlagi: shifokor xonalari eshiklari va kutish oʻrindigʻi',
    gorselAlti: 'Klinika · tasviriy surat',
  },
  portal: {
    ustBaslik: '01 — Bemor portali',
    baslik: 'Bemoringizga alohida,',
    baslikVurgu: 'himoyalangan sahifa.',
    govde: 'Qabul xulosasi, natijalar, dorilar, kuzatuv rejasi va sizga yozilgan xabarlar bitta havolada. Ilova oʻrnatish shart emas.',
    maddeler: ['Mazmun yoʻnalishga qarab tartiblangan', 'Qabulga yozilish soʻrovi', 'Bemorga koʻrsatiladigan har bir maʼlumot shifokor tasdigʻidan oʻtadi'],
    kart: {
      etiket: 'Bemor sahifasi',
      satirlar: [{ k: 'Qabul xulosasi' }, { k: 'Natijalar' }, { k: 'Dorilar' }, { k: 'Kuzatuv rejasi' }, { k: 'Xabarlar' }],
      not: 'Bitta havola. Ilova kerak emas.',
    },
  },
  dallar: {
    ustBaslik: '02 — Yoʻnalishlar',
    baslik: 'Klinikangiz yoʻnalishiga qarab',
    baslikVurgu: 'tuziladi.',
    govde: 'Har bir hisob oʻz yoʻnalishining yozuvi, savollari va vositalari bilan ochiladi.',
    royxatEtiketi: 'Yoʻnalishlar',
    royxat: dallar('uz-Latn'),
  },
  guven: 'Notya yozuv va kuzatuv vositasidir; tashxis va davolash qarori shifokorga tegishli.',
  fiyat: { ustBaslik: '03 — Narx', baslik: 'Hisob boshiga.', baslikVurgu: 'Soʻrov boʻyicha.' },
  cta: {
    ustBaslik: 'Klinika',
    baslik: 'Narxni soʻrang.',
    baslikVurgu: 'Siz bilan bogʻlanamiz.',
    govde: 'Hozircha faqat taklif kodi bilan. Oʻzbek va rus tillarida.',
    ikinciDugme: 'Shifokor qabuli bormi? Notya shifokorlar uchun',
  },
  altBilgi: {
    tanim: 'Klinikalar uchun klinik yordamchi.',
    havolalar: 'Quyi havolalar',
    doktor: 'Notya shifokorlar uchun',
    giris: 'Kirish',
    haklar: 'Notya',
    diller: 'Til va yozuv',
    yasal: UZ_YASAL_LATN,
  },
}

const RU: KlinikAcilisIcerigi = {
  meta: {
    baslik: 'Notya Клиника — ваша клиника и пациент на одной странице',
    aciklama: 'Notya собирается под направление вашей клиники и даёт каждому пациенту защищённую страницу, которая открывается без установки приложения.',
  },
  markaEk: 'клиника',
  nav: {
    bolumler: 'Разделы',
    mobil: 'Мобильное меню',
    dil: 'Язык',
    havolalar: [
      { capa: C.portal, etiket: 'Портал', no: '01' },
      { capa: C.dallar, etiket: 'Направления', no: '02' },
      { capa: C.fiyat, etiket: 'Цена', no: '03' },
    ],
    giris: 'Войти',
    girisUzun: 'Войти в аккаунт',
    sorov: 'Запросить цену',
    menyuAc: 'Открыть меню',
    menyuYop: 'Закрыть меню',
  },
  kahraman: {
    ustBaslik: 'Для клиник',
    baslik: 'Ваша клиника и пациент',
    baslikVurgu: 'на одной странице.',
    giris: 'Notya собирается под направление вашей клиники и даёт каждому пациенту защищённую страницу, которая открывается без установки приложения.',
    birinciDugme: 'Запросить цену',
    ikinciDugme: 'Найти своё направление',
    gorselAlt: 'Коридор клиники при дневном свете: двери кабинетов и скамья для ожидания',
    gorselAlti: 'Клиника · иллюстрация',
  },
  portal: {
    ustBaslik: '01 — Портал пациента',
    baslik: 'Отдельная страница',
    baslikVurgu: 'для каждого пациента.',
    govde: 'Итог приёма, результаты, лекарства, план наблюдения и сообщения для вас — по одной ссылке. Устанавливать приложение не нужно.',
    maddeler: ['Содержание выстроено по специальности', 'Запрос на приём', 'Всё, что видит пациент, проходит подтверждение врача'],
    kart: {
      etiket: 'Страница пациента',
      satirlar: [{ k: 'Итог приёма' }, { k: 'Результаты' }, { k: 'Лекарства' }, { k: 'План наблюдения' }, { k: 'Сообщения' }],
      not: 'Одна ссылка. Приложение не нужно.',
    },
  },
  dallar: {
    ustBaslik: '02 — Направления',
    baslik: 'Собирается под',
    baslikVurgu: 'направление клиники.',
    govde: 'Каждый аккаунт открывается с записью, вопросами и инструментами своего направления.',
    royxatEtiketi: 'Направления',
    royxat: dallar('ru'),
  },
  guven: 'Notya — средство записи и наблюдения; решение о диагнозе и лечении остаётся за врачом.',
  fiyat: { ustBaslik: '03 — Цена', baslik: 'На аккаунт.', baslikVurgu: 'По запросу.' },
  cta: {
    ustBaslik: 'Клиника',
    baslik: 'Запросите цену.',
    baslikVurgu: 'Мы свяжемся с вами.',
    govde: 'Пока только по коду приглашения. На узбекском и русском.',
    ikinciDugme: 'Приём одного врача? Notya для врачей',
  },
  altBilgi: {
    tanim: 'Клинический помощник для клиник.',
    havolalar: 'Нижние ссылки',
    doktor: 'Notya для врачей',
    giris: 'Войти',
    haklar: 'Notya',
    diller: 'Язык и письмо',
    yasal: UZ_YASAL_RU,
  },
}

const CYRL: KlinikAcilisIcerigi = {
  meta: {
    baslik: 'Notya Клиника — клиникангиз ва беморингиз бир саҳифада',
    aciklama: 'Notya клиникангиз йўналишига қараб тузилади ва ҳар бир беморингизга илова ўрнатмасдан очиладиган ҳимояланган саҳифа беради.',
  },
  markaEk: 'клиника',
  nav: {
    bolumler: 'Бўлимлар',
    mobil: 'Мобил меню',
    dil: 'Тил',
    havolalar: [
      { capa: C.portal, etiket: 'Бемор портали', no: '01' },
      { capa: C.dallar, etiket: 'Йўналишлар', no: '02' },
      { capa: C.fiyat, etiket: 'Нарх', no: '03' },
    ],
    giris: 'Кириш',
    girisUzun: 'Ҳисобга кириш',
    sorov: 'Нархни сўраш',
    menyuAc: 'Менюни очиш',
    menyuYop: 'Менюни ёпиш',
  },
  kahraman: {
    ustBaslik: 'Клиникалар учун',
    baslik: 'Клиникангиз ва беморингиз',
    baslikVurgu: 'бир саҳифада.',
    giris: 'Notya клиникангиз йўналишига қараб тузилади ва ҳар бир беморингизга илова ўрнатмасдан очиладиган ҳимояланган саҳифа беради.',
    birinciDugme: 'Нархни сўраш',
    ikinciDugme: 'Йўналишингизни топинг',
    gorselAlt: 'Кундузги ёруғликдаги клиник йўлаги: шифокор хоналари эшиклари ва кутиш ўриндиғи',
    gorselAlti: 'Клиника · тасвирий сурат',
  },
  portal: {
    ustBaslik: '01 — Бемор портали',
    baslik: 'Беморингизга алоҳида,',
    baslikVurgu: 'ҳимояланган саҳифа.',
    govde: 'Қабул хулосаси, натижалар, дорилар, кузатув режаси ва сизга ёзилган хабарлар битта ҳаволада. Илова ўрнатиш шарт эмас.',
    maddeler: ['Мазмун йўналишга қараб тартибланган', 'Қабулга ёзилиш сўрови', 'Беморга кўрсатиладиган ҳар бир маълумот шифокор тасдиғидан ўтади'],
    kart: {
      etiket: 'Бемор саҳифаси',
      satirlar: [{ k: 'Қабул хулосаси' }, { k: 'Натижалар' }, { k: 'Дорилар' }, { k: 'Кузатув режаси' }, { k: 'Хабарлар' }],
      not: 'Битта ҳавола. Илова керак эмас.',
    },
  },
  dallar: {
    ustBaslik: '02 — Йўналишлар',
    baslik: 'Клиникангиз йўналишига қараб',
    baslikVurgu: 'тузилади.',
    govde: 'Ҳар бир ҳисоб ўз йўналишининг ёзуви, саволлари ва воситалари билан очилади.',
    royxatEtiketi: 'Йўналишлар',
    royxat: dallar('uz-Cyrl'),
  },
  guven: 'Notya ёзув ва кузатув воситасидир; ташхис ва даволаш қарори шифокорга тегишли.',
  fiyat: { ustBaslik: '03 — Нарх', baslik: 'Ҳисоб бошига.', baslikVurgu: 'Сўров бўйича.' },
  cta: {
    ustBaslik: 'Клиника',
    baslik: 'Нархни сўранг.',
    baslikVurgu: 'Сиз билан боғланамиз.',
    govde: 'Ҳозирча фақат таклиф коди билан. Ўзбек ва рус тилларида.',
    ikinciDugme: 'Шифокор қабули борми? Notya шифокорлар учун',
  },
  altBilgi: {
    tanim: 'Клиникалар учун клиник ёрдамчи.',
    havolalar: 'Қуйи ҳаволалар',
    doktor: 'Notya шифокорлар учун',
    giris: 'Кириш',
    haklar: 'Notya',
    diller: 'Тил ва ёзув',
    yasal: UZ_YASAL_CYRL,
  },
}

export const UZ_KLINIK: Record<AcilisDili, KlinikAcilisIcerigi> = { 'uz-Latn': LATN, 'uz-Cyrl': CYRL, ru: RU }
