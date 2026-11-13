/**
 * PREMATURE-MODUL — KD › Erken doğum risk paneli. Saf motor (veritabanı yok). Karar desteği ve KAYIT: eşik / "kriter karşılandı"
 * göstergeleri ve hekimin girdiği olgular. Motor doz ÖNERMEZ, tetkik / ilaç / serklaj ISTEMEZ, tanı koymaz; progesteron, steroid ve
 * magnezyum hekimin girdiği BİR OLGUDUR (kayıt), önerilen bir tedavi değildir.
 *
 * Yayımlanmış eşikler (her biri kaynağı ve doğrulama düzeyiyle birlikte döner; ekran bunu olduğu gibi gösterir):
 *  - Kısa serviks: transvajinal serviks uzunluğu 16–24. haftalar arasında < 25 mm (ACOG PB 234, 2021; AAFP özetinden) /
 *    ≤ 25 mm (SMFM Consult #70, 2024; FIGO 2015 orta trimester ≤ 25 mm). Tanımlar ayrı gösterilir; tam 25 mm iki tanım arasında sınırdır.
 *  - Vajinal progesteron değerlendirme eşiği (tekil gebelik, önceki spontan erken doğum YOK): ≤ 20 mm ve tanı 24. haftadan önce
 *    (SMFM #70, GRADE 1A); 21–25 mm paylaşımlı karar aralığı (GRADE 1B). İkiz gebelik için uzlaşılmış eşik yoktur (SMFM #70).
 *  - Serklaj: SMFM #70 — 10–25 mm ve dilatasyon yok: önerilmez; < 10 mm: paylaşımlı karar kapsamında düşünülebilir. Bu motor serklaj
 *    isteği üretmez, yalnız "< 10 mm" göstergesini taşır.
 *  - Önceki spontan erken doğum: 16–24. haftalar arasında seri transvajinal serviks ölçümü (ACOG PB 234).
 *  - Antenatal kortikosteroid penceresi: 24+0–33+6 tek kür; 23+0'dan itibaren aile kararıyla; 34+0–36+6 daha önce kür almamışsa
 *    betametazon düşünülebilir; tekrar kür önceki kürden > 14 gün sonra (ACOG CO 713, 2017).
 * Kısalma hızı için doğrulanmış bir eşik YOKTUR; trend yalnız ölçümleri ve farkları gösterir, bayrak üretmez.
 * Gestasyon: US ile düzeltilmiş TDT varsa TDT − 280, yoksa SAT (lib/clinical/gebelik.ts gebelikYasi ile aynı kural).
 */
import { addDays, diffDays } from './dates'

export type Yontem = 'transvajinal' | 'transabdominal'
export interface ServiksOlcumu { id: string; tarih: string; gestasyonGun: number; mm: number; yontem: Yontem }
export interface SteroidKuru { id: string; tarih: string }
export interface ErkenDogumKaydi {
  serviks: ServiksOlcumu[]
  /** Önceki SPONTAN erken doğum (< 37 hf). null = girilmedi. */
  oncekiSpontanPreterm: boolean | null
  pprom: { var: boolean | null; tarih: string | null }
  steroid: { yapildi: boolean | null; kurlar: SteroidKuru[] }
  magnezyum: { verildi: boolean | null; tarih: string | null }
  /** Hekimin girdiği olgu — doz alanı yoktur. */
  progesteron: { kullaniyor: boolean | null; baslangic: string | null; yol: 'vajinal' | 'im' | 'oral' | null }
}

export const BOS_KAYIT: ErkenDogumKaydi = {
  serviks: [], oncekiSpontanPreterm: null, pprom: { var: null, tarih: null },
  steroid: { yapildi: null, kurlar: [] }, magnezyum: { verildi: null, tarih: null }, progesteron: { kullaniyor: null, baslangic: null, yol: null },
}

/* ───────────────────────────── kaynaklar ───────────────────────────── */

export type KaynakDurumu = 'birincil-okundu' | 'ikincil-ozet' | 'dogrulanmadi'
export interface Kaynak { kisa: string; tam: string; durum: KaynakDurumu; not?: string }

export const KAYNAK_ACOG_234: Kaynak = {
  kisa: 'ACOG PB 234 (2021)',
  tam: 'ACOG Practice Bulletin No. 234. Prediction and Prevention of Spontaneous Preterm Birth. Obstet Gynecol 2021;138(2):e65-e90.',
  durum: 'ikincil-ozet',
  not: 'AAFP özetinden okundu (Am Fam Physician 2022); birincil metin okunamadı. Kısa serviks: transvajinal < 25 mm, 16–24. hafta; önceki spontan erken doğumda 16–24. haftalar arası seri ölçüm.',
}
export const KAYNAK_SMFM_70: Kaynak = {
  kisa: 'SMFM Consult Series #70 (2024)',
  tam: 'Society for Maternal-Fetal Medicine. Management of short cervix in individuals without a history of spontaneous preterm birth. SMFM Consult Series #70. Am J Obstet Gynecol 2024.',
  durum: 'birincil-okundu',
  not: 'SMFM yayınlarının kendi PDF kopyasından okundu (2026-11-13). Kapsam: tekil gebelik, önceki spontan erken doğum yok; ikiz ve önceki erken doğum için öneri vermez.',
}
export const KAYNAK_FIGO: Kaynak = {
  kisa: 'FIGO 2015',
  tam: 'FIGO Working Group on Best Practice in Maternal-Fetal Medicine. Best practice in maternal-fetal medicine. Int J Gynecol Obstet 2015;128:80-82.',
  durum: 'ikincil-ozet',
  not: 'Norman JE, Int J Gynaecol Obstet 2020;150:24-30 derlemesindeki aktarmadan okundu: orta trimester serviks uzunluğu ≤ 25 mm kısa serviks sayılır. Birincil metin okunamadı.',
}
export const KAYNAK_CO_713: Kaynak = {
  kisa: 'ACOG CO 713 (2017)',
  tam: 'ACOG Committee Opinion No. 713. Antenatal Corticosteroid Therapy for Fetal Maturation. Obstet Gynecol 2017 (PMID 28742678).',
  durum: 'ikincil-ozet',
  not: 'Özet sayfasından okundu: 24+0–33+6 tek kür; 23+0 aile kararıyla; 34+0–36+6 daha önce kür almamışsa betametazon düşünülebilir; tekrar kür önceki kürden > 14 gün sonra.',
}
export const KAYNAK_MGSO4: Kaynak = {
  kisa: 'ACOG CO 455 (2010)',
  tam: 'ACOG Committee Opinion No. 455. Magnesium sulfate before anticipated preterm birth for neuroprotection. Obstet Gynecol 2010;115:669-671.',
  durum: 'dogrulanmadi',
  not: 'Yalnız künye; içeriği bu çalışmada okunmadı. Bu yüzden magnezyum için eşik ya da öneri üretilmez, yalnız hekimin kaydı gösterilir.',
}
export const KAYNAK_PPROM: Kaynak = {
  kisa: 'ACOG PB 217 (2020)',
  tam: 'ACOG Practice Bulletin No. 217. Prelabor Rupture of Membranes. Obstet Gynecol 2020;135:e80-e97.',
  durum: 'dogrulanmadi',
  not: 'Yalnız künye; içeriği bu çalışmada okunmadı. PPROM için eşik ya da öneri üretilmez, yalnız hekimin kaydı (tarih, gestasyon, süre) gösterilir.',
}

/* ───────────────────────────── sabitler (yayımlanmış eşikler) ───────────────────────────── */

export const ESIK = {
  /** Kısa serviks tanım penceresi: 16+0 – 24+0 (ACOG PB 234). */
  pencereBas: 16 * 7, pencereSon: 24 * 7,
  /** Progesteron değerlendirme: tanı 24+0'dan ÖNCE (SMFM #70). */
  progesteronSonGun: 24 * 7 - 1,
  acogMm: 25, smfmMm: 25, progesteronEsikMm: 20, progesteronUstMm: 25, cokKisaMm: 10,
  steroid: { yasayabilirlik: 23 * 7, anaBas: 24 * 7, anaSon: 33 * 7 + 6, gecBas: 34 * 7, gecSon: 36 * 7 + 6, tekrarGun: 14 },
} as const

/* ───────────────────────────── yardımcılar ───────────────────────────── */

const ISO = /^\d{4}-\d{2}-\d{2}$/
const gecerliGun = (s: unknown): s is string => typeof s === 'string' && ISO.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`))

export function gestasyonMetni(gun: number | null): string { return gun == null ? '—' : `${Math.floor(gun / 7)}+${gun % 7}` }

/** Gebelik başlangıcı (LMP eşdeğeri): düzeltilmiş TDT varsa TDT − 280, yoksa SAT. */
export function gebelikBaslangici(sat: string | null | undefined, tdt: string | null | undefined): string | null {
  if (tdt && gecerliGun(tdt.slice(0, 10))) return addDays(tdt.slice(0, 10), -280)
  if (sat && gecerliGun(sat.slice(0, 10))) return sat.slice(0, 10)
  return null
}

/** Bir tarihteki gestasyon (gün); gebelik başlangıcı yoksa ya da değer aralık dışındaysa null. */
export function gestasyonGunuTarihte(sat: string | null | undefined, tdt: string | null | undefined, tarihIso: string): number | null {
  const b = gebelikBaslangici(sat, tdt)
  if (!b || !gecerliGun(tarihIso)) return null
  const g = diffDays(tarihIso, b)
  return g >= 0 && g <= 320 ? g : null
}

/** "22+3" / "22" / "22,3" (ondalık hafta) → gün. Geçersiz → null. */
export function gestasyonCoz(ham: string | number | null | undefined): number | null {
  const s = String(ham ?? '').trim().replace(',', '.')
  if (!s) return null
  const m = s.match(/^(\d{1,2})\s*\+\s*([0-6])$/)
  const gun = m ? Number(m[1]) * 7 + Number(m[2]) : Number.isFinite(Number(s)) ? Math.round(Number(s) * 7) : NaN
  return Number.isInteger(gun) && gun >= 14 * 7 && gun <= 42 * 7 ? gun : null
}

/* ───────────────────────────── temizleme (sunucu + istemci) ───────────────────────────── */

export function erkenDogumTemizle(ham: unknown, bugunIso: string): { kayit: ErkenDogumKaydi; hata: string | null } {
  const r = (ham && typeof ham === 'object' && !Array.isArray(ham) ? ham : {}) as Record<string, unknown>
  const bool = (v: unknown): boolean | null => (v === true || v === 'true' ? true : v === false || v === 'false' ? false : null)
  const tarih = (v: unknown): string | null => (typeof v === 'string' && gecerliGun(v.slice(0, 10)) ? v.slice(0, 10) : null)
  let hata: string | null = null
  const hataVer = (m: string) => { if (!hata) hata = m }

  const serviksMap = new Map<string, ServiksOlcumu>()
  for (const x of (Array.isArray(r.serviks) ? r.serviks : []).slice(0, 80)) {
    const o = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>
    const t = tarih(o.tarih)
    const mm = Number(String(o.mm ?? '').replace(',', '.'))
    const g = typeof o.gestasyonGun === 'number' ? o.gestasyonGun : gestasyonCoz(o.gestasyonGun as string)
    const yontem: Yontem = o.yontem === 'transabdominal' ? 'transabdominal' : 'transvajinal'
    if (!t) { hataVer('Serviks ölçümü tarihi geçersiz.'); continue }
    if (t > bugunIso) { hataVer('İleri tarihli serviks ölçümü kaydedilemez.'); continue }
    if (!Number.isFinite(mm) || mm <= 0 || mm > 80) { hataVer('Serviks uzunluğu 1–80 mm arasında olmalı.'); continue }
    if (g == null || !Number.isInteger(g) || g < 14 * 7 || g > 42 * 7) { hataVer('Serviks ölçümü gestasyonu 14+0–42+0 hafta arasında olmalı.'); continue }
    serviksMap.set(`${t}-${yontem}`, { id: `${t}-${yontem}`, tarih: t, gestasyonGun: g, mm: Math.round(mm * 10) / 10, yontem })
  }
  const kurMap = new Map<string, SteroidKuru>()
  const st = (r.steroid && typeof r.steroid === 'object' ? r.steroid : {}) as Record<string, unknown>
  for (const x of (Array.isArray(st.kurlar) ? st.kurlar : []).slice(0, 6)) {
    const t = tarih((x as Record<string, unknown>)?.tarih)
    if (!t) { hataVer('Steroid kürü tarihi geçersiz.'); continue }
    if (t > bugunIso) { hataVer('İleri tarihli steroid kaydı yapılamaz.'); continue }
    kurMap.set(t, { id: t, tarih: t })
  }
  const pp = (r.pprom && typeof r.pprom === 'object' ? r.pprom : {}) as Record<string, unknown>
  const mg = (r.magnezyum && typeof r.magnezyum === 'object' ? r.magnezyum : {}) as Record<string, unknown>
  const pg = (r.progesteron && typeof r.progesteron === 'object' ? r.progesteron : {}) as Record<string, unknown>
  const ppVar = bool(pp.var), ppTarih = ppVar ? tarih(pp.tarih) : null
  const mgVar = bool(mg.verildi), mgTarih = mgVar ? tarih(mg.tarih) : null
  const pgVar = bool(pg.kullaniyor), pgBas = pgVar ? tarih(pg.baslangic) : null
  for (const t of [ppTarih, mgTarih, pgBas]) if (t && t > bugunIso) hataVer('İleri tarihli kayıt yapılamaz.')
  const kurlar = [...kurMap.values()].sort((a, b) => a.tarih.localeCompare(b.tarih))
  const kayit: ErkenDogumKaydi = {
    serviks: [...serviksMap.values()].sort((a, b) => a.tarih.localeCompare(b.tarih) || a.yontem.localeCompare(b.yontem)),
    oncekiSpontanPreterm: bool(r.oncekiSpontanPreterm),
    pprom: { var: ppVar, tarih: ppTarih },
    steroid: { yapildi: kurlar.length ? true : bool(st.yapildi), kurlar },
    magnezyum: { verildi: mgVar, tarih: mgTarih },
    progesteron: { kullaniyor: pgVar, baslangic: pgBas, yol: pgVar && (pg.yol === 'vajinal' || pg.yol === 'im' || pg.yol === 'oral') ? pg.yol : null },
  }
  return { kayit, hata }
}

/* ───────────────────────────── değerlendirme ───────────────────────────── */

export type BayrakKod = 'onceki_spontan_preterm' | 'kisa_serviks' | 'progesteron_degerlendirme' | 'cok_kisa_serviks' | 'cogul_gebelik' | 'pprom'
export type BayrakDurum = 'karsilandi' | 'karsilanmadi' | 'belirsiz'
export interface Bayrak { kod: BayrakKod; baslik: string; durum: BayrakDurum; gerekce: string[]; kaynaklar: Kaynak[] }

export interface TrendSatiri { id: string; tarih: string; gestasyon: string; gestasyonGun: number; mm: number; yontem: Yontem; fark: number | null; gunAralik: number | null; pencerede: boolean }
export type SteroidPencere = 'oncesi' | 'yasayabilirlik' | 'ana' | 'gec' | 'disi' | 'bilinmiyor'
export interface SteroidSatiri { tarih: string; gestasyon: string; pencere: SteroidPencere; aciklama: string; oncekindenGun: number | null }

export interface ErkenDogumGirdisi {
  sat: string | null
  tdt: string | null
  /** gebelikler.cogul_gebelik_tipi — boş ya da 'tekil' dışındaki her değer çoğul gebelik. */
  cogulTipi: string | null
  durum: 'aktif' | 'dogum_yapti' | string
  kayit: ErkenDogumKaydi
}

export interface ErkenDogumSonuc {
  gestasyonGun: number | null
  trend: TrendSatiri[]
  bayraklar: Bayrak[]
  steroid: { satirlar: SteroidSatiri[]; guncel: { pencere: SteroidPencere; aciklama: string } | null }
  magnezyum: { aciklama: string } | null
  pprom: { aciklama: string } | null
  progesteron: { kayit: 'var' | 'yok' | 'girilmedi'; aciklama: string }
  eksikVeri: string[]
  /** Kohort / kart özeti için: herhangi bir bayrak karşılandı mı. */
  riskVar: boolean
  kohortNedenleri: string[]
  kaynaklar: Kaynak[]
}

export function steroidPenceresi(gun: number | null): { pencere: SteroidPencere; aciklama: string } {
  if (gun == null) return { pencere: 'bilinmiyor', aciklama: 'gestasyon bilinmiyor' }
  const s = ESIK.steroid
  if (gun < s.yasayabilirlik) return { pencere: 'oncesi', aciklama: `${gestasyonMetni(gun)} — 23. haftadan önce; CO 713 kapsamı dışında` }
  if (gun < s.anaBas) return { pencere: 'yasayabilirlik', aciklama: `${gestasyonMetni(gun)} — 23. hafta: aile resüsitasyon kararı verirse kür düşünülebilir (CO 713)` }
  if (gun <= s.anaSon) return { pencere: 'ana', aciklama: `${gestasyonMetni(gun)} — 24+0–33+6: CO 713 ana pencere (7 gün içinde doğum riski olanlara tek kür)` }
  if (gun < 37 * 7 && gun >= s.gecBas) return { pencere: 'gec', aciklama: `${gestasyonMetni(gun)} — 34+0–36+6: önceki kür yoksa betametazon düşünülebilir (CO 713)` }
  return { pencere: 'disi', aciklama: `${gestasyonMetni(gun)} — CO 713 pencereleri dışında` }
}

export function erkenDogumDegerlendir(g: ErkenDogumGirdisi, bugunIso: string): ErkenDogumSonuc {
  const k = g.kayit
  const gestGun = gestasyonGunuTarihte(g.sat, g.tdt, bugunIso)
  const aktif = g.durum === 'aktif'
  const cogul = !!g.cogulTipi && g.cogulTipi !== 'tekil'
  const eksik: string[] = []
  if (gebelikBaslangici(g.sat, g.tdt) == null) eksik.push('Gebelik başlangıcı (SAT ya da TDT) — gestasyon hesaplanamıyor')
  if (k.oncekiSpontanPreterm == null) eksik.push('Önceki spontan erken doğum öyküsü')
  if (!k.serviks.length) eksik.push('Serviks uzunluğu ölçümü (transvajinal)')

  // ── trend
  const sirali = [...k.serviks].sort((a, b) => a.gestasyonGun - b.gestasyonGun || a.tarih.localeCompare(b.tarih))
  let onceki: ServiksOlcumu | null = null
  const trend: TrendSatiri[] = sirali.map((o) => {
    const t: TrendSatiri = {
      id: o.id, tarih: o.tarih, gestasyon: gestasyonMetni(o.gestasyonGun), gestasyonGun: o.gestasyonGun, mm: o.mm, yontem: o.yontem,
      fark: onceki ? Math.round((o.mm - onceki.mm) * 10) / 10 : null, gunAralik: onceki ? diffDays(o.tarih, onceki.tarih) : null,
      pencerede: o.gestasyonGun >= ESIK.pencereBas && o.gestasyonGun <= ESIK.pencereSon,
    }
    onceki = o
    return t
  })
  const tvPencere = sirali.filter((o) => o.yontem === 'transvajinal' && o.gestasyonGun >= ESIK.pencereBas && o.gestasyonGun <= ESIK.pencereSon)
  const enKisa = tvPencere.length ? tvPencere.reduce((a, b) => (b.mm < a.mm ? b : a)) : null
  const taOlcum = sirali.filter((o) => o.yontem === 'transabdominal' && o.gestasyonGun >= ESIK.pencereBas && o.gestasyonGun <= ESIK.pencereSon)

  const bayraklar: Bayrak[] = []
  // ── önceki spontan erken doğum
  bayraklar.push({
    kod: 'onceki_spontan_preterm', baslik: 'Önceki spontan erken doğum',
    durum: k.oncekiSpontanPreterm == null ? 'belirsiz' : k.oncekiSpontanPreterm ? 'karsilandi' : 'karsilanmadi',
    gerekce: k.oncekiSpontanPreterm == null ? ['Öykü girilmedi'] : k.oncekiSpontanPreterm
      ? [`ACOG PB 234: 16–24. haftalar arasında seri transvajinal serviks ölçümü; bu pencerede ${tvPencere.length} transvajinal ölçüm kayıtlı`]
      : ['Öykü yok'],
    kaynaklar: [KAYNAK_ACOG_234],
  })
  // ── kısa serviks
  const kisa: Bayrak = { kod: 'kisa_serviks', baslik: 'Kısa serviks (transvajinal, 16–24. hafta)', durum: 'belirsiz', gerekce: [], kaynaklar: [KAYNAK_ACOG_234, KAYNAK_SMFM_70, KAYNAK_FIGO] }
  if (enKisa) {
    const mm = enKisa.mm
    const acog = mm < ESIK.acogMm, smfm = mm <= ESIK.smfmMm
    kisa.durum = smfm ? 'karsilandi' : 'karsilanmadi'
    kisa.gerekce.push(`En kısa transvajinal ölçüm ${mm} mm (${gestasyonMetni(enKisa.gestasyonGun)}, ${enKisa.tarih})`)
    kisa.gerekce.push(`ACOG PB 234 (< 25 mm): ${acog ? 'karşılandı' : 'karşılanmadı'} · SMFM #70 / FIGO (≤ 25 mm): ${smfm ? 'karşılandı' : 'karşılanmadı'}${mm === ESIK.acogMm ? ' — tam 25 mm iki tanım arasında sınırdır' : ''}`)
  } else if (k.serviks.length) {
    kisa.gerekce.push(taOlcum.length ? 'Pencerede yalnız transabdominal ölçüm var: kısa serviks tanımı transvajinal ölçüme dayanır (transabdominal ≤ 36 mm ise transvajinal ölçüm düşünülür — ACOG PB 234).' : 'Kayıtlı ölçümlerin hiçbiri 16+0–24+0 haftada transvajinal değil.')
  } else kisa.gerekce.push('Serviks ölçümü girilmedi')
  bayraklar.push(kisa)
  // ── progesteron değerlendirme eşiği (SMFM #70 popülasyonu)
  const prog: Bayrak = { kod: 'progesteron_degerlendirme', baslik: 'Vajinal progesteron değerlendirme aralığı (SMFM #70)', durum: 'belirsiz', gerekce: [], kaynaklar: [KAYNAK_SMFM_70] }
  if (cogul) { prog.durum = 'karsilanmadi'; prog.gerekce.push('Çoğul gebelik: SMFM #70 kapsamı dışı (ikizde kısa serviks için uzlaşılmış eşik yok)') }
  else if (k.oncekiSpontanPreterm === true) { prog.durum = 'karsilanmadi'; prog.gerekce.push('Önceki spontan erken doğum: SMFM #70 yalnız öyküsü olmayanlar için yazılmıştır — bu kriter uygulanmaz') }
  else if (!enKisa) prog.gerekce.push(k.serviks.length ? 'Pencerede transvajinal ölçüm yok' : 'Serviks ölçümü girilmedi')
  else if (k.oncekiSpontanPreterm == null) prog.gerekce.push('Önceki spontan erken doğum öyküsü girilmedi — kriterin popülasyonu doğrulanamıyor')
  else if (enKisa.gestasyonGun > ESIK.progesteronSonGun) { prog.durum = 'karsilanmadi'; prog.gerekce.push(`Ölçüm ${gestasyonMetni(enKisa.gestasyonGun)}: SMFM #70 tanıyı 24. haftadan önce arar`) }
  else if (enKisa.mm <= ESIK.progesteronEsikMm) { prog.durum = 'karsilandi'; prog.gerekce.push(`${enKisa.mm} mm ≤ 20 mm, tanı 24. haftadan önce, tekil gebelik, önceki spontan erken doğum yok (SMFM #70, GRADE 1A)`) }
  else if (enKisa.mm <= ESIK.progesteronUstMm) { prog.durum = 'karsilandi'; prog.gerekce.push(`${enKisa.mm} mm: 21–25 mm paylaşımlı karar aralığı (SMFM #70, GRADE 1B)`) }
  else { prog.durum = 'karsilanmadi'; prog.gerekce.push(`${enKisa.mm} mm > 25 mm`) }
  bayraklar.push(prog)
  // ── çok kısa serviks
  const cok: Bayrak = { kod: 'cok_kisa_serviks', baslik: 'Serviks < 10 mm', durum: enKisa ? (enKisa.mm < ESIK.cokKisaMm ? 'karsilandi' : 'karsilanmadi') : 'belirsiz', gerekce: [], kaynaklar: [KAYNAK_SMFM_70] }
  cok.gerekce.push(enKisa ? (enKisa.mm < ESIK.cokKisaMm ? `${enKisa.mm} mm — SMFM #70 bu aralığı serklaj için paylaşımlı karar kapsamında sayar; 11–15 mm ve altında dilatasyon muayenesi düşünülür. Tüm karar hekimindir.` : `En kısa ${enKisa.mm} mm`) : 'Pencerede transvajinal ölçüm yok')
  bayraklar.push(cok)
  // ── çoğul gebelik
  bayraklar.push({
    kod: 'cogul_gebelik', baslik: 'Çoğul gebelik', durum: cogul ? 'karsilandi' : 'karsilanmadi',
    gerekce: cogul ? [`Gebelik tipi: ${g.cogulTipi}. SMFM #70: kısa serviks için uzlaşılmış eşik yok; progesteron / pesser / serklaj klinik çalışma dışında rutin önerilmez. ACOG PB 234: progesteron çoğul gebelikte yarar göstermemiştir.`] : ['Tekil gebelik kayıtlı'],
    kaynaklar: [KAYNAK_SMFM_70, KAYNAK_ACOG_234],
  })
  // ── PPROM
  const pprom: ErkenDogumSonuc['pprom'] = k.pprom.var ? { aciklama: (() => {
    const gg = k.pprom.tarih ? gestasyonGunuTarihte(g.sat, g.tdt, k.pprom.tarih) : null
    const sure = k.pprom.tarih && aktif ? diffDays(bugunIso, k.pprom.tarih) : null
    return `PPROM kaydı${k.pprom.tarih ? `: ${k.pprom.tarih}` : ''}${gg != null ? ` (${gestasyonMetni(gg)})` : ''}${sure != null && sure >= 0 ? ` · ${sure} gün önce` : ''}`
  })() } : null
  bayraklar.push({
    kod: 'pprom', baslik: 'Preterm erken membran rüptürü (PPROM)', durum: k.pprom.var == null ? 'belirsiz' : k.pprom.var ? 'karsilandi' : 'karsilanmadi',
    gerekce: pprom ? [pprom.aciklama] : k.pprom.var == null ? ['Girilmedi'] : ['Yok'], kaynaklar: [KAYNAK_PPROM],
  })

  // ── steroid günlüğü
  const steroidSatirlar: SteroidSatiri[] = k.steroid.kurlar.map((c, i, a) => {
    const gg = gestasyonGunuTarihte(g.sat, g.tdt, c.tarih)
    const p = steroidPenceresi(gg)
    return { tarih: c.tarih, gestasyon: gestasyonMetni(gg), pencere: p.pencere, aciklama: p.aciklama, oncekindenGun: i ? diffDays(c.tarih, a[i - 1].tarih) : null }
  })
  const guncelSteroid = aktif && gestGun != null ? steroidPenceresi(gestGun) : null

  // ── magnezyum
  const magnezyum = k.magnezyum.verildi ? (() => {
    const gg = k.magnezyum.tarih ? gestasyonGunuTarihte(g.sat, g.tdt, k.magnezyum.tarih) : null
    return { aciklama: `Magnezyum sülfat kaydı${k.magnezyum.tarih ? `: ${k.magnezyum.tarih}` : ''}${gg != null ? ` (${gestasyonMetni(gg)})` : ''}` }
  })() : null

  // ── progesteron kaydı (hekim olgusu)
  const pg = k.progesteron
  const progKayit: ErkenDogumSonuc['progesteron'] = pg.kullaniyor == null ? { kayit: 'girilmedi', aciklama: 'Progesteron kaydı girilmedi' }
    : pg.kullaniyor ? { kayit: 'var', aciklama: `Progesteron kullanımı kayıtlı${pg.baslangic ? ` (başlangıç ${pg.baslangic}${gestasyonGunuTarihte(g.sat, g.tdt, pg.baslangic) != null ? `, ${gestasyonMetni(gestasyonGunuTarihte(g.sat, g.tdt, pg.baslangic))}` : ''})` : ''}${pg.yol ? ` · yol: ${({ vajinal: 'vajinal', im: 'intramüsküler', oral: 'oral' } as const)[pg.yol]}` : ''}` }
      : { kayit: 'yok', aciklama: 'Progesteron kullanımı yok olarak kayıtlı' }
  if (prog.durum === 'karsilandi') prog.gerekce.push(`Kayıt: ${progKayit.aciklama}`)

  // ── kohort nedenleri (yalnız aktif gebelikte)
  const kohortNedenleri: string[] = []
  if (aktif) {
    if (kisa.durum === 'karsilandi') kohortNedenleri.push(`Kısa serviks: ${enKisa!.mm} mm (${gestasyonMetni(enKisa!.gestasyonGun)})`)
    if (k.pprom.var) kohortNedenleri.push(pprom!.aciklama)
    if (k.oncekiSpontanPreterm === true && gestGun != null && gestGun >= ESIK.pencereBas && gestGun <= ESIK.pencereSon && !tvPencere.length) {
      kohortNedenleri.push(`Önceki spontan erken doğum: ${gestasyonMetni(gestGun)} — 16–24. hafta serviks ölçümü kaydı yok`)
    }
  }
  const riskVar = bayraklar.some((b) => b.durum === 'karsilandi' && b.kod !== 'progesteron_degerlendirme')
  return {
    gestasyonGun: gestGun, trend, bayraklar,
    steroid: { satirlar: steroidSatirlar, guncel: guncelSteroid }, magnezyum, pprom, progesteron: progKayit,
    eksikVeri: eksik, riskVar, kohortNedenleri,
    kaynaklar: [KAYNAK_ACOG_234, KAYNAK_SMFM_70, KAYNAK_FIGO, KAYNAK_CO_713, KAYNAK_MGSO4, KAYNAK_PPROM],
  }
}

/* ───────────────────────────── taburcu paketi (pediatri ön doldurma) ───────────────────────────── */

export interface ErkenDogumOzeti { gestasyonHafta: number | null; steroidKuru: boolean | null; pprom: boolean | null; magnezyum: boolean | null }

/**
 * KD taburcu paketine (bebek_kartlari.erken_dogum_ozeti) taşınan özet: doğumdaki gestasyon haftası, steroid kürü var / yok, PPROM,
 * magnezyum. Kayıt yoksa ya da hepsi bilinmiyorsa null (kart yine yazılır, özet yazılmaz). Bu özet pediatri prematüre planında ÖYKÜdür.
 */
export function kartOzeti(kayit: ErkenDogumKaydi | null | undefined, doguHafta: number | null | undefined): ErkenDogumOzeti | null {
  if (!kayit) return null
  const hf = doguHafta != null && Number.isFinite(Number(doguHafta)) && Number(doguHafta) >= 20 && Number(doguHafta) <= 45 ? Number(doguHafta) : null
  const o: ErkenDogumOzeti = {
    gestasyonHafta: hf,
    steroidKuru: kayit.steroid.kurlar.length ? true : kayit.steroid.yapildi,
    pprom: kayit.pprom.var,
    magnezyum: kayit.magnezyum.verildi,
  }
  return o.steroidKuru == null && o.pprom == null && o.magnezyum == null ? null : o
}
