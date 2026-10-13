/**
 * NOTYA-ULKE-UYGULA-NZ — New Zealand: THE INTAKE QUESTIONS OF THE ROLES ONLY THIS COUNTRY HAS, where the heading of
 * the role each behaves like would name the WRONG PROFESSION to a patient. Server half only (./index.ts): the
 * screens' half of the pack never reads this file.
 *
 * WHY. A role this country adds asks the intake questions of the shared role it behaves like (../ayarlar.ts →
 * NZ_ROLLER, `gibi`). The questions fit; the HEADING a patient reads above them does not always: the patient of an
 * occupational physician would read "For your family doctor", the patient of a podiatrist "Before physiotherapy". A
 * word that belongs to one profession must not be shown for another (.cursor/skills/brans-alan-sizmasi/SKILL.md),
 * and a patient reads this alone, on their own phone.
 *
 * WHAT. For eleven of the thirteen added roles: the SAME QUESTIONS as the role each behaves like — taken from the
 * English language set as it stands, not rewritten, so a correction made there is made here — under a HEADING OF
 * THIS COUNTRY'S OWN, and under KEYS of the role's own (a question belongs to one role: every key is unique in the
 * pack, so each is the set's key with the role's prefix in front). The other two keep the set's heading, which
 * names no profession that is not theirs: "Women's health" (family planning and reproductive health) and "Before
 * the first conversation" (the psychotherapist).
 *
 * MACHINE-WRITTEN: eleven headings, patient-facing, read by no native reader and no clinician of New Zealand. The
 * questions themselves are the set's and carry the set's status (machine-written, read by no clinician).
 */
import { EN_ROL_SORULARI } from '../../_dil/en/klinik/hastaFormu'
import type { HamRol } from '../../_dil/en/klinik/hastaFormu/yardimci'
import type { EnRol, EnRolDegisimi } from '../../_dil/en/klinik/roller'
import { NZ_ROLLER } from '../ayarlar'

/** role → [the prefix of its question keys, the heading a patient reads]. The questions are those of the role it behaves like. */
const BASLIKLAR: Readonly<Record<string, readonly [string, string]>> = {
  'urgent-care-medicine': ['nz_uc', 'About today\'s problem'],
  'rural-hospital-medicine': ['nz_rh', 'For your doctor'],
  'musculoskeletal-medicine': ['nz_ms', 'About the pain or the limitation'],
  'occupational-medicine': ['nz_om', 'For your doctor'],
  'pain-medicine': ['nz_pm', 'About the pain'],
  'sexual-health-medicine': ['nz_sh', 'For your doctor'],
  'palliative-medicine': ['nz_pl', 'For your doctor'],
  'oral-maxillofacial-surgery': ['nz_omfs', 'For the surgeon'],
  podiatry: ['nz_pd', 'Before your appointment'],
  osteopathy: ['nz_ost', 'Before your appointment'],
  chiropractic: ['nz_ch', 'Before your appointment'],
}

/** The questions of the shared role `gibi`, under this role's own keys and this country's own heading. */
const kendiFormu = (onEk: string, baslik: string, gibi: EnRol): HamRol => ({ baslik, sorular: EN_ROL_SORULARI[gibi].sorular.map((q) => ({ ...q, anahtar: `${onEk}_${q.anahtar}` })) })

/**
 * THE ROLE LIST AS THE SERVER HALF TAKES IT: ../ayarlar.ts → NZ_ROLLER, each of the eleven roles above with its own
 * question set. The same keys, kinds and `gibi` as NZ_ROLLER — only the questions are added.
 */
export const NZ_ROLLER_FORMLU: EnRolDegisimi = {
  ...NZ_ROLLER,
  ekle: (NZ_ROLLER.ekle ?? []).map((r) => {
    const kendi = BASLIKLAR[r.anahtar]
    return kendi && r.gibi ? { ...r, form: kendiFormu(kendi[0], kendi[1], r.gibi) } : r
  }),
}

/** The roles of this country that ask under a heading of their own. */
export const NZ_KENDI_BASLIKLI_ROLLER: readonly string[] = Object.keys(BASLIKLAR)
