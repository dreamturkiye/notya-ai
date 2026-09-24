/**
 * NOTYA-ARSIV-01 (Dr. Gökhan via Kaan, 2026-09-23) — an archived muayene is invisible everywhere.
 *
 * `sessions.archived_at` (migration 089) is the single archive flag. A note belongs to a muayene via
 * `notes.session_id` (NOT NULL, FK → sessions), so "archived note" = "note whose session is archived".
 * Every display / aggregation / AI-context / export read of `sessions` or `notes` goes through the two
 * helpers below; the record itself stays in the DB and reappears as soon as it is unarchived
 * (…/sessions/[sessionId]/arsivden-cikar).
 *
 * Not for: ownership checks, writes, opening one note by id (the doctor must still reach it from the
 * Arşivlenenler view — it shows an "Arşivde" banner), or the archive management routes themselves.
 * lib/doktor/arsiv.test.ts fails on any new raw read that is not allowlisted with a reason.
 *
 * notes: an aliased inner embed (`arsiv_seans`) is added next to whatever the caller selects, so an
 * existing `sessions(...)` / `sessions!inner(...)` embed and its `sessions.x` filters keep working
 * unchanged. The extra `arsiv_seans` key on each row is harmless ({ archived_at: null }).
 */
import type { SupabaseClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Istemci = SupabaseClient<any, any, any>
type Sayim = { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }

export const ARSIV_GOMME = 'arsiv_seans:sessions!inner(archived_at)'

// Rows come back as `any` (select typed as '*'): the project's client has no generated Database types,
// so call sites were already loosely typed, and a generic select-string parameter makes tsc's
// select-parser types blow the heap.

/** `sessions` read without archived muayeneler. Chain filters as usual after it. */
export function arsivsizSeanslar(sb: Istemci, secim: string, o?: Sayim) {
  return sb.from('sessions').select(secim as '*', o).is('archived_at', null)
}

/** `notes` read without notes of archived muayeneler. Chain filters as usual after it. */
export function arsivsizNotlar(sb: Istemci, secim: string, o?: Sayim) {
  return sb.from('notes').select(`${secim}, ${ARSIV_GOMME}` as '*', o).is('arsiv_seans.archived_at', null)
}

/**
 * NOTYA-ARSIV-02 (Kaan, 2026-09-23): the drugs an archived muayene's note wrote are hidden too — dosya
 * İlaçlar, Sağlığım › İlaçlarım, Ayşe's dossier / etkileşim context, reçete, exports. Most archived notes
 * are faulty notes; archive is only the safety net instead of delete.
 *
 * Read filter, never a row change: a `hasta_ilaclar` row is hidden while its `kaynak_note_id` note's
 * muayene is archived, and is back the moment it is unarchived. Rows with `kaynak_note_id` NULL (added by
 * the doctor by hand) are always visible. `kaynak_note_id` always points at the latest approved note that
 * wrote the drug (lib/doktor/receteAktarim), so a drug a live note still prescribes is never hidden.
 *
 * How: a left embed of the source note with an inner embed of its session filtered to `archived_at is
 * null` — an archived source nulls the embed; `or` keeps rows with no source or a live source (checked on
 * production PostgREST 2026-09-23, head counts too). Callers must not add their own `.or()` on this query.
 */
export const ILAC_ARSIV_GOMME = 'arsiv_kaynak:notes!kaynak_note_id(arsiv_seans:sessions!inner(archived_at))'

/** `hasta_ilaclar` read without drugs written by an archived muayene's note. Chain filters as usual after it. */
export function arsivsizIlaclar(sb: Istemci, secim: string, o?: Sayim) {
  return sb.from('hasta_ilaclar').select(`${secim}, ${ILAC_ARSIV_GOMME}` as '*', o)
    .is('arsiv_kaynak.arsiv_seans.archived_at', null)
    .or('kaynak_note_id.is.null,arsiv_kaynak.not.is.null')
}

/**
 * NOTYA-ASI-NOT-01 (Kaan + Dr. Gökhan, 2026-09-23): a vaccine a muayene's note wrote into the aşı kartı
 * (`asilar.kaynak_note_id`, lib/doktor/notAsiAktarim) is hidden with that muayene — aşı kartı, Sağlığım /
 * portal karne, Ayşe dossier, kohort / Fısıltı, hatırlatma, search, exports. Same read filter as
 * arsivsizIlaclar: rows with `kaynak_note_id` NULL (manual form, voice Ayşe, karne) are always visible.
 */
export const ASI_ARSIV_GOMME = ILAC_ARSIV_GOMME

/** `asilar` read without vaccines written by an archived muayene's note. Chain filters as usual after it. */
export function arsivsizAsilar(sb: Istemci, secim: string, o?: Sayim) {
  return sb.from('asilar').select(`${secim}, ${ASI_ARSIV_GOMME}` as '*', o)
    .is('arsiv_kaynak.arsiv_seans.archived_at', null)
    .or('kaynak_note_id.is.null,arsiv_kaynak.not.is.null')
}

/** Embedded `sessions` value (object or 1-element array) → is that muayene archived? */
export function seansArsivdeMi(seans: unknown): boolean {
  const s = (Array.isArray(seans) ? seans[0] : seans) as { archived_at?: string | null } | null | undefined
  return Boolean(s?.archived_at)
}
