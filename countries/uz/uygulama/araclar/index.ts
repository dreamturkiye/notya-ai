/**
 * NOTYA-ULKE-ARACLAR-01 — Uzbekistan: the TOOLS of the country build. What the pack brings for the kit's tools area
 * (lib/ulke/araclar/tipler.ts → UlkeAraclari): which of the kit's tools are switched on, WHICH ROLES SEE EACH, every
 * word of their screens in the three forms, the names of units, and the slots of what is still missing.
 *
 *   ./metinler.ts   the tools area's own words (grid, search, what every tool screen shares)
 *   ./temel.ts      BASE tools: the same for all 42 roles
 *   ./rol1.ts …     ROLE tools, in the order of the pack's role list; each names its roles
 *   ./kendi/        THE TOOLS ONLY UZBEKISTAN HAS (NOTYA-ULKE-UYGULA-UZ, 2026-10-10): their mechanisms with the
 *                   sources beside every number, their words, and the list of what is on without a clinician's
 *                   sign-off (./kendi/onay.ts)
 *   ./takip.ts      the follow-up list: the tool of every doctor role, since every one has a tool whose result can be kept
 *   ./birimler.ts   the names of units, and the unit each laboratory value is reported in here
 *   ./yuvalar.ts    tools that wait for local content: marked, empty, switched off
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * MACHINE-WRITTEN. AWAITS NATIVE AND CLINICAL REVIEW. Every title, label, band name and warning in this folder
 * was written by a machine: Uzbek in Latin script and Russian directly, and UZBEK IN CYRILLIC SCRIPT DERIVED FROM
 * THE LATIN TEXT BY RULE, letter by letter, with a short list of loan-word spellings. Nobody who speaks Uzbek or
 * Russian as a first language, and no clinician, has read a line of it (`inceleme.klinisyen` is null). A rule
 * cannot know every loan word's spelling: the Cyrillic form in particular must be read before a doctor relies on it.
 *
 * WHAT IS AND IS NOT HERE. The lists are the product's own checklists, translated; the arithmetic is the kit's and
 * cites its published source. There is NO national reference content: no vaccination calendar, drug list, dosing
 * table, protocol or reference range of an authority. Tools that need one are slots (./yuvalar.ts).
 * ONE EXCEPTION, SAID WHERE IT STANDS: two of the country's own tools (./kendi/tanimlar.ts) hold numbers of a national
 * protocol — the limits of the four classes of the body mass index, and the rule the expected date of birth is
 * counted by — each beside the place it was read in, and neither read by a clinician yet.
 * The items of published questionnaires are NOT translated here: where a scale's wording belongs to its authors,
 * the screen shows item numbers and the doctor reads the authorised form.
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * Verdict per tool of the pre-split application, and what was done: docs/COUNTRY-PACK-UZ-TOOLS-AUDIT.md.
 */
import type { PaketAraci, UlkeAraclari } from '@/lib/ulke/araclar/tipler'
import { UZ_ARACLAR_METINLERI } from './metinler'
import { UZ_TEMEL_ARACLAR } from './temel'
import { UZ_ROL_ARACLARI_1 } from './rol1'
import { UZ_ROL_ARACLARI_2 } from './rol2'
import { UZ_ROL_ARACLARI_3 } from './rol3'
import { UZ_ROL_ARACLARI_4 } from './rol4'
import { UZ_ROL_ARACLARI_5 } from './rol5'
import { UZ_TAKIP_ARACLARI } from './takip'
import { UZ_KENDI_ARACLAR } from './kendi/metinler'
import { UZ_KENDI_TANIMLAR } from './kendi/tanimlar'
import { UZ_ARAC_BIRIMLERI, UZ_DOZ_YAZIMI, UZ_LAB_BIRIMLERI } from './birimler'
import { UZ_ARAC_YUVALARI } from './yuvalar'

/**
 * NOTYA-ULKE-ARAC-01b — OFF BY KAAN'S ORDER OF 2026-10-10 ("Switch off the risky tools"): the ESI triage tool, the
 * report outline that prints the BI-RADS categories, and both kidney tools. Each is a SLOT now (./yuvalar.ts says
 * why, and what its licence state is) and is taken off the list of switched-on tools below, so it is on no grid,
 * does not open from its address, and the server keeps no result of it: exactly like every other slot.
 *
 * THE DOSE CALCULATOR IS BACK ON (`doz-hesabi`; Kaan, 2026-10-10 14:17, later the same day: "Bring on all the tools
 * built for the new 6 countries now. We will test as we go."). It was the fifth of that order. Its fault was
 * corrected in the kit (pull request #615: the volume is no longer rounded to any step, a volume below 1 ml carries a
 * caution, and an amount is written by this country's own rule, ./birimler.ts → UZ_DOZ_YAZIMI) and the kit's guard
 * list no longer holds it (lib/ulke/araclar/kapaliAraclar.paket.test.ts). It is shown to paediatrics, as before.
 * NO CLINICIAN OF UZBEKISTAN HAS SIGNED IT OFF: ./kendi/onay.ts lists it with the tools that are on without one.
 *
 * THEIR WORDS STAY in ./rol1.ts, ./rol2.ts and ./rol5.ts, marked there (machine-written, read by nobody yet), so that
 * nothing has to be translated a second time the day a tool comes back. What makes a tool exist in the build is the
 * list below, and they are not on it. A tool comes back by leaving this list AND ./yuvalar.ts — after its fault is
 * corrected in the kit or its licence is granted; lib/ulke/araclar/kapaliAraclar.paket.test.ts fails until then.
 */
export const UZ_KAPALI_ARACLAR: readonly string[] = ['esi-triyaj', 'kdigo-evre', 'kdigo-serit', 'rapor-taslagi']
const acikOlanlar = (liste: readonly PaketAraci[]): PaketAraci[] => liste.filter((p) => !UZ_KAPALI_ARACLAR.includes(p.anahtar))

export const UZ_ARACLAR: UlkeAraclari = {
  metinler: UZ_ARACLAR_METINLERI,
  araclar: [...UZ_TEMEL_ARACLAR, ...acikOlanlar([...UZ_ROL_ARACLARI_1, ...UZ_ROL_ARACLARI_2, ...UZ_ROL_ARACLARI_3, ...UZ_ROL_ARACLARI_4, ...UZ_ROL_ARACLARI_5]), ...UZ_KENDI_ARACLAR, ...UZ_TAKIP_ARACLARI],
  // the mechanisms of the three tools only this country has; each key is listed for "uz" in countries/yasak-araclar.json
  kendiAraclari: UZ_KENDI_TANIMLAR,
  birimler: UZ_ARAC_BIRIMLERI,
  labBirimleri: UZ_LAB_BIRIMLERI,
  dozYazimi: UZ_DOZ_YAZIMI,
  yuvalar: UZ_ARAC_YUVALARI,
  inceleme: { makineYazimi: true, klinisyen: null },
}
