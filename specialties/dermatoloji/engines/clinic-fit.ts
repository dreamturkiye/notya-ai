/**
 * Visit-first dermatology clinic-fit. Live tables are CRUD truth.
 * Imaging stays in hasta_goruntulemeler; this engine derives sticky chips, aktif işler, deep-links.
 */
import { profileForUnit } from '../protocols/clinic-units'
import type { ClinicUnit, VisitType } from '../types'
import { patchStatus } from './patch-calendar'
import { annualTbseDue, cumulativeJ, SOLARIUM_FORBIDDEN, PHOTO_DEVICES, type PhotoSession } from './phototherapy-log'
import { euromelanomaMonth, tbseIntervalMonths, type RiskBand } from './screening-reminders'
import { gopIsotretinoin, type GopInput, type GopSex } from './gop-isotretinoin'
import { genitalOrChildBlocked } from '../imaging/consent-kvkk'
import type { PatchCourse, PhotoAsset, ScoreSnapshot } from '../schema'

export type ChecklistDurum = 'yapildi' | 'reddedildi' | 'bekliyor'
export type ChecklistState = Record<string, { durum: ChecklistDurum; neden?: string }>

export type DermAktifIs = {
  id: string
  etiket: string
  durum: 'gecikmis' | 'zamani' | 'eksik'
}

export type DermBelgeOzet = {
  id: string
  belgeId: string
  durum: string
  modality: string
  ozet: string
  tanilar: string[]
  hekimOnayli: boolean
  olusturuldu: string
  coreImageId?: string | null
}

export function goruntulemeCaptureHref(
  patientId: string,
  modalite: 'dermatoskopi' | 'derm' | 'yara' = 'dermatoskopi',
): string {
  return `/dashboard/doktor/goruntuleme?hastaId=${encodeURIComponent(patientId)}&modalite=${modalite}&upload=1`
}

export function belgeAnalizHref(
  patientId: string,
  belgeId: string,
  modality: 'derm' | 'dermatoskopi' | 'yara' = 'dermatoskopi',
  fitzpatrick?: string,
): string {
  const q = new URLSearchParams({ modalityFinal: modality })
  if (fitzpatrick) q.set('fitzpatrick', fitzpatrick)
  return `/dashboard/doktor/hastalar/${encodeURIComponent(patientId)}/belgeler/${encodeURIComponent(belgeId)}?${q.toString()}`
}

export function belgelerTabHref(patientId: string, modality: 'derm' | 'dermatoskopi' = 'dermatoskopi'): string {
  return `/dashboard/doktor/hastalar/${encodeURIComponent(patientId)}?tab=belgeler&dermModality=${modality}`
}

export function latestScores(snapshots: ScoreSnapshot[] | null | undefined): ScoreSnapshot | null {
  if (!snapshots?.length) return null
  return [...snapshots].sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))[0] ?? null
}

export function skorOzeti(s: ScoreSnapshot | null): string {
  if (!s) return '—'
  const bits: string[] = []
  if (s.pasi != null) bits.push(`PASI ${s.pasi}`)
  if (s.easi != null) bits.push(`EASI ${s.easi}`)
  if (s.dlqi != null) bits.push(`DLQI ${s.dlqi}`)
  return bits.length ? bits.join(' · ') : '—'
}

export function gopChip(input: Omit<GopInput, 'today_iso'> | null | undefined, todayIso: string, sex: GopSex): string {
  const pack: GopInput = {
    two_contraception: false,
    hcg_iso: null,
    hcg_negative: false,
    cycle_day: null,
    rx_days: 30,
    start_iso: todayIso,
    today_iso: todayIso,
    sex,
    ...(input || {}),
  }
  const r = gopIsotretinoin(pack)
  if (sex === 'male') return r.allowed ? 'GÖP erkek — gebelik kapısı yok' : 'GÖP reçete süresi'
  return r.allowed ? 'GÖP tam' : 'GÖP eksik'
}

export function yamaChip(course: PatchCourse | null | undefined, todayIso: string): string {
  if (!course) return 'Yama yok'
  const st = patchStatus(course, todayIso)
  if (st === 'done') return 'Yama tamam'
  if (st === 'overdue_d2') return 'Yama D2 gecikmiş'
  if (st === 'overdue_d4') return 'Yama D4 gecikmiş'
  if (st === 'open_d2') return 'Yama D2 zamanı'
  if (st === 'open_d4') return 'Yama D4 zamanı'
  return 'Yama bekliyor'
}

export function fototerapiChip(sessions: PhotoSession[] | null | undefined): string {
  const list = sessions || []
  if (!list.length) return SOLARIUM_FORBIDDEN ? 'Fototerapi yok · solaryum yok' : 'Fototerapi yok'
  return `Fototerapi ${cumulativeJ(list)} J/cm²`
}

export function tbseCue(lastTbseIso: string | null | undefined, todayIso: string, risk: RiskBand = 'medium'): string {
  const due = annualTbseDue(lastTbseIso ?? null, todayIso)
  const month = Number(todayIso.slice(5, 7))
  const euro = month === euromelanomaMonth() ? ' · Euromelanoma Mayıs' : ''
  if (!lastTbseIso) return `TBSE planla (${tbseIntervalMonths(risk)} ay)${euro}`
  if (due) return `TBSE yıllık vadesi${euro}`
  return `TBSE ${lastTbseIso}${euro}`
}

export function nextPhotoCue(nextPhotoIso: string | null | undefined, todayIso: string): string {
  if (!nextPhotoIso) return 'Sonraki foto planla'
  return nextPhotoIso <= todayIso ? `Foto vadesi ${nextPhotoIso}` : `Sonraki foto ${nextPhotoIso}`
}

export function unitChecklist(unit: ClinicUnit): string[] {
  return profileForUnit(unit).checklist
}

export function defaultVisitType(unit: ClinicUnit): VisitType {
  return profileForUnit(unit).defaultVisitType
}

export function timepointLabel(index: number, at: string, firstAt: string, intervalDays: number): string {
  if (index === 0) return 'month-0'
  if (intervalDays >= 80 && intervalDays <= 110) return 'month-3'
  if (intervalDays >= 160 && intervalDays <= 200) return 'month-6'
  return `t${index}`
}

export function aktifIslerFromClinic(input: {
  unit: ClinicUnit
  todayIso: string
  scores: ScoreSnapshot | null
  patch: PatchCourse | null
  sessions: PhotoSession[]
  lastTbseIso: string | null
  gopAllowed: boolean
  sex: GopSex
  photos: PhotoAsset[]
  pediatric?: boolean
  nextPhotoIso?: string | null
  bullousDif?: boolean | null
  unitIsBullu?: boolean
}): DermAktifIs[] {
  const items: DermAktifIs[] = []
  const chk = unitChecklist(input.unit)

  if (chk.includes('PASI') && input.scores?.pasi == null) {
    items.push({ id: 'pasi', etiket: 'PASI skoru yok', durum: 'eksik' })
  }
  if (chk.includes('EASI') && input.scores?.easi == null) {
    items.push({ id: 'easi', etiket: 'EASI skoru yok', durum: 'eksik' })
  }
  if (chk.includes('DLQI') && input.scores?.dlqi == null) {
    items.push({ id: 'dlqi', etiket: 'DLQI skoru yok', durum: 'eksik' })
  }
  if (chk.includes('UAS7') && input.scores?.uas7 == null) {
    items.push({ id: 'uas7', etiket: 'UAS7 skoru yok', durum: 'eksik' })
  }
  if (chk.includes('SALT') && input.scores?.salt == null) {
    items.push({ id: 'salt', etiket: 'SALT skoru yok', durum: 'eksik' })
  }

  if (input.patch) {
    const st = patchStatus(input.patch, input.todayIso)
    if (st === 'overdue_d2') items.push({ id: 'yama-d2', etiket: 'Yama D2 okuması gecikmiş', durum: 'gecikmis' })
    else if (st === 'overdue_d4') items.push({ id: 'yama-d4', etiket: 'Yama D4 okuması gecikmiş', durum: 'gecikmis' })
    else if (st === 'open_d2') items.push({ id: 'yama-d2-acik', etiket: 'Yama D2 okuma zamanı', durum: 'zamani' })
    else if (st === 'open_d4') items.push({ id: 'yama-d4-acik', etiket: 'Yama D4 okuma zamanı', durum: 'zamani' })
  } else if (input.unit === 'kontakt-yama') {
    items.push({ id: 'yama-yok', etiket: 'Aktif yama serisi yok', durum: 'eksik' })
  }

  if (input.unit === 'fototerapi' && input.sessions.length === 0) {
    items.push({ id: 'ft-yok', etiket: 'Fototerapi seansı yok', durum: 'eksik' })
  }

  if (annualTbseDue(input.lastTbseIso, input.todayIso) && (input.unit === 'nevus-tumor' || input.unit === 'fototerapi')) {
    items.push({ id: 'tbse', etiket: 'TBSE vadesi', durum: input.lastTbseIso ? 'gecikmis' : 'eksik' })
  }

  if (input.sex !== 'male' && !input.gopAllowed && (input.unit === 'genel' || input.unit === 'pediatrik')) {
    /* GÖP is not always today's work — only cue when isotretinoin pack is the visit focus via missing gates shown on strip */
  }

  if (input.nextPhotoIso && input.nextPhotoIso <= input.todayIso) {
    items.push({ id: 'foto', etiket: `Kontrol fotoğrafı ${input.nextPhotoIso}`, durum: 'zamani' })
  }

  if (input.pediatric && input.photos.some((p) => !p.pediatric_consent)) {
    items.push({ id: 'ped-onam', etiket: '18 yaş altı görüntü onamı eksik', durum: 'eksik' })
  }

  const blocked = input.photos.filter(genitalOrChildBlocked)
  if (blocked.length) {
    items.push({ id: 'genital-onam', etiket: 'Genital görüntü onamı olmadan kilitli', durum: 'eksik' })
  }

  if (input.unitIsBullu && input.bullousDif === false) {
    items.push({ id: 'dif', etiket: 'Biyopsi + DIF zorunlu', durum: 'eksik' })
  }

  if (input.photos.length === 0) {
    items.push({ id: 'goruntu', etiket: 'Klinik / dermoskopi fotoğrafı yok', durum: 'eksik' })
  }

  return items
}

export function belgeDurumEtiket(durum: string): string {
  if (durum === 'onaylandi' || durum === 'muayene_onaylandi') return 'Hekim onaylı'
  if (durum === 'hekim_duzenledi') return 'Hekim düzenledi'
  if (durum === 'taslak') return 'Taslak'
  if (durum === 'kalite_dusuk') return 'Kalite düşük'
  if (durum === 'modalite_uyusmazlik') return 'Modalite uyuşmazlığı'
  if (durum === 'hata') return 'Hata'
  return durum
}

export function belgeHekimOnayli(durum: string): boolean {
  return durum === 'onaylandi' || durum === 'muayene_onaylandi'
}

export { SOLARIUM_FORBIDDEN, PHOTO_DEVICES }
