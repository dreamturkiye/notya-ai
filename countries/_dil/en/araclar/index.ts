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
 */
import { kitAraci } from '@/lib/ulke/araclar/katalog'
import type { AracYuvasi, LabOlcusu, PaketAraci, UlkeAraclari } from '@/lib/ulke/araclar/tipler'
import type { Birimler } from '@/lib/ulke/tipler'
import { enAraclarMetni } from '../araclarMetni'
import { EN_ROLLER, type EnRol } from '../klinik/roller'
import type { EnUlkeSozleri } from '../ulke'
import { EN_ARACLAR_1 } from './arac1'
import { EN_ARACLAR_2 } from './arac2'
import { EN_ARACLAR_3 } from './arac3'
import { araciBicimle, type HamArac } from './yardimci'
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

export type EnAraclarGirdisi = {
  sozler: EnUlkeSozleri
  /** The country's name, for the sentences of the slots. */
  ulke: string
  /** The pack's units of length and weight (the same object as uygulama.birimler). */
  birimler: Birimler
  /** The unit the country's laboratories report each value in. UNVERIFIED until a local source confirms it. */
  labBirimleri: Readonly<Partial<Record<LabOlcusu, string>>>
  /** Tools of the set this country keeps as slots: kit key → what is missing, and who decides. */
  kapali: Readonly<Record<string, { eksik: string; kimden: string }>>
  /** Unit names this country writes differently: unit code → name. Used as written. */
  birimAdlari?: Readonly<Record<string, string>>
  /** Words of a tool this country writes differently: kit key → the words. Used as written. */
  degisen?: Readonly<Record<string, NonNullable<Parameters<typeof araciBicimle>[2]>>>
}

/** The unit codes a switched-on tool shows in a pack with these units. */
function gerekenBirimler(araclar: readonly PaketAraci[], g: EnAraclarGirdisi): string[] {
  const b = new Set<string>()
  for (const p of araclar) {
    const t = kitAraci(p.anahtar)
    if (!t) continue
    for (const a of t.alanlar) {
      if (a.birim) b.add(a.birim)
      if (a.olcu) b.add(g.birimler[a.olcu])
      if (a.lab && g.labBirimleri[a.lab]) b.add(g.labBirimleri[a.lab] as string)
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
  const temel = EN_TEMEL_ARACLAR.map((a) => araciBicimle(a, bicim))
  const rol = EN_ROL_ARACLARI.filter(acik).map((a) => araciBicimle(a, bicim, g.degisen?.[a.anahtar]))
  // THE FOLLOW-UP LIST: a role tool of every role that has a switched-on tool of its own, in the order of the role list.
  const takipRolleri: EnRol[] = EN_ROLLER.filter((r) => rol.some((a) => a.roller?.includes(r)))
  const takip = takipRolleri.length ? [araciBicimle({ ...TAKIP, roller: takipRolleri }, bicim)] : []
  const araclar = [...temel, ...rol, ...takip]
  const birimler: Record<string, Readonly<Record<string, string>>> = {}
  for (const kod of gerekenBirimler(araclar, g)) birimler[kod] = { [bicim]: g.birimAdlari?.[kod] ?? EN_BIRIM_ADLARI[kod] ?? '' }
  const kendiYuvalari: AracYuvasi[] = EN_ROL_ARACLARI.filter((a) => !acik(a)).map((a) => yuva(a.anahtar, a.roller, g.kapali[a.anahtar].eksik, g.kapali[a.anahtar].kimden, true))
  return {
    metinler: { [bicim]: enAraclarMetni(g.sozler) },
    araclar,
    birimler,
    labBirimleri: g.labBirimleri,
    yuvalar: [...enAracYuvalari(g.ulke), ...kendiYuvalari],
    inceleme: { makineYazimi: true, klinisyen: null },
  }
}
