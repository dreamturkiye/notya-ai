/**
 * AU-RIZA-01 (2026-11-03, Australia; AU-law driven) - whose consent the recording box asks for.
 *
 * Before a visit is recorded the practitioner ticks a box confirming consent to the recording AND to the AI drafting
 * of the note (Ahpra, "Meeting your professional obligations when using AI in healthcare": informed consent before a
 * consultation is recorded). For a patient under 18 the box names the parent or guardian - the same age rule as
 * the Turkish app's veliDiliMi / veliOnamGerekliMi (whole years < 18 on the day). A pack without a guardian sentence
 * shows its one sentence for everyone, as before.
 *
 * The answer is stored with the visit (muayene_dil_kaydi.riza_at + riza_surumu): the version stamp carries
 * VELI_EKI when the guardian sentence was the one shown, so an audit can tell which wording was confirmed.
 * Pure: the screen and the server compute it from the same birth date; the server's value is the one stored.
 */
import { tamYas } from '@/lib/ulke/araclar/hastaKapisi'

export const VELI_RIZA_YASI = 18
export const VELI_EKI = '+guardian'

/** true = the patient is under 18 on `gun` (YYYY-MM-DD). An unknown or malformed birth date = false (adult wording). */
export function rizaVeliMi(dogumTarihi: string | null | undefined, gun: string = new Date().toISOString().slice(0, 10)): boolean {
  const yas = tamYas(dogumTarihi, gun)
  return yas !== null && yas < VELI_RIZA_YASI
}

/** The version stamp stored with the visit: the pack's `surum`, plus VELI_EKI when the guardian sentence was shown. */
export function rizaSurumuYaz(surum: string, veli: boolean): string {
  return veli ? `${surum}${VELI_EKI}` : surum
}
