# Tools and specialties audit: Uzbekistan (`uz`)

Written on 2026-10-10 by Claude, on branch `araclar-denetim/uz` from `feat/ulke-butun` (e254ebf8). The owner's order: for this country, decide which doctor tools and which specialties to keep, revise, remove or add, and propose a core tool set that is right for Uzbekistan and not Türkiye's.

**Nothing was changed.** This job wrote two files, this report and `docs/araclar-denetim/uz-kararlar.json` (the same decisions as data). No code, pack, test or kit file was touched; nothing was merged or deployed.

**Read this before the rest.** A verdict here stands only on a source that was opened in this session, or on the product's own code. Two things limited the sources:

- The web-search allowance is shared by the six country jobs and **ran out after eighteen searches of this job**. After that, only pages already found could be opened. Most clinical sources (the national protocols, the publications behind the scores, the licence terms of the questionnaires) could therefore not be looked for. Each such item is marked **unverified — needs a local clinician** and is not a decision.
- Pages are read through a tool that summarises. A name or a number quoted below was on the page; the sentence around it is a paraphrase. The legislation database lex.uz could be read through that tool only.

No dose, schedule, protocol, formula or cut-off in this report comes from memory. Where a threshold is named, it is the one written in the product's own code, and the file is named.

## The answer in one paragraph

The specialty list can be decided now; the tools mostly cannot. The Ministry of Health's nomenclature of medical specialties in force (the Minister's order No. 6 of 12.05.2021, registration No. 3303, annex revised in 2023) was found and read. Against it, of the 30 doctor specialties **24 keep their name, 6 should be renamed** (family medicine, therapy, surgery, radiology, rehabilitation, and cardiovascular surgery, which is two specialties here) and **5 recognised specialties are proposed to add**, dentistry first. Of the 10 clinic roles only one stands as it is: **5 need another name or another kind** (dietology and surdology are doctors' specialties here, not allied professions; "aesthetic surgery" and "clinic dermatology" are specialties the doctor list already has), **3 are not in the nomenclature at all** (hair transplantation, anti-ageing medicine, occupational therapy), and one could not be verified. For the tools, the build was confirmed as recorded (48 switched-on entries, 52 empty placeholders, 56 mechanisms in the kit; of Türkiye's 96 "keep" tools 66 done, 19 placeholders, 11 absent). Of the 48 switched-on entries **15 can stay as they are** (they record what the doctor enters and hold no clinical content), **6 must be revised** for reasons visible in the code itself, and **27 are unverified**: nothing found says doctors in Uzbekistan use them, and nothing says they do not. Read against the citations the code itself carries, no switched-on tool was seen to give a wrong number for an adult, though the publications themselves could not be opened; one (EASI) scores a young child with weights the kit itself says are for age 8 and over, and one placeholder (cardiovascular risk) would be wrong for this country if it were ever switched on with Türkiye's setting. A core set of 15 tools is proposed; twelve of them are tiles or placeholders of the build already.

## How to read the verdicts

| Word | Meaning |
|---|---|
| **keep** | Stays as it stands. Given only where the tool holds no clinical content of its own, or a source read today supports it. |
| **revise** | Stays, and something named must change. Given only where the code itself or a source read today shows what. |
| **remove** | Not for this country. |
| **unverified — needs a local clinician** | No source could be opened. Not a decision. "Leaning" says what the code suggests, so the local clinician knows where to look; it must not be applied. |

Class: **base** = the same for every role (in the pack, `roller: null`); **specialty** = only the roles named.

## The state of the build, confirmed

Read from the pack itself (`countries/uz/uygulama/araclar/`) and the kit (`lib/ulke/araclar/katalog.ts`) by a script, on 2026-10-10:

- **48 switched-on entries**: 3 base tiles for all 40 roles, 44 role tools for 23 roles, and the follow-up list for those 23 roles.
- **52 placeholders** ("slots"): empty, switched off, shown on no screen. Eight of them have their mechanism in the kit already and wait only for numbers the country must state.
- **56 mechanisms in the kit**; the eight not switched on are exactly those eight placeholders.
- Seventeen of the 40 roles have **no role tool at all**: family medicine, cardiology, neurology, psychiatry, gastroenterology, obstetrics and gynaecology, rehabilitation, and all ten clinic roles.
- The record "96 kept = 66 done / 19 placeholder / 11 absent" is the table in `docs/COUNTRY-PACK-UZ-TOOLS-AUDIT.md` and agrees with the pack: it counts the 144 tools of the Turkish registry, where one Uzbek tile often stands for several Turkish ones (the follow-up list alone stands for 22 "cohort" rows).

One laboratory unit is stated in the pack, the urine albumin-to-creatinine ratio in mg/g, and the pack itself marks it unverified.

## Part 1: every existing tool

Totals over everything the Uzbek build can show or has been refused: keep 26, revise 10, remove 16, unverified 106 (158 entries: 48 switched on, 52 placeholders, 11 absent, 14 blocked, 33 clinic tools that are not in the country kit).

### 1.1 What would be wrong or misleading here

In order of weight for a patient.

1. **Cardiovascular risk (placeholder `kv-risk-score2`, switched off).** The risk model is calibrated by region. The SCORE2 paper (Eur Heart J 2021;42:2439-2454, figure 5) and a 2022 table citing the 2021 European guideline put **Uzbekistan in the "very high risk" region**. The Turkish tool defaults to the "high" region, one step lower, and takes cholesterol in mg/dL (`specialties/dahiliye/engines/score2.ts`). Today nothing is shown, which is right. It must never be switched on with the Turkish setting. Which chart the current national hypertension protocol prescribes could not be read: local papers of 2023 use both the older SCORE and SCORE2, and primary care was trained on the WHO package of essential interventions, which has charts of its own.
2. **EASI (`easi`, switched on for dermatovenerology).** The tool uses one set of body-region weights. The kit's own comment says they are those of a patient aged 8 or older. The tool asks no age, and a dermatovenerologist here sees children. A young child's score is computed with the older patient's weights.
3. **Laboratory units.** The kit's arithmetic is written in mg/dL for creatinine, glucose and cholesterol and in g/dL for haemoglobin (`lib/ulke/araclar/birimler.ts`) and converts from whatever unit the pack states. The Uzbek pack states one unit only, and that one unverified. The 2015 national cardiology protocols write cholesterol and glucose in **mmol/l**. No switched-on tool reads those values today; every tool proposed below does, so the pack must state each unit, confirmed by a local laboratory, before any of them is switched on. A wrong unit is a wrong result by a fixed factor.
4. **ASA class (`asa-preop`).** The class field offers I, II, III, IV, V and E as six choices of which one is taken. Tried: the tool accepts "E" alone as the class. Whether that matches the ASA's own system was not checked against the ASA's text (not fetched).
5. **Antibiotic course (`antibiyotik-sure`).** Tried: first day 01.10.2026, 7 days, "the day the course ends" 08.10.2026. If the first day counts as day 1 the last day of treatment is the 7th.
6. **Pain and function (`vas-fonksiyon`).** Tried: pain 5 of 10 with little loss of function is named "mild pain and limitation". The band is the product's own invention, and the screen says so, but a named band reads as a grade.
7. **DAS28 (`das28`).** The pack words the bands "2,6–3,19 low" and "3,2–5,1 moderate", and uses the same cut-offs for the CRP form. Both points are to be checked against the cited sources, which were not fetched.
8. **Audiometry (`odyometri-pta`).** The degrees carry names from two papers of the United States. How local surdologists name the degrees was not found.
9. **Structured radiology report (`rapor-taslagi`).** It uses the BI-RADS categories of the American College of Radiology inside commercial software. The terms were not read: a licence question, not a clinical one.
10. **Kidney disease (`kdigo-evre`, `kdigo-serit`).** The doctor must type an eGFR; nothing in the build works it out from creatinine. The referral flags are guidance and no national protocol was found to hold them against.
11. **Triage (`esi-triyaj`).** Nothing found says emergency departments here work with this scale. The tool cannot give a wrong number, since it records the doctor's own choice; it can be the wrong scale.

### 1.2 Switched-on tools (48): keep 15, revise 6, remove 0, unverified 27

Names on screen are machine-written and have been read by no native speaker; this audit did not judge wording. For every **keep** and **revise** in this table the source is the product's own code, read and run on the date above (the file is named in the data file); no outside source was needed for it, and none could be opened.

- **Note A**: the items are the product's own, carried over from the Turkish tool and translated. No source of this country exists to hold them against: the named reader reads the list and says what is missing or out of place.
- **Note B**: nothing to change in the arithmetic: the tool records what the doctor enters and holds no threshold, medicine or interval. A native reader still reads the wording.

| Key | Name on screen (Uzbek Latin / Russian) | Class | Who sees it | Verdict | What to change, and why | Licence |
|---|---|---|---|---|---|---|
| `hasta-portali` | Bemor sahifasi / Страница пациента | base | every role | **keep** | None. | none: a product screen |
| `sablonlarim` | Shablonlarim / Мои шаблоны | base | every role | **keep** | None. The pack brings no ready-made template, which is right. | none: a product screen |
| `konsultasyonlar` | Konsultatsiyalar / Консультации | base | every role | **keep** | None to the tool. The consent sentence waits on a lawyer (already recorded). | none: a product screen |
| `esi-triyaj` | ESI triaj darajasi / Уровень триажа ESI | specialty | Shoshilinch tibbiy yordam | **unverified — needs a local clinician** (leaning: keep only if confirmed) | Which triage scale emergency departments in Uzbekistan work with was not found in any source read. The tool records the level the doctor chose and works nothing out, so it cannot give a wrong number; it can be the wrong scale. A local emergency physician confirms, or names the scale used. | unclear: owned or published by others (the Emergency Severity Index handbook of the Emergency Nurses Association); terms not read |
| `kritik-yol` | Kritik holatlar nazorat roʻyxati / Контрольный список критических состояний | specialty | Shoshilinch tibbiy yordam | **unverified — needs a local clinician** (leaning: keep) | Note A. Reader: a local emergency physician. | none: the product's own |
| `asa-preop` | ASA va operatsiyadan oldingi nazorat roʻyxati / ASA и предоперационный контрольный список | specialty | Anesteziologiya va reanimatologiya | **unverified — needs a local clinician** (leaning: revise) | The class field offers I, II, III, IV, V and E as six choices of which one is taken, so a class cannot be recorded together with E (tried: the tool accepts E alone). Whether that is a fault depends on the ASA's own statement of the system, which was not fetched: does E stand alone or is it added to a class, and does the system have a class the field does not offer? If so, correct the field. The checklist items beside it are the product's own: a local anaesthesiologist reads them. | unclear: owned or published by others (the ASA Physical Status Classification System of the American Society of Anesthesiologists); terms not read |
| `hava-yolu-notu` | Nafas yoʻllari boʻyicha qayd / Запись о дыхательных путях | specialty | Anesteziologiya va reanimatologiya | **unverified — needs a local clinician** (leaning: keep) | Note A. Reader: a local anaesthesiologist. | none: the product's own |
| `postop-agri` | Operatsiyadan keyingi ogʻriqni kuzatish / Наблюдение за послеоперационной болью | specialty | Anesteziologiya va reanimatologiya | **unverified — needs a local clinician** (leaning: keep) | Note A. Reader: a local anaesthesiologist. It holds a pain score from 0 to 10 and no analgesic or dose. | none: the product's own |
| `noro-postop` | Neyroxirurgik operatsiyadan keyingi nazorat roʻyxati / Контрольный список после нейрохирургической операции | specialty | Neyroxirurgiya | **unverified — needs a local clinician** (leaning: keep) | Note A. Reader: a local neurosurgeon. | none: the product's own |
| `nobet-bilinc` | Tutqanoq va ong holatini kuzatish / Наблюдение за приступами и сознанием | specialty | Neyroxirurgiya | **unverified — needs a local clinician** (leaning: keep) | Note A. Reader: a local neurosurgeon. | none: the product's own |
| `cocuk-prepost-op` | Operatsiyadan oldingi va keyingi nazorat roʻyxati / Контрольный список до и после операции | specialty | Bolalar xirurgiyasi | **unverified — needs a local clinician** (leaning: keep) | Note A. Reader: a local paediatric surgeon. Its consent item waits on the guardian-consent slot (a lawyer). | none: the product's own |
| `yara-dren-izlem` | Jarohat, drenaj va choklar kuzatuvi / Наблюдение за раной, дренажом и швами | specialty | Bolalar xirurgiyasi; Umumiy xirurgiya | **keep** | Note B. | none: the product's own |
| `kdigo-evre` | Buyrak surunkali kasalligi: KDIGO toifalari / Хроническая болезнь почек: категории KDIGO | specialty | Terapiya (ichki kasalliklar) | **revise** | (1) The pack states the urine albumin-to-creatinine ratio in mg/g and marks that as unverified: confirm the unit local laboratories print before a doctor relies on it. (2) The doctor must type an eGFR; the build has no calculator from creatinine. Add one (Part 2), with creatinine in the unit local laboratories print. (3) The referral flags and the flag "fell by more than a quarter against a year ago" are guidance, not arithmetic: confirm them against the national protocol for chronic kidney disease, which was not found. (4) It answers a question every doctor of adults asks; in the core set it is shown to every doctor role, not to internal medicine alone. The grid itself was read against the kit's own citation only; the KDIGO text was not fetched. | unclear: owned or published by others (the KDIGO 2024 guideline); terms not read |
| `pasi` | PASI indeksi / Индекс PASI | specialty | Dermatovenerologiya | **unverified — needs a local clinician** (leaning: keep) | The index follows the cited 1978 paper as the kit states it. The three bands (below 10, below 20, 20 and above) are not attributed to any source in the kit: cite where they come from or show the number alone. Whether the national protocol for psoriasis uses PASI: not found. | unclear: owned or published by others (Fredriksson and Pettersson, Dermatologica 1978); terms not read |
| `easi` | EASI indeksi / Индекс EASI | specialty | Dermatovenerologiya | **revise** | The tool applies one set of body-region weights, and the kit's own comment says they are those of a patient aged 8 or older. It asks no age. A dermatovenerologist here sees children too, and a younger child is scored with weights the kit itself says are for age 8 and over. Add the age question with the younger child's weights taken from the source (not fetched), or say on the screen that the tool is for age 8 and over. Also cite the source of the bands (below 7, below 21, 21 and above). | unclear: owned or published by others (Hanifin et al., Exp Dermatol 2001); terms not read |
| `scorad` | SCORAD indeksi / Индекс SCORAD | specialty | Dermatovenerologiya | **unverified — needs a local clinician** (leaning: keep) | The formula follows the cited 1993 paper as the kit states it. The bands (below 25, below 50, 50 and above) are not attributed: cite them, and check on which side exactly 50 falls. | unclear: owned or published by others (the European Task Force on Atopic Dermatitis, Dermatology 1993); terms not read |
| `yama-okuma` | Applikatsion test: natijani oʻqish kunlari / Аппликационный тест: дни чтения результата | specialty | Dermatovenerologiya | **unverified — needs a local clinician** (leaning: keep) | Date arithmetic: the day of application plus 2 and plus 4. Whether local practice reads on these two days: a local dermatovenerologist confirms. | unclear: owned or published by others (the European Society of Contact Dermatitis guideline, Contact Dermatitis 2015); terms not read |
| `rejim-karti` | Insulin va qalqonsimon bez davosi: sanalar kartasi / Инсулин и терапия щитовидной железы: карта дат | specialty | Endokrinologiya | **keep** | Note B. | none: the product's own |
| `antibiyotik-sure` | Antibiotik kursi: kunlar hisobi / Курс антибиотика: счёт дней | specialty | Yuqumli kasalliklar | **revise** | A first day of 01.10 and 7 days give "the day the course ends" as 08.10: the tool adds the number of days to the first day. If the first day counts as day 1, the last day of treatment is 07.10. Decide which is meant and say it in the label ("last day of treatment" or "first day without treatment"). | none: the product's own |
| `genel-preop` | Operatsiyadan oldingi nazorat roʻyxati / Предоперационный контрольный список | specialty | Umumiy xirurgiya | **unverified — needs a local clinician** (leaning: keep) | Note A. Reader: a local surgeon. Its consent item points to the local consent form (a lawyer). | none: the product's own |
| `toraks-preop` | Koʻkrak qafasi operatsiyasidan oldingi nazorat roʻyxati / Контрольный список перед торакальной операцией | specialty | Torakal xirurgiya | **unverified — needs a local clinician** (leaning: keep) | Note A. Reader: a local thoracic surgeon. | none: the product's own |
| `toraks-tup-yara` | Plevra drenaji va jarohat kuzatuvi / Наблюдение за плевральным дренажом и раной | specialty | Torakal xirurgiya | **keep** | Note B. | none: the product's own |
| `inhaler-teknik` | Ingalyatordan foydalanish texnikasi / Техника ингаляции | specialty | Pulmonologiya | **unverified — needs a local clinician** (leaning: keep) | Note A. Reader: a local pulmonologist. It names device types, no medicine and no dose. | none: the product's own |
| `gorme-keskinligi` | Koʻrish oʻtkirligi: logMAR / Острота зрения: logMAR | specialty | Oftalmologiya | **unverified — needs a local clinician** (leaning: keep) | The conversion is mathematics. Which notation local ophthalmologists record acuity in (a decimal value or a fraction) was not found: a local ophthalmologist confirms, and that notation is offered first. | unclear: owned or published by others (Bailey and Lovie 1976 and Ferris et al. 1982); terms not read |
| `kalp-damar-preop` | Yurak-qon tomir operatsiyasidan oldingi nazorat roʻyxati / Контрольный список перед сердечно-сосудистой операцией | specialty | Yurak-qon tomir xirurgiyasi | **unverified — needs a local clinician** (leaning: keep) | Note A. Reader: a local cardiac or vascular surgeon. | none: the product's own |
| `greft-yara-izlem` | Tomir grefti va jarohat kuzatuvi / Наблюдение за сосудистым графтом и раной | specialty | Yurak-qon tomir xirurgiyasi | **keep** | Note B. | none: the product's own |
| `antikoagulan-vadeleri` | Antitrombotik davo: nazorat sanalari / Антитромботическая терапия: даты контроля | specialty | Yurak-qon tomir xirurgiyasi | **keep** | Note B. It names classes of medicine only. | none: the product's own |
| `odyometri-pta` | Tonal audiometriya: oʻrtacha eshitish boʻsagʻasi / Тональная аудиометрия: средний порог слуха | specialty | Otorinolaringologiya (LOR) | **unverified — needs a local clinician** (leaning: revise) | The average is taken over 0,5, 1, 2 and 4 kHz and the degrees are named after two papers from the United States (mild, moderate, moderately severe, severe, profound). Which frequencies local practice averages and how it names the degrees was not found in any source read. A local surdolog confirms both; the degree names are the pack's text and can be changed without touching the arithmetic. It should also be shown to surdology if that becomes a role (Part 3). | unclear: owned or published by others (Goodman 1965 and Clark 1981); terms not read |
| `otoskopi-notu` | Otoskopiya qaydi / Запись отоскопии | specialty | Otorinolaringologiya (LOR) | **unverified — needs a local clinician** (leaning: keep) | Note A. Reader: a local otorhinolaryngologist. | none: the product's own |
| `vertigo-notu` | Bosh aylanishi: pozitsion sinamalar qaydi / Головокружение: запись позиционных проб | specialty | Otorinolaringologiya (LOR) | **unverified — needs a local clinician** (leaning: keep) | Note A. Reader: a local otorhinolaryngologist. It holds one rule of its own: with any sign pointing to a central cause a repositioning manoeuvre is marked "not suitable". The reader confirms that rule. | none: the product's own |
| `kdigo-serit` | KDIGO jadvali: KFT va albuminuriya / Таблица KDIGO: СКФ и альбуминурия | specialty | Nefrologiya | **revise** | The same grid as the internal-medicine tool, without its referral flags. Confirm the unit of the albumin-to-creatinine ratio; add the calculator from creatinine (Part 2). One tool with the role deciding whether the flags show would do for both. | unclear: owned or published by others (the KDIGO 2024 guideline); terms not read |
| `diyaliz-seans` | Dializ seansi va keyingi sana / Сеанс диализа и следующая дата | specialty | Nefrologiya | **keep** | Note B. | none: the product's own |
| `kur-sayaci` | Davolash kurslari hisobi / Счёт курсов лечения | specialty | Onkologiya | **keep** | Note B. | none: the product's own |
| `toksisite-listesi` | Nojoʻya taʼsirlar nazorat roʻyxati / Контрольный список побочных эффектов | specialty | Onkologiya | **unverified — needs a local clinician** (leaning: keep) | Note A. Reader: a local oncologist. It records which side effects are present, with no grade. | none: the product's own |
| `kirik-alci-takip` | Sinish, gips va ortez kuzatuvi / Наблюдение за переломом, гипсом и ортезом | specialty | Travmatologiya va ortopediya | **keep** | Note B. Its warnings follow only from dates the doctor entered. | none: the product's own |
| `ortopedi-op-protokol` | Operatsiyadan keyingi nazorat roʻyxati / Послеоперационный контрольный список | specialty | Travmatologiya va ortopediya | **unverified — needs a local clinician** (leaning: keep) | Note A. Reader: a local traumatologist-orthopaedist. | none: the product's own |
| `vas-fonksiyon` | Ogʻriq va funksiya bali / Оценка боли и функции | specialty | Travmatologiya va ortopediya | **revise** | The band is the product's own composite, and the screen says so. Even so, pain of 5 out of 10 with little loss of function is named "mild pain and limitation of function". Show the two numbers without a band, or replace the tool with a published instrument once its licence is cleared. | none: the product's own |
| `hedef-boy` | Ota-ona boʻyiga koʻra kutilayotgan boʻy / Ожидаемый рост по росту родителей | specialty | Pediatriya | **unverified — needs a local clinician** (leaning: keep) | The formula is the one the kit cites (1970). The range of 8,5 cm either side was not checked against the paper (not fetched). Whether local paediatric guidance uses this estimate: not found. | unclear: owned or published by others (Tanner et al., Arch Dis Child 1970); terms not read |
| `doz-hesabi` | Doza hisobi: vazn boʻyicha / Расчёт дозы по массе тела | specialty | Pediatriya | **keep** | Arithmetic on numbers the doctor types; it holds no medicine, dose or ceiling. Show it to every role that treats children (family doctors, emergency care, anaesthesiology, infectious diseases, paediatric surgery), not to paediatrics alone. | none: the product's own |
| `plastik-yara-greft` | Jarohat, transplantat va laxtak kuzatuvi / Наблюдение за раной, трансплантатом и лоскутом | specialty | Plastik xirurgiya | **keep** | Note B. | none: the product's own |
| `tetkik-kuyrugu` | Tekshiruvlar navbati / Очередь исследований | specialty | Radiologiya (nur tashxisi) | **keep** | Note B. | none: the product's own |
| `rapor-taslagi` | Tuzilgan xulosa qoralamasi / Черновик структурированного заключения | specialty | Radiologiya (nur tashxisi) | **revise** | It offers the assessment categories of the ACR BI-RADS Atlas. BI-RADS belongs to the American College of Radiology, and its terms for use inside commercial software were not read. Clear the licence, or offer the general report only. Whether local radiologists report mammography in these categories: a local radiologist confirms. | needs permission — to confirm: the kit cites the ACR BI-RADS Atlas; the terms were not read in this session |
| `das28` | DAS28 kasallik faolligi indeksi / Индекс активности DAS28 | specialty | Revmatologiya | **unverified — needs a local clinician** (leaning: revise) | The pack words the bands as "2,6–3,19 low" and "3,2–5,1 moderate" and uses the same cut-offs for the form with CRP. Check against the cited sources (not fetched) on which side exactly 3,2 falls and whether the CRP form shares the cut-offs of the ESR form. A local laboratory confirms CRP in mg/l and ESR in mm/h. | unclear: owned or published by others (Prevoo et al. 1995 and Fransen and van Riel 2005); terms not read |
| `eklem-28` | 28 boʻgʻim hisobi / Счёт 28 суставов | specialty | Revmatologiya | **unverified — needs a local clinician** (leaning: keep) | A count of ticked joints; it feeds DAS28 only by the doctor retyping the two counts. | unclear: owned or published by others (Prevoo et al. 1995); terms not read |
| `psa-hizi` | Prostata spetsifik antigeni: oʻzgarish tezligi / Простатспецифический антиген: скорость изменения | specialty | Urologiya | **unverified — needs a local clinician** (leaning: keep) | The difference of two values divided by the years between them; no band. A local laboratory confirms that PSA is printed in ng/ml. | none: the product's own |
| `rtp-basamak` | Sportga qaytish bosqichlari / Этапы возвращения в спорт | specialty | Sport tibbiyoti | **unverified — needs a local clinician** (leaning: keep) | Note A. Reader: a local sports physician. It records a step from 0 to 5 and proposes no day. | none: the product's own |
| `sakatlik-gunlugu` | Shikastlanishlar kundaligi / Журнал травм | specialty | Sport tibbiyoti | **unverified — needs a local clinician** (leaning: keep) | The load ratio is flagged from 1,3 and from 1,5; the kit cites one 2016 paper for both limits, which was not fetched. A local sports physician confirms the list of regions and mechanisms. | unclear: owned or published by others (Gabbett, Br J Sports Med 2016); terms not read |
| `takip-paneli` | Nazorat roʻyxati / Список контроля | specialty | 23 roles | **keep** | Seventeen roles do not see it because they have no tool whose result can be kept. Give it to each as it gains one; in the core set it becomes a tile of every doctor role. | none: a product screen |

### 1.3 Placeholders (52): keep 0, revise 4, remove 0, unverified 48

Each is empty and switched off, so none can mislead a doctor today. "Unverified" here means: the local content it waits for was not found in any source read. ¹ = the mechanism is already in the kit; only the country's numbers are missing. **Note C**: every threshold and interval of the tool is a number the country states, and none was found in a national source.

| Key | What it would be | Who would see it | Verdict | What it needs | Licence |
|---|---|---|---|---|---|
| `recete` | Prescription drafting | base | **unverified — needs a local clinician** (leaning: keep as a slot) | Wanted by every doctor. Needs the State Register of medicines and the prescription form. The earlier audit read the title of the Minister of Health's order No. 121 of 01.07.2020 (prescribing by international nonproprietary name); it was not re-read today. | none: official content |
| `muayene-ozeti-belgesi` | Visit and discharge summary as a document | base | **unverified — needs a local clinician** (leaning: keep as a slot) | Needs the form of the summary a clinic issues here. The order on primary medical documentation was not found. | none: official content |
| `tani-kodlama` | Diagnosis coding | base | **revise** | The Ministry of Health's 2024 methodology for national protocols selects conditions by "XKT-10/11" codes, so the classification doctors here code in is the International Classification of Diseases, 10th revision, with the 11th named beside it. Build the slot on the 10th revision with titles in Uzbek and Russian from an official edition; a coding table is not written by a machine. Source: <https://api-portal.gov.uz/uploads/9601e5f7-7b41-8340-c074-d4e0a914804e_media_.pdf> | unclear — the classification is the World Health Organization's; the terms for the national edition were not read |
| `ilac-etkilesimi` | Medicine interactions | base | **unverified — needs a local clinician** (leaning: keep as a slot) | Needs interaction data from a licensed source and the State Register to search by. | paid licence likely — unclear: no provider was looked at |
| `hasta-belgeleri` | Certificates for patients | base | **unverified — needs a local clinician** (leaning: keep as a slot) | Needs the forms and the periods the rules allow: a lawyer in Uzbekistan with the clinical lead. | none: official content |
| `tetkik-istek` | Laboratory and imaging request | base | **unverified — needs a local clinician** (leaning: keep as a slot) | Needs the local test catalogue and units. The 2015 national cardiology protocols write cholesterol and glucose in mmol/l. | none: official content |
| `muayene-sonu` | End-of-visit flow | base | **unverified — needs a local clinician** (leaning: keep as a slot) | Waits on the prescription and certificate slots. | none: official content |
| `acil-sevk` | Admission, referral and discharge package (emergency) | Shoshilinch tibbiy yordam | **unverified — needs a local clinician** (leaning: keep as a slot) | Needs the documents and referral levels of the local system. | none: official content |
| `aile-asi-tarama` | Vaccination and screening (family medicine) | Oilaviy tibbiyot | **revise** | The vaccination half has a named national source: the sanitary rules SanQvaM 0239-07/3 "Oʻzbekiston Respublikasida yuqumli kasalliklar immunoprofilaktikasi", section "PROFILAKTIK EMLASH KALENDARI", amended on 19.07.2021 (decision No. 02, registration No. 31). A local clinician enters the calendar from it and signs it. The screening half has no source yet. Source: <https://lex.uz/acts/5524039> | none: an official act |
| `aile-kronik` | Diabetes and hypertension follow-up (family medicine) | Oilaviy tibbiyot | **unverified — needs a local clinician** (leaning: keep as a slot) | WHO Europe reports that WHO PEN protocols 1, 2 and 3 were adapted for primary care in Uzbekistan after 2013. The national document itself was not found. | none: official content |
| `aile-sevk` | Referral and emergency triage (family medicine) | Oilaviy tibbiyot | **unverified — needs a local clinician** (leaning: keep as a slot) | Needs the referral levels and criteria of the local system. | none: official content |
| `aile-kohort` | Follow-up panel (family medicine) | Oilaviy tibbiyot | **unverified — needs a local clinician** (leaning: keep as a slot) | Has nothing to list until the three tools above exist. | none: official content |
| `cocuk-onam-veli` | Consent for an operation on a child | Bolalar xirurgiyasi | **unverified — needs a local clinician** (leaning: keep as a slot) | A lawyer: who signs, below which age. | none: official content |
| `kv-risk-score2` | Ten-year cardiovascular risk | Terapiya (ichki kasalliklar); Kardiologiya | **revise** | SAFETY. The risk model is calibrated by region. The published SCORE2 paper (figure 5) and a 2022 journal table that cites the 2021 European guideline place Uzbekistan in the "very high risk" region; the Turkish tool defaults to the "high" region, one step lower, and asks cholesterol in mg/dL (specialties/dahiliye/engines/score2.ts). Its numbers must not be shown here. Keep the slot off until it is rebuilt for the very-high-risk region, with cholesterol in mmol/l, and until a local cardiologist says which chart the current national protocol prescribes: the national hypertension protocol could not be read, local papers use both SCORE and SCORE2, and primary care was trained on the WHO package, which has charts of its own. Source: <https://push-zb.helmholtz-munich.de/deliver.php?id=31109> ; <https://tidsskriftet.no/en/node/62283/pdf> | needs permission — to confirm: the copy of the SCORE2 paper read carries "© European Society of Cardiology 2021" and no open licence. The article on the WHO charts is published under CC BY 4.0 |
| `polifarmasi` | Review of medicines in patients aged 65 and over | Terapiya (ichki kasalliklar) | **unverified — needs a local clinician** (leaning: keep as a slot) | Needs a licensed edition of the criteria and the local register of medicines. If no licence is obtained, drop the slot for this country. | needs permission (the STOPP/START criteria); terms not read |
| `antikoagulan` | Anticoagulation review | Terapiya (ichki kasalliklar) | **unverified — needs a local clinician** (leaning: keep as a slot) | Needs the local labels and the national protocol. The 2015 national arrhythmia protocol, as far as it could be read, names no stroke-risk or bleeding score. | none: official content |
| `izotretinoin-gebelik-onleme` | Pregnancy-prevention checks for isotretinoin | Dermatovenerologiya | **unverified — needs a local clinician** (leaning: keep as a slot) | Needs the programme the local regulator requires. Not found. | none: official content |
| `lab-izlem` ¹ | HbA1c and TSH follow-up | Endokrinologiya | **unverified — needs a local clinician** (leaning: keep as a slot) | Note C. | none: official content |
| `dxa-tekrar` ¹ | Bone densitometry repeat | Endokrinologiya | **unverified — needs a local clinician** (leaning: keep as a slot) | Note C. | none: official content |
| `viral-izlem` ¹ | HIV and viral hepatitis follow-up | Yuqumli kasalliklar | **unverified — needs a local clinician** (leaning: keep as a slot) | Note C. | none: official content |
| `enfeksiyon-bildirim` | Isolation and notification | Yuqumli kasalliklar | **unverified — needs a local clinician** (leaning: keep as a slot) | Needs the list of notifiable diseases and the report form. Every doctor meets this duty, so in the core set it is a base tool, not one of infectious diseases alone. | none: official content |
| `anemi-izlem` ¹ | Anaemia follow-up in chronic kidney disease | Nefrologiya | **unverified — needs a local clinician** (leaning: keep as a slot) | Note C. The unit local laboratories print for haemoglobin must be stated in the pack. | none: official content |
| `iltihap-lab-izlem` ¹ | CRP and ESR follow-up | Revmatologiya | **unverified — needs a local clinician** (leaning: keep as a slot) | Note C. | none: official content |
| `basdai` | BASDAI | Revmatologiya | **unverified — needs a local clinician** (leaning: keep as a slot) | Needs the authorised Uzbek and Russian versions. | needs permission (BASDAI); terms not read |
| `kardiyo-izlem` ¹ | Hypertension, heart-failure and atrial-fibrillation follow-up | Kardiologiya | **unverified — needs a local clinician** (leaning: keep as a slot) | Note C. The 2015 national heart-failure protocol classifies by NYHA, which this mechanism already records. | none: official content |
| `cat-mmrc` | COPD Assessment Test with the mMRC grade | Pulmonologiya | **unverified — needs a local clinician** (leaning: keep as a slot) | Needs the authorised translations and the licence. | needs permission (the COPD Assessment Test); terms not read |
| `akciger-aksiyon-plani` | Written action plan for asthma and COPD | Pulmonologiya | **unverified — needs a local clinician** (leaning: keep as a slot) | A sheet the patient reads: supplied and signed by a local pulmonologist. | none: official content |
| `ibd-skor` ¹ | Activity index follow-up (bowel disease) | Gastroenterologiya | **unverified — needs a local clinician** (leaning: keep as a slot) | Note C. | none: official content |
| `hepatit-izlem` ¹ | Hepatitis B and C follow-up | Gastroenterologiya | **unverified — needs a local clinician** (leaning: keep as a slot) | Note C. | none: official content |
| `gebelik-takvimi` | Pregnancy calendar | Akusherlik va ginekologiya | **unverified — needs a local clinician** (leaning: keep as a slot) | Needs the national antenatal protocol (not found). Its date arithmetic alone needs nothing local and can be split off as a tool of its own (Part 2). | none: official content |
| `dogum-analik-raporu` | Maternity leave dates and certificate | Akusherlik va ginekologiya | **unverified — needs a local clinician** (leaning: keep as a slot) | A lawyer: the periods of labour law and the certificate form. | none: official content |
| `kontrasepsiyon-mec` | Medical eligibility for contraception | Akusherlik va ginekologiya | **unverified — needs a local clinician** (leaning: keep as a slot) | Needs the WHO table entered from the WHO edition and signed by a local clinician. | unclear — a WHO publication; its licence was not read |
| `obstetrik-risk` | Obstetric risk prompts and caesarean note | Akusherlik va ginekologiya | **unverified — needs a local clinician** (leaning: keep as a slot) | Needs the local protocol and the form of the note. | none: official content |
| `kd-kohort` | Follow-up panel (obstetrics and gynaecology) | Akusherlik va ginekologiya | **unverified — needs a local clinician** (leaning: keep as a slot) | Has nothing to list until the antenatal schedule exists. | none: official content |
| `inme-kirmizi-bayrak` | Stroke and TIA red flags | Nevrologiya | **unverified — needs a local clinician** (leaning: keep as a slot) | Needs the regional stroke pathway. The ambulance number is already a setting of the pack. | none: official content |
| `midas` | MIDAS | Nevrologiya | **unverified — needs a local clinician** (leaning: keep as a slot) | Needs the authorised versions and the licence. | needs permission (MIDAS); terms not read |
| `antiepileptik-izlem` | Laboratory monitoring of antiseizure medicines | Nevrologiya | **unverified — needs a local clinician** (leaning: keep as a slot) | Needs the national protocol and the local register. | none: official content |
| `buyume-persentil` | Growth and percentiles | Pediatriya | **unverified — needs a local clinician** (leaning: keep as a slot) | A 2025 paper from Fergana assessed children "in accordance with WHO standards" and cites the WHO Child Growth Standards of 2006. No order or programme of the Ministry of Health that prescribes a standard was found. A local paediatrician names the standard and the document; the tables are then entered from the WHO files, never from memory. | unclear — the WHO standards; their licence for use inside commercial software was not read |
| `asi-takvimi` | Vaccination calendar and catch-up | Pediatriya | **revise** | The source is named: SanQvaM 0239-07/3, section "PROFILAKTIK EMLASH KALENDARI", with the amendment of 19.07.2021; the same act holds a second calendar for epidemic indications. A local clinician enters the calendar from the current edition and signs it. No vaccine or age is written in this report. Source: <https://lex.uz/acts/5524039> | none: an official act |
| `gelisim-tarama` | Development and screening panel | Pediatriya | **unverified — needs a local clinician** (leaning: keep as a slot) | Needs the national screening programme for children. Not found. | none: official content |
| `mchat-rf` | M-CHAT-R/F | Pediatriya | **unverified — needs a local clinician** (leaning: keep as a slot) | Needs the authorised versions and the authors' permission. | needs permission (M-CHAT-R/F); terms not read |
| `pediatri-kohort` | Follow-up panel (paediatrics) | Pediatriya | **unverified — needs a local clinician** (leaning: keep as a slot) | Has nothing of its own to list until the calendar and screening exist. | none: official content |
| `plastik-onam` | Informed-consent checklist (plastic surgery) | Plastik xirurgiya | **unverified — needs a local clinician** (leaning: keep as a slot) | A lawyer. | none: official content |
| `phq9-gad7` | PHQ-9 and GAD-7 | Psixiatriya | **unverified — needs a local clinician** (leaning: keep as a slot) | Needs the authorised Uzbek and Russian versions and the owner's terms. | needs permission (PHQ-9 and GAD-7); terms not read |
| `psikiyatri-guvenlik-triyaj` | Safety and emergency triage (psychiatry) | Psixiatriya | **unverified — needs a local clinician** (leaning: keep as a slot) | Needs the referral path and the rules for involuntary admission. The new edition of the law on psychiatric care (2021) lets private institutions provide psychiatric care; its text was not read. | none: official content |
| `psikotrop-izlem` | Monitoring calendar of psychotropic medicines | Psixiatriya | **unverified — needs a local clinician** (leaning: keep as a slot) | Needs the national protocol and the local register. | none: official content |
| `radyo-kritik-bildirim` | Critical-finding notice (radiology) | Radiologiya (nur tashxisi) | **unverified — needs a local clinician** (leaning: keep as a slot) | Needs the local rule on who is told and how fast. | none: official content |
| `ipss` | IPSS | Urologiya | **unverified — needs a local clinician** (leaning: keep as a slot) | Needs the authorised versions and the permission. | needs permission (IPSS); terms not read |
| `uroloji-acil-triyaj` | Haematuria and stone emergency triage | Urologiya | **unverified — needs a local clinician** (leaning: keep as a slot) | Needs the referral path. | none: official content |
| `ftr-seans-plani` | Session plan (rehabilitation) | Tibbiy reabilitatsiya va fizioterapiya | **unverified — needs a local clinician** (leaning: keep as a slot) | Needs any local rule on the number of sessions. | none: official content |
| `vas-odi` | Pain scale with the Oswestry Disability Index | Tibbiy reabilitatsiya va fizioterapiya | **unverified — needs a local clinician** (leaning: keep as a slot) | Needs the authorised versions and the licence. | needs permission (the Oswestry Disability Index); terms not read |
| `ev-egzersiz` | Home exercise sheet | Tibbiy reabilitatsiya va fizioterapiya | **unverified — needs a local clinician** (leaning: keep as a slot) | A sheet the patient reads: supplied and signed by a local rehabilitation physician. | none: official content |

### 1.4 Absent

**Eleven tools of the Turkish registry with the earlier verdict "keep" that the Uzbek build does not have** (keep 10, revise 0, remove 0, unverified 1):

| Turkish route | Turkish title | Role | Verdict | Note |
|---|---|---|---|---|
| `derm-fototerapi` | Fototerapi defteri | Dermatovenerologiya | **unverified** | A dose diary needs a record of its own and a local protocol for the starting dose. Not built; a local dermatovenerologist says whether it is wanted. |
| `psik-kohort` | Psikiyatri kohort paneli | Psixiatriya | **keep** | It is the follow-up list. Shown when psychiatry gains its first tool whose result can be kept. |
| `kardio-kohort` | Kardiyoloji kohort paneli | Kardiologiya | **keep** | As above, for cardiology. |
| `noro-kohort` | Nöroloji kohort paneli | Nevrologiya | **keep** | As above, for neurology. |
| `ftr-kohort` | FTR kohort paneli | Tibbiy reabilitatsiya va fizioterapiya | **keep** | As above, for rehabilitation. |
| `gastro-kohort` | Gastroenteroloji kohort paneli | Gastroenterologiya | **keep** | As above, for gastroenterology. |
| `gastro-endoskopi` | Endoskopi belge köprüsü | Gastroenterologiya | **keep** | Nothing of a country in it. Waits on a kit feature: uploading documents. |
| `gc-patoloji` | Patoloji belge köprüsü | Umumiy xirurgiya | **keep** | As above. |
| `plastik-foto` | Foto zaman çizgisi köprü | Plastik xirurgiya | **keep** | Waits on uploading images; consent for photographs is a lawyer's question. |
| `bc-goruntu` | Görüntü belge köprü | Neyroxirurgiya | **keep** | Waits on uploading documents. |
| `gogus-cerrahi-patoloji` | Patoloji köprü | Torakal xirurgiya | **keep** | Waits on uploading documents. |

**Fourteen tools of Türkiye's state and payer systems: remove, confirmed.** They are blocked for every country build by `countries/yasak-araclar.json` and a build rule: `sgk-medula`, `enabiz`, `dahiliye-sgk`, `goz-sut-vegf`, `goz-sgk-rapor`, `goz-gil-kod`, `derm-biyolojik-sut`, `psik-sgk`, `kbb-sgk`, `kardio-sgk`, `gogus-sgk`, `nef-sgk`, `onko-sut`, `roma-biyolojik-sut`.

**Thirty-three clinic tools of the Turkish product: none exists in the country kit.** The ten clinic roles of the Uzbek build see the three base tiles and nothing else. Two of the 33 are tied to Turkish law and a Turkish state system (remove); one is the patient page, which exists; the other 30 are after-care calendars, session dates and follow-up lists of single clinic types. Whether each is wanted follows the role's verdict in Part 3 (three of the ten roles are not recognised here), then a local reader. They are listed one by one in the data file.

## Part 2: tools to add, and the core set

### 2.1 The core set proposed for Uzbekistan (15)

What every doctor role should see, whatever the specialty. "Doctor role" matters: a clinical calculator shown to a clinical psychologist is the leak the product's own rules forbid, so the core set is base for the doctor roles and the three product screens stay base for everybody. Thirteen of the fifteen exist in some form already: four tiles, eight placeholders, and one tool that a single role sees today. Two are new: body mass index, and the calculator that goes with the kidney tool the build already has. The core set is mostly a list of what to **finish**, not what to invent.

| # | Tool | Today | National body or source it is tied to |
|---|---|---|---|
| 1 | Bemor sahifasi (hasta-portali) | on, base | A screen of the product. |
| 2 | Shablonlarim (sablonlarim) | on, base | A screen of the product. |
| 3 | Konsultatsiyalar (konsultasyonlar) | on, base | A screen of the product. |
| 4 | Nazorat roʻyxati (takip-paneli) | on for 23 roles | A screen of the product; base for doctor roles once each has a tool whose result can be kept. |
| 5 | Diagnosis coding (tani-kodlama) | slot | Ministry of Health: its 2024 methodology for national protocols works by "XKT-10/11" codes. <https://api-portal.gov.uz/uploads/9601e5f7-7b41-8340-c074-d4e0a914804e_media_.pdf> |
| 6 | Prescription (recete) | slot | Ministry of Health, order No. 121 of 01.07.2020 on prescribing by international nonproprietary name: read by title in the earlier audit, not today. |
| 7 | Visit and discharge summary document (muayene-ozeti-belgesi) | slot | Ministry of Health forms of medical documentation: not found. |
| 8 | Certificates, with the temporary incapacity certificate (hasta-belgeleri) | slot | A lawyer in Uzbekistan: not found. |
| 9 | Laboratory and imaging request (tetkik-istek) | slot | Units as national protocols write them: mmol/l for cholesterol and glucose in the 2015 cardiology protocols. <https://extranet.who.int/ncdccs/Data/UZB_D1_КП%20по%20кардиологии%20рус%20.pdf> |
| 10 | Medicine interactions (ilac-etkilesimi) | slot | The State Register of medicines; licensed interaction data. |
| 11 | End-of-visit flow (muayene-sonu) | slot | Follows the prescription and certificate slots. |
| 12 | Infectious-disease notification (enfeksiyon-bildirim, moved from one specialty to base) | slot | The Committee for Sanitary-Epidemiological Welfare and Public Health (PP-4790 of 27.07.2020); its list and form were not read. <https://lex.uz/docs/4914450> |
| 13 | Body mass index and waist circumference | new | Used in the 2015 national cardiology protocols. <https://extranet.who.int/ncdccs/Data/UZB_D1_КП%20по%20кардиологии%20рус%20.pdf> |
| 14 | Kidney function: eGFR from creatinine, with the KDIGO category (kdigo-evre made base) | new + on for one role | National protocol for chronic kidney disease: not found. |
| 15 | Dose arithmetic by weight (doz-hesabi, shown to every role that treats children) | on for one role | Arithmetic on the doctor's own numbers; no national content. |

Four of the fifteen are screens of the product. Of the eleven clinical ones, four are tied to a source read today; the other seven are tied to a body or a document that could not be opened, and say so.

Why these and not Türkiye's: Türkiye's shared set is built around its payer system (SGK Medula, e-Nabız, SUT), which does not exist here. What every doctor in Uzbekistan meets instead is the Ministry's own documentation, coding by "XKT-10", prescribing by international name, the duty to notify infectious disease, and laboratory reports in molar units.

### 2.2 Tools proposed, with their sources

No formula or threshold is written here. Where the primary publication could not be opened, the row says so.

| Proposed tool | Core, or who sees it | National source | Primary publication | Licence |
|---|---|---|---|---|
| Body mass index and waist circumference | core | The 2015 national cardiology protocols (Ministry of Health, project "Zdorovye-3") use body mass index and waist circumference in the stable-angina and heart-failure protocols. <https://extranet.who.int/ncdccs/Data/UZB_D1_КП%20по%20кардиологии%20рус%20.pdf> | Arithmetic on weight and height. The classification bands are the World Health Organization's; the publication was not fetched in this session, and neither the formula nor a band is written here. | unclear — the arithmetic is free; the WHO classification was not read |
| Kidney function: eGFR from creatinine in the laboratory's own unit, feeding the KDIGO category tool | core | The national protocol for chronic kidney disease was not found, so which equation it prescribes is unverified. | Inker LA, Eneanya ND, Coresh J, et al. N Engl J Med 2021;385:1737-1749 (the 2021 CKD-EPI creatinine equation), as referenced on a secondary page read today; the article itself was not opened. <https://www.nejm.org/doi/full/10.1056/NEJMoa2102953> | unclear — not read |
| Infectious-disease notification (today the slot enfeksiyon-bildirim of one specialty) | core | The body is the Committee for Sanitary-Epidemiological Welfare and Public Health under the Ministry of Health (Presidential resolution PP-4790 of 27.07.2020). Its list of notifiable diseases and the report form were not read. <https://lex.uz/docs/4914450> | No formula: a form and a list of an authority. | not applicable — an official form |
| Ten-year cardiovascular risk for the very-high-risk region (today the slot kv-risk-score2) | Terapiya (ichki kasalliklar); Kardiologiya; Oilaviy tibbiyot; Endokrinologiya; Nefrologiya | WHO Europe: WHO PEN protocols 1, 2 and 3 were adapted for primary care in Uzbekistan (workshop report, 2017), and the pilot assessed total cardiovascular risk in adults of 40 and over (good-practice brief, 2018: https://who-sandbox.squiz.cloud/__data/assets/pdf_file/0007/367288/gpb-hss-ncds-uzb-eng.pdf). Which chart the current national protocol prescribes is unverified. <https://who-sandbox.squiz.cloud/__data/assets/pdf_file/0005/335813/PEN-meeting-report-16.pdf> | SCORE2 working group and ESC Cardiovascular risk collaboration. Eur Heart J 2021;42:2439-2454, with its supplementary tables for the coefficients; SCORE2-OP: Eur Heart J 2021;42:2455-2467. WHO charts: Lancet Glob Health 2019;7:e1332-e1345 (https://dspace.library.uu.nl/handle/1874/390215). <https://push-zb.helmholtz-munich.de/deliver.php?id=31109> | needs permission — to confirm for SCORE2 (© European Society of Cardiology 2021 on the copy read); the WHO chart article is CC BY 4.0 |
| NYHA functional class as a record | Kardiologiya; Terapiya (ichki kasalliklar); Oilaviy tibbiyot; Yurak-qon tomir xirurgiyasi | The 2015 national heart-failure protocol classifies by NYHA ("Классификация ХСН по NYHA"). <https://extranet.who.int/ncdccs/Data/UZB_D1_КП%20по%20кардиологии%20рус%20.pdf> | The classification of the New York Heart Association; its primary publication was not fetched. The kit's switched-off follow-up mechanism (kardiyo-izlem) already has the field, with classes I to IV. | unclear — not read |
| Gestational age and expected date of birth (the arithmetic only, split from the antenatal schedule) | Akusherlik va ginekologiya; Oilaviy tibbiyot | The national antenatal protocol was not found; the dating rule must be taken from it. | Date arithmetic; the rule to count from is the protocol's. | unclear until the national rule is read |
| Vaccination status against the national calendar (today the slots asi-takvimi and aile-asi-tarama) | Pediatriya; Oilaviy tibbiyot | SanQvaM 0239-07/3, section "PROFILAKTIK EMLASH KALENDARI". <https://lex.uz/acts/5524039> | No formula: a calendar of an authority, entered and signed by a local clinician. | not applicable — an official act |
| Growth for age against the standard the national programme names (today the slot buyume-persentil) | Pediatriya; Oilaviy tibbiyot | No order naming the standard was found. A 2025 local paper uses WHO standards (https://inscience.uz/index.php/preventive-medicine/article/download/7502/7294/23221). | WHO Child Growth Standards (2006), as cited by that paper; the WHO tables were not fetched. | unclear — WHO; not read |
| Degree of hearing loss in the local classification (a revision of odyometri-pta) | Otorinolaringologiya (LOR); surdologiya (if added) | Not found. | To be named by a local surdolog. | unclear |
| Candidates no source was read for, each to be confirmed by a local specialist before anything is built: Glasgow Coma Scale record (emergency care, neurology, neurosurgery, anaesthesiology); Apgar record (paediatrics, obstetrics); a stroke-risk and a bleeding score for atrial fibrillation (cardiology, internal medicine); a liver-function class (gastroenterology, infectious diseases); a breathlessness grade (pulmonology); body surface area (oncology); a tooth chart (stomatology, if added) | Shoshilinch tibbiy yordam; Nevrologiya; Neyroxirurgiya; Anesteziologiya va reanimatologiya; Pediatriya; Akusherlik va ginekologiya; Kardiologiya; Terapiya (ichki kasalliklar); Gastroenterologiya; Yuqumli kasalliklar; Pulmonologiya; Onkologiya | unverified — needs a local clinician. No national protocol naming any of these was read. | Not fetched. No formula, item or cut-off is written here. | unclear — several are owned (for example by a society or a publisher); none was read |

### 2.3 Licences, stated plainly

**No licence text of any rights holder could be opened in this session.** What can be said:

- **Already held back correctly.** Seven published questionnaires are placeholders because their wording belongs to somebody: BASDAI, the COPD Assessment Test, MIDAS, M-CHAT-R/F, PHQ-9 with GAD-7, IPSS, the Oswestry Disability Index. So are the STOPP/START criteria and the WHO eligibility table for contraception. None is shown. Each needs the owner's terms and an authorised Uzbek and Russian version before it is.
- **Switched on today and owned by somebody, terms not read:** the Emergency Severity Index (cited to the Emergency Nurses Association), the ASA physical status classes (American Society of Anesthesiologists), the KDIGO categories and risk grid (KDIGO), **BI-RADS** (American College of Radiology; the one most likely to need a licence for commercial software), and the published indices PASI, EASI, SCORAD and DAS28. The tools use the names and the arithmetic, not the wording of a form. Whether that needs permission is a question for the owner's lawyer, per instrument.
- **Read today:** the copy of the SCORE2 paper carries "© European Society of Cardiology 2021" and no open licence. The article on the WHO cardiovascular risk charts is published under CC BY 4.0; the licence of WHO's own chart booklets was not read.
- **Not read, needed for the core set:** the national edition of the International Classification of Diseases; a source of interaction data (likely paid); the WHO growth standards for use in commercial software.

## Part 3: specialties and clinic specialties

### 3.1 The official list

**"Tibbiy faoliyat amalga oshiriladigan tibbiy ixtisosliklar turlari nomenklaturasini tasdiqlash toʻgʻrisida"**: order of the Minister of Health No. 6 of 12 May 2021, registered by the Ministry of Justice on 12.05.2021 under No. 3303; annex 1 in the wording of the Minister's order No. 27 of 22.07.2023 (registration No. 3303-1). <https://lex.uz/uz/docs/-5422572>, read 2026-10-10. It replaced order No. 97 of 25.07.2017 (registration No. 2908, <https://lex.uz/uz/docs/-3284314>), which several of the pack's names still follow.

It is the list a licence for medical activity is written from: Cabinet of Ministers resolution No. 405 of 21.06.2017 on licensing told the Ministry to approve such a nomenclature (<https://lex.uz/uz/docs/-3242574>), and a legal publisher's note on the 2017 order is headed with the question of which medical specialisations a licence states (<https://www.norma.uz/uz/qonunchilikda_yangi/licenziyada_qanday_tibbiy_ihtisosliklar_kursatiladi>). Its table has three columns: a bachelor-level specialty ("Bazaviy mutaxassisliklar"), main specialties of the master's degree and clinical residency ("Asosiy mutaxassisliklar"), and specialties that need additional or deepened training ("Qoʻshimcha yoki chuqurlashtirilgan tayyorgarlik talab etadigan mutaxassisliklar"). It has eight directions: "Davolash ishi", "Pediatriya ishi", "Tibbiy profilaktika ishi", "Stomatologiya", "Tibbiy biologik ish", "Biotibbiyot muhandisligi", "Klinik psixologiya", "Xalq tabobati".

Three cautions. The page is read as flat text, so which column a name stands in was inferred from the order of the text; the names themselves are as printed. The Russian page of lex.uz shows the same Uzbek text, so **no official Russian name was found**: the pack's Russian names stay machine-written. Other official texts name specialties differently (attestation orders of 2015, 2019 and 2020; the Ministry's 2024 list of 51 areas for national protocols); where they differ it is noted.

### 3.2 Doctor specialties (30): keep 24, rename 6, remove 0, add 5

| Key | Name in the pack (Uzbek Latin / Russian) | Verdict | Official name, exactly as the order writes it | Where, and notes |
|---|---|---|---|---|
| `acil-tip` | Shoshilinch tibbiy yordam / Скорая и неотложная помощь | **keep** | Shoshilinch tibbiy yordam | Order No. 6, annex 1, row 23. The Ministry's 2024 list of protocol areas writes "Shoshilinch va tez tibbiy yordam". |
| `aile-hekimligi` | Oilaviy tibbiyot / Семейная медицина | **rename** | Oilaviy shifokorlik | Order No. 6, annex 1, row 1, the bachelor-level specialty of "Davolash ishi". The pack says "Oilaviy tibbiyot". The repealed 2017 nomenclature said "Umumiy vrachlik amaliyoti va oilaviy tibbiyot", and a 2020 attestation order still lists «оилавий тиббиёт». |
| `anestezi` | Anesteziologiya va reanimatologiya / Анестезиология и реаниматология | **keep** | Anesteziologiya va reanimatologiya | Order No. 6, annex 1, row 2 |
| `beyin-cerrahisi` | Neyroxirurgiya / Нейрохирургия | **keep** | Neyroxirurgiya | Order No. 6, annex 1, row 13 |
| `cocuk-cerrahisi` | Bolalar xirurgiyasi / Детская хирургия | **keep** | Bolalar xirurgiyasi | Order No. 6, annex 1, row 28 |
| `dahiliye` | Terapiya (ichki kasalliklar) / Терапия (внутренние болезни) | **rename** | Terapiya | Order No. 6, annex 1, row 3. The pack says "Terapiya (ichki kasalliklar)"; the order in force says "Terapiya" alone (the repealed one said "Ichki kasalliklar (terapiya)"). |
| `dermatoloji` | Dermatovenerologiya / Дерматовенерология | **keep** | Dermatovenerologiya | Order No. 6, annex 1, row 5 |
| `endokrinoloji` | Endokrinologiya / Эндокринология | **keep** | Endokrinologiya | Order No. 6, annex 1, row 22 |
| `enfeksiyon-hastaliklari` | Yuqumli kasalliklar / Инфекционные болезни | **keep** | Yuqumli kasalliklar | Order No. 6, annex 1, row 6 |
| `gastroenteroloji` | Gastroenterologiya / Гастроэнтерология | **keep** | Gastroenterologiya | Order No. 6, annex 1, row 3, additional specialty under "Terapiya" |
| `genel-cerrahi` | Umumiy xirurgiya / Общая хирургия | **rename** | Xirurgiya | Order No. 6, annex 1, row 21. The pack says "Umumiy xirurgiya", the name of the repealed 2017 nomenclature. |
| `gogus-cerrahisi` | Torakal xirurgiya / Торакальная хирургия | **keep** | Torakal xirurgiya | Order No. 6, annex 1, row 21, additional specialty under "Xirurgiya" |
| `gogus-hastaliklari` | Pulmonologiya / Пульмонология | **keep** | Pulmonologiya | Order No. 6, annex 1, row 3, additional specialty under "Terapiya" |
| `goz-hastaliklari` | Oftalmologiya / Офтальмология | **keep** | Oftalmologiya | Order No. 6, annex 1, row 16 |
| `kadin-hastaliklari-dogum` | Akusherlik va ginekologiya / Акушерство и гинекология | **keep** | Akusherlik va ginekologiya | Order No. 6, annex 1, row 1 |
| `kalp-damar-cerrahisi` | Yurak-qon tomir xirurgiyasi / Сердечно-сосудистая хирургия | **rename** | Kardioxirurgiya; Qon tomirlar xirurgiyasi | Order No. 6, annex 1, row 21, two additional specialties under "Xirurgiya". The pack has one role, "Yurak-qon tomir xirurgiyasi". The nomenclature has two specialties and no joint one; the 2019 attestation order writes «кардиохирургия» and «ангиохирургия». Split the role into two; until the kit can, name it by both. |
| `kardiyoloji` | Kardiologiya / Кардиология | **keep** | Kardiologiya | Order No. 6, annex 1, row 4 |
| `kulak-burun-bogaz` | Otorinolaringologiya (LOR) / Оториноларингология (ЛОР) | **keep** | Otorinolaringologiya | Order No. 6, annex 1, row 15. The pack adds "(LOR)", which the order does not have; a label may keep it. |
| `nefroloji` | Nefrologiya / Нефрология | **keep** | Nefrologiya gemodializ bilan | Order No. 6, annex 1, row 3, additional specialty under "Terapiya". The Ministry's 2024 list of protocol areas writes "Nefrologiya", as the pack does. |
| `noroloji` | Nevrologiya / Неврология | **keep** | Nevrologiya | Order No. 6, annex 1, row 7 |
| `onkoloji` | Onkologiya / Онкология | **keep** | Umumiy onkologiya | Order No. 6, annex 1, row 14. The Ministry's 2024 list of protocol areas writes "Onkologiya", as the pack does. |
| `ortopedi` | Travmatologiya va ortopediya / Травматология и ортопедия | **keep** | Travmatologiya va ortopediya | Order No. 6, annex 1, row 18 |
| `pediatri` | Pediatriya / Педиатрия | **keep** | Pediatriya | Order No. 6, annex 1, row 25 |
| `plastik-cerrahi` | Plastik xirurgiya / Пластическая хирургия | **keep** | Plastik xirurgiya | Order No. 6, annex 1, row 21, additional specialty under "Xirurgiya". The 2019 attestation order writes «пластик хирургия ва микрохирургия». |
| `psikiyatri` | Psixiatriya / Психиатрия | **keep** | Psixiatriya | Order No. 6, annex 1, row 9 |
| `radyoloji` | Radiologiya (nur tashxisi) / Лучевая диагностика (радиология) | **rename** | Tibbiy radiologiya | Order No. 6, annex 1, row 12. The pack says "Radiologiya (nur tashxisi)". Attestation orders of 2019 and 2020 also list «ультратовуш текшируви» and «функционал диагностика» as specialties of their own; neither word is in the order in force as it was read. |
| `romatoloji` | Revmatologiya / Ревматология | **keep** | Revmatologiya | Order No. 6, annex 1, row 3, additional specialty under "Terapiya" |
| `uroloji` | Urologiya / Урология | **keep** | Urologiya | Order No. 6, annex 1, row 19 |
| `spor-hekimligi` | Sport tibbiyoti / Спортивная медицина | **keep** | Sport tibbiyoti | Order No. 6, annex 1, row 3, additional specialty under "Terapiya". The earlier audit did not find it in the two texts it read; it is in the nomenclature. |
| `fizik-tedavi` | Tibbiy reabilitatsiya va fizioterapiya / Медицинская реабилитация и физиотерапия | **rename** | Reabilitologiya (davolash fizkulturasi, kurortologiya, fizioterapiya) | Order No. 6, annex 1, row 3, additional specialty under "Terapiya". The pack says "Tibbiy reabilitatsiya va fizioterapiya". The short form "Reabilitologiya" is the order's own word; "Davolash fizkulturasi" is listed beside it as a further specialty. |

**Recognised here, missing in the product, proposed to add.** That each is recognised is verified. That each is common in private outpatient practice is **not**: no figure was found, and a local clinician says which are worth building.

| Verdict | Official name | Where | Why |
|---|---|---|---|
| **add** | Stomatologiya | Order No. 6, annex 1, section IV, rows 42 to 52: "Umumiy stomatologiya", "Terapevtik stomatologiya", "Ortopedik stomatologiya", "Xirurgik stomatologiya (ogʻiz boʻshligʻi)", "Ortodontiya", "Dental implantologiya", "Bolalar stomatologiyasi" | A whole direction of the nomenclature that the product does not have. A 2021 presidential decree (PF-6318) freed new dental and cosmetology equipment from customs duty for private providers, which points to dentistry as a private field. It needs a note template, an intake set and tools of its own: the owner's decision. |
| **add** | Allergologiya va klinik immunologiya | Order No. 6, annex 1, row 3, additional specialty under "Terapiya" | Recognised and missing. How common it is in private outpatient practice: a local clinician. |
| **add** | Reproduktologiya | Order No. 6, annex 1, row 1, additional specialty under "Akusherlik va ginekologiya" | Recognised and missing. How common: a local clinician. |
| **add** | Bolalar nevrologiyasi | Order No. 6, annex 1, row 25, additional specialty under "Pediatriya" | Recognised and missing; the order lists eight paediatric subspecialties and the product has paediatrics and paediatric surgery only. Which of them matter in private practice: a local clinician. |
| **add** | Narkologiya | Order No. 6, annex 1, row 11 | A main specialty of the order, missing. Whether private providers practise it: a lawyer and a local clinician. |

The note on dentistry's customs relief is from a legal publisher's summary of 2021 acts on private medicine (<https://buxgalter.uz/oz/publish/doc/text176299_2021_yildagi_12_ta_nhhning_hususiy_tibbiet_sohasiga_tasiri>). Also in the order and not proposed, because nothing found says they are private outpatient fields: "Ftiziatriya", "Neonatologiya", "Gematologiya va transfuziologiya", "Patologik anatomiya", "Sud-tibbiy ekspertiza", "Endoskopiya", "Andrologiya va seksopatologiya", "Tibbiy psixoterapiya", the other paediatric subspecialties, and the whole direction "Tibbiy profilaktika ishi".

### 3.3 Clinic roles (10): keep 1, rename 5, remove 3, unverified 1, add 2

The Uzbek build has no separate list of clinic types. What it calls the clinic side is ten roles: five clinic doctors and five allied professions.

| Key | Name in the pack (Uzbek Latin / Russian) | Verdict | Official name | Where, and notes |
|---|---|---|---|---|
| `sac-ekimi` | Soch koʻchirib oʻtkazish / Трансплантация волос | **remove** | — | not in the nomenclature. No specialty of hair transplantation or of hair is in the order. Under which licensed specialty a clinic may offer it, and what it may call it, is for a lawyer and the local clinical lead. |
| `estetik-cerrahi` | Estetik xirurgiya / Эстетическая хирургия | **rename** | Plastik xirurgiya | Order No. 6, annex 1, row 21, additional specialty under "Xirurgiya". The word "estetik" is nowhere in the order. The recognised specialty is the one the doctor role plastik-cerrahi already carries, so the two roles are one specialty here. |
| `medikal-estetik` | Kosmetologiya (estetik tibbiyot) / Косметология (эстетическая медицина) | **rename** | Tibbiy kosmetologiya | Order No. 6, annex 1, row 5, additional specialty under "Dermatovenerologiya". The pack says "Kosmetologiya (estetik tibbiyot)". A 2015 attestation order writes «дерматовенерология ва тиббий косметология», the Ministry's 2024 list "Dermatovenerologiya va kosmetologiya". |
| `klinik-dermatoloji` | Dermatologiya (klinika) / Дерматология (клиника) | **rename** | Dermatovenerologiya | Order No. 6, annex 1, row 5. The pack says "Dermatologiya (klinika)". The specialty is the one the doctor role dermatoloji already carries; a 2021 order removed the word "(dermatologiya)" from a heading of the licensing requirements. |
| `longevity` | Profilaktik va yoshga qarshi tibbiyot / Превентивная и антивозрастная медицина | **remove** | — | not in the nomenclature. Nothing of preventive or anti-ageing medicine is in the order ("Valeologiya" stands under health management, "Diyetologiya" under "Terapiya"; "Gerontologiya" is an area of the Ministry's 2024 protocol list but not a specialty of the order). |
| `fizyoterapi` | Jismoniy reabilitatsiya mutaxassisi / Специалист по физической реабилитации | **unverified** | — | not found. The order lists doctors' specialties ("Reabilitologiya …", "Davolash fizkulturasi"). Whether a non-doctor physical-rehabilitation profession is recognised, and under which name, was not found: needs a local clinician and a lawyer. |
| `klinik-psikolog` | Klinik psixolog / Клинический психолог | **keep** | Klinik psixologiya | Order No. 6, annex 1, section VII, row 56. A doctor's specialty "Tibbiy psixologiya" (row 10) stands beside it. |
| `diyetisyen` | Diyetolog / Диетолог | **rename** | Diyetologiya | Order No. 6, annex 1, row 3, additional specialty under "Terapiya". The name fits; the kind does not. In the order dietology is a doctor's specialty after therapy, not an allied profession. Move the role to the doctor side, which changes how the assistant addresses it. |
| `ergoterapi` | Ergoterapevt / Эрготерапевт | **remove** | — | not in the nomenclature. No occupational therapy is in the order. Needs a local clinician to say whether the profession is practised under another name. |
| `odyoloji` | Audiolog / Аудиолог | **rename** | Surdologiya | Order No. 6, annex 1, row 15, additional specialty under "Otorinolaringologiya". The pack says "Audiolog" as an allied profession. The order knows surdology as a doctor's specialty after otorhinolaryngology. The earlier audit found both «Аудиолог» and «Врач сурдолог» in the Ministry's list of positions; that list was not re-read today. |

| Verdict | Official name | Where | Why |
|---|---|---|---|
| **add** | Stomatologiya (as a clinic) | Order No. 6, annex 1, section IV | As above: the clinic side is where a dental practice would sit. |
| **add** | Xalq tabobati | Order No. 6, annex 1, section VIII, row 58; the Minister of Health's order No. 54 of 27.11.2018, registration No. 3111 | A recognised direction with an order of its own on how medical activity with traditional methods is provided. Whether Notya wants this field at all is the owner's decision. |

**Types of clinic.** The product has no such field. The licensing requirements read today speak of an outpatient-type and an inpatient-type medical organisation («амбулатор типдаги тиббиёт ташкилоти», «стационар типдаги тиббиёт ташкилоти»: order No. 71 of 07.03.2019, registration No. 2905-3, <https://lex.uz/uz/docs/4271534>), and since 2021 of a "tibbiy punkt" staffed by mid-level workers and of "mobil tibbiyot" (order No. 13 of 26.07.2021, registration No. 2905-5, <https://lex.uz/en/docs/-5563449>). The Ministry's nomenclature of health-care institutions was not found.

"Remove" for a clinic role means: not a recognised specialty in the order read. It does not mean a clinic may not offer the service. Under which licensed specialty a clinic offers hair transplantation or "anti-ageing" care, and what it may call it in public, is a question for a lawyer in Uzbekistan; until it is answered the product should not present these three as specialties.

### 3.4 Which tools each specialty should see

"Core set" is section 2.1. The follow-up list comes with the first tool whose result can be kept. Tools in the third column are switched on today; those in the fourth are placeholders that stay off until their content is supplied and signed.

| Specialty | Core | Switched on today | Placeholders of this role | Proposed (Part 2) |
|---|---|---|---|---|
| Shoshilinch tibbiy yordam (`acil-tip`) | core set | `esi-triyaj`, `kritik-yol` | `acil-sevk` | — |
| Oilaviy shifokorlik (`aile-hekimligi`) | core set | — | `aile-asi-tarama`, `aile-kronik`, `aile-sevk`, `aile-kohort` | ten-year cardiovascular risk; NYHA class record; gestational age and expected date of birth; vaccination status; growth for age |
| Anesteziologiya va reanimatologiya (`anestezi`) | core set | `asa-preop`, `hava-yolu-notu`, `postop-agri` | — | — |
| Neyroxirurgiya (`beyin-cerrahisi`) | core set | `noro-postop`, `nobet-bilinc` | — | — |
| Bolalar xirurgiyasi (`cocuk-cerrahisi`) | core set | `cocuk-prepost-op`, `yara-dren-izlem` | `cocuk-onam-veli` | — |
| Terapiya (`dahiliye`) | core set | `kdigo-evre` | `kv-risk-score2`, `polifarmasi`, `antikoagulan` | ten-year cardiovascular risk; NYHA class record |
| Dermatovenerologiya (`dermatoloji`) | core set | `pasi`, `easi`, `scorad`, `yama-okuma` | `izotretinoin-gebelik-onleme` | — |
| Endokrinologiya (`endokrinoloji`) | core set | `rejim-karti` | `lab-izlem`, `dxa-tekrar` | ten-year cardiovascular risk |
| Yuqumli kasalliklar (`enfeksiyon-hastaliklari`) | core set | `antibiyotik-sure` | `viral-izlem`, `enfeksiyon-bildirim` | — |
| Gastroenterologiya (`gastroenteroloji`) | core set | — | `ibd-skor`, `hepatit-izlem` | — |
| Xirurgiya (`genel-cerrahi`) | core set | `yara-dren-izlem`, `genel-preop` | — | — |
| Torakal xirurgiya (`gogus-cerrahisi`) | core set | `toraks-preop`, `toraks-tup-yara` | — | — |
| Pulmonologiya (`gogus-hastaliklari`) | core set | `inhaler-teknik` | `cat-mmrc`, `akciger-aksiyon-plani` | — |
| Oftalmologiya (`goz-hastaliklari`) | core set | `gorme-keskinligi` | — | — |
| Akusherlik va ginekologiya (`kadin-hastaliklari-dogum`) | core set | — | `gebelik-takvimi`, `dogum-analik-raporu`, `kontrasepsiyon-mec`, `obstetrik-risk`, `kd-kohort` | gestational age and expected date of birth |
| Kardioxirurgiya; Qon tomirlar xirurgiyasi (`kalp-damar-cerrahisi`) | core set | `kalp-damar-preop`, `greft-yara-izlem`, `antikoagulan-vadeleri` | — | NYHA class record |
| Kardiologiya (`kardiyoloji`) | core set | — | `kv-risk-score2`, `kardiyo-izlem` | ten-year cardiovascular risk; NYHA class record |
| Otorinolaringologiya (`kulak-burun-bogaz`) | core set | `odyometri-pta`, `otoskopi-notu`, `vertigo-notu` | — | degree of hearing loss in the local classification |
| Nefrologiya gemodializ bilan (`nefroloji`) | core set | `kdigo-serit`, `diyaliz-seans` | `anemi-izlem` | ten-year cardiovascular risk |
| Nevrologiya (`noroloji`) | core set | — | `inme-kirmizi-bayrak`, `midas`, `antiepileptik-izlem` | — |
| Umumiy onkologiya (`onkoloji`) | core set | `kur-sayaci`, `toksisite-listesi` | — | — |
| Travmatologiya va ortopediya (`ortopedi`) | core set | `kirik-alci-takip`, `ortopedi-op-protokol`, `vas-fonksiyon` | — | — |
| Pediatriya (`pediatri`) | core set | `hedef-boy`, `doz-hesabi` | `buyume-persentil`, `asi-takvimi`, `gelisim-tarama`, `mchat-rf`, `pediatri-kohort` | vaccination status; growth for age |
| Plastik xirurgiya (`plastik-cerrahi`) | core set | `plastik-yara-greft` | `plastik-onam` | — |
| Psixiatriya (`psikiyatri`) | core set | — | `phq9-gad7`, `psikiyatri-guvenlik-triyaj`, `psikotrop-izlem` | — |
| Tibbiy radiologiya (`radyoloji`) | core set | `tetkik-kuyrugu`, `rapor-taslagi` | `radyo-kritik-bildirim` | — |
| Revmatologiya (`romatoloji`) | core set | `das28`, `eklem-28` | `iltihap-lab-izlem`, `basdai` | — |
| Urologiya (`uroloji`) | core set | `psa-hizi` | `ipss`, `uroloji-acil-triyaj` | — |
| Sport tibbiyoti (`spor-hekimligi`) | core set | `rtp-basamak`, `sakatlik-gunlugu` | — | — |
| Reabilitologiya (davolash fizkulturasi, kurortologiya, fizioterapiya) (`fizik-tedavi`) | core set | — | `ftr-seans-plani`, `vas-odi`, `ev-egzersiz` | — |
| Plastik xirurgiya (`estetik-cerrahi`) | core set | — | — | what Plastik xirurgiya sees: plastik-yara-greft, and its placeholder plastik-onam |
| Tibbiy kosmetologiya (`medikal-estetik`) | core set | — | — | — |
| Dermatovenerologiya (`klinik-dermatoloji`) | core set | — | — | what Dermatovenerologiya sees: pasi, easi, scorad, yama-okuma, and its placeholder izotretinoin-gebelik-onleme |
| Jismoniy reabilitatsiya mutaxassisi (`fizyoterapi`) | the three product screens only | — | — | — |
| Klinik psixologiya (`klinik-psikolog`) | the three product screens only | — | — | — |
| Diyetologiya (`diyetisyen`) | core set, once the role is moved to the doctor side | — | — | — |
| Surdologiya (`odyoloji`) | core set, once the role is moved to the doctor side | — | — | odyometri-pta (exists; to be shown here too); degree of hearing loss in the local classification |

For the specialties proposed to add: the core set, and nothing more until a local specialist names what is used. Dentistry would need a tooth chart, for which no source was read.

## What the kit cannot do yet for this country alone

1. **A country cannot have its own list of roles.** A test holds every country to the same forty roles as Türkiye (`lib/ulke/rolEslemesi.test.ts`: forty rows, none missing, none extra), and the Uzbek specialty list is typed by Türkiye's own list of keys (`countries/uz/klinik/branslar.ts`). Adding dentistry, splitting cardiovascular surgery in two, or dropping hair transplantation for Uzbekistan alone fails that test today. Renaming a role is possible now: a name is the pack's own text.
2. **A pack cannot supply a table.** A country may state single numbers for a tool (`parametreler`), and a placeholder's content is fixed as empty (`icerik: null` in `lib/ulke/araclar/tipler.ts`). A risk chart for one region, growth tables, a vaccination calendar or a coding table cannot be handed to a tool by a pack. Four tools of the proposed set need exactly that.
3. **A tool does not know the patient.** A tool is given today's date and the pack's numbers, nothing of the patient's file (`AracOrtami`). An age-dependent formula (EASI, growth, the age bands of a risk model) must ask the doctor to type the age again.
4. **One tool's result cannot feed another.** The joint count does not hand its two numbers to DAS28, and a future eGFR calculator could not hand its result to the KDIGO tool.
5. **"Every doctor role" has no short form.** A tool is for everybody (allied professions and accounts without a role included) or for a list of roles written out. A core clinical calculator must therefore name some thirty roles by hand, and the list must be kept right as roles change. Possible today, easy to get wrong.
6. **Changing a formula changes it for all six countries.** The arithmetic lives in the kit, shared by every country. That is right for a published formula (a fix to EASI is a fix everywhere) and it means the EASI, ASA and antibiotic findings above are the kit's to fix, not Uzbekistan's. A threshold that really differs by country must first be turned into a number the pack states.
7. **No clinic tools and no clinic type** exist in the country kit.

## Could not verify

**Pages that were not read, exactly.**

| Page | What happened |
|---|---|
| <https://static.norma.uz/documents3/3303.pdf> (the nomenclature order as a file) | the fetch failed; the same order was read on lex.uz |
| lex.uz, opened directly | refused by the session's network policy; lex.uz was read through the summarising tool only |
| <https://lex.uz/uz/docs/-5870213>, annex 27, "Tibbiy faoliyatni litsenziyalash PASPORTI" | the page was cut off before the annex |
| <https://extranet.who.int/ncdccs/Data/UZB_D1_КП%20по%20кардиологии%20рус%20.pdf>, section "Артериальная гипертония" (p. 46) | the text ended in the section before it |
| <https://academic.oup.com/eurheartj/article/42/25/2439/6297709> (the SCORE2 paper at its publisher) | not permitted; a repository copy of the same paper was read |
| the Ministry of Health's page of clinical protocols and standards (<https://gov.uz/oz/ssv/sections/klinik-qo-llanmalar>) | opened; it showed its menu and no document |
| the Ministry's list of positions in the DMED system (read by the earlier audit on 2026-10-09) | not re-read today |
| <https://pubmed.ncbi.nlm.nih.gov/34120185/> and two further pages of the secondary calculator site | not permitted; nothing in this report rests on them |
| The WHO cardiovascular risk charts and the WHO growth tables themselves, the KDIGO guideline, the ASA statement, the ACR atlas, and the papers behind PASI, EASI, SCORAD, DAS28, the audiometric degrees, the target-height formula and the load ratio | never reached: no address for them was found before the search allowance ran out |

**Never looked for, because the search allowance had run out:** every national clinical protocol except the 2015 cardiology collection (hypertension as now in force, diabetes, chronic kidney disease, asthma and COPD, antenatal care, child health, psoriasis and atopic dermatitis, rheumatoid arthritis, stroke, hearing loss, tuberculosis, hepatitis, HIV); the order that names the growth standard; the national screening programmes; the order on forms of medical documentation; the list of notifiable diseases; the nomenclature of health-care institutions; the primary publications behind every score in the kit; and the licence terms of every rights holder. A follow-up session with a fresh search allowance can take these up; the list in the data file says which tool waits on which.

**For a local clinician, by specialty:** every row marked unverified in sections 1.2 and 1.3; which triage scale emergency departments use; the notation of visual acuity; the classification and naming of hearing loss; the units local laboratories print (creatinine, glucose, cholesterol, haemoglobin, the albumin-to-creatinine ratio, CRP, PSA); which cardiovascular risk chart the protocol in force prescribes; which growth standard; which of the proposed specialties are worth building.

**For a lawyer in Uzbekistan:** under which licensed specialty a clinic may offer hair transplantation and "anti-ageing" care and what it may call them; whether a non-doctor rehabilitation profession and occupational therapy exist as professions; the use of the owned instruments named in section 2.3 inside commercial software.

## Sources read on 2026-10-10

| What | Where |
|---|---|
| Minister of Health, order No. 6 of 12.05.2021 (reg. No. 3303), nomenclature of medical specialties, annex 1 as revised 2023 | <https://lex.uz/uz/docs/-5422572> |
| The repealed nomenclature: order No. 97 of 25.07.2017 (reg. No. 2908) | <https://lex.uz/uz/docs/-3284314> |
| Legal publisher's notes on both nomenclature orders | <https://www.norma.uz/uz/qonunchilikda_yangi/qanday_mutahassisliklar_buyicha_tibbiet_faoliyati_amalga_oshiriladi> ; <https://www.norma.uz/uz/qonunchilikda_yangi/licenziyada_qanday_tibbiy_ihtisosliklar_kursatiladi> |
| Ministry of Health, "Milliy/mahalliy klinik protokol va standartlarni ishlab chiqish, tasdiqlash va tibbiyot amaliyotiga joriy etish metodologiyasi", Tashkent 2024 (51 protocol areas; "XKT-10/11" codes) | <https://api-portal.gov.uz/uploads/9601e5f7-7b41-8340-c074-d4e0a914804e_media_.pdf> |
| Attestation orders that name specialties: No. 401 of 19.10.2015, No. 94 of 08.04.2019, No. 54 of 03.03.2020 | <https://api-portal.gov.uz/uploads/672ec1d6-0290-6b8a-bdb6-0c7d1535be00_media_.pdf> ; <https://api-portal.gov.uz/uploads/b4b82a56-c1fe-bae1-d805-1657d47a3d94_media_.pdf> ; <https://api-portal.gov.uz/uploads/f412616f-92c1-2897-8adb-a0d82a7bccdc_media_.pdf> |
| Minimum requirements per specialty for licensing: order No. 71 of 07.03.2019 (reg. No. 2905-3); order No. 13 of 26.07.2021 (reg. No. 2905-5) | <https://lex.uz/uz/docs/4271534> ; <https://lex.uz/en/docs/-5563449> |
| Cabinet of Ministers resolutions on licensing medical activity: No. 405 of 21.06.2017 (superseded); No. 80 of 21.02.2022 | <https://lex.uz/uz/docs/-3242574> ; <https://lex.uz/uz/docs/-5870213> |
| Order No. 54 of 27.11.2018 (reg. No. 3111) on medical activity with traditional methods | <https://lex.uz/docs/4136809> |
| SanQvaM 0239-07/3, "Oʻzbekiston Respublikasida yuqumli kasalliklar immunoprofilaktikasi" (the vaccination calendar), and its amendment of 19.07.2021 | <https://lex.uz/acts/5524039> ; <https://lex.uz/docs/5524044> ; <https://lex.uz/docs/5520052> |
| Presidential resolution PP-4790 of 27.07.2020 on the sanitary-epidemiological committee | <https://lex.uz/docs/4914450> |
| "Сборник клинических протоколов по диагностике, лечению и профилактике сердечно-сосудистых заболеваний", Ministry of Health, Tashkent 2015 (read as far as the arrhythmia section) | <https://extranet.who.int/ncdccs/Data/UZB_D1_КП%20по%20кардиологии%20рус%20.pdf> |
| WHO Regional Office for Europe: PEN workshop report, Samarkand 2016; good-practice brief on Uzbekistan 2018; news item; NCD country profile 2018 | <https://who-sandbox.squiz.cloud/__data/assets/pdf_file/0005/335813/PEN-meeting-report-16.pdf> ; <https://who-sandbox.squiz.cloud/__data/assets/pdf_file/0007/367288/gpb-hss-ncds-uzb-eng.pdf> ; <https://www.who.int/europe/news-room/20-04-2018-intervention-package-improves-men-s-health-in-uzbekistan> ; <https://cdn.who.int/media/docs/default-source/country-profiles/ncds/uzb_en.pdf> |
| SCORE2 working group, Eur Heart J 2021;42:2439-2454 (repository copy; figure 5) | <https://push-zb.helmholtz-munich.de/deliver.php?id=31109> |
| Meyer et al., Tidsskr Nor Legeforen 2022, table 1 (the four risk regions, citing the 2021 European guideline) | <https://tidsskriftet.no/en/node/62283/pdf> |
| A secondary calculator page listing the regions and its references; its page on the 2021 kidney equation | <https://www.evigrade.com/en/calculators/score2> ; <https://www.evigrade.com/en/calculators/egfr-ckd-epi-2021> |
| WHO cardiovascular disease risk charts, Lancet Glob Health 2019;7:e1332-e1345 (record pages; CC BY 4.0) | <https://dspace.library.uu.nl/handle/1874/390215> ; <https://repub.eur.nl/pub/121288> |
| Local papers: child growth, Fergana 2025; cardiovascular risk in a Tashkent polyclinic 2023; hypertension, Tashkent Medical Academy 2023; and a Tashkent paper on risk factors whose journal and year were not in the text read | <https://inscience.uz/index.php/preventive-medicine/article/download/7502/7294/23221> ; <https://sammu.uz/ru/article/3316/download> ; <https://journals.tma.uz/index.php/cajm/article/download/657/548/1618> ; <https://www.heartj.asia/jour/article/download/4039/4038> |
| Legal publisher's summary of twelve acts of 2021 on private medicine | <https://buxgalter.uz/oz/publish/doc/text176299_2021_yildagi_12_ta_nhhning_hususiy_tibbiet_sohasiga_tasiri> |
| UNICEF Uzbekistan, mother and child health (no standard named) | <https://www.unicef.org/uzbekistan/uz/ona-va-bola-salomatligi> |
| The product's own code and records | `lib/ulke/araclar/`, `countries/uz/`, `countries/rol-eslemesi.json`, `countries/yasak-araclar.json`, `docs/COUNTRY-PACK-UZ-TOOLS-AUDIT.md`, `specialties/dahiliye/engines/score2.ts`; the earlier audit `docs/COUNTRY-AUDIT-UZBEKISTAN.md` on branch `audit/uz` |
