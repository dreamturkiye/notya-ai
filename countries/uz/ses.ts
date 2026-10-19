/**
 * Uzbekistan: the two voices this pack speaks with — a CROSS-LINGUAL Uzbek attempt on eleven_v4, NOT a
 * native-Uzbek voice pair. Flag this clearly in any UI/docs that surface the pair: it is the best real option
 * found, not the real thing.
 *
 * SHIPPED 2026-10-19 on Kaan's explicit decision: "push the eleven_v4 Uzbek synthesis first, I will confirm
 * it with real Uzbek speakers later." He accepts the quality-verification gap below and does not want it to
 * block shipping. AUDIO QUALITY IS THEREFORE UNCONFIRMED — do not treat this as a validated native voice
 * anywhere downstream until Kaan has actually listened to it with real Uzbek speakers and said so.
 *
 * WHY eleven_v4, not eleven_flash_v2_5 (every sibling country's model): Flash v2.5's language list is
 * "Multilingual v2's 29 languages + Hungarian, Norwegian, Vietnamese" — Uzbek is not in it, confirmed on
 * ElevenLabs' own models-overview page (elevenlabs.io/docs/overview/models). `eleven_v4` explicitly lists
 * Uzbek ("UZB Uzbek") among its 90+ languages, same source, re-checked fresh on 2026-10-19 (not carried over
 * from an earlier inference — see the dated history below). `eleven_v4_turbo`, the model's faster sibling,
 * is NOT confirmed to carry the same Uzbek entry from the sources checked, so it is deliberately not used here.
 *
 * WHY still not a NATIVE Uzbek voice: no ElevenLabs voice in the library is tagged or verified native to
 * Uzbek, on any model — ElevenLabs' own help article says "All pre-made voices and generated voices are
 * English," and a third-party aggregator that indexes ElevenLabs' catalog by language
 * (json2video.com/ai-voices/languages/uzbek/) returns ZERO ElevenLabs entries for Uzbek. `eleven_v4`'s Uzbek
 * "support" is cross-lingual synthesis — any voice reading Uzbek text — by the model's own design, not a
 * speaker who is actually Uzbek.
 *
 * VOICE PAIR (2026-10-19): chosen from ElevenLabs' public library for documented multilingual/cross-lingual
 * use, since both will be reading Uzbek text without being native speakers:
 *
 * Brian  nPczCjzI2devNBz1zQrb  male. ElevenLabs' own voice-library category page describes Brian as a
 *        "multilingual voice" ("Deep, Resonant and Comforting"), the category meant for a voice that keeps a
 *        consistent style across languages. voice_id cross-checked identical on two independent third-party
 *        catalogs (signalwire.com/docs/platform/voice/tts/elevenlabs and
 *        wavespeed.ai/docs/docs-api/elevenlabs/elevenlabs-voice-id), 2026-10-19.
 * Alice  Xb7hH8MSUJpSbSDYk0k2  female. Also an ElevenLabs "multilingual voice"; its own detail page
 *        (json2video.com/ai-voices/elevenlabs/voices/Xb7hH8MSUJpSbSDYk0k2) states "ElevenLabs has verified
 *        Alice in 7 languages" (English, Arabic, French, Hindi, Italian, Japanese, Polish) and lists model
 *        compatibility as Multilingual v2, Flash and v3 — the strongest documented cross-lingual track record
 *        found among the candidates checked. voice_id cross-checked identical on the same two catalogs above.
 * Neither source's compatibility list names `eleven_v4` explicitly for either voice (it is the newest model;
 * third-party catalogs lag ElevenLabs' own release notes) — that gap is real and is what Kaan's own
 * real-speaker listening pass is expected to catch if it does not hold up.
 *
 * dilKodu is `uz` (ISO 639-1, the provider's `eleven_v4` Uzbek language code) — this is the first thing in this
 * file that is genuinely 'uz', not a fallback language, because `eleven_v4` is the first model this pack has
 * used that actually lists Uzbek.
 *
 * ── Dated history (kept so the reasoning isn't lost) ──
 * 2026-10-?? first pass: shipped a RUSSIAN FALLBACK pair (Nikolay/Elena) on `eleven_flash_v2_5`, because that
 *   model has no Uzbek at all and Russian is widely understood in Uzbekistan — a real, defensible substitution
 *   at the time, not a fabricated "Uzbek" pick.
 * 2026-10-19 re-check: confirmed (two fresh, independent ElevenLabs doc fetches) that `eleven_v4` does list
 *   Uzbek. NOT swapped in that pass — three reasons recorded at the time: (1) still no native-Uzbek voice,
 *   (2) the swap is a core/shared-engine change (lib/ulke/tipler.ts + lib/ulke/uygulama/sesSentez.ts hard-locked
 *   every country to Flash v2.5), not a file edit here alone, (3) voice_settings compatibility with v4 and real
 *   audio quality were unverifiable (this sandbox's egress to api.elevenlabs.io is policy-blocked).
 * 2026-10-19, same day, Kaan's explicit decision: ship the eleven_v4 attempt now anyway, confirm quality later.
 *   Reason (2) is resolved in this change (the shared engine now admits `eleven_v4`, see
 *   lib/ulke/uygulama/sesSentez.ts's `SES_GECERLI_MODELLER`). Reason (3) is the gap Kaan explicitly accepted;
 *   reason (1) is unchanged and will stay unchanged until ElevenLabs ships a native Uzbek voice.
 */
import type { UlkeSesCikisi } from '@/lib/ulke/tipler'

export const UZ_SES: UlkeSesCikisi = {
  saglayici: 'elevenlabs',
  model: 'eleven_v4',
  dilKodu: 'uz',
  yerel: 'uz-Latn-UZ',
  sesler: {
    erkek: { ad: 'Brian', id: 'nPczCjzI2devNBz1zQrb' },
    kadin: { ad: 'Alice', id: 'Xb7hH8MSUJpSbSDYk0k2' },
  },
}
