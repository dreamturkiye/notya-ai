/**
 * NOTYA-SES-NORMAL-01 — the pronunciation dictionary of the medical speech layer (lib/ses/tibbiSeslendirme.ts).
 *
 * DATA ONLY. The logic never changes when an entry is added here. Every entry says where its reading comes from:
 *
 *   'sartname'  Dr. Gökhan's specification, as received (the text was cut off right after the BCG example —
 *               NOTYA-SES-NORMAL-02: the rest waits on Kaan).
 *   'talimat'   named, with its reading, in the technical team's instruction for this layer.
 *   'taslak'    DRAFT — chosen here so the engine does not spell the abbreviation letter by letter; to be confirmed
 *               or corrected by Dr. Gökhan. `npm run denetim:ses-kisaltma` lists the abbreviations real answers
 *               still carry, so this list grows from the corpus and not from guesses.
 *
 * Rules an entry must keep (lib/ses/tibbiSeslendirme.test.ts checks all of them):
 *   - a reading holds no digit and no unit symbol;
 *   - a reading never contains a written form of another entry (the layer is idempotent), unless that written form
 *     reads as itself ("Hib", "BCG");
 *   - `ad` is the head noun the reading ends with ("aşısı"). It is not said twice: "KKK aşısı" stays one "aşısı".
 */

export type SeslendirmeKaynagi = 'sartname' | 'talimat' | 'taslak'

export interface Okunus {
  /** The spoken words, without the head noun. */
  soz: string
  /** Head noun appended to `soz`, unless the text already continues with it ("aşısı", "aşıları", "aşılaması"). */
  ad?: string
  /** The reading ends in a third-person possessive ("aşısı", "Bakanlığı"): a case ending takes the buffer n ("aşısının"). */
  iyelik?: boolean
  /** A proper name: the case ending keeps its apostrophe ("Sağlık Bakanlığı'nın"). */
  ozel?: boolean
}

export interface KisaltmaGirdisi {
  /**
   * Written forms. Matched as whole tokens, case-sensitive, with I and İ taken as the same letter; the all-capital
   * spelling of each form matches too ("DABT", "HİB" / "HIB"). A hyphen matches any hyphen or en dash.
   */
  yazim: readonly string[]
  /** Default reading: the short natural form. */
  kisa: Okunus
  /** Reading when detail is asked (second stage of a tiered answer, or an explicit request). Absent = same as `kisa`. */
  detay?: Okunus
  /** A word, not an abbreviation ("Varicella"): lower-case, capitalised and all-capital spellings match. */
  kelime?: boolean
  kaynak: SeslendirmeKaynagi
}

const asi = (soz: string): Okunus => ({ soz, ad: 'aşısı', iyelik: true })
const duz = (soz: string): Okunus => ({ soz })
const iyelik = (soz: string): Okunus => ({ soz, iyelik: true })
const ozelAd = (soz: string): Okunus => ({ soz, iyelik: true, ozel: true })

export const KISALTMA_SOZLUGU: readonly KisaltmaGirdisi[] = [
  /* ───────────── vaccines ───────────── */
  // şartname: "DTaP in its natural medical pronunciation or, when needed, as difteri tetanos aselüler boğmaca aşısı".
  // The specification names no short pronunciation, so the full name is said in both modes.
  { yazim: ['DTaP'], kisa: asi('difteri tetanos aselüler boğmaca'), kaynak: 'sartname' },
  // şartname: "DaBT as difteri aselüler boğmaca tetanos" — said as given, no head noun added.
  { yazim: ['DaBT'], kisa: duz('difteri aselüler boğmaca tetanos'), kaynak: 'sartname' },
  // şartname: "preferably beşli karma aşı; when detail is needed difteri aselüler boğmaca tetanos inaktif polio ve Hib aşısı".
  { yazim: ['DaBT-İPA-Hib'], kisa: { soz: 'beşli karma', ad: 'aşı' }, detay: asi('difteri aselüler boğmaca tetanos inaktif polio ve Hib'), kaynak: 'sartname' },
  // şartname
  { yazim: ['KPA'], kisa: asi('konjuge pnömokok'), kaynak: 'sartname' },
  // şartname
  { yazim: ['KKK'], kisa: asi('kızamık kızamıkçık kabakulak'), kaynak: 'sartname' },
  // şartname
  { yazim: ['OPA'], kisa: asi('oral polio'), kaynak: 'sartname' },
  // şartname: "BCG as BCG aşısı" — the rest of this item was cut off (NOTYA-SES-NORMAL-02).
  { yazim: ['BCG'], kisa: asi('BCG'), kaynak: 'sartname' },
  // talimat (named without a reading; "Hib" is said as a word, as in the specification's long form)
  { yazim: ['Hib'], kisa: asi('Hib'), kaynak: 'talimat' },
  // talimat (named without a reading)
  { yazim: ['İPA'], kisa: asi('inaktif polio'), kaynak: 'talimat' },
  // talimat
  { yazim: ['MenACWY', 'Men-ACWY', 'MenACYW', 'MCV4'], kisa: asi('meningokok A C W Y'), kaynak: 'talimat' },
  // talimat
  { yazim: ['MenB', 'Men-B'], kisa: asi('meningokok B'), kaynak: 'talimat' },
  // talimat (named without a reading)
  { yazim: ['HepA', 'Hep-A', 'Hep A'], kisa: asi('hepatit A'), kaynak: 'talimat' },
  // talimat (named without a reading)
  { yazim: ['HepB', 'Hep-B', 'Hep B'], kisa: asi('hepatit B'), kaynak: 'talimat' },
  // talimat (named without a reading): the word is respelled as it is said, it is not renamed.
  { yazim: ['Rotavirus'], kisa: duz('rotavirüs'), kelime: true, kaynak: 'talimat' },
  // talimat (named without a reading)
  { yazim: ['Varicella', 'Varisella'], kisa: duz('varisella'), kelime: true, kaynak: 'talimat' },
  // talimat (named without a reading)
  { yazim: ['Influenza'], kisa: duz('influenza'), kelime: true, kaynak: 'talimat' },
  // taslak
  { yazim: ['DaBT-İPA'], kisa: { soz: 'dörtlü karma', ad: 'aşı' }, detay: asi('difteri aselüler boğmaca tetanos ve inaktif polio'), kaynak: 'taslak' },
  // taslak
  { yazim: ['DaBT-İPA-Hib-HepB', 'DaBT-İPA-Hib-Hep B', 'DaBT-İPA-HepB-Hib'], kisa: { soz: 'altılı karma', ad: 'aşı' }, detay: asi('difteri aselüler boğmaca tetanos inaktif polio hepatit B ve Hib'), kaynak: 'taslak' },
  // taslak
  { yazim: ['Td'], kisa: asi('tetanos difteri'), kaynak: 'taslak' },
  // taslak
  { yazim: ['Tdap', 'Tdab', 'TdaP', 'TdaB'], kisa: asi('tetanos difteri aselüler boğmaca'), kaynak: 'taslak' },
  // taslak
  { yazim: ['KKKS', 'KKKV'], kisa: asi('kızamık kızamıkçık kabakulak suçiçeği'), kaynak: 'taslak' },
  // taslak
  { yazim: ['KPA13', 'KPA-13', 'PCV13', 'PCV-13'], kisa: asi('on üç valanlı konjuge pnömokok'), kaynak: 'taslak' },
  // taslak
  { yazim: ['HPV'], kisa: asi('insan papilloma virüsü'), kaynak: 'taslak' },

  /* ───────────── institutions, guides, screening tools ───────────── */
  // talimat
  { yazim: ['SB'], kisa: ozelAd('Sağlık Bakanlığı'), kaynak: 'talimat' },
  // talimat: always the full name.
  { yazim: ['GİDR'], kisa: ozelAd('Gelişimi İzleme ve Destekleme Rehberi'), kaynak: 'talimat' },
  // talimat
  { yazim: ['M-CHAT-R/F', 'M-CHAT-R', 'M-CHAT', 'MCHAT-R/F', 'MCHAT-R', 'MCHAT'], kisa: duz('em çat'), kaynak: 'talimat' },
  // taslak
  { yazim: ['DSÖ', 'WHO'], kisa: ozelAd('Dünya Sağlık Örgütü'), kaynak: 'taslak' },

  /* ───────────── diagnoses ───────────── */
  // talimat
  { yazim: ['AOM'], kisa: duz('akut otitis media'), kaynak: 'talimat' },
  // talimat
  { yazim: ['ÜSYE', 'USYE'], kisa: iyelik('üst solunum yolu enfeksiyonu'), kaynak: 'talimat' },
  // taslak
  { yazim: ['ASYE'], kisa: iyelik('alt solunum yolu enfeksiyonu'), kaynak: 'taslak' },
  // taslak
  { yazim: ['İYE'], kisa: iyelik('idrar yolu enfeksiyonu'), kaynak: 'taslak' },
  // taslak
  { yazim: ['AGE'], kisa: duz('akut gastroenterit'), kaynak: 'taslak' },
  // taslak
  { yazim: ['GÖR', 'GÖRH'], kisa: duz('gastroözofageal reflü'), kaynak: 'taslak' },
  // taslak
  { yazim: ['DEA'], kisa: iyelik('demir eksikliği anemisi'), kaynak: 'taslak' },

  /* ───────────── laboratory ───────────── */
  // talimat
  { yazim: ['Hb', 'Hgb'], kisa: duz('hemoglobin'), kaynak: 'talimat' },
  // talimat (named without a reading): the letters as clinicians say them; the full name when detail is asked.
  { yazim: ['MCV'], kisa: duz('em si vi'), detay: iyelik('ortalama eritrosit hacmi'), kaynak: 'talimat' },
  // talimat
  { yazim: ['TDBK'], kisa: iyelik('total demir bağlama kapasitesi'), kaynak: 'talimat' },
  // talimat (named without a reading)
  { yazim: ['CRP'], kisa: duz('se re pe'), detay: duz('se reaktif protein'), kaynak: 'talimat' },
  // talimat
  { yazim: ['BKİ'], kisa: iyelik('beden kitle indeksi'), kaynak: 'talimat' },
  // taslak
  { yazim: ['VKİ'], kisa: iyelik('vücut kitle indeksi'), kaynak: 'taslak' },
  // taslak
  { yazim: ['Hct', 'Htc', 'Hkt'], kisa: duz('hematokrit'), kaynak: 'taslak' },
  // taslak
  { yazim: ['MCH'], kisa: iyelik('ortalama eritrosit hemoglobini'), kaynak: 'taslak' },
  // taslak
  { yazim: ['MCHC'], kisa: iyelik('ortalama eritrosit hemoglobin konsantrasyonu'), kaynak: 'taslak' },
  // taslak
  { yazim: ['RDW'], kisa: iyelik('eritrosit dağılım genişliği'), kaynak: 'taslak' },
  // taslak
  { yazim: ['WBC'], kisa: duz('lökosit'), kaynak: 'taslak' },
  // taslak
  { yazim: ['RBC'], kisa: duz('eritrosit'), kaynak: 'taslak' },
  // taslak
  { yazim: ['PLT'], kisa: duz('trombosit'), kaynak: 'taslak' },
  // taslak
  { yazim: ['HbA1c', 'HbA1C'], kisa: duz('hemoglobin a bir ce'), kaynak: 'taslak' },
  // taslak
  { yazim: ['ESH'], kisa: iyelik('eritrosit sedimentasyon hızı'), kaynak: 'taslak' },
  // taslak
  { yazim: ['TSH'], kisa: duz('te se ha'), detay: duz('tiroid stimülan hormon'), kaynak: 'taslak' },
  // taslak
  { yazim: ['sT4'], kisa: duz('serbest te dört'), kaynak: 'taslak' },
  // taslak
  { yazim: ['sT3'], kisa: duz('serbest te üç'), kaynak: 'taslak' },
  // taslak
  { yazim: ['TİT'], kisa: iyelik('tam idrar tetkiki'), kaynak: 'taslak' },
  // taslak
  { yazim: ['B12'], kisa: duz('be on iki'), kaynak: 'taslak' },
  // taslak
  { yazim: ['SpO2', 'SpO₂', 'SPO2'], kisa: iyelik('oksijen satürasyonu'), kaynak: 'taslak' },

  /* ───────────── examination, imaging ───────────── */
  // taslak
  { yazim: ['BÇ'], kisa: iyelik('baş çevresi'), kaynak: 'taslak' },
  // taslak
  { yazim: ['TA'], kisa: duz('tansiyon'), kaynak: 'taslak' },
  // taslak
  { yazim: ['USG'], kisa: duz('ultrasonografi'), kaynak: 'taslak' },
  // taslak
  { yazim: ['EKG'], kisa: duz('e ke ge'), detay: duz('elektrokardiyografi'), kaynak: 'taslak' },
  // taslak
  { yazim: ['EKO'], kisa: duz('ekokardiyografi'), kaynak: 'taslak' },
  // taslak
  { yazim: ['EEG'], kisa: duz('e e ge'), detay: duz('elektroensefalografi'), kaynak: 'taslak' },
]

/* ───────────────────────────── units ───────────────────────────── */

export interface BirimGirdisi {
  /** Written forms, matched without regard to case, only right after a number. */
  yazim: readonly string[]
  soz: string
  kaynak: SeslendirmeKaynagi
}

/** Units said after the number: "13,3 kg" → "on üç virgül üç kilogram". */
export const BIRIM_SOZLUGU: readonly BirimGirdisi[] = [
  // ── Dr. Gökhan / Boss lab-unit list (NOTYA-SES-ELEVEN-NORMAL-01, 2026-10-03) ──
  { yazim: ['kg'], soz: 'kilogram', kaynak: 'talimat' },
  { yazim: ['g', 'gr'], soz: 'gram', kaynak: 'talimat' }, // g/dL → gram desilitre
  { yazim: ['mg'], soz: 'miligram', kaynak: 'talimat' }, // mg/dL → miligram desilitre
  { yazim: ['mcg', 'µg', 'μg'], soz: 'mikrogram', kaynak: 'talimat' }, // µg/dL → mikrogram desilitre
  { yazim: ['ng'], soz: 'nanogram', kaynak: 'talimat' }, // ng/mL → nanogram mililitre
  { yazim: ['pg'], soz: 'pikogram', kaynak: 'talimat' }, // pg/mL → pikogram mililitre
  { yazim: ['mL', 'ml', 'cc'], soz: 'mililitre', kaynak: 'talimat' },
  { yazim: ['dL', 'dl'], soz: 'desilitre', kaynak: 'talimat' },
  { yazim: ['L', 'lt'], soz: 'litre', kaynak: 'talimat' },
  { yazim: ['mEq', 'meq'], soz: 'miliekivalan', kaynak: 'talimat' }, // mEq/L → miliekivalan litre
  { yazim: ['mmol'], soz: 'milimol', kaynak: 'talimat' }, // mmol/L → milimol litre
  { yazim: ['IU', 'İÜ'], soz: 'enternasyonel ünite', kaynak: 'talimat' }, // IU/mL
  { yazim: ['U'], soz: 'ünite', kaynak: 'talimat' }, // U/L → ünite litre
  { yazim: ['mmHg', 'mm Hg'], soz: 'milimetre cıva', kaynak: 'talimat' },
  { yazim: ['cmH2O', 'cmH₂O', 'cm H2O', 'cmH20'], soz: 'santimetre su', kaynak: 'talimat' },

  // ── length / size ──
  { yazim: ['cm'], soz: 'santimetre', kaynak: 'talimat' },
  { yazim: ['mm'], soz: 'milimetre', kaynak: 'talimat' },

  // ── temperature ──
  { yazim: ['°C', '° C', '℃', '°'], soz: 'derece', kaynak: 'talimat' },

  // ── blood-cell / haematology volumes ──
  { yazim: ['fL', 'fl'], soz: 'femtolitre', kaynak: 'talimat' },
  { yazim: ['µL', 'μL', 'uL'], soz: 'mikrolitre', kaynak: 'talimat' },
  { yazim: ['nL', 'nl'], soz: 'nanolitre', kaynak: 'taslak' },

  // ── molar / chemical ──
  { yazim: ['µmol', 'μmol', 'umol'], soz: 'mikromol', kaynak: 'talimat' },
  { yazim: ['nmol'], soz: 'nanomol', kaynak: 'talimat' },
  { yazim: ['pmol'], soz: 'pikomol', kaynak: 'talimat' },
  { yazim: ['µEq', 'μEq', 'ueq'], soz: 'mikroekivalan', kaynak: 'taslak' },
  { yazim: ['mOsm', 'mosm'], soz: 'miliosmol', kaynak: 'talimat' },

  // ── enzyme / activity units ──
  { yazim: ['mIU', 'mU'], soz: 'miliünite', kaynak: 'talimat' },
  { yazim: ['µIU', 'μIU', 'uIU'], soz: 'mikroünite', kaynak: 'talimat' },
  { yazim: ['kU', 'kIU'], soz: 'kiloünite', kaynak: 'taslak' },
  { yazim: ['µkat', 'μkat', 'ukat'], soz: 'mikrokatal', kaynak: 'taslak' },
  { yazim: ['nkat'], soz: 'nanokatal', kaynak: 'taslak' },

  // ── pressure / gas (beyond mmHg / cmH2O) ──
  { yazim: ['kPa'], soz: 'kilopaskal', kaynak: 'talimat' },
  { yazim: ['atm'], soz: 'atmosfer', kaynak: 'taslak' },
  { yazim: ['torr'], soz: 'torr', kaynak: 'taslak' },

  // ── energy / radiation / imaging ──
  { yazim: ['kcal'], soz: 'kilokalori', kaynak: 'talimat' },
  { yazim: ['kJ'], soz: 'kilojul', kaynak: 'taslak' },
  { yazim: ['mGy'], soz: 'miligray', kaynak: 'taslak' },
  { yazim: ['cGy'], soz: 'santigray', kaynak: 'taslak' },
  { yazim: ['Gy'], soz: 'gray', kaynak: 'taslak' },
  { yazim: ['MBq'], soz: 'megabekerel', kaynak: 'taslak' },
  { yazim: ['Bq'], soz: 'bekerel', kaynak: 'taslak' },
  { yazim: ['HU'], soz: 'Hounsfield birimi', kaynak: 'taslak' },

  // ── concentration helpers ──
  { yazim: ['ppm'], soz: 'milyonda bir', kaynak: 'taslak' },
  { yazim: ['ppb'], soz: 'milyarda bir', kaynak: 'taslak' },
  { yazim: ['vol%'], soz: 'hacim yüzde', kaynak: 'taslak' },

  // ── time ──
  { yazim: ['dk', 'dak'], soz: 'dakika', kaynak: 'talimat' },
  { yazim: ['sn'], soz: 'saniye', kaynak: 'talimat' },
  { yazim: ['ms'], soz: 'milisaniye', kaynak: 'taslak' },

  // ── pulse / vent rate shorthand ──
  { yazim: ['bpm'], soz: 'dakikada atım', kaynak: 'taslak' },

  // ── growth / stats ──
  { yazim: ['SD', 'SDS'], soz: 'standart sapma', kaynak: 'talimat' },
]

export interface PaydaGirdisi {
  /** Written forms of a denominator ("/kg", "/gün", "/dk"), without the slash. */
  yazim: readonly string[]
  /** Said BEFORE the number: "50 mg/kg/gün" → "günde kilogram başına elli miligram". */
  soz: string
  kaynak: SeslendirmeKaynagi
}

/**
 * Denominators that are said before the number. A denominator that is not listed here is a plain unit and is said
 * after the numerator, as the instruction gives it: "mg/dL" → "miligram desilitre".
 */
export const PAYDA_SOZLUGU: readonly PaydaGirdisi[] = [
  { yazim: ['gün', 'gun', '24s', '24h'], soz: 'günde', kaynak: 'talimat' },
  { yazim: ['kg'], soz: 'kilogram başına', kaynak: 'talimat' },
  { yazim: ['dk', 'dak', 'dakika', 'min'], soz: 'dakikada', kaynak: 'talimat' },
  { yazim: ['doz'], soz: 'doz başına', kaynak: 'taslak' },
  { yazim: ['saat', 'sa', 'h', 'hr'], soz: 'saatte', kaynak: 'taslak' },
  { yazim: ['hafta'], soz: 'haftada', kaynak: 'taslak' },
  { yazim: ['ay'], soz: 'ayda', kaynak: 'taslak' },
  { yazim: ['m²', 'm2'], soz: 'metrekare başına', kaynak: 'taslak' },
  { yazim: ['mm³', 'mm3'], soz: 'milimetreküpte', kaynak: 'taslak' },
  { yazim: ['µL', 'μL', 'uL'], soz: 'mikrolitrede', kaynak: 'taslak' },
]

/** Words that may stand between the number and "/dk": "110 atım/dk" → "dakikada yüz on atım". */
export const SAYILAN_SOZLER: readonly string[] = ['atım', 'vuru', 'soluk', 'solunum', 'damla', 'ölçek', 'doz', 'kez', 'tablet', 'kapsül', 'puf']

/** Readings of the number forms. All 'talimat' unless a comment says draft. */
export const SAYI_SOZLERI = {
  ondalik: 'virgül',
  yuzde: 'yüzde',
  yuzdelik: 'yüzdelik',
  zSkoru: 'Z skoru',
  arti: 'artı',
  eksi: 'eksi',
  aralik: 'ile',
  /** taslak: blood pressure "132/85" → "yüz otuz iki bölü seksen beş". */
  bolu: 'bölü',
  /** taslak: posology "3x1" → "üç kere bir". */
  kere: 'kere',
} as const

export const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'] as const

/** Words before a number that make it an id, not a quantity: the number is left as written (it is never spoken). */
export const KIMLIK_ONCULU = ['no', 'numara', 'numarası', 'protokol', 'barkod', 'kimlik', 'tc', 't.c.', 'tckn', 'id', 'kod', 'kodu', 'sicil'] as const
