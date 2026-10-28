/**
 * NOTYA-ARACLAR-DENETIM-02-AU, 2026-10-13 — AUSTRALIA'S OWN PROPOSED SLOTS (`AracYuvasi`, lib/ulke/araclar/tipler.ts):
 * "a tool the country does NOT have yet, said out loud: what is missing and who must supply it. Documentation and
 * tests only — no screen reads a slot, and a slot is never switched on by itself."
 *
 * These answer the founder's second audit question ("does Australian practice in this specialty have something
 * distinctive Türkiye doesn't have") for the findings that (a) are genuinely new — the shared English kit's
 * own slot list (countries/_dil/en/araclar/yuvalar.ts) already covers several other findings of this pass
 * (cardiovascular risk, antenatal/screening windows, the vaccination-and-screening schedule, isotretinoin pregnancy
 * prevention, notifiable diseases) and nothing is added here for those — and (b) are responsibly buildable later:
 * not already correctly declined on a copyright ground the earlier audit found (the Australian Sports Commission's
 * concussion/return-to-sport guidance stays declined, unchanged by this pass — see ../ayarlar.ts, "NOT SUPPLIED").
 *
 * Every `lisans` below is `belirsiz` ("unclear, not read") unless this session read the rights holder's own notice —
 * exactly as every other licence statement in this pack states one only where it was read (../ayarlar.ts, "NO OTHER
 * TOOL OF THE SHARED SET HAS A LICENCE STATED HERE").
 */
import type { AracYuvasi } from '@/lib/ulke/araclar/tipler'

const KLINISYEN = 'a clinical lead in Australia, with the national source named'
const HUKUK = 'a lawyer of Australia, with the clinical lead'

export const AU_EK_YUVALAR: readonly AracYuvasi[] = [
  // Mandatory notifications left this list on 2026-10-15. The screen is au-mandatory-notifications, built from the
  // Queensland Act (sections 140 to 142), not from a regulator's guidance page. See ./notifications.ts.
  // ── emergency medicine: the correct replacement for the closed ESI tool ──
  {
    anahtar: 'au-triage-scale',
    acik: false,
    icerik: null,
    mekanizmaHazir: false,
    eksik:
      'The Australasian Triage Scale (ATS), the five-category scale Australian emergency departments actually use — NOT the Emergency Severity Index (ESI) the kit built, which ../ayarlar.ts already keeps off for Australia for exactly this reason. Read 2026-10-13: Australasian College for Emergency Medicine (ACEM), "Policy on the Australasian Triage Scale" (P06), https://policy.acem.org.au/index.php/policies-menu/p06-policy-on-the-australasian-triage-scale; the category descriptors are also published by the Australian Commission on Safety and Quality in Health Care\'s Emergency Triage Education Kit. LICENCE: the existing `esi-triyaj` slot\'s own note already finds that ATS "belongs to the Australasian College for Emergency Medicine and needs the College\'s permission before a tool may carry it" — the same permission question applies here, not a new one.',
    kimden: HUKUK,
    roller: ['emergency-medicine'],
    lisans: { durum: 'izin-gerekli', hakSahibi: 'Australasian College for Emergency Medicine (ACEM)', kaynak: 'https://policy.acem.org.au/index.php/policies-menu/p06-policy-on-the-australasian-triage-scale (read 2026-10-13): the policy document; permission was not sought this session, consistent with the existing esi-triyaj slot\'s own finding.' },
  },
  // ── ophthalmology ──
  {
    anahtar: 'au-diabetic-retinopathy-referral',
    acik: false,
    icerik: null,
    mekanizmaHazir: false,
    eksik:
      'A referral-pathway reference for diabetic retinopathy screening — grading band, review interval and the threshold for an urgent referral — distinct from the kit\'s own generic visual-acuity tool. Read 2026-10-13: RANZCO, the region\'s ophthalmology college, "Referral Pathway for Diabetic Retinopathy", https://ranzco.edu/home/health-professionals/referral-pathway-for-diabetic-retinopathy/. The college\'s own copyright/permissions terms for reproducing the pathway\'s bands were not read this session.',
    kimden: KLINISYEN,
    roller: ['ophthalmology'],
    lisans: { durum: 'belirsiz', hakSahibi: 'Royal Australian and New Zealand College of Ophthalmologists (RANZCO)', kaynak: 'https://ranzco.edu/home/health-professionals/referral-pathway-for-diabetic-retinopathy/ (read 2026-10-13): the pathway page itself; RANZCO\'s copyright/permissions page was not opened this session.' },
  },
  // ── oncology ──
  {
    anahtar: 'au-oncology-care-pathway',
    acik: false,
    icerik: null,
    mekanizmaHazir: false,
    eksik:
      'A link to the national Optimal Care Pathway for the patient\'s cancer type (one per cancer, each setting the expected steps from presentation to survivorship/end-of-life) — a genuinely Australian resource with no equivalent elsewhere in this product. Read 2026-10-13: Cancer Australia, "Optimal Care Pathways", https://www.canceraustralia.gov.au (health-professionals pages per cancer type, e.g. breast, ovarian, endometrial, bowel). Cancer Australia\'s own copyright terms (https://canceraustralia.gov.au/copyright) were found to exist but were not read in enough depth this session to state a licence state with confidence.',
    kimden: KLINISYEN,
    roller: ['oncology'],
    lisans: { durum: 'belirsiz', hakSahibi: 'Cancer Australia (Australian Government)', kaynak: 'https://canceraustralia.gov.au/copyright (found, not read in full, 2026-10-13)' },
  },
  // ── anaesthesia ──
  {
    anahtar: 'au-anaesthesia-fasting',
    acik: false,
    icerik: null,
    mekanizmaHazir: false,
    eksik:
      'Pre-anaesthesia fasting times (clear fluids, breast milk, formula/solids) by the college\'s own current table, plus its breastfeeding and smoking advice — distinct from the kit\'s own generic pre-operative checklist (asa-preop), which carries no times of its own. Read 2026-10-13: ANZCA, the region\'s anaesthesia college, "PG07 Appendix 1 — Fasting guideline" (2024 update), https://anzca.edu.au/getattachment/897f5bf5-b665-4c99-a56f-e72678f19f7e/PG07-Appendix-1-–-Fasting-guideline-2024. The college\'s own copyright/reproduction terms were not read this session.',
    kimden: KLINISYEN,
    roller: ['anaesthesia'],
    lisans: { durum: 'belirsiz', hakSahibi: 'Australian and New Zealand College of Anaesthetists (ANZCA)', kaynak: 'https://anzca.edu.au (PG07 Appendix 1, read 2026-10-13); ANZCA\'s copyright/reproduction terms were not opened this session.' },
  },
  // ── rehabilitation medicine: functional outcome measurement, distinct from the kit's session-plan / pain-scale slots ──
  {
    anahtar: 'au-rehab-outcome',
    acik: false,
    icerik: null,
    mekanizmaHazir: false,
    eksik:
      'The Functional Independence Measure (FIM), the outcome measure the region\'s rehabilitation medicine actually benchmarks against nationally — different content from the kit\'s own session-plan, pain-scale (ODI) and home-exercise slots, none of which measure function. Read 2026-10-13: University of Wollongong, Australasian Rehabilitation Outcomes Centre (AROC), "What is the FIM and WeeFIM instrument?", https://www.uow.edu.au/ahsri/aroc/fim-weefim/. FIM ITSELF IS A LICENSED INSTRUMENT, RESTRICTED TO CLINICIANS WHO HAVE COMPLETED ITS TRAINING, of the Uniform Data System for Medical Rehabilitation (UDSMR), administered overseas: no item is reproduced here, and a clinician who holds that training must confirm the licence before any score is shown.',
    kimden: KLINISYEN,
    roller: ['rehabilitation-medicine'],
    lisans: { durum: 'izin-gerekli', hakSahibi: 'Uniform Data System for Medical Rehabilitation (UDSMR); administered in Australia and New Zealand via the Australasian Rehabilitation Outcomes Centre (AROC)', kaynak: 'https://www.uow.edu.au/ahsri/aroc/fim-weefim/ (read 2026-10-13): AROC\'s own page names FIM as a UDSMR-licensed, certification-gated instrument.' },
  },
  // ── endocrinology: which fracture-risk tool, not the DXA-repeat interval the kit's dxa-tekrar slot already asks for ──
  {
    anahtar: 'au-fracture-risk',
    acik: false,
    icerik: null,
    mekanizmaHazir: false,
    eksik:
      'Which absolute-fracture-risk calculator this product uses for Australia: RACGP\'s own clinical guideline discusses BOTH FRAX (University of Sheffield) and the Garvan nomogram (Garvan Institute of Medical Research, Sydney) without the two tools agreeing with each other ("Australia\'s absolute fracture risk calculators \'don\'t tally\'", read 2026-10-13, https://www.ausdoc.com.au/news/australias-absolute-fracture-risk-calculators-dont-tally/; RACGP, "Assessment of absolute fracture risk", https://www.racgp.org.au/clinical-resources/clinical-guidelines/key-racgp-guidelines/view-all-racgp-guidelines/osteoporosis/risk-factors/assessment-of-absolute-fracture-risk, both read 2026-10-13). An endocrinologist must choose one (or show both with the same honest caveat this pack already uses for its growth-chart reference) before this is built; EITHER tool\'s own terms for embedding its algorithm in a product were not read this session.',
    kimden: KLINISYEN,
    roller: ['endocrinology'],
    lisans: { durum: 'belirsiz', hakSahibi: 'University of Sheffield (FRAX) and the Garvan Institute of Medical Research (Garvan Fracture Risk Calculator)', kaynak: 'https://www.racgp.org.au/clinical-resources/clinical-guidelines/key-racgp-guidelines/view-all-racgp-guidelines/osteoporosis/risk-factors/assessment-of-absolute-fracture-risk (read 2026-10-13); neither calculator\'s own embedding terms were read this session.' },
  },
  // ── NOTYA-ULKE-ARACLAR-AU-07, 2026-10-17: four kit mechanisms built and proven this pass (katalog.ts,
  // esdegerlik.test.ts), each held here as a slot rather than switched on, per this pack's own standing rule for a
  // brand-new tool (EMIR_KBH, above in ../ayarlar.ts: ships off until a named clinician signs off) ──
  // ── psychiatry: PHQ-9 and GAD-7, held as two separate kit keys (the shared set's own `phq9-gad7` slot, above in
  // countries/_dil/en/araclar/yuvalar.ts, already finds the same licence gap for the combined pair) ──
  {
    anahtar: 'phq9',
    acik: false,
    icerik: null,
    mekanizmaHazir: true,
    eksik:
      'PHQ-9 (Patient Health Questionnaire-9): the kit holds the scoring mechanism (nine numbered items, no item wording shown, with the ninth item\'s safety flag) under this key, proven against the real psychiatry engine\'s arithmetic in the equivalence suite. THE LICENCE QUESTION is the same one the shared set\'s own `phq9-gad7` slot already names: Pfizer\'s terms for showing the instrument\'s original English wording inside a commercial product were not read this session. Awaits a clinical lead\'s sign-off on top of the licence question.',
    kimden: KLINISYEN,
    roller: ['psychiatry', 'clinical-psychology'],
    lisans: { durum: 'belirsiz', hakSahibi: 'Pfizer Inc. (PHQ-9, developed by Robert L. Spitzer, Janet B.W. Williams, Kurt Kroenke)', kaynak: 'Kroenke K, Spitzer RL, Williams JBW. J Gen Intern Med. 2001;16(9):606-613; Pfizer\'s own terms for commercial-product use were not read this session — the same gap the shared set\'s phq9-gad7 slot already names.' },
  },
  {
    anahtar: 'gad7',
    acik: false,
    icerik: null,
    mekanizmaHazir: true,
    eksik:
      'GAD-7 (Generalized Anxiety Disorder-7): the kit holds the scoring mechanism (seven numbered items, no item wording shown) under this key, proven against the real psychiatry engine\'s arithmetic in the equivalence suite. THE LICENCE QUESTION is the same one the shared set\'s own `phq9-gad7` slot already names. Awaits a clinical lead\'s sign-off on top of the licence question.',
    kimden: KLINISYEN,
    roller: ['psychiatry', 'clinical-psychology'],
    lisans: { durum: 'belirsiz', hakSahibi: 'Pfizer Inc. (GAD-7, developed by Robert L. Spitzer, Kurt Kroenke, Janet B.W. Williams, Bernd Lowe)', kaynak: 'Spitzer RL, Kroenke K, Williams JBW, Lowe B. Arch Intern Med. 2006;166(10):1092-1097; Pfizer\'s own terms for commercial-product use were not read this session — the same gap the shared set\'s phq9-gad7 slot already names.' },
  },
  // ── physiotherapy / rehabilitation medicine: the shared set's own `pain-odi` slot (countries/_dil/en/araclar/
  // yuvalar.ts) names the same licence gap for ODI under a different, combined key; these two are the pack's own
  // slots for the actual kit keys the mechanism was built under ──
  {
    anahtar: 'odi',
    acik: false,
    icerik: null,
    mekanizmaHazir: true,
    eksik:
      'ODI (Oswestry Disability Index): the kit holds the scoring mechanism (ten numbered items, no item wording shown) under this key, proven against the real physiotherapy engine\'s arithmetic in the equivalence suite. THE LICENCE QUESTION is the same one the shared set\'s own `pain-odi` slot already names: ODI is a published, licensed questionnaire and its rights holder\'s terms for showing the English wording inside a commercial product were not read this session. Awaits a clinical lead\'s sign-off on top of the licence question.',
    kimden: KLINISYEN,
    roller: ['physiotherapy', 'rehabilitation-medicine', 'occupational-therapy'],
    lisans: { durum: 'belirsiz', hakSahibi: 'Fairbank JCT and the Oswestry Disability Index\'s rights holder', kaynak: 'Fairbank JCT, Pynsent PB. Spine. 2000;25(22):2940-2952; the instrument\'s own licensing terms were not read this session — the same gap the shared set\'s pain-odi slot already names.' },
  },
  {
    anahtar: 'vas-agri',
    acik: false,
    icerik: null,
    mekanizmaHazir: true,
    eksik:
      'A 0–10 pain visual analogue scale: the kit holds the mechanism under this key, proven against the real physiotherapy engine\'s arithmetic in the equivalence suite. No published item text is involved (a VAS is a single numbered line, not a copyrighted questionnaire), so there is no licence question here — only a clinical lead\'s sign-off, per this pack\'s standing rule for a brand-new tool.',
    kimden: KLINISYEN,
    roller: ['physiotherapy', 'rehabilitation-medicine', 'occupational-therapy'],
  },
  // buyume-persentili left this list on 2026-10-28 (AU pediatri gold): switched on as a live PaketAraci in
  // ../ayarlar.ts → ek.araclar (./buyumePersentili.ts). The shared set's own `growth-percentiles` slot (which chart
  // standard for 2–18) stays open; the link-out tile au-growth-chart-reference still names WHO / ANZSPED / CDC.
]
