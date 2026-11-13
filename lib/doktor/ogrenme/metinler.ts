/**
 * AYSE-OGRENME-V3 — every user-visible word of the three V3 features (ivme, kural önizleme, klinik ortak üslup),
 * as ONE copy object per language. Türkiye keeps its Turkish wording unchanged; the country builds read their own set
 * (ulke → dil). No other component forks: one page, injected words (gorunum-paritesi-ulke).
 * Client-safe, pure.
 */
import { aktifUlke } from '@/lib/ulke/ulke'
export type OgrenmeDil = 'tr' | 'en' | 'uz'

export interface OgrenmeMetni {
  ivmeBaslik: string
  ivmeBos: (n: number) => string
  ivmeErken: string
  ivmeSatir: (n: number, ilk: string, son: string) => string
  ivmeAzaliyor: string
  ivmeSabit: string
  ivmeArtiyor: string
  ivmeNot: (n: number) => string
  ivmeBirim: string
  haftalik: (buHafta: string, notSayisi: number, oncekiHafta: string | null) => string
  onizlemeAc: string
  onizlemeKapat: string
  onizlemeBaslik: string
  onizlemeOnce: string
  onizlemeSonra: string
  onizlemeYok: string
  onizlemeNotu: string
  uygula: string
  kapat: string
  unut: string
  klinikBaslik: string
  klinikAciklama: string
  klinikPaylasir: string
  klinikPaylasmaz: string
  klinikAc: string
  klinikAyril: string
  klinikAktif: (n: number) => string
  klinikPasif: string
  klinikUyeDegil: string
  klinikEtiket: string
  sayfaGeri: string
  sayfaBaslik: string
  sayfaAciklama: string
  yukleniyor: string
  kuralYok: string
  kanit: (n: number) => string
  ilk: string
  son: string
  kategori: Record<string, string>
  durum: Record<'aday' | 'uygulanir' | 'kapali', string>
  kaynak: Record<'doktor_soyledi' | 'duzeltme' | 'gozlem', string>
}


export const OGRENME_METINLERI: Record<OgrenmeDil, OgrenmeMetni> = {
  tr: {
    ivmeBaslik: 'Öğrenme ivmesi',
    ivmeBos: (n) => `Henüz yeterli onaylı not yok (${n}/3). Üç onaylı nottan sonra düzeltme eğiliminizi burada göstereceğim.`,
    ivmeErken: 'Yön söylemek için henüz erken; rakamlar notlarınızın gerçek düzeltme sayısıdır.',
    ivmeSatir: (n, ilk, son) => `Son ${n} onaylı notta not başına düzeltme: ${ilk} → ${son}`,
    ivmeAzaliyor: 'Not başına düzeltme azalıyor.',
    ivmeSabit: 'Not başına düzeltme yaklaşık aynı.',
    ivmeArtiyor: 'Not başına düzeltme arttı.',
    ivmeNot: (n) => `${n} onaylı notun ölçümü. Yalnız gerçek düzeltmeler sayılır.`,
    ivmeBirim: 'düzeltme / not',
    haftalik: (bu, n, onceki) => `Bu hafta ${n} onaylı notta ortalama ${bu} düzeltme${onceki ? ` (geçen hafta ${onceki})` : ''}.`,
    onizlemeAc: 'Bu kuralla nasıl yazılırdı?',
    onizlemeKapat: 'Örneği gizle',
    onizlemeBaslik: 'Kendi notlarınızdan örnek',
    onizlemeOnce: 'Kuralsız taslak',
    onizlemeSonra: 'Bu kuralla şöyle yazılırdı',
    onizlemeYok: 'Bu kural için saklı bir örnek bulunamadı.',
    onizlemeNotu: 'Örnek, sizin onayladığınız düzeltmeden alınır; yeni bir üretim yapılmaz.',
    uygula: 'Uygula',
    kapat: 'Kapat',
    unut: 'Unut',
    klinikBaslik: 'Klinik ortak üslup',
    klinikAciklama: 'Açarsanız yalnız üslup kurallarınız (terim, biçim, uzunluk, sıra) klinikteki aynı branştan meslektaşlarınızla paylaşılır; onlarınkiler de size gelir.',
    klinikPaylasir: 'Paylaşılan: yalnız üslup kuralları.',
    klinikPaylasmaz: 'Paylaşılmayan: hasta verisi, notlar, ilaç ve doz. Kuralların kimden geldiği gösterilmez.',
    klinikAc: 'Klinik ortak üslubuna katıl',
    klinikAyril: 'Ayrıl ve kurallarımı havuzdan çıkar',
    klinikAktif: (n) => `Açık · ortak havuzdan size ${n} kural geliyor.`,
    klinikPasif: 'Kapalı. Hiçbir kuralınız paylaşılmıyor.',
    klinikUyeDegil: 'Bir klinik üyeliği bulunmuyor.',
    klinikEtiket: 'Klinik üslubu',
    sayfaGeri: '‹ Ayarlar',
    sayfaBaslik: 'Ayşe’nin hafızası',
    sayfaAciklama: 'Öğrendiği her kural burada. Uygulanır olanlar bir sonraki nota girer. Unut bir kez dokunuş.',
    yukleniyor: 'Yükleniyor…',
    kuralYok: 'Henüz öğrenilen bir kural yok.',
    kanit: (n) => `${n} kanıt`,
    ilk: 'ilk',
    son: 'son',
    kategori: { uslup: 'Üslup', klinik: 'Klinik', uygulama: 'Uygulama', rutin: 'Ritim', iletisim: 'İletişim', kisisel: 'Kişisel' },
    durum: { aday: 'aday', uygulanir: 'uygulanır', kapali: 'kapalı' },
    kaynak: { doktor_soyledi: 'doktor_soyledi', duzeltme: 'duzeltme', gozlem: 'gozlem' },
  },
  en: {
    ivmeBaslik: 'Learning momentum',
    ivmeBos: (n) => `Not enough approved notes yet (${n}/3). After three approved notes I will show your correction trend here.`,
    ivmeErken: 'Too early to call a direction; the figures are the real number of corrections on your notes.',
    ivmeSatir: (n, ilk, son) => `Corrections per note across your last ${n} approved notes: ${ilk} → ${son}`,
    ivmeAzaliyor: 'Corrections per note are going down.',
    ivmeSabit: 'Corrections per note are about the same.',
    ivmeArtiyor: 'Corrections per note went up.',
    ivmeNot: (n) => `Measured over ${n} approved notes. Only real corrections are counted.`,
    ivmeBirim: 'corrections / note',
    haftalik: (bu, n, onceki) => `This week: ${bu} corrections per note on average across ${n} approved notes${onceki ? ` (last week ${onceki})` : ''}.`,
    onizlemeAc: 'How would this rule have written it?',
    onizlemeKapat: 'Hide example',
    onizlemeBaslik: 'Example from your own notes',
    onizlemeOnce: 'Draft without the rule',
    onizlemeSonra: 'Written with this rule',
    onizlemeYok: 'No stored example was found for this rule.',
    onizlemeNotu: 'The example comes from a correction you approved; nothing new is generated.',
    uygula: 'Apply',
    kapat: 'Turn off',
    unut: 'Forget',
    klinikBaslik: 'Clinic shared style',
    klinikAciklama: 'If you turn this on, only your style rules (terminology, format, length, order) are shared with colleagues in the same specialty in your clinic, and theirs reach you.',
    klinikPaylasir: 'Shared: style rules only.',
    klinikPaylasmaz: 'Not shared: patient data, notes, drugs and doses. Who a rule came from is never shown.',
    klinikAc: 'Join the clinic shared style',
    klinikAyril: 'Leave and remove my rules from the pool',
    klinikAktif: (n) => `On · ${n} rules reach you from the shared pool.`,
    klinikPasif: 'Off. None of your rules are shared.',
    klinikUyeDegil: 'You are not a member of a clinic.',
    klinikEtiket: 'Clinic style',
    sayfaGeri: '‹ Settings',
    sayfaBaslik: 'What Ayşe has learned',
    sayfaAciklama: 'Every rule learned from your corrections is here. Rules that are on go into your next note. Forget is one tap.',
    yukleniyor: 'Loading…',
    kuralYok: 'Nothing learned yet.',
    kanit: (n) => `${n} evidence`,
    ilk: 'first',
    son: 'last',
    kategori: { uslup: 'Style', klinik: 'Clinical', uygulama: 'App use', rutin: 'Routine', iletisim: 'Communication', kisisel: 'Personal' },
    durum: { aday: 'candidate', uygulanir: 'on', kapali: 'off' },
    kaynak: { doktor_soyledi: 'you said', duzeltme: 'your correction', gozlem: 'observed' },
  },
  uz: {
    ivmeBaslik: "O'rganish dinamikasi",
    ivmeBos: (n) => `Tasdiqlangan yozuvlar hali yetarli emas (${n}/3). Uchta tasdiqlangan yozuvdan keyin tuzatishlar dinamikasini shu yerda ko'rsataman.`,
    ivmeErken: "Yo'nalishni aytish uchun hali erta; raqamlar yozuvlaringizdagi haqiqiy tuzatishlar sonidir.",
    ivmeSatir: (n, ilk, son) => `Oxirgi ${n} ta tasdiqlangan yozuvda har bir yozuvga tuzatishlar: ${ilk} → ${son}`,
    ivmeAzaliyor: 'Har bir yozuvga tuzatishlar kamaymoqda.',
    ivmeSabit: 'Har bir yozuvga tuzatishlar deyarli o‘zgarmagan.',
    ivmeArtiyor: 'Har bir yozuvga tuzatishlar ko‘paydi.',
    ivmeNot: (n) => `${n} ta tasdiqlangan yozuv bo'yicha o'lchov. Faqat haqiqiy tuzatishlar hisoblanadi.`,
    ivmeBirim: 'tuzatish / yozuv',
    haftalik: (bu, n, onceki) => `Shu hafta ${n} ta tasdiqlangan yozuvda o'rtacha ${bu} tuzatish${onceki ? ` (o'tgan hafta ${onceki})` : ''}.`,
    onizlemeAc: "Bu qoida bilan qanday yozilgan bo'lardi?",
    onizlemeKapat: 'Namunani yashirish',
    onizlemeBaslik: "O'z yozuvlaringizdan namuna",
    onizlemeOnce: 'Qoidasiz qoralama',
    onizlemeSonra: 'Bu qoida bilan shunday yozilardi',
    onizlemeYok: "Bu qoida uchun saqlangan namuna topilmadi.",
    onizlemeNotu: "Namuna siz tasdiqlagan tuzatishdan olinadi; yangi matn yaratilmaydi.",
    uygula: "Qo'llash",
    kapat: "O'chirish",
    unut: 'Unutish',
    klinikBaslik: 'Klinikaning umumiy uslubi',
    klinikAciklama: "Yoqsangiz, faqat uslub qoidalaringiz (atama, shakl, uzunlik, tartib) klinikdagi shu yo'nalishdagi hamkasblaringiz bilan ulashiladi, ularniki esa sizga keladi.",
    klinikPaylasir: 'Ulashiladi: faqat uslub qoidalari.',
    klinikPaylasmaz: "Ulashilmaydi: bemor ma'lumotlari, yozuvlar, dori va dozalar. Qoida kimdan kelgani ko'rsatilmaydi.",
    klinikAc: "Klinikaning umumiy uslubiga qo'shilish",
    klinikAyril: "Chiqish va qoidalarimni umumiy to'plamdan olib tashlash",
    klinikAktif: (n) => `Yoqilgan · umumiy to'plamdan sizga ${n} ta qoida keladi.`,
    klinikPasif: "O'chirilgan. Hech bir qoidangiz ulashilmaydi.",
    klinikUyeDegil: "Siz klinika a'zosi emassiz.",
    klinikEtiket: 'Klinika uslubi',
    sayfaGeri: '‹ Sozlamalar',
    sayfaBaslik: "Ayşe o'rgangan narsalar",
    sayfaAciklama: "Tuzatishlaringizdan o'rganilgan har bir qoida shu yerda. Yoqilganlar keyingi yozuvga kiradi. Unutish bir bosish.",
    yukleniyor: 'Yuklanmoqda…',
    kuralYok: "Hali o'rganilgan qoida yo'q.",
    kanit: (n) => `${n} dalil`,
    ilk: 'birinchi',
    son: 'oxirgi',
    kategori: { uslup: 'Uslub', klinik: 'Klinik', uygulama: 'Ilova', rutin: 'Tartib', iletisim: 'Aloqa', kisisel: 'Shaxsiy' },
    durum: { aday: 'nomzod', uygulanir: 'yoqilgan', kapali: "o'chirilgan" },
    kaynak: { doktor_soyledi: 'siz aytdingiz', duzeltme: 'sizning tuzatishingiz', gozlem: 'kuzatilgan' },
  },
}


export function ogrenmeDili(ulke: string | undefined | null): OgrenmeDil {
  const k = String(ulke || 'tr').toLowerCase()
  if (k === 'tr') return 'tr'
  if (k === 'uz') return 'uz'
  return 'en'
}

export function ogrenmeMetni(ulke: string | undefined | null = aktifUlke()): OgrenmeMetni {
  return OGRENME_METINLERI[ogrenmeDili(ulke)]
}
