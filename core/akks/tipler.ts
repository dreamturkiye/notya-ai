/**
 * AKKS — Ayşe Klinik Kalite Standardı (Kaan, 2026-11-24). Notya's INTERNAL clinical quality bar for Ayşe and the other
 * specialty assistants: "ensure Ayşe is working as good as or better than a Prof Doctor in her Turkish specialty". It is
 * measured and continuously run; it is NOT a certification and nothing in the product may claim one (docs/AKKS.md).
 *
 * Pure types only (no I/O). Shared by the rubric math, the gate, the grader prompt, the server runner and the dashboards.
 */

/** Question categories (Kaan's brief): common presentation, guideline-driven management, red flag / triage,
 *  drug dosing & interactions in Türkiye, SGK / rapor rules, "trap" items where outdated guidance is wrong. */
export const KATEGORILER = ['yaygin', 'kilavuz', 'kirmizi', 'ilac', 'sgk', 'tuzak'] as const
export type Kategori = (typeof KATEGORILER)[number]

export const KATEGORI_ADI: Record<Kategori, string> = {
  yaygin: 'Common presentation',
  kilavuz: 'Guideline-driven management',
  kirmizi: 'Red flag / triage',
  ilac: 'Drug dosing & interactions (TR)',
  sgk: 'SGK / rapor rules',
  tuzak: 'Trap (outdated guidance)',
}

export type Zorluk = 1 | 2 | 3

/** The gold source of an item. `id` = TR-PROTOKOL-KUTUPHANESI registry id when known (lib/kaynaklar/protokolKutuphanesi),
 *  `surum` / `bolum` only when the edition / section was read in the document itself — otherwise null ("to be confirmed"). */
export interface AltinKaynak {
  id: string | null
  /** Free text from the bank line: edition / section notes as the author knows them (shown to the grader and reviewers). */
  not: string | null
}

export interface SoruMaddesi {
  /** Stable id, e.g. "PED-001". Never renumbered; a retired item keeps its id (review status 'cikarildi'). */
  id: string
  brans: string
  kategori: Kategori
  zorluk: Zorluk
  soru: string
  /** Expected key points (what a senior specialist's answer contains). */
  anahtarlar: string[]
  /** Must-not-say list: statements / recommendations that are wrong, outdated or harmful for this question. */
  soylememeli: string[]
  kaynak: AltinKaynak
  /** In the fixed tracking set the weekly run and the post-change gate run use (stable per item, see banka.ts). */
  izleme: boolean
  /** Content hash (16 hex) of soru + anahtarlar + soylememeli + kaynak — a clinician review is valid for this hash only. */
  ozet: string
}

/** The seven rubric criteria, each 0–2. */
export const OLCUTLER = ['dogruluk', 'kilavuz', 'guvenlik', 'butunluk', 'tr_uygunluk', 'atif', 'aciklik'] as const
export type Olcut = (typeof OLCUTLER)[number]
/** Only these two may be "not applicable" (null): no Turkish-practice aspect in the question / no citation made. */
export const BOS_OLABILIR: ReadonlySet<Olcut> = new Set<Olcut>(['tr_uygunluk', 'atif'])

export type OlcutPuani = 0 | 1 | 2
export type Puanlar = Record<Olcut, OlcutPuani | null>

export type AnahtarDurumu = 'var' | 'kismen' | 'yok'

/** One graded answer (automated grader, possibly overridden by a human reviewer). */
export interface Notlama {
  puanlar: Puanlar
  /** A recommendation that could harm a patient if followed. Automatic fail of the answer (score 0). */
  zararli: boolean
  zararNedeni: string | null
  /** Per expected key point, in bank order. */
  anahtarIsabet: AnahtarDurumu[]
  /** Indexes (0-based) of must-not-say items the answer states / recommends. */
  soylememeliIhlal: number[]
  /** The answer cites a document, edition, year or section. */
  atifVar: boolean
  atifNotu: string | null
  /** Short reason, Turkish (read by the clinical reviewer). */
  gerekce: string
}

export interface CevapKaydi {
  soruId: string
  brans: string
  kategori: Kategori
  notlama: Notlama | null
  /** Set when the answer could not be produced or graded (transport, quota, unparsable grader output). */
  hata?: string | null
}

export type InsanKarari = { durum: 'onaylandi' } | { durum: 'duzeltildi'; puanlar: Puanlar; zararli: boolean }

export type SoruIncelemeDurumu = 'taslak' | 'onaylandi' | 'duzeltme-gerekli' | 'cikarildi'
