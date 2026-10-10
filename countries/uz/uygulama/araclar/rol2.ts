/**
 * NOTYA-ULKE-ARACLAR-01 — Uzbekistan: ROLE TOOLS, second part, in the order of the pack's role list:
 * paediatric surgery (cocuk-cerrahisi), internal medicine (dahiliye), dermatology (dermatoloji),
 * endocrinology (endokrinoloji), infectious diseases (enfeksiyon-hastaliklari).
 *
 * Every tool names the roles that see it. MACHINE-WRITTEN. AWAITS NATIVE REVIEW (see ./index.ts).
 */
import type { PaketAraci } from '@/lib/ulke/araclar/tipler'
import { DOZASIZ, KARAR, KEYINGI_NAZORAT, KEYINGI_NAZORAT_SANASI, ayni, u, type Uc } from './yardimci'

// ── dermatology: the four regions and the signs scored in each, written once ──
const SOHALAR: Readonly<Record<string, Uc>> = {
  bas: u('Bosh va boʻyin', 'Бош ва бўйин', 'Голова и шея'),
  ust: u('Qoʻllar', 'Қўллар', 'Верхние конечности'),
  govde: u('Tana', 'Тана', 'Туловище'),
  alt: u('Oyoqlar', 'Оёқлар', 'Нижние конечности'),
}
const MAYDON = u('zararlangan maydon (0–6)', 'зарарланган майдон (0–6)', 'площадь поражения (0–6)')
const PASI_BELGILARI: Readonly<Record<string, Uc>> = {
  e: u('eritema (0–4)', 'эритема (0–4)', 'эритема (0–4)'),
  i: u('induratsiya (0–4)', 'индурация (0–4)', 'инфильтрация (0–4)'),
  d: u('qipiqlanish (0–4)', 'қипиқланиш (0–4)', 'шелушение (0–4)'),
  a: MAYDON,
}
const EASI_BELGILARI: Readonly<Record<string, Uc>> = {
  e: u('eritema (0–3)', 'эритема (0–3)', 'эритема (0–3)'),
  i: u('shish yoki papulalar (0–3)', 'шиш ёки папулалар (0–3)', 'отёк или папулы (0–3)'),
  d: u('ekskoriatsiya (0–3)', 'экскориация (0–3)', 'экскориации (0–3)'),
  l: u('lixenifikatsiya (0–3)', 'лихенификация (0–3)', 'лихенификация (0–3)'),
  a: MAYDON,
}
/** "Region: sign" for every field of a regional index. */
const sohaAlanlari = (belgilar: Readonly<Record<string, Uc>>): Record<string, Uc> =>
  Object.fromEntries(Object.entries(SOHALAR).flatMap(([s, soha]) => Object.entries(belgilar).map(([b, belgi]) => [`${s}_${b}`, u(`${soha['uz-Latn']}: ${belgi['uz-Latn']}`, `${soha['uz-Cyrl']}: ${belgi['uz-Cyrl']}`, `${soha.ru}: ${belgi.ru}`)])))

export const UZ_ROL_ARACLARI_2: readonly PaketAraci[] = [
  // ── paediatric surgery. Not for paediatrics (no operation there) and not for general surgery (its own lists). ──
  {
    anahtar: 'cocuk-prepost-op', roller: ['cocuk-cerrahisi'],
    metin: {
      ad: u('Operatsiyadan oldingi va keyingi nazorat roʻyxati', 'Операциядан олдинги ва кейинги назорат рўйхати', 'Контрольный список до и после операции'),
      aciklama: u('Operatsiyadan oldin yoki keyin bajarilgan bandlar va operatsiya sanasi. Dori dozalari yozilmaydi.', 'Операциядан олдин ёки кейин бажарилган бандлар ва операция санаси. Дори дозалари ёзилмайди.', 'Пункты, выполненные до или после операции, и дата операции. Дозы препаратов не указываются.'),
      alanlar: {
        tip: u('Roʻyxat', 'Рўйхат', 'Список'),
        onam: u('Operatsiyaga rozilik ota-onasi yoki qonuniy vakilidan olindi va hujjatlashtirildi', 'Операцияга розилик ота-онаси ёки қонуний вакилидан олинди ва ҳужжатлаштирилди', 'Согласие на операцию получено от родителя или законного представителя и оформлено'),
        laboratuvar: u('Operatsiyadan oldingi laboratoriya tekshiruvlari bajarildi', 'Операциядан олдинги лаборатория текширувлари бажарилди', 'Предоперационные лабораторные исследования выполнены'),
        goruntu: u('Operatsiyadan oldingi tasviriy tekshiruv va xulosasi koʻrib chiqildi', 'Операциядан олдинги тасвирий текширув ва хулосаси кўриб чиқилди', 'Предоперационная визуализация и заключение просмотрены'),
        acil_kisi: u('Shoshilinch holatda bogʻlaniladigan shaxs maʼlumoti olindi', 'Шошилинч ҳолатда боғланиладиган шахс маълумоти олинди', 'Получены данные контактного лица на экстренный случай'),
        anestezi_not: u('Anesteziolog qaydi bemor hujjatlarida bor', 'Анестезиолог қайди бемор ҳужжатларида бор', 'Запись анестезиолога есть в документах пациента'),
        postop_yara: u('Jarohat va bogʻlam parvarishi tushuntirildi', 'Жароҳат ва боғлам парвариши тушунтирилди', 'Объяснён уход за раной и повязкой'),
        postop_agri: u('Ogʻriqni boshqarish rejasi tushuntirildi (dozani shifokor belgilaydi)', 'Оғриқни бошқариш режаси тушунтирилди (дозани шифокор белгилайди)', 'Объяснён план обезболивания (дозы определяет врач)'),
        postop_beslenme: u('Ovqatlanish va jismoniy faollik cheklovlari tushuntirildi', 'Овқатланиш ва жисмоний фаоллик чекловлари тушунтирилди', 'Объяснены ограничения в питании и активности'),
        kontrol_plan: u('Nazorat qabuli sanasi belgilandi', 'Назорат қабули санаси белгиланди', 'Назначена дата контрольного приёма'),
        postop_acil_yol: u('Ahvol yomonlashsa nima qilish kerakligi tushuntirildi', 'Аҳвол ёмонлашса нима қилиш кераклиги тушунтирилди', 'Объяснено, что делать при ухудшении состояния'),
        etiket: u('Operatsiya nomi, qisqacha (ixtiyoriy)', 'Операция номи, қисқача (ихтиёрий)', 'Краткое название операции (необязательно)'),
        ameliyat_tarihi: u('Operatsiya sanasi (ixtiyoriy)', 'Операция санаси (ихтиёрий)', 'Дата операции (необязательно)'),
      },
      secenekler: { tip: { preop: u('Operatsiyadan oldin', 'Операциядан олдин', 'До операции'), postop: u('Operatsiyadan keyin', 'Операциядан кейин', 'После операции') } },
      sayilar: { tamamlanan: u('Bajarilgan bandlar', 'Бажарилган бандлар', 'Выполнено пунктов') },
      tarihler: { ameliyat_tarihi: u('Operatsiya sanasi', 'Операция санаси', 'Дата операции') },
      not: DOZASIZ,
    },
  },
  {
    // Two roles: paediatric surgery and general surgery follow a wound, a drain and sutures the same way (the pre-split
    // application has the same tool in both). Not for thoracic, cardiovascular or plastic surgery: each has its own.
    anahtar: 'yara-dren-izlem', roller: ['cocuk-cerrahisi', 'genel-cerrahi'],
    metin: {
      ad: u('Jarohat, drenaj va choklar kuzatuvi', 'Жароҳат, дренаж ва чоклар кузатуви', 'Наблюдение за раной, дренажом и швами'),
      aciklama: u('Nima kuzatilayotgani, sanasi va keyingi nazorat. Infeksiya tashxisi va dori dozasi yozilmaydi.', 'Нима кузатилаётгани, санаси ва кейинги назорат. Инфекция ташхиси ва дори дозаси ёзилмайди.', 'Что наблюдается, дата и следующий контроль. Диагноз инфекции и дозы препаратов не указываются.'),
      alanlar: {
        tip: u('Nima kuzatiladi', 'Нима кузатилади', 'Что наблюдается'),
        bolge: u('Soha (ixtiyoriy)', 'Соҳа (ихтиёрий)', 'Область (необязательно)'),
        tarih: u('Kuzatuv sanasi', 'Кузатув санаси', 'Дата наблюдения'),
        sonraki_kontrol: KEYINGI_NAZORAT_SANASI,
        dren_cikis_ml: u('Drenajdan ajralma (ixtiyoriy)', 'Дренаждан ажралма (ихтиёрий)', 'Отделяемое по дренажу (необязательно)'),
      },
      secenekler: { tip: { yara: u('Jarohat', 'Жароҳат', 'Рана'), dren: u('Drenaj', 'Дренаж', 'Дренаж'), dikis: u('Choklarni olish', 'Чокларни олиш', 'Снятие швов'), taburcu_kontrol: u('Chiqarilgandan keyingi nazorat', 'Чиқарилгандан кейинги назорат', 'Контроль после выписки') } },
      sayilar: { dren_cikis_ml: u('Drenajdan ajralma', 'Дренаждан ажралма', 'Отделяемое по дренажу') },
      tarihler: { tarih: u('Kuzatuv sanasi', 'Кузатув санаси', 'Дата наблюдения'), sonraki_kontrol: KEYINGI_NAZORAT },
      not: DOZASIZ,
    },
  },

  // ── internal medicine. Not for nephrology (its own tool) and not for cardiology or endocrinology. ──
  {
    // OFF BY KAAN'S ORDER OF 2026-10-10 (NOTYA-ULKE-ARAC-01b): a slot in ./yuvalar.ts, and not on the list of tools
    // (./index.ts → UZ_KAPALI_ARACLAR). The words below are kept for the day the tool comes back; no screen shows them.
    anahtar: 'kdigo-evre', roller: ['dahiliye'],
    metin: {
      ad: u('Buyrak surunkali kasalligi: KDIGO toifalari', 'Буйрак сурункали касаллиги: KDIGO тоифалари', 'Хроническая болезнь почек: категории KDIGO'),
      aciklama: u('KFT toifasi (G1–G5), albuminuriya toifasi (A1–A3) va, ikkala natija kiritilganda, ular tushadigan xavf katagi. Davolash rejasi va kuzatuv muddati yozilmaydi.', 'КФТ тоифаси (G1–G5), альбуминурия тоифаси (A1–A3) ва, иккала натижа киритилганда, улар тушадиган хавф катаги. Даволаш режаси ва кузатув муддати ёзилмайди.', 'Категория СКФ (G1–G5), категория альбуминурии (A1–A3) и, когда введены оба результата, ячейка риска, в которую они попадают. План лечения и сроки наблюдения не указываются.'),
      alanlar: {
        egfr: u('Hisoblangan KFT', 'Ҳисобланган КФТ', 'Расчётная СКФ'),
        uacr: u('Siydikda albumin va kreatinin nisbati (usiz xavf katagi koʻrsatilmaydi)', 'Сийдикда альбумин ва креатинин нисбати (усиз хавф катаги кўрсатилмайди)', 'Отношение альбумина к креатинину в моче (без него ячейка риска не показывается)'),
        egfr_bir_yil_once: u('Oldingi KFT (ixtiyoriy)', 'Олдинги КФТ (ихтиёрий)', 'Прежняя СКФ (необязательно)'),
      },
      bantlar: {
        yesil: u('Past xavf (yashil katak)', 'Паст хавф (яшил катак)', 'Низкий риск (зелёная ячейка)'),
        sari: u('Oʻrtacha oshgan xavf (sariq katak)', 'Ўртача ошган хавф (сариқ катак)', 'Умеренно повышенный риск (жёлтая ячейка)'),
        turuncu: u('Yuqori xavf (toʻq sariq katak)', 'Юқори хавф (тўқ сариқ катак)', 'Высокий риск (оранжевая ячейка)'),
        kirmizi: u('Juda yuqori xavf (qizil katak)', 'Жуда юқори хавф (қизил катак)', 'Очень высокий риск (красная ячейка)'),
      },
      uyarilar: {
        G1: u('G1: KFT 90 va undan yuqori', 'G1: КФТ 90 ва ундан юқори', 'G1: СКФ 90 и выше'),
        G2: u('G2: KFT 60–89', 'G2: КФТ 60–89', 'G2: СКФ 60–89'),
        G3a: u('G3a: KFT 45–59', 'G3a: КФТ 45–59', 'G3a: СКФ 45–59'),
        G3b: u('G3b: KFT 30–44', 'G3b: КФТ 30–44', 'G3b: СКФ 30–44'),
        G4: u('G4: KFT 15–29', 'G4: КФТ 15–29', 'G4: СКФ 15–29'),
        G5: u('G5: KFT 15 dan past', 'G5: КФТ 15 дан паст', 'G5: СКФ менее 15'),
        A1: u('A1: albumin va kreatinin nisbati 30 mg/g dan past', 'A1: альбумин ва креатинин нисбати 30 мг/г дан паст', 'A1: отношение альбумина к креатинину менее 30 мг/г'),
        A2: u('A2: albumin va kreatinin nisbati 30–300 mg/g', 'A2: альбумин ва креатинин нисбати 30–300 мг/г', 'A2: отношение альбумина к креатинину 30–300 мг/г'),
        A3: u('A3: albumin va kreatinin nisbati 300 mg/g dan yuqori', 'A3: альбумин ва креатинин нисбати 300 мг/г дан юқори', 'A3: отношение альбумина к креатинину более 300 мг/г'),
        // NOTYA-ULKE-ARAC-DUZELTME-01 (fault 5): no risk cell without the urine result; each referral line says what the
        // guideline's list names and what one result cannot show (the kit's definition cites the list). mg/g only: the
        // one unit this pack states for the ratio.
        uacr_yok: u('Siydikda albumin va kreatinin nisbati kiritilmagan: xavf katagi ikkala natijani talab qiladi va koʻrsatilmaydi', 'Сийдикда альбумин ва креатинин нисбати киритилмаган: хавф катаги иккала натижани талаб қилади ва кўрсатилмайди', 'Отношение альбумина к креатинину в моче не введено: для ячейки риска нужны оба результата, и она не показывается'),
        sevk_egfr30: u('KDIGO roʻyxatida, buyrak mutaxassisiga yoʻllash holatlari orasida: KFT 30 dan past', 'KDIGO рўйхатида, буйрак мутахассисига йўллаш ҳолатлари орасида: КФТ 30 дан паст', 'В перечне KDIGO среди обстоятельств для направления к специалисту по болезням почек: СКФ менее 30'),
        sevk_acr_hematuri: u('Nisbat 300 mg/g yoki undan yuqori. KDIGO roʻyxatida bu holat barqaror topilma sifatida va siydikda qon bilan birga koʻrsatilgan: bitta natija buni koʻrsatmaydi', 'Нисбат 300 мг/г ёки ундан юқори. KDIGO рўйхатида бу ҳолат барқарор топилма сифатида ва сийдикда қон билан бирга кўрсатилган: битта натижа буни кўрсатмайди', 'Отношение 300 мг/г или выше. В перечне KDIGO это названо как стойкая находка в сочетании с кровью в моче: один результат этого не показывает'),
        sevk_acr700: u('Nisbat 700 mg/g dan yuqori. KDIGO roʻyxatida bu holat barqaror topilma sifatida koʻrsatilgan: bitta natija buni koʻrsatmaydi', 'Нисбат 700 мг/г дан юқори. KDIGO рўйхатида бу ҳолат барқарор топилма сифатида кўрсатилган: битта натижа буни кўрсатмайди', 'Отношение выше 700 мг/г. В перечне KDIGO это названо как стойкая находка: один результат этого не показывает'),
        sevk_dusus20: u('KFT oldingi qiymatdan 20 foizdan koʻproq past. KDIGO roʻyxatida 20 foizdan ortiq barqaror pasayish koʻrsatilgan: ikki natija pasayish barqaror ekanini koʻrsatmaydi', 'КФТ олдинги қийматдан 20 фоиздан кўпроқ паст. KDIGO рўйхатида 20 фоиздан ортиқ барқарор пасайиш кўрсатилган: икки натижа пасайиш барқарор эканини кўрсатмайди', 'СКФ более чем на 20 % ниже прежнего значения. В перечне KDIGO названо устойчивое снижение более чем на 20 %: два результата не показывают, что снижение устойчиво'),
      },
      not: KARAR,
    },
  },

  // ── dermatology. Not for the clinic dermatology role (cosmetic procedures) and not for rheumatology. ──
  {
    // ALSO THE CLINIC-SIDE ROLE OF THE SAME SPECIALTY since the audit of 2026-10-10: klinik-dermatoloji is
    // "Dermatovenerologiya" in the order, as dermatoloji is. The four dermatology tools go to both.
    anahtar: 'pasi', roller: ['dermatoloji', 'klinik-dermatoloji'],
    metin: {
      ad: u('PASI indeksi', 'PASI индекси', 'Индекс PASI'),
      aciklama: u('Psoriaz maydoni va ogʻirligi indeksi. Toʻrt soha; har birida eritema, induratsiya va qipiqlanish (0–4) hamda maydon bali (0 — zararlanmagan, 1 — 1–9 %, 2 — 10–29 %, 3 — 30–49 %, 4 — 50–69 %, 5 — 70–89 %, 6 — 90–100 %). Indeks har bir soha toʻliq kiritilganda chiqadi: maydon bali va, maydon 0 boʻlmasa, uchta belgi. Vosita ballni koʻrsatadi va ogʻirlik darajasini nomlamaydi.', 'Псориаз майдони ва оғирлиги индекси. Тўрт соҳа; ҳар бирида эритема, индурация ва қипиқланиш (0–4) ҳамда майдон бали (0 — зарарланмаган, 1 — 1–9 %, 2 — 10–29 %, 3 — 30–49 %, 4 — 50–69 %, 5 — 70–89 %, 6 — 90–100 %). Индекс ҳар бир соҳа тўлиқ киритилганда чиқади: майдон бали ва, майдон 0 бўлмаса, учта белги. Восита баллни кўрсатади ва оғирлик даражасини номламайди.', 'Индекс площади и тяжести псориаза. Четыре области; в каждой эритема, инфильтрация и шелушение (0–4) и балл площади (0 — нет поражения, 1 — 1–9 %, 2 — 10–29 %, 3 — 30–49 %, 4 — 50–69 %, 5 — 70–89 %, 6 — 90–100 %). Индекс появляется, когда каждая область заполнена: балл площади и, если площадь не 0, три признака. Инструмент показывает балл и не называет степень тяжести.'),
      alanlar: sohaAlanlari(PASI_BELGILARI),
      sayilar: { pasi: ayni('PASI') },
      not: KARAR,
    },
  },
  {
    anahtar: 'easi', roller: ['dermatoloji', 'klinik-dermatoloji'],
    metin: {
      ad: u('EASI indeksi', 'EASI индекси', 'Индекс EASI'),
      aciklama: u('Ekzema maydoni va ogʻirligi indeksi. Toʻrt soha; har birida toʻrt belgi (0–3) va maydon bali (0 — zararlanmagan, 1 — 1–9 %, 2 — 10–29 %, 3 — 30–49 %, 4 — 50–69 %, 5 — 70–89 %, 6 — 90–100 %). Har bir sohaning vazn koeffitsiyenti bemorning yoshiga bogʻliq: 8 yoshgacha yoki 8 yosh va undan katta. Indeks yosh tanlanganda va har bir soha toʻliq kiritilganda chiqadi: maydon bali va, maydon 0 boʻlmasa, toʻrtta belgi.', 'Экзема майдони ва оғирлиги индекси. Тўрт соҳа; ҳар бирида тўрт белги (0–3) ва майдон бали (0 — зарарланмаган, 1 — 1–9 %, 2 — 10–29 %, 3 — 30–49 %, 4 — 50–69 %, 5 — 70–89 %, 6 — 90–100 %). Ҳар бир соҳанинг вазн коэффициенти беморнинг ёшига боғлиқ: 8 ёшгача ёки 8 ёш ва ундан катта. Индекс ёш танланганда ва ҳар бир соҳа тўлиқ киритилганда чиқади: майдон бали ва, майдон 0 бўлмаса, тўртта белги.', 'Индекс площади и тяжести экземы. Четыре области; в каждой четыре признака (0–3) и балл площади (0 — нет поражения, 1 — 1–9 %, 2 — 10–29 %, 3 — 30–49 %, 4 — 50–69 %, 5 — 70–89 %, 6 — 90–100 %). Весовой коэффициент каждой области зависит от возраста пациента: до 8 лет либо 8 лет и старше. Индекс появляется, когда выбран возраст и каждая область заполнена: балл площади и, если площадь не 0, четыре признака.'),
      alanlar: { yas: u('Bemorning yoshi', 'Беморнинг ёши', 'Возраст пациента'), ...sohaAlanlari(EASI_BELGILARI) },
      secenekler: { yas: { yedi_ve_alti: u('8 yoshgacha', '8 ёшгача', 'До 8 лет'), sekiz_ve_ustu: u('8 yosh va undan katta', '8 ёш ва ундан катта', '8 лет и старше') } },
      sayilar: { easi: ayni('EASI') },
      // the published strata, six of them (the kit's definition cites the paper)
      bantlar: {
        temiz: u('Toza (0)', 'Тоза (0)', 'Чисто (0)'),
        neredeyse_temiz: u('Deyarli toza (0,1–1,0)', 'Деярли тоза (0,1–1,0)', 'Почти чисто (0,1–1,0)'),
        hafif: u('Yengil (1,1–7,0)', 'Енгил (1,1–7,0)', 'Лёгкая степень (1,1–7,0)'),
        orta: u('Oʻrtacha (7,1–21,0)', 'Ўртача (7,1–21,0)', 'Средняя степень (7,1–21,0)'),
        siddetli: u('Ogʻir (21,1–50,0)', 'Оғир (21,1–50,0)', 'Тяжёлая степень (21,1–50,0)'),
        cok_siddetli: u('Juda ogʻir (50,1–72,0)', 'Жуда оғир (50,1–72,0)', 'Очень тяжёлая степень (50,1–72,0)'),
      },
      not: KARAR,
    },
  },
  {
    anahtar: 'scorad', roller: ['dermatoloji', 'klinik-dermatoloji'],
    metin: {
      ad: u('SCORAD indeksi', 'SCORAD индекси', 'Индекс SCORAD'),
      aciklama: u('Atopik dermatit ogʻirligi: A — zararlangan yuza foizi, B — olti belgining intensivligi (0–3), C — qichishish va uyqu buzilishi (0–10). Hisob: A ning beshdan biri, B ning uch yarim barobari va C yigʻindisi. Indeks barcha maydonlar toʻldirilganda chiqadi.', 'Атопик дерматит оғирлиги: A — зарарланган юза фоизи, B — олти белгининг интенсивлиги (0–3), C — қичишиш ва уйқу бузилиши (0–10). Ҳисоб: A нинг бешдан бири, B нинг уч ярим баробари ва C йиғиндиси. Индекс барча майдонлар тўлдирилганда чиқади.', 'Тяжесть атопического дерматита: A — процент поражённой поверхности, B — интенсивность шести признаков (0–3), C — зуд и нарушение сна (0–10). Расчёт: пятая часть A, B, умноженное на три с половиной, и C в сумме. Индекс появляется, когда заполнены все поля.'),
      alanlar: {
        yayginlik: u('Zararlangan teri yuzasi', 'Зарарланган тери юзаси', 'Площадь поражения кожи'),
        eritem: u('Eritema (0–3)', 'Эритема (0–3)', 'Эритема (0–3)'),
        odem: u('Shish yoki papulalar (0–3)', 'Шиш ёки папулалар (0–3)', 'Отёк или папулы (0–3)'),
        sizinti: u('Namlanish yoki qaloqlar (0–3)', 'Намланиш ёки қалоқлар (0–3)', 'Мокнутие или корки (0–3)'),
        ekskoriasyon: u('Ekskoriatsiya (0–3)', 'Экскориация (0–3)', 'Экскориации (0–3)'),
        likenifikasyon: u('Lixenifikatsiya (0–3)', 'Лихенификация (0–3)', 'Лихенификация (0–3)'),
        kuruluk: u('Zararlanmagan teri quruqligi (0–3)', 'Зарарланмаган тери қуруқлиги (0–3)', 'Сухость непоражённой кожи (0–3)'),
        kasinti: u('Qichishish, bemor bahosi (0–10)', 'Қичишиш, бемор баҳоси (0–10)', 'Зуд, оценка пациента (0–10)'),
        uykusuzluk: u('Uyqu buzilishi, bemor bahosi (0–10)', 'Уйқу бузилиши, бемор баҳоси (0–10)', 'Нарушение сна, оценка пациента (0–10)'),
      },
      sayilar: {
        scorad: ayni('SCORAD'),
        a: u('A — tarqalganlik', 'A — тарқалганлик', 'A — распространённость'),
        b: u('B — intensivlik', 'B — интенсивлик', 'B — интенсивность'),
        c: u('C — subyektiv belgilar', 'C — субъектив белгилар', 'C — субъективные симптомы'),
      },
      bantlar: { hafif: u('Yengil (25 dan past)', 'Енгил (25 дан паст)', 'Лёгкая степень (менее 25)'), orta: u('Oʻrtacha (25–50)', 'Ўртача (25–50)', 'Средняя степень (25–50)'), siddetli: u('Ogʻir (50 dan yuqori)', 'Оғир (50 дан юқори)', 'Тяжёлая степень (более 50)') },
      not: KARAR,
    },
  },
  {
    anahtar: 'yama-okuma', roller: ['dermatoloji', 'klinik-dermatoloji'],
    metin: {
      ad: u('Applikatsion test: natijani oʻqish kunlari', 'Аппликацион тест: натижани ўқиш кунлари', 'Аппликационный тест: дни чтения результата'),
      aciklama: u('Applikatsiya qoʻyilgan sanadan ikkinchi va toʻrtinchi kun (D2, D4) hisoblanadi.', 'Аппликация қўйилган санадан иккинчи ва тўртинчи кун (D2, D4) ҳисобланади.', 'От даты наложения аппликаций рассчитываются второй и четвёртый день (D2, D4).'),
      alanlar: { uygulama: u('Applikatsiya qoʻyilgan sana', 'Аппликация қўйилган сана', 'Дата наложения аппликаций') },
      tarihler: { d2: u('Birinchi oʻqish (D2)', 'Биринчи ўқиш (D2)', 'Первое чтение (D2)'), d4: u('Ikkinchi oʻqish (D4)', 'Иккинчи ўқиш (D4)', 'Второе чтение (D4)') },
      not: u('Allergenlar roʻyxati bu vositada yoʻq; natijani shifokor baholaydi.', 'Аллергенлар рўйхати бу воситада йўқ; натижани шифокор баҳолайди.', 'Перечня аллергенов в этом инструменте нет; результат оценивает врач.'),
    },
  },

  // ── endocrinology. Not for internal medicine and not for family medicine. ──
  {
    anahtar: 'rejim-karti', roller: ['endokrinoloji'],
    metin: {
      ad: u('Insulin va qalqonsimon bez davosi: sanalar kartasi', 'Инсулин ва қалқонсимон без давоси: саналар картаси', 'Инсулин и терапия щитовидной железы: карта дат'),
      aciklama: u('Davo boshlangan sana va keyingi nazorat sanasi. Dori va doza yozilmaydi.', 'Даво бошланган сана ва кейинги назорат санаси. Дори ва доза ёзилмайди.', 'Дата начала терапии и дата следующего контроля. Препараты и дозы не указываются.'),
      alanlar: {
        insulin_baslangic: u('Insulin: boshlangan sana', 'Инсулин: бошланган сана', 'Инсулин: дата начала'),
        insulin_kontrol: u('Insulin: keyingi nazorat', 'Инсулин: кейинги назорат', 'Инсулин: следующий контроль'),
        tiroid_baslangic: u('Qalqonsimon bez davosi: boshlangan sana', 'Қалқонсимон без давоси: бошланган сана', 'Терапия щитовидной железы: дата начала'),
        tiroid_kontrol: u('Qalqonsimon bez davosi: keyingi nazorat', 'Қалқонсимон без давоси: кейинги назорат', 'Терапия щитовидной железы: следующий контроль'),
      },
      tarihler: {
        insulin_baslangic: u('Insulin: boshlangan sana', 'Инсулин: бошланган сана', 'Инсулин: дата начала'),
        insulin_kontrol: u('Insulin: keyingi nazorat', 'Инсулин: кейинги назорат', 'Инсулин: следующий контроль'),
        tiroid_baslangic: u('Qalqonsimon bez davosi: boshlangan sana', 'Қалқонсимон без давоси: бошланган сана', 'Терапия щитовидной железы: дата начала'),
        tiroid_kontrol: u('Qalqonsimon bez davosi: keyingi nazorat', 'Қалқонсимон без давоси: кейинги назорат', 'Терапия щитовидной железы: следующий контроль'),
      },
      not: DOZASIZ,
    },
  },

  // ── infectious diseases. Not for internal medicine or family medicine: the course counter of an infection clinic. ──
  {
    anahtar: 'antibiyotik-sure', roller: ['enfeksiyon-hastaliklari'],
    metin: {
      ad: u('Antibiotik kursi: kunlar hisobi', 'Антибиотик курси: кунлар ҳисоби', 'Курс антибиотика: счёт дней'),
      aciklama: u('Boshlangan sana va kunlar sonidan kursning oxirgi kuni va nazorat sanasi hisoblanadi. Boshlangan sana 1-kun deb olinadi. Dori, doza va tavsiya etiladigan muddat yozilmaydi.', 'Бошланган сана ва кунлар сонидан курснинг охирги куни ва назорат санаси ҳисобланади. Бошланган сана 1-кун деб олинади. Дори, доза ва тавсия этиладиган муддат ёзилмайди.', 'По дате начала и числу дней рассчитываются последний день курса и дата контроля. Дата начала считается первым днём. Препарат, доза и рекомендуемая длительность не указываются.'),
      alanlar: {
        baslangic: u('Kurs boshlangan sana', 'Курс бошланган сана', 'Дата начала курса'),
        sure_gun: u('Kurs davomiyligi', 'Курс давомийлиги', 'Длительность курса'),
        kontrol: u('Nazorat sanasi (ixtiyoriy)', 'Назорат санаси (ихтиёрий)', 'Дата контроля (необязательно)'),
        sinif: u('Antibiotik guruhi, qisqacha (ixtiyoriy)', 'Антибиотик гуруҳи, қисқача (ихтиёрий)', 'Группа антибиотика, кратко (необязательно)'),
      },
      tarihler: { bitis: u('Kursning oxirgi kuni', 'Курснинг охирги куни', 'Последний день курса'), kontrol: u('Nazorat', 'Назорат', 'Контроль') },
      not: DOZASIZ,
    },
  },
]
