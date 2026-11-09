/**
 * KD-TARAMA-01 (Kaan, 2026-11-09) — Uzbekistan: ROLE TOOLS, tenth part. Four obstetric and gynaecological records
 * (lib/ulke/araclar/tanimlar/kdTaramalar.ts): thyroid in pregnancy, the HPV vaccine record, SMA carrier screening and the
 * PMS / PMDD diary summary. Obstetrics and gynaecology only.
 *
 * MACHINE-WRITTEN. AWAITS NATIVE REVIEW (see ./index.ts), and a clinician's. Cyrillic derived from the Latin text by rule
 * (scripts/uz-kiril.mjs).
 *
 * SOURCES, read 2026-11-09:
 *   THYROID  No Ministry of Health of Uzbekistan protocol on thyroid testing in pregnancy was found: the numbers are the
 *            American Thyroid Association 2017 guideline's (Thyroid 2017;27:315-389; Recommendation 26 and the Question 2
 *            text, Recommendations 11, 33, 37, 48a, 52, 96–97), LABELLED INTERNATIONAL.
 *   HPV      Sanitary and Epidemiological Committee (gov.uz/en/sanepid, published 2026-09-23): the national routine schedule
 *            lists "At 9 years — HPV" (sex and number of doses not stated on the page). The dose counts are the World Health
 *            Organization's (20 December 2022): one or two doses at 9–14 and 15–20, two doses six months apart over 21, at
 *            least two and where possible three when immunocompromised — LABELLED INTERNATIONAL.
 *   SMA      No Ministry of Health carrier-screening programme for spinal muscular atrophy was found (searched 2026-11-09).
 *   PMDD     DSM-5-TR structure (APA 2022); management options ACOG Clinical Practice Guideline No. 7 (2023), international.
 *            An original diary (the DRSP's commercial licence could not be confirmed). The patient-side daily diary in the
 *            country portal: docs/OPEN-COMMITMENTS.md KD-TARAMA-01e.
 */
import type { PaketAraci } from '@/lib/ulke/araclar/tipler'
import { u, type Uc } from './yardimci'

const KD = ['kadin-hastaliklari-dogum']
type R = Record<string, Uc>
const birlestir = (...q: Uc[]): Uc => ({ 'uz-Latn': q.map((x) => x['uz-Latn']).join(' '), 'uz-Cyrl': q.map((x) => x['uz-Cyrl']).join(' '), ru: q.map((x) => x.ru).join(' ') })
const N = -1

const XALQARO = u('Xalqaro manba; Oʻzbekiston Sogʻliqni saqlash vazirligining bu boʻyicha hujjati topilmadi.', 'Халқаро манба; Ўзбекистон Соғлиқни сақлаш вазирлигининг бу бўйича ҳужжати топилмади.', 'Международный источник; документ Министерства здравоохранения Узбекистана по этому вопросу не найден.')
const QAROR = u('Qaror yordamchisi: tashxis, dori va dozalar shifokorniki.', 'Қарор ёрдамчиси: ташхис, дори ва дозалар шифокорники.', 'Инструмент поддержки решений: диагноз, лекарства и дозы определяет врач.')

const PMDD_ALAN: R = {
  b1: u('B1 kayfiyatning keskin oʻzgarishi, yigʻloqilik', 'B1 кайфиятнинг кескин ўзгариши, йиғлоқилик', 'B1 резкие перепады настроения, плаксивость'),
  b2: u('B2 jahldorlik, gʻazab yoki janjal', 'B2 жаҳлдорлик, ғазаб ёки жанжал', 'B2 раздражительность, гнев или конфликты'),
  b3: u('B3 tushkunlik, umidsizlik yoki oʻzini ayblash', 'B3 тушкунлик, умидсизлик ёки ўзини айблаш', 'B3 подавленность, безнадёжность или самообвинение'),
  b4: u('B4 tarangilik yoki xavotir', 'B4 тарангилик ёки хавотир', 'B4 напряжение или тревога'),
  c1: u('C1 odatiy ishlarga qiziqish kamaygan', 'C1 одатий ишларга қизиқиш камайган', 'C1 снижение интереса к обычным делам'),
  c2: u('C2 diqqatni jamlash qiyin', 'C2 диққатни жамлаш қийин', 'C2 трудно сосредоточиться'),
  c3: u('C3 holsizlik yoki quvvat kamligi', 'C3 ҳолсизлик ёки қувват камлиги', 'C3 утомляемость или упадок сил'),
  c4: u('C4 ishtaha oʻzgarishi yoki biror taomga kuchli ishtiyoq', 'C4 иштаҳа ўзгариши ёки бирор таомга кучли иштиёқ', 'C4 изменение аппетита или тяга к определённой еде'),
  c5: u('C5 haddan tashqari uyquchanlik yoki uyqusizlik', 'C5 ҳаддан ташқари уйқучанлик ёки уйқусизлик', 'C5 сонливость или бессонница'),
  c6: u('C6 hamma narsa ustimga yogʻilyapti degan his', 'C6 ҳамма нарса устимга ёғиляпти деган ҳис', 'C6 ощущение подавленности или потери контроля'),
  c7: u('C7 jismoniy belgilar (koʻkrak sezuvchanligi, shishish, ogʻriq)', 'C7 жисмоний белгилар (кўкрак сезувчанлиги, шишиш, оғриқ)', 'C7 физические симптомы (болезненность груди, вздутие, боли)'),
}
const ONCE = u('— hayzdan oldingi 7 kunda eng yuqori ball', '— ҳайздан олдинги 7 кунда энг юқори балл', '— наибольший балл за 7 дней до менструации')
const SONRA = u('— qon ketish tugaganidan keyingi 7 kunda eng yuqori ball', '— қон кетиш тугаганидан кейинги 7 кунда энг юқори балл', '— наибольший балл за 7 дней после окончания кровотечения')
const DONGU: Record<number, Uc> = { 1: u('1-sikl:', '1-цикл:', 'Цикл 1:'), 2: u('2-sikl:', '2-цикл:', 'Цикл 2:') }
const HAYZ = u('hayzning birinchi kuni', 'ҳайзнинг биринчи куни', 'первый день менструации')
const diaryAlanlari = (): R => {
  const out: R = {}
  for (const c of [1, 2]) {
    out[`d${c}_adet`] = birlestir(DONGU[c], HAYZ)
    for (const [k, v] of Object.entries(PMDD_ALAN)) { out[`d${c}_${k}_once`] = birlestir(DONGU[c], v, ONCE); out[`d${c}_${k}_sonra`] = birlestir(DONGU[c], v, SONRA) }
  }
  return out
}
const DURUM: R = {
  yok: u('Maʼlum qalqonsimon bez kasalligi yoʻq', 'Маълум қалқонсимон без касаллиги йўқ', 'Известного заболевания щитовидной железы нет'),
  hipotiroidi: u('Gipotireoz (levotiroksin qabul qiladi)', 'Гипотиреоз (левотироксин қабул қилади)', 'Гипотиреоз (принимает левотироксин)'),
  hipertiroidi: u('Gipertireoz / Greyvs kasalligi', 'Гипертиреоз / Грейвс касаллиги', 'Гипертиреоз / болезнь Грейвса'),
  antikor_pozitif: u('Eutireoz, TPO yoki Tg antitanalari musbat', 'Эутиреоз, ТПО ёки Тг антитаналари мусбат', 'Эутиреоз, антитела к ТПО или Тг положительны'),
}
const SMA_SONUC: R = {
  tasiyici: u('Tashuvchi (laboratoriya xulosasi)', 'Ташувчи (лаборатория хулосаси)', 'Носитель (заключение лаборатории)'),
  tasiyici_degil: u('Tashuvchi emas (laboratoriya xulosasi)', 'Ташувчи эмас (лаборатория хулосаси)', 'Не носитель (заключение лаборатории)'),
  belirsiz: u('Noaniq / talqin qilib boʻlmaydi', 'Ноаниқ / талқин қилиб бўлмайди', 'Неясно / не интерпретируется'),
}

export const UZ_ROL_ARACLARI_10: readonly PaketAraci[] = [
  {
    anahtar: 'gebelik-tiroid', roller: KD,
    // NO NUMBERS: Uzbekistan switches on no tool with country numbers until a local clinician supplies them (./araclar.test.ts).
    // Only the laboratory's own pregnancy / trimester range flags a value; fallback and follow-up numbers: docs/OPEN-COMMITMENTS.md KD-TARAMA-01.
    metin: {
      ad: u('Homiladorlikda qalqonsimon bez: trimestr boʻyicha TTG va erkin T4', 'Ҳомиладорликда қалқонсимон без: триместр бўйича ТТГ ва эркин T4', 'Щитовидная железа при беременности: ТТГ и свободный Т4 по триместрам'),
      aciklama: u('TTG va erkin T4 toʻgʻri oraliq bilan: avval laboratoriyaning homiladorlik oraligʻi, boʻlmasa manbaning zaxira qoidasi. Birinchi tashrifda TTG eslatmasi, holatga koʻra kuzatuv sanalari va shifokorning levotiroksin boʻyicha oʻz yozuvi (doza taklif qilinmaydi).', 'ТТГ ва эркин T4 тўғри оралиқ билан: аввал лабораториянинг ҳомиладорлик оралиғи, бўлмаса манбанинг захира қоидаси. Биринчи ташрифда ТТГ эслатмаси, ҳолатга кўра кузатув саналари ва шифокорнинг левотироксин бўйича ўз ёзуви (доза таклиф қилинмайди).', 'ТТГ и свободный Т4 по правильному интервалу: сначала интервал лаборатории для беременных, иначе резервное правило источника. Напоминание о ТТГ при первом визите, даты наблюдения по статусу и собственная запись врача о левотироксине (доза не предлагается).'),
      alanlar: {
        tarih: u('Namuna sanasi', 'Намуна санаси', 'Дата анализа'), gebelik_haftasi: u('Shu kundagi toʻliq homiladorlik haftasi', 'Шу кундаги тўлиқ ҳомиладорлик ҳафтаси', 'Полных недель беременности в этот день'),
        tsh: u('TTG (mXB/l)', 'ТТГ (мХБ/л)', 'ТТГ (мМЕ/л)'),
        lab_tsh_alt: u('Laboratoriya homiladorlik TTG oraligʻi: quyi chegara', 'Лаборатория ҳомиладорлик ТТГ оралиғи: қуйи чегара', 'Интервал ТТГ лаборатории для беременных: нижняя граница'),
        lab_tsh_ust: u('Laboratoriya homiladorlik TTG oraligʻi: yuqori chegara', 'Лаборатория ҳомиладорлик ТТГ оралиғи: юқори чегара', 'Интервал ТТГ лаборатории для беременных: верхняя граница'),
        gd_tsh_alt: u('Laboratoriya homiladorliksiz TTG oraligʻi: quyi chegara', 'Лаборатория ҳомиладорликсиз ТТГ оралиғи: қуйи чегара', 'Интервал ТТГ лаборатории вне беременности: нижняя граница'),
        gd_tsh_ust: u('Laboratoriya homiladorliksiz TTG oraligʻi: yuqori chegara', 'Лаборатория ҳомиладорликсиз ТТГ оралиғи: юқори чегара', 'Интервал ТТГ лаборатории вне беременности: верхняя граница'),
        ft4: u('Erkin T4 (laboratoriya birligida)', 'Эркин T4 (лаборатория бирлигида)', 'Свободный Т4 (в единицах лаборатории)'),
        lab_ft4_alt: u('Laboratoriya trimestr erkin T4 oraligʻi: quyi chegara', 'Лаборатория триместр эркин T4 оралиғи: қуйи чегара', 'Интервал свободного Т4 лаборатории для триместра: нижняя граница'),
        lab_ft4_ust: u('Laboratoriya trimestr erkin T4 oraligʻi: yuqori chegara', 'Лаборатория триместр эркин T4 оралиғи: юқори чегара', 'Интервал свободного Т4 лаборатории для триместра: верхняя граница'),
        tiroid_durumu: u('Shu homiladorlikdagi holat', 'Шу ҳомиладорликдаги ҳолат', 'Статус в этой беременности'),
        lt4_notu: u('Levotiroksin dozasini oʻzgartirish: shifokorning oʻz yozuvi (doza taklif qilinmaydi)', 'Левотироксин дозасини ўзгартириш: шифокорнинг ўз ёзуви (доза таклиф қилинмайди)', 'Коррекция дозы левотироксина: собственная запись врача (доза не предлагается)'),
      },
      secenekler: { tiroid_durumu: DURUM },
      sayilar: { tsh_alt: u('Qoʻllangan TTG oraligʻi: quyi chegara', 'Қўлланган ТТГ оралиғи: қуйи чегара', 'Использованный интервал ТТГ: нижняя граница'), tsh_ust: u('Qoʻllangan TTG oraligʻi: yuqori chegara', 'Қўлланган ТТГ оралиғи: юқори чегара', 'Использованный интервал ТТГ: верхняя граница'), hedef_ust: u('Davolash maqsadi: TTG quyidagidan past', 'Даволаш мақсади: ТТГ қуйидагидан паст', 'Цель лечения: ТТГ ниже') },
      bantlar: {
        tsh_aralikta: u('TTG oraliq ichida', 'ТТГ оралиқ ичида', 'ТТГ в пределах интервала'), tsh_yuksek: u('TTG oraliqdan yuqori', 'ТТГ оралиқдан юқори', 'ТТГ выше интервала'), tsh_dusuk: u('TTG oraliqdan past', 'ТТГ оралиқдан паст', 'ТТГ ниже интервала'),
        tsh_aralik_yok: u('Oraliq yoʻq: laboratoriyaning homiladorlik oraligʻini kiriting', 'Оралиқ йўқ: лабораториянинг ҳомиладорлик оралиғини киритинг', 'Интервала нет: введите интервал лаборатории для беременных'),
      },
      uyarilar: {
        tarama_istemi: u('Birinchi tashrif: TTG hali yozilmagan. Xalqaro manba (ATA 2017, 96–97-tavsiyalar): har bir ayoldan qalqonsimon bez kasalligi soʻraladi; xavf omili boʻlsa TTG tekshiriladi.', 'Биринчи ташриф: ТТГ ҳали ёзилмаган. Халқаро манба (АТА 2017, 96–97-тавсиялар): ҳар бир аёлдан қалқонсимон без касаллиги сўралади; хавф омили бўлса ТТГ текширилади.', 'Первый визит: ТТГ ещё не записан. Международный источник (ATA 2017, рекомендации 96–97): каждую женщину спрашивают о болезнях щитовидной железы; при факторе риска определяют ТТГ.'),
        ft4_yuksek: u('Erkin T4 trimestr oraligʻidan yuqori.', 'Эркин T4 триместр оралиғидан юқори.', 'Свободный Т4 выше интервала триместра.'), ft4_dusuk: u('Erkin T4 trimestr oraligʻidan past.', 'Эркин T4 триместр оралиғидан паст.', 'Свободный Т4 ниже интервала триместра.'),
        ft4_aralik_yok: u('Erkin T4 faqat usulga xos laboratoriya oraligʻi bilan baholanadi.', 'Эркин T4 фақат усулга хос лаборатория оралиғи билан баҳоланади.', 'Свободный Т4 оценивается только по методо-специфичному интервалу лаборатории.'),
        hedef_ustu: u('Levotiroksinda: TTG davolash maqsadidan yuqori.', 'Левотироксинда: ТТГ даволаш мақсадидан юқори.', 'На левотироксине: ТТГ выше цели лечения.'),
        kaynak_laboratuvar: u('Oraliq: laboratoriyaning homiladorlik oraligʻi.', 'Оралиқ: лабораториянинг ҳомиладорлик оралиғи.', 'Интервал: интервал лаборатории для беременных.'),
        kaynak_yedek_duzeltilmis: u('Oraliq: birinchi trimestr zaxira qoidasi (homiladorliksiz oraliq pasaytirilgan).', 'Оралиқ: биринчи триместр захира қоидаси (ҳомиладорликсиз оралиқ пасайтирилган).', 'Интервал: резервное правило первого триместра (интервал вне беременности снижен).'),
        kaynak_yedek_gebelik_disi: u('Oraliq: homiladorliksiz oraliq.', 'Оралиқ: ҳомиладорликсиз оралиқ.', 'Интервал: интервал вне беременности.'),
        kaynak_yedek_sabit: u('Oraliq: manbaning qatʼiy yuqori chegarasi (boshqa oraliq boʻlmaganda).', 'Оралиқ: манбанинг қатъий юқори чегараси (бошқа оралиқ бўлмаганда).', 'Интервал: фиксированная верхняя граница источника (если другого нет).'),
        takip_hipotiroidi: u('Davolanayotgan gipotireoz: TTG manba oraligʻida (sanalar quyida) va tugʻruqdan keyingi tekshiruv.', 'Даволанаётган гипотиреоз: ТТГ манба оралиғида (саналар қуйида) ва туғруқдан кейинги текширув.', 'Леченный гипотиреоз: ТТГ с интервалом источника (даты ниже) и послеродовой контроль.'),
        takip_hipertiroidi: u('Gipertireoz: erkin yoki umumiy T4 va TTG manba oraligʻida.', 'Гипертиреоз: эркин ёки умумий T4 ва ТТГ манба оралиғида.', 'Гипертиреоз: свободный или общий Т4 и ТТГ с интервалом источника.'),
        takip_antikor: u('Antitanalar musbat, eutireoz: homiladorlik oʻrtasigacha TTG manba oraligʻida.', 'Антитаналар мусбат, эутиреоз: ҳомиладорлик ўртасигача ТТГ манба оралиғида.', 'Антитела положительны, эутиреоз: ТТГ с интервалом источника до середины беременности.'),
        trab_pencere: u('TTG retseptoriga antitanalar: ablatsiyadan keyin erta homiladorlikda; yuqori boʻlsa yoki tireostatik davom etsa 18–22-haftada; 18–22-haftada yuqori boʻlsa yoki uchinchi trimestrda tireostatik boʻlsa 30–34-haftada.', 'ТТГ рецепторига антитаналар: аблациядан кейин эрта ҳомиладорликда; юқори бўлса ёки тиреостатик давом этса 18–22-ҳафтада; 18–22-ҳафтада юқори бўлса ёки учинчи триместрда тиреостатик бўлса 30–34-ҳафтада.', 'Антитела к рецептору ТТГ: в ранней беременности после аблации; на 18–22 неделе при повышении или продолжении тиреостатиков; на 30–34 неделе при повышении на 18–22 неделе или тиреостатиках в третьем триместре.'),
        lt4_hekim_notu: u('Levotiroksin dozasi shifokorniki: bu yerda miqdor taklif qilinmaydi.', 'Левотироксин дозаси шифокорники: бу ерда миқдор таклиф қилинмайди.', 'Доза левотироксина определяется врачом: количество здесь не предлагается.'),
      },
      tarihler: { tarih: u('Namuna', 'Намуна', 'Анализ'), sonraki_tsh: u('Keyingi TTG', 'Кейинги ТТГ', 'Следующий ТТГ'), tsh_ek: u('30-hafta atrofida TTG', '30-ҳафта атрофида ТТГ', 'ТТГ около 30 недели'), trab_1: u('Antitanalar oynasi (birinchi)', 'Антитаналар ойнаси (биринчи)', 'Окно антител (первое)'), trab_2: u('Antitanalar oynasi (ikkinchi)', 'Антитаналар ойнаси (иккинчи)', 'Окно антител (второе)'), sonraki_tft: u('Keyingi qalqonsimon bez tahlili', 'Кейинги қалқонсимон без таҳлили', 'Следующий анализ щитовидной железы') },
      not: birlestir(XALQARO, u('Oʻzbekiston manbasi boʻlmagani uchun faqat laboratoriyaning homiladorlik oraligʻi qiymatni belgilaydi; zaxira va kuzatuv raqamlari mahalliy shifokorni kutmoqda. Tuzilma: Amerika Tireoid Assotsiatsiyasining 2017-yil qoʻllanmasi.', 'Ўзбекистон манбаси бўлмагани учун фақат лабораториянинг ҳомиладорлик оралиғи қийматни белгилайди; захира ва кузатув рақамлари маҳаллий шифокорни кутмоқда. Тузилма: Америка Тиреоид Ассотсиациясининг 2017-йил қўлланмаси.', 'Источника Узбекистана нет, поэтому значение оценивается только по интервалу лаборатории для беременных; резервные числа и сроки наблюдения ждут местного врача. Структура: Американская тиреоидная ассоциация, 2017 (Thyroid 2017;27:315-389).'), QAROR),
    },
  },
  {
    anahtar: 'hpv-asi-kaydi', roller: KD,
    tablolar: { hpv_takvimi: { satirlar: [
      { immun: 'baskilanmis', yas_alt: 0, yas_ust: N, doz_en_az: 2, doz_en_cok: 3, d2_en_az_ay: N, d2_en_cok_ay: N, d2_en_az_hafta: N, d3_en_az_ay: N, d3_en_cok_ay: N, kisa_aralik_ay: N, kisa_ek_doz: N },
      { immun: 'normal', yas_alt: 9, yas_ust: 14, doz_en_az: 1, doz_en_cok: 2, d2_en_az_ay: N, d2_en_cok_ay: N, d2_en_az_hafta: N, d3_en_az_ay: N, d3_en_cok_ay: N, kisa_aralik_ay: N, kisa_ek_doz: N },
      { immun: 'normal', yas_alt: 15, yas_ust: 20, doz_en_az: 1, doz_en_cok: 2, d2_en_az_ay: N, d2_en_cok_ay: N, d2_en_az_hafta: N, d3_en_az_ay: N, d3_en_cok_ay: N, kisa_aralik_ay: N, kisa_ek_doz: N },
      { immun: 'normal', yas_alt: 21, yas_ust: N, doz_en_az: 2, doz_en_cok: 2, d2_en_az_ay: 6, d2_en_cok_ay: N, d2_en_az_hafta: N, d3_en_az_ay: N, d3_en_cok_ay: N, kisa_aralik_ay: N, kisa_ek_doz: N },
    ] } },
    metin: {
      ad: u('OPV (HPV) emlash yozuvi', 'ОПВ (ҲПВ) эмлаш ёзуви', 'Запись о вакцинации против ВПЧ'),
      aciklama: u('Qilingan dozalar (turi va sanalari) va birinchi doza yoshi hamda immun holatiga koʻra sxema. Oxirgi bachadon boʻyni skriningi yonida saqlanadi.', 'Қилинган дозалар (тури ва саналари) ва биринчи доза ёши ҳамда иммун ҳолатига кўра схема. Охирги бачадон бўйни скрининги ёнида сақланади.', 'Введённые дозы (тип и даты) и схема по возрасту на момент первой дозы и иммунному статусу. Рядом хранится последний скрининг шейки матки.'),
      alanlar: {
        ilk_doz_yasi: u('Birinchi dozadagi yosh (yil)', 'Биринчи дозадаги ёш (йил)', 'Возраст при первой дозе (лет)'), immun: u('Immun holati', 'Иммун ҳолати', 'Иммунный статус'), asi_tipi: u('Vaksina turi', 'Вакцина тури', 'Тип вакцины'),
        doz1_tarihi: u('1-doza: sana', '1-доза: сана', 'Доза 1: дата'), doz2_tarihi: u('2-doza: sana', '2-доза: сана', 'Доза 2: дата'), doz3_tarihi: u('3-doza: sana', '3-доза: сана', 'Доза 3: дата'),
        son_serviks_tarihi: u('Oxirgi bachadon boʻyni skriningi: sana', 'Охирги бачадон бўйни скрининги: сана', 'Последний скрининг шейки матки: дата'), son_serviks_sonucu: u('Oxirgi bachadon boʻyni skriningi: natija', 'Охирги бачадон бўйни скрининги: натижа', 'Последний скрининг шейки матки: результат'),
      },
      secenekler: {
        immun: { normal: u('Immun tanqisligi yoʻq', 'Иммун танқислиги йўқ', 'Без иммунодефицита'), baskilanmis: u('Immun tanqisligi (OIV bilan ham)', 'Иммун танқислиги (ОИВ билан ҳам)', 'Иммунодефицит (включая ВИЧ)') },
        asi_tipi: { '2v': u('Ikki valentli', 'Икки валентли', 'Двухвалентная'), '4v': u('Toʻrt valentli', 'Тўрт валентли', 'Четырёхвалентная'), '9v': u('Toʻqqiz valentli', 'Тўққиз валентли', 'Девятивалентная'), bilinmiyor: u('Nomaʼlum', 'Номаълум', 'Неизвестно') },
      },
      sayilar: { gereken_doz: u('Sxema talab qiladigan dozalar', 'Схема талаб қиладиган дозалар', 'Доз по схеме'), yapilan_doz: u('Yozilgan dozalar', 'Ёзилган дозалар', 'Записано доз') },
      bantlar: { tamamlandi: u('Sxema tugallangan', 'Схема тугалланган', 'Курс завершён'), devam: u('Sxema tugallanmagan', 'Схема тугалланмаган', 'Курс не завершён'), kural_yok: u('Bu yosh va holat uchun sxema qatori yoʻq: kurs shifokor qarori', 'Бу ёш ва ҳолат учун схема қатори йўқ: курс шифокор қарори', 'Для этого возраста и статуса строки схемы нет: курс решает врач') },
      uyarilar: {
        kisa_aralik_ek_doz: u('Ikki doza orasidagi muddat manbadagidan qisqa: qoʻshimcha doza kerak.', 'Икки доза орасидаги муддат манбадагидан қисқа: қўшимча доза керак.', 'Интервал между двумя дозами короче допустимого: нужна дополнительная доза.'),
        aralik_erken: u('Doza manba koʻrsatgan eng qisqa muddatdan oldin qilingan.', 'Доза манба кўрсатган энг қисқа муддатдан олдин қилинган.', 'Доза введена раньше минимального интервала источника.'),
        sira_hatali: u('Doza raqamlari sanalarga mos emas: yozuvni tekshiring.', 'Доза рақамлари саналарга мос эмас: ёзувни текширинг.', 'Номера доз не соответствуют датам: проверьте запись.'),
        aralik_belirtilmemis: u('Manba keyingi doza muddatini koʻrsatmaydi.', 'Манба кейинги доза муддатини кўрсатмайди.', 'Источник не указывает интервал до следующей дозы.'),
      },
      tarihler: { sonraki_en_erken: u('Keyingi doza: eng erta', 'Кейинги доза: энг эрта', 'Следующая доза: не ранее'), sonraki_en_gec: u('Keyingi doza: eng kech', 'Кейинги доза: энг кеч', 'Следующая доза: не позднее'), son_serviks: u('Oxirgi bachadon boʻyni skriningi', 'Охирги бачадон бўйни скрининги', 'Последний скрининг шейки матки') },
      not: birlestir(u('Milliy taqvim (Sanitariya-epidemiologiya qoʻmitasi, 2026-yil 23-sentyabr): 9 yoshda OPV; dozalar soni sahifada koʻrsatilmagan. Dozalar soni: Jahon sogʻliqni saqlash tashkiloti, 2022-yil 20-dekabr — xalqaro manba.', 'Миллий тақвим (Санитария-эпидемиология қўмитаси, 2026-йил 23-сентябр): 9 ёшда ОПВ; дозалар сони саҳифада кўрсатилмаган. Дозалар сони: Жаҳон соғлиқни сақлаш ташкилоти, 2022-йил 20-декабрь — халқаро манба.', 'Национальный календарь (Санитарно-эпидемиологический комитет, 23 сентября 2026 г.): ВПЧ в 9 лет; число доз на странице не указано. Число доз: Всемирная организация здравоохранения, 20 декабря 2022 г. — международный источник.'), QAROR),
    },
  },
  {
    anahtar: 'sma-tasiyicilik', roller: KD,
    metin: {
      ad: u('SMA tashuvchiligi skriningi (homiladorlik yozuvi)', 'СМА ташувчилиги скрининги (ҳомиладорлик ёзуви)', 'Скрининг носительства СМА (пренатальная запись)'),
      aciklama: u('Orqa miya mushak atrofiyasi tashuvchiligi skriningi taklif qilinganmi, rad etilganmi yoki bajarilganmi; laboratoriya xulosasi va SMN1 nusxa soni xulosadagidek; tashuvchi natijada turmush oʻrtogʻini tekshirish eslatmasi; genetik maslahatga yoʻnaltirish.', 'Орқа мия мушак атрофияси ташувчилиги скрининги таклиф қилинганми, рад этилганми ёки бажарилганми; лаборатория хулосаси ва SMN1 нусха сони хулосадагидек; ташувчи натижада турмуш ўртоғини текшириш эслатмаси; генетик маслаҳатга йўналтириш.', 'Предложен ли, отклонён или выполнен скрининг носительства спинальной мышечной атрофии; заключение лаборатории и число копий SMN1 как в заключении; напоминание обследовать партнёра при носительстве; направление на генетическое консультирование.'),
      alanlar: {
        durum: u('Skrining', 'Скрининг', 'Скрининг'), tarih: u('Sana', 'Сана', 'Дата'), sonuc: u('Laboratoriya xulosasi', 'Лаборатория хулосаси', 'Заключение лаборатории'),
        smn1_kopya: u('SMN1 nusxa soni (xulosadagidek)', 'SMN1 нусха сони (хулосадагидек)', 'Число копий SMN1 (как в заключении)'),
        es_durumu: u('Turmush oʻrtogʻining tekshiruvi', 'Турмуш ўртоғининг текшируви', 'Обследование партнёра'), es_sonucu: u('Turmush oʻrtogʻining natijasi', 'Турмуш ўртоғининг натижаси', 'Результат партнёра'),
        es_smn1_kopya: u('Turmush oʻrtogʻining SMN1 nusxa soni', 'Турмуш ўртоғининг SMN1 нусха сони', 'Число копий SMN1 у партнёра'), genetik_danisma: u('Genetik maslahat', 'Генетик маслаҳат', 'Генетическое консультирование'),
      },
      secenekler: {
        durum: { teklif_edilmedi: u('Taklif qilinmagan', 'Таклиф қилинмаган', 'Не предлагался'), teklif_edildi: u('Taklif qilingan', 'Таклиф қилинган', 'Предложен'), reddetti: u('Rad etilgan', 'Рад этилган', 'Отклонён'), yapildi: u('Bajarilgan', 'Бажарилган', 'Выполнен') },
        sonuc: SMA_SONUC, es_sonucu: SMA_SONUC,
        es_durumu: { istenmedi: u('Soʻralmagan', 'Сўралмаган', 'Не назначено'), istendi: u('Soʻralgan', 'Сўралган', 'Назначено'), yapildi: u('Bajarilgan', 'Бажарилган', 'Выполнено') },
        genetik_danisma: { yonlendirildi: u('Yoʻnaltirilgan', 'Йўналтирилган', 'Направлена'), yonlendirilmedi: u('Yoʻnaltirilmagan', 'Йўналтирилмаган', 'Не направлена') },
      },
      bantlar: {
        teklif_edilmedi: u('Taklif qilinmagan', 'Таклиф қилинмаган', 'Не предлагался'), teklif_edildi: u('Taklif qilingan', 'Таклиф қилинган', 'Предложен'), reddetti: u('Rad etilgan', 'Рад этилган', 'Отклонён'),
        yapildi_tasiyici: u('Bajarilgan: tashuvchi', 'Бажарилган: ташувчи', 'Выполнен: носитель'), yapildi_tasiyici_degil: u('Bajarilgan: tashuvchi emas', 'Бажарилган: ташувчи эмас', 'Выполнен: не носитель'), yapildi_belirsiz: u('Bajarilgan: noaniq', 'Бажарилган: ноаниқ', 'Выполнен: неясно'),
      },
      uyarilar: {
        es_testi_istemi: u('Tashuvchi natija: turmush oʻrtogʻini tekshirishni taklif qiling.', 'Ташувчи натижа: турмуш ўртоғини текширишни таклиф қилинг.', 'Носительство: предложите обследование партнёра.'),
        genetik_danisma_istemi: u('Genetik maslahatga yoʻnaltiring (prenatal tashxis imkoniyatlari).', 'Генетик маслаҳатга йўналтиринг (пренатал ташхис имкониятлари).', 'Направьте на генетическое консультирование (варианты пренатальной диагностики).'),
        cift_tasiyici: u('Ikkala turmush oʻrtogʻi ham tashuvchi (xulosalarga koʻra).', 'Иккала турмуш ўртоғи ҳам ташувчи (хулосаларга кўра).', 'Оба партнёра — носители (по заключениям).'),
        kopya_yorumlanmaz: u('Nusxa soni yozilgandek saqlanadi va bu yerda talqin qilinmaydi: tashuvchilikni laboratoriya xulosasi belgilaydi.', 'Нусха сони ёзилгандек сақланади ва бу ерда талқин қилинмайди: ташувчиликни лаборатория хулосаси белгилайди.', 'Число копий хранится как записано и здесь не интерпретируется: носительство определяет заключение лаборатории.'),
      },
      tarihler: { tarih: u('Skrining', 'Скрининг', 'Скрининг') },
      not: birlestir(u('Sogʻliqni saqlash vazirligining SMA tashuvchiligi skriningi dasturi topilmadi (2026-yil 9-noyabr).', 'Соғлиқни сақлаш вазирлигининг СМА ташувчилиги скрининги дастури топилмади (2026-йил 9-ноябрь).', 'Программа Минздрава по скринингу носительства СМА не найдена (9 ноября 2026 г.).'), QAROR),
    },
  },
  {
    anahtar: 'pmdd-gunluk-ozeti', roller: KD,
    metin: {
      ad: u('PMS / PMDD: ikki sikllik kundalik xulosasi va DSM-5-TR roʻyxati', 'ПМС / ПМДД: икки цикллик кундалик хулосаси ва ДСМ-5-ТР рўйхати', 'ПМС / ПМДР: итог дневника за два цикла и перечень DSM-5-TR'),
      aciklama: u('Bemorning ikki sikl davomidagi kundaligidan har bir oʻn bir belgi sohasining hayzdan oldingi 7 kunda va qon ketish tugaganidan keyingi 7 kunda eng yuqori bali (0 yoʻq … 5 kuchli); sikl boʻyicha kundalik naqshi; DSM-5-TR mezonlari shifokor roʻyxati sifatida; davolash variantlari belgilar bilan, dozasiz.', 'Беморнинг икки цикл давомидаги кундалигидан ҳар бир ўн бир белги соҳасининг ҳайздан олдинги 7 кунда ва қон кетиш тугаганидан кейинги 7 кунда энг юқори бали (0 йўқ … 5 кучли); цикл бўйича кундалик нақши; ДСМ-5-ТР мезонлари шифокор рўйхати сифатида; даволаш вариантлари белгилар билан, дозасиз.', 'Из дневника пациентки за два цикла — наибольший балл (0 нет … 5 сильно) по каждой из одиннадцати областей симптомов за 7 дней до менструации и за 7 дней после окончания кровотечения; картина дневника по циклам; критерии DSM-5-TR как перечень врача; варианты лечения отметками, без доз.'),
      alanlar: {
        ...diaryAlanlari(),
        kriter_a: u('A — koʻp sikllarda hayzdan oldingi oxirgi haftada 5 va undan ortiq belgi, hayz boshlangach bir necha kunda kamayadi, keyingi haftada deyarli yoʻq', 'A — кўп циклларда ҳайздан олдинги охирги ҳафтада 5 ва ундан ортиқ белги, ҳайз бошлангач бир неча кунда камаяди, кейинги ҳафтада деярли йўқ', 'A — в большинстве циклов 5 и более симптомов в последнюю неделю до менструации, уменьшаются в первые дни, почти отсутствуют неделю спустя'),
        kriter_b: u('B — kamida bittasi kayfiyat belgisi', 'B — камида биттаси кайфият белгиси', 'B — хотя бы один симптом настроения'),
        kriter_c: u('C — qoʻshimcha belgilar bilan jami 5 ta', 'C — қўшимча белгилар билан жами 5 та', 'C — с дополнительными симптомами всего 5'),
        kriter_d: u('D — klinik ahamiyatli azob yoki ish, oʻqish, ijtimoiy hayot, munosabatlarga taʼsir', 'D — клиник аҳамиятли азоб ёки иш, ўқиш, ижтимоий ҳаёт, муносабатларга таъсир', 'D — клинически значимый дистресс или нарушение работы, учёбы, социальной жизни, отношений'),
        kriter_e: u('E — boshqa buzilishning faqat kuchayishi emas', 'E — бошқа бузилишнинг фақат кучайиши эмас', 'E — не просто обострение другого расстройства'),
        kriter_f: u('F — kamida ikki simptomli siklda prospektiv kundalik bilan tasdiqlangan (aks holda «taxminiy»)', 'Ф — камида икки симптомли циклда проспектив кундалик билан тасдиқланган (акс ҳолда «тахминий»)', 'F — подтверждено проспективным дневником минимум за два симптомных цикла (иначе «предварительный»)'),
        kriter_g: u('G — modda, dori yoki boshqa kasallik (masalan gipertireoz) bilan bogʻliq emas', 'Г — модда, дори ёки бошқа касаллик (масалан гипертиреоз) билан боғлиқ эмас', 'G — не связано с веществом, лекарством или другим заболеванием (например гипертиреозом)'),
        yonetim_ssri_surekli: u('SSRI, doimiy (dori va doza shifokorniki)', 'ССРИ, доимий (дори ва доза шифокорники)', 'СИОЗС, постоянно (препарат и доза — врача)'),
        yonetim_ssri_luteal: u('SSRI, faqat lyutein fazada (dori va doza shifokorniki)', 'ССРИ, фақат лютеин фазада (дори ва доза шифокорники)', 'СИОЗС, только в лютеиновую фазу (препарат и доза — врача)'),
        yonetim_kombine_oral_kontraseptif: u('Kombinatsiyalangan oral kontratseptiv (preparat shifokorniki)', 'Комбинацияланган орал контратсептив (препарат шифокорники)', 'Комбинированный оральный контрацептив (препарат — врача)'),
        yonetim_bilissel_davranisci_terapi: u('Kognitiv-xulqiy terapiya (yoʻnaltirish)', 'Когнитив-хулқий терапия (йўналтириш)', 'Когнитивно-поведенческая терапия (направление)'),
        yonetim_gnrh_agonist_addback: u('Ogʻir belgilarda GnRG agonisti va qoʻshimcha gormon (mutaxassis qarori)', 'Оғир белгиларда ГнРГ агонисти ва қўшимча гормон (мутахассис қарори)', 'При тяжёлых симптомах агонист ГнРГ с заместительной гормональной поддержкой (решение специалиста)'),
      },
      sayilar: { dongu1_karsilayan: u('1-sikl: naqshli sohalar', '1-цикл: нақшли соҳалар', 'Цикл 1: областей с картиной'), dongu2_karsilayan: u('2-sikl: naqshli sohalar', '2-цикл: нақшли соҳалар', 'Цикл 2: областей с картиной'), oruntu_dongu: u('Naqshli sikllar', 'Нақшли цикллар', 'Циклов с картиной') },
      bantlar: { tum_kriterler: u('Barcha mezonlar belgilangan', 'Барча мезонлар белгиланган', 'Отмечены все критерии'), gecici: u('F dan tashqari hammasi: «taxminiy»', 'Ф дан ташқари ҳаммаси: «тахминий»', 'Все, кроме F: «предварительный»'), eksik: u('Mezonlar hali ochiq', 'Мезонлар ҳали очиқ', 'Критерии ещё открыты') },
      uyarilar: {
        iki_dongu_oruntu: u('Ikki siklda kundalik naqshi bor: F mezonini qoʻllab-quvvatlaydi.', 'Икки циклда кундалик нақши бор: Ф мезонини қўллаб-қувватлайди.', 'Картина дневника в двух циклах: поддерживает критерий F.'),
        tek_dongu: u('Kundalik naqshi ikki siklda koʻrinmaydi.', 'Кундалик нақши икки циклда кўринмайди.', 'Картина дневника не видна в двух циклах.'),
        tani_hekimde: u('Kundalikning oʻz oʻqilishi: «yaqqol» 4–5, «bor» 2 va undan yuqori, «deyarli yoʻq» 0–1 — tasdiqlangan chegara emas. Tashxis shifokorniki.', 'Кундаликнинг ўз ўқилиши: «яққол» 4–5, «бор» 2 ва ундан юқори, «деярли йўқ» 0–1 — тасдиқланган чегара эмас. Ташхис шифокорники.', 'Собственная трактовка дневника: «выраженно» 4–5, «есть» 2 и выше, «почти нет» 0–1 — не валидированный порог. Диагноз ставит врач.'),
      },
      tarihler: { d1_adet: u('1-sikl: hayz', '1-цикл: ҳайз', 'Цикл 1: менструация'), d2_adet: u('2-sikl: hayz', '2-цикл: ҳайз', 'Цикл 2: менструация') },
      not: birlestir(u('Tuzilma: Amerika Psixiatriya Assotsiatsiyasi, DSM-5-TR (2022). Davolash variantlari: ACOG 7-sonli klinik qoʻllanmasi (2023) — xalqaro manba. Oʻziga xos kundalik: DRSP ishlatilmagan (tijoriy litsenziya tasdiqlanmagan).', 'Тузилма: Америка Психиатрия Ассотсиацияси, ДСМ-5-ТР (2022). Даволаш вариантлари: ACOG 7-сонли клиник қўлланмаси (2023) — халқаро манба. Ўзига хос кундалик: ДРСП ишлатилмаган (тижорий литсензия тасдиқланмаган).', 'Структура: Американская психиатрическая ассоциация, DSM-5-TR (2022). Варианты лечения: клиническое руководство ACOG No. 7 (2023) — международный источник. Оригинальный дневник: DRSP не использован (коммерческая лицензия не подтверждена).'), QAROR),
    },
  },
]
