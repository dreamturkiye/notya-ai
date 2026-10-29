/**
 * NOTYA-SES-ESKI-02 (Kaan, live test 2026-10-02) → REVISED by SES-OMURGA-V2 (Kaan, 2026-10-29).
 *
 * 2026-10-02: on ElevenLabs a pause turn ('...') reached the model, which answered with a check-in ("Buradayım Hocam").
 * That was the fix for a lone period voiced as a sigh. On 2026-10-21 it produced the opposite defect: 9 of 10 doctor
 * turns in one session were "...", each answered with chatter after 4–10 s of model time, and the follow-up rewriter
 * re-answered the previous question on them.
 *
 * Now: the ElevenLabs route never lets a pause reach the brain — it answers ElevenLabs with its `skip_turn` system tool
 * (silent, keeps listening; lib/asistan/sesTurKapisi.ts sesOnKapisi). If one still arrives here (a text-channel "..."),
 * nothing is said and the model is not called. Right after a calendar answer the fixed check-in line stays.
 */
export type Saglayici = 'elevenlabs' | 'fish'
export type DuraklamaKarari = 'sessiz' | 'buradayim' | 'model'
export const BURADAYIM_SOZU = 'Buradayım Hocam.'

export function duraklamaKarari(saglayici: Saglayici | undefined, takvimdenHemenSonra: boolean): DuraklamaKarari {
  if (saglayici !== 'elevenlabs') return 'sessiz'
  return takvimdenHemenSonra ? 'buradayim' : 'sessiz'
}
