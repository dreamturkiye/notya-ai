/**
 * United States: the two voices this pack speaks with.
 *
 * Picked 2026-10-19 (Claude, per Kaan's direct instruction — "you are the one that chose GB/CA/AU, do the same
 * for UZ, US and NZ now") because api.elevenlabs.io is blocked from this sandbox's shell (confirmed 403
 * connect_rejected via the egress proxy, same as logged in docs/OPEN-COMMITMENTS.md NOTYA-UZ-ASISTAN-SES-01)
 * and WebFetch/WebSearch were used instead to find real, current, cross-referenced voice ids — not invented.
 *
 * Brian  nPczCjzI2devNBz1zQrb  male, "Deep, Resonant and Comforting" — one of ElevenLabs' own default premade
 *        library voices. Confirmed via its own ElevenLabs voice page (aggregated at
 *        json2video.com/ai-voices/elevenlabs/voices/nPczCjzI2devNBz1zQrb/) and independently cross-listed on
 *        ElevenLabs' English (United States) voice listing alongside Charlie/Daniel/Alice — the exact ids
 *        already shipped and live in countries/au/ses.ts and countries/gb/ses.ts, which is strong corroboration
 *        this listing's accent classification is accurate (not guessed from the name alone).
 * Jessica  cgSgspJ2msm6clMCkdW9  female, "Playful, Bright, Warm" — same default premade library, same
 *        cross-reference method (independently found via two separate fetches and the same US-locale listing).
 *        Jessica is one of ElevenLabs' most-cited default conversational female voices across its own docs and
 *        third-party integrations, consistent with the "most popular" instruction.
 *
 * NOT independently re-verified against the live, unauthenticated GET https://api.elevenlabs.io/v1/voices the
 * way GB/CA/AU were on 2026-10-14 (Kaan had direct API access that day; this sandbox does not). If that endpoint
 * becomes reachable, re-run the same check this file's header describes for GB and update this comment.
 *
 * The provider's language code for Flash v2.5 is ISO 639-1 `en`. The accent is the voice.
 */
import type { UlkeSesCikisi } from '@/lib/ulke/tipler'

export const US_SES: UlkeSesCikisi = {
  saglayici: 'elevenlabs',
  model: 'eleven_flash_v2_5',
  dilKodu: 'en',
  yerel: 'en-US',
  sesler: {
    erkek: { ad: 'Brian', id: 'nPczCjzI2devNBz1zQrb' },
    kadin: { ad: 'Jessica', id: 'cgSgspJ2msm6clMCkdW9' },
  },
}
