/**
 * NOTYA-ULKE-MESAJ-01 — Uzbekistan: every sentence of THE MESSAGES BETWEEN A DOCTOR AND A PATIENT, in the three
 * forms of the application (uz-Latn, uz-Cyrl, ru), written side by side (./uclu.ts).
 *
 *   hekim   the doctor's card on the patient's file, and the list of unread messages on the home screen
 *   hasta   what the PATIENT reads on their own page
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * MACHINE-WRITTEN. AWAITS NATIVE REVIEW. Uzbek in Latin script and Russian were written by a machine; UZBEK IN
 * CYRILLIC SCRIPT WAS DERIVED FROM THE LATIN TEXT BY RULE (scripts/uz-kiril.mjs), letter by letter. Nobody who
 * speaks Uzbek or Russian as a first language has read a line of it. `hasta` is PATIENT-FACING: a patient reads it
 * alone, on their own phone. It comes first for the native reader, `hasta.acil`, `hasta.acilNumara`,
 * `hasta.baslatamaz` and `hasta.yanitSuresi` before anything else, and must be read and corrected before a real
 * doctor writes to a real patient (docs/COUNTRY-PACK-UZBEKISTAN.md, "Messages between doctor and patient").
 * WHETHER A DOCTOR MAY WRITE TO A PATIENT THIS WAY under the country's law has not been read by a lawyer.
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * `hasta.acilNumara` is the sentence that carries the ambulance number. THE NUMBER IS NOT IN THIS FILE: it is the
 * pack's setting (../index.ts, `uygulama.portal.acilNumara`), unverified today. No sentence here holds a digit.
 * Written fresh for Uzbekistan — there is no source in another country's language.
 * PLACEHOLDERS: '%' one value (each key of the type says which).
 */
import type { MesajMetni } from '@/lib/ulke/arayuz/metinTipleri'
import { u, ucBicim, type Uclu } from './uclu'

const METINLER: Uclu<MesajMetni> = {
  hekim: {
    baslik: u('Xabarlar', 'Хабарлар', 'Сообщения'),
    aciklama: u('Bemorga yozing: u xabarni oʻz sahifasida, havola va PIN-kod bilan kirgach oʻqiydi va javob yoza oladi.', 'Беморга ёзинг: у хабарни ўз саҳифасида, ҳавола ва ПИН-код билан киргач ўқийди ва жавоб ёза олади.', 'Напишите пациенту: он прочитает сообщение на своей странице, войдя по ссылке и ПИН-коду, и сможет ответить.'),
    bildirimYok: u('Tizim bemorga yangi xabar haqida hech narsa yubormaydi: yozganingizni bemorga oʻzingiz ayting.', 'Тизим беморга янги хабар ҳақида ҳеч нарса юбормайди: ёзганингизни беморга ўзингиз айтинг.', 'Система не оповещает пациента о новом сообщении: скажите ему сами, что вы написали.'),
    erisimYok: u('Bemorda ishlaydigan havola yoʻq: u xabarlarni oʻqiy olmaydi. Avval bemor sahifasiga kirish bering.', 'Беморда ишлайдиган ҳавола йўқ: у хабарларни ўқий олмайди. Аввал бемор саҳифасига кириш беринг.', 'У пациента нет действующей ссылки: он не сможет прочитать сообщения. Сначала выдайте доступ к странице пациента.'),
    bos: u('Hozircha xabar yoʻq.', 'Ҳозирча хабар йўқ.', 'Сообщений пока нет.'),
    yaz: u('Xabar matni', 'Хабар матни', 'Текст сообщения'),
    gonder: u('Yuborish', 'Юбориш', 'Отправить'),
    gonderiliyor: u('Yuborilmoqda…', 'Юборилмоқда…', 'Отправка…'),
    gonderilemedi: u('Xabarni yuborib boʻlmadi. Qaytadan urinib koʻring.', 'Хабарни юбориб бўлмади. Қайтадан уриниб кўринг.', 'Не удалось отправить сообщение. Попробуйте ещё раз.'),
    bosMesaj: u('Xabar matnini yozing.', 'Хабар матнини ёзинг.', 'Напишите текст сообщения.'),
    cokUzun: u('Xabar juda uzun: koʻpi bilan % ta belgi.', 'Хабар жуда узун: кўпи билан % та белги.', 'Сообщение слишком длинное: не более % знаков.'),
    limit: u('Bugun bu bemorga juda koʻp xabar yozildi. Ertaga urinib koʻring.', 'Бугун бу беморга жуда кўп хабар ёзилди. Эртага уриниб кўринг.', 'Сегодня этому пациенту отправлено слишком много сообщений. Попробуйте завтра.'),
    siz: u('Siz', 'Сиз', 'Вы'),
    hasta: u('Bemor', 'Бемор', 'Пациент'),
    okundu: u('Bemor oʻqidi', 'Бемор ўқиди', 'Пациент прочитал'),
    okunmadi: u('Bemor hali oʻqimagan', 'Бемор ҳали ўқимаган', 'Пациент ещё не прочитал'),
    yeni: u('Yangi', 'Янги', 'Новое'),
    acik: u('Ochiq yozishma', 'Очиқ ёзишма', 'Открытая переписка'),
    kapali: u('Yozishma yopilgan: %', 'Ёзишма ёпилган: %', 'Переписка закрыта: %'),
    kapat: u('Yozishmani yopish', 'Ёзишмани ёпиш', 'Закрыть переписку'),
    kapatUyari: u('Yopilgach bemor bu yozishmaga yoza olmaydi, lekin uni oʻqiy oladi. Keyingi xabaringiz yangi yozishma ochadi.', 'Ёпилгач бемор бу ёзишмага ёза олмайди, лекин уни ўқий олади. Кейинги хабарингиз янги ёзишма очади.', 'После закрытия пациент не сможет писать в эту переписку, но сможет её читать. Ваше следующее сообщение откроет новую переписку.'),
    kapatOnay: u('Ha, yopish', 'Ҳа, ёпиш', 'Да, закрыть'),
    vazgec: u('Bekor qilish', 'Бекор қилиш', 'Отмена'),
    kapatildi: u('Yozishma yopildi.', 'Ёзишма ёпилди.', 'Переписка закрыта.'),
    yapilamadi: u('Bajarib boʻlmadi. Qaytadan urinib koʻring.', 'Бажариб бўлмади. Қайтадан уриниб кўринг.', 'Не удалось выполнить. Попробуйте ещё раз.'),
    yuklenemedi: u('Xabarlarni oʻqib boʻlmadi. Sahifani yangilang.', 'Хабарларни ўқиб бўлмади. Саҳифани янгиланг.', 'Не удалось загрузить сообщения. Обновите страницу.'),
    okunmamisBaslik: u('Bemorlardan oʻqilmagan xabarlar', 'Беморлардан ўқилмаган хабарлар', 'Непрочитанные сообщения от пациентов'),
    okunmamisAdet: u('Yangi: %', 'Янги: %', 'Новых: %'),
  },
  hasta: {
    baslik: u('Shifokor bilan yozishma', 'Шифокор билан ёзишма', 'Переписка с врачом'),
    aciklama: u('Bu yerda shifokoringiz sizga yozgan xabarlarni oʻqiysiz va ularga javob yozasiz.', 'Бу ерда шифокорингиз сизга ёзган хабарларни ўқийсиз ва уларга жавоб ёзасиз.', 'Здесь вы читаете сообщения вашего врача и отвечаете на них.'),
    acil: u('Xabarlar shoshilinch holatlar uchun emas: shifokor ularni darhol oʻqimasligi mumkin.', 'Хабарлар шошилинч ҳолатлар учун эмас: шифокор уларни дарҳол ўқимаслиги мумкин.', 'Сообщения не предназначены для экстренных случаев: врач может прочитать их не сразу.'),
    acilNumara: u('Shoshilinch holatda % raqamiga qoʻngʻiroq qiling.', 'Шошилинч ҳолатда % рақамига қўнғироқ қилинг.', 'В экстренном случае звоните по номеру %.'),
    yanitSuresi: u('Javob muddati kafolatlanmaydi: shifokor imkoni boʻlganda javob beradi.', 'Жавоб муддати кафолатланмайди: шифокор имкони бўлганда жавоб беради.', 'Срок ответа не гарантируется: врач отвечает, когда у него есть возможность.'),
    baslatamaz: u('Bu yerdan yozishmani oʻzingiz boshlay olmaysiz. Shifokoringiz sizga yozganda javob yozishingiz mumkin boʻladi.', 'Бу ердан ёзишмани ўзингиз бошлай олмайсиз. Шифокорингиз сизга ёзганда жавоб ёзишингиз мумкин бўлади.', 'Начать переписку отсюда вы не можете. Вы сможете ответить, когда врач напишет вам.'),
    yok: u('Shifokoringiz sizga hali yozmagan.', 'Шифокорингиз сизга ҳали ёзмаган.', 'Ваш врач вам пока не писал.'),
    kapali: u('Shifokoringiz bu yozishmani yopgan. Uni oʻqishingiz mumkin, lekin unga yoza olmaysiz.', 'Шифокорингиз бу ёзишмани ёпган. Уни ўқишингиз мумкин, лекин унга ёза олмайсиз.', 'Ваш врач закрыл эту переписку. Вы можете её читать, но писать в неё нельзя.'),
    kapandi: u('Yozishma yopilgan: %', 'Ёзишма ёпилган: %', 'Переписка закрыта: %'),
    yaz: u('Javobingiz', 'Жавобингиз', 'Ваш ответ'),
    gonder: u('Yuborish', 'Юбориш', 'Отправить'),
    gonderiliyor: u('Yuborilmoqda…', 'Юборилмоқда…', 'Отправка…'),
    gonderilemedi: u('Xabarni yuborib boʻlmadi. Qaytadan urinib koʻring.', 'Хабарни юбориб бўлмади. Қайтадан уриниб кўринг.', 'Не удалось отправить сообщение. Попробуйте ещё раз.'),
    bosMesaj: u('Xabar matnini yozing.', 'Хабар матнини ёзинг.', 'Напишите текст сообщения.'),
    cokUzun: u('Xabar juda uzun: koʻpi bilan % ta belgi.', 'Хабар жуда узун: кўпи билан % та белги.', 'Сообщение слишком длинное: не более % знаков.'),
    limit: u('Bugun juda koʻp xabar yozdingiz. Ertaga urinib koʻring.', 'Бугун жуда кўп хабар ёздингиз. Эртага уриниб кўринг.', 'Сегодня вы отправили слишком много сообщений. Попробуйте завтра.'),
    hekim: u('Shifokor', 'Шифокор', 'Врач'),
    siz: u('Siz', 'Сиз', 'Вы'),
    yeni: u('Yangi', 'Янги', 'Новое'),
    okunmamis: u('Yangi xabarlar: %', 'Янги хабарлар: %', 'Новых сообщений: %'),
    yuklenemedi: u('Xabarlarni oʻqib boʻlmadi. Sahifani yangilang.', 'Хабарларни ўқиб бўлмади. Саҳифани янгиланг.', 'Не удалось загрузить сообщения. Обновите страницу.'),
  },
}

export const UZ_MESAJ_AGACI = METINLER
export const UZ_MESAJ_METINLERI = ucBicim(METINLER)
