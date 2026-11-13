/**
 * PREMATURE-MODUL — Prematüre takip planı üreticisi. Saf, ülkeden bağımsız: eşikler ve kaynaklar protokol tablosundan gelir.
 *
 * Çıktı hekimin ONAYLADIĞI bir kontrol listesidir; hiçbir şey otomatik istenmez / sipariş edilmez. Motor doz önermez, tanı
 * koymaz. Her kriter "karşılandı / karşılanmadı / belirsiz (veri eksik)" olarak gösterilir; her öğe kaynağını taşır.
 *
 * Gürültü kuralları (ürün kararı, klinik eşik DEĞİL — protokol.urun içinde): bitiş tarihi tanımsız zamanlamalarda gecikme
 * toleransı; yaklaşan = 30 gün; bitişi 180 günden eski ve kaydı olmayan öğe "gecikti" değil "kayıt eksik — teyit edin" görünür
 * (yoğun bakımda yapılmış tetkikler çoğu zaman bu sistemde kayıtlı değildir).
 */
import { ayEkle, gunEkle, gunFarki } from '@/specialties/pediatri/engines/girdi'
import { PREMATUR_ESIK_GUN } from './duzeltilmisYas'
import { duzeltilmisYas, type DuzeltilmisYas } from './duzeltilmisYas'
import type { GirdiAlani, Kaynak, Kriter, KriterKosulu, PrematurKural, PrematurProfil, PrematurProtokol, ZamanNoktasi, Zamanlama } from './protokol'

export type KriterDurumu = 'karsilandi' | 'karsilanmadi' | 'belirsiz'

export interface KriterSonucu {
  durum: KriterDurumu
  /** Karşılanan / karşılanmayan / eksik koşulların ekran metni. */
  gerekce: string[]
}

export type HekimDurumu = 'plana_alindi' | 'yapildi' | 'uygulanmaz'
export interface OgeKaydi { durum: HekimDurumu; tarih?: string | null; not?: string | null }

export type OgeGorunum =
  | 'gecikti' | 'zamani-geldi' | 'yaklasiyor' | 'planli' | 'kayit-eksik'
  | 'yapildi' | 'uygulanmaz' | 'kriter-disi' | 'bilgi' | 'veri-eksik'

export interface TakipOgesi {
  id: string
  kuralKod: string
  zamanlamaKod: string
  kategori: PrematurKural['kategori']
  baslik: string
  etiket: string
  kriter: KriterSonucu
  bas: string | null
  son: string | null
  hedef: string | null
  durum: OgeGorunum
  hekim: OgeKaydi | null
  /** Mevcut Notya kaydından (ör. ROP taraması) otomatik kapanma tarihi. */
  otomatikKayit: string | null
  kaynaklar: Kaynak[]
  hekimNotu?: string
  not?: string
}

export interface PlanGirdisi {
  dogumIso: string
  bugunIso: string
  /** Doğumdaki gestasyon (gün); bilinmiyorsa null. */
  gestasyonGun: number | null
  dogumKiloGr: number | null
  profil: PrematurProfil
  /** kural kodu → mevcut kayıt tarihleri (ör. { rop: ['2026-01-10'] }). */
  mevcutKayitlar?: Record<string, string[]>
  /** öğe id → hekimin işareti. */
  durumlar?: Record<string, OgeKaydi>
}

export interface PlanOzeti { gecikti: number; zamaniGeldi: number; yaklasiyor: number; kayitEksik: number; veriEksik: number; yapildi: number; bilgi: number }

export interface TakipPlani {
  /** Kapsamda mı (GA < 37 hf ya da ≤ 1500 g)? */
  kapsamda: boolean
  kapsamNedeni: string
  yas: DuzeltilmisYas
  ogeler: TakipOgesi[]
  ozet: PlanOzeti
  eksikVeri: string[]
}

/* ───────────────────────────── kriter değerlendirme ───────────────────────────── */

type Deger = number | boolean | null

export function alanDegeri(a: GirdiAlani, g: { gestasyonGun: number | null; dogumKiloGr: number | null; yasAy: number; profil: PrematurProfil }): Deger {
  switch (a) {
    case 'gestasyonHafta': return g.gestasyonGun == null ? null : Math.floor(g.gestasyonGun / 7)
    case 'dogumKiloGr': return g.dogumKiloGr
    case 'yasAy': return g.yasAy
    case 'nicuGun': return g.profil.nicuGun ?? null
    default: return (g.profil as Record<string, unknown>)[a] as boolean | null | undefined ?? null
  }
}

/** true / false / null (bilinmiyor). */
export function kosulDegerlendir(k: KriterKosulu, v: Deger): boolean | null {
  if (v === null) return null
  if (k.op === 'dogru') return v === true
  if (typeof v !== 'number' || k.deger === undefined) return null
  switch (k.op) {
    case '<': return v < k.deger
    case '<=': return v <= k.deger
    case '>': return v > k.deger
    case '>=': return v >= k.deger
  }
}

function kriterDegerlendir(kr: Kriter, deger: (a: GirdiAlani) => Deger): KriterSonucu {
  let anyUnknown = false
  const gerekceDogru: string[] = []
  const gerekceEksik: string[] = []
  const gerekceYanlis: string[] = []
  for (const grup of kr.herhangiBiri) {
    const sonuclar = grup.map((k) => ({ k, s: kosulDegerlendir(k, deger(k.alan)) }))
    if (sonuclar.every((x) => x.s === true)) gerekceDogru.push(grup.map((k) => k.etiket).join(' + '))
    else if (sonuclar.some((x) => x.s === false)) gerekceYanlis.push(grup.map((k) => k.etiket).join(' + '))
    else { anyUnknown = true; gerekceEksik.push(sonuclar.filter((x) => x.s === null).map((x) => x.k.etiket).join(', ')) }
  }
  if (gerekceDogru.length) return { durum: 'karsilandi', gerekce: gerekceDogru }
  if (anyUnknown) return { durum: 'belirsiz', gerekce: [...new Set(gerekceEksik)].map((e) => `bilinmiyor: ${e}`) }
  return { durum: 'karsilanmadi', gerekce: gerekceYanlis }
}

/* ───────────────────────────── zamanlama ───────────────────────────── */

function noktaTarihi(n: ZamanNoktasi, dogumIso: string, gestGun: number | null): string | null {
  switch (n.tur) {
    case 'dogumdan-gun': return gunEkle(dogumIso, n.gun)
    case 'dogumdan-hafta': return gunEkle(dogumIso, n.hafta * 7)
    case 'kronolojik-ay': return ayEkle(dogumIso, n.ay)
    case 'pma-hafta': return gestGun == null ? null : gunEkle(dogumIso, n.hafta * 7 - gestGun)
  }
}

function zamanlamaUygun(z: Zamanlama, deger: (a: GirdiAlani) => Deger): { uygun: boolean; not?: string } {
  if (!z.kosul?.length) return { uygun: true }
  const s = z.kosul.map((k) => kosulDegerlendir(k, deger(k.alan)))
  if (s.some((x) => x === false)) return { uygun: false }
  if (s.every((x) => x === true)) return { uygun: true }
  if (z.bilinmiyorsa === 'dahil') return { uygun: true, not: `${z.kosul.filter((_, i) => s[i] === null).map((k) => k.etiket).join(', ')} bilinmiyor — bu zamanlama varsayımla gösteriliyor` }
  return { uygun: false }
}

function gorunumHesapla(args: { bas: string | null; son: string | null; bugun: string; urun: PrematurProtokol['urun'] }): OgeGorunum {
  const { bas, son, bugun, urun } = args
  if (!bas && !son) return 'veri-eksik'
  const bitis = son ?? (bas ? gunEkle(bas, urun.gecikmeToleransGun) : null)
  if (bitis && bugun > bitis) return gunFarki(bitis, bugun) <= urun.gecikmeGorunurGun ? 'gecikti' : 'kayit-eksik'
  if (bas) {
    if (bugun >= bas) return 'zamani-geldi'
    return gunFarki(bugun, bas) <= urun.yaklasanGun ? 'yaklasiyor' : 'planli'
  }
  // yalnız son tarih ("… aya kadar"): sonuna yaklaşınca zamanı gelmiş sayılır
  return bitis && gunFarki(bugun, bitis) <= urun.yaklasanGun ? 'zamani-geldi' : 'planli'
}

/* ───────────────────────────── plan ───────────────────────────── */

export function planKapsami(gestGun: number | null, dogumKiloGr: number | null, protokol: PrematurProtokol): { kapsamda: boolean; neden: string } {
  const esikGun = protokol.kapsam.gestasyonHaftaKucuk * 7
  if (gestGun != null && gestGun < esikGun) return { kapsamda: true, neden: `Doğumda gestasyon < ${protokol.kapsam.gestasyonHaftaKucuk} hafta.` }
  if (dogumKiloGr != null && dogumKiloGr <= protokol.kapsam.dogumKiloGrEnFazla) return { kapsamda: true, neden: `Doğum ağırlığı ≤ ${protokol.kapsam.dogumKiloGrEnFazla} g.` }
  if (gestGun == null && dogumKiloGr == null) return { kapsamda: false, neden: 'Gestasyon haftası ve doğum ağırlığı kayıtlı değil — girildiğinde plan oluşur.' }
  return { kapsamda: false, neden: 'Prematüre / çok düşük doğum ağırlıklı bebek kriterini karşılamıyor.' }
}

export function takipPlani(g: PlanGirdisi, protokol: PrematurProtokol): TakipPlani {
  const yas = duzeltilmisYas({ dogumIso: g.dogumIso, gestasyonGun: g.gestasyonGun, tarihIso: g.bugunIso }, protokol.duzeltme)
  const { kapsamda, neden } = planKapsami(g.gestasyonGun, g.dogumKiloGr, protokol)
  const bos: PlanOzeti = { gecikti: 0, zamaniGeldi: 0, yaklasiyor: 0, kayitEksik: 0, veriEksik: 0, yapildi: 0, bilgi: 0 }
  const eksikVeri: string[] = []
  if (g.gestasyonGun == null) eksikVeri.push('Doğumdaki gestasyon haftası')
  if (g.dogumKiloGr == null) eksikVeri.push('Doğum ağırlığı')
  if (!kapsamda || !yas.gecerli && yas.durumKodu === 'tarih-gecersiz') return { kapsamda: false, kapsamNedeni: neden, yas, ogeler: [], ozet: bos, eksikVeri }
  if (protokol.urun.planUstAy && yas.kronolojikAy >= protokol.urun.planUstAy) return { kapsamda: false, kapsamNedeni: `Plan kronolojik ${protokol.urun.planUstAy}. aya kadar gösterilir.`, yas, ogeler: [], ozet: bos, eksikVeri }

  const deger = (a: GirdiAlani) => alanDegeri(a, { gestasyonGun: g.gestasyonGun, dogumKiloGr: g.dogumKiloGr, yasAy: yas.kronolojikAy, profil: g.profil })
  const ogeler: TakipOgesi[] = []

  for (const kural of protokol.kurallar) {
    const kriter = kriterDegerlendir(kural.kriter, deger)
    const kayitlar = (g.mevcutKayitlar?.[kural.kod] || []).filter((t) => t >= g.dogumIso.slice(0, 10)).sort()
    const temel = { kuralKod: kural.kod, kategori: kural.kategori, baslik: kural.baslik, kriter, kaynaklar: kural.kaynaklar, hekimNotu: kural.hekimNotu }

    if (!kural.zamanlamalar.length) {
      const id = `${kural.kod}:bilgi`
      const hekim = g.durumlar?.[id] || null
      ogeler.push({ ...temel, id, zamanlamaKod: 'bilgi', etiket: kural.aciklama, bas: null, son: null, hedef: null, otomatikKayit: null, hekim,
        durum: hekim?.durum === 'yapildi' ? 'yapildi' : hekim?.durum === 'uygulanmaz' ? 'uygulanmaz'
          : kriter.durum === 'karsilandi' ? 'bilgi' : kriter.durum === 'belirsiz' ? 'veri-eksik' : 'kriter-disi' })
      continue
    }

    kural.zamanlamalar.forEach((z, i) => {
      const u = zamanlamaUygun(z, deger)
      if (!u.uygun) return
      const bas = z.bas ? noktaTarihi(z.bas, g.dogumIso, g.gestasyonGun) : null
      const son = z.son ? noktaTarihi(z.son, g.dogumIso, g.gestasyonGun) : null
      const id = `${kural.kod}:${z.kod}`
      const hekim = g.durumlar?.[id] || null
      // Mevcut kayıt: pencereye (±15 / +30 gün) düşen kayıt; herhangiKayitKapatir → yalnız İLK zamanlamayı kapatır.
      let otomatik: string | null = null
      if (kayitlar.length) {
        if (kural.herhangiKayitKapatir) { if (i === 0 || !kural.zamanlamalar.slice(0, i).some((p) => zamanlamaUygun(p, deger).uygun)) otomatik = kayitlar[0] }
        else if (bas || son) {
          const lo = bas ? gunEkle(bas, -15) : '0000-01-01'
          const hi = son ? gunEkle(son, 30) : gunEkle(bas!, 30)
          otomatik = kayitlar.find((t) => t >= lo && t <= hi) || null
        }
      }
      let durum: OgeGorunum
      if (hekim?.durum === 'yapildi') durum = 'yapildi'
      else if (hekim?.durum === 'uygulanmaz') durum = 'uygulanmaz'
      else if (kriter.durum === 'karsilanmadi') durum = 'kriter-disi'
      else if (otomatik) durum = 'yapildi'
      else if (kriter.durum === 'belirsiz') durum = 'veri-eksik'
      else durum = gorunumHesapla({ bas, son, bugun: g.bugunIso, urun: protokol.urun })
      ogeler.push({ ...temel, id, zamanlamaKod: z.kod, etiket: z.etiket, bas, son, hedef: son ?? bas, durum, hekim, otomatikKayit: otomatik, not: u.not })
    })
  }

  const ozet = { ...bos }
  for (const o of ogeler) {
    if (o.kriter.durum !== 'karsilandi' && o.durum !== 'veri-eksik') continue
    if (o.durum === 'gecikti') ozet.gecikti++
    else if (o.durum === 'zamani-geldi') ozet.zamaniGeldi++
    else if (o.durum === 'yaklasiyor') ozet.yaklasiyor++
    else if (o.durum === 'kayit-eksik') ozet.kayitEksik++
    else if (o.durum === 'veri-eksik') ozet.veriEksik++
    else if (o.durum === 'yapildi') ozet.yapildi++
    else if (o.durum === 'bilgi') ozet.bilgi++
  }
  // öğe sırası: kriter karşılananlar önce, tarihe göre
  ogeler.sort((a, b) => Number(b.kriter.durum === 'karsilandi') - Number(a.kriter.durum === 'karsilandi') || String(a.hedef || '9999').localeCompare(String(b.hedef || '9999')))
  return { kapsamda: true, kapsamNedeni: neden, yas, ogeler, ozet, eksikVeri }
}

export const PREMATUR_ESIK = PREMATUR_ESIK_GUN
