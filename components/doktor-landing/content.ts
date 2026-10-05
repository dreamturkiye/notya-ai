export const LINKS = {
  signup: "/kayit",
  login: "/giris/doktor",
  assistant: "/asistan",
  kvkk: "/kvkk",
  home: "/home",
} as const;

export const NAV = [
  { href: "#konusma", label: "Asistan", index: "01" },
  { href: "#portal", label: "Portal", index: "03" },
  { href: "#brans", label: "Branşlar", index: "06" },
  { href: "#guvenlik", label: "Güvenlik", index: "09" },
  { href: "#fiyat", label: "Fiyat", index: "10" },
] as const;

export const HERO = {
  eyebrow: "Hekimler için yapay zekâ klinik asistanı",
  title: "Hasta odadan çıktığında",
  titleItalic: "işiniz bitmiş olsun.",
  lede:
    "Prof. Ayşe muayeneyi dinler, notunuzu yazar, reçete ve rapor taslağını hazırlar, hastanızı takipte tutar. Her karar sizin onayınızla kesinleşir.",
} as const;

export const HERO_STRIP = [
  "30 branş",
  "Sesli, gerçek zamanlı",
  "Hasta portalı dahil",
  "Her adım hekim onaylı",
] as const;

export const BRANCHES = [
  "Pediatri",
  "Kardiyoloji",
  "Nöroloji",
  "Dahiliye",
  "Psikiyatri",
  "Genel Cerrahi",
  "Ortopedi",
  "Dermatoloji",
  "KBB",
  "Göz Hastalıkları",
  "Kadın Hastalıkları ve Doğum",
  "Üroloji",
  "Radyoloji",
  "Anestezi",
  "Acil Tıp",
  "Fizik Tedavi",
  "Enfeksiyon Hastalıkları",
  "Endokrinoloji",
  "Gastroenteroloji",
  "Nefroloji",
  "Romatoloji",
  "Onkoloji",
  "Göğüs Hastalıkları",
  "Göğüs Cerrahisi",
  "Plastik Cerrahi",
  "Beyin Cerrahisi",
  "Kalp Damar Cerrahisi",
  "Çocuk Cerrahisi",
  "Aile Hekimliği",
  "Spor Hekimliği",
  "Diğer",
] as const;

export const INDIVIDUAL_PLANS = [
  {
    name: "Başlangıç",
    price: "499",
    unit: "/ ay",
    highlight: false,
    items: ["50 seans / ay", "1 kullanıcı", "Tüm uzmanlar", "SOAP notları", "Sesli asistan"],
    href: LINKS.signup,
  },
  {
    name: "Pro",
    price: "1.299",
    unit: "/ ay",
    highlight: true,
    items: ["Sınırsız seans", "1 kullanıcı", "ICD-10 kodlama", "Öğrenen sistem"],
    href: LINKS.signup,
  },
  {
    name: "Uzman",
    price: "2.499",
    unit: "/ ay",
    highlight: false,
    items: ["Sınırsız seans", "Öncelikli destek", "Özel yapay zekâ ayarı", "Öğrenen sistem"],
    href: LINKS.signup,
  },
] as const;

export const CLINIC_PLANS = [
  {
    name: "Klinik 5",
    price: "3.999",
    unit: "/ ay",
    highlight: false,
    items: ["5 kullanıcı", "Yönetim paneli", "Tüm uzmanlar"],
    href: `${LINKS.signup}?plan=klinik`,
  },
  {
    name: "Klinik 10",
    price: "6.999",
    unit: "/ ay",
    highlight: true,
    items: ["10 kullanıcı", "Yönetim paneli", "Marka ayarları", "Öncelikli destek"],
    href: `${LINKS.signup}?plan=klinik`,
  },
  {
    name: "Klinik 20",
    price: "11.999",
    unit: "/ ay",
    highlight: false,
    items: ["20 kullanıcı", "Her şey dahil", "Özel destek"],
    href: `${LINKS.signup}?plan=klinik`,
  },
  {
    name: "Kurumsal",
    price: "Fiyat alın",
    unit: "",
    highlight: false,
    items: ["Sınırsız kullanıcı", "Özel hizmet sözleşmesi", "Sistem erişimi"],
    href: `${LINKS.signup}?plan=kurumsal`,
  },
] as const;

export const PROOF = [
  { k: "KVKK", v: "KVKK'ya göre kurgulandı. Saklama süresi dolan veri imha edilir." },
  { k: "AES-256", v: "Hasta kimlik bilgileri şifrelenir. Notlar hekim hesabına kilitlenir." },
  { k: "SUT", v: "SUT kuralları ve doz sınırları, sormadan hatırlatılır." },
  { k: "Karar desteği", v: "Notya karar desteğidir; tanı ve tedavi kararı hekime aittir." },
] as const;

/** NOTYA-LANDING-2026-10 — practice-system sections, in page order. Outcomes only, no mechanisms. */
export const VIZIT = {
  eyebrow: "02 — Muayene sonu",
  title: "Vizit tek akışta",
  titleItalic: "kapanır.",
  body: "Muayene sonu adımları sırayla önünüzde. İstemediğiniz adımı atlarsınız.",
  bullets: [
    "Kendi vizit şablonlarınız tek dokunuşla",
    "Kontrol randevusu muayene bitmeden planlanır",
    "Hasta, özetini kendi portalında görür",
  ],
  steps: ["Reçete taslağı", "Rapor", "Kontrol randevusu", "Hasta özeti"],
} as const;

export const PORTAL = {
  eyebrow: "03 — Hasta portalı",
  title: "Hastanız muayenehanenizi",
  titleItalic: "cebinde taşır.",
  body: "Her hastaya özel, güvenli bir sayfa: ziyaret özeti, sonuçlar, ilaçlar, takip planı ve size ulaşan mesajlar. Uygulama indirmek gerekmez.",
  bullets: [
    "Branşa göre düzenlenmiş içerik",
    "Randevu talebi ve hatırlatmalar",
    "Paylaşılan her bilgi hekim onayından geçer",
  ],
  rows: ["Ziyaret özeti", "Sonuçlar", "İlaçlar", "Takip planı", "Mesajlar"],
} as const;

export const KONSULTASYON = {
  eyebrow: "04 — Konsültasyon",
  title: "Konsültasyon,",
  titleItalic: "telefon trafiği olmadan.",
  body: "Muayeneden çıkmadan istem açın; konsültan hekim kendisine gelen güvenli bağlantıdan yanıtını bıraksın. Yanıt hastanın dosyasına işlenir.",
  bullets: [
    "Güvendiğiniz konsültanların defteri",
    "Yanıt bekleyenler tek listede",
    "Konsültanın hesap açması gerekmez",
  ],
} as const;

export const ON_BURO = {
  eyebrow: "05 — Randevu ve iletişim",
  title: "Ön büronuz da",
  titleItalic: "aynı sistemde.",
  body: "Randevu takvimi, hatırlatmalar ve hasta mesajları tek yerde. Sekreteriniz kendi hesabıyla yalnızca görmesi gerekeni görür.",
  bullets: [
    "Gelen belgeler hasta dosyasına bağlanır",
    "Sekreter hesabı ayrı yetkiyle çalışır",
  ],
} as const;

export const BRANS = {
  eyebrow: "06 — Branşınıza özel",
  title: "Genel bir asistan değil.",
  titleItalic: "Sizin branşınız.",
  body: "30 branşta, o branşın gündelik işine göre hazırlanmış çalışma alanı. Kayıt olurken branşınızı seçersiniz; ekranınız ona göre kurulur.",
  examples: [
    { k: "Pediatri", v: "Büyüme, aşı ve gelişim takibi tek bakışta." },
    { k: "Kadın Doğum", v: "Gebelik takvimi ve izlem pencereleri kendiliğinden." },
    { k: "Göz", v: "Görme takibi, vizitten vizite karşılaştırmalı." },
  ],
} as const;

export const TAKIP = {
  eyebrow: "07 — Takip",
  title: "Hiçbir hasta",
  titleItalic: "takipten düşmez.",
  body: "Kontrolü geciken ve izlemi kaçan hastalar kendiliğinden listelenir. Tek dokunuşla hatırlatma gönderirsiniz.",
  rows: ["Kontrolü geciken", "İzlemi kaçan"],
} as const;

export type ChartTurn = {
  speaker: string;
  role: "hekim" | "uzman" | "uyari";
  text: string;
};

export type ChartScene = {
  id: string;
  meta: string;
  specialist: string;
  field: string;
  time: string;
  turns: ChartTurn[];
};

export const CONVO_SCENES: ChartScene[] = [
  {
    id: "pedia",
    meta: "Seans 01",
    specialist: "Prof. Ayşe",
    field: "Pediatri",
    time: "09:14",
    turns: [
      {
        speaker: "Hekim",
        role: "hekim",
        text: "7 yaşında, 18 kilo. Ateş ve kulak ağrısı.",
      },
      {
        speaker: "Ayşe",
        role: "uzman",
        text: "Akut otitis media ile uyumlu. Amoksisilin 40 mg/kg/gün, bu kiloda 720 mg. Amoksiklav mı tercih edersiniz?",
      },
    ],
  },
  {
    id: "safety",
    meta: "Güvenlik ağı",
    specialist: "Prof. Ayşe",
    field: "Pediatri",
    time: "18:47",
    turns: [
      {
        speaker: "Hekim",
        role: "hekim",
        text: "Amoksisilin 500 mg yaz, günde üç.",
      },
      {
        speaker: "Uyarı",
        role: "uyari",
        text: "Doktor, bir saniye — bu doz yetişkin dozudur. Kılavuza göre bu kiloda en fazla 250 mg olmalı. Düzelteyim mi?",
      },
    ],
  },
  {
    id: "memory",
    meta: "Seans 10",
    specialist: "Prof. Ayşe",
    field: "Pediatri",
    time: "11:03",
    turns: [
      {
        speaker: "Hekim",
        role: "hekim",
        text: "Amoksisilin yaz.",
      },
      {
        speaker: "Ayşe",
        role: "uzman",
        text: "40 mg/kg/gün, bu kiloda 720 mg. Bildiğiniz gibi Amoksiklav tercih ediyorsunuz — onu mu yazayım, doktor?",
      },
    ],
  },
];

export const LEARNING = {
  first: {
    label: "1. seans",
    prompt: "Amoksisilin yaz.",
    reply: "Hangi dozu yazayım, doktor? Hangi markayı tercih edersiniz?",
  },
  tenth: {
    label: "10. seans",
    prompt: "Amoksisilin yaz.",
    reply:
      "40 mg/kg/gün, bu kiloda 720 mg. Bildiğiniz gibi Amoksiklav tercih ediyorsunuz — onu mu yazayım, doktor?",
  },
} as const;
