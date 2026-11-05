/**
 * KD-OPERATOR-01 (Kaan, 2026-11-05) — THE ENGLISH LANGUAGE SET: ROLE TOOLS, sixth part. The operating surgeon's tools
 * (lib/ulke/araclar/tanimlar/kdOperator.ts): the WHO Surgical Safety Checklist, Caprini and ASA for every surgical role;
 * for obstetrics and gynaecology antibiotic prophylaxis, IOTA Simple Rules, RMI I, PALM-COEIN with the leiomyoma types,
 * revised ASRM, #Enzian, Bishop, Robson, caesarean urgency, blood loss and shock index, the hysteroscopy fluid deficit,
 * the ERAS checklists and the procedure consent form.
 *
 * MACHINE-WRITTEN. AWAITS CLINICAL REVIEW IN EACH COUNTRY. Written in en-GB spelling. The line under each result (`not`)
 * names the international source; a country that follows its own national guidance restates it (`degisen.not`) and
 * states its own numbers (`parametreler`). No dose, cut-off or target is written here.
 *
 * THE CONSENT FORM (`sablonlar.islem`) is pre-filled from the shared list of each operation's serious and frequent risks
 * (lib/clinical/onamProsedurleri.ts). It is a structure for the conversation, not a risk figure: the frequency is the
 * clinician's to discuss and write ("Frequency discussed: ____"). Hymenoplasty is not offered.
 */
import { ONAM_PROSEDURLERI, ONAM_YAPILARI, type OnamProseduru } from '@/lib/clinical/onamProsedurleri'
import { CAPRINI_MADDELERI, SSC_ASAMALARI, SSC_MADDELERI } from '@/lib/clinical/cerrahiGuvenlik'
import { MYOM_SAYISI, OLCUM_SAYISI } from '@/lib/ulke/araclar/tanimlar/kdOperator'
import { DOZSUZ, KARAR, type HamArac } from './yardimci'

const CERRAHI_ROLLER = ['general-surgery', 'obstetrics-gynaecology', 'orthopaedics', 'urology', 'otolaryngology', 'ophthalmology', 'neurosurgery', 'cardiovascular-surgery', 'thoracic-surgery', 'plastic-surgery', 'paediatric-surgery', 'hair-transplant', 'aesthetic-surgery'] as const
const KD = ['obstetrics-gynaecology'] as const
type S = Record<string, string>

// ───────────────────────── WHO Surgical Safety Checklist ─────────────────────────

export const SSC_MADDE_ADLARI: S = {
  kimlik_bolge_islem_onam: 'Sign in: patient has confirmed identity, site, procedure and consent',
  bolge_isaretlendi: 'Sign in: site marked',
  anestezi_kontrolu: 'Sign in: anaesthesia machine and medication check complete',
  pulse_oksimetre: 'Sign in: pulse oximeter on the patient and working',
  alerji_soruldu: 'Sign in: known allergy asked and recorded',
  zor_hava_yolu_hazirlik: 'Sign in: difficult airway or aspiration risk: equipment and assistance available',
  kan_kaybi_hazirlik: 'Sign in: risk of blood loss over 500 mL (7 mL/kg in children): access and fluids planned',
  ekip_tanitildi: 'Time out: all team members introduced by name and role',
  hasta_islem_kesi_teyit: 'Time out: patient\'s name, procedure and incision site confirmed',
  antibiyotik_60dk: 'Time out: antibiotic prophylaxis given within the last 60 minutes',
  cerrah_kritik_adimlar: 'Time out: surgeon: critical or non-routine steps, duration, anticipated blood loss',
  anestezi_hasta_endiseleri: 'Time out: anaesthesia team: patient-specific concerns',
  hemsire_sterilite_ekipman: 'Time out: nursing team: sterility confirmed, equipment issues or concerns',
  goruntuleme_gosteriliyor: 'Time out: essential imaging displayed',
  islem_adi_kaydedildi: 'Sign out: name of the procedure recorded',
  sayim_dogru: 'Sign out: instrument, swab and needle counts correct',
  numune_etiketlendi: 'Sign out: specimen labelled with the patient\'s name',
  ekipman_sorunlari: 'Sign out: equipment problems to be addressed',
  iyilesme_plani: 'Sign out: key concerns for recovery reviewed by the surgical, anaesthesia and nursing team',
}
const EVET_HAYIR_NA: S = { evet: 'Yes', hayir: 'No', na: 'Not applicable' }

// ───────────────────────── Caprini ─────────────────────────

export const CAPRINI_ADLARI: S = {
  kucuk_cerrahi: 'Minor surgery planned', vki_25_ustu: 'Body mass index over 25', bacak_sislik: 'Swollen legs (current)', varis: 'Varicose veins',
  gebelik_lohusalik: 'Pregnant or postpartum', aciklanamayan_gebelik_kaybi: 'History of unexplained or recurrent pregnancy loss', oks_hrt: 'Oral contraceptives or hormone replacement',
  sepsis_1ay: 'Sepsis (less than 1 month)', ciddi_akciger_hastaligi_1ay: 'Serious lung disease, including pneumonia (less than 1 month)', anormal_solunum_fonksiyonu: 'Abnormal pulmonary function',
  akut_mi: 'Acute myocardial infarction', kalp_yetersizligi_1ay: 'Congestive heart failure (less than 1 month)', iltihabi_bagirsak_hastaligi: 'History of inflammatory bowel disease', yatak_istirahati_dahili: 'Medical patient currently at bed rest',
  artroskopik_cerrahi: 'Arthroscopic surgery', buyuk_acik_cerrahi_45dk: 'Major open surgery (over 45 minutes)', laparoskopik_cerrahi_45dk: 'Laparoscopic surgery (over 45 minutes)', malignite: 'Malignancy (present or previous)',
  yatak_72_saat: 'Confined to bed (over 72 hours)', alci_immobilizasyon: 'Immobilising plaster cast', santral_venoz_kateter: 'Central venous access',
  vte_oykusu: 'History of venous thromboembolism', ailede_vte: 'Family history of venous thromboembolism', faktor_v_leiden: 'Factor V Leiden', protrombin_20210a: 'Prothrombin 20210A',
  lupus_antikoagulani: 'Lupus anticoagulant', antikardiyolipin_antikoru: 'Anticardiolipin antibodies', yuksek_homosistein: 'Elevated serum homocysteine', hit: 'Heparin-induced thrombocytopenia', diger_trombofili: 'Other congenital or acquired thrombophilia',
  inme_1ay: 'Stroke (less than 1 month)', elektif_artroplasti: 'Elective major lower-limb arthroplasty', kalca_pelvis_bacak_kirigi: 'Hip, pelvis or leg fracture', akut_omurilik_hasari_1ay: 'Acute spinal cord injury (less than 1 month)',
}

// ───────────────────────── consent: risks and extra procedures ─────────────────────────

export const RISK_ADLARI: S = {
  abdominal_yola_gecis: 'Change to an abdominal operation', agri: 'Pain', agri_suregenligi: 'Pain that continues', agri_yorgunluk: 'Pain and tiredness', akinti: 'Vaginal discharge', asimetri_revizyon: 'Asymmetry and a further operation to correct it',
  bagirsak_mesane_damar_yaralanmasi: 'Damage to the bowel, bladder or a major blood vessel', bagirsak_rezeksiyonu_stoma: 'Removal of part of the bowel, with a temporary or permanent stoma', bagirsak_yaralanmasi: 'Damage to the bowel',
  bebekte_kesi_cizigi: 'A small cut to the baby\'s skin', beklenmeyen_malignite: 'An unexpected cancer found in the tissue', ciddi_kanama: 'Serious bleeding', disparoni: 'Pain during intercourse', disparoni_gecici: 'Temporary pain during intercourse',
  duzensiz_kanama: 'Irregular bleeding', ekspulsiyon: 'The device coming out', ektopik_gebelik: 'Ectopic pregnancy if pregnancy occurs', endometrit: 'Infection of the lining of the womb', enfeksiyon: 'Infection',
  giris_basarisizligi: 'Failure to enter the abdomen or the cavity, so that the procedure cannot be done', hastalik_tekrari: 'The disease coming back', his_degisikligi: 'Change in sensation', histerektomi: 'Removal of the womb (hysterectomy)',
  idrar_sikligi_bosaltim_guclugu: 'Passing urine often, or difficulty emptying the bladder', idrar_yolu_enfeksiyonu: 'Urinary tract infection', intrauterin_yapisiklik: 'Scar tissue inside the womb', kalinti_doku_tekrar_islem: 'Tissue left behind, needing a repeat procedure',
  kanama: 'Bleeding', kanama_hematom: 'Bleeding or a collection of blood (haematoma)', kanama_transfuzyon: 'Bleeding needing a blood transfusion', karin_sislik_agri: 'Abdominal bloating and discomfort', kist_tekrari: 'The cyst coming back', kramp_agri: 'Cramping pain',
  laparotomiye_gecis: 'Change to an open operation (laparotomy)', mesane_disfonksiyonu: 'Problems with bladder function', mesane_ureter_yaralanmasi: 'Damage to the bladder or ureters', myom_tekrari: 'Fibroids coming back',
  olum_cok_nadir: 'Death (very rare)', omuz_agrisi: 'Shoulder-tip pain', ooforektomi: 'Removal of the ovary', over_rezervinde_azalma: 'Reduced ovarian reserve', pelvik_abse_enfeksiyon: 'Pelvic abscess or infection', pelvik_enfeksiyon: 'Pelvic infection',
  rektum_yaralanmasi: 'Damage to the rectum', servikal_darlik: 'Narrowing of the cervix', servikal_yaralanma: 'Damage to the cervix', sislik_agri: 'Swelling and pain', sivi_yuklenmesi: 'Fluid overload from the fluid used to distend the womb',
  sonraki_gebelikte_erken_dogum: 'Preterm birth in a future pregnancy', sonraki_gebelikte_plasenta_anomalisi: 'Placenta praevia or accreta in a future pregnancy', sonraki_gebelikte_ruptur: 'Uterine rupture in a future pregnancy or labour',
  tekrar: 'The problem coming back', tekrar_tedavi: 'Further treatment needed', trokar_yeri_fitigi: 'Hernia at a port site', ureter_yaralanmasi: 'Damage to a ureter', uterus_perforasyonu: 'A hole made in the womb (perforation)',
  vajen_kafi_ayrilmasi: 'Opening of the top of the vagina (vault dehiscence)', vte: 'Blood clots in the legs or lungs', yapisiklik: 'Adhesions (scar tissue)', yara_ayrilmasi: 'Wound opening', yara_enfeksiyonu: 'Wound infection',
  yara_morarma_enfeksiyon: 'Wound bruising or infection', yeniden_ameliyat: 'Return to theatre', yeniden_basvuru: 'Readmission to hospital',
}
export const EK_ISLEM_ADLARI: S = {
  bagirsak_cerrahisi_ayri_onam: 'Bowel surgery (consented separately)', bagirsak_mesane_onarimi: 'Repair of the bowel or bladder', biyopsi: 'Biopsy', cikarma_icin_histeroskopi: 'Hysteroscopy to remove the device',
  ek_eksizyon: 'A further excision', gorulen_hastaligin_tedavisi: 'Treatment of what is found, where agreed beforehand', histerektomi: 'Hysterectomy', islemin_ertelenmesi: 'Stopping and rescheduling the procedure',
  kan_transfuzyonu: 'Blood transfusion', laparoskopi: 'Laparoscopy', laparotomi: 'Laparotomy', laparotomi_veya_laparoskopi: 'Laparotomy or laparoscopy', ooforektomi: 'Removal of the ovary',
  over_tup_cikarilmasi: 'Removal of the ovaries and tubes', revizyon: 'A further operation to revise the result', tekrar_islem: 'A repeat procedure', tup_ligasyonu_ayri_onam: 'Tubal sterilisation (only with separate consent)',
}

export const ISLEM_ADLARI: Record<OnamProseduru, string> = {
  sezaryen: 'Caesarean birth', tlh: 'Total laparoscopic hysterectomy', tah: 'Total abdominal hysterectomy', vajinal_histerektomi: 'Vaginal hysterectomy',
  lap_myomektomi: 'Laparoscopic myomectomy', abdominal_myomektomi: 'Abdominal myomectomy', tanisal_laparoskopi: 'Diagnostic laparoscopy', lap_over_kistektomi: 'Laparoscopic ovarian cystectomy',
  lap_endometriozis: 'Laparoscopic surgery for endometriosis', histeroskopi: 'Hysteroscopy (diagnostic or operative)', dc_kuretaj: 'Dilatation and curettage', vakum_aspirasyon: 'Vacuum aspiration (uterine evacuation)',
  kolposkopi_leep: 'Colposcopy, biopsy and LLETZ', ria: 'Intrauterine device insertion', labioplasti: 'Labiaplasty', perineoplasti: 'Perineoplasty or posterior repair',
}
const ISLEM: Record<OnamProseduru, { aciklama: string; yararlar: string; alternatifler: string; anestezi: string }> = {
  sezaryen: { aciklama: 'Your baby is born through a cut in your abdomen and womb, usually under a spinal or epidural anaesthetic, sometimes under a general anaesthetic.', yararlar: 'A safe and timely birth for you and your baby, for the reason we discussed.', alternatifler: 'Depending on your situation: vaginal birth (including vaginal birth after caesarean), or waiting. We discussed which apply to you.', anestezi: 'Spinal or epidural; general anaesthetic if needed.' },
  tlh: { aciklama: 'Removal of the womb and cervix through keyhole (laparoscopic) surgery. What happens to the ovaries and tubes is discussed separately.', yararlar: 'Treatment of the condition we discussed, through small cuts rather than one large one.', alternatifler: 'Medicines, an intrauterine system, endometrial ablation, myomectomy, vaginal or open hysterectomy, or no treatment.', anestezi: 'General anaesthetic.' },
  tah: { aciklama: 'Removal of the womb through a cut in the abdomen. What happens to the ovaries and tubes is discussed separately.', yararlar: 'Definitive treatment of the condition we discussed.', alternatifler: 'Medicines, an intrauterine system, ablation, myomectomy, laparoscopic or vaginal hysterectomy, or no treatment.', anestezi: 'General anaesthetic, sometimes with a regional block.' },
  vajinal_histerektomi: { aciklama: 'Removal of the womb through the vagina, without a cut in the abdomen.', yararlar: 'Treatment of the condition we discussed, with no abdominal wound.', alternatifler: 'A pessary, pelvic floor exercises, a repair that keeps the womb, laparoscopic or open hysterectomy, or no treatment.', anestezi: 'General or spinal anaesthetic.' },
  lap_myomektomi: { aciklama: 'Removal of fibroids by keyhole surgery, keeping the womb.', yararlar: 'Fewer symptoms from the fibroids; the womb is kept.', alternatifler: 'Medicines, uterine artery embolisation, open myomectomy, hysterectomy, or no treatment.', anestezi: 'General anaesthetic.' },
  abdominal_myomektomi: { aciklama: 'Removal of fibroids through a cut in the abdomen, keeping the womb.', yararlar: 'Fewer symptoms from the fibroids; the womb is kept.', alternatifler: 'Medicines, uterine artery embolisation, laparoscopic myomectomy, hysterectomy, or no treatment.', anestezi: 'General anaesthetic.' },
  tanisal_laparoskopi: { aciklama: 'A camera is passed through small cuts at the navel and lower abdomen to look at the abdomen and pelvis; a biopsy or a dye test may be done.', yararlar: 'Finding the cause of your symptoms; treatment in the same operation where agreed.', alternatifler: 'Monitoring with scans, medicines, or no treatment.', anestezi: 'General anaesthetic.' },
  lap_over_kistektomi: { aciklama: 'Removal of an ovarian cyst by keyhole surgery, keeping the ovary.', yararlar: 'Treatment of the cyst and a tissue diagnosis; the ovary is kept.', alternatifler: 'Monitoring with scans, open surgery, or removal of the ovary.', anestezi: 'General anaesthetic.' },
  lap_endometriozis: { aciklama: 'Removal or destruction of endometriosis and adhesions by keyhole surgery.', yararlar: 'Less pain, help with fertility where relevant, and a tissue diagnosis.', alternatifler: 'Hormonal medicines, pain relief, assisted reproduction, or no treatment.', anestezi: 'General anaesthetic.' },
  histeroskopi: { aciklama: 'A thin camera is passed through the vagina and cervix to look inside the womb; a polyp, fibroid or scar tissue may be removed.', yararlar: 'A direct view inside the womb, with treatment in the same procedure.', alternatifler: 'Ultrasound or saline infusion sonography, endometrial sampling, or no treatment.', anestezi: 'None, local, or general anaesthetic, as discussed.' },
  dc_kuretaj: { aciklama: 'The cervix is gently opened and tissue is taken from inside the womb.', yararlar: 'Tissue for diagnosis, or treatment of bleeding.', alternatifler: 'Outpatient endometrial sampling, hysteroscopy, medicines, or no treatment.', anestezi: 'General or local anaesthetic.' },
  vakum_aspirasyon: { aciklama: 'The pregnancy tissue is removed from the womb with gentle suction.', yararlar: 'The womb is emptied safely.', alternatifler: 'Treatment with medicines, or waiting where that is suitable.', anestezi: 'Local anaesthetic, sedation or general anaesthetic, as discussed.' },
  kolposkopi_leep: { aciklama: 'The cervix is examined with a magnifier; a biopsy may be taken and the abnormal area removed with a thin wire loop.', yararlar: 'Diagnosis and treatment of cell changes, to prevent cancer developing.', alternatifler: 'Monitoring where suitable, or another treatment (cone biopsy, ablation).', anestezi: 'Local anaesthetic, sometimes general.' },
  ria: { aciklama: 'A device is placed inside the womb for contraception or treatment.', yararlar: 'Long-acting, reversible contraception or treatment.', alternatifler: 'Other methods: pill, implant, injection, barrier methods, permanent methods.', anestezi: 'None or local anaesthetic.' },
  labioplasti: { aciklama: 'Surgical reduction or reshaping of the inner labia (labia minora).', yararlar: 'Fewer physical symptoms.', alternatifler: 'No operation, counselling, or waiting.', anestezi: 'Local or general anaesthetic.' },
  perineoplasti: { aciklama: 'Surgical repair of the perineum and the vaginal opening.', yararlar: 'Fewer symptoms from prolapse or birth injury.', alternatifler: 'Pelvic floor exercises, a pessary, or waiting.', anestezi: 'General or spinal anaesthetic.' },
}
const SIKLIK = 'Frequency discussed: ____'
const liste = (k: readonly string[], ad: S) => k.map((x) => `- ${ad[x] ?? x}. ${SIKLIK}`).join('\n')
const IMZALAR = 'Patient (or legal representative): name ____  signature ____  date ____\nInterpreter (if used): name ____  signature ____\nI have explained the procedure, its intended benefits, its serious and frequent risks, any extra procedures that may become necessary, and the alternatives including no treatment. Clinician: name ____  signature ____'
export const ONAM_SABLONLARI: Record<string, S> = Object.fromEntries(ONAM_PROSEDURLERI.map((p) => [p, {
  aciklama: `${ISLEM_ADLARI[p]}. ${ISLEM[p].aciklama}`,
  yararlar: ISLEM[p].yararlar,
  alternatifler: `${ISLEM[p].alternatifler} No treatment is also an option, and you may change your mind at any time before the procedure.`,
  riskler: `Serious risks:\n${liste(ONAM_YAPILARI[p].ciddi, RISK_ADLARI)}\nFrequent risks:\n${liste(ONAM_YAPILARI[p].sik, RISK_ADLARI)}\nRisks particular to you: ____`,
  ek_islemler: `${ONAM_YAPILARI[p].ekIslemler.map((x) => `- ${EK_ISLEM_ADLARI[x] ?? x}`).join('\n')}\nAny procedure you do not want carried out: ____`,
  anestezi: ISLEM[p].anestezi,
  imzalar: IMZALAR,
}]))

const say = (n: number, f: (i: number) => [string, string][]): S => Object.fromEntries(Array.from({ length: n }, (_, i) => f(i + 1)).flat())

export const EN_ARACLAR_6: readonly HamArac[] = [
  {
    anahtar: 'cerrahi-guvenlik-listesi', roller: CERRAHI_ROLLER,
    ad: 'WHO Surgical Safety Checklist',
    aciklama: 'Sign In, Time Out and Sign Out, item by item, with what is still unanswered or answered "no". Printed on your letterhead.',
    alanlar: { tarih: 'Date of the operation', islem: 'Procedure', ...SSC_MADDE_ADLARI, not: 'Notes' },
    secenekler: Object.fromEntries(SSC_ASAMALARI.flatMap((a) => SSC_MADDELERI[a]).map((m) => [m.anahtar, m.na ? EVET_HAYIR_NA : { evet: EVET_HAYIR_NA.evet, hayir: EVET_HAYIR_NA.hayir }])),
    sayilar: { giris_tamam: 'Sign in: items completed', mola_tamam: 'Time out: items completed', cikis_tamam: 'Sign out: items completed' },
    bantlar: { tamam: 'Every phase complete', eksik: 'Not complete yet', hayir_var: 'An item is answered "no": resolve it before proceeding' },
    uyarilar: { giris_eksik: 'Sign in has unanswered items', mola_eksik: 'Time out has unanswered items', cikis_eksik: 'Sign out has unanswered items' },
    tarihler: { tarih: 'Operation' },
    not: 'Source: WHO Surgical Safety Checklist (2009). The checklist supports the team; it does not replace local policy.',
  },
  {
    anahtar: 'caprini', roller: CERRAHI_ROLLER,
    ad: 'Caprini VTE risk score',
    aciklama: 'The 2005 Caprini risk factors with age points, the risk group, and the prophylaxis plan of the CHEST 2012 guideline for the group.',
    alanlar: { yas: 'Age (years)', ...Object.fromEntries(CAPRINI_MADDELERI.map((m) => [m.anahtar, `${CAPRINI_ADLARI[m.anahtar]} (${m.puan})`])), kanama_riski_yuksek: 'Major bleeding is a significant concern', kanser_cerrahisi: 'Abdominal or pelvic cancer surgery' },
    sayilar: { toplam: 'Caprini score', yas_puani: 'Age points' },
    bantlar: { cok_dusuk: 'Very low (score 0)', dusuk: 'Low (score 1 to 2)', orta: 'Moderate (score 3 to 4)', yuksek: 'High (score 5 or more)' },
    uyarilar: {
      erken_mobilizasyon: 'Plan: early ambulation', mekanik_ipc: 'Plan: mechanical prophylaxis, preferably intermittent pneumatic compression',
      farmakolojik: 'Plan: pharmacological prophylaxis (agent and dose by your formulary)', mekanik_ek: 'Plan: add mechanical prophylaxis',
      mekanik_kanama_riski: 'Plan: mechanical prophylaxis while bleeding is a concern; pharmacological once it is not', uzatilmis_4_hafta: 'Plan: extended prophylaxis for 4 weeks after cancer surgery',
    },
    not: `Sources: Caprini, Dis Mon 2005; Gould et al., CHEST 2012. ${DOZSUZ}`,
  },
  {
    anahtar: 'asa-siniflamasi', roller: CERRAHI_ROLLER,
    ad: 'ASA physical status',
    aciklama: 'The ASA class with the emergency modifier, as the anaesthetic record writes it.',
    alanlar: { sinif: 'ASA class', acil: 'Emergency operation' },
    secenekler: { sinif: { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI' } },
    bantlar: { 1: 'ASA I: a normal healthy patient', 2: 'ASA II: mild systemic disease', 3: 'ASA III: severe systemic disease', 4: 'ASA IV: severe systemic disease that is a constant threat to life', 5: 'ASA V: a moribund patient not expected to survive without the operation', 6: 'ASA VI: brain-dead organ donor' },
    uyarilar: { acil: 'E: emergency' },
    not: `Source: American Society of Anesthesiologists, ASA Physical Status Classification System (2020). ${KARAR}`,
  },
  {
    anahtar: 'antibiyotik-profilaksi-kd', roller: KD,
    ad: 'Antibiotic prophylaxis: caesarean and hysterectomy',
    aciklama: 'The prophylactic regimen your country\'s guidance states for caesarean birth, hysterectomy and major gynaecological surgery, by weight, allergy and labour, with the repeat-dose rule.',
    alanlar: { islem: 'Operation', kilo: 'Weight (kg)', eylemde_zar_acik: 'In labour or after rupture of membranes', betalaktam_alerjisi: 'Severe (immediate) beta-lactam allergy', gecen_saat: 'Hours since the first dose (optional)', kan_kaybi: 'Blood loss so far (optional)' },
    secenekler: { islem: { sezaryen: 'Caesarean birth', histerektomi: 'Hysterectomy', buyuk_jinekolojik: 'Other major gynaecological surgery' } },
    sayilar: { sefazolin: 'Cefazolin', azitromisin: 'Azithromycin (added)', klindamisin: 'Clindamycin', gentamisin: 'Gentamicin', metronidazol: 'Metronidazole (added)' },
    uyarilar: {
      ulusal_doz_yok: 'Your national guidance names no agent or dose: use your local formulary and record the regimen in the operation note',
      alerji_rejimi_yok: 'No regimen for beta-lactam allergy is stated in your national guidance: use your local formulary',
      gentamisin_kilo_hekim: 'Gentamicin by weight: check the weight used (actual or adjusted) and renal function',
      yuksek_kilo_dozu: 'The higher weight-based amount applies',
      tekrar_doz_sure: 'Repeat dose due: the interval since the first dose has been reached',
      tekrar_doz_kan: 'Repeat dose due: blood loss is above the stated volume',
    },
    not: `${DOZSUZ} Agents and amounts are your national guidance's, named below for your country.`,
  },
  {
    anahtar: 'iota-basit-kurallar', roller: KD,
    ad: 'IOTA Simple Rules',
    aciklama: 'Five benign and five malignant ultrasound features of an adnexal mass: benign, malignant or inconclusive.',
    alanlar: {
      b1_unilokuler: 'B1 Unilocular cyst', b2_solid_7mm_alti: 'B2 Solid components, largest under 7 mm', b3_akustik_golge: 'B3 Acoustic shadows', b4_duzgun_multilokuler_10cm_alti: 'B4 Smooth multilocular tumour, largest diameter under 100 mm', b5_akim_yok: 'B5 No blood flow (colour score 1)',
      m1_duzensiz_solid: 'M1 Irregular solid tumour', m2_asit: 'M2 Ascites', m3_dort_papiller: 'M3 At least four papillary structures', m4_duzensiz_multilokuler_solid_10cm: 'M4 Irregular multilocular-solid tumour, largest diameter 100 mm or more', m5_cok_guclu_akim: 'M5 Very strong blood flow (colour score 4)',
    },
    sayilar: { b: 'Benign features', m: 'Malignant features' },
    bantlar: { benign: 'Benign', malign: 'Malignant', belirsiz: 'Inconclusive: assess by another method or by an expert examiner' },
    not: `Source: Timmerman et al., Ultrasound Obstet Gynecol 2008 (the IOTA group). ${KARAR}`,
  },
  {
    anahtar: 'rmi', roller: KD,
    ad: 'Risk of Malignancy Index (RMI I)',
    aciklama: 'U x M x CA-125: ultrasound score, menopausal status and serum CA-125, with your country\'s referral cut-off where it states one.',
    alanlar: { multilokuler: 'Multilocular cyst', solid_alan: 'Solid areas', metastaz: 'Metastases', asit: 'Ascites', bilateral: 'Bilateral lesions', postmenopozal: 'Postmenopausal', ca125: 'Serum CA-125' },
    sayilar: { rmi: 'RMI I', u: 'Ultrasound score (U)', m: 'Menopausal score (M)' },
    bantlar: { esik_ustu: 'At or above your national cut-off', esik_alti: 'Below your national cut-off' },
    not: `Source: Jacobs et al., Br J Obstet Gynaecol 1990. ${KARAR}`,
  },
  {
    anahtar: 'palm-coein', roller: KD,
    ad: 'PALM-COEIN and fibroid mapping',
    aciklama: 'The FIGO causes of abnormal uterine bleeding, each fibroid with its FIGO type (0 to 8, hybrids) and size, and a myomectomy planning summary of what the map shows.',
    alanlar: {
      palm_p: 'Polyp', palm_a: 'Adenomyosis', palm_l: 'Leiomyoma', palm_m: 'Malignancy and hyperplasia',
      coein_c: 'Coagulopathy', coein_o: 'Ovulatory dysfunction', coein_e: 'Endometrial', coein_i: 'Iatrogenic', coein_n: 'Not otherwise classified',
      ...say(MYOM_SAYISI, (i) => [[`myom${i}_tip`, `Fibroid ${i}: FIGO type`], [`myom${i}_mm`, `Fibroid ${i}: largest diameter`], [`myom${i}_konum`, `Fibroid ${i}: position`]]),
      not: 'Notes',
    },
    secenekler: Object.fromEntries(Array.from({ length: MYOM_SAYISI }, (_, i) => [`myom${i + 1}_tip`, { 0: '0 Pedunculated intracavitary', 1: '1 Submucous, under 50% intramural', 2: '2 Submucous, 50% or more intramural', 3: '3 Contacts the endometrium, 100% intramural', 4: '4 Intramural', 5: '5 Subserous, 50% or more intramural', 6: '6 Subserous, under 50% intramural', 7: '7 Subserous pedunculated', 8: '8 Other (cervical, parasitic)', '2-5': '2-5 Hybrid', '1-5': '1-5 Hybrid', '2-6': '2-6 Hybrid', '1-6': '1-6 Hybrid' }])),
    sayilar: { P: 'P', A: 'A', L: 'L', M: 'M', C: 'C', O: 'O', E: 'E', I: 'I', N: 'N', myom_sayisi: 'Fibroids mapped', en_buyuk: 'Largest fibroid', submukoz: 'Submucous (types 0 to 2)', intramural: 'Intramural (types 3 and 4)', subseroz: 'Subserous (types 5 to 7)', hibrit: 'Hybrid (transmural)', diger: 'Type 8' },
    bantlar: { l_sm: 'L1(SM): a submucous leiomyoma', l_o: 'L1(O): other leiomyoma' },
    uyarilar: {
      kavite_ile_iliskili: 'The cavity is involved (types 0 to 2): consider the hysteroscopic route', endometriuma_temas: 'A type 3 fibroid: closure may reach the endometrium',
      transmural_hibrit: 'A transmural hybrid fibroid', sapli_subseroz: 'A pedunculated subserous fibroid (type 7)', servikal_veya_parazitik: 'A cervical or parasitic fibroid (type 8)', tipi_bilinmeyen_var: 'A fibroid has no type recorded',
    },
    not: `Source: Munro et al., FIGO, Int J Gynecol Obstet 2011 and 2018. The summary describes the map; the surgical plan is the surgeon's.`,
  },
  {
    anahtar: 'rasrm-endometriozis', roller: KD,
    ad: 'Revised ASRM endometriosis stage',
    aciklama: 'Points for peritoneal and ovarian lesions, adhesions and obliteration of the pouch of Douglas: stage I to IV.',
    alanlar: {
      periton_yuzeyel: 'Peritoneum, superficial', periton_derin: 'Peritoneum, deep',
      over_sag_yuzeyel: 'Right ovary, superficial', over_sag_derin: 'Right ovary, deep', over_sag_film: 'Right ovary, filmy adhesions', over_sag_yogun: 'Right ovary, dense adhesions', tup_sag_film: 'Right tube, filmy adhesions', tup_sag_yogun: 'Right tube, dense adhesions', fimbria_sag_kapali: 'Right fimbriated end completely enclosed',
      over_sol_yuzeyel: 'Left ovary, superficial', over_sol_derin: 'Left ovary, deep', over_sol_film: 'Left ovary, filmy adhesions', over_sol_yogun: 'Left ovary, dense adhesions', tup_sol_film: 'Left tube, filmy adhesions', tup_sol_yogun: 'Left tube, dense adhesions', fimbria_sol_kapali: 'Left fimbriated end completely enclosed',
      douglas: 'Posterior cul-de-sac obliteration',
    },
    secenekler: {
      ...Object.fromEntries(['periton_yuzeyel', 'periton_derin', 'over_sag_yuzeyel', 'over_sag_derin', 'over_sol_yuzeyel', 'over_sol_derin'].map((k) => [k, { 0: 'None', lt1: 'Under 1 cm', '1_3': '1 to 3 cm', gt3: 'Over 3 cm' }])),
      ...Object.fromEntries(['over_sag_film', 'over_sag_yogun', 'tup_sag_film', 'tup_sag_yogun', 'over_sol_film', 'over_sol_yogun', 'tup_sol_film', 'tup_sol_yogun'].map((k) => [k, { 0: 'None', lt13: 'Under 1/3 enclosed', '13_23': '1/3 to 2/3 enclosed', gt23: 'Over 2/3 enclosed' }])),
      douglas: { yok: 'None', kismi: 'Partial', tam: 'Complete' },
    },
    sayilar: { puan: 'Points' },
    bantlar: { I: 'Stage I (minimal, 1 to 5)', II: 'Stage II (mild, 6 to 15)', III: 'Stage III (moderate, 16 to 40)', IV: 'Stage IV (severe, over 40)' },
    not: `Source: American Society for Reproductive Medicine, Fertil Steril 1997. The stage does not predict pain or fertility. ${KARAR}`,
  },
  {
    anahtar: 'enzian', roller: KD,
    ad: '#Enzian classification',
    aciklama: 'Peritoneum, ovaries, tubo-ovarian adhesions, deep compartments A, B, C and other locations, by surgery, ultrasound or MRI.',
    alanlar: { yontem: 'Assessed by', p: 'P: peritoneum', o_sol: 'O: left ovary', o_sag: 'O: right ovary', t_sol: 'T: left tubo-ovarian', t_sag: 'T: right tubo-ovarian', a: 'A: vagina, rectovaginal space', b_sol: 'B: left uterosacral, cardinal ligament, pelvic sidewall', b_sag: 'B: right uterosacral, cardinal ligament, pelvic sidewall', c: 'C: rectum', f_fa: 'FA: adenomyosis', f_fb: 'FB: bladder', f_fu: 'FU: ureter (intrinsic)', f_fi: 'FI: other bowel', f_fo: 'FO: other locations' },
    secenekler: { yontem: { s: 'Surgery (s)', u: 'Ultrasound (u)', m: 'MRI (m)' }, ...Object.fromEntries(['p', 'o_sol', 'o_sag', 't_sol', 't_sag', 'a', 'b_sol', 'b_sag', 'c'].map((k) => [k, { 0: '0', 1: '1', 2: '2', 3: '3', x: 'x (not assessable)' }])) },
    sayilar: { p: 'P', o_sol: 'O left', o_sag: 'O right', t_sol: 'T left', t_sag: 'T right', a: 'A', b_sol: 'B left', b_sag: 'B right', c: 'C' },
    bantlar: { s: '#Enzian(s)', u: '#Enzian(u)', m: '#Enzian(m)' },
    uyarilar: { degerlendirilemeyen: 'A compartment could not be assessed (x)', f_fa: 'FA: adenomyosis', f_fb: 'FB: bladder', f_fu: 'FU: ureter', f_fi: 'FI: other bowel', f_fo: 'FO: other locations' },
    not: `Source: Keckstein et al., Acta Obstet Gynecol Scand 2021. ${KARAR}`,
  },
  {
    anahtar: 'bishop', roller: KD,
    ad: 'Bishop score',
    aciklama: 'Dilatation, effacement, station, consistency and position of the cervix, with your country\'s threshold for a favourable cervix where it states one.',
    alanlar: { aciklik: 'Dilatation', silinme: 'Effacement', istasyon: 'Station', kivam: 'Consistency', pozisyon: 'Position' },
    secenekler: {
      aciklik: { kapali: 'Closed', '1_2': '1 to 2 cm', '3_4': '3 to 4 cm', '5_ustu': '5 cm or more' }, silinme: { '0_30': '0 to 30%', '40_50': '40 to 50%', '60_70': '60 to 70%', '80_ustu': '80% or more' },
      istasyon: { eksi3: '-3', eksi2: '-2', eksi1_0: '-1 or 0', arti1_2: '+1 or +2' }, kivam: { sert: 'Firm', orta: 'Medium', yumusak: 'Soft' }, pozisyon: { posterior: 'Posterior', orta: 'Mid', anterior: 'Anterior' },
    },
    sayilar: { toplam: 'Bishop score' },
    bantlar: { uygun: 'Favourable by your national threshold', uygun_degil: 'Unfavourable by your national threshold' },
    not: `Source: Bishop, Obstet Gynecol 1964. ${KARAR}`,
  },
  {
    anahtar: 'robson', roller: KD,
    ad: 'Robson Ten-Group Classification',
    aciklama: 'The Robson group of a birth from parity, previous caesarean, number of fetuses, presentation, gestation and onset of labour.',
    alanlar: { parite: 'Parity', onceki_sezaryen: 'Previous caesarean birth', fetus: 'Number of fetuses', prezentasyon: 'Presentation', hafta: 'Gestation (completed weeks)', eylem: 'Onset of labour' },
    secenekler: { parite: { nullipar: 'Nulliparous', multipar: 'Multiparous' }, fetus: { tekil: 'Single', cogul: 'Multiple' }, prezentasyon: { bas: 'Cephalic', makat: 'Breech', transvers: 'Transverse or oblique' }, eylem: { spontan: 'Spontaneous', induksiyon: 'Induced', eylem_oncesi_sezaryen: 'Caesarean before labour' } },
    sayilar: { grup: 'Robson group' },
    bantlar: { a: 'Subgroup a: induced', b: 'Subgroup b: caesarean before labour' },
    not: 'Source: WHO, Robson Classification: Implementation Manual (2017). A classification for audit, not a recommendation.',
  },
  {
    anahtar: 'sezaryen-aciliyeti', roller: KD,
    ad: 'Caesarean urgency and decision-to-birth interval',
    aciklama: 'The urgency category (1 to 4) and the decision-to-birth interval against your country\'s target where it states one. Printed on your letterhead.',
    alanlar: { tarih: 'Date', kategori: 'Urgency category', karar_saati: 'Time of the decision (HH:MM)', dogum_saati: 'Time of birth (HH:MM)', not: 'Notes' },
    secenekler: { kategori: { 1: '1: immediate threat to the life of the woman or fetus', 2: '2: maternal or fetal compromise, not immediately life-threatening', 3: '3: no compromise, needs early birth', 4: '4: at a time to suit the woman and the team' } },
    sayilar: { gecen_dk: 'Decision-to-birth interval', hedef_dk: 'Your national target' },
    bantlar: { hedef_icinde: 'Within the target', hedef_asildi: 'Beyond the target: record the reason' },
    uyarilar: { saat_gecersiz: 'A time is not in the form HH:MM' },
    tarihler: { tarih: 'Birth' },
    not: 'Source: Lucas et al., J R Soc Med 2000 (the four categories). The interval is an audit standard; the decision is the clinician\'s.',
  },
  {
    anahtar: 'kanama-izlem', roller: KD,
    ad: 'Blood loss, shock index and the haemorrhage bundle',
    aciklama: 'Measured blood loss from weighed swabs and collected volume (amniotic fluid taken off), the shock index, the stage by your country\'s thresholds, and the bundle steps done.',
    alanlar: { islak_g: 'Weight of the soaked swabs', kuru_g: 'Dry weight of the same swabs', kanister_ml: 'Volume in the suction or drape', amniyon_ml: 'Amniotic fluid in that volume', tahmini_ml: 'Estimated loss (when not measured)', nabiz: 'Heart rate (bpm)', sistolik: 'Systolic blood pressure', olcum: 'Blood loss measured, not estimated', masaj: 'Uterine massage', uterotonik: 'Uterotonic given', traneksamik_asit: 'Tranexamic acid given', iv_sivi: 'Intravenous fluids', muayene_eskalasyon: 'Examined for the cause; help called' },
    sayilar: { kan_kaybi: 'Blood loss', sok_indeksi: 'Shock index', evre: 'Stage by your national thresholds' },
    bantlar: { normal: 'Shock index below 0.9', esik_0_9: 'Shock index 0.9 or more', esik_1_4: 'Shock index 1.4 or more: urgent intervention', esik_1_7: 'Shock index 1.7 or more: an adverse outcome is more likely' },
    uyarilar: { olculmedi_tahmin: 'The loss is estimated, not measured' },
    not: 'Sources: shock index thresholds, El Ayadi, Nathan et al., PLoS ONE 2016; postpartum haemorrhage definition and bundle, WHO recommendations (2023). Medicines and doses are the clinician\'s.',
  },
  {
    anahtar: 'histeroskopi-sivi', roller: KD,
    ad: 'Hysteroscopy fluid deficit',
    aciklama: 'Fluid in and out at each reading, the running deficit, and how close it is to the limit for the medium and the patient.',
    alanlar: { ortam: 'Distension medium', riskli: 'Older patient or with comorbidity (lower limit)', ...say(OLCUM_SAYISI, (i) => [[`o${i}_saat`, `Reading ${i}: time`], [`o${i}_giren`, `Reading ${i}: fluid in (cumulative)`], [`o${i}_cikan`, `Reading ${i}: fluid out (cumulative)`]]) },
    secenekler: { ortam: { hipotonik: 'Hypotonic, electrolyte-poor (e.g. glycine, sorbitol)', izotonik: 'Isotonic, electrolyte-rich (e.g. saline)' } },
    sayilar: { acik: 'Fluid deficit', sinir: 'Limit', yuzde: 'Of the limit' },
    bantlar: { sinir_alti: 'Below the limit', sinira_yakin: '75% of the limit or more: prepare to stop', sinir_asildi: 'Limit reached: stop the procedure and assess' },
    not: `Source: AAGL Practice Guidelines for the Management of Hysteroscopic Distending Media (2013). ${KARAR}`,
  },
  {
    anahtar: 'eras-kd', roller: KD,
    ad: 'ERAS checklist: gynaecology and caesarean birth',
    aciklama: 'The ERAS Society elements for gynaecological and oncology surgery or for caesarean birth, ticked as they are done.',
    alanlar: {
      liste: 'Pathway',
      preop_bilgilendirme: 'Pre-operative information and counselling', sigara_alkol_birakma: 'Smoking and alcohol cessation', anemi_degerlendirme: 'Anaemia assessed and treated', kati_6s_sivi_2s: 'Fasting: solids up to 6 h, clear fluids up to 2 h', karbonhidrat_yukleme: 'Carbohydrate loading',
      rutin_bagirsak_hazirligi_yok: 'No routine bowel preparation', uzun_etkili_sedatif_yok: 'No long-acting sedatives', vte_profilaksisi: 'VTE prophylaxis', antibiyotik_ve_klorheksidin_alkol: 'Antibiotic prophylaxis and chlorhexidine-alcohol skin preparation', bulanti_kusma_profilaksisi: 'Nausea and vomiting prophylaxis',
      kisa_etkili_anestezi: 'Short-acting anaesthesia', normotermi: 'Normothermia', hedefe_yonelik_sivi: 'Goal-directed fluids', minimal_invaziv_tercih: 'Minimally invasive approach where possible', rutin_nazogastrik_ve_dren_yok: 'No routine nasogastric tube or drains',
      opioid_koruyucu_multimodal_analjezi: 'Opioid-sparing multimodal analgesia', erken_beslenme_24s: 'Early feeding (within 24 h)', glukoz_kontrolu: 'Glucose control', erken_sonda_cikarma_24s: 'Early catheter removal (within 24 h)', erken_mobilizasyon: 'Early mobilisation', uyum_denetimi: 'Audit of how the pathway was followed',
      antenatal_bilgilendirme: 'Antenatal information', karbonhidrat_icecegi: 'Carbohydrate drink', antibiyotik_insizyon_oncesi: 'Antibiotic before the skin incision', klorheksidin_alkol_cilt: 'Chlorhexidine-alcohol skin preparation', eylemde_vajinal_hazirlik: 'Vaginal preparation in labour',
      normovolemi: 'Normovolaemia', rejyonel_anestezi: 'Regional anaesthesia', gecikmis_kordon_klempi: 'Delayed cord clamping', ten_tene_temas: 'Skin-to-skin contact', erken_oral_alim: 'Early oral intake', erken_sonda_cikarma: 'Early catheter removal', vte_risk_degerlendirmesi: 'VTE risk assessment', taburculuk_planlamasi: 'Discharge planning',
    },
    secenekler: { liste: { jinekolojik: 'Gynaecology and oncology surgery', sezaryen: 'Caesarean birth' } },
    sayilar: { yapilan: 'Elements done' },
    not: 'Sources: ERAS Society, Nelson et al., Int J Gynecol Cancer 2019; Wilson, Caughey, Macones et al., ERAS caesarean guidelines 2018 to 2019. Local protocols apply.',
  },
  {
    anahtar: 'onam-formu-kd', roller: KD,
    ad: 'Procedure consent form',
    aciklama: 'A consent form for an obstetric or gynaecological operation: what it is, its benefits, its serious and frequent risks, extra procedures that may be needed, the alternatives and the signatures. Choose the operation to pre-fill it, then complete it with the patient. Printed on your letterhead.',
    alanlar: { tarih: 'Date', islem: 'Operation (pre-fills the form; every word can be edited)', aciklama: 'The procedure', yararlar: 'Intended benefits', alternatifler: 'Alternatives, including no treatment', riskler: 'Serious and frequent risks', ek_islemler: 'Extra procedures that may become necessary', anestezi: 'Anaesthesia', imzalar: 'Signatures', konusulanlar: 'Questions asked and what was discussed', yazili_bilgi: 'Written information given', sorular_yanitlandi: 'The patient\'s questions were answered', tercuman: 'An interpreter was used' },
    secenekler: { islem: ISLEM_ADLARI },
    uyarilar: { yazili_bilgi_yok: 'Written information not recorded as given', sorular_bekliyor: 'Not recorded that the patient\'s questions were answered' },
    tarihler: { tarih: 'Consent' },
    sablonlar: { islem: ONAM_SABLONLARI },
    not: 'Consent is a conversation: the form records it. Risk frequencies are the clinician\'s to discuss and write for this patient.',
  },
]
