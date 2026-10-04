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
import { bugunTz, saatDilimiSec } from '@/lib/randevu/tarihCozumle'

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
  /**
   * NOTYA-AYSE-GERI-03 — resolved by the SERVER (`hazirla`), never by the model and never by the card: left out
   * of the tool schema, ignored in model input and in the doctor's edits. A row id belongs here.
   */
  sunucu?: boolean
  /** Not rendered on the card and not read back by voice (a row id, or a hint only the resolver uses). */
  gizli?: boolean
}

/**
 * NOTYA-AYSE-GERI-03 — outcome of an action's server-side preparation. `soru`: no card can be prepared yet; Ayşe
 * asks this one question instead ("Hangisi Hocam: 1. …, 2. …?"). Never a write.
 */
export type HazirlikSonucu = { veri: Record<string, unknown> } | { soru: string }

/** The fields a doctor sees (card, voice read-back) and the required ones among them. */
export function kartAlanlari(e: { alanlar: readonly AlanTanimi[]; zorunlu: readonly string[] }): { alanlar: AlanTanimi[]; zorunlu: string[] } {
  const alanlar = e.alanlar.filter((a) => !a.gizli)
  const gorunur = new Set(alanlar.map((a) => a.anahtar))
  return { alanlar, zorunlu: e.zorunlu.filter((k) => gorunur.has(k)) }
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
  /**
   * Today in the DOCTOR's timezone, yyyy-mm-dd (NOTYA-AYSE-GERI-04). Actions must not read the host clock directly.
   * Was `bugunTRT` — a doctor west of Turkey got tomorrow's date in the evening.
   */
  bugun: string
  /** The doctor's IANA timezone: the clock every day and time on a card is read in. */
  saatDilimi: string
  /** The instant "now" for actions that compare against one (upcoming appointments). Default: the host clock. */
  simdi?: Date
}

/**
 * NOTYA-AYSE-GERI-04 — the clock of an action context. `saatDilimi` comes from the client (request body, then the
 * notya_tz cookie); an unknown or missing value falls back to Europe/Istanbul, which is what every caller did
 * before, so a doctor in Turkey sees no change.
 */
export function eylemZamani(saatDilimi?: string | null, simdi: Date = new Date()): { bugun: string; saatDilimi: string; simdi: Date } {
  const dilim = saatDilimiSec(saatDilimi)
  return { bugun: bugunTz(dilim, simdi), saatDilimi: dilim, simdi }
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
  /** Spoken after a voice "Evet" commits the card; default "Kaydedildi Hocam — <etiket>." */
  basariSozu?: string
  /**
   * NOTYA-AYSE-GERI-03 — runs when the card is prepared, after the model's values were normalised: fills the
   * `sunucu` fields from this doctor's own rows (which appointment is meant) or answers with one question when it
   * cannot. Every read inside is scoped by ctx.doktorId AND ctx.hasta.id. Never a write.
   */
  hazirla?: (ctx: EylemBaglami, veri: V) => Promise<HazirlikSonucu>
  /**
   * NOTYA-RANDEVU-V2: offered only when the doctor has this feature ON (AracSuzgeci), and ordered after every
   * other tool so it can never push an existing one out of the prompt cap.
   */
  ozellik?: 'randevu_v2'
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

/**
 * Turkey is UTC+3 all year. Kept for callers that have no doctor timezone at hand (tests, the calendar page's own
 * TRT view); the action layer itself dates everything with `eylemZamani` in the doctor's timezone.
 */
export function bugunTRT(simdi: Date = new Date()): string {
  return new Date(simdi.getTime() + 3 * 3600e3).toISOString().slice(0, 10)
}

/** Calendar day in TRT, `offsetGun` days from today (1 = tomorrow). */
export function gunKaydirTRT(offsetGun: number, simdi: Date = new Date()): string {
  const [y, m, d] = bugunTRT(simdi).split('-').map(Number)
  return new Date(Date.UTC(y, (m || 1) - 1, (d || 1) + offsetGun)).toISOString().slice(0, 10)
}

export function yasAyHesapla(dogumTarihi: string | null, bugun: string): number | null {
  if (!dogumTarihi) return null
  const d = new Date(`${dogumTarihi}T00:00:00Z`)
  const b = new Date(`${bugun}T00:00:00Z`)
  if (Number.isNaN(d.getTime()) || Number.isNaN(b.getTime())) return null
  const ay = (b.getUTCFullYear() - d.getUTCFullYear()) * 12 + (b.getUTCMonth() - d.getUTCMonth())
  return Math.max(0, b.getUTCDate() < d.getUTCDate() ? ay - 1 : ay)
}
