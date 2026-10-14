/**
 * Australia: the two voices this pack speaks with.
 *
 * Charlie — verified 2026-10-14 on the public premade list GET https://api.elevenlabs.io/v1/voices.
 * high_quality_base_model_ids includes eleven_flash_v2_5, and verified_languages has model_id
 * eleven_flash_v2_5, accent australian, locale en-AU. Male, young, conversational.
 *   IKne3meq5aSn9XLyUdCD
 *
 * Clara — verified the same day on the public shared-voice record
 * GET https://api.elevenlabs.io/v1/shared-voices/tyepWYJJwJM9TTFIg5U7 (no key).
 * gender female, accent australian, locale en-AU, and verified_languages includes
 * model_id eleven_flash_v2_5 for language en, accent australian, locale en-AU.
 *   tyepWYJJwJM9TTFIg5U7
 *
 * The provider's language code for Flash v2.5 is ISO 639-1 `en`. The accent is the voice.
 */
import type { UlkeSesCikisi } from '@/lib/ulke/tipler'

export const AU_SES: UlkeSesCikisi = {
  saglayici: 'elevenlabs',
  model: 'eleven_flash_v2_5',
  dilKodu: 'en',
  yerel: 'en-AU',
  sesler: {
    erkek: { ad: 'Charlie', id: 'IKne3meq5aSn9XLyUdCD' },
    kadin: { ad: 'Clara', id: 'tyepWYJJwJM9TTFIg5U7' },
  },
}
