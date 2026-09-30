# ARCH — Model tiering by task difficulty (GPT-6 Luna family)

Date 2026-09-30 · analysis only, nothing changed in code · measurement raw data `.denetim-out/_tmp-tier.json` (gitignored)

## 1. Current routing

`lib/ai/modeller.ts` is the single source: every `Gorev` maps to `kademe: 'hizli'` → `hizliModel()` = `NOTYA_MODEL_HIZLI` (default `openai/gpt-6-luna`). Sonnet 5 (`NOTYA_MODEL_GUCLU`) is only the koruyucu behind gates G1 transport / G2 low_conf / G4 breaker. `saglayici.ts` sends **no `reasoning` field at all** → Luna runs at OpenRouter's default effort **medium** on every call, including greetings. Task types and their call sites today (all → `gpt-6-luna`, `maxTokens` in brackets):

| Gorev | Call sites | Nature |
|---|---|---|
| `soap` (8000) | `soapUret.ts` body (A), `noteGenerator.ts` | heavy, JSON |
| `klinik-analiz` (2000) | `soapUret.ts` öneri (B), `konsult`, `not-konsult`, `doz-oner`, `erecete`, `sgk-rapor`, `ilacSonlandir`, `core/lab/yorum`, `dr-ayse/groq` | heavy / medium, mostly JSON |
| `goruntu-inceleme` (12000) | `core/belgeler/yazar` (X-ray & image), `core/lab/cikarim`, `asilar/karne`, ingestion | heavy, multimodal |
| `not-uretimi` (4000) | `noteGenerator.ts` ×9, `sessions/[id]/end` | heavy, JSON |
| `uzman-analiz` (2000) | avukat dilekçe / sözleşme | heavy |
| `sohbet-uzman` (1600) | `ayseCevapla.ts` (default branch of `asistanModelYonlendir`: any patient context, action intent, clinical word, or doubt), avukat/mali chat | mixed: from "Klacid dozu neydi?" to "gözümden kaçan bir şey var mı?" |
| `sohbet` (800) | `ayseCevapla.ts` only when the turn is purely social or an app-usage question | light |
| `cikarim` (500) | `hafiza.ts sohbettenOgren` (per turn, background), `soapUret` style profile, `dosyaOnbellek` | light, JSON |
| `ozet` (300), `siniflandirma` (20), `bicimlendirme`, `kisa-yanit` (300) | `hafiza.ts`, help chat, mali e-devlet | light |

Voice (`fish-tur` → `aiAkis`) and text chat share `ayseCevapla`, so one routing change covers both. Calendar, "dosyasını aç", "son tanısı", most follow-ups (`takipCoz`) are already deterministic (0 LLM calls, 0.3–1.2 s).

## 2. What "Luna None" is on OpenRouter

`GET /api/v1/models` (fetched today): `openai/gpt-6-luna` and `openai/gpt-6-luna-pro` both list `supported_parameters` = `reasoning, reasoning_effort, tools, tool_choice, structured_outputs, …` and reasoning efforts **max · xhigh · high · medium · low · none, default medium**. There is **no `:none` model id** — "Luna None" is `openai/gpt-6-luna` + body `reasoning: { effort: "none" }` (or OpenAI-style `reasoning_effort: "none"`; "minimal" is not listed). Pricing is identical for both: **$0.10 / 1M prompt, $0.50 / 1M completion** (`:batch` variants half price, not usable for live turns). Verified live: with `effort: none` the response carries `reasoning_tokens: 0`; default Luna spent 63–139 reasoning tokens per short turn, Luna-Pro 201–435. Luna-Pro also reports ~3× prompt tokens for the same payload (20.3k vs 6.2k) — same unit price, ~2.5–3× the cost per call.

## 3. Measurement (7 prompts × 3 configs, streamed, same production payload from `ayseCevapla`, Dr. Gökhan's read-only account, Sonnet disabled)

Prompts: 4 conversational (günaydın · "kısa tut, seninle nasıl çalışırım" · teşekkürler · "sesli kullanımda seni nasıl uyandırırım") + 3 chart Q&A on Ayşe Yeşil (Klacid dozu · annesinin boyu · plus the per-turn `cikarim` memory call). Two chart prompts (ilaçlar+dozlar, aşılar tam mı) and the SOAP run were lost to a harness bug (the three replays shared `cagir.ts`'s 25 s abort signal → 504) and the retries consumed the 40-call cap.

| config | n | TTFT p50 | total p50 | output tok p50 | reasoning tok p50 | cost (7 calls) |
|---|---|---|---|---|---|---|
| `gpt-6-luna` default (today) | 7 | **2.1 s** | 2.3 s | 111 | 86 | $0.0034 |
| `gpt-6-luna` effort **none** | 7 | **1.1 s** | 1.7 s | 33 | 0 | $0.0035 |
| `gpt-6-luna-pro` default | 7 | **5.2 s** | 5.3 s | 428 | 299 | $0.0086 |

Quality, per answer (all three configs): greeting ✓/✓/✓ (Pro said "Sen nasılsın?" — informal, persona slip); workflow question ✓/✓/✓; teşekkür ✓/✓ (None: terse "İyi çalışmalar Hocam.")/✓; wake-word question ✓/✓/✓; Klacid dose — all three "5 mL sabah-akşam, 14 gün, konsantrasyon dosyada yok" ✓; mother's height 172 cm ✓/✓/✓; `cikarim` memory: Luna and Pro `{"kayitlar":[]}`, None extracted a legitimate "kısa yanıt ister" preference from the previous turn (arguably better). **Observed difference**: None returned plain text instead of the `{"speech":…}` JSON envelope in 4/7 answers (Luna 1/7, Pro 0/7); `asistanYanitiCoz` accepts plain text as speech, so nothing broke, but a None tier must keep `jsonBekleniyor: false` and must not be used where JSON is parsed. No tool-call turn was in the sample — tool calling on effort none is **unverified** (parameter is advertised as supported).

Heavy task (SOAP from a real 4.3k-char transcript, Luna vs Luna-Pro): **not measured** — the run aborted (harness signal bug, above) and the 40-call cap left no room. Zero-cost substitute: `ai_hiz_olcum` / `v_hiz_gunluk` already stores `gorev=soap sure_ms` per note; Luna-Pro on 09-27 (LUNAPRO-01 runs) was removed by Kaan for latency, and today's light-prompt ratio (≈2.3× total time, ≈4× output tokens) is the expected order for SOAP too.

## 4. Proposed routing

| Tier | Model + effort | Expected latency | Task types |
|---|---|---|---|
| **deterministic** | none | 0.3–1 s | calendar, dosya aç, takip resolver, aşı kartı, son tanı — unchanged |
| **luna-none** | `gpt-6-luna`, `effort: none`, `jsonBekleniyor: false` | TTFT ≈1 s, total ≈1.7 s | `sohbet` (social / app usage), `sohbet-uzman` turns whose `sonNiyet` ∈ {hasta-dosya, reçete, tahlil, aşı, büyüme, yaş, genel} with a single-field question (≤ 12 words, no action intent, no tools), `kisa-yanit`, `ozet`, `siniflandirma`, `bicimlendirme`, `cikarim` |
| **luna** | `gpt-6-luna`, `effort: low` (or default medium) | TTFT ≈2 s | remaining `sohbet-uzman` (open questions: "neler değişmiş", "gözümden kaçan", multi-entity), tool-call turns (`araclar.length > 0`), `klinik-analiz` quick paths (doz-oner, lab yorum), `not-uretimi` |
| **luna-pro** | `gpt-6-luna-pro`, default (medium) | 2–3× luna, background only | `soap` body + öneri, `goruntu-inceleme` (X-ray, karne, lab PDF), epikriz/konsult/e-reçete/SGK (`klinik-analiz` with `jsonBekleniyor`), `uzman-analiz`, long-file summaries (input > ~20k tokens) |

Config change: add `NOTYA_MODEL_DERIN` (default `openai/gpt-6-luna-pro`) and `derinModel()` in `modeller.ts`; extend `Kademe` with `'derin'` and `GOREV_POLITIKASI` with a per-task `effort?: 'none'|'low'|'medium'`; `saglayici.openRouterGovdesi` emits `reasoning: { effort }` when set (only for `openai/*`). `NOTYA_MODEL_HIZLI` stays `openai/gpt-6-luna`; kill-switch `NOTYA_TIER_KAPALI=1` → everything back to today's single tier. Per-turn tier pick in `ayseCevapla` (after `asistanModelYonlendir`): `tierSec({ gorev, sonNiyet, kelimeSayisi, araclar, girdiToken })` — heavy keywords (`muayene raporu|epikriz|SOAP|özetle|değerlendir|röntgen|görüntü|etkileşim|ayırıcı tanı`) or `araclar.length` or input > 20k tokens → luna; otherwise if `gorev === 'sohbet'` or (`sonNiyet` single-slot and ≤ 12 words) → luna-none; else luna. Heavy `Gorev`s never enter the chat tiers. Fallback chain (inside `cagir.ts`, before G2): luna-none → empty / < 3 words / refusal / broken JSON → **retry same payload on luna** (one hop, logged `neden=tier_up`) → then the existing G1/G2 → Sonnet. Voice path (`aiAkis`) uses the same pick; a tier-up is allowed only before the first spoken word, as G2 already is.

Risks: (a) effort none drops the JSON envelope more often — keep it out of every `jsonBekleniyor` / tool path until a tool-call sample is measured; (b) Turkish quality was intact in 7/7 but answers get terse ("İyi çalışmalar Hocam.") — acceptable for social turns, watch the Ayşe standard audit (`sorular-100`) for regressions in `sohbet-uzman`; (c) Luna-Pro's 5 s TTFT is fine for SOAP / görüntü (already background, 25–60 s budget, `lunaZamanAsimiMs` unchanged) but must never reach a live voice turn; (d) ~3× cost on the heavy tier — still cents per note; (e) `hafiza` `cikarim` on None extracted a preference the others skipped — verify precision before shipping it there.

## 5. Recommendation

Ship a three-tier split with one env var and one field: `reasoning.effort = none` for social turns, single-slot chart follow-ups and all background light tasks (halves TTFT to ~1 s and total to ~1.7 s at the same price, with correct answers on every sampled question), Luna default/low for the rest of chat and every tool-call turn, and `gpt-6-luna-pro` only for background heavy work (SOAP, görüntü, epikriz, long summaries) where its 2–3× latency is invisible and its extra reasoning is worth ~3× a sub-cent call. Gate it behind a kill-switch, re-run `sorular-100` + `sorular-takip` before enabling luna-none on `sohbet-uzman`, and measure the SOAP Luna vs Luna-Pro pair from `v_hiz_gunluk` once Pro is on for `soap`.
