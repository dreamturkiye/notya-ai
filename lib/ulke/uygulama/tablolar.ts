/**
 * NOTYA-ULKE-SABLON-01 — THE ONE DOOR to the database for a country build.
 *
 * ONE DATABASE PER COUNTRY (Kaan, 2026-10-09: "We had issues with common databases before. Keep seperation between
 * the two and any other future country versions"). A country build is pointed at its own database. That is the first
 * wall. This file is the SECOND: it was written on 2026-10-08, when every country was going to live in one database,
 * and both of its rules stay exactly as they were — so that even inside one database no row of one country could be
 * reached from another:
 *
 *   1. A country build touches COUNTRY TABLES ONLY — the list below (the country migrations, lib/db/ulke/gocler.json).
 *      It never reads or writes a table of the Turkish product (`users`, `patients`, `sessions`, `notes`, …); a
 *      country database does not even hold one.
 *   2. EVERY statement is bound to the build's own country. `ulkeTablosu` stamps the country on every row it
 *      inserts and adds `ulke = <this build's country>` to every select, update and delete — so a row of another
 *      country is not found, not changed and not removed, even when its id is valid and even when the doctor's id
 *      matches. The same value is passed to every database function (`ulkeIslevi`).
 *
 * Country code talks to the database through `ulkeTablosu` / `ulkeIslevi` and through nothing else: a test fails on
 * a `.from(` or `.rpc(` anywhere else under lib/ulke, components/ulke, countries/ or app/api/ulke
 * (lib/ulke/ulkeVeritabani.test.ts), and on a statement that reached the stand-in database without the country.
 *
 * This is IN ADDITION to patient isolation, not instead of it: every caller still scopes by the authenticated
 * doctor's id in the same statement (.cursor/skills/hasta-izolasyon/SKILL.md). The database repeats both rules in
 * its keys (the country and the doctor are part of every foreign key) and in its row-level rules.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { aktifUlke } from '../ulke'

/** Every table a country build may touch. All of them carry the column `ulke`. */
export const ULKE_TABLOLARI = [
  'ulke_hesaplari',
  'hekim_dil_tercihleri',
  'hekim_rolu',
  'hekim_calisma_duzeni',
  'ulke_hastalar',
  'hasta_ulke_bilgisi',
  'ulke_muayeneler',
  'muayene_dil_kaydi',
  'ulke_notlar',
  'not_dil_kaydi',
  'ulke_randevulari',
  'ulke_kullanim',
  // NOTYA-ULKE-PORTAL-01 — usage per account, day and task (migration 136); the patient portal (migration 137).
  'ulke_kullanim_olcumu',
  'ulke_portal_erisimleri',
  'ulke_portal_oturumlari',
  'ulke_hasta_ozetleri',
  'ulke_portal_kayitlari',
  'ulke_randevu_istekleri',
  // NOTYA-ULKE-INTAKE-01 — the intake form a patient fills in before a visit (migration 138).
  'ulke_hasta_formlari',
  // NOTYA-ULKE-ARACLAR-01 — migration 139. Server only.
  'ulke_arac_kayitlari',
  // NOTYA-ULKE-ASISTAN-01 — the assistant's conversations and their messages (migration 143). Server only.
  'ulke_asistan_konusmalari',
  'ulke_asistan_mesajlari',
] as const
export type UlkeTablosu = (typeof ULKE_TABLOLARI)[number]

/**
 * Country tables NO BROWSER SESSION may read, not even its own rows: row-level security is on with no rule at all.
 * Only the server's routes reach them. (Every other country table lets a signed-in account read its own rows of its
 * own country, as a second line behind the server.)
 */
export const YALNIZ_SUNUCU_TABLOLARI: readonly UlkeTablosu[] = ['ulke_kullanim', 'ulke_kullanim_olcumu', 'ulke_portal_erisimleri', 'ulke_portal_oturumlari', 'ulke_hasta_ozetleri', 'ulke_portal_kayitlari', 'ulke_randevu_istekleri', 'ulke_hasta_formlari', 'ulke_arac_kayitlari', 'ulke_asistan_konusmalari', 'ulke_asistan_mesajlari']

/** Database functions a country build may call. Each takes the country as `p_ulke`. */
export const ULKE_ISLEVLERI = [
  'ulke_not_onayla', 'davet_kodu_kullan', 'davet_kodu_iade',
  // NOTYA-ULKE-PORTAL-01 (migrations 136, 137)
  'ulke_kullanim_ekle', 'ulke_portal_erisim_ver', 'ulke_portal_erisim_iptal', 'ulke_portal_deneme_al', 'ulke_portal_deneme_sonucu', 'ulke_ozet_paylas', 'ulke_randevu_istegi_kabul',
  // NOTYA-ULKE-INTAKE-01 (migration 138)
  'ulke_hasta_formu_iste',
] as const
export type UlkeIslevi = (typeof ULKE_ISLEVLERI)[number]

/** The column every country table carries, and the argument every country function takes. */
export const ULKE_KOLONU = 'ulke'
export const ULKE_ARGUMANI = 'p_ulke'

type Satir = Record<string, unknown>

/** A row as it is written: whatever the caller passed, with THIS build's country — the caller cannot name another. */
const damgala = (satir: Satir, ulke: string): Satir => ({ ...satir, [ULKE_KOLONU]: ulke })
/** Values of an update: the country of a row is never rewritten. */
const damgasiz = (degerler: Satir): Satir => {
  const { [ULKE_KOLONU]: _atilan, ...kalan } = degerler
  return kalan
}

/**
 * One country table, bound to this build's country. Use exactly like `supabase.from(ad)`; the country filter is
 * already on the statement when the caller adds its own (`.eq('doctor_id', …)`, `.eq('id', …)`).
 */
export function ulkeTablosu(supabase: SupabaseClient, ad: UlkeTablosu) {
  if (!(ULKE_TABLOLARI as readonly string[]).includes(ad)) throw new Error(`[ulke/tablolar] "${ad}" is not a country table`)
  const ulke = aktifUlke()
  return {
    // The column list is typed as '*' only so that the rows stay untyped, as with a literal list on an untyped client.
    select: (kolonlar: string) => supabase.from(ad).select(kolonlar as '*').eq(ULKE_KOLONU, ulke),
    insert: (satir: Satir) => supabase.from(ad).insert(damgala(satir, ulke)),
    upsert: (satir: Satir, secenek: { onConflict: string }) => supabase.from(ad).upsert(damgala(satir, ulke), secenek),
    update: (degerler: Satir) => supabase.from(ad).update(damgasiz(degerler)).eq(ULKE_KOLONU, ulke),
    delete: () => supabase.from(ad).delete().eq(ULKE_KOLONU, ulke),
  }
}

/** One country function, called for this build's country: `p_ulke` is set here and cannot be passed in. */
export function ulkeIslevi(supabase: SupabaseClient, ad: UlkeIslevi, argumanlar: Satir) {
  if (!(ULKE_ISLEVLERI as readonly string[]).includes(ad)) throw new Error(`[ulke/tablolar] "${ad}" is not a country function`)
  return supabase.rpc(ad, { ...argumanlar, [ULKE_ARGUMANI]: aktifUlke() })
}

// ───────────────────────── storage: recordings are kept apart per country ─────────────────────────

/**
 * The folder of this build's country and of one account inside the recordings bucket: `<country>/<account id>`.
 * Client-safe: the visit screen builds the upload path with it, and the server checks the same two folders as text
 * before it touches storage. The bucket's upload rule (migration 132) checks them a third time, against the
 * country stamped on the session.
 */
export function sesKlasoru(hesapId: string): string {
  return `${aktifUlke()}/${hesapId}`
}

/** `<this country>/<account id>/<file name>` and nothing else: no folders below, no dots that climb. */
export function sesYoluGecerli(doktorId: string, yol: unknown): yol is string {
  const onEk = `${sesKlasoru(doktorId)}/`
  if (typeof yol !== 'string' || !yol.startsWith(onEk)) return false
  return /^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/.test(yol.slice(onEk.length)) && !yol.includes('..')
}
