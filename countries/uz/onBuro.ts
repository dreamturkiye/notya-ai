/**
 * WHATSAPP-ONBURO-01 — Uzbekistan: the front-desk language pack ("a new appointment by chat" and "answers from the
 * practice sheet", lib/iletisim/onburo) in the pack's three languages: Uzbek in Latin script (uz-Latn), Uzbek in
 * Cyrillic script (uz-Cyrl) and Russian (ru).
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * MACHINE-WRITTEN. AWAITS A NATIVE READER AND A CLINICIAN. Nobody who reads Uzbek or Russian as a first language has
 * checked a word of this file. Every sentence is PATIENT-FACING, and the two guard lists (emergency, medical) decide
 * when the assistant must stay silent on a medical matter. Until both are read locally this pack must not answer a
 * patient (docs/OPEN-COMMITMENTS.md WHATSAPP-ONBURO-01).
 * ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * One pack RECOGNISES all three languages (a patient may answer an Uzbek message in Russian); `dilSec` picks the
 * language Ayşe's sentences are written in: the script and letters of the message, or — for a bare "2" — the language
 * the conversation already runs in. Cyrillic text with one of ў қ ғ ҳ is Uzbek; other Cyrillic text is read as Russian
 * (a short Uzbek Cyrillic message without those letters is therefore answered in Russian — a known limit of the rule).
 *
 * The emergency number is the pack's own setting (`uygulama.portal.acilNumara`); no sentence here holds a digit.
 * NOT WIRED TO A CHANNEL: this build carries no inbound message pipeline yet (HASTA-ILETISIMI-ULKE-01).
 *
 * Matching: lower case; the Uzbek apostrophe letters are written without their mark (oʻ → o, gʻ → g), ё → е;
 * punctuation to spaces; whole words or space-anchored stems.
 */
import type { BilgiAlani, OnBuroDili, OnBuroMetinleri, RandevuNiyeti, SlotTercihi } from '@/lib/iletisim/onburo/dil/tipler'
import { UZ_PAKETI } from './index'

type Kod = 'uz-Latn' | 'uz-Cyrl' | 'ru'

export function uzKatla(metin: string): string {
  return String(metin || '').toLowerCase().replace(/[ʻʼ'`‘’]/g, '').replace(/ё/g, 'е').replace(/[^a-z0-9а-яўқғҳ\s]/g, ' ').replace(/\s+/g, ' ').trim()
}
export function uzDilBul(metin: string, onceki?: string | null): Kod {
  const m = String(metin || '').toLowerCase()
  if (/[ўқғҳ]/.test(m)) return 'uz-Cyrl'
  if (/[а-я]/.test(m)) return 'ru'
  if (/[a-z]/.test(m)) return 'uz-Latn'
  return onceki === 'uz-Cyrl' || onceki === 'ru' ? onceki : 'uz-Latn'
}

const MAKSIMUM_KELIME = 16
/** Whole words / phrases only: a stem that may take endings says so itself (`\\w*` for Latin, `[а-яўқғҳ]*` for Cyrillic). */
const s = (kaynak: string) => new RegExp('(^| )(' + kaynak + ')( |$)')

// ── Booking intent ────────────────────────────────────────────────────────────────────────────────────────────────────
/** The noun: qabul / navbat / uchrashuv · қабул / навбат / учрашув · запись / прием / талон. */
const ISIM = s('qabul\\w*|navbat\\w*|uchrashuv\\w*|yozil\\w*|қабул[а-яўқғҳ]*|навбат[а-яўқғҳ]*|учрашув[а-яўқғҳ]*|ёзил[а-яўқғҳ]*|езил[а-яўқғҳ]*|запис[а-я]*|запиш[а-я]*|прием[а-я]*|талон[а-я]*')
const ISTEK = s([
  'yozilmoqchiman', 'yozilmoqchimiz', 'yozilsam', 'yozilish\\w*', 'yozib qoying', 'yozib qoysangiz', 'yozing', 'olmoqchiman', 'olmoqchimiz', 'olsam boladimi', 'kerak', 'bormi', 'bering', 'bersangiz',
  'kerakmi', 'kelmoqchiman', 'kelsam boladimi', 'korsatmoqchiman', 'korinmoqchiman', 'bosh vaqt\\w*', 'iltimos',
  'ёзилмоқчиман', 'езилмоқчиман', 'ёзилмоқчимиз', 'ёзилсам', 'ёзиб қўйинг', 'ёзинг', 'олмоқчиман', 'олсам бўладими', 'керак', 'борми', 'беринг', 'келмоқчиман', 'кўринмоқчиман', 'бўш вақт[а-яўқғҳ]*', 'илтимос',
  'хочу', 'хотел[а-я]* бы', 'хотим', 'можно', 'нужн[а-я]*', 'надо', 'запишите', 'записаться', 'запишусь', 'есть', 'пожалуйста', 'свободн[а-я]*', 'когда можно',
].join('|'))
const UYGUNLUK = s([
  'bosh vaqt\\w* bormi', 'bosh joy\\w* bormi', 'qachon kelsam boladi', 'qachon kelishim mumkin', 'eng yaqin vaqt', 'shifokorga korinmoqchiman', 'doktorga korinmoqchiman',
  'бўш вақт[а-яўқғҳ]* борми', 'қачон келсам бўлади', 'энг яқин вақт', 'шифокорга кўринмоқчиман',
  'есть свободн[а-я]* (время|окн[а-я]*|запис[а-я]*)', 'когда можно (прийти|подойти|записаться)', 'ближайш[а-я]* (время|запис[а-я]*|прием[а-я]*)', 'хочу (попасть|показаться) (к врачу|к доктору)', 'записаться (к врачу|к доктору|на прием)',
].join('|'))
const OLUMSUZ = s([
  'kerak emas', 'kerakmas', 'xohlamayman', 'istamayman', 'yozilmayman', 'yozilmoqchi emasman', 'olmayman', 'fikrimdan qaytdim', 'yoq',
  'керак эмас', 'керакмас', 'хоҳламайман', 'истамайман', 'ёзилмайман', 'олмайман', 'йўқ',
  'не хочу', 'не надо', 'не нужн[а-я]*', 'не буду', 'передумал[а-я]*', 'нет',
].join('|'))
const IPTAL_ERTELEME = s([
  'bekor\\w*', 'kochir\\w*', 'ozgartir\\w*', 'boshqa kunga', 'kela olmayman', 'kelolmayman', 'bora olmayman',
  'бекор[а-яўқғҳ]*', 'кўчир[а-яўқғҳ]*', 'ўзгартир[а-яўқғҳ]*', 'бошқа кунга', 'кела олмайман', 'келолмайман',
  'отмен[а-я]*', 'перенес[а-я]*', 'перенос[а-я]*', 'перезапис[а-я]*', 'не смогу', 'не приду', 'не получится прийти',
].join('|'))
const BELIRSIZ = s('balki|ehtimol|oylab koraman|балки|эҳтимол|ўйлаб кўраман|может быть|возможно|наверное|подумаю')
const GECMIS = s('yozilgandim|yozilganman|yozildim|olgandim|ёзилгандим|ёзилганман|ёзилдим|олгандим|записывал[а-я]*|записал[а-я]*|уже запис[а-я]*|был[а-я]* запис[а-я]*')
const BILGI_SORUSU = s('qancha|narx\\w*|necha pul|qayerda|manzil\\w*|қанча|нарх[а-яўқғҳ]*|неча пул|қаерда|манзил[а-яўқғҳ]*|сколько стоит|сколько|цен[а-я]*|стоимост[а-я]*|где|адрес[а-я]*|как записаться|qanday yozil\\w*|қандай ёзил[а-яўқғҳ]*')
/** Talk about an existing appointment: "qabulim qachon", "қабулим қачон", "когда моя запись", "во сколько мой прием". */
const MEVCUT = s('qabulim\\w*|navbatim\\w*|yozilganim\\w*|қабулим[а-яўқғҳ]*|навбатим[а-яўқғҳ]*|мо[йяе][а-я]* (запис[а-я]*|прием[а-я]*)|мне назначен[а-я]*|на (какое|сколько) (время )?(я )?запис[а-я]*')
const YALIN = new Set(['qabul', 'navbat', 'qabulga', 'yozilish', 'қабул', 'навбат', 'қабулга', 'запись', 'записаться', 'прием', 'на прием', 'запишите', 'запишите меня'])

function randevuNiyeti(metin: string): RandevuNiyeti {
  const k = uzKatla(metin)
  if (!k) return 'yok'
  if (k.split(' ').length > MAKSIMUM_KELIME) return 'yok'
  const isim = ISIM.test(k)
  const uygunluk = UYGUNLUK.test(k)
  if (!isim && !uygunluk) return 'yok'
  if (IPTAL_ERTELEME.test(k) || OLUMSUZ.test(k) || BELIRSIZ.test(k) || GECMIS.test(k)) return 'degil'
  if (BILGI_SORUSU.test(k)) return 'degil'
  if (uygunluk || YALIN.has(k)) return 'istek'
  if (MEVCUT.test(k)) return 'degil'
  return ISTEK.test(k) ? 'istek' : 'degil'
}

// ── Day / part of day ─────────────────────────────────────────────────────────────────────────────────────────────────
const BASKA_GUN = s('boshqa (kun|vaqt|sana)\\w*|togri kelmaydi|togri kelmayapti|hech biri|бошқа (кун|вақт|сана)[а-яўқғҳ]*|тўғри келмайди|ҳеч бири|друг[а-я]* (день|время|дат[а-я]*)|не подходит|не подходят|ни один|не могу в эти')
const DAHA_GEC = s('keyinroq|kechroq|keyingi hafta|кейинроқ|кечроқ|кейинги ҳафта|попозже|позже|позднее|на следующей неделе|через неделю')
const DAHA_ERKEN = s('ertaroq|tezroq|eng yaqin|эртароқ|тезроқ|энг яқин|пораньше|раньше|поскорее|ближайш[а-я]*|как можно скорее')
const SABAH = s('ertalab\\w*|tushgacha|tushdan oldin|эрталаб[а-яўқғҳ]*|тушгача|тушдан олдин|утр[а-я]*|до обеда|с утра')
const OGLEDEN_SONRA = s('tushdan keyin|tushdan song|kechqurun|kechki|тушдан кейин|тушдан сўнг|кечқурун|кечки|после обеда|днем|вечер[а-я]*')
const HAFTA_GUNU: Array<[RegExp, number]> = [
  [s('yakshanba\\w*|якшанба[а-яўқғҳ]*|воскресень[а-я]*'), 0], [s('dushanba\\w*|душанба[а-яўқғҳ]*|понедельник[а-я]*'), 1], [s('seshanba\\w*|сешанба[а-яўқғҳ]*|вторник[а-я]*'), 2],
  [s('chorshanba\\w*|чоршанба[а-яўқғҳ]*|сред[а-я]'), 3], [s('payshanba\\w*|пайшанба[а-яўқғҳ]*|четверг[а-я]*'), 4], [s('juma|jumada|jumaga|jumani|жума|жумада|жумага|жумани|пятниц[а-я]'), 5],
  [s('shanba\\w*|шанба[а-яўқғҳ]*|суббот[а-я]'), 6],
]
const AYLAR: string[][] = [
  ['yanvar', 'январ'], ['fevral', 'феврал'], ['mart', 'март'], ['aprel', 'апрел'], ['may', 'май', 'мая'], ['iyun', 'июн'], ['iyul', 'июл'], ['avgust', 'август'],
  ['sentabr', 'sentyabr', 'сентябр', 'сентабр'], ['oktabr', 'oktyabr', 'октябр', 'октабр'], ['noyabr', 'ноябр'], ['dekabr', 'декабр'],
]

function yerelGun(simdi: Date, saatDilimi: string): { gun: string; haftaGunu: number } {
  const p: Record<string, string> = {}
  for (const x of new Intl.DateTimeFormat('en-GB', { timeZone: saatDilimi, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(simdi)) p[x.type] = x.value
  const gun = `${p.year}-${p.month}-${p.day}`
  return { gun, haftaGunu: new Date(`${gun}T12:00:00Z`).getUTCDay() }
}
const gunEkle = (gun: string, n: number): string => new Date(Date.parse(`${gun}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10)
const iso = (y: number, a: number, g: number): string => `${y}-${String(a).padStart(2, '0')}-${String(g).padStart(2, '0')}`

function tercih(metin: string, simdi: Date, saatDilimi: string): SlotTercihi | null {
  const k = uzKatla(metin)
  const t: SlotTercihi = {}
  if (SABAH.test(k)) t.dilim = 'sabah'
  else if (OGLEDEN_SONRA.test(k)) t.dilim = 'ogleden_sonra'
  const { gun: bugun, haftaGunu } = yerelGun(simdi, saatDilimi)
  const yil = Number(bugun.slice(0, 4))
  const ileri = (aday: string): string => (aday < bugun ? `${yil + 1}${aday.slice(4)}` : aday)
  // "20 noyabr", "20-noyabr", "20 ноябр", "20 ноября"
  const gunAy = k.match(/(^| )(\d{1,2}) ([a-zа-яўқғҳ]+)/)
  const ay = gunAy ? AYLAR.findIndex((adlar) => adlar.some((a) => gunAy[3].startsWith(a))) + 1 : 0
  const sayisal = String(metin || '').match(/(^|\s)(\d{1,2})[./](\d{1,2})(\s|$)/)
  // The day after tomorrow is checked before tomorrow: "indinga" / "послезавтра" contain no "ertaga" / "завтра" token of their own.
  if (gunAy && ay && Number(gunAy[2]) >= 1 && Number(gunAy[2]) <= 31) t.gun = ileri(iso(yil, ay, Number(gunAy[2])))
  else if (sayisal && Number(sayisal[2]) >= 1 && Number(sayisal[2]) <= 31 && Number(sayisal[3]) >= 1 && Number(sayisal[3]) <= 12) t.gun = ileri(iso(yil, Number(sayisal[3]), Number(sayisal[2])))
  else if (s('indin\\w*|ertadan keyin|индин[а-яўқғҳ]*|эртадан кейин|послезавтра').test(k)) t.gun = gunEkle(bugun, 2)
  else if (s('ertaga|erta|эртага|эрта|завтра').test(k)) t.gun = gunEkle(bugun, 1)
  else if (s('bugun\\w*|бугун[а-яўқғҳ]*|сегодня').test(k)) t.gun = bugun
  else {
    for (const [re, hedef] of HAFTA_GUNU) {
      if (!re.test(k)) continue
      t.gun = gunEkle(bugun, (hedef - haftaGunu + 7) % 7)
      break
    }
  }
  if (!t.gun) {
    if (BASKA_GUN.test(k)) t.baskaGun = true
    if (DAHA_GEC.test(k)) t.dahaGec = true
    else if (DAHA_ERKEN.test(k)) t.dahaErken = true
  }
  return Object.keys(t).length ? t : null
}

function secim(metin: string): number | null {
  const k = uzKatla(metin)
  const m = k.match(/^([1-3])( chi| inchi| raqam| чи| инчи| рақам| й| я| вариант| номер)?$/) || k.match(/^(вариант|номер|raqam|рақам) ([1-3])$/)
  if (!m) return null
  return Number(/^[1-3]$/.test(m[1]) ? m[1] : m[2])
}

// ── Guards ────────────────────────────────────────────────────────────────────────────────────────────────────────────
const ACIL = [
  // Uzbek, Latin
  'kokragim ogri\\w*|kokrak ogri\\w*|kokragimda ogri\\w*|yurak xuruji\\w*|yuragim (siqil|ogri)\\w*|infarkt\\w*',
  'nafas ololmay\\w*|nafas ola olmay\\w*|nafas olmay\\w*|nafasim (qis|yetmay)\\w*|bogil\\w*|kokarib ket\\w*',
  'qon ket\\w*|qon toxtamay\\w*|kop qon|qon qus\\w*|qon tupur\\w*',
  'ozimni oldir\\w*|oz joniga qasd|yashagim kelmay\\w*|olgim kel\\w*',
  'tutqanoq\\w*|tirish\\w*|talvasa\\w*',
  'hushidan ket\\w*|hushimdan ket\\w*|hushsiz\\w*|behush\\w*|uygonmay\\w*|javob bermay\\w*',
  'insult\\w*|falaj\\w*|yuzi qiyshay\\w*|gapira olmay\\w*',
  'zaharlan\\w*|dorini kop ich\\w*|yutib yubor\\w*',
  'tez yordam|shoshilinch|favqulodda|olyapman|olib qolyap\\w*',
  // Uzbek, Cyrillic
  'кўкрагим оғри[а-яўқғҳ]*|кўкрак оғри[а-яўқғҳ]*|кўкрагимда оғри[а-яўқғҳ]*|юрак хуружи|юрагим (сиқил|оғри)[а-яўқғҳ]*',
  'нафас ололма[а-яўқғҳ]*|нафас ола олма[а-яўқғҳ]*|нафас олма[а-яўқғҳ]*|нафасим (қис|етмай)[а-яўқғҳ]*|бўғил[а-яўқғҳ]*|кўкариб кет[а-яўқғҳ]*',
  'қон кет[а-яўқғҳ]*|қон тўхтама[а-яўқғҳ]*|кўп қон|қон қус[а-яўқғҳ]*',
  'ўзимни ўлдир[а-яўқғҳ]*|ўз жонига қасд|яшагим келма[а-яўқғҳ]*|ўлгим кел[а-яўқғҳ]*',
  'тутқаноқ[а-яўқғҳ]*|тириш[а-яўқғҳ]*|талваса[а-яўқғҳ]*',
  'ҳушидан кет[а-яўқғҳ]*|ҳушимдан кет[а-яўқғҳ]*|ҳушсиз|беҳуш|уйғонма[а-яўқғҳ]*|жавоб берма[а-яўқғҳ]*',
  'фалаж[а-яўқғҳ]*|юзи қийшай[а-яўқғҳ]*|гапира олма[а-яўқғҳ]*',
  'заҳарлан[а-яўқғҳ]*|дорини кўп ич[а-яўқғҳ]*|ютиб юбор[а-яўқғҳ]*',
  'тез ёрдам|тез ердам|шошилинч|фавқулодда|ўляпман',
  // Russian
  'бол[а-я]* в груди|болит (сердце|в груди|грудь)|давит в груди|сердечн[а-я]* приступ|инфаркт[а-я]*',
  'не могу дышать|не может дышать|не дышит|задыха[а-я]*|трудно дышать|тяжело дышать|посинел[а-я]*|синеет',
  'кровотечени[а-я]*|сильно кровит|кровь не останавливается|много крови|кашля[а-я]* кровью|рвота с кровью',
  'суицид[а-я]*|покончить с собой|убить себя|убью себя|не хочу жить|хочу умереть|навредить себе',
  'судорог[а-я]*|припад[а-я]*|приступ эпилепси[а-я]*',
  'без сознания|потерял[а-я]* сознание|обморок[а-я]*|не просыпается|не реагирует|не отвечает',
  'инсульт[а-я]*|перекосило лицо|не может говорить|отнялась (рука|нога)|парализ[а-я]*',
  'отравил[а-я]*|отравлени[а-я]*|передозиров[а-я]*|проглотил[а-я]*|выпил[а-я]* много таблеток',
  'анафилак[а-я]*|отек горла|отекает (горло|язык)|скор[а-я]* помощ[а-я]*|срочно|экстренн[а-я]*|неотложн[а-я]*|умираю|умирает',
].map(s)
const TIBBI = [
  // Uzbek, Latin
  'dori\\w*|tabletka\\w*|antibiotik\\w*|sirop\\w*|ukol\\w*|emla\\w*|vaksina\\w*|maz|malham\\w*|tomchi\\w*',
  'doza\\w*|necha (mg|ml|mahal|marta|tomchi|dona)|qancha ich\\w*|ichsam boladimi|ichish kerakmi|bersam boladimi|berish kerakmi|davom ettir\\w*|toxtat\\w*|nojoya tasir\\w*',
  'isitma\\w*|harorat\\w*|yotal\\w*|qus\\w*|ich ket\\w*|kongil ayn\\w*|ogri\\w*|ogriq\\w*|toshma\\w*|qichi\\w*|shish\\w*|qon\\w*|bosh aylan\\w*|holsiz\\w*|infeksiya\\w*|gripp|shamolla\\w*|kovid|alomat\\w*',
  'tahlil\\w*|analiz\\w*|natija\\w*|uzi|rentgen|mrt|biopsiya',
  'normalmi|normami|xavflimi|jiddiymi|nima qilay|nima qilishim kerak|nima qilsam|otib ketadimi|yordam beradimi',
  'homilador\\w*|homila\\w*|emiz\\w*|hayz\\w*|bolam \\w+|chaqalog\\w*|ozib ket\\w*',
  'tashxis\\w*|davola\\w*|retsept\\w*|operatsiya\\w*|allergiya\\w*|bosim\\w*|qand|qandim\\w*|qandli\\w*|qand (miqdori|kasalligi)\\w*|xolesterin',
  // Uzbek, Cyrillic
  'дори[а-яўқғҳ]*|таблетка[а-яўқғҳ]*|антибиотик[а-яўқғҳ]*|сироп[а-яўқғҳ]*|укол[а-яўқғҳ]*|эмла[а-яўқғҳ]*|вакцина[а-яўқғҳ]*|малҳам[а-яўқғҳ]*|томчи[а-яўқғҳ]*',
  'доза[а-яўқғҳ]*|неча (мг|мл|маҳал|марта|томчи|дона)|қанча ич[а-яўқғҳ]*|ичсам бўладими|ичиш керакми|берсам бўладими|бериш керакми|давом эттир[а-яўқғҳ]*|тўхтат[а-яўқғҳ]*|ножўя таъсир[а-яўқғҳ]*',
  'иситма[а-яўқғҳ]*|ҳарорат[а-яўқғҳ]*|йўтал[а-яўқғҳ]*|қус[а-яўқғҳ]*|ич кет[а-яўқғҳ]*|кўнгил айн[а-яўқғҳ]*|оғри[а-яўқғҳ]*|тошма[а-яўқғҳ]*|қичи[а-яўқғҳ]*|шиш[а-яўқғҳ]*|қон[а-яўқғҳ]*|бош айлан[а-яўқғҳ]*|ҳолсиз[а-яўқғҳ]*|инфекция[а-яўқғҳ]*|шамолла[а-яўқғҳ]*|аломат[а-яўқғҳ]*',
  'таҳлил[а-яўқғҳ]*|натижа[а-яўқғҳ]*',
  'нормалми|хавфлими|жиддийми|нима қилай|нима қилишим керак|нима қилсам|ўтиб кетадими',
  'ҳомиладор[а-яўқғҳ]*|ҳомила[а-яўқғҳ]*|эмиз[а-яўқғҳ]*|ҳайз[а-яўқғҳ]*|болам [а-яўқғҳ]+|чақалоғ[а-яўқғҳ]*',
  'ташхис[а-яўқғҳ]*|давола[а-яўқғҳ]*|босим[а-яўқғҳ]*|қанд|қандим[а-яўқғҳ]*|қандли[а-яўқғҳ]*',
  // Russian
  'лекарств[а-я]*|таблетк[а-я]*|антибиотик[а-я]*|сироп[а-я]*|укол[а-я]*|прививк[а-я]*|вакцин[а-я]*|маз[ьи]|капл[а-я]*|препарат[а-я]*',
  'доз[а-я]*|дозировк[а-я]*|сколько (мг|мл|раз|капель|таблеток)|как (принимать|давать|пить)|можно ли (принимать|давать|пить|есть)|продолжать ли|прекратить|побочн[а-я]*',
  'температур[а-я]*|жар|кашел[а-я]*|кашля[а-я]*|рвот[а-я]*|тошнот[а-я]*|тошнит|понос[а-я]*|диаре[а-я]*|бол[ьи]|болит|болят|сып[ьи]|зуд[а-я]*|чешется|отек[а-я]*|опух[а-я]*|кров[а-я]*|головокружени[а-я]*|слабост[а-я]*|инфекци[а-я]*|грипп[а-я]*|простуд[а-я]*|ковид|симптом[а-я]*',
  'анализ[а-я]*|результат[а-я]*|узи|рентген[а-я]*|мрт|биопси[а-я]*',
  'это нормально|нормально ли|опасно ли|это опасно|серьезно ли|что делать|что мне делать|пройдет ли|поможет ли',
  'беремен[а-я]*|кормлю грудью|грудное вскармливание|месячн[а-я]*|выкидыш[а-я]*|ребенок [а-я]+|малыш [а-я]+|худеет|не ест|не спит',
  'диагноз[а-я]*|лечени[а-я]*|рецепт[а-я]*|операци[а-я]*|аллерги[а-я]*|давлени[а-я]*|сахар[а-я]*|холестерин[а-я]*',
].map(s)

const KONTROL = s('nazorat\\w*|qayta korik\\w*|qayta qabul\\w*|назорат[а-яўқғҳ]*|қайта кўрик[а-яўқғҳ]*|қайта қабул[а-яўқғҳ]*|повторн[а-я]* (прием|визит|осмотр)|контрол[а-я]*')
const ILK = s('birinchi (marta|bor|qabul)\\w*|yangi bemor\\w*|биринчи (марта|бор|қабул)[а-яўқғҳ]*|янги бемор[а-яўқғҳ]*|перв[а-я]* (раз|прием|визит)|новый пациент|впервые')
const HAZIRLIK = s('tayyorgarlik\\w*|tayyorlan\\w*|och qoringa kel\\w*|kelishdan oldin|тайёргарлик[а-яўқғҳ]*|тайёрлан[а-яўқғҳ]*|оч қоринга кел[а-яўқғҳ]*|келишдан олдин|подготов[а-я]*|натощак|перед (приемом|визитом)')
const BILGI_KURALLARI: Array<{ alan: BilgiAlani; desen: RegExp }> = [
  { alan: 'adres', desen: s('manzil\\w*|qayerdasiz\\w*|qayerda joylash\\w*|qanday bor\\w*|манзил[а-яўқғҳ]*|қаердасиз[а-яўқғҳ]*|қаерда жойлаш[а-яўқғҳ]*|қандай бор[а-яўқғҳ]*|адрес[а-я]*|где вы находитесь|где находитесь|как (добраться|доехать|пройти)') },
  { alan: 'harita', desen: s('lokatsiya\\w*|xarita\\w*|geolokatsiya|локация[а-яўқғҳ]*|харита[а-яўқғҳ]*|геолокаци[а-я]*|локаци[а-я]*|карт[ауе]|на карте') },
  { alan: 'calismaSaatleri', desen: s('ish vaqt\\w*|ish tartib\\w*|nechagacha ishla\\w*|nechada ochil\\w*|ochiqmisiz\\w*|ishlaysizmi|иш вақт[а-яўқғҳ]*|иш тартиб[а-яўқғҳ]*|нечагача ишла[а-яўқғҳ]*|очиқмисиз[а-яўқғҳ]*|ишлайсизми|режим работы|график работы|часы работы|до скольки (работаете|вы работаете)|во сколько (открываетесь|закрываетесь)|вы работаете|работаете (сегодня|завтра|в субботу|в воскресенье)') },
  { alan: 'otopark', desen: s('avtoturargoh\\w*|parkovka\\w*|mashina qoy\\w*|автотураргоҳ[а-яўқғҳ]*|парковка[а-яўқғҳ]*|машина қўй[а-яўқғҳ]*|парковк[а-я]*|стоянк[а-я]*|припарковать[а-я]*') },
  { alan: 'ulasim', desen: s('avtobus\\w*|metro\\w*|bekat\\w*|jamoat transport\\w*|автобус[а-яўқғҳ]*|метро|бекат[а-яўқғҳ]*|жамоат транспорт[а-яўқғҳ]*|остановк[а-я]*|общественн[а-я]* транспорт[а-я]*|маршрутк[а-я]*') },
  { alan: 'ucretler', desen: s('narx\\w*|qancha turadi|necha pul|tolov qancha|qabul qancha|нарх[а-яўқғҳ]*|қанча туради|неча пул|қабул қанча|сколько стоит|стоимост[а-я]*|цен[аыу]|прайс[а-я]*|расценк[а-я]*') },
  { alan: 'odeme', desen: s('tolov\\w*|karta\\w*|naqd\\w*|click|payme|тўлов[а-яўқғҳ]*|карта[а-яўқғҳ]*|нақд[а-яўқғҳ]*|оплат[а-я]*|картой|наличн[а-я]*|перевод[а-я]*|рассрочк[а-я]*') },
  { alan: 'sigorta', desen: s('sugurta\\w*|суғурта[а-яўқғҳ]*|страховк[а-я]*|страхов[а-я]* (полис|компани[а-я]*)|полис[а-я]*') },
  { alan: 'getirilecekler', desen: s('nima olib kel\\w*|nimalar kerak|qanday hujjat\\w*|нима олиб кел[а-яўқғҳ]*|нималар керак|қандай ҳужжат[а-яўқғҳ]*|что (взять|принести|нужно взять|брать) с собой|какие документы') },
  { alan: 'iptalPolitikasi', desen: s('bekor qilish (sharti|tartibi|qoidasi)\\w*|бекор қилиш (шарти|тартиби|қоидаси)[а-яўқғҳ]*|услови[а-я]* отмены|правил[а-я]* отмены|если не приду') },
  { alan: 'telefon', desen: s('telefon raqamingiz\\w*|telefoningiz\\w*|qaysi raqam\\w*|qongiroq qilsam|телефон рақамингиз[а-яўқғҳ]*|телефонингиз[а-яўқғҳ]*|қайси рақам[а-яўқғҳ]*|қўнғироқ қилсам|ваш (номер|телефон)|номер телефона|по какому номеру|куда позвонить') },
]
const SORU = s('mi|qachon|qayer\\w*|qanday|qancha|necha|nima\\w*|kim|qaysi|bormi|boladimi|мумкинми|қачон|қаер[а-яўқғҳ]*|қандай|қанча|неча|нима[а-яўқғҳ]*|ким|қайси|борми|бўладими|когда|где|как|сколько|что|кто|какой|какая|какие|можно ли|есть ли|подскажите|скажите|mumkinmi|ayting|aytib yuboring|айтинг')
const AD_DEGIL = new Set([
  'salom', 'assalomu', 'alaykum', 'rahmat', 'katta', 'xop', 'ha', 'yoq', 'iltimos', 'yaxshi', 'mayli', 'qabul', 'navbat', 'ertaga', 'bugun', 'shifokor', 'doktor',
  'салом', 'ассалому', 'алайкум', 'раҳмат', 'катта', 'хўп', 'ҳа', 'йўқ', 'илтимос', 'яхши', 'майли', 'қабул', 'навбат', 'эртага', 'бугун', 'шифокор', 'доктор',
  'здравствуйте', 'привет', 'добрый', 'день', 'вечер', 'утро', 'спасибо', 'большое', 'да', 'нет', 'пожалуйста', 'хорошо', 'ладно', 'запись', 'прием', 'завтра', 'сегодня', 'врач', 'хочу',
])

// ── Sentences ─────────────────────────────────────────────────────────────────────────────────────────────────────────
const acilNumara = String(UZ_PAKETI.uygulama?.portal?.acilNumara || '')
const liste = (satirlar: string[]) => satirlar.map((x, i) => `${i + 1}) ${x}`).join('\n')

const LATN: OnBuroMetinleri = {
  oneri: (st, onayli) => `Boʻsh vaqtlar:\n${liste(st)}\nTanlash uchun raqamini yozing${onayli ? '; klinika tasdiqlagach sizga xabar beriladi' : ''}. Boshqa kun yoki vaqt kerak boʻlsa, yozing (masalan: “seshanba”, “tushdan keyin”).`,
  slotYok: 'Hozircha sizga taklif qiladigan boʻsh vaqt topilmadi. Klinika siz bilan bogʻlanadi.',
  tercihYok: 'Siz soʻragan vaqtda boʻsh joy yoʻq. Eng yaqin boʻsh vaqtlar:',
  slotDoldu: 'Tanlagan vaqtingiz hozirgina band boʻldi.',
  talepAlindi: (z) => `Qabulga yozilish soʻrovingiz qabul qilindi: ${z}. Klinika tasdiqlashi kutilmoqda; tasdiqlangach sizga xabar beriladi.`,
  randevuOlustu: (z) => `Siz qabulga yozildingiz: ${z}. Oʻzgartirish kerak boʻlsa, klinika bilan bogʻlaning.`,
  talepOnaylandi: (z) => `Qabulingiz tasdiqlandi: ${z}. Koʻrishguncha.`,
  talepReddedildi: 'Bu vaqtga soʻrovingizni tasdiqlab boʻlmadi. Boshqa vaqtlar uchun “qabul” deb yozing yoki klinikaga qoʻngʻiroq qiling.',
  randevuGeriAlindi: (z) => `Klinika ${z} dagi qabulingizni bekor qildi. Boshqa vaqt boʻyicha siz bilan bogʻlanishadi.`,
  istekBirakildi: 'Tushunarli, hech narsa yozilmadi. Qabulga yozilmoqchi boʻlsangiz, “qabul” deb yozing.',
  oneriSiniri: 'Sizga qulay vaqtni birga topamiz: klinika siz bilan bogʻlanadi.',
  kimIcin: (adlar) => `Qabul kim uchun?\n${liste(adlar)}\nRaqamini yozsangiz kifoya.`,
  adSor: 'Qabulga yozilish uchun ismingiz va familiyangizni yozing.',
  adAnlasilmadi: 'Ismingiz va familiyangizni bitta xabarda yozing (masalan: Aziz Karimov).',
  yeniHastaTalebi: (z) => `Rahmat. Soʻrovingiz${z ? ` (${z})` : ''} klinikaga yuborildi; tasdiqlangach sizga xabar beriladi.`,
  bekleme: 'Savolingiz klinikaga yetkazildi. Sizga imkon qadar tez javob beriladi.',
  tibbi: `Savolingiz shifokorga yetkazildi. Xabar orqali tashxis qoʻyib yoki davolash boʻyicha maslahat bera olmaymiz; shifokor yoki klinika siz bilan bogʻlanadi.${acilNumara ? ` Shoshilinch holatda ${acilNumara} raqamiga qoʻngʻiroq qiling.` : ''}`,
  acil: `Bu kanal shoshilinch holatlar uchun emas. ${acilNumara ? `Hoziroq ${acilNumara} raqamiga qoʻngʻiroq qiling` : 'Hoziroq tez yordam chaqiring'} yoki eng yaqin shoshilinch yordam boʻlimiga boring.`,
  gizlilik: (d) => `${d ? `${d} klinikasi` : 'Klinika'} qabulga yozilish soʻrovingiz uchun ismingiz va shu telefon raqamingizni yozib oladi.`,
  yanitOnEki: '',
}
const CYRL: OnBuroMetinleri = {
  oneri: (st, onayli) => `Бўш вақтлар:\n${liste(st)}\nТанлаш учун рақамини ёзинг${onayli ? '; клиника тасдиқлагач сизга хабар берилади' : ''}. Бошқа кун ёки вақт керак бўлса, ёзинг (масалан: «сешанба», «тушдан кейин»).`,
  slotYok: 'Ҳозирча сизга таклиф қиладиган бўш вақт топилмади. Клиника сиз билан боғланади.',
  tercihYok: 'Сиз сўраган вақтда бўш жой йўқ. Энг яқин бўш вақтлар:',
  slotDoldu: 'Танлаган вақтингиз ҳозиргина банд бўлди.',
  talepAlindi: (z) => `Қабулга ёзилиш сўровингиз қабул қилинди: ${z}. Клиника тасдиқлаши кутилмоқда; тасдиқлангач сизга хабар берилади.`,
  randevuOlustu: (z) => `Сиз қабулга ёзилдингиз: ${z}. Ўзгартириш керак бўлса, клиника билан боғланинг.`,
  talepOnaylandi: (z) => `Қабулингиз тасдиқланди: ${z}. Кўришгунча.`,
  talepReddedildi: 'Бу вақтга сўровингизни тасдиқлаб бўлмади. Бошқа вақтлар учун «қабул» деб ёзинг ёки клиникага қўнғироқ қилинг.',
  randevuGeriAlindi: (z) => `Клиника ${z} даги қабулингизни бекор қилди. Бошқа вақт бўйича сиз билан боғланишади.`,
  istekBirakildi: 'Тушунарли, ҳеч нарса ёзилмади. Қабулга ёзилмоқчи бўлсангиз, «қабул» деб ёзинг.',
  oneriSiniri: 'Сизга қулай вақтни бирга топамиз: клиника сиз билан боғланади.',
  kimIcin: (adlar) => `Қабул ким учун?\n${liste(adlar)}\nРақамини ёзсангиз кифоя.`,
  adSor: 'Қабулга ёзилиш учун исмингиз ва фамилиянгизни ёзинг.',
  adAnlasilmadi: 'Исмингиз ва фамилиянгизни битта хабарда ёзинг (масалан: Азиз Каримов).',
  yeniHastaTalebi: (z) => `Раҳмат. Сўровингиз${z ? ` (${z})` : ''} клиникага юборилди; тасдиқлангач сизга хабар берилади.`,
  bekleme: 'Саволингиз клиникага етказилди. Сизга имкон қадар тез жавоб берилади.',
  tibbi: `Саволингиз шифокорга етказилди. Хабар орқали ташхис қўйиб ёки даволаш бўйича маслаҳат бера олмаймиз; шифокор ёки клиника сиз билан боғланади.${acilNumara ? ` Шошилинч ҳолатда ${acilNumara} рақамига қўнғироқ қилинг.` : ''}`,
  acil: `Бу канал шошилинч ҳолатлар учун эмас. ${acilNumara ? `Ҳозироқ ${acilNumara} рақамига қўнғироқ қилинг` : 'Ҳозироқ тез ёрдам чақиринг'} ёки энг яқин шошилинч ёрдам бўлимига боринг.`,
  gizlilik: (d) => `${d ? `${d} клиникаси` : 'Клиника'} қабулга ёзилиш сўровингиз учун исмингиз ва шу телефон рақамингизни ёзиб олади.`,
  yanitOnEki: '',
}
const RU: OnBuroMetinleri = {
  oneri: (st, onayli) => `Свободное время:\n${liste(st)}\nЧтобы выбрать, напишите номер${onayli ? '; клиника подтвердит запись и сообщит вам' : ''}. Если нужен другой день или время, напишите (например: «вторник», «после обеда»).`,
  slotYok: 'Сейчас мы не нашли свободного времени, которое можно вам предложить. Клиника свяжется с вами.',
  tercihYok: 'На время, которое вы просили, свободных мест нет. Ближайшее свободное время:',
  slotDoldu: 'Выбранное время только что заняли.',
  talepAlindi: (z) => `Ваша заявка на прием принята: ${z}. Ожидается подтверждение клиники; когда запись подтвердят, вам сообщат.`,
  randevuOlustu: (z) => `Вы записаны на прием: ${z}. Если нужно изменить запись, свяжитесь с клиникой.`,
  talepOnaylandi: (z) => `Ваша запись подтверждена: ${z}. До встречи.`,
  talepReddedildi: 'Подтвердить запись на это время не удалось. Напишите «запись», чтобы посмотреть другое время, или позвоните в клинику.',
  randevuGeriAlindi: (z) => `Клиника отменила вашу запись на ${z}. С вами свяжутся, чтобы подобрать другое время.`,
  istekBirakildi: 'Понятно, запись не оформлена. Когда захотите записаться, напишите «запись».',
  oneriSiniri: 'Давайте подберем время вместе: клиника свяжется с вами.',
  kimIcin: (adlar) => `Для кого запись?\n${liste(adlar)}\nДостаточно написать номер.`,
  adSor: 'Чтобы записаться на прием, напишите ваши имя и фамилию.',
  adAnlasilmadi: 'Напишите, пожалуйста, имя и фамилию одним сообщением (например: Азиз Каримов).',
  yeniHastaTalebi: (z) => `Спасибо. Ваша заявка${z ? ` (${z})` : ''} передана в клинику; когда запись подтвердят, вам сообщат.`,
  bekleme: 'Ваш вопрос передан в клинику. Вам ответят как можно скорее.',
  tibbi: `Ваш вопрос передан врачу. Мы не можем ставить диагноз или давать рекомендации по лечению в сообщениях; врач или клиника свяжутся с вами.${acilNumara ? ` В экстренном случае звоните ${acilNumara}.` : ''}`,
  acil: `Этот канал не предназначен для экстренных случаев. ${acilNumara ? `Позвоните ${acilNumara} прямо сейчас` : 'Вызовите скорую помощь прямо сейчас'} или обратитесь в ближайшее отделение неотложной помощи.`,
  gizlilik: (d) => `${d ? `Клиника врача ${d}` : 'Клиника'} запишет ваше имя и этот номер телефона, чтобы обработать вашу заявку на прием.`,
  yanitOnEki: '',
}

type Etiketler = OnBuroDili['alanEtiketi']
const ETIKET: Record<Kod, Etiketler> = {
  'uz-Latn': {
    adres: 'Manzil', harita: 'Xarita', calismaSaatleri: 'Ish vaqti', otopark: 'Avtoturargoh', ulasim: 'Qanday borish', ucretler: 'Narxlar', odeme: 'Toʻlov',
    sigorta: 'Sugʻurta', getirilecekler: 'Oʻzingiz bilan oling', iptalPolitikasi: 'Bekor qilish tartibi', telefon: 'Telefon',
    'hazirlik.ilk_muayene': 'Birinchi qabulga tayyorgarlik', 'hazirlik.muayene': 'Qabulga tayyorgarlik', 'hazirlik.kontrol': 'Qayta koʻrikka tayyorgarlik',
  },
  'uz-Cyrl': {
    adres: 'Манзил', harita: 'Харита', calismaSaatleri: 'Иш вақти', otopark: 'Автотураргоҳ', ulasim: 'Қандай бориш', ucretler: 'Нархлар', odeme: 'Тўлов',
    sigorta: 'Суғурта', getirilecekler: 'Ўзингиз билан олинг', iptalPolitikasi: 'Бекор қилиш тартиби', telefon: 'Телефон',
    'hazirlik.ilk_muayene': 'Биринчи қабулга тайёргарлик', 'hazirlik.muayene': 'Қабулга тайёргарлик', 'hazirlik.kontrol': 'Қайта кўрикка тайёргарлик',
  },
  ru: {
    adres: 'Адрес', harita: 'Карта', calismaSaatleri: 'Часы работы', otopark: 'Парковка', ulasim: 'Как добраться', ucretler: 'Стоимость', odeme: 'Оплата',
    sigorta: 'Страховка', getirilecekler: 'Возьмите с собой', iptalPolitikasi: 'Отмена записи', telefon: 'Телефон',
    'hazirlik.ilk_muayene': 'Подготовка к первому приему', 'hazirlik.muayene': 'Подготовка к приему', 'hazirlik.kontrol': 'Подготовка к повторному приему',
  },
}
const GUNLER: Record<Kod, string[]> = {
  'uz-Latn': ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'],
  'uz-Cyrl': ['Якшанба', 'Душанба', 'Сешанба', 'Чоршанба', 'Пайшанба', 'Жума', 'Шанба'],
  ru: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
}
const AY_ADI: Record<Kod, string[]> = {
  'uz-Latn': ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'],
  'uz-Cyrl': ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'],
  ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
}
const METIN: Record<Kod, OnBuroMetinleri> = { 'uz-Latn': LATN, 'uz-Cyrl': CYRL, ru: RU }

/** "20-noyabr, juma, 14:30" · "20 ноябрь, жума, 14:30" · "20 ноября, пятница, 14:30" — written here, not left to the platform's locale data. */
function zamanEtiketi(kod: Kod, isoZaman: string, saatDilimi: string): string {
  const p: Record<string, string> = {}
  for (const x of new Intl.DateTimeFormat('en-GB', { timeZone: saatDilimi, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(isoZaman))) p[x.type] = x.value
  const haftaGunu = new Date(`${p.year}-${p.month}-${p.day}T12:00:00Z`).getUTCDay()
  const gun = Number(p.day), ay = AY_ADI[kod][Number(p.month) - 1]
  const tarih = kod === 'uz-Latn' ? `${gun}-${ay}` : `${gun} ${ay}`
  return `${tarih}, ${GUNLER[kod][haftaGunu].toLowerCase()}, ${p.hour}:${p.minute}`
}

function paket(kod: Kod): OnBuroDili {
  return {
    kod,
    acilNumara,
    randevuNiyeti,
    tercih,
    secim,
    acilMi: (metin) => { const k = uzKatla(metin); return ACIL.some((r) => r.test(k)) },
    tibbiMi: (metin) => { const k = uzKatla(metin); return TIBBI.some((r) => r.test(k)) },
    // The Uzbek question particle is written onto the word ("bormi", "мумкинми"); a Russian word may simply end in -ми.
    soruMu: (metin) => /\?/.test(String(metin || '')) || SORU.test(uzKatla(metin)) || (uzDilBul(metin) !== 'ru' && /[a-zа-яўқғҳ]{3,}(mi|ми)( |$)/.test(uzKatla(metin))),
    bilgiAlanlari: (metin) => {
      const k = uzKatla(metin)
      const alanlar: BilgiAlani[] = BILGI_KURALLARI.filter((x) => x.desen.test(k)).map((x) => x.alan)
      if (HAZIRLIK.test(k)) alanlar.push(KONTROL.test(k) ? 'hazirlik.kontrol' : ILK.test(k) ? 'hazirlik.ilk_muayene' : 'hazirlik.muayene')
      return Array.from(new Set(alanlar))
    },
    ziyaretTuru: (metin) => { const k = uzKatla(metin); return KONTROL.test(k) ? 'kontrol' : ILK.test(k) ? 'ilk_muayene' : null },
    adSoyad: (metin) => {
      const ham = String(metin || '').replace(/^\s*(ismim|mening ismim|men|исмим|менинг исмим|мен|меня зовут|мое имя|моё имя|я)\s*[:\-]?\s+/i, '').replace(/[.,!]+$/g, '').trim()
      if (ham.length < 4 || ham.length > 60 || /\d/.test(ham)) return null
      const parcalar = ham.split(/\s+/)
      if (parcalar.length < 2 || parcalar.length > 4) return null
      if (!parcalar.every((x) => /^[A-Za-zА-Яа-яЁёЎўҚқҒғҲҳʻʼ'’-]{2,}$/.test(x))) return null
      if (uzKatla(ham).split(' ').some((t) => AD_DEGIL.has(t))) return null
      if (randevuNiyeti(ham) !== 'yok') return null
      return parcalar.map((x) => x.charAt(0).toUpperCase() + x.slice(1)).join(' ')
    },
    zamanEtiketi: (isoZaman, saatDilimi) => zamanEtiketi(kod, isoZaman, saatDilimi),
    alanEtiketi: ETIKET[kod],
    calismaSaatiMetni: (gunler) => ['1', '2', '3', '4', '5', '6', '0'].filter((g) => gunler[g]?.acik).map((g) => `${GUNLER[kod][Number(g)]} ${gunler[g].baslangic}–${gunler[g].bitis}`).join(', '),
    metin: METIN[kod],
    dilSec: (metin, onceki) => PAKETLER[uzDilBul(metin, onceki)],
  }
}

const PAKETLER: Record<Kod, OnBuroDili> = { 'uz-Latn': paket('uz-Latn'), 'uz-Cyrl': paket('uz-Cyrl'), ru: paket('ru') }

/** The pack's default language is Uzbek in Latin script; `dilSec` gives the language of a message. */
export const UZ_ON_BURO: OnBuroDili = PAKETLER['uz-Latn']
