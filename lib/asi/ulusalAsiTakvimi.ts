/**
 * NOTYA-ASI-01 — T.C. Sağlık Bakanlığı Ulusal Aşı Takvimi (Genişletilmiş Bağışıklama Programı).
 *
 * 2025 GBP güncellemesiyle 5'li karma + ayrı Hepatit B düzeni yerine 6'lı karma
 * (DaBT-İPA-Hib-HepB, hexavalent) sistemine geçildi; 2026'da standart uygulama budur.
 * Kritik değişiklik: 1. aydaki tekil Hepatit B dozu KALDIRILDI (Hep B artık 2/4/6/18. ay
 * karma dozların içinde). PEDI-ARACLAR-02 düzeltmesi (2026-09-18): ≥ 2000 g bebekte anne HBsAg(+)
 * olsa da 1. ayda ek doz YOK — doğumda aşı + ilk 12 saatte HBIG, sonra 6'lı karma. < 2000 g bebekte
 * doğum dozu seriye sayılmaz; 1. ayda tekli Hep B, sonra 6'lı karma (TND 2026 prematüre aşılama
 * kitapçığı, SB takvimine atıfla).
 *
 * Kaynak doğrulama: SB asi.saglik.gov.tr "Aşı takvimindeki son güncellemeler" (6'lı karma, 2025);
 * HSGM 2020 aşı takvimi + "Aşılama takviminde değişiklik" (KKK 2. doz ve DaBT-İPA 48. ay, Td 13 yaş —
 * aile hekimliğinde); TND 2026. Suçiçeği 2. doz (48. ay, Eylül 2026) yalnız ikincil kaynakta (haber)
 * doğrulandı — resmi yazı numarası bulunamadı. Takvim yılda bir gözden geçirilmeli.
 */

export interface TakvimAsisi {
  ad: string;
  doz: number | null; // null = rapel/pekiştirme veya tek doz
  dozEtiket?: string; // "Rapel", "1. doz" gibi görünen etiket
  not?: string;
}

export interface TakvimDonemi {
  donem: string; // görünen başlık
  siraAy: number; // sıralama için ay değeri
  asilar: TakvimAsisi[];
}

export const TAKVIM_SURUM = 'T.C. SB Ulusal Aşı Takvimi — 6\u0027lı karma dönemi (2026)';

export const ULUSAL_TAKVIM: TakvimDonemi[] = [
  {
    donem: 'Doğumda (ilk 72 saat)',
    siraAy: 0,
    asilar: [
      { ad: 'Hepatit B', doz: 1, dozEtiket: '1. doz (monovalan)', not: 'Anne HBsAg(+) veya bilinmiyorsa ilk 12 saatte HBIG de yapılır. < 2000 g bebekte bu doz seriye sayılmaz; 1. ayda tekli Hep B, sonra 6\'lı karma.' },
    ],
  },
  {
    donem: '2. ayın sonu',
    siraAy: 2,
    asilar: [
      { ad: 'BCG (Verem)', doz: 1, dozEtiket: 'Tek doz' },
      { ad: '6\u0027lı Karma (DaBT-İPA-Hib-HepB)', doz: 1, dozEtiket: '1. doz' },
      { ad: 'KPA (Konjuge Pnömokok)', doz: 1, dozEtiket: '1. doz' },
    ],
  },
  {
    donem: '4. ayın sonu',
    siraAy: 4,
    asilar: [
      { ad: '6\u0027lı Karma (DaBT-İPA-Hib-HepB)', doz: 2, dozEtiket: '2. doz' },
      { ad: 'KPA (Konjuge Pnömokok)', doz: 2, dozEtiket: '2. doz' },
    ],
  },
  {
    donem: '6. ayın sonu',
    siraAy: 6,
    asilar: [
      { ad: '6\u0027lı Karma (DaBT-İPA-Hib-HepB)', doz: 3, dozEtiket: '3. doz' },
      { ad: 'OPA (Oral Polio)', doz: 1, dozEtiket: '1. doz' },
    ],
  },
  {
    donem: '12. ay',
    siraAy: 12,
    asilar: [
      { ad: 'KPA (Konjuge Pnömokok)', doz: null, dozEtiket: 'Rapel' },
      { ad: 'KKK (Kızamık-Kızamıkçık-Kabakulak)', doz: 1, dozEtiket: '1. doz' },
      { ad: 'Suçiçeği (Varisella)', doz: 1, dozEtiket: '1. doz' },
    ],
  },
  {
    donem: '18. ay',
    siraAy: 18,
    asilar: [
      { ad: '6\u0027lı Karma (DaBT-İPA-Hib-HepB)', doz: null, dozEtiket: 'Rapel' },
      { ad: 'OPA (Oral Polio)', doz: 2, dozEtiket: '2. doz' },
      { ad: 'Hepatit A', doz: 1, dozEtiket: '1. doz' },
    ],
  },
  {
    donem: '24. ay',
    siraAy: 24,
    asilar: [
      { ad: 'Hepatit A', doz: 2, dozEtiket: '2. doz' },
    ],
  },
  {
    donem: '48. ay',
    siraAy: 48,
    asilar: [
      { ad: 'KKK (Kızamık-Kızamıkçık-Kabakulak)', doz: 2, dozEtiket: '2. doz' },
      { ad: 'DaBT-İPA (4\u0027lü Karma)', doz: null, dozEtiket: 'Rapel' },
      { ad: 'Suçiçeği (Varisella)', doz: 2, dozEtiket: '2. doz', not: 'Eylül 2026\'da başladı (49–72 ay telafi); resmi yazı doğrulanamadı — hekim teyit eder.' },
    ],
  },
  {
    donem: '13 yaş',
    siraAy: 156,
    asilar: [
      { ad: 'Td (Tetanoz-Difteri, erişkin tip)', doz: null, dozEtiket: 'Rapel' },
    ],
  },
];

/** Ulusal takvimde OLMAYAN, pediatri pratiğinde yaygın önerilen özel (ücretli) aşılar.
 * Takvim dışı oldukları kayıtta net görünmeli — SGK/ASM kapsamı dışıdır. */
export const OZEL_ASILAR: { ad: string; onerilenDonem: string; not: string }[] = [
  { ad: 'Rotavirüs', onerilenDonem: '2-6. ay (ilk doz en geç 12. hafta)', not: 'Ağızdan; markaya göre 2 veya 3 doz. Takvim dışı — özel.' },
  { ad: 'Meningokok ACWY (konjuge)', onerilenDonem: '9-12. aydan itibaren (markaya göre değişir)', not: 'Menactra/Menveo/Nimenrix. Takvim dışı — özel.' },
  { ad: 'Meningokok B', onerilenDonem: '2. aydan itibaren', not: 'Bexsero vb. Takvim dışı — özel.' },
  { ad: 'İnfluenza (Grip)', onerilenDonem: '6. aydan itibaren, her yıl', not: 'İlk aşılamada 4 hafta arayla 2 doz. Takvim dışı — özel.' },
  { ad: 'HPV', onerilenDonem: 'Adölesan dönem (9 yaş+)', not: 'Takvim dışı — özel; ulusal programa alınması gündemde, güncel durumu kontrol edin.' },
];

/** Aşı adı öneri listesi (tekrarsız): ulusal takvim + özel aşılar. */
export const PEDIATRIK_ASI_ADLARI: string[] = Array.from(
  new Set([
    ...ULUSAL_TAKVIM.flatMap((d) => d.asilar.map((a) => a.ad)),
    ...OZEL_ASILAR.map((a) => a.ad),
  ])
);
