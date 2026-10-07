/**
 * NOTYA-INTAKE-DENETIM (2026-10-07) — one answer to "which branch section does this intake form get?".
 *
 * hasta_intake_formlari.brans holds a doctor SpecialtyKey (BRANS_SORULARI), a Klinik slug (KLINIK_SORULARI) or
 * 'genel'. Klinik practices used to be stored as 'genel' and got no branch questions at all; they now keep their own
 * slug. 'genel' gets the reason-for-visit question only, so every form asks it. Pure, client-safe.
 */
import type { IntakeBolum } from './coreAlanlar'
import { BASVURU_NEDENI, BRANS_ETIKETLERI, BRANS_SORULARI } from './bransSorulari'
import { KLINIK_SORULARI } from './klinikSorulari'
import { bransAnahtari } from '@/lib/specialties/bransAnahtari'
import { KLINIK_ETIKET, KLINIK_YENI_SLUGS, klinikSlugCoz, type KlinikYeniSlug } from '@/lib/specialties/klinikDikey'

export const GENEL_BOLUM: IntakeBolum = { baslik: 'Başvurunuz', alanlar: [BASVURU_NEDENI] }

const sahip = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k)

function klinikMi(k: string): k is KlinikYeniSlug {
  return (KLINIK_YENI_SLUGS as readonly string[]).includes(k)
}

/** Every form key a doctor can pick, doctor branches first, then Klinik branches. */
export function intakeFormBranslari(): { anahtar: string; etiket: string; klinik: boolean }[] {
  return [
    ...Object.entries(BRANS_ETIKETLERI).map(([anahtar, etiket]) => ({ anahtar, etiket, klinik: false })),
    ...KLINIK_YENI_SLUGS.map((anahtar) => ({ anahtar, etiket: KLINIK_ETIKET[anahtar], klinik: true })),
  ]
}

/** A stored or requested form key → itself when it has a section, else 'genel'. */
export function intakeFormAnahtari(brans: string | null | undefined): string {
  const k = String(brans || '').trim()
  return sahip(BRANS_SORULARI, k) || klinikMi(k) ? k : 'genel'
}

/** The practice's users.specialty → the default form key (doctor branch, Klinik slug, or 'genel'). */
export function intakeFormBransi(hamSpecialty: string | null | undefined): string {
  const klinik = klinikSlugCoz(hamSpecialty)
  if (klinik) return klinik
  const k = bransAnahtari(hamSpecialty)
  return k && sahip(BRANS_ETIKETLERI, k) ? k : 'genel'
}

export function intakeBransBolumu(brans: string | null | undefined): IntakeBolum {
  const k = String(brans || '')
  if (sahip(BRANS_SORULARI, k)) return BRANS_SORULARI[k as keyof typeof BRANS_SORULARI]
  if (klinikMi(k)) return KLINIK_SORULARI[k]
  return GENEL_BOLUM
}

export function intakeBransEtiketi(brans: string | null | undefined): string | null {
  const k = String(brans || '')
  if (sahip(BRANS_ETIKETLERI, k)) return BRANS_ETIKETLERI[k as keyof typeof BRANS_ETIKETLERI]
  if (klinikMi(k)) return KLINIK_ETIKET[k]
  return null
}
