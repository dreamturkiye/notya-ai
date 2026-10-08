/**
 * NOTYA-UZ-ACILIS-02 — Uzbekistan landing page: the message catalogue, in three forms — Uzbek in Latin script (the
 * source and the default), Uzbek in Cyrillic script, Russian.
 *
 * MACHINE-WRITTEN, ALL THREE FORMS. Nobody who speaks Uzbek or Russian natively has read a line of this. A native
 * speaker must read every line, and a clinician must read the fictional visit examples (drug, dose, wording), before
 * the page is shown to anyone outside the team (checklist E11, K1; docs/OPEN-COMMITMENTS.md).
 *
 * The page mirrors the Turkish doctor landing page section for section (Kaan, 2026-10-08: "a landing page just like
 * this for Uzbek"). The LAYOUT is mirrored; the TEXT is written here for Uzbekistan. Nothing is imported from the
 * Turkish landing content, and no sentence here is taken over unread: each section is Keep (same meaning), Adapt
 * (made true for Uzbekistan) or Drop — the table is in docs/uz-landing/COPY.md.
 *
 * Standing rules for this page (checked by ./acilis.test.ts):
 *   - nothing of Türkiye: its state and payer systems, its law, its ministries, associations and reference books,
 *     its currency;
 *   - no claim of a connection to any state system; no named Uzbek law (none has been confirmed by a lawyer);
 *   - the assistant has no name in Uzbekistan yet: it is "the assistant", a senior colleague, never a person;
 *   - no amount of money, no free trial; sign-up is by invitation code;
 *   - no public demo; no mention of the voice profile or of image evaluation;
 *   - the number of specialties is what the product is DESIGNED for, not what is switched on.
 * Uzbek Latin uses U+02BB (ʻ) in oʻ / gʻ and U+02BC (ʼ) for the tutuq belgisi.
 */
import type { DilKodu } from '@/lib/ulke/tipler'

/** The forms the landing page is written in. Wider than the pack's public `acikDiller`: Cyrillic is here too. */
export const ACILIS_DILLERI = ['uz-Latn', 'uz-Cyrl', 'ru'] as const
export type AcilisDili = (typeof ACILIS_DILLERI)[number]

/** Anchors of the page. Language-neutral on purpose: an address keeps working when the visitor switches language. */
export const CAPA = {
  ust: 'top', suhbat: 'suhbat', qabul: 'qabul', portal: 'portal', maslahat: 'maslahat', jadval: 'jadval',
  yonalish: 'yonalish', kuzatuv: 'kuzatuv', organish: 'organish', xavfsizlik: 'xavfsizlik', narx: 'narx', sorov: 'sorov',
} as const

export type KartSatiri = { k: string; v?: string; mark?: string }

/** One capability section set in the shared pattern: eyebrow, two-line heading, lede, bullets, typographic card. */
export type OzellikBolumu = {
  ustBaslik: string
  baslik: string
  baslikVurgu: string
  govde: string
  maddeler?: readonly string[]
  kart: { etiket: string; satirlar: readonly KartSatiri[]; not?: string }
}

export type SahneNavbati = { kim: string; rol: 'shifokor' | 'yordamchi' | 'ogohlantirish'; matn: string }
export type Sahne = { id: string; meta: string; yordamchi: string; alan: string; saat: string; navbatlar: readonly SahneNavbati[] }

export type AcilisIcerigi = {
  meta: { baslik: string; aciklama: string }
  nav: {
    bolumler: string
    mobil: string
    dil: string
    havolalar: readonly { capa: string; etiket: string; no: string }[]
    giris: string
    girisUzun: string
    sorov: string
    menyuAc: string
    menyuYop: string
  }
  kahraman: {
    ustBaslik: string
    baslik: string
    baslikVurgu: string
    giris: string
    birinciDugme: string
    ikinciDugme: string
    gorselAlt: string
    gorselAlti: string
    serit: readonly string[]
  }
  suhbat: {
    ustBaslik: string
    baslik: string
    baslikVurgu: string
    govde: string
    maddeler: readonly string[]
    sekmeler: string
    yozmoqda: string
    tayyor: string
    izoh: string
    sahneler: readonly Sahne[]
  }
  qabul: OzellikBolumu
  portal: OzellikBolumu
  maslahat: OzellikBolumu
  jadval: OzellikBolumu
  yonalish: {
    ustBaslik: string
    baslik: string
    baslikVurgu: string
    govde: string
    misollar: readonly { k: string; v: string }[]
    royxatEtiketi: string
    royxat: readonly string[]
  }
  kuzatuv: OzellikBolumu
  organish: {
    ustBaslik: string
    baslik: string
    baslikVurgu: string
    govde: string
    gorselAlt: string
    gorselAlti: string
    sekmeler: string
    birinchi: { etiket: string; sorov: string; javob: string }
    oninchi: { etiket: string; sorov: string; javob: string }
    izoh: string
  }
  xavfsizlik: {
    ustBaslik: string
    baslik: string
    baslikVurgu: string
    iqtibos: string
    izoh: string
    gorselAlt: string
    gorselAlti: string
    dalillar: readonly { k: string; v: string }[]
  }
  narx: {
    ustBaslik: string
    baslik: string
    baslikVurgu: string
    rejalar: readonly { ad: string; narx: string; maddeler: readonly string[] }[]
    dugme: string
    izoh: string
  }
  sorov: {
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
  altBilgi: { tanim: string; havolalar: string; giris: string; kayit: string; haklar: string; diller: string }
}

// ───────────────────────── Uzbek, Latin script (source) ─────────────────────────

const UZ_LATN: AcilisIcerigi = {
  meta: {
    baslik: 'Notya — shifokorlar uchun sunʼiy intellektli klinik yordamchi',
    aciklama:
      'Qabulni tinglaydi, tibbiy yozuvni oʻzbek yoki rus tilida yozadi, retsept va xulosa qoralamasini tayyorlaydi, bemorni kuzatuvda tutadi. Har bir qaror shifokor tasdigʻi bilan.',
  },
  nav: {
    bolumler: 'Boʻlimlar',
    mobil: 'Mobil menyu',
    dil: 'Til',
    havolalar: [
      { capa: CAPA.suhbat, etiket: 'Yordamchi', no: '01' },
      { capa: CAPA.portal, etiket: 'Portal', no: '03' },
      { capa: CAPA.yonalish, etiket: 'Yoʻnalishlar', no: '06' },
      { capa: CAPA.xavfsizlik, etiket: 'Xavfsizlik', no: '09' },
      { capa: CAPA.narx, etiket: 'Narx', no: '10' },
    ],
    giris: 'Kirish',
    girisUzun: 'Hisobga kirish',
    sorov: 'Narxni soʻrash',
    menyuAc: 'Menyuni ochish',
    menyuYop: 'Menyuni yopish',
  },
  kahraman: {
    ustBaslik: 'Shifokorlar uchun sunʼiy intellektli klinik yordamchi',
    baslik: 'Bemor xonadan chiqqanda',
    baslikVurgu: 'ishingiz bitgan boʻlsin.',
    giris:
      'Notya yordamchisi tajribali hamkasb kabi qabulni tinglaydi, tibbiy yozuvni yozadi, retsept va xulosa qoralamasini tayyorlaydi, bemorni kuzatuvda tutadi. Har bir qaror faqat sizning tasdigʻingiz bilan kuchga kiradi.',
    birinciDugme: 'Narxni soʻrash',
    ikinciDugme: 'Qabulni koʻring',
    gorselAlt: 'Kunduzgi yorugʻlikdagi xususiy shifokor xonasi: koʻrik kushetkasi, stetoskop, tonometr va diplomlar',
    gorselAlti: 'Shifokor xonasi · tasviriy surat',
    serit: [
      '30 yoʻnalish uchun moʻljallangan',
      'Ovozli, oʻzbek va rus tillarida',
      'Bemor portali bilan birga',
      'Har bir qadam shifokor tasdigʻi bilan',
    ],
  },
  suhbat: {
    ustBaslik: '01 — Suhbat',
    baslik: 'Ikki hamkasb',
    baslikVurgu: 'kabi gaplashing.',
    govde:
      'Bir marta bosing — yordamchi tinglay boshlaydi. Gapini boʻlsangiz, jim boʻladi. Tugma bosib turish shart emas.',
    maddeler: ['Suhbat oʻzbek yoki rus tilida matnga aylanadi', 'Tibbiy yozuv qabul tugashi bilan tayyor'],
    sekmeler: 'Qabul namunalari',
    yozmoqda: 'yozmoqda',
    tayyor: 'tayyor',
    izoh: 'Bu qabullar toʻqima namunalardir. Haqiqiy klinikada har bir jumla shifokor tasdigʻiga bogʻliq.',
    sahneler: [
      {
        id: 'pedia',
        meta: '1-qabul',
        yordamchi: 'Notya yordamchisi',
        alan: 'Pediatriya',
        saat: '09:14',
        navbatlar: [
          { kim: 'Shifokor', rol: 'shifokor', matn: '7 yosh, 18 kilogramm. Isitma va quloq ogʻrigʻi.' },
          {
            kim: 'Yordamchi',
            rol: 'yordamchi',
            matn: 'Oʻtkir oʻrta otitga mos keladi. Amoksitsillin 40 mg/kg/kun — bu vaznda kuniga 720 mg. Yoki amoksitsillin-klavulanatni afzal koʻrasizmi?',
          },
        ],
      },
      {
        id: 'safety',
        meta: 'Xavfsizlik toʻri',
        yordamchi: 'Notya yordamchisi',
        alan: 'Pediatriya',
        saat: '18:47',
        navbatlar: [
          { kim: 'Shifokor', rol: 'shifokor', matn: 'Amoksitsillin 500 mg yozing, kuniga uch mahal.' },
          {
            kim: 'Ogohlantirish',
            rol: 'ogohlantirish',
            matn: 'Doktor, bir daqiqa — bu kattalar dozasi. Bu vaznda bir martalik doza 250 mg dan oshmasligi kerak. Tuzataymi?',
          },
        ],
      },
      {
        id: 'memory',
        meta: '10-qabul',
        yordamchi: 'Notya yordamchisi',
        alan: 'Pediatriya',
        saat: '11:03',
        navbatlar: [
          { kim: 'Shifokor', rol: 'shifokor', matn: 'Amoksitsillin yozing.' },
          {
            kim: 'Yordamchi',
            rol: 'yordamchi',
            matn: '40 mg/kg/kun, bu vaznda kuniga 720 mg. Siz odatda amoksitsillin-klavulanatni tanlaysiz — shuni yozaymi, doktor?',
          },
        ],
      },
    ],
  },
  qabul: {
    ustBaslik: '02 — Qabul yakuni',
    baslik: 'Qabul bitta oqimda',
    baslikVurgu: 'yopiladi.',
    govde: 'Qabul yakunidagi qadamlar tartib bilan oldingizda turadi. Keraksiz qadamni oʻtkazib yuborasiz.',
    maddeler: [
      'Oʻz qabul shablonlaringiz bir bosishda',
      'Keyingi qabul bemor ketmasidan belgilanadi',
      'Bemor qabul xulosasini oʻz portalida koʻradi',
    ],
    kart: {
      etiket: 'Qabul yakuni',
      satirlar: [
        { k: 'Retsept qoralamasi', mark: '01' },
        { k: 'Tibbiy xulosa', mark: '02' },
        { k: 'Keyingi qabul', mark: '03' },
        { k: 'Bemor uchun xulosa', mark: '04' },
      ],
      not: 'Har bir qadam sizning tasdigʻingiz bilan yakunlanadi.',
    },
  },
  portal: {
    ustBaslik: '03 — Bemor portali',
    baslik: 'Bemoringiz qabulxonangizni',
    baslikVurgu: 'choʻntagida olib yuradi.',
    govde:
      'Har bir bemorga alohida, himoyalangan sahifa: qabul xulosasi, natijalar, dorilar, kuzatuv rejasi va sizga yozilgan xabarlar. Ilova oʻrnatish shart emas.',
    maddeler: [
      'Mazmun yoʻnalishga qarab tartiblangan',
      'Qabulga yozilish soʻrovi va eslatmalar',
      'Bemorga koʻrsatiladigan har bir maʼlumot shifokor tasdigʻidan oʻtadi',
    ],
    kart: {
      etiket: 'Bemor sahifasi',
      satirlar: [{ k: 'Qabul xulosasi' }, { k: 'Natijalar' }, { k: 'Dorilar' }, { k: 'Kuzatuv rejasi' }, { k: 'Xabarlar' }],
      not: 'Bitta havola. Ilova kerak emas.',
    },
  },
  maslahat: {
    ustBaslik: '04 — Hamkasb maslahati',
    baslik: 'Hamkasb maslahati,',
    baslikVurgu: 'telefon qoʻngʻiroqlarisiz.',
    govde:
      'Qabuldan chiqmay turib soʻrov oching; maslahatchi shifokor oʻziga kelgan himoyalangan havola orqali javob qoldiradi. Javob bemor kartasiga yoziladi.',
    maddeler: [
      'Ishonchli maslahatchilaringiz roʻyxati',
      'Javobi kutilayotgan soʻrovlar bitta roʻyxatda',
      'Maslahatchiga hisob ochish shart emas',
    ],
    kart: {
      etiket: 'Maslahat',
      satirlar: [
        { k: 'Soʻrov', v: 'Qabuldan chiqmay turib' },
        { k: 'Himoyalangan havola', v: 'Maslahatchi shifokorga' },
        { k: 'Javob', v: 'Bemor kartasida' },
      ],
    },
  },
  jadval: {
    ustBaslik: '05 — Qabul jadvali va aloqa',
    baslik: 'Registraturangiz ham',
    baslikVurgu: 'shu tizimda.',
    govde:
      'Qabul jadvali, eslatmalar va bemor xabarlari bir joyda. Registrator oʻz hisobi bilan faqat oʻziga kerakli narsani koʻradi.',
    maddeler: ['Kelgan hujjatlar bemor kartasiga biriktiriladi', 'Registrator hisobi alohida huquq bilan ishlaydi'],
    kart: {
      etiket: 'Registratura',
      satirlar: [
        { k: 'Qabul jadvali' },
        { k: 'Eslatmalar' },
        { k: 'Bemor xabarlari' },
        { k: 'Registrator', mark: 'Alohida huquq' },
      ],
    },
  },
  yonalish: {
    ustBaslik: '06 — Yoʻnalishingizga mos',
    baslik: 'Umumiy yordamchi emas.',
    baslikVurgu: 'Sizning yoʻnalishingiz.',
    govde:
      'Notya 30 yoʻnalish uchun moʻljallangan: har biriga oʻsha yoʻnalishning kundalik ishiga mos ish maydoni. Yoʻnalishlar bosqichma-bosqich ishga tushiriladi.',
    misollar: [
      { k: 'Pediatriya', v: 'Oʻsish, emlash va rivojlanish kuzatuvi bir qarashda.' },
      { k: 'Akusherlik va ginekologiya', v: 'Homiladorlik taqvimi va kuzatuv muddatlari oʻz-oʻzidan.' },
      { k: 'Oftalmologiya', v: 'Koʻrish kuzatuvi, qabuldan qabulga solishtirib.' },
    ],
    royxatEtiketi: 'Yoʻnalishlar',
    royxat: [
      'Pediatriya', 'Kardiologiya', 'Nevrologiya', 'Terapiya', 'Psixiatriya', 'Umumiy jarrohlik',
      'Travmatologiya va ortopediya', 'Dermatologiya', 'Otorinolaringologiya', 'Oftalmologiya',
      'Akusherlik va ginekologiya', 'Urologiya', 'Radiologiya', 'Anesteziologiya', 'Shoshilinch tibbiyot',
      'Fizioterapiya va reabilitatsiya', 'Yuqumli kasalliklar', 'Endokrinologiya', 'Gastroenterologiya', 'Nefrologiya',
      'Revmatologiya', 'Onkologiya', 'Pulmonologiya', 'Torakal jarrohlik', 'Plastik jarrohlik', 'Neyroxirurgiya',
      'Kardiojarrohlik', 'Bolalar jarrohligi', 'Oilaviy tibbiyot', 'Sport tibbiyoti',
    ],
  },
  kuzatuv: {
    ustBaslik: '07 — Kuzatuv',
    baslik: 'Hech bir bemor',
    baslikVurgu: 'kuzatuvdan tushib qolmaydi.',
    govde:
      'Qayta koʻrigi kechikkan va kuzatuvi oʻtkazib yuborilgan bemorlar oʻz-oʻzidan roʻyxatga tushadi. Bir bosishda eslatma yuborasiz.',
    kart: {
      etiket: 'Kuzatuv roʻyxati',
      satirlar: [
        { k: 'Qayta koʻrigi kechikkan', mark: 'Eslatish' },
        { k: 'Kuzatuvi oʻtkazib yuborilgan', mark: 'Eslatish' },
      ],
      not: 'Roʻyxat oʻz-oʻzidan yangilanadi.',
    },
  },
  organish: {
    ustBaslik: '08 — Oʻrganish',
    baslik: 'Oʻn qabuldan keyin',
    baslikVurgu: 'goʻyo yillar davomida birgasiz.',
    govde: 'Afzal koʻrganlaringizni eslab qoladi; bir gapni ikki marta ayttirmaydi. Oʻzini hamkasb kabi tutadi.',
    gorselAlt: 'Ertalabki yorugʻlikdagi shifokor stoli: qabul yozuvlari, choʻntak daftari, stetoskop va ruchka',
    gorselAlti: 'Qabul yozuvlari · tasviriy surat',
    sekmeler: 'Qabul namunasi',
    birinchi: {
      etiket: '1-qabul',
      sorov: 'Amoksitsillin yozing.',
      javob: 'Qaysi dozada yozay, doktor? Qaysi shaklini afzal koʻrasiz?',
    },
    oninchi: {
      etiket: '10-qabul',
      sorov: 'Amoksitsillin yozing.',
      javob: '40 mg/kg/kun, bu vaznda kuniga 720 mg. Siz odatda amoksitsillin-klavulanatni tanlaysiz — shuni yozaymi, doktor?',
    },
    izoh: 'Siz soʻramadingiz. U esladi.',
  },
  xavfsizlik: {
    ustBaslik: '09 — Xavfsizlik toʻri',
    baslik: 'Ellik bemor, ogʻir kun —',
    baslikVurgu: 'u hech qachon jim turmaydi.',
    iqtibos: '“Doktor, bir daqiqa — bu kattalar dozasi. Bu vaznda bir martalik doza 250 mg dan oshmasligi kerak. Tuzataymi?”',
    izoh: 'Notoʻgʻri doza, xavfli dori birikmasi. Soʻramasangiz ham aytadi. Toʻxtatadi. Toʻgʻrisini taklif qiladi.',
    gorselAlt: 'Kunduzgi yorugʻlikdagi xususiy klinika yoʻlagi: shifokor xonalari eshiklari va kutish oʻrindigʻi',
    gorselAlti: 'Klinika yoʻlagi · tasviriy surat',
    dalillar: [
      { k: 'Shifrlash', v: 'Bemorning shaxsiy maʼlumotlari shifrlangan holda saqlanadi.' },
      { k: 'Alohida kirish', v: 'Har bir shifokor faqat oʻz bemorlarini koʻradi.' },
      { k: 'Shifokor tasdigʻi', v: 'Yozuv, retsept va bemorga boradigan har bir maʼlumot sizning tasdigʻingizdan oʻtadi.' },
      { k: 'Qaror koʻmagi', v: 'Notya — qaror qabul qilishga koʻmak; tashxis va davolash qarori shifokorga tegishli.' },
    ],
  },
  narx: {
    ustBaslik: '10 — Narx',
    baslik: 'Narx —',
    baslikVurgu: 'soʻrov boʻyicha.',
    rejalar: [
      {
        ad: 'Shifokor',
        narx: 'Narx soʻrov boʻyicha',
        maddeler: ['Bitta shifokor', 'Ovozli yordamchi', 'Tibbiy yozuv va retsept qoralamasi', 'Yoʻnalishingizga mos ish maydoni', 'Bemor kartasi va arxiv'],
      },
      {
        ad: 'Xususiy amaliyot',
        narx: 'Narx soʻrov boʻyicha',
        maddeler: ['Shifokor rejasidagi hamma narsa', 'Bemor portali', 'Hamkasb maslahati', 'Qabul jadvali va eslatmalar', 'Kuzatuv roʻyxatlari', 'Registrator hisobi, alohida huquq bilan'],
      },
      {
        ad: 'Klinika',
        narx: 'Narx soʻrov boʻyicha',
        maddeler: ['Bir nechta shifokor', 'Shifokor va registrator huquqlari', 'Butun klinika uchun jadval va bemor portali', 'Oʻrnatishda yordam'],
      },
    ],
    dugme: 'Narxni soʻrash',
    izoh: 'Notya hozircha taklif asosida, cheklangan shifokorlar guruhi bilan ishlamoqda. Narx yoʻnalishingiz va foydalanuvchilar soniga qarab belgilanadi.',
  },
  sorov: {
    ustBaslik: 'Xususiy amaliyot',
    baslik: 'Narxni soʻrang.',
    baslikVurgu: 'Siz bilan bogʻlanamiz.',
    govde: 'Hozircha faqat taklif kodi bilan. Oʻzbek va rus tillarida. Qabulxonangizga yana bir hamkasb.',
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
    tanim: 'Shifokorlar uchun sunʼiy intellektli klinik yordamchi.',
    havolalar: 'Quyi havolalar',
    giris: 'Kirish',
    kayit: 'Taklif kodi bilan roʻyxatdan oʻtish',
    haklar: 'Notya',
    diller: 'Til va yozuv',
  },
}

// ───────────────────────── Russian ─────────────────────────

const RU: AcilisIcerigi = {
  meta: {
    baslik: 'Notya — клинический ИИ-помощник для врачей',
    aciklama:
      'Слушает приём, пишет медицинскую запись на узбекском или русском языке, готовит черновик рецепта и заключения, держит пациента под наблюдением. Каждое решение — с подтверждения врача.',
  },
  nav: {
    bolumler: 'Разделы',
    mobil: 'Мобильное меню',
    dil: 'Язык',
    havolalar: [
      { capa: CAPA.suhbat, etiket: 'Помощник', no: '01' },
      { capa: CAPA.portal, etiket: 'Портал', no: '03' },
      { capa: CAPA.yonalish, etiket: 'Специальности', no: '06' },
      { capa: CAPA.xavfsizlik, etiket: 'Безопасность', no: '09' },
      { capa: CAPA.narx, etiket: 'Цена', no: '10' },
    ],
    giris: 'Войти',
    girisUzun: 'Войти в аккаунт',
    sorov: 'Запросить цену',
    menyuAc: 'Открыть меню',
    menyuYop: 'Закрыть меню',
  },
  kahraman: {
    ustBaslik: 'Клинический ИИ-помощник для врачей',
    baslik: 'Пациент вышел из кабинета —',
    baslikVurgu: 'и ваша работа уже сделана.',
    giris:
      'Помощник Notya, как опытный коллега, слушает приём, пишет медицинскую запись, готовит черновик рецепта и заключения, держит пациента под наблюдением. Каждое решение вступает в силу только после вашего подтверждения.',
    birinciDugme: 'Запросить цену',
    ikinciDugme: 'Посмотреть приём',
    gorselAlt: 'Частный врачебный кабинет при дневном свете: кушетка для осмотра, стетоскоп, тонометр и дипломы',
    gorselAlti: 'Кабинет врача · иллюстрация',
    serit: [
      'Рассчитан на 30 специальностей',
      'Голосом, на узбекском и русском',
      'Вместе с порталом пациента',
      'Каждый шаг подтверждает врач',
    ],
  },
  suhbat: {
    ustBaslik: '01 — Разговор',
    baslik: 'Говорите,',
    baslikVurgu: 'как двое коллег.',
    govde:
      'Нажмите один раз — помощник начинает слушать. Перебьёте — он замолчит. Удерживать кнопку не нужно.',
    maddeler: ['Разговор на узбекском или русском превращается в текст', 'Медицинская запись готова, как только приём окончен'],
    sekmeler: 'Примеры приёмов',
    yozmoqda: 'пишет',
    tayyor: 'готово',
    izoh: 'Эти приёмы — вымышленные примеры. В настоящей клинике каждая фраза зависит от подтверждения врача.',
    sahneler: [
      {
        id: 'pedia',
        meta: 'Приём 1',
        yordamchi: 'Помощник Notya',
        alan: 'Педиатрия',
        saat: '09:14',
        navbatlar: [
          { kim: 'Врач', rol: 'shifokor', matn: '7 лет, 18 килограммов. Температура и боль в ухе.' },
          {
            kim: 'Помощник',
            rol: 'yordamchi',
            matn: 'Похоже на острый средний отит. Амоксициллин 40 мг/кг/сут — при этом весе 720 мг в сутки. Или вы предпочитаете амоксициллин-клавуланат?',
          },
        ],
      },
      {
        id: 'safety',
        meta: 'Страховочная сеть',
        yordamchi: 'Помощник Notya',
        alan: 'Педиатрия',
        saat: '18:47',
        navbatlar: [
          { kim: 'Врач', rol: 'shifokor', matn: 'Запишите амоксициллин 500 мг, три раза в день.' },
          {
            kim: 'Предупреждение',
            rol: 'ogohlantirish',
            matn: 'Доктор, одну минуту — это взрослая доза. При этом весе разовая доза не должна превышать 250 мг. Исправить?',
          },
        ],
      },
      {
        id: 'memory',
        meta: 'Приём 10',
        yordamchi: 'Помощник Notya',
        alan: 'Педиатрия',
        saat: '11:03',
        navbatlar: [
          { kim: 'Врач', rol: 'shifokor', matn: 'Запишите амоксициллин.' },
          {
            kim: 'Помощник',
            rol: 'yordamchi',
            matn: '40 мг/кг/сут, при этом весе 720 мг в сутки. Обычно вы выбираете амоксициллин-клавуланат — записать его, доктор?',
          },
        ],
      },
    ],
  },
  qabul: {
    ustBaslik: '02 — Завершение приёма',
    baslik: 'Приём закрывается',
    baslikVurgu: 'одним потоком.',
    govde: 'Шаги в конце приёма стоят перед вами по порядку. Ненужный шаг вы пропускаете.',
    maddeler: [
      'Ваши шаблоны приёма — одним нажатием',
      'Следующий приём назначается, пока пациент ещё в кабинете',
      'Пациент видит итог приёма в своём портале',
    ],
    kart: {
      etiket: 'Завершение приёма',
      satirlar: [
        { k: 'Черновик рецепта', mark: '01' },
        { k: 'Медицинское заключение', mark: '02' },
        { k: 'Следующий приём', mark: '03' },
        { k: 'Итог для пациента', mark: '04' },
      ],
      not: 'Каждый шаг завершается вашим подтверждением.',
    },
  },
  portal: {
    ustBaslik: '03 — Портал пациента',
    baslik: 'Пациент носит ваш кабинет',
    baslikVurgu: 'в кармане.',
    govde:
      'Отдельная защищённая страница для каждого пациента: итог приёма, результаты, лекарства, план наблюдения и сообщения для вас. Устанавливать приложение не нужно.',
    maddeler: [
      'Содержание выстроено по специальности',
      'Запрос на приём и напоминания',
      'Всё, что видит пациент, проходит подтверждение врача',
    ],
    kart: {
      etiket: 'Страница пациента',
      satirlar: [{ k: 'Итог приёма' }, { k: 'Результаты' }, { k: 'Лекарства' }, { k: 'План наблюдения' }, { k: 'Сообщения' }],
      not: 'Одна ссылка. Приложение не нужно.',
    },
  },
  maslahat: {
    ustBaslik: '04 — Консультация коллеги',
    baslik: 'Консультация коллеги,',
    baslikVurgu: 'без телефонных звонков.',
    govde:
      'Откройте запрос, не выходя с приёма; врач-консультант оставит ответ по защищённой ссылке, которая придёт ему. Ответ записывается в карту пациента.',
    maddeler: [
      'Список консультантов, которым вы доверяете',
      'Запросы, ожидающие ответа, — в одном списке',
      'Консультанту не нужно заводить аккаунт',
    ],
    kart: {
      etiket: 'Консультация',
      satirlar: [
        { k: 'Запрос', v: 'Не выходя с приёма' },
        { k: 'Защищённая ссылка', v: 'Врачу-консультанту' },
        { k: 'Ответ', v: 'В карте пациента' },
      ],
    },
  },
  jadval: {
    ustBaslik: '05 — Расписание и связь',
    baslik: 'Ваша регистратура —',
    baslikVurgu: 'в той же системе.',
    govde:
      'Расписание приёмов, напоминания и сообщения пациентов — в одном месте. Регистратор работает под своим аккаунтом и видит только то, что ему нужно.',
    maddeler: ['Входящие документы прикрепляются к карте пациента', 'Аккаунт регистратора работает с отдельными правами'],
    kart: {
      etiket: 'Регистратура',
      satirlar: [
        { k: 'Расписание приёмов' },
        { k: 'Напоминания' },
        { k: 'Сообщения пациентов' },
        { k: 'Регистратор', mark: 'Отдельные права' },
      ],
    },
  },
  yonalish: {
    ustBaslik: '06 — Под вашу специальность',
    baslik: 'Не общий помощник.',
    baslikVurgu: 'Ваша специальность.',
    govde:
      'Notya рассчитан на 30 специальностей: для каждой — рабочее пространство под её повседневную работу. Специальности подключаются поэтапно.',
    misollar: [
      { k: 'Педиатрия', v: 'Рост, вакцинация и развитие — с одного взгляда.' },
      { k: 'Акушерство и гинекология', v: 'Календарь беременности и сроки наблюдения — сами собой.' },
      { k: 'Офтальмология', v: 'Наблюдение за зрением — в сравнении от приёма к приёму.' },
    ],
    royxatEtiketi: 'Специальности',
    royxat: [
      'Педиатрия', 'Кардиология', 'Неврология', 'Терапия', 'Психиатрия', 'Общая хирургия',
      'Травматология и ортопедия', 'Дерматология', 'Оториноларингология', 'Офтальмология',
      'Акушерство и гинекология', 'Урология', 'Радиология', 'Анестезиология', 'Неотложная медицина',
      'Физиотерапия и реабилитация', 'Инфекционные болезни', 'Эндокринология', 'Гастроэнтерология', 'Нефрология',
      'Ревматология', 'Онкология', 'Пульмонология', 'Торакальная хирургия', 'Пластическая хирургия', 'Нейрохирургия',
      'Кардиохирургия', 'Детская хирургия', 'Семейная медицина', 'Спортивная медицина',
    ],
  },
  kuzatuv: {
    ustBaslik: '07 — Наблюдение',
    baslik: 'Ни один пациент',
    baslikVurgu: 'не выпадает из наблюдения.',
    govde:
      'Пациенты с просроченным повторным осмотром и пропущенным наблюдением сами попадают в список. Напоминание отправляется одним нажатием.',
    kart: {
      etiket: 'Список наблюдения',
      satirlar: [
        { k: 'Повторный осмотр просрочен', mark: 'Напомнить' },
        { k: 'Наблюдение пропущено', mark: 'Напомнить' },
      ],
      not: 'Список обновляется сам.',
    },
  },
  organish: {
    ustBaslik: '08 — Обучение',
    baslik: 'Через десять приёмов —',
    baslikVurgu: 'будто вы вместе много лет.',
    govde: 'Запоминает ваши предпочтения; не заставляет повторять одно и то же дважды. Ведёт себя как коллега.',
    gorselAlt: 'Стол врача в утреннем свете: записи приёмов, карманный блокнот, стетоскоп и ручка',
    gorselAlti: 'Записи приёмов · иллюстрация',
    sekmeler: 'Пример приёма',
    birinchi: {
      etiket: 'Приём 1',
      sorov: 'Запишите амоксициллин.',
      javob: 'В какой дозе записать, доктор? Какую форму вы предпочитаете?',
    },
    oninchi: {
      etiket: 'Приём 10',
      sorov: 'Запишите амоксициллин.',
      javob: '40 мг/кг/сут, при этом весе 720 мг в сутки. Обычно вы выбираете амоксициллин-клавуланат — записать его, доктор?',
    },
    izoh: 'Вы не спрашивали. Он вспомнил.',
  },
  xavfsizlik: {
    ustBaslik: '09 — Страховочная сеть',
    baslik: 'Пятьдесят пациентов, тяжёлый день —',
    baslikVurgu: 'он никогда не промолчит.',
    iqtibos: '«Доктор, одну минуту — это взрослая доза. При этом весе разовая доза не должна превышать 250 мг. Исправить?»',
    izoh: 'Неверная доза, опасное сочетание лекарств. Скажет, даже если не спросили. Остановит. Предложит правильный вариант.',
    gorselAlt: 'Коридор частной клиники при дневном свете: двери врачебных кабинетов и скамья для ожидания',
    gorselAlti: 'Коридор клиники · иллюстрация',
    dalillar: [
      { k: 'Шифрование', v: 'Личные данные пациента хранятся в зашифрованном виде.' },
      { k: 'Раздельный доступ', v: 'Каждый врач видит только своих пациентов.' },
      { k: 'Подтверждение врача', v: 'Запись, рецепт и всё, что уходит пациенту, проходит ваше подтверждение.' },
      { k: 'Поддержка решений', v: 'Notya — поддержка принятия решений; диагноз и лечение определяет врач.' },
    ],
  },
  narx: {
    ustBaslik: '10 — Цена',
    baslik: 'Цена —',
    baslikVurgu: 'по запросу.',
    rejalar: [
      {
        ad: 'Врач',
        narx: 'Цена по запросу',
        maddeler: ['Один врач', 'Голосовой помощник', 'Медицинская запись и черновик рецепта', 'Рабочее пространство под вашу специальность', 'Карта пациента и архив'],
      },
      {
        ad: 'Частная практика',
        narx: 'Цена по запросу',
        maddeler: ['Всё из плана «Врач»', 'Портал пациента', 'Консультация коллеги', 'Расписание приёмов и напоминания', 'Списки наблюдения', 'Аккаунт регистратора с отдельными правами'],
      },
      {
        ad: 'Клиника',
        narx: 'Цена по запросу',
        maddeler: ['Несколько врачей', 'Права врача и регистратора', 'Расписание и портал пациента для всей клиники', 'Помощь при подключении'],
      },
    ],
    dugme: 'Запросить цену',
    izoh: 'Notya пока работает по приглашениям, с ограниченной группой врачей. Цена зависит от вашей специальности и числа пользователей.',
  },
  sorov: {
    ustBaslik: 'Частная практика',
    baslik: 'Запросите цену.',
    baslikVurgu: 'Мы свяжемся с вами.',
    govde: 'Пока только по коду приглашения. На узбекском и русском языках. Ещё один коллега в вашем кабинете.',
    form: {
      etiket: 'Запрос цены',
      adSoyad: 'Имя и фамилия',
      kurum: 'Клиника или практика',
      telefon: 'Телефон',
      telefonOrnek: '+998 90 123 45 67',
      uzmanlik: 'Специальность',
      mesaj: 'Сообщение (необязательно)',
      gonder: 'Отправить запрос',
      ipucu: 'Запрос отправляется через почтовое приложение на вашем устройстве.',
      eksik: 'Укажите имя и номер телефона.',
      konu: 'Notya: запрос цены',
      satir: { adSoyad: 'Имя и фамилия', kurum: 'Клиника или практика', telefon: 'Телефон', uzmanlik: 'Специальность', mesaj: 'Сообщение' },
    },
    formYok: 'Приём запросов скоро откроется.',
    davetSorusu: 'Есть код приглашения?',
    davetBaglantisi: 'Регистрация',
  },
  altBilgi: {
    tanim: 'Клинический ИИ-помощник для врачей.',
    havolalar: 'Нижние ссылки',
    giris: 'Войти',
    kayit: 'Регистрация по коду приглашения',
    haklar: 'Notya',
    diller: 'Язык и письмо',
  },
}

// ───────────────────────── Uzbek, Cyrillic script ─────────────────────────
// Written from the Latin source above, line for line. The brand stays in Latin letters.

const UZ_CYRL: AcilisIcerigi = {
  meta: {
    baslik: 'Notya — шифокорлар учун сунъий интеллектли клиник ёрдамчи',
    aciklama:
      'Қабулни тинглайди, тиббий ёзувни ўзбек ёки рус тилида ёзади, рецепт ва хулоса қораламасини тайёрлайди, беморни кузатувда тутади. Ҳар бир қарор шифокор тасдиғи билан.',
  },
  nav: {
    bolumler: 'Бўлимлар',
    mobil: 'Мобил меню',
    dil: 'Тил',
    havolalar: [
      { capa: CAPA.suhbat, etiket: 'Ёрдамчи', no: '01' },
      { capa: CAPA.portal, etiket: 'Портал', no: '03' },
      { capa: CAPA.yonalish, etiket: 'Йўналишлар', no: '06' },
      { capa: CAPA.xavfsizlik, etiket: 'Хавфсизлик', no: '09' },
      { capa: CAPA.narx, etiket: 'Нарх', no: '10' },
    ],
    giris: 'Кириш',
    girisUzun: 'Ҳисобга кириш',
    sorov: 'Нархни сўраш',
    menyuAc: 'Менюни очиш',
    menyuYop: 'Менюни ёпиш',
  },
  kahraman: {
    ustBaslik: 'Шифокорлар учун сунъий интеллектли клиник ёрдамчи',
    baslik: 'Бемор хонадан чиққанда',
    baslikVurgu: 'ишингиз битган бўлсин.',
    giris:
      'Notya ёрдамчиси тажрибали ҳамкасб каби қабулни тинглайди, тиббий ёзувни ёзади, рецепт ва хулоса қораламасини тайёрлайди, беморни кузатувда тутади. Ҳар бир қарор фақат сизнинг тасдиғингиз билан кучга киради.',
    birinciDugme: 'Нархни сўраш',
    ikinciDugme: 'Қабулни кўринг',
    gorselAlt: 'Кундузги ёруғликдаги хусусий шифокор хонаси: кўрик кушеткаси, стетоскоп, тонометр ва дипломлар',
    gorselAlti: 'Шифокор хонаси · тасвирий сурат',
    serit: [
      '30 йўналиш учун мўлжалланган',
      'Овозли, ўзбек ва рус тилларида',
      'Бемор портали билан бирга',
      'Ҳар бир қадам шифокор тасдиғи билан',
    ],
  },
  suhbat: {
    ustBaslik: '01 — Суҳбат',
    baslik: 'Икки ҳамкасб',
    baslikVurgu: 'каби гаплашинг.',
    govde:
      'Бир марта босинг — ёрдамчи тинглай бошлайди. Гапини бўлсангиз, жим бўлади. Тугма босиб туриш шарт эмас.',
    maddeler: ['Суҳбат ўзбек ёки рус тилида матнга айланади', 'Тиббий ёзув қабул тугаши билан тайёр'],
    sekmeler: 'Қабул намуналари',
    yozmoqda: 'ёзмоқда',
    tayyor: 'тайёр',
    izoh: 'Бу қабуллар тўқима намуналардир. Ҳақиқий клиникада ҳар бир жумла шифокор тасдиғига боғлиқ.',
    sahneler: [
      {
        id: 'pedia',
        meta: '1-қабул',
        yordamchi: 'Notya ёрдамчиси',
        alan: 'Педиатрия',
        saat: '09:14',
        navbatlar: [
          { kim: 'Шифокор', rol: 'shifokor', matn: '7 ёш, 18 килограмм. Иситма ва қулоқ оғриғи.' },
          {
            kim: 'Ёрдамчи',
            rol: 'yordamchi',
            matn: 'Ўткир ўрта отитга мос келади. Амоксициллин 40 мг/кг/кун — бу вазнда кунига 720 мг. Ёки амоксициллин-клавуланатни афзал кўрасизми?',
          },
        ],
      },
      {
        id: 'safety',
        meta: 'Хавфсизлик тўри',
        yordamchi: 'Notya ёрдамчиси',
        alan: 'Педиатрия',
        saat: '18:47',
        navbatlar: [
          { kim: 'Шифокор', rol: 'shifokor', matn: 'Амоксициллин 500 мг ёзинг, кунига уч маҳал.' },
          {
            kim: 'Огоҳлантириш',
            rol: 'ogohlantirish',
            matn: 'Доктор, бир дақиқа — бу катталар дозаси. Бу вазнда бир марталик доза 250 мг дан ошмаслиги керак. Тузатайми?',
          },
        ],
      },
      {
        id: 'memory',
        meta: '10-қабул',
        yordamchi: 'Notya ёрдамчиси',
        alan: 'Педиатрия',
        saat: '11:03',
        navbatlar: [
          { kim: 'Шифокор', rol: 'shifokor', matn: 'Амоксициллин ёзинг.' },
          {
            kim: 'Ёрдамчи',
            rol: 'yordamchi',
            matn: '40 мг/кг/кун, бу вазнда кунига 720 мг. Сиз одатда амоксициллин-клавуланатни танлайсиз — шуни ёзайми, доктор?',
          },
        ],
      },
    ],
  },
  qabul: {
    ustBaslik: '02 — Қабул якуни',
    baslik: 'Қабул битта оқимда',
    baslikVurgu: 'ёпилади.',
    govde: 'Қабул якунидаги қадамлар тартиб билан олдингизда туради. Кераксиз қадамни ўтказиб юборасиз.',
    maddeler: [
      'Ўз қабул шаблонларингиз бир босишда',
      'Кейинги қабул бемор кетмасидан белгиланади',
      'Бемор қабул хулосасини ўз порталида кўради',
    ],
    kart: {
      etiket: 'Қабул якуни',
      satirlar: [
        { k: 'Рецепт қораламаси', mark: '01' },
        { k: 'Тиббий хулоса', mark: '02' },
        { k: 'Кейинги қабул', mark: '03' },
        { k: 'Бемор учун хулоса', mark: '04' },
      ],
      not: 'Ҳар бир қадам сизнинг тасдиғингиз билан якунланади.',
    },
  },
  portal: {
    ustBaslik: '03 — Бемор портали',
    baslik: 'Беморингиз қабулхонангизни',
    baslikVurgu: 'чўнтагида олиб юради.',
    govde:
      'Ҳар бир беморга алоҳида, ҳимояланган саҳифа: қабул хулосаси, натижалар, дорилар, кузатув режаси ва сизга ёзилган хабарлар. Илова ўрнатиш шарт эмас.',
    maddeler: [
      'Мазмун йўналишга қараб тартибланган',
      'Қабулга ёзилиш сўрови ва эслатмалар',
      'Беморга кўрсатиладиган ҳар бир маълумот шифокор тасдиғидан ўтади',
    ],
    kart: {
      etiket: 'Бемор саҳифаси',
      satirlar: [{ k: 'Қабул хулосаси' }, { k: 'Натижалар' }, { k: 'Дорилар' }, { k: 'Кузатув режаси' }, { k: 'Хабарлар' }],
      not: 'Битта ҳавола. Илова керак эмас.',
    },
  },
  maslahat: {
    ustBaslik: '04 — Ҳамкасб маслаҳати',
    baslik: 'Ҳамкасб маслаҳати,',
    baslikVurgu: 'телефон қўнғироқларисиз.',
    govde:
      'Қабулдан чиқмай туриб сўров очинг; маслаҳатчи шифокор ўзига келган ҳимояланган ҳавола орқали жавоб қолдиради. Жавоб бемор картасига ёзилади.',
    maddeler: [
      'Ишончли маслаҳатчиларингиз рўйхати',
      'Жавоби кутилаётган сўровлар битта рўйхатда',
      'Маслаҳатчига ҳисоб очиш шарт эмас',
    ],
    kart: {
      etiket: 'Маслаҳат',
      satirlar: [
        { k: 'Сўров', v: 'Қабулдан чиқмай туриб' },
        { k: 'Ҳимояланган ҳавола', v: 'Маслаҳатчи шифокорга' },
        { k: 'Жавоб', v: 'Бемор картасида' },
      ],
    },
  },
  jadval: {
    ustBaslik: '05 — Қабул жадвали ва алоқа',
    baslik: 'Регистратурангиз ҳам',
    baslikVurgu: 'шу тизимда.',
    govde:
      'Қабул жадвали, эслатмалар ва бемор хабарлари бир жойда. Регистратор ўз ҳисоби билан фақат ўзига керакли нарсани кўради.',
    maddeler: ['Келган ҳужжатлар бемор картасига бириктирилади', 'Регистратор ҳисоби алоҳида ҳуқуқ билан ишлайди'],
    kart: {
      etiket: 'Регистратура',
      satirlar: [
        { k: 'Қабул жадвали' },
        { k: 'Эслатмалар' },
        { k: 'Бемор хабарлари' },
        { k: 'Регистратор', mark: 'Алоҳида ҳуқуқ' },
      ],
    },
  },
  yonalish: {
    ustBaslik: '06 — Йўналишингизга мос',
    baslik: 'Умумий ёрдамчи эмас.',
    baslikVurgu: 'Сизнинг йўналишингиз.',
    govde:
      'Notya 30 йўналиш учун мўлжалланган: ҳар бирига ўша йўналишнинг кундалик ишига мос иш майдони. Йўналишлар босқичма-босқич ишга туширилади.',
    misollar: [
      { k: 'Педиатрия', v: 'Ўсиш, эмлаш ва ривожланиш кузатуви бир қарашда.' },
      { k: 'Акушерлик ва гинекология', v: 'Ҳомиладорлик тақвими ва кузатув муддатлари ўз-ўзидан.' },
      { k: 'Офтальмология', v: 'Кўриш кузатуви, қабулдан қабулга солиштириб.' },
    ],
    royxatEtiketi: 'Йўналишлар',
    royxat: [
      'Педиатрия', 'Кардиология', 'Неврология', 'Терапия', 'Психиатрия', 'Умумий жарроҳлик',
      'Травматология ва ортопедия', 'Дерматология', 'Оториноларингология', 'Офтальмология',
      'Акушерлик ва гинекология', 'Урология', 'Радиология', 'Анестезиология', 'Шошилинч тиббиёт',
      'Физиотерапия ва реабилитация', 'Юқумли касалликлар', 'Эндокринология', 'Гастроэнтерология', 'Нефрология',
      'Ревматология', 'Онкология', 'Пульмонология', 'Торакал жарроҳлик', 'Пластик жарроҳлик', 'Нейрохирургия',
      'Кардиожарроҳлик', 'Болалар жарроҳлиги', 'Оилавий тиббиёт', 'Спорт тиббиёти',
    ],
  },
  kuzatuv: {
    ustBaslik: '07 — Кузатув',
    baslik: 'Ҳеч бир бемор',
    baslikVurgu: 'кузатувдан тушиб қолмайди.',
    govde:
      'Қайта кўриги кечиккан ва кузатуви ўтказиб юборилган беморлар ўз-ўзидан рўйхатга тушади. Бир босишда эслатма юборасиз.',
    kart: {
      etiket: 'Кузатув рўйхати',
      satirlar: [
        { k: 'Қайта кўриги кечиккан', mark: 'Эслатиш' },
        { k: 'Кузатуви ўтказиб юборилган', mark: 'Эслатиш' },
      ],
      not: 'Рўйхат ўз-ўзидан янгиланади.',
    },
  },
  organish: {
    ustBaslik: '08 — Ўрганиш',
    baslik: 'Ўн қабулдан кейин',
    baslikVurgu: 'гўё йиллар давомида биргасиз.',
    govde: 'Афзал кўрганларингизни эслаб қолади; бир гапни икки марта айттирмайди. Ўзини ҳамкасб каби тутади.',
    gorselAlt: 'Эрталабки ёруғликдаги шифокор столи: қабул ёзувлари, чўнтак дафтари, стетоскоп ва ручка',
    gorselAlti: 'Қабул ёзувлари · тасвирий сурат',
    sekmeler: 'Қабул намунаси',
    birinchi: {
      etiket: '1-қабул',
      sorov: 'Амоксициллин ёзинг.',
      javob: 'Қайси дозада ёзай, доктор? Қайси шаклини афзал кўрасиз?',
    },
    oninchi: {
      etiket: '10-қабул',
      sorov: 'Амоксициллин ёзинг.',
      javob: '40 мг/кг/кун, бу вазнда кунига 720 мг. Сиз одатда амоксициллин-клавуланатни танлайсиз — шуни ёзайми, доктор?',
    },
    izoh: 'Сиз сўрамадингиз. У эслади.',
  },
  xavfsizlik: {
    ustBaslik: '09 — Хавфсизлик тўри',
    baslik: 'Эллик бемор, оғир кун —',
    baslikVurgu: 'у ҳеч қачон жим турмайди.',
    iqtibos: '“Доктор, бир дақиқа — бу катталар дозаси. Бу вазнда бир марталик доза 250 мг дан ошмаслиги керак. Тузатайми?”',
    izoh: 'Нотўғри доза, хавфли дори бирикмаси. Сўрамасангиз ҳам айтади. Тўхтатади. Тўғрисини таклиф қилади.',
    gorselAlt: 'Кундузги ёруғликдаги хусусий клиника йўлаги: шифокор хоналари эшиклари ва кутиш ўриндиғи',
    gorselAlti: 'Клиника йўлаги · тасвирий сурат',
    dalillar: [
      { k: 'Шифрлаш', v: 'Беморнинг шахсий маълумотлари шифрланган ҳолда сақланади.' },
      { k: 'Алоҳида кириш', v: 'Ҳар бир шифокор фақат ўз беморларини кўради.' },
      { k: 'Шифокор тасдиғи', v: 'Ёзув, рецепт ва беморга борадиган ҳар бир маълумот сизнинг тасдиғингиздан ўтади.' },
      { k: 'Қарор кўмаги', v: 'Notya — қарор қабул қилишга кўмак; ташхис ва даволаш қарори шифокорга тегишли.' },
    ],
  },
  narx: {
    ustBaslik: '10 — Нарх',
    baslik: 'Нарх —',
    baslikVurgu: 'сўров бўйича.',
    rejalar: [
      {
        ad: 'Шифокор',
        narx: 'Нарх сўров бўйича',
        maddeler: ['Битта шифокор', 'Овозли ёрдамчи', 'Тиббий ёзув ва рецепт қораламаси', 'Йўналишингизга мос иш майдони', 'Бемор картаси ва архив'],
      },
      {
        ad: 'Хусусий амалиёт',
        narx: 'Нарх сўров бўйича',
        maddeler: ['Шифокор режасидаги ҳамма нарса', 'Бемор портали', 'Ҳамкасб маслаҳати', 'Қабул жадвали ва эслатмалар', 'Кузатув рўйхатлари', 'Регистратор ҳисоби, алоҳида ҳуқуқ билан'],
      },
      {
        ad: 'Клиника',
        narx: 'Нарх сўров бўйича',
        maddeler: ['Бир нечта шифокор', 'Шифокор ва регистратор ҳуқуқлари', 'Бутун клиника учун жадвал ва бемор портали', 'Ўрнатишда ёрдам'],
      },
    ],
    dugme: 'Нархни сўраш',
    izoh: 'Notya ҳозирча таклиф асосида, чекланган шифокорлар гуруҳи билан ишламоқда. Нарх йўналишингиз ва фойдаланувчилар сонига қараб белгиланади.',
  },
  sorov: {
    ustBaslik: 'Хусусий амалиёт',
    baslik: 'Нархни сўранг.',
    baslikVurgu: 'Сиз билан боғланамиз.',
    govde: 'Ҳозирча фақат таклиф коди билан. Ўзбек ва рус тилларида. Қабулхонангизга яна бир ҳамкасб.',
    form: {
      etiket: 'Нарх сўрови',
      adSoyad: 'Исм ва фамилия',
      kurum: 'Клиника ёки амалиёт',
      telefon: 'Телефон',
      telefonOrnek: '+998 90 123 45 67',
      uzmanlik: 'Йўналиш',
      mesaj: 'Хабар (ихтиёрий)',
      gonder: 'Сўров юбориш',
      ipucu: 'Сўров қурилмангиздаги почта иловаси орқали юборилади.',
      eksik: 'Исм ва телефон рақамини ёзинг.',
      konu: 'Notya: нарх сўрови',
      satir: { adSoyad: 'Исм ва фамилия', kurum: 'Клиника ёки амалиёт', telefon: 'Телефон', uzmanlik: 'Йўналиш', mesaj: 'Хабар' },
    },
    formYok: 'Сўровлар қабули тез орада очилади.',
    davetSorusu: 'Таклиф кодингиз борми?',
    davetBaglantisi: 'Рўйхатдан ўтиш',
  },
  altBilgi: {
    tanim: 'Шифокорлар учун сунъий интеллектли клиник ёрдамчи.',
    havolalar: 'Қуйи ҳаволалар',
    giris: 'Кириш',
    kayit: 'Таклиф коди билан рўйхатдан ўтиш',
    haklar: 'Notya',
    diller: 'Тил ва ёзув',
  },
}

/** One entry per form the page is written in. A form without an entry here fails the type check. */
export const ACILIS_ICERIGI: Record<AcilisDili, AcilisIcerigi> = { 'uz-Latn': UZ_LATN, 'uz-Cyrl': UZ_CYRL, ru: RU }

export function acilisDiliMi(ham: unknown): ham is AcilisDili {
  return typeof ham === 'string' && (ACILIS_DILLERI as readonly string[]).includes(ham)
}

/** No fallback: a language the page is not written in is an error, never another language's text. */
export function acilisIcerigi(dil: DilKodu): AcilisIcerigi {
  if (!acilisDiliMi(dil)) throw new Error(`[uz/acilis] no landing copy for "${dil}". No fallback to another language.`)
  return ACILIS_ICERIGI[dil]
}
