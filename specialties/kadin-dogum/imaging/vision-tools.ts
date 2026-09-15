/**
 * Asistan USG/NST vision. Wrap core görüntüleme.
 * analyze_usg / analyze_nst always return VisionRead status draft.
 * Asistan cannot finalize. Dual-sign: asistan draft → uzman onay.
 */
import type { NstStudyPayload, UsgSeriesPayload, UsgStudyPayload, VisionRead } from '../schema'
import { compareGrowth } from './usg-series'
import { nstAction } from './nst-ctg'

export const VISION_DISCLAIMER = 'Ölçüm ve tarama desteği, tanı değildir. Uzman onayı gerekir.' as const
export const CORE_GORUNTULEME_PATH = '/api/doktor/goruntuleme'

export type Actor = 'asistan' | 'uzman'
export type UsgTask = 'erken_canlilik' | 'nt_olcum' | 'anomali_checklist' | 'buyume_efw' | 'doppler'

export function listUsgSeries(series: UsgSeriesPayload[]): UsgSeriesPayload[] {
  return series
}

export function getUsg(series: UsgSeriesPayload, studyIds: string[]): UsgStudyPayload[] {
  const want = new Set(studyIds)
  return series.studies.filter((s) => want.has(s.id) || want.has(s.coreImageId))
}

export function compareGrowthSeries(series: UsgSeriesPayload, fetusId: 'A' | 'B') {
  return compareGrowth(series, fetusId)
}

export function analyzeUsg(input: {
  studyIds: string[]
  task: UsgTask
  actor: Actor
  findings: string
}): VisionRead {
  return {
    id: `vr-usg-${input.studyIds.join('-')}-${input.task}`,
    assetIds: input.studyIds,
    task: input.task,
    status: 'draft',
    drafted_by: input.actor,
    approved_by: null,
    findings: input.findings.trim()
      || 'Taslak USG okuma: ölçüm ve tarama desteği. Fetal anomali tanısı konulmaz. Uzman onayı gerekir.',
    disclaimer: VISION_DISCLAIMER,
  }
}

export function analyzeNst(input: { nst: NstStudyPayload; actor: Actor; findings?: string }): VisionRead {
  return {
    id: `vr-nst-${input.nst.id}`,
    assetIds: [input.nst.coreTraceId],
    task: 'nst',
    status: 'draft',
    drafted_by: input.actor,
    approved_by: null,
    findings: (input.findings ?? '').trim()
      || `NST kategori ${input.nst.category}; ${nstAction(input.nst.category).join('; ')}. Fetal iyilik taslağı, tanı değildir.`,
    disclaimer: VISION_DISCLAIMER,
  }
}

export function requestDualReview(read: VisionRead): VisionRead {
  if (read.status === 'uzman_onayli') return read
  return { ...read, status: 'draft' }
}

export function asistanSelfApproveBlocked(read: VisionRead, actor: Actor): boolean {
  return actor === 'asistan' && read.drafted_by === 'asistan'
}

export function uzmanOnay(read: VisionRead, actor: Actor): { ok: true; read: VisionRead } | { ok: false; reason: string } {
  if (actor !== 'uzman') {
    return {
      ok: false,
      reason: asistanSelfApproveBlocked(read, actor)
        ? 'dual-sign cannot self-approve as asistan'
        : 'asistan cannot finalize a VisionRead',
    }
  }
  return {
    ok: true,
    read: { ...read, status: 'uzman_onayli', approved_by: 'uzman' },
  }
}

export const KD_IMAGING_TOOLS = [
  'kd.list_usg_series',
  'kd.get_usg',
  'kd.compare_growth',
  'kd.analyze_usg',
  'kd.analyze_nst',
  'kd.request_dual_review',
] as const
