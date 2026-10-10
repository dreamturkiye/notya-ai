/**
 * NOTYA-ULKE-ARACLAR-01 — Uzbekistan: ROLE TOOLS, fifth part, in the order of the pack's role list:
 * nephrology (nefroloji), oncology (onkoloji), orthopaedics (ortopedi), paediatrics (pediatri), plastic surgery
 * (plastik-cerrahi), radiology (radyoloji), rheumatology (romatoloji), urology (uroloji), sports medicine
 * (spor-hekimligi).
 *
 * Every tool names the roles that see it. MACHINE-WRITTEN. AWAITS NATIVE REVIEW (see ./index.ts).
 */
import type { PaketAraci } from '@/lib/ulke/araclar/tipler'
import { UZ_ROL_ARACLARI_2 } from './rol2'
import { BELGILANGAN_BANDLAR, DOZASIZ, KARAR, KEYINGI_NAZORAT, KEYINGI_NAZORAT_SANASI, ayni, kendiAdi, u, type Uc } from './yardimci'

// The KDIGO categories and risk cells are worded once, with the internal-medicine tool.
const KDIGO = UZ_ROL_ARACLARI_2.find((a) => a.anahtar === 'kdigo-evre')!.metin
const KDIGO_TOIFALARI = Object.fromEntries(Object.entries(KDIGO.uyarilar ?? {}).filter(([k]) => /^(G|A)\d/.test(k)))

// rheumatology: the 28 joints, written once
const TOMON: Readonly<Record<string, Uc>> = { sag: u('oʻng', 'ўнг', 'правый'), sol: u('chap', 'чап', 'левый') }
const BOGIM: Readonly<Record<string, Uc>> = {
  omuz: u('yelka boʻgʻimi', 'елка бўғими', 'плечевой сустав'),
  dirsek: u('tirsak boʻgʻimi', 'тирсак бўғими', 'локтевой сустав'),
  el_bilegi: u('bilak-kaft boʻgʻimi', 'билак-кафт бўғими', 'лучезапястный сустав'),
  mcp: u('kaft-barmoq boʻgʻimi', 'кафт-бармоқ бўғими', 'пястно-фаланговый сустав'),
  pip: u('proksimal barmoqlararo boʻgʻim', 'проксимал бармоқлараро бўғим', 'проксимальный межфаланговый сустав'),
  diz: u('tizza boʻgʻimi', 'тизза бўғими', 'коленный сустав'),
}
const HOLATI: Readonly<Record<string, Uc>> = { h: u('Ogʻriqli', 'Оғриқли', 'Болезненный'), s: u('Shishgan', 'Шишган', 'Припухший') }
const EKLEMLER = ['sag_omuz', 'sol_omuz', 'sag_dirsek', 'sol_dirsek', 'sag_el_bilegi', 'sol_el_bilegi', ...['sag', 'sol'].flatMap((y) => [1, 2, 3, 4, 5].map((n) => `${y}_mcp${n}`)), ...['sag', 'sol'].flatMap((y) => [1, 2, 3, 4, 5].map((n) => `${y}_pip${n}`)), 'sag_diz', 'sol_diz']
function eklemAlanlari(): Record<string, Uc> {
  const cikti: Record<string, Uc> = {}
  for (const [on, holat] of Object.entries(HOLATI)) for (const e of EKLEMLER) {
    const [, yan, ad, no] = /^(sag|sol)_([a-z_]+?)(\d?)$/.exec(e)!
    const ek = no ? ` ${no}` : ''
    cikti[`${on}_${e}`] = u(`${holat['uz-Latn']}: ${TOMON[yan]['uz-Latn']} ${BOGIM[ad]['uz-Latn']}${ek}`, `${holat['uz-Cyrl']}: ${TOMON[yan]['uz-Cyrl']} ${BOGIM[ad]['uz-Cyrl']}${ek}`, `${holat.ru}: ${TOMON[yan].ru} ${BOGIM[ad].ru}${ek}`)
  }
  return cikti
}

export const UZ_ROL_ARACLARI_5: readonly PaketAraci[] = [
  // ── nephrology. Not for internal medicine (its own KDIGO tool, with referral flags) and not for urology. ──
  {
    anahtar: 'kdigo-serit', roller: ['nefroloji'],
    metin: {
      ad: u('KDIGO jadvali: KFT va albuminuriya', 'KDIGO жадвали: КФТ ва альбуминурия', 'Таблица KDIGO: СКФ и альбуминурия'),
      aciklama: u('KFT toifasi (G1–G5), albuminuriya toifasi (A1–A3) va xavf katagi. Davolash rejasi va kuzatuv muddati yozilmaydi.', 'КФТ тоифаси (G1–G5), альбуминурия тоифаси (A1–A3) ва хавф катаги. Даволаш режаси ва кузатув муддати ёзилмайди.', 'Категория СКФ (G1–G5), категория альбуминурии (A1–A3) и ячейка риска. План лечения и сроки наблюдения не указываются.'),
      alanlar: { egfr: u('Hisoblangan KFT', 'Ҳисобланган КФТ', 'Расчётная СКФ'), uacr: u('Siydikda albumin va kreatinin nisbati (ixtiyoriy)', 'Сийдикда альбумин ва креатинин нисбати (ихтиёрий)', 'Отношение альбумина к креатинину в моче (необязательно)') },
      bantlar: KDIGO.bantlar,
      uyarilar: KDIGO_TOIFALARI,
      not: KARAR,
    },
  },
  {
    anahtar: 'diyaliz-seans', roller: ['nefroloji'],
    metin: {
      ad: u('Dializ seansi va keyingi sana', 'Диализ сеанси ва кейинги сана', 'Сеанс диализа и следующая дата'),
      aciklama: u('Dializ turi, seans sanasi va keyingi seans yoki nazorat sanasi. Apparat koʻrsatkichlari yozilmaydi.', 'Диализ тури, сеанс санаси ва кейинги сеанс ёки назорат санаси. Аппарат кўрсаткичлари ёзилмайди.', 'Вид диализа, дата сеанса и дата следующего сеанса или контроля. Параметры аппарата не указываются.'),
      alanlar: { modalite: u('Dializ turi', 'Диализ тури', 'Вид диализа'), tarih: u('Seans sanasi', 'Сеанс санаси', 'Дата сеанса'), sonraki_seans: u('Keyingi seans yoki nazorat sanasi (ixtiyoriy)', 'Кейинги сеанс ёки назорат санаси (ихтиёрий)', 'Дата следующего сеанса или контроля (необязательно)') },
      secenekler: { modalite: { hd: u('Gemodializ', 'Гемодиализ', 'Гемодиализ'), pd: u('Peritoneal dializ', 'Перитонеал диализ', 'Перитонеальный диализ'), hdf: u('Gemodiafiltratsiya', 'Гемодиафильтрация', 'Гемодиафильтрация'), diger: u('Boshqa', 'Бошқа', 'Другое') } },
      tarihler: { tarih: u('Seans sanasi', 'Сеанс санаси', 'Дата сеанса'), sonraki_seans: u('Keyingi seans yoki nazorat', 'Кейинги сеанс ёки назорат', 'Следующий сеанс или контроль') },
      not: DOZASIZ,
    },
  },

  // ── oncology. Not for internal medicine or general surgery. ──
  {
    anahtar: 'kur-sayaci', roller: ['onkoloji'],
    metin: {
      ad: u('Davolash kurslari hisobi', 'Даволаш курслари ҳисоби', 'Счёт курсов лечения'),
      aciklama: u('Nechanchi kurs, jami nechta, oxirgi va keyingi kurs sanasi. Sxema, dori va doza yozilmaydi.', 'Нечанчи курс, жами нечта, охирги ва кейинги курс санаси. Схема, дори ва доза ёзилмайди.', 'Какой курс по счёту, сколько всего, даты последнего и следующего курса. Схема, препараты и дозы не указываются.'),
      alanlar: {
        protokol: u('Sxema nomi, qisqacha (ixtiyoriy)', 'Схема номи, қисқача (ихтиёрий)', 'Краткое название схемы (необязательно)'),
        mevcut_kur: u('Hozirgi kurs raqami', 'Ҳозирги курс рақами', 'Номер текущего курса'),
        toplam_kur: u('Jami kurslar soni (ixtiyoriy)', 'Жами курслар сони (ихтиёрий)', 'Всего курсов (необязательно)'),
        son_kur: u('Oxirgi kurs sanasi (ixtiyoriy)', 'Охирги курс санаси (ихтиёрий)', 'Дата последнего курса (необязательно)'),
        sonraki_kur: u('Keyingi kurs sanasi (ixtiyoriy)', 'Кейинги курс санаси (ихтиёрий)', 'Дата следующего курса (необязательно)'),
      },
      sayilar: { kur: u('Kurs', 'Курс', 'Курс') },
      tarihler: { son_kur: u('Oxirgi kurs', 'Охирги курс', 'Последний курс'), sonraki_kur: u('Keyingi kurs', 'Кейинги курс', 'Следующий курс') },
      not: DOZASIZ,
    },
  },
  {
    anahtar: 'toksisite-listesi', roller: ['onkoloji'],
    metin: {
      ad: u('Nojoʻya taʼsirlar nazorat roʻyxati', 'Ножўя таъсирлар назорат рўйхати', 'Контрольный список побочных эффектов'),
      aciklama: u('Davolash vaqtida kuzatilayotgan nojoʻya taʼsirlar belgilanadi. Daraja va dozani oʻzgartirish yozilmaydi.', 'Даволаш вақтида кузатилаётган ножўя таъсирлар белгиланади. Даража ва дозани ўзгартириш ёзилмайди.', 'Отмечаются побочные эффекты, наблюдаемые во время лечения. Степень и изменение дозы не указываются.'),
      alanlar: {
        bulanti_kusma: u('Koʻngil aynishi yoki qusish', 'Кўнгил айниши ёки қусиш', 'Тошнота или рвота'),
        ishal: u('Ich ketishi', 'Ич кетиши', 'Диарея'),
        mukozit: u('Mukozit yoki ogʻiz yarasi', 'Мукозит ёки оғиз яраси', 'Мукозит или язвы во рту'),
        notropeni_risk: u('Neytropeniya xavfi, haroratni kuzatish', 'Нейтропения хавфи, ҳароратни кузатиш', 'Риск нейтропении, наблюдение за температурой'),
        anemi_halsizlik: u('Holsizlik, anemiyani kuzatish', 'Ҳолсизлик, анемияни кузатиш', 'Слабость, наблюдение за анемией'),
        noropati: u('Neyropatiya belgilari', 'Нейропатия белгилари', 'Признаки нейропатии'),
        deri_reaksiyon: u('Teri reaksiyasi', 'Тери реакцияси', 'Кожная реакция'),
        kardiyak_belirti: u('Yurak tomonidan belgilar (shifokor baholaydi)', 'Юрак томонидан белгилар (шифокор баҳолайди)', 'Симптомы со стороны сердца (оценивает врач)'),
        bobrek_lab: u('Buyrak va laboratoriya nazorati rejasi', 'Буйрак ва лаборатория назорати режаси', 'План контроля почек и лабораторных показателей'),
        infeksiyon: u('Infeksiya belgisi', 'Инфекция белгиси', 'Признак инфекции'),
      },
      sayilar: { isaretli: u('Belgilangan nojoʻya taʼsirlar', 'Белгиланган ножўя таъсирлар', 'Отмечено побочных эффектов') },
      not: DOZASIZ,
    },
  },

  // ── orthopaedics. Not for physical medicine or sports medicine: each has tools of its own. ──
  {
    anahtar: 'kirik-alci-takip', roller: ['ortopedi'],
    metin: {
      ad: u('Sinish, gips va ortez kuzatuvi', 'Синиш, гипс ва ортез кузатуви', 'Наблюдение за переломом, гипсом и ортезом'),
      aciklama: u('Nima kuzatilayotgani, sohasi, qon aylanishi va innervatsiya holati, gipsni olish va yuklama berish sanalari. Tashxis yozilmaydi.', 'Нима кузатилаётгани, соҳаси, қон айланиши ва иннервация ҳолати, гипсни олиш ва юклама бериш саналари. Ташхис ёзилмайди.', 'Что наблюдается, область, состояние кровообращения и иннервации, даты снятия гипса и начала нагрузки. Диагноз не указывается.'),
      alanlar: {
        tip: u('Nima kuzatiladi', 'Нима кузатилади', 'Что наблюдается'), bolge: u('Soha (ixtiyoriy)', 'Соҳа (ихтиёрий)', 'Область (необязательно)'), taraf: u('Tomon (ixtiyoriy)', 'Томон (ихтиёрий)', 'Сторона (необязательно)'),
        nv: u('Qon aylanishi va innervatsiya (ixtiyoriy)', 'Қон айланиши ва иннервация (ихтиёрий)', 'Кровообращение и иннервация (необязательно)'),
        baslangic: u('Boshlanish yoki muolaja sanasi (ixtiyoriy)', 'Бошланиш ёки муолажа санаси (ихтиёрий)', 'Дата начала или процедуры (необязательно)'),
        alci_alma: u('Gips yoki ortezni olish sanasi (ixtiyoriy)', 'Гипс ёки ортезни олиш санаси (ихтиёрий)', 'Дата снятия гипса или ортеза (необязательно)'),
        yuk_verme: u('Yuklama berishni boshlash sanasi (ixtiyoriy)', 'Юклама беришни бошлаш санаси (ихтиёрий)', 'Дата начала нагрузки (необязательно)'),
        goruntu_hazir: u('Tasviriy tekshiruv bor, shifokor koʻradi', 'Тасвирий текширув бор, шифокор кўради', 'Есть визуализация, её смотрит врач'),
      },
      secenekler: {
        tip: { kirik: u('Sinish', 'Синиш', 'Перелом'), alci: u('Gips', 'Гипс', 'Гипс'), ortez: u('Ortez', 'Ортез', 'Ортез'), op_sonrasi: u('Operatsiyadan keyingi davr', 'Операциядан кейинги давр', 'Послеоперационный период') },
        bolge: { omuz: u('Yelka va yelka suyagi', 'Елка ва елка суяги', 'Плечевой сустав и плечо'), dirsek: u('Tirsak va bilak', 'Тирсак ва билак', 'Локоть и предплечье'), el: u('Bilak-kaft boʻgʻimi va kaft', 'Билак-кафт бўғими ва кафт', 'Лучезапястный сустав и кисть'), kalca: u('Son boʻgʻimi va tos', 'Сон бўғими ва тос', 'Тазобедренный сустав и таз'), diz: u('Tizza va boldir', 'Тизза ва болдир', 'Колено и голень'), ayak: u('Toʻpiq va oyoq panjasi', 'Тўпиқ ва оёқ панжаси', 'Голеностоп и стопа'), omurga: u('Umurtqa pogʻonasi', 'Умуртқа поғонаси', 'Позвоночник'), diger: u('Boshqa', 'Бошқа', 'Другое') },
        taraf: { sag: u('Oʻng', 'Ўнг', 'Правая'), sol: u('Chap', 'Чап', 'Левая'), iki: u('Ikkala tomon', 'Иккала томон', 'Обе стороны'), belirtilmedi: u('Koʻrsatilmagan', 'Кўрсатилмаган', 'Не указана') },
        nv: { tam: u('Saqlangan: sezgi, kuch va puls meʼyorda', 'Сақланган: сезги, куч ва пульс меъёрда', 'Сохранны: чувствительность, сила и пульс в норме'), parestezi: u('Yengil paresteziya — shifokor kuzatmoqda', 'Енгил парестезия — шифокор кузатмоқда', 'Лёгкая парестезия — наблюдает врач'), tehdit: u('Tahdid ostida — shoshilinch baholash', 'Таҳдид остида — шошилинч баҳолаш', 'Под угрозой — неотложная оценка'), degerlendirilmedi: u('Baholanmagan', 'Баҳоланмаган', 'Не оценивались') },
      },
      uyarilar: {
        nv_tehdit: u('Qon aylanishi yoki innervatsiya tahdid ostida: shoshilinch baholash kerak', 'Қон айланиши ёки иннервация таҳдид остида: шошилинч баҳолаш керак', 'Кровообращение или иннервация под угрозой: нужна неотложная оценка'),
        alci_gecti: u('Gips yoki ortezni olish sanasi oʻtib ketgan', 'Гипс ёки ортезни олиш санаси ўтиб кетган', 'Дата снятия гипса или ортеза прошла'),
        yuk_gecti: u('Yuklama berishni boshlash sanasi oʻtib ketgan', 'Юклама беришни бошлаш санаси ўтиб кетган', 'Дата начала нагрузки прошла'),
        goruntu_kontrol: u('Kuzatuv vazifasi: tasviriy tekshiruv boʻyicha nazorat', 'Кузатув вазифаси: тасвирий текширув бўйича назорат', 'Задача для контроля: контроль по результатам визуализации'),
        op_kontrol: u('Kuzatuv vazifasi: operatsiyadan keyingi nazorat', 'Кузатув вазифаси: операциядан кейинги назорат', 'Задача для контроля: послеоперационный контроль'),
      },
      tarihler: { baslangic: u('Boshlanish yoki muolaja', 'Бошланиш ёки муолажа', 'Начало или процедура'), alci_alma: u('Gips yoki ortezni olish', 'Гипс ёки ортезни олиш', 'Снятие гипса или ортеза'), yuk_verme: u('Yuklama berishni boshlash', 'Юклама беришни бошлаш', 'Начало нагрузки') },
      not: KARAR,
    },
  },
  {
    anahtar: 'ortopedi-op-protokol', roller: ['ortopedi'],
    metin: {
      ad: u('Operatsiyadan keyingi nazorat roʻyxati', 'Операциядан кейинги назорат рўйхати', 'Послеоперационный контрольный список'),
      aciklama: u('Ortopedik operatsiyadan keyin koʻrib chiqiladigan olti band.', 'Ортопедик операциядан кейин кўриб чиқиладиган олти банд.', 'Шесть пунктов, которые проверяются после ортопедической операции.'),
      alanlar: {
        islem_kaydi: u('Operatsiya sanasi va tomoni qayd qilindi', 'Операция санаси ва томони қайд қилинди', 'Дата и сторона операции зафиксированы'),
        dikis_kontrol: u('Chok va jarohatni tekshirish sanasi belgilandi', 'Чок ва жароҳатни текшириш санаси белгиланди', 'Назначена дата осмотра швов и раны'),
        yuk_kisit: u('Yuklama va harakat cheklovlari tushuntirildi', 'Юклама ва ҳаракат чекловлари тушунтирилди', 'Объяснены ограничения нагрузки и движений'),
        goruntu_kontrol: u('Nazorat tasviriy tekshiruvi (kerak boʻlsa) rejalashtirildi', 'Назорат тасвирий текшируви (керак бўлса) режалаштирилди', 'Запланирована контрольная визуализация (если нужна)'),
        ftr_sevk: u('Reabilitatsiyaga yoʻllash boʻyicha qarorni shifokor qabul qiladi', 'Реабилитацияга йўллаш бўйича қарорни шифокор қабул қилади', 'Решение о направлении на реабилитацию принимает врач'),
        kirmizi_bayrak: u('Xavfli belgilar (shish kuchayishi, harorat, sezgi yoʻqolishi) bemorga tushuntirildi', 'Хавфли белгилар (шиш кучайиши, ҳарорат, сезги йўқолиши) беморга тушунтирилди', 'Пациенту объяснены тревожные признаки (нарастание отёка, температура, потеря чувствительности)'),
        islem_tarihi: u('Operatsiya sanasi (ixtiyoriy)', 'Операция санаси (ихтиёрий)', 'Дата операции (необязательно)'),
      },
      sayilar: { isaretli: BELGILANGAN_BANDLAR },
      tarihler: { islem_tarihi: u('Operatsiya sanasi', 'Операция санаси', 'Дата операции') },
      not: DOZASIZ,
    },
  },
  {
    anahtar: 'vas-fonksiyon', roller: ['ortopedi'],
    metin: {
      ad: u('Ogʻriq va funksiya bali', 'Оғриқ ва функция бали', 'Оценка боли и функции'),
      aciklama: u('Ogʻriq 0 dan 10 gacha va toʻrtta funksiya bandi 0 dan 4 gacha (0 — qiyinchiliksiz, 4 — bajara olmaydi). Daraja — vositaning oʻz umumlashtirilgan koʻrsatkichi, nashr etilgan shkala emas.', 'Оғриқ 0 дан 10 гача ва тўртта функция банди 0 дан 4 гача (0 — қийинчиликсиз, 4 — бажара олмайди). Даража — воситанинг ўз умумлаштирилган кўрсаткичи, нашр этилган шкала эмас.', 'Боль от 0 до 10 и четыре пункта функции от 0 до 4 (0 — без затруднений, 4 — не может выполнить). Степень — собственный сводный показатель инструмента, а не опубликованная шкала.'),
      alanlar: {
        vas: u('Ogʻriq, 0 dan 10 gacha', 'Оғриқ, 0 дан 10 гача', 'Боль от 0 до 10'),
        yurume: u('Yurish', 'Юриш', 'Ходьба'), merdiven: u('Zinadan chiqish va tushish', 'Зинадан чиқиш ва тушиш', 'Подъём и спуск по лестнице'), gunluk: u('Kundalik ishlar (kiyinish, yuvinish)', 'Кундалик ишлар (кийиниш, ювиниш)', 'Повседневные дела (одевание, мытьё)'), uyku: u('Ogʻriq sababli uyqu buzilishi', 'Оғриқ сабабли уйқу бузилиши', 'Нарушение сна из-за боли'),
      },
      sayilar: { vas: u('Ogʻriq', 'Оғриқ', 'Боль'), fonksiyon: u('Funksiya', 'Функция', 'Функция') },
      bantlar: { hafif: u('Yengil darajadagi ogʻriq va funksiya cheklanishi', 'Енгил даражадаги оғриқ ва функция чекланиши', 'Лёгкая степень боли и ограничения функции'), orta: u('Oʻrtacha darajadagi ogʻriq va funksiya cheklanishi', 'Ўртача даражадаги оғриқ ва функция чекланиши', 'Средняя степень боли и ограничения функции'), siddetli: u('Ogʻir darajadagi ogʻriq va funksiya cheklanishi', 'Оғир даражадаги оғриқ ва функция чекланиши', 'Тяжёлая степень боли и ограничения функции') },
      not: KARAR,
    },
  },

  // ── paediatrics. Child tools: never for cardiology, internal medicine or any adult role (the standing rule). ──
  {
    anahtar: 'hedef-boy', roller: ['pediatri'],
    metin: {
      ad: u('Ota-ona boʻyiga koʻra kutilayotgan boʻy', 'Ота-она бўйига кўра кутилаётган бўй', 'Ожидаемый рост по росту родителей'),
      aciklama: u('Ota va ona boʻyidan bolaning taxminiy yakuniy boʻyi va uning oraligʻi hisoblanadi. Bu taxmin, kafolat emas.', 'Ота ва она бўйидан боланинг тахминий якуний бўйи ва унинг оралиғи ҳисобланади. Бу тахмин, кафолат эмас.', 'По росту отца и матери рассчитывается ориентировочный конечный рост ребёнка и его диапазон. Это оценка, а не гарантия.'),
      alanlar: { cinsiyet: u('Bolaning jinsi', 'Боланинг жинси', 'Пол ребёнка'), anne: u('Onaning boʻyi', 'Онанинг бўйи', 'Рост матери'), baba: u('Otaning boʻyi', 'Отанинг бўйи', 'Рост отца') },
      secenekler: { cinsiyet: { kiz: u('Qiz', 'Қиз', 'Девочка'), erkek: u('Oʻgʻil', 'Ўғил', 'Мальчик') } },
      sayilar: { hedef: u('Kutilayotgan boʻy', 'Кутилаётган бўй', 'Ожидаемый рост'), alt: u('Oraliqning quyi chegarasi', 'Оралиқнинг қуйи чегараси', 'Нижняя граница диапазона'), ust: u('Oraliqning yuqori chegarasi', 'Оралиқнинг юқори чегараси', 'Верхняя граница диапазона') },
      not: u('Hisob taxminiy; boʻyni baholash va tashxis shifokorniki.', 'Ҳисоб тахминий; бўйни баҳолаш ва ташхис шифокорники.', 'Расчёт ориентировочный; оценку роста и диагноз определяет врач.'),
    },
  },
  {
    anahtar: 'doz-hesabi', roller: ['pediatri'],
    metin: {
      ad: u('Doza hisobi: vazn boʻyicha', 'Доза ҳисоби: вазн бўйича', 'Расчёт дозы по массе тела'),
      aciklama: u('SIZ kiritgan sonlar boʻyicha hisob: vazn, bir kilogrammga milligramm, kuniga necha marta; konsentratsiya kiritilsa — bir martalik hajm. Vosita hech qanday dori, tavsiya etilgan doza yoki chegara bilmaydi.', 'СИЗ киритган сонлар бўйича ҳисоб: вазн, бир килограммга миллиграмм, кунига неча марта; концентрация киритилса — бир марталик ҳажм. Восита ҳеч қандай дори, тавсия этилган доза ёки чегара билмайди.', 'Расчёт по числам, которые ввели ВЫ: масса тела, миллиграммы на килограмм, число приёмов в сутки; если указана концентрация — объём на приём. Инструмент не знает ни препаратов, ни рекомендуемых доз, ни пределов.'),
      alanlar: {
        kilo: u('Vazn', 'Вазн', 'Масса тела'), mg_kg: u('Doza, bir kilogrammga', 'Доза, бир килограммга', 'Доза на килограмм'), mod: u('Kiritilgan doza', 'Киритилган доза', 'Введённая доза относится'), doz_sayisi: u('Kuniga necha marta', 'Кунига неча марта', 'Число приёмов в сутки'),
        kons_mg: u('Konsentratsiya: milligramm (ixtiyoriy)', 'Концентрация: миллиграмм (ихтиёрий)', 'Концентрация: миллиграммы (необязательно)'), kons_ml: u('Konsentratsiya: millilitr (ixtiyoriy)', 'Концентрация: миллилитр (ихтиёрий)', 'Концентрация: миллилитры (необязательно)'),
        tavan_doz_mg: u('Siz belgilagan bir martalik chegara (ixtiyoriy)', 'Сиз белгилаган бир марталик чегара (ихтиёрий)', 'Заданный вами предел на один приём (необязательно)'), tavan_gun_mg: u('Siz belgilagan kunlik chegara (ixtiyoriy)', 'Сиз белгилаган кунлик чегара (ихтиёрий)', 'Заданный вами суточный предел (необязательно)'),
      },
      secenekler: { mod: { gun: u('Kunlik doza', 'Кунлик доза', 'К суткам'), doz: u('Bir martalik doza', 'Бир марталик доза', 'К одному приёму') } },
      sayilar: {
        doz_mg: u('Bir martalik doza', 'Бир марталик доза', 'Доза на приём'), gunluk_mg: u('Kunlik doza', 'Кунлик доза', 'Суточная доза'), aralik_saat: u('Qabullar orasidagi vaqt', 'Қабуллар орасидаги вақт', 'Интервал между приёмами'),
        doz_ml: u('Bir martalik hajm', 'Бир марталик ҳажм', 'Объём на приём'), gunluk_ml: u('Kunlik hajm', 'Кунлик ҳажм', 'Суточный объём'),
        tavanli_doz_mg: u('Chegaralangan bir martalik doza', 'Чегараланган бир марталик доза', 'Доза на приём с учётом предела'), tavanli_doz_ml: u('Chegaralangan bir martalik hajm', 'Чегараланган бир марталик ҳажм', 'Объём на приём с учётом предела'),
      },
      uyarilar: {
        tavan_doz: u('Hisoblangan bir martalik doza siz belgilagan chegaradan oshadi', 'Ҳисобланган бир марталик доза сиз белгилаган чегарадан ошади', 'Рассчитанная доза на приём превышает заданный вами предел'),
        tavan_gun: u('Hisoblangan kunlik doza siz belgilagan chegaradan oshadi', 'Ҳисобланган кунлик доза сиз белгилаган чегарадан ошади', 'Рассчитанная суточная доза превышает заданный вами предел'),
        kilo_birim: u('Vazn odatdagidan ancha katta — birligini tekshiring', 'Вазн одатдагидан анча катта — бирлигини текширинг', 'Масса тела необычно велика — проверьте единицу измерения'),
        ml_kucuk: u('Bir martalik hajm oʻlchash qadamidan kichik — aniq oʻlchab boʻlmaydi', 'Бир марталик ҳажм ўлчаш қадамидан кичик — аниқ ўлчаб бўлмайди', 'Объём на приём меньше шага измерения — точно отмерить нельзя'),
      },
      not: u('Hisob siz kiritgan sonlar asosida; dori, doza va chegarani shifokor belgilaydi va tekshiradi.', 'Ҳисоб сиз киритган сонлар асосида; дори, доза ва чегарани шифокор белгилайди ва текширади.', 'Расчёт основан на введённых вами числах; препарат, дозу и предел определяет и проверяет врач.'),
    },
  },

  // ── plastic surgery. Not for the aesthetic clinic roles (a separate registry) and not for general surgery. ──
  {
    anahtar: 'plastik-yara-greft', roller: ['plastik-cerrahi'],
    metin: {
      ad: u('Jarohat, transplantat va laxtak kuzatuvi', 'Жароҳат, трансплантат ва лахтак кузатуви', 'Наблюдение за раной, трансплантатом и лоскутом'),
      aciklama: u('Nima kuzatilayotgani, sohasi, muolaja, bogʻlam va choklarni olish sanalari. Tashxis va dori dozasi yozilmaydi.', 'Нима кузатилаётгани, соҳаси, муолажа, боғлам ва чокларни олиш саналари. Ташхис ва дори дозаси ёзилмайди.', 'Что наблюдается, область, даты процедуры, перевязки и снятия швов. Диагноз и дозы препаратов не указываются.'),
      alanlar: {
        tip: u('Nima kuzatiladi', 'Нима кузатилади', 'Что наблюдается'), bolge: u('Soha', 'Соҳа', 'Область'), taraf: u('Tomon (ixtiyoriy)', 'Томон (ихтиёрий)', 'Сторона (необязательно)'),
        islem: u('Muolaja sanasi (ixtiyoriy)', 'Муолажа санаси (ихтиёрий)', 'Дата процедуры (необязательно)'), pansuman: u('Keyingi bogʻlam sanasi (ixtiyoriy)', 'Кейинги боғлам санаси (ихтиёрий)', 'Дата следующей перевязки (необязательно)'), dikis_alma: u('Choklarni olish sanasi (ixtiyoriy)', 'Чокларни олиш санаси (ихтиёрий)', 'Дата снятия швов (необязательно)'),
      },
      secenekler: { tip: { yara: u('Jarohat parvarishi', 'Жароҳат парвариши', 'Уход за раной'), greft: u('Teri transplantati', 'Тери трансплантати', 'Кожный трансплантат'), flep: u('Laxtak', 'Лахтак', 'Лоскут'), dikis: u('Choklar', 'Чоклар', 'Швы'), pansiyel: u('Bogʻlam', 'Боғлам', 'Перевязка'), diger: u('Boshqa', 'Бошқа', 'Другое') } },
      tarihler: { islem: u('Muolaja', 'Муолажа', 'Процедура'), pansuman: u('Keyingi bogʻlam', 'Кейинги боғлам', 'Следующая перевязка'), dikis_alma: u('Choklarni olish', 'Чокларни олиш', 'Снятие швов') },
      not: DOZASIZ,
    },
  },

  // ── radiology. Not for any clinical role: the radiologist's own worklist and report. ──
  {
    anahtar: 'tetkik-kuyrugu', roller: ['radyoloji'],
    metin: {
      ad: u('Tekshiruvlar navbati', 'Текширувлар навбати', 'Очередь исследований'),
      aciklama: u('Bitta tekshiruv: usuli, ustuvorligi va holati. Keyingi qadam holatdan kelib chiqadi. Topilma va tashxis yozilmaydi.', 'Битта текширув: усули, устуворлиги ва ҳолати. Кейинги қадам ҳолатдан келиб чиқади. Топилма ва ташхис ёзилмайди.', 'Одно исследование: метод, приоритет и состояние. Следующий шаг вытекает из состояния. Находки и диагноз не указываются.'),
      alanlar: { modalite: u('Tekshiruv usuli', 'Текширув усули', 'Метод исследования'), oncelik: u('Ustuvorlik', 'Устуворлик', 'Приоритет'), durum: u('Holati', 'Ҳолати', 'Состояние'), tarih: u('Sana (ixtiyoriy)', 'Сана (ихтиёрий)', 'Дата (необязательно)') },
      secenekler: {
        modalite: { xray: u('Rentgenografiya', 'Рентгенография', 'Рентгенография'), us: u('Ultratovush tekshiruvi', 'Ультратовуш текшируви', 'Ультразвуковое исследование'), bt: u('Kompyuter tomografiyasi', 'Компьютер томографияси', 'Компьютерная томография'), mri: u('Magnit-rezonans tomografiya', 'Магнит-резонанс томография', 'Магнитно-резонансная томография'), mamografi: u('Mammografiya', 'Маммография', 'Маммография'), pet: u('Pozitron-emission tomografiya', 'Позитрон-эмиссион томография', 'Позитронно-эмиссионная томография'), diger: u('Boshqa', 'Бошқа', 'Другое') },
        oncelik: { acil: u('Shoshilinch', 'Шошилинч', 'Экстренно'), ayni_gun: u('Shu kuni', 'Шу куни', 'В тот же день'), rutin: u('Rejali', 'Режали', 'Планово'), kontrol: u('Nazorat', 'Назорат', 'Контрольное') },
        durum: { bekliyor: u('Kutmoqda', 'Кутмоқда', 'Ожидает'), cekildi: u('Bajarildi', 'Бажарилди', 'Выполнено'), rapor_hazir: u('Xulosa tayyor', 'Хулоса тайёр', 'Заключение готово'), arsiv: u('Arxivda', 'Архивда', 'В архиве') },
      },
      uyarilar: {
        kuyrukta: u('Keyingi qadam: tekshiruvni bajarish', 'Кейинги қадам: текширувни бажариш', 'Следующий шаг: выполнить исследование'),
        rapor_bekliyor: u('Keyingi qadam: xulosa yozish', 'Кейинги қадам: хулоса ёзиш', 'Следующий шаг: написать заключение'),
        rapor_klinisyen: u('Keyingi qadam: xulosa yoʻllagan shifokorga yetganini tekshirish', 'Кейинги қадам: хулоса йўллаган шифокорга етганини текшириш', 'Следующий шаг: убедиться, что заключение дошло до направившего врача'),
      },
      tarihler: { tarih: u('Sana', 'Сана', 'Дата') },
      not: KARAR,
    },
  },
  {
    anahtar: 'rapor-taslagi', roller: ['radyoloji'],
    metin: {
      ad: u('Tuzilgan xulosa qoralamasi', 'Тузилган хулоса қораламаси', 'Черновик структурированного заключения'),
      aciklama: u('Siz tanlagan baholash toifasi va xulosada boʻladigan boʻlimlar. Vosita topilma yozmaydi va toifani tanlamaydi.', 'Сиз танлаган баҳолаш тоифаси ва хулосада бўладиган бўлимлар. Восита топилма ёзмайди ва тоифани танламайди.', 'Выбранная вами категория оценки и разделы, которые будут в заключении. Инструмент не пишет находок и не выбирает категорию.'),
      alanlar: {
        kategori: u('Baholash toifasi', 'Баҳолаш тоифаси', 'Категория оценки'),
        endikasyon: u('Koʻrsatma va klinik savol', 'Кўрсатма ва клиник савол', 'Показание и клинический вопрос'),
        teknik: u('Texnika va protokol', 'Техника ва протокол', 'Техника и протокол'),
        bulgular_yapilandirilmis: u('Tuzilgan topilmalar (shifokor yozadi)', 'Тузилган топилмалар (шифокор ёзади)', 'Структурированные находки (пишет врач)'),
        karsilastirma: u('Oldingi tekshiruv bilan taqqoslash', 'Олдинги текширув билан таққослаш', 'Сравнение с предыдущим исследованием'),
        sonuc_ozet: u('Xulosa', 'Хулоса', 'Заключение'),
        onerilen_izlem: u('Tavsiya etilgan kuzatuv yoki qoʻshimcha tekshiruv', 'Тавсия этилган кузатув ёки қўшимча текширув', 'Рекомендуемое наблюдение или дополнительное исследование'),
        klinisyen_bildirim: u('Yoʻllagan shifokorga xabar berish kerak', 'Йўллаган шифокорга хабар бериш керак', 'Нужно сообщить направившему врачу'),
      },
      secenekler: { kategori: { ...Object.fromEntries(['0', '1', '2', '3', '4', '5', '6'].map((k) => [k, ayni(`BI-RADS ${k}`)])), genel: u('Umumiy xulosa (toifasiz)', 'Умумий хулоса (тоифасиз)', 'Общее заключение (без категории)') } },
      sayilar: { isaretli: u('Belgilangan boʻlimlar', 'Белгиланган бўлимлар', 'Отмечено разделов') },
      bantlar: { ...Object.fromEntries(['0', '1', '2', '3', '4', '5', '6'].map((k) => [k, ayni(`BI-RADS ${k}`)])), genel: u('Umumiy xulosa (toifasiz)', 'Умумий хулоса (тоифасиз)', 'Общее заключение (без категории)') },
      uyarilar: {
        rapor_izlem: u('Kuzatuv vazifasi: tavsiya etilgan kuzatuv yoki qoʻshimcha tekshiruv', 'Кузатув вазифаси: тавсия этилган кузатув ёки қўшимча текширув', 'Задача для контроля: рекомендуемое наблюдение или дополнительное исследование'),
        klinisyen_bildirim: u('Kuzatuv vazifasi: yoʻllagan shifokorga xabar berilganini tekshirish', 'Кузатув вазифаси: йўллаган шифокорга хабар берилганини текшириш', 'Задача для контроля: убедиться, что направивший врач оповещён'),
      },
      not: KARAR,
    },
  },

  // ── rheumatology. Not for orthopaedics or physical medicine. ──
  {
    anahtar: 'das28', roller: ['romatoloji'],
    metin: {
      ad: u('DAS28 kasallik faolligi indeksi', 'DAS28 касаллик фаоллиги индекси', 'Индекс активности DAS28'),
      aciklama: u('28 boʻgʻimdan ogʻriqli va shishganlari soni, bemorning umumiy bahosi (0 dan 100 gacha) hamda yalligʻlanish koʻrsatkichi boʻyicha hisob.', '28 бўғимдан оғриқли ва шишганлари сони, беморнинг умумий баҳоси (0 дан 100 гача) ҳамда яллиғланиш кўрсаткичи бўйича ҳисоб.', 'Расчёт по числу болезненных и припухших суставов из 28, общей оценке пациента (от 0 до 100) и показателю воспаления.'),
      alanlar: {
        varyant: u('Hisob turi', 'Ҳисоб тури', 'Вариант расчёта'), tjc: u('Ogʻriqli boʻgʻimlar soni (0–28)', 'Оғриқли бўғимлар сони (0–28)', 'Число болезненных суставов (0–28)'), sjc: u('Shishgan boʻgʻimlar soni (0–28)', 'Шишган бўғимлар сони (0–28)', 'Число припухших суставов (0–28)'),
        pga: u('Bemorning umumiy bahosi', 'Беморнинг умумий баҳоси', 'Общая оценка пациентом'), crp: u('C-reaktiv oqsil', 'С-реактив оқсил', 'С-реактивный белок'), esr: u('Eritrotsitlar choʻkish tezligi', 'Эритроцитлар чўкиш тезлиги', 'Скорость оседания эритроцитов'),
      },
      secenekler: { varyant: { crp: u('C-reaktiv oqsil bilan', 'С-реактив оқсил билан', 'С С-реактивным белком'), esr: u('Eritrotsitlar choʻkish tezligi bilan', 'Эритроцитлар чўкиш тезлиги билан', 'Со скоростью оседания эритроцитов') } },
      sayilar: { das28: ayni('DAS28') },
      bantlar: { remisyon: u('Remissiya (2,6 dan past)', 'Ремиссия (2,6 дан паст)', 'Ремиссия (менее 2,6)'), dusuk: u('Past faollik (2,6–3,19)', 'Паст фаоллик (2,6–3,19)', 'Низкая активность (2,6–3,19)'), orta: u('Oʻrtacha faollik (3,2–5,1)', 'Ўртача фаоллик (3,2–5,1)', 'Умеренная активность (3,2–5,1)'), yuksek: u('Yuqori faollik (5,1 dan yuqori)', 'Юқори фаоллик (5,1 дан юқори)', 'Высокая активность (более 5,1)') },
      not: KARAR,
    },
  },
  {
    anahtar: 'eklem-28', roller: ['romatoloji'],
    metin: {
      ad: u('28 boʻgʻim hisobi', '28 бўғим ҳисоби', 'Счёт 28 суставов'),
      aciklama: u('Ogʻriqli va shishgan boʻgʻimlar belgilanadi; ikkala son DAS28 hisobida ishlatiladi. Avval koʻrik oʻtkazilganini belgilang.', 'Оғриқли ва шишган бўғимлар белгиланади; иккала сон DAS28 ҳисобида ишлатилади. Аввал кўрик ўтказилганини белгиланг.', 'Отмечаются болезненные и припухшие суставы; оба числа используются в расчёте DAS28. Сначала отметьте, что осмотр проведён.'),
      alanlar: { degerlendirildi: u('28 boʻgʻim koʻrikdan oʻtkazildi', '28 бўғим кўрикдан ўтказилди', '28 суставов осмотрены'), ...eklemAlanlari() },
      sayilar: { tjc: u('Ogʻriqli boʻgʻimlar', 'Оғриқли бўғимлар', 'Болезненных суставов'), sjc: u('Shishgan boʻgʻimlar', 'Шишган бўғимлар', 'Припухших суставов') },
      not: KARAR,
    },
  },

  // ── urology. Not for nephrology or oncology. ──
  {
    anahtar: 'psa-hizi', roller: ['uroloji'],
    metin: {
      ad: u('Prostata spetsifik antigeni: oʻzgarish tezligi', 'Простата специфик антигени: ўзгариш тезлиги', 'Простатспецифический антиген: скорость изменения'),
      aciklama: u('Ikki oʻlchov va ularning sanalaridan bir yildagi oʻzgarish hisoblanadi. Chegara qiymatlar va daraja koʻrsatilmaydi.', 'Икки ўлчов ва уларнинг саналаридан бир йилдаги ўзгариш ҳисобланади. Чегара қийматлар ва даража кўрсатилмайди.', 'По двум измерениям и их датам рассчитывается изменение за год. Пороговые значения и степень не показываются.'),
      alanlar: { onceki_deger: u('Oldingi qiymat', 'Олдинги қиймат', 'Прежнее значение'), onceki_tarih: u('Oldingi oʻlchov sanasi', 'Олдинги ўлчов санаси', 'Дата прежнего измерения'), son_deger: u('Oxirgi qiymat', 'Охирги қиймат', 'Последнее значение'), son_tarih: u('Oxirgi oʻlchov sanasi', 'Охирги ўлчов санаси', 'Дата последнего измерения') },
      sayilar: { hiz: u('Bir yildagi oʻzgarish', 'Бир йилдаги ўзгариш', 'Изменение за год'), gun: u('Oʻlchovlar orasidagi vaqt', 'Ўлчовлар орасидаги вақт', 'Время между измерениями') },
      uyarilar: { kisa_aralik: u('Oʻlchovlar orasi 90 kundan kam: natijani ehtiyotkorlik bilan baholang', 'Ўлчовлар ораси 90 кундан кам: натижани эҳтиёткорлик билан баҳоланг', 'Между измерениями менее 90 дней: оценивайте результат с осторожностью') },
      not: KARAR,
    },
  },

  // ── sports medicine. Not for orthopaedics or physical medicine. ──
  {
    anahtar: 'rtp-basamak', roller: ['spor-hekimligi'],
    metin: {
      ad: u('Sportga qaytish bosqichlari', 'Спортга қайтиш босқичлари', 'Этапы возвращения в спорт'),
      aciklama: u('Sportchi hozir qaysi bosqichda ekani qayd qilinadi. Bosqichni shifokor belgilaydi; vosita muddat taklif qilmaydi.', 'Спортчи ҳозир қайси босқичда экани қайд қилинади. Босқични шифокор белгилайди; восита муддат таклиф қилмайди.', 'Фиксируется, на каком этапе сейчас спортсмен. Этап определяет врач; сроков инструмент не предлагает.'),
      alanlar: { basamak: u('Bosqich', 'Босқич', 'Этап') },
      secenekler: { basamak: kendiAdi(['0', '1', '2', '3', '4', '5']) },
      bantlar: {
        b0: u('0-bosqich: dam olish va simptomlarni nazorat qilish', '0-босқич: дам олиш ва симптомларни назорат қилиш', 'Этап 0: покой и контроль симптомов'),
        b1: u('1-bosqich: yengil aerob yuklama', '1-босқич: енгил аэроб юклама', 'Этап 1: лёгкая аэробная нагрузка'),
        b2: u('2-bosqich: sport turiga xos mashqlar, toʻqnashuvsiz', '2-босқич: спорт турига хос машқлар, тўқнашувсиз', 'Этап 2: упражнения, специфичные для вида спорта, без контакта'),
        b3: u('3-bosqich: toʻqnashuvsiz mashgʻulot', '3-босқич: тўқнашувсиз машғулот', 'Этап 3: тренировка без контакта'),
        b4: u('4-bosqich: toʻqnashuvli mashgʻulot, musobaqasiz', '4-босқич: тўқнашувли машғулот, мусобақасиз', 'Этап 4: контактная тренировка, без соревнований'),
        b5: u('5-bosqich: toʻliq mashgʻulot va musobaqaga yaroqlilik', '5-босқич: тўлиқ машғулот ва мусобақага яроқлилик', 'Этап 5: полноценная тренировка и допуск к соревнованиям'),
      },
      not: u('Bosqich va sportga qaytish qarori shifokorniki.', 'Босқич ва спортга қайтиш қарори шифокорники.', 'Этап и решение о возвращении в спорт определяет врач.'),
    },
  },
  {
    anahtar: 'sakatlik-gunlugu', roller: ['spor-hekimligi'],
    metin: {
      ad: u('Shikastlanishlar kundaligi', 'Шикастланишлар кундалиги', 'Журнал травм'),
      aciklama: u('Shikastlanish sohasi, mexanizmi, ogʻirligi va holati; oxirgi yetti kun va oldingi haftalik oʻrtacha yuklama daqiqalaridan ularning nisbati hisoblanadi.', 'Шикастланиш соҳаси, механизми, оғирлиги ва ҳолати; охирги етти кун ва олдинги ҳафталик ўртача юклама дақиқаларидан уларнинг нисбати ҳисобланади.', 'Область, механизм, тяжесть и состояние травмы; по минутам нагрузки за последние семь дней и прежнему недельному среднему рассчитывается их отношение.'),
      alanlar: {
        bolge: u('Soha', 'Соҳа', 'Область'), mekanizma: u('Mexanizm (ixtiyoriy)', 'Механизм (ихтиёрий)', 'Механизм (необязательно)'), siddet: u('Ogʻirligi (ixtiyoriy)', 'Оғирлиги (ихтиёрий)', 'Тяжесть (необязательно)'), durum: u('Holati (ixtiyoriy)', 'Ҳолати (ихтиёрий)', 'Состояние (необязательно)'),
        dk_7gun: u('Oxirgi 7 kundagi yuklama (ixtiyoriy)', 'Охирги 7 кундаги юклама (ихтиёрий)', 'Нагрузка за последние 7 дней (необязательно)'), dk_onceki: u('Oldingi haftalik oʻrtacha yuklama (ixtiyoriy)', 'Олдинги ҳафталик ўртача юклама (ихтиёрий)', 'Прежняя средняя недельная нагрузка (необязательно)'),
      },
      secenekler: {
        bolge: { diz: u('Tizza', 'Тизза', 'Колено'), ayak_bilegi: u('Toʻpiq', 'Тўпиқ', 'Голеностоп'), kalca: u('Son boʻgʻimi', 'Сон бўғими', 'Тазобедренный сустав'), omuz: u('Yelka', 'Елка', 'Плечо'), dirsek: u('Tirsak', 'Тирсак', 'Локоть'), el_bilegi: u('Bilak-kaft boʻgʻimi', 'Билак-кафт бўғими', 'Лучезапястный сустав'), bel: u('Bel', 'Бел', 'Поясница'), boyun: u('Boʻyin', 'Бўйин', 'Шея'), kas_bacak: u('Oyoq mushaklari', 'Оёқ мушаклари', 'Мышцы ноги'), kas_govde: u('Tana mushaklari', 'Тана мушаклари', 'Мышцы туловища'), kas_ust: u('Qoʻl mushaklari', 'Қўл мушаклари', 'Мышцы руки'), bas_boyun: u('Bosh va boʻyin (miya chayqalishi)', 'Бош ва бўйин (мия чайқалиши)', 'Голова и шея (сотрясение)'), diger: u('Boshqa', 'Бошқа', 'Другое') },
        mekanizma: { temas: u('Toʻqnashuv yoki zarba', 'Тўқнашув ёки зарба', 'Контакт или удар'), temassiz: u('Toʻqnashuvsiz (burilish, keskin toʻxtash)', 'Тўқнашувсиз (бурилиш, кескин тўхташ)', 'Без контакта (поворот, резкая остановка)'), asiri_kullanim: u('Ortiqcha yuklama', 'Ортиқча юклама', 'Перегрузка'), asiri_gerilme: u('Ortiqcha choʻzilish', 'Ортиқча чўзилиш', 'Перерастяжение'), bilinmiyor: u('Nomaʼlum', 'Номаълум', 'Неизвестно') },
        siddet: { hafif: u('Yengil', 'Енгил', 'Лёгкая'), orta: u('Oʻrtacha', 'Ўртача', 'Средняя'), agir: u('Ogʻir', 'Оғир', 'Тяжёлая') },
        durum: { aktif: u('Faol', 'Фаол', 'Активная'), iyilesiyor: u('Tuzalmoqda', 'Тузалмоқда', 'Заживает'), kapandi: u('Tugallangan', 'Тугалланган', 'Завершена') },
      },
      sayilar: { yuklenme_orani: u('Yuklama nisbati', 'Юклама нисбати', 'Отношение нагрузок') },
      uyarilar: { yuklenme_yuksek: u('Yuklama nisbati 1,5 va undan yuqori: yuqori', 'Юклама нисбати 1,5 ва ундан юқори: юқори', 'Отношение нагрузок 1,5 и выше: высокое'), yuklenme_dikkat: u('Yuklama nisbati 1,3 va undan yuqori: ehtiyot boʻling', 'Юклама нисбати 1,3 ва ундан юқори: эҳтиёт бўлинг', 'Отношение нагрузок 1,3 и выше: требуется внимание') },
      not: KARAR,
    },
  },
]
