/**
 * NOTYA-JINE-OFIS — Unified office gynecology visit (Bugünkü jinekoloji muayenesi).
 * Clinic-fit doctrine: additive jsonb on jine_vizitler (patient×doctor), never specialty_records.payload.
 * Gold: ACOG practice. Ulusal: DÖBYR / SB KETEM. Textbook: Williams / Berek & Novak / Temel KD.
 * Conflict = dual columns, never merge. Jine sticky never shows pregnancy GA/TDT.
 */
import type { Due } from './jinekoloji-spine'

export type JineHikaye = {
  sikayet: string
  sure: string
  lmp: string | null
  gravida_para: string
  ilac: string
  allerji: string
  kontrasepsiyon: string
}

export type JineMuayene = {
  spekulum: string
  bimanuel: string
  tvus: string
  serbest: string
}

export type JineAP = {
  degerlendirme: string
  plan: string[]
}

export type JineTarama = {
  pap: string
  hpv: string
  sitoloji: string
  histoloji: string
  sonrakiDue: string | null
  dueCue: string
}

export type JineKontrol = {
  tarih: string | null
  neden: string
}

export type JineOfisSoap = {
  hikaye: JineHikaye
  muayene: JineMuayene
  degerlendirme: JineAP
  tarama: JineTarama
  kontrol: JineKontrol
}

export type JineStickyChip = { kod: string; etiket: string; deger: string }

export const BOS_HIKAYE: JineHikaye = {
  sikayet: '', sure: '', lmp: null, gravida_para: '', ilac: '', allerji: '', kontrasepsiyon: '',
}
export const BOS_MUAYENE: JineMuayene = { spekulum: '', bimanuel: '', tvus: '', serbest: '' }
export const BOS_AP: JineAP = { degerlendirme: '', plan: [] }
export const BOS_TARAMA: JineTarama = { pap: '', hpv: '', sitoloji: '', histoloji: '', sonrakiDue: null, dueCue: '' }
export const BOS_KONTROL: JineKontrol = { tarih: null, neden: '' }
export const BOS_SOAP: JineOfisSoap = {
  hikaye: { ...BOS_HIKAYE },
  muayene: { ...BOS_MUAYENE },
  degerlendirme: { degerlendirme: '', plan: [] },
  tarama: { ...BOS_TARAMA },
  kontrol: { ...BOS_KONTROL },
}

const METIN = (v: unknown, azami = 2000) => String(v ?? '').trim().slice(0, azami)
const TARIH = (v: unknown): string | null => {
  const s = String(v ?? '').trim().slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null
}

export function normalizeSoap(ham: unknown): JineOfisSoap {
  const o = (ham && typeof ham === 'object' ? ham : {}) as Record<string, unknown>
  const h = (o.hikaye && typeof o.hikaye === 'object' ? o.hikaye : o) as Record<string, unknown>
  const m = (o.muayene && typeof o.muayene === 'object' ? o.muayene : {}) as Record<string, unknown>
  const d = (o.degerlendirme && typeof o.degerlendirme === 'object' ? o.degerlendirme : {}) as Record<string, unknown>
  const t = (o.tarama && typeof o.tarama === 'object' ? o.tarama : {}) as Record<string, unknown>
  const k = (o.kontrol && typeof o.kontrol === 'object' ? o.kontrol : {}) as Record<string, unknown>
  const planHam = Array.isArray(d.plan) ? d.plan : typeof d.plan === 'string' ? String(d.plan).split(/\n+/) : []
  return {
    hikaye: {
      sikayet: METIN(h.sikayet, 800),
      sure: METIN(h.sure, 80),
      lmp: TARIH(h.lmp),
      gravida_para: METIN(h.gravida_para, 40),
      ilac: METIN(h.ilac, 400),
      allerji: METIN(h.allerji, 400),
      kontrasepsiyon: METIN(h.kontrasepsiyon, 120),
    },
    muayene: {
      spekulum: METIN(m.spekulum, 800),
      bimanuel: METIN(m.bimanuel, 800),
      tvus: METIN(m.tvus ?? m.tvus_et_mm, 800),
      serbest: METIN(m.serbest, 1200),
    },
    degerlendirme: {
      degerlendirme: METIN(d.degerlendirme ?? d.assessment, 1200),
      plan: planHam.map((x) => METIN(x, 240)).filter(Boolean).slice(0, 12),
    },
    tarama: {
      pap: METIN(t.pap, 80),
      hpv: METIN(t.hpv, 80),
      sitoloji: METIN(t.sitoloji, 400),
      histoloji: METIN(t.histoloji, 400),
      sonrakiDue: TARIH(t.sonrakiDue),
      dueCue: METIN(t.dueCue, 240),
    },
    kontrol: {
      tarih: TARIH(k.tarih),
      neden: METIN(k.neden, 240),
    },
  }
}

/** Reconstruct SOAP from a legacy yillik vizit alanlar blob. */
export function soapFromAlanlar(alanlar: Record<string, unknown> | null | undefined): JineOfisSoap {
  const a = alanlar || {}
  return normalizeSoap({
    hikaye: {
      lmp: a.lmp, gravida_para: a.gravida_para, kontrasepsiyon: a.kontrasepsiyon,
      ilac: a.ilac, allerji: a.allerji, sikayet: a.sikayet, sure: a.sure,
    },
    muayene: {
      spekulum: a.spekulum, bimanuel: a.bimanuel,
      tvus: a.tvus || [a.tvus_et_mm, a.tvus_uterus_mm, a.tvus_overler].filter(Boolean).join(' · '),
      serbest: a.meme_palpasyon,
    },
    tarama: { pap: a.pap, hpv: a.hpv },
  })
}

export function soapFromVizitRow(row: {
  soap?: unknown
  alanlar?: Record<string, unknown> | null
  kontrol_tarihi?: string | null
  kontrol_neden?: string | null
} | null | undefined): JineOfisSoap {
  if (!row) return { ...BOS_SOAP, hikaye: { ...BOS_HIKAYE }, muayene: { ...BOS_MUAYENE }, degerlendirme: { degerlendirme: '', plan: [] }, tarama: { ...BOS_TARAMA }, kontrol: { ...BOS_KONTROL } }
  const soapVar = row.soap && typeof row.soap === 'object' && Object.keys(row.soap as object).length > 0
  const base = soapVar ? normalizeSoap(row.soap) : soapFromAlanlar(row.alanlar)
  if (row.kontrol_tarihi && !base.kontrol.tarih) base.kontrol.tarih = TARIH(row.kontrol_tarihi)
  if (row.kontrol_neden && !base.kontrol.neden) base.kontrol.neden = METIN(row.kontrol_neden, 240)
  return base
}

function dueCueYaz(due: Due[] | undefined): { cue: string; sonrakiDue: string | null } {
  const pap = due?.find((d) => d.kod === 'pap' || d.kod === 'hpv')
  const hedef = due?.find((d) => d.durum === 'gecikti') || due?.find((d) => d.durum === 'yaklasiyor') || pap
  if (!hedef) return { cue: '', sonrakiDue: null }
  const durum = hedef.durum === 'gecikti' ? 'gecikti' : hedef.durum === 'yaklasiyor' ? 'yaklaşıyor' : 'planlı'
  return { cue: `${hedef.ad} · ${durum}${hedef.due ? ` · ${isoToTr(hedef.due)}` : ''}`, sonrakiDue: hedef.due }
}

/**
 * Seed today's visit from last visit + kadin_sagligi + due engine.
 * Carries chronic problems, G/P, SAT, meds, allergy, contraception, Pap/HPV slots.
 * Does NOT carry today's complaint, duration, exam, or plan bullets.
 */
export function taslakBugunkuVizit(girdi: {
  sonSoap?: JineOfisSoap | null
  kadinSagligi?: Record<string, unknown> | null
  due?: Due[]
  kontrasepsiyon?: string | null
}): JineOfisSoap {
  const son = girdi.sonSoap ? normalizeSoap(girdi.sonSoap) : BOS_SOAP
  const ks = girdi.kadinSagligi || {}
  const { cue, sonrakiDue } = dueCueYaz(girdi.due)
  const lmp = son.hikaye.lmp || TARIH(ks.son_adet_tarihi)
  const kontr = son.hikaye.kontrasepsiyon || METIN(girdi.kontrasepsiyon ?? ks.kontrasepsiyon_yontemi, 120)
  return {
    hikaye: {
      sikayet: '',
      sure: '',
      lmp,
      gravida_para: son.hikaye.gravida_para,
      ilac: son.hikaye.ilac,
      allerji: son.hikaye.allerji,
      kontrasepsiyon: kontr,
    },
    muayene: { ...BOS_MUAYENE },
    degerlendirme: { degerlendirme: son.degerlendirme.degerlendirme, plan: [] },
    tarama: {
      pap: son.tarama.pap,
      hpv: son.tarama.hpv,
      sitoloji: son.tarama.sitoloji,
      histoloji: son.tarama.histoloji,
      sonrakiDue: sonrakiDue || son.tarama.sonrakiDue,
      dueCue: cue || son.tarama.dueCue,
    },
    kontrol: { tarih: son.kontrol.tarih, neden: son.kontrol.neden },
  }
}

export function flattenSoapAlanlar(soap: JineOfisSoap): Record<string, unknown> {
  return {
    lmp: soap.hikaye.lmp,
    gravida_para: soap.hikaye.gravida_para,
    kontrasepsiyon: soap.hikaye.kontrasepsiyon,
    sikayet: soap.hikaye.sikayet,
    sure: soap.hikaye.sure,
    ilac: soap.hikaye.ilac,
    allerji: soap.hikaye.allerji,
    spekulum: soap.muayene.spekulum,
    bimanuel: soap.muayene.bimanuel,
    tvus: soap.muayene.tvus,
    degerlendirme: soap.degerlendirme.degerlendirme,
    plan: soap.degerlendirme.plan,
  }
}

export function ofisVizitOzet(soap: JineOfisSoap): string {
  const parca: string[] = ['Jinekoloji ofis muayenesi.']
  if (soap.hikaye.sikayet) parca.push(`Şikayet: ${soap.hikaye.sikayet}${soap.hikaye.sure ? ` (${soap.hikaye.sure})` : ''}.`)
  if (soap.hikaye.lmp) parca.push(`Jine SAT ${isoToTr(soap.hikaye.lmp)}.`)
  if (soap.muayene.spekulum || soap.muayene.bimanuel || soap.muayene.tvus) {
    parca.push(`Muayene: ${[soap.muayene.spekulum && `spekulum ${soap.muayene.spekulum}`, soap.muayene.bimanuel && `bimanuel ${soap.muayene.bimanuel}`, soap.muayene.tvus && `TVUS ${soap.muayene.tvus}`].filter(Boolean).join('; ')}.`)
  }
  if (soap.degerlendirme.degerlendirme) parca.push(`Değerlendirme: ${soap.degerlendirme.degerlendirme}.`)
  if (soap.degerlendirme.plan.length) parca.push(`Plan: ${soap.degerlendirme.plan.join('; ')}.`)
  if (soap.tarama.pap || soap.tarama.hpv) parca.push(`Tarama: Pap ${soap.tarama.pap || '—'} · HPV ${soap.tarama.hpv || '—'}.`)
  if (soap.kontrol.tarih) parca.push(`Kontrol ${isoToTr(soap.kontrol.tarih)}${soap.kontrol.neden ? ` (${soap.kontrol.neden})` : ''}.`)
  return parca.join(' ')
}

const GEBE_SIZINTI = /TDT|\bGA\b|hafta\s*\d|gebelik SAT|trimester|Naegele|EDD/i

export function jineSticky(girdi: {
  lmp: string | null
  yas: number | null
  kontrasepsiyon: string | null
  due?: Due[]
  sonrakiKontrol: string | null
  gebe: boolean
}): { chips: JineStickyChip[]; gebeChip: string | null } {
  const pap = girdi.due?.find((d) => d.kod === 'pap')
  const hpv = girdi.due?.find((d) => d.kod === 'hpv')
  const tarama = hpv || pap
  let taramaDeger = 'kayıt yok'
  if (tarama) {
    const durum = tarama.durum === 'gecikti' ? 'gecikti' : tarama.durum === 'yaklasiyor' ? 'yaklaşıyor' : tarama.durum === 'planli' ? 'planlı' : '—'
    taramaDeger = `${tarama.kod === 'hpv' ? 'HPV' : 'Pap'} ${durum}${tarama.due ? ` · ${isoToTr(tarama.due)}` : ''}`
  }
  const chips: JineStickyChip[] = [
    { kod: 'lmp', etiket: 'Jine SAT', deger: girdi.lmp ? isoToTr(girdi.lmp) : '—' },
    { kod: 'yas', etiket: 'Yaş', deger: girdi.yas != null ? `${girdi.yas}` : '—' },
    { kod: 'kontrasepsiyon', etiket: 'Kontrasepsiyon', deger: girdi.kontrasepsiyon?.trim() || '—' },
    { kod: 'pap_hpv', etiket: 'Pap/HPV', deger: taramaDeger },
    { kod: 'kontrol', etiket: 'Sonraki kontrol', deger: girdi.sonrakiKontrol ? isoToTr(girdi.sonrakiKontrol) : '—' },
  ]
  return {
    chips,
    gebeChip: girdi.gebe ? 'Aktif gebelik → Klinik/Doğum spine' : null,
  }
}

export function jineStickyGebelikSizdiriyor(chips: JineStickyChip[]): boolean {
  return chips.some((c) => GEBE_SIZINTI.test(`${c.etiket} ${c.deger}`) || c.kod === 'tdt' || c.kod === 'ga' || c.kod === 'hafta')
}

/** Display ISO date as TR gg.aa.yyyy. Never mm/dd/yyyy. */
export function isoToTr(iso: string | null | undefined): string {
  const t = TARIH(iso)
  if (!t) return ''
  const [y, m, d] = t.split('-')
  return `${d}.${m}.${y}`
}

/** Parse TR gg.aa.yyyy or ISO yyyy-mm-dd → ISO. Empty / invalid → null. */
export function trTarihOku(girdi: string | null | undefined): string | null {
  const s = String(girdi ?? '').trim()
  if (!s) return null
  const iso = TARIH(s)
  if (iso) return iso
  const tr = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/.exec(s)
  if (!tr) return null
  const d = Number(tr[1]), m = Number(tr[2]), y = Number(tr[3])
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2100) return null
  const dt = new Date(Date.UTC(y, m - 1, d))
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export const OFIS_VIZIT_TUR = 'ofis'
