/**
 * Clinic-fit unification: live gebelik_* rows are CRUD truth; chapter engines consume them.
 * Derives calendar done-state, tarama doneIds, next-visit date, dual warnings, lab completeness.
 */
import type { KadinDogumPayload, NstStudyPayload } from '../schema'
import type { WindowId } from './test-windows'
import { completedSbIzlemNos, evaluateCadence } from './izlem-calendar'
import { PREGNANCY_SUPPLEMENTS, PREGNANCY_VACCINES } from '../protocols/supplements-vaccines'
import { evaluateGDM, evaluatePE, evaluateRh, evaluateGBS } from '../protocols/risk-pe-gdm-rh'
import { UI_HINT_YASAL_VS_KLINIK } from '../protocols/sources'
import { suggestPerinatology } from '../protocols/sevk-perinatoloji'
import { sevkFlagsFromRiskForm, type RiskSinifi } from '../protocols/risk-formu'

export type ChecklistDurum = 'yapildi' | 'reddedildi' | 'bekliyor'
export type ChecklistState = Record<string, { durum: ChecklistDurum; neden?: string }>

export type LabSonuc = {
  tarih?: string
  deger?: string
  sonuc?: string
  not?: string
  onam?: boolean
}

export type LabPanel = {
  hemogram?: LabSonuc
  idrar?: LabSonuc
  idrar_kultur?: LabSonuc
  hbsag?: LabSonuc
  kan_grubu?: LabSonuc
  idc?: LabSonuc
  tsh?: LabSonuc
  ogtt?: LabSonuc & { tip?: '50g' | '75g' | '100g'; tani?: string }
  rubella?: LabSonuc
  sifiliz?: LabSonuc
  hiv?: LabSonuc
}

export type DestekAsiDurum = 'yapildi' | 'atlanmadi' | 'bekliyor'
export type DestekAsiKayit = { durum: DestekAsiDurum; tarih?: string; not?: string }
export type DestekAsiPanel = Partial<Record<string, DestekAsiKayit>>

export const DESTEK_ASI_KALEMLERI = [
  ...PREGNANCY_SUPPLEMENTS.map((s) => ({ id: s.id, etiket: s.label, pencere: s.window, not: s.notes, grup: 'destek' as const })),
  ...PREGNANCY_VACCINES.map((s) => ({ id: s.id, etiket: s.label, pencere: s.window, not: s.notes, grup: 'asi' as const })),
]

function filled(s: LabSonuc | undefined): boolean {
  if (!s) return false
  return Boolean(s.deger || s.sonuc || s.tarih)
}

export function doneWindowIdsFromClinic(input: {
  labs?: LabPanel | null
  kanGrubu?: string | null
  idc?: KadinDogumPayload['idc_history']
  izlemler?: Array<{
    hafta: number
    usg?: Record<string, string | number> | null
    ogtt?: unknown
    gbs_kultur?: string | null
  }>
  genetik?: Array<{ tur: string }>
  destekAsi?: DestekAsiPanel | null
  nst?: Array<unknown>
  antiD?: Array<unknown>
}): WindowId[] {
  const done: WindowId[] = []
  const labs = input.labs || {}
  const iz = input.izlemler || []
  const gen = input.genetik || []

  const firstVisit = [
    filled(labs.hemogram),
    filled(labs.idrar) || filled(labs.idrar_kultur),
    filled(labs.hbsag),
    filled(labs.tsh) || Boolean(input.kanGrubu),
    filled(labs.kan_grubu) || Boolean(input.kanGrubu),
  ].filter(Boolean).length
  if (firstVisit >= 3) done.push('first_visit_labs')

  if (gen.some((g) => g.tur === 'ikili')) done.push('ikili_nt')
  if (gen.some((g) => g.tur === 'nipt')) done.push('nipt_optional')
  if (gen.some((g) => g.tur === 'uclu-dortlu')) done.push('triple_quad_afp')

  if (iz.some((i) => i.hafta >= 18 && i.hafta <= 22 && i.usg && Object.keys(i.usg).length > 0)) {
    done.push('ayrintili_usg')
  }
  if (filled(labs.ogtt) || iz.some((i) => i.ogtt && typeof i.ogtt === 'object')) done.push('ogtt_gdm')
  if (input.destekAsi?.anti_d?.durum === 'yapildi' || (input.antiD && input.antiD.length > 0)) {
    done.push('anti_d_28')
  }
  if ((input.nst && input.nst.length > 0) || iz.some((i) => i.hafta >= 28 && i.usg && (i.usg as { kind?: string }).kind === 'doppler')) {
    done.push('nst_bpp_growth')
  }
  if (iz.some((i) => i.gbs_kultur && i.gbs_kultur !== 'bekleniyor')) done.push('gbs_prezentasyon')
  if (gen.some((g) => g.tur === 'invazif')) {
    done.push('amnio')
    done.push('cvs')
  }
  if (iz.some((i) => String((i.usg as { kind?: string } | null)?.kind || '').toLowerCase().includes('3d'))) {
    done.push('souvenir_3d4d')
  }
  return done
}

export function eksikLabKalemleri(labs: LabPanel | null | undefined, kanGrubu?: string | null): string[] {
  const l = labs || {}
  const eksik: string[] = []
  if (!filled(l.hemogram)) eksik.push('Hemogram')
  if (!filled(l.idrar) && !filled(l.idrar_kultur)) eksik.push('İdrar ± kültür')
  if (!filled(l.hbsag)) eksik.push('HBsAg')
  if (!filled(l.kan_grubu) && !kanGrubu) eksik.push('Kan grubu')
  if (!filled(l.idc)) eksik.push('İndirekt Coombs')
  if (!filled(l.tsh)) eksik.push('TSH')
  if (!filled(l.ogtt)) eksik.push('OGTT')
  if (!filled(l.rubella)) eksik.push('Rubella')
  if (!filled(l.sifiliz)) eksik.push('Sifiliz')
  if (!filled(l.hiv) || l.hiv?.onam === false) eksik.push('HIV (onamlı)')
  return eksik
}

export function onerilenSonrakiTarih(input: {
  bugunIso: string
  gaWeeks: number
  risk: RiskSinifi
}): string {
  const days = input.risk === 'yuksek'
    ? (input.gaWeeks >= 28 ? 7 : 14)
    : input.gaWeeks >= 36 ? 7 : input.gaWeeks >= 28 ? 14 : 28
  const d = new Date(`${input.bugunIso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export type DualUyari = {
  seviye: 'kritik' | 'dikkat' | 'bilgi'
  metin?: string
  dual?: { sb: string; acog: string; hint: string }
}

export function dualClinicWarnings(input: {
  gaWeeks: number
  completedSb: Array<1 | 2 | 3 | 4>
  risk: RiskSinifi
  sbp?: number | null
  dbp?: number | null
  proteinuria?: boolean
  ogttPositive?: boolean
  rh: KadinDogumPayload['rh']
  idc: KadinDogumPayload['idc_history']
  gbsKultur?: string | null
}): DualUyari[] {
  const out: DualUyari[] = []
  const cadence = evaluateCadence({
    ga_weeks: input.gaWeeks,
    completed_sb_izlem: input.completedSb,
    risk_class: input.risk,
  })
  if (cadence.conflict) {
    out.push({
      seviye: 'bilgi',
      dual: {
        sb: cadence.sb_required.due ? `DÖBYR: ${cadence.sb_required.detail}` : 'DÖBYR: açık yasal izlem penceresi yok',
        acog: cadence.acog_recommended.due ? `ACOG: ${cadence.acog_recommended.detail}` : 'ACOG: overlay izlem zamanı değil',
        hint: UI_HINT_YASAL_VS_KLINIK,
      },
    })
  }
  const gdm = evaluateGDM({ ogtt_positive: Boolean(input.ogttPositive) })
  if (gdm.conflict && gdm.sb_required && gdm.acog_recommended) {
    out.push({
      seviye: 'bilgi',
      dual: {
        sb: `DÖBYR zorunlu: ${gdm.sb_required.next.join('; ')}`,
        acog: `ACOG: ${gdm.acog_recommended.next.join('; ')}`,
        hint: UI_HINT_YASAL_VS_KLINIK,
      },
    })
  }
  const pe = evaluatePE({
    sbp: input.sbp ?? 0,
    dbp: input.dbp ?? 0,
    proteinuria: Boolean(input.proteinuria),
  })
  if (pe.triage !== 'routine') {
    out.push({
      seviye: pe.triage === 'emergency' ? 'kritik' : 'dikkat',
      dual: {
        sb: `DÖBYR / Riskli Gebelikler: ${pe.next.join('; ')}`,
        acog: `ACOG: ${pe.next.join('; ')}`,
        hint: pe.conflict ? UI_HINT_YASAL_VS_KLINIK : 'çelişki yok — iki sütun aynı adımı gösterir',
      },
    })
  }
  const rh = evaluateRh({ rh: input.rh, idc: input.idc, ga_weeks: input.gaWeeks })
  if (input.rh === 'D-' && input.gaWeeks >= 27 && input.gaWeeks <= 30) {
    out.push({
      seviye: 'dikkat',
      dual: {
        sb: 'DÖBYR: Rh(−) gebede 28. hafta Anti-D değerlendirmesi yasal taban.',
        acog: `ACOG: ${rh.next.join('; ')}`,
        hint: UI_HINT_YASAL_VS_KLINIK,
      },
    })
  }
  const gbs = evaluateGBS({
    ga_weeks: input.gaWeeks,
    kultur: (input.gbsKultur as 'pozitif' | 'negatif' | 'bekleniyor' | null) ?? null,
  })
  if (input.gaWeeks >= 35 && input.gaWeeks <= 37 && gbs.sb_required && gbs.acog_recommended) {
    out.push({
      seviye: 'bilgi',
      dual: {
        sb: `DÖBYR: ${gbs.sb_required.next.join('; ')}`,
        acog: `ACOG: ${gbs.acog_recommended.next.join('; ')}`,
        hint: UI_HINT_YASAL_VS_KLINIK,
      },
    })
  }
  return out
}

export function nstShouldMount(input: {
  gaWeeks: number | null
  risk: RiskSinifi
  nstCount: number
}): boolean {
  if (input.nstCount > 0) return true
  if (input.risk === 'yuksek') return true
  return (input.gaWeeks ?? 0) >= 28
}

export function mapNstKayitlari(raw: unknown, gaWeeks: number, gaDays: number): NstStudyPayload[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((row, i) => {
    const r = row as Record<string, unknown>
    const cat = r.category === 'I' || r.category === 'II' || r.category === 'III' ? r.category : null
    if (!cat) return []
    const id = String(r.id || `nst-${i}`)
    return [{
      id,
      recordedAt: String(r.recordedAt || r.tarih || '').slice(0, 10) || '1970-01-01',
      ga: { weeks: Number(r.hafta ?? gaWeeks) || gaWeeks, days: Number(r.gun ?? gaDays) || gaDays },
      category: cat,
      durationMin: Number(r.durationMin ?? r.sureDk ?? 20) || 20,
      coreTraceId: String(r.coreTraceId || id),
      toco: Boolean(r.toco),
    }]
  })
}

export function mapAntiD(raw: unknown): KadinDogumPayload['anti_d'] {
  if (!Array.isArray(raw)) return []
  const reasons = new Set(['routine_28w', 'postpartum', 'bleed', 'procedure'])
  return raw.flatMap((row) => {
    const r = row as Record<string, unknown>
    const date = String(r.date || r.tarih || '').slice(0, 10)
    if (date.length < 8) return []
    const reasonRaw = String(r.reason || r.endikasyon || 'routine_28w')
    const reason = reasons.has(reasonRaw)
      ? reasonRaw as 'routine_28w' | 'postpartum' | 'bleed' | 'procedure'
      : 'routine_28w'
    return [{
      date,
      week: Number(r.week || r.hafta || 28) || 28,
      dose_ug: Number(r.dose_ug || r.doz || 300) || 300,
      reason,
    }]
  })
}

export function mapIdc(raw: unknown): KadinDogumPayload['idc_history'] {
  if (typeof raw === 'string') {
    const s = raw.toLowerCase()
    if (s.includes('poz') || s === 'positive') return 'positive'
    if (s.includes('neg') || s === 'negative') return 'negative'
    if (s.includes('bilin') || s === 'unknown') return 'unknown'
    return 'not_tested'
  }
  if (!Array.isArray(raw) || raw.length === 0) return 'not_tested'
  const last = raw[raw.length - 1] as Record<string, unknown>
  return mapIdc(last.sonuc || last.result)
}

export function mapPlurality(cogul: string | null | undefined): {
  plurality: KadinDogumPayload['plurality']
  chorionicity: KadinDogumPayload['chorionicity']
} {
  const t = String(cogul || '').toLowerCase()
  if (t.includes('monokoryonik-mono') || t.includes('mo/mo')) {
    return { plurality: 'twins', chorionicity: 'mo/mo' }
  }
  if (t.includes('monokoryonik') || t.includes('mo/di')) {
    return { plurality: 'twins', chorionicity: 'mo/di' }
  }
  if (t.includes('dikoryonik') || t.includes('di/di') || t.includes('ikiz') || t === 'twins') {
    return { plurality: 'twins', chorionicity: 'di/di' }
  }
  if (t.includes('higher') || t.includes('üçüz') || t.includes('cogul') || t === 'higher') {
    return { plurality: 'higher', chorionicity: null }
  }
  return { plurality: 'singleton', chorionicity: null }
}

export function mapCsIncision(raw: string | null | undefined): KadinDogumPayload['obstetric_score']['prior_cs_incision'] {
  const t = String(raw || '').toLowerCase()
  if (t.includes('pfannen') || t.includes('enine') || t.includes('pfannenstiel')) return 'pfannenstiel'
  if (t.includes('median') || t.includes('dikey')) return 'median'
  if (!t) return 'none'
  return 'unknown'
}

export function sevkFromClinic(input: {
  risk: RiskSinifi
  riskMaddeler: readonly string[]
  plurality: KadinDogumPayload['plurality']
  chorionicity: KadinDogumPayload['chorionicity']
  ttts?: boolean
}): ReturnType<typeof suggestPerinatology> {
  const flags = sevkFlagsFromRiskForm(input.riskMaddeler)
  return suggestPerinatology({
    ...flags,
    chorionicity: input.chorionicity,
    ttts: Boolean(input.ttts),
    risk_class: input.risk,
  })
}

export { completedSbIzlemNos }
