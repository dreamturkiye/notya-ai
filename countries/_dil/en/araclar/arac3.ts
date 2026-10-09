/**
 * NOTYA-ULKE-EN-01 — THE ENGLISH LANGUAGE SET: ROLE TOOLS, third part: orthopaedics, paediatrics, plastic surgery,
 * radiology, rheumatology, urology, sports medicine. Same rules as ./arac1.ts.
 *
 * MACHINE-WRITTEN. No clinician of any country has read a line. Written in en-GB spelling.
 *
 * UNITS ARE A CLINICAL-SAFETY MATTER. A length or a weight is typed in the PACK's unit and shown with it; the kit
 * turns it into centimetres or kilograms with the exact defined factors before it computes. A laboratory value is
 * typed in the unit the field shows. No label below writes a unit of length or weight into its words: the screen
 * puts the pack's unit beside the field. WEIGHT-BASED DOSE ARITHMETIC (`doz-hesabi`) is switched on by a pack only
 * where it measures weight in kilograms (./index.ts): a pack that measures in pounds keeps it as a slot.
 */
import { EKLEM_28 } from '@/lib/ulke/araclar/tanimlar/ortoPediRadyoRoma'
import { DOZSUZ, gorev, ISARETLI_MADDE, KARAR, type HamArac } from './yardimci'

const EKLEM: Readonly<Record<string, string>> = { omuz: 'shoulder', dirsek: 'elbow', el_bilegi: 'wrist', diz: 'knee' }
/** "sag_mcp3" → "right MCP joint 3"; "sol_omuz" → "left shoulder". */
function eklemAdi(anahtar: string): string {
  const yan = anahtar.startsWith('sag_') ? 'right' : 'left'
  const govde = anahtar.slice(4)
  const parmak = /^(mcp|pip)([1-5])$/.exec(govde)
  return parmak ? `${yan} ${parmak[1].toUpperCase()} joint ${parmak[2]}` : `${yan} ${EKLEM[govde] ?? govde}`
}
const eklemAlanlari = (): Record<string, string> => Object.fromEntries([
  ...EKLEM_28.map((e) => [`h_${e}`, `Tender: ${eklemAdi(e)}`] as const),
  ...EKLEM_28.map((e) => [`s_${e}`, `Swollen: ${eklemAdi(e)}`] as const),
])

const BIRADS = { 0: 'BI-RADS 0', 1: 'BI-RADS 1', 2: 'BI-RADS 2', 3: 'BI-RADS 3', 4: 'BI-RADS 4', 5: 'BI-RADS 5', 6: 'BI-RADS 6', genel: 'General report (no category)' }

export const EN_ARACLAR_3: readonly HamArac[] = [
  // ── orthopaedics ──
  {
    anahtar: 'kirik-alci-takip', roller: ['orthopaedics'],
    ad: 'Fracture, cast and brace follow-up',
    aciklama: 'What is being followed, the site, circulation and nerve supply, and the dates the cast comes off and weight-bearing starts. No diagnosis is stated.',
    alanlar: {
      tip: 'What is being followed',
      bolge: 'Site (optional)',
      taraf: 'Side (optional)',
      nv: 'Circulation and nerve supply (optional)',
      baslangic: 'Date of the start or of the procedure (optional)',
      alci_alma: 'Date the cast or brace comes off (optional)',
      yuk_verme: 'Date weight-bearing starts (optional)',
      goruntu_hazir: 'There is imaging, the doctor reviews it',
    },
    secenekler: {
      tip: { kirik: 'Fracture', alci: 'Cast', ortez: 'Brace', op_sonrasi: 'After an operation' },
      bolge: { omuz: 'Shoulder and upper arm', dirsek: 'Elbow and forearm', el: 'Wrist and hand', kalca: 'Hip and pelvis', diz: 'Knee and lower leg', ayak: 'Ankle and foot', omurga: 'Spine', diger: 'Other' },
      taraf: { sag: 'Right', sol: 'Left', iki: 'Both sides', belirtilmedi: 'Not stated' },
      nv: { tam: 'Intact: sensation, strength and pulse normal', parestezi: 'Mild tingling: the doctor follows it', tehdit: 'Under threat: urgent assessment', degerlendirilmedi: 'Not assessed' },
    },
    uyarilar: {
      nv_tehdit: 'Circulation or nerve supply is under threat: urgent assessment is needed',
      alci_gecti: 'The date for the cast or brace to come off has passed',
      yuk_gecti: 'The date for weight-bearing to start has passed',
      goruntu_kontrol: gorev('review after imaging'),
      op_kontrol: gorev('post-operative review'),
    },
    tarihler: { baslangic: 'Start or procedure', alci_alma: 'Cast or brace off', yuk_verme: 'Weight-bearing starts' },
    not: KARAR,
  },
  {
    anahtar: 'ortopedi-op-protokol', roller: ['orthopaedics'],
    ad: 'Post-operative checklist',
    aciklama: 'Six items that are checked after an orthopaedic operation.',
    alanlar: {
      islem_kaydi: 'Date and side of the operation recorded',
      dikis_kontrol: 'Date set to check the stitches and the wound',
      yuk_kisit: 'Limits on weight-bearing and movement explained',
      goruntu_kontrol: 'Follow-up imaging arranged (where needed)',
      ftr_sevk: 'Referral for rehabilitation is the doctor\'s decision',
      kirmizi_bayrak: 'Warning signs explained to the patient (increasing swelling, fever, loss of sensation)',
      islem_tarihi: 'Date of the operation (optional)',
    },
    sayilar: { isaretli: ISARETLI_MADDE },
    tarihler: { islem_tarihi: 'Date of the operation' },
    not: DOZSUZ,
  },
  {
    anahtar: 'vas-fonksiyon', roller: ['orthopaedics'],
    ad: 'Pain and function rating',
    aciklama: 'Pain from 0 to 10 and four items of function from 0 to 4 (0 = no difficulty, 4 = cannot do it). The grade is this tool\'s own summary, not a published scale.',
    alanlar: { vas: 'Pain from 0 to 10', yurume: 'Walking', merdiven: 'Going up and down stairs', gunluk: 'Daily activities (dressing, washing)', uyku: 'Sleep disturbed by pain' },
    sayilar: { vas: 'Pain', fonksiyon: 'Function' },
    bantlar: { hafif: 'Mild pain and limitation of function', orta: 'Moderate pain and limitation of function', siddetli: 'Severe pain and limitation of function' },
    not: KARAR,
  },

  // ── paediatrics. Never for cardiology, or for any role whose patients are adults. ──
  {
    anahtar: 'hedef-boy', roller: ['paediatrics'],
    ad: 'Expected height from the parents\' heights',
    aciklama: 'From the height of the father and of the mother, an estimate of the child\'s adult height and its range is worked out. It is an estimate, not a promise.',
    alanlar: { cinsiyet: 'Sex of the child', anne: 'Mother\'s height', baba: 'Father\'s height' },
    secenekler: { cinsiyet: { kiz: 'Girl', erkek: 'Boy' } },
    sayilar: { hedef: 'Expected height', alt: 'Lower end of the range', ust: 'Upper end of the range' },
    not: 'The figure is an estimate; assessing growth and making a diagnosis are the doctor\'s.',
  },
  {
    anahtar: 'doz-hesabi', roller: ['paediatrics'],
    ad: 'Dose arithmetic by body weight',
    aciklama: 'Arithmetic on the numbers YOU enter: body weight, milligrams per kilogram, doses per day; with a concentration, the volume per dose. The tool knows no medicine, no recommended dose and no limit.',
    alanlar: {
      kilo: 'Body weight',
      mg_kg: 'Dose per kilogram',
      mod: 'The dose entered is for',
      doz_sayisi: 'Doses per day',
      kons_mg: 'Concentration: milligrams (optional)',
      kons_ml: 'Concentration: millilitres (optional)',
      tavan_doz_mg: 'The limit you set for one dose (optional)',
      tavan_gun_mg: 'The limit you set for one day (optional)',
    },
    secenekler: { mod: { gun: 'A whole day', doz: 'One dose' } },
    sayilar: {
      doz_mg: 'Dose each time',
      gunluk_mg: 'Dose in a day',
      aralik_saat: 'Time between doses',
      doz_ml: 'Volume each time',
      gunluk_ml: 'Volume in a day',
      tavanli_doz_mg: 'Dose each time, held to your limit',
      tavanli_doz_ml: 'Volume each time, held to your limit',
    },
    uyarilar: {
      tavan_doz: 'The dose worked out for one time is above the limit you set',
      tavan_gun: 'The dose worked out for a day is above the limit you set',
      kilo_birim: 'The body weight is unusually large: check the unit',
      ml_kucuk: 'The volume for one dose is smaller than can be measured accurately',
    },
    not: 'The arithmetic rests on the numbers you entered; the medicine, the dose and the limit are the doctor\'s to decide and to check.',
  },

  // ── plastic surgery ──
  {
    anahtar: 'plastik-yara-greft', roller: ['plastic-surgery'],
    ad: 'Wound, graft and flap follow-up',
    aciklama: 'What is being followed, the site, and the dates of the procedure, the next dressing and the removal of stitches. No diagnosis and no dose of any medicine is stated.',
    alanlar: { tip: 'What is being followed', bolge: 'Site', taraf: 'Side (optional)', islem: 'Date of the procedure (optional)', pansuman: 'Date of the next dressing (optional)', dikis_alma: 'Date for removal of stitches (optional)' },
    secenekler: { tip: { yara: 'Wound care', greft: 'Skin graft', flep: 'Flap', dikis: 'Stitches', pansiyel: 'Dressing', diger: 'Other' } },
    tarihler: { islem: 'Procedure', pansuman: 'Next dressing', dikis_alma: 'Removal of stitches' },
    not: DOZSUZ,
  },

  // ── radiology ──
  {
    anahtar: 'tetkik-kuyrugu', roller: ['radiology'],
    ad: 'Examination queue',
    aciklama: 'One examination: its method, priority and status. The next step follows from the status. No finding and no diagnosis is stated.',
    alanlar: { modalite: 'Method', oncelik: 'Priority', durum: 'Status', tarih: 'Date (optional)' },
    secenekler: {
      modalite: { xray: 'X-ray', us: 'Ultrasound', bt: 'CT', mri: 'MRI', mamografi: 'Mammography', pet: 'PET', diger: 'Other' },
      oncelik: { acil: 'Emergency', ayni_gun: 'Same day', rutin: 'Routine', kontrol: 'Follow-up' },
      durum: { bekliyor: 'Waiting', cekildi: 'Done', rapor_hazir: 'Report ready', arsiv: 'Archived' },
    },
    uyarilar: {
      kuyrukta: 'Next step: carry out the examination',
      rapor_bekliyor: 'Next step: write the report',
      rapor_klinisyen: 'Next step: make sure the report has reached the referring doctor',
    },
    tarihler: { tarih: 'Date' },
    not: KARAR,
  },
  {
    anahtar: 'rapor-taslagi', roller: ['radiology'],
    ad: 'Structured report outline',
    aciklama: 'The assessment category you chose, and the sections the report will have. The tool writes no finding and chooses no category.',
    alanlar: {
      kategori: 'Assessment category',
      endikasyon: 'Indication and clinical question',
      teknik: 'Technique and protocol',
      bulgular_yapilandirilmis: 'Structured findings (written by the doctor)',
      karsilastirma: 'Comparison with an earlier examination',
      sonuc_ozet: 'Conclusion',
      onerilen_izlem: 'Recommended follow-up or further examination',
      klinisyen_bildirim: 'The referring doctor must be told',
    },
    secenekler: { kategori: BIRADS },
    sayilar: { isaretli: 'Sections marked' },
    bantlar: BIRADS,
    uyarilar: { rapor_izlem: gorev('recommended follow-up or further examination'), klinisyen_bildirim: gorev('make sure the referring doctor has been told') },
    not: KARAR,
  },

  // ── rheumatology ──
  {
    anahtar: 'das28', roller: ['rheumatology'],
    ad: 'DAS28 disease activity score',
    aciklama: 'Worked out from the number of tender and of swollen joints out of 28, the patient\'s global assessment (0 to 100) and a marker of inflammation.',
    alanlar: {
      varyant: 'Version of the score',
      tjc: 'Tender joints (0 to 28)',
      sjc: 'Swollen joints (0 to 28)',
      pga: 'Patient\'s global assessment',
      crp: 'C-reactive protein',
      esr: 'Erythrocyte sedimentation rate',
    },
    secenekler: { varyant: { crp: 'With C-reactive protein', esr: 'With erythrocyte sedimentation rate' } },
    sayilar: { das28: 'DAS28' },
    bantlar: { remisyon: 'Remission (below 2.6)', dusuk: 'Low activity (2.6 to 3.19)', orta: 'Moderate activity (3.2 to 5.1)', yuksek: 'High activity (above 5.1)' },
    not: KARAR,
  },
  {
    anahtar: 'eklem-28', roller: ['rheumatology'],
    ad: '28-joint count',
    aciklama: 'Tender and swollen joints are marked; both counts are used in the DAS28 score. First mark that the examination was done.',
    alanlar: { degerlendirildi: 'The 28 joints were examined', ...eklemAlanlari() },
    sayilar: { tjc: 'Tender joints', sjc: 'Swollen joints' },
    not: KARAR,
  },

  // ── urology ──
  {
    anahtar: 'psa-hizi', roller: ['urology'],
    ad: 'Prostate-specific antigen: rate of change',
    aciklama: 'From two measurements and their dates, the change in a year is worked out. No threshold and no grade is shown.',
    alanlar: { onceki_deger: 'Earlier value', onceki_tarih: 'Date of the earlier measurement', son_deger: 'Latest value', son_tarih: 'Date of the latest measurement' },
    sayilar: { hiz: 'Change in a year', gun: 'Time between the measurements' },
    uyarilar: { kisa_aralik: 'The measurements are less than 90 days apart: read the result with caution' },
    not: KARAR,
  },

  // ── sports medicine ──
  {
    anahtar: 'rtp-basamak', roller: ['sports-medicine'],
    ad: 'Stages of return to sport',
    aciklama: 'Records which stage the athlete is at now. The stage is the doctor\'s decision; the tool proposes no timing.',
    alanlar: { basamak: 'Stage' },
    secenekler: { basamak: { 0: '0', 1: '1', 2: '2', 3: '3', 4: '4', 5: '5' } },
    bantlar: {
      b0: 'Stage 0: rest and control of symptoms',
      b1: 'Stage 1: light aerobic exercise',
      b2: 'Stage 2: sport-specific exercise, no contact',
      b3: 'Stage 3: training without contact',
      b4: 'Stage 4: contact training, no competition',
      b5: 'Stage 5: full training and return to competition',
    },
    not: 'The stage and the decision on return to sport are the doctor\'s.',
  },
  {
    anahtar: 'sakatlik-gunlugu', roller: ['sports-medicine'],
    ad: 'Injury log',
    aciklama: 'The site, mechanism, severity and status of an injury; from the minutes of training in the last seven days and the earlier weekly average, their ratio is worked out.',
    alanlar: { bolge: 'Site', mekanizma: 'Mechanism (optional)', siddet: 'Severity (optional)', durum: 'Status (optional)', dk_7gun: 'Training in the last 7 days (optional)', dk_onceki: 'Earlier average weekly training (optional)' },
    secenekler: {
      bolge: { diz: 'Knee', ayak_bilegi: 'Ankle', kalca: 'Hip', omuz: 'Shoulder', dirsek: 'Elbow', el_bilegi: 'Wrist', bel: 'Lower back', boyun: 'Neck', kas_bacak: 'Leg muscles', kas_govde: 'Trunk muscles', kas_ust: 'Arm muscles', bas_boyun: 'Head and neck (concussion)', diger: 'Other' },
      mekanizma: { temas: 'Contact or a blow', temassiz: 'Non-contact (a twist, a sudden stop)', asiri_kullanim: 'Overuse', asiri_gerilme: 'Overstretching', bilinmiyor: 'Not known' },
      siddet: { hafif: 'Mild', orta: 'Moderate', agir: 'Severe' },
      durum: { aktif: 'Active', iyilesiyor: 'Healing', kapandi: 'Closed' },
    },
    sayilar: { yuklenme_orani: 'Training load ratio' },
    uyarilar: { yuklenme_yuksek: 'Training load ratio 1.5 or above: high', yuklenme_dikkat: 'Training load ratio 1.3 or above: needs attention' },
    not: KARAR,
  },
]
