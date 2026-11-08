/**
 * ULKE-BRANS-DERINLIK-01 (Kaan, 2026-11-08) — Uzbekistan: specialty scores and calculators, part 1 (emergency care,
 * anaesthesiology, neurosurgery and neurology, therapy, cardiology, pulmonology, gastroenterology, nephrology,
 * endocrinology, infectious diseases, oncology, haematology-related scores). Each row: its roles (≤3), its published
 * INTERNATIONAL source (no Uzbek adaptation of these scores was read; XALQARO), its worked examples (../../uzmanlik.test.ts).
 * Laboratory units as Uzbek laboratories report them in SI (mmol/L, µmol/L, g/L).
 * MACHINE-WRITTEN. AWAITS NATIVE AND CLINICAL REVIEW. Cyrillic derived by rule (scripts/uz-kiril.mjs).
 */
import type { AracAlani } from '@/lib/ulke/araclar/tipler'
import { sayiMi } from '@/lib/ulke/araclar/yardimci'
import { u } from '../../yardimci'
import { b, c, i, t, yuvarla, type UzmanlikSatiri } from './motor'

export const NOT = u('Xalqaro manba boʻyicha hisoblangan natija; Oʻzbekiston milliy protokoli bilan solishtirilmagan. Tashxis va davolash qarori shifokorniki.', '', 'Результат по международному источнику; с национальным протоколом Узбекистана не сверен. Диагноз и лечение определяет врач.')
const s = (anahtar: string, enAz: number, enCok: number, birim?: string, ek: Partial<AracAlani> = {}): AracAlani => ({ anahtar, tur: 'sayi', enAz, enCok, ...(birim ? { birim } : {}), ...ek })
const sec = (anahtar: string, secenekler: string[]): AracAlani => ({ anahtar, tur: 'secim', secenekler })
const ERKEK_AYOL = { erkek: u('Erkak', '', 'Мужской'), kadin: u('Ayol', '', 'Женский') }
const JINS = u('Jinsi', '', 'Пол')

export const UZ_OLCEKLER_1: readonly UzmanlikSatiri[] = [
  {
    sekil: 'toplam', k: 'gcs', roller: ['acil-tip', 'beyin-cerrahisi', 'noroloji'],
    ad: u('Glazgo koma shkalasi', '', 'Шкала комы Глазго'), aciklama: u('Koʻz ochish, nutq va harakat javobi; jami ball va bosh jarohati ogʻirligi.', '', 'Открывание глаз, речевая и двигательная реакция; сумма и тяжесть черепно-мозговой травмы.'),
    not: NOT, kaynak: 'Teasdale G, Jennett B. Assessment of coma and impaired consciousness: a practical scale. Lancet 1974;2:81-4 (13–15 mild, 9–12 moderate, 3–8 severe).',
    alanlar: [
      c('goz', u('Koʻz ochish', '', 'Открывание глаз'), [['4', u('4 — oʻz-oʻzidan', '', '4 — спонтанно'), 4], ['3', u('3 — tovushga', '', '3 — на звук'), 3], ['2', u('2 — bosimga', '', '2 — на давление'), 2], ['1', u('1 — yoʻq', '', '1 — нет'), 1]]),
      c('sozel', u('Nutq javobi', '', 'Речевая реакция'), [['5', u('5 — moʻljal toʻgʻri', '', '5 — ориентирован'), 5], ['4', u('4 — chalkash', '', '4 — спутан'), 4], ['3', u('3 — soʻzlar', '', '3 — слова'), 3], ['2', u('2 — tovushlar', '', '2 — звуки'), 2], ['1', u('1 — yoʻq', '', '1 — нет'), 1]]),
      c('motor', u('Harakat javobi', '', 'Двигательная реакция'), [['6', u('6 — buyruqni bajaradi', '', '6 — выполняет команды'), 6], ['5', u('5 — ogʻriqni aniqlaydi', '', '5 — локализует боль'), 5], ['4', u('4 — oddiy bukilish', '', '4 — обычное сгибание'), 4], ['3', u('3 — gʻayritabiiy bukilish', '', '3 — патологическое сгибание'), 3], ['2', u('2 — yozilish', '', '2 — разгибание'), 2], ['1', u('1 — yoʻq', '', '1 — нет'), 1]]),
    ],
    bantlar: [b(3, 'agir', u('3–8 — ogʻir', '', '3–8 — тяжёлая')), b(9, 'orta', u('9–12 — oʻrtacha', '', '9–12 — средняя')), b(13, 'hafif', u('13–15 — yengil', '', '13–15 — лёгкая'))],
    ornekler: [{ girdi: { goz: '4', sozel: '5', motor: '6' }, toplam: 15, bant: 'hafif' }, { girdi: { goz: '2', sozel: '2', motor: '4' }, toplam: 8, bant: 'agir' }],
  },
  {
    sekil: 'toplam', k: 'qsofa', roller: ['acil-tip', 'enfeksiyon-hastaliklari'],
    ad: u('qSOFA', '', 'qSOFA'), aciklama: u('Infeksiyaga shubhada yomon oqibat xavfi: 2 va undan koʻp mezon — yuqori xavf.', '', 'Риск неблагоприятного исхода при подозрении на инфекцию: 2 и более критерия — высокий риск.'),
    not: NOT, kaynak: 'Seymour CW, et al. Assessment of clinical criteria for sepsis (Sepsis-3). JAMA 2016;315:762-74 (≥2 of 3 criteria).',
    alanlar: [t('solunum', u('Nafas soni ≥22/min', '', 'ЧДД ≥22/мин')), t('bilinc', u('Hushning oʻzgarishi (GCS <15)', '', 'Изменение сознания (GCS <15)')), t('tansiyon', u('Sistolik bosim ≤100 mm sim. ust.', '', 'Систолическое АД ≤100 мм рт. ст.'))],
    bantlar: [b(0, 'dusuk', u('0–1 mezon', '', '0–1 критерий')), b(2, 'yuksek', u('2–3 — yuqori xavf', '', '2–3 — высокий риск'))],
    ornekler: [{ girdi: { solunum: true, tansiyon: true }, toplam: 2, bant: 'yuksek' }],
  },
  {
    sekil: 'toplam', k: 'perc', roller: ['acil-tip', 'gogus-hastaliklari'],
    ad: u('PERC qoidasi (OAT)', '', 'Правило PERC (ТЭЛА)'), aciklama: u('Faqat oldindan ehtimoli past bemorda: birorta mezon boʻlmasa, OAT istisno qilinadi.', '', 'Только при низкой претестовой вероятности: если нет ни одного критерия, ТЭЛА исключается.'),
    not: NOT, kaynak: 'Kline JA, et al. Clinical criteria to prevent unnecessary diagnostic testing in emergency department patients with suspected pulmonary embolism. J Thromb Haemost 2004;2:1247-55.',
    toplamAdi: u('Mavjud mezonlar', '', 'Критериев'),
    alanlar: [t('yas', u('Yoshi ≥50', '', 'Возраст ≥50')), t('nabiz', u('Puls ≥100/min', '', 'ЧСС ≥100/мин')), t('spo2', u('SpO2 <95%', '', 'SpO2 <95%')), t('bacak', u('Bir tomonlama oyoq shishi', '', 'Односторонний отёк ноги')), t('hemoptizi', u('Qon tupurish', '', 'Кровохарканье')), t('cerrahi', u('4 hafta ichida jarrohlik yoki jarohat', '', 'Операция или травма за 4 недели')), t('onceki', u('Avval OAT yoki CHVT', '', 'ТЭЛА или ТГВ в анамнезе')), t('hormon', u('Estrogen qabul qilish', '', 'Приём эстрогенов'))],
    bantlar: [b(0, 'negatif', u('PERC manfiy', '', 'PERC отрицательный')), b(1, 'pozitif', u('PERC musbat — OATni istisno qilib boʻlmaydi', '', 'PERC положительный — ТЭЛА не исключена'))],
    ornekler: [{ girdi: { hicbiri: true }, toplam: 0, bant: 'negatif' }, { girdi: { hormon: true }, toplam: 1, bant: 'pozitif' }],
  },
  {
    sekil: 'toplam', k: 'wells-pe', roller: ['acil-tip', 'gogus-hastaliklari', 'dahiliye'],
    ad: u('Wells shkalasi (OAT)', '', 'Шкала Уэллса (ТЭЛА)'), aciklama: u('OAT ehtimoli, ikki darajali.', '', 'Вероятность ТЭЛА, двухуровневая.'),
    not: NOT, kaynak: 'Wells PS, et al. Thromb Haemost 2000;83:416-20 (two-level: >4 PE likely, ≤4 unlikely).',
    toplamAdi: u('Wells ballari', '', 'Баллы Уэллса'),
    alanlar: [t('dvt', u('CHVT belgilari (3)', '', 'Признаки ТГВ (3)'), 6), t('alternatif', u('OAT eng ehtimolli tashxis (3)', '', 'ТЭЛА — наиболее вероятный диагноз (3)'), 6), t('nabiz', u('Puls >100/min (1,5)', '', 'ЧСС >100/мин (1,5)'), 3), t('immobil', u('≥3 kun harakatsizlik yoki 4 hafta ichida jarrohlik (1,5)', '', 'Иммобилизация ≥3 дней или операция за 4 недели (1,5)'), 3), t('onceki', u('Avval OAT/CHVT (1,5)', '', 'ТЭЛА/ТГВ в анамнезе (1,5)'), 3), t('hemoptizi', u('Qon tupurish (1)', '', 'Кровохарканье (1)'), 2), t('kanser', u('Xavfli oʻsma (1)', '', 'Злокачественная опухоль (1)'), 2)],
    donustur: { f: (x) => x / 2, ondalik: 1, enCok: 12.5 },
    bantlar: [b(0, 'olasi_degil', u('≤4 — OAT ehtimoli past', '', '≤4 — ТЭЛА маловероятна')), b(4.5, 'olasi', u('>4 — OAT ehtimolli', '', '>4 — ТЭЛА вероятна'))],
    ornekler: [{ girdi: { dvt: true, nabiz: true }, toplam: 4.5, bant: 'olasi' }, { girdi: { alternatif: true, hemoptizi: true }, toplam: 4, bant: 'olasi_degil' }],
  },
  {
    sekil: 'formul', k: 'ottawa-ankle', roller: ['acil-tip', 'ortopedi', 'spor-hekimligi'],
    ad: u('Ottava toʻpiq va oyoq panjasi qoidalari', '', 'Оттавские правила (голеностоп и стопа)'), aciklama: u('Oʻtkir jarohatdan keyin rentgen kerakmi (kattalar).', '', 'Нужна ли рентгенография после острой травмы (взрослые).'),
    not: NOT, kaynak: 'Stiell IG, et al. Decision rules for the use of radiography in acute ankle injuries: refinement and prospective validation. JAMA 1993;269:1127-32.',
    alanlar: ['malleol_agri', 'lateral', 'medial', 'orta_ayak_agri', 'metatars5', 'navikular', 'yuk'].map((k) => ({ anahtar: k, tur: 'isaret' as const })),
    etiketler: { malleol_agri: u('Toʻpiq sohasida ogʻriq', '', 'Боль в области лодыжек'), lateral: u('Tashqi toʻpiq orqa qirrasi yoki uchida suyak ogʻrigʻi', '', 'Костная болезненность латеральной лодыжки'), medial: u('Ichki toʻpiq orqa qirrasi yoki uchida suyak ogʻrigʻi', '', 'Костная болезненность медиальной лодыжки'), orta_ayak_agri: u('Oyoq panjasi oʻrta qismida ogʻriq', '', 'Боль в среднем отделе стопы'), metatars5: u('V kaft suyagi asosida ogʻriq', '', 'Болезненность основания V плюсневой кости'), navikular: u('Qayiqsimon suyakda ogʻriq', '', 'Болезненность ладьевидной кости'), yuk: u('Darhol va qabulda 4 qadam bosa olmaydi', '', 'Не может сделать 4 шага сразу и при осмотре') },
    sayiAdlari: { bulgu: u('Musbat belgilar', '', 'Положительных признаков') },
    bantlar: [{ k: 'gerekmez', e: u('Rentgen koʻrsatilmagan', '', 'Рентген не показан') }, { k: 'ayak_bilegi', e: u('Toʻpiq rentgeni koʻrsatilgan', '', 'Показан рентген голеностопа') }, { k: 'ayak', e: u('Oyoq panjasi rentgeni koʻrsatilgan', '', 'Показан рентген стопы') }, { k: 'ikisi', e: u('Ikkalasi ham koʻrsatilgan', '', 'Показаны оба') }],
    hesap: (g) => {
      const ab = g.malleol_agri === true && (g.lateral === true || g.medial === true || g.yuk === true)
      const ay = g.orta_ayak_agri === true && (g.metatars5 === true || g.navikular === true || g.yuk === true)
      const n = ['lateral', 'medial', 'metatars5', 'navikular', 'yuk'].filter((k) => g[k] === true).length
      return { sayilar: [{ anahtar: 'bulgu', deger: n, ondalik: 0 }], bant: ab && ay ? 'ikisi' : ab ? 'ayak_bilegi' : ay ? 'ayak' : 'gerekmez' }
    },
    ornekler: [{ girdi: { malleol_agri: true, lateral: true }, bant: 'ayak_bilegi' }, { girdi: { malleol_agri: true }, bant: 'gerekmez' }],
  },
  {
    sekil: 'toplam', k: 'rcri', roller: ['anestezi', 'dahiliye', 'genel-cerrahi'],
    ad: u('Lee kardial xavf indeksi (RCRI)', '', 'Индекс кардиального риска Ли (RCRI)'), aciklama: u('Yurakdan tashqari operatsiyadan oldin kardial xavf.', '', 'Кардиальный риск перед некардиальной операцией.'),
    not: NOT, kaynak: 'Lee TH, et al. Derivation and prospective validation of a simple index for prediction of cardiac risk of major noncardiac surgery. Circulation 1999;100:1043-9.',
    alanlar: [t('cerrahi', u('Yuqori xavfli operatsiya', '', 'Операция высокого риска')), t('ikh', u('Yurak ishemik kasalligi', '', 'ИБС')), t('kky', u('Yurak yetishmovchiligi', '', 'Сердечная недостаточность')), t('svh', u('Bosh miya qon tomir kasalligi', '', 'Цереброваскулярная болезнь')), t('insulin', u('Insulin bilan davolanadigan diabet', '', 'Диабет на инсулине')), t('kreatinin', u('Kreatinin >177 µmol/L', '', 'Креатинин >177 мкмоль/л'))],
    bantlar: [b(0, 'i', u('I sinf', '', 'Класс I')), b(1, 'ii', u('II sinf', '', 'Класс II')), b(2, 'iii', u('III sinf', '', 'Класс III')), b(3, 'iv', u('IV sinf', '', 'Класс IV'))],
    ornekler: [{ girdi: { cerrahi: true, insulin: true, kreatinin: true }, toplam: 3, bant: 'iv' }],
  },
  {
    sekil: 'toplam', k: 'stop-bang', roller: ['anestezi', 'gogus-hastaliklari', 'kulak-burun-bogaz'],
    ad: u('STOP-Bang (obstruktiv uyqu apnoesi)', '', 'STOP-Bang (обструктивное апноэ сна)'), aciklama: u('Sakkizta ha/yoʻq savol.', '', 'Восемь вопросов да/нет.'),
    not: NOT, kaynak: 'Chung F, Abdullah HR, Liao P. Chest 2016;149:631-8 (0–2 low, 3–4 intermediate, 5–8 high).',
    alanlar: [t('horlama', u('Baland xurrak', '', 'Громкий храп')), t('yorgun', u('Kunduzgi charchoq', '', 'Дневная сонливость')), t('gozlem', u('Uyquda nafas toʻxtashi kuzatilgan', '', 'Наблюдаемые остановки дыхания')), t('tansiyon', u('Arterial gipertenziya', '', 'Артериальная гипертензия')), t('bmi', u('TVI >35 kg/m²', '', 'ИМТ >35 кг/м²')), t('yas', u('Yoshi >50', '', 'Возраст >50')), t('boyun', u('Boʻyin aylanasi >40 sm', '', 'Окружность шеи >40 см')), t('erkek', u('Erkak jinsi', '', 'Мужской пол'))],
    bantlar: [b(0, 'dusuk', u('0–2 — past xavf', '', '0–2 — низкий риск')), b(3, 'orta', u('3–4 — oʻrtacha', '', '3–4 — средний')), b(5, 'yuksek', u('5–8 — yuqori', '', '5–8 — высокий'))],
    ornekler: [{ girdi: { horlama: true, yorgun: true, gozlem: true, tansiyon: true, erkek: true }, toplam: 5, bant: 'yuksek' }],
  },
  {
    sekil: 'toplam', k: 'apfel-ponv', roller: ['anestezi'],
    ad: u('Apfel shkalasi (operatsiyadan keyingi koʻngil aynishi)', '', 'Шкала Апфеля (ПОТР)'), aciklama: u('Toʻrtta xavf omili.', '', 'Четыре фактора риска.'),
    not: NOT, kaynak: 'Gan TJ, et al. Fourth consensus guidelines for the management of postoperative nausea and vomiting. Anesth Analg 2020;131:411-48.',
    alanlar: [t('kadin', u('Ayol jinsi', '', 'Женский пол')), t('sigara', u('Chekmaydi', '', 'Некурящий')), t('oyku', u('Avval PONV yoki dengiz kasalligi', '', 'ПОТР или укачивание в анамнезе')), t('opioid', u('Operatsiyadan keyin opioidlar', '', 'Послеоперационные опиоиды'))],
    bantlar: [b(0, 'dusuk', u('0–1 — past', '', '0–1 — низкий')), b(2, 'orta', u('2 — oʻrtacha', '', '2 — средний')), b(3, 'yuksek', u('3–4 — yuqori', '', '3–4 — высокий'))],
    ornekler: [{ girdi: { kadin: true, sigara: true, opioid: true }, toplam: 3, bant: 'yuksek' }],
  },
  {
    sekil: 'toplam', k: 'aldrete', roller: ['anestezi'],
    ad: u('Modifikatsiyalangan Aldrete shkalasi', '', 'Модифицированная шкала Альдрете'), aciklama: u('Uygʻonish palatasidan chiqarish: ≥9 ball.', '', 'Перевод из палаты пробуждения: ≥9 баллов.'),
    not: NOT, kaynak: 'Aldrete JA. J Clin Anesth 1995;7:89-91 (score ≥9 for discharge from recovery).',
    alanlar: [
      c('aktivite', u('Faollik', '', 'Активность'), [['2', u('2 — toʻrt oyoq-qoʻl', '', '2 — четыре конечности'), 2], ['1', u('1 — ikki oyoq-qoʻl', '', '1 — две конечности'), 1], ['0', u('0 — harakatsiz', '', '0 — нет движений'), 0]]),
      c('solunum', u('Nafas', '', 'Дыхание'), [['2', u('2 — chuqur nafas, yoʻtaladi', '', '2 — глубокое дыхание, кашель'), 2], ['1', u('1 — hansirash', '', '1 — одышка'), 1], ['0', u('0 — apnoe', '', '0 — апноэ'), 0]]),
      c('dolasim', u('Qon aylanishi (AB farqi)', '', 'Кровообращение (отклонение АД)'), [['2', u('2 — 20% gacha', '', '2 — до 20%'), 2], ['1', u('1 — 20–49%', '', '1 — 20–49%'), 1], ['0', u('0 — ≥50%', '', '0 — ≥50%'), 0]]),
      c('bilinc', u('Hush', '', 'Сознание'), [['2', u('2 — toʻliq uygʻoq', '', '2 — ясное'), 2], ['1', u('1 — chaqirganda uygʻonadi', '', '1 — пробуждается на зов'), 1], ['0', u('0 — javob yoʻq', '', '0 — нет реакции'), 0]]),
      c('spo2', u('SpO2', '', 'SpO2'), [['2', u('2 — havoda >92%', '', '2 — >92% на воздухе'), 2], ['1', u('1 — kislorod bilan >90%', '', '1 — >90% с кислородом'), 1], ['0', u('0 — kislorod bilan <90%', '', '0 — <90% с кислородом'), 0]]),
    ],
    bantlar: [b(0, 'hazir_degil', u('<9 — hali emas', '', '<9 — ещё нет')), b(9, 'hazir', u('9–10 — mezonga yetdi', '', '9–10 — критерий достигнут'))],
    ornekler: [{ girdi: { aktivite: '2', solunum: '2', dolasim: '2', bilinc: '1', spo2: '2' }, toplam: 9, bant: 'hazir' }],
  },
  {
    sekil: 'toplam', k: 'mallampati', roller: ['anestezi'],
    ad: u('Mallampati sinfi', '', 'Класс по Маллампати'), aciklama: u('Ogʻiz-halqum koʻrinishi.', '', 'Обзор ротоглотки.'),
    not: NOT, kaynak: 'Samsoon GL, Young JR. Anaesthesia 1987;42:487-90 (modified classes I–IV).',
    toplamAdi: u('Sinf', '', 'Класс'),
    alanlar: [c('sinif', u('Sinf', '', 'Класс'), [['1', u('I', '', 'I'), 1], ['2', u('II', '', 'II'), 2], ['3', u('III', '', 'III'), 3], ['4', u('IV', '', 'IV'), 4]])],
    bantlar: [b(1, 'i_ii', u('I–II', '', 'I–II')), b(3, 'iii_iv', u('III–IV — qiyin laringoskopiya ehtimoli', '', 'III–IV — вероятна трудная ларингоскопия'))],
    ornekler: [{ girdi: { sinif: '3' }, bant: 'iii_iv' }],
  },
  {
    sekil: 'formul', k: 'wfns-grade', roller: ['beyin-cerrahisi'],
    ad: u('WFNS darajasi (subaraxnoidal qon quyilish)', '', 'Степень WFNS (САК)'), aciklama: u('GCS va oʻchoqli harakat nuqsoni boʻyicha.', '', 'По GCS и очаговому двигательному дефициту.'),
    not: NOT, kaynak: 'Drake CG. World Federation of Neurological Surgeons committee report on a universal SAH grading scale. J Neurosurg 1988;68:985-6.',
    alanlar: [s('gcs', 3, 15, undefined, { tam: true }), { anahtar: 'defisit', tur: 'isaret' }],
    etiketler: { gcs: u('GCS jami', '', 'GCS сумма'), defisit: u('Katta oʻchoqli harakat nuqsoni', '', 'Грубый очаговый двигательный дефицит') },
    sayiAdlari: { derece: u('WFNS darajasi', '', 'Степень WFNS') },
    bantlar: ['i', 'ii', 'iii', 'iv', 'v'].map((k) => ({ k, e: u(`${k.toUpperCase()} daraja`, '', `Степень ${k.toUpperCase()}`) })),
    hesap: (g) => {
      const gcs = g.gcs as number
      if (!Number.isInteger(gcs)) return null
      const d = gcs === 15 ? 1 : gcs >= 13 ? (g.defisit === true ? 3 : 2) : gcs >= 7 ? 4 : 5
      return { sayilar: [{ anahtar: 'derece', deger: d, ondalik: 0, enCok: 5 }], bant: ['i', 'ii', 'iii', 'iv', 'v'][d - 1] }
    },
    ornekler: [{ girdi: { gcs: 14 }, bant: 'ii' }, { girdi: { gcs: 13, defisit: true }, bant: 'iii' }],
  },
  {
    sekil: 'toplam', k: 'spetzler-martin', roller: ['beyin-cerrahisi'],
    ad: u('Spetzler–Martin darajasi (AVM)', '', 'Градация Спецлера–Мартина (АВМ)'), aciklama: u('Oʻlcham, funksional soha, vena drenaji.', '', 'Размер, функциональная зона, венозный дренаж.'),
    not: NOT, kaynak: 'Spetzler RF, Martin NA. A proposed grading system for arteriovenous malformations. J Neurosurg 1986;65:476-83.',
    toplamAdi: u('Daraja', '', 'Степень'),
    alanlar: [c('boyut', u('Oʻlcham', '', 'Размер'), [['kucuk', u('<3 sm', '', '<3 см'), 1], ['orta', u('3–6 sm', '', '3–6 см'), 2], ['buyuk', u('>6 sm', '', '>6 см'), 3]]), t('elokans', u('Funksional ahamiyatli soha', '', 'Функционально значимая зона')), t('derin', u('Chuqur vena drenaji', '', 'Глубокий венозный дренаж'))],
    ornekler: [{ girdi: { boyut: 'orta', elokans: true, derin: true }, toplam: 4 }],
  },
  {
    sekil: 'toplam', k: 'mrs', roller: ['noroloji', 'beyin-cerrahisi', 'fizik-tedavi'],
    ad: u('Modifikatsiyalangan Rankin shkalasi', '', 'Модифицированная шкала Рэнкина'), aciklama: u('Nogironlik darajasi 0–6.', '', 'Степень инвалидизации 0–6.'),
    not: NOT, kaynak: 'van Swieten JC, et al. Interobserver agreement for the assessment of handicap in stroke patients. Stroke 1988;19:604-7.',
    toplamAdi: u('mRS', '', 'mRS'),
    alanlar: [c('derece', u('Daraja', '', 'Степень'), [['0', u('0 — belgilar yoʻq', '', '0 — нет симптомов'), 0], ['1', u('1 — sezilarli nogironlik yoʻq', '', '1 — нет значимой инвалидизации'), 1], ['2', u('2 — yengil', '', '2 — лёгкая'), 2], ['3', u('3 — oʻrtacha, mustaqil yuradi', '', '3 — умеренная, ходит сам'), 3], ['4', u('4 — oʻrtacha ogʻir', '', '4 — умеренно тяжёлая'), 4], ['5', u('5 — ogʻir, yotoq rejimida', '', '5 — тяжёлая, прикован к постели'), 5], ['6', u('6 — vafot', '', '6 — смерть'), 6]])],
    bantlar: [b(0, 'bagimsiz', u('0–2 — mustaqil', '', '0–2 — независим')), b(3, 'bagimli', u('3–5 — qaram', '', '3–5 — зависим')), b(6, 'olum', u('6', '', '6'))],
    ornekler: [{ girdi: { derece: '4' }, bant: 'bagimli' }],
  },
  {
    sekil: 'toplam', k: 'nihss', roller: ['noroloji', 'acil-tip'],
    ad: u('NIH insult shkalasi (NIHSS)', '', 'Шкала инсульта NIH (NIHSS)'), aciklama: u('15 band, har biri tekshiruv boʻyicha baholanadi (ochiq foydalanishdagi shkala).', '', '15 пунктов по осмотру (шкала в открытом доступе).'),
    not: NOT, kaynak: 'Brott T, et al. Measurements of acute cerebral infarction: a clinical examination scale. Stroke 1989;20:864-70.',
    toplamAdi: u('NIHSS', '', 'NIHSS'),
    alanlar: [['1a', 3], ['1b', 2], ['1c', 2], ['2', 2], ['3', 3], ['4', 3], ['5a', 4], ['5b', 4], ['6a', 4], ['6b', 4], ['7', 2], ['8', 2], ['9', 3], ['10', 2], ['11', 2]].map(([k, n]) => i(String(k), 0, Number(n), u(`${k} (0–${n})`, '', `${k} (0–${n})`))),
    ornekler: [{ girdi: { '1a': 0, '1b': 1, '1c': 0, '2': 1, '3': 0, '4': 2, '5a': 3, '5b': 0, '6a': 2, '6b': 0, '7': 0, '8': 1, '9': 1, '10': 1, '11': 0 }, toplam: 12 }],
  },
  {
    sekil: 'toplam', k: 'abcd2', roller: ['noroloji', 'aile-hekimligi'],
    ad: u('ABCD2 (tranzitor ishemik ataka)', '', 'ABCD2 (ТИА)'), aciklama: u('Yosh, bosim, klinika, davomiylik, diabet.', '', 'Возраст, АД, клиника, длительность, диабет.'),
    not: NOT, kaynak: 'Johnston SC, et al. Lancet 2007;369:283-92 (0–3 low, 4–5 moderate, 6–7 high).',
    alanlar: [t('yas', u('Yoshi ≥60', '', 'Возраст ≥60')), t('ta', u('AB ≥140/90', '', 'АД ≥140/90')), c('klinik', u('Klinika', '', 'Клиника'), [['diger', u('Boshqa', '', 'Другое'), 0], ['konusma', u('Nutq buzilishi, kuchsizliksiz', '', 'Нарушение речи без слабости'), 1], ['guc', u('Bir tomonlama kuchsizlik', '', 'Односторонняя слабость'), 2]]), c('sure', u('Davomiylik', '', 'Длительность'), [['alt10', u('<10 min', '', '<10 мин'), 0], ['10_59', u('10–59 min', '', '10–59 мин'), 1], ['60', u('≥60 min', '', '≥60 мин'), 2]]), t('dm', u('Diabet', '', 'Диабет'))],
    bantlar: [b(0, 'dusuk', u('0–3 — past', '', '0–3 — низкий')), b(4, 'orta', u('4–5 — oʻrtacha', '', '4–5 — средний')), b(6, 'yuksek', u('6–7 — yuqori', '', '6–7 — высокий'))],
    ornekler: [{ girdi: { yas: true, ta: true, klinik: 'guc', sure: '60', dm: true }, toplam: 7, bant: 'yuksek' }],
  },
  {
    sekil: 'toplam', k: 'curb-65', roller: ['dahiliye', 'gogus-hastaliklari', 'enfeksiyon-hastaliklari'],
    ad: u('CURB-65 (shifoxonadan tashqari pnevmoniya)', '', 'CURB-65 (внебольничная пневмония)'), aciklama: u('Ongning chalkashligi, mochevina, nafas, bosim, yosh ≥65.', '', 'Спутанность, мочевина, ЧДД, АД, возраст ≥65.'),
    not: NOT, kaynak: 'Lim WS, et al. Thorax 2003;58:377-82 (0–1 low, 2 moderate, 3–5 high).',
    alanlar: [t('konfuzyon', u('Ongning chalkashligi', '', 'Спутанность сознания')), t('ure', u('Mochevina >7 mmol/L', '', 'Мочевина >7 ммоль/л')), t('solunum', u('Nafas ≥30/min', '', 'ЧДД ≥30/мин')), t('tansiyon', u('Sistolik <90 yoki diastolik ≤60', '', 'САД <90 или ДАД ≤60')), t('yas', u('Yoshi ≥65', '', 'Возраст ≥65'))],
    bantlar: [b(0, 'dusuk', u('0–1 — past', '', '0–1 — низкая')), b(2, 'orta', u('2 — oʻrtacha', '', '2 — средняя')), b(3, 'yuksek', u('3–5 — yuqori', '', '3–5 — высокая'))],
    ornekler: [{ girdi: { ure: true, yas: true }, toplam: 2, bant: 'orta' }],
  },
  {
    sekil: 'toplam', k: 'wells-dvt', roller: ['damar-cerrahisi', 'dahiliye'],
    ad: u('Wells shkalasi (chuqur vena trombozi)', '', 'Шкала Уэллса (ТГВ)'), aciklama: u('CHVT ehtimoli; «muqobil tashxis» −2.', '', 'Вероятность ТГВ; «альтернативный диагноз» −2.'),
    not: NOT, kaynak: 'Wells PS, et al. Evaluation of D-dimer in the diagnosis of suspected deep-vein thrombosis. N Engl J Med 2003;349:1227-35.',
    alanlar: [t('kanser', u('Faol saraton', '', 'Активный рак')), t('paralizi', u('Oyoq falaji yoki gips', '', 'Паралич ноги или гипс')), t('yatak', u('≥3 kun yotoq yoki 12 hafta ichida operatsiya', '', 'Постельный режим ≥3 дней или операция за 12 недель')), t('hassasiyet', u('Chuqur vena boʻylab ogʻriq', '', 'Болезненность по ходу глубоких вен')), t('bacak', u('Butun oyoq shishgan', '', 'Отёк всей ноги')), t('baldir', u('Boldir >3 sm katta', '', 'Голень больше на >3 см')), t('odem', u('Bir oyoqda yumshoq shish', '', 'Мягкий отёк одной ноги')), t('kollateral', u('Yuza kollateral venalar', '', 'Поверхностные коллатерали')), t('onceki', u('Avval CHVT', '', 'ТГВ в анамнезе')), t('alternatif', u('Muqobil tashxis ehtimoli teng yoki yuqori', '', 'Альтернативный диагноз не менее вероятен'), -2)],
    bantlar: [b(-2, 'olasi_degil', u('<2 — ehtimoli past', '', '<2 — маловероятен')), b(2, 'olasi', u('≥2 — ehtimolli', '', '≥2 — вероятен'))],
    ornekler: [{ girdi: { kanser: true, baldir: true }, toplam: 2, bant: 'olasi' }],
  },
  {
    sekil: 'formul', k: 'corrected-calcium', roller: ['dahiliye', 'endokrinoloji', 'nefroloji'],
    ad: u('Albuminga moslangan kalsiy', '', 'Кальций, скорректированный по альбумину'), aciklama: u('Ca + 0,02 × (40 − albumin g/L).', '', 'Ca + 0,02 × (40 − альбумин г/л).'),
    not: NOT, kaynak: 'Payne RB, et al. Interpretation of serum calcium in patients with abnormal serum proteins. BMJ 1973;4:643-6.',
    alanlar: [s('ca', 0.5, 5, 'mmol/L'), s('albumin', 5, 70, 'g/L')],
    etiketler: { ca: u('Umumiy kalsiy', '', 'Общий кальций'), albumin: u('Albumin', '', 'Альбумин') },
    sayiAdlari: { duzeltilmis: u('Moslangan kalsiy', '', 'Скорректированный кальций') },
    sonucBirimleri: ['mmol/L'],
    hesap: (g) => ({ sayilar: [{ anahtar: 'duzeltilmis', deger: yuvarla((g.ca as number) + 0.02 * (40 - (g.albumin as number)), 2), ondalik: 2, birim: 'mmol/L' }] }),
    ornekler: [{ girdi: { ca: 2.1, albumin: 30 }, sayilar: { duzeltilmis: 2.3 } }],
  },
  {
    sekil: 'formul', k: 'anion-gap', roller: ['nefroloji', 'endokrinoloji', 'acil-tip'],
    ad: u('Anion oraligʻi', '', 'Анионный интервал'), aciklama: u('Na − (Cl + HCO3); albumin kiritilsa — moslangani ham.', '', 'Na − (Cl + HCO3); при вводе альбумина — и скорректированный.'),
    not: NOT, kaynak: 'Figge J, et al. Anion gap and hypoalbuminemia. Crit Care Med 1998;26:1807-10.',
    alanlar: [s('na', 100, 180, 'mmol/L'), s('cl', 60, 150, 'mmol/L'), s('hco3', 2, 50, 'mmol/L'), s('albumin', 5, 70, 'g/L', { istege: true })],
    etiketler: { na: u('Natriy', '', 'Натрий'), cl: u('Xlor', '', 'Хлор'), hco3: u('Bikarbonat', '', 'Бикарбонат'), albumin: u('Albumin (ixtiyoriy)', '', 'Альбумин (необязательно)') },
    sayiAdlari: { ag: u('Anion oraligʻi', '', 'Анионный интервал'), duzeltilmis: u('Moslangan anion oraligʻi', '', 'Скорректированный АИ') },
    sonucBirimleri: ['mmol/L'],
    hesap: (g) => {
      const ag = (g.na as number) - ((g.cl as number) + (g.hco3 as number))
      const sayilar = [{ anahtar: 'ag', deger: yuvarla(ag, 1), ondalik: 1, birim: 'mmol/L' }]
      if (sayiMi(g.albumin)) sayilar.push({ anahtar: 'duzeltilmis', deger: yuvarla(ag + 0.25 * (40 - (g.albumin as number)), 1), ondalik: 1, birim: 'mmol/L' })
      return { sayilar }
    },
    ornekler: [{ girdi: { na: 135, cl: 98, hco3: 12, albumin: 20 }, sayilar: { ag: 25, duzeltilmis: 30 } }],
  },
  {
    sekil: 'formul', k: 'homa-ir', roller: ['endokrinoloji', 'reproduktoloji'],
    ad: u('HOMA-IR', '', 'HOMA-IR'), aciklama: u('Ochlikdagi glyukoza (mmol/L) × insulin (mkED/ml) ÷ 22,5.', '', 'Глюкоза натощак (ммоль/л) × инсулин (мкЕд/мл) ÷ 22,5.'),
    not: NOT, kaynak: 'Matthews DR, et al. Homeostasis model assessment. Diabetologia 1985;28:412-9.',
    alanlar: [s('glukoz', 1, 40, 'mmol/L'), s('insulin', 0.5, 500, 'mU/L')],
    etiketler: { glukoz: u('Ochlikdagi glyukoza', '', 'Глюкоза натощак'), insulin: u('Ochlikdagi insulin', '', 'Инсулин натощак') },
    sayiAdlari: { homa: u('HOMA-IR', '', 'HOMA-IR') },
    hesap: (g) => ({ sayilar: [{ anahtar: 'homa', deger: yuvarla(((g.glukoz as number) * (g.insulin as number)) / 22.5, 2), ondalik: 2 }] }),
    ornekler: [{ girdi: { glukoz: 5, insulin: 10 }, sayilar: { homa: 2.22 } }],
  },
  {
    sekil: 'formul', k: 'cockcroft-gault', roller: ['enfeksiyon-hastaliklari', 'nefroloji', 'dahiliye'],
    ad: u('Kreatinin klirensi (Cockcroft–Gault)', '', 'Клиренс креатинина (Кокрофт–Голт)'), aciklama: u('Dori dozalash uchun; kreatinin µmol/L.', '', 'Для дозирования препаратов; креатинин в мкмоль/л.'),
    not: NOT, kaynak: 'Cockcroft DW, Gault MH. Prediction of creatinine clearance from serum creatinine. Nephron 1976;16:31-41.',
    alanlar: [s('yas', 18, 110, undefined, { tam: true }), s('kilo', 20, 300, 'kg'), s('kreatinin', 20, 2000, 'µmol/L'), sec('cinsiyet', ['erkek', 'kadin'])],
    etiketler: { yas: u('Yoshi', '', 'Возраст'), kilo: u('Vazni', '', 'Масса тела'), kreatinin: u('Kreatinin', '', 'Креатинин'), cinsiyet: JINS },
    secenekEtiketleri: { cinsiyet: ERKEK_AYOL },
    sayiAdlari: { crcl: u('Kreatinin klirensi', '', 'Клиренс креатинина') },
    sonucBirimleri: ['mL/min'],
    hesap: (g) => ({ sayilar: [{ anahtar: 'crcl', deger: yuvarla(((140 - (g.yas as number)) * (g.kilo as number) * (g.cinsiyet === 'kadin' ? 0.85 : 1)) / (0.815 * (g.kreatinin as number)), 0), ondalik: 0, birim: 'mL/min' }] }),
    ornekler: [{ girdi: { yas: 70, kilo: 70, kreatinin: 100, cinsiyet: 'erkek' }, sayilar: { crcl: 60 } }],
  },
  {
    sekil: 'toplam', k: 'mascc', roller: ['enfeksiyon-hastaliklari', 'onkoloji'],
    ad: u('MASCC indeksi (febril neytropeniya)', '', 'Индекс MASCC (фебрильная нейтропения)'), aciklama: u('≥21 — asoratlar xavfi past.', '', '≥21 — низкий риск осложнений.'),
    not: NOT, kaynak: 'Klastersky J, et al. J Clin Oncol 2000;18:3038-51 (≥21 low risk).',
    alanlar: [c('yuk', u('Belgilar ogʻirligi', '', 'Выраженность симптомов'), [['yok', u('Yoʻq yoki yengil', '', 'Нет или лёгкие'), 5], ['orta', u('Oʻrtacha', '', 'Умеренные'), 3], ['agir', u('Ogʻir', '', 'Тяжёлые'), 0]]), t('hipotansiyon_yok', u('Gipotenziya yoʻq', '', 'Нет гипотензии'), 5), t('kopd_yok', u('OSOK yoʻq', '', 'Нет ХОБЛ'), 4), t('mantar_yok', u('Solid oʻsma yoki zamburugʻ infeksiyasisiz gemoblastoz', '', 'Солидная опухоль или гемобластоз без микоза'), 4), t('dehidrasyon_yok', u('Degidratatsiya yoʻq', '', 'Нет дегидратации'), 3), t('ayaktan', u('Ambulator bemor', '', 'Амбулаторный пациент'), 3), t('yas', u('Yoshi <60', '', 'Возраст <60'), 2)],
    bantlar: [b(0, 'yuksek', u('<21 — past xavf emas', '', '<21 — не низкий риск')), b(21, 'dusuk', u('≥21 — past xavf', '', '≥21 — низкий риск'))],
    ornekler: [{ girdi: { yuk: 'yok', hipotansiyon_yok: true, kopd_yok: true, mantar_yok: true, dehidrasyon_yok: true, ayaktan: true, yas: true }, toplam: 26, bant: 'dusuk' }],
  },
  {
    sekil: 'toplam', k: 'pitt-bacteraemia', roller: ['enfeksiyon-hastaliklari'],
    ad: u('Pitt bakteriyemiya bali', '', 'Шкала бактериемии Питт'), aciklama: u('≥4 — kritik holat.', '', '≥4 — критическое состояние.'),
    not: NOT, kaynak: 'Paterson DL, et al. Ann Intern Med 2004;140:26-32 (Pitt score; ≥4 critically ill).',
    alanlar: [c('ates', u('Harorat (°C)', '', 'Температура (°C)'), [['n', u('36,1–38,9', '', '36,1–38,9'), 0], ['1', u('35,1–36,0 yoki 39,0–39,9', '', '35,1–36,0 или 39,0–39,9'), 1], ['2', u('≤35,0 yoki ≥40,0', '', '≤35,0 или ≥40,0'), 2]]), t('hipotansiyon', u('Gipotenziya yoki vazopressorlar', '', 'Гипотензия или вазопрессоры'), 2), t('mv', u('Sunʼiy nafas', '', 'ИВЛ'), 2), t('arrest', u('Yurak toʻxtashi', '', 'Остановка сердца'), 4), c('bilinc', u('Hush', '', 'Сознание'), [['0', u('Hushida', '', 'Ясное'), 0], ['1', u('Dezoriyentatsiya', '', 'Дезориентация'), 1], ['2', u('Stupor', '', 'Ступор'), 2], ['4', u('Koma', '', 'Кома'), 4]])],
    bantlar: [b(0, 'dusuk', u('0–3', '', '0–3')), b(4, 'kritik', u('≥4 — kritik', '', '≥4 — критическое'))],
    ornekler: [{ girdi: { ates: '1', hipotansiyon: true, bilinc: '1' }, toplam: 4, bant: 'kritik' }],
  },
  {
    sekil: 'toplam', k: 'khorana', roller: ['onkoloji'],
    ad: u('Khorana shkalasi (VTE xavfi)', '', 'Шкала Хораны (риск ВТЭ)'), aciklama: u('Kimyoterapiya boshlanishida venoz tromboemboliya xavfi.', '', 'Риск ВТЭ при начале химиотерапии.'),
    not: NOT, kaynak: 'Khorana AA, et al. Blood 2008;111:4902-7 (0 low, 1–2 intermediate, ≥3 high).',
    alanlar: [c('yer', u('Oʻsma joylashuvi', '', 'Локализация опухоли'), [['diger', u('Boshqa', '', 'Другая'), 0], ['yuksek', u('Oʻpka, limfoma, ginekologik, siydik pufagi, moyak', '', 'Лёгкое, лимфома, гинекологическая, мочевой пузырь, яичко'), 1], ['cok_yuksek', u('Meʼda, oshqozon osti bezi', '', 'Желудок, поджелудочная железа'), 2]]), t('trombosit', u('Trombotsitlar ≥350 ×10⁹/L', '', 'Тромбоциты ≥350 ×10⁹/л')), t('hb', u('Hb <100 g/L yoki ESA', '', 'Hb <100 г/л или ЭСП')), t('lokosit', u('Leykotsitlar >11 ×10⁹/L', '', 'Лейкоциты >11 ×10⁹/л')), t('bmi', u('TVI ≥35', '', 'ИМТ ≥35'))],
    bantlar: [b(0, 'dusuk', u('0 — past', '', '0 — низкий')), b(1, 'orta', u('1–2 — oʻrtacha', '', '1–2 — средний')), b(3, 'yuksek', u('≥3 — yuqori', '', '≥3 — высокий'))],
    ornekler: [{ girdi: { yer: 'cok_yuksek', trombosit: true }, toplam: 3, bant: 'yuksek' }],
  },
  {
    sekil: 'formul', k: 'bsa-mosteller', roller: ['onkoloji'],
    ad: u('Tana yuzasi maydoni (Mosteller)', '', 'Площадь поверхности тела (Мостеллер)'), aciklama: u('√(boʻy sm × vazn kg / 3600).', '', '√(рост см × масса кг / 3600).'),
    not: NOT, kaynak: 'Mosteller RD. Simplified calculation of body-surface area. N Engl J Med 1987;317:1098.',
    alanlar: [s('boy', 50, 250, 'cm'), s('kilo', 2, 300, 'kg')],
    etiketler: { boy: u('Boʻyi', '', 'Рост'), kilo: u('Vazni', '', 'Масса тела') },
    sayiAdlari: { bsa: u('Tana yuzasi', '', 'ППТ') },
    sonucBirimleri: ['m²'],
    hesap: (g) => ({ sayilar: [{ anahtar: 'bsa', deger: yuvarla(Math.sqrt(((g.boy as number) * (g.kilo as number)) / 3600), 2), ondalik: 2, birim: 'm²' }] }),
    ornekler: [{ girdi: { boy: 170, kilo: 70 }, sayilar: { bsa: 1.82 } }],
  },
  {
    sekil: 'formul', k: 'calvert-carboplatin', roller: ['onkoloji'],
    ad: u('Karboplatin dozasi (Calvert)', '', 'Доза карбоплатина (Калверт)'), aciklama: u('Doza (mg) = maqsadli AUC × (KFT + 25).', '', 'Доза (мг) = целевая AUC × (СКФ + 25).'),
    not: u('Natijani protokol va onkolog buyrugʻi bilan tekshiring; bu ekrandan hech narsa buyurilmaydi.', '', 'Сверьте с протоколом и назначением онколога; с этого экрана ничего не назначается.'),
    kaynak: 'Calvert AH, et al. Carboplatin dosage: prospective evaluation of a simple formula based on renal function. J Clin Oncol 1989;7:1748-56.',
    alanlar: [s('auc', 1, 10, 'mg/mL·min'), s('gfr', 5, 250, 'mL/min')],
    etiketler: { auc: u('Maqsadli AUC', '', 'Целевая AUC'), gfr: u('KFT bahosi', '', 'Оценка СКФ') },
    sayiAdlari: { doz: u('Karboplatin dozasi', '', 'Доза карбоплатина') },
    sonucBirimleri: ['mg'],
    dozYazar: true,
    hesap: (g) => ({ sayilar: [{ anahtar: 'doz', deger: Math.round((g.auc as number) * ((g.gfr as number) + 25)), ondalik: 0, birim: 'mg', doz: true }] }),
    ornekler: [{ girdi: { auc: 5, gfr: 100 }, sayilar: { doz: 625 } }],
  },
  {
    sekil: 'toplam', k: 'cha2ds2-va', roller: ['kardiyoloji', 'aile-hekimligi'],
    ad: u('CHA2DS2-VA (boʻlmachalar fibrillyatsiyasida insult xavfi)', '', 'CHA2DS2-VA (риск инсульта при ФП)'), aciklama: u('Jinsga bogʻliq boʻlmagan shkala.', '', 'Шкала без учёта пола.'),
    not: NOT, kaynak: 'Van Gelder IC, et al. 2024 ESC Guidelines for the management of atrial fibrillation. Eur Heart J 2024;45:3314-414 (CHA2DS2-VA; anticoagulation recommended at ≥2, considered at 1).',
    alanlar: [t('chf', u('Yurak yetishmovchiligi', '', 'Сердечная недостаточность')), t('htn', u('Gipertenziya', '', 'Гипертензия')), c('yas', u('Yoshi', '', 'Возраст'), [['alt65', u('<65', '', '<65'), 0], ['65_74', u('65–74', '', '65–74'), 1], ['75', u('≥75', '', '≥75'), 2]]), t('dm', u('Diabet', '', 'Диабет')), t('inme', u('Insult/TIA/tromboemboliya', '', 'Инсульт/ТИА/тромбоэмболия'), 2), t('damar', u('Qon tomir kasalligi', '', 'Сосудистое заболевание'))],
    bantlar: [b(0, 'dusuk', u('0', '', '0')), b(1, 'orta', u('1 — antikoagulyatsiya koʻrib chiqiladi', '', '1 — рассмотреть антикоагуляцию')), b(2, 'yuksek', u('≥2 — antikoagulyatsiya tavsiya etiladi', '', '≥2 — антикоагуляция рекомендована'))],
    ornekler: [{ girdi: { yas: '65_74', htn: true }, toplam: 2, bant: 'yuksek' }],
  },
  {
    sekil: 'toplam', k: 'has-bled', roller: ['kardiyoloji', 'kalp-damar-cerrahisi'],
    ad: u('HAS-BLED (qon ketish xavfi)', '', 'HAS-BLED (риск кровотечения)'), aciklama: u('Antikoagulyatsiyada qon ketish xavfi.', '', 'Риск кровотечения на антикоагулянтах.'),
    not: NOT, kaynak: 'Pisters R, et al. Chest 2010;138:1093-100 (≥3 high risk).',
    alanlar: [t('htn', u('Nazoratsiz gipertenziya', '', 'Неконтролируемая АГ')), t('bobrek', u('Buyrak funksiyasi buzilgan', '', 'Нарушение функции почек')), t('karaciger', u('Jigar funksiyasi buzilgan', '', 'Нарушение функции печени')), t('inme', u('Insult', '', 'Инсульт')), t('kanama', u('Qon ketish', '', 'Кровотечение')), t('inr', u('Beqaror INR', '', 'Лабильное МНО')), t('yasli', u('Yoshi >65', '', 'Возраст >65')), t('ilac', u('Antiagregantlar/NYQVlar', '', 'Антиагреганты/НПВП')), t('alkol', u('Alkogol', '', 'Алкоголь'))],
    bantlar: [b(0, 'dusuk', u('0–2', '', '0–2')), b(3, 'yuksek', u('≥3 — yuqori xavf', '', '≥3 — высокий риск'))],
    ornekler: [{ girdi: { htn: true, yasli: true, ilac: true }, toplam: 3, bant: 'yuksek' }],
  },
  {
    sekil: 'toplam', k: 'heart-score', roller: ['kardiyoloji', 'acil-tip'],
    ad: u('HEART shkalasi (koʻkrak ogʻrigʻi)', '', 'Шкала HEART (боль в груди)'), aciklama: u('Anamnez, EKG, yosh, xavf omillari, troponin.', '', 'Анамнез, ЭКГ, возраст, факторы риска, тропонин.'),
    not: NOT, kaynak: 'Six AJ, et al. Neth Heart J 2008;16:191-6; Backus BE, et al. Int J Cardiol 2013;168:2153-8.',
    alanlar: [
      c('oyku', u('Anamnez', '', 'Анамнез'), [['az', u('Biroz shubhali', '', 'Мало подозрителен'), 0], ['orta', u('Oʻrtacha', '', 'Умеренно'), 1], ['cok', u('Juda shubhali', '', 'Очень подозрителен'), 2]]),
      c('ekg', u('EKG', '', 'ЭКГ'), [['normal', u('Normal', '', 'Норма'), 0], ['nonspesifik', u('Nomaxsus repolyarizatsiya oʻzgarishi', '', 'Неспецифическая реполяризация'), 1], ['st', u('ST siljishi', '', 'Смещение ST'), 2]]),
      c('yas', u('Yoshi', '', 'Возраст'), [['alt45', u('<45', '', '<45'), 0], ['45_64', u('45–64', '', '45–64'), 1], ['65', u('≥65', '', '≥65'), 2]]),
      c('risk', u('Xavf omillari', '', 'Факторы риска'), [['yok', u('Yoʻq', '', 'Нет'), 0], ['bir_iki', u('1–2', '', '1–2'), 1], ['uc', u('≥3 yoki aterosklerotik kasallik', '', '≥3 или атеросклероз'), 2]]),
      c('troponin', u('Troponin', '', 'Тропонин'), [['normal', u('Meʼyorda', '', 'В норме'), 0], ['bir_uc', u('1–3× meʼyor', '', '1–3× нормы'), 1], ['uc', u('>3× meʼyor', '', '>3× нормы'), 2]]),
    ],
    bantlar: [b(0, 'dusuk', u('0–3 — past', '', '0–3 — низкий')), b(4, 'orta', u('4–6 — oʻrtacha', '', '4–6 — средний')), b(7, 'yuksek', u('7–10 — yuqori', '', '7–10 — высокий'))],
    ornekler: [{ girdi: { oyku: 'orta', ekg: 'nonspesifik', yas: '45_64', risk: 'bir_iki', troponin: 'normal' }, toplam: 4, bant: 'orta' }],
  },
  {
    sekil: 'formul', k: 'qtc', roller: ['kardiyoloji', 'psikiyatri'],
    ad: u('Korreksiyalangan QT (Bazett, Fridericia)', '', 'Корригированный QT (Базетт, Фридеричия)'), aciklama: u('QT va yurak urishi boʻyicha QTc.', '', 'QTc по QT и ЧСС.'),
    not: NOT, kaynak: 'Bazett HC. Heart 1920;7:353-70; Fridericia LS. Acta Med Scand 1920;53:469-86; Rautaharju PM, et al. Circulation 2009;119:e241-50 (≥450 ms men, ≥460 ms women; ≥500 ms markedly prolonged).',
    alanlar: [s('qt', 200, 800, 'ms'), s('hiz', 30, 220, 'bpm'), sec('cinsiyet', ['erkek', 'kadin'])],
    etiketler: { qt: u('QT', '', 'QT'), hiz: u('Yurak urishi', '', 'ЧСС'), cinsiyet: JINS },
    secenekEtiketleri: { cinsiyet: ERKEK_AYOL },
    sayiAdlari: { bazett: u('QTc (Bazett)', '', 'QTc (Базетт)'), fridericia: u('QTc (Fridericia)', '', 'QTc (Фридеричия)') },
    sonucBirimleri: ['ms'],
    bantlar: [{ k: 'normal', e: u('Chegaradan past', '', 'Ниже порога') }, { k: 'uzun', e: u('Uzaygan', '', 'Удлинён') }, { k: 'belirgin', e: u('≥500 ms — keskin uzaygan', '', '≥500 мс — значительно удлинён') }],
    hesap: (g) => {
      const rr = 60 / (g.hiz as number)
      const bz = Math.round((g.qt as number) / Math.sqrt(rr)), fr = Math.round((g.qt as number) / Math.cbrt(rr))
      const esik = g.cinsiyet === 'kadin' ? 460 : 450
      return { sayilar: [{ anahtar: 'bazett', deger: bz, ondalik: 0, birim: 'ms' }, { anahtar: 'fridericia', deger: fr, ondalik: 0, birim: 'ms' }], bant: fr >= 500 || bz >= 500 ? 'belirgin' : fr >= esik ? 'uzun' : 'normal' }
    },
    ornekler: [{ girdi: { qt: 480, hiz: 75, cinsiyet: 'erkek' }, sayilar: { bazett: 537, fridericia: 517 }, bant: 'belirgin' }],
  },
  {
    sekil: 'toplam', k: 'nyha-class', roller: ['kardiyoloji', 'kalp-damar-cerrahisi', 'gogus-cerrahisi'],
    ad: u('NYHA funksional sinfi', '', 'Функциональный класс NYHA'), aciklama: u('Yurak yetishmovchiligi sinfi anamnez boʻyicha.', '', 'Класс сердечной недостаточности по анамнезу.'),
    not: NOT, kaynak: 'Criteria Committee of the New York Heart Association. Nomenclature and Criteria for Diagnosis of Diseases of the Heart and Great Vessels. 9th ed. 1994.',
    toplamAdi: u('Sinf', '', 'Класс'),
    alanlar: [c('sinif', u('Sinf', '', 'Класс'), [['i', u('I — cheklov yoʻq', '', 'I — нет ограничений'), 1], ['ii', u('II — yengil cheklov', '', 'II — лёгкое ограничение'), 2], ['iii', u('III — sezilarli cheklov', '', 'III — выраженное ограничение'), 3], ['iv', u('IV — tinch holatda belgilar', '', 'IV — симптомы в покое'), 4]])],
    ornekler: [{ girdi: { sinif: 'iii' }, toplam: 3 }],
  },
  {
    sekil: 'toplam', k: 'ccs-angina', roller: ['kardiyoloji', 'kalp-damar-cerrahisi'],
    ad: u('Stenokardiya funksional sinfi (Campeau)', '', 'ФК стенокардии (Campeau)'), aciklama: u('Zoʻriqish stenokardiyasi sinfi.', '', 'Класс стенокардии напряжения.'),
    not: NOT, kaynak: 'Campeau L. Grading of angina pectoris. Circulation 1976;54:522-3.',
    toplamAdi: u('Sinf', '', 'Класс'),
    alanlar: [c('derece', u('Sinf', '', 'Класс'), [['i', u('I — faqat kuchli zoʻriqishda', '', 'I — только при сильной нагрузке'), 1], ['ii', u('II — oddiy faollik biroz cheklangan', '', 'II — небольшое ограничение'), 2], ['iii', u('III — sezilarli cheklov', '', 'III — выраженное ограничение'), 3], ['iv', u('IV — har qanday faollikda yoki tinch holatda', '', 'IV — при любой нагрузке или в покое'), 4]])],
    ornekler: [{ girdi: { derece: 'ii' }, toplam: 2 }],
  },
  {
    sekil: 'formul', k: 'ppo-fev1', roller: ['gogus-cerrahisi', 'gogus-hastaliklari'],
    ad: u('Operatsiyadan keyingi FEV1 va DLCO bashorati', '', 'Прогноз послеоперационных FEV1 и DLCO'), aciklama: u('Segmentlar usuli (19 segment).', '', 'Метод сегментов (19 сегментов).'),
    not: NOT, kaynak: 'Brunelli A, et al. Physiologic evaluation of the patient with lung cancer being considered for resectional surgery. Chest 2013;143(5 Suppl):e166S-e190S.',
    alanlar: [s('fev1', 10, 150, '%'), s('dlco', 10, 150, '%'), s('segment', 1, 19, undefined, { tam: true })],
    etiketler: { fev1: u('FEV1, % meʼyor', '', 'FEV1, % должного'), dlco: u('DLCO, % meʼyor', '', 'DLCO, % должного'), segment: u('Rezeksiya qilinadigan segmentlar', '', 'Резецируемых сегментов') },
    sayiAdlari: { ppo_fev1: u('ppoFEV1', '', 'ppoFEV1'), ppo_dlco: u('ppoDLCO', '', 'ppoDLCO') },
    sonucBirimleri: ['%'],
    bantlar: [{ k: 'dusuk', e: u('Ikkalasi >60% — past xavf', '', 'Оба >60% — низкий риск') }, { k: 'ara', e: u('30–60% — qoʻshimcha tekshiruv', '', '30–60% — дообследование') }, { k: 'yuksek', e: u('<30% — yuqori xavf', '', '<30% — высокий риск') }],
    hesap: (g) => {
      const f = (g.fev1 as number) * (1 - (g.segment as number) / 19), d = (g.dlco as number) * (1 - (g.segment as number) / 19)
      return { sayilar: [{ anahtar: 'ppo_fev1', deger: yuvarla(f, 0), ondalik: 0, birim: '%' }, { anahtar: 'ppo_dlco', deger: yuvarla(d, 0), ondalik: 0, birim: '%' }], bant: f > 60 && d > 60 ? 'dusuk' : f < 30 || d < 30 ? 'yuksek' : 'ara' }
    },
    ornekler: [{ girdi: { fev1: 80, dlco: 75, segment: 5 }, sayilar: { ppo_fev1: 59, ppo_dlco: 55 }, bant: 'ara' }],
  },
  {
    sekil: 'toplam', k: 'thrcri', roller: ['gogus-cerrahisi'],
    ad: u('Torakal kardial xavf indeksi (ThRCRI)', '', 'Торакальный индекс кардиального риска (ThRCRI)'), aciklama: u('Oʻpka rezeksiyasidan oldin.', '', 'Перед резекцией лёгкого.'),
    not: NOT, kaynak: 'Brunelli A, et al. Recalibration of the revised cardiac risk index in lung resection candidates. Ann Thorac Surg 2010;90:199-203.',
    toplamAdi: u('ThRCRI ballari', '', 'Баллы ThRCRI'),
    alanlar: [t('ihd', u('YuIK (1,5)', '', 'ИБС (1,5)'), 3), t('cvd', u('Insult yoki TIA (1,5)', '', 'Инсульт или ТИА (1,5)'), 3), t('kreatinin', u('Kreatinin >177 µmol/L (1)', '', 'Креатинин >177 мкмоль/л (1)'), 2), t('pnomonektomi', u('Pulmonektomiya (1,5)', '', 'Пульмонэктомия (1,5)'), 3)],
    donustur: { f: (x) => x / 2, ondalik: 1, enCok: 5.5 },
    bantlar: [b(0, 'a', u('A (0)', '', 'A (0)')), b(1, 'b', u('B (1–1,5)', '', 'B (1–1,5)')), b(2, 'c', u('C (2–2,5)', '', 'C (2–2,5)')), b(3, 'd', u('D (>2,5)', '', 'D (>2,5)'))],
    ornekler: [{ girdi: { ihd: true, kreatinin: true }, toplam: 2.5, bant: 'c' }],
  },
]
