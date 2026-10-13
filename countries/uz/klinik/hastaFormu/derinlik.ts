/**
 * NOTYA-ULKE-INTAKE-02 — Uzbekistan: red-flag box, two depth questions, and a safety question on psychiatry and
 * clinical psychology. MACHINE-WRITTEN. AWAITS A LOCAL CLINICIAN. PATIENT-FACING.
 *
 * The help line names 103, the pack's ambulance setting (countries/uz/index.ts). That number is UNVERIFIED by a
 * local source. This is not a signed triage rule. The safety question says a clinician reviews the answer; the
 * clinic's procedure for a yes on an unattended form is still open.
 *
 * NO REFERENCE CONTENT. No drug, dose, schedule or score.
 */
import type { RolSorulari, Secenek, Soru } from '@/lib/ulke/intake/tipler'
import { cok, eh, kisa, s, u, YOQ } from './yardimci'

const ACIL = u(
  'Bulardan biri hozir boʻlsa, soʻrovnomani yuborishni kutmang: 103 raqamiga qoʻngʻiroq qiling yoki eng yaqin shoshilinch yordamga boring. Bu soʻrovnoma shoshilinch yordamning oʻrnini bosmaydi.',
  'Булардан бири ҳозир бўлса, сўровномани юборишни кутманг: 103 рақамига қўнғироқ қилинг ёки энг яқин шошилинч ёрдамга боринг. Бу сўровнома шошилинч ёрдамнинг ўрнини босмайди.',
  'Если что-либо из этого есть сейчас, не ждите отправки анкеты: звоните 103 или обратитесь в ближайшую скорую помощь. Эта анкета не заменяет скорую помощь.',
)

const ACIL_XAVFSIZLIK = u(
  `${ACIL['uz-Latn']} Shifokor bu javobni koʻrikdan oldin koʻrib chiqadi.`,
  `${ACIL['uz-Cyrl']} Шифокор бу жавобни кўрикдан олдин кўриб чиқади.`,
  `${ACIL.ru} Врач просматривает этот ответ до приёма.`,
)

const GUVENLIK = new Set(['psikiyatri', 'klinik-psikolog'])

type Qator = readonly [string, string, string, string]
const o = (satirlar: readonly Qator[]): Secenek[] => satirlar.map(([anahtar, lat, kir, ru]) => s(anahtar, lat, kir, ru))

const gogus = o([
  ['kokrak', 'Koʻkrak ogʻrigʻi yoki siqilish', 'Кўкрак оғриғи ёки сиқилиш', 'Боль или сдавление в груди'],
  ['nafas', 'Toʻsatdan yoki ogʻir nafas qisilishi', 'Тўсатдан ёки оғир нафас қисилиши', 'Внезапная или тяжёлая одышка'],
  ['hush', 'Hushdan ketish', 'Ҳушдан кетиш', 'Обморок'],
  ['yuz', 'Yuzning bir tomoni tushishi yoki gapirishning qiyinlashishi', 'Юзнинг бир томони тушиши ёки гапиришнинг қийинлашиши', 'Опущение одной стороны лица или затруднение речи'],
  ['qon', 'Kuchli qon ketish', 'Кучли қон кетиш', 'Сильное кровотечение'],
  ['tomoq', 'Til yoki tomoq shishishi', 'Тил ёки томоқ шишиши', 'Отёк языка или горла'],
])
const noro = o([
  ['yuz', 'Yuzning bir tomoni toʻsatdan tushishi', 'Юзнинг бир томони тўсатдан тушиши', 'Внезапное опущение одной стороны лица'],
  ['nutq', 'Toʻsatdan gapirishning qiyinlashishi', 'Тўсатдан гапиришнинг қийинлашиши', 'Внезапное затруднение речи'],
  ['kuchsiz', 'Qoʻl yoki oyoqda toʻsatdan kuchsizlik', 'Қўл ёки оёқда тўсатдан кучсизлик', 'Внезапная слабость в руке или ноге'],
  ['korish', 'Toʻsatdan koʻrishning yoʻqolishi', 'Тўсатдан кўришнинг йўқолиши', 'Внезапная потеря зрения'],
  ['bosh', 'Toʻsatdan boshlangan eng kuchli bosh ogʻrigʻi', 'Тўсатдан бошланган энг кучли бош оғриғи', 'Самая сильная головная боль, начавшаяся внезапно'],
  ['hush', 'Hushning oʻzgarishi yoki hushdan ketish', 'Ҳушнинг ўзгариши ёки ҳушдан кетиш', 'Изменение сознания или обморок'],
])
const karin = o([
  ['ogriq', 'Qattiq qorin ogʻrigʻi, isitma yoki qusish bilan', 'Қаттиқ қорин оғриғи, иситма ёки қусиш билан', 'Сильная боль в животе с лихорадкой или рвотой'],
  ['qon', 'Qusishda yoki najasda kuchli qon', 'Қусишда ёки нажасда кучли қон', 'Сильная кровь в рвоте или в стуле'],
  ['churra', 'Qaytmaydigan, ogʻriqli yoki qizarib turgan boʻrtiq', 'Қайтмайдиган, оғриқли ёки қизариб турган бўртиқ', 'Выпячивание, которое не вправляется и болит или краснеет'],
  ['yara', 'Operatsiyadan keyin isitma yoki yara qizarishi', 'Операциядан кейин иситма ёки яра қизариши', 'Лихорадка или покраснение раны после операции'],
  ['tutilish', 'Qusish va najas yoki gaz chiqmasligi', 'Қусиш ва нажас ёки газ чиқмаслиги', 'Рвота и отсутствие стула или газов'],
])
const cilt = o([
  ['toshma', 'Isitma bilan keng tarqalgan toshma', 'Иситма билан кенг тарқалган тошма', 'Распространённая сыпь с лихорадкой'],
  ['nafas', 'Nafas olish qiyinlashishi yoki til shishishi', 'Нафас олиш қийинлашиши ёки тил шишиши', 'Затруднение дыхания или отёк языка'],
  ['ogiz', 'Ogʻiz va koʻzda yara, toshma bilan', 'Оғиз ва кўзда яра, тошма билан', 'Язвы во рту и на глазах вместе с сыпью'],
  ['pufak', 'Keng tarqalgan pufakchalar', 'Кенг тарқалган пуфакчалар', 'Распространённые пузыри'],
  ['qizarish', 'Tez yoyilayotgan ogʻriqli qizarish', 'Тез ёйилаётган оғриқли қизариш', 'Болезненное покраснение, которое быстро распространяется'],
])
const goz = o([
  ['korish', 'Koʻrishning toʻsatdan yoʻqolishi', 'Кўришнинг тўсатдан йўқолиши', 'Внезапная потеря зрения'],
  ['charaqlash', 'Yangi yorugʻlik chaqnashlari', 'Янги ёруғлик чақнашлари', 'Новые вспышки света'],
  ['parda', 'Koʻrish oldida parda yoki soya', 'Кўриш олдида парда ёки соя', 'Завеса или тень перед зрением'],
  ['kimyo', 'Koʻzga kimyoviy modda tushishi', 'Кўзга кимёвий модда тушиши', 'Попадание химического вещества в глаз'],
  ['ogriq', 'Ogʻriqli qizil koʻz', 'Оғриқли қизил кўз', 'Болезненный красный глаз'],
])
const kbb = o([
  ['eshitish', 'Eshitishning toʻsatdan yoʻqolishi', 'Эшитишнинг тўсатдан йўқолиши', 'Внезапная потеря слуха'],
  ['qon', 'Toʻxtamaydigan burun qonashi', 'Тўхтамайдиган бурун қонаши', 'Неостанавливающееся носовое кровотечение'],
  ['tomoq', 'Tomoq shishishi bilan nafas olishning qiyinlashishi', 'Томоқ шишиши билан нафас олишнинг қийинлашиши', 'Затруднение дыхания с отёком в горле'],
  ['bosh', 'Ikki koʻrish, nutq qiyinlashishi yoki kuchsizlik bilan bosh aylanishi', 'Икки кўриш, нутқ қийинлашиши ёки кучсизлик билан бош айланиши', 'Головокружение вместе с двоением, затруднением речи или слабостью'],
  ['jarohat', 'Bosh, yuz yoki boʻyinga zarba', 'Бош, юз ёки бўйинга зарба', 'Удар по голове, лицу или шее'],
])
const kadin = o([
  ['qon', 'Kuchli yoki kutilmagan qin qonashi', 'Кучли ёки кутилмаган қин қонаши', 'Сильное или неожиданное вагинальное кровотечение'],
  ['bosh', 'Kuchli bosh ogʻrigʻi yoki koʻrishning oʻzgarishi', 'Кучли бош оғриғи ёки кўришнинг ўзгариши', 'Сильная головная боль или изменение зрения'],
  ['shish', 'Qoʻl yoki yuzning toʻsatdan shishishi', 'Қўл ёки юзнинг тўсатдан шишиши', 'Внезапный отёк кистей или лица'],
  ['harakat', 'Bolaning harakati sezilarli kamayishi', 'Боланинг ҳаракати сезиларли камайиши', 'Заметное уменьшение шевелений ребёнка'],
  ['suv', 'Suvning erta ketishi yoki muntazam kuchli tumgʻilar', 'Сувнинг эрта кетиши ёки мунтазам кучли тумғилар', 'Раннее отхождение вод или регулярные сильные схватки'],
  ['nafas', 'Nafas qisilishi yoki koʻkrak ogʻrigʻi', 'Нафас қисилиши ёки кўкрак оғриғи', 'Одышка или боль в груди'],
])
const uro = o([
  ['siydik', 'Siydik chiqara olmaslik', 'Сийдик чиқара олмаслик', 'Невозможность помочиться'],
  ['qon', 'Siydikda qon', 'Сийдиқда қон', 'Кровь в моче'],
  ['isitma', 'Bel ogʻrigʻi bilan isitma', 'Бел оғриғи билан иситма', 'Лихорадка с болью в пояснице'],
  ['moyak', 'Moyakda toʻsatdan kuchli ogʻriq', 'Мояқда тўсатдан кучли оғриқ', 'Внезапная сильная боль в яичке'],
])
const kemik = o([
  ['oyoq', 'Sovuq, oqarib qolgan yoki pulsiz qoʻl yoki oyoq', 'Совуқ, оқариб қолган ёки пулсиз қўл ёки оёқ', 'Холодная, побледневшая или без пульса рука или нога'],
  ['boyin', 'Jarohatdan keyin boʻyin ogʻrigʻi, kuchsizlik yoki uvishish bilan', 'Жароҳатдан кейин бўйин оғриғи, кучсизлик ёки увишиш билан', 'Боль в шее после травмы со слабостью или онемением'],
  ['kokrak', 'Koʻkrak ogʻrigʻi yoki toʻsatdan nafas qisilishi', 'Кўкрак оғриғи ёки тўсатдан нафас қисилиши', 'Боль в груди или внезапная одышка'],
  ['yiqilish', 'Oyoqqa tushib boʻlmaydigan yiqilish yoki boshga zarba', 'Оёққа тушиб бўлмайдиган йиқилиш ёки бошга зарба', 'Падение с невозможностью опираться на ногу или удар по голове'],
])
const cocuk = o([
  ['suyuqlik', 'Qusish bilan juda kam siydik yoki yosh chiqmasligi', 'Қусиш билан жуда кам сийдик ёки ёш чиқмаслиги', 'Очень мало мочи или отсутствие слёз при рвоте'],
  ['uygotish', 'Uygʻotish qiyinligi', 'Уйғотиш қийинлиги', 'Трудно разбудить'],
  ['nafas', 'Nafas olishning qiyinlashishi', 'Нафас олишнинг қийинлашиши', 'Затруднение дыхания'],
  ['toshma', 'Isitma bilan toshma', 'Иситма билан тошма', 'Сыпь с лихорадкой'],
  ['tutqanoq', 'Tutqanoq', 'Тутқаноқ', 'Судорожный приступ'],
])
const anestezi = o([
  ['kokrak', 'Koʻkrak ogʻrigʻi', 'Кўкрак оғриғи', 'Боль в груди'],
  ['nafas', 'Nafas olishning qiyinlashishi', 'Нафас олишнинг қийинлашиши', 'Затруднение дыхания'],
  ['tomoq', 'Til yoki tomoq shishishi', 'Тил ёки томоқ шишиши', 'Отёк языка или горла'],
  ['qon', 'Kuchli qon ketish', 'Кучли қон кетиш', 'Сильное кровотечение'],
  ['hush', 'Hushning chalkashishi', 'Ҳушнинг чалкашиши', 'Спутанность сознания'],
])
const radyo = o([
  ['nafas', 'Nafas olishning qiyinlashishi', 'Нафас олишнинг қийинлашиши', 'Затруднение дыхания'],
  ['tomoq', 'Til yoki tomoq shishishi', 'Тил ёки томоқ шишиши', 'Отёк языка или горла'],
  ['toshma', 'Tekshiruvdan keyin tez toshma yoki hushdan ketish', 'Текширувдан кейин тез тошма ёки ҳушдан кетиш', 'Быстрая сыпь или обморок после обследования'],
  ['kokrak', 'Koʻkrak ogʻrigʻi', 'Кўкрак оғриғи', 'Боль в груди'],
])
const genel = o([
  ['kokrak', 'Koʻkrak ogʻrigʻi yoki siqilish', 'Кўкрак оғриғи ёки сиқилиш', 'Боль или сдавление в груди'],
  ['nafas', 'Toʻsatdan yoki ogʻir nafas qisilishi', 'Тўсатдан ёки оғир нафас қисилиши', 'Внезапная или тяжёлая одышка'],
  ['hush', 'Hushdan ketish', 'Ҳушдан кетиш', 'Обморок'],
  ['nutq', 'Yuzning tushishi, gapirish qiyinlashishi yoki toʻsatdan kuchsizlik', 'Юзнинг тушиши, гапириш қийинлашиши ёки тўсатдан кучсизлик', 'Опущение лица, затруднение речи или внезапная слабость'],
  ['qon', 'Kuchli qon ketish', 'Кучли қон кетиш', 'Сильное кровотечение'],
  ['tomoq', 'Til yoki tomoq shishishi', 'Тил ёки томоқ шишиши', 'Отёк языка или горла'],
])
const endo = o([
  ['shakar', 'Qon shakarining keskin pasayishiga oʻxshash holat', 'Қон шакарининг кескин пасайишига ўхшаш ҳолат', 'Состояние, похожее на резкое снижение сахара в крови'],
  ['qusish', 'Suyuqlikni ushlab turolmaslik', 'Суюқликни ушлаб туролмаслик', 'Невозможность удерживать жидкость'],
  ['kokrak', 'Koʻkrak ogʻrigʻi yoki nafas qisilishi', 'Кўкрак оғриғи ёки нафас қисилиши', 'Боль в груди или одышка'],
  ['hush', 'Hushning chalkashishi', 'Ҳушнинг чалкашиши', 'Спутанность сознания'],
])
const nefro = o([
  ['siydik', 'Siydik chiqara olmaslik yoki juda kam siydik', 'Сийдик чиқара олмаслик ёки жуда кам сийдик', 'Невозможность помочиться или очень мало мочи'],
  ['nafas', 'Nafas qisilishi', 'Нафас қисилиши', 'Одышка'],
  ['kokrak', 'Koʻkrak ogʻrigʻi', 'Кўкрак оғриғи', 'Боль в груди'],
  ['hush', 'Hushning chalkashishi', 'Ҳушнинг чалкашиши', 'Спутанность сознания'],
  ['qon', 'Kuchli qon ketish', 'Кучли қон кетиш', 'Сильное кровотечение'],
])
const onko = o([
  ['isitma', 'Davolanish paytida isitma', 'Даволаниш пайтида иситма', 'Лихорадка во время лечения'],
  ['nafas', 'Toʻsatdan nafas qisilishi yoki koʻkrak ogʻrigʻi', 'Тўсатдан нафас қисилиши ёки кўкрак оғриғи', 'Внезапная одышка или боль в груди'],
  ['qon', 'Kuchli qon ketish yoki koʻp yangi koʻkarish', 'Кучли қон кетиш ёки кўп янги кўкариш', 'Сильное кровотечение или много новых синяков'],
  ['hush', 'Yangi chalkashlik yoki uygʻotish qiyinligi', 'Янги чалкашлик ёки уйғотиш қийинлиги', 'Новая спутанность или трудность разбудить'],
  ['oyoq', 'Oyoqlarda yangi kuchsizlik', 'Оёқларда янги кучсизлик', 'Новая слабость в ногах'],
])
const plastik = o([
  ['qon', 'Yaradan kuchli qon ketish', 'Ярадан кучли қон кетиш', 'Сильное кровотечение из раны'],
  ['nafas', 'Nafas olish qiyinlashishi yoki koʻkrak ogʻrigʻi', 'Нафас олиш қийинлашиши ёки кўкрак оғриғи', 'Затруднение дыхания или боль в груди'],
  ['yara', 'Isitma bilan tez ogʻriqlashayotgan yara', 'Иситма билан тез оғриқлашаётган яра', 'Рана, которая быстро становится болезненнее, с лихорадкой'],
  ['korish', 'Yuz muolajasidan keyin koʻrishning oʻzgarishi', 'Юз муолажасидан кейин кўришнинг ўзгариши', 'Изменение зрения после процедуры на лице'],
])
const psiki = o([
  ['hush', 'Hushning chalkashishi yoki hushdan ketish', 'Ҳушнинг чалкашиши ёки ҳушдан кетиш', 'Спутанность сознания или обморок'],
  ['nafas', 'Nafas qisilishi yoki koʻkrak ogʻrigʻi', 'Нафас қисилиши ёки кўкрак оғриғи', 'Одышка или боль в груди'],
  ['suv', 'Ovqat va suyuqlikni ushlab turolmaslik', 'Овқат ва суюқликни ушлаб туролмаслик', 'Невозможность удерживать еду и жидкость'],
  ['xavf', 'Hozir oʻziga yoki boshqaga zarar yetkazish xavfi', 'Ҳозир ўзига ёки бошқага зарар етказиш хавфи', 'Опасность причинить вред себе или другому прямо сейчас'],
])
const diyet = o([
  ['shakar', 'Qon shakarining keskin pasayishiga oʻxshash holat', 'Қон шакарининг кескин пасайишига ўхшаш ҳолат', 'Состояние, похожее на резкое снижение сахара в крови'],
  ['qusish', 'Suyuqlikni ushlab turolmaslik', 'Суюқликни ушлаб туролмаслик', 'Невозможность удерживать жидкость'],
  ['kokrak', 'Koʻkrak ogʻrigʻi yoki nafas qisilishi', 'Кўкрак оғриғи ёки нафас қисилиши', 'Боль в груди или одышка'],
  ['hush', 'Hushdan ketish', 'Ҳушдан кетиш', 'Обморок'],
  ['tomoq', 'Ovqatdan keyin til yoki tomoq shishishi', 'Овқатдан кейин тил ёки томоқ шишиши', 'Отёк языка или горла после еды'],
])
const odyo = o([
  ['eshitish', 'Eshitishning toʻsatdan yoʻqolishi', 'Эшитишнинг тўсатдан йўқолиши', 'Внезапная потеря слуха'],
  ['quloq', 'Bir quloqda toʻsatdan eshitish yoki gʻuvullashning yoʻqolishi', 'Бир қулоқда тўсатдан эшитиш ёки ғувуллашнинг йўқолиши', 'Внезапная потеря слуха или звона в одном ухе'],
  ['bosh', 'Ikki koʻrish, nutq qiyinlashishi yoki kuchsizlik bilan aylanish', 'Икки кўриш, нутқ қийинлашиши ёки кучсизлик билан айланиш', 'Вращение вместе с двоением, затруднением речи или слабостью'],
  ['zarba', 'Bosh yoki quloqqa zarba', 'Бош ёки қулоққа зарба', 'Удар по голове или по уху'],
])

const LISTE: Readonly<Record<string, Secenek[]>> = {
  'acil-tip': genel,
  'aile-hekimligi': genel,
  dahiliye: genel,
  kardiyoloji: gogus,
  'kalp-damar-cerrahisi': gogus,
  'gogus-cerrahisi': gogus,
  'gogus-hastaliklari': gogus,
  noroloji: noro,
  'beyin-cerrahisi': noro,
  gastroenteroloji: karin,
  'genel-cerrahi': karin,
  dermatoloji: cilt,
  'klinik-dermatoloji': cilt,
  'medikal-estetik': cilt,
  'goz-hastaliklari': goz,
  'kulak-burun-bogaz': kbb,
  'kadin-hastaliklari-dogum': kadin,
  uroloji: uro,
  ortopedi: kemik,
  'fizik-tedavi': kemik,
  fizyoterapi: kemik,
  'spor-hekimligi': kemik,
  romatoloji: kemik,
  pediatri: cocuk,
  'cocuk-cerrahisi': cocuk,
  anestezi,
  radyoloji: radyo,
  psikiyatri: psiki,
  'klinik-psikolog': psiki,
  endokrinoloji: endo,
  nefroloji: nefro,
  onkoloji: onko,
  'plastik-cerrahi': plastik,
  'estetik-cerrahi': plastik,
  'enfeksiyon-hastaliklari': genel,
  diyetisyen: diyet,
  odyoloji: odyo,
}

const kirmizi = (anahtar: string, secenekler: Secenek[]): Soru => cok(
  anahtar,
  u('Hozir bulardan biri bormi?', 'Ҳозир булардан бири борми?', 'Есть ли сейчас что-либо из этого?'),
  [...secenekler, YOQ()],
  {
    zorunlu: true,
    yardim: ACIL,
    veliMetni: u('Hozir bolada bulardan biri bormi?', 'Ҳозир болада булардан бири борми?', 'Есть ли сейчас что-либо из этого у ребёнка?'),
  },
)

const guvenlik = (anahtar: string): Soru => eh(
  anahtar,
  u(
    'Soʻnggi ikki haftada oʻziga zarar yetkazish yoki hayotni tugatish haqidagi fikrlar boʻlganmi?',
    'Сўнгги икки ҳафтада ўзига зарар етказиш ёки ҳаётни тугатиш ҳақидаги фикрлар бўлганми?',
    'Были ли за последние две недели мысли о самоповреждении или о суициде?',
  ),
  u('Imkon boʻlsa, qisqacha', 'Имкон бўлса, қисқача', 'Коротко, если можно'),
  {
    zorunlu: true,
    yardim: ACIL_XAVFSIZLIK,
    veliMetni: u(
      'Soʻnggi ikki haftada bola oʻziga zarar yetkazish yoki hayotni tugatish haqida gapirganmi?',
      'Сўнгги икки ҳафтада бола ўзига зарар етказиш ёки ҳаётни тугатиш ҳақида гапирганми?',
      'Говорил ли ребёнок за последние две недели о самоповреждении или о суициде?',
    ),
  },
)

/** The set plus a red-flag box, course, what was tried, and — for psychiatry and psychology — the safety question. */
export function derinlestir(rol: string, r: RolSorulari): RolSorulari {
  const onEk = r.sorular[0]?.anahtar.split('_')[0] || 'xx'
  const varMi = new Set(r.sorular.map((q) => q.anahtar))
  const ek: Soru[] = [
    kirmizi(`${onEk}_rf`, LISTE[rol] ?? genel),
    eh(
      `${onEk}_x_worse`,
      u('Muammo kuchayib boryaptimi?', 'Муаммо кучайиб боряптими?', 'Проблема усиливается?'),
      u('Qachondan beri?', 'Қачондан бери?', 'С какого времени?'),
      { veliMetni: u('Bolada muammo kuchayib boryaptimi?', 'Болада муаммо кучайиб боряптими?', 'У ребёнка проблема усиливается?') },
    ),
    kisa(
      `${onEk}_x_tried`,
      u('Shu muammo uchun avval nima qilingan?', 'Шу муаммо учун аввал нима қилинган?', 'Что уже предпринималось по этой проблеме?'),
      { veliMetni: u('Shu muammo uchun bola boʻyicha avval nima qilingan?', 'Шу муаммо учун бола бўйича аввал нима қилинган?', 'Что уже предпринималось по этой проблеме у ребёнка?') },
    ),
  ]
  if (GUVENLIK.has(rol)) ek.push(guvenlik(`${onEk}_safety`))
  return { ...r, sorular: [...r.sorular, ...ek.filter((q) => !varMi.has(q.anahtar))] }
}
