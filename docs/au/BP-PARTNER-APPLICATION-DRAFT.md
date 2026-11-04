# Best Practice Partner Network — application draft

**Status:** **SENT by Kaan** — 2026-11-03 (America/New_York). Vanessa replied with NDA + Application Form + monthly Committee Review.  
**Priority:** **BACK BURNER** (Kaan 2026-11-03) — beta proceeds via Cliniko (live) + Magentus/Genie–Gentu (adapter ready). Keep Bp paperwork warm; do not block launch.  
**Next (when resumed):** return NDA + form + privacy policy → tech/commercial meeting → committee → agreement → `pmsYaz('best-practice')`.  
**Do not** flip UI to Synced or set `NOTYA_PMS_BEST_PRACTICE_ETKIN=1` until a real adapter ack exists.

**To:** partners@bpsoftware.net  
**Cc (optional):** Halo / Partner Support if they reply with a form  
**Subject:** Partner Network application — Notya (au.notya.io) · approved-note write-back to Bp Premier

---

Dear Best Practice Partnerships team,

I am writing to apply for the **Bp Partner Network** so Notya can integrate with Bp Premier via the approved developer path (Halo Connect / FHIR).

### Who we are
**Notya** ([au.notya.io](https://au.notya.io)) is an Australian clinical practice application — not a scribe overlay. Doctors record a visit with patient consent, receive a structured draft, **edit it, and explicitly approve it**. Only then does the note become part of the patient record in Notya. From that approved visit we also draft GP letters, referrals and patient letters for the doctor to sign off before anything leaves the product.

We are early-access in Australia (invitation + a note-only free tier). Contact: **kaan@notya.io**.

### What we want to build (honest scope)
For practices that already run **Bp Premier** and also use Notya:

1. **Write-back of clinician-approved visit notes** into the patient clinical record (SOAP / consult note).
2. **Write-back of clinician-signed letters** into Correspondence Out (or the equivalent approved channel), on practice letterhead where Bp supports it.
3. Optional later: read demographics / open patient context so the doctor does not re-key — only if your review allows the minimum scopes we need.

**We will not:**
- lodge Medicare / MBS claims from Notya  
- silently sync drafts that the doctor has not approved  
- claim “Synced” in our UI until your API acknowledges a successful write  
- request clinical data we do not need for this job  

Our product already has an encrypted credential vault and write-back outbox waiting for a live partner adapter; today it only offers a doctor-controlled export pack so we never fake a Bp connection.

### Why Bp clinics would care
Many Australian GPs will not leave Bp. They need ambient / assisted documentation that **lands in the record they trust**. Lyrebird already does this as an official partner; we want the same approved path for clinics that prefer Notya’s full practice OS (calendar, patient page, invoices, multi-doctor clinic) **alongside** Bp — or that use Notya for documentation and Bp as system of record.

### Ask
1. Please send the **Partner Network application form** and security / review checklist.  
2. Subject to approval: **staging** access to the developer portal and Halo Connect (FHIR and/or SQL passthrough as you recommend for consult notes + correspondence).  
3. A short call with Partnerships (or Partner Support) to confirm the correct write resources for “approved consult note” and “outbound letter”.  
4. Guidance on the practice-side enablement (third-party integrations tick) so pilot clinics can turn Notya on the same way they enable other partners.

### Pilot plan
Once staging credentials exist we will:
- implement against Halo Connect in our AU deployment  
- run a closed pilot with **1–2 Bp Premier clinics** (Orchid SP2+ as required)  
- only then request production subscription and a Partner Network listing  

Happy to complete any NDA, APP / security questionnaire, or architecture review you require. Data handling for AU clinics is designed around Australian Privacy Principles; we do not market TGA/Ahpra endorsement.

Thank you — looking forward to your process and form.

Kind regards,  

**Kaan**  
Founder, Notya  
kaan@notya.io  
https://au.notya.io  
Phone: *[Kaan fills in]*  
Company / ABN: *[Kaan fills in]*

---

## Magentus / Genie–Gentu (send after Bp, or same week)

**Channel:** [Developer Partners interest form](https://www.magentus.com/practice-management/developer-partners/)  
**Or Genie Partner API access request** (closed beta — invite): via docs.geniesolutions.io “Requesting Access”

**One-liner for the form:**  
Notya (au.notya.io) — Australian practice OS. Request Approved Integrator / Partner API access to write clinician-approved consult notes and signed letters into Genie and Gentu (FHIR Partner API / Letters API). No Medicare lodgement. Staging + 1–2 specialist pilots. Contact kaan@notya.io.

---

*Draft only — Claude, 2026-11-03. Kaan sends; do not claim partnership until Bp confirms.*
