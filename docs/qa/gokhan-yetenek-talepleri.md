# Dr. Gokhan Mamur - capabilities Ayse used to have (reported 2026-10-01)

Verbatim summary of his message: Ayse used to help with everything. Specifically: appointments, showing the vaccine record as a table, one or several exam (muayene) summaries, and weight or ALL anthropometric measurements for a single exam, in sequence, or across all exams.

Required capabilities (each needs a regression test: Turkish example phrase -> expected tool call and screen output):
1. Appointments, full set on the doctor's behalf: create, change time, cancel, list by day/patient, free slots. (Also covered by branch fix/ayse-randevu-capability.)
2. Vaccine record: rendered as a TABLE on screen, voice gives one short line. (Also covered by branch fix/ayse-voice-endpointing-vaccine-table.)
3. Exam summaries: one named exam, several selected exams, all exams of a patient.
4. Anthropometrics (weight, height, head circumference, BMI, percentiles if stored): (a) from a single exam, (b) as a time-ordered series over exams, (c) across all exams. Screen shows a table, plus a growth chart if one existed before; voice stays short.
5. General helpfulness inside scope: any patient-file question the doctor asks must reach a real tool, never the patient-count template.

Rules: Luna + Fish Audio only. Never invent measurements: show only what is stored, mark missing values. Turkish product text. Cross-doctor isolation applies.
