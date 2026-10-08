# Uzbekistan tools audit

> **Proposal, to be confirmed by a local clinical lead.** Every verdict below was written by Claude on 2026-10-08 from the tool's own description and code, without a local clinician and without Uzbek source documents. Nothing here is switched on: every tool is valid in Türkiye only (`ulkeler: ['tr']` in `lib/doktor/doktorAraclari.ts`) and the Uzbek pack lists no tool. No tool behaviour was changed by the job that wrote this file.

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
