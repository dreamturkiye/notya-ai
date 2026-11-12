# lib/geriCagirma — recall engine with a counter (GERI-CAGIRMA-01)

Kaan, 2026-11-12: "Recall engine with a revenue counter. The kohort panels already know who is overdue for a smear,
PSA, HbA1c or vaccine. Turn that into a one-tap recall, and show 'Notya brought back 14 patients this month' on the
home page, so the product justifies its own subscription."

**Classification.** The engine, the list screen, sending, attribution and the home counter are **CORE** — the same
for all 40 branches. The recall **reasons** are **branş-specific** and gated to the doctor's own branş on the server.
`Geri çağırma` is a **base** tile (`ORTAK_DOKTOR_ARACLARI`, all specialties).

## Map

| File | What |
|------|------|
| `tipler.ts` | Types and THE constants: `ATIF_PENCERESI_GUN = 30`, `TAHSILAT_PENCERESI_GUN = 30`, default cool-down 30 days (7–365). Pure. Same file in every build. |
| `atif.ts` | The attribution rule and the monthly counters. Pure. Same file in every build. |
| `nedenler.ts` | Which existing kohort tool answers "due / overdue" for which branş, and which of its flags are recall reasons. Pure data; adds no interval or threshold. |
| `yukleyiciler.ts` | Server: dynamic imports of each branş's existing kohort reader (`app/api/doktor/<branş>/_kohort.ts`) and the engine's own flag labels. |
| `kaynak.ts` | Server: the ONE recall source — the doctor's own branş's tool + the doctor's own follow-up dates (`takip_isleri`) + exclusions + channel choice; per-doctor cache (5 min). |
| `sablonlar.ts` | The generic message (three neutral templates, words injectable). Never a reason. |
| `gonder.ts` | Server: one-tap send through the existing senders; idempotency; "Arandı"; WhatsApp quota info. |
| `sayac.ts` | Server: attribution refresh, stored monthly counters, the home card's read, tagged-link attribution. |
| `metin.ts` | The counter's sentence and the rule tooltip. Honest-copy tests. |

UI: `app/doktor-tools/geri-cagirma/page.tsx`, `components/doktor/geriCagirma/GeriCagirmaKarti.tsx` (Ana Sayfa),
`components/doktor/geriCagirma/KohortBaglantisi.tsx` ("Bu listeyi geri çağır", mounted once in
`app/doktor-tools/layout.tsx` and in `components/klinik/KlinikAracSayfa.tsx`).
API: `app/api/doktor/geri-cagirma/{route,gonder,arandi,ayar,ozet,yenile}`. Hook: `app/api/portal/hasta/[token]/randevu`
(tagged-link booking). DB: `lib/db/migrations/196_geri_cagirma.sql` (+ `geri-al/`), one file for all seven databases.

## Inventory — where "due / overdue" comes from

- **30 medical branches**: each has its own kohort engine and reader; all 30 are wired (`nedenler.ts`). Only flags that
  mean "a visit, test or screening is due or overdue" are recall reasons. Clinical-state and safety flags (HbA1c >9,
  eGFR <45, "risk açık", PHQ-9 yüksek, ESI 1–2, an overdue chemotherapy day …) are deliberately NOT one-tap reasons.
  A due DATE is shown only where the engine's row carries one (dermatoloji, göz, pediatri: `enErkenTarih`); the other
  engines raise a flag without a date, and none is invented.
- **10 Özel Branşlar**: no clinical kohort engine; the practitioner's own dated plan items (`ozel_brans_plan.vadeler`
  through the branch's `vadeKohort`) that have passed.
- **Universal (all 40)**: the doctor's own recorded follow-up date — an open, unconditional `kontrol` case in
  `takip_isleri` (NOTYA-TAKIP-01) whose date has passed.
- Not wired (they are per-patient tools without a practice-wide due list, or their result is already a flag of the
  branş kohort): the lab/drug izlem studios (`endo-lab-izlem`, `roma-lab-izlem`, `psik-ilac-izlem`, `noro-ilac-izlem`,
  `enfeksiyon-viral-izlem`), `lib/asi/bekleyenler.ts` (vaccine stock waiting list — bulk messaging already uses it),
  KD-TARAMA-01 records.

## Rules

1. **Generic message.** No reason, test, diagnosis, drug or vaccine in any message; no price or promotional wording.
   WhatsApp uses the already-approved generic template `genel_bildirim` (no free text, no link).
2. **Consent per channel, enforced on the server at the moment of sending** (`lib/iletisim/izin.ts`). No consent or
   opted out → listed as "izin yok — arayın", never messaged. E-mail fails closed without the unsubscribe link.
3. **At most once.** The recall row is inserted before the send; `unique (ulke, doctor_id, istek_anahtari, patient_id)`.
4. **Who may use it.** Doktor and personel alike (pratikOturum), the same decision as bulk messaging
   (`lib/iletisim/toplu/README.md`). This is wider than the one-tap queue's rule 3 (`lib/iletisim/README.md`), where a
   `kontrol_hatirlatma` item stays with the doctor; the cool-down setting is doctor-only.
5. **Isolation.** Body patient ids are never used directly: the engine recomputes the doctor's own due list restricted
   to them. Every write carries `ulke + doctor_id + patient_id`.
6. **Performance.** The list costs a fixed number of batched queries (tested); the home card reads two stored row sets;
   refresh runs on the recall screen, after a send, or in the background when the stored number is older than 12 h.
7. **Fail soft.** Before migration 196 every read answers "not installed": no list, no card, no send.

## Attribution (exactly as implemented — `atif.ts`)

A recall counts only if it LEFT (provider accepted the message, or the practice marked a phone call). Then:
**booked** = the same patient has a non-cancelled appointment CREATED after the recall and within 30 days of it
(through the recall's tagged link, or any other route); **attended** = that appointment is completed, or a
muayene/seans record exists on its calendar day; **recorded payment** = `captured` accounting payments on that
patient's invoices from the visit day to 30 days after — nothing recorded, no amount, never an estimate. A patient is
counted in the month the appointment was made, once per month. Booked-before-recall, booked-after-window, cancelled,
walk-in-without-appointment: not counted. The sentence says "geri çağırma sonrası", and the tooltip says the numbers
show sequence, not proof of cause.
