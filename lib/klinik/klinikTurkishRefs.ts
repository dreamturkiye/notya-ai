/**
 * Klinik golden references — TR clinicians / allied professionals actually use.
 *
 * Same 5-slot pattern as doctor TURKISH_REFS (`lib/asistan/turkishSpecialtyRefs.ts`):
 *  1) Named T.C. Sağlık Bakanlığı document / yönetmelik
 *  2) Primary Turkish specialty / meslek derneği
 *  3) Sister society / focused TR protocol
 *  4) Additional TR practice source (TİTCK, ICF-TR, tarama)
 *  5) SGK / rapor — or honest “kapsam dışı / iddia yok”
 *
 * Practice authority = these TR sources. International texts are secondary depth only.
 *
 * NOT SpecialtyKey. Never merge into doctor TURKISH_REFS.
 * Fizyoterapi ≠ FTR · klinik-psikolog ≠ psikiyatri · odyoloji ≠ KBB
 * klinik-dermatoloji ≠ TUS Derim · estetik-cerrahi ≠ plastik Yaram.
 */

import { KLINIK_YENI_SLUGS, klinikSlugCoz, type KlinikYeniSlug } from '@/lib/specialties/klinikDikey'

export const KLINIK_TURKISH_REFS: Record<KlinikYeniSlug, string[]> = {
  'sac-ekimi': [
    'T.C. SB saç ekimi uygulayıcı sertifikası / tıbbi estetik uygulama çerçevesi',
    'Türk Plastik Rekonstrüktif ve Estetik Cerrahi Derneği (TPRECD) etik ve hasta güvenliği',
    'Estetik Plastik Cerrahi Derneği (EPCD) ayaktan saç cerrahisi pratik önerileri',
    'T.C. SB Ayakta Teşhis ve Tedavi Yapılan Özel Sağlık Kuruluşları Hakkında Yönetmelik (soğuma / onam)',
    'SGK kozmetik FUE/DHI paket iddiası yazılmaz — greft sayısı hekimde',
  ],
  'estetik-cerrahi': [
    'T.C. SB Ayakta Teşhis ve Tedavi Yapılan Özel Sağlık Kuruluşları Hakkında Yönetmelik (elektif soğuma / onam)',
    'Türk Plastik Rekonstrüktif ve Estetik Cerrahi Derneği (TPRECD) etik ve hasta güvenliği',
    'Estetik Plastik Cerrahi Derneği (EPCD) rino/lipo/meme izlem pratik önerileri',
    'T.C. SB ameliyathane / cerrahi güvenlik protokolleri (ayaktan elektif)',
    'SGK elektif kozmetik paket iddiası yazılmaz — rekonstrüktif HIS TUS plastiktedir',
  ],
  'medikal-estetik': [
    'T.C. SB Ayakta Teşhis ve Tedavi — botoks/dolgu soğuma ve onam kaydı',
    'TPRECD / EPCD medikal estetik hasta güvenliği önerileri',
    'TİTCK botulinum toksin ve hyaluronik asit KÜB (ünite/mL hekimde; sistem yazmaz)',
    'TR ayaktan vasküler oklüzyon pratik: görme kaybı / livedo → 112; hyaluronidaz hekimde',
    'SGK kozmetik dolgu/botoks paket iddiası yazılmaz',
  ],
  'klinik-dermatoloji': [
    'T.C. SB Ayakta Teşhis ve Tedavi — lazer / kozmetik işlem soğuma',
    'Türk Dermatoloji Derneği (TDD) akne ve kozmetik dermatoloji konsensusları (klinik pratik; biyolojik rapor chapter’ı değil)',
    'TDD fototerapi / lazer çalışma grubu önerileri — fluence ve endikasyon hekimde',
    'TİTCK lazer / IPL cihaz ve kozmetik ürün güvenliği',
    'SGK kozmetik lazer paket iddiası yazılmaz — biyolojik rapor TUS dermatolojidedir',
  ],
  longevity: [
    'T.C. SB Ayakta Teşhis / özel sağlık — IV ve izlem güvenliği (karışım yazılmaz)',
    'Türk Geriatri Derneği klinik yaşlanma / koruyucu yaklaşım (tanı hekimde)',
    'TİTCK parenteral ürün KÜB — NAD+/hormon protokolü uydurulmaz',
    'TEMD yaşam tarzı önerileri yalnız hekim tanı referansı ile (endokrin motor yok)',
    'SGK wellness / IV paket iddiası yazılmaz',
  ],
  fizyoterapi: [
    'T.C. SB Sağlık Meslek Mensuplarının Serbest Meslek İcrası Hakkında Yönetmelik (RG 29.03.2025/32856) — fizyoterapist; tanı/reçete yok',
    'Türkiye Fizyoterapistler Derneği (TFTD) meslek çerçevesi ve eğitim önerileri',
    'ICF (WHO) — TR fizyoterapi eğitiminde kullanılan işlevsellik dili (tanı değil)',
    'T.C. SB rehabilitasyon hizmetleri: hekim tanı referansı zorunlu',
    'SGK fizik tedavi seans hakkı iddia edilmez — FTR raporu hekimdedir',
  ],
  'klinik-psikolog': [
    'T.C. SB Sağlık Meslek Mensuplarının Serbest Meslek İcrası Hakkında Yönetmelik (RG 29.03.2025/32856) — klinik psikolog; tıbbi tanı/reçete yok',
    'Türk Psikologlar Derneği (psikolog.org.tr) Etik Yönetmeliği — sır saklama / yetkinlik',
    'Bilişsel Davranışçı Psikoterapiler Derneği eğitim çerçevesi (BDT kaydı; DSM tanı motoru yok)',
    'T.C. SB kriz yönlendirme / 112 — ölçek skoru yorumlanmaz',
    'SGK reçete-rapor çerçevesi bu meslekte yoktur — psikotrop yazılmaz',
  ],
  diyetisyen: [
    'T.C. SB Sağlık Meslek Mensuplarının Serbest Meslek İcrası Hakkında Yönetmelik (RG 29.03.2025/32856) — diyetisyen; tıbbi tanı yok',
    'Türkiye Diyetisyenler Derneği (tdd.org.tr) Tıbbi Beslenme Tedavisi çerçevesi',
    'T.C. SB HSGM Diyabette Tıbbi Beslenme Tedavisi / toplum beslenmesi rehberleri — kalori hedefi hekim/danışanda',
    'TEMD DM beslenme önerileri yalnız hekim tanı referansı ile (endokrin / insülin motoru yok)',
    'SGK mama / takviye rapor ve doz iddiası yazılmaz',
  ],
  ergoterapi: [
    'T.C. SB Sağlık Meslek Mensuplarının Serbest Meslek İcrası Hakkında Yönetmelik (RG 29.03.2025/32856) — iş ve uğraşı terapisti (ergoterapist); tanı yok',
    'Ergoterapi Derneği (ergoterapidernegi.org) meslek çerçevesi — WFOT üyesi TR dernek',
    'ICF + GYA (günlük yaşam aktiviteleri) değerlendirme dili — tanı hekimde',
    'T.C. SB engellilik / işlevsellik değerlendirme (rapor hekimde)',
    'Pediatri büyüme eğrisi / boy tahmini araçları bu dalda açılmaz',
  ],
  odyoloji: [
    'T.C. SB Sağlık Meslek Mensuplarının Serbest Meslek İcrası Hakkında Yönetmelik (RG 29.03.2025/32856) — odyolog; işitme kaybı tanısı yok',
    'Türkiye Odyologlar ve Konuşma Bozuklukları Derneği (odyoloji.org.tr) meslek çerçevesi',
    'Odyologlar Derneği (odyologlar.org.tr) lisans odyolog pratik önerileri',
    'T.C. SB yenidoğan / okul işitme tarama protokolleri (tarama; tanı KBB hekimde)',
    'SGK işitme cihazı — uzman hekim raporu yoksa iddia yok; KBB motoru kopyalanmaz',
  ],
}

/** Secondary international texts — depth only; never override KLINIK_TURKISH_REFS. */
export const KLINIK_SECONDARY_TEXTBOOKS: Record<KlinikYeniSlug, string[]> = {
  'sac-ekimi': [
    'ISHRS / Unger Hair Transplantation (uluslararası destek — çakışmada SB sertifika + TPRECD öncelikli)',
    'Hair transplant atlas (ikincil teknik derinlik)',
  ],
  'estetik-cerrahi': [
    "Grabb and Smith's Plastic Surgery (uluslararası destek — çakışmada Ayakta Teşhis + TPRECD/EPCD öncelikli)",
    'Neligan Plastic Surgery — elektif estetik bölümleri (ikincil)',
  ],
  'medikal-estetik': [
    'Carruthers / facial injectables atlas (uluslararası destek — çakışmada TİTCK KÜB + TPRECD öncelikli)',
    'Vasküler anatomi atlası (ikincil; hyaluronidaz hekimde)',
  ],
  'klinik-dermatoloji': [
    "Fitzpatrick's Dermatology — kozmetik/lazer bölümleri (uluslararası destek — çakışmada TDD klinik pratik öncelikli)",
    'Lazer-doku etkileşimi metinleri (fluence hekimde)',
  ],
  longevity: [
    'Geriatric / preventive medicine texts (uluslararası destek — çakışmada Türk Geriatri Derneği + TİTCK öncelikli)',
    'IV nutrient literature (protokol yazılmaz)',
  ],
  fizyoterapi: [
    'Kisner / Magee therapeutic exercise (uluslararası destek — çakışmada 29.03.2025 + TFTD öncelikli)',
    'ICF practice manuals (tanı değil)',
  ],
  'klinik-psikolog': [
    "Beck CBT / Shapiro EMDR (uluslararası destek — çakışmada Türk Psikologlar Derneği Etik + 29.03.2025 öncelikli)",
    'ACT / süreç temelli metinler (DSM tanı motoru yok)',
  ],
  diyetisyen: [
    'Krause / Mahan Food & the Nutrition Care Process (uluslararası destek — çakışmada TDD TBT + 29.03.2025 öncelikli)',
    'Academy of Nutrition and Dietetics NCP (ikincil; tıbbi tanı hekimde)',
  ],
  ergoterapi: [
    'Willard & Spackman Occupational Therapy (uluslararası destek — çakışmada Ergoterapi Derneği + 29.03.2025 öncelikli)',
    'WFOT uygulama metinleri (ikincil)',
  ],
  odyoloji: [
    'Katz Handbook of Clinical Audiology (uluslararası destek — çakışmada TOKSUD/Odyologlar Derneği + 29.03.2025 öncelikli)',
    'ISO/ANSI odyometri ölçüm pratiği (dB kayıt; kayıp tanısı yok)',
  ],
}

const LANDING_DERM = 'klinik-dermatoloji' as const

export function klinikTurkishRefs(ham: string | null | undefined): string[] {
  const slug = klinikSlugCoz(ham)
  if (slug) return KLINIK_TURKISH_REFS[slug]
  const n = String(ham || '').trim().toLocaleLowerCase('tr-TR')
  if (n === 'dermatoloji') return KLINIK_TURKISH_REFS[LANDING_DERM]
  return []
}

export function klinikSecondaryTextbooks(ham: string | null | undefined): string[] {
  const slug = klinikSlugCoz(ham)
  if (slug) return KLINIK_SECONDARY_TEXTBOOKS[slug]
  const n = String(ham || '').trim().toLocaleLowerCase('tr-TR')
  if (n === 'dermatoloji') return KLINIK_SECONDARY_TEXTBOOKS[LANDING_DERM]
  return []
}

export function klinikKaynakCumlesi(ham: string | null | undefined): string {
  const refs = klinikTurkishRefs(ham)
  return refs.length ? refs.join('; ') : ''
}

export const KLINIK_REF_SLUGS = KLINIK_YENI_SLUGS
