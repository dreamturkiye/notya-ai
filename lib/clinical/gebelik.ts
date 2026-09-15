/**
 * NOTYA-KHD-01 (Kaan 2026-09-14): Gebelik takibi motoru — Kadın Hastalıkları ve Doğum chapter.
 * Kaynak: T.C. Sağlık Bakanlığı, Halk Sağlığı Genel Müdürlüğü, "Doğum Öncesi Bakım Yönetim
 * Rehberi" (2018) — 4 izlem takvimi, tarama/takviye maddeleri. Tamamen deterministik; LLM hiçbir
 * hafta/tarih/risk hesabı yapmaz. Fetal biyometri PERSENTİLİ burada YOK (doğrulanmış açık tablo
 * gömülmeden uydurulmaz — uzman incelemesine bırakıldı); yalnız ölçümler kaydedilir.
 */

export interface GebelikYasi { hafta: number; gun: number; toplamGun: number; trimester: 1 | 2 | 3; metin: string }

const MS_GUN = 86_400_000

function gunFarki(a: Date, b: Date): number { return Math.floor((a.getTime() - b.getTime()) / MS_GUN) }

/** Naegele: SAT + 280 gün. */
export function naegeleTahminiDogum(satIso: string): string {
  const d = new Date(satIso); d.setDate(d.getDate() + 280)
  return d.toISOString().slice(0, 10)
}

/** Gebelik yaşı — US ile düzeltilmiş TDT varsa onu, yoksa SAT'ı kullanır. */
export function gebelikYasi(satIso: string | null, tdtIso: string | null, bugun = new Date()): GebelikYasi | null {
  let baslangic: Date | null = null
  if (tdtIso) { const t = new Date(tdtIso); t.setDate(t.getDate() - 280); baslangic = t }
  else if (satIso) baslangic = new Date(satIso)
  if (!baslangic || isNaN(baslangic.getTime())) return null
  const toplamGun = gunFarki(bugun, baslangic)
  if (toplamGun < 0 || toplamGun > 320) return null
  const hafta = Math.floor(toplamGun / 7), gun = toplamGun % 7
  const trimester: 1 | 2 | 3 = hafta < 14 ? 1 : hafta < 28 ? 2 : 3
  return { hafta, gun, toplamGun, trimester, metin: `${hafta} hafta ${gun} gün` }
}

/** SB DÖB Rehberi — dört izlem penceresi. */
export interface IzlemPenceresi { no: 1 | 2 | 3 | 4; etiket: string; haftaBas: number; haftaSon: number; maddeler: string[] }

export const SB_IZLEM_TAKVIMI: IzlemPenceresi[] = [
  { no: 1, etiket: '1. İzlem', haftaBas: 0, haftaSon: 14, maddeler: [
    'Öykü, risk değerlendirme formu, obstetrik öykü (G/P/A/Y)',
    'Kilo, boy, VKİ (gebelik öncesi kiloya göre kilo alım hedefi)',
    'Tansiyon, idrar (protein/glukoz), Hb (anemi), kan grubu/Rh, HBsAg, VDRL/HIV (rehber algoritması)',
    'Folik asit 400-800 mcg/gün (12. haftaya kadar)',
    '11-14. hafta USG: ense saydamlığı, gebelik yaşı doğrulama (CRL)',
    'Tetanoz aşı durumu (Td — 12. haftadan itibaren yapılabilir)',
    'Danışmanlık: beslenme, sigara/alkol, ilaç güvenliği, tehlike işaretleri',
  ]},
  { no: 2, etiket: '2. İzlem', haftaBas: 18, haftaSon: 24, maddeler: [
    'Kilo, tansiyon, idrar (protein), fundus yüksekliği, fetal kalp atımı',
    '12. haftadan itibaren D vitamini 1200 IU/gün — başlandı mı?',
    'Demir desteği 40-60 mg/gün (SB demir akış şeması)',
    'Ayrıntılı (anomali) USG 18-22. hafta',
    'Tetanoz aşısı (doz kontrolü)',
    'Nöral tüp defekti taraması / ikili-üçlü test sonuçlarının değerlendirilmesi',
  ]},
  { no: 3, etiket: '3. İzlem', haftaBas: 28, haftaSon: 32, maddeler: [
    'Kilo, tansiyon, idrar (protein), fundus yüksekliği, fetal kalp atımı, fetal hareketler',
    '24-28. hafta glukoz tarama testi (GDM) sonucu',
    'Hb kontrolü (anemi), demir desteğine devam',
    'Rh negatif gebede anti-D immünglobulin değerlendirmesi (28. hafta) — uzman kararı',
    'Tetanoz 2. doz kontrolü',
    'Doğum yeri/şekli planlaması, tehlike işaretleri danışmanlığı',
  ]},
  { no: 4, etiket: '4. İzlem', haftaBas: 36, haftaSon: 38, maddeler: [
    'Kilo, tansiyon, idrar (protein), fundus yüksekliği, fetal kalp atımı, prezentasyon',
    'Doğum planı, doğum belirtileri ve ne zaman başvurulacağı',
    'Emzirme ve lohusalık danışmanlığı, aile planlaması',
    'Lohusa izlem takvimi (SB Lohusa İzlem Protokolü) — doğum sonrası',
  ]},
]

export type IzlemDurumu = 'tamamlandi' | 'zamani' | 'gecikmis' | 'ileride'

export function izlemDurumlari(hafta: number, yapilanIzlemHaftalari: number[]): Array<IzlemPenceresi & { durum: IzlemDurumu }> {
  return SB_IZLEM_TAKVIMI.map((p) => {
    const yapildi = yapilanIzlemHaftalari.some((h) => h >= p.haftaBas && h <= p.haftaSon)
    let durum: IzlemDurumu = 'ileride'
    if (yapildi) durum = 'tamamlandi'
    else if (hafta > p.haftaSon) durum = 'gecikmis'
    else if (hafta >= p.haftaBas) durum = 'zamani'
    return { ...p, durum }
  })
}

/** Gebelik öncesi VKİ'ye göre toplam kilo alım hedefi (SB/MEB DÖB modülü ile uyumlu). */
export function kiloAlimHedefi(gebelikOncesiVki: number | null): { alt: number; ust: number; etiket: string } | null {
  if (gebelikOncesiVki === null || !isFinite(gebelikOncesiVki)) return null
  if (gebelikOncesiVki < 18.5) return { alt: 13, ust: 18, etiket: 'Zayıf' }
  if (gebelikOncesiVki < 25) return { alt: 11, ust: 16, etiket: 'Normal' }
  if (gebelikOncesiVki < 30) return { alt: 7, ust: 11, etiket: 'Fazla kilolu' }
  return { alt: 5, ust: 9, etiket: 'Obez' }
}

export interface IzlemGirdisi {
  tarih: string; hafta: number
  kilo?: number | null; tansiyonSistolik?: number | null; tansiyonDiastolik?: number | null
  fundusYuksekligi?: number | null; fetalKalpAtimi?: number | null; proteinuri?: string | null
}

export interface Uyari { seviye: 'kritik' | 'dikkat' | 'bilgi'; metin: string }

/** Deterministik uyarılar — rehberde tanımlı eşiklerle; nihai karar hekimindir. */
export function gebelikUyarilari(g: GebelikYasi | null, son: IzlemGirdisi | null, rhNegatif: boolean, izlemler: IzlemGirdisi[]): Uyari[] {
  const u: Uyari[] = []
  if (!g) return u
  if (son) {
    const s = son.tansiyonSistolik ?? 0, d = son.tansiyonDiastolik ?? 0
    if (s >= 160 || d >= 110) u.push({ seviye: 'kritik', metin: `Tansiyon ${s}/${d} mmHg — ağır hipertansiyon, acil değerlendirme.` })
    else if (s >= 140 || d >= 90) u.push({ seviye: 'dikkat', metin: `Tansiyon ${s}/${d} mmHg — 20. haftadan sonra preeklampsi açısından proteinüri ile birlikte değerlendirin.` })
    if (son.proteinuri && /(\+|pozitif)/i.test(son.proteinuri) && g.hafta >= 20) u.push({ seviye: 'dikkat', metin: 'Proteinüri pozitif — preeklampsi taraması.' })
    if (son.fetalKalpAtimi != null && g.hafta >= 12 && (son.fetalKalpAtimi < 110 || son.fetalKalpAtimi > 160)) u.push({ seviye: 'dikkat', metin: `Fetal kalp atımı ${son.fetalKalpAtimi}/dk — normal aralık 110-160.` })
  }
  if (g.hafta >= 24 && g.hafta <= 28) u.push({ seviye: 'bilgi', metin: '24-28. hafta: glukoz tarama testi (GDM) zamanı.' })
  if (g.hafta >= 11 && g.hafta <= 14) u.push({ seviye: 'bilgi', metin: '11-14. hafta: ense saydamlığı USG penceresi.' })
  if (g.hafta >= 18 && g.hafta <= 22) u.push({ seviye: 'bilgi', metin: '18-22. hafta: ayrıntılı (anomali) USG penceresi.' })
  if (rhNegatif && g.hafta >= 28 && g.hafta <= 30) u.push({ seviye: 'dikkat', metin: 'Rh negatif — 28. hafta anti-D immünglobulin değerlendirmesi.' })
  if (g.hafta >= 41) u.push({ seviye: 'dikkat', metin: '41+ hafta — postterm izlem/doğum indüksiyonu değerlendirmesi.' })
  const gecikmis = izlemDurumlari(g.hafta, izlemler.map((i) => i.hafta)).filter((p) => p.durum === 'gecikmis')
  for (const p of gecikmis) u.push({ seviye: 'dikkat', metin: `${p.etiket} (${p.haftaBas}-${p.haftaSon}. hafta) kaydı yok.` })
  return u
}

export function gebelikOzetSatiri(g: GebelikYasi, tdtIso: string): string {
  const tdt = new Date(tdtIso).toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' })
  return `Gebelik takibi: ${g.metin} (${g.trimester}. trimester), tahmini doğum tarihi ${tdt}.`
}
