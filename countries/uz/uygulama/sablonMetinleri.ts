/**
 * NOTYA-ULKE-MESAJ-01 — Uzbekistan: every sentence of "MY TEMPLATES" — the screen where a doctor keeps their own
 * reusable text blocks, and the picker that puts one into a section of a note or into a message — in the three forms
 * of the application (uz-Latn, uz-Cyrl, ru), written side by side (./uclu.ts). The tile's own name and description
 * are with the tools (./araclar/temel.ts).
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * MACHINE-WRITTEN. AWAITS NATIVE REVIEW. Uzbek in Latin script and Russian were written by a machine; UZBEK IN
 * CYRILLIC SCRIPT WAS DERIVED FROM THE LATIN TEXT BY RULE (scripts/uz-kiril.mjs), letter by letter. Nobody who
 * speaks Uzbek or Russian as a first language has read a line of it.
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * NO TEMPLATE IS IN THIS FILE: the pack brings no ready-made clinical text. A doctor's templates are the doctor's own.
 * Written fresh for Uzbekistan — there is no source in another country's language.
 * PLACEHOLDERS: '%' one value (each key of the type says which).
 */
import type { SablonMetni } from '@/lib/ulke/arayuz/metinTipleri'
import { u, ucBicim, type Uclu } from './uclu'

const METINLER: Uclu<SablonMetni> = {
  uyari: u('Shablonga bemorning ismi yoki maʼlumotlarini yozmang: shablon koʻp bemor uchun ishlatiladi.', 'Шаблонга беморнинг исми ёки маълумотларини ёзманг: шаблон кўп бемор учун ишлатилади.', 'Не вносите в шаблон имя или данные пациента: шаблон используется для многих пациентов.'),
  bos: u('Hozircha shablon yoʻq.', 'Ҳозирча шаблон йўқ.', 'Шаблонов пока нет.'),
  yeni: u('Yangi shablon', 'Янги шаблон', 'Новый шаблон'),
  duzenleBaslik: u('Shablonni tahrirlash', 'Шаблонни таҳрирлаш', 'Изменение шаблона'),
  ad: u('Nomi', 'Номи', 'Название'),
  metin: u('Matni', 'Матни', 'Текст'),
  kapsamEtiketi: u('Qayerda taklif qilinadi', 'Қаерда таклиф қилинади', 'Где предлагать'),
  kapsam: {
    not: u('Koʻrik qaydida', 'Кўрик қайдида', 'В записи приёма'),
    mesaj: u('Xabarda', 'Хабарда', 'В сообщении'),
    hepsi: u('Ikkalasida', 'Иккаласида', 'В обоих'),
  },
  kaydet: u('Saqlash', 'Сақлаш', 'Сохранить'),
  kaydediliyor: u('Saqlanmoqda…', 'Сақланмоқда…', 'Сохранение…'),
  kaydedildi: u('Shablon saqlandi.', 'Шаблон сақланди.', 'Шаблон сохранён.'),
  kaydedilemedi: u('Bajarib boʻlmadi. Qaytadan urinib koʻring.', 'Бажариб бўлмади. Қайтадан уриниб кўринг.', 'Не удалось выполнить. Попробуйте ещё раз.'),
  adGerekli: u('Shablon nomini yozing.', 'Шаблон номини ёзинг.', 'Укажите название шаблона.'),
  metinGerekli: u('Shablon matnini yozing.', 'Шаблон матнини ёзинг.', 'Напишите текст шаблона.'),
  cokUzun: u('Matn juda uzun: koʻpi bilan % ta belgi.', 'Матн жуда узун: кўпи билан % та белги.', 'Текст слишком длинный: не более % знаков.'),
  cokFazla: u('Shablonlar soni chegaraga yetdi: koʻpi bilan % ta. Keraksizini oʻchiring.', 'Шаблонлар сони чегарага етди: кўпи билан % та. Кераксизини ўчиринг.', 'Достигнут предел числа шаблонов: не более %. Удалите ненужные.'),
  duzenle: u('Tahrirlash', 'Таҳрирлаш', 'Изменить'),
  sil: u('Oʻchirish', 'Ўчириш', 'Удалить'),
  silUyari: u('Shablon roʻyxatdan olib tashlanadi va uni qaytarib boʻlmaydi. Avval yozilgan qaydlar va xabarlar oʻzgarmaydi.', 'Шаблон рўйхатдан олиб ташланади ва уни қайтариб бўлмайди. Аввал ёзилган қайдлар ва хабарлар ўзгармайди.', 'Шаблон будет убран из списка, вернуть его нельзя. Уже написанные записи и сообщения не изменятся.'),
  silOnay: u('Ha, oʻchirish', 'Ҳа, ўчириш', 'Да, удалить'),
  vazgec: u('Bekor qilish', 'Бекор қилиш', 'Отмена'),
  silindi: u('Shablon oʻchirildi.', 'Шаблон ўчирилди.', 'Шаблон удалён.'),
  yuklenemedi: u('Shablonlarni oʻqib boʻlmadi. Sahifani yangilang.', 'Шаблонларни ўқиб бўлмади. Саҳифани янгиланг.', 'Не удалось загрузить шаблоны. Обновите страницу.'),
  seciciEkle: u('Shablon qoʻshish', 'Шаблон қўшиш', 'Вставить шаблон'),
  seciciNot: u('Shablon matni yozilgan matnning oxiriga qoʻshiladi; hech narsa almashtirilmaydi.', 'Шаблон матни ёзилган матннинг охирига қўшилади; ҳеч нарса алмаштирилмайди.', 'Текст шаблона добавляется в конец написанного; ничего не заменяется.'),
  seciciBos: u('Bu yer uchun shablon yoʻq.', 'Бу ер учун шаблон йўқ.', 'Для этого места шаблонов нет.'),
  yonet: u('Shablonlarim', 'Шаблонларим', 'Мои шаблоны'),
}

export const UZ_SABLON_AGACI = METINLER
export const UZ_SABLON_METINLERI = ucBicim(METINLER)
