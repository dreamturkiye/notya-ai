# Notya Australia — Data Breach Response Plan (internal)

Drafted 2026-11-03 (AU-POLITIKA-01), pending review by an Australian health lawyer (see `docs/au/LEGAL-MEMO-2026-11.md`).
Public summary: au.notya.io/data-breach (`countries/au/uzanti/veriIhlali.ts`). Older working note: `docs/au/INCIDENT-RESPONSE.md`.

Sources: OAIC, Notifiable Data Breaches (oaic.gov.au/privacy/notifiable-data-breaches); OAIC, Data breach preparation and
response guide; Privacy Act 1988 (Cth) Part IIIC (s 26WE eligible data breach; s 26WH assessment within 30 days;
s 26WK statement to the Commissioner; s 26WL notifying individuals "as soon as practicable").

## 1. Scope

Any loss of, or unauthorised access to or disclosure of, personal information held in the Australian Notya service:
the Sydney Supabase project (`sllwiuhobuagumwbvulf`, ap-southeast-2), its storage buckets, the Vercel deployment and its
environment, and data sent to the providers on au.notya.io/sub-processors. Notya LLC is not a small business operator for
the Privacy Act because it holds health information, so the NDB scheme applies to it. The practices are APP entities in
their own right; where data is held jointly, Notya and the practice agree who notifies (one notice, OAIC guidance).

## 2. Roles and contacts

| Role | Who | Contact |
|---|---|---|
| Response lead and Privacy Officer | Kaan Arıoğlu, Notya LLC | kaan@notya.io |
| Technical containment (under the lead's direction) | Claude / engineering agents, with the lead's approval for any production change | via the lead |
| Clinical adviser (harm assessment for health data) | Dr. Gökhan Mamur | via the lead |
| Legal adviser | Australian health lawyer (to be instructed — see OPEN-COMMITMENTS AU-LEGAL-MEMO-2026-11) | — |
| Regulator | OAIC | oaic.gov.au, NDB form; 1300 363 992 |

Provider security contacts (look up the current address on the provider's site at the time): Supabase, Vercel, ElevenLabs,
OpenRouter, OpenAI, Anthropic, Stripe.

## 3. The plan

### Step 0 — Report (minute 0)
Anyone (staff, practice, patient, provider, researcher) reports to kaan@notya.io. The lead opens a breach record (section 5)
with the time the report arrived. No patient data in the email or the record beyond what is needed.

### Step 1 — Contain (immediately, same day)
- Revoke or rotate what is exposed: Supabase service-role key and JWT secret, user sessions, the application encryption key
  (re-encrypt if the key itself leaked), Stripe/Tyro connection keys, ElevenLabs/OpenRouter keys, portal links and PINs.
- Disable the affected route or feature (Vercel env flag or redeploy); pause the project if needed.
- Preserve evidence: Supabase logs, Vercel runtime logs, git history; do not delete records that show what happened.

### Step 2 — Assess (start at once; finish within 30 days of first suspicion — s 26WH)
Answer and record: what data (fields, encrypted or plain), whose (which practices, how many patients, minors?), how it was
exposed, whether it was actually accessed, whether remedial action has removed the likelihood of serious harm (s 26WF).
Health information is sensitive: treat serious harm as likely unless the evidence shows otherwise. Aim to finish well
before 30 days; record the reasons for the conclusion either way.

### Step 3 — Notify
- **Affected practices: without undue delay and within 72 hours of confirming a breach that affects their data**, even if the
  assessment is still open. Say what is known, what is being done, and who to contact.
- **If eligible data breach:** lodge the statement with the OAIC using its online form as soon as practicable, and notify the
  affected individuals as soon as practicable (directly, or through the practice, or by publishing if direct notice is not
  practicable — s 26WL). Content: Notya's identity and contact, a description of the breach, the kinds of information, and
  the steps people should take.
- **Provider breaches:** when a provider reports a breach involving Notya data, run steps 1–3 as if it were Notya's own.
- Other countries' regulators only if the breach touches their builds (separate plans to be written — OPEN-COMMITMENTS
  POLITIKA-ULKE-01).

### Step 4 — Review (within 30 days of closing)
Root cause, what changed, whether the plan worked; update this document and the public summary if needed.

## 4. Prevention and readiness
- Run one tabletop drill before the first paying AU practice and then yearly (not done yet).
- Keep the sub-processor list current; confirm each provider's breach-notice terms.
- Penetration test / security review: not done yet (see `docs/au/LEGAL-MEMO-2026-11.md` section 2).

## 5. Record keeping
Every suspected breach gets a record, kept for at least 5 years, notified or not: dates and times (reported, contained,
assessed, notified), what happened, data involved, people and practices affected, the harm assessment and its reasons,
notifications made (to whom, when, copies), and the review outcome. Keep records in the private operations store, never in
this repository, and without patient identifiers beyond what is needed.
