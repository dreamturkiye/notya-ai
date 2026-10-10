/**
 * NOTYA-ULKE-EN-01 — THE ENGLISH LANGUAGE SET: THE INTAKE FORM's content — the core questions every patient gets,
 * the questions of each of the 40 roles, and a draft consent sentence. A country's pack takes it in its own form of
 * English and makes it part of its CLINICAL half (reached only through countries/active/klinik, on the server).
 *
 * MACHINE-WRITTEN, EVERY SET. AWAITS A CLINICIAN IN EACH COUNTRY. The core set and each of the 40 role sets carries
 * `inceleme: { makineYazimi: true, klinisyen: null }`: written by a machine, read by no clinician of any of the five
 * countries. A set is reviewed, COUNTRY BY COUNTRY, when a clinician of that country has read and signed it.
 *
 * THE CONSENT SENTENCE IS A DRAFT. NOT READ BY A LAWYER of any country (`hukukcuInceledi: false`; checklist I1, I2).
 * Each country stamps it with a version of its own, stored with every form it was accepted on, so that a reviewed
 * wording can be told apart from this one. A country may bring its own sentence instead (`riza`).
 *
 * What the form deliberately does not ask, and what a local source must supply first: ./yuvalar.ts.
 * The answers are NOT given to the model that writes a visit note.
 */
import type { HastaFormuIcerigi } from '@/lib/ulke/intake/tipler'
import { enYaz, type EnBicim } from '../../varyant'
import { EN_ROLLER, enGibiRolleri, enRolSatirlari, type EnRol, type EnRolDegisimi } from '../roller'
import { EN_CEKIRDEK_BOLUMLER } from './cekirdek'
import { EN_ROL_SORULARI_1 } from './roller1'
import { EN_ROL_SORULARI_2 } from './roller2'
import { EN_ROL_SORULARI_3 } from './roller3'
import { bolumuBicimle, MAKINE, roluBicimle, type HamRol } from './yardimci'

export { enFormYuvalari, type EnFormYuvasi } from './yuvalar'

/** The 40 role sets, as written (base spelling). Typed so that a role without a set does not compile. */
export const EN_ROL_SORULARI: Readonly<Record<EnRol, HamRol>> = { ...EN_ROL_SORULARI_1, ...EN_ROL_SORULARI_2, ...EN_ROL_SORULARI_3 } as Readonly<Record<EnRol, HamRol>>

/** DRAFT. NOT READ BY A LAWYER. What a patient reads before the first question. */
export const EN_FORM_RIZASI = {
  metin: 'Only your doctor sees your answers. They are stored in protected form as part of your health information and are used to prepare for your visit. Filling in this form is voluntary.',
  veliMetni: 'Only the child\'s doctor sees your answers. They are stored in protected form as part of the child\'s health information and are used to prepare for the visit. You are filling in this form as the child\'s parent or guardian. Filling it in is voluntary.',
} as const

export type EnFormGirdisi = {
  bicim: EnBicim
  /** The country's stamp for this question set and for its consent sentence, e.g. "gb-draft-2026-10-09". */
  surum: string
  /** The country's own consent sentence, in its own spelling, where it brings one. Still a draft until a lawyer reads it. */
  riza?: { metin: string; veliMetni: string }
  /**
   * NOTYA-ULKE-OZEL-01 — where this country's role list differs from the shared forty: the sets of the roles it took
   * out are not in its pack; a role of its own asks the questions of the role it behaves like (the kit finds them
   * through `RolTanimi.gibi`), or its own (`EnEkRol.form`).
   */
  rolDegisimi?: EnRolDegisimi
}

/** The intake form's content in a country's form of English. */
export function enHastaFormu(g: EnFormGirdisi): HastaFormuIcerigi {
  const roller: Record<string, ReturnType<typeof roluBicimle>> = {}
  const satirlar = enRolSatirlari(g.rolDegisimi)
  // The shared roles this country keeps, and the shared roles one of its own roles behaves like — in the set's order.
  const tutulan = new Set<string>([...satirlar.filter((r) => !r.ek).map((r) => r.anahtar), ...enGibiRolleri(g.rolDegisimi)])
  for (const rol of EN_ROLLER) if (tutulan.has(rol)) roller[rol] = roluBicimle(EN_ROL_SORULARI[rol], g.bicim)
  // A role of the country's own that brings its own questions: written like the set's (base spelling), in the country's own folder.
  for (const r of satirlar) if (r.ek?.form) roller[r.anahtar] = roluBicimle(r.ek.form, g.bicim)
  return {
    surum: g.surum,
    riza: {
      surum: g.surum,
      hukukcuInceledi: false,
      metin: { [g.bicim]: g.riza?.metin ?? enYaz(EN_FORM_RIZASI.metin, g.bicim) },
      veliMetni: { [g.bicim]: g.riza?.veliMetni ?? enYaz(EN_FORM_RIZASI.veliMetni, g.bicim) },
    },
    cekirdek: { bolumler: EN_CEKIRDEK_BOLUMLER.map((b) => bolumuBicimle(b, g.bicim)), inceleme: MAKINE },
    roller,
  }
}
