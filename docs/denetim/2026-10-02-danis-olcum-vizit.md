# NOTYA-DANIS-OLCUM — where a visit's measurements live, and why Ayşe did not read one (2026-10-02)

Live report (Dr. Gökhan, 2026-10-02): in a patient's file, "Ayşe'ye Danış" was asked *"bu hasta 12 aylık muayenesine
geldiğinde kaç kiloydu"*. The file has a visit dated 2025-05-15 titled "12 aylık sağlam çocuk izlemi". Ayşe answered
that the weight was not written and estimated about 9.35 kg from an iron dose of 1 mg/kg/day.

This document is the inventory asked for in item 1 and the root cause found while reproducing. No production data was
read; everything below is from the schema (`lib/db/migrations`), the code and synthetic in-memory patients.

## 1. Where a weight / height / head circumference / temperature / blood pressure is stored

| # | Place | Fields | Tied to | Written by | Read by the shared file index (`lib/doktor/dosyaOlaylari.ts`) |
|---|---|---|---|---|---|
| 1 | `notes.vitaller` (jsonb on the visit note) | `kilo`, `boy`, `basCevresi`, `ates`, `tansiyon`, `nabiz`, `spo2`, `solunum` | the visit (note → session) | SOAP generation, the Yaşamsal Bulgular form, the `olcum_ekle` / `bas_cevresi_ekle` actions (`gununNotunaVitalEkle`), the device route (a device value the doctor accepts lands here), FHIR / HL7 import | yes — one event per value, `kaynak: 'olcum'`, with `vizitId` (all keys except `solunum`) |
| 2 | `cihaz_olcumleri` (migration 024) | `tur` = `ates` \| `tansiyon` \| `nabiz` \| `spo2` \| `kilo` \| `glukoz`, `deger` (text, "37.2" / "120/80"), `birim`, `alindi`, `note_id` (nullable), `onaylandi` | the patient and a timestamp; optionally a note | `/api/doktor/cihaz-olcum` (Bluetooth / vendor / file) | yes — `kaynak: 'cihaz'`, by date, approved rows only. Before this change a blood pressure "120/80" was reduced to the number 120 |
| 3 | SOAP note text | free text in `notes.content_objektif` (also `content_subjektif`, `content_degerlendirme`) — "Kilo 9,8 kg, boy 75 cm", "TA 130/85 mmHg" | the visit | the doctor / the model | text only — no value was extracted. The visit event carries the first 260–300 characters of each section |
| 4 | Intake form (`hasta_intake_formlari.form_data_encrypted`) and `patients.notes_encrypted` | birth weight / birth length (`dogumKilosuPed`, `dogumBoyuPed`), parents' height | the patient (not a visit) | the patient / guardian | yes — as the perinatal line and `anne-boy` / `baba-boy` |
| 5 | Kadın Hastalıkları ve Doğum: `gebelikler` (`gebelik_oncesi_kilo`, `boy`), `gebelik_izlemleri` (`kilo`, `tansiyon_sistolik`, `tansiyon_diastolik`), `travay_partograf` (`anne_nabiz`, `ta_sistolik`, `ta_diastolik`, `ates`), `dogum_olaylari.intraop.kilo`, `bebek_kartlari` (`kilo_gram`, `boy_cm`, `bas_cevresi_cm`) | the pregnancy / the birth / the newborn card | the chapter's own screens | **no** |
| 6 | Dahiliye: `dahiliye_ev_kayitlari` (`tip` = `kb` \| `glukoz` \| `kilo` \| `nabiz`), `dahiliye_obezite` (`boy_cm`, `bel_cm`, `kilo_kg`), `dahiliye_tiroid.kilo_kg`, `dahiliye_antikoagulan.kilo_kg` | the chapter card | the chapter's own screens, the patient (home readings) | **no** |
| 7 | Kardiyoloji: `kardio_izlem.maddeler` (jsonb: blood pressure, weight, NYHA) | the follow-up row | the chapter's own screen | **no** |

There is **no growth-measurement table**. The pediatric growth-curve tab (`/api/doktor/hastalar/[id]/buyume-egrileri`)
derives its points from approved `notes.vitaller` on every request ("Türetilmiş veri — saklanmaz"). The only
standalone, dated measurement table that every branş shares is `cihaz_olcumleri` (row 2); that is the table used for
the "measurement table dated the same day" variant.

Rows 5–7 are chapter tables. They are outside the shared file index and stay outside it in this change (open item
NOTYA-DANIS-OLCUM-05).

## 2. What each surface did with the question (reproduced on a synthetic patient)

The hypothesis in the brief — "the evidence builder filters by visit type only for summaries" — is true for
`lib/asistan/dosyaSorgu/kanit.ts`, but it is not what the Danış panel runs:

| Surface | Route | What it sent / answered before |
|---|---|---|
| Ayşe'ye Danış (patient file panel, `components/doktor/HastaKonsult.tsx`) | `POST /api/doktor/konsult` (not `/konsultasyon`, which is the doctor-to-doctor request route) | The whole compiled file (`hastaDosyasiniDerle`) and nothing else: **no evidence block at all**, and the visit history printed S / O / A / P, diagnosis, ICD and drugs but **never `notes.vitaller`**. The only measurement in the prompt was the quick card's "Son ölçüm" (the latest one). A weight recorded in the 12-month visit's own fields was therefore not in front of the model; the plan text with "1 mg/kg/gün" was. Visits older than the last ten were cut to 160 characters of the complaint, so a weight written in the note text was lost too |
| Ayşe chat (`/api/asistan/chat`) and voice (`/api/asistan/fish-tur`), both `ayseCevapla` | — | No canonical question matched and no record request matched, so the quick card answered deterministically: "dosyada son ölçüm: …" — the **latest** weight, for a question about the 12-month visit |
| Note panel (`/api/doktor/not-konsult`) | — | The same compiled file, cut before the visit history |

So a measurement tied to one named visit was never selected on any surface, for two reasons: the shared evidence code
had no "measurements of that visit" query, and the compiled file did not carry visit measurements at all.

## 3. What changed

One query, `lib/asistan/dosyaSorgu/vizitOlcum.ts`, used by all three surfaces: it finds the visit the question names
(visit type / age milestone through `vizitTuruEsanlam`, "ilk / son muayene", or a series over visits) and reads that
visit's measurement from rows 1, 2 and 3 of the table above, in that order, with unit, date and source. With no record
it says so and never derives a value. Danış additionally prints each visit's own measurements in the compiled file and
checks the model's answer against the record. Status and open items: `docs/OPEN-COMMITMENTS.md` § NOTYA-DANIS-OLCUM.
