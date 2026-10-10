# Country audit: Uzbekistan

Audit of the Uzbek country pack (`countries/uz/`, served at `/uzbek`) against Uzbekistan's own standards. Done on 2026-10-09 by Claude, on branch `audit/uz` from `feat/ulke-butun` (d7bc33a0). The owner's instruction: "Go audit all these and make sure they all confirm to each countries standards."

**What was changed:** only files under `countries/uz/` and this document with its images (`docs/audit/uz/`). Nothing in the shared kit, in another country's folder, in `main`, or in any Turkish file. Nothing was merged or deployed, and no remote database, account or setting was touched.

**What this audit cannot say.** Every Uzbek and Russian sentence of the pack is machine-written and has been read by no native speaker. This audit checked letters, scripts, numbers and settings against sources; it did not and could not judge wording. No legal conclusion is drawn anywhere: legal matters are written as questions for a lawyer of the country.

**How to read the sources.** A standard is stated only with the official or primary page it was read from, on 2026-10-09. Where no such page could be opened, the item says **UNVERIFIED** and what was found instead. Pages were read through a fetching tool that summarises; a number or a name quoted below was on the page, the surrounding sentence is a paraphrase.

## Summary

| Verdict | Items |
|---|---|
| CONFORMS | 15 |
| DIFFERS | 6: 2 fixed in the country folder (Cyrillic loan words; the identification number's rule, written down and not applied); 2 are the kit's (date entry, time entry); 2 are the owner's or a lawyer's (titles, guardian age) |
| NOT HANDLED BY THE PRODUCT | 6 |
| NEEDS A LOCAL PERSON | 6 |

Counted by verdict, not by section: a section of Part A can carry two verdicts (a date is written the country's way and typed the browser's way).

The most important findings:

1. **The date of birth is typed in the browser's own format, not the country's** (kit, "Core" C1). The new-patient form, the front desk and four other screens use the browser's date field, so the same build asks for 7 March 2019 as `07.03.2019` in a browser set to Russian and as `03/07/2019` in a browser set to American English — **and also in a browser set to Uzbek**, for which this Chromium has no date-field data — beside dates the product itself writes as `07.03.2019`. Seen on screen (image 08; the follow-up date of a tool in image 12 reads `mm/dd/yyyy` on an Uzbek Cyrillic screen). The same mechanism applies to the time fields (C2; not captured).
2. **Uzbek in Cyrillic script misspelled loan words in 16 tool texts** («тс» for «ц», a missing «ъ» or «ь»: *коэффитсиент*, *эритротситлар*, *компютер* …). Fixed in the pack; the rule that produces the Cyrillic text is the kit's and still has the gap (C4).
3. **The age of consent to treatment is 14 in the law that was read, and the pack's guardian age is 18.** The two are not the same thing (the pack's age decides wording and who the intake form is addressed to), but nobody has decided it for Uzbekistan: a question for a lawyer (A23).
4. **Where the data may be stored changed in 2026.** Since 27 March 2026 the law requires only biometric, genetic and telecom-subscriber data to be stored in Uzbekistan; whether a recording of a patient's voice is biometric data is the question that decides whether this pack's design (database in Frankfurt, speech and model providers abroad) is possible at all. Stated precisely under "Questions for a lawyer", L1.
5. **"Prof. Dr." is not a title form of Uzbekistan** (A13). The owner's decision is unchanged; the difference is reported.
6. **The ambulance number 103 is now confirmed by an official page**, and the single emergency number 112 exists beside it (A10).
7. **The official structure of the personal identification number (JSHSHIR) is now known and tested**, and deliberately not applied (A11, fix D3).

## Part A and Part B: the standards sheet, and what the product does today

For each item: the standard and its source; what the pack says (file and line as of this branch); what the kit renders or accepts; the verdict.

How the kit writes and reads values (read in `lib/ulke/` and `components/ulke/`, not changed):

- **A date** is written from the pack's own pattern, digits only (`lib/ulke/uygulama/zaman.ts` `gunYazDesenle`, `lib/ulke/arayuz/bicim.ts` `tarihYaz`). `Intl` is used only to find the calendar day in the account's time zone, with a fixed technical locale. A date typed on the calendar is read by the same pattern (`gunCoz`). **Every other date entry is the browser's own date field** (`type="date"`: C1).
- **A time of day** is written as 24-hour `HH:MM` by the kit itself when the pack says 24 (`bicim.ts` `saatGoster`); `Intl` with the pack's locale is used only for a 12-hour pack. **A time is entered in the browser's own time field** (`type="time"`: C2).
- **A number and an amount** are written with the pack's two separators and the currency's decimal places (`lib/ulke/arayuz/sayi.ts`); no `Intl`. A typed decimal comma is accepted (`lib/ulke/araclar/girdi.ts:35`, `components/ulke/portal/HastaFormu.tsx:64`).
- **Month and weekday names**: no month name is rendered anywhere; weekday names are the pack's text.
- **The pack's locale** (`uz-Latn-UZ`) is used for one thing: sorting names (`Intl.Collator`, `lib/ulke/uygulama/hastalar.ts:171`, `lib/ulke/klinikHesabi/onBuro.ts:62`).
- **Does the runtime have the data?** Tested in Node 22.22.0 (ICU 77.1, CLDR 47, tzdata 2025b), the build's runtime here: `uz-Latn-UZ`, `uz-Cyrl-UZ` and `ru` are all supported for dates, numbers and sorting, with no fall-back to English; the Uzbek collation puts oʻ and gʻ after z and sh, ch after them. Held by a test (`countries/uz/standartlar.test.ts`). **In the browser it is different** (Chromium 141, Playwright's build 1194; Part C): the browser says it supports all three, and then writes an Uzbek Latin date as `2019 M03 7, Thu` and a number as `1,234,567.89` — a silent fall-back; Uzbek Cyrillic and Russian have real data; sorting has no Uzbek data at all. No screen of the kit asks the browser for any of this today (sorting runs on the server), and none should (C9).
- **A warning for whoever changes the kit:** the platform's own Uzbek data writes a short date as `09/10/2026` (slashes) and an amount as `1 440 000,00 soʻm` (two decimals). The pack's pattern and settings, not `Intl`, are what make the product write `09.10.2026` and `1 440 000 soʻm`. The comment in `lib/ulke/tipler.ts:117` ("rendering goes through Intl with `yerel`") no longer describes the code (C8).

### A1. Written date order and separators

- **Standard.** Day, month, year, with dots: `09.10.2026`. Official practice: the government portal's page header ("10.10.2026", https://gov.uz/en/advice/502/document/3256), the Central Bank ("09.10.2026, 12:19 (GMT+5)", https://cbu.uz/ru/arkhiv-kursov-valyut/), the national legislation database's document headers ("71-I-сон 06.05.1995", https://lex.uz/docs/-116158). In running text a date is written "1993-yil 2-sentabr" (https://lex.uz/docs/-112286). **UNVERIFIED as a formal standard:** the national standard for documents (OʻzDSt 1157) could not be opened; the Central Bank also writes "09/10/26" in one heading of the same page.
- **Pack.** `bicim.tarihDeseni: 'DD.MM.YYYY'` (`countries/uz/index.ts:46`); the hint beside a typed date: `KK.OO.YYYY` / `КК.ОО.ЙЙЙЙ` / `ДД.ММ.ГГГГ` (`countries/uz/uygulama/randevuMetinleri.ts:65, 189, 311`).
- **Kit.** Written by the pattern everywhere. Typed by the pattern on the calendar; typed in the browser's own format everywhere else.
- **Verdict.** Display: **CONFORMS.** Entry: **DIFFERS** in the kit (C1).

### A2. Month and weekday names in the three forms

- **Standard.** Uzbek, Latin: yanvar, fevral, mart, aprel, may, iyun, iyul, avgust, sentabr, oktabr, noyabr, dekabr; dushanba, seshanba, chorshanba, payshanba, juma, shanba, yakshanba. Cyrillic: январь … декабрь as legal texts write them with a suffix ("12 октябрда", "2 январда": https://lex.uz/docs/5955665); душанба … якшанба. Russian: январь … декабрь; понедельник … воскресенье. Sources: the dates in the legal texts above, and the platform's Unicode CLDR 47 data read in Node (not an official source of Uzbekistan). **UNVERIFIED:** no official text lists the weekday names or their abbreviations.
- **Pack.** Weekday names, long and short, in three forms (`randevuMetinleri.ts:34–35, 158–159, 280–281`). No month name anywhere in the pack.
- **Kit.** Renders the pack's weekday names; renders no month name.
- **Verdict.** Long weekday names: **CONFORMS** (equal to CLDR in all three forms; held by test). Month names: **NOT HANDLED** (nothing needs them: dates are digits). Short weekday names: **NEEDS A LOCAL PERSON** — the pack has `Du Se Chor Pay Ju Shan Yak` / `Ду Се Чор Пай Жу Шан Як`, CLDR has `Dush Sesh Chor Pay Jum Shan Yak` / `душ сеш чор пай жум шан якш`; no official abbreviation was found, so nothing was changed.

### A3. 24-hour clock

- **Standard.** 24-hour. Official practice: "12:19 (GMT+5)" (Central Bank, link above); CLDR for `uz` and `ru`.
- **Pack.** `uygulama.saatBicimi: 24` (`index.ts:193`).
- **Kit.** Writes `HH:MM`. Entry: the browser's time field.
- **Verdict.** Display: **CONFORMS.** Entry: follows the browser, **DIFFERS** in the kit (C2).

### A4. First day of the week

- **Standard.** Monday (CLDR week data for `uz-Latn-UZ`: first day 1, read in Node). **UNVERIFIED** from a legal text.
- **Pack.** `bicim.haftaBasi: 1` (`index.ts:46`). **Kit.** The week view starts on the pack's day.
- **Verdict.** **CONFORMS.**

### A5. Decimal and thousands separators

- **Standard.** Decimal comma, a space between groups of three: `1 234 567,89` (CLDR for `uz` and `ru`). **UNVERIFIED as a formal standard**, and official practice is mixed: the Central Bank's rate table prints `11846.57` with a decimal point and no grouping.
- **Pack.** `ondalikAyraci: ','`, `binlikAyraci: ' '` (`index.ts:46`). In sentences: 36 texts use a decimal comma, none a decimal point (held by test).
- **Kit.** Writes numbers by the pack's rules; accepts a typed comma.
- **Verdict.** **CONFORMS.** A note for the owner: the group separator is an ordinary space, so a long amount may break across two lines on a narrow screen; CLDR uses a no-break space. Not changed (the visible result is the same; see Part C for what the price cards look like).

### A6. Currency

- **Standard.** The soʻm; ISO 4217 code UZS; in Russian «сум» ("курсы иностранных валют к суму", Central Bank, link above); the amount first, the word after it. ISO 4217 gives UZS two decimal places (the tiyin); prices are quoted in whole soʻm. **UNVERIFIED:** the article of the Central Bank law that names the currency was not opened.
- **Pack.** `paraBirimi: { kod: 'UZS', simge: 'soʻm', ondalikHane: 0 }` (`index.ts:44`); the price line `% soʻm / oy`, `% сўм / ой`, `% сум / мес.` (`countries/uz/acilis/icerik.ts`, `narx.oylik`).
- **Kit.** `tutarYaz` writes `360 000`; the pack's sentence adds the word.
- **Verdict.** **CONFORMS** for a price list. For the owner: an invoice or a payment may need the two decimals ISO gives the currency; nothing in the kit shows money other than the landing page today.

### A7. Time zone

- **Standard.** One zone, UTC+5, no daylight saving time (IANA zone `Asia/Tashkent`, tzdata 2025b: +05:00 in every month of 2026, tested). A national time scale UTC(UZ) is in use from 1 January 2025 (https://uza.uz/ar/posts/ozbekistonda-milliy-vaqt-shkalasi-utc-uz-zhoriy-etiladi_625728, the state news agency; the resolution's number is not on the page). **UNVERIFIED:** the legal act that fixes UTC+5.
- **Pack.** `saatDilimi: 'Asia/Tashkent'`, `saatDilimleri: ['Asia/Tashkent']` (`index.ts:45, 191`). **Kit.** Every day and hour is computed in the account's zone from the platform's zone data.
- **Verdict.** **CONFORMS.**

### A8. Units for body weight, height, temperature

- **Standard.** Kilograms, centimetres, degrees Celsius (SI). **UNVERIFIED** from the metrology law's text.
- **Pack.** `birimler: { agirlik: 'kg', boy: 'cm', sicaklik: 'C' }` (`index.ts:194`); unit names `kg / кг`, `sm / см`, `°C / °С` (`countries/uz/uygulama/formMetinleri.ts`, `birim`).
- **Kit.** The intake form and the tools show a measured field with the pack's unit name.
- **Verdict.** **CONFORMS.** For a native reader: the pack writes the centimetre as `sm` in Uzbek Latin.

### A9. Laboratory units, and blood pressure

- **Standard.** **UNVERIFIED.** No Ministry of Health document stating the units laboratories report could be opened in this session. What is usual in the region (molar units: mmol/l for glucose and cholesterol, µmol/l for creatinine, g/l for haemoglobin) is general knowledge, not a source. Blood pressure is written systolic/diastolic in millimetres of mercury («мм рт. ст.», *mm sim. ust.*).
- **Pack.** One laboratory unit is stated: the urine albumin-to-creatinine ratio in `mg/g` (`countries/uz/uygulama/araclar/birimler.ts:39`), marked unverified there, read by the two KDIGO tools. No switched-on tool reads glucose, creatinine, haemoglobin or cholesterol. Three tools take a laboratory value in a fixed unit: C-reactive protein in mg/l and the sedimentation rate in mm/hour (DAS28), prostate-specific antigen in ng/ml. Blood pressure: no field carries a unit; vital signs are a free-text field of the note.
- **Verdict.** Albumin-to-creatinine ratio, C-reactive protein, sedimentation rate, PSA units: **NEEDS A LOCAL PERSON** (a local clinician confirms what laboratories print). Glucose, creatinine, haemoglobin, cholesterol, blood pressure notation: **NOT HANDLED** (no tool or field takes them).

### A10. Emergency telephone numbers

- **Standard.** The ambulance is **103**: the state services portal's page of the emergency medical service says to call the short number "103", free of charge (https://gov.uz/oz/advice/63/document/1090). A single dispatch service **112** was created by Cabinet of Ministers Resolution No. 304 of 29.05.2024 (https://gov.uz/en/advice/502/document/3256) and was reported operating in every region in March 2025 (the Ministry of Digital Technologies, quoted by a news site: https://live.kun.uz/en/news/2025/03/25/uzbekistans-unified-112-emergency-system-now-fully-operational-nationwide). **UNVERIFIED:** whether 103 is answered by the same dispatchers, and until when it stays.
- **Which number a patient-facing "not for emergencies" notice should name.** 103: it is the ambulance's own number and the official page for emergency medical help names it and no other. Whether to name 112 beside it is for a local clinician and the owner; the kit holds one number (C6).
- **Pack.** `portal.acilNumara: '103'` (`index.ts:148`). No sentence contains the number (held by test).
- **Verdict.** **CONFORMS.** The comment beside the setting used to say "written from general knowledge, unverified"; it now names the source (fix D1). Still to do by a person in the country: dial-check.

### A11. The personal identifier (JSHSHIR / PINFL)

- **Standard.** The personal identification number of an individual, *jismoniy shaxsning shaxsiy identifikatsiya raqami* (JSHSHIR; Russian ПИНФЛ). Cabinet of Ministers Resolution No. 177 of 12.04.2022 (https://lex.uz/docs/5955665): 14 digits — one digit for sex and century of birth (1 to 6), six for the date of birth (DDMMYY), three for the district, three for the serial number, one control digit (the first 13 digits weighted 7, 3, 1 repeating, summed, modulo 10). The regulation's own examples: `3 121093 204 024 7`, `4 020190 205 001 0`. The resolution calls it the single identifier for state, bank, social and other services.
- **Whether a private product may ask for it, and under which law: a question for a lawyer** (L8): the Law "On Personal Data" No. ZRU-547 governs collecting it; no page read says a private clinic's software may or may not.
- **What must never be collected: also for the lawyer.** What the law read here singles out is biometric and genetic data (must be stored in Uzbekistan: L1). The pack collects neither; the voice profile is switched off.
- **Pack.** `ulusalKimlik: { ad: 'JSHSHIR', hane: 14, gecerliMi: 14 digits }` (`index.ts:51`); labels JSHSHIR / ЖШШИР / ПИНФЛ (`countries/uz/uygulama/metinler.ts:97, 281, 461`); `kimlikNumarasi.dogrula: false` (`index.ts:200`): optional, stored encrypted, not validated.
- **Kit.** Shows the field where the pack has an identifier; never shows it to the front desk; validates only when the pack says so.
- **Verdict.** Name, length, labels: **CONFORMS.** Structure and control digit: were "to verify"; now verified and written down, **not applied** (fix D3; the owner decides, C5).

### A12. Patronymic and name order

- **Standard.** Family name, given name, father's name: *familiyasi, ismi va otasining ismi* (an instruction of the Ministry of Justice uses exactly these words, para. 5: https://lex.uz/docs/-2308332); фамилия, имя, отчество. The Law on the State Language, Article 15, lets a person write their name according to national and historical tradition (https://lex.uz/ru/acts/-121051).
- **Pack.** `adAlanlari.ikinciAd: true` (`index.ts:196`); labels "Familiyasi va ismi" + "Otasining ismi", «Фамилияси ва исми» + «Отасининг исми», «Фамилия и имя» + «Отчество» (`metinler.ts:88–89, 272–273, 452–453`).
- **Kit.** One field for family and given name, one for the patronymic.
- **Verdict.** **CONFORMS** (held by test).

### A13. Doctors' categories, degrees and titles

- **Standard.** Qualification categories: third, second, first and highest — «учинчи, иккинчи, биринчи ва олий малака тоифалари», given for five years (Cabinet of Ministers Resolution No. 477 of 18.09.2023, regulation para. 8: https://lex.uz/ru/docs/6612635). So a doctor is an *oliy toifali shifokor* ("doctor of the highest category"). Academic degrees since Presidential Decree PF-4958 of 16.02.2017: doctor of philosophy (PhD) and doctor of science (DSc) (title of the decree on the Academy of Sciences' site: https://academy.uz/en/page/pdf/ozbekiston-respublikasi-prezidentining-farmoni-16022017-y-pf-4958-oliy-oquv-yurtidan-keyingi-talim-tizimini-yanada-takomillashtirish-togrisida; **the decree's text was not opened**). The older forms *t.f.n.* and *t.f.d.* (candidate and doctor of medical sciences) and the academic titles *dotsent* and *professor*: **UNVERIFIED** here, general knowledge.
- **Pack.** By the owner's decision of 2026-10-09 the assistants carry the Turkish product's titles: "Prof. Dr." / «Проф. д-р» for 31 roles, "Dr." / «Д-р» for 5 (`countries/uz/klinik/asistanUnvanlari.ts`).
- **Verdict.** **DIFFERS — the owner's decision, not changed.** "Prof. Dr." before a name is the Turkish (and German) form. In Uzbekistan a senior doctor is described by category and degree, typically after or around the name ("oliy toifali shifokor", "t.f.d., professor"); "Dr." before a name is not the usual form in either language. For the owner, with a native reader: keep the Turkish form as a brand choice, or name the assistants the local way.

### A14. Official names of the specialties (the pack's 40 roles)

- **Standard.** The nomenclature of specialties is approved by the Ministry of Health (stated in Cabinet of Ministers Resolution No. 319 of 18.12.2009, paras. 3 and 41: https://lex.uz/docs/1561584). **The nomenclature itself could not be found: UNVERIFIED.** Two official texts that use the names were read instead:
  - Ministry of Health Order No. 94 of 08.04.2019, attestation results by specialty, in Uzbek Cyrillic (https://api-portal.gov.uz/uploads/b4b82a56-c1fe-bae1-d805-1657d47a3d94_media_.pdf);
  - the Ministry's code system of positions and professions of its DMED system, 300 entries in Uzbek and Russian, a draft (version 0.10.0: https://packages2.fhir.org/xig/resource/uz.dhp.core%7Ccurrent/CodeSystem/CodeSystem-dmed-specialties-cs.json). It names the person ("Kardiolog"); the pack names the field ("Kardiologiya").
- **Pack.** `countries/uz/klinik/rolAdlari.ts:36–82`, machine-written, three forms.
- **Agree with one of the two texts (22):** emergency care (*shoshilinch tibbiy yordam*), anaesthesiology and reanimatology, therapy, dermatovenerology, endocrinology, infectious diseases (*yuqumli kasalliklar*), gastroenterology, general surgery (*umumiy xirurgiya*), thoracic surgery (*torakal xirurgiya*), pulmonology, ophthalmology, obstetrics and gynaecology, cardiology, otorhinolaryngology, nephrology, neurology, oncology, traumatology and orthopaedics, paediatrics, psychiatry, rheumatology, urology.
- **Differ, for a local clinician (10):**

| Role | The pack | The official texts |
|---|---|---|
| `kalp-damar-cerrahisi` | Yurak-qon tomir xirurgiyasi (one specialty) | two: «кардиохирургия» and «ангиохирургия» (Order 94); Kardiojarroh, Tomir jarroh (DMED) |
| `plastik-cerrahi` | Plastik xirurgiya | «пластик хирургия ва микрохирургия» (Order 94) |
| `fizik-tedavi` | Tibbiy reabilitatsiya va fizioterapiya (one) | two positions: Fizioterapevt; «Врач реабилитолог» (DMED) |
| `aile-hekimligi` | Oilaviy tibbiyot | Oilaviy shifokor (DMED, the position) |
| `beyin-cerrahisi` | Neyroxirurgiya | Neyrohirurg (DMED's own spelling, with h) |
| `radyoloji` | Radiologiya (nur tashxisi) | Radiolog (DMED) |
| `diyetisyen` | **Diyetolog** | **Dietolog** (DMED): a spelling difference |
| `klinik-psikolog` | Klinik psixolog | Psixolog (DMED) |
| `odyoloji` | Audiolog | «Аудиолог», and separately «Врач сурдолог» (DMED) |
| `cocuk-cerrahisi` | Bolalar xirurgiyasi | «Детский хирург» (DMED; the Uzbek form was not visible) |

- **Not found in either text (8):** sports medicine; the five clinic roles (hair transplantation, aesthetic surgery, cosmetology as "aesthetic medicine", clinic dermatology, preventive and anti-ageing medicine); the allied "physical rehabilitation specialist" and occupational therapist. Whether each is a recognised specialty or profession in Uzbekistan, and what a private clinic may call it, is for the local clinical lead and a lawyer.
- **Verdict.** **NEEDS A LOCAL PERSON.** Nothing was changed: these are names, and no nomenclature was in hand.

### A15. Paper size

- **Standard.** A4. **UNVERIFIED** (the documents standard could not be opened).
- **Product.** The country kit prints nothing and makes no PDF. **NOT HANDLED.**

### A16. Telephone numbers

- **Standard.** Country code +998, a national number of nine digits, a two-digit operator or area code first; written `+998 XX XXX XX XX`. **UNVERIFIED from the numbering plan itself:** the page tried at the International Telecommunication Union was not Uzbekistan's.
- **Pack.** `telefon: { ulkeOnEki: '+998', ulusalHane: 9, ornek: '+998 90 123 45 67' }` (`index.ts:47`); the rule accepts +998 and nine digits in any common spelling, first digit 1 to 9, operator codes not checked (`index.ts:28–36`).
- **Kit.** Shows the pack's example as the placeholder; the server applies the pack's rule.
- **Verdict.** Shape: **CONFORMS** (held by test). **For the owner:** the example is a well-formed mobile number that may belong to somebody (the other packs of this repository use a number from a range reserved for fiction, or X in place of digits). No reserved range of Uzbekistan was found, so nothing was changed; the repository's own rule suggests `+998 XX XXX XX XX`.

### A17. Postal address format

- **Standard.** **UNVERIFIED** (neither the national post nor the Universal Postal Union's page was opened).
- **Product.** No address is asked or printed anywhere in the kit. **NOT HANDLED.**

### A18. The Uzbek Latin alphabet and its apostrophe letters

- **Standard.** Law No. 931-XII of 02.09.1993 "On introducing an Uzbek alphabet based on the Latin script" (https://lex.uz/docs/-112286), as amended by Law No. 71-I of 06.05.1995 (https://lex.uz/docs/-116158): 26 letters and three letter combinations (sh, ch, ng); oʻ and gʻ are written with a mark after the letter, and the *tutuq belgisi* (apostrophe) is a sign of its own. **The law prescribes a shape, not a character code:** its table on lex.uz prints the mark as a backtick. Official practice today: the national legislation database writes "Oʻzbek", "toʻgʻrisida" with U+02BB and "maʼnaviy" with U+02BC in the titles and text of the same pages; the government portal writes "qo‘ng‘iroq" with U+2018 (https://gov.uz/oz/advice/63/document/1090). A phased full move to the Latin script is under way (Cabinet of Ministers Resolution No. 61 of 2021, named in lex.uz's note; not opened).
- **Pack.** U+02BB after o and g, 1 717 times, and nowhere else; U+02BC as the tutuq belgisi, 50 times; no ASCII apostrophe, backtick or typographic quote in any Uzbek Latin text; no Cyrillic letter in Latin text; no Latin apostrophe letter and no mixed-script word in Cyrillic text; no Uzbek-only letter in Russian text (2 500 texts per form scanned).
- **Verdict.** **CONFORMS**, consistently, with the practice of the national legislation database. Held by a new test.
- **Two findings of the same scan:**
  - **Uzbek Cyrillic loan words: DIFFERS, fixed** (D2).
  - **Quotation marks, for a native reader.** Russian text uses «» throughout (conforms to Russian practice). Uzbek text uses «» in 5 application texts and “” in 1 landing-page quotation, in both scripts. The official Uzbek pages read use “ ” ("“Lotin yozuviga asoslangan oʻzbek alifbosini joriy etish toʻgʻrisida”gi Qonun", lex.uz; "“103” raqamiga", gov.uz). No rule was found, so nothing was changed.

### A19. State-language rules for an interface and for medical documentation

- **Standard.** Law "On the State Language" No. 167-I of 21.12.1995 (new edition; in the edition in force from 25.07.2026: https://lex.uz/ru/acts/-121051). Article 10: in enterprises, institutions and organisations, record keeping, accounting, statistical and financial documentation is kept in the state language, and where most staff do not know Uzbek other languages may be used beside it. Article 20: signs, announcements, price lists and other visual information are in the state language, and a translation may be given. Law "On Advertising" No. ZRU-776 of 07.06.2022, Article 6: advertising is distributed in the state language; a translation is allowed under conditions (https://lex.uz/en/acts/6052633). The law's articles name no script.
- **Pack.** Uzbek in Latin script is the default of the public pages and of an account; Russian is offered beside it; a doctor chooses the language of the note.
- **Verdict.** Default language: **CONFORMS.** Which language a medical record must or may be kept in: **NEEDS A LOCAL PERSON** — a question for a lawyer (L7).

### A20. Standard forms of primary medical documentation

- **Standard.** **UNVERIFIED.** The Ministry of Health's order approving the forms of primary medical documentation (the outpatient card and the record of a consultation) could not be found on lex.uz in this session; the searches returned other countries' forms. What was read: the Law "On Protection of Citizens' Health" No. 265-I of 29.08.1996, Article 10, obliges private health care to keep medical records "in the established manner" (https://lex.uz/acts/41329).
- **Pack.** The note is subjective, objective, assessment, plan, plus each role's own fields (`countries/uz/klinik/notSablonlari.ts`); the slot `record_forms` is empty and switched off.
- **Verdict.** **NEEDS A LOCAL PERSON** (a local clinician names the forms in use and says whether the template's fields cover them). Nothing claims that a note is an official form.

### A21. Medicine naming in prescriptions

- **Standard.** Prescriptions are written by international nonproprietary name: Order of the Minister of Health No. 121 of 01.07.2020, registered by the Ministry of Justice under No. 3277, "… writing prescriptions by the international nonproprietary name …" (https://lex.uz/acts/4880952; the Uzbek text: https://lex.uz/acts/4880063). The body of the order was not opened: the rule is taken from its title. An electronic prescription system is being introduced in stages since December 2025 (a news site: https://www.spot.uz/ru/2026/05/01/prescriptions-stop/).
- **Product.** No prescription is written; no medicine is named; the slots `medicines_register` and `prescription_format` are empty. **NOT HANDLED**, as intended.

### A22. Diagnosis coding

- **Standard.** **UNVERIFIED.** The Ministry's own value set for diagnoses could not be read (the request was refused by the fetching proxy). Which revision of the International Classification of Diseases is in use, and in which language, stays open.
- **Product.** The slot `diagnosis_coding` is empty. **NOT HANDLED.**

### A23. The age at which a person consents to their own treatment

- **Standard.** Fourteen. Law "On Protection of Citizens' Health" No. 265-I, Article 26: for a person under 14 and for a person declared legally incapable, consent is given by the legal representatives; Article 19: minors over 14 have the right to voluntary informed consent or refusal (https://lex.uz/acts/41329; read in the Russian text, which lex.uz marks as not the official language of the act).
- **Pack.** `veliYasi: 18` (`countries/uz/ayarlar.ts:11`, `index.ts:202`), "an assumption to confirm with a lawyer". It decides the guardian wording of a note ("who gave the history") and that the intake form of a patient under 18 is addressed to a parent or guardian. The recording consent is ticked by the doctor.
- **Verdict.** **DIFFERS from the age in the law, and is not the same question — NEEDS A LOCAL PERSON** (a lawyer: L9). Not changed.

### A24. The prices on the landing page

- **Check.** 1 490 × 240.71 = 358 657.90 → 360 000; 3 490 × 240.71 = 840 077.90 → 840 000; 5 990 × 240.71 = 1 441 852.90 → 1 440 000 (nearest 10 000). The rate: the Central Bank's table for 09.10.2026 lists "1 Турецкая лира … 240.71" (https://cbu.uz/ru/arkhiv-kursov-valyut/).
- **Pack.** `countries/uz/acilis/fiyatlar.ts:62–64`; the amounts are written `360 000 soʻm / oy`.
- **Verdict.** **CONFORMS:** the arithmetic is right, the rate is the bank's, the amounts are written the country's way. Prices not changed.

## Questions for a lawyer of Uzbekistan

None of these is answered here.

- **L1. Where the data is stored and processed.** Law "On Personal Data" No. ZRU-547 of 02.07.2019, Article 27-1, as rewritten by Law No. ZRQ-1125 of 26.03.2026, in force from 27.03.2026 (https://lex.uz/docs/8099215). As read: biometric data, genetic data and the data of telecom subscribers must be stored in Uzbekistan; other personal data of citizens may be stored and processed abroad when one of three conditions holds — the foreign state is on the Cabinet of Ministers' list of states giving equivalent protection, or the operator uses standard contractual terms or binding corporate rules meeting the authorised body's requirements, or the operator follows international standards on that body's list. The list: Cabinet of Ministers Resolution No. 415 of 29.07.2026, 49 states, in force from 03.08.2026 (reported by a state-owned newspaper: https://yuz.uz/ru/news/uzbekistan-utverdil-perechen-iz-49-stran-s-ravnotsennoy-zaitoy-personalnx-dannx; **the list itself was not read**). Regulator: the authorised state body for personal data (its name was not on the pages read).
  **The question, precisely:** this pack's database is hosted in Frankfurt, Germany; the recording of a visit is sent for transcription, and the transcript for note-writing, to providers outside Uzbekistan and outside Germany. (a) Is Germany on the list of Resolution No. 415? (b) Under which of the three conditions may the transcript go to the speech and model providers' countries? (c) Is a recording of a patient's and a doctor's voice "biometric data" under the law — and if so, may it leave Uzbekistan even for the minutes before it is deleted? (d) Must this database be registered in the State Register of Personal Data Databases (Article 20 as amended)? (e) What must the patient be told and sign?
- **L2. Health data.** Is health data a special category under ZRU-547, with which form of consent (written, electronic)? Medical secrecy: Law No. 265-I, Articles 24 and 25 (https://lex.uz/acts/41329): what may a clinic's software provider see, and under which agreement with the clinic?
- **L3. Recording a consultation; the voice.** Whose consent, in which form, recorded how? Does the doctor's own voice need consent as an employee's? See L1 (c).
- **L4. Registration or certification of the software.** Is software that writes a visit note, or a tool that calculates a clinical score, a medical device? Regulator: the State Institution "Center for Pharmaceutical Products Safety" under the Ministry of Health; acts: Cabinet of Ministers Resolution No. 738 of 24.11.2025 on state registration, in force from 26.02.2026 (https://lex.uz/en/docs/7861699; its text was not opened), and Presidential Decree PD-137 of 19.08.2025 on risk-based regulation of medical devices (named in the Center's own slides: https://www.imdrf.org/sites/default/files/2026-03/Uzbekistan%20CPPS.pdf, which do not mention software).
- **L5. Telemedicine and messages between a doctor and a patient.** Which act regulates remote consultations (none was found in this session), and is a written message inside a product one? Must a private clinic enter visits in the state's electronic record (the Ministry's DMED system), and may outside software be used beside it?
- **L6. Advertising.** Law "On Advertising" No. ZRU-776 of 07.06.2022 (https://lex.uz/en/acts/6052633): Article 34 restricts the advertising of medicines (among other things, people who look like doctors); Article 6 is the language rule. Does the landing page of clinical software, which presents a named assistant with the title of a professor, fall under any rule for advertising medical services? May the Russian page stand alone?
- **L7. The language of a medical record.** Law No. 167-I, Article 10 (A19): must a private clinic keep its records in Uzbek? May a note be written in Russian? Does any act prescribe the script?
- **L8. The identification number.** May a private product ask a patient for the JSHSHIR, for which purpose, and must it then validate or protect it in a stated way (A11)?
- **L9. Ages.** At which age is the intake form addressed to the patient rather than to a parent; who consents to the recording for a patient of 14 to 17 (A23)?

## Part C: what was seen on real screens

**How it was built.** `NOTYA_COUNTRY=uz npm run build:ulke` in this worktree, with the stand-in addresses on ports of this audit's own (application 3163, stand-in database 54463). Six country audits built on one machine at the same time, and the shells of that machine share a memory limit of 6.27 GB; the build's step "Checking validity of types" needs about 3 GB by itself. **This audit's build was killed at that step four times** (the kernel's log: "Memory cgroup out of memory"). The build that was used was made with a local wrapper configuration, never committed and deleted afterwards, that loads the repository's own configuration unchanged and skips only that step. The pack scan and the wall check ran before it and the build proof after it, as in any country build: `[ulke-derleme-kaniti] ok — 219 output files: "uz" pack present (5 file(s)), no other country's pack`. The build holds the fixes of Part D. **The type check was run separately (`npx tsc --noEmit`); its result is stated in Part D.**

**The walk-through.** The pack-neutral walk-through (`scripts/ulke-yuruyus/genel.mjs`) against that build and the stand-ins: **458 checks passed and none failed; the run then stopped** in step 6b (clinic invitations) on a 30-second wait that ran out, with the machine under the other builds' load. Everything before it was walked: the public pages, login, first-login questions, home, settings, new patient, visit to approved note, appointment, the patient portal, the intake form, the tools area, "my templates", messages, consultation, the second account, and the first clinic screen. **The rest of the clinic steps were not walked in this audit.** The Uzbek pack's own deeper walk-through (`yuruyus.mjs`) was not run.

**The screenshots.** Taken afterwards on the same running build with the installed Playwright Chromium (build 1194, Chromium 141; nothing downloaded), the time zone set to Asia/Tashkent, a synthetic patient made for the purpose ("SINOV Karimova Dilnoza", *sinov* = test), the stand-ins answering for speech and the model. Fourteen images, each under 300 KB, in `docs/audit/uz/`. Each was read; what is written below is what is on the image.

| Image | Screen | What is on it, against Part A |
|---|---|---|
| `01-landing-uz-latn.jpg` | Landing page, Uzbek Latin | Uzbek Latin throughout; oʻ and gʻ drawn with the turned comma; the language switch "Oʻzbekcha / Русский"; the assistant is named "Prof. Malika" (A13). |
| `02-landing-prices-uz-latn.jpg` | Landing page, prices | "360 000 soʻm / oy", "840 000 soʻm / oy", "1 440 000 soʻm / oy": space between thousands, no decimals, the word after the amount, each on one line (A5, A6, A24). The footnote: taxes not included, two months with yearly prepayment, 40% for the first 50 doctors — the promises that await the owner's confirmation. |
| `03-signup-uz-latn.jpg` | Sign-up | Invitation code first; "Ism va familiya" for the doctor's own name; interface language "Oʻzbekcha". Nothing was submitted: no account was created. |
| `04-language-choice-uz-latn.jpg` | Settings: the language choice | Interface language and note language, each "Oʻzbekcha / Русский"; the script "Lotin yozuvi / Кирилл ёзуви", each named in its own script; the role "Pediatriya"; the assistant "Prof. Dr. Malika Nazarova". (The first-login question asks the same; the account had already answered it.) |
| `05-calendar-uz-latn.jpg` | Calendar, week, Uzbek Latin | The week runs Du, Se, Chor, Pay, Ju, Shan, Yak — Monday first (A4); days as `12.10` (day.month, A1); times `09:30`, `14:30`, `16:00` (A3); "Barcha vaqtlar Toshkent vaqti boʻyicha" (A7). |
| `06-calendar-uz-cyrl.jpg` | The same, Uzbek Cyrillic | Ду, Се, Чор, Пай, Жу, Шан, Як; every label in Cyrillic; the same digits. The only Latin text is data: the account's and the patients' names, and the brand. |
| `07-calendar-ru.jpg` | The same, Russian | Пн … Вс; «Записать на приём», «График работы». **A defect seen:** the status word «Запланирована» is cut off at the edge of the appointment card («Запланирован»). The Uzbek words fit (C10). |
| `08-new-patient-date-field-by-browser-language.jpg` | New patient | Labels "Familiyasi va ismi", "Otasining ismi (ixtiyoriy)", "Tugʻilgan sana", "Telefon", "JSHSHIR (ixtiyoriy)" (A11, A12); the phone example `+998 90 123 45 67` (A16). **The date of birth 7 March 2019 is shown by the field as `03/07/2019`.** Below it, the same field in three browsers: language American English `03/07/2019`; language Russian `07.03.2019`; **language Uzbek `03/07/2019`**. After saving, the patient's file writes "Tugʻilgan sana 07.03.2019" (C1). |
| `09-visit-note-uz-latn.jpg` | A visit note (draft), Uzbek Latin | "Koʻrik qaydi · 10.10.2026 06:03": day.month.year and a 24-hour time, in Tashkent's time (the machine's clock was 01:03 UTC); template "Pediatriya"; "Prof. Dr. Malika Nazarova"; for this patient of 7 the field "Anamnezni kim bergani (ota-onasi yoki qonuniy vakili)" (A23). Weight, height and temperature are free-text fields with no unit. The text inside the fields is the stand-in's placeholder, in English: **nothing about what the real model writes in Uzbek was seen.** |
| `10-visit-note-uz-cyrl.jpg` | The same, Uzbek Cyrillic | Every label in Cyrillic; «Проф. д-р Малика Назарова»; «Объектив кўрик» with its «ъ»; the same date and time. |
| `11-visit-note-ru.jpg` | The same, Russian | «Запись приёма · 10.10.2026 06:03»; «Кто сообщил анамнез (родители или законный представитель)»; «Проф. д-р Малика Назарова». |
| `12-tool-with-units-uz-cyrl.jpg` | A calculating tool, Uzbek Cyrillic (after the fix D2) | Units beside each field: (кг), (мг/кг), (мг), (мл); a typed decimal comma `18,5` is accepted; ranges written `0,3 – 300`, `0 – 1 000`, `0 – 100 000` (A5); «Концентрация: миллиграмм», the corrected spelling; the sentence "the tool knows no medicine, recommended dose or limit". **The follow-up date field reads `mm/dd/yyyy`, in English, on this Cyrillic screen** (C1). No number was computed: only the weight was typed. |
| `13-portal-page-with-messages-uz-latn.jpg` | The patient's page, on a phone, with the messages | "Assalomu alaykum, …"; the doctor and "Pediatriya"; the notice "Xabarlar shoshilinch holatlar uchun emas … Shoshilinch holatda 103 raqamiga qoʻngʻiroq qiling", and at the foot "tez yordam chaqiring: 103" (A10); a message stamped "10.10.2026 06:03"; appointments "14:30 Dushanba, 12.10.2026 · 30 daqiqa" (A1, A2, A3); the days to ask for as "Du 12.10". |
| `14-intake-form-uz-latn.jpg` | The intake form, on a phone | Part 5 of 6, "Oʻlchovlar (bilsangiz)": the child's height in `sm`, weight in `kg`, temperature in `°C` (A8); addressed to a parent ("Bolaning boʻyi"), as the guardian age of 18 makes it for a patient of 7. |

**The platform's own data, asked in that browser** (a script on the new-patient page): `Intl.DateTimeFormat.supportedLocalesOf(['uz-Latn-UZ','uz-Cyrl-UZ','ru'])` answers all three; yet a full date in `uz-Latn-UZ` comes out as `2019 M03 7, Thu` and a number as `1,234,567.89` (no Uzbek Latin data: a silent fall-back), while `uz-Cyrl-UZ` gives «пайшанба, 07 март, 2019» and Russian is complete; `Intl.Collator.supportedLocalesOf` answers `ru` only. In Node all of it is real (Part A, top). The product is right on screen because it does not ask the browser.

**What was not seen.** A completed sign-up (no account was created anywhere); the first-login question itself; a computed tool result; the front desk, the clinic screens and anything of step 6 after the owner's screen; the patient's page and the intake form in Russian or in Cyrillic; a time field's own rendering; a real model's Uzbek or Russian note; print or PDF (the kit has none); the pages with their web fonts (the font host is answered empty on this machine, so the images show a fallback typeface).

## Part D: fixes made in the country folder

Commit 713b79f7 and the commits after it on `audit/uz`. After them: the pack's own tests 688 of 688, the pack-parameterised tests for `uz` 323 of 323, the wall check and the pack check clean (exit code 0 each). Type check (`npx tsc --noEmit`, the whole repository, on this branch): **TYPECHECK_PENDING — not finished when this text was committed; queued behind the other audits' builds.**

| # | File | Before | After | Source |
|---|---|---|---|---|
| D1 | `countries/uz/index.ts`, comment above `portal.acilNumara` (value unchanged: `'103'`) | "103 was written by Claude from general knowledge and is UNVERIFIED" | "103 — CHECKED AGAINST AN OFFICIAL SOURCE on 2026-10-09 …", names the page and Resolution No. 304 for 112, and still says "Not yet confirmed by a person in the country" | https://gov.uz/oz/advice/63/document/1090 |
| D2 | `countries/uz/uygulama/araclar/rol2.ts`, `rol3.ts`, `rol4.ts`, `rol5.ts`: the stored **Uzbek Cyrillic** form of 16 tool texts (the Latin and Russian forms untouched) | коэффитсиент, субектив, аппликатсион, вентилятсион (2), позитсион, репозитсион (2), эритротситлар (2), спетсифик, компютер (2), консентрация (3) | коэффициент, субъектив, аппликацион, вентиляцион, позицион, репозицион, эритроцитлар, специфик, компьютер, концентрация | The pack's own hand-written Cyrillic catalogue and the rule's own word list already write «ц», «ъ», «ь» in such words («Объектив», «инфекция», «консультация», «альбумин»); official Cyrillic texts of the Ministry write «анестезиология ва реаниматология», «экстракорпорал детоксикация» (Order 94, A14). **No native reader has confirmed these ten words.** |
| D3 | new `countries/uz/kimlik.ts` | the control-digit rule was "to verify" | the structure and control digit of the JSHSHIR as a pure function, **not applied** | https://lex.uz/docs/5955665 |
| — | `countries/uz/index.ts`, two comments beside `ulusalKimlik` and `kimlikNumarasi` | "the check-digit rule is to verify" | point to `kimlik.ts` and say that applying it is the owner's decision | as D3 |

Tests that hold them:

- `countries/uz/uygulama/araclar/kiril.test.ts`: the 16 corrected texts are registered as corrections of this audit (not a native reader's); a new test fails when a correction names a text that does not exist, when the rule itself has learned the word (the entry must then be removed), and when any tool text still holds such a letter sequence.
- `countries/uz/standartlar.test.ts` (new, 21 tests): the settings found to conform (date pattern, clock, week start, separators, currency, zone with no clock change in any month, units, phone shape, name fields, the ambulance number and that it stands in no sentence, weekday names, the date hint in each form's own letters); the JSHSHIR structure with the regulation's two examples; mechanical conformity of every text in the three forms (script purity, the two apostrophe letters, Russian quotation marks and dash, no decimal point, no 12-hour clock, no slashed date, nothing of the Turkish product); that the runtime has the locale data the pack names.
- `countries/uz/uygulama/mesaj.test.ts`, `portal.test.ts`: the two assertions that pinned the old "unverified" comment now pin the new one.

Not fixed on purpose: wording; the titles; the prices; the guardian age; the role names; the short weekday names; the quotation marks in Uzbek; the example phone number. Each is reported above with what was found.

## Core: findings that can only be fixed in the kit

Not changed. Each with the file and what would have to change.

- **C1. Date entry follows the browser, not the country.** `components/ulke/uygulama/Hastalar.tsx:132` (date of birth), `OnBuro.tsx:160` and `:214` (front desk: day of an appointment, date of birth), `Araclar.tsx:130` (a tool's date field), `AracKayitlari.tsx:90` (follow-up day), `KlinikYetkiler.tsx:93` (end of cover) use `type="date"`. A browser draws that field in its own language's order. Seen (image 08): `03/07/2019` for 7 March 2019 in a browser set to American English **and in one set to Uzbek** (this Chromium has no Uzbek data for the field and falls back), `07.03.2019` in one set to Russian. What would change: a typed field read by the pack's pattern, as the calendar's booking form already has (`Takvim.tsx:237`, `gunCoz`), with the pack's hint text. **This is a clinical-safety matter for every country whose order differs from the browser's** (a birth date of 07.03 read as 3 July).
- **C2. Time entry follows the browser.** `Takvim.tsx:241, 623, 627, 640, 641` and `OnBuro.tsx:161` use `type="time"`: 12- or 24-hour by the browser and system, whatever `uygulama.saatBicimi` says.
- **C3. The rule that derives Uzbek Cyrillic lacks loan-word stems.** `scripts/uz-kiril.mjs`, `SOZLUK`: add *tsion* → цион, *tsiyent* → циент, *tsit* → цит, *tsifik* → цифик, *subyektiv* → субъектив, *obyektiv* → объектив, *kompyuter* → компьютер, *konsentratsiya* → концентрация. Then the 16 registered corrections of D2 are removed (the test says which). The clinic catalogue (`klinikMetinleriKiril.ts`, derived byte for byte) had none of these words today; it has no way to carry a hand correction.
- **C4. One emergency number only.** `lib/ulke/tipler.ts` (`portal.acilNumara: string | null`) and the two sentences that take it. If 103 and 112 are both to be named, the setting must hold more than one.
- **C5. Applying the JSHSHIR structure.** `lib/ulke/ulke.test.ts:260` asserts that `12345678901234` is a valid Uzbek number. To apply `uzJshshirYapisiGecerliMi`, that kit test changes together with `ulusalKimlik.gecerliMi` and `kimlikNumarasi.dogrula` in the pack.
- **C6. A stale comment.** `lib/ulke/tipler.ts:117` says a date is rendered "through Intl with `yerel`". It is not, and for Uzbekistan it must not be (the platform's Uzbek data writes `09/10/2026`).
- **C7. The record of the country.** `docs/COUNTRY-PACK-UZBEKISTAN.md`, "Needs local content", row 78, and the table "What the pack holds today" still call 103 unverified and the check-digit rule "to verify". This audit may not edit that document.
- **C9. Never ask the browser for Uzbek.** In Chromium 141, `Intl` with `uz-Latn-UZ` claims support and writes `2019 M03 7, Thu` and `1,234,567.89`; the collator has no Uzbek. The kit is safe today because dates and numbers are written from the pack's pattern and names are sorted on the server (`lib/ulke/uygulama/hastalar.ts:171`, `lib/ulke/klinikHesabi/onBuro.ts:62`). The one place that hands the pack's locale to `Intl` in a screen is the 12-hour clock (`lib/ulke/arayuz/bicim.ts`, `onIkilik`), which Uzbekistan does not use. A rule worth a wall: no `Intl` call with the pack's locale in a client component.
- **C10. The Russian week view cuts a word.** `components/ulke/uygulama/Takvim.tsx` (`HaftaGorunumu`) with `uygulama.css`: at 1280 px the status «Запланирована» is clipped at the edge of the appointment card (image 07). The card should wrap or shorten the status; a shorter Russian word is wording, for a native reader.
- **C8. A language of Uzbekistan the product does not offer.** Karakalpak is not among the forms of the pack. Whether doctors in Karakalpakstan need it is for the owner (**UNVERIFIED:** its legal status was not read).

## Part E: medicines (research only; no medicine content was written)

- **The register.** The State Register of medicines, medical devices and medical equipment permitted for use in medical practice. It is kept by the State Institution "Center for Pharmaceutical Products Safety" (Russian: «Центр безопасности фармацевтической продукции») in the system of the Ministry of Health, and is placed on the official websites of the Ministry and of the Center (a legal information portal's summary of Cabinet of Ministers Resolution No. 738 of 24.11.2025: https://advice.uz/ru/news/2656). The Law on Medicines and Pharmaceutical Activity, as amended by Law No. OʻRQ-928 of 30.05.2024, says that information on prescription and non-prescription medicines is shown in the State Register (https://www.lex.uz/docs/-6946616).
- **URL, format, updates, languages, terms of reuse: UNVERIFIED.** The Center's site (https://uzpharm-control.uz/) answered with a heading and no content to the reader used here; the Center's own slides of March 2026 say it "is currently updating its official website" and give no address for the register (https://www.imdrf.org/sites/default/files/2026-03/Uzbekistan%20CPPS.pdf). No page read states a licence, an open-data release, or how often the register is reissued.
- **Official dosing information.** The instruction for medical use approved at registration is where dosing lives; the same law lets information on prescription medicines appear only in the instruction and in specialised publications for medical and pharmacy staff. Whether those instructions are published in a form a commercial product may copy: **UNVERIFIED.** No openly reusable national formulary was found. Dosing therefore means either a licensed reference or content a local clinician supplies and signs.
- **What the pack would need to take a names list.** Three empty, switched-off slots already name it: `medicines_register` (the shared slot of every note template, `countries/uz/klinik/notSablonlari.ts:461`), `medicine_lists` (the intake form: `countries/uz/klinik/hastaFormu/yerelIcerik.ts:59`) and `recete` (prescription drafting, `countries/uz/uygulama/araclar/yuvalar.ts:25`). A names list would be data of the country's folder with: international nonproprietary name, trade name, form, strength, registration number, holder, validity, the date of the register it came from, and the language of each name. The kit has no medicine search today; one would be built once for every country.
- **Risks.** A name list goes stale (a registration ends after five years; the register changes); a trade name in Russian or Uzbek may differ from what a doctor says aloud; the prescription rule is the nonproprietary name (A21), so a list that leads with trade names pushes the wrong way; information on prescription medicines must not reach a patient-facing page (the advertising and medicines laws: L6); copying a state register into a commercial product without written terms may not be allowed; a doctor may read a listed name as an endorsement or as proof of current registration.
- **One route, for the owner to decide.** Write to the Center for Pharmaceutical Products Safety, through the local partner or lawyer, asking for (1) the current register as a file and how it is reissued, and (2) written terms for showing it inside a commercial product. If both are granted: import **names only** into the `medicines_register` slot, show the register's date on every screen that uses it, add no dosing, and keep everything else of medicines switched off until a licensed reference is contracted and a local clinician has signed. If not granted: medicines stay free text, as today.

## Open items

| # | Item | Waits on |
|---|---|---|
| 1 | L1: storage in Frankfurt and processing abroad under Article 27-1 as amended; whether a voice recording is biometric data; whether Germany is on the list of Resolution No. 415 | **a lawyer**, before any patient's data is entered |
| 2 | L2 to L9: health data, recording consent, software as a medical device, telemedicine and messaging, advertising, the language of a record, the identification number, the ages | **a lawyer** |
| 3 | C1, C2: date and time entry by the country's pattern in the kit; C9: the rule against asking the browser for Uzbek; C10: the clipped Russian status | **Claude**, on the owner's word (kit work, all countries) |
| 3b | The clinic steps of the walk-through after the owner's screen, and the Uzbek pack's own walk-through, on a machine that is not building six countries at once (Part C) | **Claude** |
| 4 | C3: add the loan-word stems to the Cyrillic rule and remove the 16 registered corrections | **Claude** |
| 5 | The ten corrected Cyrillic words of D2, and every other Uzbek and Russian text | **a native reader** |
| 6 | Titles: keep "Prof. Dr." / "Dr." or name the assistants the local way (A13) | **Kaan**, with a native reader |
| 7 | The example phone number: keep `+998 90 123 45 67` or use `+998 XX XXX XX XX` (A16) | **Kaan** |
| 8 | Apply the JSHSHIR structure (refuse a number that fails it) or keep storing as typed (A11, C5) | **Kaan**; whether the number may be asked at all: a lawyer |
| 9 | Name 112 beside 103 on the patient's page (A10, C4); dial-check both from inside the country | **a local clinician**, then Kaan |
| 10 | The names of the 40 roles against the Ministry's nomenclature; the 10 differences and the 8 not found (A14) | **a local clinician** |
| 11 | Laboratory units the tools read; blood pressure notation (A9) | **a local clinician** |
| 12 | The forms of primary medical documentation and whether the note template covers them (A20); the diagnosis coding revision (A22) | **a local clinician** |
| 13 | Short weekday names and Uzbek quotation marks (A2, A18); `sm` for the centimetre (A8) | **a native reader** |
| 14 | Guardian age 18 against consent from 14 (A23) | **a lawyer**, then Kaan |
| 15 | The medicines register: the letter to the Center (Part E) | **Kaan** |
| 16 | Update row 78 and the "What the pack holds today" table of `docs/COUNTRY-PACK-UZBEKISTAN.md` (C7) | **Claude**, when this branch is taken |
| 17 | Sources that could not be opened and are marked UNVERIFIED: the documents standard (dates, paper), the numbering plan, the postal format, the metrology and central-bank law articles, the nomenclature of specialties, the forms order, the diagnosis value set, the list of 49 states, the register's address and terms | **Claude**, in a later session, or a local person |
| 18 | The group separator is an ordinary space (A5); Karakalpak (C8) | **Kaan** |
