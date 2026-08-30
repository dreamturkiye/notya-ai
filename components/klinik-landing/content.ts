/**
 * NOTYA-KLINIK-01 — /klinik landing copy and data, in one place like doktor-landing/content.ts.
 *
 * Positioning decision (2026-08-27): Notya Klinik sells on its own value — Türkçe klinik AI +
 * KVKK — to Turkish clinics. Pabau appears ONCE, as an integration in the Entegrasyonlar section,
 * never as identity: "Pabau eklentisi" would mean nothing to the domestic majority and would cap
 * the page at the health-tourism minority. No partner claims until the marketplace listing is
 * approved; TRADEMARK_NOTE below covers nominative use.
 */

export const LINKS = {
  signup: "/kayit",
  signupKlinik: "/kayit?plan=klinik",
  login: "/giris",
  kvkk: "/kvkk",
  home: "/home",
  doktor: "/doktor",
} as const;

export const NAV = [
  { href: "#branslar", label: "Branşlar", index: "01" },
  { href: "#isleyis", label: "İşleyiş", index: "02" },
  { href: "#guvenlik", label: "Güvenlik", index: "03" },
  { href: "#entegrasyonlar", label: "Entegrasyonlar", index: "04" },
  { href: "#fiyat", label: "Fiyat", index: "05" },
] as const;

export const HERO_FACTS = [
  { k: "Branş", v: "10 klinik dalı" },
  { k: "Ses", v: "Gerçek zamanlı Türkçe" },
  { k: "Mevzuat", v: "KVKK · 29.03.2025 yönetmeliği" },
  { k: "Deneme", v: "15 gün, kart gerekmez" },
] as const;

/**
 * The signature of the page: one row per discipline, colors from lib/ai/personas/klinik_uzmanlar.ts
 * so the landing and the product agree on identity. `yonetmelik` marks the five professions that
 * gained independent-practice rights with the 29 Mart 2025 yönetmeliği — the reason a wave of new
 * clinics exists at all.
 */
export const BRANSLAR = [
  { slug: "sac-ekimi", ad: "Saç Ekimi", renk: "#2563EB", odak: "FUE, DHI ve Safir FUE. Donör alan değerlendirmesi, greft hesabı, hairline tasarımı, PRP protokolleri.", yonetmelik: false },
  { slug: "estetik-cerrahi", ad: "Estetik & Plastik Cerrahi", renk: "#E91E8C", odak: "Rinoplasti, liposuction, meme estetiği. Ameliyat öncesi risk değerlendirmesi, sonrası bakım planı.", yonetmelik: false },
  { slug: "medikal-estetik", ad: "Medikal Estetik", renk: "#9333EA", odak: "Botoks, hyaluronik asit dolgu, PRP, mezoterapi. Yüz anatomisi, doz hesabı, vasküler komplikasyon yönetimi.", yonetmelik: false },
  { slug: "dermatoloji", ad: "Dermatoloji", renk: "#F59E0B", odak: "Lazer, botoks, dolgu, akne tedavisi. ICD-10 dermatoloji kodlaması, biyopsi kararı desteği.", yonetmelik: false },
  { slug: "longevity", ad: "Longevity & Wellness", renk: "#059669", odak: "IV terapi, hormonal optimizasyon, NAD+ protokolleri. Biyobelirteç analizi, kişiselleştirilmiş plan.", yonetmelik: false },
  { slug: "fizyoterapi", ad: "Fizyoterapi", renk: "#0EA5E9", odak: "Kas-iskelet değerlendirmesi, nörolojik rehabilitasyon, manuel terapi, egzersiz reçetesi. ICF sınıflaması.", yonetmelik: true },
  { slug: "klinik-psikolog", ad: "Klinik Psikoloji", renk: "#6366F1", odak: "BDT, EMDR ve ACT yaklaşımları. DSM-5 ölçütleriyle değerlendirme; etik ve sır saklama çerçevesi.", yonetmelik: true },
  { slug: "diyetisyen", ad: "Diyetisyen", renk: "#10B981", odak: "Besin analizi, makro/mikro hesaplama, tıbbi beslenme tedavisi, laboratuvar sonucu yorumu.", yonetmelik: true },
  { slug: "ergoterapi", ad: "Ergoterapi", renk: "#8B5CF6", odak: "GYA değerlendirmesi, uyarlanabilir ekipman seçimi, nörolojik ve pediatrik motor rehabilitasyon.", yonetmelik: true },
  { slug: "odyoloji", ad: "Odyoloji", renk: "#F97316", odak: "Odyometri, timpanometri, OAE testleri. İşitme cihazı seçimi, tinnitus yönetimi, pediatrik tarama.", yonetmelik: true },
] as const;

export const YONETMELIK_NOTU =
  "29 Mart 2025 yönetmeliğiyle kendi kliniğini açma hakkı kazanan meslekler için hazır.";

/** İşleyiş really is a sequence — konuşma önce, not sonra, ekip ve hasta en sonda devralır. */
export const ISLEYIS = [
  { k: "Seansta konuşun", v: "Uzman yanınızda: sesli, Türkçe, gerçek zamanlı. Düğme yok, şablon yok." },
  { k: "Not kendiliğinden", v: "Seans biter bitmez yapılandırılmış not ve plan hazır. Siz hastayla ilgilenin." },
  { k: "Ekibiniz tek panelde", v: "Koltuklar, roller ve kullanım tek yönetim panelinde. Kim ne yapıyor, görürsünüz." },
  { k: "Hastanız cebinden", v: "Müşteri portalıyla hastanız randevusuna ve bilgilendirmesine kendi telefonundan ulaşır." },
] as const;

export const KVKK_PROOF = [
  { k: "Takma adlandırma", v: "Yapay zekâ hastanızın adını hiç görmez — her model çağrısından önce kimlik bilgileri takma adla değiştirilir." },
  { k: "Aydınlatma ve rıza", v: "Aydınlatma metni ve açık rıza kayıtları sistemin içinde; sonradan toplama telaşı yok." },
  { k: "İmha döngüsü", v: "Saklama süresi dolan veriler her gece otomatik imha döngüsünden geçer." },
  { k: "Türkiye mevzuatı", v: "KVKK'ya göre kurgulandı; genel geçer GDPR çevirisi değil." },
] as const;

export const TRADEMARK_NOTE =
  "Pabau, sahibinin ticari markasıdır. Notya bağımsız bir üründür; entegrasyon resmî bir ortaklık anlamına gelmez.";
