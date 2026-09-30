# ARCH — Fish Audio TTS latency for Ayşe Kaya (2026-09-30)

Goal: bring Fish TTS (Ayşe Kaya, Haberci voice) as close as possible to ElevenLabs Flash v2.5 on
time-to-first-byte, total time and cold start. Baseline measured the same morning from the Mac
(`.denetim-out/olcum-tts-stt.json`, production shape: s2.1-pro, REST, pcm 24 kHz, `latency: low`,
`chunk_length: 160`): Fish TTFB p50 205 ms, total p50 1 225 ms for ~7 s audio (RTF 0.20), cold TTFB
733 ms. ElevenLabs Flash: 176 / 474 (RTF 0.07) / 230.

## 1. Research (what Fish documents, and what others do)

| Question | Answer | Source |
|---|---|---|
| Which models exist on the hosted API? | `s1`, `s2-pro`, `s2.1-pro` (default), `s2.1-pro-free`, `drama-3-preview`. There is **no mini / flash / turbo tier**. | https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech |
| Fastest model? | Not stated per model; `s2.1-pro` is "recommended for production, with improved quality, latency, and throughput". Fish claims ~70–90 ms TTFA server-side at c=1 on H200 (FP8). Our measurement (§2) says s1 and s2-pro answer sooner on Turkish. | https://docs.fish.audio/features/text-to-speech · https://fish.audio/blog/s2-1-pro-free-api/ |
| Free tier | `s2.1-pro-free`: "no TTFA guarantees", Fair-Use throttling, data may be used for training. Measured 2.3× slower (§2). | same blog |
| `latency` | enum `normal` (default, "best quality"), `balanced` ("reduced latency", ~300 ms TTFA per the feature page), `low` ("lowest latency"). | TTS reference · features/text-to-speech |
| `chunk_length` | 100–300 chars, default 300 (feature page says 200). "Smaller values (100–150) generate audio sooner"; `min_chunk_length` 0–100 (default 50); `condition_on_previous_chunks` true. | same |
| Formats | `pcm` "ideal for low-latency playback"; `opus` recommended for streaming bandwidth; sample_rate for pcm 8–48 kHz, opus fixed 48 kHz. | same |
| `normalize` | text normalisation for English/Chinese numbers only — we already spell Turkish numbers ourselves and send `false`. | TTS reference |
| msgpack vs json | msgpack is required only for inline `references` (binary). With `reference_id` JSON is fine; no speed claim either way. | TTS reference |
| WebSocket `/v1/tts/live` | msgpack events `start` (full TTSRequest) → `text`* → `flush`/`stop`; server `audio`/`finish`/`log`. Docs: "one session per connection", closes after `finish`. **No documented idle timeout, keepalive or warm-up practice.** | https://docs.fish.audio/api-reference/endpoint/websocket/tts-live · https://docs.fish.audio/features/realtime-streaming |
| Socket reuse across turns | Pipecat's Fish service keeps **one socket open for the whole call**: `start` once, then `text` + `flush` per turn, reconnecting only on settings change. LiveKit's plugin defaults to `latency: balanced`, `s2.1-pro`. | https://reference-server.pipecat.ai/en/stable/_modules/pipecat/services/fish/tts.html · https://docs.livekit.io/agents/models/tts/fishaudio/ |
| Warm-up | Fish's own latency blog: "Pre-warm by sending a request at app initialization, not when the user first speaks"; TCP+TLS+DNS cost 50–160 ms; route through a CDN. | https://fish.audio/blog/lowest-latency-text-to-speech-api-real-time/ |
| Where is api.fish.audio? | Behind Cloudflare (2606:4700::/32). From the Mac: DNS 3–5 ms, TCP 23 ms, TLS 45–56 ms, gateway 404 in ~150 ms. No regional endpoints are documented; an iad1 function sees the nearest Cloudflare edge, origin location unknown. | `curl -w` in `.denetim-out/fish-optim.out` |
| Plan / queueing | Only the free tier is documented as throttled; paid "SLA and latency commitments" via sales. No concurrency numbers published. | s2.1-pro-free blog |
| Changelog 2026 | Only the S2 launch (March 2026); nothing on latency, regions or chunking. | https://docs.fish.audio/changelog |
| Self-hosted first-chunk latency | fish-speech issue #1020 (self-hosted): first chunk waits for the whole LLAMA text chunk — the same reason small `chunk_length` helps on the hosted API. | https://github.com/fishaudio/fish-speech/issues/1020 |

## 2. Experiment matrix (Mac in Baltimore → api.fish.audio, 100 TTS calls, 0 errors)

Same six Turkish sentences as the morning run. `baseline` = 2 runs, others 1 run per sentence; p50.
Raw rows: `.denetim-out/fish-optim.json` / `.out`. Quality was **not** judged by ear here — WAVs of
sentence 2 are saved for Kaan: `fish-optim-{baseline,model_s2-pro,model_s1,chunk_100}-1.wav`.
Audio durations per sentence were within ±0.5 s across models (no dropped or duplicated content).

| Config (change vs baseline) | n | TTFB ms | total ms | audio s | RTF |
|---|---|---|---|---|---|
| baseline: s2.1-pro, low, chunk 160, pcm 24k | 12 | 235 | 1 519 | 5.9 | 0.26 |
| **model s2-pro** | 6 | **184** | **1 012** | 6.2 | 0.17 |
| **model s1** | 6 | **180** | **926** | 5.8 | 0.16 |
| model s2.1-pro-free | 6 | 523 | 3 281 | 6.5 | 0.51 |
| latency balanced | 6 | 230 | 1 504 | 6.1 | 0.26 |
| latency normal | 6 | 1 656 | 1 790 | 5.9 | 0.29 |
| **chunk_length 100** | 6 | **216** | 1 473 | 6.0 | 0.24 |
| chunk_length 200 | 6 | 227 | 1 562 | 6.1 | 0.26 |
| format opus 48k | 6 | 224 | 1 383 | (ref) | 0.25 |
| sample_rate 44 100 | 6 | 212 | 1 469 | 5.9 | 0.27 |
| temperature 0.3 / top_p 0.5 | 6 | 237 | 1 553 | 6.2 | 0.24 |
| WS, one socket per turn (today's fish-tur shape) | 6 | 286 (+463 handshake) | 1 513 | 6.1 | — |
| **WS, socket already open (`start` once, `text`+`flush` per turn)** | 12 | **211** | 1 344 | 6.7 | 0.21 |

Cold start and idle (one cycle each):

| Case | TTFB ms | note |
|---|---|---|
| REST, fresh undici Agent, no warm-up | 738 | reproduces the morning's 733 |
| REST after `GET /v1/tts` on the same Agent (404 `no_route`, 162 ms, nothing billed) | **214** | = warm |
| REST after a tiny real TTS ("Hm.") on the same Agent | 298 | no better than the GET, and billed |
| WS cold: handshake 463 ms + first audio 289 ms | 752 | today's per-turn path when ASR is faster than the handshake |
| WS socket idle 30 / 60 / 120 s, then a turn | 280 / 230 / 253 | alive; **closed by Fish (1006) before 300 s** |
| REST on the shared Agent after ~9 min idle (keep-alive long expired) | 261 | TLS session resumed from the Agent's cache |
| REST on a brand-new Agent at the same moment (control) | 650 | full TLS handshake again |

Readings:
- The 500 ms "cold start" is the client side of the TLS handshake to Cloudflare plus the first HTTP
  round on a fresh connection, not Fish loading the voice: a GET that never reaches Fish removes it.
- `low` ≈ `balanced`; `normal` must never be used for speech. `chunk_length` 100 buys ~20 ms of first
  audio (sentence-length text is split earlier); `opus`, 44.1 kHz, temperature: no first-audio change.
- Model is the only lever on **total** time: s1 / s2-pro finish 35–40 % sooner (RTF 0.16–0.17 vs
  0.26). s2.1-pro-free is unusable for live speech.
- A socket already open at turn start is worth ~75 ms of first audio on top of the handshake it hides.
  Fish keeps an idle socket for at least 120 s and not for 300 s.

## 3. What was implemented (branch `feat/fish-tts-fast`)

- `lib/asistan/fishSes.ts`: `chunk_length` 160 → **100** (`FISH_PARCA`), `latency` stays `low`
  (`FISH_GECIKME`); model becomes switchable **without a deploy** via `NOTYA_FISH_MODEL`
  (`s2.1-pro` default, `s2-pro`, `s1`; anything else falls back to s2.1-pro). Read per request.
- `lib/asistan/fishWs.ts`: the socket `start` request uses the same constants; model read per socket.
- `lib/asistan/fishWsSunucu.ts`: listeners can be bound after open (`bagla`), socket age (`yas`).
- `lib/asistan/fishWsHavuz.ts` (new): one **pre-opened Fish socket per Node instance**. A turn takes it
  if it is open and younger than 120 s (`FISH_WS_HAVUZ_YAS_MS`), otherwise opens its own as before;
  when a turn ends the next socket is opened at once, so the doctor's next sentence finds a warm one.
- `lib/asistan/fishIsinma.ts` (new): the REST warm-up is one `GET /v1/tts` on the shared keep-alive
  Agent (4 s cap, never throws).
- `app/api/asistan/fish-tur/route.ts`: `{ isit: true, asistanSessionId }` = warm-up call (socket
  pre-open + REST warm-up, JSON reply, same doctor/session auth); the turn path uses the pool and
  logs `havuzdan` in the `[fish-ws]` line; `finally` pre-opens the next socket. `NOTYA_FISH_WS`
  semantics unchanged (`0`/`false`/`off` → REST per sentence, no pool).
- `components/asistan/AsistanOturumContext.tsx`: `fishTurIsit()` fires once the mic is granted
  (`startFishOturumu`, before the greeting), never awaited. The greeting itself (`/fish-ses`) warms
  the REST route's Agent as it always did.
- Tests: `fishWsHavuz.test.ts` (4), `fishIsinma.test.ts` (2), model switch in `fishSes.test.ts`;
  chunk expectation updated in `fishSes.test.ts` / `fishWs.test.ts`. 22/22 pass; `tsc --noEmit`
  shows only the 4 known `klinikPortal.test.ts` errors.

## 4. Expected production numbers (iad1 → Fish, doctor in the US)

- First sentence of a session: warm socket + warm Agent → first audio ≈ 210–260 ms after the first
  words leave Luna, instead of ≈ 730 ms (REST cold) / 750 ms (WS cold) today.
- Every later turn: ≈ 210 ms first audio on s2.1-pro; ≈ 180 ms if Kaan approves s2-pro or s1.
- Total generation for a 6 s sentence: ≈ 1.3–1.5 s on s2.1-pro, ≈ 0.9–1.0 s on s1/s2-pro. In the
  streaming player this is not waiting time: playback starts 40 ms after the first chunk and audio is
  produced 4–6× faster than it plays. Vercel's bandwidth to Cloudflare is far above the Mac's, so the
  transfer part of "total" (≈ 100 ms of the 284 KB at home) should be smaller in production.
- Caveats: Vercel may freeze the instance between turns; a socket opened in `finally` may complete
  its handshake late or be closed — the pool checks `acik()` and age and falls back to a fresh open
  (today's behaviour). The `isit` warm-up reaches one instance; a different instance may serve the
  next turn (rare at beta traffic). Both are logged (`havuzdan`, `[fish-isinma]`).

## 5. What cannot be closed vs ElevenLabs, and why

- **Cold start**: closed (214–260 ms vs ElevenLabs 230 ms).
- **TTFB**: 210 ms (s2.1-pro) / 180 ms (s1, s2-pro) vs 176 ms — within ~35 ms; the rest is that Fish
  sits behind Cloudflare with an unknown origin while ElevenLabs answers from US-East.
- **Total / RTF**: Fish generates 3–4× slower than Flash (RTF 0.16–0.26 vs 0.07). No parameter changes
  this; only the model does, and s2.1-pro is the slowest of the three. For a streamed sentence the
  doctor does not hear this gap; it matters only for barge-in bookkeeping and cost of long answers.
- Not attempted: `opus` (needs an Opus/Ogg decoder in the browser, no first-audio gain), self-hosting
  fish-speech near iad1 (infra project), or Fish's enterprise "latency commitments" (sales).
