/**
 * NOTYA-DEMO-EPOSTA-01 (Kaan, 2026-11-06) — the words of our own demo-booking e-mail, one set per Cal.com event.
 *
 * WHY HERE (and not in countries/<code>/ on the release branches): this e-mail is sent by ONE receiver on the main site
 * (app/api/demo/cal-webhook), because Dr. Mamur's Cal.com account has one webhook for all seven demo events and the
 * mail goes out from one notya.io sender. No country build serves this route, so a country pack could never be read by
 * it. The Cal.com event slug is the country key; each country's words stay that country's own (its own language and
 * spelling, the name its demo page uses), exactly as the demo page words do, and the same visual layout is shared
 * (./eposta.ts) — one look, injected words.
 *
 * No claim about compliance, results, prices or integrations; no Cal.com branding.
 */

export type DemoOlayi = 'olustu' | 'yeniden' | 'iptal'

export type DemoEpostaMetni = {
  /** BCP-47 language of this section (html lang, Intl date format). */
  dil: string
  konu: Record<DemoOlayi, string>
  selam: (ad: string) => string
  govde: Record<DemoOlayi, string>
  ne: string
  neZaman: string
  sure: string
  sureDegeri: (dakika: number) => string
  baglanti: string
  katil: string
  takvim: string
  degistir: string
  iptalEt: string
  yeniSaat: string
  kapanis: string
  imza: string
  altBilgi: string
}

/** One Cal.com demo event: which country, which page to rebook on, which sections the mail carries (in order). */
export type DemoEtkinligi = {
  ulke: 'tr' | 'us' | 'gb' | 'ca' | 'nz' | 'au' | 'uz'
  demoSayfasi: string
  varsayilanSaatDilimi: string
  bolumler: DemoEpostaMetni[]
}

const ETKINLIK_ADI = 'Notya Demo'

const TR: DemoEpostaMetni = {
  dil: 'tr-TR',
  konu: {
    olustu: 'Notya demo görüşmeniz onaylandı',
    yeniden: 'Notya demo görüşmenizin saati değişti',
    iptal: 'Notya demo görüşmeniz iptal edildi',
  },
  selam: (ad) => (ad ? `Merhaba ${ad},` : 'Merhaba,'),
  govde: {
    olustu: 'Dr. Gökhan Mamur ile 30 dakikalık Notya demo görüşmeniz onaylandı.',
    yeniden: 'Dr. Gökhan Mamur ile Notya demo görüşmenizin saati güncellendi. Yeni saat aşağıda.',
    iptal: 'Dr. Gökhan Mamur ile planlanan Notya demo görüşmeniz iptal edildi.',
  },
  ne: 'Görüşme',
  neZaman: 'Tarih ve saat',
  sure: 'Süre',
  sureDegeri: (d) => `${d} dakika`,
  baglanti: 'Görüşme bağlantısı',
  katil: 'Görüşmeye katıl',
  takvim: 'Görüşmeyi takviminize eklemek için ekteki davet.ics dosyasını açın.',
  degistir: 'Saati değiştir',
  iptalEt: 'Görüşmeyi iptal et',
  yeniSaat: 'Yeni bir saat seçmek isterseniz:',
  kapanis: 'Saygılarımızla,',
  imza: 'Notya',
  altBilgi: 'Bu e-postayı notya.io üzerinden bir demo görüşmesi planladığınız için aldınız.',
}

/** The English countries share a shape; each keeps its own spelling (cancelled / canceled) and date format. */
function ingilizce(dil: string, iptal: 'cancelled' | 'canceled'): DemoEpostaMetni {
  return {
    dil,
    konu: {
      olustu: 'Your Notya demo is confirmed',
      yeniden: 'Your Notya demo has a new time',
      iptal: `Your Notya demo has been ${iptal}`,
    },
    selam: (ad) => (ad ? `Hello ${ad},` : 'Hello,'),
    govde: {
      olustu: 'Your 30-minute Notya demo call with Dr. Han Mamur is confirmed.',
      yeniden: 'Your Notya demo call with Dr. Han Mamur has moved to a new time, shown below.',
      iptal: `Your Notya demo call with Dr. Han Mamur has been ${iptal}.`,
    },
    ne: 'Call',
    neZaman: 'Date and time',
    sure: 'Length',
    sureDegeri: (d) => `${d} minutes`,
    baglanti: 'Meeting link',
    katil: 'Join the call',
    takvim: 'To add the call to your calendar, open the attached invite.ics file.',
    degistir: 'Change the time',
    iptalEt: 'Cancel the call',
    yeniSaat: 'If you would like to pick a new time:',
    kapanis: 'Kind regards,',
    imza: 'Notya',
    altBilgi: 'You received this e-mail because you booked a demo call on notya.io.',
  }
}

const UZ_LATN: DemoEpostaMetni = {
  dil: 'uz-Latn',
  konu: {
    olustu: 'Notya demo uchrashuvingiz tasdiqlandi',
    yeniden: 'Notya demo uchrashuvingiz vaqti oʻzgardi',
    iptal: 'Notya demo uchrashuvingiz bekor qilindi',
  },
  selam: (ad) => (ad ? `Assalomu alaykum, ${ad}!` : 'Assalomu alaykum!'),
  govde: {
    olustu: 'Dr. Gokhan Mamur bilan 30 daqiqalik Notya demo uchrashuvingiz tasdiqlandi.',
    yeniden: 'Dr. Gokhan Mamur bilan Notya demo uchrashuvingiz vaqti oʻzgardi. Yangi vaqt quyida.',
    iptal: 'Dr. Gokhan Mamur bilan rejalashtirilgan Notya demo uchrashuvingiz bekor qilindi.',
  },
  ne: 'Uchrashuv',
  neZaman: 'Sana va vaqt',
  sure: 'Davomiyligi',
  sureDegeri: (d) => `${d} daqiqa`,
  baglanti: 'Uchrashuv havolasi',
  katil: 'Uchrashuvga qoʻshilish',
  takvim: 'Uchrashuvni taqvimingizga qoʻshish uchun ilova qilingan invite.ics faylini oching.',
  degistir: 'Vaqtni oʻzgartirish',
  iptalEt: 'Uchrashuvni bekor qilish',
  yeniSaat: 'Yangi vaqt tanlamoqchi boʻlsangiz:',
  kapanis: 'Hurmat bilan,',
  imza: 'Notya',
  altBilgi: 'Siz ushbu xatni notya.io saytida demo uchrashuvga yozilganingiz uchun oldingiz.',
}

const RU: DemoEpostaMetni = {
  dil: 'ru',
  konu: {
    olustu: 'Ваш демо-звонок Notya подтверждён',
    yeniden: 'Время вашего демо-звонка Notya изменилось',
    iptal: 'Ваш демо-звонок Notya отменён',
  },
  selam: (ad) => (ad ? `Здравствуйте, ${ad}!` : 'Здравствуйте!'),
  govde: {
    olustu: 'Ваш 30-минутный демо-звонок Notya с доктором Гёкханом Мамуром подтверждён.',
    yeniden: 'Время вашего демо-звонка Notya с доктором Гёкханом Мамуром изменилось. Новое время указано ниже.',
    iptal: 'Ваш демо-звонок Notya с доктором Гёкханом Мамуром отменён.',
  },
  ne: 'Звонок',
  neZaman: 'Дата и время',
  sure: 'Длительность',
  sureDegeri: (d) => `${d} минут`,
  baglanti: 'Ссылка на звонок',
  katil: 'Присоединиться к звонку',
  takvim: 'Чтобы добавить звонок в календарь, откройте приложенный файл invite.ics.',
  degistir: 'Изменить время',
  iptalEt: 'Отменить звонок',
  yeniSaat: 'Если вы хотите выбрать новое время:',
  kapanis: 'С уважением,',
  imza: 'Notya',
  altBilgi: 'Вы получили это письмо, потому что записались на демо-звонок на сайте notya.io.',
}

/** Cal.com event slug → the country's e-mail. Only these seven slugs get a mail; any other event is ignored. */
export const DEMO_ETKINLIKLERI: Record<string, DemoEtkinligi> = {
  'demo-tr': { ulke: 'tr', demoSayfasi: 'https://www.notya.io/demo', varsayilanSaatDilimi: 'Europe/Istanbul', bolumler: [TR] },
  'demo-usa': { ulke: 'us', demoSayfasi: 'https://us.notya.io/us/demo', varsayilanSaatDilimi: 'America/New_York', bolumler: [ingilizce('en-US', 'canceled')] },
  'demo-uk': { ulke: 'gb', demoSayfasi: 'https://uk.notya.io/uk/demo', varsayilanSaatDilimi: 'Europe/London', bolumler: [ingilizce('en-GB', 'cancelled')] },
  'demo-ca': { ulke: 'ca', demoSayfasi: 'https://ca.notya.io/ca/demo', varsayilanSaatDilimi: 'America/Toronto', bolumler: [ingilizce('en-CA', 'cancelled')] },
  'demo-nz': { ulke: 'nz', demoSayfasi: 'https://nz.notya.io/nz/demo', varsayilanSaatDilimi: 'Pacific/Auckland', bolumler: [ingilizce('en-NZ', 'cancelled')] },
  'demo-au': { ulke: 'au', demoSayfasi: 'https://au.notya.io/au/demo', varsayilanSaatDilimi: 'Australia/Sydney', bolumler: [ingilizce('en-AU', 'cancelled')] },
  'demo-uz': { ulke: 'uz', demoSayfasi: 'https://uz.notya.io/uzbek/demo', varsayilanSaatDilimi: 'Asia/Tashkent', bolumler: [UZ_LATN, RU] },
}

export { ETKINLIK_ADI }
