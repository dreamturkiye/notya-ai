# Doctor voice profile — Ayşe listens to the doctor's voice (NOTYA-SES-PROFILI, 2026-10-07)

Source: Kaan, 2026-10-07. In a paediatric room a crying child, a parent or a television must not cut Ayşe off or
be taken for the doctor. Voice recognition is offered to every new doctor during onboarding and is **optional**.
Builds on the speech gate and resume of `docs/AYSE-GURULTU.md`.

**This is not authentication.** It is never used for sign-in and is not described as security anywhere; the
enrolment screen says `Bu bir güvenlik kilidi değildir.`

## How it works

1. **Enrolment** (`components/sesProfili/SesProfiliKayit.tsx`, used by the onboarding step and Ayarlar).
   - Onboarding: after the account is created, doctors (only) see step 4, `Ayşe sesinizi tanısın`, with two plain
     benefit lines and `Bu bir güvenlik kilidi değildir.` `Şimdi değil` has the same size and style as the record
     button and only navigates on — nothing else in onboarding changes.
   - Consent (addendum): only the checkbox line is shown, unticked; recording stays disabled until it is ticked.
     `Açık rıza metnini oku` opens the full text in a new tab at `/kvkk#ses-profili` (the doctor keeps their place).
   - The doctor reads four short, phonetically varied Turkish sentences (~30 s). Each sentence is checked
     (`lib/asistan/sesProfili/kalite.ts`): too short (< 2 s of voiced speech), too quiet (speech RMS < 0.012),
     too noisy (speech-to-background < 12 dB). Only a failed sentence is repeated, with a Turkish reason.
   - Audio is captured with the same browser processing the voice session uses (echo cancellation, noise
     suppression, AGC, voice isolation), resampled to 16 kHz, trimmed of long silences and turned into a
     256-number embedding in a Web Worker. The PCM is dropped right after; it is never uploaded or sent to a
     third party. The profile is the L2-normalised mean of the four sentence embeddings.
   - Ayarlar › Ses profili (`/dashboard/doktor/ayarlar/ses-profili`): enrol later, `Yeniden kaydet`, and
     `Ses profilimi sil`, which deletes the row immediately (the route re-reads and fails if the row is still there).
2. **Storage** (`lib/db/migrations/127_doktor_ses_profili.sql`, `app/api/doktor/ses-profili/route.ts`).
   - Table `doktor_ses_profilleri`, one row per doctor: `profil_encrypted` (the embedding as JSON, encrypted with
     the existing AES-256-GCM `encryptPII`), `model_surumu`, `riza_zamani`, `created_at`, `updated_at`.
   - Owner-only: the route scopes every read/write/delete by the session's doctor id (`pratikOturum` +
     `sadeceDoktor`; a secretary gets 403) and accepts no other id. RLS is the second line, same pattern as
     `doktor_eposta_baglantilari`: a signed-in doctor can select only their own row's harmless columns, never the
     profile column, and cannot write from the browser. `on delete cascade` with the account.
   - PUT requires `riza: true`, the current model version and exactly 256 finite numbers. No audio is accepted.
   - GET returns the decrypted embedding to its owner only: the comparison runs in the doctor's browser.
   - Patients are never enrolled and no patient voice profile is ever computed or stored: enrolment is only reachable
     from the doctor's onboarding and Ayarlar, and runtime only compares against the doctor's own stored profile.
3. **Engine** (`lib/asistan/sesProfili/ge2e.ts`, worker `isci.ts`, client `istemci.ts`).
   - In-browser, no per-minute vendor cost. The worker and model load lazily, only for a doctor who has a profile
     (or is enrolling, after ticking consent); the model is kept in the Cache API afterwards.
   - The TypeScript encoder reproduces Resemblyzer exactly: librosa-compatible linear mel spectrogram (n_fft 400,
     hop 160, 40 Slaney mels) → 3-layer LSTM → linear → ReLU → L2 norm; enrolment uses resemblyzer's
     `embed_utterance` (1.6 s partials, rate 1.3). Checked against a NumPy/librosa reference: cosine 1.000000 on real
     speech; unit test against a stored reference (`__fixtures__/ge2e-referans.json`).
   - Measured: headless Chromium — model load 143 ms (local), enrolment embedding of 1.2 s of 48 kHz audio 394 ms,
     one 0.8 s runtime score 226 ms; node — 0.8 s segment 159 ms, 1.6 s segment 361 ms.
4. **Runtime, both voice paths** (`lib/asistan/sesProfili/eslesme.ts`, gate `lib/asistan/konusmaKapisi.ts`).
   - The voice session fetches the profile in parallel with connecting; the speech gate attaches at once and gets
     the profile when the model is ready. The profile only acts while Ayşe is speaking (that is where the gate acts).
   - The 16 kHz Silero frames the gate already receives are buffered; a speech segment (gate detector: Silero +
     RMS floor, ended by 600 ms of silence) is scored once it holds 0.8 s of speech and re-scored every 0.3 s up to
     1.6 s, until it gets a final verdict.
   - Strong preference, never a hard lock:
     - `red` (clearly not the doctor) keeps / puts the microphone muted for the rest of that segment;
     - `kabul` opens it;
     - very short words that cannot be verified (`dur`, `evet`) end before any verdict, so they follow the
       speech-only rule of the noise job (open after 200 ms);
     - only within 4 s after a rejection (a crying child cries again) does a new segment wait for its verdict
       instead of opening at 200 ms — and never longer than 1.5 s of speech, then it opens anyway;
     - a tap always interrupts: the microphone / end button is never gated (a dedicated tap-to-interrupt is the
       parked item NOTYA-AYSE-GURULTU-b);
     - model fails to load, worker error, a score error, no Silero, kill switch off → exactly as without a profile.
   - Fish path (dormant, `AYSE_SES_SAGLAYICI=fish`): the same verdict feeds `bargeSayaci` (a rejected voice never
     barges in; after a rejection a new voice waits for its verdict, at most 1.5 s). It needs the Fish Silero opt-in
     (`NEXT_PUBLIC_NOTYA_SILERO=1`) because the frames come from Silero; without it Fish behaves as before.
   - Anonymous counters for tuning: per session, the number of segments accepted / rejected / undecided / too short
     is sent at session end to `/api/asistan/ses-profili-sayac`, which adds them to daily totals per model version
     (`ses_profili_sayaclari`). No audio, no text, no doctor id is stored.
   - Stretch (doctor lines marked in the visit transcript): **not done.** The ElevenLabs transcript arrives as text
     with no per-line audio, so there is nothing to align a match to without new plumbing. Logged as
     NOTYA-SES-PROFILI-c (waits on Claude).

## Model and licence

| | |
|---|---|
| Model | Resemblyzer GE2E speaker encoder (Google's GE2E architecture, 3-layer LSTM 256, 256-d embedding) |
| Licence | Apache-2.0 — commercial use allowed; licence and NOTICE shipped next to the weights (`public/ses-profili/LICENSE-Resemblyzer.txt`, `NOTICE.txt`) |
| Source | PyPI `Resemblyzer==0.1.4`, file `resemblyzer/pretrained.pt` (sha256 `39373b86…f070f134e`); https://github.com/resemble-ai/Resemblyzer |
| Shipped file | `public/ses-profili/ge2e-v1.bin`, 2.85 MB (1,423,616 float16 weights; optimizer state dropped; sha256 `d6f86a46…41ab45e`) — reproducible with `scripts/ses-profili/ge2e-donustur.py` |
| Version tag | `ge2e-v1` (stored with every profile; a profile from another version is ignored) |
| float16 vs float32 | embedding cosine 0.9999992 on real speech |

Why this model: Hugging Face and GitHub are blocked from the build environment and from the app's CSP, so the
weights must be self-hosted; ECAPA / WeSpeaker / CAM++ ONNX models (stronger, ~7–25 MB) could not be fetched here.
Resemblyzer was the commercially licensed speaker encoder available, small enough to commit, and separates speakers
clearly on the test voices below. A stronger model can replace it behind the same `model_surumu` switch
(existing profiles would need re-recording).

## Thresholds (one config: `SES_PROFILI_AYAR`, `lib/asistan/sesProfili/ayar.ts`)

| What | Value |
|------|-------|
| First score after | 800 ms of speech in the segment |
| Re-score every | 300 ms (up to 1.6 s of audio) |
| Accept (`kabul`) | cosine ≥ 0.72 |
| Reject (`red`) | cosine < 0.60 (between = undecided) |
| After a rejection, new segments wait for a verdict | for 4 s, at most 1.5 s of speech each |
| Pre-roll kept before speech | 150 ms |
| Enrolment per sentence | ≥ 2 s voiced, speech RMS ≥ 0.012, ≥ 12 dB over background, ≤ 15 s |

Where the starting values come from (public test recordings in the pocketsphinx source package: one LibriVox
reader, one "cards" speaker, several other speakers; not clinic audio, not Turkish): whole utterances, same speaker
0.75–0.92, different speakers ≤ 0.72. Short segments against a two-utterance profile: at 0.8 s same speaker
0.68–0.87, others ≤ 0.70; at 1.2 s ≥ 0.76 vs ≤ 0.72; at 0.5 s the ranges overlap (hence no verdict before 0.8 s).

## What could not be verified without real voices

- The thresholds on Turkish clinic audio, a real doctor, a crying child, a parent and a television. Starting values
  only; tuning is NOTYA-SES-PROFILI-b (Dr. Gökhan + one more voice), helped by the anonymous counters.
- How often a voice gets `red` while it is the doctor (a hoarse voice, a different microphone than at enrolment).
  The design keeps that cheap: a short word still works, and a rejected doctor can repeat or tap.
- That ElevenLabs has not already interrupted Ayşe during the 200 ms – 0.8 s a non-doctor voice is let through
  before its first verdict (when there was no recent rejection). The resume of the noise job then brings her back
  if no doctor words follow. Only a live test shows how often this happens.
- CPU on older phones with the ElevenLabs session, Silero and the scoring worker together.
- The enrolment UI and microphone capture on iPhone Safari (ScriptProcessor capture, `voiceIsolation`).
- The Cache API keeping the model across sessions on every browser (it falls back to a normal download).

## Consent texts — PENDING LAWYER REVIEW

Both texts (the checkbox line and the full `Ses Profili İçin Açık Rıza Metni`) live in ONE file,
`lib/asistan/sesProfili/rizaMetni.ts`, marked PENDING LAWYER REVIEW in code. The full text is section 11 of `/kvkk`
(anchor `#ses-profili`). The data controller and contact address were taken from the existing /kvkk page:
**Dream Türkiye** and **kvkk@notya.ai**; the lawyer should confirm whether the full trade title must replace
"Dream Türkiye". Review before real doctors see the step: NOTYA-SES-PROFILI-a.

## Before the manual test

Apply `lib/db/migrations/127_doktor_ses_profili.sql` (NOTYA-SES-PROFILI-d). Until then the profile API answers 500,
onboarding shows that the profile could not be saved, and voice sessions run exactly as without a profile.

## Manual test (preview deployment)

Console lines: `[ses-profili]` (profile on / why not), `[ses-kapi]` (gate, `profil: true`), `[ses-kesinti]`.

1. **Enrol.** New doctor account → onboarding step `Ayşe sesinizi tanısın`. Recording is disabled until the
   checkbox is ticked; `Açık rıza metnini oku` opens /kvkk at the consent section in a new tab. Read the four
   sentences; whisper one of them → only that sentence asks to be repeated. Finish → dashboard. Ayarlar › Ses profili
   shows "Ses profiliniz var".
2. **A second person does not interrupt Ayşe.** Start a voice session, ask for a long answer; while Ayşe speaks, a
   second person (or a phone playing speech, or a crying-child recording) talks for a few seconds near the
   microphone. Ayşe keeps talking (if she stops briefly, she resumes within ~1.5 s). Repeat a few times in a row.
3. **The doctor does.** While Ayşe speaks, the enrolled doctor says a full sentence ("Ayşe, bir dakika, şunu
   soracağım"). She stops and answers the doctor.
4. **`dur` still stops her.** While she speaks, the doctor says only "dur". She stops within about half a second.
   Also try it right after the second person spoke (within 4 s): it may need a second "dur" or a longer phrase —
   note how often.
5. **Delete.** Ayarlar › Ses profili › `Ses profilimi sil` → "Ses profiliniz silindi", the page shows "Ses
   profiliniz yok", and in Supabase `select * from doktor_ses_profilleri where doctor_id = '<id>'` returns no row.
   The next voice session logs no `[ses-profili] profil: acik` and behaves as in docs/AYSE-GURULTU.md.

## Files

- Config / engine / matching / quality / consent: `lib/asistan/sesProfili/{ayar,ge2e,eslesme,kalite,rizaMetni,istemci,isci}.ts`
- Tests: `lib/asistan/sesProfili/sesProfili.test.ts` (fixture embeddings, verification and gate logic, Fish barge,
  engine vs reference, enrolment quality, consent text, storage validation)
- UI: `components/sesProfili/SesProfiliKayit.tsx`, `app/onboarding/page.tsx` (step 4),
  `app/dashboard/doktor/ayarlar/ses-profili/page.tsx`, `app/kvkk/page.tsx` (§11)
- API / DB: `app/api/doktor/ses-profili/route.ts`, `app/api/asistan/ses-profili-sayac/route.ts`,
  `lib/db/migrations/127_doktor_ses_profili.sql`
- Wiring: `lib/asistan/elevenKapi.ts`, `lib/asistan/fishVad.ts`, `lib/asistan/fishMikrofon.ts`,
  `lib/asistan/fishSilero.ts`, `components/asistan/AsistanOturumContext.tsx`
