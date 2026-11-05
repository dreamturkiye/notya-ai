/**
 * KD-RAPOR-01 (Kaan, 2026-11-05) — structured NST / CTG record of the KD chapter, with the classification Türkiye uses:
 * FIGO 2015 (Ayres-de-Campos D, et al. FIGO consensus guidelines on intrapartum fetal monitoring: Cardiotocography.
 * Int J Gynecol Obstet 2015;131:13-24) — normal / suspicious / pathological; and the antenatal NST reactivity of
 * ACOG Practice Bulletin No. 229, Antepartum Fetal Surveillance (2021): reactive = two or more accelerations within
 * 20 minutes (≥ 32 weeks: ≥ 15 bpm for ≥ 15 s; < 32 weeks: ≥ 10 bpm for ≥ 10 s), looked for over up to 40 minutes.
 *
 * The doctor enters what the trace shows; the tool only applies the published thresholds. It never decides on delivery
 * or treatment. Pure; no text of the Türkiye build is mixed into the arithmetic (NST_ETIKET holds the words).
 *
 * FIGO 2015 criteria used (Table 4 of the consensus):
 *   NORMAL        baseline 110–160 bpm; variability 5–25 bpm; no repetitive decelerations.
 *   PATHOLOGICAL  baseline < 100 bpm; reduced variability (< 5 bpm) for > 50 min, increased (> 25 bpm) for > 30 min, or
 *                 sinusoidal for > 30 min; repetitive late or prolonged decelerations for > 30 min (> 20 min if
 *                 variability is reduced); one prolonged deceleration > 5 min.
 *   SUSPICIOUS    lacking at least one characteristic of normality, with no pathological feature.
 * Decelerations are "repetitive" when they occur with more than 50% of contractions. Tachysystole: > 5 contractions in
 * 10 minutes, averaged over 30 minutes.
 */

export type NstGirdi = {
  tarih: string
  saat: string
  haftaGun: { hafta: number | null; gun: number | null }
  sureDk: number | null
  bazalFkh: number | null
  /** Amplitude of the oscillations around the baseline, bpm. */
  varyabiliteBpm: number | null
  /** Minutes the variability stayed < 5 bpm (0 = never). */
  azalmisVaryabiliteDk: number | null
  /** Minutes the variability stayed > 25 bpm (0 = never). */
  artmisVaryabiliteDk: number | null
  /** Minutes of a sinusoidal pattern (0 = none). */
  sinuzoidalDk: number | null
  /** Accelerations within the best 20-minute window. */
  akselerasyon20dk: number | null
  erkenDes: number | null
  gecDes: number | null
  degiskenDes: number | null
  uzamisDes: number | null
  /** Decelerations occur with > 50% of contractions. */
  tekrarlayan: boolean
  /** Minutes the repetitive late / prolonged deceleration pattern has lasted (0 = none). */
  tekrarlayanDesDk: number | null
  /** Longest single prolonged deceleration, minutes. */
  enUzunDesDk: number | null
  kontraksiyon10dk: number | null
  sonuc: string
}

export const BOS_NST: NstGirdi = {
  tarih: '', saat: '', haftaGun: { hafta: null, gun: null }, sureDk: null, bazalFkh: null, varyabiliteBpm: null,
  azalmisVaryabiliteDk: 0, artmisVaryabiliteDk: 0, sinuzoidalDk: 0, akselerasyon20dk: null, erkenDes: 0, gecDes: 0,
  degiskenDes: 0, uzamisDes: 0, tekrarlayan: false, tekrarlayanDesDk: 0, enUzunDesDk: 0, kontraksiyon10dk: null, sonuc: '',
}

export type FigoSinif = 'normal' | 'supheli' | 'patolojik'
export type Reaktivite = 'reaktif' | 'non_reaktif' | 'uzatilmali'
export type NstOzellik = 'bazal_bradikardi' | 'bazal_tasikardi' | 'bazal_patolojik' | 'varyabilite_azalmis' | 'varyabilite_artmis' | 'varyabilite_patolojik' | 'sinuzoidal' | 'tekrarlayan_des' | 'des_patolojik' | 'uzamis_des_5dk' | 'tasisistoli'
export type NstSonuc = { tamam: boolean; figo: FigoSinif | null; reaktivite: Reaktivite | null; ozellikler: NstOzellik[]; akselerasyonEsigi: '15x15' | '10x10' | null }

const n = (x: number | null | undefined) => (typeof x === 'number' && Number.isFinite(x) ? x : 0)
const var_ = (x: number | null | undefined): x is number => typeof x === 'number' && Number.isFinite(x)

export function nstSiniflandir(g: NstGirdi): NstSonuc {
  if (!var_(g.bazalFkh) || !var_(g.varyabiliteBpm)) return { tamam: false, figo: null, reaktivite: null, ozellikler: [], akselerasyonEsigi: null }
  const oz: NstOzellik[] = []
  // Pathological features (FIGO 2015).
  const azalmis = g.varyabiliteBpm < 5
  if (g.bazalFkh < 100) oz.push('bazal_patolojik')
  if (n(g.azalmisVaryabiliteDk) > 50 || n(g.artmisVaryabiliteDk) > 30) oz.push('varyabilite_patolojik')
  if (n(g.sinuzoidalDk) > 30) oz.push('sinuzoidal')
  const tekrarlayanGecUzamis = g.tekrarlayan && (n(g.gecDes) > 0 || n(g.uzamisDes) > 0)
  if (tekrarlayanGecUzamis && n(g.tekrarlayanDesDk) > (azalmis ? 20 : 30)) oz.push('des_patolojik')
  if (n(g.enUzunDesDk) > 5) oz.push('uzamis_des_5dk')
  const patolojik = oz.length > 0
  // Departures from normality.
  if (g.bazalFkh >= 100 && g.bazalFkh < 110) oz.push('bazal_bradikardi')
  if (g.bazalFkh > 160) oz.push('bazal_tasikardi')
  if (azalmis && !oz.includes('varyabilite_patolojik')) oz.push('varyabilite_azalmis')
  if (g.varyabiliteBpm > 25 && !oz.includes('varyabilite_patolojik')) oz.push('varyabilite_artmis')
  if (g.tekrarlayan && !oz.includes('des_patolojik')) oz.push('tekrarlayan_des')
  if (var_(g.kontraksiyon10dk) && g.kontraksiyon10dk > 5) oz.push('tasisistoli')
  const normal = g.bazalFkh >= 110 && g.bazalFkh <= 160 && g.varyabiliteBpm >= 5 && g.varyabiliteBpm <= 25 && !g.tekrarlayan && n(g.sinuzoidalDk) === 0
  const figo: FigoSinif = patolojik ? 'patolojik' : normal ? 'normal' : 'supheli'

  // Antenatal reactivity (ACOG PB 229).
  const hafta = g.haftaGun.hafta
  const esik = var_(hafta) ? (hafta >= 32 ? '15x15' : '10x10') : null
  let reaktivite: Reaktivite | null = null
  if (var_(g.akselerasyon20dk)) reaktivite = g.akselerasyon20dk >= 2 ? 'reaktif' : n(g.sureDk) >= 40 ? 'non_reaktif' : 'uzatilmali'
  return { tamam: true, figo, reaktivite, ozellikler: oz, akselerasyonEsigi: esik }
}

const ISO_GUN = /^\d{4}-\d{2}-\d{2}$/
export function nstDogrula(ham: unknown): { ok: true; veri: NstGirdi } | { ok: false; hata: string } {
  const g = (ham && typeof ham === 'object' ? ham : {}) as Record<string, unknown>
  if (typeof g.tarih !== 'string' || !ISO_GUN.test(g.tarih)) return { ok: false, hata: 'NST tarihi gerekli.' }
  const veri: NstGirdi = { ...BOS_NST, tarih: g.tarih, saat: typeof g.saat === 'string' && /^\d{2}:\d{2}$/.test(g.saat) ? g.saat : '' }
  const araliklar: Array<[keyof NstGirdi, number, number, string]> = [
    ['sureDk', 1, 240, 'Süre'], ['bazalFkh', 50, 240, 'Bazal FKH'], ['varyabiliteBpm', 0, 60, 'Varyabilite'],
    ['azalmisVaryabiliteDk', 0, 240, 'Azalmış varyabilite süresi'], ['artmisVaryabiliteDk', 0, 240, 'Artmış varyabilite süresi'],
    ['sinuzoidalDk', 0, 240, 'Sinüzoidal süre'], ['akselerasyon20dk', 0, 30, 'Akselerasyon'], ['erkenDes', 0, 60, 'Erken deselerasyon'],
    ['gecDes', 0, 60, 'Geç deselerasyon'], ['degiskenDes', 0, 60, 'Değişken deselerasyon'], ['uzamisDes', 0, 20, 'Uzamış deselerasyon'],
    ['tekrarlayanDesDk', 0, 240, 'Tekrarlayan deselerasyon süresi'], ['enUzunDesDk', 0, 60, 'En uzun deselerasyon'], ['kontraksiyon10dk', 0, 15, 'Kontraksiyon'],
  ]
  for (const [k, a, b, ad] of araliklar) {
    const v = g[k]
    if (v === null || v === undefined || v === '') { (veri as Record<string, unknown>)[k] = (BOS_NST as Record<string, unknown>)[k]; continue }
    const x = typeof v === 'number' ? v : Number(String(v).replace(',', '.'))
    if (!Number.isFinite(x) || x < a || x > b) return { ok: false, hata: `${ad} değeri geçersiz (${a}–${b}).` }
    ;(veri as Record<string, unknown>)[k] = x
  }
  const hg = (g.haftaGun && typeof g.haftaGun === 'object' ? g.haftaGun : {}) as Record<string, unknown>
  const h = hg.hafta === '' || hg.hafta == null ? null : Number(hg.hafta), gun = hg.gun === '' || hg.gun == null ? null : Number(hg.gun)
  if ((h != null && (!Number.isFinite(h) || h < 20 || h > 44)) || (gun != null && (!Number.isFinite(gun) || gun < 0 || gun > 6))) return { ok: false, hata: 'Gebelik haftası geçersiz.' }
  veri.haftaGun = { hafta: h == null ? null : Math.round(h), gun: gun == null ? null : Math.round(gun) }
  veri.tekrarlayan = g.tekrarlayan === true
  veri.sonuc = typeof g.sonuc === 'string' ? g.sonuc.trim().slice(0, 2000) : ''
  if (veri.bazalFkh == null || veri.varyabiliteBpm == null) return { ok: false, hata: 'Bazal FKH ve varyabilite gerekli.' }
  return { ok: true, veri }
}

export const NST_ETIKET = {
  figo: { normal: 'Normal (FIGO 2015)', supheli: 'Şüpheli (FIGO 2015)', patolojik: 'Patolojik (FIGO 2015)' } as Record<FigoSinif, string>,
  reaktivite: { reaktif: 'Reaktif', non_reaktif: 'Non-reaktif', uzatilmali: 'Henüz reaktif değil — kayıt 40 dakikaya uzatılmalı' } as Record<Reaktivite, string>,
  esik: { '15x15': '≥32 hf: ≥15 vuru/dk, ≥15 sn', '10x10': '<32 hf: ≥10 vuru/dk, ≥10 sn' } as Record<'15x15' | '10x10', string>,
  ozellik: {
    bazal_bradikardi: 'Bazal 100–109 vuru/dk', bazal_tasikardi: 'Bazal >160 vuru/dk', bazal_patolojik: 'Bazal <100 vuru/dk',
    varyabilite_azalmis: 'Azalmış varyabilite (<5)', varyabilite_artmis: 'Artmış varyabilite (>25)',
    varyabilite_patolojik: 'Uzun süreli azalmış (>50 dk) / artmış (>30 dk) varyabilite', sinuzoidal: 'Sinüzoidal patern >30 dk',
    tekrarlayan_des: 'Tekrarlayan deselerasyonlar (>%50 kontraksiyon)', des_patolojik: 'Tekrarlayan geç / uzamış deselerasyon >30 dk (azalmış varyabilitede >20 dk)',
    uzamis_des_5dk: 'Uzamış deselerasyon >5 dk', tasisistoli: 'Taşisistoli (>5 kontraksiyon / 10 dk)',
  } as Record<NstOzellik, string>,
}
