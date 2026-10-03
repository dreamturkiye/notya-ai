/**
 * NOTYA-SES-ESKI-02 (Kaan, live test 2026-10-02): on ElevenLabs a pause turn ('...') must be answered as before the Fish work.
 * ElevenLabs sends one about every 8 seconds of silence. The brain used to swallow it with an empty answer, the route turned
 * that into a lone period, and ElevenLabs Flash voiced the period as a tiny sigh (ElevenLabs call records, 22:01, 22:40, 22:45).
 * Before the switch the pause reached the model, which said things like Buradayim Hocam, Nasil yardimci olayim.
 * Only right after a calendar answer the pause still must not reach the model (it takes the schedule back), so the line is fixed.
 */
export type Saglayici = 'elevenlabs' | 'fish'
export type DuraklamaKarari = 'sessiz' | 'buradayim' | 'model'
export const BURADAYIM_SOZU = 'Buradayım Hocam.'

export function duraklamaKarari(saglayici: Saglayici | undefined, takvimdenHemenSonra: boolean): DuraklamaKarari {
  if (saglayici !== 'elevenlabs') return 'sessiz'
  return takvimdenHemenSonra ? 'buradayim' : 'model'
}
