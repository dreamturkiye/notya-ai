/**
 * Structured citation catalog. Cite role; do not dump copyrighted book text.
 */
export type SourceRole = 'gold' | 'clinic-atlas' | 'ulusal-tr' | 'society' | 'training' | 'state'

export type ProtocolSource = {
  id: string
  title: string
  year: number
  when_to_cite: string
  role: SourceRole
}

export const PROTOCOL_SOURCES: ProtocolSource[] = [
  { id: 'bolognia-5', title: 'Bolognia Dermatology 5th', year: 2024, role: 'gold', when_to_cite: 'genel dermatoz, büllü, onkoloji, fototerapi fizyolojisi' },
  { id: 'andrews-14-tr', title: 'Andrews Deri Hastalıkları 14 TR + Atlas', year: 2026, role: 'clinic-atlas', when_to_cite: 'muayenehane dili, lezyon atlas' },
  { id: 'temel-derm', title: 'Temel Dermatoloji (Gürel, Koku Aksu, Durdu, Erdemir, Karadağ)', year: 2020, role: 'ulusal-tr', when_to_cite: 'TR poliklinik dili' },
  { id: 'psokid-2025', title: 'PSOKİD Psoriasis 2025', year: 2025, role: 'society', when_to_cite: 'hafif vs sistemik/biyolojik merdiven' },
  { id: 'tdd-ad-2018', title: 'TDD Atopik Dermatit 2018', year: 2018, role: 'society', when_to_cite: 'AD merdiven' },
  { id: 'tdd-akne', title: 'TDD Akne', year: 2018, role: 'society', when_to_cite: 'akne + izotretinoin' },
  { id: 'tdd-cybe', title: 'TDD CYBE algoritmaları', year: 2020, role: 'society', when_to_cite: 'sifiliz, gonore, HIV danışmanlık' },
  { id: 'alpsoy-behcet', title: 'Behçet TR literatürü (Alpsoy)', year: 2020, role: 'society', when_to_cite: 'oral/genital/göz/paterji' },
  { id: 'pemphigus-tr', title: 'Pemfigus/BP TR pratik (CS+rituximab first line)', year: 2024, role: 'society', when_to_cite: 'büllü yatış ve DIF' },
  { id: 'tukmos-2019', title: 'TUKMOS Deri ve Zührevi Hastalıkları çekirdek müfredat', year: 2019, role: 'training', when_to_cite: 'asistan lezyon tarif + foto okuma' },
  { id: 'sut-2026', title: 'SUT izotretinoin dermatolog-only; biyolojik basamak; fototerapi rapor', year: 2026, role: 'state', when_to_cite: 'reçete ve işlem kodları' },
  { id: 'gop-kub', title: 'GÖP KÜB izotretinoin; asitretin 3 yıl gebelik yasağı', year: 2024, role: 'state', when_to_cite: 'izotretinoin / asitretin' },
  { id: 'ayakta-teshis', title: 'Ayakta Teşhis yönetmeliği estetik kapsam; salon vs sağlık tesisi', year: 2018, role: 'state', when_to_cite: 'lazer/dolgu vs IPL tavan' },
  { id: 'solaryum-2018', title: 'Solaryum yasağı 2018', year: 2018, role: 'state', when_to_cite: 'fototerapi defteri — solaryum yok' },
  { id: 'bzbh-014', title: 'BZBH Form 014/TSİM', year: 2020, role: 'state', when_to_cite: 'sifiliz, gonore, HIV, şark çıbanı, lepra' },
  { id: 'ketem-hint', title: 'KETEM meme/serviks/kolon — deri kanseri değil', year: 2020, role: 'state', when_to_cite: 'tarama hatırlatma, hint only' },
  { id: 'euromelanoma', title: 'Euromelanoma / TDD Mayıs kampanyası', year: 2026, role: 'society', when_to_cite: 'TBSE kampanya' },
  { id: 'tdd-islem', title: 'TDD işlem listesi (700.100 dermoskopi … 530.070 deri biyopsi)', year: 2024, role: 'state', when_to_cite: 'SUT işlem kodları' },
]

/**
 * DERM-EXCEPTIONAL-01 — dipnot kimlikleri (göz `Dipnot` disiplini). Rol / kimlik / yıl yazılır; kitap veya
 * tebliğ metni gömülmez. `dogrulama`: 'birincil' = birincil metin okunup madde doğrulandı;
 * 'ikincil' = derinlik kaynağı; 'hekim' = bu repoda madde/eşik doğrulanamadı → hekim / idare teyit eder.
 */
export type DermRef =
  | 'SUT_2026' | 'SUT_ISLEM' | 'GOP_KUB' | 'AYAKTA_TESHIS' | 'SOLARYUM_2018' | 'BZBH_014'
  | 'PSOKID_2025' | 'TDD_AD_2018' | 'TDD_AKNE' | 'TDD_CYBE' | 'ALPSOY_BEHCET' | 'EUROMELANOMA'
  | 'BOLOGNIA' | 'ANDREWS' | 'TEMEL_DERM' | 'TUKMOS_2019'

export interface DermKaynak {
  ref: DermRef
  ad: string
  rol: 'tr-yasal' | 'tr-dernek' | 'ulusal-tr' | 'ders-kitabi'
  yil: number
  dogrulama: 'birincil' | 'ikincil' | 'hekim'
  not?: string
}

export const DERM_KAYNAKLAR: Record<DermRef, DermKaynak> = {
  SUT_2026: { ref: 'SUT_2026', ad: 'SGK Sağlık Uygulama Tebliği — ilaç kullanım ilkeleri (biyolojik basamak, izotretinoin dermatolog kısıtı, fototerapi endikasyon raporu)', rol: 'tr-yasal', yil: 2026, dogrulama: 'hekim', not: 'Madde numaraları ve güncel eşikler bu repoda doğrulanmadı — hekim / idare teyit eder; doz yazılmaz' },
  SUT_ISLEM: { ref: 'SUT_ISLEM', ad: 'SUT işlem puan listesi — dermatolojik işlem kodları (700.x, 530.070)', rol: 'tr-yasal', yil: 2026, dogrulama: 'hekim', not: 'Kod eşleşmesi katalog stub; ücret yazılmaz' },
  GOP_KUB: { ref: 'GOP_KUB', ad: 'Gebelik Önleme Programı — izotretinoin / asitretin KÜB kuralları', rol: 'tr-yasal', yil: 2024, dogrulama: 'birincil', not: 'Kapı kuralları engine’de; doz hekimin' },
  AYAKTA_TESHIS: { ref: 'AYAKTA_TESHIS', ad: 'Ayakta Teşhis ve Tedavi Yapılan Özel Sağlık Kuruluşları Yönetmeliği — estetik girişim kapsamı', rol: 'tr-yasal', yil: 2018, dogrulama: 'ikincil' },
  SOLARYUM_2018: { ref: 'SOLARYUM_2018', ad: 'Solaryum yasağı (2018) — solaryum fototerapi cihazı değildir', rol: 'tr-yasal', yil: 2018, dogrulama: 'birincil' },
  BZBH_014: { ref: 'BZBH_014', ad: 'Bildirimi Zorunlu Bulaşıcı Hastalıklar — Form 014 / TSİM bildirimi', rol: 'tr-yasal', yil: 2020, dogrulama: 'ikincil', not: 'Notya canlı bildirim yapmaz; yazdırılabilir taslak + kontrol listesi' },
  PSOKID_2025: { ref: 'PSOKID_2025', ad: 'PSOKİD Psoriasis tanı ve tedavi kılavuzu', rol: 'tr-dernek', yil: 2025, dogrulama: 'hekim', not: 'Basamak adları / “onluk kuralı” eşiği; ilaç seçimi ve doz hekimin' },
  TDD_AD_2018: { ref: 'TDD_AD_2018', ad: 'TDD Atopik Dermatit tanı ve tedavi kılavuzu', rol: 'tr-dernek', yil: 2018, dogrulama: 'hekim', not: 'Basamaklı yaklaşım adları; potens / doz hekimin' },
  TDD_AKNE: { ref: 'TDD_AKNE', ad: 'TDD Akne tanı ve tedavi kılavuzu', rol: 'tr-dernek', yil: 2018, dogrulama: 'hekim' },
  TDD_CYBE: { ref: 'TDD_CYBE', ad: 'TDD cinsel yolla bulaşan enfeksiyonlar algoritmaları', rol: 'tr-dernek', yil: 2020, dogrulama: 'hekim' },
  ALPSOY_BEHCET: { ref: 'ALPSOY_BEHCET', ad: 'Behçet hastalığı TR literatürü (Alpsoy) + ISG ölçütleri', rol: 'tr-dernek', yil: 2020, dogrulama: 'ikincil' },
  EUROMELANOMA: { ref: 'EUROMELANOMA', ad: 'Euromelanoma / TDD Mayıs deri kanseri farkındalık kampanyası', rol: 'tr-dernek', yil: 2026, dogrulama: 'ikincil' },
  BOLOGNIA: { ref: 'BOLOGNIA', ad: 'Bolognia Dermatology 5. baskı — ders kitabı derinliği (gold)', rol: 'ders-kitabi', yil: 2024, dogrulama: 'ikincil', not: 'Rol atfı; metin kopyalanmaz' },
  ANDREWS: { ref: 'ANDREWS', ad: 'Andrews Deri Hastalıkları 14 TR + Atlas — klinik / atlas', rol: 'ders-kitabi', yil: 2026, dogrulama: 'ikincil' },
  TEMEL_DERM: { ref: 'TEMEL_DERM', ad: 'Temel Dermatoloji — ulusal TR poliklinik dili', rol: 'ulusal-tr', yil: 2020, dogrulama: 'ikincil' },
  TUKMOS_2019: { ref: 'TUKMOS_2019', ad: 'TUKMOS Deri ve Zührevi Hastalıkları çekirdek müfredatı', rol: 'ders-kitabi', yil: 2019, dogrulama: 'ikincil' },
}

export type Dipnot = { ref: DermRef; not: string }

/** TR önce sıralama (çakışmada TR kazanır). */
export const DERM_KAYNAK_SIRASI: DermRef[] = [
  'SUT_2026', 'SUT_ISLEM', 'GOP_KUB', 'AYAKTA_TESHIS', 'SOLARYUM_2018', 'BZBH_014',
  'PSOKID_2025', 'TDD_AD_2018', 'TDD_AKNE', 'TDD_CYBE', 'ALPSOY_BEHCET', 'EUROMELANOMA',
  'TEMEL_DERM', 'ANDREWS', 'BOLOGNIA', 'TUKMOS_2019',
]

/** Dipnot → okunabilir tek satır (kart altı / yazdırma). */
export function dipnotMetni(d: Dipnot): string {
  const k = DERM_KAYNAKLAR[d.ref]
  return `${k.ad} (${k.yil}, ${k.dogrulama === 'birincil' ? 'birincil metin' : k.dogrulama === 'hekim' ? 'hekim teyidi' : 'derinlik kaynağı'}) — ${d.not}`
}
