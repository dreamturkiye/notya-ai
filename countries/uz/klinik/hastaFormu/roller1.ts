/**
 * NOTYA-ULKE-INTAKE-01 — Uzbekistan: THE ROLE QUESTIONS of the intake form, part 1 of 3 — seventeen doctor
 * specialties (emergency medicine … cardiology, in the order of ../rolAdlari.ts).
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * MACHINE-WRITTEN. EVERY SET AWAITS A LOCAL CLINICIAN OF THAT SPECIALTY AND A NATIVE READER (`inceleme` on each
 * set: written by a machine, read by nobody). PATIENT-FACING. Status per role: docs/COUNTRY-PACK-UZBEKISTAN.md.
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * STRUCTURE from the Turkish product's forms (which topics a cardiology or a dermatology intake covers); NO TEXT
 * COPIED OR TRANSLATED. Each set is the role's own section, shown after the core questions (./cekirdek.ts), which
 * already ask the reason for the visit, how long it has lasted, long-term conditions, operations, hospital stays,
 * regular medicines, allergies and family history — so a role does not ask those again.
 *
 * WORDING. Role questions are written IMPERSONALLY ("Is there chest pain?"), so that the same sentence is right for
 * an adult patient and for a parent answering about a child.
 *
 * NO REFERENCE CONTENT. No drug, brand, dose, schedule, normal value, score or scale is named; where a patient is
 * asked about medicines the answer is free text. LEFT OUT ON PURPOSE, each with a marked slot in ./yerelIcerik.ts:
 * red-flag ("go to emergency care now") check-lists, vaccination check-lists by the national calendar, screening
 * lists, validated questionnaires and scores, pre-operative instructions, imaging safety check-lists.
 *
 * LEAK RULE. A question is listed by ONE role. Keys carry the role's two-letter mark so that none repeats.
 */
import type { RolSorulari } from '@/lib/ulke/intake/tipler'
import { BALL, cok, DORI_NOMI, eh, gun, HA_YOQ_BILMAYMAN, HAFTA, KIMDA, kisa, KORSATKICH, MAKINE, MARTA, QACHON, QACHON_NATIJA, QANDAY, QAYSI, s, son, tek, u, uzun, YOQ } from './yardimci'

const yoqHaIshonchsiz = () => [s('yoq', 'Yoʻq', 'Йўқ', 'Нет'), s('ha', 'Ha', 'Ҳа', 'Да'), s('ishonchsiz', 'Ishonchim komil emas', 'Ишончим комил эмас', 'Не уверен(а)')]

export const UZ_ROL_SORULARI_1: Readonly<Record<string, RolSorulari>> = {
  'acil-tip': {
    baslik: u('Shoshilinch murojaat', 'Шошилинч мурожаат', 'Неотложное обращение'),
    inceleme: MAKINE,
    sorular: [
      tek('at_boshlanish', u('Shikoyat qanday boshlandi?', 'Шикоят қандай бошланди?', 'Как началась жалоба?'), [
        s('tosatdan', 'Toʻsatdan', 'Тўсатдан', 'Внезапно'),
        s('asta', 'Asta-sekin', 'Аста-секин', 'Постепенно'),
      ]),
      son('at_kuch', u('Shikoyat qanchalik kuchli? (0 — bezovta qilmaydi, 10 — chidab boʻlmaydi)', 'Шикоят қанчалик кучли? (0 — безовта қилмайди, 10 — чидаб бўлмайди)', 'Насколько сильно беспокоит жалоба? (0 — не беспокоит, 10 — невыносимо)'), BALL, 0, 10),
      cok('at_hamroh', u('Yana nimalar bezovta qilyapti?', 'Яна нималар безовта қиляпти?', 'Что ещё беспокоит?'), [
        s('isitma', 'Isitma', 'Иситма', 'Повышенная температура'),
        s('qusish', 'Koʻngil aynishi yoki qusish', 'Кўнгил айниши ёки қусиш', 'Тошнота или рвота'),
        s('bosh_aylanishi', 'Bosh aylanishi', 'Бош айланиши', 'Головокружение'),
        s('nafas', 'Nafas qisishi', 'Нафас қисиши', 'Одышка'),
        s('ogriq', 'Ogʻriq', 'Оғриқ', 'Боль'),
        YOQ(),
      ]),
      eh('at_avval', u('Avval ham shunday holat boʻlganmi?', 'Аввал ҳам шундай ҳолат бўлганми?', 'Бывало ли такое состояние раньше?'), QACHON),
      eh('at_jarohat', u('Shikoyat jarohat yoki baxtsiz hodisadan keyin boshlandimi?', 'Шикоят жароҳат ёки бахтсиз ҳодисадан кейин бошландими?', 'Началась ли жалоба после травмы или несчастного случая?'),
        u('Nima boʻlgan va qachon?', 'Нима бўлган ва қачон?', 'Что произошло и когда?')),
    ],
  },

  'aile-hekimligi': {
    baslik: u('Oilaviy shifokor qabuli', 'Оилавий шифокор қабули', 'Приём семейного врача'),
    inceleme: MAKINE,
    sorular: [
      tek('oh_maqsad', u('Tashrif maqsadi', 'Ташриф мақсади', 'Цель визита'), [
        s('tekshiruv', 'Umumiy tekshiruv (profilaktik koʻrik)', 'Умумий текширув (профилактик кўрик)', 'Общий (профилактический) осмотр'),
        s('shikoyat', 'Aniq shikoyat', 'Аниқ шикоят', 'Конкретная жалоба'),
        s('nazorat', 'Surunkali kasallik nazorati', 'Сурункали касаллик назорати', 'Наблюдение по хроническому заболеванию'),
        s('hujjat', 'Maʼlumotnoma yoki hujjat', 'Маълумотнома ёки ҳужжат', 'Справка или документ'),
      ]),
      cok('oh_belgilar', u('Quyidagilardan qaysilari bezovta qilyapti?', 'Қуйидагилардан қайсилари безовта қиляпти?', 'Что из перечисленного беспокоит?'), [
        s('holsizlik', 'Holsizlik', 'Ҳолсизлик', 'Слабость'),
        s('isitma', 'Isitma', 'Иситма', 'Повышенная температура'),
        s('yotal', 'Yoʻtal', 'Йўтал', 'Кашель'),
        s('vazn', 'Ishtaha yoki vazn oʻzgarishi', 'Иштаҳа ёки вазн ўзгариши', 'Изменение аппетита или веса'),
        s('uyqu', 'Uyqu buzilishi', 'Уйқу бузилиши', 'Нарушение сна'),
        s('ogriq', 'Ogʻriq', 'Оғриқ', 'Боль'),
        YOQ(),
      ]),
      eh('oh_tekshiruv', u('Oxirgi bir yil ichida tahlil yoki tekshiruvlar oʻtkazilganmi?', 'Охирги бир йил ичида таҳлил ёки текширувлар ўтказилганми?', 'Проводились ли за последний год анализы или обследования?'), QACHON_NATIJA),
      tek('oh_emlash', u('Emlashlar oʻz vaqtida qilinganmi (bilishingizcha)?', 'Эмлашлар ўз вақтида қилинганми (билишингизча)?', 'Сделаны ли прививки вовремя (насколько вам известно)?'), HA_YOQ_BILMAYMAN()),
      tek('oh_faollik', u('Jismoniy faollik', 'Жисмоний фаоллик', 'Физическая активность'), [
        s('kam', 'Deyarli harakatsiz', 'Деярли ҳаракатсиз', 'Почти нет'),
        s('bazan', 'Baʼzan', 'Баъзан', 'Иногда'),
        s('muntazam', 'Muntazam', 'Мунтазам', 'Регулярно'),
      ]),
    ],
  },

  anestezi: {
    baslik: u('Anesteziya oldidan', 'Анестезия олдидан', 'Перед анестезией'),
    inceleme: MAKINE,
    sorular: [
      uzun('an_amaliyot', u('Qanday operatsiya yoki muolaja rejalashtirilgan?', 'Қандай операция ёки муолажа режалаштирилган?', 'Какая операция или процедура планируется?'), { zorunlu: true }),
      eh('an_avvalgi', u('Avval narkoz (anesteziya) qoʻllanilganmi?', 'Аввал наркоз (анестезия) қўлланилганми?', 'Применялся ли раньше наркоз (анестезия)?'),
        u('Qachon va biror muammo boʻlganmi?', 'Қачон ва бирор муаммо бўлганми?', 'Когда и были ли какие-либо проблемы?')),
      eh('an_oila', u('Qarindoshlarda narkoz bilan bogʻliq jiddiy muammo boʻlganmi?', 'Қариндошларда наркоз билан боғлиқ жиддий муаммо бўлганми?', 'Были ли у родственников серьёзные проблемы, связанные с наркозом?'), KIMDA),
      eh('an_tish', u('Olinadigan tish protezi, qimirlaydigan tish yoki ogʻizda boshqa olinadigan narsa bormi?', 'Олинадиган тиш протези, қимирлайдиган тиш ёки оғизда бошқа олинадиган нарса борми?', 'Есть ли съёмный зубной протез, шатающийся зуб или что-либо съёмное во рту?')),
      cok('an_holat', u('Quyidagilardan qaysilari bor?', 'Қуйидагилардан қайсилари бор?', 'Что из перечисленного есть?'), [
        s('yurak', 'Yurak kasalligi', 'Юрак касаллиги', 'Заболевание сердца'),
        s('opka', 'Oʻpka kasalligi yoki astma', 'Ўпка касаллиги ёки астма', 'Заболевание лёгких или астма'),
        s('uyqu_nafas', 'Uyquda nafas toʻxtab qolishi', 'Уйқуда нафас тўхтаб қолиши', 'Остановки дыхания во сне'),
        s('qon_ivish', 'Qon ivishining buzilishi', 'Қон ивишининг бузилиши', 'Нарушение свёртываемости крови'),
        YOQ(),
      ]),
      eh('an_qon_dori', u('Qonni suyultiruvchi dori qabul qilinadimi?', 'Қонни суюлтирувчи дори қабул қилинадими?', 'Принимаются ли лекарства, разжижающие кровь?'), DORI_NOMI),
    ],
  },

  'beyin-cerrahisi': {
    baslik: u('Neyroxirurg qabuli', 'Нейрохирург қабули', 'Приём нейрохирурга'),
    inceleme: MAKINE,
    sorular: [
      cok('nx_belgilar', u('Quyidagilardan qaysilari bezovta qilyapti?', 'Қуйидагилардан қайсилари безовта қиляпти?', 'Что из перечисленного беспокоит?'), [
        s('bosh', 'Bosh ogʻrigʻi', 'Бош оғриғи', 'Головная боль'),
        s('bel', 'Boʻyin yoki bel ogʻrigʻi', 'Бўйин ёки бел оғриғи', 'Боль в шее или пояснице'),
        s('uvishish', 'Qoʻl yoki oyoqda uvishish', 'Қўл ёки оёқда увишиш', 'Онемение в руке или ноге'),
        s('kuchsizlik', 'Qoʻl yoki oyoqda kuchsizlik', 'Қўл ёки оёқда кучсизлик', 'Слабость в руке или ноге'),
        s('muvozanat', 'Muvozanat buzilishi', 'Мувозанат бузилиши', 'Нарушение равновесия'),
        s('korish', 'Koʻrishning oʻzgarishi', 'Кўришнинг ўзгариши', 'Изменение зрения'),
        YOQ(),
      ]),
      eh('nx_tasvir', u('Qoʻlingizda KT yoki MRT natijasi bormi?', 'Қўлингизда КТ ёки МРТ натижаси борми?', 'Есть ли у вас на руках результаты КТ или МРТ?'),
        u('Qaysi tekshiruv va qachon qilingan?', 'Қайси текширув ва қачон қилинган?', 'Какое обследование и когда сделано?')),
      eh('nx_tashxis', u('Bosh miya yoki umurtqa pogʻonasi kasalligi aniqlanganmi?', 'Бош мия ёки умуртқа поғонаси касаллиги аниқланганми?', 'Выявлено ли заболевание головного мозга или позвоночника?'), QANDAY),
      eh('nx_operatsiya', u('Bosh miya yoki umurtqa pogʻonasida operatsiya boʻlganmi?', 'Бош мия ёки умуртқа поғонасида операция бўлганми?', 'Была ли операция на головном мозге или позвоночнике?'), QACHON),
      eh('nx_jarohat', u('Bosh yoki umurtqa pogʻonasi jarohati boʻlganmi?', 'Бош ёки умуртқа поғонаси жароҳати бўлганми?', 'Была ли травма головы или позвоночника?'), QACHON),
    ],
  },

  'cocuk-cerrahisi': {
    baslik: u('Bolalar xirurgi qabuli', 'Болалар хирурги қабули', 'Приём детского хирурга'),
    inceleme: MAKINE,
    sorular: [
      cok('bx_belgilar', u('Bolada quyidagilardan qaysilari bor?', 'Болада қуйидагилардан қайсилари бор?', 'Что из перечисленного есть у ребёнка?'), [
        s('qorin', 'Qorin ogʻrigʻi', 'Қорин оғриғи', 'Боль в животе'),
        s('qusish', 'Qusish', 'Қусиш', 'Рвота'),
        s('isitma', 'Isitma', 'Иситма', 'Повышенная температура'),
        s('shish', 'Shish yoki boʻrtma', 'Шиш ёки бўртма', 'Припухлость или выпячивание'),
        s('siyish', 'Siyish bilan bogʻliq muammo', 'Сийиш билан боғлиқ муаммо', 'Трудности с мочеиспусканием'),
        s('ich', 'Ich kelishining buzilishi', 'Ич келишининг бузилиши', 'Нарушение стула'),
        YOQ(),
      ]),
      eh('bx_tugma', u('Bolada tugʻma nuqson yoki kasallik aniqlanganmi?', 'Болада туғма нуқсон ёки касаллик аниқланганми?', 'Выявлен ли у ребёнка врождённый порок или заболевание?'), QANDAY),
      tek('bx_ovqat', u('Oxirgi kunlarda bola odatdagidek ovqatlanyaptimi?', 'Охирги кунларда бола одатдагидек овқатланяптими?', 'Ест ли ребёнок в последние дни как обычно?'), [
        s('ha', 'Ha, odatdagidek', 'Ҳа, одатдагидек', 'Да, как обычно'),
        s('kam', 'Odatdagidan kam', 'Одатдагидан кам', 'Меньше обычного'),
        s('yemaydi', 'Deyarli yemayapti', 'Деярли емаяпти', 'Почти не ест'),
      ]),
      eh('bx_narkoz', u('Bolaga avval narkoz berilganmi?', 'Болага аввал наркоз берилганми?', 'Давали ли ребёнку раньше наркоз?'),
        u('Qachon va biror muammo boʻlganmi?', 'Қачон ва бирор муаммо бўлганми?', 'Когда и были ли какие-либо проблемы?')),
      tek('bx_emlash', u('Bolaning emlashlari oʻz vaqtida qilinganmi (bilishingizcha)?', 'Боланинг эмлашлари ўз вақтида қилинганми (билишингизча)?', 'Сделаны ли ребёнку прививки вовремя (насколько вам известно)?'), HA_YOQ_BILMAYMAN()),
    ],
  },

  dahiliye: {
    baslik: u('Terapevt qabuli', 'Терапевт қабули', 'Приём терапевта'),
    inceleme: MAKINE,
    sorular: [
      cok('tp_belgilar', u('Quyidagilardan qaysilari bezovta qilyapti?', 'Қуйидагилардан қайсилари безовта қиляпти?', 'Что из перечисленного беспокоит?'), [
        s('holsizlik', 'Holsizlik', 'Ҳолсизлик', 'Слабость'),
        s('isitma', 'Isitma', 'Иситма', 'Повышенная температура'),
        s('terlash', 'Tunda terlash', 'Тунда терлаш', 'Ночная потливость'),
        s('ishtaha', 'Ishtaha pasayishi', 'Иштаҳа пасайиши', 'Снижение аппетита'),
        s('bosh_aylanishi', 'Bosh aylanishi', 'Бош айланиши', 'Головокружение'),
        s('bogim', 'Boʻgʻimlarda ogʻriq', 'Бўғимларда оғриқ', 'Боль в суставах'),
        YOQ(),
      ]),
      tek('tp_vazn', u('Oxirgi oylarda vazn sababsiz oʻzgardimi?', 'Охирги ойларда вазн сабабсиз ўзгардими?', 'Менялся ли вес без причины за последние месяцы?'), [
        s('yoq', 'Yoʻq', 'Йўқ', 'Нет'),
        s('kamaydi', 'Kamaydi', 'Камайди', 'Снизился'),
        s('oshdi', 'Oshdi', 'Ошди', 'Увеличился'),
      ]),
      eh('tp_nazorat', u('Surunkali kasallik boʻyicha shifokor nazorati bormi?', 'Сурункали касаллик бўйича шифокор назорати борми?', 'Есть ли наблюдение у врача по хроническому заболеванию?'),
        u('Qaysi kasallik boʻyicha va oxirgi koʻrik qachon boʻlgan?', 'Қайси касаллик бўйича ва охирги кўрик қачон бўлган?', 'По какому заболеванию и когда был последний осмотр?')),
      kisa('tp_tahlil', u('Oxirgi qon tahlili qachon topshirilgan?', 'Охирги қон таҳлили қачон топширилган?', 'Когда в последний раз сдавался анализ крови?')),
      eh('tp_bosim', u('Qon bosimi uyda oʻlchab turiladimi?', 'Қон босими уйда ўлчаб туриладими?', 'Измеряется ли артериальное давление дома?'), KORSATKICH),
    ],
  },

  dermatoloji: {
    baslik: u('Teri shikoyati', 'Тери шикояти', 'Жалобы на кожу'),
    inceleme: MAKINE,
    sorular: [
      kisa('dv_joy', u('Teridagi oʻzgarish tananing qaysi qismida?', 'Теридаги ўзгариш тананинг қайси қисмида?', 'На какой части тела изменения кожи?')),
      cok('dv_belgilar', u('Quyidagilardan qaysilari bor?', 'Қуйидагилардан қайсилари бор?', 'Что из перечисленного есть?'), [
        s('qichishish', 'Qichishish', 'Қичишиш', 'Зуд'),
        s('toshma', 'Toshma', 'Тошма', 'Сыпь'),
        s('qizarish', 'Qizarish', 'Қизариш', 'Покраснение'),
        s('qipiqlanish', 'Qipiqlanish', 'Қипиқланиш', 'Шелушение'),
        s('achishish', 'Ogʻriq yoki achishish', 'Оғриқ ёки ачишиш', 'Боль или жжение'),
        s('xol', 'Hajmi yoki rangi oʻzgargan xol', 'Ҳажми ёки ранги ўзгарган хол', 'Родинка, изменившая размер или цвет'),
        YOQ(),
      ]),
      eh('dv_yangi_dori', u('Oxirgi ikki oy ichida yangi dori qabul qilish boshlanganmi?', 'Охирги икки ой ичида янги дори қабул қилиш бошланганми?', 'Начат ли за последние два месяца приём нового лекарства?'),
        u('Dorining nomi va qachondan beri', 'Дорининг номи ва қачондан бери', 'Название лекарства и с какого времени')),
      eh('dv_avval', u('Teri kasalligi avval aniqlanganmi?', 'Тери касаллиги аввал аниқланганми?', 'Выявлялось ли раньше заболевание кожи?'),
        u('Qanday kasallik va qanday davolangan?', 'Қандай касаллик ва қандай даволанган?', 'Какое заболевание и как его лечили?')),
      uzun('dv_vosita', u('Teriga qoʻllaniladigan vositalar (krem, malham, kosmetika)', 'Терига қўлланиладиган воситалар (крем, малҳам, косметика)', 'Средства, которые наносятся на кожу (крем, мазь, косметика)')),
      eh('dv_quyosh', u('Quyoshda kuyish tez-tez boʻladimi?', 'Қуёшда куйиш тез-тез бўладими?', 'Часто ли бывают солнечные ожоги?')),
    ],
  },

  endokrinoloji: {
    baslik: u('Endokrinolog qabuli', 'Эндокринолог қабули', 'Приём эндокринолога'),
    inceleme: MAKINE,
    sorular: [
      cok('en_belgilar', u('Quyidagilardan qaysilari bezovta qilyapti?', 'Қуйидагилардан қайсилари безовта қиляпти?', 'Что из перечисленного беспокоит?'), [
        s('chanqash', 'Koʻp chanqash', 'Кўп чанқаш', 'Сильная жажда'),
        s('siyish', 'Tez-tez siyish', 'Тез-тез сийиш', 'Частое мочеиспускание'),
        s('vazn', 'Vazn oʻzgarishi', 'Вазн ўзгариши', 'Изменение веса'),
        s('holsizlik', 'Holsizlik', 'Ҳолсизлик', 'Слабость'),
        s('terlash', 'Koʻp terlash yoki issiqqa chidamsizlik', 'Кўп терлаш ёки иссиққа чидамсизлик', 'Потливость или плохая переносимость жары'),
        s('yurak', 'Yurak tez urishi', 'Юрак тез уриши', 'Учащённое сердцебиение'),
        s('soch', 'Soch toʻkilishi', 'Соч тўкилиши', 'Выпадение волос'),
        YOQ(),
      ]),
      cok('en_tashxis', u('Qaysi kasallik aniqlangan?', 'Қайси касаллик аниқланган?', 'Какое заболевание выявлено?'), [
        s('diabet', 'Qandli diabet', 'Қандли диабет', 'Сахарный диабет'),
        s('qalqonsimon', 'Qalqonsimon bez kasalligi', 'Қалқонсимон без касаллиги', 'Заболевание щитовидной железы'),
        s('boshqa', 'Boshqa endokrin kasallik', 'Бошқа эндокрин касаллик', 'Другое эндокринное заболевание'),
        s('yoq', 'Hech biri aniqlanmagan', 'Ҳеч бири аниқланмаган', 'Ничего не выявлено'),
      ].map((x) => (x.anahtar === 'yoq' ? { ...x, tek: true } : x))),
      eh('en_qand', u('Qondagi qand miqdori uyda oʻlchanadimi?', 'Қондаги қанд миқдори уйда ўлчанадими?', 'Измеряется ли сахар крови дома?'), KORSATKICH),
      uzun('en_dori', u('Shu kasalliklar uchun qabul qilinayotgan dorilar (nomi, bilganingizcha)', 'Шу касалликлар учун қабул қилинаётган дорилар (номи, билганингизча)', 'Лекарства, которые принимаются по этим заболеваниям (названия, если знаете)')),
      eh('en_oila', u('Oilada qandli diabet yoki qalqonsimon bez kasalligi bormi?', 'Оилада қандли диабет ёки қалқонсимон без касаллиги борми?', 'Есть ли в семье сахарный диабет или заболевания щитовидной железы?'), KIMDA),
    ],
  },

  'enfeksiyon-hastaliklari': {
    baslik: u('Yuqumli kasalliklar shifokori qabuli', 'Юқумли касалликлар шифокори қабули', 'Приём врача-инфекциониста'),
    inceleme: MAKINE,
    sorular: [
      tek('yk_isitma', u('Isitma bormi va qachondan beri?', 'Иситма борми ва қачондан бери?', 'Есть ли повышенная температура и как давно?'), [
        s('yoq', 'Isitma yoʻq', 'Иситма йўқ', 'Температуры нет'),
        s('kunlar', 'Bir necha kundan beri', 'Бир неча кундан бери', 'Несколько дней'),
        s('hafta', 'Bir haftacha', 'Бир ҳафтача', 'Около недели'),
        s('uzoq', 'Bir haftadan ortiq', 'Бир ҳафтадан ортиқ', 'Больше недели'),
      ]),
      cok('yk_belgilar', u('Quyidagilardan qaysilari bor?', 'Қуйидагилардан қайсилари бор?', 'Что из перечисленного есть?'), [
        s('yotal', 'Yoʻtal', 'Йўтал', 'Кашель'),
        s('tomoq', 'Tomoq ogʻrigʻi', 'Томоқ оғриғи', 'Боль в горле'),
        s('ich_ketishi', 'Ich ketishi', 'Ич кетиши', 'Понос'),
        s('qusish', 'Qusish', 'Қусиш', 'Рвота'),
        s('toshma', 'Toshma', 'Тошма', 'Сыпь'),
        s('sariqlik', 'Teri yoki koʻz sargʻayishi', 'Тери ёки кўз сарғайиши', 'Желтизна кожи или глаз'),
        YOQ(),
      ]),
      eh('yk_safar', u('Oxirgi bir oy ichida boshqa mamlakat yoki hududga safar boʻlganmi?', 'Охирги бир ой ичида бошқа мамлакат ёки ҳудудга сафар бўлганми?', 'Была ли за последний месяц поездка в другую страну или регион?'),
        u('Qayerga va qachon?', 'Қаерга ва қачон?', 'Куда и когда?')),
      eh('yk_hayvon', u('Yaqinda hayvon tishlashi yoki tirnashi boʻlganmi?', 'Яқинда ҳайвон тишлаши ёки тирнаши бўлганми?', 'Был ли недавно укус или царапина от животного?'), QACHON),
      eh('yk_kontakt', u('Atrofdagilar orasida shunga oʻxshash kasal boʻlgan kishi bormi?', 'Атрофдагилар орасида шунга ўхшаш касал бўлган киши борми?', 'Болел ли кто-нибудь из окружающих чем-то похожим?')),
      tek('yk_emlash', u('Emlashlar oʻz vaqtida qilinganmi (bilishingizcha)?', 'Эмлашлар ўз вақтида қилинганми (билишингизча)?', 'Сделаны ли прививки вовремя (насколько вам известно)?'), HA_YOQ_BILMAYMAN()),
    ],
  },

  gastroenteroloji: {
    baslik: u('Hazm aʼzolari shikoyati', 'Ҳазм аъзолари шикояти', 'Жалобы на органы пищеварения'),
    inceleme: MAKINE,
    sorular: [
      cok('ge_belgilar', u('Quyidagilardan qaysilari bezovta qilyapti?', 'Қуйидагилардан қайсилари безовта қиляпти?', 'Что из перечисленного беспокоит?'), [
        s('qorin', 'Qorin ogʻrigʻi', 'Қорин оғриғи', 'Боль в животе'),
        s('jigildon', 'Jigʻildon qaynashi', 'Жиғилдон қайнаши', 'Изжога'),
        s('qusish', 'Koʻngil aynishi yoki qusish', 'Кўнгил айниши ёки қусиш', 'Тошнота или рвота'),
        s('dam', 'Qorin dam boʻlishi', 'Қорин дам бўлиши', 'Вздутие живота'),
        s('ich_ketishi', 'Ich ketishi', 'Ич кетиши', 'Понос'),
        s('qabziyat', 'Qabziyat', 'Қабзият', 'Запор'),
        YOQ(),
      ]),
      kisa('ge_joy', u('Ogʻriq qorinning qaysi qismida?', 'Оғриқ қориннинг қайси қисмида?', 'В какой части живота боль?')),
      tek('ge_qon', u('Axlatda qon yoki qora rangli axlat kuzatilganmi?', 'Ахлатда қон ёки қора рангли ахлат кузатилганми?', 'Замечалась ли кровь в стуле или стул чёрного цвета?'), yoqHaIshonchsiz()),
      eh('ge_yutish', u('Yutishda qiyinchilik bormi?', 'Ютишда қийинчилик борми?', 'Есть ли затруднение при глотании?')),
      eh('ge_tekshiruv', u('Avval endoskopik tekshiruv (gastroskopiya, kolonoskopiya) qilinganmi?', 'Аввал эндоскопик текширув (гастроскопия, колоноскопия) қилинганми?', 'Проводилось ли раньше эндоскопическое обследование (гастроскопия, колоноскопия)?'), QACHON_NATIJA),
      eh('ge_tashxis', u('Oshqozon, ichak yoki jigar kasalligi aniqlanganmi?', 'Ошқозон, ичак ёки жигар касаллиги аниқланганми?', 'Выявлено ли заболевание желудка, кишечника или печени?'), QANDAY),
    ],
  },

  'genel-cerrahi': {
    baslik: u('Xirurg qabuli', 'Хирург қабули', 'Приём хирурга'),
    inceleme: MAKINE,
    sorular: [
      cok('ux_belgilar', u('Quyidagilardan qaysilari bor?', 'Қуйидагилардан қайсилари бор?', 'Что из перечисленного есть?'), [
        s('qorin', 'Qorin ogʻrigʻi', 'Қорин оғриғи', 'Боль в животе'),
        s('shish', 'Shish yoki boʻrtma', 'Шиш ёки бўртма', 'Припухлость или выпячивание'),
        s('qusish', 'Koʻngil aynishi yoki qusish', 'Кўнгил айниши ёки қусиш', 'Тошнота или рвота'),
        s('isitma', 'Isitma', 'Иситма', 'Повышенная температура'),
        s('ich', 'Ich kelishining oʻzgarishi', 'Ич келишининг ўзгариши', 'Изменение стула'),
        YOQ(),
      ]),
      kisa('ux_joy', u('Ogʻriq yoki shish qayerda joylashgan?', 'Оғриқ ёки шиш қаерда жойлашган?', 'Где находится боль или припухлость?')),
      eh('ux_qon_ivish', u('Qon ketishiga moyillik yoki qon ivishining buzilishi aniqlanganmi?', 'Қон кетишига мойиллик ёки қон ивишининг бузилиши аниқланганми?', 'Выявлена ли склонность к кровотечениям или нарушение свёртываемости крови?')),
      eh('ux_qon_dori', u('Qonni suyultiruvchi dori qabul qilinadimi?', 'Қонни суюлтирувчи дори қабул қилинадими?', 'Принимаются ли лекарства, разжижающие кровь?'), DORI_NOMI),
      eh('ux_asorat', u('Avvalgi operatsiyalardan keyin asorat boʻlganmi?', 'Аввалги операциялардан кейин асорат бўлганми?', 'Были ли осложнения после прежних операций?'), QANDAY),
    ],
  },

  'gogus-cerrahisi': {
    baslik: u('Torakal xirurg qabuli', 'Торакал хирург қабули', 'Приём торакального хирурга'),
    inceleme: MAKINE,
    sorular: [
      cok('tx_belgilar', u('Quyidagilardan qaysilari bezovta qilyapti?', 'Қуйидагилардан қайсилари безовта қиляпти?', 'Что из перечисленного беспокоит?'), [
        s('ogriq', 'Koʻkrakda ogʻriq', 'Кўкракда оғриқ', 'Боль в груди'),
        s('nafas', 'Nafas qisishi', 'Нафас қисиши', 'Одышка'),
        s('yotal', 'Yoʻtal', 'Йўтал', 'Кашель'),
        s('qon', 'Balgʻamda qon', 'Балғамда қон', 'Кровь в мокроте'),
        s('vazn', 'Vazn kamayishi', 'Вазн камайиши', 'Снижение веса'),
        YOQ(),
      ]),
      eh('tx_tasvir', u('Koʻkrak qafasi rentgeni yoki KT qilinganmi?', 'Кўкрак қафаси рентгени ёки КТ қилинганми?', 'Проводились ли рентген или КТ грудной клетки?'), QACHON_NATIJA),
      eh('tx_operatsiya', u('Oʻpka yoki koʻkrak qafasida operatsiya boʻlganmi?', 'Ўпка ёки кўкрак қафасида операция бўлганми?', 'Была ли операция на лёгких или грудной клетке?'), QACHON),
      eh('tx_nafas_testi', u('Nafas funksiyasi tekshiruvi (spirometriya) qilinganmi?', 'Нафас функцияси текшируви (спирометрия) қилинганми?', 'Проводилось ли исследование функции дыхания (спирометрия)?')),
      kisa('tx_chekish', u('Chekkan boʻlsangiz: necha yil va kuniga taxminan nechta?', 'Чеккан бўлсангиз: неча йил ва кунига тахминан нечта?', 'Если вы курили: сколько лет и примерно сколько в день?'), { kime: 'yetiskin' }),
    ],
  },

  'gogus-hastaliklari': {
    baslik: u('Nafas aʼzolari shikoyati', 'Нафас аъзолари шикояти', 'Жалобы на органы дыхания'),
    inceleme: MAKINE,
    sorular: [
      cok('pu_belgilar', u('Quyidagilardan qaysilari bezovta qilyapti?', 'Қуйидагилардан қайсилари безовта қиляпти?', 'Что из перечисленного беспокоит?'), [
        s('yotal', 'Yoʻtal', 'Йўтал', 'Кашель'),
        s('balgam', 'Balgʻam', 'Балғам', 'Мокрота'),
        s('nafas', 'Nafas qisishi', 'Нафас қисиши', 'Одышка'),
        s('xirillash', 'Xirillash', 'Хириллаш', 'Свистящее дыхание'),
        s('ogriq', 'Koʻkrakda ogʻriq', 'Кўкракда оғриқ', 'Боль в груди'),
        s('terlash', 'Tunda terlash', 'Тунда терлаш', 'Ночная потливость'),
        YOQ(),
      ]),
      tek('pu_qachon', u('Nafas qisishi qachon boʻladi?', 'Нафас қисиши қачон бўлади?', 'Когда бывает одышка?'), [
        s('yoq', 'Boʻlmaydi', 'Бўлмайди', 'Не бывает'),
        s('zoriqish', 'Jismoniy zoʻriqishda', 'Жисмоний зўриқишда', 'При физической нагрузке'),
        s('tinch', 'Tinch holatda ham', 'Тинч ҳолатда ҳам', 'И в покое'),
      ]),
      tek('pu_qon', u('Balgʻamda qon boʻlganmi?', 'Балғамда қон бўлганми?', 'Была ли кровь в мокроте?'), yoqHaIshonchsiz()),
      cok('pu_tashxis', u('Qaysi kasallik aniqlangan?', 'Қайси касаллик аниқланган?', 'Какое заболевание выявлено?'), [
        s('astma', 'Bronxial astma', 'Бронхиал астма', 'Бронхиальная астма'),
        s('surunkali', 'Surunkali bronxit yoki oʻpka kasalligi', 'Сурункали бронхит ёки ўпка касаллиги', 'Хронический бронхит или заболевание лёгких'),
        s('zotiljam', 'Oʻtkazilgan zotiljam', 'Ўтказилган зотилжам', 'Перенесённое воспаление лёгких'),
        s('sil', 'Sil', 'Сил', 'Туберкулёз'),
        { ...s('yoq', 'Hech biri aniqlanmagan', 'Ҳеч бири аниқланмаган', 'Ничего не выявлено'), tek: true },
      ]),
      eh('pu_ingalyator', u('Ingalyator ishlatiladimi?', 'Ингалятор ишлатиладими?', 'Используется ли ингалятор?'), DORI_NOMI),
      kisa('pu_chekish', u('Chekkan boʻlsangiz: necha yil va kuniga taxminan nechta?', 'Чеккан бўлсангиз: неча йил ва кунига тахминан нечта?', 'Если вы курили: сколько лет и примерно сколько в день?'), { kime: 'yetiskin' }),
    ],
  },

  'goz-hastaliklari': {
    baslik: u('Koʻz shikoyati', 'Кўз шикояти', 'Жалобы на глаза'),
    inceleme: MAKINE,
    sorular: [
      cok('of_belgilar', u('Quyidagilardan qaysilari bezovta qilyapti?', 'Қуйидагилардан қайсилари безовта қиляпти?', 'Что из перечисленного беспокоит?'), [
        s('xira', 'Xira koʻrish', 'Хира кўриш', 'Нечёткое зрение'),
        s('qizarish', 'Koʻz qizarishi', 'Кўз қизариши', 'Покраснение глаза'),
        s('ogriq', 'Koʻzda ogʻriq', 'Кўзда оғриқ', 'Боль в глазу'),
        s('yoshlanish', 'Qichishish yoki yoshlanish', 'Қичишиш ёки ёшланиш', 'Зуд или слезотечение'),
        s('chaqnash', 'Koʻz oldida nuqta yoki chaqnashlar', 'Кўз олдида нуқта ёки чақнашлар', 'Точки или вспышки перед глазами'),
        s('ikkilanish', 'Ikkilanib koʻrish', 'Иккиланиб кўриш', 'Двоение в глазах'),
        YOQ(),
      ]),
      tek('of_masofa', u('Qaysi masofada koʻrish qiyin?', 'Қайси масофада кўриш қийин?', 'На каком расстоянии трудно видеть?'), [
        s('yaqin', 'Yaqinda', 'Яқинда', 'Вблизи'),
        s('uzoq', 'Uzoqda', 'Узоқда', 'Вдали'),
        s('ikkalasi', 'Ikkalasida ham', 'Иккаласида ҳам', 'И вблизи, и вдали'),
        s('yoq', 'Qiyinchilik yoʻq', 'Қийинчилик йўқ', 'Трудностей нет'),
      ]),
      tek('of_kozoynak', u('Koʻzoynak yoki kontakt linza taqiladimi?', 'Кўзойнак ёки контакт линза тақиладими?', 'Используются ли очки или контактные линзы?'), [
        s('yoq', 'Yoʻq', 'Йўқ', 'Нет'),
        s('kozoynak', 'Koʻzoynak', 'Кўзойнак', 'Очки'),
        s('linza', 'Kontakt linza', 'Контакт линза', 'Контактные линзы'),
        s('ikkalasi', 'Ikkalasi ham', 'Иккаласи ҳам', 'И то, и другое'),
      ]),
      eh('of_tashxis', u('Koʻz kasalligi aniqlanganmi?', 'Кўз касаллиги аниқланганми?', 'Выявлено ли заболевание глаз?'), QANDAY),
      eh('of_operatsiya', u('Koʻzda operatsiya yoki lazer muolajasi boʻlganmi?', 'Кўзда операция ёки лазер муолажаси бўлганми?', 'Была ли операция или лазерная процедура на глазах?'), QACHON),
      eh('of_oila', u('Oilada koʻz kasalliklari bormi?', 'Оилада кўз касалликлари борми?', 'Есть ли в семье заболевания глаз?'), KIMDA),
    ],
  },

  'kadin-hastaliklari-dogum': {
    baslik: u('Ayollar salomatligi', 'Аёллар саломатлиги', 'Женское здоровье'),
    inceleme: MAKINE,
    sorular: [
      cok('ag_belgilar', u('Quyidagilardan qaysilari bezovta qilyapti?', 'Қуйидагилардан қайсилари безовта қиляпти?', 'Что из перечисленного беспокоит?'), [
        s('ogriq', 'Qorin pastida ogʻriq', 'Қорин пастида оғриқ', 'Боль внизу живота'),
        s('sikl', 'Hayz siklining buzilishi', 'Ҳайз циклининг бузилиши', 'Нарушение менструального цикла'),
        s('ajralma', 'Odatdan tashqari ajralma', 'Одатдан ташқари ажралма', 'Необычные выделения'),
        s('qon', 'Hayzdan tashqari qon ketishi', 'Ҳайздан ташқари қон кетиши', 'Кровотечение вне менструации'),
        s('qichishish', 'Qichishish yoki achishish', 'Қичишиш ёки ачишиш', 'Зуд или жжение'),
        YOQ(),
      ]),
      gun('ag_oxirgi_hayz', u('Oxirgi hayzning birinchi kuni', 'Охирги ҳайзнинг биринчи куни', 'Первый день последней менструации')),
      tek('ag_homila', u('Hozir homiladorlik bormi?', 'Ҳозир ҳомиладорлик борми?', 'Есть ли сейчас беременность?'), [
        s('yoq', 'Yoʻq', 'Йўқ', 'Нет'),
        s('ha', 'Ha', 'Ҳа', 'Да'),
        s('mumkin', 'Boʻlishi mumkin', 'Бўлиши мумкин', 'Возможно'),
      ]),
      son('ag_hafta', u('Homiladorlik boʻlsa: nechanchi hafta?', 'Ҳомиладорлик бўлса: нечанчи ҳафта?', 'Если есть беременность: какая неделя?'), HAFTA, 1, 45),
      son('ag_homiladorliklar', u('Jami nechta homiladorlik boʻlgan?', 'Жами нечта ҳомиладорлик бўлган?', 'Сколько всего было беременностей?'), MARTA, 0, 25),
      son('ag_tugruqlar', u('Nechta tugʻruq boʻlgan?', 'Нечта туғруқ бўлган?', 'Сколько было родов?'), MARTA, 0, 20),
      eh('ag_tashxis', u('Ginekologik kasallik aniqlanganmi?', 'Гинекологик касаллик аниқланганми?', 'Выявлено ли гинекологическое заболевание?'), QANDAY),
      kisa('ag_himoya', u('Homiladorlikdan saqlanish usuli (boʻlsa)', 'Ҳомиладорликдан сақланиш усули (бўлса)', 'Способ предохранения от беременности (если есть)')),
    ],
  },

  'kalp-damar-cerrahisi': {
    baslik: u('Yurak-qon tomir xirurgi qabuli', 'Юрак-қон томир хирурги қабули', 'Приём сердечно-сосудистого хирурга'),
    inceleme: MAKINE,
    sorular: [
      cok('yx_belgilar', u('Quyidagilardan qaysilari bezovta qilyapti?', 'Қуйидагилардан қайсилари безовта қиляпти?', 'Что из перечисленного беспокоит?'), [
        s('ogriq', 'Koʻkrakda ogʻriq', 'Кўкракда оғриқ', 'Боль в груди'),
        s('nafas', 'Nafas qisishi', 'Нафас қисиши', 'Одышка'),
        s('oyoq_ogriq', 'Yurganda oyoqlarda ogʻriq', 'Юрганда оёқларда оғриқ', 'Боль в ногах при ходьбе'),
        s('shish', 'Oyoqlarda shish', 'Оёқларда шиш', 'Отёки ног'),
        s('vena', 'Kengaygan venalar', 'Кенгайган веналар', 'Расширенные вены'),
        s('ritm', 'Yurak notekis urishi', 'Юрак нотекис уриши', 'Неровное сердцебиение'),
        YOQ(),
      ]),
      eh('yx_operatsiya', u('Yurak yoki qon tomirlarda operatsiya yoki muolaja boʻlganmi?', 'Юрак ёки қон томирларда операция ёки муолажа бўлганми?', 'Была ли операция или вмешательство на сердце или сосудах?'), QACHON),
      eh('yx_tekshiruv', u('Yurak yoki qon tomirlar tekshiruvi qilinganmi?', 'Юрак ёки қон томирлар текшируви қилинганми?', 'Проводилось ли обследование сердца или сосудов?'), QACHON_NATIJA),
      eh('yx_qon_dori', u('Qonni suyultiruvchi dori qabul qilinadimi?', 'Қонни суюлтирувчи дори қабул қилинадими?', 'Принимаются ли лекарства, разжижающие кровь?'), DORI_NOMI),
      eh('yx_oila', u('Oilada yurak-qon tomir kasalliklari bormi?', 'Оилада юрак-қон томир касалликлари борми?', 'Есть ли в семье сердечно-сосудистые заболевания?'), KIMDA),
    ],
  },

  kardiyoloji: {
    baslik: u('Yurak shikoyati', 'Юрак шикояти', 'Жалобы на сердце'),
    inceleme: MAKINE,
    sorular: [
      cok('kd_belgilar', u('Quyidagilardan qaysilari bezovta qilyapti?', 'Қуйидагилардан қайсилари безовта қиляпти?', 'Что из перечисленного беспокоит?'), [
        s('ogriq', 'Koʻkrakda ogʻriq yoki siqilish', 'Кўкракда оғриқ ёки сиқилиш', 'Боль или сдавление в груди'),
        s('urish', 'Yurak tez yoki notekis urishi', 'Юрак тез ёки нотекис уриши', 'Частое или неровное сердцебиение'),
        s('nafas', 'Nafas qisishi', 'Нафас қисиши', 'Одышка'),
        s('hush', 'Hushdan ketish yoki ketay deyish', 'Ҳушдан кетиш ёки кетай дейиш', 'Обморок или предобморочное состояние'),
        s('shish', 'Oyoqlarda shish', 'Оёқларда шиш', 'Отёки ног'),
        s('charchash', 'Tez charchash', 'Тез чарчаш', 'Быстрая утомляемость'),
        YOQ(),
      ]),
      tek('kd_ogriq', u('Koʻkrakdagi ogʻriq qachon paydo boʻladi?', 'Кўкракдаги оғриқ қачон пайдо бўлади?', 'Когда появляется боль в груди?'), [
        s('yoq', 'Ogʻriq yoʻq', 'Оғриқ йўқ', 'Боли нет'),
        s('zoriqish', 'Jismoniy zoʻriqishda', 'Жисмоний зўриқишда', 'При физической нагрузке'),
        s('tinch', 'Tinch holatda', 'Тинч ҳолатда', 'В покое'),
        s('ikkalasi', 'Har ikkala holatda', 'Ҳар иккала ҳолатда', 'И при нагрузке, и в покое'),
      ]),
      cok('kd_tashxis', u('Qaysi kasallik aniqlangan?', 'Қайси касаллик аниқланган?', 'Какое заболевание выявлено?'), [
        s('bosim', 'Yuqori qon bosimi', 'Юқори қон босими', 'Повышенное давление'),
        s('ishemiya', 'Yurak ishemik kasalligi', 'Юрак ишемик касаллиги', 'Ишемическая болезнь сердца'),
        s('ritm', 'Yurak ritmining buzilishi', 'Юрак ритмининг бузилиши', 'Нарушение ритма сердца'),
        s('yetishmovchilik', 'Yurak yetishmovchiligi', 'Юрак етишмовчилиги', 'Сердечная недостаточность'),
        s('infarkt', 'Oʻtkazilgan infarkt', 'Ўтказилган инфаркт', 'Перенесённый инфаркт'),
        s('nuqson', 'Yurak nuqsoni', 'Юрак нуқсони', 'Порок сердца'),
        { ...s('yoq', 'Hech biri aniqlanmagan', 'Ҳеч бири аниқланмаган', 'Ничего не выявлено'), tek: true },
      ]),
      eh('kd_muolaja', u('Yurakda muolaja yoki operatsiya boʻlganmi?', 'Юракда муолажа ёки операция бўлганми?', 'Было ли вмешательство или операция на сердце?'), QACHON),
      eh('kd_bosim', u('Qon bosimi uyda oʻlchanadimi?', 'Қон босими уйда ўлчанадими?', 'Измеряется ли артериальное давление дома?'), KORSATKICH),
      eh('kd_oila', u('Yaqin qarindoshlarda yurak kasalligi, infarkt yoki toʻsatdan oʻlim holati boʻlganmi?', 'Яқин қариндошларда юрак касаллиги, инфаркт ёки тўсатдан ўлим ҳолати бўлганми?', 'Были ли у близких родственников болезни сердца, инфаркт или внезапная смерть?'), KIMDA),
    ],
  },
}
