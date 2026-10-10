# Reported medicines at the pharmacy — preparation note (NOTYA-SUT-RAPOR-01)

Written 2026-10-10. **Nothing in this note is built.** It says what would change in the Turkish product on the day the regulation is published, and what the measures already announced mean today. Open items: `docs/OPEN-COMMITMENTS.md`, section NOTYA-SUT-RAPOR-01.

## Where the law stands

| Item | Status on 2026-10-10 | Basis |
|---|---|---|
| Monthly pharmacy supply of reported medicines for the validity of the report, no new prescription while treatment is unchanged | **Planned.** No date, no legal instrument. | Minister's statement, AA 2026-10-10. No official text found. |
| Report-issuing doctor prescribes for up to one year, collected in three-month doses | Announced as sent for publication on 2024-05-17 | SGK news item 2024-05-17. Legal text not opened. |
| Family physicians prescribe listed medicines on the basis of a health report | In force | SGK announcement 2024-06-13, citing the SUT amendment in Resmî Gazete 2024-05-18 no. 32550. List and legal text not opened. |
| Family medicine and internal medicine specialists issue or renew more reports | Reported as in force | Trade press on the amendment in Resmî Gazete 2025-03-25 no. 32852. Legal text not opened. |
| Health board reports issued at home | Pilot in Bilecik, Sinop, Tunceli for bedridden or device-dependent patients | Ministry of Health page, undated, no instrument cited. Nothing official found that names age 80. |
| Remote evaluation with e-prescription and e-report | In the SUT since 2024 for Ministry second and third level hospitals | SUT 2.1.1.B, added by Resmî Gazete 2024-04-21 no. 32524 (text read; later amendments not checked). The two-province pilot the Minister described has no instrument found. |

mevzuat.gov.tr and resmigazete.gov.tr refused automated reading, and the SGK attachment links did not return the documents they name. No rule in the product was changed.

## On the day the regulation is published

**Screens that show a report's validity**
- Araçlar › Hasta Raporları (`/doktor-tools/sgk-rapor`, every branch): "Rapor Süresi (Ay)", start and end date on the printed draft, the "Yasal / Medula notu".
- Branch report drafts: dahiliye, kardiyoloji, nefroloji, psikiyatri, KBB, göğüs hastalıkları, göz, dermatoloji, romatoloji, onkoloji.
- Notya holds a **draft**; the valid report is the Medula e-Rapor. Notya knows an end date only when the doctor produced the draft here.

**What a doctor would no longer need to do**
- Write a repeat prescription for an unchanged reported treatment. The repeat-only visit through e-Reçete Asistanı and Muayene sonu paketi becomes optional for these patients.
- Read the quantity warnings as they stand: the box-count and "rapor gerekebilir" hints in `lib/medula/receteHazirla.ts` and `lib/seansPaketi/sutKurallari.ts` must be re-read against the new text.

**What a patient-portal reminder could say** (wording only after the official text; no medicine name, no diagnosis)
- "Raporlu ilacınız için raporunuz geçerli olduğu sürece yeni reçete gerekmeyebilir. Eczanenize danışın."
- "Raporunuzun süresi dolmadan kontrol randevunuzu alın."

**What must wait for the official text**
- Dose interval (monthly or three-monthly), which medicines and report types are covered, and from which date.
- Whether it applies to reports issued in private practice, and how Medula shows remaining supply.
- Who decides that the treatment is "unchanged", and what ends the entitlement.

## What the measures already announced mean today

- **Family medicine is a branch in Notya.** It sees the 12 shared tools (including Hasta Raporları and e-Reçete Asistanı) and four of its own: Aşı / tarama paketi, Kronik paket, Sevk / acil triyaj, kohort. It does not see the dahiliye "SGK ilaç raporu" draft tool. Whether it should get a report draft tool of its own is a product decision for after the official text is read (classify before add: branch-only, not shared).
- **Drug information.** The assistant's SGK lines point to the SUT ("uzman hekim raporu koşullarına bakınız") without naming who may issue a report. They stay as they are until the text is read.
- **Home reports.** Notya has no home-visit report flow. Hasta Raporları drafts work on a phone during a home visit; nothing changes.
