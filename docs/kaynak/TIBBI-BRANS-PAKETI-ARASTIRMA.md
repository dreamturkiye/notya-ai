# Medical branşlar (30) — portal package sources and limits (BRANS-PAKETI Phase 2, 2026-11-27)

**Reviewer model (same as Phase 1):** there is no external clinical reviewer. Every timeline / checklist / diary in
`lib/portal/paket/tibbi*.ts` is a STARTING TEMPLATE; the treating physician reviews it in Ayarlar › Hasta alanı paketi,
may edit the timeline, list, photo angles/months and note (never a dose — `DOZ_DESENI` refuses it; diary fields and red
flags stay fixed for safety), and accepts it. Acceptance is stored with a timestamp and history
(`brans_paket_sablon.kabul_at`, `kabul_gecmisi`). A module with no acceptance reaches no patient.

**Source order (CLAUDE.md, Kaan 2026-11-26):** Turkish law / SB protocols → Turkish specialty societies → the
international guidelines Turkish doctors use (latest edition) → textbooks. Where a Turkish document could not be
opened in this session it is marked **NOT CONFIRMED** below — never cited as read. "Well-known, not re-fetched" =
an established international document whose content used here (red flags, milestone ages) is standard and stable; its
latest edition must still be checked in the monthly regulatory pass (MEVZUAT-TAKIP).

Rules encoded for every branş: 112 on every acil flag (pinned); no diagnosis words; no drug doses (template edits and
per-patient lines refuse "5 mg / 2 tablet / …"); the crisis copy says the page is not an emergency service; child
modules only under 18 with veli wording (`yas: 'cocuk'`, unknown age = adult → none); measurements already on Bugün
(blood pressure, glucose, weight, fever) are NOT repeated in a package diary — the package points to Bugün instead.

## Batch (a) — pediatri, kadın hastalıkları-doğum, dermatoloji

| Id | Source | Used for | Status |
|---|---|---|---|
| NICE-NG143 | NICE NG143 *Fever in under 5s: assessment and initial management* (2019, updated 2021) — traffic-light red features | ped-hasta-gun / ped-yenidogan red flags (lethargy, respiratory distress, non-blanching rash, seizure, reduced fluids/urine; any fever < 3 months = urgent) | well-known, not re-fetched; Turkish TPK fever text **NOT CONFIRMED** |
| SB-IZLEM-PROTOKOLU | T.C. SB *Bebek, Çocuk, Ergen İzlem Protokolleri* | wording of feeding / nappy / development follow-up | named, edition **NOT CONFIRMED** in session |
| REPO-ATES-KARTI | Bugün fever–medicine card (pediatri / çocuk cerrahisi) | the diary points to it instead of naming any dose | repo |
| SB-ASI-TAKVIMI | SB Ulusal Çocukluk Dönemi Aşılama Takvimi (2025, already the pediatri reference in `lib/doktor/specialties.ts`) | aşı sonrası diary context; Aşı Karnesi link | repo reference |
| SB-ASI-SONRASI-ISTENMEYEN-ETKI | SB aşı sonrası istenmeyen etki (ASİE) izlem çerçevesi | red flags after vaccination (anaphylaxis, HHE, seizure, > 3 h inconsolable crying) | **NOT CONFIRMED** (content matches WHO AEFI classification, well-known) |
| CDC-LTSAE-2022 | Zubler JM et al., *Evidence-informed milestones for developmental surveillance tools*, Pediatrics 2022;149(3):e2021052138 (CDC "Learn the Signs. Act Early.", milestones most children (≥ 75 %) reach by that age) | the three milestone checklists (0–12 m, 1–3 y, 3–6 y) | well-known, not re-fetched |
| REPO-GIDR | Gelişimi İzleme ve Destekleme Rehberi (GİDR) — already in the pediatri chapter | milestone framing ("bir yarış değildir", loss of a skill → write to the doctor) | repo |
| SB-DOGUM-ONCESI-BAKIM | T.C. SB *Doğum Öncesi Bakım Yönetim Rehberi* (minimum 4 visits; 11–14 w screening, 18–22 w detailed US, 24–28 w GDM screening, 28 w anti-D for Rh−) | kd-gebelik-zaman steps, kd-gebelik-belirti | named; current edition **NOT CONFIRMED** in session (also listed in HASTA-PORTALI-GUNLUK-KAYNAK) |
| REPO-GEBELIGIM | Gebeliğim view (week / TDT from `gebelikler.sat`) | journey start date = SAT of the ACTIVE pregnancy, same scope as the bundle | repo |
| RCOG-GTG57 | RCOG Green-top Guideline No. 57 *Reduced Fetal Movements* (2011) + NHS advice "do not wait until the next day" | kd-hareket (from week 28; any reduction or change → same-day hospital, 112 if unreachable; no formal kick count) | international, well-known; Turkish TJOD text **NOT CONFIRMED** |
| SB-ACIL-OBSTETRIK | SB acil obstetrik bakım yönetim rehberi | bleeding, fluid leak, severe headache / visual change (preeclampsia), severe abdominal pain, preterm contractions → acil; postpartum haemorrhage, VTE, postpartum preeclampsia | named, **NOT CONFIRMED** |
| SB-DOGUM-SONRASI-BAKIM | SB *Doğum Sonu Bakım Yönetim Rehberi* | kd-lohusa-zaman (day 0 / 3 / 7 / 10 / 21 / 42), postpartum mood (> 2 weeks → doctor; self-harm → crisis copy) | named, **NOT CONFIRMED** |
| TJOD-AUK | TJOD anormal uterin kanama yaklaşımı | kd-adet (soaking a pad hourly, intermenstrual / postcoital bleeding → doctor) | **NOT CONFIRMED**; content matches FIGO PALM-COEIN practice (well-known) |
| EUROGUIDERM-AD | EuroGuiDerm *Guideline on Atopic Eczema* (2022, living update) | dmt-gunluk fields (itch, sleep loss, emollient), dmt-bakim routine (short lukewarm shower, emollient within minutes, soft cotton, short nails) | international, well-known; TDD atopic dermatitis consensus **NOT CONFIRMED** |
| ABCDE-MELANOM | Abbasi NR et al., *Early diagnosis of cutaneous melanoma: revisiting the ABCD criteria*, JAMA 2004 (ABCDE) + "ugly duckling" sign | dmt-ben self-check list (off by default; the doctor switches it on) | well-known; TDD patient material **NOT CONFIRMED** |
| MHRA-ISOTRETINOIN / TITCK-ISOTRETINOIN-DOGRULANAMADI | as in Phase 1 (OZEL-BRANS-PAKETI-ARASTIRMA.md) | dmt-izotretinoin: on from the APPROVED medicine list (Zoretanin / Roaccutane / …), doctor may switch off; mood + self-harm crisis copy; no blood donation / sharing | TİTCK programme **NOT CONFIRMED** |
| TDD-PSORIAZIS-BIYOLOJIK | Türk Dermatoloji Derneği psoriazis / biyolojik tedavi önerileri | dmt-sistemik (infection signs → doctor, ask before vaccines / surgery) | **NOT CONFIRMED** |
| REPO-BIYOLOJIK-GUVENLIK | Türkiye Romatoloji Derneği biyolojik ajan güvenlik önerileri (TB/HBV) — already a romatoloji reference in the repo | same infection-vigilance lines | repo reference |
| SJS-TEN (clinical) | Stevens–Johnson / TEN warning signs (skin peeling, blisters, mucosal erosions) | dmt-gunluk acil flag | textbook-standard |
