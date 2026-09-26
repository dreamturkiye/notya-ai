# NOTYA-MODEL-LUNA-01 — LLM stack switch (Kaan, 2026-09-26). DECISION A.

Repo: /Users/kaan/notya-model (worktree, branch feat/model-luna, base origin/main). Read docs/SITE-MAP.md, lib/ai/modeller.ts, lib/ai/cagir.ts, lib/ai/cagir.test.ts, lib/ai/modeller.test.ts, lib/ai/model-sizmasi.test.ts (if present), .cursor/skills/ai-model-politikasi/SKILL.md, .env.example first.
Do NOT push. Do not deploy. Commit when green. Report to /tmp/model-report.md. Do not touch app/api/doktor/seans-paketi (pre-existing test failures may exist there; ignore). Turkish is the product language; code comments may be Turkish.

Kaan's two additions to the spec below:
- Option A only: HIZLI → Luna, GÜÇLÜ → Sonnet 5. Do NOT move sohbet-uzman or any clinical gorev to Luna.
- BOTH models go through OpenRouter for payment. Anthropic direct SDK path only when OPENROUTER_API_KEY is unset (fallback for local/dev), exactly as the spec says.
- Add an env kill switch documented in .env.example: NOTYA_MODEL_HIZLI / NOTYA_MODEL_GUCLU already exist via ortamModeli() — that is the switch; document in the policy that setting NOTYA_MODEL_HIZLI=anthropic/claude-haiku-4.5 reverts.
- OpenRouter privacy: send the OpenRouter `provider` preference so that only providers with no data retention / no training are used (provider: { data_collection: "deny" }) — verify the exact field name in the OpenRouter docs and add it; note in the report.

──────────────── SPEC (verbatim from Kaan) ────────────────
OUTCOME
In repo dreamturkiye/notya-ai, switch the live LLM stack to:
  DEFAULT   openai/gpt-6-luna              (OpenRouter)
  ESCALATE  anthropic/claude-sonnet-5      (OpenRouter; Anthropic direct only if OpenRouter is unset)
Ship working code + tests + policy text. Then stop.

WHY
Volume traffic is cheaper on GPT-6 Luna. Signed clinical output stays on Sonnet 5. Transport failure and clinical risk are two different gates. OpenRouter `models: []` is only the transport gate.
This replaces the 2026-09-19 default (GÜÇLÜ = claude-sonnet-4-6, HIZLI = claude-haiku-4-5-20251001). Dated decision: 2026-09-26.

NON-NEGOTIABLES
1. Model slugs live only in lib/ai/modeller.ts (and the new provider helper if it must know prefixes). app/, other lib/, core/ must not contain raw slugs. model-sizmasi.test.ts must fail if they appear.
2. Keep modelSec(gorev), gucluModel(), hizliModel(), asistanModelYonlendir().
3. Image or PDF in the message still forces GÜÇLÜ before the HTTP call (existing cagir.ts lift). Do not remove it.
4. Ham asistan metni still never goes to the hasta. F3 still holds: truncated JSON is not shown raw to the doctor.
5. Do not change ElevenLabs, Groq, Deepgram, billing, or KVKK residency. OpenRouter leaving Turkey is out of scope; do not pretend this switch fixes it.
6. Never select gpt-5.6-luna, claude-sonnet-4.5, or claude-sonnet-4-6 as the new default.
7. Do not invent extra tiers (no Terra, no Luna Pro unless an env override already exists).

DEFAULTS
lib/ai/modeller.ts:
  MODEL_HIZLI = 'openai/gpt-6-luna'
  MODEL_GUCLU = 'anthropic/claude-sonnet-5'
Keep ortamModeli(): NOTYA_MODEL_HIZLI, NOTYA_MODEL_GUCLU
Add to .env.example only:
  OPENROUTER_API_KEY=
  OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
  NOTYA_OPENROUTER_APP_TITLE=Notya AI
  NOTYA_OPENROUTER_APP_URL=https://notya.ai

TWO GATES
A. Transport — Luna cannot answer
   5xx, timeout, empty body, 429 after one retry, network error.
   Luna → 400ms → Luna once → Sonnet 5.
   reason = 'transport'
   OpenRouter may send model openai/gpt-6-luna and models ["anthropic/claude-sonnet-5"]. That array is not the quality router.
B. Quality — pick Sonnet 5 before the call
   reason ∈ onayla | safety | vision | low_conf | uzman
   Sonnet 5 when any of these is true:
   - gorev ∈ soap | not-uretimi | klinik-analiz | goruntu-inceleme | uzman-analiz | sohbet-uzman
   - image/PDF block present
   - hekim Onayla path (SOAP, reçete, ICD klinik eşleme, epikriz, konsültasyon özeti)
   - safety: gebe, emzirme, pediatri doz, warfarin/NSAID, isotretinoin, kontrendikasyon
   - Luna empty, refuses, or signals low confidence / "daha fazla bilgi şart"
   - conflicting labs vs şikayet
   - hasta-facing text beyond a reminder
   - action intent CREATE_PATIENT | ADD_COMPLAINT | REQUEST_DIAGNOSIS | ADD_PRESCRIPTION | GENERATE_DOCUMENT
   Luna only for the existing HIZLI list:
   sohbet (net sosyal / uygulama), siniflandirma without image, ozet/cikarim that do not interpret clinical data, bicimlendirme, kisa-yanit, portal hatırlatma / aşı-damla copy / ev günlüğü paraphrase labeled "hasta girdi", branş/intent first pass.
   Unsure → Sonnet 5. asistanModelYonlendir stays: hasta bağlamı, klinik sinyal, eylem → sohbet-uzman.

PROVIDER
Add one helper used by lib/ai/cagir.ts (new file lib/ai/saglayici.ts is fine).
complete({ model, messages, maxTokens, tools?, cache? })
- model openai/* or anthropic/* + OPENROUTER_API_KEY set → OpenRouter chat completions. Headers: Authorization, HTTP-Referer, X-Title.
- else if anthropic/* → existing Anthropic SDK path.
- Map usage into ai_token_kullanim: tokens, cache, model, kademe, gorev, doctor_id, reason. Never log prompt or hasta text.
- Keep the cache split: fixed system (persona, branş kilidi, rules) cacheable; hasta context not in the cached block. Use OpenRouter's cache mechanism; do not drop the split because the header name changed.
- Streaming: aiAkis (voice path) must keep working through OpenRouter (SSE chat.completions stream → the same text-delta callback). Tool use (hasta_bul etc.) must keep working: translate Anthropic tool_use/tool_result blocks ↔ OpenAI tool_calls/tool messages. Existing callers keep the Anthropic.Message shape — translate OpenRouter responses back into it.

DOCS
Rewrite .cursor/skills/ai-model-politikasi/SKILL.md to this policy.
Update the header comment in lib/ai/modeller.ts.
docs/OPEN-COMMITMENTS.md: add 2026-09-26 row: Luna default, Sonnet 5 escalate, ~15% Sonnet budget target, decision A (clinical stays on Sonnet), revisit later (option B: sohbet-uzman → Luna with safety escalation) — waits on Kaan.
Do not weaken branş-alan-sızması or hasta-izolasyon.

VERIFY AS YOU BUILD
After modeller.ts, saglayici/cagir.ts, and the test files change, run the relevant tests before touching more files.
Must pass:
- model-sizmasi.test.ts (new slugs only in the allowed files)
- modeller.test.ts (yonlendir unchanged)
- new tests: Luna 500 then 200; Luna 500 twice then Sonnet; Luna 200 empty then Sonnet; image still GÜÇLÜ; GOREV_POLITIKASI kademe map unchanged in spirit (clinical gorev = guclu, narrow list = hizli)
- existing F3 / karne / görüntü tests still force GÜÇLÜ
- full npm test green (tekBeyin.test.ts mocks the Anthropic SDK — keep those tests passing: when OPENROUTER_API_KEY is unset in tests, the Anthropic path must be used exactly as before)
If a test cannot be run in this environment, say so and leave the command.

DONE LOOKS LIKE
Report: files changed; exact default slugs; Vercel env to set (NOTYA_MODEL_HIZLI=openai/gpt-6-luna, NOTYA_MODEL_GUCLU=anthropic/claude-sonnet-5, OPENROUTER_API_KEY=…); tests run and result; anything you did not do.
