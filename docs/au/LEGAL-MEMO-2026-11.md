# Notya Australia — legal memo (draft, 2026-11-03)

**Status: research notes by Claude, NOT legal advice. NEEDS REVIEW BY AN AUSTRALIAN HEALTH LAWYER BEFORE PUBLIC LAUNCH** (owner: Kaan). Sources were read on 2026-11-03; where an official page could not be fetched, that is said.

## 1. Findings that change what we do

1. **TGA: AI scribes are under active review, and Notya does more than scribe.** The TGA defines digital scribes as tools that "capture conversations between patients and healthcare practitioners" and "generate clinical notes, summaries or letters" ([TGA, Digital scribes](https://www.tga.gov.au/how-we-regulate/manufacturing/manufacture-medical-device/manufacture-specific-types-medical-devices/artificial-intelligence-ai-and-medical-device-software/digital-scribes)). Its review published 16 Oct 2026 found 8 of 12 reviewed scribes likely to have medical-device functions, none of them classified by their suppliers, and said "statements or disclaimers are not sufficient in determining if a product is, or is not, a medical device" ([Medical Republic report of the review](https://www.medicalrepublic.com.au/?p=130085); the TGA's own outcome page, [tga.gov.au/node/599817](https://www.tga.gov.au/node/599817), blocked automated reading). Software limited to transcription and admin documentation is generally outside the definition. **Risk for Notya:** the live voice assistant answering from the patient's file, the growth-chart / target-height tools and the immunisation-schedule calendar can be read as producing clinical outputs. The lawyer must decide whether each sits inside the TGA's clinical decision support software exemption ([TGA CDS exemption notification](https://consultations.tga.gov.au/medical-devices-and-product-quality-division/clinical-decision-support-exemption/)) or needs ARTG inclusion. Until then the landing must not lean on those features as clinical decision tools.
2. **APP 8: the premise "data is hosted in the US" is only partly right.** The Notya Australia database is in Sydney (Supabase `ap-southeast-2`, checked 2026-11-03) and the voice-LLM route is pinned to `syd1`. But the operator (Notya LLC, US), the speech and AI model providers, Stripe and the host's global network are overseas. Under APP 8.1 the discloser must take reasonable steps so an overseas recipient does not breach the APPs, and under s 16C it is accountable for that recipient's acts; sending data to a cloud provider can be a "use" rather than a disclosure only where a binding contract keeps "effective control" ([OAIC APP Guidelines ch. 8, paras 8.2, 8.10, 8.14](https://www.oaic.gov.au/privacy/australian-privacy-principles-guidelines/chapter-8-app-8-cross-border-disclosure-of-personal-information/)). Practices (always APP entities as health providers) will need a data processing agreement and a sub-processor list from Notya.
3. **Ahpra: consent before recording, noted in the record.** Ahpra's AI guidance: obtain "informed consent from your patient" for AI scribes, ideally note it in the health record; the software should require explicit consent before recording; "there may be criminal implications if consent is not obtained before recording"; "the practitioner is responsible for checking the accuracy" of records ([Ahpra, AI in healthcare](https://www.ahpra.gov.au/Resources/Artificial-Intelligence-in-healthcare.aspx), reviewed 22/08/2024). Built in this change (section 2).

## 2. What Notya must do in the product

- **Consent gate before recording (done, AU-RIZA-01):** the start button stays disabled until the practitioner confirms consent to recording AND AI drafting, including overseas services; for a patient under 18 the sentence names the parent or guardian (or a minor old enough to consent). Stored per visit (`riza_at`, `riza_surumu`, `+guardian` when that wording was shown) and shown on the note. Lawyer: mature-minor age by state/territory, and surveillance-devices law per state.
- Keep every AI draft marked as a draft until approved (exists); never auto-file a note.
- Offer practices a **DPA + sub-processor list** (APP 8 effective control); confirm each AI/speech provider's retention and no-training terms (APP 11; OAIC: steps rise with sensitivity, destroy or de-identify when no longer needed, [APP Guidelines ch. 11, paras 11.2, 11.3, 11.8](https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-11-app-11-security-of-personal-information)). Commission the security review / penetration test the policy says has not been done.
- **Marketing email (Spam Act 2003):** consent may be inferred from a conspicuously published work address only if the message is relevant to the recipient's role and the publication carries no "no unsolicited messages" statement — publication alone is not enough (Sch 2 cl 4); every message must identify Notya LLC accurately with contact details (s 17), and carry a functional unsubscribe valid for 30 days (s 18), honoured within 5 working days ([Spam Act 2003](https://www.legislation.gov.au/C2004A01214/2016-03-10/2016-03-10/text/original/epub/OEBPS/document_1/document_1.html); [ACMA, Avoid sending spam](https://www.acma.gov.au/avoid-sending-spam)). Do not email to ask for consent (ACMA: that is itself marketing). Keep a record of the source of each address.

## 3. Landing and marketing claims to avoid

- No "diagnoses", "recommends treatment", "clinical decision support", "AI doctor", "accurate", "saves X hours", "TGA/Ahpra approved", "compliant", "secure/HIPAA" claims. Describe outputs as drafts the practitioner approves.
- Voice assistant: say it "finds and reads back what is in the patient's file" — not that it answers clinical questions. Paediatric tools: "plots and records", not "assesses".
- **Founding testimonials:** a testimonial from a doctor who got a founding discount is an incentivised review; disclose the relationship when quoted (Australian Consumer Law, misleading conduct — not researched to a primary source here; lawyer to confirm). Never quote patient information.
- "Free trial" wording: accurate terms only (15 days, no card, 40 visits / 60 voice minutes, read-only after) — done on /founding.

## 4. Risky claims found in the current AU copy (not rewritten in this job)

| Where | Text | Why |
|---|---|---|
| Landing disclaimer, line 2 (`countries/au/uzanti/acilis.ts`) | "Health information is handled in accordance with the Privacy Act 1988 (Cth) and the Australian Privacy Principles." | A compliance claim nobody has verified; contradicts the English-set rule "no law named". |
| Same line | "By using Notya you consent to the collection and use of health information…" | Bundled consent by use; OAIC consent must be voluntary, current and specific (ch. 8 para 8.31 ff.). Patients never see the landing. |
| Landing disclaimer, line 3 | "Clinical content is based on publicly available Australian guidelines (RACGP, RCH Melbourne, PBS, WHO)." | Implies an association; content licences not all verified. |
| Landing "your-assistant" section | "It gives general reference information, not a diagnosis or a treatment decision." | TGA: disclaimers do not decide device status; the function does. |
| Landing plans (`narx`) | "Prices are given by quote." | Now inconsistent with the public founding prices on /founding (A$79 / A$948 / A$149 / A$1,490). |
| Privacy policy, servers | "application servers are configured to run in Sydney" | Verify per route before launch (some voice parts are pinned per region). |

## 5. Privacy-policy items to add (draft for the lawyer)

- Named sub-processors with country and purpose (speech-to-text, AI model routing/provider, voice, hosting, email, Stripe), and whether each retains or trains on data.
- That Notya LLC (US) staff can access data for support and operations; how access is logged.
- APP 8 position: which flows are disclosures vs uses, and the contract terms relied on.
- Retention periods for transcripts, drafts and audit records; deletion on account closure; trial accounts after day 15.
- Marketing: what email Notya sends, the legal basis, and how to unsubscribe.
- Contact point, OAIC complaint route, and the data-breach process (exists at /data-breach).

**Again: needs AU health-lawyer review before public launch.** Owner: Kaan (instruct a lawyer); Claude applies the wording that comes back.
