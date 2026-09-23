/**
 * Klinik mevzuat — SB / devlet sorumluluğu, hizmet kalitesi, KVKK, kayıt-arşiv.
 *
 * Araştırma kilidi 2026-09-22. Doktor TURKISH_REFS / SpecialtyKey’e dokunulmaz.
 * Canlı SBİYS / e-Nabız senkronu iddia edilmez.
 *
 * Omurga (10 dal):
 *  - 6698 KVKK m.6 özel nitelikli sağlık verisi + Kurul yeterli önlemler
 *  - Kişisel Sağlık Verileri Hakkında Yönetmelik (RG 21.06.2019/30808)
 *  - Hasta Hakları Yönetmeliği (RG 01.08.1998/23420; rıza m.15–26, 08.05.2014)
 *  - 3359 Sağlık Hizmetleri Temel Kanunu ek 19 — merkezi sağlık veri
 *  - 1219 Tababet — tıbbi tanı hekimde
 *
 * Hekim klinik: Ayakta Teşhis ve Tedavi Yapılan Özel Sağlık Kuruluşları
 * Hakkında Yönetmelik (RG 19.04.2025/32875) md.24 kayıt-arşiv.
 *
 * Müttefik: Sağlık Meslek Mensuplarının Serbest Meslek İcrası Hakkında
 * Yönetmelik (RG 29.03.2025/32856) md.12 sorumluluk, md.16 hizmet, md.18 kayıt,
 * md.20 hasta hakları / SABİM, md.21 yasaklar, md.22 denetim.
 */

import { KLINIK_YENI_SLUGS, klinikSlugCoz, muttefikMeslekMi, type KlinikYeniSlug } from '@/lib/specialties/klinikDikey'

export const KLINIK_ORTAK_KANUNLAR = [
  '6698 sayılı KVKK m.6 — sağlık verisi özel nitelikli kişisel veridir',
  'Kişisel Sağlık Verileri Hakkında Yönetmelik (RG 21.06.2019/30808)',
  'Hasta Hakları Yönetmeliği (RG 01.08.1998/23420) m.15 aydınlatma · m.16 kayıt inceleme · m.17 düzeltme · m.26 rıza formu (iki nüsha, dosya + hasta)',
  '3359 sayılı Sağlık Hizmetleri Temel Kanunu ek 19 — merkezi sağlık veri aktarımı',
  '1219 sayılı Tababet Kanunu — tıbbi tanı ve tedavi planı hekimde',
  '5070 sayılı Elektronik İmza Kanunu — e-imzalı tıbbi kayıt resmî kayıttır (ürün e-imza iddia etmez)',
] as const

export const KLINIK_ORTAK_KAYIT = [
  'Sunulan her hizmet elektronik ortamda kaydedilir ve muhafaza edilir',
  'Hasta veya kanuni temsilci talebiyle kayıt paylaşılır (Hasta Hakları m.16)',
  'Rıza formu iki nüsha: biri dosyada, biri hastada (Hasta Hakları m.26)',
  '18 yaş altı: veli / yasal temsilci onamı — yaşa bağlı, dala değil',
  'KVKK aydınlatma + özel nitelikli veri için yeterli idari/teknik tedbir (silinme/değiştirmeye karşı)',
  'Denetimde kayıt ibrazı zorunlu',
  'SB kayıt tescilli sağlık bilgi yönetim sistemi (SBİYS) yükümlülüğü vardır — canlı USS senkronu bu üründe iddia edilmez',
] as const

export const KLINIK_ORTAK_QOS = [
  'Hasta mahremiyeti ve güvenliği (hizmet odası / seans)',
  'SABİM (Sağlık Bakanlığı İletişim Merkezi) karekod — bekleme salonu (müttefik md.20/2; hekim klinikte Hasta Hakları)',
  'Tanıtım: Sağlık Hizmetlerinde Tanıtım ve Bilgilendirme Faaliyetleri Hakkında Yönetmelik (RG 29.07.2023/32263) — yanıltıcı sonuç vaadi yok',
  'Yıllık olağan denetim + tıbbi endikasyon/uygulama denetimi (hasta dosyası, e-kayıt, tıbbi foto/video)',
] as const

export type KlinikMevzuat = {
  slug: KlinikYeniSlug
  rejim: 'hekim-klinik' | 'muttefik'
  kanunlar: string[]
  qos: string[]
  kvkk: string[]
  kayit: string[]
  riza: string[]
  yasak: string[]
  sorumluluk: string[]
}

const HEKIM_KAYIT_OMURGA = [
  'Ayakta Teşhis Yönetmeliği (RG 19.04.2025/32875) md.24 — elektronik kayıt + SB tescilli SBYS/MBYS',
  'Mesul müdür: yedekleme, arşiv, silinmeye karşı tedbir',
  'Zorunlu formlar (rıza, işlem kaydı) ayrıca saklanır',
  'Eski Özel Hastaneler uygulamasındaki “en az 20 yıl” cümlesi 2025 metninde “ilgili mevzuata uygun saklama”dır — 20 yıl iddia edilmez',
]

function hekim(slug: KlinikYeniSlug, extra: Omit<KlinikMevzuat, 'slug' | 'rejim' | 'kanunlar'> & { kanunlar?: string[] }): KlinikMevzuat {
  return {
    slug,
    rejim: 'hekim-klinik',
    kanunlar: [...KLINIK_ORTAK_KANUNLAR, 'Ayakta Teşhis ve Tedavi Yapılan Özel Sağlık Kuruluşları Hakkında Yönetmelik (RG 19.04.2025/32875)', ...(extra.kanunlar || [])],
    qos: extra.qos,
    kvkk: extra.kvkk,
    kayit: extra.kayit,
    riza: extra.riza,
    yasak: extra.yasak,
    sorumluluk: extra.sorumluluk,
  }
}

function muttefik(slug: KlinikYeniSlug, extra: Omit<KlinikMevzuat, 'slug' | 'rejim' | 'kanunlar'> & { kanunlar?: string[] }): KlinikMevzuat {
  return {
    slug,
    rejim: 'muttefik',
    kanunlar: [
      ...KLINIK_ORTAK_KANUNLAR,
      'Sağlık Meslek Mensuplarının Serbest Meslek İcrası Hakkında Yönetmelik (RG 29.03.2025/32856)',
      'Sağlık Meslek Mensupları ile Diğer Meslek Mensuplarının İş ve Görev Tanımlarına Dair Yönetmelik (RG 22.05.2014/29007)',
      ...(extra.kanunlar || []),
    ],
    qos: extra.qos,
    kvkk: extra.kvkk,
    kayit: extra.kayit,
    riza: extra.riza,
    yasak: extra.yasak,
    sorumluluk: extra.sorumluluk,
  }
}

export const KLINIK_MEVZUAT: Record<KlinikYeniSlug, KlinikMevzuat> = {
  'sac-ekimi': hekim('sac-ekimi', {
    qos: [
      ...KLINIK_ORTAK_QOS,
      'SB saç ekimi uygulayıcı sertifikası / tıbbi estetik yetkinlik — sertifikasız işlem yok',
      'TPRECD / EPCD etik: sonuç vaadi ve greft sayısı reklamı yok',
    ],
    kvkk: [
      'Saç / saçlı deri fotoğrafı özel nitelikli sağlık + görüntü verisi — ayrı açık rıza',
      'Portal (Saçım) greft/tanı taşımaz; nekroz/ateş → 112, portal beklenmez',
    ],
    kayit: [
      ...HEKIM_KAYIT_OMURGA,
      'Onam tarihi, işlem tarihi, greft bandı (karar desteği — nihai sayı hekimde), yıkama 1/3/10/14 vadeleri',
      'Önce/sonra foto: KVKK rızası işaretli değilse arşive konmaz',
    ],
    riza: [
      'Hasta Hakları m.15–26: işlem, alternatif, komplikasyon (nekroz, şok, anestezi), red sonucu',
      'Aynı gün onam zayıf kabul — makul değerlendirme süresi (yargı / Hasta Hakları; yönetmelikte sabit gün yok)',
    ],
    yasak: ['Uydurma greft / SGK FUE paket iddiası', 'Hairline AI tanı', 'Sertifikasız uygulayıcı'],
    sorumluluk: ['Aydınlatma doğruluğu hekimde', '112: donor nekroz, anafilaksi'],
  }),
  'estetik-cerrahi': hekim('estetik-cerrahi', {
    qos: [
      ...KLINIK_ORTAK_QOS,
      'Ayakta Teşhis: estetik/kozmetik ancak tabip + eğitim/sertifika yetkinliğiyle',
      'TPRECD etik + elektif soğuma kaydı (makul süre; sabit gün uydurulmaz)',
    ],
    kvkk: [
      'Ameliyat foto/video denetimde istenebilir (md.22 analog) — ayrı rıza',
      'Portal (Ameliyat bakımım) kesi/implant taşımaz',
    ],
    kayit: [
      ...HEKIM_KAYIT_OMURGA,
      'Onam tarihi, planlanan ameliyat tarihi, soğuma bayrağı, 1/7/14/42 izlem',
      'Rıza iki nüsha dosyada',
    ],
    riza: [
      'Hasta Hakları m.26 — işlem-spesifik risk (rino/lipo/meme); matbu “her komplikasyon” yetersiz',
      'TBK eser / Tüketici: sonuç taahhüdü yazılmaz',
    ],
    yasak: ['OR HIS / implant seçimi', 'TUS Yaram / rekonstrüktif paket', 'Aynı gün alelacele onamı “uygun” işaretlemek'],
    sorumluluk: ['Onam içeriğinin doğruluğu hekimde', 'Emboli / nefes / bacak şişliği → 112'],
  }),
  'medikal-estetik': hekim('medikal-estetik', {
    qos: [
      ...KLINIK_ORTAK_QOS,
      'Ayakta Teşhis estetik/kozmetik — salon/IPL tesisi değil',
      'TİTCK KÜB: botulinum / HA — ünite hekimde',
    ],
    kvkk: ['Yüz fotoğrafı ayrı rıza', 'Portal ürün/ünite taşımaz'],
    kayit: [
      ...HEKIM_KAYIT_OMURGA,
      'Onam, soğuma, işlem tarihi, 14/28 kontrol, vasküler 112 bayrağı',
      'Ünite/mL sisteme yazılmaz',
    ],
    riza: ['Hasta Hakları m.15–26 + vasküler oklüzyon / görme kaybı anlatımı', 'Hyaluronidaz kararı hekimde'],
    yasak: ['Ünite uydurma', 'SGK dolgu/botoks paket', 'Sonuç garantisi reklamı'],
    sorumluluk: ['KÜB endikasyon hekimde', 'Livedo / görme → 112, portal beklenmez'],
  }),
  'klinik-dermatoloji': hekim('klinik-dermatoloji', {
    qos: [
      ...KLINIK_ORTAK_QOS,
      'TİTCK lazer/IPL cihaz kaydı ve güvenlik',
      'TDD kozmetik/lazer pratik — TUS biyolojik/Derim değil',
    ],
    kvkk: ['Lezyon/lazer foto ayrı rıza', 'Portal (Bakımım) skor/fluence taşımaz'],
    kayit: [
      ...HEKIM_KAYIT_OMURGA,
      'Lazer seans aralığı, akne 2/6/12 bakım, 112 bayrağı',
      'Fluence ve ICD yazılmaz',
    ],
    riza: ['Lazer yanık / pigment / göz riski — Hasta Hakları m.15', 'Soğuma Ayakta Teşhis kaydı'],
    yasak: ['TUS Derim / biyolojik rapor', 'Fluence uydurma', 'SGK kozmetik lazer paket'],
    sorumluluk: ['Cihaz kalibrasyonu mesul müdür/hekim', 'Kabarcık / görme / nefes → 112'],
  }),
  longevity: hekim('longevity', {
    qos: [
      ...KLINIK_ORTAK_QOS,
      'IV / parenteral: TİTCK KÜB + Ayakta Teşhis güvenlik — karışım yazılmaz',
      'GETAT kapsamı uydurulmaz; NAD+ “SB protokolü” iddia edilmez',
    ],
    kvkk: ['Lab/biyobelirteç yorumu özel nitelikli veri — hekim notu; portal yorum taşımaz'],
    kayit: [...HEKIM_KAYIT_OMURGA, 'Seans vadesi, sınıf (IV/izlem), reaksiyon 112', 'İçerik/doz kaydı hekim serbest metnidir, motor üretmez'],
    riza: ['IV reaksiyon / anafilaksi anlatımı', 'Wellness sonuç vaadi yok'],
    yasak: ['NAD+/hormon protokolü uydurma', 'SGK wellness paket', 'Endokrin motor'],
    sorumluluk: ['Parenteral güvenliği hekimde', 'IV reaksiyon → 112'],
  }),
  fizyoterapi: muttefik('fizyoterapi', {
    qos: [
      ...KLINIK_ORTAK_QOS,
      'md.16: yalnız hekim tanısı + tedavi planı/reçetesi olan hastaya uygulama',
      'ICF işlevsellik dili — tanı değil',
      'Uygulama odası ≥10 m² + lavabo (md.11)',
    ],
    kvkk: ['Seans kaydı özel nitelikli sağlık verisi', 'Portal (Fizyom) tanı/egzersiz reçetesi taşımaz', 'Hekim, hasta onayıyla süreç kaydını görebilir (md.16/2-f)'],
    kayit: [
      'md.18: hasta verisi + hekim planı elektronik; SB tescilli SBYS zorunlu (canlı senkron iddia yok)',
      'md.16/2-f: her uygulama detay kaydı',
      'Hekim tanı referansı, ICF özeti, seans vadesi — SGK hak iddiası yok',
    ],
    riza: ['md.16/2-d: her uygulama için yazılı rıza', 'Hasta Hakları m.26 iki nüsha'],
    yasak: [
      'md.16/4-d tıbbi teşhis',
      'md.21/8 tetkik/tahlil istemek',
      'md.21/4 yetki dışı ilaç/takviye satışı',
      'FTR enjeksiyon / e-reçete / SGK seans hakkı',
    ],
    sorumluluk: ['md.12: kayıt-arşiv, KVKK tedbir, cihaz kalibrasyon, müdürlük bildirimi', 'Cauda / göğüs → 112 veya hekime iade'],
  }),
  'klinik-psikolog': muttefik('klinik-psikolog', {
    qos: [
      ...KLINIK_ORTAK_QOS,
      'Türk Psikologlar Derneği Etik — sır saklama / yetkinlik',
      'md.16: hekim tanısı olan hastada plan; sağlıklı bireyde meslek yetkisiyle sınırlı (tanı yok)',
      'Yalnız bir psikolog çalıştırılabilir (md.13)',
    ],
    kvkk: [
      'Ruh sağlığı verisi özel nitelikli — ekstra gizlilik',
      'Portal (Seanslarım) tanı/skor taşımaz',
      'Ölçek skoru yorumlanmaz (KVKK + meslek kilidi)',
    ],
    kayit: ['md.18 elektronik kayıt + hekim planı varsa belgele', 'Seans çerçevesi (BDT/EMDR/ACT adı), kriz 112 bayrağı — DSM motoru yok'],
    riza: ['Her seans için yazılı rıza (md.16/2-d)', 'Sır saklama anlatımı Etik Yönetmelik'],
    yasak: ['Tıbbi tanı / DSM motoru', 'Psikotrop / yeşil reçete', 'md.21/8 tetkik istemek', 'PHQ skor yorumu'],
    sorumluluk: ['Kriz → 112', 'Kayıt mahremiyeti meslek mensubunda (md.18/4)'],
  }),
  diyetisyen: muttefik('diyetisyen', {
    qos: [
      ...KLINIK_ORTAK_QOS,
      'TBT ancak hekim tanısı + plan ile (md.16/2)',
      'Türkiye Diyetisyenler Derneği TBT çerçevesi',
    ],
    kvkk: ['Beslenme kaydı + varsa hekim tanısı özel nitelikli veri', 'Portal lab yorumu taşımaz'],
    kayit: ['Hekim tanı referansı, makro bandı (hedef hekim/danışanda), kontrol vadesi', 'md.18 elektronik muhafaza'],
    riza: ['Her TBT uygulaması için yazılı rıza', 'Kalori hedefi kilitlenmez'],
    yasak: ['md.21/4 gıda takviyesi bulundurma/satış', 'md.21/8 tetkik istemek', 'Takviye dozu / insülin', 'Tanısız TBT'],
    sorumluluk: ['TBT endikasyonu hekim tanısına bağlı', 'md.12 kayıt ve KVKK tedbir'],
  }),
  ergoterapi: muttefik('ergoterapi', {
    qos: [
      ...KLINIK_ORTAK_QOS,
      'GYA / ICF — tanı hekimde',
      'Pediatri büyüme araçları bu birimde yoktur',
    ],
    kvkk: ['İşlevsellik kaydı özel nitelikli veri', 'Portal (Ergom) motor skor taşımaz'],
    kayit: ['Hekim tanı referansı, GYA odak, seans vadesi', 'md.18 elektronik + denetim ibrazı'],
    riza: ['Her uygulama yazılı rıza (md.16/2-d)'],
    yasak: ['Tıbbi tanı', 'Neyzi / hedef boy', 'md.21/8 tetkik', 'Ekipman SGK rapor iddiası'],
    sorumluluk: ['md.12 kayıt-arşiv', 'Rapor hekim imzasındadır'],
  }),
  odyoloji: muttefik('odyoloji', {
    qos: [
      ...KLINIK_ORTAK_QOS,
      'md.11/1-c: uygulama odası içinde ≥3 m² ses yalıtımlı, camlı iki bölmeli sessiz oda/kabin zorunlu',
      'Cihazlar Ürün Takip Sistemine kayıtlı (md.11/4)',
      'PTA dB kayıt — kayıp tanısı KBB hekimde',
    ],
    kvkk: ['Odyogram özel nitelikli sağlık verisi', 'Portal dB yorumu taşımaz'],
    kayit: ['Eşik kaydı (tanı değil), cihaz listesi yalnız hekim raporu bayrağıyla', 'md.18 elektronik + hekim planı'],
    riza: ['Her ölçüm/uygulama yazılı rıza', 'Ani kayıp: KBB/112 — odyolog tanı koymaz'],
    yasak: ['İşitme kaybı tanısı', 'KBB motor / koklear HIS', 'md.21/8 tetkik istemek', 'SGK cihaz iddiası hekim raporu yoksa'],
    sorumluluk: ['Sessiz oda ve kalibrasyon (md.12/ğ)', 'Ani işitme → KBB acil'],
  }),
}

export function klinikMevzuat(ham: string | null | undefined): KlinikMevzuat | null {
  const slug = klinikSlugCoz(ham)
  return slug ? KLINIK_MEVZUAT[slug] : null
}

export function klinikMevzuatOzet(ham: string | null | undefined): string {
  const m = klinikMevzuat(ham)
  if (!m) return ''
  const rejim = m.rejim === 'muttefik'
    ? '29.03.2025 md.16–18: hekim planı + yazılı rıza + elektronik kayıt. Tanı/reçete/tetkik yok.'
    : 'Ayakta Teşhis md.24 + Hasta Hakları m.26: elektronik kayıt, iki nüsha rıza, KVKK foto. Doz uydurma yok.'
  return `${rejim} KVKK m.6 özel nitelikli sağlık verisi.`
}

export function klinikKayitChecklist(ham: string | null | undefined): string[] {
  const m = klinikMevzuat(ham)
  if (!m) return [...KLINIK_ORTAK_KAYIT]
  return [...KLINIK_ORTAK_KAYIT, ...m.kayit, ...m.riza]
}

export function klinikYasaklar(ham: string | null | undefined): string[] {
  const m = klinikMevzuat(ham)
  return m ? m.yasak : []
}

export function muttefikHekimPlaniZorunlu(ham: string | null | undefined): boolean {
  return muttefikMeslekMi(ham)
}

export const KLINIK_MEVZUAT_SLUGS = KLINIK_YENI_SLUGS
