/**
 * ULKE-BRANS-DERINLIK-04 / -14 (Kaan, 2026-11-08: "build the Uzbek ones as high as you can get them") — Uzbekistan: THE
 * ROLE QUESTIONS of the seven roles only Uzbekistan has, which until now asked the questions of the role each behaves like
 * (vascular surgery → cardiac surgery's, allergology → therapy's, reproductology → obstetrics', paediatric neurology →
 * neurology's, narcology → psychiatry's, dietology → the old dietitian set, surdology → the old audiology set). Each now
 * asks its own, in the three forms of the application. The two sets kept under `diyetisyen` and `odyoloji` (no roles any
 * more) are gone with this file: no role asks them.
 *
 * MACHINE-WRITTEN. EVERY SET AWAITS A LOCAL CLINICIAN OF THAT ROLE AND A NATIVE READER (ULKE-BRANS-KLINISYEN-01).
 * PATIENT-FACING. Everything said at the top of ./roller1.ts holds here: a patient's own words, no score, no dose, no
 * product, no reference value. Red flags, the two depth questions and (for narcology) the safety question are added by
 * ./derinlik.ts, as for every set.
 */
import type { RolSorulari } from '@/lib/ulke/intake/tipler'
import { cok, DORI_NOMI, eh, HA_YOQ_BILMAYMAN, KIMDA, MAKINE, QACHON, QACHON_NATIJA, QANDAY, QAYSI, s, son, tek, u, YOQ } from './yardimci'

const OY = u('oy', 'ой', 'мес.')
const METR = u('metr', 'метр', 'м')
const BILMAYMAN = () => s('bilmayman', 'Bilmayman', 'Билмайман', 'Не знаю')

export const UZ_ROL_SORULARI_4: Readonly<Record<string, RolSorulari>> = {
  'alerji-immunoloji': {
    baslik: u('Allergolog qabuli', 'Аллерголог қабули', 'Приём аллерголога'),
    inceleme: MAKINE,
    sorular: [
      cok('al_reaksiya', u('Qanday allergik holatlar boʻlgan?', 'Қандай аллергик ҳолатлар бўлган?', 'Какие аллергические проявления были?'), [
        s('toshma', 'Eshakemi yoki toshma', 'Эшакеми ёки тошма', 'Крапивница или сыпь'),
        s('shish', 'Yuz, lab yoki til shishishi', 'Юз, лаб ёки тил шишиши', 'Отёк лица, губ или языка'),
        s('nafas', 'Nafas qisilishi yoki xirillash', 'Нафас қисилиши ёки хириллаш', 'Одышка или свистящее дыхание'),
        s('burun', 'Burun bitishi yoki aksirish', 'Бурун битиши ёки аксириш', 'Заложенность носа или чихание'),
        s('koz', 'Koʻz qichishi yoki yoshlanishi', 'Кўз қичиши ёки ёшланиши', 'Зуд или слезотечение глаз'),
        YOQ(),
      ]),
      cok('al_sabab', u('Nima sabab boʻladi deb oʻylaysiz?', 'Нима сабаб бўлади деб ўйлайсиз?', 'Что, по-вашему, вызывает реакцию?'), [
        s('ovqat', 'Ovqat', 'Овқат', 'Пища'),
        s('dori', 'Dori', 'Дори', 'Лекарство'),
        s('hasharot', 'Hasharot chaqishi', 'Ҳашарот чақиши', 'Укус насекомого'),
        s('chang', 'Chang, oʻsimlik changi yoki hayvonlar', 'Чанг, ўсимлик чанги ёки ҳайвонлар', 'Пыль, пыльца или животные'),
        BILMAYMAN(),
      ]),
      eh('al_ogir', u('Shoshilinch yordam kerak boʻlgan ogʻir allergik reaksiya boʻlganmi?', 'Шошилинч ёрдам керак бўлган оғир аллергик реакция бўлганми?', 'Была ли тяжёлая аллергическая реакция, при которой понадобилась скорая помощь?'), QACHON),
      eh('al_test', u('Allergiya tekshiruvi (teri sinamasi yoki qon tahlili) qilinganmi?', 'Аллергия текшируви (тери синамаси ёки қон таҳлили) қилинганми?', 'Проводилось ли аллергологическое обследование (кожные пробы или анализ крови)?'), QACHON_NATIJA),
      eh('al_dori', u('Allergiya uchun dori ishlatiladimi?', 'Аллергия учун дори ишлатиладими?', 'Используются ли лекарства от аллергии?'), DORI_NOMI),
      eh('al_astma', u('Astma yoki ekzema bormi?', 'Астма ёки экзема борми?', 'Есть ли астма или экзема?'), QANDAY),
      eh('al_oila', u('Oilada allergik kasalliklar bormi?', 'Оилада аллергик касалликлар борми?', 'Есть ли в семье аллергические заболевания?'), KIMDA),
    ],
  },

  reproduktoloji: {
    baslik: u('Reproduktolog qabuli', 'Репродуктолог қабули', 'Приём репродуктолога'),
    inceleme: MAKINE,
    sorular: [
      son('rp_muddat', u('Necha oydan beri homiladorlikka urinilmoqda?', 'Неча ойдан бери ҳомиладорликка уринилмоқда?', 'Сколько месяцев длятся попытки забеременеть?'), OY, 0, 240),
      tek('rp_oldin', u('Avval homiladorlik boʻlganmi?', 'Аввал ҳомиладорлик бўлганми?', 'Были ли беременности раньше?'), [
        s('yoq', 'Yoʻq', 'Йўқ', 'Нет'),
        s('tugruq', 'Ha, tugʻruq bilan tugagan', 'Ҳа, туғруқ билан тугаган', 'Да, закончилась родами'),
        s('tushish', 'Ha, homila tushishi yoki rivojlanmay qolgan homiladorlik', 'Ҳа, ҳомила тушиши ёки ривожланмай қолган ҳомиладорлик', 'Да, выкидыш или замершая беременность'),
        s('boshqa', 'Ha, boshqa natija bilan', 'Ҳа, бошқа натижа билан', 'Да, с другим исходом'),
      ]),
      tek('rp_hayz', u('Hayz davri muntazammi?', 'Ҳайз даври мунтазамми?', 'Регулярен ли менструальный цикл?'), [
        s('muntazam', 'Muntazam', 'Мунтазам', 'Регулярный'),
        s('nomuntazam', 'Nomuntazam', 'Номунтазам', 'Нерегулярный'),
        s('yoq', 'Hayz yoʻq', 'Ҳайз йўқ', 'Менструаций нет'),
      ], { cinsiyet: 'female' }),
      eh('rp_tekshiruv', u('Juftlikda bepushtlik boʻyicha tekshiruvlar oʻtkazilganmi (masalan, spermogramma, gormonlar, UTT)?', 'Жуфтликда бепуштлик бўйича текширувлар ўтказилганми (масалан, спермограмма, гормонлар, УТТ)?', 'Проводились ли у пары обследования по бесплодию (например, спермограмма, гормоны, УЗИ)?'), QACHON_NATIJA),
      cok('rp_davolash', u('Qanday davolash usullari qoʻllanilgan?', 'Қандай даволаш усуллари қўлланилган?', 'Какие методы лечения применялись?'), [
        s('dori', 'Ovulyatsiyani ragʻbatlantiruvchi dorilar', 'Овуляцияни рағбатлантирувчи дорилар', 'Стимуляция овуляции препаратами'),
        s('inseminatsiya', 'Bachadon ichiga urugʻlantirish', 'Бачадон ичига уруғлантириш', 'Внутриматочная инсеминация'),
        s('eko', 'EKO', 'ЭКО', 'ЭКО'),
        s('operatsiya', 'Operatsiya', 'Операция', 'Операция'),
        YOQ(),
      ]),
      eh('rp_kasallik', u('Ayolda yoki erkakda jinsiy aʼzolar kasalligi yoki operatsiyasi boʻlganmi?', 'Аёлда ёки эркакда жинсий аъзолар касаллиги ёки операцияси бўлганми?', 'Были ли у женщины или мужчины заболевания или операции на половых органах?'), QANDAY),
    ],
  },

  'cocuk-norolojisi': {
    baslik: u('Bolalar nevrologi qabuli', 'Болалар неврологи қабули', 'Приём детского невролога'),
    inceleme: MAKINE,
    sorular: [
      cok('cn_belgilar', u('Quyidagilardan qaysilari bezovta qiladi?', 'Қуйидагилардан қайсилари безовта қилади?', 'Что из перечисленного беспокоит?'), [
        s('tutqanoq', 'Tutqanoq yoki qotib qolish', 'Тутқаноқ ёки қотиб қолиш', 'Судороги или застывания'),
        s('bosh', 'Bosh ogʻrigʻi', 'Бош оғриғи', 'Головная боль'),
        s('rivojlanish', 'Rivojlanishda orqada qolish', 'Ривожланишда орқада қолиш', 'Отставание в развитии'),
        s('nutq', 'Nutqning kechikishi', 'Нутқнинг кечикиши', 'Задержка речи'),
        s('harakat', 'Yurish yoki harakatda qiyinchilik', 'Юриш ёки ҳаракатда қийинчилик', 'Трудности с ходьбой или движениями'),
        s('diqqat', 'Diqqat yoki xulq muammolari', 'Диққат ёки хулқ муаммолари', 'Проблемы с вниманием или поведением'),
        YOQ(),
      ], { veliMetni: u('Bolada quyidagilardan qaysilari kuzatiladi?', 'Болада қуйидагилардан қайсилари кузатилади?', 'Что из перечисленного наблюдается у ребёнка?') }),
      tek('cn_tugruq', u('Homiladorlik va tugʻruq qanday kechgan?', 'Ҳомиладорлик ва туғруқ қандай кечган?', 'Как протекали беременность и роды?'), [
        s('asoratsiz', 'Asoratsiz', 'Асоратсиз', 'Без осложнений'),
        s('erta', 'Muddatidan oldin tugʻilgan', 'Муддатидан олдин туғилган', 'Родился недоношенным'),
        s('asorat', 'Tugʻruqda asoratlar boʻlgan', 'Туғруқда асоратлар бўлган', 'Были осложнения в родах'),
        BILMAYMAN(),
      ], { veliMetni: u('Bola bilan homiladorlik va tugʻruq qanday kechgan?', 'Бола билан ҳомиладорлик ва туғруқ қандай кечган?', 'Как протекали беременность и роды этим ребёнком?') }),
      eh('cn_isitma', u('Isitma bilan tutqanoq boʻlganmi?', 'Иситма билан тутқаноқ бўлганми?', 'Были ли судороги на фоне температуры?'), QACHON,
        { veliMetni: u('Bolada isitma bilan tutqanoq boʻlganmi?', 'Болада иситма билан тутқаноқ бўлганми?', 'Были ли у ребёнка судороги на фоне температуры?') }),
      eh('cn_tekshiruv', u('EEG, MRT yoki boshqa tekshiruv qilinganmi?', 'ЭЭГ, МРТ ёки бошқа текширув қилинганми?', 'Проводились ли ЭЭГ, МРТ или другие обследования?'), QACHON_NATIJA),
      eh('cn_dori', u('Asab tizimi uchun dori ichiladimi?', 'Асаб тизими учун дори ичиладими?', 'Принимаются ли лекарства, назначенные неврологом?'), DORI_NOMI,
        { veliMetni: u('Bola asab tizimi uchun dori ichadimi?', 'Бола асаб тизими учун дори ичадими?', 'Принимает ли ребёнок лекарства, назначенные неврологом?') }),
      eh('cn_oila', u('Oilada tutqanoq yoki nevrologik kasalliklar bormi?', 'Оилада тутқаноқ ёки неврологик касалликлар борми?', 'Есть ли в семье эпилепсия или неврологические заболевания?'), KIMDA),
    ],
  },

  narkoloji: {
    baslik: u('Narkolog qabuli', 'Нарколог қабули', 'Приём нарколога'),
    inceleme: MAKINE,
    sorular: [
      cok('nk_modda', u('Qaysi moddalar bilan bogʻliq muammo bor?', 'Қайси моддалар билан боғлиқ муаммо бор?', 'С какими веществами связана проблема?'), [
        s('alkogol', 'Alkogol', 'Алкогол', 'Алкоголь'),
        s('tamaki', 'Tamaki yoki nikotin', 'Тамаки ёки никотин', 'Табак или никотин'),
        s('dori', 'Retseptsiz ichilgan tinchlantiruvchi yoki ogʻriq qoldiruvchi dorilar', 'Рецептсиз ичилган тинчлантирувчи ёки оғриқ қолдирувчи дорилар', 'Успокоительные или обезболивающие без назначения врача'),
        s('boshqa', 'Boshqa moddalar', 'Бошқа моддалар', 'Другие вещества'),
      ]),
      tek('nk_oxirgi', u('Oxirgi marta qachon isteʼmol qilingan?', 'Охирги марта қачон истеъмол қилинган?', 'Когда было последнее употребление?'), [
        s('bugun', 'Bugun', 'Бугун', 'Сегодня'),
        s('hafta', 'Shu hafta', 'Шу ҳафта', 'На этой неделе'),
        s('oy', 'Shu oy', 'Шу ой', 'В этом месяце'),
        s('uzoq', 'Bir oydan ham oldin', 'Бир ойдан ҳам олдин', 'Больше месяца назад'),
      ]),
      eh('nk_tashlash', u('Toʻxtatishga urinilganda titrash, terlash, uyqusizlik yoki bezovtalik boʻladimi?', 'Тўхтатишга уринилганда титраш, терлаш, уйқусизлик ёки безовталик бўладими?', 'Бывают ли при попытке прекратить дрожь, потливость, бессонница или беспокойство?'), QANDAY),
      eh('nk_davolash', u('Avval shu muammo boʻyicha davolanganmisiz?', 'Аввал шу муаммо бўйича даволанганмисиз?', 'Лечились ли вы раньше по этой проблеме?'), QACHON),
      tek('nk_istak', u('Hozir isteʼmolni kamaytirish yoki toʻxtatish istagi bormi?', 'Ҳозир истеъмолни камайтириш ёки тўхтатиш истаги борми?', 'Есть ли сейчас желание сократить или прекратить употребление?'), HA_YOQ_BILMAYMAN()),
      eh('nk_kasallik', u('Jigar kasalligi, tutqanoq yoki bosh jarohati boʻlganmi?', 'Жигар касаллиги, тутқаноқ ёки бош жароҳати бўлганми?', 'Были ли заболевания печени, судороги или травма головы?'), QANDAY),
    ],
  },

  diyetoloji: {
    baslik: u('Diyetolog qabuli', 'Диетолог қабули', 'Приём диетолога'),
    inceleme: MAKINE,
    sorular: [
      cok('dg_kasallik', u('Ovqatlanishga taʼsir qiladigan qaysi kasalliklar aniqlangan?', 'Овқатланишга таъсир қиладиган қайси касалликлар аниқланган?', 'Какие заболевания, влияющие на питание, выявлены?'), [
        s('qand', 'Qandli diabet', 'Қандли диабет', 'Сахарный диабет'),
        s('semizlik', 'Semizlik', 'Семизлик', 'Ожирение'),
        s('oshqozon', 'Oshqozon-ichak kasalligi', 'Ошқозон-ичак касаллиги', 'Болезнь желудочно-кишечного тракта'),
        s('buyrak', 'Buyrak kasalligi', 'Буйрак касаллиги', 'Болезнь почек'),
        s('yurak', 'Yurak-qon tomir kasalligi', 'Юрак-қон томир касаллиги', 'Сердечно-сосудистое заболевание'),
        YOQ(),
      ]),
      tek('dg_vazn', u('Oxirgi uch oyda beixtiyor vazn yoʻqotilganmi?', 'Охирги уч ойда беихтиёр вазн йўқотилганми?', 'Было ли за последние три месяца непреднамеренное снижение веса?'), [
        s('yoq', 'Yoʻq', 'Йўқ', 'Нет'),
        s('oz', 'Ha, ozgina', 'Ҳа, озгина', 'Да, немного'),
        s('kop', 'Ha, sezilarli darajada', 'Ҳа, сезиларли даражада', 'Да, заметно'),
        BILMAYMAN(),
      ]),
      eh('dg_parhez', u('Shifokor tomonidan parhez belgilanganmi?', 'Шифокор томонидан парҳез белгиланганми?', 'Назначена ли врачом диета?'), QANDAY),
      cok('dg_belgilar', u('Quyidagilar bezovta qiladimi?', 'Қуйидагилар безовта қиладими?', 'Беспокоит ли что-либо из перечисленного?'), [
        s('ishtaha', 'Ishtaha pasayishi', 'Иштаҳа пасайиши', 'Снижение аппетита'),
        s('yutish', 'Yutishda qiyinchilik', 'Ютишда қийинчилик', 'Трудности при глотании'),
        s('kungil', 'Koʻngil aynishi yoki qusish', 'Кўнгил айниши ёки қусиш', 'Тошнота или рвота'),
        s('ich', 'Ich ketishi yoki qabziyat', 'Ич кетиши ёки қабзият', 'Диарея или запор'),
        YOQ(),
      ]),
      eh('dg_tahlil', u('Oxirgi uch oyda qon tahlillari (qand, xolesterin, gemoglobin) topshirilganmi?', 'Охирги уч ойда қон таҳлиллари (қанд, холестерин, гемоглобин) топширилганми?', 'Сдавались ли за последние три месяца анализы крови (сахар, холестерин, гемоглобин)?'), QACHON_NATIJA),
      eh('dg_qoshimcha', u('Vitamin, mineral yoki maxsus ovqatlanish aralashmalari ichiladimi?', 'Витамин, минерал ёки махсус овқатланиш аралашмалари ичиладими?', 'Принимаются ли витамины, минералы или специальные питательные смеси?'), QAYSI),
      eh('dg_kotarmaslik', u('Ovqat allergiyasi yoki ayrim ovqatlarni koʻtara olmaslik bormi?', 'Овқат аллергияси ёки айрим овқатларни кўтара олмаслик борми?', 'Есть ли пищевая аллергия или непереносимость отдельных продуктов?'), QAYSI),
    ],
  },

  surdoloji: {
    baslik: u('Surdolog qabuli', 'Сурдолог қабули', 'Приём сурдолога'),
    inceleme: MAKINE,
    sorular: [
      tek('sr_quloq', u('Eshitish qaysi quloqda pasaygan?', 'Эшитиш қайси қулоқда пасайган?', 'В каком ухе снижен слух?'), [
        s('ong', 'Oʻng quloqda', 'Ўнг қулоқда', 'В правом'),
        s('chap', 'Chap quloqda', 'Чап қулоқда', 'В левом'),
        s('ikkala', 'Ikkala quloqda', 'Иккала қулоқда', 'В обоих'),
        BILMAYMAN(),
      ]),
      tek('sr_boshlanish', u('Eshitish pasayishi qanday boshlangan?', 'Эшитиш пасайиши қандай бошланган?', 'Как началось снижение слуха?'), [
        s('tosatdan', 'Toʻsatdan, bir necha soat yoki kun ichida', 'Тўсатдан, бир неча соат ёки кун ичида', 'Внезапно, за несколько часов или дней'),
        s('asta', 'Asta-sekin', 'Аста-секин', 'Постепенно'),
        s('tugma', 'Tugʻma yoki bolalikdan', 'Туғма ёки болаликдан', 'Врождённое или с детства'),
        BILMAYMAN(),
      ]),
      eh('sr_yalliglanish', u('Quloq yalligʻlanishi, quloqdan suyuqlik oqishi yoki quloq operatsiyasi boʻlganmi?', 'Қулоқ яллиғланиши, қулоқдан суюқлик оқиши ёки қулоқ операцияси бўлганми?', 'Были ли воспаление уха, выделения из уха или операции на ухе?'), QANDAY),
      eh('sr_dori', u('Eshitishga taʼsir qilishi mumkin boʻlgan dorilar bilan davolanganmisiz?', 'Эшитишга таъсир қилиши мумкин бўлган дорилар билан даволанганмисиз?', 'Лечились ли вы лекарствами, которые могут влиять на слух?'), DORI_NOMI),
      eh('sr_shovqin', u('Quloqda shovqin yoki gʻuvullash bormi?', 'Қулоқда шовқин ёки ғувуллаш борми?', 'Есть ли шум или звон в ушах?'), QANDAY),
      eh('sr_tekshiruv', u('Avval eshitish tekshiruvi (audiometriya) qilinganmi?', 'Аввал эшитиш текшируви (аудиометрия) қилинганми?', 'Проводилась ли раньше проверка слуха (аудиометрия)?'), QACHON_NATIJA),
      eh('sr_apparat', u('Eshitish apparati yoki koxlear implant ishlatiladimi?', 'Эшитиш аппарати ёки кохлеар имплант ишлатиладими?', 'Используется ли слуховой аппарат или кохлеарный имплант?'),
        u('Qachondan beri va qaysi quloqda?', 'Қачондан бери ва қайси қулоқда?', 'С какого времени и на каком ухе?')),
    ],
  },

  'damar-cerrahisi': {
    baslik: u('Qon tomir jarrohi qabuli', 'Қон томир жарроҳи қабули', 'Приём сосудистого хирурга'),
    inceleme: MAKINE,
    sorular: [
      cok('dc_belgilar', u('Quyidagilardan qaysilari bezovta qiladi?', 'Қуйидагилардан қайсилари безовта қилади?', 'Что из перечисленного беспокоит?'), [
        s('yurish', 'Yurganda oyoqda ogʻriq, toʻxtaganda oʻtadigan', 'Юрганда оёқда оғриқ, тўхтаганда ўтадиган', 'Боль в ноге при ходьбе, проходящая в покое'),
        s('vena', 'Oyoqda kengaygan venalar', 'Оёқда кенгайган веналар', 'Расширенные вены на ногах'),
        s('shish', 'Oyoq shishishi', 'Оёқ шишиши', 'Отёк ноги'),
        s('yara', 'Oyoqda bitmaydigan yara', 'Оёқда битмайдиган яра', 'Незаживающая рана на ноге'),
        s('sovuq', 'Oyoq yoki qoʻl sovuqligi, rangining oʻzgarishi', 'Оёқ ёки қўл совуқлиги, рангининг ўзгариши', 'Холод или изменение цвета стопы или кисти'),
        YOQ(),
      ]),
      son('dc_masofa', u('Ogʻriqsiz qancha masofani yura olasiz?', 'Оғриқсиз қанча масофани юра оласиз?', 'Какое расстояние вы можете пройти без боли?'), METR, 0, 10000),
      eh('dc_tromb', u('Qon tomirlarda tromb aniqlanganmi?', 'Қон томирларда тромб аниқланганми?', 'Выявлялся ли тромб в сосудах?'), QACHON),
      eh('dc_operatsiya', u('Qon tomir operatsiyasi qilinganmi yoki stent qoʻyilganmi?', 'Қон томир операцияси қилинганми ёки стент қўйилганми?', 'Была ли операция на сосудах или установка стента?'), QACHON),
      eh('dc_dori', u('Qonni suyultiruvchi dorilar ichiladimi?', 'Қонни суюлтирувчи дорилар ичиладими?', 'Принимаются ли препараты, разжижающие кровь?'), DORI_NOMI),
      eh('dc_tekshiruv', u('Qon tomirlar UTT tekshiruvi qilinganmi?', 'Қон томирлар УТТ текшируви қилинганми?', 'Проводилось ли УЗИ сосудов?'), QACHON_NATIJA),
    ],
  },
}
