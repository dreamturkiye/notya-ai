/**
 * Sentetik beta sahnesi — Dr. Gökhan Mamur'un v8 test listesindeki yüzeyler.
 * Gerçek hasta / TC / şifre yok. Canlı Supabase okunmaz.
 */
export const KAYNAK = 'sentetik-beta' as const

export const HEKIM = {
  ad: 'Dr. Gökhan Mamur',
  unvan: 'Çocuk Sağlığı ve Hastalıkları Uzmanı',
  ikinciBrans: 'Kadın Hastalıkları ve Doğum',
  klinik: 'Notya Beta Muayenehanesi',
  sehir: 'İstanbul',
  email: 'beta-hekim@notya.example',
}

export type SiteV2Hasta = {
  id: string
  ad: string
  dogum: string
  yasMetin: string
  cinsiyet: 'kız' | 'erkek' | 'kadın'
  veli?: string
  brans: 'pediatri' | 'kd'
  sonGelis: string
  neden: string
  sekmeler: string[]
}

export const HASTALAR: SiteV2Hasta[] = [
  {
    id: 'elif',
    ad: 'Elif Demir',
    dogum: '2022-03-14',
    yasMetin: '4 yaş 6 ay',
    cinsiyet: 'kız',
    veli: 'Ayşe Demir (anne)',
    brans: 'pediatri',
    sonGelis: '2026-09-18',
    neden: 'Kontrol + aşı',
    sekmeler: ['Özet', 'Muayene Geçmişi', 'Büyüme Eğrileri', 'Belgeler', 'Konsültasyonlar', 'Görüntüler', 'İlaçlar', 'Hasta Formu', 'Aşılar', 'M-CHAT-R/F', 'Gelişim Taraması'],
  },
  {
    id: 'can',
    ad: 'Can Yıldız',
    dogum: '2023-11-02',
    yasMetin: '2 yaş 10 ay',
    cinsiyet: 'erkek',
    veli: 'Mehmet Yıldız (baba)',
    brans: 'pediatri',
    sonGelis: '2026-09-19',
    neden: 'Öksürük',
    sekmeler: ['Özet', 'Muayene Geçmişi', 'Büyüme Eğrileri', 'Belgeler', 'Görüntüler', 'İlaçlar', 'Aşılar', 'M-CHAT-R/F'],
  },
  {
    id: 'selin',
    ad: 'Selin Aksoy',
    dogum: '1993-06-21',
    yasMetin: '33 yaş',
    cinsiyet: 'kadın',
    brans: 'kd',
    sonGelis: '2026-09-17',
    neden: 'Jinekolojik kontrol',
    sekmeler: ['Özet', 'Muayene Geçmişi', 'Belgeler', 'Konsültasyonlar', 'Görüntüler', 'İlaçlar', 'Hasta Formu'],
  },
]

export const RANDEVULAR = [
  { saat: '09:00', hastaId: 'elif', tur: 'Kontrol' },
  { saat: '09:30', hastaId: 'can', tur: 'Yeni şikayet' },
  { saat: '11:00', hastaId: 'selin', tur: 'Kontrol' },
  { saat: '14:00', hastaId: 'elif', tur: 'Aşı' },
]

export const ILACLAR: Record<string, string[]> = {
  elif: ['Vitamin D 400 IU · 1×1'],
  can: ['Salbutamol inh. · ihtiyaç halinde'],
  selin: ['Folik asit 400 mcg · 1×1'],
}

export const ASILAR = {
  elif: [
    { ad: 'KKK', tarih: '2026-03-14', kaynak: 'klinik' },
    { ad: 'DaBT-İPA-Hib rapel', tarih: '2026-09-18', kaynak: 'klinik' },
  ],
  can: [{ ad: 'Hepatit B 3', tarih: '2024-05-02', kaynak: 'karne' }],
}

export const BUYUME = {
  elif: { kilo: '16.2 kg', boy: '102 cm', bas: '49.5 cm', not: 'Persentil eğrisi — sentetik nokta' },
  can: { kilo: '13.1 kg', boy: '91 cm', bas: '48.0 cm', not: 'Persentil eğrisi — sentetik nokta' },
}

export const GORUNTULER = {
  elif: [{ chip: 'XR · 12 Eyl', tip: 'Röntgen akciğer', durum: 'taslak' }],
  can: [],
  selin: [{ chip: 'US · bugün', tip: 'Obstetrik US', durum: 'taslak' }],
}

export const AYSE_GUN = 'Gökhan Hocam, bugün 4 randevu. 1 onaysız not, 2 okunmamış veli mesajı.'

export const PORTAL_VELI = {
  hasta: 'Elif Demir',
  veli: 'Ayşe Demir',
  hekim: HEKIM.ad,
  dipnot: 'Değerlendirmeyi doktorunuz yapar. Acil durumda 112.',
  buyume: BUYUME.elif,
  asilar: ASILAR.elif,
}

export function hastaBul(id: string): SiteV2Hasta | undefined {
  return HASTALAR.find((h) => h.id === id)
}
