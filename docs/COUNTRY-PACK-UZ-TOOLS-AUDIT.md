# Uzbekistan tools audit

> **Proposal, to be confirmed by a local clinical lead.** Every verdict below was written by Claude on 2026-10-08 from the tool's own description and code, without a local clinician and without Uzbek source documents. When this file was written nothing was switched on. **Since 2026-10-09 (NOTYA-ULKE-ARACLAR-01) the country kit has its own tools area and the Uzbek pack switches part of it on: see "Outcome in the Uzbek build" below.** The pre-split registry is unchanged: every tool there is still valid in Türkiye only.

Standard: `docs/COUNTRY-PACK-CHECKLIST.md`, section F. A tool enters Uzbekistan only when (1) its verdict is confirmed, (2) any local content is built in `countries/uz/`, (3) it is translated into Uzbek and Russian and read by a native clinician, (4) its specialty has its local sign-off (F7). Then two edits switch it on: the country is added to the tool's `ulkeler`, and the route to the Uzbek pack's `araclar`.

## Verdicts

| Verdict | Meaning |
|---|---|
| **Remove** | Tied to a Türkiye-only state or payer system. Never shown in Uzbekistan. |
| **Adapt** | Same idea, local content needed. The row says what content. |
| **Keep** | Universal scale, calculator or follow-up list. Needs translation and a unit check. |
| **Add** | A tool Uzbekistan needs that Türkiye does not have. Listed at the end. |

## Totals

Doctor tools in the registry: **144** (12 shared, 132 specialty).

| Remove | Adapt | Keep |
|---:|---:|---:|
| 14 | 34 | 96 |

| Group | Tools | Remove | Adapt | Keep |
|---|---:|---:|---:|---:|
| Shared (every specialty) | 12 | 2 | 7 | 3 |
| Paediatrics | 7 | 0 | 4 | 3 |
| Internal medicine | 6 | 1 | 1 | 4 |
| Ophthalmology | 5 | 3 | 0 | 2 |
| Dermatology | 6 | 1 | 1 | 4 |
| Obstetrics and gynaecology | 5 | 0 | 4 | 1 |
| Psychiatry | 5 | 1 | 1 | 3 |
| Ear, nose and throat | 5 | 1 | 0 | 4 |
| Cardiology | 4 | 1 | 1 | 2 |
| Chest diseases | 5 | 1 | 0 | 4 |
| Neurology | 4 | 0 | 1 | 3 |
| Urology | 4 | 0 | 1 | 3 |
| Orthopaedics | 4 | 0 | 0 | 4 |
| Physical medicine and rehabilitation | 4 | 0 | 2 | 2 |
| Family medicine | 4 | 0 | 4 | 0 |
| Sports medicine | 3 | 0 | 0 | 3 |
| Endocrinology | 4 | 0 | 0 | 4 |
| Gastroenterology | 4 | 0 | 0 | 4 |
| Nephrology | 5 | 1 | 0 | 4 |
| Infectious diseases | 4 | 0 | 1 | 3 |
| Oncology | 4 | 1 | 0 | 3 |
| General surgery | 4 | 0 | 0 | 4 |
| Plastic surgery | 4 | 0 | 1 | 3 |
| Emergency medicine | 4 | 0 | 1 | 3 |
| Neurosurgery | 4 | 0 | 0 | 4 |
| Anaesthesiology | 4 | 0 | 0 | 4 |
| Radiology | 4 | 0 | 1 | 3 |
| Thoracic surgery | 4 | 0 | 0 | 4 |
| Cardiovascular surgery | 4 | 0 | 0 | 4 |
| Rheumatology | 4 | 1 | 1 | 2 |
| Paediatric surgery | 4 | 0 | 2 | 2 |
| **All** | **144** | **14** | **34** | **96** |

Tool pages under `app/doktor-tools`: 146 folders = the 144 registered tools + 2 pages that are not tiles (below). Clinic tools (a separate registry, 33 entries) are in the appendix: Remove 2, Adapt 3, Keep 28.

Three things apply to every **Keep** and are not repeated per row: translation into Uzbek and Russian with native clinical review; a unit check; and the reminder button on every cohort panel ("one tap reminder") depends on message templates and channels that are themselves local (checklist E8, H4).

Rows marked "to confirm" state something Claude believes but has not checked against an Uzbek source.

## Shared (every specialty)

| Tool (Turkish title) | Route | Verdict | Reason |
|---|---|---|---|
| e-Reçete Asistanı | `/doktor-tools/erecete` | **Adapt** | Prescription drafting is needed everywhere; this one is built on the Turkish e-prescription and SGK flow. Needs the Uzbek drug register, prescription form, language choice and controlled-drug rules; the SGK step goes. |
| Epikriz Üretici | `/doktor-tools/epikriz` | **Adapt** | Discharge and visit summaries are universal; headings, mandatory fields and the form doctors expect are local, in Uzbek or Russian. |
| ICD-10 Kodlayıcı | `/doktor-tools/icd10` | **Adapt** | Diagnosis coding with Turkish titles. Needs the coding edition in force in Uzbekistan and titles in Uzbek and Russian. |
| İlaç Etkileşimi | `/doktor-tools/ilac-interaksiyon` | **Adapt** | Interaction logic by active substance is universal; drug search must use products and brand names registered in Uzbekistan. |
| Hasta Raporları | `/doktor-tools/sgk-rapor` | **Adapt** | Sick notes and clinic certificates exist everywhere; this one produces SGK e-İstirahat / e-Rapor. Needs Uzbek certificate and sick-leave forms; the SGK part goes. |
| Tetkik İstek | `/doktor-tools/tetkik` | **Adapt** | Lab and imaging request form: local test catalogue, units and form layout. |
| Hasta Portalı | `/doktor-tools/hasta-portali` | **Keep** | Core feature (patient portal access). Translation only. |
| SGK Medula | `/doktor-tools/sgk-medula` | **Remove** | Türkiye-only payer system (SGK Medula provision and e-prescription). |
| e-Nabız | `/doktor-tools/enabiz` | **Remove** | Türkiye-only state system (e-Nabız). The Uzbek counterpart is a new tool, see Add. |
| Muayene sonu paketi | `/doktor-tools/muayene-sonu` | **Adapt** | End-of-visit flow is core; its steps include the SGK provision check and the Turkish prescription and report steps, which must be replaced by the local ones. |
| Sık kullandıklarım | `/doktor-tools/sablonlarim` | **Keep** | The doctor's own visit templates. Translation of the screen only; content is the doctor's. |
| Konsültasyonlar | `/doktor-tools/konsultasyonlar` | **Keep** | Core feature (doctor-to-doctor consultation). Translation; e-mail template in the local languages. |

## Paediatrics

| Tool (Turkish title) | Route | Verdict | Reason |
|---|---|---|---|
| Hedef Boy | `/doktor-tools/hedef-boy` | **Keep** | Mid-parental height formula; universal. Translation and a unit check (cm). |
| Büyüme & Persentil | `/doktor-tools/pedi-buyume` | **Adapt** | Uses Neyzi curves (Turkish children) next to WHO. Needs the growth standard used in Uzbekistan (WHO to confirm) and removal of Neyzi. |
| Doz Hesaplayıcı (mg/kg) | `/doktor-tools/pedi-doz` | **Keep** | Arithmetic on values the doctor enters (mg/kg, concentration). Translation and a unit check. |
| Aşı Takvimi & Telafi | `/doktor-tools/pedi-asi` | **Adapt** | Built on the Turkish Ministry's national calendar. Needs the Uzbek national vaccination calendar and catch-up rules. |
| Gelişim & Tarama Paneli | `/doktor-tools/pedi-gelisim` | **Adapt** | Screening panel follows Turkish national programmes (hearing, vision, vitamin D, iron). Needs the Uzbek screening programme. |
| M-CHAT-R/F | `/doktor-tools/pedi-mchat` | **Keep** | M-CHAT-R/F is an international instrument. Use an authorised Uzbek and Russian translation, not a new one. |
| Pediatri Kohort Paneli | `/doktor-tools/pedi-kohort` | **Adapt** | Cohort rules depend on the vaccination calendar and screening programme above. |

## Internal medicine

| Tool (Turkish title) | Route | Verdict | Reason |
|---|---|---|---|
| Dahiliye Kohort Paneli | `/doktor-tools/dahiliye-kohort` | **Keep** | Thresholds (HbA1c, blood pressure, LDL, eGFR) are international. Unit check: mmol/L and µmol/L are likely the local habit. |
| SCORE2 / KVR | `/doktor-tools/dahiliye-score2` | **Adapt** | SCORE2 is calibrated by risk region; the tool is set to Türkiye (high risk). Uzbekistan belongs to a different region (to confirm: very high risk). |
| KDIGO CKD evreleme | `/doktor-tools/dahiliye-ckd` | **Keep** | KDIGO staging; universal. Unit check for creatinine and albumin ratio. |
| SGK ilaç raporu | `/doktor-tools/dahiliye-sgk` | **Remove** | Türkiye-only payer report (SGK drug report, SUT checklist). |
| Polifarmasi STOPP/START | `/doktor-tools/dahiliye-polifarmasi` | **Keep** | STOPP/START criteria; universal. Drug names to be checked against the local register. |
| CHA₂DS₂-VASc / HAS-BLED | `/doktor-tools/dahiliye-antikoag` | **Keep** | CHA₂DS₂-VASc / HAS-BLED; universal. |

## Ophthalmology

| Tool (Turkish title) | Route | Verdict | Reason |
|---|---|---|---|
| VA / logMAR | `/doktor-tools/goz-va` | **Keep** | Visual acuity conversion; universal. Check which notation local doctors use. |
| SUT anti-VEGF kapı | `/doktor-tools/goz-sut-vegf` | **Remove** | Türkiye-only reimbursement gate (SUT 4.2.33). |
| SGK rapor taslağı | `/doktor-tools/goz-sgk-rapor` | **Remove** | Türkiye-only payer report. |
| GİL EK-3/G kodları | `/doktor-tools/goz-gil-kod` | **Remove** | Türkiye-only reimbursement codes (SUT annex EK-3/G). |
| Göz kohort paneli | `/doktor-tools/goz-kohort` | **Keep** | Follow-up cohort on clinical intervals. Translation. |

## Dermatology

| Tool (Turkish title) | Route | Verdict | Reason |
|---|---|---|---|
| PASI / EASI hesap | `/doktor-tools/derm-pasi` | **Keep** | PASI / EASI / SCORAD; universal. |
| GÖP izotretinoin kapı | `/doktor-tools/derm-gop` | **Adapt** | Follows the Turkish pregnancy-prevention programme for isotretinoin. Needs the Uzbek rules for the same medicine. |
| Fototerapi defteri | `/doktor-tools/derm-fototerapi` | **Keep** | Phototherapy log (dose arithmetic); universal. |
| Yama D2 / D4 | `/doktor-tools/derm-yama` | **Keep** | Patch-test reading schedule, European baseline series; universal. |
| Derm kohort paneli | `/doktor-tools/derm-kohort` | **Keep** | Follow-up cohort on clinical intervals. Translation. |
| Biyolojik SUT taslağı | `/doktor-tools/derm-biyolojik-sut` | **Remove** | Türkiye-only reimbursement draft (SUT). |

## Obstetrics and gynaecology

| Tool (Turkish title) | Route | Verdict | Reason |
|---|---|---|---|
| Gebelik takvimi | `/doktor-tools/kd-gebelik-takvim` | **Adapt** | Gestational age arithmetic is universal; the visit schedule and screening windows follow the Turkish Ministry's antenatal guide. Needs the Uzbek antenatal protocol. |
| Doğum & analık raporu | `/doktor-tools/kd-dogum-rapor` | **Adapt** | Maternity leave dates and the leave certificate follow Turkish social-security rules. Needs Uzbek labour-law periods and the local certificate. |
| Kontrasepsiyon MEC | `/doktor-tools/kd-mec` | **Keep** | WHO medical eligibility criteria for contraception; universal. |
| Obstetrik risk & sezaryen notu | `/doktor-tools/kd-risk` | **Adapt** | Risk prompts are international; the caesarean indication note follows a Turkish requirement. Needs the local protocol and note form. |
| Kadın Hast. ve Doğum kohort paneli | `/doktor-tools/kd-kohort` | **Adapt** | Cohort rules depend on the local antenatal and screening schedule. |

## Psychiatry

| Tool (Turkish title) | Route | Verdict | Reason |
|---|---|---|---|
| PHQ-9 / GAD-7 | `/doktor-tools/psik-phq-gad` | **Keep** | PHQ-9 / GAD-7; use authorised Uzbek and Russian translations. |
| Güvenlik & acil triyaj | `/doktor-tools/psik-risk` | **Adapt** | Safety triage is universal; the emergency number, referral path and involuntary-admission rules are local. |
| Psikotrop izlem takvimi | `/doktor-tools/psik-ilac-izlem` | **Keep** | Monitoring calendar by drug class; universal. |
| Psikotrop rapor & reçete | `/doktor-tools/psik-sgk` | **Remove** | Türkiye-only: SGK drug report, SUT checklist, red / green prescription rules. Controlled-drug prescribing for Uzbekistan is a new tool, see Add. |
| Psikiyatri kohort paneli | `/doktor-tools/psik-kohort` | **Keep** | Follow-up cohort. Translation. |

## Ear, nose and throat

| Tool (Turkish title) | Route | Verdict | Reason |
|---|---|---|---|
| Otoskopi / kulak zarı notu | `/doktor-tools/kbb-otoskopi` | **Keep** | Structured examination note; universal. |
| Odyometri özeti | `/doktor-tools/kbb-odyometri` | **Keep** | Pure-tone average and bands; universal. |
| Vertigo / Dix-Hallpike | `/doktor-tools/kbb-vertigo` | **Keep** | Positional test and manoeuvre note; universal. |
| SGK işitme raporu | `/doktor-tools/kbb-sgk` | **Remove** | Türkiye-only payer report (SGK hearing report, SUT). |
| KBB kohort paneli | `/doktor-tools/kbb-kohort` | **Keep** | Follow-up cohort. Translation. |

## Cardiology

| Tool (Turkish title) | Route | Verdict | Reason |
|---|---|---|---|
| SCORE2 / KV risk | `/doktor-tools/kardio-score2` | **Adapt** | Same as the internal-medicine SCORE2: the risk region is set to Türkiye and must be set for Uzbekistan (to confirm: very high risk). |
| HT / KKY izlem | `/doktor-tools/kardio-ht-kky` | **Keep** | Hypertension and heart-failure follow-up summary; universal. |
| SGK kardiyo rapor | `/doktor-tools/kardio-sgk` | **Remove** | Türkiye-only payer report. |
| Kardiyoloji kohort paneli | `/doktor-tools/kardio-kohort` | **Keep** | Follow-up cohort. Translation. |

## Chest diseases

| Tool (Turkish title) | Route | Verdict | Reason |
|---|---|---|---|
| CAT / mMRC skorları | `/doktor-tools/gogus-cat-mmrc` | **Keep** | CAT / mMRC / GOLD; use authorised translations of the questionnaires. |
| Astım-KOAH aksiyon planı | `/doktor-tools/gogus-aksiyon-plani` | **Keep** | Written action plan; universal. The patient text needs native review. |
| İnhaler teknik & izlem | `/doktor-tools/gogus-inhaler` | **Keep** | Inhaler technique checklist; universal. |
| SGK solunum raporu | `/doktor-tools/gogus-sgk` | **Remove** | Türkiye-only payer report. |
| Göğüs kohort paneli | `/doktor-tools/gogus-kohort` | **Keep** | Follow-up cohort. Translation. |

## Neurology

| Tool (Turkish title) | Route | Verdict | Reason |
|---|---|---|---|
| İnme / TIA kırmızı bayrak | `/doktor-tools/noro-inme` | **Adapt** | Red flags are universal; the emergency number and stroke pathway are local. |
| Migren günlüğü / MIDAS | `/doktor-tools/noro-migren` | **Keep** | MIDAS; use an authorised translation. |
| Nöroloji ilaç izlem (AED) | `/doktor-tools/noro-ilac-izlem` | **Keep** | Monitoring tasks by drug class; universal. |
| Nöroloji kohort paneli | `/doktor-tools/noro-kohort` | **Keep** | Follow-up cohort. Translation. |

## Urology

| Tool (Turkish title) | Route | Verdict | Reason |
|---|---|---|---|
| IPSS semptom skoru | `/doktor-tools/uro-ipss` | **Keep** | IPSS; use an authorised translation. |
| PSA izlem | `/doktor-tools/uro-psa` | **Keep** | PSA value and velocity; universal. Unit check. |
| Hematuri / taş acil triyaj | `/doktor-tools/uro-acil` | **Adapt** | Triage flags are universal; the emergency number and referral path are local. |
| Üroloji kohort paneli | `/doktor-tools/uro-kohort` | **Keep** | Follow-up cohort. Translation. |

## Orthopaedics

| Tool (Turkish title) | Route | Verdict | Reason |
|---|---|---|---|
| Kırık / alçı-ortez takip | `/doktor-tools/orto-kirik-alci` | **Keep** | Fracture and cast follow-up dates; universal. |
| VAS / fonksiyon skoru | `/doktor-tools/orto-vas` | **Keep** | VAS and function items; universal. |
| Op-sonrası protokol | `/doktor-tools/orto-op-protokol` | **Keep** | Post-operative milestones; universal. |
| Ortopedi kohort paneli | `/doktor-tools/orto-kohort` | **Keep** | Follow-up cohort. Translation. |

## Physical medicine and rehabilitation

| Tool (Turkish title) | Route | Verdict | Reason |
|---|---|---|---|
| FTR seans planı | `/doktor-tools/ftr-seans` | **Adapt** | Session plan is universal; it carries an SGK session note that must go, and any local rule on session counts must be added. |
| VAS / ODI ölçek | `/doktor-tools/ftr-vas-odi` | **Keep** | VAS and ODI; use an authorised translation of ODI. |
| Ev egzersiz reçetesi | `/doktor-tools/ftr-egzersiz` | **Adapt** | Home exercise sheet given to the patient: exercise names and the emergency line are local; native review of patient text. |
| FTR kohort paneli | `/doktor-tools/ftr-kohort` | **Keep** | Follow-up cohort. Translation. |

## Family medicine

| Tool (Turkish title) | Route | Verdict | Reason |
|---|---|---|---|
| Aşı / tarama paketi | `/doktor-tools/aile-asi-tarama` | **Adapt** | National vaccination calendar and cancer-screening intervals are Turkish. Needs the Uzbek calendar and screening programme. |
| Kronik paket (DM / HT) | `/doktor-tools/aile-kronik` | **Adapt** | Follow-up intervals follow Turkish primary-care guidance. Needs the Uzbek primary-care protocol. |
| Sevk / acil triyaj | `/doktor-tools/aile-sevk` | **Adapt** | Referral and emergency triage: referral levels and the emergency number are local. |
| Aile hekimliği kohort | `/doktor-tools/aile-kohort` | **Adapt** | Cohort rules depend on the three tools above. |

## Sports medicine

| Tool (Turkish title) | Route | Verdict | Reason |
|---|---|---|---|
| RTP (spora dönüş) basamakları | `/doktor-tools/spor-rtp` | **Keep** | Return-to-play steps; universal. |
| Sakatlık günlüğü | `/doktor-tools/spor-sakatlik` | **Keep** | Injury log; universal. |
| Spor kohort paneli | `/doktor-tools/spor-kohort` | **Keep** | Follow-up cohort. Translation. |

## Endocrinology

| Tool (Turkish title) | Route | Verdict | Reason |
|---|---|---|---|
| HbA1c / tiroid izlem döngüsü | `/doktor-tools/endo-lab-izlem` | **Keep** | HbA1c / TSH follow-up intervals; universal. Unit check. |
| Osteoporoz / DXA hatırlatma | `/doktor-tools/endo-dxa` | **Keep** | DXA repeat reminder; universal. |
| İnsülin / tiroid rejim kartı | `/doktor-tools/endo-rejim` | **Keep** | Regimen card with dates only; universal. |
| Endokrinoloji kohort paneli | `/doktor-tools/endo-kohort` | **Keep** | Follow-up cohort. Translation. |

## Gastroenterology

| Tool (Turkish title) | Route | Verdict | Reason |
|---|---|---|---|
| IBD / IBS skor takip | `/doktor-tools/gastro-ibd-ibs` | **Keep** | Mayo / HBI / IBS-SSS; universal. |
| Endoskopi belge köprüsü | `/doktor-tools/gastro-endoskopi` | **Keep** | Links a procedure to its document; universal. |
| HBV / HCV izlem vadeleri | `/doktor-tools/gastro-hepatit` | **Keep** | Follow-up intervals; universal. Check against the national hepatitis programme. |
| Gastroenteroloji kohort paneli | `/doktor-tools/gastro-kohort` | **Keep** | Follow-up cohort. Translation. |

## Nephrology

| Tool (Turkish title) | Route | Verdict | Reason |
|---|---|---|---|
| eGFR / KDIGO şerit | `/doktor-tools/nef-egfr-kdigo` | **Keep** | KDIGO heat map; universal. Unit check. |
| Diyaliz seans / takip | `/doktor-tools/nef-diyaliz` | **Keep** | Session dates; universal. |
| Anemi-CKD izlem | `/doktor-tools/nef-anemi` | **Keep** | Haemoglobin follow-up intervals; universal. Unit check (g/L or g/dL). |
| SGK nefro rapor | `/doktor-tools/nef-sgk` | **Remove** | Türkiye-only payer report. |
| Nefroloji kohort paneli | `/doktor-tools/nef-kohort` | **Keep** | Follow-up cohort. Translation. |

## Infectious diseases

| Tool (Turkish title) | Route | Verdict | Reason |
|---|---|---|---|
| İzolasyon / bildirim hatırlatma | `/doktor-tools/enfeksiyon-izolasyon` | **Adapt** | Isolation dates are universal; the notification part follows Turkish rules. Needs the Uzbek list of notifiable diseases, deadlines and form. |
| Antibiyotik süre sayacı | `/doktor-tools/enfeksiyon-atb-sure` | **Keep** | Date arithmetic; universal. |
| HIV / viral izlem vadeleri | `/doktor-tools/enfeksiyon-viral-izlem` | **Keep** | Follow-up intervals; universal. Check against national HIV and hepatitis protocols. |
| Enfeksiyon kohort paneli | `/doktor-tools/enfeksiyon-kohort` | **Keep** | Follow-up cohort. Translation. |

## Oncology

| Tool (Turkish title) | Route | Verdict | Reason |
|---|---|---|---|
| Tedavi döngü / kür sayacı | `/doktor-tools/onko-kur` | **Keep** | Cycle counter; universal. |
| Toksisite kontrol listesi | `/doktor-tools/onko-toksisite` | **Keep** | Toxicity checklist; universal. |
| SUT rapor taslağı | `/doktor-tools/onko-sut` | **Remove** | Türkiye-only reimbursement draft (SGK / SUT). |
| Onkoloji kohort paneli | `/doktor-tools/onko-kohort` | **Keep** | Follow-up cohort. Translation. |

## General surgery

| Tool (Turkish title) | Route | Verdict | Reason |
|---|---|---|---|
| Pre-op kontrol listesi | `/doktor-tools/gc-preop` | **Keep** | Pre-operative checklist; universal. The consent item points to the local consent form. |
| Yara / dren izlem | `/doktor-tools/gc-yara-dren` | **Keep** | Wound and drain follow-up; universal. |
| Patoloji belge köprüsü | `/doktor-tools/gc-patoloji` | **Keep** | Tracks a pathology report; universal. |
| Genel cerrahi kohort | `/doktor-tools/gc-kohort` | **Keep** | Follow-up cohort. Translation. |

## Plastic surgery

| Tool (Turkish title) | Route | Verdict | Reason |
|---|---|---|---|
| Foto zaman çizgisi köprü | `/doktor-tools/plastik-foto` | **Keep** | Dated clinical photographs; universal. Consent for photographs is local. |
| Yara / greft izlem | `/doktor-tools/plastik-yara` | **Keep** | Wound and graft follow-up; universal. |
| Onam taslağı kontrol listesi | `/doktor-tools/plastik-onam` | **Adapt** | Informed-consent checklist: items and wording must follow Uzbek law. |
| Plastik kohort paneli | `/doktor-tools/plastik-kohort` | **Keep** | Follow-up cohort. Translation. |

## Emergency medicine

| Tool (Turkish title) | Route | Verdict | Reason |
|---|---|---|---|
| ESI triyaj | `/doktor-tools/acil-esi` | **Keep** | ESI triage; international. |
| Kritik yol kontrol listesi | `/doktor-tools/acil-kritik-yol` | **Keep** | Critical pathway checklists; universal. |
| Sevk / yatış paket taslağı | `/doktor-tools/acil-sevk` | **Adapt** | Admission, referral and discharge package: documents and referral levels are local. |
| Acil Tıp kohort paneli | `/doktor-tools/acil-kohort` | **Keep** | Follow-up cohort. Translation. |

## Neurosurgery

| Tool (Turkish title) | Route | Verdict | Reason |
|---|---|---|---|
| Nöro post-op kontrol listesi | `/doktor-tools/bc-postop` | **Keep** | Post-operative checklist; universal. |
| Görüntü belge köprü | `/doktor-tools/bc-goruntu` | **Keep** | Links imaging to its document; universal. |
| Nöbet / bilinç izlem | `/doktor-tools/bc-bilinc` | **Keep** | Seizure and consciousness flags with dates; universal. |
| Beyin cerrahisi kohort | `/doktor-tools/bc-kohort` | **Keep** | Follow-up cohort. Translation. |

## Anaesthesiology

| Tool (Turkish title) | Route | Verdict | Reason |
|---|---|---|---|
| ASA / pre-op kontrol listesi | `/doktor-tools/anestezi-asa` | **Keep** | ASA class and pre-operative items; universal. |
| Hava yolu notu | `/doktor-tools/anestezi-hava-yolu` | **Keep** | Airway note (Mallampati); universal. |
| Post-op ağrı izlem | `/doktor-tools/anestezi-agri` | **Keep** | Pain score follow-up; universal. |
| Anestezi kohort | `/doktor-tools/anestezi-kohort` | **Keep** | Follow-up cohort. Translation. |

## Radiology

| Tool (Turkish title) | Route | Verdict | Reason |
|---|---|---|---|
| Tetkik kuyruğu / öncelik | `/doktor-tools/radyo-kuyruk` | **Keep** | Worklist with priorities; universal. |
| Yapılandırılmış rapor taslağı | `/doktor-tools/radyo-rapor` | **Keep** | Structured report draft (BI-RADS style); universal. Report headings in the local languages. |
| Kritik bulgu bildirimi | `/doktor-tools/radyo-kritik` | **Adapt** | Critical-finding notice: who must be told, how fast and the emergency line are local. |
| Radyoloji kohort | `/doktor-tools/radyo-kohort` | **Keep** | Follow-up cohort. Translation. |

## Thoracic surgery

| Tool (Turkish title) | Route | Verdict | Reason |
|---|---|---|---|
| Pre-op solunum kontrol listesi | `/doktor-tools/gogus-cerrahi-preop` | **Keep** | Pre-operative respiratory checklist; universal. |
| Toraks tüp / yara izlem | `/doktor-tools/gogus-cerrahi-tup-yara` | **Keep** | Chest tube and wound follow-up; universal. |
| Patoloji köprü | `/doktor-tools/gogus-cerrahi-patoloji` | **Keep** | Tracks a pathology report; universal. |
| Göğüs cerrahisi kohort | `/doktor-tools/gogus-cerrahi-kohort` | **Keep** | Follow-up cohort. Translation. |

## Cardiovascular surgery

| Tool (Turkish title) | Route | Verdict | Reason |
|---|---|---|---|
| Pre-op risk kontrol listesi | `/doktor-tools/kdc-preop` | **Keep** | Pre-operative risk checklist; universal. |
| Greft / yara izlem | `/doktor-tools/kdc-greft-yara` | **Keep** | Graft and wound follow-up; universal. |
| Antikoagülan izlem vadeleri | `/doktor-tools/kdc-antikoag` | **Keep** | Follow-up dates by drug class; universal. |
| Kalp damar cerrahisi kohort | `/doktor-tools/kdc-kohort` | **Keep** | Follow-up cohort. Translation. |

## Rheumatology

| Tool (Turkish title) | Route | Verdict | Reason |
|---|---|---|---|
| DAS28 / BASDAI | `/doktor-tools/roma-das28-basdai` | **Keep** | DAS28 / BASDAI; universal. |
| Biyolojik SUT kontrol listesi | `/doktor-tools/roma-biyolojik-sut` | **Remove** | Türkiye-only reimbursement checklist (SUT). |
| Lab izlem / eklem haritası | `/doktor-tools/roma-lab-izlem` | **Keep** | Lab follow-up and joint map; universal. |
| Romatoloji kohort paneli | `/doktor-tools/roma-kohort` | **Adapt** | Cohort is universal except its "SUT incomplete" flag, which must go. |

## Paediatric surgery

| Tool (Turkish title) | Route | Verdict | Reason |
|---|---|---|---|
| Pre/post-op izlem kontrol listesi | `/doktor-tools/cc-prepost-op` | **Keep** | Pre- and post-operative checklist; universal. |
| Yara / dren izlem | `/doktor-tools/cc-yara-dren` | **Keep** | Wound and drain follow-up; universal. |
| Onam / veli kontrol listesi | `/doktor-tools/cc-onam-veli` | **Adapt** | Guardian consent: the age of consent and who may sign follow Uzbek law. |
| Çocuk cerrahisi kohort | `/doktor-tools/cc-kohort` | **Adapt** | Cohort carries the guardian-consent flag above. |

## Outcome in the Uzbek build (2026-10-09, NOTYA-ULKE-ARACLAR-01)

What the tools job did with each of the 144 tools above, and what the messaging job (NOTYA-ULKE-MESAJ-01, the same day) added to it: `sablonlarim` and `konsultasyonlar`, which the tools job had left absent with the reason. This table is checked by a test on every run (`countries/uz/uygulama/araclar/araclar.test.ts`): each row against the Uzbek pack, and the sums against the totals.

**Changed on 2026-10-10 (NOTYA-ULKE-ARAC-01b), by the owner's order "Switch off the risky tools".** Five tools that were done are slots again until their fault is corrected in the kit or their licence is granted: the dose calculator (`doz-hesabi`), the ESI triage tool (`esi-triyaj`), the report outline that prints the BI-RADS categories (`rapor-taslagi`) and both kidney tools (`kdigo-evre`, `kdigo-serit`). Internal medicine had `kdigo-evre` and no other tool, so its follow-up list is absent too. The sums below moved from 66 / 19 / 11 to 60 / 24 / 12 in the **Keep** row; each of the six rows says so in its note. The kit's arithmetic, words and roles were not changed, and the words of the five tools stay in the pack for the day they come back.

**Changed again on 2026-10-10 (NOTYA-ULKE-UYGULA-UZ), when the decisions of the tools audit were applied and the owner ordered "Bring on all the tools built for the new 6 countries now. We will test as we go."** Three things moved in this table. (1) The dose calculator (`doz-hesabi`) is done again: its fault was corrected in the kit (pull request #615). The ESI triage tool, the report outline and both kidney tools stay slots. (2) Uzbekistan now has three tools of its own, which no row of this table accounts for because the pre-split application had none of them: the body mass index (`uz-tana-vazni-indeksi`, every doctor role, patients of 20 and over), the gestational age and expected date of birth (`uz-homiladorlik-muddati`, obstetrics and family medicine) and a vaccination record (`uz-emlash-qaydi`, paediatrics and family medicine). They are switched on without a clinician's sign-off; `countries/uz/uygulama/araclar/kendi/onay.ts` lists them with what a clinician has to confirm. (3) Because every doctor role now has a tool whose result can be kept, the follow-up list is shown to every doctor role, and the six cohort rows that were absent for that reason are done. The **Keep** row moved from 60 / 24 / 12 to 67 / 23 / 6. The role list itself changed the same day (40 roles became 42: `docs/COUNTRY-PACK-UZBEKISTAN.md`); where a note below says "all 40 roles" for a base tool, read "every role of the pack".

| | done | slot | absent | sum |
|---|---:|---:|---:|---:|
| **Keep** | 67 | 23 | 6 | 96 |
| **Adapt** | 2 | 32 | 0 | 34 |
| **Remove** | 0 | 0 | 14 | 14 |

- **done**: switched on in the Uzbek pack under the kit key in the row, with tests. Machine-written text in Uzbek (Latin and Cyrillic) and Russian, read by no native speaker and no clinician yet.
- **slot**: a marked, empty, switched-off entry of `countries/uz/uygulama/araclar/yuvalar.ts` under the key in the row, naming what is missing and who supplies it. No screen reads it.
- **absent**: not in the Uzbek build in any form, and listed here with the reason.
- **absent (blocked)**: a tool of a Türkiye-only state or payer system. `countries/yasak-araclar.json` and wall rule D7 (`scripts/ulke-duvarlari.mjs`) stop the kit, any other pack and any country route from naming it.

The kit proposes **no follow-up day of its own** in any tool. Where the pre-split tool adds a number of days or months to a date (suture removal, a control visit, a repeat test), the Uzbek tool has an empty date field the doctor fills in. An interval is clinical guidance of a country, and the kit holds no such content.

A cohort panel counts as done only where the generic follow-up list (`takip-paneli`) is shown to that role, which the same test checks over all 42 roles (since 2026-10-10: every doctor role, and neither allied profession). The list replaces "who is due or overdue"; it does not carry the disease-specific columns of the pre-split panels.

| Route | Verdict | Outcome | Kit key or slot key | Role (cohorts) | Note |
|---|---|---|---|---|---|
| `erecete` | Adapt | slot | `recete` |  |  |
| `epikriz` | Adapt | slot | `muayene-ozeti-belgesi` |  |  |
| `icd10` | Adapt | slot | `tani-kodlama` |  |  |
| `ilac-interaksiyon` | Adapt | slot | `ilac-etkilesimi` |  |  |
| `sgk-rapor` | Adapt | slot | `hasta-belgeleri` |  |  |
| `tetkik` | Adapt | slot | `tetkik-istek` |  |  |
| `hasta-portali` | Keep | done | `hasta-portali` |  | Base tool: all 40 roles. |
| `sgk-medula` | Remove | absent (blocked) |  |  |  |
| `enabiz` | Remove | absent (blocked) |  |  |  |
| `muayene-sonu` | Adapt | slot | `muayene-sonu` |  |  |
| `sablonlarim` | Keep | done | `sablonlarim` |  | Base tool: all 40 roles (NOTYA-ULKE-MESAJ-01). A table of its own (migration 141), no patient in the row, soft delete. The doctor's own text blocks, inserted into a section of a note or into a message by the doctor's click; the pack brings no ready-made template. |
| `konsultasyonlar` | Keep | done | `konsultasyonlar` |  | Base tool: all 40 roles (NOTYA-ULKE-MESAJ-01). Between two accounts of the same country database, found by a consultation code (no directory); a read-only copy of one approved note or its summary; nothing is sent to anybody, so there is no e-mail template. Tables of its own (migration 142). |
| `hedef-boy` | Keep | done | `hedef-boy` |  |  |
| `pedi-buyume` | Adapt | slot | `buyume-persentil` |  |  |
| `pedi-doz` | Keep | done | `doz-hesabi` |  | ON AGAIN BY THE OWNER'S ORDER OF 2026-10-10, 14:17 ("Bring on all the tools ... We will test as we go"), after it was switched off earlier that day (NOTYA-ULKE-ARAC-01b). Its fault was corrected in the kit (pull request #615): the volume is no longer rounded to a step, a volume below 1 ml carries a caution, and an amount is written by the country's own rule. No clinician of Uzbekistan has signed it off (`countries/uz/uygulama/araclar/kendi/onay.ts`). Arithmetic only: the doctor types the dose per kilogram; the tool holds no drug and no dose. |
| `pedi-asi` | Adapt | slot | `asi-takvimi` |  |  |
| `pedi-gelisim` | Adapt | slot | `gelisim-tarama` |  |  |
| `pedi-mchat` | Keep | slot | `mchat-rf` |  | Published questionnaire: authorised translation and licence needed. |
| `pedi-kohort` | Adapt | slot | `pediatri-kohort` |  | Its columns are vaccination and growth, which are national content. (The generic follow-up list is shown to paediatrics all the same.) |
| `dahiliye-kohort` | Keep | done | `takip-paneli` | dahiliye | The follow-up list, shown to this role since 2026-10-10 (NOTYA-ULKE-UYGULA-UZ): every doctor role now has a tool whose result can be kept, the body mass index (`uz-tana-vazni-indeksi`). It was absent until that day. One list of the follow-up days the doctor entered on kept results; no column of a disease. |
| `dahiliye-score2` | Adapt | slot | `kv-risk-score2` |  |  |
| `dahiliye-ckd` | Keep | slot | `kdigo-evre` |  | OFF BY THE OWNER'S ORDER OF 2026-10-10 (NOTYA-ULKE-ARAC-01b); it was done (switched on) until that day. The tool shows the low-risk (green) cell when no urine albumin result was typed, and mislabels its referral flags. |
| `dahiliye-sgk` | Remove | absent (blocked) |  |  |  |
| `dahiliye-polifarmasi` | Keep | slot | `polifarmasi` |  | Reclassified from keep: the criteria list is published clinical content with a rights holder. |
| `dahiliye-antikoag` | Keep | slot | `antikoagulan` |  | Reclassified from keep: the scores drive a treatment threshold that is local guidance. |
| `goz-va` | Keep | done | `gorme-keskinligi` |  |  |
| `goz-sut-vegf` | Remove | absent (blocked) |  |  |  |
| `goz-sgk-rapor` | Remove | absent (blocked) |  |  |  |
| `goz-gil-kod` | Remove | absent (blocked) |  |  |  |
| `goz-kohort` | Keep | done | `takip-paneli` | goz-hastaliklari | The follow-up list, shown to this role. One list of the follow-up days the doctor entered on kept results; no column of a disease. |
| `derm-pasi` | Keep | done | `pasi` |  | Three tools: `pasi`, `easi`, `scorad`. |
| `derm-gop` | Adapt | slot | `izotretinoin-gebelik-onleme` |  |  |
| `derm-fototerapi` | Keep | absent |  |  | A dose diary is a series per patient with a starting dose from a protocol; it needs its own record shape and local protocol. |
| `derm-yama` | Keep | done | `yama-okuma` |  |  |
| `derm-kohort` | Keep | done | `takip-paneli` | dermatoloji | The follow-up list, shown to this role. One list of the follow-up days the doctor entered on kept results; no column of a disease. |
| `derm-biyolojik-sut` | Remove | absent (blocked) |  |  |  |
| `kd-gebelik-takvim` | Adapt | slot | `gebelik-takvimi` |  |  |
| `kd-dogum-rapor` | Adapt | slot | `dogum-analik-raporu` |  |  |
| `kd-mec` | Keep | slot | `kontrasepsiyon-mec` |  | Reclassified from keep: the eligibility table is published reference content of an authority. |
| `kd-risk` | Adapt | slot | `obstetrik-risk` |  |  |
| `kd-kohort` | Adapt | slot | `kd-kohort` |  |  |
| `psik-phq-gad` | Keep | slot | `phq9-gad7` |  | Published questionnaires: authorised translation and licence needed. |
| `psik-risk` | Adapt | slot | `psikiyatri-guvenlik-triyaj` |  |  |
| `psik-ilac-izlem` | Keep | slot | `psikotrop-izlem` |  | Reclassified from keep: monitoring intervals per medicine are local guidance. |
| `psik-sgk` | Remove | absent (blocked) |  |  |  |
| `psik-kohort` | Keep | done | `takip-paneli` | psikiyatri | The follow-up list, shown to this role since 2026-10-10 (NOTYA-ULKE-UYGULA-UZ): every doctor role now has a tool whose result can be kept, the body mass index (`uz-tana-vazni-indeksi`). It was absent until that day. One list of the follow-up days the doctor entered on kept results; no column of a disease. |
| `kbb-otoskopi` | Keep | done | `otoskopi-notu` |  |  |
| `kbb-odyometri` | Keep | done | `odyometri-pta` |  | Bands without gaps (the pre-split tool has gaps between whole numbers; see OPEN-COMMITMENTS). |
| `kbb-vertigo` | Keep | done | `vertigo-notu` |  |  |
| `kbb-sgk` | Remove | absent (blocked) |  |  |  |
| `kbb-kohort` | Keep | done | `takip-paneli` | kulak-burun-bogaz | The follow-up list, shown to this role. One list of the follow-up days the doctor entered on kept results; no column of a disease. |
| `kardio-score2` | Adapt | slot | `kv-risk-score2` |  |  |
| `kardio-ht-kky` | Keep | slot | `kardiyo-izlem` |  | Reclassified from keep: targets and intervals are local guidance. Mechanism in the kit. |
| `kardio-sgk` | Remove | absent (blocked) |  |  |  |
| `kardio-kohort` | Keep | done | `takip-paneli` | kardiyoloji | The follow-up list, shown to this role since 2026-10-10 (NOTYA-ULKE-UYGULA-UZ): every doctor role now has a tool whose result can be kept, the body mass index (`uz-tana-vazni-indeksi`). It was absent until that day. One list of the follow-up days the doctor entered on kept results; no column of a disease. |
| `gogus-cat-mmrc` | Keep | slot | `cat-mmrc` |  | Published questionnaires: authorised translation and licence needed. |
| `gogus-aksiyon-plani` | Keep | slot | `akciger-aksiyon-plani` |  | Reclassified from keep: an action plan names medicines and doses. |
| `gogus-inhaler` | Keep | done | `inhaler-teknik` |  |  |
| `gogus-sgk` | Remove | absent (blocked) |  |  |  |
| `gogus-kohort` | Keep | done | `takip-paneli` | gogus-hastaliklari | The follow-up list, shown to this role. One list of the follow-up days the doctor entered on kept results; no column of a disease. |
| `noro-inme` | Adapt | slot | `inme-kirmizi-bayrak` |  |  |
| `noro-migren` | Keep | slot | `midas` |  | Published questionnaire: authorised translation and licence needed. |
| `noro-ilac-izlem` | Keep | slot | `antiepileptik-izlem` |  | Reclassified from keep: monitoring per medicine is local guidance. |
| `noro-kohort` | Keep | done | `takip-paneli` | noroloji | The follow-up list, shown to this role since 2026-10-10 (NOTYA-ULKE-UYGULA-UZ): every doctor role now has a tool whose result can be kept, the body mass index (`uz-tana-vazni-indeksi`). It was absent until that day. One list of the follow-up days the doctor entered on kept results; no column of a disease. |
| `uro-ipss` | Keep | slot | `ipss` |  | Published questionnaire: authorised translation and licence needed. |
| `uro-psa` | Keep | done | `psa-hizi` |  | The velocity arithmetic only; the pre-split tool's bands are not carried (they have gaps, and a band is clinical guidance). |
| `uro-acil` | Adapt | slot | `uroloji-acil-triyaj` |  |  |
| `uro-kohort` | Keep | done | `takip-paneli` | uroloji | The follow-up list, shown to this role. One list of the follow-up days the doctor entered on kept results; no column of a disease. |
| `orto-kirik-alci` | Keep | done | `kirik-alci-takip` |  |  |
| `orto-vas` | Keep | done | `vas-fonksiyon` |  |  |
| `orto-op-protokol` | Keep | done | `ortopedi-op-protokol` |  |  |
| `orto-kohort` | Keep | done | `takip-paneli` | ortopedi | The follow-up list, shown to this role. One list of the follow-up days the doctor entered on kept results; no column of a disease. |
| `ftr-seans` | Adapt | slot | `ftr-seans-plani` |  |  |
| `ftr-vas-odi` | Keep | slot | `vas-odi` |  | Published questionnaire: authorised translation and licence needed. |
| `ftr-egzersiz` | Adapt | slot | `ev-egzersiz` |  |  |
| `ftr-kohort` | Keep | done | `takip-paneli` | fizik-tedavi | The follow-up list, shown to this role since 2026-10-10 (NOTYA-ULKE-UYGULA-UZ): every doctor role now has a tool whose result can be kept, the body mass index (`uz-tana-vazni-indeksi`). It was absent until that day. One list of the follow-up days the doctor entered on kept results; no column of a disease. |
| `aile-asi-tarama` | Adapt | slot | `aile-asi-tarama` |  |  |
| `aile-kronik` | Adapt | slot | `aile-kronik` |  |  |
| `aile-sevk` | Adapt | slot | `aile-sevk` |  |  |
| `aile-kohort` | Adapt | slot | `aile-kohort` |  |  |
| `spor-rtp` | Keep | done | `rtp-basamak` |  | The steps as a list; no number of days between steps is proposed. |
| `spor-sakatlik` | Keep | done | `sakatlik-gunlugu` |  |  |
| `spor-kohort` | Keep | done | `takip-paneli` | spor-hekimligi | The follow-up list, shown to this role. One list of the follow-up days the doctor entered on kept results; no column of a disease. |
| `endo-lab-izlem` | Keep | slot | `lab-izlem` |  | Reclassified from keep: targets and intervals are local guidance. Mechanism in the kit. |
| `endo-dxa` | Keep | slot | `dxa-tekrar` |  | Reclassified from keep: the repeat interval is local guidance. Mechanism in the kit. |
| `endo-rejim` | Keep | done | `rejim-karti` |  | A structured card of what the doctor decided; it holds no medicine and no dose. |
| `endo-kohort` | Keep | done | `takip-paneli` | endokrinoloji | The follow-up list, shown to this role. One list of the follow-up days the doctor entered on kept results; no column of a disease. |
| `gastro-ibd-ibs` | Keep | slot | `ibd-skor` |  | Reclassified from keep: the bands are published thresholds the country must confirm. Mechanism in the kit. |
| `gastro-endoskopi` | Keep | absent |  |  | A bridge to uploaded documents; document and image upload stays out of this job. |
| `gastro-hepatit` | Keep | slot | `hepatit-izlem` |  | Reclassified from keep: intervals are local guidance. Mechanism in the kit. |
| `gastro-kohort` | Keep | done | `takip-paneli` | gastroenteroloji | The follow-up list, shown to this role since 2026-10-10 (NOTYA-ULKE-UYGULA-UZ): every doctor role now has a tool whose result can be kept, the body mass index (`uz-tana-vazni-indeksi`). It was absent until that day. One list of the follow-up days the doctor entered on kept results; no column of a disease. |
| `nef-egfr-kdigo` | Keep | slot | `kdigo-serit` |  | OFF BY THE OWNER'S ORDER OF 2026-10-10 (NOTYA-ULKE-ARAC-01b); it was done (switched on) until that day. The tool shows the low-risk (green) cell when no urine albumin result was typed. |
| `nef-diyaliz` | Keep | done | `diyaliz-seans` |  |  |
| `nef-anemi` | Keep | slot | `anemi-izlem` |  | Reclassified from keep: targets are local guidance. Mechanism in the kit. |
| `nef-sgk` | Remove | absent (blocked) |  |  |  |
| `nef-kohort` | Keep | done | `takip-paneli` | nefroloji | The follow-up list, shown to this role. One list of the follow-up days the doctor entered on kept results; no column of a disease. |
| `enfeksiyon-izolasyon` | Adapt | slot | `enfeksiyon-bildirim` |  |  |
| `enfeksiyon-atb-sure` | Keep | done | `antibiyotik-sure` |  | A day counter on the doctor's own start day and length; it holds no antibiotic and no duration. |
| `enfeksiyon-viral-izlem` | Keep | slot | `viral-izlem` |  | Reclassified from keep: intervals are local guidance. Mechanism in the kit. |
| `enfeksiyon-kohort` | Keep | done | `takip-paneli` | enfeksiyon-hastaliklari | The follow-up list, shown to this role. One list of the follow-up days the doctor entered on kept results; no column of a disease. |
| `onko-kur` | Keep | done | `kur-sayaci` |  |  |
| `onko-toksisite` | Keep | done | `toksisite-listesi` |  |  |
| `onko-sut` | Remove | absent (blocked) |  |  |  |
| `onko-kohort` | Keep | done | `takip-paneli` | onkoloji | The follow-up list, shown to this role. One list of the follow-up days the doctor entered on kept results; no column of a disease. |
| `gc-preop` | Keep | done | `genel-preop` |  |  |
| `gc-yara-dren` | Keep | done | `yara-dren-izlem` |  | Shared with paediatric surgery. |
| `gc-patoloji` | Keep | absent |  |  | A bridge to uploaded documents; document and image upload stays out of this job. |
| `gc-kohort` | Keep | done | `takip-paneli` | genel-cerrahi | The follow-up list, shown to this role. One list of the follow-up days the doctor entered on kept results; no column of a disease. |
| `plastik-foto` | Keep | absent |  |  | A bridge to uploaded photographs; document and image upload stays out of this job. |
| `plastik-yara` | Keep | done | `plastik-yara-greft` |  |  |
| `plastik-onam` | Adapt | slot | `plastik-onam` |  |  |
| `plastik-kohort` | Keep | done | `takip-paneli` | plastik-cerrahi | The follow-up list, shown to this role. One list of the follow-up days the doctor entered on kept results; no column of a disease. |
| `acil-esi` | Keep | slot | `esi-triyaj` |  | OFF BY THE OWNER'S ORDER OF 2026-10-10 (NOTYA-ULKE-ARAC-01b); it was done (switched on) until that day. Licence: the scale's owner (Emergency Nurses Association) requires written permission; the slot states "permission needed". |
| `acil-kritik-yol` | Keep | done | `kritik-yol` |  |  |
| `acil-sevk` | Adapt | slot | `acil-sevk` |  |  |
| `acil-kohort` | Keep | done | `takip-paneli` | acil-tip | The follow-up list, shown to this role. One list of the follow-up days the doctor entered on kept results; no column of a disease. |
| `bc-postop` | Keep | done | `noro-postop` |  |  |
| `bc-goruntu` | Keep | absent |  |  | A bridge to uploaded images; document and image upload stays out of this job. |
| `bc-bilinc` | Keep | done | `nobet-bilinc` |  |  |
| `bc-kohort` | Keep | done | `takip-paneli` | beyin-cerrahisi | The follow-up list, shown to this role. One list of the follow-up days the doctor entered on kept results; no column of a disease. |
| `anestezi-asa` | Keep | done | `asa-preop` |  |  |
| `anestezi-hava-yolu` | Keep | done | `hava-yolu-notu` |  |  |
| `anestezi-agri` | Keep | done | `postop-agri` |  |  |
| `anestezi-kohort` | Keep | done | `takip-paneli` | anestezi | The follow-up list, shown to this role. One list of the follow-up days the doctor entered on kept results; no column of a disease. |
| `radyo-kuyruk` | Keep | done | `tetkik-kuyrugu` |  |  |
| `radyo-rapor` | Keep | slot | `rapor-taslagi` |  | OFF BY THE OWNER'S ORDER OF 2026-10-10 (NOTYA-ULKE-ARAC-01b); it was done (switched on) until that day. Licence: the tool prints the BI-RADS categories, for which the American College of Radiology requires a licence agreement in commercial software; the slot states "permission needed". The whole tool is off. |
| `radyo-kritik` | Adapt | slot | `radyo-kritik-bildirim` |  |  |
| `radyo-kohort` | Keep | done | `takip-paneli` | radyoloji | The follow-up list, shown to this role. One list of the follow-up days the doctor entered on kept results; no column of a disease. |
| `gogus-cerrahi-preop` | Keep | done | `toraks-preop` |  |  |
| `gogus-cerrahi-tup-yara` | Keep | done | `toraks-tup-yara` |  |  |
| `gogus-cerrahi-patoloji` | Keep | absent |  |  | A bridge to uploaded documents; document and image upload stays out of this job. |
| `gogus-cerrahi-kohort` | Keep | done | `takip-paneli` | gogus-cerrahisi | The follow-up list, shown to this role. One list of the follow-up days the doctor entered on kept results; no column of a disease. |
| `kdc-preop` | Keep | done | `kalp-damar-preop` |  |  |
| `kdc-greft-yara` | Keep | done | `greft-yara-izlem` |  |  |
| `kdc-antikoag` | Keep | done | `antikoagulan-vadeleri` |  | Dates the doctor sets; it holds no medicine, no target and no interval. |
| `kdc-kohort` | Keep | done | `takip-paneli` | kalp-damar-cerrahisi | The follow-up list, shown to this role. One list of the follow-up days the doctor entered on kept results; no column of a disease. |
| `roma-das28-basdai` | Keep | done | `das28` |  | DAS28 only. The BASDAI half is a published questionnaire and is the slot `basdai`. |
| `roma-biyolojik-sut` | Remove | absent (blocked) |  |  |  |
| `roma-lab-izlem` | Keep | done | `eklem-28` |  | The joint map only. The laboratory follow-up half leaves its intervals to the country and is the slot `iltihap-lab-izlem` (mechanism in the kit). |
| `roma-kohort` | Adapt | done | `takip-paneli` | romatoloji | The follow-up list, shown to this role. One list of the follow-up days the doctor entered on kept results; no column of a disease. |
| `cc-prepost-op` | Keep | done | `cocuk-prepost-op` |  |  |
| `cc-yara-dren` | Keep | done | `yara-dren-izlem` |  | Shared with general surgery. |
| `cc-onam-veli` | Adapt | slot | `cocuk-onam-veli` |  |  |
| `cc-kohort` | Adapt | done | `takip-paneli` | cocuk-cerrahisi | The follow-up list, shown to this role. One list of the follow-up days the doctor entered on kept results; no column of a disease. |

## Pages under `app/doktor-tools` that are not registry tiles

| Page | Verdict | Reason |
|---|---|---|
| `/doktor-tools/hatirlatma` | **Keep** | Reminder composer opened from the cohort panels. Core helper; its templates and channels are local (checklist E8, H4). |
| `/doktor-tools/bekleyen-konsultasyonlar` | **Remove** | Old address kept only as a redirect to `/doktor-tools/konsultasyonlar` for Turkish bookmarks. Not needed in a new country. |
| `/doktor-tools` (the grid itself) | **Keep** | Core page; shows whatever the registry and the pack allow. Empty in Uzbekistan today. |

## Add: candidate tools for Uzbekistan

Candidates only. Each needs the clinical lead to say whether doctors would use it, and the research in checklist B, C, G and H to say what it must contain. Items that depend on an unverified fact say so.

| Candidate | What it would do |
|---|---|
| State record helper (DMED) | Paste-ready content for the state electronic record, the way the e-Nabız desk works in Türkiye: Notya prepares the fields, the doctor enters them. Only if private clinics must use the state system (open question; Order 3758 coverage to verify). No integration claim. |
| Prescription in the Uzbek format | Prescription output in the form, language (Uzbek or Russian, the doctor chooses) and with the controlled-drug rules Uzbek law requires. Replaces the Turkish e-prescription assistant and the red / green prescription tool. |
| Sick-leave certificate draft | Draft of the temporary incapacity certificate with the periods and fields Uzbek rules require. Replaces the SGK e-İstirahat part of "Hasta Raporları". |
| Standard medical certificates and referral forms | The certificate and referral forms an Uzbek outpatient clinic issues every day (form numbers and fields to be collected in checklist G1 and G4). |
| National vaccination calendar and catch-up | The Uzbek calendar (source in `docs/COUNTRY-PACK-UZBEKISTAN.md`) with the same done / due / overdue logic as the Turkish tool. Feeds paediatrics and family medicine. |
| Notifiable disease report | Which diagnoses must be reported, to whom and by when, with a draft of the report. Replaces the notification half of the infectious-diseases isolation tool. |
| Diagnosis coding in Uzbek and Russian | Search by Uzbek or Russian diagnosis text, in the coding edition in force (to verify). |
| Clinic registration and consent checklist | What an Uzbek private clinic must have on file for each patient: consent for recording, data processing and treatment (checklist A3, I1, I2). Replaces the Turkish registration and KVKK checklist of the clinic tools. |
| Note in the other language | One-click rewrite of a finished note from Uzbek to Russian or back (Kaan's decision: the doctor chooses the report language). Core feature rather than a tile; listed here so it is not lost (checklist E6). |
| Local disease-pattern panels | Follow-up panels for conditions that weigh more in Uzbekistan than in Türkiye. Which ones is a question for the clinical lead (checklist C11); tuberculosis, viral hepatitis, anaemia and iodine deficiency are Claude's guesses, not findings. |

### What each candidate would need (2026-10-09, NOTYA-ULKE-ARACLAR-01)

**None of the ten was built.** They stay proposals. Each needs content that only a local source can give, and the kit holds no such content. What the kit already has for it is said in the last column.

| Candidate | What it needs before it can be built | From whom | What the kit has today |
|---|---|---|---|
| State record helper (DMED) | Whether private clinics must use the state record; the fields it asks for; a written decision that Notya only prepares text the doctor enters (no integration, no automated writing) | A lawyer in Uzbekistan and the clinical lead; Kaan for the decision | Nothing. No slot: the need itself is unconfirmed |
| Prescription in the Uzbek format | The register of authorised medicines, the prescription form and its mandatory fields, the language rule, the controlled-medicine rules | The clinical lead with the national source named | The slot `recete` |
| Sick-leave certificate draft | The form of the temporary incapacity certificate, its fields and the periods the rules allow | A lawyer in Uzbekistan with the clinical lead | The slot `hasta-belgeleri` |
| Standard certificates and referral forms | The form numbers and fields an outpatient clinic issues (checklist G1, G4) | The clinical lead | The slots `hasta-belgeleri`, `muayene-ozeti-belgesi`, `aile-sevk`, `acil-sevk` |
| National vaccination calendar and catch-up | The national calendar in force, with its source and date, and the catch-up rules | The clinical lead, from the Ministry of Health's published calendar | The slots `asi-takvimi` and `aile-asi-tarama`. No calendar is written anywhere |
| Notifiable disease report | Which diagnoses are notifiable, to whom, by when, and the report form | The clinical lead with the sanitary-epidemiological service's rules | The slot `enfeksiyon-bildirim` |
| Diagnosis coding in Uzbek and Russian | The coding edition in force and its official titles in both languages | The clinical lead with the official source | The slot `tani-kodlama` |
| Clinic registration and consent checklist | What a private clinic must hold on file per patient: consent for recording, data processing and treatment | A lawyer in Uzbekistan | Nothing in the tools area. The consent sentences of the visit and of the intake form exist and await the same lawyer |
| Note in the other language | Nothing local: it is a kit feature | Claude | Built earlier as part of the note screen (rewrite into the other language); it is not a tile and needs none |
| Local disease-pattern panels | Which conditions, and for each the follow-up content: tests, targets, intervals | The clinical lead (checklist C11) | The generic follow-up list (`takip-paneli`), which holds no disease content, and the mechanism-ready slots `hepatit-izlem`, `viral-izlem`, `anemi-izlem`, `lab-izlem` |

## Appendix: clinic tools (`lib/klinik/klinikAraclari.ts`, `app/klinik-tools`)

The 10 clinic types have their own registry of 33 tools. It does **not** carry a countries field yet: only the doctor registry was in scope of the foundation job. In Uzbekistan these pages cannot be reached (their routes are not on the country's list). Giving this registry the same `ulkeler` field is a small job of its own (`docs/COUNTRY-PACK-SPLIT-PLAN.md`).

Totals: Remove 2, Adapt 3, Keep 28.

| Tool (Turkish title) | Route | Clinic type | Verdict | Reason |
|---|---|---|---|---|
| Hasta Portalı | `/klinik-tools/hasta-portali` | all 10 | **Keep** | Core feature (patient portal access). Translation. |
| Kayıt · rıza · KVKK | `/klinik-tools/kayit-kvkk` | all 10 | **Remove** | Checklist of Turkish registration, patient-rights and KVKK duties. The Uzbek counterpart is a new tool, see Add. |
| e-Nabız | `/klinik-tools/enabiz` | all 10 | **Remove** | Türkiye-only state system. |
| Donör greft bandı | `/klinik-tools/sac-greft` | sac-ekimi | **Keep** | Graft estimate arithmetic; universal. |
| Yıkama takvimi | `/klinik-tools/sac-takvim` | sac-ekimi | **Keep** | After-care dates; universal. Patient text needs native review. |
| Saç ekimi kohort | `/klinik-tools/sac-kohort` | sac-ekimi | **Keep** | Follow-up cohort. Translation. |
| Elektif onam / soğuma | `/klinik-tools/cerrahi-onam` | estetik-cerrahi | **Adapt** | Cooling-off and consent record follows a Turkish regulation. Needs the Uzbek rule for elective procedures. |
| Ameliyat sonrası takvim | `/klinik-tools/cerrahi-takvim` | estetik-cerrahi | **Keep** | Post-operative dates; universal. |
| Estetik cerrahi kohort | `/klinik-tools/cerrahi-kohort` | estetik-cerrahi | **Keep** | Follow-up cohort. Translation; local emergency line. |
| Onam / soğuma | `/klinik-tools/estetik-soguma` | medikal-estetik | **Adapt** | Same Turkish cooling-off regulation as above. |
| İşlem bakım takvimi | `/klinik-tools/estetik-takvim` | medikal-estetik | **Keep** | After-care dates; universal. |
| Estetik kohort | `/klinik-tools/estetik-kohort` | medikal-estetik | **Keep** | Follow-up cohort. Translation. |
| Lazer seans vadesi | `/klinik-tools/derm-lazer` | klinik-dermatoloji | **Keep** | Session interval; universal. |
| Akne bakım takvimi | `/klinik-tools/derm-takvim` | klinik-dermatoloji | **Keep** | Care calendar; universal. |
| Klinik dermatoloji kohort | `/klinik-tools/derm-kohort` | klinik-dermatoloji | **Keep** | Follow-up cohort. Translation. |
| Sonraki seans vadesi | `/klinik-tools/long-vade` | longevity | **Keep** | Next-session date; universal. |
| IV güvenlik kaydı | `/klinik-tools/long-guvenlik` | longevity | **Keep** | Safety record (lot, allergy); universal. Local emergency line. |
| Longevity kohort | `/klinik-tools/long-kohort` | longevity | **Keep** | Follow-up cohort. Translation. |
| ICF seans özeti | `/klinik-tools/fizyo-icf` | fizyoterapi | **Keep** | ICF summary; international classification. |
| Seans vadesi | `/klinik-tools/fizyo-seans` | fizyoterapi | **Keep** | Next-session reminder; universal (its text says no SGK claim is made: remove the sentence). |
| Fizyoterapi kohort | `/klinik-tools/fizyo-kohort` | fizyoterapi | **Keep** | Follow-up cohort. Translation. |
| Seans çerçevesi | `/klinik-tools/psikolog-seans` | klinik-psikolog | **Keep** | Session frame and scale record; universal. Local crisis line. |
| Seans vadesi | `/klinik-tools/psikolog-vade` | klinik-psikolog | **Keep** | Next-session date; universal. |
| Klinik psikoloji kohort | `/klinik-tools/psikolog-kohort` | klinik-psikolog | **Keep** | Follow-up cohort. Translation. |
| Makro bandı | `/klinik-tools/diyet-makro` | diyetisyen | **Keep** | Energy and protein arithmetic; universal. |
| Kontrol takvimi | `/klinik-tools/diyet-takvim` | diyetisyen | **Keep** | Control calendar; universal. |
| Diyetisyen kohort | `/klinik-tools/diyet-kohort` | diyetisyen | **Keep** | Follow-up cohort. Translation. |
| GYA özeti | `/klinik-tools/ergo-gya` | ergoterapi | **Keep** | Activities-of-daily-living summary; universal. |
| GYA seans vadesi | `/klinik-tools/ergo-seans` | ergoterapi | **Keep** | Next-session date; universal. |
| Ergoterapi kohort | `/klinik-tools/ergo-kohort` | ergoterapi | **Keep** | Follow-up cohort. Translation. |
| Eşik kaydı | `/klinik-tools/odyo-esik` | odyoloji | **Keep** | Pure-tone average band; universal. |
| Sessiz oda kaydı | `/klinik-tools/odyo-oda` | odyoloji | **Adapt** | Quiet-room record cites a Turkish regulation (article 11, at least 3 m²). Needs the Uzbek standard for audiology rooms. |
| Odyoloji kohort | `/klinik-tools/odyo-kohort` | odyoloji | **Keep** | Follow-up cohort. Translation. |
