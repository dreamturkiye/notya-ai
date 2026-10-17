/**
 * NOTYA-KLINIK-01 — /klinik landing copy and data, in one place like doktor-landing/content.ts.
 *
 * NOTYA-LANDING-2026-10 (Kaan, 2026-10-05): no integration claims, no demos, outcomes not
 * mechanisms, and only capabilities confirmed on main. Lines from the brief that main could not
 * back up (team roles, seans takvimi, işlem sonrası vade listesi, kayıt/onam kontrol listesi) are
 * left out; see docs/LANDING-REFRESH-2026-10.md before adding any back.
 */

export const LINKS = {
  signup: "/kayit",
  signupKlinik: "/kayit?plan=klinik",
  login: "/giris",
  kvkk: "/kvkk",
  home: "/home",
  doktor: "/doktor",
  // HUKUK-01: yasal metinler
  kosullar: "/kullanim-kosullari",
  gizlilik: "/gizlilik",
  yasal: "/yasal",
} as const;

export const NAV = [
  { href: "#portal", label: "Hasta portalı", index: "01" },
  { href: "#dallar", label: "Dallar", index: "02" },
  { href: "#fiyat", label: "Fiyat", index: "04" },
] as const;

export const HERO = {
  eyebrow: "Klinikler için",
  title: "Kliniğiniz ve hastanız",
  titleItalic: "aynı sayfada.",
  lede:
    "Notya kliniğinizin dalına göre kurulur ve her hastanıza, uygulama indirmeden açılan şifreli bir sayfa verir.",
} as const;

export const PORTAL = {
  eyebrow: "01 — Hasta portalı",
  title: "Hastanıza özel,",
  titleItalic: "şifreli bir sayfa.",
  body: "Bakım talimatları ve klinikle mesajlaşma tek bağlantıda. Uygulama indirmek gerekmez.",
} as const;

/** Names only, in the owner's order. Slugs live in lib/specialties/klinikDikey.ts. */
export const DALLAR = [
  "Saç ekimi",
  "Medikal estetik",
  "Estetik cerrahi",
  "Dermatoloji",
  "Fizyoterapi",
  "Ergoterapi",
  "Diyetisyen",
  "Klinik psikolog",
  "Odyoloji",
  "Longevity",
] as const;

export const GUVEN_SATIRI = "Notya kayıt ve takip aracıdır; tanı ve tedavi kararı hekime aittir.";

/** NOTYA-FATURA-LANDING-01 — capability block only; no vendor/integration names (rule: competitive discretion). */
export const FATURA = {
  eyebrow: "03 — Faturalama ve Tahsilat",
  title: "Faturalama da",
  titleItalic: "kliniğinizle birlikte.",
  body: "Kliniğinizin tüm hekimleri için hizmet ve fiyat kataloğu, e-belge ve tahsilat tek sistemde.",
  bullets: [
    "Her hekim kendi hizmet ve fiyatını tanımlar",
    "e-Belge, hizmeti veren hekimin kendi kimliğiyle kesilir",
    "Kart bilgisi hiçbir zaman Notya'da tutulmaz",
    "Ay sonu raporu mali müşavirinize tek tıkla",
  ],
} as const;
