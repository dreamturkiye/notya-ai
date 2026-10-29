# Ses Omurgası v2: Ayşe's voice and text assistant

Kaan ordered and signed off this rebuild on 2026-10-29. The binding contract and the **founder lock** are in
`.cursor/rules/ses-omurga-kilidi.mdc`: no change of any size without Kaan's written "go". This document explains what
each part does and why. The evidence behind it is the forensic diagnosis of Dr. Gökhan's 10-25 / 10-26 sessions and
the ElevenLabs research (both in the job brief).

We still use ElevenLabs Agents (ASR, turn-taking, TTS) and our own Custom LLM endpoint (the brain). The platform did
not change. What changed is how our endpoint handles turns, routes questions, treats noise, speaks and writes state.

## 1. Architecture

```
 BROWSER  /asistan  (components/asistan/AsistanOturumContext.tsx)
   │ GET /api/asistan/signed-url  ── iad1 ──► Supabase (doctor-scoped session, ownership)
   │      ├─ voice token  {doctor, session, patient, persona, tz, c = call id}   (HMAC, lib/asistan/sesJetonu.ts)
   │      ├─ agent pin: TTS lock + turn/ASR/skip_turn/cascade/overrides        (lib/asistan/sesMotoru.ts)
   │      ├─ WebRTC conversation token (fallback: signed WebSocket URL)
   │      └─ ASR keywords ≤ 50: Ayşe/Hocam, open patient name, meds, diagnoses, common pediatric drugs
   │ Conversation.startSession({ conversationToken, connectionType:'webrtc',
   │      overrides:{ prompt, language:'tr', voiceId, asr.keywords }, customLlmExtraBody:{ notya_jeton } })
   │ mic gate (Silero+RMS, 160 ms) only on the WebSocket fallback; WebRTC AEC/NS covers echo
   │ poll GET /api/asistan/ses-ekran every 500 ms (windowed RPC, 30 s auth memo, volume log)
   ▼
 ELEVENLABS AGENT  turn_v3 · eagerness normal · turn_timeout 15 s · soft timeout 3 s "Hmm, Hocam..."
   │              scribe_realtime (tr) · Flash v2.5 TTS · cascade_timeout 10 s · NO hosted backup LLM
   │ POST /api/asistan/ses-llm/v1/chat/completions  (secret + token)       ── iad1 ──
   ▼
 sesLlmPost  (lib/asistan/sesLlm.ts)
   0. role chunk out immediately (first byte ≈ ms)
   1. model-free exits: tool result · [kesinti-devam] · veda/end_call · own greeting → skip · [devam]
   2. sesOnKapisi: pause / filler / scrap / ECHO of ElevenLabs' last assistant line → skip_turn   (no DB, no model)
   3. sesTuruKarsila (in-memory, per instance): kopya → serve shared stream │ ustune/birlesik → abort old │ yeni
   4. ses_turu_ac_v2 RPC (ONE round trip): turn registry + seq, history window (60), profile, prefs,
      token/open-patient ownership, chart version stamps
   5. sesTurKapisi (el:true): background speech → skip; veda; else brain
   6. sesliKarariUygula (spoken Evet/Hayır on a pending card) │ klinikCevapla │ ayseCevapla(kanal 'ses')
      └─ speech deltas → elevenMetni (Turkish number/dose normalization) → SesYayKapisi → SSE
   7. guards: 7 s holding sentence if nothing said · 22 s turn close (rest via [devam]) · abort on supersede
   8. close: buffer "... " only if nothing was said and no skip_turn · [DONE]
   9. after the stream (waitUntil): asistan_gecmis_ekle (append, seq-checked) · actions · learning · ses_tur_olcum
   ▼
 ayseCevapla  (lib/asistan/ayseCevapla.ts) — the ONE brain for voice and text
   routers: kapsam → takvim → (pause) → kimlik → oku (stored text verbatim) → patient resolution
            → record tables → quick card / search sentence → MODEL
   v2: escape hatch (rejection / repeated voice question → no fast path), general medical question ≠ open chart,
       action-status ≠ data field, Turkish-folded matchers, no write tool on questions, voice = read tools only
   model: aiAkis (lib/ai/cagir.ts) → OpenRouter (session_id, abort signal) → GPT-6 Luna (voice effort low)
   chart: dosyaPaketOnbellekli — in-process LRU keyed (doctor, patient), valid while hasta_dosya_surum is unchanged
```

## 2. Turn state machine

The key is **call id** (`c` in the voice token, one per signed-url) plus **turn position** (the number of user lines in
ElevenLabs' `messages`). ElevenLabs sends no conversation id to a Custom LLM, so the call id stands in for it.

| Incoming POST (same call) | Previous request | Decision | Effect |
|---|---|---|---|
| same turn, same text | answering, or answered < 120 s ago | **kopya** | stream the first request's deltas (what exists, then live); no brain, no DB |
| same turn, different text | answering | **ustune** | abort the old model call, drop its unspoken output, answer the newest text |
| turn + 1 | answering, has said nothing, < 6 s old | **birlesik** | one utterance split in two: abort the old one, answer the merged text |
| turn + 1 (or more) | anything else | **yeni** | new brain; an older in-flight turn finishes for the screen only |
| any | another instance answered exactly this turn | **kopya (db)** | replay the spoken text stored with the turn |

Database side (`ses_turu_ac_v2`, migration 183): `active_context.sesTur = {cagri, tur, seq, anahtar, durum, soz,
turlar{tur→latest seq}}`. Every brain run bumps `seq`. `asistan_gecmis_ekle` refuses a voice write whose seq is not
the latest for its turn, so only the request ElevenLabs actually plays reaches the history.

Turns that never reach the brain: an empty transcript, a pause / filler ("...", "eee", "hmm", "şey"), a sub-lexical
scrap, Ayşe's own last line coming back through the microphone, the opening greeting echo, and background speech.
Each is answered with `skip_turn`, or with `"... "` when the agent offers no skip_turn. A response is never
whitespace-only.

## 3. Latency budget (end of doctor speech → first audio)

| Stage | Budget | Owner | Notes |
|---|---|---|---|
| Endpointing + ASR final | 200–400 ms | ElevenLabs (turn_v3, scribe_realtime) | turn_timeout 15 s stops the "..." prompts while a doctor thinks |
| Network EL → Vercel | 30–80 ms | iad1 pin | the runtime was cle1 while vercel.json said fra1 |
| Route to first byte | < 10 ms (CI bound 300 ms) | sesLlm | role chunk before any I/O |
| One DB round trip | 110–190 ms | ses_turu_ac_v2 | was 6–9 sequential round trips |
| Chart | 0 ms on a cache hit | versioned LRU | was ~24 queries + decrypt every turn |
| Model-free answer | ≈ 0.2–0.3 s server | routers | was p50 1.47 s (session write before speech) |
| Model TTFT | 0.4–1.5 s | GPT-6 Luna, effort low, read tools only, stable prefix + session_id | measured per turn (`model_ttft_ms`) |
| First sentence | short (≤ 8–10 words, prompt rule) | SesAkisi releases the first finished sentence at once | |
| TTS first audio | ~75–150 ms | Flash v2.5 | |
| Silence guard | 3 s EL soft-timeout filler; 7 s neutral sentence; cascade 10 s | | no hosted backup LLM |

Every voice turn writes one `ses_tur_olcum` row and one `[ses-llm/tur]` log line: call, turn, seq, decision, route,
first byte, first speech, model TTFT, tools, total and region. The ses-ekran poll logs its volume once a minute per
instance (`[ses-ekran/hacim]`).

## 4. Components and why

| Component | Why |
|---|---|
| `sesTurYoneticisi.ts` | Replaces the lock-loser design: 43% duplicate POSTs, 3 brains on one utterance, 12–13 s silent losers. |
| `ses_turu_ac_v2` | One round trip instead of 6–9. Also the cross-instance turn registry. |
| `asistan_gecmis_ekle` / `oturumYaz.ts` | Overlapping writers dropped turns (whole-array rewrite of a turn-start copy). History was cut at 20. |
| `asistan_oturum_pencere` | The 500 ms poll read the whole history plus an auth call, twice a second. |
| `sesOnKapisi` | 9 of 10 doctor turns in one session were "..." and each got model chatter. |
| `soruNiyeti.ts` + router changes | `/\basi/` matched "asit"; "Aşı hocam" is the ASR's "Ayşe Hocam"; a chart open made every question a chart question; "rica ediyorum" forced a vaccine-add tool. |
| Escape hatch | A rephrased question could not get out of the same wrong card (4× on 10-26). |
| `konusma.ts` (cap 12, lists, oku) | The doctor asked 4× in two sessions to hear what was written. |
| `dosyaOnbellek.ts` + `hasta_dosya_surum` | 0 of 111 turns used a cached chart. Triggers on every table the package reads invalidate it. |
| Deferred writes | The session write ran before the sentence was spoken. |
| Voice tool set | 23 tool schemas on most turns; a question never needs a write tool. |
| `sesMotoru.ts` agent pin | Dashboard drift. Turn, ASR, skip_turn and cascade were not set in code. |
| WebRTC | Browser echo cancellation and noise suppression (smoke-alarm and speaker-echo incidents). The 200 ms mic gate clipped barge-in starts. |
| `iad1` | Supabase is us-east-1. |
| `cikarim` 2400 tokens | 47% of learning calls were cut, which degraded the memory block in every prompt. |

## 5. Countries

The six country builds (`release/us, gb, ca, au, nz, uz`) have their own stateless mouth (`lib/ulke/asistan/sunucu.ts`)
with no Turkish brain and no patient data. They take the same turn rules: call + turn position, supersede and abort,
duplicate serving, the noise / echo gate, skip_turn or the buffer chunk (never whitespace), the first chunk at once,
spoken = written, the agent pin in each country's language, and WebRTC where the country client uses the shared
context. Per-country details are in each branch's `docs/OPEN-COMMITMENTS.md` entry SES-OMURGA-V2.
