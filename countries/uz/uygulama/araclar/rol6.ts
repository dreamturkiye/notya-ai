/**
 * NOTYA-ULKE-ARACLAR-01 — Uzbekistan: ROLE TOOLS, sixth part. Records and product reminders for specialties and
 * clinic roles whose grids had no tool of their own. No national schedule, no dose, no payer rule, no emergency number.
 *
 * Every tool names the roles that see it. MACHINE-WRITTEN. AWAITS NATIVE REVIEW (see ./index.ts).
 * Cyrillic derived from the Latin text by rule. Hair transplant, longevity and the gestational-age rule are not here:
 * this pack has no hair-transplant or longevity role, and gestational age is the country's own tool.
 */
import type { PaketAraci } from '@/lib/ulke/araclar/tipler'
import { BELGILANGAN_BANDLAR, DOZASIZ, KARAR, KEYINGI_NAZORAT, KEYINGI_NAZORAT_SANASI, ayni, u, type Uc } from './yardimci'

const HATIRLATMA = u('Bu sanalar mahsulot eslatmalaridir. Har birini shifokor tasdiqlaydi. Bu milliy jadval emas.', 'Бу саналар маҳсулот эслатмаларидир. Ҳар бирини шифокор тасдиқлайди. Бу миллий жадвал эмас.', 'Эти даты — напоминания продукта. Каждую подтверждает врач. Это не национальный график.')
const ACIL_NOT = u('Qaror yozuvi. Raqam yozilmaydi: mamlakatdagi shoshilinch yordam tartibiga amal qiling. Tashxis va davolash shifokorniki.', 'Қарор ёзуви. Рақам ёзилмайди: мамлакатдаги шошилинч ёрдам тартибига амал қилинг. Ташхис ва даволаш шифокорники.', 'Запись для решения. Номер не указывается: действуйте по порядку экстренной помощи этой страны. Диагноз и лечение определяет врач.')
const ACIL = u('Belgilangan belgi bor: mamlakatdagi shoshilinch yordam tartibiga amal qiling.', 'Белгиланган белги бор: мамлакатдаги шошилинч ёрдам тартибига амал қилинг.', 'Отмечен признак: действуйте по порядку экстренной помощи этой страны.')
const BOSHLANGICH = u('Boshlangʻich sana', 'Бошланғич сана', 'Дата начала')
const BOSHLANGICH_AD = u('Boshlanish', 'Бошланиш', 'Начало')
const YUQ = u('Bulardan hech biri', 'Булардан ҳеч бири', 'Ни одного из этих')
const G1 = u('Eslatma, 1-kun', 'Эслатма, 1-кун', 'Напоминание, день 1')
const G7 = u('Eslatma, 7-kun', 'Эслатма, 7-кун', 'Напоминание, день 7')
const G14 = u('Eslatma, 14-kun', 'Эслатма, 14-кун', 'Напоминание, день 14')
const G28 = u('Eslatma, 28-kun', 'Эслатма, 28-кун', 'Напоминание, день 28')
const G42 = u('Eslatma, 42-kun', 'Эслатма, 42-кун', 'Напоминание, день 42')
const G84 = u('Eslatma, 84-kun', 'Эслатма, 84-кун', 'Напоминание, день 84')
const C1 = u('Eslatma sanasi oʻtdi (1-kun)', 'Эслатма санаси ўтди (1-кун)', 'Дата напоминания прошла (день 1)')
const C7 = u('Eslatma sanasi oʻtdi (7-kun)', 'Эслатма санаси ўтди (7-кун)', 'Дата напоминания прошла (день 7)')
const C14 = u('Eslatma sanasi oʻtdi (14-kun)', 'Эслатма санаси ўтди (14-кун)', 'Дата напоминания прошла (день 14)')
const C28 = u('Eslatma sanasi oʻtdi (28-kun)', 'Эслатма санаси ўтди (28-кун)', 'Дата напоминания прошла (день 28)')
const C42 = u('Eslatma sanasi oʻtdi (42-kun)', 'Эслатма санаси ўтди (42-кун)', 'Дата напоминания прошла (день 42)')
const C84 = u('Eslatma sanasi oʻtdi (84-kun)', 'Эслатма санаси ўтди (84-кун)', 'Дата напоминания прошла (день 84)')

function vade(anahtar: string, roller: readonly string[], ad: Uc, aciklama: Uc, tarihler: Record<string, Uc>, uyarilar: Record<string, Uc>): PaketAraci {
  return { anahtar, roller, metin: { ad, aciklama, alanlar: { baslangic: BOSHLANGICH }, tarihler: { baslangic: BOSHLANGICH_AD, ...tarihler }, uyarilar, not: HATIRLATMA } }
}

export const UZ_ROL_ARACLARI_6: readonly PaketAraci[] = [
  {
    anahtar: 'endoskopi-kaydi', roller: ['gastroenteroloji'],
    metin: {
      ad: u('Endoskopiya yozuvi', 'Эндоскопия ёзуви', 'Запись эндоскопии'),
      aciklama: u('Tekshiruv turi, sanasi va oʻzingiz kiritgan keyingi sana. Vosita muddat taklif qilmaydi.', 'Текширув тури, санаси ва ўзингиз киритган кейинги сана. Восита муддат таклиф қилмайди.', 'Вид исследования, дата и следующая дата, которую вы вводите. Инструмент срок не предлагает.'),
      alanlar: {
        tip: u('Tekshiruv turi', 'Текширув тури', 'Вид исследования'),
        tarih: u('Tekshiruv sanasi', 'Текширув санаси', 'Дата исследования'),
        rapor: u('Hisobot hujjatda', 'Ҳисобот ҳужжатда', 'Заключение в документах'),
        biyopsi: u('Biopsiya olindi', 'Биопсия олинди', 'Биопсия взята'),
        bilgilendirme: u('Bemor nima kutishini eshitdi', 'Бемор нима кутишини эшитди', 'Пациенту объяснили, чего ожидать'),
        sonraki: KEYINGI_NAZORAT_SANASI,
      },
      secenekler: { tip: { ust: u('Yuqori endoskopiya', 'Юқори эндоскопия', 'Эндоскопия верхних отделов'), kolonoskopi: u('Kolonoskopiya', 'Колоноскопия', 'Колоноскопия'), sigmoidoskopi: u('Sigmoidoskopiya', 'Сигмоидоскопия', 'Сигмоидоскопия'), ercp: u('Oʻt yoʻllari tekshiruvi', 'Ўт йўллари текшируви', 'Исследование желчных путей'), diger: u('Boshqa', 'Бошқа', 'Другое') } },
      sayilar: { isaretli: BELGILANGAN_BANDLAR },
      tarihler: { tarih: u('Tekshiruv', 'Текширув', 'Исследование'), sonraki: KEYINGI_NAZORAT },
      not: DOZASIZ,
    },
  },
  {
    anahtar: 'kronik-izlem-kaydi', roller: ['aile-hekimligi', 'dahiliye'],
    metin: {
      ad: u('Surunkali holat yozuvi', 'Сурункали ҳолат ёзуви', 'Запись о хроническом состоянии'),
      aciklama: u('Kuzatilayotgan holat, bugun tekshirilgani va oʻzingiz kiritgan keyingi sana. Vosita muddat taklif qilmaydi.', 'Кузатилаётган ҳолат, бугун текширилгани ва ўзингиз киритган кейинги сана. Восита муддат таклиф қилмайди.', 'Состояние под наблюдением, что проверено сегодня, и следующая дата, которую вы вводите. Инструмент срок не предлагает.'),
      alanlar: { tip: u('Holat', 'Ҳолат', 'Состояние'), ilac: u('Dorilar koʻrib chiqildi', 'Дорилар кўриб чиқилди', 'Лекарства просмотрены'), olcum: u('Oʻlchovlar yozildi', 'Ўлчовлар ёзилди', 'Измерения записаны'), gorusme: u('Reja muhokama qilindi', 'Режа муҳокама қилинди', 'План обсуждён'), sonraki: KEYINGI_NAZORAT_SANASI },
      secenekler: { tip: { ht: u('Yuqori qon bosimi', 'Юқори қон босими', 'Повышенное давление'), dm: u('Qandli diabet', 'Қандли диабет', 'Сахарный диабет'), kkh: u('Yurakning toj kasalligi', 'Юракнинг тож касаллиги', 'Ишемическая болезнь сердца'), koah: u('Surunkali oʻpka kasalligi', 'Сурункали ўпка касаллиги', 'Хроническая болезнь лёгких'), diger: u('Boshqa', 'Бошқа', 'Другое') } },
      sayilar: { isaretli: BELGILANGAN_BANDLAR },
      tarihler: { sonraki: KEYINGI_NAZORAT },
      not: DOZASIZ,
    },
  },
  {
    anahtar: 'birinci-acil-bayrak', roller: ['aile-hekimligi'],
    metin: {
      ad: u('Xavfli belgilar', 'Хавфли белгилар', 'Опасные признаки'),
      aciklama: u('Bor belgini belgilang yoki hech biri yoʻqligini belgilang. Belgi boʻlsa, mamlakatdagi shoshilinch yordam tartibiga amal qilinadi. Raqam yozilmaydi.', 'Бор белгини белгиланг ёки ҳеч бири йўқлигини белгиланг. Белги бўлса, мамлакатдаги шошилинч ёрдам тартибига амал қилинади. Рақам ёзилмайди.', 'Отметьте имеющийся признак или то, что ни одного нет. Если признак есть, действуйте по порядку экстренной помощи этой страны. Номер не указывается.'),
      alanlar: { inme: u('Yuz, qoʻl yoki nutq toʻsatdan oʻzgardi', 'Юз, қўл ёки нутқ тўсатдан ўзгарди', 'Внезапно изменились лицо, рука или речь'), gogus: u('Koʻkrak ogʻrigʻi', 'Кўкрак оғриғи', 'Боль в груди'), nefes: u('Nafas qisishi', 'Нафас қисиши', 'Одышка'), kanama: u('Toʻxtamaydigan qon ketish', 'Тўхтамайдиган қон кетиш', 'Кровотечение, которое не останавливается'), bilinc: u('Ong pasayishi', 'Онг пасайиши', 'Снижение сознания'), anafilaksi: u('Anafilaksiya', 'Анафилаксия', 'Анафилаксия'), yok: YUQ },
      sayilar: { isaretli: BELGILANGAN_BANDLAR },
      uyarilar: { acil: ACIL },
      not: ACIL_NOT,
    },
  },
  {
    anahtar: 'kardiyo-not', roller: ['kardiyoloji'],
    metin: {
      ad: u('Kardiologiya yozuvi', 'Кардиология ёзуви', 'Кардиологическая запись'),
      aciklama: u('Holat va kamida bittasi: qon bosimi yoki faoliyat sinfi. Raqamdan ogohlantirish chiqarilmaydi. Vazn yozilmaydi.', 'Ҳолат ва камида биттаси: қон босими ёки фаолият синфи. Рақамдан огоҳлантириш чиқарилмайди. Вазн ёзилмайди.', 'Состояние и хотя бы одно из: давление или класс активности. По числу предупреждение не выводится. Вес не записывается.'),
      alanlar: { tip: u('Holat', 'Ҳолат', 'Состояние'), sistol: u('Sistolik bosim (ixtiyoriy)', 'Систолик босим (ихтиёрий)', 'Систолическое давление (необязательно)'), diyastol: u('Diastolik bosim (ixtiyoriy)', 'Диастолик босим (ихтиёрий)', 'Диастолическое давление (необязательно)'), nyha: u('Faoliyat sinfi (ixtiyoriy)', 'Фаолият синфи (ихтиёрий)', 'Класс активности (необязательно)'), sonraki: KEYINGI_NAZORAT_SANASI },
      secenekler: { tip: { ht: u('Yuqori qon bosimi', 'Юқори қон босими', 'Повышенное давление'), kky: u('Yurak yetishmovchiligi', 'Юрак етишмовчилиги', 'Сердечная недостаточность'), af: u('Boʻlmachalar fibrillyatsiyasi', 'Бўлмачалар фибрилляцияси', 'Фибрилляция предсердий'), diger: u('Boshqa', 'Бошқа', 'Другое') }, nyha: { i: ayni('I'), ii: ayni('II'), iii: ayni('III'), iv: ayni('IV') } },
      sayilar: { sistol: u('Sistolik bosim', 'Систолик босим', 'Систолическое давление'), diyastol: u('Diastolik bosim', 'Диастолик босим', 'Диастолическое давление') },
      tarihler: { sonraki: KEYINGI_NAZORAT },
      not: KARAR,
    },
  },
  {
    anahtar: 'inme-bayraklari', roller: ['noroloji'],
    metin: {
      ad: u('Insult belgilari', 'Инсульт белгилари', 'Признаки инсульта'),
      aciklama: u('Bor belgini belgilang yoki hech biri yoʻqligini belgilang. Raqam yozilmaydi.', 'Бор белгини белгиланг ёки ҳеч бири йўқлигини белгиланг. Рақам ёзилмайди.', 'Отметьте имеющийся признак или то, что ни одного нет. Номер не указывается.'),
      alanlar: { yuz: u('Yuz osilishi', 'Юз осилиши', 'Опущение лица'), kol: u('Qoʻl kuchsizligi', 'Қўл кучсизлиги', 'Слабость руки'), konusma: u('Nutq qiyinlashuvi', 'Нутқ қийинлашуви', 'Затруднение речи'), ani_bas: u('Toʻsatdan eng kuchli bosh ogʻrigʻi', 'Тўсатдан энг кучли бош оғриғи', 'Внезапная сильнейшая головная боль'), yok: YUQ },
      sayilar: { isaretli: BELGILANGAN_BANDLAR },
      uyarilar: { acil: ACIL },
      not: ACIL_NOT,
    },
  },
  {
    anahtar: 'psikiyatri-guvenlik', roller: ['psikiyatri', 'klinik-psikolog'],
    metin: {
      ad: u('Xavfsizlik belgilari', 'Хавфсизлик белгилари', 'Признаки безопасности'),
      aciklama: u('Bor xavotirni belgilang yoki hech biri yoʻqligini belgilang. Majburiy yotqizish qoidasi yozilmaydi va raqam yozilmaydi.', 'Бор хавотирни белгиланг ёки ҳеч бири йўқлигини белгиланг. Мажбурий ётқизиш қоидаси ёзилмайди ва рақам ёзилмайди.', 'Отметьте имеющееся опасение или то, что ни одного нет. Правило принудительной госпитализации не указывается, и номер не указывается.'),
      alanlar: { intihar: u('Oʻz joniga qasd qilish haqidagi fikrlar', 'Ўз жонига қасд қилиш ҳақидаги фикрлар', 'Мысли о самоубийстве'), kendine: u('Oʻziga zarar', 'Ўзига зарар', 'Самоповреждение'), siddet: u('Zoʻravonlik xavfi', 'Зўравонлик хавфи', 'Риск насилия'), psikoz: u('Oʻtkir psixoz', 'Ўткир психоз', 'Острый психоз'), yok: YUQ },
      sayilar: { isaretli: BELGILANGAN_BANDLAR },
      uyarilar: { guvenlik: u('Xavfsizlik xavotiri belgilangan: mamlakatdagi shoshilinch yordam tartibiga amal qiling.', 'Хавфсизлик хавотири белгиланган: мамлакатдаги шошилинч ёрдам тартибига амал қилинг.', 'Отмечено опасение по безопасности: действуйте по порядку экстренной помощи этой страны.') },
      not: ACIL_NOT,
    },
  },
  {
    anahtar: 'seans-plani', roller: ['fizik-tedavi', 'fizyoterapi'],
    metin: {
      ad: u('Seans rejasi', 'Сеанс режаси', 'План сеансов'),
      aciklama: u('Soha, kamida bitta usul, seanslar soni (1 dan 60 gacha) va haftasiga nechta (1 dan 7 gacha). Dori va doza yoʻq.', 'Соҳа, камида битта усул, сеанслар сони (1 дан 60 гача) ва ҳафтасига нечта (1 дан 7 гача). Дори ва доза йўқ.', 'Область, хотя бы один метод, число сеансов (от 1 до 60) и сколько в неделю (от 1 до 7). Препарата и дозы нет.'),
      alanlar: {
        bolge: u('Soha (ixtiyoriy)', 'Соҳа (ихтиёрий)', 'Область (необязательно)'),
        isi: u('Issiq qoʻyish', 'Иссиқ қўйиш', 'Тепло'), soguk: u('Sovuq', 'Совуқ', 'Холод'), tens: u('Elektroterapiya', 'Электротерапия', 'Электротерапия'), ultrason: u('Terapevtik ultratovush', 'Терапевтик ультратовуш', 'Лечебный ультразвук'), diyatermi: u('Qisqa toʻlqin', 'Қисқа тўлқин', 'Короткая волна'),
        egzersiz: u('Davolovchi mashq', 'Даволовчи машқ', 'Лечебное упражнение'), manuel: u('Qoʻl bilan davolash', 'Қўл билан даволаш', 'Ручное лечение'), traksiyon: u('Choʻzish', 'Чўзиш', 'Вытяжение'), hidro: u('Hovuz', 'Ҳовуз', 'Бассейн'), ortez: u('Moslama oʻrgatish', 'Мослама ўргатиш', 'Обучение приспособлению'),
        seans: u('Seanslar soni', 'Сеанслар сони', 'Число сеансов'), haftalik: u('Haftasiga seans', 'Ҳафтасига сеанс', 'Сеансов в неделю'), sonraki: KEYINGI_NAZORAT_SANASI,
      },
      sayilar: { isaretli: u('Tanlangan usullar', 'Танланган усуллар', 'Выбрано методов'), seans: u('Seanslar', 'Сеанслар', 'Сеансы'), haftalik: u('Haftasiga', 'Ҳафтасига', 'В неделю') },
      tarihler: { sonraki: KEYINGI_NAZORAT },
      not: DOZASIZ,
    },
  },
  {
    anahtar: 'icf-ozet', roller: ['fizik-tedavi', 'fizyoterapi'],
    metin: {
      ad: u('Faoliyat xulosasi', 'Фаолият хулосаси', 'Сводка функционирования'),
      aciklama: u('Qaysi sohalar yozilgani va shifokor rejasi hujjatda ekani. Tasnif matni koʻchirilmaydi.', 'Қайси соҳалар ёзилгани ва шифокор режаси ҳужжатда экани. Тасниф матни кўчирилмайди.', 'Какие области отмечены и что план врача есть в документах. Текст классификации не воспроизводится.'),
      alanlar: { vucut: u('Tana faoliyati va tuzilishi', 'Тана фаолияти ва тузилиши', 'Функции и структуры тела'), aktivite: u('Faoliyat', 'Фаолият', 'Активность'), katilim: u('Ishtirok', 'Иштирок', 'Участие'), cevre: u('Muhit', 'Муҳит', 'Среда'), hekim_plani: u('Shifokor rejasi hujjatda', 'Шифокор режаси ҳужжатда', 'План врача есть в документах'), sonraki: KEYINGI_NAZORAT_SANASI },
      sayilar: { isaretli: u('Yozilgan sohalar', 'Ёзилган соҳалар', 'Отмечено областей') },
      tarihler: { sonraki: KEYINGI_NAZORAT },
      not: KARAR,
    },
  },
  vade('estetik-cerrahi-vade', ['estetik-cerrahi'], u('Estetik jarrohlik eslatmalari', 'Эстетик жарроҳлик эслатмалари', 'Напоминания эстетической хирургии'), u('Boshlangʻich sanadan 1, 7, 14 va 42-kunlar. Oʻtgan sana belgilanadi.', 'Бошланғич санадан 1, 7, 14 ва 42-кунлар. Ўтган сана белгиланади.', 'От даты начала дни 1, 7, 14 и 42. Прошедшая дата отмечается.'), { gun_1: G1, gun_7: G7, gun_14: G14, gun_42: G42 }, { gecikti_gun_1: C1, gecikti_gun_7: C7, gecikti_gun_14: C14, gecikti_gun_42: C42 }),
  vade('estetik-islem-vade', ['medikal-estetik'], u('Estetik muolaja eslatmalari', 'Эстетик муолажа эслатмалари', 'Напоминания эстетической процедуры'), u('Boshlangʻich sanadan 1, 14 va 28-kunlar. Oʻtgan sana belgilanadi.', 'Бошланғич санадан 1, 14 ва 28-кунлар. Ўтган сана белгиланади.', 'От даты начала дни 1, 14 и 28. Прошедшая дата отмечается.'), { gun_1: G1, gun_14: G14, gun_28: G28 }, { gecikti_gun_1: C1, gecikti_gun_14: C14, gecikti_gun_28: C28 }),
  vade('akne-vade', ['dermatoloji', 'klinik-dermatoloji'], u('Akne nazorati eslatmalari', 'Акне назорати эслатмалари', 'Напоминания контроля акне'), u('Boshlangʻich sanadan 14, 42 va 84-kunlar (2, 6 va 12-hafta). Oʻtgan sana belgilanadi.', 'Бошланғич санадан 14, 42 ва 84-кунлар (2, 6 ва 12-ҳафта). Ўтган сана белгиланади.', 'От даты начала дни 14, 42 и 84 (недели 2, 6 и 12). Прошедшая дата отмечается.'), { gun_14: G14, gun_42: G42, gun_84: G84 }, { gecikti_gun_14: C14, gecikti_gun_42: C42, gecikti_gun_84: C84 }),
  {
    anahtar: 'lazer-vade', roller: ['dermatoloji', 'klinik-dermatoloji'],
    metin: {
      ad: u('Lazer oraligʻi', 'Лазер оралиғи', 'Интервал лазера'),
      aciklama: u('Keyingi sana — boshlangʻich sana ustiga siz tanlagan oraliq, 14 dan 90 kungacha. Vosita oʻz oraligʻini taklif qilmaydi.', 'Кейинги сана — бошланғич сана устига сиз танлаган оралиқ, 14 дан 90 кунгача. Восита ўз оралиғини таклиф қилмайди.', 'Следующая дата — дата начала плюс выбранный вами интервал, от 14 до 90 дней. Инструмент свой интервал не предлагает.'),
      alanlar: { baslangic: BOSHLANGICH, aralik_gun: u('Oraliq, kun (14 dan 90 gacha)', 'Оралиқ, кун (14 дан 90 гача)', 'Интервал, дни (от 14 до 90)') },
      sayilar: { aralik_gun: u('Oraliq', 'Оралиқ', 'Интервал') },
      uyarilar: { gecikti: u('Keyingi sana oʻtdi', 'Кейинги сана ўтди', 'Следующая дата прошла') },
      tarihler: { baslangic: BOSHLANGICH_AD, sonraki: u('Keyingi seans', 'Кейинги сеанс', 'Следующий сеанс') },
      not: HATIRLATMA,
    },
  },
  {
    anahtar: 'makro-kaydi', roller: ['diyetoloji'],
    metin: {
      ad: u('Oziqlanish yozuvi', 'Озиқланиш ёзуви', 'Запись питания'),
      aciklama: u('Siz kiritgan kaloriya va oqsil. Formula qoʻllanilmaydi va vazn yozilmaydi.', 'Сиз киритган калория ва оқсил. Формула қўлланилмайди ва вазн ёзилмайди.', 'Калории и белок, которые вы вводите. Формула не применяется и вес не записывается.'),
      alanlar: { kcal: u('Kaloriya', 'Калория', 'Калории'), protein: u('Oqsil', 'Оқсил', 'Белок'), sonraki: KEYINGI_NAZORAT_SANASI },
      sayilar: { kcal: u('Kaloriya', 'Калория', 'Калории'), protein: u('Oqsil', 'Оқсил', 'Белок') },
      tarihler: { sonraki: KEYINGI_NAZORAT },
      not: u('Siz kiritgan sonlarning yozuvi. Bu parhez hisobi emas.', 'Сиз киритган сонларнинг ёзуви. Бу парҳез ҳисоби эмас.', 'Запись чисел, которые вы ввели. Это не расчёт диеты.'),
    },
  },
  {
    anahtar: 'sonraki-seans', roller: ['klinik-psikolog', 'surdoloji'],
    metin: {
      ad: u('Keyingi seans', 'Кейинги сеанс', 'Следующий сеанс'),
      aciklama: u('Shu seans sanasi va oʻzingiz kiritgan keyingi sana. Vosita oraliq taklif qilmaydi.', 'Шу сеанс санаси ва ўзингиз киритган кейинги сана. Восита оралиқ таклиф қилмайди.', 'Дата этого сеанса и следующая дата, которую вы вводите. Инструмент интервал не предлагает.'),
      alanlar: { tarih: u('Shu seans sanasi', 'Шу сеанс санаси', 'Дата этого сеанса'), sonraki: u('Keyingi seans sanasi', 'Кейинги сеанс санаси', 'Дата следующего сеанса') },
      tarihler: { tarih: u('Shu seans', 'Шу сеанс', 'Этот сеанс'), sonraki: u('Keyingi seans', 'Кейинги сеанс', 'Следующий сеанс') },
      not: KARAR,
    },
  },
]
