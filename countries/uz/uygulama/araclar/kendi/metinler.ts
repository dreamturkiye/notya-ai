/**
 * NOTYA-ULKE-UYGULA-UZ — Uzbekistan: THE WORDS, THE ROLES AND THE LICENCE of the three tools only Uzbekistan has
 * (their mechanisms and their sources: ./tanimlar.ts).
 *
 * MACHINE-WRITTEN. AWAITS NATIVE REVIEW (see ../index.ts). Uzbek in Latin script and Russian were written by a
 * machine; Uzbek in Cyrillic script is what the rule gives for the Latin text (scripts/uz-kiril.mjs; held to it by
 * ../kiril.test.ts). The ultrasound examination is written by its abbreviation (UTT / УТТ / УЗИ), because the rule
 * would misspell the word written out. No native reader and no clinician has read a word of it.
 * docs/COUNTRY-PACK-UZBEKISTAN.md lists every text.
 *
 * WHO SEES WHICH, as the tools audit of 2026-10-10 decided (docs/araclar-denetim/uz-kararlar.json → addTools):
 *   uz-tana-vazni-indeksi     every DOCTOR role (`sinif: 'hekimler'`: the 40 roles that are not an allied profession),
 *                             and only for a patient aged 20 or older (./tanimlar.ts → UZ_TVI_ENG_KICHIK_YOSH)
 *   uz-homiladorlik-muddati   obstetrics and gynaecology, family medicine
 *   uz-emlash-qaydi           paediatrics, family medicine
 * Not one of them is a base tool: an allied profession and an account without a role see none.
 *
 * LICENCE — what "serbest" (free to implement) rests on here, and how far it was read (2026-10-10):
 *   the index      the calculation and the adult classes as the Centers for Disease Control and Prevention print
 *                  them; the agency's own notice says its material "is in the public domain"
 *                  (https://cdc.gov/other/agencymaterials.html). The national protocol prints the same limits.
 *   the dates      a rule of counting days out of a protocol of the Ministry of Health. THE PROTOCOL CARRIES NO
 *                  NOTICE OF ITS OWN. What was read is the state's law: No. OʻRQ-42 of 20.07.2006, article 8 (official
 *                  documents are not objects of copyright) and article 5 (no copyright in a method),
 *                  https://lex.uz/en/acts/-1022944. No wording of the protocol is on a screen.
 *   the record     the product's own list of five fields. It holds nothing of a third party; the national calendar
 *                  of vaccinations is not in it.
 * THIS IS A MACHINE'S READING, NOT A LAWYER'S: ./onay.ts lists it among what a person has to confirm.
 */
import type { PaketAraci } from '@/lib/ulke/araclar/tipler'
import { UZ_HEKIM_ROLLERI } from '../../../klinik/rolListesi'
import { u } from '../yardimci'
import { UZ_TVI_ENG_KICHIK_YOSH } from './tanimlar'

export const UZ_KENDI_ARACLAR: readonly PaketAraci[] = [
  {
    // EVERY DOCTOR ROLE (the audit's core set), never an allied profession; adults of 20 and over only.
    anahtar: 'uz-tana-vazni-indeksi', roller: UZ_HEKIM_ROLLERI, sinif: 'hekimler',
    metin: {
      ad: u('Tana vazni indeksi', 'Тана вазни индекси', 'Индекс массы тела'),
      aciklama: u('Vazn va boʻydan tana vazni indeksini hisoblaydi va uni kattalar uchun toʻrt toifadan biriga kiritadi. Bel aylanasi faqat qayd etiladi.', 'Вазн ва бўйдан тана вазни индексини ҳисоблайди ва уни катталар учун тўрт тоифадан бирига киритади. Бел айланаси фақат қайд этилади.', 'Рассчитывает индекс массы тела по массе тела и росту и относит его к одной из четырёх категорий для взрослых. Окружность талии только записывается.'),
      alanlar: {
        vazn: u('Vazn', 'Вазн', 'Масса тела'),
        boy: u('Boʻy', 'Бўй', 'Рост'),
        bel: u('Bel aylanasi (ixtiyoriy)', 'Бел айланаси (ихтиёрий)', 'Окружность талии (необязательно)'),
      },
      sayilar: { tvi: u('Tana vazni indeksi', 'Тана вазни индекси', 'Индекс массы тела') },
      bantlar: {
        kam: u('Vazn yetishmasligi (18,5 dan past)', 'Вазн етишмаслиги (18,5 дан паст)', 'Недостаточная масса тела (менее 18,5)'),
        meyor: u('Meʼyoriy vazn (18,5–24,9)', 'Меъёрий вазн (18,5–24,9)', 'Нормальная масса тела (18,5–24,9)'),
        ortiqcha: u('Ortiqcha vazn (25,0–29,9)', 'Ортиқча вазн (25,0–29,9)', 'Избыточная масса тела (25,0–29,9)'),
        semizlik: u('Semizlik (30 va undan yuqori)', 'Семизлик (30 ва ундан юқори)', 'Ожирение (30 и более)'),
      },
      not: u('Hisoblash vositasi: toifalar kattalar uchun, bel aylanasi baholanmaydi. Tashxis va davolash qarori shifokorniki.', 'Ҳисоблаш воситаси: тоифалар катталар учун, бел айланаси баҳоланмайди. Ташхис ва даволаш қарори шифокорники.', 'Расчётный инструмент: категории предназначены для взрослых, окружность талии не оценивается. Диагноз и лечение определяет врач.'),
      hastaKapisi: u('Bu vosita 20 yosh va undan katta bemorlar uchun.', 'Бу восита 20 ёш ва ундан катта беморлар учун.', 'Этот инструмент предназначен для пациентов в возрасте 20 лет и старше.'),
    },
    hasta: { enAzYas: UZ_TVI_ENG_KICHIK_YOSH },
    lisans: { durum: 'serbest', kaynak: 'Centers for Disease Control and Prevention, "Use of Agency Materials" (https://cdc.gov/other/agencymaterials.html, read 2026-10-10): the calculation and the adult categories as the agency prints them are in the public domain. A machine\'s reading, not a lawyer\'s.' },
  },
  {
    anahtar: 'uz-homiladorlik-muddati', roller: ['kadin-hastaliklari-dogum', 'aile-hekimligi'],
    metin: {
      ad: u('Homiladorlik muddati va tugʻruq sanasi', 'Ҳомиладорлик муддати ва туғруқ санаси', 'Срок беременности и дата родов'),
      aciklama: u('Oxirgi hayzning birinchi kunidan yoki embrion koʻchirilgan kundan taxminiy tugʻruq sanasini va bugungi homiladorlik muddatini hisoblaydi.', 'Охирги ҳайзнинг биринчи кунидан ёки эмбрион кўчирилган кундан тахминий туғруқ санасини ва бугунги ҳомиладорлик муддатини ҳисоблайди.', 'Рассчитывает предполагаемую дату родов и срок беременности на сегодня от первого дня последней менструации или от даты переноса эмбриона.'),
      alanlar: {
        usul: u('Hisoblash asosi', 'Ҳисоблаш асоси', 'Основа расчёта'),
        oxirgi_hayz: u('Oxirgi hayzning birinchi kuni', 'Охирги ҳайзнинг биринчи куни', 'Первый день последней менструации'),
        sikl: u('Hayz sikli', 'Ҳайз цикли', 'Менструальный цикл'),
        uzi_tugish: u('UTT (11–14 hafta) boʻyicha tugʻruq sanasi (ixtiyoriy)', 'УТТ (11–14 ҳафта) бўйича туғруқ санаси (ихтиёрий)', 'Дата родов по УЗИ в 11–14 недель (необязательно)'),
        kochirish: u('Embrion koʻchirilgan sana', 'Эмбрион кўчирилган сана', 'Дата переноса эмбриона'),
        kultivatsiya: u('Embrion oʻstirilgan muddat', 'Эмбрион ўстирилган муддат', 'Срок культивирования эмбриона'),
      },
      secenekler: {
        usul: {
          hayz: u('Oxirgi hayz sanasi', 'Охирги ҳайз санаси', 'Дата последней менструации'),
          yrt: u('Yordamchi reproduktiv texnologiyalar: embrion koʻchirish', 'Ёрдамчи репродуктив технологиялар: эмбрион кўчириш', 'Вспомогательные репродуктивные технологии: перенос эмбриона'),
        },
        sikl: {
          yigirma_sakkiz: u('28 kunlik', '28 кунлик', '28-дневный'),
          boshqa: u('Boshqa davomiylik', 'Бошқа давомийлик', 'Другая продолжительность'),
        },
      },
      sayilar: {
        hafta: u('Homiladorlik muddati (toʻliq haftalar)', 'Ҳомиладорлик муддати (тўлиқ ҳафталар)', 'Срок беременности (полных недель)'),
        kun: u('Toʻliq haftalardan tashqari kunlar', 'Тўлиқ ҳафталардан ташқари кунлар', 'Дней сверх полных недель'),
        farq: u('Hayz va UTT boʻyicha sanalar farqi', 'Ҳайз ва УТТ бўйича саналар фарқи', 'Расхождение дат по менструации и по УЗИ'),
      },
      bantlar: {
        hayz_boyicha: u('Sana oxirgi hayz boʻyicha belgilandi', 'Сана охирги ҳайз бўйича белгиланди', 'Дата установлена по последней менструации'),
        uzi_boyicha: u('Farq 5 kundan ortiq: sana UTT boʻyicha belgilandi', 'Фарқ 5 кундан ортиқ: сана УТТ бўйича белгиланди', 'Расхождение более 5 дней: дата установлена по данным УЗИ'),
        yrt_boyicha: u('Sana embrion koʻchirilgan kun boʻyicha belgilandi', 'Сана эмбрион кўчирилган кун бўйича белгиланди', 'Дата установлена по дате переноса эмбриона'),
      },
      uyarilar: {
        sikl_tuzatilmagan: u('Sikl 28 kunlik emas: 280 kun 28 kunlik sikl uchun berilgan, vosita tuzatish kiritmadi.', 'Цикл 28 кунлик эмас: 280 кун 28 кунлик цикл учун берилган, восита тузатиш киритмади.', 'Цикл не 28-дневный: 280 дней указаны для 28-дневного цикла, инструмент поправку не внёс.'),
        muddat_otgan: u('Taxminiy tugʻruq sanasi oʻtgan.', 'Тахминий туғруқ санаси ўтган.', 'Предполагаемая дата родов уже прошла.'),
      },
      tarihler: { tugish: u('Taxminiy tugʻruq sanasi', 'Тахминий туғруқ санаси', 'Предполагаемая дата родов') },
      not: u('Faqat sana hisobi: oxirgi hayzning birinchi kunidan 280 kun (40 hafta) yoki koʻchirish sanasidan 266 kun, embrion oʻstirilgan kunlar ayirilgan holda. Tashrif va tekshiruvlar jadvali bu yerda yoʻq; qaror shifokorniki.', 'Фақат сана ҳисоби: охирги ҳайзнинг биринчи кунидан 280 кун (40 ҳафта) ёки кўчириш санасидан 266 кун, эмбрион ўстирилган кунлар айирилган ҳолда. Ташриф ва текширувлар жадвали бу ерда йўқ; қарор шифокорники.', 'Только расчёт дат: 280 дней (40 недель) от первого дня последней менструации либо 266 дней от даты переноса за вычетом дней культивирования эмбриона. Графика визитов и обследований здесь нет; решение принимает врач.'),
    },
    lisans: { durum: 'serbest', kaynak: 'A rule of counting days out of a protocol of the Ministry of Health of the Republic of Uzbekistan (antenatal care, 2021); the protocol carries no notice of its own. Law of the Republic of Uzbekistan No. OʻRQ-42 of 20.07.2006, articles 5 and 8 (https://lex.uz/en/acts/-1022944, read 2026-10-10): no copyright in a method, nor in an official document. A machine\'s reading, not a lawyer\'s.' },
  },
  {
    anahtar: 'uz-emlash-qaydi', roller: ['pediatri', 'aile-hekimligi'],
    metin: {
      ad: u('Emlash qaydi', 'Эмлаш қайди', 'Запись о прививке'),
      aciklama: u('Bitta emlashni siz kiritgandek qayd etadi: vaksina nomi, doza raqami, sana va maʼlumot manbai. Vosita emlash kalendarini bilmaydi va hech narsa taklif qilmaydi.', 'Битта эмлашни сиз киритгандек қайд этади: вакцина номи, доза рақами, сана ва маълумот манбаи. Восита эмлаш календарини билмайди ва ҳеч нарса таклиф қилмайди.', 'Записывает одну прививку так, как вы её ввели: название вакцины, номер дозы, дата и источник сведений. Инструмент не знает календаря прививок и ничего не предлагает.'),
      alanlar: {
        vaksina: u('Vaksina nomi', 'Вакцина номи', 'Название вакцины'),
        doza: u('Doza raqami (ixtiyoriy)', 'Доза рақами (ихтиёрий)', 'Номер дозы (необязательно)'),
        sana: u('Emlash sanasi', 'Эмлаш санаси', 'Дата прививки'),
        manba: u('Maʼlumot manbai', 'Маълумот манбаи', 'Источник сведений'),
        keyingi: u('Keyingi sana, oʻzingiz belgilaysiz (ixtiyoriy)', 'Кейинги сана, ўзингиз белгилайсиз (ихтиёрий)', 'Следующая дата, её назначаете вы (необязательно)'),
      },
      secenekler: {
        manba: {
          hujjat: u('Emlash hujjati', 'Эмлаш ҳужжати', 'Документ о прививках'),
          ogzaki: u('Ogʻzaki maʼlumot (hujjatsiz)', 'Оғзаки маълумот (ҳужжатсиз)', 'Устные сведения (без документа)'),
        },
      },
      sayilar: { doza: u('Doza raqami', 'Доза рақами', 'Номер дозы') },
      bantlar: {
        hujjat: u('Emlash hujjati boʻyicha qayd etildi', 'Эмлаш ҳужжати бўйича қайд этилди', 'Записано по документу о прививках'),
        ogzaki: u('Ogʻzaki maʼlumot boʻyicha qayd etildi (hujjat koʻrilmagan)', 'Оғзаки маълумот бўйича қайд этилди (ҳужжат кўрилмаган)', 'Записано по устным сведениям (документ не предъявлен)'),
      },
      uyarilar: { keyingi_otgan: u('Siz belgilagan keyingi sana oʻtgan.', 'Сиз белгилаган кейинги сана ўтган.', 'Назначенная вами следующая дата уже прошла.') },
      tarihler: {
        sana: u('Emlash sanasi', 'Эмлаш санаси', 'Дата прививки'),
        keyingi: u('Keyingi sana', 'Кейинги сана', 'Следующая дата'),
      },
      not: u('Faqat qayd: vosita milliy emlash kalendarini oʻz ichiga olmaydi, vaksina yoki sana taklif qilmaydi va emlash kechikkanini aytmaydi.', 'Фақат қайд: восита миллий эмлаш календарини ўз ичига олмайди, вакцина ёки сана таклиф қилмайди ва эмлаш кечикканини айтмайди.', 'Только запись: инструмент не содержит национального календаря прививок, не предлагает ни вакцину, ни дату и не сообщает о пропущенной прививке.'),
    },
    lisans: { durum: 'serbest', kaynak: 'The product\'s own record of five fields: it holds nothing of a third party. The national calendar of preventive vaccinations (SanQvaM 0239-07/3) is not in the product.' },
  },
  {
    // CORE TOOL — every doctor role (owner's explicit order of 2026-10-13, redoing the Uzbekistan audit): a doctor
    // of any specialty may need to check a patient's immunisation status, not paediatrics and family medicine alone.
    anahtar: 'uz-emlash-jadvali', roller: UZ_HEKIM_ROLLERI, sinif: 'hekimler',
    metin: {
      ad: u('Milliy emlash jadvali', 'Миллий эмлаш жадвали', 'Национальный календарь прививок'),
      aciklama: u('Tugʻilgan sanadan milliy emlash taqvimining har bir yosh bosqichi sanasini hisoblaydi (Sanitariya-epidemiologiya farovonligi qoʻmitasining rasmiy sahifasida eʼlon qilingan jadval asosida). Qaysi emlash haqiqatda qilinganini bilmaydi.', 'Туғилган санадан миллий эмлаш тақвимининг ҳар бир ёш босқичи санасини ҳисоблайди (Санитария-эпидемиология фаровонлиги қўмитасининг расмий саҳифасида эълон қилинган жадвал асосида). Қайси эмлаш ҳақиқатда қилинганини билмайди.', 'Рассчитывает по дате рождения дату каждого возрастного этапа национального календаря прививок (по графику, опубликованному на официальной странице Комитета санитарно-эпидемиологического благополучия). Не знает, какая прививка сделана фактически.'),
      alanlar: {
        tugilgan_sana: u('Tugʻilgan sana', 'Туғилган сана', 'Дата рождения'),
      },
      tarihler: {
        tugilganda: u('Tugʻilganda (birinchi 24 soat ichida): VGB-1 — virusli gepatit B ga qarshi', 'Туғилганда (биринчи 24 соат ичида): ВГБ-1 — вирусли гепатит B га қарши', 'При рождении (в первые 24 часа жизни): ВГВ-1 — против вирусного гепатита B'),
        ikki_besh_kun: u('2–5-kunlik davr boshlanishi: BSJ-1 — sil kasalligiga qarshi (sana 2–5 kunlik oraliqning birinchi kuni sifatida koʻrsatilgan)', '2–5-кунлик давр бошланиши: БСЖ-1 — сил касаллигига қарши (сана 2–5 кунлик оралиқнинг биринчи куни сифатида кўрсатилган)', 'Начало периода 2–5 дней жизни: БЦЖ-1 — против туберкулёза (дата показана как первый день интервала 2–5 дней)'),
        ikki_oy: u('2 oylik: OPV-1, Rota-1, Pnevmo-1, Penta-1 — poliomielit, rotavirus infeksiyasi, pnevmokokk infeksiyasi, difteriya, koʻkyoʻtal, qoqshol, gepatit B va XIB infeksiyasiga qarshi', '2 ойлик: ОПВ-1, Рота-1, Пневмо-1, Пента-1 — полиомиэлит, ротавирус инфекцияси, пневмококк инфекцияси, дифтерия, кўкйўтал, қоқшол, гепатит B ва ХИБ инфекциясига қарши', 'В 2 месяца: ОПВ-1, Рота-1, Пневмо-1, Пента-1 — против полиомиелита, ротавирусной инфекции, пневмококковой инфекции, дифтерии, коклюша, столбняка, гепатита B и ХИБ-инфекции'),
        uch_oy: u('3 oylik: OPV-2, Rota-2, Pnevmo-2, Penta-2 — yuqoridagi vaksinalarning navbatdagi dozalari', '3 ойлик: ОПВ-2, Рота-2, Пневмо-2, Пента-2 — юқоридаги вакциналарнинг навбатдаги дозалари', 'В 3 месяца: ОПВ-2, Рота-2, Пневмо-2, Пента-2 — очередные дозы тех же вакцин'),
        tort_oy: u('4 oylik: OPV-3, Rota-3, Penta-3, IPV-1 — poliomielitga qarshi ikkinchi turdagi (IPV) vaksina birinchi bor qoʻshiladi', '4 ойлик: ОПВ-3, Рота-3, Пента-3, ИПВ-1 — полиомиэлитга қарши иккинчи турдаги (ИПВ) вакцина биринчи бор қўшилади', 'В 4 месяца: ОПВ-3, Рота-3, Пента-3, ИПВ-1 — впервые вводится второй тип вакцины против полиомиелита (ИПВ)'),
        olti_oy_qoshimcha: u('6 oylik — QOʻSHIMCHA DOZA (joriy epidemiologik holatga koʻra, doimiy jadval qismi emas): qizamiqqa qarshi qoʻshimcha emlash', '6 ойлик — ҚЎШИМЧА ДОЗА (жорий эпидемиологик ҳолатга кўра, доимий жадвал қисми эмас): қизамиққа қарши қўшимча эмлаш', '6 месяцев — ДОПОЛНИТЕЛЬНАЯ ДОЗА (введена с учётом текущей эпидемиологической ситуации, не является постоянной частью календаря): дополнительная прививка против кори'),
        toqqiz_oy: u('9 oylik: IPV-2 — poliomielitga qarshi navbatdagi doza', '9 ойлик: ИПВ-2 — полиомиэлитга қарши навбатдаги доза', 'В 9 месяцев: ИПВ-2 — очередная доза вакцины против полиомиелита'),
        bir_yosh: u('12 oylik (1 yosh): KPK-1, Pnevmo-3 — qizamiq, parotit, qizilcha va pnevmokokk infeksiyasiga qarshi', '12 ойлик (1 ёш): КПК-1, Пневмо-3 — қизамиқ, паротит, қизилча ва пневмококк инфекциясига қарши', 'В 12 месяцев (1 год): КПК-1, Пневмо-3 — против кори, эпидемического паротита, краснухи и пневмококковой инфекции'),
        on_olti_oy: u('16 oylik: AKDS-4, OPV-4 — difteriya, koʻkyoʻtal, qoqshol va poliomielitga qarshi', '16 ойлик: АКДС-4, ОПВ-4 — дифтерия, кўкйўтал, қоқшол ва полиомиэлитга қарши', 'В 16 месяцев: АКДС-4, ОПВ-4 — против дифтерии, коклюша, столбняка и полиомиелита'),
        olti_yosh: u('6 yosh: KPK-2 — qizamiq, parotit va qizilchaga qarshi', '6 ёш: КПК-2 — қизамиқ, паротит ва қизилчага қарши', 'В 6 лет: КПК-2 — против кори, эпидемического паротита и краснухи'),
        yetti_yosh: u('7 yosh: ADS-M-5, OPV-5 — difteriya, qoqshol va poliomielitga qarshi', '7 ёш: АДС-М-5, ОПВ-5 — дифтерия, қоқшол ва полиомиэлитга қарши', 'В 7 лет: АДС-М-5, ОПВ-5 — против дифтерии, столбняка и полиомиелита'),
        toqqiz_yosh: u('9 yosh: VPCH — inson papilloma virusiga qarshi', '9 ёш: ВПЧ — инсон папиллома вирусига қарши', 'В 9 лет: ВПЧ — против вируса папилломы человека'),
        on_olti_yosh: u('16 yosh: ADS-M-6 — difteriya va qoqsholga qarshi', '16 ёш: АДС-М-6 — дифтерия ва қоқшолга қарши', 'В 16 лет: АДС-М-6 — против дифтерии и столбняка'),
      },
      uyarilar: {
        otgan_sanalar_bor: u('Jadvaldagi bir yoki bir nechta sana bugungi kundan oldin: bemorning haqiqiy emlash tarixini tekshiring.', 'Жадвалдаги бир ёки бир нечта сана бугунги кундан олдин: беморнинг ҳақиқий эмлаш тарихини текширинг.', 'Одна или несколько дат графика уже прошли: проверьте фактическую историю прививок пациента.'),
      },
      not: u('Faqat sana hisobi: vosita qaysi emlash haqiqatda qilinganini bilmaydi va biror dozani "kechikkan" demaydi. Haqiqatda qilingan emlashlarni "Emlash qaydi" vositasida yozib boring. Jadval Sanitariya-epidemiologiya farovonligi qoʻmitasining rasmiy sahifasida koʻrsatilgan yosh bosqichlariga asoslangan va epidemiologik holatga koʻra oʻzgarishi mumkin.', 'Фақат сана ҳисоби: восита қайси эмлаш ҳақиқатда қилинганини билмайди ва бирор дозани "кечиккан" демайди. Ҳақиқатда қилинган эмлашларни "Эмлаш қайди" воситасида ёзиб боринг. Жадвал Санитария-эпидемиология фаровонлиги қўмитасининг расмий саҳифасида кўрсатилган ёш босқичларига асосланган ва эпидемиологик ҳолатга кўра ўзгариши мумкин.', 'Только расчёт дат: инструмент не знает, какая прививка сделана фактически, и не называет ни одну дозу «просроченной». Фактически сделанные прививки записывайте в инструменте «Запись о прививке». График основан на возрастных этапах официальной страницы Комитета санитарно-эпидемиологического благополучия и может меняться в зависимости от эпидемиологической ситуации.'),
    },
    lisans: { durum: 'serbest', kaynak: 'An official government page of the Sanitary and Epidemiological Welfare Committee (gov.uz), "Bolalarga profilaktik emlashlar qachon va qaysi kasalliklarga qarshi oʻtkaziladi?" (https://gov.uz/oz/sanepid/news/view/223776 ; https://gov.uz/ru/sanepid/news/view/223776), read 2026-10-13: the ages and vaccine names are the committee\'s own public summary of the national calendar; legal basis Law No. ZRU-393 of 26.08.2015, article 33. Law No. OʻRQ-42 of 20.07.2006, articles 5 and 8 (https://lex.uz/en/acts/-1022944): no copyright in a method, nor in an official document. A machine\'s reading, not a lawyer\'s.' },
  },
]
