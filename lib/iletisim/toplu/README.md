# lib/iletisim/toplu — Hasta İletişimi (bulk patient communication)

NOTYA-HASTA-ILETISIMI-01 (Kaan, 2026-10-16). **Universal** — every branş + Klinik, not specialty-gated
(`.cursor/skills/specialty-doktor-araclari/SKILL.md` classification: **base**, `ORTAK_DOKTOR_ARACLARI`).
Default screen (audience → template/compose → preview → send) is completable by a secretary in under a
minute; every advanced filter is optional and never forced.

## Permission model

**Doktor AND personel (sekreter) get the SAME full create-and-send access.** This codebase has no
separate DB-level "asistan" role — `personel.rol` only allows `'sekreter'` — so the brief's "doktor,
asistan, and secretary all get full access" is implemented as: any active `personel` row of the doctor,
and the doctor themself, both pass `pratikOturum()` and neither is narrowed further by `sadeceDoktor()` on
any of the compose/preview/send/history routes. The ONE exception is `sms-ayarlari` (the SMS gateway
**credentials**) — doctor-only to configure, same as the Gmail/Outlook/WhatsApp Business connection
screens elsewhere in Ayarlar, because it is account credentials, not a send action. Personel can still USE
the SMS channel via `/toplu/gonder` once the doctor has connected it.

## No automatic sending, ever

Every send requires an explicit `onay: true` in the request body (`app/api/doktor/iletisim/toplu/gonder/route.ts`),
set only after the UI has shown the doctor/sekreter the exact recipient count AND the exact final message
text. There is no cron, no scheduled job, no "send automatically when stock arrives" path — the vaccine
stock-arrival integration (`AsiStokKarti`/`entegrasyonlar/asi-stok`) only shows a banner link that
pre-fills this same compose screen; a human still has to review and press send.

## Idempotency — no double-sends

Two layers, both real Postgres constraints, not read-then-write races (migration 166):
1. `hasta_iletisim_kampanyalari` has `unique(doctor_id, idempotency_key)` — a retried "create campaign"
   call with the same key returns the SAME campaign row.
2. `hasta_iletisim_kampanya_alicilari` has `unique(kampanya_id, patient_id, kanal)` — `kampanyaGonder`
   inserts the recipient row BEFORE attempting to send; a duplicate/retried execute hits
   `unique_violation` on that insert and is treated as "already handled," never re-sent.

The compose UI (`app/doktor-tools/hasta-iletisimi/page.tsx`) generates one idempotency key per *attempt*
and regenerates it after a successful send, so a double-click or network retry of the SAME send is
deduped, while a genuinely NEW campaign composed afterward in the same page session gets its own key.

## Preview = exact final text (with one documented exception)

The engine sends the doctor's edited `govde` **verbatim** to every recipient — no per-recipient
substitution at send time (`lib/iletisim/toplu/sablonlar.ts` file header). What the compose screen's
preview shows is channel-aware and includes the two lines the engine actually appends: the product-wide
112 non-emergency-channel line (`TOPLU_ACIL_SATIRI`), and — SMS only — the STOP opt-out disclosure line
(`TOPLU_SMS_VAZGEC_SATIRI`); for e-mail it also notes that a per-patient unsubscribe link is appended as a
footer (not shown verbatim in the preview because it differs per recipient). The preview never overclaims
"this exact text, nothing more" the way an earlier draft of this screen did — see
`docs/OPEN-COMMITMENTS.md`.

## Opt-out, enforced at the SENDING layer

Reuses the SAME per-channel consent boolean every send already gates on
(`patients.iletisim_izni_whatsapp/eposta/sms`, `lib/iletisim/izin.ts`'s `gonderilebilirMi`) rather than a
separate flag — an unsubscribe click (`app/api/iletisim/vazgec/[jeton]/route.ts`, HMAC-signed token,
`lib/iletisim/vazgecJetonu.ts`) or an inbound SMS STOP/DUR/İPTAL reply
(`app/api/iletisim/sms/webhook/[doktorId]/route.ts`) both just flip that column to `false`
(`lib/iletisim/vazgecUygula.ts`). Because `adaylariGetir` (`filtre.ts`) and `tekAliciyaGonder`
(`kampanya.ts`) both read that column on every single campaign, an opted-out patient is excluded from
every future send automatically — there is no separate "exclude opted-out" checkbox to forget or bypass.

## SMS — no Twilio

See `lib/iletisim/sms/README.md` for the full, honest statement of what is and is not automated.

## Vaccine "waiting list" — a stated heuristic, not a clinical judgment

There is no formal per-vaccine due/waitlist table in this product outside the pediatri-only kohort engine.
"Waiting" is defined, plainly, in `lib/asi/bekleyenler.ts`'s file header: the patient's most recent
`asilar` row for that exact vaccine name carries a `sonraki_doz_tarihi` and no later row of the same name
exists yet. This reuses data the doctor already entered and is explicitly a candidate list for a human to
review before sending — never an automatic clinical trigger.

## Phase 2 (6 non-Turkey countries)

See `docs/HASTA-ILETISIMI-INTL-01-research.md` for the cited per-country consent research, and
`lib/iletisim/toplu/intl/ulkeIzinMetinleri.ts` for the localized intake consent wording this engine's
Phase 2 produced. The bulk-send engine itself needs **zero** country-specific branching — every country's
conclusion is "require real consent, respect revocation, enforce opt-out at the sending layer," which is
exactly what this engine already does unconditionally. Not yet wired into any `release/<cc>` branch's
actual intake form — see `docs/OPEN-COMMITMENTS.md` (`HASTA-ILETISIMI-INTL-02`).
