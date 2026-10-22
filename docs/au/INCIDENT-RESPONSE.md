# Data breach response (draft) — AU-BETA-01, 2026-10-22

**Initial compliance draft – external legal review later.** Not reviewed by a lawyer; does not say any party complies with the Privacy Act 1988 (Cth).
The public page is `/data-breach` (`countries/au/uzanti/veriIhlali.ts`). Source: OAIC, https://www.oaic.gov.au/privacy/notifiable-data-breaches (read 2026-10-22): where the Act covers the organisation, a breach (personal information lost, or accessed/disclosed without authorisation) that is likely to result in serious harm must be notified to affected individuals and the OAIC. The pages read gave no assessment period; a lawyer must supply it.

| Step | Who | What | Placeholder / open |
|---|---|---|---|
| 1 Report | anyone → security@notya.io | note the time and what was seen; no patient content in the email | mailbox owner not confirmed |
| 2 Contain | operator engineer | revoke sessions/links (portal links can be withdrawn per patient), rotate `ENCRYPTION_MASTER_KEY`-class secrets and provider keys, preserve logs | key-rotation procedure not written |
| 3 Assess | privacy officer + lawyer | serious-harm assessment; which practices and patients | privacy officer is a placeholder |
| 4 Notify | practice / operator as a lawyer decides | affected individuals and OAIC via its online form | roles (practice vs operator) unsettled |
| 5 Review | operator | record cause, fix, who was told | no drill has been run |

Parties: each practice answers for its own patients' information; the operator provides the software. Who notifies, and when, is for a lawyer.
