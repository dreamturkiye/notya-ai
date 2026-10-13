/**
 * NOTYA-ULKE-ARACLAR-01 — Uzbekistan: ROLE TOOLS, third part, in the order of the pack's role list:
 * general surgery (genel-cerrahi), thoracic surgery (gogus-cerrahisi), chest diseases (gogus-hastaliklari),
 * ophthalmology (goz-hastaliklari).
 *
 * Every tool names the roles that see it. MACHINE-WRITTEN. AWAITS NATIVE REVIEW (see ./index.ts).
 */
import type { PaketAraci } from '@/lib/ulke/araclar/tipler'
import { BELGILANGAN_BANDLAR, DOZASIZ, KARAR, KEYINGI_NAZORAT, KEYINGI_NAZORAT_SANASI, u, vazifa, type Uc } from './yardimci'

const BAJARILGAN = u('Bajarilgan bandlar', 'Бажарилган бандлар', 'Выполнено пунктов')

// thoracic surgery: each item once, as a list entry and as the follow-up it becomes while it is open
const TORAKS: Readonly<Record<string, readonly [Uc, Uc]>> = {
  sft_yapildi: [u('Tashqi nafas funksiyasi tekshirildi, natijasi shifokorda', 'Ташқи нафас функцияси текширилди, натижаси шифокорда', 'Функция внешнего дыхания исследована, результат у врача'), vazifa('tashqi nafas funksiyasini tekshirish', 'ташқи нафас функциясини текшириш', 'исследование функции внешнего дыхания')],
  goruntu_hazir: [u('Koʻkrak qafasi tasviri (kompyuter tomografiyasi yoki rentgen) shifokor koʻrigiga tayyor', 'Кўкрак қафаси тасвири (компьютер томографияси ёки рентген) шифокор кўригига тайёр', 'Изображения грудной клетки (компьютерная томография или рентген) готовы для врача'), vazifa('koʻkrak qafasi tasviri', 'кўкрак қафаси тасвири', 'изображения грудной клетки')],
  anestezi_degerlendirme: [u('Anesteziolog koʻrigi rejalashtirildi yoki oʻtkazildi', 'Анестезиолог кўриги режалаштирилди ёки ўтказилди', 'Осмотр анестезиолога запланирован или проведён'), vazifa('anesteziolog koʻrigi', 'анестезиолог кўриги', 'осмотр анестезиолога')],
  sigara_sorgulandi: [u('Chekish anamnezi soʻraldi', 'Чекиш анамнези сўралди', 'Анамнез курения собран'), vazifa('chekish anamnezi', 'чекиш анамнези', 'анамнез курения')],
  kan_lab_hazir: [u('Operatsiyadan oldingi qon tahlillari shifokor koʻrigiga tayyor', 'Операциядан олдинги қон таҳлиллари шифокор кўригига тайёр', 'Предоперационные анализы крови готовы для врача'), vazifa('operatsiyadan oldingi qon tahlillari', 'операциядан олдинги қон таҳлиллари', 'предоперационные анализы крови')],
  onam_konustu: [u('Operatsiyaga rozilik boʻyicha suhbat oʻtkazildi', 'Операцияга розилик бўйича суҳбат ўтказилди', 'Проведена беседа о согласии на операцию'), vazifa('rozilik boʻyicha suhbat', 'розилик бўйича суҳбат', 'беседа о согласии')],
  kardiyak_risk_hekim: [u('Yurak tomonidan xavf shifokor tomonidan baholanmoqda', 'Юрак томонидан хавф шифокор томонидан баҳоланмоқда', 'Кардиальный риск оценивается врачом'), vazifa('yurak tomonidan xavfni baholash', 'юрак томонидан хавфни баҳолаш', 'оценка кардиального риска')],
}

export const UZ_ROL_ARACLARI_3: readonly PaketAraci[] = [
  // ── general surgery. Not for the other surgical roles: each has a list of its own. ──
  {
    anahtar: 'genel-preop', roller: ['genel-cerrahi'],
    metin: {
      ad: u('Operatsiyadan oldingi nazorat roʻyxati', 'Операциядан олдинги назорат рўйхати', 'Предоперационный контрольный список'),
      aciklama: u('Operatsiyadan oldin bajarilgan bandlar va rejalashtirilgan sana. Dori dozalari yozilmaydi.', 'Операциядан олдин бажарилган бандлар ва режалаштирилган сана. Дори дозалари ёзилмайди.', 'Пункты, выполненные перед операцией, и запланированная дата. Дозы препаратов не указываются.'),
      alanlar: {
        onam: u('Operatsiyaga rozilik olindi va hujjatlashtirildi', 'Операцияга розилик олинди ва ҳужжатлаштирилди', 'Согласие на операцию получено и оформлено'),
        laboratuvar: u('Operatsiyadan oldingi laboratoriya tekshiruvlari bajarildi', 'Операциядан олдинги лаборатория текширувлари бажарилди', 'Предоперационные лабораторные исследования выполнены'),
        goruntu: u('Operatsiyadan oldingi tasviriy tekshiruv va xulosasi koʻrib chiqildi', 'Операциядан олдинги тасвирий текширув ва хулосаси кўриб чиқилди', 'Предоперационная визуализация и заключение просмотрены'),
        anticoag_durdur: u('Qon suyultiruvchi dorilar boʻyicha rejani shifokor belgiladi', 'Қон суюлтирувчи дорилар бўйича режани шифокор белгилади', 'План в отношении препаратов, разжижающих кровь, определён врачом'),
        acil_kisi: u('Shoshilinch holatda bogʻlaniladigan shaxs maʼlumoti olindi', 'Шошилинч ҳолатда боғланиладиган шахс маълумоти олинди', 'Получены данные контактного лица на экстренный случай'),
        anestezi_not: u('Anesteziolog qaydi bemor hujjatlarida bor', 'Анестезиолог қайди бемор ҳужжатларида бор', 'Запись анестезиолога есть в документах пациента'),
        etiket: u('Operatsiya nomi, qisqacha (ixtiyoriy)', 'Операция номи, қисқача (ихтиёрий)', 'Краткое название операции (необязательно)'),
        ameliyat_tarihi: u('Rejalashtirilgan operatsiya sanasi (ixtiyoriy)', 'Режалаштирилган операция санаси (ихтиёрий)', 'Запланированная дата операции (необязательно)'),
      },
      sayilar: { tamamlanan: BAJARILGAN },
      tarihler: { ameliyat_tarihi: u('Rejalashtirilgan operatsiya sanasi', 'Режалаштирилган операция санаси', 'Запланированная дата операции') },
      not: DOZASIZ,
    },
  },

  // ── thoracic surgery. Not for chest diseases (inhaler technique there) and not for general surgery. ──
  {
    anahtar: 'toraks-preop', roller: ['gogus-cerrahisi'],
    metin: {
      ad: u('Koʻkrak qafasi operatsiyasidan oldingi nazorat roʻyxati', 'Кўкрак қафаси операциясидан олдинги назорат рўйхати', 'Контрольный список перед торакальной операцией'),
      aciklama: u('Operatsiyadan oldingi nafas tizimi tayyorgarligi bandlari. Bajarilmagan dastlabki uch band kuzatuv vazifasi sifatida koʻrsatiladi.', 'Операциядан олдинги нафас тизими тайёргарлиги бандлари. Бажарилмаган дастлабки уч банд кузатув вазифаси сифатида кўрсатилади.', 'Пункты подготовки дыхательной системы перед операцией. Первые три невыполненных пункта показываются как задачи для контроля.'),
      alanlar: Object.fromEntries(Object.entries(TORAKS).map(([k, v]) => [k, v[0]])),
      sayilar: { isaretli: BELGILANGAN_BANDLAR },
      uyarilar: Object.fromEntries(Object.entries(TORAKS).map(([k, v]) => [k, v[1]])),
      not: DOZASIZ,
    },
  },
  {
    anahtar: 'toraks-tup-yara', roller: ['gogus-cerrahisi'],
    metin: {
      ad: u('Plevra drenaji va jarohat kuzatuvi', 'Плевра дренажи ва жароҳат кузатуви', 'Наблюдение за плевральным дренажом и раной'),
      aciklama: u('Nima kuzatilayotgani, holati, sanasi va keyingi nazorat. Tashxis va dori dozasi yozilmaydi.', 'Нима кузатилаётгани, ҳолати, санаси ва кейинги назорат. Ташхис ва дори дозаси ёзилмайди.', 'Что наблюдается, его состояние, дата и следующий контроль. Диагноз и дозы препаратов не указываются.'),
      alanlar: {
        tip: u('Nima kuzatiladi', 'Нима кузатилади', 'Что наблюдается'),
        durum: u('Holati', 'Ҳолати', 'Состояние'),
        tarih: u('Kuzatuv sanasi', 'Кузатув санаси', 'Дата наблюдения'),
        sonraki_kontrol: KEYINGI_NAZORAT_SANASI,
      },
      secenekler: {
        tip: { toraks_tup: u('Plevra drenaji', 'Плевра дренажи', 'Плевральный дренаж'), yara: u('Operatsiya jarohati', 'Операция жароҳати', 'Операционная рана'), dren: u('Drenaj', 'Дренаж', 'Дренаж') },
        durum: { izlemde: u('Kuzatuvda', 'Кузатувда', 'Под наблюдением'), cikarildi: u('Olib tashlandi', 'Олиб ташланди', 'Удалён'), iyilesiyor: u('Bitmoqda', 'Битмоқда', 'Заживает'), dikkat: u('Eʼtibor talab qiladi — shifokor baholaydi', 'Эътибор талаб қилади — шифокор баҳолайди', 'Требует внимания — оценивает врач') },
      },
      tarihler: { tarih: u('Kuzatuv sanasi', 'Кузатув санаси', 'Дата наблюдения'), sonraki_kontrol: KEYINGI_NAZORAT },
      not: DOZASIZ,
    },
  },

  // ── chest diseases. Not for thoracic surgery and not for internal medicine. ──
  {
    anahtar: 'inhaler-teknik', roller: ['gogus-hastaliklari'],
    metin: {
      ad: u('Ingalyatordan foydalanish texnikasi', 'Ингалятордан фойдаланиш техникаси', 'Техника ингаляции'),
      aciklama: u('Qurilma turi va bemor toʻgʻri bajargan qadamlar. Dori, doza va ingalyatsiyalar soni yozilmaydi.', 'Қурилма тури ва бемор тўғри бажарган қадамлар. Дори, доза ва ингаляциялар сони ёзилмайди.', 'Тип устройства и шаги, которые пациент выполнил правильно. Препарат, доза и число ингаляций не указываются.'),
      alanlar: {
        cihaz: u('Qurilma', 'Қурилма', 'Устройство'),
        ortak_hazirlik: u('Qurilma toʻgʻri tayyorlandi (qopqoq, chayqatish yoki kapsulani joylash)', 'Қурилма тўғри тайёрланди (қопқоқ, чайқатиш ёки капсулани жойлаш)', 'Устройство подготовлено правильно (колпачок, встряхивание или загрузка капсулы)'),
        ortak_ekspirasyon: u('Nafas olishdan oldin toʻliq nafas chiqarildi (qurilmaga emas)', 'Нафас олишдан олдин тўлиқ нафас чиқарилди (қурилмага эмас)', 'Перед вдохом сделан полный выдох (не в устройство)'),
        ortak_dudak: u('Lablar ogʻizlikni zich qamradi', 'Лаблар оғизликни зич қамради', 'Губы плотно обхватывают мундштук'),
        ortak_nefes_tutma: u('Nafas 5–10 soniya ushlab turildi', 'Нафас 5–10 сония ушлаб турилди', 'Дыхание задержано на 5–10 секунд'),
        ortak_agiz_calkalama: u('Ingalyatsiyadan keyin ogʻiz chayildi (kerak boʻlsa)', 'Ингаляциядан кейин оғиз чайилди (керак бўлса)', 'После ингаляции рот прополоскан (если требуется)'),
        ortak_doz_sayaci: u('Doza hisoblagichi yoki qurilma boʻshligi tekshirildi', 'Доза ҳисоблагичи ёки қурилма бўшлиги текширилди', 'Проверен счётчик доз или не пусто ли устройство'),
        odi_inspirasyon: u('Nafas sekin va chuqur olindi', 'Нафас секин ва чуқур олинди', 'Вдох медленный и глубокий'),
        odi_ara_parca: u('Speyser ishlatildi (shifokor tavsiya qilgan boʻlsa)', 'Спейсер ишлатилди (шифокор тавсия қилган бўлса)', 'Использован спейсер (если рекомендован врачом)'),
        kti_inspirasyon: u('Nafas tez va kuchli olindi', 'Нафас тез ва кучли олинди', 'Вдох быстрый и сильный'),
        kti_kapsul: u('Kapsula yoki blister toʻgʻri joylandi', 'Капсула ёки блистер тўғри жойланди', 'Капсула или блистер загружены правильно'),
        softmist_hazirlik: u('Qurilma (kartrij, doza) tayyorlandi', 'Қурилма (картриж, доза) тайёрланди', 'Устройство (картридж, доза) подготовлено'),
        softmist_inspirasyon: u('Nafas sekin va chuqur olindi', 'Нафас секин ва чуқур олинди', 'Вдох медленный и глубокий'),
        nebul_maske: u('Niqob yoki ogʻizlik toʻgʻri joylashgan', 'Ниқоб ёки оғизлик тўғри жойлашган', 'Маска или мундштук расположены правильно'),
        nebul_sure: u('Muolaja davomiyligi shifokor koʻrsatmasiga mos', 'Муолажа давомийлиги шифокор кўрсатмасига мос', 'Длительность процедуры соответствует указанию врача'),
        diger_adimlar: u('Shifokor tushuntirgan qadamlar bajarildi', 'Шифокор тушунтирган қадамлар бажарилди', 'Выполнены шаги, объяснённые врачом'),
        kontrol_ay: u('Texnikani qayta tekshirish muddati (ixtiyoriy)', 'Техникани қайта текшириш муддати (ихтиёрий)', 'Через сколько проверить технику повторно (необязательно)'),
      },
      secenekler: {
        cihaz: {
          odi: u('Dozalangan aerozol ingalyator', 'Дозаланган аэрозол ингалятор', 'Дозированный аэрозольный ингалятор'),
          kti: u('Kukunli ingalyator', 'Кукунли ингалятор', 'Порошковый ингалятор'),
          soft_mist: u('Suyuqlikli (mayin tuman) ingalyator', 'Суюқликли (майин туман) ингалятор', 'Жидкостный ингалятор (мягкий туман)'),
          nebul: u('Nebulayzer', 'Небулайзер', 'Небулайзер'),
          diger: u('Boshqa qurilma', 'Бошқа қурилма', 'Другое устройство'),
        },
      },
      sayilar: { tamamlanan: u('Toʻgʻri bajarilgan qadamlar', 'Тўғри бажарилган қадамлар', 'Правильно выполнено шагов') },
      tarihler: { sonraki: u('Texnikani qayta tekshirish', 'Техникани қайта текшириш', 'Повторная проверка техники') },
      not: DOZASIZ,
    },
  },

  // ── ophthalmology. Not for any other role: acuity notation of an eye clinic. ──
  {
    anahtar: 'gorme-keskinligi', roller: ['goz-hastaliklari'],
    metin: {
      ad: u('Koʻrish oʻtkirligi: logMAR', 'Кўриш ўткирлиги: logMAR', 'Острота зрения: logMAR'),
      aciklama: u('Oʻnli kasr yoki Snellen kasri logMAR ga oʻtkaziladi; ikki oʻlchov orasidagi farq harflarda koʻrsatiladi (musbat son — yaxshilanish).', 'Ўнли каср ёки Снеллен касри logMAR га ўтказилади; икки ўлчов орасидаги фарқ ҳарфларда кўрсатилади (мусбат сон — яхшиланиш).', 'Десятичная дробь или дробь Снеллена переводится в logMAR; разница между двумя измерениями показывается в буквах (положительное число — улучшение).'),
      alanlar: {
        goz: u('Koʻz (ixtiyoriy)', 'Кўз (ихтиёрий)', 'Глаз (необязательно)'),
        bicim: u('Yozuv shakli', 'Ёзув шакли', 'Форма записи'),
        simdi_ondalik: u('Hozirgi koʻrish oʻtkirligi (oʻnli kasr)', 'Ҳозирги кўриш ўткирлиги (ўнли каср)', 'Острота зрения сейчас (десятичная дробь)'),
        onceki_ondalik: u('Oldingi koʻrish oʻtkirligi (ixtiyoriy)', 'Олдинги кўриш ўткирлиги (ихтиёрий)', 'Острота зрения ранее (необязательно)'),
        simdi_pay: u('Hozirgi oʻlchov: kasr surati', 'Ҳозирги ўлчов: каср сурати', 'Сейчас: числитель дроби'),
        simdi_payda: u('Hozirgi oʻlchov: kasr maxraji', 'Ҳозирги ўлчов: каср махражи', 'Сейчас: знаменатель дроби'),
        onceki_pay: u('Oldingi oʻlchov: kasr surati (ixtiyoriy)', 'Олдинги ўлчов: каср сурати (ихтиёрий)', 'Ранее: числитель дроби (необязательно)'),
        onceki_payda: u('Oldingi oʻlchov: kasr maxraji (ixtiyoriy)', 'Олдинги ўлчов: каср махражи (ихтиёрий)', 'Ранее: знаменатель дроби (необязательно)'),
      },
      secenekler: {
        goz: { sag: u('Oʻng koʻz', 'Ўнг кўз', 'Правый глаз'), sol: u('Chap koʻz', 'Чап кўз', 'Левый глаз') },
        bicim: { ondalik: u('Oʻnli kasr', 'Ўнли каср', 'Десятичная дробь'), kesir: u('Snellen kasri', 'Снеллен касри', 'Дробь Снеллена') },
      },
      sayilar: {
        logmar: u('logMAR, hozir', 'logMAR, ҳозир', 'logMAR сейчас'),
        onceki_logmar: u('logMAR, oldin', 'logMAR, олдин', 'logMAR ранее'),
        harf_farki: u('Farq, harflarda', 'Фарқ, ҳарфларда', 'Разница в буквах'),
      },
      not: KARAR,
    },
  },
]
