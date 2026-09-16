/**
 * Map live gebelikler API rows into the Kadın-Doğum specialty payload.
 * SAT / EDD / Anti-D stay on this payload — never on core patient/visit types.
 * Live gebelik_* tables are CRUD truth; chapter engines consume this mapping.
 */
import { kadinDogumPayloadSchema, type ColpoImage, type KadinDogumPayload, type UsgStudyPayload } from '../../specialties/kadin-dogum/schema'
import { aktifGebelikDurumu } from '../clinical/gebelikDurum'
import { naegeleEdd } from '../../specialties/kadin-dogum/engines/sat-edd'
import { buildIzlemCalendar, markVisitsDone } from '../../specialties/kadin-dogum/engines/izlem-calendar'
import { evaluateWindowsAtWeeks, type WindowId } from '../../specialties/kadin-dogum/engines/test-windows'
import {
  doneWindowIdsFromClinic,
  mapAntiD,
  mapCsIncision,
  mapIdc,
  mapNstKayitlari,
  mapPlurality,
  type LabPanel,
  type DestekAsiPanel,
} from '../../specialties/kadin-dogum/engines/clinic-fit'
import { riskClassFromForm, type RiskSinifi } from '../../specialties/kadin-dogum/protocols/risk-formu'

export type LiveGebelikRow = {
  id: string
  sat: string | null
  tdt: string
  tdt_kaynak?: string
  gravida: number | null
  para: number | null
  abortus: number | null
  yasayan: number | null
  olu_dogum?: number | null
  ektopik?: number | null
  onceki_sezaryen_sayisi?: number | null
  onceki_sezaryen_kesi_tipi?: string | null
  cogul_gebelik_tipi?: string | null
  risk_sinifi?: string | null
  risk_formu?: { maddeler?: string[] } | null
  rh_negatif: boolean
  durum: string
  dogum_tarihi: string | null
  indirekt_coombs?: unknown
  anti_d_uygulamalari?: unknown
  nst_kayitlari?: unknown
  lab_panel?: LabPanel | null
  destek_asi?: DestekAsiPanel | null
  kan_grubu?: string | null
}

export type LiveIzlemRow = {
  id: string
  hafta: number
  usg: Record<string, string | number> | null
  goruntu_id?: string | null
  ogtt?: unknown
  gbs_kultur?: string | null
  checklist?: unknown
}

export type LiveGoruntuRow = {
  id: string
  modalite?: string | null
  vucut_bolgesi?: string | null
  rapor_metni?: string | null
  goruntuleme_tarihi?: string | null
  created_at?: string | null
  dosya_url?: string | null
}

export type LiveGebelikVeri = {
  gebelik: LiveGebelikRow | null
  yas: { hafta: number; gun: number } | null
  lohusa?: { dogumSonrasiGun: number; izlemler?: Array<{ dogum_sonrasi_gun: number }> } | null
  izlemler?: LiveIzlemRow[]
  genetikTaramalar?: Array<{ tur: string }>
  goruntulemeler?: LiveGoruntuRow[]
}

function num(v: string | number | undefined): number | undefined {
  if (v == null || v === '') return undefined
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : undefined
}

function usgKind(hafta: number, usg: Record<string, string | number>): UsgStudyPayload['kind'] {
  const token = String(usg.kind || usg.modalite || '').toLowerCase()
  if (token.includes('3d') || token.includes('4d') || token.includes('hatira')) return '3d4d_hatira'
  if (token.includes('doppler')) return 'doppler'
  if (num(usg.crl)) return 'nt_11_14'
  if (hafta >= 18 && hafta <= 22) return 'ayrintili_18_22'
  if (hafta < 11) return 'erken_tv'
  return 'buyume'
}

export function usgStudiesFromIzlemler(
  izlemler: LiveIzlemRow[] | undefined,
  dating: 'sat' | 'crl',
): UsgStudyPayload[] {
  return (izlemler || []).flatMap((i) => {
    const u = i.usg
    if (!u || Object.keys(u).length === 0) return []
    const kind = usgKind(i.hafta, u)
    const weeks = Math.floor(i.hafta)
    const days = Math.min(6, Math.max(0, Math.round((i.hafta % 1) * 7)))
    return [{
      id: i.id,
      coreImageId: i.goruntu_id || i.id,
      kind,
      gaWeeksDays: { weeks, days },
      datingMethod: dating,
      fetusId: 'A' as const,
      measurements: {
        crl: num(u.crl),
        nt: num(u.nt),
        nb: num(u.nb),
        bpd: num(u.bpd),
        hc: num(u.hc),
        ac: num(u.ac),
        fl: num(u.fl),
        efw: num(u.efw),
        afi: num(u.afi),
        cervixMm: num(u.cervixMm) ?? num(u.cervix_mm),
        pi: num(u.pi),
        ri: num(u.ri),
        dv: num(u.dv),
      },
      nonDiagnostic: kind === '3d4d_hatira',
      kvkk_fetal_image_consent: false,
      dicomId: undefined,
      kvkk_nipt_karyotype_consent: undefined,
    }]
  })
}

export function isColpoRow(r: LiveGoruntuRow): boolean {
  const t = `${r.vucut_bolgesi || ''} ${r.rapor_metni || ''} ${r.modalite || ''}`.toLowerCase()
  return t.includes('kolpo') || t.includes('colpo')
}

export function colpoFromGoruntuleme(rows: LiveGoruntuRow[] | undefined): ColpoImage[] {
  return (rows || []).filter(isColpoRow).map((r) => ({
    id: r.id,
    coreImageId: r.id,
    capturedAt: String(r.goruntuleme_tarihi || r.created_at || '1970-01-01').slice(0, 10),
    kvkk_consent: false,
  }))
}

export function liveRiskClass(g: LiveGebelikRow): RiskSinifi {
  const maddeler = g.risk_formu?.maddeler
  if (Array.isArray(maddeler) && maddeler.length > 0) return riskClassFromForm(maddeler)
  const s = String(g.risk_sinifi || 'dusuk')
  if (s === 'orta' || s === 'yuksek' || s === 'dusuk') return s
  return 'dusuk'
}

export function payloadFromGebelikApi(patientId: string, veri: LiveGebelikVeri): KadinDogumPayload | null {
  const g = veri.gebelik
  if (!g) return null
  const sat = g.sat && g.sat.length >= 8 ? g.sat.slice(0, 10) : null
  const usgDating = g.tdt_kaynak === 'usg'
  const dating: 'sat' | 'crl' = usgDating ? 'crl' : 'sat'
  const episode_status: KadinDogumPayload['episode_status'] =
    aktifGebelikDurumu(g.durum) ? 'gebe' : veri.lohusa || g.durum === 'lohusa' ? 'lohusa' : 'kapandi'
  const studies = usgStudiesFromIzlemler(veri.izlemler, dating)
  const { plurality, chorionicity } = mapPlurality(g.cogul_gebelik_tipi)
  const nst = mapNstKayitlari(g.nst_kayitlari, veri.yas?.hafta ?? 0, veri.yas?.gun ?? 0)
  const colpo = colpoFromGoruntuleme(veri.goruntulemeler)
  const raw = {
    specialty: 'kadin-dogum' as const,
    episode_id: g.id,
    mother_patient_id: patientId,
    fetuses: [{ label: 'A' as const, status: episode_status === 'kapandi' ? 'delivered' as const : 'ongoing' as const }],
    obstetric_score: {
      G: g.gravida ?? 0,
      P: g.para ?? 0,
      A: g.abortus ?? 0,
      Y: g.yasayan ?? 0,
      D: g.olu_dogum ?? 0,
      E: g.ektopik ?? 0,
      prior_cs_count: g.onceki_sezaryen_sayisi ?? 0,
      prior_cs_incision: mapCsIncision(g.onceki_sezaryen_kesi_tipi),
    },
    sat,
    edd_naegele: sat ? naegeleEdd(sat) : g.tdt?.slice(0, 10) ?? null,
    edd_crl: usgDating ? g.tdt.slice(0, 10) : null,
    ga_locked: dating,
    plurality,
    chorionicity,
    ttts: false,
    rh: g.rh_negatif ? 'D-' as const : 'D+' as const,
    idc_history: mapIdc(g.indirekt_coombs),
    anti_d: mapAntiD(g.anti_d_uygulamalari),
    risk_class: liveRiskClass(g),
    episode_status,
    lohusa_day: veri.lohusa ? Math.min(42, Math.max(0, veri.lohusa.dogumSonrasiGun)) : null,
    usg_series: {
      episodeId: g.id,
      datingMethod: dating,
      studies,
    },
    nst_studies: nst,
    vision_reads: [],
    colpo_images: colpo,
  }
  const parsed = kadinDogumPayloadSchema.safeParse(raw)
  return parsed.success ? parsed.data : null
}

export function chapterCalendar(
  payload: KadinDogumPayload,
  bookingGaWeeks: number,
  completedWeeks: readonly number[] = [],
  completedPpDays: readonly number[] = [],
) {
  const visits = buildIzlemCalendar({
    risk_class: payload.risk_class,
    booking_ga_weeks: bookingGaWeeks,
    episode_status: payload.episode_status,
  })
  return markVisitsDone(visits, { completedWeeks, completedPpDays })
}

export function chapterDoneIds(veri: LiveGebelikVeri): WindowId[] {
  const g = veri.gebelik
  if (!g) return []
  return doneWindowIdsFromClinic({
    labs: g.lab_panel,
    kanGrubu: g.kan_grubu,
    idc: mapIdc(g.indirekt_coombs),
    izlemler: veri.izlemler,
    genetik: veri.genetikTaramalar,
    destekAsi: g.destek_asi,
    nst: Array.isArray(g.nst_kayitlari) ? g.nst_kayitlari : [],
    antiD: Array.isArray(g.anti_d_uygulamalari) ? g.anti_d_uygulamalari : [],
  })
}

export function chapterWindows(hafta: number, gun: number, doneIds: readonly WindowId[] = []) {
  return evaluateWindowsAtWeeks(hafta, gun, doneIds)
}
