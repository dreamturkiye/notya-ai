/**
 * NOTYA-ULKE-ARACLAR-01 — Uzbekistan: the TOOLS AREA's own words, in the three forms of the application:
 *
 *   uz-Latn   Uzbek, Latin script       uz-Cyrl   Uzbek, Cyrillic script       ru   Russian
 *
 *   kabuk    the link in the navigation       izgara   the grid and its search
 *   arac     what every tool screen shares    portal   the patient page's tile
 *
 * THE WORDS OF EACH TOOL ARE NOT HERE: they sit with the tool, in ./temel.ts and ./rol*.ts.
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * MACHINE-WRITTEN. AWAITS NATIVE REVIEW. Nobody who speaks Uzbek or Russian as a first language has read this
 * text yet (docs/COUNTRY-PACK-UZBEKISTAN.md, "The tools"; checklist E11, F3).
 * The Cyrillic form of this file was written by hand, line by line.
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
}

export const UZ_ARACLAR_METINLERI: Readonly<Record<UzUygulamaDili, AraclarMetni>> = { 'uz-Latn': UZ_LATN, 'uz-Cyrl': UZ_CYRL, ru: RU }
