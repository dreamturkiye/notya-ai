# README_OKUL_COZGER_RAPORLARI — İstirahat / Katılım / ÇÖZGER (NOTYA-OKUL-RAPOR-01, 2026-10-15)

Three new base (`ORTAK_DOKTOR_ARACLARI`) Doktor Araçları tiles, visible to every ~30 specialties on
`/doktor-tools`. Relevance is gated on the **patient's** age/öğrenci status
(`lib/doktor/okulAraclariKapisi.ts`), never on the doctor's branş — a cardiologist, dermatologist, etc.
treating a child/öğrenci patient needs these equally; a pediatrist is only one of ≥4 branches on a ÇÖZGER
kurul (see `.cursor/skills/specialty-doktor-araclari/SKILL.md`).

**Note on this repo's actual `main`:** the task brief that commissioned this work assumed a country-pack
layer (`ulkeler` field, `countries/tr/araclar.ts`, `npm run ulke:arac-anlik`) that exists only on other,
unmerged branches (e.g. `release/uz`) — `main` has no such infrastructure yet (`DoktorArac` has no
`ulkeler` field). These tiles were added the way `main` actually works today: `ORTAK_DOKTOR_ARACLARI`
with `branslar: null` only. When the country-pack branch merges, these three tiles need a `ulkeler: ['tr']`
entry and a `countries/tr/araclar.ts` line like every other tool.

## 1. İstirahat ve Geçici Hastalık Raporu (`/doktor-tools/istirahat-raporu`)

- Table `istirahat_raporlari` (migration `151_okul_cozger_raporlari.sql`): `tani`, `gun_sayisi` (1–10, DB
  check + `gunSayisiSinirla()`), `baslangic_tarihi`/`bitis_tarihi`, `egitim_yili` ("2026-2027",
  `egitimYiliEtiketi()`), `e_okula_iletildi` + `_at`.
- **Yıllık hak sayacı**: `egitimYiliToplamGun()` sums every report of that patient/doctor in the same
  `egitim_yili`; `yillikLimitAsildiMi()` flags once the running total exceeds 20 days. **Information only
  — never blocks the doctor from writing another report.**
- **e-Okul is NOT a live integration.** There is no MEB/Sağlık Bakanlığı API access today. The checkbox
  only records that the doctor themself notified the school/parent (same pattern as
  `DERM-FORM014-BILDIRIM`). Never present this as a live submission.
- API: `app/api/doktor/araclar/istirahat-raporu/route.ts` (GET list + yearly total, POST create),
  `.../[id]/route.ts` (PATCH the e-Okul checkbox).

## 2. Durum Bildirir Sağlık Raporları / Katılım Belgeleri (`/doktor-tools/katilim-raporu`)

- Table `katilim_raporlari`: `tur` enum (`spor` | `kres` | `erteleme`), `sonuc` jsonb validated per type by
  `katilimSonucuDogrula()` (`lib/doktor/katilimRaporu.ts`).
- **Spor**: sakınca `yok`/`var` + free-text not.
- **Kreş/okul öncesi**: bulaşıcı hastalık tarama bulgusu (free text) + `asiTakvimiTamMi`. The vaccine-
  schedule completeness is **read from the vaccine module, never re-typed by the doctor**: the API route
  calls `asiKarnesiVerisi()` (`lib/asi/karneSunucu.ts`) and sets `asiTakvimiTamMi = true` only when that
  patient has no recorded upcoming/pending dose (`siradakiler.length === 0`); otherwise it is left `null`
  (never asserts "incomplete" or "complete" it cannot verify). This is a **conservative proxy**, not a true
  cross-check against the national vaccination calendar's own overdue computation (that lives inside the
  pediatri chapter's kohort engine and was not wired into this base tool — see Open items below).
- **Erteleme**: gerekçe (free text) + `onerilenErteleme` boolean. Final decision stays with the school
  administration/RAM; Notya only produces the doctor's own opinion report.
- API: `app/api/doktor/araclar/katilim-raporu/route.ts`.

## 3. ÇÖZGER takip ve katkı (`/doktor-tools/cozger-takip`)

**Notya does not and cannot produce an official ÇÖZGER report.** That report is issued only by the Çocuk
Sağlık Kurulu (≥4 branches) through an appointment taken via MHRS/Alo 182 — entirely outside Notya.
`COZGER_UYARI_METNI` ("Bu, resmi ÇÖZGER raporu değildir; …") is fixed on screen and on any printed output.

- Table `cozger_basvurulari`: one row per (doctor_id, patient_id) — **"hasta_id başına bir başvuru" is
  scoped to this doctor's own `patients` row** for that person (see "Cross-doctor scope" below). `durum`
  enum (`basvuruldu` → … → `okgv_sonucu_geldi`), manually updated, **no external system integration**.
  `okgv_duzeyi` is a free-text/catalog field from `OKGV_BENZERI_DUZEYLER` (textual severity, same pattern
  as the official-diagnosis catalog) — **never a "%" figure**.
- Table `cozger_kurul_katkilari`: N contributions per başvuru. Each kurul member doctor records **their
  own** structured finding (`brans` + `bulgu`) for **their own** patient row, linked to the shared
  `basvuru_id`.
- **Cross-doctor scope (HASTA-IZOLASYON-01, deliberate design):** `patients` rows are per-doctor. Rather
  than inventing a new cross-doctor read path, a contribution is written and read exactly like every other
  patient-scoped row — `hastaSahibiMi(doctorId, patientId)` on the writer's **own** patient record — and
  the only thing kurul members share is the opaque `basvuru_id` (a UUID), coordinated **out of band** today
  (shown on screen as a copyable code). This keeps the standing hasta-izolasyon invariant intact: no doctor
  gains a new way to read another doctor's patient data through this feature.
- API: `app/api/doktor/araclar/cozger-takip/route.ts` (GET, POST create, PATCH durum/fields),
  `.../katki/route.ts` (POST a contribution).

## Age/öğrenci gate

`lib/doktor/okulAraclariKapisi.ts` — `okulAraclariGorunurMu({ hastaDogumIso, ogrenciMi })`:
`veliOnamGerekliMi(hastaDogumIso)` (age < 18, same legal rule as `veliDiliMi`) **OR** `ogrenciMi === true`.
Unknown age + no öğrenci flag → not shown (fails closed, same convention as `veliOnamGerekliMi`). The
"öğrenci" flag is a doctor-entered fact stored in the patient's existing `notes_encrypted` JSON
(`ogrenciMi`, mirrors `anneAdi`/`kanGrubu`/etc.) via `lib/doktor/hastaOzetKayit.ts`
(`notlardanOzetAlanlari`/`notesOzetGuncelle`) and the existing `PUT /api/doktor/hastalar/[id]` route — no
new patient-table column was needed. The three tool pages show a soft, non-blocking notice (with an
inline "mark as öğrenci" action) when the selected patient is neither a minor nor marked öğrenci; the
clinical decision to proceed anyway stays with the doctor.

## Tests

- `lib/doktor/okulAraclariKapisi.test.ts`, `istirahatRaporu.test.ts`, `katilimRaporu.test.ts`,
  `cozgerTakip.test.ts` — pure logic.
- `lib/doktor/hastaOzetKayit.test.ts` — two new cases for `ogrenci_mi`.
- `lib/doktor/doktorAraclari.test.ts` — two new cases: the three tiles are base (`ORTAK_…`) and reachable
  for every branş (30/30 loop over `BRANS_ETIKETLERI`, plus unknown/empty branş); commercial-copy check
  (no sprint jargon/person names) reuses the file's existing blob scan.
- `lib/security/hasta-izolasyon.test.ts` + `hastaIzolasyonEnvanteri.ts` — seven new A↔B cross-doctor cases
  (GET/POST/PATCH on all three tools), all `T` (tested), including the ÇÖZGER contribution route with an
  unrelated foreign `basvuruId` to confirm the writer's own patient ownership is still what gates the
  write.

## Deliberately out of scope (see `docs/OPEN-COMMITMENTS.md` § NOTYA-OKUL-RAPOR-01)

- A real e-Okul (MEB) submission API.
- A true vaccine-schedule overdue computation reused from the pediatri kohort engine for the kreş report
  (today: a conservative "no known pending dose" proxy only).
- An invite/notification flow for ÇÖZGER kurul members to discover and join a colleague's başvuru (today:
  the başvuru code is shared out of band, e.g. verbally or via existing Konsültasyonlar correspondence).
- Country-pack wiring (`ulkeler`, `countries/tr/araclar.ts`) — not applicable on current `main`.
