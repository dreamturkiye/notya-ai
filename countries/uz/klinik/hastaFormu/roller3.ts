/**
 * NOTYA-ULKE-INTAKE-01 — Uzbekistan: THE ROLE QUESTIONS of the intake form, part 3 of 3 — the clinic side: three
 * clinic doctors and two allied professions, and the two sets that two doctor roles now ask through `gibi`.
 *
 * NOTYA-ULKE-UYGULA-UZ (2026-10-10): the sets of the three roles the audit took out (hair transplantation,
 * preventive and anti-ageing medicine, occupational therapy) are gone. `diyetisyen` and `odyoloji` are no roles any
 * more: their sets stay, as the questions of the doctor roles that behave like them (diyetoloji, surdoloji;
 * ../rolListesi.ts). Not one question was written or reworded by that job. A role only Uzbekistan has asks the
 * questions of the role it behaves like: vascular surgery cardiac surgery's, allergology therapy's, reproductology
 * obstetrics and gynaecology's, paediatric neurology neurology's, narcology psychiatry's (the rule is the kit's).
 *
 * MACHINE-WRITTEN. EVERY SET AWAITS A LOCAL CLINICIAN OR PRACTITIONER OF THAT ROLE AND A NATIVE READER.
 * PATIENT-FACING. Everything said at the top of ./roller1.ts holds here. For the allied professions the open
 * question of what the profession may record and decide without a doctor (../notSablonlari.ts, `scope_of_practice`)
 * applies to these questions as well.
 *
 * No product, brand or device is named: a patient is asked which procedures they had, in their own words.
 */
import type { RolSorulari } from '@/lib/ulke/intake/tipler'
import { BALL, cok, eh, kisa, MAKINE, MARTA, QACHON, QANDAY, s, son, STAKAN, tek, u, uzun, YOQ } from './yardimci'

const OGRIQ_KUCHI = u('Ogʻriq qanchalik kuchli? (0 — ogʻriq yoʻq, 10 — chidab boʻlmaydi)', 'Оғриқ қанчалик кучли? (0 — оғриқ йўқ, 10 — чидаб бўлмайди)', 'Насколько сильная боль? (0 — боли нет, 10 — невыносимая)')
const VOSITA = u('Foydalaniladigan yordamchi vositalar (ortez, protez, hassa va boshqalar)', 'Фойдаланиладиган ёрдамчи воситалар (ортез, протез, ҳасса ва бошқалар)', 'Используемые вспомогательные средства (ортез, протез, трость и другое)')
const faollik = () => [
  s('kam', 'Deyarli harakatsiz', 'Деярли ҳаракатсиз', 'Почти нет'),
  s('bazan', 'Haftada bir-ikki marta', 'Ҳафтада бир-икки марта', 'Один-два раза в неделю'),
  s('muntazam', 'Haftada uch marta va undan koʻp', 'Ҳафтада уч марта ва ундан кўп', 'Три раза в неделю и чаще'),
]

export const UZ_ROL_SORULARI_3: Readonly<Record<string, RolSorulari>> = {
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
