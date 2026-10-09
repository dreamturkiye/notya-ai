/**
 * NOTYA-ULKE-EN-01 — THE ENGLISH LANGUAGE SET: the spelling table. Every word whose spelling differs between the
 * forms of English this set is written in, said out loud, once.
 *
 * The set's texts are written ONCE, in the spelling of `en-GB` (the base form). The other forms are made from it by
 * the rules of ./varyant.ts and by nothing else: this table. A word that is not here is written the same in all five.
 *
 *   en-GB   the base: -our, -re, -ise, -yse, ae/oe, doubled consonants (colour, centre, organise, analyse, anaemia)
 *   en-AU   the base, except the words that carry an `au` entry (Australian usage: "program")
 *   en-NZ   the base, unchanged
 *   en-US   the `us` column
 *   en-CA   Canadian spelling is a MIX and is stated word by word, never inferred: `ca: 'gb'` (colour, centre,
 *           travelling, licence, practise) or `ca: 'us'` (organize, analyze, anemia, pediatric, program)
 *
 * MACHINE-WRITTEN. The Canadian column follows general knowledge of Canadian usage; no Canadian editor has read it.
 * Australian and New Zealand usage beyond "program" was not checked with a local reader either
 * (docs/OPEN-COMMITMENTS.md, NOTYA-ULKE-EN-01).
 *
 * THREE LISTS
 *   KELIMELER   whole words. A row gives the British and the American spelling; `ekler` repeats the row for each
 *               ending (organis + e / ed / es / ing / ation). Matched as whole words, capitals kept.
 *   KOKLER      stems of medical words where the difference sits inside the word (haem → hem, paediatr → pediatr).
 *               Matched anywhere inside a word, the capital of the first letter kept.
 *   KORUNAN     words a stem must not touch: Latin names of organisms are written the same everywhere.
 *
 * `belirsiz: true` = the American spelling is ALSO a correct British word with another meaning (meter, program,
 * check, practice, license). Finding such a word in British text proves nothing, so the cross-check of
 * ./varyant.test.ts does not hunt it there. The conversion itself is one-way (from the base) and exact.
 *
 * NOT IN THIS TABLE, ON PURPOSE: vocabulary. "Anaesthetist" and "anesthesiologist", "consultant" and "attending",
 * "NHS number" and "health card number" are different WORDS for a country's own things, not spellings: they are the
 * country pack's (countries/<code>/), never the set's.
 */
export type Kelime = {
  /** British spelling (the base the texts are written in), without the endings of `ekler`. */
  gb: string
  us: string
  /** Which side Canadian spelling takes for this word. Stated for every row. */
  ca: 'gb' | 'us'
  /** Australian spelling where it leaves the base. */
  au?: string
  /** Endings the row is repeated for. Default: the word alone. */
  ekler?: readonly string[]
  belirsiz?: true
}

const ISE = ['e', 'ed', 'es', 'ing', 'ation', 'ations'] as const
const ISE_KISA = ['e', 'ed', 'es', 'ing'] as const
const OUR = ['', 's'] as const

/** -ise / -ize. Canada writes -ize. */
const ise = (kok: string, ekler: readonly string[] = ISE): Kelime => ({ gb: `${kok}is`, us: `${kok}iz`, ca: 'us', ekler })
/** -our / -or. Canada writes -our. */
const our = (kok: string, ekler: readonly string[] = OUR): Kelime => ({ gb: `${kok}our`, us: `${kok}or`, ca: 'gb', ekler })
/** -re / -er. Canada writes -re. */
const re = (kok: string): Kelime => ({ gb: `${kok}re`, us: `${kok}er`, ca: 'gb', ekler: ['', 's'] })
/** Doubled consonant before an ending (travelling / traveling). Canada doubles. */
const cift = (kok: string, ekler: readonly string[] = ['ed', 'ing']): Kelime => ({ gb: `${kok}l`, us: kok, ca: 'gb', ekler })

export const KELIMELER: readonly Kelime[] = [
  // ── -ise / -ize ──
  ise('organ'), ise('recogn', ISE_KISA), ise('summar', ISE_KISA), ise('personal'), ise('author'), ise('special'), ise('priorit'),
  ise('minim'), ise('maxim'), ise('standard'), ise('final'), ise('custom'), ise('categor'), ise('emphas', ISE_KISA), ise('apolog', ISE_KISA),
  ise('util'), ise('optim'), ise('memor'), ise('immun'), ise('hospital'), ise('steril'), ise('stabil'), ise('visual'), ise('synchron'),
  ise('digit'), ise('central'), ise('critic', ISE_KISA), ise('general'), ise('character'), ise('catheter'), ise('normal'), ise('local'),
  ise('real'), ise('random'), ise('item'), ise('initial'), ise('familiar', ISE_KISA), ise('anonym'), ise('pseudonym'), ise('symbol', ISE_KISA),
  ise('mobil'), ise('immobil'), ise('individual'), ise('modern'), ise('neutral'), ise('formal'), ise('external'), ise('internal'),
  ise('sensit'), ise('desensit'), ise('metabol', ISE_KISA), ise('metastas', ISE_KISA), ise('homogen'),
  { gb: 'organiser', us: 'organizer', ca: 'us', ekler: ['', 's'] },
  { gb: 'nebulis', us: 'nebuliz', ca: 'us', ekler: ['e', 'ed', 'er', 'ers', 'ation'] },
  { gb: 'unauthorised', us: 'unauthorized', ca: 'us' },
  { gb: 'unrecognised', us: 'unrecognized', ca: 'us' },
  // ── -yse / -yze. "analysis" is the same everywhere and is not a row; "analyses" is ambiguous and is not used. ──
  { gb: 'analys', us: 'analyz', ca: 'us', ekler: ['e', 'ed', 'ing', 'er', 'ers'] },
  { gb: 'paralys', us: 'paralyz', ca: 'us', ekler: ['e', 'ed', 'ing'] },
  // ── -our / -or ──
  our('col', ['', 's', 'ed', 'ing', 'ful']), our('fav', ['', 's', 'ed', 'ing', 'ite', 'ites', 'able']), our('hon', ['', 's', 'ed', 'ing']),
  our('behavi', ['', 's', 'al']), our('neighb', ['', 's', 'ing', 'hood']), our('lab', ['', 's', 'ed', 'ing']), our('tum'),
  our('hum'), our('od'), our('vap'), our('vig'), our('rum'), our('harb'), our('endeav', ['', 's', 'ed', 'ing']), our('flav', ['', 's', 'ed', 'ing']),
  { gb: 'discolour', us: 'discolor', ca: 'gb', ekler: ['ed', 'ation'] },
  // ── -re / -er ──
  re('cent'), re('lit'), re('millilit'), re('fib'), re('theat'), re('calib'), re('tit'),
  { gb: 'metre', us: 'meter', ca: 'gb', ekler: ['', 's'], belirsiz: true },
  { gb: 'centimetre', us: 'centimeter', ca: 'gb', ekler: ['', 's'] },
  { gb: 'millimetre', us: 'millimeter', ca: 'gb', ekler: ['', 's'] },
  { gb: 'kilometre', us: 'kilometer', ca: 'gb', ekler: ['', 's'] },
  { gb: 'centred', us: 'centered', ca: 'gb' },
  { gb: 'manoeuvre', us: 'maneuver', ca: 'gb', ekler: ['', 's'] },
  // ── doubled consonants ──
  cift('travel', ['ed', 'ing', 'er', 'ers']), cift('cancel'), cift('label'), cift('model'), cift('counsel', ['ed', 'ing', 'or', 'ors']),
  cift('signal'), cift('total'), cift('dial'), cift('level'), cift('fuel'), cift('channel'), cift('swivel'),
  { gb: 'enrol', us: 'enroll', ca: 'gb', ekler: ['', 's', 'ment', 'ments'] },
  { gb: 'fulfil', us: 'fulfill', ca: 'us', ekler: ['', 's', 'ment'] },
  { gb: 'skilful', us: 'skillful', ca: 'us', ekler: ['', 'ly'] },
  { gb: 'instalment', us: 'installment', ca: 'us', ekler: ['', 's'] },
  // ── -ce / -se, noun and verb ──
  { gb: 'licence', us: 'license', ca: 'gb', ekler: ['', 's'], belirsiz: true },
  { gb: 'practis', us: 'practic', ca: 'gb', ekler: ['e', 'ed', 'es', 'ing'], belirsiz: true },
  { gb: 'defence', us: 'defense', ca: 'gb', ekler: ['', 's'] },
  { gb: 'offence', us: 'offense', ca: 'gb', ekler: ['', 's'] },
  // ── single words ──
  { gb: 'programme', us: 'program', ca: 'us', au: 'program', ekler: ['', 's'], belirsiz: true },
  { gb: 'cheque', us: 'check', ca: 'gb', ekler: ['', 's'], belirsiz: true },
  { gb: 'grey', us: 'gray', ca: 'gb' },
  { gb: 'judgement', us: 'judgment', ca: 'us', ekler: ['', 's'] },
  { gb: 'acknowledgement', us: 'acknowledgment', ca: 'us', ekler: ['', 's'] },
  { gb: 'ageing', us: 'aging', ca: 'us' },
  { gb: 'sceptic', us: 'skeptic', ca: 'us', ekler: ['', 's', 'al'] },
  { gb: 'mould', us: 'mold', ca: 'gb', ekler: ['', 's'], belirsiz: true },
  { gb: 'tyre', us: 'tire', ca: 'us', ekler: ['', 's'], belirsiz: true },
  { gb: 'aluminium', us: 'aluminum', ca: 'us' },
  { gb: 'artefact', us: 'artifact', ca: 'us', ekler: ['', 's'] },
  { gb: 'sulphate', us: 'sulfate', ca: 'us' },
  { gb: 'sizeable', us: 'sizable', ca: 'us' },
]

export type Kok = { gb: string; us: string; ca: 'gb' | 'us' }

/** Stems of medical words, matched inside a word. */
export const KOKLER: readonly Kok[] = [
  { gb: 'orthopaed', us: 'orthoped', ca: 'us' },
  { gb: 'paediatr', us: 'pediatr', ca: 'us' },
  { gb: 'gynaec', us: 'gynec', ca: 'us' },
  { gb: 'anaesth', us: 'anesth', ca: 'us' },
  { gb: 'oesophag', us: 'esophag', ca: 'us' },
  { gb: 'oedem', us: 'edem', ca: 'us' },
  { gb: 'rrhoea', us: 'rrhea', ca: 'us' },
  { gb: 'pnoea', us: 'pnea', ca: 'us' },
  { gb: 'coeliac', us: 'celiac', ca: 'us' },
  { gb: 'oestr', us: 'estr', ca: 'us' },
  { gb: 'caesarean', us: 'cesarean', ca: 'us' },
  { gb: 'aetiolog', us: 'etiolog', ca: 'us' },
  { gb: 'haem', us: 'hem', ca: 'us' },
  { gb: 'aemi', us: 'emi', ca: 'us' },
  { gb: 'faec', us: 'fec', ca: 'us' },
]

/** Written the same in every form: Latin names of organisms. A stem leaves them alone. */
export const KORUNAN: readonly string[] = ['Haemophilus', 'faecalis', 'faecium']

/**
 * American spellings of medical words, as whole words — for the cross-check only (./varyant.test.ts and the packs'
 * own tests): what must not be found in a text of a form that writes these words the British way. The American
 * stems themselves ("hem", "emi", "estr") are parts of ordinary words and cannot be hunted, so the words are listed.
 */
export const ABD_TIBBI_YAZIMLAR: readonly string[] = [
  'anemia', 'anemic', 'pediatric', 'pediatrics', 'pediatrician', 'gynecology', 'gynecological', 'gynecologist', 'orthopedic', 'orthopedics',
  'anesthesia', 'anesthetic', 'anesthetist', 'anesthesiology', 'anesthesiologist', 'esophagus', 'esophageal', 'edema', 'diarrhea',
  'hematology', 'hematologist', 'hemoglobin', 'hemorrhage', 'hematuria', 'hematoma', 'hemodialysis', 'hemorrhoids', 'leukemia', 'ischemia',
  'ischemic', 'cesarean', 'estrogen', 'celiac', 'dyspnea', 'apnea', 'feces', 'fecal', 'etiology', 'hypoglycemia', 'hyperglycemia',
  'septicemia', 'amenorrhea', 'dysmenorrhea', 'seborrhea',
]
