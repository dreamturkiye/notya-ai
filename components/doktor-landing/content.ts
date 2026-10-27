export const LINKS = {
  signup: "/kayit",
  login: "/giris/doktor",
  assistant: "/asistan",
  kvkk: "/kvkk",
  home: "/home",
  kosullar: "/kullanim-kosullari",
  gizlilik: "/gizlilik",
  yasal: "/yasal",
  demo: "/demo",
} as const;

export const DEMO = {
  cta: "Demo planla",
  title: "Demo planla",
  lede: "Dr. Gökhan Mamur ile 60 dakikalık bir görüntülü görüşme. Saatler kendi saat diliminizde gösterilir.",
  soonTitle: "Demo randevuları çok yakında açılıyor.",
  soonBody: "Takvim hazır olduğunda bu sayfadan doğrudan randevu alabileceksiniz.",
  provider: "Randevu işlemleri Cal.com üzerinden yürütülür.",
  calendarLabel: "Demo randevu takvimi",
  section: {
    eyebrow: "Demo",
    title: "Notya'yı bir hekimle birlikte görün.",
    titleItalic: "60 dakikalık bir görüşmede.",
    body: "Dr. Gökhan Mamur ile görüntülü bir görüşme planlayın. Size uygun saati takvimden seçin; saatler kendi saat diliminizde gösterilir.",
    cardLabel: "Demo görüşmesi",
    rows: [
      { k: "60 dakika", v: "Görüntülü görüşme" },
      { k: "Dr. Gökhan Mamur", v: "Sorularınızı birlikte konuşun" },
      { k: "Kendi saatinizle", v: "Takvim saat diliminize göre açılır" },
    ],
  },
} as const;

export const NAV = [
  { href: "#konusma", label: "Asistan", index: "01" },
  { href: "#portal", label: "Portal", index: "03" },
  { href: "#brans", label: "Branşlar", index: "06" },
  { href: "#guvenlik", label: "Güvenlik", index: "09" },
  { href: "#fiyat", label: "Fiyat", index: "11" },
] as const;

export const HERO = {
  eyebrow: "Türkiye'deki hekimler için yapay zekâ klinik asistanı",
  title: "Günde 2 saat",
  titleItalic: "size kalsın.",
  lede:
    "8 saatlik bir klinik günde Notya, not tutma, reçete, takip ve ön büro işlerinden size yaklaşık 2 saat kazandırır. Bu süreyi kendinize ayırabilir veya günde 4 ek hasta bakabilirsiniz — hem de daha kaliteli bakım vererek.",
} as const;

export const HERO_STRIP = [
  "Günde ~2 saat tasarruf",
  "30 branş + 10 özel branş",
  "Türkiye'ye özel, hekimler tarafından",
  "Kolay kullanım, güçlü sonuç",
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
    name: "Metin Asistan",
    price: "2.490",
    unit: "/ ay",
    highlight: false,
    items: [
      "100 seans / ay",
      "Dinler, metin yanıtlar",
      "SOAP + reçete/rapor taslağı",
      "Branşa özel alan",
      "SUT / doz uyarıları",
      "Hasta dosyası ve arşiv",
    ],
    // STRIPE-NOTYA-01: plan key must match lib/billing/stripePlans.ts NotyaPlanKey exactly —
    // /kayit reads this and drives the doctor straight into Stripe Checkout (15-day trial) on signup.
    href: `${LINKS.signup}?plan=metin_asistan`,
  },
  {
    name: "Sesli Pro",
    price: "3.990",
    unit: "/ ay",
    highlight: true,
    items: [
      "Metin Asistan'ın tümü",
      "Dinler + sesli yanıt",
      "Sınırsız seans (adil kullanım)",
      "Hasta portalı",
      "Randevu + hatırlatmalar",
      "Takip listeleri",
      "Konsültasyon",
      "Öğrenen sistem",
      "Rapor / epikriz taslakları",
    ],
    href: `${LINKS.signup}?plan=sesli_pro`,
  },
  {
    name: "Muayenehane",
    price: "5.490",
    unit: "/ ay",
    highlight: false,
    items: [
      "Sesli Pro'nun tümü",
      "Sekreter hesabı (ayrı yetki)",
      "Özel asistan ayarı",
      "Kurulum desteği",
      "Öncelikli destek",
    ],
    href: `${LINKS.signup}?plan=muayenehane`,
  },
] as const;

export const CLINIC_PLANS = [
  {
    name: "Klinik Taban",
    price: "3.490",
    unit: "/ ay",
    highlight: false,
    items: [
      "Klinik platformu",
      "1 yönetici + temel portal",
      "e-Belge ve fiyat kataloğu",
      "Bakım vadeleri ve hatırlatma",
    ],
    href: `${LINKS.signup}?plan=klinik`,
  },
  {
    name: "3 hekim koltuğu",
    price: "1.490",
    unit: "/ koltuk / ay",
    highlight: false,
    items: ["Hekim koltuğu", "Örnek toplam ~₺7.960"],
    href: `${LINKS.signup}?plan=klinik`,
  },
  {
    name: "5 hekim koltuğu",
    price: "1.290",
    unit: "/ koltuk / ay",
    highlight: true,
    items: ["Hekim koltuğu", "Örnek toplam ~₺9.940"],
    href: `${LINKS.signup}?plan=klinik`,
  },
  {
    name: "10 hekim koltuğu",
    price: "990",
    unit: "/ koltuk / ay",
    highlight: false,
    items: ["Hekim koltuğu", "Örnek toplam ~₺13.390"],
    href: `${LINKS.signup}?plan=klinik`,
  },
  {
    name: "10+ / Kurumsal",
    price: "Fiyat alın",
    unit: "",
    highlight: false,
    items: ["Özel teklif", "Özel kurulum ve destek"],
    href: `${LINKS.signup}?plan=kurumsal`,
  },
] as const;

export const PROOF = [
  { k: "KVKK", v: "KVKK'ya göre kurgulandı. Saklama süresi dolan veri imha edilir." },
  { k: "AES-256", v: "Hasta kimlik bilgileri şifrelenir. Notlar hekim hesabına kilitlenir." },
  { k: "SUT", v: "SUT kuralları ve doz sınırları, sormadan hatırlatılır." },
  { k: "Karar desteği", v: "Notya karar desteğidir; tanı ve tedavi kararı hekime aittir." },
] as const;

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
  body: "30 branş + 10 özel branşta, o branşın gündelik işine göre hazırlanmış çalışma alanı. Türkiye'de pratik yapan hekimler tarafından, Türkiye'nin ihtiyaçlarına göre tasarlandı. Kayıt olurken branşınızı seçersiniz; ekranınız ona göre kurulur.",
  examples: [
    { k: "Pediatri", v: "Büyüme, aşı ve gelişim takibi tek bakışta." },
    { k: "Kadın Hastalıkları ve Doğum", v: "Gebelik takvimi ve izlem pencereleri kendiliğinden." },
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

export const FATURA = {
  eyebrow: "10 — Faturalama ve Tahsilat",
  title: "Faturanız da",
  titleItalic: "aynı sistemde.",
  body: "Hizmet ve fiyat kataloğunuzu siz oluşturursunuz; e-belge kendi kimliğinizle kesilir, tahsilat hastanızdan güvenle alınır.",
  bullets: [
    "Muayene, aşı, her hizmet için kendi fiyatınız",
    "Kart bilgisi hiçbir zaman Notya'da tutulmaz",
    "Hatırlatma, onayınızdan geçmeden gitmez",
    "Ay sonu raporu mali müşavirinize tek tıkla",
  ],
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
