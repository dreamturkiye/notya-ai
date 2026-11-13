/**
 * PREMATUR-ULKE-01 — THE FOLLOW-UP PLAN of a preterm baby. Pure, client-safe, country-neutral: every threshold, date rule
 * and source comes from the protocol the PACK states (./tipler.ts → PrematurProtokol). No sentence is written here: the
 * answer is keys, numbers and the pack's own words (Metin), and the screen composes the rest from the pack's catalogue.
 *
 * The output is a CHECKLIST THE DOCTOR CONFIRMS. Nothing is ordered, sent or scheduled; no dose, no diagnosis. Each
 * criterion is "met / not met / not known", and an item whose source the pack could not read is "follow your local protocol".
 *
 * NOISE RULES (product decisions, `protokol.urun`, not clinical thresholds): a window with no end tolerates a delay; "coming
 * up" is 30 days; an item older than 180 days with no mark reads "no record — confirm", not "overdue" (a test done in an
 * intensive-care unit is often not recorded here).
 *
 * Same logic as the Türkiye module's lib/clinical/prematur/takipPlani.ts (words aside; no screening-record table here, so
 * only the doctor's own mark closes an item) — held equal by the parity test (./prematur.test.ts).
 */
import { gunEkle, gunFarki, ayEkle } from './tarih'
import { duzeltilmisYas, type DuzeltilmisYas } from './yas'
import type { GirdiAlani, Kaynak, Kriter, KriterKosulu, Metin, OgeKaydi, PrematurKural, PrematurProfil, PrematurProtokol, ZamanNoktasi, Zamanlama } from './tipler'

export type KriterDurumu = 'karsilandi' | 'karsilanmadi' | 'belirsiz' | 'yerel'

export interface KriterSonucu {
  durum: KriterDurumu
  /** The pack's own condition labels: one group per row (the labels of a group are joined by "+" on the screen). 'karsilandi': the groups that held; 'karsilanmadi': the groups that failed; 'belirsiz': the conditions not known. */
  gerekce: Metin[][]
}

export type OgeGorunum =
  | 'gecikti' | 'zamani-geldi' | 'yaklasiyor' | 'planli' | 'kayit-eksik'
  | 'yapildi' | 'uygulanmaz' | 'kriter-disi' | 'bilgi' | 'veri-eksik' | 'yerel'

export interface TakipOgesi {
  id: string
  kuralKod: string
  zamanlamaKod: string
  kategori: PrematurKural['kategori']
  baslik: Metin
  etiket: Metin
  kriter: KriterSonucu
  bas: string | null
  son: string | null
  hedef: string | null
  durum: OgeGorunum
  hekim: OgeKaydi | null
  kaynaklar: Kaynak[]
  hekimNotu?: Metin
  /** The timing was produced on an assumption: the labels of the conditions that are not known. */
  varsayim?: Metin[]
}

export interface PlanGirdisi {
  dogumIso: string
  bugunIso: string
  /** Days of gestation at birth; null = not known. */
  gestasyonGun: number | null
  dogumKiloGr: number | null
  profil: PrematurProfil
  /** item id → the doctor's own mark. */
  durumlar?: Record<string, OgeKaydi>
}

export interface PlanOzeti { gecikti: number; zamaniGeldi: number; yaklasiyor: number; kayitEksik: number; veriEksik: number; yapildi: number; bilgi: number; yerel: number }

export type KapsamNedeni = 'gestasyon' | 'kilo' | 'bilinmiyor' | 'degil' | 'ust-ay' | 'tarih-gecersiz'
export type EksikVeri = 'gestasyon' | 'kilo'

export interface TakipPlani {
  /** In scope (born before the protocol's week, or light enough)? */
  kapsamda: boolean
  kapsamNedeni: KapsamNedeni
  yas: DuzeltilmisYas
  ogeler: TakipOgesi[]
  ozet: PlanOzeti
  eksikVeri: EksikVeri[]
}

/* ───────────────────────────── criteria ───────────────────────────── */

type Deger = number | boolean | null

export function alanDegeri(a: GirdiAlani, g: { gestasyonGun: number | null; dogumKiloGr: number | null; yasAy: number; profil: PrematurProfil }): Deger {
  switch (a) {
    case 'gestasyonHafta': return g.gestasyonGun == null ? null : Math.floor(g.gestasyonGun / 7)
    case 'dogumKiloGr': return g.dogumKiloGr
    case 'yasAy': return g.yasAy
    case 'nicuGun': return g.profil.nicuGun ?? null
    default: return ((g.profil as Record<string, unknown>)[a] as boolean | null | undefined) ?? null
  }
}

/** true / false / null (not known). */
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
  let belirsizVar = false
  const dogru: Metin[][] = [], eksik: Metin[][] = [], yanlis: Metin[][] = []
  for (const grup of kr.herhangiBiri) {
    const sonuclar = grup.map((k) => ({ k, s: kosulDegerlendir(k, deger(k.alan)) }))
    if (sonuclar.every((x) => x.s === true)) dogru.push(grup.map((k) => k.etiket))
    else if (sonuclar.some((x) => x.s === false)) yanlis.push(grup.map((k) => k.etiket))
    else { belirsizVar = true; eksik.push(sonuclar.filter((x) => x.s === null).map((x) => x.k.etiket)) }
  }
  if (dogru.length) return { durum: 'karsilandi', gerekce: dogru }
  if (belirsizVar) return { durum: 'belirsiz', gerekce: eksik }
  return { durum: 'karsilanmadi', gerekce: yanlis }
}

/* ───────────────────────────── timing ───────────────────────────── */

function noktaTarihi(n: ZamanNoktasi, dogumIso: string, gestGun: number | null): string | null {
  switch (n.tur) {
    case 'dogumdan-gun': return gunEkle(dogumIso, n.gun)
    case 'dogumdan-hafta': return gunEkle(dogumIso, n.hafta * 7)
    case 'kronolojik-ay': return ayEkle(dogumIso, n.ay)
    case 'pma-hafta': return gestGun == null ? null : gunEkle(dogumIso, n.hafta * 7 - gestGun)
  }
}

function zamanlamaUygun(z: Zamanlama, deger: (a: GirdiAlani) => Deger): { uygun: boolean; varsayim?: Metin[] } {
  if (!z.kosul?.length) return { uygun: true }
  const s = z.kosul.map((k) => kosulDegerlendir(k, deger(k.alan)))
  if (s.some((x) => x === false)) return { uygun: false }
  if (s.every((x) => x === true)) return { uygun: true }
  if (z.bilinmiyorsa === 'dahil') return { uygun: true, varsayim: z.kosul.filter((_, i) => s[i] === null).map((k) => k.etiket) }
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
  // only an end day ("by 9 months"): it is due once the end is near
  return bitis && gunFarki(bugun, bitis) <= urun.yaklasanGun ? 'zamani-geldi' : 'planli'
}

/* ───────────────────────────── the plan ───────────────────────────── */

export function planKapsami(gestGun: number | null, dogumKiloGr: number | null, protokol: PrematurProtokol): { kapsamda: boolean; neden: KapsamNedeni } {
  const esikGun = protokol.kapsam.gestasyonHaftaKucuk * 7
  if (gestGun != null && gestGun < esikGun) return { kapsamda: true, neden: 'gestasyon' }
  if (dogumKiloGr != null && dogumKiloGr <= protokol.kapsam.dogumKiloGrEnFazla) return { kapsamda: true, neden: 'kilo' }
  if (gestGun == null && dogumKiloGr == null) return { kapsamda: false, neden: 'bilinmiyor' }
  return { kapsamda: false, neden: 'degil' }
}

export function takipPlani(g: PlanGirdisi, protokol: PrematurProtokol): TakipPlani {
  const yas = duzeltilmisYas({ dogumIso: g.dogumIso, gestasyonGun: g.gestasyonGun, tarihIso: g.bugunIso }, protokol.duzeltme)
  const { kapsamda, neden } = planKapsami(g.gestasyonGun, g.dogumKiloGr, protokol)
  const bos: PlanOzeti = { gecikti: 0, zamaniGeldi: 0, yaklasiyor: 0, kayitEksik: 0, veriEksik: 0, yapildi: 0, bilgi: 0, yerel: 0 }
  const eksikVeri: EksikVeri[] = []
  if (g.gestasyonGun == null) eksikVeri.push('gestasyon')
  if (g.dogumKiloGr == null) eksikVeri.push('kilo')
  if (yas.durumKodu === 'tarih-gecersiz') return { kapsamda: false, kapsamNedeni: 'tarih-gecersiz', yas, ogeler: [], ozet: bos, eksikVeri }
  if (!kapsamda) return { kapsamda: false, kapsamNedeni: neden, yas, ogeler: [], ozet: bos, eksikVeri }
  if (protokol.urun.planUstAy && yas.kronolojikAy >= protokol.urun.planUstAy) return { kapsamda: false, kapsamNedeni: 'ust-ay', yas, ogeler: [], ozet: bos, eksikVeri }

  const deger = (a: GirdiAlani) => alanDegeri(a, { gestasyonGun: g.gestasyonGun, dogumKiloGr: g.dogumKiloGr, yasAy: yas.kronolojikAy, profil: g.profil })
  const ogeler: TakipOgesi[] = []

  for (const kural of protokol.kurallar) {
    const temel = { kuralKod: kural.kod, kategori: kural.kategori, baslik: kural.baslik, kaynaklar: kural.kaynaklar, hekimNotu: kural.hekimNotu }

    // FOLLOW YOUR LOCAL PROTOCOL: no criterion, no date — only the doctor's own confirmation.
    if (kural.yerel) {
      const id = `${kural.kod}:yerel`
      const hekim = g.durumlar?.[id] || null
      ogeler.push({ ...temel, id, zamanlamaKod: 'yerel', etiket: kural.aciklama, kriter: { durum: 'yerel', gerekce: [] }, bas: null, son: null, hedef: null, hekim,
        durum: hekim?.durum === 'yapildi' ? 'yapildi' : hekim?.durum === 'uygulanmaz' ? 'uygulanmaz' : 'yerel' })
      continue
    }
    const kriter = kural.kriter ? kriterDegerlendir(kural.kriter, deger) : ({ durum: 'belirsiz', gerekce: [] } as KriterSonucu)

    if (!kural.zamanlamalar.length) {
      const id = `${kural.kod}:bilgi`
      const hekim = g.durumlar?.[id] || null
      ogeler.push({ ...temel, id, zamanlamaKod: 'bilgi', etiket: kural.aciklama, kriter, bas: null, son: null, hedef: null, hekim,
        durum: hekim?.durum === 'yapildi' ? 'yapildi' : hekim?.durum === 'uygulanmaz' ? 'uygulanmaz'
          : kriter.durum === 'karsilandi' ? 'bilgi' : kriter.durum === 'belirsiz' ? 'veri-eksik' : 'kriter-disi' })
      continue
    }

    for (const z of kural.zamanlamalar) {
      const u = zamanlamaUygun(z, deger)
      if (!u.uygun) continue
      const bas = z.bas ? noktaTarihi(z.bas, g.dogumIso, g.gestasyonGun) : null
      const son = z.son ? noktaTarihi(z.son, g.dogumIso, g.gestasyonGun) : null
      const id = `${kural.kod}:${z.kod}`
      const hekim = g.durumlar?.[id] || null
      let durum: OgeGorunum
      if (hekim?.durum === 'yapildi') durum = 'yapildi'
      else if (hekim?.durum === 'uygulanmaz') durum = 'uygulanmaz'
      else if (kriter.durum === 'karsilanmadi') durum = 'kriter-disi'
      else if (kriter.durum === 'belirsiz') durum = 'veri-eksik'
      else durum = gorunumHesapla({ bas, son, bugun: g.bugunIso, urun: protokol.urun })
      ogeler.push({ ...temel, id, zamanlamaKod: z.kod, etiket: z.etiket, kriter, bas, son, hedef: son ?? bas, durum, hekim, ...(u.varsayim ? { varsayim: u.varsayim } : {}) })
    }
  }

  const ozet = { ...bos }
  for (const o of ogeler) {
    if (o.durum === 'yerel') { ozet.yerel++; continue }
    if (o.kriter.durum !== 'karsilandi' && o.durum !== 'veri-eksik') continue
    if (o.durum === 'gecikti') ozet.gecikti++
    else if (o.durum === 'zamani-geldi') ozet.zamaniGeldi++
    else if (o.durum === 'yaklasiyor') ozet.yaklasiyor++
    else if (o.durum === 'kayit-eksik') ozet.kayitEksik++
    else if (o.durum === 'veri-eksik') ozet.veriEksik++
    else if (o.durum === 'yapildi') ozet.yapildi++
    else if (o.durum === 'bilgi') ozet.bilgi++
  }
  // order: criteria met first, then local-protocol items, by date
  const sira = (o: TakipOgesi) => (o.kriter.durum === 'karsilandi' ? 0 : o.kriter.durum === 'yerel' ? 1 : 2)
  ogeler.sort((a, b) => sira(a) - sira(b) || String(a.hedef || '9999').localeCompare(String(b.hedef || '9999')))
  return { kapsamda: true, kapsamNedeni: neden, yas, ogeler, ozet, eksikVeri }
}

/* ───────────────────────────── the doctor's profile → the plan's input ───────────────────────────── */

/** The history a doctor entered → the plan's input: gestation in days (week + days), weight, the flags. */
export function planGirdisiProfilden(p: PrematurProfil): { gestasyonGun: number | null; dogumKiloGr: number | null } {
  const hafta = p.gestasyonHafta ?? null
  const gun = hafta == null ? null : hafta * 7 + (p.gestasyonGunKalan ?? 0)
  return { gestasyonGun: gun, dogumKiloGr: p.dogumKiloGr ?? null }
}

/** The plan for a baby whose history the doctor entered. */
export function profildenPlan(v: { dogumIso: string; profil: PrematurProfil; durumlar: Record<string, OgeKaydi> }, bugunIso: string, protokol: PrematurProtokol): TakipPlani {
  const { gestasyonGun, dogumKiloGr } = planGirdisiProfilden(v.profil)
  return takipPlani({ dogumIso: v.dogumIso, bugunIso, gestasyonGun, dogumKiloGr, profil: v.profil, durumlar: v.durumlar }, protokol)
}

/** The most urgent open item whose criterion is met (overdue > due > coming up > no record), for the cohort list. */
const ACILIYET: Record<string, number> = { gecikti: 0, 'zamani-geldi': 1, yaklasiyor: 2, 'kayit-eksik': 3 }
export function siradakiOge(plan: TakipPlani): TakipOgesi | null {
  const adaylar = plan.ogeler.filter((o) => o.kriter.durum === 'karsilandi' && o.durum in ACILIYET)
  adaylar.sort((a, b) => ACILIYET[a.durum] - ACILIYET[b.durum] || String(a.hedef || '9999').localeCompare(String(b.hedef || '9999')))
  return adaylar[0] || null
}

/** Rule titles by code: for the cohort row. */
export const kuralBasligi = (protokol: PrematurProtokol, kod: string): Metin | null => protokol.kurallar.find((k) => k.kod === kod)?.baslik ?? null

/** Every item id a table can produce: the only ids a mark may be kept for. */
export function izinliOgeKimlikleri(protokol: PrematurProtokol): ReadonlySet<string> {
  const s = new Set<string>()
  for (const k of protokol.kurallar) {
    if (k.yerel) { s.add(`${k.kod}:yerel`); continue }
    if (!k.zamanlamalar.length) s.add(`${k.kod}:bilgi`)
    for (const z of k.zamanlamalar) s.add(`${k.kod}:${z.kod}`)
  }
  return s
}
