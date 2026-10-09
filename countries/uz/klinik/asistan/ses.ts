/**
 * NOTYA-ULKE-ASISTAN-01 — Uzbekistan: the assistant's VOICE settings. Every provider identifier of the feature is
 * here and nowhere else; the kit names no model and no voice.
 *
 * ── THE DOCTOR SPEAKS THE QUESTION (`giris`) ──
 * Transcribed by the kit's speech layer with this pack's own speech settings (../index.ts → `konusma`: the same
 * engine, model, language codes and thresholds as a visit recording). The recording travels in the request, is held
 * in memory for the one call and is never written to storage. No recording of a patient belongs in this feature.
 *
 * ── THE DOCTOR HEARS THE ANSWER (`cikis`) ── SWITCHED OFF.
 * The owner decided the voice on 2026-10-08: "ElevenLabs Eleven v4 Turbo" (docs/COUNTRY-PACK-UZBEKISTAN.md).
 * What the vendor's OWN documentation says, read on 2026-10-09 (https://elevenlabs.io/docs/overview/models and
 * https://elevenlabs.io/docs/eleven-api/guides/how-to/websockets/realtime-tdd):
 *   CONFIRMED   the model identifier is `eleven_v4_turbo`;
 *   CONFIRMED   the v4 family lists "Uzbek (uzb)" and "Russian (rus)" among its 90+ languages;
 *   CONFIRMED   it is reached through the "Text to Dialogue websocket"
 *               (wss://api.elevenlabs.io/v1/text-to-dialogue/stream-input, `model_id` in the address, the voice in
 *               the first message, one registered voice for this model) and through the vendor's agents product;
 *               median inference latency "~100ms";
 *   NOT STATED  a character limit per request for this model (the table gives 10,000 for `eleven_v4` only);
 *   NOT STATED  whether the plain text-to-speech address accepts this model, and any language parameter on the
 *               websocket: the codes below are kept as the vendor lists them and ARE NOT SENT by the kit today;
 *   NOT STATED  anything about how Uzbek sounds. No native listener has heard a voice (checklist D5).
 * WHY IT IS OFF. (1) The voices are the owner's to choose and none is chosen: every voice id below is null.
 * (2) No key was available to the job that wrote this, so nothing was ever sent to the provider: the transport is
 * proven against a stand-in only. Both are in docs/OPEN-COMMITMENTS.md (NOTYA-ULKE-ASISTAN-01). The pack check
 * refuses `acik: true` while a role has no voice or the model is not marked as confirmed.
 */
import type { AsistanSesCikisi, AsistanSesGirisi } from '@/lib/ulke/asistan/tipler'
import { UZ_ROLLER } from '../rolAdlari'

export const UZ_ASISTAN_SES_GIRISI: AsistanSesGirisi = {
  acik: true,
  // A spoken question, not a visit: about two minutes of compressed speech. A STARTING VALUE.
  azamiBayt: 4_000_000,
  // A STARTING VALUE, the owner's to confirm.
  gunlukLimit: 100,
}

export const UZ_ASISTAN_SES_CIKISI: AsistanSesCikisi = {
  // OFF until the owner has chosen the voices and one real answer has been heard by a native listener.
  acik: false,
  saglayici: 'elevenlabs-diyalog-ws',
  model: 'eleven_v4_turbo',
  modelDogrulama: { kaynak: 'https://elevenlabs.io/docs/overview/models', tarih: '2026-10-09' },
  cikisBicimi: 'mp3_44100_128',
  // As the vendor's language list writes them. Not sent today: the documented websocket names no language parameter.
  dilKodlari: { 'uz-Latn': 'uzb', 'uz-Cyrl': 'uzb', ru: 'rus' },
  // WAITING ON KAAN: he picks the voices. One per role where he wants one, and one for every other role.
  sesler: { varsayilan: null, roller: Object.fromEntries(UZ_ROLLER.map((rol) => [rol, null])) },
  // The vendor states no limit for this model. A cautious ceiling of the kit's own use, not a vendor figure.
  azamiKarakter: 3_000,
  // A STARTING VALUE, the owner's to confirm (each answer read aloud is paid for).
  gunlukLimit: 100,
}
