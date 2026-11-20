import type { AsiKod, PlannedTask, Urgency } from './types'
import { ASI_V1, LOHUSA_GOREVLER, SB_BEBEK_IZLEM } from './constants'
import { ALTILI_GECIS_DOGUM } from '@/specialties/pediatri/engines/asiPlan'
import { ayEkle } from '@/specialties/pediatri/engines/girdi'

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

export type YenidoganAsi = { kod: AsiKod; etiket: string; gun: number; /** Calendar months from birth (engine arithmetic). */ ay?: number }
/** ASI_V1 day values → the schedule's calendar month ("2. ayın sonu" = birth date + 2 calendar months, as asiPlan). */
const GUN_AY: Record<number, number> = { 0: 0, 30: 1, 60: 2, 120: 4, 180: 6, 365: 12, 547: 18, 730: 24 }

/**
 * ASI-TAKVIM-TEK-01 (2026-11-20) — the newborn vaccine list on the SAME schedule the shared engine
 * (specialties/pediatri/engines/asiPlan.ts, lib/asi/ulusalAsiTakvimi.ts) uses, so the bebek kartı tasks and vaccine
 * rows never disagree with Ayşe, the aşı planlayıcı and the öneriler cohort.
 *
 * Root cause: ASI_V1 is the PRE-2025 list (5'li karma + Hep B 0-1-6) and was applied to every baby, so a baby born under
 * the 2025 GBP (6'lı karma, Hep B inside the 2/4/6/18. ay karma doses — no separate 1. ay dose) got a "Hepatit B 2. doz"
 * task at day 30 that the national schedule does not have, while Ayşe (6'lı karma engine) said nothing was due.
 *   - born before ALTILI_GECIS_DOGUM → ASI_V1 unchanged (önceki takvim);
 *   - born on / after it → no HEPB2 / HEPB3; karma rows named 6'lı karma; one KPA rapel (2-4-12);
 *   - < 2000 g → the TND 2026 1. ay tekli Hep B dose stays (HEPB2 slot), birth dose labelled "seriye sayılmaz".
 */
export function yenidoganAsiListesi(input: { dogumAt: string; kiloGram?: number | null }): YenidoganAsi[] {
  if (isoGun(input.dogumAt) < ALTILI_GECIS_DOGUM) return ASI_V1
  const dusuk = input.kiloGram != null && input.kiloGram > 0 && input.kiloGram < 2000
  const out: YenidoganAsi[] = []
  for (const a of ASI_V1) {
    if (a.kod === 'HEPB3' || a.kod === 'KPA4') continue
    if (a.kod === 'HEPB2') { if (dusuk) out.push({ ...a, etiket: 'Hepatit B tekli doz (< 2000 g, 1. ay — TND 2026)' }); continue }
    if (a.kod === 'HEPB1' && dusuk) { out.push({ ...a, etiket: 'Hepatit B doğum dozu (< 2000 g — seriye sayılmaz, TND 2026)' }); continue }
    if (a.kod === 'KPA3') { out.push({ ...a, etiket: 'KPA rapel (12. ay)' }); continue }
    if (a.kod.startsWith('DABTIPA_HIB')) { out.push({ ...a, etiket: a.etiket.replace('DaBT-İPA-Hib', "6'lı karma (DaBT-İPA-Hib-HepB)") }); continue }
    out.push(a)
  }
  return out.map((a) => (GUN_AY[a.gun] != null ? { ...a, ay: GUN_AY[a.gun] } : a))
}

export type CalendarInput = {
  dogumAt: string
  /** Birth weight (g) — < 2000 g keeps the 1. ay tekli Hep B dose (TND 2026). */
  kiloGram?: number | null
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

  for (const a of yenidoganAsiListesi({ dogumAt: input.dogumAt, kiloGram: input.kiloGram })) {
    out.push({
      kind: 'asi',
      due_at: a.ay != null ? ayEkle(d0, a.ay) : addDays(d0, a.gun),
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
