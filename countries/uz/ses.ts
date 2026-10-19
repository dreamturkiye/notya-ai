/**
 * Uzbekistan: the two voices this pack speaks with — a RUSSIAN FALLBACK PAIR, NOT NATIVE UZBEK VOICES.
 * Flag this clearly in any UI/docs that surface the pair: it is a defensible substitution, not the real thing.
 *
 * REAL FINDING (Claude, 2026-10-19, verified by web research — not assumed): ElevenLabs does not ship a native
 * Uzbek voice, and the model this pack's siblings (GB/CA/AU/US/NZ) all use, eleven_flash_v2_5, does not support
 * Uzbek as a TTS language at all. Confirmed two ways:
 *   1. ElevenLabs' own models documentation (elevenlabs.io/docs/overview/models): eleven_flash_v2_5's language
 *      list is "Multilingual v2's 29 languages + Hungarian, Norwegian, Vietnamese" — Uzbek is not in it. Uzbek
 *      IS supported, but only by eleven_v3 (alpha, 70+ languages) and the newer eleven_v4/eleven_v4_turbo —
 *      different models from the one every other country pack's ses.ts is built on.
 *   2. No ElevenLabs voice in the library is tagged/verified native to Uzbek at all, on any model: ElevenLabs'
 *      own help article says "All pre-made voices and generated voices are English" and points to the
 *      Professional/community category's own per-voice language tags instead; a third-party aggregator that
 *      indexes ElevenLabs' voice catalog by language (json2video.com/ai-voices/languages/uzbek/) returns ZERO
 *      ElevenLabs entries for Uzbek — the only two Uzbek voices it has on file are Azure's (a different
 *      provider entirely, not usable here).
 *
 * FALLBACK CHOSEN, per the brief's own instruction not to force a fake "Uzbek" pick: Russian, because (a)
 * Russian is widely spoken and understood in Uzbekistan (a real, defensible linguistic fact, not invented for
 * this job) and (b) Russian IS in eleven_flash_v2_5's supported-language list, so this keeps the exact same
 * model/shape as every other country pack instead of introducing a one-off model just for Uzbekistan.
 *
 * Nikolay  3EuKHIEZbSzrHGNmdYsx  male, middle-aged, "confident". Its own ElevenLabs voice page states language
 *          "Russian" and model compatibility "Multilingual v2, Flash, v3" explicitly.
 * Elena    8oyYKsAD3g8uVOXOQB4Z  female, "Calm and Confident". Classified under ElevenLabs' own Russian/Russia
 *          voice listing (same listing Nikolay was found on) — its own detail page did not restate the
 *          language tag explicitly, which is a real gap in this cross-check and is flagged here rather than
 *          glossed over; the pairing is still the most defensible real, verifiable choice found.
 *
 * NOT independently re-verified against the live, unauthenticated GET https://api.elevenlabs.io/v1/voices the
 * way GB/CA/AU were on 2026-10-14 — this sandbox cannot reach that endpoint (confirmed 403 connect_rejected).
 * If a real native Uzbek ElevenLabs voice is added to the library later, or this sandbox's egress is unblocked,
 * replace this file's pair and update the doc entry — this is explicitly a stand-in, not a final decision.
 *
 * dilKodu is `ru` (the provider's Flash v2.5 language code), not `uz` — the pack's text is NOT being spoken in
 * Uzbek by this voice pair; callers that assumed otherwise must be updated when the UI surfaces this.
 *
 * RE-CHECKED 2026-10-19 (Claude), because Kaan caught that the note above already said v4 lists Uzbek and asked
 * "did you check?" — fair catch; re-verified for real instead of repeating the inference, via two fresh,
 * independent fetches of ElevenLabs' own current docs (not web-search snippets): `eleven_v4` (and `eleven_v4_turbo`)
 * DOES explicitly list Uzbek ("UZB Uzbek") among its 90+ languages — confirmed on ElevenLabs' models-overview page
 * and its model-differences help article, same day. Kaan's catch is correct: v4 genuinely supports Uzbek, a real
 * and materially different claim from Flash's "not at all." STILL NOT SWAPPED IN, for three concrete reasons, not
 * a repeat dismissal:
 *   1. Still zero dedicated native-Uzbek ElevenLabs voices exist (re-checked the same third-party aggregator
 *      today — still 0 ElevenLabs results for Uzbek, only 2 unrelated Azure ones). v4's Uzbek "support" is
 *      cross-lingual synthesis — any voice reading Uzbek text — by the model's own design, not a native speaker.
 *   2. This is not a per-country file edit: `lib/ulke/tipler.ts`'s `UlkeSesCikisi.model` type and
 *      `lib/ulke/uygulama/sesSentez.ts`'s `SES_MODEL_ID` hard-lock EVERY country to `eleven_flash_v2_5` — proven
 *      by `sesSentez.test.ts`'s own existing test, which asserts `eleven_v4_turbo` is REJECTED with `kod: 'MODEL'`.
 *      Swapping UZ to v4 is a core/shared-engine change (type + validation), not a `countries/uz/ses.ts` edit.
 *   3. `voice_settings` request-body compatibility with v4, and actual synthesized Uzbek audio quality, are
 *      unverifiable from here: this sandbox's egress to `api.elevenlabs.io` is still policy-blocked (403,
 *      re-confirmed the same day in `docs/OPEN-COMMITMENTS.md`), so no real v4 call can be made or heard before
 *      this would ship to a live clinical product. Full finding and what actually closes this:
 *      `docs/OPEN-COMMITMENTS.md` on `main`, NOTYA-UZ-ASISTAN-SES-01 → item 3 → "v4 re-check, 2026-10-19."
 */
import type { UlkeSesCikisi } from '@/lib/ulke/tipler'

export const UZ_SES: UlkeSesCikisi = {
  saglayici: 'elevenlabs',
  model: 'eleven_flash_v2_5',
  dilKodu: 'ru',
  yerel: 'ru-UZ',
  sesler: {
    erkek: { ad: 'Nikolay', id: '3EuKHIEZbSzrHGNmdYsx' },
    kadin: { ad: 'Elena', id: '8oyYKsAD3g8uVOXOQB4Z' },
  },
}
