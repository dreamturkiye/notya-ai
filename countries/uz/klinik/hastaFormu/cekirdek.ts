/**
 * NOTYA-ULKE-INTAKE-01 — Uzbekistan: THE CORE QUESTIONS of the intake form — what every patient is asked, whatever
 * the doctor's role. The role's own questions follow them (./roller*.ts).
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * MACHINE-WRITTEN. AWAITS A LOCAL CLINICIAN AND A NATIVE READER. These questions were written by a machine. No
 * clinician practising in Uzbekistan has read them, and nobody who speaks Uzbek or Russian as a first language has
 * read a single sentence. PATIENT-FACING: a patient reads them alone, on a phone (checklist C13, C14, E11).
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * STRUCTURE taken from the Turkish product's form (which topics a core form covers, and its child-form rules);
 * NO TEXT WAS COPIED OR TRANSLATED. What exists only in Türkiye is not here: the Turkish identity number, the
 * payer and insurance section, the names of father and mother and the place of birth of the Turkish identity card,
 * the Turkish data-protection consent and its messaging permissions. Nothing asks for an identity number at all.
 *
 * NOT ASKED AGAIN: name, date of birth, sex and phone. The doctor recorded them when the patient's file was made,
 * and the form belongs to that file.
 *
 * THE GUARDIAN FORM (a patient under the pack's guardian age, in every role). It begins with WHO IS FILLING IT IN.
 * The parents' marital status is a question of the guardian form only — an adult is not asked their own. An adult's
 * smoking and alcohol are not asked about a child; smoking at home is asked instead. Each question that speaks to
 * the reader has a second wording for a parent or guardian (`veliMetni`).
 *
 * NO REFERENCE CONTENT. No drug is named, no schedule, no normal value. Medicines and allergies are free text.
 * The short list of long-term conditions names broad groups in everyday words; it is a machine's choice of what to
 * offer and waits for a clinician like everything else (./yerelIcerik.ts lists what was deliberately left out).
 *
 * UNITS. Height, weight and temperature are asked in the pack's units (`uygulama.birimler`: centimetres, kilograms,
 * degrees Celsius); the unit is never written into a question.
 */
import type { FormBolumu } from '@/lib/ulke/intake/tipler'
import { cok, eh, kisa, olcu, QACHON, s, tek, u, uzun, YOQ } from './yardimci'

export const UZ_CEKIRDEK_BOLUMLER: readonly FormBolumu[] = [
  // ── the guardian form begins here ──
  {
    anahtar: 'toldiruvchi',
    kime: 'cocuk',
    baslik: u('Soʻrovnomani kim toʻldirmoqda', 'Сўровномани ким тўлдирмоқда', 'Кто заполняет анкету'),
    sorular: [
      tek('vakil_kim', u('Siz bolaning kimi boʻlasiz?', 'Сиз боланинг кими бўласиз?', 'Кем вы приходитесь ребёнку?'), [
        s('ona', 'Onasi', 'Онаси', 'Мать'),
        s('ota', 'Otasi', 'Отаси', 'Отец'),
        s('vasiy', 'Qonuniy vakili (vasiysi)', 'Қонуний вакили (васийси)', 'Законный представитель (опекун)'),
        s('boshqa', 'Boshqa yaqini', 'Бошқа яқини', 'Другой близкий человек'),
      ], { zorunlu: true }),
      kisa('vakil_ism', u('Ismingiz va familiyangiz', 'Исмингиз ва фамилиянгиз', 'Ваши имя и фамилия'), { zorunlu: true }),
      kisa('vakil_telefon', u('Siz bilan bogʻlanish uchun telefon raqami', 'Сиз билан боғланиш учун телефон рақами', 'Номер телефона для связи с вами')),
      tek('ota_ona_holati', u('Bolaning ota-onasi', 'Боланинг ота-онаси', 'Родители ребёнка'), [
        s('birga', 'Nikohda, birga yashaydi', 'Никоҳда, бирга яшайди', 'В браке, живут вместе'),
        s('ajrashgan', 'Ajrashgan', 'Ажрашган', 'В разводе'),
        s('alohida', 'Alohida yashaydi', 'Алоҳида яшайди', 'Живут раздельно'),
        s('nikohsiz', 'Nikohda emas', 'Никоҳда эмас', 'Не состоят в браке'),
        s('vafot', 'Ota yoki ona vafot etgan', 'Ота ёки она вафот этган', 'Отец или мать умерли'),
      ]),
    ],
  },
  {
    anahtar: 'murojaat',
    baslik: u('Murojaat sababi', 'Мурожаат сабаби', 'Причина обращения'),
    sorular: [
      uzun('sabab', u('Shifokorga nima sababdan murojaat qilyapsiz?', 'Шифокорга нима сабабдан мурожаат қиляпсиз?', 'По какой причине вы обращаетесь к врачу?'), {
        zorunlu: true,
        veliMetni: u('Bolani shifokorga nima sababdan olib kelyapsiz?', 'Болани шифокорга нима сабабдан олиб келяпсиз?', 'По какой причине вы приводите ребёнка к врачу?'),
      }),
      tek('qachondan', u('Shikoyat qachondan beri bor?', 'Шикоят қачондан бери бор?', 'Как давно появилась жалоба?'), [
        s('bugun', 'Bugundan', 'Бугундан', 'С сегодняшнего дня'),
        s('kunlar', 'Bir necha kundan beri', 'Бир неча кундан бери', 'Несколько дней'),
        s('haftalar', 'Bir necha haftadan beri', 'Бир неча ҳафтадан бери', 'Несколько недель'),
        s('oylar', 'Bir necha oydan beri', 'Бир неча ойдан бери', 'Несколько месяцев'),
        s('yil', 'Bir yildan ortiq', 'Бир йилдан ортиқ', 'Больше года'),
        s('shikoyatsiz', 'Shikoyat yoʻq, tekshiruv uchun', 'Шикоят йўқ, текширув учун', 'Жалоб нет, для осмотра'),
      ]),
    ],
  },
  {
    anahtar: 'salomatlik',
    baslik: u('Salomatlik tarixi', 'Саломатлик тарихи', 'Сведения о здоровье'),
    sorular: [
      cok('surunkali', u('Shifokor aniqlagan surunkali kasalliklaringiz bormi?', 'Шифокор аниқлаган сурункали касалликларингиз борми?', 'Есть ли у вас хронические заболевания, установленные врачом?'), [
        s('diabet', 'Qandli diabet', 'Қандли диабет', 'Сахарный диабет'),
        s('bosim', 'Yuqori qon bosimi (gipertoniya)', 'Юқори қон босими (гипертония)', 'Повышенное давление (гипертония)'),
        s('yurak', 'Yurak kasalligi', 'Юрак касаллиги', 'Заболевание сердца'),
        s('opka', 'Bronxial astma yoki surunkali oʻpka kasalligi', 'Бронхиал астма ёки сурункали ўпка касаллиги', 'Бронхиальная астма или хроническое заболевание лёгких'),
        s('buyrak', 'Buyrak kasalligi', 'Буйрак касаллиги', 'Заболевание почек'),
        s('qalqonsimon', 'Qalqonsimon bez kasalligi', 'Қалқонсимон без касаллиги', 'Заболевание щитовидной железы'),
        s('onkologik', 'Onkologik kasallik', 'Онкологик касаллик', 'Онкологическое заболевание'),
        s('boshqa', 'Boshqa kasallik', 'Бошқа касаллик', 'Другое заболевание'),
        YOQ(),
      ], {
        zorunlu: true,
        veliMetni: u('Bolada shifokor aniqlagan surunkali kasalliklar bormi?', 'Болада шифокор аниқлаган сурункали касалликлар борми?', 'Есть ли у ребёнка хронические заболевания, установленные врачом?'),
      }),
      kisa('surunkali_boshqa', u('Boshqa kasallik boʻlsa, yozing', 'Бошқа касаллик бўлса, ёзинг', 'Если есть другое заболевание, напишите какое')),
      eh('operatsiyalar', u('Operatsiya boʻlganmisiz?', 'Операция бўлганмисиз?', 'Были ли у вас операции?'),
        u('Qanday operatsiya va qaysi yili?', 'Қандай операция ва қайси йили?', 'Какая операция и в каком году?'),
        { veliMetni: u('Bola operatsiya boʻlganmi?', 'Бола операция бўлганми?', 'Были ли у ребёнка операции?') }),
      eh('kasalxona', u('Kasalxonada yotib davolanganmisiz?', 'Касалхонада ётиб даволанганмисиз?', 'Лежали ли вы в больнице?'), QACHON,
        { veliMetni: u('Bola kasalxonada yotib davolanganmi?', 'Бола касалхонада ётиб даволанганми?', 'Лежал ли ребёнок в больнице?') }),
      eh('dorilar', u('Doimiy qabul qiladigan dorilaringiz bormi?', 'Доимий қабул қиладиган дориларингиз борми?', 'Принимаете ли вы какие-либо лекарства постоянно?'),
        u('Dorilarning nomi va qanday qabul qilinishi (bilganingizcha)', 'Дориларнинг номи ва қандай қабул қилиниши (билганингизча)', 'Названия лекарств и как вы их принимаете (насколько вам известно)'),
        { zorunlu: true, veliMetni: u('Bola doimiy qabul qiladigan dorilar bormi?', 'Бола доимий қабул қиладиган дорилар борми?', 'Принимает ли ребёнок какие-либо лекарства постоянно?') }),
      eh('allergiya', u('Dori, oziq-ovqat yoki boshqa narsaga allergiyangiz bormi?', 'Дори, озиқ-овқат ёки бошқа нарсага аллергиянгиз борми?', 'Есть ли у вас аллергия на лекарства, продукты или что-либо ещё?'),
        u('Nimaga allergiya bor va u qanday namoyon boʻladi?', 'Нимага аллергия бор ва у қандай намоён бўлади?', 'На что аллергия и как она проявляется?'),
        { zorunlu: true, veliMetni: u('Bolada dori, oziq-ovqat yoki boshqa narsaga allergiya bormi?', 'Болада дори, озиқ-овқат ёки бошқа нарсага аллергия борми?', 'Есть ли у ребёнка аллергия на лекарства, продукты или что-либо ещё?') }),
      eh('oilada', u('Yaqin qarindoshlaringizda (ota-ona, aka-uka, opa-singil) jiddiy kasalliklar boʻlganmi?', 'Яқин қариндошларингизда (ота-она, ака-ука, опа-сингил) жиддий касалликлар бўлганми?', 'Были ли серьёзные заболевания у ваших близких родственников (родители, братья, сёстры)?'),
        u('Kimda va qanday kasallik?', 'Кимда ва қандай касаллик?', 'У кого и какое заболевание?'),
        { veliMetni: u('Bolaning yaqin qarindoshlarida (ota-ona, aka-uka, opa-singil) jiddiy kasalliklar boʻlganmi?', 'Боланинг яқин қариндошларида (ота-она, ака-ука, опа-сингил) жиддий касалликлар бўлганми?', 'Были ли серьёзные заболевания у близких родственников ребёнка (родители, братья, сёстры)?') }),
    ],
  },
  {
    anahtar: 'turmush',
    baslik: u('Turmush tarzi', 'Турмуш тарзи', 'Образ жизни'),
    sorular: [
      tek('chekish', u('Chekasizmi?', 'Чекасизми?', 'Курите ли вы?'), [
        s('yoq', 'Yoʻq, chekmayman', 'Йўқ, чекмайман', 'Нет, не курю'),
        s('ha', 'Ha, chekaman', 'Ҳа, чекаман', 'Да, курю'),
        s('tashlagan', 'Avval chekkanman, tashlaganman', 'Аввал чекканман, ташлаганман', 'Раньше курил(а), бросил(а)'),
      ], { kime: 'yetiskin' }),
      tek('alkogol', u('Spirtli ichimlik ichasizmi?', 'Спиртли ичимлик ичасизми?', 'Употребляете ли вы алкоголь?'), [
        s('yoq', 'Ichmayman', 'Ичмайман', 'Не употребляю'),
        s('bazan', 'Baʼzan', 'Баъзан', 'Иногда'),
        s('muntazam', 'Muntazam', 'Мунтазам', 'Регулярно'),
      ], { kime: 'yetiskin' }),
      tek('homiladorlik', u('Homiladorlik yoki emizish (sizga tegishli boʻlsa)', 'Ҳомиладорлик ёки эмизиш (сизга тегишли бўлса)', 'Беременность или кормление грудью (если это относится к вам)'), [
        s('emas', 'Homilador emasman', 'Ҳомиладор эмасман', 'Не беременна'),
        s('mumkin', 'Homilador boʻlishim mumkin', 'Ҳомиладор бўлишим мумкин', 'Возможно, беременна'),
        s('homilador', 'Homiladorman', 'Ҳомиладорман', 'Беременна'),
        s('emizaman', 'Emizaman', 'Эмизаман', 'Кормлю грудью'),
        s('tegishli_emas', 'Bu savol menga tegishli emas', 'Бу савол менга тегишли эмас', 'Этот вопрос ко мне не относится'),
      ], { kime: 'yetiskin', cinsiyet: 'female' }),
      eh('uyda_chekish', u('Uyda chekadigan kishi bormi?', 'Уйда чекадиган киши борми?', 'Курит ли кто-нибудь дома?'), undefined, { kime: 'cocuk' }),
    ],
  },
  {
    anahtar: 'olchovlar',
    baslik: u('Oʻlchovlar (bilsangiz)', 'Ўлчовлар (билсангиз)', 'Измерения (если знаете)'),
    sorular: [
      olcu('boy', u('Boʻyingiz', 'Бўйингиз', 'Ваш рост'), 'boy', { veliMetni: u('Bolaning boʻyi', 'Боланинг бўйи', 'Рост ребёнка') }),
      olcu('vazn', u('Vazningiz', 'Вазнингиз', 'Ваш вес'), 'agirlik', { veliMetni: u('Bolaning vazni', 'Боланинг вазни', 'Вес ребёнка') }),
      olcu('harorat', u('Bugun tana haroratingizni oʻlchagan boʻlsangiz, u qancha edi?', 'Бугун тана ҳароратингизни ўлчаган бўлсангиз, у қанча эди?', 'Если вы сегодня измеряли температуру тела, какой она была?'), 'sicaklik',
        { veliMetni: u('Bugun bolaning tana haroratini oʻlchagan boʻlsangiz, u qancha edi?', 'Бугун боланинг тана ҳароратини ўлчаган бўлсангиз, у қанча эди?', 'Если вы сегодня измеряли ребёнку температуру тела, какой она была?') }),
    ],
  },
  {
    anahtar: 'yaqin',
    baslik: u('Zarur boʻlganda bogʻlanish uchun yaqiningiz (ixtiyoriy)', 'Зарур бўлганда боғланиш учун яқинингиз (ихтиёрий)', 'Близкий человек, с которым можно связаться при необходимости (по желанию)'),
    kime: 'yetiskin',
    sorular: [
      kisa('yaqin_ism', u('Ismi va familiyasi', 'Исми ва фамилияси', 'Имя и фамилия')),
      kisa('yaqin_kim', u('Sizga kim boʻladi?', 'Сизга ким бўлади?', 'Кем он или она вам приходится?')),
      kisa('yaqin_telefon', u('Telefon raqami', 'Телефон рақами', 'Номер телефона')),
    ],
  },
]
