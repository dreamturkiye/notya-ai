/**
 * AMELIYAT-NOTU-01 / KD-RAPOR-01 (Kaan, 2026-11-05) — THE ENGLISH LANGUAGE SET: ROLE TOOLS, fifth part. The operation
 * note (every surgical role), and for obstetrics and gynaecology: the operation note with pre-filled standard steps,
 * the obstetric and gynaecological ultrasound reports and the delivery discharge summary. Printed on the doctor's
 * letterhead (kit: `yazdirilir`). The CTG classification is NOT here: each country brings its own national one.
 *
 * MACHINE-WRITTEN. AWAITS CLINICAL REVIEW IN EACH COUNTRY. Written in en-GB spelling.
 *
 * THE PRE-FILLED STEPS (`sablonlar`) are a generic sequence the surgeon corrects to what was done. They write NO dose,
 * NO pressure, NO size, NO count: every number is the surgeon's, left as "__". Each operation names the published
 * references its sequence follows; none reproduces a guideline's text. Hymenoplasty is not offered (WHO/OHCHR/UN Women,
 * "Eliminating virginity testing", 2018; an offence in the United Kingdom under the Health and Care Act 2022, s.149).
 */
import type { HamArac } from './yardimci'

const CERRAHI_ROLLER = ['general-surgery', 'obstetrics-gynaecology', 'orthopaedics', 'urology', 'otolaryngology', 'ophthalmology', 'neurosurgery', 'cardiovascular-surgery', 'thoracic-surgery', 'plastic-surgery', 'paediatric-surgery', 'hair-transplant', 'aesthetic-surgery'] as const
const KD = ['obstetrics-gynaecology'] as const

const NOT_ALANLARI: Readonly<Record<string, string>> = {
  tarih: 'Date of the operation', saat: 'Start and finish time', aciliyet: 'Elective or emergency',
  preop_tani: 'Pre-operative diagnosis', postop_tani: 'Post-operative diagnosis', islem: 'Procedure performed',
  cerrah: 'Operating surgeon', asistanlar: 'Assistant(s)', anestezi: 'Anaesthesia', anestezist: 'Anaesthetist',
  endikasyon: 'Indication', bulgular: 'Operative findings', teknik: 'Technique and steps (incision, any extra procedure and why)',
  patoloji: 'Tissue sent for histology', patoloji_materyal: 'Specimen(s) sent',
  kan_kaybi: 'Estimated blood loss', sivi: 'Fluids and transfusion', drenler: 'Drain(s)', komplikasyon: 'Complications',
  implantlar: 'Implants and materials (with serial numbers)', kapanis: 'Closure', antibiyotik: 'Antibiotic prophylaxis',
  vte: 'VTE prophylaxis', postop: 'Post-operative instructions',
}
const NOT_SECENEKLERI: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  aciliyet: { elektif: 'Elective', acil: 'Emergency' },
  anestezi: { genel: 'General', spinal: 'Spinal', epidural: 'Epidural', kombine: 'Combined spinal-epidural', rejyonel_blok: 'Regional block', sedasyon: 'Sedation', lokal: 'Local' },
  patoloji: { gonderildi: 'Sent', gonderilmedi: 'Not sent' },
}
const NOT_ACIKLAMA = 'A structured operation note: date and time, team, anaesthesia, diagnoses, findings, steps, specimens, blood loss, drains, complications, implants, closure and post-operative instructions. Complete when every required item is filled. Printed on your letterhead.'
const NOT_NOTU = 'The note is the surgeon\'s record. Kept in the patient\'s file, it does not change: a correction is a new note.'

// ───────────────────────── pre-filled standard steps (obstetrics and gynaecology) ─────────────────────────

const adim = (satirlar: string[]) => satirlar.map((s, i) => `${i + 1}. ${s}`).join('\n')
const LAP = [
  'General anaesthesia, lithotomy position; skin preparation, draping, urinary catheter.',
  'Uterine manipulator placed if required.',
  'Entry: __ (Veress / open Hasson / optical trocar) at __; pneumoperitoneum established; primary port placed.',
  'Secondary ports under direct vision: __.',
  'Inspection of the abdomen and pelvis (upper abdomen, liver surface, appendix, uterus, adnexa, pouch of Douglas, peritoneum): findings above.',
]
const LAP_KAPAMA = 'Haemostasis checked at low intra-abdominal pressure; irrigation and suction. Swab and instrument counts correct. Ports removed under vision, gas released. Fascia of ports of 10 mm or more closed as the surgeon decides; skin closed with __.'
const POSTOP = 'Observations, pain and bleeding. Early mobilisation. Oral intake as the surgeon decides. VTE prophylaxis by risk assessment. Catheter removal: __. Discharge and follow-up: __.'

const ADIMLAR: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  sezaryen: {
    teknik: adim(['Supine with left lateral tilt; skin preparation, draping, urinary catheter.', 'Prophylactic antibiotic given before the skin incision (agent and time below).', 'Skin incision: __ (Pfannenstiel / Joel-Cohen).', 'Fascia opened, rectus muscles separated, peritoneum opened.', 'Bladder reflected if required.', 'Transverse lower-segment uterine incision, blunt extension.', 'Baby delivered __ (presentation) at __ (time); sex __, weight __ g, Apgar __ / __. Cord clamping: __.', 'Placenta delivered by controlled cord traction and checked complete; cavity checked.', 'Uterotonic: written by the clinician (agent and dose are not written by the tool).', 'Uterine incision closed in __ layer(s); haemostasis checked.', 'Adnexa inspected: __.', 'Swab and instrument counts correct.']),
    kapanis: 'Fascia closed with __; subcutaneous layer __; skin closed with __.',
    postop: 'Observations, uterine tone and vaginal bleeding. Support for early breastfeeding and skin-to-skin contact. Early mobilisation. VTE prophylaxis by risk assessment. Catheter removal: __. Postnatal care and discharge: __.',
  },
  vakum_aspirasyon: {
    endikasyon: '__ (missed miscarriage / incomplete miscarriage / termination within the legal limit of this country). Gestation confirmed by ultrasound: __. Consent recorded.',
    teknik: adim(['Lithotomy position; skin preparation and draping.', 'Bimanual examination: uterine size and position __.', 'Speculum; cervix grasped with a tenaculum.', 'Cervical preparation / dilatation: __ (as the clinician decides).', 'Vacuum aspiration with a cannula of suitable size: __ (manual / electric).', 'Emptying of the cavity confirmed (gritty sensation, uterine contraction).', 'Aspirate inspected: pregnancy tissue __ (seen / not seen).', 'Bleeding checked; instruments removed.']),
    kapanis: 'Procedure ended after the bleeding was checked.',
    postop: 'Observations and bleeding. Anti-D if Rh negative, as the clinician decides. Contraception discussed (methods that can start straight away). Follow-up: __. Told to return with fever, severe pain, heavy bleeding or offensive discharge.',
  },
  tlh: {
    teknik: adim([...LAP, 'Both ureters identified along their pelvic course.', 'Round ligaments sealed and divided; broad ligament opened.', 'Adnexa: __ (ovaries conserved: utero-ovarian ligament and tube / salpingo-oophorectomy: infundibulopelvic ligament) sealed and divided.', 'Vesicouterine peritoneum opened, bladder dissected down off the cervix and vagina.', 'Uterine vessels isolated, sealed and divided.', 'Colpotomy over the manipulator cup; uterus delivered vaginally (morcellation: __ not done / contained).', 'Vaginal vault closed __ (laparoscopically / vaginally); uterosacral support: __.', 'Cystoscopy: __ (done / not done).']),
    kapanis: LAP_KAPAMA,
    postop: `${POSTOP} Restrictions on intercourse and heavy lifting: as the surgeon decides.`,
  },
  tah: {
    teknik: adim(['General or regional anaesthesia, supine; skin preparation, draping, urinary catheter.', 'Skin incision: __ (Pfannenstiel / lower midline).', 'Fascia opened, rectus muscles separated, peritoneum opened; retractor placed, bowel packed.', 'Inspection of the abdomen and pelvis: findings above.', 'Round ligaments clamped, divided and ligated; broad ligament opened.', 'Adnexal pedicles __ (utero-ovarian / infundibulopelvic) clamped, divided and double-ligated.', 'Bladder reflected; course of the ureters protected.', 'Uterine vessels isolated, clamped, divided and ligated.', 'Cardinal and uterosacral ligaments clamped, divided and ligated.', 'Vagina opened, uterus removed with the cervix; vault closed with __, angles secured to the uterosacral ligaments.', 'Haemostasis checked; lavage. Swab and instrument counts correct.']),
    kapanis: 'Peritoneum __; fascia closed with __; subcutaneous layer __; skin closed with __.',
    postop: POSTOP,
  },
  vajinal_histerektomi: {
    teknik: adim(['Regional or general anaesthesia, lithotomy; skin preparation, draping, urinary catheter.', 'Cervix grasped; circumferential incision at the cervicovaginal junction.', 'Posterior colpotomy into the pouch of Douglas, anterior colpotomy into the vesicouterine space; bladder advanced.', 'Uterosacral and cardinal ligaments clamped, divided and ligated (uterosacrals tagged).', 'Uterine vessels clamped, divided and ligated.', 'Fundus delivered; utero-ovarian pedicles clamped, divided and double-ligated. Adnexa: __.', 'Haemostasis checked; peritoneum __.', 'Apical support: uterosacral ligaments attached to the vault (McCall / __).', 'Vaginal vault closed with __.']),
    kapanis: 'Vaginal vault closed; vaginal pack: __ (placed, removal at __ / not placed).',
    postop: POSTOP,
  },
  lap_myomektomi: {
    teknik: adim([...LAP, 'Fibroid(s): number __, site __ (FIGO type __), size __.', 'Vasoconstrictor infiltration: __ (as the surgeon decides).', 'Serosal incision; fibroid enucleated along its capsule.', 'Cavity entered: __ (yes / no).', 'Myometrium closed in __ layer(s) without dead space.', 'Removal of the fibroid(s): __ (contained morcellation / mini-laparotomy / colpotomy).', 'Adhesion barrier: __.']),
    kapanis: LAP_KAPAMA,
    postop: `${POSTOP} Advice on the mode of a future birth and the interval to pregnancy: as the surgeon decides (cavity entry recorded above).`,
  },
  abdominal_myomektomi: {
    teknik: adim(['General or regional anaesthesia, supine; skin preparation, draping, urinary catheter.', 'Skin incision: __; fascia and peritoneum opened.', 'Fibroid(s): number __, site __ (FIGO type __), size __.', 'Blood-loss reduction: __ (vasoconstrictor / tourniquet, as the surgeon decides).', 'Serosal incision; fibroid(s) enucleated along the capsule.', 'Cavity entered: __ (yes / no).', 'Myometrium closed in __ layer(s); serosa closed.', 'Adhesion barrier: __. Haemostasis checked; counts correct.']),
    kapanis: 'Peritoneum __; fascia __; subcutaneous layer __; skin closed with __.',
    postop: `${POSTOP} Advice on the mode of a future birth and the interval to pregnancy: as the surgeon decides.`,
  },
  tanisal_laparoskopi: {
    teknik: adim([...LAP, 'Dye test (chromopertubation): __ (right __ / left __; not done).', 'Biopsy: __.']),
    kapanis: LAP_KAPAMA,
    postop: POSTOP,
  },
  lap_over_kistektomi: {
    teknik: adim([...LAP, 'Cyst: side __, size __, appearance __ (smooth surface, no papillary projections, no ascites, as the surgeon confirms). Peritoneal washings: __.', 'Incision in the ovarian cortex; cyst wall stripped from healthy ovarian tissue (rupture: __).', 'Cyst removed in an endoscopic bag.', 'Haemostasis of the ovarian bed: __ (suture / haemostatic agent; bipolar energy kept to a minimum to protect the ovary).']),
    kapanis: LAP_KAPAMA,
    postop: `${POSTOP} Review with the histology: __.`,
  },
  lap_endometriozis: {
    teknik: adim([...LAP, 'Endometriosis map: peritoneum __, ovaries __, uterosacral ligaments __, pouch of Douglas __, bowel / bladder __. Stage (rASRM / #Enzian): __.', 'Ureters identified; retroperitoneum opened where needed.', 'Lesions __ (excised / ablated).', 'Endometrioma: __ (stripping cystectomy, removed in a bag).', 'Adhesiolysis: __.']),
    kapanis: LAP_KAPAMA,
    postop: `${POSTOP} Post-operative hormonal treatment: as the clinician decides.`,
  },
  histeroskopi: {
    teknik: adim(['Anaesthesia __; lithotomy position; skin preparation, draping.', 'Cervix dilated if required; hysteroscope advanced under vision.', 'Distension medium: __; fluid deficit monitored (recorded: __).', 'Cavity: shape __, endometrium __, tubal ostia __ (right / left seen).', 'Operative procedure: __ (device: __).']),
    kapanis: 'Final inspection of the cavity; instruments removed; bleeding checked.',
    postop: 'Observations and bleeding. Pain relief. Review with the histology: __.',
  },
  dc_kuretaj: {
    teknik: adim(['Anaesthesia __; lithotomy position; skin preparation, draping.', 'Bimanual examination: uterine size and position __.', 'Speculum, tenaculum; uterine sounding: __.', 'If fractional: endocervical curettage first, sent separately.', 'Cervix dilated to __.', 'Systematic curettage of the cavity.']),
    kapanis: 'Instruments removed after the bleeding was checked.',
    postop: 'Observations and bleeding. Review with the histology: __.',
  },
  kolposkopi_leep: {
    endikasyon: '__ (cytology / HPV result and date).',
    teknik: adim(['Lithotomy position; speculum.', 'Acetic acid applied; squamocolumnar junction __ (fully / partly / not seen), transformation zone type __.', 'Iodine: __.', 'Findings (IFCPC terminology): __.', 'Biopsy: __ (at __ o\'clock) / endocervical curettage: __.', 'LLETZ / LEEP: local anaesthetic; excision with a loop of suitable size in one / __ piece(s); depth __; margins marked.', 'Haemostasis: __.']),
    kapanis: 'Bleeding checked.',
    postop: 'Told about bleeding and discharge. Restrictions on intercourse and tampons: as the clinician decides. Review with the histology: __.',
  },
  ria: {
    endikasyon: 'Contraception ± __. Medical eligibility (WHO MEC) assessed: __. Pregnancy excluded: __.',
    teknik: adim(['Consent recorded.', 'Bimanual examination: uterine position __.', 'Speculum; cervical cleansing; tenaculum.', 'Uterine sounding: __ cm.', 'Device placed at the fundus as the manufacturer instructs.', 'Threads cut leaving __ cm.', 'Position checked: __ (ultrasound / clinically).']),
    kapanis: 'Instruments removed; bleeding checked.',
    postop: 'Thread check taught. Review: __ (after the first period). Told to return with severe abdominal pain, fever, offensive discharge, threads not felt or a possible pregnancy. Replacement date: __.',
  },
  labioplasti: {
    endikasyon: '__ (functional symptoms / cosmetic request). Counselling and expectations recorded; aged 18 or over; consent recorded.',
    teknik: adim(['Anaesthesia __; lithotomy position; skin preparation, draping.', 'Resection margins marked symmetrically on both sides.', 'Local infiltration: __ (as the surgeon decides).', 'Marked tissue removed by __ technique; clitoral hood and frenulum preserved.', 'Haemostasis __.']),
    kapanis: 'Mucosal edges closed with absorbable sutures __.',
    postop: 'Cold compresses and hygiene advice. Restrictions on intercourse and tampons: as the surgeon decides. Review: __. Told to return with increasing swelling, bleeding, fever or discharge.',
  },
  perineoplasti: {
    endikasyon: '__ (POP-Q stage __ / symptoms of vaginal laxity). Consent recorded.',
    teknik: adim(['Anaesthesia __; lithotomy position; skin preparation, draping, urinary catheter.', 'Perineal / vaginal mucosal incision __; mucosa dissected off the underlying fascia.', 'Plication of the rectovaginal / vesicovaginal fascia with __ (rectal / bladder integrity preserved; rectal examination: __).', 'Excess mucosa excised.', 'Perineal body muscles re-approximated with __.']),
    kapanis: 'Vaginal mucosa and perineal skin closed with absorbable sutures; vaginal pack: __.',
    postop: `${POSTOP} Avoid constipation; restrictions on heavy lifting and intercourse: as the surgeon decides.`,
  },
}

// ───────────────────────── delivery discharge summary: pre-filled advice by the mode of birth ─────────────────────────

const TALIMAT_GENEL = 'Bleeding (lochia) settles and gets lighter over the coming weeks. Keep the perineum or wound clean and dry. Feed your baby often, as the baby wants; ask for help with feeding if you need it. Drink plenty, eat fibre, avoid constipation. Keep moving; avoid long periods without moving. Tell your midwife, health visitor or doctor about low mood, sleeplessness or worry. Returning to intercourse, driving, lifting and exercise is discussed at your postnatal check.'
const TALIMAT_CS = 'Caesarean wound: dressing and removal of sutures or clips as your team tells you; report redness, discharge or opening of the wound. Avoid straining and heavy lifting. Return to driving when you can do an emergency stop without pain; ask your doctor.'
const KONTRASEPSIYON = 'Contraception discussed. Methods and the earliest time to start them depend on breastfeeding and on the mode of birth (WHO Medical eligibility criteria for contraceptive use): __.'
const TEHLIKE = 'Return to hospital or call the emergency number at once with: heavy vaginal bleeding or large clots; fever or shivering; offensive discharge or severe abdominal pain; severe headache, blurred vision or a seizure; breathlessness or chest pain; a painful swollen leg on one side; redness, discharge or opening of a wound; a painful red breast with fever; burning on passing urine or being unable to pass urine; thoughts of harming yourself or your baby.'
const EPIKRIZ_SABLONU: Readonly<Record<string, Readonly<Record<string, string>>>> = Object.fromEntries(
  ['vajinal', 'mudahaleli', 'cs_elektif', 'cs_acil', 'vbac'].map((k) => [k, { talimatlar: k.startsWith('cs_') ? `${TALIMAT_GENEL}\n${TALIMAT_CS}` : TALIMAT_GENEL, kontrasepsiyon: KONTRASEPSIYON, tehlike: TEHLIKE }]),
)

export const EN_ARACLAR_5: readonly HamArac[] = [
  {
    anahtar: 'ameliyat-notu', roller: CERRAHI_ROLLER,
    ad: 'Operation note',
    aciklama: NOT_ACIKLAMA,
    alanlar: NOT_ALANLARI,
    secenekler: NOT_SECENEKLERI,
    tarihler: { tarih: 'Operation' },
    not: NOT_NOTU,
  },
  {
    anahtar: 'ameliyat-notu-kd', roller: KD,
    ad: 'Operation note: obstetrics and gynaecology',
    aciklama: `${NOT_ACIKLAMA} Choose the operation to pre-fill its standard steps, then correct them to what was done.`,
    alanlar: { sablon: 'Operation (pre-fills the standard steps; every word can be edited)', ...NOT_ALANLARI },
    secenekler: {
      sablon: {
        sezaryen: 'Caesarean birth (lower-segment)', tlh: 'Total laparoscopic hysterectomy', tah: 'Total abdominal hysterectomy', vajinal_histerektomi: 'Vaginal hysterectomy',
        lap_myomektomi: 'Laparoscopic myomectomy', abdominal_myomektomi: 'Abdominal myomectomy', tanisal_laparoskopi: 'Diagnostic laparoscopy', lap_over_kistektomi: 'Laparoscopic ovarian cystectomy',
        lap_endometriozis: 'Laparoscopic surgery for endometriosis', histeroskopi: 'Hysteroscopy (diagnostic / operative)', dc_kuretaj: 'Dilatation and curettage', vakum_aspirasyon: 'Vacuum aspiration (uterine evacuation)',
        kolposkopi_leep: 'Colposcopy with biopsy / LLETZ', ria: 'Intrauterine device insertion', labioplasti: 'Labiaplasty', perineoplasti: 'Perineoplasty / colporrhaphy',
      },
      ...NOT_SECENEKLERI,
    },
    tarihler: { tarih: 'Operation' },
    sablonlar: { sablon: ADIMLAR },
    not: `${NOT_NOTU} The pre-filled steps are a generic sequence after published surgical and college guidance, named on the operation in the record of this tool; they write no dose and no number.`,
  },
  {
    anahtar: 'usg-obstetrik', roller: KD,
    ad: 'Obstetric ultrasound report',
    aciklama: 'Biometry with INTERGROWTH-21st centiles, estimated fetal weight (Hadlock), liquor (AFI and deepest pool), placenta, presentation, fetal heart rate, Doppler with MCA-PSV in multiples of the median and the cerebroplacental ratio, nuchal translucency and anatomy. Printed on your letterhead.',
    alanlar: {
      tarih: 'Date of the scan', hafta: 'Gestation (completed weeks)', gun: 'and days (0 to 6)', fetus: 'Number of fetuses',
      crl: 'Crown-rump length', bpd: 'Biparietal diameter', hc: 'Head circumference', ac: 'Abdominal circumference', fl: 'Femur length',
      afi: 'Amniotic fluid index', dvp: 'Deepest vertical pool', plasenta: 'Placenta (site, appearance)', prezentasyon: 'Presentation', fkh: 'Fetal heart rate (bpm)',
      ua_pi: 'Umbilical artery PI', ua_ri: 'Umbilical artery RI', ua_edf: 'Umbilical artery end-diastolic flow', mca_pi: 'Middle cerebral artery PI', mca_psv: 'Middle cerebral artery PSV',
      ut_pi_sag: 'Uterine artery PI, right', ut_pi_sol: 'Uterine artery PI, left', nt: 'Nuchal translucency', anatomi: 'Anatomy', sonuc: 'Conclusion (the clinician\'s)',
    },
    secenekler: {
      prezentasyon: { sefalik: 'Cephalic', makat: 'Breech', transvers: 'Transverse', oblik: 'Oblique', degisken: 'Variable' },
      ua_edf: { var: 'Present', yok: 'Absent', ters: 'Reversed' },
    },
    sayilar: { bpd_p: 'BPD centile', hc_p: 'HC centile', ac_p: 'AC centile', fl_p: 'FL centile', efw: 'Estimated fetal weight', mca_mom: 'MCA-PSV, multiples of the median', cpr: 'Cerebroplacental ratio', ut_ort_pi: 'Mean uterine artery PI (no centile table: as measured)' },
    uyarilar: {
      afi_oligo: 'AFI 5 cm or less (oligohydramnios range)', afi_poli: 'AFI 24 cm or more (polyhydramnios range)', dvp_oligo: 'Deepest pool below 2 cm', dvp_poli: 'Deepest pool 8 cm or more',
      mca_anemi: 'MCA-PSV 1.5 MoM or more: the published threshold for moderate to severe fetal anaemia', cpr_dusuk: 'CPR below 1.08 (the cut-off of Gramellini 1992)',
      ua_edf_yok: 'Absent end-diastolic flow in the umbilical artery', ua_edf_ters: 'Reversed end-diastolic flow in the umbilical artery',
      fkh_dusuk: 'Fetal heart rate below 110 bpm', fkh_yuksek: 'Fetal heart rate above 160 bpm', nt_esik: 'Nuchal translucency 3.5 mm or more',
      biyometri_dusuk: 'A biometric measurement is below the 10th centile', biyometri_yuksek: 'A biometric measurement is above the 90th centile',
    },
    not: 'The numbers follow published references; the interpretation and the diagnosis are the clinician\'s.',
  },
  {
    anahtar: 'usg-jinekolojik', roller: KD,
    ad: 'Gynaecological ultrasound report',
    aciklama: 'Uterus, endometrium, ovaries and up to two lesions, with uterine and ovarian volumes and the postmenopausal endometrial flag. Printed on your letterhead.',
    alanlar: {
      tarih: 'Date of the scan', yol: 'Route', menopoz: 'Postmenopausal',
      uterus_u: 'Uterus, length', uterus_ap: 'Uterus, anteroposterior', uterus_g: 'Uterus, width', uterus_poz: 'Uterine position', endometrium: 'Endometrial thickness',
      over_sag_1: 'Right ovary, length', over_sag_2: 'Right ovary, anteroposterior', over_sag_3: 'Right ovary, width', over_sag_not: 'Right ovary, notes',
      over_sol_1: 'Left ovary, length', over_sol_2: 'Left ovary, anteroposterior', over_sol_3: 'Left ovary, width', over_sol_not: 'Left ovary, notes',
      lezyon_1: 'Lesion 1 (site, type, FIGO / O-RADS)', lezyon_1_boyut: 'Lesion 1, largest diameter', lezyon_2: 'Lesion 2 (site, type, FIGO / O-RADS)', lezyon_2_boyut: 'Lesion 2, largest diameter',
      serbest_sivi: 'Free fluid', sonuc: 'Conclusion (the clinician\'s)',
    },
    secenekler: { yol: { transvajinal: 'Transvaginal', transabdominal: 'Transabdominal', transrektal: 'Transrectal' } },
    sayilar: { uterus_hacim: 'Uterine volume', over_sag_hacim: 'Right ovarian volume', over_sol_hacim: 'Left ovarian volume' },
    uyarilar: { endometrium_postmenopoz: 'Postmenopausal endometrium above 4 mm (ACOG Committee Opinion 734): further evaluation' },
    not: 'Volumes by the ellipsoid formula; the interpretation and the diagnosis are the clinician\'s.',
  },
  {
    anahtar: 'dogum-epikrizi', roller: KD,
    ad: 'Postnatal discharge summary',
    aciklama: 'Mode and date of birth, gestation, the baby, complications, blood loss and medicines, with discharge advice, contraception and the signs that need an urgent return, pre-filled by the mode of birth. Printed on your letterhead.',
    alanlar: {
      dogum_tarihi: 'Date of birth', dogum_sekli: 'Mode of birth', hafta: 'Gestation at birth (completed weeks)', gun: 'and days (0 to 6)',
      bebek_cinsiyet: 'Baby\'s sex', bebek_agirlik: 'Birth weight', apgar1: 'Apgar at 1 minute', apgar5: 'Apgar at 5 minutes', kan_kaybi: 'Estimated blood loss',
      endikasyon: 'Indication (operative or assisted birth)', komplikasyon: 'Complications', ilaclar: 'Medicines on discharge', emziriyor: 'Breastfeeding',
      talimatlar: 'Discharge advice', kontrasepsiyon: 'Contraception', tehlike: 'When to seek help urgently', kontrol: 'Date of the postnatal check (optional)',
    },
    secenekler: {
      dogum_sekli: { vajinal: 'Spontaneous vaginal birth', mudahaleli: 'Assisted vaginal birth', cs_elektif: 'Planned caesarean birth', cs_acil: 'Emergency caesarean birth', vbac: 'Vaginal birth after caesarean' },
      bebek_cinsiyet: { kiz: 'Female', erkek: 'Male', belirsiz: 'Not recorded' },
    },
    tarihler: { dogum_tarihi: 'Birth', kontrol: 'Postnatal check' },
    sablonlar: { dogum_sekli: EPIKRIZ_SABLONU },
    not: 'Built from what you enter; the pre-filled advice can be edited before printing. Clinical decisions are the clinician\'s.',
  },
]
