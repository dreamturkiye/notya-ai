/**
 * Map live gebelikler API rows into the Kadın-Doğum specialty payload.
 * SAT / EDD / Anti-D stay on this payload — never on core patient/visit types.
 */
import { kadinDogumPayloadSchema, type KadinDogumPayload, type UsgStudyPayload } from '../../specialties/kadin-dogum/schema'
import { aktifGebelikDurumu } from '../clinical/gebelikDurum'
import { naegeleEdd } from '../../specialties/kadin-dogum/engines/sat-edd'
import { buildIzlemCalendar } from '../../specialties/kadin-dogum/engines/izlem-calendar'
import { evaluateWindowsAtWeeks } from '../../specialties/kadin-dogum/engines/test-windows'

export type LiveGebelikRow = {
  id: string
  sat: string | null
  tdt: string
  tdt_kaynak?: string
  gravida: number | null
  para: number | null
  abortus: number | null
  yasayan: number | null
  rh_negatif: boolean
  durum: string
  dogum_tarihi: string | null
}

export type LiveIzlemRow = {
  id: string
  hafta: number
  usg: Record<string, string | number> | null
  goruntu_id?: string | null
}

export type LiveGebelikVeri = {
  gebelik: LiveGebelikRow | null
  yas: { hafta: number; gun: number } | null
  lohusa?: { dogumSonrasiGun: number } | null
  izlemler?: LiveIzlemRow[]
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

export function payloadFromGebelikApi(patientId: string, veri: LiveGebelikVeri): KadinDogumPayload | null {
  const g = veri.gebelik
  if (!g) return null
  const sat = g.sat && g.sat.length >= 8 ? g.sat.slice(0, 10) : null
  const usgDating = g.tdt_kaynak === 'usg'
  const dating: 'sat' | 'crl' = usgDating ? 'crl' : 'sat'
  const episode_status: KadinDogumPayload['episode_status'] =
    aktifGebelikDurumu(g.durum) ? 'gebe' : veri.lohusa || g.durum === 'lohusa' ? 'lohusa' : 'kapandi'
  const studies = usgStudiesFromIzlemler(veri.izlemler, dating)
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
      D: 0,
      E: 0,
      prior_cs_count: 0,
      prior_cs_incision: 'unknown' as const,
    },
    sat,
    edd_naegele: sat ? naegeleEdd(sat) : g.tdt?.slice(0, 10) ?? null,
    edd_crl: usgDating ? g.tdt.slice(0, 10) : null,
    ga_locked: dating,
    plurality: 'singleton' as const,
    chorionicity: null,
    ttts: false,
    rh: g.rh_negatif ? 'D-' as const : 'D+' as const,
    idc_history: 'not_tested' as const,
    anti_d: [],
    risk_class: 'dusuk' as const,
    episode_status,
    lohusa_day: veri.lohusa ? Math.min(42, Math.max(0, veri.lohusa.dogumSonrasiGun)) : null,
    usg_series: {
      episodeId: g.id,
      datingMethod: dating,
      studies,
    },
    nst_studies: [],
    vision_reads: [],
  }
  const parsed = kadinDogumPayloadSchema.safeParse(raw)
  return parsed.success ? parsed.data : null
}

export function chapterCalendar(payload: KadinDogumPayload, bookingGaWeeks: number) {
  return buildIzlemCalendar({
    risk_class: payload.risk_class,
    booking_ga_weeks: bookingGaWeeks,
    episode_status: payload.episode_status,
  })
}

export function chapterWindows(hafta: number, gun: number) {
  return evaluateWindowsAtWeeks(hafta, gun)
}
