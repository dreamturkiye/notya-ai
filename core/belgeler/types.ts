/**
 * NOTYA-BELGE-01 — Shared types for the multi-engine document AI (Notya Belgeler).
 * One contract for every tier: A (Claude vision, server), B (browser ONNX engines), C (GPU worker, later).
 */
import type { Modalite } from './ontoloji'

export type Tier = 'A' | 'B' | 'C'

/** What one engine returns. Never a diagnosis — findings with probabilities on ontology codes. */
export type MotorCiktisi = {
  motor: string              // 'claude-vision' | 'txrv-densenet121' | 'hear-icbhi' …
  surum: string
  tier: Tier
  /** engine validated on this modality (from motor_kayit) → allowed to carry a single-engine tanı */
  dogrulanmis: boolean
  labels: { kod: string; p: number; raw?: string }[]
  metrikler?: Record<string, number | string>
  rapor?: string             // free-text report (MedGemma/Claude describe)
  kalite?: 'iyi' | 'orta' | 'dusuk'
  modaliteTahmini?: Modalite | null
  sure_ms?: number
  hata?: string
}

export type FuzedBulgu = {
  kod: string
  label_tr: string
  p: number                  // fused probability
  agree: number              // weighted agreement count
  sources: string[]          // engines that supported it
  karsi: string[]            // engines that ran on the modality and did NOT support it
}

export type FusionSonuc = {
  fused: FuzedBulgu[]
  acilBayrak: boolean
  acilNedenler: string[]
  capPct: number             // the maximum guven_pct any tanı may carry in this analysis
  sinirlar: string[]
  kalite: 'iyi' | 'orta' | 'dusuk'
}

export type GuvenBant = 'yüksek' | 'orta' | 'düşük'

/** Claude output schema (locked in Kaan's spec) */
export type Tani = {
  ad: string
  icd10?: string | null
  guven_pct: number
  guven_bant: GuvenBant
  destek: string[]
  karsi: string[]
}

export type BelgeRaporu = {
  modalite: string
  kalite: 'iyi' | 'orta' | 'dusuk'
  ozet: string
  bulgular: string[]
  tanilar: Tani[]
  acil_bayrak: boolean
  oneri: string
  sinirlar: string[]
  hekim_tanisi: string[]
  engines_used: string[]
}

export type AnalizGirdi = {
  brans: string
  modality_final: Modalite
  yasAy?: number | null
  cinsiyet?: 'K' | 'E' | null
  klinikNot?: string | null   // doctor's one-line context ("3 gündür ateş, öksürük")
}
