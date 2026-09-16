/**
 * Map live dermatology tables + core görüntüleme into a specialty payload.
 * PASI / Fitzpatrick / dermoscopy stay here — never on core patient/visit types.
 * Photos are coreImageId only. Never copy pixels into JSON.
 * Stored clinic state wins; görüntüleme overlays photos (no second blob store).
 */
import {
  CLINIC_UNITS,
  VISIT_TYPES,
  dermatolojiPayloadSchema,
  visionReadSchema,
  photoSessionSchema,
  scoreSnapshotSchema,
  patchCourseSchema,
  type DermatolojiPayload,
  type Lesion,
  type PhotoAsset,
  type PatchCourse,
  type ScoreSnapshot,
  type VisionRead,
} from '../../specialties/dermatoloji/schema'
import { pairBeforeAfter } from '../../specialties/dermatoloji/imaging/before-after'
import { gopIsotretinoin, type GopInput, type GopResult, type GopSex } from '../../specialties/dermatoloji/engines/gop-isotretinoin'
import { defaultVisitType, timepointLabel } from '../../specialties/dermatoloji/engines/clinic-fit'
import { diffDays } from '../../specialties/dermatoloji/engines/dates'
import type { PhotoSession } from '../../specialties/dermatoloji/engines/phototherapy-log'
import type { ClinicUnit, VisitType } from '../../specialties/dermatoloji/types'

export type LiveGoruntuRow = {
  id: string
  modalite?: string | null
  vucut_bolgesi?: string | null
  goruntuleme_tarihi?: string | null
  created_at?: string | null
  dosya_url?: string | null
}

export type LiveFotoMeta = {
  core_image_id: string
  lesion_id?: string | null
  document_id?: string | null
  kind?: string | null
  genital_consent?: boolean | null
  pediatric_consent?: boolean | null
  education_anonymized?: boolean | null
  patient_share?: boolean | null
}

export type LiveLezyonRow = {
  id: string
  region: string
  morphology?: string | null
  body_map_node?: string | null
  notes?: string | null
  document_id?: string | null
}

export type LiveDermKayit = {
  id: string
  unit?: string | null
  visit_type?: string | null
  patient_derm?: Record<string, unknown> | null
  gop?: Record<string, unknown> | null
  total_body_map?: DermatolojiPayload['total_body_map'] | null
  bedside_tests?: DermatolojiPayload['bedside_tests'] | null
  hair_workup?: DermatolojiPayload['hair_workup'] | null
  bullous_workup?: DermatolojiPayload['bullous_workup'] | null
  behcet_card?: DermatolojiPayload['behcet_card'] | null
  last_tbse_iso?: string | null
  next_photo_iso?: string | null
  acitretin_ban?: boolean | null
  tb_screen?: boolean | null
  hbv_screen?: boolean | null
  bzbh_kind?: string | null
  ugly_duckling?: boolean | null
  psa_joint?: boolean | null
}

export type LiveSkorRow = ScoreSnapshot & { id?: string }
export type LiveFotoSeans = PhotoSession
export type LiveYamaRow = PatchCourse & { id?: string }
export type LiveVisionRow = VisionRead

export type LiveBelgeAnaliz = {
  id: string
  belge_id: string
  durum: string
  modality_final?: string | null
  sonuc?: { ozet?: string; tanilar?: Array<{ ad?: string }> } | null
  hekim_ozet?: string | null
  hekim_tanisi?: Array<{ ad?: string }> | null
  olusturuldu?: string | null
}

export type LiveDermVeri = {
  kayit?: LiveDermKayit | null
  lezyonlar?: LiveLezyonRow[]
  skorlar?: LiveSkorRow[]
  fototerapi?: LiveFotoSeans[]
  yama?: LiveYamaRow[]
  vision?: LiveVisionRow[]
  fotoMeta?: LiveFotoMeta[]
  goruntulemeler?: LiveGoruntuRow[]
  belgeAnalizleri?: LiveBelgeAnaliz[]
}

const PHOTO_KIND_SET = new Set([
  'klinik_genel', 'klinik_yakin', 'dermoskopi_polarize', 'dermoskopi_immersion',
  'dijital_harita', 'islem_oncesi', 'islem_sonrasi', 'tedavi_hafta_n',
  'yama_d2', 'yama_d4', 'wood', 'trichoscopy', 'patoloji_makro',
])

function asClinicUnit(raw: unknown): ClinicUnit {
  return typeof raw === 'string' && (CLINIC_UNITS as readonly string[]).includes(raw)
    ? raw as ClinicUnit
    : 'genel'
}

function asVisitType(raw: unknown, unit: ClinicUnit): VisitType {
  return typeof raw === 'string' && (VISIT_TYPES as readonly string[]).includes(raw)
    ? raw as VisitType
    : defaultVisitType(unit)
}

function keepParsed<T>(schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false } }, rows: unknown[]): T[] {
  return rows.flatMap((row) => {
    const p = schema.safeParse(row)
    return p.success ? [p.data] : []
  })
}

function emptyDermPayload(patientId: string, episodeId: string): DermatolojiPayload {
  return {
    specialty: 'dermatoloji',
    episode_id: episodeId,
    patient_id: patientId,
    visit_type: 'genel-poliklinik',
    unit: 'genel',
    patient_derm: asPatientDerm(null),
    lesions: [],
    photos: [],
    image_series: [],
    before_after: [],
    vision_reads: [],
    total_body_map: null,
    bedside_tests: [],
    patch_courses: [],
    hair_workup: null,
    bullous_workup: null,
    behcet_card: null,
    admission: null,
    last_tbse_iso: null,
  }
}

function photoKind(modalite: string | null | undefined, metaKind?: string | null): PhotoAsset['kind'] {
  if (metaKind && PHOTO_KIND_SET.has(metaKind)) return metaKind as PhotoAsset['kind']
  const m = (modalite || '').toLowerCase()
  if (m.includes('dermatoskopi') || m.includes('dermoskopi')) return 'dermoskopi_polarize'
  if (m === 'derm') return 'klinik_genel'
  if (m.includes('yama') && m.includes('d4')) return 'yama_d4'
  if (m.includes('yama')) return 'yama_d2'
  if (m.includes('yara')) return 'klinik_yakin'
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

function asPatientDerm(raw: Record<string, unknown> | null | undefined): DermatolojiPayload['patient_derm'] {
  const r = raw || {}
  const fitz = r.fitzpatrick
  const photo = r.phototype
  return {
    occupation: typeof r.occupation === 'string' ? r.occupation : '',
    atopic: r.atopic === true,
    family_atopy: r.family_atopy === true,
    ...(typeof fitz === 'string' && ['I', 'II', 'III', 'IV', 'V', 'VI'].includes(fitz)
      ? { fitzpatrick: fitz as DermatolojiPayload['patient_derm']['fitzpatrick'] }
      : {}),
    ...(typeof photo === 'string' && ['I', 'II', 'III', 'IV', 'V', 'VI'].includes(photo)
      ? { phototype: photo as DermatolojiPayload['patient_derm']['phototype'] }
      : {}),
    ...(typeof r.hla_b51 === 'boolean' ? { hla_b51: r.hla_b51 } : {}),
    ...(typeof r.behcet_history === 'boolean' ? { behcet_history: r.behcet_history } : {}),
  }
}

function asGop(raw: Record<string, unknown> | null | undefined, todayIso: string): DermatolojiPayload['gop'] | undefined {
  if (!raw || Object.keys(raw).length === 0) return undefined
  return {
    two_contraception: raw.two_contraception === true,
    hcg_iso: typeof raw.hcg_iso === 'string' ? raw.hcg_iso : null,
    hcg_negative: raw.hcg_negative === true,
    cycle_day: typeof raw.cycle_day === 'number' ? raw.cycle_day : null,
    rx_days: typeof raw.rx_days === 'number' ? raw.rx_days : 30,
    start_iso: typeof raw.start_iso === 'string' ? raw.start_iso : todayIso,
  }
}

function buildSeriesAndPairs(lesions: Lesion[], photos: PhotoAsset[]) {
  const image_series = lesions.flatMap((lesion) => {
    const group = photos
      .filter((p) => p.lesionId === lesion.id)
      .sort((a, b) => a.capturedAt.localeCompare(b.capturedAt))
    if (!group.length) return []
    const first = group[0].capturedAt
    return [{
      id: `ser-${lesion.id}`,
      lesionId: lesion.id,
      timepoints: group.map((p, i) => ({
        at: p.capturedAt,
        label: timepointLabel(i, p.capturedAt, first, diffDays(p.capturedAt, first)),
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

  return { image_series, before_after }
}

function overlayPhotos(
  rows: LiveGoruntuRow[],
  lesions: Lesion[],
  metaByImage: Map<string, LiveFotoMeta>,
): { lesions: Lesion[]; photos: PhotoAsset[] } {
  const byId = new Map(lesions.map((l) => [l.id, l]))
  const byRegion = new Map<string, Lesion>()
  for (const l of lesions) {
    if (!byRegion.has(l.region)) byRegion.set(l.region, l)
  }

  const photos: PhotoAsset[] = []
  let derived = 0
  for (const r of rows) {
    const meta = metaByImage.get(r.id)
    const region = r.vucut_bolgesi || 'unspecified'
    let lesion = (meta?.lesion_id && byId.get(meta.lesion_id)) || byRegion.get(region)
    if (!lesion) {
      derived += 1
      lesion = { id: `L${lesions.length + derived}`, region, morphology: 'unspecified' }
      lesions = [...lesions, lesion]
      byId.set(lesion.id, lesion)
      byRegion.set(region, lesion)
    }
    photos.push({
      id: r.id,
      coreImageId: r.id,
      kind: photoKind(r.modalite, meta?.kind),
      lesionId: lesion.id,
      capturedAt: (r.goruntuleme_tarihi || r.created_at || '1970-01-01').slice(0, 10),
      region: lesion.region,
      genital_consent: meta?.genital_consent === true,
      pediatric_consent: meta?.pediatric_consent === true,
      education_anonymized: meta?.education_anonymized === true,
      patient_share: meta?.patient_share === true,
      ...(meta?.document_id ? { documentId: meta.document_id } : {}),
    })
  }
  return { lesions, photos }
}

export function payloadFromGoruntuleme(
  patientId: string,
  rows: LiveGoruntuRow[],
  todayIso = '1970-01-01',
): DermatolojiPayload {
  return payloadFromDermApi(patientId, { goruntulemeler: rows }, todayIso)
}

export function payloadFromDermApi(
  patientId: string,
  veri: LiveDermVeri,
  todayIso = '1970-01-01',
): DermatolojiPayload {
  const kayit = veri.kayit
  const storedLesions: Lesion[] = (veri.lezyonlar || []).map((l) => ({
    id: l.id,
    region: l.region || 'unspecified',
    morphology: l.morphology || 'unspecified',
    ...(l.body_map_node ? { body_map_node: l.body_map_node } : {}),
    ...(l.notes ? { notes: l.notes } : {}),
    ...(l.document_id ? { documentId: l.document_id } : {}),
  }))
  const metaByImage = new Map((veri.fotoMeta || []).map((m) => [m.core_image_id, m]))
  const { lesions, photos } = overlayPhotos(veri.goruntulemeler || [], storedLesions, metaByImage)
  const { image_series, before_after } = buildSeriesAndPairs(lesions, photos)

  const tbm = kayit?.total_body_map
    ?? (lesions.length
      ? { deviceHint: 'manual' as const, nodeIds: lesions.map((l) => l.body_map_node || l.id), followUpMonths: 6 }
      : null)

  const unit = asClinicUnit(kayit?.unit)
  const visit_type = asVisitType(kayit?.visit_type, unit)
  const episodeId = kayit?.id || `derm-${patientId}`

  const raw = {
    specialty: 'dermatoloji' as const,
    episode_id: episodeId,
    patient_id: patientId,
    visit_type,
    unit,
    patient_derm: asPatientDerm(kayit?.patient_derm),
    lesions,
    photos,
    image_series,
    before_after,
    vision_reads: keepParsed(visionReadSchema, veri.vision || []),
    total_body_map: tbm,
    bedside_tests: kayit?.bedside_tests || [],
    patch_courses: keepParsed(patchCourseSchema, (veri.yama || []) as unknown[]),
    hair_workup: kayit?.hair_workup ?? null,
    bullous_workup: kayit?.bullous_workup ?? null,
    behcet_card: kayit?.behcet_card ?? null,
    admission: null,
    gop: asGop(kayit?.gop, todayIso),
    score_snapshots: keepParsed(scoreSnapshotSchema, veri.skorlar || []),
    phototherapy_sessions: keepParsed(photoSessionSchema, veri.fototerapi || []),
    last_tbse_iso: (typeof kayit?.last_tbse_iso === 'string' && kayit.last_tbse_iso.length >= 8)
      ? kayit.last_tbse_iso.slice(0, 10)
      : null,
    acitretin_ban: kayit?.acitretin_ban === true,
    tb_screen: kayit?.tb_screen === true,
    hbv_screen: kayit?.hbv_screen === true,
    ...(kayit?.bzbh_kind ? { bzbh_kind: kayit.bzbh_kind } : {}),
    ugly_duckling: kayit?.ugly_duckling === true,
    psa_joint: kayit?.psa_joint === true,
  }
  const parsed = dermatolojiPayloadSchema.safeParse(raw)
  if (!parsed.success) {
    const fallback = emptyDermPayload(patientId, episodeId)
    const withPhotos = dermatolojiPayloadSchema.safeParse({
      ...fallback,
      unit,
      visit_type,
      patient_derm: asPatientDerm(kayit?.patient_derm),
      lesions,
      photos,
      image_series,
      before_after,
      vision_reads: keepParsed(visionReadSchema, veri.vision || []),
    })
    return withPhotos.success ? withPhotos.data : fallback
  }
  return parsed.data
}
