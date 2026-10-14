/**
 * NOTYA-ULKE-TIBBI-UZ — words of the tools in ./tibbi.ts.
 * MACHINE-WRITTEN. AWAITS NATIVE REVIEW. Uzbek in Cyrillic script is filled by scripts/uz-kiril.mjs from the Latin text.
 * The annex rows keep the annex's own spelling: the Cyrillic line is the same rule, and the Russian line is that
 * line with the four letters only Uzbek uses replaced. A pharmacist has not read those spellings.
 */
import type { PaketAraci } from '@/lib/ulke/araclar/tipler'
import { UZ_HEKIM_ROLLERI } from '../../../klinik/rolListesi'
import { u } from '../yardimci'
import { UZ_ASOSIY_QATORLAR } from './tibbi'

const TELIF = 'Law of the Republic of Uzbekistan No. OʻRQ-42 of 20 July 2006, articles 5 and 8 (https://lex.uz/en/acts/-1022944, read 2026-10-10): an official document is not an object of copyright, and a method is not one either. A machine\'s reading, not a lawyer\'s.'

const doriSecenekleri = () => Object.fromEntries(UZ_ASOSIY_QATORLAR.map((r) => [r.anahtar, u(r.lotin, r.kirill, r.ruscha)]))

export const UZ_TIBBI_ARACLAR: readonly PaketAraci[] = [
  {
    anahtar: 'uz-asosiy-dorilar', roller: UZ_HEKIM_ROLLERI, sinif: 'hekimler',
    metin: {
      ad: u('Asosiy dori vositalari', 'Асосий дори воситалари', 'Перечень основных лекарственных средств'),
      aciklama: u('Vazir buyrugʻidagi asosiy dori vositalari ilovasidan bir qatorni koʻrsatadi: xalqaro patentlanmagan nom, dori shakli va dozasi. Bu retseptlar soni boʻyicha tartib emas.', 'Вазир буйруғидаги асосий дори воситалари иловасидан бир қаторни кўрсатади: халқаро патентланмаган ном, дори шакли ва дозаси. Бу рецептлар сони бўйича тартиб эмас.', 'Показывает одну строку приложения основных лекарственных средств: международное непатентованное наименование, форму и дозу. Это не порядок по числу рецептов.'),
      alanlar: { dori: u('Dori', 'Дори', 'Лекарственное средство') },
      secenekler: { dori: doriSecenekleri() },
      sayilar: { sira: u('Ilovadagi oʻrni', 'Иловадаги ўрни', 'Место в приложении') },
      uyarilar: {
        royxat: u('Ilova qatori: shakl va doza ilovadagidek. Vosita dozani tanlamaydi va dorixona nomi yoʻq.', 'Илова қатори: шакл ва доза иловадагидек. Восита дозани танламайди ва дорихона номи йўқ.', 'Строка приложения: форма и доза как в приложении. Инструмент дозу не выбирает, и торгового названия нет.'),
      },
      not: u('Faqat ilova. Davolash qarori shifokorniki. Qator dorixonaga yuborilmaydi.', 'Фақат илова. Даволаш қарори шифокорники. Қатор дорихонага юборилмайди.', 'Только приложение. Решение о лечении принимает врач. Строка в аптеку не отправляется.'),
    },
    lisans: { durum: 'serbest', kaynak: `Minister of Health order No. 34 of 21 August 2023, annex (https://lex.uz/docs/-6590070, read 2026-10-14). ${TELIF}` },
  },
  {
    anahtar: 'uz-retsept-qaydi', roller: UZ_HEKIM_ROLLERI, sinif: 'hekimler',
    metin: {
      ad: u('Retsept qaydi', 'Рецепт қайди', 'Запись рецепта'),
      aciklama: u('Asosiy dori vositalari ilovasidan bir qator, siz yozgan miqdor va qoʻllash yoʻli. Qayd pushti giyohvandlik blankasi emas va hech qayerga yuborilmaydi.', 'Асосий дори воситалари иловасидан бир қатор, сиз ёзган миқдор ва қўллаш йўли. Қайд пушти гиёҳвандлик бланкаси эмас ва ҳеч қаерга юборилмайди.', 'Одна строка приложения основных лекарственных средств, количество и способ применения, которые написали вы. Запись не является розовым бланком на наркотическое средство и никуда не отправляется.'),
      alanlar: {
        dori: u('Dori', 'Дори', 'Лекарственное средство'),
        miqdor: u('Miqdor, oʻzingiz yozasiz (ixtiyoriy)', 'Миқдор, ўзингиз ёзасиз (ихтиёрий)', 'Количество, его пишете вы (необязательно)'),
        yol: u('Qoʻllash yoʻli, oʻzingiz yozasiz (ixtiyoriy)', 'Қўллаш йўли, ўзингиз ёзасиз (ихтиёрий)', 'Способ применения, его пишете вы (необязательно)'),
      },
      secenekler: { dori: doriSecenekleri() },
      sayilar: {
        sira: u('Ilovadagi oʻrni', 'Иловадаги ўрни', 'Место в приложении'),
        miqdor: u('Miqdor', 'Миқдор', 'Количество'),
      },
      uyarilar: {
        royxat: u('Miqdor sizniki: vosita dozani tanlamaydi. Ilovadagi doza shu qatorning shakli.', 'Миқдор сизники: восита дозани танламайди. Иловадаги доза шу қаторнинг шакли.', 'Количество ваше: инструмент дозу не выбирает. Доза в приложении — это форма этой строки.'),
        yuborilmadi: u('Bu qayd dorixonaga, toʻlovchiga yoki davlat yozuviga yuborilmaydi va pushti giyohvandlik blankasi emas.', 'Бу қайд дорихонага, тўловчига ёки давлат ёзувига юборилмайди ва пушти гиёҳвандлик бланкаси эмас.', 'Эта запись не отправляется в аптеку, плательщику или в государственную запись и не является розовым бланком на наркотическое средство.'),
      },
      not: u('Giyohvandlik vositasi uchun alohida qoidalar boshqa vositada. Bu yerda ular tekshirilmaydi.', 'Гиёҳвандлик воситаси учун алоҳида қоидалар бошқа воситада. Бу ерда улар текширилмайди.', 'Отдельные правила для наркотического средства — в другом инструменте. Здесь они не проверяются.'),
    },
    lisans: { durum: 'serbest', kaynak: `The annex supplies the name, the form and the strength (https://lex.uz/docs/-6590070, read 2026-10-14). The note is the product's own and is not a state blank. ${TELIF}` },
  },
  {
    anahtar: 'uz-giyohvand-qoidalari', roller: UZ_HEKIM_ROLLERI, sinif: 'hekimler',
    metin: {
      ad: u('Giyohvandlik vositasi retsepti', 'Гиёҳвандлик воситаси рецепти', 'Рецепт на наркотическое средство'),
      aciklama: u('2025-yil 27-yanvardagi 3604-son buyruqning 33, 34, 36 va 37-bandlarida yozilgan talablarni belgilaysiz. Vosita blankani tekshirmaydi va yubormaydi.', '2025-йил 27-январдаги 3604-сон буйруқнинг 33, 34, 36 ва 37-бандларида ёзилган талабларни белгилайсиз. Восита бланкани текширмайди ва юбормайди.', 'Вы отмечаете требования, изложенные в пунктах 33, 34, 36 и 37 приказа № 3604 от 27 января 2025 года. Инструмент бланк не проверяет и не отправляет.'),
      alanlar: {
        muassasa: u('Muassasa shtampi, dumaloq muhri, imzo va shaxsiy muhr', 'Муассаса штампи, думалоқ муҳри, имзо ва шахсий муҳр', 'Штамп учреждения, круглая печать, подпись и личная печать'),
        rahbar: u('Rahbar yoki davolash ishlari boʻyicha oʻrinbosar imzo chekkan', 'Раҳбар ёки даволаш ишлари бўйича ўринбосар имзо чеккан', 'Подписал руководитель или заместитель по лечебной работе'),
        lotin_yozuv: u('Xalqaro nom, tarkib, shakl va tayyorlash-berish koʻrsatmasi lotin yozuvida', 'Халқаро ном, таркиб, шакл ва тайёрлаш-бериш кўрсатмаси лотин ёзувида', 'Международное наименование, состав, форма и указание по изготовлению и отпуску — латинской записью'),
        davlat_tili: u('Qoʻllash usuli davlat tilida', 'Қўллаш усули давлат тилида', 'Способ применения на государственном языке'),
        tartib: u('Avval giyohvandlik vositasining nomi, keyin boshqa tarkib', 'Аввал гиёҳвандлик воситасининг номи, кейин бошқа таркиб', 'Сначала наименование наркотического средства, затем прочий состав'),
        bitta_nom: u('Blankada faqat bitta nom', 'Бланкада фақат битта ном', 'На бланке только одно наименование'),
        yetti_miqdor: u('Miqdor yetti kunlik ehtiyojdan oshmaydi', 'Миқдор етти кунлик эҳтиёждан ошмайди', 'Количество не выше потребности на семь дней'),
        yetti_kun: u('Bunday retsept yetti kun haqiqiy, deb qayd etildi', 'Бундай рецепт етти кун ҳақиқий, деб қайд этилди', 'Отмечено, что такой рецепт действителен семь дней'),
        narkoz_yoq: u('Ambulator bemor uchun narkoz preparati emas', 'Амбулатор бемор учун наркоз препарати эмас', 'Это не препарат для наркоза амбулаторному пациенту'),
      },
      sayilar: { isaretli: u('Belgilangan bandlar', 'Белгиланган бандлар', 'Отмеченные пункты') },
      uyarilar: {
        toliq_emas: u('Hamma band belgilanmagan: buyruq boʻyicha toʻldirilmagan retsept yaroqsiz hisoblanadi.', 'Ҳамма банд белгиланмаган: буйруқ бўйича тўлдирилмаган рецепт яроқсиз ҳисобланади.', 'Отмечены не все пункты: по приказу рецепт, заполненный не полностью, считается недействительным.'),
        yuborilmadi: u('Bu ekran pushti blanka emas va dorixonaga yuborilmaydi.', 'Бу экран пушти бланка эмас ва дорихонага юборилмайди.', 'Этот экран не является розовым бланком и в аптеку не отправляется.'),
      },
      not: u('Faqat shu toʻrt band. Boshqa ilovalar ochilmagan. Qaror shifokorniki.', 'Фақат шу тўрт банд. Бошқа иловалар очилмаган. Қарор шифокорники.', 'Только эти четыре пункта. Другие приложения не открывались. Решение принимает врач.'),
    },
    lisans: { durum: 'serbest', kaynak: `Order No. 3604 of 27 January 2025, paragraphs 33, 34, 36 and 37 (https://lex.uz/uz/docs/-7349574, read 2026-10-14). ${TELIF}` },
  },
  {
    anahtar: 'uz-emlash-taqvimi', roller: ['pediatri', 'aile-hekimligi'],
    metin: {
      ad: u('Profilaktik emlashlar varaqasi', 'Профилактик эмлашлар варақаси', 'Лист профилактических прививок'),
      aciklama: u('Sanitariya xizmati varaqasidagi yosh va vaksina turini belgilaysiz. Varaqada yetib olish qoidasi va chiqarilgan sana yoʻq.', 'Санитария хизмати варақасидаги ёш ва вакцина турини белгилайсиз. Варақада етиб олиш қоидаси ва чиқарилган сана йўқ.', 'Вы отмечаете возраст и вид вакцины с листа санитарной службы. На листе нет правила наверстывания и нет даты выпуска.'),
      alanlar: {
        kun1: u('1-sutka: gepatit B ga qarshi vaksina, 1-doza', '1-сутка: гепатит B га қарши вакцина, 1-доза', '1-е сутки: вакцина против гепатита В, доза 1'),
        kun2: u('2–5-kun: silga qarshi vaksina, 1-doza', '2–5-кун: силга қарши вакцина, 1-доза', '2–5-й день: вакцина против туберкулёза, доза 1'),
        oy2: u('2 oylik: ogʻiz orqali poliomielit, rotavirus, pentavalent vaksina va pnevmokokk, har birining 1-dozasi', '2 ойлик: оғиз орқали полиомиэлит, ротавирус, пентавалент вакцина ва пневмококк, ҳар бирининг 1-дозаси', '2 месяца: оральная полиомиелитная, ротавирусная, пентавалентная вакцина и пневмококковая, доза 1 каждой'),
        oy3: u('3 oylik: ogʻiz orqali poliomielit, rotavirus, pentavalent vaksina va pnevmokokk, har birining 2-dozasi', '3 ойлик: оғиз орқали полиомиэлит, ротавирус, пентавалент вакцина ва пневмококк, ҳар бирининг 2-дозаси', '3 месяца: оральная полиомиелитная, ротавирусная, пентавалентная вакцина и пневмококковая, доза 2 каждой'),
        oy4: u('4 oylik: ogʻiz orqali poliomielit, rotavirus va pentavalent vaksinaning 3-dozasi, inaktivlangan poliomielit', '4 ойлик: оғиз орқали полиомиэлит, ротавирус ва пентавалент вакцинанинг 3-дозаси, инактивланган полиомиэлит', '4 месяца: доза 3 оральной полиомиелитной, ротавирусной и пентавалентной вакцины, инактивированная полиомиелитная'),
        oy12: u('12 oylik: qizamiq, parotit va qizilchaning 1-dozasi, pnevmokokkning 3-dozasi', '12 ойлик: қизамиқ, паротит ва қизилчанинг 1-дозаси, пневмококкнинг 3-дозаси', '12 месяцев: доза 1 против кори, паротита и краснухи, доза 3 пневмококковой'),
        oy16: u('16 oylik: ogʻiz orqali poliomielitning 4-dozasi, difteriya-koʻkyoʻtal-qoqsholning 4-dozasi', '16 ойлик: оғиз орқали полиомиэлитнинг 4-дозаси, дифтерия-кўкйўтал-қоқшолнинг 4-дозаси', '16 месяцев: доза 4 оральной полиомиелитной, доза 4 против дифтерии, коклюша и столбняка'),
        yosh6: u('6 yosh: qizamiq, parotit va qizilchaning 2-dozasi', '6 ёш: қизамиқ, паротит ва қизилчанинг 2-дозаси', '6 лет: доза 2 против кори, паротита и краснухи'),
        yosh7: u('7 yosh, 1-sinf: ogʻiz orqali poliomielitning 5-dozasi, difteriya va qoqshol', '7 ёш, 1-синф: оғиз орқали полиомиэлитнинг 5-дозаси, дифтерия ва қоқшол', '7 лет, 1-й класс: доза 5 оральной полиомиелитной, дифтерия и столбняк'),
        yosh9: u('9–13 yosh: odam papillomasi virusi. Varaqada jins va dozalar oraligʻi yoʻq', '9–13 ёш: одам папилломаси вируси. Варақада жинс ва дозалар оралиғи йўқ', '9–13 лет: вирус папилломы человека. На листе нет пола и нет интервала между дозами'),
        yosh16: u('16 yosh: difteriya va qoqshol', '16 ёш: дифтерия ва қоқшол', '16 лет: дифтерия и столбняк'),
      },
      sayilar: { isaretli: u('Belgilangan yoshlar', 'Белгиланган ёшлар', 'Отмеченные возрасты') },
      uyarilar: {
        varaqa: u('Varaqada yetib olish qoidasi yoʻq. 2024-yil 22-noyabrdagi qaror kalendarni qayta koʻrib chiqishni topshirgan; yangi matn ochilmagan.', 'Варақада етиб олиш қоидаси йўқ. 2024-йил 22-ноябрьдаги қарор календарни қайта кўриб чиқишни топширган; янги матн очилмаган.', 'На листе нет правила наверстывания. Постановление от 22 ноября 2024 года поручает пересмотреть календарь; новый текст не открывался.'),
      },
      not: u('Faqat varaqadagi yoshlar. Kattalar uchun alohida jadval varaqada yoʻq. Qaror shifokorniki.', 'Фақат варақадаги ёшлар. Катталар учун алоҳида жадвал варақада йўқ. Қарор шифокорники.', 'Только возрасты с листа. Отдельной таблицы для взрослых на листе нет. Решение принимает врач.'),
    },
    lisans: { durum: 'serbest', kaynak: `Flyer of the sanitary-epidemiological service (https://emlash.sanepid.uz/upload/Calendar_new_a5_flyer_uzb.pdf, opened 2026-10-14). The flyer carries no licence notice and no issue date. ${TELIF}` },
  },
]
