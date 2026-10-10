/**
 * NOTYA-ULKE-EN-01 — THE ENGLISH LANGUAGE SET: THE TOOLS of a country build, as an English-speaking pack takes them.
 * What the set brings for the kit's tools area (lib/ulke/araclar/tipler.ts → UlkeAraclari): the words of every tool
 * the set has written, WHICH ROLES SEE EACH, the names of units, and the slots of what is missing everywhere.
 *
 *   ../araclarMetni.ts   the tools area's own words
 *   ./arac1.ts …         ROLE tools, each naming its roles; the patient page's tile is the one BASE tool
 *   ./yuvalar.ts         tools that wait for local content or for a licence: marked, empty, switched off
 *
 * MACHINE-WRITTEN. AWAITS CLINICAL REVIEW IN EACH COUNTRY (`inceleme.klinisyen` is null in every pack). The lists are
 * the product's own checklists; the arithmetic is the kit's and cites its published source. There is NO national
 * reference content, and no item of a published questionnaire.
 *
 * WHAT A COUNTRY DECIDES (`EnAraclarGirdisi`) — because units and scales are a clinical-safety matter:
 *   birimler       the pack's own units of length and weight (uygulama.birimler): a tool's length and weight fields
 *                  are typed and shown in them
 *   labBirimleri   the unit the country's laboratories report each value in, for the tools that read one
 *   kapali         tools of the set this country keeps as SLOTS: the scale is not the country's, or the tool's
 *                  arithmetic does not fit the country's unit. Said per tool, with what is missing and who decides.
 *   birimAdlari    unit names this country writes differently (the same quantity, another notation)
 *   degisen        words of a tool this country writes differently (a label that must name the unit)
 * THE FOLLOW-UP LIST is given to exactly the roles that have at least one switched-on tool of their own — worked out
 * here from the list, so that it cannot drift from it.
 *
 * NOTYA-ULKE-OZEL-01 — WHAT ONE COUNTRY MAY STATE BEYOND THAT, each in its own folder and each optional (a country
 * that states none of it gets the set exactly as before; docs/COUNTRY-PACK-HOWTO.md, "Country-only tools and roles"):
 *   gorenler       WHO SEES a tool of the set here, where it differs: its own roles, 'hekimler' (every doctor role),
 *                  or null (a base tool)
 *   parametreler   the country's numbers for a tool that leaves some to it, each laboratory value WITH ITS UNIT
 *   tablolar       the country's table for a tool that leaves one to it
 *   uyarlama       the country's own bands or options for a tool, where the kit's definition allows them
 *   hasta          for which patients a tool is (age, sex), with the sentence that says so
 *   lisanslar      the licence state of a tool or a placeholder; `lisansTam` = the country states every one
 *   degisen        now also a tool's name, its options, its dates and the line under its result
 *   labBirimleri   a LIST of units for a quantity = the doctor chooses the unit beside the field
 *   ek             TOOLS BEYOND THE SET: a tool of the kit the set has not written (the country brings its words), a
 *                  tool only this country has (its mechanism too: `tanimlar`), a link-out tile, placeholders of its
 *                  own (`yuvalar`), quantities of its own (`olculer`). Their keys carry the country's code unless
 *                  they are kit tools. THE SET NEVER NAMES ONE: wall rule D7 keeps a country's keys out of it.
 */
import { kitAraci } from '@/lib/ulke/araclar/katalog'
import { hekimRolleri } from '@/lib/ulke/araclar/paket'
import type { AracTanimi, AracUyarlamasi, AracYuvasi, HastaKapisi, PaketAraci, UlkeAraclari } from '@/lib/ulke/araclar/tipler'
import type { RolTanimi } from '@/lib/ulke/arayuz/tipler'
import type { Birimler } from '@/lib/ulke/tipler'
import { enAraclarMetni } from '../araclarMetni'
import { EN_ROL_SATIRLARI, EN_ROLLER } from '../klinik/roller'
import type { EnUlkeSozleri } from '../ulke'
import { enYaz } from '../varyant'
import { EN_ARACLAR_1 } from './arac1'
import { EN_ARACLAR_2 } from './arac2'
import { EN_ARACLAR_3 } from './arac3'
import { araciBicimle, lisansiBicimle, type EnDegisen, type EnLisans, type HamArac } from './yardimci'
import { enAracYuvalari, yuva } from './yuvalar'

/** The one BASE tool: every role gives patients access to their page the same way. Its name is the name of the card on the patient's file. */
export const EN_TEMEL_ARACLAR: readonly HamArac[] = [
  {
    anahtar: 'hasta-portali', roller: null,
    ad: 'Patient\'s page',
    aciklama: 'Give a patient access to their own page: the link and the PIN are created on the patient file.',
    not: 'The system sends nothing to the patient: you give the link and the PIN yourself.',
  },
]

/** Every ROLE tool the set has written, in the order the grid shows them. */
export const EN_ROL_ARACLARI: readonly HamArac[] = [...EN_ARACLAR_1, ...EN_ARACLAR_2, ...EN_ARACLAR_3]

const TAKIP: Omit<HamArac, 'roller'> = {
  anahtar: 'takip-paneli',
  ad: 'Follow-up list',
  aciklama: 'The follow-up dates you set yourself for results kept in patients\' files: overdue ones are marked.',
  not: 'The list shows only the dates you set; the system proposes no date and sends nothing to the patient.',
}

/**
 * The name of every unit code a tool can show, as a doctor reads it. SYMBOLS, the same in every form of English;
 * the words among them ("days", "months", "hours") are the same in every form too.
 */
export const EN_BIRIM_ADLARI: Readonly<Record<string, string>> = {
  mL: 'mL',
  'mL/min/1.73m2': 'mL/min/1.73 m²',
  'mg/g': 'mg/g',
  'mg/mmol': 'mg/mmol',
  '%': '%',
  gun: 'days',
  ay: 'months',
  dB: 'dB',
  mg: 'mg',
  'mg/kg': 'mg/kg',
  saat: 'hours',
  mm: 'mm',
  'mg/L': 'mg/L',
  'mm/saat': 'mm/h',
  'ng/mL': 'ng/mL',
  'ng/mL/yil': 'ng/mL per year',
  dk: 'min',
  cm: 'cm',
  in: 'in',
  kg: 'kg',
  lb: 'lb',
  'g/L': 'g/L',
  'g/dL': 'g/dL',
  'mg/dL': 'mg/dL',
  'mmol/L': 'mmol/L',
  'umol/L': 'µmol/L',
}

/** The sentence under a number whose unit the doctor has not chosen yet. Base spelling. Only in a pack that accepts several units for a value. */
export const EN_BIRIM_SEC = 'Choose the unit of this value: without its unit the number is not read.'

/** WHO SEES a tool here: this country's roles, every doctor role, or every role (a base tool). */
export type EnGorenler = readonly string[] | 'hekimler' | null

/** TOOLS BEYOND THE SET, as one country brings them (the kit's own shapes; every word in the country's own form). */
export type EnEkAraclar = {
  /** Switched-on tools: a tool of the kit the set has not written, a tool only this country has, a link-out tile. */
  araclar?: readonly PaketAraci[]
  /** The mechanisms of the tools only this country has. Keys carry the country's code. */
  tanimlar?: readonly AracTanimi[]
  /** Placeholders only this country has. */
  yuvalar?: readonly AracYuvasi[]
  /** Quantities only this country's own tools read. */
  olculer?: UlkeAraclari['olculer']
}

export type EnAraclarGirdisi = {
  sozler: EnUlkeSozleri
  /** The country's name, for the sentences of the slots. */
  ulke: string
  /** The pack's units of length and weight (the same object as uygulama.birimler). */
  birimler: Birimler
  /**
   * The unit the country's laboratories report each value in. UNVERIFIED until a local source confirms it.
   * A LIST = the country accepts each of these units, and the doctor chooses one beside the field.
   */
  labBirimleri: UlkeAraclari['labBirimleri']
  /** Tools of the set this country keeps as slots: kit key → what is missing, and who decides. */
  kapali: Readonly<Record<string, { eksik: string; kimden: string }>>
  /** Unit names this country writes differently: unit code → name. Used as written. */
  birimAdlari?: Readonly<Record<string, string>>
  /** Words of a tool this country writes differently: kit key → the words. Used as written. */
  degisen?: Readonly<Record<string, EnDegisen>>
  // ── NOTYA-ULKE-OZEL-01: everything below is one country's own statement; absent = the set as it is ──
  /** The pack's roles, where its role list differs from the shared forty (handed over by the set: ../arayuz.ts). */
  roller?: readonly RolTanimi[]
  /** WHO SEES a tool of the set here, where it differs from the set's list: kit key → roles. */
  gorenler?: Readonly<Record<string, EnGorenler>>
  /** The country's numbers for a tool: kit key → number key → a number, or a laboratory value with its unit. */
  parametreler?: Readonly<Record<string, NonNullable<PaketAraci['parametreler']>>>
  /** The country's tables for a tool: kit key → table key → rows. */
  tablolar?: Readonly<Record<string, NonNullable<PaketAraci['tablolar']>>>
  /** The country's own bands or options for a tool: kit key → what it restates. */
  uyarlama?: Readonly<Record<string, AracUyarlamasi>>
  /** For which patients a tool is: kit key → the limit, and the sentence that says so (the country's own spelling). */
  hasta?: Readonly<Record<string, { kapi: HastaKapisi; metin: string }>>
  /** The licence state of a tool or a placeholder of the set, by key. */
  lisanslar?: Readonly<Record<string, EnLisans>>
  /** true = this country states the licence of every tool and placeholder (the pack check then refuses one without). */
  lisansTam?: boolean
  /** Tools beyond the set. */
  ek?: EnEkAraclar
}

/** The units a laboratory quantity is typed in here: the country's one unit, or each unit it accepts. */
const kabulEdilenBirimler = (b: string | readonly string[] | undefined): readonly string[] => (typeof b === 'string' ? (b ? [b] : []) : b ?? [])

/** The unit codes a switched-on tool shows in a pack with these units. */
function gerekenBirimler(araclar: readonly PaketAraci[], g: EnAraclarGirdisi): string[] {
  const b = new Set<string>()
  for (const p of araclar) {
    const t = kitAraci(p.anahtar) ?? g.ek?.tanimlar?.find((x) => x.anahtar === p.anahtar) ?? null
    if (!t) continue
    for (const a of t.alanlar) {
      if (a.birim) b.add(a.birim)
      if (a.olcu) b.add(g.birimler[a.olcu])
      if (a.lab) for (const birim of kabulEdilenBirimler(g.labBirimleri[a.lab])) b.add(birim)
    }
    for (const k of t.sonucBirimleri ?? []) b.add(k)
    for (const o of t.sonucOlculeri ?? []) b.add(g.birimler[o])
  }
  return [...b]
}

/** The tools area of an English-speaking pack. */
export function enAraclar(g: EnAraclarGirdisi): UlkeAraclari {
  const bicim = g.sozler.bicim
  const acik = (a: HamArac) => !(a.anahtar in g.kapali)
  // THE COUNTRY'S ROLES: the shared forty, or — where the country's list differs — its own. A role the country does
  // not have is taken off every list of the set; a tool left with no role must be decided by the country (the pack
  // check refuses an empty list: give it roles in `gorenler`, or keep it as a slot in `kapali`).
  const rolListesi: readonly string[] = g.roller ? g.roller.map((r) => r.anahtar) : EN_ROLLER
  const buUlkede = <T extends readonly string[] | null>(roller: T): T => (g.roller && roller ? (roller.filter((r) => rolListesi.includes(r)) as unknown as T) : roller)
  const hekimler = (): string[] => hekimRolleri(g.roller ?? EN_ROL_SATIRLARI)
  /** What this country states about a tool of the set beside its words; undefined = nothing: the set's entry as it is. */
  const eki = (a: HamArac) => {
    const goren = g.gorenler && a.anahtar in g.gorenler ? g.gorenler[a.anahtar] : undefined
    const roller = goren === undefined ? (g.roller ? buUlkede(a.roller) : undefined) : goren === 'hekimler' ? hekimler() : goren
    const ek = {
      ...(roller !== undefined ? { roller } : {}),
      ...(goren === 'hekimler' ? { sinif: 'hekimler' as const } : {}),
      ...(g.parametreler?.[a.anahtar] ? { parametreler: g.parametreler[a.anahtar] } : {}),
      ...(g.tablolar?.[a.anahtar] ? { tablolar: g.tablolar[a.anahtar] } : {}),
      ...(g.uyarlama?.[a.anahtar] ? { uyarlama: g.uyarlama[a.anahtar] } : {}),
      ...(g.hasta?.[a.anahtar] ? { hasta: g.hasta[a.anahtar] } : {}),
      ...(g.lisanslar?.[a.anahtar] ? { lisans: g.lisanslar[a.anahtar] } : {}),
    }
    return Object.keys(ek).length ? ek : undefined
  }
  const temel = EN_TEMEL_ARACLAR.map((a) => araciBicimle(a, bicim, g.degisen?.[a.anahtar], eki(a)))
  const rol = EN_ROL_ARACLARI.filter(acik).map((a) => araciBicimle(a, bicim, g.degisen?.[a.anahtar], eki(a)))
  const ekAraclar = g.ek?.araclar ?? []
  // THE FOLLOW-UP LIST: a role tool of every role that has a switched-on tool of its own, in the order of the role list.
  // (A tool beyond the set counts where its result can be kept: not a screen of the kit, not a link-out tile.)
  const kayitli = [...rol, ...ekAraclar.filter((p) => !p.baglanti && kitAraci(p.anahtar)?.tur !== 'ekran')]
  const takipGoren = g.gorenler && TAKIP.anahtar in g.gorenler ? g.gorenler[TAKIP.anahtar] : undefined
  const takipRolleri: readonly string[] | null = takipGoren === undefined
    // a tool every role has, whose result can be kept, gives every role the list
    ? (kayitli.some((a) => a.roller === null) ? rolListesi : rolListesi.filter((r) => kayitli.some((a) => a.roller?.includes(r))))
    : takipGoren === 'hekimler' ? hekimler() : takipGoren
  const takipEki = { roller: takipRolleri, ...(takipGoren === 'hekimler' ? { sinif: 'hekimler' as const } : {}), ...(g.lisanslar?.[TAKIP.anahtar] ? { lisans: g.lisanslar[TAKIP.anahtar] } : {}) }
  const takip = takipRolleri === null || takipRolleri.length ? [araciBicimle({ ...TAKIP, roller: null }, bicim, g.degisen?.[TAKIP.anahtar], takipEki)] : []
  const araclar = [...temel, ...rol, ...ekAraclar, ...takip]
  const birimler: Record<string, Readonly<Record<string, string>>> = {}
  for (const kod of gerekenBirimler(araclar, g)) birimler[kod] = { [bicim]: g.birimAdlari?.[kod] ?? EN_BIRIM_ADLARI[kod] ?? '' }
  // A slot of the set leaves the list the day the country switches its tool on (`ek`); its licence, where the country states it, stands on the slot.
  const acilan = new Set(ekAraclar.map((p) => p.anahtar))
  const yuvayiBicimle = (y: AracYuvasi): AracYuvasi => ({ ...y, ...(g.roller ? { roller: buUlkede(y.roller) } : {}), ...(g.lisanslar?.[y.anahtar] ? { lisans: lisansiBicimle(g.lisanslar[y.anahtar], bicim) } : {}) })
  const ortakYuvalar = enAracYuvalari(g.ulke)
  const kendiYuvalari: AracYuvasi[] = EN_ROL_ARACLARI.filter((a) => !acik(a)).map((a) => yuva(a.anahtar, a.roller, g.kapali[a.anahtar].eksik, g.kapali[a.anahtar].kimden, true))
  const ozel = Boolean(g.roller || g.lisanslar || acilan.size)
  const yuvalar = ozel ? [...ortakYuvalar, ...kendiYuvalari].filter((y) => !acilan.has(y.anahtar)).map(yuvayiBicimle) : [...ortakYuvalar, ...kendiYuvalari]
  // WHERE A UNIT IS CHOSEN ON THE SCREEN, the catalogue holds the sentence that asks for it.
  const metin = enAraclarMetni(g.sozler)
  const birimSecilir = Object.values(g.labBirimleri).some((b) => kabulEdilenBirimler(b).length > 1)
  return {
    metinler: { [bicim]: birimSecilir ? { ...metin, arac: { ...metin.arac, birimSec: enYaz(EN_BIRIM_SEC, bicim) } } : metin },
    araclar,
    birimler,
    labBirimleri: g.labBirimleri,
    yuvalar: [...yuvalar, ...(g.ek?.yuvalar ?? [])],
    inceleme: { makineYazimi: true, klinisyen: null },
    ...(g.ek?.tanimlar?.length ? { kendiAraclari: g.ek.tanimlar } : {}),
    ...(g.ek?.olculer ? { olculer: g.ek.olculer } : {}),
    ...(g.lisansTam !== undefined ? { lisansTam: g.lisansTam } : {}),
  }
}
