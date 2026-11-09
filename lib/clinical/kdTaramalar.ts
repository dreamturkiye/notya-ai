/**
 * KD-TARAMA-01 (Kaan, 2026-11-09) — four obstetric and gynaecological records, SHARED ENGINE. Byte-identical on main and
 * the six release branches (us, gb, ca, au, nz, uz), so the same entry gives the same flag in every country.
 *
 *   1. Thyroid in pregnancy   trimester-specific TSH / free T4 reference handling with a flag, the booking-visit TSH
 *                             prompt, hypo- / hyperthyroid follow-up points, and the clinician's own levothyroxine note.
 *   2. HPV vaccination        a dose record and the schedule by age at the first dose and immune status.
 *   3. SMA carrier screening  status, the SMN1 copy number as the laboratory reported it, the partner-testing prompt and
 *                             the genetic-counselling referral.
 *   4. PMS / PMDD             an ORIGINAL prospective daily diary (not the DRSP, whose commercial licence could not be
 *                             confirmed) scored against the structure of the DSM-5-TR PMDD criteria, and the criteria as a
 *                             checklist the doctor ticks.
 *
 * RULES OF THIS FILE (verbatim intent of the brief):
 *   - CODES ONLY. Every word is the build's: the Türkiye chapter writes Turkish, each country pack its own language.
 *   - NO NUMBER OF ITS OWN. Every threshold, interval and age band is handed in by the caller as a rule set
 *     (`TiroidKurali`, `HpvKurali`) that carries the source it was read from. A rule the source does not state is left
 *     null, and the engine then says "no range" / "no rule" instead of guessing.
 *   - NO DOSE. The levothyroxine note is the clinician's own words; the engine never proposes an amount.
 *   - NO DIAGNOSIS. A flag, a prompt or a diary pattern is decision support; the doctor writes the diagnosis.
 *
 * The four structures DSM-5-TR names for PMDD (criterion A: at least five symptoms in the final week before menses,
 * improving within a few days after onset and minimal or absent in the week after menses; B: at least one of four;
 * C: one or more of seven more, to reach five; F: confirmed by prospective daily ratings over at least two symptomatic
 * cycles, otherwise "provisional") are used as structure only. American Psychiatric Association, DSM-5-TR (2022),
 * Premenstrual Dysphoric Disorder; structure read on PsychDB (DSM-5 wording; the PMDD criteria were not changed in the
 * text revision), 2026-11-09. No criterion text is reproduced here.
 */

// ───────────────────────────── shared helpers ─────────────────────────────

const GUN_MS = 86_400_000
const tarihMi = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`))
const sayiMi = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)
/** YYYY-MM-DD plus n days (UTC calendar arithmetic, no time zone drift). */
export function gunEkle(t: string, n: number): string {
  return new Date(Date.parse(`${t}T00:00:00Z`) + n * GUN_MS).toISOString().slice(0, 10)
}
/** Whole months after a calendar day (day-of-month kept; the month's last day when it does not exist). */
export function ayEkle(t: string, ay: number): string {
  const [y, m, d] = t.split('-').map(Number)
  const son = new Date(Date.UTC(y, m - 1 + ay + 1, 0)).getUTCDate()
  return new Date(Date.UTC(y, m - 1 + ay, Math.min(d, son))).toISOString().slice(0, 10)
}
const gunFarki = (a: string, b: string) => Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / GUN_MS)

// ───────────────────────────── 1. thyroid in pregnancy ─────────────────────────────

export type Trimester = 1 | 2 | 3

/** Same cut as lib/clinical/gebelik.ts (gebelikYasi): week < 14 → first, < 28 → second, otherwise third. */
export function trimesterHaftadan(hafta: number | null | undefined): Trimester | null {
  if (!sayiMi(hafta) || hafta < 0 || hafta > 45) return null
  return hafta < 14 ? 1 : hafta < 28 ? 2 : 3
}

/**
 * THE COUNTRY'S RULE for the reference range when the laboratory has no pregnancy-specific one, and for follow-up.
 * Every number is the source's; `null` = the source states none (the engine then gives no range / no point).
 */
export type TiroidKurali = {
  /** Code of the source the numbers were read from (the build names it in words). */
  kaynak: string
  /** First trimester: how much LOWER than the laboratory's non-pregnant range the lower / upper limit is. */
  t1AltDusus: number | null
  t1UstDusus: number | null
  /** The week from which that first-trimester adjustment applies (null = the whole first trimester). */
  t1BaslangicHafta: number | null
  /** Second and third trimester: the non-pregnant range applies as it is (true only where the source says so). */
  t23GebelikDisi: boolean
  /** A fixed upper TSH limit the source allows when no other range is available, and the weeks it covers. */
  sabitUst: number | null
  sabitBasHafta: number | null
  sabitSonHafta: number | null
  /** The treatment target of a woman on levothyroxine: a fixed upper TSH per trimester, or "the lower half of the range". */
  hedefT1Ust: number | null
  hedefT23Ust: number | null
  hedefAltYari: boolean
  /** Follow-up of treated hypothyroidism: every n weeks up to week m, plus one check near week k; postpartum check at week p. */
  hipoAralikHafta: number | null
  hipoSonHafta: number | null
  hipoEkHafta: number | null
  postpartumHafta: number | null
  /** Follow-up of hyperthyroidism on treatment: every n weeks. */
  hiperAralikHafta: number | null
  /** TSH receptor antibody windows (weeks, inclusive), each with its own condition in the build's words. */
  trabPencereleri: ReadonlyArray<readonly [number, number]>
  /** Euthyroid antibody-positive women: TSH every n weeks up to week m. */
  antikorAralikHafta: number | null
  antikorSonHafta: number | null
  /** Booking visit: 'evrensel' = test everyone; 'risk' = test when a listed risk factor is present (codes below). */
  tarama: 'evrensel' | 'risk'
  /** The risk-factor codes this source lists (a subset of TIROID_RISK_FAKTORLERI). Empty for universal screening. */
  riskFaktorleri: readonly TiroidRiskFaktoru[]
}

/** Risk factors for a booking-visit TSH, as codes (American Thyroid Association 2017, Recommendation 97, eleven items). */
export const TIROID_RISK_FAKTORLERI = [
  'oyku_tiroid_disfonksiyon', 'belirti_tiroid', 'antikor_veya_guatr', 'bas_boyun_radyasyon_cerrahi', 'yas_30_ustu',
  'tip1_diyabet', 'diger_otoimmun', 'gebelik_kaybi_preterm_infertilite', 'iki_veya_daha_fazla_gebelik', 'aile_oykusu',
  'morbid_obezite', 'amiodaron_lityum_kontrast', 'iyot_eksikligi_bolgesi',
] as const
export type TiroidRiskFaktoru = (typeof TIROID_RISK_FAKTORLERI)[number]

export type TiroidAralikKaynagi = 'laboratuvar' | 'yedek_duzeltilmis' | 'yedek_gebelik_disi' | 'yedek_sabit' | 'yok'
export type TiroidBayrak = 'aralikta' | 'yuksek' | 'dusuk' | 'aralik_yok' | 'deger_yok'

export type TiroidOlcumGirdisi = {
  /** Completed weeks of gestation on the day of the sample. */
  hafta: number | null
  tsh?: number | null
  /** The laboratory's own pregnancy- / trimester-specific TSH range for this trimester (preferred by every source). */
  labTshAlt?: number | null
  labTshUst?: number | null
  /** The laboratory's NON-pregnant TSH range (the base of a fallback adjustment). */
  gebelikDisiTshAlt?: number | null
  gebelikDisiTshUst?: number | null
  /** Free T4 is flagged only against a method- and trimester-specific range the laboratory reports (never a fallback). */
  ft4?: number | null
  labFt4Alt?: number | null
  labFt4Ust?: number | null
  /** On levothyroxine: the treatment target is checked too. */
  lt4Tedavisi?: boolean
}

export type TiroidDegerlendirme = {
  trimester: Trimester | null
  tsh: { bayrak: TiroidBayrak; alt: number | null; ust: number | null; kaynak: TiroidAralikKaynagi }
  ft4: { bayrak: TiroidBayrak; alt: number | null; ust: number | null }
  /** Only for a woman on levothyroxine: 'hedef_ustu' = TSH above the source's treatment target; null = no target applies. */
  hedef: 'hedefte' | 'hedef_ustu' | null
  hedefUst: number | null
}

function bayrak(deger: number | null | undefined, alt: number | null, ust: number | null): TiroidBayrak {
  if (!sayiMi(deger)) return 'deger_yok'
  if (alt === null && ust === null) return 'aralik_yok'
  if (ust !== null && deger > ust) return 'yuksek'
  if (alt !== null && deger < alt) return 'dusuk'
  return 'aralikta'
}
const yuvarla = (x: number) => Math.round(x * 1000) / 1000
const pozitifVeya = (x: number | null | undefined): number | null => (sayiMi(x) && x >= 0 ? x : null)

/**
 * TSH and free T4 against the right range: the laboratory's pregnancy range first (every source); otherwise the source's
 * fallback on the laboratory's non-pregnant range; otherwise the source's fixed upper limit in the weeks it covers;
 * otherwise "no range" (no flag is invented).
 */
export function tiroidDegerlendir(g: TiroidOlcumGirdisi, k: TiroidKurali): TiroidDegerlendirme {
  const trimester = trimesterHaftadan(g.hafta)
  const hafta = sayiMi(g.hafta) ? g.hafta : null
  const labAlt = pozitifVeya(g.labTshAlt), labUst = pozitifVeya(g.labTshUst)
  const gdAlt = pozitifVeya(g.gebelikDisiTshAlt), gdUst = pozitifVeya(g.gebelikDisiTshUst)
  let alt: number | null = null, ust: number | null = null, kaynak: TiroidAralikKaynagi = 'yok'
  if (labAlt !== null || labUst !== null) { alt = labAlt; ust = labUst; kaynak = 'laboratuvar' }
  else if ((gdAlt !== null || gdUst !== null) && trimester !== null && hafta !== null) {
    if (trimester === 1 && (k.t1AltDusus !== null || k.t1UstDusus !== null) && (k.t1BaslangicHafta === null || hafta >= k.t1BaslangicHafta)) {
      alt = gdAlt !== null && k.t1AltDusus !== null ? yuvarla(Math.max(0, gdAlt - k.t1AltDusus)) : null
      ust = gdUst !== null && k.t1UstDusus !== null ? yuvarla(gdUst - k.t1UstDusus) : null
      if (alt !== null || ust !== null) kaynak = 'yedek_duzeltilmis'
    } else if (trimester > 1 && k.t23GebelikDisi) { alt = gdAlt; ust = gdUst; kaynak = 'yedek_gebelik_disi' }
  }
  if (kaynak === 'yok' && k.sabitUst !== null && hafta !== null
    && (k.sabitBasHafta === null || hafta >= k.sabitBasHafta) && (k.sabitSonHafta === null || hafta <= k.sabitSonHafta)) {
    alt = null; ust = k.sabitUst; kaynak = 'yedek_sabit'
  }
  const fAlt = pozitifVeya(g.labFt4Alt), fUst = pozitifVeya(g.labFt4Ust)
  let hedef: TiroidDegerlendirme['hedef'] = null, hedefUst: number | null = null
  if (g.lt4Tedavisi && sayiMi(g.tsh) && trimester !== null) {
    const sabit = trimester === 1 ? k.hedefT1Ust : k.hedefT23Ust
    if (sabit !== null) hedefUst = sabit
    else if (k.hedefAltYari && alt !== null && ust !== null) hedefUst = yuvarla((alt + ust) / 2)
    if (hedefUst !== null) hedef = sabit !== null ? (g.tsh >= hedefUst ? 'hedef_ustu' : 'hedefte') : (g.tsh > hedefUst ? 'hedef_ustu' : 'hedefte')
  }
  return {
    trimester,
    tsh: { bayrak: bayrak(g.tsh, alt, ust), alt, ust, kaynak },
    ft4: { bayrak: bayrak(g.ft4, fAlt, fUst), alt: fAlt, ust: fUst },
    hedef, hedefUst,
  }
}

/** Booking visit: should the screen prompt a TSH? Universal sources always (until a TSH is recorded); risk sources on a listed factor. */
export function tiroidTaramaIstemi(k: TiroidKurali, g: { tshKayitli: boolean; riskler: readonly string[] }): { goster: boolean; neden: 'evrensel' | 'risk' | null; eslesen: TiroidRiskFaktoru[] } {
  const eslesen = k.riskFaktorleri.filter((r) => g.riskler.includes(r))
  if (g.tshKayitli) return { goster: false, neden: null, eslesen }
  if (k.tarama === 'evrensel') return { goster: true, neden: 'evrensel', eslesen }
  return eslesen.length ? { goster: true, neden: 'risk', eslesen } : { goster: false, neden: null, eslesen }
}

export const TIROID_DURUMLARI = ['yok', 'hipotiroidi', 'hipertiroidi', 'antikor_pozitif'] as const
export type TiroidDurumu = (typeof TIROID_DURUMLARI)[number]
export type TiroidTakipNoktasi = { kod: 'tsh_kontrol' | 'tsh_ek' | 'postpartum_tft' | 'tft_kontrol' | 'trab'; haftaBas: number; haftaSon: number; durum: 'gecti' | 'simdi' | 'ileride' }

/**
 * Follow-up points on the pregnancy timeline for the recorded thyroid status, from the source's intervals only.
 * `buHafta` = today's completed week; points before it are 'gecti'. The postpartum point is in weeks AFTER birth
 * (`haftaBas` = the source's week, shown by the build as "postpartum week n").
 */
export function tiroidTakipNoktalari(durum: TiroidDurumu, buHafta: number | null, k: TiroidKurali): TiroidTakipNoktasi[] {
  const out: TiroidTakipNoktasi[] = []
  const d = (bas: number, son: number): TiroidTakipNoktasi['durum'] => (buHafta === null ? 'ileride' : buHafta > son ? 'gecti' : buHafta >= bas ? 'simdi' : 'ileride')
  const seri = (kod: TiroidTakipNoktasi['kod'], aralik: number | null, sonHafta: number | null) => {
    if (aralik === null || aralik <= 0 || sonHafta === null) return
    const bas = buHafta === null ? aralik : Math.max(0, Math.floor(buHafta))
    for (let h = bas; h <= sonHafta; h += aralik) out.push({ kod, haftaBas: h, haftaSon: h, durum: d(h, h) })
  }
  if (durum === 'hipotiroidi') {
    seri('tsh_kontrol', k.hipoAralikHafta, k.hipoSonHafta)
    if (k.hipoEkHafta !== null) out.push({ kod: 'tsh_ek', haftaBas: k.hipoEkHafta, haftaSon: k.hipoEkHafta, durum: d(k.hipoEkHafta, k.hipoEkHafta) })
    if (k.postpartumHafta !== null) out.push({ kod: 'postpartum_tft', haftaBas: k.postpartumHafta, haftaSon: k.postpartumHafta, durum: 'ileride' })
  } else if (durum === 'hipertiroidi') {
    // the source gives an interval and no end: only the NEXT check is shown (no horizon of the engine's own)
    if (k.hiperAralikHafta !== null && k.hiperAralikHafta > 0 && buHafta !== null) {
      const h = Math.floor(buHafta) + k.hiperAralikHafta
      out.push({ kod: 'tft_kontrol', haftaBas: h, haftaSon: h, durum: 'ileride' })
    }
    for (const [b, s] of k.trabPencereleri) out.push({ kod: 'trab', haftaBas: b, haftaSon: s, durum: d(b, s) })
  } else if (durum === 'antikor_pozitif') {
    seri('tsh_kontrol', k.antikorAralikHafta, k.antikorSonHafta)
  }
  return out
}

/** Calendar date of a gestational week, from a dated sample at a known week (the build shows it beside the week). */
export function haftaTarihi(olcumTarihi: string, olcumHaftasi: number, hedefHafta: number): string | null {
  if (!tarihMi(olcumTarihi) || !sayiMi(olcumHaftasi) || !sayiMi(hedefHafta)) return null
  return gunEkle(olcumTarihi, Math.round((hedefHafta - olcumHaftasi) * 7))
}

/** The clinician's own levothyroxine note: kept only as written (never parsed into an amount, never proposed). */
export function lt4NotuDogrula(x: unknown): { ok: true; metin: string } | { ok: false; hata: 'bos' | 'uzun' } {
  const metin = typeof x === 'string' ? x.trim() : ''
  if (!metin) return { ok: false, hata: 'bos' }
  if (metin.length > 300) return { ok: false, hata: 'uzun' }
  return { ok: true, metin }
}

// ───────────────────────────── 2. HPV vaccination ─────────────────────────────

export const HPV_ASI_TIPLERI = ['2v', '4v', '9v', 'bilinmiyor'] as const
export type HpvAsiTipi = (typeof HPV_ASI_TIPLERI)[number]
export const HPV_IMMUN = ['normal', 'baskilanmis'] as const
export type HpvImmun = (typeof HPV_IMMUN)[number]

/** A later dose's window after the FIRST dose, as the source states it (months or weeks; either bound may be absent). */
export type HpvAralik = { doz: number; enAzAy?: number; enCokAy?: number; enAzHafta?: number }
/** One row of a country's schedule: age at the first dose (years, inclusive), immune status, the dose counts the source allows. */
export type HpvSatiri = {
  yasAlt: number
  yasUst: number | null
  immun: HpvImmun | 'hepsi'
  /** e.g. [1, 2] = "a one or two-dose schedule": the course is complete at the smallest. */
  dozlar: readonly number[]
  araliklar?: readonly HpvAralik[]
  /** "Two doses less than n months apart need a third" (where the source says so). */
  kisaAralik?: { enAzAy: number; ekDoz: number }
}
export type HpvKurali = { kaynak: string; satirlar: readonly HpvSatiri[] }
export type HpvDoz = { no: number; tarih: string; tip?: HpvAsiTipi }

export type HpvPlani = {
  satir: HpvSatiri | null
  durum: 'tamamlandi' | 'devam' | 'kural_yok' | 'kayit_yok'
  gereken: number | null
  yapilan: number
  sonraki: { no: number; enErken: string | null; enGec: string | null } | null
  uyarilar: Array<'kisa_aralik_ek_doz' | 'sira_hatali' | 'aralik_erken'>
}

/** The rule row that applies: the first row whose age band and immune status match (the source's order). */
export function hpvSatiri(k: HpvKurali, ilkDozYasi: number, immun: HpvImmun): HpvSatiri | null {
  return k.satirlar.find((s) => ilkDozYasi >= s.yasAlt && (s.yasUst === null || ilkDozYasi <= s.yasUst) && (s.immun === 'hepsi' || s.immun === immun)) ?? null
}

export function hpvPlani(g: { ilkDozYasi: number | null; immun: HpvImmun; dozlar: readonly HpvDoz[] }, k: HpvKurali): HpvPlani {
  const dozlar = [...g.dozlar].filter((d) => tarihMi(d.tarih)).sort((a, b) => a.tarih.localeCompare(b.tarih))
  const uyarilar: HpvPlani['uyarilar'] = []
  if (dozlar.some((d, i) => d.no !== i + 1)) uyarilar.push('sira_hatali')
  if (!dozlar.length) return { satir: null, durum: 'kayit_yok', gereken: null, yapilan: 0, sonraki: null, uyarilar }
  const satir = sayiMi(g.ilkDozYasi) ? hpvSatiri(k, g.ilkDozYasi, g.immun) : null
  if (!satir) return { satir: null, durum: 'kural_yok', gereken: null, yapilan: dozlar.length, sonraki: null, uyarilar }
  let gereken = Math.min(...satir.dozlar)
  const ilk = dozlar[0].tarih
  if (satir.kisaAralik && dozlar.length >= 2 && gunFarki(dozlar[1].tarih, ayEkle(ilk, satir.kisaAralik.enAzAy)) < 0) {
    gereken = Math.max(gereken, satir.kisaAralik.ekDoz); uyarilar.push('kisa_aralik_ek_doz')
  }
  for (let i = 1; i < dozlar.length; i++) {
    const a = satir.araliklar?.find((x) => x.doz === i + 1)
    if (!a) continue
    const enErken = a.enAzAy !== undefined ? ayEkle(ilk, a.enAzAy) : a.enAzHafta !== undefined ? gunEkle(ilk, a.enAzHafta * 7) : null
    if (enErken && dozlar[i].tarih < enErken && !uyarilar.includes('aralik_erken')) uyarilar.push('aralik_erken')
  }
  if (dozlar.length >= gereken) return { satir, durum: 'tamamlandi', gereken, yapilan: dozlar.length, sonraki: null, uyarilar }
  const no = dozlar.length + 1
  const a = satir.araliklar?.find((x) => x.doz === no)
  const enErken = a ? (a.enAzAy !== undefined ? ayEkle(ilk, a.enAzAy) : a.enAzHafta !== undefined ? gunEkle(ilk, a.enAzHafta * 7) : null) : null
  const enGec = a && a.enCokAy !== undefined ? ayEkle(ilk, a.enCokAy) : null
  return { satir, durum: 'devam', gereken, yapilan: dozlar.length, sonraki: { no, enErken, enGec }, uyarilar }
}

/** Whole years of age on a day (birth date and day as YYYY-MM-DD). */
export function yasTarihte(dogum: string | null | undefined, gun: string): number | null {
  if (!tarihMi(dogum) || !tarihMi(gun) || gun < dogum) return null
  const [y1, m1, d1] = dogum.split('-').map(Number), [y2, m2, d2] = gun.split('-').map(Number)
  return y2 - y1 - (m2 < m1 || (m2 === m1 && d2 < d1) ? 1 : 0)
}

// ───────────────────────────── 3. SMA carrier screening ─────────────────────────────

export const SMA_DURUMLARI = ['teklif_edilmedi', 'teklif_edildi', 'reddetti', 'yapildi'] as const
export type SmaDurumu = (typeof SMA_DURUMLARI)[number]
/** The laboratory's own interpretation, as reported. The engine never derives carrier status from a copy number. */
export const SMA_SONUCLARI = ['tasiyici', 'tasiyici_degil', 'belirsiz'] as const
export type SmaSonucu = (typeof SMA_SONUCLARI)[number]
export const SMA_ES_DURUMLARI = ['istenmedi', 'istendi', 'yapildi'] as const
export type SmaEsDurumu = (typeof SMA_ES_DURUMLARI)[number]

export type SmaKaydi = {
  durum: SmaDurumu
  tarih?: string | null
  sonuc?: SmaSonucu | null
  /** The SMN1 copy number exactly as written on the report (e.g. "1", "2", "≥3"). Text, never interpreted. */
  smn1Kopya?: string | null
  esDurumu?: SmaEsDurumu | null
  esSonucu?: SmaSonucu | null
  esSmn1Kopya?: string | null
  genetikDanisma?: 'yonlendirildi' | 'yonlendirilmedi' | null
}
export type SmaDegerlendirme =
  | { ok: false; hata: 'durum' | 'sonuc_gerekli' | 'sonuc_yalniz_yapildi' | 'kopya_bicimi' | 'es_sonucu_gerekli' | 'tarih' }
  | { ok: true; kayit: SmaKaydi; esTestiIstemi: boolean; genetikDanismaIstemi: boolean; ciftTasiyici: boolean }

const KOPYA = /^(?:[0-9]|≥\s?[0-9]|>=\s?[0-9]|[0-9]\s?\+\s?[0-9])$/

export function smaDegerlendir(x: Partial<SmaKaydi>): SmaDegerlendirme {
  if (!x || !(SMA_DURUMLARI as readonly string[]).includes(String(x.durum))) return { ok: false, hata: 'durum' }
  if (x.tarih != null && x.tarih !== '' && !tarihMi(x.tarih)) return { ok: false, hata: 'tarih' }
  const yapildi = x.durum === 'yapildi'
  const sonuc = x.sonuc && (SMA_SONUCLARI as readonly string[]).includes(x.sonuc) ? x.sonuc : null
  if (yapildi && !sonuc) return { ok: false, hata: 'sonuc_gerekli' }
  if (!yapildi && (sonuc || (x.smn1Kopya ?? '').trim())) return { ok: false, hata: 'sonuc_yalniz_yapildi' }
  const kopya = (x.smn1Kopya ?? '').trim() || null
  const esKopya = (x.esSmn1Kopya ?? '').trim() || null
  if ((kopya && !KOPYA.test(kopya)) || (esKopya && !KOPYA.test(esKopya))) return { ok: false, hata: 'kopya_bicimi' }
  const esDurumu = x.esDurumu && (SMA_ES_DURUMLARI as readonly string[]).includes(x.esDurumu) ? x.esDurumu : null
  const esSonucu = x.esSonucu && (SMA_SONUCLARI as readonly string[]).includes(x.esSonucu) ? x.esSonucu : null
  if (esDurumu === 'yapildi' && !esSonucu) return { ok: false, hata: 'es_sonucu_gerekli' }
  const tasiyici = sonuc === 'tasiyici'
  const ciftTasiyici = tasiyici && esSonucu === 'tasiyici'
  const kayit: SmaKaydi = {
    durum: x.durum as SmaDurumu, tarih: x.tarih || null, sonuc, smn1Kopya: kopya,
    esDurumu, esSonucu: esDurumu === 'yapildi' ? esSonucu : null, esSmn1Kopya: esDurumu === 'yapildi' ? esKopya : null,
    genetikDanisma: x.genetikDanisma === 'yonlendirildi' || x.genetikDanisma === 'yonlendirilmedi' ? x.genetikDanisma : null,
  }
  return {
    ok: true, kayit,
    // the partner-testing prompt: a carrier result whose partner has not been tested yet
    esTestiIstemi: tasiyici && esDurumu !== 'yapildi',
    // the genetic-counselling referral: any carrier result (or an unclear one) not referred yet
    genetikDanismaIstemi: (tasiyici || sonuc === 'belirsiz') && kayit.genetikDanisma !== 'yonlendirildi',
    ciftTasiyici,
  }
}

// ───────────────────────────── 4. PMS / PMDD prospective diary ─────────────────────────────

/** Eleven symptom domains in the order of DSM-5-TR criterion B (four) and C (seven). Words: the build's own. */
export const PMDD_B_ALANLARI = ['b1', 'b2', 'b3', 'b4'] as const
export const PMDD_C_ALANLARI = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7'] as const
export const PMDD_ALANLARI = [...PMDD_B_ALANLARI, ...PMDD_C_ALANLARI] as const
export type PmddAlani = (typeof PMDD_ALANLARI)[number]
/** Three areas of daily life (criterion D is the doctor's judgement; the diary only shows them). */
export const PMDD_ISLEV_ALANLARI = ['is_okul', 'sosyal', 'iliskiler'] as const
export type PmddIslevAlani = (typeof PMDD_ISLEV_ALANLARI)[number]
/**
 * The diary's OWN six-point scale (0..5), each point a word: 0 none, 1 minimal, 2 mild, 3 moderate, 4 marked, 5 severe.
 * DESIGN CHOICE OF THIS DIARY, NOT A VALIDATED CUT-OFF: "minimal or absent" (criterion A) is read as 0–1, "marked" (the
 * word of every criterion-B item) as 4–5, and "present" for a criterion-C item as 2 or more. Said wherever the result
 * is shown; the doctor's checklist decides.
 */
export const PMDD_PUAN_EN_AZ = 0
export const PMDD_PUAN_EN_COK = 5
export const PMDD_MINIMAL_UST = 1
export const PMDD_BELIRGIN_ALT = 4
export const PMDD_VAR_ALT = 2
/** DSM-5-TR numbers: five symptoms in total, at least one of criterion B, at least two symptomatic cycles. */
export const PMDD_TOPLAM_EN_AZ = 5
export const PMDD_B_EN_AZ = 1
export const PMDD_DONGU_EN_AZ = 2
/** The two windows of criterion A, in days. */
export const PMDD_PENCERE_GUN = 7

export type PmddGunGirdisi = {
  tarih: string
  /** Menstrual bleeding on this day. */
  adet: boolean
  puan: Partial<Record<PmddAlani, number>>
  islev?: Partial<Record<PmddIslevAlani, number>>
}

export function pmddGunDogrula(x: unknown): { ok: true; gun: PmddGunGirdisi } | { ok: false; hata: 'tarih' | 'puan' | 'bos' } {
  const o = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>
  if (!tarihMi(o.tarih)) return { ok: false, hata: 'tarih' }
  const puanHam = (o.puan && typeof o.puan === 'object' ? o.puan : {}) as Record<string, unknown>
  const islevHam = (o.islev && typeof o.islev === 'object' ? o.islev : {}) as Record<string, unknown>
  const puan: Partial<Record<PmddAlani, number>> = {}, islev: Partial<Record<PmddIslevAlani, number>> = {}
  const gecerli = (v: unknown) => Number.isInteger(v) && (v as number) >= PMDD_PUAN_EN_AZ && (v as number) <= PMDD_PUAN_EN_COK
  for (const [k, v] of Object.entries(puanHam)) { if (!(PMDD_ALANLARI as readonly string[]).includes(k)) continue; if (!gecerli(v)) return { ok: false, hata: 'puan' }; puan[k as PmddAlani] = v as number }
  for (const [k, v] of Object.entries(islevHam)) { if (!(PMDD_ISLEV_ALANLARI as readonly string[]).includes(k)) continue; if (!gecerli(v)) return { ok: false, hata: 'puan' }; islev[k as PmddIslevAlani] = v as number }
  if (!Object.keys(puan).length && o.adet !== true) return { ok: false, hata: 'bos' }
  return { ok: true, gun: { tarih: o.tarih, adet: o.adet === true, puan, islev } }
}

export type PmddPencere = { bas: string; son: string; tam: boolean; eksikGun: number }
export type PmddDongu = {
  /** First day of the bleeding the cycle is evaluated around. */
  adetBaslangici: string
  adetSonu: string
  once: PmddPencere
  sonra: PmddPencere
  alanlar: Record<PmddAlani, { onceEnYuksek: number | null; sonraEnYuksek: number | null; karsilar: boolean | null }>
  karsilayan: number
  bKarsilayan: number
  /** true = the diary shows the criterion-A pattern in this cycle; false = it does not; null = a window is incomplete. */
  oruntu: boolean | null
}
export type PmddOzeti = { donguler: PmddDongu[]; degerlendirilebilir: number; oruntuDongu: number; ikiDonguTamam: boolean }

/**
 * One domain in one cycle: present before (criterion-B domains "marked", 4–5; criterion-C domains 2 or more) AND minimal or
 * absent after (0–1). `once` / `sonra` = the HIGHEST rating of the 7 days before menses / after the bleeding.
 */
export function pmddAlanKarsilar(alan: PmddAlani, once: number | null, sonra: number | null): boolean {
  const esik = (PMDD_B_ALANLARI as readonly string[]).includes(alan) ? PMDD_BELIRGIN_ALT : PMDD_VAR_ALT
  return once !== null && once >= esik && sonra !== null && sonra <= PMDD_MINIMAL_UST
}
/** One cycle from the highest ratings per domain: how many domains meet, how many of criterion B, and the criterion-A pattern. */
export function pmddDonguSonucu(enYuksekler: Partial<Record<PmddAlani, { once: number | null; sonra: number | null }>>): { karsilayan: number; bKarsilayan: number; oruntu: boolean } {
  let karsilayan = 0, bKarsilayan = 0
  for (const a of PMDD_ALANLARI) {
    const d = enYuksekler[a]
    if (d && pmddAlanKarsilar(a, d.once, d.sonra)) { karsilayan++; if ((PMDD_B_ALANLARI as readonly string[]).includes(a)) bKarsilayan++ }
  }
  return { karsilayan, bKarsilayan, oruntu: karsilayan >= PMDD_TOPLAM_EN_AZ && bKarsilayan >= PMDD_B_EN_AZ }
}

/** Bleeding episodes from the daily entries: a run of consecutive days marked as bleeding. */
export function adetEpizotlari(gunler: readonly PmddGunGirdisi[]): Array<{ bas: string; son: string }> {
  const adetGunleri = [...new Set(gunler.filter((g) => g.adet && tarihMi(g.tarih)).map((g) => g.tarih))].sort()
  const out: Array<{ bas: string; son: string }> = []
  for (const t of adetGunleri) {
    const son = out[out.length - 1]
    if (son && gunFarki(t, son.son) === 1) son.son = t
    else out.push({ bas: t, son: t })
  }
  return out
}

/**
 * Score the diary per menstrual onset: the 7 days BEFORE the onset ("the final week before the onset of menses") and the
 * 7 days AFTER the bleeding ends ("the week postmenses"). A window counts only when every one of its days was rated
 * (daily, prospective ratings). Per domain: present before (criterion-B domains: "marked", 4–5; criterion-C: 2 or more)
 * AND minimal or absent after (0–1, every day).
 */
export function pmddOzeti(gunler: readonly PmddGunGirdisi[]): PmddOzeti {
  const harita = new Map<string, PmddGunGirdisi>()
  for (const g of gunler) if (tarihMi(g.tarih)) harita.set(g.tarih, g)
  const pencere = (bas: string, son: string): PmddPencere & { gunler: PmddGunGirdisi[] } => {
    const list: PmddGunGirdisi[] = []
    let eksik = 0
    for (let t = bas; t <= son; t = gunEkle(t, 1)) { const g = harita.get(t); if (g && Object.keys(g.puan).length) list.push(g); else eksik++ }
    return { bas, son, tam: eksik === 0, eksikGun: eksik, gunler: list }
  }
  const enYuksek = (list: PmddGunGirdisi[], a: PmddAlani): number | null => {
    const v = list.map((g) => g.puan[a]).filter(sayiMi)
    return v.length ? Math.max(...v) : null
  }
  const donguler: PmddDongu[] = adetEpizotlari(gunler).map((ep) => {
    const once = pencere(gunEkle(ep.bas, -PMDD_PENCERE_GUN), gunEkle(ep.bas, -1))
    const sonra = pencere(gunEkle(ep.son, 1), gunEkle(ep.son, PMDD_PENCERE_GUN))
    const tam = once.tam && sonra.tam
    const alanlar = {} as PmddDongu['alanlar']
    const enYuksekler: Partial<Record<PmddAlani, { once: number | null; sonra: number | null }>> = {}
    for (const a of PMDD_ALANLARI) {
      const o = enYuksek(once.gunler, a), s = enYuksek(sonra.gunler, a)
      enYuksekler[a] = { once: o, sonra: s }
      alanlar[a] = { onceEnYuksek: o, sonraEnYuksek: s, karsilar: tam ? pmddAlanKarsilar(a, o, s) : null }
    }
    const sonuc = pmddDonguSonucu(enYuksekler)
    const karsilayan = tam ? sonuc.karsilayan : 0, bKarsilayan = tam ? sonuc.bKarsilayan : 0
    const oruntu = tam ? sonuc.oruntu : null
    return {
      adetBaslangici: ep.bas, adetSonu: ep.son,
      once: { bas: once.bas, son: once.son, tam: once.tam, eksikGun: once.eksikGun },
      sonra: { bas: sonra.bas, son: sonra.son, tam: sonra.tam, eksikGun: sonra.eksikGun },
      alanlar, karsilayan, bKarsilayan, oruntu,
    }
  })
  const degerlendirilebilir = donguler.filter((d) => d.oruntu !== null).length
  const oruntuDongu = donguler.filter((d) => d.oruntu === true).length
  return { donguler, degerlendirilebilir, oruntuDongu, ikiDonguTamam: degerlendirilebilir >= PMDD_DONGU_EN_AZ }
}

/** The DSM-5-TR criteria A–G as a checklist the DOCTOR ticks. */
export const PMDD_KRITERLERI = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const
export type PmddKriteri = (typeof PMDD_KRITERLERI)[number]

/**
 * The checklist's state: every criterion ticked → 'tum_kriterler'; A–E and G ticked but F not (no two prospectively rated
 * cycles) → 'gecici' ("provisional", the specifier DSM-5-TR names); otherwise 'eksik'. Never a diagnosis.
 */
export function pmddKontrolListesi(isaretli: readonly string[]): { durum: 'tum_kriterler' | 'gecici' | 'eksik'; eksik: PmddKriteri[] } {
  const eksik = PMDD_KRITERLERI.filter((k) => !isaretli.includes(k))
  if (!eksik.length) return { durum: 'tum_kriterler', eksik }
  if (eksik.length === 1 && eksik[0] === 'F') return { durum: 'gecici', eksik }
  return { durum: 'eksik', eksik }
}

/** Management options as CODES the clinician selects (words and sources: the build's). No dose anywhere. */
export const PMDD_YONETIM_SECENEKLERI = ['ssri_surekli', 'ssri_luteal', 'kombine_oral_kontraseptif', 'bilissel_davranisci_terapi', 'gnrh_agonist_addback'] as const
export type PmddYonetimSecenegi = (typeof PMDD_YONETIM_SECENEKLERI)[number]
