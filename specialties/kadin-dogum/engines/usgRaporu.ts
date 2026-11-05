/**
 * KD-RAPOR-01 (Kaan, 2026-11-05) — structured ULTRASOUND REPORTS of the KD chapter: obstetric (biometry, liquor, placenta,
 * presentation, FHR, Doppler, NT, anatomy) and gynaecological (uterus, endometrium, ovaries, lesions). KD only.
 *
 * Every number the report WORKS OUT comes from a published reference, named where it is used:
 *   - biometry percentiles: INTERGROWTH-21st (lib/clinical/fetalBiyometri.ts, tables embedded verbatim); EFW: Hadlock
 *     3-parameter (HC, AC, FL), same file;
 *   - liquor: polyhydramnios SDP ≥ 8 cm or AFI ≥ 24 cm (SMFM Consult Series #46, Evaluation and management of
 *     polyhydramnios, 2018); oligohydramnios SDP < 2 cm or AFI ≤ 5 cm (ACOG Committee Opinion No. 831, Medically
 *     indicated late-preterm and early-term deliveries, 2021);
 *   - MCA-PSV median by gestational age: Mari G, et al. N Engl J Med 2000;342:9-14 — median = e^(2.31 + 0.046 × GA weeks),
 *     MoM = PSV / median; ≥ 1.5 MoM = the published threshold for moderate-to-severe fetal anaemia (18–40 weeks);
 *   - cerebroplacental ratio = MCA PI / UA PI (Gramellini D, et al. Obstet Gynecol 1992;79:416-20; CPR < 1.08 was that
 *     study's abnormal cut-off). No GA-specific CPR, UA-PI or uterine-PI centile table is in the product yet: those values
 *     are printed as measured, without a centile (docs/OPEN-COMMITMENTS.md, KD-USG-DOPPLER-CENTILE-01);
 *   - FHR: 110–160 bpm normal baseline (FIGO 2015, NICE);
 *   - NT ≥ 3.5 mm: the absolute flag already in the product (lib/clinical/genetikTarama.ts → ntDegerlendir);
 *   - endometrium in a postmenopausal woman > 4 mm: ACOG Committee Opinion No. 734 (2018) — ≤ 4 mm makes endometrial
 *     cancer unlikely; above it, evaluation;
 *   - organ volumes: prolate ellipsoid, length × AP × width × 0.523.
 * No finding is ever interpreted as a diagnosis: the report flags a number, the doctor writes the impression.
 */
import { biyometriPersentil, hadlockEfw, type BiyometriParametre } from '@/lib/clinical/fetalBiyometri'
import { ntDegerlendir } from '@/lib/clinical/genetikTarama'

// ───────────────────────── obstetric ─────────────────────────

export const UA_EDF = ['var', 'yok', 'ters'] as const
export type UaEdf = (typeof UA_EDF)[number]
export const PREZENTASYONLAR = ['sefalik', 'makat', 'transvers', 'oblik', 'degisken'] as const
export const PLASENTA_YERLERI = ['anterior', 'posterior', 'fundal', 'lateral_sag', 'lateral_sol', 'previa', 'alt_yerlesimli'] as const
export const ANATOMI_ALANLARI = ['kafa_beyin', 'yuz_dudak', 'omurga', 'kalp_4_odaci', 'kalp_cikis_yollari', 'mide', 'bobrekler', 'mesane', 'karin_duvari_kordon', 'ekstremiteler'] as const
export type AnatomiAlani = (typeof ANATOMI_ALANLARI)[number]
export const ANATOMI_DURUMLARI = ['normal', 'anormal', 'izlenemedi'] as const
export type AnatomiDurumu = (typeof ANATOMI_DURUMLARI)[number]

export type ObstetrikUsg = {
  tarih: string
  haftaGun: { hafta: number | null; gun: number | null }
  fetusSayisi: number | null
  crlMm: number | null; bpdMm: number | null; hcMm: number | null; acMm: number | null; flMm: number | null
  afiCm: number | null; dvpCm: number | null
  plasentaYeri: string; plasentaNot: string
  prezentasyon: string
  fkh: number | null
  uaPi: number | null; uaRi: number | null; uaEdf: UaEdf | ''
  mcaPi: number | null; mcaPsv: number | null
  uterinPiSag: number | null; uterinPiSol: number | null
  ntMm: number | null; nazalKemik: 'var' | 'yok' | 'degerlendirilemedi' | ''
  anatomi: Partial<Record<AnatomiAlani, AnatomiDurumu>>
  sonuc: string
}

export const BOS_OBSTETRIK_USG: ObstetrikUsg = {
  tarih: '', haftaGun: { hafta: null, gun: null }, fetusSayisi: 1, crlMm: null, bpdMm: null, hcMm: null, acMm: null, flMm: null,
  afiCm: null, dvpCm: null, plasentaYeri: '', plasentaNot: '', prezentasyon: '', fkh: null,
  uaPi: null, uaRi: null, uaEdf: '', mcaPi: null, mcaPsv: null, uterinPiSag: null, uterinPiSol: null,
  ntMm: null, nazalKemik: '', anatomi: {}, sonuc: '',
}

export type SivBant = 'oligo' | 'normal' | 'poli'
export type ObstetrikHesap = {
  hafta: number | null
  biyometri: Array<{ param: BiyometriParametre; mm: number; persentil: number; durum: 'dusuk' | 'normal' | 'yuksek' }>
  efw: number | null
  afiBant: SivBant | null
  dvpBant: SivBant | null
  mcaMedian: number | null
  mcaMom: number | null
  mcaAnemiBayragi: boolean
  cpr: number | null
  cprDusuk: boolean
  uterinOrtPi: number | null
  uaEdfBayragi: 'yok' | 'ters' | null
  fkhBayragi: 'bradikardi' | 'tasikardi' | null
  nt: { bayrak: boolean; not: string } | null
}

const sayiMi = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)
const yuvarla = (n: number, b: number) => Math.round(n * 10 ** b) / 10 ** b

/** Gestational age in decimal weeks from "hafta + gün" (0–6). */
export function ondalikHafta(h: { hafta: number | null; gun: number | null }): number | null {
  if (!sayiMi(h.hafta) || h.hafta < 4 || h.hafta > 44) return null
  const g = sayiMi(h.gun) && h.gun >= 0 && h.gun <= 6 ? h.gun : 0
  return h.hafta + g / 7
}

/** SMFM / ACOG thresholds (see the file header). */
export function afiBandi(afiCm: number | null): SivBant | null {
  if (!sayiMi(afiCm) || afiCm < 0) return null
  if (afiCm <= 5) return 'oligo'
  if (afiCm >= 24) return 'poli'
  return 'normal'
}
export function dvpBandi(dvpCm: number | null): SivBant | null {
  if (!sayiMi(dvpCm) || dvpCm < 0) return null
  if (dvpCm < 2) return 'oligo'
  if (dvpCm >= 8) return 'poli'
  return 'normal'
}

/** Mari 2000: median MCA-PSV (cm/s) at a gestational age; defined 18–40 weeks only. */
export function mcaPsvMedian(haftaOndalik: number | null): number | null {
  if (!sayiMi(haftaOndalik) || haftaOndalik < 18 || haftaOndalik > 40) return null
  return Math.exp(2.31 + 0.046 * haftaOndalik)
}

export function obstetrikUsgHesapla(v: ObstetrikUsg): ObstetrikHesap {
  const hafta = ondalikHafta(v.haftaGun)
  const biyometri: ObstetrikHesap['biyometri'] = []
  if (hafta != null) {
    for (const [param, mm] of [['bpd', v.bpdMm], ['hc', v.hcMm], ['ac', v.acMm], ['fl', v.flMm]] as [BiyometriParametre, number | null][]) {
      if (!sayiMi(mm) || mm <= 0) continue
      const s = biyometriPersentil(param, mm, hafta)
      if (s) biyometri.push({ param, mm, persentil: s.persentil, durum: s.durum })
    }
  }
  const efw = sayiMi(v.hcMm) && sayiMi(v.acMm) && sayiMi(v.flMm) ? hadlockEfw(v.hcMm, v.acMm, v.flMm) : null
  const med = mcaPsvMedian(hafta)
  const mom = med != null && sayiMi(v.mcaPsv) && v.mcaPsv > 0 ? yuvarla(v.mcaPsv / med, 2) : null
  const cpr = sayiMi(v.mcaPi) && sayiMi(v.uaPi) && v.uaPi > 0 ? yuvarla(v.mcaPi / v.uaPi, 2) : null
  const ut = [v.uterinPiSag, v.uterinPiSol].filter(sayiMi)
  return {
    hafta: hafta == null ? null : yuvarla(hafta, 1),
    biyometri,
    efw: efw == null ? null : Math.round(efw),
    afiBant: afiBandi(v.afiCm),
    dvpBant: dvpBandi(v.dvpCm),
    mcaMedian: med == null ? null : yuvarla(med, 1),
    mcaMom: mom,
    mcaAnemiBayragi: mom != null && mom >= 1.5,
    cpr,
    cprDusuk: cpr != null && cpr < 1.08,
    uterinOrtPi: ut.length ? yuvarla(ut.reduce((a, b) => a + b, 0) / ut.length, 2) : null,
    uaEdfBayragi: v.uaEdf === 'yok' || v.uaEdf === 'ters' ? v.uaEdf : null,
    fkhBayragi: sayiMi(v.fkh) ? (v.fkh < 110 ? 'bradikardi' : v.fkh > 160 ? 'tasikardi' : null) : null,
    nt: sayiMi(v.ntMm) && v.haftaGun.hafta != null ? ntDegerlendir(v.ntMm, v.haftaGun.hafta) : null,
  }
}

// ───────────────────────── gynaecological ─────────────────────────

export const LEZYON_TURLERI = ['myom', 'kist', 'polip', 'adenomiyozis', 'diger'] as const
export const LEZYON_YERLERI = ['uterus', 'endometrium', 'over_sag', 'over_sol', 'adneks_sag', 'adneks_sol', 'diger'] as const
export type Lezyon = { yer: string; tur: string; boyutMm: [number | null, number | null, number | null]; figo: string; orads: string; aciklama: string }

export type JinekolojikUsg = {
  tarih: string
  yol: 'transvajinal' | 'transabdominal' | 'transrektal' | ''
  menopoz: boolean
  uterusUzunlukMm: number | null; uterusApMm: number | null; uterusGenislikMm: number | null; uterusPozisyon: string
  endometriumMm: number | null; endometriumNot: string
  overSag: [number | null, number | null, number | null]; overSagNot: string
  overSol: [number | null, number | null, number | null]; overSolNot: string
  lezyonlar: Lezyon[]
  serbestSivi: string
  sonuc: string
}
export const BOS_JINEKOLOJIK_USG: JinekolojikUsg = {
  tarih: '', yol: '', menopoz: false, uterusUzunlukMm: null, uterusApMm: null, uterusGenislikMm: null, uterusPozisyon: '',
  endometriumMm: null, endometriumNot: '', overSag: [null, null, null], overSagNot: '', overSol: [null, null, null], overSolNot: '',
  lezyonlar: [], serbestSivi: '', sonuc: '',
}

/** Prolate ellipsoid volume in mL from three diameters in mm. */
export function elipsoidHacimMl(a: number | null, b: number | null, c: number | null): number | null {
  if (![a, b, c].every((x) => sayiMi(x) && (x as number) > 0)) return null
  return yuvarla(((a as number) * (b as number) * (c as number) * 0.523) / 1000, 1)
}

export type JinekolojikHesap = { uterusHacmiMl: number | null; overSagHacmiMl: number | null; overSolHacmiMl: number | null; postmenopozalEndometriumBayragi: boolean }
export function jinekolojikUsgHesapla(v: JinekolojikUsg): JinekolojikHesap {
  return {
    uterusHacmiMl: elipsoidHacimMl(v.uterusUzunlukMm, v.uterusApMm, v.uterusGenislikMm),
    overSagHacmiMl: elipsoidHacimMl(...v.overSag),
    overSolHacmiMl: elipsoidHacimMl(...v.overSol),
    postmenopozalEndometriumBayragi: v.menopoz && sayiMi(v.endometriumMm) && v.endometriumMm > 4,
  }
}

// ───────────────────────── validation (server) ─────────────────────────

const sayi = (x: unknown, enAz: number, enCok: number): number | null => {
  if (x === null || x === undefined || x === '') return null
  const n = typeof x === 'number' ? x : Number(String(x).replace(',', '.'))
  return Number.isFinite(n) && n >= enAz && n <= enCok ? n : NaN
}
const metin = (x: unknown, azami: number): string => (typeof x === 'string' ? x.trim().slice(0, azami) : '')
const secimden = <T extends string>(x: unknown, liste: readonly T[]): T | '' => (typeof x === 'string' && (liste as readonly string[]).includes(x) ? (x as T) : '')
const ISO_GUN = /^\d{4}-\d{2}-\d{2}$/

type Sonuc<T> = { ok: true; veri: T } | { ok: false; hata: string }

/** Every number is held to a physiological range; a number outside it is refused (a typing error), never stored. */
export function obstetrikUsgDogrula(ham: unknown): Sonuc<ObstetrikUsg> {
  const g = (ham && typeof ham === 'object' ? ham : {}) as Record<string, unknown>
  if (typeof g.tarih !== 'string' || !ISO_GUN.test(g.tarih)) return { ok: false, hata: 'Rapor tarihi gerekli.' }
  const hg = (g.haftaGun && typeof g.haftaGun === 'object' ? g.haftaGun : {}) as Record<string, unknown>
  const araliklar: Array<[keyof ObstetrikUsg, number, number, string]> = [
    ['fetusSayisi', 1, 6, 'Fetüs sayısı'], ['crlMm', 1, 100, 'CRL'], ['bpdMm', 10, 120, 'BPD'], ['hcMm', 40, 420, 'HC'],
    ['acMm', 40, 450, 'AC'], ['flMm', 5, 90, 'FL'], ['afiCm', 0, 60, 'AFI'], ['dvpCm', 0, 25, 'DVP'], ['fkh', 40, 240, 'FKH'],
    ['uaPi', 0, 5, 'UA PI'], ['uaRi', 0, 1.5, 'UA RI'], ['mcaPi', 0, 5, 'MCA PI'], ['mcaPsv', 5, 150, 'MCA PSV'],
    ['uterinPiSag', 0, 5, 'Uterin arter PI (sağ)'], ['uterinPiSol', 0, 5, 'Uterin arter PI (sol)'], ['ntMm', 0.1, 15, 'NT'],
  ]
  const veri: ObstetrikUsg = { ...BOS_OBSTETRIK_USG, tarih: g.tarih, anatomi: {} }
  for (const [k, a, b, ad] of araliklar) {
    const n = sayi(g[k], a, b)
    if (Number.isNaN(n)) return { ok: false, hata: `${ad} değeri geçersiz (${a}–${b}).` }
    ;(veri as Record<string, unknown>)[k] = n
  }
  const hafta = sayi(hg.hafta, 4, 44), gun = sayi(hg.gun, 0, 6)
  if (Number.isNaN(hafta) || Number.isNaN(gun)) return { ok: false, hata: 'Gebelik haftası geçersiz.' }
  veri.haftaGun = { hafta: hafta == null ? null : Math.round(hafta), gun: gun == null ? null : Math.round(gun) }
  veri.uaEdf = secimden(g.uaEdf, UA_EDF)
  veri.prezentasyon = secimden(g.prezentasyon, PREZENTASYONLAR)
  veri.plasentaYeri = secimden(g.plasentaYeri, PLASENTA_YERLERI)
  veri.nazalKemik = secimden(g.nazalKemik, ['var', 'yok', 'degerlendirilemedi'] as const)
  veri.plasentaNot = metin(g.plasentaNot, 300)
  veri.sonuc = metin(g.sonuc, 3000)
  const an = (g.anatomi && typeof g.anatomi === 'object' ? g.anatomi : {}) as Record<string, unknown>
  for (const a of ANATOMI_ALANLARI) { const d = secimden(an[a], ANATOMI_DURUMLARI); if (d) veri.anatomi[a] = d }
  return { ok: true, veri }
}

export function jinekolojikUsgDogrula(ham: unknown): Sonuc<JinekolojikUsg> {
  const g = (ham && typeof ham === 'object' ? ham : {}) as Record<string, unknown>
  if (typeof g.tarih !== 'string' || !ISO_GUN.test(g.tarih)) return { ok: false, hata: 'Rapor tarihi gerekli.' }
  const veri: JinekolojikUsg = { ...BOS_JINEKOLOJIK_USG, tarih: g.tarih, lezyonlar: [] }
  for (const [k, a, b, ad] of [['uterusUzunlukMm', 10, 300, 'Uterus uzunluğu'], ['uterusApMm', 5, 250, 'Uterus AP'], ['uterusGenislikMm', 5, 250, 'Uterus genişliği'], ['endometriumMm', 0, 60, 'Endometrium']] as [keyof JinekolojikUsg, number, number, string][]) {
    const n = sayi(g[k], a, b)
    if (Number.isNaN(n)) return { ok: false, hata: `${ad} değeri geçersiz (${a}–${b} mm).` }
    ;(veri as Record<string, unknown>)[k] = n
  }
  const uc = (x: unknown, ad: string): [number | null, number | null, number | null] | string => {
    const l = Array.isArray(x) ? x : []
    const o = [0, 1, 2].map((i) => sayi(l[i], 1, 300))
    return o.some((n) => Number.isNaN(n)) ? `${ad} ölçüleri geçersiz (1–300 mm).` : (o as [number | null, number | null, number | null])
  }
  const sag = uc(g.overSag, 'Sağ over'), sol = uc(g.overSol, 'Sol over')
  if (typeof sag === 'string') return { ok: false, hata: sag }
  if (typeof sol === 'string') return { ok: false, hata: sol }
  veri.overSag = sag; veri.overSol = sol
  veri.yol = secimden(g.yol, ['transvajinal', 'transabdominal', 'transrektal'] as const)
  veri.menopoz = g.menopoz === true
  veri.uterusPozisyon = metin(g.uterusPozisyon, 120)
  veri.endometriumNot = metin(g.endometriumNot, 300)
  veri.overSagNot = metin(g.overSagNot, 300)
  veri.overSolNot = metin(g.overSolNot, 300)
  veri.serbestSivi = metin(g.serbestSivi, 200)
  veri.sonuc = metin(g.sonuc, 3000)
  const lz = Array.isArray(g.lezyonlar) ? g.lezyonlar.slice(0, 12) : []
  for (const l of lz) {
    const x = (l && typeof l === 'object' ? l : {}) as Record<string, unknown>
    const b = uc(x.boyutMm, 'Lezyon')
    if (typeof b === 'string') return { ok: false, hata: b }
    veri.lezyonlar.push({ yer: secimden(x.yer, LEZYON_YERLERI), tur: secimden(x.tur, LEZYON_TURLERI), boyutMm: b, figo: metin(x.figo, 20), orads: secimden(x.orads, ['0', '1', '2', '3', '4', '5'] as const), aciklama: metin(x.aciklama, 300) })
  }
  return { ok: true, veri }
}

// ───────────────────────── Turkish words of the Türkiye build ─────────────────────────

export const USG_ETIKET = {
  sivBant: { oligo: 'Oligohidramnios sınırında', normal: 'Normal', poli: 'Polihidramnios sınırında' } as Record<SivBant, string>,
  uaEdf: { var: 'Var', yok: 'Yok (AEDF)', ters: 'Ters (REDF)' } as Record<UaEdf, string>,
  prezentasyon: { sefalik: 'Sefalik', makat: 'Makat', transvers: 'Transvers', oblik: 'Oblik', degisken: 'Değişken' } as Record<string, string>,
  plasenta: { anterior: 'Anterior', posterior: 'Posterior', fundal: 'Fundal', lateral_sag: 'Lateral (sağ)', lateral_sol: 'Lateral (sol)', previa: 'Previa', alt_yerlesimli: 'Alt yerleşimli' } as Record<string, string>,
  anatomi: { kafa_beyin: 'Kafa / beyin', yuz_dudak: 'Yüz / dudak', omurga: 'Omurga', kalp_4_odaci: 'Kalp (4 odacık)', kalp_cikis_yollari: 'Kalp çıkış yolları', mide: 'Mide', bobrekler: 'Böbrekler', mesane: 'Mesane', karin_duvari_kordon: 'Karın duvarı / kordon girişi', ekstremiteler: 'Ekstremiteler' } as Record<AnatomiAlani, string>,
  anatomiDurum: { normal: 'Normal', anormal: 'Anormal', izlenemedi: 'İzlenemedi' } as Record<AnatomiDurumu, string>,
  lezyonTur: { myom: 'Myom', kist: 'Kist', polip: 'Polip', adenomiyozis: 'Adenomiyozis', diger: 'Diğer' } as Record<string, string>,
  lezyonYer: { uterus: 'Uterus', endometrium: 'Endometrium', over_sag: 'Sağ over', over_sol: 'Sol over', adneks_sag: 'Sağ adneks', adneks_sol: 'Sol adneks', diger: 'Diğer' } as Record<string, string>,
}
