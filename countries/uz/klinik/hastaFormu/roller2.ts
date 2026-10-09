/**
 * NOTYA-ULKE-INTAKE-01 — Uzbekistan: THE ROLE QUESTIONS of the intake form, part 2 of 3 — thirteen doctor
 * specialties (otorhinolaryngology … medical rehabilitation, in the order of ../rolAdlari.ts).
 *
 * MACHINE-WRITTEN. EVERY SET AWAITS A LOCAL CLINICIAN OF THAT SPECIALTY AND A NATIVE READER. PATIENT-FACING.
 * Everything said at the top of ./roller1.ts holds here: structure from the Turkish forms and no text of them;
 * impersonal wording; no reference content (what was left out has a marked slot in ./yerelIcerik.ts); one role per
 * question, keys marked with the role's two letters.
 *
 * Paediatrics is written about the child throughout: its patients are children, and the form is the guardian's.
 */
import type { RolSorulari } from '@/lib/ulke/intake/tipler'
import { BALL, cok, eh, GRAMM, HA_YOQ_BILMAYMAN, KIMDA, kisa, KORSATKICH, MAKINE, olcu, QACHON, QACHON_NATIJA, QANDAY, s, son, tek, u, uzun, YOQ } from './yardimci'

const HECH_BIRI = (latin = 'Hech biri aniqlanmagan', kirill = 'Ҳеч бири аниқланмаган', ruscha = 'Ничего не выявлено') => ({ ...s('yoq', latin, kirill, ruscha), tek: true })
const OGRIQ_KUCHI = u('Ogʻriq qanchalik kuchli? (0 — ogʻriq yoʻq, 10 — chidab boʻlmaydi)', 'Оғриқ қанчалик кучли? (0 — оғриқ йўқ, 10 — чидаб бўлмайди)', 'Насколько сильная боль? (0 — боли нет, 10 — невыносимая)')
const VOSITA = u('Foydalaniladigan yordamchi vositalar (ortez, protez, hassa va boshqalar)', 'Фойдаланиладиган ёрдамчи воситалар (ортез, протез, ҳасса ва бошқалар)', 'Используемые вспомогательные средства (ортез, протез, трость и другое)')

export const UZ_ROL_SORULARI_2: Readonly<Record<string, RolSorulari>> = {
  'kulak-burun-bogaz': {
    baslik: u('Quloq, burun va tomoq shikoyati', 'Қулоқ, бурун ва томоқ шикояти', 'Жалобы на ухо, нос и горло'),
    inceleme: MAKINE,
    sorular: [
      cok('lo_belgilar', u('Quyidagilardan qaysilari bezovta qilyapti?', 'Қуйидагилардан қайсилари безовта қиляпти?', 'Что из перечисленного беспокоит?'), [
        s('quloq_ogriq', 'Quloq ogʻrigʻi', 'Қулоқ оғриғи', 'Боль в ухе'),
        s('eshitish', 'Eshitishning pasayishi', 'Эшитишнинг пасайиши', 'Снижение слуха'),
        s('shovqin', 'Quloqda shovqin', 'Қулоқда шовқин', 'Шум в ушах'),
        s('burun', 'Burun bitishi', 'Бурун битиши', 'Заложенность носа'),
        s('burun_qon', 'Burundan qon ketishi', 'Бурундан қон кетиши', 'Носовое кровотечение'),
        s('tomoq', 'Tomoq ogʻrigʻi', 'Томоқ оғриғи', 'Боль в горле'),
        s('ovoz', 'Ovoz boʻgʻilishi', 'Овоз бўғилиши', 'Осиплость голоса'),
        s('bosh_aylanishi', 'Bosh aylanishi', 'Бош айланиши', 'Головокружение'),
        YOQ(),
      ]),
      tek('lo_tomon', u('Shikoyat qaysi tomonda?', 'Шикоят қайси томонда?', 'С какой стороны жалоба?'), [
        s('ong', 'Oʻng tomonda', 'Ўнг томонда', 'Справа'),
        s('chap', 'Chap tomonda', 'Чап томонда', 'Слева'),
        s('ikkala', 'Ikkala tomonda', 'Иккала томонда', 'С обеих сторон'),
        s('tegishsiz', 'Bir tomonga bogʻliq emas', 'Бир томонга боғлиқ эмас', 'Не связано со стороной'),
      ]),
      eh('lo_tashxis', u('Quloq, burun yoki tomoq kasalligi aniqlanganmi?', 'Қулоқ, бурун ёки томоқ касаллиги аниқланганми?', 'Выявлено ли заболевание уха, носа или горла?'), QANDAY),
      eh('lo_operatsiya', u('Quloq, burun yoki tomoqda operatsiya boʻlganmi?', 'Қулоқ, бурун ёки томоқда операция бўлганми?', 'Была ли операция на ухе, носе или горле?'), QACHON),
      eh('lo_shovqin', u('Ish yoki mashgʻulot baland shovqin bilan bogʻliqmi?', 'Иш ёки машғулот баланд шовқин билан боғлиқми?', 'Связана ли работа или занятия с сильным шумом?')),
    ],
  },

  nefroloji: {
    baslik: u('Buyrak salomatligi', 'Буйрак саломатлиги', 'Здоровье почек'),
    inceleme: MAKINE,
    sorular: [
      cok('nf_belgilar', u('Quyidagilardan qaysilari bezovta qilyapti?', 'Қуйидагилардан қайсилари безовта қиляпти?', 'Что из перечисленного беспокоит?'), [
        s('shish', 'Oyoq yoki yuzda shish', 'Оёқ ёки юзда шиш', 'Отёки ног или лица'),
        s('miqdor', 'Siydik miqdorining oʻzgarishi', 'Сийдик миқдорининг ўзгариши', 'Изменение количества мочи'),
        s('rang', 'Siydik rangining oʻzgarishi', 'Сийдик рангининг ўзгариши', 'Изменение цвета мочи'),
        s('bel', 'Belda ogʻriq', 'Белда оғриқ', 'Боль в пояснице'),
        s('holsizlik', 'Holsizlik', 'Ҳолсизлик', 'Слабость'),
        YOQ(),
      ]),
      eh('nf_tashxis', u('Buyrak kasalligi aniqlanganmi?', 'Буйрак касаллиги аниқланганми?', 'Выявлено ли заболевание почек?'), QANDAY),
      tek('nf_dializ', u('Dializ oʻtkazilganmi?', 'Диализ ўтказилганми?', 'Проводился ли диализ?'), [
        s('yoq', 'Yoʻq', 'Йўқ', 'Нет'),
        s('avval', 'Avval oʻtkazilgan', 'Аввал ўтказилган', 'Проводился раньше'),
        s('hozir', 'Hozir oʻtkazilmoqda', 'Ҳозир ўтказилмоқда', 'Проводится сейчас'),
      ]),
      eh('nf_bosim', u('Qon bosimi uyda oʻlchanadimi?', 'Қон босими уйда ўлчанадими?', 'Измеряется ли артериальное давление дома?'), KORSATKICH),
      kisa('nf_tahlil', u('Oxirgi qon va siydik tahlili qachon topshirilgan?', 'Охирги қон ва сийдик таҳлили қачон топширилган?', 'Когда в последний раз сдавались анализы крови и мочи?')),
      eh('nf_oila', u('Oilada buyrak kasalliklari bormi?', 'Оилада буйрак касалликлари борми?', 'Есть ли в семье заболевания почек?'), KIMDA),
    ],
  },

  noroloji: {
    baslik: u('Nevrolog qabuli', 'Невролог қабули', 'Приём невролога'),
    inceleme: MAKINE,
    sorular: [
      cok('nv_belgilar', u('Quyidagilardan qaysilari bezovta qilyapti?', 'Қуйидагилардан қайсилари безовта қиляпти?', 'Что из перечисленного беспокоит?'), [
        s('bosh', 'Bosh ogʻrigʻi', 'Бош оғриғи', 'Головная боль'),
        s('bosh_aylanishi', 'Bosh aylanishi', 'Бош айланиши', 'Головокружение'),
        s('uvishish', 'Uvishish yoki sanchish', 'Увишиш ёки санчиш', 'Онемение или покалывание'),
        s('kuchsizlik', 'Qoʻl yoki oyoqda kuchsizlik', 'Қўл ёки оёқда кучсизлик', 'Слабость в руке или ноге'),
        s('muvozanat', 'Muvozanat buzilishi', 'Мувозанат бузилиши', 'Нарушение равновесия'),
        s('xotira', 'Xotira yoki diqqat pasayishi', 'Хотира ёки диққат пасайиши', 'Снижение памяти или внимания'),
        s('uyqu', 'Uyqu buzilishi', 'Уйқу бузилиши', 'Нарушение сна'),
        YOQ(),
      ]),
      tek('nv_hush', u('Hushdan ketish yoki tutqanoq boʻlganmi?', 'Ҳушдан кетиш ёки тутқаноқ бўлганми?', 'Были ли обмороки или судорожные приступы?'), [
        s('yoq', 'Yoʻq', 'Йўқ', 'Нет'),
        s('hush', 'Hushdan ketish', 'Ҳушдан кетиш', 'Обморок'),
        s('tutqanoq', 'Tutqanoq', 'Тутқаноқ', 'Судорожный приступ'),
        s('ikkalasi', 'Ikkalasi ham', 'Иккаласи ҳам', 'И то, и другое'),
      ]),
      eh('nv_tashxis', u('Nevrologik kasallik aniqlanganmi?', 'Неврологик касаллик аниқланганми?', 'Выявлено ли неврологическое заболевание?'), QANDAY),
      eh('nv_tekshiruv', u('Bosh miya yoki asab tizimi tekshiruvi qilinganmi?', 'Бош мия ёки асаб тизими текшируви қилинганми?', 'Проводилось ли обследование головного мозга или нервной системы?'), QACHON_NATIJA),
      eh('nv_oila', u('Oilada nevrologik kasalliklar bormi?', 'Оилада неврологик касалликлар борми?', 'Есть ли в семье неврологические заболевания?'), KIMDA),
    ],
  },

  onkoloji: {
    baslik: u('Onkolog qabuli', 'Онколог қабули', 'Приём онколога'),
    inceleme: MAKINE,
    sorular: [
      uzun('on_tashxis', u('Tashxis qoʻyilgan boʻlsa: qanday va qachon?', 'Ташхис қўйилган бўлса: қандай ва қачон?', 'Если диагноз поставлен: какой и когда?')),
      cok('on_davolash', u('Qanday davolash oʻtkazilgan?', 'Қандай даволаш ўтказилган?', 'Какое лечение проводилось?'), [
        s('operatsiya', 'Operatsiya', 'Операция', 'Операция'),
        s('kimyo', 'Kimyoterapiya', 'Кимётерапия', 'Химиотерапия'),
        s('nur', 'Nur terapiyasi', 'Нур терапияси', 'Лучевая терапия'),
        s('boshqa', 'Boshqa dori bilan davolash', 'Бошқа дори билан даволаш', 'Другое лекарственное лечение'),
        HECH_BIRI('Davolash hali boshlanmagan', 'Даволаш ҳали бошланмаган', 'Лечение ещё не начато'),
      ]),
      kisa('on_bosqich', u('Davolash hozir qaysi bosqichda?', 'Даволаш ҳозир қайси босқичда?', 'На каком этапе сейчас лечение?')),
      cok('on_belgilar', u('Quyidagilardan qaysilari bezovta qilyapti?', 'Қуйидагилардан қайсилари безовта қиляпти?', 'Что из перечисленного беспокоит?'), [
        s('ogriq', 'Ogʻriq', 'Оғриқ', 'Боль'),
        s('holsizlik', 'Holsizlik', 'Ҳолсизлик', 'Слабость'),
        s('ishtaha', 'Ishtaha pasayishi', 'Иштаҳа пасайиши', 'Снижение аппетита'),
        s('vazn', 'Vazn kamayishi', 'Вазн камайиши', 'Снижение веса'),
        s('kongil', 'Koʻngil aynishi', 'Кўнгил айниши', 'Тошнота'),
        YOQ(),
      ]),
      son('on_ogriq', OGRIQ_KUCHI, BALL, 0, 10),
      eh('on_oila', u('Oilada onkologik kasalliklar boʻlganmi?', 'Оилада онкологик касалликлар бўлганми?', 'Были ли в семье онкологические заболевания?'), KIMDA),
    ],
  },

  ortopedi: {
    baslik: u('Suyak va boʻgʻimlar shikoyati', 'Суяк ва бўғимлар шикояти', 'Жалобы на кости и суставы'),
    inceleme: MAKINE,
    sorular: [
      kisa('to_joy', u('Ogʻriq yoki shikoyat tananing qaysi qismida?', 'Оғриқ ёки шикоят тананинг қайси қисмида?', 'В какой части тела боль или жалоба?'), { zorunlu: true }),
      eh('to_jarohat', u('Shikoyat jarohatdan (yiqilish, urilish) keyin boshlandimi?', 'Шикоят жароҳатдан (йиқилиш, урилиш) кейин бошландими?', 'Началась ли жалоба после травмы (падение, удар)?'),
        u('Nima boʻlgan va qachon?', 'Нима бўлган ва қачон?', 'Что произошло и когда?')),
      cok('to_belgilar', u('Quyidagilardan qaysilari bor?', 'Қуйидагилардан қайсилари бор?', 'Что из перечисленного есть?'), [
        s('shish', 'Shish', 'Шиш', 'Отёк'),
        s('harakat', 'Harakat cheklanishi', 'Ҳаракат чекланиши', 'Ограничение движений'),
        s('uvishish', 'Uvishish', 'Увишиш', 'Онемение'),
        s('kuchsizlik', 'Kuchsizlik', 'Кучсизлик', 'Слабость'),
        s('beqarorlik', 'Boʻgʻimning beqarorligi yoki tiqilib qolishi', 'Бўғимнинг беқарорлиги ёки тиқилиб қолиши', 'Неустойчивость или заклинивание сустава'),
        YOQ(),
      ]),
      eh('to_tashxis', u('Suyak yoki boʻgʻim kasalligi aniqlanganmi?', 'Суяк ёки бўғим касаллиги аниқланганми?', 'Выявлено ли заболевание костей или суставов?'), QANDAY),
      eh('to_tasvir', u('Rentgen, KT yoki MRT qilinganmi?', 'Рентген, КТ ёки МРТ қилинганми?', 'Проводились ли рентген, КТ или МРТ?'), QACHON_NATIJA),
      kisa('to_vosita', VOSITA),
    ],
  },

  pediatri: {
    baslik: u('Bola haqida', 'Бола ҳақида', 'О ребёнке'),
    inceleme: MAKINE,
    sorular: [
      tek('pd_tugilish', u('Bola qachon tugʻilgan?', 'Бола қачон туғилган?', 'Когда родился ребёнок?'), [
        s('muddatida', 'Muddatida', 'Муддатида', 'В срок'),
        s('oldin', 'Muddatidan oldin', 'Муддатидан олдин', 'Раньше срока'),
        s('bilmayman', 'Bilmayman', 'Билмайман', 'Не знаю'),
      ]),
      tek('pd_tugruq', u('Tugʻruq qanday boʻlgan?', 'Туғруқ қандай бўлган?', 'Какими были роды?'), [
        s('tabiiy', 'Tabiiy yoʻl bilan', 'Табиий йўл билан', 'Естественные'),
        s('kesarcha', 'Kesarcha kesish', 'Кесарча кесиш', 'Кесарево сечение'),
        s('bilmayman', 'Bilmayman', 'Билмайман', 'Не знаю'),
      ]),
      son('pd_vazn', u('Tugʻilgandagi vazni', 'Туғилгандаги вазни', 'Вес при рождении'), GRAMM, 300, 7000),
      olcu('pd_boy', u('Tugʻilgandagi boʻyi', 'Туғилгандаги бўйи', 'Рост при рождении'), 'boy'),
      eh('pd_tugruqdan_keyin', u('Tugʻilgandan keyingi kunlarda muammo boʻlganmi?', 'Туғилгандан кейинги кунларда муаммо бўлганми?', 'Были ли проблемы в первые дни после рождения?'), QANDAY),
      cok('pd_ovqat', u('Bola hozir qanday ovqatlanadi?', 'Бола ҳозир қандай овқатланади?', 'Как ребёнок питается сейчас?'), [
        s('ona_suti', 'Ona suti', 'Она сути', 'Грудное молоко'),
        s('aralashma', 'Sunʼiy aralashma', 'Сунъий аралашма', 'Молочная смесь'),
        s('qoshimcha', 'Qoʻshimcha ovqat berila boshlangan', 'Қўшимча овқат берила бошланган', 'Начат прикорм'),
        s('umumiy', 'Oila bilan birga ovqatlanadi', 'Оила билан бирга овқатланади', 'Ест вместе с семьёй'),
      ]),
      tek('pd_emlash', u('Bolaning emlashlari oʻz vaqtida qilinganmi (bilishingizcha)?', 'Боланинг эмлашлари ўз вақтида қилинганми (билишингизча)?', 'Сделаны ли ребёнку прививки вовремя (насколько вам известно)?'), HA_YOQ_BILMAYMAN(),
        { yardim: u('Emlash daftarchasini koʻrikka olib keling.', 'Эмлаш дафтарчасини кўрикка олиб келинг.', 'Возьмите на приём документ о прививках.') }),
      tek('pd_muassasa', u('Bola bogʻcha yoki maktabga boradimi?', 'Бола боғча ёки мактабга борадими?', 'Ходит ли ребёнок в детский сад или школу?'), [
        s('uyda', 'Yoʻq, uyda', 'Йўқ, уйда', 'Нет, дома'),
        s('bogcha', 'Bogʻchaga boradi', 'Боғчага боради', 'Ходит в детский сад'),
        s('maktab', 'Maktabga boradi', 'Мактабга боради', 'Ходит в школу'),
      ]),
      eh('pd_rivojlanish', u('Bolaning rivojlanishi (oʻtirish, yurish, gapirish) boʻyicha xavotiringiz bormi?', 'Боланинг ривожланиши (ўтириш, юриш, гапириш) бўйича хавотирингиз борми?', 'Беспокоит ли вас развитие ребёнка (сидит, ходит, говорит)?'),
        u('Sizni nima xavotirga solyapti?', 'Сизни нима хавотирга соляпти?', 'Что именно вас беспокоит?')),
    ],
  },

  'plastik-cerrahi': {
    baslik: u('Plastik xirurg qabuli', 'Пластик хирург қабули', 'Приём пластического хирурга'),
    inceleme: MAKINE,
    sorular: [
      tek('pl_maqsad', u('Murojaat maqsadi', 'Мурожаат мақсади', 'Цель обращения'), [
        s('tiklash', 'Tiklash (jarohat, kuyish, nuqson oqibati)', 'Тиклаш (жароҳат, куйиш, нуқсон оқибати)', 'Восстановление (после травмы, ожога, дефекта)'),
        s('estetik', 'Estetik oʻzgarish', 'Эстетик ўзгариш', 'Эстетическое изменение'),
        s('bilmayman', 'Hali aniq emas', 'Ҳали аниқ эмас', 'Пока не определено'),
      ]),
      kisa('pl_soha', u('Tananing qaysi sohasi boʻyicha maslahat kerak?', 'Тананинг қайси соҳаси бўйича маслаҳат керак?', 'По какой области тела нужна консультация?')),
      eh('pl_avval', u('Avval plastik yoki estetik operatsiya boʻlganmi?', 'Аввал пластик ёки эстетик операция бўлганми?', 'Были ли раньше пластические или эстетические операции?'), QACHON),
      eh('pl_yara', u('Yaralarning sekin bitishi yoki qoʻpol chandiq qolishi kuzatilganmi?', 'Яраларнинг секин битиши ёки қўпол чандиқ қолиши кузатилганми?', 'Отмечалось ли медленное заживление ран или грубые рубцы?')),
      eh('pl_qon', u('Qon ketishiga moyillik yoki qon ivishining buzilishi aniqlanganmi?', 'Қон кетишига мойиллик ёки қон ивишининг бузилиши аниқланганми?', 'Выявлена ли склонность к кровотечениям или нарушение свёртываемости крови?')),
    ],
  },

  psikiyatri: {
    baslik: u('Ruhiy salomatlik', 'Руҳий саломатлик', 'Душевное здоровье'),
    inceleme: MAKINE,
    sorular: [
      cok('ps_belgilar', u('Oxirgi paytda quyidagilardan qaysilari bezovta qilyapti?', 'Охирги пайтда қуйидагилардан қайсилари безовта қиляпти?', 'Что из перечисленного беспокоит в последнее время?'), [
        s('tushkunlik', 'Kayfiyat tushkunligi', 'Кайфият тушкунлиги', 'Подавленное настроение'),
        s('xavotir', 'Kuchli xavotir', 'Кучли хавотир', 'Сильная тревога'),
        s('jahl', 'Jahldorlik', 'Жаҳлдорлик', 'Раздражительность'),
        s('qiziqish', 'Qiziqishning yoʻqolishi', 'Қизиқишнинг йўқолиши', 'Потеря интереса'),
        s('kuchsizlik', 'Kuch-quvvat yetishmasligi', 'Куч-қувват етишмаслиги', 'Нехватка сил'),
        s('diqqat', 'Diqqatni jamlash qiyinligi', 'Диққатни жамлаш қийинлиги', 'Трудно сосредоточиться'),
        YOQ(),
      ]),
      tek('ps_uyqu', u('Uyqu', 'Уйқу', 'Сон'), [
        s('ozgarmagan', 'Oʻzgarmagan', 'Ўзгармаган', 'Не изменился'),
        s('uyqusizlik', 'Uyqusizlik', 'Уйқусизлик', 'Бессонница'),
        s('kop', 'Odatdagidan koʻp uxlash', 'Одатдагидан кўп ухлаш', 'Сон дольше обычного'),
      ]),
      tek('ps_ishtaha', u('Ishtaha', 'Иштаҳа', 'Аппетит'), [
        s('ozgarmagan', 'Oʻzgarmagan', 'Ўзгармаган', 'Не изменился'),
        s('kamaygan', 'Kamaygan', 'Камайган', 'Снизился'),
        s('oshgan', 'Oshgan', 'Ошган', 'Повысился'),
      ]),
      eh('ps_avval', u('Avval ruhiy salomatlik boʻyicha mutaxassisga murojaat boʻlganmi?', 'Аввал руҳий саломатлик бўйича мутахассисга мурожаат бўлганми?', 'Было ли раньше обращение к специалисту по душевному здоровью?'),
        u('Qachon va qanday yordam koʻrsatilgan?', 'Қачон ва қандай ёрдам кўрсатилган?', 'Когда и какая помощь была оказана?')),
      uzun('ps_qiyin', u('Hozir eng koʻp nima qiynayapti?', 'Ҳозир энг кўп нима қийнаяпти?', 'Что сейчас беспокоит больше всего?')),
      eh('ps_oila', u('Oilada ruhiy salomatlik bilan bogʻliq kasalliklar boʻlganmi?', 'Оилада руҳий саломатлик билан боғлиқ касалликлар бўлганми?', 'Были ли в семье заболевания, связанные с душевным здоровьем?'), KIMDA),
    ],
  },

  radyoloji: {
    baslik: u('Tekshiruv oldidan', 'Текширув олдидан', 'Перед обследованием'),
    inceleme: MAKINE,
    sorular: [
      uzun('rd_tekshiruv', u('Qanday tekshiruv buyurilgan va nima sababdan?', 'Қандай текширув буюрилган ва нима сабабдан?', 'Какое обследование назначено и по какой причине?'), { zorunlu: true }),
      eh('rd_kontrast', u('Avval kontrast modda yuborilganda nojoʻya taʼsir boʻlganmi?', 'Аввал контраст модда юборилганда ножўя таъсир бўлганми?', 'Была ли раньше нежелательная реакция на введение контрастного вещества?'), QANDAY),
      eh('rd_metall', u('Tanada metall yoki oʻrnatilgan qurilma (kardiostimulyator, implant, protez) bormi?', 'Танада металл ёки ўрнатилган қурилма (кардиостимулятор, имплант, протез) борми?', 'Есть ли в теле металл или установленное устройство (кардиостимулятор, имплант, протез)?'), QANDAY),
      tek('rd_homila', u('Homiladorlik ehtimoli bormi?', 'Ҳомиладорлик эҳтимоли борми?', 'Возможна ли беременность?'), HA_YOQ_BILMAYMAN(), { kime: 'yetiskin', cinsiyet: 'female' }),
      eh('rd_buyrak', u('Buyrak faoliyatining buzilishi aniqlanganmi?', 'Буйрак фаолиятининг бузилиши аниқланганми?', 'Выявлено ли нарушение работы почек?')),
      eh('rd_yopiq', u('Yopiq, tor joyda qoʻrquv boʻladimi?', 'Ёпиқ, тор жойда қўрқув бўладими?', 'Бывает ли страх в закрытом, тесном пространстве?')),
      kisa('rd_avvalgi', u('Avval qilingan tekshiruvlar (qaysi va qachon)', 'Аввал қилинган текширувлар (қайси ва қачон)', 'Проведённые ранее обследования (какие и когда)')),
    ],
  },

  romatoloji: {
    baslik: u('Boʻgʻimlar shikoyati', 'Бўғимлар шикояти', 'Жалобы на суставы'),
    inceleme: MAKINE,
    sorular: [
      cok('rv_belgilar', u('Quyidagilardan qaysilari bezovta qilyapti?', 'Қуйидагилардан қайсилари безовта қиляпти?', 'Что из перечисленного беспокоит?'), [
        s('ogriq', 'Boʻgʻimlarda ogʻriq', 'Бўғимларда оғриқ', 'Боль в суставах'),
        s('shish', 'Boʻgʻimlarda shish', 'Бўғимларда шиш', 'Припухлость суставов'),
        s('qotish', 'Ertalab boʻgʻimlarning qotishi', 'Эрталаб бўғимларнинг қотиши', 'Утренняя скованность суставов'),
        s('mushak', 'Mushaklarda ogʻriq', 'Мушакларда оғриқ', 'Боль в мышцах'),
        s('toshma', 'Teri toshmasi', 'Тери тошмаси', 'Сыпь на коже'),
        s('qurish', 'Ogʻiz yoki koʻz qurishi', 'Оғиз ёки кўз қуриши', 'Сухость во рту или в глазах'),
        YOQ(),
      ]),
      kisa('rv_qotish', u('Ertalabki qotish boʻlsa, taxminan qancha davom etadi?', 'Эрталабки қотиш бўлса, тахминан қанча давом этади?', 'Если есть утренняя скованность, сколько примерно она длится?')),
      kisa('rv_bogimlar', u('Qaysi boʻgʻimlar bezovta qiladi?', 'Қайси бўғимлар безовта қилади?', 'Какие суставы беспокоят?')),
      eh('rv_tashxis', u('Revmatologik kasallik aniqlanganmi?', 'Ревматологик касаллик аниқланганми?', 'Выявлено ли ревматологическое заболевание?'), QANDAY),
      eh('rv_oila', u('Oilada boʻgʻim yoki revmatologik kasalliklar bormi?', 'Оилада бўғим ёки ревматологик касалликлар борми?', 'Есть ли в семье заболевания суставов или ревматологические заболевания?'), KIMDA),
    ],
  },

  uroloji: {
    baslik: u('Urolog qabuli', 'Уролог қабули', 'Приём уролога'),
    inceleme: MAKINE,
    sorular: [
      cok('ur_belgilar', u('Quyidagilardan qaysilari bezovta qilyapti?', 'Қуйидагилардан қайсилари безовта қиляпти?', 'Что из перечисленного беспокоит?'), [
        s('tez', 'Tez-tez siyish', 'Тез-тез сийиш', 'Частое мочеиспускание'),
        s('achishish', 'Siyishda ogʻriq yoki achishish', 'Сийишда оғриқ ёки ачишиш', 'Боль или жжение при мочеиспускании'),
        s('qon', 'Siydikda qon', 'Сийдикда қон', 'Кровь в моче'),
        s('tun', 'Tunda siyishga turish', 'Тунда сийишга туриш', 'Ночные подъёмы для мочеиспускания'),
        s('oqim', 'Siydik oqimining sustligi', 'Сийдик оқимининг сустлиги', 'Слабая струя мочи'),
        s('bel', 'Bel yoki yonboshda ogʻriq', 'Бел ёки ёнбошда оғриқ', 'Боль в пояснице или в боку'),
        YOQ(),
      ]),
      eh('ur_tosh', u('Buyrak yoki siydik yoʻllarida tosh boʻlganmi?', 'Буйрак ёки сийдик йўлларида тош бўлганми?', 'Были ли камни в почках или мочевых путях?'), QACHON),
      eh('ur_tashxis', u('Urologik kasallik aniqlanganmi?', 'Урологик касаллик аниқланганми?', 'Выявлено ли урологическое заболевание?'), QANDAY),
      eh('ur_muolaja', u('Urologik operatsiya yoki muolaja boʻlganmi?', 'Урологик операция ёки муолажа бўлганми?', 'Была ли урологическая операция или процедура?'), QACHON),
      eh('ur_oila', u('Oilada urologik kasalliklar bormi?', 'Оилада урологик касалликлар борми?', 'Есть ли в семье урологические заболевания?'), KIMDA),
    ],
  },

  'spor-hekimligi': {
    baslik: u('Sport shifokori qabuli', 'Спорт шифокори қабули', 'Приём спортивного врача'),
    inceleme: MAKINE,
    sorular: [
      kisa('sp_sport', u('Qaysi sport turi va haftada necha marta?', 'Қайси спорт тури ва ҳафтада неча марта?', 'Какой вид спорта и сколько раз в неделю?'), { zorunlu: true }),
      tek('sp_maqsad', u('Murojaat maqsadi', 'Мурожаат мақсади', 'Цель обращения'), [
        s('jarohat', 'Jarohat yoki ogʻriq', 'Жароҳат ёки оғриқ', 'Травма или боль'),
        s('ruxsat', 'Mashgʻulotlarga ruxsat uchun koʻrik', 'Машғулотларга рухсат учун кўрик', 'Осмотр для допуска к занятиям'),
        s('maslahat', 'Maslahat', 'Маслаҳат', 'Консультация'),
      ]),
      eh('sp_jarohat', u('Oxirgi bir yilda sport jarohati boʻlganmi?', 'Охирги бир йилда спорт жароҳати бўлганми?', 'Была ли за последний год спортивная травма?'),
        u('Qanday jarohat va qachon?', 'Қандай жароҳат ва қачон?', 'Какая травма и когда?')),
      cok('sp_belgilar', u('Mashgʻulot vaqtida quyidagilardan qaysilari kuzatiladi?', 'Машғулот вақтида қуйидагилардан қайсилари кузатилади?', 'Что из перечисленного бывает во время занятий?'), [
        s('ogriq', 'Koʻkrakda ogʻriq', 'Кўкракда оғриқ', 'Боль в груди'),
        s('hush', 'Hushdan ketish yoki bosh aylanishi', 'Ҳушдан кетиш ёки бош айланиши', 'Обморок или головокружение'),
        s('nafas', 'Odatdagidan kuchli nafas qisishi', 'Одатдагидан кучли нафас қисиши', 'Одышка сильнее обычной'),
        s('ritm', 'Yurak notekis urishi', 'Юрак нотекис уриши', 'Неровное сердцебиение'),
        YOQ(),
      ]),
      eh('sp_yurak', u('Avval yurak tekshiruvi qilinganmi?', 'Аввал юрак текшируви қилинганми?', 'Проводилось ли раньше обследование сердца?'), QACHON_NATIJA),
    ],
  },

  'fizik-tedavi': {
    baslik: u('Reabilitatsiya shifokori qabuli', 'Реабилитация шифокори қабули', 'Приём врача-реабилитолога'),
    inceleme: MAKINE,
    sorular: [
      kisa('rb_joy', u('Ogʻriq yoki cheklanish tananing qaysi qismida?', 'Оғриқ ёки чекланиш тананинг қайси қисмида?', 'В какой части тела боль или ограничение?')),
      son('rb_ogriq', OGRIQ_KUCHI, BALL, 0, 10),
      tek('rb_cheklov', u('Shikoyat kundalik ishlarni qanchalik cheklaydi?', 'Шикоят кундалик ишларни қанчалик чеклайди?', 'Насколько жалоба ограничивает повседневные дела?'), [
        s('yoq', 'Cheklamaydi', 'Чекламайди', 'Не ограничивает'),
        s('biroz', 'Biroz cheklaydi', 'Бироз чеклайди', 'Немного ограничивает'),
        s('sezilarli', 'Sezilarli cheklaydi', 'Сезиларли чеклайди', 'Заметно ограничивает'),
        s('toliq', 'Kundalik ishlarni bajarib boʻlmaydi', 'Кундалик ишларни бажариб бўлмайди', 'Повседневные дела выполнять невозможно'),
      ]),
      eh('rb_tashxis', u('Shifokor qoʻygan tashxis bormi?', 'Шифокор қўйган ташхис борми?', 'Есть ли диагноз, поставленный врачом?'), QANDAY),
      eh('rb_avval', u('Avval fizioterapiya yoki reabilitatsiya oʻtkazilganmi?', 'Аввал физиотерапия ёки реабилитация ўтказилганми?', 'Проводилась ли раньше физиотерапия или реабилитация?'), QACHON),
      kisa('rb_vosita', VOSITA),
    ],
  },
}
