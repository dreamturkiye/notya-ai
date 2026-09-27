# NOTYA-NOT-HIZ-01 — muayene notu üretim süresi 1:45 → ~35 sn (Kaan / Dr. Gökhan, 2026-09-26)

Repo: /Users/kaan/notya-hiz (worktree, branch fix/not-hiz, base origin/main). Read docs/SITE-MAP.md, lib/doktor/soapUret.ts, lib/ai/cagir.ts (cache split, aiCagir signature, gorev policy), app/api/sessions/ses-yukle/route.ts, app/api/sessions/[id]/end/route.ts, lib/doktor/soapUret.test.ts / noteGenerator tests if present, and docs/OPEN-COMMITMENTS.md.
Turkish is the product language. Do NOT push. No migrations. Verify: npx tsc --noEmit (only the 4 known klinikPortal errors), npm test green. Commit when green. Report to /tmp/hiz-report.md. Do not touch app/api/doktor/seans-paketi.

## Root cause (measured from ai_token_kullanim, gorev='soap', 09-22..09-25)
- Output 4,500–6,200 tokens per note, one serial call, maxTokens 8000 → 70–100 s at Sonnet speed. Two weeks ago the note schema had about half the fields (~2k tokens → 15–25 s).
- Input 11k–23k tokens, ZERO cache (cache_read = cache_creation = 0 on every soap row): the fixed system (branch prompt lock, format rules, Turkish tradition block) is re-sent uncached each time.
- Duplicate content: the prompt asks for subjektif/objektif/degerlendirme/plan AND then anamnez ("tek parça düzyazı olarak da doldur"), fizik_muayene, tani, tedavi — the same clinical content emitted twice. Consumers: ses-yukle and [id]/end write content_anamnez / content_fizik_muayene / content_tani / content_tedavi from noteData.anamnez etc.
- Advisory extras (aiDegerlendirme, receteOnerisi, alarmBulgulari, kritik_bulgular, hasta_ozeti, icd10_codes) are generated in the same serial call after the body.

## Fix — three changes, no feature removed, doctor-visible output identical
1. Stop emitting the duplicate prose fields. Remove anamnez / fizik_muayene / tani / tedavi from the model's JSON contract and derive them in code in soapUret.ts (a pure function `turkceBolumleriTuret(soap)`): anamnez = subjektif (the labeled Şikayet/Hikaye/Özgeçmiş/Soygeçmiş/Alışkanlıklar text, one piece), fizik_muayene = objektif, tani = degerlendirme, tedavi = plan. Keep noteData's shape for the routes (they still read noteData.anamnez etc.) — populate them from the derivation so ses-yukle and [id]/end need no change. If the epikriz/PDF layer expects prose without labels, keep the labels: they are the Turkish tradition headers Dr. Gökhan asked for (2026-09-03 rule) — do not strip them.
2. Split into two PARALLEL calls in soapNotuUret (Promise.all), same system prompt and transcript/context:
   - Call A (gorev 'soap', note body, maxTokens ~4000): basvuruYakinmasi, soap {subjektif, objektif, degerlendirme, plan}, vitaller, ilaclar (structured from plan — same call as plan so the "birebir aynı" rule holds), asilar, icd10_codes, ai_confidence.
   - Call B (gorev 'klinik-analiz' or a new 'not-oneri' if the policy table needs it, maxTokens ~2500): aiDegerlendirme, receteOnerisi, alarmBulgulari, kritik_bulgular, hasta_ozeti — advisory only, invisible to the patient except hasta_ozeti/alarmBulgulari which are patient-facing plain language. Give B the same rules (doctor-said vs AI-suggested separation, no invented doses, veli dili by age, Neyzi ban, dose lock) — split the existing prompt text, do not rewrite it.
   - Merge A+B into the existing noteData object. If B fails or times out, the note is still saved with A (log the failure, advisory fields empty) — the doctor's note must never wait on the advisory call. If A fails, keep the current error path.
   - F3 still holds: a truncated JSON on either call is salvaged/handled as today, never shown raw.
3. Prompt caching on the SOAP calls: mark the fixed part of the system prompt (branch prompt lock, format rules, Turkish tradition block — everything that does not vary per patient) as the cacheable block per lib/ai/cagir.ts's existing cache split; patient context, hafıza profile, style examples and transcript stay outside the cached block. Both A and B share the same cached prefix (same system text) so the second call hits the cache.

Also: check the doubled-call symptom — on 09-25 16:47 and 16:49 the same note (identical 22,861 input tokens) was generated twice two minutes apart. Look at the client that calls ses-yukle / [id]/end (components under components/doktor or app/dashboard/doktor/muayene…): if it retries on a slow response or the user can re-submit while the first request is in flight, add an in-flight guard (disable the button / ignore duplicate submit) — do not add server-side dedup that could drop a legitimate second recording. Report what you found.

## Tests
- soapUret: derivation function unit tests (labels kept; empty sections → null); A+B merge; B failure → note saved with empty advisory fields; parallelism (both aiCagir calls start before either resolves — assert with a fake aiCagir that records start order/time).
- Existing note tests (F3, karne, görüntü, brans-alan-sizmasi, KD/derm dose lock) unchanged and green.
- model-sizmasi.test.ts green (no new slugs).

## Docs
docs/OPEN-COMMITMENTS.md: row NOTYA-NOT-HIZ-01 DONE (kod) with the measured root cause (numbers above), the three changes, expected time (~35–40 s on Sonnet 5; ~15–25 s only with a faster primary model — waits on Kaan's model decision), and the client double-submit finding.
