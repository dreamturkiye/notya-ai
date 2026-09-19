import type { PortalBundle } from './types'

/** Rich Turkish fixture for /portal/demo — reference-grade Sağlığım experience. */
export const SAGLIGIM_DEMO: PortalBundle = {
  // Demo hastası yetişkin iç hastalıkları hastası; demo form gönderemediği için ön anket modülü de bağlanmaz.
  portal: { moduller: [], nav: [] },
  goz: null,
  deri: null,
  kronik: null,
  psik: null, // ruh sağlığı verisi demo portalında hiç taşınmaz
  kulak: null, // KBB izlemi yalnız KBB hekiminin token'ında açılır
  buyume: null, // demo hastası yetişkin (71.4 kg) — büyüme eğrileri yalnız çocuk hastalarda anlamlı
  gebelik: null,
  jinekoloji: null,
  hedefBoy: null, // pediatri aracı — yetişkin demo portalında gösterilmez
  summary: {
    aktifIlac: 3,
    bekleyenMesaj: 2,
    sonLabOzet: 'HbA1c  ·  %6.4 — hafif yüksek',
    yaklasanKontrol: '28 Kasım 2026 · 10:30',
    sonAktivite: [
      {
        id: 'a1',
        tur: 'mesaj',
        baslik: 'Yeni mesaj: Lab sonuçlarınız hazır',
        tarih: '2026-09-02T09:12:00Z',
        href: 'mesajlar',
      },
      {
        id: 'a2',
        tur: 'sonuc',
        baslik: 'Kan paneli sonuçları yayınlandı',
        tarih: '2026-09-01T16:40:00Z',
        href: 'sonuclar',
      },
      {
        id: 'a3',
        tur: 'ziyaret',
        baslik: 'İç hastalıkları kontrol ziyareti',
        tarih: '2026-08-28T10:30:00Z',
        href: 'ziyaretler',
      },
      {
        id: 'a4',
        tur: 'ilac',
        baslik: 'Glucophage dozu güncellendi',
        tarih: '2026-07-12T14:20:00Z',
        href: 'ilaclar',
      },
    ],
  },
  messages: [
    {
      id: 'm1',
      klasor: 'gelen',
      konu: 'Lab sonuçlarınız hazır',
      gonderen: 'Uzm. Dr. Elif Yılmaz',
      ozet: 'Kan paneli sonuçlarınızı inceledim. Kısa bir not bıraktım.',
      tarih: '2026-09-02T09:12:00Z',
      okundu: false,
      mesajlar: [
        {
          id: 'm1a',
          kimden: 'Uzm. Dr. Elif Yılmaz',
          taraf: 'doktor',
          tarih: '2026-09-02T09:12:00Z',
          metin:
            'Merhaba, kan paneli sonuçlarınızı inceledim. HbA1c değeriniz hedefe yakın (%6.4). Diyete ve yürüyüşe devam edelim. Sorunuz olursa buradan yazabilirsiniz.',
        },
        {
          id: 'm1b',
          kimden: 'Siz',
          taraf: 'hasta',
          tarih: '2026-09-02T11:05:00Z',
          metin: 'Teşekkür ederim doktor hanım. Öğle yürüyüşünü günde 30 dakikaya çıkardım.',
        },
        {
          id: 'm1c',
          kimden: 'Uzm. Dr. Elif Yılmaz',
          taraf: 'doktor',
          tarih: '2026-09-02T14:22:00Z',
          metin: 'Harika. Kasım kontrolünde tekrar bakacağız. İyi günler.',
        },
      ],
    },
    {
      id: 'm2',
      klasor: 'gelen',
      konu: 'Kontrol randevusu hatırlatması',
      gonderen: 'Notya Klinik Asistanı',
      ozet: '28 Kasım 10:30 iç hastalıkları kontrolünüz yaklaştı.',
      tarih: '2026-08-30T08:00:00Z',
      okundu: false,
      mesajlar: [
        {
          id: 'm2a',
          kimden: 'Notya Klinik Asistanı',
          taraf: 'klinik',
          tarih: '2026-08-30T08:00:00Z',
          metin:
            '28 Kasım 2026 saat 10:30 için planlanan kontrol randevunuzu hatırlatmak isteriz. Değişiklik için muayenehaneyi arayabilirsiniz.',
        },
      ],
    },
    {
      id: 'm3',
      klasor: 'gonderilen',
      konu: 'İlaç yan etkisi sorusu',
      gonderen: 'Siz',
      ozet: 'Sabah ilacından sonra hafif baş dönmesi…',
      tarih: '2026-08-15T19:40:00Z',
      okundu: true,
      mesajlar: [
        {
          id: 'm3a',
          kimden: 'Siz',
          taraf: 'hasta',
          tarih: '2026-08-15T19:40:00Z',
          metin: 'Coversyl sonrası sabahları hafif baş dönmesi oluyor. Devam edeyim mi?',
        },
        {
          id: 'm3b',
          kimden: 'Uzm. Dr. Elif Yılmaz',
          taraf: 'doktor',
          tarih: '2026-08-16T09:10:00Z',
          metin:
            'İlk haftalarda olabilir. Bol su için, ani ayağa kalkmayın. 1 hafta daha izleyelim; artarsa yazın.',
        },
      ],
    },
    {
      id: 'm4',
      klasor: 'arsiv',
      konu: 'Aşı bilgilendirmesi',
      gonderen: 'Klinik',
      ozet: 'Grip aşısı sezonu bilgilendirmesi',
      tarih: '2026-05-20T10:00:00Z',
      okundu: true,
      mesajlar: [
        {
          id: 'm4a',
          kimden: 'Klinik',
          taraf: 'klinik',
          tarih: '2026-05-20T10:00:00Z',
          metin: 'Grip aşısı sezonu başladı. İsterseniz bir sonraki ziyarette uygulayabiliriz.',
        },
      ],
    },
  ],
  visits: [
    {
      id: 'v1',
      tarih: '2026-08-28T10:30:00Z',
      brans: 'İç Hastalıkları',
      basvuruNedeni: 'Tansiyon ve şeker kontrolü',
      hekim: 'Uzm. Dr. Elif Yılmaz',
      ozetKisa: 'Tansiyon regüle; mevcut tedaviye devam.',
      subjektif:
        'Hasta genel durumunun iyi olduğunu, düzenli yürüyüş yaptığını belirtti. Göğüs ağrısı, nefes darlığı tanımlamadı.',
      objektif:
        'Tansiyon 128/78 mmHg, nabız 72/dk, SpO₂ %98. Kardiyopulmoner muayene doğal. Ödem yok.',
      degerlendirme:
        'Esansiyel hipertansiyon ve tip 2 diyabet regülasyonu iyi-orta. HbA1c hedefe yakın.',
      plan: 'Mevcut antihipertansif ve antidiabetik tedaviye devam. Diyet + 30 dk yürüyüş. 3 ay sonra kontrol + HbA1c.',
      vitaller: { tansiyon: '128/78', nabiz: 72, spo2: 98, kilo: 71.4, ates: null },
      ilacDegisiklikleri: ['Değişiklik yok — mevcut reçete sürdürüldü'],
      takip: '3 ay · Kasım 2026',
    },
    {
      id: 'v2',
      tarih: '2026-07-12T14:00:00Z',
      brans: 'İç Hastalıkları',
      basvuruNedeni: 'Halsizlik ve çarpıntı',
      hekim: 'Uzm. Dr. Elif Yılmaz',
      ozetKisa: 'HbA1c hafif yüksek; metformin dozu ayarlandı.',
      subjektif: '2 haftadır halsizlik ve ara ara çarpıntı. Gece terlemesi yok.',
      objektif: 'Tansiyon 134/82 mmHg, nabız 88/dk, ritim düzenli. Tiroid loju doğal.',
      degerlendirme: 'Olası glisemik dalgalanma. Tiroid paneli normal sınırlarda.',
      plan: 'Glucophage 1000 mg günde 2 kez. Kan paneli tekrarı. 6 hafta kontrol.',
      vitaller: { tansiyon: '134/82', nabiz: 88, spo2: 97, kilo: 72.1 },
      ilacDegisiklikleri: ['Glucophage: 500 mg → 1000 mg (günde 2 kez)'],
      takip: '6 hafta',
    },
    {
      id: 'v3',
      tarih: '2026-05-03T09:15:00Z',
      brans: 'İç Hastalıkları',
      basvuruNedeni: 'Yıllık check-up',
      hekim: 'Uzm. Dr. Elif Yılmaz',
      ozetKisa: 'Yıllık kontrol; tarama ve aşı hatırlatmaları yapıldı.',
      subjektif: 'Şikayet tanımlamadı. İlaçlarını düzenli kullandığını belirtti.',
      objektif: 'Fizik muayene doğal. BMI 24.8.',
      degerlendirme: 'Stabil kronik hastalık yönetimi.',
      plan: 'Yıllık laboratuvar, grip aşısı önerisi, mamografi hatırlatması.',
      vitaller: { tansiyon: '126/76', nabiz: 70, kilo: 71.8 },
      ilacDegisiklikleri: [],
      takip: 'Yıllık',
    },
  ],
  results: [
    {
      id: 'r1',
      tur: 'laboratuvar',
      baslik: 'Kan paneli (HbA1c + lipid + böbrek)',
      tarih: '2026-09-01T16:40:00Z',
      ozet: 'HbA1c ve açlık glukozu hafif yüksek; diğerleri normal.',
      durum: 'anormal',
      labSatirlari: [
        { test: 'HbA1c', deger: '6.4', birim: '%', referans: '4.0–5.6', anormal: true },
        { test: 'Açlık Glukoz', deger: '108', birim: 'mg/dL', referans: '70–99', anormal: true },
        { test: 'LDL Kolesterol', deger: '118', birim: 'mg/dL', referans: '<130', anormal: false },
        { test: 'Kreatinin', deger: '0.82', birim: 'mg/dL', referans: '0.6–1.1', anormal: false },
        { test: 'TSH', deger: '2.1', birim: 'mIU/L', referans: '0.4–4.0', anormal: false },
      ],
    },
    {
      id: 'r2',
      tur: 'goruntuleme',
      baslik: 'Akciğer grafisi (PA)',
      tarih: '2026-05-03T11:00:00Z',
      ozet: 'Akciğer alanları doğal; kardiyotorasik oran normal.',
      durum: 'raporlandi',
      modalite: 'xray',
      gorselUrl: '/sagligim/chest-xray-pa.jpg',
      raporMetni:
        'Her iki akciğer alanı doğal havalanmış görünümde. Aktif infiltrasyon, efüzyon veya kitle lehine bulgu saptanmadı. Kalp silüeti normal sınırlarda.',
    },
    {
      id: 'r3',
      tur: 'ekg',
      baslik: 'İstirahat EKG',
      tarih: '2026-07-12T14:25:00Z',
      ozet: 'Sinüs ritmi, normal eksen.',
      durum: 'normal',
      modalite: 'ekg',
      gorselUrl: '/sagligim/ekg-sinus.jpg',
      raporMetni: 'Sinüs ritmi, 88/dk. PR, QRS, QT süreleri normal. ST-T değişikliği yok.',
    },
    {
      id: 'r4',
      tur: 'goruntuleme',
      baslik: 'Üst batın ultrasonu',
      tarih: '2026-05-03T12:10:00Z',
      ozet: 'Karaciğer, safra yolları ve böbrekler doğal.',
      durum: 'raporlandi',
      modalite: 'us',
      // Demoes the report-only case: US reported, no image file shared.
      gorselUrl: null,
      raporMetni: 'Karaciğer parankimi homojen. Safra kesesi ve pankreas doğal. Bilateral böbrek boyutları normal.',
    },
    {
      id: 'r5',
      tur: 'diger',
      baslik: 'Görme taraması (Snellen)',
      tarih: '2026-05-04T09:00:00Z',
      ozet: 'Düzeltilmiş görme 10/10 bilateral.',
      durum: 'normal',
      modalite: 'Vision',
      raporMetni: 'Sağ 10/10, sol 10/10 (düzeltilmiş). Fundus muayenesi önerisi yıllık kontrolde.',
    },
  ],
  medications: [
    {
      id: 'i1',
      ad: 'COVERSYL 5 MG',
      doz: '1 tablet',
      siklik: 'Günde 1 kez, sabah',
      baslangic: '2025-11-10',
      aktif: true,
      not: 'Tansiyon için — aç veya tok alınabilir.',
      yazan: 'Uzm. Dr. Elif Yılmaz',
    },
    {
      id: 'i2',
      ad: 'GLUCOPHAGE 1000 MG',
      doz: '1 tablet',
      siklik: 'Günde 2 kez, yemekle',
      baslangic: '2026-07-12',
      aktif: true,
      not: 'Kan şekeri için. Mide rahatsızlığında bildirin.',
      yazan: 'Uzm. Dr. Elif Yılmaz',
    },
    {
      id: 'i3',
      ad: 'ASPIRIN PROTECT 100 MG',
      doz: '1 tablet',
      siklik: 'Günde 1 kez',
      baslangic: '2025-11-10',
      aktif: true,
      not: 'Koruyucu — kanama artarsa ara verin.',
      yazan: 'Uzm. Dr. Elif Yılmaz',
    },
    {
      id: 'i4',
      ad: 'GLUCOPHAGE 500 MG',
      doz: '1 tablet',
      siklik: 'Günde 2 kez',
      baslangic: '2025-11-10',
      bitis: '2026-07-12',
      aktif: false,
      not: 'Doz artışı nedeniyle bırakıldı.',
      yazan: 'Uzm. Dr. Elif Yılmaz',
    },
  ],
  medicationHistory: [
    {
      id: 'h1',
      tarih: '2026-07-12',
      tip: 'doz_degisti',
      ilacAdi: 'Glucophage',
      aciklama: '500 mg → 1000 mg, günde 2 kez (yemekle).',
    },
    {
      id: 'h2',
      tarih: '2026-07-12',
      tip: 'durduruldu',
      ilacAdi: 'GLUCOPHAGE 500 MG',
      aciklama: 'Yeni doza geçildi; 500 mg formu sonlandırıldı.',
    },
    {
      id: 'h3',
      tarih: '2025-11-10',
      tip: 'baslandi',
      ilacAdi: 'COVERSYL 5 MG',
      aciklama: 'Esansiyel hipertansiyon için başlandı.',
    },
    {
      id: 'h4',
      tarih: '2025-11-10',
      tip: 'baslandi',
      ilacAdi: 'ASPIRIN PROTECT 100 MG',
      aciklama: 'Koruyucu tedavi başlandı.',
    },
  ],
  history: {
    kronikHastaliklar: ['Esansiyel hipertansiyon', 'Tip 2 diabetes mellitus'],
    alerjiler: ['Penisilin — döküntü (bildirilen)'],
    ameliyatlar: [{ yil: '2018', aciklama: 'Laparoskopik kolesistektomi' }],
    aileOykusu: [
      { yakinlik: 'Anne', durum: 'Tip 2 diyabet' },
      { yakinlik: 'Baba', durum: 'Koroner arter hastalığı' },
    ],
    asilar: [
      { ad: 'COVID-19 (son doz)', tarih: '2024-10-12' },
      { ad: 'Influenza', tarih: '2025-10-05' },
      { ad: 'Td (tetanos-difteri)', tarih: '2021-03-18' },
    ],
  },
  tracking: {
    sonVitalOzet: 'Tansiyon: 128/78 mmHg · Nabız: 72/dk · SpO₂: %98 · Kilo: 71,4 kg',
    tansiyon: [
      { tarih: '2026-05-03', sistolik: 126, diastolik: 76 },
      { tarih: '2026-07-12', sistolik: 134, diastolik: 82 },
      { tarih: '2026-08-28', sistolik: 128, diastolik: 78 },
      { tarih: '2026-09-01', sistolik: 124, diastolik: 74 },
    ],
    kilo: [
      { tarih: '2026-05-03', deger: 71.8 },
      { tarih: '2026-07-12', deger: 72.1 },
      { tarih: '2026-08-28', deger: 71.4 },
    ],
    nabiz: [
      { tarih: '2026-05-03', deger: 70 },
      { tarih: '2026-07-12', deger: 88 },
      { tarih: '2026-08-28', deger: 72 },
    ],
    spo2: [
      { tarih: '2026-07-12', deger: 97 },
      { tarih: '2026-08-28', deger: 98 },
    ],
  },
}

export function demoVisitById(id: string) {
  return SAGLIGIM_DEMO.visits.find((v) => v.id === id) || null
}

export function demoResultById(id: string) {
  return SAGLIGIM_DEMO.results.find((r) => r.id === id) || null
}

export function demoMessageById(id: string) {
  return SAGLIGIM_DEMO.messages.find((m) => m.id === id) || null
}

/**
 * GOZ-PORTAL — synthetic, non-PHI fixture for /portal/demo-goz (Göz Hastalıkları chapter, "Gözlerim").
 * Core spine (mesajlar / ziyaretler / sonuçlar / ilaçlar / öykü) is göz-shaped; no büyüme / gebelik / jine.
 */
const GOZ_HEKIM = 'Op. Dr. Deniz Aksoy'
export const SAGLIGIM_DEMO_GOZ: PortalBundle = {
  ...SAGLIGIM_DEMO,
  portal: { moduller: ['gozlerim'], nav: [{ key: 'gozlerim', label: 'Gözlerim', path: '/gozlerim' }] },
  buyume: null,
  gebelik: null,
  jinekoloji: null,
  hedefBoy: null,
  summary: {
    aktifIlac: 2,
    bekleyenMesaj: 1,
    sonLabOzet: 'OCT görüntünüz dosyanıza eklendi',
    yaklasanKontrol: '15 Ekim 2026 · 09:30',
    sonAktivite: [
      { id: 'ga1', tur: 'mesaj', baslik: 'Yeni mesaj: Kontrol öncesi bilgilendirme', tarih: '2026-09-10T09:00:00Z', href: 'mesajlar' },
      { id: 'ga2', tur: 'sonuc', baslik: 'OCT · Sağ göz', tarih: '2026-09-03T10:20:00Z', href: 'sonuclar' },
      { id: 'ga3', tur: 'ziyaret', baslik: 'Göz Hastalıkları ziyareti', tarih: '2026-09-03T10:00:00Z', href: 'ziyaretler' },
    ],
  },
  messages: [
    {
      id: 'gm1',
      klasor: 'gelen',
      konu: 'Kontrol öncesi bilgilendirme',
      gonderen: 'Notya Klinik Asistanı',
      ozet: '15 Ekim kontrolünüzde göz bebeği büyütme damlası uygulanacak.',
      tarih: '2026-09-10T09:00:00Z',
      okundu: false,
      mesajlar: [
        {
          id: 'gm1a',
          kimden: 'Notya Klinik Asistanı',
          taraf: 'klinik',
          tarih: '2026-09-10T09:00:00Z',
          metin: '15 Ekim 2026 saat 09:30 kontrolünüzde göz bebeği büyütme damlası uygulanacaktır. Muayene sonrası birkaç saat araç kullanmamanız önerilir; yanınızda bir refakatçi olması iyi olur.',
        },
      ],
    },
    {
      id: 'gm2',
      klasor: 'gonderilen',
      konu: 'Damla saatleri',
      gonderen: 'Siz',
      ozet: 'İki damlayı aynı saatte kullanabilir miyim?',
      tarih: '2026-08-12T18:30:00Z',
      okundu: true,
      mesajlar: [
        { id: 'gm2a', kimden: 'Siz', taraf: 'hasta', tarih: '2026-08-12T18:30:00Z', metin: 'Akşam iki damlayı arka arkaya damlatabilir miyim?' },
        { id: 'gm2b', kimden: GOZ_HEKIM, taraf: 'doktor', tarih: '2026-08-13T09:05:00Z', metin: 'İki damla arasında en az 5 dakika bekleyin. Damlattıktan sonra göz kapağınızı kapatıp iç köşeye hafifçe bastırabilirsiniz.' },
      ],
    },
  ],
  visits: [
    {
      id: 'gv1',
      tarih: '2026-09-03T10:00:00Z',
      brans: 'Göz Hastalıkları',
      basvuruNedeni: 'Göz tansiyonu kontrolü',
      hekim: GOZ_HEKIM,
      ozetKisa: 'Kontrol muayenesi yapıldı; damlalara devam.',
      objektif: 'Görme keskinliği ve göz tansiyonu ölçüldü. OCT çekildi.',
      plan: 'Damlalara aynı şekilde devam. 6 hafta sonra kontrol (göz bebeği büyütülecek). Planlanan tarihte göz içi enjeksiyon.',
      takip: '6 hafta · Ekim 2026',
    },
    {
      id: 'gv2',
      tarih: '2026-06-18T11:00:00Z',
      brans: 'Göz Hastalıkları',
      basvuruNedeni: 'Rutin kontrol',
      hekim: GOZ_HEKIM,
      ozetKisa: 'Kontrol muayenesi; damla kullanımı gözden geçirildi.',
      plan: 'Damla uygulama tekniği anlatıldı. 3 ay sonra kontrol.',
      takip: '3 ay',
    },
  ],
  results: [
    { id: 'gr1', tur: 'goruntuleme', baslik: 'OCT · Sağ göz', tarih: '2026-09-03T10:20:00Z', ozet: 'Görüntünüz dosyanıza eklendi. Değerlendirmeyi doktorunuz yapar.', durum: 'beklemede', modalite: 'OCT', gorselUrl: null },
    { id: 'gr2', tur: 'goruntuleme', baslik: 'Göz dibi fotoğrafı · Sol göz', tarih: '2026-06-18T11:15:00Z', ozet: 'Görüntünüz dosyanıza eklendi. Değerlendirmeyi doktorunuz yapar.', durum: 'beklemede', modalite: 'Göz dibi fotoğrafı', gorselUrl: null },
  ],
  medications: [
    { id: 'gi1', ad: 'Latanoprost %0,005 göz damlası', doz: '1 damla', siklik: 'Günde 1 kez, akşam', baslangic: '2025-03-10', aktif: true, not: 'İki göze.', yazan: GOZ_HEKIM },
    { id: 'gi2', ad: 'Timolol %0,5 göz damlası', doz: '1 damla', siklik: 'Günde 2 kez, sabah ve akşam', baslangic: '2026-02-20', aktif: true, not: 'Sağ göze.', yazan: GOZ_HEKIM },
  ],
  medicationHistory: [
    { id: 'gh1', tarih: '2026-02-20', tip: 'baslandi', ilacAdi: 'Timolol %0,5 göz damlası', aciklama: 'Sağ göze günde 2 kez başlandı.' },
    { id: 'gh2', tarih: '2025-03-10', tip: 'baslandi', ilacAdi: 'Latanoprost %0,005 göz damlası', aciklama: 'İki göze akşam 1 kez başlandı.' },
  ],
  history: {
    kronikHastaliklar: [],
    alerjiler: [],
    ameliyatlar: [],
    aileOykusu: [{ yakinlik: 'Anne', durum: 'Göz tansiyonu takibi (bildirilen)' }],
    asilar: [],
  },
  tracking: { tansiyon: [], kilo: [], nabiz: [], spo2: [] },
  goz: {
    sonrakiKontrol: { tarih: '2026-10-15', neden: 'Göz tansiyonu ve göz dibi kontrolü', dilatasyon: true },
    damlalar: [
      { id: 'gd1', ad: 'Latanoprost %0,005 göz damlası', goz: 'İki göz', siklik: 'Günde 1 kez, akşam', baslangic: '2025-03-10' },
      { id: 'gd2', ad: 'Timolol %0,5 göz damlası', goz: 'Sağ göz', siklik: 'Günde 2 kez, sabah ve akşam', baslangic: '2026-02-20' },
    ],
    islemler: [
      { id: 'ge1', tarih: '2026-08-06', ad: 'Göz içi enjeksiyon', goz: 'Sağ göz', durum: 'yapildi' },
      { id: 'ge2', tarih: '2026-10-01', ad: 'Göz içi enjeksiyon', goz: 'Sağ göz', durum: 'planli' },
    ],
    olcumler: [
      { tarih: '2025-11-12', vaSag: '0,7', vaSol: '0,9', gibSag: 24, gibSol: 19 },
      { tarih: '2026-02-20', vaSag: '0,7', vaSol: '0,9', gibSag: 23, gibSol: 18 },
      { tarih: '2026-04-15', vaSag: '0,6', vaSol: '1,0', gibSag: 19, gibSol: 17 },
      { tarih: '2026-06-18', vaSag: '0,6', vaSol: '0,9', gibSag: 18, gibSol: 17 },
      { tarih: '2026-09-03', vaSag: '0,7', vaSol: '0,9', gibSag: 17, gibSol: 16 },
    ],
    goruntuler: [
      { id: 'gr1', tarih: '2026-09-03T10:20:00Z', tur: 'OCT', goz: 'Sağ göz' },
      { id: 'gr2', tarih: '2026-06-18T11:15:00Z', tur: 'Göz dibi fotoğrafı', goz: 'Sol göz' },
    ],
    not: 'Değerler muayenehanede kaydedildiği gibidir; yorum ve plan doktorunuzdadır.',
  },
}

export function demoGozVisitById(id: string) {
  return SAGLIGIM_DEMO_GOZ.visits.find((v) => v.id === id) || null
}

export function demoGozResultById(id: string) {
  return SAGLIGIM_DEMO_GOZ.results.find((r) => r.id === id) || null
}
