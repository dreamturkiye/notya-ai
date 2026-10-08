/**
 * NOTYA-ULKE-01 — Uzbekistan landing page: the copy, in Uzbek (Latin script, the source) and Russian.
 *
 * NEW content written for Uzbekistan. Nothing here is imported or translated from the Turkish landing pages; the
 * structure (hero, numbered capability sections, a typographic card per section, price, footer) follows them.
 * This is the CONVENTIONAL version of docs/uz-landing/COPY.md; the bolder version is kept there for Kaan to choose.
 *
 * MACHINE-WRITTEN. A native speaker must read every line before the page goes public (checklist E11, K1).
 *
 * Standing rules for this page (checked by countries/uz/acilis/acilis.test.ts):
 *   - no price, no public demo, no claim of a connection to any state system;
 *   - nothing of Türkiye: its state and payer systems, its law, its currency, its references;
 *   - the assistant has no name yet: she is referred to generically;
 *   - no mention of the voice profile or of image evaluation (both are off in Uzbekistan).
 * Uzbek Latin uses U+02BB (ʻ) in oʻ / gʻ and U+02BC (ʼ) for the tutuq belgisi.
 */
import type { DilKodu } from '@/lib/ulke/tipler'

export type AcilisBolumu = {
  /** Anchor id and nav target. */
  id: string
  no: string
  navEtiketi: string
  ustBaslik: string
  baslik: string
  /** Second line of the heading, set in italic pine. */
  baslikVurgu: string
  govde: string
  maddeler: readonly string[]
  kart: { etiket: string; satirlar: readonly { ad: string; aciklama?: string }[]; not?: string }
}

export type AcilisIcerigi = {
  meta: { baslik: string; aciklama: string }
  nav: { giris: string; fiyat: string; bolumler: string; dil: string }
  kahraman: {
    ustBaslik: string
    baslik: string
    baslikVurgu: string
    giris: string
    serit: readonly string[]
    kart: { etiket: string; satirlar: readonly string[]; durum: string }
  }
  bolumler: readonly AcilisBolumu[]
  guvence: string
  fiyat: {
    no: string
    navEtiketi: string
    ustBaslik: string
    baslik: string
    baslikVurgu: string
    govde: string
    form: {
      etiket: string
      adSoyad: string
      kurum: string
      telefon: string
      telefonOrnek: string
      uzmanlik: string
      mesaj: string
      gonder: string
      ipucu: string
      eksik: string
      konu: string
      /** Labels of the lines in the message that the visitor's mail app opens with. */
      satir: { adSoyad: string; kurum: string; telefon: string; uzmanlik: string; mesaj: string }
    }
    /** Shown instead of the form when no contact address is configured for the deployment. */
    formYok: string
    davetSorusu: string
    davetBaglantisi: string
  }
  altBilgi: { tanim: string; giris: string; kayit: string; haklar: string }
}

const UZ_LATN: AcilisIcerigi = {
  meta: {
    baslik: 'Notya — shifokorlar va klinikalar uchun klinik yordamchi',
    aciklama: 'Qabul yozib olinadi, tibbiy yozuv oʻzbek yoki rus tilida tayyorlanadi. Qabul jadvali, bemor sahifasi va hamkasb maslahati bir joyda.',
  },
  nav: { giris: 'Kirish', fiyat: 'Narxni soʻrash', bolumler: 'Boʻlimlar', dil: 'Til' },
  kahraman: {
    ustBaslik: 'Xususiy shifokorlar va klinikalar uchun',
    baslik: 'Siz bemor bilan gaplashasiz,',
    baslikVurgu: 'yozuvni Notya yozadi.',
    giris:
      'Notya qabulni tinglaydi va tibbiy yozuvni siz tanlagan tilda — oʻzbek yoki rus tilida — tayyorlaydi. Yozuv faqat sizning tasdigʻingizdan keyin yakunlanadi.',
    serit: ['Oʻzbek va rus tillarida', 'Qabul jadvali', 'Bemor sahifasi', 'Har bir qadam shifokor tasdigʻi bilan'],
    kart: { etiket: 'Qabul yozuvi', satirlar: ['Shikoyat', 'Koʻrik', 'Xulosa', 'Reja'], durum: 'Shifokor tasdigʻini kutmoqda' },
  },
  bolumler: [
    {
      id: 'qabul',
      no: '01',
      navEtiketi: 'Qabul',
      ustBaslik: '01 — Qabul va yozuv',
      baslik: 'Qabul yozib olinadi,',
      baslikVurgu: 'yozuv oʻzi tayyorlanadi.',
      govde:
        'Qabul paytida kompyuterga qarab oʻtirmaysiz. Suhbat tugagach, tartibli tibbiy yozuv oldingizda turadi. Oʻqiysiz, tuzatasiz, tasdiqlaysiz.',
      maddeler: [
        'Yozuv tili — oʻzbek yoki rus, tanlov sizda',
        'Tuzatish va tasdiqlash bitta sahifada',
        'Oldingi qabullar bemor kartasida saqlanadi',
      ],
      kart: {
        etiket: 'Yozuv tili',
        satirlar: [{ ad: 'Oʻzbekcha' }, { ad: 'Ruscha' }],
        not: 'Tilni har bir shifokor oʻzi tanlaydi.',
      },
    },
    {
      id: 'jadval',
      no: '02',
      navEtiketi: 'Jadval',
      ustBaslik: '02 — Qabul jadvali',
      baslik: 'Qabullar jadvali',
      baslikVurgu: 'va keyingi koʻriklar bir joyda.',
      govde:
        'Kun tartibi, yozilgan bemorlar va keyingi koʻrik sanalari bitta jadvalda. Kimga eslatma kerakligini jadvalning oʻzi koʻrsatadi.',
      maddeler: ['Keyingi koʻrik qabul tugamasdan belgilanadi', 'Registrator oʻz hisobi bilan ishlaydi'],
      kart: {
        etiket: 'Bugun',
        satirlar: [{ ad: 'Yozilgan bemorlar' }, { ad: 'Keyingi koʻriklar' }, { ad: 'Eslatma kutayotganlar' }],
      },
    },
    {
      id: 'bemor',
      no: '03',
      navEtiketi: 'Bemor sahifasi',
      ustBaslik: '03 — Bemor sahifasi',
      baslik: 'Har bir bemorga',
      baslikVurgu: 'oʻz sahifasi.',
      govde:
        'Bemor hech narsa oʻrnatmaydi: unga bitta havola beriladi, sahifa parol bilan ochiladi. Bemor koʻradigan har bir maʼlumot avval sizning tasdigʻingizdan oʻtadi.',
      maddeler: ['Ilova oʻrnatish shart emas', 'Sahifa parol bilan himoyalangan'],
      kart: {
        etiket: 'Bemor sahifasida',
        satirlar: [{ ad: 'Qabul xulosasi' }, { ad: 'Tavsiyalar' }, { ad: 'Keyingi koʻrik sanasi' }],
        not: 'Bitta havola, parol bilan ochiladi.',
      },
    },
    {
      id: 'maslahat',
      no: '04',
      navEtiketi: 'Maslahat',
      ustBaslik: '04 — Hamkasb maslahati',
      baslik: 'Hamkasb maslahati\u00A0—',
      baslikVurgu: 'telefon qidirmasdan.',
      govde:
        'Qabuldan chiqmay turib hamkasbingizga savol yuborasiz. U oʻziga kelgan havola orqali javob yozadi, javob bemor kartasiga tushadi.',
      maddeler: ['Maslahatchi shifokorga alohida hisob kerak emas', 'Javobi kutilayotgan soʻrovlar bitta roʻyxatda'],
      kart: {
        etiket: 'Maslahat soʻrovi',
        satirlar: [{ ad: 'Savol yuborildi' }, { ad: 'Hamkasb javob yozdi' }, { ad: 'Javob bemor kartasida' }],
      },
    },
    {
      id: 'yordamchi',
      no: '05',
      navEtiketi: 'Yordamchi',
      ustBaslik: '05 — Yordamchi',
      baslik: 'Yoningizda',
      baslikVurgu: 'tajribali hamkasb.',
      govde:
        'Notya ichidagi yordamchi bemor kartasini biladi: oldingi qabullarni eslatadi, yozuvdagi boʻshliqni koʻrsatadi, savolingizga karta asosida javob beradi. Qarorni har doim siz qabul qilasiz.',
      maddeler: ['Savolga bemor kartasi asosida javob', 'Tashxis va davolash qarori shifokorda qoladi'],
      kart: {
        etiket: 'Yordamchi nima qiladi',
        satirlar: [{ ad: 'Oldingi qabullarni eslatadi' }, { ad: 'Yozuvdagi boʻshliqni koʻrsatadi' }, { ad: 'Karta boʻyicha savolga javob beradi' }],
      },
    },
    {
      id: 'klinika',
      no: '06',
      navEtiketi: 'Klinika',
      ustBaslik: '06 — Klinikalar uchun',
      baslik: 'Butun klinika',
      baslikVurgu: 'bitta tizimda.',
      govde:
        'Notya klinikangiz yoʻnalishiga qarab sozlanadi. Registrator oʻz hisobi bilan ishlaydi va faqat oʻziga kerakli narsani koʻradi; har bir bemor oʻz sahifasini oladi.',
      maddeler: ['Shifokor va registrator uchun alohida hisoblar', 'Jadval va bemor sahifasi butun klinika uchun'],
      kart: {
        etiket: 'Klinikada',
        satirlar: [{ ad: 'Shifokor', aciklama: 'Qabul, yozuv, maslahat' }, { ad: 'Registrator', aciklama: 'Jadval va bemorlar bilan aloqa' }, { ad: 'Bemor', aciklama: 'Oʻz sahifasi' }],
      },
    },
  ],
  guvence: 'Notya — yozuv va kuzatuv vositasi. Tashxis va davolash qarori shifokorga tegishli.',
  fiyat: {
    no: '07',
    navEtiketi: 'Narx',
    ustBaslik: '07 — Narx',
    baslik: 'Narx\u00A0—',
    baslikVurgu: 'soʻrov boʻyicha.',
    govde:
      'Notya hozircha taklif asosida, cheklangan shifokorlar guruhi bilan ishlamoqda. Maʼlumotlaringizni qoldiring — siz bilan bogʻlanamiz.',
    form: {
      etiket: 'Narx soʻrovi',
      adSoyad: 'Ism va familiya',
      kurum: 'Klinika yoki amaliyot',
      telefon: 'Telefon',
      telefonOrnek: '+998 90 123 45 67',
      uzmanlik: 'Yoʻnalish',
      mesaj: 'Xabar (ixtiyoriy)',
      gonder: 'Soʻrov yuborish',
      ipucu: 'Soʻrov qurilmangizdagi pochta ilovasi orqali yuboriladi.',
      eksik: 'Ism va telefon raqamini yozing.',
      konu: 'Notya: narx soʻrovi',
      satir: { adSoyad: 'Ism va familiya', kurum: 'Klinika yoki amaliyot', telefon: 'Telefon', uzmanlik: 'Yoʻnalish', mesaj: 'Xabar' },
    },
    formYok: 'Soʻrovlar qabuli tez orada ochiladi.',
    davetSorusu: 'Taklif kodingiz bormi?',
    davetBaglantisi: 'Roʻyxatdan oʻtish',
  },
  altBilgi: {
    tanim: 'Xususiy shifokorlar va klinikalar uchun klinik yordamchi.',
    giris: 'Kirish',
    kayit: 'Taklif kodi bilan roʻyxatdan oʻtish',
    haklar: 'Notya',
  },
}

const RU: AcilisIcerigi = {
  meta: {
    baslik: 'Notya — клинический помощник для врачей и клиник',
    aciklama: 'Приём записывается, медицинская запись готовится на узбекском или русском языке. Расписание, страница пациента и консультация коллеги — в одном месте.',
  },
  nav: { giris: 'Войти', fiyat: 'Запросить цену', bolumler: 'Разделы', dil: 'Язык' },
  kahraman: {
    ustBaslik: 'Для частных врачей и клиник',
    baslik: 'Вы говорите с пациентом,',
    baslikVurgu: 'запись ведёт Notya.',
    giris:
      'Notya слушает приём и готовит медицинскую запись на выбранном вами языке — узбекском или русском. Запись становится окончательной только после вашего подтверждения.',
    serit: ['На узбекском и русском', 'Расписание приёмов', 'Страница пациента', 'Каждый шаг — с подтверждением врача'],
    kart: { etiket: 'Запись приёма', satirlar: ['Жалобы', 'Осмотр', 'Заключение', 'План'], durum: 'Ожидает подтверждения врача' },
  },
  bolumler: [
    {
      id: 'qabul',
      no: '01',
      navEtiketi: 'Приём',
      ustBaslik: '01 — Приём и запись',
      baslik: 'Приём записывается,',
      baslikVurgu: 'запись готовится сама.',
      govde:
        'Во время приёма вы не сидите за компьютером. Когда разговор окончен, перед вами упорядоченная медицинская запись. Вы читаете, исправляете, подтверждаете.',
      maddeler: [
        'Язык записи — узбекский или русский, выбор за вами',
        'Исправление и подтверждение — на одной странице',
        'Прошлые приёмы хранятся в карте пациента',
      ],
      kart: {
        etiket: 'Язык записи',
        satirlar: [{ ad: 'Узбекский' }, { ad: 'Русский' }],
        not: 'Язык каждый врач выбирает сам.',
      },
    },
    {
      id: 'jadval',
      no: '02',
      navEtiketi: 'Расписание',
      ustBaslik: '02 — Расписание приёмов',
      baslik: 'Расписание приёмов',
      baslikVurgu: 'и повторные осмотры в одном месте.',
      govde:
        'План дня, записанные пациенты и даты повторных осмотров — в одном расписании. Кому нужно напомнить, показывает само расписание.',
      maddeler: ['Повторный осмотр назначается до конца приёма', 'Регистратор работает под своей учётной записью'],
      kart: {
        etiket: 'Сегодня',
        satirlar: [{ ad: 'Записанные пациенты' }, { ad: 'Повторные осмотры' }, { ad: 'Ждут напоминания' }],
      },
    },
    {
      id: 'bemor',
      no: '03',
      navEtiketi: 'Страница пациента',
      ustBaslik: '03 — Страница пациента',
      baslik: 'Каждому пациенту\u00A0—',
      baslikVurgu: 'своя страница.',
      govde:
        'Пациент ничего не устанавливает: он получает одну ссылку, страница открывается по паролю. Всё, что видит пациент, сначала подтверждаете вы.',
      maddeler: ['Устанавливать приложение не нужно', 'Страница защищена паролем'],
      kart: {
        etiket: 'На странице пациента',
        satirlar: [{ ad: 'Заключение приёма' }, { ad: 'Рекомендации' }, { ad: 'Дата следующего осмотра' }],
        not: 'Одна ссылка, открывается по паролю.',
      },
    },
    {
      id: 'maslahat',
      no: '04',
      navEtiketi: 'Консультация',
      ustBaslik: '04 — Консультация коллеги',
      baslik: 'Совет коллеги\u00A0—',
      baslikVurgu: 'без поиска телефона.',
      govde:
        'Не выходя из приёма, вы отправляете вопрос коллеге. Он отвечает по полученной ссылке, и ответ попадает в карту пациента.',
      maddeler: ['Консультанту не нужна отдельная учётная запись', 'Запросы, ожидающие ответа, — в одном списке'],
      kart: {
        etiket: 'Запрос на консультацию',
        satirlar: [{ ad: 'Вопрос отправлен' }, { ad: 'Коллега ответил' }, { ad: 'Ответ в карте пациента' }],
      },
    },
    {
      id: 'yordamchi',
      no: '05',
      navEtiketi: 'Помощник',
      ustBaslik: '05 — Помощник',
      baslik: 'Рядом\u00A0—',
      baslikVurgu: 'опытный коллега.',
      govde:
        'Помощник в Notya знает карту пациента: напоминает о прошлых приёмах, показывает пробел в записи, отвечает на ваш вопрос по карте. Решение всегда принимаете вы.',
      maddeler: ['Ответ на вопрос — по карте пациента', 'Решение о диагнозе и лечении остаётся за врачом'],
      kart: {
        etiket: 'Что делает помощник',
        satirlar: [{ ad: 'Напоминает о прошлых приёмах' }, { ad: 'Показывает пробел в записи' }, { ad: 'Отвечает на вопрос по карте' }],
      },
    },
    {
      id: 'klinika',
      no: '06',
      navEtiketi: 'Клиника',
      ustBaslik: '06 — Для клиник',
      baslik: 'Вся клиника\u00A0—',
      baslikVurgu: 'в одной системе.',
      govde:
        'Notya настраивается под направление вашей клиники. Регистратор работает под своей учётной записью и видит только то, что ему нужно; каждый пациент получает свою страницу.',
      maddeler: ['Отдельные учётные записи для врача и регистратора', 'Расписание и страница пациента — для всей клиники'],
      kart: {
        etiket: 'В клинике',
        satirlar: [{ ad: 'Врач', aciklama: 'Приём, запись, консультация' }, { ad: 'Регистратор', aciklama: 'Расписание и связь с пациентами' }, { ad: 'Пациент', aciklama: 'Своя страница' }],
      },
    },
  ],
  guvence: 'Notya — инструмент для записей и наблюдения. Решение о диагнозе и лечении принимает врач.',
  fiyat: {
    no: '07',
    navEtiketi: 'Цена',
    ustBaslik: '07 — Цена',
    baslik: 'Цена\u00A0—',
    baslikVurgu: 'по запросу.',
    govde:
      'Notya пока работает по приглашениям, с ограниченной группой врачей. Оставьте контакты — мы свяжемся с вами.',
    form: {
      etiket: 'Запрос цены',
      adSoyad: 'Имя и фамилия',
      kurum: 'Клиника или практика',
      telefon: 'Телефон',
      telefonOrnek: '+998 90 123 45 67',
      uzmanlik: 'Специальность',
      mesaj: 'Сообщение (необязательно)',
      gonder: 'Отправить запрос',
      ipucu: 'Запрос отправляется через почтовую программу на вашем устройстве.',
      eksik: 'Укажите имя и номер телефона.',
      konu: 'Notya: запрос цены',
      satir: { adSoyad: 'Имя и фамилия', kurum: 'Клиника или практика', telefon: 'Телефон', uzmanlik: 'Специальность', mesaj: 'Сообщение' },
    },
    formYok: 'Приём запросов скоро откроется.',
    davetSorusu: 'Есть код приглашения?',
    davetBaglantisi: 'Регистрация',
  },
  altBilgi: {
    tanim: 'Клинический помощник для частных врачей и клиник.',
    giris: 'Войти',
    kayit: 'Регистрация по коду приглашения',
    haklar: 'Notya',
  },
}

/** One entry per language the page ships in. A switched-on language of the pack without an entry here fails the type check. */
export const ACILIS_ICERIGI: Record<'uz-Latn' | 'ru', AcilisIcerigi> = { 'uz-Latn': UZ_LATN, ru: RU }

export function acilisIcerigi(dil: DilKodu): AcilisIcerigi {
  const icerik = (ACILIS_ICERIGI as Partial<Record<DilKodu, AcilisIcerigi>>)[dil]
  if (!icerik) throw new Error(`[uz/acilis] no landing copy for "${dil}". No fallback to another language.`)
  return icerik
}
