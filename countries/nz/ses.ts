/**
 * New Zealand: the two voices this pack speaks with.
 *
 * Picked 2026-10-19 (Claude, per Kaan's direct instruction — "you are the one that chose GB/CA/AU, do the same
 * for UZ, US and NZ now") because api.elevenlabs.io is blocked from this sandbox's shell (confirmed 403
 * connect_rejected via the egress proxy, same as logged in docs/OPEN-COMMITMENTS.md NOTYA-UZ-ASISTAN-SES-01)
 * and WebFetch/WebSearch were used instead — not an invented id.
 *
 * Harry  4sEMFD9vANmoOjtPLvW8  male. Its own ElevenLabs voice page (aggregated at
 *        json2video.com/ai-voices/elevenlabs/voices/4sEMFD9vANmoOjtPLvW8/) states explicitly: accent "New
 *        Zealand (Kiwi)", language/locale "English (New Zealand)", model compatibility "Multilingual v2,
 *        Flash, v3". Disambiguated from several other unrelated "Harry" voices with different ids.
 * Kylee  pcKdPWtbF6bM9o7NHjCI  female. Same source, same page per voice: "slightly-hoarse New Zealand
 *        female", accent "New Zealand", locale "English (New Zealand)", "Multilingual v2, Flash, v3", verified
 *        in 20 languages including English.
 * Both also appear, independently, on ElevenLabs' own English (New Zealand) voice listing page.
 *
 * NOT independently re-verified against the live, unauthenticated GET https://api.elevenlabs.io/v1/voices the
 * way GB/CA/AU were on 2026-10-14 — this sandbox cannot reach that endpoint. If it becomes reachable, re-run
 * that same check and update this comment.
 *
 * The provider's language code for Flash v2.5 is ISO 639-1 `en`. The accent is the voice.
 */
import type { UlkeSesCikisi } from '@/lib/ulke/tipler'

export const NZ_SES: UlkeSesCikisi = {
  saglayici: 'elevenlabs',
  model: 'eleven_flash_v2_5',
  dilKodu: 'en',
  yerel: 'en-NZ',
  sesler: {
    erkek: { ad: 'Harry', id: '4sEMFD9vANmoOjtPLvW8' },
    kadin: { ad: 'Kylee', id: 'pcKdPWtbF6bM9o7NHjCI' },
  },
}
