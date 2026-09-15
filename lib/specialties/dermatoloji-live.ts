/**
 * Map core hasta_goruntulemeler rows into a dermatology specialty payload.
 * PASI / Fitzpatrick / dermoscopy stay here — never on core patient/visit types.
 * Photos are coreImageId only. Never copy pixels into JSON.
 */
import { dermatolojiPayloadSchema, type DermatolojiPayload, type PhotoAsset } from '../../specialties/dermatoloji/schema'
import { pairBeforeAfter } from '../../specialties/dermatoloji/imaging/before-after'
import { gopIsotretinoin, type GopInput, type GopResult, type GopSex } from '../../specialties/dermatoloji/engines/gop-isotretinoin'

export type LiveGoruntuRow = {
  id: string
  modalite?: string | null
  vucut_bolgesi?: string | null
  goruntuleme_tarihi?: string | null
  created_at?: string | null
  dosya_url?: string | null
}

function photoKind(modalite: string | null | undefined): PhotoAsset['kind'] {
  const m = (modalite || '').toLowerCase()
  if (m.includes('derm')) return 'dermoskopi_polarize'
  if (m.includes('yama') && m.includes('d4')) return 'yama_d4'
  if (m.includes('yama')) return 'yama_d2'
  if (m === 'us') return 'klinik_yakin'
  return 'klinik_genel'
}

function missingGop(todayIso: string): NonNullable<DermatolojiPayload['gop']> {
  return {
    two_contraception: false,
    hcg_iso: null,
    hcg_negative: false,
    cycle_day: null,
    rx_days: 30,
    start_iso: todayIso,
  }
}

export function gopBlockFromPayload(
  payload: DermatolojiPayload,
  todayIso: string,
  sex: GopSex = 'unknown',
): GopResult {
  const g = payload.gop ?? missingGop(todayIso)
  const input: GopInput = { ...g, today_iso: todayIso, sex }
  return gopIsotretinoin(input)
}

export function displayUrlsFromGoruntuleme(rows: LiveGoruntuRow[]): Record<string, string> {
  const urls: Record<string, string> = {}
  for (const r of rows) {
    if (r.dosya_url) urls[r.id] = r.dosya_url
  }
  return urls
}

export function payloadFromGoruntuleme(
  patientId: string,
  rows: LiveGoruntuRow[],
  todayIso = '1970-01-01',
): DermatolojiPayload {
  const grouped = new Map<string, LiveGoruntuRow[]>()
  for (const r of rows) {
    const region = r.vucut_bolgesi || 'unspecified'
    const list = grouped.get(region) ?? []
    list.push(r)
    grouped.set(region, list)
  }

  const lesions = [...grouped.keys()].map((region, i) => ({
    id: `L${i + 1}`,
    region,
    morphology: 'unspecified',
  }))

  const photos: PhotoAsset[] = []
  for (const lesion of lesions) {
    const group = grouped.get(lesion.region) || []
    for (const r of group) {
      photos.push({
        id: r.id,
        coreImageId: r.id,
        kind: photoKind(r.modalite),
        lesionId: lesion.id,
        capturedAt: (r.goruntuleme_tarihi || r.created_at || '1970-01-01').slice(0, 10),
        region: lesion.region,
        genital_consent: false,
        pediatric_consent: false,
        education_anonymized: false,
        patient_share: false,
      })
    }
  }

  const image_series = lesions.flatMap((lesion) => {
    const group = photos
      .filter((p) => p.lesionId === lesion.id)
      .sort((a, b) => a.capturedAt.localeCompare(b.capturedAt))
    if (!group.length) return []
    return [{
      id: `ser-${lesion.id}`,
      lesionId: lesion.id,
      timepoints: group.map((p, i) => ({
        at: p.capturedAt,
        label: i === 0 ? 'month-0' : `t${i}`,
        photoIds: [p.id],
      })),
    }]
  })

  const before_after = lesions.flatMap((lesion) => {
    const group = photos
      .filter((p) => p.lesionId === lesion.id)
      .sort((a, b) => a.capturedAt.localeCompare(b.capturedAt))
    if (group.length < 2) return []
    const pair = pairBeforeAfter(group[0], group[group.length - 1], lesion.id)
    return 'intervalDays' in pair ? [pair] : []
  })

  const raw = {
    specialty: 'dermatoloji' as const,
    episode_id: `derm-${patientId}`,
    patient_id: patientId,
    visit_type: 'genel-poliklinik' as const,
    unit: 'genel' as const,
    patient_derm: {
      fitzpatrick: 'III' as const,
      occupation: '',
      phototype: 'III' as const,
      atopic: false,
      family_atopy: false,
    },
    lesions,
    photos,
    image_series,
    before_after,
    vision_reads: [],
    total_body_map: lesions.length
      ? { deviceHint: 'manual' as const, nodeIds: lesions.map((l) => l.id), followUpMonths: 6 }
      : null,
    bedside_tests: [],
    patch_courses: [],
    hair_workup: null,
    bullous_workup: null,
    behcet_card: null,
    admission: null,
    gop: missingGop(todayIso),
  }
  const parsed = dermatolojiPayloadSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error('dermatoloji live payload failed schema')
  }
  return parsed.data
}
