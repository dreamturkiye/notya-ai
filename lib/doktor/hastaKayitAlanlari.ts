/**
 * NOTYA-EYLEM — the one place that knows how alerji / kronik hastalık live on a patient record.
 *
 * There is no `alerjiler` table: both fields are keys inside the encrypted JSON blob in
 * `patients.notes_encrypted` (`alerjiler` = free text, `kronikHastaliklar` = array of strings —
 * see app/api/doktor/hastalar/route.ts and lib/intake/hastaKaydinaAktar.ts, which both already
 * assume exactly those two shapes). Before this module every caller re-derived that by hand; the
 * action layer must not become a third private copy, so the read-merge-write lives here and the
 * eylem actions call it.
 *
 * Note on scope: `intakeYanitlariniHastayaAktar` keeps its own IO because it is a different
 * operation (fill-only backfill at form time, never overwrites a filled field). What is shared is
 * the field semantics below — the part that would actually drift.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { encrypt, decrypt } from '@/lib/security/encryption'

export interface HastaNotAlanlari {
  alerjiler?: string
  kronikHastaliklar?: string[]
  [k: string]: unknown
}

export function notAlanlariCoz(notesEncrypted: string | null | undefined): HastaNotAlanlari {
  if (!notesEncrypted) return {}
  try {
    const ham = decrypt(notesEncrypted)
    const o = JSON.parse(ham || '{}')
    return o && typeof o === 'object' && !Array.isArray(o) ? (o as HastaNotAlanlari) : {}
  } catch {
    return {}
  }
}

/** `kronikHastaliklar` is written as an array but older rows hold a comma string — read both. */
export function kronikListe(n: HastaNotAlanlari): string[] {
  const v = n.kronikHastaliklar
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean)
  return String(v ?? '')
    .split(/[,;\n]+/)
    .map((x) => x.trim())
    .filter(Boolean)
}

/** `alerjiler` is one free-text line ("Penisilin, fıstık"). Entries are compared case-insensitively. */
export function alerjiListe(n: HastaNotAlanlari): string[] {
  return String(n.alerjiler ?? '')
    .split(/[,;\n]+/)
    .map((x) => x.trim())
    .filter((x) => x && !/^bilinen alerjisi yok$/i.test(x))
}

const ayni = (a: string, b: string) => a.localeCompare(b, 'tr', { sensitivity: 'base' }) === 0

export function alerjiVarMi(n: HastaNotAlanlari, alerji: string): boolean {
  return alerjiListe(n).some((x) => ayni(x, alerji.trim()))
}

export function kronikVarMi(n: HastaNotAlanlari, tani: string): boolean {
  return kronikListe(n).some((x) => ayni(x, tani.trim()))
}

export function alerjiEklenmis(n: HastaNotAlanlari, alerji: string): HastaNotAlanlari {
  const liste = alerjiListe(n)
  const yeni = alerji.trim()
  if (!yeni || liste.some((x) => ayni(x, yeni))) return n
  return { ...n, alerjiler: [...liste, yeni].join(', ') }
}

export function alerjiCikarilmis(n: HastaNotAlanlari, alerji: string): HastaNotAlanlari {
  const kalan = alerjiListe(n).filter((x) => !ayni(x, alerji.trim()))
  // An emptied list is written as the explicit "none known" line, not as blank: a doctor reading
  // the file must be able to tell "asked, none" from "never asked".
  return { ...n, alerjiler: kalan.length ? kalan.join(', ') : 'Bilinen alerjisi yok' }
}

export function kronikEklenmis(n: HastaNotAlanlari, tani: string): HastaNotAlanlari {
  const liste = kronikListe(n)
  const yeni = tani.trim()
  if (!yeni || liste.some((x) => ayni(x, yeni))) return n
  return { ...n, kronikHastaliklar: [...liste, yeni] }
}

/**
 * Read → merge → write, scoped by doctor. Returns the before/after blob for the audit row, or null
 * when the patient is not this doctor's (HASTA-IZOLASYON-01: the caller has already checked, this
 * is defence in depth — the update itself also carries `.eq('doctor_id', …)`).
 */
export async function hastaNotAlanlariGuncelle(
  sb: SupabaseClient,
  doktorId: string,
  patientId: string,
  degistir: (n: HastaNotAlanlari) => HastaNotAlanlari
): Promise<{ once: HastaNotAlanlari; sonra: HastaNotAlanlari } | null> {
  const { data } = await sb
    .from('patients')
    .select('id, notes_encrypted')
    .eq('id', patientId)
    .eq('doctor_id', doktorId)
    .maybeSingle()
  if (!data) return null
  const once = notAlanlariCoz(data.notes_encrypted as string | null)
  const sonra = degistir(once)
  const { error } = await sb
    .from('patients')
    .update({ notes_encrypted: encrypt(JSON.stringify(sonra)), updated_at: new Date().toISOString() })
    .eq('id', patientId)
    .eq('doctor_id', doktorId)
  if (error) { console.error('[hastaKayitAlanlari]', error.message); throw new Error('Hasta kaydı güncellenemedi.') }
  return { once, sonra }
}
