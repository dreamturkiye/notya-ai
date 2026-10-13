/**
 * NOTYA-ULKE-INTAKE-01 — the INVITATION TEXT for an intake form: a short message the doctor copies and pastes into
 * whatever messenger they use (the same pattern as the appointment reminder, ./hatirlatma.ts). Pure: no network, no
 * provider, no clock.
 *
 * NOTHING IS SENT. No messaging provider is connected to a country build, and this file calls nobody: it returns a
 * string.
 *
 * LANGUAGE. The text is in the PATIENT's language form — the form the server names when the form is asked for
 * (the patient's language; where it has several scripts, the doctor's script), never the doctor's own by default.
 *
 * THE LINK. A patient's link exists as text only at the moment it is made: the database keeps its hash. So there are
 * two texts. With a link made a moment ago (`adres`), the text carries it. For a patient who already has a link, the
 * text carries none and asks them to open the link they were given. THE PIN IS NEVER IN THE TEXT: the doctor tells it
 * separately, so that one forwarded message does not open the patient's page.
 *
 * The sentences are the pack's (its intake-form catalogue, `davet.*`).
 */
import type { DilKodu } from '@/lib/ulke/tipler'
import { formMetni } from './index'

export type FormDavetiGirdisi = {
  /** The language form to write in: the patient's (lib/ulke/intake/form.ts → davetDili). */
  dil: DilKodu
  /** The doctor's name as the account wrote it, or ''. */
  hekimAd: string
  /** The whole address of the patient's page, when a link was made in this step; null when the patient already has one. */
  adres: string | null
}

export function formDavetMetni(g: FormDavetiGirdisi): { dil: DilKodu; metin: string } {
  const d = formMetni(g.dil).davet
  // One line, no control characters, never long enough to drown the message.
  const ad = g.hekimAd.replace(/\s+/g, ' ').trim().slice(0, 80)
  if (g.adres) {
    // Replaced in one pass, so that a name containing "%2" stays a name.
    const metin = ad ? d.metin.replace(/%([12])/g, (_, n: string) => (n === '1' ? ad : (g.adres as string))) : d.metinAdsiz.replace('%', () => g.adres as string)
    return { dil: g.dil, metin }
  }
  return { dil: g.dil, metin: ad ? d.baglantisiz.replace('%', () => ad) : d.baglantisizAdsiz }
}
