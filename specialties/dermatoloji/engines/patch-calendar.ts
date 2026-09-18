import { addDays, diffDays } from './dates'
import type { PatchCourse } from '../schema'

export type PatchStatus = 'not_yet' | 'open_d2' | 'open_d4' | 'done' | 'overdue_d2' | 'overdue_d4'

export function plannedReads(appliedAt: string): { d2: string; d4: string } {
  return { d2: addDays(appliedAt, 2), d4: addDays(appliedAt, 4) }
}

export function patchStatus(course: PatchCourse, todayIso: string): PatchStatus {
  const { d2, d4 } = plannedReads(course.appliedAt)
  if (course.readD2 && course.readD4) return 'done'
  if (!course.readD2) {
    if (diffDays(todayIso, d2) > 0) return 'overdue_d2'
    if (todayIso === d2 || (diffDays(todayIso, course.appliedAt) >= 2 && diffDays(todayIso, d2) <= 0)) return 'open_d2'
    return 'not_yet'
  }
  if (!course.readD4) {
    if (diffDays(todayIso, d4) > 0) return 'overdue_d4'
    if (todayIso === d4 || diffDays(todayIso, d2) >= 0) return 'open_d4'
  }
  return 'done'
}

/** Geriye dönük uyumluluk — kod listesi Avrupa baz serisinden. */
export const EUROPEAN_BASELINE_STUB = AVRUPA_BAZ_SERISI.map((a) => a.kod) as unknown as readonly string[]

// ──────────────────────────────────────────────────────────────────────────────
// DERM-EXCEPTIONAL-01 — Avrupa baz serisi alerjen ızgarası, ICDRG okuma dereceleri,
// çok kürlü takvim. Alerjen adları kamuya açık seri adlarıdır; konsantrasyon / vehikül
// yazılmaz (ünite kendi hazır bandını kullanır, test maddesi kararı hekimindir).
// ──────────────────────────────────────────────────────────────────────────────

export type PatchSeriesId = 'european_baseline' | 'ek_kozmetik' | 'ek_sac' | 'ek_mesleki' | 'ek_hekim'

export type AllergenGroup = 'metal' | 'koku' | 'koruyucu' | 'kaucuk' | 'recine' | 'ilac' | 'bitki' | 'kortikosteroid' | 'boya' | 'diger'

export const ALERJEN_GRUP_ADI: Record<AllergenGroup, string> = {
  metal: 'Metaller',
  koku: 'Koku maddeleri',
  koruyucu: 'Koruyucular',
  kaucuk: 'Kauçuk katkıları',
  recine: 'Reçineler / yapıştırıcılar',
  ilac: 'Topikal ilaçlar',
  bitki: 'Bitkisel',
  kortikosteroid: 'Kortikosteroid göstergeleri',
  boya: 'Boyalar',
  diger: 'Diğer',
}

export type Alerjen = { kod: string; ad: string; grup: AllergenGroup }

/** Avrupa baz serisi (European baseline series) — alerjen adları; sıra ünite bandına göre değişebilir. */
export const AVRUPA_BAZ_SERISI: Alerjen[] = [
  { kod: 'potasyum-dikromat', ad: 'Potasyum dikromat', grup: 'metal' },
  { kod: 'nikel-sulfat', ad: 'Nikel sülfat', grup: 'metal' },
  { kod: 'kobalt-klorur', ad: 'Kobalt klorür', grup: 'metal' },
  { kod: 'ppd', ad: 'p-Fenilendiamin (PPD)', grup: 'boya' },
  { kod: 'tekstil-boya-mix', ad: 'Tekstil boya karışımı', grup: 'boya' },
  { kod: 'tiuram-mix', ad: 'Tiuram karışımı', grup: 'kaucuk' },
  { kod: 'merkapto-mix', ad: 'Merkapto karışımı', grup: 'kaucuk' },
  { kod: 'merkaptobenzotiazol', ad: '2-Merkaptobenzotiazol', grup: 'kaucuk' },
  { kod: 'ippd', ad: 'N-izopropil-N’-fenil-4-fenilendiamin (IPPD)', grup: 'kaucuk' },
  { kod: 'neomisin', ad: 'Neomisin sülfat', grup: 'ilac' },
  { kod: 'benzokain', ad: 'Benzokain', grup: 'ilac' },
  { kod: 'kliokinol', ad: 'Kliokinol', grup: 'ilac' },
  { kod: 'kolofonyum', ad: 'Kolofonyum', grup: 'recine' },
  { kod: 'epoksi-recine', ad: 'Epoksi reçine', grup: 'recine' },
  { kod: 'p-tert-butilfenol-formaldehit', ad: '4-tert-Butilfenol formaldehit reçinesi', grup: 'recine' },
  { kod: 'paraben-mix', ad: 'Paraben karışımı', grup: 'koruyucu' },
  { kod: 'formaldehit', ad: 'Formaldehit', grup: 'koruyucu' },
  { kod: 'kuaternium-15', ad: 'Kuaternium-15', grup: 'koruyucu' },
  { kod: 'mci-mi', ad: 'Metilkloroizotiazolinon / metilizotiazolinon (MCI/MI)', grup: 'koruyucu' },
  { kod: 'mi', ad: 'Metilizotiazolinon (MI)', grup: 'koruyucu' },
  { kod: 'metildibromo-glutaronitril', ad: 'Metildibromo glutaronitril', grup: 'koruyucu' },
  { kod: 'koku-mix-1', ad: 'Koku karışımı I', grup: 'koku' },
  { kod: 'koku-mix-2', ad: 'Koku karışımı II', grup: 'koku' },
  { kod: 'hicc', ad: 'Hidroksiizoheksil 3-sikloheksen karboksaldehit (HICC)', grup: 'koku' },
  { kod: 'peru-balzami', ad: 'Peru balzamı (Myroxylon pereirae)', grup: 'koku' },
  { kod: 'lanolin-alkol', ad: 'Lanolin alkolleri (yün alkolleri)', grup: 'diger' },
  { kod: 'seskiterpen-lakton-mix', ad: 'Seskiterpen lakton karışımı', grup: 'bitki' },
  { kod: 'kompozita-mix', ad: 'Compositae karışımı', grup: 'bitki' },
  { kod: 'propolis', ad: 'Propolis', grup: 'bitki' },
  { kod: 'budesonid', ad: 'Budesonid', grup: 'kortikosteroid' },
  { kod: 'tiksokortol-pivalat', ad: 'Tiksokortol-21-pivalat', grup: 'kortikosteroid' },
  { kod: 'hema', ad: '2-Hidroksietil metakrilat (2-HEMA)', grup: 'diger' },
]

/** Geriye dönük uyumluluk — kod listesi Avrupa baz serisinden. */
export const EUROPEAN_BASELINE_STUB: readonly string[] = AVRUPA_BAZ_SERISI.map((a) => a.kod)

export const EK_SERILER: Record<Exclude<PatchSeriesId, 'european_baseline' | 'ek_hekim'>, { ad: string; alerjenler: Alerjen[] }> = {
  ek_kozmetik: {
    ad: 'Kozmetik ek serisi',
    alerjenler: [
      { kod: 'kokamidopropil-betain', ad: 'Kokamidopropil betain', grup: 'diger' },
      { kod: 'setostearil-alkol', ad: 'Setostearil alkol', grup: 'diger' },
      { kod: 'dmdm-hidantoin', ad: 'DMDM hidantoin', grup: 'koruyucu' },
      { kod: 'iyodopropinil-butilkarbamat', ad: 'İyodopropinil bütilkarbamat', grup: 'koruyucu' },
      { kod: 'benzofenon-3', ad: 'Benzofenon-3', grup: 'diger' },
    ],
  },
  ek_sac: {
    ad: 'Saç / kuaför ek serisi',
    alerjenler: [
      { kod: 'toluen-2-5-diamin', ad: 'Toluen-2,5-diamin', grup: 'boya' },
      { kod: 'aminofenol', ad: 'p-Aminofenol', grup: 'boya' },
      { kod: 'amonyum-persulfat', ad: 'Amonyum persülfat', grup: 'diger' },
      { kod: 'gliseril-tioglikolat', ad: 'Gliseril tiyoglikolat', grup: 'diger' },
    ],
  },
  ek_mesleki: {
    ad: 'Mesleki ek serisi',
    alerjenler: [
      { kod: 'izosiyanat', ad: 'İzosiyanatlar', grup: 'recine' },
      { kod: 'akrilat-mix', ad: 'Akrilat karışımı', grup: 'recine' },
      { kod: 'metil-metakrilat', ad: 'Metil metakrilat', grup: 'recine' },
      { kod: 'kolofonyum-mesleki', ad: 'Kolofonyum (lehim / yapıştırıcı)', grup: 'recine' },
    ],
  },
}

export const PATCH_SERILERI: Array<{ id: PatchSeriesId; ad: string; aciklama: string }> = [
  { id: 'european_baseline', ad: 'Avrupa baz serisi', aciklama: `${AVRUPA_BAZ_SERISI.length} alerjen — standart başlangıç bandı` },
  { id: 'ek_kozmetik', ad: EK_SERILER.ek_kozmetik.ad, aciklama: 'Yüz / kozmetik şüphesinde eklenir' },
  { id: 'ek_sac', ad: EK_SERILER.ek_sac.ad, aciklama: 'Kuaför / boya maruziyetinde eklenir' },
  { id: 'ek_mesleki', ad: EK_SERILER.ek_mesleki.ad, aciklama: 'Mesleki maruziyette eklenir' },
  { id: 'ek_hekim', ad: 'Hekimin eklediği maddeler', aciklama: 'Hastanın getirdiği ürün / hekim seçimi' },
]

export function seriAlerjenleri(id: PatchSeriesId): Alerjen[] {
  if (id === 'european_baseline') return AVRUPA_BAZ_SERISI
  if (id === 'ek_hekim') return []
  return EK_SERILER[id].alerjenler
}

export function alerjenAdi(kod: string): string {
  const hepsi = [AVRUPA_BAZ_SERISI, ...Object.values(EK_SERILER).map((s) => s.alerjenler)].flat()
  return hepsi.find((a) => a.kod === kod)?.ad ?? kod
}

/** Alerjenleri grup grup ızgaraya böler (UI kolonları). */
export function gruplanmisAlerjenler(id: PatchSeriesId = 'european_baseline'): Array<{ grup: AllergenGroup; ad: string; alerjenler: Alerjen[] }> {
  const liste = seriAlerjenleri(id)
  const gruplar = [...new Set(liste.map((a) => a.grup))]
  return gruplar.map((g) => ({ grup: g, ad: ALERJEN_GRUP_ADI[g], alerjenler: liste.filter((a) => a.grup === g) }))
}

/** ICDRG okuma dereceleri — hekim her pozitif alerjen için derece seçer. */
export const ICDRG_DERECELERI: Array<{ kod: string; ad: string; aciklama: string }> = [
  { kod: 'neg', ad: '−', aciklama: 'Reaksiyon yok' },
  { kod: 'soru', ad: '?+', aciklama: 'Kuşkulu — yalnız hafif eritem' },
  { kod: 'p1', ad: '+', aciklama: 'Eritem, infiltrasyon, olası papüller' },
  { kod: 'p2', ad: '++', aciklama: 'Eritem, infiltrasyon, papüller, veziküller' },
  { kod: 'p3', ad: '+++', aciklama: 'Yoğun eritem, infiltrasyon, birleşen veziküller' },
  { kod: 'ir', ad: 'IR', aciklama: 'İrritan reaksiyon' },
]

export function icdrgAdi(kod: string): string {
  return ICDRG_DERECELERI.find((d) => d.kod === kod)?.ad ?? kod
}

/** Okuma günü → fotoğraf türü ipucu (core görüntüleme photo kind). */
export function okumaFotoTuru(gun: 2 | 4): 'yama_d2' | 'yama_d4' {
  return gun === 2 ? 'yama_d2' : 'yama_d4'
}

export const OKUMA_FOTO_IPUCU: Array<{ gun: 2 | 4; kind: 'yama_d2' | 'yama_d4'; ad: string; ipucu: string }> = [
  { gun: 2, kind: 'yama_d2', ad: 'D2 okuma fotoğrafı', ipucu: 'Bant çıkarıldıktan sonra ~30 dk beklenir; aynı açı ve mesafe' },
  { gun: 4, kind: 'yama_d4', ad: 'D4 okuma fotoğrafı', ipucu: 'Geç reaksiyonlar D4–D7’de belirir; aynı açı ve işaretleme' },
]

/** Geç okuma (D7) gerekebilecek alerjenler — hekime ipucu; karar hekimin. */
export const GEC_OKUMA_IPUCU_ALERJENLERI = ['neomisin', 'kortikosteroid (budesonid, tiksokortol)', 'PPD', 'altın tuzları'] as const

export type PatchCourseKaydi = PatchCourse & {
  id?: string
  series?: string
  /** alerjen kodu → ICDRG derecesi (D2) */
  d2Dereceler?: Record<string, string>
  /** alerjen kodu → ICDRG derecesi (D4) */
  d4Dereceler?: Record<string, string>
}

/** Çok kürlü takvim — her kür için durum + planlanan okuma günleri, en yenisi başta. */
export function kurTakvimi(
  courses: PatchCourseKaydi[],
  todayIso: string,
): Array<{
  id: string | null
  seri: string
  appliedAt: string
  d2: string
  d4: string
  readD2: string | null
  readD4: string | null
  durum: PatchStatus
  aktif: boolean
  pozitifSayisi: number
}> {
  const sirali = [...courses].sort((a, b) => b.appliedAt.localeCompare(a.appliedAt))
  return sirali.map((c, i) => {
    const plan = plannedReads(c.appliedAt)
    const durum = patchStatus(c, todayIso)
    return {
      id: c.id ? String(c.id) : null,
      seri: String(c.series || 'european_baseline'),
      appliedAt: c.appliedAt,
      d2: plan.d2,
      d4: plan.d4,
      readD2: c.readD2,
      readD4: c.readD4,
      durum,
      aktif: i === 0 && durum !== 'done',
      pozitifSayisi: (c.positives || []).length,
    }
  })
}

/** Aynı bölgeye yeni kür açmadan önce bekleme ipucu (hekim kararı; gün sayısı bilgilendirme). */
export function yeniKurIpucu(courses: PatchCourseKaydi[], todayIso: string): string | null {
  const takvim = kurTakvimi(courses, todayIso)
  const acik = takvim.find((t) => t.durum !== 'done')
  if (acik) return `Açık kür var (${acik.appliedAt} · ${acik.durum === 'overdue_d2' || acik.durum === 'overdue_d4' ? 'okuma gecikmiş' : 'okuma bekliyor'}) — yeni kür açmadan önce okumayı tamamlayın.`
  return null
}

/** Araçlar › yama — Avrupa baz listesi (kod/ad/kaynak). */
export type BaselineAlerjen = { kod: string; ad: string; kaynak: string }

export const EUROPEAN_BASELINE: readonly BaselineAlerjen[] = AVRUPA_BAZ_SERISI.map((a) => ({
  kod: a.kod,
  ad: a.ad,
  kaynak: ALERJEN_GRUP_ADI[a.grup],
}))

export function baselineAlerjenAdi(kod: string): string {
  return alerjenAdi(kod)
}
