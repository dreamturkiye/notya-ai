/**
 * Map live gebelikler API rows into the Kadın-Doğum specialty payload.
 * SAT / EDD / Anti-D stay on this payload — never on core patient/visit types.
 */
import { kadinDogumPayloadSchema, type KadinDogumPayload } from '../../specialties/kadin-dogum/schema'
import { naegeleEdd } from '../../specialties/kadin-dogum/engines/sat-edd'
import { buildIzlemCalendar } from '../../specialties/kadin-dogum/engines/izlem-calendar'
import { evaluateWindowsAtWeeks } from '../../specialties/kadin-dogum/engines/test-windows'
import type { UsgStudy } from '../../specialties/kadin-dogum/protocols/usg'

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
}

export type LiveGebelikVeri = {
  gebelik: LiveGebelikRow | null
  yas: { hafta: number; gun: number } | null
  lohusa?: { dogumSonrasiGun: number } | null
  izlemler?: LiveIzlemRow[]
}

export function payloadFromGebelikApi(patientId: string, veri: LiveGebelikVeri): KadinDogumPayload | null {
  const g = veri.gebelik
  if (!g) return null
  const sat = g.sat && g.sat.length >= 8 ? g.sat.slice(0, 10) : null
  const usgDating = g.tdt_kaynak === 'usg'
  const episode_status: KadinDogumPayload['episode_status'] =
    g.durum === 'aktif' ? 'gebe' : veri.lohusa ? 'lohusa' : 'kapandi'
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
    ga_locked: usgDating ? 'crl' as const : 'sat' as const,
    plurality: 'singleton' as const,
    chorionicity: null,
    ttts: false,
    rh: g.rh_negatif ? 'D-' as const : 'D+' as const,
    idc_history: 'not_tested' as const,
    anti_d: [],
    risk_class: 'dusuk' as const,
    episode_status,
    lohusa_day: veri.lohusa ? Math.min(42, Math.max(0, veri.lohusa.dogumSonrasiGun)) : null,
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

export function usgStudiesFromIzlemler(izlemler: LiveIzlemRow[] | undefined, dating: 'sat' | 'crl'): UsgStudy[] {
  return (izlemler || []).flatMap((i) => {
    const u = i.usg
    if (!u || Object.keys(u).length === 0) return []
    const crl = Number(u.crl)
    const modality = Number.isFinite(crl) && crl > 0 ? 'nt' as const : 'growth' as const
    return [{
      id: i.id,
      blob_handle: `gebelik-izlem:${i.id}`,
      mime: 'image/jpeg' as const,
      ga_weeks: Math.floor(i.hafta),
      ga_days: Math.round((i.hafta % 1) * 7),
      dating_method: dating,
      fetus: 'A' as const,
      modality,
      measurements: {
        CRL: Number.isFinite(crl) ? crl : undefined,
        BPD: Number(u.bpd) || undefined,
        HC: Number(u.hc) || undefined,
        AC: Number(u.ac) || undefined,
        FL: Number(u.fl) || undefined,
        EFW: Number(u.efw) || undefined,
      },
      non_diagnostic: false,
      kvkk_fetal_image_consent: false,
      report_template: modality === 'nt' ? 't1_nt' as const : 'growth' as const,
    }]
  })
}
