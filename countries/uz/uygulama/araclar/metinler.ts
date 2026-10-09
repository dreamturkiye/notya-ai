/**
 * NOTYA-ULKE-ARACLAR-01 — Uzbekistan: the TOOLS AREA's own words, in the three forms of the application:
 *
 *   uz-Latn   Uzbek, Latin script       uz-Cyrl   Uzbek, Cyrillic script       ru   Russian
 *
 *   kabuk    the link in the navigation       izgara   the grid and its search
 *   arac     what every tool screen shares    portal   the patient page's tile
 *   kayit    keeping a result on a patient    takip    the follow-up list
 *
 * THE WORDS OF EACH TOOL ARE NOT HERE: they sit with the tool, in ./temel.ts and ./rol*.ts.
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * MACHINE-WRITTEN. AWAITS NATIVE REVIEW. Nobody who speaks Uzbek or Russian as a first language has read this
 * text yet (docs/COUNTRY-PACK-UZBEKISTAN.md, "The tools"; checklist E11, F3).
 * The Cyrillic form of `kabuk`, `izgara`, `arac` and `portal` was written by hand, line by line; the Cyrillic form of
 * `kayit` and `takip` was DERIVED FROM THE LATIN TEXT BY RULE (scripts/uz-kiril.mjs), like the tools' own texts.
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * The shape is the kit's type (AraclarMetni), so a missing key in any form is a type error and fails the build.
 * Written fresh for Uzbekistan — there is no Turkish source. Uzbek Latin uses U+02BB (ʻ) in oʻ / gʻ and U+02BC (ʼ)
 * for the tutuq belgisi. PLACEHOLDERS: '%' one value; '%1' and '%2' two (each key of the type says which).
 */
import type { AraclarMetni } from '@/lib/ulke/arayuz/metinTipleri'
import type { UzUygulamaDili } from '../metinler'

const UZ_LATN: AraclarMetni = {
  kabuk: { araclar: 'Vositalar' },
  izgara: {
    baslik: 'Vositalar',
    aciklama: 'Hisoblagichlar, shkalalar va nazorat roʻyxatlari. Natija qaror qabul qilishga yordam beradi; tashxis va davolash qarori shifokorniki.',
    ara: 'Vosita qidirish',
    araOrnek: 'Nomi yoki tavsifi',
    temel: 'Asosiy vositalar',
    rol: 'Yoʻnalish vositalari: %',
    bos: 'Hozircha vositalar yoʻq.',
    sonucYok: 'Hech narsa topilmadi.',
    ac: 'Vositalarni ochish',
  },
  arac: {
    geri: 'Vositalarga qaytish',
    girdiler: 'Maʼlumotlar',
    sonuc: 'Natija',
    eksik: 'Natija chiqishi uchun kerakli maydonlarni toʻldiring. Ruxsat etilgan oraliqdan tashqaridagi qiymat hisobga olinmaydi.',
    madde: '%-band',
    aralik: 'Ruxsat etilgan oraliq: %1 – %2',
    oran: '%1 / %2',
    kopyala: 'Xulosani nusxalash',
    kopyalandi: 'Nusxalandi.',
    kopyalanamadi: 'Nusxalab boʻlmadi.',
    temizle: 'Tozalash',
    kaynak: 'Manba: %',
    saklanmaz: 'Bu yerda kiritilgan maʼlumot saqlanmaydi: sahifadan chiqsangiz, oʻchib ketadi.',
    yok: 'Bunday vosita sizning hisobingizda yoʻq.',
  },
  portal: {
    nasil: 'Bemorni toping va kartasini oching: «Bemor sahifasi» boʻlimida havola va PIN-kod yaratiladi, nimani ulashishni ham oʻsha yerda tanlaysiz.',
  },
  kayit: {
    hastaIcin: 'Bemor: %',
    hastaBulunamadi: 'Bunday bemor hisobingizda topilmadi. Natijani saqlash uchun vositalarni bemor kartasidan oching.',
    hastasiz: 'Natijani bemor kartasida saqlash uchun vositalarni bemor kartasidan oching.',
    baslik: 'Bemor kartasida saqlash',
    aciklama: '«Saqlash» tugmasini bosmaguningizcha hech narsa saqlanmaydi. Saqlanadi: kiritilgan maʼlumotlar va natija. Hech kimga hech narsa yuborilmaydi.',
    takipTarihi: 'Keyingi nazorat sanasi (ixtiyoriy)',
    takipIpucu: 'Sanani oʻzingiz belgilaysiz: tizim sana taklif qilmaydi. Belgilangan sana nazorat roʻyxatingizda koʻrinadi.',
    kaydet: 'Saqlash',
    kaydedildi: 'Bemor kartasida saqlandi.',
    dosyayaGit: 'Bemor kartasini ochish',
    eksik: 'Saqlash uchun avval vositani toʻldiring: natija chiqishi kerak.',
    takipGecersiz: 'Nazorat sanasi bugungi yoki keyingi kun boʻlishi kerak.',
    yapilamadi: 'Saqlab boʻlmadi. Qayta urinib koʻring.',
    dosyaBaslik: 'Vositalar natijalari',
    dosyaAciklama: 'Ushbu bemor uchun saqlangan hisob-kitoblar, shkalalar va nazorat roʻyxatlari. Natija qaror qabul qilishga yordam beradi; tashxis va davolash qarori shifokorniki.',
    dosyaBos: 'Hozircha saqlangan natija yoʻq.',
    araclariAc: 'Ushbu bemor uchun vositalarni ochish',
    takipGunu: 'Nazorat: %',
    takipKapandi: 'Nazorat (%) bajarildi',
    okunamadi: 'Bu yozuvni koʻrsatib boʻlmaydi.',
    aracYok: 'Tizimda endi mavjud boʻlmagan vosita',
  },
  takip: {
    aciklama: 'Bemor kartasida saqlangan va nazorat sanasi belgilangan natijalar, eng yaqin sanadan boshlab. Sanalarni oʻzingiz belgilagansiz; tizim hech kimga hech narsa yubormaydi.',
    bos: 'Ochiq nazoratlar yoʻq.',
    gecikti: 'Muddati oʻtgan',
    bugun: 'Bugun',
    kapat: 'Bajarildi',
    kapatildi: 'Nazorat bajarilgan deb belgilandi.',
    yapilamadi: 'Belgilab boʻlmadi. Qayta urinib koʻring.',
    okunamadi: 'Roʻyxatni oʻqib boʻlmadi. Sahifani yangilang.',
  },
}

const UZ_CYRL: AraclarMetni = {
  kabuk: { araclar: 'Воситалар' },
  izgara: {
    baslik: 'Воситалар',
    aciklama: 'Ҳисоблагичлар, шкалалар ва назорат рўйхатлари. Натижа қарор қабул қилишга ёрдам беради; ташхис ва даволаш қарори шифокорники.',
    ara: 'Восита қидириш',
    araOrnek: 'Номи ёки тавсифи',
    temel: 'Асосий воситалар',
    rol: 'Йўналиш воситалари: %',
    bos: 'Ҳозирча воситалар йўқ.',
    sonucYok: 'Ҳеч нарса топилмади.',
    ac: 'Воситаларни очиш',
  },
  arac: {
    geri: 'Воситаларга қайтиш',
    girdiler: 'Маълумотлар',
    sonuc: 'Натижа',
    eksik: 'Натижа чиқиши учун керакли майдонларни тўлдиринг. Рухсат этилган оралиқдан ташқаридаги қиймат ҳисобга олинмайди.',
    madde: '%-банд',
    aralik: 'Рухсат этилган оралиқ: %1 – %2',
    oran: '%1 / %2',
    kopyala: 'Хулосани нусхалаш',
    kopyalandi: 'Нусхаланди.',
    kopyalanamadi: 'Нусхалаб бўлмади.',
    temizle: 'Тозалаш',
    kaynak: 'Манба: %',
    saklanmaz: 'Бу ерда киритилган маълумот сақланмайди: саҳифадан чиқсангиз, ўчиб кетади.',
    yok: 'Бундай восита сизнинг ҳисобингизда йўқ.',
  },
  portal: {
    nasil: 'Беморни топинг ва картасини очинг: «Бемор саҳифаси» бўлимида ҳавола ва ПИН-код яратилади, нимани улашишни ҳам ўша ерда танлайсиз.',
  },
  kayit: {
    hastaIcin: 'Бемор: %',
    hastaBulunamadi: 'Бундай бемор ҳисобингизда топилмади. Натижани сақлаш учун воситаларни бемор картасидан очинг.',
    hastasiz: 'Натижани бемор картасида сақлаш учун воситаларни бемор картасидан очинг.',
    baslik: 'Бемор картасида сақлаш',
    aciklama: '«Сақлаш» тугмасини босмагунингизча ҳеч нарса сақланмайди. Сақланади: киритилган маълумотлар ва натижа. Ҳеч кимга ҳеч нарса юборилмайди.',
    takipTarihi: 'Кейинги назорат санаси (ихтиёрий)',
    takipIpucu: 'Санани ўзингиз белгилайсиз: тизим сана таклиф қилмайди. Белгиланган сана назорат рўйхатингизда кўринади.',
    kaydet: 'Сақлаш',
    kaydedildi: 'Бемор картасида сақланди.',
    dosyayaGit: 'Бемор картасини очиш',
    eksik: 'Сақлаш учун аввал воситани тўлдиринг: натижа чиқиши керак.',
    takipGecersiz: 'Назорат санаси бугунги ёки кейинги кун бўлиши керак.',
    yapilamadi: 'Сақлаб бўлмади. Қайта уриниб кўринг.',
    dosyaBaslik: 'Воситалар натижалари',
    dosyaAciklama: 'Ушбу бемор учун сақланган ҳисоб-китоблар, шкалалар ва назорат рўйхатлари. Натижа қарор қабул қилишга ёрдам беради; ташхис ва даволаш қарори шифокорники.',
    dosyaBos: 'Ҳозирча сақланган натижа йўқ.',
    araclariAc: 'Ушбу бемор учун воситаларни очиш',
    takipGunu: 'Назорат: %',
    takipKapandi: 'Назорат (%) бажарилди',
    okunamadi: 'Бу ёзувни кўрсатиб бўлмайди.',
    aracYok: 'Тизимда энди мавжуд бўлмаган восита',
  },
  takip: {
    aciklama: 'Бемор картасида сақланган ва назорат санаси белгиланган натижалар, энг яқин санадан бошлаб. Саналарни ўзингиз белгилагансиз; тизим ҳеч кимга ҳеч нарса юбормайди.',
    bos: 'Очиқ назоратлар йўқ.',
    gecikti: 'Муддати ўтган',
    bugun: 'Бугун',
    kapat: 'Бажарилди',
    kapatildi: 'Назорат бажарилган деб белгиланди.',
    yapilamadi: 'Белгилаб бўлмади. Қайта уриниб кўринг.',
    okunamadi: 'Рўйхатни ўқиб бўлмади. Саҳифани янгиланг.',
  },
}

const RU: AraclarMetni = {
  kabuk: { araclar: 'Инструменты' },
  izgara: {
    baslik: 'Инструменты',
    aciklama: 'Калькуляторы, шкалы и контрольные списки. Результат помогает принять решение; диагноз и лечение определяет врач.',
    ara: 'Поиск инструмента',
    araOrnek: 'Название или описание',
    temel: 'Основные инструменты',
    rol: 'Инструменты специальности: %',
    bos: 'Инструментов пока нет.',
    sonucYok: 'Ничего не найдено.',
    ac: 'Открыть инструменты',
  },
  arac: {
    geri: 'Назад к инструментам',
    girdiler: 'Данные',
    sonuc: 'Результат',
    eksik: 'Заполните нужные поля, чтобы получить результат. Значение вне допустимого диапазона не учитывается.',
    madde: 'Пункт %',
    aralik: 'Допустимый диапазон: %1 – %2',
    oran: '%1 / %2',
    kopyala: 'Скопировать итог',
    kopyalandi: 'Скопировано.',
    kopyalanamadi: 'Не удалось скопировать.',
    temizle: 'Очистить',
    kaynak: 'Источник: %',
    saklanmaz: 'Введённые здесь данные не сохраняются: при уходе со страницы они исчезают.',
    yok: 'Такого инструмента в вашей учётной записи нет.',
  },
  portal: {
    nasil: 'Найдите пациента и откройте его карту: в разделе «Страница пациента» создаются ссылка и ПИН-код, там же вы выбираете, чем поделиться.',
  },
  kayit: {
    hastaIcin: 'Пациент: %',
    hastaBulunamadi: 'Такой пациент в вашей учётной записи не найден. Чтобы сохранить результат, откройте инструменты из карты пациента.',
    hastasiz: 'Чтобы сохранить результат в карте пациента, откройте инструменты из карты пациента.',
    baslik: 'Сохранить в карте пациента',
    aciklama: 'Пока вы не нажмёте «Сохранить», ничего не сохраняется. Сохраняются введённые данные и результат. Никому ничего не отправляется.',
    takipTarihi: 'Дата следующего контроля (необязательно)',
    takipIpucu: 'Дату вы указываете сами: система дату не предлагает. Указанная дата появится в вашем списке контроля.',
    kaydet: 'Сохранить',
    kaydedildi: 'Сохранено в карте пациента.',
    dosyayaGit: 'Открыть карту пациента',
    eksik: 'Чтобы сохранить, сначала заполните инструмент: должен появиться результат.',
    takipGecersiz: 'Дата контроля должна быть сегодняшней или более поздней.',
    yapilamadi: 'Не удалось сохранить. Попробуйте ещё раз.',
    dosyaBaslik: 'Результаты инструментов',
    dosyaAciklama: 'Сохранённые для этого пациента расчёты, шкалы и контрольные списки. Результат помогает принять решение; диагноз и лечение определяет врач.',
    dosyaBos: 'Сохранённых результатов пока нет.',
    araclariAc: 'Открыть инструменты для этого пациента',
    takipGunu: 'Контроль: %',
    takipKapandi: 'Контроль (%) выполнен',
    okunamadi: 'Эту запись невозможно показать.',
    aracYok: 'Инструмент, которого больше нет в системе',
  },
  takip: {
    aciklama: 'Результаты, сохранённые в картах пациентов с указанной датой контроля, начиная с самой ранней. Даты вы указали сами; система никому ничего не отправляет.',
    bos: 'Открытых контролей нет.',
    gecikti: 'Просрочено',
    bugun: 'Сегодня',
    kapat: 'Выполнено',
    kapatildi: 'Контроль отмечен как выполненный.',
    yapilamadi: 'Не удалось отметить. Попробуйте ещё раз.',
    okunamadi: 'Не удалось прочитать список. Обновите страницу.',
  },
}

export const UZ_ARACLAR_METINLERI: Readonly<Record<UzUygulamaDili, AraclarMetni>> = { 'uz-Latn': UZ_LATN, 'uz-Cyrl': UZ_CYRL, ru: RU }
