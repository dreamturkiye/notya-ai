/**
 * NOTYA-ULKE-ASISTAN-01 — Uzbekistan: THE AUTHORITIES AND REFERENCE WORKS the assistant is told to exist.
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * WHAT THE PACK KNOWS IS VERY LITTLE, AND THIS FILE SAYS EXACTLY THAT MUCH.
 * The country's record (docs/COUNTRY-PACK-UZBEKISTAN.md, "Research notes") holds ONE finding about clinical
 * guidance: that the Ministry of Health publishes a section of clinical guidelines, at the address below. It was
 * found by a machine in a secondary search, and NO CLINICIAN HAS CONFIRMED IT (`dogrulayan: null`).
 * "Clinical references for each specialty and clinic type" is an OPEN QUESTION of that record. So:
 *   - `ortak` (every role): that one section, named as existing. Its text was not read and is not here;
 *   - `roller`: all 40 roles are listed, EACH WITH AN EMPTY LIST. No guideline, society, textbook or journal is
 *     named for any specialty, because none was researched and confirmed. The kit then tells the model, in this
 *     pack's own words, that no national protocol, guideline or textbook was given for the role.
 * A reference work comes onto a role's list only when the clinical lead has named it, with a date, in the record.
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * MACHINE-WRITTEN. The institution's name in Uzbek and in Russian was written by a machine; the Cyrillic form is
 * derived from the Latin by rule (scripts/uz-kiril.mjs). Awaits a native reader and the clinical lead.
 *
 * NOT HERE, ON PURPOSE: the vaccination calendar page the same record lists (it is a news page of another body,
 * whose official name the record does not give), any order of the ministry, and anything read from general
 * knowledge. Nothing of another country's authorities, societies or guidelines.
 */
import type { AsistanKaynagi } from '@/lib/ulke/asistan/tipler'
import { u } from '../../uygulama/araclar/yardimci'
import { UZ_ROLLER } from '../rolAdlari'

export const UZ_VAZIRLIK_QOLLANMALARI = u('Oʻzbekiston Respublikasi Sogʻliqni saqlash vazirligining klinik qoʻllanmalar boʻlimi', 'Ўзбекистон Республикаси Соғлиқни сақлаш вазирлигининг клиник қўлланмалар бўлими', 'Раздел клинических руководств Министерства здравоохранения Республики Узбекистан')

/** What every role's assistant is told to exist. One entry, unconfirmed. */
export const UZ_ORTAK_KAYNAKLAR: readonly AsistanKaynagi[] = [
  {
    tur: 'kurum',
    ad: UZ_VAZIRLIK_QOLLANMALARI,
    dayanak: 'https://gov.uz/uz/ssv/pages/klinik-qo-llanmalar — docs/COUNTRY-PACK-UZBEKISTAN.md, "Research notes" (secondary source; the page was not read)',
    dogrulayan: null,
  },
]

/**
 * Reference works per role: EMPTY FOR ALL 40, waiting on the clinical lead (docs/OPEN-COMMITMENTS.md,
 * NOTYA-ULKE-ASISTAN-01). The role is listed so that "nothing was supplied" is a statement, not an omission.
 */
export const UZ_ROL_KAYNAKLARI: Readonly<Record<string, readonly AsistanKaynagi[]>> = Object.fromEntries(UZ_ROLLER.map((rol) => [rol, [] as readonly AsistanKaynagi[]]))
