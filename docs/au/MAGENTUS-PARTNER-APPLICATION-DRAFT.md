# Magentus (Genie / Gentu) Developer Partner — draft for Kaan

**Status:** Ready to send (2026-11-03). Bp Partner Network stays on the **back burner** (NDA + monthly committee already started with Vanessa).  
**Channel:** [Developer Partners interest form](https://www.magentus.com/practice-management/developer-partners/)  
**Docs:** [Genie Partner API](https://docs.geniesolutions.io/genie-partner-api) · FHIR IG (sandbox)

---

## Suggested form / email body

**Organisation:** Notya LLC (trading as Notya) — Australian clinical practice product at [au.notya.io](https://au.notya.io)  
**Contact:** Kaan · kaan@notya.io  
**Stage:** Early-access / beta (invitation + note-only free tier)

### What we build
Notya is a practice application (not a scribe overlay). Clinicians record a visit with consent, receive a structured draft, **edit and explicitly approve** it. From an approved visit we can draft letters / care-plan documents for clinician sign-off.

### Integration ask (honest, minimum scopes)
We want Magentus Partner API access (one FHIR surface for **Genie** desktop and **Gentu** cloud) to:

1. Write clinician-approved visit notes into the patient clinical record / correspondence path your Letters API supports.
2. Optionally attach signed letters as outgoing correspondence.
3. Later (if allowed): read demographics / open patient context so clinicians do not re-key — minimum scopes only.

**We will not:** lodge Medicare claims, write unsigned drafts, or request data we do not need for the write-back workflow.

### Technical readiness
- Vault + outbox already ships in Notya (`ulke_pms_baglantilari` / `ulke_pms_yazma_kuyrugu`).
- Magentus adapter implements OAuth2 client_credentials + `x-api-key` + FHIR `DocumentReference` create; env flags `NOTYA_PMS_GENIE_ETKIN` / `NOTYA_PMS_GENTU_ETKIN`.
- We never mark a row Synced without a 2xx from your API.

### Commercial
Happy to discuss Approved Integrator fees once sandbox keys exist. We are a beta startup — prefer sandbox first, marketplace listing after quality review.

---

## Parallel path (already building)
- **Cliniko** — public REST API, clinic API key; live draft treatment-note write-back (no Magentus dependency).
- **Best Practice** — Vanessa Partner Network paperwork in flight; **not** blocking beta.
