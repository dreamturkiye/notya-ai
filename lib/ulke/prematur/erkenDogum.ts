/**
 * PREMATUR-ULKE-01 — OBSTETRICS AND GYNAECOLOGY › THE EARLY-BIRTH RECORD, in a country build. Pure, client-safe, no
 * database, no clock. Decision support and a RECORD: the engine shows where a cervical length stands against the
 * thresholds THE PACK states, and the facts the doctor enters. It recommends no dose, orders no test, drug or cerclage and
 * makes no diagnosis; progesterone, steroid and magnesium are facts the doctor enters, not treatments the engine proposes.
 *
 * COUNTRY-NEUTRAL. Every number below is the pack's (`ErkenDogumProtokolu`), each with its source and how it was read. A
 * block the pack could not source is `null` (follow your local protocol): the engine then still keeps the record, the
 * trend and the measurements, and produces NO flag and NO window for that block. The engine answers in codes and numbers;
 * the sentences are the pack's.
 *
 * Gestation: the ultrasound-corrected due date minus 280 days where there is one, otherwise the last menstrual period.
 * There is no validated threshold for the speed of shortening: the trend shows the measurements and the differences, and
 * raises no flag.
 *
 * Same logic as the Türkiye module's specialties/kadin-dogum/engines/erkenDogum.ts (words aside), held equal by the
 * parity test (./prematur.test.ts).
 */
import type { Kaynak, Metin } from './tipler'
import { gecerliGun, gunEkle, gunFarki } from './tarih'
import { gestasyonMetni } from './yas'

export type Yontem = 'transvajinal' | 'transabdominal'
export interface ServiksOlcumu { id: string; tarih: string; gestasyonGun: number; mm: number; yontem: Yontem }
export interface SteroidKuru { id: string; tarih: string }
export interface ErkenDogumKaydi {
  serviks: ServiksOlcumu[]
  /** Previous SPONTANEOUS preterm birth (< 37 weeks). null = not entered. */
  oncekiSpontanPreterm: boolean | null
  pprom: { var: boolean | null; tarih: string | null }
  steroid: { yapildi: boolean | null; kurlar: SteroidKuru[] }
  magnezyum: { verildi: boolean | null; tarih: string | null }
  /** A fact the doctor enters: there is no dose field. */
  progesteron: { kullaniyor: boolean | null; baslangic: string | null; yol: 'vajinal' | 'im' | 'oral' | null }
}

export const BOS_KAYIT: ErkenDogumKaydi = {
  serviks: [], oncekiSpontanPreterm: null, pprom: { var: null, tarih: null },
  steroid: { yapildi: null, kurlar: [] }, magnezyum: { verildi: null, tarih: null }, progesteron: { kullaniyor: null, baslangic: null, yol: null },
}

/* ───────────────────────────── the pack's thresholds ───────────────────────────── */

/** The cervical-length thresholds of the country's source. All lengths in millimetres, all gestations in days. */
export interface ServiksEsikleri {
  /** The window in which a short cervix is defined. */
  pencereBasGun: number
  pencereSonGun: number
  /** The short-cervix length; `kisaDahil` true = "at or below", false = "below". */
  kisaMm: number
  kisaDahil: boolean
  /** An optional second definition (another society's), shown beside the first. */
  digerKisaMm?: number
  digerKisaDahil?: boolean
  /** The length at or below which the source names the progesteron-assessment range, and the upper bound of its shared-decision range; the last day on which the diagnosis counts. null = the source states no such range. */
  progesteron: { sonGun: number; esikMm: number; ustMm: number } | null
  /** Below this length the source names its own band (a very short cervix); null = none. */
  cokKisaMm: number | null
}
/** The antenatal-corticosteroid windows of the country's source, in gestation days. `tekrarGun` = the repeat-course interval the source states, null = it states none (shown nowhere as a rule). */
export interface SteroidPencereleri { yasayabilirlik: number; anaBas: number; anaSon: number; gecBas: number | null; gecSon: number | null; tekrarGun: number | null }

export interface ErkenDogumProtokolu {
  ulke: string
  surum: string
  /** null = the pack states no cervical thresholds (follow your local protocol). */
  serviks: ServiksEsikleri | null
  /** null = the pack states no steroid windows (follow your local protocol). */
  steroid: SteroidPencereleri | null
  /** Every source of the two blocks, each with how it was read. */
  kaynaklar: Kaynak[]
  /** Which block each source belongs to, by the source's short name. */
  serviksKaynaklari: string[]
  steroidKaynaklari: string[]
  /** The note under the record, in the pack's words (what the source's scope is). */
  kapsam: Metin
}

/* ───────────────────────────── helpers ───────────────────────────── */

/** The start of the pregnancy (LMP-equivalent): the corrected due date minus 280 days where there is one, otherwise the LMP. */
export function gebelikBaslangici(sat: string | null | undefined, tdt: string | null | undefined): string | null {
  if (tdt && gecerliGun(tdt.slice(0, 10))) return gunEkle(tdt.slice(0, 10), -280)
  if (sat && gecerliGun(sat.slice(0, 10))) return sat.slice(0, 10)
  return null
}

/** Gestation (days) on a day; null when the start is not known or the value is out of range. */
export function gestasyonGunuTarihte(sat: string | null | undefined, tdt: string | null | undefined, tarihIso: string): number | null {
  const b = gebelikBaslangici(sat, tdt)
  if (!b || !gecerliGun(tarihIso)) return null
  const g = gunFarki(b, tarihIso)
  return g >= 0 && g <= 320 ? g : null
}

/** "22+3" / "22" / "22,3" (decimal weeks) → days. Not valid → null. */
export function gestasyonCoz(ham: string | number | null | undefined): number | null {
  const s = String(ham ?? '').trim().replace(',', '.')
  if (!s) return null
  const m = s.match(/^(\d{1,2})\s*\+\s*([0-6])$/)
  const gun = m ? Number(m[1]) * 7 + Number(m[2]) : Number.isFinite(Number(s)) ? Math.round(Number(s) * 7) : NaN
  return Number.isInteger(gun) && gun >= 14 * 7 && gun <= 42 * 7 ? gun : null
}

/* ───────────────────────────── cleaning (server and browser) ───────────────────────────── */

export type TemizlemeHatasi = 'serviks-tarih' | 'serviks-ileri' | 'serviks-mm' | 'serviks-gestasyon' | 'steroid-tarih' | 'steroid-ileri' | 'ileri-tarih'

export function erkenDogumTemizle(ham: unknown, bugunIso: string): { kayit: ErkenDogumKaydi; hata: TemizlemeHatasi | null } {
  const r = (ham && typeof ham === 'object' && !Array.isArray(ham) ? ham : {}) as Record<string, unknown>
  const bool = (v: unknown): boolean | null => (v === true || v === 'true' ? true : v === false || v === 'false' ? false : null)
  const tarih = (v: unknown): string | null => (typeof v === 'string' && gecerliGun(v.slice(0, 10)) ? v.slice(0, 10) : null)
  let hata: TemizlemeHatasi | null = null
  const hataVer = (m: TemizlemeHatasi) => { if (!hata) hata = m }

  const serviksMap = new Map<string, ServiksOlcumu>()
  for (const x of (Array.isArray(r.serviks) ? r.serviks : []).slice(0, 80)) {
    const o = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>
    const t = tarih(o.tarih)
    const mm = Number(String(o.mm ?? '').replace(',', '.'))
    const g = typeof o.gestasyonGun === 'number' ? o.gestasyonGun : gestasyonCoz(o.gestasyonGun as string)
    const yontem: Yontem = o.yontem === 'transabdominal' ? 'transabdominal' : 'transvajinal'
    if (!t) { hataVer('serviks-tarih'); continue }
    if (t > bugunIso) { hataVer('serviks-ileri'); continue }
    if (!Number.isFinite(mm) || mm <= 0 || mm > 80) { hataVer('serviks-mm'); continue }
    if (g == null || !Number.isInteger(g) || g < 14 * 7 || g > 42 * 7) { hataVer('serviks-gestasyon'); continue }
    serviksMap.set(`${t}-${yontem}`, { id: `${t}-${yontem}`, tarih: t, gestasyonGun: g, mm: Math.round(mm * 10) / 10, yontem })
  }
  const kurMap = new Map<string, SteroidKuru>()
  const st = (r.steroid && typeof r.steroid === 'object' ? r.steroid : {}) as Record<string, unknown>
  for (const x of (Array.isArray(st.kurlar) ? st.kurlar : []).slice(0, 6)) {
    const t = tarih((x as Record<string, unknown>)?.tarih)
    if (!t) { hataVer('steroid-tarih'); continue }
    if (t > bugunIso) { hataVer('steroid-ileri'); continue }
    kurMap.set(t, { id: t, tarih: t })
  }
  const pp = (r.pprom && typeof r.pprom === 'object' ? r.pprom : {}) as Record<string, unknown>
  const magn = (r.magnezyum && typeof r.magnezyum === 'object' ? r.magnezyum : {}) as Record<string, unknown>
  const pg = (r.progesteron && typeof r.progesteron === 'object' ? r.progesteron : {}) as Record<string, unknown>
  const ppVar = bool(pp.var), ppTarih = ppVar ? tarih(pp.tarih) : null
  const mgVar = bool(magn.verildi), mgTarih = mgVar ? tarih(magn.tarih) : null
  const pgVar = bool(pg.kullaniyor), pgBas = pgVar ? tarih(pg.baslangic) : null
  for (const t of [ppTarih, mgTarih, pgBas]) if (t && t > bugunIso) hataVer('ileri-tarih')
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

/* ───────────────────────────── evaluation ───────────────────────────── */

export type BayrakKod = 'onceki_spontan_preterm' | 'kisa_serviks' | 'progesteron_degerlendirme' | 'cok_kisa_serviks' | 'cogul_gebelik' | 'pprom'
export type BayrakDurum = 'karsilandi' | 'karsilanmadi' | 'belirsiz' | 'yerel'

/** Why a flag stands as it does: a code and the numbers the pack's sentence needs. */
export type GerekceKodu =
  | 'oyku-girilmedi' | 'oyku-var' | 'oyku-yok'
  | 'serviks-girilmedi' | 'pencerede-tv-yok' | 'yalniz-ta' | 'tv-yok-pencerede'
  | 'en-kisa' | 'tanimlar' | 'tanim-siniri'
  | 'cogul' | 'tekil'
  | 'prog-cogul' | 'prog-oyku' | 'prog-oyku-girilmedi' | 'prog-gec' | 'prog-esik' | 'prog-aralik' | 'prog-ustunde'
  | 'cok-kisa' | 'cok-kisa-degil'
  | 'pprom-kayit' | 'pprom-girilmedi' | 'pprom-yok' | 'yerel'
export interface Gerekce { kod: GerekceKodu; p?: Record<string, string | number> }
export interface Bayrak { kod: BayrakKod; durum: BayrakDurum; gerekce: Gerekce[]; kaynaklar: string[] }

export interface TrendSatiri { id: string; tarih: string; gestasyon: string; gestasyonGun: number; mm: number; yontem: Yontem; fark: number | null; gunAralik: number | null; pencerede: boolean }
export type SteroidPencere = 'oncesi' | 'yasayabilirlik' | 'ana' | 'gec' | 'disi' | 'bilinmiyor' | 'yerel'
export interface SteroidSatiri { tarih: string; gestasyon: string; pencere: SteroidPencere; oncekindenGun: number | null }

export interface ErkenDogumGirdisi {
  sat: string | null
  tdt: string | null
  /** The multiple-pregnancy type of the pregnancy record: empty or anything but 'tekil' (single) is a multiple pregnancy. */
  cogulTipi: string | null
  durum: 'aktif' | 'dogum_yapti' | string
  kayit: ErkenDogumKaydi
}

/** The engine's input, as the cohort builds it from a stored pregnancy. */
export type GebelikOzetiGirdisi = ErkenDogumGirdisi

export type EksikVeriKodu = 'gebelik-baslangici' | 'oyku' | 'serviks-olcumu'
export type KohortNedeni = { kod: 'kisa-serviks'; mm: number; gestasyon: string } | { kod: 'pprom' } | { kod: 'oyku-olcum-yok'; gestasyon: string }

export interface ErkenDogumSonuc {
  gestasyonGun: number | null
  trend: TrendSatiri[]
  bayraklar: Bayrak[]
  steroid: { satirlar: SteroidSatiri[]; guncel: { pencere: SteroidPencere; gestasyon: string } | null }
  /** The facts as entered, with the gestation of each date. */
  magnezyum: { tarih: string | null; gestasyon: string | null } | null
  pprom: { tarih: string | null; gestasyon: string | null; gunOnce: number | null } | null
  progesteron: { kayit: 'var' | 'yok' | 'girilmedi'; baslangic: string | null; gestasyon: string | null; yol: 'vajinal' | 'im' | 'oral' | null }
  eksikVeri: EksikVeriKodu[]
  /** Any flag met, for the cohort and the card. */
  riskVar: boolean
  kohortNedenleri: KohortNedeni[]
  /** true = the pack states no cervical thresholds: no flag was produced from a measurement. */
  serviksYerel: boolean
  steroidYerel: boolean
}

export function steroidPenceresi(gun: number | null, s: SteroidPencereleri | null): SteroidPencere {
  if (!s) return 'yerel'
  if (gun == null) return 'bilinmiyor'
  if (gun < s.yasayabilirlik) return 'oncesi'
  if (gun < s.anaBas) return 'yasayabilirlik'
  if (gun <= s.anaSon) return 'ana'
  if (s.gecBas != null && s.gecSon != null && gun >= s.gecBas && gun <= s.gecSon) return 'gec'
  return 'disi'
}

export function erkenDogumDegerlendir(g: ErkenDogumGirdisi, bugunIso: string, p: ErkenDogumProtokolu): ErkenDogumSonuc {
  const k = g.kayit
  const sv = p.serviks
  const gestGun = gestasyonGunuTarihte(g.sat, g.tdt, bugunIso)
  const aktif = g.durum === 'aktif'
  const cogul = !!g.cogulTipi && g.cogulTipi !== 'tekil'
  const eksik: EksikVeriKodu[] = []
  if (gebelikBaslangici(g.sat, g.tdt) == null) eksik.push('gebelik-baslangici')
  if (k.oncekiSpontanPreterm == null) eksik.push('oyku')
  if (!k.serviks.length) eksik.push('serviks-olcumu')

  // ── trend (always shown: it is the doctor's own record)
  const sirali = [...k.serviks].sort((a, b) => a.gestasyonGun - b.gestasyonGun || a.tarih.localeCompare(b.tarih))
  let onceki: ServiksOlcumu | null = null
  const pencere = (gun: number) => sv != null && gun >= sv.pencereBasGun && gun <= sv.pencereSonGun
  const trend: TrendSatiri[] = sirali.map((o) => {
    const t: TrendSatiri = {
      id: o.id, tarih: o.tarih, gestasyon: gestasyonMetni(o.gestasyonGun), gestasyonGun: o.gestasyonGun, mm: o.mm, yontem: o.yontem,
      fark: onceki ? Math.round((o.mm - onceki.mm) * 10) / 10 : null, gunAralik: onceki ? gunFarki(onceki.tarih, o.tarih) : null, pencerede: pencere(o.gestasyonGun),
    }
    onceki = o
    return t
  })
  const tvPencere = sirali.filter((o) => o.yontem === 'transvajinal' && pencere(o.gestasyonGun))
  const enKisa = tvPencere.length ? tvPencere.reduce((a, b) => (b.mm < a.mm ? b : a)) : null
  const taOlcum = sirali.filter((o) => o.yontem === 'transabdominal' && pencere(o.gestasyonGun))

  const bayraklar: Bayrak[] = []
  const yerel = (kod: BayrakKod): Bayrak => ({ kod, durum: 'yerel', gerekce: [{ kod: 'yerel' }], kaynaklar: [] })
  const kaynakAdlari = p.serviksKaynaklari

  // ── previous spontaneous preterm birth (a history fact: shown whatever the thresholds)
  bayraklar.push({
    kod: 'onceki_spontan_preterm', durum: k.oncekiSpontanPreterm == null ? 'belirsiz' : k.oncekiSpontanPreterm ? 'karsilandi' : 'karsilanmadi',
    gerekce: k.oncekiSpontanPreterm == null ? [{ kod: 'oyku-girilmedi' }] : k.oncekiSpontanPreterm ? [{ kod: 'oyku-var', p: { adet: tvPencere.length } }] : [{ kod: 'oyku-yok' }],
    kaynaklar: kaynakAdlari,
  })
  if (!sv) {
    // THE PACK STATES NO CERVICAL THRESHOLDS: nothing is flagged from a length.
    bayraklar.push(yerel('kisa_serviks'), yerel('progesteron_degerlendirme'), yerel('cok_kisa_serviks'))
  } else {
    // ── short cervix
    const kisa: Bayrak = { kod: 'kisa_serviks', durum: 'belirsiz', gerekce: [], kaynaklar: kaynakAdlari }
    const asagida = (mm: number, esik: number, dahil: boolean) => (dahil ? mm <= esik : mm < esik)
    if (enKisa) {
      const mm = enKisa.mm
      const birinci = asagida(mm, sv.kisaMm, sv.kisaDahil)
      const diger = sv.digerKisaMm != null ? asagida(mm, sv.digerKisaMm, sv.digerKisaDahil ?? true) : null
      kisa.durum = birinci || diger === true ? 'karsilandi' : 'karsilanmadi'
      kisa.gerekce.push({ kod: 'en-kisa', p: { mm, gestasyon: gestasyonMetni(enKisa.gestasyonGun), tarih: enKisa.tarih } })
      kisa.gerekce.push({ kod: 'tanimlar', p: { birinci: birinci ? 1 : 0, diger: diger == null ? -1 : diger ? 1 : 0 } })
      if (sv.digerKisaMm != null && mm === sv.kisaMm && sv.kisaMm === sv.digerKisaMm) kisa.gerekce.push({ kod: 'tanim-siniri', p: { mm } })
    } else if (k.serviks.length) {
      kisa.gerekce.push({ kod: taOlcum.length ? 'yalniz-ta' : 'tv-yok-pencerede' })
    } else kisa.gerekce.push({ kod: 'serviks-girilmedi' })
    bayraklar.push(kisa)
    // ── the progesterone-assessment range (the source's population only)
    const prog: Bayrak = { kod: 'progesteron_degerlendirme', durum: 'belirsiz', gerekce: [], kaynaklar: kaynakAdlari }
    const pr = sv.progesteron
    if (!pr) prog.durum = 'yerel', prog.gerekce.push({ kod: 'yerel' })
    else if (cogul) { prog.durum = 'karsilanmadi'; prog.gerekce.push({ kod: 'prog-cogul' }) }
    else if (k.oncekiSpontanPreterm === true) { prog.durum = 'karsilanmadi'; prog.gerekce.push({ kod: 'prog-oyku' }) }
    else if (!enKisa) prog.gerekce.push({ kod: k.serviks.length ? 'pencerede-tv-yok' : 'serviks-girilmedi' })
    else if (k.oncekiSpontanPreterm == null) prog.gerekce.push({ kod: 'prog-oyku-girilmedi' })
    else if (enKisa.gestasyonGun > pr.sonGun) { prog.durum = 'karsilanmadi'; prog.gerekce.push({ kod: 'prog-gec', p: { gestasyon: gestasyonMetni(enKisa.gestasyonGun) } }) }
    else if (enKisa.mm <= pr.esikMm) { prog.durum = 'karsilandi'; prog.gerekce.push({ kod: 'prog-esik', p: { mm: enKisa.mm, esik: pr.esikMm } }) }
    else if (enKisa.mm <= pr.ustMm) { prog.durum = 'karsilandi'; prog.gerekce.push({ kod: 'prog-aralik', p: { mm: enKisa.mm, alt: pr.esikMm, ust: pr.ustMm } }) }
    else { prog.durum = 'karsilanmadi'; prog.gerekce.push({ kod: 'prog-ustunde', p: { mm: enKisa.mm, ust: pr.ustMm } }) }
    bayraklar.push(prog)
    // ── the very-short band
    const cokMm = sv.cokKisaMm
    if (cokMm == null) bayraklar.push(yerel('cok_kisa_serviks'))
    else bayraklar.push({
      kod: 'cok_kisa_serviks', durum: enKisa ? (enKisa.mm < cokMm ? 'karsilandi' : 'karsilanmadi') : 'belirsiz', kaynaklar: kaynakAdlari,
      gerekce: [enKisa ? { kod: enKisa.mm < cokMm ? 'cok-kisa' : 'cok-kisa-degil', p: { mm: enKisa.mm, esik: cokMm } } : { kod: 'pencerede-tv-yok' }],
    })
  }
  // ── multiple pregnancy (a record fact)
  bayraklar.push({ kod: 'cogul_gebelik', durum: cogul ? 'karsilandi' : 'karsilanmadi', gerekce: [{ kod: cogul ? 'cogul' : 'tekil', p: { tip: g.cogulTipi ?? '' } }], kaynaklar: kaynakAdlari })
  // ── PPROM (the doctor's record)
  const ppGest = k.pprom.tarih ? gestasyonGunuTarihte(g.sat, g.tdt, k.pprom.tarih) : null
  const ppSure = k.pprom.tarih && aktif ? gunFarki(k.pprom.tarih, bugunIso) : null
  const pprom: ErkenDogumSonuc['pprom'] = k.pprom.var ? { tarih: k.pprom.tarih, gestasyon: ppGest != null ? gestasyonMetni(ppGest) : null, gunOnce: ppSure != null && ppSure >= 0 ? ppSure : null } : null
  bayraklar.push({
    kod: 'pprom', durum: k.pprom.var == null ? 'belirsiz' : k.pprom.var ? 'karsilandi' : 'karsilanmadi', kaynaklar: [],
    gerekce: pprom ? [{ kod: 'pprom-kayit', p: { tarih: pprom.tarih ?? '', gestasyon: pprom.gestasyon ?? '', gunOnce: pprom.gunOnce ?? -1 } }] : [{ kod: k.pprom.var == null ? 'pprom-girilmedi' : 'pprom-yok' }],
  })

  // ── steroid log
  const steroidSatirlar: SteroidSatiri[] = k.steroid.kurlar.map((c, i, a) => {
    const gg = gestasyonGunuTarihte(g.sat, g.tdt, c.tarih)
    return { tarih: c.tarih, gestasyon: gestasyonMetni(gg), pencere: steroidPenceresi(gg, p.steroid), oncekindenGun: i ? gunFarki(a[i - 1].tarih, c.tarih) : null }
  })
  const guncelSteroid = aktif && gestGun != null ? { pencere: steroidPenceresi(gestGun, p.steroid), gestasyon: gestasyonMetni(gestGun) } : null

  const mgGest = k.magnezyum.tarih ? gestasyonGunuTarihte(g.sat, g.tdt, k.magnezyum.tarih) : null
  const magnezyum = k.magnezyum.verildi ? { tarih: k.magnezyum.tarih, gestasyon: mgGest != null ? gestasyonMetni(mgGest) : null } : null
  const pg = k.progesteron
  const pgGest = pg.baslangic ? gestasyonGunuTarihte(g.sat, g.tdt, pg.baslangic) : null
  const progesteron: ErkenDogumSonuc['progesteron'] = pg.kullaniyor == null ? { kayit: 'girilmedi', baslangic: null, gestasyon: null, yol: null }
    : pg.kullaniyor ? { kayit: 'var', baslangic: pg.baslangic, gestasyon: pgGest != null ? gestasyonMetni(pgGest) : null, yol: pg.yol }
      : { kayit: 'yok', baslangic: null, gestasyon: null, yol: null }

  // ── cohort reasons (an active pregnancy only)
  const kohortNedenleri: KohortNedeni[] = []
  const kisaBayrak = bayraklar.find((b) => b.kod === 'kisa_serviks')!
  if (aktif) {
    if (kisaBayrak.durum === 'karsilandi' && enKisa) kohortNedenleri.push({ kod: 'kisa-serviks', mm: enKisa.mm, gestasyon: gestasyonMetni(enKisa.gestasyonGun) })
    if (k.pprom.var) kohortNedenleri.push({ kod: 'pprom' })
    if (sv && k.oncekiSpontanPreterm === true && gestGun != null && pencere(gestGun) && !tvPencere.length) kohortNedenleri.push({ kod: 'oyku-olcum-yok', gestasyon: gestasyonMetni(gestGun) })
  }
  const riskVar = bayraklar.some((b) => b.durum === 'karsilandi' && b.kod !== 'progesteron_degerlendirme')
  return {
    gestasyonGun: gestGun, trend, bayraklar, steroid: { satirlar: steroidSatirlar, guncel: guncelSteroid }, magnezyum, pprom, progesteron,
    eksikVeri: eksik, riskVar, kohortNedenleri, serviksYerel: !sv, steroidYerel: !p.steroid,
  }
}

/* ───────────────────────────── the discharge-pack summary ───────────────────────────── */

export interface ErkenDogumOzeti { gestasyonHafta: number | null; steroidKuru: boolean | null; pprom: boolean | null; magnezyum: boolean | null }

/** What the mother's record gives the baby's plan as HISTORY: steroid course yes / no, PPROM, magnesium. null = nothing known. */
export function ozetCikar(kayit: ErkenDogumKaydi | null | undefined, doguHafta: number | null | undefined): ErkenDogumOzeti | null {
  if (!kayit) return null
  const hf = doguHafta != null && Number.isFinite(Number(doguHafta)) && Number(doguHafta) >= 20 && Number(doguHafta) <= 45 ? Number(doguHafta) : null
  const o: ErkenDogumOzeti = { gestasyonHafta: hf, steroidKuru: kayit.steroid.kurlar.length ? true : kayit.steroid.yapildi, pprom: kayit.pprom.var, magnezyum: kayit.magnezyum.verildi }
  return o.steroidKuru == null && o.pprom == null && o.magnezyum == null ? null : o
}
