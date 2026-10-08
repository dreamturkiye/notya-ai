/**
 * NOTYA-UZ-RANDEVU-01 — Uzbekistan: every sentence of the APPOINTMENT screens (calendar, booking, one appointment,
 * working pattern, the home's and the patient file's appointment lists) and the REMINDER TEXT a doctor copies for a
 * patient, in the three forms an account can choose:
 *
 *   uz-Latn   Uzbek, Latin script       uz-Cyrl   Uzbek, Cyrillic script       ru   Russian
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * MACHINE-WRITTEN. AWAITS NATIVE REVIEW. Nobody who speaks Uzbek or Russian as a first language has read this
 * text yet. The reminder sentences (`hatirlatma.metin*`) are PATIENT-FACING: a patient reads them, in a
 * messenger, under the doctor's own name. They must be read and corrected by a native speaker before a real
 * doctor sends one (docs/COUNTRY-PACK-CHECKLIST.md E8, E11). The Cyrillic form was written by hand, line by
 * line — it is not a transliteration at run time — and needs the same review.
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * A separate file from ./metinler.ts on purpose: slice 3 adds its text beside the earlier catalogue instead of
 * rewriting it. Same rules: the shape is defined once by the Uzbek Latin catalogue and the other two forms are
 * typed against it, so a missing key in any form is a type error and fails the build. Written fresh for
 * Uzbekistan — there is no Turkish source. Uzbek Latin uses U+02BB (ʻ) in oʻ / gʻ and U+02BC (ʼ) for the tutuq belgisi.
 *
 * PLACEHOLDERS are digits, so that the Cyrillic and Russian forms carry no Latin letter:
 *   %1 the day in the pack's own pattern (DD.MM.YYYY)   %2 the time (HH:MM, 24 hours)   %3 the doctor's name
 *
 * No public holiday is named or known here. `duzen.tatilNotu` tells the doctor exactly that.
 */
import { UZ_UYGULAMA_DILLERI, uzUygulamaDili, type UzUygulamaDili } from './metinler'

const UZ_LATN = {
  kabuk: { takvim: 'Taqvim' },
  // ISO weekdays: 1 = Monday … 7 = Sunday. The week starts on Monday (the pack's `bicim.haftaBasi`).
  gunKisa: { 1: 'Du', 2: 'Se', 3: 'Chor', 4: 'Pay', 5: 'Ju', 6: 'Shan', 7: 'Yak' },
  gunUzun: { 1: 'Dushanba', 2: 'Seshanba', 3: 'Chorshanba', 4: 'Payshanba', 5: 'Juma', 6: 'Shanba', 7: 'Yakshanba' },
  durum: {
    planlandi: 'Rejada',
    geldi: 'Bemor keldi',
    tamamlandi: 'Yakunlandi',
    gelmedi: 'Kelmadi',
    iptal: 'Bekor qilindi',
  },
  takvim: {
    baslik: 'Taqvim',
    gun: 'Kun',
    hafta: 'Hafta',
    bugun: 'Bugun',
    onceki: 'Oldingi',
    sonraki: 'Keyingi',
    yeni: 'Qabulga yozish',
    duzen: 'Ish tartibi',
    bos: 'Bu kunga hech kim yozilmagan.',
    bosSaat: 'Boʻsh',
    mola: 'Tanaffus',
    isGunuDegil: 'Bu kun ish kuni emas.',
    mesaiDisi: 'ish vaqtidan tashqari',
    gunuAc: 'Kunni ochish',
  },
  form: {
    baslik: 'Qabulga yozish',
    hasta: 'Bemor',
    hastaSec: 'Avval bemorni tanlang.',
    hastaDegistir: 'Boshqa bemorni tanlash',
    tarih: 'Sana',
    tarihOrnek: 'KK.OO.YYYY',
    saat: 'Vaqt',
    sure: 'Davomiyligi',
    dakika: 'daqiqa',
    neden: 'Qabul sababi',
    nedenOrnek: 'Qisqacha, ixtiyoriy',
    kaydet: 'Yozib qoʻyish',
    kaydediliyor: 'Saqlanmoqda…',
    vazgec: 'Bekor qilish',
    dolu: 'Bu vaqt band: shu vaqtda sizda boshqa qabul bor. Boshqa vaqtni tanlang.',
    mesaiDisi: 'Bu vaqt ish vaqtingizdan tashqarida. Qabul hali yozilmadi.',
    yineDe: 'Baribir yozib qoʻyish',
    tarihGecersiz: 'Sana notoʻgʻri. Sanani KK.OO.YYYY koʻrinishida kiriting. Oʻtgan kunga yozib boʻlmaydi.',
    saatGecersiz: 'Vaqt notoʻgʻri.',
    sureGecersiz: 'Davomiylikni roʻyxatdan tanlang.',
    kaydedilemedi: 'Qabulni saqlab boʻlmadi. Qaytadan urinib koʻring.',
  },
  randevu: {
    baslik: 'Qabul',
    durum: 'Holati',
    vakit: 'Vaqti',
    geldi: 'Bemor keldi',
    tamamla: 'Yakunlandi deb belgilash',
    gelmedi: 'Bemor kelmadi',
    iptalEt: 'Qabulni bekor qilish',
    planaAl: 'Rejaga qaytarish',
    geldiyeAl: 'Yakunlashni bekor qilish',
    muayeneyiAc: 'Koʻrikni ochish',
    tasi: 'Boshqa vaqtga koʻchirish',
    tasiKaydet: 'Koʻchirish',
    tasiYineDe: 'Baribir koʻchirish',
    tasindi: 'Qabul koʻchirildi.',
    tasiMesaiDisi: 'Bu vaqt ish vaqtingizdan tashqarida. Qabul hali koʻchirilmadi.',
    bulunamadi: 'Qabul topilmadi.',
    gecisYok: 'Bu qabulning holatini bunday oʻzgartirib boʻlmaydi.',
    mesaiDisiIsareti: 'Ish vaqtidan tashqari yozilgan.',
    degistirilemedi: 'Oʻzgartirib boʻlmadi. Qaytadan urinib koʻring.',
    yenidenYaz: 'Yangi qabulga yozish',
    takvimeDon: 'Taqvimga qaytish',
    dosya: 'Bemor varaqasi',
  },
  hatirlatma: {
    baslik: 'Eslatma matni',
    kopyala: 'Eslatma matnini nusxalash',
    kopyalandi: 'Matn nusxalandi. Uni oʻzingiz ishlatadigan messenjerga qoʻying.',
    kopyalanamadi: 'Nusxalab boʻlmadi. Matnni belgilab, qoʻlda nusxalang.',
    izoh: 'Hech narsa avtomatik yuborilmaydi: matnni bemorga oʻzingiz yuborasiz.',
    dil: 'Matn tili (bemorning tili)',
    dilUz: 'oʻzbekcha',
    dilRu: 'ruscha',
    // PATIENT-FACING. %1 day, %2 time, %3 the doctor's name.
    metin: 'Assalomu alaykum! Eslatma: siz %1 kuni soat %2 da shifokor %3 qabuliga yozilgansiz.',
    // The same without a name, for an account that has none.
    metinAdsiz: 'Assalomu alaykum! Eslatma: siz %1 kuni soat %2 da shifokor qabuliga yozilgansiz.',
  },
  duzen: {
    baslik: 'Ish tartibi',
    aciklama: 'Taqvimdagi boʻsh vaqtlar shu tartib boʻyicha koʻrsatiladi. Ish vaqtidan tashqariga yozishda tizim sizdan tasdiq soʻraydi.',
    gunler: 'Ish kunlari',
    baslangic: 'Ish boshlanishi',
    bitis: 'Ish tugashi',
    sure: 'Qabulning odatiy davomiyligi',
    molalar: 'Tanaffuslar',
    molaBas: 'Boshlanishi',
    molaBit: 'Tugashi',
    molaEkle: 'Tanaffus qoʻshish',
    molaSil: 'Olib tashlash',
    kaydet: 'Ish tartibini saqlash',
    kaydediliyor: 'Saqlanmoqda…',
    kaydedildi: 'Saqlandi.',
    kaydedilemedi: 'Saqlab boʻlmadi. Qaytadan urinib koʻring.',
    gunGerekli: 'Kamida bitta ish kunini tanlang.',
    saatGecersiz: 'Ish vaqti notoʻgʻri: tugash vaqti boshlanishidan keyin boʻlishi kerak.',
    sureGecersiz: 'Davomiylikni roʻyxatdan tanlang.',
    molaGecersiz: 'Tanaffus notoʻgʻri: u ish vaqti ichida boʻlishi va boshqa tanaffus bilan ustma-ust tushmasligi kerak.',
    saatDilimi: 'Barcha vaqtlar Toshkent vaqti boʻyicha.',
    tatilNotu: 'Bayram kunlari avtomatik hisobga olinmaydi. Bayram kuniga yozmaslikni oʻzingiz nazorat qiling.',
    varsayilan: 'Hozircha standart tartib amal qilmoqda. Oʻzingiznikini saqlang.',
  },
  bugun: {
    randevular: 'Bugungi qabullar',
    randevuYok: 'Bugunga hech kim yozilmagan.',
    takvimiAc: 'Taqvimni ochish',
  },
  hasta: {
    randevular: 'Kelgusi qabullar',
    randevuAl: 'Qabulga yozish',
  },
}

/** Same keys, any text. */
type Bicim<T> = { readonly [K in keyof T]: T[K] extends string ? string : Bicim<T[K]> }
export type RandevuMetni = Bicim<typeof UZ_LATN>

const UZ_CYRL: RandevuMetni = {
  kabuk: { takvim: 'Тақвим' },
  gunKisa: { 1: 'Ду', 2: 'Се', 3: 'Чор', 4: 'Пай', 5: 'Жу', 6: 'Шан', 7: 'Як' },
  gunUzun: { 1: 'Душанба', 2: 'Сешанба', 3: 'Чоршанба', 4: 'Пайшанба', 5: 'Жума', 6: 'Шанба', 7: 'Якшанба' },
  durum: {
    planlandi: 'Режада',
    geldi: 'Бемор келди',
    tamamlandi: 'Якунланди',
    gelmedi: 'Келмади',
    iptal: 'Бекор қилинди',
  },
  takvim: {
    baslik: 'Тақвим',
    gun: 'Кун',
    hafta: 'Ҳафта',
    bugun: 'Бугун',
    onceki: 'Олдинги',
    sonraki: 'Кейинги',
    yeni: 'Қабулга ёзиш',
    duzen: 'Иш тартиби',
    bos: 'Бу кунга ҳеч ким ёзилмаган.',
    bosSaat: 'Бўш',
    mola: 'Танаффус',
    isGunuDegil: 'Бу кун иш куни эмас.',
    mesaiDisi: 'иш вақтидан ташқари',
    gunuAc: 'Кунни очиш',
  },
  form: {
    baslik: 'Қабулга ёзиш',
    hasta: 'Бемор',
    hastaSec: 'Аввал беморни танланг.',
    hastaDegistir: 'Бошқа беморни танлаш',
    tarih: 'Сана',
    tarihOrnek: 'КК.ОО.ЙЙЙЙ',
    saat: 'Вақт',
    sure: 'Давомийлиги',
    dakika: 'дақиқа',
    neden: 'Қабул сабаби',
    nedenOrnek: 'Қисқача, ихтиёрий',
    kaydet: 'Ёзиб қўйиш',
    kaydediliyor: 'Сақланмоқда…',
    vazgec: 'Бекор қилиш',
    dolu: 'Бу вақт банд: шу вақтда сизда бошқа қабул бор. Бошқа вақтни танланг.',
    mesaiDisi: 'Бу вақт иш вақтингиздан ташқарида. Қабул ҳали ёзилмади.',
    yineDe: 'Барибир ёзиб қўйиш',
    tarihGecersiz: 'Сана нотўғри. Санани КК.ОО.ЙЙЙЙ кўринишида киритинг. Ўтган кунга ёзиб бўлмайди.',
    saatGecersiz: 'Вақт нотўғри.',
    sureGecersiz: 'Давомийликни рўйхатдан танланг.',
    kaydedilemedi: 'Қабулни сақлаб бўлмади. Қайтадан уриниб кўринг.',
  },
  randevu: {
    baslik: 'Қабул',
    durum: 'Ҳолати',
    vakit: 'Вақти',
    geldi: 'Бемор келди',
    tamamla: 'Якунланди деб белгилаш',
    gelmedi: 'Бемор келмади',
    iptalEt: 'Қабулни бекор қилиш',
    planaAl: 'Режага қайтариш',
    geldiyeAl: 'Якунлашни бекор қилиш',
    muayeneyiAc: 'Кўрикни очиш',
    tasi: 'Бошқа вақтга кўчириш',
    tasiKaydet: 'Кўчириш',
    tasiYineDe: 'Барибир кўчириш',
    tasindi: 'Қабул кўчирилди.',
    tasiMesaiDisi: 'Бу вақт иш вақтингиздан ташқарида. Қабул ҳали кўчирилмади.',
    bulunamadi: 'Қабул топилмади.',
    gecisYok: 'Бу қабулнинг ҳолатини бундай ўзгартириб бўлмайди.',
    mesaiDisiIsareti: 'Иш вақтидан ташқари ёзилган.',
    degistirilemedi: 'Ўзгартириб бўлмади. Қайтадан уриниб кўринг.',
    yenidenYaz: 'Янги қабулга ёзиш',
    takvimeDon: 'Тақвимга қайтиш',
    dosya: 'Бемор варақаси',
  },
  hatirlatma: {
    baslik: 'Эслатма матни',
    kopyala: 'Эслатма матнини нусхалаш',
    kopyalandi: 'Матн нусхаланди. Уни ўзингиз ишлатадиган мессенжерга қўйинг.',
    kopyalanamadi: 'Нусхалаб бўлмади. Матнни белгилаб, қўлда нусхаланг.',
    izoh: 'Ҳеч нарса автоматик юборилмайди: матнни беморга ўзингиз юборасиз.',
    dil: 'Матн тили (беморнинг тили)',
    dilUz: 'ўзбекча',
    dilRu: 'русча',
    // PATIENT-FACING. %1 day, %2 time, %3 the doctor's name.
    metin: 'Ассалому алайкум! Эслатма: сиз %1 куни соат %2 да шифокор %3 қабулига ёзилгансиз.',
    metinAdsiz: 'Ассалому алайкум! Эслатма: сиз %1 куни соат %2 да шифокор қабулига ёзилгансиз.',
  },
  duzen: {
    baslik: 'Иш тартиби',
    aciklama: 'Тақвимдаги бўш вақтлар шу тартиб бўйича кўрсатилади. Иш вақтидан ташқарига ёзишда тизим сиздан тасдиқ сўрайди.',
    gunler: 'Иш кунлари',
    baslangic: 'Иш бошланиши',
    bitis: 'Иш тугаши',
    sure: 'Қабулнинг одатий давомийлиги',
    molalar: 'Танаффуслар',
    molaBas: 'Бошланиши',
    molaBit: 'Тугаши',
    molaEkle: 'Танаффус қўшиш',
    molaSil: 'Олиб ташлаш',
    kaydet: 'Иш тартибини сақлаш',
    kaydediliyor: 'Сақланмоқда…',
    kaydedildi: 'Сақланди.',
    kaydedilemedi: 'Сақлаб бўлмади. Қайтадан уриниб кўринг.',
    gunGerekli: 'Камида битта иш кунини танланг.',
    saatGecersiz: 'Иш вақти нотўғри: тугаш вақти бошланишидан кейин бўлиши керак.',
    sureGecersiz: 'Давомийликни рўйхатдан танланг.',
    molaGecersiz: 'Танаффус нотўғри: у иш вақти ичида бўлиши ва бошқа танаффус билан устма-уст тушмаслиги керак.',
    saatDilimi: 'Барча вақтлар Тошкент вақти бўйича.',
    tatilNotu: 'Байрам кунлари автоматик ҳисобга олинмайди. Байрам кунига ёзмасликни ўзингиз назорат қилинг.',
    varsayilan: 'Ҳозирча стандарт тартиб амал қилмоқда. Ўзингизникини сақланг.',
  },
  bugun: {
    randevular: 'Бугунги қабуллар',
    randevuYok: 'Бугунга ҳеч ким ёзилмаган.',
    takvimiAc: 'Тақвимни очиш',
  },
  hasta: {
    randevular: 'Келгуси қабуллар',
    randevuAl: 'Қабулга ёзиш',
  },
}

// Russian. A visit is «приём» on the earlier screens (./metinler.ts), so an appointment is «запись на приём».
const RU: RandevuMetni = {
  kabuk: { takvim: 'Календарь' },
  gunKisa: { 1: 'Пн', 2: 'Вт', 3: 'Ср', 4: 'Чт', 5: 'Пт', 6: 'Сб', 7: 'Вс' },
  gunUzun: { 1: 'Понедельник', 2: 'Вторник', 3: 'Среда', 4: 'Четверг', 5: 'Пятница', 6: 'Суббота', 7: 'Воскресенье' },
  durum: {
    planlandi: 'Запланирована',
    geldi: 'Пациент пришёл',
    tamamlandi: 'Завершена',
    gelmedi: 'Пациент не пришёл',
    iptal: 'Отменена',
  },
  takvim: {
    baslik: 'Календарь',
    gun: 'День',
    hafta: 'Неделя',
    bugun: 'Сегодня',
    onceki: 'Назад',
    sonraki: 'Вперёд',
    yeni: 'Записать на приём',
    duzen: 'График работы',
    bos: 'На этот день никто не записан.',
    bosSaat: 'Свободно',
    mola: 'Перерыв',
    isGunuDegil: 'Это нерабочий день.',
    mesaiDisi: 'вне рабочего времени',
    gunuAc: 'Открыть день',
  },
  form: {
    baslik: 'Запись на приём',
    hasta: 'Пациент',
    hastaSec: 'Сначала выберите пациента.',
    hastaDegistir: 'Выбрать другого пациента',
    tarih: 'Дата',
    tarihOrnek: 'ДД.ММ.ГГГГ',
    saat: 'Время',
    sure: 'Длительность',
    dakika: 'мин',
    neden: 'Причина обращения',
    nedenOrnek: 'Кратко, необязательно',
    kaydet: 'Записать',
    kaydediliyor: 'Сохраняем…',
    vazgec: 'Отмена',
    dolu: 'Это время занято: на него у вас уже есть запись. Выберите другое время.',
    mesaiDisi: 'Это время вне вашего рабочего графика. Запись пока не создана.',
    yineDe: 'Всё равно записать',
    tarihGecersiz: 'Неверная дата. Введите дату в виде ДД.ММ.ГГГГ. На прошедший день записать нельзя.',
    saatGecersiz: 'Неверное время.',
    sureGecersiz: 'Выберите длительность из списка.',
    kaydedilemedi: 'Не удалось сохранить запись. Попробуйте ещё раз.',
  },
  randevu: {
    baslik: 'Запись на приём',
    durum: 'Статус',
    vakit: 'Время',
    geldi: 'Пациент пришёл',
    tamamla: 'Отметить завершённой',
    gelmedi: 'Пациент не пришёл',
    iptalEt: 'Отменить запись',
    planaAl: 'Вернуть в запланированные',
    geldiyeAl: 'Снять отметку о завершении',
    muayeneyiAc: 'Открыть приём',
    tasi: 'Перенести на другое время',
    tasiKaydet: 'Перенести',
    tasiYineDe: 'Всё равно перенести',
    tasindi: 'Запись перенесена.',
    tasiMesaiDisi: 'Это время вне вашего рабочего графика. Запись пока не перенесена.',
    bulunamadi: 'Запись на приём не найдена.',
    gecisYok: 'Статус этой записи нельзя изменить таким образом.',
    mesaiDisiIsareti: 'Записано вне рабочего времени.',
    degistirilemedi: 'Не удалось изменить. Попробуйте ещё раз.',
    yenidenYaz: 'Записать заново',
    takvimeDon: 'Вернуться в календарь',
    dosya: 'Карта пациента',
  },
  hatirlatma: {
    baslik: 'Текст напоминания',
    kopyala: 'Скопировать текст напоминания',
    kopyalandi: 'Текст скопирован. Вставьте его в мессенджер, которым пользуетесь.',
    kopyalanamadi: 'Не удалось скопировать. Выделите текст и скопируйте вручную.',
    izoh: 'Ничего не отправляется автоматически: текст пациенту отправляете вы сами.',
    dil: 'Язык текста (язык пациента)',
    dilUz: 'узбекский',
    dilRu: 'русский',
    // PATIENT-FACING. %1 day, %2 time, %3 the doctor's name.
    metin: 'Здравствуйте! Напоминаем: вы записаны на приём к врачу %3 %1 в %2.',
    metinAdsiz: 'Здравствуйте! Напоминаем: вы записаны на приём к врачу %1 в %2.',
  },
  duzen: {
    baslik: 'График работы',
    aciklama: 'Свободное время в календаре показывается по этому графику. При записи вне рабочего времени система попросит подтверждение.',
    gunler: 'Рабочие дни',
    baslangic: 'Начало работы',
    bitis: 'Конец работы',
    sure: 'Обычная длительность приёма',
    molalar: 'Перерывы',
    molaBas: 'Начало',
    molaBit: 'Конец',
    molaEkle: 'Добавить перерыв',
    molaSil: 'Убрать',
    kaydet: 'Сохранить график',
    kaydediliyor: 'Сохраняем…',
    kaydedildi: 'Сохранено.',
    kaydedilemedi: 'Не удалось сохранить. Попробуйте ещё раз.',
    gunGerekli: 'Выберите хотя бы один рабочий день.',
    saatGecersiz: 'Неверное рабочее время: конец должен быть позже начала.',
    sureGecersiz: 'Выберите длительность из списка.',
    molaGecersiz: 'Неверный перерыв: он должен быть внутри рабочего времени и не пересекаться с другим перерывом.',
    saatDilimi: 'Всё время указано по ташкентскому времени.',
    tatilNotu: 'Праздничные дни автоматически не учитываются. Следите сами, чтобы не записать пациента на праздничный день.',
    varsayilan: 'Пока действует стандартный график. Сохраните свой.',
  },
  bugun: {
    randevular: 'Записи на сегодня',
    randevuYok: 'На сегодня никто не записан.',
    takvimiAc: 'Открыть календарь',
  },
  hasta: {
    randevular: 'Предстоящие записи',
    randevuAl: 'Записать на приём',
  },
}

export const UZ_RANDEVU_METINLERI: Readonly<Record<UzUygulamaDili, RandevuMetni>> = {
  'uz-Latn': UZ_LATN,
  'uz-Cyrl': UZ_CYRL,
  ru: RU,
}

/** The appointment catalogue in an account's form. Anything that is not one of the three forms is Uzbek in Latin script. */
export function randevuMetni(dil: unknown): RandevuMetni {
  return UZ_RANDEVU_METINLERI[uzUygulamaDili(dil)]
}

/** The form a catalogue is written in. */
export function randevuMetninDili(r: RandevuMetni): UzUygulamaDili {
  return UZ_UYGULAMA_DILLERI.find((d) => UZ_RANDEVU_METINLERI[d] === r) ?? 'uz-Latn'
}

/** The name of an ISO weekday (1 = Monday … 7 = Sunday). '' for anything else. */
export function gunAdi(r: RandevuMetni, haftaGunu: number, uzun = false): string {
  const t = (uzun ? r.gunUzun : r.gunKisa) as Readonly<Record<number, string>>
  return t[haftaGunu] ?? ''
}
