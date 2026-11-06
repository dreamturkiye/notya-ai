/**
 * GENITAL-ESTETIK-01 (Kaan, 2026-11-06) — THE ENGLISH LANGUAGE SET: ROLE TOOLS, seventh part. Cosmetic gynaecology /
 * genital aesthetics for obstetrics and gynaecology (lib/ulke/araclar/tanimlar/genitalEstetik.ts): the adult
 * genital-aesthetics operation note, the energy-based session note, the injection log, the whitening record, outcome-measure
 * totals and the separate photo consent.
 *
 * MACHINE-WRITTEN. AWAITS CLINICAL REVIEW IN EACH COUNTRY. Written in en-GB spelling. Switched on where a country states
 * `genitalEstetik` (each country in its own release), and only the tools its own law and regulator permit: the rest are
 * slots with the legal source (each country's countries/<code>/genitalEstetik.ts).
 *
 * WRITTEN TO THE EVIDENCE: where the evidence is limited (energy-based devices, G-spot filler, PRP, whitening) the words say
 * so; no line promises a result. NO ITEM OF A PUBLISHED QUESTIONNAIRE: only totals are recorded. Hymenoplasty is not offered.
 * The pre-filled steps write no dose and no number: every "__" is the surgeon's.
 */
import type { HamArac } from './yardimci'
import { yuva, ANKET } from './yuvalar'
import type { AracYuvasi } from '@/lib/ulke/araclar/tipler'

const KD = ['obstetrics-gynaecology'] as const
type S = Readonly<Record<string, string>>
const adim = (satirlar: string[]) => satirlar.map((s, i) => `${i + 1}. ${s}`).join('\n')

/** The patient gate sentence every cosmetic-capable tool carries (the pack gives the gate: 18 or over, female). */
export const EN_GE_HASTA_METNI = 'For adult women aged 18 and over only: a cosmetic genital procedure is never recorded for a patient under 18, or for a patient whose date of birth is not recorded. Medically indicated surgery for a younger patient is written with the obstetric and gynaecological operation note.'

const ENDIKASYON_ALANLARI: S = { endikasyon_sinifi: 'Indication: cosmetic or medically indicated', medikal_gerekce: 'Medical reason', medikal_aciklama: 'Medical reason in your own words' }
const ENDIKASYON_SECENEKLERI: Readonly<Record<string, S>> = {
  endikasyon_sinifi: { kozmetik: 'Cosmetic (no medical indication)', medikal: 'Medically indicated (reconstructive or functional)' },
  medikal_gerekce: {
    konjenital_anomali: 'Congenital anomaly', travma_onarimi: 'Repair after trauma', obstetrik_hasar_onarimi: 'Repair of birth injury', lezyon_eksizyonu: 'Excision or biopsy of a lesion',
    belgelenmis_fonksiyonel_yakinma: 'Documented functional symptoms', prolapsus: 'Pelvic organ prolapse', fgm_sonrasi_rekonstruksiyon: 'Reconstruction after female genital mutilation',
    gsm_tedavisi: 'Genitourinary syndrome of menopause', liken_skleroz: 'Lichen sclerosus', diger_tibbi: 'Other medical reason',
  },
}
const ADVERS: S = { yok: 'None', agri: 'Pain', kanama: 'Bleeding', yanik: 'Burn', skar: 'Scarring', enfeksiyon: 'Infection', disparoni: 'Pain during intercourse', vaskuler_tikanma_suphesi: 'Suspected vascular occlusion', nodul: 'Nodule', asimetri: 'Asymmetry', alerjik_reaksiyon: 'Allergic reaction', diger: 'Other' }

const NOT_ALANLARI: S = {
  tarih: 'Date of the operation', saat: 'Start and finish time', aciliyet: 'Elective or emergency',
  preop_tani: 'Pre-operative diagnosis', postop_tani: 'Post-operative diagnosis', islem: 'Procedure performed',
  cerrah: 'Operating surgeon', asistanlar: 'Assistant(s)', anestezi: 'Anaesthesia', anestezist: 'Anaesthetist',
  endikasyon: 'Indication (the clinical story)', bulgular: 'Operative findings', teknik: 'Technique and steps', patoloji: 'Tissue sent for histology', patoloji_materyal: 'Specimen(s) sent',
  kan_kaybi: 'Estimated blood loss', sivi: 'Fluids and transfusion', drenler: 'Drain(s)', komplikasyon: 'Complications',
  implantlar: 'Implants and materials (with serial numbers)', kapanis: 'Closure', antibiyotik: 'Antibiotic prophylaxis', vte: 'VTE prophylaxis', postop: 'Post-operative instructions for the patient',
}
const NOT_SECENEKLERI: Readonly<Record<string, S>> = {
  aciliyet: { elektif: 'Elective', acil: 'Emergency' },
  anestezi: { genel: 'General', spinal: 'Spinal', epidural: 'Epidural', kombine: 'Combined spinal-epidural', rejyonel_blok: 'Regional block', sedasyon: 'Sedation', lokal: 'Local' },
  patoloji: { gonderildi: 'Sent', gonderilmedi: 'Not sent' },
}

const ACIL = 'Return at once with rapidly increasing swelling or a growing bruise on one side, bleeding that soaks a pad in an hour, a temperature of 38 °C or more, offensive discharge, a wound that opens, inability to pass urine, or pain that keeps getting worse.'
const YARA = 'For the first 48 hours use a cold pack wrapped in a cloth for 15 to 20 minutes at a time, never directly on the skin. After the toilet rinse with lukewarm water and pat dry from front to back; no perfumed products. The stitches dissolve: do not pull them. Wear loose cotton underwear. Take pain relief as advised.'
const POSTOP_LABIA = `${YARA} No intercourse or tampons for __ weeks; no swimming or baths for __ weeks; no cycling, riding or strenuous exercise for __ weeks. Swelling settles over weeks; the final appearance takes months. ${ACIL} Review: __.`
const POSTOP_VAJINA = `${YARA} Avoid constipation: plenty of fluids and fibre, a stool softener if advised. No heavy lifting or straining for __ weeks; no intercourse or tampons for __ weeks (use a lubricant the first time and stop if it hurts). ${ACIL} Also return if gas or stool comes from the vagina. Review: __.`

/** Pre-filled paragraphs of the adult genital-aesthetics note: template → paragraph field → words. */
const GE_ADIMLAR: Readonly<Record<string, S>> = {
  labioplasti: {
    endikasyon: '__ (functional symptoms / cosmetic request). Counselling, body-image screening (instrument and result: __) and expectations recorded; consent recorded.',
    teknik: adim(['Anaesthesia __; lithotomy position; skin preparation, draping.', 'Resection margins marked symmetrically on both sides, standing and in lithotomy.', 'Local infiltration: __ (as the surgeon decides).', 'Marked tissue removed by __ technique (edge / wedge / de-epithelialisation); clitoral hood and frenulum preserved.', 'Haemostasis __.']),
    kapanis: 'Mucosal edges closed with absorbable sutures __.',
    postop: POSTOP_LABIA,
  },
  labioplasti_klitoral: {
    endikasyon: '__ (functional symptoms / cosmetic request). Counselling, body-image screening (instrument and result: __) and expectations recorded; consent recorded.',
    teknik: adim(['Anaesthesia __; lithotomy position; skin preparation, draping.', 'Labial margins and the excess of the clitoral hood marked symmetrically; the midline of the hood left so that the glans stays covered.', 'Local infiltration: __ (as the surgeon decides).', 'Labial tissue removed by __ technique; frenulum preserved.', 'Lateral excess of the hood excised by __; the clitoral body, glans and dorsal nerve area not touched.', 'Haemostasis __; exposure of the glans and symmetry checked.']),
    kapanis: 'Mucosal and hood edges closed with absorbable sutures __.',
    postop: `${POSTOP_LABIA} Sensation around the clitoris may be more or less sensitive for a while; say so at review if it continues.`,
  },
  vajinoplasti: {
    endikasyon: '__ (symptoms of vaginal laxity / POP-Q stage __ / birth injury). Pelvic floor muscle training: __. Counselling and expectations recorded; consent recorded.',
    teknik: adim(['Anaesthesia __; lithotomy position; skin preparation, draping, urinary catheter.', 'Target width of the introitus set with sexual function in mind (measure: __).', 'Posterior vaginal wall and perineum marked __ (triangle / diamond) and incised.', 'Rectovaginal fascia dissected; rectum protected.', 'Rectovaginal fascia / levator edges plicated in the midline with __, avoiding over-narrowing.', 'Excess mucosa excised; perineal body muscles (bulbocavernosus, transverse perineal) re-approximated.', 'Rectal examination: no suture through the rectum: __. Final width of the introitus: __.']),
    kapanis: 'Vaginal mucosa and perineal skin closed with absorbable sutures; vaginal pack: __.',
    postop: POSTOP_VAJINA,
  },
  perineoplasti: {
    endikasyon: '__ (POP-Q stage __ / birth injury / symptoms). Consent recorded.',
    teknik: adim(['Anaesthesia __; lithotomy position; skin preparation, draping, urinary catheter.', 'Perineal / vaginal mucosal incision __; mucosa dissected off the underlying fascia.', 'Plication of the rectovaginal / vesicovaginal fascia with __ (rectal / bladder integrity preserved; rectal examination: __).', 'Excess mucosa excised.', 'Perineal body muscles re-approximated with __.']),
    kapanis: 'Vaginal mucosa and perineal skin closed with absorbable sutures; vaginal pack: __.',
    postop: POSTOP_VAJINA,
  },
}

export const EN_ARACLAR_7: readonly HamArac[] = [
  {
    anahtar: 'ameliyat-notu-genital', roller: KD,
    ad: 'Operation note: genital aesthetic surgery (adults)',
    aciklama: 'Labiaplasty, labiaplasty with clitoral hood reduction, vaginoplasty / colpoperineorrhaphy and perineoplasty, with the indication (cosmetic or medically indicated), body-image screening and pre-filled standard steps you correct to what was done. Printed on your letterhead with the patient\'s post-operative instructions.',
    alanlar: { sablon: 'Operation (pre-fills the standard steps; every word can be edited)', ...ENDIKASYON_ALANLARI, bdd_tarama: 'Body-image (body dysmorphic disorder) screening', cops_l_toplam: 'COPS-L total, if used (0 to 72)', ...NOT_ALANLARI },
    secenekler: {
      sablon: { labioplasti: 'Labiaplasty (labia minora reduction)', labioplasti_klitoral: 'Labiaplasty with clitoral hood reduction', vajinoplasti: 'Vaginoplasty / colpoperineorrhaphy (vaginal tightening)', perineoplasti: 'Perineoplasty / colporrhaphy' },
      ...ENDIKASYON_SECENEKLERI, bdd_tarama: { yapildi: 'Done, with a validated instrument', yapilmadi: 'Not done' }, ...NOT_SECENEKLERI,
    },
    uyarilar: {
      bdd_tarama_yok: 'Cosmetic genital surgery without a recorded body-image screening: assess for body dysmorphic disorder before deciding.',
      cops_l_pozitif: 'COPS-L total 40 or more: possible body dysmorphic disorder. Consider referral for a mental-health assessment before deciding. This is not a diagnosis and blocks nothing; the decision is yours.',
    },
    tarihler: { tarih: 'Operation' },
    sablonlar: { sablon: GE_ADIMLAR },
    not: 'Evidence on satisfaction, sexual function and long-term outcomes of cosmetic genital surgery is limited; the patient is told so, with the risks of pain, bleeding, infection, scarring, adhesions, altered sensation, painful intercourse and reoperation (ACOG Committee Opinion No. 795, 2020). The note is the surgeon\'s record: a correction is a new note.',
  },
  {
    anahtar: 'genital-enerji-seansi', roller: KD,
    ad: 'Energy-based session: vaginal laser or radiofrequency',
    aciklama: 'One session of CO2 or Er:YAG laser or radiofrequency: device, wavelength, the settings you used, passes, treated areas, session number in the series, adverse events and the next session.',
    alanlar: {
      tarih: 'Date of the session', ...ENDIKASYON_ALANLARI, modalite: 'Device type', cihaz: 'Device (make and model)', dalga_boyu: 'Wavelength (nm)', amac: 'Purpose',
      bolge_vajinal_kanal: 'Vaginal canal', bolge_introitus: 'Introitus', bolge_vulva_labia: 'Vulva / labia', bolge_perine: 'Perineum', bolge_periuretral: 'Periurethral',
      guc_w: 'Power (W), as set', enerji_mj: 'Energy (mJ), as set', yogunluk: 'Density (%), as set', aralik_um: 'Spot spacing (µm), as set', darbe_ms: 'Pulse duration (ms), as set', sicaklik_c: 'Radiofrequency target temperature (°C), as set', yigma: 'Stacking, as set',
      gecis: 'Number of passes', seans_no: 'Session number', seri_toplam: 'Sessions in the series', aralik_gun: 'Days to the next session (14 to 90)', advers: 'Adverse event', advers_aciklama: 'Adverse event in your words',
    },
    secenekler: {
      ...ENDIKASYON_SECENEKLERI,
      modalite: { co2_lazer: 'CO2 laser (10 600 nm)', erbiyum_yag_lazer: 'Er:YAG laser (2 940 nm)', rf_monopolar: 'Radiofrequency, monopolar', rf_bipolar: 'Radiofrequency, bipolar', rf_fraksiyonel: 'Radiofrequency, fractional / microneedle', diger: 'Other' },
      amac: { vajinal_laksite: 'Vaginal laxity ("vaginal rejuvenation")', gsm: 'Genitourinary syndrome of menopause', stres_inkontinans: 'Stress urinary incontinence', liken_skleroz: 'Lichen sclerosus', genital_beyazlatma: 'Genital lightening', diger: 'Other' },
      advers: ADVERS,
    },
    sayilar: { dalga_boyu: 'Wavelength (nm)' },
    uyarilar: { advers_var: 'An adverse event is recorded: review and report it as your regulator requires.' },
    tarihler: { tarih: 'Session', sonraki_seans: 'Next session' },
    not: 'EVIDENCE LIMITED. The safety and effectiveness of laser and radiofrequency devices for vaginal "rejuvenation", laxity, menopausal symptoms or incontinence have not been established; the United States Food and Drug Administration warned in 2018 that no device is authorised for these uses and reported burns, scarring, pain during intercourse and chronic pain. Tell the patient if the device is not approved for this use. The settings are the clinician\'s: the tool proposes none.',
  },
  {
    anahtar: 'genital-enjeksiyon', roller: KD,
    ad: 'Genital injection log (filler, PRP)',
    aciklama: 'Hyaluronic acid filler (including "G-spot" injection), PRP or another injectable: product, LOT NUMBER and expiry for a recall, volume, site, technique, adverse events and the review date. An expired product is not kept.',
    alanlar: {
      tarih: 'Date of the injection', ...ENDIKASYON_ALANLARI, urun: 'Product type', urun_adi: 'Product name', lot: 'Lot number', son_kullanma: 'Expiry date (last valid day)', hacim: 'Volume injected (mL)',
      bolge: 'Site', teknik: 'Technique', igne: 'Needle / cannula', kontrol_gun: 'Review after (days)', advers: 'Adverse event', advers_aciklama: 'Adverse event in your words',
    },
    secenekler: {
      ...ENDIKASYON_SECENEKLERI,
      urun: { ha_dolgu: 'Hyaluronic acid filler', prp: 'Platelet-rich plasma (PRP)', diger: 'Other injectable' },
      bolge: { g_noktasi_on_vajinal_duvar: 'G-spot (anterior vaginal wall)', vajinal_duvar: 'Vaginal wall', introitus: 'Introitus', labia_majora: 'Labia majora', labia_minora: 'Labia minora', klitoral_baslik: 'Clitoral hood', periuretral: 'Periurethral', perine: 'Perineum', mons_pubis: 'Mons pubis' },
      teknik: { lineer_retrograd: 'Linear retrograde', bolus: 'Bolus / depot', yelpaze: 'Fanning', mikro_damla: 'Micro-droplet', diger: 'Other' },
      advers: ADVERS,
    },
    sayilar: { hacim: 'Volume injected (mL)' },
    uyarilar: { advers_var: 'An adverse event is recorded: review it, and report it as your regulator requires.' },
    tarihler: { tarih: 'Injection', kontrol: 'Review' },
    not: 'EVIDENCE LIMITED. Safety and effectiveness data for G-spot filler and genital PRP are insufficient; ACOG lists G-spot amplification among procedures that are not medically indicated and whose safety is not established (Committee Opinion No. 795, 2020). Sudden severe pain or colour change at the site needs urgent assessment. The volume is the clinician\'s: the tool proposes none.',
  },
  {
    anahtar: 'genital-beyazlatma', roller: KD,
    ad: 'Genital lightening session',
    aciklama: 'Chemical peel, topical agent or laser for lightening of the genital skin: agent and concentration (or device), areas, skin reaction and the review date. Cosmetic only; never for a patient under 18.',
    alanlar: {
      tarih: 'Date of the session', yontem: 'Method', ajan: 'Agent', konsantrasyon: 'Concentration (%)', temas_dk: 'Contact time (minutes)', kat: 'Number of coats', cihaz: 'Laser (make and model)',
      bolge_labia_majora: 'Labia majora', bolge_labia_minora: 'Labia minora', bolge_perine: 'Perineum', bolge_perianal: 'Perianal', bolge_inguinal: 'Groin', bolge_mons_pubis: 'Mons pubis',
      reaksiyon: 'Skin reaction', reaksiyon_aciklama: 'Reaction in your words', kontrol_gun: 'Review after (days)',
    },
    secenekler: {
      yontem: { kimyasal_peeling: 'Chemical peel', topikal: 'Topical agent', lazer: 'Laser' },
      reaksiyon: { yok: 'None', eritem: 'Redness', odem: 'Swelling', yanma_hissi: 'Burning', hiperpigmentasyon: 'Darkening (hyperpigmentation)', hipopigmentasyon: 'Lightening beyond the aim (hypopigmentation)', vezikul_bul: 'Blistering', enfeksiyon: 'Infection', diger: 'Other' },
    },
    uyarilar: { reaksiyon_var: 'A skin reaction is recorded: review it.' },
    tarihler: { tarih: 'Session', kontrol: 'Review' },
    not: 'EVIDENCE LIMITED. There is no high-quality evidence on the effectiveness or safety of genital lightening; irritation, burns and lasting lightening or darkening can occur. Cosmetic, with no medical indication.',
  },
  {
    anahtar: 'genital-sonuc-olcegi', roller: KD,
    ad: 'Outcome measure total (before / after)',
    aciklama: 'The TOTAL of FSFI, FGSIS, the Vaginal Laxity Questionnaire or COPS-L, from the authorised form you gave the patient, before or after a procedure. Kept results show the trend. No item of any questionnaire is shown.',
    alanlar: { tarih: 'Date', olcek: 'Instrument', asama: 'Stage', toplam: 'Total score' },
    secenekler: {
      olcek: { fsfi: 'FSFI (Female Sexual Function Index), total 2 to 36', fgsis: 'FGSIS (Female Genital Self-Image Scale), total 7 to 28', vlq: 'Vaginal Laxity Questionnaire, 1 to 7 (not formally validated)', cops_l: 'COPS-L (Cosmetic Procedure Screening Scale for Labiaplasty), total 0 to 72' },
      asama: { oncesi: 'Before the procedure', sonrasi: 'After the procedure', izlem: 'Follow-up' },
    },
    sayilar: { toplam: 'Total' },
    bantlar: { fsfi_kesim_alti: 'FSFI 26.55 or less: in the range of female sexual dysfunction (Wiegel et al. 2005)', fsfi_kesim_ustu: 'FSFI above 26.55', vlq_gevsek: 'Loose side (1 to 3)', vlq_notr: 'Neither loose nor tight (4)', vlq_siki: 'Tight side (5 to 7)', cops_l_pozitif: 'COPS-L 40 or more', cops_l_negatif: 'COPS-L below 40' },
    uyarilar: { cops_l_pozitif: 'COPS-L total 40 or more: possible body dysmorphic disorder. Consider referral for a mental-health assessment before any cosmetic genital procedure. This is not a diagnosis and blocks nothing; the decision is yours.' },
    tarihler: { tarih: 'Score' },
    not: 'The instruments\' wording belongs to their authors, and permission for use in commercial software has not been obtained: no item is shown here. Sources: FSFI, Rosen et al. 2000 (cut-off Wiegel et al. 2005); FGSIS, Herbenick and Reece 2010; Vaginal Laxity Questionnaire, Millheiser et al. 2010 (not formally validated, Polland et al. 2021); COPS-L, Veale et al. 2013.',
  },
  {
    anahtar: 'genital-foto-onam', roller: KD,
    ad: 'Consent to intimate clinical photographs',
    aciklama: 'The patient\'s SEPARATE, explicit consent to genital photographs for her clinical record, and the standard views planned. Photographs are never sent to any automated analysis.',
    alanlar: {
      tarih: 'Date of consent', belgeleme: 'Consents to photographs for her clinical record and follow-up', egitim_yayin: 'Also consents to de-identified use for teaching or publication',
      gorunum_on_ayakta: 'Front, standing', gorunum_litotomi_istirahat: 'Lithotomy, at rest', gorunum_litotomi_ayrilmis: 'Lithotomy, labia gently parted', gorunum_perine: 'Perineum', gorunum_yakin_plan: 'Close-up of the treated area', not: 'Notes',
    },
    uyarilar: { egitim_yayin_onayi: 'Consent to teaching or publication recorded: use only de-identified images, and only for what she agreed to.' },
    tarihler: { tarih: 'Consent' },
    not: 'Consent to photographs is separate from consent to the procedure and can be withdrawn at any time. Photographs are clinical records: kept encrypted, viewed only when needed, never sent to automated analysis, and never in an export unless you include them.',
  },
]

/** Item-level entry of the four instruments: slots until a licence is recorded (GE_OLCEK_LISANSLARI). */
export function enGeYuvalari(): readonly AracYuvasi[] {
  const eksik = (ad: string, hak: string) => `Item-level entry and scoring of ${ad}: the questionnaire's wording belongs to ${hak}, and permission to show it in a commercial product has not been obtained. Until then only the total is recorded (outcome measure total).`
  return [
    { ...yuva('genital-fsfi-items', [...KD], eksik('the FSFI', 'its author (Raymond C. Rosen)'), ANKET), lisans: { durum: 'izin-gerekli', hakSahibi: 'Raymond C. Rosen (FSFI)' } },
    { ...yuva('genital-fgsis-items', [...KD], eksik('the FGSIS', 'its authors (Debby Herbenick, Michael Reece)'), ANKET), lisans: { durum: 'belirsiz', hakSahibi: 'Debby Herbenick, Michael Reece' } },
    { ...yuva('genital-vlq-item', [...KD], eksik('the Vaginal Laxity Questionnaire (one item; not formally validated)', 'its authors (Millheiser et al. 2010)'), ANKET), lisans: { durum: 'belirsiz', hakSahibi: 'Millheiser et al. (2010)' } },
    { ...yuva('genital-cops-l-items', [...KD], eksik('COPS-L', 'its author (David Veale)'), ANKET), lisans: { durum: 'izin-gerekli', hakSahibi: 'David Veale' } },
  ]
}

/** The words of the two new fields of the O&G operation note (labiaplasty / perineoplasty are medically indicated only there). */
export const EN_KD_NOT_TIBBI: S = {
  tibbi_endikasyon: 'Medically indicated (reconstructive or functional). A cosmetic operation is written with the adult genital-aesthetics note.',
  tibbi_gerekce: 'Medical reason, in your own words',
}
