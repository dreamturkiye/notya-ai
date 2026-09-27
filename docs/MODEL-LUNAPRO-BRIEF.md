# NOTYA-MODEL-LUNAPRO-01 — Luna-Pro primary for ALL tasks, Sonnet 5 guardian via four gates (Kaan, 2026-09-27)

Repo: /Users/kaan/notya-model, branch feat/model-luna-all. The worktree holds UNCOMMITTED work from the earlier NOTYA-MODEL-LUNA-02 brief (docs/MODEL-LUNA-02-BRIEF.md; 28 changed files; never tested to green). Start by `git diff --stat`, read that brief, read lib/ai/modeller.ts, lib/ai/cagir.ts, lib/ai/saglayici.ts, lib/ai/kullanim.ts, their tests, lib/doktor/soapUret.ts (NOT-HIZ-03: calls A/B, ai_confidence), lib/asistan/sesLlm.ts, .cursor/skills/ai-model-politikasi/SKILL.md, docs/OPEN-COMMITMENTS.md. Then REBASE the work onto origin/main first (main moved: NOT-HIZ-01..03, SAYFA-HASTA, SES-*) — resolve conflicts keeping main's behaviour outside lib/ai.
Do NOT push. Do not deploy. Commit when green. Report to /tmp/lunapro-report.md. Do not touch app/api/doktor/seans-paketi.

## Decision (Kaan, 2026-09-27) — supersedes decision A and LUNA-02
- PRIMARY (NOTYA_MODEL_HIZLI, MODEL_HIZLI default) = 'openai/gpt-6-luna-pro' for EVERY gorev: soap, not-uretimi, klinik-analiz, goruntu-inceleme, uzman-analiz, sohbet-uzman and all hizli tasks. Images/PDFs too (the model supports file+image input; the cagir.ts image/PDF lift to GÜÇLÜ is retired).
- GUARDIAN (NOTYA_MODEL_GUCLU, MODEL_GUCLU default) = 'anthropic/claude-sonnet-5', reachable ONLY through the gates below. Both via OpenRouter (OPENROUTER_API_KEY set in Vercel); Anthropic direct SDK only when the key is unset (tests). provider.data_collection=deny stays. Never gpt-5.6-luna*, claude-sonnet-4.x as defaults. Slugs only in modeller.ts (+ saglayici prefix logic); model-sizmasi.test.ts must also reject 'luna-pro' strings elsewhere.
- Env kill switch documented: NOTYA_MODEL_HIZLI=anthropic/claude-sonnet-5 reverts everything in one redeploy.

## Four gates (all in lib/ai/cagir.ts / modeller.ts; every fallback records neden in ai_token_kullanim)
G1 transport (exists, keep): 5xx / 25 s timeout / network / empty body / 429 after one retry → primary once more after 400 ms → guardian. neden='transport'.
G2 quality (extend the existing low_conf gate): after a primary response, fall back to the guardian — at most ONCE per request — when:
   (a) content empty/whitespace; (b) refusal (existing detector); (c) low-confidence phrasing (existing dusukGuvenMi);
   (d) NEW for structured tasks (gorev in soap, klinik-analiz, lab tasks, karne/görüntü reading, any caller that passes `yapilandirilmis: true` or `jsonBekleniyor: true` — add an opt-in flag to the aiCagir input): JSON cannot be parsed AND cannot be salvaged by the existing F3 salvage, OR the response was cut at max_tokens (stop_reason length / kesildi);
   (e) NEW tool use: a tool_call with an unknown tool name or invalid JSON arguments;
   (f) NEW SOAP body: ai_confidence < 0.6 in call A → re-run call A on the guardian (soapUret.ts; keep the note-timing design: this only happens when the primary clearly failed; do NOT re-run on the guardian for a merely long answer).
   Voice streaming (aiAkis): fall back only when the primary fails BEFORE the first text delta (transport or immediate empty/refusal). After the first delta, a mid-stream failure ends the stream normally and the existing DEVAMI_EKRANDA/continuation path handles it — never re-speak. neden='low_conf' for (a)-(f); log the sub-reason as a short code in the console line (no prompt/hasta text).
G3 safety (exists, keep): guvenlikSinyaliVar(message or dossier context) → guardian BEFORE the call, neden='safety'. Keep the current signal list.
G4 circuit breaker (NEW, lib/ai/devre.ts): in-process sliding window per model: if the primary produced ≥5 G1/G2 failures within 5 minutes, route ALL calls to the guardian for 10 minutes (neden='devre'), then half-open: one probe call on the primary; success closes the breaker, failure re-opens it. No external store (Vercel instances are independent; document that). Exported helpers for tests: devreDurumu(), devreSifirla().
Remove the gorev-based ('uzman'), onayla-based ('onayla') and vision-based ('vision') forced escalations: gorevNedeni() returns null for all gorevs; GOREV_POLITIKASI kademe='hizli' for every gorev (keep maxTokens); comment that kademe now means primary vs guardian.

## Observability
- ai_token_kullanim rows: model, kademe, neden (transport | low_conf | safety | devre | null). Extend migration only if a value is constrained; otherwise none.
- New SQL view (migration 106, additive): v_model_yedek_gunluk — per day, per gorev: total calls, calls on guardian, share; plus per-neden counts. Write the migration file; do NOT apply.
- Console line on every fallback with request id, gorev, neden, sub-reason — no content.

## Docs
- .cursor/skills/ai-model-politikasi/SKILL.md rewritten: Luna-Pro primary for all; Sonnet 5 guardian via G1–G4; kill switch; fallback share is the metric (target < 15%).
- lib/ai/modeller.ts header updated.
- docs/OPEN-COMMITMENTS.md: NOTYA-MODEL-LUNAPRO-01 DONE (kod): decision, gates, what was retired (LUNA-01 non-negotiable 3, decision A), rollout gate (smoke → note timing → İlk 10 audit vs Sonnet 59/61 → Dr. Gökhan Monday), waits: migration 106 apply + live audit (Claude).

## Tests (npm test fully green; tsc only the 4 known klinikPortal errors)
- model-sizmasi: slugs incl. 'luna-pro' only in allowed files; forbidden defaults absent.
- modeller: every gorev → hizli primary; gorevNedeni null everywhere; yonlendir unchanged.
- cagir/saglayici: G1 sequences (500→200; 500,500→guardian; empty→guardian); G2 (d) unparseable JSON → guardian, cut at max_tokens → guardian, salvageable JSON → NO fallback; G2 (e) bad tool call → guardian; G2 (f) ai_confidence 0.4 → guardian re-run, 0.9 → none; safety → guardian pre-call; image → PRIMARY (flip the old 'image forces GÜÇLÜ' tests); streaming: failure before first delta → guardian, failure after → no re-run.
- devre: 5 failures/5 min opens; open routes to guardian with neden='devre'; half-open probe closes/re-opens; time controlled by an injectable clock.
- Existing: F3, karne, görüntü, brans-alan-sizmasi, KD/derm/dahiliye/göz locks, tekBeyin (Anthropic path when key unset), soapUret/NOT-HIZ tests, asiRotalari + konsultasyon route tests updated to the new primary via dogrudanModelAdi(hizliModel()).
