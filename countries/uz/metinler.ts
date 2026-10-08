/**
 * NOTYA-ULKE-01 — Uzbekistan: text of the core surfaces, per switched-on language (Uzbek in Latin script, Russian).
 * Written against the same keys as the Turkish source (lib/ulke/tipler.ts → YuzeyAnahtarlari); never copied from it.
 *
 * MACHINE-WRITTEN. A native speaker must read every line before the country goes public (checklist E11).
 * Uzbek Latin uses U+02BB (ʻ) in oʻ / gʻ and U+02BC (ʼ) for the tutuq belgisi.
 * Uzbek in Cyrillic script is declared in the pack but not switched on: no catalogue exists for it yet.
 */
import type { YuzeyMetinleri } from '@/lib/ulke/tipler'

// ───────────────────────── Uzbek (Latin) ─────────────────────────

export const UZ_LATN_HESAP: YuzeyMetinleri<'hesap'> = {
  girisReddi: 'Elektron pochta yoki parol notoʻgʻri.',
}

export const UZ_LATN_GIRIS: YuzeyMetinleri<'giris'> = {
  altBaslik: 'Hisobingizga kiring',
  eposta: 'Elektron pochta',
  epostaOrnek: 'shifokor@example.com',
  sifre: 'Parol',
  sifreOrnek: 'Parolingiz',
  gonder: 'Kirish',
  gonderiliyor: 'Kirilmoqda…',
  bosAlan: 'Elektron pochta va parolni kiriting.',
  hata: 'Kirib boʻlmadi. Qaytadan urinib koʻring.',
  baglantiHatasi: 'Ulanib boʻlmadi. Internet aloqasini tekshirib, qaytadan urinib koʻring.',
  cokDeneme: 'Urinishlar soni juda koʻp. Bir necha daqiqadan soʻng qaytadan urinib koʻring.',
  hazirDegil: 'Kirish hozircha ishlamayapti.',
  davetSorusu: 'Taklif kodingiz bormi?',
  kayitBaglantisi: 'Roʻyxatdan oʻtish',
  anaSayfa: 'Bosh sahifa',
}

export const UZ_LATN_DAVETLI_KAYIT: YuzeyMetinleri<'davetliKayit'> = {
  baslik: 'Taklif kodi bilan roʻyxatdan oʻtish',
  aciklama: 'Notya hozircha faqat taklif asosida ochiladi.',
  adSoyad: 'Ism va familiya',
  eposta: 'Elektron pochta',
  sifre: 'Parol',
  sifreTekrar: 'Parol (takroran)',
  davetKodu: 'Taklif kodi',
  dil: 'Interfeys tili',
  gonder: 'Hisob yaratish',
  gonderiliyor: 'Hisob yaratilmoqda…',
  eksikAlan: 'Barcha maydonlarni toʻldiring.',
  epostaGecersiz: 'Elektron pochta manzili notoʻgʻri koʻrinadi. Tekshirib koʻring.',
  sifreKisa: 'Parol kamida 8 ta belgidan iborat boʻlishi kerak.',
  sifreUyusmuyor: 'Parollar bir-biriga mos kelmadi.',
  kodGecersiz: 'Taklif kodi yaroqsiz yoki allaqachon ishlatilgan.',
  olusturulamadi: 'Hisob yaratilmadi. Maʼlumotlarni tekshirib, qaytadan urinib koʻring.',
  baglantiHatasi: 'Ulanib boʻlmadi. Internet aloqasini tekshirib, qaytadan urinib koʻring.',
  basarili: 'Hisobingiz yaratildi. Endi kirishingiz mumkin.',
  girisSorusu: 'Hisobingiz bormi?',
  girisBaglantisi: 'Kirish',
  kodYokSorusu: 'Taklif kodingiz yoʻqmi?',
  fiyatBaglantisi: 'Narxni soʻrash',
}

export const UZ_LATN_BEKLETME: YuzeyMetinleri<'bekletme'> = {
  baslik: 'Pilot kirishingiz tayyorlanmoqda',
  govde: 'Hisobingiz yaratildi. Notya bosqichma-bosqich ochilmoqda; navbatingiz kelganda siz bilan bogʻlanamiz.',
  cikis: 'Chiqish',
  yukleniyor: 'Yuklanmoqda…',
}

export const UZ_LATN_SISTEM: YuzeyMetinleri<'sistem'> = {
  bulunamadiBaslik: 'Sahifa topilmadi',
  bulunamadiGovde: 'Bu manzil mavjud emas yoki boshqa joyga koʻchirilgan.',
  anaSayfa: 'Bosh sahifa',
  hataBaslik: 'Xatolik yuz berdi',
  hataGovde: 'Sahifani yuklashda muammo chiqdi.',
  tekrarDene: 'Qaytadan urinish',
}

// ───────────────────────── Russian ─────────────────────────

export const UZ_RU_HESAP: YuzeyMetinleri<'hesap'> = {
  girisReddi: 'Неверный адрес электронной почты или пароль.',
}

export const UZ_RU_GIRIS: YuzeyMetinleri<'giris'> = {
  altBaslik: 'Войдите в свою учётную запись',
  eposta: 'Электронная почта',
  epostaOrnek: 'vrach@example.com',
  sifre: 'Пароль',
  sifreOrnek: 'Ваш пароль',
  gonder: 'Войти',
  gonderiliyor: 'Выполняется вход…',
  bosAlan: 'Введите электронную почту и пароль.',
  hata: 'Не удалось войти. Попробуйте ещё раз.',
  baglantiHatasi: 'Нет соединения. Проверьте интернет и попробуйте ещё раз.',
  cokDeneme: 'Слишком много попыток. Попробуйте ещё раз через несколько минут.',
  hazirDegil: 'Вход пока недоступен.',
  davetSorusu: 'Есть код приглашения?',
  kayitBaglantisi: 'Регистрация',
  anaSayfa: 'Главная',
}

export const UZ_RU_DAVETLI_KAYIT: YuzeyMetinleri<'davetliKayit'> = {
  baslik: 'Регистрация по коду приглашения',
  aciklama: 'Notya пока открывается только по приглашениям.',
  adSoyad: 'Имя и фамилия',
  eposta: 'Электронная почта',
  sifre: 'Пароль',
  sifreTekrar: 'Пароль (ещё раз)',
  davetKodu: 'Код приглашения',
  dil: 'Язык интерфейса',
  gonder: 'Создать учётную запись',
  gonderiliyor: 'Создаём учётную запись…',
  eksikAlan: 'Заполните все поля.',
  epostaGecersiz: 'Адрес электронной почты выглядит неверным. Проверьте его.',
  sifreKisa: 'Пароль должен содержать не менее 8 символов.',
  sifreUyusmuyor: 'Пароли не совпадают.',
  kodGecersiz: 'Код приглашения недействителен или уже использован.',
  olusturulamadi: 'Не удалось создать учётную запись. Проверьте данные и попробуйте ещё раз.',
  baglantiHatasi: 'Нет соединения. Проверьте интернет и попробуйте ещё раз.',
  basarili: 'Учётная запись создана. Теперь вы можете войти.',
  girisSorusu: 'Уже есть учётная запись?',
  girisBaglantisi: 'Войти',
  kodYokSorusu: 'Нет кода приглашения?',
  fiyatBaglantisi: 'Запросить цену',
}

export const UZ_RU_BEKLETME: YuzeyMetinleri<'bekletme'> = {
  baslik: 'Ваш пилотный доступ готовится',
  govde: 'Учётная запись создана. Notya открывается поэтапно; когда подойдёт ваша очередь, мы свяжемся с вами.',
  cikis: 'Выйти',
  yukleniyor: 'Загрузка…',
}

export const UZ_RU_SISTEM: YuzeyMetinleri<'sistem'> = {
  bulunamadiBaslik: 'Страница не найдена',
  bulunamadiGovde: 'Такого адреса нет, или страница была перенесена.',
  anaSayfa: 'Главная',
  hataBaslik: 'Произошла ошибка',
  hataGovde: 'При загрузке страницы возникла проблема.',
  tekrarDene: 'Попробовать ещё раз',
}
