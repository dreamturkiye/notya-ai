/**
 * ULKE-BRANS-DERINLIK-01 / -05 (Kaan, 2026-11-08) — Uzbekistan: per role, (1) THE CONSENT DISCUSSION RECORD and (2) THE
 * SPECIALTY CONCLUSION (xulosa), printed on the doctor's letterhead with the BELGE-NO-01 document number and verification
 * code.
 *
 * (1) Consent: Law of the Republic of Uzbekistan "On the protection of citizens' health" No. 265-I of 29.08.1996
 *     (consolidated text with amendments to 30.12.2025, lex.uz/docs/26013, read 2026-11-08): article 24 (patient's rights,
 *     including voluntary consent to and refusal of medical intervention), article 26 (consent to medical intervention),
 *     article 27 (refusal of medical intervention). The record says the discussion took place and what it covered; it
 *     holds no wording of an official consent form — the facility's own form stays the signed document.
 * (2) The conclusion holds the doctor's own words in three sections; nothing is pre-filled.
 *
 * CLASSIFIED: specialty-only — one tool of each kind per role (`uz-<role>-rozilik`, `uz-<role>-xulosa`), that role only.
 * MACHINE-WRITTEN. AWAITS NATIVE, CLINICAL AND LEGAL REVIEW. Cyrillic by rule (./kiril.json).
 */
import type { AracTanimi, PaketAraci } from '@/lib/ulke/araclar/tipler'
import { BOS_SONUC, isaret, isaretliler, metin, tarih } from '@/lib/ulke/araclar/yardimci'
import { u, type Uc } from '../../yardimci'
import { kiril } from './motor'

const QONUN = 'Law of the Republic of Uzbekistan No. 265-I of 29.08.1996 "On the protection of citizens\' health", articles 24, 26 and 27 (consolidated text, lex.uz/docs/26013, read 2026-11-08).'

const ORTAK: readonly [string, Uc][] = [
  ['nitelik', u('Aralashuvning mohiyati va maqsadi tushuntirildi', '', 'Объяснены суть и цель вмешательства')],
  ['riskler', u('Muhim xavflar muhokama qilindi', '', 'Обсуждены существенные риски')],
  ['alternatifler', u('Muqobil usullar, shu jumladan davolanmaslik muhokama qilindi', '', 'Обсуждены альтернативы, включая отказ от лечения')],
  ['beklenti', u('Kutilayotgan natija va tiklanish muhokama qilindi', '', 'Обсуждены ожидаемый результат и восстановление')],
  ['sorular', u('Savollarga javob berildi', '', 'Даны ответы на вопросы')],
  ['rad', u('Rad etish huquqi va uning oqibatlari tushuntirildi', '', 'Разъяснены право на отказ и его последствия')],
  ['vakil', u('Voyaga yetmagan yoki muomalaga layoqatsiz boʻlsa — qonuniy vakil rozilik berdi', '', 'Для несовершеннолетнего или недееспособного — согласие законного представителя')],
]
const ZORUNLU = ['nitelik', 'riskler', 'alternatifler', 'sorular']

type Satir = { rol: string; ad: Uc; konular: readonly [string, Uc][]; xulosa: Uc }

const S: readonly Satir[] = [
  { rol: 'acil-tip', ad: u('Shoshilinch tibbiy yordam', '', 'Скорая и неотложная помощь'), konular: [['sedasyon', u('Sedatsiya xavflari', '', 'Риски седации')]], xulosa: u('Shoshilinch yordam xulosasi', '', 'Заключение неотложной помощи') },
  { rol: 'aile-hekimligi', ad: u('Oilaviy shifokor', '', 'Семейный врач'), konular: [['emlash', u('Emlash foydasi va kutilgan reaksiyalar', '', 'Польза вакцинации и ожидаемые реакции')]], xulosa: u('Yoʻllanma va xulosa', '', 'Направление и заключение') },
  { rol: 'anestezi', ad: u('Anesteziologiya', '', 'Анестезиология'), konular: [['anestezi_turi', u('Anesteziya turi va muqobillari', '', 'Вид анестезии и альтернативы')], ['nadir', u('Kam uchraydigan ogʻir xavflar', '', 'Редкие тяжёлые риски')]], xulosa: u('Anesteziologik koʻrik xulosasi', '', 'Заключение анестезиологического осмотра') },
  { rol: 'beyin-cerrahisi', ad: u('Neyroxirurgiya', '', 'Нейрохирургия'), konular: [['norolojik', u('Yangi nevrologik nuqson', '', 'Новый неврологический дефицит')]], xulosa: u('Neyroxirurg xulosasi', '', 'Заключение нейрохирурга') },
  { rol: 'cocuk-cerrahisi', ad: u('Bolalar xirurgiyasi', '', 'Детская хирургия'), konular: [['vakil_fikri', u('Bolaning oʻz fikri ham tinglandi', '', 'Выслушано мнение ребёнка')]], xulosa: u('Bolalar xirurgi xulosasi', '', 'Заключение детского хирурга') },
  { rol: 'dahiliye', ad: u('Terapiya', '', 'Терапия'), konular: [['dori', u('Dorilar foydasi va nojoʻya taʼsirlari', '', 'Польза и побочные эффекты препаратов')]], xulosa: u('Terapevt xulosasi', '', 'Заключение терапевта') },
  { rol: 'dermatoloji', ad: u('Dermatovenerologiya', '', 'Дерматовенерология'), konular: [['iz', u('Chandiq va pigment oʻzgarishi', '', 'Рубцы и изменения пигментации')], ['foto', u('Klinik suratga olish', '', 'Клиническая фотосъёмка')]], xulosa: u('Dermatoskopiya va teri koʻrigi xulosasi', '', 'Заключение дерматоскопии и осмотра кожи') },
  { rol: 'endokrinoloji', ad: u('Endokrinologiya', '', 'Эндокринология'), konular: [['gipo', u('Gipoglikemiya xavfi', '', 'Риск гипогликемии')]], xulosa: u('Endokrinolog xulosasi', '', 'Заключение эндокринолога') },
  { rol: 'enfeksiyon-hastaliklari', ad: u('Yuqumli kasalliklar', '', 'Инфекционные болезни'), konular: [['bildirim', u('Qonun talab qilsa, sanitariya xizmatiga xabar berish', '', 'Извещение санитарной службы, если требует закон')]], xulosa: u('Infeksionist xulosasi', '', 'Заключение инфекциониста') },
  { rol: 'gastroenteroloji', ad: u('Gastroenterologiya', '', 'Гастроэнтерология'), konular: [['endoskopiya', u('Endoskopiya xavflari', '', 'Риски эндоскопии')]], xulosa: u('Endoskopiya xulosasi', '', 'Заключение эндоскопии') },
  { rol: 'genel-cerrahi', ad: u('Xirurgiya', '', 'Хирургия'), konular: [['infeksiya', u('Yara infeksiyasi va qon ketish', '', 'Раневая инфекция и кровотечение')]], xulosa: u('Xirurg xulosasi', '', 'Заключение хирурга') },
  { rol: 'gogus-cerrahisi', ad: u('Torakal xirurgiya', '', 'Торакальная хирургия'), konular: [['havo', u('Havo oqishi va uzoq nafas yordami', '', 'Утечка воздуха и длительная ИВЛ')]], xulosa: u('Torakal xirurg xulosasi', '', 'Заключение торакального хирурга') },
  { rol: 'gogus-hastaliklari', ad: u('Pulmonologiya', '', 'Пульмонология'), konular: [['bronxoskopiya', u('Bronxoskopiya xavflari', '', 'Риски бронхоскопии')]], xulosa: u('Spirometriya xulosasi', '', 'Заключение спирометрии') },
  { rol: 'goz-hastaliklari', ad: u('Oftalmologiya', '', 'Офтальмология'), konular: [['korish', u('Koʻrishni yoʻqotish xavfi', '', 'Риск потери зрения')]], xulosa: u('Oftalmolog xulosasi', '', 'Заключение офтальмолога') },
  { rol: 'kadin-hastaliklari-dogum', ad: u('Akusherlik va ginekologiya', '', 'Акушерство и гинекология'), konular: [['ona_bola', u('Ona va bola uchun xavflar', '', 'Риски для матери и ребёнка')]], xulosa: u('Akusher-ginekolog xulosasi', '', 'Заключение акушера-гинеколога') },
  { rol: 'kalp-damar-cerrahisi', ad: u('Kardioxirurgiya', '', 'Кардиохирургия'), konular: [['insult', u('Insult va ritm buzilishi', '', 'Инсульт и нарушения ритма')]], xulosa: u('Kardioxirurg xulosasi', '', 'Заключение кардиохирурга') },
  { rol: 'damar-cerrahisi', ad: u('Qon tomirlar xirurgiyasi', '', 'Сосудистая хирургия'), konular: [['amputatsiya', u('Oyoq-qoʻlni yoʻqotish xavfi', '', 'Риск потери конечности')]], xulosa: u('Angioxirurg xulosasi', '', 'Заключение ангиохирурга') },
  { rol: 'kardiyoloji', ad: u('Kardiologiya', '', 'Кардиология'), konular: [['antikoagulyatsiya', u('Antikoagulyatsiya foydasi va qon ketish xavfi', '', 'Польза антикоагуляции и риск кровотечения')]], xulosa: u('EKG va ExoKG xulosasi', '', 'Заключение ЭКГ и ЭхоКГ') },
  { rol: 'kulak-burun-bogaz', ad: u('Otorinolaringologiya', '', 'Оториноларингология'), konular: [['qon', u('Operatsiyadan keyingi qon ketish', '', 'Послеоперационное кровотечение')]], xulosa: u('LOR xulosasi', '', 'Заключение ЛОР-врача') },
  { rol: 'nefroloji', ad: u('Nefrologiya', '', 'Нефрология'), konular: [['dializ', u('Dializ usuli va kirish yoʻli', '', 'Метод диализа и доступ')]], xulosa: u('Nefrolog xulosasi', '', 'Заключение нефролога') },
  { rol: 'noroloji', ad: u('Nevrologiya', '', 'Неврология'), konular: [['dori', u('Dorilar va haydash cheklovlari', '', 'Препараты и ограничения вождения')]], xulosa: u('Nevrolog va neyrofiziologik xulosa', '', 'Заключение невролога и нейрофизиологии') },
  { rol: 'onkoloji', ad: u('Onkologiya', '', 'Онкология'), konular: [['toksiklik', u('Davolash toksikligi', '', 'Токсичность лечения')]], xulosa: u('Onkolog xulosasi', '', 'Заключение онколога') },
  { rol: 'ortopedi', ad: u('Travmatologiya va ortopediya', '', 'Травматология и ортопедия'), konular: [['implant', u('Infeksiya va implant muammolari', '', 'Инфекция и проблемы импланта')]], xulosa: u('Travmatolog xulosasi', '', 'Заключение травматолога') },
  { rol: 'pediatri', ad: u('Pediatriya', '', 'Педиатрия'), konular: [['emlash', u('Emlash foydasi va reaksiyalar', '', 'Польза вакцинации и реакции')]], xulosa: u('Pediatr xulosasi', '', 'Заключение педиатра') },
  { rol: 'plastik-cerrahi', ad: u('Plastik xirurgiya', '', 'Пластическая хирургия'), konular: [['iz', u('Chandiq, asimmetriya, qayta operatsiya', '', 'Рубцы, асимметрия, повторная операция')]], xulosa: u('Plastik xirurg xulosasi', '', 'Заключение пластического хирурга') },
  { rol: 'psikiyatri', ad: u('Psixiatriya', '', 'Психиатрия'), konular: [['maxfiylik', u('Maxfiylik va uning chegaralari', '', 'Конфиденциальность и её пределы')]], xulosa: u('Psixiatr xulosasi', '', 'Заключение психиатра') },
  { rol: 'radyoloji', ad: u('Tibbiy radiologiya', '', 'Медицинская радиология'), konular: [['kontrast', u('Kontrast reaksiyasi va nurlanish', '', 'Реакция на контраст и облучение')]], xulosa: u('Radiologik xulosa', '', 'Радиологическое заключение') },
  { rol: 'romatoloji', ad: u('Revmatologiya', '', 'Ревматология'), konular: [['immunosupressiya', u('Immunosupressiya va infeksiya xavfi', '', 'Иммуносупрессия и риск инфекций')]], xulosa: u('Revmatolog xulosasi', '', 'Заключение ревматолога') },
  { rol: 'uroloji', ad: u('Urologiya', '', 'Урология'), konular: [['funksiya', u('Siydik tuta olish va jinsiy funksiya', '', 'Удержание мочи и половая функция')]], xulosa: u('Urolog xulosasi', '', 'Заключение уролога') },
  { rol: 'spor-hekimligi', ad: u('Sport tibbiyoti', '', 'Спортивная медицина'), konular: [['doping', u('Davolashning antidoping oqibatlari', '', 'Антидопинговые последствия лечения')]], xulosa: u('Sport shifokori xulosasi', '', 'Заключение спортивного врача') },
  { rol: 'fizik-tedavi', ad: u('Reabilitologiya', '', 'Реабилитология'), konular: [['yuklama', u('Mashgʻulot yuklamasi va charchoq', '', 'Нагрузка занятий и утомление')]], xulosa: u('Reabilitolog xulosasi', '', 'Заключение реабилитолога') },
  { rol: 'alerji-immunoloji', ad: u('Allergologiya va klinik immunologiya', '', 'Аллергология и клиническая иммунология'), konular: [['provokatsiya', u('Provokatsiya testi: reaksiya xavfi', '', 'Провокационный тест: риск реакции')]], xulosa: u('Allergolog xulosasi', '', 'Заключение аллерголога') },
  { rol: 'reproduktoloji', ad: u('Reproduktologiya', '', 'Репродуктология'), konular: [['eko', u('YoRT xavflari (giperstimulyatsiya, koʻp homilalik)', '', 'Риски ВРТ (гиперстимуляция, многоплодие)')]], xulosa: u('Reproduktolog xulosasi', '', 'Заключение репродуктолога') },
  { rol: 'cocuk-norolojisi', ad: u('Bolalar nevrologiyasi', '', 'Детская неврология'), konular: [['dori', u('Tutqanoqqa qarshi dorilar taʼsiri', '', 'Действие противосудорожных препаратов')]], xulosa: u('Bolalar nevrologi xulosasi', '', 'Заключение детского невролога') },
  { rol: 'narkoloji', ad: u('Narkologiya', '', 'Наркология'), konular: [['maxfiylik', u('Maxfiylik va qonuniy chegaralar', '', 'Конфиденциальность и правовые пределы')]], xulosa: u('Narkolog xulosasi', '', 'Заключение нарколога') },
  { rol: 'diyetoloji', ad: u('Diyetologiya', '', 'Диетология'), konular: [['parhez', u('Parhez oʻzgarishi xavflari', '', 'Риски изменения диеты')]], xulosa: u('Diyetolog xulosasi', '', 'Заключение диетолога') },
  { rol: 'surdoloji', ad: u('Surdologiya', '', 'Сурдология'), konular: [['apparat', u('Eshitish apparati kutilmalari', '', 'Ожидания от слухового аппарата')]], xulosa: u('Audiologik xulosa', '', 'Аудиологическое заключение') },
  { rol: 'estetik-cerrahi', ad: u('Estetik plastik xirurgiya', '', 'Эстетическая пластическая хирургия'), konular: [['psixologik', u('Psixologik baholash va kutilmalar', '', 'Психологическая оценка и ожидания')], ['foto', u('Oldin-keyin suratlari', '', 'Фото до и после')]], xulosa: u('Estetik xirurg xulosasi', '', 'Заключение эстетического хирурга') },
  { rol: 'medikal-estetik', ad: u('Tibbiy kosmetologiya', '', 'Медицинская косметология'), konular: [['tomir', u('Filler: tomir okklyuziyasi xavfi', '', 'Филлер: риск сосудистой окклюзии')], ['mahsulot', u('Mahsulot va seriya', '', 'Препарат и серия')]], xulosa: u('Kosmetolog muolaja yozuvi', '', 'Запись косметологической процедуры') },
  { rol: 'klinik-dermatoloji', ad: u('Dermatovenerologiya (klinika)', '', 'Дерматовенерология (клиника)'), konular: [['iz', u('Chandiq va pigment oʻzgarishi', '', 'Рубцы и изменения пигментации')]], xulosa: u('Dermatolog xulosasi', '', 'Заключение дерматолога') },
  { rol: 'fizyoterapi', ad: u('Jismoniy reabilitatsiya', '', 'Физическая реабилитация'), konular: [['manual', u('Manual terapiya xavflari', '', 'Риски мануальной терапии')]], xulosa: u('Jismoniy reabilitatsiya xulosasi', '', 'Заключение по физической реабилитации') },
  { rol: 'klinik-psikolog', ad: u('Klinik psixologiya', '', 'Клиническая психология'), konular: [['maxfiylik', u('Maxfiylik va uning chegaralari', '', 'Конфиденциальность и её пределы')]], xulosa: u('Psixologik xulosa', '', 'Психологическое заключение') },
]

export const rozilikAnahtari = (r: string) => `uz-${r}-rozilik`
export const xulosaAnahtari = (r: string) => `uz-${r}-xulosa`
const BILDIRIM_R = u('Rozilik suhbatining yozuvi. Haqiqiy rozilikni olish uchun shifokor javobgar.', '', 'Запись беседы о согласии. За получение действительного согласия отвечает врач.')
const BILDIRIM_X = u('Shifokorning oʻz soʻzlari; hujjat raqami bilan chop etiladi. Bu ekrandan hech narsa yuborilmaydi.', '', 'Слова врача; печатается с номером документа. С этого экрана ничего не отправляется.')

function rozilikTanimi(x: Satir): AracTanimi {
  const kutular = [...ORTAK.map(([k]) => k), ...x.konular.map(([k]) => k)]
  return {
    anahtar: rozilikAnahtari(x.rol), tur: 'liste', alanlar: [metin('islem', { enCok: 80 }), ...kutular.map(isaret)],
    cikti: { sayilar: ['isaretli'], bantlar: [], uyarilar: ['eksik'], tarihler: [] },
    kaynak: QONUN, yazdirilir: true,
    hesapla: (g) => {
      const s = isaretliler(g, kutular)
      if (!s.length) return BOS_SONUC
      return { tamam: true, sayilar: [{ anahtar: 'isaretli', deger: s.length, ondalik: 0, enCok: kutular.length }], bant: null, uyarilar: ZORUNLU.every((k) => s.includes(k)) ? [] : ['eksik'], tarihler: [] }
    },
  }
}

function rozilikPaketi(x: Satir): PaketAraci {
  const alanlar: Record<string, Uc> = { islem: kiril(u('Muhokama qilingan aralashuv (ixtiyoriy)', '', 'Обсуждённое вмешательство (необязательно)')) }
  for (const [k, e] of [...ORTAK, ...x.konular]) alanlar[k] = kiril(e)
  return {
    anahtar: rozilikAnahtari(x.rol), roller: [x.rol],
    metin: {
      ad: kiril(u(`${x.ad['uz-Latn']}: rozilik suhbati yozuvi`, '', `${x.ad.ru}: запись беседы о согласии`)),
      aciklama: kiril(u('Ixtiyoriy xabardor rozilik suhbati boʻlib oʻtgani va nimani qamragani yozib qoʻyiladi. Muassasaning rasmiy rozilik shakli imzolanadigan hujjat boʻlib qoladi.', '', 'Фиксирует, что беседа об информированном добровольном согласии состоялась и что она охватила. Официальный бланк учреждения остаётся подписываемым документом.')),
      alanlar,
      sayilar: { isaretli: kiril(u('Belgilangan bandlar', '', 'Отмечено пунктов')) },
      uyarilar: { eksik: kiril(u('Hali belgilanmagan: mohiyat, xavflar, muqobillar va savollar — rozilik suhbatining asosi.', '', 'Ещё не отмечено: суть, риски, альтернативы и вопросы — основа беседы о согласии.')) },
      not: kiril(u('Suhbat yozuvi. Rozilik shakli ham, yuridik maslahat ham emas.', '', 'Запись беседы. Не бланк согласия и не юридическая консультация.')),
    },
    lisans: { durum: 'serbest', hakSahibi: 'Notya', kaynak: QONUN, bildirim: kiril(BILDIRIM_R) },
  }
}

function xulosaTanimi(x: Satir): AracTanimi {
  const bolum = ['bulgular', 'sonuc', 'oneri']
  return {
    anahtar: xulosaAnahtari(x.rol), tur: 'liste',
    alanlar: [tarih('tarih', true), ...bolum.map((k) => metin(k, { uzun: true }))],
    cikti: { sayilar: ['dolu'], bantlar: [], uyarilar: ['sonuc_yok'], tarihler: ['tarih'] },
    kaynak: null, yazdirilir: true,
    hesapla: (g) => {
      const dolu = bolum.filter((k) => typeof g[k] === 'string' && (g[k] as string).trim()).length
      if (!dolu) return BOS_SONUC
      return { tamam: true, sayilar: [{ anahtar: 'dolu', deger: dolu, ondalik: 0, enCok: 3 }], bant: null, uyarilar: typeof g.sonuc === 'string' && g.sonuc.trim() ? [] : ['sonuc_yok'], tarihler: typeof g.tarih === 'string' ? [{ anahtar: 'tarih', tarih: g.tarih }] : [] }
    },
  }
}

function xulosaPaketi(x: Satir): PaketAraci {
  return {
    anahtar: xulosaAnahtari(x.rol), roller: [x.rol],
    metin: {
      ad: kiril(x.xulosa),
      aciklama: kiril(u('Oʻz soʻzlaringiz bilan tuzilgan xulosa; blankangizda hujjat raqami va tekshirish kodi bilan chop etiladi.', '', 'Заключение вашими словами; печатается на вашем бланке с номером документа и кодом проверки.')),
      alanlar: { tarih: kiril(u('Tekshiruv sanasi (ixtiyoriy)', '', 'Дата исследования (необязательно)')), bulgular: kiril(u('Topilmalar', '', 'Данные')), sonuc: kiril(u('Xulosa', '', 'Заключение')), oneri: kiril(u('Tavsiyalar', '', 'Рекомендации')) },
      sayilar: { dolu: kiril(u('Toʻldirilgan boʻlimlar', '', 'Заполнено разделов')) },
      uyarilar: { sonuc_yok: kiril(u('Xulosa hali yozilmagan.', '', 'Заключение ещё не написано.')) },
      tarihler: { tarih: kiril(u('Tekshiruv sanasi', '', 'Дата исследования')) },
      not: kiril(u('Sizning xulosangiz. Chop etish yoki yuborishdan oldin oʻqing.', '', 'Ваше заключение. Прочтите перед печатью или отправкой.')),
    },
    lisans: { durum: 'serbest', hakSahibi: 'Notya', kaynak: 'Notya\'s own outline (2026-11-08): section headings only; printed with the BELGE-NO-01 document number.', bildirim: kiril(BILDIRIM_X) },
  }
}

export const UZ_ONAM_SATIRLARI = S
export const UZ_ONAM_RAPOR_TANIMLAR: readonly AracTanimi[] = [...S.map(rozilikTanimi), ...S.map(xulosaTanimi)]
export const uzOnamRaporAraclari = (): readonly PaketAraci[] => [...S.map(rozilikPaketi), ...S.map(xulosaPaketi)]
export const UZ_ONAM_RAPOR_ANAHTARLARI: readonly string[] = [...S.map((x) => rozilikAnahtari(x.rol)), ...S.map((x) => xulosaAnahtari(x.rol))]
/** Every Latin text of this file that needs its Cyrillic form from ./kiril.json (scripts/uz-kiril-uzmanlik.mts reads it). */
export const UZ_ONAM_RAPOR_METINLERI = (): Uc[] => uzOnamRaporAraclari().flatMap((p) => metinleriTopla(p))
function metinleriTopla(p: PaketAraci): Uc[] {
  const m = p.metin
  const tek = (x: unknown) => (x && typeof x === 'object' && 'uz-Latn' in (x as Uc) ? [x as Uc] : [])
  const kayit = (r?: Readonly<Record<string, unknown>>) => Object.values(r ?? {}).flatMap(tek)
  return [...tek(m.ad), ...tek(m.aciklama), ...tek(m.not), ...kayit(m.alanlar), ...kayit(m.sayilar), ...kayit(m.uyarilar), ...kayit(m.tarihler), ...kayit(m.bantlar), ...Object.values(m.secenekler ?? {}).flatMap((r) => kayit(r)), ...tek(p.lisans?.bildirim)]
}
export { metinleriTopla }
