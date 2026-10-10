/**
 * NOTYA-ULKE-ARACLAR-01 — THE TOOLS of a country build: the shapes. Types and constants only; no text of any country.
 *
 * A tool is two halves that meet by key:
 *
 *   the KIT's half   (./katalog.ts)   what the tool asks for (fields), what it works out (a pure function that
 *                                     returns numbers and keys, never a sentence), and the published source of the
 *                                     arithmetic. The same in every country.
 *   the PACK's half  (countries/<code>/…, through countries/active/arayuz → `araclar`)
 *                                     which tools are switched on in this country, WHICH ROLES SEE EACH, and every
 *                                     word on its screen in every language form of the pack.
 *
 * A tool exists in a country build only when BOTH halves name it. The kit holds no tool of a single country's state
 * or payer system, and a pack cannot switch on a key the kit does not have (lib/ulke/araclar/denetim.ts; the wall
 * check scripts/ulke-duvarlari.mjs, rule D7, refuses the keys of countries/yasak-araclar.json outright).
 *
 * CLASSIFY BEFORE ADDING (.cursor/skills/specialty-doktor-araclari/SKILL.md), in a pack as in the registry of the
 * pre-split application: every tool a pack lists says `roller: null` (base: the same for every role) or names its
 * roles. There is no default, and "it is a universal calculator" is not an answer to "who sees it".
 *
 * NO REFERENCE CONTENT IN THE KIT: no vaccination calendar, drug list, dosing table, national protocol or reference
 * range of a national authority. A tool that needs one is a SLOT in the pack (`yuvalar`): marked, empty, switched
 * off, naming what is missing and who must supply it.
 *
 * ── NOTYA-ULKE-OZEL-01 — WHAT ONE COUNTRY CAN DO WITHOUT TOUCHING ANOTHER (docs/COUNTRY-PACK-HOWTO.md, "Country-only
 * tools and roles"). Every field below is optional, so a pack that uses none of them is exactly what it was. ──
 *
 *   a tool only this country has     UlkeAraclari.kendiAraclari (its mechanism, in the pack's own folder) + an entry in
 *                                    `araclar`; or a placeholder in `yuvalar`. The key begins with the country's code
 *                                    ("ca-…") and is listed for that country in countries/yasak-araclar.json.
 *   who sees a shared tool           PaketAraci.roller is the pack's own list; `sinif: 'hekimler'` = every DOCTOR role
 *                                    (not the allied professions), distinct from base (`roller: null`).
 *   other names, bands and steps     every word is the pack's (AracMetni); PaketAraci.uyarlama restates the bands over a
 *                                    result number, or the options of a field the kit marks `secenekSerbest`.
 *   numbers in the country's unit    PaketAraci.parametreler takes `{ deger, birim }`; PaketAraci.tablolar supplies a
 *                                    table; UlkeAraclari.labBirimleri may accept several units for one quantity (the
 *                                    doctor chooses: a number without its unit gives no result).
 *   by the patient's age and sex     PaketAraci.hasta, with the sentence that says who the tool is for.
 *   licence                          PaketAraci.lisans and AracYuvasi.lisans; a tool that is not free or permitted
 *                                    cannot be switched on. `baglanti` = a tile that only opens an outside calculator.
 *
 * ── NOTYA-ULKE-ARAC-DUZELTME-01 — WHAT THE CORRECTION OF THE SHARED TOOLS ADDED (docs/araclar-denetim/DUZELTMELER.md).
 * Each is optional again: a pack that states none of them gets the kit's own, sourced, behaviour. ──
 *
 *   a number the country MAY state   AracTanimi.secimlikParametreler (the range of the expected height; the hearing
 *                                    asymmetry rule; the PSA interval caution): absent = the tool leaves it out.
 *   a table the country MAY supply   AracTablosu.istege, and a field whose options are the rows of that table
 *                                    (AracAlani.tablodan): the steps of a return to sport. No table, no field, no step.
 *   its own choice of fields         AracTanimi.alanGruplari + PaketAraci.uyarlama.alanlar (the hearing frequencies).
 *   bands by a choice, not a number  AracTanimi.bantAlani: the band is the option chosen in one field.
 *   how a dose is written            UlkeAraclari.dozYazimi, required of a pack that switches on a tool marked
 *                                    `dozYazar`: with or without a zero after the decimal mark (./yazim.ts).
 *   the unit the doctor typed in     reaches the arithmetic as `<field>.birim` for every laboratory field, so a limit
 *                                    printed in two units is compared in the unit of the value (KDIGO albuminuria).
 */
import type { BicimliMetin } from '../arayuz/tipler'
import type { AraclarMetni } from '../arayuz/metinTipleri'
import type { DilKodu } from '../tipler'

/**
 * A laboratory quantity whose UNIT is the country's choice (the pack states it; the kit converts before it computes).
 * `hba1c`, `crp` and `psa` since NOTYA-ULKE-ARAC-DUZELTME-01 (lib/ulke/araclar/birimler.ts states each conversion and its source).
 */
export type LabOlcusu = 'kreatinin' | 'hemoglobin' | 'glukoz' | 'kolesterol' | 'albuminKreatinin' | 'hba1c' | 'crp' | 'psa'

/**
 * A quantity ONLY ONE COUNTRY'S OWN TOOL reads (UlkeAraclari.olculer): its key begins with that country's code and a
 * hyphen ("ca-hba1c"), so it can never be taken for one of the kit's (which carry no hyphen).
 */
export type UlkeOlcusu = `${string}-${string}`
/** The key of a quantity a field or a number is measured in: one of the kit's, or one of the pack's own. */
export type OlcuAnahtari = LabOlcusu | UlkeOlcusu

/**
 * How a value typed in a unit becomes the value the arithmetic takes: a factor (typed × factor), or a factor and a
 * shift (typed × carpan + kaydirma) where two scales of one measurement do not share their zero.
 */
export type BirimDonusumu = number | { carpan: number; kaydirma: number }
/** A quantity: the unit the arithmetic uses, and every unit it may be typed in with its way to that unit. */
export type OlcuTanimi = { kanonik: string; birimler: Readonly<Record<string, BirimDonusumu>> }
/** A number stated WITH its unit: a threshold a country writes the way its laboratories report it. */
export type BirimliSayi = { deger: number; birim: string }

export type AracAlani = {
  /** Lower-case letters, digits, underscores. The key of the field's label in the pack. Never shown. */
  anahtar: string
  /**
   * sayi    a number the doctor types          secim   one of a few options
   * isaret  a tick-box                         tarih   a day
   * puan    a whole score from enAz to enCok   (an item of a scale)
   * metin   a few words of the doctor's own (a region, a label): never read by the arithmetic, repeated in the summary
   */
  tur: 'sayi' | 'secim' | 'isaret' | 'tarih' | 'puan' | 'metin'
  enAz?: number
  enCok?: number
  /** true = only whole numbers. */
  tam?: boolean
  /** A unit of the field's own: a code the pack names (`birimler`). */
  birim?: string
  /** Measured in the PACK's unit of length or weight (`uygulama.birimler`); the kit hands the function cm / kg. */
  olcu?: 'boy' | 'agirlik'
  /**
   * A laboratory value in the unit the pack chose for it (`labBirimleri`); the kit hands the function the canonical
   * unit. Where the pack accepts SEVERAL units for the quantity, the doctor chooses one beside the field, and a
   * number without its unit is not a value.
   */
  lab?: OlcuAnahtari
  /** Option keys of a `secim`, in the order they are offered. */
  secenekler?: readonly string[]
  /**
   * true = THE ARITHMETIC ONLY REPEATS THIS CHOICE (it never compares it with one of the keys): a country may restate
   * the list of options, their number included (`PaketAraci.uyarlama.secenekler`). Never set where `hesapla` reads a
   * particular option.
   */
  secenekSerbest?: boolean
  /**
   * THE OPTIONS ARE THE COUNTRY'S, FROM A TABLE IT SUPPLIES (NOTYA-ULKE-ARAC-DUZELTME-01): the choice offers the keys of
   * column `sutun` of the pack's table `tablo`, in the table's order. THE KIT HOLDS NONE: where the pack supplies no
   * such table the field has no option and is NOT THERE (`alanVarMi`), and the tool answers without it.
   */
  tablodan?: { tablo: string; sutun: string }
  /** true = may be left empty; the tool still answers. */
  istege?: boolean
  /** Shown, and read, only while the choice field `alan` holds one of `degerler`. Otherwise the field is not there. */
  kosul?: { alan: string; degerler: readonly string[] }
  /**
   * true = an item of a published questionnaire whose WORDING belongs to its authors. The pack need not name it:
   * the screen then shows the item's number, and the doctor reads the item from the authorised form in their hand.
   */
  numarali?: boolean
}

/** What the doctor entered, already narrowed: a number in the canonical unit, an option key, a tick, an ISO day. */
export type AracGirdisi = Readonly<Record<string, number | string | boolean | null>>

export type AracSayisi = {
  anahtar: string; deger: number; /** Decimal places shown. */ ondalik: number; /** The scale's maximum, shown as "12 / 35". */ enCok?: number; /** A unit code the pack names. */ birim?: string; /** A length or a weight in cm / kg: shown in the PACK's unit of that measure. */ olcu?: 'boy' | 'agirlik'
  /**
   * AT LEAST THIS MANY SIGNIFICANT FIGURES (NOTYA-ULKE-ARAC-DUZELTME-01): where `ondalik` places would show fewer, more
   * places are written, so that a small amount is never written as "0.0" or with one figure only. It is how the
   * ARITHMETIC'S RESULT is written, not a rounding to anything that can be measured (./yazim.ts → gosterimOndaligi).
   */
  anlamli?: number
  /**
   * true = AN AMOUNT OF A MEDICINE (a dose, a volume of a dose): written by the PACK's rule for writing a dose
   * (`UlkeAraclari.dozYazimi`): with or without a zero after the decimal mark.
   */
  doz?: boolean
}

/** The answer of a tool: numbers and keys. Every key is named by the pack; the kit writes no sentence. */
export type AracSonucu = {
  /** false = something required is missing or out of range: nothing is interpreted, no band, no date. */
  tamam: boolean
  sayilar: readonly AracSayisi[]
  /** The band the result falls in, or null. */
  bant: string | null
  /** Warnings that apply. */
  uyarilar: readonly string[]
  /** Days worked out by the tool. */
  tarihler: readonly { anahtar: string; tarih: string }[]
}

/** One row of a table a country supplies: column key → a number (already in the kit's unit) or a key. */
export type AracTabloSatiri = Readonly<Record<string, number | string>>
/**
 * What a tool's arithmetic is handed beside the form: today, the country's numbers (`p`, each already in the unit
 * the arithmetic uses) and — where the tool asks for one — the country's tables (`t`, laboratory columns already in
 * the unit the arithmetic uses). Built by lib/ulke/araclar/paket.ts → aracOrtami, for the screen and for the server.
 */
export type AracOrtami = {
  bugun: string; p: Readonly<Record<string, number>>; t?: Readonly<Record<string, readonly AracTabloSatiri[]>>
  /** Where the country chose the fields of a group (`AracTanimi.alanGruplari`): group → the field keys it has, in the kit's order. Absent = the kit's own. */
  alanlar?: Readonly<Record<string, readonly string[]>>
}

/** `baglanti` = a tile that ONLY OPENS AN OUTSIDE CALCULATOR: no field, no arithmetic, nothing kept. A pack's, never the kit's. */
export type AracTuru = 'hesap' | 'olcek' | 'liste' | 'takvim' | 'ekran' | 'baglanti'

/** A table a tool leaves to the country: its key, and the columns every row must have. */
export type AracTablosu = {
  anahtar: string
  /**
   * true = THE COUNTRY MAY SUPPLY IT, AND NEED NOT (NOTYA-ULKE-ARAC-DUZELTME-01): without it the tool answers WITHOUT
   * what the table would add: it never falls back on a table of the kit's own. A table that IS supplied is held to
   * the same checks as a required one, and a table that cannot be read gives no result.
   */
  istege?: boolean
  sutunlar: readonly { anahtar: string; /** sayi = a number; anahtar = a key the tool returns or compares */ tur: 'sayi' | 'anahtar'; /** The laboratory quantity a number column is measured in: the pack states the column's unit. */ lab?: OlcuAnahtari }[]
}

export type AracTanimi = {
  /** Lower-case words joined by hyphens. Also the tool's address: /tools?arac=<anahtar>. */
  anahtar: string
  /** hesap = a formula; olcek = a scored scale; liste = a checklist or structured note; takvim = dates; ekran = a screen of the kit's own (`ekran`). */
  tur: AracTuru
  alanlar: readonly AracAlani[]
  /** Every key `hesapla` can return. The pack names each one in every form; the pack check requires it. */
  cikti: { sayilar: readonly string[]; bantlar: readonly string[]; uyarilar: readonly string[]; tarihler: readonly string[] }
  /**
   * NUMBERS THE COUNTRY DECIDES, by key: a threshold between two bands, the months until the next check. They are
   * local clinical guidance, not arithmetic, so the kit holds none of them: a pack that switches the tool on states
   * every one (`PaketAraci.parametreler`), with its source, and a pack that cannot is left with a slot.
   */
  parametreler?: readonly string[]
  /**
   * Which of those numbers is a LABORATORY VALUE, and of which quantity: the pack then states it WITH ITS UNIT
   * (`{ deger, birim }`) and the kit converts it before the tool compares anything. A bare number is refused there.
   */
  parametreOlculeri?: Readonly<Record<string, OlcuAnahtari>>
  /**
   * NUMBERS THE COUNTRY MAY STATE, AND NEED NOT (NOTYA-ULKE-ARAC-DUZELTME-01), by key. Where the pack states one, the
   * arithmetic is handed it as `p[key]`; where it does not, `p[key]` is absent and the tool leaves out what depends on
   * it, or uses the rule its definition documents with its source. ONE EXCEPTION, said where it stands: the 90 days
   * of `psa-hizi` (`kisa_aralik_gun`) is the number the tool always had, WITHOUT a source; it was left as it was and
   * made something a country can change or turn off (docs/araclar-denetim/DUZELTMELER.md, fault 14).
   * A stated number is held to the same checks as a required one (`parametreOlculeri` applies to these keys too).
   */
  secimlikParametreler?: readonly string[]
  /**
   * A SET OF FIELDS A COUNTRY MAY CHOOSE FROM (NOTYA-ULKE-ARAC-DUZELTME-01), by group. `alanlar` holds the kit's own
   * choice; a pack names its own from `secenekler` (`PaketAraci.uyarlama.alanlar`), at least `enAz` of them; they
   * take the place of the kit's, in the kit's order, and `hesapla` is handed the chosen keys (`ortam.alanlar`).
   */
  alanGruplari?: Readonly<Record<string, { secenekler: readonly AracAlani[]; enAz: number }>>
  /**
   * THE BAND IS THE OPTION CHOSEN IN THIS FIELD (the arithmetic only repeats it): where the country's options for the
   * field are its own (`secenekSerbest` and `uyarlama.secenekler`, or `tablodan`), the bands are those options.
   */
  bantAlani?: string
  /**
   * RESULT UNITS THAT FOLLOW A LABORATORY QUANTITY'S UNIT: quantity → what is added to the unit code the value was
   * typed in ("/yil": a value typed in "ng/mL" gives a result in "ng/mL/yil"). The pack names each such code for
   * every unit it accepts for the quantity.
   */
  sonucLabEkleri?: Readonly<Partial<Record<LabOlcusu, string>>>
  /** Which numbers of the RESULT are a laboratory value: a country's own bands over one are stated with the unit. */
  sayiOlculeri?: Readonly<Record<string, OlcuAnahtari>>
  /** TABLES THE COUNTRY SUPPLIES (a grid of categories, a list of steps with their limits): handed to `hesapla` as `ortam.t`. */
  tablolar?: readonly AracTablosu[]
  /**
   * true = NOTHING ELSE IN THE RESULT DEPENDS ON THE BAND (no warning, no date, no number is worked out from it): a
   * country may restate the bands over one number of the result, their count included (`PaketAraci.uyarlama.bantlar`).
   * Never set where a warning or a date of the tool follows from its band.
   */
  bantSerbest?: boolean
  /** Pure. `bugun` is the day in the account's time zone (YYYY-MM-DD); `p` holds the pack's value for every key of `parametreler`. */
  hesapla: (g: AracGirdisi, ortam: AracOrtami) => AracSonucu
  /** The published source of the arithmetic, as a citation; null where the tool is a list of the product's own. Shown under the result. */
  kaynak: string | null
  /** For `tur: 'ekran'`: the kit screen that is the tool (it has no fields). */
  ekran?: 'hastaPortali' | 'takipPaneli' | 'sablonlarim' | 'konsultasyonlar'
  /** true = the tool WRITES AN AMOUNT OF A MEDICINE (a result number marked `doz`): the pack must state how a dose is written (`UlkeAraclari.dozYazimi`). */
  dozYazar?: boolean
  /** Unit codes the RESULT's numbers carry (the fields' units are on the fields). The pack names each. */
  sonucBirimleri?: readonly string[]
  /** Measures of the pack (length, weight) a RESULT is written in. */
  sonucOlculeri?: readonly ('boy' | 'agirlik')[]
}

// ───────────────────────── the pack's half ─────────────────────────

/** Every word of one tool's screen. Records are keyed by the keys of the kit's definition. */
export type AracMetni = {
  /** The tile's title and the screen's heading. */
  ad: BicimliMetin
  /** One or two sentences: what the tool does. On the tile and under the heading. Also what the search reads. */
  aciklama: BicimliMetin
  /** Field key → label. A `numarali` field may be left out. */
  alanlar: Readonly<Record<string, BicimliMetin>>
  /** Field key → option key → name. */
  secenekler?: Readonly<Record<string, Readonly<Record<string, BicimliMetin>>>>
  sayilar?: Readonly<Record<string, BicimliMetin>>
  bantlar?: Readonly<Record<string, BicimliMetin>>
  uyarilar?: Readonly<Record<string, BicimliMetin>>
  tarihler?: Readonly<Record<string, BicimliMetin>>
  /** The line under every result: what the tool is not (a diagnosis, a dose, a decision). */
  not: BicimliMetin
  /** WHO THE TOOL IS FOR, in one sentence ("for adults aged 18 and over"). Required where the tool has a patient gate (`PaketAraci.hasta`). */
  hastaKapisi?: BicimliMetin
  /** The words of the link of a link-out tile ("Open the calculator on the society's site"). Required where the tool is one (`PaketAraci.baglanti`). */
  baglanti?: BicimliMetin
}

// ───────────────────────── NOTYA-ULKE-OZEL-01: what one country states for a tool ─────────────────────────

/** The five licence states of a tool or a placeholder. Only the two in LISANS_ACIK may be switched on. */
export const LISANS_DURUMLARI = ['serbest', 'izin-gerekli', 'ucretli', 'belirsiz', 'izin-alindi'] as const
/** serbest = free to implement; izin-gerekli = permission needed; ucretli = a paid licence; belirsiz = unclear, not read; izin-alindi = permission granted. */
export type LisansDurumu = (typeof LISANS_DURUMLARI)[number]
export const LISANS_ACIK: readonly LisansDurumu[] = ['serbest', 'izin-alindi']

export type AracLisansi = {
  durum: LisansDurumu
  /** Who holds the rights (a society, a publisher, a state). Required for every state but `serbest`. */
  hakSahibi?: string
  /** Where the terms were read, or where the permission is recorded. Required for `izin-alindi`. */
  kaynak?: string
  /** THE RIGHTS HOLDER'S NOTICE, as it must stand under a result: shown there and copied with the summary. Every form. */
  bildirim?: BicimliMetin
}

/**
 * A TOOL BY THE PATIENT, beside the role. Age is in whole years on the account's own day. Opened for a patient, a
 * tool whose gate does not hold is not there; AN UNKNOWN BIRTH DATE OR SEX NEVER OPENS IT.
 */
export type HastaKapisi = { enAzYas?: number; enCokYas?: number; cinsiyet?: 'female' | 'male' }

/** A country's own BANDS over one number of the result, in order: the first row whose upper limit the value is below. */
export type BantTablosu = {
  /** The key of the result number the bands are read from. */
  sayi: string
  /** The unit the limits are stated in — required where the number is a laboratory value (`AracTanimi.sayiOlculeri`). */
  birim?: string
  /**
   * `ust` = the value is BELOW this limit (`dahil: true` = at or below). The LAST row has `ust: null`: every value
   * falls in a band, so a value above the last limit is never left without one.
   */
  satirlar: readonly { ust: number | null; dahil?: boolean; bant: string }[]
}

/** How this country RESHAPES a tool of the kit. The words are the pack's as always (AracMetni). */
export type AracUyarlamasi = {
  /** Field → the options this country offers, in order. Only a field the kit marks `secenekSerbest`. */
  secenekler?: Readonly<Record<string, readonly string[]>>
  /** The country's own bands: they replace the kit's, and their number is the country's. */
  bantlar?: BantTablosu
  /** Field group → the fields of that group this country has. Only a group the kit's definition offers (`alanGruplari`). */
  alanlar?: Readonly<Record<string, readonly string[]>>
}

/** A table as a pack states it: the unit of each laboratory column, and the rows. */
export type AracTabloVerisi = { birimler?: Readonly<Record<string, string>>; satirlar: readonly AracTabloSatiri[] }

export type PaketAraci = {
  /** A key of the kit's catalogue — or of the pack's own (`UlkeAraclari.kendiAraclari`, a link-out tile): then it begins with the country's code. */
  anahtar: string
  /** null = BASE: every role of the pack sees it, and an account without a role. A list = these roles only. */
  roller: readonly string[] | null
  /**
   * 'hekimler' = THE TOOL OF EVERY DOCTOR ROLE: `roller` is then exactly the pack's doctor roles (every role that is
   * not an allied profession; lib/ulke/araclar/paket.ts → hekimRolleri), and the pack check holds it to that list
   * whenever a role is added. Distinct from base: an allied professional and an account without a role do not see it.
   */
  sinif?: 'hekimler'
  metin: AracMetni
  /**
   * The country's value for every number the kit's definition leaves to it (`AracTanimi.parametreler`). A laboratory
   * value (`AracTanimi.parametreOlculeri`) is stated with its unit and converted by the kit.
   */
  parametreler?: Readonly<Record<string, number | BirimliSayi>>
  /** The country's rows for every table the definition leaves to it (`AracTanimi.tablolar`). */
  tablolar?: Readonly<Record<string, AracTabloVerisi>>
  /** This country's own bands or options for the tool. */
  uyarlama?: AracUyarlamasi
  /** For which patients the tool is. Needs `metin.hastaKapisi`. */
  hasta?: HastaKapisi
  /** The licence state of the tool in this country. Anything but `serbest` or `izin-alindi` cannot be switched on. */
  lisans?: AracLisansi
  /**
   * A LINK-OUT TILE: the tool is nothing but a link to an official calculator. `adres` is a fixed https address — no
   * value of a patient is ever put into it. The key is the pack's own; the kit has no definition of it.
   */
  baglanti?: { adres: string }
}

/**
 * A tool the country does NOT have yet, said out loud: what is missing and who must supply it. Documentation and
 * tests only — no screen reads a slot, and a slot is never switched on by itself.
 */
export type AracYuvasi = {
  /** The key the tool will have (a kit key where the mechanism exists already, otherwise a proposed one). */
  anahtar: string
  acik: false
  icerik: null
  /** true = the kit already holds the country-neutral mechanism; only the local content is missing. */
  mekanizmaHazir: boolean
  /** What is missing, in plain English. */
  eksik: string
  kimden: string
  /** The roles that would see it; null = every role. */
  roller: readonly string[] | null
  /** The licence state of what is missing: what stands between the placeholder and a tool. */
  lisans?: AracLisansi
}

/** What a pack brings for the tools area (feature `araclar`). */
export type UlkeAraclari = {
  /** The tools area's own words (grid, search, the shared words of every tool screen), once per language form. */
  metinler: Readonly<Partial<Record<DilKodu, AraclarMetni>>>
  /** The tools that are switched on, in the order the grid shows them. */
  araclar: readonly PaketAraci[]
  /** The name of every unit code a switched-on tool shows. */
  birimler: Readonly<Record<string, BicimliMetin>>
  /**
   * The unit this country's laboratories report each quantity in. Required for every quantity a switched-on tool
   * reads. A LIST = the country accepts each of these units: the doctor chooses one beside the field, explicitly.
   */
  labBirimleri: Readonly<Partial<Record<OlcuAnahtari, string | readonly string[]>>>
  yuvalar: readonly AracYuvasi[]
  /** Who wrote the texts and which local clinician has read them. */
  inceleme: { makineYazimi: boolean; klinisyen: string | null }
  /**
   * TOOLS ONLY THIS COUNTRY HAS: their mechanisms, written in the pack's own folder (a wall keeps every other country
   * out of it). Each key begins with the country's code and a hyphen, and is no key of the kit.
   */
  kendiAraclari?: readonly AracTanimi[]
  /** Quantities only this country's own tools read, each with its units. Keys begin with the country's code. */
  olculer?: Readonly<Partial<Record<UlkeOlcusu, OlcuTanimi>>>
  /**
   * HOW THIS COUNTRY WRITES AN AMOUNT OF A MEDICINE (NOTYA-ULKE-ARAC-DUZELTME-01). `sondaSifir: false` = no zero is
   * ever written after the decimal mark ("5 mL", "2.5 mg", never "5.0 mL"); `true` = the fixed decimals stand
   * ("1,0"). A NATIONAL RULE WITH NO DEFAULT: required for every pack that switches on a tool which writes such an
   * amount (a result number marked `doz`), with its source beside it in the pack.
   */
  dozYazimi?: { sondaSifir: boolean }
  /**
   * true = THIS PACK STATES THE LICENCE OF EVERY TOOL AND PLACEHOLDER, and the pack check refuses one without it.
   * Every new country starts with it. (A tool of the country's own, and a link-out tile, state it in every pack.)
   */
  lisansTam?: boolean
}
