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

## Batch (b) — the other 27 medical branşlar

Turkish society / SB documents below are the ones the repo already lists as each branş's references
(`lib/doktor/specialties.ts`); their **specific text was NOT opened in this session** unless marked otherwise. The red
flags and steps used are standard content of the international guideline named next to them (well-known, not
re-fetched; the latest edition is re-checked in the monthly MEVZUAT-TAKIP pass). Every template is accepted by the
treating physician before any patient sees it.

| Id | Source | Used for | Status |
|---|---|---|---|
| ESC-KY-2021-2023 / TKD-ESC | ESC Heart Failure guideline 2021 + 2023 focused update (TKD Turkish publication) | kar-ky symptom diary; weight stays on Bugün (+2 kg / 3 days rule already there) | international well-known; TKD text **NOT CONFIRMED** |
| ESC-AKS-2023 / ESC-KKS-2024 | ESC ACS 2023, ESC chronic coronary syndromes 2024 | kar-gogus-plani (call 112 for > 5 min rest pain; no self-driving) | well-known |
| EHRA-NOAC-2021 | EHRA Practical Guide on NOACs 2021 | kar-antikoag bleeding signs; head injury on anticoagulant → same-day ED | well-known |
| EAPC-REHAB-2021 | EAPC / ESC secondary prevention & cardiac rehabilitation position (2021) | kar-rehab (doctor-switched, doctor-written lines) | well-known, edition to verify |
| ESC-PAAD-2024 | ESC 2024 peripheral arterial and aortic diseases | kdc-yuruyus (walking diary; rest pain / cold / colour → acil) | well-known |
| ESC-EACTS / TKDCD | ESC/EACTS valvular 2021; Türk Kalp ve Damar Cerrahisi Derneği | kdc post-op (sternal precautions, AF palpitations) | society text **NOT CONFIRMED** |
| TEMD-DM / ADA-SOC | TEMD Diabetes guide (2024 in repo) + ADA Standards of Care (annual) | dah-hipo / end-hipo (no carbohydrate grams, "as your doctor taught"), dah-hasta-gun sick-day rules | TEMD edition **NOT CONFIRMED**; ADA annual — latest to verify |
| IWGDF-2023 | IWGDF guidelines on prevention of diabetic foot ulcers 2023 | dah-ayak daily foot programme | well-known |
| FITTER-2016 | Frid AH et al., New insulin delivery recommendations, Mayo Clin Proc 2016 | end-insulin pen checklist (no needle length / hold seconds written) | well-known |
| TEMD-TIROID-2025 / TITCK-KUB-LT4 | as in DIYETISYEN-PAKETI-ARASTIRMA.md | end-tiroid (same levothyroxine timing engine as diyetisyen) | see Phase 1 register |
| TEMD-ADRENAL-2025 / ES-ADRENAL-2016 | TEMD adrenal guide; Endocrine Society primary adrenal insufficiency 2016 | end-steroid sick-day lines (doctor writes the plan; no dose) | TEMD text **NOT CONFIRMED** |
| SB-KETEM-TARAMA / SB-PERIYODIK-MUAYENE | SB Kanser Dairesi national screening standards (cervix 30–65 every 5 y, breast 40–69 every 2 y, colorectal 50–70 every 2 y); SB periodic examination guidance | aile-tarama list | ages well-known; current SB text **NOT CONFIRMED** |
| SB-ALO171 / WHO-BIRAKMA-FAYDA | ALO 171 Sigara Bırakma Danışma Hattı; WHO "benefits of quitting" timeline | aile-sigara timeline + diary | well-known |
| KDIGO-KBH-2024 / TND | KDIGO 2024 CKD guideline; Türk Nefroloji Derneği | nef-sivi (doctor sets the fluid limit), nef-fistul, nef-besin | TND text **NOT CONFIRMED** |
| ROMA-IV / TGD | Rome IV (2016) alarm features; Türk Gastroenteroloji Derneği | gas-gunluk (Bristol scale, alarm features) | TGD text **NOT CONFIRMED** |
| ESGE-HAZIRLIK-2019 | ESGE bowel preparation guideline 2019 update | gas-kolonoskopi pre-procedure timeline (low-fibre diet, split prep at the doctor's hours) | well-known |
| REPO-BIYOLOJIK-GUVENLIK / TRD-ROMATOLOJI | Türkiye Romatoloji Derneği biologic safety (TB/HBV) — repo reference | gas-tedavi / rom-tedavi infection vigilance (from the approved medicine list) | repo reference |
| EULAR-RA-2022 | EULAR RA management recommendations 2022 update | rom-gunluk (pain, morning stiffness, swollen joints, patient global); GCA vision flag | well-known |
| SB-AKILCI-ANTIBIYOTIK / KLIMIK | SB rational antibiotic use; KLİMİK guidance | enf-tedavi (complete course, C. difficile / rash / jaundice flags) | **NOT CONFIRMED** |
| SB-TB-REHBERI | SB Tüberküloz Tanı ve Tedavi Rehberi | enf-tb (DOT visits, orange urine expected, hepatotoxicity / vision flags) | named, edition **NOT CONFIRMED** |
| ESMO-FN-2016 / NCI-CTCAE-5 / TTOD | ESMO febrile neutropenia 2016; NCI CTCAE v5 (≥ 7 stools = grade 3); TTOD | onk-dongu (nadir days 7–14), onk-yanetki (fever on chemo = acil) | international well-known; TTOD **NOT CONFIRMED** |
| MASCC-ISOO-2020 | MASCC/ISOO oral mucositis guideline 2020 | onk-agiz programme | well-known |
| GINA / GOLD / TTD | GINA report and GOLD report (annual — latest edition), TTD adaptations | gog-eylem (green / yellow / red), gog-semptom (reliever ≥ 4/day → doctor), gog-inhaler (pMDI steps) | annual editions to verify monthly; TTD **NOT CONFIRMED** |
| TND-MIGREN / ICHD-3 | TND migraine protocol; ICHD-3 (2018) | nor-bas-agrisi (thunderclap, focal deficit, fever + neck stiffness → acil; medication-overuse note) | TND **NOT CONFIRMED** |
| TND-EPILEPSI-2021 / ILAE | TND Epilepsi Rehberi 2021 (repo reference); ILAE status definition (> 5 min) | nor-nobet | repo reference |
| SB-TND-INME / ESO | SB + TND acute ischaemic stroke guide (repo reference); ESO | nor-inme (Yüz–Kol–Konuşma, time, 112) | repo reference |
| TPD / SB-RUH-SAGLIGI / STANLEY-BROWN-SPI | TPD; SB mental-health action plan; Stanley & Brown Safety Planning Intervention (2012) | psi-gunluk (crisis → 112), psi-guvenlik (doctor-personalised plan), psi-uyku | TPD / SB **NOT CONFIRMED** |
| ERAS-SOCIETY / TCD | ERAS Society guidelines; Türk Cerrahi Derneği | gc post-op (early mobilisation, diet, obstruction flag, drain amount if switched) | TCD **NOT CONFIRMED** |
| TOTBID / NICE-NG157 | TOTBİD; NICE NG157 joint replacement 2020 | ort post-op, exercise programme (doctor lines), cast care, neurovascular flag | TOTBİD **NOT CONFIRMED** |
| TNCD | Türk Nöroşirürji Derneği | bc post-op (new deficit, raised ICP signs, seizure, cauda equina, CSF leak) | **NOT CONFIRMED**; flags textbook-standard |
| ERAS-TORASIK-2019 / TGCD | Batchelor TJP et al., ERAS thoracic surgery, EJCTS 2019; Türk Göğüs Cerrahisi Derneği | gcs post-op + breathing programme (haemoptysis acil, surgical emphysema) | TGCD **NOT CONFIRMED** |
| TPRECD | Türk Plastik Rekonstrüktif ve Estetik Cerrahi Derneği | pla post-op (flap colour change = acil), wound photo diary | **NOT CONFIRMED**; flap monitoring textbook-standard |
| EAU-ASUS / EAU-TAS / TUD / SB-ENFEKSIYON-KONTROL | EAU guidelines (non-neurogenic male LUTS, urolithiasis, catheter care — annual); TÜD; SB infection control | uro-isem (retention acil), uro-tas (fever with stone = acil), uro-sonda | EAU annual to verify; TÜD **NOT CONFIRMED** |
| AAO-HNS-TONSIL-2019 / AAO-HNS-ANI-ISITME-2019 / EPOS-2020 / TKBB | AAO-HNS tonsillectomy CPG 2019 update; sudden hearing loss CPG 2019; EPOS 2020; TKBB | kbb-acil list, tonsil + sinus post-op (bleeding acil, orbital signs, CSF rhinorrhoea), nasal irrigation | TKBB **NOT CONFIRMED** |
| TOD / RCOPHTH-KATARAKT / TOD-RETINA / AAO-AMD | TOD; Royal College of Ophthalmologists cataract guidance; AAO Preferred Practice Pattern AMD | goz post-op (vision loss / pain / curtain = acil), drop technique, Amsler (new distortion → doctor today) | TOD **NOT CONFIRMED** |
| TCCD | Türk Çocuk Cerrahisi Derneği | cc post-op (veli only; acute abdomen, lethargy, 8 h no urine) | **NOT CONFIRMED** |
| ASA-ACLIK-2023 / TARD | ASA practice guideline on preoperative fasting (2023); TARD | ane-hazirlik (negative-day countdown), ane-aclik (hours = the doctor's settings, clear-fluid definition), ane-sonrasi (PDPH, epidural haematoma flag) | TARD **NOT CONFIRMED** |
| TATD / SB-ACIL-SERVIS / NICE-KAFA-TRAVMASI-2023 | TATD; SB acil servis protocols; NICE NG232 head injury 2023 | acl post-discharge timeline + diary, head-injury list (doctor-switched) | TATD / SB **NOT CONFIRMED** |
| ESUR-KONTRAST / TRD-RADYOLOJI / ACR-MR-GUVENLIK | ESUR Guidelines on Contrast Agents (v10); Türk Radyoloji Derneği; ACR Manual on MR Safety | rad-hazirlik (tell metformin / kidney / allergy / pregnancy / implants), rad-kontrast diary, rad-mr checklist | TRD **NOT CONFIRMED** |
| TFTR / NICE-NG59 | Türkiye FTR Derneği; NICE NG59 low back pain 2016 (updated 2020) | ftr-program (doctor lines), ftr-agri (cauda equina acil, red flags → doctor) | TFTR **NOT CONFIRMED** |
| TSHD / ARDERN-RTS-2016 / PEACE-LOVE-2019 / CISG-AMSTERDAM-2022 | Türkiye Spor Hekimliği Derneği; Ardern CL et al. 2016 return-to-sport consensus; Dubois & Esculier PEACE & LOVE (BJSM 2020); Amsterdam 2022 concussion consensus (Patricios et al., BJSM 2023) | spr-donus, spr-sarsinti (one step per ≥ 24 h, doctor-switched), spr-yuk (exertional chest pain / syncope acil, concussion → stop) | TSHD **NOT CONFIRMED** |
