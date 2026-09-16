/**
 * NOTYA-JINE-04 — Full contraception MEC + emergency contraception + postpartum start (TR).
 * WHO MEC categories; TJOD OK; MoH counseling materials. Doctor locks prescriptions.
 */
export type MecKat = 1 | 2 | 3 | 4
export type YontemKod =
  | 'kok' | 'pop' | 'ria_cu' | 'ria_lng' | 'implant' | 'enjeksiyon'
  | 'kondom' | 'acil_lng' | 'acil_upa' | 'acil_cu' | 'tup_ligasyonu' | 'lam'

export type MecGirdi = {
  yas: number | null
  sigaraGunluk: number | null
  vteOykusu: boolean
  migrenAura: boolean
  taSistolik: number | null
  taDiastolik: number | null
  memeCa: boolean
  karacigerAgir: boolean
  postpartumGun: number | null
  emziriyor: boolean
  pidAktif: boolean
  aciklanmamisKanama: boolean
  bmi: number | null
  gebelikSupheli: boolean
}

export type MecSonuc = { yontem: YontemKod; kategori: MecKat; engeller: string[]; dikkat: string[]; not: string }

function maxKat(...ks: MecKat[]): MecKat { return Math.max(...ks) as MecKat }

/** WHO MEC-style gate per method (simplified TR office set). */
export function yontemMec(y: YontemKod, g: MecGirdi): MecSonuc {
  const e: string[] = [], d: string[] = []
  let k: MecKat = 1
  const sig = g.sigaraGunluk || 0
  const pp = g.postpartumGun
  const htYuksek = (g.taSistolik != null && g.taSistolik >= 160) || (g.taDiastolik != null && g.taDiastolik >= 100)
  const htOrta = (g.taSistolik != null && g.taSistolik >= 140) || (g.taDiastolik != null && g.taDiastolik >= 90)

  if (g.gebelikSupheli && y !== 'kondom') { e.push('Gebelik şüphesi — önce dışla'); k = 4 }

  if (y === 'kok') {
    if (g.yas != null && g.yas >= 35 && sig >= 15) { e.push('≥35 + sigara ≥15 (MEC 4)'); k = 4 }
    else if (g.yas != null && g.yas >= 35 && sig > 0) { d.push('≥35 + sigara <15 (MEC 3)'); k = maxKat(k, 3) }
    if (g.vteOykusu) { e.push('VTE öyküsü'); k = 4 }
    if (g.migrenAura) { e.push('Auralı migren'); k = 4 }
    if (htYuksek) { e.push('HT ≥160/100'); k = 4 }
    else if (htOrta) { d.push('HT 140–159'); k = maxKat(k, 3) }
    if (g.memeCa) { e.push('Meme Ca'); k = 4 }
    if (g.karacigerAgir) { e.push('Ağır karaciğer'); k = 4 }
    if (pp != null && pp < 21) { e.push('PP <21 gün'); k = 4 }
    else if (pp != null && pp < 42 && g.emziriyor) { d.push('PP 21–42 + emzirme'); k = maxKat(k, 3) }
    if (g.bmi != null && g.bmi >= 35) { d.push('BMI ≥35 VTE'); k = maxKat(k, 3) }
  }

  if (y === 'pop' || y === 'implant' || y === 'enjeksiyon') {
    if (g.memeCa) { e.push('Aktif meme Ca'); k = 4 }
    if (g.aciklanmamisKanama) { d.push('Açıklanmamış kanama — önce değerlendir'); k = maxKat(k, 3) }
    if (y === 'enjeksiyon' && g.yas != null && g.yas > 45) d.push('>45 yaş DMPA kemik yoğunluğu tartışması')
    if (y === 'pop' && pp != null && pp < 21 && g.emziriyor) { /* POP often OK early PP */ }
  }

  if (y === 'ria_cu' || y === 'ria_lng') {
    if (g.pidAktif) { e.push('Aktif PID'); k = 4 }
    if (g.aciklanmamisKanama) { d.push('Açıklanmamış kanama'); k = maxKat(k, 3) }
    if (pp != null && pp < 28) d.push('PP <4 hafta: perforasyon riski — hekim deneyimi')
    if (y === 'ria_lng') e.length // LNG-IUD also HMB first-line
  }

  if (y === 'acil_lng' || y === 'acil_upa' || y === 'acil_cu') {
    if (g.gebelikSupheli) { e.push('Mevcut gebelikte EC yok'); k = 4 }
  }

  if (y === 'lam') {
    if (!g.emziriyor) { e.push('LAM yalnız tam emzirme'); k = 4 }
    if (pp != null && pp > 180) { e.push('LAM ≤6 ay'); k = 4 }
  }

  if (y === 'tup_ligasyonu') {
    d.push('Kalıcı yöntem — pişmanlık danışmanlığı ve onam zorunlu')
  }

  return {
    yontem: y,
    kategori: k,
    engeller: e,
    dikkat: d,
    not: k === 4 ? 'Başlatılamaz / önerilmez (MEC 4)' : k === 3 ? 'Dikkat — yarar/risk hekimle' : 'Uygun (MEC 1–2)',
  }
}

export type AcilKontrasepsiyonGirdi = {
  iliskiSaatOnce: number | null /** hours since unprotected sex */
  emziriyor: boolean
  kokKullanıyor: boolean
  tercih?: 'lng' | 'upa' | 'cu' | null
}

export type AcilSonuc = {
  secenekler: { kod: YontemKod; ad: string; pencere: string; etkinlik: string; not: string; mec: MecKat }[]
  oneri: string
  sonrasi: string[]
}

export function acilKontrasepsiyon(g: AcilKontrasepsiyonGirdi): AcilSonuc {
  const h = g.iliskiSaatOnce
  const secenekler: AcilSonuc['secenekler'] = []
  if (h == null || h <= 72) {
    secenekler.push({ kod: 'acil_lng', ad: 'Levonorgestrel 1,5 mg tek doz (veya 0,75×2)', pencere: '≤72 saat (en iyi ≤12–24)', etkinlik: 'İyi; BMI yüksekte azalabilir', not: 'Eczane/reçete TR\'de yaygın', mec: 1 })
  }
  if (h == null || h <= 120) {
    secenekler.push({ kod: 'acil_upa', ad: 'Ulipristal asetat 30 mg', pencere: '≤120 saat', etkinlik: 'LNG\'den üstün (özellikle 72–120 sa)', not: g.emziriyor ? 'UPA sonrası emzirmeyi 1 hafta sakın' : 'CYP3A4 etkileşimleri', mec: 1 })
    secenekler.push({ kod: 'acil_cu', ad: 'Cu-RİA acil takma', pencere: '≤5 gün (120 sa)', etkinlik: 'En etkili EC', not: 'Aynı zamanda uzun dönem kontrasepsiyon', mec: 1 })
  }
  let oneri = 'Pencere ve tercihe göre seçenek sunun'
  if (h != null && h > 120) oneri = '120 saati aştı — EC etkinliği belirsiz; Cu-RİA hâlâ tartışılabilir (hekim); gebelik testi planla'
  else if (h != null && h > 72) oneri = '72–120 sa: UPA veya Cu-RİA tercih; LNG ikinci seçenek'
  else oneri = '≤72 sa: Cu-RİA (en etkili) veya UPA/LNG — hasta tercihi + emzirme/ilaç etkileşimi'

  return {
    secenekler,
    oneri,
    sonrasi: [
      '3 hafta sonra gebelik testi (adet gecikirse daha erken)',
      'EC sonrası düzenli yönteme geçiş danışmanlığı (çekilme yerine modern yöntem)',
      'KOK kaçırıldıysa: paket talimatı + 7 gün ek koruma',
      'Cinsel şiddet şüphesinde: şiddet tarama + sevk + profilaksi protokolü',
    ],
  }
}

export type PostpartumStart = { yontem: YontemKod; baslangic: string; not: string }

export function postpartumKontrasepsiyonBaslangic(ppGun: number, emziriyor: boolean): PostpartumStart[] {
  const out: PostpartumStart[] = [
    { yontem: 'kondom', baslangic: 'Hemen', not: 'Her zaman kullanılabilir' },
  ]
  if (emziriyor && ppGun <= 180) out.push({ yontem: 'lam', baslangic: 'Hemen (kriterler: tam emzirme, amenore, ≤6 ay)', not: 'Kriter bozulunca hemen başka yönteme geç' })
  if (ppGun >= 21) out.push({ yontem: 'pop', baslangic: '≥21 gün', not: 'Emzirmede KOK\'a tercih' })
  if (ppGun >= 21 && !emziriyor) out.push({ yontem: 'kok', baslangic: '≥21 gün (emzirmeyen)', not: 'Emziren: genelde ≥42 gün / MEC' })
  if (ppGun >= 28) {
    out.push({ yontem: 'ria_cu', baslangic: '≥4 hafta (veya doğumda takılıysa protokol)', not: 'STI tarama' })
    out.push({ yontem: 'ria_lng', baslangic: '≥4 hafta', not: 'HMB + kontrasepsiyon ikili yarar' })
  }
  if (ppGun >= 21) out.push({ yontem: 'implant', baslangic: '≥21 gün (erken PP mümkün — hekim)', not: 'Emzirme uyumlu' })
  if (ppGun >= 21) out.push({ yontem: 'enjeksiyon', baslangic: '≥21 gün', not: 'DMPA; kemik notu' })
  return out
}

export const YONTEM_KATALOG: { kod: YontemKod; ad: string; sure: string }[] = [
  { kod: 'kok', ad: 'Kombine oral kontraseptif', sure: 'Günlük' },
  { kod: 'pop', ad: 'Sadece progestin hap (mini-hap)', sure: 'Günlük' },
  { kod: 'ria_cu', ad: 'Bakır RİA', sure: '5–10 yıl' },
  { kod: 'ria_lng', ad: 'LNG-RİA', sure: '5–8 yıl' },
  { kod: 'implant', ad: 'İmplant (etonogestrel)', sure: '~3 yıl' },
  { kod: 'enjeksiyon', ad: 'DMPA enjeksiyon', sure: '13 hafta' },
  { kod: 'kondom', ad: 'Kondom', sure: 'Her ilişki' },
  { kod: 'acil_lng', ad: 'Acil LNG', sure: 'Tek doz' },
  { kod: 'acil_upa', ad: 'Acil UPA', sure: 'Tek doz' },
  { kod: 'acil_cu', ad: 'Acil Cu-RİA', sure: 'Takma' },
  { kod: 'tup_ligasyonu', ad: 'Tüp ligasyonu', sure: 'Kalıcı' },
  { kod: 'lam', ad: 'LAM (emzirme amenoresi)', sure: '≤6 ay' },
]
