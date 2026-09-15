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
