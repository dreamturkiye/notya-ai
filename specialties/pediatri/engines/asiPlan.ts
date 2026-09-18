/**
 * PEDI-ARACLAR-02 — Araçlar › Aşı takvimi & telafi planlayıcı. Pure.
 *
 * Takvim kopyalanmaz, BAĞLANIR: doz listesi ve önerilen yaşlar lib/asi/ulusalAsiTakvimi.ts (SB GBP — 6'lı karma
 * dönemi) ve 2025 öncesi doğanlar için lib/clinical/yenidogan/constants.ts ASI_V1 (5'li karma + Hep B 0-1-6) kod
 * listesinden türetilir. Bu dosya yalnız telafi (catch-up) matematiğini ve seri eşleştirmesini ekler.
 *
 * Telafi ilkesi — GBP Genelgesi 2009/17: "önceki aşı dozlarının tekrar yapılmasına gerek yoktur… aşılamaya bırakılan
 * yerden devam edilir." Kalan her doz için en erken tarih = max(önerilen yaş, minimum yaş, önceki doz + minimum aralık,
 * 1. doz + gereken aralık). Önceki doz yapılmamışsa onun PLANLANAN tarihi esas alınır — zincir bugünden ileri yeniden
 * hesaplanır. Aynı genelge: minimum aralıktan önce yapılan doz geçersizdir ve tekrarlanır (yalnız o doz — seri değil).
 *
 * Prematüre (TND 2026 prematüre aşılama kitapçığı, SB takvimine atıfla): aşılar TAKVİM yaşına göre, tam dozda.
 * İstisnalar: Hep B < 2000 g (doğum dozu sayılmaz; 1. ayda tekli doz) ve BCG < 34 hafta (postkonsepsiyonel ≥ 34 hafta,
 * takvim yaşı ≥ 2 ay ve ≥ 2000 g).
 *
 * Kaynak doğrulaması sınırlı olan her kural `dogrulandi: false` taşır; arayüz bunu "öneri — hekim kilitler" rozetiyle
 * gösterir ve hekim ön ayarı değiştirebilir (AsiOnAyar). Hiçbir doz otomatik "yapıldı" sayılmaz: yalnız asilar kaydı
 * (klinik / beyan) veya hekimin bu ekranda işaretlediği doz yapılmış kabul edilir.
 */
import { ULUSAL_TAKVIM, OZEL_ASILAR, TAKVIM_SURUM } from '@/lib/asi/ulusalAsiTakvimi'
import { ASI_V1 } from '@/lib/clinical/yenidogan/constants'
import { ayEkle, gunEkle, gunFarki, tarihGoster } from './girdi'

export type SeriKod = 'hepb' | 'bcg' | 'karma' | 'kpa' | 'opa' | 'kkk' | 'vzv' | 'hepa' | 'td'
export type OzelKod = 'rota' | 'menacwy' | 'menb' | 'grip' | 'hpv'
/** 'altili' = 2025 GBP (6'lı karma, doğumda Hep B); 'besli' = önceki düzen (5'li karma + Hep B 0-1-6). */
export type TakvimDonemi = 'altili' | 'besli'

export const SERI_AD: Record<SeriKod, string> = {
  hepb: 'Hepatit B', bcg: 'BCG (verem)', karma: 'Karma aşı (DaBT-İPA-Hib…)', kpa: 'KPA (konjuge pnömokok)', opa: 'OPA (oral polio)',
  kkk: 'KKK (kızamık-kızamıkçık-kabakulak)', vzv: 'Suçiçeği', hepa: 'Hepatit A', td: 'Td (erişkin tip tetanoz-difteri)',
}
export const SERI_SIRA: SeriKod[] = ['hepb', 'bcg', 'karma', 'kpa', 'opa', 'kkk', 'vzv', 'hepa', 'td']

export const DONEM_AD: Record<TakvimDonemi, string> = {
  altili: "6'lı karma (2025 GBP)",
  besli: "5'li karma + ayrı Hep B (önceki takvim)",
}

// ─── Hekim-düzenlenebilir ön ayarlar (minimum yaş / aralık) ────────────────────────────────────
export interface SeriKurali {
  /** Doz no (1'den) → o doz için minimum yaş (gün). */
  minYasGun: Record<number, number>
  /** Doz no (2'den) → önceki dozdan minimum aralık (gün). */
  minAralikGun: Record<number, number>
  /** Doz no → 1. dozdan minimum aralık (gün) — Hep B 3. doz ≥ 16 hafta. */
  birinciDozdanGun?: Record<number, number>
  /** Kaynak notu — ekranda gösterilir. */
  kaynak: string
  /** false → "öneri — hekim kilitler" (Türkçe resmi metinde birebir doğrulanamadı; ledger'da OPEN). */
  dogrulandi: boolean
  /** Doğrulanmış seride bile resmi metinde bulunamayan değerler — ekranda ayrıca "öneri" diye söylenir. */
  dogrulanmayan?: string
}

/**
 * Minimum yaş ve aralıklar. Aralıklar GBP Genelgesi 2009/17'den (dosyamerkez.saglik.gov.tr — genelge metni);
 * genelgede bulunmayanlar (KPA/Hep A/OPA/suçiçeği ayrıntıları, bazı minimum yaşlar) "öneri — hekim kilitler".
 * Hekim AsiOnAyar ile değiştirir (tarayıcıda saklanır).
 */
export const VARSAYILAN_KURALLAR: Record<SeriKod, SeriKurali> = {
  hepb: { minYasGun: { 1: 0 }, minAralikGun: { 2: 28, 3: 56, 4: 56 }, birinciDozdanGun: { 3: 112 }, kaynak: 'GBP Genelgesi: 1→2 ≥ 4 hafta, 2→3 ≥ 8 hafta, 3. doz 1. dozdan ≥ 16 hafta sonra', dogrulandi: true },
  bcg: { minYasGun: { 1: 0 }, minAralikGun: {}, kaynak: 'GBP Genelgesi: 3 aydan büyükte PPD/TCT sonucuna göre; aşısız 6 yaş üstünde gerekmez; kızamık içeren aşıdan sonra 4 hafta. Prematüre < 34 hafta: TND 2026', dogrulandi: true },
  karma: { minYasGun: { 1: 42, 4: 365, 5: 1461 }, minAralikGun: { 2: 28, 3: 28, 4: 182, 5: 182 }, kaynak: 'GBP Genelgesi: 1→2 ve 2→3 ≥ 4 hafta, 3. dozdan rapele ≥ 6 ay; DaBT-İPA-Hib 72 aydan sonra uygulanmaz', dogrulandi: true, dogrulanmayan: 'minimum yaşlar (1. doz 6. hafta, rapel 12. ay, okul öncesi rapel 4 yaş) ve rapel → okul öncesi rapel aralığı' },
  kpa: { minYasGun: { 1: 42, 3: 365 }, minAralikGun: { 2: 28, 3: 120 }, kaynak: 'GBP Genelgesi: 12 ay altında dozlar arası ≥ 4 hafta; rapel son dozdan ≥ 4 ay sonra ve 12. aydan önce değil', dogrulandi: true, dogrulanmayan: '1. doz minimum yaşı (6. hafta) ve geç başlayan çocukta doz azaltma' },
  opa: { minYasGun: { 1: 42 }, minAralikGun: { 2: 28 }, kaynak: 'OPA dozlar arası ≥ 4 hafta; canlı enjeksiyon aşılarıyla ara gerekmez (GBP)', dogrulandi: false },
  kkk: { minYasGun: { 1: 365 }, minAralikGun: { 2: 28 }, kaynak: 'GBP Genelgesi: kızamık içeren aşılar arası ≥ 4 hafta; enjeksiyonla yapılan canlı aşılar aynı gün ya da ≥ 4 hafta arayla', dogrulandi: true },
  vzv: { minYasGun: { 1: 365 }, minAralikGun: { 2: 90 }, kaynak: 'Suçiçeği: ≥ 12. ay; canlı aşı kuralı (GBP). 2. doz aralığı resmi metinde bulunamadı', dogrulandi: false },
  hepa: { minYasGun: { 1: 365 }, minAralikGun: { 2: 180 }, kaynak: 'Hep A: ≥ 12. ay, iki doz arası ≥ 6 ay (resmi metinde bulunamadı)', dogrulandi: false },
  td: { minYasGun: { 1: 2191 }, minAralikGun: {}, kaynak: 'Td: GBP ≥ 72 ay şemasında Td kullanılır; rutin doz 13 yaş (aile hekimliği)', dogrulandi: true },
}

/** "Zamanı geldi" → "gecikti" eşiği: önerilen tarihten sonra bu kadar gün (ürün kararı, klinik aralık değil). */
export const GECIKME_ESIGI_GUN = 30
/** "Yaklaşıyor" penceresi. */
export const YAKLASAN_GUN = 30
/** Enjeksiyonla yapılan canlı aşılar aynı gün yapılmadıysa aralarında ≥ 4 hafta; BCG kızamık içeren aşıdan 4 hafta sonra (GBP). */
export const CANLI_ARA_GUN = 28
const CANLI_PARENTERAL: SeriKod[] = ['kkk', 'vzv', 'bcg']
/** GBP: DaBT-İPA-Hib 72 aydan (6 yaş) sonra uygulanmaz; aşısız 6 yaş üstünde BCG gerekmez. */
export const KARMA_UST_GUN = 2191
export const BCG_PPD_GUN = 91

// ─── Takvim → doz tanımları (ulusalAsiTakvimi'nden türetilir) ──────────────────────────────────
export interface DozTanim {
  seri: SeriKod
  no: number
  /** "2. doz" · "Rapel" … (takvimdeki etiket) */
  etiket: string
  /** Takvimdeki ürün adı — kayda bu adla yazılır. */
  urun: string
  /** Takvim sütunu: "2. ayın sonu" … */
  donemEtiket: string
  /** Önerilen yaş: ay (takvim ayı) veya gün. */
  onerilenAy: number
  onerilenGun?: number
  not?: string
}

/** ulusalAsiTakvimi `ad` → seri. Takvime yeni satır eklenirse ve eşleşmezse test kırılır (asiPlan.test.ts). */
export function takvimAdiSeri(ad: string): SeriKod | null {
  const s = normalAd(ad)
  if (/karma|dabt/.test(s)) return 'karma'
  if (/^td\b|tetanoz-difteri/.test(s)) return 'td'
  if (/hepatit b/.test(s)) return 'hepb'
  if (/hepatit a/.test(s)) return 'hepa'
  if (/bcg/.test(s)) return 'bcg'
  if (/kpa|pnomokok/.test(s)) return 'kpa'
  if (/opa|polio/.test(s)) return 'opa'
  if (/kkk|kizamik/.test(s)) return 'kkk'
  if (/sucicegi|varisella/.test(s)) return 'vzv'
  return null
}

function normalAd(ad: string): string {
  return ad.toLocaleLowerCase('tr-TR')
    .replace(/[’'`´]/g, '')
    .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/İ/g, 'i')
}

/** 2025 GBP dizisi — ULUSAL_TAKVIM'den (siraAy = önerilen ay). */
function altiliDozlar(): DozTanim[] {
  const sayac: Partial<Record<SeriKod, number>> = {}
  const out: DozTanim[] = []
  for (const d of ULUSAL_TAKVIM) {
    for (const a of d.asilar) {
      const seri = takvimAdiSeri(a.ad)
      if (!seri) continue
      const no = (sayac[seri] = (sayac[seri] || 0) + 1)
      out.push({ seri, no, etiket: a.dozEtiket || `${no}. doz`, urun: a.ad, donemEtiket: d.donem, onerilenAy: d.siraAy, not: a.not })
    }
  }
  return out
}

/** Önceki düzen: Hep B 0-1-6 (ASI_V1 gün değerleri) + 5'li karma; diğer tüm satırlar aynı takvimden. */
function besliDozlar(): DozTanim[] {
  const hepbV1 = ASI_V1.filter((a) => a.kod.startsWith('HEPB'))
  const hepb: DozTanim[] = hepbV1.map((a, i) => ({
    seri: 'hepb', no: i + 1, etiket: `${i + 1}. doz`, urun: 'Hepatit B', onerilenAy: Math.round(a.gun / 30), onerilenGun: a.gun,
    donemEtiket: a.gun === 0 ? 'Doğumda' : a.gun <= 31 ? '1. ayın sonu' : '6. ayın sonu',
  }))
  const digerleri = altiliDozlar().filter((d) => d.seri !== 'hepb').map((d) => (
    d.seri === 'karma' && d.no <= 4 ? { ...d, urun: "5'li Karma (DaBT-İPA-Hib)" } : d
  ))
  return [...hepb, ...digerleri]
}

export interface PlanGirdisi {
  dogumIso: string
  bugunIso: string
  donem: TakvimDonemi
  /** Doğum ağırlığı (g) — < 2000 g Hep B istisnası. */
  dogumKiloGr?: number | null
  gebelikHaftasi?: number | null
  /** Anne HBsAg: 'bilinmiyor' pozitif gibi ele alınır (HBIG + doğum dozu). */
  anneHbsag?: 'negatif' | 'pozitif' | 'bilinmiyor'
  kurallar?: Partial<Record<SeriKod, SeriKurali>>
  /** GBP: minimum aralık/yaştan önce yapılan doz geçersiz sayılır ve tekrarlanır (varsayılan açık). */
  kisaAralikGecersiz?: boolean
  /** Yapılmış dozlar (kayıt / beyan / bu ekranda işaretlenen). */
  kayitlar: AsiKaydi[]
}

export interface AsiKaydi {
  id: string
  ad: string
  dozNo?: number | null
  /** ISO; beyan edilip tarihi bilinmiyorsa null. */
  tarih: string | null
  kaynak: 'kayit' | 'beyan' | 'ekran'
}

export function takvimDozlari(g: Pick<PlanGirdisi, 'donem' | 'dogumKiloGr' | 'anneHbsag'>): DozTanim[] {
  let dozlar = g.donem === 'besli' ? besliDozlar() : altiliDozlar()
  const dusuk = g.dogumKiloGr != null && g.dogumKiloGr < 2000
  if (!dusuk) return dozlar
  const anneNeg = g.anneHbsag === 'negatif'
  const dogumDozu = dozlar.find((d) => d.seri === 'hepb' && d.onerilenAy === 0 && !d.onerilenGun)
    || dozlar.find((d) => d.seri === 'hepb' && d.onerilenGun === 0)
  let hepb = dozlar.filter((d) => d.seri === 'hepb')
  // TND 2026: < 2000 g — anne HBsAg(+)/bilinmiyor: doğumda aşı + HBIG (seriye sayılmaz), 1. ayda tekli; HBsAg(−): doğum dozu yok, 1. ayda (ya da 2000 g'da).
  if (dogumDozu) {
    if (anneNeg) hepb = hepb.filter((d) => d !== dogumDozu)
    else { dogumDozu.etiket = 'Doğum dozu (seriye sayılmaz)'; dogumDozu.not = 'Anne HBsAg(+) / bilinmiyor: ilk 12 saatte aşı + HBIG. < 2000 g — bu doz seriye sayılmaz (TND 2026).' }
  }
  const ek: DozTanim = { seri: 'hepb', no: 0, etiket: 'Tekli doz (< 2000 g)', urun: 'Hepatit B', onerilenAy: 1, donemEtiket: '1. ayın sonu', not: anneNeg ? 'Anne HBsAg(−), < 2000 g: ilk doz 1. ayda ya da 2000 g\'a ulaşınca (hangisi önceyse) — TND 2026.' : '< 2000 g: 1. ayda tekli Hep B, sonra karma dozlar (TND 2026).' }
  if (g.donem === 'altili') hepb = [...hepb, ek]
  else if (!hepb.some((d) => d.onerilenGun === 60)) hepb = [...hepb, { ...ek, etiket: 'Ek doz (< 2000 g)', onerilenAy: 2, onerilenGun: 60, donemEtiket: '2. ayın sonu', not: '< 2000 g, önceki düzen: 0-1-2-6. ay (GBP Genelgesi 4 doz şeması).' }]
  hepb.sort((a, b) => onerilenGunSayisi(a) - onerilenGunSayisi(b))
  hepb.forEach((d, i) => { d.no = i + 1; if (!/seriye|tekli|ek doz/i.test(d.etiket)) d.etiket = `${i + 1}. doz` })
  dozlar = [...dozlar.filter((d) => d.seri !== 'hepb'), ...hepb]
  return dozlar
}

const onerilenGunSayisi = (d: DozTanim) => d.onerilenGun ?? Math.round(d.onerilenAy * 30.4375)
const onerilenTarih = (dogumIso: string, d: DozTanim) => (d.onerilenGun != null ? gunEkle(dogumIso, d.onerilenGun) : ayEkle(dogumIso, d.onerilenAy))

// ─── Kayıt → seri eşleştirmesi (asilar.asi_adi serbest metin) ───────────────────────────────────
/** Serbest aşı adını seriye çevirir. Karma aileleri (6'lı / 5'li / 4'lü / DaBT) tek seride toplanır. */
export function kayitSerisi(ad: string): SeriKod | OzelKod | null {
  const s = normalAd(ad)
  if (/\btd\b|tetanoz[- ]?difteri|eriskin tip/.test(s)) return 'td'
  if (/6.?li|5.?li|4.?lu|hexa|heksa|penta|dabt|dtap|dtab|bogmaca|karma/.test(s)) return 'karma'
  if (/rota/.test(s)) return 'rota'
  if (/men(ingokok)?\s*-?\s*b\b|bexsero|trumenba/.test(s)) return 'menb'
  if (/acwy|menactra|menveo|nimenrix|meningokok|menenjit/.test(s)) return 'menacwy'
  if (/grip|influenza|vaxigrip|influvac/.test(s)) return 'grip'
  if (/hpv|gardasil|cervarix|papilloma/.test(s)) return 'hpv'
  if (/hepatit\s*b|hep\.?\s*b\b|\bhbv\b/.test(s)) return 'hepb'
  if (/hepatit\s*a|hep\.?\s*a\b|\bhav\b/.test(s)) return 'hepa'
  if (/bcg|verem/.test(s)) return 'bcg'
  if (/\bkpa\b|pnomokok|prevenar|pcv|synflorix|vaxneuvance/.test(s)) return 'kpa'
  if (/\bopa\b|oral polio|polio/.test(s)) return 'opa'
  if (/\bkkk\b|kizamik|\bmmr\b|kabakulak|priorix/.test(s)) return 'kkk'
  if (/sucicegi|varisel|varicella|\bvzv\b|varilrix|varivax/.test(s)) return 'vzv'
  return null
}

// ─── Plan ───────────────────────────────────────────────────────────────────────────────────────
export type DozDurum = 'yapildi' | 'bugun' | 'zamani_geldi' | 'gecikti' | 'yaklasiyor' | 'bekliyor' | 'yas_disi'

export interface PlanDozu extends DozTanim {
  durum: DozDurum
  onerilen: string
  /** Yapılmadıysa: telafi dahil planlanan en erken tarih. */
  plan: string | null
  /** Planlanan tarih önerilenden sonraya kaydıysa (telafi). */
  telafi: boolean
  kayit: AsiKaydi | null
  uyarilar: string[]
  /** Yapılmadıysa önerilen tarihten bu yana geçen gün (≤ 0 → henüz zamanı değil). */
  gecikmeGun: number
  /** Minimum yaş/aralıktan önce yapıldığı için sayılmayan kayıtlar (GBP). */
  gecersizler: AsiKaydi[]
}

export interface SeriPlani {
  seri: SeriKod
  ad: string
  dozlar: PlanDozu[]
  /** Yaşa bağlı öneriler — "öneri — hekim kilitler" */
  oneriler: string[]
  kural: SeriKurali
  tamam: boolean
}

export interface AsiPlani {
  seriler: SeriPlani[]
  bugunYapilabilir: PlanDozu[]
  gecikmis: PlanDozu[]
  sonrakiZiyaret: { tarih: string; dozlar: PlanDozu[] } | null
  eslesmeyen: AsiKaydi[]
  fazla: AsiKaydi[]
  ozel: OzelPlan[]
  surum: string
  notlar: string[]
  /** Kayıtta hiç ulusal takvim dozu yoksa ve ≥ 12 ay: genelge tablosu. */
  hicAsisiz: HicAsisizSema | null
}

/** Hepsinde doz no varsa ona göre; yoksa tarihsiz beyanlar başa (genelde eski dozlar), tarihliler kronolojik. */
function kayitSirala(k: AsiKaydi[]): AsiKaydi[] {
  if (k.length && k.every((x) => x.dozNo != null)) return [...k].sort((a, b) => a.dozNo! - b.dozNo! || String(a.tarih).localeCompare(String(b.tarih)))
  return [...k].sort((a, b) => (a.tarih || '0000').localeCompare(b.tarih || '0000') || (a.dozNo ?? 0) - (b.dozNo ?? 0))
}

export function asiPlani(g: PlanGirdisi): AsiPlani {
  const kurallar = { ...VARSAYILAN_KURALLAR, ...(g.kurallar || {}) }
  const gecersizSay = g.kisaAralikGecersiz !== false
  const tanimlar = takvimDozlari(g)
  const bySeri = new Map<SeriKod, AsiKaydi[]>()
  const eslesmeyen: AsiKaydi[] = []
  const ozelKayit = new Map<OzelKod, AsiKaydi[]>()
  for (const k of g.kayitlar) {
    const s = kayitSerisi(k.ad)
    if (!s) { eslesmeyen.push(k); continue }
    if (isOzel(s)) { ozelKayit.set(s, [...(ozelKayit.get(s) || []), k]); continue }
    bySeri.set(s, [...(bySeri.get(s) || []), k])
  }
  const yasGun = gunFarki(g.dogumIso, g.bugunIso)
  const fazla: AsiKaydi[] = []
  const seriler: SeriPlani[] = []
  const canliKayitlar: Array<{ seri: SeriKod; tarih: string }> = []
  for (const s of CANLI_PARENTERAL) for (const k of bySeri.get(s) || []) if (k.tarih) canliKayitlar.push({ seri: s, tarih: k.tarih })
  const prematureBcg = g.gebelikHaftasi != null && g.gebelikHaftasi < 34

  for (const seri of SERI_SIRA) {
    const dozlar = tanimlar.filter((d) => d.seri === seri).sort((a, b) => a.no - b.no)
    if (!dozlar.length) continue
    const kural = kurallar[seri]
    const kuyruk = kayitSirala(bySeri.get(seri) || [])
    let onceki: string | null = null
    let birinci: string | null = null
    const planDozlari: PlanDozu[] = []
    for (const d of dozlar) {
      const onerilen = onerilenTarih(g.dogumIso, d)
      const uyarilar: string[] = []
      const gecersizler: AsiKaydi[] = []
      const minYas = kural.minYasGun[d.no]
      const minAra = kural.minAralikGun[d.no]
      const birinciden = kural.birinciDozdanGun?.[d.no]
      let kayit: AsiKaydi | null = null
      // Sıradaki kayıt bu dozu karşılıyor mu? Minimum yaş/aralıktan önce yapılmışsa (GBP) geçersiz — aynı doz tekrarlanır.
      while (kuyruk.length) {
        const k = kuyruk.shift()!
        if (!k.tarih) { kayit = k; uyarilar.push('Tarih bilinmiyor (beyan) — aralık hesabında önerilen tarih esas alındı.'); break }
        const neden: string[] = []
        if (minYas != null && gunFarki(g.dogumIso, k.tarih) < minYas) neden.push(`minimum yaştan (${gunMetni(minYas)}) önce`)
        if (minAra != null && onceki && gunFarki(onceki, k.tarih) < minAra) neden.push(`önceki dozdan ${gunFarki(onceki, k.tarih)} gün sonra (< ${minAra})`)
        if (birinciden != null && birinci && gunFarki(birinci, k.tarih) < birinciden) neden.push(`1. dozdan ${gunFarki(birinci, k.tarih)} gün sonra (< ${birinciden})`)
        if (!neden.length) { kayit = k; break }
        if (!gecersizSay) { kayit = k; uyarilar.push(`${tarihGoster(k.tarih)}: ${neden.join(', ')} yapılmış — geçerliliği hekim değerlendirir.`); break }
        gecersizler.push(k)
        uyarilar.push(`${tarihGoster(k.tarih)} tarihli doz ${neden.join(', ')} yapılmış — GBP'ye göre geçersiz, bu doz tekrarlanır (hekim onaylar).`)
        onceki = k.tarih // tekrar dozu geçersiz dozdan itibaren minimum aralıkla
      }
      if (kayit) {
        const tarih = kayit.tarih || onerilen
        planDozlari.push({ ...d, durum: 'yapildi', onerilen, plan: null, telafi: false, kayit, uyarilar, gecikmeGun: 0, gecersizler })
        onceki = tarih
        if (!birinci) birinci = tarih
        continue
      }
      let enErken = onerilen
      if (minYas != null) enErken = maxTarih(enErken, gunEkle(g.dogumIso, minYas))
      if (onceki && minAra != null) enErken = maxTarih(enErken, gunEkle(onceki, minAra))
      if (birinci && birinciden != null) enErken = maxTarih(enErken, gunEkle(birinci, birinciden))
      if (seri === 'bcg' && prematureBcg) {
        // TND 2026: < 34 haftada postkonsepsiyonel ≥ 34 hafta + takvim yaşı ≥ 2 ay + ≥ 2000 g.
        enErken = maxTarih(enErken, gunEkle(g.dogumIso, Math.ceil((34 - g.gebelikHaftasi!) * 7)))
        uyarilar.push('< 34 hafta doğum: postkonsepsiyonel ≥ 34 hafta, takvim yaşı ≥ 2 ay ve ağırlık ≥ 2000 g olunca (TND 2026) — ağırlığı hekim doğrular.')
      }
      let aday = maxTarih(enErken, g.bugunIso < onerilen ? enErken : g.bugunIso)
      if (CANLI_PARENTERAL.includes(seri)) {
        for (const c of canliKayitlar) {
          if (c.seri === seri || (seri === 'bcg' && c.seri !== 'kkk' && c.seri !== 'vzv')) continue
          if (aday > c.tarih && gunFarki(c.tarih, aday) < CANLI_ARA_GUN) {
            aday = gunEkle(c.tarih, CANLI_ARA_GUN)
            uyarilar.push(`${SERI_AD[c.seri]} ${tarihGoster(c.tarih)} tarihinde yapılmış — canlı aşılar aynı gün ya da ≥ 4 hafta arayla (GBP).`)
          }
        }
      }
      const plan = aday
      const gecikme = gunFarki(onerilen, g.bugunIso)
      let durum: DozDurum
      if (plan <= g.bugunIso) durum = 'bugun'
      else if (gecikme > GECIKME_ESIGI_GUN) durum = 'gecikti'
      else if (gecikme >= 0) durum = 'zamani_geldi'
      else if (gunFarki(g.bugunIso, plan) <= YAKLASAN_GUN) durum = 'yaklasiyor'
      else durum = 'bekliyor'
      // "Bugün yapılabilir" ama önerilen tarihin çok gerisindeyse gecikmiş de sayılır — gecikmeGun ekranda ayrıca söylenir.
      planDozlari.push({ ...d, durum, onerilen, plan, telafi: plan > onerilen, kayit: null, uyarilar, gecikmeGun: gecikme, gecersizler })
      onceki = plan
      if (!birinci) birinci = plan
    }
    fazla.push(...kuyruk)
    const oneriler = yasOnerileri(seri, yasGun, planDozlari)
    for (const o of oneriler) for (const p of planDozlari) if (p.durum !== 'yapildi' && o.yasDisi?.includes(p.no)) p.durum = 'yas_disi'
    const tamam = planDozlari.every((p) => p.durum === 'yapildi' || p.durum === 'yas_disi')
    seriler.push({ seri, ad: SERI_AD[seri], dozlar: planDozlari, oneriler: oneriler.map((o) => o.metin), kural, tamam })
  }

  const acik = seriler.flatMap((s) => s.dozlar).filter((d) => d.durum !== 'yapildi' && d.durum !== 'yas_disi')
  const bugunYapilabilir = acik.filter((d) => d.plan && d.plan <= g.bugunIso)
  const gecikmis = acik.filter((d) => d.gecikmeGun > GECIKME_ESIGI_GUN)
  const gelecek = acik.filter((d) => d.plan && d.plan > g.bugunIso).sort((a, b) => a.plan!.localeCompare(b.plan!))
  let sonrakiZiyaret: AsiPlani['sonrakiZiyaret'] = null
  if (gelecek.length) {
    const ilk = gelecek[0].plan!
    sonrakiZiyaret = { tarih: ilk, dozlar: gelecek.filter((d) => gunFarki(ilk, d.plan!) <= 7) }
  }
  const notlar: string[] = ['Aşılar takvim (kronolojik) yaşa göre ve tam dozda uygulanır; prematürede düzeltilmiş yaş kullanılmaz (TND 2026).']
  if (g.gebelikHaftasi != null && g.gebelikHaftasi < 37) notlar.push(`Prematüre (${String(Math.floor(g.gebelikHaftasi))} hafta): takvim yaşı esas alındı${prematureBcg ? '; BCG < 34 hafta kuralına göre kaydırıldı' : ''}.${(g.gebelikHaftasi <= 32 || (g.dogumKiloGr != null && g.dogumKiloGr <= 1500)) ? ' ROP riski (≤ 32 hafta ya da ≤ 1500 g): 4. haftada göz muayenesine yönlendirme (SB İzlem Protokolü).' : ''}`)
  else if (g.dogumKiloGr != null && g.dogumKiloGr <= 1500) notlar.push('ROP riski (≤ 1500 g): 4. haftada göz muayenesine yönlendirme (SB İzlem Protokolü).')
  if (g.dogumKiloGr != null && g.dogumKiloGr < 2000) notlar.push(`Doğum ağırlığı ${g.dogumKiloGr} g (< 2000 g): Hep B şeması TND 2026'ya göre düzenlendi${g.anneHbsag === 'negatif' ? ' (anne HBsAg negatif — doğum dozu yok)' : ' (anne HBsAg pozitif/bilinmiyor — doğumda HBIG + aşı, seriye sayılmaz)'}.`)
  else if (g.anneHbsag && g.anneHbsag !== 'negatif') notlar.push(`Anne HBsAg ${g.anneHbsag === 'pozitif' ? 'pozitif' : 'bilinmiyor'}: doğumda ilk 12 saatte Hep B aşısı + HBIG; ≥ 2000 g bebekte 1. ayda ek doz yok, 6'lı karma ile devam (TND 2026).`)
  const ulusalKayitSayisi = [...bySeri.values()].reduce((t, x) => t + x.length, 0)
  return {
    seriler, bugunYapilabilir, gecikmis, sonrakiZiyaret, eslesmeyen, fazla, ozel: ozelPlan(yasGun, ozelKayit),
    surum: g.donem === 'altili' ? TAKVIM_SURUM : 'T.C. SB GBP — 5\'li karma + Hep B 0-1-6 (2025 öncesi)', notlar,
    hicAsisiz: ulusalKayitSayisi === 0 ? genelgeHicAsisizSema(yasGun) : null,
  }
}

/** GBP Genelgesi 2009/17 — hiç aşılanmamış çocuk şeması (resmi tablo; KPA / Hep A / suçiçeği genelgeden sonra eklendi, kapsamaz). */
export interface HicAsisizSema { baslik: string; adimlar: Array<{ zaman: string; asilar: string }>; not: string }
export function genelgeHicAsisizSema(yasGun: number): HicAsisizSema | null {
  if (yasGun < 365) return null
  const not = 'Genelge tablosu (2009/17): KPA, Hep A ve suçiçeği o tarihte programda değildi — bunlar yukarıdaki planda ayrıca hesaplandı. Uygulama hekim kararıdır.'
  if (yasGun < 2191) return { baslik: 'GBP Genelgesi — hiç aşılanmamış 12–71 ay', not, adimlar: [
    { zaman: 'İlk ziyaret', asilar: 'DaBT-İPA-Hib + Hep B + PPD (TCT)' },
    { zaman: '2 gün sonra', asilar: 'KKK (+ TCT sonucuna göre BCG)' },
    { zaman: '2 ay sonra', asilar: 'DaBT-İPA-Hib + Hep B' },
    { zaman: '8 ay sonra', asilar: 'DaBT-İPA-Hib + Hep B + OPA' },
  ] }
  return { baslik: 'GBP Genelgesi — hiç aşılanmamış 72 ay ve üstü', not, adimlar: [
    { zaman: 'İlk ziyaret', asilar: 'Td + OPA + Hep B + KKK' },
    { zaman: '1 ay sonra', asilar: 'Td + OPA + Hep B + KKK' },
    { zaman: '8 ay sonra', asilar: 'Td + OPA + Hep B' },
  ] }
}

const isOzel = (s: SeriKod | OzelKod): s is OzelKod => ['rota', 'menacwy', 'menb', 'grip', 'hpv'].includes(s)
const maxTarih = (a: string, b: string) => (a > b ? a : b)

export function gunMetni(gun: number): string {
  if (gun === 0) return 'doğum'
  if (gun >= 1461) return `${Math.round(gun / 365.25)} yaş`
  if (gun >= 360 && gun <= 370) return '12 ay'
  if (gun % 7 === 0 && gun <= 182) return `${gun / 7} hafta`
  if (gun % 30 === 0) return `${gun / 30} ay`
  return `${gun} gün`
}

/** Yaşa bağlı kurallar. GBP'den gelenler doğrulanmış; "öneri — hekim kilitler" etiketliler resmi metinde bulunamadı. */
function yasOnerileri(seri: SeriKod, yasGun: number, dozlar: PlanDozu[]): Array<{ metin: string; yasDisi?: number[] }> {
  const eksik = dozlar.filter((d) => d.durum !== 'yapildi')
  if (!eksik.length) return []
  const yil = yasGun / 365.25
  const out: Array<{ metin: string; yasDisi?: number[] }> = []
  if (seri === 'karma') {
    if (yasGun >= KARMA_UST_GUN) {
      out.push({ metin: 'GBP: DaBT-İPA-Hib 72 aydan sonra uygulanmaz — eksik dozlar Td + OPA ile tamamlanır (≥ 72 ay şeması: 0, 1. ay, 8. ay). Ürün ve doz sayısı hekim kararı.', yasDisi: eksik.filter((d) => d.no <= 4).map((d) => d.no) })
      if (eksik.some((d) => d.no === 5)) out.push({ metin: 'Okul öncesi DaBT-İPA rapeli 72 ay sonrasında: Td + OPA ile değiştirilip değiştirilmeyeceği hekim kararı (öneri — hekim kilitler).' })
    } else if (yil >= 1 && eksik.some((d) => d.no <= 3) && dozlar.every((d) => d.durum !== 'yapildi')) {
      out.push({ metin: 'Hiç karma aşısı olmayan 12–71 ay çocukta GBP şeması 3 doz DaBT-İPA-Hib (ilk ziyaret, 2 ay sonra, 8 ay sonra) — aşağıdaki genelge kartına bakın.' })
    }
  }
  if (seri === 'kpa') {
    if (yil >= 5) out.push({ metin: '5 yaş üstü sağlıklı çocukta KPA telafisi gerekmeyebilir; risk grubunda hekim kararı (öneri — hekim kilitler).', yasDisi: eksik.map((d) => d.no) })
    else if (yil >= 2) out.push({ metin: '24–59 ay sağlıklı çocukta eksik KPA için tek doz yeterli olabilir (öneri — hekim kilitler).' })
    else if (yil >= 1 && dozlar.every((d) => d.durum !== 'yapildi')) out.push({ metin: '12–23 ayda başlanırsa KPA 2 doz (≥ 8 hafta arayla) yeterli olabilir (öneri — hekim kilitler).' })
  }
  if (seri === 'hepb' && dozlar.length === 1 && dozlar[0].durum !== 'yapildi' && yasGun > 60) {
    out.push({ metin: "Doğum dozu kayıtta yok. 6'lı karma dönemi: Hep B koruması karma dozlarla sürer; ayrı doz gereği hekim kararı." })
  }
  if (seri === 'bcg') {
    if (yasGun >= KARMA_UST_GUN) out.push({ metin: 'GBP: aşısız 6 yaş üstü çocukta BCG gerekmez.', yasDisi: [1] })
    else if (yasGun > BCG_PPD_GUN) out.push({ metin: 'GBP: 3 aydan büyükte BCG, PPD (TCT) sonucuna göre yapılır.' })
  }
  if (seri === 'vzv' && eksik.some((d) => d.no === 2) && yasGun > 72 * 30.4375) {
    out.push({ metin: 'Suçiçeği 2. doz programı 48. ay (Eylül 2026; 49–72 ay telafi). Daha büyük çocukta hekim kararı (öneri — hekim kilitler).', yasDisi: [2] })
  }
  return out
}

// ─── Özel (ücretli / takvim dışı) aşılar ────────────────────────────────────────────────────────
export interface OzelPlan {
  kod: OzelKod
  ad: string
  onerilenDonem: string
  not: string
  kayitlar: AsiKaydi[]
  /** Yaşa göre konuşulabilir mi (kaba pencere — öneri). */
  uygunluk: 'uygun' | 'erken' | 'gecti' | 'bilgi'
}

const OZEL_KOD: Array<{ kod: OzelKod; re: RegExp; minGun?: number; maxGun?: number }> = [
  { kod: 'rota', re: /rota/i, minGun: 42, maxGun: 240 },
  { kod: 'menacwy', re: /acwy/i, minGun: 270 },
  { kod: 'menb', re: /meningokok b/i, minGun: 56 },
  { kod: 'grip', re: /influenza|grip/i, minGun: 182 },
  { kod: 'hpv', re: /hpv/i, minGun: 9 * 365 },
]

function ozelPlan(yasGun: number, kayit: Map<OzelKod, AsiKaydi[]>): OzelPlan[] {
  return OZEL_KOD.map(({ kod, re, minGun, maxGun }) => {
    const src = OZEL_ASILAR.find((o) => re.test(o.ad))
    const uygunluk: OzelPlan['uygunluk'] = minGun == null ? 'bilgi' : yasGun < minGun ? 'erken' : maxGun != null && yasGun > maxGun ? 'gecti' : 'uygun'
    return { kod, ad: src?.ad || kod, onerilenDonem: src?.onerilenDonem || '', not: src?.not || '', kayitlar: kayit.get(kod) || [], uygunluk }
  })
}

export const DURUM_AD: Record<DozDurum, string> = {
  yapildi: 'Yapıldı', bugun: 'Bugün yapılabilir', zamani_geldi: 'Zamanı geldi', gecikti: 'Gecikti', yaklasiyor: 'Yaklaşıyor', bekliyor: 'Planlı', yas_disi: 'Hekim kararı',
}

/**
 * Dönem önerisi: kayıtta 5'li / ayrı Hep B dizisi varsa önceki düzen; yoksa doğum tarihi eşiği. 6'lı karma 14 Nisan 2025'te
 * başladı (ikincil kaynak) → 2. ay dozu bu tarihe denk gelen ilk kuşak ≈ 14 Şubat 2025 doğumlular. Geçiş kuşağı karışık
 * olabilir — hekim segmentten değiştirir (öneri — hekim kilitler).
 */
export const ALTILI_GECIS_DOGUM = '2025-02-14'
export function onerilenDonem(dogumIso: string, kayitlar: AsiKaydi[]): TakvimDonemi {
  if (kayitlar.some((k) => /5.?li|penta/i.test(normalAd(k.ad)))) return 'besli'
  if (kayitlar.some((k) => /6.?li|hexa|heksa/i.test(normalAd(k.ad)))) return 'altili'
  if (kayitlar.filter((k) => kayitSerisi(k.ad) === 'hepb').length >= 2) return 'besli'
  return dogumIso >= ALTILI_GECIS_DOGUM ? 'altili' : 'besli'
}

/** Hekimin kendi notuna yapıştırması için özet. */
export function asiOzetMetni(p: AsiPlani, bugunIso: string): string {
  const satir: string[] = [`Aşı durumu (${tarihGoster(bugunIso)}) — ${p.surum}`]
  const yapilan = p.seriler.flatMap((s) => s.dozlar.filter((d) => d.durum === 'yapildi'))
  satir.push(`Yapılmış: ${yapilan.length} doz${yapilan.length ? '' : ' (kayıt yok)'}.`)
  if (p.bugunYapilabilir.length) satir.push(`Bugün yapılabilir: ${p.bugunYapilabilir.map(dozKisa).join(', ')}.`)
  if (p.gecikmis.length) satir.push(`Gecikmiş: ${p.gecikmis.map((d) => `${dozKisa(d)} (önerilen ${tarihGoster(d.onerilen)})`).join(', ')}.`)
  if (p.sonrakiZiyaret) satir.push(`Sonraki aşı ziyareti: ${tarihGoster(p.sonrakiZiyaret.tarih)} — ${p.sonrakiZiyaret.dozlar.map(dozKisa).join(', ')}.`)
  const oneriler = p.seriler.flatMap((s) => s.oneriler)
  if (oneriler.length) satir.push(...oneriler.map((o) => `• ${o}`))
  satir.push('Telafi planı: seri baştan başlatılmadı; kalan dozlar minimum aralıklarla yeniden hesaplandı. Hekim onayı gerekir.')
  return satir.join('\n')
}

export function dozKisa(d: Pick<PlanDozu, 'seri' | 'etiket'>): string {
  const kisa: Record<SeriKod, string> = { hepb: 'Hep B', bcg: 'BCG', karma: 'Karma', kpa: 'KPA', opa: 'OPA', kkk: 'KKK', vzv: 'Suçiçeği', hepa: 'Hep A', td: 'Td' }
  return `${kisa[d.seri]} ${d.etiket}`
}
