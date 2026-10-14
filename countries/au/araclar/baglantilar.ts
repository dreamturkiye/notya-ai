/**
 * NOTYA-ARACLAR-DENETIM-02-AU, 2026-10-13 — Australia: LINK-OUT TILES (`tur: 'baglanti'`). No field, no arithmetic,
 * nothing of a patient in the address, nothing kept (lib/ulke/araclar/tipler.ts, `AracTuru`). Each opens one
 * official page in a new tab; the mechanism is the kit's own (`lib/ulke/araclar/paket.ts` builds it from
 * `PaketAraci.baglanti` alone, so no entry in ./tanimlar.ts is needed). Listed, with every other key only this
 * country has, in countries/yasak-araclar.json.
 *
 *   au-growth-chart-reference   answers the founder's question #3: which growth-chart reference Australian
 *                                paediatric practice actually uses. It is not a calculator — no LMS percentile
 *                                data of WHO's, the paediatric endocrine society's or the CDC's was read or copied
 *                                into this product in this session — it names which chart applies by age and
 *                                opens the page a clinician reads the charts from.
 *
 * MACHINE-WRITTEN, UNREAD BY A CLINICIAN OF AUSTRALIA: on the worklist of the local clinical lead
 * (./onaysizAciklar.ts), the same as the other tools only this country has.
 *
 * NOTE (NOTYA-ARACLAR-DENETIM-03-AU, 2026-10-14): a My Health Record link-out tile (au-my-health-record) was built
 * here and then REMOVED on reconsideration, after confirming it answers question #4 — My Health Record is indeed
 * Australia's name for the e-Nabız equivalent — but a government link-out reference is not the kind of thing that
 * belongs in a core, every-role workflow tool set just because Türkiye's e-Nabız tile does. See the audit report for
 * the reasoning; the research finding stands, the tool does not.
 */
import type { PaketAraci } from '@/lib/ulke/araclar/tipler'

const D = 'en-AU'
const m = (metin: string) => ({ [D]: metin })

/**
 * WHICH GROWTH CHART APPLIES, BY AGE: read 2026-10-13 — Australian and New Zealand Society for Paediatric
 * Endocrinology and Diabetes (ANZSPED), "Growth / Growth Charts",
 * https://anzsped.org/clinical-resources-links/growth-growth-charts/: "Infants and children less than 2 years of
 * age – use the WHO growth standards"; for 2 to 18 years the page lists both ANZSPED's own endorsed charts for
 * Australia and New Zealand (boys and girls, last updated October 2025) and, separately, the CDC 2000 charts for 2
 * to 20 years, without stating which of the two takes precedence. The RACGP's preventive-care guideline (the
 * audit's earlier reading, docs/araclar-denetim/AU.md) allows CDC or WHO body-mass-index charts, consistent with
 * there being a genuine choice rather than one single national chart. THIS TOOL DOES NOT PLOT A PERCENTILE: no
 * chart's underlying data (WHO's, ANZSPED's or the CDC's LMS parameters) was read or copied into this product in
 * this session — Kidney Health Australia's and the Australasian Sports Commission's chart and table copyrights
 * (read by the earlier audit) are the reason such data is never ported by a machine. A clinician plots the
 * measurement on whichever chart their own practice has agreed to use.
 */
export const AU_GROWTH_CHART_REFERENCE: PaketAraci = {
  anahtar: 'au-growth-chart-reference',
  roller: null,
  hasta: { enCokYas: 18 },
  metin: {
    ad: m('Which growth chart to use'),
    aciklama: m('Under 2 years: use the WHO growth standards. From 2 to 18 years: ANZSPED, the region’s paediatric endocrinology and diabetes society, endorses its own charts for the region and separately lists the CDC 2000 charts; it does not say which of the two takes precedence — use whichever your practice has agreed to. This tile opens ANZSPED’s own page, where both sets of charts are linked.'),
    alanlar: {},
    hastaKapisi: m('For a patient under 18. This names which chart to use; it does not plot one.'),
    not: m('A reference, not a calculator: no percentile is worked out here. Read the measurement against the chart your practice uses.'),
    baglanti: m('Open ANZSPED’s growth charts page'),
  },
  baglanti: { adres: 'https://anzsped.org/clinical-resources-links/growth-growth-charts/' },
  lisans: { durum: 'serbest', kaynak: 'https://anzsped.org/clinical-resources-links/growth-growth-charts/ (read 2026-10-13): ANZSPED’s own page; a link-out tile reproduces none of its charts or data.' },
}
