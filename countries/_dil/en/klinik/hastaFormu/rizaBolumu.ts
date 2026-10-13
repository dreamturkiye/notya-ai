/**
 * NOTYA-ULKE-INTAKE-02 — consent acknowledgements a country appends after the shared core.
 * MACHINE-WRITTEN. NOT READ BY A LAWYER (`hukukcuInceledi` stays false on the form). PATIENT-FACING.
 * The financial sentence is the country's own, because who pays is not shared.
 */
import { s, tek, type HamBolum } from './yardimci'

const KABUL = () => [s('agree', 'I agree'), s('discuss', 'I want to discuss this with the clinician first')]

export function rizaBolumu(onEk: string, ucret: { metin: string; veliMetni: string }): HamBolum {
  const yardim = 'A clinician can explain this before you agree.'
  return {
    anahtar: 'consent_ack',
    baslik: 'Consent acknowledgements',
    veliBasligi: 'Consent acknowledgements for the child',
    sorular: [
      tek(`${onEk}_treat`, 'Do you agree to be examined and treated?', KABUL(), {
        zorunlu: true,
        veliMetni: 'Do you agree for the child to be examined and treated?',
        yardim,
      }),
      tek(`${onEk}_bill`, ucret.metin, KABUL(), { zorunlu: true, veliMetni: ucret.veliMetni, yardim }),
      tek(`${onEk}_privacy`, 'Do you acknowledge the privacy notice for this form?', KABUL(), {
        zorunlu: true,
        veliMetni: 'Do you acknowledge the privacy notice for this form, for the child?',
        yardim,
      }),
    ],
  }
}
