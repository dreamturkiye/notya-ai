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
 */
import type { BicimliMetin } from '../arayuz/tipler'
import type { AraclarMetni } from '../arayuz/metinTipleri'
import type { DilKodu } from '../tipler'

/** A laboratory quantity whose UNIT is the country's choice (the pack states it; the kit converts before it computes). */
export type LabOlcusu = 'kreatinin' | 'hemoglobin' | 'glukoz' | 'kolesterol' | 'albuminKreatinin'

export type AracAlani = {
  /** Lower-case letters, digits, underscores. The key of the field's label in the pack. Never shown. */
  anahtar: string
  /**
   * sayi    a number the doctor types          secim   one of a few options
   * isaret  a tick-box                         tarih   a day
   * puan    a whole score from enAz to enCok   (an item of a scale)
   */
  tur: 'sayi' | 'secim' | 'isaret' | 'tarih' | 'puan'
  enAz?: number
  enCok?: number
  /** true = only whole numbers. */
  tam?: boolean
  /** A unit of the field's own: a code the pack names (`birimler`). */
  birim?: string
  /** Measured in the PACK's unit of length or weight (`uygulama.birimler`); the kit hands the function cm / kg. */
  olcu?: 'boy' | 'agirlik'
  /** A laboratory value in the unit the pack chose for it (`labBirimleri`); the kit hands the function the canonical unit. */
  lab?: LabOlcusu
  /** Option keys of a `secim`, in the order they are offered. */
  secenekler?: readonly string[]
  /** true = may be left empty; the tool still answers. */
  istege?: boolean
  /**
   * true = an item of a published questionnaire whose WORDING belongs to its authors. The pack need not name it:
   * the screen then shows the item's number, and the doctor reads the item from the authorised form in their hand.
   */
  numarali?: boolean
}

/** What the doctor entered, already narrowed: a number in the canonical unit, an option key, a tick, an ISO day. */
export type AracGirdisi = Readonly<Record<string, number | string | boolean | null>>

export type AracSayisi = { anahtar: string; deger: number; /** Decimal places shown. */ ondalik: number; /** The scale's maximum, shown as "12 / 35". */ enCok?: number; /** A unit code the pack names. */ birim?: string }

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

export type AracTuru = 'hesap' | 'olcek' | 'liste' | 'takvim' | 'ekran'

export type AracTanimi = {
  /** Lower-case words joined by hyphens. Also the tool's address: /tools?arac=<anahtar>. */
  anahtar: string
  /** hesap = a formula; olcek = a scored scale; liste = a checklist or structured note; takvim = dates; ekran = a screen of the kit's own (`ekran`). */
  tur: AracTuru
  alanlar: readonly AracAlani[]
  /** Every key `hesapla` can return. The pack names each one in every form; the pack check requires it. */
  cikti: { sayilar: readonly string[]; bantlar: readonly string[]; uyarilar: readonly string[]; tarihler: readonly string[] }
  /** Pure. `bugun` is the day in the account's time zone (YYYY-MM-DD). */
  hesapla: (g: AracGirdisi, ortam: { bugun: string }) => AracSonucu
  /** The published source of the arithmetic, as a citation; null where the tool is a list of the product's own. Shown under the result. */
  kaynak: string | null
  /** For `tur: 'ekran'`: the kit screen that is the tool (it has no fields). */
  ekran?: 'hastaPortali'
  /** Unit codes the RESULT's numbers carry (the fields' units are on the fields). The pack names each. */
  sonucBirimleri?: readonly string[]
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
}

export type PaketAraci = {
  /** A key of the kit's catalogue. */
  anahtar: string
  /** null = BASE: every role of the pack sees it, and an account without a role. A list = these roles only. */
  roller: readonly string[] | null
  metin: AracMetni
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
}

/** What a pack brings for the tools area (feature `araclar`). */
export type UlkeAraclari = {
  /** The tools area's own words (grid, search, the shared words of every tool screen), once per language form. */
  metinler: Readonly<Partial<Record<DilKodu, AraclarMetni>>>
  /** The tools that are switched on, in the order the grid shows them. */
  araclar: readonly PaketAraci[]
  /** The name of every unit code a switched-on tool shows. */
  birimler: Readonly<Record<string, BicimliMetin>>
  /** The unit this country's laboratories report each quantity in. Required for every quantity a switched-on tool reads. */
  labBirimleri: Readonly<Partial<Record<LabOlcusu, string>>>
  yuvalar: readonly AracYuvasi[]
  /** Who wrote the texts and which local clinician has read them. */
  inceleme: { makineYazimi: boolean; klinisyen: string | null }
}
