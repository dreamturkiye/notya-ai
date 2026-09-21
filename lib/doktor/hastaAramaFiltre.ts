/**
 * Combinable patient-search filters — every dossier field is a filter.
 *
 * Spoken query → structured AND filters (yaş + hafta + gelme nedeni + …).
 * Values are matched across notes, intake, aşı, ilaç, randevu, belge, vitals.
 * Isolation lives in hastaDosyaAra (every query doctor-scoped).
 */
import { trAramaNormalize } from '@/lib/utils/turkceArama'
import { AY_AD, ASI_KELIME, KAN_GRUPLARI, KLINIK_SOZLUK } from '@/lib/doktor/hastaAramaSozluk'

export interface YasFiltresi { minAy: number; maxAy: number; etiket: string }
export interface AlanFiltresi { anahtar: string; etiket: string; degerler: string[] }
export interface SayisalFiltre { alan: string; min: number | null; max: number | null; etiket: string }

export interface Pencere {
  basIso: string
  bitIso: string
  basGun: string
  bitGun: string
  etiket: string
}

export interface SorguAyik {
  terimler: string[]
  asi: boolean
  cogul: boolean
  sayim: boolean
  klinik: boolean
  ziyaret: boolean
  pencere: Pencere | null
  yas: YasFiltresi | null
  cinsiyet: 'kadin' | 'erkek' | null
  alanlar: AlanFiltresi[]
  veya: string[][]
  haric: string[]
  sayisal: SayisalFiltre[]
  kanGrubu: string | null
  ozet: string
}

export interface AlanTanimi {
  anahtar: string
  etiket: string
  grup: string
  takma: string[]
}

/** Spoken / form field catalog — AND-combined when more than one is present. */
export const ARAMA_ALANLARI: AlanTanimi[] = [
  { anahtar: 'ad', etiket: 'Ad', grup: 'kimlik', takma: ['adi', 'ismi', 'adli', 'adsoyad'] },
  { anahtar: 'soyad', etiket: 'Soyad', grup: 'kimlik', takma: ['soyadi'] },
  { anahtar: 'yas', etiket: 'Yaş', grup: 'kimlik', takma: ['yasinda', 'yasindaki', 'yasında', 'aylik', 'aylikken'] },
  { anahtar: 'dogum', etiket: 'Doğum tarihi', grup: 'kimlik', takma: ['dogumtarihi', 'dt', 'dogum'] },
  { anahtar: 'cinsiyet', etiket: 'Cinsiyet', grup: 'kimlik', takma: ['kiz', 'erkek', 'kadin', 'kizi'] },
  { anahtar: 'dogumyeri', etiket: 'Doğum yeri', grup: 'kimlik', takma: ['dogumyeri'] },
  { anahtar: 'babaadi', etiket: 'Baba adı', grup: 'kimlik', takma: ['babaadi', 'baba'] },
  { anahtar: 'anneadi', etiket: 'Anne adı', grup: 'kimlik', takma: ['anneadi', 'anaadi', 'anne'] },
  { anahtar: 'medenidurum', etiket: 'Medeni durum', grup: 'kimlik', takma: ['bekar', 'evli', 'bosanmis', 'dul'] },
  { anahtar: 'il', etiket: 'Şehir', grup: 'iletisim', takma: ['sehir', 'il', 'ilde', 'istanbul', 'ankara', 'izmir', 'bursa', 'antalya'] },
  { anahtar: 'adres', etiket: 'Adres', grup: 'iletisim', takma: ['adres', 'mahalle', 'sokak'] },
  { anahtar: 'sigorta', etiket: 'Sigorta', grup: 'guvence', takma: ['sgk', 'ozel sigorta', 'ucretli', 'tamamlayici', 'kurumsal'] },
  { anahtar: 'kangrubu', etiket: 'Kan grubu', grup: 'saglik', takma: ['kan grubu', 'arh', 'brh', 'abrh'] },
  { anahtar: 'kronik', etiket: 'Kronik hastalık', grup: 'saglik', takma: ['diyabet', 'hipertansiyon', 'astim', 'koah', 'kalp', 'bobrek', 'tiroid', 'kanser'] },
  { anahtar: 'alerji', etiket: 'Alerji', grup: 'saglik', takma: ['alerji', 'allerji', 'anafilaksi'] },
  { anahtar: 'ameliyat', etiket: 'Ameliyat', grup: 'saglik', takma: ['ameliyat', 'operasyon', 'cerrahi'] },
  { anahtar: 'sigara', etiket: 'Sigara', grup: 'saglik', takma: ['sigara', 'icici'] },
  { anahtar: 'alkol', etiket: 'Alkol', grup: 'saglik', takma: ['alkol'] },
  { anahtar: 'gelme', etiket: 'Gelme nedeni', grup: 'muayene', takma: ['gelme nedeni', 'basvuru', 'yakinma', 'sikayet', 'geldi', 'gelen'] },
  { anahtar: 'anamnez', etiket: 'Anamnez', grup: 'muayene', takma: ['anamnez', 'subjektif', 'oyku'] },
  { anahtar: 'fizik', etiket: 'Fizik muayene', grup: 'muayene', takma: ['fizik', 'objektif', 'muayene bulgu'] },
  { anahtar: 'tani', etiket: 'Tanı', grup: 'muayene', takma: ['tani', 'teshis', 'degerlendirme'] },
  { anahtar: 'plan', etiket: 'Plan', grup: 'muayene', takma: ['plan', 'tedavi'] },
  { anahtar: 'icd', etiket: 'ICD-10', grup: 'muayene', takma: ['icd', 'icd10'] },
  { anahtar: 'ates', etiket: 'Ateş', grup: 'vital', takma: ['ates', 'fever', 'pireksi'] },
  { anahtar: 'kilo', etiket: 'Kilo', grup: 'vital', takma: ['kilo', 'agirlik'] },
  { anahtar: 'boy', etiket: 'Boy', grup: 'vital', takma: ['boy', 'uzunluk'] },
  { anahtar: 'nabiz', etiket: 'Nabız', grup: 'vital', takma: ['nabiz', 'kalp atim'] },
  { anahtar: 'spo2', etiket: 'SpO₂', grup: 'vital', takma: ['spo2', 'oksijen'] },
  { anahtar: 'tansiyon', etiket: 'Tansiyon', grup: 'vital', takma: ['tansiyon', 'kb'] },
  { anahtar: 'asi', etiket: 'Aşı', grup: 'asi', takma: ['asi', 'asilama', 'immuniz', 'kpa', 'hepatit', 'bcg', 'kizamik'] },
  { anahtar: 'ilac', etiket: 'İlaç', grup: 'ilac', takma: ['ilac', 'recete', 'antibiyotik'] },
  { anahtar: 'randevu', etiket: 'Randevu', grup: 'randevu', takma: ['randevu', 'randevusu'] },
  { anahtar: 'belge', etiket: 'Belge', grup: 'belge', takma: ['belge', 'epikriz', 'lab', 'rontgen', 'pdf'] },
  { anahtar: 'kulak', etiket: 'Kulak', grup: 'sikayet', takma: ['kulak', 'otit', 'otitis', 'h65', 'h66'] },
  { anahtar: 'bogaz', etiket: 'Boğaz', grup: 'sikayet', takma: ['bogaz', 'farenjit', 'tonsillit', 'streptokok'] },
  { anahtar: 'oksuruk', etiket: 'Öksürük', grup: 'sikayet', takma: ['oksuruk', 'krup'] },
  { anahtar: 'ishal', etiket: 'İshal', grup: 'sikayet', takma: ['ishal', 'gastroenterit', 'kusma', 'rotavirus'] },
  { anahtar: 'idrar', etiket: 'İdrar', grup: 'sikayet', takma: ['idrar', 'uti', 'sistit'] },
  { anahtar: 'bronşit', etiket: 'Bronşit', grup: 'sikayet', takma: ['bronşit', 'bronchiol', 'wheez'] },
  { anahtar: 'dokuntu', etiket: 'Döküntü', grup: 'sikayet', takma: ['dokuntu', 'egzama', 'isilik', 'dermatit'] },
  { anahtar: 'hirilti', etiket: 'Hırıltı', grup: 'sikayet', takma: ['hirilti', 'bronşiolit', 'wheez'] },
  { anahtar: 'astim', etiket: 'Astım', grup: 'sikayet', takma: ['astim', 'nefes'] },
  { anahtar: 'gelisim', etiket: 'Gelişim', grup: 'sikayet', takma: ['gelisim', 'persentil', 'neyzi'] },
  { anahtar: 'anemi', etiket: 'Anemi', grup: 'sikayet', takma: ['anemi', 'demir'] },
  { anahtar: 'travma', etiket: 'Travma', grup: 'sikayet', takma: ['dusme', 'kirik', 'yanik', 'travma'] },
  { anahtar: 'karin', etiket: 'Karın', grup: 'sikayet', takma: ['karin', 'kolik', 'gaz'] },
  { anahtar: 'goz', etiket: 'Göz', grup: 'sikayet', takma: ['goz', 'konjonktivit', 'katarakt', 'glokom'] },
  { anahtar: 'burun', etiket: 'Burun', grup: 'sikayet', takma: ['burun', 'sinuzit', 'nezle', 'rinit'] },
  { anahtar: 'gebelik', etiket: 'Gebelik', grup: 'sikayet', takma: ['gebe', 'hamile', 'gebelik', 'nst'] },
  { anahtar: 'kalp', etiket: 'Kalp', grup: 'sikayet', takma: ['aritmi', 'stent', 'kalp'] },
]

export const ESANLAM: Record<string, string[]> = { ...KLINIK_SOZLUK }
export { ASI_KELIME }

const DURAK = new Set([
  'hangi', 'hangileri', 'hangileriyedi', 'hangisiydi', 'hasta', 'hastalar', 'hastasi', 'hastam', 'hastanin', 'hastaniz',
  'hastas', 'patients', 'patient', 'how', 'many',
  'bana', 'ile', 'gelen', 'geldi', 'gelenler', 'yaptigim', 'yaptigimiz', 'yaptiklarim',
  'olan', 'olanlar', 'kim', 'kimler', 'bir', 'bu', 'su', 'o', 've', 'veya', 'icin',
  'mi', 'mu', 'miydi', 'yedi', 'gecen', 'hafta', 'haftaki', 'ay', 'ayi', 'bugun', 'dun',
  'son', 'onceki', 'benim', 'ben', 'da', 'de', 'ki', 'ne', 'nedir', 'var', 'yok',
  'soyle', 'bak', 'bul', 'ara', 'arama', 'hocam', 'merhaba', 'selam', 'nasilsiniz',
  'gordugum', 'gorduklerim', 'goren', 'baktigim', 'muayene', 'ettigim', 'ettigimiz',
  'yasinda', 'yasindaki', 'yasindakiler', 'yasında', 'aylik', 'aylikken', 'tane',
  'kac', 'kaci', 'sayisi', 'sayi', 'listele', 'liste', 'hepsi', 'tamami',
  'yil', 'yilinda', 'yilindaki',
  'tell', 'number', 'had', 'this', 'week', 'last', 'month', 'between', 'then', 'ages', 'age',
  'years', 'year', 'old', 'the', 'of', 'to', 'and', 'arasi', 'arasinda',
  'veya', 'except', 'without', 'olmayan', 'olmadigi', 'haric', 'yapmadigim',
  'days', 'day', 'weeks', 'months', 'gunluk',
  'ustu', 'uzeri', 'alti', 'esit', 'buyuk', 'kucuk',
])

const YAZI_SAYI: Record<string, number> = {
  bir: 1, iki: 2, uc: 3, dort: 4, bes: 5, alti: 6, yedi: 7, sekiz: 8, dokuz: 9,
  on: 10, onbir: 11, oniki: 12, onuc: 13, ondort: 14, onbes: 15, onalti: 16,
  onyedi: 17, onsekiz: 18,
}

function trtParca(d = new Date(), gunOffset = 0): { iso: string; gun: string } {
  const x = new Date(d.getTime() + gunOffset * 86400000)
  const gun = x.toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
  return { iso: new Date(`${gun}T00:00:00+03:00`).toISOString(), gun }
}

function haftaBasiGun(d = new Date()): string {
  const gun = d.toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
  const dt = new Date(`${gun}T12:00:00+03:00`)
  const dow = (dt.getUTCDay() + 6) % 7
  dt.setUTCDate(dt.getUTCDate() - dow)
  return dt.toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
}

function gunEkle(gun: string, n: number): string {
  const d = new Date(`${gun}T12:00:00+03:00`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
}

export function yasAyHesapla(dobIso: string, now = new Date()): number | null {
  const dogum = dobIso.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dogum)) return null
  const bugun = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
  const [y, m, d] = dogum.split('-').map(Number)
  const [Y, M, D] = bugun.split('-').map(Number)
  let ay = (Y - y) * 12 + (M - m)
  if (D < d) ay -= 1
  return ay < 0 ? 0 : ay
}

export function yasFiltreEslesir(ay: number | null, f: YasFiltresi | null): boolean {
  if (!f) return true
  if (ay == null) return false
  return ay >= f.minAy && ay <= f.maxAy
}

function yaziSayi(n: string): number | null {
  if (/^\d{1,2}$/.test(n)) return Number(n)
  return YAZI_SAYI[n] ?? null
}

const SAYI_RE = '(\\d{1,2}|bir|iki|uc|dort|bes|alti|yedi|sekiz|dokuz|on|onbir|oniki|onuc|ondort|onbes|onalti|onyedi|onsekiz)'

function yasAralikYil(a: number, b: number): YasFiltresi {
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  return { minAy: lo * 12, maxAy: hi * 12 + 11, etiket: `${lo}–${hi} yaş` }
}

function yasCikar(n: string): { yas: YasFiltresi | null; kalan: string } {
  let kalan = n
  let yas: YasFiltresi | null = null

  const yenidogan = /\byenidogan\b|\bbebek\b.*\b(1|bir)?\s*ay/.test(n)
  if (/\byenidogan\b/.test(n) || yenidogan) {
    yas = { minAy: 0, maxAy: 1, etiket: 'yenidoğan' }
    kalan = kalan.replace(/\byenidogan\b/g, ' ')
  }

  const aralikKalip: RegExp[] = [
    new RegExp(`\\bbetween\\s+\\w{0,8}\\s*ages?\\s+(?:of\\s+)?${SAYI_RE}\\s*[-–]\\s*${SAYI_RE}`),
    new RegExp(`\\bbetween\\s+${SAYI_RE}\\s+(?:and|to|ile|ila)\\s+${SAYI_RE}\\s*(?:yas|years?|yo)?`),
    new RegExp(`\\b${SAYI_RE}\\s+(?:ile|ila|to|and)\\s+${SAYI_RE}\\s*(?:yas|years?|yo)\\b`),
    new RegExp(`\\b${SAYI_RE}\\s*[-–]\\s*${SAYI_RE}\\s*(?:yas|years?|yo)\\b`),
    new RegExp(`\\b${SAYI_RE}\\s*[-–]\\s*${SAYI_RE}\\s*(?:yas|years?)?\\s*(?:arasi|arasinda)\\b`),
  ]
  for (const rx of aralikKalip) {
    const m = kalan.match(rx)
    if (!m) continue
    const a = yaziSayi(m[1])
    const b = yaziSayi(m[2])
    if (a == null || b == null) continue
    yas = yasAralikYil(a, b)
    kalan = kalan.replace(m[0], ' ')
    break
  }

  const ayAralik = kalan.match(new RegExp(`\\b${SAYI_RE}\\s*[-–]\\s*${SAYI_RE}\\s*ay(?:lik)?\\b`))
  if (ayAralik && !yas) {
    const a = yaziSayi(ayAralik[1])
    const b = yaziSayi(ayAralik[2])
    if (a != null && b != null) {
      yas = { minAy: Math.min(a, b), maxAy: Math.max(a, b), etiket: `${Math.min(a, b)}–${Math.max(a, b)} ay` }
      kalan = kalan.replace(ayAralik[0], ' ')
    }
  }

  const kucuk = kalan.match(/\b(\d{1,2}|bir|iki|uc|dort|bes|alti|yedi|sekiz|dokuz|on|oniki|onsekiz)\s*yasindan\s*(kucuk|alti)/)
  if (kucuk) {
    const a = yaziSayi(kucuk[1])
    if (a != null) {
      yas = { minAy: 0, maxAy: a * 12 - 1, etiket: `${a} yaşından küçük` }
      kalan = kalan.replace(kucuk[0], ' ')
    }
  }

  const buyuk = kalan.match(/\b(\d{1,2}|bir|iki|uc|dort|bes|alti|yedi|sekiz|dokuz|on|oniki|onsekiz)\s*yasindan\s*(buyuk|fazla|uzeri)/)
  if (buyuk) {
    const a = yaziSayi(buyuk[1])
    if (a != null) {
      yas = { minAy: a * 12 + 12, maxAy: 120 * 12, etiket: `${a} yaşından büyük` }
      kalan = kalan.replace(buyuk[0], ' ')
    }
  }

  const aylik = kalan.match(/\b(\d{1,2}|bir|iki|uc|dort|bes|alti|yedi|sekiz|dokuz|on|onbir|onsekiz)\s*aylik/)
  if (aylik && !yas) {
    const a = yaziSayi(aylik[1])
    if (a != null) {
      yas = { minAy: a, maxAy: a, etiket: `${a} aylık` }
      kalan = kalan.replace(aylik[0], ' ')
    }
  }

  const tam = kalan.match(/\b(\d{1,2}|bir|iki|uc|dort|bes|alti|yedi|sekiz|dokuz|on|onbir|oniki|onuc|ondort|onbes|onalti|onyedi|onsekiz)\s*yas(inda|indaki|indakiler|inda ki)?\b/)
  if (tam && !yas) {
    const a = yaziSayi(tam[1])
    if (a != null) {
      yas = { minAy: a * 12, maxAy: a * 12 + 11, etiket: `${a} yaş` }
      kalan = kalan.replace(tam[0], ' ')
    }
  }

  return { yas, kalan: kalan.replace(/\s+/g, ' ').trim() }
}

function pencereCikar(n: string, now: Date): { pencere: Pencere | null; kalan: string } {
  const bugun = trtParca(now).gun
  let pencere: Pencere | null = null
  let kalan = n
  if (/\bbugun\b|\btoday\b/.test(n)) {
    pencere = { basIso: `${bugun}T00:00:00+03:00`, bitIso: `${bugun}T23:59:59+03:00`, basGun: bugun, bitGun: bugun, etiket: 'bugün' }
  } else if (/\bdun\b|\byesterday\b/.test(n)) {
    const d = gunEkle(bugun, -1)
    pencere = { basIso: `${d}T00:00:00+03:00`, bitIso: `${d}T23:59:59+03:00`, basGun: d, bitGun: d, etiket: 'dün' }
  } else if (/gecen hafta|last week/.test(n)) {
    const bu = haftaBasiGun(now)
    const bas = gunEkle(bu, -7)
    const bit = gunEkle(bu, -1)
    pencere = { basIso: `${bas}T00:00:00+03:00`, bitIso: `${bit}T23:59:59+03:00`, basGun: bas, bitGun: bit, etiket: 'geçen hafta' }
  } else if (/bu hafta|this week/.test(n)) {
    const bas = haftaBasiGun(now)
    pencere = { basIso: `${bas}T00:00:00+03:00`, bitIso: `${bugun}T23:59:59+03:00`, basGun: bas, bitGun: bugun, etiket: 'bu hafta' }
  } else if (/gecen ay|last month/.test(n)) {
    const [y, a] = bugun.split('-').map(Number)
    const ay = a === 1 ? 12 : a - 1
    const yil = a === 1 ? y - 1 : y
    const bas = `${yil}-${String(ay).padStart(2, '0')}-01`
    const bit = gunEkle(`${bugun.slice(0, 8)}01`, -1)
    pencere = { basIso: `${bas}T00:00:00+03:00`, bitIso: `${bit}T23:59:59+03:00`, basGun: bas, bitGun: bit, etiket: 'geçen ay' }
  } else if (/bu ay|this month/.test(n)) {
    const bas = `${bugun.slice(0, 8)}01`
    pencere = { basIso: `${bas}T00:00:00+03:00`, bitIso: `${bugun}T23:59:59+03:00`, basGun: bas, bitGun: bugun, etiket: 'bu ay' }
  } else if (/bu yil|this year/.test(n)) {
    const bas = `${bugun.slice(0, 4)}-01-01`
    pencere = { basIso: `${bas}T00:00:00+03:00`, bitIso: `${bugun}T23:59:59+03:00`, basGun: bas, bitGun: bugun, etiket: 'bu yıl' }
  } else {
    const son = n.match(/\bson\s+(\d{1,2})\s+(gun|hafta|ay|days?|weeks?|months?)/)
    if (son) {
      const adet = Number(son[1])
      const birim = son[2]
      const gun = /hafta|week/.test(birim) ? adet * 7 : /ay|month/.test(birim) ? adet * 30 : adet
      const bas = gunEkle(bugun, -gun)
      pencere = { basIso: `${bas}T00:00:00+03:00`, bitIso: `${bugun}T23:59:59+03:00`, basGun: bas, bitGun: bugun, etiket: `son ${adet} ${birim}` }
      kalan = kalan.replace(son[0], ' ')
    }
    const ayAralik = n.match(/\b(\d{1,2})\s*(ocak|subat|mart|nisan|mayis|haziran|temmuz|agustos|eylul|ekim|kasim|aralik)\s*[-–]\s*(\d{1,2})\s*(ocak|subat|mart|nisan|mayis|haziran|temmuz|agustos|eylul|ekim|kasim|aralik)/)
    if (ayAralik && !pencere) {
      const yil = Number(bugun.slice(0, 4))
      const a1 = AY_AD[ayAralik[2]]
      const a2 = AY_AD[ayAralik[4]]
      if (a1 && a2) {
        const bas = `${yil}-${String(a1).padStart(2, '0')}-${String(ayAralik[1]).padStart(2, '0')}`
        const bit = `${yil}-${String(a2).padStart(2, '0')}-${String(ayAralik[3]).padStart(2, '0')}`
        pencere = { basIso: `${bas}T00:00:00+03:00`, bitIso: `${bit}T23:59:59+03:00`, basGun: bas, bitGun: bit, etiket: `${ayAralik[1]}–${ayAralik[3]} ${ayAralik[4]}` }
        kalan = kalan.replace(ayAralik[0], ' ')
      }
    }
    const isoAralik = n.match(/\b(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})\s*[-–]\s*(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})/)
    if (isoAralik && !pencere) {
      const bas = `${isoAralik[3]}-${isoAralik[2].padStart(2, '0')}-${isoAralik[1].padStart(2, '0')}`
      const bit = `${isoAralik[6]}-${isoAralik[5].padStart(2, '0')}-${isoAralik[4].padStart(2, '0')}`
      pencere = { basIso: `${bas}T00:00:00+03:00`, bitIso: `${bit}T23:59:59+03:00`, basGun: bas, bitGun: bit, etiket: `${isoAralik[1]}.${isoAralik[2]}–${isoAralik[4]}.${isoAralik[5]}` }
      kalan = kalan.replace(isoAralik[0], ' ')
    }
  }
  if (pencere) {
    kalan = kalan.replace(/gecen hafta|bu hafta|gecen ay|bu ay|bu yil|bugun|dun|this week|last week|this month|last month|this year|today|yesterday/g, ' ')
  }
  return { pencere, kalan: kalan.replace(/\s+/g, ' ').trim() }
}

function sayisalCikar(n: string): { sayisal: SayisalFiltre[]; kalan: string } {
  const sayisal: SayisalFiltre[] = []
  let kalan = n
  const tek = [
    { alan: 'ates', rx: /\bates(?:i)?\s*(?:>=|>|ustu|uzeri)?\s*(\d+[.,]?\d*)/ },
    { alan: 'spo2', rx: /\bspo2\s*(?:<=|<|alti)\s*(\d{2,3})/ },
    { alan: 'kilo', rx: /\bkilo(?:su)?\s*(?:>=|>|ustu|uzeri)?\s*(\d+[.,]?\d*)/ },
  ]
  for (const t of tek) {
    const m = kalan.match(t.rx)
    if (!m) continue
    const v = Number(m[1].replace(',', '.'))
    if (!Number.isFinite(v)) continue
    if (t.alan === 'spo2') sayisal.push({ alan: t.alan, min: null, max: v, etiket: `SpO₂ ≤${v}` })
    else sayisal.push({ alan: t.alan, min: v, max: null, etiket: `${t.alan} ≥${v}` })
    kalan = kalan.replace(m[0], ' ')
  }
  const aralik = kalan.match(/\b(ates|kilo|boy|nabiz|spo2)\s*(\d+[.,]?\d*)\s*[-–]\s*(\d+[.,]?\d*)/)
  if (aralik) {
    const a = Number(aralik[2].replace(',', '.'))
    const b = Number(aralik[3].replace(',', '.'))
    if (Number.isFinite(a) && Number.isFinite(b)) {
      sayisal.push({ alan: aralik[1], min: Math.min(a, b), max: Math.max(a, b), etiket: `${aralik[1]} ${Math.min(a, b)}–${Math.max(a, b)}` })
      kalan = kalan.replace(aralik[0], ' ')
    }
  }
  return { sayisal, kalan: kalan.replace(/\s+/g, ' ').trim() }
}

function haricCikar(n: string): { haric: string[]; kalan: string } {
  const haric: string[] = []
  let kalan = n
  if (/asi\s*(olmayan|yok|yapmadigim|yapilmayan)|asisi yok|unvaccinated|without vaccine/.test(n)) {
    haric.push('asi')
    kalan = kalan.replace(/asi\s*(olmayan|yok|yapmadigim|yapilmayan)|asisi yok|unvaccinated|without vaccine/g, ' ')
  }
  if (/alerji(si)?\s*(olmayan|yok)/.test(n)) {
    haric.push('alerji')
    kalan = kalan.replace(/alerji(si)?\s*(olmayan|yok)/g, ' ')
  }
  return { haric, kalan: kalan.replace(/\s+/g, ' ').trim() }
}

function cinsiyetCikar(n: string): { cinsiyet: 'kadin' | 'erkek' | null; kalan: string } {
  if (/\b(kiz|kadin|kizi|kizlar|kadinlar)\b/.test(n)) {
    return { cinsiyet: 'kadin', kalan: n.replace(/\b(kiz|kadin|kizi|kizlar|kadinlar)\b/g, ' ') }
  }
  if (/\b(erkek|erkekler|ogl(an|u))\b/.test(n)) {
    return { cinsiyet: 'erkek', kalan: n.replace(/\b(erkek|erkekler|oglan|oglu)\b/g, ' ') }
  }
  return { cinsiyet: null, kalan: n }
}

export function sorguyuAyikla(mesaj: string, now = new Date()): SorguAyik {
  const n0 = trAramaNormalize(mesaj)
  const cogul = /hastalar|hangileri|kimler|hangileriyedi|hepsi|listele/.test(n0)
  const sayim = /\bkac\b|\bsayisi\b|\bkaci\b|how many|number of/.test(n0)
  const asi = ASI_KELIME.test(n0)
  const ziyaret = /gordugum|gorduklerim|muayene|ettigim|baktigim|gelen|geldi|gordum|\bhad\b|\bsaw\b/.test(n0)

  const y = yasCikar(n0)
  const p = pencereCikar(y.kalan, now)
  const c = cinsiyetCikar(p.kalan)
  const h = haricCikar(c.kalan)
  const s = sayisalCikar(h.kalan)
  let kalan = s.kalan
  const haric = h.haric
  const sayisal = s.sayisal
  let kanGrubu: string | null = null
  for (const k of KAN_GRUPLARI) {
    if (kalan.includes(k) || kalan.includes(k.replace(/\s+/g, ''))) { kanGrubu = k; break }
  }

  if (!p.pencere && (asi || /sikayet|tani|iltihap|otit|alerji|ilac|randevu|epikriz|form/.test(n0)) && !y.yas && !haric.includes('asi')) {
    const bugun = trtParca(now).gun
    const bas = gunEkle(bugun, -90)
    p.pencere = { basIso: `${bas}T00:00:00+03:00`, bitIso: `${bugun}T23:59:59+03:00`, basGun: bas, bitGun: bugun, etiket: 'son 90 gün' }
  }

  const alanlar: AlanFiltresi[] = []
  for (const alan of ARAMA_ALANLARI) {
    if (alan.anahtar === 'yas' || alan.anahtar === 'cinsiyet' || alan.anahtar === 'ad' || alan.anahtar === 'soyad') continue
    const vuran = alan.takma.filter((t) => {
      if (t.length < 3) return false
      const kacis = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')
      return new RegExp(`(^|[^a-z])${kacis}([^a-z]|$)`).test(kalan)
    })
    if (!vuran.length) continue
    const degerler = new Set<string>([alan.anahtar, ...alan.takma, ...(ESANLAM[alan.anahtar] || [])])
    alanlar.push({ anahtar: alan.anahtar, etiket: alan.etiket, degerler: [...degerler] })
  }

  const terimCikar = (parca: string): string[] => {
    const ham = parca
      .split(/[^a-z0-9]+/)
      .filter((k) => k.length >= 3 && !DURAK.has(k))
      .map((k) => k.replace(/iltehabi?|iltihabi?|iltehap/, 'iltihap'))
    const terimler = new Set<string>()
    for (const k of ham) {
      terimler.add(k)
      for (const [kok, liste] of Object.entries(ESANLAM)) {
        if (k === kok || liste.includes(k) || k.startsWith(kok)) {
          for (const e of liste) terimler.add(e)
          terimler.add(kok)
        }
      }
    }
    return [...terimler]
  }

  const veyaParca = kalan.split(/\b(?:veya|ya da| or )\b/)
  const veya = veyaParca.length > 1 ? veyaParca.map(terimCikar).filter((g) => g.length) : []
  const liste = veya.length ? [] : terimCikar(kalan)
  const klinikKelime = liste.some((t) => Boolean(ESANLAM[t]) || Object.values(ESANLAM).some((l) => l.includes(t)) || ASI_KELIME.test(t))
    || veya.some((g) => g.some((t) => Boolean(ESANLAM[t])))
  const klinik = (asi && !haric.includes('asi')) || cogul || sayim || klinikKelime || Boolean(y.yas) || Boolean(p.pencere && ziyaret) || alanlar.length > 0 || sayisal.length > 0 || haric.length > 0 || Boolean(kanGrubu) || Boolean(c.cinsiyet)
  const etiketler = [
    y.yas?.etiket,
    p.pencere?.etiket,
    c.cinsiyet === 'kadin' ? 'kız' : c.cinsiyet === 'erkek' ? 'erkek' : '',
    kanGrubu,
    ...sayisal.map((x) => x.etiket),
    ...haric.map((x) => `${x} hariç`),
    ...alanlar.map((a) => a.etiket),
  ].filter(Boolean)
  return {
    terimler: liste,
    asi: asi && !haric.includes('asi'),
    cogul: cogul || sayim,
    sayim,
    klinik,
    ziyaret: ziyaret || Boolean(y.yas && p.pencere),
    pencere: p.pencere,
    yas: y.yas,
    cinsiyet: c.cinsiyet,
    alanlar,
    veya,
    haric,
    sayisal,
    kanGrubu,
    ozet: etiketler.join(' · '),
  }
}

export function klinikAramaMi(mesaj: string, now = new Date()): boolean {
  return sorguyuAyikla(mesaj, now).klinik
}

export function listeSorgusuMu(mesaj: string, q?: SorguAyik): boolean {
  const s = q || sorguyuAyikla(mesaj)
  return s.cogul || s.sayim || Boolean(s.yas && (s.ziyaret || s.pencere))
}

export function metinEslesir(metin: string, terimler: string[]): boolean {
  if (!terimler.length) return false
  const t = trAramaNormalize(metin)
  if (!t) return false
  return terimler.some((k) => k.length >= 3 && t.includes(k))
}

/** AND: every leftover term (or its synonym group) must appear in the bag. */
export function tumTerimlerEslesir(metin: string, terimler: string[]): boolean {
  if (!terimler.length) return true
  const t = trAramaNormalize(metin)
  const gruplar = new Map<string, string[]>()
  for (const k of terimler) {
    let kok = k
    for (const [g, liste] of Object.entries(ESANLAM)) {
      if (k === g || liste.includes(k)) { kok = g; break }
    }
    const cur = gruplar.get(kok) || []
    cur.push(k)
    gruplar.set(kok, cur)
  }
  for (const liste of gruplar.values()) {
    if (!liste.some((k) => t.includes(k))) return false
  }
  return true
}

export function alanEslesir(metin: string, alan: AlanFiltresi): boolean {
  return metinEslesir(metin, alan.degerler)
}

export function veyaEslesir(metin: string, gruplar: string[][]): boolean {
  if (!gruplar.length) return true
  return gruplar.some((g) => metinEslesir(metin, g))
}

export function sayisalEslesir(metin: string, filtreler: SayisalFiltre[]): boolean {
  if (!filtreler.length) return true
  const t = metin.toLowerCase()
  for (const f of filtreler) {
    const rx = new RegExp(`${f.alan}[^0-9]{0,12}(\\d+[.,]?\\d*)`, 'g')
    let ok = false
    let m: RegExpExecArray | null
    while ((m = rx.exec(t))) {
      const v = Number(m[1].replace(',', '.'))
      if (!Number.isFinite(v)) continue
      if (f.min != null && v < f.min) continue
      if (f.max != null && v > f.max) continue
      ok = true
      break
    }
    if (!ok) return false
  }
  return true
}

export function haricEslesir(metin: string, haric: string[]): boolean {
  if (!haric.length) return true
  const t = trAramaNormalize(metin)
  for (const h of haric) {
    const liste = ESANLAM[h] || [h]
    if (liste.some((k) => t.includes(k))) return false
  }
  return true
}
