/**
 * NOTYA-ULKE-EN-01 — THE ENGLISH LANGUAGE SET: ROLE TOOLS, fourth part. Specialty and clinic tools whose grids had
 * no tool of their own: a record or a product reminder, never a national schedule, a dose, a payer rule or an
 * emergency number.
 *
 * MACHINE-WRITTEN. AWAITS CLINICAL REVIEW IN EACH COUNTRY. Written in en-GB spelling.
 *
 * WHO SEES EACH is the set's roles. A country that has further roles restates the whole list in `gorenler`. A country
 * that has no clinic-dermatology role keeps the two clinic-dermatology calendars as slots (`kapali`).
 */
import { DOZSUZ, ISARETLI_MADDE, KARAR, SONRAKI_KONTROL, SONRAKI_KONTROL_TARIHI, type HamArac } from './yardimci'

const HATIRLATMA = 'These dates are reminders built into this product. The clinician confirms each one. They are not a national schedule.'
const ACIL_NOT = 'A decision-support record. It names no emergency number: follow this country\'s emergency pathway. Diagnosis and treatment are the clinician\'s.'
const GEC = 'This reminder date has passed'

const vade = (anahtar: string, roller: HamArac['roller'], ad: string, aciklama: string, gunler: readonly number[]): HamArac => ({
  anahtar, roller, ad, aciklama,
  alanlar: { baslangic: 'Start date' },
  tarihler: { baslangic: 'Start', ...Object.fromEntries(gunler.map((g) => [`gun_${g}`, `Reminder, day ${g}`])) },
  uyarilar: Object.fromEntries(gunler.map((g) => [`gecikti_gun_${g}`, `${GEC} (day ${g})`])),
  not: HATIRLATMA,
})

export const EN_ARACLAR_4: readonly HamArac[] = [
  {
    anahtar: 'endoskopi-kaydi', roller: ['gastroenterology'],
    ad: 'Endoscopy record',
    aciklama: 'The kind of examination, the date, and the next date you enter. The tool proposes no interval.',
    alanlar: { tip: 'Kind of examination', tarih: 'Date of the examination', rapor: 'The report is on file', biyopsi: 'A biopsy was taken', bilgilendirme: 'The patient was told what to expect', sonraki: SONRAKI_KONTROL_TARIHI },
    secenekler: { tip: { ust: 'Upper endoscopy', kolonoskopi: 'Colonoscopy', sigmoidoskopi: 'Flexible sigmoidoscopy', ercp: 'ERCP', diger: 'Other' } },
    sayilar: { isaretli: ISARETLI_MADDE },
    tarihler: { tarih: 'Examination', sonraki: SONRAKI_KONTROL },
    not: DOZSUZ,
  },
  {
    anahtar: 'kronik-izlem-kaydi', roller: ['family-medicine', 'internal-medicine'],
    ad: 'Chronic-condition record',
    aciklama: 'The condition you are following, what was checked today, and the next date you enter. The tool proposes no interval.',
    alanlar: { tip: 'Condition', ilac: 'Medicines reviewed', olcum: 'Measurements recorded', gorusme: 'The plan was discussed', sonraki: SONRAKI_KONTROL_TARIHI },
    secenekler: { tip: { ht: 'High blood pressure', dm: 'Diabetes', kkh: 'Coronary disease', koah: 'Chronic lung disease', diger: 'Other' } },
    sayilar: { isaretli: ISARETLI_MADDE },
    tarihler: { sonraki: SONRAKI_KONTROL },
    not: DOZSUZ,
  },
  {
    anahtar: 'birinci-acil-bayrak', roller: ['family-medicine'],
    ad: 'Danger signs',
    aciklama: 'Tick any sign that is present, or tick that none of them is. A sign is a prompt to follow this country\'s emergency pathway. The tool names no number.',
    alanlar: { inme: 'Face, arm or speech suddenly changed', gogus: 'Chest pain', nefes: 'Breathlessness', kanama: 'Bleeding that does not stop', bilinc: 'Reduced consciousness', anafilaksi: 'Anaphylaxis', yok: 'None of these' },
    sayilar: { isaretli: ISARETLI_MADDE },
    uyarilar: { acil: 'A danger sign is ticked: follow this country\'s emergency pathway' },
    not: ACIL_NOT,
  },
  {
    anahtar: 'gebelik-gun', roller: ['obstetrics-gynaecology', 'family-medicine'],
    ad: 'Days since the last menstrual period',
    aciklama: 'Days and whole weeks from the first day of the last menstrual period you enter, up to today. If you enter an expected date, it is shown as you entered it. The tool works out no expected date.',
    alanlar: { sat: 'First day of the last menstrual period', tahmini: 'Expected date you have already decided (optional)' },
    sayilar: { gun: 'Days', hafta: 'Whole weeks' },
    tarihler: { sat: 'Last menstrual period', tahmini: 'Expected date, as entered' },
    not: 'A record of the dates you entered. It is not a due-date rule and not a national maternity schedule.',
  },
  {
    anahtar: 'kardiyo-not', roller: ['cardiology'],
    ad: 'Cardiology note',
    aciklama: 'The condition, and at least one of blood pressure or functional class. No threshold and no grade beyond the class you choose. Weight is not collected here.',
    alanlar: { tip: 'Condition', sistol: 'Systolic pressure (optional)', diyastol: 'Diastolic pressure (optional)', nyha: 'Functional class (optional)', sonraki: SONRAKI_KONTROL_TARIHI },
    secenekler: { tip: { ht: 'High blood pressure', kky: 'Heart failure', af: 'Atrial fibrillation', diger: 'Other' }, nyha: { i: 'I', ii: 'II', iii: 'III', iv: 'IV' } },
    sayilar: { sistol: 'Systolic pressure', diyastol: 'Diastolic pressure' },
    tarihler: { sonraki: SONRAKI_KONTROL },
    not: KARAR,
  },
  {
    anahtar: 'inme-bayraklari', roller: ['neurology'],
    ad: 'Stroke signs',
    aciklama: 'Tick any sign that is present, or tick that none of them is. A sign is a prompt to follow this country\'s emergency pathway. The tool names no number.',
    alanlar: { yuz: 'Face droops', kol: 'Arm weakness', konusma: 'Speech difficulty', ani_bas: 'Sudden worst headache', yok: 'None of these' },
    sayilar: { isaretli: ISARETLI_MADDE },
    uyarilar: { acil: 'A stroke sign is ticked: follow this country\'s emergency pathway' },
    not: ACIL_NOT,
  },
  {
    anahtar: 'psikiyatri-guvenlik', roller: ['psychiatry', 'clinical-psychology'],
    ad: 'Safety signs',
    aciklama: 'Tick any safety concern that is present, or tick that none of them is. The tool states no detention rule and names no emergency number.',
    alanlar: { intihar: 'Suicidal thoughts', kendine: 'Harm to oneself', siddet: 'Violence towards others', psikoz: 'Acute psychosis', yok: 'None of these' },
    sayilar: { isaretli: ISARETLI_MADDE },
    uyarilar: { guvenlik: 'A safety concern is ticked: follow this country\'s emergency pathway' },
    not: ACIL_NOT,
  },
  {
    anahtar: 'seans-plani', roller: ['rehabilitation-medicine', 'physiotherapy', 'occupational-therapy'],
    ad: 'Session plan',
    aciklama: 'The region, at least one modality, how many sessions (1 to 60) and how many per week (1 to 7). No medicine and no dose.',
    alanlar: {
      bolge: 'Region (optional)',
      isi: 'Heat pack', soguk: 'Cold', tens: 'TENS or electrotherapy', ultrason: 'Therapeutic ultrasound', diyatermi: 'Short-wave diathermy',
      egzersiz: 'Therapeutic exercise', manuel: 'Manual therapy', traksiyon: 'Traction', hidro: 'Pool therapy', ortez: 'Splint or device training',
      seans: 'Number of sessions', haftalik: 'Sessions per week', sonraki: SONRAKI_KONTROL_TARIHI,
    },
    sayilar: { isaretli: 'Modalities selected', seans: 'Sessions', haftalik: 'Per week' },
    tarihler: { sonraki: SONRAKI_KONTROL },
    not: DOZSUZ,
  },
  {
    anahtar: 'icf-ozet', roller: ['physiotherapy', 'occupational-therapy', 'rehabilitation-medicine'],
    ad: 'Functioning summary',
    aciklama: 'Which domains were noted, and that a physician\'s plan is on file. The tool does not reproduce a classification\'s wording.',
    alanlar: { vucut: 'Body functions and structures', aktivite: 'Activity', katilim: 'Participation', cevre: 'Environment', hekim_plani: 'A physician\'s plan is on file', sonraki: SONRAKI_KONTROL_TARIHI },
    sayilar: { isaretli: 'Domains noted' },
    tarihler: { sonraki: SONRAKI_KONTROL },
    not: KARAR,
  },
  {
    anahtar: 'greft-tahmini', roller: ['hair-transplant'],
    ad: 'Graft count',
    aciklama: 'Area times density, rounded to a whole number. The tool shows the count and no band.',
    alanlar: { alan: 'Area', yogunluk: 'Density' },
    sayilar: { greft: 'Grafts' },
    not: 'The count is the product of the two numbers you entered. Planning the procedure is the clinician\'s.',
  },
  vade('sac-bakim-vade', ['hair-transplant'], 'Hair-transplant reminders', 'From the start date, reminder days 1, 3, 10 and 14. A date that has passed is marked.', [1, 3, 10, 14]),
  vade('estetik-cerrahi-vade', ['aesthetic-surgery'], 'Cosmetic-surgery reminders', 'From the start date, reminder days 1, 7, 14 and 42. A date that has passed is marked.', [1, 7, 14, 42]),
  vade('estetik-islem-vade', ['aesthetic-medicine'], 'Aesthetic-procedure reminders', 'From the start date, reminder days 1, 14 and 28. A date that has passed is marked.', [1, 14, 28]),
  vade('akne-vade', ['clinic-dermatology'], 'Acne review reminders', 'From the start date, reminder days 14, 42 and 84 (weeks 2, 6 and 12). A date that has passed is marked.', [14, 42, 84]),
  {
    anahtar: 'lazer-vade', roller: ['clinic-dermatology'],
    ad: 'Laser interval',
    aciklama: 'The next date is the start date plus the interval you choose, from 14 to 90 days. The tool proposes no interval of its own.',
    alanlar: { baslangic: 'Start date', aralik_gun: 'Interval in days (14 to 90)' },
    sayilar: { aralik_gun: 'Interval' },
    uyarilar: { gecikti: 'The next date has passed' },
    tarihler: { baslangic: 'Start', sonraki: 'Next session' },
    not: HATIRLATMA,
  },
  {
    anahtar: 'infuzyon-guvenlik', roller: ['longevity'],
    ad: 'Infusion safety check',
    aciklama: 'Lot recorded, allergy asked, and a physician\'s plan on file. No mixture, no dose and no emergency number.',
    alanlar: { lot: 'Lot recorded', alerji: 'An allergy was reported', hekim_plani: 'A physician\'s plan is on file', sonraki: SONRAKI_KONTROL_TARIHI },
    sayilar: { isaretli: ISARETLI_MADDE },
    uyarilar: { alerji: 'An allergy was reported: the clinician decides whether to proceed' },
    tarihler: { sonraki: SONRAKI_KONTROL },
    not: DOZSUZ,
  },
  {
    anahtar: 'makro-kaydi', roller: ['dietetics'],
    ad: 'Intake record',
    aciklama: 'The kilocalories and the grams of protein you enter. The tool applies no formula and collects no weight.',
    alanlar: { kcal: 'Kilocalories', protein: 'Protein', sonraki: SONRAKI_KONTROL_TARIHI },
    sayilar: { kcal: 'Kilocalories', protein: 'Protein' },
    tarihler: { sonraki: SONRAKI_KONTROL },
    not: 'A record of the numbers you entered. It is not a diet calculation.',
  },
  {
    anahtar: 'sonraki-seans', roller: ['clinical-psychology', 'audiology'],
    ad: 'Next session',
    aciklama: 'The date of this session and the next date you enter. The tool proposes no gap.',
    alanlar: { tarih: 'Date of this session', sonraki: 'Date of the next session' },
    tarihler: { tarih: 'This session', sonraki: 'Next session' },
    not: KARAR,
  },
]
