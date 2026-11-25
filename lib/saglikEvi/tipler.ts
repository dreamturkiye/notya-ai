/**
 * HASTA-PORTALI-GUNLUK (Kaan, 2026-11-24) — shared contracts of the Sağlığım daily health home: home readings, the dose
 * plan, dose events, the rule engine's alerts, badges and the patient's preferences. Pure types — client and server.
 */
import type { HastaModulTercihi } from './moduller'

/** Home measurement kinds. 'kb' carries systolic in `deger`, diastolic in `deger2`. */
export type OlcumTipi = 'kb' | 'glukoz' | 'kilo' | 'nabiz' | 'spo2' | 'ates' | 'bel' | 'su'
export const OLCUM_TIPLERI: readonly OlcumTipi[] = ['kb', 'glukoz', 'kilo', 'nabiz', 'spo2', 'ates', 'bel', 'su']

/** Glucose context. Other kinds have no context (null). */
export type GlukozBaglami = 'aclik' | 'tokluk2' | 'yatmadan' | 'rastgele'
export const GLUKOZ_BAGLAMLARI: readonly GlukozBaglami[] = ['aclik', 'tokluk2', 'yatmadan', 'rastgele']

export type OlcumKaynagi = 'portal' | 'portal_foto' | 'hekim'

export interface EvOlcum {
  id: string
  tip: OlcumTipi
  deger: number
  deger2: number | null
  baglam: GlukozBaglami | null
  olcumAt: string
  kaynak: OlcumKaynagi
}

/** Rule-engine level. 'acil' always tells the patient to call 112 — Notya is not an emergency service. */
export type UyariDuzeyi = 'bilgi' | 'dikkat' | 'hekime_bildir' | 'acil'
export const DUZEY_SIRASI: Record<UyariDuzeyi, number> = { bilgi: 0, dikkat: 1, hekime_bildir: 2, acil: 3 }

export interface DozPlani {
  id: string
  /** hasta_ilaclar.id for a doctor's medicine; null for a patient-added one. */
  ilacId: string | null
  ad: string
  /** The dose text exactly as written by the doctor (or the patient) — never computed. */
  doz: string | null
  /** 'HH:MM' Türkiye times. Empty for an as-needed plan. */
  saatler: string[]
  /** As needed ("gerektiğinde") — logged when taken, no schedule. */
  gerektikce: boolean
  /** Weekly plan: weekday 0 = Monday … 6 = Sunday; null = every day. */
  haftaGunu: number | null
  kaynak: 'hekim' | 'hasta'
  /** Doctor-flagged: two missed days notify the doctor too. */
  kritik: boolean
  /** Doctor-set minimum interval for an as-needed plan (hours) — displayed, never computed. */
  minAralikSaat: number | null
  aktif: boolean
  baslangic: string | null
  bitis: string | null
}

export type DozDurumu = 'alindi' | 'atlandi' | 'ertelendi'

export interface DozKaydi {
  id: string
  planId: string
  /** Scheduled instant of the slot (as-needed: the moment it was taken). */
  planlananAt: string
  durum: DozDurumu
  kayitAt: string
  erteleUntil: string | null
}

/** A slot's state on a given day. */
export type SlotDurumu = DozDurumu | 'bekliyor' | 'zamani' | 'kacirildi'

export interface EvUyari {
  id: string
  kural: string
  anahtar: string
  duzey: UyariDuzeyi
  metrik: string
  hastaMetni: string
  hekimMetni: string
  olusturmaAt: string
  hastaGorduAt: string | null
  hekimGorduAt: string | null
  veri?: Record<string, unknown>
}

export interface EvTercihler {
  /** KVKK açık rıza: home data is shared with the doctor (doctor-side views, alerts, pre-visit summary). */
  paylasimOnayi: boolean
  onayAt: string | null
  sessizBas: string
  sessizBit: string
  hatirlatmaAcik: boolean
  /** HASTA-MODULLERI: optional modules the patient added / branş-default modules they switched off (ev_tercihler.moduller). */
  moduller: HastaModulTercihi
}

export const VARSAYILAN_TERCIHLER: EvTercihler = { paylasimOnayi: false, onayAt: null, sessizBas: '23:00', sessizBit: '07:00', hatirlatmaAcik: true, moduller: { eklenen: [], cikarilan: [] } }

/** Version of the consent text the patient accepted (stored with the consent). */
export const PAYLASIM_ONAY_SURUMU = 'saglik-evi-paylasim-v1-2026-11-24'
