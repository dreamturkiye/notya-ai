/**
 * AMELIYAT-NOTU-01 / KD-RAPOR-01 (Kaan, 2026-11-05) — Uzbekistan: ROLE TOOLS, seventh part. The operation note (every
 * surgical role), and for obstetrics and gynaecology: the operation note with pre-filled standard steps, the obstetric
 * and gynaecological ultrasound reports, the discharge summary after birth (koʻchirma / выписка) and the CTG by the
 * FIGO 2015 consensus (international; no national protocol of Uzbekistan is used). Printed on the doctor's letterhead.
 *
 * MACHINE-WRITTEN. AWAITS NATIVE REVIEW (see ./index.ts), and a clinician's. Cyrillic derived from the Latin text by rule
 * (scripts/uz-kiril.mjs). The pre-filled steps write NO dose, NO pressure, NO size and NO count: every number is the
 * surgeon's, left as "__". Hymenoplasty is not offered (WHO/OHCHR/UN Women, "Eliminating virginity testing", 2018).
 */
import type { PaketAraci } from '@/lib/ulke/araclar/tipler'
import { u, type Uc } from './yardimci'

const CERRAHI = ['genel-cerrahi', 'kadin-hastaliklari-dogum', 'ortopedi', 'uroloji', 'kulak-burun-bogaz', 'goz-hastaliklari', 'beyin-cerrahisi', 'kalp-damar-cerrahisi', 'damar-cerrahisi', 'gogus-cerrahisi', 'plastik-cerrahi', 'cocuk-cerrahisi', 'estetik-cerrahi']
const KD = ['kadin-hastaliklari-dogum']

/** The two new fields of the O&G operation note (./rol7.ts): labiaplasty / perineoplasty are medically indicated only there. */
const UZ_KD_NOT_TIBBI: Record<string, Uc> = {
  tibbi_endikasyon: u('Tibbiy koʻrsatma bilan (rekonstruktiv yoki funksional). Kosmetik operatsiya kattalar uchun genital estetik operatsiya bayonnomasida yoziladi.', 'Тиббий кўрсатма билан (реконструктив ёки функсионал). Косметик операция катталар учун генитал эстетик операция баённомасида ёзилади.', 'По медицинским показаниям (реконструктивная или функциональная). Косметическая операция записывается в протоколе генитальной эстетической операции для взрослых.'),
  tibbi_gerekce: u('Tibbiy sabab, oʻz soʻzlaringiz bilan', 'Тиббий сабаб, ўз сўзларингиз билан', 'Медицинская причина, своими словами'),
}


/** Numbered steps, one per line, in each form. */
const adim = (qadamlar: readonly Uc[]): Uc => {
  const bicim = (k: keyof Uc) => qadamlar.map((q, i) => `${i + 1}. ${q[k]}`).join('\n')
  return { 'uz-Latn': bicim('uz-Latn'), 'uz-Cyrl': bicim('uz-Cyrl'), ru: bicim('ru') }
}
/** Two texts one after the other, in each form. */
const qosh = (a: Uc, b: Uc, ayirgich = ' '): Uc => ({ 'uz-Latn': `${a['uz-Latn']}${ayirgich}${b['uz-Latn']}`, 'uz-Cyrl': `${a['uz-Cyrl']}${ayirgich}${b['uz-Cyrl']}`, ru: `${a.ru}${ayirgich}${b.ru}` })

// ───────────────────────── the operation note: words every surgical role shares ─────────────────────────

const NOT_ALANLARI: Record<string, Uc> = {
  tarih: u('Operatsiya sanasi', 'Операция санаси', 'Дата операции'),
  saat: u('Boshlanish va tugash vaqti', 'Бошланиш ва тугаш вақти', 'Время начала и окончания'),
  aciliyet: u('Rejali yoki shoshilinch', 'Режали ёки шошилинч', 'Плановая или экстренная'),
  preop_tani: u('Operatsiyadan oldingi tashxis', 'Операциядан олдинги ташхис', 'Диагноз до операции'),
  postop_tani: u('Operatsiyadan keyingi tashxis', 'Операциядан кейинги ташхис', 'Диагноз после операции'),
  islem: u('Bajarilgan operatsiya', 'Бажарилган операция', 'Выполненная операция'),
  cerrah: u('Operatsiya qilgan jarroh', 'Операция қилган жарроҳ', 'Оперирующий хирург'),
  asistanlar: u('Assistent(lar)', 'Ассистент(лар)', 'Ассистент(ы)'),
  anestezi: u('Anesteziya', 'Анестезия', 'Анестезия'),
  anestezist: u('Anesteziolog', 'Анестезиолог', 'Анестезиолог'),
  endikasyon: u('Koʻrsatma', 'Кўрсатма', 'Показание'),
  bulgular: u('Operatsiya paytidagi topilmalar', 'Операция пайтидаги топилмалар', 'Интраоперационные находки'),
  teknik: u('Texnika va bosqichlar (kesma, qoʻshimcha muolaja va uning sababi)', 'Техника ва босқичлар (кесма, қўшимча муолажа ва унинг сабаби)', 'Техника и этапы (разрез, дополнительное вмешательство и его причина)'),
  patoloji: u('Toʻqima gistologiyaga yuborildi', 'Тўқима гистологияга юборилди', 'Ткань направлена на гистологию'),
  patoloji_materyal: u('Yuborilgan material', 'Юборилган материал', 'Направленный материал'),
  kan_kaybi: u('Taxminiy qon yoʻqotish', 'Тахминий қон йўқотиш', 'Ориентировочная кровопотеря'),
  sivi: u('Suyuqliklar va qon quyish', 'Суюқликлар ва қон қуйиш', 'Инфузия и трансфузия'),
  drenler: u('Drenaj(lar)', 'Дренаж(лар)', 'Дренаж(и)'),
  komplikasyon: u('Asoratlar', 'Асоратлар', 'Осложнения'),
  implantlar: u('Implantlar va materiallar (seriya raqamlari bilan)', 'Имплантлар ва материаллар (серия рақамлари билан)', 'Импланты и материалы (с серийными номерами)'),
  kapanis: u('Yarani yopish', 'Ярани ёпиш', 'Ушивание раны'),
  antibiyotik: u('Antibiotik profilaktikasi', 'Антибиотик профилактикаси', 'Антибиотикопрофилактика'),
  vte: u('Venoz tromboemboliya profilaktikasi', 'Веноз тромбоэмболия профилактикаси', 'Профилактика венозных тромбоэмболий'),
  postop: u('Operatsiyadan keyingi koʻrsatmalar', 'Операциядан кейинги кўрсатмалар', 'Послеоперационные назначения'),
}
const NOT_SECENEKLERI: Record<string, Record<string, Uc>> = {
  aciliyet: { elektif: u('Rejali', 'Режали', 'Плановая'), acil: u('Shoshilinch', 'Шошилинч', 'Экстренная') },
  anestezi: {
    genel: u('Umumiy', 'Умумий', 'Общая'), spinal: u('Spinal', 'Спинал', 'Спинальная'), epidural: u('Epidural', 'Эпидурал', 'Эпидуральная'),
    kombine: u('Kombinatsiyalangan spinal-epidural', 'Комбинацияланган спинал-эпидурал', 'Комбинированная спинально-эпидуральная'),
    rejyonel_blok: u('Regionar blokada', 'Регионар блокада', 'Регионарная блокада'), sedasyon: u('Sedatsiya', 'Седация', 'Седация'), lokal: u('Mahalliy', 'Маҳаллий', 'Местная'),
  },
  patoloji: { gonderildi: u('Yuborildi', 'Юборилди', 'Направлена'), gonderilmedi: u('Yuborilmadi', 'Юборилмади', 'Не направлена') },
}
const NOT_ACIKLAMA = u('Tuzilgan operatsiya bayonnomasi: sana va vaqt, jamoa, anesteziya, tashxislar, topilmalar, bosqichlar, material, qon yoʻqotish, drenajlar, asoratlar, implantlar, yarani yopish va operatsiyadan keyingi koʻrsatmalar. Har bir majburiy band toʻldirilganda toʻliq boʻladi. Blankangizda chop etiladi.', 'Тузилган операция баённомаси: сана ва вақт, жамоа, анестезия, ташхислар, топилмалар, босқичлар, материал, қон йўқотиш, дренажлар, асоратлар, имплантлар, ярани ёпиш ва операциядан кейинги кўрсатмалар. Ҳар бир мажбурий банд тўлдирилганда тўлиқ бўлади. Бланкангизда чоп этилади.', 'Структурированный протокол операции: дата и время, бригада, анестезия, диагнозы, находки, этапы, материал, кровопотеря, дренажи, осложнения, импланты, ушивание и послеоперационные назначения. Протокол полон, когда заполнены все обязательные пункты. Печатается на вашем бланке.')
const NOT_NOTU = u('Bayonnoma jarrohning hujjati. Bemor faylida saqlanadi va oʻzgarmaydi: tuzatish yangi bayonnoma boʻladi.', 'Баённома жарроҳнинг ҳужжати. Бемор файлида сақланади ва ўзгармайди: тузатиш янги баённома бўлади.', 'Протокол — документ хирурга. Хранится в карте пациента и не изменяется: исправление оформляется новым протоколом.')
const OPERATSIYA = u('Operatsiya', 'Операция', 'Операция')

// ───────────────────────── pre-filled standard steps (obstetrics and gynaecology) ─────────────────────────

const LAP: readonly Uc[] = [
  u('Umumiy anesteziya, litotomiya holati; teri ishlovi, choyshab yopish, siydik kateteri.', 'Умумий анестезия, литотомия ҳолати; тери ишлови, чойшаб ёпиш, сийдик катетери.', 'Общая анестезия, литотомическое положение; обработка кожи, отграничение, мочевой катетер.'),
  u('Kerak boʻlsa bachadon manipulyatori qoʻyildi.', 'Керак бўлса бачадон манипулятори қўйилди.', 'При необходимости установлен маточный манипулятор.'),
  u('Kirish: __ (Veress ignasi / ochiq usul / optik troakar) __ sohasida; pnevmoperitoneum hosil qilindi; birinchi port qoʻyildi.', 'Кириш: __ (Вересс игнаси / очиқ усул / оптик троакар) __ соҳасида; пневмоперитонеум ҳосил қилинди; биринчи порт қўйилди.', 'Доступ: __ (игла Вереша / открытый доступ / оптический троакар) в области __; наложен пневмоперитонеум; установлен первый порт.'),
  u('Qoʻshimcha portlar koʻz nazorati ostida: __.', 'Қўшимча портлар кўз назорати остида: __.', 'Дополнительные порты под контролем зрения: __.'),
  u('Qorin va kichik chanoq koʻrigi (qorinning yuqori qismi, jigar yuzasi, appendiks, bachadon, ortiqlar, Duglas boʻshligʻi, qorin parda): topilmalar yuqorida.', 'Қорин ва кичик чаноқ кўриги (қориннинг юқори қисми, жигар юзаси, аппендикс, бачадон, ортиқлар, Дуглас бўшлиғи, қорин парда): топилмалар юқорида.', 'Ревизия брюшной полости и малого таза (верхний этаж, поверхность печени, аппендикс, матка, придатки, дугласово пространство, брюшина): находки выше.'),
]
const LAP_KAPAMA = u('Past bosimda gemostaz tekshirildi; yuvish va soʻrish. Salfetka va asboblar hisobi toʻgʻri. Portlar koʻz nazorati ostida olindi, gaz chiqarildi. 10 mm va undan katta portlar aponevrozi jarroh qaroriga koʻra tikildi; teri __ bilan tikildi.', 'Паст босимда гемостаз текширилди; ювиш ва сўриш. Салфетка ва асбоблар ҳисоби тўғри. Портлар кўз назорати остида олинди, газ чиқарилди. 10 мм ва ундан катта портлар апоневрози жарроҳ қарорига кўра тикилди; тери __ билан тикилди.', 'Гемостаз проверен при низком давлении; промывание и аспирация. Счёт салфеток и инструментов верен. Порты удалены под контролем зрения, газ выпущен. Апоневроз в местах портов 10 мм и более ушит по решению хирурга; кожа ушита __.')
const POSTOP = u('Hayotiy koʻrsatkichlar, ogʻriq va qon ketish kuzatuvi. Erta faollashuv. Ogʻiz orqali ovqatlanish jarroh qaroriga koʻra. Venoz tromboemboliya profilaktikasi xavf baholashiga koʻra. Kateterni olish: __. Chiqarish va kuzatuv: __.', 'Ҳаётий кўрсаткичлар, оғриқ ва қон кетиш кузатуви. Эрта фаоллашув. Оғиз орқали овқатланиш жарроҳ қарорига кўра. Веноз тромбоэмболия профилактикаси хавф баҳолашига кўра. Катетерни олиш: __. Чиқариш ва кузатув: __.', 'Контроль показателей, боли и кровотечения. Ранняя активизация. Питание через рот по решению хирурга. Профилактика венозных тромбоэмболий по оценке риска. Удаление катетера: __. Выписка и наблюдение: __.')
const ORTA = (b: Uc) => qosh(POSTOP, b)

const SABLONLAR: Record<string, Record<string, Uc>> = {
  sezaryen: {
    teknik: adim([
      u('Chap yonga qiyalatilgan chalqancha holat; teri ishlovi, choyshab yopish, siydik kateteri.', 'Чап ёнга қиялатилган чалқанча ҳолат; тери ишлови, чойшаб ёпиш, сийдик катетери.', 'Положение на спине с наклоном влево; обработка кожи, отграничение, мочевой катетер.'),
      u('Profilaktik antibiotik teri kesilishidan oldin berildi (vosita va vaqt quyida).', 'Профилактик антибиотик тери кесилишидан олдин берилди (восита ва вақт қуйида).', 'Профилактический антибиотик введён до разреза кожи (препарат и время ниже).'),
      u('Teri kesmasi: __ (Pfannenstil / Joel-Kohen).', 'Тери кесмаси: __ (Пфанненстил / Жоэл-Коҳен).', 'Разрез кожи: __ (по Пфанненштилю / по Джоэл-Кохену).'),
      u('Aponevroz ochildi, toʻgʻri mushaklar ajratildi, qorin parda ochildi.', 'Апоневроз очилди, тўғри мушаклар ажратилди, қорин парда очилди.', 'Вскрыт апоневроз, разведены прямые мышцы, вскрыта брюшина.'),
      u('Kerak boʻlsa siydik pufagi pastga surildi.', 'Керак бўлса сийдик пуфаги пастга сурилди.', 'При необходимости мочевой пузырь отведён книзу.'),
      u('Bachadon pastki segmentida koʻndalang kesma, toʻmtoq kengaytirildi.', 'Бачадон пастки сегментида кўндаланг кесма, тўмтоқ кенгайтирилди.', 'Поперечный разрез в нижнем сегменте матки, тупое расширение.'),
      u('Chaqaloq __ (yotish) holatida __ (vaqt) da olindi; jinsi __, vazni __ g, Apgar __ / __. Kindikni qisish: __.', 'Чақалоқ __ (ётиш) ҳолатида __ (вақт) да олинди; жинси __, вазни __ г, Апгар __ / __. Киндикни қисиш: __.', 'Ребёнок извлечён в __ (предлежание) в __ (время); пол __, масса __ г, Апгар __ / __. Пережатие пуповины: __.'),
      u('Yoʻldosh kindikdan nazoratli tortish bilan olindi va butunligi tekshirildi; boʻshliq tekshirildi.', 'Йўлдош киндикдан назоратли тортиш билан олинди ва бутунлиги текширилди; бўшлиқ текширилди.', 'Послед выделен контролируемой тракцией за пуповину, проверена целостность; полость матки проверена.'),
      u('Uterotonik: shifokor yozadi (vosita va doza vosita tomonidan yozilmaydi).', 'Утеротоник: шифокор ёзади (восита ва доза восита томонидан ёзилмайди).', 'Утеротоник: записывает врач (препарат и дозу инструмент не пишет).'),
      u('Bachadon kesmasi __ qavat bilan tikildi; gemostaz tekshirildi.', 'Бачадон кесмаси __ қават билан тикилди; гемостаз текширилди.', 'Разрез на матке ушит в __ ряд(а); гемостаз проверен.'),
      u('Ortiqlar koʻrildi: __.', 'Ортиқлар кўрилди: __.', 'Придатки осмотрены: __.'),
      u('Salfetka va asboblar hisobi toʻgʻri.', 'Салфетка ва асбоблар ҳисоби тўғри.', 'Счёт салфеток и инструментов верен.'),
    ]),
    kapanis: u('Aponevroz __ bilan tikildi; teri osti qavati __; teri __ bilan tikildi.', 'Апоневроз __ билан тикилди; тери ости қавати __; тери __ билан тикилди.', 'Апоневроз ушит __; подкожная клетчатка __; кожа ушита __.'),
    postop: u('Hayotiy koʻrsatkichlar, bachadon tonusi va qindan qon ketish kuzatuvi. Erta emizish va teri-teriga aloqani qoʻllab-quvvatlash. Erta faollashuv. Venoz tromboemboliya profilaktikasi xavf baholashiga koʻra. Kateterni olish: __. Tugʻruqdan keyingi parvarish va chiqarish: __.', 'Ҳаётий кўрсаткичлар, бачадон тонуси ва қиндан қон кетиш кузатуви. Эрта эмизиш ва тери-терига алоқани қўллаб-қувватлаш. Эрта фаоллашув. Веноз тромбоэмболия профилактикаси хавф баҳолашига кўра. Катетерни олиш: __. Туғруқдан кейинги парвариш ва чиқариш: __.', 'Контроль показателей, тонуса матки и влагалищных выделений. Поддержка раннего грудного вскармливания и контакта «кожа к коже». Ранняя активизация. Профилактика венозных тромбоэмболий по оценке риска. Удаление катетера: __. Послеродовый уход и выписка: __.'),
  },
  vakum_aspirasyon: {
    endikasyon: u('__ (rivojlanmayotgan homiladorlik / toʻliq boʻlmagan homila tushishi / qonun ruxsat bergan muddatda homiladorlikni toʻxtatish). Muddat UTT bilan tasdiqlangan: __. Rozilik yozilgan.', '__ (ривожланмаётган ҳомиладорлик / тўлиқ бўлмаган ҳомила тушиши / қонун рухсат берган муддатда ҳомиладорликни тўхтатиш). Муддат УТТ билан тасдиқланган: __. Розилик ёзилган.', '__ (неразвивающаяся беременность / неполный выкидыш / прерывание беременности в разрешённый законом срок). Срок подтверждён УЗИ: __. Согласие оформлено.'),
    teknik: adim([
      u('Litotomiya holati; teri ishlovi va choyshab yopish.', 'Литотомия ҳолати; тери ишлови ва чойшаб ёпиш.', 'Литотомическое положение; обработка и отграничение.'),
      u('Ikki qoʻllab tekshiruv: bachadon kattaligi va holati __.', 'Икки қўллаб текширув: бачадон катталиги ва ҳолати __.', 'Бимануальное исследование: размер и положение матки __.'),
      u('Koʻzgu; boʻyin oʻq qisqich bilan ushlandi.', 'Кўзгу; бўйин ўқ қисқич билан ушланди.', 'Зеркала; шейка взята на пулевые щипцы.'),
      u('Boʻyinni tayyorlash / kengaytirish: __ (shifokor qaroriga koʻra).', 'Бўйинни тайёрлаш / кенгайтириш: __ (шифокор қарорига кўра).', 'Подготовка / расширение шейки: __ (по решению врача).'),
      u('Mos oʻlchamdagi kanyula bilan vakuum-aspiratsiya: __ (qoʻl / elektr).', 'Мос ўлчамдаги канюла билан вакуум-аспирация: __ (қўл / электр).', 'Вакуум-аспирация канюлей подходящего размера: __ (мануальная / электрическая).'),
      u('Boʻshliq boʻshaganligi tasdiqlandi (gʻijirlash hissi, bachadon qisqarishi).', 'Бўшлиқ бўшаганлиги тасдиқланди (ғижирлаш ҳисси, бачадон қисқариши).', 'Опорожнение полости подтверждено (ощущение хруста, сокращение матки).'),
      u('Aspirat koʻrildi: homila toʻqimasi __ (koʻrindi / koʻrinmadi).', 'Аспират кўрилди: ҳомила тўқимаси __ (кўринди / кўринмади).', 'Аспират осмотрен: плодные ткани __ (видны / не видны).'),
      u('Qon ketish tekshirildi; asboblar olindi.', 'Қон кетиш текширилди; асбоблар олинди.', 'Кровотечение проверено; инструменты извлечены.'),
    ]),
    kapanis: u('Qon ketish tekshirilgach muolaja tugatildi.', 'Қон кетиш текширилгач муолажа тугатилди.', 'Процедура завершена после контроля кровотечения.'),
    postop: u('Hayotiy koʻrsatkichlar va qon ketish kuzatuvi. Rh-manfiy boʻlsa anti-D, shifokor qaroriga koʻra. Kontratseptsiya muhokama qilindi (darhol boshlash mumkin boʻlgan usullar). Kuzatuv: __. Isitma, kuchli ogʻriq, koʻp qon ketish yoki yoqimsiz hidli ajralma boʻlsa qaytish aytildi.', 'Ҳаётий кўрсаткичлар ва қон кетиш кузатуви. Рҳ-манфий бўлса анти-D, шифокор қарорига кўра. Контратсепция муҳокама қилинди (дарҳол бошлаш мумкин бўлган усуллар). Кузатув: __. Иситма, кучли оғриқ, кўп қон кетиш ёки ёқимсиз ҳидли ажралма бўлса қайтиш айтилди.', 'Контроль показателей и кровотечения. Анти-D при резус-отрицательной крови по решению врача. Обсуждена контрацепция (методы, которые можно начать сразу). Наблюдение: __. Сказано вернуться при лихорадке, сильной боли, обильном кровотечении или выделениях с неприятным запахом.'),
  },
  tlh: {
    teknik: adim([
      ...LAP,
      u('Ikkala siydik yoʻli chanoq boʻylab aniqlandi.', 'Иккала сийдик йўли чаноқ бўйлаб аниқланди.', 'Оба мочеточника идентифицированы на протяжении в малом тазу.'),
      u('Yumaloq boylamlar koagulyatsiya qilinib kesildi; keng boylam ochildi.', 'Юмалоқ бойламлар коагуляция қилиниб кесилди; кенг бойлам очилди.', 'Круглые связки коагулированы и пересечены; вскрыта широкая связка.'),
      u('Ortiqlar: __ (tuxumdonlar saqlandi: xususiy boylam va naycha / salpingo-ooforektomiya: voronka-chanoq boylami) koagulyatsiya qilinib kesildi.', 'Ортиқлар: __ (тухумдонлар сақланди: хусусий бойлам ва найча / салпинго-оофоректомия: воронка-чаноқ бойлами) коагуляция қилиниб кесилди.', 'Придатки: __ (яичники сохранены: собственная связка и труба / сальпингоофорэктомия: воронкотазовая связка) коагулированы и пересечены.'),
      u('Pufak-bachadon burmasi ochildi, siydik pufagi boʻyin va qindan pastga ajratildi.', 'Пуфак-бачадон бурмаси очилди, сийдик пуфаги бўйин ва қиндан пастга ажратилди.', 'Вскрыта пузырно-маточная складка, мочевой пузырь отсепарован от шейки и влагалища.'),
      u('Bachadon tomirlari ajratildi, koagulyatsiya qilinib kesildi.', 'Бачадон томирлари ажратилди, коагуляция қилиниб кесилди.', 'Маточные сосуды выделены, коагулированы и пересечены.'),
      u('Manipulyator kosachasi ustida kolpotomiya; bachadon qin orqali olindi (morsellyatsiya: __ qilinmadi / yopiq).', 'Манипулятор косачаси устида колпотомия; бачадон қин орқали олинди (морселляция: __ қилинмади / ёпиқ).', 'Кольпотомия над чашкой манипулятора; матка извлечена через влагалище (морцелляция: __ не выполнялась / в контейнере).'),
      u('Qin gumbazi __ tikildi (laparoskopik / qin orqali); dumgʻaza-bachadon boylamlari bilan tayanch: __.', 'Қин гумбази __ тикилди (лапароскопик / қин орқали); думғаза-бачадон бойламлари билан таянч: __.', 'Купол влагалища ушит __ (лапароскопически / вагинально); фиксация к крестцово-маточным связкам: __.'),
      u('Sistoskopiya: __ (qilindi / qilinmadi).', 'Цистоскопия: __ (қилинди / қилинмади).', 'Цистоскопия: __ (выполнена / не выполнена).'),
    ]),
    kapanis: LAP_KAPAMA,
    postop: ORTA(u('Jinsiy aloqa va ogʻir koʻtarish cheklovlari: jarroh qaroriga koʻra.', 'Жинсий алоқа ва оғир кўтариш чекловлари: жарроҳ қарорига кўра.', 'Ограничения половой жизни и подъёма тяжестей: по решению хирурга.')),
  },
  tah: {
    teknik: adim([
      u('Umumiy yoki regionar anesteziya, chalqancha; teri ishlovi, choyshab yopish, siydik kateteri.', 'Умумий ёки регионар анестезия, чалқанча; тери ишлови, чойшаб ёпиш, сийдик катетери.', 'Общая или регионарная анестезия, на спине; обработка кожи, отграничение, мочевой катетер.'),
      u('Teri kesmasi: __ (Pfannenstil / pastki oʻrta chiziq).', 'Тери кесмаси: __ (Пфанненстил / пастки ўрта чизиқ).', 'Разрез кожи: __ (по Пфанненштилю / нижнесрединный).'),
      u('Aponevroz ochildi, toʻgʻri mushaklar ajratildi, qorin parda ochildi; ranorasshiritel qoʻyildi, ichaklar salfetka bilan chetlatildi.', 'Апоневроз очилди, тўғри мушаклар ажратилди, қорин парда очилди; ранорасширител қўйилди, ичаклар салфетка билан четлатилди.', 'Вскрыт апоневроз, разведены прямые мышцы, вскрыта брюшина; установлен ранорасширитель, кишечник отграничен салфетками.'),
      u('Qorin va kichik chanoq koʻrigi: topilmalar yuqorida.', 'Қорин ва кичик чаноқ кўриги: топилмалар юқорида.', 'Ревизия брюшной полости и малого таза: находки выше.'),
      u('Yumaloq boylamlar qisilib, kesilib, bogʻlandi; keng boylam ochildi.', 'Юмалоқ бойламлар қисилиб, кесилиб, боғланди; кенг бойлам очилди.', 'Круглые связки зажаты, пересечены и перевязаны; вскрыта широкая связка.'),
      u('Ortiqlar oyoqchalari __ (xususiy boylam / voronka-chanoq boylami) qisilib, kesilib, ikki marta bogʻlandi.', 'Ортиқлар оёқчалари __ (хусусий бойлам / воронка-чаноқ бойлами) қисилиб, кесилиб, икки марта боғланди.', 'Ножки придатков __ (собственная связка / воронкотазовая связка) зажаты, пересечены и дважды перевязаны.'),
      u('Siydik pufagi pastga surildi; siydik yoʻllari yoʻnalishi himoya qilindi.', 'Сийдик пуфаги пастга сурилди; сийдик йўллари йўналиши ҳимоя қилинди.', 'Мочевой пузырь отведён книзу; ход мочеточников защищён.'),
      u('Bachadon tomirlari ajratildi, qisilib, kesilib, bogʻlandi.', 'Бачадон томирлари ажратилди, қисилиб, кесилиб, боғланди.', 'Маточные сосуды выделены, зажаты, пересечены и перевязаны.'),
      u('Kardinal va dumgʻaza-bachadon boylamlari qisilib, kesilib, bogʻlandi.', 'Кардинал ва думғаза-бачадон бойламлари қисилиб, кесилиб, боғланди.', 'Кардинальные и крестцово-маточные связки зажаты, пересечены и перевязаны.'),
      u('Qin ochildi, bachadon boʻyni bilan olindi; gumbaz __ bilan tikildi, burchaklari dumgʻaza-bachadon boylamlariga mahkamlandi.', 'Қин очилди, бачадон бўйни билан олинди; гумбаз __ билан тикилди, бурчаклари думғаза-бачадон бойламларига маҳкамланди.', 'Вскрыто влагалище, матка удалена с шейкой; купол ушит __, углы фиксированы к крестцово-маточным связкам.'),
      u('Gemostaz tekshirildi; yuvish. Salfetka va asboblar hisobi toʻgʻri.', 'Гемостаз текширилди; ювиш. Салфетка ва асбоблар ҳисоби тўғри.', 'Гемостаз проверен; санация. Счёт салфеток и инструментов верен.'),
    ]),
    kapanis: u('Qorin parda __; aponevroz __ bilan tikildi; teri osti qavati __; teri __ bilan tikildi.', 'Қорин парда __; апоневроз __ билан тикилди; тери ости қавати __; тери __ билан тикилди.', 'Брюшина __; апоневроз ушит __; подкожная клетчатка __; кожа ушита __.'),
    postop: POSTOP,
  },
  vajinal_histerektomi: {
    teknik: adim([
      u('Regionar yoki umumiy anesteziya, litotomiya; teri ishlovi, choyshab yopish, siydik kateteri.', 'Регионар ёки умумий анестезия, литотомия; тери ишлови, чойшаб ёпиш, сийдик катетери.', 'Регионарная или общая анестезия, литотомическое положение; обработка, отграничение, мочевой катетер.'),
      u('Boʻyin ushlandi; boʻyin-qin chegarasida aylana kesma.', 'Бўйин ушланди; бўйин-қин чегарасида айлана кесма.', 'Шейка взята на щипцы; циркулярный разрез на границе шейки и влагалища.'),
      u('Orqa kolpotomiya Duglas boʻshligʻiga, oldingi kolpotomiya pufak-bachadon boʻshligʻiga; siydik pufagi yuqoriga surildi.', 'Орқа колпотомия Дуглас бўшлиғига, олдинги колпотомия пуфак-бачадон бўшлиғига; сийдик пуфаги юқорига сурилди.', 'Задняя кольпотомия в дугласово пространство, передняя — в пузырно-маточное; мочевой пузырь отведён.'),
      u('Dumgʻaza-bachadon va kardinal boylamlar qisilib, kesilib, bogʻlandi (dumgʻaza-bachadon boylamlari belgilandi).', 'Думғаза-бачадон ва кардинал бойламлар қисилиб, кесилиб, боғланди (думғаза-бачадон бойламлари белгиланди).', 'Крестцово-маточные и кардинальные связки зажаты, пересечены и перевязаны (крестцово-маточные взяты на держалки).'),
      u('Bachadon tomirlari qisilib, kesilib, bogʻlandi.', 'Бачадон томирлари қисилиб, кесилиб, боғланди.', 'Маточные сосуды зажаты, пересечены и перевязаны.'),
      u('Bachadon tubi chiqarildi; xususiy boylamlar qisilib, kesilib, ikki marta bogʻlandi. Ortiqlar: __.', 'Бачадон туби чиқарилди; хусусий бойламлар қисилиб, кесилиб, икки марта боғланди. Ортиқлар: __.', 'Дно матки выведено; собственные связки зажаты, пересечены и дважды перевязаны. Придатки: __.'),
      u('Gemostaz tekshirildi; qorin parda __.', 'Гемостаз текширилди; қорин парда __.', 'Гемостаз проверен; брюшина __.'),
      u('Gumbaz tayanchi: dumgʻaza-bachadon boylamlari gumbazga tikildi (Makkol usuli / __).', 'Гумбаз таянчи: думғаза-бачадон бойламлари гумбазга тикилди (Маккол усули / __).', 'Фиксация купола: крестцово-маточные связки подшиты к куполу (по Мак-Коллу / __).'),
      u('Qin gumbazi __ bilan tikildi.', 'Қин гумбази __ билан тикилди.', 'Купол влагалища ушит __.'),
    ]),
    kapanis: u('Qin gumbazi tikildi; qin tamponi: __ (qoʻyildi, __ da olinadi / qoʻyilmadi).', 'Қин гумбази тикилди; қин тампони: __ (қўйилди, __ да олинади / қўйилмади).', 'Купол влагалища ушит; влагалищный тампон: __ (введён, удалить в __ / не вводился).'),
    postop: POSTOP,
  },
  lap_myomektomi: {
    teknik: adim([
      ...LAP,
      u('Mioma(lar): soni __, joylashuvi __ (FIGO turi __), oʻlchami __.', 'Миома(лар): сони __, жойлашуви __ (FIGO тури __), ўлчами __.', 'Миома(ы): количество __, локализация __ (тип по FIGO __), размер __.'),
      u('Vazokonstriktor infiltratsiyasi: __ (jarroh qaroriga koʻra).', 'Вазоконстриктор инфильтрацияси: __ (жарроҳ қарорига кўра).', 'Инфильтрация вазоконстриктором: __ (по решению хирурга).'),
      u('Seroz kesma; mioma kapsulasi boʻylab enukleatsiya qilindi.', 'Сероз кесма; миома капсуласи бўйлаб энуклеация қилинди.', 'Разрез серозы; узел энуклеирован по капсуле.'),
      u('Boʻshliqqa kirildi: __ (ha / yoʻq).', 'Бўшлиққа кирилди: __ (ҳа / йўқ).', 'Вскрытие полости: __ (да / нет).'),
      u('Miometriy __ qavat bilan, oʻlik boʻshliq qoldirmasdan tikildi.', 'Миометрий __ қават билан, ўлик бўшлиқ қолдирмасдан тикилди.', 'Миометрий ушит в __ ряд(а) без «мёртвого» пространства.'),
      u('Miomani olib chiqish: __ (yopiq morsellyatsiya / mini-laparotomiya / kolpotomiya).', 'Миомани олиб чиқиш: __ (ёпиқ морселляция / мини-лапаротомия / колпотомия).', 'Извлечение узла(ов): __ (морцелляция в контейнере / минилапаротомия / кольпотомия).'),
      u('Bitishmaga qarshi vosita: __.', 'Битишмага қарши восита: __.', 'Противоспаечный барьер: __.'),
    ]),
    kapanis: LAP_KAPAMA,
    postop: ORTA(u('Kelgusi tugʻruq usuli va homiladorlikkacha oraliq boʻyicha maslahat: jarroh qaroriga koʻra (boʻshliqqa kirish yuqorida yozilgan).', 'Келгуси туғруқ усули ва ҳомиладорликкача оралиқ бўйича маслаҳат: жарроҳ қарорига кўра (бўшлиққа кириш юқорида ёзилган).', 'Рекомендации о способе будущих родов и интервале до беременности: по решению хирурга (вскрытие полости указано выше).')),
  },
  abdominal_myomektomi: {
    teknik: adim([
      u('Umumiy yoki regionar anesteziya, chalqancha; teri ishlovi, choyshab yopish, siydik kateteri.', 'Умумий ёки регионар анестезия, чалқанча; тери ишлови, чойшаб ёпиш, сийдик катетери.', 'Общая или регионарная анестезия, на спине; обработка, отграничение, мочевой катетер.'),
      u('Teri kesmasi: __; aponevroz va qorin parda ochildi.', 'Тери кесмаси: __; апоневроз ва қорин парда очилди.', 'Разрез кожи: __; вскрыты апоневроз и брюшина.'),
      u('Mioma(lar): soni __, joylashuvi __ (FIGO turi __), oʻlchami __.', 'Миома(лар): сони __, жойлашуви __ (FIGO тури __), ўлчами __.', 'Миома(ы): количество __, локализация __ (тип по FIGO __), размер __.'),
      u('Qon yoʻqotishni kamaytirish: __ (vazokonstriktor / turniket, jarroh qaroriga koʻra).', 'Қон йўқотишни камайтириш: __ (вазоконстриктор / турникет, жарроҳ қарорига кўра).', 'Снижение кровопотери: __ (вазоконстриктор / жгут, по решению хирурга).'),
      u('Seroz kesma; mioma(lar) kapsula boʻylab enukleatsiya qilindi.', 'Сероз кесма; миома(лар) капсула бўйлаб энуклеация қилинди.', 'Разрез серозы; узел(ы) энуклеирован(ы) по капсуле.'),
      u('Boʻshliqqa kirildi: __ (ha / yoʻq).', 'Бўшлиққа кирилди: __ (ҳа / йўқ).', 'Вскрытие полости: __ (да / нет).'),
      u('Miometriy __ qavat bilan tikildi; seroz qavat tikildi.', 'Миометрий __ қават билан тикилди; сероз қават тикилди.', 'Миометрий ушит в __ ряд(а); ушита сероза.'),
      u('Bitishmaga qarshi vosita: __. Gemostaz tekshirildi; hisob toʻgʻri.', 'Битишмага қарши восита: __. Гемостаз текширилди; ҳисоб тўғри.', 'Противоспаечный барьер: __. Гемостаз проверен; счёт верен.'),
    ]),
    kapanis: u('Qorin parda __; aponevroz __; teri osti qavati __; teri __ bilan tikildi.', 'Қорин парда __; апоневроз __; тери ости қавати __; тери __ билан тикилди.', 'Брюшина __; апоневроз __; подкожная клетчатка __; кожа ушита __.'),
    postop: ORTA(u('Kelgusi tugʻruq usuli va homiladorlikkacha oraliq boʻyicha maslahat: jarroh qaroriga koʻra.', 'Келгуси туғруқ усули ва ҳомиладорликкача оралиқ бўйича маслаҳат: жарроҳ қарорига кўра.', 'Рекомендации о способе будущих родов и интервале до беременности: по решению хирурга.')),
  },
  tanisal_laparoskopi: {
    teknik: adim([
      ...LAP,
      u('Boʻyoq bilan sinov (xromogidrotubatsiya): __ (oʻng __ / chap __; qilinmadi).', 'Бўёқ билан синов (хромогидротубация): __ (ўнг __ / чап __; қилинмади).', 'Хромогидротубация: __ (справа __ / слева __; не выполнялась).'),
      u('Biopsiya: __.', 'Биопсия: __.', 'Биопсия: __.'),
    ]),
    kapanis: LAP_KAPAMA,
    postop: POSTOP,
  },
  lap_over_kistektomi: {
    teknik: adim([
      ...LAP,
      u('Kista: tomoni __, oʻlchami __, koʻrinishi __ (silliq yuza, soʻrgʻichsimon oʻsimtalarsiz, assitsiz; jarroh tasdiqlaydi). Qorin boʻshligʻidan yuvindi: __.', 'Киста: томони __, ўлчами __, кўриниши __ (силлиқ юза, сўрғичсимон ўсимталарсиз, асситсиз; жарроҳ тасдиқлайди). Қорин бўшлиғидан ювинди: __.', 'Киста: сторона __, размер __, вид __ (гладкая поверхность, без папиллярных разрастаний, без асцита; подтверждает хирург). Смывы из брюшной полости: __.'),
      u('Tuxumdon poʻstlogʻida kesma; kista devori sogʻlom toʻqimadan ajratildi (yorilish: __).', 'Тухумдон пўстлоғида кесма; киста девори соғлом тўқимадан ажратилди (ёрилиш: __).', 'Разрез коркового слоя яичника; стенка кисты вылущена из здоровой ткани (разрыв: __).'),
      u('Kista endoskopik qopchada olindi.', 'Киста эндоскопик қопчада олинди.', 'Киста удалена в эндоскопическом контейнере.'),
      u('Tuxumdon toʻshagi gemostazi: __ (chok / gemostatik vosita; tuxumdonni asrash uchun bipolyar energiya eng kam).', 'Тухумдон тўшаги гемостази: __ (чок / гемостатик восита; тухумдонни асраш учун биполяр энергия энг кам).', 'Гемостаз ложа: __ (шов / гемостатическое средство; биполярная энергия минимально для сохранения яичника).'),
    ]),
    kapanis: LAP_KAPAMA,
    postop: ORTA(u('Gistologiya bilan qayta koʻrik: __.', 'Гистология билан қайта кўрик: __.', 'Повторный приём с гистологией: __.')),
  },
  lap_endometriozis: {
    teknik: adim([
      ...LAP,
      u('Endometrioz xaritasi: qorin parda __, tuxumdonlar __, dumgʻaza-bachadon boylamlari __, Duglas boʻshligʻi __, ichak / siydik pufagi __. Bosqich (rASRM / #Enzian): __.', 'Эндометриоз харитаси: қорин парда __, тухумдонлар __, думғаза-бачадон бойламлари __, Дуглас бўшлиғи __, ичак / сийдик пуфаги __. Босқич (rASRM / #Enzian): __.', 'Карта эндометриоза: брюшина __, яичники __, крестцово-маточные связки __, дугласово пространство __, кишка / мочевой пузырь __. Стадия (rASRM / #Enzian): __.'),
      u('Siydik yoʻllari aniqlandi; kerak joyda retroperitoneum ochildi.', 'Сийдик йўллари аниқланди; керак жойда ретроперитонеум очилди.', 'Мочеточники идентифицированы; при необходимости вскрыто забрюшинное пространство.'),
      u('Oʻchoqlar __ (kesib olindi / ablatsiya qilindi).', 'Ўчоқлар __ (кесиб олинди / аблация қилинди).', 'Очаги __ (иссечены / аблированы).'),
      u('Endometrioma: __ (kistektomiya, qopchada olindi).', 'Эндометриома: __ (кистектомия, қопчада олинди).', 'Эндометриома: __ (цистэктомия, удалена в контейнере).'),
      u('Bitishmalarni ajratish: __.', 'Битишмаларни ажратиш: __.', 'Адгезиолизис: __.'),
    ]),
    kapanis: LAP_KAPAMA,
    postop: ORTA(u('Operatsiyadan keyingi gormonal davo: shifokor qaroriga koʻra.', 'Операциядан кейинги гормонал даво: шифокор қарорига кўра.', 'Послеоперационная гормональная терапия: по решению врача.')),
  },
  histeroskopi: {
    teknik: adim([
      u('Anesteziya __; litotomiya holati; teri ishlovi, choyshab yopish.', 'Анестезия __; литотомия ҳолати; тери ишлови, чойшаб ёпиш.', 'Анестезия __; литотомическое положение; обработка, отграничение.'),
      u('Kerak boʻlsa boʻyin kengaytirildi; gisteroskop koʻz nazorati ostida kiritildi.', 'Керак бўлса бўйин кенгайтирилди; гистероскоп кўз назорати остида киритилди.', 'При необходимости расширен цервикальный канал; гистероскоп введён под контролем зрения.'),
      u('Kengaytiruvchi muhit: __; suyuqlik farqi nazorat qilindi (yozildi: __).', 'Кенгайтирувчи муҳит: __; суюқлик фарқи назорат қилинди (ёзилди: __).', 'Среда расширения: __; контроль дефицита жидкости (записано: __).'),
      u('Boʻshliq: shakli __, endometriy __, naycha teshiklari __ (oʻng / chap koʻrindi).', 'Бўшлиқ: шакли __, эндометрий __, найча тешиклари __ (ўнг / чап кўринди).', 'Полость: форма __, эндометрий __, устья труб __ (правое / левое видны).'),
      u('Operativ muolaja: __ (asbob: __).', 'Оператив муолажа: __ (асбоб: __).', 'Оперативный этап: __ (инструмент: __).'),
    ]),
    kapanis: u('Boʻshliq yakuniy koʻrildi; asboblar olindi; qon ketish tekshirildi.', 'Бўшлиқ якуний кўрилди; асбоблар олинди; қон кетиш текширилди.', 'Финальный осмотр полости; инструменты извлечены; кровотечение проверено.'),
    postop: u('Hayotiy koʻrsatkichlar va qon ketish kuzatuvi. Ogʻriqsizlantirish. Gistologiya bilan qayta koʻrik: __.', 'Ҳаётий кўрсаткичлар ва қон кетиш кузатуви. Оғриқсизлантириш. Гистология билан қайта кўрик: __.', 'Контроль показателей и кровотечения. Обезболивание. Повторный приём с гистологией: __.'),
  },
  dc_kuretaj: {
    teknik: adim([
      u('Anesteziya __; litotomiya holati; teri ishlovi, choyshab yopish.', 'Анестезия __; литотомия ҳолати; тери ишлови, чойшаб ёпиш.', 'Анестезия __; литотомическое положение; обработка, отграничение.'),
      u('Ikki qoʻllab tekshiruv: bachadon kattaligi va holati __.', 'Икки қўллаб текширув: бачадон катталиги ва ҳолати __.', 'Бимануальное исследование: размер и положение матки __.'),
      u('Koʻzgu, oʻq qisqich; bachadon zondlandi: __.', 'Кўзгу, ўқ қисқич; бачадон зондланди: __.', 'Зеркала, пулевые щипцы; зондирование матки: __.'),
      u('Alohida qirishda: avval servikal kanal qirildi va alohida yuborildi.', 'Алоҳида қиришда: аввал сервикал канал қирилди ва алоҳида юборилди.', 'При раздельном выскабливании: сначала цервикальный канал, материал отдельно.'),
      u('Boʻyin __ gacha kengaytirildi.', 'Бўйин __ гача кенгайтирилди.', 'Шейка расширена до __.'),
      u('Bachadon boʻshligʻi tizimli qirildi.', 'Бачадон бўшлиғи тизимли қирилди.', 'Систематическое выскабливание полости матки.'),
    ]),
    kapanis: u('Qon ketish tekshirilgach asboblar olindi.', 'Қон кетиш текширилгач асбоблар олинди.', 'Инструменты извлечены после контроля кровотечения.'),
    postop: u('Hayotiy koʻrsatkichlar va qon ketish kuzatuvi. Gistologiya bilan qayta koʻrik: __.', 'Ҳаётий кўрсаткичлар ва қон кетиш кузатуви. Гистология билан қайта кўрик: __.', 'Контроль показателей и кровотечения. Повторный приём с гистологией: __.'),
  },
  kolposkopi_leep: {
    endikasyon: u('__ (sitologiya / VPCh natijasi va sanasi).', '__ (ситология / ВПЧ натижаси ва санаси).', '__ (результат цитологии / ВПЧ и дата).'),
    teknik: adim([
      u('Litotomiya holati; koʻzgu.', 'Литотомия ҳолати; кўзгу.', 'Литотомическое положение; зеркала.'),
      u('Sirka kislotasi surtildi; yassi-silindrsimon chegara __ (toʻliq / qisman / koʻrinmadi), transformatsiya zonasi turi __.', 'Сирка кислотаси суртилди; ясси-силиндрсимон чегара __ (тўлиқ / қисман / кўринмади), трансформация зонаси тури __.', 'Нанесена уксусная кислота; зона стыка __ (видна полностью / частично / не видна), тип зоны трансформации __.'),
      u('Yod: __.', 'Ёд: __.', 'Проба с йодом: __.'),
      u('Topilmalar (IFCPC atamalari): __.', 'Топилмалар (IFCPC атамалари): __.', 'Находки (терминология IFCPC): __.'),
      u('Biopsiya: __ (soat __ da) / servikal kanal qirindisi: __.', 'Биопсия: __ (соат __ да) / сервикал канал қириндиси: __.', 'Биопсия: __ (на __ часах) / выскабливание цервикального канала: __.'),
      u('Halqasimon eksiziya: mahalliy anesteziya; mos oʻlchamdagi halqa bilan bir / __ boʻlakda kesildi; chuqurligi __; chegaralar belgilandi.', 'Ҳалқасимон эксизия: маҳаллий анестезия; мос ўлчамдаги ҳалқа билан бир / __ бўлакда кесилди; чуқурлиги __; чегаралар белгиланди.', 'Петлевая эксцизия: местная анестезия; иссечение петлёй подходящего размера одним / __ фрагментом(ами); глубина __; края маркированы.'),
      u('Gemostaz: __.', 'Гемостаз: __.', 'Гемостаз: __.'),
    ]),
    kapanis: u('Qon ketish tekshirildi.', 'Қон кетиш текширилди.', 'Кровотечение проверено.'),
    postop: u('Qon ketish va ajralma haqida aytildi. Jinsiy aloqa va tampon cheklovlari: shifokor qaroriga koʻra. Gistologiya bilan qayta koʻrik: __.', 'Қон кетиш ва ажралма ҳақида айтилди. Жинсий алоқа ва тампон чекловлари: шифокор қарорига кўра. Гистология билан қайта кўрик: __.', 'Рассказано о кровянистых выделениях. Ограничения половой жизни и тампонов: по решению врача. Повторный приём с гистологией: __.'),
  },
  ria: {
    endikasyon: u('Kontratseptsiya ± __. Tibbiy muvofiqlik (WHO MEC) baholandi: __. Homiladorlik istisno qilindi: __.', 'Контратсепция ± __. Тиббий мувофиқлик (WHO MEC) баҳоланди: __. Ҳомиладорлик истисно қилинди: __.', 'Контрацепция ± __. Медицинская приемлемость (WHO MEC) оценена: __. Беременность исключена: __.'),
    teknik: adim([
      u('Rozilik yozilgan.', 'Розилик ёзилган.', 'Согласие оформлено.'),
      u('Ikki qoʻllab tekshiruv: bachadon holati __.', 'Икки қўллаб текширув: бачадон ҳолати __.', 'Бимануальное исследование: положение матки __.'),
      u('Koʻzgu; boʻyin tozalandi; oʻq qisqich.', 'Кўзгу; бўйин тозаланди; ўқ қисқич.', 'Зеркала; обработка шейки; пулевые щипцы.'),
      u('Bachadon zondlandi: __ sm.', 'Бачадон зондланди: __ см.', 'Зондирование матки: __ см.'),
      u('Vosita ishlab chiqaruvchi koʻrsatmasiga koʻra bachadon tubiga qoʻyildi.', 'Восита ишлаб чиқарувчи кўрсатмасига кўра бачадон тубига қўйилди.', 'Средство введено к дну матки по инструкции производителя.'),
      u('Iplar __ sm qoldirib kesildi.', 'Иплар __ см қолдириб кесилди.', 'Нити обрезаны, оставлено __ см.'),
      u('Holati tekshirildi: __ (UTT / klinik).', 'Ҳолати текширилди: __ (УТТ / клиник).', 'Положение проверено: __ (УЗИ / клинически).'),
    ]),
    kapanis: u('Asboblar olindi; qon ketish tekshirildi.', 'Асбоблар олинди; қон кетиш текширилди.', 'Инструменты извлечены; кровотечение проверено.'),
    postop: u('Iplarni tekshirish oʻrgatildi. Qayta koʻrik: __ (birinchi hayzdan keyin). Qorinda kuchli ogʻriq, isitma, yoqimsiz hidli ajralma, iplar sezilmasa yoki homiladorlik gumon qilinsa qaytish aytildi. Almashtirish sanasi: __.', 'Ипларни текшириш ўргатилди. Қайта кўрик: __ (биринчи ҳайздан кейин). Қоринда кучли оғриқ, иситма, ёқимсиз ҳидли ажралма, иплар сезилмаса ёки ҳомиладорлик гумон қилинса қайтиш айтилди. Алмаштириш санаси: __.', 'Обучена проверке нитей. Повторный приём: __ (после первой менструации). Сказано вернуться при сильной боли в животе, лихорадке, выделениях с неприятным запахом, если нити не прощупываются или есть подозрение на беременность. Дата замены: __.'),
  },
  labioplasti: {
    endikasyon: u('__ (tibbiy koʻrsatma: __). Maslahat va kutilmalar yozilgan; rozilik yozilgan.', '__ (тиббий кўрсатма: __). Маслаҳат ва кутилмалар ёзилган; розилик ёзилган.', '__ (медицинское показание: __). Консультирование и ожидания записаны; согласие записано.'),
    teknik: adim([
      u('Anesteziya __; litotomiya holati; teri ishlovi, choyshab yopish.', 'Анестезия __; литотомия ҳолати; тери ишлови, чойшаб ёпиш.', 'Анестезия __; литотомическое положение; обработка, отграничение.'),
      u('Kesish chegaralari ikki tomonda simmetrik belgilandi.', 'Кесиш чегаралари икки томонда симметрик белгиланди.', 'Границы резекции размечены симметрично с двух сторон.'),
      u('Mahalliy infiltratsiya: __ (jarroh qaroriga koʻra).', 'Маҳаллий инфильтрация: __ (жарроҳ қарорига кўра).', 'Местная инфильтрация: __ (по решению хирурга).'),
      u('Belgilangan toʻqima __ usulida olindi; klitor qalpoqchasi va yuganchasi saqlandi.', 'Белгиланган тўқима __ усулида олинди; клитор қалпоқчаси ва юганчаси сақланди.', 'Размеченная ткань иссечена методом __; капюшон и уздечка клитора сохранены.'),
      u('Gemostaz __.', 'Гемостаз __.', 'Гемостаз __.'),
    ]),
    kapanis: u('Shilliq qavat chetlari soʻriladigan choklar bilan tikildi __.', 'Шиллиқ қават четлари сўриладиган чоклар билан тикилди __.', 'Края слизистой ушиты рассасывающимися швами __.'),
    postop: u('Sovuq kompress va gigiyena boʻyicha maslahat. Jinsiy aloqa va tampon cheklovlari: jarroh qaroriga koʻra. Qayta koʻrik: __. Shish kuchaysa, qon ketsa, isitma yoki ajralma boʻlsa qaytish aytildi.', 'Совуқ компресс ва гигиена бўйича маслаҳат. Жинсий алоқа ва тампон чекловлари: жарроҳ қарорига кўра. Қайта кўрик: __. Шиш кучайса, қон кетса, иситма ёки ажралма бўлса қайтиш айтилди.', 'Холод и гигиенические рекомендации. Ограничения половой жизни и тампонов: по решению хирурга. Повторный приём: __. Сказано вернуться при нарастании отёка, кровотечении, лихорадке или выделениях.'),
  },
  perineoplasti: {
    endikasyon: u('__ (POP-Q bosqichi __ / qin boʻshligi shikoyatlari). Rozilik yozilgan.', '__ (POP-Q босқичи __ / қин бўшлиги шикоятлари). Розилик ёзилган.', '__ (стадия POP-Q __ / жалобы на несостоятельность влагалища). Согласие оформлено.'),
    teknik: adim([
      u('Anesteziya __; litotomiya holati; teri ishlovi, choyshab yopish, siydik kateteri.', 'Анестезия __; литотомия ҳолати; тери ишлови, чойшаб ёпиш, сийдик катетери.', 'Анестезия __; литотомическое положение; обработка, отграничение, мочевой катетер.'),
      u('Oraliq / qin shilliq qavati kesmasi __; shilliq qavat ostidagi fassiyadan ajratildi.', 'Оралиқ / қин шиллиқ қавати кесмаси __; шиллиқ қават остидаги фассиядан ажратилди.', 'Разрез промежности / слизистой влагалища __; слизистая отсепарована от фасции.'),
      u('Toʻgʻri ichak-qin / pufak-qin fassiyasi __ bilan plikatsiya qilindi (toʻgʻri ichak / pufak butunligi saqlandi; toʻgʻri ichak tekshiruvi: __).', 'Тўғри ичак-қин / пуфак-қин фассияси __ билан пликация қилинди (тўғри ичак / пуфак бутунлиги сақланди; тўғри ичак текшируви: __).', 'Пликация ректовагинальной / пузырно-влагалищной фасции __ (целостность прямой кишки / пузыря сохранена; ректальное исследование: __).'),
      u('Ortiqcha shilliq qavat kesib olindi.', 'Ортиқча шиллиқ қават кесиб олинди.', 'Избыток слизистой иссечён.'),
      u('Oraliq tanasi mushaklari __ bilan yaqinlashtirildi.', 'Оралиқ танаси мушаклари __ билан яқинлаштирилди.', 'Мышцы промежности сближены __.'),
    ]),
    kapanis: u('Qin shilliq qavati va oraliq terisi soʻriladigan choklar bilan tikildi; qin tamponi: __.', 'Қин шиллиқ қавати ва оралиқ териси сўриладиган чоклар билан тикилди; қин тампони: __.', 'Слизистая влагалища и кожа промежности ушиты рассасывающимися швами; влагалищный тампон: __.'),
    postop: ORTA(u('Ich qotishidan saqlaning; ogʻir koʻtarish va jinsiy aloqa cheklovlari: jarroh qaroriga koʻra.', 'Ич қотишидан сақланинг; оғир кўтариш ва жинсий алоқа чекловлари: жарроҳ қарорига кўра.', 'Избегать запоров; ограничения подъёма тяжестей и половой жизни: по решению хирурга.')),
  },
}

// ───────────────────────── the discharge summary after birth: pre-filled advice by the mode of birth ─────────────────────────

const TALIMAT_GENEL = u('Qon aralash ajralma (loxiya) keyingi haftalarda kamayib, ochrayib boradi. Oraliq yoki yarani toza va quruq saqlang. Chaqaloqni tez-tez, u xohlaganda emizing; kerak boʻlsa emizish boʻyicha yordam soʻrang. Koʻp suyuqlik iching, kletchatkali ovqat yeng, ich qotishidan saqlaning. Harakatda boʻling; uzoq qimirlamay yotmang. Kayfiyat tushsa, uyqusizlik yoki xavotir boʻlsa, shifokor yoki hamshiraga ayting. Jinsiy aloqa, avtomobil haydash, ogʻir koʻtarish va jismoniy mashqqa qaytish tugʻruqdan keyingi koʻrikda muhokama qilinadi.', 'Қон аралаш ажралма (лохия) кейинги ҳафталарда камайиб, очрайиб боради. Оралиқ ёки ярани тоза ва қуруқ сақланг. Чақалоқни тез-тез, у хоҳлаганда эмизинг; керак бўлса эмизиш бўйича ёрдам сўранг. Кўп суюқлик ичинг, клетчаткали овқат енг, ич қотишидан сақланинг. Ҳаракатда бўлинг; узоқ қимирламай ётманг. Кайфият тушса, уйқусизлик ёки хавотир бўлса, шифокор ёки ҳамширага айтинг. Жинсий алоқа, автомобил ҳайдаш, оғир кўтариш ва жисмоний машққа қайтиш туғруқдан кейинги кўрикда муҳокама қилинади.', 'Кровянистые выделения (лохии) в ближайшие недели уменьшаются и светлеют. Содержите промежность или рану в чистоте и сухости. Кормите ребёнка часто, по его требованию; при необходимости попросите помощи с грудным вскармливанием. Пейте достаточно, ешьте продукты с клетчаткой, избегайте запоров. Двигайтесь; не лежите долго без движения. Сообщите врачу или медсестре о плохом настроении, бессоннице или тревоге. Возвращение к половой жизни, вождению, подъёму тяжестей и упражнениям обсуждается на послеродовом осмотре.')
const TALIMAT_CS = u('Kesarcha kesish yarasi: bogʻlam va choklarni olish jamoangiz aytganidek; qizarish, ajralma yoki yara ochilishi haqida xabar bering. Kuchanish va ogʻir koʻtarishdan saqlaning. Avtomobil haydashga ogʻriqsiz keskin tormoz bera olganingizda qayting; shifokoringizdan soʻrang.', 'Кесарча кесиш яраси: боғлам ва чокларни олиш жамоангиз айтганидек; қизариш, ажралма ёки яра очилиши ҳақида хабар беринг. Кучаниш ва оғир кўтаришдан сақланинг. Автомобил ҳайдашга оғриқсиз кескин тормоз бера олганингизда қайтинг; шифокорингиздан сўранг.', 'Рана после кесарева сечения: перевязки и снятие швов — как скажет ваша бригада; сообщайте о покраснении, выделениях или расхождении раны. Избегайте натуживания и подъёма тяжестей. Садитесь за руль, когда сможете без боли резко затормозить; спросите врача.')
const KONTRASEPSIYON = u('Kontratseptsiya muhokama qilindi. Usullar va ularni boshlashning eng erta muddati emizishga va tugʻruq usuliga bogʻliq (WHO MEC): __.', 'Контратсепция муҳокама қилинди. Усуллар ва уларни бошлашнинг энг эрта муддати эмизишга ва туғруқ усулига боғлиқ (WHO MEC): __.', 'Обсуждена контрацепция. Методы и самый ранний срок их начала зависят от грудного вскармливания и способа родов (WHO MEC): __.')
const TEHLIKE = u('Quyidagilarda darhol shifoxonaga qayting yoki shoshilinch yordam chaqiring: qindan koʻp qon ketishi yoki katta laxtalar; isitma yoki titroq; yoqimsiz hidli ajralma yoki qorinda kuchli ogʻriq; kuchli bosh ogʻrigʻi, koʻz xiralashishi yoki tutqanoq; hansirash yoki koʻkrakda ogʻriq; bir oyoqning ogʻriqli shishi; yarada qizarish, ajralma yoki ochilish; isitma bilan ogʻriqli qizargan koʻkrak; siyganda achishish yoki siya olmaslik; oʻzingizga yoki chaqaloqqa zarar yetkazish fikrlari.', 'Қуйидагиларда дарҳол шифохонага қайтинг ёки шошилинч ёрдам чақиринг: қиндан кўп қон кетиши ёки катта лахталар; иситма ёки титроқ; ёқимсиз ҳидли ажралма ёки қоринда кучли оғриқ; кучли бош оғриғи, кўз хиралашиши ёки тутқаноқ; ҳансираш ёки кўкракда оғриқ; бир оёқнинг оғриқли шиши; ярада қизариш, ажралма ёки очилиш; иситма билан оғриқли қизарган кўкрак; сийганда ачишиш ёки сия олмаслик; ўзингизга ёки чақалоққа зарар етказиш фикрлари.', 'Немедленно вернитесь в больницу или вызовите экстренную помощь при: обильном кровотечении из влагалища или крупных сгустках; лихорадке или ознобе; выделениях с неприятным запахом или сильной боли в животе; сильной головной боли, нечёткости зрения или судорогах; одышке или боли в груди; болезненном отёке одной ноги; покраснении, выделениях или расхождении раны; болезненной покрасневшей груди с температурой; жжении при мочеиспускании или невозможности помочиться; мыслях причинить вред себе или ребёнку.')
const EPIKRIZ_SABLONU: Record<string, Record<string, Uc>> = Object.fromEntries(
  ['vajinal', 'mudahaleli', 'cs_elektif', 'cs_acil', 'vbac'].map((k) => [k, { talimatlar: k.startsWith('cs_') ? qosh(TALIMAT_GENEL, TALIMAT_CS, '\n') : TALIMAT_GENEL, kontrasepsiyon: KONTRASEPSIYON, tehlike: TEHLIKE }]),
)

// ───────────────────────── CTG (FIGO 2015) ─────────────────────────

const KTG_ALANLARI: Record<string, Uc> = {
  tarih: u('Sana', 'Сана', 'Дата'), hafta: u('Homiladorlik muddati (toʻliq haftalar)', 'Ҳомиладорлик муддати (тўлиқ ҳафталар)', 'Срок беременности (полных недель)'),
  sure: u('Yozuv davomiyligi', 'Ёзув давомийлиги', 'Длительность записи'), bazal: u('Bazal yurak urishi (urish/daqiqa)', 'Базал юрак уриши (уриш/дақиқа)', 'Базальная ЧСС (уд/мин)'),
  varyabilite: u('Variabellik (urish/daqiqa)', 'Вариабеллик (уриш/дақиқа)', 'Вариабельность (уд/мин)'),
  azalmis_dk: u('Variabellik 5 dan past boʻlgan daqiqalar', 'Вариабеллик 5 дан паст бўлган дақиқалар', 'Минуты с вариабельностью ниже 5'),
  artmis_dk: u('Variabellik 25 dan yuqori boʻlgan daqiqalar', 'Вариабеллик 25 дан юқори бўлган дақиқалар', 'Минуты с вариабельностью выше 25'),
  sinuzoidal_dk: u('Sinusoidal ritm daqiqalari', 'Синусоидал ритм дақиқалари', 'Минуты синусоидального ритма'),
  tasikardi_dk: u('Bazal ritm 160 dan yuqori boʻlgan daqiqalar', 'Базал ритм 160 дан юқори бўлган дақиқалар', 'Минуты с базальным ритмом выше 160'),
  aksel_20dk: u('Akseleratsiyalar', 'Акселерациялар', 'Акселерации'), erken: u('Erta deseleratsiyalar', 'Эрта деселерациялар', 'Ранние децелерации'),
  gec: u('Kech deseleratsiyalar', 'Кеч деселерациялар', 'Поздние децелерации'), degisken: u('Oʻzgaruvchan deseleratsiyalar', 'Ўзгарувчан деселерациялар', 'Вариабельные децелерации'),
  degisken_komplike: u('Oʻzgaruvchan deseleratsiyalar asoratli', 'Ўзгарувчан деселерациялар асоратли', 'Вариабельные децелерации осложнённые'),
  uzamis: u('Uzaygan deseleratsiyalar', 'Узайган деселерациялар', 'Пролонгированные децелерации'),
  tekrarlayan: u('Deseleratsiyalar qisqarishlarning yarmidan koʻpida', 'Деселерациялар қисқаришларнинг ярмидан кўпида', 'Децелерации более чем при половине схваток'),
  tekrar_dk: u('Takroriy deseleratsiyalar davom etgan daqiqalar', 'Такрорий деселерациялар давом этган дақиқалар', 'Сколько минут длятся повторяющиеся децелерации'),
  en_uzun_des: u('Eng uzun deseleratsiya (daqiqa)', 'Энг узун деселерация (дақиқа)', 'Самая длинная децелерация (мин)'),
  kontraksiyon: u('10 daqiqadagi qisqarishlar', '10 дақиқадаги қисқаришлар', 'Схваток за 10 минут'),
  sonuc: u('Baholash va reja (shifokorniki)', 'Баҳолаш ва режа (шифокорники)', 'Оценка и план (врача)'),
}

export const UZ_ROL_ARACLARI_7: readonly PaketAraci[] = [
  {
    anahtar: 'ameliyat-notu', roller: CERRAHI,
    metin: { ad: u('Operatsiya bayonnomasi', 'Операция баённомаси', 'Протокол операции'), aciklama: NOT_ACIKLAMA, alanlar: NOT_ALANLARI, secenekler: NOT_SECENEKLERI, tarihler: { tarih: OPERATSIYA }, not: NOT_NOTU },
  },
  {
    anahtar: 'ameliyat-notu-kd', roller: KD,
    metin: {
      ad: u('Operatsiya bayonnomasi: akusherlik va ginekologiya', 'Операция баённомаси: акушерлик ва гинекология', 'Протокол операции: акушерство и гинекология'),
      aciklama: qosh(NOT_ACIKLAMA, u('Standart bosqichlarni oldindan toʻldirish uchun operatsiyani tanlang, soʻng ularni bajarilganiga moslab tuzating.', 'Стандарт босқичларни олдиндан тўлдириш учун операцияни танланг, сўнг уларни бажарилганига мослаб тузатинг.', 'Выберите операцию, чтобы заполнить стандартные этапы, затем исправьте их по тому, что было сделано.')),
      alanlar: { sablon: u('Operatsiya (standart bosqichlarni toʻldiradi; har bir soʻz tahrirlanadi)', 'Операция (стандарт босқичларни тўлдиради; ҳар бир сўз таҳрирланади)', 'Операция (заполняет стандартные этапы; каждое слово можно изменить)'), ...UZ_KD_NOT_TIBBI, ...NOT_ALANLARI },
      secenekler: {
        sablon: {
          sezaryen: u('Kesarcha kesish (pastki segmentda)', 'Кесарча кесиш (пастки сегментда)', 'Кесарево сечение (в нижнем сегменте)'),
          tlh: u('Total laparoskopik gisterektomiya', 'Тотал лапароскопик гистеректомия', 'Тотальная лапароскопическая гистерэктомия'),
          tah: u('Total abdominal gisterektomiya', 'Тотал абдоминал гистеректомия', 'Тотальная абдоминальная гистерэктомия'),
          vajinal_histerektomi: u('Vaginal gisterektomiya', 'Вагинал гистеректомия', 'Влагалищная гистерэктомия'),
          lap_myomektomi: u('Laparoskopik miomektomiya', 'Лапароскопик миомектомия', 'Лапароскопическая миомэктомия'),
          abdominal_myomektomi: u('Abdominal miomektomiya', 'Абдоминал миомектомия', 'Абдоминальная миомэктомия'),
          tanisal_laparoskopi: u('Diagnostik laparoskopiya', 'Диагностик лапароскопия', 'Диагностическая лапароскопия'),
          lap_over_kistektomi: u('Laparoskopik tuxumdon kistektomiyasi', 'Лапароскопик тухумдон кистектомияси', 'Лапароскопическая цистэктомия яичника'),
          lap_endometriozis: u('Endometriozda laparoskopik operatsiya', 'Эндометриозда лапароскопик операция', 'Лапароскопическая операция при эндометриозе'),
          histeroskopi: u('Gisteroskopiya (diagnostik / operativ)', 'Гистероскопия (диагностик / оператив)', 'Гистероскопия (диагностическая / оперативная)'),
          dc_kuretaj: u('Bachadon boʻshligʻini qirish', 'Бачадон бўшлиғини қириш', 'Выскабливание полости матки'),
          vakum_aspirasyon: u('Vakuum-aspiratsiya (bachadonni boʻshatish)', 'Вакуум-аспирация (бачадонни бўшатиш)', 'Вакуум-аспирация (опорожнение матки)'),
          kolposkopi_leep: u('Kolposkopiya, biopsiya / halqasimon eksiziya', 'Колпоскопия, биопсия / ҳалқасимон эксизия', 'Кольпоскопия с биопсией / петлевая эксцизия'),
          ria: u('Bachadon ichi vositasini qoʻyish', 'Бачадон ичи воситасини қўйиш', 'Введение внутриматочного средства'),
          labioplasti: u('Labioplastika', 'Лабиопластика', 'Лабиопластика'),
          perineoplasti: u('Perineoplastika / kolporafiya', 'Перинеопластика / колпорафия', 'Перинеопластика / кольпорафия'),
        },
        ...NOT_SECENEKLERI,
      },
      tarihler: { tarih: OPERATSIYA },
      not: qosh(NOT_NOTU, u('Oldindan toʻldirilgan bosqichlar nashr etilgan jarrohlik qoʻllanmalariga koʻra umumiy ketma-ketlik; ular doza va raqam yozmaydi.', 'Олдиндан тўлдирилган босқичлар нашр этилган жарроҳлик қўлланмаларига кўра умумий кетма-кетлик; улар доза ва рақам ёзмайди.', 'Заполненные этапы — общая последовательность по опубликованным хирургическим руководствам; они не пишут ни доз, ни чисел.')),
    },
    sablonlar: { sablon: SABLONLAR },
  },
  {
    anahtar: 'usg-obstetrik', roller: KD,
    metin: {
      ad: u('Akusherlik UTT xulosasi', 'Акушерлик УТТ хулосаси', 'Заключение акушерского УЗИ'),
      aciklama: u('INTERGROWTH-21st sentillari bilan biometriya, homilaning taxminiy vazni (Hadlock), qogʻonoq suvi (AFI va eng chuqur choʻntak), yoʻldosh, yotish, yurak urishi, Doppler (MCA-PSV medianaga karrali va serebroplatsentar nisbat), yoqa sohasi va anatomiya. Blankangizda chop etiladi.', 'INTERGROWTH-21st сентиллари билан биометрия, ҳомиланинг тахминий вазни (Hadlock), қоғоноқ суви (АФИ ва энг чуқур чўнтак), йўлдош, ётиш, юрак уриши, Допплер (MCA-PSV медианага каррали ва сереброплатсентар нисбат), ёқа соҳаси ва анатомия. Бланкангизда чоп этилади.', 'Биометрия с центилями INTERGROWTH-21st, предполагаемая масса плода (Hadlock), околоплодные воды (ИАЖ и наибольший карман), плацента, предлежание, ЧСС плода, допплерометрия (MCA-PSV в MoM и церебро-плацентарное отношение), воротниковое пространство и анатомия. Печатается на вашем бланке.'),
      alanlar: {
        tarih: u('Tekshiruv sanasi', 'Текширув санаси', 'Дата исследования'), hafta: u('Homiladorlik muddati (toʻliq haftalar)', 'Ҳомиладорлик муддати (тўлиқ ҳафталар)', 'Срок беременности (полных недель)'), gun: u('va kunlar (0 dan 6 gacha)', 'ва кунлар (0 дан 6 гача)', 'и дней (от 0 до 6)'), fetus: u('Homilalar soni', 'Ҳомилалар сони', 'Число плодов'),
        crl: u('Dumgʻaza-tepa oʻlchami', 'Думғаза-тепа ўлчами', 'Копчико-теменной размер'), bpd: u('Biparietal oʻlcham', 'Бипариэтал ўлчам', 'Бипариетальный размер'), hc: u('Bosh aylanasi', 'Бош айланаси', 'Окружность головы'), ac: u('Qorin aylanasi', 'Қорин айланаси', 'Окружность живота'), fl: u('Son suyagi uzunligi', 'Сон суяги узунлиги', 'Длина бедренной кости'),
        afi: u('Amniotik suyuqlik indeksi', 'Амниотик суюқлик индекси', 'Индекс амниотической жидкости'), dvp: u('Eng chuqur vertikal choʻntak', 'Энг чуқур вертикал чўнтак', 'Наибольший вертикальный карман'), plasenta: u('Yoʻldosh (joylashuvi, koʻrinishi)', 'Йўлдош (жойлашуви, кўриниши)', 'Плацента (локализация, вид)'), prezentasyon: u('Yotish', 'Ётиш', 'Предлежание'), fkh: u('Homila yurak urishi (urish/daqiqa)', 'Ҳомила юрак уриши (уриш/дақиқа)', 'ЧСС плода (уд/мин)'),
        ua_pi: u('Kindik arteriyasi PI', 'Киндик артерияси PI', 'Артерия пуповины PI'), ua_ri: u('Kindik arteriyasi RI', 'Киндик артерияси RI', 'Артерия пуповины RI'), ua_edf: u('Kindik arteriyasida diastolik oqim', 'Киндик артериясида диастолик оқим', 'Диастолический кровоток в артерии пуповины'), mca_pi: u('Oʻrta miya arteriyasi PI', 'Ўрта мия артерияси PI', 'Средняя мозговая артерия PI'), mca_psv: u('Oʻrta miya arteriyasi PSV', 'Ўрта мия артерияси PSV', 'Средняя мозговая артерия PSV'),
        ut_pi_sag: u('Bachadon arteriyasi PI, oʻng', 'Бачадон артерияси PI, ўнг', 'Маточная артерия PI, справа'), ut_pi_sol: u('Bachadon arteriyasi PI, chap', 'Бачадон артерияси PI, чап', 'Маточная артерия PI, слева'), nt: u('Yoqa sohasi qalinligi', 'Ёқа соҳаси қалинлиги', 'Толщина воротникового пространства'), anatomi: u('Anatomiya', 'Анатомия', 'Анатомия'), sonuc: u('Xulosa (shifokorniki)', 'Хулоса (шифокорники)', 'Заключение (врача)'),
      },
      secenekler: {
        prezentasyon: { sefalik: u('Bosh bilan', 'Бош билан', 'Головное'), makat: u('Chanoq bilan', 'Чаноқ билан', 'Тазовое'), transvers: u('Koʻndalang', 'Кўндаланг', 'Поперечное'), oblik: u('Qiyshiq', 'Қийшиқ', 'Косое'), degisken: u('Oʻzgaruvchan', 'Ўзгарувчан', 'Неустойчивое') },
        ua_edf: { var: u('Bor', 'Бор', 'Есть'), yok: u('Yoʻq', 'Йўқ', 'Нулевой'), ters: u('Teskari', 'Тескари', 'Реверсный') },
      },
      sayilar: { bpd_p: u('BPD sentili', 'БПД сентили', 'Центиль БПР'), hc_p: u('Bosh aylanasi sentili', 'Бош айланаси сентили', 'Центиль ОГ'), ac_p: u('Qorin aylanasi sentili', 'Қорин айланаси сентили', 'Центиль ОЖ'), fl_p: u('Son suyagi sentili', 'Сон суяги сентили', 'Центиль ДБ'), efw: u('Homilaning taxminiy vazni', 'Ҳомиланинг тахминий вазни', 'Предполагаемая масса плода'), mca_mom: u('MCA-PSV, medianaga karrali', 'MCA-PSV, медианага каррали', 'MCA-PSV, MoM'), cpr: u('Serebroplatsentar nisbat', 'Сереброплатсентар нисбат', 'Церебро-плацентарное отношение'), ut_ort_pi: u('Bachadon arteriyalari oʻrtacha PI (sentil jadvalisiz)', 'Бачадон артериялари ўртача PI (сентил жадвалисиз)', 'Средний PI маточных артерий (без таблицы центилей)') },
      uyarilar: {
        afi_oligo: u('AFI 5 sm yoki kamroq (kamsuvlik oraligʻi)', 'АФИ 5 см ёки камроқ (камсувлик оралиғи)', 'ИАЖ 5 см или меньше (диапазон маловодия)'), afi_poli: u('AFI 24 sm yoki koʻproq (koʻpsuvlik oraligʻi)', 'АФИ 24 см ёки кўпроқ (кўпсувлик оралиғи)', 'ИАЖ 24 см или больше (диапазон многоводия)'),
        dvp_oligo: u('Eng chuqur choʻntak 2 sm dan kam', 'Энг чуқур чўнтак 2 см дан кам', 'Наибольший карман меньше 2 см'), dvp_poli: u('Eng chuqur choʻntak 8 sm yoki koʻproq', 'Энг чуқур чўнтак 8 см ёки кўпроқ', 'Наибольший карман 8 см или больше'),
        mca_anemi: u('MCA-PSV 1,5 MoM yoki koʻproq: oʻrta va ogʻir homila anemiyasi uchun eʼlon qilingan chegara', 'MCA-PSV 1,5 MoM ёки кўпроқ: ўрта ва оғир ҳомила анемияси учун эълон қилинган чегара', 'MCA-PSV 1,5 MoM или выше: опубликованный порог умеренной и тяжёлой анемии плода'), cpr_dusuk: u('Serebroplatsentar nisbat 1,08 dan past (Gramellini 1992 chegarasi)', 'Сереброплатсентар нисбат 1,08 дан паст (Gramellini 1992 чегараси)', 'Церебро-плацентарное отношение ниже 1,08 (порог Gramellini 1992)'),
        ua_edf_yok: u('Kindik arteriyasida diastolik oqim yoʻq', 'Киндик артериясида диастолик оқим йўқ', 'Нулевой диастолический кровоток в артерии пуповины'), ua_edf_ters: u('Kindik arteriyasida teskari diastolik oqim', 'Киндик артериясида тескари диастолик оқим', 'Реверсный диастолический кровоток в артерии пуповины'),
        fkh_dusuk: u('Homila yurak urishi 110 dan past', 'Ҳомила юрак уриши 110 дан паст', 'ЧСС плода ниже 110'), fkh_yuksek: u('Homila yurak urishi 160 dan yuqori', 'Ҳомила юрак уриши 160 дан юқори', 'ЧСС плода выше 160'), nt_esik: u('Yoqa sohasi 3,5 mm yoki koʻproq', 'Ёқа соҳаси 3,5 мм ёки кўпроқ', 'Воротниковое пространство 3,5 мм или больше'),
        biyometri_dusuk: u('Biometrik oʻlcham 10-sentildan past', 'Биометрик ўлчам 10-сентилдан паст', 'Биометрический параметр ниже 10-го центиля'), biyometri_yuksek: u('Biometrik oʻlcham 90-sentildan yuqori', 'Биометрик ўлчам 90-сентилдан юқори', 'Биометрический параметр выше 90-го центиля'),
      },
      not: u('Raqamlar eʼlon qilingan manbalarga koʻra; talqin va tashxis shifokorniki.', 'Рақамлар эълон қилинган манбаларга кўра; талқин ва ташхис шифокорники.', 'Числа — по опубликованным источникам; интерпретация и диагноз — врача.'),
    },
  },
  {
    anahtar: 'usg-jinekolojik', roller: KD,
    metin: {
      ad: u('Ginekologik UTT xulosasi', 'Гинекологик УТТ хулосаси', 'Заключение гинекологического УЗИ'),
      aciklama: u('Bachadon, endometriy, tuxumdonlar va ikkitagacha hosila, bachadon va tuxumdon hajmlari hamda menopauzadan keyingi endometriy belgisi bilan. Blankangizda chop etiladi.', 'Бачадон, эндометрий, тухумдонлар ва иккитагача ҳосила, бачадон ва тухумдон ҳажмлари ҳамда менопаузадан кейинги эндометрий белгиси билан. Бланкангизда чоп этилади.', 'Матка, эндометрий, яичники и до двух образований, с объёмами матки и яичников и отметкой об эндометрии в постменопаузе. Печатается на вашем бланке.'),
      alanlar: {
        tarih: u('Tekshiruv sanasi', 'Текширув санаси', 'Дата исследования'), yol: u('Usul', 'Усул', 'Доступ'), menopoz: u('Menopauzadan keyin', 'Менопаузадан кейин', 'Постменопауза'),
        uterus_u: u('Bachadon, uzunligi', 'Бачадон, узунлиги', 'Матка, длина'), uterus_ap: u('Bachadon, old-orqa oʻlchami', 'Бачадон, олд-орқа ўлчами', 'Матка, переднезадний размер'), uterus_g: u('Bachadon, kengligi', 'Бачадон, кенглиги', 'Матка, ширина'), uterus_poz: u('Bachadon holati', 'Бачадон ҳолати', 'Положение матки'), endometrium: u('Endometriy qalinligi', 'Эндометрий қалинлиги', 'Толщина эндометрия'),
        over_sag_1: u('Oʻng tuxumdon, uzunligi', 'Ўнг тухумдон, узунлиги', 'Правый яичник, длина'), over_sag_2: u('Oʻng tuxumdon, old-orqa oʻlchami', 'Ўнг тухумдон, олд-орқа ўлчами', 'Правый яичник, переднезадний размер'), over_sag_3: u('Oʻng tuxumdon, kengligi', 'Ўнг тухумдон, кенглиги', 'Правый яичник, ширина'), over_sag_not: u('Oʻng tuxumdon, izoh', 'Ўнг тухумдон, изоҳ', 'Правый яичник, примечание'),
        over_sol_1: u('Chap tuxumdon, uzunligi', 'Чап тухумдон, узунлиги', 'Левый яичник, длина'), over_sol_2: u('Chap tuxumdon, old-orqa oʻlchami', 'Чап тухумдон, олд-орқа ўлчами', 'Левый яичник, переднезадний размер'), over_sol_3: u('Chap tuxumdon, kengligi', 'Чап тухумдон, кенглиги', 'Левый яичник, ширина'), over_sol_not: u('Chap tuxumdon, izoh', 'Чап тухумдон, изоҳ', 'Левый яичник, примечание'),
        lezyon_1: u('1-hosila (joyi, turi, FIGO / O-RADS)', '1-ҳосила (жойи, тури, FIGO / O-RADS)', 'Образование 1 (локализация, тип, FIGO / O-RADS)'), lezyon_1_boyut: u('1-hosila, eng katta diametri', '1-ҳосила, энг катта диаметри', 'Образование 1, наибольший диаметр'), lezyon_2: u('2-hosila (joyi, turi, FIGO / O-RADS)', '2-ҳосила (жойи, тури, FIGO / O-RADS)', 'Образование 2 (локализация, тип, FIGO / O-RADS)'), lezyon_2_boyut: u('2-hosila, eng katta diametri', '2-ҳосила, энг катта диаметри', 'Образование 2, наибольший диаметр'),
        serbest_sivi: u('Erkin suyuqlik', 'Эркин суюқлик', 'Свободная жидкость'), sonuc: u('Xulosa (shifokorniki)', 'Хулоса (шифокорники)', 'Заключение (врача)'),
      },
      secenekler: { yol: { transvajinal: u('Transvaginal', 'Трансвагинал', 'Трансвагинальный'), transabdominal: u('Transabdominal', 'Трансабдоминал', 'Трансабдоминальный'), transrektal: u('Transrektal', 'Трансректал', 'Трансректальный') } },
      sayilar: { uterus_hacim: u('Bachadon hajmi', 'Бачадон ҳажми', 'Объём матки'), over_sag_hacim: u('Oʻng tuxumdon hajmi', 'Ўнг тухумдон ҳажми', 'Объём правого яичника'), over_sol_hacim: u('Chap tuxumdon hajmi', 'Чап тухумдон ҳажми', 'Объём левого яичника') },
      uyarilar: { endometrium_postmenopoz: u('Menopauzadan keyin endometriy 4 mm dan qalin: qoʻshimcha tekshiruv', 'Менопаузадан кейин эндометрий 4 мм дан қалин: қўшимча текширув', 'Эндометрий в постменопаузе толще 4 мм: дообследование') },
      not: u('Hajmlar ellipsoid formulasi bilan; talqin va tashxis shifokorniki.', 'Ҳажмлар эллипсоид формуласи билан; талқин ва ташхис шифокорники.', 'Объёмы — по формуле эллипсоида; интерпретация и диагноз — врача.'),
    },
  },
  {
    anahtar: 'dogum-epikrizi', roller: KD,
    metin: {
      ad: u('Tugʻruqdan keyingi koʻchirma', 'Туғруқдан кейинги кўчирма', 'Выписной эпикриз после родов'),
      aciklama: u('Tugʻruq usuli va sanasi, muddat, chaqaloq, asoratlar, qon yoʻqotish va dorilar, chiqarishdagi maslahatlar, kontratseptsiya va shoshilinch qaytish belgilari bilan; tugʻruq usuliga koʻra oldindan toʻldiriladi. Blankangizda chop etiladi.', 'Туғруқ усули ва санаси, муддат, чақалоқ, асоратлар, қон йўқотиш ва дорилар, чиқаришдаги маслаҳатлар, контратсепция ва шошилинч қайтиш белгилари билан; туғруқ усулига кўра олдиндан тўлдирилади. Бланкангизда чоп этилади.', 'Способ и дата родов, срок, ребёнок, осложнения, кровопотеря и лекарства, рекомендации при выписке, контрацепция и признаки для срочного обращения; заполняется по способу родов. Печатается на вашем бланке.'),
      alanlar: {
        dogum_tarihi: u('Tugʻruq sanasi', 'Туғруқ санаси', 'Дата родов'), dogum_sekli: u('Tugʻruq usuli', 'Туғруқ усули', 'Способ родов'), hafta: u('Tugʻruqdagi muddat (toʻliq haftalar)', 'Туғруқдаги муддат (тўлиқ ҳафталар)', 'Срок при родах (полных недель)'), gun: u('va kunlar (0 dan 6 gacha)', 'ва кунлар (0 дан 6 гача)', 'и дней (от 0 до 6)'),
        bebek_cinsiyet: u('Chaqaloq jinsi', 'Чақалоқ жинси', 'Пол ребёнка'), bebek_agirlik: u('Tugʻilgandagi vazn', 'Туғилгандаги вазн', 'Масса при рождении'), apgar1: u('Apgar 1-daqiqada', 'Апгар 1-дақиқада', 'Апгар на 1-й минуте'), apgar5: u('Apgar 5-daqiqada', 'Апгар 5-дақиқада', 'Апгар на 5-й минуте'), kan_kaybi: u('Taxminiy qon yoʻqotish', 'Тахминий қон йўқотиш', 'Ориентировочная кровопотеря'),
        endikasyon: u('Koʻrsatma (operativ yoki yordamli tugʻruq)', 'Кўрсатма (оператив ёки ёрдамли туғруқ)', 'Показание (оперативные или вспомогательные роды)'), komplikasyon: u('Asoratlar', 'Асоратлар', 'Осложнения'), ilaclar: u('Chiqarishdagi dorilar', 'Чиқаришдаги дорилар', 'Лекарства при выписке'), emziriyor: u('Emizmoqda', 'Эмизмоқда', 'Грудное вскармливание'),
        talimatlar: u('Chiqarishdagi maslahatlar', 'Чиқаришдаги маслаҳатлар', 'Рекомендации при выписке'), kontrasepsiyon: u('Kontratseptsiya', 'Контратсепция', 'Контрацепция'), tehlike: u('Qachon shoshilinch yordam soʻrash kerak', 'Қачон шошилинч ёрдам сўраш керак', 'Когда срочно обращаться за помощью'), kontrol: u('Tugʻruqdan keyingi koʻrik sanasi (ixtiyoriy)', 'Туғруқдан кейинги кўрик санаси (ихтиёрий)', 'Дата послеродового осмотра (необязательно)'),
      },
      secenekler: {
        dogum_sekli: { vajinal: u('Oʻz-oʻzidan qin orqali tugʻruq', 'Ўз-ўзидан қин орқали туғруқ', 'Самопроизвольные роды через естественные пути'), mudahaleli: u('Yordamli qin orqali tugʻruq', 'Ёрдамли қин орқали туғруқ', 'Вспомогательные вагинальные роды'), cs_elektif: u('Rejali kesarcha kesish', 'Режали кесарча кесиш', 'Плановое кесарево сечение'), cs_acil: u('Shoshilinch kesarcha kesish', 'Шошилинч кесарча кесиш', 'Экстренное кесарево сечение'), vbac: u('Kesarcha kesishdan keyin qin orqali tugʻruq', 'Кесарча кесишдан кейин қин орқали туғруқ', 'Вагинальные роды после кесарева сечения') },
        bebek_cinsiyet: { kiz: u('Qiz', 'Қиз', 'Женский'), erkek: u('Oʻgʻil', 'Ўғил', 'Мужской'), belirsiz: u('Yozilmagan', 'Ёзилмаган', 'Не указан') },
      },
      tarihler: { dogum_tarihi: u('Tugʻruq', 'Туғруқ', 'Роды'), kontrol: u('Tugʻruqdan keyingi koʻrik', 'Туғруқдан кейинги кўрик', 'Послеродовой осмотр') },
      not: u('Siz kiritgan maʼlumotdan tuziladi; oldindan toʻldirilgan maslahatlarni chop etishdan oldin tahrirlash mumkin. Klinik qarorlar shifokorniki.', 'Сиз киритган маълумотдан тузилади; олдиндан тўлдирилган маслаҳатларни чоп этишдан олдин таҳрирлаш мумкин. Клиник қарорлар шифокорники.', 'Составляется из введённых вами данных; заполненные рекомендации можно изменить до печати. Клинические решения — врача.'),
    },
    sablonlar: { dogum_sekli: EPIKRIZ_SABLONU },
  },
  {
    anahtar: 'ktg-figo', roller: KD,
    metin: {
      ad: u('KTG: FIGO 2015 boʻyicha tasnif', 'КТГ: FIGO 2015 бўйича тасниф', 'КТГ: классификация FIGO 2015'),
      aciklama: u('Bazal ritm, variabellik va deseleratsiyalar FIGO 2015 konsensusi chegaralari bilan normal, shubhali yoki patologik deb tasniflanadi. Blankangizda chop etiladi.', 'Базал ритм, вариабеллик ва деселерациялар FIGO 2015 консенсуси чегаралари билан нормал, шубҳали ёки патологик деб таснифланади. Бланкангизда чоп этилади.', 'Базальный ритм, вариабельность и децелерации классифицируются как нормальная, сомнительная или патологическая КТГ по порогам консенсуса FIGO 2015. Печатается на вашем бланке.'),
      alanlar: KTG_ALANLARI,
      bantlar: { normal: u('Normal KTG', 'Нормал КТГ', 'Нормальная КТГ'), supheli: u('Shubhali KTG', 'Шубҳали КТГ', 'Сомнительная КТГ'), patolojik: u('Patologik KTG', 'Патологик КТГ', 'Патологическая КТГ') },
      uyarilar: {
        bazal_patolojik: u('Bazal ritm 100 dan past', 'Базал ритм 100 дан паст', 'Базальный ритм ниже 100'), varyabilite_patolojik: u('Variabellik 50 daqiqadan ortiq pasaygan yoki 30 daqiqadan ortiq oshgan', 'Вариабеллик 50 дақиқадан ортиқ пасайган ёки 30 дақиқадан ортиқ ошган', 'Вариабельность снижена более 50 минут или повышена более 30 минут'),
        sinuzoidal: u('Sinusoidal ritm 30 daqiqadan ortiq', 'Синусоидал ритм 30 дақиқадан ортиқ', 'Синусоидальный ритм более 30 минут'), des_patolojik: u('Takroriy kech yoki uzaygan deseleratsiyalar 30 daqiqadan ortiq (variabellik pasayganda 20 daqiqadan ortiq)', 'Такрорий кеч ёки узайган деселерациялар 30 дақиқадан ортиқ (вариабеллик пасайганда 20 дақиқадан ортиқ)', 'Повторяющиеся поздние или пролонгированные децелерации более 30 минут (при сниженной вариабельности более 20 минут)'),
        uzamis_des: u('Bir deseleratsiya 5 daqiqadan uzoq', 'Бир деселерация 5 дақиқадан узоқ', 'Одна децелерация дольше 5 минут'), bazal_dusuk: u('Bazal ritm 100 dan 109 gacha', 'Базал ритм 100 дан 109 гача', 'Базальный ритм от 100 до 109'), bazal_yuksek: u('Bazal ritm 160 dan yuqori', 'Базал ритм 160 дан юқори', 'Базальный ритм выше 160'),
        varyabilite_azalmis: u('Variabellik pasaygan', 'Вариабеллик пасайган', 'Вариабельность снижена'), varyabilite_artmis: u('Variabellik oshgan', 'Вариабеллик ошган', 'Вариабельность повышена'),
        tekrarlayan_des: u('Takroriy deseleratsiyalar', 'Такрорий деселерациялар', 'Повторяющиеся децелерации'), tasisistoli: u('10 daqiqada 5 tadan koʻp qisqarish (taxisistoliya)', '10 дақиқада 5 тадан кўп қисқариш (тахисистолия)', 'Более 5 схваток за 10 минут (тахисистолия)'),
      },
      not: u('Tasnif FIGO 2015 chegaralariga koʻra; umumiy baholash va har bir qaror shifokorniki.', 'Тасниф FIGO 2015 чегараларига кўра; умумий баҳолаш ва ҳар бир қарор шифокорники.', 'Классификация — по порогам FIGO 2015; общая оценка и каждое решение — врача.'),
    },
  },
]

// GENITAL-ESTETIK-01 (2026-11-06): the adult genital-aesthetics note (./rol9.ts) reuses these words and paragraphs.
export { SABLONLAR as UZ_KD_SABLONLARI, NOT_ALANLARI as UZ_NOT_ALANLARI, NOT_SECENEKLERI as UZ_NOT_SECENEKLERI }
