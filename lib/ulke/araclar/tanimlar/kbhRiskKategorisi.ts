/**
 * NOTYA-ULKE-ARAC-KBH-RISK-01 — chronic kidney disease RISK CATEGORY, built so it needs no permission from KDIGO.
 *
 * `kdigo-evre` (./cerrahiDahiliyeDerm.ts) and `kdigo-serit` (./nefroOnko.ts) are switched off in every country
 * (lib/ulke/araclar/kapaliAraclar.paket.test.ts, Kaan's order of 2026-10-10) because they are named after, and
 * described as, a reproduction of KDIGO's own coloured chart, and KDIGO's guideline is published under a Creative
 * Commons licence that permits neither commercial use nor adaptation of its figures without the rights holder's
 * written permission (docs/araclar-denetim/US.md, "KDIGO grid" row; the licence notice of [KDIGO-FULL] itself).
 * THIS TOOL IS NOT THOSE TWO, RENAMED. It is a fresh tool that classifies the same OPEN CLINICAL FACTS — the
 * guideline's own category boundaries and risk-tier names, read from the guideline's text and tables, never from
 * its chart graphic — in the kit's own words, its own band keys and no colour at all. Neither blocked tool is
 * imported, edited, or switched on by this file.
 *
 * WHAT IS AN OPEN FACT (reproduced here) AND WHAT IS KDIGO'S OWN EXPRESSION (deliberately not reproduced):
 *
 *   open fact       the eGFR category boundaries (G1-G5) and the albuminuria/ACR category boundaries (A1-A3): a
 *                   classification of measured kidney function, not an artistic or creative choice. [KDIGO-FULL]
 *                   Table 2 (p. S137) and Table 3 (p. S137), opened today (2026-10-13), give the numbers reused
 *                   below unchanged — via KDIGO_G/kdigoG and KDIGO_A/kdigoA, already in ./cerrahiDahiliyeDerm.ts
 *                   and already read by `kdigo-serit`, so this tool reads the SAME verified thresholds rather than
 *                   retyping them a third time. The four risk-tier NAMES ("low risk", "moderately increased risk",
 *                   "high risk", "very high risk") are themselves the guideline's own open clinical vocabulary for
 *                   describing risk in words: [KDIGO-FULL] p. S126, the legend of the CGA prognosis figure, read
 *                   today: "Green: low risk (if no other markers of kidney disease, no CKD); Yellow: moderately
 *                   increased risk; Orange: high risk; Red: very high risk." The SAME four words, with the same
 *                   legend sentence, appear in the predecessor guideline, [KDIGO-2012] p. 6, confirming they are
 *                   the guideline's standing clinical vocabulary and not a one-off caption.
 *   open fact       THAT a worse GFR category or a worse albuminuria category never lowers the tier (monotonicity).
 *                   The 2024 chart itself is a graphic ([KDIGO-FULL] p. S126) that this session's tools cannot read
 *                   cell by cell, so this file does not guess its colours from memory. What IS read, as TEXT, from
 *                   [KDIGO-2012] (the predecessor guideline, same category scheme, p. 8 and p. 14, both opened
 *                   today) is a "frequency of monitoring" grid with a NUMBER in every G x A cell (visits per year)
 *                   and a "monitor" / "refer" grid, neither a picture: G1/A1 and G2/A1 "1 if CKD" (lowest); G1/A2,
 *                   G2/A2 and G3a/A1 all "1"; G3a/A2, G3b/A1 and G1/A3, G2/A3 all "2"; G3a/A3 and G3b/A2 both "3";
 *                   G4 "3, 3, 4+" and G5 "4+, 4+, 4+" (always the day's highest, whatever the albuminuria); and
 *                   "refer" for G4-G5 throughout and for A3 from G3a up. That grouping is exactly the kit's own
 *                   `kdigoRisk` arithmetic (./cerrahiDahiliyeDerm.ts; the same four groups, same monotonic order),
 *                   itself held against [KDIGO-FULL] Table 3 in two audit passes that found no fault in it (only in
 *                   the missing-albuminuria default and the referral labels — docs/araclar-denetim/US.md, item 12,
 *                   "SECOND PASS... the code is right"). `kbhRiskTiyeri` below is this file's OWN function, with
 *                   its own band keys, not a call into the blocked tools' code — but it is the same open grouping,
 *                   cross-checked against the monitoring grid rather than typed from memory.
 *   KDIGO's own     the coloured chart itself: its grid shape (a GFR axis crossed with an albuminuria axis drawn as
 *   expression      one figure), its specific colours (green/yellow/orange/red cells) and its layout. NONE OF THAT
 *                   IS HERE. This tool returns one of four plain words (`dusuk`/`orta`/`yuksek`/`cokYuksek` — low,
 *                   moderate, high, very high: ORDINARY ENGLISH-MEANING WORDS, not the chart's colour names, unlike
 *                   `kdigo-evre`/`kdigo-serit`, whose band keys ARE the chart's colours, `yesil`/`sari`/`turuncu`/
 *                   `kirmizi`). No colour is defined anywhere in this file. How a country's screen presents the four
 *                   tiers — plain text, a list, a badge, its own colours if it wants any — is for that country's
 *                   pack and its UI components, same as for every other tool's band; this file bakes in none of it,
 *                   so it cannot reproduce a chart by accident.
 *
 * UNITS (NOTYA-ULKE-OZEL-01, docs/COUNTRY-PACK-HOWTO.md "Numbers with their units", same pattern as the PSA tool):
 * eGFR carries a fixed unit (mL/min/1.73m2, as printed throughout the guideline). The ACR field is a LABORATORY
 * VALUE (`lab: 'albuminKreatinin'`), the kit's existing quantity with both units the guideline prints limits for,
 * mg/g and mg/mmol (lib/ulke/araclar/birimler.ts; the SAME quantity `kdigo-serit` already reads, so no new
 * conversion table is added). A country that switches this tool on but has not stated which unit its laboratories
 * report in fails the pack check at once (lib/ulke/araclar/denetim.ts: "the tool reads this laboratory value and
 * the pack does not say which unit the country reports it in") — the gap is caught before the country ships, not
 * guessed at the bedside. At runtime a value typed with no unit chosen is "not a value" (lib/ulke/araclar/girdi.ts)
 * and the tool answers exactly as it does for a patient with no albuminuria result at all: it shows the GFR
 * category alone and the warning that the ratio is missing (`acr_yok`) — never a silent default.
 *
 * NO RISK TIER WITHOUT BOTH RESULTS, from the start (the fault `kdigo-evre`/`kdigo-serit` needed correcting for —
 * docs/araclar-denetim/DUZELTMELER.md, fault 5 — is not repeated here because this tool never read a missing ratio
 * as category A1): with eGFR alone, `bant` is null and `uyarilar` names the missing ratio; the tier is read only
 * from the two category keys the pack's own words say ("G3a", "A2") — a doctor reading them never sees "low risk"
 * for a patient whose albuminuria was never measured.
 *
 * A NEW, UNIVERSAL, kit tool (NOTYA-ULKE-ARACLAR-01: "classify before you add", .cursor/skills/specialty-doktor-
 * araclari/SKILL.md) — like every kit mechanism, it exists in a country only once BOTH halves name it (../tipler.ts);
 * no pack lists `kbh-risk-kategorisi` yet, so it is off everywhere until a country's own pack switches it on with
 * its roles, its unit and a clinician's sign-off. It is not added to lib/doktor/doktorAraclari.ts (the pre-split,
 * Turkey-only tile registry) and is not switched on for Turkiye or for any other country by this change.
 *
 * SOURCES, each opened on 2026-10-13 (this session):
 *   [KDIGO-FULL] KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney
 *     Disease. Kidney Int. 2024;105(4S):S117-S314 — https://kdigo.org/wp-content/uploads/2024/03/KDIGO-2024-CKD-Guideline.pdf
 *     Table 2 (GFR categories, p. S137), Table 3 (albuminuria categories, p. S137), prognosis figure legend (p. S126).
 *   [KDIGO-2012] KDIGO 2012 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney
 *     Disease. Kidney Int. Suppl. 2013;3(1) — https://kdigo.org/wp-content/uploads/2017/02/KDIGO_2012_CKD_GL.pdf
 *     prognosis colour legend (p. 6), frequency-of-monitoring grid (p. 8), monitor/refer grid (p. 14) — read for the
 *     monotonic grouping only (the category scheme is unchanged in the 2024 guideline).
 */
import type { AracTanimi } from '../tipler'
import { yazilanBirim } from '../girdi'
import { LAB_BIRIMLERI } from '../birimler'
import { BOS_SONUC, sayi, sayiMi } from '../yardimci'
import { KDIGO_A, KDIGO_G, kdigoA, kdigoG } from './cerrahiDahiliyeDerm'

/** This tool's own four risk-tier keys. Plain words, no colour — see the file header for why. */
export const KBH_RISK_TIYERLERI = ['dusuk', 'orta', 'yuksek', 'cokYuksek'] as const
export type KbhRiskTiyeri = (typeof KBH_RISK_TIYERLERI)[number]

/**
 * The composite risk tier of a GFR category and an albuminuria category: this file's own arithmetic on the open
 * category ordering (see the file header for the monitoring-grid cross-check), returning one of THIS file's four
 * words. Not a call into `kdigoRisk` (./cerrahiDahiliyeDerm.ts): that function returns the blocked tools' colour
 * keys and is left untouched, switched off, where it is.
 */
export function kbhRiskTiyeri(g: (typeof KDIGO_G)[number], a: (typeof KDIGO_A)[number]): KbhRiskTiyeri {
  const gi = KDIGO_G.indexOf(g), ai = KDIGO_A.indexOf(a)
  if (gi >= 4) return 'cokYuksek'
  if (gi === 3) return ai === 0 ? 'yuksek' : 'cokYuksek'
  if (gi === 2) return ai === 0 ? 'orta' : ai === 1 ? 'yuksek' : 'cokYuksek'
  return ai === 0 ? 'dusuk' : ai === 1 ? 'orta' : 'yuksek'
}

/**
 * The tool itself: eGFR (always mL/min/1.73m2) and an optional ACR, in the unit the country's pack states for it.
 * `tur: 'hesap'`; no field is a published scale's wording, so the whole result is the kit's own sentence-free
 * numbers and keys, same as every other tool here.
 */
export const KBH_RISK_KATEGORISI: AracTanimi = {
  anahtar: 'kbh-risk-kategorisi',
  tur: 'hesap',
  alanlar: [sayi('egfr', 1, 200, { birim: 'mL/min/1.73m2' }), sayi('acr', 0, 10000, { lab: 'albuminKreatinin', istege: true })],
  cikti: { sayilar: [], bantlar: [...KBH_RISK_TIYERLERI], uyarilar: [...KDIGO_G, ...KDIGO_A, 'acr_yok'], tarihler: [] },
  kaynak: 'KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease. Kidney Int. 2024;105(4S):S117-S314, Table 2 (GFR categories) and Table 3 (albuminuria categories), both p. S137; the risk-tier names are the guideline\'s own words (p. S126). This tool\'s presentation (plain words, no colour, no chart) is the kit\'s own, not a reproduction of the guideline\'s figure.',
  hesapla: (g) => {
    if (!sayiMi(g.egfr)) return BOS_SONUC
    const gk = kdigoG(g.egfr)
    // NO TIER WITHOUT THE RATIO: the GFR category alone, and the warning that says what is missing.
    if (!sayiMi(g.acr)) return { tamam: true, sayilar: [], bant: null, uyarilar: [gk, 'acr_yok'], tarihler: [] }
    const birim = yazilanBirim(g, 'acr', LAB_BIRIMLERI.albuminKreatinin.kanonik)
    const ak = kdigoA(g.acr, birim)
    // a unit the guideline prints no limits for (should not reach here: the pack check requires one of the two)
    if (ak === null) return BOS_SONUC
    return { tamam: true, sayilar: [], bant: kbhRiskTiyeri(gk, ak), uyarilar: [gk, ak], tarihler: [] }
  },
}
