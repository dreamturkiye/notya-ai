/**
 * SAGLIGIM-PORTAL-REGISTRY (Kaan 2026-09-17) — which specialty modules attach to one Sağlığım token.
 *
 * One shell, many chapters: core (mesajlar/ziyaretler/sonuçlar/ilaçlar/öykü/takip vitals) is always
 * loaded; everything else is declared on the chapter profile (`SpecialtyProfile.portal`) and attached
 * only when its eligibility fires for (doctor specialty of the token × patient records × age).
 *
 * Rules (.cursor/skills/specialty-hasta-portali/SKILL.md):
 *  - The token doctor's own chapter module is the primary module (doctor_specialty).
 *  - Gebeliğim follows a truly active pregnancy record for any practice (mixed care).
 *  - Cross-chapter "chart data" modules (büyüme age rule, jine reminders) fire only for a doctor whose
 *    branch has no portal module of its own — a göz / derm / dahiliye / KD doctor never gets pediatri
 *    growth curves, and only a KD doctor gets Pap/HPV as a default card. Same for the dahiliye ön anket
 *    (dahiliye doctor, or a baseline-branch doctor whose patient has dahiliye cards).
 * KONSULTASYON-01: "Yönlendirmeleriniz" bir chapter modülü DEĞİLDİR — her branşın hastasına aynı, çekirdek omurgadır
 * (PortalBundle.yonlendirmeler, Ziyaretler sayfası). Bu çözücüye bilerek eklenmedi; branş kapısı yok.
 * Pure + client-safe (no fs, no Supabase).
 */
import { specialtyProfile } from '@/lib/specialties/registry'
import { bransAnahtari } from '@/lib/specialties/bransAnahtari'
import type { PortalModulId, PortalModulu, PortalNavOge } from '@/lib/specialties/profile'
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'

/**
 * users.specialty is free text in older accounts ("İç Hastalıkları", "Göz Hastalıkları Uzmanı") and 'kadin-dogum' on
 * live KD profiles. Resolution is the single bransAnahtari(); an unknown value is passed through (lower-cased).
 */
export function portalBransAnahtari(ham: string | null | undefined): SpecialtyKey | null {
  const b = String(ham || '').trim().toLocaleLowerCase('tr-TR')
  if (!b) return null
  return bransAnahtari(b) ?? (b as SpecialtyKey)
}

export interface PortalUygunlukGirdisi {
  doktorBransi: string | null | undefined
  /** patient age in years (fractional), null when DOB unknown */
  hastaYasYil: number | null
  gebelikAktif: boolean
  /** kadin_sagligi / kontrasepsiyon row exists (KD chart data) */
  kdKaydi: boolean
  /** at least one kilo/boy/baş çevresi point on an approved note */
  buyumeOlcumu: boolean
  /** at least one dahiliye card (HT/DM/lipid/…) on the patient */
  dahiliyeKaydi: boolean
}

export interface PortalModulSonucu {
  moduller: PortalModulId[]
  nav: PortalNavOge[]
}

function modul(key: SpecialtyKey, id: PortalModulId): PortalModulu | undefined {
  return specialtyProfile(key).portal?.find((m) => m.id === id)
}

export function portalModulleri(g: PortalUygunlukGirdisi): PortalModulSonucu {
  const brans = portalBransAnahtari(g.doktorBransi)
  const kendiModulleri = brans ? (specialtyProfile(brans).portal || []).filter((m) => m.derinlik !== 'Missing') : []
  const kendiModuluVar = !!brans && (specialtyProfile(brans).portal || []).length > 0
  const cocuk = g.hastaYasYil != null && g.hastaYasYil < 18
  const aktif = new Set<PortalModulId>()

  // pediatri: own doctor (child or unknown DOB), or a baseline-branch doctor with a child + growth data
  if (brans === 'pediatri' ? g.hastaYasYil == null || cocuk : !kendiModuluVar && cocuk && g.buyumeOlcumu) aktif.add('buyume')
  // KD: Gebeliğim on an active pregnancy for any practice
  if (g.gebelikAktif) aktif.add('gebelik')
  // KD jine reminders: KD doctor, or a baseline-branch doctor when KD chart data exists
  if (brans === 'kadin-hastaliklari-dogum' || (!kendiModuluVar && g.kdKaydi)) aktif.add('jinekoloji')
  // doctor_specialty modules
  // dahiliye ön anket: dahiliye doctor, or a baseline-branch doctor (aile hekimi, endokrin…) using dahiliye cards
  if (brans === 'dahiliye' || (!kendiModuluVar && g.dahiliyeKaydi)) aktif.add('dahiliye')
  if (brans === 'goz-hastaliklari') aktif.add('gozlerim')
  if (brans === 'dermatoloji') aktif.add('dermatoloji')
  // PSIK-EXCEPTIONAL-01 — Ruh Sağlığım yalnız psikiyatri hekiminin token'ında; başka branşa hiç taşınmaz
  // (ruh sağlığı içeriği hasta için en hassas veri: "çapraz kart verisi" ile açılmaz).
  if (brans === 'psikiyatri') aktif.add('psikiyatri')
  // KBB-EXCEPTIONAL-01 — Kulaklarım yalnız KBB hekiminin token'ında; başka branşa hiç taşınmaz
  // (kulak/burun/boğaz izlemi "çapraz kart verisi" ile açılmaz).
  if (brans === 'kulak-burun-bogaz') aktif.add('kulaklarim')
  // KARDIO-EXCEPTIONAL-01 — Kalbim yalnız kardiyoloji hekiminin token'ında; başka branşa hiç taşınmaz.
  if (brans === 'kardiyoloji') aktif.add('kalbim')
  // GOGUS-EXCEPTIONAL-01 — Akciğerlerim yalnız göğüs hastalıkları hekiminin token'ında; başka branşa
  // (dahiliye / gogus-cerrahisi dahil) hiç taşınmaz.
  if (brans === 'gogus-hastaliklari') aktif.add('akcigerlerim')
  // NOROLOJI-EXCEPTIONAL-01 — Nörolojimm yalnız nöroloji hekiminin token'ında.
  if (brans === 'noroloji') aktif.add('norolojim')
  // UROLOJI-EXCEPTIONAL-01 — Ürolojimm yalnız üroloji hekiminin token'ında; başka branşa hiç taşınmaz.
  if (brans === 'uroloji') aktif.add('urolojim')

  // Nav: own chapter's modules first, then anything else that attached (e.g. Gebeliğim for a göz patient).
  const sirali = [...kendiModulleri.map((m) => m.id).filter((id) => aktif.has(id)), ...[...aktif].filter((id) => !kendiModulleri.some((m) => m.id === id))]
  const SAHIP: Record<PortalModulId, SpecialtyKey> = {
    buyume: 'pediatri', gebelik: 'kadin-hastaliklari-dogum', jinekoloji: 'kadin-hastaliklari-dogum',
    dahiliye: 'dahiliye', gozlerim: 'goz-hastaliklari', dermatoloji: 'dermatoloji', psikiyatri: 'psikiyatri',
    kulaklarim: 'kulak-burun-bogaz', kalbim: 'kardiyoloji', akcigerlerim: 'gogus-hastaliklari',
    norolojim: 'noroloji', urolojim: 'uroloji',
  }
  const nav = sirali.flatMap((id) => modul(SAHIP[id], id)?.nav || [])
  return { moduller: sirali, nav }
}

export function portalModulAktif(data: { portal?: { moduller: PortalModulId[] } | null }, id: PortalModulId): boolean {
  return !!data.portal?.moduller.includes(id)
}
