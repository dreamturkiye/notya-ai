# Pediatri Beta-Test Master Improvement To-Do

Source: first live beta-test session, a practicing pediatrician (currently on Intermedia), ~90 minutes, 10 question areas (2026-10-15). Every item below was checked against the actual Notya code before being listed — see the full evidence-backed audit: https://claude.ai/artifact/SqCkViXhiQB1m5umAEui9K

**Status: OPEN — scope only. No implementation has started.** Kaan is sharing the audit with Dr. Gökhan first. This file is the running backlog for this feedback round; update it as items ship or priorities change. Do not start any row below without Kaan's explicit go-ahead for that item.

| # | Item | Depth (from audit) | Priority | Size | Waits on |
|---|------|---------------------|----------|------|----------|
| 1 | Digital vaccine consent (dijital aşı onam) | Missing | P1 | M | Kaan + Dr. Gökhan go-ahead |
| 2 | Vaccine stock & barcode system (8 sub-items; only note→card sync is Strong) | Missing | P2 | L | Kaan + Dr. Gökhan go-ahead |
| 3 | Billing: pricing, invoicing, revenue reports | Thin/Missing | P3 | L | Kaan + Dr. Gökhan go-ahead |
| 4 | e-Nabız "Muayeneyi Bildir" + live submission | Partial (draft-only today) | P4 | L | Kaan + Dr. Gökhan go-ahead, plus Ministry-side MBYS Stage 2 |
| 5 | Bulk patient messaging (toplu SMS/e-posta) | Missing | P5 | S | Kaan + Dr. Gökhan go-ahead |
| 6 | Exam-screen info: anne-baba adı, cinsiyet, yaş (yıl+ay) | Thin | P6 | S | Kaan + Dr. Gökhan go-ahead |
| 7 | Pediatri photo capture (reuse the capture widget already live in 4 branşlar) | Missing for pediatri | P7 | S | Kaan + Dr. Gökhan go-ahead |
| 8 | Universal protocol number (exam-level; reused in reçete/e-Nabız/insurance) | Thin | P7 | S | Kaan + Dr. Gökhan go-ahead |
| 9 | Mobile: clinical screens (SOAP note, patient file) responsive at phone width | Partial | — | M | Kaan + Dr. Gökhan go-ahead |
| 10 | Staff roles: asistan, hasta danışmanı (today only sekreter exists) | Thin | — | M | Kaan + Dr. Gökhan go-ahead |
| 11 | AI photo evaluation for pediatri (reuse the dermatoloji vision pipeline) | Missing for pediatri | — | M | Kaan + Dr. Gökhan go-ahead |
| 12 | Patient photo archive — tie to exam notes, not just the imaging vault | Partial | — | S | Kaan + Dr. Gökhan go-ahead |
| 13 | e-Fatura/e-Arşiv official issuance | Missing | — | L | Kaan + Dr. Gökhan go-ahead, plus legal/accounting review |
| 14 | School/health report types (istirahat / katılım / ÇÖZGER) | Partial — built 2026-10-15 on `feat/pediatri-okul-raporlari`, tests green (5424/5424), not yet merged | — | — | GitHub App `pull_requests` permission fix, then Kaan's merge go-ahead |

Priority and size (S/M/L) reflect the audit's "game changers, ranked" section — items 1–4 are what the doctor named as decisive for switching off Intermedia.
