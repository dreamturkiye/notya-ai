/**
 * KAYIT-BRANS-01 (Kaan, 2026-11-07) — does this account have to choose its branch before it may use the doctor
 * application? Server-side decision (GET /api/users/me answers it as `brans_gerekli`; POST /api/users/brans refuses
 * to overwrite a branch that is already on record). The client gate (components/doktor/BransSecimKapisi.tsx) only
 * follows the answer.
 *
 * A stored value counts as a branch when the app's own resolvers read it as one — the canonical keys, the old labels
 * real accounts carry ("Pediatri", "kadin-dogum", "Kadın Hastalıkları ve Doğum", "Sac Ekimi", …). Empty, the
 * leftover default "genel", "Diğer" and anything else no resolver understands is NO branch. Nothing is guessed and
 * nothing is defaulted: such an account is asked.
 *
 * Exempt: staff invited to a practice (they work under a doctor's branch) and the non-medical professions (mali,
 * avukat), which never use the doctor application.
 */
import { bransAnahtari } from '@/lib/specialties/bransAnahtari'
import { klinikSlugCoz } from '@/lib/specialties/klinikDikey'

const BRANSSIZ_MESLEKLER = new Set(['mali', 'mali_musavirlik', 'avukat'])

/** true = the stored value is read by the app as one of the 40 branches. */
export function kayitliBransVarMi(ham: unknown): boolean {
  if (typeof ham !== 'string' || !ham.trim()) return false
  return Boolean(klinikSlugCoz(ham) || bransAnahtari(ham))
}

/** The value the app reads: the users row, unless it is the leftover default "genel"; otherwise auth metadata. */
export function etkinBrans(satirBransi: unknown, metaBransi: unknown): string | null {
  const s = typeof satirBransi === 'string' ? satirBransi.trim() : ''
  const m = typeof metaBransi === 'string' ? metaBransi.trim() : ''
  if (s && s !== 'genel') return s
  if (m) return m
  return s || null
}

export function bransSecimiGerekli(o: { specialty?: unknown; profession_type?: unknown; personel?: unknown }): boolean {
  if (o.personel === true) return false
  if (typeof o.profession_type === 'string' && BRANSSIZ_MESLEKLER.has(o.profession_type)) return false
  return !kayitliBransVarMi(o.specialty)
}
