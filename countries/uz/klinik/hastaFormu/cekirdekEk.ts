/**
 * NOTYA-ULKE-INTAKE-02 — Uzbekistan: extra core questions (daily life, document, state medical cover, consent).
 * MACHINE-WRITTEN. AWAITS A LOCAL CLINICIAN AND A NATIVE READER. CONSENT TEXT PENDING A LAWYER.
 * PATIENT-FACING. No Turkish identity number, and no claim that a lawyer has read the consent lines.
 */
import type { FormBolumu } from '@/lib/ulke/intake/tipler'
import { eh, kisa, s, tek, u } from './yardimci'

const YORDAM = u(
  'Shifokor buni koʻrikdan oldin tushuntirishi mumkin.',
  'Шифокор буни кўрикдан олдин тушунтириши мумкин.',
  'Врач может объяснить это до приёма.',
)
const ROZI = [
  s('rozi', 'Rozilik bildiriladi', 'Розилик билдирилади', 'Согласие даётся'),
  s('muhokama', 'Avval shifokor bilan muhokama qilinadi', 'Аввал шифокор билан муҳокама қилинади', 'Сначала это обсуждается с врачом'),
]

export const UZ_CEKIRDEK_EK: readonly FormBolumu[] = [
  {
    anahtar: 'qoshimcha',
    baslik: u('Qoʻshimcha maʼlumot', 'Қўшимча маълумот', 'Дополнительные сведения'),
    veliBasligi: u('Bola haqida qoʻshimcha maʼlumot', 'Бола ҳақида қўшимча маълумот', 'Дополнительные сведения о ребёнке'),
    sorular: [
      kisa('yashash_manzili', u('Yashash manzili', 'Яшаш манзили', 'Адрес проживания'), {
        veliMetni: u('Bolaning yashash manzili', 'Боланинг яшаш манзили', 'Адрес проживания ребёнка'),
      }),
      kisa('pochta', u('Pochta manzili', 'Почта манзили', 'Адрес электронной почты'), {
        veliMetni: u('Ota-ona yoki vakilning pochta manzili', 'Ота-она ёки вакилнинг почта манзили', 'Адрес электронной почты родителя или представителя'),
      }),
      kisa('shahar', u('Shahar yoki tuman', 'Шаҳар ёки туман', 'Город или район'), {
        veliMetni: u('Bola yashaydigan shahar yoki tuman', 'Бола яшайдиган шаҳар ёки туман', 'Город или район, где живёт ребёнок'),
      }),
      tek('nikoh', u('Nikoh holati', 'Никоҳ ҳолати', 'Семейное положение'), [
        s('turmush_qurmagan', 'Turmush qurmagan', 'Турмуш қурмаган', 'Не состоит в браке'),
        s('turmush', 'Turmush qurgan', 'Турмуш қурган', 'Состоит в браке'),
        s('ajrashgan', 'Ajrashgan', 'Ажрашган', 'В разводе'),
        s('beva', 'Beva', 'Бева', 'Вдовец или вдова'),
        s('aytmaslik', 'Aytishni xohlamayman', 'Айтишни хоҳламайман', 'Предпочитаю не указывать'),
      ], { kime: 'yetiskin' }),
      kisa('kasb', u('Kasb yoki mashgʻulot, boʻlsa', 'Касб ёки машғулот, бўлса', 'Профессия или занятие, если есть'), { kime: 'yetiskin' }),
      tek('qon_guruhi', u('Qon guruhi, maʼlum boʻlsa', 'Қон гуруҳи, маълум бўлса', 'Группа крови, если она известна'), [
        s('nomalum', 'Nomaʼlum', 'Номаълум', 'Неизвестно'),
        s('a_musbat', 'A musbat', 'А мусбат', 'А положительная'),
        s('a_manfiy', 'A manfiy', 'А манфий', 'А отрицательная'),
        s('b_musbat', 'B musbat', 'В мусбат', 'В положительная'),
        s('b_manfiy', 'B manfiy', 'В манфий', 'В отрицательная'),
        s('ab_musbat', 'AB musbat', 'АВ мусбат', 'АВ положительная'),
        s('ab_manfiy', 'AB manfiy', 'АВ манфий', 'АВ отрицательная'),
        s('o_musbat', 'O musbat', 'О мусбат', 'О положительная'),
        s('o_manfiy', 'O manfiy', 'О манфий', 'О отрицательная'),
      ], { veliMetni: u('Bolaning qon guruhi, maʼlum boʻlsa', 'Боланинг қон гуруҳи, маълум бўлса', 'Группа крови ребёнка, если она известна') }),
      eh('qoshimcha_vosita', u('Vitamin yoki qoʻshimcha vosita muntazam qabul qilinadimi?', 'Витамин ёки қўшимча восита мунтазам қабул қилинадими?', 'Принимаются ли витамины или добавки регулярно?'),
        u('Nomlari, maʼlum boʻlsa', 'Номлари, маълум бўлса', 'Названия, если они известны'),
        { veliMetni: u('Bola vitamin yoki qoʻshimcha vositani muntazam qabul qiladimi?', 'Бола витамин ёки қўшимча воситани мунтазам қабул қиладими?', 'Принимает ли ребёнок витамины или добавки регулярно?') }),
      eh('boshqa_shifokor', u('Boshqa shifokor muntazam kuzatuv olib boradimi?', 'Бошқа шифокор мунтазам кузатув олиб борадими?', 'Ведётся ли регулярное наблюдение у другого врача?'),
        u('Qaysi shifokor va nima sababdan?', 'Қайси шифокор ва нима сабабдан?', 'Какой врач и по какой причине?'),
        { veliMetni: u('Bolani boshqa shifokor muntazam kuzatadimi?', 'Болани бошқа шифокор мунтазам кузатадими?', 'Наблюдает ли ребёнка регулярно другой врач?') }),
      tek('jismoniy_faollik', u('Jismoniy faollik', 'Жисмоний фаоллик', 'Физическая активность'), [
        s('kam', 'Deyarli yoʻq', 'Деярли йўқ', 'Почти нет'),
        s('bazan', 'Baʼzan', 'Баъзан', 'Иногда'),
        s('muntazam', 'Muntazam', 'Мунтазам', 'Регулярно'),
      ], { kime: 'yetiskin' }),
      eh('uyqu_holati', u('Soʻnggi paytda uyqu yomonmi?', 'Сўнгги пайтда уйқу ёмонми?', 'Был ли сон плохим в последнее время?'),
        u('Nima oʻzgargan?', 'Нима ўзгарган?', 'Что изменилось?'),
        { veliMetni: u('Soʻnggi paytda bolaning uyqusi yomonmi?', 'Сўнгги пайтда боланинг уйқуси ёмонми?', 'Был ли сон ребёнка плохим в последнее время?') }),
      eh('tarjimon', u('Bu tashrif uchun tarjimon kerakmi?', 'Бу ташриф учун таржимон керакми?', 'Нужен ли переводчик для этого визита?'),
        u('Qaysi til?', 'Қайси тил?', 'Какой язык?'),
        { veliMetni: u('Bu tashrif uchun bolaga tarjimon kerakmi?', 'Бу ташриф учун болага таржимон керакми?', 'Нужен ли ребёнку переводчик для этого визита?') }),
      eh('yurish', u('Yurish yoki kundalik harakat cheklanganmi?', 'Юриш ёки кундалик ҳаракат чекланганми?', 'Ограничены ли ходьба или повседневные движения?'),
        u('Qanday?', 'Қандай?', 'Каким образом?'),
        { veliMetni: u('Bolaning yurishi yoki kundalik harakati cheklanganmi?', 'Боланинг юриши ёки кундалик ҳаракати чекланганми?', 'Ограничены ли ходьба или повседневные движения ребёнка?') }),
      eh('eshitish', u('Eshitishda qiyinchilik bormi?', 'Эшитишда қийинчилик борми?', 'Есть ли затруднение слуха?'),
        u('Qaysi quloq va qachondan?', 'Қайси қулоқ ва қачондан?', 'Какое ухо и с какого времени?'),
        { veliMetni: u('Bolada eshitish qiyinchiligi bormi?', 'Болада эшитиш қийинчилиги борми?', 'Есть ли у ребёнка затруднение слуха?') }),
    ],
  },
  {
    anahtar: 'shaxs',
    baslik: u('Hujjat va davlat tibbiy qoplamasi', 'Ҳужжат ва давлат тиббий қопламаси', 'Документ и государственное медицинское покрытие'),
    sorular: [
      tek('hujjat_turi', u('Qaysi hujjat koʻrsatiladi?', 'Қайси ҳужжат кўрсатилади?', 'Какой документ указывается?'), [
        s('jshshir', 'JSHSHIR (PINFL)', 'ЖШШИР', 'ПИНФЛ'),
        s('pasport', 'Pasport', 'Паспорт', 'Паспорт (национальный или заграничный)'),
        s('boshqa', 'Boshqa hujjat', 'Бошқа ҳужжат', 'Другой документ'),
        s('aytmaslik', 'Aytishni xohlamayman', 'Айтишни хоҳламайман', 'Предпочитаю не указывать'),
      ], { veliMetni: u('Bola uchun qaysi hujjat koʻrsatiladi?', 'Бола учун қайси ҳужжат кўрсатилади?', 'Какой документ указывается для ребёнка?') }),
      kisa('hujjat_raqam', u('Hujjat raqami, maʼlum boʻlsa', 'Ҳужжат рақами, маълум бўлса', 'Номер документа, если он известен'), {
        veliMetni: u('Bolaning hujjat raqami, maʼlum boʻlsa', 'Боланинг ҳужжат рақами, маълум бўлса', 'Номер документа ребёнка, если он известен'),
        yardim: u('Tekshirilmaydi. Boʻsh qoldirish mumkin.', 'Текширилмайди. Бўш қолдириш мумкин.', 'Не проверяется. Можно оставить пустым.'),
      }),
      tek('davlat_sugurta', u('Davlat tibbiy sugʻurtasi bormi?', 'Давлат тиббий суғуртаси борми?', 'Есть ли государственное медицинское страхование?'), [
        s('ha', 'Ha', 'Ҳа', 'Да'),
        s('yoq', 'Yoʻq', 'Йўқ', 'Нет'),
        s('bilinmaydi', 'Bilinmaydi', 'Билинмайди', 'Неизвестно'),
        s('aytmaslik', 'Aytishni xohlamayman', 'Айтишни хоҳламайман', 'Предпочитаю не указывать'),
      ], { veliMetni: u('Bola uchun davlat tibbiy sugʻurtasi bormi?', 'Бола учун давлат тиббий суғуртаси борми?', 'Есть ли государственное медицинское страхование для ребёнка?') }),
      kisa('hudud', u('Qaysi viloyat yoki shahar?', 'Қайси вилоят ёки шаҳар?', 'Какая область или какой город?'), {
        veliMetni: u('Bola qaysi viloyat yoki shaharda yashaydi?', 'Бола қайси вилоят ёки шаҳарда яшайди?', 'В какой области или в каком городе живёт ребёнок?'),
      }),
    ],
  },
  {
    anahtar: 'rozilik',
    baslik: u('Rozilik', 'Розилик', 'Согласие'),
    veliBasligi: u('Bola nomidan rozilik', 'Бола номидан розилик', 'Согласие от имени ребёнка'),
    sorular: [
      tek('davolash_rozi', u('Koʻrik va davolashga rozilik bildiriladimi?', 'Кўрик ва даволашга розилик билдириладими?', 'Даётся ли согласие на осмотр и лечение?'), ROZI, {
        zorunlu: true,
        veliMetni: u('Bolaning koʻrigi va davolashiga rozilik bildiriladimi?', 'Боланинг кўриги ва даволашига розилик билдириладими?', 'Даётся ли согласие на осмотр и лечение ребёнка?'),
        yardim: YORDAM,
      }),
      tek('yozuv_rozi', u('Javoblar tibbiy maʼlumot sifatida saqlanishiga rozilik bildiriladimi?', 'Жавоблар тиббий маълумот сифатида сақланишига розилик билдириладими?', 'Даётся ли согласие хранить ответы как медицинские сведения?'), ROZI, {
        zorunlu: true,
        veliMetni: u('Javoblar bolaning tibbiy maʼlumoti sifatida saqlanishiga rozilik bildiriladimi?', 'Жавоблар боланинг тиббий маълумоти сифатида сақланишига розилик билдириладими?', 'Даётся ли согласие хранить ответы как медицинские сведения ребёнка?'),
        yardim: YORDAM,
      }),
    ],
  },
]
