/**
 * NOTYA-SES-ELEVEN-GERI-01 (Kaan, 2026-10-02) — who speaks for Ayşe Kaya.
 *
 * Dr. Gökhan is not satisfied with the Fish Audio voices for Turkish (none is trained on Turkish medical
 * pronunciation), so Ayşe speaks with her ElevenLabs voice again, as before the Fish changeover. The Fish path
 * (lib/asistan/fish*.ts, /api/asistan/fish-*) stays in the repository behind ONE variable:
 *
 *   AYSE_SES_SAGLAYICI = elevenlabs   (default; also when unset or unreadable)
 *   AYSE_SES_SAGLAYICI = fish         (Ayşe on Fish again; still needs FISH_API_KEY)
 *
 * next.config.mjs inlines the variable at build time, so the browser and the server read the same value: the page
 * has to know the provider inside the tap (the Fish microphone is opened there, before any request). The other
 * specialists never use Fish, whatever the variable says.
 *
 * No server-only import here — the client bundle reads this file.
 */

export type AyseSesSaglayici = 'elevenlabs' | 'fish'

export const AYSE_SES_VARSAYILAN: AyseSesSaglayici = 'elevenlabs'

/** The configured provider. Anything but the exact word `fish` is ElevenLabs. */
export function ayseSesSaglayici(deger: string | null | undefined = process.env.AYSE_SES_SAGLAYICI): AyseSesSaglayici {
  return String(deger ?? '').trim().toLowerCase() === 'fish' ? 'fish' : AYSE_SES_VARSAYILAN
}

/**
 * The page's choice, made inside the tap: true only for Ayşe Kaya with the variable set to `fish`. The server has
 * the last word (it also needs the Fish key): when it answers `fish: false` the page falls back to ElevenLabs.
 */
export function ayseFishIstemcideMi(personaId: string | null | undefined, deger: string | null | undefined = process.env.AYSE_SES_SAGLAYICI): boolean {
  return personaId === 'aysekaya' && ayseSesSaglayici(deger) === 'fish'
}
