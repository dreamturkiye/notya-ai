/**
 * NOTYA-ULKE-ARACLAR-01 — Uzbekistan: ROLE TOOLS, fourth part, in the order of the pack's role list:
 * cardiovascular surgery (kalp-damar-cerrahisi), ear, nose and throat (kulak-burun-bogaz).
 *
 * Every tool names the roles that see it. MACHINE-WRITTEN. AWAITS NATIVE REVIEW (see ./index.ts).
 */
import type { PaketAraci } from '@/lib/ulke/araclar/tipler'
import { BELGILANGAN_BANDLAR, DOZASIZ, KARAR, KEYINGI_NAZORAT, KEYINGI_NAZORAT_SANASI, u, vazifa, type Uc } from './yardimci'

const birlestir = (a: Uc, b: Uc, ara = ': '): Uc => u(`${a['uz-Latn']}${ara}${b['uz-Latn']}`, `${a['uz-Cyrl']}${ara}${b['uz-Cyrl']}`, `${a.ru}${ara}${b.ru}`)

// cardiovascular surgery: each item once, as a list entry and as the follow-up it becomes while it is open
const KDC: Readonly<Record<string, readonly [Uc, Uc]>> = {
  goruntu_hazir: [u('Tomir yoki yurak tasviri (angiografiya, doppler, koronarografiya) shifokor koʻrigiga tayyor', 'Томир ёки юрак тасвири (ангиография, допплер, коронарография) шифокор кўригига тайёр', 'Изображения сосудов или сердца (ангиография, допплер, коронарография) готовы для врача'), vazifa('tomir yoki yurak tasviri', 'томир ёки юрак тасвири', 'изображения сосудов или сердца')],
  anestezi_degerlendirme: [u('Anesteziolog koʻrigi rejalashtirildi yoki oʻtkazildi', 'Анестезиолог кўриги режалаштирилди ёки ўтказилди', 'Осмотр анестезиолога запланирован или проведён'), vazifa('anesteziolog koʻrigi', 'анестезиолог кўриги', 'осмотр анестезиолога')],
  kan_lab_hazir: [u('Operatsiyadan oldingi qon tahlillari shifokor koʻrigiga tayyor', 'Операциядан олдинги қон таҳлиллари шифокор кўригига тайёр', 'Предоперационные анализы крови готовы для врача'), vazifa('operatsiyadan oldingi qon tahlillari', 'операциядан олдинги қон таҳлиллари', 'предоперационные анализы крови')],
  eko_raporu_hekim: [u('Exokardiografiya yoki kardiologik baholash xulosasi shifokorda', 'Эхокардиография ёки кардиологик баҳолаш хулосаси шифокорда', 'Заключение эхокардиографии или кардиологической оценки у врача'), vazifa('exokardiografiya xulosasi', 'эхокардиография хулосаси', 'заключение эхокардиографии')],
  antikoag_sorgulandi: [u('Antikoagulyant va antiagregant qabul qilishi soʻraldi (doza yozilmaydi)', 'Антикоагулянт ва антиагрегант қабул қилиши сўралди (доза ёзилмайди)', 'Уточнён приём антикоагулянтов и антиагрегантов (дозы не указываются)'), vazifa('antikoagulyant va antiagregantlar boʻyicha soʻrov', 'антикоагулянт ва антиагрегантлар бўйича сўров', 'уточнение приёма антикоагулянтов и антиагрегантов')],
  onam_konustu: [u('Operatsiyaga rozilik boʻyicha suhbat oʻtkazildi', 'Операцияга розилик бўйича суҳбат ўтказилди', 'Проведена беседа о согласии на операцию'), vazifa('rozilik boʻyicha suhbat', 'розилик бўйича суҳбат', 'беседа о согласии')],
  sigara_sorgulandi: [u('Chekish anamnezi soʻraldi', 'Чекиш анамнези сўралди', 'Анамнез курения собран'), vazifa('chekish anamnezi', 'чекиш анамнези', 'анамнез курения')],
  kardiyak_risk_hekim: [u('Operatsiya davridagi yurak xavfi shifokor tomonidan baholanmoqda', 'Операция давридаги юрак хавфи шифокор томонидан баҳоланмоқда', 'Периоперационный кардиальный риск оценивается врачом'), vazifa('operatsiya davridagi yurak xavfini baholash', 'операция давридаги юрак хавфини баҳолаш', 'оценка периоперационного кардиального риска')],
}

// ear, nose and throat: the two ears and what is seen in each, written once
const QULOQ: Readonly<Record<string, Uc>> = { sag: u('Oʻng quloq', 'Ўнг қулоқ', 'Правое ухо'), sol: u('Chap quloq', 'Чап қулоқ', 'Левое ухо') }
const TASHQI: Readonly<Record<string, Uc>> = {
  normal: u('tashqi eshituv yoʻli ochiq va oʻzgarishsiz', 'ташқи эшитув йўли очиқ ва ўзгаришсиз', 'наружный слуховой проход свободен, без изменений'),
  buson: u('tashqi eshituv yoʻlida oltingugurt tiqini', 'ташқи эшитув йўлида олтингугурт тиқини', 'серная пробка в наружном слуховом проходе'),
  akinti: u('tashqi eshituv yoʻlida ajralma', 'ташқи эшитув йўлида ажралма', 'выделения в наружном слуховом проходе'),
  odem_hassasiyet: u('tashqi eshituv yoʻli shishgan yoki quloq suprasi bosilganda ogʻriydi', 'ташқи эшитув йўли шишган ёки қулоқ супраси босилганда оғрийди', 'отёк наружного слухового прохода или болезненность при надавливании на козелок'),
  yabanci_cisim: u('tashqi eshituv yoʻlida yot jism', 'ташқи эшитув йўлида ёт жисм', 'инородное тело в наружном слуховом проходе'),
}
const PARDA: Readonly<Record<string, Uc>> = {
  sag_gorunum: u('nogʻora parda oʻzgarishsiz, yorugʻlik konusi koʻrinadi', 'ноғора парда ўзгаришсиз, ёруғлик конуси кўринади', 'барабанная перепонка без изменений, световой конус виден'),
  hiperemik: u('nogʻora parda qizargan', 'ноғора парда қизарган', 'барабанная перепонка гиперемирована'),
  matlasmis: u('nogʻora parda xiralashgan', 'ноғора парда хиралашган', 'барабанная перепонка мутная'),
  retrakte: u('nogʻora parda ichkariga tortilgan', 'ноғора парда ичкарига тортилган', 'барабанная перепонка втянута'),
  bombe: u('nogʻora parda boʻrtgan', 'ноғора парда бўртган', 'барабанная перепонка выбухает'),
  perforasyon: u('nogʻora pardada teshik bor', 'ноғора пардада тешик бор', 'перфорация барабанной перепонки'),
  tup_var: u('ventilyatsion naycha bor', 'вентилятсион найча бор', 'установлена вентиляционная трубка'),
  seviye_hava_kabarcigi: u('parda ortida suyuqlik sathi yoki havo pufakchasi', 'парда ортида суюқлик сатҳи ёки ҳаво пуфакчаси', 'за перепонкой уровень жидкости или пузырёк воздуха'),
  degerlendirilemedi: u('nogʻora pardani baholab boʻlmadi', 'ноғора пардани баҳолаб бўлмади', 'барабанную перепонку оценить не удалось'),
}
const QAROR = u('shu koʻrikda qaror talab qiladi', 'шу кўрикда қарор талаб қилади', 'на этом приёме требуется решение')
const otoAlanlari = (): Record<string, Uc> => Object.fromEntries(Object.entries(QULOQ).flatMap(([y, quloq]) => [...Object.entries(TASHQI).map(([k, v]) => [`${y}_dis_${k}`, birlestir(quloq, v)] as const), ...Object.entries(PARDA).map(([k, v]) => [`${y}_zar_${k}`, birlestir(quloq, v)] as const)]))
const otoUyarilari = (): Record<string, Uc> => Object.fromEntries(Object.entries(QULOQ).flatMap(([y, quloq]) => [...['perforasyon', 'bombe', 'retrakte', 'degerlendirilemedi'].map((k) => [`${y}_zar_${k}`, birlestir(birlestir(quloq, PARDA[k]), QAROR, ' — ')] as const), ...['akinti', 'yabanci_cisim', 'odem_hassasiyet'].map((k) => [`${y}_dis_${k}`, birlestir(birlestir(quloq, TASHQI[k]), QAROR, ' — ')] as const)]))

const SINAMA_NATIJASI = { pozitif: u('Musbat', 'Мусбат', 'Положительная'), negatif: u('Manfiy', 'Манфий', 'Отрицательная'), yapilamadi: u('Bajarib boʻlmadi', 'Бажариб бўлмади', 'Выполнить не удалось') }
const HOLAT = { izlemde: u('Kuzatuvda', 'Кузатувда', 'Под наблюдением'), iyilesiyor: u('Bitmoqda', 'Битмоқда', 'Заживает'), dikkat: u('Eʼtibor talab qiladi — shifokor baholaydi', 'Эътибор талаб қилади — шифокор баҳолайди', 'Требует внимания — оценивает врач'), kapandi: u('Bitdi', 'Битди', 'Зажило') }

export const UZ_ROL_ARACLARI_4: readonly PaketAraci[] = [
  // ── cardiovascular surgery. Not for cardiology (no operation there) and not for the other surgical roles. ──
  {
    anahtar: 'kalp-damar-preop', roller: ['kalp-damar-cerrahisi'],
    metin: {
      ad: u('Yurak-qon tomir operatsiyasidan oldingi nazorat roʻyxati', 'Юрак-қон томир операциясидан олдинги назорат рўйхати', 'Контрольный список перед сердечно-сосудистой операцией'),
      aciklama: u('Operatsiyadan oldingi xavfni baholash bandlari. Bajarilmagan dastlabki uch band kuzatuv vazifasi sifatida koʻrsatiladi. Doza yozilmaydi.', 'Операциядан олдинги хавфни баҳолаш бандлари. Бажарилмаган дастлабки уч банд кузатув вазифаси сифатида кўрсатилади. Доза ёзилмайди.', 'Пункты предоперационной оценки риска. Первые три невыполненных пункта показываются как задачи для контроля. Дозы не указываются.'),
      alanlar: Object.fromEntries(Object.entries(KDC).map(([k, v]) => [k, v[0]])),
      sayilar: { isaretli: BELGILANGAN_BANDLAR },
      uyarilar: Object.fromEntries(Object.entries(KDC).map(([k, v]) => [k, v[1]])),
      not: DOZASIZ,
    },
  },
  {
    anahtar: 'greft-yara-izlem', roller: ['kalp-damar-cerrahisi'],
    metin: {
      ad: u('Tomir grefti va jarohat kuzatuvi', 'Томир грефти ва жароҳат кузатуви', 'Наблюдение за сосудистым графтом и раной'),
      aciklama: u('Nima kuzatilayotgani, holati, sanasi va keyingi nazorat. Tashxis va dori dozasi yozilmaydi.', 'Нима кузатилаётгани, ҳолати, санаси ва кейинги назорат. Ташхис ва дори дозаси ёзилмайди.', 'Что наблюдается, его состояние, дата и следующий контроль. Диагноз и дозы препаратов не указываются.'),
      alanlar: { tip: u('Nima kuzatiladi', 'Нима кузатилади', 'Что наблюдается'), durum: u('Holati', 'Ҳолати', 'Состояние'), tarih: u('Kuzatuv sanasi', 'Кузатув санаси', 'Дата наблюдения'), sonraki_kontrol: KEYINGI_NAZORAT_SANASI },
      secenekler: {
        tip: { greft: u('Tomir grefti', 'Томир грефти', 'Сосудистый графт'), yara: u('Operatsiya jarohati', 'Операция жароҳати', 'Операционная рана'), bypass: u('Shunt', 'Шунт', 'Шунт'), stent_graft: u('Stent-greft', 'Стент-грефт', 'Стент-графт') },
        durum: HOLAT,
      },
      tarihler: { tarih: u('Kuzatuv sanasi', 'Кузатув санаси', 'Дата наблюдения'), sonraki_kontrol: KEYINGI_NAZORAT },
      not: DOZASIZ,
    },
  },
  {
    anahtar: 'antikoagulan-vadeleri', roller: ['kalp-damar-cerrahisi'],
    metin: {
      ad: u('Antitrombotik davo: nazorat sanalari', 'Антитромботик даво: назорат саналари', 'Антитромботическая терапия: даты контроля'),
      aciklama: u('Dori guruhi, keyingi nazorat va laboratoriya tekshiruvi sanasi. Dori nomi, doza va maqsad koʻrsatkich yozilmaydi.', 'Дори гуруҳи, кейинги назорат ва лаборатория текшируви санаси. Дори номи, доза ва мақсад кўрсаткич ёзилмайди.', 'Группа препарата, дата следующего контроля и лабораторного исследования. Название препарата, доза и целевой показатель не указываются.'),
      alanlar: {
        sinif: u('Dori guruhi', 'Дори гуруҳи', 'Группа препарата'),
        sonraki_kontrol: KEYINGI_NAZORAT_SANASI,
        lab_vadesi: u('Keyingi laboratoriya tekshiruvi sanasi (ixtiyoriy)', 'Кейинги лаборатория текшируви санаси (ихтиёрий)', 'Дата следующего лабораторного контроля (необязательно)'),
      },
      secenekler: {
        sinif: {
          warfarin: u('Varfarin yoki boshqa vitamin antagonisti', 'Варфарин ёки бошқа витамин антагонисти', 'Варфарин или другой антагонист витамина'),
          doac: u('Toʻgʻridan-toʻgʻri taʼsir qiluvchi oral antikoagulyant', 'Тўғридан-тўғри таъсир қилувчи орал антикоагулянт', 'Прямой оральный антикоагулянт'),
          lmwh: u('Past molekulyar geparin', 'Паст молекуляр гепарин', 'Низкомолекулярный гепарин'),
          antiplatelet: u('Antiagregant', 'Антиагрегант', 'Антиагрегант'),
          diger: u('Boshqa', 'Бошқа', 'Другое'),
        },
      },
      tarihler: { sonraki_kontrol: KEYINGI_NAZORAT, lab_vadesi: u('Laboratoriya tekshiruvi', 'Лаборатория текшируви', 'Лабораторный контроль') },
      not: DOZASIZ,
    },
  },

  // ── ear, nose and throat. Not for the audiology role of a clinic (its own registry) and not for neurology. ──
  {
    anahtar: 'odyometri-pta', roller: ['kulak-burun-bogaz'],
    metin: {
      ad: u('Tonal audiometriya: oʻrtacha eshitish boʻsagʻasi', 'Тонал аудиометрия: ўртача эшитиш бўсағаси', 'Тональная аудиометрия: средний порог слуха'),
      aciklama: u('0,5, 1, 2 va 4 kHz dagi havo oʻtkazuvchanligi boʻsagʻalarining oʻrtachasi, eshitish pasayishi darajasi, oldingi oʻlchovdan va ikkinchi quloqdan farqi.', '0,5, 1, 2 ва 4 кГц даги ҳаво ўтказувчанлиги бўсағаларининг ўртачаси, эшитиш пасайиши даражаси, олдинги ўлчовдан ва иккинчи қулоқдан фарқи.', 'Среднее порогов воздушной проводимости на 0,5, 1, 2 и 4 кГц, степень снижения слуха, изменение от прежнего измерения и разница со вторым ухом.'),
      alanlar: {
        kulak: u('Quloq (ixtiyoriy)', 'Қулоқ (ихтиёрий)', 'Ухо (необязательно)'),
        e05: u('0,5 kHz dagi boʻsagʻa', '0,5 кГц даги бўсаға', 'Порог на 0,5 кГц'),
        e1: u('1 kHz dagi boʻsagʻa', '1 кГц даги бўсаға', 'Порог на 1 кГц'),
        e2: u('2 kHz dagi boʻsagʻa', '2 кГц даги бўсаға', 'Порог на 2 кГц'),
        e4: u('4 kHz dagi boʻsagʻa', '4 кГц даги бўсаға', 'Порог на 4 кГц'),
        onceki_pta: u('Oldingi oʻrtacha boʻsagʻa (ixtiyoriy)', 'Олдинги ўртача бўсаға (ихтиёрий)', 'Прежний средний порог (необязательно)'),
        karsi_pta: u('Ikkinchi quloqning oʻrtacha boʻsagʻasi (ixtiyoriy)', 'Иккинчи қулоқнинг ўртача бўсағаси (ихтиёрий)', 'Средний порог второго уха (необязательно)'),
      },
      secenekler: { kulak: QULOQ },
      sayilar: { pta: u('Oʻrtacha boʻsagʻa', 'Ўртача бўсаға', 'Средний порог'), fark: u('Oldingi oʻlchovdan farq', 'Олдинги ўлчовдан фарқ', 'Изменение от прежнего измерения') },
      bantlar: {
        normal: u('Meʼyor chegarasida (25 dB gacha)', 'Меъёр чегарасида (25 дБ гача)', 'В пределах нормы (до 25 дБ)'),
        hafif: u('Yengil darajadagi eshitish pasayishi (26–40 dB)', 'Енгил даражадаги эшитиш пасайиши (26–40 дБ)', 'Снижение слуха лёгкой степени (26–40 дБ)'),
        orta: u('Oʻrtacha darajadagi eshitish pasayishi (41–55 dB)', 'Ўртача даражадаги эшитиш пасайиши (41–55 дБ)', 'Снижение слуха средней степени (41–55 дБ)'),
        orta_ileri: u('Oʻrtacha-ogʻir darajadagi eshitish pasayishi (56–70 dB)', 'Ўртача-оғир даражадаги эшитиш пасайиши (56–70 дБ)', 'Снижение слуха среднетяжёлой степени (56–70 дБ)'),
        ileri: u('Ogʻir darajadagi eshitish pasayishi (71–90 dB)', 'Оғир даражадаги эшитиш пасайиши (71–90 дБ)', 'Снижение слуха тяжёлой степени (71–90 дБ)'),
        cok_ileri: u('Chuqur darajadagi eshitish pasayishi (90 dB dan yuqori)', 'Чуқур даражадаги эшитиш пасайиши (90 дБ дан юқори)', 'Глубокое снижение слуха (более 90 дБ)'),
      },
      uyarilar: {
        esik_artisi: u('Boʻsagʻa oldingi oʻlchovga nisbatan 10 dB yoki undan koʻproq oshgan', 'Бўсаға олдинги ўлчовга нисбатан 10 дБ ёки ундан кўпроқ ошган', 'Порог повысился на 10 дБ или более по сравнению с прежним измерением'),
        esik_azalisi: u('Boʻsagʻa oldingi oʻlchovga nisbatan 10 dB yoki undan koʻproq pasaygan', 'Бўсаға олдинги ўлчовга нисбатан 10 дБ ёки ундан кўпроқ пасайган', 'Порог снизился на 10 дБ или более по сравнению с прежним измерением'),
        asimetri: u('Quloqlar orasidagi farq 15 dB yoki undan koʻp', 'Қулоқлар орасидаги фарқ 15 дБ ёки ундан кўп', 'Разница между ушами 15 дБ или более'),
      },
      not: u('Daraja qarorga yordam beradi; eshitish pasayishi turi va tashxis shifokorniki.', 'Даража қарорга ёрдам беради; эшитиш пасайиши тури ва ташхис шифокорники.', 'Степень помогает принять решение; тип тугоухости и диагноз определяет врач.'),
    },
  },
  {
    anahtar: 'otoskopi-notu', roller: ['kulak-burun-bogaz'],
    metin: {
      ad: u('Otoskopiya qaydi', 'Отоскопия қайди', 'Запись отоскопии'),
      aciklama: u('Har bir quloq uchun tashqi eshituv yoʻli va nogʻora parda koʻrinishi belgilanadi; natija ikkala quloq belgilanganda chiqadi. Tashxis yozilmaydi.', 'Ҳар бир қулоқ учун ташқи эшитув йўли ва ноғора парда кўриниши белгиланади; натижа иккала қулоқ белгиланганда чиқади. Ташхис ёзилмайди.', 'Для каждого уха отмечается вид наружного слухового прохода и барабанной перепонки; результат появляется, когда отмечены оба уха. Диагноз не указывается.'),
      alanlar: {
        ...otoAlanlari(),
        ek_pnomatik: u('Pnevmatik otoskopiyada parda harakati kamaygan', 'Пневматик отоскопияда парда ҳаракати камайган', 'При пневматической отоскопии подвижность перепонки снижена'),
        ek_weber: u('Veber sinamasida tovush bir tomonga ogʻadi', 'Вебер синамасида товуш бир томонга оғади', 'Проба Вебера с латерализацией'),
        ek_rinne: u('Rinne sinamasi manfiy', 'Ринне синамаси манфий', 'Проба Ринне отрицательная'),
        ek_mastoid: u('Soʻrgʻichsimon oʻsiq sohasi ogʻriqli', 'Сўрғичсимон ўсиқ соҳаси оғриқли', 'Болезненность в области сосцевидного отростка'),
        ek_postaurikuler: u('Quloq orqasida shish yoki qizarish', 'Қулоқ орқасида шиш ёки қизариш', 'Припухлость или покраснение за ухом'),
        ek_isitme_kaybi: u('Bemor eshitish pasayganini aytmoqda', 'Бемор эшитиш пасайганини айтмоқда', 'Пациент отмечает снижение слуха'),
        ek_cinlama: u('Bemor quloqda shovqin borligini aytmoqda', 'Бемор қулоқда шовқин борлигини айтмоқда', 'Пациент отмечает шум в ушах'),
      },
      uyarilar: otoUyarilari(),
      not: KARAR,
    },
  },
  {
    anahtar: 'vertigo-notu', roller: ['kulak-burun-bogaz'],
    metin: {
      ad: u('Bosh aylanishi: pozitsion sinamalar qaydi', 'Бош айланиши: позитсион синамалар қайди', 'Головокружение: запись позиционных проб'),
      aciklama: u('Oʻtkazilgan sinama va manyovrlar natijasi, nistagm xususiyatlari va markaziy sababga ishora qiluvchi belgilar. Tashxis va dori yozilmaydi.', 'Ўтказилган синама ва манёврлар натижаси, нистагм хусусиятлари ва марказий сабабга ишора қилувчи белгилар. Ташхис ва дори ёзилмайди.', 'Результаты проведённых проб и манёвров, характеристики нистагма и признаки, указывающие на центральную причину. Диагноз и препараты не указываются.'),
      alanlar: {
        dix_hallpike: u('Diks–Xollpayk sinamasi', 'Дикс–Холлпайк синамаси', 'Проба Дикса–Холлпайка'),
        supine_roll: u('Yotgan holda boshni burish sinamasi (gorizontal kanal)', 'Ётган ҳолда бошни буриш синамаси (горизонтал канал)', 'Проба с поворотом головы лёжа (горизонтальный канал)'),
        epley: u('Epli manyovri (shifokor bajardi)', 'Эпли манёври (шифокор бажарди)', 'Манёвр Эпли (выполнен врачом)'),
        barbecue: u('Lempert manyovri (shifokor bajardi)', 'Лемперт манёври (шифокор бажарди)', 'Манёвр Лемперта (выполнен врачом)'),
        head_impulse: u('Bosh impulsi sinamasi', 'Бош импульси синамаси', 'Тест импульса головы'),
        romberg: u('Romberg sinamasi va yurishni baholash', 'Ромберг синамаси ва юришни баҳолаш', 'Проба Ромберга и оценка походки'),
        nis_torsiyonel: u('Nistagm torsion yoki yuqoriga uruvchi', 'Нистагм торсион ёки юқорига урувчи', 'Нистагм торсионный или бьющий вверх'),
        nis_horizontal: u('Nistagm gorizontal', 'Нистагм горизонтал', 'Нистагм горизонтальный'),
        nis_latans_var: u('Latent davr bor (bir necha soniya kechikish)', 'Латент давр бор (бир неча сония кечикиш)', 'Есть латентный период (задержка в несколько секунд)'),
        nis_yorulabilir: u('Nistagm takrorlanganda susayadi', 'Нистагм такрорланганда сусаяди', 'Нистагм истощается при повторении'),
        nis_latans_yok: u('Latent davr yoʻq yoki nistagm susaymaydi', 'Латент давр йўқ ёки нистагм сусаймайди', 'Нет латентного периода или нистагм не истощается'),
        nis_yon_degistiren: u('Nistagm yoʻnalishini oʻzgartiradi', 'Нистагм йўналишини ўзгартиради', 'Нистагм меняет направление'),
        nis_fiksasyon: u('Nistagm nigohni qadaganda bosilmaydi', 'Нистагм нигоҳни қадаганда босилмайди', 'Нистагм не подавляется фиксацией взора'),
        santral_cift_gorme: u('Markaziy belgi: ikkilanib koʻrish, nutq buzilishi yoki yutishning qiyinlashishi', 'Марказий белги: иккиланиб кўриш, нутқ бузилиши ёки ютишнинг қийинлашиши', 'Центральный признак: двоение, нарушение речи или затруднение глотания'),
        santral_yuz: u('Markaziy belgi: yuz asimmetriyasi, uvishish yoki kuchsizlik', 'Марказий белги: юз асимметрияси, увишиш ёки кучсизлик', 'Центральный признак: асимметрия лица, онемение или слабость'),
        santral_ayakta: u('Markaziy belgi: tik tura olmaydi yoki yordamsiz yura olmaydi', 'Марказий белги: тик тура олмайди ёки ёрдамсиз юра олмайди', 'Центральный признак: не может стоять или ходить без поддержки'),
        santral_nistagmus: u('Markaziy belgi: latent davrsiz, susaymaydigan yoki yoʻnalishini oʻzgartiradigan nistagm', 'Марказий белги: латент даврсиз, сусаймайдиган ёки йўналишини ўзгартирадиган нистагм', 'Центральный признак: нистагм без латентного периода, неистощающийся или меняющий направление'),
        santral_fiksasyon: u('Markaziy belgi: nigohni qadaganda bosilmaydigan nistagm', 'Марказий белги: нигоҳни қадаганда босилмайдиган нистагм', 'Центральный признак: нистагм, не подавляемый фиксацией взора'),
        santral_bas_agrisi: u('Markaziy belgi: toʻsatdan boshlangan, kuchli va odatdagidan boshqacha bosh ogʻrigʻi', 'Марказий белги: тўсатдан бошланган, кучли ва одатдагидан бошқача бош оғриғи', 'Центральный признак: внезапная, сильная и необычная головная боль'),
        kulak_belirtisi: u('Quloq tomonidan belgilar bor (eshitish pasayishi, shovqin, toʻlish hissi)', 'Қулоқ томонидан белгилар бор (эшитиш пасайиши, шовқин, тўлиш ҳисси)', 'Есть ушные симптомы (снижение слуха, шум, заложенность)'),
      },
      secenekler: { dix_hallpike: SINAMA_NATIJASI, supine_roll: SINAMA_NATIJASI, epley: SINAMA_NATIJASI, barbecue: SINAMA_NATIJASI, head_impulse: SINAMA_NATIJASI, romberg: SINAMA_NATIJASI },
      bantlar: {
        manevra_uygun: u('Markaziy sababga ishora qiluvchi belgi belgilanmagan', 'Марказий сабабга ишора қилувчи белги белгиланмаган', 'Признаки центральной причины не отмечены'),
        manevra_uygun_degil: u('Markaziy sababga shubha: repozitsion manyovr mos emas', 'Марказий сабабга шубҳа: репозитсион манёвр мос эмас', 'Подозрение на центральную причину: репозиционный манёвр не показан'),
      },
      uyarilar: {
        santral_suphe: u('Markaziy sababga shubha: avval shoshilinch nevrologik baholash', 'Марказий сабабга шубҳа: аввал шошилинч неврологик баҳолаш', 'Подозрение на центральную причину: сначала неотложная неврологическая оценка'),
        repozisyon_santral: u('Repozitsion manyovr markaziy belgi bilan birga qayd qilindi — sababini qaydga yozing', 'Репозитсион манёвр марказий белги билан бирга қайд қилинди — сабабини қайдга ёзинг', 'Репозиционный манёвр записан вместе с центральным признаком — укажите причину в записи'),
        nistagmus_eksik: u('Musbat sinama bor, lekin nistagm xususiyati belgilanmagan', 'Мусбат синама бор, лекин нистагм хусусияти белгиланмаган', 'Есть положительная проба, но характеристика нистагма не отмечена'),
      },
      not: DOZASIZ,
    },
  },
]
