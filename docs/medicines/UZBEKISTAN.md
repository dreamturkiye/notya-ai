# Medicines in Uzbekistan (`uz`) — research for the owner

Date of research: 2026-10-09. Research only: no code and no country pack file was changed, and the product's medicine slots for this country stay empty and switched off.

**What this document does not contain.** No dosing, indications, interactions, warnings or prescribing advice, from any source. Where an official list or register prints strengths, forms or instruction text next to a name, that content was left out on purpose (the one exception is the trade-name sample, where the State Register prints brand, form, strength and pack as a single product-name string and the string is kept whole).

**How the sources were read.**

- Legal acts were read on lex.uz and the State Register on the website of the Farmatsevtika mahsulotlari xavfsizligi markazi (`uzpharm-control.uz`), both opened in the browser pane after the owner's account approved access to those two sites. That gave the pages' real text and table cells.
- News pages and a few acts were read through the web fetch tool, which passes the page through a reader model. **That tool silently cut long pages short** (it returned the essential medicines list only up to section 40 of 65 and reported that nothing was missing). Every list in the CSV files was therefore taken from the full page in the browser and checked row by row; nothing in the CSV files rests on the fetch tool's reading.
- Part-way through, the fetch tool refused a number of pages with a rate limit. Those pages are listed under "Could not verify" and nothing was filled in from memory in their place.

Files that go with this document:

- `docs/medicines/uz-essential-or-most-used.csv` — 577 rows: the essential medicines list (508 rows) and the reimbursed outpatient list (69 rows). Lists, not rankings.
- `docs/medicines/uz-brand-generic-sample.csv` — 164 rows from the State Register: the trade names registered for the first 30 medicines of the essential list.

---

## 1. Most commonly prescribed or used medicines

### 1.1 There is no official "most prescribed" ranking, so there is no top 250

No official or authoritative source was found that ranks medicines in Uzbekistan by number of prescriptions, by packs dispensed or by consumption.

- **Ministry of Health and lex.uz.** The legal database holds lists (essential medicines, reimbursed medicines, the mandatory pharmacy assortment). None is ordered by use.
- **State Health Insurance Fund (Davlat tibbiy sugʻurtasi jamgʻarmasi).** Under the reimbursement regulation ([Cabinet of Ministers resolution No. 619 of 02.10.2024](https://lex.uz/mact/-7131893)) the Fund pays pharmacies for every reimbursed prescription, so it holds dispensing data for the reimbursed medicines. The regulation contains no duty to publish statistics, and a web search for published Fund statistics on most-dispensed medicines found nothing.
- **Electronic prescriptions.** Electronic prescribing only started on 10 December 2025, in Tashkent city and 15 pilot districts and cities ([Cabinet of Ministers resolution No. 570 of 08.09.2025](https://lex.uz/mact/-7723519)). The reports read for this research give connection figures but no ranking of prescribed medicines ([spot.uz, 13.12.2025](https://www.spot.uz/oz/2025/12/13/electronic-prescription/); [spot.uz, 01.05.2026](https://www.spot.uz/oz/2026/05/01/electronic-prescription/)).
- **State Register.** It lists what is registered, not what is used.
- **WHO.** A web search found one WHO Regional Office for Europe publication, titled "Availability and prices of essential medicines in Uzbekistan in 2021" (`https://www.who.int/europe/publications/i/item/9789289058643`). By its title it measures availability and prices, not prescribing or consumption. The page could not be opened (see "Could not verify").

**Therefore no list in this document may be called "most prescribed", and none is ordered by use.**

### 1.2 What exists commercially (SECONDARY — sales, not prescriptions)

Two commercial market audits cover Uzbekistan. Neither publishes a long ranking openly; both sell their data.

| Source | What it measures | What is published openly |
|---|---|---|
| Proxima Research, "PharmXplorer" system with its "Sell Out" product ([article of 18.06.2024 on the first quarter of 2024](https://proximaresearch.com/ua/en/news/audit-uz-1q-2024/)) | Retail pharmacy sales to end consumers of medicines and dietary supplements, in Uzbek sum and US dollars and in packs | The article text names only the three leaders by value among medicine brands, in this order: "Sodium Chloride, TIVORTIN, RHEOSORBILACTUM". Its top-10 tables are images. No molecule ranking. |
| IQVIA, as quoted in a press article ([Times of Central Asia, 11.11.2025](https://timesca.com/uzbekistans-pharmaceutical-market-in-2025-rapid-growth-foreign-investment-and-localization/)) | Wholesale value and packs, monthly and moving annual total | Company leaders and a few brand names with growth figures; no brand or molecule ranking with ranks. |

These are sales rankings of three names at most. They are recorded here as context and are **not** in the CSV.

### 1.3 What would be needed for a true top 250

| Who holds the data | What it is | How it could be obtained |
|---|---|---|
| Ministry of Health (the "Elektron retsept" module of the "Elektron sogʻliqni saqlash" system; servers watched by the Ministry's Raqamli sogʻliqni saqlash markazi) | Electronic prescriptions by international nonproprietary name, from 10.12.2025, Tashkent city and 15 pilot districts first, the whole country planned by the end of 2026 | A written request to the Ministry for a count of prescriptions per international nonproprietary name. This is the only source that counts prescriptions. It does not cover narcotic, psychotropic and potent medicines, which stay on paper forms, and for now it covers only part of the country. |
| State Health Insurance Fund | Dispensing of reimbursed outpatient medicines (69 rows in the list that takes effect on 01.01.2027) | A request to the Fund. Too narrow for a top 250. |
| Proxima Research; IQVIA | Retail or wholesale sales by value and packs, per brand and per molecule | Bought under licence. It is a sales ranking and must be labelled as one; the licence would have to allow showing the names inside a product. |
| Mandatory digital labelling system ([Cabinet of Ministers resolution No. 149 of 02.04.2022](https://lex.uz/uz/docs/-5936145), title only read) | Pack-level movement of labelled medicines | A request; whether aggregate figures are released is not known. |

### 1.4 The essential medicines list — the main list of this research (a list, not a ranking)

- **Act:** Order of the Minister of Health No. 34 of 21 August 2023, "Asosiy dori vositalari roʻyxatini tasdiqlash toʻgʻrisida", registered by the Ministry of Justice on 31 August 2023 under No. 3455, in force from 4 September 2023. Source: [lex.uz/docs/-6590070](https://lex.uz/docs/-6590070).
- **What it replaced:** the Minister's order No. 2 of 25 February 2021 (registration No. 3289 of 23.03.2021), which followed the order registered under No. 3045 on 27.07.2018 ([lex.uz search results](https://lex.uz/uz/search/all?query=Asosiy%20dori%20vositalari%20ro%CA%BByxatini%20tasdiqlash)).
- **Is it current?** The lex.uz page carries no repeal notice and no amendment notes, and the Ministry of Health cited this order as the list in force in December 2025 ([spot.uz, 13.12.2025](https://www.spot.uz/oz/2025/12/13/electronic-prescription/)).
- **Language and script:** Uzbek, Latin script. The Russian page of the act ([lex.uz/docs/6590074](https://lex.uz/docs/6590074)) has the order text but no annex.
- **Structure:** 65 numbered sections by pharmacological group. Three columns: "T/r" (number), "Xalqaro patentlanmagan nomi" (international nonproprietary name), "Dori shakli, dozasi" (form and strength). Only the first two columns were copied.
- **Size:** 508 medicine rows — 503 numbered rows and 5 unnumbered insulin lines under heading 23.5.1. (The act states no total; this is the count of the table rows.)
- **What is in the CSV:** one row per medicine row of the annex, in the order of the act, with the act's own row number as the position.

Things the reader must know about the source text (all kept exactly as the source has them):

- **Not every row is an international nonproprietary name.** The column is headed so, but it also holds group names ("Aluminiy va magniy birikmalari", "Temir Fe (II) birikmalari"), descriptions (vaccines, sera, "Qisqa taʼsirli insulin"), trade-style names ("Omnopon", "Korvalol", "Diaskintest") and, in sections 44 to 62 and 64 to 65, herbal raw materials and local preparations written as an Uzbek name followed by a Russian name in Latin letters and a Latin name in brackets.
- **Damaged characters in the source text.** Row 1.4.4. reads "Valproat kislotasi/v?lproat natriy" and row 58.4. contains "lis??v ?agoxilusa", with literal question marks on lex.uz. Copied as is.
- **Numbering slips in the act.** Number 4.5.1. is used for two different medicines; one anatoxin row inside section 29 is numbered 28.2.3.; rows 12.7.1 and 27.2.1 are printed without the final dot. Kept as printed.
- **Two names appear twice** (rows 45.1. and 45.3.; rows 50.1. and 50.4.), as in the act.
- **Spellings that look unusual but are the source's own**, for example "Pantoprozol", "Rifampitatsin + izoniazid + etambutol", "efavirens", "Daklatosvir", "Temozolamid", "Kalsium folinat", "natriy gidrokorbonat". None was corrected.
- **Row 38.13.** has the words "suyultirilgan eritma" inside the name cell; kept.

### 1.5 The reimbursed outpatient list (also in the CSV; a list, not a ranking)

Order of the Minister of Health No. 18 of 23 April 2026, "Reimbursatsiya dasturiga kiritiladigan kasalliklar va ularni davolashda beriladigan dori vositalari roʻyxatini tasdiqlash toʻgʻrisida", agreed with the State Health Insurance Fund, registered on 24 April 2026 under No. 3822. **The page is marked "Hujjat hali kuchga kirgan emas" — it takes effect on 1 January 2027** ([lex.uz/uz/docs/8161206](https://lex.uz/uz/docs/8161206); a copy of the signed order: [yep.uz PDF](https://yep.uz/wp-content/uploads/2026/04/uzbekistan-vozmeschenie-2026-2027.pdf)).

The annex has 69 numbered rows in 12 chapters by disease group, Uzbek Latin script, columns "T/r", "Dori vositalarning nomi", "Dori vositalarning shakli". For the five insulin rows the name cell also prints a strength, which the CSV leaves out and says so. Spellings such as "Klonozepam", "Trazadin" and "Ursodezoksixol kislotasi" are the source's own.

### 1.6 Other official lists that describe use

- **Mandatory pharmacy assortment** — section 2.4; its rows are in the appendix.
- **"High-demand" non-prescription medicines.** In December 2025 the Ministry of Health published on its own channels a list of 389 non-prescription medicines in high demand, with international and trade names; the press relayed it and reported 1,846 registered non-prescription products ([spot.uz, 12.12.2025](https://www.spot.uz/oz/2025/12/12/over-the-counter/)). It is a Ministry selection, not a count of sales or prescriptions, and no act number is given for it. The Ministry's own publication was not opened.

---

## 2. The country's "pharmacy lists"

### 2.1 State Register of medicines

- **Legal basis and keeper.** The regulation approved by [Cabinet of Ministers resolution No. 738 of 24.11.2025](https://lex.uz/docs/-7853907) (in force 26.02.2026; it replaced resolution No. 213 of 23.03.2018) says in clause 37 that the Centre — the state institution Farmatsevtika mahsulotlari xavfsizligi markazi under the Ministry of Health — keeps the "Tibbiyot amaliyotida qoʻllanilishiga ruxsat etilgan dori vositalari va tibbiy jihozlar davlat reyestri" and that it is placed on the official websites of the Ministry and of the Centre. The Law on medicines and pharmaceutical activity (new edition by [Law No. OʻRQ-399 of 04.01.2016](https://lex.uz/docs/-2856464), article 6) makes the Ministry keep the register and publish it periodically.
- **What the regulation says it contains (clause 37):** trade name; origin (original, generic, biosimilar, herbal, homeopathic, immunobiological); the international nonproprietary, group or chemical name of the active substance, strength and form; manufacturer's country, name and address; certificate holder; pharmacotherapeutic group and ATC code; manufacturer of the substance; certificate number and date; **whether it is supplied with or without a prescription**; date of changes.
- **Access (clause 38):** "Davlat reyestridagi maʼlumotlar barcha tanishishi uchun ochiq hisoblanadi" — the register's data are open for everyone to consult.
- **The public search site:** [uzpharm-control.uz/registry/drugs](https://uzpharm-control.uz/registry/drugs), "Dori vositalari reyestri". The site carries a banner "Sayt test rejimida ishlamoqda" (the site is running in test mode) and a link to the previous version of the site.
- **Size, as shown on 2026-10-09:** 46,154 records ("Jami yozuvlar"), one record per pack presentation. Filtering by status gives 18,883 records marked active; of the active ones 14,647 are prescription and 4,236 non-prescription.
- **Update cycle:** the register's data service reported its last update as 2026-10-08, and the record card shows "Yangilangan 2026-10-08" — it is maintained continuously, not issued in editions.
- **What a search result row shows:** registration number, type, trade name, international nonproprietary name ("MNN"), ATC code ("ATX"), manufacturer, country, status. Filters include prescription ("Retseptli"), generic, trademark, patent, GMP, dosage, form, manufacturer and country.
- **What a record card shows** ([example card](https://uzpharm-control.uz/registry/drugs/43794)): the tabs "Asosiy maʼlumotlar", "Buyruqlar", "Ishlab chiqaruvchilar", "Qadoqlash", "Dori tarkibi", "Chiqarish shakli", "Narxlar", "Yoʻriqnoma", "Hujjatlar", "Sertifikatlar" — that is, registration type (for example "По рецепту"), registration and expiry dates, route, form, strength, shelf life, manufacturers and their roles, packaging, composition, prices, the instruction for use, documents and certificates.
- **Languages and script.** The interface is Uzbek (Latin). The data are not in Uzbek: the trade name is one English/Latin string that joins brand, form, strength and pack (for example "Izofluran Liquid for inhalation 250ml vials"); the nonproprietary name is in English lower case ("isoflurane"); the form, the composition and the country names are in Russian ("Жидкость для ингаляций", "Индия").
- **Download.** The search page has a "Yuklab olish" (download) button and each record a "Reyestrni yuklab olish" / "Kartani yuklab olish" button, and the page loads a CAPTCHA step for downloads. The download was not used and its file format was not established.
- **Reuse.** The site footer reads "© 2025 DM "FMXM"". No statement about reuse of register data was found on the site or in the regulation. "Open for everyone to consult" is not a licence to copy the register into a commercial product.
- **Data quality, seen in the sample.** 13,360 of the 46,154 records carry the placeholder "Approved INN not exists" in the nonproprietary-name field. One product checked ("Natrii oxybutyratum …") shows "sodium ascorbate" in that field. Some ATC codes stop at four or five characters ("N03AA", "N05CM"). Any import needs review, not blind trust.

### 2.2 Prescription and non-prescription status

- There is **no longer a flat list of non-prescription medicines.** The last one (Order of the Minister of Health No. 8 of 12.07.2021, registration No. 3315 of 30.07.2021) was repealed on 05.05.2023 by Order No. 9 of 29.04.2023 (registration No. 3315-1) ([lex.uz/mact/-5541014](https://lex.uz/mact/-5541014)). Earlier editions were registered under No. 3200 (06.12.2019), No. 3087 (12.11.2018), No. 2946 (08.11.2017) and No. 2842 (30.11.2016).
- It was replaced by a procedure: the regulation approved by the Minister's order No. 10, registered on 04.05.2023 under No. 3430 ([lex.uz/mact/-6456837](https://lex.uz/mact/-6456837)), amended in 2024, by order No. 9 of 20.05.2025 (reg. No. 3627), order No. 21 of 04.12.2025 (reg. No. 3430-1) and order No. 15 of 30.04.2026 (reg. No. 3837). The Centre assigns each product to a category at state registration, against a list of criteria; **a medicine that does not meet the criteria for non-prescription supply is prescription-only.** The category is shown in the instruction for use and in the State Register.
- A public look-up for this one field also exists on the single services portal: "Retsept asosida va retseptsiz beriladigan dori vositalari haqida maʼlumot", `https://my.gov.uz/uz/service/get/1343` ([spot.uz, 16.12.2025](https://www.spot.uz/oz/2025/12/16/prescription-drugs/)); not opened.

### 2.3 Rules on writing prescriptions

- **Act:** Order of the Minister of Health No. 121 of 01.07.2020, registered on 01.07.2020 under No. 3277, approving the regulation "Tibbiyot tashkilotlarida dori vositalarini tayinlash, xalqaro patentlanmagan nomlanishi boʻyicha retseptlarni rasmiylashtirish hamda bemorning dori vositalarini qabul qilish, saqlash va qoʻllash tartibi toʻgʻrisidagi nizom" ([lex.uz/mact/-4880063](https://lex.uz/mact/-4880063)). Amended by order No. 16-mh of 28.07.2021 (reg. No. 3313), order No. 25 of 15.12.2025 (reg. No. 3725) and order No. 25 of 31.07.2026 (reg. No. 3919 of 07.08.2026).
- **Prescribing by international nonproprietary name is mandatory** in all medical organisations whatever their ownership (clause 3: "bemorga majburiy tartibda xalqaro patentlanmagan nom boʻyicha retsept yozilishi lozim"). No general exception allowing a trade name was found in the text.
- **Form:** one prescription form, 105 × 148 mm, with a tear-off counterfoil (annex 1); paper or electronic (clause 5). The regulation does not cover prescriptions for narcotic, psychotropic, potent or poisonous medicines or for preferential supply (clause 1).
- **Language of the prescription:** the nonproprietary name, composition and form in Latin; the directions to the patient in the state language (clause 10). A list of standard Latin prescription abbreviations is annexed.
- **The Law** (article 20): retail sale is by prescriptions in the form approved by the Ministry of Health, or without a prescription.

### 2.4 Minimum assortment every pharmacy must stock

- **Act:** Order of the Minister of Health No. 71 of 21.11.2016, "Barcha dorixonalarda boʻlishi majburiy boʻlgan dori vositalari va tibbiy jihozlar roʻyxatini tasdiqlash toʻgʻrisida", registered on 06.12.2016 under No. 2846, last amended by order No. 15 of 30.04.2026 (registration No. 3837 of 19.05.2026) ([lex.uz/docs/-3077603](https://lex.uz/docs/-3077603)).
- **Contents now:** 26 medicine rows and 6 medical-device rows (the numbering has gaps where rows were removed). Column heading: "Dori vositasining xalqaro patentlanmagan nomi yoki savdo nomi/tibbiy jihoz nomi". Most rows offer alternatives joined by "yoki" (or). The rows are in the appendix.

### 2.5 Reference prices

- **Act:** Order of the Minister of Health No. 23 of 10.12.2025, registered on 25.12.2025 under No. 3735, "Referent narx shakllantirish tizimi doirasida retsept bilan beriladigan dori vositalari narxlarini qayd etish tartibi toʻgʻrisidagi nizomni tasdiqlash haqida", in force three months after publication; it replaced order No. 115 of 24.03.2020 (reg. No. 3242) ([lex.uz/mact/-7952162](https://lex.uz/mact/-7952162)).
- **Scope:** prescription medicines only.
- **Who:** the act names the Farmatsevtika tarmogʻini rivojlantirish agentligi as the body that registers prices and publishes the register on its website and on the single services portal; it gives no web address.
- **Where the prices can be seen:** the State Register record card has a "Narxlar" (prices) tab with the registered price, its date and the capped wholesale and retail prices for that pack.
- **Update:** on application; imported reference prices are indexed on 1 January and 1 July.

### 2.6 Electronic prescribing acts

- [Cabinet of Ministers resolution No. 570 of 08.09.2025](https://lex.uz/mact/-7723519), "Sogʻliqni saqlash tizimini raqamlashtirish jarayonlarini yanada jadallashtirish boʻyicha qoʻshimcha chora-tadbirlar toʻgʻrisida".
- Order of the Minister of Health No. 25 of 15.12.2025, registration No. 3725, "«Elektron retsept» tizimini bosqichma-bosqich joriy etish tartibini tasdiqlash toʻgʻrisida" ([lex.uz/ru/docs/7920485](https://lex.uz/ru/docs/7920485)).
- An instruction on using the "Elektron poliklinika", "Elektron shifoxona", "Elektron tibbiy karta" and "Elektron retsept" modules, registered on 19.01.2026 under No. 3758 ([lex.uz/uz/docs/8007015](https://lex.uz/uz/docs/8007015); title only read).

### 2.7 Reimbursement

- [Cabinet of Ministers resolution No. 619 of 02.10.2024](https://lex.uz/mact/-7131893): the Ministry of Health sets the list of diseases and medicines; the State Health Insurance Fund contracts and pays pharmacies; prescriptions are electronic and by international nonproprietary name; each name, form and strength has a capped reimbursement value; the patient receives the medicine free of charge.
- The list itself: order No. 18 of 23.04.2026 (section 1.5).

### 2.8 Where the official lists must be published

Article 14 of the Law on medicines and pharmaceutical activity says the Ministry of Health's official website carries the State Register, the orphan-medicines list and **the essential medicines list**, among others ([lex.uz/docs/-2856464](https://lex.uz/docs/-2856464)).

### 2.9 Other lists found by title only

- Preferential supply of medicines to certain categories of persons: Cabinet of Ministers resolution No. 204 of 22.07.2013, "Shaxslarning ayrim toifalarini imtiyozli asosda dori vositalari bilan taʼminlash tartibini yanada takomillashtirish chora-tadbirlari toʻgʻrisida" (`lex.uz/uz/docs/-2211626`). The page was refused by the fetch tool; whether it carries a list of medicines is not known.
- Orphan medicines: the 2016 list (order No. 57 of 23.06.2016, reg. No. 2805) was replaced by order No. 76 of 22.05.2019, registration No. 3164 of 07.06.2019 ([lex.uz/docs/-2995684](https://lex.uz/docs/-2995684)). The current list was not opened.

---

## 3. How medicines are classified for supply (classification only)

| Class | Where it is defined | What follows for supply |
|---|---|---|
| Non-prescription | Assigned per product at registration under the regulation registered as No. 3430 on 04.05.2023 ([lex.uz/mact/-6456837](https://lex.uz/mact/-6456837)); shown in the State Register | Sold without a prescription; outside the reference-price system |
| Prescription | Every product not assigned to the non-prescription category (same regulation) | Prescription by international nonproprietary name (order No. 121 of 2020); electronic prescription where the system is live; reference prices apply |
| Narcotic drugs (list II), psychotropic substances (list III), precursors (list IV); list I is banned from circulation | [Law No. 813-I of 19.08.1999 "Giyohvandlik vositalari va psixotrop moddalar toʻgʻrisida"](https://lex.uz/mact/-86044), article 4; the lists are approved by the Cabinet of Ministers. The lex.uz notes to the law cite Cabinet of Ministers resolution No. 330 of 12.11.2015 as the act approving them. | Medical use on a doctor's prescription in the order set by the Ministry of Health (articles 11 and 24); outside the ordinary prescription regulation and outside the electronic prescription system; special paper forms. A Ministry of Health regulation on storing, dispensing, selling, distributing and accounting for them was registered on 27.01.2025 under No. 3604 (title only read). |
| Potent substances ("сильнодействующие вещества") | [Cabinet of Ministers resolution No. 818 of 27.09.2019 "О регулировании оборота сильнодействующих веществ в Республике Узбекистан"](https://lex.uz/docs/4532171), annex 1, a table by international nonproprietary name in Russian; amended by resolution No. 732 of 18.11.2025 | Outside the ordinary prescription regulation and the electronic prescription system; special paper forms ([spot.uz, 13.12.2025](https://www.spot.uz/oz/2025/12/13/electronic-prescription/)) |
| Reimbursed | Order No. 18 of 23.04.2026 under resolution No. 619 of 2024 | Free to the patient on an electronic prescription; pharmacy paid by the Fund |
| Essential | Order No. 34 of 21.08.2023 | List membership; the state guarantees access to essential medicines (Law, article 4) |
| Orphan | Order No. 76 of 22.05.2019 (reg. No. 3164) | Separate regime, not examined |

The contents of lists I–IV and of the potent-substances list, and the texts of the special prescription forms, were not copied.

---

## 4. Naming

- **Prescriptions must use the international nonproprietary name.** Paper: order No. 121 of 01.07.2020, clause 3 ([lex.uz/mact/-4880063](https://lex.uz/mact/-4880063)). Electronic: resolution No. 570 of 08.09.2025 — "dori vositalarining xalqaro patentlanmagan nomi boʻyicha (agar mavjud boʻlsa)", by nonproprietary name where one exists ([lex.uz/mact/-7723519](https://lex.uz/mact/-7723519)); its data fields allow the nonproprietary name "or original name".
- **On the prescription the name is written in Latin** (order No. 121, clause 10) — the Latin pharmaceutical name, not an Uzbek or Russian spelling.
- **In the Ministry's lists the names are Uzbek transliterations in Latin script**, not the WHO English spelling: the essential list writes "Paratsetamol", "Atsetilsalitsil kislotasi", "Siprofloksatsin", "Xlorpromazin". Spelling is not uniform between acts ("Ursodezoksixolat kislotasi" in the essential list, "Ursodezoksixol kislotasi" in the reimbursement list).
- **In the State Register the nonproprietary name is in English lower case** ("isoflurane", "valproic acid"), trade names are in Latin letters with the form and pack in English, and the composition and form are in Russian ("изофлуран", "Таблетки"). The potent-substances list is in Russian.
- **Uzbek Cyrillic.** No current medicine list in Uzbek Cyrillic was found.
- **So three spellings of one medicine are in official use** — for example the essential list's "Izofluran", the Register's "isoflurane" and its Russian composition entry "изофлуран". A product names list needs a reviewed table that ties them together; it cannot be produced by transliteration rules.

---

## 5. Electronic prescribing — context and open questions

What the acts and the Ministry's statements say (no claim is made about how it works in a clinic today):

- The "Elektron retsept" module is part of the Ministry of Health's "Elektron sogʻliqni saqlash" information system (resolution No. 570 of 2025). It started on 10 December 2025 in Tashkent city and 15 pilot districts and cities; the rest of the country is planned by the end of 2026.
- First stage: electronic prescription is mandatory for systemic antibiotics, synthetic antibacterials and systemic hormonal medicines; later groups are set by an Expert Council under the Ministry (order No. 25 of 15.12.2025).
- Private clinics and doctors can connect to the module free of charge; medical and pharmaceutical organisations connect through the DMED system ([spot.uz, 15.12.2025](https://www.spot.uz/oz/2025/12/15/e-prescriptions/)).
- On 1 May 2026 the Ministry put out a draft order that would cancel the phased procedure and move all prescription medicines to the electronic system, except potent, narcotic and psychotropic medicines and the reimbursement process ([spot.uz, 01.05.2026](https://www.spot.uz/oz/2026/05/01/electronic-prescription/)). Whether it was adopted was not established.
- The press reports "about 13,000 medicine names" covered by the system.

Questions for a pilot doctor or the Ministry before the product does anything with prescriptions:

1. May a third-party clinical product write into "Elektron retsept", or only the Ministry's own module and DMED? Is there an interface for private software?
2. Which medicine dictionary does the module use — is it the State Register, and in which language does the doctor search it?
3. Does the doctor pick a nonproprietary name only, or a registered product?
4. Is the draft of May 2026 in force, and what is mandatory today outside Tashkent and the pilot districts?
5. What does a doctor in a private clinic outside the pilot districts actually hand to the patient today?

---

## 6. What a names list for the product would be

- **The State Register can be the source of a searchable names list.** It is public, searchable, current to the day, and holds 46,154 pack records (18,883 active) with trade name, nonproprietary name, ATC code, manufacturer, country, prescription status, registration number and prices.
- **Its language is the catch.** It gives nonproprietary names in English and trade names in Latin letters; it gives nothing in Uzbek. The Uzbek spellings doctors see in the Ministry's lists come from lex.uz (508 + 69 rows, in the CSV).
- **Reuse is not settled.** The regulation makes the data open to consult; the site states a copyright line and no reuse terms; bulk download is behind a CAPTCHA. Legal acts themselves are different: article 8 of the [Law on copyright and related rights, No. OʻRQ-42 of 20.07.2006](https://lex.uz/docs/-1022944), says official documents (laws, decisions and the like) and their official translations are not objects of copyright — so the essential and reimbursement lists, being ministerial orders, can be reproduced. Whether the Register, a database kept by a state institution, falls under that article is a question for an Uzbek lawyer.
- **What must not be taken: dosing.** The Register's record card has a "Yoʻriqnoma" tab; for some products the data service returns the full instruction for use as text in Russian, for others nothing. That text was not copied anywhere. Dosing also lives in the Ministry's clinical protocols and standards (`https://gov.uz/oz/ssv/pages/tashhis-qo-yish-va-davolash-me-yorlari`, not opened). These are official documents to link to, not content to copy into the product.
- **A rule that touches the patient side.** Article 14 of the Law on medicines says information about prescription medicines is given "faqat tibbiyot va farmatsevtika xodimlari uchun moʻljallangan ixtisoslashtirilgan bosma nashrlarda", in instructions for use and in the State Register — that is, only in specialised publications meant for medical and pharmaceutical workers, in the instructions and in the Register. A doctor-facing list is one thing; showing prescription-medicine information to patients in the portal is another, and needs a lawyer's reading before it is built.

---

## A. How the Turkish product holds medicines (read-only look at this repository)

The Turkish product has three layers.

**A.1 The product catalogue — `data/sgk-ilaclar.json` (8,649 records).** One record per reimbursed pack. The file header says `kaynak: "SGK EK-4/A"`, `guncelleme: 2026-08-26`, `titck: 2026-08-26`. Fields, with how many records carry them:

| Field | Meaning | Filled |
|---|---|---|
| `ad` | Full product name as the insurer prints it: brand, strength, form and pack in one string | 8,649 |
| `marka` | Commercial (brand) name, cut from `ad` by the import script | 8,649 |
| `barkod` | Barcode | 8,648 |
| `kamuNo` | Public (insurer) product number | 8,648 |
| `esdegerGrubu` | Equivalent-medicine group code | 7,548 |
| `sgk` | Reimbursed by the state insurer (true for all, because the source is the reimbursed list) | 8,649 |
| `etkenMadde` | Active ingredient | 8,435 (2,411 distinct values) |
| `atc` | ATC code | 8,396 |
| `etkenKaynak` | Where the ingredient came from: `titck` (barcode match, 8,240) or `esdeger` (inherited through the equivalence group, 195) | 8,435 |
| `ruhsatAskida` | Licence-suspension code | 62 |

The type (`IlacKaydi` in `lib/ilac/ilacArama.ts`) also declares `form` and `doz`, but the data file does not fill them: strength and form live inside the `ad` string. There is no separate prescription-status field, no price and no registration number in this file.

Where the data came from, as the repository states it: `scripts/import-sgk-ilac.mjs` turns the insurer's published "Bedeli Ödenecek İlaçlar Listesi" (EK-4/A) spreadsheets, including the weekly change files, into this file; `scripts/import-titck-etken.mjs` adds the active ingredient and ATC code from the medicines agency's weekly "Ruhsatlı Beşeri Tıbbi Ürünler Listesi" spreadsheet, joined by barcode (the script notes 23,001 products in the agency list of 21.08.2026 and a 95% direct match). The search service `app/api/doktor/ilac-ara/route.ts` groups packs by brand.

**A.2 The clinical drug table — `lib/asistan/ilac/veri/*.ts` (176 molecules, 12 files by therapeutic area).** Type `TürkishDrug` in `lib/asistan/ilac/tipler.ts`: `name` (molecule), `brand[]` (commercial names), `dose`, `pediatricDose`, `pediatrik` (typed paediatric dose), `form`, `sgkCovered`, `sgkRestriction`, `category`, `siniflar` (classes), `alerjiSinifi`, `contraindications`, `interactions`, `etkilesimler` (typed interactions), `yasKontrendikasyonAy`, `gebelik`, `emzirme`, `bobrekDozUyarisi`, `karacigerDozUyarisi`, `renkliRecete`, `notes`, `kaynak` (source document, link and how it was verified). All 176 entries cite a summary of product characteristics of the Turkish medicines agency that was fetched and read (`kub(...)`); the type file states that no entry has yet been signed off by a physician. This is hand-curated clinical safety content, not an import.

**A.3 Controlled-prescription classes — `lib/doktor/receteRengi.ts`.** A short list of active ingredients mapped to the Turkish coloured prescription types, matched by active ingredient, never by brand.

(The patient's own medicine list is a separate table, `hasta_ilaclar`: name, active ingredient, dose, frequency, dates, notes.)

**So "Turkish depth" means:** a pack-level catalogue (brand + strength/form/pack string + active ingredient + ATC + reimbursement + equivalence group + barcode), built from two official downloadable spreadsheets joined by barcode; plus a small curated clinical table that is separate work.

---

## B. Uzbekistan, field by field

Source for almost every field: the **State Register** of the Farmatsevtika mahsulotlari xavfsizligi markazi — web search at [uzpharm-control.uz/registry/drugs](https://uzpharm-control.uz/registry/drugs), one web card per record, download behind a CAPTCHA, no reuse terms stated.

| Field in the Turkish record | Where it is in Uzbekistan | Status |
|---|---|---|
| Full product name (brand + form + strength + pack) | Register, "Savdo nomi", one string in Latin letters and English | **Available** |
| Brand name alone | Not a separate field; it has to be cut from the product string, as the Turkish import does | Derivable |
| International nonproprietary name | Register, "MNN", English lower case. 13,360 of 46,154 records hold the placeholder "Approved INN not exists"; errors exist | **Available, with gaps** |
| Manufacturer and country | Register; country in Russian; the card also lists the certificate holder and other parties | **Available** |
| Strength | Register card, "Dozasi" (and inside the product string) | **Available** |
| Form | Register card, "Dori shakli", in Russian | **Available** |
| ATC code | Register, "ATX" (sometimes cut to the group level) | **Available** — a field the essential list does not have |
| Prescription or non-prescription | Register, filter "Retseptli" and the card's registration type | **Available** |
| Registration number, date, expiry, status | Register | **Available** |
| Reference price (capped wholesale and retail) | Register card, "Narxlar"; legal basis order No. 23 of 10.12.2025 | **Available** per pack, prescription medicines |
| Essential-list status | Order No. 34 of 21.08.2023 on lex.uz, by Uzbek generic name; legal act, reproducible | **Available**, but must be matched to the Register's English names by a reviewed table |
| Reimbursed status | Order No. 18 of 23.04.2026 on lex.uz (in force 01.01.2027), by Uzbek generic name | **Available**, same matching need |
| Controlled class | Cabinet of Ministers lists I–IV (resolution No. 330 of 12.11.2015, not opened) and the potent-substances list (resolution No. 818 of 27.09.2019); the Register's data also carry psychotropic and controlled-substance markers | Available as legal lists; not copied |
| Barcode | **No open official source found.** The Register shows none. | Empty |
| Equivalence group | **No source.** Products can be grouped by nonproprietary name and ATC code, but no official group code exists. | Empty |
| Dosing text | The instruction for use on the Register card ("Yoʻriqnoma"), present for some records only; the Ministry's clinical protocols | **Link only** — see below |

**Dosing text — may the instruction for use be reproduced inside a product?** Nothing was found that permits it. What the acts say: the instruction of a local medicine is approved by the Centre's director and that of a foreign medicine is agreed with the Centre (resolution No. 738 of 2025, annex 1, clause 22), so it is the applicant's document for one product, not a ministerial act; the Register is "open for everyone to consult" (clause 38), which is not a reuse licence; the site states a copyright line and no reuse terms; and article 14 of the Law on medicines limits where information about prescription medicines may be given. Until an Uzbek lawyer says otherwise, the instruction is a document to **link to** (each Register card has its own address), not text to copy — and the product's own rule of writing no dosing stays in place either way.

---

## C. Generic name / trade name sample

File: `docs/medicines/uz-brand-generic-sample.csv` — **164 rows, every row copied from the State Register on 2026-10-09** and checked against it (see "Checks").

- **Scope:** the first 30 medicine rows of the essential list (1.1.1. Izofluran to 2.2.2. Diazepam).
- **How the Register was searched.** The Register has no Uzbek names, so each medicine was searched by the English nonproprietary name in the Register's "MNN" field. **Choosing that English search word for each Uzbek list name was my reading and is the one step not copied from a source**; the pairing is shown in the last column so that a pharmacist can confirm it. Everything in the other columns is the Register's own text.
- **What a row is.** The Register holds one record per pack, 692 pack records for these 30 medicines (592 marked active). To keep the sample readable, pack records were grouped by registration number, first word of the product name and manufacturer; each group is one CSV row showing the first pack record of the group exactly as the Register prints it, with two counts beside it (pack records in the group, and how many of them are marked active).
- **Columns.** The five asked for — `generic_name`, `commercial_name`, `manufacturer_if_shown`, `strength_and_form_if_shown`, `register_url` — plus `registration_number`, `atc_code`, the two counts and `essential_list_row`. `strength_and_form_if_shown` is empty in every row: the Register's list view prints form and strength inside the product-name string, which is kept whole in `commercial_name` rather than cut by guesswork.
- **Things the sample shows about the Register:**
  - 1.2.1. "Natriy oksibutirat" was not found under any English name; a search on the Russian word found one product, "Natrii oxybutyratum …", whose nonproprietary-name field reads "sodium ascorbate". It is copied as the Register shows it.
  - 1.4.4. is registered under "valproic acid".
  - The search for 2.1.10. "Sulpirid" also returned a combination product ("levosulpiride, rabeprazole"); it is included and its own name is shown.
  - Product strings mix alphabets (some contain Cyrillic letters inside Latin words, and a few are partly in Russian); they are kept byte for byte.

| Essential list row | Register "MNN" | Pack records (active) | Rows in the CSV |
|---|---|---|---|
| 1.1.1. Izofluran | isoflurane | 8 (8) | 4 |
| 1.1.2. Sevofluran | sevoflurane | 6 (5) | 5 |
| 1.2.1. Natriy oksibutirat | sodium ascorbate (as shown) | 4 (4) | 1 |
| 1.2.2. Tiopental natriy | thiopental sodium | 4 (2) | 1 |
| 1.2.3. Ketamin | ketamine | 15 (15) | 3 |
| 1.2.4. Propofol | propofol | 40 (30) | 16 |
| 1.2.5. Deksmedetomidin | dexmedetomidine | 22 (21) | 8 |
| 1.3.1. Midazolam | midazolam | 6 (6) | 2 |
| 1.4.1. Fenobarbital | phenobarbital | 12 (7) | 2 |
| 1.4.2. Karbamazepin | carbamazepine | 43 (37) | 18 |
| 1.4.3. Benzobarbital | benzobarbital | 22 (21) | 7 |
| 1.4.4. Valproat kislotasi/v?lproat natriy | valproic acid | 29 (24) | 11 |
| 1.4.5. Lamotridjin | lamotrigine | 42 (23) | 7 |
| 2.1.1. Levomepromazin | levomepromazine | 2 (2) | 2 |
| 2.1.2. Galoperidol | haloperidol | 37 (37) | 6 |
| 2.1.3. Droperidol | droperidol | 5 (5) | 1 |
| 2.1.4. Klozapin | clozapine | 33 (33) | 5 |
| 2.1.5. Trifluoperazin | trifluoperazine | 17 (15) | 4 |
| 2.1.6. Flufenazin | fluphenazine | 1 (1) | 1 |
| 2.1.7. Xlorpromazin | chlorpromazine | 7 (7) | 3 |
| 2.1.8. Risperidon | risperidone | 59 (55) | 10 |
| 2.1.9. Tioridazin | thioridazine | 2 (2) | 1 |
| 2.1.10. Sulpirid | sulpiride; levosulpiride, rabeprazole | 17 (10) | 8 |
| 2.1.11. Kvetiapin | quetiapine | 64 (58) | 10 |
| 2.1.12. Olanzapin | olanzapine | 138 (125) | 12 |
| 2.1.13. Tiaprid | tiapride | 3 (1) | 1 |
| 2.1.14. Alimemazin | alimemazine | 8 (5) | 4 |
| 2.1.15. Aripiprazol | aripiprazole | 28 (15) | 4 |
| 2.2.1. Alprazolam | alprazolam | 7 (7) | 2 |
| 2.2.2. Diazepam | diazepam | 11 (11) | 5 |

---

## D. Import plan to reach the Turkish depth

**Sources.**

1. **State Register** (Farmatsevtika mahsulotlari xavfsizligi markazi) — the backbone, playing the role of both Turkish spreadsheets at once. It must be **obtained from the Centre as a file, by its download function or by written request, with permission to show its names in the product.** The download is CAPTCHA-protected, which is a clear sign the Centre does not intend unattended bulk copying; the public search must not be scraped to build the catalogue.
2. **Essential list (order No. 34 of 2023) and reimbursement list (order No. 18 of 2026)** — already in the CSV; they add two flags by generic name.
3. **Controlled lists** (Cabinet of Ministers resolution No. 330 of 12.11.2015 for lists I–IV; resolution No. 818 of 27.09.2019 for potent substances) — add the controlled class by active ingredient, as `receteRengi.ts` does for Türkiye.
4. **A reviewed name table** — Uzbek list spelling ↔ Register English name ↔ Russian name, built by a pharmacist. Without it the two flags cannot be attached and a doctor typing an Uzbek or Russian spelling finds nothing.

**Roughly how many records.** 46,154 pack records in the Register on 2026-10-09, of which 18,883 are marked active (14,647 prescription, 4,236 non-prescription). The Turkish catalogue has 8,649. An import of active records only would be about twice the Turkish size.

**Which fields would be full, which empty.**

| Field | Expected |
|---|---|
| Product name string, manufacturer, country, registration number, dates, status | Full |
| International nonproprietary name | Full for about seven records in ten; the rest carry a placeholder and need a decision (leave empty, never guess) |
| ATC code | Mostly full, some at group level only |
| Prescription / non-prescription | Full — a field the Turkish file does not have |
| Strength, form | Full if the file carries the card fields; otherwise only inside the product string. Form is in Russian |
| Reference price | Prescription medicines |
| Essential flag, reimbursed flag | Full after the reviewed name table exists |
| Controlled class | From the legal lists, by active ingredient |
| Barcode, equivalence group | **Empty** |
| Dosing, interactions, warnings | **Empty by design** — link to the Register card |

**Effort.** One import script in the pattern of `scripts/import-sgk-ilac.mjs`, a second small one for the two lex.uz lists, and the name table (pharmacist time, not developer time). A few days of development once the file and the permission exist.

**Who in Uzbekistan must confirm it.** (1) The Farmatsevtika mahsulotlari xavfsizligi markazi — supplying the Register as a file and allowing its use in a commercial product (contact shown on its site: farmkomitet@ssv.uz, +99871 203 01 01); (2) an Uzbek lawyer — reuse of Register data, linking to instructions, and article 14 of the Law on medicines for anything shown to patients; (3) a practising doctor and a pharmacist in Uzbekistan — which spelling doctors search in, and the name table.

---

## Recommendation for the owner

**One route:** ask the Farmatsevtika mahsulotlari xavfsizligi markazi for the State Register as a file with written permission to show its names in the product, import the active records in the pattern the Turkish catalogue already uses, and attach the essential and reimbursed flags from the two lex.uz lists through a pharmacist-reviewed name table. Keep the medicine slots switched off until the file and the permission are in hand.

- **What it costs:** one written request (best sent by a local partner or through the pilot doctor's clinic), a few days of import work, and a pharmacist's time for the name table.
- **What it gives:** a searchable catalogue of about 19,000 active products with trade name, generic name, ATC code, manufacturer, form, strength, prescription status, registration number and price — the Turkish depth, plus prescription status, minus barcode and equivalence group.
- **What it does not give:** a ranking by use. No top 250 exists; the only ways to one are the Ministry's electronic-prescription counts (by request, partial coverage for now) or a bought sales audit that must be labelled as sales. It also gives no dosing or clinical content, and no Uzbek-language names.
- **A smaller interim step, if the owner wants one:** the essential list in the CSV (508 rows, Uzbek Latin, a reproducible legal act) can serve as a generic-name suggestion list, labelled "essential medicines list — not a ranking".
- **Who must confirm:** the Centre (data and permission), an Uzbek lawyer (reuse and article 14), a practising doctor and a pharmacist (names, script, usefulness).

---

## Checks

- **Essential list:** all 503 numbered rows of the CSV were compared with the table cells of [lex.uz/docs/-6590070](https://lex.uz/docs/-6590070) by a checksum of each row's number and name, computed on the page and on the file: 503 of 503 identical. The 5 insulin lines: 5 of 5 identical.
- **Reimbursement list:** 69 of 69 rows identical by the same method against [lex.uz/uz/docs/8161206](https://lex.uz/uz/docs/8161206).
- **Trade-name sample:** 164 of 164 rows identical by checksum against the Register's data as returned on 2026-10-09.
- The first reading of the essential list, made through the fetch tool, was wrong in three ways that this check caught: it stopped at row 40.10.1. (missing 65 rows), it joined the form into the name in row 14.1., and it dropped part of the name in row 38.13.

---

## Could not verify

Pages the fetch tool refused with a rate limit (they were not read, and nothing from them is used):

- `lex.uz/mact/-2211626` — Cabinet of Ministers resolution No. 204 of 22.07.2013 on preferential supply of medicines.
- `lex.uz/mact/-7349574` — Ministry of Health regulation registered as No. 3604 on 27.01.2025 on narcotic and psychotropic medicines (special prescription forms).
- `lex.uz/mact/-2815340` and a lex.uz search — the Cabinet of Ministers act that approves lists I–IV (cited by lex.uz notes as resolution No. 330 of 12.11.2015).
- `who.int/europe/publications/i/item/9789289058643` — WHO, "Availability and prices of essential medicines in Uzbekistan in 2021".
- `pmc.ncbi.nlm.nih.gov/articles/PMC8248674` — a journal article on antimicrobial consumption found when searching for WHO consumption studies.
- Three kun.uz articles on medicine spending and tax data (2024-06-21, 2024-11-04, 2025-03-01).
- Three other Proxima Research pages on the Uzbek market and one uzdaily.uz article on IQVIA's review.

Other gaps:

- **The Register's download:** file format, whether it is the whole register, and its terms. Not used because it sits behind a CAPTCHA.
- **Reuse terms for Register data** — none stated; needs the Centre's answer.
- **How many distinct medicines and brands** the 46,154 pack records amount to.
- **Whether the "test mode" banner** on the Centre's site means the data are provisional.
- **The reference-price register on the Agency's own site** — not found; prices were seen only inside Register cards.
- **The Ministry's own publication of the 389 high-demand non-prescription medicines** — only the press relay was read.
- **Lists I–IV, the potent-substances list contents and the special prescription forms** — acts identified, contents not copied.
- **Whether the May 2026 draft order on electronic prescriptions was adopted.**
- **Whether a third-party product may connect to "Elektron retsept".**
- **The pairing of the 30 Uzbek list names with English Register names** in the sample — my reading, to be confirmed by a pharmacist.
- **Copyright status of the Register and of instructions for use** — article 8 of the copyright law covers official documents; whether these count is a lawyer's question.

---

## Appendix — mandatory pharmacy assortment, names only

Order No. 71 of 21.11.2016 (reg. No. 2846), as amended by order No. 15 of 30.04.2026 — [lex.uz/docs/-3077603](https://lex.uz/docs/-3077603). Uzbek, Latin script. The name column only, as read from the page's table cells; row numbers are the act's own and have gaps. Row 29 lists three antiseptics with their concentrations inside the name cell and is left out here.

| No. | Name cell as in the source |
|---|---|
| 2. | Azitromitsin yoki Klaritromitsin |
| 4. | Allapinin yoki Amiodaron |
| 6. | Aluminiy va magniy saqlovchi antatsidlar |
| 7. | Ambroksol yoki Bromgeksin yoki Pertussin yoki Mukaltin yoki dorivor Altey yoki oddiy Qizilmiya ildizi yoki Togʻrayxon oʻti |
| 9. | Amlodipin |
| 11. | Amoksitsillin yoki Ampitsillin |
| 13. | Askorbin kislotasi + Rutozid |
| 14. | Atenolol |
| 15. | Atsetilsalitsil kislotasi yoki Paratsetamol |
| 16. | Atsiklovir |
| 17. | Bendazol yoki Papaverin yoki Drotaverin |
| 19. | Valeriana ildizi va ildizpoyasi yoki Arslonquyruq oʻti yoki Limon oʻti bargi yoki Doʻlana mevasi |
| 24. | Diklofenak yoki Ibuprofen yoki Meloksikam |
| 28. | Indapamid yoki Gidroxlortiazid yoki Spironolakton yoki Furosemid |
| 35. | Klotrimazol yoki Nistatin yoki Flukonazol |
| 38. | Loperamid yoki Metoklopramid |
| 47. | Omeprazol |
| 48. | Pankreatin |
| 50. | Pentoeritril tetranitrat yoki Nitroglitserin |
| 51. | Famotidin |
| 54. | Sulfatsetamid yoki Xloramfenikol yoki Siprofloksatsin |
| 57. | Tetratsiklin |
| 63. | Setirizin yoki Loratadin |
| 65. | Siprofloksatsin yoki Levofloksatsin yoki Ofloksatsin |
| 67. | Enalapril |
