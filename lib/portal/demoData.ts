import type { PortalBundle } from './types'

/** Rich Turkish fixture for /portal/demo — reference-grade Sağlığım experience. */
export const SAGLIGIM_DEMO: PortalBundle = {
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
      gorselUrl: '/sagligim/imaging-placeholder.jpg',
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
