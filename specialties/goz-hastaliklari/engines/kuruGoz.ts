/**
 * GOZ-DRYEYE — Structured dry-eye record (OSDI, Schirmer, TBUT). Pure.
 * Scores are recorded as the clinician enters them; no diagnosis language, no auto-severity.
 * OSDI interpretation bands are published instrument cut-points (Schiffman et al. / DEWS teaching use).
 */
import type { Dipnot } from '../protocols/sources'

export type KuruGozGirdi = {
  osdi: number | null // 0–100
  schirmerSag: number | null // mm / 5 dk
  schirmerSol: number | null
  tbutSag: number | null // saniye
  tbutSol: number | null
  notHekim: string | null
}

export type OsdiBand = 'normal' | 'hafif' | 'orta' | 'siddetli' | null

export function osdiBand(osdi: number | null): OsdiBand {
  if (osdi == null || !Number.isFinite(osdi)) return null
  if (osdi < 0 || osdi > 100) return null
  if (osdi <= 12) return 'normal'
  if (osdi <= 22) return 'hafif'
  if (osdi <= 32) return 'orta'
  return 'siddetli'
}

export function kuruGozOzet(g: KuruGozGirdi): {
  osdiBand: OsdiBand
  schirmerDusuk: boolean
  tbutDusuk: boolean
  ozetSatir: string
  uyarilar: string[]
  dipnotlar: Dipnot[]
} {
  const band = osdiBand(g.osdi)
  const schirmerDusuk = [g.schirmerSag, g.schirmerSol].some((x) => x != null && x < 10)
  const tbutDusuk = [g.tbutSag, g.tbutSol].some((x) => x != null && x < 10)
  const uyarilar: string[] = []
  if (g.osdi != null && (g.osdi < 0 || g.osdi > 100)) uyarilar.push('OSDI 0–100 aralığında olmalı')
  if (band === 'siddetli') uyarilar.push('OSDI şiddetli aralık — klinik karar hekimin (tedavi sınıfı önerilmez)')
  if (schirmerDusuk) uyarilar.push('Schirmer <10 mm — hekim yorumlar')
  if (tbutDusuk) uyarilar.push('TBUT <10 sn — hekim yorumlar')

  const parcalar: string[] = []
  if (g.osdi != null && band) parcalar.push(`OSDI ${g.osdi} (${band})`)
  if (g.schirmerSag != null || g.schirmerSol != null) parcalar.push(`Schirmer R/L ${g.schirmerSag ?? '—'} / ${g.schirmerSol ?? '—'} mm`)
  if (g.tbutSag != null || g.tbutSol != null) parcalar.push(`TBUT R/L ${g.tbutSag ?? '—'} / ${g.tbutSol ?? '—'} sn`)
  if (g.notHekim) parcalar.push(g.notHekim.slice(0, 120))

  return {
    osdiBand: band,
    schirmerDusuk,
    tbutDusuk,
    ozetSatir: parcalar.join(' · ') || 'Kuru göz ölçümü yok',
    uyarilar,
    dipnotlar: [
      { ref: 'SUT_4233', not: 'SUT 4.2.33.D suni gözyaşı / siklosporin kuralları — doz hekim yazar' },
      { ref: 'TOD', not: 'TOD Kornea — üye dokümanı hekim teyit; OSDI bantları yayınlanmış kesim noktaları' },
    ],
  }
}
