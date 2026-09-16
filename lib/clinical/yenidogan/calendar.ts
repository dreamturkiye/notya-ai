import type { AsiKod, PlannedTask, Urgency } from './types'
import { ASI_V1, LOHUSA_GOREVLER, SB_BEBEK_IZLEM } from './constants'

const MS_GUN = 86_400_000

export function isoGun(v: string | Date): string {
  if (typeof v === 'string') return v.slice(0, 10)
  return v.toISOString().slice(0, 10)
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${isoGun(iso)}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function gunFarki(fromIso: string, toIso: string): number {
  const a = new Date(`${isoGun(fromIso)}T00:00:00Z`)
  const b = new Date(`${isoGun(toIso)}T00:00:00Z`)
  return Math.round((b.getTime() - a.getTime()) / MS_GUN)
}

export function pretermOrLbw(input: { gestHafta?: number | null; kiloGram?: number | null }): boolean {
  if (input.gestHafta != null && input.gestHafta < 37) return true
  if (input.kiloGram != null && input.kiloGram < 2500) return true
  return false
}

export function gorevUrgency(dueAt: string, nowIso: string, dueEndAt?: string): Urgency {
  const limit = dueEndAt || dueAt
  const late = gunFarki(limit, nowIso)
  if (late >= 7) return 'red'
  if (late >= 1) return 'amber'
  return 'ok'
}

export type CalendarInput = {
  dogumAt: string
  pretermOrLbw: boolean
  gkdRisk: boolean
  /** If true, skip day-0 hospital lohusa task (already in stay). */
  skipHastaneLohusa?: boolean
}

/**
 * Calendar from dogum_at.
 * Refuse/red never removes a row — caller keeps the task with status=red.
 */
export function generateCalendar(input: CalendarInput): PlannedTask[] {
  const d0 = isoGun(input.dogumAt)
  const out: PlannedTask[] = []

  out.push({
    kind: 'ntp2',
    due_at: addDays(d0, 3),
    due_end_at: addDays(d0, 5),
    title: 'NTP-2 topuk örneği (ASM, 3–5. gün)',
    notes: 'İkinci topuk örneği aile sağlığı merkezinde. Tarama pozitif tanı değildir. Konfirmasyon ve klinik değerlendirme gerekir.',
    source: 'sistem',
    hedef: 'bebek',
  })

  for (const iz of SB_BEBEK_IZLEM) {
    if (iz.due === 0) continue // birth visit is the discharge encounter
    out.push({
      kind: 'izlem',
      due_at: addDays(d0, iz.due),
      due_end_at: addDays(d0, iz.gunSon),
      title: iz.etiket,
      notes: `SB Bebek İzlem penceresi ${iz.gunBas}–${iz.gunSon}. gün.`,
      source: 'sistem',
      hedef: 'bebek',
    })
  }

  out.push({
    kind: 'dvit',
    due_at: addDays(d0, 7),
    title: 'D vitamini başladı mı? (400 IU / 3 damla)',
    notes: '1. haftadan 2 yaşına kadar. SB D vitamini profilaksisi.',
    source: 'sistem',
    hedef: 'bebek',
  })

  const demirGun = input.pretermOrLbw ? 60 : 120
  out.push({
    kind: 'demir',
    due_at: addDays(d0, demirGun),
    title: input.pretermOrLbw ? 'Demir profilaksisi (preterm/DDA — 2. ay)' : 'Demir profilaksisi (4. ay)',
    notes: input.pretermOrLbw
      ? 'Preterm veya düşük doğum ağırlığı: demir 2. aydan. Term: 4. ay.'
      : 'Term bebek: 4. ay demir profilaksisi.',
    source: 'sistem',
    hedef: 'bebek',
  })

  out.push({
    kind: 'hgb',
    due_at: addDays(d0, 180),
    title: 'Hemoglobin / anemi bakısı (6. ay izlem)',
    source: 'sistem',
    hedef: 'bebek',
  })

  if (input.gkdRisk) {
    out.push({
      kind: 'kalca_us',
      due_at: addDays(d0, 42),
      title: 'Kalça US (GKD risk — 6. haftaya kadar)',
      notes: 'Risk yoksa ~3–6. hafta aile hekimi taraması; bu görev yalnız GKD risk işaretinde açılır.',
      source: 'sistem',
      hedef: 'bebek',
    })
  }

  for (const a of ASI_V1) {
    out.push({
      kind: 'asi',
      due_at: addDays(d0, a.gun),
      title: a.etiket,
      source: 'sistem',
      asi_kod: a.kod,
      hedef: 'bebek',
    })
  }

  for (const l of LOHUSA_GOREVLER) {
    if (input.skipHastaneLohusa && l.id === 'pp_hastane') continue
    out.push({
      kind: 'lohusa_anne',
      due_at: addDays(d0, l.due),
      due_end_at: addDays(d0, l.gunSon),
      title: l.etiket,
      notes: 'DSBYR lohusa izlemi — anne kartında. NTP sonuçları anne belgelerine yazılmaz.',
      source: 'sistem',
      hedef: 'anne',
    })
  }

  return out
}

export function asiKodlari(): AsiKod[] {
  return ASI_V1.map((a) => a.kod)
}

/** Missing required taburcu items become follow-up tasks (exception path). */
export function eksikKalemGorevleri(eksik: string[], dogumAt: string): PlannedTask[] {
  const d0 = isoGun(dogumAt)
  const map: Record<string, PlannedTask> = {
    ntp1: {
      kind: 'ntp2',
      due_at: addDays(d0, 0),
      due_end_at: addDays(d0, 5),
      title: 'NTP-1 alınamadı — örnek / sevk görevi',
      notes: 'Taburcu istisnası: ilk topuk örneği tamamlanmadı. Takvim satırı silinmez.',
      source: 'hekim',
      hedef: 'bebek',
    },
    hepb1: {
      kind: 'asi',
      due_at: addDays(d0, 0),
      title: 'Hepatit B 1. doz eksik — tamamla veya sevk',
      source: 'hekim',
      asi_kod: 'HEPB1',
      hedef: 'bebek',
    },
    vitk: {
      kind: 'izlem',
      due_at: addDays(d0, 0),
      title: 'K vitamini 1 mg IM eksik — tamamla',
      source: 'hekim',
      hedef: 'bebek',
    },
    isitme: {
      kind: 'isitme_izlem',
      due_at: addDays(d0, 7),
      title: 'İşitme taraması yapılmadı — izlem',
      source: 'hekim',
      hedef: 'bebek',
    },
  }
  return eksik.map((k) => map[k]).filter(Boolean)
}
