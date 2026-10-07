# Ayşe must not be cut off by noise (NOTYA-AYSE-GURULTU, 2026-10-07)

Source: Kaan, 2026-10-07. A smoke-alarm low-battery chirp (a short beep once a minute) cut Ayşe off mid-sentence
during a doctor 1:1. A short non-speech sound must not stop her; only the doctor really speaking may.

Nothing here changes voice models, the TTS provider, prompts, agent IDs or anything that adds voice minutes.
The only extra speech is the remainder of an answer that was cut by mistake, which she would have said anyway.

## Fix 1 — only real speech may interrupt

### ElevenLabs path (default for Ayşe)

On ElevenLabs the interruption is decided by the ElevenLabs service from the microphone audio we send. So the
page decides what it sends:

- **Speech gate** (`lib/asistan/konusmaKapisi.ts`, pure state machine; browser glue `lib/asistan/elevenKapi.ts`).
  While Ayşe is speaking, the microphone audio sent to the agent is muted with the SDK's own API
  (`Conversation.setMicMuted`, `@elevenlabs/client` 1.17; the SDK keeps streaming silence while muted, the stream
  stays alive). The gate opens when a local detector says the doctor is really speaking:
  - Silero speech probability ≥ `FISH_SILERO_ESIK` (0.5) to enter, ≥ `FISH_SILERO_CIKIS_ESIK` (0.35) to stay
    (the existing thresholds), **and** microphone RMS ≥ `KAPI_RMS_TABAN` (0.03) on the same track,
  - for `KAPI_ACMA_MS` = 200 ms,
  - it stays open while speech continues and closes `KAPI_KUYRUK_MS` = 600 ms after speech ends if Ayşe is still
    speaking.
  - When Ayşe is **not** speaking the gate is always open, so normal turn-taking is unchanged. If the doctor is
    already speaking when Ayşe starts, the gate stays open (no clipped first words).
- **Same microphone stream.** Silero and the RMS analyser listen to the stream the ElevenLabs SDK already opened,
  so there is no second `getUserMedia` and no second permission prompt. SDK 1.17 does not expose that stream
  publicly; `sdkMikrofonAkisi` reads `conversation.input.inputStream` defensively (duck-typed, live audio track
  required). If a future SDK changes that shape, the gate simply does not attach (fail open) and the console says
  `[ses-kapi] { kapi: 'kapali', neden: 'akis_yok' }`. Re-check this after any `@elevenlabs/client` upgrade.
- **Silero** loads for the gate regardless of the Fish opt-in flags (`NEXT_PUBLIC_NOTYA_SILERO*`, which only govern
  Fish turn-ending). Assets are the existing `/vad/` files.
- **Fail open.** No flag, no stream, Silero does not load within its existing timeouts, a stale probability
  (older than 250 ms), or any exception inside the gate → the microphone is unmuted and the gate is removed;
  behaviour is exactly as before. A 100 ms watchdog unmutes whenever Ayşe is not speaking, whatever the state
  machine says. The gate is closed (unmuted, Silero destroyed, its AudioContext closed; the SDK's tracks are never
  stopped) on session end, disconnect, error and the first-message retry.
- **Kill switch** (default ON), per browser, no deploy: `localStorage['notya.sesKapisi'] = 'kapali'` turns it off.
  Opening any page with `?sesKapisi=kapali` writes the flag; `?sesKapisi=acik` removes it.

### Fish path (`AYSE_SES_SAGLAYICI=fish`, dormant)

`bargeSayaci` (`lib/asistan/fishVad.ts`) now requires **both** the existing RMS condition
(RMS ≥ `FISH_BARGE_ESIK` 0.12 for `FISH_BARGE_MS` 300 ms — protects against Ayşe's own speaker leak) **and** a
fresh Silero speech probability ≥ 0.5 when Silero is available (protects against non-speech noise). Without Silero
(or with a stale probability) today's rule is unchanged. Silero on Fish is still opt-in
(`NEXT_PUBLIC_NOTYA_SILERO=1`), so on a default Fish build the rule is unchanged until that flag is set.

## Fix 2 — resume after a false stop (both paths)

Pure state machine: `lib/asistan/kesintiDevam.ts`.

- When Ayşe is interrupted, a `KESINTI_BEKLE_MS` = 1.5 s window starts. If no doctor words arrive in that window she
  continues from the **start of the sentence that was cut**.
- Doctor words cancel the resume: a doctor transcript (ElevenLabs `onMessage` user, after the existing noise /
  echo / greeting filters) or a Fish ASR result. Local speech evidence also cancels it, so she never resumes over a
  doctor whose long sentence has not been transcribed yet: `KESINTI_SES_KANIT_MS` = 250 ms of speech after the cut
  (gate detector, ElevenLabs VAD score ≥ 0.6, or Fish voiced frames), and the clock never fires while the gate
  detector hears speech.
- At most one resume per answer; an answer that was resumed and is cut again is not resumed (no loop) until the
  doctor speaks.
- **ElevenLabs:** the cut point comes from the SDK's `onAgentResponseCorrection` (`original_agent_response` vs the
  played `corrected_agent_response`). The page sends one hidden Turkish user message through the SDK's supported
  `sendUserMessage`: `[kesinti-devam] Sözün yanlışlıkla kesildi, doktor konuşmadı. … «remainder»`.
  - Single-brain Custom LLM route (`lib/asistan/sesLlm.ts`): the marker is handled first; the quoted remainder goes
    straight to the speech gate (no model call, no normalisation twice, no session/memory/note write).
  - An agent on ElevenLabs' own LLM follows the instruction.
  - The page drops the message from the visible transcript (`addMsg` and `onMessage` filters), so it never reaches
    the stored chat history, `ses-ogren`, or the visit note. It does appear in ElevenLabs' own conversation log
    (their dashboard), like the existing hidden `[devam]` turn.
  - No remainder known (no correction event) → no resume.
- **Fish:** the player now records which sentence was playing at the cut (`FishCalar.sonKesim`); the page holds the
  answer text and speaks the rest from the cut sentence itself. For a streamed (WebSocket PCM) answer the sentence
  is not known, so the position is estimated at 14 characters per second of audio played.

Console lines (no audio, no text): `[ses-kapi]` (gate attach / fail-open reason), `[ses-kesinti]` (cut, resume and
its length).

## Thresholds (one place each)

| What | Value | Where |
|------|-------|-------|
| Gate opens after | 200 ms speech | `KAPI_ACMA_MS` |
| Gate hangover | 600 ms | `KAPI_KUYRUK_MS` |
| Gate RMS floor | 0.03 | `KAPI_RMS_TABAN` |
| Silero enter / exit | 0.5 / 0.35 | `FISH_SILERO_ESIK` / `FISH_SILERO_CIKIS_ESIK` |
| Silero freshness | 250 ms | `FISH_SILERO_TAZELIK_MS` |
| Watchdog | 100 ms | `KAPI_BEKCI_MS` |
| Fish barge RMS / time | 0.12 / 300 ms | `FISH_BARGE_ESIK` / `FISH_BARGE_MS` |
| Resume window | 1.5 s | `KESINTI_BEKLE_MS` |
| Speech that cancels a resume | 250 ms | `KESINTI_SES_KANIT_MS` |

## What could NOT be verified without a real microphone

- That 200 ms of gated speech is enough for ElevenLabs to interrupt on a short "dur" (the first ~200 ms of the
  doctor's word reach ElevenLabs as silence). If "dur" does not stop her reliably, lower `KAPI_ACMA_MS` first.
- The first ~200 ms of a doctor sentence started while Ayşe is speaking reach ElevenLabs as silence, so the
  transcript of that sentence may lose its first syllable.
- The RMS floor (0.03) against real speaker leak on laptop speakers, and against a quiet doctor on a headset.
- Whether ElevenLabs sends `agent_response_correction` for Custom LLM agents on every interruption, and its exact
  text (the resume depends on it).
- Whether the hidden user message interrupts / is queued correctly when it lands while ElevenLabs is still
  closing the interrupted turn.
- Silero main-thread load next to the ElevenLabs session on older iPhones (the Fish iOS caution was about turn
  endings; the gate only acts while Ayşe speaks and fails open). The kill switch covers a bad device.
- Unit tests cover the state machines only: `lib/asistan/konusmaKapisi.test.ts`, `lib/asistan/kesintiDevam.test.ts`,
  `lib/asistan/fishVad.test.ts`.

## Manual test (preview deployment, before merge)

Open the browser console to watch `[ses-kapi]` and `[ses-kesinti]`. Start a voice session and ask Ayşe something
with a long answer (for example a patient summary).

1. **Noise does not cut her.** While she speaks, play a smoke-alarm beep (or clap once, or drop a pen). She keeps
   talking. Console: no `[ses-kesinti] kesildi`.
2. **"Dur" stops her.** While she speaks, say "dur" clearly. She stops within about half a second. Then stay silent:
   she must NOT resume (the transcript "dur" arrived). Say "Ayşe dur" / "bir dakika" too.
3. **Forced false stop resumes.** Turn the gate off for this test (`?sesKapisi=kapali`), then make a non-speech
   sound loud enough to cut her (a cough or a knock near the microphone) and stay silent. Within about 1.5 s she
   continues from the start of the cut sentence, once. Repeat and talk right after the cut: she must not resume.
   Turn the gate back on with `?sesKapisi=acik`.
4. **Normal back-and-forth is unchanged.** Ask, listen, ask again, interrupt her with a real question; replies and
   turn-taking feel as before; no hidden message appears on screen or in the saved note.
5. **Repeat 1–4 with laptop speakers and with a headset** (and once on iPhone). With laptop speakers she must not
   cut herself off with her own voice.
