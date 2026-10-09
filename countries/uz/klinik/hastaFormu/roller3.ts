/**
 * NOTYA-ULKE-INTAKE-01 — Uzbekistan: THE ROLE QUESTIONS of the intake form, part 3 of 3 — the ten clinic roles:
 * five clinic doctors (hair transplantation … preventive medicine) and five allied professions (physical
 * rehabilitation … audiology), in the order of ../rolAdlari.ts.
 *
 * MACHINE-WRITTEN. EVERY SET AWAITS A LOCAL CLINICIAN OR PRACTITIONER OF THAT ROLE AND A NATIVE READER.
 * PATIENT-FACING. Everything said at the top of ./roller1.ts holds here. For the allied professions the open
 * question of what the profession may record and decide without a doctor (../notSablonlari.ts, `scope_of_practice`)
 * applies to these questions as well.
 *
 * No product, brand or device is named: a patient is asked which procedures they had, in their own words.
 */
import type { RolSorulari } from '@/lib/ulke/intake/tipler'
import { BALL, cok, eh, KIMDA, kisa, MAKINE, MARTA, QACHON, QANDAY, s, SOAT, son, STAKAN, tek, u, uzun, YOQ } from './yardimci'

const OGRIQ_KUCHI = u('Ogʻriq qanchalik kuchli? (0 — ogʻriq yoʻq, 10 — chidab boʻlmaydi)', 'Оғриқ қанчалик кучли? (0 — оғриқ йўқ, 10 — чидаб бўлмайди)', 'Насколько сильная боль? (0 — боли нет, 10 — невыносимая)')
const VOSITA = u('Foydalaniladigan yordamchi vositalar (ortez, protez, hassa va boshqalar)', 'Фойдаланиладиган ёрдамчи воситалар (ортез, протез, ҳасса ва бошқалар)', 'Используемые вспомогательные средства (ортез, протез, трость и другое)')
const faollik = () => [
  s('kam', 'Deyarli harakatsiz', 'Деярли ҳаракатсиз', 'Почти нет'),
  s('bazan', 'Haftada bir-ikki marta', 'Ҳафтада бир-икки марта', 'Один-два раза в неделю'),
  s('muntazam', 'Haftada uch marta va undan koʻp', 'Ҳафтада уч марта ва ундан кўп', 'Три раза в неделю и чаще'),
]

export const UZ_ROL_SORULARI_3: Readonly<Record<string, RolSorulari>> = {
  'sac-ekimi': {
    baslik: u('Soch va bosh terisi', 'Соч ва бош териси', 'Волосы и кожа головы'),
    inceleme: MAKINE,
    sorular: [
      tek('se_muddat', u('Soch toʻkilishi qachondan beri?', 'Соч тўкилиши қачондан бери?', 'Как давно выпадают волосы?'), [
        s('yil', 'Bir yildan kam', 'Бир йилдан кам', 'Меньше года'),
        s('yillar', 'Bir necha yil', 'Бир неча йил', 'Несколько лет'),
        s('uzoq', 'Koʻp yillardan beri', 'Кўп йиллардан бери', 'Много лет'),
      ]),
      cok('se_soha', u('Soch qayerda koʻproq toʻkiladi?', 'Соч қаерда кўпроқ тўкилади?', 'Где волосы выпадают сильнее?'), [
        s('peshona', 'Peshona chizigʻi', 'Пешона чизиғи', 'Линия лба'),
        s('tepa', 'Tepa qism', 'Тепа қисм', 'Макушка'),
        s('butun', 'Butun bosh boʻylab', 'Бутун бош бўйлаб', 'По всей голове'),
        s('qosh', 'Qosh yoki soqol', 'Қош ёки соқол', 'Брови или борода'),
      ]),
      cok('se_teri', u('Bosh terisida quyidagilardan qaysilari bor?', 'Бош терисида қуйидагилардан қайсилари бор?', 'Что из перечисленного есть на коже головы?'), [
        s('qichishish', 'Qichishish', 'Қичишиш', 'Зуд'),
        s('qazgoq', 'Qazgʻoq', 'Қазғоқ', 'Перхоть'),
        s('yara', 'Qizarish yoki yara', 'Қизариш ёки яра', 'Покраснение или ранки'),
        YOQ(),
      ]),
      eh('se_davolash', u('Soch toʻkilishi uchun avval davolash oʻtkazilganmi?', 'Соч тўкилиши учун аввал даволаш ўтказилганми?', 'Проводилось ли раньше лечение выпадения волос?'), QANDAY),
      eh('se_avval', u('Avval soch koʻchirib oʻtkazilganmi?', 'Аввал соч кўчириб ўтказилганми?', 'Проводилась ли раньше пересадка волос?'), QACHON),
      eh('se_ogriqsizlantirish', u('Mahalliy ogʻriqsizlantirishda muammo boʻlganmi?', 'Маҳаллий оғриқсизлантиришда муаммо бўлганми?', 'Были ли проблемы при местном обезболивании?'), QANDAY),
      eh('se_oila', u('Oilada soch toʻkilishi bormi?', 'Оилада соч тўкилиши борми?', 'Есть ли в семье выпадение волос?'), KIMDA),
    ],
  },

  'estetik-cerrahi': {
    baslik: u('Estetik xirurgiya boʻyicha maslahat', 'Эстетик хирургия бўйича маслаҳат', 'Консультация по эстетической хирургии'),
    inceleme: MAKINE,
    sorular: [
      kisa('ec_soha', u('Qaysi soha boʻyicha maslahat kerak?', 'Қайси соҳа бўйича маслаҳат керак?', 'По какой области нужна консультация?'), { zorunlu: true }),
      uzun('ec_kutilma', u('Natijadan nimani kutasiz?', 'Натижадан нимани кутасиз?', 'Чего вы ждёте от результата?')),
      eh('ec_avval', u('Avval estetik operatsiya yoki muolaja boʻlganmi?', 'Аввал эстетик операция ёки муолажа бўлганми?', 'Были ли раньше эстетические операции или процедуры?'), QACHON),
      eh('ec_narkoz', u('Avval narkoz vaqtida muammo boʻlganmi?', 'Аввал наркоз вақтида муаммо бўлганми?', 'Были ли раньше проблемы во время наркоза?'), QANDAY),
      eh('ec_yara', u('Yaralarning sekin bitishi yoki qoʻpol chandiq qolishi kuzatilganmi?', 'Яраларнинг секин битиши ёки қўпол чандиқ қолиши кузатилганми?', 'Отмечалось ли медленное заживление ран или грубые рубцы?')),
    ],
  },

  'medikal-estetik': {
    baslik: u('Kosmetologik muolaja oldidan', 'Косметологик муолажа олдидан', 'Перед косметологической процедурой'),
    inceleme: MAKINE,
    sorular: [
      uzun('ks_qiziqish', u('Qaysi muolaja yoki muammo boʻyicha murojaat qilyapsiz?', 'Қайси муолажа ёки муаммо бўйича мурожаат қиляпсиз?', 'По поводу какой процедуры или проблемы вы обращаетесь?'), { zorunlu: true }),
      eh('ks_avval', u('Avval kosmetologik muolajalar qilinganmi?', 'Аввал косметологик муолажалар қилинганми?', 'Проводились ли раньше косметологические процедуры?'),
        u('Qanday muolaja va qachon?', 'Қандай муолажа ва қачон?', 'Какая процедура и когда?')),
      eh('ks_asorat', u('Avvalgi muolajalardan keyin nojoʻya taʼsir boʻlganmi?', 'Аввалги муолажалардан кейин ножўя таъсир бўлганми?', 'Были ли нежелательные реакции после прежних процедур?'), QANDAY),
      eh('ks_teri', u('Teri kasalligi bormi?', 'Тери касаллиги борми?', 'Есть ли заболевание кожи?'), QANDAY),
      eh('ks_uchuq', u('Lablarda uchuq tez-tez chiqadimi?', 'Лабларда учуқ тез-тез чиқадими?', 'Часто ли бывает простуда на губах?')),
    ],
  },

  'klinik-dermatoloji': {
    baslik: u('Teri holati', 'Тери ҳолати', 'Состояние кожи'),
    inceleme: MAKINE,
    sorular: [
      kisa('kl_joy', u('Muammo tananing qaysi qismida?', 'Муаммо тананинг қайси қисмида?', 'На какой части тела проблема?')),
      cok('kl_belgilar', u('Quyidagilardan qaysilari bezovta qilyapti?', 'Қуйидагилардан қайсилари безовта қиляпти?', 'Что из перечисленного беспокоит?'), [
        s('qichishish', 'Qichishish', 'Қичишиш', 'Зуд'),
        s('toshma', 'Toshma', 'Тошма', 'Сыпь'),
        s('husnbuzar', 'Husnbuzar', 'Ҳуснбузар', 'Угри'),
        s('dog', 'Dogʻlar', 'Доғлар', 'Пятна'),
        s('quruqlik', 'Quruqlik yoki qipiqlanish', 'Қуруқлик ёки қипиқланиш', 'Сухость или шелушение'),
        YOQ(),
      ]),
      eh('kl_avval', u('Shu muammo boʻyicha avval davolash oʻtkazilganmi?', 'Шу муаммо бўйича аввал даволаш ўтказилганми?', 'Проводилось ли раньше лечение по этой проблеме?'), QANDAY),
      uzun('kl_parvarish', u('Kundalik teri parvarishida ishlatiladigan vositalar', 'Кундалик тери парваришида ишлатиладиган воситалар', 'Средства, которые используются в ежедневном уходе за кожей')),
      tek('kl_quyosh', u('Quyoshdan himoya vositasi ishlatiladimi?', 'Қуёшдан ҳимоя воситаси ишлатиладими?', 'Используется ли солнцезащитное средство?'), [
        s('muntazam', 'Ha, muntazam', 'Ҳа, мунтазам', 'Да, регулярно'),
        s('bazan', 'Baʼzan', 'Баъзан', 'Иногда'),
        s('yoq', 'Yoʻq', 'Йўқ', 'Нет'),
      ]),
    ],
  },

  longevity: {
    baslik: u('Turmush tarzi va profilaktika', 'Турмуш тарзи ва профилактика', 'Образ жизни и профилактика'),
    inceleme: MAKINE,
    sorular: [
      uzun('lg_maqsad', u('Sogʻligʻingiz boʻyicha asosiy maqsadingiz nima?', 'Соғлиғингиз бўйича асосий мақсадингиз нима?', 'Какая у вас главная цель в отношении здоровья?'), { zorunlu: true }),
      tek('lg_faollik', u('Jismoniy faollik', 'Жисмоний фаоллик', 'Физическая активность'), faollik()),
      son('lg_uyqu', u('Tunda oʻrtacha necha soat uxlaysiz?', 'Тунда ўртача неча соат ухлайсиз?', 'Сколько часов в среднем вы спите ночью?'), SOAT, 1, 16),
      tek('lg_stress', u('Oxirgi oyda zoʻriqish darajasi', 'Охирги ойда зўриқиш даражаси', 'Уровень напряжения за последний месяц'), [
        s('past', 'Past', 'Паст', 'Низкий'),
        s('ortacha', 'Oʻrtacha', 'Ўртача', 'Средний'),
        s('yuqori', 'Yuqori', 'Юқори', 'Высокий'),
      ]),
      uzun('lg_ovqat', u('Odatdagi ovqatlanishingizni qisqacha tasvirlang', 'Одатдаги овқатланишингизни қисқача тасвирланг', 'Коротко опишите своё обычное питание')),
      uzun('lg_qoshimcha', u('Qabul qilinadigan vitamin va qoʻshimchalar', 'Қабул қилинадиган витамин ва қўшимчалар', 'Принимаемые витамины и добавки')),
      kisa('lg_tekshiruv', u('Oxirgi keng qamrovli tekshiruv qachon boʻlgan?', 'Охирги кенг қамровли текширув қачон бўлган?', 'Когда было последнее комплексное обследование?')),
    ],
  },

  fizyoterapi: {
    baslik: u('Jismoniy reabilitatsiya', 'Жисмоний реабилитация', 'Физическая реабилитация'),
    inceleme: MAKINE,
    sorular: [
      kisa('fr_joy', u('Ogʻriq yoki cheklanish tananing qaysi qismida?', 'Оғриқ ёки чекланиш тананинг қайси қисмида?', 'В какой части тела боль или ограничение?')),
      son('fr_ogriq', OGRIQ_KUCHI, BALL, 0, 10),
      tek('fr_cheklov', u('Shikoyat kundalik ishlarni qanchalik cheklaydi?', 'Шикоят кундалик ишларни қанчалик чеклайди?', 'Насколько жалоба ограничивает повседневные дела?'), [
        s('yoq', 'Cheklamaydi', 'Чекламайди', 'Не ограничивает'),
        s('biroz', 'Biroz cheklaydi', 'Бироз чеклайди', 'Немного ограничивает'),
        s('sezilarli', 'Sezilarli cheklaydi', 'Сезиларли чеклайди', 'Заметно ограничивает'),
      ]),
      eh('fr_yollanma', u('Shifokor yoʻllanmasi bormi?', 'Шифокор йўлланмаси борми?', 'Есть ли направление врача?'),
        u('Yoʻllanmada qanday tashxis yozilgan?', 'Йўлланмада қандай ташхис ёзилган?', 'Какой диагноз указан в направлении?')),
      eh('fr_tekshiruv', u('Qoʻlingizda tekshiruv natijalari bormi?', 'Қўлингизда текширув натижалари борми?', 'Есть ли у вас на руках результаты обследований?'),
        u('Qaysi tekshiruvlar?', 'Қайси текширувлар?', 'Какие обследования?')),
      kisa('fr_vosita', VOSITA),
    ],
  },

  'klinik-psikolog': {
    baslik: u('Suhbat oldidan', 'Суҳбат олдидан', 'Перед беседой'),
    inceleme: MAKINE,
    sorular: [
      cok('kp_sohalar', u('Oxirgi paytda qaysi sohalar qiyinchilik tugʻdiryapti?', 'Охирги пайтда қайси соҳалар қийинчилик туғдиряпти?', 'Какие стороны жизни в последнее время даются трудно?'), [
        s('oila', 'Oila', 'Оила', 'Семья'),
        s('ish', 'Ish yoki oʻqish', 'Иш ёки ўқиш', 'Работа или учёба'),
        s('munosabat', 'Yaqinlar bilan munosabatlar', 'Яқинлар билан муносабатлар', 'Отношения с близкими'),
        s('sogliq', 'Sogʻliq', 'Соғлиқ', 'Здоровье'),
        s('yoqotish', 'Yoʻqotish yoki ayriliq', 'Йўқотиш ёки айрилиқ', 'Утрата или расставание'),
        s('ishonch', 'Oʻziga ishonch', 'Ўзига ишонч', 'Уверенность в себе'),
      ]),
      eh('kp_avval', u('Avval psixolog yoki psixoterapevtga murojaat boʻlganmi?', 'Аввал психолог ёки психотерапевтга мурожаат бўлганми?', 'Было ли раньше обращение к психологу или психотерапевту?'), QACHON),
      tek('kp_uyqu', u('Uyqu', 'Уйқу', 'Сон'), [
        s('yaxshi', 'Odatdagidek', 'Одатдагидек', 'Как обычно'),
        s('qiyin', 'Uxlash qiyin', 'Ухлаш қийин', 'Трудно уснуть'),
        s('kop', 'Odatdagidan koʻp', 'Одатдагидан кўп', 'Больше обычного'),
      ]),
      uzun('kp_kutilma', u('Uchrashuvlardan nimani kutasiz?', 'Учрашувлардан нимани кутасиз?', 'Чего вы ждёте от встреч?')),
    ],
  },

  diyetisyen: {
    baslik: u('Ovqatlanish haqida', 'Овқатланиш ҳақида', 'О питании'),
    inceleme: MAKINE,
    sorular: [
      tek('dt_maqsad', u('Murojaat maqsadi', 'Мурожаат мақсади', 'Цель обращения'), [
        s('kamaytirish', 'Vaznni kamaytirish', 'Вазнни камайтириш', 'Снижение веса'),
        s('oshirish', 'Vaznni oshirish', 'Вазнни ошириш', 'Набор веса'),
        s('kasallik', 'Kasallik sababli parhez', 'Касаллик сабабли парҳез', 'Диета в связи с заболеванием'),
        s('soglom', 'Sogʻlom ovqatlanish', 'Соғлом овқатланиш', 'Здоровое питание'),
      ]),
      tek('dt_vazn', u('Oxirgi yarim yilda vazn oʻzgardimi?', 'Охирги ярим йилда вазн ўзгардими?', 'Менялся ли вес за последние полгода?'), [
        s('yoq', 'Oʻzgarmadi', 'Ўзгармади', 'Не менялся'),
        s('kamaydi', 'Kamaydi', 'Камайди', 'Снизился'),
        s('oshdi', 'Oshdi', 'Ошди', 'Увеличился'),
      ]),
      son('dt_ovqatlar', u('Kuniga necha marta ovqatlanasiz?', 'Кунига неча марта овқатланасиз?', 'Сколько раз в день вы едите?'), MARTA, 1, 12,
        { veliMetni: u('Bola kuniga necha marta ovqatlanadi?', 'Бола кунига неча марта овқатланади?', 'Сколько раз в день ест ребёнок?') }),
      son('dt_suv', u('Kuniga taxminan necha stakan suv ichiladi?', 'Кунига тахминан неча стакан сув ичилади?', 'Сколько примерно стаканов воды выпивается за день?'), STAKAN, 0, 30),
      uzun('dt_parhez', u('Amal qilinayotgan parhez yoki ovqatlanish cheklovlari', 'Амал қилинаётган парҳез ёки овқатланиш чекловлари', 'Диета или ограничения в питании, которые соблюдаются')),
      uzun('dt_yoqmas', u('Yeyilmaydigan yoki yoqmaydigan mahsulotlar', 'Ейилмайдиган ёки ёқмайдиган маҳсулотлар', 'Продукты, которые не едят или которые плохо переносятся')),
      tek('dt_faollik', u('Jismoniy faollik', 'Жисмоний фаоллик', 'Физическая активность'), faollik()),
    ],
  },

  ergoterapi: {
    baslik: u('Kundalik faoliyat', 'Кундалик фаолият', 'Повседневная деятельность'),
    inceleme: MAKINE,
    sorular: [
      cok('et_sohalar', u('Kundalik hayotda qaysi ishlar qiyin?', 'Кундалик ҳаётда қайси ишлар қийин?', 'Какие повседневные дела даются трудно?'), [
        s('kiyinish', 'Kiyinish', 'Кийиниш', 'Одевание'),
        s('ovqat', 'Ovqatlanish', 'Овқатланиш', 'Приём пищи'),
        s('yuvinish', 'Yuvinish', 'Ювиниш', 'Умывание и купание'),
        s('qol', 'Yozish yoki mayda qoʻl harakatlari', 'Ёзиш ёки майда қўл ҳаракатлари', 'Письмо или мелкие движения рук'),
        s('uy', 'Uy ishlari', 'Уй ишлари', 'Домашние дела'),
        s('ish', 'Ish yoki oʻqish', 'Иш ёки ўқиш', 'Работа или учёба'),
        YOQ(),
      ]),
      uzun('et_tashxis', u('Shifokor qoʻygan tashxis boʻlsa, yozing', 'Шифокор қўйган ташхис бўлса, ёзинг', 'Если есть диагноз, поставленный врачом, напишите его')),
      eh('et_yordam', u('Avval reabilitatsiya yoki maxsus yordam koʻrsatilganmi?', 'Аввал реабилитация ёки махсус ёрдам кўрсатилганми?', 'Проводилась ли раньше реабилитация или оказывалась специальная помощь?'), QANDAY),
      kisa('et_vosita', VOSITA),
      kisa('et_mashgulot', u('Oʻqish yoki ish (qayerda, qanday)', 'Ўқиш ёки иш (қаерда, қандай)', 'Учёба или работа (где, какая)')),
    ],
  },

  odyoloji: {
    baslik: u('Eshitish haqida', 'Эшитиш ҳақида', 'О слухе'),
    inceleme: MAKINE,
    sorular: [
      tek('au_quloq', u('Eshitish qaysi quloqda pasaygan?', 'Эшитиш қайси қулоқда пасайган?', 'В каком ухе снижен слух?'), [
        s('ong', 'Oʻng quloqda', 'Ўнг қулоқда', 'В правом'),
        s('chap', 'Chap quloqda', 'Чап қулоқда', 'В левом'),
        s('ikkala', 'Ikkala quloqda', 'Иккала қулоқда', 'В обоих'),
        s('yoq', 'Pasaymagan', 'Пасаймаган', 'Не снижен'),
      ]),
      tek('au_tosatdan', u('Eshitish qanday pasaydi?', 'Эшитиш қандай пасайди?', 'Как снизился слух?'), [
        s('tosatdan', 'Toʻsatdan, oxirgi kunlarda', 'Тўсатдан, охирги кунларда', 'Внезапно, в последние дни'),
        s('asta', 'Asta-sekin', 'Аста-секин', 'Постепенно'),
        s('yoq', 'Pasaymagan', 'Пасаймаган', 'Не снижался'),
      ]),
      eh('au_shovqin', u('Quloqda shovqin bormi?', 'Қулоқда шовқин борми?', 'Есть ли шум в ушах?')),
      eh('au_muvozanat', u('Bosh aylanishi yoki muvozanat buzilishi bormi?', 'Бош айланиши ёки мувозанат бузилиши борми?', 'Есть ли головокружение или нарушение равновесия?')),
      eh('au_ish', u('Ish yoki mashgʻulot baland shovqin bilan bogʻliqmi?', 'Иш ёки машғулот баланд шовқин билан боғлиқми?', 'Связана ли работа или занятия с сильным шумом?')),
      eh('au_apparat', u('Eshitish apparati ishlatiladimi?', 'Эшитиш аппарати ишлатиладими?', 'Используется ли слуховой аппарат?'),
        u('Qachondan beri va qaysi quloqda?', 'Қачондан бери ва қайси қулоқда?', 'С какого времени и на каком ухе?')),
    ],
  },
}
