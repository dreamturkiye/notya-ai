/**
 * NOTYA-EYLEM — the action layer's vocabulary. Core, never specialty-specific.
 *
 * Locked relationship model (docs/AYSE-EYLEM-MIMARISI.md §1): **Ayşe PREPARES, the hekim COMMITS.**
 * Nothing here ever writes on the model's say-so. A tool call only produces an `eylem_onerileri`
 * row (a taslak); the doctor's tap on the confirm card is what runs `calistir`. Same rule as
 * Cihaz Köprüsü: confirm card ALWAYS, never silent. Audit reads hazırlayan = Ayşe, onaylayan = hekim.
 *
 * One source of truth per action: `alanlar` (field metadata) drives THREE things at once —
 *   1. the zod-shaped `sema` used for server-side re-validation on commit (core/eylemler/sema.ts)
 *   2. the Anthropic tool `input_schema` offered to the model (core/eylemler/araclar.ts)
 *   3. the Turkish labels the confirm card renders (components/core/EylemKarti.tsx)
 * Adding a field in one place and forgetting the other two is therefore impossible by construction.
 * The architecture note asks for `sema (zod)` on the definition; it is a derived getter rather than
 * a hand-written second copy, which is the same contract with one less thing to drift.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'
import type { ZodType } from './z'

/** Risk tier. T3 (reçete, not onayı, silme, dışarı çıkan her şey) is NOT a value: it never enters the registry. */
export type Kademe = 'T1' | 'T2'

/**
 * Per-field provenance. `tahmin` is never stored AS A VALUE — the field is left empty and listed in
 * `eksik_alanlar` for the doctor to fill. That is the structural fix for the "tahminen Eylül 2026"
 * class of error: a guess cannot become a clinical record by being tapped past.
 *
 * `belirsiz` = model filled a value but forgot alan_kaynaklari. Value is KEPT (emptying the card
 * looked like Ayşe did nothing) and flagged "kaynak belirtilmedi — kontrol edin" on the card.
 */
export type AlanKaynagi = 'doktor_soyledi' | 'dosyadan' | 'tahmin' | 'belirsiz'

/** Which chat surface produced the proposal. */
export type Yuzey = 'danis' | 'sohbet' | 'ses' | 'not'

export type OneriDurumu = 'taslak' | 'onaylandi' | 'vazgecildi' | 'suresi_doldu'

export type AlanTipi = 'metin' | 'uzunMetin' | 'sayi' | 'tarih' | 'secim' | 'mantik'

export interface AlanSecenegi {
  deger: string
  /** Turkish label shown on the card. */
  etiket: string
}

export interface AlanTanimi {
  anahtar: string
  /** Turkish label — card, and nothing else. */
  etiket: string
  tip: AlanTipi
  /** Written for the LLM: what belongs in this field. English is fine here, it is not shown to a doctor. */
  aciklama?: string
  zorunlu?: boolean
  secenekler?: readonly AlanSecenegi[]
  enAz?: number
  enCok?: number
  /** e.g. 'cm', 'kg' — rendered next to the input. */
  birim?: string
}

/** Identity resolved SERVER-SIDE. A hasta id from model output never reaches this object. */
export interface HastaOzeti {
  id: string
  ad: string
  /** ISO yyyy-mm-dd, or null when the file has no DOB. */
  dogumTarihi: string | null
  yasAy: number | null
  cinsiyet: string | null
}

export interface EylemBaglami {
  /** Service-role client (no-store). Every query inside an action must stay scoped by doktorId. */
  supabase: SupabaseClient
  doktorId: string
  hasta: HastaOzeti
  /** The doctor's branch — gating is decided before this point; actions do not re-check it. */
  brans: SpecialtyKey | null
  /** The öneri row being committed, for audit linkage. */
  oneriId: string
  /** Today in Turkish time, yyyy-mm-dd. Actions must not read the host clock directly. */
  bugunTRT: string
}

/** What `calistir` reports back so `eylem_kayitlari` can describe (and `geriAl` can reverse) the write. */
export interface EylemSonucu {
  hedefTablo: string
  hedefId: string
  /** Row state before the write — null for a pure insert (T1 additive). */
  once?: Record<string, unknown> | null
  sonra: Record<string, unknown>
  /** Turkish deep-link label + href shown after commit ("… · Aşılar sekmesinde gör"). */
  ilgiliSekme?: { etiket: string; yol: string }
}

export interface EylemKaydiOzeti {
  hedefTablo: string
  hedefId: string
  once: Record<string, unknown> | null
  sonra: Record<string, unknown> | null
}

export interface EylemTanimi<V = Record<string, unknown>> {
  /** Stable key — also the Anthropic tool name. snake_case, Turkish. */
  anahtar: string
  /** Turkish card title. */
  etiket: string
  /** Description handed to the model as the tool description. */
  aciklama: string
  alanlar: readonly AlanTanimi[]
  /** Field keys that must carry a real value before the card can be saved. */
  zorunlu: readonly string[]
  kademe: Kademe
  /** 'hepsi' = base action, identical for every branş. A list = specialty-gated, explicitly. */
  branslar: readonly SpecialtyKey[] | 'hepsi'
  /**
   * Optional extra gate. Used for fields that are branch-scoped rather than branch-owned — baş
   * çevresi asks the existing scope engine (lib/specialties/kapsam.ts) instead of keeping a second
   * list of "which branches measure head circumference" that could drift from it.
   */
  hastaKosulu?: (hasta: HastaOzeti, brans: SpecialtyKey | null) => boolean
  /** The record also becomes visible in Sağlığım — the card says so before the tap. */
  portalaYansir?: boolean
  /** Derived from `alanlar`; re-validated server-side on every commit. */
  readonly sema: ZodType<V>
  /** THE write. Must call the same shared function the UI form calls — never a second write path. */
  calistir: (ctx: EylemBaglami, veri: V) => Promise<EylemSonucu>
  /** Soft revert for T1 within 24h. Absent = not undoable. */
  geriAl?: (ctx: EylemBaglami, kayit: EylemKaydiOzeti) => Promise<void>
  /** Turkish message when an equivalent record already exists, else null. */
  mukerrerKontrol?: (ctx: EylemBaglami, veri: V) => Promise<string | null>
  /** Turkish message when the data is not plausible (date before birth, future date…), else null. */
  makullukKontrol?: (ctx: EylemBaglami, veri: V) => string | null
  /**
   * NOTYA-EYLEM-21 — structured safety warnings printed ON the card, above the fields, before the
   * tap. Deterministic and re-run at commit: a `ciddi` one does not block the hekim (he is the
   * authority) but requires an explicit second tap, which is recorded. Drug actions only, today.
   */
  uyariKontrol?: (ctx: EylemBaglami, veri: V) => Promise<import('./ilacUyari').IlacUyarisi[]>
}

/** A field as it arrives from the model, with where it came from. */
export interface AlanKaynakKaydi {
  kaynak: AlanKaynagi
  /** For `dosyadan`: which document/note and the quoted line. Rendered as "Kaynak: …". */
  belgeId?: string | null
  notId?: string | null
  alinti?: string | null
}

export interface EylemOnerisi {
  id: string
  doctor_id: string
  hasta_id: string
  eylem_anahtar: string
  veri: Record<string, unknown>
  alan_kaynaklari: Record<string, AlanKaynakKaydi>
  eksik_alanlar: string[]
  kademe: Kademe
  durum: OneriDurumu
  grup_id: string | null
  yuzey: Yuzey
  /** Free-text warnings (mükerrer / makullük) — one line each on the card. */
  uyarilar: string[]
  /** NOTYA-EYLEM-21 — structured, severity-carrying warnings (ilaç güvenliği). Migration 086. */
  uyari_detay: import('./ilacUyari').IlacUyarisi[]
  created_at: string
  karar_at: string | null
}

/** Turkey is UTC+3 all year. Everything dated in this layer uses this, never the host clock. */
export function bugunTRT(simdi: Date = new Date()): string {
  return new Date(simdi.getTime() + 3 * 3600e3).toISOString().slice(0, 10)
}

export function yasAyHesapla(dogumTarihi: string | null, bugun: string): number | null {
  if (!dogumTarihi) return null
  const d = new Date(`${dogumTarihi}T00:00:00Z`)
  const b = new Date(`${bugun}T00:00:00Z`)
  if (Number.isNaN(d.getTime()) || Number.isNaN(b.getTime())) return null
  const ay = (b.getUTCFullYear() - d.getUTCFullYear()) * 12 + (b.getUTCMonth() - d.getUTCMonth())
  return Math.max(0, b.getUTCDate() < d.getUTCDate() ? ay - 1 : ay)
}
