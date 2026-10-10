/**
 * NOTYA-ULKE-ARAC-01b — TOOLS SWITCHED OFF BY THE OWNER'S ORDER, for whichever pack is active (run once per country
 * folder: scripts/ulke-test.mjs). Names no country, so a country added later is held to it the day its folder exists.
 *
 * Kaan, 2026-10-10: "Switch off the risky tools". The audits of the tools against national sources
 * (docs/araclar-denetim/<CODE>.md, "Second pass", on the branches araclar-denetim/<code>) confirmed a fault or a
 * licence problem in five tools that were switched on that day. They stay off IN EVERY COUNTRY until the fault is
 * corrected in the kit (job NOTYA-ULKE-ARAC-01b) or the rights holder's permission is recorded:
 *
 *   doz-hesabi      the dose calculator: rounds the volume of one dose to 0.1 mL (0.16 mL is shown as 0.2 mL) and
 *                   prints trailing zeros
 *   esi-triyaj      the ESI triage tool: the scale's owner (Emergency Nurses Association) requires written permission
 *   rapor-taslagi   the radiology report outline: it prints the BI-RADS categories, for which the American College of
 *                   Radiology requires a licence agreement in commercial software (the whole tool is off; the
 *                   categories are not edited out)
 *   kdigo-serit     the KDIGO risk grid, and
 *   kdigo-evre      the internal-medicine kidney tool with its referral flags: both show the low-risk (green) cell when
 *                   no urine albumin result was typed; the second mislabels its referral flags
 *
 * This test changes no tool: the kit's arithmetic, words and roles are as they were. It only refuses a pack that
 * switches one of the five on. TO SWITCH ONE BACK ON: correct the fault (or record the permission, and state the
 * licence "izin-alindi" in the pack), then take its key off the list below IN THE SAME CHANGE, with the owner's word.
 *
 * The kit's test country "xx" (lib/ulke/testing/ornekUlke/) is in no build and is not a pack this test is run for.
 *
 * 2026-10-10, later the same day: `doz-hesabi` was TAKEN OFF THE LIST. Its fault was corrected in the kit (pull request
 * #615: the volume is no longer rounded to 0.1 mL, small volumes carry a caution, trailing zeros follow the pack's
 * setting) and Kaan ordered: "Bring on all the tools ... We will test as we go." A pack may switch it on again. The
 * other four stay: two wait for a rights holder, and the kidney grid's licence is unsettled.
 */
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { hesabinAraci } from './paket'
import type { AracYuvasi, UlkeAraclari } from './tipler'
import type { UlkePaketi } from '../tipler'

const EMIR = 'off by Kaan\'s order of 2026-10-10 until NOTYA-ULKE-ARAC-01b is fixed or the licence is granted'

/** key → why it is off. */
const KAPALI: Readonly<Record<string, string>> = {
  'esi-triyaj': 'the Emergency Nurses Association requires written permission for the Emergency Severity Index',
  'rapor-taslagi': 'the report outline prints the BI-RADS categories; the American College of Radiology requires a licence agreement for commercial software',
  'kdigo-serit': 'the KDIGO grid shows "low risk (green cell)" when no urine albumin result was typed',
  'kdigo-evre': 'the kidney tool shows "low risk (green cell)" when no urine albumin result was typed, and mislabels its referral flags',
}
/** The two that wait for a rights holder: a pack that keeps one as a placeholder states its licence as "permission needed". */
const IZIN_BEKLEYEN: readonly string[] = ['esi-triyaj', 'rapor-taslagi']

let paket: UlkePaketi
let a: UlkeAraclari | null = null

before(async () => {
  paket = (await import('@/countries/active')).AKTIF_PAKET
  const arayuz = (await import('@/countries/active/arayuz')).AKTIF_ARAYUZ
  a = paket.ozellikler.araclar && arayuz?.araclar ? arayuz.araclar : null
})

describe('tools switched off by the owner\'s order of 2026-10-10', () => {
  it('NONE OF THE LISTED TOOLS IS SWITCHED ON IN THIS PACK: not on its list, on no role\'s grid, at no address — and the two that wait for a rights holder say "permission needed"', (t) => {
    if (!a) { t.skip('this pack has no tools area'); return }
    const roller: readonly (string | null)[] = [null, ...(paket.uygulama?.roller ?? [])]
    for (const [anahtar, neden] of Object.entries(KAPALI)) {
      const mesaj = `"${anahtar}" is switched on in the country pack "${paket.kod}": ${EMIR} (${neden})`
      assert.ok(!a.araclar.some((p) => p.anahtar === anahtar), mesaj)
      // the gate the grid, the address and the server all ask hands it to no account
      for (const rol of roller) assert.equal(hesabinAraci(a, rol, anahtar), null, mesaj)
    }
    for (const anahtar of IZIN_BEKLEYEN) {
      const yuva: AracYuvasi | undefined = a.yuvalar.find((y) => y.anahtar === anahtar)
      if (!yuva) continue
      assert.equal(yuva.lisans?.durum, 'izin-gerekli', `"${anahtar}" is a placeholder of "${paket.kod}" and its licence is not stated as "izin-gerekli" (permission needed): ${EMIR}`)
      assert.ok(yuva.lisans?.hakSahibi?.trim(), `"${anahtar}" in "${paket.kod}": the licence does not name who holds the rights`)
    }
  })
})
