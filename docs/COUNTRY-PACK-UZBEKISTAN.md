# Country pack: Uzbekistan

Answers to `docs/COUNTRY-PACK-CHECKLIST.md` for Uzbekistan. Code: `countries/uz/`.

## Correction of the record: where Uzbek data is stored (2026-10-08, NOTYA-ULKE-SABLON-01)

**What was true before this job.** The reports of slices 1 to 3 said the Uzbek build used "new tables only". That was true of the migrations (they created only new tables and altered no existing one), but **not of the application**: the Uzbek build wrote its accounts into the core table `users`, its patients into `patients`, its visits into `sessions`, its notes into `notes` and its daily counter into `ai_kullanim`, and kept only the extra facts in new side tables. With a database of its own per country, as decided then, that was harmless. **What is true now.** Kaan decided on 2026-10-08 that every country shares Türkiye's database. Since this job an Uzbek build reads and writes **country tables only** (`ulke_hesaplari`, `ulke_hastalar`, `ulke_muayeneler`, `ulke_notlar`, `ulke_kullanim` and the side tables), each row carrying the country, and never a table Türkiye uses; migration 128, which altered `users`, is superseded and not to be run. Where a section below still names `users`, `patients`, `sessions` or `notes`, or "a separate Supabase project", read it as history. The current facts are in `docs/COUNTRY-PACK-DB-ROLLOUT.md`.

## Status (2026-10-08, end of slice 1; slices 2 and 3 have their own sections below)

**Nothing is live.** No Uzbek deployment or database exists. No migration has been applied anywhere. Sign-up is closed (invitation only, and no invitation code has been issued). Nothing here has been merged into `main`; the Turkish product is untouched.

Three stacked branches, none merged: `feat/ulke-temeli` (PR #565, country foundation) ← `feat/uz-acilis` (PR #566, landing page, login, invitation sign-up) ← `feat/uz-muayene` (PR #567, slice 1, this section).

What slice 1 built, all of it under `/uzbek`:

| Step | Address | What it does |
|---|---|---|
| First-login question | `/uzbek/start` | Uzbek or Russian; for Uzbek, Latin or Cyrillic. Sets the interface language and the note language. Asked once. |
| Settings | `/uzbek/settings` | Interface language, note language, script. |
| Home | `/uzbek/today` | Today's visits, patient search, new patient, start a visit. |
| Patients | `/uzbek/patients`, `/patients/new`, `/patient?id=` | Create, find in either script, patient file with approved notes and drafts. |
| Visit | `/uzbek/visit` | Choose the patient → consent tick-box → record → transcript → note → rewrite in the other language → approve. |

How the visit works:

1. **Consent.** A tick-box blocks recording; the server refuses a visit without it. The sentence is in the catalogue, marked "NOT REVIEWED BY A LAWYER"; every visit is stamped with the wording's version (`uz-taslak-2026-10-08`).
2. **Recording.** In the browser. Uploaded once to the doctor's own folder of a private bucket (`muayene-sesleri`), read once by the server, then removed.
3. **Transcription.** ElevenLabs Scribe, model `scribe_v2`. First pass with no language, so it is predicted; the predicted language and its probability are stored with the visit. If the language probability is below 0.80 or the average word log-probability is below −0.36 (both are named settings in `countries/uz/klinik/index.ts`), one second pass runs with the language forced to the doctor's note language, and the transcript with the higher average word log-probability is kept. Never more than two passes. The visit records that a second pass ran (for counting cost) and whether confidence stayed low.
4. **Note.** Written by the model in the doctor's note language (Uzbek in the chosen script, or Russian), from instructions that belong to the Uzbek pack (`countries/uz/klinik/talimatlar.ts`): a senior clinician's voice, written fresh, no Turkish source, no protocol claimed, no source cited. Slice 1 had two templates (pediatrics and one general template); **since slice 2 every one of the 40 roles has its own, see the next section.** The call goes through the shared model gateway by task name, as the model policy requires; no model name is written on the Uzbek side.
5. **Low confidence.** If confidence stayed low, the note screen shows a plain sentence asking the doctor to check the note carefully. The note is still written.
6. **Second draft.** One click rewrites the note in the other language (Uzbek ↔ Russian) as a second draft beside the first. A second click does nothing new.
7. **Approval.** The doctor edits and approves one of the drafts; only then is it in the patient's file. An approved note cannot be changed: the saving statement itself carries "not approved yet", and a late save, a second approval and a rewrite are all refused.

**Landing page (2026-10-08, branch `feat/uz-acilis-tr-eslesme`, PR #568, base `feat/uz-muayene`, unmerged).** The landing page at `/uzbek` was rebuilt to match the Turkish doctor landing page section for section: same layout, colours, type, photographs and section order, with Uzbek text in three forms (Uzbek Latin, Uzbek Cyrillic, Russian) from `countries/uz/acilis/icerik.ts`. It reuses the Turkish page's presentational components and photographs as they are and edits no Turkish file. Section-by-section decisions and every line with English beside it: `docs/uz-landing/COPY.md`. The page describes features that are not switched on here; it must not go public until they are built or the text is cut back (`docs/OPEN-COMMITMENTS.md`, NOTYA-UZ-ACILIS-02a).

Everything else is off (appointments were off in slice 1 and are built in slice 3, below): tools, the voice assistant, the patient portal, colleague consultation, messaging, voice profile, image evaluation, and anything tied to Turkish state systems. None of their pages or APIs exists in an Uzbek build.

### What was tested, and how

| Check | Result | Against |
|---|---|---|
| Country, leak, route and isolation tests (`npm run test:ulke`) | pass | stand-in database, auth, storage, speech provider and model provider, all inside the test process |
| Wall check, type check | clean | the repository |
| Uzbek production build (`NOTYA_COUNTRY=uz npm run build`) | passes; the build holds the Uzbek pack and no other | this machine |
| Browser walk-through (`scripts/ulke-yuruyus/`) | passes | the Uzbek production build, a real headless browser recording a test tone, stand-in Supabase, stand-in providers loaded into the server |

**Tested only with stand-ins (mocks): the database, sign-in, storage, speech recognition and the note model.** No real provider was called at any point: no audio, transcript or note text left the machine, and no provider key was present. So these are unproven until someone runs them for real, first with synthetic audio: the request and answer format of Scribe v2 (taken from its documentation), how well Uzbek and Russian are recognised, what Scribe does with a visit that mixes the two, which script it returns Uzbek in, whether the thresholds are sensible, and the quality of the notes the instructions produce.

### Files, for whoever continues

| What | Where |
|---|---|
| Pack: data, text, screens | `countries/uz/index.ts`, `countries/uz/uygulama/` (screens, catalogue `metinler.ts`), `countries/uz/acilis/` (landing page: catalogue `icerik.ts`, compiled stylesheet `utilities.css` — recompile command in `tailwind.config.cjs`) |
| Pack: clinical half | `countries/uz/klinik/index.ts` (speech settings, consent version, templates), `branslar.ts` (specialty list), `talimatlar.ts` (instructions to the model) |
| Doors core code may use | `countries/active/index.ts` (data), `sayfalar.tsx` (screens), `klinik.ts` (clinical half, server only) |
| Core, country-neutral | `lib/ulke/` — `yol.ts` (path prefix), `uygulama/konusmaTanima.ts` (speech rule), `muayeneKaydi.ts` (visit), `notlar.ts` (note), `notModeli.ts` (the one call to the model gateway), `sinir.ts` (API boundary) |
| Routes | `app/**/*.ulke.tsx`, `app/api/ulke/**/route.ulke.ts`, `middleware.ulke.ts`, `app/not-found.mjs` |
| Migrations (none applied) | `lib/db/migrations/128`–`133` |
| Tests | `lib/ulke/*.test.ts`, `countries/uz/**/**.test.ts`; run with `npm run test:ulke` |
| Walk-through | `scripts/ulke-yuruyus/yuruyus.mjs` (its header says how to run it), `sahte-supabase.mjs`, `sahte-saglayicilar.cjs`; landing screenshots: `acilis-goruntuleri.mjs` |
| What remains | `docs/OPEN-COMMITMENTS.md`, section NOTYA-UZ-MUAYENE-01 |

## Slice 2: all 40 roles, assistant names, note templates (2026-10-08)

Kaan, 2026-10-08: "Just build the uzbek one completely now." Scope given earlier: all 30 doctor specialties and all clinic roles; nothing Turkish may appear in the Uzbek version. Branch `feat/uz-branslar`, stacked on `feat/uz-acilis-tr-eslesme` (PR #568); pull request #569, base `feat/uz-acilis-tr-eslesme`, never `main`. **Unmerged. Nothing deployed. Migration 134 is written and not applied anywhere. No Turkish screen or content file was edited.**

What it adds, all under `/uzbek`:

| Step | Where | What it does |
|---|---|---|
| Role question | `/uzbek/start`, after the language question | "What are you?" One list of 40, in three groups: a doctor specialty (30), a clinic doctor (5), a clinic allied profession (5). Shown by name in the account's form; the internal key is never shown. Asked once; an account that answered the language question before roles existed is asked only this. |
| Role in settings | `/uzbek/settings` | The role can be changed. The change applies to the next visits; a note already written keeps the template it was written with. |
| Assistant identity | home, visit screen, note draft, settings card | The owner's assistant name for the account's role, and one neutral line ("your senior colleague · <role>"). No biography, no years of practice, no affiliation. An account without a role, and a role without an entry, sees the neutral "Notya assistant". Never another role's name. |
| Note template | visit screen and note | The template is the account's role: it is shown, not chosen (slice 1 let the doctor pick "pediatrics" or "general" per visit, with pediatrics preselected under 18; that choice is gone). The server refuses another role's template for the account. An account without a role writes with the general template. |
| Role fields on the note | `/uzbek/visit?not=` | Under the four shared sections, the role's own fields, each a labelled place for what was said at the visit. Editable in the draft, shown as text once approved, carried into the second-language draft. |

**Leak rule, three layers.** A field belongs to the roles that list it (`countries/uz/klinik/notSablonlari.ts`); one function, `uzSablonAlanlari`, decides, and three places ask it: the instruction to the model (it lists only the role's fields), the server (`lib/ulke/uygulama/notlar.ts` drops every other key from the model's answer, from a request and from what is read back), and the screen (`countries/uz/uygulama/Not.tsx` draws a field only when the server lists it and the template owns it). The shared part is the four sections and nothing else. **Guardian wording follows the patient's age in every role:** a patient under 18 on the day of the visit gets one field ("who gave the history") and one line in the message to the model; an adult never does, paediatrics included; an unknown age counts as a child only in paediatrics and paediatric surgery. The age of 18 is an assumption to confirm with a lawyer.

**No clinical reference content.** No vaccination schedule, growth standard, drug list, dosing, scale, classification or national protocol was written or imported. A field holds what was said, nothing else. Where a template would need reference content there is a slot: empty, switched off, read by nothing (table below). The instructions cite no source and claim no protocol. The Turkish product's notes were looked at for their shape only; no Turkish text was copied, and nothing that exists only in Türkiye has a field or a slot.

**Model policy.** Unchanged: the note is written through the shared gateway by task name; no model name on the Uzbek side.

### What is machine-written or machine-derived in slice 2

| What | Where | How it was made | Who must read it |
|---|---|---|---|
| Names of the 40 roles, three forms | `countries/uz/klinik/rolAdlari.ts` | Machine-written, each form by hand (not converted). Usual names, not checked against Uzbekistan's official list of specialties. | A native-speaking clinician |
| Assistant names, Uzbek Latin | `countries/uz/klinik/asistanAdlari.ts` | The owner's list, exactly as written. Single source: no other file repeats a name. | The owner |
| Assistant names, Uzbek Cyrillic and Russian | `countries/uz/klinik/asistanKimligi.ts`, `countries/uz/yozuv.ts` | **Machine-derived** from the Latin form by rule, at run time. No exception table, nothing corrected by hand. | A native reader (doubtful forms below) |
| Field labels (168 role fields and the guardian field), three forms | `countries/uz/klinik/notSablonlari.ts` | Machine-written, each form by hand. | A native-speaking clinician |
| Instructions to the model, per role, three forms | `countries/uz/klinik/talimatlar.ts` | Machine-written frame (by hand in each form) plus the role's name and field labels. | A native-speaking clinician |
| New screen text (role question, assistant line), three forms | `countries/uz/uygulama/metinler.ts` | Machine-written, each form by hand. | A native speaker |

The pack had no conversion from Latin to Cyrillic script before this slice (only a fold of both scripts for search, never shown). `countries/uz/yozuv.ts` is new: a letter-by-letter rule, stated as a machine conversion at its top.

### Status of the 40 roles

"Template built by machine: yes" means a machine put the template together; it does not mean anyone confirmed it. No role has a local reviewer.

| # | Role (internal key) | Kind | Name: Uzbek Latin / Uzbek Cyrillic / Russian | Assistant (owner's list) | Template built by machine | Fields | Local reviewer | Local content missing (slots, all empty and off) |
|---|---|---|---|---|---|---|---|---|
| 1 | `acil-tip` | doctor specialty | Shoshilinch tibbiy yordam / Шошилинч тиббий ёрдам / Скорая и неотложная помощь | Dr. Jasur Tursunov | yes | 6 | none yet | 1: `triage_scale` |
| 2 | `aile-hekimligi` | doctor specialty | Oilaviy tibbiyot / Оилавий тиббиёт / Семейная медицина | Dr. Nilufar Karimova | yes | 6 | none yet | 2: `screening_programme`, `vaccination_calendar` |
| 3 | `anestezi` | doctor specialty | Anesteziologiya va reanimatologiya / Анестезиология ва реаниматология / Анестезиология и реаниматология | Dr. Bekzod Yusupov | yes | 8 | none yet | 1: `preop_risk_scale` |
| 4 | `beyin-cerrahisi` | doctor specialty | Neyroxirurgiya / Нейрохирургия / Нейрохирургия | Dr. Alisher Ergashev | yes | 6 | none yet | 2: `consciousness_scale`, `surgical_consent_form` |
| 5 | `cocuk-cerrahisi` | doctor specialty | Bolalar xirurgiyasi / Болалар хирургияси / Детская хирургия | Dr. Sardor Abdullayev | yes | 7 | none yet | 3: `growth_standard`, `pediatric_dosing`, `surgical_consent_form` |
| 6 | `dahiliye` | doctor specialty | Terapiya (ichki kasalliklar) / Терапия (ички касалликлар) / Терапия (внутренние болезни) | Dr. Madina Rahimova | yes | 5 | none yet | 1: `lab_reference_ranges` |
| 7 | `dermatoloji` | doctor specialty | Dermatovenerologiya / Дерматовенерология / Дерматовенерология | Dr. Sevara Ismailova | yes | 5 | none yet | 1: `severity_indices` |
| 8 | `endokrinoloji` | doctor specialty | Endokrinologiya / Эндокринология / Эндокринология | Dr. Dilnoza Nazarova | yes | 6 | none yet | 2: `treatment_targets`, `lab_reference_ranges` |
| 9 | `enfeksiyon-hastaliklari` | doctor specialty | Yuqumli kasalliklar / Юқумли касалликлар / Инфекционные болезни | Dr. Otabek Qodirov | yes | 5 | none yet | 2: `notifiable_diseases`, `vaccination_calendar` |
| 10 | `gastroenteroloji` | doctor specialty | Gastroenterologiya / Гастроэнтерология / Гастроэнтерология | Dr. Jamshid Mirzayev | yes | 6 | none yet | 1: `endoscopy_classifications` |
| 11 | `genel-cerrahi` | doctor specialty | Umumiy xirurgiya / Умумий хирургия / Общая хирургия | Dr. Sherzod Saidov | yes | 6 | none yet | 1: `surgical_consent_form` |
| 12 | `gogus-cerrahisi` | doctor specialty | Torakal xirurgiya / Торакал хирургия / Торакальная хирургия | Dr. Farrux Holmatov | yes | 7 | none yet | 1: `surgical_consent_form` |
| 13 | `gogus-hastaliklari` | doctor specialty | Pulmonologiya / Пульмонология / Пульмонология | Dr. Gulnoza Alimova | yes | 7 | none yet | 2: `spirometry_reference`, `tb_programme` |
| 14 | `goz-hastaliklari` | doctor specialty | Oftalmologiya / Офтальмология / Офтальмология | Dr. Aziza Sodiqova | yes | 6 | none yet | 1: `acuity_notation` |
| 15 | `kadin-hastaliklari-dogum` | doctor specialty | Akusherlik va ginekologiya / Акушерлик ва гинекология / Акушерство и гинекология | Dr. Shahnoza Rasulova | yes | 6 | none yet | 2: `antenatal_schedule`, `pregnancy_record_form` |
| 16 | `kalp-damar-cerrahisi` | doctor specialty | Yurak-qon tomir xirurgiyasi / Юрак-қон томир хирургияси / Сердечно-сосудистая хирургия | Dr. Temur Karimov | yes | 7 | none yet | 2: `operative_risk_score`, `surgical_consent_form` |
| 17 | `kardiyoloji` | doctor specialty | Kardiologiya / Кардиология / Кардиология | Dr. Kamola Yusupova | yes | 8 | none yet | 2: `cv_risk_score`, `bp_lipid_targets` |
| 18 | `kulak-burun-bogaz` | doctor specialty | Otorinolaringologiya (LOR) / Оториноларингология (ЛОР) / Оториноларингология (ЛОР) | Dr. Nodir Ergashev | yes | 6 | none yet | 1: `hearing_loss_grading` |
| 19 | `nefroloji` | doctor specialty | Nefrologiya / Нефрология / Нефрология | Dr. Mohira Abdullayeva | yes | 6 | none yet | 2: `ckd_staging`, `dialysis_standards` |
| 20 | `noroloji` | doctor specialty | Nevrologiya / Неврология / Неврология | Dr. Bobur Rahimov | yes | 6 | none yet | 1: `neuro_scales` |
| 21 | `onkoloji` | doctor specialty | Onkologiya / Онкология / Онкология | Dr. Nigora Tursunova | yes | 7 | none yet | 3: `staging_system`, `treatment_regimens`, `performance_scale` |
| 22 | `ortopedi` | doctor specialty | Travmatologiya va ortopediya / Травматология ва ортопедия / Травматология и ортопедия | Dr. Ulugbek Ismailov | yes | 7 | none yet | 1: `fracture_classification` |
| 23 | `pediatri` | doctor specialty | Pediatriya / Педиатрия / Педиатрия | Dr. Malika Nazarova | yes | 8 | none yet | 4: `vaccination_calendar`, `growth_standard`, `development_milestones`, `pediatric_dosing` |
| 24 | `plastik-cerrahi` | doctor specialty | Plastik xirurgiya / Пластик хирургия / Пластическая хирургия | Dr. Barno Mirzayeva | yes | 8 | none yet | 1: `surgical_consent_form` |
| 25 | `psikiyatri` | doctor specialty | Psixiatriya / Психиатрия / Психиатрия | Dr. Zulfiya Saidova | yes | 7 | none yet | 2: `rating_scales`, `involuntary_care_law` |
| 26 | `radyoloji` | doctor specialty | Radiologiya (nur tashxisi) / Радиология (нур ташхиси) / Лучевая диагностика (радиология) | Dr. Akmal Qodirov | yes | 6 | none yet | 2: `reporting_systems`, `dose_record` |
| 27 | `romatoloji` | doctor specialty | Revmatologiya / Ревматология / Ревматология | Dr. Saodat Holmatova | yes | 6 | none yet | 1: `activity_indices` |
| 28 | `uroloji` | doctor specialty | Urologiya / Урология / Урология | Dr. Javohir Alimov | yes | 7 | none yet | 1: `symptom_questionnaires` |
| 29 | `spor-hekimligi` | doctor specialty | Sport tibbiyoti / Спорт тиббиёти / Спортивная медицина | Dr. Sanjar Sodiqov | yes | 6 | none yet | 2: `clearance_form`, `prohibited_list` |
| 30 | `fizik-tedavi` | doctor specialty | Tibbiy reabilitatsiya va fizioterapiya / Тиббий реабилитация ва физиотерапия / Медицинская реабилитация и физиотерапия | Dr. Laziz Rahimov | yes | 7 | none yet | 2: `functional_scales`, `disability_assessment` |
| 31 | `sac-ekimi` | clinic doctor | Soch koʻchirib oʻtkazish / Соч кўчириб ўтказиш / Трансплантация волос | Dr. Shohruh Karimov | yes | 7 | none yet | 2: `hair_loss_scale`, `procedure_consent_form` |
| 32 | `estetik-cerrahi` | clinic doctor | Estetik xirurgiya / Эстетик хирургия / Эстетическая хирургия | Dr. Lobar Yusupova | yes | 7 | none yet | 1: `procedure_consent_form` |
| 33 | `medikal-estetik` | clinic doctor | Kosmetologiya (estetik tibbiyot) / Косметология (эстетик тиббиёт) / Косметология (эстетическая медицина) | Dr. Feruza Rasulova | yes | 8 | none yet | 2: `registered_products`, `procedure_consent_form` |
| 34 | `klinik-dermatoloji` | clinic doctor | Dermatologiya (klinika) / Дерматология (клиника) / Дерматология (клиника) | Dr. Dilbar Ergasheva | yes | 7 | none yet | 2: `registered_products`, `severity_indices` |
| 35 | `longevity` | clinic doctor | Profilaktik va yoshga qarshi tibbiyot / Профилактик ва ёшга қарши тиббиёт / Превентивная и антивозрастная медицина | Dr. Asal Qodirova | yes | 7 | none yet | 2: `lab_reference_ranges`, `screening_programme` |
| 36 | `fizyoterapi` | clinic allied | Jismoniy reabilitatsiya mutaxassisi / Жисмоний реабилитация мутахассиси / Специалист по физической реабилитации | Fizyoterapevt Jasmina Abdullayeva | yes | 7 | none yet | 2: `functional_scales`, `scope_of_practice` |
| 37 | `klinik-psikolog` | clinic allied | Klinik psixolog / Клиник психолог / Клинический психолог | Psixolog Doniyor Saidov | yes | 7 | none yet | 2: `psychological_tests`, `scope_of_practice` |
| 38 | `diyetisyen` | clinic allied | Diyetolog / Диетолог / Диетолог | Diyetolog Mahliyo Tursunova | yes | 8 | none yet | 3: `nutrient_reference`, `growth_standard`, `scope_of_practice` |
| 39 | `ergoterapi` | clinic allied | Ergoterapevt / Эрготерапевт / Эрготерапевт | Ergoterapevt Oybek Holmatov | yes | 8 | none yet | 2: `functional_scales`, `scope_of_practice` |
| 40 | `odyoloji` | clinic allied | Audiolog / Аудиолог / Аудиолог | Audiolog Rayhon Alimova | yes | 7 | none yet | 3: `hearing_loss_grading`, `newborn_hearing_screening`, `scope_of_practice` |

### Needs local content

Every row is a slot in `countries/uz/klinik/notSablonlari.ts` (`UZ_YEREL_ICERIK`, `UZ_ORTAK_YEREL_ICERIK`): empty (`icerik: null`), switched off (`acik: false`), and read by no screen and no instruction. A slot is switched on only after a local clinician has supplied and signed its content. 75 rows. Rows 76 and 77 (slice 3, appointments) are not slots of a note template: they are local content the calendar needs, and nothing stands in for them.

| # | Role | Slot | What is missing | Who must supply it |
|---|---|---|---|---|
| 1 | all 40 roles | `diagnosis_coding` | Diagnosis coding edition and the language it is used in; procedure coding | a local clinician |
| 2 | all 40 roles | `medicines_register` | Register of medicines authorised in Uzbekistan, with local names, forms and strengths | a local clinician |
| 3 | all 40 roles | `record_forms` | Mandatory medical record forms and their fields, and the script they must be kept in | a local clinician |
| 4 | all 40 roles | `prescription_format` | Prescription format, language and rules for controlled medicines | a local clinician |
| 5 | `acil-tip` (Скорая и неотложная помощь) | `triage_scale` | Triage scale used in emergency departments in Uzbekistan (categories and criteria) | a local clinician |
| 6 | `aile-hekimligi` (Семейная медицина) | `screening_programme` | National preventive screening and check-up programme by age and sex | a local clinician |
| 7 | `aile-hekimligi` (Семейная медицина) | `vaccination_calendar` | National vaccination calendar | a local clinician |
| 8 | `anestezi` (Анестезиология и реаниматология) | `preop_risk_scale` | Anaesthetic risk classification and pre-operative fasting rules as used locally | a local clinician |
| 9 | `beyin-cerrahisi` (Нейрохирургия) | `consciousness_scale` | Consciousness (coma) scale in the Uzbek and Russian wording used locally | a local clinician |
| 10 | `beyin-cerrahisi` (Нейрохирургия) | `surgical_consent_form` | Surgical consent form and pre-operative checklist required by law | a local clinician |
| 11 | `cocuk-cerrahisi` (Детская хирургия) | `growth_standard` | Growth chart standard for children (which standard, which charts) | a local clinician |
| 12 | `cocuk-cerrahisi` (Детская хирургия) | `pediatric_dosing` | Paediatric dosing reference | a local clinician |
| 13 | `cocuk-cerrahisi` (Детская хирургия) | `surgical_consent_form` | Surgical consent form and pre-operative checklist required by law | a local clinician |
| 14 | `dahiliye` (Терапия (внутренние болезни)) | `lab_reference_ranges` | Laboratory units and reference ranges in local use | a local clinician |
| 15 | `dermatoloji` (Дерматовенерология) | `severity_indices` | Skin disease severity indices in locally validated wording | a local clinician |
| 16 | `endokrinoloji` (Эндокринология) | `treatment_targets` | Treatment targets (glucose, lipids, blood pressure) from the national protocol | a local clinician |
| 17 | `endokrinoloji` (Эндокринология) | `lab_reference_ranges` | Laboratory units and reference ranges in local use | a local clinician |
| 18 | `enfeksiyon-hastaliklari` (Инфекционные болезни) | `notifiable_diseases` | List of notifiable diseases and the mandatory report form | a local clinician |
| 19 | `enfeksiyon-hastaliklari` (Инфекционные болезни) | `vaccination_calendar` | National vaccination calendar | a local clinician |
| 20 | `gastroenteroloji` (Гастроэнтерология) | `endoscopy_classifications` | Endoscopy and liver disease classifications accepted locally | a local clinician |
| 21 | `genel-cerrahi` (Общая хирургия) | `surgical_consent_form` | Surgical consent form and pre-operative checklist required by law | a local clinician |
| 22 | `gogus-cerrahisi` (Торакальная хирургия) | `surgical_consent_form` | Surgical consent form and pre-operative checklist required by law | a local clinician |
| 23 | `gogus-hastaliklari` (Пульмонология) | `spirometry_reference` | Spirometry reference values and severity grading used locally | a local clinician |
| 24 | `gogus-hastaliklari` (Пульмонология) | `tb_programme` | National tuberculosis programme forms and regimens | a local clinician |
| 25 | `goz-hastaliklari` (Офтальмология) | `acuity_notation` | Visual acuity notation and chart in local use | a local clinician |
| 26 | `kadin-hastaliklari-dogum` (Акушерство и гинекология) | `antenatal_schedule` | Antenatal visit schedule and screening programme from the national protocol | a local clinician |
| 27 | `kadin-hastaliklari-dogum` (Акушерство и гинекология) | `pregnancy_record_form` | Mandatory pregnancy record form and its fields | a local clinician |
| 28 | `kalp-damar-cerrahisi` (Сердечно-сосудистая хирургия) | `operative_risk_score` | Operative risk score in local use for cardiac and vascular surgery | a local clinician |
| 29 | `kalp-damar-cerrahisi` (Сердечно-сосудистая хирургия) | `surgical_consent_form` | Surgical consent form and pre-operative checklist required by law | a local clinician |
| 30 | `kardiyoloji` (Кардиология) | `cv_risk_score` | Cardiovascular risk score calibrated for the region | a local clinician |
| 31 | `kardiyoloji` (Кардиология) | `bp_lipid_targets` | Blood pressure and lipid targets from the national protocol | a local clinician |
| 32 | `kulak-burun-bogaz` (Оториноларингология (ЛОР)) | `hearing_loss_grading` | Hearing loss grading in local use | a local clinician |
| 33 | `nefroloji` (Нефрология) | `ckd_staging` | Chronic kidney disease staging in local use | a local clinician |
| 34 | `nefroloji` (Нефрология) | `dialysis_standards` | Dialysis adequacy standards and record form | a local clinician |
| 35 | `noroloji` (Неврология) | `neuro_scales` | Neurological scales (stroke, disability) in validated Uzbek and Russian wording | a local clinician |
| 36 | `onkoloji` (Онкология) | `staging_system` | Tumour staging classification and edition in use | a local clinician |
| 37 | `onkoloji` (Онкология) | `treatment_regimens` | Chemotherapy and radiotherapy regimens from national protocols | a local clinician |
| 38 | `onkoloji` (Онкология) | `performance_scale` | Performance status scale in the wording used locally | a local clinician |
| 39 | `ortopedi` (Травматология и ортопедия) | `fracture_classification` | Fracture classification in local use | a local clinician |
| 40 | `pediatri` (Педиатрия) | `vaccination_calendar` | National vaccination calendar | a local clinician |
| 41 | `pediatri` (Педиатрия) | `growth_standard` | Growth chart standard for children (which standard, which charts) | a local clinician |
| 42 | `pediatri` (Педиатрия) | `development_milestones` | Developmental milestone checklist in local use | a local clinician |
| 43 | `pediatri` (Педиатрия) | `pediatric_dosing` | Paediatric dosing reference | a local clinician |
| 44 | `plastik-cerrahi` (Пластическая хирургия) | `surgical_consent_form` | Surgical consent form and pre-operative checklist required by law | a local clinician |
| 45 | `psikiyatri` (Психиатрия) | `rating_scales` | Psychiatric rating scales in validated Uzbek and Russian versions | a local clinician |
| 46 | `psikiyatri` (Психиатрия) | `involuntary_care_law` | Legal procedure for involuntary assessment and treatment | a local clinician |
| 47 | `radyoloji` (Лучевая диагностика (радиология)) | `reporting_systems` | Structured radiology reporting classifications accepted locally | a local clinician |
| 48 | `radyoloji` (Лучевая диагностика (радиология)) | `dose_record` | Radiation dose recording requirements | a local clinician |
| 49 | `romatoloji` (Ревматология) | `activity_indices` | Rheumatic disease activity indices in validated local wording | a local clinician |
| 50 | `uroloji` (Урология) | `symptom_questionnaires` | Urological symptom questionnaires in validated Uzbek and Russian versions | a local clinician |
| 51 | `spor-hekimligi` (Спортивная медицина) | `clearance_form` | Pre-participation medical clearance form required for athletes | a local clinician |
| 52 | `spor-hekimligi` (Спортивная медицина) | `prohibited_list` | Anti-doping prohibited list reference | a local clinician |
| 53 | `fizik-tedavi` (Медицинская реабилитация и физиотерапия) | `functional_scales` | Functional independence and disability scales in validated local wording | a local clinician |
| 54 | `fizik-tedavi` (Медицинская реабилитация и физиотерапия) | `disability_assessment` | Medical-social (disability) assessment forms | a local clinician |
| 55 | `sac-ekimi` (Трансплантация волос) | `hair_loss_scale` | Hair loss classification scale in local use | a local clinician |
| 56 | `sac-ekimi` (Трансплантация волос) | `procedure_consent_form` | Consent form for an aesthetic procedure as required by law | a local clinician |
| 57 | `estetik-cerrahi` (Эстетическая хирургия) | `procedure_consent_form` | Consent form for an aesthetic procedure as required by law | a local clinician |
| 58 | `medikal-estetik` (Косметология (эстетическая медицина)) | `registered_products` | Injectable products and devices registered in Uzbekistan | a local clinician |
| 59 | `medikal-estetik` (Косметология (эстетическая медицина)) | `procedure_consent_form` | Consent form for an aesthetic procedure as required by law | a local clinician |
| 60 | `klinik-dermatoloji` (Дерматология (клиника)) | `registered_products` | Injectable products and devices registered in Uzbekistan | a local clinician |
| 61 | `klinik-dermatoloji` (Дерматология (клиника)) | `severity_indices` | Skin disease severity indices in locally validated wording | a local clinician |
| 62 | `longevity` (Превентивная и антивозрастная медицина) | `lab_reference_ranges` | Laboratory units and reference ranges in local use | a local clinician |
| 63 | `longevity` (Превентивная и антивозрастная медицина) | `screening_programme` | National preventive screening and check-up programme by age and sex | a local clinician |
| 64 | `fizyoterapi` (Специалист по физической реабилитации) | `functional_scales` | Functional independence and disability scales in validated local wording | a local clinician |
| 65 | `fizyoterapi` (Специалист по физической реабилитации) | `scope_of_practice` | What this allied profession may record and decide without a doctor under Uzbek law | a local clinician |
| 66 | `klinik-psikolog` (Клинический психолог) | `psychological_tests` | Psychological tests in validated Uzbek and Russian versions | a local clinician |
| 67 | `klinik-psikolog` (Клинический психолог) | `scope_of_practice` | What this allied profession may record and decide without a doctor under Uzbek law | a local clinician |
| 68 | `diyetisyen` (Диетолог) | `nutrient_reference` | Nutrient reference intakes and food composition tables for Uzbekistan | a local clinician |
| 69 | `diyetisyen` (Диетолог) | `growth_standard` | Growth chart standard for children (which standard, which charts) | a local clinician |
| 70 | `diyetisyen` (Диетолог) | `scope_of_practice` | What this allied profession may record and decide without a doctor under Uzbek law | a local clinician |
| 71 | `ergoterapi` (Эрготерапевт) | `functional_scales` | Functional independence and disability scales in validated local wording | a local clinician |
| 72 | `ergoterapi` (Эрготерапевт) | `scope_of_practice` | What this allied profession may record and decide without a doctor under Uzbek law | a local clinician |
| 73 | `odyoloji` (Аудиолог) | `hearing_loss_grading` | Hearing loss grading in local use | a local clinician |
| 74 | `odyoloji` (Аудиолог) | `newborn_hearing_screening` | Newborn hearing screening programme | a local clinician |
| 75 | `odyoloji` (Аудиолог) | `scope_of_practice` | What this allied profession may record and decide without a doctor under Uzbek law | a local clinician |
| 76 | all 40 roles (calendar) | `public_holidays` | Public holidays of Uzbekistan for each year: the fixed dates, the two religious holidays whose dates move every year, and the working days the government transfers. **Nothing is hard-coded**: the calendar treats a holiday as an ordinary day and the working-pattern screen says so. Needs an official source and somebody who updates it every year. | a local source and a yearly owner |
| 77 | all 40 roles (calendar) | `working_week` | The usual working week, hours, lunch break and appointment length of a private clinic. The pack's values (Monday to Friday, 09:00–18:00, break 13:00–14:00, 30 minutes) are starting values, not checked locally; every account can change its own. | the clinical lead |

### Assistant names in the three forms, and the forms that look doubtful

All 40 as the screens show them. The Cyrillic and Russian columns are produced by rule from the owner's Latin spelling.

| Role | As the owner wrote it (Uzbek Latin, shown as stored) | Uzbek Cyrillic, derived | Russian, derived |
|---|---|---|---|
| `acil-tip` | Dr. Jasur Tursunov | Др. Жасур Турсунов | Др. Жасур Турсунов |
| `aile-hekimligi` | Dr. Nilufar Karimova | Др. Нилуфар Каримова | Др. Нилуфар Каримова |
| `anestezi` | Dr. Bekzod Yusupov | Др. Бекзод Юсупов | Др. Бекзод Юсупов |
| `beyin-cerrahisi` | Dr. Alisher Ergashev | Др. Алишер Эргашев | Др. Алишер Эргашев |
| `cocuk-cerrahisi` | Dr. Sardor Abdullayev | Др. Сардор Абдуллаев | Др. Сардор Абдуллаев |
| `dahiliye` | Dr. Madina Rahimova | Др. Мадина Раҳимова | Др. Мадина Рахимова |
| `dermatoloji` | Dr. Sevara Ismailova | Др. Севара Исмаилова | Др. Севара Исмаилова |
| `endokrinoloji` | Dr. Dilnoza Nazarova | Др. Дилноза Назарова | Др. Дилноза Назарова |
| `enfeksiyon-hastaliklari` | Dr. Otabek Qodirov | Др. Отабек Қодиров | Др. Отабек Кодиров |
| `gastroenteroloji` | Dr. Jamshid Mirzayev | Др. Жамшид Мирзаев | Др. Жамшид Мирзаев |
| `genel-cerrahi` | Dr. Sherzod Saidov | Др. Шерзод Саидов | Др. Шерзод Саидов |
| `gogus-cerrahisi` | Dr. Farrux Holmatov | Др. Фаррух Ҳолматов | Др. Фаррух Холматов |
| `gogus-hastaliklari` | Dr. Gulnoza Alimova | Др. Гулноза Алимова | Др. Гулноза Алимова |
| `goz-hastaliklari` | Dr. Aziza Sodiqova | Др. Азиза Содиқова | Др. Азиза Содикова |
| `kadin-hastaliklari-dogum` | Dr. Shahnoza Rasulova | Др. Шаҳноза Расулова | Др. Шахноза Расулова |
| `kalp-damar-cerrahisi` | Dr. Temur Karimov | Др. Темур Каримов | Др. Темур Каримов |
| `kardiyoloji` | Dr. Kamola Yusupova | Др. Камола Юсупова | Др. Камола Юсупова |
| `kulak-burun-bogaz` | Dr. Nodir Ergashev | Др. Нодир Эргашев | Др. Нодир Эргашев |
| `nefroloji` | Dr. Mohira Abdullayeva | Др. Моҳира Абдуллаева | Др. Мохира Абдуллаева |
| `noroloji` | Dr. Bobur Rahimov | Др. Бобур Раҳимов | Др. Бобур Рахимов |
| `onkoloji` | Dr. Nigora Tursunova | Др. Нигора Турсунова | Др. Нигора Турсунова |
| `ortopedi` | Dr. Ulugbek Ismailov | Др. Улугбек Исмаилов | Др. Улугбек Исмаилов |
| `pediatri` | Dr. Malika Nazarova | Др. Малика Назарова | Др. Малика Назарова |
| `plastik-cerrahi` | Dr. Barno Mirzayeva | Др. Барно Мирзаева | Др. Барно Мирзаева |
| `psikiyatri` | Dr. Zulfiya Saidova | Др. Зулфия Саидова | Др. Зулфия Саидова |
| `radyoloji` | Dr. Akmal Qodirov | Др. Акмал Қодиров | Др. Акмал Кодиров |
| `romatoloji` | Dr. Saodat Holmatova | Др. Саодат Ҳолматова | Др. Саодат Холматова |
| `uroloji` | Dr. Javohir Alimov | Др. Жавоҳир Алимов | Др. Жавохир Алимов |
| `spor-hekimligi` | Dr. Sanjar Sodiqov | Др. Санжар Содиқов | Др. Санжар Содиков |
| `fizik-tedavi` | Dr. Laziz Rahimov | Др. Лазиз Раҳимов | Др. Лазиз Рахимов |
| `sac-ekimi` | Dr. Shohruh Karimov | Др. Шоҳруҳ Каримов | Др. Шохрух Каримов |
| `estetik-cerrahi` | Dr. Lobar Yusupova | Др. Лобар Юсупова | Др. Лобар Юсупова |
| `medikal-estetik` | Dr. Feruza Rasulova | Др. Феруза Расулова | Др. Феруза Расулова |
| `klinik-dermatoloji` | Dr. Dilbar Ergasheva | Др. Дилбар Эргашева | Др. Дилбар Эргашева |
| `longevity` | Dr. Asal Qodirova | Др. Асал Қодирова | Др. Асал Кодирова |
| `fizyoterapi` | Fizyoterapevt Jasmina Abdullayeva | Физётерапевт Жасмина Абдуллаева | Физётерапевт Жасмина Абдуллаева |
| `klinik-psikolog` | Psixolog Doniyor Saidov | Психолог Дониёр Саидов | Психолог Дониёр Саидов |
| `diyetisyen` | Diyetolog Mahliyo Tursunova | Диетолог Маҳлиё Турсунова | Диетолог Махлиё Турсунова |
| `ergoterapi` | Ergoterapevt Oybek Holmatov | Эрготерапевт Ойбек Ҳолматов | Эрготерапевт Ойбек Холматов |
| `odyoloji` | Audiolog Rayhon Alimova | Аудиолог Райҳон Алимова | Аудиолог Райхон Алимова |

For the native reader. These are observations by the machine that wrote the rule, **not corrections: nothing was changed**, and the owner's list stays authoritative.

| What | Derived form | Why it looks doubtful |
|---|---|---|
| Title `Fizyoterapevt` (owner asked; left exactly as written) | Физётерапевт | The rule reads "yo" as «ё». The word is usually written «Физиотерапевт» (Latin `Fizioterapevt`). |
| Title `Dr.` | Др. | Whether a Cyrillic text writes «Др.», «Д-р» or no title at all. The owner decides "Dr." or "Prof." separately. |
| `Holmatov`, `Holmatova` (3 names) | Ҳолматов(а); Russian Холматов(а) | The rule maps `h` to «ҳ». The surname is usually «Холматов» in Uzbek Cyrillic (Latin `Xolmatov`). The Russian form comes out as usual. |
| `Shohruh` | Шоҳруҳ; Russian Шохрух | Usually «Шоҳрух» in Uzbek Cyrillic (Latin `Shohrux`). The Russian form comes out as usual. |
| `Ulugbek` | Улугбек | Usually «Улуғбек» in Uzbek Cyrillic (Latin `Ulugʻbek`). The Russian form is as usual. |
| `Ismailov`, `Ismailova` | Исмаилов(а) | Usually «Исмоилов(а)» in Uzbek Cyrillic (Latin `Ismoilov`). The Russian form is as usual. |
| `Qodirov`, `Qodirova` (4 names), Russian | Кодиров(а) | Russian texts also write «Кадыров(а)». |
| `Sodiqov`, `Sodiqova`, Russian | Содиков(а) | Russian texts also write «Садыков(а)». |
| `Zulfiya`, `Dilnoza`, `Dilbar`, `Gulnoza`, `Akmal`, `Asal`, Russian | Зулфия, Дилноза, Дилбар, Гулноза, Акмал, Асал | Russian spelling often has a soft sign: «Зульфия», «Дильноза», «Дильбар», «Гульноза», «Акмаль», «Асаль». The rule cannot add one. |
| `Otabek`, `Bobur`, `Temur`, `Nodir`, `Doniyor`, `Oybek`, Russian | Отабек, Бобур, Темур, Нодир, Дониёр, Ойбек | Russian texts also write «Атабек», «Бабур», «Тимур», «Надир», «Данияр», «Айбек». |

Role names (written by machine in each form, not derived) that the machine is least sure of:

| Role | Name as written (Uzbek Latin / Uzbek Cyrillic / Russian) | Doubt |
|---|---|---|
| `fizyoterapi` | Jismoniy reabilitatsiya mutaxassisi / Жисмоний реабилитация мутахассиси / Специалист по физической реабилитации | What the non-doctor profession is called locally («физиотерапевт» is a doctor in Russian usage). The owner's title for this role is "Fizyoterapevt". |
| `fizik-tedavi` | Tibbiy reabilitatsiya va fizioterapiya / Тиббий реабилитация ва физиотерапия / Медицинская реабилитация и физиотерапия | The official name of the doctor's specialty. |
| `klinik-dermatoloji` | Dermatologiya (klinika) / Дерматология (клиника) / Дерматология (клиника) | A name made up to tell it from `dermatoloji` (Dermatovenerologiya). |
| `longevity` | Profilaktik va yoshga qarshi tibbiyot / Профилактик ва ёшга қарши тиббиёт / Превентивная и антивозрастная медицина | No established local name. |
| `sac-ekimi` | Soch koʻchirib oʻtkazish / Соч кўчириб ўтказиш / Трансплантация волос | Or "soch transplantatsiyasi", or trichology. |
| `medikal-estetik` | Kosmetologiya (estetik tibbiyot) / Косметология (эстетик тиббиёт) / Косметология (эстетическая медицина) | Which of the two words doctors use. |
| `acil-tip` | Shoshilinch tibbiy yordam / Шошилинч тиббий ёрдам / Скорая и неотложная помощь | Or "tez tibbiy yordam". |
| `aile-hekimligi` | Oilaviy tibbiyot / Оилавий тиббиёт / Семейная медицина | The official specialty may be "general practice". |
| `dahiliye` | Terapiya (ichki kasalliklar) / Терапия (ички касалликлар) / Терапия (внутренние болезни) | Which of the two is the usual name. |
| `radyoloji` | Radiologiya (nur tashxisi) / Радиология (нур ташхиси) / Лучевая диагностика (радиология) | Order and choice of the two words. |
| `gogus-cerrahisi`, `plastik-cerrahi` | Torakal xirurgiya, Plastik xirurgiya / Торакал хирургия, Пластик хирургия | Uzbek Cyrillic adjective forms. |
| `diyetisyen`, `odyoloji` | Diyetolog, Audiolog / Диетолог, Аудиолог | Spelling "diyetolog" or "dietolog"; "audiolog" or "surdolog". |

### What was tested in slice 2, and how

| Check | Result | Against |
|---|---|---|
| Country suite (`npm run test:ulke`), 611 tests | pass | stand-in database, auth, storage, speech and model providers inside the test process |
| For each of the 40 roles (`countries/uz/klinik/roller.test.ts`, `sablonlar.test.ts`): account created with the role; home shows that role's assistant; a visit produces a draft in that role's template; no field of another role is stored, returned or drawn | pass | the model stand-in answers with every field of every role and a made-up key |
| Leak test over role names, field labels, new screen text and all 120 instructions (40 roles, three forms); no Turkish letter | pass | the leak harness and Türkiye's term list |
| Wall check, type check | clean | the repository |
| Uzbek production build (`NOTYA_COUNTRY=uz npm run build`) | passes; the build holds the Uzbek pack and no other | this machine |
| Browser walk-through (`scripts/ulke-yuruyus/`), 280 checks: the role question at first login, a paediatric visit, the role changed to cardiology in settings and a cardiology visit to an approved note, a dietitian (allied role, Russian) visit to an approved note | passes | the Uzbek production build, a headless browser, stand-in Supabase, stand-in providers loaded into the server; the model stand-in answers with fields of several roles and a made-up key |

**Tested only with stand-ins.** No real provider was called; no audio or patient text left the machine.

### Files added or changed by slice 2

| What | Where |
|---|---|
| Role names, assistant identity, script conversion | `countries/uz/klinik/rolAdlari.ts`, `asistanKimligi.ts`, `countries/uz/yozuv.ts` |
| Templates, slots, instructions | `countries/uz/klinik/notSablonlari.ts`, `talimatlar.ts`, `branslar.ts`, `index.ts` |
| Screens | `countries/uz/uygulama/RolFormu.tsx`, `Asistan.tsx` (new); `Baslangic.tsx`, `Ayarlar.tsx`, `Bugun.tsx`, `Muayene.tsx`, `Not.tsx`, `Kabuk.tsx`, `metinler.ts`, `uygulama.css` |
| Core, country-neutral | `lib/ulke/uygulama/rol.ts` (new); `lib/ulke/tipler.ts`, `lib/ulke/uygulama/notlar.ts`, `notModeli.ts`, `muayeneKaydi.ts` |
| Route | `app/api/ulke/rol/route.ulke.ts` (new) |
| Migration (not applied) | `lib/db/migrations/134_hekim_rolu.sql`: new table `hekim_rolu`; two nullable columns on the country table `not_dil_kaydi` |
| Tests, walk-through | `countries/uz/klinik/roller.test.ts`, `sablonlar.test.ts` (new); slice-1 tests updated; `scripts/ulke-yuruyus/` |
| What remains | `docs/OPEN-COMMITMENTS.md`, section NOTYA-UZ-BRANSLAR-01 |

## Slice 3: appointments (2026-10-08)

Third slice of Kaan's "Just build the uzbek one completely now". Branch `feat/uz-randevu`, stacked on `feat/uz-branslar` (PR #569); pull request #570, base `feat/uz-branslar`, never `main`. **Unmerged. Nothing deployed. Migration 135 is written and not applied to any Supabase project or remote database. No Turkish screen or content file was edited.**

### Fix carried over from slice 2: approval is all or nothing

Approving a note used to write its role fields in a second statement after the approval. It is now **one call to one database function**, `ulke_not_onayla` (migration 135), which writes the note's text and approval, its role fields (and the exchange of the two drafts when the other one is approved) and "done" on the appointment the visit was started from, in one transaction. The application makes no other write while approving. A test makes the function fail at its second statement and at its third: the note stays unapproved and every row is as it was. **Consequence: without migration 135 no note can be approved in an Uzbek build.**

### What appointments do, all under `/uzbek`

| Step | Where | What it does |
|---|---|---|
| Working pattern | `/uzbek/calendar?duzen=1` | Working days (Monday first), working hours, default appointment length, up to four breaks. Until an account saves its own, the pack's applies. Times are Tashkent time. The screen says that public holidays are not taken into account. |
| Calendar, day | `/uzbek/calendar[?gun=YYYY-MM-DD]` | The day as a list: appointments, breaks, and the free times of the working pattern. A free time opens the booking form for that time. |
| Calendar, week | `/uzbek/calendar?gun=…&gorunum=hafta` | Seven days from Monday, each with its appointments. Seven columns on a wide screen, stacked on a phone. |
| Booking | `/uzbek/calendar?yeni=1`, from a free time, from the "+" of a day, or from the patient's file | Patient, day (typed `DD.MM.YYYY`), time, length, a short reason. |
| One appointment | `/uzbek/calendar?randevu=<id>` | Status, "start the visit", move to another time, cancel, the reminder text. |
| Home | `/uzbek/today` | Today's appointments in time order with their status, each with "start the visit" where that is possible. Visits of today stay listed below. |
| Patient file | `/uzbek/patient?id=` | "Book an appointment" for that patient; the coming appointments. |

Rules, each enforced by the server and tested:

- **No double booking of the same doctor.** The guarantee is the database's: a constraint refuses two appointments of one doctor whose times overlap while both still hold their time (planned, arrived, done). Two requests at the same moment cannot both win. The answer is a clear sentence in the doctor's language, and there is **no way round it**.
- **Working hours.** Outside the working days, the hours or in a break, nothing is written and the screen says so, with an explicit **"book anyway"**; an appointment booked that way is marked.
- **Status:** planned, arrived, done, did not come, cancelled. "Did not come" and "cancelled" give the time back. "Cancelled" and "done" are final (a "done" set by hand on an appointment without a visit can be taken back). Only a planned or arrived appointment can be moved.
- **From appointment to visit.** "Start the visit" opens the visit screen for that patient, shows which appointment it is, and the stored visit is linked to it (the patient is marked as arrived). **Approving the note marks the appointment done**, in the same transaction as the approval. If the appointment was cancelled meanwhile, the visit is kept and not linked: a recording is never thrown away over its appointment.
- **Time.** An appointment is stored as an instant. Every day and hour on the screens is the pack's time zone (Asia/Tashkent), converted through the time-zone database, never a fixed number of hours; the server's and the browser's own zones play no part. The week starts on Monday. A day is typed and shown as `DD.MM.YYYY`; `31.02.2027` is refused, not guessed.
- **Isolation.** A doctor sees and changes only their own appointments and can book only their own patients. Another doctor's appointment id answers exactly like one that does not exist (404, same body), on every route, in both directions. Another doctor's appointment does not even make a time look taken.
- **Reminder text.** One button on a planned appointment copies a short reminder for the doctor to paste into whatever messenger they use: date (`DD.MM.YYYY`), time (24 hours) and the doctor's name, in the **patient's** language — Russian for a Russian-speaking patient; Uzbek in the doctor's script (of the interface, else of the notes, else Latin) for an Uzbek-speaking one. **Nothing is sent**: no messaging provider is connected, and the walk-through checks that the click makes no request at all.

### Left off in this slice

Not built, not half-built, and a test fails if a route for one appears in the Uzbek build: **Google Calendar sync, patient self-booking, automatic reminders and any messaging provider, clinic-wide calendars with several doctors** (and a front desk booking for a doctor). Also not here: public holidays (row 76 of "Needs local content"), different hours per weekday, one-off days off or leave, repeating appointments, a waiting list.

### What is machine-written in slice 3

| What | Where | Who must read it |
|---|---|---|
| About 120 strings of the appointment screens, three forms, each written by hand | `countries/uz/uygulama/randevuMetinleri.ts` | A native speaker |
| **The reminder sentences (patient-facing)**, three forms | the same file, `hatirlatma.metin`, `hatirlatma.metinAdsiz` | A native speaker, **first**: a patient reads these under the doctor's name |
| Weekday names, short and long, three forms | the same file | A native speaker (the short Uzbek forms `Du Se Chor Pay Ju Shan Yak` are the machine's choice) |

The reminder as it stands, for 9 October 2026 at 14:30 and a doctor named Karimov Alisher:

| Form | Text |
|---|---|
| Uzbek, Latin | Assalomu alaykum! Eslatma: siz 09.10.2026 kuni soat 14:30 da shifokor Karimov Alisher qabuliga yozilgansiz. |
| Uzbek, Cyrillic | Ассалому алайкум! Эслатма: сиз 09.10.2026 куни соат 14:30 да шифокор Каримов Алишер қабулига ёзилгансиз. |
| Russian | Здравствуйте! Напоминаем: вы записаны на приём к врачу Каримов Алишер 09.10.2026 в 14:30. |

The doctor's name is put in as the account wrote it, in whatever script; it is not converted or declined.

### Migrations 130–135 on a real PostgreSQL, and what that did not cover

The Uzbek migrations had never run on a database. On 2026-10-08 migrations **130 to 135 were run, in order, twice**, on a throwaway **PostgreSQL 18.4 inside the build machine**, followed by 59 checks. All passed; **no SQL error was found in any migration file** (only the comment at the top of 135 was changed afterwards). Nothing was applied to a Supabase project or to any remote database.

How to run it again (it needs the npm package `embedded-postgres`, which is **not** a dependency of the repository and must be installed outside it, in a folder an unprivileged user can enter, because PostgreSQL refuses to run as root):

```
mkdir /var/tmp/notya-pg-check && cd /var/tmp/notya-pg-check && npm init -y && npm install embedded-postgres pg
node <repo>/scripts/ulke-goc-kaniti.mjs        # exit code 0 = every check passed; NOTYA_PG_PORT changes the port (54391)
```

What the checks cover: each file runs twice without error; the double-booking constraint (same time, overlapping, a longer one around, a move, a status change back onto a taken time; touching times and another doctor are allowed; **two open transactions for the same time — the second waits and is refused when the first commits**); the check constraints; `ulke_not_onayla` (approved; already approved; another doctor's note; **a failure in the middle leaves every row unchanged**; the exchange of the two drafts; a missing language record; two approvals at the same moment; only the service role may call it); row-level security on the two new tables (a doctor reads only their own rows and cannot write from the browser).

**Stubs.** A Supabase project brings objects the migrations expect. In that run each was the smallest thing that lets the SQL execute:

| Stub | What it stood in for |
|---|---|
| Roles `anon`, `authenticated`, `service_role` (the last with BYPASSRLS and all table privileges) | Supabase's roles and their default grants |
| Schema `auth`, table `auth.users(id)`, function `auth.uid()` reading the setting `request.jwt.claim.sub` | Supabase Auth |
| Schema `storage`, tables `storage.buckets` and `storage.objects` (row-level security on), function `storage.foldername(text)` | Supabase Storage |
| `public.patients`, `public.sessions`, `public.notes` with only the columns these migrations and the function use | the core tables of the product (every migration below 128) |
| `public.schema_migrations` | the migration ledger |
| An owner policy and a read grant on `public.patients` | migration 052 and the product's own policies |

**Not covered, so the first run on the real Uzbek database must watch for it:**

1. **Migrations 128 and 129** (they alter the core `users` table and add the invitation codes) and **every migration below 128** were not run at all. The Uzbek database needs the whole chain.
2. **The real core tables.** `ulke_not_onayla` writes six columns of `notes`; the stub had exactly those. A constraint, trigger or column type on the real `notes`, `sessions` or `patients` was not exercised.
3. **PostgREST.** The application calls the function through `supabase.rpc`; the proof called it in SQL. The argument names, the JSON argument and the text answer were not sent through PostgREST. First call on a scratch project: approve one synthetic note.
4. **Supabase's real roles and default privileges.** Whether `service_role` may execute the function and whether the browser roles may not was checked against the stubs' grants. Check `has_function_privilege` on the real project.
5. **Storage.** The bucket and its upload policy (migration 132) ran against stub tables: the real storage schema, its own policies and `storage.foldername` were not exercised.
6. **The `btree_gist` extension** is created by migration 135 (`create extension if not exists`). It is available on Supabase; on the real project it must be allowed for the role that applies migrations.
7. **Row-level security of 130–134** beyond one insert per table, and migration 052's restrictive policy on the older tables.

Order for the first real run: an empty scratch Supabase project, all migrations through 135, `node scripts/ulke-goc-kaniti.mjs` again locally for comparison, then one booking, one double booking and one approval through the application with synthetic data.

### What was tested in slice 3, and how

| Check | Result | Against |
|---|---|---|
| Country suite (`npm run test:ulke`), 666 tests, of which 53 are new in `countries/uz/uygulama/randevu.test.ts` and 2 in `not.test.ts` | pass | stand-in database, auth, storage, speech and model providers inside the test process |
| No double booking — also two, and five, requests at the same moment, and two moves onto one free time | pass | the stand-in plays migration 135's constraint inside the statement; the test proves both requests reached the insert |
| Working-hours rule; "book anyway" for hours only | pass | as above |
| Time zone: around midnight, New Year's night, a day typed `DD.MM.YYYY`; the test process itself runs in America/Los_Angeles | pass | pure functions and routes |
| Status changes; appointment-to-visit link; approval marks done; all-or-nothing reaches the appointment | pass | as above |
| Isolation, both directions, every appointment route; every statement on the appointment table carries the caller's id | pass | two synthetic doctors |
| Reminder text in each language and script, 27 combinations of patient language and the doctor's two forms; no Turkish word or letter | pass | pure function |
| Leak test over every new string in all three forms; each form in its own script | pass | the leak harness and Türkiye's term list |
| Every link on every new screen leads to a page the pack lists and that has a route file | pass | the rendered screens in three forms |
| Wall check, type check | clean | the repository |
| Uzbek production build (`NOTYA_COUNTRY=uz npm run build`) | passes; the build holds the Uzbek pack and no other | this machine |
| Turkish tool-list test (`lib/doktor/doktorAraclariUlke.test.ts`) | pass | the repository |
| Browser walk-through (`scripts/ulke-yuruyus/`), 344 checks: set working hours, book from the calendar, taken and outside-hours answers, copy a reminder in Russian, move, start the visit from the appointment, approve the note, the appointment done, week view, home, a phone | passes | the Uzbek production build, a headless browser, stand-in Supabase, stand-in providers loaded into the server |
| Migrations 130–135, constraint and function | pass, 59 checks | a throwaway local PostgreSQL 18.4, Supabase objects stubbed (above) |

**Tested only with stand-ins**, apart from the local PostgreSQL run. No provider was called; no audio or patient text left the machine. The full Turkish suite was not re-run: no Turkish code was edited (the two shared files touched are `package.json`, one test file added to two lists, and `lib/security/hastaIzolasyonEnvanteri.ts`, three routes registered).

### Files added or changed by slice 3

| What | Where |
|---|---|
| Pack: appointment norms, feature, route | `countries/uz/index.ts` |
| Pack: text, reminder, screens | `countries/uz/uygulama/randevuMetinleri.ts`, `hatirlatma.ts`, `Takvim.tsx`, `randevuOrtak.tsx` (new); `Kabuk.tsx`, `Bugun.tsx`, `Hastalar.tsx`, `Muayene.tsx`, `index.tsx`, `uygulama.css` |
| Core, country-neutral | `lib/ulke/uygulama/zaman.ts`, `calismaDuzeni.ts`, `randevular.ts`, `randevuDurumu.ts` (new); `notlar.ts`, `muayeneKaydi.ts`, `lib/ulke/tipler.ts` |
| Routes | `app/calendar/page.ulke.tsx`, `app/api/ulke/calisma-duzeni/`, `randevu/`, `randevular/` (new); `app/api/ulke/bugun/`, `muayene/` |
| Migration (not applied) | `lib/db/migrations/135_ulke_randevu.sql`: two new tables, the constraint, the function |
| Tests, walk-through, proof | `countries/uz/uygulama/randevu.test.ts` (new); `not.test.ts`, `muayene.test.ts`, `uygulama.test.ts`, `lib/ulke/ulkeEkranlari.uz.test.ts`, `lib/ulke/testing/sahteVeritabani.ts`; `scripts/ulke-yuruyus/`; `scripts/ulke-goc-kaniti.mjs` (new) |
| What remains | `docs/OPEN-COMMITMENTS.md`, section NOTYA-UZ-RANDEVU-01 |

## Decisions by Kaan (2026-10-08)

- Uzbekistan is the first country after Türkiye; Azerbaijan and the UAE follow.
- Uzbek is the main language and Russian the alternative; his figure is about 80% of visits in Uzbek and 20% in Russian.
- The system records the visit and recognises its language; the doctor chooses the language of the visit report; language choices, including prescription language, are offered at setup.
- Ayşe's Uzbek voice uses ElevenLabs Eleven v4 Turbo.
- A full Uzbek landing page, with login to the Uzbek version through it.
- Scope is all 30 specialties and all clinic types, with every core and specialty tool audited for the Uzbek system, Türkiye-only tools removed and Uzbek-specific tools added.
- Ayşe must be a senior professor with 20+ years of Uzbek practice.
- Nothing Turkish may appear in Uzbek Notya.
- Structure: one repository with walled areas, separate deployment ~~and database~~ per country, core shared.
- **Changed later the same day (19:09): "use the same database as what we are using for notya turkiye".** Every country shares Türkiye's database; a country keeps its own deployment. And: "Make this a template so that we can do US, UK, Canada, Australia, and New Zeland possibly tomorrow" (the country kit, `docs/COUNTRY-PACK-HOWTO.md`).
- No separate Uzbek address: each country is a folder in the repository and a path on the main site; the Uzbek product is reached at `notya.io/uzbek`.
- Visit transcription for Uzbekistan: ElevenLabs Scribe `scribe_v2`; language predicted on the first pass and stored with its probability; one second pass with the language forced to the doctor's note language when confidence is low; never more than two passes; the second pass is recorded so cost can be counted.
- The note is written in the doctor's chosen note language; one click rewrites it in the other language as a second draft; an approved note is never silently overwritten.
- First slice of specialties: pediatrics and one general template for every other specialty; the full list stays structured but off.
- Later the same day: "Just build the uzbek one completely now." All 40 roles get a role choice, an assistant name and a note template (slice 2). He supplied one assistant name per role.
- Slice 3 of the same instruction: appointments (working pattern, calendar, booking, status, visit from an appointment, reminder text copied by the doctor). Google Calendar sync, patient self-booking, automatic reminders and clinic-wide calendars are left off; public holidays are local content and are not hard-coded.

## Proposals from Claude, not yet confirmed by Kaan

- Second speech pass only on low confidence.
- One question at setup, finer choices in settings.
- Patient language per patient.
- Voice profile and image evaluation off in Uzbekistan until the law is confirmed.
- All 30 specialties structured from day one but each switched on only after its local reviewer signs off.
- Sign-up by invitation until the gates pass.

Defaults chosen while building slice 1. Each is a setting or a small change; each needs Kaan, and where marked a lawyer or the clinical lead, to confirm:

| Default | Where | Who must confirm |
|---|---|---|
| **The recording is deleted as soon as it has been transcribed, in every case** (success, refusal or failure). Only the transcript and the note are kept. | `lib/ulke/uygulama/muayeneKaydi.ts` | **Kaan and a lawyer**: whether Uzbek law requires, allows or forbids keeping the audio of a visit, and for how long (checklist A3, G7). Until then nothing is kept. |
| Consent sentence beside the tick-box ("The patient or their legal representative has agreed to the conversation being recorded"), in three forms. Draft. | `countries/uz/uygulama/metinler.ts` → `muayene.riza` | A lawyer (checklist A3, I1). It covers recording only: nothing yet tells the patient that the text is processed by AI or sent abroad. |
| Low-confidence thresholds: language probability below 0.80, or average word log-probability below −0.36. Starting values, not measured. | `countries/uz/klinik/index.ts` | Kaan, after the speech test on real clinic audio (checklist A5, L1). |
| "Confidence stayed low" means: the kept transcript's words are below the threshold, or the kept transcript is the first pass and its language was below the threshold. | `lib/ulke/uygulama/konusmaTanima.ts` | Kaan |
| The patient must be chosen before a visit is recorded. | visit screen | Kaan |
| ~~Pediatrics is preselected for a patient under 18.~~ Replaced in slice 2: the template is the account's role and is not chosen per visit. | visit screen | Kaan |
| All 40 role templates are switched on without a local reviewer's sign-off (the owner's instruction for slice 2). | `countries/uz/klinik/branslar.ts`, `notSablonlari.ts` | the clinical lead (checklist C14) |
| Guardian wording and the "who gave the history" field for a patient under 18 on the day of the visit, in every role. | `countries/uz/klinik/notSablonlari.ts` | A lawyer: the age (checklist B12) |
| ~~Approving a note writes its role fields in a second statement after the approval itself.~~ Fixed in slice 3: approval is one database function (migration 135). | `lib/ulke/uygulama/notlar.ts` | — |
| Appointment norms until an account saves its own: Monday to Friday, 09:00–18:00, break 13:00–14:00, 30 minutes; lengths offered 10, 15, 20, 30, 45, 60, 90 minutes. | `countries/uz/index.ts` | the clinical lead (checklist J4) |
| "Did not come" and "cancelled" give the time back; "cancelled" and "done" are final; only a planned or arrived appointment can be moved; no booking before today or more than two years ahead. | `lib/ulke/uygulama/randevular.ts` | Kaan |
| The reminder is offered for a planned appointment only; its Uzbek script follows the doctor, because a patient's script is not recorded. | `countries/uz/uygulama/hatirlatma.ts` | Kaan |
| The reason for an appointment is stored encrypted; its time and status are not. | `lib/ulke/uygulama/randevular.ts`, migration 135 | A lawyer (checklist G7, I6) |
| What is sent to the model: the transcript, the patient's age and sex. Never the name, phone, identity number or any id. | `lib/ulke/uygulama/notlar.ts` | A lawyer: the transcript itself is health data and goes to providers outside Uzbekistan (checklist A1, I6). |
| A second click on "rewrite" returns the existing second draft instead of making a new one. | `lib/ulke/uygulama/notlar.ts` | Kaan |
| Approving the second draft keeps the first draft beside the note (not shown after approval). | `lib/ulke/uygulama/notlar.ts`, migration 133 | Kaan: keep or delete unapproved drafts (checklist G7). |
| Daily ceiling of 200 visits per account, counted on Tashkent's day. | `countries/uz/klinik/index.ts` | Kaan |
| The browser session is stored under a key that names the country (`sb-notya-uz-auth-token`); no cookie is used. | `lib/ulke/istemciSupabase.ts` | — |

## Research notes (secondary sources, not confirmed by a lawyer)

- Personal data law ZRU-547 (2019).
- Law ZRU-1125 (26 March 2026) reportedly relaxed localisation: only biometric, genetic and telecom-subscriber data must stay in Uzbekistan; other personal data may go abroad to listed countries or under approved contract terms.
- Cabinet Resolution 415 (29 July 2026) reportedly lists 49 countries; whether Türkiye is listed is to verify.
- Leak during a transfer abroad: notify within 24 hours, details within 72 (to verify).
- Health data needs written consent, which may be electronic.
- AI amendments ZRU-1115 in force January 2026.
- Ministry of Health Order 3758 (January 2026) requires real-time entry in the state electronic record and prescription modules; coverage of private clinics is to verify.
- The state plans its own speech-to-note assistant inside its system DMED by end of 2026.
- Device rules: Cabinet Resolution 738 (24 November 2025), silent on software.
- About 107,500 doctors (January 2025) and more than 9,000 private medical organisations.
- Vaccination calendar: https://gov.uz/ru/sanepid/news/view/223776
- Ministry protocol section: https://gov.uz/uz/ssv/pages/klinik-qo-llanmalar
- ElevenLabs lists Uzbek for Eleven v4 and v4 Turbo voices; published Uzbek recognition figures are vendor claims on read speech.

## Open questions

- Language and script doctors write notes and prescriptions in.
- Clinical references for each specialty and clinic type.
- Whether private clinics must use the state record and prescription system.
- Whether a voiceprint is biometric data and whether software is a medical device.
- Price and live-agent support of Eleven v4 Turbo.
- Local name and background for Ayşe.

## What the pack holds today (`countries/uz/index.ts`)

Set by the foundation job on 2026-10-08. Items marked *to verify* come from general knowledge, not from a local source, and wait for the clinical lead or a lawyer.

| Item | Value | Note |
|---|---|---|
| Languages declared | Uzbek in Latin script (`uz-Latn`, default), Uzbek in Cyrillic script (`uz-Cyrl`), Russian (`ru`) | Kaan's decision |
| Languages switched on (public pages) | `uz-Latn`, `ru` | Login and sign-up exist in these two. The landing page is also written in `uz-Cyrl`, served only when the address asks for it (`/uzbek?dil=uz-Cyrl`, linked from its footer). |
| Languages inside the application | `uz-Latn`, `uz-Cyrl`, `ru` | The signed-in screens and the model instructions are written in all three forms, by hand. An account chooses its form at first login. |
| Time zone | `Asia/Tashkent` | |
| Currency | UZS, shown as "soʻm", no decimals | decimals *to verify* |
| Dates and numbers | `DD.MM.YYYY`, decimal comma, space as thousands separator, week starts Monday | *to verify* with the clinical lead |
| Phone | `+998` and nine digits | operator prefixes not checked, *to verify* |
| National identity number | JSHSHIR (PINFL), 14 digits, format only | check-digit rule *to verify* (checklist G5) |
| Features on | landing page, login, sign-up by invitation code, the first product slice (`cekirdekMuayene`: language question, settings, home, patients, visit to approved note), appointments (`randevu`, slice 3) | everything else is off. The holding page still exists and redirects to the home. |
| Voice profile, image evaluation | off | until the law is confirmed (checklist A2, A4, I7) |
| Served under | `/uzbek` (the pack's `yolOnEki`, the build's `basePath`) | Kaan, 2026-10-08: no separate Uzbek address; the product is reached at `notya.io/uzbek`. Every route below is relative to it. Outside `/uzbek` the Uzbek build answers 404. |
| Paths that exist | `/`, `/login`, `/signup`, `/welcome`, `/start`, `/today`, `/settings`, `/patients`, `/patients/new`, `/patient`, `/visit`, `/calendar`, `/api/ulke/*` | every other path of the application answers 404 |
| Tools | none | `docs/COUNTRY-PACK-UZ-TOOLS-AUDIT.md` is a proposal |
| Speech recognition | ElevenLabs Scribe `scribe_v2`, thresholds 0.80 and −0.36, at most two passes | `countries/uz/klinik/index.ts`; values *to verify* on real audio |
| Appointment norms | Monday to Friday, 09:00–18:00, break 13:00–14:00, 30 minutes; no public holidays | starting values, *to verify*; each account changes its own |
| Note templates | `genel` (for an account without a role) and one per role, 40 | `countries/uz/klinik/notSablonlari.ts`; machine-built, no local reviewer |
| Roles | 40: 30 doctor specialties, 5 clinic doctors, 5 clinic allied professions | keys from the owner's assistant list; names in `countries/uz/klinik/rolAdlari.ts` |
| Recording consent | version `uz-taslak-2026-10-08`, not reviewed by a lawyer | stamped on every visit |
| Search engines | hidden (noindex header on every response, robots.txt disallows all, no sitemap) | until the pilot approves the page (checklist K2) |
| Spelling | Uzbek Latin text uses U+02BB (ʻ) in oʻ and gʻ and U+02BC (ʼ) for the tutuq belgisi | native reviewer to confirm what doctors expect on screen |

All Uzbek and Russian text in the pack is **machine-written** and must be read by a native speaker before anything goes public (checklist E11). That includes the application's catalogue in three forms (`countries/uz/uygulama/metinler.ts`) and the instructions to the model (`countries/uz/klinik/talimatlar.ts`), which a native-speaking clinician must review. The landing copy, with English beside every line and the Keep / Adapt / Drop decision for each section of the Turkish page, is in `docs/uz-landing/COPY.md`; screenshots are in the same folder.

## Serving under `notya.io/uzbek`: open questions before any forwarding rule is added

Kaan decided on 2026-10-08 that Uzbekistan has no address of its own: the Uzbek build is served under `/uzbek` (`yolOnEki` in the pack, `basePath` in the build). The Uzbek build is ready for that. **The Turkish site does not forward `/uzbek` to it, and no rule for that has been added to any file.** Adding the rule changes how the Turkish site answers one path, so it is a change to the Turkish product and needs Kaan's go on its own.

The rule that would be needed, as text only (written for `next.config.mjs`, returned for the Türkiye build only; **not tested**, because no Türkiye build was made with it):

```js
async rewrites() {
  return { beforeFiles: [
    { source: '/uzbek', destination: 'https://<uzbek-deployment-host>/uzbek' },
    { source: '/uzbek/:path*', destination: 'https://<uzbek-deployment-host>/uzbek/:path*' },
  ] }
}
```

It must not go into `vercel.json`: that file is shared by every deployment, so the Uzbek deployment would forward to itself.

To settle before the rule is ever added:

| # | Question | Why it matters |
|---|---|---|
| 1 | **Turkish middleware headers.** `middleware.ts` of the Turkish site runs on every path, `/uzbek/*` included, before the request is forwarded, and sets its own headers on the answer (content security policy, permissions policy, CORS). Do they sit correctly on top of the Uzbek build's own headers? | The Uzbek screens need the microphone, the Uzbek Supabase project (`*.supabase.co`) and Google Fonts. The Turkish policy allows all three today; a later tightening of the Turkish policy would silently break the Uzbek product. Check on a preview, in a browser, with the console open. |
| 2 | **Turkish service worker.** `public/sw.js` of the Turkish site is registered with scope `/`. In a browser that has visited the Turkish site it also intercepts `/uzbek/*` page requests and stores copies of them in the Turkish cache (`/uzbek/api/*` is skipped). | A Turkish doctor's browser would keep copies of Uzbek pages; an Uzbek doctor who never opens the Turkish site is not affected. Decide: narrow the worker's scope, or make it ignore `/uzbek`. That is an edit to a Turkish file. |
| 3 | **Shared browser storage.** Under one address the two products share `localStorage`. The Uzbek session is stored under its own key (`sb-notya-uz-auth-token`) and no cookie is used, so the sessions do not collide — but script on either site can read the other's session. | Acceptable only while both are ours and neither loads third-party script that should not see a session. The Turkish site loads the Facebook SDK on one screen (WhatsApp connection). Decide whether that is acceptable. |
| 4 | **Robots file.** A robots file only counts at the root of an address, so `notya.io/robots.txt` (the Turkish site's) governs `/uzbek` too. The Uzbek build's own file at `/uzbek/robots.txt` is ignored by search engines. | The Uzbek pages still say "do not index" in a header and in the page itself, which search engines honour. If the Turkish robots file ever disallows `/uzbek`, engines would stop reading those "do not index" marks; leave `/uzbek` out of it. |
| 5 | **The path must stay free on the Turkish site.** No Turkish page or API may ever be created under `/uzbek`. | It would be shadowed by the forwarding rule. |
| 6 | **Uzbek deployment's own address.** The Uzbek build answers 404 outside `/uzbek`, and under `/uzbek` on its own address it is the same product. | Decide whether the deployment's own address should be closed to the public (so that only `notya.io/uzbek` is used). A deployment setting. |

## Before the Uzbek deployment is created

These are settings and decisions, not code, and none was touched by the foundation job. **Items 1, 3, 4 and 5 were written for a database per country and are superseded by the shared database (2026-10-08): see `docs/COUNTRY-PACK-DB-ROLLOUT.md`.** In short: one Supabase project, Türkiye's; the Uzbek deployment uses its address and keys; public sign-up stays on there (the Turkish sign-up page needs it) and a country build refuses any account that was not created by its own invitation route; migrations 129 to 135 only, never 128; and no invitation code until the shared login pool is closed.

1. A separate Vercel project and a separate Supabase project for Uzbekistan (region to follow checklist A1).
2. Build setting `NOTYA_COUNTRY=uz`. The build refuses any value that has no folder under `countries/`.
3. `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` of the Uzbek project. The Uzbek login refuses to work without them; it never falls back to another project.
4. Public sign-up **disabled** in that Supabase project's Auth settings. Invitation sign-up creates accounts on the server; with public sign-up left on, the invitation step could be bypassed by calling Supabase directly.
5. All migrations applied to the Uzbek database, including `128_hesap_ulke_dil.sql`, `129_davet_kodlari.sql`, `130_hekim_dil_tercihleri.sql`, `131_hasta_ulke_bilgisi.sql`, `132_muayene_dil_kaydi.sql` (also creates the private bucket `muayene-sesleri` and its upload policy), `133_not_dil_kaydi.sql`, `134_hekim_rolu.sql` and `135_ulke_randevu.sql`. 130–133 add new tables only; 134 adds one new table and two nullable columns to the table 133 created; 135 adds two new tables, the no-double-booking constraint (it needs the `btree_gist` extension) and the function `ulke_not_onayla`, without which no note can be approved. **Run them on an empty scratch project first**: 130–135 have run only on a local PostgreSQL with Supabase's objects stubbed (section "Slice 3", "Migrations 130–135 on a real PostgreSQL").
6. `NOTYA_ILETISIM_EPOSTA`: the address that receives "request a price" messages. Without it the request form is not shown. Nothing is stored: the form opens the visitor's own mail app.
7. A consent and privacy text on the sign-up form (checklist I1) **before** the first invitation code is issued (`node scripts/ulke-davet-kodu.mjs --ulke uz`).
8. Server settings for the visit: `ENCRYPTION_MASTER_KEY` (patient data cipher; its own key, never Türkiye's), `ELEVENLABS_API_KEY` (speech; without it the visit screen says speech recognition is not configured), `OPENROUTER_API_KEY` (the note model; without it no note is written). Before any of them is set with a real key: the lawyer's answer on sending health data abroad (checklist A1).
9. The first real provider call must use synthetic audio, never a patient's.
10. The cron jobs in `vercel.json` are shared by every deployment; in Uzbekistan they answer 404 (their routes are not on the country's list) until each is split.


## Assistant names (owner's list, 2026-10-08)

Kaan supplied one assistant name per specialty and clinic role: 30 doctor specialties, 5 clinic doctors, 5 clinic allied roles. They are stored exactly as given in `countries/uz/klinik/asistanAdlari.ts`, which is the only file that holds them. **Since slice 2 they are used**: the home, the visit screen, the note draft and the settings card show the name for the account's role. The three forms of every name, and the derived forms that look doubtful, are in the section "Slice 2" above.

Still open:
- A native reader's check of the spellings and of the derived Cyrillic and Russian forms. Earlier observations on the Latin spellings, unchanged: `Holmatov`/`Holmatova` (Uzbek Latin usually writes `Xolmatov`), `Shohruh` (`Shohrux`), `Ulugbek` (`Ulugʻbek`), `Ismailov`/`Ismailova` (`Ismoilov`), and the title `Fizyoterapevt` (`Fizioterapevt`). Nothing was changed.
- "Dr." or "Prof.", and each assistant's background text (the owner asked earlier for a senior clinician with 20+ years of practice in Uzbekistan). No background text exists anywhere; the screens show one neutral line.
- Which name, if any, the landing page shows (it still says "the Notya assistant").
- Key check (script, 2026-10-08): all 30 doctor keys match the product's specialty list after one correction. The owner's table wrote `kadin-dogum`; the product's key is `kadin-hastaliklari-dogum`, and that is what is stored. The 10 clinic keys match the product's clinic list (`lib/specialties/klinikDikey.ts`, read only).
