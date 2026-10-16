/**
 * NOTYA-ASI-ONAM-01 — pure engine for the vaccine informed-consent system. No Supabase, no
 * Next.js, no AI call: every API route and UI component delegates validation and the content
 * snapshot to this file, so the rule lives in exactly one place.
 *
 * REUSABLE ENGINE (Phase 2 contract): every function here takes its vaccine content and locale as
 * data (`AsiOnamUlkePaketi`), not as a hardcoded Turkish assumption. Porting to one of the six
 * non-Turkey country modules (Phase 2) means supplying that country's own `AsiOnamUlkePaketi`
 * (its own vaccine schedule + consent content, in its own language, per
 * .cursor/skills/international-data-model-dogrulama/SKILL.md — never a translated copy of the
 * Turkish dataset) and its own Pediatri-equivalent branş key; nothing in this file changes.
 */
import { ASI_ONAM_ICERIGI, asiOnamIcerigiBul, type AsiOnamIcerigi } from './asiOnamIcerigi'
import { ceviriCoz, ceviriListesiCoz, VARSAYILAN_ONAM_DILI, type AsiOnamDil } from './dil'
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'

export type AsiOnamYontemi = 'klinik' | 'uzaktan-eposta' | 'uzaktan-whatsapp' | 'uzaktan-portal' | 'kagit'
export const ASI_ONAM_YONTEMLERI: readonly AsiOnamYontemi[] = ['klinik', 'uzaktan-eposta', 'uzaktan-whatsapp', 'uzaktan-portal', 'kagit']
export type AsiOnamDurumu = 'alindi' | 'reddedildi'
export const ASI_ONAM_DURUMLARI: readonly AsiOnamDurumu[] = ['alindi', 'reddedildi']

export const ASI_ONAM_YONTEMI_ETIKETI: Record<AsiOnamYontemi, string> = {
  klinik: 'Klinikte (veli hazır)',
  'uzaktan-eposta': 'Uzaktan — e-posta bildirimiyle',
  'uzaktan-whatsapp': 'Uzaktan — WhatsApp bildirimiyle',
  'uzaktan-portal': 'Uzaktan — doğrudan Sağlığım',
  kagit: 'Kağıt form (imzalı)',
}

export function asiOnamYontemiGecerliMi(x: unknown): x is AsiOnamYontemi {
  return typeof x === 'string' && (ASI_ONAM_YONTEMLERI as readonly string[]).includes(x)
}
export function asiOnamDurumuGecerliMi(x: unknown): x is AsiOnamDurumu {
  return typeof x === 'string' && (ASI_ONAM_DURUMLARI as readonly string[]).includes(x)
}

/** One country/locale's vaccine-consent data pack — the Phase 2 extension point (see file header). */
export interface AsiOnamUlkePaketi {
  dil: AsiOnamDil
  icerik: AsiOnamIcerigi[]
  /** That pack's Pediatri-equivalent branş key (Türkiye: 'pediatri'). */
  pediatriBransi: SpecialtyKey
}

export const TURKIYE_ASI_ONAM_PAKETI: AsiOnamUlkePaketi = {
  dil: 'tr',
  icerik: ASI_ONAM_ICERIGI,
  pediatriBransi: 'pediatri',
}

export interface AsiOnamIcerikGosterimi {
  ad: string
  korur: string
  yanEtkiler: string[]
  onamCumlesi: string
  kaynak: string
}

/** Resolves display text for one vaccine in one locale. Null when the dataset has no entry — callers must not invent content (see brief: "never generated live by an LLM call"). */
export function asiOnamIcerigiGoster(asiAdi: string, dil: AsiOnamDil = VARSAYILAN_ONAM_DILI, paket: AsiOnamUlkePaketi = TURKIYE_ASI_ONAM_PAKETI): AsiOnamIcerikGosterimi | null {
  const i = paket === TURKIYE_ASI_ONAM_PAKETI ? asiOnamIcerigiBul(asiAdi) : paket.icerik.find((x) => x.ad.trim().toLocaleLowerCase('tr-TR') === asiAdi.trim().toLocaleLowerCase('tr-TR')) || null
  if (!i) return null
  return {
    ad: i.ad,
    korur: ceviriCoz(i.korur, dil),
    yanEtkiler: ceviriListesiCoz(i.yanEtkiler, dil),
    onamCumlesi: ceviriCoz(i.onamCumlesi, dil),
    kaynak: i.kaynak,
  }
}

export type AsiOnamIstegiSonucu =
  | { ok: true; asilar: string[]; icerikAnlikGoruntu: AsiOnamIcerikGosterimi[] }
  | { ok: false; hata: string }

/**
 * Validates the chosen vaccine list against the dataset and builds the FROZEN content snapshot
 * (icerik_anlik_goruntu) that gets written into the immutable record. This is the one function
 * every write path (in-clinic confirm, remote portal confirm, paper upload) calls — the snapshot
 * can never drift between flows.
 */
export function asiOnamIstegiHazirla(asilarHam: unknown, dil: AsiOnamDil = VARSAYILAN_ONAM_DILI, paket: AsiOnamUlkePaketi = TURKIYE_ASI_ONAM_PAKETI): AsiOnamIstegiSonucu {
  const asilar = (Array.isArray(asilarHam) ? asilarHam : []).map((a) => String(a || '').trim()).filter(Boolean)
  const essiz = Array.from(new Set(asilar))
  if (!essiz.length) return { ok: false, hata: 'En az bir aşı seçin.' }
  const icerikAnlikGoruntu: AsiOnamIcerikGosterimi[] = []
  for (const ad of essiz) {
    const gosterim = asiOnamIcerigiGoster(ad, dil, paket)
    if (!gosterim) return { ok: false, hata: `"${ad}" için onam içeriği bulunamadı. Lütfen listeden bir aşı seçin.` }
    icerikAnlikGoruntu.push(gosterim)
  }
  return { ok: true, asilar: essiz, icerikAnlikGoruntu }
}

export interface AsiOnamOnayEden {
  ad: string
  yakinlik: string | null
  telefon: string | null
}

/**
 * VELI-YASAL-ONAM (brans-alan-sizmasi): who must consent follows the patient's AGE, not the
 * branş — but since this whole feature is already gated to Pediatri, in practice this is almost
 * always the veli/yasal temsilci. The rare ≥18 Pediatri patient (e.g. a chronic-care transition
 * patient still followed by the same pediatrician) consents for themself.
 */
export function asiOnamOnayEdenGecerliMi(x: unknown): x is AsiOnamOnayEden {
  if (!x || typeof x !== 'object') return false
  const ad = (x as Record<string, unknown>).ad
  return typeof ad === 'string' && ad.trim().length > 0
}

export function asiOnamOzetMetni(icerikAnlikGoruntu: AsiOnamIcerikGosterimi[]): string {
  return icerikAnlikGoruntu.map((i) => i.ad).join(', ')
}
