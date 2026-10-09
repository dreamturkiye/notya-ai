/**
 * NOTYA-ULKE-ARACLAR-01 — Uzbekistan: ROLE TOOLS, first part, in the order of the pack's role list:
 * emergency medicine (acil-tip), anaesthesiology (anestezi), neurosurgery (beyin-cerrahisi).
 *
 * Every tool names the roles that see it. A tool of one role is on no other role's grid and does not open from its
 * address for another role (lib/ulke/araclar/paket.ts). MACHINE-WRITTEN. AWAITS NATIVE REVIEW (see ./index.ts).
 */
import type { PaketAraci } from '@/lib/ulke/araclar/tipler'
import { BELGILANGAN_BANDLAR, BELGILANGAN_BELGILAR, DOZASIZ, KARAR, KEYINGI_NAZORAT, KEYINGI_NAZORAT_SANASI, ayni, kendiAdi, u, vazifa } from './yardimci'

export const UZ_ROL_ARACLARI_1: readonly PaketAraci[] = [
  // ── emergency medicine. Not for cardiology, neurology or family medicine: triage of an emergency department. ──
  {
    anahtar: 'esi-triyaj', roller: ['acil-tip'],
    metin: {
      ad: u('ESI triaj darajasi', 'ESI триаж даражаси', 'Уровень триажа ESI'),
      aciklama: u('Siz tanlagan ESI darajasi (1–5) va kutilayotgan resurslar qayd qilinadi. Darajani vosita hisoblamaydi.', 'Сиз танлаган ESI даражаси (1–5) ва кутилаётган ресурслар қайд қилинади. Даражани восита ҳисобламайди.', 'Фиксируются выбранный вами уровень ESI (1–5) и ожидаемые ресурсы. Уровень инструмент не рассчитывает.'),
      alanlar: {
        seviye: u('ESI darajasi', 'ESI даражаси', 'Уровень ESI'),
        resus_hemen: u('Zudlik bilan hayotni saqlab qoluvchi aralashuv kerak', 'Зудлик билан ҳаётни сақлаб қолувчи аралашув керак', 'Требуется немедленное жизнеспасающее вмешательство'),
        yuksek_risk: u('Yuqori xavfli holat yoki hayotiy koʻrsatkichlarga tahdid shubhasi', 'Юқори хавфли ҳолат ёки ҳаётий кўрсаткичларга таҳдид шубҳаси', 'Ситуация высокого риска или подозрение на угрозу жизненным функциям'),
        siddetli_agri_distress: u('Kuchli ogʻriq yoki distress', 'Кучли оғриқ ёки дистресс', 'Сильная боль или дистресс'),
        coklu_kaynak: u('Bir nechta resurs kutilmoqda (tekshiruv, muolaja)', 'Бир нечта ресурс кутилмоқда (текширув, муолажа)', 'Ожидается несколько ресурсов (обследования, процедуры)'),
        tek_kaynak: u('Bitta resurs kutilmoqda', 'Битта ресурс кутилмоқда', 'Ожидается один ресурс'),
        kaynak_yok: u('Resurs kerak emas', 'Ресурс керак эмас', 'Ресурсы не требуются'),
      },
      secenekler: { seviye: kendiAdi(['1', '2', '3', '4', '5']) },
      bantlar: {
        esi1: u('ESI 1 — reanimatsiya', 'ESI 1 — реанимация', 'ESI 1 — реанимация'),
        esi2: u('ESI 2 — oʻta shoshilinch', 'ESI 2 — ўта шошилинч', 'ESI 2 — экстренный'),
        esi3: u('ESI 3 — shoshilinch', 'ESI 3 — шошилинч', 'ESI 3 — срочный'),
        esi4: u('ESI 4 — kamroq shoshilinch', 'ESI 4 — камроқ шошилинч', 'ESI 4 — менее срочный'),
        esi5: u('ESI 5 — shoshilinch emas', 'ESI 5 — шошилинч эмас', 'ESI 5 — несрочный'),
      },
      uyarilar: {
        yeniden_degerlendirme: vazifa('qayta baholash va hayotiy koʻrsatkichlarni kuzatish', 'қайта баҳолаш ва ҳаётий кўрсаткичларни кузатиш', 'повторная оценка и наблюдение за жизненными показателями'),
        resus_takip: vazifa('reanimatsiya va intensiv kuzatuv', 'реанимация ва интенсив кузатув', 'реанимация и интенсивное наблюдение'),
      },
      not: KARAR,
    },
  },
  {
    anahtar: 'kritik-yol', roller: ['acil-tip'],
    metin: {
      ad: u('Kritik holatlar nazorat roʻyxati', 'Критик ҳолатлар назорат рўйхати', 'Контрольный список критических состояний'),
      aciklama: u('Qaysi kritik yoʻnalish belgilangani va qaysi bandlar bajarilgani qayd qilinadi.', 'Қайси критик йўналиш белгилангани ва қайси бандлар бажарилгани қайд қилинади.', 'Фиксируется, какой критический путь отмечен и какие пункты выполнены.'),
      alanlar: {
        stemi: u('ST koʻtarilishli miokard infarkti yoki oʻtkir koronar sindrom shubhasi', 'ST кўтарилишли миокард инфаркти ёки ўткир коронар синдром шубҳаси', 'Подозрение на инфаркт миокарда с подъёмом ST или острый коронарный синдром'),
        inme: u('Insult yoki tranzitor ishemik hujum shubhasi', 'Инсульт ёки транзитор ишемик ҳужум шубҳаси', 'Подозрение на инсульт или транзиторную ишемическую атаку'),
        travma: u('Ogʻir shikastlanish', 'Оғир шикастланиш', 'Тяжёлая травма'),
        sepsis: u('Sepsis shubhasi', 'Сепсис шубҳаси', 'Подозрение на сепсис'),
        hava_yolu: u('Nafas yoʻllari yoki nafasning kritik buzilishi', 'Нафас йўллари ёки нафаснинг критик бузилиши', 'Критическое нарушение проходимости дыхательных путей или дыхания'),
        saat_kaydi: u('Simptom yoki hodisa boshlangan vaqt qayd qilindi', 'Симптом ёки ҳодиса бошланган вақт қайд қилинди', 'Зафиксировано время появления симптомов или события'),
        ekg_10dk: u('Erta EKG rejalashtirildi (talqin shifokorda)', 'Эрта ЭКГ режалаштирилди (талқин шифокорда)', 'Запланирована ранняя ЭКГ (интерпретация за врачом)'),
        noroloji_skala: u('Maqsadli nevrologik baholash qayd qilindi', 'Мақсадли неврологик баҳолаш қайд қилинди', 'Зафиксирована целевая неврологическая оценка'),
        goruntu_plan: u('Tasviriy tekshiruv rejalashtirildi', 'Тасвирий текширув режалаштирилди', 'Запланирована визуализация'),
        travma_primer: u('Birlamchi koʻrik oʻtkazildi (ABCDE)', 'Бирламчи кўрик ўтказилди (ABCDE)', 'Проведён первичный осмотр (ABCDE)'),
        kan_kultur: u('Infeksiya yoki sepsis boʻyicha chora-tadbirlar boshlandi (dozani shifokor belgilaydi)', 'Инфекция ёки сепсис бўйича чора-тадбирлар бошланди (дозани шифокор белгилайди)', 'Начаты мероприятия при инфекции или сепсисе (дозы определяет врач)'),
        hava_yolu_hazir: u('Nafas yoʻllari uchun jihozlar tayyor, yordam chaqirildi', 'Нафас йўллари учун жиҳозлар тайёр, ёрдам чақирилди', 'Оборудование для дыхательных путей готово, помощь вызвана'),
        hekim_yonlendirme: u('Yoʻllanma, konsultatsiya yoki yotqizish boʻyicha qarorni shifokor qabul qildi', 'Йўлланма, консультация ёки ётқизиш бўйича қарорни шифокор қабул қилди', 'Решение о направлении, консультации или госпитализации принято врачом'),
      },
      sayilar: {
        yol: u('Belgilangan kritik yoʻnalishlar', 'Белгиланган критик йўналишлар', 'Отмечено критических путей'),
        madde: u('Bajarilgan bandlar', 'Бажарилган бандлар', 'Выполнено пунктов'),
      },
      not: DOZASIZ,
    },
  },

  // ── anaesthesiology. Not for surgery roles: the anaesthetist's own assessment before and after an operation. ──
  {
    anahtar: 'asa-preop', roller: ['anestezi'],
    metin: {
      ad: u('ASA va operatsiyadan oldingi nazorat roʻyxati', 'ASA ва операциядан олдинги назорат рўйхати', 'ASA и предоперационный контрольный список'),
      aciklama: u('Anesteziyadan oldingi baholash bandlari va siz belgilagan ASA jismoniy holat klassi.', 'Анестезиядан олдинги баҳолаш бандлари ва сиз белгилаган ASA жисмоний ҳолат класси.', 'Пункты преданестезиологической оценки и указанный вами класс физического статуса ASA.'),
      alanlar: {
        asa_sinif: u('ASA klassi (ixtiyoriy)', 'ASA класси (ихтиёрий)', 'Класс ASA (необязательно)'),
        anamnez_tamam: u('Anesteziologik anamnez yigʻildi', 'Анестезиологик анамнез йиғилди', 'Анестезиологический анамнез собран'),
        asa_siniflandirma: u('ASA jismoniy holat klassi qayd qilindi', 'ASA жисмоний ҳолат класси қайд қилинди', 'Класс физического статуса ASA зафиксирован'),
        acil_lab_goruntu: u('Kerakli laboratoriya va tasviriy tekshiruvlar sanasi belgilandi', 'Керакли лаборатория ва тасвирий текширувлар санаси белгиланди', 'Назначена дата необходимых лабораторных исследований и визуализации'),
        aclik_onam: u('Och qolish qoidalari va xabardor qilingan rozilik koʻrib chiqildi', 'Оч қолиш қоидалари ва хабардор қилинган розилик кўриб чиқилди', 'Обсуждены правила голодания и информированное согласие'),
        alerji_ilac_listesi: u('Allergiya va qabul qilinayotgan dorilar roʻyxati bemor bilan tekshirildi', 'Аллергия ва қабул қилинаётган дорилар рўйхати бемор билан текширилди', 'Аллергии и список принимаемых лекарств уточнены с пациентом'),
        hava_yolu_degerlendirme: u('Nafas yoʻllari baholandi', 'Нафас йўллари баҳоланди', 'Дыхательные пути оценены'),
        kardiyopulmoner_risk: u('Yurak va oʻpka tomonidan xavf omillari koʻrib chiqildi', 'Юрак ва ўпка томонидан хавф омиллари кўриб чиқилди', 'Оценены факторы сердечно-лёгочного риска'),
        kontrol_randevu: u('Operatsiyadan oldingi yoki nazorat qabuli belgilandi', 'Операциядан олдинги ёки назорат қабули белгиланди', 'Назначен предоперационный или контрольный приём'),
      },
      secenekler: { asa_sinif: kendiAdi(['I', 'II', 'III', 'IV', 'V', 'E']) },
      sayilar: { isaretli: BELGILANGAN_BANDLAR },
      bantlar: { I: ayni('ASA I'), II: ayni('ASA II'), III: ayni('ASA III'), IV: ayni('ASA IV'), V: ayni('ASA V'), E: ayni('ASA E') },
      uyarilar: {
        kontrol_randevu: vazifa('nazorat qabuli', 'назорат қабули', 'контрольный приём'),
        acil_lab_goruntu: vazifa('tekshiruv natijalari', 'текширув натижалари', 'результаты исследований'),
        hava_yolu_degerlendirme: vazifa('nafas yoʻllari boʻyicha qayd', 'нафас йўллари бўйича қайд', 'запись о дыхательных путях'),
        alerji_ilac_listesi: vazifa('allergiya va dorilar roʻyxati', 'аллергия ва дорилар рўйхати', 'аллергии и список лекарств'),
      },
      not: DOZASIZ,
    },
  },
  {
    anahtar: 'hava-yolu-notu', roller: ['anestezi'],
    metin: {
      ad: u('Nafas yoʻllari boʻyicha qayd', 'Нафас йўллари бўйича қайд', 'Запись о дыхательных путях'),
      aciklama: u('Nafas yoʻllarini baholashda aniqlangan belgilar va keyingi nazorat sanasi.', 'Нафас йўлларини баҳолашда аниқланган белгилар ва кейинги назорат санаси.', 'Признаки, выявленные при оценке дыхательных путей, и дата следующего контроля.'),
      alanlar: {
        mallampati_kaydi: u('Mallampati klassi va ogʻiz ochilishi qayd qilindi', 'Маллампати класси ва оғиз очилиши қайд қилинди', 'Зафиксированы класс по Маллампати и открывание рта'),
        zor_hava_yolu_bayrak: u('Qiyin nafas yoʻllari ehtimoli belgilandi', 'Қийин нафас йўллари эҳтимоли белгиланди', 'Отмечена вероятность трудных дыхательных путей'),
        boyun_hareket_kisit: u('Boʻyin harakatchanligi cheklangan', 'Бўйин ҳаракатчанлиги чекланган', 'Ограничена подвижность шеи'),
        dis_protez_notu: u('Tishlar, protez yoki qimirlaydigan tishlar boʻyicha qayd bor', 'Тишлар, протез ёки қимирлайдиган тишлар бўйича қайд бор', 'Есть запись о зубах, протезах или подвижных зубах'),
        obezite_osahs: u('Semizlik yoki uyqudagi obstruktiv apnoe xavfi', 'Семизлик ёки уйқудаги обструктив апноэ хавфи', 'Ожирение или риск обструктивного апноэ сна'),
        onceki_zor_entubasyon: u('Anamnezda qiyin intubatsiya', 'Анамнезда қийин интубация', 'Трудная интубация в анамнезе'),
        tarih: KEYINGI_NAZORAT_SANASI,
      },
      sayilar: { isaretli: BELGILANGAN_BELGILAR },
      tarihler: { tarih: KEYINGI_NAZORAT },
      not: DOZASIZ,
    },
  },
  {
    anahtar: 'postop-agri', roller: ['anestezi'],
    metin: {
      ad: u('Operatsiyadan keyingi ogʻriqni kuzatish', 'Операциядан кейинги оғриқни кузатиш', 'Наблюдение за послеоперационной болью'),
      aciklama: u('Ogʻriq balli (0–10), kuzatuv belgilari va keyingi nazorat sanasi. Dori va doza yozilmaydi.', 'Оғриқ балли (0–10), кузатув белгилари ва кейинги назорат санаси. Дори ва доза ёзилмайди.', 'Оценка боли (0–10), признаки для наблюдения и дата следующего контроля. Препараты и дозы не указываются.'),
      alanlar: {
        agri_skala_kaydi: u('Ogʻriq balli qayd qilindi', 'Оғриқ балли қайд қилинди', 'Оценка боли зафиксирована'),
        bolgesel_agri: u('Operatsiya sohasidagi ogʻriq kuzatilmoqda', 'Операция соҳасидаги оғриқ кузатилмоқда', 'Наблюдается боль в области операции'),
        bulanti_kusma: u('Koʻngil aynishi yoki qusish kuzatilmoqda', 'Кўнгил айниши ёки қусиш кузатилмоқда', 'Наблюдаются тошнота или рвота'),
        sedasyon_izlem: u('Sedatsiya va ong darajasi kuzatilmoqda', 'Седация ва онг даражаси кузатилмоқда', 'Ведётся наблюдение за седацией и уровнем сознания'),
        analjezi_plan_hatirlat: u('Ogʻriqsizlantirish rejasi eslatildi (dozani shifokor belgilaydi)', 'Оғриқсизлантириш режаси эслатилди (дозани шифокор белгилайди)', 'Напомнено о плане обезболивания (дозы определяет врач)'),
        kontrol_agri_randevu: u('Ogʻriq boʻyicha nazorat qabuli belgilandi', 'Оғриқ бўйича назорат қабули белгиланди', 'Назначен контрольный приём по поводу боли'),
        agri_skor: u('Ogʻriq balli, 0 dan 10 gacha (ixtiyoriy)', 'Оғриқ балли, 0 дан 10 гача (ихтиёрий)', 'Оценка боли от 0 до 10 (необязательно)'),
        tarih: KEYINGI_NAZORAT_SANASI,
      },
      sayilar: { isaretli: BELGILANGAN_BELGILAR, agri_skor: u('Ogʻriq balli', 'Оғриқ балли', 'Оценка боли') },
      tarihler: { tarih: KEYINGI_NAZORAT },
      not: DOZASIZ,
    },
  },

  // ── neurosurgery. Not for neurology (its own follow-up tools) and not for general surgery. ──
  {
    anahtar: 'noro-postop', roller: ['beyin-cerrahisi'],
    metin: {
      ad: u('Neyroxirurgik operatsiyadan keyingi nazorat roʻyxati', 'Нейрохирургик операциядан кейинги назорат рўйхати', 'Контрольный список после нейрохирургической операции'),
      aciklama: u('Operatsiyadan keyingi kuzatuv bandlari. Dori dozalari yozilmaydi.', 'Операциядан кейинги кузатув бандлари. Дори дозалари ёзилмайди.', 'Пункты послеоперационного наблюдения. Дозы препаратов не указываются.'),
      alanlar: {
        yara_kontrol: u('Operatsiya jarohati, drenaj va bogʻlam tekshirildi', 'Операция жароҳати, дренаж ва боғлам текширилди', 'Осмотрены операционная рана, дренаж и повязка'),
        norolojik_muayene: u('Maqsadli nevrologik koʻrik qayd qilindi', 'Мақсадли неврологик кўрик қайд қилинди', 'Зафиксирован целевой неврологический осмотр'),
        agri_skalasi: u('Ogʻriq balli qayd qilindi', 'Оғриқ балли қайд қилинди', 'Оценка боли зафиксирована'),
        dvt_profilaksi_hatirlat: u('Chuqur venalar trombozi profilaktikasi eslatildi (dozani shifokor belgilaydi)', 'Чуқур веналар тромбози профилактикаси эслатилди (дозани шифокор белгилайди)', 'Напомнено о профилактике тромбоза глубоких вен (дозы определяет врач)'),
        steroid_azaltma_izlem: u('Steroidni kamaytirish boʻyicha nazorat sanasi belgilandi (dozani shifokor belgilaydi)', 'Стероидни камайтириш бўйича назорат санаси белгиланди (дозани шифокор белгилайди)', 'Назначена дата контроля снижения дозы стероидов (дозы определяет врач)'),
        goruntu_kontrol: u('Nazorat tasviriy tekshiruvi rejalashtirildi', 'Назорат тасвирий текшируви режалаштирилди', 'Запланирована контрольная визуализация'),
        taburcu_egitim: u('Chiqarishdan oldin bemorga uyda nimaga eʼtibor berish tushuntirildi', 'Чиқаришдан олдин беморга уйда нимага эътибор бериш тушунтирилди', 'Перед выпиской пациенту объяснено, на что обращать внимание дома'),
        kontrol_randevu: u('Nazorat qabuli belgilandi', 'Назорат қабули белгиланди', 'Назначен контрольный приём'),
      },
      sayilar: { isaretli: BELGILANGAN_BANDLAR },
      uyarilar: {
        goruntu_kontrol: vazifa('nazorat tasviriy tekshiruvi', 'назорат тасвирий текшируви', 'контрольная визуализация'),
        kontrol_randevu: vazifa('nazorat qabuli', 'назорат қабули', 'контрольный приём'),
        yara_kontrol: vazifa('jarohatni tekshirish', 'жароҳатни текшириш', 'осмотр раны'),
      },
      not: DOZASIZ,
    },
  },
  {
    anahtar: 'nobet-bilinc', roller: ['beyin-cerrahisi'],
    metin: {
      ad: u('Tutqanoq va ong holatini kuzatish', 'Тутқаноқ ва онг ҳолатини кузатиш', 'Наблюдение за приступами и сознанием'),
      aciklama: u('Kuzatilgan belgilar va keyingi nazorat sanasi. Tashxis va dori dozasi yozilmaydi.', 'Кузатилган белгилар ва кейинги назорат санаси. Ташхис ва дори дозаси ёзилмайди.', 'Наблюдаемые признаки и дата следующего контроля. Диагноз и дозы препаратов не указываются.'),
      alanlar: {
        nobet_gozlemi: u('Tutqanoq kuzatildi va qayd qilindi', 'Тутқаноқ кузатилди ва қайд қилинди', 'Приступ наблюдался и зафиксирован'),
        bilinc_degisikligi: u('Ong darajasi oʻzgarishi kuzatilmoqda', 'Онг даражаси ўзгариши кузатилмоқда', 'Наблюдается изменение уровня сознания'),
        glasgow_kaydi: u('Glazgo koma shkalasi boʻyicha ball qayd qilindi', 'Глазго кома шкаласи бўйича балл қайд қилинди', 'Зафиксирована оценка по шкале комы Глазго'),
        pupil_asimetri: u('Qorachiqlar asimmetriyasi yoki yorugʻlikka reaksiyasi boʻyicha qayd bor', 'Қорачиқлар асимметрияси ёки ёруғликка реакцияси бўйича қайд бор', 'Есть запись об асимметрии зрачков или их реакции на свет'),
        yeni_fokal_bulgu: u('Yangi oʻchoqli belgi kuzatilmoqda', 'Янги ўчоқли белги кузатилмоқда', 'Наблюдается новый очаговый симптом'),
        ilac_uyumu_hatirlat: u('Dori qabul qilish tartibiga rioya qilish eslatildi', 'Дори қабул қилиш тартибига риоя қилиш эслатилди', 'Напомнено о соблюдении режима приёма лекарств'),
        tarih: KEYINGI_NAZORAT_SANASI,
      },
      sayilar: { isaretli: BELGILANGAN_BELGILAR },
      tarihler: { tarih: KEYINGI_NAZORAT },
      not: DOZASIZ,
    },
  },
]
