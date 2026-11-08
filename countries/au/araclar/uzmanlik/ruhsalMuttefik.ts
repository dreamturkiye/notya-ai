/**
 * ULKE-BRANS-DERINLIK-01 — Australia: specialty tools of psychiatry, clinical psychology, pain medicine, obstetrics
 * (perinatal mental health), physiotherapy, occupational therapy, audiology, podiatry and speech pathology. Questionnaire
 * items whose wording belongs to their authors are numbered only. See ./motor.ts.
 */
import type { AracAlani } from '@/lib/ulke/araclar/tipler'
import { sayiMi } from '@/lib/ulke/araclar/yardimci'
import { b, c, i, t, yuvarla, type UzmanlikSatiri } from './motor'

const NOT = 'A result from what you entered, by the published method shown. It informs, it does not decide: the treating clinician weighs it with the whole person and approves the note.'
const s = (anahtar: string, enAz: number, enCok: number, birim?: string, ek: Partial<AracAlani> = {}): AracAlani => ({ anahtar, tur: 'sayi', enAz, enCok, ...(birim ? { birim } : {}), ...ek })
const sec = (anahtar: string, secenekler: string[]): AracAlani => ({ anahtar, tur: 'secim', secenekler })
const nm = (n: number, enAz: number, enCok: number) => Array.from({ length: n }, (_, k) => i(`m${k + 1}`, enAz, enCok))
const npuan = (n: number, enAz: number, enCok: number): AracAlani[] => Array.from({ length: n }, (_, k) => ({ anahtar: `m${k + 1}`, tur: 'puan', enAz, enCok, tam: true, numarali: true }))
const hepsi = (n: number, v: number) => Object.fromEntries(Array.from({ length: n }, (_, k) => [`m${k + 1}`, v]))
const DASS = { d: [3, 5, 10, 13, 16, 17, 21], a: [2, 4, 7, 9, 15, 19, 20], s: [1, 6, 8, 11, 12, 14, 18] }
const dassBant = (v: number, sinir: [number, number, number, number]) => (v < sinir[0] ? 'normal' : v < sinir[1] ? 'hafif' : v < sinir[2] ? 'orta' : v < sinir[3] ? 'agir' : 'cok_agir')

export const RUHSAL_MUTTEFIK: readonly UzmanlikSatiri[] = [
  // ── mental health ──
  {
    sekil: 'toplam', k: 'audit', roller: ['psychiatry', 'clinical-psychology', 'family-medicine'],
    ad: 'AUDIT (Alcohol Use Disorders Identification Test)', aciklama: 'Ten items from the WHO AUDIT form (items 1–8 scored 0–4; items 9–10 scored 0, 2 or 4). Total 0–40 with the WHO risk zones.',
    not: `${NOT} Australian guidelines to reduce health risks from drinking alcohol (NHMRC 2020) set the drinking advice; the zone guides the level of intervention.`,
    kaynak: 'Babor TF, Higgins-Biddle JC, Saunders JB, Monteiro MG. AUDIT: the Alcohol Use Disorders Identification Test. Guidelines for use in primary care. 2nd ed. Geneva: WHO; 2001 (zones I 0–7, II 8–15, III 16–19, IV 20–40).',
    toplamAdi: 'AUDIT total',
    alanlar: nm(10, 0, 4),
    bantlar: [b(0, 'z1', 'Zone I (0–7) — low risk'), b(8, 'z2', 'Zone II (8–15) — risky use'), b(16, 'z3', 'Zone III (16–19) — harmful use'), b(20, 'z4', 'Zone IV (20–40) — possible dependence')],
    ornekler: [{ girdi: { ...hepsi(8, 1), m9: 0, m10: 0 }, toplam: 8, bant: 'z2' }, { girdi: { ...hepsi(8, 3), m9: 2, m10: 4 }, toplam: 30, bant: 'z4' }],
  },
  {
    sekil: 'toplam', k: 'epds', roller: ['obstetrics-gynaecology', 'family-medicine', 'psychiatry'],
    ad: 'Edinburgh Postnatal Depression Scale', aciklama: 'Ten items 0–3 from the EPDS form (reverse-scored items as printed on the form). Item 10 asks about self-harm.',
    not: `${NOT} Any non-zero answer to item 10 needs same-day safety assessment.`,
    kaynak: 'Cox JL, Holden JM, Sagovsky R. Detection of postnatal depression: development of the 10-item Edinburgh Postnatal Depression Scale. Br J Psychiatry 1987;150:782-6. Cut-offs from the source: 10 or more possible depression, 13 or more probable depression. Centre of Perinatal Excellence (COPE), Mental Health Care in the Perinatal Period: Australian Clinical Practice Guideline (2023), recommends EPDS screening in pregnancy and after birth.',
    toplamAdi: 'EPDS total',
    alanlar: nm(10, 0, 3),
    bantlar: [b(0, 'dusuk', 'Below 10'), b(10, 'ara', '10–12 — possible depression: repeat or assess'), b(13, 'yuksek', '13 or more — further assessment indicated')],
    uyarilar: [{ k: 'madde10', e: 'Item 10 is not zero — assess for self-harm risk today.', kosul: (_x, g) => sayiMi(g.m10) && (g.m10 as number) > 0 }],
    ornekler: [{ girdi: { ...hepsi(10, 1), m10: 0 }, toplam: 9, bant: 'dusuk' }, { girdi: { ...hepsi(9, 2), m10: 1 }, toplam: 19, bant: 'yuksek', uyarilar: ['madde10'] }],
  },
  {
    sekil: 'toplam', k: 'ciwa-ar', roller: ['psychiatry', 'emergency-medicine', 'internal-medicine'],
    ad: 'CIWA-Ar (alcohol withdrawal)', aciklama: 'Ten observed or reported items: nine scored 0–7 and orientation 0–4. Total 0–67.',
    not: `${NOT} Medication for withdrawal follows Therapeutic Guidelines and the local protocol.`,
    kaynak: 'Sullivan JT, Sykora K, Schneiderman J, Naranjo CA, Sellers EM. Assessment of alcohol withdrawal: the revised Clinical Institute Withdrawal Assessment for Alcohol scale (CIWA-Ar). Br J Addict 1989;84:1353-7 (scores below 10 usually need no additional medication). In the public domain.',
    toplamAdi: 'CIWA-Ar total',
    alanlar: [i('bulanti', 0, 7, 'Nausea and vomiting (0–7)'), i('titreme', 0, 7, 'Tremor (0–7)'), i('terleme', 0, 7, 'Paroxysmal sweats (0–7)'), i('anksiyete', 0, 7, 'Anxiety (0–7)'), i('ajitasyon', 0, 7, 'Agitation (0–7)'), i('dokunsal', 0, 7, 'Tactile disturbances (0–7)'), i('isitsel', 0, 7, 'Auditory disturbances (0–7)'), i('gorsel', 0, 7, 'Visual disturbances (0–7)'), i('bas_agrisi', 0, 7, 'Headache (0–7)'), i('oryantasyon', 0, 4, 'Orientation and clouding of sensorium (0–4)')],
    bantlar: [b(0, 'minimal', 'Below 10 — minimal withdrawal'), b(10, 'belirgin', '10 or more — clinically significant withdrawal')],
    ornekler: [{ girdi: { bulanti: 2, titreme: 3, terleme: 2, anksiyete: 3, ajitasyon: 1, dokunsal: 0, isitsel: 0, gorsel: 0, bas_agrisi: 1, oryantasyon: 0 }, toplam: 12, bant: 'belirgin' }],
  },
  {
    sekil: 'toplam', k: 'cows', roller: ['psychiatry', 'pain-medicine'],
    ad: 'Clinical Opiate Withdrawal Scale (COWS)', aciklama: 'Eleven signs scored as on the COWS form. Total 0–48.',
    not: `${NOT} Opioid treatment follows the state opioid treatment program guidelines.`,
    kaynak: 'Wesson DR, Ling W. The Clinical Opiate Withdrawal Scale (COWS). J Psychoactive Drugs 2003;35:253-9 (5–12 mild, 13–24 moderate, 25–36 moderately severe, above 36 severe).',
    toplamAdi: 'COWS total',
    alanlar: [i('nabiz', 0, 4, 'Resting pulse (0–4)'), i('terleme', 0, 4, 'Sweating (0–4)'), i('huzursuzluk', 0, 5, 'Restlessness (0–5)'), i('pupil', 0, 5, 'Pupil size (0–5)'), i('agri', 0, 4, 'Bone or joint aches (0–4)'), i('burun', 0, 4, 'Runny nose or tearing (0–4)'), i('gis', 0, 5, 'Gastrointestinal upset (0–5)'), i('tremor', 0, 4, 'Tremor (0–4)'), i('esneme', 0, 4, 'Yawning (0–4)'), i('anksiyete', 0, 4, 'Anxiety or irritability (0–4)'), i('tuylenme', 0, 5, 'Gooseflesh skin (0–5)')],
    bantlar: [b(0, 'yok', '0–4 — no active withdrawal'), b(5, 'hafif', '5–12 — mild'), b(13, 'orta', '13–24 — moderate'), b(25, 'orta_agir', '25–36 — moderately severe'), b(37, 'agir', 'Above 36 — severe')],
    ornekler: [{ girdi: { nabiz: 1, terleme: 1, huzursuzluk: 1, pupil: 1, agri: 1, burun: 1, gis: 2, tremor: 1, esneme: 1, anksiyete: 2, tuylenme: 3 }, toplam: 15, bant: 'orta' }],
  },
  {
    sekil: 'toplam', k: 'pcl-5', roller: ['clinical-psychology', 'psychiatry'],
    ad: 'PTSD Checklist for DSM-5 (PCL-5)', aciklama: 'Twenty items 0–4 from the PCL-5 form (public domain, US Department of Veterans Affairs). Total 0–80.',
    not: `${NOT} A provisional screen; diagnosis needs clinical interview.`,
    kaynak: 'Weathers FW, Litz BT, Keane TM, Palmieri PA, Marx BP, Schnurr PP. The PTSD Checklist for DSM-5 (PCL-5). US Department of Veterans Affairs, 2013; Bovin MJ, et al. Psychol Assess 2016;28:1379-91 (31–33 suggested provisional cut-point).',
    toplamAdi: 'PCL-5 total',
    alanlar: nm(20, 0, 4),
    bantlar: [b(0, 'dusuk', 'Below 31'), b(31, 'olasi', '31 or more — provisional PTSD: clinical assessment indicated')],
    ornekler: [{ girdi: hepsi(20, 2), toplam: 40, bant: 'olasi' }],
  },
  {
    sekil: 'formul', k: 'dass-21', roller: ['clinical-psychology', 'psychiatry'],
    ad: 'DASS-21 (Depression Anxiety Stress Scales)', aciklama: 'Twenty-one items 0–3 from the DASS-21 form (public domain, developed at UNSW). Each subscale is summed and doubled; severity labels from the manual.',
    not: `${NOT} DASS measures severity of symptoms; it is not a diagnostic instrument.`,
    kaynak: 'Lovibond SH, Lovibond PF. Manual for the Depression Anxiety Stress Scales. 2nd ed. Sydney: Psychology Foundation; 1995 (severity: depression 0–9/10–13/14–20/21–27/28+; anxiety 0–7/8–9/10–14/15–19/20+; stress 0–14/15–18/19–25/26–33/34+).',
    alanlar: npuan(21, 0, 3),
    etiketler: {},
    sayiAdlari: { depresyon: 'Depression', anksiyete: 'Anxiety', stres: 'Stress' },
    uyarilar: (['d', 'a', 's'] as const).flatMap((alt) => (['hafif', 'orta', 'agir', 'cok_agir'] as const).map((d) => ({ k: `${alt}_${d}`, e: `${{ d: 'Depression', a: 'Anxiety', s: 'Stress' }[alt]}: ${{ hafif: 'mild', orta: 'moderate', agir: 'severe', cok_agir: 'extremely severe' }[d]} range` }))),
    hesap: (g) => {
      const top = (m: number[]) => 2 * m.reduce((t2, k) => t2 + (g[`m${k}`] as number), 0)
      const d = top(DASS.d), a = top(DASS.a), st = top(DASS.s)
      const u = [['d', dassBant(d, [10, 14, 21, 28])], ['a', dassBant(a, [8, 10, 15, 20])], ['s', dassBant(st, [15, 19, 26, 34])]].filter(([, x]) => x !== 'normal').map(([k, x]) => `${k}_${x}`)
      return { sayilar: [{ anahtar: 'depresyon', deger: d, ondalik: 0, enCok: 42 }, { anahtar: 'anksiyete', deger: a, ondalik: 0, enCok: 42 }, { anahtar: 'stres', deger: st, ondalik: 0, enCok: 42 }], uyarilar: u }
    },
    ornekler: [{ girdi: hepsi(21, 1), sayilar: { depresyon: 14, anksiyete: 14, stres: 14 }, uyarilar: ['d_orta', 'a_orta'] }, { girdi: hepsi(21, 0), sayilar: { depresyon: 0 }, uyarilar: [] }],
  },
  {
    sekil: 'formul', k: 'reliable-change', roller: ['clinical-psychology'],
    ad: 'Reliable Change Index (Jacobson–Truax)', aciklama: 'Whether the change between two scores on the same measure exceeds measurement error: RCI = (post − pre) / √2·SEm, SEm = SD·√(1 − r). Enter the measure\'s norm SD and test–retest reliability.',
    not: NOT,
    kaynak: 'Jacobson NS, Truax P. Clinical significance: a statistical approach to defining meaningful change in psychotherapy research. J Consult Clin Psychol 1991;59:12-9 (|RCI| > 1.96).',
    alanlar: [s('once', -1000, 1000), s('sonra', -1000, 1000), s('sd', 0.01, 1000), s('r', 0, 0.99)],
    etiketler: { once: 'Score at the start', sonra: 'Score now', sd: 'Standard deviation of the measure (norm group)', r: 'Test–retest reliability (0–0.99)' },
    sayiAdlari: { rci: 'RCI', fark: 'Change' },
    bantlar: [{ k: 'guvenilir_degisim', e: 'Reliable change (|RCI| above 1.96)' }, { k: 'degisim_yok', e: 'Change within measurement error' }],
    hesap: (g) => {
      const sem = (g.sd as number) * Math.sqrt(1 - (g.r as number))
      const rci = ((g.sonra as number) - (g.once as number)) / (Math.SQRT2 * sem)
      return { sayilar: [{ anahtar: 'fark', deger: yuvarla((g.sonra as number) - (g.once as number), 1), ondalik: 1 }, { anahtar: 'rci', deger: yuvarla(rci, 2), ondalik: 2 }], bant: Math.abs(rci) > 1.96 ? 'guvenilir_degisim' : 'degisim_yok' }
    },
    ornekler: [{ girdi: { once: 30, sonra: 18, sd: 8, r: 0.9 }, sayilar: { fark: -12, rci: -3.35 }, bant: 'guvenilir_degisim' }, { girdi: { once: 20, sonra: 17, sd: 8, r: 0.8 }, bant: 'degisim_yok' }],
  },
  // ── pain medicine ──
  {
    sekil: 'toplam', k: 'dn4', roller: ['pain-medicine', 'neurology'],
    ad: 'DN4 neuropathic pain questionnaire', aciklama: 'Ten items (seven interview, three examination) answered yes (1) or no (0) from the DN4 form. Four or more suggests neuropathic pain.',
    not: NOT,
    kaynak: 'Bouhassira D, Attal N, Alchaar H, et al. Comparison of pain syndromes associated with nervous or somatic lesions and development of a new neuropathic pain diagnostic questionnaire (DN4). Pain 2005;114:29-36.',
    toplamAdi: 'DN4 score',
    alanlar: nm(10, 0, 1),
    bantlar: [b(0, 'dusuk', 'Below 4'), b(4, 'noropatik', '4 or more — neuropathic pain likely')],
    ornekler: [{ girdi: { ...hepsi(10, 0), m1: 1, m2: 1, m3: 1, m8: 1 }, toplam: 4, bant: 'noropatik' }],
  },
  {
    sekil: 'formul', k: 'peg-pain', roller: ['pain-medicine', 'family-medicine'],
    ad: 'PEG three-item pain scale', aciklama: 'Pain intensity, interference with Enjoyment of life and with General activity over the past week, each 0–10; the score is the mean.',
    not: NOT,
    kaynak: 'Krebs EE, Lorenz KA, Bair MJ, et al. Development and initial validation of the PEG, a three-item scale assessing pain intensity and interference. J Gen Intern Med 2009;24:733-8.',
    alanlar: [{ anahtar: 'agri', tur: 'puan', enAz: 0, enCok: 10, tam: true }, { anahtar: 'keyif', tur: 'puan', enAz: 0, enCok: 10, tam: true }, { anahtar: 'aktivite', tur: 'puan', enAz: 0, enCok: 10, tam: true }],
    etiketler: { agri: 'Average pain in the past week (0–10)', keyif: 'Interference with enjoyment of life (0–10)', aktivite: 'Interference with general activity (0–10)' },
    sayiAdlari: { peg: 'PEG score' },
    hesap: (g) => ({ sayilar: [{ anahtar: 'peg', deger: yuvarla(((g.agri as number) + (g.keyif as number) + (g.aktivite as number)) / 3, 1), ondalik: 1, enCok: 10 }] }),
    ornekler: [{ girdi: { agri: 7, keyif: 6, aktivite: 8 }, sayilar: { peg: 7 } }],
  },
  {
    sekil: 'formul', k: 'opioid-risk-tool', roller: ['pain-medicine', 'family-medicine'],
    ad: 'Opioid Risk Tool', aciklama: 'Family and personal history of substance misuse, age, history of preadolescent sexual abuse and psychological disease; points differ by sex.',
    not: `${NOT} Opioid prescribing follows the RACGP and Faculty of Pain Medicine guidance and state real-time prescription monitoring.`,
    kaynak: 'Webster LR, Webster RM. Pain Med 2005;6:432-42 (0–3 low, 4–7 moderate, 8 or more high risk).',
    alanlar: [sec('cinsiyet', ['kadin', 'erkek']), { anahtar: 'aile_alkol', tur: 'isaret' }, { anahtar: 'aile_madde', tur: 'isaret' }, { anahtar: 'aile_ilac', tur: 'isaret' }, { anahtar: 'kisi_alkol', tur: 'isaret' }, { anahtar: 'kisi_madde', tur: 'isaret' }, { anahtar: 'kisi_ilac', tur: 'isaret' }, { anahtar: 'yas', tur: 'isaret' }, { anahtar: 'istismar', tur: 'isaret' }, { anahtar: 'psikiyatrik', tur: 'isaret' }, { anahtar: 'depresyon', tur: 'isaret' }],
    etiketler: { cinsiyet: 'Sex', aile_alkol: 'Family history: alcohol', aile_madde: 'Family history: illegal drugs', aile_ilac: 'Family history: prescription drugs', kisi_alkol: 'Personal history: alcohol', kisi_madde: 'Personal history: illegal drugs', kisi_ilac: 'Personal history: prescription drugs', yas: 'Age 16–45', istismar: 'History of preadolescent sexual abuse', psikiyatrik: 'ADD, OCD, bipolar disorder or schizophrenia', depresyon: 'Depression' },
    secenekEtiketleri: { cinsiyet: { kadin: 'Female', erkek: 'Male' } },
    sayiAdlari: { ort: 'ORT score' },
    bantlar: [{ k: 'dusuk', e: '0–3 — low risk' }, { k: 'orta', e: '4–7 — moderate risk' }, { k: 'yuksek', e: '8 or more — high risk' }],
    hesap: (g) => {
      const K = g.cinsiyet === 'kadin'
      const p: Record<string, [number, number]> = { aile_alkol: [1, 3], aile_madde: [2, 3], aile_ilac: [4, 4], kisi_alkol: [3, 3], kisi_madde: [4, 4], kisi_ilac: [5, 5], yas: [1, 1], istismar: [3, 0], psikiyatrik: [2, 2], depresyon: [1, 1] }
      const v = Object.entries(p).reduce((t2, [k, [f, m]]) => t2 + (g[k] === true ? (K ? f : m) : 0), 0)
      return { sayilar: [{ anahtar: 'ort', deger: v, ondalik: 0 }], bant: v <= 3 ? 'dusuk' : v <= 7 ? 'orta' : 'yuksek' }
    },
    ornekler: [{ girdi: { cinsiyet: 'kadin', aile_alkol: true, yas: true, depresyon: true }, sayilar: { ort: 3 }, bant: 'dusuk' }, { girdi: { cinsiyet: 'erkek', aile_alkol: true, kisi_alkol: true, yas: true, depresyon: true }, sayilar: { ort: 8 }, bant: 'yuksek' }],
  },
  // ── physiotherapy and occupational therapy ──
  {
    sekil: 'formul', k: 'psfs', roller: ['physiotherapy', 'occupational-therapy'],
    ad: 'Patient-Specific Functional Scale', aciklama: 'Up to five activities the person finds hard, each rated 0 (unable) to 10 (as before the problem). The score is the mean of the rated activities.',
    not: `${NOT} A change of 2 points or more on the mean is commonly taken as clinically meaningful.`,
    kaynak: 'Stratford P, Gill C, Westaway M, Binkley J. Assessing disability and change on individual patients: a report of a patient specific measure. Physiother Can 1995;47:258-63.',
    alanlar: [1, 2, 3, 4, 5].map((n) => ({ anahtar: `a${n}`, tur: 'puan' as const, enAz: 0, enCok: 10, tam: true, ...(n > 1 ? { istege: true } : {}) })),
    etiketler: { a1: 'Activity 1 (0–10)', a2: 'Activity 2 (0–10, optional)', a3: 'Activity 3 (0–10, optional)', a4: 'Activity 4 (0–10, optional)', a5: 'Activity 5 (0–10, optional)' },
    sayiAdlari: { ortalama: 'PSFS mean', sayi: 'Activities rated' },
    hesap: (g) => {
      const v = [1, 2, 3, 4, 5].map((n) => g[`a${n}`]).filter(sayiMi) as number[]
      return { sayilar: [{ anahtar: 'ortalama', deger: yuvarla(v.reduce((x, y) => x + y, 0) / v.length, 1), ondalik: 1, enCok: 10 }, { anahtar: 'sayi', deger: v.length, ondalik: 0 }] }
    },
    ornekler: [{ girdi: { a1: 3, a2: 5, a3: 4 }, sayilar: { ortalama: 4, sayi: 3 } }],
  },
  {
    sekil: 'formul', k: 'tug', roller: ['physiotherapy', 'geriatric-medicine'],
    ad: 'Timed Up and Go', aciklama: 'Seconds to rise from a chair, walk 3 m, turn, return and sit, with the usual walking aid.',
    not: `${NOT} One part of a multifactorial falls assessment.`,
    kaynak: 'Podsiadlo D, Richardson S. The timed "Up & Go": a test of basic functional mobility for frail elderly persons. J Am Geriatr Soc 1991;39:142-8; Shumway-Cook A, Brauer S, Woollacott M. Phys Ther 2000;80:896-903 (13.5 s or more associated with falls in community-dwelling older adults).',
    alanlar: [s('sure', 1, 300, 's')],
    etiketler: { sure: 'Time' },
    sayiAdlari: { sure: 'TUG time' },
    sonucBirimleri: ['s'],
    bantlar: [{ k: 'dusuk', e: 'Below 13.5 s' }, { k: 'yuksek', e: '13.5 s or more — associated with higher fall risk' }],
    hesap: (g) => ({ sayilar: [{ anahtar: 'sure', deger: yuvarla(g.sure as number, 1), ondalik: 1, birim: 's' }], bant: (g.sure as number) >= 13.5 ? 'yuksek' : 'dusuk' }),
    ornekler: [{ girdi: { sure: 15.2 }, bant: 'yuksek' }, { girdi: { sure: 9 }, bant: 'dusuk' }],
  },
  {
    sekil: 'formul', k: 'six-minute-walk', roller: ['physiotherapy', 'respiratory-medicine'],
    ad: 'Six-minute walk distance vs predicted', aciklama: 'Predicted distance and lower limit of normal for healthy adults by the Enright–Sherrill equations; the measured distance as % predicted.',
    not: NOT,
    kaynak: 'Enright PL, Sherrill DL. Reference equations for the six-minute walk in healthy adults. Am J Respir Crit Care Med 1998;158:1384-7 (men 7.57×height − 5.02×age − 1.76×weight − 309, LLN −153 m; women 2.11×height − 2.29×weight − 5.78×age + 667, LLN −139 m).',
    alanlar: [s('mesafe', 0, 1500, 'm'), s('yas', 18, 100, undefined, { tam: true }), s('boy', 100, 230, 'cm'), s('kilo', 25, 300, 'kg'), sec('cinsiyet', ['erkek', 'kadin'])],
    etiketler: { mesafe: 'Distance walked', yas: 'Age (years)', boy: 'Height', kilo: 'Weight', cinsiyet: 'Sex' },
    secenekEtiketleri: { cinsiyet: { erkek: 'Male', kadin: 'Female' } },
    sayiAdlari: { beklenen: 'Predicted distance', alt_sinir: 'Lower limit of normal', yuzde: '% predicted' },
    sonucBirimleri: ['m', '%'],
    bantlar: [{ k: 'normal', e: 'At or above the lower limit of normal' }, { k: 'dusuk', e: 'Below the lower limit of normal' }],
    hesap: (g) => {
      const E = g.cinsiyet === 'erkek'
      const p = E ? 7.57 * (g.boy as number) - 5.02 * (g.yas as number) - 1.76 * (g.kilo as number) - 309 : 2.11 * (g.boy as number) - 2.29 * (g.kilo as number) - 5.78 * (g.yas as number) + 667
      const lln = p - (E ? 153 : 139)
      if (p <= 0) return null
      return { sayilar: [{ anahtar: 'beklenen', deger: Math.round(p), ondalik: 0, birim: 'm' }, { anahtar: 'alt_sinir', deger: Math.round(lln), ondalik: 0, birim: 'm' }, { anahtar: 'yuzde', deger: Math.round(((g.mesafe as number) / p) * 100), ondalik: 0, birim: '%' }], bant: (g.mesafe as number) >= lln ? 'normal' : 'dusuk' }
    },
    ornekler: [{ girdi: { mesafe: 400, yas: 65, boy: 175, kilo: 80, cinsiyet: 'erkek' }, sayilar: { beklenen: 549, alt_sinir: 396, yuzde: 73 }, bant: 'normal' }, { girdi: { mesafe: 300, yas: 70, boy: 160, kilo: 70, cinsiyet: 'kadin' }, sayilar: { beklenen: 440, alt_sinir: 301, yuzde: 68 }, bant: 'dusuk' }],
  },
  {
    sekil: 'toplam', k: 'modified-ashworth', roller: ['physiotherapy', 'occupational-therapy', 'rehabilitation-medicine'],
    ad: 'Modified Ashworth Scale (spasticity)', aciklama: 'Record the grade for the muscle group tested (name it in the note).',
    not: NOT,
    kaynak: 'Bohannon RW, Smith MB. Interrater reliability of a modified Ashworth scale of muscle spasticity. Phys Ther 1987;67:206-7.',
    toplamAdi: 'MAS grade (1+ recorded as 1.5)',
    alanlar: [c('derece', 'Grade', [['0', '0 — no increase in tone', 0], ['1', '1 — slight increase, catch and release', 2], ['1p', '1+ — slight increase, catch then minimal resistance through less than half the range', 3], ['2', '2 — marked increase through most of the range', 4], ['3', '3 — considerable increase, passive movement difficult', 6], ['4', '4 — rigid in flexion or extension', 8]])],
    donustur: { f: (x) => (x <= 4 ? [0, 0, 1, 1.5, 2][x] ?? x : x / 2), ondalik: 1, enCok: 4 },
    ornekler: [{ girdi: { derece: '1p' }, toplam: 1.5 }, { girdi: { derece: '3' }, toplam: 3 }],
  },
  {
    sekil: 'toplam', k: 'lawton-iadl', roller: ['occupational-therapy', 'geriatric-medicine'],
    ad: 'Lawton Instrumental Activities of Daily Living', aciklama: 'Tick each domain the person manages at the level scored 1 on the Lawton scale. Total 0–8.',
    not: NOT,
    kaynak: 'Lawton MP, Brody EM. Assessment of older people: self-maintaining and instrumental activities of daily living. Gerontologist 1969;9:179-86.',
    alanlar: [t('telefon', 'Telephone'), t('alisveris', 'Shopping'), t('yemek', 'Food preparation'), t('ev', 'Housekeeping'), t('camasir', 'Laundry'), t('ulasim', 'Transport'), t('ilac', 'Own medications'), t('para', 'Finances')],
    ornekler: [{ girdi: { telefon: true, alisveris: true, ilac: true, para: true, ulasim: true }, toplam: 5 }],
  },
  {
    sekil: 'toplam', k: 'fes-i', roller: ['occupational-therapy', 'physiotherapy'],
    ad: 'Falls Efficacy Scale – International (FES-I)', aciklama: 'Sixteen activities rated 1–4 for concern about falling, from the FES-I form. Total 16–64.',
    not: NOT,
    kaynak: 'Yardley L, Beyer N, Hauer K, et al. Development and initial validation of the Falls Efficacy Scale-International (FES-I). Age Ageing 2005;34:614-9; Delbaere K, et al. Age Ageing 2010;39:210-6 (16–19 low, 20–27 moderate, 28–64 high concern).',
    toplamAdi: 'FES-I total',
    alanlar: nm(16, 1, 4),
    bantlar: [b(16, 'dusuk', '16–19 — low concern'), b(20, 'orta', '20–27 — moderate concern'), b(28, 'yuksek', '28–64 — high concern')],
    ornekler: [{ girdi: hepsi(16, 2), toplam: 32, bant: 'yuksek' }],
  },
  {
    sekil: 'toplam', k: 'home-fast', roller: ['occupational-therapy'],
    ad: 'HOME FAST home falls hazard screen', aciklama: 'Twenty-five items from the HOME FAST form, each scored 1 where a hazard is present. Developed in Australia.',
    not: `${NOT} No cut-off: the items scored 1 are the home modification list to discuss.`,
    kaynak: 'Mackenzie L, Byles J, Higginbotham N. Designing the Home Falls and Accidents Screening Tool (HOME FAST): selecting the items. Br J Occup Ther 2000;63:260-9.',
    toplamAdi: 'Hazards identified',
    alanlar: nm(25, 0, 1),
    ornekler: [{ girdi: { ...hepsi(25, 0), m3: 1, m7: 1, m12: 1 }, toplam: 3 }],
  },
  // ── audiology ──
  {
    sekil: 'formul', k: 'tympanogram-type', roller: ['audiology', 'otolaryngology'],
    ad: 'Tympanogram type (Jerger)', aciklama: 'From peak pressure (daPa) and peak compensated static admittance (mL), or a flat trace with no peak.',
    not: `${NOT} Normative admittance ranges differ for children and with probe frequency; read with the equipment's norms.`,
    kaynak: 'Jerger J. Clinical experience with impedance audiometry. Arch Otolaryngol 1970;92:311-24 (types A, As, Ad, B, C); adult static admittance 0.3–1.6 mL and peak pressure above −100 daPa as working limits.',
    alanlar: [{ anahtar: 'duz', tur: 'isaret' }, s('basinc', -600, 400, 'daPa', { istege: true }), s('admitans', 0, 10, 'mL', { istege: true })],
    etiketler: { duz: 'Flat trace (no peak)', basinc: 'Peak pressure', admitans: 'Peak static admittance' },
    sayiAdlari: { admitans: 'Static admittance' },
    sonucBirimleri: ['mL'],
    bantlar: [{ k: 'a', e: 'Type A — normal pressure and admittance' }, { k: 'as', e: 'Type As — normal pressure, low admittance' }, { k: 'ad', e: 'Type Ad — normal pressure, high admittance' }, { k: 'b', e: 'Type B — flat, no peak' }, { k: 'c', e: 'Type C — negative peak pressure' }],
    hesap: (g) => {
      if (g.duz === true) return { sayilar: [], bant: 'b' }
      if (!sayiMi(g.basinc) || !sayiMi(g.admitans)) return null
      const a = g.admitans as number
      const bant = (g.basinc as number) < -100 ? 'c' : a < 0.3 ? 'as' : a > 1.6 ? 'ad' : 'a'
      return { sayilar: [{ anahtar: 'admitans', deger: yuvarla(a, 2), ondalik: 2, birim: 'mL' }], bant }
    },
    ornekler: [{ girdi: { duz: true }, bant: 'b' }, { girdi: { basinc: -250, admitans: 0.5 }, bant: 'c' }, { girdi: { basinc: -20, admitans: 0.2 }, bant: 'as' }, { girdi: { basinc: 0, admitans: 0.8 }, bant: 'a' }],
  },
  {
    sekil: 'formul', k: 'hearing-grade-who', roller: ['audiology', 'otolaryngology'],
    ad: 'Four-frequency average and WHO hearing grade', aciklama: 'Average of 0.5, 1, 2 and 4 kHz air-conduction thresholds per ear (and the 0.5/1/2 kHz average); grade from the better ear by the WHO World report on hearing.',
    not: NOT,
    kaynak: 'WHO. World report on hearing. Geneva: WHO; 2021 (better-ear 4FA: <20 normal, 20–<35 mild, 35–<50 moderate, 50–<65 moderately severe, 65–<80 severe, 80–<95 profound, ≥95 complete).',
    alanlar: ['sag', 'sol'].flatMap((y) => ['500', '1000', '2000', '4000'].map((f) => s(`${y}_${f}`, -10, 130, 'dB HL'))),
    etiketler: Object.fromEntries(['sag', 'sol'].flatMap((y) => ['500', '1000', '2000', '4000'].map((f) => [`${y}_${f}`, `${y === 'sag' ? 'Right' : 'Left'} ${Number(f) / 1000} kHz`]))),
    sayiAdlari: { sag_4fa: 'Right 4FA', sol_4fa: 'Left 4FA', sag_3fa: 'Right 3FA (0.5/1/2 kHz)', sol_3fa: 'Left 3FA (0.5/1/2 kHz)' },
    sonucBirimleri: ['dB HL'],
    bantlar: [{ k: 'normal', e: 'Better ear: normal hearing' }, { k: 'hafif', e: 'Better ear: mild' }, { k: 'orta', e: 'Better ear: moderate' }, { k: 'orta_agir', e: 'Better ear: moderately severe' }, { k: 'agir', e: 'Better ear: severe' }, { k: 'derin', e: 'Better ear: profound' }, { k: 'tam', e: 'Better ear: complete or total' }],
    hesap: (g) => {
      const ort = (y: string, f: string[]) => f.reduce((x, k) => x + (g[`${y}_${k}`] as number), 0) / f.length
      const s4 = ort('sag', ['500', '1000', '2000', '4000']), l4 = ort('sol', ['500', '1000', '2000', '4000'])
      const iyi = Math.min(s4, l4)
      const bant = iyi < 20 ? 'normal' : iyi < 35 ? 'hafif' : iyi < 50 ? 'orta' : iyi < 65 ? 'orta_agir' : iyi < 80 ? 'agir' : iyi < 95 ? 'derin' : 'tam'
      return { sayilar: [{ anahtar: 'sag_4fa', deger: yuvarla(s4, 1), ondalik: 1, birim: 'dB HL' }, { anahtar: 'sol_4fa', deger: yuvarla(l4, 1), ondalik: 1, birim: 'dB HL' }, { anahtar: 'sag_3fa', deger: yuvarla(ort('sag', ['500', '1000', '2000']), 1), ondalik: 1, birim: 'dB HL' }, { anahtar: 'sol_3fa', deger: yuvarla(ort('sol', ['500', '1000', '2000']), 1), ondalik: 1, birim: 'dB HL' }], bant }
    },
    ornekler: [{ girdi: { sag_500: 20, sag_1000: 25, sag_2000: 35, sag_4000: 60, sol_500: 30, sol_1000: 40, sol_2000: 50, sol_4000: 70 }, sayilar: { sag_4fa: 35, sol_4fa: 47.5, sag_3fa: 26.7 }, bant: 'orta' }],
  },
  {
    sekil: 'toplam', k: 'hhie-s', roller: ['audiology'],
    ad: 'Hearing Handicap Inventory for the Elderly – Screening (HHIE-S)', aciklama: 'Ten items from the HHIE-S form, each 0 (no), 2 (sometimes) or 4 (yes). Total 0–40.',
    not: NOT,
    kaynak: 'Ventry IM, Weinstein BE. Identification of elderly people with hearing problems. ASHA 1983;25:37-42 (0–8 no handicap, 10–24 mild–moderate, 26–40 significant).',
    toplamAdi: 'HHIE-S total',
    alanlar: Array.from({ length: 10 }, (_, k) => c(`m${k + 1}`, `Item ${k + 1}`, [['0', 'No (0)', 0], ['2', 'Sometimes (2)', 2], ['4', 'Yes (4)', 4]])),
    bantlar: [b(0, 'yok', '0–8 — no handicap'), b(10, 'hafif', '10–24 — mild to moderate handicap'), b(26, 'belirgin', '26–40 — significant handicap')],
    ornekler: [{ girdi: Object.fromEntries(Array.from({ length: 10 }, (_, k) => [`m${k + 1}`, k < 3 ? '4' : k < 6 ? '2' : '0'])), toplam: 18, bant: 'hafif' }],
  },
  {
    sekil: 'toplam', k: 'thi', roller: ['audiology', 'otolaryngology'],
    ad: 'Tinnitus Handicap Inventory', aciklama: 'Twenty-five items from the THI form, each 0 (no), 2 (sometimes) or 4 (yes). Total 0–100 with severity grades.',
    not: NOT,
    kaynak: 'Newman CW, Jacobson GP, Spitzer JB. Development of the Tinnitus Handicap Inventory. Arch Otolaryngol Head Neck Surg 1996;122:143-8; McCombe A, et al. Clin Otolaryngol 2001;26:388-93 (0–16 slight, 18–36 mild, 38–56 moderate, 58–76 severe, 78–100 catastrophic).',
    toplamAdi: 'THI total',
    alanlar: Array.from({ length: 25 }, (_, k) => c(`m${k + 1}`, `Item ${k + 1}`, [['0', 'No (0)', 0], ['2', 'Sometimes (2)', 2], ['4', 'Yes (4)', 4]])),
    bantlar: [b(0, 'cok_hafif', '0–16 — slight'), b(18, 'hafif', '18–36 — mild'), b(38, 'orta', '38–56 — moderate'), b(58, 'agir', '58–76 — severe'), b(78, 'felaket', '78–100 — catastrophic')],
    ornekler: [{ girdi: Object.fromEntries(Array.from({ length: 25 }, (_, k) => [`m${k + 1}`, k < 10 ? '2' : '0'])), toplam: 20, bant: 'hafif' }],
  },
  // ── podiatry ──
  {
    sekil: 'toplam', k: 'sinbad', roller: ['podiatry', 'vascular-surgery'],
    ad: 'SINBAD diabetes-related foot ulcer score', aciklama: 'Site, Ischaemia, Neuropathy, Bacterial infection, Area and Depth (0 or 1 each).',
    not: `${NOT} Recommended for communication between services in the Australian diabetes-related foot disease guidelines (IWGDF-adopted).`,
    kaynak: 'Ince P, Abbas ZG, Lutale JK, et al. Use of the SINBAD classification system and score in comparing outcome of foot ulcer management on three continents. Diabetes Care 2008;31:964-7.',
    alanlar: [t('yer', 'Site: midfoot or hindfoot'), t('iskemi', 'Ischaemia: clinical evidence of reduced pedal blood flow'), t('noropati', 'Neuropathy: protective sensation lost'), t('enfeksiyon', 'Bacterial infection present'), t('alan', 'Area 1 cm² or more'), t('derinlik', 'Depth reaching muscle, tendon or deeper')],
    bantlar: [b(0, 'dusuk', '0–2'), b(3, 'yuksek', '3–6 — associated with longer healing')],
    ornekler: [{ girdi: { noropati: true, enfeksiyon: true, alan: true }, toplam: 3, bant: 'yuksek' }],
  },
  {
    sekil: 'formul', k: 'iwgdf-risk', roller: ['podiatry', 'endocrinology', 'family-medicine'],
    ad: 'IWGDF foot ulcer risk category and screening interval', aciklama: 'Loss of protective sensation, peripheral artery disease, foot deformity and history of ulcer, amputation or end-stage kidney disease → risk 0–3 and the review interval.',
    not: NOT,
    kaynak: 'Bus SA, Sacco ICN, Monteiro-Soares M, et al. Guidelines on the prevention of foot ulcers in persons with diabetes (IWGDF 2023 update). Diabetes Metab Res Rev 2024;40:e3651; adopted by the 2021 Australian evidence-based guidelines for diabetes-related foot disease (Diabetes Feet Australia). Intervals: 0 yearly, 1 every 6–12 months, 2 every 3–6 months, 3 every 1–3 months.',
    alanlar: [{ anahtar: 'lops', tur: 'isaret' }, { anahtar: 'pad', tur: 'isaret' }, { anahtar: 'deformite', tur: 'isaret' }, { anahtar: 'oyku', tur: 'isaret' }],
    etiketler: { lops: 'Loss of protective sensation', pad: 'Peripheral artery disease', deformite: 'Foot deformity', oyku: 'History of foot ulcer, lower-extremity amputation, or end-stage kidney disease' },
    sayiAdlari: { kategori: 'IWGDF risk category' },
    bantlar: [{ k: 'r0', e: 'Risk 0 (very low) — screen once a year' }, { k: 'r1', e: 'Risk 1 (low) — every 6–12 months' }, { k: 'r2', e: 'Risk 2 (moderate) — every 3–6 months' }, { k: 'r3', e: 'Risk 3 (high) — every 1–3 months' }],
    hesap: (g) => {
      const l = g.lops === true, p = g.pad === true, d = g.deformite === true
      let k = 0
      if ((l || p) && g.oyku === true) k = 3
      else if ((l && p) || (l && d) || (p && d)) k = 2
      else if (l || p) k = 1
      return { sayilar: [{ anahtar: 'kategori', deger: k, ondalik: 0, enCok: 3 }], bant: `r${k}` }
    },
    ornekler: [{ girdi: { hicbiri: true }, bant: 'r0' }, { girdi: { lops: true }, bant: 'r1' }, { girdi: { lops: true, deformite: true }, bant: 'r2' }, { girdi: { pad: true, oyku: true }, bant: 'r3' }],
  },
  {
    sekil: 'formul', k: 'ut-wound', roller: ['podiatry'],
    ad: 'University of Texas diabetic wound classification', aciklama: 'Depth grade (0–3) and stage for infection and ischaemia (A–D).',
    not: NOT,
    kaynak: 'Armstrong DG, Lavery LA, Harkless LB. Diabetes Care 1998;21:855-9.',
    alanlar: [sec('derece', ['0', '1', '2', '3']), { anahtar: 'enfeksiyon', tur: 'isaret' }, { anahtar: 'iskemi', tur: 'isaret' }],
    etiketler: { derece: 'Depth grade', enfeksiyon: 'Infection present', iskemi: 'Ischaemia present' },
    secenekEtiketleri: { derece: { '0': '0 — pre- or post-ulcerative lesion, fully epithelialised', '1': '1 — superficial wound, not tendon, capsule or bone', '2': '2 — penetrates to tendon or capsule', '3': '3 — penetrates to bone or joint' } },
    sayiAdlari: { derece: 'Grade' },
    bantlar: ['0', '1', '2', '3'].flatMap((d) => ['a', 'b', 'c', 'd'].map((st) => ({ k: `g${d}${st}`, e: `Grade ${d}, stage ${st.toUpperCase()}${st === 'a' ? ' (clean)' : st === 'b' ? ' (infected)' : st === 'c' ? ' (ischaemic)' : ' (infected and ischaemic)'}` }))),
    hesap: (g) => {
      const e = g.enfeksiyon === true, i2 = g.iskemi === true
      const st = e && i2 ? 'd' : i2 ? 'c' : e ? 'b' : 'a'
      return { sayilar: [{ anahtar: 'derece', deger: Number(g.derece), ondalik: 0, enCok: 3 }], bant: `g${g.derece}${st}` }
    },
    ornekler: [{ girdi: { derece: '1', enfeksiyon: true }, bant: 'g1b' }, { girdi: { derece: '3', enfeksiyon: true, iskemi: true }, bant: 'g3d' }],
  },
  // ── speech pathology ──
  {
    sekil: 'toplam', k: 'fois', roller: ['speech-pathology', 'dietetics'],
    ad: 'Functional Oral Intake Scale', aciklama: 'Record the level of oral intake, 1 (nothing by mouth) to 7 (total oral diet without restriction).',
    not: NOT,
    kaynak: 'Crary MA, Mann GD, Groher ME. Initial psychometric assessment of a functional oral intake scale for dysphagia in stroke patients. Arch Phys Med Rehabil 2005;86:1516-20.',
    toplamAdi: 'FOIS level',
    alanlar: [c('duzey', 'Level', [['1', '1 — nothing by mouth', 1], ['2', '2 — tube dependent with minimal attempts of food or liquid', 2], ['3', '3 — tube dependent with consistent oral intake', 3], ['4', '4 — total oral diet of a single consistency', 4], ['5', '5 — total oral diet, multiple consistencies, special preparation', 5], ['6', '6 — total oral diet, no special preparation, specific food limitations', 6], ['7', '7 — total oral diet with no restrictions', 7]])],
    bantlar: [b(1, 'tup', '1–3 — tube dependent'), b(4, 'oral', '4–7 — total oral intake')],
    ornekler: [{ girdi: { duzey: '5' }, bant: 'oral' }],
  },
  {
    sekil: 'toplam', k: 'penetration-aspiration', roller: ['speech-pathology'],
    ad: 'Penetration–Aspiration Scale', aciklama: 'Record the worst score observed on instrumental assessment (VFSS or FEES), 1–8.',
    not: NOT,
    kaynak: 'Rosenbek JC, Robbins JA, Roecker EB, Coyle JL, Wood JL. A penetration-aspiration scale. Dysphagia 1996;11:93-8.',
    toplamAdi: 'PAS score',
    alanlar: [c('puan', 'Score', [['1', '1 — material does not enter the airway', 1], ['2', '2 — enters airway, remains above folds, ejected', 2], ['3', '3 — enters airway, remains above folds, not ejected', 3], ['4', '4 — contacts folds, ejected', 4], ['5', '5 — contacts folds, not ejected', 5], ['6', '6 — passes below folds, ejected', 6], ['7', '7 — passes below folds, not ejected despite effort', 7], ['8', '8 — passes below folds, no effort to eject (silent)', 8]])],
    bantlar: [b(1, 'normal', '1 — no penetration'), b(2, 'penetrasyon', '2–5 — penetration'), b(6, 'aspirasyon', '6–7 — aspiration'), b(8, 'sessiz', '8 — silent aspiration')],
    ornekler: [{ girdi: { puan: '8' }, bant: 'sessiz' }, { girdi: { puan: '3' }, bant: 'penetrasyon' }],
  },
  {
    sekil: 'toplam', k: 'doss', roller: ['speech-pathology'],
    ad: 'Dysphagia Outcome and Severity Scale', aciklama: 'Record the level, 1 (severe dysphagia) to 7 (normal in all situations).',
    not: NOT,
    kaynak: 'O\'Neil KH, Purdy M, Falk J, Gallo L. The Dysphagia Outcome and Severity Scale. Dysphagia 1999;14:139-45.',
    toplamAdi: 'DOSS level',
    alanlar: [c('duzey', 'Level', [['1', '1 — severe dysphagia: nothing by mouth', 1], ['2', '2 — moderately severe', 2], ['3', '3 — moderate', 3], ['4', '4 — mild–moderate', 4], ['5', '5 — mild', 5], ['6', '6 — within functional limits / modified independence', 6], ['7', '7 — normal in all situations', 7]])],
    ornekler: [{ girdi: { duzey: '4' }, toplam: 4 }],
  },
  {
    sekil: 'toplam', k: 'vhi-10', roller: ['speech-pathology', 'otolaryngology'],
    ad: 'Voice Handicap Index-10', aciklama: 'Ten items 0–4 from the VHI-10 form. Total 0–40.',
    not: NOT,
    kaynak: 'Rosen CA, Lee AS, Osborne J, Zullo T, Murry T. Development and validation of the voice handicap index-10. Laryngoscope 2004;114:1549-56; Arffa RE, et al. J Voice 2012;26:462-5 (above 11 abnormal).',
    toplamAdi: 'VHI-10 total',
    alanlar: nm(10, 0, 4),
    bantlar: [b(0, 'normal', '11 or less'), b(12, 'anormal', 'Above 11 — abnormal')],
    ornekler: [{ girdi: hepsi(10, 2), toplam: 20, bant: 'anormal' }],
  },
]
