/**
 * Canada: the two voices this pack speaks with.
 *
 * Verified 2026-10-14 on the public shared-voice record (no key):
 *   GET https://api.elevenlabs.io/v1/shared-voices/<id>
 * Each record is gender, accent canadian, locale en-CA, language en, and verified_languages includes
 * model_id eleven_flash_v2_5 for language en, accent canadian, locale en-CA.
 *   Darren    pExXCSeVFtFLETPgZoWn  male, middle_aged. The record's own description is a Canadian male voice.
 *   Danielle  FVQMzxJGPUBtfz1Azdoy  female, young. The record's own description is "Canadian Female".
 *
 * The premade list has no Canadian voice. Cody and Jenna appear on the Canadian accent page, and their own
 * descriptions say American, so they are not used.
 *
 * The provider's language code for Flash v2.5 is ISO 639-1 `en`. The accent is the voice.
 */
import type { UlkeSesCikisi } from '@/lib/ulke/tipler'

export const CA_SES: UlkeSesCikisi = {
  saglayici: 'elevenlabs',
  model: 'eleven_flash_v2_5',
  dilKodu: 'en',
  yerel: 'en-CA',
  sesler: {
    erkek: { ad: 'Darren', id: 'pExXCSeVFtFLETPgZoWn' },
    kadin: { ad: 'Danielle', id: 'FVQMzxJGPUBtfz1Azdoy' },
  },
}
