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
const ucBant = (orta: string, siddetliLatn: string, ortaAraligi: string): Record<string, Uc> => ({
  hafif: u(`Yengil (${orta} dan past)`, `Енгил (${orta} дан паст)`, `Лёгкая степень (менее ${orta})`),
  orta: u(`Oʻrtacha (${ortaAraligi})`, `Ўртача (${ortaAraligi})`, `Средняя степень (${ortaAraligi})`),
  siddetli: u(`Ogʻir (${siddetliLatn} va undan yuqori)`, `Оғир (${siddetliLatn} ва ундан юқори)`, `Тяжёлая степень (${siddetliLatn} и выше)`),
})

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
      aciklama: u('KFT toifasi (G1–G5), albuminuriya toifasi (A1–A3) va ular tushadigan xavf katagi. Davolash rejasi va kuzatuv muddati yozilmaydi.', 'КФТ тоифаси (G1–G5), альбуминурия тоифаси (A1–A3) ва улар тушадиган хавф катаги. Даволаш режаси ва кузатув муддати ёзилмайди.', 'Категория СКФ (G1–G5), категория альбуминурии (A1–A3) и ячейка риска, в которую они попадают. План лечения и сроки наблюдения не указываются.'),
      alanlar: {
        egfr: u('Hisoblangan KFT', 'Ҳисобланган КФТ', 'Расчётная СКФ'),
        uacr: u('Siydikda albumin va kreatinin nisbati (ixtiyoriy)', 'Сийдикда альбумин ва креатинин нисбати (ихтиёрий)', 'Отношение альбумина к креатинину в моче (необязательно)'),
        egfr_bir_yil_once: u('Bir yil oldingi KFT (ixtiyoriy)', 'Бир йил олдинги КФТ (ихтиёрий)', 'СКФ год назад (необязательно)'),
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
        hizli_dusus: u('Bir yilda KFT 25 foizdan koʻproq pasaygan', 'Бир йилда КФТ 25 фоиздан кўпроқ пасайган', 'За год СКФ снизилась более чем на 25 %'),
        sevk_egfr30: u('KDIGO boʻyicha nefrologga yoʻllash mezoni: KFT 30 dan past', 'KDIGO бўйича нефрологга йўллаш мезони: КФТ 30 дан паст', 'Критерий KDIGO для направления к нефрологу: СКФ менее 30'),
        sevk_a3: u('KDIGO boʻyicha nefrologga yoʻllash mezoni: A3 albuminuriya', 'KDIGO бўйича нефрологга йўллаш мезони: A3 альбуминурия', 'Критерий KDIGO для направления к нефрологу: альбуминурия A3'),
        sevk_hizli_dusus: u('KDIGO boʻyicha nefrologga yoʻllash mezoni: KFTning tez pasayishi', 'KDIGO бўйича нефрологга йўллаш мезони: КФТнинг тез пасайиши', 'Критерий KDIGO для направления к нефрологу: быстрое снижение СКФ'),
        sevk_cok_yuksek_risk: u('KDIGO boʻyicha nefrologga yoʻllash mezoni: juda yuqori xavf katagi', 'KDIGO бўйича нефрологга йўллаш мезони: жуда юқори хавф катаги', 'Критерий KDIGO для направления к нефрологу: ячейка очень высокого риска'),
      },
      not: KARAR,
    },
  },

  // ── dermatology. Not for the clinic dermatology role (cosmetic procedures) and not for rheumatology. ──
  {
    anahtar: 'pasi', roller: ['dermatoloji'],
    metin: {
      ad: u('PASI indeksi', 'PASI индекси', 'Индекс PASI'),
      aciklama: u('Psoriaz maydoni va ogʻirligi indeksi. Toʻrt soha; har birida eritema, induratsiya va qipiqlanish (0–4) hamda maydon bali (0 — zararlanmagan, 1 — 1–9 %, 2 — 10–29 %, 3 — 30–49 %, 4 — 50–69 %, 5 — 70–89 %, 6 — 90–100 %). Boʻsh maydon 0 deb olinadi.', 'Псориаз майдони ва оғирлиги индекси. Тўрт соҳа; ҳар бирида эритема, индурация ва қипиқланиш (0–4) ҳамда майдон бали (0 — зарарланмаган, 1 — 1–9 %, 2 — 10–29 %, 3 — 30–49 %, 4 — 50–69 %, 5 — 70–89 %, 6 — 90–100 %). Бўш майдон 0 деб олинади.', 'Индекс площади и тяжести псориаза. Четыре области; в каждой эритема, инфильтрация и шелушение (0–4) и балл площади (0 — нет поражения, 1 — 1–9 %, 2 — 10–29 %, 3 — 30–49 %, 4 — 50–69 %, 5 — 70–89 %, 6 — 90–100 %). Пустое поле считается равным 0.'),
      alanlar: sohaAlanlari(PASI_BELGILARI),
      sayilar: { pasi: ayni('PASI') },
      bantlar: ucBant('10', '20', '10–19,9'),
      not: KARAR,
    },
  },
  {
    anahtar: 'easi', roller: ['dermatoloji'],
    metin: {
      ad: u('EASI indeksi', 'EASI индекси', 'Индекс EASI'),
      aciklama: u('Ekzema maydoni va ogʻirligi indeksi. Toʻrt soha; har birida toʻrt belgi (0–3) va maydon bali (0 — zararlanmagan, 1 — 1–9 %, 2 — 10–29 %, 3 — 30–49 %, 4 — 50–69 %, 5 — 70–89 %, 6 — 90–100 %). Vazn koeffitsiyentlari 8 yosh va undan katta bemor uchun. Boʻsh maydon 0 deb olinadi.', 'Экзема майдони ва оғирлиги индекси. Тўрт соҳа; ҳар бирида тўрт белги (0–3) ва майдон бали (0 — зарарланмаган, 1 — 1–9 %, 2 — 10–29 %, 3 — 30–49 %, 4 — 50–69 %, 5 — 70–89 %, 6 — 90–100 %). Вазн коэффитсиентлари 8 ёш ва ундан катта бемор учун. Бўш майдон 0 деб олинади.', 'Индекс площади и тяжести экземы. Четыре области; в каждой четыре признака (0–3) и балл площади (0 — нет поражения, 1 — 1–9 %, 2 — 10–29 %, 3 — 30–49 %, 4 — 50–69 %, 5 — 70–89 %, 6 — 90–100 %). Весовые коэффициенты — для пациента 8 лет и старше. Пустое поле считается равным 0.'),
      alanlar: sohaAlanlari(EASI_BELGILARI),
      sayilar: { easi: ayni('EASI') },
      bantlar: ucBant('7', '21', '7–20,9'),
      not: KARAR,
    },
  },
  {
    anahtar: 'scorad', roller: ['dermatoloji'],
    metin: {
      ad: u('SCORAD indeksi', 'SCORAD индекси', 'Индекс SCORAD'),
      aciklama: u('Atopik dermatit ogʻirligi: A — zararlangan yuza foizi, B — olti belgining intensivligi (0–3), C — qichishish va uyqu buzilishi (0–10). Hisob: A ning beshdan biri, B ning uch yarim barobari va C yigʻindisi.', 'Атопик дерматит оғирлиги: A — зарарланган юза фоизи, B — олти белгининг интенсивлиги (0–3), C — қичишиш ва уйқу бузилиши (0–10). Ҳисоб: A нинг бешдан бири, B нинг уч ярим баробари ва C йиғиндиси.', 'Тяжесть атопического дерматита: A — процент поражённой поверхности, B — интенсивность шести признаков (0–3), C — зуд и нарушение сна (0–10). Расчёт: пятая часть A, B, умноженное на три с половиной, и C в сумме.'),
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
        c: u('C — subyektiv belgilar', 'C — субектив белгилар', 'C — субъективные симптомы'),
      },
      bantlar: ucBant('25', '50', '25–49,9'),
      not: KARAR,
    },
  },
  {
    anahtar: 'yama-okuma', roller: ['dermatoloji'],
    metin: {
      ad: u('Applikatsion test: natijani oʻqish kunlari', 'Аппликатсион тест: натижани ўқиш кунлари', 'Аппликационный тест: дни чтения результата'),
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
      aciklama: u('Boshlangan sana va kunlar sonidan kurs tugaydigan sana va nazorat sanasi hisoblanadi. Dori, doza va tavsiya etiladigan muddat yozilmaydi.', 'Бошланган сана ва кунлар сонидан курс тугайдиган сана ва назорат санаси ҳисобланади. Дори, доза ва тавсия этиладиган муддат ёзилмайди.', 'По дате начала и числу дней рассчитываются дата окончания курса и дата контроля. Препарат, доза и рекомендуемая длительность не указываются.'),
      alanlar: {
        baslangic: u('Kurs boshlangan sana', 'Курс бошланган сана', 'Дата начала курса'),
        sure_gun: u('Kurs davomiyligi', 'Курс давомийлиги', 'Длительность курса'),
        kontrol: u('Nazorat sanasi (ixtiyoriy)', 'Назорат санаси (ихтиёрий)', 'Дата контроля (необязательно)'),
        sinif: u('Antibiotik guruhi, qisqacha (ixtiyoriy)', 'Антибиотик гуруҳи, қисқача (ихтиёрий)', 'Группа антибиотика, кратко (необязательно)'),
      },
      tarihler: { bitis: u('Kurs tugaydigan sana', 'Курс тугайдиган сана', 'Дата окончания курса'), kontrol: u('Nazorat', 'Назорат', 'Контроль') },
      not: DOZASIZ,
    },
  },
]
