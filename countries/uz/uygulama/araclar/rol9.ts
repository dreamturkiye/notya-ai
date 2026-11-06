/**
 * GENITAL-ESTETIK-01 (Kaan, 2026-11-06) — Uzbekistan: ROLE TOOLS, ninth part. Cosmetic gynaecology / genital aesthetics
 * (lib/ulke/araclar/tanimlar/genitalEstetik.ts), obstetrics and gynaecology only.
 *
 * MACHINE-WRITTEN. AWAITS NATIVE REVIEW (see ./index.ts), and a clinician's. Cyrillic derived from the Latin text by rule
 * (scripts/uz-kiril.mjs).
 *
 * THE REGULATORY RECOGNITION GATE, as decided for Uzbekistan (docs/OPEN-COMMITMENTS.md GENITAL-ESTETIK-01h):
 *   ON   the adult genital-aesthetics operation note (labiaplasty, labiaplasty with clitoral hood reduction, vaginoplasty /
 *        colpoperineorrhaphy, perineoplasty): gynaecological surgery within the obstetrics-and-gynaecology and plastic-
 *        surgery licences of the Ministry of Health's nomenclature order (No. 6 of 12.05.2021, registration No. 3303, as
 *        cited in UZ-OZEL-BRANS-REGULATORY-01); no Uzbek law or ministry text on cosmetic genital surgery was found, so
 *        every source shown is international and labelled so; patients aged 18 and over only (the pack's gate).
 *        The outcome-measure totals and the separate photo consent.
 *   OFF  the energy-based session, the injection log and the whitening record: no source of the Ministry of Health (device
 *        registration for a vaginal use, cosmetology licensing for genital procedures) was read in this session. Kept as
 *        slots (./yuvalar.ts) until a local lawyer and clinician supply one.
 * NO ITEM OF A PUBLISHED QUESTIONNAIRE: totals only. No validated Uzbek or Russian translation of FSFI, FGSIS, VLQ or COPS-L
 * was verified in this session. Hymenoplasty is not offered.
 */
import type { AracYuvasi, PaketAraci } from '@/lib/ulke/araclar/tipler'
import { UZ_KD_SABLONLARI, UZ_NOT_ALANLARI, UZ_NOT_SECENEKLERI } from './rol7'
import { u, type Uc } from './yardimci'

const KD = ['kadin-hastaliklari-dogum']
type R = Record<string, Uc>
const adim = (qadamlar: readonly Uc[]): Uc => {
  const bicim = (k: keyof Uc) => qadamlar.map((q, i) => `${i + 1}. ${q[k]}`).join('\n')
  return { 'uz-Latn': bicim('uz-Latn'), 'uz-Cyrl': bicim('uz-Cyrl'), ru: bicim('ru') }
}
const qosh = (a: Uc, b: Uc): Uc => ({ 'uz-Latn': `${a['uz-Latn']} ${b['uz-Latn']}`, 'uz-Cyrl': `${a['uz-Cyrl']} ${b['uz-Cyrl']}`, ru: `${a.ru} ${b.ru}` })
const XALQARO = u('Xalqaro manba; Oʻzbekiston Sogʻliqni saqlash vazirligining bu amaliyotlar boʻyicha hujjati topilmadi.', 'Халқаро манба; Ўзбекистон Соғлиқни сақлаш вазирлигининг бу амалиётлар бўйича ҳужжати топилмади.', 'Международный источник; документ Министерства здравоохранения Узбекистана по этим процедурам не найден.')

/** The patient gate sentence of the cosmetic-capable tool (18 or over, female). */
export const UZ_GE_HASTA_KAPISI = u('Faqat 18 yosh va undan katta ayollar uchun: 18 yoshgacha boʻlgan yoki tugʻilgan sanasi yozilmagan bemorga kosmetik genital amaliyot hech qachon yozilmaydi. Yoshroq bemorga tibbiy koʻrsatma bilan operatsiya akusherlik-ginekologiya operatsiya bayonnomasida yoziladi.', 'Фақат 18 ёш ва ундан катта аёллар учун: 18 ёшгача бўлган ёки туғилган санаси ёзилмаган беморга косметик генитал амалиёт ҳеч қачон ёзилмайди. Ёшроқ беморга тиббий кўрсатма билан операция акушерлик-гинекология операция баённомасида ёзилади.', 'Только для женщин 18 лет и старше: косметическая генитальная процедура никогда не записывается пациентке младше 18 лет или без записанной даты рождения. Операция по медицинским показаниям у более юной пациентки записывается в протоколе акушерско-гинекологической операции.')

const ENDIKASYON_ALANLARI: R = {
  endikasyon_sinifi: u('Koʻrsatma: kosmetik yoki tibbiy', 'Кўрсатма: косметик ёки тиббий', 'Показание: косметическое или медицинское'),
  medikal_gerekce: u('Tibbiy sabab', 'Тиббий сабаб', 'Медицинская причина'),
  medikal_aciklama: u('Tibbiy sabab, oʻz soʻzlaringiz bilan', 'Тиббий сабаб, ўз сўзларингиз билан', 'Медицинская причина, своими словами'),
}
const ENDIKASYON_SECENEKLERI: Record<string, R> = {
  endikasyon_sinifi: {
    kozmetik: u('Kosmetik (tibbiy koʻrsatmasiz)', 'Косметик (тиббий кўрсатмасиз)', 'Косметическое (без медицинских показаний)'),
    medikal: u('Tibbiy koʻrsatma bilan (rekonstruktiv yoki funksional)', 'Тиббий кўрсатма билан (реконструктив ёки функсионал)', 'По медицинским показаниям (реконструктивное или функциональное)'),
  },
  medikal_gerekce: {
    konjenital_anomali: u('Tugʻma anomaliya', 'Туғма аномалия', 'Врождённая аномалия'),
    travma_onarimi: u('Jarohatdan keyingi tiklash', 'Жароҳатдан кейинги тиклаш', 'Восстановление после травмы'),
    obstetrik_hasar_onarimi: u('Tugʻruq jarohatini tiklash', 'Туғруқ жароҳатини тиклаш', 'Восстановление после родовой травмы'),
    lezyon_eksizyonu: u('Oʻchoqni kesib olish yoki biopsiya', 'Ўчоқни кесиб олиш ёки биопсия', 'Иссечение очага или биопсия'),
    belgelenmis_fonksiyonel_yakinma: u('Hujjatlashtirilgan funksional shikoyatlar', 'Ҳужжатлаштирилган функсионал шикоятлар', 'Задокументированные функциональные жалобы'),
    prolapsus: u('Tos aʼzolari tushishi', 'Тос аъзолари тушиши', 'Пролапс тазовых органов'),
    fgm_sonrasi_rekonstruksiyon: u('Ayollar jinsiy aʼzolarini kesishdan keyingi rekonstruksiya', 'Аёллар жинсий аъзоларини кесишдан кейинги реконструксия', 'Реконструкция после калечащих операций на женских половых органах'),
    gsm_tedavisi: u('Menopauzaning genitouriner sindromi', 'Менопаузанинг генитоуринер синдроми', 'Генитоуринарный синдром менопаузы'),
    liken_skleroz: u('Skleroz liken', 'Склероз ликен', 'Склерозирующий лишай'),
    diger_tibbi: u('Boshqa tibbiy sabab', 'Бошқа тиббий сабаб', 'Другая медицинская причина'),
  },
}

const ACIL = u('Shish tez kattalashsa yoki bir tomonda koʻkarish oʻssa, prokladka bir soatda hoʻl boʻladigan qon ketsa, harorat 38 °C va undan yuqori boʻlsa, hidli ajralma, yara ochilishi, siydik chiqara olmaslik yoki kuchayib borayotgan ogʻriq boʻlsa darhol qayting.', 'Шиш тез катталашса ёки бир томонда кўкариш ўсса, прокладка бир соатда ҳўл бўладиган қон кетса, ҳарорат 38 °C ва ундан юқори бўлса, ҳидли ажралма, яра очилиши, сийдик чиқара олмаслик ёки кучайиб бораётган оғриқ бўлса дарҳол қайтинг.', 'Немедленно обратитесь при быстро нарастающем отёке или растущем синяке с одной стороны, кровотечении, промачивающем прокладку за час, температуре 38 °C и выше, неприятных выделениях, расхождении раны, невозможности помочиться или нарастающей боли.')
const YARA = u('Birinchi 48 soat davomida matoga oʻralgan sovuq kompressni 15–20 daqiqadan qoʻying, teriga bevosita qoʻymang. Hojatxonadan keyin iliq suv bilan chayib, oldidan orqaga qarab quriting; xushboʻy vositalar ishlatmang. Choklar oʻzi soʻriladi: tortmang. Keng paxta ichki kiyim kiying. Ogʻriq qoldiruvchini maslahatga koʻra iching.', 'Биринчи 48 соат давомида матога ўралган совуқ компрессни 15–20 дақиқадан қўйинг, терига бевосита қўйманг. Ҳожатхонадан кейин илиқ сув билан чайиб, олдидан орқага қараб қуритинг; хушбўй воситалар ишлатманг. Чоклар ўзи сўрилади: тортманг. Кенг пахта ички кийим кийинг. Оғриқ қолдирувчини маслаҳатга кўра ичинг.', 'Первые 48 часов прикладывайте холод, обёрнутый тканью, по 15–20 минут, не прямо на кожу. После туалета ополаскивайте тёплой водой и промокайте спереди назад; без ароматизированных средств. Швы рассасываются сами: не тяните их. Носите свободное хлопковое бельё. Обезболивающее принимайте по рекомендации.')
const POSTOP_LAB = qosh(qosh(YARA, u('Jinsiy aloqa va tampondan __ hafta, suzish va vannadan __ hafta, velosiped va ogʻir mashgʻulotlardan __ hafta saqlaning. Shish haftalar davomida kamayadi; yakuniy koʻrinish oylar oladi. Qayta koʻrik: __.', 'Жинсий алоқа ва тампондан __ ҳафта, сузиш ва ваннадан __ ҳафта, велосипед ва оғир машғулотлардан __ ҳафта сақланинг. Шиш ҳафталар давомида камаяди; якуний кўриниш ойлар олади. Қайта кўрик: __.', 'Без половой жизни и тампонов __ недель, без плавания и ванны __ недель, без велосипеда и интенсивных нагрузок __ недель. Отёк уменьшается неделями; окончательный вид формируется месяцами. Повторный осмотр: __.')), ACIL)
const POSTOP_QIN = qosh(qosh(YARA, u('Ich qotishidan saqlaning: koʻp suyuqlik va kletchatka, maslahat berilsa ich yumshatuvchi. Ogʻir koʻtarish va kuchanishdan __ hafta, jinsiy aloqa va tampondan __ hafta saqlaning. Qindan gaz yoki najas kelsa ham qayting. Qayta koʻrik: __.', 'Ич қотишидан сақланинг: кўп суюқлик ва клетчатка, маслаҳат берилса ич юмшатувчи. Оғир кўтариш ва кучанишдан __ ҳафта, жинсий алоқа ва тампондан __ ҳафта сақланинг. Қиндан газ ёки нажас келса ҳам қайтинг. Қайта кўрик: __.', 'Избегайте запора: много жидкости и клетчатки, при рекомендации — слабительное. Без подъёма тяжестей и натуживания __ недель, без половой жизни и тампонов __ недель. Обратитесь также, если из влагалища выходят газы или кал. Повторный осмотр: __.')), ACIL)
const BDD_SATIRI = u('__ (funksional shikoyatlar / kosmetik istak). Maslahat, tana qiyofasi skriningi (vosita va natija: __) va kutilmalar yozilgan; rozilik yozilgan.', '__ (функсионал шикоятлар / косметик истак). Маслаҳат, тана қиёфаси скрининги (восита ва натижа: __) ва кутилмалар ёзилган; розилик ёзилган.', '__ (функциональные жалобы / косметическое желание). Консультирование, скрининг образа тела (инструмент и результат: __) и ожидания записаны; согласие записано.')

const GE_SABLONLARI: Record<string, R> = {
  labioplasti: { ...UZ_KD_SABLONLARI.labioplasti, endikasyon: BDD_SATIRI, postop: POSTOP_LAB },
  labioplasti_klitoral: {
    endikasyon: BDD_SATIRI,
    teknik: adim([
      u('Anesteziya __; litotomiya holati; teri ishlovi, choyshab yopish.', 'Анестезия __; литотомия ҳолати; тери ишлови, чойшаб ёпиш.', 'Анестезия __; литотомическое положение; обработка, отграничение.'),
      u('Lab chegaralari va klitor qalpoqchasining ortiqchasi simmetrik belgilandi; glans yopiq qolishi uchun qalpoqchaning oʻrta qismi qoldirildi.', 'Лаб чегаралари ва клитор қалпоқчасининг ортиқчаси симметрик белгиланди; гланс ёпиқ қолиши учун қалпоқчанинг ўрта қисми қолдирилди.', 'Границы губ и избыток капюшона клитора размечены симметрично; средняя часть капюшона оставлена, чтобы головка оставалась прикрытой.'),
      u('Mahalliy infiltratsiya: __ (jarroh qaroriga koʻra).', 'Маҳаллий инфильтрация: __ (жарроҳ қарорига кўра).', 'Местная инфильтрация: __ (по решению хирурга).'),
      u('Lab toʻqimasi __ usulida olindi; yuganchasi saqlandi.', 'Лаб тўқимаси __ усулида олинди; юганчаси сақланди.', 'Ткань губ иссечена методом __; уздечка сохранена.'),
      u('Qalpoqchaning yon ortiqchasi __ bilan kesib olindi; klitor tanasi, glans va dorsal nerv sohasiga tegilmadi.', 'Қалпоқчанинг ён ортиқчаси __ билан кесиб олинди; клитор танаси, гланс ва дорсал нерв соҳасига тегилмади.', 'Латеральный избыток капюшона иссечён __; тело клитора, головка и зона дорсального нерва не затронуты.'),
      u('Gemostaz __; glansning ochiqligi va simmetriya tekshirildi.', 'Гемостаз __; гланснинг очиқлиги ва симметрия текширилди.', 'Гемостаз __; проверены открытость головки и симметрия.'),
    ]),
    kapanis: u('Shilliq qavat va qalpoqcha chetlari soʻriladigan choklar bilan tikildi __.', 'Шиллиқ қават ва қалпоқча четлари сўриладиган чоклар билан тикилди __.', 'Края слизистой и капюшона ушиты рассасывающимися швами __.'),
    postop: qosh(POSTOP_LAB, u('Klitor atrofida sezgi bir muddat oshishi yoki kamayishi mumkin; davom etsa qayta koʻrikda ayting.', 'Клитор атрофида сезги бир муддат ошиши ёки камайиши мумкин; давом этса қайта кўрикда айтинг.', 'Чувствительность вокруг клитора может какое-то время быть повышенной или сниженной; если сохраняется, скажите на осмотре.')),
  },
  vajinoplasti: {
    endikasyon: u('__ (qin boʻshligi shikoyatlari / POP-Q bosqichi __ / tugʻruq jarohati). Tos tubi mushaklari mashqlari: __. Maslahat va kutilmalar yozilgan; rozilik yozilgan.', '__ (қин бўшлиги шикоятлари / POP-Q босқичи __ / туғруқ жароҳати). Тос туби мушаклари машқлари: __. Маслаҳат ва кутилмалар ёзилган; розилик ёзилган.', '__ (жалобы на несостоятельность влагалища / стадия POP-Q __ / родовая травма). Тренировка мышц тазового дна: __. Консультирование и ожидания записаны; согласие записано.'),
    teknik: adim([
      u('Anesteziya __; litotomiya holati; teri ishlovi, choyshab yopish, siydik kateteri.', 'Анестезия __; литотомия ҳолати; тери ишлови, чойшаб ёпиш, сийдик катетери.', 'Анестезия __; литотомическое положение; обработка, отграничение, мочевой катетер.'),
      u('Qin kirish qismining maqsadli kengligi jinsiy funksiya hisobga olinib belgilandi (oʻlchov: __).', 'Қин кириш қисмининг мақсадли кенглиги жинсий функция ҳисобга олиниб белгиланди (ўлчов: __).', 'Целевая ширина входа во влагалище определена с учётом половой функции (измерение: __).'),
      u('Qin orqa devori va oraliq __ shaklida (uchburchak / romb) belgilandi va kesildi.', 'Қин орқа девори ва оралиқ __ шаклида (учбурчак / ромб) белгиланди ва кесилди.', 'Задняя стенка влагалища и промежность размечены __ (треугольник / ромб) и рассечены.'),
      u('Toʻgʻri ichak-qin fassiyasi ajratildi; toʻgʻri ichak himoyalandi.', 'Тўғри ичак-қин фассияси ажратилди; тўғри ичак ҳимояланди.', 'Ректовагинальная фасция выделена; прямая кишка защищена.'),
      u('Toʻgʻri ichak-qin fassiyasi / levator chetlari oʻrta chiziqda __ bilan plikatsiya qilindi, ortiqcha toraytirishdan saqlanildi.', 'Тўғри ичак-қин фассияси / леватор четлари ўрта чизиқда __ билан пликация қилинди, ортиқча торайтиришдан сақланилди.', 'Ректовагинальная фасция / края леваторов пликированы по средней линии __, избегая чрезмерного сужения.'),
      u('Ortiqcha shilliq qavat kesib olindi; oraliq tanasi mushaklari yaqinlashtirildi.', 'Ортиқча шиллиқ қават кесиб олинди; оралиқ танаси мушаклари яқинлаштирилди.', 'Избыток слизистой иссечён; мышцы промежности сближены.'),
      u('Toʻgʻri ichak tekshiruvi: chok toʻgʻri ichakdan oʻtmagan: __. Qin kirish qismining yakuniy kengligi: __.', 'Тўғри ичак текшируви: чок тўғри ичакдан ўтмаган: __. Қин кириш қисмининг якуний кенглиги: __.', 'Ректальное исследование: шов не проходит через прямую кишку: __. Итоговая ширина входа: __.'),
    ]),
    kapanis: u('Qin shilliq qavati va oraliq terisi soʻriladigan choklar bilan tikildi; qin tamponi: __.', 'Қин шиллиқ қавати ва оралиқ териси сўриладиган чоклар билан тикилди; қин тампони: __.', 'Слизистая влагалища и кожа промежности ушиты рассасывающимися швами; влагалищный тампон: __.'),
    postop: POSTOP_QIN,
  },
  perineoplasti: { ...UZ_KD_SABLONLARI.perineoplasti, postop: POSTOP_QIN },
}

export const UZ_ROL_ARACLARI_9: readonly PaketAraci[] = [
  {
    anahtar: 'ameliyat-notu-genital', roller: KD,
    hasta: { enAzYas: 18, cinsiyet: 'female' },
    metin: {
      ad: u('Operatsiya bayonnomasi: genital estetik jarrohlik (kattalar)', 'Операция баённомаси: генитал эстетик жарроҳлик (катталар)', 'Протокол операции: генитальная эстетическая хирургия (взрослые)'),
      aciklama: u('Labioplastika, klitor qalpoqchasini kichraytirish bilan labioplastika, vaginoplastika / kolpoperineorafiya va perineoplastika: koʻrsatma (kosmetik yoki tibbiy), tana qiyofasi skriningi va bajarilganiga moslab tuzatiladigan standart bosqichlar. Bemorning operatsiyadan keyingi koʻrsatmalari bilan blankada chop etiladi.', 'Лабиопластика, клитор қалпоқчасини кичрайтириш билан лабиопластика, вагинопластика / колпоперинеорафия ва перинеопластика: кўрсатма (косметик ёки тиббий), тана қиёфаси скрининги ва бажарилганига мослаб тузатиладиган стандарт босқичлар. Беморнинг операциядан кейинги кўрсатмалари билан бланкада чоп этилади.', 'Лабиопластика, лабиопластика с уменьшением капюшона клитора, вагинопластика / кольпоперинеорафия и перинеопластика: показание (косметическое или медицинское), скрининг образа тела и стандартные этапы, которые исправляются под выполненное. Печатается на бланке с послеоперационными указаниями для пациентки.'),
      alanlar: {
        sablon: u('Operatsiya (standart bosqichlarni toʻldiradi; har bir soʻz tahrirlanadi)', 'Операция (стандарт босқичларни тўлдиради; ҳар бир сўз таҳрирланади)', 'Операция (заполняет стандартные этапы; каждое слово редактируется)'),
        ...ENDIKASYON_ALANLARI,
        bdd_tarama: u('Tana qiyofasi (dismorfofobiya) skriningi', 'Тана қиёфаси (дисморфофобия) скрининги', 'Скрининг образа тела (дисморфическое расстройство)'),
        cops_l_toplam: u('COPS-L umumiy balli, agar qoʻllangan boʻlsa (0–72)', 'COPS-L умумий балли, агар қўлланган бўлса (0–72)', 'Сумма COPS-L, если применялась (0–72)'),
        ...UZ_NOT_ALANLARI,
      },
      secenekler: {
        sablon: {
          labioplasti: u('Labioplastika (kichik jinsiy lablarni kichraytirish)', 'Лабиопластика (кичик жинсий лабларни кичрайтириш)', 'Лабиопластика (уменьшение малых половых губ)'),
          labioplasti_klitoral: u('Klitor qalpoqchasini kichraytirish bilan labioplastika', 'Клитор қалпоқчасини кичрайтириш билан лабиопластика', 'Лабиопластика с уменьшением капюшона клитора'),
          vajinoplasti: u('Vaginoplastika / kolpoperineorafiya (qinni toraytirish)', 'Вагинопластика / колпоперинеорафия (қинни торайтириш)', 'Вагинопластика / кольпоперинеорафия (сужение влагалища)'),
          perineoplasti: u('Perineoplastika / kolporafiya', 'Перинеопластика / колпорафия', 'Перинеопластика / кольпорафия'),
        },
        ...ENDIKASYON_SECENEKLERI,
        bdd_tarama: { yapildi: u('Oʻtkazildi, tasdiqlangan vosita bilan', 'Ўтказилди, тасдиқланган восита билан', 'Проведён, валидированным инструментом'), yapilmadi: u('Oʻtkazilmadi', 'Ўтказилмади', 'Не проводился') },
        ...UZ_NOT_SECENEKLERI,
      },
      uyarilar: {
        bdd_tarama_yok: u('Tana qiyofasi skriningi yozilmagan kosmetik genital jarrohlik: qaror qabul qilishdan oldin dismorfofobiyani baholang.', 'Тана қиёфаси скрининги ёзилмаган косметик генитал жарроҳлик: қарор қабул қилишдан олдин дисморфофобияни баҳоланг.', 'Косметическая генитальная операция без записанного скрининга образа тела: оцените дисморфическое расстройство до решения.'),
        cops_l_pozitif: u('COPS-L umumiy balli 40 va undan yuqori: dismorfofobiya ehtimoli. Qaror qabul qilishdan oldin ruhiy salomatlik mutaxassisiga yoʻnaltirishni koʻrib chiqing. Bu tashxis emas va hech narsani toʻsmaydi; qaror sizniki.', 'COPS-L умумий балли 40 ва ундан юқори: дисморфофобия эҳтимоли. Қарор қабул қилишдан олдин руҳий саломатлик мутахассисига йўналтиришни кўриб чиқинг. Бу ташхис эмас ва ҳеч нарсани тўсмайди; қарор сизники.', 'Сумма COPS-L 40 и выше: возможно дисморфическое расстройство. Рассмотрите направление к специалисту по психическому здоровью до решения. Это не диагноз и ничего не блокирует; решение за вами.'),
      },
      tarihler: { tarih: u('Operatsiya', 'Операция', 'Операция') },
      not: qosh(u('Kosmetik genital jarrohlikning qoniqish, jinsiy funksiya va uzoq muddatli natijalari boʻyicha dalillar cheklangan; bemorga bu, shuningdek ogʻriq, qon ketish, infeksiya, chandiq, bitishma, sezgi oʻzgarishi, jinsiy aloqada ogʻriq va qayta operatsiya xavfi aytiladi (ACOG Committee Opinion No. 795, 2020).', 'Косметик генитал жарроҳликнинг қониқиш, жинсий функция ва узоқ муддатли натижалари бўйича далиллар чекланган; беморга бу, шунингдек оғриқ, қон кетиш, инфекция, чандиқ, битишма, сезги ўзгариши, жинсий алоқада оғриқ ва қайта операция хавфи айтилади (ACOG Committee Opinion No. 795, 2020).', 'Доказательства об удовлетворённости, половой функции и отдалённых результатах косметической генитальной хирургии ограничены; пациентке сообщают об этом и о рисках боли, кровотечения, инфекции, рубцов, спаек, изменения чувствительности, боли при половом акте и повторной операции (ACOG Committee Opinion No. 795, 2020).'), XALQARO),
      hastaKapisi: UZ_GE_HASTA_KAPISI,
    },
    sablonlar: { sablon: GE_SABLONLARI },
  },
  {
    anahtar: 'genital-sonuc-olcegi', roller: KD,
    metin: {
      ad: u('Natija shkalasi umumiy balli (oldin / keyin)', 'Натижа шкаласи умумий балли (олдин / кейин)', 'Сумма шкалы исходов (до / после)'),
      aciklama: u('Bemorga berilgan ruxsat etilgan shakldan FSFI, FGSIS, Qin boʻshligi soʻrovnomasi yoki COPS-L umumiy balli, amaliyotdan oldin yoki keyin. Saqlangan natijalar oʻzgarishni koʻrsatadi. Hech qaysi soʻrovnoma bandi koʻrsatilmaydi.', 'Беморга берилган рухсат этилган шаклдан FSFI, FGSIS, Қин бўшлиги сўровномаси ёки COPS-L умумий балли, амалиётдан олдин ёки кейин. Сақланган натижалар ўзгаришни кўрсатади. Ҳеч қайси сўровнома банди кўрсатилмайди.', 'Сумма FSFI, FGSIS, опросника несостоятельности влагалища или COPS-L из разрешённой формы, выданной пациентке, до или после процедуры. Сохранённые результаты показывают динамику. Пункты опросников не показываются.'),
      alanlar: { tarih: u('Sana', 'Сана', 'Дата'), olcek: u('Vosita', 'Восита', 'Инструмент'), asama: u('Bosqich', 'Босқич', 'Этап'), toplam: u('Umumiy ball', 'Умумий балл', 'Общий балл') },
      secenekler: {
        olcek: {
          fsfi: u('FSFI (Ayollar jinsiy funksiyasi indeksi), 2–36', 'FSFI (Аёллар жинсий функцияси индекси), 2–36', 'FSFI (индекс женской сексуальной функции), 2–36'),
          fgsis: u('FGSIS (Ayolning genital oʻzini idrok etish shkalasi), 7–28', 'FGSIS (Аёлнинг генитал ўзини идрок этиш шкаласи), 7–28', 'FGSIS (шкала восприятия женщиной своих гениталий), 7–28'),
          vlq: u('Qin boʻshligi soʻrovnomasi, 1–7 (rasmiy tasdiqlanmagan)', 'Қин бўшлиги сўровномаси, 1–7 (расмий тасдиқланмаган)', 'Опросник несостоятельности влагалища, 1–7 (формально не валидирован)'),
          cops_l: u('COPS-L (labioplastika uchun kosmetik amaliyot skriningi), 0–72', 'COPS-L (лабиопластика учун косметик амалиёт скрининги), 0–72', 'COPS-L (скрининговая шкала косметической процедуры для лабиопластики), 0–72'),
        },
        asama: { oncesi: u('Amaliyotdan oldin', 'Амалиётдан олдин', 'До процедуры'), sonrasi: u('Amaliyotdan keyin', 'Амалиётдан кейин', 'После процедуры'), izlem: u('Kuzatuv', 'Кузатув', 'Наблюдение') },
      },
      sayilar: { toplam: u('Umumiy ball', 'Умумий балл', 'Общий балл') },
      bantlar: {
        fsfi_kesim_alti: u('FSFI 26,55 va undan past: jinsiy disfunksiya oraligʻida (Wiegel va boshq. 2005)', 'FSFI 26,55 ва ундан паст: жинсий дисфункция оралиғида (Wiegel ва бошқ. 2005)', 'FSFI 26,55 и ниже: в диапазоне сексуальной дисфункции (Wiegel и соавт. 2005)'),
        fsfi_kesim_ustu: u('FSFI 26,55 dan yuqori', 'FSFI 26,55 дан юқори', 'FSFI выше 26,55'),
        vlq_gevsek: u('Boʻsh tomonda (1–3)', 'Бўш томонда (1–3)', 'Сторона «свободно» (1–3)'), vlq_notr: u('Na boʻsh, na tor (4)', 'На бўш, на тор (4)', 'Ни свободно, ни туго (4)'), vlq_siki: u('Tor tomonda (5–7)', 'Тор томонда (5–7)', 'Сторона «туго» (5–7)'),
        cops_l_pozitif: u('COPS-L 40 va undan yuqori', 'COPS-L 40 ва ундан юқори', 'COPS-L 40 и выше'), cops_l_negatif: u('COPS-L 40 dan past', 'COPS-L 40 дан паст', 'COPS-L ниже 40'),
      },
      uyarilar: { cops_l_pozitif: u('COPS-L umumiy balli 40 va undan yuqori: dismorfofobiya ehtimoli. Har qanday kosmetik genital amaliyotdan oldin ruhiy salomatlik mutaxassisiga yoʻnaltirishni koʻrib chiqing. Bu tashxis emas va hech narsani toʻsmaydi; qaror sizniki.', 'COPS-L умумий балли 40 ва ундан юқори: дисморфофобия эҳтимоли. Ҳар қандай косметик генитал амалиётдан олдин руҳий саломатлик мутахассисига йўналтиришни кўриб чиқинг. Бу ташхис эмас ва ҳеч нарсани тўсмайди; қарор сизники.', 'Сумма COPS-L 40 и выше: возможно дисморфическое расстройство. Рассмотрите направление к специалисту по психическому здоровью до любой косметической генитальной процедуры. Это не диагноз и ничего не блокирует; решение за вами.') },
      tarihler: { tarih: u('Ball', 'Балл', 'Балл') },
      not: u('Vositalar matni mualliflarga tegishli va tijoriy dasturda foydalanish uchun ruxsat olinmagan: hech qaysi band koʻrsatilmaydi. Tasdiqlangan oʻzbekcha yoki ruscha tarjima tekshirilmagan. Manbalar: FSFI, Rosen va boshq. 2000 (chegara Wiegel va boshq. 2005); FGSIS, Herbenick va Reece 2010; Qin boʻshligi soʻrovnomasi, Millheiser va boshq. 2010; COPS-L, Veale va boshq. 2013.', 'Воситалар матни муаллифларга тегишли ва тижорий дастурда фойдаланиш учун рухсат олинмаган: ҳеч қайси банд кўрсатилмайди. Тасдиқланган ўзбекча ёки русча таржима текширилмаган. Манбалар: FSFI, Rosen ва бошқ. 2000 (чегара Wiegel ва бошқ. 2005); FGSIS, Herbenick ва Reece 2010; Қин бўшлиги сўровномаси, Millheiser ва бошқ. 2010; COPS-L, Veale ва бошқ. 2013.', 'Текст инструментов принадлежит авторам, разрешение на использование в коммерческой программе не получено: пункты не показываются. Валидированный узбекский или русский перевод не проверен. Источники: FSFI, Rosen и соавт. 2000 (порог Wiegel и соавт. 2005); FGSIS, Herbenick и Reece 2010; опросник несостоятельности влагалища, Millheiser и соавт. 2010; COPS-L, Veale и соавт. 2013.'),
    },
  },
  {
    anahtar: 'genital-foto-onam', roller: KD,
    metin: {
      ad: u('Intim klinik suratlarga rozilik', 'Интим клиник суратларга розилик', 'Согласие на интимные клинические фотографии'),
      aciklama: u('Bemorning tibbiy hujjati uchun genital suratlarga ALOHIDA, aniq roziligi va rejalashtirilgan standart koʻrinishlar. Suratlar hech qachon avtomatik tahlilga yuborilmaydi.', 'Беморнинг тиббий ҳужжати учун генитал суратларга АЛОҲИДА, аниқ розилиги ва режалаштирилган стандарт кўринишлар. Суратлар ҳеч қачон автоматик таҳлилга юборилмайди.', 'ОТДЕЛЬНОЕ явное согласие пациентки на генитальные фотографии для её медицинской документации и запланированные стандартные проекции. Фотографии никогда не отправляются на автоматический анализ.'),
      alanlar: {
        tarih: u('Rozilik sanasi', 'Розилик санаси', 'Дата согласия'),
        belgeleme: u('Tibbiy hujjati va kuzatuv uchun suratlarga rozi', 'Тиббий ҳужжати ва кузатув учун суратларга рози', 'Согласна на фотографии для медицинской документации и наблюдения'),
        egitim_yayin: u('Shaxsi aniqlanmaydigan holda oʻqitish yoki nashr uchun ham rozi', 'Шахси аниқланмайдиган ҳолда ўқитиш ёки нашр учун ҳам рози', 'Также согласна на обезличенное использование для обучения или публикации'),
        gorunum_on_ayakta: u('Old tomondan, tik turgan holda', 'Олд томондан, тик турган ҳолда', 'Спереди, стоя'),
        gorunum_litotomi_istirahat: u('Litotomiya, tinch holatda', 'Литотомия, тинч ҳолатда', 'Литотомия, в покое'),
        gorunum_litotomi_ayrilmis: u('Litotomiya, lablar ehtiyotkorlik bilan ajratilgan', 'Литотомия, лаблар эҳтиёткорлик билан ажратилган', 'Литотомия, губы осторожно разведены'),
        gorunum_perine: u('Oraliq', 'Оралиқ', 'Промежность'),
        gorunum_yakin_plan: u('Davolangan sohaning yaqin plani', 'Даволанган соҳанинг яқин плани', 'Крупный план обработанной зоны'),
        not: u('Izoh', 'Изоҳ', 'Примечание'),
      },
      uyarilar: { egitim_yayin_onayi: u('Oʻqitish yoki nashrga rozilik yozildi: faqat shaxsi aniqlanmaydigan suratlardan va faqat rozilik berilgan maqsadda foydalaning.', 'Ўқитиш ёки нашрга розилик ёзилди: фақат шахси аниқланмайдиган суратлардан ва фақат розилик берилган мақсадда фойдаланинг.', 'Записано согласие на обучение или публикацию: используйте только обезличенные изображения и только для оговорённой цели.') },
      tarihler: { tarih: u('Rozilik', 'Розилик', 'Согласие') },
      not: u('Suratga rozilik amaliyotga rozilikdan alohida va istalgan vaqtda qaytarib olinishi mumkin. Suratlar tibbiy hujjat: shifrlangan holda saqlanadi, faqat zarur boʻlganda koʻriladi, avtomatik tahlilga yuborilmaydi va siz qoʻshmaguningizcha eksportga kirmaydi.', 'Суратга розилик амалиётга розиликдан алоҳида ва исталган вақтда қайтариб олиниши мумкин. Суратлар тиббий ҳужжат: шифрланган ҳолда сақланади, фақат зарур бўлганда кўрилади, автоматик таҳлилга юборилмайди ва сиз қўшмагунингизча экспортга кирмайди.', 'Согласие на фотографии отдельно от согласия на процедуру и может быть отозвано в любое время. Фотографии — медицинская документация: хранятся в зашифрованном виде, просматриваются только при необходимости, не отправляются на автоматический анализ и не входят в экспорт, пока вы их не добавите.'),
    },
  },
]

/** The tools Uzbekistan does not offer yet, and the item-level instruments: slots (English, like ./yuvalar.ts). */
const SABABSIZ = 'No source of the Ministry of Health of Uzbekistan was read in this session'
export const UZ_GE_YUVALARI: readonly AracYuvasi[] = [
  { anahtar: 'genital-enerji-seansi', acik: false, icerik: null, mekanizmaHazir: true, roller: KD, kimden: 'a lawyer in Uzbekistan, with the local clinical lead', eksik: `NOT OFFERED IN UZBEKISTAN YET. ${SABABSIZ} on the registration of laser or radiofrequency devices for a vaginal use. International position: Food and Drug Administration safety communication of 30 July 2018 (no device authorised for vaginal "rejuvenation"; burns, scarring and pain reported).` },
  { anahtar: 'genital-enjeksiyon', acik: false, icerik: null, mekanizmaHazir: true, roller: KD, kimden: 'a lawyer in Uzbekistan, with the local clinical lead', eksik: `NOT OFFERED IN UZBEKISTAN YET. ${SABABSIZ} on fillers or PRP for genital use, or on who may inject them.` },
  { anahtar: 'genital-beyazlatma', acik: false, icerik: null, mekanizmaHazir: true, roller: KD, kimden: 'a lawyer in Uzbekistan, with the local clinical lead', eksik: `NOT OFFERED IN UZBEKISTAN YET. ${SABABSIZ} on cosmetology licensing for genital procedures.` },
  { anahtar: 'genital-fsfi-items', acik: false, icerik: null, mekanizmaHazir: false, roller: KD, kimden: 'the rights holder of the questionnaire, through the owner; the local clinical lead confirms the versions', eksik: 'Item-level entry of the FSFI: its wording belongs to its author (Raymond C. Rosen); no permission for commercial software and no validated Uzbek or Russian version verified. Only the total is recorded.', lisans: { durum: 'izin-gerekli', hakSahibi: 'Raymond C. Rosen (FSFI)' } },
  { anahtar: 'genital-fgsis-items', acik: false, icerik: null, mekanizmaHazir: false, roller: KD, kimden: 'the rights holder of the questionnaire, through the owner; the local clinical lead confirms the versions', eksik: 'Item-level entry of the FGSIS: terms for commercial software not found; no validated Uzbek or Russian version verified. Only the total is recorded.', lisans: { durum: 'belirsiz', hakSahibi: 'Debby Herbenick, Michael Reece' } },
  { anahtar: 'genital-vlq-item', acik: false, icerik: null, mekanizmaHazir: false, roller: KD, kimden: 'the rights holder of the questionnaire, through the owner; the local clinical lead confirms the versions', eksik: 'The Vaginal Laxity Questionnaire item: not formally validated, terms unclear, no validated translation. Only the total is recorded.', lisans: { durum: 'belirsiz', hakSahibi: 'Millheiser et al. (2010)' } },
  { anahtar: 'genital-cops-l-items', acik: false, icerik: null, mekanizmaHazir: false, roller: KD, kimden: 'the rights holder of the questionnaire, through the owner; the local clinical lead confirms the versions', eksik: 'Item-level entry of COPS-L: copyright D. Veale; translations need the holders\' permission. Only the total is recorded.', lisans: { durum: 'izin-gerekli', hakSahibi: 'David Veale' } },
]
