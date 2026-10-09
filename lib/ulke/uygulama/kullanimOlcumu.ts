/**
 * NOTYA-ULKE-PORTAL-01 — USAGE of a country build, as counts: what docs/COUNTRY-PACK-CHECKLIST.md L1 calls cost per
 * visit. NO AMOUNT OF MONEY is stored or computed anywhere.
 *
 * One row per ACCOUNT, per DAY (the account's own calendar day, in its time zone) and per TASK, in the country table
 * `ulke_kullanim_olcumu` (migration 136): how many times the task ran and, where the provider reports them, seconds
 * of audio or tokens in and out. Written through one database function that ADDS, so two visits ending at the same
 * moment cannot lose a count.
 *
 * WHAT IS NEVER HERE: a patient, a visit id, a word of a transcript, a note or a summary.
 *
 * NEVER IN THE WAY. Measuring is not part of the visit: whatever fails here is swallowed, and the visit, the note or
 * the summary goes on. Scoped to the authenticated account's own id; nothing here takes an id from a request.
 *
 * A country database has no table of the shared model gateway's own usage log, so the gateway's row for a country
 * build's call is not written anywhere; this is the country's own record.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { ulkeGunu } from './gun'
import { hesapSaatDilimi } from './saatDilimi'
import { ulkeIslevi } from './tablolar'

/**
 * The tasks that are measured. Speech: the first pass of a recording, and the second pass where one ran. The model:
 * a visit note, a rewrite of a note in another language, a summary for the patient.
 * NOTYA-ULKE-ASISTAN-01 — the assistant: an answer (tokens), a spoken question transcribed (seconds of audio), an
 * answer read aloud (how many).
 */
export const KULLANIM_GOREVLERI = ['konusma-ilk', 'konusma-ikinci', 'not', 'yeniden-yazim', 'hasta-ozeti', 'asistan', 'asistan-konusma', 'asistan-ses'] as const
export type KullanimGorevi = (typeof KULLANIM_GOREVLERI)[number]

export type KullanimOlcusu = {
  /** How many times the task ran. Default 1. */
  adet?: number
  /** Seconds of audio, where the speech provider said. */
  saniye?: number | null
  /** Tokens, where the model provider said. */
  girisToken?: number | null
  cikisToken?: number | null
}

const sayi = (x: unknown): number => (typeof x === 'number' && Number.isFinite(x) && x > 0 ? x : 0)

/** Tokens of a model answer as the gateway returns it (`usage.input_tokens`, `usage.output_tokens`). Pure. */
export function yanitTokenlari(yanit: unknown): { girisToken: number; cikisToken: number } {
  const u = (yanit as { usage?: Record<string, unknown> | null } | null)?.usage ?? {}
  return { girisToken: Math.round(sayi(u.input_tokens)), cikisToken: Math.round(sayi(u.output_tokens)) }
}

export async function kullanimEkle(supabase: SupabaseClient, doktorId: string, gorev: KullanimGorevi, o: KullanimOlcusu = {}): Promise<void> {
  try {
    if (!(KULLANIM_GOREVLERI as readonly string[]).includes(gorev)) return
    const gun = ulkeGunu(new Date(), await hesapSaatDilimi(supabase, doktorId))
    const { error } = await ulkeIslevi(supabase, 'ulke_kullanim_ekle', {
      p_doctor_id: doktorId,
      p_gun: gun,
      p_gorev: gorev,
      p_adet: Math.max(1, Math.round(sayi(o.adet ?? 1))),
      p_saniye: Math.round(sayi(o.saniye) * 10) / 10,
      p_giris_token: Math.round(sayi(o.girisToken)),
      p_cikis_token: Math.round(sayi(o.cikisToken)),
    })
    // The task is named; nothing about the account or the visit is.
    if (error) console.warn(`[ulke/kullanim] not recorded: ${gorev}`)
  } catch {
    /* measuring never stops a visit */
  }
}
