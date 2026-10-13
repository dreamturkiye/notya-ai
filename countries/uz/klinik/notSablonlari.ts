/**
 * NOTYA-UZ-BRANSLAR-01 — Uzbekistan: the NOTE TEMPLATE of each role. Which fields a note of that role has beside the
 * four shared sections, what each field is called in the three forms, and which local reference content the
 * template would need and does NOT have.
 *
 * NOTYA-ULKE-UYGULA-UZ (2026-10-10) — THE ROLE LIST IS UZBEKISTAN'S OWN NOW (./rolListesi.ts), and the templates
 * follow it WITHOUT A NEW TEMPLATE BEING WRITTEN:
 *   - a role only Uzbekistan has writes with the template of the role it BEHAVES LIKE (`gibi`; the rule is the
 *     kit's, lib/ulke/arayuz/rolIcerigi.ts): vascular surgery with cardiac surgery's, allergology with therapy's,
 *     reproductology with obstetrics and gynaecology's, paediatric neurology with neurology's, narcology with
 *     psychiatry's, dietology with the dietitian's, surdology with the audiologist's. The template's KEY on a note is
 *     the role's own. `diyetisyen` and `odyoloji` are no roles any more; their templates stay below as that content.
 *   - the templates of the three roles that were taken out (hair transplantation, preventive and anti-ageing
 *     medicine, occupational therapy) are gone, with the ten fields only they listed.
 * No field was written, reworded or moved between roles by that job.
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * MACHINE-BUILT. NO LOCAL REVIEWER YET. Every template here was put together by a machine from general knowledge
 * of what a note of that specialty records. No clinician practising in Uzbekistan has confirmed a single one, and
 * every label — Uzbek Latin, Uzbek Cyrillic (written by hand, not converted) and Russian — awaits a native-speaking
 * clinician (docs/COUNTRY-PACK-CHECKLIST.md C12, C14, E4, E11). Status per role: docs/COUNTRY-PACK-UZBEKISTAN.md.
 * Switched on by the owner's instruction of 2026-10-08 ("build the Uzbek one completely"), not by a sign-off.
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * WHAT A FIELD IS. A labelled place for something that WAS SAID at the visit — nothing more. A field holds no
 * reference value, no normal range, no schedule, no score and no dose; several say so in their own label
 * ("the numbers that were named", "as the doctor said"). The model is told to leave a field empty when the visit
 * did not contain it (./talimatlar.ts).
 *
 * NO CLINICAL REFERENCE CONTENT. No vaccination calendar, no growth standard, no drug list, no dosing, no national
 * protocol, no scale and no classification is in this file or anywhere in the pack. Where a template would need
 * one, there is a SLOT instead (UZ_YEREL_ICERIK): empty (`icerik: null`) and switched off (`acik: false`), with a
 * plain description of what is missing. Each slot is a row of the "needs local content" table in
 * docs/COUNTRY-PACK-UZBEKISTAN.md; a local clinician supplies the content, and only then is a slot switched on.
 * No screen and no instruction reads a slot today.
 *
 * NOT TAKEN FROM TÜRKİYE. The Turkish product's notes were looked at only for their SHAPE (that an eye note has
 * acuity, pressure, anterior segment and fundus). No Turkish text was copied or translated, and nothing that exists
 * only in Türkiye — its state systems, reimbursement rules, guidelines, associations, reference books, vaccination
 * calendar or drug brands — has a field or a slot here.
 *
 * LEAK RULE (.cursor/skills/brans-alan-sizmasi/SKILL.md). A field belongs to the roles that LIST it and to no
 * other. There is one decision point, `uzSablonAlanlari`, and three layers read it: the instruction to the model
 * (./talimatlar.ts), the server's filter on what the model answered and on what a request sends
 * (lib/ulke/uygulama/notlar.ts through the pack's `notAlanlari`), and the screen (../uygulama/Not.tsx). The general
 * template has no role field at all, and an unknown template has none: a default never carries a role's content.
 *   The shared part is the four sections (s, o, a, p) and nothing else.
 *   GUARDIAN WORDING FOLLOWS THE PATIENT'S AGE, in every role: the one field about who gave the history exists for
 *   a patient under 18 on the day of the visit — a cardiologist's ten-year-old gets it — and never for an adult,
 *   paediatrics included. An unknown age is not "a child", except in the two roles whose patients are children.
 *
 * FIELD KEYS are plain ASCII identifiers: the contract with the model and with the stored note
 * (`not_dil_kaydi.alanlar`, migration 134). A key is never shown; the screen shows the label from here.
 */
import * as S from '@/lib/ulke/arayuz/notSablonu'
import type { NotSablonVerisi } from '@/lib/ulke/arayuz/tipler'
import { UZ_VELI_YASI } from '../ayarlar'
import { uzAdDili, UZ_ROL_TANIMLARI, type UcBicim } from './rolAdlari'

export type UzBolum = 's' | 'o' | 'a' | 'p'
export const UZ_BOLUMLER: readonly UzBolum[] = ['s', 'o', 'a', 'p']

export type UzAlan = {
  /** The shared section the field is shown under. */
  bolum: UzBolum
  ad: UcBicim
}

const alan = (bolum: UzBolum, latin: string, kirill: string, ruscha: string): UzAlan => ({ bolum, ad: { 'uz-Latn': latin, 'uz-Cyrl': kirill, ru: ruscha } })

/** Every role field there is. A field is nobody's until a role lists it below. */
export const UZ_ALANLAR: Readonly<Record<string, UzAlan>> = {
  arrival_mode: alan('s', 'Murojaat usuli', 'Мурожаат усули', 'Способ обращения'),
  event_time: alan('s', 'Voqea yoki shikoyat boshlangan vaqt', 'Воқеа ёки шикоят бошланган вақт', 'Время события или начала жалоб'),
  consciousness: alan('o', 'Hush holati', 'Ҳуш ҳолати', 'Уровень сознания'),
  vital_signs: alan('o', 'Hayotiy koʻrsatkichlar (aytilgan raqamlar)', 'Ҳаётий кўрсаткичлар (айтилган рақамлар)', 'Жизненные показатели (названные цифры)'),
  emergency_actions: alan('p', 'Koʻrsatilgan shoshilinch yordam', 'Кўрсатилган шошилинч ёрдам', 'Оказанная неотложная помощь'),
  disposition: alan('p', 'Bemorning keyingi yoʻnalishi (uy, kuzatuv, yotqizish, yoʻllanma)', 'Беморнинг кейинги йўналиши (уй, кузатув, ётқизиш, йўлланма)', 'Дальнейший маршрут пациента (домой, наблюдение, госпитализация, направление)'),
  chronic_conditions: alan('s', 'Surunkali kasalliklar', 'Сурункали касалликлар', 'Хронические заболевания'),
  regular_medicines: alan('s', 'Doimiy qabul qilinadigan dorilar', 'Доимий қабул қилинадиган дорилар', 'Постоянно принимаемые лекарства'),
  allergies: alan('s', 'Allergiya', 'Аллергия', 'Аллергия'),
  family_history: alan('s', 'Oilaviy anamnez', 'Оилавий анамнез', 'Семейный анамнез'),
  lifestyle: alan('s', 'Turmush tarzi (ovqatlanish, harakat, zararli odatlar)', 'Турмуш тарзи (овқатланиш, ҳаракат, зарарли одатлар)', 'Образ жизни (питание, активность, вредные привычки)'),
  referrals: alan('p', 'Yoʻllanmalar', 'Йўлланмалар', 'Направления'),
  planned_procedure: alan('s', 'Rejalashtirilgan amaliyot', 'Режалаштирилган амалиёт', 'Планируемое вмешательство'),
  prior_anesthesia: alan('s', 'Avvalgi anesteziyalar va ularning kechishi', 'Аввалги анестезиялар ва уларнинг кечиши', 'Предыдущие анестезии и их течение'),
  fasting: alan('s', 'Oxirgi ovqat va suyuqlik qabul qilingan vaqt', 'Охирги овқат ва суюқлик қабул қилинган вақт', 'Время последнего приёма пищи и жидкости'),
  airway: alan('o', 'Nafas yoʻllari bahosi', 'Нафас йўллари баҳоси', 'Оценка дыхательных путей'),
  anesthesia_plan: alan('p', 'Anesteziya rejasi', 'Анестезия режаси', 'План анестезии'),
  neuro_status: alan('o', 'Nevrologik status', 'Неврологик статус', 'Неврологический статус'),
  imaging_findings: alan('o', 'Tasviriy tekshiruv natijalari (aytilgani boʻyicha)', 'Тасвирий текширув натижалари (айтилгани бўйича)', 'Результаты визуализации (со слов врача)'),
  surgical_history: alan('s', 'Oʻtkazilgan operatsiyalar', 'Ўтказилган операциялар', 'Перенесённые операции'),
  surgery_plan: alan('p', 'Operatsiya boʻyicha qaror va reja', 'Операция бўйича қарор ва режа', 'Решение и план по операции'),
  wound_status: alan('o', 'Jarohat yoki operatsiya sohasi holati', 'Жароҳат ёки операция соҳаси ҳолати', 'Состояние раны или области операции'),
  birth_history: alan('s', 'Tugʻilish va chaqaloqlik davri anamnezi', 'Туғилиш ва чақалоқлик даври анамнези', 'Анамнез родов и периода новорождённости'),
  weight_height: alan('o', 'Vazn va boʻy (aytilgan raqamlar)', 'Вазн ва бўй (айтилган рақамлар)', 'Вес и рост (названные цифры)'),
  local_status: alan('o', 'Mahalliy status', 'Маҳаллий статус', 'Местный статус'),
  system_review: alan('s', 'Aʼzolar tizimlari boʻyicha soʻrov', 'Аъзолар тизимлари бўйича сўров', 'Опрос по системам органов'),
  lab_results: alan('o', 'Laboratoriya natijalari (aytilgani boʻyicha)', 'Лаборатория натижалари (айтилгани бўйича)', 'Лабораторные результаты (со слов врача)'),
  lesion_description: alan('o', 'Toshma elementlari tavsifi', 'Тошма элементлари тавсифи', 'Описание элементов сыпи'),
  lesion_location: alan('o', 'Joylashuvi va tarqalishi', 'Жойлашуви ва тарқалиши', 'Локализация и распространённость'),
  onset_course: alan('s', 'Boshlanishi va kechishi', 'Бошланиши ва кечиши', 'Начало и течение'),
  triggers: alan('s', 'Qoʻzgʻatuvchi omillar', 'Қўзғатувчи омиллар', 'Провоцирующие факторы'),
  topical_treatment: alan('p', 'Mahalliy davo', 'Маҳаллий даво', 'Местное лечение'),
  glucose_values: alan('o', 'Qand koʻrsatkichlari (aytilgan raqamlar)', 'Қанд кўрсаткичлари (айтилган рақамлар)', 'Показатели глюкозы (названные цифры)'),
  hormone_results: alan('o', 'Gormonal tekshiruv natijalari (aytilgani boʻyicha)', 'Гормонал текширув натижалари (айтилгани бўйича)', 'Результаты гормональных исследований (со слов врача)'),
  weight_change: alan('s', 'Vazn oʻzgarishi', 'Вазн ўзгариши', 'Изменение массы тела'),
  thyroid_exam: alan('o', 'Qalqonsimon bez koʻrigi', 'Қалқонсимон без кўриги', 'Осмотр щитовидной железы'),
  self_monitoring: alan('s', 'Oʻz-oʻzini nazorat qilish (kundalik)', 'Ўз-ўзини назорат қилиш (кундалик)', 'Самоконтроль (дневник)'),
  fever_course: alan('s', 'Isitma kechishi', 'Иситма кечиши', 'Течение лихорадки'),
  exposure_history: alan('s', 'Epidemiologik anamnez (aloqa, safar, ovqat, suv)', 'Эпидемиологик анамнез (алоқа, сафар, овқат, сув)', 'Эпидемиологический анамнез (контакты, поездки, пища, вода)'),
  vaccination_said: alan('s', 'Emlash haqida aytilganlar', 'Эмлаш ҳақида айтилганлар', 'Сведения о прививках (со слов)'),
  isolation_advice: alan('p', 'Ajratish va atrofdagilar uchun tavsiyalar', 'Ажратиш ва атрофдагилар учун тавсиялар', 'Изоляция и рекомендации для окружающих'),
  bowel_habits: alan('s', 'Ich kelishi va uning oʻzgarishi', 'Ич келиши ва унинг ўзгариши', 'Стул и его изменения'),
  diet_relation: alan('s', 'Ovqat bilan bogʻliqligi', 'Овқат билан боғлиқлиги', 'Связь с приёмом пищи'),
  abdominal_exam: alan('o', 'Qorin koʻrigi', 'Қорин кўриги', 'Осмотр живота'),
  endoscopy_findings: alan('o', 'Endoskopiya natijalari (aytilgani boʻyicha)', 'Эндоскопия натижалари (айтилгани бўйича)', 'Результаты эндоскопии (со слов врача)'),
  diet_advice: alan('p', 'Parhez boʻyicha tavsiyalar', 'Парҳез бўйича тавсиялар', 'Рекомендации по диете'),
  consent_discussion: alan('p', 'Bemor bilan muhokama qilingan xavflar va rozilik', 'Бемор билан муҳокама қилинган хавфлар ва розилик', 'Обсуждённые с пациентом риски и согласие'),
  respiratory_exam: alan('o', 'Nafas aʼzolari koʻrigi', 'Нафас аъзолари кўриги', 'Осмотр органов дыхания'),
  smoking: alan('s', 'Chekish', 'Чекиш', 'Курение'),
  drain_status: alan('o', 'Drenaj holati', 'Дренаж ҳолати', 'Состояние дренажа'),
  cough_sputum: alan('s', 'Yoʻtal va balgʻam', 'Йўтал ва балғам', 'Кашель и мокрота'),
  dyspnea: alan('s', 'Hansirash', 'Ҳансираш', 'Одышка'),
  spirometry: alan('o', 'Spirometriya natijalari (aytilgan raqamlar)', 'Спирометрия натижалари (айтилган рақамлар)', 'Результаты спирометрии (названные цифры)'),
  inhaler_use: alan('p', 'Ingalyatsion davo va uni qoʻllash', 'Ингаляцион даво ва уни қўллаш', 'Ингаляционная терапия и техника применения'),
  visual_acuity: alan('o', 'Koʻrish oʻtkirligi (oʻng va chap koʻz)', 'Кўриш ўткирлиги (ўнг ва чап кўз)', 'Острота зрения (правый и левый глаз)'),
  eye_pressure: alan('o', 'Koʻz ichi bosimi', 'Кўз ичи босими', 'Внутриглазное давление'),
  anterior_segment: alan('o', 'Koʻzning old qismi', 'Кўзнинг олд қисми', 'Передний отрезок глаза'),
  fundus: alan('o', 'Koʻz tubi', 'Кўз туби', 'Глазное дно'),
  glasses: alan('p', 'Koʻzoynak yoki linza boʻyicha tayinlov', 'Кўзойнак ёки линза бўйича тайинлов', 'Назначение очков или линз'),
  eye_drops: alan('p', 'Koʻz tomchilari', 'Кўз томчилари', 'Глазные капли'),
  menstrual_history: alan('s', 'Hayz anamnezi', 'Ҳайз анамнези', 'Менструальный анамнез'),
  obstetric_history: alan('s', 'Homiladorlik va tugʻruqlar anamnezi', 'Ҳомиладорлик ва туғруқлар анамнези', 'Акушерский анамнез (беременности и роды)'),
  current_pregnancy: alan('s', 'Hozirgi homiladorlik (aytilgan muddat)', 'Ҳозирги ҳомиладорлик (айтилган муддат)', 'Текущая беременность (названный срок)'),
  gyn_exam: alan('o', 'Ginekologik koʻrik', 'Гинекологик кўрик', 'Гинекологический осмотр'),
  ultrasound_findings: alan('o', 'Ultratovush tekshiruvi natijalari (aytilgani boʻyicha)', 'Ультратовуш текшируви натижалари (айтилгани бўйича)', 'Результаты ультразвукового исследования (со слов врача)'),
  contraception: alan('s', 'Kontratsepsiya', 'Контрацепция', 'Контрацепция'),
  cardiac_exam: alan('o', 'Yurak va qon tomirlar koʻrigi', 'Юрак ва қон томирлар кўриги', 'Осмотр сердца и сосудов'),
  peripheral_pulses: alan('o', 'Periferik puls va oyoq-qoʻllar holati', 'Периферик пульс ва оёқ-қўллар ҳолати', 'Периферический пульс и состояние конечностей'),
  anticoagulation: alan('p', 'Qon suyultiruvchi davo (aytilgani boʻyicha)', 'Қон суюлтирувчи даво (айтилгани бўйича)', 'Антитромботическая терапия (со слов врача)'),
  chest_pain: alan('s', 'Koʻkrakdagi ogʻriq tavsifi', 'Кўкракдаги оғриқ тавсифи', 'Характер боли в груди'),
  effort_tolerance: alan('s', 'Jismoniy zoʻriqishga chidamlilik', 'Жисмоний зўриқишга чидамлилик', 'Переносимость физической нагрузки'),
  risk_factors: alan('s', 'Xavf omillari (aytilgani boʻyicha)', 'Хавф омиллари (айтилгани бўйича)', 'Факторы риска (со слов)'),
  blood_pressure_pulse: alan('o', 'Qon bosimi va puls (aytilgan raqamlar)', 'Қон босими ва пульс (айтилган рақамлар)', 'Артериальное давление и пульс (названные цифры)'),
  ecg: alan('o', 'Elektrokardiogramma xulosasi (aytilgani boʻyicha)', 'Электрокардиограмма хулосаси (айтилгани бўйича)', 'Заключение электрокардиограммы (со слов врача)'),
  echo: alan('o', 'Exokardiografiya xulosasi (aytilgani boʻyicha)', 'Эхокардиография хулосаси (айтилгани бўйича)', 'Заключение эхокардиографии (со слов врача)'),
  ear_exam: alan('o', 'Quloq koʻrigi', 'Қулоқ кўриги', 'Осмотр ушей'),
  nose_exam: alan('o', 'Burun va burun yondosh boʻshliqlari koʻrigi', 'Бурун ва бурун ёндош бўшлиқлари кўриги', 'Осмотр носа и околоносовых пазух'),
  throat_exam: alan('o', 'Tomoq va hiqildoq koʻrigi', 'Томоқ ва ҳиқилдоқ кўриги', 'Осмотр глотки и гортани'),
  hearing_complaint: alan('s', 'Eshitish va quloqdagi shovqin', 'Эшитиш ва қулоқдаги шовқин', 'Слух и шум в ушах'),
  hearing_test: alan('o', 'Eshitish tekshiruvi natijalari (aytilgani boʻyicha)', 'Эшитиш текшируви натижалари (айтилгани бўйича)', 'Результаты исследования слуха (со слов врача)'),
  procedures_done: alan('p', 'Bajarilgan muolajalar', 'Бажарилган муолажалар', 'Выполненные манипуляции'),
  urine_changes: alan('s', 'Siydik ajralishi va uning oʻzgarishi', 'Сийдик ажралиши ва унинг ўзгариши', 'Мочеиспускание и изменения мочи'),
  edema: alan('o', 'Shishlar', 'Шишлар', 'Отёки'),
  kidney_labs: alan('o', 'Buyrak faoliyati koʻrsatkichlari (aytilgan raqamlar)', 'Буйрак фаолияти кўрсаткичлари (айтилган рақамлар)', 'Показатели функции почек (названные цифры)'),
  dialysis: alan('s', 'Dializ (turi, tartibi)', 'Диализ (тури, тартиби)', 'Диализ (вид, режим)'),
  fluid_diet: alan('p', 'Suyuqlik va parhez boʻyicha tavsiyalar', 'Суюқлик ва парҳез бўйича тавсиялар', 'Рекомендации по жидкости и диете'),
  headache: alan('s', 'Bosh ogʻrigʻi tavsifi', 'Бош оғриғи тавсифи', 'Характер головной боли'),
  seizures: alan('s', 'Xurujlar (tavsifi, tezligi)', 'Хуружлар (тавсифи, тезлиги)', 'Приступы (описание, частота)'),
  gait_coordination: alan('o', 'Yurish va muvozanat', 'Юриш ва мувозанат', 'Походка и координация'),
  tumor_site: alan('a', 'Oʻsma joylashuvi va turi (aytilgani boʻyicha)', 'Ўсма жойлашуви ва тури (айтилгани бўйича)', 'Локализация и вид опухоли (со слов врача)'),
  stage_said: alan('a', 'Bosqich (shifokor aytgan boʻlsa)', 'Босқич (шифокор айтган бўлса)', 'Стадия (если названа врачом)'),
  pathology: alan('o', 'Morfologik xulosa (aytilgani boʻyicha)', 'Морфологик хулоса (айтилгани бўйича)', 'Морфологическое заключение (со слов врача)'),
  prior_treatment: alan('s', 'Oʻtkazilgan davo (operatsiya, kimyoterapiya, nur terapiyasi)', 'Ўтказилган даво (операция, кимётерапия, нур терапияси)', 'Проведённое лечение (операция, химиотерапия, лучевая терапия)'),
  general_condition: alan('o', 'Umumiy holat va kundalik faollik', 'Умумий ҳолат ва кундалик фаоллик', 'Общее состояние и повседневная активность'),
  treatment_tolerance: alan('s', 'Davoni koʻtara olish va nojoʻya taʼsirlar', 'Давони кўтара олиш ва ножўя таъсирлар', 'Переносимость лечения и побочные эффекты'),
  injury_mechanism: alan('s', 'Shikastlanish mexanizmi va vaqti', 'Шикастланиш механизми ва вақти', 'Механизм и время травмы'),
  musculoskeletal_exam: alan('o', 'Tayanch-harakat tizimi koʻrigi', 'Таянч-ҳаракат тизими кўриги', 'Осмотр опорно-двигательного аппарата'),
  range_of_motion: alan('o', 'Harakat hajmi', 'Ҳаракат ҳажми', 'Объём движений'),
  immobilization: alan('p', 'Immobilizatsiya (gips, ortez)', 'Иммобилизация (гипс, ортез)', 'Иммобилизация (гипс, ортез)'),
  weight_bearing: alan('p', 'Yuklama va harakat tartibi', 'Юклама ва ҳаракат тартиби', 'Режим нагрузки и движений'),
  feeding: alan('s', 'Ovqatlanishi', 'Овқатланиши', 'Питание'),
  sleep: alan('s', 'Uyqu', 'Уйқу', 'Сон'),
  development: alan('s', 'Rivojlanishi (aytilgani boʻyicha)', 'Ривожланиши (айтилгани бўйича)', 'Развитие (со слов)'),
  temperature: alan('o', 'Tana harorati', 'Тана ҳарорати', 'Температура тела'),
  head_circumference: alan('o', 'Bosh aylanasi (aytilgan raqam)', 'Бош айланаси (айтилган рақам)', 'Окружность головы (названная цифра)'),
  patient_expectation: alan('s', 'Bemorning kutgan natijasi', 'Беморнинг кутган натижаси', 'Ожидания пациента'),
  defect_description: alan('o', 'Nuqson yoki deformatsiya tavsifi', 'Нуқсон ёки деформация тавсифи', 'Описание дефекта или деформации'),
  photo_note: alan('o', 'Suratga olingani haqida qayd', 'Суратга олингани ҳақида қайд', 'Отметка о фотофиксации'),
  mental_status: alan('o', 'Ruhiy holat', 'Руҳий ҳолат', 'Психический статус'),
  mood: alan('s', 'Kayfiyat', 'Кайфият', 'Настроение'),
  risk_statements: alan('s', 'Oʻziga yoki boshqalarga zarar yetkazish haqida aytilganlar', 'Ўзига ёки бошқаларга зарар етказиш ҳақида айтилганлар', 'Высказывания о причинении вреда себе или другим'),
  substance_use: alan('s', 'Alkogol va boshqa moddalar', 'Алкогол ва бошқа моддалар', 'Алкоголь и другие вещества'),
  psychiatric_history: alan('s', 'Avvalgi ruhiy kasalliklar va davo', 'Аввалги руҳий касалликлар ва даво', 'Психиатрический анамнез и лечение'),
  social_context: alan('s', 'Oila va ish sharoiti', 'Оила ва иш шароити', 'Семья и работа'),
  study_type: alan('s', 'Tekshiruv turi va sohasi', 'Текширув тури ва соҳаси', 'Вид и область исследования'),
  clinical_question: alan('s', 'Yoʻllanma sababi (klinik savol)', 'Йўлланма сабаби (клиник савол)', 'Цель направления (клинический вопрос)'),
  technique: alan('o', 'Bajarilish texnikasi va kontrast', 'Бажарилиш техникаси ва контраст', 'Техника выполнения и контраст'),
  findings: alan('o', 'Tavsif (aniqlangan oʻzgarishlar)', 'Тавсиф (аниқланган ўзгаришлар)', 'Описание (выявленные изменения)'),
  comparison: alan('o', 'Avvalgi tekshiruvlar bilan taqqoslash', 'Аввалги текширувлар билан таққослаш', 'Сравнение с предыдущими исследованиями'),
  conclusion: alan('a', 'Tekshiruv xulosasi', 'Текширув хулосаси', 'Заключение по исследованию'),
  joint_complaints: alan('s', 'Boʻgʻimlardagi ogʻriq va qotishish', 'Бўғимлардаги оғриқ ва қотишиш', 'Боль и скованность в суставах'),
  morning_stiffness: alan('s', 'Ertalabki qotishish davomiyligi', 'Эрталабки қотишиш давомийлиги', 'Длительность утренней скованности'),
  joint_exam: alan('o', 'Boʻgʻimlar koʻrigi (ogʻriqli va shishgan boʻgʻimlar)', 'Бўғимлар кўриги (оғриқли ва шишган бўғимлар)', 'Осмотр суставов (болезненные и припухшие)'),
  extra_articular: alan('s', 'Boʻgʻimdan tashqari belgilar', 'Бўғимдан ташқари белгилар', 'Внесуставные проявления'),
  urinary_symptoms: alan('s', 'Siyish bilan bogʻliq shikoyatlar', 'Сийиш билан боғлиқ шикоятлар', 'Жалобы, связанные с мочеиспусканием'),
  urologic_exam: alan('o', 'Urologik koʻrik', 'Урологик кўрик', 'Урологический осмотр'),
  sexual_function: alan('s', 'Jinsiy faoliyat boʻyicha shikoyatlar', 'Жинсий фаолият бўйича шикоятлар', 'Жалобы, связанные с половой функцией'),
  sport_activity: alan('s', 'Sport turi va mashgʻulot yuklamasi', 'Спорт тури ва машғулот юкламаси', 'Вид спорта и тренировочная нагрузка'),
  functional_tests: alan('o', 'Funksional sinovlar', 'Функционал синовлар', 'Функциональные пробы'),
  return_to_sport: alan('p', 'Mashgʻulotga qaytish rejasi', 'Машғулотга қайтиш режаси', 'План возвращения к тренировкам'),
  functional_status: alan('s', 'Kundalik faoliyatdagi cheklovlar', 'Кундалик фаолиятдаги чекловлар', 'Ограничения в повседневной деятельности'),
  pain_description: alan('s', 'Ogʻriq tavsifi (joyi, kuchi)', 'Оғриқ тавсифи (жойи, кучи)', 'Характер боли (локализация, интенсивность)'),
  muscle_strength: alan('o', 'Mushak kuchi', 'Мушак кучи', 'Мышечная сила'),
  rehab_program: alan('p', 'Reabilitatsiya dasturi (muolajalar, mashqlar, seanslar soni)', 'Реабилитация дастури (муолажалар, машқлар, сеанслар сони)', 'Программа реабилитации (процедуры, упражнения, число сеансов)'),
  rehab_goals: alan('p', 'Reabilitatsiya maqsadlari', 'Реабилитация мақсадлари', 'Цели реабилитации'),
  aftercare: alan('p', 'Muolajadan keyingi parvarish', 'Муолажадан кейинги парвариш', 'Уход после процедуры'),
  aesthetic_assessment: alan('o', 'Estetik baholash (soha, nisbatlar)', 'Эстетик баҳолаш (соҳа, нисбатлар)', 'Эстетическая оценка (зона, пропорции)'),
  skin_assessment: alan('o', 'Teri holati bahosi', 'Тери ҳолати баҳоси', 'Оценка состояния кожи'),
  prior_aesthetic: alan('s', 'Avvalgi estetik muolajalar', 'Аввалги эстетик муолажалар', 'Предыдущие эстетические процедуры'),
  procedure_record: alan('p', 'Bajarilgan muolaja (vosita, soha, miqdor — aytilgani boʻyicha)', 'Бажарилган муолажа (восита, соҳа, миқдор — айтилгани бўйича)', 'Выполненная процедура (средство, зона, количество — со слов врача)'),
  skin_care: alan('p', 'Teri parvarishi boʻyicha tavsiyalar', 'Тери парвариши бўйича тавсиялар', 'Рекомендации по уходу за кожей'),
  body_composition: alan('o', 'Tana tarkibi va oʻlchovlar (aytilgan raqamlar)', 'Тана таркиби ва ўлчовлар (айтилган рақамлар)', 'Состав тела и измерения (названные цифры)'),
  referral_diagnosis: alan('s', 'Yoʻllagan shifokor va yoʻllanma tashxisi', 'Йўллаган шифокор ва йўлланма ташхиси', 'Направивший врач и диагноз направления'),
  session_content: alan('p', 'Seansda bajarilgan ishlar', 'Сеансда бажарилган ишлар', 'Что выполнено на сеансе'),
  home_program: alan('p', 'Uy uchun mashqlar', 'Уй учун машқлар', 'Домашняя программа упражнений'),
  session_themes: alan('s', 'Seansda koʻtarilgan mavzular', 'Сеансда кўтарилган мавзулар', 'Темы, поднятые на сессии'),
  observed_behavior: alan('o', 'Seansdagi kuzatuvlar', 'Сеансдаги кузатувлар', 'Наблюдения на сессии'),
  interventions: alan('p', 'Qoʻllangan usullar', 'Қўлланган усуллар', 'Применённые методы'),
  homework: alan('p', 'Keyingi seansgacha topshiriqlar', 'Кейинги сеансгача топшириқлар', 'Задания до следующей сессии'),
  diet_history: alan('s', 'Ovqatlanish tartibi va odatlari', 'Овқатланиш тартиби ва одатлари', 'Режим и привычки питания'),
  food_intolerances: alan('s', 'Koʻtara olmaydigan mahsulotlar va cheklovlar', 'Кўтара олмайдиган маҳсулотлар ва чекловлар', 'Непереносимые продукты и ограничения'),
  nutrition_plan: alan('p', 'Ovqatlanish rejasi (aytilgani boʻyicha)', 'Овқатланиш режаси (айтилгани бўйича)', 'План питания (со слов специалиста)'),
  nutrition_goals: alan('p', 'Ovqatlanish boʻyicha maqsadlar', 'Овқатланиш бўйича мақсадлар', 'Цели по питанию'),
  noise_exposure: alan('s', 'Shovqin taʼsiri (ish, turmush)', 'Шовқин таъсири (иш, турмуш)', 'Воздействие шума (работа, быт)'),
  audiometry: alan('o', 'Audiometriya natijalari (aytilgan raqamlar)', 'Аудиометрия натижалари (айтилган рақамлар)', 'Результаты аудиометрии (названные цифры)'),
  tympanometry: alan('o', 'Timpanometriya natijalari (aytilgani boʻyicha)', 'Тимпанометрия натижалари (айтилгани бўйича)', 'Результаты тимпанометрии (со слов специалиста)'),
  hearing_aid: alan('p', 'Eshitish apparati (tanlash, sozlash)', 'Эшитиш аппарати (танлаш, созлаш)', 'Слуховой аппарат (подбор, настройка)'),
  balance_complaint: alan('s', 'Bosh aylanishi va muvozanat', 'Бош айланиши ва мувозанат', 'Головокружение и равновесие'),
}

/**
 * The fields of each role's note, in the order they are asked for and shown. Every template is written out: there is
 * no default. A role that is not listed finds its template through the role it behaves like (see the top of the file).
 */
export const UZ_ROL_ALANLARI: Readonly<Record<string, readonly string[]>> = {
  'acil-tip': ['arrival_mode', 'event_time', 'consciousness', 'vital_signs', 'emergency_actions', 'disposition'],
  'aile-hekimligi': ['chronic_conditions', 'regular_medicines', 'family_history', 'lifestyle', 'vital_signs', 'referrals'],
  anestezi: ['planned_procedure', 'prior_anesthesia', 'regular_medicines', 'allergies', 'fasting', 'airway', 'vital_signs', 'anesthesia_plan'],
  'beyin-cerrahisi': ['surgical_history', 'neuro_status', 'imaging_findings', 'wound_status', 'surgery_plan', 'consent_discussion'],
  'cocuk-cerrahisi': ['birth_history', 'surgical_history', 'weight_height', 'local_status', 'abdominal_exam', 'surgery_plan', 'consent_discussion'],
  dahiliye: ['chronic_conditions', 'regular_medicines', 'system_review', 'vital_signs', 'lab_results'],
  dermatoloji: ['onset_course', 'triggers', 'lesion_description', 'lesion_location', 'topical_treatment'],
  endokrinoloji: ['weight_change', 'self_monitoring', 'regular_medicines', 'thyroid_exam', 'glucose_values', 'hormone_results'],
  'enfeksiyon-hastaliklari': ['fever_course', 'exposure_history', 'vaccination_said', 'lab_results', 'isolation_advice'],
  gastroenteroloji: ['bowel_habits', 'diet_relation', 'abdominal_exam', 'endoscopy_findings', 'lab_results', 'diet_advice'],
  'genel-cerrahi': ['surgical_history', 'local_status', 'abdominal_exam', 'wound_status', 'surgery_plan', 'consent_discussion'],
  'gogus-cerrahisi': ['smoking', 'surgical_history', 'respiratory_exam', 'imaging_findings', 'drain_status', 'surgery_plan', 'consent_discussion'],
  'gogus-hastaliklari': ['cough_sputum', 'dyspnea', 'smoking', 'respiratory_exam', 'spirometry', 'imaging_findings', 'inhaler_use'],
  'goz-hastaliklari': ['visual_acuity', 'eye_pressure', 'anterior_segment', 'fundus', 'glasses', 'eye_drops'],
  'kadin-hastaliklari-dogum': ['menstrual_history', 'obstetric_history', 'current_pregnancy', 'contraception', 'gyn_exam', 'ultrasound_findings'],
  'kalp-damar-cerrahisi': ['surgical_history', 'cardiac_exam', 'peripheral_pulses', 'imaging_findings', 'surgery_plan', 'anticoagulation', 'consent_discussion'],
  kardiyoloji: ['chest_pain', 'effort_tolerance', 'risk_factors', 'regular_medicines', 'blood_pressure_pulse', 'cardiac_exam', 'ecg', 'echo'],
  'kulak-burun-bogaz': ['hearing_complaint', 'ear_exam', 'nose_exam', 'throat_exam', 'hearing_test', 'procedures_done'],
  nefroloji: ['urine_changes', 'dialysis', 'edema', 'blood_pressure_pulse', 'kidney_labs', 'fluid_diet'],
  noroloji: ['onset_course', 'headache', 'seizures', 'neuro_status', 'gait_coordination', 'imaging_findings'],
  onkoloji: ['prior_treatment', 'treatment_tolerance', 'general_condition', 'pathology', 'imaging_findings', 'tumor_site', 'stage_said'],
  ortopedi: ['injury_mechanism', 'musculoskeletal_exam', 'range_of_motion', 'imaging_findings', 'immobilization', 'weight_bearing', 'surgery_plan'],
  pediatri: ['birth_history', 'feeding', 'sleep', 'development', 'vaccination_said', 'weight_height', 'head_circumference', 'temperature'],
  'plastik-cerrahi': ['patient_expectation', 'surgical_history', 'local_status', 'defect_description', 'photo_note', 'wound_status', 'surgery_plan', 'consent_discussion'],
  psikiyatri: ['mood', 'sleep', 'substance_use', 'psychiatric_history', 'social_context', 'risk_statements', 'mental_status'],
  radyoloji: ['study_type', 'clinical_question', 'technique', 'findings', 'comparison', 'conclusion'],
  romatoloji: ['joint_complaints', 'morning_stiffness', 'extra_articular', 'regular_medicines', 'joint_exam', 'lab_results'],
  uroloji: ['urinary_symptoms', 'urine_changes', 'sexual_function', 'urologic_exam', 'ultrasound_findings', 'lab_results', 'procedures_done'],
  'spor-hekimligi': ['sport_activity', 'injury_mechanism', 'musculoskeletal_exam', 'functional_tests', 'weight_bearing', 'return_to_sport'],
  'fizik-tedavi': ['functional_status', 'pain_description', 'musculoskeletal_exam', 'range_of_motion', 'muscle_strength', 'rehab_program', 'rehab_goals'],
  'estetik-cerrahi': ['patient_expectation', 'surgical_history', 'aesthetic_assessment', 'photo_note', 'surgery_plan', 'consent_discussion', 'aftercare'],
  'medikal-estetik': ['patient_expectation', 'prior_aesthetic', 'allergies', 'skin_assessment', 'photo_note', 'procedure_record', 'consent_discussion', 'aftercare'],
  'klinik-dermatoloji': ['onset_course', 'lesion_description', 'lesion_location', 'skin_assessment', 'photo_note', 'procedure_record', 'skin_care'],
  fizyoterapi: ['referral_diagnosis', 'functional_status', 'pain_description', 'range_of_motion', 'muscle_strength', 'session_content', 'home_program'],
  'klinik-psikolog': ['session_themes', 'mood', 'social_context', 'risk_statements', 'observed_behavior', 'interventions', 'homework'],
  diyetisyen: ['referral_diagnosis', 'diet_history', 'food_intolerances', 'weight_change', 'weight_height', 'body_composition', 'nutrition_plan', 'nutrition_goals'],
  odyoloji: ['referral_diagnosis', 'hearing_complaint', 'noise_exposure', 'balance_complaint', 'audiometry', 'tympanometry', 'hearing_aid'],
}

/** The neutral template: the four shared sections and no role field. Used by an account that has chosen no role. */
export const UZ_GENEL_SABLON = 'genel'

/**
 * The one field that depends on the patient's AGE and on nothing else: who gave the history. Offered for a patient
 * under 18 in every template (the general one too), never for an adult.
 */
export const UZ_VASIY_ALANI = 'history_giver'
const YAS_ALANLARI: Readonly<Record<string, UzAlan>> = {
  [UZ_VASIY_ALANI]: alan('s', 'Anamnezni kim bergani (ota-onasi yoki qonuniy vakili)', 'Анамнезни ким бергани (ота-онаси ёки қонуний вакили)', 'Кто сообщил анамнез (родители или законный представитель)'),
}

/**
 * Roles whose patients are children: only there does an UNKNOWN age count as "under 18". Paediatric neurology
 * (added 2026-10-10) is one by its name in the order, "Bolalar nevrologiyasi".
 */
const BOLALAR_ROLLARI: readonly string[] = ['pediatri', 'cocuk-cerrahisi', 'cocuk-norolojisi']

/**
 * A heading that belongs to some roles only: an allied professional's note has "the specialist's assessment" where
 * a doctor's has "diagnosis and assessment". Roles not named here use the catalogue's shared heading.
 */
const MUTAXASSIS_BAHOSI: UcBicim = { 'uz-Latn': 'Mutaxassis bahosi', 'uz-Cyrl': 'Мутахассис баҳоси', ru: 'Оценка специалиста' }

/**
 * NOTYA-ULKE-SABLON-01 — Uzbekistan's templates as the DATA the country kit reads. The rules that read it (which
 * fields a note may carry, guardian wording by age, a field's label) are the kit's, lib/ulke/arayuz/notSablonu.ts;
 * the functions below are that same rule applied to this data, kept under their names for the pack's own code
 * (the instructions to the model, ./talimatlar.ts) and its tests.
 */
export const UZ_NOT_SABLONLARI: NotSablonVerisi = {
  genelSablon: UZ_GENEL_SABLON,
  alanlar: UZ_ALANLAR,
  rolAlanlari: UZ_ROL_ALANLARI,
  veliAlani: { anahtar: UZ_VASIY_ALANI, tanim: YAS_ALANLARI[UZ_VASIY_ALANI] },
  cocukRolleri: BOLALAR_ROLLARI,
  bolumBasliklari: [{ taraf: 'klinik-muttefik', bolum: 'a', ad: MUTAXASSIS_BAHOSI }],
}

/** true = a template a note can be written with: the general one, or a role of the pack. */
export const uzSablonMu = (ham: unknown): ham is string => S.sablonMu(UZ_NOT_SABLONLARI, UZ_ROL_TANIMLARI, ham)

/** Templates, the general one first (the default of an account without a role), then every role in the pack's order: each has a template, its own or that of the role it behaves like. */
export const UZ_SABLONLAR: readonly string[] = S.sablonlar(UZ_NOT_SABLONLARI, UZ_ROL_TANIMLARI)

/** The fields of a ROLE's template, in order: its own list, or the list of the role it behaves like. None = []. */
export const uzRolSablonAlanlari = (rol: string): readonly string[] => S.rolSablonAlanlari(UZ_NOT_SABLONLARI, UZ_ROL_TANIMLARI, rol)

/** Under 18 on the day of the visit. An unknown age is not a child — except in a role whose patients are children. */
export function uzResitDegilMi(sablon: string, dogumTarihi: string | null | undefined, muayeneTarihi: string | null | undefined): boolean {
  return S.veliYasindaMi(UZ_NOT_SABLONLARI, UZ_VELI_YASI, sablon, dogumTarihi, muayeneTarihi)
}

/**
 * THE DECISION POINT. The field keys a note of `sablon` may carry for this patient, in order: the age field first
 * (under 18 only), then the role's own. An unknown template has none.
 */
export function uzSablonAlanlari(sablon: string, hasta?: { dogumTarihi?: string | null; muayeneTarihi?: string | null } | null): readonly string[] {
  return S.sablonAlanlari(UZ_NOT_SABLONLARI, UZ_ROL_TANIMLARI, UZ_VELI_YASI, sablon, hasta)
}

const sahip = (o: object, k: string): boolean => Object.prototype.hasOwnProperty.call(o, k)

/** A field's definition, whichever kind it is. null = no such field. */
export const uzAlanTanimi = (anahtar: string): UzAlan | null => (sahip(UZ_ALANLAR, anahtar) ? UZ_ALANLAR[anahtar] : sahip(YAS_ALANLARI, anahtar) ? YAS_ALANLARI[anahtar] : null)

/** A field's label in the account's form. null = no such field: there is nothing to show. */
export const uzAlanAdi = (anahtar: string, dil: unknown): string | null => uzAlanTanimi(anahtar)?.ad[uzAdDili(dil)] ?? null

/** A section heading that is this template's own, or null when the template uses the shared one. */
export function uzBolumAdi(sablon: string, bolum: UzBolum, dil: unknown): string | null {
  return S.bolumAdi(UZ_NOT_SABLONLARI, UZ_ROL_TANIMLARI, sablon, bolum, uzAdDili(dil))
}

// ───────────────────────── local reference content: slots, all empty, all off ─────────────────────────

export type UzYerelYuva = {
  anahtar: string
  /** Always false today: nothing reads a slot until a local clinician has supplied and signed its content. */
  acik: false
  /** Always null today: the pack holds no reference content. */
  icerik: null
  /** What is missing, in plain English. For documents and reviewers; never shown on a screen. */
  eksik: string
  /** Who must supply it. */
  kimden: 'a local clinician'
}

const EKSIK: Readonly<Record<string, string>> = {
  triage_scale: 'Triage scale used in emergency departments in Uzbekistan (categories and criteria)',
  screening_programme: 'National preventive screening and check-up programme by age and sex',
  vaccination_calendar: 'National vaccination calendar',
  preop_risk_scale: 'Anaesthetic risk classification and pre-operative fasting rules as used locally',
  consciousness_scale: 'Consciousness (coma) scale in the Uzbek and Russian wording used locally',
  growth_standard: 'Growth chart standard for children (which standard, which charts)',
  pediatric_dosing: 'Paediatric dosing reference',
  lab_reference_ranges: 'Laboratory units and reference ranges in local use',
  severity_indices: 'Skin disease severity indices in locally validated wording',
  treatment_targets: 'Treatment targets (glucose, lipids, blood pressure) from the national protocol',
  notifiable_diseases: 'List of notifiable diseases and the mandatory report form',
  endoscopy_classifications: 'Endoscopy and liver disease classifications accepted locally',
  surgical_consent_form: 'Surgical consent form and pre-operative checklist required by law',
  spirometry_reference: 'Spirometry reference values and severity grading used locally',
  tb_programme: 'National tuberculosis programme forms and regimens',
  acuity_notation: 'Visual acuity notation and chart in local use',
  antenatal_schedule: 'Antenatal visit schedule and screening programme from the national protocol',
  pregnancy_record_form: 'Mandatory pregnancy record form and its fields',
  operative_risk_score: 'Operative risk score in local use for cardiac and vascular surgery',
  cv_risk_score: 'Cardiovascular risk score calibrated for the region',
  bp_lipid_targets: 'Blood pressure and lipid targets from the national protocol',
  hearing_loss_grading: 'Hearing loss grading in local use',
  ckd_staging: 'Chronic kidney disease staging in local use',
  dialysis_standards: 'Dialysis adequacy standards and record form',
  neuro_scales: 'Neurological scales (stroke, disability) in validated Uzbek and Russian wording',
  staging_system: 'Tumour staging classification and edition in use',
  treatment_regimens: 'Chemotherapy and radiotherapy regimens from national protocols',
  performance_scale: 'Performance status scale in the wording used locally',
  fracture_classification: 'Fracture classification in local use',
  development_milestones: 'Developmental milestone checklist in local use',
  rating_scales: 'Psychiatric rating scales in validated Uzbek and Russian versions',
  involuntary_care_law: 'Legal procedure for involuntary assessment and treatment',
  reporting_systems: 'Structured radiology reporting classifications accepted locally',
  dose_record: 'Radiation dose recording requirements',
  activity_indices: 'Rheumatic disease activity indices in validated local wording',
  symptom_questionnaires: 'Urological symptom questionnaires in validated Uzbek and Russian versions',
  clearance_form: 'Pre-participation medical clearance form required for athletes',
  prohibited_list: 'Anti-doping prohibited list reference',
  functional_scales: 'Functional independence and disability scales in validated local wording',
  disability_assessment: 'Medical-social (disability) assessment forms',
  procedure_consent_form: 'Consent form for an aesthetic procedure as required by law',
  registered_products: 'Injectable products and devices registered in Uzbekistan',
  scope_of_practice: 'What this allied profession may record and decide without a doctor under Uzbek law',
  psychological_tests: 'Psychological tests in validated Uzbek and Russian versions',
  nutrient_reference: 'Nutrient reference intakes and food composition tables for Uzbekistan',
  newborn_hearing_screening: 'Newborn hearing screening programme',
}

const ROL_YUVALARI: Readonly<Record<string, readonly string[]>> = {
  'acil-tip': ['triage_scale'],
  'aile-hekimligi': ['screening_programme', 'vaccination_calendar'],
  anestezi: ['preop_risk_scale'],
  'beyin-cerrahisi': ['consciousness_scale', 'surgical_consent_form'],
  'cocuk-cerrahisi': ['growth_standard', 'pediatric_dosing', 'surgical_consent_form'],
  dahiliye: ['lab_reference_ranges'],
  dermatoloji: ['severity_indices'],
  endokrinoloji: ['treatment_targets', 'lab_reference_ranges'],
  'enfeksiyon-hastaliklari': ['notifiable_diseases', 'vaccination_calendar'],
  gastroenteroloji: ['endoscopy_classifications'],
  'genel-cerrahi': ['surgical_consent_form'],
  'gogus-cerrahisi': ['surgical_consent_form'],
  'gogus-hastaliklari': ['spirometry_reference', 'tb_programme'],
  'goz-hastaliklari': ['acuity_notation'],
  'kadin-hastaliklari-dogum': ['antenatal_schedule', 'pregnancy_record_form'],
  'kalp-damar-cerrahisi': ['operative_risk_score', 'surgical_consent_form'],
  kardiyoloji: ['cv_risk_score', 'bp_lipid_targets'],
  'kulak-burun-bogaz': ['hearing_loss_grading'],
  nefroloji: ['ckd_staging', 'dialysis_standards'],
  noroloji: ['neuro_scales'],
  onkoloji: ['staging_system', 'treatment_regimens', 'performance_scale'],
  ortopedi: ['fracture_classification'],
  pediatri: ['vaccination_calendar', 'growth_standard', 'development_milestones', 'pediatric_dosing'],
  'plastik-cerrahi': ['surgical_consent_form'],
  psikiyatri: ['rating_scales', 'involuntary_care_law'],
  radyoloji: ['reporting_systems', 'dose_record'],
  romatoloji: ['activity_indices'],
  uroloji: ['symptom_questionnaires'],
  'spor-hekimligi': ['clearance_form', 'prohibited_list'],
  'fizik-tedavi': ['functional_scales', 'disability_assessment'],
  'estetik-cerrahi': ['procedure_consent_form'],
  'medikal-estetik': ['registered_products', 'procedure_consent_form'],
  'klinik-dermatoloji': ['registered_products', 'severity_indices'],
  fizyoterapi: ['functional_scales', 'scope_of_practice'],
  'klinik-psikolog': ['psychological_tests', 'scope_of_practice'],
  // dietology and surdology are doctors' specialties since 2026-10-10: the question of an allied profession's scope no longer applies
  diyetoloji: ['nutrient_reference', 'growth_standard'],
  surdoloji: ['hearing_loss_grading', 'newborn_hearing_screening'],
}

const yuva = (anahtar: string, eksik: string): UzYerelYuva => ({ anahtar, acik: false, icerik: null, eksik, kimden: 'a local clinician' })

/**
 * Per role: the reference content its template would need. Empty and off, every one. A role that writes with the
 * template of the role it behaves like (./rolListesi.ts → `gibi`) needs what that template needs, unless it is listed
 * above itself.
 */
export const UZ_YEREL_ICERIK: Readonly<Record<string, readonly UzYerelYuva[]>> = Object.fromEntries(
  UZ_ROL_TANIMLARI.map((rol) => [rol.anahtar, (ROL_YUVALARI[rol.anahtar] ?? ROL_YUVALARI[rol.gibi ?? ''] ?? []).map((a) => yuva(a, EKSIK[a]))]),
)

/** Needed by every role alike, so listed once. Empty and off as well. */
export const UZ_ORTAK_YEREL_ICERIK: readonly UzYerelYuva[] = [
  yuva('diagnosis_coding', 'Diagnosis coding edition and the language it is used in; procedure coding'),
  yuva('medicines_register', 'Register of medicines authorised in Uzbekistan, with local names, forms and strengths'),
  yuva('record_forms', 'Mandatory medical record forms and their fields, and the script they must be kept in'),
  yuva('prescription_format', 'Prescription format, language and rules for controlled medicines'),
]
