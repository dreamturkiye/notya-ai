export const LINKS = {
  signup: "/kayit",
  login: "/giris/doktor",
  assistant: "/asistan",
  kvkk: "/kvkk",
  home: "/home",
} as const;

export const NAV = [
  { href: "#konusma", label: "Konuşma", index: "01" },
  { href: "#ogrenme", label: "Öğrenme", index: "02" },
  { href: "#uzmanlar", label: "Uzmanlar", index: "03" },
  { href: "#guvenlik", label: "Güvenlik", index: "04" },
  { href: "#fiyat", label: "Fiyat", index: "05" },
] as const;

export const HERO_FACTS = [
  { k: "Ses", v: "Gerçek zamanlı Türkçe" },
  { k: "Not", v: "SOAP, seans biter bitmez" },
  { k: "Kaynak", v: "Nelson · Braunwald · Harrison" },
  { k: "Deneme", v: "15 gün, kart gerekmez" },
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

export const BOOKS = [
  { title: "Nelson 22e", field: "Pediatri" },
  { title: "Braunwald 12e", field: "Kardiyoloji" },
  { title: "Harrison's 22e", field: "Dahiliye" },
  { title: "Adams & Victor 12e", field: "Nöroloji" },
  { title: "DSM-5-TR", field: "Psikiyatri" },
  { title: "Harriet Lane 23e", field: "Pediatri" },
  { title: "ESC 2024", field: "Kardiyoloji" },
] as const;

export const SPECIALISTS = [
  {
    name: "Prof. Ayşe",
    surname: "Kaya",
    title: "Pediatri",
    character: "Sıcak · Sabırlı",
    books: "Nelson 22e  ·  Harriet Lane 23e",
    photo: "/doctors/dr_ayse.jpg",
    index: "01",
  },
  {
    name: "Prof. Mehmet",
    surname: "Demir",
    title: "Kardiyoloji",
    character: "Hızlı · Net",
    books: "Braunwald 12e  ·  ESC 2024",
    photo: "/doctors/dr_mehmet.jpg",
    index: "02",
  },
  {
    name: "Prof. Elif",
    surname: "Şahin",
    title: "Nöroloji ve dahiliye",
    character: "Analitik · Dikkatli",
    books: "Harrison's 22e  ·  Adams & Victor 12e",
    photo: "/doctors/dr_elif.jpg",
    index: "03",
  },
] as const;

export const INDIVIDUAL_PLANS = [
  {
    name: "Starter",
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
    items: ["Sınırsız seans", "1 kullanıcı", "Pabau bağlantısı", "ICD-10 kodlama", "Öğrenen sistem"],
    href: LINKS.signup,
  },
  {
    name: "Uzman",
    price: "2.499",
    unit: "/ ay",
    highlight: false,
    items: ["Sınırsız seans", "Pabau bağlantısı", "Öncelikli destek", "Özel yapay zekâ ayarı", "Öğrenen sistem"],
    href: LINKS.signup,
  },
] as const;

export const CLINIC_PLANS = [
  {
    name: "Klinik 5",
    price: "3.999",
    unit: "/ ay",
    highlight: false,
    items: ["5 kullanıcı", "Yönetim paneli", "Tüm uzmanlar", "Pabau"],
    href: `${LINKS.signup}?plan=klinik`,
  },
  {
    name: "Klinik 10",
    price: "6.999",
    unit: "/ ay",
    highlight: true,
    items: ["10 kullanıcı", "Yönetim paneli", "Pabau bağlantısı", "Marka ayarları", "Öncelikli destek"],
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
  { k: "KVKK", v: "Kişisel veriler Türkiye'de ve AB Frankfurt'ta. Tam denetim kaydı." },
  { k: "AES-256", v: "Seanslar GCM ile şifrelenir. Notlar hekim hesabına kilitlenir." },
  { k: "SGK", v: "Medula kısıtlamaları ve doz sınırları, sormadan hatırlatılır." },
  { k: "Pabau", v: "Klinik yazılımına SOAP ve ICD-10 aktarımı, Pro ve üzeri." },
] as const;

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
        text: "Akut otitis media. Amoksisilin 40 mg/kg/gün, bu kiloda 720 mg. Amoksiklav mı tercih edersiniz?",
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
        text: "Doktor, bir saniye — bu doz yetişkin dozudur. Nelson'a göre bu kiloda en fazla 250 mg olmalı. Düzelteyim mi?",
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
