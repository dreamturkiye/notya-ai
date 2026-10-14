/**
 * United Kingdom: the two voices this pack speaks with.
 *
 * Verified 2026-10-14 on the public premade list GET https://api.elevenlabs.io/v1/voices (no key).
 * Each row has high_quality_base_model_ids including eleven_flash_v2_5, and verified_languages with
 * model_id eleven_flash_v2_5, accent british, locale en-GB.
 *   Daniel  onwK4e9ZLuTAKqWW03F9  male, middle_aged, informative_educational
 *   Alice   Xb7hH8MSUJpSbSDYk0k2  female, middle_aged, informative_educational
 *
 * The provider's language code for Flash v2.5 is ISO 639-1 `en` (the convert API). The accent is the voice.
 */
import type { UlkeSesCikisi } from '@/lib/ulke/tipler'

export const GB_SES: UlkeSesCikisi = {
  saglayici: 'elevenlabs',
  model: 'eleven_flash_v2_5',
  dilKodu: 'en',
  yerel: 'en-GB',
  sesler: {
    erkek: { ad: 'Daniel', id: 'onwK4e9ZLuTAKqWW03F9' },
    kadin: { ad: 'Alice', id: 'Xb7hH8MSUJpSbSDYk0k2' },
  },
}
