# NOTYA-MODEL-LUNA-02 — Luna for ALL tasks, Sonnet 5 only as fallback (Kaan, 2026-09-26, supersedes decision A)

Repo: /Users/kaan/notya-model (worktree, branch feat/model-luna-all, base origin/main which already contains NOTYA-MODEL-LUNA-01: lib/ai/modeller.ts, lib/ai/saglayici.ts, lib/ai/cagir.ts, tests, .cursor/skills/ai-model-politikasi/SKILL.md). Read those first plus docs/OPEN-COMMITMENTS.md rows NOTYA-MODEL-LUNA-01..04.
Do NOT push. Do not deploy. Commit when green. Report to /tmp/luna-all-report.md. Do not touch app/api/doktor/seans-paketi.

## Decision (Kaan, "go" with safety escalation kept)
- PRIMARY for every gorev = HIZLI model (openai/gpt-6-luna): soap, not-uretimi, klinik-analiz, goruntu-inceleme, uzman-analiz, sohbet-uzman and all existing hizli tasks. Images and PDFs go to Luna too (it supports image + file input).
- Sonnet 5 (GÜÇLÜ) is used ONLY as fallback, in exactly three cases:
  1. transport — 5xx / timeout / empty body / 429 after one retry / network error (keep the existing Luna → 400 ms → Luna → Sonnet 5 sequence, neden='transport').
  2. quality — Luna returns empty content, a refusal, or a low-confidence signal (existing dusukGuvenMi / empty detection), neden='low_conf'. For streaming (voice) keep the existing rule: only empty/refused streams escalate.
  3. safety — guvenlikSinyaliVar(message or dossier context) is true → Sonnet 5 chosen BEFORE the call, neden='safety'. Keep the current signal list; do not widen or narrow it.
- REMOVE the gorev-based ('uzman'), onayla-based ('onayla') and vision-based ('vision') forced escalations. gorevNedeni(gorev) returns null for every gorev. The cagir.ts image/PDF lift to GÜÇLÜ is removed (record this in the policy: non-negotiable 3 of LUNA-01 is retired by Kaan on 2026-09-26).
- Keep: modelSec(gorev), gucluModel(), hizliModel(), asistanModelYonlendir() (routing to sohbet-uzman still matters for prompts/maxTokens, just not for the model), the kill switch via NOTYA_MODEL_HIZLI / NOTYA_MODEL_GUCLU, OpenRouter for both, data_collection=deny, slug-leak test, usage rows with kademe/neden.
- GOREV_POLITIKASI: set kademe: 'hizli' for the clinical gorevs; keep each gorev's maxTokens. Add a comment explaining kademe now means "which model is primary" and that guclu only remains reachable through the three fallbacks.

## Tests
- Update modeller.test.ts / cagir.test.ts / saglayici.test.ts: image and PDF now go to Luna (primary) — flip the "image still GÜÇLÜ" tests to "image goes to HIZLI"; add "safety signal → GÜÇLÜ before the call, neden=safety"; keep "Luna 500 then 200", "Luna 500 twice then Sonnet", "Luna 200 empty then Sonnet"; add "clinical gorev (soap, sohbet-uzman) → HIZLI primary".
- lib/asi/asiRotalari.test.ts and lib/doktor/konsultasyon-taslak-rota.test.ts currently assert the request carried the GÜÇLÜ model — update to the new primary (dogrudanModelAdi(hizliModel())) and keep what they actually check.
- F3 (truncated JSON not shown raw) must still pass. tekBeyin.test.ts must still pass with OPENROUTER_API_KEY unset.
- npx tsc --noEmit (only the 4 known klinikPortal errors); npm test fully green.

## Docs
- .cursor/skills/ai-model-politikasi/SKILL.md: rewrite to "Luna primary for all; Sonnet 5 = transport / quality / safety fallback only"; note the kill switch and that the ~15% Sonnet budget target is now an upper bound for fallback share.
- lib/ai/modeller.ts header comment updated.
- docs/OPEN-COMMITMENTS.md: row NOTYA-MODEL-LUNA-02 DONE (kod) — Kaan's decision, the three fallbacks, what was retired; note that the live Luna audit (İlk 10 + trap fixtures) runs on production with the QA account right after deploy (waits on Claude) and that the key is not in .env.local so no local pre-merge audit was possible.
